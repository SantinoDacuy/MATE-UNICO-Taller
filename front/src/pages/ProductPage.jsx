import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; 
import { Heart } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import ReviewsSection from '../components/ReviewsSection';
import Toast from '../components/Toast';
import Breadcrumbs from '../components/Breadcrumbs';
import './ProductPage.css';

import camionero1 from '../assets/camionero1.png'; 
import camionero2 from '../assets/camionero2.png';
import camionero3 from '../assets/camionero3.png';
import camionero4 from '../assets/camionero4.png';

const ProductPage = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  
  const [quantity, setQuantity] = useState(1);
  const [grabado, setGrabado] = useState(''); 
  const [grabadoConfirmado, setGrabadoConfirmado] = useState(false); // NUEVO: Controla si ya apretó el botón
  
  const [availableColors, setAvailableColors] = useState([]);
  const [selectedColor, setSelectedColor] = useState(''); 
  


  const { addToCart, totalItems } = useContext(CartContext);

  const [isFavorite, setIsFavorite] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [toastData, setToastData] = useState({ message: '', type: 'info', visible: false });

  const showToast = (msg, type = 'info') => setToastData({ message: msg, type, visible: true });
  const closeToast = () => setToastData({ ...toastData, visible: false });

  const FAVORITES_STORAGE_KEY = 'mateUnicoFavorites';

  const loadFavorites = () => {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  };

  const saveFavorites = (items) => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('No se pudo guardar favoritos localmente', e);
    }
  };

  const normalizeProductKey = (prod) => {
    if (!prod) return null;
    return String(prod.documentId || prod.id || id || '').trim();
  };

  // --- LÓGICA DE PRECIOS BLINDADA ---
  const PRECIO_GRABADO = 3000;
  
  // Usamos Number() para obligar a JS a sumar matemáticamente y no pegar textos
  const precioBase = producto ? Number(producto.precio) : 0;
  
  // Solo sumamos los $3000 si el mate admite grabado Y el usuario ya hizo clic en "Agregar"
  const precioUnitario = (producto?.grabado && grabadoConfirmado) ? precioBase + PRECIO_GRABADO : precioBase;
  const precioTotal = precioUnitario * quantity;

  // Efecto para verificar si el usuario está logeado se consolida más abajo

  // TRAER LA INFO DEL PRODUCTO DESDE STRAPI
  useEffect(() => {
    fetch(`http://localhost:1337/api/productos/${id}?populate=*`)
      .then((respuesta) => respuesta.json())
      .then((json) => {
        const prod = json.data;
        setProducto(prod);
        
        const colores = [];
        if (prod.color_negro) colores.push('Negro');
        if (prod.color_marron) colores.push('Marrón');
        if (prod.color_blanco) colores.push('Blanco');
        if (prod.color_gris) colores.push('Gris');
        
        setAvailableColors(colores);
        
        if (colores.length > 0) {
          setSelectedColor(colores[0]);
        } else {
          setSelectedColor('Único'); 
        }

        setCargando(false);
      })
      .catch((error) => {
        console.error("Error al traer el mate:", error);
        setCargando(false);
      });
  }, [id]);

  // Mantener estado favorito sincronizado verificando backend primero y luego fallback local
  useEffect(() => {
    if (!producto) return;
    const currentProductKey = normalizeProductKey(producto);
    
    const fetchUserAndFavorites = async () => {
      let isFav = false;
      try {
        const res = await fetch('http://localhost:3001/api/user/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
            if (data && data.loggedIn && data.user) {
            setIsUserLoggedIn(true);
            const favsApi = data.user.favoritos || [];
            saveFavorites(favsApi); // Sincronizamos siempre, incluso si es vacío, para no resucitar
            
            isFav = favsApi.some((p) => String(p.id) === currentProductKey || String(p.documentId) === currentProductKey);
          } else {
            setIsUserLoggedIn(false);
          }
        }
      } catch (err) {
        console.warn('Error al verificar sesión/favoritos:', err);
      }

      if (!isFav) {
        // Fallback a localStorage si falló API o no está en API
        const favoritos = loadFavorites();
        isFav = favoritos.some((p) => String(p.documentId) === currentProductKey || String(p.id) === currentProductKey);
      }
      
      setIsFavorite(isFav);
    };

    fetchUserAndFavorites();
  }, [producto]);

  // Productos similares random (se recarga cuando cambia el producto)
  useEffect(() => {
    if (!producto) return;

    fetch('http://localhost:1337/api/productos?populate=*')
      .then((respuesta) => respuesta.json())
      .then((json) => {
        const all = Array.isArray(json.data) ? json.data : [];
        const currentIdStr = normalizeProductKey(producto);

        const candidates = all.filter((p) => String(p.documentId || p.id || '').trim() !== currentIdStr);
        const shuffled = candidates.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 4);

        setSimilarProducts(selected);
      })
      .catch((error) => {
        console.error('Error al cargar productos similares:', error);
      });
  }, [producto]);

  // Cuando cambia el producto, vamos al inicio de la página
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!producto) return;
    const idCurrent = normalizeProductKey(producto);
    const favoritos = loadFavorites();

    const isNowFavorite = !isFavorite;
    let updated = [];

    if (isNowFavorite) {
      updated = [
        ...favoritos.filter((p) => String(p.documentId) !== idCurrent),
        {
          id: idCurrent,
          documentId: idCurrent,
          nombre: producto.nombre || 'Sin nombre',
          color: selectedColor || 'Único',
          imagen: producto.imagenes && producto.imagenes.length > 0 ? `http://localhost:1337${producto.imagenes[0].url}` : ''
        }
      ];
      showToast('¡Agregado a favoritos!', 'success');
    } else {
      updated = favoritos.filter((p) => String(p.documentId) !== idCurrent && String(p.id) !== idCurrent);
      showToast('Quitado de favoritos', 'info');
    }

    saveFavorites(updated);
    setIsFavorite(isNowFavorite);

    try {
      await fetch('http://localhost:3001/api/user/favoritos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: idCurrent, nombre: producto.nombre || 'Sin nombre', color: selectedColor || 'Único' })
      });
    } catch (e) {
      // Si falla la API de favoritos, no bloqueamos la experiencia.
    }
  };

  const handleAddToCart = () => {
    // Si escribió algo pero se olvidó de tocar "Agregar", le avisamos!
    if (producto.grabado && grabado.trim() !== '' && !grabadoConfirmado) {
      showToast("⚠️ Escribiste un grabado pero no tocaste el botón 'Agregar'. Confírmalo antes de añadir al carrito.", 'warning');
      return;
    }

    // Validar disponibilidad de stock
    const stockDisponible = producto.stock || 0;
    if (stockDisponible <= 0) {
      showToast("Lo sentimos, este producto está sin stock en este momento.", 'error');
      return;
    }
    
    if (quantity > stockDisponible) {
      showToast(`Stock limitado. Solo hay ${stockDisponible} unidades disponibles.`, 'warning');
      setQuantity(stockDisponible);
      return;
    }

    const textoGrabado = (producto.grabado && grabadoConfirmado) ? grabado.trim() : '';
    
    const productoParaCarrito = {
      ...producto,
      precio: precioUnitario
    };

    addToCart(productoParaCarrito, quantity, selectedColor, textoGrabado);
    showToast(`¡Mate agregado al carrito!\nTotal: $${precioTotal.toLocaleString('es-AR')}`, 'success');
  };

  if (cargando) return <div style={{textAlign: 'center', marginTop: '100px'}}><h2>Calentando el agua para tu mate... 🧉</h2></div>;
  if (!producto) return <div style={{textAlign: 'center', marginTop: '100px'}}><h2>Mate no encontrado 😥</h2></div>;

  return (
    <div className="page-wrapper">

      <main className="main-content">
        <Breadcrumbs customLastSegment={producto.nombre} />

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
            <div className="product-title-row">
              <h1>{producto.nombre}</h1>
              <button
                className="wishlist-btn"
                onClick={handleToggleFavorite}
                aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              >
                <Heart size={28} fill={isFavorite ? "#ff0000" : "none"} color={isFavorite ? "#ff0000" : "#333"} strokeWidth={2} />
              </button>
            </div>

            {/* STOCK ALERT */}
            {producto.stock !== undefined && (
              <>
                {producto.stock < 3 && producto.stock > 0 && (
                  <div style={{
                    backgroundColor: '#fef5f0',
                    borderLeft: '4px solid #ff9800',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    marginBottom: '20px',
                    marginTop: '16px',
                    color: '#ff9800',
                    fontSize: '14px',
                    fontWeight: '600',
                    letterSpacing: '0.3px'
                  }}>
                    Últimas unidades disponibles ({producto.stock})
                  </div>
                )}
                {producto.stock >= 3 && (
                  <div style={{
                    backgroundColor: '#f9f9f9',
                    borderLeft: '4px solid #999',
                    paddingLeft: '16px',
                    paddingRight: '16px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    marginBottom: '20px',
                    marginTop: '16px',
                    color: '#999',
                    fontSize: '14px',
                    fontWeight: '500',
                    letterSpacing: '0.3px'
                  }}>
                    {producto.stock} unidades disponibles
                  </div>
                )}
              </>
            )}

            <p className="description">
              {producto.descripcion}
            </p>

            <div className="selectors">
              <div className="selector-group">
                <label>Cantidad {producto.stock !== undefined && producto.stock > 0 && `(Disponibles: ${producto.stock})`}</label>
                <div className="qty-input">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                  <span>{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(quantity + 1, producto.stock || 1))}>+</button>
                </div>
              </div>
              
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

            {/* --- SECCIÓN DE GRABADO --- */}
            {producto.grabado && (
              <div className="engraving-section" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <input 
                    type="text" 
                    placeholder="Añadir Grabado (+$3.000) (Ej: Iniciales)" 
                    value={grabado}
                    maxLength={15}
                    onChange={(e) => {
                      setGrabado(e.target.value);
                      setGrabadoConfirmado(false); // Si edita el texto, le pedimos que vuelva a confirmar
                    }}
                    style={{ width: '100%', height: '42px', boxSizing: 'border-box' }}
                  />
                  <span style={{ 
                    fontSize: '11px', 
                    color: grabado.length === 15 ? '#d32f2f' : '#888', 
                    marginTop: '4px', 
                    textAlign: 'right',
                    fontWeight: grabado.length === 15 ? 'bold' : 'normal'
                  }}>
                    {grabado.length}/15 caracteres
                  </span>
                </div>
                <button 
                  className="btn-dark-small" 
                  onClick={() => {
                    if (grabado.trim() === '') {
                      showToast("Por favor, escribí lo que querés grabar antes de confirmar.", 'warning');
                      return;
                    }
                    setGrabadoConfirmado(true);
                    showToast(`Grabado "${grabado}" confirmado (+ $3.000).`, 'success');
                  }}
                  style={{ 
                    flexShrink: 0, 
                    height: '42px', 
                    padding: '0 20px', 
                    whiteSpace: 'nowrap',
                    backgroundColor: grabadoConfirmado ? '#2e7d32' : '#1a1a1a' // Se pone verde si ya confirmó
                  }}
                >
                  {grabadoConfirmado ? '✓ Confirmado' : 'Agregar'}
                </button>
              </div>
            )}

            <button 
              className="btn-primary-block" 
              onClick={handleAddToCart}
              disabled={(producto?.stock ?? 0) <= 0}
              style={{
                opacity: (producto?.stock ?? 0) <= 0 ? '0.6' : '1',
                cursor: (producto?.stock ?? 0) <= 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {(producto?.stock ?? 0) <= 0 
                ? 'Sin Stock' 
                : `Añadir al carrito - $${precioTotal.toLocaleString('es-AR')}`
              }
            </button>
          </div>
        </section>

        <section className="reviews-section">
          <ReviewsSection productId={id} productType="producto" />
        </section>

        <section className="similar-products">
          <h2>Ver <br/> Productos <br/> similares</h2>
          <div className="products-carousel">
            {similarProducts.length === 0 ? (
              <div className="product-card">
                <div className="product-placeholder" style={{ padding: '15px', textAlign: 'center' }}>
                  Cargando productos similares...
                </div>
              </div>
            ) : (
              similarProducts.map((item) => {
                const itemId = item.documentId || item.id;
                const itemImage = item.imagenes && item.imagenes.length > 0 ? `http://localhost:1337${item.imagenes[0].url}` : camionero1;

                return (
                  <div
                    key={itemId}
                    className="product-card"
                    onClick={() => navigate(`/producto/${itemId}`)}
                    role="button"
                    aria-label={`Ver ${item.nombre}`}
                  >
                    <div className="card-image-wrapper">
                      <img src={itemImage} alt={item.nombre || 'Mate similar'} />
                      <div className="card-overlay">
                        <span className="card-view-more">Ver detalle</span>
                      </div>
                    </div>
                    <div className="card-info">
                      <span className="card-product-name">{item.nombre || 'Producto sin nombre'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
      <Toast 
        message={toastData.message} 
        type={toastData.type} 
        visible={toastData.visible} 
        onClose={closeToast} 
      />
    </div>
  );
};

export default ProductPage;