-- Script para crear la tabla de cupones usados
-- Ejecutar en PostgreSQL con: psql -U rol_administrador -d mate-unico -f cupones.sql

CREATE TABLE IF NOT EXISTS cupones_usados (
  id SERIAL PRIMARY KEY,
  id_usuario INTEGER NOT NULL REFERENCES "Usuario"(id) ON DELETE CASCADE,
  codigo_cupon VARCHAR(50) NOT NULL,
  fecha_uso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  id_venta INTEGER,
  UNIQUE(codigo_cupon, id_usuario)
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_cupones_usuario ON cupones_usados(id_usuario);
CREATE INDEX IF NOT EXISTS idx_cupones_codigo ON cupones_usados(codigo_cupon);

-- Comentario descriptivo
COMMENT ON TABLE cupones_usados IS 'Registro de cupones usados por usuario. Un cupón solo se puede usar UNA VEZ por usuario.';
COMMENT ON COLUMN cupones_usados.codigo_cupon IS 'Código del cupón (ej: PRUEBA, DESCUENTO10, etc)';
COMMENT ON COLUMN cupones_usados.id_venta IS 'ID de la venta donde se usó el cupón (opcional)';
