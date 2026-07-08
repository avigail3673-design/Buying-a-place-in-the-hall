const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// 1. בודק אם המשתמש מחובר בכלל (מחלץ את הטוקן)
const checkAuth = (req, res, next) => {
    try {
        if (!req.headers.authorization) {
            return res.status(401).json({ error: "Authorization failed - no token provided" });
        }

        let token = req.headers.authorization.split(" ")[1];
        
        const decoded = jwt.verify(token, process.env.SECRET);
        req.user = decoded; 

        next();
    } catch (err) {
        console.log(err);
        // שינוי קטן: החזרת JSON מסודר עבור ה-Client
        return res.status(401).json({ error: "Authorization failed - invalid or expired token" });
    }
};

// 2. בודק אם המשתמש הוא מנהל (עבור נתיבי אדמין)
const isAdmin = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id; 
        const user = await User.findById(userId);

        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: "Access denied. Admins only!" });
        }

        next();
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error during admin verification", details: err.message });
    }
};

// 3. בודק אם המשתמש הוא לקוח (עבור נתיבי לקוחות ספציפיים, אם צריך)
const isCustomer = async (req, res, next) => {
    try {
        const userId = req.user.id || req.user._id; 
        const user = await User.findById(userId);

        if (!user || user.role !== 'customer') {
            return res.status(403).json({ error: "Access denied. Customers only!" });
        }

        next();
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error during customer verification", details: err.message });
    }
};

module.exports = {
    checkAuth,
    isAdmin,
    isCustomer
};