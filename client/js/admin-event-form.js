const API_URL = 'http://localhost:4000';

// שליפת מזהה האירוע מהכתובת (אם קיים - סימן שאנחנו במצב עריכה)
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. הגנת אבטחה: בדיקה שהמשתמש הוא אכן מנהל ומחובר
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (!token || userRole !== 'admin') {
        alert('גישה נדחתה. עמוד זה מיועד למנהלים בלבד.');
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

        // מילוי השדות בטופס אוטומטית (כולל השדות החדשים!)
        document.getElementById('title').value = event.title;
        document.getElementById('artist').value = event.artist || ''; // ✨ שדה חדש
        document.getElementById('location').value = event.location || 'האולם המרכזי';
        document.getElementById('price').value = event.price;
        document.getElementById('totalSeats').value = event.totalSeats || ''; // ✨ שדה חדש
        document.getElementById('image').value = event.image || ''; // ✨ שדה חדש
        document.getElementById('description').value = event.description || ''; // ✨ שדה חדש
        
        // המרה של פורמט התאריך לטובת שדה datetime-local
        if (event.date) {
            const localDate = new Date(event.date).toISOString().slice(0, 16);
            document.getElementById('date').value = localDate;
        }
    } catch (err) {
        console.error('שגיאה בטעינת נתוני המופע:', err);
        alert('שגיאה בטעינת נתוני האירוע');
    }
}

// 3. האזנה לשליחת הטופס (גם יצירה וגם עדכון)
document.getElementById('event-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // ✨ בניית האובייקט המלא עם כל השדות החדשים לאיסוף מהטופס
    const eventData = {
        title: document.getElementById('title').value,
        artist: document.getElementById('artist').value, // ✨ חדש
        date: document.getElementById('date').value,
        location: document.getElementById('location').value,
        price: Number(document.getElementById('price').value),
        totalSeats: Number(document.getElementById('totalSeats').value), // ✨ חדש
        image: document.getElementById('image').value || undefined, // ✨ חדש - אם ריק, ישתמש בדיפולט של הסכמה
        description: document.getElementById('description').value
    };

    try {
        let response;
        const token = localStorage.getItem('token');

        if (eventId) {
            // מצב עריכה: נשלח בקשת PUT
            response = await fetch(`${API_URL}/events/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // שליחת טוקן האבטחה
                },
                body: JSON.stringify(eventData)
            });
        } else {
            // מצב יצירה: נשלח בקשת POST
            response = await fetch(`${API_URL}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // שליחת טוקן האבטחה
                },
                body: JSON.stringify(eventData)
            });
        }

        if (response.ok) {
            alert(eventId ? 'האירוע עודכן בהצלחה!' : 'האירוע נוצר בהצלחה!');
            window.location.href = 'admin-dashboard.html'; // חזרה ישירות לדאשבורד
        } else {
            const errorData = await response.json();
            alert(errorData.error || 'שגיאה בשמירת האירוע');
        }

    } catch (err) {
        console.error('שגיאה בשליחת הטופס:', err);
        alert('שגיאה בתקשורת עם השרת');
    }
});