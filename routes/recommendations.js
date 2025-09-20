const express = require('express');
const router = express.Router();
const {
  getUserRecommendations,
  getTopRecommendations,
  updateRecommendationInteraction,
  generateRecommendations,
  getRecommendationAnalytics,
  getSimilarUsers,
  getTrendingRecommendations,
  getRecommendationMetrics
} = require('../controllers/recommendationController');
const { protect, authorize } = require('../middleware/auth');
const {
  validatePagination,
  validateObjectId
} = require('../middleware/validation');

// All routes are protected
router.use(protect);

// User recommendation routes
router.get('/:userId', validateObjectId('userId'), validatePagination, getUserRecommendations);
router.get('/:userId/top', validateObjectId('userId'), getTopRecommendations);
router.get('/:userId/analytics', validateObjectId('userId'), getRecommendationAnalytics);
router.get('/:userId/similar', validateObjectId('userId'), getSimilarUsers);
router.post('/:userId/generate', validateObjectId('userId'), generateRecommendations);

// Recommendation interaction routes
router.put('/:id/interaction', validateObjectId('id'), updateRecommendationInteraction);

// Public trending routes
router.get('/trending', getTrendingRecommendations);

// Admin routes
router.get('/admin/metrics', authorize('admin'), getRecommendationMetrics);

module.exports = router;