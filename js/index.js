document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user'));
    const authButtons = document.querySelector('.auth-buttons');

    if (user && authButtons) {
        // Csak a HTML szerkezetet adjuk meg, a formázást a CSS végzi az osztályokon keresztül
        authButtons.innerHTML = `
            <span class="user-name-display"> ${user.name}! </span>
            <button class="btn btn-outline" id="logoutBtn">Kijelentkezés</button>
        `;

        // Kijelentkezés logika
        document.getElementById('logoutBtn').addEventListener('click', function() {
            localStorage.removeItem('user');
            window.location.reload();
        });
    }
    // 1. Mobil menü inicializálása
    initMobileMenu();

    // 2. Gombok inicializálása
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const ctaBtn = document.getElementById('ctaBtn');
    const dashboardBtn = document.getElementById('dashboardBtn');

    // --- ÁTIRÁNYÍTÁSI LOGIKA ---

    // Regisztráció gomb (Headerben)
    if (registerBtn) {
        registerBtn.addEventListener('click', function() {
            window.location.href = 'register.html';
        });
    }

    // "Kezdd el most" gomb (Hero szekcióban)
    if (ctaBtn) {
        ctaBtn.addEventListener('click', function() {
            window.location.href = 'register.html';
        });
    }

    // Bejelentkezés gomb (Most még figyelmeztet, mert nincs login.html-ed)
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            window.location.href = 'login.html';
        });
    }

    // Dashboard gomb
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', function() {
            alert('Az irányítópult csak bejelentkezés után érhető el. Kérlek regisztrálj!');
            window.location.href = 'register.html';
        });
    }

    // --- VIZUÁLIS EFFEKTEK ÉS ANIMÁCIÓK ---

    // Statisztikák animálása (pörgő számok)
    animateStats();

    // Feature card hover effektek
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px)';
            this.style.transition = '0.3s ease';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Aktív link kezelése (melyik oldalon állunk éppen)
    updateActiveLinks();

    // Kattintás a dokumentumon kívülre - mobil menü bezárása
    document.addEventListener('click', function(e) {
        const nav = document.querySelector('nav');
        const mobileBtn = document.getElementById('mobileMenuBtn');

        if (nav && mobileBtn && !nav.contains(e.target) && !mobileBtn.contains(e.target)) {
            closeMobileMenu();
        }
    });
});

// --- SEGÉDFÜGGVÉNYEK ---

function updateActiveLinks() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav a');

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function initMobileMenu() {
    const nav = document.querySelector('nav');
    if (!document.getElementById('mobileMenuBtn')) {
        const mobileMenuBtn = document.createElement('button');
        mobileMenuBtn.id = 'mobileMenuBtn';
        mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        mobileMenuBtn.className = 'mobile-menu-btn';

        nav.parentNode.insertBefore(mobileMenuBtn, nav);

        mobileMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const navUl = document.querySelector('nav ul');
            if (navUl.classList.contains('show')) {
                closeMobileMenu();
            } else {
                navUl.classList.add('show');
                mobileMenuBtn.innerHTML = '<i class="fas fa-times"></i>';
            }
        });
    }
}

function closeMobileMenu() {
    const navUl = document.querySelector('nav ul');
    const mobileBtn = document.getElementById('mobileMenuBtn');
    if (navUl && navUl.classList.contains('show')) {
        navUl.classList.remove('show');
        if (mobileBtn) mobileBtn.innerHTML = '<i class="fas fa-bars"></i>';
    }
}

function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumber = entry.target;
                const targetText = statNumber.textContent;
                const targetValue = parseInt(targetText);
                const suffix = targetText.replace(/[0-9]/g, ''); // Kimenti a + vagy % jelet

                let currentValue = 0;
                const increment = targetValue / 50;
                const timer = setInterval(() => {
                    currentValue += increment;
                    if (currentValue >= targetValue) {
                        statNumber.textContent = targetValue + suffix;
                        clearInterval(timer);
                    } else {
                        statNumber.textContent = Math.floor(currentValue) + suffix;
                    }
                }, 30);
                observer.unobserve(statNumber);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(stat => observer.observe(stat));
}

// Ablak átméretezés kezelése
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        closeMobileMenu();
    }
});