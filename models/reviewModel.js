const mongoose = require('mongoose');
const TourModel = require('./toursModel');

const reviewSchema = new mongoose.Schema(
  {
    review: { type: String, required: [true, 'review cannot be empty'] },
    rating: {
      type: Number,
      min: [1, 'min rating is 1 '],
      max: [5, 'max rating is 5'],
    },
    createdAt: { type: Date, default: Date.now },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'review must belong a tour'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'review must belong a user'],
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

reviewSchema.index({ user: 1, tour: -1 }, { unique: true });
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

reviewSchema.statics.calcAvgRating = async function (tourId) {
  // this refer to the model not to the doc so we can use aggregate in it
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  await TourModel.findByIdAndUpdate(tourId, {
    ratingsAverage: stats[0].avgRating,
    ratingsQuantity: stats[0].nRating,
  });
};

reviewSchema.post('save', function () {
  this.constructor.calcAvgRating(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.queryObj = await this.findOne().clone();
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  await this.queryObj.constructor.calcAvgRating(this.queryObj.tour);
});
const reviewModel = mongoose.model('Review', reviewSchema);

module.exports = reviewModel;
