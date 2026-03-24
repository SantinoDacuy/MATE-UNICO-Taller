import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

// Importamos la imagen de fondo dramática
// Replaced missing asset with existing `inicio1.jpg` to avoid import error
import dramaticMateBg from '../assets/inicio1.jpg';
// Logo de la marca
import logoImage from '../assets/logo.png'; 

const HomePage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
  // --- CONFIGURACIÓN MANUAL DEL CLIENT ID ---
  // Pegamos el ID directamente acá para asegurar que coincida con el del backend
  const googleClientId = "931841756818-6rfk9jgaad9rsk44vsnolrtaro93k3qn.apps.googleusercontent.com";;
    if (!googleClientId) {
      setError('Error: Google Client ID no configurado');
      setIsLoading(false);
      return;
    }

    const handleCredentialResponse = async (response) => {
      const token = response.credential;
      
      if (!token) {
        setError('Error: No se recibió token de Google');
        return;
      }

      try {
        // Intentar enviar al backend
        try {
          const res = await fetch('http://localhost:3001/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ credential: token }),
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data && data.success) {
              // Guardar token en localStorage
              localStorage.setItem('google_token', token);
              navigate('/');
              return;
            }
          }
        } catch (fetchError) {
          console.warn('Backend connection failed, proceeding in offline mode');
        }
        
        // Modo fallback: guardar token y continuar
        localStorage.setItem('google_token', token);
        navigate('/');
      } catch (err) {
        setError('Error al procesar autenticación');
        console.error('Error:', err);
      }
    };

    const initGoogle = () => {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          const button = document.getElementById('google-signin-button');
          if (button) {
            window.google.accounts.id.renderButton(button, {
              type: 'standard',
              theme: 'outline',
              size: 'large',
              width: '320',
              locale: 'es'
            });
            setIsLoading(false);
          }
        } catch (err) {
          setError('Error al inicializar Google Sign-In');
          console.error('Google init error:', err);
          setIsLoading(false);
        }
      } else {
        // Reintentar en 500ms si Google SDK no está listo
        setTimeout(initGoogle, 500);
      }
    };

    initGoogle();
    // Timeout para dejar de cargar si Google no se inicializa
    setTimeout(() => setIsLoading(false), 10000);
  }, [navigate]);

  return (
    <div 
      className="login-full-screen-bg" 
      style={{ backgroundImage: `url(${dramaticMateBg})` }}
    >
      <div className="login-card-container">
        
        {/* Reemplaza solo el bloque login-logo-top por este: */}
        <div 
          className="login-logo-top" 
          onClick={() => navigate('/')} 
          style={{ cursor: 'pointer' }}
        >
          <span className="logo-text-accent">
            Mate <img src={logoImage} alt="Mate Único Logo" className="logo-inline" /> Único
          </span>
        </div>

        <div className="login-card">
          <h1 className="login-title-centered">Iniciar Sesión</h1>
          
          {/* Mensaje de Error */}
          {error && (
            <div style={{
              padding: '12px',
              marginBottom: '16px',
              backgroundColor: '#fee',
              color: '#c33',
              borderRadius: '6px',
              fontSize: '14px',
              border: '1px solid #fcc'
            }}>
              {error}
            </div>
          )}

          {/* Indicador de Carga */}
          {isLoading && (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              color: '#666',
              fontSize: '14px'
            }}>
              Cargando Google Sign-In...
            </div>
          )}

          {/* Botón de Google */}
          <div id="google-signin-button" style={{display: 'flex', justifyContent: 'center'}} />

          {/* Iconos Sociales */}
          <div className="login-separator">o</div>

          <div className="login-social-icons-pro">
            <a 
              href="https://www.facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-icon-pro facebook-bg"
              aria-label="Facebook"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a 
              href="https://www.instagram.com/leomessi/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-icon-pro instagram-bg"
              aria-label="Instagram"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a 
              href="https://www.linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-icon-pro linkedin-bg"
              aria-label="LinkedIn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>

          <p className="login-welcome-text-pro">
            Bienvenido a Mate Único, donde la tradición se viste de elegancia.
          </p>

          <div style={{ marginTop: '18px', textAlign: 'center' }}>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;