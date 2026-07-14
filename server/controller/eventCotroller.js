const Event = require('../models/eventModel');
const Ticket = require('../models/ticketModel');
const User = require('../models/userModel');
const Transaction = require('../models/transactionModel'); // ייבוא מודל העסקאות

// 1. הוספת מופע חדש (מנהל) + תמיכה בהעלאת תמונה
exports.createEvent = async (req, res) => {
    try {
        // חילוץ השדות מתוך ה-body שהגיע מהפרונטאנד
        const { title, artist, date, price, description, totalSeats } = req.body;
        
        let imagePath;
        // ✨ שילוב: בדיקה האם המנהל העלה קובץ תמונה מהמחשב באמצעות multer
        if (req.file) {
            imagePath = req.file.path; // ישמור במונגו נתיב כמו: "uploads/image-1234567.jpg"
        } else if (req.body.image) {
            imagePath = req.body.image; // גיבוי: למקרה שבכל זאת נשלח קישור טקסטואלי
        }

        // העברת כל השדות, כולל נתיב התמונה החדש, ליצירת המופע במונגו
        const newEvent = new Event({ 
            title, 
            artist, 
            date, 
            price, 
            description, 
            totalSeats, 
            image: imagePath 
        });
        
        await newEvent.save();
        
        res.status(201).json({ message: 'המופע נוצר בהצלחה!', event: newEvent });
    } catch (err) {
        res.status(400).json({ error: 'שגיאה ביצירת המופע', details: err.message });
    }
};

// 2. הצגת כל המופעים (לקוח + מנהל)
exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find();
        res.status(200).json(events);
    } catch (err) {
        res.status(500).json({ error: 'שגיאה בשליפת המופעים', details: err.message });
    }
};

// 3. הצגת מופע בודד לפי ID (בשביל דף בחירת הכיסאות בריאקט)
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ error: 'המופע לא נמצא' });
        }
        res.status(200).json(event);
    } catch (err) {
        res.status(500).json({ error: 'שגיאה בשליפת המופע', details: err.message });
    }
};

// 4. עדכון פרטי מופע (מנהל) + תמיכה בהחלפת תמונה
exports.updateEvent = async (req, res) => {
    try {
        // מעתיקים את כל השדות שהגיעו בטקסט לעדכון
        const updateData = { ...req.body };

        // ✨ שילוב: בדיקה האם המנהל העלה קובץ תמונה חדש בזמן העדכון
        if (req.file) {
            updateData.image = req.file.path; // דורסים את התמונה הישנה בנתיב החדש
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true, runValidators: true }
        );
        
        if (!updatedEvent) {
            return res.status(404).json({ error: 'המופע לא נמצא לעדכון' });
        }
        res.status(200).json({ message: 'המופע עודכן בהצלחה!', event: updatedEvent });
    } catch (err) {
        res.status(400).json({ error: 'שגיאה בעדכון המופע', details: err.message });
    }
};

// 5. מחיקת מופע חכמה + סיבת ביטול חובה + החזר כספי ותיעוד עסקאות (מנהל)
exports.deleteEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const { cancellationReason } = req.body; 

        if (!cancellationReason || cancellationReason.trim() === "") {
            return res.status(400).json({ error: 'חובה לציין סיבת ביטול כדי למחוק את המופע!' });
        }

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'המופע לא נמצא' });
        }

        // שליפת כל הכרטיסים שנרכשו לאירוע הזה
        const tickets = await Ticket.find({ eventId: eventId });

        if (tickets.length > 0) {
            // רצה על כל כרטיס בנפרד כדי לבצע זיכוי מנומק ויצירת שורת עו"ש
            for (let ticket of tickets) {
                // 1. זיכוי ארנק המשתמש הספציפי בערך הכרטיס
               // 1. זיכוי ארנק המשתמש
    await User.findByIdAndUpdate(
        ticket.userId,
        { $inc: { walletBalance: event.price } }
    );

    // 2. יצירת רשומת עסקה מפורטת
   const refundTransaction = new Transaction({
                    userId: ticket.userId,
                    type: 'refund',
                    amount: event.price,
                    description: `זיכוי עבור ביטול המופע: ${event.title}. סיבה: ${cancellationReason}`
                    // createdAt יתמלא אוטומטית ע"י המודל
                });
                await refundTransaction.save();
            }
            
            // אחרי שכולם זוכו ותועדו, מוחקים את כל הכרטיסים של המופע מה-DB
            await Ticket.deleteMany({ eventId: eventId });
        }

        // מחיקת המופע עצמו
        await Event.findByIdAndDelete(eventId);

        res.status(200).json({ 
            message: `המופע '${event.title}' בוטל ונמחק בהצלחה.`,
            reason: cancellationReason,
            ticketsCanceled: tickets.length,
            refundAmountPerTicket: event.price,
            detailedMessage: `האירוע בוטל מהסיבה: "${cancellationReason}". ${tickets.length} כרטיסים בוטלו, הלקוחות זוכו בארנק והיסטוריית העסקאות עודכנה.`
        });

    } catch (err) {
        res.status(500).json({ error: 'שגיאה בתהליך ביטול ומחיקת המופע', details: err.message });
    }
};