process.env.NODE_ENV = "test";

const { TestWatcher } = require('@jest/core');
const request = require('supertest');
const app = require('./app');
const db = require('./db');

beforeEach( async () => {
    await db.query(`INSERT INTO companies (code, name, description) 
    VALUES ('sams', 'samsung', 'maker of the samsung phone')`);

    await db.query(`INSERT INTO invoices (comp_Code, amt, paid, paid_date)
    VALUES ('sams', 100, false, null)`);
})

afterEach( async () => {
    await db.query(`DELETE FROM invoices WHERE comp_code = 'sams'`);

    await db.query(`DELETE FROM companies WHERE code = 'sams'`);
})

describe("GET tests", () => {
    test("GET /companies", async ()=>{
        const resp = await request(app).get('/companies');
        expect(resp.statusCode).toBe(200);
    })

    test("GET /companies/:code", async () => {
        const resp = await request(app).get('/companies/apple');
        expect(resp.statusCode).toBe(200);
    })

    test("GET /invoices", async () => {
        const resp = await request(app).get('/invoices');
        expect(resp.statusCode).toBe(200);
    })

    test("GET /invoices/:id", async () => {
        const resp = await request(app).get('/invoices/18');
        expect(resp.statusCode).toBe(200);
    })
})

describe("POST Tests", () => {
    test("POST /companies", async () => {
        const resp = await request(app).post("/companies")
        .send({
            "code" : "BB",
            "name" : "Best Buy",
            "description" : "Store that sells electronics"
        });

        expect(resp.statusCode).toBe(201);
        await db.query("DELETE FROM companies WHERE code = 'BB'")
    })

    test("POST /invoices", async ()=>{
        const resp = await request (app).post("/invoices")
        .send({
            "comp_code" : "apple",
            "amt" : 200,
            "paid" : false,
            "paid_date" : null
        })
    })
})

describe('PUT tests', () => {
    test("PUT /companies/:code", async () => {
        const resp = await request(app).put("/companies/sams")
        .send({
            "code" : "SNG",
            "name" : "samsung",
            "description" : "samsung company"
        })

        expect(resp.statusCode).toBe(200)
        await db.query(`DELETE FROM invoices WHERE comp_code = 'SNG'`);

        await db.query(`DELETE FROM companies WHERE code = 'SNG'`);

    })

    test("PUT /invoices/id", async () => {
        const resp = await request(app).put("/invoices/19")
        .send({
            "amt" : 203
        })

        expect(resp.statusCode).toBe(200)
    })
})

describe("DELETE Tests", () => {
    test("DELETE /companies/:code", async () => {
        await db.query("DELETE FROM invoices WHERE comp_code = 'sams'");
        const resp = await request(app).delete("/companies/sams");
        expect(resp.statusCode).toBe(201);
    })

    // test("DELETE /invoices/:id", async () => {
    //     const resp = await request(app).delete("/invoices");
    //     expect(resp.statusCode).toBe(201);
    // })
})

