const API_URL = 'http://localhost:4000';

document.addEventListener('DOMContentLoaded', () => {
    const eventsGrid = document.getElementById('dynamic-events-grid');
    if (eventsGrid) fetchAndDisplayEvents();
});

async function fetchAndDisplayEvents() {
  console.log("מנסה לפנות לשרת...");
    try {
        const response = await fetch(`${API_URL}/events`);
        console.log("תגובה מהשרת התקבלה:", response);      
        const events = await response.json();
        console.log("אירועים שהושלמו:", events);

        // טעינת אירוע ראשי ורשימת אירועים
        const today = new Date();
        const upcoming = events.filter(e => new Date(e.date) >= today);
        
        if (upcoming.length > 0) displayFeaturedEvent(upcoming[0]);

        const eventsGrid = document.getElementById('dynamic-events-grid');
        if (eventsGrid) {
            eventsGrid.innerHTML = '';
            events.forEach(event => {
                const card = document.createElement('div');
                card.className = 'event-catalog-card';
                card.innerHTML = `<h3>${event.title}</h3><button class="cta-btn" onclick="goToLogin()">שריין</button>`;
                eventsGrid.appendChild(card);
            });
        }
    } catch (err) { console.error("שגיאה בטעינת המופעים:", err); }
}
function displayFeaturedEvent(event) {
    const featuredSection = document.getElementById('featured-event-container');
    if (!featuredSection) return; // אם אין אזור כזה בדף, הפונקציה תעצור בשקט

    const eventDate = new Date(event.date).toLocaleDateString('he-IL');
    
    featuredSection.innerHTML = `
        <div class="featured-card">
            <div class="featured-content">
                <span class="badge">ההופעה הקרובה ביותר</span>
                <h2>${event.title}</h2>
                <img src="${event.image || 'upload/default-event.jpg'}" alt="${event.title}" class="featured-event-img">
                <p>אל תחמיצו את האירוע הקרוב בתאריך ה-${eventDate}. המקומות אוזלים מהר.</p>
                <button class="cta-btn" onclick="goToLogin()">שריינו מקום עכשיו</button>
            </div>
        </div>
    `;
}
// לוגיקת הסמן הזוהר
const cursor = document.querySelector('.cursor-glow');
if (cursor) {
    document.addEventListener('mousemove', (e) => {
        requestAnimationFrame(() => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });
    });
}

// function handleEventClick(eventName) {
//     if (localStorage.getItem('token')) {
//         window.location.href = 'events.html';
//     } else {
//         window.location.href = 'login.html';
//     }
// }
function goToLogin() {
    window.location.href = 'login.html';
}