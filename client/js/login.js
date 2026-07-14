const API_URL = 'http://localhost:4000';

// 1. לוגיקת התחברות (Login)
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

                if (data.user.role === 'admin') {
                    window.location.href = 'admin-dashboard.html'; 
                } else {
                    window.location.href = 'events.html'; 
                }
            } else {
                showPopup('שגיאה בהתחברות', data.error || 'פרטי התחברות שגויים');
            }
        } catch (err) {
            showPopup('שגיאה', 'לא ניתן להתחבר לשרת');
        }
    });
}

// 2. לוגיקת הרשמה (Register)
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
                showPopup('הצלחה!', 'נרשמת בהצלחה! כעת ניתן להתחבר.');
                registerForm.reset();
                // סגירת המודאל ע"י ביטול הצ'קבוקס
                document.getElementById('modal-toggle').checked = false;
            } else {
                showPopup('שגיאה ברישום', data.error || 'שגיאה בתהליך ההרשמה');
            }
        } catch (err) {
            showPopup('שגיאה', 'שגיאה בתקשורת עם השרת');
        }
    });
}

// 3. פונקציות עזר לפופ-אפ (Generic Popup)
function showPopup(title, message) {
    const popup = document.getElementById('generic-popup');
    document.getElementById('popup-title').innerText = title;
    document.getElementById('popup-message').innerText = message;
    popup.style.display = 'flex';
}

function closeGenericPopup() {
    document.getElementById('generic-popup').style.display = 'none';
}