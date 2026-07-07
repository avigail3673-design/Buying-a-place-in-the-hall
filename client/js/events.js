const API_URL = 'http://localhost:4000';

document.addEventListener('DOMContentLoaded', () => {
    // 1. נציג את פרטי המשתמש המחובר מה-localStorage
    displayUserStatus();

    // 2. נמשוך את המופעים מהשרת
    fetchEvents();
});

// פונקציה שמציגה את שם המשתמש ומושכת את יתרת הארנק שלו בזמן אמת מהשרת
async function displayUserStatus() {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName') || 'אורח';
    const userStatusDiv = document.getElementById('user-status');

    if (!userId) {
        userStatusDiv.innerHTML = `שלום, ${userName}`;
        return;
    }

    try {
        // פנייה לנתיב שכתבתן בשרת: GET /users/:id
        const response = await fetch(`${API_URL}/users/${userId}`);
        if (response.ok) {
            const userData = await response.json();
            userStatusDiv.innerHTML = `שלום, <strong>${userData.fullName}</strong> | יתרה בארנק: <strong>₪${userData.walletBalance}</strong>`;
        } else {
            userStatusDiv.innerHTML = `שלום, ${userName}`;
        }
    } catch (err) {
        console.error('שגיאה בשליפת פרופיל משתמש:', err);
        userStatusDiv.innerHTML = `שלום, ${userName}`;
    }
}

// פונקציה שמושכת את כל האירועים מ-MongoDB ומציגה אותם
async function fetchEvents() {
    const eventsGrid = document.getElementById('events-grid');

    try {
        // פנייה לנתיב שכתבתן בשרת: GET /events
        const response = await fetch(`${API_URL}/events`);
        const events = await response.json();

        // ניקוי הודעת הטעינה
        eventsGrid.innerHTML = '';

        if (!events || events.length === 0) {
            eventsGrid.innerHTML = '<p class="loading">אין כרגע מופעים זמינים במערכת.</p>';
            return;
        }

        // ריצה על כל המופעים שחזרו ובניית כרטיס HTML עבור כל אחד
        events.forEach(event => {
            // עיצוב תאריך קריא בעברית
            const eventDate = new Date(event.date).toLocaleDateString('he-IL', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            const card = document.createElement('div');
            card.className = 'event-card';
            card.innerHTML = `
                <div>
                    <h2 class="event-title">${event.title}</h2>
                    <p class="event-artist">${event.artist}</p>
                    <p class="event-details">📅 ${eventDate}</p>
                </div>
                <div>
                    <p class="event-price">₪${event.price}</p>
                    <button class="order-btn" onclick="goToSeatSelection('${event._id}')">להזמנת מקומות</button>
                </div>
            `;
            eventsGrid.appendChild(card);
        });

    } catch (err) {
        console.error('שגיאה בטעינת מופעים:', err);
        eventsGrid.innerHTML = '<p class="loading" style="color: #ff4a4a;">שגיאה בחיבור לשרת או בטעינת המופעים.</p>';
    }
}

// מעבר לעמוד בחירת הכיסאות עם ה-ID של המופע הספציפי שנבחר
function goToSeatSelection(eventId) {
    // נשמור את ה-ID של המופע הנוכחי כדי שדף האולם ידע איזה כיסאות למשוך
    localStorage.setItem('currentEventId', eventId);
    window.location.href = 'seats.html'; // מעביר לעמוד הבא
}