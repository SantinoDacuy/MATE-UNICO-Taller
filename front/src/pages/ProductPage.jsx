import React, { useState } from 'react';
import './ProductPage.css';

// IMPORTACIONES DE IMAGEN: La ruta '../' sale de la carpeta 'pages' y entra a 'assets'
import camionero1 from '../assets/camionero1.png'; 
import camionero2 from '../assets/camionero2.png';
import camionero3 from '../assets/camionero3.png';
import camionero4 from '../assets/camionero4.png';


const ProductPage = () => {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="page-wrapper">
      {/* --- HEADER --- */}
      <header className="header">
        <div className="header-content">
          <div className="logo">Mate 🧉 Único</div>
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Buscar" />
          </div>
          <div className="header-icons">
            <span className="bag-icon">🛍️ 2</span>
            <span className="user-icon">👤</span>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* --- BREADCRUMB --- */}
        <div className="breadcrumb">
          Home &gt; Producto
        </div>

        {/* --- PRODUCT SECTION --- */}
        <section className="product-detail">
          
          {/* GALERÍA DE IMÁGENES: Usamos las variables importadas */}
          <div className="product-images-grid">
            <div className="img-wrapper">
              <img src={camionero1} alt="Mate vista 1" />
            </div>
            <div className="img-wrapper">
              <img src={camionero2} alt="Mate vista 2" />
            </div>
            <div className="img-wrapper">
              <img src={camionero3} alt="Mate vista 3" />
            </div>
            <div className="img-wrapper">
              <img src={camionero4} alt="Mate vista 4" />
            </div>
          </div>

          <div className="product-info">
            <h1>Camionero de calabaza</h1>
            <button className="wishlist-btn">♡</button>
            
            <p className="description">
              Disfruta la tradición con este mate de calabaza forrado en cuero. 
              Su diseño robusto ofrece un agarre cómodo y mantiene el calor ideal para tus cebadas. 
              Incluye virola de acero. ¡Un compañero perfecto para cada momento!
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
              
              <div className="selector-group">
                <label>Color</label>
                <div className="color-options">
                  <span className="color-circle black selected"></span>
                  <span className="color-circle brown"></span>
                </div>
              </div>
            </div>

            <div className="engraving-section">
              <input type="text" placeholder="Añadir Grabado" />
              <button className="btn-dark-small">Agregar</button>
            </div>

            <button className="btn-primary-block">
              Añadir al carrito - $20.000
            </button>
          </div>
        </section>

        {/* --- REVIEWS SECTION --- */}
        <section className="reviews-section">
          <h2>Opiniones</h2>
          <div className="reviews-container">
            <div className="review-list">
              {/* Review 1 */}
              <div className="review-item">
                <div className="stars">★★★★★</div>
                <h3>Camionero de Calabaza</h3>
                <p>Excelente mate, muy conforme y gran servicio.</p>
              </div>
              
              {/* Review 2 */}
              <div className="review-item">
                <div className="stars">★★★★★</div>
                <h3>Camionero de Calabaza</h3>
                <p>Buen mate, el cuero se ve de muy buena calidad.</p>
              </div>

              {/* Review 3 */}
              <div className="review-item">
                <div className="stars">★★★★☆</div>
                <h3>Camionero de Calabaza</h3>
                <p>Bueno.</p>
              </div>
            </div>

            <div className="review-meta-column">
                <div className="meta-item">
                    <span className="date">17/06/2025</span>
                    <span className="user">Matias L.</span>
                </div>
                <div className="meta-item">
                    <span className="date">25/05/2025</span>
                    <span className="user">Pedro G.</span>
                </div>
                <div className="meta-item">
                    <span className="date">04/12/2024</span>
                    <span className="user">Miguel R.</span>
                </div>
            </div>
          </div>
          <div className="bg-leaf-decoration"></div>
        </section>

        {/* --- SIMILAR PRODUCTS --- */}
        <section className="similar-products">
          <h2>Ver <br/> Productos <br/> similares</h2>
          <div className="products-carousel">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="product-card">
                {/* Placeholder con color de fondo en lugar de imagen externa */}
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


      {/* --- FOOTER --- */}
      <footer className="footer">
        <div className="footer-cols">
          <div className="col">
            <h4>Secciones</h4>
            <ul>
              <li>Home</li>
              <li>Productos</li>
              <li>Carrito</li>
            </ul>
          </div>
          <div className="col">
            <h4>Productos</h4>
            <ul>
              <li>Mate</li>
              <li>Combo</li>
              <li>Filtros</li>
            </ul>
          </div>
          <div className="col center-col">
              <div className="footer-logo">Mate 🧉 Único</div>
              <p className="copyright">Mate Único © 2025. Todos los derechos reservados.</p>
          </div>
          <div className="col right-col">
            <h4>Contacto</h4>
            <p>Tel: +54 3442-000000</p>
            <p>Tel: +54 3442-000000</p>
            <div className="socials">
                <span>YT</span> <span>FB</span> <span>TW</span> <span>IG</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProductPage;