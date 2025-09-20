const mongoose = require('mongoose');

const examDeadlineSchema = new mongoose.Schema({
  exam_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: [true, 'Exam ID is required']
  },
  event: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true
  },
  old_date: {
    type: Date,
    required: [true, 'Old date is required']
  },
  new_date: {
    type: Date,
    required: [true, 'New date is required']
  },
  source: {
    type: String,
    required: [true, 'Source is required'],
    trim: true,
    enum: {
      values: ['official_site', 'notification', 'admin_update', 'scraper'],
      message: 'Source must be official_site, notification, admin_update, or scraper'
    }
  },
  last_checked: {
    type: Date,
    default: Date.now
  },
  verified: {
    type: Boolean,
    default: false
  },
  change_reason: {
    type: String,
    trim: true
  },
  impact_level: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
examDeadlineSchema.index({ exam_id: 1 });
examDeadlineSchema.index({ new_date: 1 });
examDeadlineSchema.index({ last_checked: 1 });
examDeadlineSchema.index({ verified: 1 });
examDeadlineSchema.index({ impact_level: 1 });

// Virtual for days until deadline
examDeadlineSchema.virtual('days_until_deadline').get(function() {
  const now = new Date();
  const diffTime = this.new_date - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for urgency level
examDeadlineSchema.virtual('urgency_level').get(function() {
  const days = this.days_until_deadline;
  if (days < 0) return 'overdue';
  if (days <= 7) return 'urgent';
  if (days <= 30) return 'soon';
  return 'normal';
});

// Static method to find recent deadline changes
examDeadlineSchema.statics.findRecentChanges = function(days = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    createdAt: { $gte: cutoffDate }
  }).populate('exam_id', 'exam_name year authority');
};

// Static method to find urgent deadlines
examDeadlineSchema.statics.findUrgentDeadlines = function() {
  const now = new Date();
  const urgentDate = new Date();
  urgentDate.setDate(urgentDate.getDate() + 7);
  
  return this.find({
    new_date: { $gte: now, $lte: urgentDate },
    verified: true
  }).populate('exam_id', 'exam_name year authority website');
};

// Pre-save middleware to validate dates
examDeadlineSchema.pre('save', function(next) {
  if (this.new_date <= this.old_date) {
    return next(new Error('New date must be different from old date'));
  }
  next();
});

module.exports = mongoose.model('ExamDeadline', examDeadlineSchema);