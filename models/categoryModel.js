const mongoose = require('mongoose');

// 1- create schema
const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category Name Required'],
      unique: [true, 'Category Name Must Be Unique'],
      minlength: [3, 'Too Short Name'], // Corrected spelling
      maxlength: [50, 'Too Long Category Name'], // Corrected spelling
    },
    slug: {
      type: String,
      lowercase: true,
    },
    image: String,
  },
  { timestamps: true }
); // Corrected option

// 2- Create models
const CategoryModel = mongoose.model('Category', CategorySchema);

module.exports = CategoryModel;
