require("dotenv").config();
require("./models/connection");
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var usersRouter = require('./routes/users');
var plantsRouter = require('./routes/plants');
var questionsRouter = require('./routes/questions');

const fileUpload = require('express-fileupload');
var app = express();
const cors = require('cors');
app.use(fileUpload());
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use('/users', usersRouter);
app.use('/plants', plantsRouter);
app.use('/questions', questionsRouter);

module.exports = app;
