const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  entity_type: {
    type: String,
    required: [true, 'Entity type is required'],
    enum: {
      values: ['exam', 'opportunity'],
      message: 'Entity type must be either exam or opportunity'
    }
  },
  entity_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Entity ID is required'],
    refPath: 'entity_type_ref'
  },
  entity_type_ref: {
    type: String,
    required: true,
    enum: ['Exam', 'Opportunity']
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: [0, 'Score cannot be negative'],
    max: [1, 'Score cannot exceed 1']
  },
  algorithm_used: {
    type: String,
    required: [true, 'Algorithm used is required'],
    enum: {
      values: ['collaborative_filtering', 'content_based', 'hybrid', 'rule_based'],
      message: 'Algorithm must be collaborative_filtering, content_based, hybrid, or rule_based'
    }
  },
  recommendation_reasons: [{
    reason: String,
    weight: Number
  }],
  user_interaction: {
    viewed: {
      type: Boolean,
      default: false
    },
    saved: {
      type: Boolean,
      default: false
    },
    applied: {
      type: Boolean,
      default: false
    },
    viewed_at: Date,
    saved_at: Date,
    applied_at: Date
  },
  expires_at: {
    type: Date,
    default: function() {
      // Recommendations expire after 30 days
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      return expiryDate;
    }
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
recommendationSchema.index({ user_id: 1, entity_type: 1 });
recommendationSchema.index({ user_id: 1, score: -1 });
recommendationSchema.index({ entity_id: 1, entity_type: 1 });
recommendationSchema.index({ algorithm_used: 1 });
recommendationSchema.index({ expires_at: 1 });
recommendationSchema.index({ is_active: 1 });
recommendationSchema.index({ created_at: -1 });

// Virtual for recommendation age in days
recommendationSchema.virtual('age_days').get(function() {
  const now = new Date();
  const diffTime = now - this.created_at;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for recommendation freshness
recommendationSchema.virtual('freshness').get(function() {
  const age = this.age_days;
  if (age <= 1) return 'fresh';
  if (age <= 7) return 'recent';
  if (age <= 30) return 'stale';
  return 'expired';
});

// Static method to find recommendations for user
recommendationSchema.statics.findForUser = function(userId, entityType = null, limit = 20) {
  const query = {
    user_id: userId,
    is_active: true,
    expires_at: { $gt: new Date() }
  };
  
  if (entityType) {
    query.entity_type = entityType;
  }
  
  return this.find(query)
    .sort({ score: -1, created_at: -1 })
    .limit(limit)
    .populate('entity_id');
};

// Static method to find top recommendations
recommendationSchema.statics.findTopRecommendations = function(userId, limit = 10) {
  return this.find({
    user_id: userId,
    is_active: true,
    expires_at: { $gt: new Date() },
    'user_interaction.viewed': false
  })
    .sort({ score: -1 })
    .limit(limit)
    .populate('entity_id');
};

// Static method to update user interaction
recommendationSchema.statics.updateInteraction = function(recommendationId, interactionType) {
  const updateData = {};
  updateData[`user_interaction.${interactionType}`] = true;
  updateData[`user_interaction.${interactionType}_at`] = new Date();
  
  return this.findByIdAndUpdate(
    recommendationId,
    { $set: updateData },
    { new: true }
  );
};

// Static method to get recommendation analytics
recommendationSchema.statics.getAnalytics = function(userId) {
  return this.aggregate([
    { $match: { user_id: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$entity_type',
        total: { $sum: 1 },
        viewed: { $sum: { $cond: ['$user_interaction.viewed', 1, 0] } },
        saved: { $sum: { $cond: ['$user_interaction.saved', 1, 0] } },
        applied: { $sum: { $cond: ['$user_interaction.applied', 1, 0] } },
        avg_score: { $avg: '$score' }
      }
    }
  ]);
};

// Pre-save middleware to set entity_type_ref
recommendationSchema.pre('save', function(next) {
  if (this.entity_type === 'exam') {
    this.entity_type_ref = 'Exam';
  } else if (this.entity_type === 'opportunity') {
    this.entity_type_ref = 'Opportunity';
  }
  next();
});

module.exports = mongoose.model('Recommendation', recommendationSchema);