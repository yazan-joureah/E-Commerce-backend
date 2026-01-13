const mongoose = require('mongoose');

async function dbConnection() {
  // Validate environment variable
  if (!process.env.DB_STR) {
    console.error('❌ Missing DB_STR in environment.');
    process.exit(1);
  }

  const db_str = process.env.DB_STR;
  const db_name = process.env.DB_NAME || 'ecommerce'; // Default to 'ecommerce'

  try {
    // Connect with Mongoose
    const conn = await mongoose.connect(db_str, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: false, // recommended in production
      dbName: db_name // Explicitly set database name
    });

    console.log(`✅ MongoDB connected to database "${db_name}":`, conn.connection.host);

   

    // Event listeners
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