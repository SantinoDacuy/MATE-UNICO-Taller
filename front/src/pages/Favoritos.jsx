import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Favoritos.css';

export default function Favoritos() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [productos, setProductos] = useState([]);

    // 1. Cargar productos desde Strapi para tener las fotos
    useEffect(() => {
        fetch('http://localhost:1337/api/productos?populate=*')
            .then(res => res.json())
            .then(data => {
                if (data && data.data) {
                    setProductos(data.data);
                }
            })
            .catch(err => console.error("Error al cargar productos:", err));
    }, []);

    // 2. Cargar usuario y favoritos
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/user/me', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.loggedIn && data.user) {
                        // Solo confiamos en la base de datos como fuente de la verdad para borrar correctamente
                        // y evitar que resuciten favoritos del cache cuando el arreglo está vacío.
                        data.user.favoritos = data.user.favoritos || [];
                        setUser(data.user);
                    } else {
                        navigate('/login');
                    }
                } else {
                    navigate('/login');
                }
            } catch (e) {
                console.error('Error loading profile:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [navigate]);

    if (loading) return <div className="favorites-loading">Cargando favoritos... 🧉</div>;

    // 3. Cruzar datos: Obtenemos la info completa del producto (con imagen) si existe
    const getProductDetails = (fav) => {
        const product = productos.find(p => String(p.documentId) === String(fav.id) || String(p.id) === String(fav.id));
        let imageUrl = '/assets/default-mate.png'; // Imagen por defecto
        let price = null;

        if (product) {
            price = product.precio;
            if (product.imagenes && product.imagenes.length > 0) {
                imageUrl = `http://localhost:1337${product.imagenes[0].url}`;
            }
        } else {
            // Fallback al localStorage si guardó la imagen ahí
            try {
                const localFavs = JSON.parse(localStorage.getItem('mateUnicoFavorites') || '[]');
                const localMatch = localFavs.find(p => String(p.id) === String(fav.id));
                if (localMatch && localMatch.imagen) {
                    imageUrl = localMatch.imagen;
                }
            } catch(e) {}
        }

        return { ...fav, product, imageUrl, price };
    };

    const handleRemoveFavorite = async (e, idToRemove) => {
        e.preventDefault(); // Evitamos que nos lleve al producto
        try {
            await fetch('http://localhost:3001/api/user/favoritos', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: idToRemove })
            });
            
            // Actualizar vista local
            setUser(prev => ({
                ...prev,
                favoritos: prev.favoritos.filter(f => String(f.id) !== String(idToRemove))
            }));

            // Sincronizar localStorage por las dudas
            const localFavs = JSON.parse(localStorage.getItem('mateUnicoFavorites') || '[]');
            const updated = localFavs.filter(f => String(f.id) !== String(idToRemove) && String(f.documentId) !== String(idToRemove));
            localStorage.setItem('mateUnicoFavorites', JSON.stringify(updated));

        } catch (e) {
            console.error('Error al quitar favorito:', e);
        }
    };

    const favoritesWithDetails = (user?.favoritos || []).map(getProductDetails);

    return (
        <div className="favoritos-page">
            <div className="favoritos-container">
                <div className="favoritos-header">
                    <h1>Mis Favoritos</h1>
                    <Link to="/perfil" className="back-link">← Volver al perfil</Link>
                </div>
                
                {favoritesWithDetails.length > 0 ? (
                    <div className="favoritos-grid">
                        {favoritesWithDetails.map((fav, index) => (
                            <Link to={`/producto/${fav.id}`} key={index} className="favoritos-card">
                                <div className="favoritos-img-container">
                                    <img src={fav.imageUrl} alt={fav.nombre} className="favoritos-img" />
                                </div>
                                <div className="favoritos-info">
                                    <div className="favoritos-title-row">
                                        <h3 className="favoritos-title">{fav.nombre}</h3>
                                        <button 
                                            className="favoritos-remove-btn" 
                                            onClick={(e) => handleRemoveFavorite(e, fav.id)}
                                            title="Quitar de favoritos"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <p className="favoritos-color">Color: {fav.color}</p>
                                    {fav.price && <p className="favoritos-price">${Number(fav.price).toLocaleString('es-AR')}</p>}
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="favoritos-empty">
                        <p>No tenés ningún mate guardado en tus favoritos todavía.</p>
                        <Link to="/productos" className="btn-explore">Explorar mates</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
