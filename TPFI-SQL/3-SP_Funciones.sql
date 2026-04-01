--Trabajo Final Base de Datos
--Carballo Tobias, Dacuy Santino, Lucrecia Pereyra

--F) Creacion de Stored Procedures y Funciones

-- 1) Funcion de calcular costo envío
CREATE OR REPLACE FUNCTION FN_CalcularCostoEnvio(p_codigo_postal VARCHAR)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    costo DECIMAL(10,2);
    cp_numerico INTEGER;
BEGIN
    BEGIN
        cp_numerico := CAST(p_codigo_postal AS INTEGER);
        --regla: CP < 2000 es mas barato
        IF cp_numerico < 2000 THEN
            costo := 1500.00; 
        ELSE
            costo := 3260.00;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        costo := 3260.00; -- Ante error, tarifa plena
    END;
    RETURN costo;
END;
$$ LANGUAGE plpgsql;

-- 2) Funcion de calcular total de venta
CREATE OR REPLACE FUNCTION FN_CalcularTotalVenta(p_id_venta INTEGER)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_total_detalles DECIMAL(10,2);
    v_descuento DECIMAL(10,2);
    v_total_final DECIMAL(10,2);
BEGIN
    -- Sumar items
    SELECT COALESCE(SUM(total), 0) INTO v_total_detalles
    FROM Detalle_Venta WHERE id_venta = p_id_venta;

    -- Obtener descuento
    SELECT COALESCE(descuento, 0) INTO v_descuento
    FROM Venta WHERE id = p_id_venta;

    v_total_final := v_total_detalles - v_descuento;

    IF v_total_final < 0 THEN v_total_final := 0; END IF;

    RETURN v_total_final;
END;
$$ LANGUAGE plpgsql;


-- 3) Procedimiento de alerta de stock bajo
CREATE OR REPLACE FUNCTION SP_AlertaStockBajo()
RETURNS TABLE (
    tipo TEXT,
    nombre VARCHAR,
    stock_actual INTEGER,
    stock_minimo INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'Mate'::TEXT, descripcion, cantidad_disp, stock_min
    FROM Producto WHERE cantidad_disp <= stock_min
    UNION ALL
    SELECT 'Combo'::TEXT, descripcion, cantidad_disp, stock_min
    FROM Combo WHERE cantidad_disp <= stock_min;
END;
$$ LANGUAGE plpgsql;


-- 4) Procedimiento de reporte top productos
CREATE OR REPLACE FUNCTION SP_GenerarReporteTopProductos(p_limite INTEGER)
RETURNS TABLE (
    producto VARCHAR,
    tipo TEXT,
    total_vendido BIGINT,
    stock_actual INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT v.producto, v.tipo, v.total_vendido, v.stock_actual
    FROM V_ProductosPopulares_Stock v
    LIMIT p_limite;
END;
$$ LANGUAGE plpgsql;

-- 5) Procesar Compra
-- Une calle+numero y busca el cp en la tabla Ciudad
CREATE OR REPLACE PROCEDURE SP_ProcesarCompra(
    p_id_usuario INTEGER,
    p_id_carrito INTEGER,
    p_metodo_pago VARCHAR,
    p_id_cupon INTEGER DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    -- Variables generales
    v_id_venta INTEGER;
    v_subtotal DECIMAL(10,2);
    v_descuento DECIMAL(10,2) := 0;
    v_total_final DECIMAL(10,2);
    v_costo_envio DECIMAL(10,2);
    
    -- Variables para direccion
    v_calle_usuario VARCHAR;
    v_numero_usuario INTEGER;
    v_id_ciudad_usuario INTEGER;
    v_cp_usuario VARCHAR;
    
    v_registro_carrito RECORD;
BEGIN
    -- A) Validaciones
    PERFORM id FROM Carrito WHERE id = p_id_carrito AND id_usuario = p_id_usuario AND activo = TRUE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Error: el carrito % no existe, no pertenece al usuario % o ya se procesó', p_id_carrito, p_id_usuario;
    END IF;

    -- B) Preparacion de datos
    SELECT 
        u.calle,
        u.numero,
        u.id_ciudad,
        COALESCE(CAST(c.cp AS VARCHAR), '1000') 
    INTO v_calle_usuario, v_numero_usuario, v_id_ciudad_usuario, v_cp_usuario
    FROM Usuario u
    LEFT JOIN Ciudad c ON u.id_ciudad = c.ciudad_id 
    WHERE u.id = p_id_usuario;

    -- 3. Calcular costo envio
    v_costo_envio := FN_CalcularCostoEnvio(v_cp_usuario);

    -- 4. Calcular subtotal
    SELECT COALESCE(SUM(total), 0) INTO v_subtotal
    FROM Detalle_Carrito WHERE id_carrito = p_id_carrito;

    IF v_subtotal = 0 THEN
        RAISE EXCEPTION 'Error: el carrito esta vacio';
    END IF;

    -- 5. Aplicar cupon
    IF p_id_cupon IS NOT NULL THEN
        SELECT
            CASE
                WHEN tipo_descuento = 'porcentaje' THEN (v_subtotal * valor_descuento / 100)
                ELSE valor_descuento
            END INTO v_descuento
        FROM Cupon WHERE id = p_id_cupon AND activo = TRUE AND fecha_vencimiento >= CURRENT_DATE;

        IF v_descuento IS NULL THEN
            v_descuento := 0;
            RAISE NOTICE 'Aviso: el cupon % no es valido o vencio. No se aplicara descuento', p_id_cupon;
        END IF;
    END IF;

    -- 6. Calcular total final
    v_total_final := v_subtotal - v_descuento;
    IF v_total_final < 0 THEN v_total_final := 0; END IF;

    -- C) Transaccion
    -- 7. Crear la venta
    INSERT INTO Venta (fecha_venta, subtotal, descuento, total, estado, metodo_pago, id_usuario, id_cupon)
    VALUES (CURRENT_DATE, v_subtotal, v_descuento, v_total_final, 'Confirmado', p_metodo_pago, p_id_usuario, p_id_cupon)
    RETURNING id INTO v_id_venta;

    -- 8. Crear el envio
    INSERT INTO Envio (estado, calle, numero, id_ciudad, costo_envio, empresa_envio, id_venta)
    VALUES ('Preparando', v_calle_usuario, v_numero_usuario, v_id_ciudad_usuario, v_costo_envio, 'Correo Argentino', v_id_venta);

    -- 9. Mover items
    FOR v_registro_carrito IN SELECT * FROM Detalle_Carrito WHERE id_carrito = p_id_carrito LOOP
        INSERT INTO Detalle_Venta (cantidad, precio_unitario, subtotal, total, id_venta, id_producto, id_combo)
        VALUES (
            v_registro_carrito.cantidad, 
            v_registro_carrito.precio_unitario, 
            v_registro_carrito.total, 
            v_registro_carrito.total,
            v_id_venta, 
            v_registro_carrito.id_producto, 
            v_registro_carrito.id_combo
        );
    END LOOP;

	--Limpieza fisica de Detalle Carrito
	DELETE FROM Detalle_Carrito WHERE id_carrito = p_id_carrito;
	
    -- 10. Cerrar carrito
    UPDATE Carrito SET activo = FALSE WHERE id = p_id_carrito;

    RAISE NOTICE '¡Compra exitosa! Venta #% Total: $% (Envio: $%)', v_id_venta, v_total_final, v_costo_envio;
END;
$$;
