/**
 * Custom validation utilities
 */

/**
 * Validate MongoDB ObjectId
 * @param {string} id - ID to validate
 * @returns {boolean} True if valid ObjectId
 */
const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and errors
 */
const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone number
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate date string
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid date
 */
const isValidDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Validate future date
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if date is in the future
 */
const isFutureDate = (dateString) => {
  if (!isValidDate(dateString)) return false;
  return new Date(dateString) > new Date();
};

/**
 * Validate past date
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if date is in the past
 */
const isPastDate = (dateString) => {
  if (!isValidDate(dateString)) return false;
  return new Date(dateString) < new Date();
};

/**
 * Validate year
 * @param {number} year - Year to validate
 * @returns {boolean} True if valid year
 */
const isValidYear = (year) => {
  const currentYear = new Date().getFullYear();
  return Number.isInteger(year) && year >= 2020 && year <= currentYear + 5;
};

/**
 * Validate exam type
 * @param {string} type - Exam type to validate
 * @returns {boolean} True if valid exam type
 */
const isValidExamType = (type) => {
  const validTypes = ['government', 'private', 'semi_government'];
  return validTypes.includes(type);
};

/**
 * Validate admission mode
 * @param {string} mode - Admission mode to validate
 * @returns {boolean} True if valid admission mode
 */
const isValidAdmissionMode = (mode) => {
  const validModes = ['direct_admission', 'entrance_exam'];
  return validModes.includes(mode);
};

/**
 * Validate opportunity type
 * @param {string} type - Opportunity type to validate
 * @returns {boolean} True if valid opportunity type
 */
const isValidOpportunityType = (type) => {
  const validTypes = ['hackathon', 'internship'];
  return validTypes.includes(type);
};

/**
 * Validate user role
 * @param {string} role - User role to validate
 * @returns {boolean} True if valid user role
 */
const isValidUserRole = (role) => {
  const validRoles = ['school', 'university', 'admin'];
  return validRoles.includes(role);
};

/**
 * Validate school class
 * @param {number} classNum - Class number to validate
 * @returns {boolean} True if valid class
 */
const isValidSchoolClass = (classNum) => {
  return classNum === 11 || classNum === 12;
};

/**
 * Validate school stream
 * @param {string} stream - Stream to validate
 * @returns {boolean} True if valid stream
 */
const isValidSchoolStream = (stream) => {
  const validStreams = ['Science', 'Commerce', 'Arts', 'Other'];
  return validStreams.includes(stream);
};

/**
 * Validate team size
 * @param {number} size - Team size to validate
 * @returns {boolean} True if valid team size
 */
const isValidTeamSize = (size) => {
  return Number.isInteger(size) && size >= 2 && size <= 10;
};

/**
 * Validate message length
 * @param {string} message - Message to validate
 * @param {number} maxLength - Maximum allowed length
 * @returns {boolean} True if valid message length
 */
const isValidMessageLength = (message, maxLength = 1000) => {
  return message && message.trim().length > 0 && message.length <= maxLength;
};

/**
 * Validate file size
 * @param {number} size - File size in bytes
 * @param {number} maxSize - Maximum allowed size in bytes
 * @returns {boolean} True if valid file size
 */
const isValidFileSize = (size, maxSize = 5 * 1024 * 1024) => {
  return Number.isInteger(size) && size > 0 && size <= maxSize;
};

/**
 * Validate file type
 * @param {string} mimeType - MIME type to validate
 * @param {Array} allowedTypes - Array of allowed MIME types
 * @returns {boolean} True if valid file type
 */
const isValidFileType = (mimeType, allowedTypes) => {
  return allowedTypes.includes(mimeType);
};

/**
 * Validate pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Validation result
 */
const validatePagination = (page, limit) => {
  const errors = [];
  
  if (page !== undefined) {
    if (!Number.isInteger(page) || page < 1) {
      errors.push('Page must be a positive integer');
    }
  }
  
  if (limit !== undefined) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      errors.push('Limit must be between 1 and 100');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    page: page || 1,
    limit: limit || 10
  };
};

/**
 * Validate sort parameters
 * @param {string} sort - Sort field
 * @param {string} order - Sort order
 * @param {Array} allowedFields - Allowed sort fields
 * @returns {Object} Validation result
 */
const validateSort = (sort, order, allowedFields) => {
  const errors = [];
  
  if (sort && !allowedFields.includes(sort)) {
    errors.push(`Invalid sort field. Allowed fields: ${allowedFields.join(', ')}`);
  }
  
  if (order && !['asc', 'desc'].includes(order.toLowerCase())) {
    errors.push('Sort order must be "asc" or "desc"');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sort: sort || allowedFields[0],
    order: order || 'desc'
  };
};

/**
 * Validate search query
 * @param {string} query - Search query
 * @param {number} minLength - Minimum query length
 * @param {number} maxLength - Maximum query length
 * @returns {Object} Validation result
 */
const validateSearchQuery = (query, minLength = 1, maxLength = 100) => {
  const errors = [];
  
  if (!query || typeof query !== 'string') {
    errors.push('Search query is required');
    return { isValid: false, errors };
  }
  
  const trimmedQuery = query.trim();
  
  if (trimmedQuery.length < minLength) {
    errors.push(`Search query must be at least ${minLength} character(s) long`);
  }
  
  if (trimmedQuery.length > maxLength) {
    errors.push(`Search query must be less than ${maxLength} characters`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    query: trimmedQuery
  };
};

/**
 * Validate array of strings
 * @param {Array} array - Array to validate
 * @param {number} minLength - Minimum array length
 * @param {number} maxLength - Maximum array length
 * @param {number} maxItemLength - Maximum length of each item
 * @returns {Object} Validation result
 */
const validateStringArray = (array, minLength = 0, maxLength = 50, maxItemLength = 100) => {
  const errors = [];
  
  if (!Array.isArray(array)) {
    errors.push('Must be an array');
    return { isValid: false, errors };
  }
  
  if (array.length < minLength) {
    errors.push(`Array must have at least ${minLength} item(s)`);
  }
  
  if (array.length > maxLength) {
    errors.push(`Array must have at most ${maxLength} item(s)`);
  }
  
  array.forEach((item, index) => {
    if (typeof item !== 'string') {
      errors.push(`Item at index ${index} must be a string`);
    } else if (item.trim().length === 0) {
      errors.push(`Item at index ${index} cannot be empty`);
    } else if (item.length > maxItemLength) {
      errors.push(`Item at index ${index} must be less than ${maxItemLength} characters`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate numeric range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {Object} Validation result
 */
const validateNumericRange = (value, min, max) => {
  const errors = [];
  
  if (typeof value !== 'number' || isNaN(value)) {
    errors.push('Value must be a number');
    return { isValid: false, errors };
  }
  
  if (value < min) {
    errors.push(`Value must be at least ${min}`);
  }
  
  if (value > max) {
    errors.push(`Value must be at most ${max}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate required fields
 * @param {Object} data - Data object to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} Validation result
 */
const validateRequiredFields = (data, requiredFields) => {
  const errors = [];
  
  requiredFields.forEach(field => {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(`${field} is required`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Sanitize string input
 * @param {string} input - Input string to sanitize
 * @param {number} maxLength - Maximum length
 * @returns {string} Sanitized string
 */
const sanitizeString = (input, maxLength = 1000) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

/**
 * Validate and sanitize user input
 * @param {Object} input - Input object to validate and sanitize
 * @param {Object} schema - Validation schema
 * @returns {Object} Validation result with sanitized data
 */
const validateAndSanitize = (input, schema) => {
  const errors = [];
  const sanitized = {};
  
  Object.keys(schema).forEach(field => {
    const rules = schema[field];
    const value = input[field];
    
    // Check required
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      return;
    }
    
    // Skip validation if field is not provided and not required
    if (value === undefined || value === null) {
      return;
    }
    
    // Sanitize string values
    if (rules.type === 'string') {
      const sanitizedValue = sanitizeString(value, rules.maxLength);
      sanitized[field] = sanitizedValue;
      
      if (rules.minLength && sanitizedValue.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
      }
    } else {
      sanitized[field] = value;
    }
    
    // Type validation
    if (rules.type && typeof value !== rules.type) {
      errors.push(`${field} must be of type ${rules.type}`);
    }
    
    // Custom validation
    if (rules.validate && !rules.validate(value)) {
      errors.push(`${field} is invalid`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    data: sanitized
  };
};

module.exports = {
  isValidObjectId,
  isValidEmail,
  validatePassword,
  isValidPhone,
  isValidURL,
  isValidDate,
  isFutureDate,
  isPastDate,
  isValidYear,
  isValidExamType,
  isValidAdmissionMode,
  isValidOpportunityType,
  isValidUserRole,
  isValidSchoolClass,
  isValidSchoolStream,
  isValidTeamSize,
  isValidMessageLength,
  isValidFileSize,
  isValidFileType,
  validatePagination,
  validateSort,
  validateSearchQuery,
  validateStringArray,
  validateNumericRange,
  validateRequiredFields,
  sanitizeString,
  validateAndSanitize
};