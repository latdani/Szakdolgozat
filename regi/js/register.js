document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerFormPage');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Megakadályozzuk az oldal újratöltését

            // Adatok kigyűjtése az űrlapból
            const userData = {
                name: document.getElementById('reg_name').value,
                email: document.getElementById('reg_email').value,
                password: document.getElementById('reg_password').value
            };

            try {
                // Elküldjük az adatokat a backendnek
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });

                const result = await response.json();

                if (response.ok) {
                    alert("Sikeres regisztráció! Most visszairányítunk a kezdőlapra.");
                    window.location.href = 'index.html'; // Visszaviszünk a főoldalra
                } else {
                    // Megjelenítjük a szerver hibaüzenetét (pl. már létező email)
                    alert("Hiba: " + result.message);
                }
            } catch (err) {
                console.error("Hiba történt:", err);
                alert("Nem sikerült elérni a szervert! Ellenőrizd, hogy fut-e a backend.");
            }
        });
    }
});