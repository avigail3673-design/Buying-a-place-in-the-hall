const express = require('express');
const router = express.Router();

const ticketController = require('../controller/ticketCotroller');

// 1. נתיב לרכישת כרטיס חדש: POST /tickets/book
router.post('/tickets/book', ticketController.bookTicket);

// 2. נתיב לקבלת כל המקומות התפוסים של מופע ספציפי: GET /tickets/event/:eventId
router.get('/tickets/event/:eventId', ticketController.getTakenSeats);

// 3. נתיב לקבלת כל הכרטיסים של משתמש ספציפי: GET /tickets/user/:userId
router.get('/tickets/user/:userId', ticketController.getUserTickets);

module.exports = router;