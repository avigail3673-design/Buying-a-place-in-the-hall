// הגדרת הפונקציה שמביאה את המידע מהשרת ומדפיסה אותו
async function getData() {
    try {
        console.log("התחלת הבאת נתונים..."); // אינדיקציה שהלחיצה עבדה
        
        const response = await fetch('http://localhost:4000/getAllUsers');
           console.log(response);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }


        const data = await response.json();
     
        // הדפסת המידע לקונסול של הדפדפן
        console.log("הנתונים שהתקבלו מהשרת:", data);
        console.log("הנתונים  מהשרת:", data[0]);
       // 1. תפיסת אלמנט הרשימה ומחיקת התוכן הישן שלו (מחוץ ללולאה!)
const listElement = document.querySelector("ul"); // עדיף לתפוס את ה-ul שמכיל את הרשימה
listElement.innerHTML = ""; // מרוקן את כל מה שהיה כתוב שם קודם

// 2. ריצה בלולאה והוספת המשתמשים בצורה נקייה
for (let i = 0; i < data.users.length; i++) {
    // יצירת אלמנט li חדש לגמרי בזיכרון עבור המשתמש הנוכחי
    let li = document.createElement("li");
    
    // הכנסת השם לתוך ה-li החדש
    li.innerHTML = data.users[i].name;
    
    // הוספת ה-li החדש לתוך ה-ul שבדף
    listElement.appendChild(li);
}

    } catch (error) {
        console.error("שגיאה בקבלת המידע:", error);
    }
}

// פונקציה להוספת משתמש מה-Input
async function addData() {
    try {
        // 1. שליפת אלמנט ה-Input מה-HTML
        const inputElement = document.querySelector('input');
        console.log(inputElement.value)
        // 2. חילוץ הטקסט שהמשתמש הקליד בפועל
        const nameValue = inputElement.value;

        // בדיקת בטיחות: אם ה-Input ריק, אל תשלחי בקשה לשרת
        if (!nameValue.trim()) {
            alert("אנא הקלידי שם לפני הלחיצה!");
            return;
        }

        console.log("...התחלת הוספת נתונים עבור:", nameValue);

        // 3. בניית האובייקט שנרצה לשלוח לשרת
        const userToSend = { name: nameValue };
        console.log(userToSend)
        // 4. שליחת בקשת ה-POST לשרת
        const response = await fetch('http://localhost:4000/saveNewUser', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userToSend) // הפיכת האובייקט למחרוזת
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

       
  

        // אופציונלי: איפוס תיבת הטקסט לאחר שמירה מוצלחת
        inputElement.value = '';

    } catch (error) {
        console.error("שגיאה בשמירת המידע:", error);
    }
}

// 5. חיבור הפונקציה לאירוע לחיצה על הכפתור
document.getElementById('btn').addEventListener('click', addData);
// 1. תפיסת אלמנט הכפתור מה-HTML באמצעות ה-ID שלו
const myButton = document.querySelector('button');
const myButtonadd = document.querySelector('#btn');
// 2. האזנה ללחיצה על הכפתור והפעלת פונקציית ה-getData
myButton.addEventListener('click', getData);
myButtonadd.addEventListener('click', addData);
