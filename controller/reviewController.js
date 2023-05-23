const catchAsync = require('../utils/catchAsync');
const reviewModel = require('../models/reviewModel');
const AppError = require('../utils/appErr');
const factory = require('./handlerFactory');

// allow nested routes if the user add review on review page or tour page
exports.setIdValues = catchAsync(async (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
});
exports.checkUserOrAdmin = catchAsync(async (req, res, next) => {
  // eslint-disable-next-line eqeqeq
  if (req.user.role == 'admin') return next();
  const review = await reviewModel.findById(req.params.id);
  // eslint-disable-next-line eqeqeq
  if (req.user.id == review.user.id) {
    return next();
  }
  return next(
    new AppError('you are not allowed to delete or edit this review', 400)
  );
});
exports.addReview = factory.createOne(reviewModel);
exports.deleteReview = factory.deleteOne(reviewModel);
exports.updateReview = factory.updateOne(reviewModel);
exports.getReview = factory.getOne(reviewModel);
exports.getAllReviews = factory.getall(reviewModel);
