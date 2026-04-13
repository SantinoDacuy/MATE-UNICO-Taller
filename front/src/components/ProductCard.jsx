import React from 'react';
import { Link } from 'react-router-dom';
import imagenComodin from '../assets/camionero1.png';

const ProductCard = ({ producto }) => {
  const stock = producto?.stock ?? 0;
  const tieneStock = stock > 0;
  const ultimasUnidades = stock > 0 && stock < 5;

  return (
    <Link to={`/producto/${producto.documentId}`} className="card-producto" style={{ textDecoration: 'none' }}>
      <div 
        className="card-img-wrapper" 
        style={{ position: 'relative' }}
      >
        <img 
          src={producto.imagenes && producto.imagenes.length > 0 
            ? `http://localhost:1337${producto.imagenes[0].url}` 
            : imagenComodin} 
          alt={producto.nombre}
          style={{
            opacity: !tieneStock ? 0.35 : 1,
            transition: 'opacity 0.3s ease'
          }}
        />
        
        {/* Overlay "SIN STOCK" */}
        {!tieneStock && (
          <div 
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              pointerEvents: 'none'
            }}
          >
            <div 
              style={{
                backgroundColor: 'rgba(211, 47, 47, 0.95)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '4px',
                fontSize: '18px',
                fontWeight: 'bold',
                textAlign: 'center',
                transform: 'rotate(-15deg)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
              }}
            >
              SIN STOCK
            </div>
          </div>
        )}
      </div>
      
      <div className="card-info">
        <h3>{producto.nombre}</h3>
        <span className="card-precio">${producto.precio.toLocaleString('es-AR')}</span>
        
        {/* Stock info */}
        {!tieneStock && (
          <div style={{ 
            color: '#d32f2f', 
            fontSize: '14px', 
            marginTop: '8px',
            fontWeight: '600'
          }}>
            Sin Stock
          </div>
        )}
        
        {ultimasUnidades && (
          <div style={{ 
            color: '#ff9800', 
            fontSize: '13px', 
            marginTop: '8px',
            fontWeight: '600'
          }}>
            ¡Últimas unidades disponibles!
          </div>
        )}
        
        {tieneStock && !ultimasUnidades && (
          <div style={{ 
            color: '#666', 
            fontSize: '13px', 
            marginTop: '8px'
          }}>
            {stock} disponible{stock !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
