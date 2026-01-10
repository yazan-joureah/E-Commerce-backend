const mongoose = require('mongoose');

async function dbConnection() {
  let db_str = '';
  if (!process.env.DB_STR) {
    console.error('❌ Missing DB_STR in environment.');
    process.exit(1);
  }

  if (process.env.NODE_ENV == 'development') {
    db_str = process.env.DB_STR;
  } else {
    db_str = process.env.DB_STR;
  }
  try {
    const conn = await mongoose.connect(db_str, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: false, // recommended in production
    });

    console.log('✅ MongoDB connected:', conn.connection.host);

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB runtime error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
  } catch (err) {
    console.error(`❌ DB connection failed: ${err.name} | ${err.message}`);
    process.exit(1);
  }
}

module.exports = dbConnection;
