const { body, query, check } = require('express-validator');
const runValidation = require('@utils/baseValidator');
const { default: slugify } = require('slugify');

exports.validateCreateUpdateCategory = runValidation([
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2–50 characters long')
    .matches(/^[\w\s-]+$/)
    .withMessage('Name must contain only letters, numbers, dashes, or spaces').custom((val,{req})=>{
          req.body.slug= slugify(val)
          return true;
        })
    .escape(),
]);

exports.validateId = runValidation([
  check('id').isMongoId().withMessage('Invalid category ID format'),
]);

exports.validatePagination = runValidation([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1–100'),
]);
