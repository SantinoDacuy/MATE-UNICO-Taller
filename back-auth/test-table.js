const db = require('./db');

async function testResena() {
    try {
        const { rows } = await db.query(`SELECT * FROM reseña LIMIT 1`);
        console.log("Resena:", rows);
    } catch(e) {
        console.error("FAIL", e.message);
    } finally {
        process.exit();
    }
}
testResena();
