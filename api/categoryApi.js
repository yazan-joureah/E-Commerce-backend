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
<<<<<<< HEAD
  .post(uploadSingleImage('categories', 'image'),validateCreateUpdateCategory, createCategory);
=======
  .post(validateCreateUpdateCategory, createCategory);
>>>>>>> 0d069d1694a940c82f499278be06ae254d02fbc2

router
  .route('/:id')
  .get(validateId, getCategory)
  .put(validateId, validateCreateUpdateCategory, updateCategory)
  .delete(validateId, deleteCategory);

module.exports = router;
