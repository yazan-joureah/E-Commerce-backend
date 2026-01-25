const mongoose = require('mongoose');

// 1- create schema
const BrandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Brand Name Required'],
      unique: [true, 'Brand Name Must Be Unique'],
      minlength: [2, 'Too Short Name'], // Corrected spelling
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

const returnURL = (doc)=>{
  if(doc.image){
    const imageURL = `${process.env.BASE_URL}/brands/${doc.image}`;
    doc.image = imageURL;
  }
}

BrandSchema.post('init',(doc)=>{
  returnURL(doc);
})

BrandSchema.post('save',(doc)=>{
  returnURL(doc)
})

// 2- Create models
const BrandModel = mongoose.model('Brand', BrandSchema);

module.exports = BrandModel;
