const mongoose = require('mongoose');

const MealSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, default: Date.now },
    mealType: { type: String, required: true }, // pl. Reggeli, Ebéd, Vacsora
    foods: [{
        name: { type: String, required: true },
        calories: { type: Number, default: 0 },
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fat: { type: Number, default: 0 }
    }],
    totalCalories: { type: Number, default: 0 }
});

module.exports = mongoose.model('Meal', MealSchema);