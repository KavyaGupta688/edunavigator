const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  type: {
    type: String,
    required: [true, 'Opportunity type is required'],
    enum: {
      values: ['hackathon', 'internship'],
      message: 'Type must be either hackathon or internship'
    }
  },
  // Hackathon specific fields
  organizer: {
    type: String,
    required: function() {
      return this.type === 'hackathon';
    },
    trim: true
  },
  domain: [{
    type: String,
    required: function() {
      return this.type === 'hackathon';
    },
    trim: true
  }],
  mode: {
    type: String,
    required: [true, 'Mode is required'],
    enum: {
      values: ['Online', 'Offline', 'Hybrid'],
      message: 'Mode must be Online, Offline, or Hybrid'
    }
  },
  website: {
    type: String,
    required: [true, 'Website is required'],
    trim: true,
    match: [/^https?:\/\/.+/, 'Please enter a valid URL']
  },
  prize: {
    type: Number,
    required: function() {
      return this.type === 'hackathon';
    },
    min: [0, 'Prize cannot be negative']
  },
  team_size: {
    type: String,
    required: function() {
      return this.type === 'hackathon';
    },
    trim: true
  },
  start_date: {
    type: Date,
    required: function() {
      return this.type === 'hackathon';
    }
  },
  end_date: {
    type: Date,
    required: function() {
      return this.type === 'hackathon';
    }
  },
  // Internship specific fields
  company: {
    type: String,
    required: function() {
      return this.type === 'internship';
    },
    trim: true
  },
  role: {
    type: String,
    required: function() {
      return this.type === 'internship';
    },
    trim: true
  },
  degree_required: [{
    type: String,
    required: function() {
      return this.type === 'internship';
    },
    trim: true
  }],
  year_of_study: [{
    type: Number,
    required: function() {
      return this.type === 'internship';
    },
    min: [1, 'Year of study must be at least 1'],
    max: [10, 'Year of study cannot exceed 10']
  }],
  location: {
    type: String,
    required: function() {
      return this.type === 'internship';
    },
    trim: true
  },
  stipend: {
    type: Number,
    required: function() {
      return this.type === 'internship';
    },
    min: [0, 'Stipend cannot be negative']
  },
  duration: {
    type: String,
    required: function() {
      return this.type === 'internship';
    },
    trim: true
  },
  apply_link: {
    type: String,
    required: function() {
      return this.type === 'internship';
    },
    trim: true,
    match: [/^https?:\/\/.+/, 'Please enter a valid URL']
  },
  // Common fields
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  skills_required: [{
    type: String,
    trim: true
  }],
  eligibility_criteria: [String],
  benefits: [String],
  application_process: [String],
  last_updated: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    required: [true, 'Source is required'],
    enum: {
      values: ['scraper', 'admin', 'api'],
      message: 'Source must be scraper, admin, or api'
    }
  },
  is_active: {
    type: Boolean,
    default: true
  },
  tags: [String], // For better search and filtering
  difficulty_level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Intermediate'
  },
  application_count: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
opportunitySchema.index({ type: 1 });
opportunitySchema.index({ deadline: 1 });
opportunitySchema.index({ domain: 1 });
opportunitySchema.index({ skills_required: 1 });
opportunitySchema.index({ tags: 1 });
opportunitySchema.index({ is_active: 1 });
opportunitySchema.index({ company: 1 });
opportunitySchema.index({ organizer: 1 });
opportunitySchema.index({ 'degree_required': 1 });
opportunitySchema.index({ 'year_of_study': 1 });

// Virtual for days until deadline
opportunitySchema.virtual('days_until_deadline').get(function() {
  const now = new Date();
  const diffTime = this.deadline - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for urgency level
opportunitySchema.virtual('urgency_level').get(function() {
  const days = this.days_until_deadline;
  if (days < 0) return 'overdue';
  if (days <= 3) return 'urgent';
  if (days <= 7) return 'soon';
  if (days <= 30) return 'upcoming';
  return 'normal';
});

// Virtual for opportunity status
opportunitySchema.virtual('status').get(function() {
  const now = new Date();
  if (this.deadline < now) return 'closed';
  if (this.type === 'hackathon' && this.start_date > now) return 'upcoming';
  if (this.type === 'hackathon' && this.start_date <= now && this.end_date >= now) return 'ongoing';
  return 'open';
});

// Static method to find opportunities by type
opportunitySchema.statics.findByType = function(type) {
  return this.find({ type: type, is_active: true });
};

// Static method to find upcoming opportunities
opportunitySchema.statics.findUpcoming = function() {
  const now = new Date();
  return this.find({
    deadline: { $gt: now },
    is_active: true
  });
};

// Static method to find opportunities by skills
opportunitySchema.statics.findBySkills = function(skills) {
  return this.find({
    skills_required: { $in: skills },
    is_active: true
  });
};

// Static method to find opportunities by domain
opportunitySchema.statics.findByDomain = function(domains) {
  return this.find({
    domain: { $in: domains },
    is_active: true
  });
};

// Static method to find opportunities for specific degree and year
opportunitySchema.statics.findForStudent = function(degree, year) {
  return this.find({
    type: 'internship',
    degree_required: { $in: [degree, 'Any'] },
    year_of_study: { $in: [year, 0] }, // 0 means any year
    is_active: true
  });
};

// Pre-save middleware to update last_updated
opportunitySchema.pre('save', function(next) {
  this.last_updated = new Date();
  next();
});

module.exports = mongoose.model('Opportunity', opportunitySchema);