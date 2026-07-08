// server/controller/transactionController.js
const Transaction = require('../models/transactionModel');

// שליפת היסטוריית הארנק של משתמש ספציפי
exports.getUserHistory = async (req, res) => {
    try {
        const { userId } = req.params;

        // מוצאים את כל הפעולות של המשתמש וממיינים מהחדש ביותר לישן ביותר
        const history = await Transaction.find({ userId }).sort({ createdAt: -1 });

        res.status(200).json(history);
    } catch (err) {
        console.error('שגיאה בשליפת היסטוריית ארנק:', err);
        res.status(500).json({ error: 'שגיאה פנימית בשרת בשליפת ההיסטוריה' });
    }
};
// שליפת סיכום כספי (כמה נכנס וכמה יצא בסך הכל)
exports.getWalletSummary = async (req, res) => {
    try {
        const { userId } = req.params;
        const transactions = await Transaction.find({ userId });

        let totalDeposited = 0;
        let totalSpent = 0;

        transactions.forEach(tx => {
            if (tx.type === 'deposit' || tx.type === 'refund') {
                totalDeposited += tx.amount;
            } else if (tx.type === 'purchase') {
                totalSpent += tx.amount;
            }
        });

        res.status(200).json({
            totalDeposited,
            totalSpent,
            netBalance: totalDeposited - totalSpent // היתרה התיאורטית
        });
    } catch (err) {
        res.status(500).json({ error: 'שגיאה בחישוב סיכום הארנק' });
    }
};