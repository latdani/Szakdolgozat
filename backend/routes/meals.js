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

module.exports = router;