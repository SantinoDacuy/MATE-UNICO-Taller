import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext'; // <-- CONECTAMOS EL CEREBRO
import './Cart.css'; // Si tu amigo no hizo el CSS, después le armamos uno rápido.

// Imagen comodín por si falla la de Strapi
import imagenComodin from '../assets/camionero1.png';

const Carrito = () => {
  const navigate = useNavigate();
  
  // 1. NOS TRAEMOS TODO DESDE EL CONTEXTO GLOBAL
  const { cart, removeFromCart, addToCart, totalItems, totalPrice } = useContext(CartContext);

  // Estados para inyectar el diseño de tu compañero
  const [headerHtml, setHeaderHtml] = useState('');
  const [footerHtml, setFooterHtml] = useState('');
  const [toast, setToast] = useState(null);

  // Cargar Header y Footer
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

  // Actualizar numerito del Header
  useEffect(() => {
    const badge = document.getElementById('mu-cart-badge');
    if (badge) {
      badge.textContent = totalItems;
      badge.setAttribute('data-count', totalItems);
    }
  }, [totalItems, headerHtml]);

  // Mensaje flotante
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(id);
  }, [toast]);

  const showToast = (msg) => setToast(msg);

  // Manejador de eliminación usando nuestro Contexto
  const handleEliminar = (producto) => {
    removeFromCart(producto.id, producto.color, producto.grabado);
    showToast('Producto eliminado');
  };

  // Manejador de suma/resta usando nuestro Contexto (reutilizamos addToCart con 1 o -1)
  const handleCambioCantidad = (producto, delta) => {
    // Evitamos que baje de 1
    if (producto.cantidad === 1 && delta === -1) return;
    
    // Le pasamos el mismo producto pero con cantidad 1 o -1 para que el contexto lo sume
    const mockProductParaContexto = { documentId: producto.id }; 
    addToCart(mockProductParaContexto, delta, producto.color, producto.grabado);
    showToast('Cantidad actualizada');
  };

  const formatPrecio = (precio) => {
    return `$${precio.toLocaleString('es-AR')}`;
  };

  return (
    <div className="carrito-page">
      <div id="header-root" dangerouslySetInnerHTML={{ __html: headerHtml }} />

      <div className="page-path">Home &gt; Carrito</div>

      <main className="carrito-contenedor">
        <h1 className="carrito-titulo">Tu carrito</h1>
        <p className="carrito-subtitulo">¿No estás listo para pagar? Sigue comprando.</p>

        <div className="productos-lista">
          
          {/* SI EL CARRITO ESTÁ VACÍO */}
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

          {/* DIBUJAMOS LOS PRODUCTOS DEL CONTEXTO */}
          {cart.map((producto, index) => (
            // Usamos el index en el key por si agrega el mismo mate con distinto color
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
                  <button
                    className="btn-cantidad"
                    aria-label={`Disminuir cantidad`}
                    onClick={() => handleCambioCantidad(producto, -1)}
                  >-</button>
                  <span className="cantidad-actual">{producto.cantidad}</span>
                  <button
                    className="btn-cantidad"
                    aria-label={`Aumentar cantidad`}
                    onClick={() => handleCambioCantidad(producto, 1)}
                  >+</button>
                </div>

                <p className="producto-precio">{formatPrecio(producto.precio * producto.cantidad)}</p>
              </div>

              <button
                className="btn-eliminar"
                aria-label={`Eliminar ${producto.nombre}`}
                onClick={() => handleEliminar(producto)}
              >
                Eliminar <span className="eliminar-x">×</span>
              </button>
            </div>
          ))}
        </div>

        {/* TOTAL Y BOTÓN DE CONTINUAR */}
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

      <div id="footer-root" dangerouslySetInnerHTML={{ __html: footerHtml }} />

      {toast && <div className="cart-toast" role="status">{toast}</div>}
    </div>
  );
};

export default Carrito;