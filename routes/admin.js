const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { validatePagination, validateObjectId } = require('../middleware/validation');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');

// All routes are admin only
router.use(protect);
router.use(authorize('admin'));

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getSystemStats = asyncHandler(async (req, res) => {
  const User = require('../models/User');
  const Exam = require('../models/Exam');
  const Opportunity = require('../models/Opportunity');
  const Team = require('../models/Team');
  const Recommendation = require('../models/Recommendation');

  const [
    totalUsers,
    activeUsers,
    totalExams,
    activeExams,
    totalOpportunities,
    activeOpportunities,
    totalTeams,
    activeTeams,
    totalRecommendations
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ is_active: true }),
    Exam.countDocuments(),
    Exam.countDocuments({ is_active: true }),
    Opportunity.countDocuments(),
    Opportunity.countDocuments({ is_active: true }),
    Team.countDocuments(),
    Team.countDocuments({ status: { $in: ['recruiting', 'full'] } }),
    Recommendation.countDocuments()
  ]);

  const stats = {
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers
    },
    exams: {
      total: totalExams,
      active: activeExams,
      inactive: totalExams - activeExams
    },
    opportunities: {
      total: totalOpportunities,
      active: activeOpportunities,
      inactive: totalOpportunities - activeOpportunities
    },
    teams: {
      total: totalTeams,
      active: activeTeams,
      inactive: totalTeams - activeTeams
    },
    recommendations: {
      total: totalRecommendations
    }
  };

  sendSuccessResponse(res, 200, 'System statistics retrieved successfully', stats);
});

// @desc    Get user analytics
// @route   GET /api/admin/analytics/users
// @access  Private/Admin
const getUserAnalytics = asyncHandler(async (req, res) => {
  const User = require('../models/User');

  const analytics = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        avg_interests: { $avg: { $size: '$preferences.interests' } }
      }
    }
  ]);

  const recentUsers = await User.find()
    .sort({ created_at: -1 })
    .limit(10)
    .select('name email role created_at');

  sendSuccessResponse(res, 200, 'User analytics retrieved successfully', {
    by_role: analytics,
    recent_users: recentUsers
  });
});

// @desc    Get exam analytics
// @route   GET /api/admin/analytics/exams
// @access  Private/Admin
const getExamAnalytics = asyncHandler(async (req, res) => {
  const Exam = require('../models/Exam');

  const analytics = await Exam.aggregate([
    { $match: { is_active: true } },
    {
      $group: {
        _id: '$exam_type',
        count: { $sum: 1 },
        avg_fee: { $avg: '$registration_fee' }
      }
    }
  ]);

  const upcomingExams = await Exam.find({
    is_active: true,
    'events.date': { $gt: new Date() }
  })
    .sort({ 'events.date': 1 })
    .limit(10)
    .select('exam_name year events');

  sendSuccessResponse(res, 200, 'Exam analytics retrieved successfully', {
    by_type: analytics,
    upcoming_exams: upcomingExams
  });
});

// @desc    Get opportunity analytics
// @route   GET /api/admin/analytics/opportunities
// @access  Private/Admin
const getOpportunityAnalytics = asyncHandler(async (req, res) => {
  const Opportunity = require('../models/Opportunity');

  const analytics = await Opportunity.aggregate([
    { $match: { is_active: true } },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        avg_prize: { $avg: '$prize' },
        avg_stipend: { $avg: '$stipend' }
      }
    }
  ]);

  const popularOpportunities = await Opportunity.find({ is_active: true })
    .sort({ application_count: -1 })
    .limit(10)
    .select('title type application_count deadline');

  sendSuccessResponse(res, 200, 'Opportunity analytics retrieved successfully', {
    by_type: analytics,
    popular_opportunities: popularOpportunities
  });
});

// @desc    Get system logs
// @route   GET /api/admin/logs
// @access  Private/Admin
const getSystemLogs = asyncHandler(async (req, res) => {
  const UpdateLog = require('../models/UpdateLog');

  const { page = 1, limit = 50, entity, severity } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (entity) query.entity = entity;
  if (severity) query.severity = severity;

  const logs = await UpdateLog.find(query)
    .sort({ change_date: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('affected_users', 'name email');

  const total = await UpdateLog.countDocuments(query);

  sendSuccessResponse(res, 200, 'System logs retrieved successfully', {
    logs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get critical updates
// @route   GET /api/admin/critical-updates
// @access  Private/Admin
const getCriticalUpdates = asyncHandler(async (req, res) => {
  const UpdateLog = require('../models/UpdateLog');

  const { hours = 24 } = req.query;
  const criticalUpdates = await UpdateLog.getCriticalUpdates(parseInt(hours));

  sendSuccessResponse(res, 200, 'Critical updates retrieved successfully', criticalUpdates);
});

// @desc    Bulk update opportunities
// @route   PUT /api/admin/bulk-update/opportunities
// @access  Private/Admin
const bulkUpdateOpportunities = asyncHandler(async (req, res) => {
  const { ids, updates } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return sendErrorResponse(res, 400, 'IDs array is required');
  }

  if (!updates || Object.keys(updates).length === 0) {
    return sendErrorResponse(res, 400, 'Updates object is required');
  }

  const Opportunity = require('../models/Opportunity');
  const result = await Opportunity.updateMany(
    { _id: { $in: ids } },
    { $set: updates }
  );

  sendSuccessResponse(res, 200, 'Bulk update completed successfully', {
    matched: result.matchedCount,
    modified: result.modifiedCount
  });
});

// @desc    Export data
// @route   GET /api/admin/export/:type
// @access  Private/Admin
const exportData = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { format = 'json' } = req.query;

  let data = [];

  switch (type) {
    case 'users':
      const User = require('../models/User');
      data = await User.find().select('-password');
      break;
    case 'exams':
      const Exam = require('../models/Exam');
      data = await Exam.find();
      break;
    case 'opportunities':
      const Opportunity = require('../models/Opportunity');
      data = await Opportunity.find();
      break;
    default:
      return sendErrorResponse(res, 400, 'Invalid export type');
  }

  if (format === 'csv') {
    // In real implementation, you'd convert to CSV format
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${type}.csv"`);
    return res.send(JSON.stringify(data));
  }

  sendSuccessResponse(res, 200, 'Data exported successfully', {
    type,
    format,
    count: data.length,
    data
  });
});

// Routes
router.get('/stats', getSystemStats);
router.get('/analytics/users', getUserAnalytics);
router.get('/analytics/exams', getExamAnalytics);
router.get('/analytics/opportunities', getOpportunityAnalytics);
router.get('/logs', validatePagination, getSystemLogs);
router.get('/critical-updates', getCriticalUpdates);
router.put('/bulk-update/opportunities', bulkUpdateOpportunities);
router.get('/export/:type', exportData);

module.exports = router;