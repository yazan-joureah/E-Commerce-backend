const mongoSanitize = require("mongo-sanitize");

module.exports = function sanitizeRequest(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    sanitizeObject(req.params);
  }
  next();
};

function sanitizeObject(obj) {
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]); // recursively sanitize
    } else {
      obj[key] = mongoSanitize(obj[key]);
    }
  }
}
