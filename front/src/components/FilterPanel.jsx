import React, { useState } from 'react';
import './FilterPanel.css';

const FilterPanel = ({ open, onClose, onApply }) => {
  const [filtrosActivos, setFiltrosActivos] = useState([]);

  const toggleFiltro = (valor) => {
    setFiltrosActivos(prev => 
      prev.includes(valor) ? prev.filter(f => f !== valor) : [...prev, valor]
    );
  };

  const handleApply = () => {
    // ACÁ ESTÁ LA MAGIA: Le pasamos la lista de palabras directo al Home
    onApply(filtrosActivos); 
  };

  return (
    <div className={`filter-panel ${open ? 'open' : ''}`} aria-hidden={!open}>
      <button className="close-btn" onClick={onClose} aria-label="Cerrar filtros">×</button>
      <h2 className="filter-title">Filtrar productos</h2>

      <div className="catalogo-sidebar-mobile">
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
      </div>

      <div className="filter-actions" style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
        <button className="apply-btn" onClick={handleApply}>
          Ver Resultados
        </button>
        
        {filtrosActivos.length > 0 && (
          <button 
            className="clear-btn" 
            onClick={() => setFiltrosActivos([])}
          >
            Limpiar Filtros
          </button>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;