const express = require('express');
const router = express.Router();

// מייבאים את קונטרולר המשתמשים
const userController = require('../controller/userController');

// נתיב להרשמה: POST /users/signup
router.post('/users/signup', userController.registerUser);

// נתיב להתחברות: POST /users/login
router.post('/users/login', userController.loginUser);

// נתיב לקבלת פרופיל (ויתרת ארנק) לפי ה-ID שלו: GET /users/:id
router.get('/users/:id', userController.getUserProfile);

// נתיב לעדכון והטענת הארנק הדיגיטלי: PUT /users/:id/topup
router.put('/users/:id/topup', userController.topupWallet);

module.exports = router;
