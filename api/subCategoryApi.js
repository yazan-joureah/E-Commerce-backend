const express = require('express');

const {
  getSubCategories,
  getSubCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} = require('@services/subCategoryService');

const {
  validateCreateSubCategory,
  validateId,
  validatePagination,
} = require('@middleware/validators/subCategoryValidator');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(validatePagination, getSubCategories)
  .post(validateCreateSubCategory, createSubCategory);

router
  .route('/:id')
  .get(validateId, getSubCategory)
  .put(validateId, validateCreateSubCategory, updateSubCategory)
  .delete(validateId, deleteSubCategory);

module.exports = router;
