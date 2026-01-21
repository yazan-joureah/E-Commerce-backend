// /services/categoryService.js
const Category = require('@models/categoryModel');
const Factory = require('@services/handlersFactory')

// @desc    Get list of categories
// @route   GET /api/v1/categories
// @access  Public
exports.getCategories = Factory.getAll(Category)

// @desc    Get specific category by id
// @route   GET /api/v1/categories/:id
// @access  Public
exports.getCategory = Factory.getOne(Category)

// @desc    Create category
// @route   POST  /api/v1/categories
// @access  Private
exports.createCategory = Factory.createOne(Category)

// @desc    Update specific category
// @route   PUT /api/v1/categories/:id
// @access  Private
exports.updateCategory =  Factory.updateOne(Category)

// @desc    Delete specific category
// @route   DELETE /api/v1/categories/:id
// @access  Private
exports.deleteCategory = Factory.deleteOne(Category)