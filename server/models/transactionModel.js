// server/models/transactionModel.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // מקשר למודל המשתמש
        required: true
    },
    type: {
        type: String,
        enum: ['deposit', 'purchase', 'refund'], // deposit = טעינה (ירוק), purchase = קנייה (אדום), refund = זיכוי (ירוק)
        required: true
    },
    amount: {
        type: Number,
        required: true // סכום חיובי תמיד (ההפרדה בין פלוס למינוס תהיה לפי ה-type)
    },
    description: {
        type: String, //למשל: "טעינת ארנק דיגיטלי" או "רכישת כרטיס למופע X" או "זיכוי עבור ביטול המופע Y"
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now // תאריך הפעולה אוטומטי לזמן הנוכחי (שנת 2026)
    }
});
// יצירת המודל וייצוא שלו
const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;