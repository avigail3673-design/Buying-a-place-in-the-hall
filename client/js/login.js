 // הכתובת הבסיסית של השרת שלכן (שנו את ה-4000 אם השרת שלכן רץ על פורט אחר)
        const API_URL = 'http://localhost:4000';

        // --------------------------------------------------------
        // א. לוגיקת התחברות (Login)
        // --------------------------------------------------------
        const loginForm = document.querySelector('.auth-form-side form');
        
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // מונע מהעמוד להתרענן אוטומטית

            const email = document.getElementById('email').value;
            
            try {
                const response = await fetch(`${API_URL}/users/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (response.ok) {
                    // שמירת הנתונים והטוקן בזיכרון של הדפדפן (localStorage)
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userId', data.user._id);
                    localStorage.setItem('userName', data.user.fullName);
                    localStorage.setItem('userRole', data.user.role); 

                    alert(`ברוך הבא, ${data.user.fullName}!`);
                    
                    // העברה לעמוד הבא (שנו לכתובת הקובץ האמיתי שלכן של המופעים, למשל events.html)
                    window.location.href = 'events.html'; 
                } else {
                    alert(data.error || 'שגיאה בהתחברות');
                }
            } catch (err) {
                console.error('שגיאה:', err);
                alert('לא ניתן להתחבר לשרת. ודאו שהשרת שלכן מופעל ב-VS Code!');
            }
        });

        // --------------------------------------------------------
        // ב. לוגיקת הרשמה (Register)
        // --------------------------------------------------------
        const registerForm = document.querySelector('.modal-card form');
        const modalToggle = document.getElementById('modal-toggle');

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fullName = document.getElementById('reg-name').value;
            const phone = document.getElementById('reg-phone').value;
            const email = document.getElementById('reg-email').value;

            try {
                const response = await fetch(`${API_URL}/users/signup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ fullName, phone, email })
                });

                const data = await response.json();

                if (response.ok) {
                    alert('נרשמת בהצלחה למערכת! הארנק הדיגיטלי שלך נוצר עם יתרה של ₪0. כעת ניתן להתחבר.');
                    
                    // מנקים את השדות וסוגרים את הפופ-אפ
                    registerForm.reset();
                    modalToggle.checked = false; 
                    
                    // מזינים אוטומטית את האימייל החדש בשדה ההתחברות
                    document.getElementById('email').value = email;
                } else {
                    alert(data.error || 'שגיאה בתהליך ההרשמה');
                }
            } catch (err) {
                console.error('שגיאה:', err);
                alert('שגיאה בתקשורת עם השרת בזמן ההרשמה');
            }
        });