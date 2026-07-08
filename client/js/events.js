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
        const response = await fetch(`${API_URL}/${userId}`);
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

    // בדיקה אם יש תמונה, אם אין - נשים תמונת ברירת מחדל יפה
    const imageUrl = event.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=500';

    const card = document.createElement('div');
    card.className = 'event-card';
    card.innerHTML = `
        <div class="event-img-container">
            <img src="${imageUrl}" alt="${event.title}" class="event-img">
        </div>
        
        <div class="event-content">
            <h2 class="event-title">${event.title}</h2>
            <p class="event-artist">🎤 ${event.artist || 'אמן אורח'}</p>
            <p class="event-description">${event.description || 'אין תיאור זמין למופע זה.'}</p>
            
            <div class="event-meta">
                <span>📅 ${eventDate}</span>
                <span>📍 ${event.location || 'האולם הראשי'}</span>
            </div>
            
            <div class="event-footer">
                <p class="event-price">₪${event.price}</p>
                <button class="order-btn" onclick="goToSeatSelection('${event._id}')">להזמנת מקומות</button>
            </div>
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


// ========================================================
// 💳 לוגיקת ארנק דיגיטלי וחלון קופץ (Popup Modal)
// ========================================================

// האזנה לאלמנטים של החלון הקופץ לאחר שהדף נטען
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('topup-modal');
    const openBtn = document.getElementById('open-topup-btn');
    const closeBtn = document.querySelector('.close-modal');
    const topupForm = document.getElementById('topup-form');

    // 1. פתיחת החלון הקופץ בלחיצה על כפתור ההטענה
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            modal.style.display = 'block';
        });
    }

    // 2. סגירת החלון הקופץ בלחיצה על ה-X
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    // 3. סגירת החלון הקופץ בלחיצה מחוץ לכרטיסייה
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // 4. עדכון ראשוני של היתרה בריבוע הצידי
    updateWalletSidebar();

    // 5. טיפול בשליחת טופס ההטענה וביצוע הבדיקות
    if (topupForm) {
        topupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const amount = Number(document.getElementById('topup-amount').value);
            const cardNumber = document.getElementById('card-number').value.trim();
            const cardExpiry = document.getElementById('card-expiry').value; // פורמט שהדפדפן מחזיר: YYYY-MM
            const cardCvv = document.getElementById('card-cvv').value.trim();
            const userId = localStorage.getItem('userId');

            if (!userId) {
                alert('שגיאה: עליך להיות מחובר כדי לבצע הטענה.');
                return;
            }

            // בדיקה 1: סכום הטענה (מינימום 100 ₪, מקסימום 100,000 ₪)
            if (amount < 100 || amount > 100000) {
                alert('שגיאה: סכום ההטענה המותר הוא בין 100 ₪ ל-100,000 ₪ בלבד.');
                return;
            }

            // בדיקה 2: מספר אשראי (בדיוק 16 ספרות, רק מספרים)
            const isCardNumeric = /^\d+$/.test(cardNumber);
            if (cardNumber.length !== 16 || !isCardNumeric) {
                alert('שגיאה: מספר כרטיס אשראי חייב להכיל בדיוק 16 ספרות (מספרים בלבד).');
                return;
            }

            // בדיקה 3: תוקף הכרטיס (שלא יהיה קטן מהחודש הנוכחי של שנת 2026)
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth() + 1; // חודשים ב-JS רצים מ-0 עד 11

            const [expiryYear, expiryMonth] = cardExpiry.split('-').map(Number);

            if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
                alert('שגיאה: כרטיס האשראי פג תוקף! יש להשתמש בכרטיס בתוקף.');
                return;
            }

            // בדיקה 4: CVV (בדיוק 3 ספרות, רק מספרים)
            const isCvvNumeric = /^\d+$/.test(cardCvv);
            if (cardCvv.length !== 3 || !isCvvNumeric) {
                alert('שגיאה: קוד CVV חייב להכיל בדיוק 3 ספרות.');
                return;
            }

            // 🔥 הכל תקין! שולחים את הבקשה ל-PUT Route שיצרנו קודם בשרת
            try {
                const response = await fetch(`${API_URL}/${userId}/topup`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}` // שליחת טוקן האבטחה
                    },
                    body: JSON.stringify({ amount: amount })
                });

                if (response.ok) {
                    alert(`איזה יופי! הארנק הוטען בהצלחה ב- ₪${amount}`);
                    modal.style.display = 'none'; // סגירת החלון
                    topupForm.reset(); // איפוס השדות בטופס
                    
                    // עדכון היתרות בדף בזמן אמת בלי לרענן את כל האתר!
                    updateWalletSidebar();
                    if (typeof displayUserStatus === 'function') displayUserStatus();
                } else {
                    const errorData = await response.json();
                    alert(errorData.error || 'שגיאה בעדכון היתרה בשרת');
                }

            } catch (err) {
                console.error('שגיאה בתקשורת בהטענת הארנק:', err);
                alert('שגיאה בחיבור לשרת, אנא נסה שנית.');
            }
        });
    }
});

// פונקציה ייעודית למשיכת הנתון המעודכן ממונגו והצגתו בריבוע הצידי
async function updateWalletSidebar() {
    const userId = localStorage.getItem('userId');
    const walletStatusElement = document.getElementById('user-wallet-status');
    const openBtn = document.getElementById('open-topup-btn');
    
    if (!userId) {
        if (walletStatusElement) walletStatusElement.innerHTML = 'התחבר כדי לצפות בארנק הדיגיטלי';
        if (openBtn) openBtn.style.display = 'none';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${userId}`);
        if (response.ok) {
            const userData = await response.json();
            if (walletStatusElement) {
                walletStatusElement.innerHTML = `היתרה העדכנית שלך היא: <br><span class="wallet-balance-amount">₪${userData.walletBalance}</span>`;
            }
            if (openBtn) openBtn.style.display = 'block';
        }
    } catch (err) {
        console.error('שגיאה בשליפת יתרת ארנק לריבוע הצידי:', err);
    }
}