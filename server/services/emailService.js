const nodemailer = require('nodemailer');

// 1. הגדרת המנוע שמתחבר לגוגל
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // קורא את האימייל מקובץ ה-env
        pass: process.env.EMAIL_PASS  // קורא את סיסמת 16 האותיות מקובץ ה-env
    }
});
// 2. פונקציה גנרית לשליחת מייל
const sendEmail = async (to, subject, text, html) => {
    try {
        const mailOptions = {
            from: `"פורטל האירועים" <${process.env.EMAIL_USER}>`,
            to: to,       // מייל היעד (הלקוח)
            subject: subject, // נושא המייל
            text: text,   // תוכן טקסט פשוט (לגיבוי)
            html: html    // תוכן מעוצב עם HTML ו-CSS (בשביל הכרטיס היפה שלך!)
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('המייל נשלח בהצלחה: ' + info.response);
        return true;
    } catch (error) {
        console.error('שגיאה בשליחת המייל:', error);
        return false;
    }
};

module.exports = { sendEmail };