import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext'; 
import Toast from '../components/Toast';
import Breadcrumbs from '../components/Breadcrumbs';
import './Pago-tarjeta.css';
import mercadoPagoImg from '../assets/mercadoPago.png';

const PagoTarjeta = () => {
  const navigate = useNavigate();
  
  // Traemos el carrito y la función para vaciarlo del contexto
  const { cart, totalItems, clearCart } = useContext(CartContext);

  // Estado para Toast
  const [toastData, setToastData] = useState({ message: '', type: 'info', visible: false });

  const showToast = (msg, type = 'info') => setToastData({ message: msg, type, visible: true });
  const closeToast = () => setToastData({ ...toastData, visible: false });

  // =========================================================
  // 4. FUNCIÓN PARA PROCESAR LA VENTA REAL EN DB
  // =========================================================
  const handleFinalizarCompra = async () => {
    const checkoutData = JSON.parse(sessionStorage.getItem('checkout_data') || '{}');

    // Limpiamos el carrito para que solo lleve lo necesario y no objetos pesados de Strapi
    const cartLimpio = cart.map(item => ({
      id: item.id,
      documentId: item.documentId,
      nombre: item.nombre,
      precio: Number(item.precio),
      cantidad: Number(item.cantidad)
    }));

    try {
      const res = await fetch('http://localhost:3001/api/create_preference', {
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
        // Redirigir a Mercado Pago
        window.location.href = data.init_point;
      } else {
        showToast("Error: " + (data.error || "No se pudo registrar la compra"), 'error');
      }
    } catch (error) {
      console.error("Error:", error);
      showToast("Error de conexión con el servidor.", 'error');
    }
  };

  return (
    <div className="pago-tarjeta-page">
      
      <div className="checkout-container">
        <Breadcrumbs />

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
            Continuar Compra
          </button>
        </main>

        <div className="leaf-decoration left"></div>
        <div className="leaf-decoration right"></div>
      </div>
      
      <Toast 
        message={toastData.message} 
        type={toastData.type} 
        visible={toastData.visible} 
        onClose={closeToast} 
      />
    </div>
  );
};

export default PagoTarjeta;