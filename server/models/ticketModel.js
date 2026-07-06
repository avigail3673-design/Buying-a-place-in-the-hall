const mongoose = require('mongoose');

// הגדרת הסכמה עבור כרטיס/מקום מוזמן במטריצה של האולם
const ticketSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event', // מקשר ישירות למודל ה-Event שיצרנו
        required: [true, 'חובה לקשר את הכרטיס למופע ספציפי']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // מקשר ישירות למודל ה-User שיצרנו
        required: [true, 'חובה לקשר את הכרטיס ללקוח ספציפי']
    },
    row: {
        type: Number,
        required: [true, 'חובה לציין מספר שורה']
    },
    column: {
        type: Number,
        required: [true, 'חובה לציין מספר טור/כיסא']
    },
    status: {
        type: String,
        enum: ['ordered', 'paid', 'temporary_hold'], // מאפשר להכניס אך ורק את הסטטוסים האלו
        default: 'ordered' // סטטוס ברירת מחדל
    }
}, { 
    timestamps: true 
});

// יצירת אינדקס ייחודי משולב: מונע מצב שבו יוצר באותו מופע (eventId) כרטיס כפול לאותה שורה וטור!
ticketSchema.index({ eventId: 1, row: 1, column: 1 }, { unique: true });

// יצירת המודל וייצוא שלו
const Ticket = mongoose.model('Ticket', ticketSchema);
module.exports = Ticket;