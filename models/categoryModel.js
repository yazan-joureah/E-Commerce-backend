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

const returnURL = (doc)=>{
  if(doc.image){
    const imageURL = `${process.env.BASE_URL}/categories/${doc.image}`;
    doc.image = imageURL;
  }
}

CategorySchema.post('init',(doc)=>{
  returnURL(doc);
})

CategorySchema.post('save',(doc)=>{
  returnURL(doc)
})
// 2- Create models
const CategoryModel = mongoose.model('Category', CategorySchema);

module.exports = CategoryModel;
