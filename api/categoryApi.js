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
const { auth, allowed } = require('@services/authService');

const router = express.Router();

router.use('/:categoryId/sub-categories', subCategoryApi);

router
  .route('/')
  .get(validatePagination, getCategories)
  .post(uploadSingleImage('categories', 'image'),auth,allowed('admin'),validateCreateUpdateCategory, createCategory);

router
  .route('/:id')
  .get(validateId, getCategory)
  .put(auth,validateId,allowed('admin'), validateCreateUpdateCategory, updateCategory)
  .delete(auth,allowed('admin'),validateId, deleteCategory);

module.exports = router;
