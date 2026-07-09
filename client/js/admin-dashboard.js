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
    let totalTickets = 0; 

    events.forEach(event => {
        const eventDate = new Date(event.date);
        const isPast = eventDate < now; // בדיקה האם האירוע עבר

        if (isPast) pastCount++; else activeCount++;
        if (event.soldTickets) totalTickets += event.soldTickets;

        // ✨ יצירת נתיב מלא לתמונה מהשרת (או תמונת דיפולט אם אין)
        const imageUrl = event.image ? `${API_URL}/${event.image}` : 'https://via.placeholder.com/50';

        // יצירת שורת טבלה (הוספנו עמודת תמונה)
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td><img src="${imageUrl}" alt="תמונה" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;"></td>
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

    document.getElementById('stat-active-events').textContent = activeCount;
    document.getElementById('stat-past-events').textContent = pastCount;
    document.getElementById('stat-tickets-sold').textContent = totalTickets;
}

// 4. לוגיקת כפתור התנתקות
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});

function editEvent(id) {
    window.location.href = `admin-event-form.html?id=${id}`;
}

// ✨ חיבור מלא למחיקה החכמה שלכן (כולל דרישת סיבת ביטול ועדכון הארנקים)
async function deleteEvent(id) {
    const cancellationReason = prompt('חובה לציין סיבת ביטול למחיקת המופע וזיכוי הלקוחות:');
    
    if (cancellationReason === null) return; // המנהל לחץ ביטול בחלונית
    
    if (cancellationReason.trim() === "") {
        alert('לא ניתן למחוק מופע ללא ציון סיבת ביטול!');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/events/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ cancellationReason })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message || 'המופע בוטל והלקוחות זוכו בהצלחה!');
            loadDashboardData(); // רענון הטבלה
        } else {
            alert(data.error || 'שגיאה במחיקת המופע');
        }
    } catch (err) {
        console.error(err);
        alert('שגיאה בתקשורת עם השרת בזמן המחיקה');
    }
}