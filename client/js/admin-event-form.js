const API_URL = 'http://localhost:4000';

// שליפת מזהה האירוע מהכתובת (אם קיים - סימן שאנחנו במצב עריכה)
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. הגנת אבטחה: בדיקה שהמשתמש הוא אכן מנהל ומחובר
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (!token || userRole !== 'admin') {
        showPopup('גישה נדחתה', 'עמוד זה מיועד למנהלים בלבד.');
        window.location.href = 'login.html';
        return;
    }

    // 2. מצב עריכה: שליפת נתוני אירוע קיים מהשרת ומילוי הטופס
    if (eventId) {
        document.getElementById('page-title').textContent = 'עריכת אירוע קיים';
        document.getElementById('form-title').textContent = 'עדכון פרטי האירוע';
        document.getElementById('save-btn').textContent = 'שמירת שינויים';
        await loadEventData(eventId);
    }
});

// פונקציה לשליפת נתוני אירוע בודד לצורך עריכה
async function loadEventData(id) {
    try {
        const response = await fetch(`${API_URL}/events/${id}`);
        if (!response.ok) throw new Error();
        
        const event = await response.json();

        // מילוי השדות בטופס אוטומטית
        document.getElementById('title').value = event.title;
        document.getElementById('artist').value = event.artist || ''; 
        document.getElementById('location').value = event.location || 'האולם המרכזי';
        document.getElementById('price').value = event.price;
        // document.getElementById('totalSeats').value = event.totalSeats || ''; 
        document.getElementById('description').value = event.description || ''; 
        
        // הצגת סטטוס תמונה נוכחית אם קיימת
        if (event.image) {
            document.getElementById('current-image-status').textContent = '💡 קיימת כבר תמונה שמורה במערכת. בחירת קובץ חדש תחליף אותה.';
        }

        // המרה של פורמט התאריך לטובת שדה datetime-local
        if (event.date) {
            const localDate = new Date(event.date).toISOString().slice(0, 16);
            document.getElementById('date').value = localDate;
        }
    } catch (err) {
        console.error('שגיאה בטעינת נתוני המופע:', err);
        showPopup('שגיאה בטעינה', 'שגיאה בקבלת נתונים מהשרת');
    }
}

// 3. האזנה לשליחת הטופס (גם יצירה וגם עדכון)
document.getElementById('event-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // ✨ עדכון: שימוש ב-FormData במקום אובייקט JSON פשוט, כדי לתמוך בקבצים
    const formData = new FormData();
    formData.append('title', document.getElementById('title').value);
    formData.append('artist', document.getElementById('artist').value);
    formData.append('date', document.getElementById('date').value);
    formData.append('location', document.getElementById('location').value);
    formData.append('price', document.getElementById('price').value);
    // formData.append('totalSeats', document.getElementById('totalSeats').value);
    formData.append('description', document.getElementById('description').value);

    // ✨ תפיסת קובץ התמונה האמיתי שהמנהל בחר
    const imageInput = document.getElementById('image');
    if (imageInput.files.length > 0) {
        // 'image' חייב להתאים בדיוק ל-upload.single('image') בראוטר של ה-Backend
        formData.append('image', imageInput.files[0]); 
    }

    try {
        let response;
        const token = localStorage.getItem('token');

        if (eventId) {
            // מצב עריכה: נשלח בקשת PUT
            response = await fetch(`${API_URL}/events/${eventId}`, {
                method: 'PUT',
                headers: {
                    // ⚠️ חשוב: כששולחים FormData אסור לציין 'Content-Type': 'application/json'! הדפדפן מקנפג לבד.
                    'Authorization': `Bearer ${token}` 
                },
                body: formData // שולחים את ה-formData
            });
        } else {
            // מצב יצירה: נשלח בקשת POST
            response = await fetch(`${API_URL}/events`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}` 
                },
                body: formData // שולחים את ה-formData
            });
        }

        if (response.ok) {
            showPopup('הצלחה!', eventId ? 'האירוע עודכן בהצלחה!' : 'האירוע נוצר בהצלחה!');
            window.location.href = 'admin-dashboard.html'; 
        } else {
            const errorData = await response.json();
            showPopup('שגיאה בשמירה', errorData.error || 'שגיאה בשמירת האירוע');
        }

    } catch (err) {
        console.error('שגיאה בשליחת הטופס:', err);
        showPopup('שגיאה בתקשורת עם השרת', 'שגיאה בקבלת נתונים מהשרת');
    }
});
function showPopup(title, message) {
    document.getElementById('popup-title').innerText = title;
    document.getElementById('popup-message').innerText = message;
    document.getElementById('generic-popup').style.display = 'flex';
}

function closeGenericPopup() {
    document.getElementById('generic-popup').style.display = 'none';
}
