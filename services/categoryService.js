// /services/categoryService.js
const Category = require('@models/categoryModel');
<<<<<<< HEAD
const Factory = require('@services/handlersFactory');

=======
const Factory = require('@services/handlersFactory')
>>>>>>> 0d069d1694a940c82f499278be06ae254d02fbc2

// @desc    Get list of categories
// @route   GET /api/v1/categories
// @access  Public
<<<<<<< HEAD
exports.getCategories = Factory.getAll(Category);
=======
exports.getCategories = Factory.getAll(Category)
>>>>>>> 0d069d1694a940c82f499278be06ae254d02fbc2

// @desc    Get specific category by id
// @route   GET /api/v1/categories/:id
// @access  Public
<<<<<<< HEAD
exports.getCategory = Factory.getOne(Category);

=======
exports.getCategory = Factory.getOne(Category)
>>>>>>> 0d069d1694a940c82f499278be06ae254d02fbc2

// @desc    Create category
// @route   POST /api/v1/categories
// @access  Private
<<<<<<< HEAD
exports.createCategory = Factory.createOne(Category);
=======
exports.createCategory = Factory.createOne(Category)
>>>>>>> 0d069d1694a940c82f499278be06ae254d02fbc2

// @desc    Update specific category
// @route   PUT /api/v1/categories/:id
// @access  Private
<<<<<<< HEAD
exports.updateCategory = Factory.updateOne(Category);
=======
exports.updateCategory =  Factory.updateOne(Category)
>>>>>>> 0d069d1694a940c82f499278be06ae254d02fbc2

// @desc    Delete specific category
// @route   DELETE /api/v1/categories/:id
// @access  Private
<<<<<<< HEAD
exports.deleteCategory = Factory.deleteOne(Category);
=======
exports.deleteCategory = Factory.deleteOne(Category)
>>>>>>> 0d069d1694a940c82f499278be06ae254d02fbc2
