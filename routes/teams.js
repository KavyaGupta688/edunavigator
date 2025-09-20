const express = require('express');
const router = express.Router();
const {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  joinTeam,
  leaveTeam,
  removeTeamMember,
  transferLeadership,
  getTeamsForOpportunity,
  getUserTeams,
  getAvailableTeams,
  getTeamStats
} = require('../controllers/teamController');
const { protect } = require('../middleware/auth');
const {
  validateTeam,
  validatePagination,
  validateObjectId,
  validateFilters
} = require('../middleware/validation');

// All routes are protected
router.use(protect);

// Public team routes
router.get('/', validatePagination, validateFilters, getTeams);
router.get('/available', getAvailableTeams);
router.get('/opportunity/:oppId', validateObjectId('oppId'), getTeamsForOpportunity);
router.get('/user/:userId', validateObjectId('userId'), getUserTeams);
router.get('/:id', validateObjectId('id'), getTeam);
router.get('/:id/stats', validateObjectId('id'), getTeamStats);

// Team management routes
router.post('/', validateTeam, createTeam);
router.put('/:id', validateObjectId('id'), validateTeam, updateTeam);
router.delete('/:id', validateObjectId('id'), deleteTeam);

// Team member routes
router.post('/:id/join', validateObjectId('id'), joinTeam);
router.delete('/:id/leave', validateObjectId('id'), leaveTeam);
router.delete('/:id/members/:userId', validateObjectId('id'), validateObjectId('userId'), removeTeamMember);
router.put('/:id/transfer-leadership', validateObjectId('id'), transferLeadership);

module.exports = router;