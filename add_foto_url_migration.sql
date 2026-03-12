-- Migración para agregar columna foto_url a la tabla Usuario
-- Esta columna almacenará la URL de la foto de perfil de Google OAuth

ALTER TABLE Usuario ADD COLUMN foto_url VARCHAR(500);