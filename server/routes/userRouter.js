const express = require('express');
const router = express.Router();

const userController = require('../controller/userController');
const { checkAuth } = require('../middleware/checkA.js'); // מייבאים את checkAuth

// נתיב להרשמה: POST /users/signup (פתוח לכולם)
router.post('/users/signup', userController.registerUser);

// נתיב להתחברות: POST /users/login (פתוח לכולם)
router.post('/users/login', userController.loginUser);

// נתיב לקבלת פרופיל (ויתרת ארנק): מוגן! רק משתמש מחובר יכול לראות פרופיל
router.get('/users/:id', checkAuth, userController.getUserProfile);

// נתיב לעדכון והטענת הארנק הדיגיטלי: PUT /users/:id/topup
router.put('/users/:id/topup', userController.topupWallet);

module.exports = router;
