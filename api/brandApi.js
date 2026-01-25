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


const router = express.Router();

router.route('/')
.get(validatePagination, getBrands)
.post(uploadSingleImage('brands','image'),validateCreateUpdateBrand, createBrand);

router
  .route('/:id')
  .get(validateId, getBrand)
  .put(validateId,uploadSingleImage('brands','image'), validateCreateUpdateBrand, updateBrand)
  .delete(validateId, deleteBrand);

module.exports = router;
