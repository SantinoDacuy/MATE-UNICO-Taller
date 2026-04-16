import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext'; 
import Toast from '../components/Toast';
import Breadcrumbs from '../components/Breadcrumbs';
import './PagoDireccion.css';

import imagenComodin from '../assets/camionero1.png';

const formatPrecio = (precio) => `$${precio.toLocaleString('es-AR')}`;

export default function PagoDireccion() {
  const { cart, totalPrice, totalItems, descuento, setDescuento, updateStockFromBackend } = useContext(CartContext);
  const navigate = useNavigate();
  
  const [autorizado, setAutorizado] = useState(false);
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [direccion, setDireccion] = useState('');
  const [piso, setPiso] = useState('');
  const [cp, setCp] = useState('');

  const [provincias, setProvincias] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [provinciaSeleccionada, setProvinciaSeleccionada] = useState('');
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState('');

  const [coupon, setCoupon] = useState('');
  const [appliedCuponId, setAppliedCuponId] = useState(null);
  const [toastData, setToastData] = useState({ message: '', type: 'info', visible: false });
  const [validando, setValidando] = useState(false);
  const envio = 4000;
  const grabado = cart.reduce((acc, item) => (item.grabado && item.grabado !== 'Sin grabado' ? acc + 3000 : acc), 0);
  const total = (totalPrice + envio + grabado) - descuento;

  useEffect(() => {
      fetch('https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre')
        .then(res => res.json())
        .then(data => setProvincias(data.provincias.sort((a, b) => a.nombre.localeCompare(b.nombre))))
  }, []);

  useEffect(() => {
    if (provinciaSeleccionada) {
      fetch(`https://apis.datos.gob.ar/georef/api/municipios?provincia=${provinciaSeleccionada}&max=500&campos=id,nombre`)
        .then(res => res.json())
        .then(data => setMunicipios(data.municipios.sort((a, b) => a.nombre.localeCompare(b.nombre))));
    }
  }, [provinciaSeleccionada]);

  useEffect(() => {
    const syncUser = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/user/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.loggedIn && data.user) {
            setAutorizado(true);
            setNombre(data.user.nombre || '');
            setApellido(data.user.apellido || '');
            setDireccion(data.user.calle || '');
            setProvinciaSeleccionada(data.user.provincia || '');
            setCiudadSeleccionada(data.user.ciudad || '');
          } else { navigate('/login'); }
        } else { navigate('/login'); }
      } catch (error) { navigate('/login'); }
    };
    syncUser();
  }, [navigate]);

  const showToast = (msg, type = 'info') => setToastData({ message: msg, type, visible: true });
  const closeToast = () => setToastData({ ...toastData, visible: false });

  // --- LÓGICA DE CUPONES DINÁMICA CON LA DB ---
  const applyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return showToast('Ingresá un código', 'warning');

    try {
      const res = await fetch(`http://localhost:3001/api/cupones/${code}`);
      const data = await res.json();

      if (res.ok && data.success) {
        let montoADescuentar = 0;
        if (data.tipo === 'monto fijo') {
          montoADescuentar = data.valor;
        } else {
          // Es porcentaje
          montoADescuentar = totalPrice * (data.valor / 100);
        }

        setDescuento(montoADescuentar);
        setAppliedCuponId(data.id_cupon);
        showToast(`¡Cupón aplicado! -$${montoADescuentar.toLocaleString()}`, 'success');
      } else {
        setDescuento(0);
        setAppliedCuponId(null);
        showToast(data.message || 'Cupón no válido', 'error');
      }
    } catch (err) {
      showToast('Error al validar cupón', 'error');
    }
    setCoupon('');
  };

  // --- VALIDACIÓN DE STOCK ANTES DE CONTINUAR ---
  const validateStock = async () => {
    try {
      setValidando(true);
      
      // Primero, actualizar el stock del carrito desde el backend
      await updateStockFromBackend();
      
      // Luego, verificar que todo sigue siendo válido
      for (const item of cart) {
        if (item.cantidad > item.stock) {
          if (item.stock === 0) {
            showToast(`"${item.nombre}" ya no tiene stock`, 'error');
          } else {
            showToast(`"${item.nombre}" solo quedan ${item.stock} unidades (tu carrito tiene ${item.cantidad})`, 'error');
          }
          setValidando(false);
          return false;
        }
      }
      
      // Si llegamos aquí, todo el stock está disponible
      showToast('Stock verificado! Continuando...', 'success');
      setValidando(false);
      return true;
    } catch (error) {
      console.error('Error validando stock:', error);
      showToast('Error al verificar disponibilidad', 'error');
      setValidando(false);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return showToast('El carrito está vacío', 'warning');
    
    // Validar stock ANTES de continuar
    const stockOK = await validateStock();
    if (!stockOK) return; // Bloquear si hay problemas de stock
    
    sessionStorage.setItem('checkout_data', JSON.stringify({ 
        nombre, direccion, provinciaSeleccionada, ciudadSeleccionada, 
        descuento: descuento, totalFinal: total,
        id_cupon: appliedCuponId // Pasamos el ID para que el back lo registre en la venta
    }));
    
    // Pequeño delay para que vea el toast de éxito
    setTimeout(() => navigate('/pago-envio'), 500);
  };

  if (!autorizado) return null;

  return (
    <div className="checkout-page">
      <Breadcrumbs />

      <main className="checkout-contenedor-principal">
        <section className="checkout-columna-izquierda">
          <h1 className="titulo-carrito">Tu carrito</h1>
          <div className="productos-lista-checkout">
            {cart.map((producto, index) => (
              <div key={index} className="producto-item-checkout card-item">
                <img src={producto.imagen ? `http://localhost:1337${producto.imagen}` : imagenComodin} alt={producto.nombre} className="producto-imagen-checkout" />
                <div className="producto-detalle-checkout">
                  <h3 className="nombre-producto-checkout">{producto.nombre}</h3>
                  <div className="meta-checkout">
                    <span>Color: {producto.color} | Cant: {producto.cantidad}</span>
                  </div>
                  <div className="precio-producto-checkout">{formatPrecio(producto.precio * producto.cantidad)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="cupon-descuento">
            <input value={coupon} onChange={e => setCoupon(e.target.value)} type="text" placeholder="Cupón de descuento" disabled={appliedCuponId !== null} />
            {appliedCuponId ? (
              <button type="button" className="btn-agregar-cupon" style={{background: '#d32f2f', color: '#fff'}} onClick={() => { setDescuento(0); setAppliedCuponId(null); setCoupon(''); showToast('Cupón removido', 'info'); }}>Quitar ✕</button>
            ) : (
              <button type="button" className="btn-agregar-cupon" onClick={applyCoupon}>Agregar</button>
            )}
          </div>

          <div className="resumen-orden card-resumen">
            <div className="resumen-fila"><span>Subtotal</span><span>{formatPrecio(totalPrice)}</span></div>
            <div className="resumen-fila"><span>Envío</span><span>{formatPrecio(envio)}</span></div>
            <div className="resumen-fila"><span>Grabados</span><span>{formatPrecio(grabado)}</span></div>
            {descuento > 0 && <div className="resumen-fila"><span className="descuento-valor">Descuento</span><span className="descuento-valor">-{formatPrecio(descuento)}</span></div>}
            <hr className="resumen-separador" />
            <div className="resumen-fila resumen-total"><span>Total</span><span>{formatPrecio(total)}</span></div>
          </div>
        </section>

        <section className="checkout-columna-derecha">
          <div className="pasos-checkout">
            <span className="paso-activo">Dirección</span> <div className="line"></div> <span>Envío</span> <div className="line"></div> <span>Pago</span>
          </div>
          <form className="formulario-direccion" onSubmit={handleSubmit}>
            <div className="form-fila-direccion">
              <input type="text" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />
              <input type="text" placeholder="Apellido" value={apellido} onChange={e => setApellido(e.target.value)} required />
            </div>
            <input type="text" placeholder="Calle y Número" value={direccion} onChange={e => setDireccion(e.target.value)} required />
            <input type="text" placeholder="Código Postal" value={cp} onChange={e => setCp(e.target.value)} required />
            <div className="form-fila-direccion">
              <select className="form-dropdown-dir" value={provinciaSeleccionada} onChange={(e) => { setProvinciaSeleccionada(e.target.value); setCiudadSeleccionada(''); }} required>
                <option value="">Provincia</option>
                {provincias.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
              </select>
              <select className="form-dropdown-dir" value={ciudadSeleccionada} onChange={(e) => setCiudadSeleccionada(e.target.value)} disabled={!provinciaSeleccionada} required>
                <option value="">Ciudad</option>
                {municipios.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-continuar" disabled={validando}>
              {validando ? 'Validando stock...' : 'Continuar al Envío'}
            </button>
          </form>
        </section>
      </main>
      <Toast 
        message={toastData.message} 
        type={toastData.type} 
        visible={toastData.visible} 
        onClose={closeToast} 
      />
    </div>
  );
}