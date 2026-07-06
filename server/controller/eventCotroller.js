// const Event=require('../models/eventModel')
// let getAllEvent=async(req,res)=>{
//      const E= await Event.find().populate({
//         path: 'title',
//         select:{'artist':1,'date':1,'price':1}
//       });
//     //  console.log(U.name)
//     res.status(200).json({event:E})
// }
// let saveNewEvent = async (req, res) => {
//   const Event_id = req.body.EventId;
//   console.log(Event_id);
//    if (Event_id) {
//     const newEvent = new Event(req.body);
//     await newEvent.save();
//     console.log(newEvent);
//     res.send(newEvent);

//     const updatedEvent = await Event.findOneAndUpdate(
//       { _id: Event_id },
//       { $push: { orders: newEvent._id } },
//       { new: true }
//     );
//     console.log('updatedEvent');
//   } else {
//     res.send('not found');
//   }
// };

const Event = require('../models/eventModel');
const Ticket = require('../models/ticketModel');
const User = require('../models/userModel');

// 1. הוספת מופע חדש (מנהל)
exports.createEvent = async (req, res) => {
    try {
        const { title, artist, date, price } = req.body;
        const newEvent = new Event({ title, artist, date, price });
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

// 3. הצגת מופע בודד לפי ID (בשביל דף בחירת הכיסאות בראקט)
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
            { new: true, runValidators: true } // מחזיר את האובייקט החדש ומפעיל בדיקות תקינות
        );
        
        if (!updatedEvent) {
            return res.status(404).json({ error: 'המופע לא נמצא לעדכון' });
        }
        res.status(200).json({ message: 'המופע עודכן בהצלחה!', event: updatedEvent });
    } catch (err) {
        res.status(400).json({ error: 'שגיאה בעדכון המופע', details: err.message });
    }
};

// 5. מחיקת מופע חכמה + החזר כספי לארנק הדיגיטלי (מנהל)
// 5. מחיקת מופע חכמה + סיבת ביטול חובה + החזר כספי יעיל (מנהל)
exports.deleteEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        // הבקשה שלך: מקבלים את סיבת הביטול מגוף הבקשה
        const { cancellationReason } = req.body; 

        // בדיקה שסיבת הביטול אכן הוזנה
        if (!cancellationReason || cancellationReason.trim() === "") {
            return res.status(400).json({ error: 'חובה לציין סיבת ביטול כדי למחוק את המופע!' });
        }

        // א. מוצאים את המופע כדי לדעת מה מחיר הכרטיס שלו
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ error: 'המופע לא נמצא' });
        }

        // ב. מוצאים את כל הכרטיסים שנרכשו למופע הזה
        const tickets = await Ticket.find({ eventId: eventId });

        // ג. אם יש כרטיסים, מחזירים לכולם כסף בארנק במכה אחת מהירה!
        if (tickets.length > 0) {
            // אוספים את כל ה-IDs הייחודיים של המשתמשים שקנו כרטיס למופע הזה
            const userIds = tickets.map(ticket => ticket.userId);

            // עדכון יעיל: מוסיף את מחיר הכרטיס לכל המשתמשים שברשימה בריצה אחת בלבד
            await User.updateMany(
                { _id: { $in: userIds } },
                { $inc: { walletBalance: event.price } }
            );
            
            // ד. מוחקים את כל הכרטיסים של המופע המבוטל
            await Ticket.deleteMany({ eventId: eventId });
        }

        // ה. מוחקים את המופע עצמו מהמערכת
        await Event.findByIdAndDelete(eventId);

        // מחזירים תשובה מפורטת עם סיבת הביטול (כדי שהפרונטאנד יוכל להציג אותה באזהרה)
        res.status(200).json({ 
            message: `המופע '${event.title}'בוטל ונמחק בהצלחה.`,
            reason: cancellationReason,
            ticketsCanceled: tickets.length,
            refundAmountPerTicket: event.price,
            detailedMessage: `האירוע בוטל מהסיבה: "${cancellationReason}". ${tickets.length} כרטיסים בוטלו והלקוחות זוכו בארנק הדיגיטלי.`
        });

    } catch (err) {
        res.status(500).json({ error: 'שגיאה בתהליך ביטול ומחיקת המופע', details: err.message });
    }
};

