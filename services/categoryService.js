// /services/categoryService.js
const slugify = require('slugify');
const ApiError = require('@utils/ApiError');
const Category = require('@models/categoryModel');
const ApiFeatures = require('@utils/ApiFeatures');
const asyncHandler = require('express-async-handler');

// @desc    Get list of categories
// @route   GET /api/v1/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res) => {
  const countDocuments = await Category.countDocuments();
  const apiFeatures = new ApiFeatures(Category.find(), req.query)
    .limitFields()
    .paginate(countDocuments);

  const { mongooseQuery, paginationResult } = apiFeatures;
  const categories = await mongooseQuery;

  res.status(200).json({
    status: 'success',
    results: categories.length,
    paginationResult,
    data: categories
  });
});

// @desc    Get specific category by id
// @route   GET /api/v1/categories/:id
// @access  Public
exports.getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ApiError(`No category found with id: ${req.params.id}`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: category
  });
});

// @desc    Create category
// @route   POST  /api/v1/categories
// @access  Private
exports.createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create({
    name: req.body.name,
    slug: slugify(req.body.name)
  });

  res.status(201).json({
    status: 'success',
    data: category
  });
});

// @desc    Update specific category
// @route   PUT /api/v1/categories/:id
// @access  Private
exports.updateCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      slug: slugify(req.body.name)
    },
    { new: true, runValidators: true }
  );

  if (!category) {
    return next(new ApiError(`No category found with id: ${req.params.id}`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: category
  });
});

// @desc    Delete specific category
// @route   DELETE /api/v1/categories/:id
// @access  Private
exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    return next(new ApiError(`No category found with id: ${req.params.id}`, 404));
  }

  res.status(204).send();
});
