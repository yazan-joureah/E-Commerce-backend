// /services/productService.js
const slugify = require('slugify');
const ApiError = require('@utils/ApiError');
const ApiFeatures = require('@utils/ApiFeatures');
const Product = require('@models/productModel');
const asyncHandler = require('express-async-handler');

// @desc    Get listq of products
// @route   GET /api/v1/products
// @access  Public
exports.getproducts = asyncHandler(async (req, res) => {
  const countDocuments = await Product.countDocuments();
  const apiFeatures = new ApiFeatures(Product.find(), req.query)
    .filter()
    .sort()
    .search()
    .limitFields()
    .paginate(countDocuments);

  const { mongooseQuery, paginationResult } = apiFeatures;
  const products = await mongooseQuery;

  res.status(200).json({
    status: 'success',
    results: products.length,
    paginationResult,
    data: products
  });
});

// @desc    Get specific Product by id
// @route   GET /api/v1/products/:id
// @access  Public
exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ApiError(`No product found with id: ${req.params.id}`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: product
  });
});

// @desc    Create Product
// @route   POST  /api/v1/products
// @access  Private
exports.createProduct = asyncHandler(async (req, res) => {
  req.body.slug = slugify(req.body.title);
  const product = await Product.create(req.body);

  res.status(201).json({
    status: 'success',
    data: product
  });
});

// @desc    Update specific Product
// @route   PUT /api/v1/products/:id
// @access  Private
exports.updateProduct = asyncHandler(async (req, res, next) => {
  req.body.slug = slugify(req.body.title);

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!product) {
    return next(new ApiError(`No product found with id: ${req.params.id}`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: product
  });
});

// @desc    Delete specific Product
// @route   DELETE /api/v1/products/:id
// @access  Private
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return next(new ApiError(`No product found with id: ${req.params.id}`, 404));
  }

  res.status(204).send();
});
