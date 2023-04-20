"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
	/** Create a job (from data), update db, return new job data.
	 *
	 * data should be { title, salary, equity, companyHandle}
	 *
	 * Returns { id, title, salary, equity, companyHandle}
	 *
	 * Throws BadRequestError if job already in database.
	 * */

	static async create(data) {
		const result = await db.query(
			`INSERT INTO jobs (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
			[data.title, data.salary, data.equity, data.companyHandle]
		);
		const job = result.rows[0];

		return job;
	}

	/** Find all jobs.
	 *
	 * Can pass in one or more optional searchFilters
	 * - title
	 * - minSalary  	(integer)
	 * - hasEquity      (boolean)
	 *
	 * Returns [{ id, title, salary, equity, companyHandle, companyName}, ...]
	 * */

	static async findAll(searchFilters = {}) {
        let query = `SELECT j.id,
                            j.title,
                            j.salary,
                            j.equity,
                            j.company_handle AS "companyHandle",
                            c.name AS "companyName"
                     FROM jobs j
                        LEFT JOIN companies c ON j.company_handle = c.handle`;

		let whereExpressions = [];
		let queryValues = [];

		const { title, minSalary, hasEquity } = searchFilters;

		// If an allowed search term exists, push to whereExpressions and queryValues to generate the right SQL

		if (title) {
			queryValues.push(`%${title}%`);
			whereExpressions.push(`j.title ILIKE $${queryValues.length}`);
		}

		if (minSalary !== undefined) {
			queryValues.push(minSalary);
			whereExpressions.push(`j.salary >= $${queryValues.length}`);
		}

		if (hasEquity) {
			queryValues.push(0);
			whereExpressions.push(`j.equity > $${queryValues.length}`);
		}

		if (whereExpressions.length > 0) {
			query += " WHERE " + whereExpressions.join(" AND ");
		}

		// finish building query
		query += " ORDER BY j.title";
		const jobsRes = await db.query(query, queryValues);
		return jobsRes.rows;
	}

	/** Given a job, return data about company.
	 *
	 * Returns { id, title, salary, equity, companyHandle, companyName }
	 *
	 * Throws NotFoundError if not found.
	 **/

	static async get(id) {
		const jobRes = await db.query(
			`SELECT j.id,
                    j.title,
                    j.salary,
                    j.equity,
                    j.company_handle AS "companyHandle",
					c.name AS "companyName"
             FROM jobs j
			 	LEFT JOIN companies c
					ON j.company_handle = c.handle
             WHERE id = $1`,
			[id]
		);

		const job = jobRes.rows[0];

		if (!job) throw new NotFoundError(`No job with ID: ${id}`);

		return job;
	}

	/** Update company data with `data`.
	 *
	 * This is a "partial update" --- it's fine if data doesn't contain all the
	 * fields; this only changes provided ones.
	 *
	 * Data can include: {title, salary, equity, companyHandle}
	 *
	 * Returns {id, title, salary, equity, company_handle}
	 *
	 * Throws NotFoundError if not found.
	 */

	static async update(id, data) {
		const { setCols, values } = sqlForPartialUpdate(data, {
			companyHandle: "company_handle"
		});
		const idVarIdx = "$" + (values.length + 1);

		const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
		const result = await db.query(querySql, [...values, id]);
		const job = result.rows[0];

		if (!job) throw new NotFoundError(`No job ID: ${id}`);

		return job;
	}

	/** Delete given company from database; returns undefined.
	 *
	 * Throws NotFoundError if company not found.
	 **/

	static async remove(id) {
		const result = await db.query(
			`DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
			[id]
		);
		const job = result.rows[0];

		if (!job) throw new NotFoundError(`No job ID: ${id}`);
	}
}

module.exports = Job;
