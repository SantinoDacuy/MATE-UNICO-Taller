--Trabajo Final Base de Datos
--Carballo Tobias, Dacuy Santino, Lucrecia Pereyra

--B) Creacion de roles y usuarios

---------------------------
--Primero, borramos los permisos para dejar limpia la base
---------------------------
--Le pasamos la propiedad a postgres
REASSIGN OWNED BY rol_administrador TO postgres;
REASSIGN OWNED BY rol_cliente TO postgres;
REASSIGN OWNED BY rol_aplicacion TO postgres;

--Le sacamos todos los permisos (grant)
DROP OWNED BY rol_administrador;
DROP OWNED BY rol_cliente;
DROP OWNED BY rol_aplicacion;

--Borramos
DROP ROLE rol_administrador;
DROP ROLE rol_cliente;
DROP ROLE rol_aplicacion;


--1) Rol de administrador (permiso total sobre toda la bd)
CREATE ROLE rol_administrador WITH LOGIN PASSWORD 'admin123';
GRANT ALL PRIVILEGES ON DATABASE "mate-unico" TO rol_administrador;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public to rol_administrador;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public to rol_administrador;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public to rol_administrador;


--2) Rol de cliente (permisos: solo ver catalogo y gestionar sus compras)
CREATE ROLE rol_cliente WITH LOGIN PASSWORD 'cliente123';

--Permisos basicos de conexion
GRANT CONNECT ON DATABASE "mate-unico" TO rol_cliente;
GRANT USAGE ON SCHEMA public to rol_cliente;

--A) puede ver (select) productos, combos, reseñas y sus propios historiales
GRANT SELECT ON Producto, Combo, Reseña_Producto, Reseña_Combo TO rol_cliente;
GRANT SELECT ON V_ReseñasPromedio_Catalogo, V_HistorialCompraCliente TO rol_cliente;

--B) puede gestionar su carrito (insert, update, delete, select)
GRANT ALL PRIVILEGES ON Carrito, Detalle_Carrito TO rol_cliente;

--C) puede crear una compra (insert)
GRANT INSERT ON Venta, Detalle_Venta, Envio TO rol_cliente;
GRANT INSERT ON Reseña_Producto, Reseña_Combo TO rol_cliente;

--D) puede actualizar su info personal (direccion, telefono)
GRANT UPDATE (calle, numero, telefono) ON Usuario TO rol_cliente;

--E) permiso para usar los id automaticos (sequences)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rol_cliente;


--3) Rol de aplicacion Mercado Pago (para q el sistema actualice si se pago o no)
CREATE ROLE rol_aplicacion WITH LOGIN PASSWORD 'app123';

GRANT CONNECT ON DATABASE "mate-unico" TO rol_aplicacion;
GRANT USAGE ON SCHEMA public TO rol_aplicacion;

-- solo puede actualizar el estado de la venta (confirmado/pagado)
GRANT UPDATE (estado) ON Venta TO rol_aplicacion