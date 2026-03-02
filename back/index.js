require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { OAuth2Client } = require('google-auth-library');
const db = require('./db'); // Importamos nuestra conexión a la BD

const app = express();
const PORT = 3001; // Puerto para el back-end

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middlewares
// CORS: permitir uno o varios orígenes del frontend y credenciales para cookies de sesión
// FRONTEND_ORIGIN puede ser una lista separada por comas
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5174';
const allowedOrigins = FRONTEND_ORIGIN.split(',').map(s => s.trim());
app.use(cors({
    origin: function(origin, callback) {
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
                    return res.status(500).json({ success: false, error: 'Database error' });
                                // store some profile info in session as fallback
                                req.session.user = { email: payload.email, nombre, apellido, picture: foto };
                                return res.status(500).json({ success: false, error: 'Database error' });
                }

                // Guardar userId en la sesión
                req.session.userId = userId;
                // also save a minimal user object in session for fallback
                req.session.user = { id: userId, email, nombre, apellido, picture: foto };
                console.log('User logged in, id:', userId);
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
                RUTA: OBTENER VENTAS DEL USUARIO
                GET /api/user/me/ventas
                =================================================
                */
                app.get('/api/user/me/ventas', async (req, res) => {
                    // If session has ventas (seeded), return them
                    if (req.session && req.session.ventas) return res.json({ success: true, ventas: req.session.ventas });
                    if (!req.session || !req.session.userId) return res.status(401).json({ success: false });
                    try {
                        const { rows } = await db.query('SELECT id, fecha_venta, subtotal, descuento, total, estado, detalle FROM Venta WHERE id_usuario = $1 ORDER BY fecha_venta DESC', [req.session.userId]);
                        return res.json({ success: true, ventas: rows });
                    } catch (err) {
                        console.error('Error fetching ventas:', err);
                        // fallback to empty
                        return res.status(500).json({ success: false, ventas: [] });
                    }
                });
                return res.json({ success: true, userId, payload });
    } catch (error) {
        console.error('Error verificando ID token:', error);
        return res.status(401).json({ success: false, error: 'Invalid ID token' });
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
                const exists = await db.query('SELECT id FROM Venta WHERE id = $1', [v.id]);
                if (exists.rows.length === 0) {
                    await db.query('INSERT INTO Venta (id, id_usuario, fecha_venta, subtotal, descuento, total, estado) VALUES ($1, $2, $3, $4, $5, $6, $7)', [v.id, userId, v.fecha, v.total, 0, v.total, v.estado]);
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
app.get('/auth/me', async (req, res) => {
    if (!req.session || !req.session.userId) return res.status(401).json({ loggedIn: false });
    try {
        const { rows } = await db.query('SELECT id, email, nombre, apellido FROM Usuario WHERE id = $1', [req.session.userId]);
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

// Ponemos el servidor a escuchar
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});