const { app, request, startDb, stopDb, clearDb, registerUser, bearer } = require('./helpers');

beforeAll(startDb);
afterAll(stopDb);

let token, otherToken;
beforeEach(async () => {
    await clearDb();
    token = await registerUser('elso@pelda.hu');
    otherToken = await registerUser('masodik@pelda.hu');
});

const workout = {
    muscleGroup: 'Mell',
    exercises: [{ name: 'Fekvenyomás', sets: 3, reps: 10, weight: 60 }]
};

const meal = {
    mealType: 'Ebéd',
    foods: [{ name: 'Csirkemell rizzsel', calories: 650, protein: 45, carbs: 70, fat: 12 }],
    totalCalories: 650
};

describe('Edzések – /api/workouts', () => {
    const create = (t = token, body = workout) => request(app).post('/api/workouts').set(bearer(t)).send(body);
    const list = (t = token) => request(app).get('/api/workouts').set(bearer(t));

    test('T23 mentés: 201, majd megjelenik a saját listában', async () => {
        expect((await create()).status).toBe(201);
        const res = await list();
        expect(res.body).toHaveLength(1);
        expect(res.body[0]).toMatchObject({ muscleGroup: 'Mell' });
        expect(res.body[0].exercises[0]).toMatchObject(workout.exercises[0]);
    });

    test('T24 hiányzó adatokkal: 400', async () => {
        expect((await create(token, { muscleGroup: 'Mell' })).status).toBe(400);
    });

    test('T24b hiányos gyakorlattal (nincs ismétlésszám): 400', async () => {
        const res = await create(token, { muscleGroup: 'Mell', exercises: [{ name: 'Fekvenyomás', sets: 3, weight: 60 }] });
        expect(res.status).toBe(400);
    });

    test('T25 a lista csak a saját edzéseket tartalmazza, a legújabb elöl', async () => {
        await create(token, { ...workout, muscleGroup: 'Hát' });
        await create(token, { ...workout, muscleGroup: 'Láb' });
        await create(otherToken);

        const res = await list();
        expect(res.body.map(w => w.muscleGroup)).toEqual(['Láb', 'Hát']);
    });

    test('T26 módosítás: 200, a dátum nem változik', async () => {
        await create();
        const [original] = (await list()).body;

        const res = await request(app).put(`/api/workouts/${original._id}`).set(bearer(token))
            .send({ muscleGroup: 'Hát', exercises: [{ name: 'Húzódzkodás', sets: 4, reps: 8, weight: 0 }] });

        expect(res.status).toBe(200);
        expect(res.body.muscleGroup).toBe('Hát');
        expect(res.body.date).toBe(original.date);
    });

    test('T27 üres gyakorlatlistával nem módosítható: 400', async () => {
        await create();
        const [original] = (await list()).body;
        const res = await request(app).put(`/api/workouts/${original._id}`).set(bearer(token))
            .send({ muscleGroup: 'Hát', exercises: [] });
        expect(res.status).toBe(400);
    });

    test('T28 más felhasználó edzése nem módosítható és nem törölhető: 404', async () => {
        await create();
        const [original] = (await list()).body;

        const put = await request(app).put(`/api/workouts/${original._id}`).set(bearer(otherToken)).send(workout);
        const del = await request(app).delete(`/api/workouts/${original._id}`).set(bearer(otherToken));
        expect(put.status).toBe(404);
        expect(del.status).toBe(404);
        expect((await list()).body).toHaveLength(1);
    });

    test('T29 törlés: 200, utána a lista üres', async () => {
        await create();
        const [original] = (await list()).body;
        const res = await request(app).delete(`/api/workouts/${original._id}`).set(bearer(token));
        expect(res.status).toBe(200);
        expect((await list()).body).toHaveLength(0);
    });
});

describe('Étkezések – /api/meals', () => {
    const create = (t = token, body = meal) => request(app).post('/api/meals').set(bearer(t)).send(body);
    const list = (t = token) => request(app).get('/api/meals').set(bearer(t));

    test('T30 mentés: 201, a bejelentkezett felhasználóhoz kerül', async () => {
        const res = await create();
        expect(res.status).toBe(201);
        expect(res.body.totalCalories).toBe(650);
        expect((await list()).body).toHaveLength(1);
        expect((await list(otherToken)).body).toHaveLength(0);
    });

    test('T31 a kérésben küldött userId-t figyelmen kívül hagyja (nem lehet más nevében menteni)', async () => {
        const other = await request(app).get('/api/profile').set(bearer(otherToken));
        await create(token, { ...meal, userId: other.body._id });
        expect((await list(otherToken)).body).toHaveLength(0);
    });

    test('T32 hiányzó étkezéstípussal: 400', async () => {
        expect((await create(token, { foods: meal.foods })).status).toBe(400);
    });

    test('T33 módosítás: 200', async () => {
        const created = await create();
        const res = await request(app).put(`/api/meals/${created.body._id}`).set(bearer(token))
            .send({ ...meal, mealType: 'Vacsora', totalCalories: 700 });
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ mealType: 'Vacsora', totalCalories: 700 });
    });

    test('T34 más felhasználó étkezése nem módosítható és nem törölhető: 404', async () => {
        const created = await create();
        const put = await request(app).put(`/api/meals/${created.body._id}`).set(bearer(otherToken)).send(meal);
        const del = await request(app).delete(`/api/meals/${created.body._id}`).set(bearer(otherToken));
        expect(put.status).toBe(404);
        expect(del.status).toBe(404);
    });

    test('T35 törlés: 200, utána a lista üres', async () => {
        const created = await create();
        const res = await request(app).delete(`/api/meals/${created.body._id}`).set(bearer(token));
        expect(res.status).toBe(200);
        expect((await list()).body).toHaveLength(0);
    });
});
