const Opportunity = require('../models/Opportunity');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');

// @desc    Get all opportunities
// @route   GET /api/opportunities
// @access  Public
const getOpportunities = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { is_active: true };

  // Filter by type
  if (req.query.type) {
    query.type = req.query.type;
  }

  // Filter by domain (for hackathons)
  if (req.query.domain) {
    const domains = req.query.domain.split(',');
    query.domain = { $in: domains };
  }

  // Filter by skills
  if (req.query.skills) {
    const skills = req.query.skills.split(',');
    query.skills_required = { $in: skills };
  }

  // Filter by mode
  if (req.query.mode) {
    query.mode = req.query.mode;
  }

  // Filter by company (for internships)
  if (req.query.company) {
    query.company = { $regex: req.query.company, $options: 'i' };
  }

  // Filter by organizer (for hackathons)
  if (req.query.organizer) {
    query.organizer = { $regex: req.query.organizer, $options: 'i' };
  }

  // Filter by location (for internships)
  if (req.query.location) {
    query.location = { $regex: req.query.location, $options: 'i' };
  }

  // Filter by upcoming deadlines
  if (req.query.upcoming === 'true') {
    const now = new Date();
    query.deadline = { $gt: now };
  }

  // Filter by status
  if (req.query.status) {
    const now = new Date();
    if (req.query.status === 'open') {
      query.deadline = { $gt: now };
    } else if (req.query.status === 'closed') {
      query.deadline = { $lt: now };
    }
  }

  // Search
  if (req.query.search) {
    query.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { company: { $regex: req.query.search, $options: 'i' } },
      { organizer: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  // Sort options
  let sort = {};
  if (req.query.sort) {
    const sortField = req.query.sort;
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    sort[sortField] = sortOrder;
  } else {
    sort = { deadline: 1 }; // Sort by deadline by default
  }

  const opportunities = await Opportunity.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Opportunity.countDocuments(query);

  sendSuccessResponse(res, 200, 'Opportunities retrieved successfully', {
    opportunities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single opportunity
// @route   GET /api/opportunities/:id
// @access  Public
const getOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findById(req.params.id);

  if (!opportunity || !opportunity.is_active) {
    return sendErrorResponse(res, 404, 'Opportunity not found');
  }

  // Increment application count (for analytics)
  await Opportunity.findByIdAndUpdate(
    req.params.id,
    { $inc: { application_count: 1 } }
  );

  sendSuccessResponse(res, 200, 'Opportunity retrieved successfully', opportunity);
});

// @desc    Create new opportunity
// @route   POST /api/opportunities
// @access  Private/Admin
const createOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.create(req.body);

  sendSuccessResponse(res, 201, 'Opportunity created successfully', opportunity);
});

// @desc    Update opportunity
// @route   PUT /api/opportunities/:id
// @access  Private/Admin
const updateOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!opportunity) {
    return sendErrorResponse(res, 404, 'Opportunity not found');
  }

  sendSuccessResponse(res, 200, 'Opportunity updated successfully', opportunity);
});

// @desc    Delete opportunity
// @route   DELETE /api/opportunities/:id
// @access  Private/Admin
const deleteOpportunity = asyncHandler(async (req, res) => {
  const opportunity = await Opportunity.findByIdAndUpdate(
    req.params.id,
    { is_active: false },
    { new: true }
  );

  if (!opportunity) {
    return sendErrorResponse(res, 404, 'Opportunity not found');
  }

  sendSuccessResponse(res, 200, 'Opportunity deactivated successfully');
});

// @desc    Get hackathons
// @route   GET /api/opportunities/hackathons
// @access  Public
const getHackathons = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { type: 'hackathon', is_active: true };

  // Apply filters
  if (req.query.domain) {
    const domains = req.query.domain.split(',');
    query.domain = { $in: domains };
  }

  if (req.query.mode) {
    query.mode = req.query.mode;
  }

  if (req.query.organizer) {
    query.organizer = { $regex: req.query.organizer, $options: 'i' };
  }

  if (req.query.upcoming === 'true') {
    const now = new Date();
    query.deadline = { $gt: now };
  }

  const hackathons = await Opportunity.find(query)
    .sort({ deadline: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Opportunity.countDocuments(query);

  sendSuccessResponse(res, 200, 'Hackathons retrieved successfully', {
    hackathons,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get internships
// @route   GET /api/opportunities/internships
// @access  Public
const getInternships = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { type: 'internship', is_active: true };

  // Apply filters
  if (req.query.company) {
    query.company = { $regex: req.query.company, $options: 'i' };
  }

  if (req.query.location) {
    query.location = { $regex: req.query.location, $options: 'i' };
  }

  if (req.query.mode) {
    query.mode = req.query.mode;
  }

  if (req.query.skills) {
    const skills = req.query.skills.split(',');
    query.skills_required = { $in: skills };
  }

  if (req.query.degree) {
    query.degree_required = { $in: [req.query.degree, 'Any'] };
  }

  if (req.query.year) {
    query.year_of_study = { $in: [parseInt(req.query.year), 0] };
  }

  if (req.query.upcoming === 'true') {
    const now = new Date();
    query.deadline = { $gt: now };
  }

  const internships = await Opportunity.find(query)
    .sort({ deadline: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Opportunity.countDocuments(query);

  sendSuccessResponse(res, 200, 'Internships retrieved successfully', {
    internships,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get opportunities for specific student
// @route   GET /api/opportunities/for-student/:userId
// @access  Private
const getOpportunitiesForStudent = asyncHandler(async (req, res) => {
  const User = require('../models/User');
  const user = await User.findById(req.params.userId);

  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  let opportunities = [];

  if (user.role === 'university') {
    // Get internships matching user's degree and year
    const internships = await Opportunity.findForStudent(
      user.education.degree,
      user.education.year
    );

    // Get hackathons matching user's interests
    const hackathons = await Opportunity.findByDomain(user.preferences.interests);

    opportunities = [...internships, ...hackathons];
  }

  sendSuccessResponse(res, 200, 'Opportunities for student retrieved successfully', {
    user: {
      name: user.name,
      role: user.role,
      interests: user.preferences.interests
    },
    opportunities
  });
});

// @desc    Get upcoming opportunities
// @route   GET /api/opportunities/upcoming
// @access  Public
const getUpcomingOpportunities = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const type = req.query.type; // 'hackathon' or 'internship'

  const query = { is_active: true };
  if (type) {
    query.type = type;
  }

  const opportunities = await Opportunity.findUpcoming()
    .find(query)
    .sort({ deadline: 1 })
    .limit(limit);

  sendSuccessResponse(res, 200, 'Upcoming opportunities retrieved successfully', opportunities);
});

// @desc    Get opportunity statistics
// @route   GET /api/opportunities/stats
// @access  Public
const getOpportunityStats = asyncHandler(async (req, res) => {
  const stats = await Opportunity.aggregate([
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

  const totalOpportunities = await Opportunity.countDocuments({ is_active: true });
  const upcomingOpportunities = await Opportunity.countDocuments({
    is_active: true,
    deadline: { $gt: new Date() }
  });

  sendSuccessResponse(res, 200, 'Opportunity statistics retrieved successfully', {
    total_opportunities: totalOpportunities,
    upcoming_opportunities: upcomingOpportunities,
    by_type: stats
  });
});

// @desc    Search opportunities
// @route   GET /api/opportunities/search
// @access  Public
const searchOpportunities = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (!q) {
    return sendErrorResponse(res, 400, 'Search query is required');
  }

  const query = {
    is_active: true,
    $or: [
      { title: { $regex: q, $options: 'i' } },
      { company: { $regex: q, $options: 'i' } },
      { organizer: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { skills_required: { $regex: q, $options: 'i' } },
      { domain: { $regex: q, $options: 'i' } }
    ]
  };

  const opportunities = await Opportunity.find(query)
    .sort({ deadline: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Opportunity.countDocuments(query);

  sendSuccessResponse(res, 200, 'Search results retrieved successfully', {
    query: q,
    opportunities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

module.exports = {
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
};