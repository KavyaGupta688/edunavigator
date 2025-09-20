const User = require('../models/User');
const Progress = require('../models/Progress');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = {};
  
  // Filter by role
  if (req.query.role) {
    query.role = req.query.role;
  }

  // Filter by active status
  if (req.query.is_active !== undefined) {
    query.is_active = req.query.is_active === 'true';
  }

  // Search by name or email
  if (req.query.search) {
    query.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const users = await User.find(query)
    .select('-password')
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(query);

  sendSuccessResponse(res, 200, 'Users retrieved successfully', {
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('saved_exams', 'exam_name year deadline')
    .populate('saved_hackathons', 'title deadline')
    .populate('saved_internships', 'title company deadline');

  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  // Get user progress
  const progress = await Progress.findOne({ user_id: req.params.id });

  sendSuccessResponse(res, 200, 'User retrieved successfully', {
    user,
    progress
  });
});

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private
const updateUser = asyncHandler(async (req, res) => {
  const allowedUpdates = ['name', 'preferences', 'notifications_enabled', 'profile_picture'];
  const updates = {};

  // Only allow specific fields to be updated
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // Handle file upload for profile picture
  if (req.file) {
    updates.profile_picture = req.file.filename;
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  sendSuccessResponse(res, 200, 'User updated successfully', user);
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  // Deactivate instead of delete
  user.is_active = false;
  await user.save();

  sendSuccessResponse(res, 200, 'User deactivated successfully');
});

// @desc    Save exam to user's list
// @route   POST /api/users/:id/save-exam
// @access  Private
const saveExam = asyncHandler(async (req, res) => {
  const { examId } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  // Check if exam is already saved
  if (user.saved_exams.includes(examId)) {
    return sendErrorResponse(res, 400, 'Exam already saved');
  }

  user.saved_exams.push(examId);
  await user.save();

  // Update progress
  await Progress.updateProgress(user._id, 'exams_registered', 1);

  sendSuccessResponse(res, 200, 'Exam saved successfully');
});

// @desc    Remove exam from user's list
// @route   DELETE /api/users/:id/save-exam/:examId
// @access  Private
const unsaveExam = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  user.saved_exams = user.saved_exams.filter(
    examId => examId.toString() !== req.params.examId
  );
  await user.save();

  sendSuccessResponse(res, 200, 'Exam removed from saved list');
});

// @desc    Save hackathon to user's list
// @route   POST /api/users/:id/save-hackathon
// @access  Private
const saveHackathon = asyncHandler(async (req, res) => {
  const { hackathonId } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  if (user.role !== 'university') {
    return sendErrorResponse(res, 400, 'Only university students can save hackathons');
  }

  if (user.saved_hackathons.includes(hackathonId)) {
    return sendErrorResponse(res, 400, 'Hackathon already saved');
  }

  user.saved_hackathons.push(hackathonId);
  await user.save();

  sendSuccessResponse(res, 200, 'Hackathon saved successfully');
});

// @desc    Save internship to user's list
// @route   POST /api/users/:id/save-internship
// @access  Private
const saveInternship = asyncHandler(async (req, res) => {
  const { internshipId } = req.body;

  const user = await User.findById(req.params.id);
  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  if (user.role !== 'university') {
    return sendErrorResponse(res, 400, 'Only university students can save internships');
  }

  if (user.saved_internships.includes(internshipId)) {
    return sendErrorResponse(res, 400, 'Internship already saved');
  }

  user.saved_internships.push(internshipId);
  await user.save();

  sendSuccessResponse(res, 200, 'Internship saved successfully');
});

// @desc    Get user's saved items
// @route   GET /api/users/:id/saved
// @access  Private
const getSavedItems = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('saved_exams', 'exam_name year deadline authority')
    .populate('saved_hackathons', 'title deadline organizer prize')
    .populate('saved_internships', 'title company deadline stipend');

  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  const savedItems = {
    exams: user.saved_exams,
    hackathons: user.saved_hackathons,
    internships: user.saved_internships
  };

  sendSuccessResponse(res, 200, 'Saved items retrieved successfully', savedItems);
});

// @desc    Get user statistics
// @route   GET /api/users/:id/stats
// @access  Private
const getUserStats = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  const progress = await Progress.findOne({ user_id: req.params.id });
  
  const stats = {
    total_saved: user.saved_exams.length + user.saved_hackathons.length + user.saved_internships.length,
    exams_saved: user.saved_exams.length,
    hackathons_saved: user.saved_hackathons.length,
    internships_saved: user.saved_internships.length,
    progress: progress || {
      points: 0,
      level: 1,
      badges: [],
      total_activities: 0
    }
  };

  sendSuccessResponse(res, 200, 'User statistics retrieved successfully', stats);
});

// @desc    Get user dashboard data
// @route   GET /api/users/:id/dashboard
// @access  Private
const getUserDashboard = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('saved_exams', 'exam_name year deadline')
    .populate('saved_hackathons', 'title deadline')
    .populate('saved_internships', 'title company deadline');

  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  const progress = await Progress.findOne({ user_id: req.params.id });

  // Get upcoming deadlines
  const now = new Date();
  const upcomingExams = user.saved_exams.filter(exam => exam.deadline > now);
  const upcomingHackathons = user.saved_hackathons.filter(hackathon => hackathon.deadline > now);
  const upcomingInternships = user.saved_internships.filter(internship => internship.deadline > now);

  const dashboard = {
    user: {
      name: user.name,
      role: user.role,
      profile_picture: user.profile_picture
    },
    progress: progress || {
      points: 0,
      level: 1,
      badges: [],
      total_activities: 0
    },
    upcoming_deadlines: {
      exams: upcomingExams,
      hackathons: upcomingHackathons,
      internships: upcomingInternships
    },
    total_saved: user.saved_exams.length + user.saved_hackathons.length + user.saved_internships.length
  };

  sendSuccessResponse(res, 200, 'Dashboard data retrieved successfully', dashboard);
});

module.exports = {
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
};