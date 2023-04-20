"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError.js");
const Job = require("./job.js");
const {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	job1,
	job2,
	job3,
} = require("./_testCommon.js");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
	const newJob = {
		title: "new",
		salary: 50000,
		equity: 0,
		companyHandle: "c1",
	};

	test("works", async function () {
		let job = await Job.create(newJob);

		expect(job).toEqual({
			id: expect.any(Number),
			title: "new",
			salary: 50000,
			equity: "0",
			companyHandle: "c1",
		});

		const result = await db.query(
			`SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'new'`
		);
		expect(result.rows[0]).toEqual({
			id: expect.any(Number),
			title: "new",
			salary: 50000,
			equity: "0",
			company_handle: "c1",
		});
	});
});

/************************************** findAll */

describe("findAll", function () {
	test("works: no filter", async function () {
		let jobs = await Job.findAll();
		expect(jobs).toEqual([
			{
				id: expect.any(Number),
				title: "j1",
				salary: 10000,
				equity: "0",
				companyHandle: "c1",
				companyName: "C1",
			},
			{
				id: expect.any(Number),
				title: "j2",
				salary: 20000,
				equity: "0.002",
				companyHandle: "c2",
				companyName: "C2",
			},
			{
				id: expect.any(Number),
				title: "j3",
				salary: 30000,
				equity: "0.03",
				companyHandle: "c3",
				companyName: "C3",
			},
		]);
	});

	test("works: single filter", async function () {
		let jobs = await Job.findAll({ title: "2" });
		expect(jobs).toEqual([job2]);

		let jobs2 = await Job.findAll({ hasEquity: true });
		expect(jobs2).toEqual([job2, job3]);

		let jobs3 = await Job.findAll({ hasEquity: false });
		expect(jobs3).toEqual([job1, job2, job3]);

		let jobs4 = await Job.findAll({ minSalary: 20000 });
		expect(jobs4).toEqual([job2, job3]);
	});

	test("works: multiple filters", async function () {
		let jobs = await Job.findAll({ title: "j", minSalary: 30000 });
		expect(jobs).toEqual([job3]);

		let jobs2 = await Job.findAll({ title: "j", hasEquity: true });
		expect(jobs2).toEqual([job2, job3]);

		let jobs3 = await Job.findAll({
			minSalary: 20000,
			hasEquity: true,
		});
		expect(jobs3).toEqual([job2, job3]);

		let jobs4 = await Job.findAll({
			title: "notfound",
			minSalary: 1,
		});
		expect(jobs4).toEqual([]);

		let jobs5 = await Job.findAll({
			minSalary: 10,
			hasEquity: false,
		});
		expect(jobs5).toEqual([job1, job2, job3]);
	});
});

/************************************** get */

describe("get", function () {
	test("works", async function () {
		job1.id = job1ID;
		let job = await Job.get(job1.id);
		expect(job).toEqual(job1);
	});

	test("not found if no such job", async function () {
		try {
			await Job.get(0);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/************************************** update */

describe("update", function () {
	const updateData = {
		title: "new",
		salary: 50000,
		equity: 0.999,
		companyHandle: "c3",
	};

	test("works", async function () {
		let job = await Job.update(job1ID, updateData);
		updateData.equity = updateData.equity.toString();
		expect(job).toEqual({
			id: job1ID,
			...updateData,
		});

		const result = await db.query(
			`SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
			[job1ID]
		);
		expect(result.rows).toEqual([
			{
				id: job1ID,
				...updateData,
			},
		]);
	});

	test("works: null fields", async function () {
		const updateDataSetNulls = {
			title: "new",
			salary: null,
			equity: null,
			companyHandle: "c3",
		};

		let job = await Job.update(job1ID, updateDataSetNulls);
		expect(job).toEqual({
			id: job1ID,
			...updateDataSetNulls,
		});

		const result = await db.query(
			`SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
			[job1ID]
		);
		expect(result.rows).toEqual([
			{
				id: job1ID,
				...updateDataSetNulls,
			},
		]);
	});

	test("not found if no such job", async function () {
		try {
			await Job.update(0, updateData);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	test("bad request with no data", async function () {
		try {
			await Job.update(job1ID, {});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

/************************************** remove */

describe("remove", function () {
	test("works", async function () {
		await Job.remove(job1ID);
		const res = await db.query("SELECT title FROM jobs WHERE id= $1", [job1ID]);
		expect(res.rows.length).toEqual(0);
	});

	test("not found if no such job", async function () {
		try {
			await Job.remove(0);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});
