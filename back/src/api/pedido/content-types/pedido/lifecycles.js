'use strict';

// Clase de error personalizada que declara `status` formalmente
class AppValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AppValidationError';
    this.status = 400;
  }
}

/**
 * @param {string} message
 * @returns {AppValidationError}
 */
const getApplicationError = (message) => {
  return new AppValidationError(message);
};

/**
 * @typedef {Object} LifecycleEvent
 * @property {Object} params - Parámetros del evento
 * @property {Object} params.data - Datos a actualizar
 * @property {Object} params.where - Condición WHERE
 */

module.exports = {
  /**
   * Validar cambios en pedidos antes de actualizar
   * @param {LifecycleEvent} event
   */
  async beforeUpdate(event) {
    const { params } = event;
    try {
      const { data, where } = params;
      
      if (!where || !where.id) {
        return; // Sin ID no se puede hacer nada
      }
      
      // Obtener el registro actual para comparar
      const currentRecord = await strapi.entityService.findOne('api::pedido.pedido', where.id);
      
      if (!currentRecord) {
        return; // Registro no existe
      }
      
      const estadoEnvioActual = currentRecord.estado_envio;
      const estadoVentaActual = currentRecord.estado_venta;
      
      // ============================================
      // VALIDACIÓN: SI EL ENVÍO YA ESTÁ ENTREGADO
      // ============================================
      if (estadoEnvioActual === 'Entregado') {
        // No se puede cambiar NADA si está Entregado
        if (data.estado_envio && data.estado_envio !== 'Entregado') {
          throw getApplicationError('Esta accion no esta permitida: El pedido ya fue entregado.');
        }
        if (data.estado_venta && data.estado_venta !== 'Aprobado') {
          throw getApplicationError('Esta accion no esta permitida: El pedido ya fue entregado.');
        }
      }
      
      // ============================================
      // VALIDACIÓN: CAMBIOS EN ESTADO_VENTA
      // ============================================
      if (data.estado_venta && data.estado_venta !== estadoVentaActual) {
        const nuevoEstadoVenta = data.estado_venta;
        
        // Si es Rechazado, permitir siempre (viene de Mercado Pago)
        if (nuevoEstadoVenta === 'Rechazado') {
          // Estado Rechazado viene de Mercado Pago, siempre se permite
          // Y fuerza el estado de envío a Preparando
          data.estado_envio = 'Preparando';
        } 
        // Si es Pendiente o Aprobado, solo permitir si el envío está en "Preparando"
        else if (nuevoEstadoVenta === 'Pendiente' || nuevoEstadoVenta === 'Aprobado') {
          if (estadoEnvioActual !== 'Preparando') {
            throw getApplicationError('Esta accion no esta permitida: Los cambios en estado de venta solo son permitidos cuando el envío está en preparación.');
          }
        }
      }
      
      // ============================================
      // VALIDACIÓN: CAMBIOS EN ESTADO_ENVIO
      // ============================================
      if (data.estado_envio && data.estado_envio !== estadoEnvioActual) {
        const nuevoEstadoEnvio = data.estado_envio;
        const transicionesPermitidas = {
          'Preparando': ['Despachado', 'En camino', 'Entregado'],
          'Despachado': ['En camino', 'Entregado'],
          'En camino': ['Entregado'],
          'Entregado': []
        };
        
        const permitidos = transicionesPermitidas[estadoEnvioActual] || [];
        
        if (!permitidos.includes(nuevoEstadoEnvio)) {
          throw getApplicationError('Esta accion no esta permitida: Transición de estado de envío inválida.');
        }
      }
    } catch (error) {
      // Re-lanzar errores de validación propios (status 400)
      if (error instanceof AppValidationError && error.status === 400) {
        throw error;
      }
      // Log de otros errores inesperados
      if (error instanceof Error) {
        strapi.log.error('Error en beforeUpdate de pedido:', error.message);
      }
      throw getApplicationError('Error al validar cambios en el pedido');
    }
  },

  /**
   * Sincronizar con backend después de actualizar
   * @param {Object} event
   * @param {Object} event.result - Resultado de la actualización
   */
  async afterUpdate(event) {
    const { result } = event;
    await syncToBackend(result);
  },

  /**
   * Sincronizar con backend después de crear
   * @param {Object} event
   * @param {Object} event.result - Resultado de la creación
   */
  async afterCreate(event) {
    const { result } = event;
    await syncToBackend(result);
  }
};

/**
 * Sincroniza cambios de pedido con PostgreSQL backend
 * @param {Object} eventResult
 */
async function syncToBackend(eventResult) {
  try {
    if (!eventResult || !eventResult.id) {
      strapi.log.warn('syncToBackend: No event result o id faltante');
      return;
    }

    // Strapi 5 devuelve los datos directamente
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
        const errorText = await resp.text();
        strapi.log.error(`Backend Postgres rechazó el sync: ${errorText}`);
      } else {
        strapi.log.info(`Sync OK: Venta PG ${fullRecord.id_venta} actualizada al estado: ${fullRecord.estado_venta}`);
      }
    } else {
      strapi.log.warn(`No sync: No hay id_venta asociado para pedido ID ${eventResult.id}`);
    }
  } catch (err) {
    if (err instanceof Error) {
      strapi.log.error(`Fallo crítico al sincronizar con postgres: ${err.message}`);
    } else {
      strapi.log.error(`Fallo crítico al sincronizar con postgres: ${String(err)}`);
    }
  }
}
