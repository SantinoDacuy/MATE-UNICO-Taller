import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext'; 
import './Pago-tarjeta.css';
import mercadoPagoImg from '../assets/mercadoPago.png';

const PagoTarjeta = () => {
  const [headerHtml, setHeaderHtml] = useState('');
  const [footerHtml, setFooterHtml] = useState('');
  const navigate = useNavigate();
  
  // Traemos el carrito y la función para vaciarlo del contexto
  const { cart, totalItems, clearCart } = useContext(CartContext);

  // =========================================================
  // 1. CARGAMOS EL DISEÑO (Header y Footer)
  // =========================================================
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

  // =========================================================
  // 2. ACTUALIZAR NOMBRE EN HEADER
  // =========================================================
  useEffect(() => {
    if (!headerHtml) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('http://localhost:3001/api/user/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.loggedIn && data.user) {
            const profileNameEl = document.getElementById('mu-profile-name');
            if (profileNameEl) {
              profileNameEl.textContent = (data.user.nombre || 'Usuario').split(' ')[0];
            }
            const btnPerfil = document.getElementById('header-link-perfil');
            if (btnPerfil) {
              btnPerfil.onclick = (e) => {
                e.preventDefault();
                navigate('/perfil');
              };
            }
          }
        }
      } catch (err) {}
    }, 50);

    return () => clearTimeout(timer);
  }, [headerHtml, navigate]);

  // =========================================================
  // 3. ACTUALIZAR NUMERITO DEL CARRITO
  // =========================================================
  useEffect(() => {
    const badge = document.getElementById('mu-cart-badge');
    if (badge) {
      badge.textContent = totalItems;
      badge.setAttribute('data-count', totalItems);
    }
  }, [totalItems, headerHtml]);

  // =========================================================
  // 4. FUNCIÓN PARA PROCESAR LA VENTA REAL EN DB
  // =========================================================
  const handleFinalizarCompra = async () => {
    const checkoutData = JSON.parse(sessionStorage.getItem('checkout_data') || '{}');

    // Limpiamos el carrito para que solo lleve lo necesario y no objetos pesados de Strapi
    const cartLimpio = cart.map(item => ({
      id: item.id || item.documentId,
      precio: Number(item.precio),
      cantidad: Number(item.cantidad)
    }));

    try {
      const res = await fetch('http://localhost:3001/api/checkout/procesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cart: cartLimpio,
          checkoutData: checkoutData
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (clearCart) clearCart(); 
        sessionStorage.removeItem('checkout_data');
        navigate('/final');
      } else {
        // Ahora el alert te va a decir EXACTAMENTE qué falló en Postgres
        alert("Error: " + (data.error || "No se pudo registrar la compra"));
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión con el servidor.");
    }
  };

  return (
    <div className="pago-tarjeta-page">
      <div id="header-root" dangerouslySetInnerHTML={{ __html: headerHtml }} />
      
      <div className="checkout-container">
        <nav className="breadcrumb">Home &gt; Carrito</nav>

        <div className="stepper">
          <span className="step">Dirección</span>
          <div className="line"></div>
          <span className="step">Envío</span>
          <div className="line"></div>
          <span className="step active">Pago</span>
        </div>

        <main className="content payment-section">
          <div className="payment-header">
            <h2 className="section-title">Medio de pago único</h2>
          </div>

          <div className="mp-info-box">
            <img src={mercadoPagoImg} alt="Mercado Pago" className="mp-logo-large" />
            <p>
              Al hacer clic en continuar, simularemos la conexión con <strong>Mercado Pago</strong> para registrar tu pedido en nuestro sistema.
            </p>
          </div>

          <button 
            className="btn-pay mp-button" 
            onClick={handleFinalizarCompra}
          >
            Finalizar y Pagar
          </button>
        </main>

        <div className="leaf-decoration left"></div>
        <div className="leaf-decoration right"></div>
      </div>
      
      <div id="footer-root" dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </div>
  );
};

export default PagoTarjeta;