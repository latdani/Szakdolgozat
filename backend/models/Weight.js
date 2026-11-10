const mongoose = require('mongoose');

// Testsúly-bejegyzés: felhasználónként naponta legfeljebb egy
const WeightSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    day: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // pl. "2026-11-10"
    weight: { type: Number, required: true, min: 1, max: 500 }
});

WeightSchema.index({ userId: 1, day: 1 }, { unique: true });

// A mai nap magyar idő szerint, "ÉÉÉÉ-HH-NN" alakban (a szerver UTC-ben futhat)
WeightSchema.statics.today = () =>
    new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Budapest' });

// Létező naptári nap-e "ÉÉÉÉ-HH-NN" alakban (pl. a "2026-02-30" nem az)
WeightSchema.statics.isValidDay = (day) => {
    if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
    const date = new Date(day + 'T00:00:00Z');
    return !isNaN(date) && date.toISOString().slice(0, 10) === day;
};

// Adott napi súly mentése: ha aznapra már van bejegyzés, felülírja
WeightSchema.statics.saveForDay = function (userId, day, weight) {
    return this.findOneAndUpdate(
        { userId, day },
        { weight },
        { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
    );
};

module.exports = mongoose.model('Weight', WeightSchema);
