// scripts/seedAll.js
require('module-alias/register');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const slugify = require('slugify');
const fs = require('fs');

const Category = require('@models/categoryModel');
const Product = require('@models/productModel');

const logger = (() => {
  try {
    return require('@utils/logger');
  } catch {
    return console;
  }
})();

// Load env
dotenv.config({ path: path.join(__dirname, '../..', 'config.env') });

const DB = process.env.DB_STR;
if (!DB) {
  logger.error('❌ DB_STR not found in environment. Set config.env DB_STR');
  process.exit(1);
}

// Load data file
const DATA_PATH = path.join(__dirname, 'seed-data.json');
if (!fs.existsSync(DATA_PATH)) {
  logger.error('❌ Seed data file not found at %s', DATA_PATH);
  process.exit(1);
}
const raw = fs.readFileSync(DATA_PATH, 'utf8');
const DATA = JSON.parse(raw);

const { categories = [], products = [] } = DATA;

const maybeObjectId = (id) => {
  if (!id) return undefined;
  if (mongoose.Types.ObjectId.isValid(id)) {
    // must construct with 'new' to avoid "Class constructor ObjectId cannot be invoked" error
    return new mongoose.Types.ObjectId(id);
  }
  return undefined;
};

async function connectDB() {
  await mongoose.connect(DB, {
    serverSelectionTimeoutMS: 5000,
    autoIndex: false, // recommended in production
  });
  logger.info('✅ MongoDB connected');
}

async function upsertCategories() {
  logger.info(`Seeding ${categories.length} categories (upsert)`);
  for (const c of categories) {
    const payload = {
      name: c.name,
      slug: c.slug || slugify(c.name, { lower: true }),
      image: c.image || '',
    };
    if (c._id && mongoose.Types.ObjectId.isValid(c._id)) {
      await Category.updateOne(
        { _id: c._id },
        { $set: payload },
        { upsert: true, setDefaultsOnInsert: true }
      );
      logger.info(`  - upserted category '${payload.name}' (_id: ${c._id})`);
    } else {
      logger.error(`  - upserted category faild id is not defined`);
      process.exit(1);
    }
  }
}

async function upsertProducts() {
  logger.info(`Seeding ${products.length} products (upsert)`);

  for (const p of products) {
    const productPayload = {
      title: p.title,
      slug: p.slug || slugify(p.title, { lower: true }),
      description: p.description || '',
      quantity: Number.isFinite(Number(p.quantity)) ? Number(p.quantity) : 0,
      sold: Number.isFinite(Number(p.sold)) ? Number(p.sold) : 0,
      price: p.price !== undefined ? Number(p.price) : 0,
      priceAfterDiscount:
        p.priceAfterDiscount !== undefined ? Number(p.priceAfterDiscount) : undefined,
      imageCover: p.imageCover || '',
      images: p.images || [],
      ratingsAverage: p.ratingsAverage !== undefined ? Number(p.ratingsAverage) : undefined,
      ratingsQuantity: p.ratingsQuantity !== undefined ? Number(p.ratingsQuantity) : 0,
    };

    // Attach category
    if (p.category && mongoose.Types.ObjectId.isValid(p.category)) {
      productPayload.category = maybeObjectId(p.category);
    } else {
      logger.warn(`  - product '${p.title}' has invalid category id '${p.category}', skipping`);
      continue;
    }

    // upsert by slug
    await Product.updateOne(
      { slug: productPayload.slug },
      { $set: productPayload },
      { upsert: true, setDefaultsOnInsert: true }
    );

    logger.info(`  - upserted product '${productPayload.title}' (slug: ${productPayload.slug})`);
  }
}

async function run() {
  try {
    await connectDB();

    await upsertCategories();
    await upsertProducts();

    logger.info('✅ Seeding complete');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    logger.error('❌ Seeding failed:', err);
    try {
      await mongoose.connection.close();
    } catch (e) {
      /* ignore */
    }
    process.exit(1);
  }
}

run();
