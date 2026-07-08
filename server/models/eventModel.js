const mongoose = require('mongoose');

// הגדרת הסכמה המורחבת עבור מופע/אירוע באולם
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
        required: [true, 'חובה להזין מחיר כרטיס'],
        min: [0, 'המחיר אינו יכול להיות שלילי']
    },
    // ✨ שדות חדשים שהוספנו לבקשתך:
    description: {
        type: String,
        default: '' // אם המנהל לא מזין, יישמר ריק ולא יקרוס
    },
    totalSeats: {
        type: Number,
        required: [true, 'חובה להזין את כמות המקומות באולם'],
        min: [1, 'חובה שיהיה לפחות מקום אחד באולם']
    },
    image: {
        type: String, // שומרים כתובת URL של התמונה/פוסטר
        default: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500' // תמונת ברירת מחדל יפה אם לא יועלה פוסטר
    }
}, { 
    timestamps: true 
});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;