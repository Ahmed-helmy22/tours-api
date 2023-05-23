const tourModel = require('../models/toursModel');
const userModel = require('../models/usersModel');
const AppError = require('../utils/appErr');

const catchAsync = require('../utils/catchAsync');
//const factory = require('./handlerFactory');

exports.getOverview = catchAsync(async (req, res) => {
  //1) build tour pug
  const tours = await tourModel.find();
  //2) get data from db
  //3) render pug with the data
  res.status(200).render('overview', { title: 'all tours', tours });
});

exports.getTour = catchAsync(async (req, res) => {
  const { slug } = req.params;
  const tour = await tourModel
    .findOne({ slug })
    .populate({ path: 'reviews', select: 'review rating user' });
  console.log(tour);
  res.status(200).render('tour', { title: 'the forest hiker', tour });
});
exports.getLoginForm = catchAsync(async (req, res, next) =>
  // const { email, password } = req.body;
  // const user = await userModel.findOne({ email }).select('+password');
  // if (!user || !(await user.correctPassword(password, user.password))) {
  //   return next(new AppError('invalid email or password', 400));
  // }
  res.render('login', { title: 'login form' })
);

exports.getProfile = catchAsync(async (req, res, next) =>
  res.render('account', { title: 'myprofile' })
);
