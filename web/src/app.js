var express      = require('express');
var path         = require('path');
var favicon      = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var morgan       = require('morgan');
var winston      = require('winston');
var factories    = require('./modules/factories/factory');

var app          = express();

// Setup shared transports
// #######################
// Usage:
// var winston = require('winston');
// winston.debug('log message');
// winston.error('log message');

// HACK(alex): remove default (Console) transport before add new (Console) with custom options
// This prevent an application crash when we add a transport that already exists.
// Error: Transport already attached: console
winston.remove(winston.transports.Console);

winston.add(winston.transports.Console, {
  level: 'debug',
  handleExceptions: false,
  json: false,
  colorize: true
});
winston.add(winston.transports.File, {
  level: 'error',
  filename: __dirname + '/log/errors.log',
  handleExceptions: false,
  json: true,
  maxsize: 5242880, // 5MB
  maxFiles: 10,
  colorize: false
});

// TODO(alex): which status codes will log here?
// app.use(require("morgan")("combined", {
//    "stream": {
//        write: function(message, encoding){
//          // ?
//        }
//    }
// }));
app.use(morgan('dev'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
// app.use(logger('dev'));

factories.register();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'vendor/esri')));

var router = require('./router')(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
