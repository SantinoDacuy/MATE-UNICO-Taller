module.exports = {
  async afterUpdate(event) {
    await syncToBackend(event.result);
  },
  async afterCreate(event) {
    await syncToBackend(event.result);
  }
};

async function syncToBackend(eventResult) {
  try {
    // Strapi 4 en "afterUpdate" a veces no devuelve todos los campos
    // Nos aseguramos obteniendo la entidad completa directo desde la BD de Strapi
    const fullRecord = await strapi.entityService.findOne('api::pedido.pedido', eventResult.id);

    // Solo sincronizar si hay un id_venta de postgres asociado
    if (fullRecord && fullRecord.id_venta) {
      const resp = await fetch('http://127.0.0.1:3001/api/sync-estado-venta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_venta: fullRecord.id_venta,
          estado_venta: fullRecord.estado_venta,
          estado_envio: fullRecord.estado_envio
        })
      });

      if (!resp.ok) {
        strapi.log.error(`Backend Postgres rechazó el sync: ${await resp.text()}`);
      } else {
        strapi.log.info(`Sync OK: Venta PG ${fullRecord.id_venta} actualizada al estado: ${fullRecord.estado_venta}`);
      }
    } else {
      strapi.log.warn(`No sync: No hay id_venta asociado para pedido ID ${eventResult.id}`);
    }
  } catch (err) {
    strapi.log.error(`Fallo crítico al sincronizar con postgres: ${err.message}`);
  }
}
