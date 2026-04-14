import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Breadcrumbs.css';

const Breadcrumbs = ({ customLastSegment }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // No renderizar en la Home
  if (location.pathname === '/' || location.pathname === '/home') {
    return null;
  }

  // Mapa de nombres para las rutas
  const breadcrumbNameMap = {
    'productos': 'Productos',
    'producto': 'Producto',
    'carrito': 'Mi Carrito',
    'perfil': 'Mi Perfil',
    'favoritos': 'Favoritos',
    'historial-compras': 'Historial de Compras',
    'faq': 'Ayuda / FAQ',
    'envios': 'Información de Envíos',
    'quienes-somos': 'Quiénes Somos',
    'direccion-pago': 'Dirección de Entrega',
    'pago-envio': 'Método de Envío',
    'pago-tarjeta': 'Información de Pago',
    'final': 'Compra Exitosa',
    'login': 'Ingresar'
  };

  return (
    <nav className="mu-breadcrumbs" aria-label="Breadcrumb">
      <div className="mu-breadcrumbs-container">
        <Link to="/" className="breadcrumb-item breadcrumb-link">
          Home
        </Link>
        
        {pathnames.map((segment, index) => {
          const isLast = index === pathnames.length - 1;
          let url = `/${pathnames.slice(0, index + 1).join('/')}`;
          
          // Ajuste especial: si el segmento es 'producto', redirigir a 'productos' (catálogo)
          if (segment === 'producto') {
            url = '/productos';
          }
          
          let displayName = breadcrumbNameMap[segment] || segment;
          
          if (isLast && customLastSegment) {
            displayName = customLastSegment;
          }

          if (segment === 'producto' && isLast && !customLastSegment) {
             displayName = 'Producto';
          }
          
          const isId = /^[a-z0-9]{10,}$/.test(segment) || !isNaN(segment);
          if (isId && !customLastSegment) {
            return null; 
          }

          return (
            <React.Fragment key={url}>
              <span className="breadcrumb-separator">&gt;</span>
              {isLast ? (
                <span 
                  className="breadcrumb-item breadcrumb-current" 
                  onClick={() => window.location.reload()}
                  style={{ cursor: 'pointer' }}
                  title="Recargar página actual"
                >
                  {displayName}
                </span>
              ) : (
                <Link to={url} className="breadcrumb-item breadcrumb-link">
                  {displayName}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};

export default Breadcrumbs;
