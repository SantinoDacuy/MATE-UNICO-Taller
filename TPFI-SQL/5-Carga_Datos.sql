--Trabajo Final Base de Datos
--Carballo Tobias, Dacuy Santino, Lucrecia Pereyra

--D) Poblado de datos

-- DESACTIVAR SEGURIDAD TEMPORALMENTE (Para permitir carga inicial)
ALTER TABLE Venta DISABLE TRIGGER TR_Seguridad_Venta;
ALTER TABLE Detalle_Venta DISABLE TRIGGER TR_Seguridad_Detalle;
ALTER TABLE Detalle_Venta DISABLE TRIGGER TR_VerificarStock; --Desactivamos check de stock para carga inicial
ALTER TABLE Detalle_Venta DISABLE TRIGGER TR_RestarStock; --Desactivamos resta de stock para carga inicial

-- 1) Ciudades (15)
INSERT INTO Ciudad (ciudad_id, nombre, CP, provincia) VALUES
(1, 'Concepción del Uruguay', 3260, 'Entre Ríos'),
(2, 'Paraná', 3100, 'Entre Ríos'),
(3, 'Colón', 3280, 'Entre Ríos'),
(4, 'Gualeguaychú', 2820, 'Entre Ríos'),
(5, 'Gualeguay', 2840, 'Entre Ríos'),
(6, 'CABA', 1000, 'Buenos Aires'),
(7, 'Rosario', 2000, 'Santa Fe'),
(8, 'Córdoba Capital', 5000, 'Córdoba'),
(9, 'Mendoza Capital', 5500, 'Mendoza'),
(10, 'San Miguel de Tucumán', 4000, 'Tucumán'),
(11, 'Mar del Plata', 7600, 'Buenos Aires'),
(12, 'Salta Capital', 4400, 'Salta'),
(13, 'Corrientes Capital', 3400, 'Corrientes'),
(14, 'Posadas', 3300, 'Misiones'),
(15, 'Neuquén Capital', 8300, 'Neuquén');

-- 2) Usuarios (1 Admin, 14 Clientes)
INSERT INTO Usuario (id, fecha_registro, telefono, email, apellido, nombre, es_admin, calle, numero, id_ciudad) VALUES
(1, '2024-08-01', '3442000001', 'admin@gmail.com', 'Messi', 'Lionel', TRUE, '9 de Julio', 123, 1),
(2, '2024-09-15', '3442000002', 'tobias@gmail.com', 'Carballo', 'Tobias', FALSE, '9 de Julio', 100, 1),
(3, '2024-10-05', '3442000003', 'santino@gmail.com', 'Dacuy', 'Santino', FALSE, '9 de Julio', 101, 1),
(4, '2024-11-03', '3442000004', 'lucrecia@gmail.com', 'Pereyra', 'Lucrecia', FALSE, 'Calle 7', 100, 3),
(5, '2024-12-24', '3442000005', 'lucas@gmail.com', 'Martinez', 'Lucas', FALSE, 'Urquiza', 500, 2),
(6, '2025-01-29', '3442000006', 'florencia@gmail.com', 'Rodriguez', 'Florencia', FALSE, 'Calle 12', 123, 4),
(7, '2025-02-17', '3442000007', 'carlos@gmail.com', 'Lopez', 'Carlos', FALSE, 'Lacava', 90, 5),
(8, '2025-03-02', '3442000008', 'miguel@gmail.com', 'Diaz', 'Miguel', FALSE, 'San Martin', 220, 8),
(9, '2025-04-19', '3442000009', 'laura@gmail.com', 'Moreno', 'Laura', FALSE, '25 de Mayo', 512, 12),
(10, '2025-05-07', '3442000010', 'lucia@gmail.com', 'Montañana', 'Lucia', FALSE, 'Belgrano', 265, 6),
(11, '2025-06-02', '3442000011', 'victor@gmail.com', 'Romero', 'Victor', FALSE, 'Roca', 451, 9),
(12, '2025-06-23', '3442000012', 'fernando@gmail.com', 'Suarez', 'Fernando', FALSE, 'Bolivar', 233, 13),
(13, '2025-08-17', '3442000013', 'patricia@gmail.com', 'Vargas', 'Patricia', FALSE, 'Junin', 150, 7),
(14, '2025-10-10', '3442000014', 'juan@gmail.com', 'Perez', 'Juan', FALSE, 'Coronel Diaz', 341, 11),
(15, '2025-12-05', '3442000015', 'julian@gmail.com', 'Lopez', 'Julian', FALSE, 'Calle 3', 1200, 14);

-- 3) Cupones (15)
INSERT INTO Cupon (id, codigo, tipo_descuento, valor_descuento, fecha_inicio, fecha_vencimiento, activo, usado) VALUES
(1, 'BIENVENIDA', 'porcentaje', 10, '2025-12-31', '2027-12-31', TRUE, FALSE),
(2, 'VERANO', 'porcentaje', 15, '2025-12-21', '2027-03-21', TRUE, FALSE),
(3, 'INVIERNO', 'porcentaje', 10, '2025-08-15', '2026-08-15', TRUE, FALSE),
(4, 'OTOÑO', 'porcentaje', 30, '2025-03-21', '2027-06-21', FALSE, TRUE),
(5, 'PRIMAVERA', 'monto fijo', 5000, '2025-09-21', '2027-12-21', TRUE, FALSE),
(6, 'HOTSALE', 'porcentaje', 15, '2025-10-10', '2027-10-17', TRUE, FALSE),
(7, 'BLACKFRIDAY', 'porcentaje', 15, '2025-05-20', '2027-05-25', TRUE, FALSE),
(8, 'CYBERMONDAY', 'porcentaje', 30, '2025-03-01', '2027-03-25', TRUE, FALSE),
(9, 'PAPA10', 'porcentaje', 10, '2025-12-31', '2027-12-31', TRUE, FALSE),
(10, 'MAMA10', 'porcentaje', 10, '2025-12-31', '2027-12-31', TRUE, FALSE),
(11, 'MATEUNICO', 'monto fijo', 10000, '2026-01-01', '2026-12-01', TRUE, FALSE),
(12, 'NAVIDAD', 'porcentaje', 15, '2025-12-01', '2027-12-23', TRUE, FALSE),
(13, 'VENCIDO2022', 'porcentaje', 35, '2022-01-01', '2022-12-31', FALSE, FALSE),
(14, 'REGALO01', 'porcentaje', 10, '2025-12-31', '2028-12-31', TRUE, FALSE),
(15, '2X1MATE', 'porcentaje', 50, '2023-06-17', '2028-05-17', TRUE, FALSE);

-- 4) Productos (15)
INSERT INTO Producto (id, material, color, dimensiones, capacidad, precio, fotos, descripcion, grabado, cantidad_disp) VALUES
(1, 'calabaza', 'Negro', 10.5, 200, 30000, '/img/productos/calabaza/imperial1.jpg', 'Imperial de calabaza', TRUE, 30),
(2, 'calabaza', 'Negro', 11.0, 250, 30000, '/img/productos/calabaza/torpedo1.jpg', 'Torpedo de calabaza', TRUE, 20),
(3, 'calabaza', 'Negro', 10.5, 200, 32000, '/img/productos/calabaza/camionero1.jpg', 'Camionero de calabaza', TRUE, 10),
(4, 'calabaza', 'Blanco', 12.0, 300, 29000, '/img/productos/calabaza/imperial2.jpg', 'Imperial de calabaza', TRUE, 15),
(5, 'calabaza', 'Marron', 11.5, 270, 28000, '/img/productos/calabaza/imperial3.jpg', 'Imperial de calabaza', TRUE, 30),
(6, 'calabaza', 'Marron', 10.5, 200, 30000, '/img/productos/calabaza/torpedo2.jpg', 'Torpedo de calabaza', TRUE, 20),
(7, 'madera', 'Algarrobo', 9.0, 150, 18000, '/img/productos/madera/foto1.jpg', 'Torpedo de madera', TRUE, 15),
(8, 'madera', 'Algarrobo', 9.5, 180, 20000, '/img/productos/madera/foto2.jpg', 'Torpedo de madera', TRUE, 20),
(9, 'madera', 'Algarrobo', 9.5, 180, 20000, '/img/productos/madera/foto3.jpg', 'Camionero de madera', TRUE, 15),
(10, 'madera', 'Algarrobo', 9.0, 150, 18500, '/img/productos/madera/foto4.jpg', 'Imperial de madera', TRUE, 10),
(11, 'metal', 'Acero', 10.0, 250, 16500, '/img/productos/metal/foto1.jpg', 'Mate térmico de acero inoxidable', TRUE, 10),
(12, 'metal', 'Negro', 9.5, 200, 15000, '/img/productos/metal/foto2.jpg', 'Mate térmico negro', TRUE, 5),
(13, 'metal', 'Blanco', 10.0, 250, 16500, '/img/productos/metal/foto3.jpg', 'Mate térmico blanco', TRUE, 5),
(14, 'vidrio', 'Transparente', 8.0, 170, 12000, '/img/productos/vidrio/foto1.jpg', 'Mate de vidrio transparente', FALSE, 3),
(15, 'vidrio', 'Rojo', 8.0, 170, 13500, '/img/productos/vidrio/foto2.jpg', 'Mate de vidrio rojo', FALSE, 2);

-- 5) Combos (10)
INSERT INTO Combo (id, descripcion, tipo_combo, fecha_creacion, grabado, cantidad_disp, precio) VALUES
(1, 'Kit imperial calabaza', 'mate + bombilla', '2024-01-10', TRUE, 8, 42000),
(2, 'Kit torpedo calabaza', 'mate + bombilla', '2024-02-10', TRUE, 8, 38000),
(3, 'Kit madera economico', 'mate + bombilla', '2024-03-15', TRUE, 4, 25000),
(4, 'Kit inicial calabaza', 'mate + bombilla', '2024-06-07', TRUE, 10, 30000),
(5, 'Kit premium calabaza', 'mate + bombilla', '2024-02-20', TRUE, 4, 45000),
(6, 'Set premium imperial calabaza', 'mate + bombilla + bolso', '2024-02-20', TRUE, 10, 65000),
(7, 'Set inicial madera', 'mate + bombilla + bolso', '2024-02-20', TRUE, 5, 40000),
(8, 'Set verano metal', 'mate + bombilla + bolso', '2024-02-20', TRUE, 5, 38000),
(9, 'Set urbano vidrio', 'mate + bombilla + bolso', '2024-02-20', FALSE, 2, 32000),
(10, 'Set premium torpedo calabaza', 'mate + bombilla + bolso', '2024-02-20', TRUE, 10, 62000);

-- 6) Ventas (15)
INSERT INTO Venta (id, fecha_venta, subtotal, descuento, total, estado, metodo_pago, id_usuario, id_cupon) VALUES
(1, '2024-10-15', 60000, 30000, 30000, 'Confirmado', 'Mercado Pago', 2, 15),
(2, '2024-11-20', 32000, 0, 32000, 'Confirmado', 'Mercado Pago', 3, NULL),
(3, '2024-12-10', 28000, 0, 28000, 'Pendiente', 'Mercado Pago', 4, NULL),
(4, '2025-01-15', 30000, 0, 30000, 'Cancelado', 'Mercado Pago', 5, NULL),
(5, '2025-02-20', 16500, 0, 16500, 'Confirmado', 'Mercado Pago', 6, NULL),
(6, '2025-03-05', 40000, 0, 40000, 'Confirmado', 'Mercado Pago', 7, NULL),
(7, '2025-04-10', 18000, 0, 18000, 'Confirmado', 'Mercado Pago', 8, NULL),
(8, '2025-05-25', 60000, 9000, 51000, 'Confirmado', 'Mercado Pago', 9, 7),
(9, '2025-06-15', 15000, 0, 15000, 'Pendiente', 'Mercado Pago', 10, NULL),
(10, '2025-07-20', 36000, 18000, 18000, 'Confirmado', 'Mercado Pago', 11, 15),
(11, '2025-08-20', 12000, 0, 12000, 'Cancelado', 'Mercado Pago', 12, NULL),
(12, '2025-09-25', 25000, 5000, 20000, 'Confirmado', 'Mercado Pago', 13, 5),
(13, '2025-11-10', 30000, 4500, 25500, 'Confirmado', 'Mercado Pago', 14, 6),
(14, '2025-12-20', 50000, 7500, 42500, 'Confirmado', 'Mercado Pago', 15, 12),
(15, '2025-12-28', 13500, 0, 13500, 'Confirmado', 'Mercado Pago', 2, NULL);

-- 7) Detalles de venta
INSERT INTO Detalle_venta (cantidad, precio_unitario, subtotal, total, id_venta, id_producto, id_combo) VALUES
(2, 30000, 60000, 60000, 1, 1, NULL),
(1, 32000, 32000, 32000, 2, 3, NULL),
(1, 28000, 28000, 28000, 3, 5, NULL),
(1, 30000, 30000, 30000, 4, 6, NULL),
(1, 16500, 16500, 16500, 5, 13, NULL),
(2, 20000, 40000, 40000, 6, 8, NULL),
(1, 18000, 18000, 18000, 7, 7, NULL),
(2, 30000, 60000, 60000, 8, 1, NULL),
(1, 15000, 15000, 15000, 9, 12, NULL),
(2, 18000, 36000, 36000, 10, 7, NULL),
(1, 12000, 12000, 12000, 11, 14, NULL),
(1, 25000, 25000, 25000, 12, NULL, 4),
(1, 30000, 30000, 30000, 13, 1, NULL),
(1, 50000, 50000, 50000, 14, NULL, 6),
(1, 13500, 13500, 13500, 15, 15, NULL),
(1, 12000, 12000, 12000, 1, 14, NULL),
(1, 18500, 18500, 18500, 2, 10, NULL),
(1, 25000, 25000, 25000, 3, NULL, 4),
(1, 20000, 20000, 20000, 4, 8, NULL),
(1, 13500, 13500, 13500, 5, 15, NULL),
(1, 25000, 25000, 25000, 6, NULL, 4),
(1, 16500, 16500, 16500, 7, 11, NULL),
(1, 29000, 29000, 29000, 8, 4, NULL),
(1, 12000, 12000, 12000, 9, 14, NULL),
(1, 25000, 25000, 25000, 10, NULL, 1),
(1, 16500, 16500, 16500, 11, 13, NULL),
(1, 18000, 18000, 18000, 12, 7, NULL),
(1, 50000, 50000, 50000, 13, NULL, 6),
(1, 30000, 30000, 30000, 14, 1, NULL),
(1, 15000, 15000, 15000, 15, 12, NULL);

-- Actualizacion de totales
UPDATE Venta v
SET 
    subtotal = (SELECT SUM(total) FROM Detalle_Venta WHERE id_venta = v.id),
    total = (SELECT SUM(total) FROM Detalle_Venta WHERE id_venta = v.id) - v.descuento;

-- 8) Envios
INSERT INTO Envio (calle, numero, id_ciudad, empresa_envio, costo_envio, estado, fecha_salida, id_venta) VALUES
('9 de Julio', 123, 1, 'Andreani', 1500, 'Entregado', '2024-10-17', 1),
('9 de Julio', 101, 1, 'Correo Argentino', 1200, 'Entregado', '2024-11-22', 2),
('Calle 7', 100, 3, 'OCA', 1800, 'Preparando', NULL, 3),
('Urquiza', 500, 2, 'Andreani', 2000, 'Preparando', NULL, 4),
('Calle 12', 123, 4, 'Correo Argentino', 2200, 'Entregado', '2025-02-22', 5),
('Lacava', 90, 5, 'OCA', 1300, 'Entregado', '2025-03-07', 6),
('San Martin', 220, 8, 'Andreani', 2500, 'Entregado', '2025-04-12', 7),
('25 de Mayo', 512, 12, 'Correo Argentino', 3000, 'Entregado', '2025-05-27', 8),
('Belgrano', 265, 6, 'OCA', 1600, 'Preparando', NULL, 9),
('Roca', 451, 9, 'Andreani', 2800, 'Entregado', '2025-07-22', 10),
('Bolivar', 233, 13, 'Correo Argentino', 1400, 'Preparando', NULL, 11),
('Junin', 150, 7, 'OCA', 1900, 'Entregado', '2025-09-27', 12),
('Coronel Díaz', 341, 11, 'Andreani', 2100, 'Entregado', '2025-11-12', 13),
('Calle 3', 1200, 14, 'Correo Argentino', 3200, 'En camino', '2025-12-21', 14),
('9 de Julio', 123, 1, 'OCA', 1500, 'Despachado', '2025-12-29', 15);

-- 9) Reseñas
INSERT INTO Reseña_Producto (id_usuario, id_producto, calificacion, comentario, fecha_reseña) VALUES
(2, 1, 5, 'Excelente calidad el imperial, la virola brilla un montón', '2024-10-20'),
(3, 3, 4, 'Muy buen mate, tardó un poquito el curado nomas', '2024-11-25'),
(5, 13, 5, 'El acero mantiene el agua bien caliente', '2025-02-25'),
(7, 7, 3, 'Lindo pero esperaba que sea mas grande', '2025-04-15'),
(11, 14, 5, 'Hermoso el vidrio para el mate de te', '2025-08-25');

INSERT INTO Reseña_Combo (id_usuario, id_combo, calificacion, comentario, fecha_reseña) VALUES
(12, 4, 5, 'El kit inicial es perfecto para regalo', '2025-09-30'),
(14, 6, 5, 'El bolso joya y el mate de 10', '2025-12-22'),
(4, 4, 4, 'Buen precio', '2025-01-10'),
(7, 4, 5, 'Excelente compra, no esperaba menos', '2025-03-10'),
(10, 1, 3, 'Todo muy bueno pero la bombilla deja que desear', '2025-07-25');

-- 10) Reposiciones
INSERT INTO Reposicion_Mate (fecha, cantidad, id_producto) VALUES
('2024-01-05', 50, 1),
('2024-02-10', 30, 5),
('2024-05-20', 20, 13),
('2024-08-15', 40, 7),
('2024-11-01', 25, 2);

INSERT INTO Reposicion_Combo (fecha, cantidad, id_combo) VALUES
('2024-03-01', 20, 4),
('2024-04-15', 10, 6),
('2024-07-10', 15, 1),
('2024-09-20', 30, 8),
('2024-12-01', 10, 2);

-- 11) Carrito
INSERT INTO Carrito (fecha_creacion, activo, id_usuario, id_cupon) VALUES
('2026-01-05', TRUE, 2, NULL),
('2026-01-06', TRUE, 3, NULL),
('2026-01-07', TRUE, 4, NULL),
('2026-01-08', TRUE, 5, NULL),
('2026-01-08', TRUE, 6, NULL),
('2026-01-09', TRUE, 7, NULL),
('2026-01-09', TRUE, 8, NULL),
('2026-01-10', TRUE, 9, NULL),
('2026-01-10', TRUE, 10, NULL),
('2026-01-10', TRUE, 11, NULL);

-- 12) Detalle carrito
INSERT INTO Detalle_Carrito (cantidad, precio_unitario, total, fecha_agregado, id_carrito, id_producto, id_combo) VALUES
(1, 30000, 30000, '2026-01-05', 1, 1, NULL),
(1, 12000, 12000, '2026-01-05', 1, 14, NULL),
(2, 12000, 24000, '2026-01-06', 2, 14, NULL),
(2, 16500, 33000, '2026-01-06', 2, 13, NULL),
(1, 25000, 25000, '2026-01-07', 3, NULL, 4),
(1, 30000, 30000, '2026-01-08', 4, 1, NULL),
(1, 28000, 28000, '2026-01-08', 4, 5, NULL),
(1, 30000, 30000, '2026-01-08', 4, 6, NULL),
(1, 28000, 28000, '2026-01-08', 5, 5, NULL),
(1, 50000, 50000, '2026-01-09', 6, NULL, 6),
(2, 13500, 27000, '2026-01-09', 6, 15, NULL),
(1, 18000, 18000, '2026-01-09', 7, 7, NULL),
(1, 29000, 29000, '2026-01-09', 7, 4, NULL),
(1, 29000, 29000, '2026-01-10', 8, 4, NULL),
(3, 12000, 36000, '2026-01-10', 9, 14, NULL),
(1, 16500, 16500, '2026-01-10', 9, 11, NULL),
(1, 25000, 25000, '2026-01-10', 10, NULL, 1),
(1, 12000, 12000, '2026-01-10', 10, 14, NULL),
(1, 30000, 30000, '2026-01-10', 10, 2, NULL),
(1, 20000, 20000, '2026-01-10', 10, 8, NULL);

-- Sincronización de secuencias
SELECT setval('usuario_id_seq', (SELECT MAX(id) FROM Usuario));
SELECT setval('venta_id_seq', (SELECT MAX(id) FROM Venta));
SELECT setval('envio_id_seq', (SELECT MAX(id) FROM Envio));
SELECT setval('carrito_id_seq', (SELECT MAX(id) FROM Carrito));
SELECT setval('cupon_id_seq', (SELECT MAX(id) FROM Cupon));
SELECT setval('ciudad_ciudad_id_seq', (SELECT MAX(ciudad_id) FROM Ciudad));
SELECT setval('producto_id_seq', (SELECT MAX(id) FROM Producto));
SELECT setval('combo_id_seq', (SELECT MAX(id) FROM Combo));

-- REACTIVAR SEGURIDAD (Volvemos a prender las alarmas)
ALTER TABLE Venta ENABLE TRIGGER TR_Seguridad_Venta;
ALTER TABLE Detalle_Venta ENABLE TRIGGER TR_Seguridad_Detalle;
ALTER TABLE Detalle_Venta ENABLE TRIGGER TR_VerificarStock;
ALTER TABLE Detalle_Venta ENABLE TRIGGER TR_RestarStock;