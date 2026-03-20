import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext'; 
import './PagoDireccion.css';

import imagenComodin from '../assets/camionero1.png';

const formatPrecio = (precio) => `$${precio.toLocaleString('es-AR')}`;

const provinciasYCiudades = {
  'Buenos Aires': ['La Plata', 'Mar del Plata', 'Bahía Blanca', 'Quilmes', 'Lanús', 'General Pueyrredón', 'Merlo', 'Moreno', 'Lomas de Zamora', 'Tigre', 'San Isidro', 'Vicente López', 'Avellaneda', 'Banfield', 'Berazategui', 'Florencio Varela', 'San Miguel', 'Malvinas Argentinas', 'José C. Paz', 'Hurlingham'],
  'Córdoba': ['Córdoba', 'Villa María', 'Río Cuarto', 'Villa Carlos Paz', 'San Francisco', 'Villa Allende', 'Jesús María', 'Unquillo', 'La Calera', 'Arroyito', 'Marcos Juárez', 'Bell Ville', 'Leones', 'Morteros', 'Villa Dolores'],
  'Santa Fe': ['Rosario', 'Santa Fe', 'Rafaela', 'Venado Tuerto', 'Reconquista', 'Santo Tomé', 'Villa Gobernador Gálvez', 'San Lorenzo', 'Pérez', 'Casilda', 'Esperanza', 'Sunchales', 'Firmat', 'Gálvez'],
  'Mendoza': ['Mendoza', 'San Rafael', 'Godoy Cruz', 'Las Heras', 'Luján de Cuyo', 'Maipú', 'Guaymallén', 'Tunuyán', 'San Martín', 'Rivadavia', 'General Alvear', 'Malargüe'],
  'Tucumán': ['San Miguel de Tucumán', 'Yerba Buena', 'Tafí Viejo', 'Concepción', 'Aguilares', 'Monteros', 'Famaillá', 'Lules', 'Banda del Río Salí'],
  'Salta': ['Salta', 'San Salvador de Jujuy', 'Orán', 'Tartagal', 'General Güemes', 'Metán', 'Cafayate', 'Rosario de la Frontera', 'Cerrillos'],
  'Entre Ríos': ['Paraná', 'Concordia', 'Gualeguaychú', 'Concepción del Uruguay', 'Villaguay', 'Colón', 'Federación', 'Nogoyá', 'Victoria']
};
const provincias = Object.keys(provinciasYCiudades);

export default function PagoDireccion() {
  const { cart, removeFromCart, totalPrice, totalItems, descuento, setDescuento } = useContext(CartContext);
  const navigate = useNavigate();
  
  const [autorizado, setAutorizado] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [direccion, setDireccion] = useState('');
  const [piso, setPiso] = useState('');
  const [cp, setCp] = useState('');
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState('');
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('');
  const [guardarInfo, setGuardarInfo] = useState(false); 
  const [coupon, setCoupon] = useState('');
  const [toast, setToast] = useState(null);
  const [headerHtml, setHeaderHtml] = useState('');
  const [footerHtml, setFooterHtml] = useState('');

  const envio = 4000;
  const gravado = 0; 
  const total = totalPrice + envio + gravado - descuento;

  // 1. CARGAR HEADER Y FOOTER
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

  // 2. VERIFICAR LOGIN Y ACTUALIZAR HEADER (El Patovica)
  useEffect(() => {
    if (!headerHtml) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('http://localhost:3001/api/user/me', { credentials: 'include' });
        if (!res.ok) throw new Error('No autorizado');
        
        const data = await res.json();
        if (data.loggedIn && data.user) {
          setAutorizado(true);
          const profileNameEl = document.getElementById('mu-profile-name');
          if (profileNameEl) profileNameEl.textContent = (data.user.nombre || 'Usuario').split(' ')[0];
          
          const btnPerfil = document.getElementById('header-link-perfil');
          if (btnPerfil) btnPerfil.onclick = (e) => { e.preventDefault(); navigate('/perfil'); };
        } else {
          navigate('/login');
        }
      } catch (error) {
        navigate('/login');
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [headerHtml, navigate]);

  // 3. RECUPERAR DATOS GUARDADOS
  useEffect(() => {
    if (autorizado) {
      const savedData = localStorage.getItem('mateUnicoDireccion');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setNombre(parsed.nombre || '');
          setApellido(parsed.apellido || '');
          setDireccion(parsed.direccion || '');
          setPiso(parsed.piso || '');
          setCp(parsed.cp || '');
          setProvinciaSeleccionada(parsed.provincia || '');
          setCiudadSeleccionada(parsed.ciudad || '');
          setGuardarInfo(true); 
        } catch (e) {
          console.error("Error leyendo info guardada");
        }
      }
    }
  }, [autorizado]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const badge = document.getElementById('mu-cart-badge');
      if (badge) {
        badge.textContent = totalItems;
        badge.setAttribute('data-count', totalItems);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [totalItems, headerHtml]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(id);
  }, [toast]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      setToast('El carrito está vacío');
      return;
    }
    if (guardarInfo) {
      const datosDireccion = { nombre, apellido, direccion, piso, cp, provincia: provinciaSeleccionada, ciudad: ciudadSeleccionada };
      localStorage.setItem('mateUnicoDireccion', JSON.stringify(datosDireccion));
    } else {
      localStorage.removeItem('mateUnicoDireccion');
    }
    navigate('/pago-envio');
  };

  const applyCoupon = () => {
    if (!coupon) return setToast('Ingresa un cupón');
    setDescuento(10000);
    setToast('Cupón aplicado con éxito');
    setCoupon('');
  };

  if (!autorizado || !headerHtml) return null;

  return (
    <div className="checkout-page">
      <div id="header-root" dangerouslySetInnerHTML={{ __html: headerHtml }} />
      <div className="page-path" style={{paddingLeft: '50px', paddingTop: '20px'}}>Home &gt; Checkout</div>

      <main className="checkout-contenedor-principal">
        <section className="checkout-columna-izquierda">
          <h1 className="titulo-carrito">Tu carrito</h1>
          <div className="productos-lista-checkout">
            {cart.length === 0 && <div className="empty-checkout">Tu carrito está vacío.</div>}
            {cart.map((producto, index) => (
              <div key={`${producto.id}-${index}`} className="producto-item-checkout card-item">
                <img src={producto.imagen ? `http://localhost:1337${producto.imagen}` : imagenComodin} alt={producto.nombre} className="producto-imagen-checkout" loading="lazy" />
                <div className="producto-detalle-checkout">
                  <h3 className="nombre-producto-checkout">{producto.nombre}</h3>
                  <div className="meta-checkout">
                    <span className="color-producto-checkout">Color: {producto.color}</span>
                    {producto.grabado && producto.grabado !== 'Sin grabado' && (
                      <span className="color-producto-checkout" style={{marginLeft: '10px'}}>Grabado: {producto.grabado}</span>
                    )}
                    <span className="cantidad-producto-checkout" style={{display: 'block', marginTop: '5px'}}>Qty: {producto.cantidad}</span>
                  </div>
                  <div className="precio-producto-checkout">{formatPrecio(producto.precio * producto.cantidad)}</div>
                </div>
                <button type="button" className="eliminar-link" onClick={() => removeFromCart(producto.id, producto.color, producto.grabado)}>Eliminar</button>
              </div>
            ))}
          </div>

          <div className="cupon-descuento">
            <input value={coupon} onChange={e => setCoupon(e.target.value)} type="text" placeholder="Cupón de descuento" />
            <button type="button" className="btn-agregar-cupon" onClick={applyCoupon}>Agregar</button>
          </div>

          <div className="resumen-orden card-resumen">
            <div className="resumen-fila"><span className="resumen-label">Subtotal</span><span className="resumen-valor">{formatPrecio(totalPrice)}</span></div>
            <div className="resumen-fila"><span className="resumen-label">Gravado</span><span className="resumen-valor">{formatPrecio(gravado)}</span></div>
            <div className="resumen-fila"><span className="resumen-label">Envío</span><span className="resumen-valor">{formatPrecio(envio)}</span></div>
            {descuento > 0 && <div className="resumen-fila"><span className="resumen-label">Descuento</span><span className="resumen-valor descuento-valor">-{formatPrecio(descuento)}</span></div>}
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
              <input type="text" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />
              <input type="text" placeholder="Apellido" value={apellido} onChange={e => setApellido(e.target.value)} required />
            </div>
            <input type="text" placeholder="Dirección (Calle y Número)" value={direccion} onChange={e => setDireccion(e.target.value)} required />
            <input type="text" placeholder="Piso, Depto, etc (opcional)" value={piso} onChange={e => setPiso(e.target.value)} />
            <input type="text" placeholder="Código Postal" value={cp} onChange={e => setCp(e.target.value)} required />
            
            <div className="form-fila-direccion">
              <select className="form-dropdown-dir" value={provinciaSeleccionada} onChange={(e) => { setProvinciaSeleccionada(e.target.value); setCiudadSeleccionada(''); }} required>
                <option value="">Provincia</option>
                {provincias.map(prov => (<option key={prov} value={prov}>{prov}</option>))}
              </select>
              <select className="form-dropdown-dir" value={ciudadSeleccionada} onChange={(e) => setCiudadSeleccionada(e.target.value)} disabled={!provinciaSeleccionada} required>
                <option value="">Ciudad</option>
                {provinciaSeleccionada && provinciasYCiudades[provinciaSeleccionada]?.map(ciudad => (<option key={ciudad} value={ciudad}>{ciudad}</option>))}
              </select>
            </div>
            
            <label className="checkbox-guardar">
              Guardar información de contacto 
              <input type="checkbox" checked={guardarInfo} onChange={(e) => setGuardarInfo(e.target.checked)} />
            </label>
            <button type="submit" className="btn-continuar">Continuar al Envío</button>
          </form>
          <div className="monstera-fondo" aria-hidden></div>
        </section>
      </main>
      <div id="footer-root" dangerouslySetInnerHTML={{ __html: footerHtml }} />
      {toast && <div className="checkout-toast" role="status">{toast}</div>}
    </div>
  );
}