// Közös segédfüggvények a backend tesztekhez.
// Minden tesztfájl saját, memóriában futó MongoDB-t kap, így a tesztek nem érintik az éles (Atlas) adatbázist.
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'teszt-titok';
const app = require('../server');

let mongod;

async function startDb() {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
}

async function stopDb() {
    await mongoose.disconnect();
    await mongod.stop();
}

// Minden teszt üres adatbázissal indul
async function clearDb() {
    const collections = await mongoose.connection.db.collections();
    for (const c of collections) {
        await c.deleteMany({});
    }
}

// Regisztrál egy felhasználót, és visszaadja a tokenjét
async function registerUser(email = 'teszt@pelda.hu', password = 'jelszo123', name = 'Teszt Elek') {
    const res = await request(app).post('/api/register').send({ email, password, name });
    return res.body.token;
}

const bearer = (token) => ({ Authorization: `Bearer ${token}` });

module.exports = { app, request, startDb, stopDb, clearDb, registerUser, bearer };
