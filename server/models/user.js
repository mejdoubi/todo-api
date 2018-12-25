const validator = require('validator');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    minlength: 1,
    trim: true,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE} is not a valid email'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  tokens: [{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }]
});

// overriding toJSON method of UserSchema
UserSchema.methods.toJSON = function() {
  const user = this;
  const userObject = user.toObject();

  return _.pick(userObject, ['_id', 'email']);
};

UserSchema.methods.generateAuthToken = async function() {
  const user = this;
  const access = 'auth';
  const token = jwt.sign({
    _id: user._id.toHexString(),
    access
  }, process.env.JWT_SECRET).toString();
  user.tokens = user.tokens.concat([{
    access,
    token
  }]);
  await user.save();
  return token;
};

UserSchema.methods.removeToken = function(token) {
  const user = this;

  return user.updateOne({
    $pull: {
      tokens: {token}
    }
  });
};

UserSchema.statics.findByToken = function(token) {
  const User = this;
  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return Promise.reject();
  }

  return User.findOne({
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  });
};

UserSchema.statics.findByCredentials = async function(email, password) {
  const User = this;

  try {
    const user = await User.findOne({email});
    if (!user) {
      return Promise.reject();
    }

    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          resolve(user);
        } else {
          reject();
        }
      });
    });
  } catch (e) {
    throw new Error(e);
  }
};

UserSchema.pre('save', function(next) {
  let user = this;

  if (user.isModified('password')) {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = {
  User
};
