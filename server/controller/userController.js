const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
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
            { expiresIn: "30d" }
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

// 4. פונקציה להטענת הארנק הדיגיטלי / חיוב רכישה + רישום פעולה בעו"ש
exports.topupWallet = async (req, res) => {
    try { 
        const userId = req.params.id;
        const { amount } = req.body;

        if (!amount) {
            return res.status(400).json({ error: 'לא התקבל סכום לפעולה.' });
        }

        // 🔥 התיקון החכם: בודקים אם מדובר בהפקדה או קנייה
        const isDeposit = amount > 0;

        // אם זו הפקדה (טעינת ארנק) - בודקים את גבולות ה-100 עד 100,000 ש"ח
        if (isDeposit && (amount < 100 || amount > 100000)) {
            return res.status(400).json({ error: 'סכום הטענה לא תקין. יש להזין בין 100 ל-100,000 ש"ח.' });
        }

        // מוצאים את המשתמש לפי ה-ID ומעדכנים במונגו (עובד מעולה גם עם חיובי וגם עם שלילי!)
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $inc: { walletBalance: amount } }, 
            { new: true } 
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'משתמש לא נמצא במערכת' });
        }

        // ====== חיבור אוטומטי לעו"ש  (נקי מכפילויות) ======
        const newTx = new Transaction({
            userId: userId,
            // אם זו קנייה (שלילי), נהפוך לחיובי (למשל 150) בשביל ה-summary והחישובים שלכן
            amount: isDeposit ? amount : Math.abs(amount), 
            type: isDeposit ? 'deposit' : 'purchase', // הערכים המדויקים !
            description: isDeposit ? 'טעינת ארנק דיגיטלי באשראי' : 'רכישת כרטיסים למופע',
            createdAt: new Date()
        });

        await newTx.save(); // שומרים את שורת העו"ש בבסיס הנתונים!

        // מחזירים תשובה שהכל הצליח עם היתרה החדשה (חובה לקרוא לזה walletBalance בשביל ה-Frontend שלכן!)
        res.status(200).json({ 
            message: isDeposit ? 'הארנק הוטען בהצלחה!' : 'הרכישה בוצעה בהצלחה!', 
            walletBalance: updatedUser.walletBalance 
        });

    } catch (err) {
        console.error('שגיאה בשרת בעת עדכון ארנק ועו"ש:', err);
        res.status(500).json({ error: 'שגיאה פנימית בשרת בעת עדכון הארנק' });
    }
};