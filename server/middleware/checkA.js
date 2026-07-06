const jwt = require("jsonwebtoken");

// 1. מידלוור שרק בודק אם המשתמש מחובר (הקוד הקיים שלך)
const checkAuth = (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            return res.status(401).json({ error: "authorization failed - no token provided" });
        }

        let token = req.headers.authorization.split(" ")[1];
        
        // אנחנו מאמתים את הטוקן ושומרים את הנתונים המוצפנים בתוכו על אובייקט req.user
        // בדרך כלל שומרים בטוקן בזמן ה-Login את ה-id וה-role של המשתמש
        const decoded = jwt.verify(token, process.env.SECRET);
        req.user = decoded; 

        next();
    } catch (err) {
        console.log(err);
        res.status(401).send("authorization failed");
    }
};

// 2. מידלוור חדש שבודק אם המשתמש המחובר הוא מנהל
const isAdmin = (req, res, next) => {
    // checkAuth רץ תמיד קודם, אז req.user כבר קיים ומכיל את פרטי המשתמש
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Admins only!" });
    }
    next();
};

// מייצאים את שתי הפונקציות כדי שנוכל להשתמש בהן בראוטר
module.exports = {
    checkAuth,
    isAdmin
};