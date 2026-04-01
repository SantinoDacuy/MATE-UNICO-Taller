--Trabajo Final Base de Datos
--Carballo Tobias, Dacuy Santino, Lucrecia Pereyra

--G) Test de integracion (proceso completo)

----------------
--TEST 1 (Camino Feliz - Venta Normal)
----------------

--limpiamos datos viejos del usuario 5
DELETE FROM Detalle_Carrito WHERE id_carrito IN (SELECT id FROM Carrito WHERE id_usuario = 5);
DELETE FROM Carrito WHERE id_usuario = 5;

--1) Preparacion: carrito nuevo usuario 5
INSERT INTO Carrito (fecha_creacion, activo, id_usuario)
VALUES (CURRENT_DATE, TRUE, 5);

-- agregamos productos
INSERT INTO Detalle_Carrito (cantidad, precio_unitario, total, fecha_agregado, id_carrito, id_producto)
VALUES (3, 0, 0, CURRENT_DATE, (SELECT id FROM Carrito WHERE id_usuario = 5 AND activo = TRUE LIMIT 1), 2);

--2) Control de stock antes
SELECT id, descripcion, cantidad_disp AS "Stock antes" FROM Producto WHERE id = 2;

--3) Ejecucion de compra
DO $$
DECLARE
    v_id_carrito INTEGER;
BEGIN
    SELECT id INTO v_id_carrito FROM Carrito WHERE id_usuario = 5 ORDER BY id DESC LIMIT 1;
	--llamamos al procedimiento
	CALL SP_ProcesarCompra(5, v_id_carrito, 'Mercado Pago', NULL);
END $$;

--4) Validacion
SELECT * FROM Venta ORDER BY id DESC;
SELECT * FROM Envio ORDER BY id DESC LIMIT 1;
SELECT id, descripcion, cantidad_disp AS "Stock despues" FROM Producto WHERE id = 1;
SELECT * FROM Carrito WHERE id_usuario = 5 ORDER BY id DESC LIMIT 1;


----------------
--TEST 2 (Venta con Cupon)
----------------
--limpieza
DELETE FROM Cupon WHERE codigo = 'OTOÑO20';

--creamos cupon
INSERT INTO Cupon (codigo, tipo_descuento, valor_descuento, fecha_inicio, fecha_vencimiento, activo, usado)
VALUES ('OTOÑO20', 'porcentaje', 20.00, '2024-01-01', '2030-01-01', TRUE, FALSE);

--limpiamos carrito usuario 10
DELETE FROM Detalle_Carrito WHERE id_carrito IN (SELECT id FROM Carrito WHERE id_usuario = 10);
DELETE FROM Carrito WHERE id_usuario = 10;

INSERT INTO Carrito (fecha_creacion, activo, id_usuario) VALUES (CURRENT_DATE, TRUE, 10);

INSERT INTO Detalle_Carrito (cantidad, precio_unitario, total, fecha_agregado, id_carrito, id_producto)
VALUES (1, 0, 0, CURRENT_DATE, (SELECT id FROM Carrito WHERE id_usuario = 10 AND activo = TRUE), 5);

--ejecucion
DO $$
DECLARE
	v_id_carrito INTEGER;
	v_id_cupon INTEGER;
BEGIN
	SELECT id INTO v_id_carrito FROM Carrito WHERE id_usuario = 10 AND activo = TRUE LIMIT 1;
	SELECT id INTO v_id_cupon FROM Cupon WHERE codigo = 'OTOÑO20' LIMIT 1;

	CALL SP_ProcesarCompra(10, v_id_carrito, 'Mercado Pago', v_id_cupon);
END $$;

SELECT * FROM Venta ORDER BY id DESC LIMIT 1;


----------------
--TEST 3 Vista productos mas vendidos
----------------
SELECT * FROM V_ProductosPopulares_Stock;


----------------
--TEST 4 Cancelacion de venta
----------------
DO $$
DECLARE
	v_id_venta INTEGER := 101;
	v_id_cupon INTEGER;
	v_stock_antes INTEGER;
BEGIN
	--stock inicial
	SELECT cantidad_disp INTO v_stock_antes FROM Producto WHERE id = 1;

	--crear cupon test
	INSERT INTO Cupon (id, codigo, tipo_descuento, valor_descuento, fecha_inicio, fecha_vencimiento, activo, usado)
	VALUES (999, 'TEST-CANCEL', 'monto fijo', 1000, CURRENT_DATE, '2030-01-01', TRUE, FALSE)
	ON CONFLICT (id) DO UPDATE SET usado = FALSE, activo = TRUE;
	v_id_cupon := 999;

	--simular venta confirmada
	INSERT INTO Venta (id, fecha_venta, total, estado, id_usuario, metodo_pago, subtotal, id_cupon)
	VALUES (v_id_venta, CURRENT_DATE, 5000, 'Confirmado', 2, 'Mercado Pago', 51000, v_id_cupon);

	UPDATE Cupon set usado = TRUE, activo = FALSE WHERE id = v_id_cupon;

	--insertamos detalle
	INSERT INTO Detalle_Venta (cantidad, precio_unitario, subtotal, total, id_venta, id_producto)
	VALUES (2, 25000, 50000, 50000, v_id_venta, 1);

	--cancelamos la venta
	UPDATE Venta SET estado = 'Cancelado' WHERE id = v_id_venta;

	RAISE NOTICE 'Prueba cancelacion finalizada. Verificar ID Venta: %', v_id_venta;

END $$;

--validacion final
SELECT * FROM Cupon WHERE id = 999; --deberia estar activo
SELECT id, descripcion, cantidad_disp FROM Producto WHERE id = 1; --stock devuelto

--limpieza
DELETE FROM Detalle_Venta WHERE id_venta = 100;
DELETE FROM Venta WHERE id = 100;


-----------------------
--TEST 5 Prueba borrado de carrito (Visual)
-----------------------
DELETE FROM Detalle_Carrito WHERE id_carrito IN (SELECT id FROM Carrito WHERE id_usuario = 5);
DELETE FROM Carrito WHERE id_usuario = 5;

INSERT INTO Carrito (fecha_creacion, activo, id_usuario) VALUES (CURRENT_DATE, TRUE, 5);

INSERT INTO Detalle_Carrito (cantidad, precio_unitario, total, fecha_agregado, id_carrito, id_producto)
VALUES (1, 30000, 30000, CURRENT_DATE, (SELECT id FROM Carrito WHERE id_usuario = 5 AND activo = TRUE LIMIT 1), 1);INSERT INTO Detalle_Carrito (cantidad, precio_unitario, total, fecha_agregado, id_carrito, id_producto)
VALUES (1, 20000, 20000, CURRENT_DATE, (SELECT id FROM Carrito WHERE id_usuario = 5 AND activo = TRUE LIMIT 1), 2);

--Mostramos carrito lleno
SELECT 'ANTES DE COMPRAR' as estado, * FROM Detalle_Carrito 
WHERE id_carrito = (SELECT MAX(id) FROM Carrito WHERE id_usuario = 5);

--Compramos
DO $$
DECLARE v_id_carrito INTEGER;
BEGIN
    SELECT MAX(id) INTO v_id_carrito FROM Carrito WHERE id_usuario = 5;
    CALL SP_ProcesarCompra(5, v_id_carrito, 'Mercado Pago', NULL);
END $$;

--Mostramos carrito vacio
SELECT 'DESPUES DE COMPRAR' as estado, * FROM Detalle_Carrito 
WHERE id_carrito = (SELECT MAX(id) FROM Carrito WHERE id_usuario = 5);


----------------------------------
-- A PARTIR DE ACA SON PRUEBAS DE ERROR (Ejecutar cada bloque uno por uno para probar)
-- (Estan comentadas para evitar detener el script general)
----------------------------------

/*
----------------
--TEST 6 Roles (Fallo de permisos)
----------------
SET ROLE rol_cliente; 

--esto tiene que dar error de permisos ("Permission denied"):
DELETE FROM Producto WHERE id = 1;

RESET ROLE;
*/


/*
----------------
--TEST 7 Fallo por stock insuficiente
----------------
--Preparacion
DELETE FROM Detalle_Carrito WHERE id_carrito IN (SELECT id FROM Carrito WHERE id_usuario = 7);
DELETE FROM Carrito WHERE id_usuario = 7;
INSERT INTO Carrito (fecha_creacion, activo, id_usuario) VALUES (CURRENT_DATE, TRUE, 7);
INSERT INTO Detalle_Carrito (cantidad, precio_unitario, total, fecha_agregado, id_carrito, id_producto)
VALUES (3000, 0, 0, CURRENT_DATE, (SELECT id FROM Carrito WHERE id_usuario = 7 AND activo = TRUE LIMIT 1), 3);

--Ejecucion (Debe dar Error: Stock insuficiente)
DO $$
DECLARE v_id_carrito INTEGER;
BEGIN
    SELECT id INTO v_id_carrito FROM Carrito WHERE id_usuario = 7 AND activo = TRUE LIMIT 1;
    CALL SP_ProcesarCompra(7, v_id_carrito, 'Efectivo', NULL);
END $$;
*/


/*
---------------------------
--TEST 8 Unitarios Triggers
---------------------------

--A) Grabado en vidrio (Debe dar error de negocio)
UPDATE Producto SET grabado = TRUE WHERE id = 14;

--B) Venta masiva sin stock (Debe dar error de stock)
INSERT INTO Detalle_Venta (cantidad , precio_unitario, subtotal, total, id_venta, id_producto)
VALUES (900000, 100, 100, 100, 1, 1);


----------------
--TEST 9 SEGURIDAD FISCAL (Cambio de Facturas)
----------------
--Intentamos violar la ley borrando una venta confirmada.
--RESULTADO ESPERADO: Error "ACCION ILEGAL: Las facturas son documentos fiscales"

DO $$
DECLARE
    v_id_venta_test INTEGER;
BEGIN
    --1. Buscamos una venta que exista (ej: la 1)
    v_id_venta_test := 1;

    --2. Intentamos borrarla (Esto debe explotar por el Trigger)
    DELETE FROM Venta WHERE id = v_id_venta_test;

EXCEPTION WHEN OTHERS THEN
    --3. Si salta el error, lo agarramos y mostramos que el sistema es seguro
    RAISE NOTICE '¡TEST EXITOSO! El sistema bloqueo el intento de borrado. Mensaje: %', SQLERRM;
END $$;


--Intentamos adulterar el monto de una venta
--RESULTADO ESPERADO: Error "ACCION ILEGAL: No se pueden alterar los datos fiscales"

DO $$
BEGIN
    --Intentamos cambiar el total de la venta 1 a $0
    UPDATE Venta SET total = 0 WHERE id = 1;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '¡TEST EXITOSO! El sistema bloqueo la adulteracion de montos. Mensaje: %', SQLERRM;
END $$;
*/