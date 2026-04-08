import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext'; 
import './PagoEnvio.css';
import './PagoDireccion.css'; 
import imagenComodin from '../assets/camionero1.png';

const SHIPPING_METHODS = [
  { id: 'oca', name: 'OCA', days: '3-5 Días hábiles', cost: 4000 },
  { id: 'andreani', name: 'Andreani', days: '5-7 Días hábiles', cost: 5500 },
  { id: 'correo-argentino', name: 'Correo Argentino', days: '7-10 Días hábiles', cost: 3000 }
];

const formatPrecio = (precio) => `$${precio.toLocaleString('es-AR')}`;

const PagoEnvio = () => {
  const { cart, removeFromCart, totalPrice, totalItems, descuento } = useContext(CartContext);
  const navigate = useNavigate();

  const [metodoSeleccionado, setMetodoSeleccionado] = useState(() => 
    localStorage.getItem('shippingMethod') || 'oca'
  );
  
  const [error, setError] = useState('');

  const metodoActual = SHIPPING_METHODS.find(m => m.id === metodoSeleccionado);
  const costoEnvio = metodoActual ? metodoActual.cost : 0;
  
  const total = totalPrice + costoEnvio - descuento;

  useEffect(() => {
    localStorage.setItem('shippingMethod', metodoSeleccionado);
  }, [metodoSeleccionado]);

  const handleContinue = () => {
    if (cart.length === 0) {
      setError('El carrito está vacío');
      return;
    }
    if (!metodoSeleccionado) {
      setError('Por favor selecciona un método de envío');
      return;
    }
    setError('');
    navigate('/pago-tarjeta'); 
  };

  return (
    <div className="pago-envio-page">
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

          <div className="resumen-orden card-resumen">
            <div className="resumen-fila"><span className="resumen-label">Subtotal</span><span className="resumen-valor">{formatPrecio(totalPrice)}</span></div>
            <div className="resumen-fila"><span className="resumen-label">Envío ({metodoActual?.name})</span><span className="resumen-valor">{formatPrecio(costoEnvio)}</span></div>
            
            {descuento > 0 && (
              <div className="resumen-fila"><span className="resumen-label">Descuento</span><span className="resumen-valor descuento-valor">-{formatPrecio(descuento)}</span></div>
            )}
            
            <hr className="resumen-separador" />
            <div className="resumen-fila resumen-total"><span className="resumen-label">Total</span><span className="resumen-valor">{formatPrecio(total)}</span></div>
          </div>
        </section>

        <section className="checkout-columna-derecha">
          <div className="pasos-checkout">
            <span className="paso-activo" style={{color: '#888', fontWeight: 'normal', fontSize: '14px'}}>Dirección</span>
            <div className="line" style={{backgroundColor: '#000'}}></div>
            <span className="paso-activo">Envío</span>
            <div className="line"></div>
            <span>Pago</span>
          </div>

          <h2 className="titulo-informacion" style={{marginTop: '0'}}>Método de envío</h2>

          <div className="options-container">
            {SHIPPING_METHODS.map(method => (
              <div
                key={method.id}
                className={`shipping-option ${metodoSeleccionado === method.id ? 'selected' : ''}`}
                onClick={() => setMetodoSeleccionado(method.id)}
                role="radio"
                aria-checked={metodoSeleccionado === method.id}
                style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: '14px'}}>
                  <input type="radio" name="shipping-method" value={method.id} checked={metodoSeleccionado === method.id} onChange={(e) => setMetodoSeleccionado(e.target.value)} />
                  <div className="option-details">
                    <strong>{method.name}</strong>
                    <p>{method.days}</p>
                  </div>
                </div>
                <div style={{fontWeight: '600', color: '#0b0b0b'}}>{formatPrecio(method.cost)}</div>
              </div>
            ))}
          </div>

          {error && <div className="error-message">{error}</div>}
          <button className="btn-continuar" onClick={handleContinue}>Continuar al Pago</button>
        </section>
      </main>
    </div>
  );
};

export default PagoEnvio;