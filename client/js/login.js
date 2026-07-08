// הכתובת המלאה של שרת ה-Backend שלך
const API_URL = 'http://localhost:4000';

// --------------------------------------------------------
// א. לוגיקת התחברות (Login)
// --------------------------------------------------------
const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // מונע מהעמוד להתרענן אוטומטית

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch(`${API_URL}/users/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // שמירת הנתונים והטוקן בזיכרון של הדפדפן (localStorage)
                localStorage.setItem('token', data.token);
                localStorage.setItem('userId', data.user._id);
                localStorage.setItem('userName', data.user.fullName);
                localStorage.setItem('userRole', data.user.role); 

                alert(`ברוך הבא, ${data.user.fullName}!`);
                
                // העברה לעמוד הבא
                window.location.href = 'events.html'; 
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
// ב. לוגיקת הרשמה (Register)
// --------------------------------------------------------
const registerForm = document.getElementById('register-form');
const modalToggle = document.getElementById('modal-toggle');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // מונע מהעמוד להתרענן אוטומטית

        const fullName = document.getElementById('reg-name').value;
        const phone = document.getElementById('reg-phone').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        try {
            const response = await fetch(`${API_URL}/users/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fullName, phone, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                alert('נרשמת בהצלחה למערכת! הארנק הדיגיטלי שלך נוצר עם יתרה של ₪0. כעת ניתן להתחבר.');
                
                // מנקים את השדות וסוגרים את הפופ-אפ
                registerForm.reset();
                if (modalToggle) modalToggle.checked = false; 
                
                // מזינים אוטומטית את האימייל החדש בשדה ההתחברות
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