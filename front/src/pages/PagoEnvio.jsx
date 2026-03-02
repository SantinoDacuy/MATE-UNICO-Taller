import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PagoEnvio.css';

const PagoEnvio = () => {
  const [metodoSeleccionado, setMetodoSeleccionado] = useState('oca');
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
    <div className="pago-envio-page">
      <div id="header-root" dangerouslySetInnerHTML={{ __html: headerHtml }} />
      
      <div className="checkout-container">
      {/* Breadcrumb */}
      <nav className="breadcrumb">
        Home &gt; Carrito
      </nav>

      {/* Stepper (Progreso) */}
      <div className="stepper">
        <span className="step">Dirección</span>
        <div className="line"></div>
        <span className="step active">Envío</span>
        <div className="line"></div>
        <span className="step">Pago</span>
      </div>

      <main className="content">
        <h2 className="section-title">Información</h2>

        <div className="options-container">
          {/* Opción OCA */}
          <div 
            className={`shipping-option ${metodoSeleccionado === 'oca' ? 'selected' : ''}`}
            onClick={() => setMetodoSeleccionado('oca')}
          >
            <input 
              type="checkbox" 
              checked={metodoSeleccionado === 'oca'} 
              readOnly 
            />
            <div className="option-details">
              <strong>OCA</strong>
              <p>3-5 Días hábiles</p>
            </div>
          </div>

          {/* Opción Andreani */}
          <div 
            className={`shipping-option ${metodoSeleccionado === 'andreani' ? 'selected' : ''}`}
            onClick={() => setMetodoSeleccionado('andreani')}
          >
            <input 
              type="checkbox" 
              checked={metodoSeleccionado === 'andreani'} 
              readOnly 
            />
            <div className="option-details">
              <strong>Andreani</strong>
              <p>5-7 Días hábiles</p>
            </div>
          </div>
        </div>

        <button 
          className="btn-continue"
          onClick={() => navigate('/pago-tarjeta')}
        >
          Continuar
        </button>
      </main>

      {/* Decoración de hojas (opcional) */}
      <div className="leaf-decoration left"></div>
      <div className="leaf-decoration right"></div>
      </div>
      
      <div id="footer-root" dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </div>
  );
};

export default PagoEnvio;