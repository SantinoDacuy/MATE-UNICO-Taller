import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext'; 
import './Final.css';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const { clearCart } = useContext(CartContext);

  useEffect(() => {
    clearCart();

    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('payment_id');
    const status = urlParams.get('status');
    const externalRef = urlParams.get('external_reference');

    if (paymentId && status === 'approved' && externalRef) {
      fetch('http://localhost:3001/api/checkout/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payment_id: paymentId,
          status: status,
          external_reference: externalRef
        })
      }).catch(err => console.error("Error al confirmar pago:", err));
    }
  }, [clearCart]);

  return (
    <div className="final-page-wrapper">
      <div className="final-page-overlay"></div>
      
      <div className="final-glass-panel">
        
        <div className="icon-wrapper">
          <div className="icon-pulse"></div>
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="check-svg">
            <path d="M19 7L9.5 16.5L5 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <span className="final-highlight-phrase">¡Un mate único va en camino!</span>
        <h1 className="final-title">¡PAGO EXITOSO!</h1>
        
        <div className="final-divider"></div>

        <div className="final-info-cards">
          
          <div className="info-card">
            <div className="info-icon mail-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 8L10.8906 13.2604C11.5624 13.7083 12.4376 13.7083 13.1094 13.2604L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="info-text">
              <h3>Revisa tu correo</h3>
              <p>Te enviamos la factura y el detalle de tu compra.</p>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon truck-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 18H3C2.44772 18 2 17.5523 2 17V7C2 6.44772 2.44772 6 3 6H13C13.5523 6 14 6.44772 14 7V18H12M14 10H17.4093C17.9048 10 18.3842 10.1774 18.7573 10.5019L21.348 12.7544C21.7645 13.1166 22 13.6393 22 14.1926V17C22 17.5523 21.5523 18 21 18H19M8 18C8 19.6569 9.34315 21 11 21C12.6569 21 14 19.6569 14 18C14 16.3431 12.6569 15 11 15C9.34315 15 8 16.3431 8 18ZM17 18C17 19.6569 18.3431 21 20 21C21.6569 21 23 19.6569 23 18C23 16.3431 21.6569 15 20 15C18.3431 15 17 16.3431 17 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="info-text">
              <h3>Sigue tu envío</h3>
              <p>Pronto recibirás un código para ver dónde está paquete.</p>
            </div>
          </div>

        </div>

        <button className="final-btn" onClick={() => window.location.href = '/'}>
          <span>SEGUIR EXPLORANDO</span>
        </button>

      </div>
    </div>
  );
};

export default CheckoutSuccess;