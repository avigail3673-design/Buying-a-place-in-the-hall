const User = require('../models/userModel');
const jwt = require('jsonwebtoken'); 
const bcrypt = require('bcrypt'); // ספריית ההצפנה שמתואמת גם להרשמה וגם להתחברות

// 1. הרשמת משתמש חדש (Sign Up) - כולל הצפנת סיסמה!
exports.registerUser = async (req, res) => {
    try {
        const { fullName, email, phone, password } = req.body;

        // בדיקה אם המשתמש כבר קיים במערכת
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: 'משתמש עם כתובת אימייל זו כבר קיים במערכת' });
        }

        // --- התיקון: מצפינים את הסיסמה לפני ששומרים אותה במונגו ---
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // יוצרים את המשתמש עם הסיסמה המוצפנת
        const newUser = new User({ 
            fullName, 
            email, 
            phone, 
            password: hashedPassword // שומרים את ה-Hash המוצפן
        });
        
        await newUser.save();

        res.status(201).json({ message: 'המשתמש נרשם בהצלחה!', user: newUser });
    } catch (err) {
       console.log("שגיאה בהרשמה:", err.message);
       res.status(400).json({ error: 'שגיאה ברישום המשתמש', details: err.message });
    }
};

// 2. התחברות משתמש קיים (Login)
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // א. מחפשים את המשתמש לפי האימייל
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, error: "אימייל או סיסמה שגויים" });
        }

        // ב. בודקים סיסמה - כעת שניהם משתמשים ב-bcrypt וזה יעבוד פיקס!
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: "אימייל או סיסמה שגויים" });
        }

        // ג. יצירת הטוקן (כולל ה-role בפנים)
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.SECRET, 
            { expiresIn: "3h" }
        );

        // ד. החזרת תשובה תקינה לדפדפן
        res.status(200).json({
            success: true,
            token: token,
            user: {
                _id: user._id, 
                fullName: user.fullName,
                email: user.email,
                role: user.role 
            }
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, error: "שגיאת שרת בתהליך ההתחברות" });
    }
};

// 3. שליפת פרטי משתמש ספציפי
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
        const updatedUser = await userModel.findByIdAndUpdate(
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