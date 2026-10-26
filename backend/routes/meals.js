const express = require('express');
const router = express.Router();
const Meal = require('../models/Meals');
const auth = require('../middleware/auth');

// Minden étkezés végpont csak bejelentkezve érhető el, a felhasználó azonosítója a tokenből jön (req.userId)
router.use(auth);

// Új étkezés mentése
router.post('/', async (req, res) => {
    try {
        const newMeal = new Meal({ ...req.body, userId: req.userId });
        const savedMeal = await newMeal.save();
        res.status(201).json(savedMeal);
    } catch (err) {
        console.error("Hiba az étkezés mentésekor:", err);
        res.status(500).json({ message: "Szerver hiba a mentés során" });
    }
});

// A bejelentkezett felhasználó étkezéseinek lekérése
router.get('/', async (req, res) => {
    try {
        const meals = await Meal.find({ userId: req.userId }).sort({ date: -1 });
        res.json(meals);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Étkezés módosítása (csak a saját étkezését módosíthatja a felhasználó, a dátum marad az eredeti)
router.put('/:id', async (req, res) => {
    try {
        const { mealType, foods, totalCalories } = req.body;

        if (!mealType || !foods || foods.length === 0) {
            return res.status(400).json({ message: "Hiányzó adatok az étkezés mentéséhez!" });
        }

        const updatedMeal = await Meal.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { mealType, foods, totalCalories },
            { returnDocument: 'after', runValidators: true }
        );
        if (!updatedMeal) {
            return res.status(404).json({ message: "Az étkezés nem található" });
        }
        res.status(200).json(updatedMeal);
    } catch (err) {
        if (err.name === 'ValidationError' || err.name === 'CastError') {
            return res.status(400).json({ message: "Hibás étkezésadatok!" });
        }
        console.error("Hiba az étkezés módosításakor:", err);
        res.status(500).json({ message: "Nem sikerült módosítani az étkezést." });
    }
});

// Étkezés törlése (csak a saját étkezését törölheti a felhasználó)
router.delete('/:id', async (req, res) => {
    try {
        const deletedMeal = await Meal.findOneAndDelete({ _id: req.params.id, userId: req.userId });
        if (!deletedMeal) {
            return res.status(404).json({ message: "Az étkezés nem található" });
        }
        res.status(200).json({ message: "Étkezés törölve" });
    } catch (err) {
        console.error("Hiba az étkezés törlésekor:", err);
        res.status(500).json({ message: "Hiba a törlés közben" });
    }
});

module.exports = router;