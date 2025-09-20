/**
 * Mobile-specific middleware and optimizations
 */

// Mobile-specific response formatting
const mobileResponseFormat = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Add mobile-specific headers
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes cache for mobile
      'X-Mobile-Optimized': 'true'
    });
    
    // If it's a mobile request, optimize the response
    if (req.headers['user-agent'] && req.headers['user-agent'].includes('Mobile')) {
      if (typeof data === 'object' && data.data) {
        // Compress large arrays for mobile
        if (Array.isArray(data.data) && data.data.length > 20) {
          data.pagination = data.pagination || {};
          data.pagination.mobile_optimized = true;
        }
        
        // Remove unnecessary fields for mobile
        if (data.data && Array.isArray(data.data)) {
          data.data = data.data.map(item => {
            // Remove large description fields for list views
            if (item.description && item.description.length > 200) {
              item.description = item.description.substring(0, 200) + '...';
            }
            return item;
          });
        }
      }
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Mobile-specific rate limiting
const mobileRateLimit = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone');
  
  if (isMobile) {
    // More lenient rate limiting for mobile apps
    req.rateLimitMultiplier = 1.5;
  }
  
  next();
};

// Mobile push notification token management
const validatePushToken = (req, res, next) => {
  const { push_token } = req.body;
  
  if (push_token) {
    // Validate push token format
    if (typeof push_token !== 'string' || push_token.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid push token format'
      });
    }
    
    // Store push token in request for later use
    req.pushToken = push_token;
  }
  
  next();
};

// Mobile-specific pagination
const mobilePagination = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone');
  
  if (isMobile) {
    // Smaller page sizes for mobile
    if (!req.query.limit) {
      req.query.limit = '10';
    } else if (parseInt(req.query.limit) > 20) {
      req.query.limit = '20';
    }
  }
  
  next();
};

// Mobile image optimization
const mobileImageOptimization = (req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';
  const isMobile = userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone');
  
  if (isMobile && req.file) {
    // For mobile, we might want to compress images more
    req.mobileOptimization = {
      compress: true,
      maxWidth: 800,
      maxHeight: 600,
      quality: 80
    };
  }
  
  next();
};

module.exports = {
  mobileResponseFormat,
  mobileRateLimit,
  validatePushToken,
  mobilePagination,
  mobileImageOptimization
};