// /api/authApi.js
const express = require('express');

const {
  signUp,
  logIn,
  forgotPassword,
  resetPassword
} = require('@services/authService');

const {
  validateSignUp,
  validateLogIn,
  validateForgotPassword,
  validateResetPassword
} = require('@validators/authValidator');


const router = express.Router();

// Main user routes
router
  .route('/sign-up')
  .post( validateSignUp, signUp);

router
  .route('/log-in')
  .post( validateLogIn, logIn);

router
  .route('/forgot-password')
  .post(validateForgotPassword, forgotPassword);

router
  .route('/reset-password')
  .post(validateResetPassword, resetPassword);


 module.exports = router;