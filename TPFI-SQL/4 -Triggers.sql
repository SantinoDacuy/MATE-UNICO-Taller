--Trabajo Final Base de Datos
--Carballo Tobias, Dacuy Santino, Lucrecia Pereyra

--C) Definicion de triggers

--1) Restriccion de grabado en vidrio (si el mate es de vidrio grabado no puede ser true)

CREATE OR REPLACE FUNCTION fn_check_grabado_vidrio()
RETURNS TRIGGER AS $$
BEGIN
	IF LOWER(TRIM(NEW.material)) = 'vidrio' AND NEW.grabado = TRUE THEN
		RAISE EXCEPTION 'Error de negocio: los mates de vidrio no permiten grabados';
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--TRIGGER de funcion
CREATE TRIGGER TR_MateGrabado_Check
BEFORE INSERT OR UPDATE ON Producto
FOR EACH ROW
EXECUTE FUNCTION fn_check_grabado_vidrio();


--2) Actualizacion automatica de cupon (si la venta tiene uno, este pasa a usado=true y activo=false)
CREATE OR REPLACE FUNCTION fn_marcar_cupon_usado()
RETURNS TRIGGER AS $$
BEGIN
	IF NEW.id_cupon IS NOT NULL THEN
	UPDATE Cupon
	SET usado = TRUE,
		activo = FALSE
	WHERE ID = NEW.id_cupon;
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--TRIGGER de funcion
CREATE TRIGGER TR_ActualizarCuponUsado
AFTER INSERT ON Venta
FOR EACH ROW
EXECUTE FUNCTION fn_marcar_cupon_usado();


--3) Verificar stock antes de insertar, para que no pidan mas productos del que se tiene
CREATE OR REPLACE FUNCTION fn_verificar_stock()
RETURNS TRIGGER AS $$
DECLARE
	stock_actual INTEGER;
BEGIN
	--Si es producto:
	IF NEW.id_producto IS NOT NULL THEN
		SELECT cantidad_disp INTO stock_actual FROM Producto WHERE id = NEW.id_producto;

		IF stock_actual < NEW.cantidad THEN
			RAISE EXCEPTION 'Sotck insuficiente para el Producto ID %. (pediste %, quedan %)', NEW.id_producto, NEW.cantidad, stock_actual;
		END IF;

	--Si es combo:
	ELSIF NEW.id_combo IS NOT NULL THEN
		SELECT cantidad_disp INTO stock_actual FROM Combo WHERE id = NEW.id_combo;

		IF stock_actual < NEW.cantidad THEN
			RAISE EXCEPTION 'Stock insuficiente para el Combo ID %. (pediste %, quedan %)', NEW.id_combo, NEW.cantidad, stock_actual;
		END IF;
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--TRIGGER de funcion
CREATE TRIGGER TR_VerificarStock
BEFORE INSERT ON Detalle_Venta
FOR EACH ROW
EXECUTE FUNCTION fn_verificar_stocK();


--4) Restar stock despues de insertar (cuando se aprueba una venta, baja el numero de inventario)
CREATE OR REPLACE FUNCTION fn_restar_stock()
RETURNS TRIGGER AS $$
BEGIN
	--si es producto
	IF NEW.id_producto IS NOT NULL THEN
		UPDATE Producto
		SET cantidad_disp = cantidad_disp - NEW.cantidad
		WHERE id = NEW.id_producto;

	--si es combo
	ELSIF NEW.id_combo IS NOT NULL THEN
		UPDATE Combo
		SET cantidad_disp = cantidad_disp - NEW.cantidad
		WHERE id = NEW.id_combo;
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--TRIGGER de funcion
CREATE TRIGGER TR_RestarStock
AFTER INSERT ON Detalle_Venta
FOR EACH ROW
EXECUTE FUNCTION fn_restar_stock();


--5) Devolver el stock si se cancela una venta (si la venta pasa a cancelado, recorre los items y los suma de nuevo), si en la misma se usa un cupon, tambien es devuelto al usuario
CREATE OR REPLACE FUNCTION fn_devolver_stock_cancelacion()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    --si el estado pasa a 'Cancelado'
    IF NEW.estado = 'Cancelado' AND OLD.estado != 'Cancelado' THEN
        
        RAISE NOTICE 'Atencion! Cancelación detectada. Devolviendo stock de Venta ID %...', NEW.id;

        --recorremos los productos de esa venta
        FOR item IN SELECT * FROM Detalle_Venta WHERE id_venta = NEW.id LOOP
            
            --si es Producto
            IF item.id_producto IS NOT NULL THEN
                UPDATE Producto 
                SET cantidad_disp = cantidad_disp + item.cantidad 
                WHERE id = item.id_producto;
                
            --si es Combo
            ELSIF item.id_combo IS NOT NULL THEN
                UPDATE Combo 
                SET cantidad_disp = cantidad_disp + item.cantidad 
                WHERE id = item.id_combo;
            END IF;
        END LOOP;

		--reactivacion de cupon
		IF NEW.id_cupon IS NOT NULL THEN
			UPDATE Cupon
			SET usado = FALSE,
				activo = TRUE
			WHERE id = NEW.id_cupon;

			RAISE NOTICE 'Cupon ID % reactivado', NEW.id_cupon;
		END IF;
		
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--TRIGGER de funcion
CREATE TRIGGER TR_DevolverStock
AFTER UPDATE ON Venta
FOR EACH ROW
EXECUTE FUNCTION fn_devolver_stock_cancelacion();


--6) Precio automatico en carrito
CREATE OR REPLACE FUNCTION fn_set_precio_carrito()
RETURNS TRIGGER AS $$
DECLARE
	v_precio DECIMAL (10,2);
BEGIN
	--a) si es producto
	IF NEW.id_producto IS NOT NULL THEN
		SELECT precio INTO v_precio FROM Producto WHERE id = NEW.id_producto;

	--b) si es combo
	ELSIF NEW.id_combo IS NOT NULL THEN
		SELECT precio INTO v_precio FROM Combo WHERE id = NEW.id_combo;
	END IF;

	--verificamos que encontro un precio
	IF v_precio IS NULL THEN
		RAISE EXCEPTION 'Error: no se encontro precio para el item ingresado';
	END IF;

	--asignamos precio real y calculamos de nuevo el total
	NEW.precio_unitario := v_precio;
	NEW.total := v_precio * NEW.cantidad;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--TRIGGER de funcion
CREATE TRIGGER TR_PrecioAutomatico_Carrito
BEFORE INSERT ON Detalle_Carrito
FOR EACH ROW
EXECUTE FUNCTION fn_set_precio_carrito();

--7) Seguridad en venta y detalle venta (solo permite cambiar su estado)
CREATE OR REPLACE FUNCTION fn_proteger_factura()
RETURNS TRIGGER AS $$
BEGIN
	--1. que no se pueda borrar:
	IF (TG_OP = 'DELETE') THEN
		RAISE EXCEPTION 'Accion ilegal, las facturas no pueden ser eliminadas. Debe cancelarlas';
	END IF;

	--2. si es actualizar:
	IF (TG_OP = 'UPDATE') THEN
		--a) si es la tabla detalle prohibido
		IF (TG_TABLE_NAME = 'detalle_venta') THEN
			RAISE EXCEPTION 'Accion ilegal, los detalles de la factura no se pueden modificar';
		END IF;
		
		--b) si es la tabla venta solo se puede actualizar el estado
		IF (TG_TABLE_NAME = 'venta') THEN
			--si intenta cambiar fecha, usuario, total, error:
			IF (OLD.fecha_venta <> NEW.fecha_venta OR OLD.total <> NEW.total OR OLD.id_usuario <> NEW.id_usuario) THEN
				RAISE EXCEPTION 'Accion ilegal, no se pueden alterar datos fiscales. Solo se permite el cambio de estado';
			END IF;
		END IF;
	END IF;

	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--TRIGGER DE FUNCION
--lo asignamos a venta:
CREATE TRIGGER TR_Seguridad_Venta
BEFORE DELETE OR UPDATE ON Venta
FOR EACH ROW EXECUTE FUNCTION FN_proteger_factura();

--lo asignamos a detalle_venta:
CREATE TRIGGER TR_Seguridad_Detalle
BEFORE DELETE OR UPDATE ON Detalle_Venta
FOR EACH ROW EXECUTE FUNCTION FN_proteger_factura();