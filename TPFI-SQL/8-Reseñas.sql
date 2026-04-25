-- =====================================================
-- CREAR TABLA DE RESEÑAS Y OPINIONES
-- =====================================================

CREATE TABLE IF NOT EXISTS reseña (
    id SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES Usuario(id) ON DELETE CASCADE,
    id_producto INT REFERENCES Producto(id) ON DELETE CASCADE,
    id_combo INT REFERENCES Combo(id) ON DELETE CASCADE,
    titulo VARCHAR(100) NOT NULL,
    contenido TEXT,
    calificacion INT NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    fecha_creacion DATE NOT NULL DEFAULT CURRENT_DATE,
    CONSTRAINT check_product_or_combo CHECK (
        (id_producto IS NOT NULL AND id_combo IS NULL) OR
        (id_producto IS NULL AND id_combo IS NOT NULL)
    ),
    CONSTRAINT unique_user_product UNIQUE (id_usuario, id_producto),
    CONSTRAINT unique_user_combo UNIQUE (id_usuario, id_combo)
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_reseña_producto ON reseña(id_producto);
CREATE INDEX IF NOT EXISTS idx_reseña_combo ON reseña(id_combo);
CREATE INDEX IF NOT EXISTS idx_reseña_usuario ON reseña(id_usuario);
CREATE INDEX IF NOT EXISTS idx_reseña_fecha ON reseña(fecha_creacion DESC);

-- =====================================================
-- INSERTAR ALGUNAS RESEÑAS DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Primero, necesitamos asegurarnos de que hay usuarios y productos
-- INSERT INTO reseña (id_usuario, id_producto, titulo, contenido, calificacion, fecha_creacion)
-- VALUES 
-- (1, 1, 'Excelente calidad', 'Un mate muy bien hecho, muy bonito y de excelente calidad', 5, '2025-09-10'),
-- (2, 1, 'Perfectamente práctico', 'Se ve muy elegante y es muy cómodo de usar', 4, '2025-09-05'),
-- (3, 2, 'Recomendado', 'Muy bueno para regalar', 5, '2025-09-01');

-- =====================================================
-- Comentarios de la tabla
-- =====================================================

COMMENT ON TABLE reseña IS 'Tabla de reseñas y opiniones de usuarios sobre productos y combos';
COMMENT ON COLUMN reseña.id_usuario IS 'ID del usuario que deja la reseña';
COMMENT ON COLUMN reseña.id_producto IS 'ID del producto (NULL si es reseña de combo)';
COMMENT ON COLUMN reseña.id_combo IS 'ID del combo (NULL si es reseña de producto)';
COMMENT ON COLUMN reseña.titulo IS 'Título de la reseña (máximo 100 caracteres)';
COMMENT ON COLUMN reseña.contenido IS 'Contenido detallado de la opinión';
COMMENT ON COLUMN reseña.calificacion IS 'Calificación de 1 a 5 estrellas';
COMMENT ON COLUMN reseña.fecha_creacion IS 'Fecha en que se creó la reseña';
