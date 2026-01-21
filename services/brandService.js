// /services/brandServices.js
const Brand = require('@models/brandModel');
const Factory = require('@services/handlersFactory')

// @desc    Get list of brands
// @route   GET /api/v1/brands
// @access  Public
exports.getBrands = Factory.getAll(Brand)

// @desc    Get specific Brand by id
// @route   GET /api/v1/brands/:id
// @access  Public
exports.getBrand = Factory.getOne(Brand)

// @desc    Create Brand
// @route   POST  /api/v1/brands
// @access  Private
exports.createBrand = Factory.createOne(Brand)

// @desc    Update specific Brand
// @route   PUT /api/v1/brands/:id
// @access  Private
exports.updateBrand = Factory.updateOne(Brand)

// @desc    Delete specific Brand
// @route   DELETE /api/v1/brands/:id
// @access  Private
exports.deleteBrand = Factory.deleteOne(Brand);
