/**
 * Application constants and configuration
 */

// User roles
const USER_ROLES = {
  SCHOOL: 'school',
  UNIVERSITY: 'university',
  ADMIN: 'admin'
};

// Exam types
const EXAM_TYPES = {
  GOVERNMENT: 'government',
  PRIVATE: 'private',
  SEMI_GOVERNMENT: 'semi_government'
};

// Admission modes
const ADMISSION_MODES = {
  DIRECT_ADMISSION: 'direct_admission',
  ENTRANCE_EXAM: 'entrance_exam'
};

// Opportunity types
const OPPORTUNITY_TYPES = {
  HACKATHON: 'hackathon',
  INTERNSHIP: 'internship'
};

// Team status
const TEAM_STATUS = {
  RECRUITING: 'recruiting',
  FULL: 'full',
  CLOSED: 'closed',
  DISBANDED: 'disbanded'
};

// Team member roles
const TEAM_MEMBER_ROLES = {
  LEADER: 'leader',
  MEMBER: 'member'
};

// Team member status
const TEAM_MEMBER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  REMOVED: 'removed'
};

// Message types
const MESSAGE_TYPES = {
  TEXT: 'text',
  FILE: 'file',
  LINK: 'link',
  SYSTEM: 'system'
};

// Message priority
const MESSAGE_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};

// Notification types
const NOTIFICATION_TYPES = {
  EXAM_DEADLINE: 'exam_deadline',
  OPPORTUNITY: 'opportunity',
  TEAM_UPDATE: 'team_update',
  WEEKLY_DIGEST: 'weekly_digest',
  SYSTEM: 'system'
};

// Update log entities
const UPDATE_LOG_ENTITIES = {
  EXAM_DEADLINE: 'exam_deadline',
  OPPORTUNITY: 'opportunity',
  USER_PROFILE: 'user_profile',
  TEAM: 'team',
  SYSTEM: 'system'
};

// Update log sources
const UPDATE_LOG_SOURCES = {
  SCRAPER: 'scraper',
  ADMIN: 'admin',
  USER: 'user',
  SYSTEM: 'system',
  API: 'api'
};

// Severity levels
const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Recommendation algorithms
const RECOMMENDATION_ALGORITHMS = {
  RULE_BASED: 'rule_based',
  CONTENT_BASED: 'content_based',
  COLLABORATIVE_FILTERING: 'collaborative_filtering',
  HYBRID: 'hybrid'
};

// Badge categories
const BADGE_CATEGORIES = {
  ACHIEVEMENT: 'achievement',
  PARTICIPATION: 'participation',
  MILESTONE: 'milestone',
  SPECIAL: 'special'
};

// Badge rarities
const BADGE_RARITIES = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

// School streams
const SCHOOL_STREAMS = {
  SCIENCE: 'Science',
  COMMERCE: 'Commerce',
  ARTS: 'Arts',
  OTHER: 'Other'
};

// School classes
const SCHOOL_CLASSES = {
  CLASS_11: 11,
  CLASS_12: 12
};

// Opportunity modes
const OPPORTUNITY_MODES = {
  ONLINE: 'Online',
  OFFLINE: 'Offline',
  HYBRID: 'Hybrid'
};

// File upload limits
const FILE_UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 5,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALLOWED_ARCHIVE_TYPES: ['application/zip', 'application/x-rar-compressed']
};

// Pagination defaults
const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100
};

// Rate limiting
const RATE_LIMITS = {
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100
  },
  AUTH: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 5
  },
  UPLOAD: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 10
  }
};

// JWT configuration
const JWT_CONFIG = {
  EXPIRES_IN: '7d',
  REFRESH_EXPIRES_IN: '30d'
};

// Database indexes
const DATABASE_INDEXES = {
  USER: ['email', 'role', 'preferences.interests', 'created_at'],
  EXAM: ['exam_name', 'year', 'authority', 'exam_type', 'subjects', 'events.date'],
  OPPORTUNITY: ['type', 'deadline', 'domain', 'skills_required', 'company', 'organizer'],
  TEAM: ['opp_id', 'created_by', 'status', 'skills_needed'],
  TEAM_MEMBER: ['team_id', 'user_id', 'role', 'status'],
  MESSAGE: ['team_id', 'created_at', 'user_id', 'message_type'],
  RECOMMENDATION: ['user_id', 'entity_type', 'score', 'algorithm_used'],
  UPDATE_LOG: ['entity', 'entity_id', 'change_date', 'severity']
};

// API response messages
const API_MESSAGES = {
  SUCCESS: {
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    RETRIEVED: 'Resource retrieved successfully',
    LOGIN_SUCCESS: 'Login successful',
    REGISTER_SUCCESS: 'Registration successful',
    LOGOUT_SUCCESS: 'Logout successful'
  },
  ERROR: {
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    VALIDATION_ERROR: 'Validation failed',
    SERVER_ERROR: 'Internal server error',
    DUPLICATE_ENTRY: 'Resource already exists',
    INVALID_CREDENTIALS: 'Invalid credentials',
    TOKEN_EXPIRED: 'Token expired',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded'
  }
};

// HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Time constants
const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000
};

// Scraping intervals
const SCRAPING_INTERVALS = {
  EXAMS: 24 * 60 * 60 * 1000, // 24 hours
  HACKATHONS: 12 * 60 * 60 * 1000, // 12 hours
  INTERNSHIPS: 6 * 60 * 60 * 1000, // 6 hours
  DEADLINE_CHECKS: 2 * 60 * 60 * 1000 // 2 hours
};

// Notification intervals
const NOTIFICATION_INTERVALS = {
  DEADLINE_REMINDERS: [7, 3, 1], // Days before deadline
  WEEKLY_DIGEST: 7 * 24 * 60 * 60 * 1000, // Weekly
  DAILY_DIGEST: 24 * 60 * 60 * 1000 // Daily
};

// Points system
const POINTS_SYSTEM = {
  EXAM_REGISTRATION: 10,
  HACKATHON_APPLICATION: 15,
  INTERNSHIP_APPLICATION: 20,
  TEAM_CREATION: 25,
  TEAM_JOIN: 10,
  BADGE_EARNED: 50,
  LEVEL_UP: 100,
  STREAK_MAINTENANCE: 5
};

// Default values
const DEFAULTS = {
  USER: {
    NOTIFICATIONS_ENABLED: true,
    IS_ACTIVE: true,
    PROFILE_PICTURE: null
  },
  TEAM: {
    MAX_MEMBERS: 4,
    IS_PUBLIC: true,
    STATUS: 'recruiting'
  },
  MESSAGE: {
    TYPE: 'text',
    PRIORITY: 'normal',
    IS_EDITED: false,
    IS_DELETED: false
  },
  RECOMMENDATION: {
    ALGORITHM: 'rule_based',
    IS_ACTIVE: true,
    EXPIRES_DAYS: 30
  }
};

// Error codes
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  DUPLICATE_ERROR: 'DUPLICATE_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR'
};

module.exports = {
  USER_ROLES,
  EXAM_TYPES,
  ADMISSION_MODES,
  OPPORTUNITY_TYPES,
  TEAM_STATUS,
  TEAM_MEMBER_ROLES,
  TEAM_MEMBER_STATUS,
  MESSAGE_TYPES,
  MESSAGE_PRIORITY,
  NOTIFICATION_TYPES,
  UPDATE_LOG_ENTITIES,
  UPDATE_LOG_SOURCES,
  SEVERITY_LEVELS,
  RECOMMENDATION_ALGORITHMS,
  BADGE_CATEGORIES,
  BADGE_RARITIES,
  SCHOOL_STREAMS,
  SCHOOL_CLASSES,
  OPPORTUNITY_MODES,
  FILE_UPLOAD_LIMITS,
  PAGINATION_DEFAULTS,
  RATE_LIMITS,
  JWT_CONFIG,
  DATABASE_INDEXES,
  API_MESSAGES,
  HTTP_STATUS,
  TIME_CONSTANTS,
  SCRAPING_INTERVALS,
  NOTIFICATION_INTERVALS,
  POINTS_SYSTEM,
  DEFAULTS,
  ERROR_CODES
};