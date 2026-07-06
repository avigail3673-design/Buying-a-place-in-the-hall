const mongoose = require('mongoose');

// הגדרת הסכמה עבור לקוח במערכת
const userSchema = new mongoose.Schema({
    fullName: { 
        type: String, 
        required: [true, 'חובה להזין שם מלא'] 
    },
    email: { 
        type: String, 
        required: [true, 'חובה להזין כתובת אימייל'],
        unique: true, // מונע הרשמה של שני לקוחות עם אותו אימייל
        trim: true
    },
    phone: { 
        type: String, 
        required: [true, 'חובה להזין מספר טלפון'] 
    },
    password: { 
        type: String,
        required: [true, 'חובה להזין סיסמה']
    },
    // בתוך קובץ userModel.js - הוספת שדה ארנק
    walletBalance: {
    type: Number,
    default: 0 // כשהמשתמש נרשם לראשונה, יש לו 0 שקלים בארנק
}
}, { 
    timestamps: true 
});

// יצירת המודל וייצוא שלו
const User = mongoose.model('User', userSchema);
module.exports = User;