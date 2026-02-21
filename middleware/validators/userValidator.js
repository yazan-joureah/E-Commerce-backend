const { body, param, query } = require('express-validator');
const runValidation = require('@utils/baseValidator');
const { default: slugify } = require('slugify');
const User = require('@models/userModel');
const bcrypt = require('bcrypt');

exports.validateCreateUser = runValidation([
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Name must be 3-50 characters')
    .custom((val, { req }) => {
      req.body.slug = slugify(val, { lower: true });
      return true;
    }),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .custom(async (email) => {
      const user = await User.findOne({ email });
      if (user) {
        throw new Error('Email already exists');
      }
      return true;
    }),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

  body('passwordConfirm')
    .trim()
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),

  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),

  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean'),
]);

exports.validateUpdateUser = runValidation([
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID format')
    .custom(async (id) => {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('User not found');
      }
      return true;
    }),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Name must be 3-50 characters')
    .custom((val, { req }) => {
      if (val) {
        req.body.slug = slugify(val, { lower: true });
      }
      return true;
    }),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .custom(async (email, { req }) => {
      if (email) {
        const user = await User.findOne({ email, _id: { $ne: req.params.id } });
        if (user) {
          throw new Error('Email already exists');
        }
      }
      return true;
    }),

  body('password')
    .optional()
    .custom(() => {
      throw new Error('Password cannot be updated from this endpoint. Use /users/:id/password instead');
    }),

  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),

  body('active')
    .optional()
    .custom(() => {
      throw new Error('Cannot change the status from this endpoint. Use Delete /users/:id instead');
    })
]);

exports.validateUpdatePassword = runValidation([
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID format')
    .custom(async (id) => {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('User not found');
      }
      return true;
    }),

  body('currentPassword')
    .trim()
    .notEmpty()
    .withMessage('Current password is required')
    .custom(async (value, { req }) => {
      const user = await User.findById(req.params.id).select('+password');
      
      if (!user) {
        throw new Error('User not found');
      }

      const isPasswordCorrect = await bcrypt.compare(value, user.password);
      if (!isPasswordCorrect) {
        throw new Error('Current password is incorrect');
      }
      return true;
    }),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),

  body('passwordConfirm')
    .trim()
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
]);

exports.validateId = runValidation([
  param('id')
    .isMongoId()
    .withMessage('Invalid user ID format')
    .custom(async (id) => {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('User not found');
      }
      return true;
    }),
]);

exports.validatePagination = runValidation([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('role').optional().isIn(['user', 'admin', 'manager']).withMessage('Invalid role'),
  query('active').optional().isBoolean().withMessage('Active must be a boolean'),
]);