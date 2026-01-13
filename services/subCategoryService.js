// /services/subCategoryService.js
const slugify = require('slugify');
const ApiError = require('@utils/ApiError');
const ApiFeatures = require('@utils/ApiFeatures');
const asyncHandler = require('express-async-handler');
const SubCategory = require('@models/subCategoryModel');
const { getPagination } = require('@utils/paginationHelper');

// @desc    Get list of subcategories with pagination and optional category filter
// @route   GET /api/v1/categories/:categoryId/sub-categories
// @route   GET /api/v1/sub-categories
// @access  Public
exports.getSubCategories = asyncHandler(async (req, res) => {
  const filter = req.params.categoryId ? { category: req.params.categoryId } : {};
  const countDocuments = await SubCategory.countDocuments(filter);

  const apiFeatures = new ApiFeatures(SubCategory.find(filter), req.query)
    .paginate(countDocuments);

  const { mongooseQuery, paginationResult } = apiFeatures;
  const subCategories = await mongooseQuery;

  res.status(200).json({
    status: 'success',
    results: subCategories.length,
    paginationResult,
    data: subCategories
  });
});

// @desc    Create new subcategory
// @route   POST /api/v1/sub-categories
// @access  Private
exports.createSubCategory = asyncHandler(async (req, res) => {
  const subCategory = await SubCategory.create({
    name: req.body.name,
    slug: slugify(req.body.name),
    category: req.body.category
  });

  res.status(201).json({
    status: 'success',
    data: subCategory
  });
});

// @desc    Get subcategory by ID
// @route   GET /api/v1/sub-categories/:id
// @access  Public
exports.getSubCategory = asyncHandler(async (req, res, next) => {
  const subCategory = await SubCategory.findById(req.params.id);

  if (!subCategory) {
    return next(new ApiError(`No sub-category found with id: ${req.params.id}`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: subCategory
  });
});

// @desc    Update subcategory by ID
// @route   PUT /api/v1/sub-categories/:id
// @access  Private
exports.updateSubCategory = asyncHandler(async (req, res, next) => {
  const subCategory = await SubCategory.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      slug: slugify(req.body.name),
      category: req.body.category
    },
    { new: true, runValidators: true }
  );

  if (!subCategory) {
    return next(new ApiError(`No sub-category found with id: ${req.params.id}`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: subCategory
  });
});

// @desc    Delete subcategory by ID
// @route   DELETE /api/v1/sub-categories/:id
// @access  Private
exports.deleteSubCategory = asyncHandler(async (req, res, next) => {
  const subCategory = await SubCategory.findByIdAndDelete(req.params.id);

  if (!subCategory) {
    return next(new ApiError(`No sub-category found with id: ${req.params.id}`, 404));
  }

  res.status(204).send();
});
