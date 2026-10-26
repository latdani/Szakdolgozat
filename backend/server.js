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
// A cél lehetséges értékei: NotSet (nincs megadva), MuscleGain (izomnövelés), WeightLoss (fogyás), Maintain (szinten tartás)
const GOALS = ['NotSet', 'MuscleGain', 'WeightLoss', 'Maintain'];

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
    goal: { type: String, enum: GOALS, default: 'NotSet' },
    currentWeight: { type: Number, default: 0, min: 0, max: 500 },
    dailyCalorieGoal: { type: Number, default: 2500, min: 500, max: 10000 }
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

// A profil és az edzés végpontok csak bejelentkezve érhetők el, a felhasználó azonosítója a tokenből jön (req.userId)

// A profil mezői, amiket a felhasználó láthat és módosíthat (a jelszó soha nem megy ki)
const PROFILE_FIELDS = 'name email goal currentWeight dailyCalorieGoal';

// Saját profil lekérése
app.get('/api/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select(PROFILE_FIELDS);
        if (!user) {
            return res.status(404).json({ message: "A felhasználó nem található" });
        }
        res.status(200).json(user);
    } catch (err) {
        console.error("Profil lekérési hiba:", err);
        res.status(500).json({ message: "Nem sikerült lekérni a profilt." });
    }
});

// Saját profil módosítása (név, testsúly, cél, napi kalóriacél)
app.put('/api/profile', auth, async (req, res) => {
    try {
        const { name, goal, currentWeight, dailyCalorieGoal } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "A név megadása kötelező!" });
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { name: name.trim(), goal, currentWeight, dailyCalorieGoal },
            { returnDocument: 'after', runValidators: true } // runValidators: a séma min/max/enum szabályai itt is érvényesek
        ).select(PROFILE_FIELDS);

        if (!user) {
            return res.status(404).json({ message: "A felhasználó nem található" });
        }
        res.status(200).json(user);
    } catch (err) {
        if (err.name === 'ValidationError' || err.name === 'CastError') {
            return res.status(400).json({ message: "Hibás profiladatok!" });
        }
        console.error("Profil mentési hiba:", err);
        res.status(500).json({ message: "Nem sikerült menteni a profilt." });
    }
});

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

// Edzés módosítása (csak a saját edzését módosíthatja a felhasználó, a dátum marad az eredeti)
app.put('/api/workouts/:id', auth, async (req, res) => {
    try {
        const { muscleGroup, exercises } = req.body;

        if (!muscleGroup || !exercises || exercises.length === 0) {
            return res.status(400).json({ message: "Hiányzó adatok az edzés mentéséhez!" });
        }

        const updatedWorkout = await Workout.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { muscleGroup, exercises },
            { returnDocument: 'after', runValidators: true }
        );
        if (!updatedWorkout) {
            return res.status(404).json({ message: "Az edzés nem található" });
        }
        res.status(200).json(updatedWorkout);
    } catch (err) {
        if (err.name === 'ValidationError' || err.name === 'CastError') {
            return res.status(400).json({ message: "Hibás edzésadatok!" });
        }
        console.error("Workout módosítási hiba:", err);
        res.status(500).json({ message: "Nem sikerült módosítani az edzést." });
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