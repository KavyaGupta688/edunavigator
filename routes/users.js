const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  saveExam,
  unsaveExam,
  saveHackathon,
  saveInternship,
  getSavedItems,
  getUserStats,
  getUserDashboard
} = require('../controllers/userController');
const { protect, authorize, checkOwnership } = require('../middleware/auth');
const {
  validateUserUpdate,
  validatePagination,
  validateObjectId
} = require('../middleware/validation');
const { uploadProfilePicture, processImage } = require('../middleware/upload');

// All routes are protected
router.use(protect);

// User management routes
router.get('/', authorize('admin'), validatePagination, getUsers);
router.get('/:id', validateObjectId('id'), getUser);
router.put('/:id', validateObjectId('id'), checkOwnership('id'), uploadProfilePicture, processImage, validateUserUpdate, updateUser);
router.delete('/:id', authorize('admin'), validateObjectId('id'), deleteUser);

// User-specific routes
router.get('/:id/saved', validateObjectId('id'), checkOwnership('id'), getSavedItems);
router.get('/:id/stats', validateObjectId('id'), checkOwnership('id'), getUserStats);
router.get('/:id/dashboard', validateObjectId('id'), checkOwnership('id'), getUserDashboard);

// Save/unsave routes
router.post('/:id/save-exam', validateObjectId('id'), checkOwnership('id'), saveExam);
router.delete('/:id/save-exam/:examId', validateObjectId('id'), validateObjectId('examId'), checkOwnership('id'), unsaveExam);
router.post('/:id/save-hackathon', validateObjectId('id'), checkOwnership('id'), saveHackathon);
router.post('/:id/save-internship', validateObjectId('id'), checkOwnership('id'), saveInternship);

module.exports = router;