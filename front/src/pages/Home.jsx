import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
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

import { useRef } from 'react';

const Hero = () => (
  <section className="hero">
    <div className="hero-left">
      <div className="hero-image-container">
        <img 
          src={heroImg} 
          alt="Mate Único" 
          className="hero-image"
        />
      </div>
    </div>
    <div className="hero-right">
      <h1>¡Bienvenidos a nuestra Tienda de Mates!</h1>
      <p>Descubrí un espacio pensado para los amantes del mate. Acá vas a encontrar mates de todo tipo, bombillas, bolsos y accesorios de calidad, ideales para acompañar cada momento de tu día. Queremos que disfrutes de la tradición con estilo y comodidad.</p>
      <button className="cta">Ver ahora</button>
    </div>
  </section>
);

// Temporarily hide the filters panel — render only the gallery.
const FiltersAndGallery = () => (
  <section className="filters-gallery no-filters">
    <div className="gallery fullwidth">
        <div className="gallery-row">
        <div className="product left"><img src={seller1} alt="Mate Izq" /></div>
        <div className="product center featured">
          <div className="badge"><span>Nuevo</span><span>Ingreso</span></div>
          <img src={seller2} alt="Mate Destacado" />
        </div>
        <div className="product right"><img src={seller3} alt="Mate Der" /></div>
      </div>
      <div className="gallery-actions">
        <button className="ver-mas" aria-label="Ver más productos">Ver Más</button>
      </div>
    </div>
  </section>
);


const BestSellers = () => {
  const items = [
    { name: 'Camionero Classic', price: '17.500', img: seller1 },
    { name: 'Camionero Premium', price: '27.000', img: seller2 },
    { name: 'Camionero Pro', price: '19.900', img: seller3 }
  ];

  return (
    <section className="best-sellers">
      <div className="best-sellers-info">
        <h2>Vea nuestros más vendidos</h2>
        <p>Estos son los productos que se ganaron el corazón de nuestros clientes. Perfectos para acompañarte en cualquier momento del día. Anímate a probar los más elegidos de la tienda.</p>
        <button className="ver-mas-button">Ver Más</button>
      </div>
      <div className="best-sellers-list">
        {items.map((it, idx) => (
          <div className="seller-card" key={idx}>
            <img src={it.img} alt={it.name} />
            <div className="seller-meta"><span className="name">{it.name}</span><span className="price">${it.price}</span></div>
          </div>
        ))}
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

  useEffect(() => {
    // load header/footer fragments from /src/components
    Promise.all([
      fetch('/src/components/header.html').then(r => r.text()).catch(() => ''),
      fetch('/src/components/footer.html').then(r => r.text()).catch(() => '')
    ]).then(([header, footer]) => {
      setHeaderHtml(header);
      setFooterHtml(footer);
    });

    // ensure styles for components are loaded
    if (!document.querySelector('link[href="/src/components/styles.css"]')) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = '/src/components/styles.css';
      document.head.appendChild(l);
    }
  }, []);

  // watch header-root for insertion of header content and inject filter button
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
    // attempt immediately in case content already there
    insertButton();
    return () => observer.disconnect();
  }, []);

  // keep the filter button visible even after open/close
  useEffect(() => {
    const btn = document.getElementById('mu-filter-button');
    if (btn) btn.style.display = 'inline-block';
  }, [filterOpen]);

  // check user login status and update header
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/user/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.loggedIn && data.user) {
            // Update profile name in header
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

    // Wait for header to load, then check user status
    const container = document.getElementById('header-root');
    if (container && container.innerHTML) {
      checkUserStatus();
    } else {
      // If header not loaded yet, wait for it
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
  }, [headerHtml]); // Re-run when headerHtml changes

  const applyFilters = (filters) => {
    console.log('Filtros aplicados:', filters);
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