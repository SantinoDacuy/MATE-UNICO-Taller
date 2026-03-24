import React, { useState, useEffect, useContext } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import './Productos.css';

import imagenComodin from '../assets/camionero1.png';

const Productos = () => {
  const { totalItems } = useContext(CartContext);
  const location = useLocation();
  const navigate = useNavigate();

  // --- ESTADOS PRINCIPALES ---
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [orden, setOrden] = useState('recomendados');
  const [filtrosActivos, setFiltrosActivos] = useState([]);


  // --- EL MICRÓFONO: Escucha la URL apenas entrás ---
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const f = queryParams.get('f');
    const sort = queryParams.get('sort');

    if (f) {
      setFiltrosActivos(f.split(',').map(item => item.trim()));
    } else {
      setFiltrosActivos([]); 
    }

    if (sort) setOrden(sort);
  }, [location.search]); 

  // --- TRAER MATES DE STRAPI ---
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

  // --- MOTOR DE FILTRADO INTELIGENTE (Versión EMBUDO ESTRICTO PERFECCIONADO) ---
  useEffect(() => {
    let resultado = [...productos];
    const queryParams = new URLSearchParams(location.search);
    const busquedaInicial = queryParams.get('q') || '';

    // A. Buscador de texto
    if (busquedaInicial) {
      resultado = resultado.filter(prod => 
        prod.nombre.toLowerCase().includes(busquedaInicial.toLowerCase()) ||
        (prod.descripcion && prod.descripcion.toLowerCase().includes(busquedaInicial.toLowerCase()))
      );
    }

    // B. Checkboxes (Lógica de Embudo Estricto / AND)
    if (filtrosActivos.length > 0) {
      // Separamos los filtros activos en grupos
      const coloresActivos = filtrosActivos.filter(f => ['negro', 'marron', 'blanco', 'gris'].includes(f));
      const matesActivos = filtrosActivos.filter(f => [
        'calabaza-imperial', 'calabaza-torpedo', 'calabaza-camionero',
        'madera-imperial', 'madera-torpedo', 'madera-camionero',
        'metal', 'vidrio'
      ].includes(f));
      const combosActivos = filtrosActivos.filter(f => ['combo_simple', 'combo_completo'].includes(f));

      resultado = resultado.filter(prod => {
        let pasaColor = true;
        let pasaMate = true;
        let pasaCombo = true;

        if (coloresActivos.length > 0) {
          pasaColor = coloresActivos.some(color => {
            if (color === 'negro') return prod.color_negro === true;
            if (color === 'marron') return prod.color_marron === true;
            if (color === 'blanco') return prod.color_blanco === true;
            if (color === 'gris') return prod.color_gris === true;
            return false;
          });
        }

        if (matesActivos.length > 0) {
          pasaMate = matesActivos.some(filtro => {
            if (filtro === 'calabaza-imperial') return prod.material === 'calabaza' && prod.modelo === 'imperial';
            if (filtro === 'calabaza-torpedo') return prod.material === 'calabaza' && prod.modelo === 'torpedo';
            if (filtro === 'calabaza-camionero') return prod.material === 'calabaza' && prod.modelo === 'camionero';
            
            if (filtro === 'madera-imperial') return prod.material === 'madera' && prod.modelo === 'imperial';
            if (filtro === 'madera-torpedo') return prod.material === 'madera' && prod.modelo === 'torpedo';
            if (filtro === 'madera-camionero') return prod.material === 'madera' && prod.modelo === 'camionero';
            
            if (filtro === 'metal') return prod.material === 'metal';
            if (filtro === 'vidrio') return prod.material === 'vidrio';
            return false;
          });
        }

        // ACÁ ESTÁ LA NUEVA MAGIA PARA LOS COMBOS
        if (combosActivos.length > 0) {
          pasaCombo = combosActivos.some(filtro => {
            if (filtro === 'combo_simple') return prod.categoria === 'combo_simple';
            if (filtro === 'combo_completo') return prod.categoria === 'combo_completo';
            return false;
          });
        } else if (matesActivos.length > 0) {
          // Si eligió un tipo de mate pero NO eligió combo, ocultamos los combos obligatoriamente
          pasaCombo = prod.categoria !== 'combo_simple' && prod.categoria !== 'combo_completo';
        }

        // Tiene que pasar todas las pruebas activas
        return pasaColor && pasaMate && pasaCombo;
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

  const toggleFiltro = (valor) => {
    setFiltrosActivos(prev => 
      prev.includes(valor) ? prev.filter(f => f !== valor) : [...prev, valor]
    );
  };

  return (
    <div className="catalogo-page">
      <div className="page-path" style={{paddingLeft: '50px', paddingTop: '20px'}}>Home &gt; Productos</div>

      <main className="catalogo-layout">
        
        {/* SIDEBAR DE FILTROS */}
        <aside className="catalogo-sidebar">
          <h3>Filtros</h3>
          
          <div className="filtro-grupo">
            <h4>Mate</h4>
            
            {/* GRUPO CALABAZA */}
            <div className="filtro-subgrupo">
              <h5>Calabaza</h5>
              <label><input type="checkbox" checked={filtrosActivos.includes('calabaza-imperial')} onChange={() => toggleFiltro('calabaza-imperial')} /> Imperial</label>
              <label><input type="checkbox" checked={filtrosActivos.includes('calabaza-torpedo')} onChange={() => toggleFiltro('calabaza-torpedo')} /> Torpedo</label>
              <label><input type="checkbox" checked={filtrosActivos.includes('calabaza-camionero')} onChange={() => toggleFiltro('calabaza-camionero')} /> Camionero</label>
            </div>
            
            {/* GRUPO MADERA */}
            <div className="filtro-subgrupo">
              <h5>Madera</h5>
              <label><input type="checkbox" checked={filtrosActivos.includes('madera-imperial')} onChange={() => toggleFiltro('madera-imperial')} /> Imperial</label>
              <label><input type="checkbox" checked={filtrosActivos.includes('madera-torpedo')} onChange={() => toggleFiltro('madera-torpedo')} /> Torpedo</label>
              <label><input type="checkbox" checked={filtrosActivos.includes('madera-camionero')} onChange={() => toggleFiltro('madera-camionero')} /> Camionero</label>
            </div>
            
            {/* OTROS */}
            <div className="filtro-subgrupo">
              <h5>Metal</h5>
              <label><input type="checkbox" checked={filtrosActivos.includes('metal')} onChange={() => toggleFiltro('metal')} /> Metal</label>
            </div>
            <div className="filtro-subgrupo">
              <h5>Vidrio</h5>
              <label><input type="checkbox" checked={filtrosActivos.includes('vidrio')} onChange={() => toggleFiltro('vidrio')} /> Vidrio</label>
            </div>
          </div>

          {/* COMBOS */}
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

          {/* COLORES */}
          <div className="filtro-grupo">
            <h4>Colores</h4>
            <div className="colores-grid">
              <label className="color-option"><input type="checkbox" checked={filtrosActivos.includes('negro')} onChange={() => toggleFiltro('negro')} /><span className="color-circle" style={{backgroundColor: '#000'}}></span> Negro</label>
              <label className="color-option"><input type="checkbox" checked={filtrosActivos.includes('marron')} onChange={() => toggleFiltro('marron')} /><span className="color-circle" style={{backgroundColor: '#8B4513'}}></span> Marrón</label>
              <label className="color-option"><input type="checkbox" checked={filtrosActivos.includes('blanco')} onChange={() => toggleFiltro('blanco')} /><span className="color-circle" style={{backgroundColor: '#fff', border: '1px solid #ccc'}}></span> Blanco</label>
              <label className="color-option"><input type="checkbox" checked={filtrosActivos.includes('gris')} onChange={() => toggleFiltro('gris')} /><span className="color-circle" style={{backgroundColor: '#808080'}}></span> Gris</label>
            </div>
          </div>

          {filtrosActivos.length > 0 && (
            <button 
              onClick={() => {
                setFiltrosActivos([]);
                navigate('/productos'); 
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
    </div>
  );
};

export default Productos;