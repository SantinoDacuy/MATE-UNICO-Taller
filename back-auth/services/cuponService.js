require('dotenv').config();
const db = require('../db');

// Obtener cupón de Strapi
async function obtenerCuponDeStrapi(codigo) {
  try {
    const strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
    const strapiToken = process.env.STRAPI_API_TOKEN;

    if (!strapiToken) {
      throw new Error('STRAPI_API_TOKEN no está configurado en .env');
    }

    // Normalizar a mayúsculas para comparación consistente
    const codeBuscado = codigo.trim().toUpperCase();

    // Buscar el cupón por código en Strapi (case-insensitive con $eqi)
    const response = await fetch(
      `${strapiUrl}/api/cupons?filters[codigo][$eqi]=${encodeURIComponent(codeBuscado)}&publicationState=live`,
      {
        headers: {
          'Authorization': `Bearer ${strapiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Error Strapi: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Validar que existe el cupón
    if (!data.data || data.data.length === 0) {
      return { valido: false, error: 'Cupón no encontrado' };
    }

    // FIX Strapi v5: los campos vienen directamente en data[0], sin .attributes
    const cuponRaw = data.data[0];
    const cupon = cuponRaw.attributes || cuponRaw; // compatibilidad v4/v5
    const cuponId = cuponRaw.id;

    // Verificar que esté activo
    if (!cupon.activo) {
      return { valido: false, error: 'Cupón inactivo' };
    }

    // Verificar fecha de vencimiento (el cupón es válido todo el día de vencimiento)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = new Date(cupon.fecha_vencimiento);
    vencimiento.setHours(23, 59, 59, 999);

    if (hoy > vencimiento) {
      return { valido: false, error: 'Cupón vencido' };
    }

    return {
      valido: true,
      cupon: {
        strapiId: cuponId,
        codigo: cupon.codigo,
        valor_descuento: cupon.valor_descuento,
        tipo_descuento: cupon.tipo_descuento,
        fecha_vencimiento: cupon.fecha_vencimiento,
        activo: cupon.activo
      }
    };
  } catch (err) {
    console.error('Error al obtener cupón de Strapi:', err);
    return { valido: false, error: 'Error al validar cupón' };
  }
}

// Validar que el usuario no haya usado este cupón antes
async function validarCuponPorUsuario(codigo, idUsuario) {
  try {
    const result = await db.query(
      'SELECT id FROM cupones_usados WHERE codigo_cupon = $1 AND id_usuario = $2',
      [codigo, idUsuario]
    );

    if (result.rows.length > 0) {
      return { valido: false, error: 'Ya usaste este cupón' };
    }

    return { valido: true };
  } catch (err) {
    console.error('Error al validar cupón por usuario:', err);
    return { valido: false, error: 'Error al verificar cupón' };
  }
}

// Validación completa del cupón
async function validarCupon(codigo, idUsuario) {
  // 1. Obtener de Strapi
  const { valido: validoStrapi, cupon, error: errorStrapi } = await obtenerCuponDeStrapi(codigo);
  if (!validoStrapi) {
    return { valido: false, error: errorStrapi };
  }

  // 2. Verificar que el usuario no lo haya usado
  const { valido: validoUsuario, error: errorUsuario } = await validarCuponPorUsuario(codigo, idUsuario);
  if (!validoUsuario) {
    return { valido: false, error: errorUsuario };
  }

  return { valido: true, cupon };
}

// Usar el cupón (registrar en la tabla)
async function usarCupon(codigo, idUsuario, idVenta = null) {
  try {
    // Primero validar
    const { valido, cupon, error } = await validarCupon(codigo, idUsuario);

    if (!valido) {
      return { exito: false, error };
    }

    // Registrar el uso
    await db.query(
      'INSERT INTO cupones_usados (id_usuario, codigo_cupon, id_venta) VALUES ($1, $2, $3)',
      [idUsuario, codigo, idVenta]
    );

    return {
      exito: true,
      descuento: cupon.valor_descuento,
      tipo: cupon.tipo_descuento,
      mensaje: `Cupón aplicado: ${cupon.valor_descuento}% de descuento`
    };
  } catch (err) {
    console.error('Error al usar cupón:', err);
    return { exito: false, error: 'Error al aplicar cupón' };
  }
}

module.exports = {
  obtenerCuponDeStrapi,
  validarCuponPorUsuario,
  validarCupon,
  usarCupon
};
