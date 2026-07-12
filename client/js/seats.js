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
        alert('משתמש לא מחובר! אנא התחבר מחדש.');
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
            
            document.getElementById('user-name-display').innerText = `משתמש: ${userData.fullName || userData.username}`;
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
        // מביאים קודם כל את המקומות התפוסים מהנתיב הייעודי של הכרטיסים
        const seatsResponse = await fetch(`${API_URL}/tickets/event/${eventId}`);
        if (seatsResponse.ok) {
            occupiedSeats = await seatsResponse.json(); 
        }

        // מביאים את פרטי המופע (כמו מחיר וכותרת)
        const eventResponse = await fetch(`${API_URL}/events/${eventId}`);
        if (eventResponse.ok) {
            const currentEvent = await eventResponse.json();
            
            document.getElementById('event-title-display').innerText = `${currentEvent.title} - בחירת מקומות`;
            eventPrice = currentEvent.price;
            
            generateHallGrid();
        }
    } catch (err) {
        console.error('שגיאה במשיכת נתוני מופע ומושבים מהשרת:', err);
    }
}

// 3. רינדור האולם על בסיס המושבים התפוסים ב-DB (משולב עם הבדיקה החכמה)
// 3. רינדור האולם על בסיס המושבים התפוסים ב-DB
function generateHallGrid() {
    const gridContainer = document.getElementById('seating-grid');
    gridContainer.innerHTML = ''; 

    const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

    for (let i = 0; i < TOTAL_ROWS; i++) {
        const rowLetter = rowLetters[i];
        const rowNumber = i + 1; // המרה מ-A,B,C למספרים 1,2,3 בשביל השרת
        
        const rowElement = document.createElement('div');
        rowElement.className = 'seat-row';

        const rightLabel = document.createElement('div');
        rightLabel.className = 'row-label';
        rightLabel.innerText = rowLetter;
        rowElement.appendChild(rightLabel);

        for (let seatNum = 1; seatNum <= SEATS_PER_ROW; seatNum++) {
            const seatId = `${rowLetter}-${seatNum}`;
            
            const seat = document.createElement('div');
            seat.className = 'seat';
            seat.id = seatId; 
            seat.id = seatId; // הוספת מזהה ייחודי לאלמנט
            
            const cushion = document.createElement('div');
            cushion.className = 'seat-cushion';
            seat.appendChild(cushion);

            // ✨ הבדיקה המשולבת והחכמה של חברה שלך - מונעת שגיאות סוגי נתונים מה-DB
            // בודק התאמה גם לפי אות וגם לפי מספר שורה
            const isOccupied = occupiedSeats.some(os => {
                if (typeof os === 'string') {
                    return os === seatId || os === `${rowNumber}-${seatNum}`;
                } else if (os && typeof os === 'object') {
                    return (os.row === rowLetter || os.row === rowNumber) && (os.column === seatNum || os.num === seatNum);
                }
                return false;
            });

            if (isOccupied) {
                seat.classList.add('occupied'); 
            }  else {
                seat.classList.add('available'); // נשאר פנוי
                seat.addEventListener('click', () => handleSeatClick(seat, seatId, rowNumber, seatNum));
            }

            rowElement.appendChild(seat);
        }

        gridContainer.appendChild(rowElement);
    }
}

// 4. ניהול לחיצות ובדיקת חוקים
function handleSeatClick(seatElement, seatId, rowNumber, seatNum) {
    if (seatElement.classList.contains('occupied')) {
        return;
    }
    if (seatElement.classList.contains('selected')) {
        seatElement.classList.remove('selected');
        selectedSeats = selectedSeats.filter(s => s.id !== seatId);
    } else {
        if (selectedSeats.length >= 5) {
            alert('לא ניתן לבחור יותר מ-5 מושבים לרכישה אחת.');
            return;
        }

        seatElement.classList.add('selected');
        // שומרים את האות ואת המספר הסידורי של השורה עבור השרת והלוגיקה
        // שומרים את הנתונים הרלוונטיים עבור השרת והתצוגה
        selectedSeats.push({ 
            id: seatId, 
            row: rowNumber, 
            rowLetter: seatId.split('-')[0], 
            num: seatNum, 
            element: seatElement 
        });
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

// 5. רכישה מול הקונטרולר המרכזי שמנפק מיילים ומעדכן עו"ש בפעולה אחת

document.getElementById('checkout-button').addEventListener('click', async () => {
    const userId = localStorage.getItem('userId');
    const eventId = localStorage.getItem('currentEventId');
    const token = localStorage.getItem('token');
    const totalPrice = selectedSeats.length * eventPrice;

    if (userWalletBalance < totalPrice) {
        alert(`הרכישה נכשלה. אין מספיק כסף בארנק.\nעלות: ₪${totalPrice}\nברשותך: ₪${userWalletBalance}`);
        return;
    }

    // בדיקת חוק הכיסא הבודד בקצוות השורה
    for (let seat of selectedSeats) {
        if (seat.num === 2) {
            const neighbor1 = document.getElementById(`${seat.rowLetter}-1`);
            if (neighbor1 && neighbor1.classList.contains('available') && !neighbor1.classList.contains('selected')) {
                alert(`חוק המקומות המבודדים: לא ניתן להשאיר את כיסא 1 בשורה ${seat.rowLetter} בודד.`);
                return;
            }
        }
        if (seat.num === (SEATS_PER_ROW - 1)) {
            const neighborMax = document.getElementById(`${seat.rowLetter}-${SEATS_PER_ROW}`);
            if (neighborMax && neighborMax.classList.contains('available') && !neighborMax.classList.contains('selected')) {
                alert(`חוק המקומות המבודדים: לא ניתן להשאיר את כיסא ${SEATS_PER_ROW} בשורה ${seat.rowLetter} בודד.`);
                return;
            }
        }
    }

    // שליחת בקשות מסודרות לשרת
    // שליחת בקשה לשרת עבור כל כיסא שנבחר
    try {
        let successCount = 0;
        let lastWalletBalance = userWalletBalance;

        for (let seat of selectedSeats) {
            const response = await fetch(`${API_URL}/tickets/book`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    eventId: eventId,
                    userId: userId,
                    row: seat.row,     // מספר השורה (1-6)
                    column: seat.num   // מספר הכיסא (1-12)
                })
            });

            const data = await response.json();

            if (response.ok) {
                successCount++;
                lastWalletBalance = data.newWalletBalance;
                
                // עדכון ויזואלי לתפוס קבוע
                seat.element.classList.remove('selected');
                seat.element.classList.add('occupied');
            } else {
                alert(`שגיאה ברכישת כיסא ${seat.id}: ${data.error}`);
            }
        }

        if (successCount > 0) {
            alert(`🎉 כל הכרטיסים (${successCount}) נרכשו בהצלחה!\nאישורי הגעה וקודי הכניסה נשלחו אליך למייל ברגע זה.`);
            
            // עדכון יתרת הארנק החדשה שחזרה מהשרת
            userWalletBalance = lastWalletBalance;
            document.getElementById('user-wallet-display').innerText = `יתרה בארנק: ₪${userWalletBalance}`;
            
            // איפוס בחירה
            selectedSeats = [];
            updateCheckoutSummary();
        }

    } catch (err) {
        console.error('שגיאה בתקשורת עם השרת:', err);
        alert('לא ניתן היה להשלים את הרכישה בשרת.');
    }
});