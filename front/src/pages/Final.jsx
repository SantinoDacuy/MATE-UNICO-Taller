import React, { useState, useEffect } from 'react';
import './Final.css';

const CheckoutSuccess = () => {
  const [headerHtml, setHeaderHtml] = useState('');
  const [footerHtml, setFooterHtml] = useState('');

  useEffect(() => {
    // load header/footer fragments from /src/components
    fetch('/src/components/header.html')
      .then((r) => r.text())
      .then(setHeaderHtml)
      .catch(() => setHeaderHtml(''));
    fetch('/src/components/footer.html')
      .then((r) => r.text())
      .then(setFooterHtml)
      .catch(() => setFooterHtml(''));

    // ensure styles for components are loaded
    if (!document.querySelector('link[href="/src/components/styles.css"]')) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = '/src/components/styles.css';
      document.head.appendChild(l);
    }
  }, []);

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
        <h2 className="processing-subtitle">Tu compra esta siendo procesada</h2>

        <p className="success-description">
          Revisa tu correo electrónico, te enviaremos los detalles <br />
          de tu compra y el código de seguimiento en las <br />
          próximas horas.
        </p>

        <button className="btn-home" onClick={() => window.location.href = '/'}>
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