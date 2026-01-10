const slugify = require('slugify');
const ApiError = require('@utils/ApiError');
const asyncHandler = require('express-async-handler');
const SubCategory = require('@models/subCategoryModel');
const { getPagination } = require('@utils/paginationHelper');

// @desc    Get list of subcategories with pagination and optional category filter
// @route   GET /api/v1/categories/:categoryId/sub-categories
// @route   GET /api/v1/sub-categories
// @access  Public
exports.getSubCategories = asyncHandler(async (req, res) => {
  const filter = req.params.categoryId ? { category: req.params.categoryId } : {};

  const { page, limit, skip } = getPagination(req.query);

  const subCategories = await SubCategory.find(filter).skip(skip).limit(limit);

  const total = await SubCategory.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: subCategories.length,
    page,
    totalPages: Math.ceil(total / limit),
    data: subCategories,
  });
});

// @desc    Create new subcategory
// @route   POST /api/v1/sub-categories
// @access  Private
exports.createSubCategory = asyncHandler(async (req, res) => {
  const { name, category } = req.body;

  const subCategory = await SubCategory.create({
    name,
    slug: slugify(name),
    category,
  });

  res.status(201).json({
    status: 'success',
    data: subCategory,
  });
});

// @desc    Get subcategory by ID
// @route   GET /api/v1/sub-categories/:id
// @access  Public
exports.getSubCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const subCategory = await SubCategory.findById(id);

  if (!subCategory) {
    return next(new ApiError(`No sub-category found for id: ${id}`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: subCategory,
  });
});

// @desc    Update subcategory by ID
// @route   PUT /api/v1/sub-categories/:id
// @access  Private
exports.updateSubCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, category } = req.body;

  const subCategory = await SubCategory.findByIdAndUpdate(
    id,
    { name, slug: slugify(name), category },
    { new: true, runValidators: true }
  );

  if (!subCategory) {
    return next(new ApiError(`No sub-category found for id: ${id}`, 404));
  }

  res.status(200).json({
    status: 'success',
    data: subCategory,
  });
});

// @desc    Delete subcategory by ID
// @route   DELETE /api/v1/sub-categories/:id
// @access  Private
exports.deleteSubCategory = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const subCategory = await SubCategory.findByIdAndDelete(id);

  if (!subCategory) {
    return next(new ApiError(`No sub-category found for id: ${id}`, 404));
  }

  res.status(204).send();
});
