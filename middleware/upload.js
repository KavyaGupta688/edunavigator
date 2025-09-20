const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadDir;
    
    // Create subdirectories based on file type
    if (file.fieldname === 'profile_picture') {
      uploadPath = path.join(uploadDir, 'profiles');
    } else if (file.fieldname === 'team_files') {
      uploadPath = path.join(uploadDir, 'teams');
    } else if (file.fieldname === 'message_attachments') {
      uploadPath = path.join(uploadDir, 'messages');
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + extension;
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'text/plain': '.txt',
    'application/zip': '.zip',
    'application/x-rar-compressed': '.rar'
  };

  // Check if file type is allowed
  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 5 // Maximum 5 files per request
  }
});

// Specific upload configurations
const uploadProfilePicture = upload.single('profile_picture');
const uploadTeamFiles = upload.array('team_files', 5);
const uploadMessageAttachments = upload.array('message_attachments', 3);

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size allowed is 5MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 files allowed.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  }
  
  if (err.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next(err);
};

// Helper function to delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Helper function to get file URL
const getFileUrl = (req, filename) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${filename}`;
};

// Helper function to validate image dimensions
const validateImageDimensions = (filePath, maxWidth = 2000, maxHeight = 2000) => {
  return new Promise((resolve, reject) => {
    // This would typically use a library like sharp or jimp
    // For now, we'll just resolve as valid
    resolve(true);
  });
};

// Helper function to compress image
const compressImage = (filePath, quality = 80) => {
  return new Promise((resolve, reject) => {
    // This would typically use a library like sharp
    // For now, we'll just resolve with the original path
    resolve(filePath);
  });
};

// Middleware to process uploaded images
const processImage = async (req, res, next) => {
  if (req.file && req.file.mimetype.startsWith('image/')) {
    try {
      // Validate dimensions
      const isValidDimensions = await validateImageDimensions(req.file.path);
      if (!isValidDimensions) {
        deleteFile(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Image dimensions too large'
        });
      }

      // Compress image
      const compressedPath = await compressImage(req.file.path);
      req.file.processedPath = compressedPath;
      
      next();
    } catch (error) {
      deleteFile(req.file.path);
      next(error);
    }
  } else {
    next();
  }
};

// Middleware to clean up files on error
const cleanupFiles = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // If response is an error, clean up uploaded files
    if (res.statusCode >= 400 && req.files) {
      req.files.forEach(file => {
        deleteFile(file.path);
      });
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  upload,
  uploadProfilePicture,
  uploadTeamFiles,
  uploadMessageAttachments,
  handleUploadError,
  deleteFile,
  getFileUrl,
  validateImageDimensions,
  compressImage,
  processImage,
  cleanupFiles
};