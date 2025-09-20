const fs = require('fs');
const path = require('path');

/**
 * Simple logging utility for the application
 */
class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Get current timestamp
   * @returns {string} Formatted timestamp
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format log message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   * @returns {string} Formatted log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = this.getTimestamp();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  /**
   * Write log to file
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  writeToFile(level, message, meta = {}) {
    const logFile = path.join(this.logDir, `${level}.log`);
    const formattedMessage = this.formatMessage(level, message, meta);
    
    fs.appendFileSync(logFile, formattedMessage + '\n');
  }

  /**
   * Log info message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    const formattedMessage = this.formatMessage('info', message, meta);
    console.log(formattedMessage);
    this.writeToFile('info', message, meta);
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    const formattedMessage = this.formatMessage('warn', message, meta);
    console.warn(formattedMessage);
    this.writeToFile('warn', message, meta);
  }

  /**
   * Log error message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  error(message, meta = {}) {
    const formattedMessage = this.formatMessage('error', message, meta);
    console.error(formattedMessage);
    this.writeToFile('error', message, meta);
  }

  /**
   * Log debug message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      const formattedMessage = this.formatMessage('debug', message, meta);
      console.debug(formattedMessage);
      this.writeToFile('debug', message, meta);
    }
  }

  /**
   * Log HTTP request
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} responseTime - Response time in milliseconds
   */
  logRequest(req, res, responseTime) {
    const meta = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };

    if (res.statusCode >= 400) {
      this.error(`${req.method} ${req.url} - ${res.statusCode}`, meta);
    } else {
      this.info(`${req.method} ${req.url} - ${res.statusCode}`, meta);
    }
  }

  /**
   * Log database operation
   * @param {string} operation - Database operation
   * @param {string} collection - Collection name
   * @param {Object} meta - Additional metadata
   */
  logDatabase(operation, collection, meta = {}) {
    this.info(`Database ${operation} on ${collection}`, meta);
  }

  /**
   * Log authentication event
   * @param {string} event - Authentication event
   * @param {string} userId - User ID
   * @param {Object} meta - Additional metadata
   */
  logAuth(event, userId, meta = {}) {
    this.info(`Auth ${event}`, { userId, ...meta });
  }

  /**
   * Log API error
   * @param {Error} error - Error object
   * @param {Object} req - Express request object
   * @param {Object} meta - Additional metadata
   */
  logApiError(error, req, meta = {}) {
    const errorMeta = {
      message: error.message,
      stack: error.stack,
      method: req.method,
      url: req.url,
      ...meta
    };

    this.error('API Error', errorMeta);
  }

  /**
   * Log scraping event
   * @param {string} event - Scraping event
   * @param {string} source - Data source
   * @param {Object} meta - Additional metadata
   */
  logScraping(event, source, meta = {}) {
    this.info(`Scraping ${event} from ${source}`, meta);
  }

  /**
   * Log notification event
   * @param {string} event - Notification event
   * @param {string} userId - User ID
   * @param {Object} meta - Additional metadata
   */
  logNotification(event, userId, meta = {}) {
    this.info(`Notification ${event}`, { userId, ...meta });
  }

  /**
   * Log recommendation event
   * @param {string} event - Recommendation event
   * @param {string} userId - User ID
   * @param {Object} meta - Additional metadata
   */
  logRecommendation(event, userId, meta = {}) {
    this.info(`Recommendation ${event}`, { userId, ...meta });
  }

  /**
   * Log team event
   * @param {string} event - Team event
   * @param {string} teamId - Team ID
   * @param {Object} meta - Additional metadata
   */
  logTeam(event, teamId, meta = {}) {
    this.info(`Team ${event}`, { teamId, ...meta });
  }

  /**
   * Log performance metrics
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} meta - Additional metadata
   */
  logPerformance(operation, duration, meta = {}) {
    this.info(`Performance: ${operation}`, { duration: `${duration}ms`, ...meta });
  }

  /**
   * Log security event
   * @param {string} event - Security event
   * @param {Object} meta - Additional metadata
   */
  logSecurity(event, meta = {}) {
    this.warn(`Security: ${event}`, meta);
  }

  /**
   * Log system event
   * @param {string} event - System event
   * @param {Object} meta - Additional metadata
   */
  logSystem(event, meta = {}) {
    this.info(`System: ${event}`, meta);
  }

  /**
   * Create child logger with additional context
   * @param {Object} context - Additional context
   * @returns {Object} Child logger
   */
  child(context) {
    return {
      info: (message, meta = {}) => this.info(message, { ...context, ...meta }),
      warn: (message, meta = {}) => this.warn(message, { ...context, ...meta }),
      error: (message, meta = {}) => this.error(message, { ...context, ...meta }),
      debug: (message, meta = {}) => this.debug(message, { ...context, ...meta })
    };
  }

  /**
   * Clean old log files
   * @param {number} daysToKeep - Number of days to keep logs
   */
  cleanOldLogs(daysToKeep = 30) {
    try {
      const files = fs.readdirSync(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          this.info(`Cleaned old log file: ${file}`);
        }
      });
    } catch (error) {
      this.error('Error cleaning old logs', { error: error.message });
    }
  }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;