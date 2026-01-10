const sendErrDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status || 'error',
    'status code': err.statusCode,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrProd = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status || 'error',
    'status code': err.statusCode,
    message: err.message,
  });
};

const globalError = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;

  if (process.env.NODE_ENV === 'development') {
    sendErrDev(err, res);
  } else {
    sendErrProd(err, res);
  }
};

module.exports = globalError;
