import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext'; // IMPORTAMOS EL CEREBRO
import './Final.css';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  // Nos traemos la función para vaciar y el total de ítems
  const { clearCart, totalItems } = useContext(CartContext);

  const [headerHtml, setHeaderHtml] = useState('');
  const [footerHtml, setFooterHtml] = useState('');

  // 1. Al montar el componente, VACIAMOS EL CARRITO
  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Cargamos el Header y Footer
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

  // 3. Actualizamos el número del carrito en el Header inyectado (ahora será 0)
  useEffect(() => {
    const badge = document.getElementById('mu-cart-badge');
    if (badge) {
      badge.textContent = totalItems;
      badge.setAttribute('data-count', totalItems);
    }
  }, [totalItems, headerHtml]);

  return (
    <div className="final-page">
      <div id="header-root" dangerouslySetInnerHTML={{ __html: headerHtml }} />
      
      <div className="success-container">
        <main className="success-content">
        {/* Ícono de Check Azul */}
        <div className="check-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="#008DFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1 className="thanks-title">¡MUCHAS GRACIAS!</h1>
        <h2 className="processing-subtitle">Tu compra está siendo procesada</h2>

        <p className="success-description">
          Revisa tu correo electrónico, te enviaremos los detalles <br />
          de tu compra y el código de seguimiento en las <br />
          próximas horas.
        </p>

        {/* Cambiamos window.location por navigate para que no recargue toda la página */}
        <button className="btn-home" onClick={() => navigate('/')}>
          Home
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

export default CheckoutSuccess;