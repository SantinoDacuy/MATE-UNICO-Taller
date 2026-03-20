import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext'; 
import './Pago-tarjeta.css';
import mercadoPagoImg from '../assets/mercadoPago.png';

const CheckoutPago = () => {
  const [headerHtml, setHeaderHtml] = useState('');
  const [footerHtml, setFooterHtml] = useState('');
  const navigate = useNavigate();
  const { totalItems } = useContext(CartContext);

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
  // 2. EL CEREBRO BLINDADO: Pone tu nombre de forma segura
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
    const timer = setTimeout(() => {
      const badge = document.getElementById('mu-cart-badge');
      if (badge) {
        badge.textContent = totalItems;
        badge.setAttribute('data-count', totalItems);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [totalItems, headerHtml]);

  return (
    <div className="pago-tarjeta-page">
      <div id="header-root" dangerouslySetInnerHTML={{ __html: headerHtml }} />
      
      <div className="checkout-container">
      {/* Breadcrumb */}
      <nav className="breadcrumb">Home &gt; Carrito</nav>

      {/* Stepper (Progreso) */}
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

        {/* Caja de Mercado Pago */}
        <div className="mp-info-box">
          <img src={mercadoPagoImg} alt="Mercado Pago" className="mp-logo-large" />
          <p>
            Al hacer clic en continuar, serás redirigido a <strong>Mercado Pago</strong>.
            Podrás usar tu saldo, tarjeta de crédito o débito para completar tu compra.
          </p>
        </div>

        <button 
          className="btn-pay mp-button" 
          onClick={() => navigate('/final')} // Por ahora nos lleva a final, luego llamará a la API de MP
        >
          Continuar a Mercado Pago
        </button>
      </main>

      {/* Decoración de hojas */}
      <div className="leaf-decoration left"></div>
      <div className="leaf-decoration right"></div>
      </div>
      
      <div id="footer-root" dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </div>
  );
};

export default CheckoutPago;