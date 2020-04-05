require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const BookmarksService = require('./bookmarks-service');
const bookmarksRouter = require('./bookmarks/bookmarks-router');
const app = express();
const jsonParser = express.json();
const morganOption = NODE_ENV === 'production' ? 'tiny' : 'common';

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
app.use(bookmarksRouter);


app.get('/', (req, res) => {
  res.send('Hello, world!');
});
app.get('/xss', (req, res) => {
  res.cookie('secretToken', '1234567890');
  res.sendFile(__dirname + '/xss-example.html');
});


app.use(function errorHandler(error, req, res, next) {
  let response;
  console.error(error);
  if (NODE_ENV === 'production') {
    response = { error: { message: 'server error' } };
  } else {
  
    response = { message: error.message, error };
  }
  res.status(500).json(response);
});

module.exports = app;
