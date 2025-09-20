const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');
const { validateMessage, validateObjectId, validatePagination } = require('../middleware/validation');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');

// All routes are protected
router.use(protect);

// @desc    Get team messages
// @route   GET /api/messages/team/:teamId
// @access  Private
const getTeamMessages = asyncHandler(async (req, res) => {
  const { limit = 50, skip = 0 } = req.query;

  const messages = await Message.getTeamMessages(req.params.teamId, parseInt(limit), parseInt(skip));

  sendSuccessResponse(res, 200, 'Team messages retrieved successfully', messages);
});

// @desc    Send message to team
// @route   POST /api/messages/team/:teamId
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { message, message_type = 'text', reply_to, priority = 'normal' } = req.body;

  const newMessage = await Message.create({
    team_id: req.params.teamId,
    user_id: req.user._id,
    message,
    message_type,
    reply_to,
    priority
  });

  const populatedMessage = await Message.findById(newMessage._id)
    .populate('user_id', 'name email profile_picture')
    .populate('reply_to', 'message user_id');

  sendSuccessResponse(res, 201, 'Message sent successfully', populatedMessage);
});

// @desc    Edit message
// @route   PUT /api/messages/:id
// @access  Private
const editMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;

  const updatedMessage = await Message.editMessage(req.params.id, req.user._id, message);

  if (!updatedMessage) {
    return sendErrorResponse(res, 404, 'Message not found or you are not authorized to edit it');
  }

  sendSuccessResponse(res, 200, 'Message edited successfully', updatedMessage);
});

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
const deleteMessage = asyncHandler(async (req, res) => {
  const deletedMessage = await Message.deleteMessage(req.params.id, req.user._id);

  if (!deletedMessage) {
    return sendErrorResponse(res, 404, 'Message not found or you are not authorized to delete it');
  }

  sendSuccessResponse(res, 200, 'Message deleted successfully');
});

// @desc    Add reaction to message
// @route   POST /api/messages/:id/reaction
// @access  Private
const addReaction = asyncHandler(async (req, res) => {
  const { emoji } = req.body;

  if (!emoji) {
    return sendErrorResponse(res, 400, 'Emoji is required');
  }

  const message = await Message.addReaction(req.params.id, req.user._id, emoji);

  if (!message) {
    return sendErrorResponse(res, 404, 'Message not found');
  }

  sendSuccessResponse(res, 200, 'Reaction added successfully', message);
});

// @desc    Remove reaction from message
// @route   DELETE /api/messages/:id/reaction
// @access  Private
const removeReaction = asyncHandler(async (req, res) => {
  const message = await Message.removeReaction(req.params.id, req.user._id);

  if (!message) {
    return sendErrorResponse(res, 404, 'Message not found');
  }

  sendSuccessResponse(res, 200, 'Reaction removed successfully', message);
});

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
const markMessageAsRead = asyncHandler(async (req, res) => {
  const message = await Message.markAsRead(req.params.id, req.user._id);

  if (!message) {
    return sendErrorResponse(res, 404, 'Message not found');
  }

  sendSuccessResponse(res, 200, 'Message marked as read', message);
});

// @desc    Get unread message count for team
// @route   GET /api/messages/team/:teamId/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Message.getUnreadCount(req.params.teamId, req.user._id);

  sendSuccessResponse(res, 200, 'Unread count retrieved successfully', { count });
});

// @desc    Search messages in team
// @route   GET /api/messages/team/:teamId/search
// @access  Private
const searchMessages = asyncHandler(async (req, res) => {
  const { q, limit = 20 } = req.query;

  if (!q) {
    return sendErrorResponse(res, 400, 'Search query is required');
  }

  const messages = await Message.searchMessages(req.params.teamId, q, parseInt(limit));

  sendSuccessResponse(res, 200, 'Search results retrieved successfully', {
    query: q,
    messages
  });
});

// @desc    Get message statistics for team
// @route   GET /api/messages/team/:teamId/stats
// @access  Private
const getMessageStats = asyncHandler(async (req, res) => {
  const stats = await Message.getMessageStats(req.params.teamId);

  sendSuccessResponse(res, 200, 'Message statistics retrieved successfully', stats);
});

// Routes
router.get('/team/:teamId', validateObjectId('teamId'), validatePagination, getTeamMessages);
router.post('/team/:teamId', validateObjectId('teamId'), validateMessage, sendMessage);
router.put('/:id', validateObjectId('id'), editMessage);
router.delete('/:id', validateObjectId('id'), deleteMessage);
router.post('/:id/reaction', validateObjectId('id'), addReaction);
router.delete('/:id/reaction', validateObjectId('id'), removeReaction);
router.put('/:id/read', validateObjectId('id'), markMessageAsRead);
router.get('/team/:teamId/unread-count', validateObjectId('teamId'), getUnreadCount);
router.get('/team/:teamId/search', validateObjectId('teamId'), searchMessages);
router.get('/team/:teamId/stats', validateObjectId('teamId'), getMessageStats);

module.exports = router;