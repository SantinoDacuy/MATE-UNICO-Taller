import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom'; 
import { CartContext } from '../context/CartContext'; 
import './ProductPage.css';

import camionero1 from '../assets/camionero1.png'; 
import camionero2 from '../assets/camionero2.png';
import camionero3 from '../assets/camionero3.png';
import camionero4 from '../assets/camionero4.png';

const ProductPage = () => {
  const { id } = useParams(); 
  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  
  const [quantity, setQuantity] = useState(1);
  const [grabado, setGrabado] = useState(''); 
  
  // Estados para los colores dinámicos
  const [availableColors, setAvailableColors] = useState([]);
  const [selectedColor, setSelectedColor] = useState(''); 
  
  const [headerHtml, setHeaderHtml] = useState('');
  const [footerHtml, setFooterHtml] = useState('');

  const { addToCart, totalItems } = useContext(CartContext);

  useEffect(() => {
    Promise.all([
      fetch('/src/components/header.html').then(r => r.text()).catch(() => ''),
      fetch('/src/components/footer.html').then(r => r.text()).catch(() => '')
    ]).then(([header, footer]) => {
      setHeaderHtml(header);
      setFooterHtml(footer);
    });

    if (!document.querySelector('link[href="/src/components/styles.css"]')) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = '/src/components/styles.css';
      document.head.appendChild(l);
    }
  }, []);

  useEffect(() => {
    fetch(`http://localhost:1337/api/productos/${id}?populate=*`)
      .then((respuesta) => respuesta.json())
      .then((json) => {
        const prod = json.data;
        setProducto(prod);
        
        // --- MAGIA DE COLORES DINÁMICOS ---
        // Leemos Strapi y armamos la lista de colores que existen
        const colores = [];
        if (prod.color_negro) colores.push('Negro');
        if (prod.color_marron) colores.push('Marrón');
        if (prod.color_blanco) colores.push('Blanco');
        if (prod.color_gris) colores.push('Gris');
        
        setAvailableColors(colores);
        
        // Seleccionamos el primero por defecto (si es que tiene colores)
        if (colores.length > 0) {
          setSelectedColor(colores[0]);
        } else {
          // Si el admin se olvidó de poner colores, le ponemos uno genérico
          setSelectedColor('Único'); 
        }

        setCargando(false);
      })
      .catch((error) => {
        console.error("Error al traer el mate:", error);
        setCargando(false);
      });
  }, [id]);

  useEffect(() => {
    const badge = document.getElementById('mu-cart-badge');
    if (badge) {
      badge.textContent = totalItems;
      badge.setAttribute('data-count', totalItems);
    }

    const checkUserStatus = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/user/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.loggedIn && data.user) {
            const profileNameEl = document.getElementById('mu-profile-name');
            if (profileNameEl) {
              const firstName = (data.user.nombre || 'Usuario').split(' ')[0];
              profileNameEl.textContent = firstName;
            }
          }
        }
      } catch (error) {
        console.warn('Error checking user status:', error);
      }
    };

    const container = document.getElementById('header-root');
    if (container && container.innerHTML) {
      checkUserStatus();
    }
  }, [headerHtml, totalItems]); 

  const handleAddToCart = () => {
    // Mandamos al carrito el color exacto que eligió el cliente
    addToCart(producto, quantity, selectedColor, grabado);
    alert(`¡Mate ${selectedColor} agregado al carrito! 🛍️`);
  };

  if (cargando) return <div style={{textAlign: 'center', marginTop: '100px'}}><h2>Calentando el agua para tu mate... 🧉</h2></div>;
  if (!producto) return <div style={{textAlign: 'center', marginTop: '100px'}}><h2>Mate no encontrado 😥</h2></div>;

  return (
    <div className="page-wrapper">
      
      <div id="header-root" dangerouslySetInnerHTML={{ __html: headerHtml }} />

      <main className="main-content">
        <div className="breadcrumb">
          Home &gt; Producto &gt; {producto.nombre}
        </div>

        <section className="product-detail">
          
          <div className="product-images-grid">
            {producto.imagenes && producto.imagenes.length > 0 ? (
              producto.imagenes.map((img, index) => (
                <div className="img-wrapper" key={index}>
                  <img src={`http://localhost:1337${img.url}`} alt={`${producto.nombre} vista ${index + 1}`} />
                </div>
              ))
            ) : (
              <>
                <div className="img-wrapper"><img src={camionero1} alt="Mate vista 1" /></div>
                <div className="img-wrapper"><img src={camionero2} alt="Mate vista 2" /></div>
                <div className="img-wrapper"><img src={camionero3} alt="Mate vista 3" /></div>
                <div className="img-wrapper"><img src={camionero4} alt="Mate vista 4" /></div>
              </>
            )}
          </div>

          <div className="product-info">
            <h1>{producto.nombre}</h1>
            <button className="wishlist-btn">♡</button>
            
            <p className="description">
              {producto.descripcion}
            </p>

            <div className="selectors">
              <div className="selector-group">
                <label>Cantidad</label>
                <div className="qty-input">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)}>+</button>
                </div>
              </div>
              
              {/* --- CÍRCULOS DE COLORES DINÁMICOS --- */}
              {availableColors.length > 0 && (
                <div className="selector-group">
                  <label>Color</label>
                  <div className="color-options">
                    {availableColors.includes('Negro') && (
                      <span 
                        className={`color-circle black ${selectedColor === 'Negro' ? 'selected' : ''}`}
                        onClick={() => setSelectedColor('Negro')}
                        style={{backgroundColor: '#000'}}
                        title="Negro"
                      ></span>
                    )}
                    {availableColors.includes('Marrón') && (
                      <span 
                        className={`color-circle brown ${selectedColor === 'Marrón' ? 'selected' : ''}`}
                        onClick={() => setSelectedColor('Marrón')}
                        style={{backgroundColor: '#8B4513'}}
                        title="Marrón"
                      ></span>
                    )}
                    {availableColors.includes('Blanco') && (
                      <span 
                        className={`color-circle ${selectedColor === 'Blanco' ? 'selected' : ''}`}
                        onClick={() => setSelectedColor('Blanco')}
                        style={{backgroundColor: '#fff', border: '1px solid #ccc'}}
                        title="Blanco"
                      ></span>
                    )}
                    {availableColors.includes('Gris') && (
                      <span 
                        className={`color-circle ${selectedColor === 'Gris' ? 'selected' : ''}`}
                        onClick={() => setSelectedColor('Gris')}
                        style={{backgroundColor: '#808080'}}
                        title="Gris"
                      ></span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* --- SECCIÓN DE GRABADO CONDICIONAL --- */}
            {producto.material !== 'metal' && producto.material !== 'vidrio' ? (
              <div className="engraving-section">
                <input 
                  type="text" 
                  placeholder="Añadir Grabado" 
                  value={grabado}
                  onChange={(e) => setGrabado(e.target.value)}
                />
                <button className="btn-dark-small" onClick={() => alert("Grabado guardado")}>Agregar</button>
              </div>
            ) : (
              <div className="engraving-section" style={{ opacity: 0.6 }}>
                <input 
                  type="text" 
                  placeholder="Grabado no disponible para este material" 
                  disabled
                  style={{ cursor: 'not-allowed', backgroundColor: '#f5f5f5' }}
                />
                <button className="btn-dark-small" disabled style={{ cursor: 'not-allowed' }}>
                  No disponible
                </button>
              </div>
            )}

            <button className="btn-primary-block" onClick={handleAddToCart}>
              Añadir al carrito - ${producto.precio * quantity}
            </button>
          </div>
        </section>

        {/* ... (Reviews y Productos Similares quedan igual) ... */}
        
        <section className="reviews-section">
          <h2>Opiniones</h2>
          {/* ... */}
        </section>

        <section className="similar-products">
          <h2>Ver <br/> Productos <br/> similares</h2>
          <div className="products-carousel">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="product-card">
                <div className="product-placeholder">
                  <span>Producto {item}</span>
                </div>
                <div className="card-overlay">
                  <span>Nombre Producto</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <div id="footer-root" dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </div>
  );
};

export default ProductPage;