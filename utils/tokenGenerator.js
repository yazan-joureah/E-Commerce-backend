const crypto = require('crypto');

/**
 * Generate a secure random token for password reset
 * @returns {string} Hexadecimal token string (64 characters from 32 bytes)
 */
const generateResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  return token;
};

module.exports = { generateResetToken };
