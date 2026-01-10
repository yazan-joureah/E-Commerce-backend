const mongoose = require('mongoose');

// 1- create schema
const BrandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand Name Required'],
      unique: [true, 'Brand Name Must Be Unique'],
      minlength: [3, 'Too Short Name'], // Corrected spelling
      maxlength: [50, 'Too Long Brand Name'], // Corrected spelling
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
const BrandModel = mongoose.model('Brand', BrandSchema);

module.exports = BrandModel;
