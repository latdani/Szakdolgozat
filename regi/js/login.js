document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginFormPage');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const loginData = {
                email: document.getElementById('login_email').value,
                password: document.getElementById('login_password').value
            };

            try {
                // Fontos: Itt a teljes URL-t használjuk, hogy biztosan elérje a backendet
                const response = await fetch('http://localhost:5000/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(loginData)
                });

                const result = await response.json();

                if (response.ok) {
                    // --- EZT A RÉSZT MÓDOSÍTJUK ---
                    // Elmentjük a felhasználó adatait (id, név, email) a böngésző memóriájába
                    localStorage.setItem('user', JSON.stringify(result.user));

                    alert("Sikeres bejelentkezés! Üdvözlünk, " + result.user.name);

                    // Visszairányítunk a főoldalra
                    window.location.href = 'index.html';
                } else {
                    alert("Hiba: " + result.message);
                }
            } catch (err) {
                console.error("Hiba:", err);
                alert("A szerver nem elérhető! Ellenőrizd, hogy fut-e a Node.js.");
            }
        });
    }
});