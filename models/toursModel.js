const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'the name must include '],
      unique: [true, 'must be unique'],
      maxLength: [40, 'the max length of a tour name is 40 charcter'],
      minLength: [10, 'the min length of a tour name is 10 charcter'],
    },
    duration: { type: Number, required: [true, 'the duration must include '] },
    maxGroupSize: {
      type: Number,
      required: [true, 'the max groub must include '],
    },
    difficulty: {
      type: String,
      required: [true, 'the difficulty must include '],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'difficulty must be on of these : easy , medium , difficult',
      },
    },
    price: { type: Number, required: true },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating muust be at least 1'],
      max: [5, 'rating must max 1'],
      set: (val) => Math.round(val * 10) / 10,
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'the discount({VALUE}) must be equal or less than price ',
      },
    },

    ratingsQuantity: { type: Number, default: 0 },
    summary: {
      type: String,
      trim: true,
      required: [true, 'summary must included'],
    },
    descrition: { type: String, trim: true },
    imageCover: { type: String, require: [true, 'the image must include'] },
    images: [String],
    createAt: { type: Date, default: Date.now(), select: false },
    startDates: [Date],
    slug: String,
    secretTour: { type: Boolean, default: false },
    startLocation: {
      type: {
        type: String,
        default: 'point',
        enum: ['point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },

    locations: [
      {
        type: {
          type: String,
          default: 'point',
          enum: ['point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });
tourSchema.virtual('durationWeaks').get(function () {
  return this.duration / 7;
});
tourSchema.virtual('reviews', {
  foreignField: 'tour',
  localField: '_id',
  ref: 'Review',
});
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});
tourSchema.pre(/^find/, function (next) {
  this.populate({ path: 'guides', select: 'name photo role' });
  next();
});
tourSchema.post(/^find/, function (doc, next) {
  console.log(`${Date.now() - this.start}`);
  next();
});
const TourModel = mongoose.model('Tour', tourSchema);

module.exports = TourModel;
