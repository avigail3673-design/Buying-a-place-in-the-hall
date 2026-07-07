const jwt = require("jsonwebtoken");
const User = require("../models/userModel"); // מייבאים את המודל של המשתמש כדי לבדוק במונגו

// 1. המידלוור המקורי שלך - בודק אם המשתמש מחובר
const checkAuth = (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            return res.status(401).json({ error: "authorization failed - no token provided" });
        }

        let token = req.headers.authorization.split(" ")[1];
        
        // פותחים את הטוקן ומחלצים את הנתונים (ה-ID של המשתמש ששמרת שם)
        const decoded = jwt.verify(token, process.env.SECRET);
        req.user = decoded; 

        next();
    } catch (err) {
        console.log(err);
        res.status(401).send("authorization failed");
    }
};

// 2. מידלוור הבדיקה החדש - שולף מהדאטה-בייס ובודק אם הוא מנהל
const isAdmin = async (req, res, next) => {
    try {
        // req.user.id מגיע מהטוקן שפונקציית checkAuth פתחה בשלב הקודם
        // (ודאי שזה השם שנתת לשדה בטוקן: id או _id)
        const userId = req.user.id || req.user._id; 

        // הולכים למונגו ובודקים את המשתמש האמיתי בזמן אמת
        const user = await User.findById(userId);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: "Access denied. Admins only!" });
        }

        // אם הוא נמצא במונגו והוא admin - הכל מעולה, ממשיכים לפונקציה בקונטרולר!
        next();
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Server error during admin verification", details: err.message });
    }
};

module.exports = {
    checkAuth,
    isAdmin
};