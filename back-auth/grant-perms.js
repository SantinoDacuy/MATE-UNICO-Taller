const db = require('./db');

async function grantAll() {
    try {
        console.log("Intentando dar permisos de SELECT, INSERT... a rol_administrador en las tablas reseña y strapi_producto_map...");
        
        await db.query(`GRANT ALL PRIVILEGES ON TABLE "reseña" TO rol_administrador;`);
        console.log("Permisos otorgados en reseña.");
        
        await db.query(`GRANT ALL PRIVILEGES ON TABLE "strapi_producto_map" TO rol_administrador;`);
        console.log("Permisos otorgados en strapi_producto_map.");
        
    } catch(e) {
        console.error("FAIL", e.message);
    } finally {
        process.exit();
    }
}
grantAll();
