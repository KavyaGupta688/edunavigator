const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../middleware/auth');
const { asyncHandler, sendSuccessResponse, sendErrorResponse, AppError } = require('../middleware/errorHandler');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, education, school_info, preferences } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return sendErrorResponse(res, 400, 'User already exists with this email');
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role,
    education,
    school_info,
    preferences
  });

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Remove password from response
  user.password = undefined;

  sendSuccessResponse(res, 201, 'User registered successfully', {
    user,
    token,
    refreshToken
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return sendErrorResponse(res, 401, 'Invalid credentials');
  }

  // Check if user is active
  if (!user.is_active) {
    return sendErrorResponse(res, 401, 'Account is deactivated');
  }

  // Check password
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    return sendErrorResponse(res, 401, 'Invalid credentials');
  }

  // Update last login
  user.last_login = new Date();
  await user.save();

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Remove password from response
  user.password = undefined;

  sendSuccessResponse(res, 200, 'Login successful', {
    user,
    token,
    refreshToken
  });
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendErrorResponse(res, 401, 'Refresh token is required');
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user || !user.is_active) {
      return sendErrorResponse(res, 401, 'Invalid refresh token');
    }

    // Generate new tokens
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    sendSuccessResponse(res, 200, 'Token refreshed successfully', {
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    return sendErrorResponse(res, 401, 'Invalid refresh token');
  }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('saved_exams', 'exam_name year deadline')
    .populate('saved_hackathons', 'title deadline')
    .populate('saved_internships', 'title company deadline');

  sendSuccessResponse(res, 200, 'User profile retrieved successfully', user);
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return sendErrorResponse(res, 400, 'Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  sendSuccessResponse(res, 200, 'Password updated successfully');
});

// @desc    Forgot password
// @route   POST /api/auth/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return sendErrorResponse(res, 404, 'User not found');
  }

  // Generate reset token (in a real app, you'd send this via email)
  const resetToken = generateToken(user._id);
  
  // In a real implementation, you would:
  // 1. Save reset token to database with expiry
  // 2. Send email with reset link
  // 3. Handle token validation in reset password endpoint

  sendSuccessResponse(res, 200, 'Password reset instructions sent to email', {
    resetToken // Remove this in production
  });
});

// @desc    Reset password
// @route   PUT /api/auth/resetpassword/:resettoken
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { resettoken } = req.params;

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(resettoken, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return sendErrorResponse(res, 400, 'Invalid reset token');
    }

    user.password = password;
    await user.save();

    sendSuccessResponse(res, 200, 'Password reset successful');
  } catch (error) {
    return sendErrorResponse(res, 400, 'Invalid or expired reset token');
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  // In a real implementation, you would:
  // 1. Add token to blacklist
  // 2. Clear refresh token from database
  // 3. Clear any server-side sessions

  sendSuccessResponse(res, 200, 'Logout successful');
});

// @desc    Delete account
// @route   DELETE /api/auth/deleteaccount
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;

  // Verify password
  const user = await User.findById(req.user._id).select('+password');
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return sendErrorResponse(res, 400, 'Password is incorrect');
  }

  // Deactivate account instead of deleting
  user.is_active = false;
  await user.save();

  sendSuccessResponse(res, 200, 'Account deactivated successfully');
});

module.exports = {
  register,
  login,
  refreshToken,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword,
  logout,
  deleteAccount
};