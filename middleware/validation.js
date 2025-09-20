const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('role')
    .isIn(['school', 'university'])
    .withMessage('Role must be either school or university'),
  
  body('education.degree')
    .if(body('role').equals('university'))
    .notEmpty()
    .withMessage('Degree is required for university students'),
  
  body('education.year')
    .if(body('role').equals('university'))
    .isInt({ min: 1, max: 10 })
    .withMessage('Year must be between 1 and 10'),
  
  body('school_info.class')
    .if(body('role').equals('school'))
    .isIn([11, 12])
    .withMessage('Class must be either 11 or 12'),
  
  body('school_info.stream')
    .if(body('role').equals('school'))
    .isIn(['Science', 'Commerce', 'Arts', 'Other'])
    .withMessage('Stream must be Science, Commerce, Arts, or Other'),
  
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('preferences.interests')
    .optional()
    .isArray()
    .withMessage('Interests must be an array'),
  
  body('preferences.interests.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each interest must be between 1 and 50 characters'),
  
  body('notifications_enabled')
    .optional()
    .isBoolean()
    .withMessage('Notifications enabled must be a boolean'),
  
  handleValidationErrors
];

// Exam validation rules
const validateExam = [
  body('exam_name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Exam name must be between 2 and 200 characters'),
  
  body('year')
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030'),
  
  body('authority')
    .trim()
    .notEmpty()
    .withMessage('Authority is required'),
  
  body('website')
    .isURL()
    .withMessage('Please provide a valid website URL'),
  
  body('exam_type')
    .isIn(['government', 'private', 'semi_government'])
    .withMessage('Exam type must be government, private, or semi_government'),
  
  body('admission_mode')
    .isIn(['direct_admission', 'entrance_exam'])
    .withMessage('Admission mode must be direct_admission or entrance_exam'),
  
  body('registration_fee')
    .isFloat({ min: 0 })
    .withMessage('Registration fee must be a positive number'),
  
  body('subjects')
    .isArray({ min: 1 })
    .withMessage('At least one subject is required'),
  
  body('subjects.*')
    .trim()
    .notEmpty()
    .withMessage('Subject cannot be empty'),
  
  body('events')
    .isArray({ min: 1 })
    .withMessage('At least one event is required'),
  
  body('events.*.event')
    .trim()
    .notEmpty()
    .withMessage('Event name is required'),
  
  body('events.*.date')
    .isISO8601()
    .withMessage('Event date must be a valid date'),
  
  handleValidationErrors
];

// Opportunity validation rules
const validateOpportunity = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  
  body('type')
    .isIn(['hackathon', 'internship'])
    .withMessage('Type must be either hackathon or internship'),
  
  body('mode')
    .isIn(['Online', 'Offline', 'Hybrid'])
    .withMessage('Mode must be Online, Offline, or Hybrid'),
  
  body('website')
    .isURL()
    .withMessage('Please provide a valid website URL'),
  
  body('deadline')
    .isISO8601()
    .withMessage('Deadline must be a valid date'),
  
  // Hackathon specific validations
  body('organizer')
    .if(body('type').equals('hackathon'))
    .trim()
    .notEmpty()
    .withMessage('Organizer is required for hackathons'),
  
  body('domain')
    .if(body('type').equals('hackathon'))
    .isArray({ min: 1 })
    .withMessage('At least one domain is required for hackathons'),
  
  body('prize')
    .if(body('type').equals('hackathon'))
    .isFloat({ min: 0 })
    .withMessage('Prize must be a positive number'),
  
  body('start_date')
    .if(body('type').equals('hackathon'))
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  body('end_date')
    .if(body('type').equals('hackathon'))
    .isISO8601()
    .withMessage('End date must be a valid date'),
  
  // Internship specific validations
  body('company')
    .if(body('type').equals('internship'))
    .trim()
    .notEmpty()
    .withMessage('Company is required for internships'),
  
  body('role')
    .if(body('type').equals('internship'))
    .trim()
    .notEmpty()
    .withMessage('Role is required for internships'),
  
  body('apply_link')
    .if(body('type').equals('internship'))
    .isURL()
    .withMessage('Apply link must be a valid URL'),
  
  handleValidationErrors
];

// Team validation rules
const validateTeam = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Team name must be between 2 and 100 characters'),
  
  body('opp_id')
    .isMongoId()
    .withMessage('Valid opportunity ID is required'),
  
  body('max_members')
    .optional()
    .isInt({ min: 2, max: 10 })
    .withMessage('Max members must be between 2 and 10'),
  
  body('skills_needed')
    .optional()
    .isArray()
    .withMessage('Skills needed must be an array'),
  
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  
  handleValidationErrors
];

// Message validation rules
const validateMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  
  body('team_id')
    .isMongoId()
    .withMessage('Valid team ID is required'),
  
  body('message_type')
    .optional()
    .isIn(['text', 'file', 'link', 'system'])
    .withMessage('Message type must be text, file, link, or system'),
  
  handleValidationErrors
];

// Query parameter validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  handleValidationErrors
];

// ID parameter validation
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId()
    .withMessage(`Valid ${paramName} is required`),
  
  handleValidationErrors
];

// Filter validation
const validateFilters = [
  query('type')
    .optional()
    .isIn(['government', 'private', 'semi_government', 'hackathon', 'internship'])
    .withMessage('Invalid type filter'),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'upcoming', 'ongoing', 'closed'])
    .withMessage('Invalid status filter'),
  
  query('sort')
    .optional()
    .isIn(['created_at', 'deadline', 'title', 'points', 'popularity'])
    .withMessage('Invalid sort field'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateExam,
  validateOpportunity,
  validateTeam,
  validateMessage,
  validatePagination,
  validateSearch,
  validateObjectId,
  validateFilters
};