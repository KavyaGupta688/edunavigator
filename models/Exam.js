const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  exam_name: {
    type: String,
    required: [true, 'Exam name is required'],
    trim: true,
    maxlength: [200, 'Exam name cannot exceed 200 characters']
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2020, 'Year must be 2020 or later'],
    max: [2030, 'Year cannot exceed 2030']
  },
  authority: {
    type: String,
    required: [true, 'Authority is required'],
    trim: true
  },
  website: {
    type: String,
    required: [true, 'Website is required'],
    trim: true,
    match: [/^https?:\/\/.+/, 'Please enter a valid URL']
  },
  exam_type: {
    type: String,
    required: [true, 'Exam type is required'],
    enum: {
      values: ['government', 'private', 'semi_government'],
      message: 'Exam type must be government, private, or semi_government'
    }
  },
  admission_mode: {
    type: String,
    required: [true, 'Admission mode is required'],
    enum: {
      values: ['direct_admission', 'entrance_exam'],
      message: 'Admission mode must be direct_admission or entrance_exam'
    }
  },
  eligibility: {
    board_exam_criteria: {
      type: String,
      required: [true, 'Board exam criteria is required'],
      trim: true
    },
    age_limit: {
      min: Number,
      max: Number
    },
    nationality: {
      type: String,
      default: 'Indian'
    },
    other_requirements: [String]
  },
  registration_fee: {
    type: Number,
    required: [true, 'Registration fee is required'],
    min: [0, 'Registration fee cannot be negative']
  },
  subjects: [{
    type: String,
    required: true,
    trim: true
  }],
  events: [{
    event: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true
    },
    description: String
  }],
  application_process: {
    steps: [String],
    documents_required: [String],
    important_notes: [String]
  },
  exam_pattern: {
    duration: String,
    total_marks: Number,
    sections: [{
      name: String,
      marks: Number,
      questions: Number
    }]
  },
  participating_institutes: [{
    name: String,
    location: String,
    courses_offered: [String]
  }],
  last_updated: {
    type: Date,
    default: Date.now
  },
  is_active: {
    type: Boolean,
    default: true
  },
  tags: [String], // For better search and filtering
  difficulty_level: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Very Hard'],
    default: 'Medium'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
examSchema.index({ exam_name: 1, year: 1 });
examSchema.index({ authority: 1 });
examSchema.index({ exam_type: 1 });
examSchema.index({ admission_mode: 1 });
examSchema.index({ year: 1 });
examSchema.index({ subjects: 1 });
examSchema.index({ tags: 1 });
examSchema.index({ 'events.date': 1 });
examSchema.index({ is_active: 1 });

// Virtual for next upcoming event
examSchema.virtual('next_event').get(function() {
  const now = new Date();
  const upcomingEvents = this.events
    .filter(event => event.date > now)
    .sort((a, b) => a.date - b.date);
  
  return upcomingEvents.length > 0 ? upcomingEvents[0] : null;
});

// Virtual for registration deadline
examSchema.virtual('registration_deadline').get(function() {
  const registrationEvent = this.events.find(event => 
    event.event.toLowerCase().includes('registration') && 
    event.event.toLowerCase().includes('end')
  );
  return registrationEvent ? registrationEvent.date : null;
});

// Virtual for exam date
examSchema.virtual('exam_date').get(function() {
  const examEvent = this.events.find(event => 
    event.event.toLowerCase().includes('exam')
  );
  return examEvent ? examEvent.date : null;
});

// Static method to find exams by type
examSchema.statics.findByType = function(type) {
  return this.find({ exam_type: type, is_active: true });
};

// Static method to find exams by admission mode
examSchema.statics.findByAdmissionMode = function(admissionMode) {
  return this.find({ admission_mode: admissionMode, is_active: true });
};

// Static method to find upcoming exams
examSchema.statics.findUpcoming = function() {
  const now = new Date();
  return this.find({
    'events.date': { $gt: now },
    is_active: true
  });
};

// Static method to find exams by subjects
examSchema.statics.findBySubjects = function(subjects) {
  return this.find({
    subjects: { $in: subjects },
    is_active: true
  });
};

// Pre-save middleware to update last_updated
examSchema.pre('save', function(next) {
  this.last_updated = new Date();
  next();
});

module.exports = mongoose.model('Exam', examSchema);