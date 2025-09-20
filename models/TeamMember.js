const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  team_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: [true, 'Team ID is required']
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['leader', 'member'],
      message: 'Role must be either leader or member'
    },
    default: 'member'
  },
  skills: [{
    type: String,
    trim: true
  }],
  contribution: {
    type: String,
    trim: true,
    maxlength: [500, 'Contribution description cannot exceed 500 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'active', 'inactive', 'removed'],
      message: 'Status must be pending, active, inactive, or removed'
    },
    default: 'pending'
  },
  joined_at: {
    type: Date,
    default: Date.now
  },
  left_at: {
    type: Date,
    default: null
  },
  invitation_sent_at: {
    type: Date,
    default: null
  },
  invitation_accepted_at: {
    type: Date,
    default: null
  },
  performance_rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    default: null
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: [1000, 'Feedback cannot exceed 1000 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure unique user-team combination
teamMemberSchema.index({ team_id: 1, user_id: 1 }, { unique: true });

// Additional indexes for better performance
teamMemberSchema.index({ team_id: 1 });
teamMemberSchema.index({ user_id: 1 });
teamMemberSchema.index({ role: 1 });
teamMemberSchema.index({ status: 1 });
teamMemberSchema.index({ joined_at: -1 });

// Virtual for membership duration in days
teamMemberSchema.virtual('membership_duration').get(function() {
  const endDate = this.left_at || new Date();
  const diffTime = endDate - this.joined_at;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for invitation status
teamMemberSchema.virtual('invitation_status').get(function() {
  if (this.status === 'pending' && this.invitation_sent_at && !this.invitation_accepted_at) {
    return 'pending_acceptance';
  }
  if (this.status === 'active' && this.invitation_accepted_at) {
    return 'accepted';
  }
  if (this.status === 'removed') {
    return 'removed';
  }
  return this.status;
});

// Static method to add member to team
teamMemberSchema.statics.addMember = function(teamId, userId, role = 'member', skills = []) {
  return this.create({
    team_id: teamId,
    user_id: userId,
    role: role,
    skills: skills,
    status: 'active',
    joined_at: new Date(),
    invitation_accepted_at: new Date()
  });
};

// Static method to invite member to team
teamMemberSchema.statics.inviteMember = function(teamId, userId, skills = []) {
  return this.create({
    team_id: teamId,
    user_id: userId,
    role: 'member',
    skills: skills,
    status: 'pending',
    invitation_sent_at: new Date()
  });
};

// Static method to accept invitation
teamMemberSchema.statics.acceptInvitation = function(teamId, userId) {
  return this.findOneAndUpdate(
    { team_id: teamId, user_id: userId, status: 'pending' },
    { 
      status: 'active',
      invitation_accepted_at: new Date(),
      joined_at: new Date()
    },
    { new: true }
  );
};

// Static method to remove member from team
teamMemberSchema.statics.removeMember = function(teamId, userId) {
  return this.findOneAndUpdate(
    { team_id: teamId, user_id: userId },
    { 
      status: 'removed',
      left_at: new Date()
    },
    { new: true }
  );
};

// Static method to get team members
teamMemberSchema.statics.getTeamMembers = function(teamId) {
  return this.find({ 
    team_id: teamId, 
    status: { $in: ['active', 'pending'] } 
  })
    .populate('user_id', 'name email role preferences.interests')
    .sort({ role: 1, joined_at: 1 });
};

// Static method to get user's teams
teamMemberSchema.statics.getUserTeams = function(userId) {
  return this.find({ 
    user_id: userId, 
    status: { $in: ['active', 'pending'] } 
  })
    .populate('team_id', 'name opp_id status created_at')
    .populate({
      path: 'team_id',
      populate: {
        path: 'opp_id',
        select: 'title type deadline'
      }
    })
    .sort({ joined_at: -1 });
};

// Static method to check if user is team leader
teamMemberSchema.statics.isTeamLeader = function(teamId, userId) {
  return this.findOne({
    team_id: teamId,
    user_id: userId,
    role: 'leader',
    status: 'active'
  });
};

// Static method to transfer leadership
teamMemberSchema.statics.transferLeadership = function(teamId, fromUserId, toUserId) {
  return this.findOneAndUpdate(
    { team_id: teamId, user_id: fromUserId, role: 'leader' },
    { role: 'member' }
  ).then(() => {
    return this.findOneAndUpdate(
      { team_id: teamId, user_id: toUserId },
      { role: 'leader' },
      { new: true }
    );
  });
};

// Static method to get team statistics
teamMemberSchema.statics.getTeamStats = function(teamId) {
  return this.aggregate([
    { $match: { team_id: mongoose.Types.ObjectId(teamId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avg_rating: { $avg: '$performance_rating' }
      }
    }
  ]);
};

// Pre-save middleware to validate team capacity
teamMemberSchema.pre('save', async function(next) {
  if (this.isNew && this.status === 'active') {
    const Team = mongoose.model('Team');
    const team = await Team.findById(this.team_id);
    
    if (team) {
      const currentMembers = await this.constructor.countDocuments({
        team_id: this.team_id,
        status: 'active'
      });
      
      if (currentMembers >= team.max_members) {
        return next(new Error('Team is at maximum capacity'));
      }
    }
  }
  next();
});

module.exports = mongoose.model('TeamMember', teamMemberSchema);