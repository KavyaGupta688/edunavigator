const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');

// All routes are protected
router.use(protect);

// @desc    Get user notifications
// @route   GET /api/notifications/:userId
// @access  Private
const getUserNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unread_only = false } = req.query;
  const skip = (page - 1) * limit;

  // Mock notification data - in real implementation, you'd have a Notification model
  const notifications = [
    {
      _id: '1',
      title: 'Exam Deadline Reminder',
      message: 'JEE Main 2026 registration ends in 3 days',
      type: 'exam_deadline',
      is_read: false,
      created_at: new Date(),
      priority: 'high'
    },
    {
      _id: '2',
      title: 'New Hackathon Available',
      message: 'AI for Social Good hackathon is now open for registration',
      type: 'opportunity',
      is_read: true,
      created_at: new Date(Date.now() - 86400000),
      priority: 'medium'
    }
  ];

  const filteredNotifications = unread_only === 'true' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const paginatedNotifications = filteredNotifications.slice(skip, skip + parseInt(limit));

  sendSuccessResponse(res, 200, 'Notifications retrieved successfully', {
    notifications: paginatedNotifications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: filteredNotifications.length,
      pages: Math.ceil(filteredNotifications.length / limit)
    }
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationAsRead = asyncHandler(async (req, res) => {
  // In real implementation, you'd update the notification in database
  sendSuccessResponse(res, 200, 'Notification marked as read');
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/:userId/read-all
// @access  Private
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  // In real implementation, you'd update all user notifications in database
  sendSuccessResponse(res, 200, 'All notifications marked as read');
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  // In real implementation, you'd delete the notification from database
  sendSuccessResponse(res, 200, 'Notification deleted successfully');
});

// @desc    Get notification settings
// @route   GET /api/notifications/:userId/settings
// @access  Private
const getNotificationSettings = asyncHandler(async (req, res) => {
  const settings = {
    email_notifications: true,
    push_notifications: true,
    exam_deadlines: true,
    new_opportunities: true,
    team_updates: true,
    weekly_digest: true
  };

  sendSuccessResponse(res, 200, 'Notification settings retrieved successfully', settings);
});

// @desc    Update notification settings
// @route   PUT /api/notifications/:userId/settings
// @access  Private
const updateNotificationSettings = asyncHandler(async (req, res) => {
  const { email_notifications, push_notifications, exam_deadlines, new_opportunities, team_updates, weekly_digest } = req.body;

  // In real implementation, you'd update user's notification preferences
  const updatedSettings = {
    email_notifications: email_notifications !== undefined ? email_notifications : true,
    push_notifications: push_notifications !== undefined ? push_notifications : true,
    exam_deadlines: exam_deadlines !== undefined ? exam_deadlines : true,
    new_opportunities: new_opportunities !== undefined ? new_opportunities : true,
    team_updates: team_updates !== undefined ? team_updates : true,
    weekly_digest: weekly_digest !== undefined ? weekly_digest : true
  };

  sendSuccessResponse(res, 200, 'Notification settings updated successfully', updatedSettings);
});

// @desc    Send test notification
// @route   POST /api/notifications/:userId/test
// @access  Private
const sendTestNotification = asyncHandler(async (req, res) => {
  const { type = 'test', message = 'This is a test notification' } = req.body;

  // In real implementation, you'd send actual notification
  sendSuccessResponse(res, 200, 'Test notification sent successfully', {
    type,
    message,
    sent_at: new Date()
  });
});

// Routes
router.get('/:userId', validateObjectId('userId'), validatePagination, getUserNotifications);
router.put('/:id/read', validateObjectId('id'), markNotificationAsRead);
router.put('/:userId/read-all', validateObjectId('userId'), markAllNotificationsAsRead);
router.delete('/:id', validateObjectId('id'), deleteNotification);
router.get('/:userId/settings', validateObjectId('userId'), getNotificationSettings);
router.put('/:userId/settings', validateObjectId('userId'), updateNotificationSettings);
router.post('/:userId/test', validateObjectId('userId'), sendTestNotification);

module.exports = router;