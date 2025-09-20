const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const { protect } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');

// All routes are protected
router.use(protect);

// @desc    Get user progress
// @route   GET /api/progress/:userId
// @access  Private
const getUserProgress = asyncHandler(async (req, res) => {
  const progress = await Progress.findOne({ user_id: req.params.userId });
  
  if (!progress) {
    // Create initial progress if doesn't exist
    const newProgress = await Progress.create({ user_id: req.params.userId });
    return sendSuccessResponse(res, 200, 'Progress retrieved successfully', newProgress);
  }

  sendSuccessResponse(res, 200, 'Progress retrieved successfully', progress);
});

// @desc    Update user progress
// @route   PUT /api/progress/:userId
// @access  Private
const updateUserProgress = asyncHandler(async (req, res) => {
  const { activityType, increment = 1 } = req.body;

  if (!['exams_registered', 'hackathons_applied', 'internships_applied'].includes(activityType)) {
    return sendErrorResponse(res, 400, 'Invalid activity type');
  }

  const progress = await Progress.updateProgress(req.params.userId, activityType, increment);

  sendSuccessResponse(res, 200, 'Progress updated successfully', progress);
});

// @desc    Add badge to user
// @route   POST /api/progress/:userId/badges
// @access  Private
const addBadge = asyncHandler(async (req, res) => {
  const { name, description, category = 'achievement', rarity = 'common', points_awarded = 0 } = req.body;

  const badgeData = {
    name,
    description,
    category,
    rarity,
    points_awarded
  };

  const progress = await Progress.addBadge(req.params.userId, badgeData);

  sendSuccessResponse(res, 200, 'Badge added successfully', progress);
});

// @desc    Get leaderboard
// @route   GET /api/progress/leaderboard
// @access  Public
const getLeaderboard = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const limitNum = parseInt(limit) || 10;

  const leaderboard = await Progress.getLeaderboard(limitNum);

  sendSuccessResponse(res, 200, 'Leaderboard retrieved successfully', leaderboard);
});

// @desc    Check and award badges
// @route   POST /api/progress/:userId/check-badges
// @access  Private
const checkBadges = asyncHandler(async (req, res) => {
  const progress = await Progress.checkBadges(req.params.userId);

  sendSuccessResponse(res, 200, 'Badges checked successfully', progress);
});

// @desc    Get user achievements
// @route   GET /api/progress/:userId/achievements
// @access  Private
const getUserAchievements = asyncHandler(async (req, res) => {
  const progress = await Progress.findOne({ user_id: req.params.userId });

  if (!progress) {
    return sendErrorResponse(res, 404, 'Progress not found');
  }

  const achievements = {
    badges: progress.badges,
    points: progress.points,
    level: progress.level,
    total_activities: progress.total_activities,
    success_rate: progress.success_rate
  };

  sendSuccessResponse(res, 200, 'Achievements retrieved successfully', achievements);
});

// Routes
router.get('/:userId', validateObjectId('userId'), getUserProgress);
router.put('/:userId', validateObjectId('userId'), updateUserProgress);
router.post('/:userId/badges', validateObjectId('userId'), addBadge);
router.post('/:userId/check-badges', validateObjectId('userId'), checkBadges);
router.get('/:userId/achievements', validateObjectId('userId'), getUserAchievements);
router.get('/leaderboard', getLeaderboard);

module.exports = router;