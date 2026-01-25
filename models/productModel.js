const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [3, 'Too Short Title'],
      maxlength: [50, 'Too Long Title'],
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Product Description Is Required'],
      minlength: [3, 'Too Short Production Description'],
    },
    quantity: {
      type: Number,
      required: [true, 'Product Quantity Is Required'],
    },
    sold: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'Product Price Is Required'],
      trim: true,
      max: [20000, 'Too Long Product Price'],
    },
    priceAfterDiscount: {
      type: Number,
    },
    colors: {
      type: String,
    },
    imageCover: {
      type: String,
      required: [true, 'Product Image Is Required'],
    },
    images: [String],
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Product must belong to a category'],
    },
    subCategory: {
      type: [mongoose.Schema.ObjectId],
      ref: 'SubCategory',
    },
    brand: {
      type: mongoose.Schema.ObjectId,
      ref: 'Brand',
    },
    ratingsAverage: {
      type: Number,
      minlength: [1, 'Rating must be equal or more 1'],
      maxlength: [5, 'Rating must be equal or below 5'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

productSchema.pre(/^find/,function(next){
  this.populate({
    path: ["category","subCategory"],
    select: "name -_id"
  })
  next()
})
module.exports = mongoose.model('Product', productSchema);
