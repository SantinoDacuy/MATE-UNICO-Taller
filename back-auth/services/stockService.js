const STRAPI_URL = 'http://127.0.0.1:1337'; // Ajustar si es necesario

/**
 * Verifica si hay suficiente stock en Strapi para todos los items del carrito.
 * Retorna null si todo está bien, o un string con el mensaje de error si no hay stock.
 */
async function checkStockBeforePayment(cart) {
    try {
        for (const item of cart) {
            const documentId = item.documentId || String(item.id);
            // Hacer Peticion A Strapi para obtener información de este producto particular
            const response = await fetch(`${STRAPI_URL}/api/productos/${documentId}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    return `El producto ${item.nombre} no se encuentra en el catálogo.`;
                }
                console.warn(`No se pudo verificar el stock del producto ${item.nombre} en Strapi. Status: ${response.status}`);
                continue; // Si falla por algún otro motivo, podemos dejarlo pasar o bloquearlo, mejor dejarlo pasar o asumir que hay error temporal.
                // Como es una validación estricta, tal vez deberíamos frenar.
                // return `No se pudo verificar el stock del producto ${item.nombre}. Por favor, intente más tarde.`;
            }

            const json = await response.json();
            const productoStrapi = json.data;

            if (!productoStrapi) {
                return `El producto ${item.nombre} no fue encontrado en el catálogo.`;
            }

            // Suponiendo que el campo de stock en el content-type se llama 'stock'
            const stockActual = productoStrapi.stock || 0;
            const cantidadRequerida = Number(item.cantidad);

            if (stockActual < cantidadRequerida) {
                return `El producto "${item.nombre}" no tiene suficiente stock. Stock actual: ${stockActual}, solicitado: ${cantidadRequerida}.`;
            }
        }
        return null; // Todo OK
    } catch (error) {
        console.error('Error al validar stock en Strapi:', error.message);
        // Si hay error de red con Strapi, lo ideal sería frenar para no vender sin stock,
        // pero depende de la política de negocio.
        return 'Ocurrió un error al verificar la disponibilidad de los productos. Intente más tarde.';
    }
}

/**
 * Descuenta el stock en Strapi para los items pasados en base a lo comprado.
 */
async function deductStockFromStrapi(itemsBought) {
    for (const item of itemsBought) {
        const documentId = item.id; // Suponiendo que es el documentId de Strapi
        const cantidadComprada = Number(item.quantity) || 1;

        try {
            console.log(`[Stock Service] Actualizando stock en Strapi para producto ID: ${documentId}`);
            
            // Paso A: Obtener el stock actual del producto consultando a Strapi
            const getResponse = await fetch(`${STRAPI_URL}/api/productos/${documentId}`);
            if (!getResponse.ok) {
                throw new Error(`Error en GET /api/productos/${documentId} - Status: ${getResponse.status}`);
            }
            const jsonGet = await getResponse.json();
            const productoStrapi = jsonGet.data;

            if (!productoStrapi) {
                throw new Error(`El producto con ID ${documentId} no existe en Strapi.`);
            }

            const stockActual = productoStrapi.stock || 0;
            
            // Paso B: Calcular el nuevo stock
            const nuevoStock = Math.max(0, stockActual - cantidadComprada); // Evitamos stock negativo
            
            console.log(`[Stock Service] Producto ${documentId} | Stock actual: ${stockActual} | Cantidad comprada: ${cantidadComprada} | Nuevo stock a asignar: ${nuevoStock}`);

            // Paso C: Enviar una petición PUT a Strapi para actualizar el campo stock
            const putResponse = await fetch(`${STRAPI_URL}/api/productos/${documentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: {
                        stock: nuevoStock
                    }
                })
            });

            if (!putResponse.ok) {
                const errorText = await putResponse.text();
                throw new Error(`Error en PUT /api/productos/${documentId} - Status: ${putResponse.status} - ${errorText}`);
            }

            console.log(`[Stock Service] ✅ Stock actualizado correctamente para producto ID: ${documentId}`);
        } catch (error) {
            console.error(`[Stock Service] ❌ Error actualizando stock para producto ID: ${documentId}. Detalles:`, error.message);
        }
    }
}

module.exports = {
    checkStockBeforePayment,
    deductStockFromStrapi
};
