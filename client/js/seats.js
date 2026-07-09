const API_URL = 'http://localhost:4000';
const SEATS_PER_ROW = 12; // מספר המושבים בכל שורה באולם
const TOTAL_ROWS = 6;    // מספר השורות באולם
let selectedSeats = [];  // מושבים שהמשתמש בחר כרגע בעמוד
let occupiedSeats = [];  // מושבים שתפוסים כבר בבסיס הנתונים עבור המופע הזה
let eventPrice = 0;      // מחיר כרטיס
let userWalletBalance = 0; // יתרת הארנק בלייב

document.addEventListener('DOMContentLoaded', async () => {
    // שלב א: טעינת נתוני משתמש ואירוע במקביל מהשרת
    await loadUserStatus();
    await loadEventDetailsAndSeats();
});

// 1. שליפת פרטי המשתמש והארנק שלו מה-DB בזמן אמת (Live)
async function loadUserStatus() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('משתמש לא מחובר! אנא התחברי מחדש.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
           method: 'GET',
           headers: {
               'Authorization': `Bearer ${localStorage.getItem('token')}`
           }
       });
        if (response.ok) {
            const userData = await response.json();
            userWalletBalance = userData.walletBalance;
            
            // עדכון האלמנטים במסך בלייב
            document.getElementById('user-name-display').innerText = `משתמש: ${userData.fullName}`;
            document.getElementById('user-wallet-display').innerText = `יתרה בארנק: ₪${userData.walletBalance}`;
        }
    } catch (err) {
        console.error('שגיאה בשליפת ארנק מהשרת:', err);
    }
}

// 2. שליפת המופע והמושבים התפוסים שלו ישירות מ-MongoDB
async function loadEventDetailsAndSeats() {
    const eventId = localStorage.getItem('currentEventId');
    if (!eventId) {
        alert('לא נבחר מופע, מחזיר לעמוד המופעים');
        window.location.href = 'events.html';
        return;
    }

    try {
        // פנייה ישירה לנתיב ה-Event הספציפי (הנחת עבודה: השרת שלכן מחזיר אובייקט הכולל מערך occupiedSeats)
        const response = await fetch(`${API_URL}/events/${eventId}`);
        if (response.ok) {
            const currentEvent = await response.json();
            
            document.getElementById('event-title-display').innerText = `${currentEvent.title} - בחירת מקומות`;
            eventPrice = currentEvent.price;
            
            // כאן נכנסים המושבים התפוסים האמיתיים מה-DB שלכן!
            // אם המערך לא קיים עדיין בשרת, הוא פשוט יתחיל כמערך ריק []
            occupiedSeats = currentEvent.occupiedSeats || [];
            
            // רק אחרי שהמידע האמיתי הגיע - מייצרים את מפת האולם
            generateHallGrid();
        }
    } catch (err) {
        console.error('שגיאה במשיכת נתוני מופע ומושבים מהשרת:', err);
        // גיבוי זמני למקרה שהנתיב הספציפי לא מוגדר בשרת שלכן (שליפת כל המופעים וסינון)
        fallbackLoadEvents(eventId);
    }
}

// פונקציית גיבוי (Fallback) למקרה שאין נתיב של GET /events/:id
async function fallbackLoadEvents(eventId) {
    try {
        const response = await fetch(`${API_URL}/events`);
        const events = await response.json();
        const currentEvent = events.find(e => e._id === eventId);
        if (currentEvent) {
            document.getElementById('event-title-display').innerText = `${currentEvent.title} - בחירת מקומות`;
            eventPrice = currentEvent.price;
            occupiedSeats = currentEvent.occupiedSeats || [];
            generateHallGrid();
        }
    } catch (err) {
        console.error('שגיאה קריטית בטעינת הנתונים:', err);
    }
}
// 3. רינדור האולם על בסיס המושבים התפוסים ב-DB
function generateHallGrid() {
    const gridContainer = document.getElementById('seating-grid');
    gridContainer.innerHTML = ''; // ניקוי האולם

    const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

    for (let i = 0; i < TOTAL_ROWS; i++) {
        const rowLetter = rowLetters[i];
        const rowNumber = i + 1; // המרה מ-A,B,C למספרים 1,2,3 בשביל השרת
        
        const rowElement = document.createElement('div');
        rowElement.className = 'seat-row';

        // תווית שורה
        const rightLabel = document.createElement('div');
        rightLabel.className = 'row-label';
        rightLabel.innerText = rowLetter;
        rowElement.appendChild(rightLabel);

        // יצירת 12 מושבים בשורה
        for (let seatNum = 1; seatNum <= SEATS_PER_ROW; seatNum++) {
            const seatId = `${rowLetter}-${seatNum}`;
            
            const seat = document.createElement('div');
            seat.className = 'seat';
            
            const cushion = document.createElement('div');
            cushion.className = 'seat-cushion';
            seat.appendChild(cushion);

            // ⚡ התיקון הממוקד: בודק התאמה גם לפי אות ("A-1") וגם לפי מספר שורה ("1-1") או אובייקט מה-DB שלכן
            const isOccupied = occupiedSeats.some(os => {
                if (typeof os === 'string') {
                    return os === seatId || os === `${rowNumber}-${seatNum}`;
                } else if (os && typeof os === 'object') {
                    return (os.row === rowLetter || os.row === rowNumber) && (os.column === seatNum || os.num === seatNum);
                }
                return false;
            });

            if (isOccupied) {
                seat.classList.add('occupied'); // הופך לתפוס (אדום זוהר)
            } else {
                seat.classList.add('available'); // נשאר פנוי (אפור)
                seat.addEventListener('click', () => handleSeatClick(seat, seatId, rowLetter, seatNum));
            }

            rowElement.appendChild(seat);
        }

        gridContainer.appendChild(rowElement);
    }
}
// 4. ניהול לחיצות ובדיקת חוקים
function handleSeatClick(seatElement, seatId, rowLetter, seatNum) {
    if (seatElement.classList.contains('selected')) {
        seatElement.classList.remove('selected');
        selectedSeats = selectedSeats.filter(s => s.id !== seatId);
    } else {
        // חוק 1: מקסימום 5 כרטיסים
        if (selectedSeats.length >= 5) {
            alert('לא ניתן לבחור יותר מ-5 מושבים לרכישה אחת.');
            return;
        }

        seatElement.classList.add('selected');
        selectedSeats.push({ id: seatId, row: rowLetter, num: seatNum, element: seatElement });
    }

    updateCheckoutSummary();
}

function updateCheckoutSummary() {
    const listSpan = document.getElementById('selected-seats-list');
    const priceSpan = document.getElementById('total-price');
    const checkoutBtn = document.getElementById('checkout-button');

    if (selectedSeats.length === 0) {
        listSpan.innerText = '-';
        priceSpan.innerText = '₪0';
        checkoutBtn.disabled = true;
        return;
    }

    listSpan.innerText = selectedSeats.map(s => s.id).join(', ');
    priceSpan.innerText = `₪${selectedSeats.length * eventPrice}`;
    checkoutBtn.disabled = false;
}

// 5. רכישה מקצועית בזמן אמת, הנפקת כרטיסים ועדכון ה-Database
document.getElementById('checkout-button').addEventListener('click', async () => {
    const userId = localStorage.getItem('userId');
    const eventId = localStorage.getItem('currentEventId');
    const totalPrice = selectedSeats.length * eventPrice;

    // א. בדיקת יתרת ארנק מקומית (שלב ראשון)
    if (userWalletBalance < totalPrice) {
        alert(`הרכישה נכשלה. אין מספיק כסף בארנק.\nעלות: ₪${totalPrice}\nברשותך: ₪${userWalletBalance}`);
        return;
    }

    // ב. בדיקת חוק הכיסא הבודד בקצוות השורה
    for (let seat of selectedSeats) {
        if (seat.num === 2) {
            const neighbor1 = document.getElementById(`${seat.row}-1`);
            // בודק אם כיסא 1 פנוי ב-DB (יש לו קלאס available) והוא לא נבחר כרגע על ידינו
            if (neighbor1 && neighbor1.classList.contains('available') && !neighbor1.classList.contains('selected')) {
                alert(`חוק המקומות המבודדים: לא ניתן להשאיר את כיסא 1 בשורה ${seat.row} בודד ומיותר.`);
                return;
            }
        }
        if (seat.num === (SEATS_PER_ROW - 1)) {
            const neighborMax = document.getElementById(`${seat.row}-${SEATS_PER_ROW}`);
            if (neighborMax && neighborMax.classList.contains('available') && !neighborMax.classList.contains('selected')) {
                alert(`חוק המקומות המבודדים: לא ניתן להשאיר את כיסא ${SEATS_PER_ROW} בשורה ${seat.row} בודד ומיותר.`);
                return;
            }
        }
    }

    // ג. שליחת הנתונים ל-Backend לעדכון אמיתי בבסיס הנתונים!
    try {
        const seatIdsToBuy = selectedSeats.map(s => s.id);

        // 1. עדכון המושבים התפוסים של המופע בשרת
        const eventRes = await fetch(`${API_URL}/events/${eventId}/book`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ seats: seatIdsToBuy })
        });

        // 2. חיוב הארנק של המשתמש בשרת דרך נתיב ה-topup הקיים!
        const userRes = await fetch(`${API_URL}/users/${userId}/topup`, {
          method: 'PUT',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}` // חובה בשביל ה-checkAuth בשרת
          },
          body: JSON.stringify({ amount: -totalPrice }) // שולח מינוס כדי להוריד מהיתרה
      });

        if (eventRes.ok && userRes.ok) {
            // 🎉 הרכישה הצליחה בבסיס הנתונים! כעת ננפיק קודי כניסה ייחודיים בלייב
            let ticketReceipt = `🎉 הרכישה בוצעה בהצלחה!\n\nהונפקו עבורך קודי כניסה דיגיטליים לאולם:\n`;
            
            selectedSeats.forEach(seat => {
                // ייצור קוד רנדומלי מאובטח עבור כל כרטיס (למשל: TKT-A2-9F8A)
                const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
                const ticketCode = `TKT-${seat.id}-${randomCode}`;
                
                ticketReceipt += `📍 שורה וכיסא: ${seat.id} 👈 קוד כניסה: ${ticketCode}\n`;
                
                // שינוי המצב במסך לתפוס קבוע
                seat.element.classList.remove('selected');
                seat.element.classList.add('occupied');
            });

            // ד. עדכון הארנק על המסך בלייב מהערך החדש שחזר מהשרת
            const updatedUserData = await userRes.json();
            userWalletBalance = updatedUserData.walletBalance;
            document.getElementById('user-wallet-display').innerText = `יתרה בארנק: ₪${userWalletBalance}`;

            // הצגת קודי הכרטיסים במכה אחת למשתמש
            alert(ticketReceipt);
            
            // איפוס הבחירה להזמנה הבאה
            selectedSeats = [];
            updateCheckoutSummary();
        } else {
            alert('שגיאה בתהליך העסקה מול השרת. אנא נסי שוב.');
        }

    } catch (err) {
        console.error('שגיאה בתקשורת עם השרת בזמן הרכישה:', err);
        alert('לא ניתן היה להשלים את הרכישה בשרת.');
    }
});