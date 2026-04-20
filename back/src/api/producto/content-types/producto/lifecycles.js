'use strict';

/**
 * Lifecycle hook para sincronizar productos de Strapi → tabla "producto" o "combo" de PostgreSQL.
 */

// Helper: obtener la conexión knex de Strapi (misma DB PostgreSQL)
const getKnex = () => strapi.db.connection;

// Helper: crear/alterar la tabla de mapeo
const ensureMapTable = async (knex) => {
  const exists = await knex.schema.hasTable('strapi_producto_map');
  if (!exists) {
    await knex.schema.createTable('strapi_producto_map', (table) => {
      table.string('strapi_document_id', 255).primary();
      table.integer('producto_id').references('id').inTable('producto').nullable();
      table.integer('combo_id').references('id').inTable('combo').nullable();
    });
    strapi.log.info('✅ Tabla strapi_producto_map creada (con soporte para combos)');
  } else {
    // Asegurar que exista combo_id
    const hasCombo = await knex.schema.hasColumn('strapi_producto_map', 'combo_id');
    if (!hasCombo) {
      await knex.schema.alterTable('strapi_producto_map', table => {
        table.integer('combo_id').references('id').inTable('combo').nullable();
        table.integer('producto_id').nullable().alter();
      });
      strapi.log.info('✅ Tabla strapi_producto_map actualizada con combo_id');
    }
  }
};

// Helper: extraer el primer color activo
const getColor = (data) => {
  if (data.color_negro) return 'Negro';
  if (data.color_marron) return 'Marron';
  if (data.color_blanco) return 'Blanco';
  if (data.color_gris) return 'Gris';
  return 'Negro'; // default
};

// FIX: Obtener datos completos del documento usando el documentId
// En Strapi v5, event.result puede no traer todos los campos → hacemos un findOne
const getFullData = async (documentId) => {
  try {
    const result = await strapi.documents('api::producto.producto').findOne({
      documentId,
    });
    return result;
  } catch (err) {
    strapi.log.warn(`⚠️ No se pudo obtener datos completos para documentId ${documentId}: ${err.message}`);
    return null;
  }
};

// Insert/update handler principal
const syncProductOrCombo = async (knex, documentId, data) => {
  const isCombo = data.categoria === 'combo_simple' || data.categoria === 'combo_completo';
  let pgId = null;
  let tableInserted = null;

  // Buscar si ya está mapeado
  const existing = await knex('strapi_producto_map').where('strapi_document_id', documentId).first();

  // FIX: precio llega como string desde Strapi (biginteger se serializa así)
  // Usamos parseFloat para manejar ambos casos (string y number)
  const precio = parseFloat(data.precio) || 0;

  // FIX: grabado puede ser null → lo normalizamos explícitamente a boolean
  const grabado = data.grabado === true;

  // FIX: usar el campo stock real de Strapi en vez de hardcodear 10
  const stock = Number(data.stock) || 0;

  if (isCombo) {
    const tipo_combo = data.categoria === 'combo_simple' ? 'mate + bombilla' : 'mate + bombilla + bolso';
    const comboRow = {
      descripcion: data.nombre || 'Combo sin nombre',
      fotos: null,
      tipo_combo: tipo_combo,
      fecha_creacion: new Date().toISOString().split('T')[0],
      grabado: grabado,
      cantidad_disp: stock,
      umbral_min: 5,
      precio: precio
    };

    if (existing && existing.combo_id) {
      await knex('combo').where('id', existing.combo_id).update(comboRow);
      pgId = existing.combo_id;
    } else {
      const [inserted] = await knex('combo').insert(comboRow).returning('id');
      pgId = inserted.id || inserted;
    }
    tableInserted = 'combo';
  } else {
    // Es un mate (producto)
    const productoRow = {
      material: data.material || 'calabaza',
      color: getColor(data),
      dimensiones: 10.0,
      capacidad: 200,
      precio: precio,
      fotos: null,
      descripcion: data.nombre || 'Sin nombre',
      grabado: grabado,
      cantidad_disp: stock
    };

    if (existing && existing.producto_id) {
      await knex('producto').where('id', existing.producto_id).update(productoRow);
      pgId = existing.producto_id;
    } else {
      const [inserted] = await knex('producto').insert(productoRow).returning('id');
      pgId = inserted.id || inserted;
    }
    tableInserted = 'producto';
  }

  // Guardar/Actualizar mapeo
  if (!existing) {
    await knex('strapi_producto_map').insert({
      strapi_document_id: documentId,
      producto_id: tableInserted === 'producto' ? pgId : null,
      combo_id: tableInserted === 'combo' ? pgId : null
    });
  } else {
    await knex('strapi_producto_map').where('strapi_document_id', documentId).update({
      producto_id: tableInserted === 'producto' ? pgId : null,
      combo_id: tableInserted === 'combo' ? pgId : null
    });
  }

  return { tableInserted, pgId };
};

module.exports = {
  async afterCreate(event) {
    try {
      const knex = getKnex();
      await ensureMapTable(knex);

      // FIX: Obtener documentId del resultado y luego buscar datos completos con findOne
      // event.result en Strapi v5 puede no traer todos los campos
      const rawResult = event.result;
      const documentId = rawResult.documentId || String(rawResult.id);

      // Obtener datos completos del documento
      const data = await getFullData(documentId) || rawResult;

      const { tableInserted, pgId } = await syncProductOrCombo(knex, documentId, data);
      strapi.log.info(`✅ [afterCreate] Synced: Strapi ${documentId} → PG ${tableInserted}.id=${pgId}`);
    } catch (error) {
      strapi.log.error('❌ Error (afterCreate):', error.message);
    }
  },

  async afterUpdate(event) {
    try {
      const knex = getKnex();
      await ensureMapTable(knex);

      // FIX: Mismo fix que en afterCreate — usar findOne para obtener datos completos
      const rawResult = event.result;
      const documentId = rawResult.documentId || String(rawResult.id);

      // Obtener datos completos del documento
      const data = await getFullData(documentId) || rawResult;

      const { tableInserted, pgId } = await syncProductOrCombo(knex, documentId, data);
      strapi.log.info(`✅ [afterUpdate] Synced: Strapi ${documentId} → PG ${tableInserted}.id=${pgId}`);
    } catch (error) {
      strapi.log.error('❌ Error (afterUpdate):', error.message);
    }
  },

  async afterDelete(event) {
    try {
      const knex = getKnex();
      await ensureMapTable(knex);

      // FIX: en afterDelete, event.result puede tener documentId o solo id
      const documentId = event.result.documentId || String(event.result.id);

      const mapping = await knex('strapi_producto_map').where('strapi_document_id', documentId).first();
      if (mapping) {
        await knex('strapi_producto_map').where('strapi_document_id', documentId).del();
        strapi.log.info(`✅ Mapeo eliminado para Strapi ${documentId}`);
      }
    } catch (error) {
      strapi.log.error('❌ Error en afterDelete:', error.message);
    }
  }
};
