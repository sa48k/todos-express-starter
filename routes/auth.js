var express = require('express');
var passport = require('passport');
const { MongoClient } = require('mongodb');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var db = require('../db');
var router = express.Router();
const mongoURL = process.env.ATLAS_URI || "";
const dbName = 'passport_test';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/oauth2/redirect/google',
  passReqToCallback: true,
  scope: ['profile'],
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    const client = new MongoClient(mongoURL);
    await client.connect();
    const db = client.db(dbName);
    
    console.log('User ID:', profile.id);
    console.log('Display Name:', profile.displayName);
    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', refreshToken);

    // Check if the user already exists in the database
    const existingUser = await db.collection('users').findOne({ id: profile.id });

    if (existingUser) {
      client.close();
      console.log('user already in db');
      req.session.access_token = accessToken;
      console.log('REQ.SESSION: ', req.session)
      return done(null, existingUser);
    }

    // If the user doesn't exist, create a new user in the database
    const newUser = {
      id: profile.id,
      name: profile.displayName,
      accessToken: accessToken,
      refreshToken: refreshToken
    };

    const result = await db.collection('users').insertOne(newUser);
    newUser._id = result.insertedId;

    client.close();
    req.session.access_token = accessToken;
    console.log('REQ.SESSION: ', req.session)
    done(null, newUser);
  } catch (error) {
    done(error, null);
  }
}));

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.id, name: user.name });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

router.get('/login', function(req, res, next) {
  res.render('login');
});
router.get('/token', function (req, res, next) {
  console.log('Authenticated? ', req.isAuthenticated())
  console.log(req.session);
  console.log('token:', req.session.access_token)
  res.send(`Hello ${JSON.stringify(req.user)}. Your session ID is ${req.sessionID} 
   and your session expires in ${req.session.cookie.maxAge} 
   milliseconds.<br><br>Session: <pre>${JSON.stringify(req.session)}</pre>`)
})

router.get('/login/federated/google', passport.authenticate('google', {
  accessType: 'offline',
  prompt: 'consent'
}));

router.get('/oauth2/redirect/google', passport.authenticate('google', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

router.post('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

module.exports = router;