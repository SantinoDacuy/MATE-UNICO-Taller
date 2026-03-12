import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PagoDireccion.css';

const initialProducts = [
  { id: 1, nombre: 'Mate Imperial', color: 'Marrón', cantidad: 1, precio: 32000, imagenUrl: '/path/to/mate-imperial-marron.png' },
  { id: 2, nombre: 'Mate Torpedo', color: 'Marrón', cantidad: 1, precio: 25000, imagenUrl: '/path/to/mate-torpedo-marron.png' }
];

const formatPrecio = (precio) => `$${precio.toLocaleString('es-AR')}`;

// Provincias y ciudades de Argentina
const provinciasYCiudades = {
  'Buenos Aires': ['La Plata', 'Mar del Plata', 'Bahía Blanca', 'Quilmes', 'Lanús', 'General Pueyrredón', 'Merlo', 'Moreno', 'Lomas de Zamora', 'Tigre', 'San Isidro', 'Vicente López', 'Avellaneda', 'Banfield', 'Berazategui', 'Florencio Varela', 'San Miguel', 'Malvinas Argentinas', 'José C. Paz', 'Hurlingham'],
  'Córdoba': ['Córdoba', 'Villa María', 'Río Cuarto', 'Villa Carlos Paz', 'San Francisco', 'Villa Allende', 'Jesús María', 'Unquillo', 'La Calera', 'Arroyito', 'Marcos Juárez', 'Bell Ville', 'Leones', 'Morteros', 'Villa Dolores'],
  'Santa Fe': ['Rosario', 'Santa Fe', 'Rafaela', 'Venado Tuerto', 'Reconquista', 'Santo Tomé', 'Villa Gobernador Gálvez', 'San Lorenzo', 'Pérez', 'Casilda', 'Esperanza', 'Sunchales', 'Firmat', 'Gálvez'],
  'Mendoza': ['Mendoza', 'San Rafael', 'Godoy Cruz', 'Las Heras', 'Luján de Cuyo', 'Maipú', 'Guaymallén', 'Tunuyán', 'San Martín', 'Rivadavia', 'General Alvear', 'Malargüe'],
  'Tucumán': ['San Miguel de Tucumán', 'Yerba Buena', 'Tafí Viejo', 'Concepción', 'Aguilares', 'Monteros', 'Famaillá', 'Lules', 'Banda del Río Salí'],
  'Salta': ['Salta', 'San Salvador de Jujuy', 'Orán', 'Tartagal', 'General Güemes', 'Metán', 'Cafayate', 'Rosario de la Frontera', 'Cerrillos'],
  'Entre Ríos': ['Paraná', 'Concordia', 'Gualeguaychú', 'Concepción del Uruguay', 'Villaguay', 'Colón', 'Federación', 'Nogoyá', 'Victoria'],
  'Misiones': ['Posadas', 'Oberá', 'Eldorado', 'Puerto Iguazú', 'Apóstoles', 'Leandro N. Alem', 'San Vicente', 'Jardín América', 'Montecarlo'],
  'Corrientes': ['Corrientes', 'Goya', 'Mercedes', 'Paso de los Libres', 'Curuzú Cuatiá', 'Bella Vista', 'Monte Caseros', 'Esquina'],
  'Chaco': ['Resistencia', 'Barranqueras', 'Villa Ángela', 'Presidencia Roque Sáenz Peña', 'Charata', 'General San Martín', 'Quitilipi', 'Machagai'],
  'Santiago del Estero': ['Santiago del Estero', 'La Banda', 'Añatuya', 'Frías', 'Termas de Río Hondo', 'Loreto', 'Quimilí', 'Monte Quemado'],
  'San Juan': ['San Juan', 'Rawson', 'Rivadavia', 'Pocito', 'Caucete', 'Chimbas', 'Albardón', 'Jáchal', 'Calingasta'],
  'Jujuy': ['San Salvador de Jujuy', 'Palpalá', 'Perico', 'San Pedro de Jujuy', 'Libertador General San Martín', 'Humahuaca', 'Tilcara', 'La Quiaca'],
  'Río Negro': ['Viedma', 'Bariloche', 'General Roca', 'Cipolletti', 'San Carlos de Bariloche', 'Allen', 'Cinco Saltos', 'Villa Regina', 'El Bolsón'],
  'Formosa': ['Formosa', 'Clorinda', 'Pirané', 'El Colorado', 'Laguna Blanca', 'Ibarreta', 'Las Lomitas', 'Comandante Fontana'],
  'Neuquén': ['Neuquén', 'Cutral Có', 'Plottier', 'Zapala', 'San Martín de los Andes', 'Villa La Angostura', 'Centenario', 'Añelo'],
  'Chubut': ['Rawson', 'Comodoro Rivadavia', 'Trelew', 'Puerto Madryn', 'Esquel', 'Sarmiento', 'Gaiman', 'Dolavon'],
  'San Luis': ['San Luis', 'Villa Mercedes', 'Merlo', 'La Toma', 'Concarán', 'Tilisarao', 'Quines', 'Buena Esperanza'],
  'Catamarca': ['San Fernando del Valle de Catamarca', 'Valle Viejo', 'San Isidro', 'Recreo', 'Belén', 'Andalgalá', 'Fiambalá', 'Santa María'],
  'La Rioja': ['La Rioja', 'Chilecito', 'Arauco', 'Chamical', 'Aimogasta', 'Chepes', 'Vinchina', 'Famatina'],
  'La Pampa': ['Santa Rosa', 'General Pico', 'Toay', 'Realicó', 'Eduardo Castex', 'Macachín', 'Intendente Alvear', 'Victorica'],
  'Santa Cruz': ['Río Gallegos', 'Caleta Olivia', 'El Calafate', 'Puerto Deseado', 'Las Heras', 'Pico Truncado', 'Río Turbio', 'Perito Moreno'],
  'Tierra del Fuego': ['Ushuaia', 'Río Grande', 'Tolhuin', 'San Sebastián'],
};

const provincias = Object.keys(provinciasYCiudades);

export default function PagoDireccion() {
  const [productos, setProductos] = useState(initialProducts);
  const [coupon, setCoupon] = useState('');
  const [toast, setToast] = useState(null);
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState('');
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('');

  const envio = 4000;
  const gravado = 0;
  const descuento = -10000;

  const subtotal = useMemo(() => productos.reduce((s, p) => s + p.precio * p.cantidad, 0), [productos]);
  const total = subtotal + envio + gravado + descuento;

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(id);
  }, [toast]);

  // load shared header/footer fragments from components
  const [headerHtml, setHeaderHtml] = useState('');
  const [footerHtml, setFooterHtml] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/src/components/header.html').then(r => r.text()).catch(() => ''),
      fetch('/src/components/footer.html').then(r => r.text()).catch(() => '')
    ]).then(([header, footer]) => {
      setHeaderHtml(header);
      setFooterHtml(footer);
    });

    if (!document.querySelector('link[href="/src/components/styles.css"]')) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = '/src/components/styles.css';
      document.head.appendChild(l);
    }
  }, []);

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/pago-envio');
  };

  const applyCoupon = () => {
    if (!coupon) return setToast('Ingresa un cupón');
    setToast('Cupón aplicado');
    setCoupon('');
  };

  const eliminarProducto = (id) => {
    setProductos(p => p.filter(x => x.id !== id));
    setToast('Producto eliminado');
  };

  return (
    <div className="checkout-page">
      <div id="header-root" dangerouslySetInnerHTML={{ __html: headerHtml }} />

      <div className="page-path">Home &gt; Checkout</div>

      <main className="checkout-contenedor-principal">
        <section className="checkout-columna-izquierda">
          <h1 className="titulo-carrito">Tu carrito</h1>

          <div className="productos-lista-checkout">
            {productos.length === 0 && <div className="empty-checkout">Tu carrito está vacío.</div>}

            {productos.map(producto => (
              <div key={producto.id} className="producto-item-checkout card-item">
                <img src={producto.imagenUrl} alt={producto.nombre} className="producto-imagen-checkout" loading="lazy" />
                <div className="producto-detalle-checkout">
                  <h3 className="nombre-producto-checkout">{producto.nombre}</h3>
                  <div className="meta-checkout">
                    <span className="color-producto-checkout">Color: {producto.color}</span>
                    <span className="cantidad-producto-checkout">Qty: {producto.cantidad}</span>
                  </div>
                  <div className="precio-producto-checkout">{formatPrecio(producto.precio)}</div>
                </div>
                <button className="eliminar-link" aria-label={`Eliminar ${producto.nombre}`} onClick={() => eliminarProducto(producto.id)}>Eliminar</button>
              </div>
            ))}
          </div>

          <div className="cupon-descuento">
            <input value={coupon} onChange={e => setCoupon(e.target.value)} type="text" placeholder="Cupón de descuento" aria-label="Cupón" />
            <button type="button" className="btn-agregar-cupon" onClick={applyCoupon}>Agregar</button>
          </div>

          <div className="resumen-orden card-resumen">
            <div className="resumen-fila"><span className="resumen-label">Subtotal</span><span className="resumen-valor">{formatPrecio(subtotal)}</span></div>
            <div className="resumen-fila"><span className="resumen-label">Gravado</span><span className="resumen-valor">{formatPrecio(gravado)}</span></div>
            <div className="resumen-fila"><span className="resumen-label">Envío</span><span className="resumen-valor">{formatPrecio(envio)}</span></div>
            <div className="resumen-fila"><span className="resumen-label">Descuento</span><span className="resumen-valor descuento-valor">{formatPrecio(descuento)}</span></div>
            <hr className="resumen-separador" />
            <div className="resumen-fila resumen-total"><span className="resumen-label">Total</span><span className="resumen-valor">{formatPrecio(total)}</span></div>
          </div>
        </section>

        <section className="checkout-columna-derecha">
          <div className="pasos-checkout">
            <span className="paso-activo">Dirección</span>
            <div className="line"></div>
            <span>Envío</span>
            <div className="line"></div>
            <span>Pago</span>
          </div>

          <h2 className="titulo-informacion">Información</h2>

          <form className="formulario-direccion" onSubmit={handleSubmit}>
            <div className="form-fila-direccion">
              <input type="text" placeholder="Nombre" />
              <input type="text" placeholder="Apellido" />
            </div>
            <input type="text" placeholder="Dirección" />
            <input type="text" placeholder="Piso, etc (opcional)" />
            <input type="text" placeholder="Código Postal" />
            <div className="form-fila-direccion">
              <select 
                className="form-dropdown-dir"
                value={provinciaSeleccionada}
                onChange={(e) => {
                  setProvinciaSeleccionada(e.target.value);
                  setCiudadSeleccionada(''); // Reset ciudad cuando cambia la provincia
                }}
              >
                <option value="">Provincia</option>
                {provincias.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
              <select 
                className="form-dropdown-dir"
                value={ciudadSeleccionada}
                onChange={(e) => setCiudadSeleccionada(e.target.value)}
                disabled={!provinciaSeleccionada}
              >
                <option value="">Ciudad</option>
                {provinciaSeleccionada && provinciasYCiudades[provinciaSeleccionada]?.map(ciudad => (
                  <option key={ciudad} value={ciudad}>{ciudad}</option>
                ))}
              </select>
            </div>
            <label className="checkbox-guardar">Guardar información de contacto <input type="checkbox" /></label>
            <button type="submit" className="btn-continuar">Continuar</button>
          </form>

          <div className="monstera-fondo" aria-hidden></div>
        </section>
      </main>

      <div id="footer-root" dangerouslySetInnerHTML={{ __html: footerHtml }} />

      {toast && <div className="checkout-toast" role="status">{toast}</div>}
    </div>
  );
}
