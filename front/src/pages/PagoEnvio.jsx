import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PagoEnvio.css';

// Métodos de envío disponibles
const SHIPPING_METHODS = [
  { id: 'oca', name: 'OCA', days: '3-5 Días hábiles' },
  { id: 'andreani', name: 'Andreani', days: '5-7 Días hábiles' },
  { id: 'correo-argentino', name: 'Correo Argentino', days: '7-10 Días hábiles' }
];

const PagoEnvio = () => {
  const [metodoSeleccionado, setMetodoSeleccionado] = useState(() => 
    localStorage.getItem('shippingMethod') || 'oca'
  );
  const [headerHtml, setHeaderHtml] = useState('');
  const [footerHtml, setFooterHtml] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Persistir selección en localStorage
  useEffect(() => {
    localStorage.setItem('shippingMethod', metodoSeleccionado);
  }, [metodoSeleccionado]);

  // Cargar header/footer una sola vez
  useEffect(() => {
    Promise.all([
      fetch('/src/components/header.html').then(r => r.text()).catch(() => ''),
      fetch('/src/components/footer.html').then(r => r.text()).catch(() => '')
    ]).then(([header, footer]) => {
      setHeaderHtml(header);
      setFooterHtml(footer);
    });

    // Cargar estilos del componente una única vez
    if (!document.querySelector('link[href="/src/components/styles.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/src/components/styles.css';
      document.head.appendChild(link);
    }
  }, []);

  const handleContinue = () => {
    if (!metodoSeleccionado) {
      setError('Por favor selecciona un método de envío');
      return;
    }
    setError('');
    navigate('/pago-tarjeta');
  };

  return (
    <div className="pago-envio-page">
      <div id="header-root" dangerouslySetInnerHTML={{ __html: headerHtml }} />
      
      <div className="checkout-container">
        <nav className="breadcrumb">
          Home &gt; Carrito
        </nav>

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
            {SHIPPING_METHODS.map(method => (
              <div
                key={method.id}
                className={`shipping-option ${metodoSeleccionado === method.id ? 'selected' : ''}`}
                onClick={() => setMetodoSeleccionado(method.id)}
                role="radio"
                aria-checked={metodoSeleccionado === method.id}
              >
                <input
                  type="radio"
                  name="shipping-method"
                  value={method.id}
                  checked={metodoSeleccionado === method.id}
                  onChange={(e) => setMetodoSeleccionado(e.target.value)}
                  aria-label={`Seleccionar ${method.name}`}
                />
                <div className="option-details">
                  <strong>{method.name}</strong>
                  <p>{method.days}</p>
                </div>
              </div>
            ))}
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            className="btn-continue"
            onClick={handleContinue}
            aria-label="Continuar con el pago"
          >
            Continuar
          </button>
        </main>
      </div>
      
      <div id="footer-root" dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </div>
  );
};

export default PagoEnvio;