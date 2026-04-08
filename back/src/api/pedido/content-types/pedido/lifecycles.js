module.exports = {
  async afterUpdate(event) {
    await syncToBackend(event.result);
  },
  async afterCreate(event) {
    await syncToBackend(event.result);
  }
};

async function syncToBackend(result) {
  // Solo sincronizar si hay un id de postgres asociado
  if (result && result.id_venta) {
    try {
      const resp = await fetch('http://127.0.0.1:3001/api/sync-estado-venta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_venta: result.id_venta,
          estado_venta: result.estado_venta,
          estado_envio: result.estado_envio
        })
      });
      if (!resp.ok) {
        strapi.log.error(`Backend Postgres rechazó el sync: ${await resp.text()}`);
      } else {
        strapi.log.info(`Sincronización hacia backend completada para id_venta: ${result.id_venta}`);
      }
    } catch (err) {
      strapi.log.error(`Fallo al sincronizar con el backend de postgres: ${err.message}`);
    }
  }
}
