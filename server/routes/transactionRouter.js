// server/routes/transactionRouter.js
const express = require('express');
const router = express.Router();
const transactionController = require('../controller/transactionController');
const { checkAuth } = require('../middleware/checkA.js');

// נתיב לקבלת עו"ש: GET /transactions/user/:userId
router.get('/user/:userId', checkAuth, transactionController.getUserHistory);

module.exports = router;