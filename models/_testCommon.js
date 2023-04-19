const bcrypt = require("bcrypt");

const db = require("../db.js");
const { BCRYPT_WORK_FACTOR } = require("../config");

async function commonBeforeAll() {
	// noinspection SqlWithoutWhere
	await db.query("DELETE FROM companies");
	// noinspection SqlWithoutWhere
	await db.query("DELETE FROM users");

	await db.query(`
    INSERT INTO companies(handle, name, num_employees, description, logo_url)
    VALUES ('c1', 'C1', 1, 'Desc1', 'http://c1.img'),
           ('c2', 'C2', 2, 'Desc2', 'http://c2.img'),
           ('c3', 'C3', 3, 'Desc3', 'http://c3.img')`);

	await db.query(
		`
        INSERT INTO users(username,
                          password,
                          first_name,
                          last_name,
                          email)
        VALUES ('u1', $1, 'U1F', 'U1L', 'u1@email.com'),
               ('u2', $2, 'U2F', 'U2L', 'u2@email.com')
        RETURNING username`,
		[
			await bcrypt.hash("password1", BCRYPT_WORK_FACTOR),
			await bcrypt.hash("password2", BCRYPT_WORK_FACTOR),
		]
	);
}

async function commonBeforeEach() {
	await db.query("BEGIN");
}

async function commonAfterEach() {
	await db.query("ROLLBACK");
}

async function commonAfterAll() {
	await db.end();
}

const comp1 = {
	handle: "c1",
	name: "C1",
	description: "Desc1",
	numEmployees: 1,
	logoUrl: "http://c1.img",
};

const comp2 = {
	handle: "c2",
	name: "C2",
	description: "Desc2",
	numEmployees: 2,
	logoUrl: "http://c2.img",
};

const comp3 = {
	handle: "c3",
	name: "C3",
	description: "Desc3",
	numEmployees: 3,
	logoUrl: "http://c3.img",
};

module.exports = {
	commonBeforeAll,
	commonBeforeEach,
	commonAfterEach,
	commonAfterAll,
	comp1,
	comp2,
	comp3,
};
