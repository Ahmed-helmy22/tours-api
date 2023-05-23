const multer = require('multer');
const sharp = require('sharp');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appErr');
const UserModel = require('../models/usersModel');
const factory = require('./handlerFactory');

// const descStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users/');
//   },

//   filename: (req, file, cb) => {
//     const fileExt = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${fileExt}`);
//   },
// });
const storage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('you must upload file of type image', 400), false);
  }
};
const upload = multer({ storage: storage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserImg = (req, res, next) => {
  if (!req.file) next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
};

const filteredObj = (obj, ...values) => {
  const updatedobj = {};
  Object.keys(obj).forEach((el) => {
    if (values.includes(el)) updatedobj[el] = obj[el];
  });
  return updatedobj;
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};
exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.file);
  // 1) check if the user want to uppdate password
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'this route is not for update password , please use /updatePassword',
        400 // bad request
      )
    );
  }
  const filteredBody = filteredObj(req.body, 'name', 'email', 'photo');
  if (req.file) filteredBody.photo = req.file.filename;
  const updatedUser = await UserModel.findByIdAndUpdate(
    req.user.id,
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  ); // new=>>> updtated object
  return res.status(200).json({
    status: 'success',
    Data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await UserModel.findOneAndUpdate(req.body.id, {
    active: false,
  });
  return res.status(204).json({
    status: 'success',
    data: null,
  });
});
exports.createuser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'route is not defined , please use "users/signup" instead',
  });
};
exports.updateUser = factory.updateOne(UserModel);
exports.deleteUser = factory.deleteOne(UserModel);
exports.getuser = factory.getOne(UserModel);
exports.getallusers = factory.getall(UserModel);
