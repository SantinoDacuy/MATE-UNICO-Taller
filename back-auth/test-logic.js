const db = require('./db');

async function testBackendCode() {
    const productId = 'ewhegeb0ajv15i2cwfb4mzcj';
    const productType = 'producto';
    const userId = 17;

    const getProductIdFromDocumentId = async (documentId) => {
        try {
            const numId = parseInt(documentId, 10);
            if (!isNaN(numId)) {
                let result = await db.query(
                    `SELECT id FROM "Producto" WHERE id = $1 LIMIT 1`,
                    [numId]
                );
                if (result.rows.length > 0) return numId;
            }
            
            let result = await db.query(
                `SELECT producto_id FROM strapi_producto_map WHERE strapi_document_id = $1 LIMIT 1`,
                [documentId]
            );
            
            if (result.rows.length > 0 && result.rows[0].producto_id) {
                return result.rows[0].producto_id;
            }
            return null;
        } catch (err) {
            console.error('Error mapeando:', err.message);
            return null;
        }
    };

    try {
        const dbProductId = productType === 'combo' ? productId : await getProductIdFromDocumentId(productId);
        
        if (!dbProductId) {
            console.log('Producto no encontrado (dbProductId null)');
            return;
        }

        let query = `
            SELECT COUNT(*) as count
            FROM venta v
            JOIN detalle_venta dv ON v.id = dv.id_venta
            WHERE v.id_usuario = $1 
            AND dv.id_producto = $2
            AND BTRIM(LOWER(v.estado)) != 'pendiente'`;

        const { rows: purchaseCheck } = await db.query(query, [userId, dbProductId]);
        console.log("purchaseCheck", purchaseCheck);
    } catch(e) {
        console.error("FAIL", e);
    } finally {
        process.exit();
    }
}
testBackendCode();
