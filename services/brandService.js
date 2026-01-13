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
    const Brands = await mongooseQuery;
    res.status(200).json({ results: Brands.length, paginationResult, data: Brands });
});

// @desc    Get specific Brand by id
// @route   GET /api/v1/brands/:id
// @access  Public
exports.getBrand = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const brand = await Brand.findById(id);
  if (!brand) {
    return next(new ApiError(`No Brand for this id ${id}`, 404));
  }
  res.status(200).json({ data: brand });
});

// @desc    Create Brand
// @route   POST  /api/v1/brands
// @access  Private
exports.createBrand = asyncHandler(async (req, res) => {
  console.log(req.body);
  const name = req.body.name;
  const brand = await Brand.create({ name, slug: slugify(name) });
  res.status(201).json({ data: brand });
});

// @desc    Update specific Brand
// @route   PUT /api/v1/brands/:id
// @access  Private
exports.updateBrand = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name } = req.body;

  const brand = await Brand.findOneAndUpdate(
    { _id: id },
    { name, slug: slugify(name) },
    { new: true }
  );

  if (!brand) {
    return next(new ApiError(`No Brand for this id ${id}`, 404));
  }
  res.status(200).json({ data: brand });
});

// @desc    Delete specific Brand
// @route   DELETE /api/v1/brands/:id
// @access  Private
exports.deleteBrand = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const brand = await Brand.findByIdAndDelete(id);

  if (!brand) {
    return next(new ApiError(`No Brand for this id ${id}`, 404));
  }
  res.status(204).send();
});
