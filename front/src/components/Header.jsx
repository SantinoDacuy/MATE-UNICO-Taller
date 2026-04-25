import React, { useContext, useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './styles.css';
import logoImage from '../assets/logo.png';

const Header = () => {
  const { totalItems } = useContext(CartContext);
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  
  // Keep header visible on login too, for consistent navigation and UX
  // if (location.pathname === '/login') return null;

  useEffect(() => {
    // Check if user is logged in (re-runs on every route change so login redirect updates UI)
    fetch('http://localhost:3001/auth/me', { credentials: 'include' })
      .then(res => {
        if (!res.ok) {
          // 401 sessions no inicia sesion; seguimos con user null sin crash
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && data.loggedIn && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(err => console.warn("Error fetching user session", err));
      
    // Handle click outside to close dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    fetch('http://localhost:3001/auth/logout', { method: 'POST', credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(null);
          navigate('/login');
        }
      });
  };

  return (
    <header className="mu-header">
      <div className="mu-header__inner">
        <div className="mu-header__left">
          <Link to="/" className="mu-brand" aria-label="Ir al inicio" style={{ textDecoration: 'none', color: '#fff' }}>
            <span className="mu-brand-text" style={{ color: '#ffffff' }}>Mate</span>
            <img src={logoImage} alt="logo" className="mu-logo-inline" />
            <span className="mu-brand-text" style={{ color: '#caa14e' }}>Único</span>
          </Link>
        </div>

        <div className="mu-header__center">
          <form className="mu-search" role="search" aria-label="Buscar productos" action="/productos" method="get">
            <label htmlFor="mu-search-input" className="sr-only">Buscar productos</label>
            <input id="mu-search-input" name="q" className="mu-search__input" type="search" placeholder="mates, accesorios, combos..." aria-label="Buscar" />
            <button type="submit" className="mu-search__button" aria-label="Buscar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </div>

        <div className="mu-header__right">
          {isHome && (
            <button className="mu-filter-link" onClick={() => window.dispatchEvent(new Event('openFilter'))} style={{ display: 'inline-block' }}>
              Filtrar
            </button>
          )}

          {/* Favoritos link */}
          <Link to="/favoritos" className="mu-icon mu-heart" aria-label="Favoritos" style={{ cursor: 'pointer' }} id="header-link-favoritos">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>

          {/* Carrito link */}
          <Link to="/carrito" className="mu-icon mu-cart" aria-label="Carrito" style={{ cursor: 'pointer' }} id="header-link-carrito">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M6 6h15l-1.5 9h-11z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="10" cy="20" r="1" fill="currentColor"/>
              <circle cx="18" cy="20" r="1" fill="currentColor"/>
            </svg>
            <span id="mu-cart-badge" className="mu-badge" data-count={totalItems}>{totalItems}</span>
          </Link>

          <div id="mu-profile-area" className="mu-profile" aria-live="polite" style={{ position: 'relative' }} ref={dropdownRef}>
            <div 
              id="header-link-perfil" 
              className="mu-icon mu-user" 
              aria-label="Perfil" 
              style={{ cursor: 'pointer' }}
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span id="mu-profile-name" className="mu-profile-name">
                Perfil
              </span>
            </div>
            
            {dropdownOpen && (
              <div className="mu-profile-dropdown" style={{
                position: 'absolute',
                top: 'calc(100% + 5px)',
                right: 0,
                background: '#151515',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '8px 0',
                minWidth: '160px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column'
              }}>
                {user ? (
                  <>
                    <Link to="/perfil" className="mu-dropdown-item" onClick={() => setDropdownOpen(false)}>Mi Perfil</Link>
                    <button 
                      className="mu-dropdown-item mu-logout-dropdown" 
                      onClick={() => { handleLogout(); setDropdownOpen(false); }}
                    >
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <Link to="/login" className="mu-dropdown-item" onClick={() => setDropdownOpen(false)}>Iniciar sesión</Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
