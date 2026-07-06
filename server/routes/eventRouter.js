const express = require('express');
const router = express.Router();

// מייבאים את הקונטרולר שיצרנו בשלב הקודם
const eventController = require('../controllers/eventController');

// 1. נתיב להצגת כל המופעים וליצירת מופע חדש
router.route('/events')
    .get(eventController.getAllEvents)    // GET /events - מציג את כל המופעים
    .post(eventController.createEvent);   // POST /events - יוצר מופע חדש

// 2. נתיבים שדורשים מזהה (ID) ספציפי של מופע
router.route('/events/:id')
    .get(eventController.getEventById)    // GET /events/:id - מציג מופע בודד
    .put(eventController.updateEvent)     // PUT /events/:id - מעדכן מופע
    .delete(eventController.deleteEvent);  // DELETE /events/:id - מוחק מופע ומזכה ארנקים

// מייצאים את הראוטר כדי שנוכל לחבר אותו ב-app.js
module.exports = router;