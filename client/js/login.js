const API_URL = 'http://localhost:4000';

// --------------------------------------------------------
// 1. ניהול מצבי תצוגה של המודאל (אורח / חסימה)
// --------------------------------------------------------
const authModal = document.getElementById('dynamic-auth-modal');
const loginSubView = document.getElementById('login-sub-view');
const registerSubView = document.getElementById('register-sub-view');
const infoTitle = document.getElementById('modal-info-title');
const infoText = document.getElementById('modal-info-text');

// פתיחת המודאל במצב מסוים
function openAuthModal(viewType) {
    if (!authModal) return;
    authModal.style.display = 'flex';
    switchAuthView(viewType);
}

// סגירת המודאל
function closeAuthModal() {
    if (!authModal) return;
    authModal.style.display = 'none';
}

// מעבר בין תתי-טפסים בתוך המודאל בצורה חלקה
function switchAuthView(viewType) {
    if (viewType === 'register') {
        loginSubView.style.display = 'none';
        registerSubView.style.display = 'block';
    } else {
        loginSubView.style.display = 'block';
        registerSubView.style.display = 'none';
    }
}

// פונקציית היירט החכמה: מופעלת כשאורח לוחץ על הופעה!
function handleEventClick(eventName) {
    const token = localStorage.getItem('token');
    
    // אם הוא כבר מחובר, נעביר אותו ישר לדף האירועים המלא לבחירת מקום
    if (token) {
        window.location.href = 'events.html';
        return;
    }
    
    // אם הוא אורח - נשנה את תוכן הטקסט במודאל כדי שיהיה מותאם אישית ומקצועי, ונפתח אותו!
    if (infoTitle && infoText) {
        infoTitle.innerHTML = `רוצים להזמין מקום ל-${eventName}?`;
        infoText.innerHTML = "כדי לבצע הזמנות, לשריין כרטיסים באולם ולנהל את הארנק הדיגיטלי שלך, יש להתחבר לחשבון או להירשם תוך שניות.";
    }
    
    openAuthModal('login');
}


// --------------------------------------------------------
// א. לוגיקת התחברות (Login) - מבוסס על הבסיס שלך
// --------------------------------------------------------
const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch(`${API_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.user._id);
                localStorage.setItem('userName', data.user.fullName);
                localStorage.setItem('userRole', data.user.role); 

                alert(`ברוך הבא, ${data.user.fullName}!`);
                closeAuthModal();
                
                if (data.user.role === 'admin') {
                    window.location.href = 'admin-dashboard.html'; 
                } else {
                    window.location.href = 'events.html'; 
                }
            } else {
                alert(data.error || 'שגיאה בהתחברות');
            }
        } catch (err) {
            console.error('שגיאה:', err);
            alert('לא ניתן להתחבר לשרת. ודאו שהשרת שלכן מופעל ב-VS Code!');
        }
    });
}

// --------------------------------------------------------
// ב. לוגיקת הרשמה (Register) - מבוסס על הבסיס שלך
// --------------------------------------------------------
const registerForm = document.getElementById('register-form');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullName = document.getElementById('reg-name').value;
        const phone = document.getElementById('reg-phone').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        try {
            const response = await fetch(`${API_URL}/users/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, phone, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert('נרשמת בהצלחה למערכת! הארנק הדיגיטלי שלך נוצר עם יתרה של ₪0. כעת ניתן להתחבר.');
                
                registerForm.reset();
                switchAuthView('login'); // מעביר אותו אוטומטית למסך לוגין לאחר רישום
                
                const loginEmailInput = document.getElementById('email');
                if (loginEmailInput) loginEmailInput.value = email;
            } else {
                alert(data.error || 'שגיאה בתהליך ההרשמה');
            }
        } catch (err) {
            console.error('שגיאה:', err);
            alert('שגיאה בתקשורת עם השרת בזמן ההרשמה');
        }
    });
}

// --------------------------------------------------------
// ג. טעינת מופעים דינמית מה-Database לדף הנחיתה
// --------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // מפעיל את טעינת המופעים רק אם אנחנו בדף הנחיתה שכולל את הגריד
    const eventsGrid = document.getElementById('dynamic-events-grid');
    if (eventsGrid) {
        fetchAndDisplayEvents(eventsGrid);
    }
});

async function fetchAndDisplayEvents(eventsGrid) {
    try {
        // פנייה לנתיב השרת שלך שמחזיר את כל המופעים (עדכני לפי הראוטר המדויק שלך, למשל /events)
        const response = await fetch(`${API_URL}/events`); 
        const events = await response.json();
console.log("זה מה שהשרת מחזיר:", events);
if (events.length === 0) {
    eventsGrid.innerHTML = '<div class="loading-status">אין מופעים זמינים כרגע...</div>';
    return;
}
        if (!response.ok) {
            throw new Error(events.error || 'שגיאה בטעינת המופעים');
        }

        // אם אין מופעים בבסיס הנתונים
        if (events.length === 0) {
            eventsGrid.innerHTML = '<div class="loading-status">אין מופעים זמינים כרגע. נסו שוב מאוחר יותר!</div>';
            return;
        }

        // ניקוי הודעת הטעינה
        eventsGrid.innerHTML = '';

        // ריצה על המופעים ובניית ה-HTML עבור כל כרטיס קטלוגי
        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'event-catalog-card';
            
            // הגדרת לחיצה על הכרטיס שתפעיל את הבדיקה החכמה (אם הוא אורח או רשום)
            card.onclick = () => handleEventClick(event.title || event.name);

            // תמונת ברירת מחדל אם אין תמונה ייעודית ב-DB
            const eventImage = event.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=500&auto=format&fit=crop';
            
            // עיצוב מחיר עגול או מותאם
            const price = event.price ? `₪${event.price}` : 'חינם';
            
            // פורמט תאריך קריא
            const eventDate = event.date ? new Date(event.date).toLocaleDateString('he-IL') : 'תאריך יפורסם בהמשך';

            card.innerHTML = `
                <div class="card-image-wrapper">
                    <img src="${eventImage}" alt="${event.title || event.name}" class="catalog-event-img">
                </div>
                <div class="card-content-area" style="padding: 20px; text-align: right;">
                    <h3 style="margin: 0 0 10px 0; font-size: 1.3rem; color: #0f172a;">${event.title || event.name}</h3>
                    <p style="margin: 0 0 15px 0; color: #64748b; font-size: 0.95rem;">📆 ${eventDate}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                        <span style="font-weight: bold; color: #4f46e5; font-size: 1.2rem;">${price}</span>
                        <button class="buy-ticket-btn" style="width: auto; margin-top: 0; padding: 8px 16px;">להזמנת מקום</button>
                    </div>
                </div>
            `;
            
            eventsGrid.appendChild(card);
        });

    } catch (err) {
        console.error('שגיאה בהבאת המופעים:', err);
        eventsGrid.innerHTML = '<div class="loading-status" style="color: #ef4444;">שגיאה בתקשורת עם השרת בזמן טעינת המופעים.</div>';
    }
}
async function fetchAndDisplayEvents() {
    try {
        const response = await fetch(`${API_URL}/events`);
        const events = await response.json();
        const eventsGrid = document.getElementById('dynamic-events-grid'); // זה האזור של הרשימה

        // 1. טיפול במופע המרכזי (כפי שעשינו)
        const today = new Date();
        const upcomingEvents = events
            .filter(event => new Date(event.date) >= today)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (upcomingEvents.length > 0) {
            displayFeaturedEvent(upcomingEvents[0]);
        }

        // 2. הזרקת שאר המופעים לגריד (החלק שהיה חסר)
        if (eventsGrid) {
            eventsGrid.innerHTML = ''; // מנקים את מה שהיה שם קודם
            
            events.forEach(event => {
                const eventCard = document.createElement('div');
                eventCard.className = 'event-catalog-card';
                eventCard.innerHTML = `
                    <h3>${event.title}</h3>
                   <img src="${event.image || 'upload/default-event.jpg'}" 
                     alt="${event.title}" 
                     class="event-img">
                    <p>תאריך: ${new Date(event.date).toLocaleDateString('he-IL')}</p>
                    <p>מחיר: ${event.price} ₪</p>
                    <button class="cta-btn" onclick="handleEventClick('${event.title}')">לשריין מקום</button>
                `;
                eventsGrid.appendChild(eventCard);
            });
        }
    } catch (err) {
        console.error("שגיאה בטעינת המופעים:", err);
    }
}

function displayFeaturedEvent(event) {
    const featuredSection = document.getElementById('featured-event-container');
    if (!featuredSection) return;

    const eventDate = new Date(event.date).toLocaleDateString('he-IL');
    
    featuredSection.innerHTML = `
<div class="featured-card">
            <div class="featured-content">
                <span class="badge">ההופעה הקרובה ביותר</span>
                <h2>${event.title}</h2>
                <img src="${event.image || 'upload/default-event.jpg'}" 
                     alt="${event.title}" 
                     class="featured-event-img">
                <p>אל תחמיצו את האירוע הקרוב בתאריך ה-${eventDate}. המקומות אוזלים מהר.</p>
                <button class="cta-btn" onclick="handleEventClick('${event.title}')">שריינו מקום עכשיו</button>
            </div>
        </div>
    `;
}
const cursor = document.querySelector('.cursor-glow');

// מעקב אחרי העכבר
document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

// שינוי צבע בלחיצה
document.addEventListener('mousedown', () => cursor.classList.add('active'));
document.addEventListener('mouseup', () => cursor.classList.remove('active'));

// זיהוי מעבר מעל כפתורים או כרטיסים
const interactiveElements = document.querySelectorAll('button, .event-catalog-card');

interactiveElements.forEach(el => {
    el.addEventListener('mouseover', () => cursor.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
});