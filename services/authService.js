// Service/authService.js

const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const asyncHandler = require('express-async-handler');
const ApiError = require('@utils/ApiError')

const User = require("@models/userModel");
const logger = require('@utils/logger');
const { generateResetToken } = require('@utils/tokenGenerator');
const { sendPasswordResetEmail } = require('@services/emailService');
const { validateResetToken } = require('@utils/tokenValidator');


/**
 * Create JWT token
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
const createToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXP
  });
};



exports.signUp = asyncHandler(async (req,res , next)=>{
    
    // 1 - Create User
    const user = await User.create({
        name: req.body.name,
        slug: req.body.slug,
        email: req.body.email,
        password: req.body.password,
        oauthProvider: 'local',
        emailVerified: true
    });

    
  

    //Generate auth token
    const token = createToken(user._id);


    user.password = undefined;

    res.status(201).json({
    status: 'success',
    data: user,
    token
  });
})

exports.logIn = asyncHandler(async (req,res , next)=>{
    
    // 1 - Check email
  // Check account lock
  const user = await User.findOne({ email: req.body.email })
    .select('+password +active +loginAttempts +lockUntil');
  
    if(!user){
        return next(new ApiError('Incorrect email or passowrd',401))
    }

    // Check if account uses OAuth
  if (user.oauthProvider !== 'local') {
    return next(new ApiError(`Please use ${user.oauthProvider} login`, 400));
  }

      // Check if account is locked
  if (user.isLocked()) {
    const lockTime = Math.ceil((user.lockUntil - Date.now()) / 60000); // minutes
    return next(new ApiError(`Account locked. Try again in ${lockTime} minutes.`, 423));
  }
      // Verify password
  const isPasswordCorrect = await user.comparePassword(req.body.password);
  
  if (!isPasswordCorrect) {
    // Increment login attempts
    await user.incLoginAttempts();
    return next(new ApiError('Incorrect email or password', 401));
  }

    // 3 - Check if user is active (optional but recommended)
    if (!user.active) {
    return next(new ApiError('Your account has been deactivated', 403));
  }  




  // Reset login attempts on successful login
  await user.updateOne({
    loginAttempts: 0,
    $unset: { lockUntil: 1 },
    lastLogin: Date.now()
  });


  // 4 - Generate token
  const token = createToken(user._id);

    // Update last login
  user.lastLogin = Date.now();
  await user.save();
  
  // Remove password from response
  user.password = undefined;
  user.mfaSecret = undefined;


    res.status(200).json({
    status: 'success',
    data: user,
    token
  });
})


exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // Extract email from request body
  const { email } = req.body;
  
  // Query user with reset fields selected
  const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires +passwordResetVerifies');
  
  // Check if user exists (continue regardless for security)
  if (!user) {
    logger.info(`Password reset requested for non-existent email: ${email}`);
    return res.status(200).json({
      status: 'success',
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }
  
  // Check if account uses OAuth (reject if not local)
  if (user.oauthProvider !== 'local') {
    logger.warn(`Password reset attempted for OAuth account: ${email} (${user.oauthProvider})`);
    return next(new ApiError(`Cannot reset password for ${user.oauthProvider} accounts`, 400));
  }
  
  // Generate secure reset token
  const token = generateResetToken();
  
  // Hash token using bcrypt
  const hashedToken = await bcrypt.hash(token, 10);
  
  // Set reset fields on user
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 5 * 60 * 1000; // 5 minutes
  user.passwordResetVerifies = false;
  
  // Save user document
  await user.save();
  
  // Send password reset email
  try {
    await sendPasswordResetEmail({
      email: user.email,
      resetToken: token,
      userName: user.name
    });
    
    logger.info(`Password reset email sent successfully to: ${email}`);
  } catch (error) {
    logger.error(`Failed to send password reset email to ${email}: ${error.message}`);
    return next(new ApiError('Failed to send password reset email. Please try again later.', 500));
  }
  
  // Return generic success message
  res.status(200).json({
    status: 'success',
    message: 'If an account with that email exists, a password reset link has been sent.'
  });
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Extract token from query parameter OR request body (prioritize query)
  const token = req.query.token || req.body.token;
  
  // Extract email and password from request body
  const { email, password } = req.body;
  
  // Query user by email with reset fields selected
  const user = await User.findOne({ email }).select('+password +passwordResetToken +passwordResetExpires +passwordResetVerifies');
  
  // Return error if user not found
  if (!user) {
    logger.warn(`Password reset attempted for non-existent email: ${email}`);
    return next(new ApiError('Invalid or expired reset token', 400));
  }
  
  // Check if account uses OAuth (reject if not local)
  if (user.oauthProvider !== 'local') {
    logger.warn(`Password reset attempted for OAuth account: ${email} (${user.oauthProvider})`);
    return next(new ApiError(`Cannot reset password for ${user.oauthProvider} accounts`, 400));
  }
  
  // Validate reset token
  const validation = await validateResetToken(user, token);
  
  // If validation fails, return generic error
  if (!validation.valid) {
    logger.warn(`Invalid token validation for ${email}: ${validation.reason}`);
    return next(new ApiError('Invalid or expired reset token', 400));
  }
  
  // Update password (triggers bcrypt middleware)
  user.password = password;
  
  // Update passwordChangedAt timestamp
  user.passwordChangedAt = Date.now();
  
  // Clear reset fields
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerifies = false;
  
  // Save user document
  await user.save();
  
  // Log successful operation
  logger.info(`Password reset successfully for: ${email}`);
  
  // Return success message
  res.status(200).json({
    status: 'success',
    message: 'Password reset successfully',
  });
});


exports.auth = asyncHandler(async (req,res,next)=>{
  // 1- Check if token exists
  let token;
  if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token){
    return next(
      new ApiError('You are not authenticated',401)
    )
  }

  // 2- verify token

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return next(new ApiError('Invalid or expired token', 401));
  }

  // 3- chaeck if user exist
  const currentUser = await User.findById(decoded.userId)
    .select('+active +lockUntil');
  if(!currentUser || !currentUser.active){
    return next(
      new ApiError('The user does not exist or diactivated', 401)
    )
  }

      // Check if account is locked
  if (currentUser.isLocked()) {
    const lockTime = Math.ceil((currentUser.lockUntil - Date.now()) / 60000); // minutes
    return next(new ApiError(`Account locked. Try again in ${lockTime} minutes.`, 423));
  }

  // 4- check if user changed his passowrd
  if(currentUser.passwordChangedAt){
     const timeStamp = parseInt( 
      currentUser.passwordChangedAt.getTime()/1000
      ,10
    );
   
    if(timeStamp > decoded.iat){
      next(new ApiError("Invalid Token",401))
    }
  }

  // set user 
  req.user = currentUser;
  next();

})

exports.allowed = (...roles) => 
  asyncHandler((req,res,next)=>{

    if(!roles.includes(req.user.role)){
      return next(new ApiError("Not Authorized",403))
    }

    next()
  })