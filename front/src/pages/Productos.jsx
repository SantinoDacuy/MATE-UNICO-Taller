import React, { useState, useEffect, useContext } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './Productos.css';

import imagenComodin from '../assets/camionero1.png';

const Productos = () => {
  const { totalItems } = useContext(CartContext);
  const location = useLocation();
  const navigate = useNavigate();

  // --- 1. ESTADOS PRINCIPALES ---
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const [orden, setOrden] = useState('recomendados');
  const [filtrosActivos, setFiltrosActivos] = useState([]);

  const [headerHtml, setHeaderHtml] = useState('');
  const [footerHtml, setFooterHtml] = useState('');

  // --- 2. EL MICRÓFONO: Escucha la URL apenas entrás ---
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const f = queryParams.get('f');
    const sort = queryParams.get('sort');

    // Si la URL trae filtros desde el Home, tildamos las cajitas automáticamente
    if (f) {
      setFiltrosActivos(f.split(',').map(item => item.trim()));
    } else {
      setFiltrosActivos([]); 
    }

    if (sort) setOrden(sort);
  }, [location.search]); // Se ejecuta cada vez que la URL cambia

  // --- 3. TRAER MATES DE STRAPI ---
  useEffect(() => {
    fetch('http://localhost:1337/api/productos?populate=*')
      .then((r) => r.json())
      .then((json) => {
        setProductos(json.data);
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error cargando productos:", err);
        setCargando(false);
      });
  }, []);

  // --- 4. MOTOR DE FILTRADO INTELIGENTE ---
  useEffect(() => {
    let resultado = [...productos];
    const queryParams = new URLSearchParams(location.search);
    const busquedaInicial = queryParams.get('q') || '';

    // A. Buscador de texto del Header
    if (busquedaInicial) {
      resultado = resultado.filter(prod => 
        prod.nombre.toLowerCase().includes(busquedaInicial.toLowerCase()) ||
        (prod.descripcion && prod.descripcion.toLowerCase().includes(busquedaInicial.toLowerCase()))
      );
    }

    // B. Checkboxes (Lee las cajitas que se tildaron solas o a mano)
    if (filtrosActivos.length > 0) {
      resultado = resultado.filter(prod => {
        const cumpleColor = 
          (filtrosActivos.includes('negro') && prod.color_negro === true) ||
          (filtrosActivos.includes('marron') && prod.color_marron === true) ||
          (filtrosActivos.includes('blanco') && prod.color_blanco === true) ||
          (filtrosActivos.includes('gris') && prod.color_gris === true);

        const cumpleCategoriaOMaterial = filtrosActivos.some(filtro => 
          prod.categoria === filtro || prod.material === filtro
        );

        const textoNombre = prod.nombre.toLowerCase();
        const cumpleNombre = filtrosActivos.some(filtro => textoNombre.includes(filtro));

        return cumpleColor || cumpleCategoriaOMaterial || cumpleNombre;
      });
    }

    // C. Ordenar
    switch (orden) {
      case 'precio-asc': resultado.sort((a, b) => a.precio - b.precio); break;
      case 'precio-desc': resultado.sort((a, b) => b.precio - a.precio); break;
      case 'a-z': resultado.sort((a, b) => a.nombre.localeCompare(b.nombre)); break;
      case 'z-a': resultado.sort((a, b) => b.nombre.localeCompare(a.nombre)); break;
      case 'mas-vendidos': resultado.sort((a, b) => a.id - b.id); break;
      default: break;
    }

    setProductosFiltrados(resultado);
  }, [productos, location.search, filtrosActivos, orden]);

  // --- 5. COMPONENTES VISUALES ---
  useEffect(() => {
    Promise.all([
      fetch('/src/components/header.html').then(r => r.text()).catch(() => ''),
      fetch('/src/components/footer.html').then(r => r.text()).catch(() => '')
    ]).then(([header, footer]) => {
      setHeaderHtml(header);
      setFooterHtml(footer);
    });

    if (!document.querySelector('link[href="/src/components/styles.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/src/components/styles.css';
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    const badge = document.getElementById('mu-cart-badge');
    if (badge) {
      badge.textContent = totalItems;
      badge.setAttribute('data-count', totalItems);
    }
    const btnFiltroHeader = document.getElementById('mu-filter-button');
    if (btnFiltroHeader) btnFiltroHeader.style.display = 'none';
  }, [totalItems, headerHtml]);

  // Manejador de cajitas si las tocan adentro del Catálogo
  const toggleFiltro = (valor) => {
    setFiltrosActivos(prev => 
      prev.includes(valor) ? prev.filter(f => f !== valor) : [...prev, valor]
    );
  };

  return (
    <div className="catalogo-page">
      <div id="header-root" dangerouslySetInnerHTML={{ __html: headerHtml }} />
      <div className="page-path" style={{paddingLeft: '50px', paddingTop: '20px'}}>Home &gt; Productos</div>

      <main className="catalogo-layout">
        
        {/* SIDEBAR DE FILTROS */}
        <aside className="catalogo-sidebar">
          <h3>Filtros</h3>
          
          <div className="filtro-grupo">
            <h4>Mate</h4>
            <div className="filtro-subgrupo">
              <h5>Calabaza</h5>
              <label><input type="checkbox" checked={filtrosActivos.includes('imperial')} onChange={() => toggleFiltro('imperial')} /> Imperial</label>
              <label><input type="checkbox" checked={filtrosActivos.includes('torpedo')} onChange={() => toggleFiltro('torpedo')} /> Torpedo</label>
              <label><input type="checkbox" checked={filtrosActivos.includes('camionero')} onChange={() => toggleFiltro('camionero')} /> Camionero</label>
            </div>
            <div className="filtro-subgrupo">
              <h5>Madera</h5>
              <label><input type="checkbox" checked={filtrosActivos.includes('madera imperial')} onChange={() => toggleFiltro('madera imperial')} /> Imperial</label>
              <label><input type="checkbox" checked={filtrosActivos.includes('madera torpedo')} onChange={() => toggleFiltro('madera torpedo')} /> Torpedo</label>
              <label><input type="checkbox" checked={filtrosActivos.includes('madera camionero')} onChange={() => toggleFiltro('madera camionero')} /> Camionero</label>
            </div>
            <div className="filtro-subgrupo">
              <h5>Metal</h5>
              <label><input type="checkbox" checked={filtrosActivos.includes('metal')} onChange={() => toggleFiltro('metal')} /> Metal</label>
            </div>
            <div className="filtro-subgrupo">
              <h5>Vidrio</h5>
              <label><input type="checkbox" checked={filtrosActivos.includes('vidrio')} onChange={() => toggleFiltro('vidrio')} /> Vidrio</label>
            </div>
          </div>

        <div className="filtro-grupo">
            <h4>Combos</h4>
            <label className="filtro-suelto">
              <input type="checkbox" checked={filtrosActivos.includes('combo_simple')} onChange={() => toggleFiltro('combo_simple')} /> 
              Mate + Bombilla
            </label>
            <label className="filtro-suelto">
              <input type="checkbox" checked={filtrosActivos.includes('combo_completo')} onChange={() => toggleFiltro('combo_completo')} /> 
              Mate + Bombilla + Bolso
            </label>
          </div>

          <div className="filtro-grupo">
            <h4>Colores</h4>
            <div className="colores-grid">
              <label className="color-option"><input type="checkbox" checked={filtrosActivos.includes('negro')} onChange={() => toggleFiltro('negro')} /><span className="color-circle" style={{backgroundColor: '#000'}}></span> Negro</label>
              <label className="color-option"><input type="checkbox" checked={filtrosActivos.includes('marron')} onChange={() => toggleFiltro('marron')} /><span className="color-circle" style={{backgroundColor: '#8B4513'}}></span> Marrón</label>
              <label className="color-option"><input type="checkbox" checked={filtrosActivos.includes('blanco')} onChange={() => toggleFiltro('blanco')} /><span className="color-circle" style={{backgroundColor: '#fff', border: '1px solid #ccc'}}></span> Blanco</label>
              <label className="color-option"><input type="checkbox" checked={filtrosActivos.includes('gris')} onChange={() => toggleFiltro('gris')} /><span className="color-circle" style={{backgroundColor: '#808080'}}></span> Gris</label>
            </div>
          </div>

          {/* Botón para limpiar */}
          {filtrosActivos.length > 0 && (
            <button 
              onClick={() => {
                setFiltrosActivos([]);
                navigate('/productos'); // Limpia la URL también
              }}
              style={{
                width: '100%', marginTop: '15px', padding: '12px',
                backgroundColor: '#f5f5f5', border: '1px solid #ddd',
                borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
                color: '#d32f2f', transition: 'background 0.2s'
              }}
            >
              Quitar Filtros ✕
            </button>
          )}
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <section className="catalogo-contenido">
          <div className="catalogo-top-bar">
            <div>
              {new URLSearchParams(location.search).get('q') ? <h2>Resultados para "{new URLSearchParams(location.search).get('q')}"</h2> : <h2>Todos los Productos</h2>}
              <p className="resultados-count">{productosFiltrados.length} productos encontrados</p>
            </div>
            
            <div className="ordenar-caja">
              <label>Ordenar por:</label>
              <select value={orden} onChange={(e) => setOrden(e.target.value)}>
                <option value="recomendados">Recomendados</option>
                <option value="mas-vendidos">Más Vendidos</option>
                <option value="precio-asc">Precio: Menor a Mayor</option>
                <option value="precio-desc">Precio: Mayor a Menor</option>
                <option value="a-z">Alfabéticamente: A-Z</option>
                <option value="z-a">Alfabéticamente: Z-A</option>
              </select>
            </div>
          </div>

          {cargando ? (
            <div className="loading-state"><h2>Calentando el agua... 🧉</h2></div>
          ) : productosFiltrados.length === 0 ? (
            <div className="empty-state">
              <h2>No encontramos mates con esos filtros 😥</h2>
              <button className="btn-reset" onClick={() => {setFiltrosActivos([]); navigate('/productos');}}>Limpiar Filtros</button>
            </div>
          ) : (
            <div className="grid-productos">
              {productosFiltrados.map((prod) => (
                <Link to={`/producto/${prod.documentId}`} key={prod.id} className="card-producto">
                  <div className="card-img-wrapper">
                    <img 
                      src={prod.imagenes && prod.imagenes.length > 0 ? `http://localhost:1337${prod.imagenes[0].url}` : imagenComodin} 
                      alt={prod.nombre} 
                    />
                  </div>
                  <div className="card-info">
                    <h3>{prod.nombre}</h3>
                    <span className="card-precio">${prod.precio.toLocaleString('es-AR')}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </main>
      <div id="footer-root" dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </div>
  );
};

export default Productos;