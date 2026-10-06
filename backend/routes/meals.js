const express = require('express');
const router = express.Router();
const Meal = require('../models/Meals');

// Új étkezés mentése
router.post('/', async (req, res) => {
    try {
        const newMeal = new Meal(req.body);
        const savedMeal = await newMeal.save();
        res.status(201).json(savedMeal);
    } catch (err) {
        console.error("Hiba az étkezés mentésekor:", err);
        res.status(500).json({ message: "Szerver hiba a mentés során" });
    }
});

// Étkezések lekérése egy adott felhasználóhoz
router.get('/:userId', async (req, res) => {
    try {
        const meals = await Meal.find({ userId: req.params.userId }).sort({ date: -1 });
        res.json(meals);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Étkezés törlése azonosító alapján
router.delete('/:id', async (req, res) => {
    try {
        const deletedMeal = await Meal.findByIdAndDelete(req.params.id);
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