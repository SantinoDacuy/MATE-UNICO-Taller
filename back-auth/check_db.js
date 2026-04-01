const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function check() {
    try {
        const tables = await pool.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'");
        console.log('Tables:', tables.rows.map(r => r.tablename));

        const userCount = await pool.query('SELECT COUNT(*) FROM usuario');
        console.log('User count:', userCount.rows[0].count);

        if (userCount.rows[0].count > 0) {
            const lastUser = await pool.query('SELECT id, email, nombre, apellido, calle, numero, id_ciudad FROM usuario ORDER BY id DESC LIMIT 1');
            console.log('Last user:', JSON.stringify(lastUser.rows[0], null, 2));
        }

        const cityCount = await pool.query('SELECT COUNT(*) FROM ciudad');
        console.log('City count:', cityCount.rows[0].count);

    } catch (err) {
        console.error('DB check failed:', err.message);
    } finally {
        await pool.end();
    }
}

check();
