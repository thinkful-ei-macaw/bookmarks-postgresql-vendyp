const express = require('express');
const uuid = require('uuid/v4');
const logger = require('../logger');
// const { bookmarks } = require('../store/store');
const BookmarksService = require('../bookmarks-service');
const jsonParser = express.json();
const bookmarksRouter = express.Router();
const bodyParser = express.json();
const xss = require('xss');

bookmarksRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    BookmarksService.getAllBookmarks(knexInstance)
      .then((bookmarks) => {
        res.json(bookmarks);
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    //create the bookmark
    const { title, url, description, rating } = req.body;
    const newBookmark = { title, url, description, rating };
    const requiredFields = { title, url, description, rating };
    //check for missing fields
    const missingFields = Object.entries(requiredFields)
      .filter((items) => items[1] === undefined)
      .map((item) => item[0]);
    console.log(missingFields);
    if (missingFields.length > 0) {
      res.status(400).send(missingFields.join(', ').concat(' are required.'));
    } else {
      BookmarksService.insertBookmark(req.app.get('db'), newBookmark)
        .then((bookmark) => {
          res.status(201).json(bookmark);
        })
        .catch(next);
    }
  });

bookmarksRouter
  .route('/bookmarks/:id')
  .get((req, res, next) => {
    const { id } = req.params;
    const knexInstance = req.app.get('db');
    BookmarksService.getById(knexInstance, id)
      .then((bookmarks) => {
        //const bookmark = bookmarks.find(b => b.id == id);
        if (!bookmarks || bookmarks === '') {
          logger.error(`Bookmark with id ${id} not found`);
          return res.status(404).send('Bookmark Not Found');
        }
        res.json({
          id: bookmarks.id,
          title: xss(bookmarks.title), //sanitize the title
          url: xss(bookmarks.url), //sanitize the url
          description: xss(bookmarks.description), //sanitize the description
          rating: xss(bookmarks.rating), //sanitize the rating
        });
      })
      .catch(next);
  })
  .delete((req, res) => {
    const { id } = req.params;
    const knexInstance = req.app.get('db');
    const bookmarks = BookmarksService.deleteBookmark(knexInstance, id)
      .then(results =>{
        if(results === 0){
          res.status(404).send('Bookmark does not exist');
        } else{
          res.status(204).end(); //204 body is empty
        }
      });

  });

module.exports = bookmarksRouter;
