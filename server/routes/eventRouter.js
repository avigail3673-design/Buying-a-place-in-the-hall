const express = require('express');
const router = express.Router();

// 1. מייבאים את המידלוורים (תמונות, אבטחה ואדמין)
const upload = require('../middleware/uploadMiddleware');
const { checkAuth, isAdmin } = require('../middleware/checkA.js');

// 2. מייבאים את הקונטרולר של המופעים (תוקנה שגיאת הכתיב ל-eventController)
const eventController = require('../controller/eventCotroller');

// --------------------------------------------------------
// א. נתיבים כלליים למופעים (`/events`)
// --------------------------------------------------------
router.route('/events')
    // פתוח לכולם - לקוחות ומנהלים יכולים לראות את רשימת המופעים
    .get(eventController.getAllEvents) 
    
    // מוגן למנהלים בלבד! בודק אבטחה, בודק אדמין, מעלה תמונה אחת, ואז יוצר את המופע
    .post(checkAuth, isAdmin, upload.single('image'), eventController.createEvent);

// --------------------------------------------------------
// ב. נתיבים לפי מזהה ספציפי (`/events/:id`)
// --------------------------------------------------------
router.route('/events/:id')
    // פתוח לכולם - כדי שגולש יוכל לראות מופע ספציפי
    .get(eventController.getEventById)
    
    // מוגן למנהלים בלבד! מאפשר גם לעדכן את התמונה הקיבלית
    .put(checkAuth, isAdmin, upload.single('image'), eventController.updateEvent) 
    
    // מוגן למנהלים בלבד! מוחק מופע ומחזיר כסף ללקוחות במידת הצורך
    .delete(checkAuth, isAdmin, eventController.deleteEvent);

// מייצאים את הראוטר הנקי ל-app.js
module.exports = router;