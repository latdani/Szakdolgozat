const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // A jelszó titkosításához
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware-ek
app.use(cors());
app.use(express.json());

const path = require('path'); // Ez az alap Node.js modul kell az útvonalakhoz

// Megmondjuk a szervernek, hogy a frontend fájlok a felette lévő mappában vannak
//app.use(express.static(path.join(__dirname, '../')));

// A főoldal kérésekor (localhost:5000) küldje el az index.html-t
//app.get('/', (req, res) => {
    //res.sendFile(path.join(__dirname, '../index.html'));
//});

// --- MONGODB CSATLAKOZÁS ---
// A .env fájlba tedd majd a kapcsolatot, de ideiglenesen ide is írhatod
const mongoURI = process.env.MONGO_URI || "mongodb+srv://admin:adminjohhny@cluster0.kl7txri.mongodb.net/LiftLogDB?appName=Cluster0";
mongoose.connect(mongoURI)
    .then(() => console.log('✅ Sikeres MongoDB csatlakozás!'))
    .catch(err => console.error('❌ MongoDB hiba:', err));

// --- ADATMODELL (SÉMA) ---
// Ez mondja meg a MongoDB-nek, hogy néz ki egy User
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String },
    goal: { type: String, default: 'NotSet' },
    currentWeight: { type: Number, default: 0 }
});

const User = mongoose.model('User', UserSchema);

// --- API VÉGPONTOK ---

// 1. Teszt
//app.get('/', (req, res) => {
    //res.send('A LiftLog MongoDB Backend Működik!');
//});

// 2. Regisztráció (Már titkosítva!)
app.post('/api/register', async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email és jelszó kötelező!" });
    }

    try {
        // Ellenőrizzük, létezik-e már a felhasználó
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: "Ez az email már foglalt!" });

        // Jelszó hashelése (Szakdoga követelmény!)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            email,
            password: hashedPassword,
            name
        });

        await newUser.save();
        res.status(201).json({ message: "Sikeres regisztráció!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Hiba történt a mentéskor." });
    }
});

// Bejelentkezés végpont
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Felhasználó megkeresése email alapján
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Hibás email vagy jelszó!' });
        }

        // Jelszó ellenőrzése (összehasonlítjuk a titkosítottal)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Hibás email vagy jelszó!' });
        }

        // Ha minden jó
        res.status(200).json({
            message: 'Sikeres bejelentkezés!',
            user: { id: user._id, name: user.name, email: user.email }
        });

    } catch (err) {
        res.status(500).json({ message: 'Szerver hiba történt.' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Szerver fut: http://localhost:${PORT}`);
});