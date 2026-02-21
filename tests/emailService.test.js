const fc = require('fast-check');
const { sendPasswordResetEmail } = require('../services/emailService');
const emailConfig = require('../config/emailConfig');

// Mock nodemailer to use nodemailer-mock
jest.mock('nodemailer', () => require('nodemailer-mock'));

describe('Email Service - Property-Based Tests', () => {
  beforeEach(() => {
    // Clear mock data before each test
    const nodemailerMock = require('nodemailer-mock');
    nodemailerMock.mock.reset();
  });

  describe('Property 5: Email Content Completeness', () => {
    // Feature: secure-password-reset, Property 5: For any password reset email sent, the email body SHALL contain both the plain-text reset token and a clickable URL with the token as a query parameter.
    // Validates: Requirements 3.2, 3.3
    it('should include both plain-text token and URL with token in all generated emails', () => {
      // Custom arbitrary for 64-character hexadecimal string
      const hexToken = fc
        .array(fc.hexaString({ minLength: 1, maxLength: 1 }), {
          minLength: 64,
          maxLength: 64,
        })
        .map((arr) => arr.join(''));

      fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          hexToken,
          fc.string({ minLength: 1, maxLength: 50 }),
          async (email, resetToken, userName) => {
            // Send password reset email
            await sendPasswordResetEmail({
              email,
              resetToken,
              userName,
            });

            // Get the sent emails from the mock
            const nodemailerMock = require('nodemailer-mock');
            const sentEmails = nodemailerMock.mock.getSentMail();
            expect(sentEmails.length).toBeGreaterThan(0);

            // Get the most recent email
            const sentEmail = sentEmails[sentEmails.length - 1];

            // Verify email was sent to correct recipient
            expect(sentEmail.to).toBe(email);

            // Verify HTML content contains plain-text token
            expect(sentEmail.html).toContain(resetToken);

            // Verify plain-text content contains plain-text token
            expect(sentEmail.text).toContain(resetToken);

            // Construct expected URL with token as query parameter
            const expectedUrl = `${emailConfig.resetUrlBase}?token=${resetToken}`;

            // Verify HTML content contains URL with token
            expect(sentEmail.html).toContain(expectedUrl);

            // Verify plain-text content contains URL with token
            expect(sentEmail.text).toContain(expectedUrl);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
