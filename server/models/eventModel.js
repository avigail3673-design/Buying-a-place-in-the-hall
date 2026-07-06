const mongoose = require('mongoose');

// הגדרת הסכמה עבור מופע/אירוע באולם
const eventSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: [true, 'חובה להזין את שם המופע'] 
    },
    artist: { 
        type: String, 
        required: [true, 'חובה להזין את שם האמן'] 
    },
    date: { 
        type: Date, 
        required: [true, 'חובה להזין תאריך ושעה למופע'] 
    },
    price: { 
        type: Number, 
        required: [true, 'חובה להזין מחיר כרטיס'] 
    }
}, { 
    timestamps: true // יוצר אוטומטית עמודות של מתי הנושא נוצר ומתי עודכן (createdAt, updatedAt)
});

// יצירת המודל וייצוא שלו
const Event = mongoose.model('Event', eventSchema);
module.exports = Event;