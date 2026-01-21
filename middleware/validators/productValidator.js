const { body, check, query } = require('express-validator');
const mongoose = require('mongoose');
const { default: slugify } = require('slugify');

const runValidation = require('@utils/baseValidator');
const Category = require('@models/categoryModel');
const SubCategory = require('@models/subCategoryModel');
const Brand = require('@models/brandModel');
const Product = require('@models/productModel');

// Validators
/**
 * Helper: ensure value is an array of ids (or a single id)
 */
const normalizeIds = (val) => (Array.isArray(val) ? val : [val]);

exports.validateCreateProduct = runValidation([
  // title
  body('title')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Title must be 3–50 chars').custom((val,{req})=>{
          req.body.slug= slugify(val)
          return true;
        })
    .escape(),

  // description
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 3 })
    .withMessage('Description must be at least 3 characters long')
    .escape(),

  // quantity
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer')
    .toInt(),

  // price
  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number')
    .toFloat(),

  // priceAfterDiscount
  body('priceAfterDiscount')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('priceAfterDiscount must be a number')
    .toFloat()
    .custom((value, { req }) => {
      if (value != null) {
        // price must exist in body and be a valid number
        const priceRaw = req.body.price;
        const price = priceRaw !== undefined ? parseFloat(priceRaw) : NaN;
        if (Number.isNaN(price)) {
          throw new Error('price must be provided when using priceAfterDiscount');
        }
        if (value >= price) {
          throw new Error('priceAfterDiscount must be lower than price');
        }
      }
      return true;
    }),

  // imageCover
  body('imageCover')
    .notEmpty()
    .withMessage('imageCover is required')
    .isString()
    .withMessage('imageCover must be a string (URL/path)')
    .trim(),

  // images array
  body('images').optional().isArray().withMessage('images must be an array').bail(),
  body('images.*')
    .optional()
    .isString()
    .withMessage('each image must be a string (URL/path)')
    .trim(),

  // category (required) + existence check
  check('category')
    .notEmpty()
    .withMessage('category id is required')
    .bail()
    .isMongoId()
    .withMessage('Invalid ID format')
    .bail()
    .custom(async (categoryId) => {
      const cat = await Category.findById(categoryId).select('_id');
      if (!cat) throw new Error(`No category found for id: ${categoryId}`);
      return true;
    }),

  // subCategory: optional, supports single id or array of ids.
  check('subCategory')
    .optional()
    .custom(async (val, { req }) => {
      // normalize to array
      const ids = normalizeIds(val);

      // validate id formats
      for (const id of ids) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error(`Invalid subCategory ID format: ${id}`);
        }
      }

      // check existence in DB
      const found = await SubCategory.find({ _id: { $in: ids } }).select('_id category');
      if (!found || found.length !== ids.length) {
        throw new Error('One or more sub-category IDs do not exist');
      }

      // if category provided in body, ensure each subCategory belongs to that category
      const categoryId = req.body.category;
      if (categoryId) {
        // make sure categoryId is valid (it is validated earlier, but be defensive)
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
          throw new Error('Invalid category ID format (for subCategory check)');
        }
        // ensure all found subcategories reference the same category
        const mismatched = found.some((s) => String(s.category) !== String(categoryId));
        if (mismatched) {
          throw new Error('One or more sub-categories do not belong to the provided category');
        }
      }

      return true;
    }),

  // brand: optional, existence check
  check('brand')
    .optional()
    .isMongoId()
    .withMessage('Invalid ID format')
    .bail()
    .custom(async (brandId) => {
      const bra = await Brand.findById(brandId).select('_id');
      if (!bra) throw new Error(`No brand found for id: ${brandId}`);
      return true;
    }),

  // ratingsAverage
  body('ratingsAverage')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('ratingsAverage must be a number between 1 and 5')
    .toFloat(),

  // ratingsQuantity
  body('ratingsQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('ratingsQuantity must be a non-negative integer')
    .toInt(),
]);

// For updates: all fields optional but still validated if present
/**
 * validateUpdateProduct
 * - all fields optional, but validated if present
 * - priceAfterDiscount will compare against provided price OR the existing product price (req.params.id)
 */
exports.validateUpdateProduct = runValidation([
  // title
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Title must be 3–50 chars').custom((val,{req})=>{
          req.body.slug= slugify(val)
          return true;
        })
    .escape(),

  // description
  body('description')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Description must be at least 3 characters long')
    .escape(),

  // quantity
  body('quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer')
    .toInt(),

  // price
  body('price')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number')
    .toFloat(),

  // priceAfterDiscount
  body('priceAfterDiscount')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('priceAfterDiscount must be a number')
    .toFloat()
    .bail()
    .custom(async (value, { req }) => {
      if (value == null) return true;

      // If price present in body, use it
      if (req.body.price !== undefined) {
        const priceFromBody = parseFloat(req.body.price);
        if (Number.isNaN(priceFromBody)) {
          throw new Error('price must be a valid number when using priceAfterDiscount');
        }
        if (value >= priceFromBody) {
          throw new Error('priceAfterDiscount must be lower than price');
        }
        return true;
      }

      // Otherwise try to load existing product price using req.params.id
      const productId = req.params && req.params.id;
      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        throw new Error(
          'price must be provided when using priceAfterDiscount (product id missing)'
        );
      }

      const existing = await Product.findById(productId).select('price');
      if (!existing) {
        throw new Error(`Product not found to validate priceAfterDiscount (id: ${productId})`);
      }

      const currentPrice = existing.price;
      if (currentPrice == null || Number.isNaN(Number(currentPrice))) {
        throw new Error('Existing product price is invalid for priceAfterDiscount validation');
      }
      if (value >= currentPrice) {
        throw new Error('priceAfterDiscount must be lower than the current product price');
      }
      return true;
    }),

  // imageCover
  body('imageCover')
    .optional()
    .isString()
    .withMessage('imageCover must be a string (URL/path)')
    .trim(),

  // images array
  body('images').optional().isArray().withMessage('images must be an array').bail(),
  body('images.*')
    .optional()
    .isString()
    .withMessage('each image must be a string (URL/path)')
    .trim(),

  // category (optional) with existence check
  check('category')
    .optional()
    .bail()
    .isMongoId()
    .withMessage('Invalid ID format')
    .bail()
    .custom(async (categoryId) => {
      const cat = await Category.findById(categoryId).select('_id');
      if (!cat) throw new Error(`No category found for id: ${categoryId}`);
      return true;
    }),

  // subCategory: optional, supports single id or array of ids
  check('subCategory')
    .optional()
    .bail()
    .custom(async (val, { req }) => {
      const ids = normalizeIds(val);

      // validate ids format
      for (const id of ids) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new Error(`Invalid subCategory ID format: ${id}`);
        }
      }

      // check existence
      const found = await SubCategory.find({ _id: { $in: ids } }).select('_id category');
      if (!found || found.length !== ids.length) {
        throw new Error('One or more sub-category IDs do not exist');
      }

      // determine category to check against:
      // 1) prefer req.body.category if provided
      // 2) else fall back to product's existing category (if req.params.id provided)
      let categoryToCheck = req.body.category;
      if (!categoryToCheck) {
        const productId = req.params && req.params.id;
        if (productId && mongoose.Types.ObjectId.isValid(productId)) {
          const existingProduct = await Product.findById(productId).select('category');
          if (existingProduct) {
            categoryToCheck = String(existingProduct.category);
          }
        }
      }

      if (categoryToCheck) {
        // ensure categoryToCheck is valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(categoryToCheck)) {
          throw new Error('Invalid category ID format (for subCategory check)');
        }

        // verify each found subCategory belongs to categoryToCheck
        const mismatched = found.some((s) => String(s.category) !== String(categoryToCheck));
        if (mismatched) {
          throw new Error('One or more sub-categories do not belong to the provided category');
        }
      }

      return true;
    }),

  // brand: optional, existence check
  check('brand')
    .optional()
    .bail()
    .isMongoId()
    .withMessage('Invalid ID format')
    .bail()
    .custom(async (brandId) => {
      const bra = await Brand.findById(brandId).select('_id');
      if (!bra) throw new Error(`No brand found for id: ${brandId}`);
      return true;
    }),

  // ratingsAverage
  body('ratingsAverage')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('ratingsAverage must be a number between 1 and 5')
    .toFloat(),

  // ratingsQuantity
  body('ratingsQuantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('ratingsQuantity must be a non-negative integer')
    .toInt(),
]);

// validate :id param
exports.validateId = runValidation([
  check('id').notEmpty().withMessage('Id is required').isMongoId().withMessage('Invalid ID format'),
]);

// pagination validator
exports.validatePagination = runValidation([
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1–100'),
]);
