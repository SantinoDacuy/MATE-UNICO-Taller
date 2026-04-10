require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { OAuth2Client } = require('google-auth-library');
const db = require('./db'); // Importamos nuestra conexión a la BD
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { sendOrderConfirmation } = require('./services/emailService');
const { checkStockBeforePayment, deductStockFromStrapi } = require('./services/stockService');

const app = express();
const PORT = 3001; // Puerto para el back-end

// Configuración de Mercado Pago
const clientMP = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middlewares
// CORS: permitir uno o varios orígenes del frontend y credenciales para cookies de sesión
// FRONTEND_ORIGIN puede ser una lista separada por comas
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5174';
const allowedOrigins = FRONTEND_ORIGIN.split(',').map(s => s.trim());
app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like Postman, server-to-server)
        if (!origin) return callback(null, true);
        // allow explicit origins from env
        if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
        // allow any localhost origin during development (ports may vary)
        try {
            const url = new URL(origin);
            if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return callback(null, true);
        } catch (e) {
            // ignore parse errors
        }
        const msg = `Origin ${origin} not allowed by CORS`;
        return callback(new Error(msg), false);
    },
    credentials: true
}));
app.use(express.json()); // Permite leer JSON que venga en el body

// Sessions: para mantener al usuario logueado entre peticiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }, // 1 día
}));

/*
=================================================
RUTA DE PRUEBA (para ver si todo funciona)
=================================================
*/
app.get('/', (req, res) => {
    res.send('API de Mate Único funcionando');
});

/*
=================================================
RUTA REAL: OBTENER TODOS LOS PRODUCTOS
=================================================
*/
app.get('/api/productos', async (req, res) => {
    try {
        // Usamos el 'db' que importamos para hacer una consulta
        const { rows } = await db.query('SELECT * FROM Producto');
        res.json(rows); // Enviamos los productos como respuesta JSON
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

/*
=================================================
RUTA: VERIFICAR ID TOKEN DE GOOGLE (POST)
Recibe { credential } desde el frontend (ID token JWT)
Verifica con Google y devuelve el payload (email, sub, name...)
=================================================
*/
app.post('/auth/google', async (req, res) => {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Missing credential' });
    console.log('POST /auth/google received credential length:', credential ? credential.length : 0);
    try {
        const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        console.log('Google payload:', { email: payload.email, sub: payload.sub, name: payload.name });
        // Buscar por email en la tabla Usuario
        const email = payload.email;
        const nombre = payload.given_name || 'SinNombre';
        const apellido = payload.family_name || 'SinApellido';
        const foto = payload.picture || null;

        let userId = null;
        try {
            const { rows } = await db.query('SELECT id FROM Usuario WHERE email = $1', [email]);
            if (rows.length > 0) {
                userId = rows[0].id;
            } else {
                const insertQuery = `INSERT INTO Usuario (activo, fecha_registro, telefono, email, apellido, nombre, es_admin) VALUES (true, CURRENT_DATE, NULL, $1, $2, $3, false) RETURNING id`;
                // Try to insert with foto_url if column exists; if not, fall back
                let insertRes;
                try {
                    const insertQuery = `INSERT INTO Usuario (activo, fecha_registro, telefono, email, apellido, nombre, es_admin, foto_url) VALUES (true, CURRENT_DATE, NULL, $1, $2, $3, false, $4) RETURNING id`;
                    insertRes = await db.query(insertQuery, [email, apellido, nombre, foto]);
                } catch (e) {
                    // column foto_url may not exist; try without it
                    const insertQuery = `INSERT INTO Usuario (activo, fecha_registro, telefono, email, apellido, nombre, es_admin) VALUES (true, CURRENT_DATE, NULL, $1, $2, $3, false) RETURNING id`;
                    insertRes = await db.query(insertQuery, [email, apellido, nombre]);
                }
                userId = insertRes.rows[0].id;
            }
        } catch (dbError) {
            console.error('DB error creating/finding user:', dbError);

            // ¡ELIMINAMOS EL RETURN QUE CORTABA EL CÓDIGO ACÁ!

            // store some profile info in session as fallback
            req.session.user = { email: payload.email, nombre, apellido, picture: foto };

            // Y CAMBIAMOS EL STATUS 500 POR UN 200 (json success: true) 
            // Para que React sepa que pudimos entrar en modo fallback
            return res.json({ success: true, fallback: true, payload });
        }

        // Guardar userId en la sesión
        req.session.userId = userId;
        // also save a minimal user object in session for fallback
        req.session.user = { id: userId, email, nombre, apellido, picture: foto };
        console.log('User logged in, id:', userId);
        return res.json({ success: true, userId, payload });
    } catch (error) {
        console.error('Error verificando ID token:', error);
        return res.status(401).json({ success: false, error: 'Invalid ID token' });
    }
});

/*
=================================================
RUTA: OBTENER/ACTUALIZAR PERFIL DEL USUARIO
GET  /api/user/me  => devuelve datos del usuario en sesión (intenta DB, si falla usa sesión)
POST /api/user/me  => actualiza campos editables (nombre, apellido, telefono, calle, numero)
=================================================
*/
app.get('/api/user/me', async (req, res) => {
    if (!req.session || !req.session.userId) {
        // if session has fallback user
        if (req.session && req.session.user) return res.json({ loggedIn: true, user: req.session.user });
        return res.status(401).json({ loggedIn: false });
    }
    try {
        const { rows } = await db.query('SELECT id, email, nombre, apellido, telefono, calle, numero, foto_url, favoritos_json FROM Usuario WHERE id = $1', [req.session.userId]);
        if (!rows || rows.length === 0) return res.status(404).json({ loggedIn: false });
        const user = rows[0];
        // normalize foto_url field name to picture for frontend
        user.picture = user.foto_url || (req.session.user && req.session.user.picture) || null;
        // parse favoritos_json into favoritos array if present
        try {
            user.favoritos = user.favoritos_json ? JSON.parse(user.favoritos_json) : [];
            delete user.favoritos_json;
        } catch (e) {
            user.favoritos = [];
        }
        return res.json({ loggedIn: true, user });
    } catch (err) {
        console.error('Error fetching user from DB:', err);
        // fallback to session user if available
        if (req.session && req.session.user) return res.json({ loggedIn: true, user: req.session.user });
        return res.status(500).json({ loggedIn: false });
    }
});

app.post('/api/user/me', async (req, res) => {
    if (!req.session || !req.session.userId) return res.status(401).json({ success: false });
    const { nombre, apellido, telefono, calle, numero, picture } = req.body;
    try {
        // try to update foto_url if column exists
        try {
            await db.query(`UPDATE Usuario SET nombre=$1, apellido=$2, telefono=$3, calle=$4, numero=$5, foto_url=COALESCE($6,foto_url) WHERE id=$7`, [nombre, apellido, telefono, calle, numero, picture || null, req.session.userId]);
        } catch (e) {
            // column foto_url may not exist; update without it
            await db.query(`UPDATE Usuario SET nombre=$1, apellido=$2, telefono=$3, calle=$4, numero=$5 WHERE id=$6`, [nombre, apellido, telefono, calle, numero, req.session.userId]);
        }
        // refresh session user
        req.session.user = { id: req.session.userId, email: req.session.user ? req.session.user.email : null, nombre, apellido, picture };
        return res.json({ success: true });
    } catch (err) {
        console.error('Error updating user:', err);
        // fallback: update session only
        req.session.user = { ...(req.session.user || {}), nombre, apellido, telefono, calle, numero, picture };
        return res.status(500).json({ success: false, error: 'DB update failed, changes saved in session only' });
    }
});

/*
=================================================
RUTA: AGREGAR/QUITAR FAVORITOS
POST /api/user/favoritos
=================================================
*/
app.post('/api/user/favoritos', async (req, res) => {
    // Verificamos sesión
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, error: 'No logueado' });
    }

    const { id, nombre, color } = req.body;
    const userId = req.session.userId;

    try {
        // 1. Buscamos los favoritos actuales del usuario
        const { rows } = await db.query('SELECT favoritos_json FROM Usuario WHERE id = $1', [userId]);

        // 2. Parseamos el JSON (si está vacío, creamos un array nuevo)
        let favoritos = [];
        try {
            favoritos = rows[0].favoritos_json ? JSON.parse(rows[0].favoritos_json) : [];
        } catch (e) {
            favoritos = [];
        }

        // 3. Lógica de Toggle: Si ya está, lo quitamos. Si no está, lo agregamos.
        const index = favoritos.findIndex(f => String(f.id) === String(id));

        if (index > -1) {
            favoritos.splice(index, 1); // Quitar de favoritos
        } else {
            favoritos.push({ id, nombre, color }); // Agregar a favoritos
        }

        // 4. Guardamos el nuevo array como JSON en la DB
        await db.query('UPDATE Usuario SET favoritos_json = $1 WHERE id = $2', [JSON.stringify(favoritos), userId]);

        return res.json({ success: true, isFavorite: index === -1 });
    } catch (err) {
        console.error('Error en favoritos:', err);
        return res.status(500).json({ success: false, error: 'Error de base de datos' });
    }
});

/*
=================================================
SISTEMA DE RESEÑAS Y OPINIONES
=================================================
*/

// 1. Verificar si el usuario puede dejar reseña (compró el producto)
// Función auxiliar para mapear documentId de Strapi a id_producto de PostgreSQL
const getProductIdFromDocumentId = async (documentId) => {
    try {
        // Primero, intentar como número directo (compatibilidad)
        const numId = parseInt(documentId, 10);
        if (!isNaN(numId)) {
            let result = await db.query(
                `SELECT id FROM "Producto" WHERE id = $1 LIMIT 1`,
                [numId]
            );
            if (result.rows.length > 0) {
                console.log(`✓ Producto encontrado por ID directo: ${numId}`);
                return numId;
            }
        }

        // Buscar en strapi_producto_map usando strapi_document_id
        let result = await db.query(
            `SELECT producto_id FROM strapi_producto_map WHERE strapi_document_id = $1 LIMIT 1`,
            [documentId]
        );

        if (result.rows.length > 0 && result.rows[0].producto_id) {
            console.log(`✓ Producto encontrado vía strapi_producto_map: ${result.rows[0].producto_id}`);
            return result.rows[0].producto_id;
        }

        console.warn(`⚠️ No se encontró Producto para documentId: ${documentId}`);
        return null;
    } catch (err) {
        console.error('Error mapeando documentId:', err);
        return null;
    }
};

app.get('/api/reviews/can-review', async (req, res) => {
    if (!req.session || !req.session.userId) return res.status(401).json({ canReview: false });

    const { productId, productType } = req.query;
    const userId = req.session.userId;

    try {
        // Mapear documentId a id_producto
        const dbProductId = productType === 'combo' ? productId : await getProductIdFromDocumentId(productId);

        if (!dbProductId) {
            return res.json({ canReview: false, message: '⚠️ Producto no encontrado.' });
        }

        // Buscar descripcion del producto para agrupar duplicados
        let dbDescripcion = '';
        const table = productType === 'combo' ? 'combo' : 'producto';
        const descQuery = await db.query(`SELECT descripcion FROM ${table} WHERE id = $1`, [dbProductId]);
        if (descQuery.rows.length > 0) {
            dbDescripcion = descQuery.rows[0].descripcion;
        }

        // Buscar si el usuario compró este producto (o su duplicado por nombre)
        let query;
        let paramsPurchase;
        if (productType === 'combo') {
            query = `
                SELECT COUNT(*) as count
                FROM venta v
                JOIN detalle_venta dv ON v.id = dv.id_venta
                JOIN combo c ON dv.id_combo = c.id
                WHERE v.id_usuario = $1 
                AND LOWER(c.descripcion) = LOWER($2)
                AND BTRIM(LOWER(v.estado)) != 'pendiente'`;
            paramsPurchase = [userId, dbDescripcion];
        } else {
            query = `
                SELECT COUNT(*) as count
                FROM venta v
                JOIN detalle_venta dv ON v.id = dv.id_venta
                JOIN producto p ON dv.id_producto = p.id
                WHERE v.id_usuario = $1 
                AND LOWER(p.descripcion) = LOWER($2)
                AND BTRIM(LOWER(v.estado)) != 'pendiente'`;
            paramsPurchase = [userId, dbDescripcion];
        }

        const { rows: purchaseCheck } = await db.query(query, paramsPurchase);
        const hasPurchased = purchaseCheck[0].count > 0;

        if (!hasPurchased) {
            return res.json({ canReview: false, message: '🔒 Debes comprar este producto para dejar una opinión.' });
        }

        // Verificar si ya dejó reseña (en cualquiera de las versiones del producto)
        let reviewCheckQuery;
        let reviewCheckParams;
        if (productType === 'combo') {
            reviewCheckQuery = `
                SELECT r.id 
                FROM reseña r
                JOIN combo c ON r.id_combo = c.id
                WHERE r.id_usuario = $1 AND LOWER(c.descripcion) = LOWER($2)`;
            reviewCheckParams = [userId, dbDescripcion];
        } else {
            reviewCheckQuery = `
                SELECT r.id 
                FROM reseña r
                JOIN producto p ON r.id_producto = p.id
                WHERE r.id_usuario = $1 AND LOWER(p.descripcion) = LOWER($2)`;
            reviewCheckParams = [userId, dbDescripcion];
        }
        const reviewCheck = await db.query(reviewCheckQuery, reviewCheckParams);

        if (reviewCheck.rows.length > 0) {
            return res.json({ canReview: false, message: '✓ Ya dejaste una opinión en este producto.' });
        }

        res.locals.dbProductId = dbProductId;
        return res.json({ canReview: true });
    } catch (err) {
        console.error('Error verificando permisos de reseña:', err);
        return res.status(500).json({ canReview: false, error: 'Error del servidor' });
    }
});

// 2. Obtener reseñas de un producto
app.get('/api/reviews', async (req, res) => {
    const { productId, productType } = req.query;

    try {
        // Mapear documentId a id_producto
        const dbProductId = productType === 'combo' ? productId : await getProductIdFromDocumentId(productId);

        if (!dbProductId) {
            return res.json({ success: true, reviews: [], averageRating: 0 });
        }

        // Buscar descripcion para agrupar
        let dbDescripcion = '';
        const table = productType === 'combo' ? 'combo' : 'producto';
        const descQuery = await db.query(`SELECT descripcion FROM ${table} WHERE id = $1`, [dbProductId]);
        if (descQuery.rows.length > 0) dbDescripcion = descQuery.rows[0].descripcion;

        let query, params;

        if (productType === 'combo') {
            query = `
                SELECT r.id, r.titulo, r.contenido, r.calificacion, r.fecha_creacion, u.nombre as usuario_nombre
                FROM reseña r
                JOIN Usuario u ON r.id_usuario = u.id
                JOIN combo c ON r.id_combo = c.id
                WHERE LOWER(c.descripcion) = LOWER($1)
                ORDER BY r.fecha_creacion DESC`;
            params = [dbDescripcion];
        } else {
            query = `
                SELECT r.id, r.titulo, r.contenido, r.calificacion, r.fecha_creacion, u.nombre as usuario_nombre
                FROM reseña r
                JOIN Usuario u ON r.id_usuario = u.id
                JOIN producto p ON r.id_producto = p.id
                WHERE LOWER(p.descripcion) = LOWER($1)
                ORDER BY r.fecha_creacion DESC`;
            params = [dbDescripcion];
        }

        const { rows: reviews } = await db.query(query, params);

        // Calcular promedio
        const averageRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.calificacion, 0) / reviews.length
            : 0;

        return res.json({
            success: true,
            reviews: reviews,
            averageRating: parseFloat(averageRating.toFixed(1))
        });
    } catch (err) {
        console.error('Error obteniendo reseñas:', err);
        return res.status(500).json({ success: false, reviews: [] });
    }
});

// 3. Crear nueva reseña
app.post('/api/reviews', async (req, res) => {
    if (!req.session || !req.session.userId) return res.status(401).json({ error: 'No logueado' });

    const { productId, productType, titulo, contenido, calificacion } = req.body;
    const userId = req.session.userId;

    try {
        // Validaciones básicas
        if (!titulo || calificacion < 1 || calificacion > 5) {
            return res.status(400).json({ error: 'Datos inválidos' });
        }

        // Mapear documentId a id_producto
        const dbProductId = productType === 'combo' ? productId : await getProductIdFromDocumentId(productId);

        if (!dbProductId) {
            return res.status(400).json({ error: 'Producto no encontrado' });
        }

        // Buscar descripcion 
        let dbDescripcion = '';
        const table = productType === 'combo' ? 'combo' : 'producto';
        const descQuery = await db.query(`SELECT descripcion FROM ${table} WHERE id = $1`, [dbProductId]);
        if (descQuery.rows.length > 0) dbDescripcion = descQuery.rows[0].descripcion;

        // Verificar que el usuario compró el producto (cualquier version)
        let purchaseQuery;
        let purchaseParams;
        if (productType === 'combo') {
            purchaseQuery = `
                SELECT COUNT(*) as count FROM venta v
                JOIN detalle_venta dv ON v.id = dv.id_venta
                JOIN combo c ON dv.id_combo = c.id
                WHERE v.id_usuario = $1 AND LOWER(c.descripcion) = LOWER($2) AND BTRIM(LOWER(v.estado)) != 'pendiente'`;
            purchaseParams = [userId, dbDescripcion];
        } else {
            purchaseQuery = `
                SELECT COUNT(*) as count FROM venta v
                JOIN detalle_venta dv ON v.id = dv.id_venta
                JOIN producto p ON dv.id_producto = p.id
                WHERE v.id_usuario = $1 AND LOWER(p.descripcion) = LOWER($2) AND BTRIM(LOWER(v.estado)) != 'pendiente'`;
            purchaseParams = [userId, dbDescripcion];
        }

        const { rows: purchaseCheck } = await db.query(purchaseQuery, purchaseParams);

        if (purchaseCheck[0].count === 0) {
            return res.status(403).json({ error: 'No has comprado este producto' });
        }

        // Verificar que no haya dejado reseña anterior (en cualquier versión)
        let existingReviewQuery;
        let existingReviewParams;
        if (productType === 'combo') {
            existingReviewQuery = `
                SELECT r.id FROM reseña r
                JOIN combo c ON r.id_combo = c.id
                WHERE r.id_usuario = $1 AND LOWER(c.descripcion) = LOWER($2)`;
            existingReviewParams = [userId, dbDescripcion];
        } else {
            existingReviewQuery = `
                SELECT r.id FROM reseña r
                JOIN producto p ON r.id_producto = p.id
                WHERE r.id_usuario = $1 AND LOWER(p.descripcion) = LOWER($2)`;
            existingReviewParams = [userId, dbDescripcion];
        }

        const { rows: existingReview } = await db.query(existingReviewQuery, existingReviewParams);

        if (existingReview.length > 0) {
            return res.status(403).json({ error: 'Ya dejaste una reseña en este producto' });
        }

        // Insertar reseña
        let insertQuery, insertParams;
        if (productType === 'combo') {
            insertQuery = `
                INSERT INTO reseña (id_usuario, id_combo, titulo, contenido, calificacion, fecha_creacion)
                VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
                RETURNING id`;
            insertParams = [userId, dbProductId, titulo, contenido, calificacion];
        } else {
            insertQuery = `
                INSERT INTO reseña (id_usuario, id_producto, titulo, contenido, calificacion, fecha_creacion)
                VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
                RETURNING id`;
            insertParams = [userId, dbProductId, titulo, contenido, calificacion];
        }

        const { rows: insertResult } = await db.query(insertQuery, insertParams);

        return res.json({
            success: true,
            reviewId: insertResult[0].id,
            message: 'Reseña guardada correctamente'
        });
    } catch (err) {
        console.error('Error creyendo reseña:', err);
        return res.status(500).json({ error: 'Error del servidor' });
    }
});

/*
=================================================
RUTA: OBTENER VENTAS DEL USUARIO
GET /api/user/me/ventas
=================================================
*/
app.get('/api/user/me/ventas', async (req, res) => {
    // If session has ventas (seeded), return them
    if (req.session && req.session.ventas) return res.json({ success: true, ventas: req.session.ventas });
    if (!req.session || !req.session.userId) return res.status(401).json({ success: false });
    try {
        // Get ventas with basic info - Mostrar todo excepto 'Pendiente'
        const userId = req.session.userId;
        const ventasQuery = `SELECT v.id, v.fecha_venta, v.subtotal, v.descuento, v.total, v.estado, v.metodo_pago, e.estado as estado_envio 
                             FROM venta v
                             LEFT JOIN Envio e ON v.id = e.id_venta
                             WHERE v.id_usuario = ${userId} AND BTRIM(LOWER(v.estado)) != 'pendiente'
                             ORDER BY v.fecha_venta DESC, v.id DESC`;
        const { rows: ventas } = await db.query(ventasQuery);

        // For each venta, get its details if they exist
        for (let venta of ventas) {
            try {
                const detallesQuery = `
                    SELECT 
                        dv.id_producto, 
                        dv.cantidad, 
                        dv.precio_unitario, 
                        dv.subtotal, 
                        COALESCE(p.descripcion, c.descripcion) as producto_nombre,
                        COALESCE(p.material, 'Combo') as material
                    FROM detalle_venta dv
                    LEFT JOIN Producto p ON dv.id_producto = p.id
                    LEFT JOIN Combo c ON dv.id_combo = c.id
                    WHERE dv.id_venta = ${venta.id}`;
                const { rows: detalles } = await db.query(detallesQuery);

                // Format details for frontend
                venta.detalle = detalles.map(d => ({
                    cantidad: d.cantidad,
                    precio: d.precio_unitario,
                    precio_unitario: d.precio_unitario,
                    subtotal: d.subtotal,
                    id_producto: d.id_producto,
                    producto_nombre: d.producto_nombre,
                    producto: {
                        material: d.material
                    }
                }));
            } catch (detailErr) {
                console.error('Error getting details for venta', venta.id, detailErr);
                venta.detalle = [];
            }
        }

        return res.json({ success: true, ventas: ventas });
    } catch (err) {
        console.error('Error fetching ventas:', err);
        return res.status(500).json({ success: false, ventas: [] });
    }
});

// DEBUG: seed sample user + ventas for local development
app.post('/debug/seed_user', async (req, res) => {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ ok: false });
    try {
        const email = 'Leomessi@gmail.com';
        const nombre = 'Lionel Andres';
        const apellido = 'Messi';
        const foto = req.body.picture || 'https://i.pravatar.cc/150?img=12';

        // upsert user by email
        let userId;
        try {
            const find = await db.query('SELECT id FROM Usuario WHERE email = $1', [email]);
            if (find.rows.length > 0) {
                userId = find.rows[0].id;
                await db.query('UPDATE Usuario SET nombre=$1, apellido=$2, foto_url=COALESCE($3,foto_url) WHERE id=$4', [nombre, apellido, foto, userId]);
            } else {
                try {
                    const ins = await db.query('INSERT INTO Usuario (activo, fecha_registro, telefono, email, apellido, nombre, es_admin, foto_url) VALUES (true, $1, NULL, $2, $3, $4, false, $5) RETURNING id', [new Date('2025-02-27'), email, apellido, nombre, foto]);
                    userId = ins.rows[0].id;
                } catch (e) {
                    const ins2 = await db.query('INSERT INTO Usuario (activo, fecha_registro, telefono, email, apellido, nombre, es_admin) VALUES (true, $1, NULL, $2, $3, $4, false) RETURNING id', [new Date('2025-02-27'), email, apellido, nombre]);
                    userId = ins2.rows[0].id;
                }
            }
        } catch (err) {
            console.error('Seed user DB error:', err);
            return res.status(500).json({ ok: false, error: 'DB error' });
        }

        // create ventas sample (avoid duplicates by checking existing ids)
        const sampleVentas = [
            { id: 1245, fecha: '2025-09-15', detalle: 'Mate Imperial - Negro (1 u.)', estado: 'Entregado', total: 27500 },
            { id: 1238, fecha: '2025-09-02', detalle: 'Combo 1 (1 u.)', estado: 'Enviado', total: 50200 },
            { id: 1227, fecha: '2025-06-20', detalle: 'Mate Camionero - Marron (1 u.)', estado: 'Pendiente de envío', total: 18000 },
        ];

        for (const v of sampleVentas) {
            try {
                const exists = await db.query('SELECT id FROM venta WHERE id = $1', [v.id]);
                if (exists.rows.length === 0) {
                    await db.query('INSERT INTO venta (id, id_usuario, fecha_venta, subtotal, descuento, total, estado) VALUES ($1, $2, $3, $4, $5, $6, $7)', [v.id, userId, v.fecha, v.total, 0, v.total, v.estado]);
                }
            } catch (e) {
                console.warn('Could not insert venta', v.id, e.message);
            }
        }

        // save some favorites as JSON in a placeholder column if exists
        try {
            await db.query('ALTER TABLE IF EXISTS Usuario ADD COLUMN IF NOT EXISTS favoritos_json TEXT');
        } catch (e) {
            // ignore
        }
        try {
            const favs = JSON.stringify([
                { nombre: 'Mate Imperial', color: 'Negro' },
                { nombre: 'Mate Torpedo', color: 'Negro' },
                { nombre: 'Mate Torpedo', color: 'Negro' },
            ]);
            await db.query('UPDATE Usuario SET favoritos_json = $1 WHERE id = $2', [favs, userId]);
        } catch (e) {
            // ignore
        }

        // attach to session
        req.session.userId = userId;
        req.session.user = { id: userId, email, nombre, apellido, picture: foto };

        return res.json({ ok: true, userId });
    } catch (err) {
        console.error('Seed error', err);
        return res.status(500).json({ ok: false });
    }
});

// DEBUG: seed session-only sample (no DB required)
app.post('/debug/seed_session', (req, res) => {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ ok: false });
    const user = {
        id: -1,
        email: 'Leomessi@gmail.com',
        nombre: 'Lionel Andres',
        apellido: 'Messi',
        picture: 'https://i.pravatar.cc/150?img=12',
        miembroDesde: '27/02/2025',
        favoritos: [
            { nombre: 'Mate Imperial', color: 'Negro' },
            { nombre: 'Mate Torpedo', color: 'Negro' },
            { nombre: 'Mate Torpedo', color: 'Negro' },
        ],
    };
    req.session.user = user;
    req.session.userId = null;
    // seed ventas in session for display
    req.session.ventas = [
        { id: 1245, fecha_venta: '2025-09-15', detalle: 'Mate Imperial - Negro (1 u.)', estado: 'Entregado', total: 27500 },
        { id: 1238, fecha_venta: '2025-09-02', detalle: 'Combo 1 (1 u.)', estado: 'Enviado', total: 50200 },
        { id: 1227, fecha_venta: '2025-06-20', detalle: 'Mate Camionero - Marron (1 u.)', estado: 'Pendiente de envío', total: 18000 },
    ];
    return res.json({ ok: true });
});

// Endpoint para obtener el usuario logueado (si hay sesión)
app.post('/api/user/me', async (req, res) => {
    if (!req.session || !req.session.userId) return res.status(401).json({ error: 'No logueado' });
    const { nombre, apellido, telefono, calle, numero, provincia, ciudad } = req.body;
    try {
        let ciudadId = null;
        if (ciudad && provincia) {
            const { rows: findCiudad } = await db.query("SELECT ciudad_id FROM Ciudad WHERE nombre=$1 AND provincia=$2", [ciudad, provincia]);
            if (findCiudad.length > 0) {
                ciudadId = findCiudad[0].ciudad_id;
            } else {
                const ins = await db.query("INSERT INTO Ciudad (nombre, CP, provincia) VALUES ($1, $2, $3) RETURNING ciudad_id", [ciudad, null, provincia]);
                ciudadId = ins.rows[0].ciudad_id;
            }
        }
        await db.query(
            'UPDATE Usuario SET nombre=$1, apellido=$2, telefono=$3, calle=$4, numero=$5, id_ciudad=$6 WHERE id=$7',
            [nombre, apellido, telefono, calle, Number(numero) || null, ciudadId, req.session.userId]
        );
        res.json({ success: true });
    } catch (err) {
        console.error('Update profile Error:', err);
        res.status(500).json({ error: 'DB error' });
    }
});
app.get('/auth/me', async (req, res) => {
    if (!req.session || !req.session.userId) return res.status(401).json({ loggedIn: false });
    try {
        const { rows } = await db.query(`
            SELECT u.id, u.email, u.nombre, u.apellido, u.telefono, u.calle, u.numero, c.nombre as ciudad, c.provincia
            FROM Usuario u
            LEFT JOIN Ciudad c ON u.id_ciudad = c.ciudad_id
            WHERE u.id = $1
        `, [req.session.userId]);
        if (!rows || rows.length === 0) return res.status(404).json({ loggedIn: false });
        return res.json({ loggedIn: true, user: rows[0] });
    } catch (err) {
        console.error('Error in /auth/me:', err);
        return res.status(500).json({ loggedIn: false });
    }
});

// Cerrar sesión
app.post('/auth/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ success: false });
        }
        res.clearCookie('connect.sid');
        return res.json({ success: true });
    });
});

app.post('/api/create_preference', async (req, res) => {
    if (!req.session || !req.session.userId) return res.status(401).json({ error: 'No logueado' });

    const { cart, checkoutData } = req.body;
    const userId = req.session.userId;

    // --- VALIDAR DISPONIBILIDAD DE STOCK EN STRAPI ---
    const stockError = await checkStockBeforePayment(cart);
    if (stockError) {
        return res.status(400).json({ error: stockError });
    }

    let client;
    try {
        client = await db.getClient();

        // 1. Resolver todos los IDs ANTES de iniciar la transacción
        // *En PostgreSQL, si una consulta dentro de BEGIN falla y la atrapamos, toda la transacción queda abortada.*
        // *Por eso hacemos la lectura previa de IDs por fuera.*
        const resolvedCart = [];
        for (const item of cart) {
            let prodId = null;
            let comboId = null;

            // Estrategia 1: Buscar por documentId en tabla de mapeo
            if (item.documentId) {
                try {
                    const { rows: mapped } = await client.query(
                        `SELECT producto_id, combo_id FROM strapi_producto_map WHERE strapi_document_id = $1`,
                        [item.documentId]
                    );
                    if (mapped.length > 0) {
                        prodId = mapped[0].producto_id;
                        comboId = mapped[0].combo_id;
                    }
                } catch (mapError) {
                    console.log(`⚠️ Tabla de mapeo no lista aún, usando estrategia alternativa...`);
                }
            }

            // Estrategia 2: Buscar por nombre/descripcion
            if (!prodId && !comboId && item.nombre) {
                const { rows: found } = await client.query(
                    `SELECT id FROM producto WHERE LOWER(descripcion) = LOWER($1) LIMIT 1`,
                    [item.nombre]
                );
                if (found.length > 0) {
                    prodId = found[0].id;
                } else {
                    const { rows: foundCombo } = await client.query(
                        `SELECT id FROM combo WHERE LOWER(descripcion) = LOWER($1) LIMIT 1`,
                        [item.nombre]
                    );
                    if (foundCombo.length > 0) {
                        comboId = foundCombo[0].id;
                    }
                }
            }

            // Estrategia 3: Fallback por ID directo
            if (!prodId && !comboId) {
                const tryId = parseInt(item.id, 10);
                if (!isNaN(tryId)) {
                    const { rows: check } = await client.query('SELECT id FROM producto WHERE id = $1', [tryId]);
                    if (check.length > 0) prodId = check[0].id;
                }
            }

            if (!prodId && !comboId) {
                console.warn(`⚠️ No se encontró producto en PG para: "${item.nombre}" (documentId: ${item.documentId}, id: ${item.id})`);
                throw new Error(`Producto "${item.nombre}" no encontrado en la base de datos`);
            }

            resolvedCart.push({
                ...item,
                prodId,
                comboId
            });
        }

        // 2. Iniciar transacción y guardar la compra
        await client.query('BEGIN');

        const subtotalVenta = cart.reduce((acc, item) => acc + (Number(item.precio) * Number(item.cantidad)), 0);
        const totalFinal = checkoutData.totalFinal || (subtotalVenta + 4000);

        console.log(`Iniciando compra para usuario ID: ${userId}`);

        const ventaRes = await client.query(
            `INSERT INTO venta (id_usuario, fecha_venta, subtotal, descuento, total, estado, metodo_pago, id_cupon)
             VALUES ($1, CURRENT_DATE, $2, $3, $4, 'Pendiente', 'Mercado Pago', $5)
             RETURNING id`,
            [userId, subtotalVenta, checkoutData.descuento || 0, totalFinal, checkoutData.id_cupon || null]
        );

        const ventaId = ventaRes.rows[0].id;
        // NOTA: No invalidamos el cupón aquí porque el usuario podría cancelar el pago en MP y perdería el cupón.
        // Se invalidará en el webhook cuando MP lo reporte como "approved".

        // 3. Insertar en detalle_venta
        for (const item of resolvedCart) {
            const subtotalItem = Number(item.precio) * Number(item.cantidad);

            await client.query(
                `INSERT INTO detalle_venta (id_venta, id_producto, id_combo, cantidad, precio_unitario, subtotal, total)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [ventaId, item.prodId || null, item.comboId || null, item.cantidad, item.precio, subtotalItem, subtotalItem]
            );
        }

        // 4. Crear fila en tabla Envio para rastreo
        let metodoEnvioValido = checkoutData.metodoEnvio;
        if (!['Correo Argentino', 'Andreani', 'OCA'].includes(metodoEnvioValido)) {
            metodoEnvioValido = 'OCA'; // Fallback seguro para dominio en PG
        }
        await client.query(
            `INSERT INTO Envio (empresa_envio, costo_envio, estado, id_venta)
             VALUES ($1, $2, 'Preparando', $3)`,
            [metodoEnvioValido, 0, ventaId]
        );

        await client.query('COMMIT');
        console.log("✅ Venta guardada temporalmente (Pendiente MP). ID:", ventaId);

        // --- SINCRONIZAR A STRAPI ---
        try {
            const detalleCheckout = resolvedCart.map(c => `${c.cantidad}x ${c.nombre}`).join(' | ');
            const payload = {
                data: {
                    id_venta: ventaId,
                    cliente_email: req.session.user ? req.session.user.email : 'anonimo',
                    total: totalFinal,
                    estado_venta: 'Pendiente',
                    estado_envio: 'Pendiente de envío',
                    metodo_envio: checkoutData.metodoEnvio || 'N/A',
                    detalle_producto: detalleCheckout
                }
            };

            console.log("📤 Enviando a Strapi:", JSON.stringify(payload, null, 2));

            const resStrapi = await fetch('http://127.0.0.1:1337/api/pedidos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const strapiText = await resStrapi.text();

            if (!resStrapi.ok) {
                console.error("❌ Strapi ERROR. Status:", resStrapi.status);
                console.error("Respuesta completa:", strapiText);
            } else {
                console.log("✅ Venta replicada en Strapi exitosamente");
                console.log("Respuesta Strapi:", strapiText);
            }
        } catch (syncErr) {
            console.error("⚠️ Error de red mandando a Strapi:", syncErr.message);
            console.error("Stack:", syncErr.stack);
        }

        // 4. Crear Preferencia en Mercado Pago
        const originUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
        const isNgrok = !!process.env.NGROK_URL;
        const returnBase = isNgrok ? process.env.NGROK_URL : originUrl;

        // Se preparan los items del carrito para los metadatos de modo que en el webhook se pueda descontar stock
        const cartItemsForMetadata = resolvedCart.map(c => ({
            id: c.documentId || String(c.id),
            quantity: c.cantidad
        }));

        const preferenceClient = new Preference(clientMP);
        const preferenceResponse = await preferenceClient.create({
            body: {
                items: [
                    {
                        title: "Compra en MATE ÚNICO (Incl. Envío)",
                        description: "Total de los productos, envío y descuentos aplicados",
                        unit_price: totalFinal,
                        quantity: 1
                    }
                ],
                metadata: {
                    cart_json: JSON.stringify(cartItemsForMetadata).substring(0, 500)
                },
                external_reference: String(ventaId),
                back_urls: {
                    success: isNgrok ? `${returnBase}/api/checkout/success` : `${returnBase}/final`,
                    failure: isNgrok ? `${returnBase}/api/checkout/failure` : `${returnBase}/pago-tarjeta`,
                    pending: isNgrok ? `${returnBase}/api/checkout/pending` : `${returnBase}/pago-tarjeta`
                },
                auto_return: "approved"
            }
        });

        res.json({ success: true, init_point: preferenceResponse.init_point, ventaId });

    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('❌ ERROR SQL REAL:', err.message);
        res.status(500).json({ error: err.message });
    } finally {
        if (client) client.release();
    }
});

// GET cupon parameters
app.get('/api/cupones/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const { rows } = await db.query(
            "SELECT id, tipo_descuento, valor_descuento FROM Cupon WHERE codigo = $1 AND activo = true AND usado = false AND CURRENT_DATE BETWEEN fecha_inicio AND fecha_vencimiento",
            [code.toUpperCase()]
        );
        if (rows.length > 0) {
            res.json({ success: true, id_cupon: rows[0].id, tipo: rows[0].tipo_descuento, valor: rows[0].valor_descuento });
        } else {
            res.json({ success: false, message: 'Cupón inválido o expirado' });
        }
    } catch (error) {
        console.error('Coupon DB Error:', error);
        res.status(500).json({ success: false, message: 'Error de servidor verificando cupón' });
    }
});

/*
=================================================
RUTA: SYNC INICIAL DE PRODUCTOS STRAPI → POSTGRESQL
=================================================
*/
app.post('/api/sync-products', async (req, res) => {
    try {
        // 1. Crear tabla de mapeo si no existe (con combo_id)
        await db.query(`
            CREATE TABLE IF NOT EXISTS strapi_producto_map (
                strapi_document_id VARCHAR(255) PRIMARY KEY,
                producto_id INT REFERENCES Producto(id),
                combo_id INT REFERENCES Combo(id)
            )
        `);

        // Si existe, asegurarse de que tenga combo_id (compatibilidad)
        try {
            await db.query(`ALTER TABLE strapi_producto_map ADD COLUMN combo_id INT REFERENCES Combo(id)`);
        } catch (e) { /* Ya existe */ }

        // 2. Traer todos los productos de Strapi
        const strapiRes = await fetch('http://localhost:1337/api/productos?populate=*&pagination[limit]=100');
        const strapiData = await strapiRes.json();
        const strapiProducts = strapiData.data || [];

        let synced = 0;
        let skipped = 0;

        for (const prod of strapiProducts) {
            const documentId = prod.documentId || String(prod.id);
            const isCombo = prod.categoria === 'combo_simple' || prod.categoria === 'combo_completo';
            const nombre = prod.nombre || 'Sin nombre';

            // Ver si ya está mapeado
            const { rows: existing } = await db.query(
                'SELECT producto_id, combo_id FROM strapi_producto_map WHERE strapi_document_id = $1',
                [documentId]
            );
            if (existing.length > 0) {
                skipped++;
                continue;
            }

            let pgId = null;
            let tableToUse = null;

            if (isCombo) {
                const tipo_combo = prod.categoria === 'combo_simple' ? 'mate + bombilla' : 'mate + bombilla + bolso';
                const { rows: match } = await db.query('SELECT id FROM combo WHERE LOWER(descripcion) = LOWER($1) LIMIT 1', [nombre]);
                if (match.length > 0) {
                    pgId = match[0].id;
                } else {
                    const insertRes = await db.query(
                        `INSERT INTO combo (descripcion, tipo_combo, fecha_creacion, grabado, cantidad_disp, umbral_min, precio)
                         VALUES ($1, $2, CURRENT_DATE, $3, 10, 5, $4) RETURNING id`,
                        [nombre, tipo_combo, prod.grabado || false, Number(prod.precio) || 0]
                    );
                    pgId = insertRes.rows[0].id;
                }
                tableToUse = 'combo';
            } else {
                let color = 'Negro';
                if (prod.color_negro) color = 'Negro';
                else if (prod.color_marron) color = 'Marron';
                else if (prod.color_blanco) color = 'Blanco';
                else if (prod.color_gris) color = 'Gris';

                const { rows: match } = await db.query('SELECT id FROM producto WHERE LOWER(descripcion) = LOWER($1) LIMIT 1', [nombre]);
                if (match.length > 0) {
                    pgId = match[0].id;
                } else {
                    const insertRes = await db.query(
                        `INSERT INTO producto (material, color, dimensiones, capacidad, precio, descripcion, grabado, cantidad_disp)
                         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
                        [prod.material || 'calabaza', color, 10.0, 200, Number(prod.precio) || 0, nombre, prod.grabado || false, 10]
                    );
                    pgId = insertRes.rows[0].id;
                }
                tableToUse = 'producto';
            }

            // Crear mapeo
            await db.query(
                'INSERT INTO strapi_producto_map (strapi_document_id, producto_id, combo_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                [documentId, tableToUse === 'producto' ? pgId : null, tableToUse === 'combo' ? pgId : null]
            );
            synced++;
            console.log(`✅ Sync: "${nombre}" (Strapi ${documentId}) → PG ${tableToUse}.id=${pgId}`);
        }

        res.json({ success: true, synced, skipped, total: strapiProducts.length });
    } catch (err) {
        console.error('❌ Error en sync:', err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Helper genérico para actualizar estado en Strapi post-MP
async function updateStrapiEstado(ventaId, nuevoEstadoVenta) {
    try {
        const findReq = await fetch(`http://127.0.0.1:1337/api/pedidos?filters[id_venta][$eq]=${ventaId}`);
        const findRes = await findReq.json();
        if (findRes.data && findRes.data.length > 0) {
            const documentId = findRes.data[0].documentId;
            const putReq = await fetch(`http://127.0.0.1:1337/api/pedidos/${documentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: { estado_venta: nuevoEstadoVenta } })
            });
            if (!putReq.ok) console.error("⚠️ Error actualizando Strapi:", await putReq.text());
        } else {
            console.log(`⚠️ No se encontró pedido en Strapi con id_venta=${ventaId} para actualizar.`);
        }
    } catch (err) {
        console.error("No se pudo sync Strapi status", err.message);
    }
}

// Endpoints intermediarios para recibir a Mercado Pago (sirven para ngrok)
app.get('/api/checkout/success', async (req, res) => {
    const paymentId = req.query.payment_id;
    const status = req.query.status;
    const externalRef = req.query.external_reference;

    console.log(`Llegó success de MP: paymentId=${paymentId}, status=${status}, externalRef=${externalRef}`);

    if (status === 'approved' && externalRef) {
        try {
            const paymentClient = new Payment(clientMP);
            const paymentInfo = await paymentClient.get({ id: paymentId });

            if (paymentInfo.status === 'approved') {
                // Hacemos el UPDATE solo si no estaba 'Confirmado', para evitar doble proceso si se juntan el success y webhook
                const { rows } = await db.query("UPDATE venta SET estado = 'Confirmado' WHERE id = $1 AND estado != 'Confirmado' RETURNING id_cupon, id_usuario, total", [externalRef]);
                
                if (rows.length > 0) {
                    if (rows[0].id_cupon) {
                        await db.query("UPDATE Cupon SET usado = true, activo = false WHERE id = $1", [rows[0].id_cupon]);
                    }

                    await updateStrapiEstado(externalRef, 'Aprobado');
                    console.log(`✅ Pago verificado y aprobado. Venta ID: ${externalRef} - Cupón descontado si aplica.`);

                    // Descontar stock en Strapi leyendo los metadatos de Mercado Pago
                    if (paymentInfo.metadata && paymentInfo.metadata.cart_json) {
                        try {
                            const cartItems = JSON.parse(paymentInfo.metadata.cart_json);
                            console.log('🛒 Check-out Success: Iniciando descuento de stock para items:', cartItems);
                            
                            (async () => {
                                await deductStockFromStrapi(cartItems);
                            })();
                        } catch (parseErr) {
                            console.error('❌ Check-out Success: Error parseando cart_json en metadata', parseErr);
                        }
                    }

                    // Enviar email de confirmación "fire and forget"
                    if (rows[0].id_usuario) {
                    (async () => {
                        try {
                            const idUsuario = rows[0].id_usuario;
                            const totalVenta = rows[0].total;

                            // Obtener información del usuario
                            const { rows: userRows } = await db.query("SELECT nombre, email FROM Usuario WHERE id = $1", [idUsuario]);
                            if (userRows.length > 0) {
                                const userData = userRows[0];

                                // Obtener detalles de la orden
                                const { rows: detailRows } = await db.query(`
                                    SELECT dv.cantidad, dv.subtotal, COALESCE(p.descripcion, c.descripcion) as nombre
                                    FROM detalle_venta dv
                                    LEFT JOIN Producto p ON dv.id_producto = p.id
                                    LEFT JOIN Combo c ON dv.id_combo = c.id
                                    WHERE dv.id_venta = $1
                                `, [externalRef]);

                                const orderDetails = {
                                    id: externalRef,
                                    total: totalVenta,
                                    items: detailRows
                                };

                                await sendOrderConfirmation(userData, orderDetails);
                            }
                        } catch (emailErr) {
                            console.error('❌ Error enviando email de confirmación en success:', emailErr);
                        }
                    })();
                }
            } // CIERRA if (rows.length > 0)
            } else {
                console.log(`⚠️ MP dice que no está aprobado. Estado real: ${paymentInfo.status}`);
            }
        } catch (error) {
            console.error('❌ Error verificando pago en MP:', error.message || error);
        }
    }

    const frontUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
    res.redirect(`${frontUrl}/final`);
});

app.get('/api/checkout/failure', async (req, res) => {
    const externalRef = req.query.external_reference;
    if (externalRef) {
        try {
            await db.query("UPDATE venta SET estado = 'Cancelado' WHERE id = $1", [externalRef]);
            await updateStrapiEstado(externalRef, 'Cancelado');
        } catch (e) { }
    }
    const frontUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
    res.redirect(`${frontUrl}/pago-tarjeta?error=rechazado`);
});

app.get('/api/checkout/pending', async (req, res) => {
    const frontUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
    res.redirect(`${frontUrl}/final?status=pending`);
});

app.post('/api/webhook_mp', async (req, res) => {
    const paymentId = req.query['data.id'] || (req.body && req.body.data && req.body.data.id);
    const type = req.query.type || (req.body && req.body.type);

    if (type === 'payment' && paymentId) {
        try {
            const paymentClient = new Payment(clientMP);
            const paymentInfo = await paymentClient.get({ id: paymentId });

            if (paymentInfo.status === 'approved') {
                const ventaId = paymentInfo.external_reference;
                if (ventaId) {
                    // Hacemos el UPDATE solo si no estaba 'Confirmado', para evitar doble proceso
                    const { rows } = await db.query("UPDATE venta SET estado = 'Confirmado' WHERE id = $1 AND estado != 'Confirmado' RETURNING id_cupon, id_usuario, total", [ventaId]);
                    
                    if (rows.length > 0) {
                        if (rows[0].id_cupon) {
                            await db.query("UPDATE Cupon SET usado = true, activo = false WHERE id = $1", [rows[0].id_cupon]);
                        }
                        await updateStrapiEstado(ventaId, 'Aprobado');
                        console.log(`✅ Webhook MP: Pago aprobado para la venta ID: ${ventaId} - Cupón desactivado si aplica.`);

                    // Descontar stock en Strapi leyendo los metadatos de Mercado Pago
                    if (paymentInfo.metadata && paymentInfo.metadata.cart_json) {
                        try {
                            const cartItems = JSON.parse(paymentInfo.metadata.cart_json);
                            console.log('🛒 Webhook MP: Iniciando descuento de stock para items:', cartItems);
                            
                            // Esperar a que se actualice el stock, o hacerlo asíncróno si se prefiere. 
                            // Lo dejamos sin await superior para no trabar el webhook, pero sí dentro de una async function
                            (async () => {
                                await deductStockFromStrapi(cartItems);
                            })();
                        } catch (parseErr) {
                            console.error('❌ Webhook MP: Error parseando cart_json en metadata', parseErr);
                        }
                    }

                    // Enviar email de confirmación "fire and forget" para no bloquear la respuesta a MP
                    if (rows.length > 0 && rows[0].id_usuario) {
                        (async () => {
                            try {
                                const idUsuario = rows[0].id_usuario;
                                const totalVenta = rows[0].total;

                                // Obtener información del usuario
                                const { rows: userRows } = await db.query("SELECT nombre, email FROM Usuario WHERE id = $1", [idUsuario]);
                                if (userRows.length > 0) {
                                    const userData = userRows[0];

                                    // Obtener detalles de la orden
                                    const { rows: detailRows } = await db.query(`
                                        SELECT dv.cantidad, dv.subtotal, COALESCE(p.descripcion, c.descripcion) as nombre
                                        FROM detalle_venta dv
                                        LEFT JOIN Producto p ON dv.id_producto = p.id
                                        LEFT JOIN Combo c ON dv.id_combo = c.id
                                        WHERE dv.id_venta = $1
                                    `, [ventaId]);

                                    const orderDetails = {
                                        id: ventaId,
                                        total: totalVenta,
                                        items: detailRows
                                    };

                                    // Llamar al servicio sin el await dentro del try-catch de orden superior para que no bloquee
                                    await sendOrderConfirmation(userData, orderDetails);
                                }
                            } catch (emailErr) {
                                console.error('❌ Error enviando email de confirmación (Fire&Forget):', emailErr);
                            }
                        })();
                    } // CIERRA if (rows[0].id_usuario)
                    } // CIERRA if (rows.length > 0)
                } // CIERRA if (ventaId)
            } // CIERRA if (paymentInfo.status === 'approved')
        } catch (error) {
            console.error('❌ Error al procesar webhook de MP:', error);
            return res.status(500).send('Error');
        }
    }
    res.status(200).send('OK');
});

// Sync DE Strapi A Backend
app.post('/api/sync-estado-venta', async (req, res) => {
    try {
        const { id_venta, estado_venta, estado_envio } = req.body;
        if (!id_venta) return res.status(400).json({ error: 'Falta id_venta' });

        if (estado_venta) {
            const pgEstado = estado_venta === 'Aprobado' ? 'Confirmado' : estado_venta;
            await db.query("UPDATE venta SET estado = $1 WHERE id = $2", [pgEstado, id_venta]);
            console.log(`🔄 Sync desde Strapi: Venta ${id_venta} -> Pago: ${pgEstado}`);
        }

        if (estado_envio) {
            // Mapeo seguro para el dominio estado_e en PostgreSQL
            let pgEnvio = estado_envio;
            if (estado_envio === 'Pendiente de envío') pgEnvio = 'Preparando';

            await db.query("UPDATE Envio SET estado = $1 WHERE id_venta = $2", [pgEnvio, id_venta]);
            console.log(`🔄 Sync desde Strapi: Venta ${id_venta} -> Envio: ${pgEnvio}`);
        }

        res.json({ success: true });
    } catch (err) {
        console.error("Error sync-estado-venta:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// Ponemos el servidor a escuchar
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});