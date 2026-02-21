// api/brandApi.js
const express = require('express');

const {
  getBrands,
  getBrand,
  createBrand,
  updateBrand,
  deleteBrand,
} = require('@services/brandService');

const {
  validateCreateUpdateBrand,
  validateId,
  validatePagination,
} = require('@middleware/validators/brandValidator');

const { uploadSingleImage } = require('@middleware/uploadImages');
const { auth } = require('@services/authService');


const router = express.Router();

router.route('/')
.get(validatePagination, getBrands)
.post(uploadSingleImage('brands','image'),auth,validateCreateUpdateBrand, createBrand);

router
  .route('/:id')
  .get(validateId, getBrand)
  .put(uploadSingleImage('brands','image'),auth,validateId, validateCreateUpdateBrand, updateBrand)
  .delete(auth,validateId, deleteBrand);

module.exports = router;
