const { Pool } = require('pg');
const pool = new Pool({
  user: 'rol_administrador',
  host: 'localhost',
  database: 'mate-unico',
  password: 'admin123',
  port: 5432,
});

async function run() {
  try {
    console.log("Altering table...");
    await pool.query('ALTER TABLE detalle_venta ADD COLUMN IF NOT EXISTS nombre_producto VARCHAR(255)');
    console.log("Success! Column added.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}
run();
