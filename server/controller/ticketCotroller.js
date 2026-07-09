const Ticket = require('../models/ticketModel');
const Event = require('../models/eventModel');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel');
// ✨ ייבוא שירות המייל בראש הקובץ
const { sendEmail } = require('../services/emailService');

// 1. שליפת כל הכיסאות התפוסים למופע ספציפי
exports.getTakenSeats = async (req, res) => {
    try {
        const { eventId } = req.params;
        const takenSeats = await Ticket.find({ eventId }).select('row column status'); 
        res.status(200).json(takenSeats);
    } catch (err) {
        res.status(500).json({ error: 'שגיאה בשליפת המקומות התפוסים', details: err.message });
    }
};

// 2. רכישת כרטיס חכמה + שליחת כרטיס אוטומטית למייל של הלקוח
exports.bookTicket = async (req, res) => {
    try {
        const { eventId, userId, row, column } = req.body;

        // בדיקת גבולות האולם
        const MAX_ROWS = 10;
        const MAX_COLUMNS = 12;
        if (row < 1 || row > MAX_ROWS || column < 1 || column > MAX_COLUMNS) {
            return res.status(400).json({ 
                error: `מיקום הכיסא אינו חוקי! האולם מוגבל ל-${MAX_ROWS} שורות ו-${MAX_COLUMNS} כיסאות בלבד.` 
            });
        }

        // א. בדיקה האם הכיסא כבר תפוס
        const seatTaken = await Ticket.findOne({ eventId, row, column });
        if (seatTaken) {
            return res.status(400).json({ error: 'הכיסא שנבחר כבר תפוס במופע זה!' });
        }

        // ב. שליפת פרטי המופע
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'המופע לא נמצא במערכת' });
        }

        // ג. שליפת פרטי המשתמש
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

        // ה. ביצוע התשלום מהארנק
        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { $inc: { walletBalance: -event.price } }, 
            { new: true } 
        );

        // ו. יצירת הכרטיס ושמירתו
        const newTicket = new Ticket({
            eventId,
            userId,
            row,
            column,
            status: 'paid'
        });
        await newTicket.save();

        // ז. יצירת תנועה בהיסטוריית הארנק (עו"ש)
        const ticketTransaction = new Transaction({
            userId: userId,
            type: 'purchase',
            amount: event.price,
            description: `רכישת כרטיס למופע: ${event.title} (שורה ${row}, כיסא ${column})`
        });
        await ticketTransaction.save();

        // ✨ ח. בניית כרטיס מעוצב ושליחתו למייל האמיתי של המשתמש מהדאטאבייס
        const ticketCode = "TKT-" + Math.floor(100000 + Math.random() * 900000);
        const ticketHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 500px; border: 2px dashed #4CAF50; padding: 20px; border-radius: 10px; text-align: center; direction: rtl; margin: 0 auto;">
                <h2 style="color: #4CAF50;">🎉 אישור רכישת כרטיס!</h2>
                <p>שלום <strong>${user.name || 'אורח'}</strong>, שמחים לעדכן שכרטיסך למופע נשמר בהצלחה.</p>
                <hr style="border: 1px solid #eee;">
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; text-align: right;">
                    <p><strong>מופע:</strong> ${event.title}</p>
                    <p><strong>אמן:</strong> ${event.artist || 'ללא אמן'}</p>
                    <p><strong>מיקום:</strong> ${event.location || 'האולם הראשי'}</p>
                    <p><strong>תאריך:</strong> ${new Date(event.date).toLocaleDateString('he-IL')}</p>
                    <p><strong>שעה:</strong> ${new Date(event.date).toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</p>
                    <p><strong>מקום ישיבה:</strong> שורה ${row}, כיסא ${column}</p>
                </div>
                <div style="margin-top: 20px; background: #4CAF50; color: white; padding: 10px; font-size: 20px; font-weight: bold; letter-spacing: 2px; border-radius: 5px;">
                    קוד כרטיס: ${ticketCode}
                </div>
                <p style="font-size: 12px; color: #888; margin-top: 15px;">יש להציג קוד זה בכניסה לאולם.</p>
            </div>
        `;

        // שליחת המייל בפועל
        await sendEmail(
            user.email, // המייל שהוצאנו מתוך אובייקט המשתמש במונגו
            `כרטיסך למופע ${event.title} זמין עבורך!`, 
            `קוד הכרטיס שלך הוא: ${ticketCode}. שורה ${row}, כיסא ${column}.`, 
            ticketHtml
        );

        // ט. החזרת התשובה לפרונטאנד
        res.status(201).json({ 
            message: 'הרכישה בוצעה בהצלחה! הכרטיס נשלח למייל שלך.', 
            ticket: newTicket,
            newWalletBalance: updatedUser.walletBalance 
        });

    } catch (err) {
        res.status(500).json({ error: 'שגיאה בתהליך רכישת הכרטיס', details: err.message });
    }
};

// 3. שליפת כל הכרטיסים של משתמש מסוים
exports.getUserTickets = async (req, res) => {
    try {
        const { userId } = req.params;
        const myTickets = await Ticket.find({ userId }).populate('eventId', 'title artist date price location');
        res.status(200).json(myTickets);
    } catch (err) {
        res.status(500).json({ error: 'שגיאה בשליפת הכרטיסים של המשתמש', details: err.message });
    }
};