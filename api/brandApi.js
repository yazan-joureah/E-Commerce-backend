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
  validateCreateBrand,
  validateId,
  validatePagination,
} = require('@middleware/validators/brandValidator');

const router = express.Router();

router.route('/').get(validatePagination, getBrands).post(validateCreateBrand, createBrand);

router
  .route('/:id')
  .get(validateId, getBrand)
  .put(validateId, validateCreateBrand, updateBrand)
  .delete(validateId, deleteBrand);

module.exports = router;
