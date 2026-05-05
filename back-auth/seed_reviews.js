const { Client } = require('pg');

const client = new Client({
    user: 'postgres',
    host: '127.0.0.1',
    database: 'mate-unico',
    password: '46391475',
    port: 5432
});

const names = [
    { n: 'Lucas', a: 'Gómez' }, { n: 'Martín', a: 'Pérez' }, { n: 'Sofía', a: 'Rodríguez' },
    { n: 'Valentina', a: 'López' }, { n: 'Agustín', a: 'Fernández' }, { n: 'Micaela', a: 'García' },
    { n: 'Facundo', a: 'Martínez' }, { n: 'Camila', a: 'Romero' }, { n: 'Mateo', a: 'Sosa' },
    { n: 'Julieta', a: 'Ruiz' }, { n: 'Gonzalo', a: 'Díaz' }, { n: 'Lucía', a: 'Torres' },
    { n: 'Franco', a: 'Silva' }, { n: 'Martina', a: 'Alvarez' }, { n: 'Nicolás', a: 'Ramírez' }
];

const reviewPool = [
    { t: '¡Excelente calidad!', c: 'La virola está súper prolija, se nota el trabajo artesanal. Totalmente recomendado.', calif: 5 },
    { t: 'Hermoso mate', c: 'El mate es hermoso. Llegó rapidísimo a Córdoba y en perfectas condiciones. ¡Gracias!', calif: 5 },
    { t: 'Muy bueno', c: 'Buena calidad general. La madera tiene un aroma espectacular cuando lo curás.', calif: 4 },
    { t: 'Ideal para regalo', c: 'Es el segundo que compro para regalar. Siempre quedo de 10 con estos mates.', calif: 5 },
    { t: 'Tal cual las fotos', c: 'Es exactamente como se ve en la página. El grabado que le pedí quedó impecable.', calif: 5 },
    { t: 'Lindo mate', c: 'Muy lindo mate, aunque es un poquito más chico de lo que me imaginaba por las fotos.', calif: 4 },
    { t: 'Buenísimo el combo', c: 'Compré el combo y la bombilla es buenísima, no se tapa para nada. El bolso es súper cómodo.', calif: 5 },
    { t: 'Me encantó', c: 'Tardó un par de días más en llegar por el correo, pero el producto en sí es excelente.', calif: 4 },
    { t: 'Calidad Premium', c: 'Se nota la calidad premium de los materiales. Vale cada peso invertido.', calif: 5 },
    { t: 'Tremendo mate', c: 'Ya lo curé y estoy tomando unos buenos mates amargos. Ceba espectacular.', calif: 5 },
    { t: 'Súper prolijo', c: 'Las terminaciones son excelentes, muy buen agarre. Lo recomiendo.', calif: 5 },
    { t: 'Muy conforme', c: 'Cumple con todas las expectativas. El detalle de la caja en la que viene está genial.', calif: 4 },
    { t: 'Espectacular', c: 'No hay con qué darle. De los mejores mates que tuve, 100% recomendable.', calif: 5 },
    { t: 'Buena atención', c: 'El mate es precioso. Además la atención por Whatsapp fue de primera. Gracias chicos.', calif: 5 },
    { t: 'Lindo diseño', c: 'El diseño y color son hermosos, justo lo que andaba buscando para el trabajo.', calif: 4 },
    { t: 'Gran compra', c: 'El tamaño justo para cebar sin estar cambiando la yerba a cada rato. Tremendo.', calif: 5 },
    { t: 'Todo joya', c: 'Llegó en tiempo y forma a Capital. El packaging es re lindo, ideal si vas a regalar.', calif: 5 },
    { t: 'Vale la pena', c: 'Dudé un poco por el precio, pero cuando lo tenés en la mano te das cuenta de que la calidad lo vale.', calif: 5 },
    { t: 'Un clásico', c: 'El típico mate que te dura para toda la vida. Excelente la madera y la terminación.', calif: 5 },
    { t: 'Lindo detalle', c: 'Le agregué el grabado y quedó fantástico. Muy buena opción para personalizar.', calif: 4 },
    { t: 'Recomendable', c: 'Llegó todo bien empacado. La bombilla tira bárbaro.', calif: 5 },
    { t: 'Perfecto', c: 'Nada que envidiarle a las marcas más caras. Terminación de primera y súper cómodo.', calif: 5 },
    { t: 'Buen mate', c: 'Buen mate, se lo nota resistente. Un poco resbaladizo pero te acostumbras.', calif: 4 },
    { t: 'Todo de 10', c: 'Compré sin mucha expectativa y la verdad me sorprendió. Es mi mate de todos los días ahora.', calif: 5 }
];

function getRandomDate() {
    const start = new Date(2025, 0, 1).getTime();
    const end = new Date().getTime();
    return new Date(start + Math.random() * (end - start)).toISOString().split('T')[0];
}

function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

async function seed() {
    try {
        await client.connect();
        console.log('Conectado a la BD.');

        // 0. Borrar todas las reseñas previas
        console.log('Borrando reseñas antiguas (incluye los "test")...');
        await client.query('DELETE FROM reseña');
        console.log('Reseñas eliminadas con éxito.');

        // 1. Crear usuarios (asegurar que existan)
        let userIds = [];
        for (let i = 0; i < names.length; i++) {
            const email = `usuario${i+1}@test.com`;
            const check = await client.query('SELECT id FROM Usuario WHERE email = $1', [email]);
            if (check.rows.length === 0) {
                const ins = await client.query(
                    'INSERT INTO Usuario (activo, fecha_registro, email, apellido, nombre, es_admin) VALUES (true, CURRENT_DATE, $1, $2, $3, false) RETURNING id',
                    [email, names[i].a, names[i].n]
                );
                userIds.push(ins.rows[0].id);
            } else {
                userIds.push(check.rows[0].id);
            }
        }

        // 2. Obtener productos y combos
        const prodQuery = await client.query('SELECT id FROM Producto');
        const productos = prodQuery.rows;
        const comboQuery = await client.query('SELECT id FROM combo');
        const combos = comboQuery.rows;

        let totalReviewsInserted = 0;

        // 3. Poblar Productos
        for (const prod of productos) {
            const numReviews = Math.floor(Math.random() * 3) + 2; // 2 to 4
            const shuffledReviews = shuffle([...reviewPool]); // Mezclar reviews
            const shuffledUsers = shuffle([...userIds]); // Mezclar usuarios para que no dejen doble
            
            for (let i = 0; i < numReviews; i++) {
                const review = shuffledReviews[i];
                const userId = shuffledUsers[i];
                const date = getRandomDate();

                try {
                    await client.query(
                        'INSERT INTO reseña (id_usuario, id_producto, titulo, contenido, calificacion, fecha_creacion) VALUES ($1, $2, $3, $4, $5, $6)',
                        [userId, prod.id, review.t, review.c, review.calif, date]
                    );
                    totalReviewsInserted++;
                } catch (err) { }
            }
        }

        // 4. Poblar Combos
        for (const combo of combos) {
            const numReviews = Math.floor(Math.random() * 3) + 2; // 2 to 4
            const shuffledReviews = shuffle([...reviewPool]);
            const shuffledUsers = shuffle([...userIds]);
            
            for (let i = 0; i < numReviews; i++) {
                const review = shuffledReviews[i];
                const userId = shuffledUsers[i];
                const date = getRandomDate();

                try {
                    await client.query(
                        'INSERT INTO reseña (id_usuario, id_combo, titulo, contenido, calificacion, fecha_creacion) VALUES ($1, $2, $3, $4, $5, $6)',
                        [userId, combo.id, review.t, review.c, review.calif, date]
                    );
                    totalReviewsInserted++;
                } catch (err) { }
            }
        }

        console.log(`¡Poblado exitoso! Se insertaron ${totalReviewsInserted} reseñas únicas.`);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

seed();
