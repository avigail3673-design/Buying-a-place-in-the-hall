const nodemailer = require('nodemailer');

// 1. הגדרת המנוע שמתחבר לגוגל
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'the-project-email@gmail.com', // ⚠️ המייל שלך ממנו יישלחו ההודעות
        pass: 'abcd efgh ijkl mnop'         // ⚠️ סיסמת האפליקציה בת 16 האותיות מגוגל
    }
});

// 2. פונקציה גנרית לשליחת מייל
const sendEmail = async (to, subject, text, html) => {
    try {
        const mailOptions = {
            from: '"פורטל האירועים" <the-project-email@gmail.com>',
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