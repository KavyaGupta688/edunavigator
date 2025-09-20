const Exam = require('../models/Exam');
const ExamDeadline = require('../models/ExamDeadline');
const { asyncHandler, sendSuccessResponse, sendErrorResponse } = require('../middleware/errorHandler');

// @desc    Get all exams
// @route   GET /api/exams
// @access  Public
const getExams = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { is_active: true };

  // Filter by exam type
  if (req.query.type) {
    query.exam_type = req.query.type;
  }

  // Filter by admission mode
  if (req.query.admission_mode) {
    query.admission_mode = req.query.admission_mode;
  }

  // Filter by year
  if (req.query.year) {
    query.year = parseInt(req.query.year);
  }

  // Filter by authority
  if (req.query.authority) {
    query.authority = { $regex: req.query.authority, $options: 'i' };
  }

  // Filter by subjects
  if (req.query.subjects) {
    const subjects = req.query.subjects.split(',');
    query.subjects = { $in: subjects };
  }

  // Search by exam name
  if (req.query.search) {
    query.exam_name = { $regex: req.query.search, $options: 'i' };
  }

  // Filter by upcoming deadlines
  if (req.query.upcoming === 'true') {
    const now = new Date();
    query['events.date'] = { $gt: now };
  }

  // Sort options
  let sort = {};
  if (req.query.sort) {
    const sortField = req.query.sort;
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    sort[sortField] = sortOrder;
  } else {
    sort = { created_at: -1 };
  }

  const exams = await Exam.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Exam.countDocuments(query);

  sendSuccessResponse(res, 200, 'Exams retrieved successfully', {
    exams,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single exam
// @route   GET /api/exams/:id
// @access  Public
const getExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam || !exam.is_active) {
    return sendErrorResponse(res, 404, 'Exam not found');
  }

  // Get recent deadline changes
  const deadlineChanges = await ExamDeadline.findRecentChanges(req.params.id, 30);

  sendSuccessResponse(res, 200, 'Exam retrieved successfully', {
    exam,
    recent_changes: deadlineChanges
  });
});

// @desc    Create new exam
// @route   POST /api/exams
// @access  Private/Admin
const createExam = asyncHandler(async (req, res) => {
  const exam = await Exam.create(req.body);

  sendSuccessResponse(res, 201, 'Exam created successfully', exam);
});

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private/Admin
const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!exam) {
    return sendErrorResponse(res, 404, 'Exam not found');
  }

  sendSuccessResponse(res, 200, 'Exam updated successfully', exam);
});

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private/Admin
const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findByIdAndUpdate(
    req.params.id,
    { is_active: false },
    { new: true }
  );

  if (!exam) {
    return sendErrorResponse(res, 404, 'Exam not found');
  }

  sendSuccessResponse(res, 200, 'Exam deactivated successfully');
});

// @desc    Get upcoming exams
// @route   GET /api/exams/upcoming
// @access  Public
const getUpcomingExams = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const now = new Date();

  const exams = await Exam.findUpcoming()
    .sort({ 'events.date': 1 })
    .limit(limit);

  sendSuccessResponse(res, 200, 'Upcoming exams retrieved successfully', exams);
});

// @desc    Get exams by type
// @route   GET /api/exams/type/:type
// @access  Public
const getExamsByType = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const exams = await Exam.findByType(type)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Exam.countDocuments({ exam_type: type, is_active: true });

  sendSuccessResponse(res, 200, 'Exams retrieved successfully', {
    exams,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get exams by admission mode
// @route   GET /api/exams/admission-mode/:mode
// @access  Public
const getExamsByAdmissionMode = asyncHandler(async (req, res) => {
  const { mode } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const exams = await Exam.findByAdmissionMode(mode)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Exam.countDocuments({ admission_mode: mode, is_active: true });

  sendSuccessResponse(res, 200, 'Exams retrieved successfully', {
    exams,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get exams by subjects
// @route   GET /api/exams/subjects
// @access  Public
const getExamsBySubjects = asyncHandler(async (req, res) => {
  const { subjects } = req.query;
  
  if (!subjects) {
    return sendErrorResponse(res, 400, 'Subjects parameter is required');
  }

  const subjectArray = subjects.split(',');
  const exams = await Exam.findBySubjects(subjectArray);

  sendSuccessResponse(res, 200, 'Exams retrieved successfully', exams);
});

// @desc    Get exam deadlines
// @route   GET /api/exams/:id/deadlines
// @access  Public
const getExamDeadlines = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) {
    return sendErrorResponse(res, 404, 'Exam not found');
  }

  const deadlines = await ExamDeadline.find({ exam_id: req.params.id })
    .sort({ change_date: -1 });

  sendSuccessResponse(res, 200, 'Exam deadlines retrieved successfully', {
    exam: {
      _id: exam._id,
      exam_name: exam.exam_name,
      year: exam.year
    },
    deadlines
  });
});

// @desc    Get urgent deadlines
// @route   GET /api/exams/deadlines/urgent
// @access  Public
const getUrgentDeadlines = asyncHandler(async (req, res) => {
  const urgentDeadlines = await ExamDeadline.findUrgentDeadlines();

  sendSuccessResponse(res, 200, 'Urgent deadlines retrieved successfully', urgentDeadlines);
});

// @desc    Get exam statistics
// @route   GET /api/exams/stats
// @access  Public
const getExamStats = asyncHandler(async (req, res) => {
  const stats = await Exam.aggregate([
    { $match: { is_active: true } },
    {
      $group: {
        _id: '$exam_type',
        count: { $sum: 1 },
        avg_fee: { $avg: '$registration_fee' }
      }
    }
  ]);

  const totalExams = await Exam.countDocuments({ is_active: true });
  const upcomingExams = await Exam.countDocuments({
    is_active: true,
    'events.date': { $gt: new Date() }
  });

  sendSuccessResponse(res, 200, 'Exam statistics retrieved successfully', {
    total_exams: totalExams,
    upcoming_exams: upcomingExams,
    by_type: stats
  });
});

// @desc    Search exams
// @route   GET /api/exams/search
// @access  Public
const searchExams = asyncHandler(async (req, res) => {
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
      { exam_name: { $regex: q, $options: 'i' } },
      { authority: { $regex: q, $options: 'i' } },
      { subjects: { $regex: q, $options: 'i' } },
      { tags: { $regex: q, $options: 'i' } }
    ]
  };

  const exams = await Exam.find(query)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Exam.countDocuments(query);

  sendSuccessResponse(res, 200, 'Search results retrieved successfully', {
    query: q,
    exams,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

module.exports = {
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
  getUpcomingExams,
  getExamsByType,
  getExamsByAdmissionMode,
  getExamsBySubjects,
  getExamDeadlines,
  getUrgentDeadlines,
  getExamStats,
  searchExams
};