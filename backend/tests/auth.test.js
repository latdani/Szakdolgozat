const { app, request, startDb, stopDb, clearDb, registerUser, bearer } = require('./helpers');

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

describe('Regisztráció – POST /api/register', () => {
    test('T01 sikeres regisztráció: 201, token és felhasználó jelszó nélkül', async () => {
        const res = await request(app).post('/api/register')
            .send({ email: 'uj@pelda.hu', password: 'jelszo123', name: 'Új Felhasználó' });

        expect(res.status).toBe(201);
        expect(res.body.token).toBeDefined();
        expect(res.body.user).toMatchObject({ email: 'uj@pelda.hu', name: 'Új Felhasználó' });
        expect(res.body.user.password).toBeUndefined();
    });

    test('T02 hiányzó e-mail vagy jelszó: 400', async () => {
        const res = await request(app).post('/api/register').send({ email: 'uj@pelda.hu' });
        expect(res.status).toBe(400);
    });

    test('T03 6 karakternél rövidebb jelszó: 400', async () => {
        const res = await request(app).post('/api/register').send({ email: 'uj@pelda.hu', password: '12345' });
        expect(res.status).toBe(400);
    });

    test('T04 már regisztrált e-mail cím: 400', async () => {
        await registerUser('uj@pelda.hu');
        const res = await request(app).post('/api/register').send({ email: 'uj@pelda.hu', password: 'masik123' });
        expect(res.status).toBe(400);
    });
});

describe('Bejelentkezés – POST /api/login', () => {
    beforeEach(() => registerUser('belep@pelda.hu', 'jelszo123'));

    test('T05 helyes adatokkal: 200 és token', async () => {
        const res = await request(app).post('/api/login').send({ email: 'belep@pelda.hu', password: 'jelszo123' });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();
    });

    test('T06 hibás jelszóval: 401', async () => {
        const res = await request(app).post('/api/login').send({ email: 'belep@pelda.hu', password: 'rossz-jelszo' });
        expect(res.status).toBe(401);
    });

    test('T07 nem létező e-mail címmel: 401 (ugyanaz az üzenet, mint hibás jelszónál)', async () => {
        const res = await request(app).post('/api/login').send({ email: 'nincs@pelda.hu', password: 'jelszo123' });
        expect(res.status).toBe(401);
        expect(res.body.message).toBe('Hibás email vagy jelszó!');
    });

    test('T08 hiányzó adatokkal: 400', async () => {
        const res = await request(app).post('/api/login').send({});
        expect(res.status).toBe(400);
    });
});

describe('Védett végpontok (JWT)', () => {
    const protectedRoutes = ['/api/profile', '/api/workouts', '/api/meals', '/api/weights'];

    test.each(protectedRoutes)('T09 token nélkül: 401 – %s', async (url) => {
        const res = await request(app).get(url);
        expect(res.status).toBe(401);
    });

    test.each(protectedRoutes)('T10 érvénytelen tokennel: 401 – %s', async (url) => {
        const res = await request(app).get(url).set(bearer('ez-nem-token'));
        expect(res.status).toBe(401);
    });

    test('T11 érvényes tokennel: 200', async () => {
        const token = await registerUser();
        const res = await request(app).get('/api/profile').set(bearer(token));
        expect(res.status).toBe(200);
    });
});
