const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const mealRoutes = require('./routes/meals');
const auth = require('./middleware/auth');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware-ek
app.use(cors());
app.use(express.json());
app.use('/api/meals', mealRoutes);

// --- MONGODB CSATLAKOZÁS ---
// Windowson a Node néha csak 127.0.0.1-et lát DNS szervernek, és nem tudja feloldani a mongodb+srv címet
const dns = require('dns');
if (dns.getServers().every(s => s.startsWith('127.'))) {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
}

// Az elérési adat a backend/.env fájlban van (minta: .env.example), nem kerül fel a GitHubra
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
    console.error('❌ Hiányzik a MONGO_URI! Másold le a backend/.env.example fájlt backend/.env néven, és töltsd ki.');
    process.exit(1);
}
if (!process.env.JWT_SECRET) {
    console.error('❌ Hiányzik a JWT_SECRET a backend/.env fájlból! (minta: .env.example)');
    process.exit(1);
}

// Bejelentkezési token készítése (7 napig érvényes)
const createToken = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

mongoose.connect(mongoURI)
    .then(() => console.log('✅ Sikeres MongoDB csatlakozás!'))
    .catch(err => console.error('❌ MongoDB hiba:', err));
// --- ADATMODELLEK ---

// Felhasználó modell
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
    goal: { type: String, default: 'NotSet' },
    currentWeight: { type: Number, default: 0 }
});

const User = mongoose.model('User', UserSchema);

// Edzés modell
const WorkoutSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    muscleGroup: { type: String, required: true },
    exercises: [{
        name: { type: String, required: true },
        sets: { type: Number, required: true },
        reps: { type: Number, required: true },
        weight: { type: Number, required: true }
    }]
});

const Workout = mongoose.model('Workout', WorkoutSchema);

// --- API VÉGPONTOK ---

// 1. Regisztráció - Módosítva az automatikus beléptetéshez
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email és jelszó megadása kötelező!" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "A jelszónak legalább 6 karakternek kell lennie!" });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "Ez az email cím már regisztrálva van!" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            email,
            password: hashedPassword,
            name
        });

        await newUser.save();

        // JAVÍTÁS: Visszaküldjük a felhasználó adatait is (jelszó nélkül),
        // hogy a frontend azonnal be tudja léptetni a regisztráció után.
        res.status(201).json({
            message: "Sikeres regisztráció!",
            token: createToken(newUser),
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        });
    } catch (err) {
        console.error("Regisztrációs hiba:", err);
        res.status(500).json({ message: "Szerver hiba történt a mentéskor." });
    }
});

// 2. Bejelentkezés
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Hiányzó email vagy jelszó!' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Hibás email vagy jelszó!' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Hibás email vagy jelszó!' });
        }

        res.status(200).json({
            message: 'Sikeres bejelentkezés!',
            token: createToken(user),
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (err) {
        console.error("Login hiba:", err);
        res.status(500).json({ message: 'Szerver hiba történt.' });
    }
});

// Az edzés végpontok csak bejelentkezve érhetők el, a felhasználó azonosítója a tokenből jön (req.userId)

// 3. Edzés mentése
app.post('/api/workouts', auth, async (req, res) => {
    try {
        const { muscleGroup, exercises } = req.body;

        if (!muscleGroup || !exercises) {
            return res.status(400).json({ message: "Hiányzó adatok az edzés mentéséhez!" });
        }

        const newWorkout = new Workout({ userId: req.userId, muscleGroup, exercises });
        await newWorkout.save();

        res.status(201).json({ message: "Edzés sikeresen rögzítve!" });
    } catch (err) {
        console.error("Workout mentési hiba:", err);
        res.status(500).json({ message: "Nem sikerült elmenteni az edzést." });
    }
});

// A bejelentkezett felhasználó edzéseinek lekérése
app.get('/api/workouts', auth, async (req, res) => {
    try {
        // Megkeressük az edzéseket a userId alapján, és dátum szerint csökkenő sorrendbe rakjuk
        const workouts = await Workout.find({ userId: req.userId }).sort({ date: -1 });
        res.status(200).json(workouts);
    } catch (err) {
        console.error("Lekérdezési hiba:", err);
        res.status(500).json({ message: "Nem sikerült lekérni az edzésmúltat." });
    }
});

// Edzés törlése (csak a saját edzését törölheti a felhasználó)
app.delete('/api/workouts/:id', auth, async (req, res) => {
    try {
        const deletedWorkout = await Workout.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!deletedWorkout) {
            return res.status(404).json({ message: "Az edzés nem található" });
        }
        res.status(200).json({ message: "Edzés törölve" });
    } catch (err) {
        res.status(500).json({ message: "Hiba a törlés közben" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Szerver fut: http://localhost:${PORT}`);
});