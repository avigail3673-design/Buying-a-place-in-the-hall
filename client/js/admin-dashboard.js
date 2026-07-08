const API_URL = 'http://localhost:4000';

// 1. אבטחת פרונטאנד: בדיקה שהמשתמש הוא אכן מנהל
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');

    if (!token || userRole !== 'admin') {
        alert('גישה נדחתה. אזור זה מיועד למנהלים בלבד.');
        window.location.href = 'login.html';
        return;
    }

    if (userName) {
        document.getElementById('admin-name').textContent = `שלום, ${userName}`;
    }

    // טעינת הנתונים מהשרת
    loadDashboardData();
});

// 2. פונקציה מרכזית לטעינת נתונים
async function loadDashboardData() {
    try {
        // שליפת כל האירועים מהשרת (נניח שיש לך נתיב GET /events שמחזיר את כולם)
        const response = await fetch(`${API_URL}/events`);
        const events = await response.json();

        if (!response.ok) throw new Error('נכשלה שליפת האירועים');

        renderStatsAndTable(events);

    } catch (err) {
        console.error('שגיאה בטעינת הדאשבורד:', err);
        alert('שגיאה בקבלת נתונים מהשרת');
    }
}

// 3. רינדור הסטטיסטיקות והטבלה לפי התאריך הנוכחי
function renderStatsAndTable(events) {
    const tableBody = document.getElementById('events-table-body');
    tableBody.innerHTML = ''; // ניקוי הטבלה

    const now = new Date();
    let activeCount = 0;
    let pastCount = 0;
    let totalTickets = 0; // תלוי אם יש לך שדה כרטיסים שנמכרו במודל

    events.forEach(event => {
        const eventDate = new Date(event.date);
        const isPast = eventDate < now; // בדיקה האם האירוע עבר

        // עדכון מונים לסטטיסטיקה
        if (isPast) pastCount++; else activeCount++;
        if (event.soldTickets) totalTickets += event.soldTickets;

        // יצירת שורת טבלה
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td><strong>${event.title}</strong></td>
            <td>${new Date(event.date).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}</td>
            <td>${event.location || 'האולם הראשי'}</td>
            <td>₪${event.price}</td>
            <td>
                <span class="status-badge ${isPast ? 'status-past' : 'status-active'}">
                    ${isPast ? 'הסתיים' : 'פעיל'}
                </span>
            </td>
            <td>
                <button class="action-btn edit-btn" ${isPast ? 'disabled' : ''} onclick="editEvent('${event._id}')">עריכה</button>
                <button class="action-btn delete-btn" ${isPast ? 'disabled' : ''} onclick="deleteEvent('${event._id}')">מחיקה</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });

    // עדכון כרטיסי המספרים למעלה
    document.getElementById('stat-active-events').textContent = activeCount;
    document.getElementById('stat-past-events').textContent = pastCount;
    document.getElementById('stat-tickets-sold').textContent = totalTickets;
}

// 4. לוגיקת כפתור התנתקות
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});

// פונקציות זמניות לפעולות (נחבר אותן לשרת בהמשך)
function editEvent(id) {
    window.location.href = `admin-event-form.html?id=${id}`;
}

async function deleteEvent(id) {
    if (confirm('האם אתה בטוח שברצונך למחוק אירוע זה?')) {
        // כאן נכתוב את ה-fetch למחיקה בהמשך
        alert(`נשלחה בקשת מחיקה עבור אירוע: ${id}`);
    }
}