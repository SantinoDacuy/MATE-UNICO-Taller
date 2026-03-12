--PARTE UNO = Creación de dominios
CREATE DOMAIN estado_v AS VARCHAR(15)
	CHECK (VALUE IN ('Pendiente', 'Confirmado', 'Cancelado'));

CREATE DOMAIN estado_e AS VARCHAR(15)
	CHECK (VALUE IN ('Preparando', 'Despachado', 'En camino', 'Entregado'));

CREATE DOMAIN prov AS VARCHAR(20)
	CHECK (VALUE IN ('Correo Argentino', 'Andreani', 'OCA'));

CREATE DOMAIN tip AS VARCHAR(40)
	CHECK (VALUE IN ('mate + bombilla', 'mate + bombilla + bolso'));

CREATE DOMAIN mate AS VARCHAR(15)
	CHECK (VALUE IN ('calabaza', 'vidrio', 'madera', 'metal'));

CREATE DOMAIN porc_descuento AS VARCHAR(20)
	CHECK (VALUE IN ('porcentaje', 'monto fijo'));

--PARTE DOS = Creacion de tablas
--Tablas sin dependencias

--1) Ciudad
CREATE TABLE Ciudad(
 ciudad_id SERIAL PRIMARY KEY,
 nombre VARCHAR (50),
 CP INT,
 provincia VARCHAR (50)
);

--2) Cupon
CREATE TABLE Cupon (
 id SERIAL PRIMARY KEY,
 codigo VARCHAR(50) UNIQUE NOT NULL,
 tipo_descuento porc_descuento NOT NULL,
 valor_descuento FLOAT CHECK (valor_descuento > 0),
 fecha_inicio DATE NOT NULL,
 fecha_vencimiento DATE NOT NULL CHECK (fecha_vencimiento >= fecha_inicio),
 activo BOOLEAN NOT NULL DEFAULT TRUE,
 usado BOOLEAN NOT NULL DEFAULT FALSE
);

--3) Producto
CREATE TABLE Producto (
 id SERIAL PRIMARY KEY,
 material mate NOT NULL,
 color VARCHAR(50) NOT NULL,
 dimensiones FLOAT CHECK (dimensiones > 0),
 capacidad FLOAT CHECK (capacidad > 0),
 precio FLOAT NOT NULL CHECK (precio > 0),
 fotos VARCHAR(250),
 descripcion VARCHAR(200),
 grabado BOOLEAN DEFAULT FALSE,
 cantidad_disp INT NOT NULL CHECK (cantidad_disp >= 0),
 umbral_min INT DEFAULT 5 CHECK (umbral_min >= 0)
);

--4) Combo
CREATE TABLE Combo (
 id SERIAL PRIMARY KEY,
 descripcion VARCHAR(200) NOT NULL,
 fotos VARCHAR(250),
 tipo_combo tip NOT NULL,
 fecha_creacion DATE NOT NULL,
 grabado BOOLEAN DEFAULT FALSE,
 cantidad_disp INT NOT NULL CHECK (cantidad_disp >= 0),
 umbral_min INT DEFAULT 5 CHECK (umbral_min >= 0)
);

--Tablas con dependencias
--5) Usuario
CREATE TABLE Usuario (
 id SERIAL PRIMARY KEY,
 activo BOOLEAN NOT NULL DEFAULT TRUE,
 fecha_registro DATE NOT NULL,
 telefono VARCHAR(20),
 email VARCHAR(100) UNIQUE NOT NULL,
 apellido VARCHAR(50) NOT NULL,
 nombre VARCHAR(50) NOT NULL,
 es_admin BOOLEAN DEFAULT FALSE,
 calle VARCHAR(100),
 numero INT,
 id_ciudad INT REFERENCES Ciudad(ciudad_id) 
);

--6) Reposicion_mate
CREATE TABLE Reposicion_Mate (
 id SERIAL PRIMARY KEY,
 fecha DATE NOT NULL,
 cantidad INT NOT NULL CHECK (cantidad > 0),
 id_producto INT NOT NULL REFERENCES Producto(id)
);

--7) Reposicion_combo
CREATE TABLE Reposicion_Combo (
 id SERIAL PRIMARY KEY,
 fecha DATE NOT NULL,
 cantidad INT NOT NULL CHECK (cantidad > 0),
 id_combo INT NOT NULL REFERENCES Combo(id)
);

--8) Reseña_producto
CREATE TABLE Reseña_Producto (
 id_usuario INT REFERENCES Usuario(id),
 id_producto INT REFERENCES Producto(id),
 calificacion INT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
 comentario VARCHAR(200),
 fecha_reseña DATE NOT NULL,
 PRIMARY KEY (id_usuario, id_producto)
);

--9) Reseña_combo
CREATE TABLE Reseña_Combo (
 id_usuario INT REFERENCES Usuario(id),
 id_combo INT REFERENCES Combo(id),
 calificacion INT NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
 comentario VARCHAR(200),
 fecha_reseña DATE NOT NULL,
 PRIMARY KEY (id_usuario, id_combo)
);

--Tablas de transacciones
--10) Venta
CREATE TABLE Venta (
 id SERIAL PRIMARY KEY,
 fecha_venta DATE NOT NULL,
 subtotal FLOAT CHECK (subtotal >= 0),
 descuento FLOAT DEFAULT 0 CHECK (descuento >= 0),
 total FLOAT NOT NULL CHECK (total >= 0),
 estado estado_v NOT NULL,
 metodo_pago VARCHAR(30) NOT NULL DEFAULT 'Mercado Pago',
 id_usuario INT NOT NULL REFERENCES Usuario(id),
 id_cupon INT REFERENCES Cupon(id)
);

--11) Carrito
CREATE TABLE Carrito (
 id SERIAL PRIMARY KEY,
 fecha_creacion DATE NOT NULL,
 fecha_actualizacion DATE,
 activo BOOLEAN DEFAULT TRUE,
 id_usuario INT UNIQUE REFERENCES Usuario(id),
 id_cupon INT REFERENCES Cupon(id)
);

--Tablas de detalles
--12) Envio
CREATE TABLE Envio (
 id SERIAL PRIMARY KEY,
 calle VARCHAR(100),
 numero INT,
 id_ciudad INT REFERENCES Ciudad(ciudad_id),
 empresa_envio prov NOT NULL,
 costo_envio FLOAT NOT NULL CHECK (costo_envio >= 0),
 estado estado_e NOT NULL DEFAULT 'Preparando',
 fecha_salida DATE,
 id_venta INT UNIQUE REFERENCES Venta(id)
);

--13) Detalle_venta
CREATE TABLE Detalle_Venta (
 id SERIAL PRIMARY KEY,
 cantidad INT NOT NULL CHECK (cantidad > 0),
 precio_unitario FLOAT NOT NULL CHECK (precio_unitario > 0),
 subtotal FLOAT NOT NULL CHECK (subtotal >= 0),
 total FLOAT NOT NULL CHECK (total >= 0),
 id_venta INT NOT NULL REFERENCES Venta(id),
 id_producto INT REFERENCES Producto(id),
 id_combo INT REFERENCES Combo(id)
);

--14) Detalle_carrito
CREATE TABLE Detalle_Carrito (
 id SERIAL PRIMARY KEY,
 cantidad INT NOT NULL CHECK (cantidad > 0),
 precio_unitario FLOAT NOT NULL CHECK (precio_unitario > 0),
 total FLOAT NOT NULL CHECK (total >= 0),
 fecha_agregado DATE NOT NULL,
 id_carrito INT NOT NULL REFERENCES Carrito(id),
 id_producto INT REFERENCES Producto(id),
 id_combo INT REFERENCES Combo(id)
);

--PARTE TRES = Reglas de negocio
ALTER TABLE Detalle_Venta ADD CONSTRAINT chk_item_venta_exclusivo
CHECK (
 (id_producto IS NULL AND id_combo IS NOT NULL) OR
 (id_producto IS NOT NULL AND id_combo IS NULL)
);

ALTER TABLE Detalle_Carrito ADD CONSTRAINT chk_item_carrito_exclusivo
CHECK (
 (id_producto IS NULL AND id_combo IS NOT NULL) OR
 (id_producto IS NOT NULL AND id_combo IS NULL)
);