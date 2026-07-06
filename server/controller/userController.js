const User = require('../models/userModel');
const jwt = require('jsonwebtoken'); // 1. הוספנו את ייבוא ספריית ה-JWT בראש הקובץ

// 1. הרשמת משתמש חדש (Sign Up)
exports.registerUser = async (req, res) => {
    try {
        const { fullName, email, phone } = req.body;

        // בדיקה קטנה אם המשתמש כבר קיים במערכת עם האימייל הזה
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: 'משתמש עם כתובת אימייל זו כבר קיים במערכת' });
        }

        // יצירת המשתמש - שדה walletBalance יקבל אוטומטית 0 לפי הדיפולט שהגדרנו בסכמה
        const newUser = new User({ fullName, email, phone });
        await newUser.save();

        res.status(201).json({ message: 'המשתמש נרשם בהצלחה!', user: newUser });
    } catch (err) {
        res.status(400).json({ error: 'שגיאה ברישום המשתמש', details: err.message });
    }
};

// 2. התחברות / זיהוי משתמש (Login פשוט לפי אימייל)
exports.loginUser = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'המשתמש לא נמצא, אנא הירשם קודם' });
        }

        // 2. יצירת טוקן מאובטח שמכיל את ה-ID ואת ה-Role (תפקיד) של המשתמש מתוך בסיס הנתונים
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.SECRET
        );

        // מחזירים לפרונטאנד גם את פרטי המשתמש וגם את הטוקן שהוא צריך לשמור
        res.status(200).json({ 
            message: 'התחברת בהצלחה!', 
            user,
            token // הטוקן הזה יישלח בכל בקשה עתידית ב-Headers
        });
    } catch (err) {
        res.status(500).json({ error: 'שגיאה בתהליך ההתחברות', details: err.message });
    }
};

// 3. שליפת פרטי משתמש ספציפי (כולל יתרת הארנק שלו)
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'המשתמש לא נמצא' });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: 'שגיאה בשליפת פרטי המשתמש', details: err.message });
    }
};