const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const crypto = require('node:crypto')
const { json } = require('body-parser')
mongoose.connect(process.env.DATABASE_URI || 'mongodb://localhost:27017/cuddlygram')

const usersShema = new mongoose.Schema({
  infos: {
    name: {
      type: String
    },
    firstName: {
      type: String
    },
    birthDate: {
      type: Date
    },
    bio: {
      type: String
    }
  },
  social: {
    friends: [{
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users'
    }],
    likes: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users'
    },
    follows: [{
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users'
    }]
  },
  tokens: [{
    token: {
      type: String
    },
    expirationDate: {
      type: Date,
      default: () => new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
    }
  }],
  auth: {
    email: {
      data: {
        type: String
      },
      verified: {
        type: Boolean,
        default: false
      }
    },
    password: {
      // bcrypt
      type: String
    }
  },
  systemStatus: {
    recover: {
      enabled: {
        type: Boolean,
        default: false
      },
      reason: {
        type: String
      }
    }
  }
})
const users = mongoose.model('users', usersShema)

const logsShema = new mongoose.Schema({
  name: {
    type: String
  },
  user: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: 'users'
  },
  data: {
    type: mongoose.SchemaTypes.Array
  },
  status: {
    type: Number,
    // 1xx = Could not operate, 2xx = In progress, 3xx = Waiting, 4xx = Require user's assistance, 5xx = Require admins' assistance, 6xx = Finished
    default: 200
  }
})
const logs = mongoose.model('logs', logsShema)

async function authenticationCheck(req, res, next) {
  // Get the credentials from the cookie 
  let cookies = req.cookies
  // The entry in the cookies is named "token"
  // Check if the token exists
  if (!("token" in cookies)) {
    req.auth = { auth: false }
    return next()
  }

  // We are now sure this variale exists. Let's see if someone has this token valid in the database

  let user = findUserByToken(cookies.token)
  if (user == null) {
    req.auth = { auth: false }
    return next()
  }

  // check if the token hasn't expired 
  const tokenExpirationDate = user.tokens.find((t) => t.token === token).expirationDate;
  if (tokenExpirationDate > new Date()) {
    req.auth = { auth: false }
    return next()
  }

  // Reset the expiration date to the default value
  user.tokens.find((t) => t.token === token).expirationDate = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000);
  await user.save();
  req.auth = {
    auth: true,
    user: user
  };
  next()
}

async function findUserByToken(token) {
  const user = await users.findOne({
    tokens: { $elemMatch: { token } },
  });
  return user;
}

async function autorizeLogin(email, password) {
  //first we check if an entry in users has this email.
  let user = await users.findOne({ 'auth.email.data': email });
  if (user == null) return { error: true, warining: false, code: 'BAD_CREDENTIALS' };

  // Check if the password is correct
  if (!await bcrypt.compare(password, user.auth.password)) return { error: true, warining: false, code: 'BAD_CREDENTIALS' };

  // Generate a new token
  const newToken = crypto.randomBytes(128).toString('hex');

  // Add the new token to the user's tokens list
  user.tokens.push({
    token: newToken,
    expirationDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
  });

  // Save the updated user document to the database
  await user.save();

  return {
    error: false,
    warining: true,
    warning_data: 'EMAIL_NOT_VERIFIED',
    token: newToken,
    user: user, bcrypt
  };
}

async function createAccount(email, name, firstname, username, password, birthDate) {

}