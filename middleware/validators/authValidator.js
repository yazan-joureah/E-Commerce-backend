const { body, check} = require('express-validator');
const runValidation = require('@utils/baseValidator');
const { default: slugify } = require('slugify');
const User = require('@models/userModel');

exports.validateSignUp = runValidation([
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Name must be 3-50 characters')
    .custom((val, { req }) => {
      req.body.slug = slugify(val, { lower: true });
      return true;
    }).bail(),

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
    }).bail(),

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

]);

exports.validateLogIn = runValidation([

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail().bail(),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),

]);

exports.validateEmail = runValidation([
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail().bail(),
]);

exports.validateForgotPassword = runValidation([
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
]);

exports.validateResetPassword = runValidation([
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  
  check('token')
    .trim()
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid token format')
    .isHexadecimal()
    .withMessage('Invalid token format'),
  
  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
]);

exports.validateMFAEnable = runValidation([
  body('password')
    .optional()
    .trim()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
]);

exports.validateMFADisable = runValidation([
  body('password')
    .optional()
    .trim()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  
  body('token')
    .optional()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('MFA token must be 6 digits')
    .isNumeric()
    .withMessage('MFA token must contain only numbers')
]);

exports.validateMFALogin = runValidation([
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format'),
  
  body('tempToken')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Temporary token is required'),
  
  body('token')
    .optional()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('MFA token must be 6 digits')
    .isNumeric()
    .withMessage('MFA token must contain only numbers'),
  
  body('backupCode')
    .optional()
    .trim()
    .isLength({ min: 8, max: 8 })
    .withMessage('Backup code must be 8 characters')
    .matches(/^[A-F0-9]+$/i)
    .withMessage('Invalid backup code format')
]);