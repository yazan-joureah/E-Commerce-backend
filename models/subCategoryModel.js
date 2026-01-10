const mongoose = require("mongoose")

const subCategorySchema = new mongoose.Schema({
    name:{
        type: String,
        trim: true,
        unique: [true,"Subcategory must be unique"],
        minlength: [3,"Too short subcategory name"],
        maxlength: [32,"Too long subcategory name"],
    },
    slug:{
        type: String,
        lowercase: true
    },
    category:{
        type: mongoose.Schema.ObjectId,
        ref: 'Category',
        required: [true,"Subcategory must belong to a parent category"]
    }
},{timestamps:true})

module.exports = mongoose.model('SubCategory',subCategorySchema)