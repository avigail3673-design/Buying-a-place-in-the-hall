const Event = require('../models/eventModel');
const Ticket = require('../models/ticketModel');
const User = require('../models/userModel');

// 1. הוספת מופע חדש (מנהל)
exports.createEvent = async (req, res) => {
    try {
        // ✨ תיקון: חילוץ השדות החדשים מתוך ה-body שהגיע מהפרונטאנד
        const { title, artist, date, price, description, totalSeats, image } = req.body;
        
        // ✨ תיקון: העברת כל השדות ליצירת המופע החדש במונגו
        const newEvent = new Event({ title, artist, date, price, description, totalSeats, image });
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

// 4. עדכון פרטי מופע (מנהל)
exports.updateEvent = async (req, res) => {
    try {
        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id, 
            req.body, 
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

// 5. מחיקת מופע חכמה + סיבת ביטול חובה + החזר כספי יעיל (מנהל)
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

        const tickets = await Ticket.find({ eventId: eventId });

        if (tickets.length > 0) {
            const userIds = tickets.map(ticket => ticket.userId);

            await User.updateMany(
                { _id: { $in: userIds } },
                { $inc: { walletBalance: event.price } }
            );
            
            await Ticket.deleteMany({ eventId: eventId });
        }

        await Event.findByIdAndDelete(eventId);

        res.status(200).json({ 
            message: `המופע '${event.title}' בוטל ונמחק בהצלחה.`,
            reason: cancellationReason,
            ticketsCanceled: tickets.length,
            refundAmountPerTicket: event.price,
            detailedMessage: `האירוע בוטל מהסיבה: "${cancellationReason}". ${tickets.length} כרטיסים בוטלו והלקוחות זוכו בארנק הדיגיטלי.`
        });

    } catch (err) {
        res.status(500).json({ error: 'שגיאה בתהליך ביטול ומחיקת המופע', details: err.message });
    }
};