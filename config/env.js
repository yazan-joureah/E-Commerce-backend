// config/env.js
const envalid = require('envalid');
const { str, port, makeValidator } = envalid;

/**
 * Custom validator for MongoDB connection string.
 * Ensures value parses as a URL and has protocol mongodb: or mongodb+srv:
 */
const mongoUrl = makeValidator((v) => {
  if (!v) {
    throw new Error('DB_STR is required');
  }
  try {
    // Use WHATWG URL parser to ensure it's a valid URL-like string
    const parsed = new URL(v);
    // parsed.protocol includes trailing ':' e.g. 'mongodb:'
    if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol)) {
      throw new Error('DB_STR must start with "mongodb://" or "mongodb+srv://"');
    }
    return v;
  } catch (err) {
    // if URL constructor throws or our check failed, treat as invalid
    throw new Error('Invalid MongoDB connection string for DB_STR');
  }
});

function validateEnv() {
  return envalid.cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
    PORT: port({ default: 3000 }),
    CORS_ORIGIN: str({ default: '*' }),
    DB_STR: mongoUrl(), // will throw if missing/invalid
  });
}

module.exports = validateEnv;
