// api/mfaApi.js
const express = require('express');
const {
  enableMFA,
  verifyMFA,
  disableMFA,
  generateBackupCodes,
  verifyMFALogin
} = require('@services/mfaService');
const { auth } = require('@services/authService');

const router = express.Router();

// All routes require authentication except verify-login
router.use(auth);

// Enable MFA (step 1: generate secret and QR code)
router.post('/enable', enableMFA);

// Verify and activate MFA (step 2: verify token)
router.post('/verify', verifyMFA);

// Disable MFA
router.post('/disable', disableMFA);

// Generate new backup codes
router.post('/backup-codes', generateBackupCodes);

// Verify MFA during login (public route)
router.post('/verify-login', verifyMFALogin);

module.exports = router;