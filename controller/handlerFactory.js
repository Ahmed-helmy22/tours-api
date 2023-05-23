const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appErr');
const ApiFeatures = require('../utils/APIFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const deletedDoc = await Model.findByIdAndDelete(req.params.id);
    if (!deletedDoc) {
      return next(new AppError('there is no doc with id', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // const tour = await Model.findById(req.params.id);
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      upsert: true,
    });
    if (!doc) {
      return next(new AppError('there is no document with id', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        document: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    res.json({
      status: 'success',
      // getdate: req.timeHit,
      data: {
        newDoc,
      },
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);
    const doc = await query;

    //const tour = await TourModel.findOne({ _id: req.params.id });
    if (!doc) {
      return next(new AppError('there is no doc with id', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        document: doc,
      },
    });
  });

exports.getall = (Model) =>
  catchAsync(async (req, res, next) => {
    // this two lines of code only for allow to get reviews on one tour or all tourS
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const features = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .paginate()
      .limit();
    //const doc = await features.query.explain();
    const doc = await features.query;
    res.status(200).json({
      status: 'success',
      length: doc.length,
      data: {
        documents: doc,
      },
    });
  });
