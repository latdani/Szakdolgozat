# LiftLog – Edzés- és Étkezésnapló Webalkalmazás

## Áttekintés

A **LiftLog** egy modern, webalapú alkalmazás, amely segítséget nyújt a felhasználóknak edzéseik és napi étkezéseik rendszerezett nyomon követésében.  
A rendszer célcsoportja olyan személyek, akik aktívan sportolnak, testtömegüket szeretnék növelni vagy csökkenteni, illetve általános egészségi állapotukat szeretnék fejleszteni.

Az alkalmazás célja, hogy **egyszerű, áttekinthető felületet** biztosítson az edzések és a napi tápanyagbevitel rögzítésére, valamint ezek **hosszú távú elemzésére**.  
A LiftLog célja, hogy a felhasználók tudatosabban, motiváltabban és hatékonyabban érhessék el fitneszcéljaikat.

---

## Fő funkciók

### 1. Felhasználói fiók kezelés

- Regisztráció (e-mail és jelszó megadásával)
- Bejelentkezés és kijelentkezés
- Felhasználói profil szerkesztése (pl. testsúly, cél: izomnövelés / fogyás / megtartás)
- Adatok biztonságos tárolása (pl. Firebase Authentication vagy saját backend használatával)

---

### 2. Edzésnapló

- Új edzésnap hozzáadása (dátum, edzett izomcsoport, gyakorlatok)
- Gyakorlatok rögzítése (név, sorozatok száma, ismétlések, használt súlyok)
- Korábbi edzések listázása, megtekintése
- Edzésnap szerkesztése vagy törlése
- Fejlődés nyomon követése (pl. összsúly, volumen, heti edzésszám)

---

### 3. Étkezésnapló

- Étkezések hozzáadása (pl. reggeli, ebéd, vacsora, snack)
- Ételek és makrotápanyagok rögzítése (fehérje, szénhidrát, zsír, kalória)
- Összesített napi értékek megjelenítése
- Célok beállítása (pl. napi fehérje- vagy kalóriacél)
- Étkezések szerkesztése és törlése

---

### 4. Statisztikák és összesítések

- Heti és havi statisztikák megjelenítése (edzésmennyiség, bevitt tápanyagok)
- Diagramok (pl. testsúly változása, edzésintenzitás)
- Célokhoz viszonyított teljesítmény kijelzése

---

### 5. Felhasználói élményt támogató funkciók

- Reszponzív, mobilbarát dizájn
- Sötét/világos téma
- Motivációs üzenetek vagy napi tippek megjelenítése
- Egyszerű és letisztult felhasználói felület

---

## Technikai háttér (tervezett)

- **Frontend:** HTML, CSS, JavaScript / Angular / React  
- **Backend:** Firebase vagy Node.js + Express  
- **Adatbázis:** Firestore vagy MongoDB  
- **Követelmények:** böngészőből futtatható, nem igényel telepítést  
- **Biztonság:** jelszó-hash-elés, jogosultságkezelés  

---

## Összegzés

A **LiftLog** segítségével a felhasználók képesek lesznek:

- saját edzéseiket és étkezéseiket naplózni,  
- megfigyelni fejlődésüket időben,  
- és motiváltak maradni céljaik elérésében.

A projekt gyakorlati célja egy **valós problémára** (az egészséges életmód követése és rendszerezése) adható **digitális megoldás** létrehozása, amely később akár **mobilalkalmazásként is továbbfejleszthető**.

---

## 📄 Fejlesztői információk

- **Projekt neve:** LiftLog  
- **Típus:** Szakdolgozati projekt (Edzés- és étkezésnapló webalkalmazás)  
- **Fejlesztő:** Látkóczki Dániel  
- **Technológiai stack:** HTML, CSS, JavaScript / Angular, Node.js / Firebase  
- **Cél:** Teljes funkcionalitású, reszponzív és biztonságos webalkalmazás létrehozása

---

## Jövőbeli fejlesztési lehetőségek

- Mobilalkalmazás verzió (Ionic vagy React Native)
- Ételadatbázis API integráció (pl. USDA vagy Edamam)
- Gépi tanulás alapú elemzés (pl. edzés- vagy étkezési szokásokra)
- Push értesítések és motivációs napló

---

© 2025 Látkóczki Dániel – LiftLog
