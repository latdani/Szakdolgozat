const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Weight = require('../models/Weight');
const auth = require('../middleware/auth');

// Minden testsúly végpont csak bejelentkezve érhető el, a felhasználó azonosítója a tokenből jön (req.userId)
router.use(auth);

// A profilban látható "jelenlegi testsúly" mindig a legutolsó napi bejegyzés legyen
async function syncCurrentWeight(userId) {
    const latest = await Weight.findOne({ userId }).sort({ day: -1 });
    if (latest) {
        await mongoose.model('User').findByIdAndUpdate(userId, { currentWeight: latest.weight });
    }
}

// A bejelentkezett felhasználó testsúly-előzményei, időrendben
router.get('/', async (req, res) => {
    try {
        const weights = await Weight.find({ userId: req.userId }).sort({ day: 1 });
        res.json(weights);
    } catch (err) {
        console.error("Hiba a testsúlyok lekérésekor:", err);
        res.status(500).json({ message: "Nem sikerült lekérni a testsúlyokat." });
    }
});

// Testsúly rögzítése egy napra (alapból mára); ha aznapra már van, felülírja
router.post('/', async (req, res) => {
    try {
        const weight = Number(req.body.weight);
        const day = req.body.day || Weight.today();

        if (!weight) {
            return res.status(400).json({ message: "A testsúly megadása kötelező!" });
        }
        // Upsertnél a séma nem ellenőrzi a keresési feltételben lévő napot, ezért itt nézzük meg
        if (!Weight.isValidDay(day)) {
            return res.status(400).json({ message: "Hibás dátum! (ÉÉÉÉ-HH-NN)" });
        }
        if (day > Weight.today()) {
            return res.status(400).json({ message: "Jövőbeli dátumra nem lehet testsúlyt rögzíteni!" });
        }

        const saved = await Weight.saveForDay(req.userId, day, weight);
        await syncCurrentWeight(req.userId);
        res.status(201).json(saved);
    } catch (err) {
        if (err.name === 'ValidationError' || err.name === 'CastError') {
            return res.status(400).json({ message: "Hibás testsúlyadatok! (1–500 kg, dátum: ÉÉÉÉ-HH-NN)" });
        }
        console.error("Hiba a testsúly mentésekor:", err);
        res.status(500).json({ message: "Nem sikerült menteni a testsúlyt." });
    }
});

// Bejegyzés törlése (csak a sajátját törölheti a felhasználó)
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Weight.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!deleted) {
            return res.status(404).json({ message: "A bejegyzés nem található" });
        }
        await syncCurrentWeight(req.userId);
        res.status(200).json({ message: "Bejegyzés törölve" });
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(404).json({ message: "A bejegyzés nem található" });
        }
        console.error("Hiba a testsúly törlésekor:", err);
        res.status(500).json({ message: "Hiba a törlés közben" });
    }
});

module.exports = router;
