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

const router = express.Router();

router.route('/').get(validatePagination, getBrands).post(validateCreateUpdateBrand, createBrand);

router
  .route('/:id')
  .get(validateId, getBrand)
  .put(validateId, validateCreateUpdateBrand, updateBrand)
  .delete(validateId, deleteBrand);

module.exports = router;
