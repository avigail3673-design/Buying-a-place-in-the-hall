// server/routes/userRouter.js
const express = require('express');
const router = express.Router();

const userController = require('../controller/userController');
const { checkAuth } = require('../middleware/checkA.js'); // מייבאים את checkAuth באהבה

// ==========================================
// נתיבים ציבוריים (פתוחים לכולם)
// ==========================================

// נתיב להרשמה בפועל: POST /users/signup
router.post('/users/signup', userController.registerUser);

// נתיב להתחברות בפועל: POST /users/login
router.post('/users/login', userController.loginUser);


// ==========================================
// נתיבים מוגנים (דורשים טוקן בתוקף - checkAuth)
// ==========================================

// נתיב לקבלת פרופיל ויתרת ארנק: GET /users/:id
router.get('/users/:id', checkAuth, userController.getUserProfile);

// נתיב לעדכון והטענת הארנק הדיגיטלי: PUT /users/:id/topup
router.put('/users/:id/topup', checkAuth, userController.topupWallet);

module.exports = router;