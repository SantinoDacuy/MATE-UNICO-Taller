import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Cart.css'; // Asegúrate de vincular el CSS

// Datos iniciales del carrito (simulados)
const initialProducts = [
  {
    id: 1,
    nombre: "Mate Imperial",
    color: "Marrón",
    precio: 32000,
    cantidad: 1,
    imagenUrl: "/path/to/mate-imperial-marron.png"
  },
  {
    id: 2,
    nombre: "Mate Torpedo",
    color: "Marrón",
    precio: 25000,
    cantidad: 1,
    imagenUrl: "/path/to/mate-torpedo-marron.png"
  }
];

const CART_KEY = 'mu_cart_v1';

function readCartFromStorage() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function writeCartToStorage(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch (e) {
    // ignore
  }
}

function broadcastCartUpdate(count) {
  try {
    window.dispatchEvent(new CustomEvent('cart:update', { detail: { count } }));
  } catch (e) {
    // ignore
  }
}

const Carrito = () => {
  const [productos, setProductos] = useState(() => {
    const stored = readCartFromStorage();
    if (stored && Array.isArray(stored) && stored.length > 0) return stored;
    return initialProducts;
  });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(id);
  }, [toast]);

  const showToast = (msg) => {
    setToast(msg);
  };

  const handleEliminar = (id) => {
    setProductos(prev => {
      const next = prev.filter(p => p.id !== id);
      writeCartToStorage(next);
      broadcastCartUpdate(next.reduce((s, it) => s + it.cantidad, 0));
      return next;
    });
    showToast('Producto eliminado');
  };

  const handleCambioCantidad = (id, delta) => {
    setProductos(prev => {
      const next = prev.map(p => {
        if (p.id !== id) return p;
        const nueva = Math.max(1, p.cantidad + delta);
        return { ...p, cantidad: nueva };
      });
      writeCartToStorage(next);
      broadcastCartUpdate(next.reduce((s, it) => s + it.cantidad, 0));
      return next;
    });
    showToast('Cantidad actualizada');
  };

  const formatPrecio = (precio) => {
    return `$${precio.toLocaleString('es-AR')}`;
  };

  const subtotal = productos.reduce((sum, p) => sum + p.precio * p.cantidad, 0);
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
    // broadcast initial cart count
    const initialCount = productos.reduce((s, it) => s + it.cantidad, 0);
    broadcastCartUpdate(initialCount);
  }, []);

  const navigate = useNavigate();

  return (
    <div className="carrito-page">
      <div id="header-root" dangerouslySetInnerHTML={{ __html: headerHtml }} />

      <div className="page-path">Home &gt; Carrito</div>

      <main className="carrito-contenedor">
        <h1 className="carrito-titulo">Tu carrito</h1>
        <p className="carrito-subtitulo">¿No estás listo para pagar? Sigue comprando.</p>

        <div className="productos-lista">
          {productos.length === 0 && (
            <div className="empty-cart">Tu carrito está vacío.</div>
          )}

          {productos.map(producto => (
            <div key={producto.id} className="producto-item">
              <img
                src={producto.imagenUrl}
                alt={producto.nombre}
                className="producto-imagen"
                loading="lazy"
              />

              <div className="producto-detalle">
                <h2 className="producto-nombre">{producto.nombre}</h2>
                <p className="producto-color">Color: {producto.color}</p>

                <div className="control-cantidad" role="group" aria-label={`Cantidad de ${producto.nombre}`}>
                  <button
                    className="btn-cantidad"
                    aria-label={`Disminuir cantidad ${producto.nombre}`}
                    onClick={() => handleCambioCantidad(producto.id, -1)}
                  >-</button>
                  <span className="cantidad-actual">{producto.cantidad}</span>
                  <button
                    className="btn-cantidad"
                    aria-label={`Aumentar cantidad ${producto.nombre}`}
                    onClick={() => handleCambioCantidad(producto.id, 1)}
                  >+</button>
                </div>

                <p className="producto-precio">{formatPrecio(producto.precio * producto.cantidad)}</p>
              </div>

              <button
                className="btn-eliminar"
                aria-label={`Eliminar ${producto.nombre}`}
                onClick={() => handleEliminar(producto.id)}
              >
                Eliminar <span className="eliminar-x">×</span>
              </button>
            </div>
          ))}
        </div>

        <div className="confirmar-contenedor">
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: 12 }}>
              <div style={{ color: 'var(--muted)' }}>Subtotal</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{formatPrecio(subtotal)}</div>
            </div>
            <button className="btn-confirmar" onClick={() => navigate('/direccion-pago')}>Continuar</button>
          </div>
        </div>
      </main>

      <div id="footer-root" dangerouslySetInnerHTML={{ __html: footerHtml }} />

      {toast && <div className="cart-toast" role="status">{toast}</div>}
    </div>
  );
};

export default Carrito;
