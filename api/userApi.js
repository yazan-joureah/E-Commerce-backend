const express = require('express');

const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  updateUserPassword,
} = require('@services/userService');

const {
  validateCreateUser,
  validateUpdateUser,
  validateUpdatePassword,
  validateId,
  validatePagination,
} = require('@validators/userValidator');

const { uploadSingleImage } = require('@middleware/uploadImages');

const router = express.Router();

// Main user routes
router
  .route('/')
  .get(validatePagination, getUsers)
  .post(uploadSingleImage('users', 'profileImage'), validateCreateUser, createUser);

router
  .route('/:id')
  .get(validateId, getUser)
  .put( uploadSingleImage('users', 'profileImage'), validateUpdateUser, updateUser)
  .delete(validateId, deleteUser);

// Password update route
router
  .route('/:id/password')
  .put( validateUpdatePassword, updateUserPassword);

module.exports = router;