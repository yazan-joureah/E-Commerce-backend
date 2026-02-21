const bcrypt = require('bcryptjs');

/**
 * Validate a password reset token
 * @param {Object} user - User document from database
 * @param {string} providedToken - Token provided by client
 * @returns {Promise<Object>} Validation result
 * @returns {boolean} result.valid - Whether token is valid
 * @returns {string} result.reason - Reason for invalidity (if applicable)
 */
async function validateResetToken(user, providedToken) {
  // Check if user has a passwordResetToken
  if (!user.passwordResetToken) {
    return { valid: false, reason: 'no_token' };
  }

  // Check if token has expired
  if (user.passwordResetExpires <= Date.now()) {
    return { valid: false, reason: 'expired' };
  }

  // Compare provided token against hashed token
  const isMatch = await bcrypt.compare(providedToken, user.passwordResetToken);

  if (!isMatch) {
    return { valid: false, reason: 'invalid' };
  }

  return { valid: true };
}

module.exports = {
  validateResetToken,
};
