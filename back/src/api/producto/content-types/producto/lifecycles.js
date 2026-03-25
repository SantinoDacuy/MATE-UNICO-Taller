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

// Insert/update handler principal
const syncProductOrCombo = async (knex, documentId, data) => {
  const isCombo = data.categoria === 'combo_simple' || data.categoria === 'combo_completo';
  let pgId = null;
  let tableInserted = null;

  // Buscar si ya está mapeado
  const existing = await knex('strapi_producto_map').where('strapi_document_id', documentId).first();

  if (isCombo) {
    const tipo_combo = data.categoria === 'combo_simple' ? 'mate + bombilla' : 'mate + bombilla + bolso';
    const comboRow = {
      descripcion: data.nombre || 'Combo sin nombre',
      fotos: null,
      tipo_combo: tipo_combo,
      fecha_creacion: new Date().toISOString().split('T')[0],
      grabado: data.grabado || false,
      cantidad_disp: 10,
      umbral_min: 5,
      precio: Number(data.precio) || 0
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
      precio: Number(data.precio) || 0,
      fotos: null,
      descripcion: data.nombre || 'Sin nombre',
      grabado: data.grabado || false,
      cantidad_disp: 10
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
      const data = event.result;
      const documentId = data.documentId || String(data.id);
      
      const { tableInserted, pgId } = await syncProductOrCombo(knex, documentId, data);
      strapi.log.info(`✅ Synced: Strapi ${documentId} → PG ${tableInserted}.id=${pgId}`);
    } catch (error) {
      strapi.log.error('❌ Error (afterCreate):', error.message);
    }
  },

  async afterUpdate(event) {
    try {
      const knex = getKnex();
      await ensureMapTable(knex);
      const data = event.result;
      const documentId = data.documentId || String(data.id);
      
      const { tableInserted, pgId } = await syncProductOrCombo(knex, documentId, data);
      strapi.log.info(`✅ Synced update: Strapi ${documentId} → PG ${tableInserted}.id=${pgId}`);
    } catch (error) {
      strapi.log.error('❌ Error (afterUpdate):', error.message);
    }
  },

  async afterDelete(event) {
    try {
      const knex = getKnex();
      await ensureMapTable(knex);
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
