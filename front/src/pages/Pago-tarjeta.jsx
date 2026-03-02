import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Pago.tarjeta.css';
import mercadoPagoImg from '../assets/mercadoPago.png';

const CheckoutPago = () => {
  const [headerHtml, setHeaderHtml] = useState('');
  const [footerHtml, setFooterHtml] = useState('');
  const navigate = useNavigate();

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
          <h2 className="section-title">Detalles de pago</h2>
          <div className="mercadopago-logo">
            <img src={mercadoPagoImg} alt="Mercado Pago" />
          </div>
        </div>

        <form 
          className="payment-form"
          onSubmit={(e) => {
            e.preventDefault();
            navigate('/final');
          }}
        >
          <input type="text" placeholder="Nombre de titular" className="input-full" />
          <input type="text" placeholder="Número de tarjeta" className="input-full" />
          
          <div className="form-row">
            <select className="input-select">
              <option value="">Mes</option>
              {/* Aquí podrías mapear los meses */}
            </select>
            <select className="input-select">
              <option value="">Año</option>
              {/* Aquí podrías mapear los años */}
            </select>
            <input type="text" placeholder="Código" className="input-code" />
          </div>

          <button type="submit" className="btn-pay">Pagar</button>
        </form>
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