require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
const bodyParser = require('body-parser'); // parser middleware
var path = require('path');
var logger = require('morgan');
var session = require('express-session');
var passport = require('passport');
var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');

var app = express();

app.use(session({
  secret: 'fsdsfdjmnMDMGhgdsf9kj987y',
  resave: true,                       // Don't save the session on every request
  saveUninitialized: true,            // Don't create a session until something is stored
  cookie: {
    secure: false,
    maxAge: 6000000
  },
}));

// Initialize Passport and session support
app.use(passport.initialize());
app.use(passport.session());

app.locals.pluralize = require('pluralize');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false })); // Add this line to enable body-parser

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/', authRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
