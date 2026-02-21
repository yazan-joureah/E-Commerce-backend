const Factory = require('@services/handlersFactory');
const User = require('@models/userModel');
const ApiError = require('@utils/ApiError');
const asyncHandler = require('express-async-handler');

// @desc    Get list of users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getUsers = Factory.getAll(User);

// @desc    Get specific user by id
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getUser = Factory.getOne(User);

// @desc    Create user
// @route   POST /api/v1/users
// @access  Private/Admin
exports.createUser = Factory.createOne(User);

// @desc    Update specific user
// @route   PUT /api/v1/users/:id
// @access  Private/Admin
exports.updateUser = Factory.updateOne(User);

// @desc    Update user password
// @route   PUT /api/v1/users/:id/password
// @access  Private/Admin
exports.updateUserPassword = asyncHandler(async (req, res, next) => {

   // 1) Get user from collection with password
  const document = await User.findById(req.params.id).select('+password');
  
      // Check if account uses OAuth
  if (document.oauthProvider !== 'local') {
    return next(new ApiError(`Can not Change ${document.oauthProvider} passowrd`, 400));
  }
  // 2) Update password
  document.password = req.body.password;
  document.passwordChangedAt = Date.now();
  await document.save();

  if (!document) {
    return next(new ApiError(`No document found with id: ${req.params.id}`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: document
  });
});
  

// @desc    Delete specific user (Diactivate)
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser =asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { active: false },
    { new: true }
  );

  if (!user) {
    return next(new ApiError(`No user found with id: ${req.params.id}`, 404));
  }

  res.status(204).send();
});