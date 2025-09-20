const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  opp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity',
    required: [true, 'Opportunity ID is required']
  },
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    maxlength: [100, 'Team name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator ID is required']
  },
  max_members: {
    type: Number,
    default: 4,
    min: [2, 'Team must have at least 2 members'],
    max: [10, 'Team cannot have more than 10 members']
  },
  skills_needed: [{
    type: String,
    trim: true
  }],
  requirements: [String],
  status: {
    type: String,
    enum: {
      values: ['recruiting', 'full', 'closed', 'disbanded'],
      message: 'Status must be recruiting, full, closed, or disbanded'
    },
    default: 'recruiting'
  },
  is_public: {
    type: Boolean,
    default: true
  },
  tags: [String],
  contact_info: {
    email: String,
    phone: String,
    discord: String,
    slack: String
  },
  meeting_schedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi-weekly', 'as_needed'],
      default: 'weekly'
    },
    preferred_time: String,
    timezone: {
      type: String,
      default: 'IST'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
teamSchema.index({ opp_id: 1 });
teamSchema.index({ created_by: 1 });
teamSchema.index({ status: 1 });
teamSchema.index({ is_public: 1 });
teamSchema.index({ skills_needed: 1 });
teamSchema.index({ tags: 1 });
teamSchema.index({ created_at: -1 });

// Virtual for current member count
teamSchema.virtual('current_members', {
  ref: 'TeamMember',
  localField: '_id',
  foreignField: 'team_id',
  count: true
});

// Virtual for available spots
teamSchema.virtual('available_spots').get(function() {
  return this.max_members - (this.current_members || 0);
});

// Virtual for team activity level
teamSchema.virtual('activity_level').get(function() {
  const daysSinceCreation = Math.floor((new Date() - this.created_at) / (1000 * 60 * 60 * 24));
  if (daysSinceCreation <= 1) return 'new';
  if (daysSinceCreation <= 7) return 'active';
  if (daysSinceCreation <= 30) return 'established';
  return 'mature';
});

// Static method to find teams by opportunity
teamSchema.statics.findByOpportunity = function(oppId) {
  return this.find({ 
    opp_id: oppId, 
    status: { $in: ['recruiting', 'full'] },
    is_public: true 
  }).populate('created_by', 'name email');
};

// Static method to find teams by skills
teamSchema.statics.findBySkills = function(skills) {
  return this.find({
    skills_needed: { $in: skills },
    status: 'recruiting',
    is_public: true
  }).populate('opp_id', 'title type deadline').populate('created_by', 'name email');
};

// Static method to find teams created by user
teamSchema.statics.findByCreator = function(userId) {
  return this.find({ created_by: userId })
    .populate('opp_id', 'title type deadline')
    .sort({ created_at: -1 });
};

// Static method to find available teams for user
teamSchema.statics.findAvailableForUser = function(userId, skills = []) {
  const query = {
    status: 'recruiting',
    is_public: true,
    created_by: { $ne: userId } // Exclude teams created by the user
  };
  
  if (skills.length > 0) {
    query.skills_needed = { $in: skills };
  }
  
  return this.find(query)
    .populate('opp_id', 'title type deadline')
    .populate('created_by', 'name email')
    .sort({ created_at: -1 });
};

// Static method to update team status
teamSchema.statics.updateStatus = function(teamId, newStatus) {
  return this.findByIdAndUpdate(
    teamId,
    { status: newStatus },
    { new: true }
  );
};

// Pre-save middleware to validate team name uniqueness for opportunity
teamSchema.pre('save', async function(next) {
  if (this.isModified('name') || this.isNew) {
    const existingTeam = await this.constructor.findOne({
      name: this.name,
      opp_id: this.opp_id,
      _id: { $ne: this._id }
    });
    
    if (existingTeam) {
      return next(new Error('Team name already exists for this opportunity'));
    }
  }
  next();
});

module.exports = mongoose.model('Team', teamSchema);