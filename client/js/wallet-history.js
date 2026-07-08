const API_URL = 'http://localhost:4000';

document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    if (!userId || !token) {
        alert('עליך להיות מחובר כדי לצפות בדף זה.');
        window.location.href = 'login.html';
        return;
    }

    // מפעילים את שתי הפונקציות במקביל
    fetchAndDisplayUserBalance(userId, token);
    fetchAndDisplayHistory(userId, token);
});

// 1. משיכת היתרה הנוכחית של המשתמש מהשרת
async function fetchAndDisplayUserBalance(userId, token) {
    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const userData = await response.json();
            document.getElementById('total-balance').innerText = `₪${userData.walletBalance.toLocaleString()}`;
        }
    } catch (err) {
        console.error('שגיאה בטעינת יתרת המשתמש:', err);
    }
}

// 2. משיכת היסטוריית הפעולות מה-API החדש ועיבוד הדף
async function fetchAndDisplayHistory(userId, token) {
    const rowsContainer = document.getElementById('transaction-rows');
    
    try {
        const response = await fetch(`${API_URL}/transactions/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            rowsContainer.innerHTML = `<tr><td colspan="4" class="error-text">שגיאה בטעינת נתוני העו"ש מהשרת.</td></tr>`;
            return;
        }

        const transactions = await response.json();
        rowsContainer.innerHTML = ''; // ניקוי שורת הטעינה

        if (transactions.length === 0) {
            rowsContainer.innerHTML = `<tr><td colspan="4" class="empty-text">אין עדיין פעולות מתועדות בחשבון זה.</td></tr>`;
            return;
        }

        let totalIncome = 0;
        let totalExpense = 0;

        // רצים על התנועות ומייצרים שורות בטבלה
        transactions.forEach(tx => {
            // עיצוב תאריך נוח בעברית (יום.חודש.שנה, שעה)
            const txDate = new Date(tx.createdAt).toLocaleDateString('he-IL', {
                year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
            });

            // הגדרת משתנים דינמיים לפי סוג התנועה (הכנסה/הוצאה)
            let typeText = '';
            let amountText = '';
            let className = '';

            if (tx.type === 'deposit') {
                typeText = '💰 טעינה';
                amountText = `+₪${tx.amount.toLocaleString()}`;
                className = 'income-row';
                totalIncome += tx.amount;
            } else if (tx.type === 'refund') {
                typeText = '🔄 זיכוי אירוע';
                amountText = `+₪${tx.amount.toLocaleString()}`;
                className = 'income-row';
                totalIncome += tx.amount;
            } else if (tx.type === 'purchase') {
                typeText = '🎟️ רכישת כרטיס';
                amountText = `-₪${tx.amount.toLocaleString()}`;
                className = 'expense-row';
                totalExpense += tx.amount;
            }

            // יצירת שורת ה-HTML
            const row = document.createElement('tr');
            row.className = className;
            row.innerHTML = `
                <td>${txDate}</td>
                <td class="tx-desc">${tx.description}</td>
                <td>${typeText}</td>
                <td class="tx-amount">${amountText}</td>
            `;
            rowsContainer.appendChild(row);
        });

        // עדכון כרטיסיות הסיכום העליונות
        document.getElementById('total-income').innerText = `₪${totalIncome.toLocaleString()}`;
        document.getElementById('total-expense').innerText = `₪${totalExpense.toLocaleString()}`;

    } catch (err) {
        console.error('שגיאה בעיבוד עו"ש:', err);
        rowsContainer.innerHTML = `<tr><td colspan="4" class="error-text">שגיאה בתקשורת עם השרת.</td></tr>`;
    }
}