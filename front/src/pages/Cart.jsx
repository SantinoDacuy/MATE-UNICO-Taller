import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext'; 
import './Cart.css';

import imagenComodin from '../assets/camionero1.png';

const Carrito = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, addToCart, totalItems, totalPrice } = useContext(CartContext);

  const [toast, setToast] = useState(null);

  // Mensaje flotante
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(id);
  }, [toast]);

  const showToast = (msg) => setToast(msg);

  const handleEliminar = (producto) => {
    removeFromCart(producto.id, producto.color, producto.grabado);
    showToast('Producto eliminado');
  };

  const handleCambioCantidad = (producto, delta) => {
    if (producto.cantidad === 1 && delta === -1) return;
    addToCart(producto, delta, producto.color, producto.grabado);
    showToast('Cantidad actualizada');
  };

  const formatPrecio = (precio) => {
    return `$${precio.toLocaleString('es-AR')}`;
  };

  return (
    <div className="carrito-page">

      <div className="page-path">Home &gt; Carrito</div>

      <main className="carrito-contenedor">
        <h1 className="carrito-titulo">Tu carrito</h1>
        <p className="carrito-subtitulo">¿No estás listo para pagar? Sigue comprando.</p>

        <div className="productos-lista">
          {cart.length === 0 && (
            <div className="empty-cart">
              <p>Tu carrito está vacío. 🧉</p>
              <button 
                onClick={() => navigate('/')} 
                style={{marginTop:'20px', padding:'10px 20px', cursor:'pointer', backgroundColor:'#080808', color:'white', border:'none', borderRadius:'5px'}}
              >
                Ver Mates
              </button>
            </div>
          )}

          {cart.map((producto, index) => (
            <div key={`${producto.id}-${index}`} className="producto-item">
              <img
                src={producto.imagen ? `http://localhost:1337${producto.imagen}` : imagenComodin}
                alt={producto.nombre}
                className="producto-imagen"
                loading="lazy"
              />

              <div className="producto-detalle">
                <h2 className="producto-nombre">{producto.nombre}</h2>
                <p className="producto-color">Color: {producto.color}</p>
                {producto.grabado && producto.grabado !== 'Sin grabado' && (
                  <p style={{fontSize: '14px', color: '#666'}}>Grabado: "{producto.grabado}"</p>
                )}

                <div className="control-cantidad" role="group" aria-label={`Cantidad de ${producto.nombre}`}>
                  <button className="btn-cantidad" aria-label={`Disminuir cantidad`} onClick={() => handleCambioCantidad(producto, -1)}>-</button>
                  <span className="cantidad-actual">{producto.cantidad}</span>
                  <button className="btn-cantidad" aria-label={`Aumentar cantidad`} onClick={() => handleCambioCantidad(producto, 1)}>+</button>
                </div>

                <p className="producto-precio">{formatPrecio(producto.precio * producto.cantidad)}</p>
              </div>

              <button className="btn-eliminar" aria-label={`Eliminar ${producto.nombre}`} onClick={() => handleEliminar(producto)}>
                Eliminar <span className="eliminar-x">×</span>
              </button>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <div className="confirmar-contenedor">
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: 12 }}>
                <div style={{ color: 'var(--muted)' }}>Subtotal:</div>
                <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{formatPrecio(totalPrice)}</div>
              </div>
              <button className="btn-confirmar" onClick={() => navigate('/direccion-pago')}>
                Continuar al Pago
              </button>
            </div>
          </div>
        )}
      </main>

      {toast && <div className="cart-toast" role="status">{toast}</div>}
    </div>
  );
};

export default Carrito;