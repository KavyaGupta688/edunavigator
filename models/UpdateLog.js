const mongoose = require('mongoose');

const updateLogSchema = new mongoose.Schema({
  entity: {
    type: String,
    required: [true, 'Entity type is required'],
    enum: {
      values: ['exam_deadline', 'opportunity', 'user_profile', 'team', 'system'],
      message: 'Entity must be exam_deadline, opportunity, user_profile, team, or system'
    }
  },
  entity_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Entity ID is required']
  },
  field_changed: {
    type: String,
    required: [true, 'Field changed is required'],
    trim: true
  },
  old_value: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Old value is required']
  },
  new_value: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'New value is required']
  },
  change_type: {
    type: String,
    enum: {
      values: ['create', 'update', 'delete', 'status_change'],
      message: 'Change type must be create, update, delete, or status_change'
    },
    default: 'update'
  },
  change_reason: {
    type: String,
    trim: true,
    maxlength: [500, 'Change reason cannot exceed 500 characters']
  },
  change_date: {
    type: Date,
    default: Date.now
  },
  triggered_notification: {
    type: Boolean,
    default: false
  },
  notification_sent_at: {
    type: Date,
    default: null
  },
  affected_users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  source: {
    type: String,
    required: [true, 'Source is required'],
    enum: {
      values: ['scraper', 'admin', 'user', 'system', 'api'],
      message: 'Source must be scraper, admin, user, system, or api'
    }
  },
  severity: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'critical'],
      message: 'Severity must be low, medium, high, or critical'
    },
    default: 'medium'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  is_processed: {
    type: Boolean,
    default: false
  },
  processed_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
updateLogSchema.index({ entity: 1, entity_id: 1 });
updateLogSchema.index({ change_date: -1 });
updateLogSchema.index({ triggered_notification: 1 });
updateLogSchema.index({ source: 1 });
updateLogSchema.index({ severity: 1 });
updateLogSchema.index({ is_processed: 1 });
updateLogSchema.index({ affected_users: 1 });

// Virtual for change impact
updateLogSchema.virtual('change_impact').get(function() {
  if (this.severity === 'critical') return 'high';
  if (this.severity === 'high') return 'medium';
  if (this.severity === 'medium') return 'low';
  return 'minimal';
});

// Virtual for time since change
updateLogSchema.virtual('time_since_change').get(function() {
  const now = new Date();
  const diffTime = now - this.change_date;
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
});

// Static method to log update
updateLogSchema.statics.logUpdate = function(data) {
  return this.create({
    entity: data.entity,
    entity_id: data.entity_id,
    field_changed: data.field_changed,
    old_value: data.old_value,
    new_value: data.new_value,
    change_type: data.change_type || 'update',
    change_reason: data.change_reason,
    source: data.source,
    severity: data.severity || 'medium',
    affected_users: data.affected_users || [],
    metadata: data.metadata || {}
  });
};

// Static method to get recent updates
updateLogSchema.statics.getRecentUpdates = function(entity = null, limit = 50) {
  const query = {};
  if (entity) {
    query.entity = entity;
  }
  
  return this.find(query)
    .sort({ change_date: -1 })
    .limit(limit)
    .populate('affected_users', 'name email');
};

// Static method to get updates for entity
updateLogSchema.statics.getEntityUpdates = function(entity, entityId, limit = 20) {
  return this.find({
    entity: entity,
    entity_id: entityId
  })
    .sort({ change_date: -1 })
    .limit(limit)
    .populate('affected_users', 'name email');
};

// Static method to get unprocessed updates
updateLogSchema.statics.getUnprocessedUpdates = function(limit = 100) {
  return this.find({
    is_processed: false,
    triggered_notification: true
  })
    .sort({ change_date: 1 })
    .limit(limit);
};

// Static method to mark as processed
updateLogSchema.statics.markAsProcessed = function(updateId) {
  return this.findByIdAndUpdate(
    updateId,
    {
      is_processed: true,
      processed_at: new Date()
    },
    { new: true }
  );
};

// Static method to get critical updates
updateLogSchema.statics.getCriticalUpdates = function(hours = 24) {
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - hours);
  
  return this.find({
    severity: 'critical',
    change_date: { $gte: cutoffDate }
  })
    .sort({ change_date: -1 })
    .populate('affected_users', 'name email');
};

// Static method to get update statistics
updateLogSchema.statics.getUpdateStats = function(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.aggregate([
    { $match: { change_date: { $gte: cutoffDate } } },
    {
      $group: {
        _id: {
          entity: '$entity',
          severity: '$severity'
        },
        count: { $sum: 1 },
        notifications_sent: { $sum: { $cond: ['$triggered_notification', 1, 0] } }
      }
    },
    {
      $group: {
        _id: '$_id.entity',
        total_updates: { $sum: '$count' },
        notifications_sent: { $sum: '$notifications_sent' },
        severity_breakdown: {
          $push: {
            severity: '$_id.severity',
            count: '$count'
          }
        }
      }
    }
  ]);
};

// Static method to get user-specific updates
updateLogSchema.statics.getUserUpdates = function(userId, limit = 20) {
  return this.find({
    affected_users: userId
  })
    .sort({ change_date: -1 })
    .limit(limit)
    .populate('affected_users', 'name email');
};

// Pre-save middleware to determine severity based on field and values
updateLogSchema.pre('save', function(next) {
  // Auto-determine severity for certain fields
  if (this.field_changed === 'deadline' || this.field_changed === 'registration_end') {
    this.severity = 'high';
  } else if (this.field_changed === 'status' && this.new_value === 'closed') {
    this.severity = 'critical';
  } else if (this.field_changed === 'price' || this.field_changed === 'fee') {
    this.severity = 'medium';
  }
  
  // Auto-trigger notifications for high/critical severity
  if (this.severity === 'high' || this.severity === 'critical') {
    this.triggered_notification = true;
  }
  
  next();
});

module.exports = mongoose.model('UpdateLog', updateLogSchema);