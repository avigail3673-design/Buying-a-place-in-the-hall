// const jwt = require("jsonwebtoken");
// const User = require('../models/userSchema'); 

// // 1. קבלת כל המשתמשים
// const getAllUsers = async (req, res) => {
//     try {
//         const users = await User.find();
//         return res.status(200).json({ users });
//     } catch (error) {
//         return res.status(500).json({ message: "שגיאה בשרת", error });
//     }
// };

// // 2. שמירת משתמש חדש
// const saveNewUser = async (req, res) => {
//     try {
//         let newUser = new User(req.body);
//         await newUser.save();
//         console.log(newUser);
//         return res.status(201).json({ message: "created successfully" }); 
//     } catch (error) {
//         return res.status(400).json({ message: "יצירת משתמש נכשלה", error });
//     }
// };

// // 3. התחברות / קבלת משתמש לפי אימייל וסיסמה
// const getUserByEmailAndPassword = async (req, res) => {
//     const { email, password } = req.params;

//     try {
//         const user = await User.findOne({ email: email });

//         // אם המשתמש לא קיים
//         if (!user) {
//             return res.status(404).send("the user not found");
//         }

//         // בדיקת סיסמה (מומלץ בעתיד להשתמש בהצפנה כמו bcrypt)
//         if (user.password !== password) {
//             return res.status(400).send("the password does not match");
//         }

//         // יצירת טוקן JWT
//         const token = jwt.sign(
//             { email: user.email, id: user._id }, 
//             process.env.SECRET, 
//             { expiresIn: '1h' } // מומלץ להוסיף זמן תפוגה לטוקן
//         );

//         console.log(token);
//         return res.status(200).json({ user: user, token: token });

//     } catch (err) {
//         console.log(err);
//         return res.status(500).json({ message: "שגיאה פנימית", err });
//     }
    
// };

// module.exports = { getAllUsers, saveNewUser, getUserByEmailAndPassword };

const User = require('../models/userModel');

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

        res.status(200).json({ message: 'התחברת בהצלחה!', user });
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