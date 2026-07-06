const express = require('express');
const router = express.Router();

// 1. מייבאים את הקונטרולר של המופעים
const eventController = require('../controllers/eventController');

// 2. מייבאים את המידלוורים לבדיקת התחברות והרשאות מנהל
// (ודאי ששם הקובץ והנתיב מתאימים למקום שבו שמרת את קובץ המידלוור שלך)
const { checkAuth, isAdmin } = require('../middleware/checkA.js');

// 1. נתיב להצגת כל המופעים וליצירת מופע חדש
router.route('/events')
    .get(eventController.getAllEvents)                      // פתוח לכולם - לקוחות ומנהלים יכולים לראות את רשימת המופעים
    .post(checkAuth, isAdmin, eventController.createEvent);  // מוגן! קודם בודק שהמשתמש מחובר, ואז בודק שהוא אכן מנהל

// 2. נתיבים שדורשים מזהה (ID) ספציפי של מופע
router.route('/events/:id')
    .get(eventController.getEventById)                       // פתוח לכולם - כדי שלקוח יוכל להיכנס לדף של מופע ספציפי בריאקט
    .put(checkAuth, isAdmin, eventController.updateEvent)    // מוגן! רק מנהל מחובר יכול לעדכן פרטי מופע
    .delete(checkAuth, isAdmin, eventController.deleteEvent); // מוגן! רק מנהל מחובר יכול למחוק מופע ולזכות את ארנקי הלקוחות

// מייצאים את הראוטר המעודכן ל-app.js
module.exports = router;