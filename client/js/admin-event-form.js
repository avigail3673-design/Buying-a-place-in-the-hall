const API_URL = 'http://localhost:4000';

// שליפת מזהה האירוע מהכתובת (אם קיים - סימן שאנחנו במצב עריכה)
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', async () => {
    // 1. הגנת אבטחה
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (!token || userRole !== 'admin') {
        alert('גישה נדחתה.');
        window.location.href = 'login.html';
        return;
    }

    // 2. אם יש eventId, אנחנו במצב עריכה! נשלוף את נתוני האירוע הקיים מהשרת
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
        document.getElementById('location').value = event.location;
        document.getElementById('price').value = event.price;
        document.getElementById('totalSeats').value = event.totalSeats;
        document.getElementById('description').value = event.description || '';
        
        // המרה של פורמט התאריך לטובת שדה datetime-local
        if (event.date) {
            const localDate = new Date(event.date).toISOString().slice(0, 16);
            document.getElementById('date').value = localDate;
        }
    } catch (err) {
        console.error(err);
        alert('שגיאה בטעינת נתוני האירוע');
    }
}

// 3. האזנה לשליחת הטופס (גם יצירה וגם עדכון)
document.getElementById('event-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const eventData = {
        title: document.getElementById('title').value,
        date: document.getElementById('date').value,
        location: document.getElementById('location').value,
        price: Number(document.getElementById('price').value),
        totalSeats: Number(document.getElementById('totalSeats').value),
        description: document.getElementById('description').value
    };

    try {
        let response;
        const token = localStorage.getItem('token');

        if (eventId) {
            // מצב עריכה: נשלח בקשת PUT לנתיב הקיים
            response = await fetch(`${API_URL}/events/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // שליחת הטוקן לצורך אבטחה בשרת
                },
                body: JSON.stringify(eventData)
            });
        } else {
            // מצב יצירה: נשלח בקשת POST
            response = await fetch(`${API_URL}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(eventData)
            });
        }

        if (response.ok) {
            alert(eventId ? 'האירוע עודכן בהצלחה!' : 'האירוע נוצר בהצלחה!');
            window.location.href = 'admin-dashboard.html'; // חזרה לדאשבורד
        } else {
            const errorData = await response.json();
            alert(errorData.error || 'שגיאה בשמירת האירוע');
        }

    } catch (err) {
        console.error(err);
        alert('שגיאה בתקשורת עם השרת');
    }
});