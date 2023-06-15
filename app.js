require('dotenv').config()
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const connectDB = require('./config/mongoDB')
const session = require('express-session')
const MongoStore = require('connect-mongo')


var usersRouter = require('./routes/users');
var adminRouter = require('./routes/admin');

const app = express();
connectDB();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// session middleware
app.use(session({
  secret: process.env.COOKIE_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie:{maxAge: 1000 * 60 * 60}, // 1 hour
  store: MongoStore.create({
    mongoUrl: process.env.MONGOURI,
    ttl: 24 * 60 * 60,
    collectionName: 'sessionStorage',
    stringify: false
  })
}))

// cache control
app.use((req,res,next)=>{
  res.header('cache-control','private,nocache,no-store')
  res.header('expurse','-1')
  res.header('parama','no-cache')
  next()
})


app.use('/', usersRouter);
app.use('/admin', adminRouter);

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
