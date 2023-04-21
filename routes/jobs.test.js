"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	u1Token,
	u2AdminToken,
	testJobs,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
	const newJob = {
		title: "new",
		salary: 50000,
		equity: 0,
		companyHandle: "c1",
	};

	test("ok for admin", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send(newJob)
			.set("authorization", `Bearer ${u2AdminToken}`);
		expect(resp.statusCode).toEqual(201);

		newJob.equity = newJob.equity.toString();
		const job = { id: expect.any(Number), ...newJob };
		expect(resp.body).toEqual({ job });
	});

	test("unauthorized for users", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send(newJob)
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("bad request with missing data", async function () {
		const resp = await request(app)
			.post("/jobs")
			.send({
				title: "new",
				salary: 10,
			})
			.set("authorization", `Bearer ${u2AdminToken}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("bad request with invalid data", async function () {
		newJob.salary = "3000";
		const resp = await request(app)
			.post("/jobs")
			.send({ newJob })
			.set("authorization", `Bearer ${u2AdminToken}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
	test("ok for anon", async function () {
		const resp = await request(app).get("/jobs");
		expect(resp.body).toEqual({
			jobs: [
				{ ...testJobs[0], companyName: "C1" },
				{ ...testJobs[1], companyName: "C2" },
				{ ...testJobs[2], companyName: "C3" },
			],
		});
	});

	test("fails: test next() handler", async function () {
		// there's no normal failure event which will cause this route to fail ---
		// thus making it hard to test that the error-handler works with it. This
		// should cause an error, all right :)
		await db.query("DROP TABLE jobs CASCADE");
		const resp = await request(app)
			.get("/jobs")
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(500);
	});

	test("filters jobs by title.", async () => {
		const resp = await request(app).get("/jobs?title=3");
		expect(resp.body).toEqual({
			jobs: [{ ...testJobs[2], companyName: "C3" }],
		});

		const resp2 = await request(app).get("/jobs?title=1");
		expect(resp2.body).toEqual({
			jobs: [{ ...testJobs[0], companyName: "C1" }],
		});
	});

	test("filters jobs by minimum salary.", async () => {
		const resp = await request(app).get("/jobs?minSalary=20000");
		expect(resp.body).toEqual({
			jobs: [
				{ ...testJobs[1], companyName: "C2" },
				{ ...testJobs[2], companyName: "C3" },
			],
		});
	});

	test("filters jobs by hasEquity.", async () => {
		const resp = await request(app).get("/jobs?hasEquity=true");
		expect(resp.body).toEqual({
			jobs: [
				{ ...testJobs[1], companyName: "C2" },
				{ ...testJobs[2], companyName: "C3" },
			],
		});

		const resp2 = await request(app).get("/jobs?hasEquity=TrUe");
		expect(resp2.body).toEqual({
			jobs: [
				{ ...testJobs[1], companyName: "C2" },
				{ ...testJobs[2], companyName: "C3" },
			],
		});

		const resp3 = await request(app).get("/jobs?hasEquity=false");
		expect(resp3.body).toEqual({
			jobs: [
				{ ...testJobs[0], companyName: "C1" },
				{ ...testJobs[1], companyName: "C2" },
				{ ...testJobs[2], companyName: "C3" },
			],
		});

		const resp4 = await request(app).get("/jobs?hasEquity=ANYTHING");
		expect(resp3.body).toEqual({
			jobs: [
				{ ...testJobs[0], companyName: "C1" },
				{ ...testJobs[1], companyName: "C2" },
				{ ...testJobs[2], companyName: "C3" },
			],
		});
	});

	test("multiple filters should work.", async () => {
		const resp = await request(app).get(
			"/jobs?title=j&minSalary=20000&hasEquity=true"
		);
		expect(resp.body).toEqual({
			jobs: [
				{ ...testJobs[1], companyName: "C2" },
				{ ...testJobs[2], companyName: "C3" },
			],
		});
		const resp2 = await request(app).get(
			"/jobs?title=j&hasEquity=true&minSalary=100000"
		);
		expect(resp2.body).toEqual({
			jobs: [],
		});
	});

	test("unknown filters should throw an error", async () => {
		const resp = await request(app).get("/jobs?weirdFilter=9");
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** GET /jobs/:handle */

describe("GET /jobs/:id", function () {
	test("works for anon", async function () {
		const resp = await request(app).get(`/jobs/${testJobs[0].id}`);
        expect(resp.body).toEqual({ job: { ...testJobs[0], companyName: "C1" } });
	});


	test("not found for no such job", async function () {
		const resp = await request(app).get(`/jobs/0`);
		expect(resp.statusCode).toEqual(404);
	});
});

/************************************** PATCH /jobs/:handle */

describe("PATCH /jobs/:handle", function () {
	test("works for users", async function () {
		const resp = await request(app)
			.patch(`/jobs/${testJobs[0].id}`)
			.send({
				title: "J1-new",
			})
            .set("authorization", `Bearer ${u2AdminToken}`);
        testJobs[0].title="J1-new"
		expect(resp.body).toEqual({
			job: testJobs[0],
		});
	});

	test("unauth for users", async function () {
        const resp = await request(app)
        .patch(`/jobs/${testJobs[0].id}`)
        .send({ name: "J1-new" })
        .set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});
    
    test("unauth for anon", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobs[0].id}`)
            .send({name: "J1-new",});
            expect(resp.statusCode).toEqual(401);
        });
        
	test("not found on no such company", async function () {
		const resp = await request(app)
			.patch(`/jobs/0`)
			.send({
				title: "J1-new",
			})
			.set("authorization", `Bearer ${u2AdminToken}`);
		expect(resp.statusCode).toEqual(404);
	});

	test("bad request on id change attempt", async function () {
		const resp = await request(app)
			.patch(`/jobs/${testJobs[0].id}`)
			.send({
				id: 99,
			})
			.set("authorization", `Bearer ${u2AdminToken}`);
		expect(resp.statusCode).toEqual(400);
	});

	test("bad request on invalid data", async function () {
		const resp = await request(app)
			.patch(`/jobs/${testJobs[0].id}`)
			.send({
				salary: "not-a-number",
			})
			.set("authorization", `Bearer ${u2AdminToken}`);
		expect(resp.statusCode).toEqual(400);
	});
    	
    test("bad request on unaccepted proprety", async function () {
		const resp = await request(app)
			.patch(`/jobs/${testJobs[0].id}`)
			.send({
				hasBenefits: true,
			})
			.set("authorization", `Bearer ${u2AdminToken}`);
		expect(resp.statusCode).toEqual(400);
	});
});

/************************************** DELETE /jobs/:handle */

describe("DELETE /jobs/:handle", function () {
	test("works for admin", async function () {
		const resp = await request(app)
			.delete(`/jobs/${testJobs[0].id}`)
			.set("authorization", `Bearer ${u2AdminToken}`);
		expect(resp.body).toEqual({ deleted: testJobs[0].id });
	});

	test("unauth for users", async function () {
		const resp = await request(app)
			.delete(`/jobs/${testJobs[0].id}`)
			.set("authorization", `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("unauth for anon", async function () {
		const resp = await request(app).delete(`/jobs/${testJobs[0].id}`);
		expect(resp.statusCode).toEqual(401);
	});

	test("not found for no such job", async function () {
		const resp = await request(app)
			.delete(`/jobs/0`)
			.set("authorization", `Bearer ${u2AdminToken}`);
		expect(resp.statusCode).toEqual(404);
	});
});
