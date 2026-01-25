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

const { uploadMixedImages} = require('@middleware/uploadImages');


const router = express.Router();

router.route('/')
.get(validatePagination, getproducts)
.post(uploadMixedImages('products', [
    { name: 'imageCover', maxCount: 1 },   // Single cover image
    { name: 'images', maxCount: 5 }        // Multiple gallery images
  ]),validateCreateProduct, createProduct);

router
  .route('/:id')
  .get(validateId, getProduct)
  .put(validateId,uploadMixedImages, validateUpdateProduct, updateProduct)
  .delete(validateId, deleteProduct);

module.exports = router;
