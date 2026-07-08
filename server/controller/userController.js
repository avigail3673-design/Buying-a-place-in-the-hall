const User = require('../models/userModel');
const jwt = require('jsonwebtoken'); // 1. הוספנו את ייבוא ספריית ה-JWT בראש הקובץ

// 1. הרשמת משתמש חדש (Sign Up)
exports.registerUser = async (req, res) => {
    try {
        const { fullName, email, phone, password } = req.body;

        // בדיקה קטנה אם המשתמש כבר קיים במערכת עם האימייל הזה
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: 'משתמש עם כתובת אימייל זו כבר קיים במערכת' });
        }

        // יצירת המשתמש - שדה walletBalance יקבל אוטומטית 0 לפי הדיפולט שהגדרנו בסכמה
        const newUser = new User({ fullName, email, phone, password });
        await newUser.save();

        res.status(201).json({ message: 'המשתמש נרשם בהצלחה!', user: newUser });
    } catch (err) {
       console.log("זה מה שהציק למונגוס בהרשמה:", err.message);
        res.status(400).json({ error: 'שגיאה ברישום המשתמש', details: err.message });
    }
};

// 2. התחברות משתמש קיים (Login) - למקרה שצריך לתקן גם פה את הסיסמה
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // מוצאים את המשתמש לפי המייל
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });
        }

        // בדיקה שהסיסמה שהוקשה תואמת למה ששמור בבסיס הנתונים
        if (user.password !== password) {
            return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });
        }

        // יצירת טוקן JWT קטן (ודאי שיש לך משתנה סביבה JWT_SECRET, או החליפי למחרוזת קבועה זמנית)
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET || 'super_secret_key', 
            { expiresIn: '1d' }
        );

        res.status(200).json({
            message: 'התחברות הצליחה!',
            token,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role || 'customer'
            }
        });
    } catch (err) {
        console.log("שגיאה בהתחברות:", err.message);
        res.status(500).json({ error: 'שגיאה פנימית בשרת' });
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
// 4. פונקציה להטענת הארנק הדיגיטלי במונגו
exports.topupWallet = async (req, res) => {
    try {
        const userId = req.params.id;
        const { amount } = req.body;

        // בדיקת בטיחות: שהסכום הגיוני ותואם לחוקים שרצית
        if (!amount || amount < 100 || amount > 100000) {
            return res.status(400).json({ error: 'סכום הטענה לא תקין. יש להזין בין 100 ל-100,000 ש"ח.' });
        }

        // מוצאים את המשתמש לפי ה-ID ומעדכנים במונגו
        // אנחנו משתמשים ב-$inc כדי להוסיף את הסכום ליתרה הקיימת (ולא לדרוס אותה)
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $inc: { walletBalance: amount } }, 
            { new: true } // מחזיר לנו את הדוקומנט המעודכן מהדאטאבייס
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'משתמש לא נמצא במערכת' });
        }

        // מחזירים תשובה שהכל הצליח עם היתרה החדשה
        res.status(200).json({ 
            message: 'הארנק הוטען בהצלחה!', 
            newBalance: updatedUser.walletBalance 
        });

    } catch (err) {
        console.error('שגיאה בשרת בעת הטענת ארנק:', err);
        res.status(500).json({ error: 'שגיאה פנימית בשרת בעת הטענת הארנק' });
    }
};