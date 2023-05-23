const TourModel = require('../models/toursModel');
const AppError = require('../utils/appErr');
const catchAsync = require('../utils/catchAsync');
//const appError = require('../utils/appErr');
const factory = require('./handlerFactory');

// ROUTESHANDLER to get most cheap courses
exports.getTop5 = (req, res, next) => {
  req.query.sort = '-ratingsAverage price';
  req.query.limit = '5';
  req.query.fields = 'name price duration ratingsAverage';
  next();
};

exports.getalltours = factory.getall(TourModel);
exports.getTour = factory.getOne(TourModel, { path: 'reviews' });
exports.deleteTour = factory.deleteOne(TourModel);
exports.createTour = factory.createOne(TourModel);
exports.updateTour = factory.updateOne(TourModel);

exports.getStatics = catchAsync(async (req, res, next) => {
  const stats = await TourModel.aggregate([
    { $match: { ratingsAverage: { $gte: 4.5 } } },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        num: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        averagePrice: { $avg: '$price' },
        averageratingss: { $avg: '$ratingsAverage' },
        maxPrice: { $max: '$price' },
        minPrice: { $min: '$price' },
      },
    },
    {
      $sort: {
        averagePrice: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: stats,
  });
});
exports.monthlyPlan = catchAsync(async (req, res, next) => {
  // eslint-disable-next-line prefer-destructuring, no-unused-vars
  const year = req.params.year * 1;
  const plan = await TourModel.aggregate([
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-1-1`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numTours: -1 },
    },
  ]);
  res.status(200).json({
    length: plan.length,
    status: 'success',
    plan,
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng)
    return next(
      new AppError(
        'please provide latitude and longtude at this format lat,lng'
      ),
      400
    );
  const radius = unit === 'mil' ? distance / 3963.2 : distance / 6378.1; // mille or killo, we divide by the radius of earth (radian)
  const tour = await TourModel.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  if (!tour) return next(new AppError('no tours within this ditance'), 404);
  return res.status(200).json({
    message: 'success',
    data: {
      length: tour.length,
      tour,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  if (!lat || !lng)
    return next(
      new AppError(
        'please provide latitude and longtude at this format lat,lng'
      ),
      400
    );
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;
  const distances = await TourModel.aggregate([
    {
      // geonear need to be the first agg stage, require at least one geospatial idex , if it is more one we need to define it
      $geoNear: {
        near: { type: 'point', coordinates: [lng * 1, lat * 1] },
        distanceField: 'distances', // ditance in eters
        distanceMultiplier: multiplier, //here in killometer or mile
      },
    },
    {
      $project: {
        name: 1,
        distances: 1,
      },
    },
  ]);
  return res.status(200).json({
    message: 'success',
    data: {
      tour: distances,
    },
  });
});
