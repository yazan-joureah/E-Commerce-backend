const { validationResult } = require('express-validator');

const runValidation = (validations) => {
  return async (req, res, next) => {
    for (let validator of validations) {
      await validator.run(req);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array().map((e) => ({
          field: e.param,
          message: e.msg,
          type: e.type,
          nested: e.nestedErrors,
          path: e.path,
          location: e.location,
        })),
      });
    }

    next();
  };
};

module.exports = runValidation;
