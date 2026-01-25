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

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(validatePagination, getSubCategories)
  .post(validateCreateUpdateSubCategory, createSubCategory);

router
  .route('/:id')
  .get(validateId, getSubCategory)
  .put(validateId, validateCreateUpdateSubCategory, updateSubCategory)
  .delete(validateId, deleteSubCategory);

module.exports = router;
