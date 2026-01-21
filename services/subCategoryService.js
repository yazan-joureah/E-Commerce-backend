// /services/subCategoryService.js
const Factory = require('@services/handlersFactory')
const SubCategory = require('@models/subCategoryModel');


// @desc    Get list of subcategories with pagination and optional category filter
// @route   GET /api/v1/categories/:categoryId/sub-categories
// @route   GET /api/v1/sub-categories
// @access  Public
exports.getSubCategories = Factory.getAll(SubCategory)


// @desc    Get subcategory by ID
// @route   GET /api/v1/sub-categories/:id
// @access  Public
exports.getSubCategory = Factory.getOne(SubCategory)

// @desc    Create new subcategory
// @route   POST /api/v1/sub-categories
// @access  Private
exports.createSubCategory = Factory.createOne(SubCategory)

// @desc    Update subcategory by ID
// @route   PUT /api/v1/sub-categories/:id
// @access  Private
exports.updateSubCategory =  Factory.updateOne(SubCategory)

// @desc    Delete subcategory by ID
// @route   DELETE /api/v1/sub-categories/:id
// @access  Private
exports.deleteSubCategory = Factory.deleteOne(SubCategory)
