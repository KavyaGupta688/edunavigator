const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  exams_registered: {
    type: Number,
    default: 0,
    min: [0, 'Exams registered cannot be negative']
  },
  hackathons_applied: {
    type: Number,
    default: 0,
    min: [0, 'Hackathons applied cannot be negative']
  },
  internships_applied: {
    type: Number,
    default: 0,
    min: [0, 'Internships applied cannot be negative']
  },
  badges: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    earned_at: {
      type: Date,
      default: Date.now
    },
    category: {
      type: String,
      enum: ['achievement', 'participation', 'milestone', 'special'],
      default: 'achievement'
    },
    icon: String,
    rarity: {
      type: String,
      enum: ['common', 'rare', 'epic', 'legendary'],
      default: 'common'
    }
  }],
  points: {
    type: Number,
    default: 0,
    min: [0, 'Points cannot be negative']
  },
  level: {
    type: Number,
    default: 1,
    min: [1, 'Level must be at least 1']
  },
  streak_days: {
    type: Number,
    default: 0,
    min: [0, 'Streak days cannot be negative']
  },
  last_activity: {
    type: Date,
    default: Date.now
  },
  achievements: [{
    title: String,
    description: String,
    earned_at: {
      type: Date,
      default: Date.now
    },
    points_awarded: Number
  }],
  statistics: {
    total_applications: {
      type: Number,
      default: 0
    },
    successful_applications: {
      type: Number,
      default: 0
    },
    total_time_spent: {
      type: Number,
      default: 0 // in minutes
    },
    favorite_categories: [String],
    most_active_month: String,
    improvement_areas: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
progressSchema.index({ user_id: 1 });
progressSchema.index({ points: -1 });
progressSchema.index({ level: -1 });
progressSchema.index({ 'badges.name': 1 });
progressSchema.index({ last_activity: -1 });

// Virtual for success rate
progressSchema.virtual('success_rate').get(function() {
  if (this.statistics.total_applications === 0) return 0;
  return (this.statistics.successful_applications / this.statistics.total_applications) * 100;
});

// Virtual for next level points required
progressSchema.virtual('points_to_next_level').get(function() {
  const pointsPerLevel = 100;
  const currentLevelPoints = this.level * pointsPerLevel;
  return currentLevelPoints - this.points;
});

// Virtual for progress percentage to next level
progressSchema.virtual('level_progress_percentage').get(function() {
  const pointsPerLevel = 100;
  const currentLevelPoints = (this.level - 1) * pointsPerLevel;
  const nextLevelPoints = this.level * pointsPerLevel;
  const progressInLevel = this.points - currentLevelPoints;
  return (progressInLevel / pointsPerLevel) * 100;
});

// Virtual for total activities
progressSchema.virtual('total_activities').get(function() {
  return this.exams_registered + this.hackathons_applied + this.internships_applied;
});

// Static method to update progress
progressSchema.statics.updateProgress = function(userId, activityType, increment = 1) {
  const updateFields = {};
  updateFields[`${activityType}`] = increment;
  updateFields.last_activity = new Date();
  updateFields.points = increment * 10; // 10 points per activity
  
  return this.findOneAndUpdate(
    { user_id: userId },
    { 
      $inc: updateFields,
      $set: { last_activity: new Date() }
    },
    { new: true, upsert: true }
  );
};

// Static method to add badge
progressSchema.statics.addBadge = function(userId, badgeData) {
  return this.findOneAndUpdate(
    { user_id: userId },
    { 
      $push: { badges: badgeData },
      $inc: { points: badgeData.points_awarded || 0 }
    },
    { new: true, upsert: true }
  );
};

// Static method to get leaderboard
progressSchema.statics.getLeaderboard = function(limit = 10) {
  return this.find()
    .sort({ points: -1, level: -1 })
    .limit(limit)
    .populate('user_id', 'name email role')
    .select('user_id points level badges total_activities');
};

// Static method to check and award badges
progressSchema.statics.checkBadges = function(userId) {
  return this.findOne({ user_id: userId }).then(progress => {
    if (!progress) return null;
    
    const newBadges = [];
    
    // Check for various badge conditions
    if (progress.exams_registered >= 5 && !progress.badges.find(b => b.name === 'Exam Warrior')) {
      newBadges.push({
        name: 'Exam Warrior',
        description: 'Registered for 5+ exams',
        category: 'achievement',
        rarity: 'rare',
        points_awarded: 50
      });
    }
    
    if (progress.hackathons_applied >= 3 && !progress.badges.find(b => b.name === 'Hackathon Hunter')) {
      newBadges.push({
        name: 'Hackathon Hunter',
        description: 'Applied for 3+ hackathons',
        category: 'achievement',
        rarity: 'rare',
        points_awarded: 50
      });
    }
    
    if (progress.points >= 1000 && !progress.badges.find(b => b.name === 'Point Master')) {
      newBadges.push({
        name: 'Point Master',
        description: 'Earned 1000+ points',
        category: 'milestone',
        rarity: 'epic',
        points_awarded: 100
      });
    }
    
    if (progress.streak_days >= 30 && !progress.badges.find(b => b.name === 'Streak Master')) {
      newBadges.push({
        name: 'Streak Master',
        description: '30+ day activity streak',
        category: 'achievement',
        rarity: 'legendary',
        points_awarded: 200
      });
    }
    
    // Add new badges if any
    if (newBadges.length > 0) {
      return this.findOneAndUpdate(
        { user_id: userId },
        { 
          $push: { badges: { $each: newBadges } },
          $inc: { points: newBadges.reduce((sum, badge) => sum + (badge.points_awarded || 0), 0) }
        },
        { new: true }
      );
    }
    
    return progress;
  });
};

// Pre-save middleware to update level based on points
progressSchema.pre('save', function(next) {
  const pointsPerLevel = 100;
  const newLevel = Math.floor(this.points / pointsPerLevel) + 1;
  
  if (newLevel > this.level) {
    this.level = newLevel;
  }
  
  next();
});

module.exports = mongoose.model('Progress', progressSchema);