// Importamos las librerías que instalamos
const { Pool } = require('pg'); // El conector de PostgreSQL
require('dotenv').config(); // Para leer el archivo .env

// Creamos un "pool" de conexiones
// Lee la configuración del archivo .env automáticamente
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Exportamos una función para hacer consultas
module.exports = {
    query: (text, params) => pool.query(text, params),
};