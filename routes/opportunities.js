const express = require('express');
const router = express.Router();
const {
  getOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getHackathons,
  getInternships,
  getOpportunitiesForStudent,
  getUpcomingOpportunities,
  getOpportunityStats,
  searchOpportunities
} = require('../controllers/opportunityController');
const { protect, authorize } = require('../middleware/auth');
const {
  validateOpportunity,
  validatePagination,
  validateObjectId,
  validateFilters,
  validateSearch
} = require('../middleware/validation');

// Public routes
router.get('/', validatePagination, validateFilters, getOpportunities);
router.get('/hackathons', validatePagination, validateFilters, getHackathons);
router.get('/internships', validatePagination, validateFilters, getInternships);
router.get('/upcoming', getUpcomingOpportunities);
router.get('/stats', getOpportunityStats);
router.get('/search', validateSearch, validatePagination, searchOpportunities);
router.get('/:id', validateObjectId('id'), getOpportunity);

// Protected routes
router.get('/for-student/:userId', protect, validateObjectId('userId'), getOpportunitiesForStudent);

// Admin routes
router.post('/', protect, authorize('admin'), validateOpportunity, createOpportunity);
router.put('/:id', protect, authorize('admin'), validateObjectId('id'), validateOpportunity, updateOpportunity);
router.delete('/:id', protect, authorize('admin'), validateObjectId('id'), deleteOpportunity);

module.exports = router;