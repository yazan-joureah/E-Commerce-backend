// api/productApi.js
const express = require('express');

const {
  getproducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('@services/productService');

const {
  validateCreateProduct,
  validateUpdateProduct,
  validateId,
  validatePagination,
} = require('@validators/productValidator');

const router = express.Router();

router.route('/').get(validatePagination, getproducts).post(validateCreateProduct, createProduct);

router
  .route('/:id')
  .get(validateId, getProduct)
  .put(validateId, validateUpdateProduct, updateProduct)
  .delete(validateId, deleteProduct);

module.exports = router;
