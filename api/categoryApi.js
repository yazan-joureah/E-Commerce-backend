// api/categoryApi.js
const express = require('express');

const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  
  
} = require('@services/categoryService');

const {
  validateCreateUpdateCategory,
  validateId,
  validatePagination,
} = require('@middleware/validators/categoryValidator');

const { uploadSingleImage } = require('@middleware/uploadImages');


const subCategoryApi = require('@api/subCategoryApi');

const router = express.Router();

router.use('/:categoryId/sub-categories', subCategoryApi);

router
  .route('/')
  .get(validatePagination, getCategories)
  .post(uploadSingleImage('categories', 'image'),validateCreateUpdateCategory, createCategory);

router
  .route('/:id')
  .get(validateId, getCategory)
  .put(validateId, validateCreateUpdateCategory, updateCategory)
  .delete(validateId, deleteCategory);

module.exports = router;
