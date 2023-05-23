const AppError = require('../utils/appErr');

const handleErrDBCast = (err) => {
  const message = `invalid${err.path} ${err.value}`;
  return new AppError(message, 400);
};
const handleDuplicateFeildDB = (err) => {
  const value = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  console.log(value);
  const message = `this ${value} is reserved use another value`;
  return new AppError(message, 400);
};

const handleJwt = (err) => {
  const message = `invalid login, please login again, ${err.name}`;
  return new AppError(message, 401);
};
const handleJwtExpiration = () => {
  const message = `login is expired ,please log again`;
  return new AppError(message, 401);
};

const handleValidationDB = (err) => {
  const error = Object.values(err.errors).map((el) => el.message);
  const message = error.join(' ,');
  return new AppError(message, 400);
};

const sendErrProduction = (err, res) => {
  if (err.isOpretional) {
    res.status(err.statusCode).json({
      status: err.message,
      message: err.message,
    });
  } else {
    //log the error
    console.log('error', err.message);
    // send a dummy res to the client
    res.status(500).json({
      status: 'error',
      message: 'something went wrong',
    });
  }
};
const sendErrDevelpment = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    name: err.name,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

exports.errorController = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500; //internal server error
  err.status = err.status || 'fail';
  if (process.env.NODE_ENV === 'development') {
    sendErrDevelpment(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    let error = { ...err };
    if (error.name === 'CastError') error = handleErrDBCast(error); //for requesting wrong id
    if (error.code === 11000) error = handleDuplicateFeildDB(error); // post the same name of tour
    if (error.name === 'ValidationError') error = handleValidationDB(error); //vlidtion error
    if (error.name === 'JsonWebTokenError') error = handleJwt(error); //vlidtion error
    if (error.name === 'TokenExpiredError') error = handleJwtExpiration(); // err expiration time for the token
    sendErrProduction(error, res);
  }
};
