const jwt = require('jsonwebtoken');

// Csak érvényes tokennel engedi tovább a kérést.
// A token a bejelentkezéskor jön létre, a frontend az Authorization fejlécben küldi: "Bearer <token>"
module.exports = (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: "Hiányzó token, jelentkezz be!" });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = payload.id; // A végpontok innen tudják, ki a bejelentkezett felhasználó
        next();
    } catch (err) {
        return res.status(401).json({ message: "Érvénytelen vagy lejárt token, jelentkezz be újra!" });
    }
};
