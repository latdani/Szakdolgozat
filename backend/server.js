const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware-ek
app.use(cors());
app.use(express.json());

// --- MONGODB CSATLAKOZÁS ---
const mongoURI = process.env.MONGO_URI || "mongodb+srv://admin:adminjohhny@cluster0.kl7txri.mongodb.net/LiftLogDB?appName=Cluster0";
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
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (err) {
        console.error("Login hiba:", err);
        res.status(500).json({ message: 'Szerver hiba történt.' });
    }
});

// 3. Edzés mentése
app.post('/api/workouts', async (req, res) => {
    try {
        const { userId, muscleGroup, exercises } = req.body;

        if (!userId || !muscleGroup || !exercises) {
            return res.status(400).json({ message: "Hiányzó adatok az edzés mentéséhez!" });
        }

        const newWorkout = new Workout({ userId, muscleGroup, exercises });
        await newWorkout.save();

        res.status(201).json({ message: "Edzés sikeresen rögzítve!" });
    } catch (err) {
        console.error("Workout mentési hiba:", err);
        res.status(500).json({ message: "Nem sikerült elmenteni az edzést." });
    }
});

// Edzések lekérése egy adott felhasználóhoz
app.get('/api/workouts/:userId', async (req, res) => {
    try {
        // Megkeressük az edzéseket a userId alapján, és dátum szerint csökkenő sorrendbe rakjuk
        const workouts = await Workout.find({ userId: req.params.userId }).sort({ date: -1 });
        res.status(200).json(workouts);
    } catch (err) {
        console.error("Lekérdezési hiba:", err);
        res.status(500).json({ message: "Nem sikerült lekérni az edzésmúltat." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Szerver fut: http://localhost:${PORT}`);
});