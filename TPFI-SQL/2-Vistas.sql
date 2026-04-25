--Trabajo Final Base de Datos
--Carballo Tobias, Dacuy Santino, Lucrecia Pereyra

--E) Definicion de vistas y consultas

--1) Vista de productos populares y stock (reporte admin, une mates y combos, suma ventas y muestra stock actual)
CREATE OR REPLACE VIEW V_ProductosPopulares_Stock AS
SELECT
	p.descripcion AS producto,
	'Mate Individual' AS tipo,
	COALESCE(SUM(dv.cantidad), 0) AS total_vendido,
	p.cantidad_disp AS stock_actual
FROM Producto p
LEFT JOIN Detalle_Venta dv on p.id = dv.id_producto
GROUP BY p.id, p.descripcion, p.cantidad_disp
UNION ALL
SELECT
	c.descripcion AS producto,
	'Combo' AS tipo,
	COALESCE(SUM(dv.cantidad), 0) AS total_vendido,
	c.cantidad_disp AS stock_actual
FROM Combo c
LEFT JOIN Detalle_Venta dv ON c.id = dv.id_combo
GROUP BY c.id, c.descripcion, c.cantidad_disp
ORDER BY total_vendido DESC;

--2) Vista de ventas por estado de envio
CREATE OR REPLACE VIEW V_VentasPorEstadoEnvio AS
SELECT
	estado,
	COUNT(*) AS cantidad_pedidos
FROM Envio
GROUP BY estado
ORDER BY cantidad_pedidos DESC;

--3) Vista de facturacion por mes (solo ventas confirmadas o entregadas, no canceladas)
CREATE OR REPLACE VIEW V_FacturacionMes AS
SELECT
	EXTRACT(YEAR FROM fecha_venta) AS año,
	EXTRACT(MONTH FROM fecha_venta) AS mes,
	COUNT(id) AS cantidad_ventas,
	SUM(total) AS total_facturado
FROM Venta
WHERE estado NOT IN ('Cancelado')
GROUP BY EXTRACT(YEAR FROM fecha_venta), EXTRACT(MONTH FROM fecha_venta)
ORDER BY año DESC, mes DESC;

--4) Vista de historial de compra del cliente (perfil del usuario)
CREATE OR REPLACE VIEW V_HistorialCompraCliente AS
SELECT
	v.id_usuario,
	v.id AS nro_factura,
	v.fecha_venta,
	v.total,
	v.estado AS estado_compra,
	e.estado AS estado_envio,
	e.empresa_envio AS correo
FROM Venta v
LEFT JOIN Envio e ON v.id = e.id_venta
ORDER BY v.fecha_venta DESC;

--5) Vista de promedio de reseñas (calcaula el promedio de estrellas para mostrarlas)
CREATE OR REPLACE VIEW V_ReseñasPromedio_Catalogo AS
SELECT
	p.descripcion AS item,
	ROUND(AVG(rp.calificacion), 1) AS promedio_estrellas,
	COUNT(*) AS cantidad_reseñas
FROM Reseña_Producto rp
JOIN Producto p ON rp.id_producto = p.id
GROUP BY p.id, p.descripcion
UNION ALL
SELECT
	c.descripcion AS item,
	ROUND(AVG(rc.calificacion), 1) AS promedio_estrellas,
	COUNT(*) AS cantidad_reseñas
FROM Reseña_Combo rc
JOIN Combo c on rc.id_combo = c.id
GROUP BY c.id, c.descripcion;


---------------------------
--PRUEBA--
---------------------------


-- 1. que es lo que mas se vende?
--lista ordenada con "total vendido" y cuanto stock queda
SELECT * FROM V_ProductosPopulares_Stock;

-- 2. como viene el envio?
--cuantos 'Entregado', 'Preparando', etc. hay
SELECT * FROM V_VentasPorEstadoEnvio;

-- 3. cuanta plata ingresa por mes?
--filas con año, mes y total facturado
SELECT * FROM V_FacturacionMes; 

-- 4. historial de compra de la gente
--listado con las compras de los usuarios y su estado de envio.
SELECT * FROM V_HistorialCompraCliente;

-- 5. opiniones de clientes, con promedio de estrellas
--productos con puntaje y cuantas reseñas tienen.
SELECT * FROM V_ReseñasPromedio_Catalogo;