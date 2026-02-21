/**
 * Email Service
 * Handles email operations using nodemailer for password reset functionality
 */

const nodemailer = require('nodemailer');
const emailConfig = require('../config/emailConfig');
const logger = require('../utils/logger');

/**
 * Get configured nodemailer transporter
 * @returns {Object} Nodemailer transporter instance
 */
function getEmailTransporter() {
  return nodemailer.createTransport(emailConfig.smtp);
}

/**
 * Send password reset email
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.resetToken - Plain-text reset token
 * @param {string} options.userName - User's name for personalization
 * @returns {Promise<void>}
 * @throws {Error} If email sending fails
 */
async function sendPasswordResetEmail({ email, resetToken, userName }) {
  try {
    const transporter = getEmailTransporter();
    const resetUrl = `${emailConfig.resetUrlBase}?token=${resetToken}`;

    // HTML email template
    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #ffffff; }
            .token-box { background-color: #f9f9f9; border: 1px solid #ddd; padding: 15px; margin: 20px 0; font-family: monospace; word-break: break-all; }
            .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
            .security-notice { background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 12px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              <p>We received a request to reset your password. Use the token below or click the button to reset your password:</p>
              
              <div class="token-box">
                <strong>Reset Token:</strong><br>
                ${resetToken}
              </div>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <div class="warning">
                <strong>⏰ Important:</strong> This reset token will expire in 5 minutes for security reasons.
              </div>
              
              <div class="security-notice">
                <strong>🔒 Security Notice:</strong> If you did not request a password reset, please ignore this email. Do not share this token with anyone.
              </div>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Plain-text email template as fallback
    const textTemplate = `
Password Reset Request

Hello ${userName},

We received a request to reset your password. Use the token below to reset your password:

Reset Token: ${resetToken}

Or visit this link:
${resetUrl}

⏰ IMPORTANT: This reset token will expire in 5 minutes for security reasons.

🔒 SECURITY NOTICE: If you did not request a password reset, please ignore this email. Do not share this token with anyone.

---
This is an automated message, please do not reply to this email.
    `.trim();

    // Send email
    await transporter.sendMail({
      from: emailConfig.from,
      to: email,
      subject: 'Password Reset Request',
      text: textTemplate,
      html: htmlTemplate,
    });

    logger.info(`Password reset email sent successfully to ${email}`);
  } catch (error) {
    logger.error(`Failed to send password reset email to ${email}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  getEmailTransporter,
  sendPasswordResetEmail,
};
