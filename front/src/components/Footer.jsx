import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Toast from './Toast';
import './styles.css';
import logoImage from '../assets/logo.png';

const Footer = () => {
  const location = useLocation();
  const [toastData, setToastData] = useState({ message: '', type: 'info', visible: false });

  const showToast = (msg, type = 'info') => setToastData({ message: msg, type, visible: true });
  const closeToast = () => setToastData({ ...toastData, visible: false });
  
  // Mostrar footer en todas las páginas, incluso en login, para consistencia con header
  // if (location.pathname === '/login') return null;

  return (
    <footer className="mu-footer">
      <div className="mu-footer__inner">
        <div className="mu-footer__brand-col">
          <Link to="/" className="mu-footer__logo-link">
            <img src={logoImage} alt="Mate Único" className="mu-footer__logo" />
          </Link>
          <p className="mu-footer__tag">Diseños y accesorios seleccionados para los verdaderos amantes del mate.</p>
          <div className="mu-footer__socials" aria-label="Redes sociales">
            <a href="#" className="mu-social" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
              </svg>
            </a>
            <a href="#" className="mu-social" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M18 2h-3a4 4 0 0 0-4 4v3H8v3h3v7h3v-7h2.5l.5-3H14V6a1 1 0 0 1 1-1h3z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a href="#" className="mu-social" aria-label="YouTube">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M10 9.5v5l4-2.5-4-2.5z" fill="currentColor"/>
              </svg>
            </a>
          </div>
        </div>

        <div className="mu-footer__links-col">
          <h4>Comprar</h4>
          <ul className="mu-links">
            <li><Link to="/productos?cat=mate" style={{ color: '#9fa3a6', textDecoration: 'none' }}>Mates</Link></li>
            <li><Link to="/productos?f=combo_simple,combo_completo" style={{ color: '#9fa3a6', textDecoration: 'none' }}>Combos</Link></li>
          </ul>
        </div>

        <div className="mu-footer__links-col">
          <h4>Ayuda</h4>
          <ul className="mu-links">
            <li><Link to="/faq" style={{ color: '#9fa3a6', textDecoration: 'none' }}>Preguntas frecuentes</Link></li>
            <li><Link to="/envios" style={{ color: '#9fa3a6', textDecoration: 'none' }}>Envíos</Link></li>
            <li><Link to="/quienes-somos" style={{ color: '#9fa3a6', textDecoration: 'none' }}>Quiénes Somos</Link></li>
          </ul>
        </div>

        <div className="mu-footer__newsletter-col">
          <h4>Recibí novedades</h4>
          <p className="mu-small">Suscribite y te avisamos sobre lanzamientos y ofertas.</p>
          <form className="mu-newsletter" onSubmit={(e) => { e.preventDefault(); showToast('Gracias por suscribirte', 'success'); }}>
            <label htmlFor="mu-news-email" className="sr-only">Email</label>
            <input id="mu-news-email" className="mu-news-input" type="email" placeholder="tu@correo.com" required />
            <button className="mu-news-button" type="submit">Suscribirse</button>
          </form>
        </div>
      </div>

      <div className="mu-footer__bottom">
        <div className="mu-footer__copyright">© Mate Único — Todos los derechos reservados.</div>
      </div>
      <Toast 
        message={toastData.message} 
        type={toastData.type} 
        visible={toastData.visible} 
        onClose={closeToast} 
      />
    </footer>
  );
};

export default Footer;
