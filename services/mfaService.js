// services/mfaService.js
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const asyncHandler = require('express-async-handler');
const ApiError = require('@utils/ApiError');
const User = require('@models/userModel');
const crypto = require('crypto');

class MFAService {

    // Generate MFA secret for user
  static generateSecret(userEmail) {
    return speakeasy.generateSecret({
      name: `${process.env.APP_NAME}:${userEmail}`,
      length: 20
    });
  }

    // Generate QR code for Google Authenticator
  static async generateQRCode(otpauthUrl) {
    try {
      return await qrcode.toDataURL(otpauthUrl);
    } catch (error) {
      throw new ApiError('Failed to generate QR code', 500);
    }
  }

  // Verify TOTP token
  static verifyToken(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2-step tolerance (1 minute before/after)
    });
  }

  // Generate backup codes
  static generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  // Verify backup code
  static verifyBackupCode(user, code) {
    if (!user.mfaBackupCodes || !user.mfaBackupCodes.length) {
      return false;
    }
    
    const index = user.mfaBackupCodes.indexOf(code);
    if (index === -1) {
      return false;
    }
    
    // Remove used backup code
    user.mfaBackupCodes.splice(index, 1);
    return true;
  }
}
// @desc    Enable MFA for user
// @route   POST /api/v1/auth/mfa/enable
// @access  Private
exports.enableMFA = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (user.mfaEnabled) {
    return next(new ApiError('MFA is already enabled', 400));
  }

  // Generate new secret
  const secret = MFAService.generateSecret(user.email);
  
  // Store secret temporarily (not saved yet)
  req.session.mfaTempSecret = secret.base32;
  
  // Generate QR code
  const qrCode = await MFAService.generateQRCode(secret.otpauth_url);
  
  // Generate backup codes
  const backupCodes = MFAService.generateBackupCodes();
  req.session.mfaBackupCodes = backupCodes;
  
  res.status(200).json({
    status: 'success',
    message: 'Setup MFA by scanning QR code',
    data: {
      secret: secret.base32,
      qrCode,
      backupCodes // Send only once during setup
    }
  });
});

// @desc    Verify and activate MFA
// @route   POST /api/v1/auth/mfa/verify
// @access  Private
exports.verifyMFA = asyncHandler(async (req, res, next) => {
  const { token } = req.body;
  const user = await User.findById(req.user.id);
  
  if (!req.session.mfaTempSecret) {
    return next(new ApiError('MFA setup session expired', 400));
  }
  
  // Verify token
  const isValid = MFAService.verifyToken(req.session.mfaTempSecret, token);
  
  if (!isValid) {
    return next(new ApiError('Invalid verification code', 400));
  }
  
  // Save MFA secret and backup codes
  user.mfaSecret = req.session.mfaTempSecret;
  user.mfaBackupCodes = req.session.mfaBackupCodes;
  user.mfaEnabled = true;
  
  await user.save();
  
  // Clear session
  delete req.session.mfaTempSecret;
  delete req.session.mfaBackupCodes;
  
  res.status(200).json({
    status: 'success',
    message: 'MFA enabled successfully',
    data: {
      backupCodes: user.mfaBackupCodes // Return again for user to save
    }
  });
});

// @desc    Disable MFA
// @route   POST /api/v1/auth/mfa/disable
// @access  Private
exports.disableMFA = asyncHandler(async (req, res, next) => {
  const { password, token } = req.body;
  const user = await User.findById(req.user.id).select('+password');
  
  if (!user.mfaEnabled) {
    return next(new ApiError('MFA is not enabled', 400));
  }
  
  // For local accounts, require password
  if (user.oauthProvider === 'local' && !password) {
    return next(new ApiError('Password is required to disable MFA', 400));
  }
  
  if (user.oauthProvider === 'local') {
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return next(new ApiError('Incorrect password', 401));
    }
  }
  
  // Verify MFA token
  if (token) {
    const isValid = MFAService.verifyToken(user.mfaSecret, token);
    if (!isValid) {
      return next(new ApiError('Invalid MFA token', 400));
    }
  }
  
  // Disable MFA
  user.mfaEnabled = false;
  user.mfaSecret = undefined;
  user.mfaBackupCodes = undefined;
  
  await user.save();
  
  res.status(200).json({
    status: 'success',
    message: 'MFA disabled successfully'
  });
});

// @desc    Generate new backup codes
// @route   POST /api/v1/auth/mfa/backup-codes
// @access  Private
exports.generateBackupCodes = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  const user = await User.findById(req.user.id).select('+password');
  
  if (!user.mfaEnabled) {
    return next(new ApiError('MFA is not enabled', 400));
  }
  
  // Verify password for local accounts
  if (user.oauthProvider === 'local') {
    if (!password) {
      return next(new ApiError('Password is required', 400));
    }
    
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return next(new ApiError('Incorrect password', 401));
    }
  }
  
  // Generate new backup codes
  const backupCodes = MFAService.generateBackupCodes();
  user.mfaBackupCodes = backupCodes;
  
  await user.save();
  
  res.status(200).json({
    status: 'success',
    data: { backupCodes }
  });
});

// @desc    Verify MFA token during login
// @route   POST /api/v1/auth/mfa/verify-login
// @access  Public
exports.verifyMFALogin = asyncHandler(async (req, res, next) => {
  const { email, token, backupCode, tempToken } = req.body;
  
  let user;
  
  // Check if using temp token (from login with MFA required)
  if (tempToken) {
    try {
      const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
      user = await User.findById(decoded.userId).select('+mfaSecret +mfaBackupCodes');
    } catch (error) {
      return next(new ApiError('Invalid or expired temporary token', 401));
    }
  } else if (email) {
    user = await User.findOne({ email }).select('+mfaSecret +mfaBackupCodes');
  } else {
    return next(new ApiError('Email or temporary token required', 400));
  }
  
  if (!user || !user.mfaEnabled) {
    return next(new ApiError('MFA not enabled for this account', 400));
  }
  
  let isValid = false;
  
  // Check backup code first
  if (backupCode) {
    isValid = MFAService.verifyBackupCode(user, backupCode);
    if (isValid) {
      await user.save(); // Save after removing used backup code
    }
  } 
  // Check TOTP token
  else if (token) {
    isValid = MFAService.verifyToken(user.mfaSecret, token);
  } else {
    return next(new ApiError('MFA token or backup code required', 400));
  }
  
  if (!isValid) {
    return next(new ApiError('Invalid MFA verification', 401));
  }
  
  // Update last used time
  user.mfaLastUsed = Date.now();
  await user.save();
  
  // Generate final token
  const finalToken = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXP }
  );
  
  // Remove sensitive data
  user.mfaSecret = undefined;
  user.mfaBackupCodes = undefined;
  user.password = undefined;
  
  res.status(200).json({
    status: 'success',
    message: 'MFA verification successful',
    data: user,
    token: finalToken
  });
});


