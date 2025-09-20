const express = require('express');
const router = express.Router();
const {
  updatePushToken,
  getMobileConfig,
  getMobileDashboard,
  getMobileRecommendations,
  logMobileAnalytics,
  checkForUpdates,
  getMobileExams
} = require('../controllers/mobileController');
const { protect } = require('../middleware/auth');
const {
  mobileResponseFormat,
  mobileRateLimit,
  validatePushToken,
  mobilePagination,
  mobileImageOptimization
} = require('../middleware/mobileOptimization');

// Apply mobile-specific middleware
router.use(mobileResponseFormat);
router.use(mobileRateLimit);
router.use(mobilePagination);

// Public mobile routes
router.get('/config', getMobileConfig);
router.get('/update-check', checkForUpdates);
router.get('/exams', getMobileExams);

// Protected mobile routes
router.use(protect);

router.put('/push-token', validatePushToken, updatePushToken);
router.get('/dashboard/:userId', getMobileDashboard);
router.get('/recommendations/:userId', getMobileRecommendations);
router.post('/analytics', logMobileAnalytics);

module.exports = router;