// /services/brandServices.js
const slugify = require('slugify');
const ApiError = require('@utils/ApiError');
const Brand = require('@models/brandModel');
const ApiFeatures = require('@utils/ApiFeatures');
const asyncHandler = require('express-async-handler');

// @desc    Get list of brands
// @route   GET /api/v1/brands
// @access  Public
exports.getBrands = asyncHandler(async (req, res) => {
  const countDocuments = await Brand.countDocuments();
  const apiFeatures = new ApiFeatures(Brand.find(), req.query)
    .limitFields()
    .paginate(countDocuments);

  const { mongooseQuery, paginationResult } = apiFeatures;
  const brands = await mongooseQuery;
  res.status(200).json({
    status: 'success',
    results: brands.length,
    paginationResult,
    data: brands
  });
});

// @desc    Get specific Brand by id
// @route   GET /api/v1/brands/:id
// @access  Public
exports.getBrand = asyncHandler(async (req, res, next) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) {
    return next(new ApiError(`No brand found with id: ${req.params.id}`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: brand
  });
});

// @desc    Create Brand
// @route   POST  /api/v1/brands
// @access  Private
exports.createBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.create({
    name: req.body.name,
    slug: slugify(req.body.name)
  });

  res.status(201).json({
    status: 'success',
    data: brand
  });
});

// @desc    Update specific Brand
// @route   PUT /api/v1/brands/:id
// @access  Private
exports.updateBrand = asyncHandler(async (req, res, next) => {
  const brand = await Brand.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      slug: slugify(req.body.name)
    },
    { new: true, runValidators: true }
  );

  if (!brand) {
    return next(new ApiError(`No brand found with id: ${req.params.id}`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: brand
  });
});

// @desc    Delete specific Brand
// @route   DELETE /api/v1/brands/:id
// @access  Private
exports.deleteBrand = asyncHandler(async (req, res, next) => {
  const brand = await Brand.findByIdAndDelete(req.params.id);

  if (!brand) {
    return next(new ApiError(`No brand found with id: ${req.params.id}`, 404));
  }

  res.status(204).send();
});
