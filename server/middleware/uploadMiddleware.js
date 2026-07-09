const multer = require('multer');
const path = require('path');

// הגדרת מקום השמירה ושם הקובץ
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // שומר בתיקיית uploads
    },
    filename: function (req, file, cb) {
        // מייצר שם ייחודי: הזמן הנוכחי + מספר רנדומלי + הסיומת המקורית (.jpg/.png)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// סינון קבצים - מאשר רק תמונות
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('ניתן להעלות קבצי תמונה בלבד!'), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = upload;