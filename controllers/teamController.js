const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
const Opportunity = require('../models/Opportunity');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');

// @desc    Get all teams
// @route   GET /api/teams
// @access  Public
const getTeams = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { is_public: true };

  // Filter by opportunity
  if (req.query.opp_id) {
    query.opp_id = req.query.opp_id;
  }

  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Filter by skills needed
  if (req.query.skills) {
    const skills = req.query.skills.split(',');
    query.skills_needed = { $in: skills };
  }

  // Search by team name
  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: 'i' };
  }

  const teams = await Team.find(query)
    .populate('opp_id', 'title type deadline')
    .populate('created_by', 'name email')
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Team.countDocuments(query);

  sendSuccessResponse(res, 200, 'Teams retrieved successfully', {
    teams,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single team
// @route   GET /api/teams/:id
// @access  Public
const getTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('opp_id', 'title type deadline description')
    .populate('created_by', 'name email profile_picture');

  if (!team) {
    return sendErrorResponse(res, 404, 'Team not found');
  }

  // Get team members
  const members = await TeamMember.getTeamMembers(req.params.id);

  sendSuccessResponse(res, 200, 'Team retrieved successfully', {
    team,
    members
  });
});

// @desc    Create new team
// @route   POST /api/teams
// @access  Private
const createTeam = asyncHandler(async (req, res) => {
  const { opp_id, name, description, max_members, skills_needed, requirements } = req.body;

  // Verify opportunity exists
  const opportunity = await Opportunity.findById(opp_id);
  if (!opportunity) {
    return sendErrorResponse(res, 404, 'Opportunity not found');
  }

  // Check if user can create team for this opportunity
  if (opportunity.type !== 'hackathon') {
    return sendErrorResponse(res, 400, 'Teams can only be created for hackathons');
  }

  const team = await Team.create({
    opp_id,
    name,
    description,
    max_members: max_members || 4,
    skills_needed,
    requirements,
    created_by: req.user._id
  });

  // Add creator as team leader
  await TeamMember.addMember(team._id, req.user._id, 'leader');

  const populatedTeam = await Team.findById(team._id)
    .populate('opp_id', 'title type deadline')
    .populate('created_by', 'name email');

  sendSuccessResponse(res, 201, 'Team created successfully', populatedTeam);
});

// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private
const updateTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);

  if (!team) {
    return sendErrorResponse(res, 404, 'Team not found');
  }

  // Check if user is team leader
  const isLeader = await TeamMember.isTeamLeader(req.params.id, req.user._id);
  if (!isLeader) {
    return sendErrorResponse(res, 403, 'Only team leaders can update team details');
  }

  const updatedTeam = await Team.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )
    .populate('opp_id', 'title type deadline')
    .populate('created_by', 'name email');

  sendSuccessResponse(res, 200, 'Team updated successfully', updatedTeam);
});

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private
const deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);

  if (!team) {
    return sendErrorResponse(res, 404, 'Team not found');
  }

  // Check if user is team leader
  const isLeader = await TeamMember.isTeamLeader(req.params.id, req.user._id);
  if (!isLeader) {
    return sendErrorResponse(res, 403, 'Only team leaders can delete team');
  }

  // Update team status to disbanded
  team.status = 'disbanded';
  await team.save();

  sendSuccessResponse(res, 200, 'Team disbanded successfully');
});

// @desc    Join team
// @route   POST /api/teams/:id/join
// @access  Private
const joinTeam = asyncHandler(async (req, res) => {
  const { skills } = req.body;

  const team = await Team.findById(req.params.id);
  if (!team) {
    return sendErrorResponse(res, 404, 'Team not found');
  }

  if (team.status !== 'recruiting') {
    return sendErrorResponse(res, 400, 'Team is not accepting new members');
  }

  // Check if user is already a member
  const existingMember = await TeamMember.findOne({
    team_id: req.params.id,
    user_id: req.user._id
  });

  if (existingMember) {
    return sendErrorResponse(res, 400, 'You are already a member of this team');
  }

  // Add user as team member
  const member = await TeamMember.addMember(req.params.id, req.user._id, 'member', skills);

  sendSuccessResponse(res, 200, 'Successfully joined team', member);
});

// @desc    Leave team
// @route   DELETE /api/teams/:id/leave
// @access  Private
const leaveTeam = asyncHandler(async (req, res) => {
  const member = await TeamMember.findOne({
    team_id: req.params.id,
    user_id: req.user._id
  });

  if (!member) {
    return sendErrorResponse(res, 404, 'You are not a member of this team');
  }

  // Check if user is team leader
  if (member.role === 'leader') {
    return sendErrorResponse(res, 400, 'Team leaders cannot leave. Transfer leadership first.');
  }

  await TeamMember.removeMember(req.params.id, req.user._id);

  sendSuccessResponse(res, 200, 'Successfully left team');
});

// @desc    Remove team member
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private
const removeTeamMember = asyncHandler(async (req, res) => {
  // Check if user is team leader
  const isLeader = await TeamMember.isTeamLeader(req.params.id, req.user._id);
  if (!isLeader) {
    return sendErrorResponse(res, 403, 'Only team leaders can remove members');
  }

  const member = await TeamMember.findOne({
    team_id: req.params.id,
    user_id: req.params.userId
  });

  if (!member) {
    return sendErrorResponse(res, 404, 'Member not found');
  }

  if (member.role === 'leader') {
    return sendErrorResponse(res, 400, 'Cannot remove team leader');
  }

  await TeamMember.removeMember(req.params.id, req.params.userId);

  sendSuccessResponse(res, 200, 'Member removed successfully');
});

// @desc    Transfer team leadership
// @route   PUT /api/teams/:id/transfer-leadership
// @access  Private
const transferLeadership = asyncHandler(async (req, res) => {
  const { newLeaderId } = req.body;

  // Check if current user is team leader
  const isLeader = await TeamMember.isTeamLeader(req.params.id, req.user._id);
  if (!isLeader) {
    return sendErrorResponse(res, 403, 'Only team leaders can transfer leadership');
  }

  // Check if new leader is a team member
  const newLeader = await TeamMember.findOne({
    team_id: req.params.id,
    user_id: newLeaderId,
    status: 'active'
  });

  if (!newLeader) {
    return sendErrorResponse(res, 404, 'New leader must be an active team member');
  }

  await TeamMember.transferLeadership(req.params.id, req.user._id, newLeaderId);

  sendSuccessResponse(res, 200, 'Leadership transferred successfully');
});

// @desc    Get teams for opportunity
// @route   GET /api/teams/opportunity/:oppId
// @access  Public
const getTeamsForOpportunity = asyncHandler(async (req, res) => {
  const teams = await Team.findByOpportunity(req.params.oppId);

  sendSuccessResponse(res, 200, 'Teams for opportunity retrieved successfully', teams);
});

// @desc    Get user's teams
// @route   GET /api/teams/user/:userId
// @access  Private
const getUserTeams = asyncHandler(async (req, res) => {
  const teams = await TeamMember.getUserTeams(req.params.userId);

  sendSuccessResponse(res, 200, 'User teams retrieved successfully', teams);
});

// @desc    Get available teams for user
// @route   GET /api/teams/available
// @access  Private
const getAvailableTeams = asyncHandler(async (req, res) => {
  const { skills } = req.query;
  const skillsArray = skills ? skills.split(',') : [];

  const teams = await Team.findAvailableForUser(req.user._id, skillsArray);

  sendSuccessResponse(res, 200, 'Available teams retrieved successfully', teams);
});

// @desc    Get team statistics
// @route   GET /api/teams/:id/stats
// @access  Public
const getTeamStats = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  if (!team) {
    return sendErrorResponse(res, 404, 'Team not found');
  }

  const stats = await TeamMember.getTeamStats(req.params.id);

  sendSuccessResponse(res, 200, 'Team statistics retrieved successfully', {
    team: {
      _id: team._id,
      name: team.name,
      status: team.status
    },
    stats
  });
});

module.exports = {
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
};