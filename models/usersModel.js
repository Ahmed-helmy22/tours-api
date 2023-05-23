const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'please enter a name'] },
    email: {
      type: String,
      required: [true, 'please enter a email'],
      unique: [true, 'email must be unique'],
      lowerCase: true,
      validate: [validator.isEmail, 'please enter valid email'],
    },
    photo: { type: String, default: 'default.jpg' },
    password: {
      type: String,
      required: [true, 'please enter a password'],
      minlength: [8, 'password must be at least 8 charcters'],
      maxlength: [16, 'password must be at least 8 charcters'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'please confirm passsword'],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'the confirmed password must the same as password ',
      },
    },
    passwordChangedAt: Date,
    role: {
      type: String,
      enum: ['admin', 'lead-guide', 'guide', 'user'],
      default: 'user',
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.pre('save', async function (next) {
  //if the data is not modifiewd dont do thing , just he is modifie other property
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12); // async function cz it need time from cpu , 12 iteration time or securty level
  this.passwordConfirm = undefined; // remove it from storing the database
  next();
});
// instance metod can access via model
userSchema.methods.correctPassword = async function (
  candcatePassword,
  userPasswod
) {
  return await bcrypt.compare(candcatePassword, userPasswod);
};
// change the time password mofified at property
userSchema.pre('save', function (next) {
  if (!this.isModified || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 3000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.changePasswordAfterSendToken = function (
  jwtTimeEstantiated
) {
  let changePassTime;
  if (this.passwordChangedAt) {
    changePassTime = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return jwtTimeEstantiated < changePassTime;
  }
  return false;
};
// create function create random token and encypt it and save to db with expiration time
userSchema.methods.createPasswordResetToken = function () {
  //create plain text not hashed token,we send to the client vea email
  const resetToken = crypto.randomBytes(32).toString('hex');
  // hashing the token to store it to database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
