const Ticket = require('../models/ticketModel');
const Event = require('../models/eventModel');
const User = require('../models/userModel');

// 1. שליפת כל הכיסאות התפוסים למופע ספציפי (בשביל לצייר את המטריצה בראקט)
// נתיב מצופה: GET /tickets/event/:eventId
exports.getTakenSeats = async (req, res) => {
    try {
        const { eventId } = req.params;

        // שולפים רק את השורה, הטור והסטטוס של הכרטיסים באותו מופע
        const takenSeats = await Ticket.find({ eventId })
            .select('row column status'); 

        res.status(200).json(takenSeats);
    } catch (err) {
        res.status(500).json({ error: 'שגיאה בשליפת המקומות התפוסים', details: err.message });
    }
};

// 2. רכישת כרטיס חכמה (עם בדיקת זמינות מקום ותשלום מהארנק הדיגיטלי)
// נתיב מצופה: POST /tickets/book
exports.bookTicket = async (req, res) => {
    try {
        const { eventId, userId, row, column } = req.body;

        // ==================== בדיקת גבולות האולם ====================
        const MAX_ROWS = 10;
        const MAX_COLUMNS = 12;

        if (row < 1 || row > MAX_ROWS || column < 1 || column > MAX_COLUMNS) {
            return res.status(400).json({ 
                error: `מיקום הכיסא אינו חוקי! האולם מוגבל ל-${MAX_ROWS} שורות ו-${MAX_COLUMNS} כיסאות בלבד.` 
            });
        }
        // ====================================================================

        // א. בדיקה האם הכיסא כבר תפוס במופע הזה
        const seatTaken = await Ticket.findOne({ eventId, row, column });
        if (seatTaken) {
            return res.status(400).json({ error: 'הכיסא שנבחר כבר תפוס במופע זה!' });
        }

        // ב. שליפת פרטי המופע כדי לדעת מה המחיר ושם המופע
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'המופע לא נמצא במערכת' });
        }

        // ג. שליפת פרטי המשתמש כדי לבדוק את הארנק שלו
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'המשתמש לא נמצא' });
        }

        // ד. בדיקה האם יש למשתמש מספיק כסף בארנק
        if (user.walletBalance < event.price) {
            return res.status(400).json({ 
                error: 'אין מספיק כסף בארנק הדיגיטלי!', 
                currentBalance: user.walletBalance, 
                ticketPrice: event.price 
            });
        }

        // ה. ביצוע התשלום: הורדת מחיר הכרטיס מארנק המשתמש ומשיכת האובייקט המעודכן
        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { $inc: { walletBalance: -event.price } }, // מינוס כדי להחסיר מהארנק
            { new: true } // מחזיר את המשתמש המעודכן עם היתרה החדשה
        );

        // ו. יצירת הכרטיס ושמירתו במטריצה
        const newTicket = new Ticket({
            eventId,
            userId,
            row,
            column,
            status: 'paid' // מכיוון שהוא שילם מהארנק, הסטטוס הוא "שולם"
        });
        await newTicket.save();

        // ====== הוספה: יצירת תנועה בהיסטוריית הארנק (עו"ש) ======
        const Transaction = require('../models/transactionModel'); // ייבוא מקומי או גלובלי בראש הקובץ
        const ticketTransaction = new Transaction({
            userId: userId,
            type: 'purchase',
            amount: event.price,
            description: `רכישת כרטיס למופע: ${event.title} (שורה ${row}, כיסא ${column})`
        });
        await ticketTransaction.save();
        // ========================================================

        res.status(201).json({ 
            message: 'הרכישה בוצעה בהצלחה! הכסף ירד מהארנק הדיגיטלי.', 
            ticket: newTicket,
            newWalletBalance: updatedUser.walletBalance // החזרת היתרה האמיתית והמדויקת מהדאטאבייס
        });

    } catch (err) {
        res.status(500).json({ error: 'שגיאה בתהליך רכישת הכרטיס', details: err.message });
    }
};
// 3. שליפת כל הכרטיסים של משתמש מסוים (עבור דף "ההזמנות שלי")
// נתיב מצופה: GET /tickets/user/:userId
exports.getUserTickets = async (req, res) => {
    try {
        const { userId } = req.params;

        // populate מאפשר לנו להביא גם את פרטי המופע (שם, אמן, תאריך) במקום רק ה-ID שלו!
        const myTickets = await Ticket.find({ userId })
            .populate('eventId', 'title artist date price');

        res.status(200).json(myTickets);
    } catch (err) {
        res.status(500).json({ error: 'שגיאה בשליפת הכרטיסים של המשתמש', details: err.message });
    }
};