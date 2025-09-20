const User = require('../models/User');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');

/**
 * Mobile-specific controller functions
 */

// @desc    Update user's push notification token
// @route   PUT /api/mobile/push-token
// @access  Private
const updatePushToken = asyncHandler(async (req, res) => {
  const { push_token, device_type, app_version } = req.body;
  
  if (!push_token) {
    return sendErrorResponse(res, 400, 'Push token is required');
  }
  
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        'mobile.push_token': push_token,
        'mobile.device_type': device_type || 'unknown',
        'mobile.app_version': app_version || '1.0.0',
        'mobile.last_updated': new Date()
      }
    },
    { new: true }
  );
  
  sendSuccessResponse(res, 200, 'Push token updated successfully', {
    user_id: user._id,
    push_token_updated: true
  });
});

// @desc    Get mobile app configuration
// @route   GET /api/mobile/config
// @access  Public
const getMobileConfig = asyncHandler(async (req, res) => {
  const config = {
    app_version: {
      current: '1.0.0',
      minimum: '1.0.0',
      update_required: false
    },
    features: {
      push_notifications: true,
      offline_mode: true,
      dark_mode: true,
      biometric_auth: true
    },
    api_endpoints: {
      base_url: process.env.API_BASE_URL || 'http://localhost:5000/api',
      image_base_url: process.env.IMAGE_BASE_URL || 'http://localhost:5000/uploads'
    },
    limits: {
      max_file_size: 5 * 1024 * 1024, // 5MB
      max_team_members: 10,
      max_message_length: 1000
    },
    cache_settings: {
      exam_data_ttl: 3600, // 1 hour
      opportunity_data_ttl: 1800, // 30 minutes
      user_data_ttl: 900 // 15 minutes
    }
  };
  
  sendSuccessResponse(res, 200, 'Mobile configuration retrieved successfully', config);
});

// @desc    Get mobile-optimized dashboard data
// @route   GET /api/mobile/dashboard/:userId
// @access  Private
const getMobileDashboard = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId)
    .populate('saved_exams', 'exam_name year deadline')
    .populate('saved_hackathons', 'title deadline')
    .populate('saved_internships', 'title company deadline');

  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  const Progress = require('../models/Progress');
  const progress = await Progress.findOne({ user_id: req.params.userId });

  // Get upcoming deadlines (mobile-optimized)
  const now = new Date();
  const upcomingExams = user.saved_exams
    .filter(exam => exam.deadline > now)
    .slice(0, 5); // Limit to 5 for mobile

  const upcomingHackathons = user.saved_hackathons
    .filter(hackathon => hackathon.deadline > now)
    .slice(0, 3);

  const upcomingInternships = user.saved_internships
    .filter(internship => internship.deadline > now)
    .slice(0, 3);

  const dashboard = {
    user: {
      name: user.name,
      role: user.role,
      profile_picture: user.profile_picture,
      level: progress?.level || 1,
      points: progress?.points || 0
    },
    upcoming_deadlines: {
      exams: upcomingExams,
      hackathons: upcomingHackathons,
      internships: upcomingInternships,
      total_count: upcomingExams.length + upcomingHackathons.length + upcomingInternships.length
    },
    quick_stats: {
      total_saved: user.saved_exams.length + user.saved_hackathons.length + user.saved_internships.length,
      badges_earned: progress?.badges?.length || 0,
      streak_days: progress?.streak_days || 0
    },
    mobile_optimized: true
  };

  sendSuccessResponse(res, 200, 'Mobile dashboard retrieved successfully', dashboard);
});

// @desc    Get mobile-optimized recommendations
// @route   GET /api/mobile/recommendations/:userId
// @access  Private
const getMobileRecommendations = asyncHandler(async (req, res) => {
  const { limit = 10, type } = req.query;
  
  const Recommendation = require('../models/Recommendation');
  const recommendations = await Recommendation.findForUser(
    req.params.userId, 
    type, 
    parseInt(limit)
  );

  // Mobile-optimized recommendations
  const mobileRecommendations = recommendations.map(rec => ({
    _id: rec._id,
    entity_type: rec.entity_type,
    entity_id: rec.entity_id,
    score: rec.score,
    title: rec.entity_id.title || rec.entity_id.exam_name,
    deadline: rec.entity_id.deadline || rec.entity_id.events?.[0]?.date,
    type: rec.entity_type,
    reason: rec.recommendation_reasons?.[0]?.reason || 'Recommended for you'
  }));

  sendSuccessResponse(res, 200, 'Mobile recommendations retrieved successfully', {
    recommendations: mobileRecommendations,
    total: mobileRecommendations.length,
    mobile_optimized: true
  });
});

// @desc    Log mobile app analytics
// @route   POST /api/mobile/analytics
// @access  Private
const logMobileAnalytics = asyncHandler(async (req, res) => {
  const { event, data, timestamp } = req.body;
  
  // In a real implementation, you would log this to an analytics service
  console.log(`Mobile Analytics - User: ${req.user._id}, Event: ${event}`, data);
  
  sendSuccessResponse(res, 200, 'Analytics logged successfully');
});

// @desc    Check for app updates
// @route   GET /api/mobile/update-check
// @access  Public
const checkForUpdates = asyncHandler(async (req, res) => {
  const { current_version, platform } = req.query;
  
  const updateInfo = {
    current_version: current_version || '1.0.0',
    latest_version: '1.0.0',
    update_available: false,
    force_update: false,
    update_message: 'You are using the latest version',
    download_url: null
  };
  
  // In a real implementation, you would check against your app store versions
  if (current_version && current_version !== '1.0.0') {
    updateInfo.update_available = true;
    updateInfo.update_message = 'A new version is available';
    updateInfo.download_url = platform === 'ios' 
      ? 'https://apps.apple.com/app/edunavigator'
      : 'https://play.google.com/store/apps/details?id=com.edunavigator';
  }
  
  sendSuccessResponse(res, 200, 'Update check completed', updateInfo);
});

// @desc    Get mobile-specific exam data
// @route   GET /api/mobile/exams
// @access  Public
const getMobileExams = asyncHandler(async (req, res) => {
  const { page = 1, limit = 15, type, upcoming_only = true } = req.query;
  const skip = (page - 1) * limit;

  const Exam = require('../models/Exam');
  const query = { is_active: true };
  
  if (type) query.exam_type = type;
  if (upcoming_only === 'true') {
    query['events.date'] = { $gt: new Date() };
  }

  const exams = await Exam.find(query)
    .select('exam_name year authority website exam_type admission_mode registration_fee subjects events')
    .sort({ 'events.date': 1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Mobile-optimized exam data
  const mobileExams = exams.map(exam => ({
    _id: exam._id,
    exam_name: exam.exam_name,
    year: exam.year,
    authority: exam.authority,
    exam_type: exam.exam_type,
    admission_mode: exam.admission_mode,
    registration_fee: exam.registration_fee,
    subjects: exam.subjects,
    next_deadline: exam.events
      .filter(event => event.date > new Date())
      .sort((a, b) => a.date - b.date)[0],
    days_until_deadline: exam.events
      .filter(event => event.date > new Date())
      .sort((a, b) => a.date - b.date)[0] 
      ? Math.ceil((exam.events
          .filter(event => event.date > new Date())
          .sort((a, b) => a.date - b.date)[0].date - new Date()) / (1000 * 60 * 60 * 24))
      : null
  }));

  sendSuccessResponse(res, 200, 'Mobile exams retrieved successfully', {
    exams: mobileExams,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: mobileExams.length
    },
    mobile_optimized: true
  });
});

module.exports = {
  updatePushToken,
  getMobileConfig,
  getMobileDashboard,
  getMobileRecommendations,
  logMobileAnalytics,
  checkForUpdates,
  getMobileExams
};