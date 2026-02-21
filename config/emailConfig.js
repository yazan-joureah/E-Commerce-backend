/**
 * Email Configuration
 * Configures nodemailer SMTP settings from environment variables
 */

module.exports = {
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  },
  from: process.env.EMAIL_FROM || 'noreply@example.com',
  resetUrlBase:
    process.env.RESET_URL_BASE || 'http://localhost:3000/reset-password',
};
