import React, { useState, useEffect } from 'react';
import './FilterPanel.css';

const FilterPanel = ({ open, onClose, onApply }) => {
  const [category, setCategory] = useState('');
  const [comboOption, setComboOption] = useState('');
  const [mateMaterial, setMateMaterial] = useState('');
  const [calabazaType, setCalabazaType] = useState('');

  // reset dependent fields when category changes
  useEffect(() => {
    setComboOption('');
    setMateMaterial('');
    setCalabazaType('');
  }, [category]);

  // reset type when mateMaterial changes
  useEffect(() => {
    if (mateMaterial !== 'calabaza') {
      setCalabazaType('');
    }
  }, [mateMaterial]);

  const handleApply = () => {
    onApply({ category, comboOption, mateMaterial, calabazaType });
    onClose();
  };

  return (
    <div className={`filter-panel ${open ? 'open' : ''}`} aria-hidden={!open}>
      <button className="close-btn" onClick={onClose} aria-label="Cerrar filtros">×</button>
      <h2 className="filter-title">Filtrar productos</h2>

      <div className="filter-group">
        <label htmlFor="f-category">¿Qué buscas?</label>
        <select
          id="f-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">-- Seleccione --</option>
          <option value="mate">Mate</option>
          <option value="combo">Combo</option>
        </select>
      </div>

      {category === 'combo' && (
        <div className="filter-group">
          <label htmlFor="f-combo">Tipo de combo</label>
          <select
            id="f-combo"
            value={comboOption}
            onChange={(e) => setComboOption(e.target.value)}
          >
            <option value="">-- Seleccione --</option>
            <option value="bombilla">Mate + bombilla</option>
            <option value="mate-bombilla-bolso">Mate + bombilla + bolso</option>
          </select>
        </div>
      )}

      {category === 'mate' && (
        <>
          <div className="filter-group">
            <label htmlFor="f-material">Material del mate</label>
            <select
              id="f-material"
              value={mateMaterial}
              onChange={(e) => setMateMaterial(e.target.value)}
            >
              <option value="">-- Seleccione --</option>
              <option value="calabaza">Calabaza</option>
              <option value="metal">Metal</option>
              <option value="madera">Madera</option>
              <option value="vidrio">Vidrio</option>
            </select>
          </div>

          {mateMaterial === 'calabaza' && (
            <div className="filter-group">
              <label htmlFor="f-calabaza">Tipo de calabaza</label>
              <select
                id="f-calabaza"
                value={calabazaType}
                onChange={(e) => setCalabazaType(e.target.value)}
              >
                <option value="">-- Seleccione --</option>
                <option value="imperial">Imperial</option>
                <option value="torpedo">Torpedo</option>
                <option value="camionero">Camionero</option>
              </select>
            </div>
          )}
        </>
      )}

      <div className="filter-actions">
        <button
          className="apply-btn"
          onClick={handleApply}
          disabled={!category} /* permit aplicar tan pronto como se elija categoria */
        >
          Aplicar filtro
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
