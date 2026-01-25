// middleware/uploadImages.js

const multer = require('multer');
const { randomUUID } = require('crypto');
const ApiError = require('@utils/ApiError');
const fs = require('fs').promises;
const asyncHandler = require('express-async-handler');

/**
 * Uploads multiple image fields at once (e.g., cover + gallery)
 * @param {string} folderName - Target folder
 * @param {Array} fields - Array of field configs: [{name: 'imageCover', maxCount: 1}, ...]
 * @returns {Array} Express middleware
 */
exports.uploadMixedImages = (folderName, fields) => {
  // Ensure directory exists
  const ensureDir = asyncHandler(async (req, res, next) => {
    try {
      await fs.mkdir(`uploads/${folderName}`, { recursive: true });
      next();
    } catch (err) {
      next(new ApiError('Could not create upload directory', 500));
    }
  });

  // Configure disk storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, `uploads/${folderName}`);
    },
    filename: (req, file, cb) => {
      const ext = file.mimetype.split('/')[1];
      const prefix = file.fieldname; // Use field name as prefix
      const filename = `${prefix}-${randomUUID()}-${Date.now()}.${ext}`;
      cb(null, filename);
    }
  });

  const fileFilter = (req, file, cb) => {
    file.mimetype.startsWith('image') 
      ? cb(null, true) 
      : cb(new ApiError('Only images allowed', 400), false);
  };

  const upload = multer({ storage, fileFilter });

  // Use upload.fields() for multiple field types
  const uploadMiddleware = upload.fields(fields);

  // Attach filenames to req.body
  const attachFilenames = asyncHandler((req, res, next) => {
    if (req.files) {
      // req.files will be an object with field names as keys
      Object.keys(req.files).forEach(fieldName => {
        const files = req.files[fieldName];
        if (files && files.length > 0) {
          // For single file fields (maxCount: 1), store as string
          if (files.length === 1) {
            req.body[fieldName] = files[0].filename;
          } 
          // For multiple file fields, store as array
          else {
            req.body[fieldName] = files.map(file => file.filename);
          }
        }
      });
    }
    next();
  });

  return [ensureDir, uploadMiddleware, attachFilenames];
};

/**
 * For single image uploads (backwards compatibility)
 */
exports.uploadSingleImage = (folderName, fieldName = 'image') => 
  exports.uploadMixedImages(folderName, [{ name: fieldName, maxCount: 1 }]);

/**
 * For multiple images of the same field (backwards compatibility)
 */
exports.uploadMultipleImages = (folderName, fieldName = 'images', maxCount = 10) => 
  exports.uploadMixedImages(folderName, [{ name: fieldName, maxCount }]);






// // middleware/uploadImageMiddleware.js
// const multer = require('multer');
// const sharp = require('sharp');
// const asyncHandler = require('express-async-handler');
// const { randomUUID } = require('crypto');
// const ApiError = require('@utils/ApiError');

// /**
//  * Factory function to create Multer upload middleware configured for memory storage.
//  * @param {string} fieldName - The name of the form field containing the image.
//  * @returns {Function} Multer middleware.
//  */
// exports.uploadSingleImage = (fieldName) => {
//   const multerStorage = multer.memoryStorage();

//   const multerFilter = (req, file, cb) => {
//     if (file.mimetype.startsWith('image')) {
//       cb(null, true);
//     } else {
//       cb(new ApiError('Only image files are allowed', 400), false);
//     }
//   };

//   return multer({ storage: multerStorage, fileFilter: multerFilter }).single(fieldName);
// };

// /**
//  * Middleware to resize and save an image uploaded via multer memory storage.
//  * @param {string} subfolder - Subfolder within 'uploads' to save the image (e.g., 'categories', 'products').
//  * @param {number} width - Target width for resizing.
//  * @param {number} height - Target height for resizing.
//  * @returns {Function} Express middleware.
//  */
// exports.resizeImage = (subfolder, width = 600, height = 600) =>
//   asyncHandler(async (req, res, next) => {
//     if (!req.file) {
//       return next(); // No file to process
//     }

//     // 1) Generate a unique filename
//     const fileExtension = req.file.mimetype.split('/')[1];
//     const filename = `${subfolder}-${randomUUID()}-${Date.now()}.${fileExtension}`;

//     // 2) Define the full path
//     const outputPath = `uploads/${subfolder}/${filename}`;

//     // 3) Create directory if it doesn't exist & process image
//     const fs = require('fs').promises;
//     await fs.mkdir(`uploads/${subfolder}`, { recursive: true });

//     await sharp(req.file.buffer)
//       .resize(width, height)
//       .toFormat(fileExtension === 'jpg' ? 'jpeg' : fileExtension) // Sharp expects 'jpeg'
//       .toFile(outputPath);

//     // 4) Attach the generated filename to the request body for the next handler (like createCategory)
//     req.body.image = filename; // Saves 'image' field in the request body

//     next();
//   });