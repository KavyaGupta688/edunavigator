const Recommendation = require('../models/Recommendation');
const User = require('../models/User');
const Exam = require('../models/Exam');
const Opportunity = require('../models/Opportunity');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');

// @desc    Get recommendations for user
// @route   GET /api/recommendations/:userId
// @access  Private
const getUserRecommendations = asyncHandler(async (req, res) => {
  const { entityType, limit } = req.query;
  const limitNum = parseInt(limit) || 20;

  const user = await User.findById(req.params.userId);
  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  const recommendations = await Recommendation.findForUser(req.params.userId, entityType, limitNum);

  sendSuccessResponse(res, 200, 'Recommendations retrieved successfully', {
    user: {
      _id: user._id,
      name: user.name,
      role: user.role,
      interests: user.preferences.interests
    },
    recommendations
  });
});

// @desc    Get top recommendations for user
// @route   GET /api/recommendations/:userId/top
// @access  Private
const getTopRecommendations = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const limitNum = parseInt(limit) || 10;

  const user = await User.findById(req.params.userId);
  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  const recommendations = await Recommendation.findTopRecommendations(req.params.userId, limitNum);

  sendSuccessResponse(res, 200, 'Top recommendations retrieved successfully', {
    user: {
      _id: user._id,
      name: user.name,
      role: user.role
    },
    recommendations
  });
});

// @desc    Update recommendation interaction
// @route   PUT /api/recommendations/:id/interaction
// @access  Private
const updateRecommendationInteraction = asyncHandler(async (req, res) => {
  const { interactionType } = req.body;

  if (!['viewed', 'saved', 'applied'].includes(interactionType)) {
    return sendErrorResponse(res, 400, 'Invalid interaction type');
  }

  const recommendation = await Recommendation.updateInteraction(req.params.id, interactionType);

  if (!recommendation) {
    return sendErrorResponse(res, 404, 'Recommendation not found');
  }

  sendSuccessResponse(res, 200, 'Recommendation interaction updated successfully', recommendation);
});

// @desc    Generate new recommendations for user
// @route   POST /api/recommendations/:userId/generate
// @access  Private
const generateRecommendations = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  // Clear existing recommendations
  await Recommendation.deleteMany({ user_id: req.params.userId });

  const newRecommendations = [];

  if (user.role === 'school') {
    // Generate exam recommendations for school students
    const exams = await Exam.find({
      is_active: true,
      'events.date': { $gt: new Date() }
    }).limit(20);

    for (const exam of exams) {
      let score = 0.5; // Base score

      // Score based on user's stream
      if (user.school_info && user.school_info.stream === 'Science') {
        if (exam.subjects.includes('Physics') || exam.subjects.includes('Chemistry') || exam.subjects.includes('Maths')) {
          score += 0.3;
        }
      }

      // Score based on user's interests
      if (user.preferences.interests && user.preferences.interests.length > 0) {
        const matchingInterests = user.preferences.interests.filter(interest =>
          exam.exam_name.toLowerCase().includes(interest.toLowerCase()) ||
          exam.subjects.some(subject => subject.toLowerCase().includes(interest.toLowerCase()))
        );
        score += (matchingInterests.length / user.preferences.interests.length) * 0.2;
      }

      if (score > 0.6) {
        newRecommendations.push({
          user_id: user._id,
          entity_type: 'exam',
          entity_id: exam._id,
          entity_type_ref: 'Exam',
          score: Math.min(score, 1.0),
          algorithm_used: 'rule_based',
          recommendation_reasons: [
            { reason: 'Matches your academic stream', weight: 0.3 },
            { reason: 'Aligns with your interests', weight: 0.2 }
          ]
        });
      }
    }
  } else {
    // Generate opportunity recommendations for university students
    const opportunities = await Opportunity.find({
      is_active: true,
      deadline: { $gt: new Date() }
    }).limit(30);

    for (const opportunity of opportunities) {
      let score = 0.5; // Base score

      // Score based on user's interests
      if (user.preferences.interests && user.preferences.interests.length > 0) {
        const matchingInterests = user.preferences.interests.filter(interest =>
          opportunity.title.toLowerCase().includes(interest.toLowerCase()) ||
          opportunity.skills_required.some(skill => skill.toLowerCase().includes(interest.toLowerCase())) ||
          (opportunity.domain && opportunity.domain.some(domain => domain.toLowerCase().includes(interest.toLowerCase())))
        );
        score += (matchingInterests.length / user.preferences.interests.length) * 0.3;
      }

      // Score based on user's degree and year
      if (opportunity.type === 'internship') {
        if (opportunity.degree_required.includes(user.education.degree) || opportunity.degree_required.includes('Any')) {
          score += 0.2;
        }
        if (opportunity.year_of_study.includes(user.education.year) || opportunity.year_of_study.includes(0)) {
          score += 0.2;
        }
      }

      if (score > 0.6) {
        newRecommendations.push({
          user_id: user._id,
          entity_type: 'opportunity',
          entity_id: opportunity._id,
          entity_type_ref: 'Opportunity',
          score: Math.min(score, 1.0),
          algorithm_used: 'rule_based',
          recommendation_reasons: [
            { reason: 'Matches your interests', weight: 0.3 },
            { reason: 'Suitable for your degree and year', weight: 0.2 }
          ]
        });
      }
    }
  }

  // Save new recommendations
  if (newRecommendations.length > 0) {
    await Recommendation.insertMany(newRecommendations);
  }

  sendSuccessResponse(res, 200, 'Recommendations generated successfully', {
    user: {
      _id: user._id,
      name: user.name,
      role: user.role
    },
    recommendations_generated: newRecommendations.length
  });
});

// @desc    Get recommendation analytics for user
// @route   GET /api/recommendations/:userId/analytics
// @access  Private
const getRecommendationAnalytics = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  const analytics = await Recommendation.getAnalytics(req.params.userId);

  sendSuccessResponse(res, 200, 'Recommendation analytics retrieved successfully', {
    user: {
      _id: user._id,
      name: user.name,
      role: user.role
    },
    analytics
  });
});

// @desc    Get similar users
// @route   GET /api/recommendations/:userId/similar
// @access  Private
const getSimilarUsers = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  // Find users with similar interests
  const similarUsers = await User.findByInterests(user.preferences.interests)
    .find({ _id: { $ne: user._id } })
    .limit(10)
    .select('name email preferences.interests role');

  sendSuccessResponse(res, 200, 'Similar users retrieved successfully', {
    user: {
      _id: user._id,
      name: user.name,
      interests: user.preferences.interests
    },
    similar_users: similarUsers
  });
});

// @desc    Get trending recommendations
// @route   GET /api/recommendations/trending
// @access  Public
const getTrendingRecommendations = asyncHandler(async (req, res) => {
  const { type, limit } = req.query;
  const limitNum = parseInt(limit) || 10;

  let trendingItems = [];

  if (!type || type === 'exams') {
    const trendingExams = await Exam.find({
      is_active: true,
      'events.date': { $gt: new Date() }
    })
      .sort({ created_at: -1 })
      .limit(limitNum);

    trendingItems = [...trendingItems, ...trendingExams.map(exam => ({
      ...exam.toObject(),
      entity_type: 'exam'
    }))];
  }

  if (!type || type === 'opportunities') {
    const trendingOpportunities = await Opportunity.find({
      is_active: true,
      deadline: { $gt: new Date() }
    })
      .sort({ application_count: -1, created_at: -1 })
      .limit(limitNum);

    trendingItems = [...trendingItems, ...trendingOpportunities.map(opp => ({
      ...opp.toObject(),
      entity_type: 'opportunity'
    }))];
  }

  // Sort by creation date
  trendingItems.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  sendSuccessResponse(res, 200, 'Trending recommendations retrieved successfully', {
    type: type || 'all',
    items: trendingItems.slice(0, limitNum)
  });
});

// @desc    Get recommendation performance metrics
// @route   GET /api/recommendations/metrics
// @access  Private/Admin
const getRecommendationMetrics = asyncHandler(async (req, res) => {
  const metrics = await Recommendation.aggregate([
    {
      $group: {
        _id: '$algorithm_used',
        total_recommendations: { $sum: 1 },
        avg_score: { $avg: '$score' },
        viewed_count: { $sum: { $cond: ['$user_interaction.viewed', 1, 0] } },
        saved_count: { $sum: { $cond: ['$user_interaction.saved', 1, 0] } },
        applied_count: { $sum: { $cond: ['$user_interaction.applied', 1, 0] } }
      }
    }
  ]);

  const totalRecommendations = await Recommendation.countDocuments();
  const activeRecommendations = await Recommendation.countDocuments({
    is_active: true,
    expires_at: { $gt: new Date() }
  });

  sendSuccessResponse(res, 200, 'Recommendation metrics retrieved successfully', {
    total_recommendations: totalRecommendations,
    active_recommendations: activeRecommendations,
    by_algorithm: metrics
  });
});

module.exports = {
  getUserRecommendations,
  getTopRecommendations,
  updateRecommendationInteraction,
  generateRecommendations,
  getRecommendationAnalytics,
  getSimilarUsers,
  getTrendingRecommendations,
  getRecommendationMetrics
};