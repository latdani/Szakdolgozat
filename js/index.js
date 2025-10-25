
document.addEventListener('DOMContentLoaded', function() {
    // Mobil menü inicializálása
    initMobileMenu();

    // Gombok inicializálása
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const ctaBtn = document.getElementById('ctaBtn');
    const dashboardBtn = document.getElementById('dashboardBtn');

    // Navigációs linkek
    const navLinks = document.querySelectorAll('nav a');

    // Gomb eseménykezelők
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            showModal('Bejelentkezés', 'login');
        });
    }

    if (registerBtn) {
        registerBtn.addEventListener('click', function() {
            showModal('Regisztráció', 'register');
        });
    }

    if (ctaBtn) {
        ctaBtn.addEventListener('click', function() {
            showModal('Kezdd el a LiftLog használatát!', 'register');
        });
    }

    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', function() {
            alert('Irányítópult előnézet megnyitva! A teljes funkciók bejelentkezés után érhetők el.');
        });
    }

    // Navigációs linkek aktív állapotának kezelése
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (!this.getAttribute('href').startsWith('#')) {
                e.preventDefault();

                // Aktív link frissítése
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');

                // Mobil menü bezárása
                closeMobileMenu();
            }
        });
    });

    // Statisztikák animálása
    animateStats();

    // Feature card hover effektek
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Kattintás a dokumentumon kívülre - menü bezárása
    document.addEventListener('click', function(e) {
        const nav = document.querySelector('nav');
        const mobileBtn = document.getElementById('mobileMenuBtn');

        if (nav && mobileBtn && !nav.contains(e.target) && !mobileBtn.contains(e.target)) {
            closeMobileMenu();
        }
    });
});

// Mobil menü inicializálása
function initMobileMenu() {
    const headerContent = document.querySelector('.header-content');
    const nav = document.querySelector('nav');

    // Ha még nincs mobil menü gomb, létrehozzuk
    if (!document.getElementById('mobileMenuBtn')) {
        const mobileMenuBtn = document.createElement('button');
        mobileMenuBtn.id = 'mobileMenuBtn';
        mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        mobileMenuBtn.className = 'mobile-menu-btn';
        mobileMenuBtn.setAttribute('aria-label', 'Menü megnyitása');

        // Gomb beszúrása a navigáció elé
        nav.parentNode.insertBefore(mobileMenuBtn, nav);

        // Eseménykezelő
        mobileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMobileMenu();
        });
    }
}

// Mobil menü megnyitása/bezárása
function toggleMobileMenu() {
    const navUl = document.querySelector('nav ul');
    const mobileBtn = document.getElementById('mobileMenuBtn');

    if (navUl.classList.contains('show')) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
}

// Mobil menü megnyitása
function openMobileMenu() {
    const navUl = document.querySelector('nav ul');
    const mobileBtn = document.getElementById('mobileMenuBtn');

    navUl.classList.add('show');
    mobileBtn.innerHTML = '<i class="fas fa-times"></i>';
    mobileBtn.setAttribute('aria-label', 'Menü bezárása');
}

// Mobil menü bezárása
function closeMobileMenu() {
    const navUl = document.querySelector('nav ul');
    const mobileBtn = document.getElementById('mobileMenuBtn');

    navUl.classList.remove('show');
    mobileBtn.innerHTML = '<i class="fas fa-bars"></i>';
    mobileBtn.setAttribute('aria-label', 'Menü megnyitása');
}

// Modal megjelenítése
function showModal(title, type) {
    // Bezárjuk a mobil menüt modal megnyitásakor
    closeMobileMenu();

    // Egyszerű modal helyett alert (teljes modal komponens helyett)
    if (type === 'login') {
        alert('Bejelentkezési űrlap\n\nEz egy demo verzió. A teljes funkcionalitás fejlesztés alatt áll.');
    } else if (type === 'register') {
        alert('Regisztrációs űrlap\n\nEz egy demo verzió. A teljes funkcionalitás fejlesztés alatt áll.');
    }
}

// Statisztikák animálása
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumber = entry.target;
                const targetValue = parseInt(statNumber.textContent);
                let currentValue = 0;
                const increment = targetValue / 50;
                const timer = setInterval(() => {
                    currentValue += increment;
                    if (currentValue >= targetValue) {
                        statNumber.textContent = targetValue + (statNumber.textContent.includes('+') ? '+' : '%');
                        clearInterval(timer);
                    } else {
                        statNumber.textContent = Math.floor(currentValue) + (statNumber.textContent.includes('+') ? '+' : '%');
                    }
                }, 30);

                observer.unobserve(statNumber);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(stat => {
        observer.observe(stat);
    });
}

// Reszponzív menü kezelése ablak átméretezéskor
window.addEventListener('resize', function() {
    // Ha visszanagyítunk és a menü nyitva van, bezárjuk
    if (window.innerWidth > 768) {
        closeMobileMenu();
    }
});