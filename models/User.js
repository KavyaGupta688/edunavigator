const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: ['school', 'university'],
      message: 'Role must be either "school" or "university"'
    }
  },
  education: {
    degree: {
      type: String,
      required: function() {
        return this.role === 'university';
      },
      trim: true
    },
    year: {
      type: Number,
      required: function() {
        return this.role === 'university';
      },
      min: [1, 'Year must be at least 1'],
      max: [10, 'Year cannot exceed 10']
    }
  },
  school_info: {
    class: {
      type: Number,
      required: function() {
        return this.role === 'school';
      },
      enum: {
        values: [11, 12],
        message: 'Class must be either 11 or 12'
      }
    },
    stream: {
      type: String,
      required: function() {
        return this.role === 'school';
      },
      trim: true,
      enum: {
        values: ['Science', 'Commerce', 'Arts', 'Other'],
        message: 'Stream must be Science, Commerce, Arts, or Other'
      }
    }
  },
  preferences: {
    interests: [{
      type: String,
      trim: true
    }]
  },
  saved_exams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam'
  }],
  saved_hackathons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity'
  }],
  saved_internships: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity'
  }],
  notifications_enabled: {
    type: Boolean,
    default: true
  },
  profile_picture: {
    type: String,
    default: null
  },
  is_active: {
    type: Boolean,
    default: true
  },
  last_login: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'preferences.interests': 1 });
userSchema.index({ created_at: -1 });

// Virtual for user's saved opportunities count
userSchema.virtual('saved_opportunities_count').get(function() {
  if (this.role === 'school') {
    return this.saved_exams.length;
  } else {
    return this.saved_hackathons.length + this.saved_internships.length;
  }
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get user's role-specific data
userSchema.methods.getRoleData = function() {
  if (this.role === 'school') {
    return {
      class: this.school_info.class,
      stream: this.school_info.stream,
      saved_exams: this.saved_exams
    };
  } else {
    return {
      degree: this.education.degree,
      year: this.education.year,
      saved_hackathons: this.saved_hackathons,
      saved_internships: this.saved_internships
    };
  }
};

// Static method to find users by interests
userSchema.statics.findByInterests = function(interests) {
  return this.find({
    'preferences.interests': { $in: interests },
    is_active: true
  });
};

module.exports = mongoose.model('User', userSchema);