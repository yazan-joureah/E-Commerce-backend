const { body, check, query } = require('express-validator');
const runValidation = require('@utils/baseValidator');

exports.validateCreateSubCategory = runValidation([
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3, max: 32 })
    .withMessage('Name must be 3–32 characters long')
    .matches(/^[\w\s-]+$/)
    .withMessage('Name must contain only letters, numbers, dashes, or spaces')
    .escape(),
  check('category')
    .notEmpty()
    .withMessage('Id is required')
    .isMongoId()
    .withMessage('Invalid category ID format'),
]);

exports.validateId = runValidation([
  check('id')
    .notEmpty()
    .withMessage('Id is required')
    .isMongoId()
    .withMessage('Invalid subcategory ID format'),
]);

exports.validatePagination = runValidation([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1–100'),
]);
