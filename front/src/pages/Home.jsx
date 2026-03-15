import React, { useEffect, useState, useRef, useContext } from 'react'; // Agregamos useContext
import { useNavigate, Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext'; // <-- IMPORTAMOS EL CEREBRO DEL CARRITO
import './Home.css';

// Importaciones de imágenes
import heroImg from '../assets/inicio1.jpg';
import seller1 from '../assets/camionero1.png';
import seller2 from '../assets/camionero2.png';
import seller3 from '../assets/camionero3.png';
import carrusel1 from '../assets/carrusel1.jpg';
import carrusell2 from '../assets/carrusell2.jpg';
import carrusel3 from '../assets/carrusel3.jpg';

// filtro lateral
import FilterPanel from '../components/FilterPanel';
import '../components/FilterPanel.css';

// --- 1. COMPONENTE HERO ---
const Hero = () => {
  const navigate = useNavigate(); // <-- Agregamos esto
  return (
    <section className="hero">
      <div className="hero-left">
        <div className="hero-image-container">
          <img src={heroImg} alt="Mate Único" className="hero-image" />
        </div>
      </div>
      <div className="hero-right">
        <h1>¡Bienvenidos a nuestra Tienda de Mates!</h1>
        <p>Descubrí un espacio pensado para los amantes del mate. Acá vas a encontrar mates de todo tipo, bombillas, bolsos y accesorios de calidad, ideales para acompañar cada momento de tu día. Queremos que disfrutes de la tradición con estilo y comodidad.</p>
        
        {/* Cambiá el "1" por el ID del mate imperial que quieras mostrar */}
        <button className="cta" onClick={() => navigate('/producto/wi7cwnvkdxm782iu6vbchsuk')}>Ver ahora</button>
      </div>
    </section>
  );
};

// --- 2. COMPONENTE FILTROS Y GALERÍA ---
const FiltersAndGallery = () => {
  const [productosNuevos, setProductosNuevos] = useState([]);
  const navigate = useNavigate(); // <-- Agregamos esto

  useEffect(() => {
    fetch('http://localhost:1337/api/productos?populate=*&sort=createdAt:desc')
      .then((r) => r.json())
      .then((json) => {
        setProductosNuevos(json.data.slice(0, 3));
      })
      .catch((err) => console.error("Error al traer nuevos ingresos:", err));
  }, []);

  return (
    <section className="filters-gallery no-filters">
      <div className="gallery fullwidth">
        <div className="gallery-row">
          {productosNuevos[1] && (
            <Link to={`/producto/${productosNuevos[1].documentId}`} className="product left">
              <img 
                src={productosNuevos[1].imagenes?.length > 0 ? `http://localhost:1337${productosNuevos[1].imagenes[0].url}` : seller1} 
                alt={productosNuevos[1].nombre} 
              />
            </Link>
          )}

          {productosNuevos[0] && (
            <Link to={`/producto/${productosNuevos[0].documentId}`} className="product center featured">
              <div className="badge"><span>Nuevo</span><span>Ingreso</span></div>
              <img 
                src={productosNuevos[0].imagenes?.length > 0 ? `http://localhost:1337${productosNuevos[0].imagenes[0].url}` : seller2} 
                alt={productosNuevos[0].nombre} 
              />
            </Link>
          )}

          {productosNuevos[2] && (
            <Link to={`/producto/${productosNuevos[2].documentId}`} className="product right">
              <img 
                src={productosNuevos[2].imagenes?.length > 0 ? `http://localhost:1337${productosNuevos[2].imagenes[0].url}` : seller3} 
                alt={productosNuevos[2].nombre} 
              />
            </Link>
          )}
        </div>
        <div className="gallery-actions">
          {/* Botón hacia el catálogo general */}
          <button className="ver-mas" onClick={() => navigate('/productos')}>Ver Más</button>
        </div>
      </div>
    </section>
  );
};




// --- 3. COMPONENTE BEST SELLERS ---
const BestSellers = () => {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate(); // <-- Agregamos esto

  useEffect(() => {
    fetch('http://localhost:1337/api/productos?populate=*')
      .then((r) => r.json())
      .then((json) => {
        setProductos(json.data.slice(0, 3));
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error al traer los mates:", err);
        setCargando(false);
      });
  }, []);

  return (
    <section className="best-sellers">
      <div className="best-sellers-info">
        <h2>Vea nuestros más vendidos</h2>
        <p>Estos son los productos que se ganaron el corazón de nuestros clientes. Perfectos para acompañarte en cualquier momento del día. Anímate a probar los más elegidos de la tienda.</p>
        
        {/* Botón hacia el catálogo ordenado por más vendidos */}
        <button className="ver-mas-button" onClick={() => navigate('/productos?sort=mas-vendidos')}>Ver Más</button>
      </div>
      <div className="best-sellers-list">
                {cargando ? (
          <p style={{marginTop: '20px', fontWeight: 'bold'}}>Preparando los mates... 🧉</p>
        ) : (
          productos.map((prod) => (
            <Link 
              to={`/producto/${prod.documentId}`} 
              className="seller-card" 
              key={prod.id} 
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <img 
                src={prod.imagenes && prod.imagenes.length > 0 ? `http://localhost:1337${prod.imagenes[0].url}` : seller1} 
                alt={prod.nombre} 
              />
              <div className="seller-meta">
                <span className="name">{prod.nombre}</span>
                <span className="price">${prod.precio}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
};

const Carousel = ({ images = [] }) => {
  const [index, setIndex] = React.useState(0);
  const timerRef = useRef(null);

  React.useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [images.length]);

  if (!images || images.length === 0) return null;

  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  return (
    <section className="carousel" aria-roledescription="carousel">
      <div className="carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {images.map((img, i) => (
          <div className={`carousel-slide ${i === index ? 'active' : ''}`} key={i}>
            <img src={img} alt={`Slide ${i + 1}`} />
          </div>
        ))}
      </div>
      <div className="carousel-controls">
        <button className="carousel-button plain prev" onClick={prev} aria-label="Anterior">‹</button>
        <div className="carousel-dots">
          {images.map((_, i) => (
            <button key={i} className={`dot ${i === index ? 'active' : ''}`} onClick={() => setIndex(i)} aria-label={`Ir al slide ${i + 1}`} />
          ))}
        </div>
        <button className="carousel-button plain next" onClick={next} aria-label="Siguiente">›</button>
      </div>
    </section>
  );
};

const Help = () => (
  <section className="help">
    <div className="help-left">
      <h2>Te ayudamos a encontrar tu mate!</h2>
      <p>Encontrar el mate ideal no siempre es fácil. Por eso, en nuestra tienda te acompañamos a descubrir ese mate que se adapta a vos. Queremos que disfrutes de cada ronda con un producto pensado para tu manera de compartir. Elegí con confianza, estamos acá para ayudarte en el camino.</p>
    </div>
  </section>
);

const Home = () => {
  const [headerHtml, setHeaderHtml] = useState('');
  const [footerHtml, setFooterHtml] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const navigate = useNavigate();

  // --- 1. TRAEMOS EL TOTAL DE ÍTEMS DEL CARRITO ---
  const { totalItems } = useContext(CartContext);

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

  // --- 2. MAGIA: ACTUALIZAR EL NÚMERO DEL CARRITO EN EL HOME ---
  useEffect(() => {
    const badge = document.getElementById('mu-cart-badge');
    if (badge) {
      badge.textContent = totalItems;
      badge.setAttribute('data-count', totalItems);
    }
  }, [totalItems, headerHtml]); // Se ejecuta si cambia el carrito o carga el HTML

  useEffect(() => {
    const container = document.getElementById('header-root');
    if (!container) return;
    const insertButton = () => {
      const rightArea = container.querySelector('.mu-header__right');
      if (!rightArea) return;
      let btn = document.getElementById('mu-filter-button');
      if (!btn) {
        btn = document.createElement('button');
        btn.id = 'mu-filter-button';
        btn.className = 'mu-filter-link';
        btn.textContent = 'Filtrar';
        const profileArea = rightArea.querySelector('.mu-profile');
        if (profileArea) {
          rightArea.insertBefore(btn, profileArea);
        } else {
          rightArea.appendChild(btn);
        }
      }
      btn.style.display = 'inline-block';
      btn.onclick = () => setFilterOpen(true);
    };

    const observer = new MutationObserver((mutations) => {
      insertButton();
    });
    observer.observe(container, { childList: true, subtree: true });
    insertButton();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const btn = document.getElementById('mu-filter-button');
    if (btn) btn.style.display = 'inline-block';
  }, [filterOpen]);

  useEffect(() => {
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
    } else {
      const observer = new MutationObserver(() => {
        if (container && container.innerHTML) {
          checkUserStatus();
          observer.disconnect();
        }
      });
      if (container) {
        observer.observe(container, { childList: true, subtree: true });
      }
    }
  }, [headerHtml]);

  const applyFilters = (filtrosActivos) => {
    // Si el usuario eligió filtros, lo mandamos al catálogo pasándole los filtros por la URL
    if (filtrosActivos && filtrosActivos.length > 0) {
      // Convertimos el array ['negro', 'imperial'] a un texto 'negro,imperial'
      const stringFiltros = filtrosActivos.join(','); 
      navigate(`/productos?f=${stringFiltros}`);
    } else {
      // Si tocó "Ver Resultados" sin tildar nada, lo mandamos al catálogo completo
      navigate('/productos');
    }
    setFilterOpen(false);
  };

  return (
    <div className="home-page-container">
      <div id="header-root" dangerouslySetInnerHTML={{ __html: headerHtml }} />
      <main className="home-content">
        <Hero />
        {filterOpen && <div className="filter-overlay" onClick={() => setFilterOpen(false)} />}
        <FilterPanel open={filterOpen} onClose={() => setFilterOpen(false)} onApply={applyFilters} />
        <FiltersAndGallery />
        <BestSellers />
        <Carousel images={[carrusel1, carrusell2, carrusel3]} />
        <Help />
      </main>
      <div id="footer-root" dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </div>
  );
};

export default Home;