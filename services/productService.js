// /services/productService.js
const Factory = require('@services/handlersFactory')
const Product = require('@models/productModel');

// @desc    Get listq of products
// @route   GET /api/v1/products
// @access  Public
exports.getproducts = Factory.getAll(Product)

// @desc    Get specific Product by id
// @route   GET /api/v1/products/:id
// @access  Public
exports.getProduct = Factory.getOne(Product)

// @desc    Create Product
// @route   POST  /api/v1/products
// @access  Private
exports.createProduct = Factory.createOne(Product)

// @desc    Update specific Product
// @route   PUT /api/v1/products/:id
// @access  Private
exports.updateProduct =  Factory.updateOne(Product)

// @desc    Delete specific Product
// @route   DELETE /api/v1/products/:id
// @access  Private
exports.deleteProduct = Factory.deleteOne(Product)
