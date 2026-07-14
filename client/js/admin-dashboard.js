const API_URL = 'http://localhost:4000';
let currentCallback = null;

// --- פונקציות הפופ-אפ (זמינות גלובלית) ---
window.showPopup = function(title, message, showInput = false, callback = null) {
    document.getElementById('popup-title').innerText = title;
    document.getElementById('popup-message').innerText = message;
    
    const inputField = document.getElementById('popup-input');
    inputField.style.display = showInput ? 'block' : 'none';
    inputField.value = ''; 
    
    document.getElementById('btn-confirm').style.display = callback ? 'inline-block' : 'none';
    
    currentCallback = callback;
    document.getElementById('generic-popup').style.display = 'flex';
}

window.handleConfirm = function() {
    const inputVal = document.getElementById('popup-input').value;
    document.getElementById('generic-popup').style.display = 'none';
    if (currentCallback) currentCallback(inputVal);
}

window.closeGenericPopup = function() {
    document.getElementById('generic-popup').style.display = 'none';
}

// --- לוגיקת דאשבורד ---
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');
    
    if (!token || userRole !== 'admin') {
        showPopup('גישה נדחתה. אזור זה מיועד למנהלים בלבד.');
        window.location.href = 'login.html';
        return;
    }

    if (userName) {
        document.getElementById('admin-name').textContent = `שלום, ${userName}`;
    }

    loadDashboardData();
});

async function loadDashboardData() {
    try {
        const response = await fetch(`${API_URL}/events`);
        const events = await response.json();
        if (!response.ok) throw new Error('נכשלה שליפת האירועים');
        renderStatsAndTable(events);
        
        // 🔥 החיבור המושלם: קריאה לפונקציית החישוב החדשה מיד לאחר טעינת ורינדור הנתונים הבסיסיים
        await calculateTotalSoldTickets();
        
    } catch (err) {
        console.error('שגיאה בטעינת הדאשבורד:', err);
        showPopup('שגיאה בטעינה', 'שגיאה בקבלת נתונים מהשרת');
    }
}

function renderStatsAndTable(events) {
    const tableBody = document.getElementById('events-table-body');
    tableBody.innerHTML = '';
    const now = new Date();
    let activeCount = 0, pastCount = 0, totalTickets = 0;

    events.forEach(event => {
        const eventDate = new Date(event.date);
        const isPast = eventDate < now;
        if (isPast) pastCount++; else activeCount++;
        // if (event.soldTickets) totalTickets += event.soldTickets;

        const imageUrl = event.image ? `${API_URL}/${event.image}` : 'https://via.placeholder.com/50';
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td><img src="${imageUrl}" alt="תמונה" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;"></td>
            <td><strong>${event.title}</strong></td>
            <td>${new Date(event.date).toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}</td>
            <td>${event.location || 'האולם הראשי'}</td>
            <td>₪${event.price}</td>
            <td><span class="status-badge ${isPast ? 'status-past' : 'status-active'}">${isPast ? 'הסתיים' : 'פעיל'}</span></td>
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

// --- פונקציית מחיקה (מתוקנת) ---
window.deleteEvent = async function(id) {
    showPopup('מחיקת מופע', 'נא להזין סיבה לביטול:', true, async (reason) => {
        if (!reason || reason.trim() === "") {
            showPopup('שגיאה', 'לא ניתן למחוק מופע ללא ציון סיבת ביטול!');
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
                body: JSON.stringify({ cancellationReason: reason })
            });

            const data = await response.json();
            if (response.ok) {
                showPopup('הצלחה!', 'המופע בוטל והלקוחות זוכו בהצלחה!');
                loadDashboardData();
            } else {
                showPopup('שגיאה', data.error || 'שגיאה במחיקת המופע');
            }
        } catch (err) {
            console.error(err);
            showPopup('שגיאה', 'שגיאה בתקשורת עם השרת');
        }
    });
}

function editEvent(id) {
    window.location.href = `admin-event-form.html?id=${id}`;
}

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});

// פונקציה חכמה לחישוב סך כל הכרטיסים שנמכרו על בסיס נתיב המקומות התפוסים
async function calculateTotalSoldTickets() {
    try {
        const token = localStorage.getItem('token');
        
        // 1. שליפת כל המופעים כדי לקבל את ה-ID של כל אחד מהם
        const eventsResponse = await fetch(`${API_URL}/events`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!eventsResponse.ok) {
            throw new Error('שגיאה בטעינת המופעים');
        }

        const events = await eventsResponse.json();
        
        // 2. פנייה במקביל לכל ה-API-ים לקבלת המקומות התפוסים
        const fetchPromises = events.map(event => 
            fetch(`${API_URL}/tickets/event/${event._id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }).then(res => {
                if (!res.ok) return []; // במקרה של שגיאה באירוע ספציפי, נחזיר מערך ריק ולא נכשיל את הכל
                return res.json();
            })
        );

        // 3. הרצה במקביל והמתנה לכל התוצאות
        const allEventsTakenSeats = await Promise.all(fetchPromises);

        // 4. סכימת המקומות התפוסים מכל האירועים יחד
        let totalSoldTickets = 0;
        allEventsTakenSeats.forEach(seatsArray => {
            totalSoldTickets += seatsArray.length;
        });

        // 5. עדכון ה-HTML עם המספר הסופי (משתמש ב-ID המדויק מה-HTML שלך)
        const totalTicketsElement = document.getElementById('stat-tickets-sold');
        if (totalTicketsElement) {
            totalTicketsElement.textContent = totalSoldTickets;
        }

    } catch (error) {
        console.error('שגיאה בחישוב סך הכרטיסים:', error);
        const totalTicketsElement = document.getElementById('stat-tickets-sold');
        if (totalTicketsElement) {
            totalTicketsElement.textContent = 'שגיאה';
        }
    }
}