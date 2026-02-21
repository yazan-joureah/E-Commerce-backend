// api/oauthApi.js
const express = require('express');
const passport = require('@config/oauthConfig');
const jwt = require('jsonwebtoken');
const User = require('@models/userModel');

const router = express.Router();

/**
 * Generate JWT token for authenticated user
 * @param {string} userId - User's MongoDB ObjectId
 * @returns {string} JWT token
 */
const createToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXP
  });
};

/**
 * Google OAuth initialization middleware
 * Sets up session flags for Postman and return URL
 */
const googleAuthMiddleware = (req, res, next) => {
  // Set Postman flag for API-based authentication
  if (req.headers['user-agent'] && req.headers['user-agent'].includes('Postman')) {
    req.session.isPostman = true;
  }
  
  // Store return URL for post-authentication redirection
  if (req.query.returnTo) {
    req.session.returnTo = req.query.returnTo;
  }
  
  next();
};

/**
 * Google OAuth callback handler
 * Processes successful Google authentication and generates JWT
 */
const googleCallbackHandler = async (req, res) => {
  try {
    // Generate JWT for authenticated user
    const token = createToken(req.user._id);
    
    // Update user's last login timestamp
    req.user.lastLogin = Date.now();
    await req.user.save();
    
    // Determine redirect URL (use stored returnTo or default FRONTEND_URL)
    const returnTo = req.session.returnTo || process.env.FRONTEND_URL;
    
    // Handle response based on client type
    if (req.session.isPostman) {
      // API response for Postman/testing
      return res.status(200).json({
        status: 'success',
        message: 'Google OAuth authentication successful',
        data: {
          token,
          user: {
            id: req.user._id,
            email: req.user.email,
            name: req.user.name
          }
        }
      });
    }
    
    // Browser-based authentication redirect
    res.redirect(`${returnTo}/oauth/callback?token=${token}&provider=google`);
    
  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    
    // Handle Postman/API error response
    if (req.session.isPostman) {
      return res.status(500).json({
        status: 'error',
        message: 'Google OAuth authentication failed',
        error: error.message
      });
    }
    
    // Browser error redirect
    const errorMessage = encodeURIComponent(error.message);
    const returnTo = req.session.returnTo || process.env.FRONTEND_URL;
    res.redirect(`${returnTo}/login?error=oauth_failed&message=${errorMessage}`);
  }
};


// Google OAuth Routes

/**
 * @route GET /api/auth/google
 * @description Initiate Google OAuth authentication flow
 * @query {string} [returnTo] - URL to redirect after authentication
 * @access Public
 */
router.get('/google',
  googleAuthMiddleware,
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    accessType: 'offline', // Request refresh token
    prompt: 'consent' // Always show consent screen
  })
);

/**
 * @route GET /api/auth/google/callback
 * @description Google OAuth callback endpoint
 * @access Public
 */
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
    session: false
  }),
  googleCallbackHandler
);

module.exports = router;