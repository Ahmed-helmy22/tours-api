const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

const userRouter = require('./routes/usersRoute');
const toursRouter = require('./routes/toursRoute');
const reviewRouter = require('./routes/reviewsRoutes');
const viewsRouter = require('./routes/viewsRoutes');

const AppError = require('./utils/appErr');
const errorController = require('./controller/errorController');

//  GLOBAL MIDDELEWARES
// set security http Headers
app.use(helmet());

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  console.log('development envirment');
}
// rate the limit of requests
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests please try again later , withen an hour',
});
app.use('/api', limiter);
// body parser , parse the req.body
app.use(express.json({ limit: '10kb' })); // limit the amount of req data

// Data sanitization against no sql injection,,mongoSanitize() returns a middleware function
app.use(mongoSanitize());
// Data sanitization against xss,, xss() returns a middleware function,,,' cross side scripting attack '
app.use(xss()); // maltious html and js code
// prevent prameter pollution >> duplicate query string parameter ,,hpp >> http parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'difficulty',
      'maxGroupSize',
      'price',
    ],
  })
);
// serve static files
app.use(express.static(path.join(__dirname, 'public')));

// test middleware
app.use((req, res, next) => {
  req.timeHit = new Date().toISOString();
  next();
});
//VIEWS
app.use('/', viewsRouter);
//USERS
app.use('/api/v1/users', userRouter);
//tours
app.use('/api/v1/tours', toursRouter);
// reviews
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`cannot find this ${req.originalUrl} on the server`, 404));
});
app.use(errorController.errorController);

module.exports = app;
