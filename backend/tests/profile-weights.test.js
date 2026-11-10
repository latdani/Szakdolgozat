const { app, request, startDb, stopDb, clearDb, registerUser, bearer } = require('./helpers');
const Weight = require('../models/Weight');

beforeAll(startDb);
afterAll(stopDb);

let token;
beforeEach(async () => {
    await clearDb();
    token = await registerUser();
});

const validProfile = { name: 'Teszt Elek', goal: 'WeightLoss', currentWeight: 80, dailyCalorieGoal: 2200 };

describe('Profil – GET/PUT /api/profile', () => {
    test('T12 új felhasználó alapértelmezett profilja, jelszó nélkül', async () => {
        const res = await request(app).get('/api/profile').set(bearer(token));
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ name: 'Teszt Elek', goal: 'NotSet', currentWeight: 0, dailyCalorieGoal: 2500 });
        expect(res.body.password).toBeUndefined();
    });

    test('T13 érvényes módosítás elmentődik', async () => {
        const res = await request(app).put('/api/profile').set(bearer(token)).send(validProfile);
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject(validProfile);
    });

    test.each([
        ['üres név', { name: '  ' }],
        ['ismeretlen cél', { goal: 'Valami' }],
        ['túl kicsi kalóriacél', { dailyCalorieGoal: 100 }],
        ['túl nagy testsúly', { currentWeight: 900 }]
    ])('T14 hibás adat (%s): 400', async (_, change) => {
        const res = await request(app).put('/api/profile').set(bearer(token)).send({ ...validProfile, ...change });
        expect(res.status).toBe(400);
    });

    test('T15 megváltozott testsúly bekerül az előzményekbe, változatlan nem', async () => {
        await request(app).put('/api/profile').set(bearer(token)).send(validProfile);
        await request(app).put('/api/profile').set(bearer(token)).send({ ...validProfile, name: 'Más Név' });

        const res = await request(app).get('/api/weights').set(bearer(token));
        expect(res.body).toHaveLength(1);
        expect(res.body[0]).toMatchObject({ day: Weight.today(), weight: 80 });
    });
});

describe('Testsúly – /api/weights', () => {
    const add = (body) => request(app).post('/api/weights').set(bearer(token)).send(body);

    test('T16 rögzítés: 201, a lista időrendben jön vissza', async () => {
        expect((await add({ day: '2026-11-05', weight: 83.4 })).status).toBe(201);
        await add({ day: '2026-11-01', weight: 84.2 });

        const res = await request(app).get('/api/weights').set(bearer(token));
        expect(res.body.map(w => w.day)).toEqual(['2026-11-01', '2026-11-05']);
    });

    test('T17 ugyanarra a napra újra rögzítve felülírja, nem duplikál', async () => {
        await add({ day: '2026-11-05', weight: 83.4 });
        await add({ day: '2026-11-05', weight: 83.0 });

        const res = await request(app).get('/api/weights').set(bearer(token));
        expect(res.body).toHaveLength(1);
        expect(res.body[0].weight).toBe(83.0);
    });

    test('T18 dátum nélkül a mai napra kerül', async () => {
        const res = await add({ weight: 81 });
        expect(res.body.day).toBe(Weight.today());
    });

    test.each([
        ['hiányzó súly', { day: '2026-11-05' }],
        ['túl nagy súly', { day: '2026-11-05', weight: 600 }],
        ['jövőbeli dátum', { day: '2099-01-01', weight: 80 }],
        ['rossz dátumformátum', { day: '11/05', weight: 80 }],
        ['nem létező nap', { day: '2026-02-30', weight: 80 }]
    ])('T19 hibás adat (%s): 400', async (_, body) => {
        expect((await add(body)).status).toBe(400);
    });

    test('T20 a profil testsúlya mindig a legutolsó bejegyzés', async () => {
        await add({ day: '2026-11-08', weight: 83.1 });
        await add({ day: '2026-11-01', weight: 84.2 }); // korábbi napra utólag rögzítve
        let profile = await request(app).get('/api/profile').set(bearer(token));
        expect(profile.body.currentWeight).toBe(83.1);

        const list = await request(app).get('/api/weights').set(bearer(token));
        const latest = list.body.find(w => w.day === '2026-11-08');
        await request(app).delete(`/api/weights/${latest._id}`).set(bearer(token));
        profile = await request(app).get('/api/profile').set(bearer(token));
        expect(profile.body.currentWeight).toBe(84.2);
    });

    test('T21 más felhasználó bejegyzését nem látja és nem törölheti', async () => {
        const created = await add({ day: '2026-11-05', weight: 83.4 });
        const otherToken = await registerUser('masik@pelda.hu');

        const list = await request(app).get('/api/weights').set(bearer(otherToken));
        expect(list.body).toHaveLength(0);

        const del = await request(app).delete(`/api/weights/${created.body._id}`).set(bearer(otherToken));
        expect(del.status).toBe(404);
    });

    test('T22 nem létező / hibás azonosító törlése: 404', async () => {
        expect((await request(app).delete('/api/weights/abc').set(bearer(token))).status).toBe(404);
        expect((await request(app).delete('/api/weights/6af2f652fa7626ada97bbb11').set(bearer(token))).status).toBe(404);
    });
});
