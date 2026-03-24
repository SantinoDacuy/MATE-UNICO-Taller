import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext'; 
import './Final.css';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const { clearCart, totalItems } = useContext(CartContext);

  // =========================================================
  // 1. VACIAR EL CARRITO EN MONTAJE
  // =========================================================
  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="final-page">
      
      <div className="success-container">
        <main className="success-content">
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

        {/* Usamos href para forzar una recarga limpia al terminar la compra */}
        <button className="btn-home" onClick={() => window.location.href = '/'}>
          Volver al Inicio  
        </button>
      </main>

        <div className="leaf-decoration left"></div>
        <div className="leaf-decoration right"></div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;