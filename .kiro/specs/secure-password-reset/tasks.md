# Implementation Plan: Secure Password Reset System

## Overview

This implementation plan breaks down the secure password reset feature into discrete coding tasks. The approach follows a bottom-up strategy: building utility modules first, then services, then integrating into the auth service, and finally adding comprehensive tests. Each task builds incrementally on previous work, with checkpoints to validate functionality.

The implementation replaces the current JWT-based password reset with a secure, single-use token approach that includes proper email delivery, token hashing, expiration, and protection against user enumeration attacks.

## Tasks

- [x] 1. Set up dependencies and configuration
  - Install nodemailer package: `npm install nodemailer`
  - Install fast-check for property-based testing: `npm install --save-dev fast-check`
  - Install nodemailer-mock for testing: `npm install --save-dev nodemailer-mock`
  - Create `config/emailConfig.js` with SMTP configuration reading from environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, SMTP_SECURE, RESET_URL_BASE)
  - Update `.env.example` with required email environment variables and example values
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 2. Implement Token Generator utility
  - [x] 2.1 Create `utils/tokenGenerator.js` module
    - Implement `generateResetToken()` function using `crypto.randomBytes(32)`
    - Convert bytes to hexadecimal string (64 characters)
    - Export the function
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ]* 2.2 Write property test for token format validity
    - **Property 1: Token Format Validity**
    - **Validates: Requirements 1.1, 1.3**
    - Generate 100+ tokens and verify each is exactly 64-character hexadecimal string
    - Tag: `// Feature: secure-password-reset, Property 1: Token Format Validity`
  
  - [ ]* 2.3 Write unit tests for token generator
    - Test token length is exactly 64 characters
    - Test token contains only hexadecimal characters (0-9, a-f)
    - Test multiple generated tokens are unique
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Implement Email Service
  - [x] 3.1 Create `services/emailService.js` module
    - Implement `getEmailTransporter()` function that creates nodemailer transporter using config from `config/emailConfig.js`
    - Implement `sendPasswordResetEmail({ email, resetToken, userName })` async function
    - Create HTML email template with: personalized greeting, plain-text token display, clickable reset link with token as query parameter, 5-minute expiration warning, security notice
    - Create plain-text email template as fallback
    - Include error handling with try-catch and logging for email failures
    - Export both functions
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_
  
  - [ ]* 3.2 Write property test for email content completeness
    - **Property 5: Email Content Completeness**
    - **Validates: Requirements 3.2, 3.3**
    - Generate 100+ emails with random tokens and verify each contains both plain-text token and clickable URL with token as query parameter
    - Tag: `// Feature: secure-password-reset, Property 5: Email Content Completeness`
  
  - [ ]* 3.3 Write unit tests for email service
    - Mock nodemailer transporter using nodemailer-mock
    - Test email is sent to correct recipient address
    - Test email body contains reset token in plain text
    - Test email contains reset URL with token as query parameter (format: `${RESET_URL_BASE}?token=${resetToken}`)
    - Test email includes user name in greeting
    - Test error handling when transporter.sendMail() throws error
    - Test logging occurs on email failure
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Implement Token Validator utility
  - [x] 4.1 Create `utils/tokenValidator.js` module
    - Implement `validateResetToken(user, providedToken)` async function
    - Check if user.passwordResetToken exists (return `{ valid: false, reason: 'no_token' }` if missing)
    - Check if user.passwordResetExpires > Date.now() (return `{ valid: false, reason: 'expired' }` if expired)
    - Use `bcrypt.compare(providedToken, user.passwordResetToken)` to verify token
    - Return `{ valid: true }` if token matches, `{ valid: false, reason: 'invalid' }` if not
    - Export the function
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 4.2 Write property test for invalid token rejection
    - **Property 7: Invalid Token Rejection**
    - **Validates: Requirements 4.3**
    - Generate 100+ password reset attempts with incorrect tokens and verify all are rejected with generic error message
    - Tag: `// Feature: secure-password-reset, Property 7: Invalid Token Rejection`
  
  - [ ]* 4.3 Write property test for valid token acceptance
    - **Property 8: Valid Token Acceptance**
    - **Validates: Requirements 4.5**
    - Generate 100+ password reset attempts with valid, non-expired tokens and verify all are accepted and proceed successfully
    - Tag: `// Feature: secure-password-reset, Property 8: Valid Token Acceptance`
  
  - [ ]* 4.4 Write unit tests for token validator
    - Test valid token passes validation (returns `{ valid: true }`)
    - Test invalid token fails validation (returns `{ valid: false, reason: 'invalid' }`)
    - Test expired token fails validation (manipulate passwordResetExpires to past date)
    - Test missing passwordResetToken fails validation
    - Test validation returns correct reason for each failure type
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5. Checkpoint - Verify utility modules
  - Run all utility module tests (token generator, email service, token validator)
  - Ensure all modules are created and exported correctly
  - Verify no console errors or warnings
  - Ask the user if questions arise

- [ ] 6. Update Auth Service - forgotPassword function
  - [ ] 6.1 Refactor `services/authService.js` forgotPassword function
    - Import `generateResetToken` from `utils/tokenGenerator.js`
    - Import `sendPasswordResetEmail` from `services/emailService.js`
    - Import `bcrypt` for token hashing
    - Import `logger` from `utils/logger.js`
    - Extract email from `req.body.email`
    - Query user by email with `.select('+passwordResetToken +passwordResetExpires +passwordResetVerifies +oauthProvider')`
    - If user does not exist, still return generic success message (prevent user enumeration)
    - If user exists and `user.oauthProvider !== 'local'`, return error: `Cannot reset password for ${user.oauthProvider} accounts`
    - Generate token using `generateResetToken()`
    - Hash token using `await bcrypt.hash(token, 10)`
    - Set `user.passwordResetToken = hashedToken`
    - Set `user.passwordResetExpires = Date.now() + 5 * 60 * 1000` (5 minutes)
    - Set `user.passwordResetVerifies = false`
    - Save user document with `await user.save()`
    - Call `await sendPasswordResetEmail({ email: user.email, resetToken: token, userName: user.name })`
    - Handle email service errors with try-catch (return 500 error if email fails)
    - Return generic success message: "If an account with that email exists, a password reset link has been sent."
    - Log the operation with email address (success or failure)
    - _Requirements: 1.4, 2.1, 3.1, 3.4, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 10.1, 10.3, 10.4_
  
  - [ ]* 6.2 Write property test for token storage security
    - **Property 2: Token Storage Security**
    - **Validates: Requirements 1.4, 1.5**
    - Generate 100+ password reset requests and verify stored token in database is bcrypt hash (not plain-text)
    - Tag: `// Feature: secure-password-reset, Property 2: Token Storage Security`
  
  - [ ]* 6.3 Write property test for expiration time accuracy
    - **Property 3: Expiration Time Accuracy**
    - **Validates: Requirements 2.1**
    - Generate 100+ reset requests and verify passwordResetExpires is set to timestamp approximately 5 minutes (300,000ms ± 1000ms) in the future
    - Tag: `// Feature: secure-password-reset, Property 3: Expiration Time Accuracy`
  
  - [ ]* 6.4 Write property test for email delivery invocation
    - **Property 6: Email Delivery Invocation**
    - **Validates: Requirements 3.1**
    - Generate 100+ valid password reset requests for local accounts and verify Email_Service is invoked with correct recipient email address
    - Tag: `// Feature: secure-password-reset, Property 6: Email Delivery Invocation`
  
  - [ ]* 6.5 Write property test for OAuth account protection
    - **Property 9: OAuth Account Protection**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
    - Generate 100+ password reset requests for OAuth accounts (google, facebook, github) and verify all are rejected with error message indicating OAuth provider
    - Tag: `// Feature: secure-password-reset, Property 9: OAuth Account Protection`
  
  - [ ]* 6.6 Write property test for user enumeration prevention
    - **Property 10: User Enumeration Prevention**
    - **Validates: Requirements 7.1, 7.2, 7.3**
    - Generate 100+ pairs of password reset requests (one for existing email, one for non-existing email) and verify response message format and status code are identical
    - Tag: `// Feature: secure-password-reset, Property 10: User Enumeration Prevention`
  
  - [ ]* 6.7 Write unit tests for forgotPassword
    - Test with existing local account email (success case)
    - Test with non-existing email (same generic success response)
    - Test with OAuth account (google) - should reject with specific error
    - Test with OAuth account (facebook) - should reject with specific error
    - Test with OAuth account (github) - should reject with specific error
    - Test token is hashed with bcrypt before storage (verify stored token is not plain-text)
    - Test passwordResetExpires is set to approximately 5 minutes in future
    - Test passwordResetVerifies is set to false
    - Test email service is called with correct parameters
    - Test error handling when email service throws error (should return 500)
    - Test logging occurs on success
    - Test logging occurs on failure
    - _Requirements: 1.4, 2.1, 3.1, 6.2, 6.3, 7.1, 7.2, 10.1, 10.3, 10.4_

- [ ] 7. Update Auth Service - resetPassword function
  - [ ] 7.1 Refactor `services/authService.js` resetPassword function
    - Import `validateResetToken` from `utils/tokenValidator.js`
    - Import `logger` from `utils/logger.js`
    - Extract token from `req.query.token` OR `req.body.token` (prioritize query parameter)
    - Extract email from `req.body.email`
    - Extract password from `req.body.password`
    - Query user by email with `.select('+password +passwordResetToken +passwordResetExpires +passwordResetVerifies +oauthProvider')`
    - If user not found, return generic error: "Invalid or expired reset token"
    - If `user.oauthProvider !== 'local'`, return error: `Cannot reset password for ${user.oauthProvider} accounts`
    - Call `await validateResetToken(user, token)`
    - If validation fails (valid === false), return generic error: "Invalid or expired reset token"
    - Update `user.password = password` (triggers bcrypt hashing middleware)
    - Update `user.passwordChangedAt = Date.now()`
    - Clear `user.passwordResetToken = undefined`
    - Clear `user.passwordResetExpires = undefined`
    - Set `user.passwordResetVerifies = false`
    - Save user document with `await user.save()`
    - Return success message: "Password reset successfully"
    - Log the operation with email address (success or failure)
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 6.2, 6.3, 6.4, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 10.2, 10.3_
  
  - [ ]* 7.2 Write property test for token invalidation after use
    - **Property 4: Token Invalidation After Use**
    - **Validates: Requirements 2.2, 2.4, 2.5, 2.6**
    - Perform 100+ successful password reset operations and verify passwordResetToken, passwordResetExpires, and passwordResetVerifies fields are all cleared
    - Tag: `// Feature: secure-password-reset, Property 4: Token Invalidation After Use`
  
  - [ ]* 7.3 Write property test for error message consistency
    - **Property 11: Error Message Consistency**
    - **Validates: Requirements 7.4, 7.5**
    - Generate 100+ failed password reset attempts (mix of expired tokens and invalid tokens) and verify error message is identical and generic for both cases
    - Tag: `// Feature: secure-password-reset, Property 11: Error Message Consistency`
  
  - [ ]* 7.4 Write property test for password update round-trip
    - **Property 12: Password Update Round-Trip**
    - **Validates: Requirements 8.1, 8.2**
    - Perform 100+ password resets with new passwords, verify password is hashed in database, and verify subsequent login attempts with new password succeed
    - Tag: `// Feature: secure-password-reset, Property 12: Password Update Round-Trip`
  
  - [ ]* 7.5 Write property test for timestamp update
    - **Property 13: Timestamp Update**
    - **Validates: Requirements 8.3**
    - Perform 100+ password reset operations and verify passwordChangedAt field is updated to timestamp within 1 second of current time
    - Tag: `// Feature: secure-password-reset, Property 13: Timestamp Update`
  
  - [ ]* 7.6 Write unit tests for resetPassword
    - Test with valid token and new password (success case)
    - Test with invalid token (wrong token string)
    - Test with expired token (manipulate passwordResetExpires to past date)
    - Test with non-existent user (return generic error)
    - Test with OAuth account (google, facebook, github) - should reject
    - Test token from query parameter works
    - Test token from request body works
    - Test query parameter takes precedence when both provided
    - Test missing token in both locations returns validation error
    - Test password is updated and hashed (verify stored password is bcrypt hash)
    - Test passwordChangedAt is updated to current timestamp
    - Test passwordResetToken is cleared (set to undefined)
    - Test passwordResetExpires is cleared (set to undefined)
    - Test passwordResetVerifies is set to false
    - Test logging occurs on success
    - Test logging occurs on failure
    - _Requirements: 2.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 6.2, 7.4, 7.5, 8.1, 8.3, 8.5, 10.2, 10.3_

- [ ] 8. Update validators
  - [ ] 8.1 Update `middleware/validators/authValidator.js`
    - Create or update `validateForgotPassword` validator using express-validator
    - Add email validation: `check('email').trim().notEmpty().isEmail().normalizeEmail()`
    - Create or update `validateResetPassword` validator using express-validator
    - Add email validation: `check('email').trim().notEmpty().isEmail().normalizeEmail()`
    - Add token validation: check both `req.query.token` and `req.body.token`, require 64 characters, hexadecimal format
    - Add password validation: `check('password').trim().notEmpty().isLength({ min: 6 })`
    - Export both validators
    - _Requirements: 5.4, 8.4_
  
  - [ ]* 8.2 Write unit tests for validators
    - Test validateForgotPassword with valid email (should pass)
    - Test validateForgotPassword with invalid email format (should fail)
    - Test validateForgotPassword with missing email (should fail)
    - Test validateForgotPassword with empty string email (should fail)
    - Test validateResetPassword with all valid inputs (should pass)
    - Test validateResetPassword with invalid token format (not hexadecimal)
    - Test validateResetPassword with wrong token length (not 64 characters)
    - Test validateResetPassword with missing token in both locations (should fail)
    - Test validateResetPassword with token in query parameter (should pass)
    - Test validateResetPassword with token in body (should pass)
    - Test validateResetPassword with password too short (< 6 characters)
    - Test validateResetPassword with missing password (should fail)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 8.4_

- [x] 9. Update API routes
  - [x] 9.1 Update `api/authApi.js` or equivalent routes file
    - Import updated validators: `validateForgotPassword`, `validateResetPassword`
    - Update POST `/forgot-password` route to use `validateForgotPassword` middleware before controller
    - Update POST `/reset-password` route to use `validateResetPassword` middleware before controller
    - Ensure both routes use the updated auth service functions (forgotPassword, resetPassword)
    - Fix any route path typos (e.g., `/forget-passowrd` → `/forgot-password`)
    - Ensure routes use express-async-handler for async error handling
    - _Requirements: All requirements (integration point)_

- [ ] 10. Checkpoint - Integration verification
  - Run all tests (unit and property tests)
  - Verify all components are wired together correctly
  - Test forgot password endpoint manually with valid email
  - Test reset password endpoint manually with valid token
  - Ensure no console errors or warnings
  - Ask the user if questions arise

- [ ]* 11. Write integration tests
  - [ ]* 11.1 Create integration test file `tests/integration/passwordReset.test.js`
    - Set up test database using mongodb-memory-server
    - Mock nodemailer transporter using nodemailer-mock
    - Create test users (local accounts and OAuth accounts)
    - Test full forgot password flow: POST /forgot-password → verify token generated → verify email sent
    - Test full reset password flow: forgot password → extract token from mock email → POST /reset-password with token → verify password updated → login with new password succeeds
    - Test token expiration: generate token → manipulate time or wait → attempt reset with expired token → verify rejected
    - Test token single-use enforcement: use token successfully → attempt to reuse same token → verify rejected
    - Test OAuth account protection: attempt forgot password for OAuth account → verify rejected, attempt reset password for OAuth account → verify rejected
    - Test user enumeration prevention: compare responses for existing vs non-existing emails → verify identical
    - Test concurrent reset requests: generate multiple tokens for same user → verify only latest token works
    - Test token in query parameter vs body: verify both work, verify query takes precedence
    - Test email service failure handling: mock email service to throw error → verify appropriate error response
    - Clean up test database after tests
    - _Requirements: All requirements (end-to-end validation)_

- [-] 12. Documentation and environment setup
  - [ ] 12.1 Update project documentation
    - Add password reset feature documentation to README.md or API documentation
    - Document the forgot password endpoint: POST /forgot-password with email in body
    - Document the reset password endpoint: POST /reset-password with email, password in body, token in query or body
    - Document required environment variables for email configuration
    - Add example SMTP configurations for common providers (Gmail, SendGrid, AWS SES, Mailgun)
    - Document security considerations: token expiration, single-use tokens, user enumeration prevention
    - Add troubleshooting section for common email delivery issues
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [ ] 12.2 Verify `.env.example` file
    - Ensure all required email environment variables are present with example values
    - Add comments explaining each variable's purpose
    - Include example values for different SMTP providers
    - Variables to include: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, SMTP_SECURE, RESET_URL_BASE
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 13. Final checkpoint and validation
  - Run complete test suite (unit tests, property tests, integration tests)
  - Verify all tests pass with no failures
  - Check test coverage meets goals (>90% line coverage, >85% branch coverage)
  - Verify no console errors, warnings, or deprecation notices
  - Test forgot password flow end-to-end in development environment
  - Test reset password flow end-to-end in development environment
  - Verify email delivery works with configured SMTP settings
  - Verify all environment variables are documented in `.env.example`
  - Verify all API endpoints are documented
  - Ask the user if questions arise or if ready for deployment

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- Each task explicitly references specific requirements for full traceability
- Checkpoints ensure incremental validation and catch issues early
- Property tests validate universal correctness properties across many inputs (minimum 100 iterations each)
- Unit tests validate specific examples, edge cases, and error conditions
- Integration tests validate complete end-to-end flows
- The implementation uses existing utilities: bcrypt, express-async-handler, ApiError, logger
- Email service uses nodemailer with configurable SMTP settings via environment variables
- Token generation uses Node.js crypto.randomBytes() for cryptographic security
- All password reset operations maintain OAuth provider checks to prevent bypassing OAuth security
- Error messages are carefully designed to prevent user enumeration attacks
- Tokens are hashed with bcrypt before storage (never store plain-text tokens)
- Tokens expire after 5 minutes and are single-use only
- The system returns generic success/error messages to avoid leaking user existence information
