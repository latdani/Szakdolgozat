
document.addEventListener('DOMContentLoaded', function() {
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

                // Sima görgetés a megfelelő szekcióhoz
                const targetId = this.getAttribute('href').substring(1);
                if (targetId) {
                    const targetSection = document.getElementById(targetId);
                    if (targetSection) {
                        targetSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }
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
});

// Modal megjelenítése
function showModal(title, type) {
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

// Reszponzív navigációs menü (kis képernyőkre)
function initMobileMenu() {
    const headerContent = document.querySelector('.header-content');
    const nav = document.querySelector('nav');

    // Mobil menü gomb létrehozása (ha szükséges)
    if (window.innerWidth <= 768 && !document.getElementById('mobileMenuBtn')) {
        const mobileMenuBtn = document.createElement('button');
        mobileMenuBtn.id = 'mobileMenuBtn';
        mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        mobileMenuBtn.className = 'mobile-menu-btn';

        // Stílus hozzáadása
        const style = document.createElement('style');
        style.textContent = `
            .mobile-menu-btn {
                display: none;
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
            }
            
            @media (max-width: 768px) {
                .mobile-menu-btn {
                    display: block;
                }
                
                nav ul {
                    display: none;
                    flex-direction: column;
                    width: 100%;
                    background: var(--secondary);
                    position: absolute;
                    top: 100%;
                    left: 0;
                    padding: 1rem;
                }
                
                nav ul.show {
                    display: flex;
                }
            }
        `;
        document.head.appendChild(style);

        // Gomb beszúrása
        headerContent.insertBefore(mobileMenuBtn, nav);

        // Eseménykezelő
        mobileMenuBtn.addEventListener('click', function() {
            const navUl = document.querySelector('nav ul');
            navUl.classList.toggle('show');
        });
    }
}

// Inicializálás
window.addEventListener('resize', initMobileMenu);
initMobileMenu();
