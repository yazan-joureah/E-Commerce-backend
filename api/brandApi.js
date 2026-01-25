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

<<<<<<< HEAD
router.route('/')
.get(validatePagination, getBrands)
.post(uploadSingleImage('brands','image'),validateCreateUpdateBrand, createBrand);
=======
router.route('/').get(validatePagination, getBrands).post(validateCreateUpdateBrand, createBrand);
>>>>>>> 0d069d1694a940c82f499278be06ae254d02fbc2

router
  .route('/:id')
  .get(validateId, getBrand)
<<<<<<< HEAD
  .put(validateId,uploadSingleImage('brands','image'), validateCreateUpdateBrand, updateBrand)
=======
  .put(validateId, validateCreateUpdateBrand, updateBrand)
>>>>>>> 0d069d1694a940c82f499278be06ae254d02fbc2
  .delete(validateId, deleteBrand);

module.exports = router;
