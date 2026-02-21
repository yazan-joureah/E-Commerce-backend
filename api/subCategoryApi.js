const express = require('express');

const {
  getSubCategories,
  getSubCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} = require('@services/subCategoryService');

const {
  validateCreateUpdateSubCategory,
  validateId,
  validatePagination,
} = require('@middleware/validators/subCategoryValidator');
const { auth } = require('@services/authService');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(validatePagination, getSubCategories)
  .post(auth,validateCreateUpdateSubCategory, createSubCategory);

router
  .route('/:id')
  .get(validateId, getSubCategory)
  .put(auth,validateId, validateCreateUpdateSubCategory, updateSubCategory)
  .delete(auth,validateId, deleteSubCategory);

module.exports = router;
