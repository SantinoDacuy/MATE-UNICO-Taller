import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext'; 
import Breadcrumbs from '../components/Breadcrumbs';
import './Cart.css';

import imagenComodin from '../assets/camionero1.png';

const Carrito = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, addToCart, totalItems, totalPrice, updateStockFromBackend } = useContext(CartContext);

  const [toast, setToast] = useState(null);

  // Mensaje flotante
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(id);
  }, [toast]);

  // --- REFRESCAR STOCK AL CARGAR EL CARRITO ---
  useEffect(() => {
    if (cart.length > 0) {
      updateStockFromBackend();
    }
  }, []); // Solo ejecutar al montar el componente

  const showToast = (msg) => setToast(msg);

  const handleEliminar = (producto) => {
    removeFromCart(producto.id, producto.color, producto.grabado);
    showToast('Producto eliminado');
  };

  const handleCambioCantidad = (producto, delta) => {
    if (producto.cantidad === 1 && delta === -1) return;
    
    // Validar que no supere el stock disponible
    const stockDisponible = producto.stock || 999; // Si no tiene stock info, permitir
    const nuevaCantidad = Math.min(producto.cantidad + delta, stockDisponible);
    
    if (nuevaCantidad <= 0) return;
    
    const diferencia = nuevaCantidad - producto.cantidad;
    addToCart(producto, diferencia, producto.color, producto.grabado);
    showToast('Cantidad actualizada');
  };

  const formatPrecio = (precio) => {
    return `$${precio.toLocaleString('es-AR')}`;
  };

  // --- Detectar si hay productos sin stock en el carrito ---
  const hayProductosSinStock = cart.some(item => item.stock === 0 || item.cantidad > item.stock);

  return (
    <div className="carrito-page">
      <Breadcrumbs />

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

          {cart.map((producto, index) => {
            const sinStock = producto.stock === 0 || producto.cantidad > producto.stock;
            return (
              <div key={`${producto.id}-${index}`} className="producto-item">
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={producto.imagen ? `http://localhost:1337${producto.imagen}` : imagenComodin}
                    alt={producto.nombre}
                    className="producto-imagen"
                    loading="lazy"
                  />
                  
                  {/* Badge "SIN STOCK" chiquito - solo lógica visual */}
                  {sinStock && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        backgroundColor: 'rgba(211, 47, 47, 0.9)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        pointerEvents: 'none',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      SIN STOCK
                    </div>
                  )}
                </div>

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
            );
          })}
        </div>

        {cart.length > 0 && (
          <div className="confirmar-contenedor">
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: 12 }}>
                <div style={{ color: 'var(--muted)' }}>Subtotal:</div>
                <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{formatPrecio(totalPrice)}</div>
              </div>
              <button 
                className="btn-confirmar" 
                onClick={() => navigate('/direccion-pago')}
                disabled={hayProductosSinStock}
                style={{
                  opacity: hayProductosSinStock ? 0.5 : 1,
                  cursor: hayProductosSinStock ? 'not-allowed' : 'pointer'
                }}
              >
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