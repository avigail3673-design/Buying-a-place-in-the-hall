const express = require('express');
const router = express.Router();

const ticketController = require('../controller/ticketCotroller'); // שימי לב שיש לך כאן שגיאת כתיב במקור Cotroller - ודאי שזה מתאים לתיקייה שלך
const { checkAuth, isCustomer } = require('../middleware/checkA.js'); // מייבאים את ההגנות

// 1. נתיב לרכישת כרטיס חדש: מוגן! רק לקוח מחובר יכול לקנות
router.post('/tickets/book', checkAuth, isCustomer, ticketController.bookTicket);

// 2. נתיב לקבלת כל המקומות התפוסים של מופע ספציפי: פתוח לכולם (כדי להציג את האולם בריאקט/HTML)
router.get('/tickets/event/:eventId', ticketController.getTakenSeats);

// 3. נתיב לקבלת כל הכרטיסים של משתמש ספציפי: מוגן! רק המשתמש עצמו (או מנהל) רשאי לראות
router.get('/tickets/user/:userId', checkAuth, ticketController.getUserTickets);

module.exports = router;