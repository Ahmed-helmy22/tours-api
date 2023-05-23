const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const UserModel = require('../models/usersModel');
const AppError = require('../utils/appErr');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.TIME_EXPIRED_IN,
  });
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expiresIn: new Date(
      Date.now() + process.env.TIME_COOKIE_JWT_EXPIRES_IN * 24 * 60 * 60
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = undefined;
  user.password = undefined;

  res.cookie('jwt', token, cookieOptions);
  return res.status(statusCode).json({
    status: 'success',
    token,
  });
};
exports.signup = catchAsync(async (req, res) => {
  const { name, email, passwordConfirm, password } = req.body;
  const newUser = await UserModel.create({
    name,
    email,
    password,
    passwordConfirm,
  });

  createSendToken(newUser, 201, res);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) check if the email or password is exist or not
  if (!email || !password) {
    return next(new AppError('please enter email and password', 401));
  }
  //2) check if the user and pass is exist and correct or not
  //  select('+property')to select password which do select: false in schema
  const user = await UserModel.findOne({ email }).select('+password');
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('email or password is not correct', 400));
  }

  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new AppError('you have no acces , please log in', 401));
  }
  // cause it depends on callcack functions we need promisfy from util module
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //console.log(decoded);
  const freshUser = await UserModel.findById(decoded.id);
  //check the user is deleted or not
  if (!freshUser) {
    return next(new AppError('the user of this token is no longer exist', 401));
  }

  //1)check if the user chang password after send the token
  const changeAfterToken = freshUser.changePasswordAfterSendToken(decoded.iat); //return true or false
  if (changeAfterToken) {
    return next(new AppError('password changed , please login again', 401));
  }

  //assign the fresh user to the req
  req.user = freshUser;
  next();
});
// auth the only amin and lead-guide to access specific resources
exports.restrictTo =
  (...role) =>
  (req, res, next) => {
    if (!role.includes(req.user.role)) {
      return next(
        new AppError('you dont have the permission to do that ', 403)
      );
    }
    return next();
  };

exports.forgetPassword = catchAsync(async (req, res, next) => {
  //1) get the user obj from db
  const user = await UserModel.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError('no user with this email,please enter right email', 404)
    );
  }
  //2) generate random reset token
  const resetToken = user.createPasswordResetToken();
  //save the modification happens in the documment << resetToken,restTokenExpires>
  await user.save({ validateBeforeSave: false });
  //3) send it to user email
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `forgot your password ? submit a PATCH request with new password and confirm password to 
  : ${resetUrl}.\n if you didn't please IGNORE`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'reset token (only valid for 10 min)',
      message,
    });
    res.status(200).json({
      status: 'success',
      message: 'token is sent to the email of the user ',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(err);
    return next(new AppError('failed to send email , try again later', 500));
  }
});
//////////////////////////////////////////////////////////////////////////////////////////////////////

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1)Get user based on the token
  const resetToken = req.params.token;
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  //2) reset password if the token is not expired , and there is a user
  const user = await UserModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) {
    return next(new AppError('token is invalid or expired', 404));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  const token = signToken(user._id);
  return res.json({
    status: 'success',
    token,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) Get user from collection
  // req.user.id comes from protect func we inject the user in it
  const user = await UserModel.findById(req.user.id).select('+password');
  //2) check if current password (posted) is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('incorrect password try again', 401));
  }
  //3) if it s correct , update password
  // findByIdAndUpdate in not good thats why (pre save hooke will not work , and password and passwordconfirnm validation won't work)
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //3) log the user in
  createSendToken(user, 200, res);
});
