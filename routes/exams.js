const express = require('express');
const router = express.Router();
const {
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  getUpcomingExams,
  getExamsByType,
  getExamsByAdmissionMode,
  getExamsBySubjects,
  getExamDeadlines,
  getUrgentDeadlines,
  getExamStats,
  searchExams
} = require('../controllers/examController');
const { protect, authorize } = require('../middleware/auth');
const {
  validateExam,
  validatePagination,
  validateObjectId,
  validateFilters,
  validateSearch
} = require('../middleware/validation');

// Public routes
router.get('/', validatePagination, validateFilters, getExams);
router.get('/upcoming', getUpcomingExams);
router.get('/type/:type', validatePagination, getExamsByType);
router.get('/admission-mode/:mode', validatePagination, getExamsByAdmissionMode);
router.get('/subjects', getExamsBySubjects);
router.get('/deadlines/urgent', getUrgentDeadlines);
router.get('/stats', getExamStats);
router.get('/search', validateSearch, validatePagination, searchExams);
router.get('/:id', validateObjectId('id'), getExam);
router.get('/:id/deadlines', validateObjectId('id'), getExamDeadlines);

// Protected routes (Admin only)
router.post('/', protect, authorize('admin'), validateExam, createExam);
router.put('/:id', protect, authorize('admin'), validateObjectId('id'), validateExam, updateExam);
router.delete('/:id', protect, authorize('admin'), validateObjectId('id'), deleteExam);

module.exports = router;