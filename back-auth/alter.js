const db = require('./db');

async function run() {
    try {
        await db.query("ALTER TABLE venta ADD COLUMN estado_envio VARCHAR(50) DEFAULT 'Pendiente de envío';");
        console.log("Columna estado_envio agregada correctamente.");
    } catch (e) {
        if (e.message.includes("already exists")) {
            console.log("La columna ya existe.");
        } else {
            console.error(e);
        }
    }
    process.exit(0);
}

run();
