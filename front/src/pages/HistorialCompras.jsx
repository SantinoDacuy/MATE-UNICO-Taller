import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import './HistorialCompras.css';

export default function HistorialCompras() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const ventaIdParam = searchParams.get('ventaId');
    
    const [user, setUser] = useState(null);
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productos, setProductos] = useState([]);
    
    // Crear refs para cada venta para el scroll automático
    const ventasRefs = useRef({});

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

    // 2. Cargar usuario y ventas
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/user/me', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.loggedIn && data.user) {
                        setUser(data.user);
                    } else {
                        navigate('/login');
                    }
                } else {
                    navigate('/login');
                }

                const vres = await fetch('http://localhost:3001/api/user/me/ventas', { credentials: 'include' });
                if (vres.ok) {
                    const vdata = await vres.json();
                    if (vdata.success && Array.isArray(vdata.ventas)) {
                        // Ordenar las ventas por fecha descendente (más recientes primero)
                        const sortedVentas = vdata.ventas.sort((a, b) => {
                            const dateA = new Date(a.fecha_venta || 0);
                            const dateB = new Date(b.fecha_venta || 0);
                            return dateB - dateA;
                        });
                        setVentas(sortedVentas);
                    }
                }
            } catch (e) {
                console.error('Error loading profile:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [navigate]);

    // 3. Scroll automático al pedido específico si viene desde el perfil
    useEffect(() => {
        if (ventaIdParam && ventas.length > 0 && !loading) {
            // Esperar un pequeño delay para asegurar que el DOM esté renderizado
            const timer = setTimeout(() => {
                const ventaElement = ventasRefs.current[ventaIdParam];
                if (ventaElement) {
                    ventaElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Añadir highlight visual temporal
                    ventaElement.style.backgroundColor = '#fffacd';
                    setTimeout(() => {
                        ventaElement.style.backgroundColor = '';
                    }, 2000);
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [ventaIdParam, ventas, loading]);

    // Helper para obtener detalles del producto
    const getProductDetails = (productoId) => {
        const product = productos.find(p => String(p.documentId) === String(productoId) || String(p.id) === String(productoId));
        let imageUrl = '/assets/default-mate.png';
        let nombre = 'Producto';
        let material = 'N/A';
        let precio = 0;
        let documentId = productoId; // fallback

        if (product) {
            nombre = product.nombre || product.material;
            material = product.material || 'N/A';
            precio = product.precio || 0; // ✅ Obtener el precio
            documentId = product.documentId; // Usar el documentId de Strapi
            if (product.imagenes && product.imagenes.length > 0) {
                imageUrl = `http://localhost:1337${product.imagenes[0].url}`;
            }
        }

        return { imageUrl, nombre, material, documentId, precio };
    };

    // Helper para formatear estado
    const getEstadoStyles = (estado) => {
        const estadoLower = (estado || '').toLowerCase();
        let backgroundColor = '#f0f0f0';
        let color = '#666';

        if (estadoLower.includes('entregado')) {
            backgroundColor = '#d4edda';
            color = '#155724';
        } else if (estadoLower.includes('camino')) {
            backgroundColor = '#fff3cd';
            color = '#856404';
        } else if (estadoLower.includes('pendiente')) {
            backgroundColor = '#cce5ff';
            color = '#004085';
        }

        return { backgroundColor, color };
    };

    // Helper para formatear fecha
    const formatFecha = (fechaString) => {
        if (!fechaString) return 'Fecha no disponible';
        const fecha = new Date(fechaString);
        return fecha.toLocaleDateString('es-AR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return <div className="historial-loading">Cargando historial de compras... 🧉</div>;
    }

    return (
        <div className="historial-page">
            <div className="historial-container">
                <div className="historial-header">
                    <Link to="/perfil" className="back-link">← Volver al perfil</Link>
                    <h1>Mi Historial de Compras</h1>
                    <p className="header-subtitle">Total de compras: {ventas.length}</p>
                </div>

                {ventas.length > 0 ? (
                    <div className="historial-content">
                        {ventas.map((venta) => (
                            <div 
                                key={venta.id} 
                                ref={(el) => {
                                    if (el) ventasRefs.current[venta.id] = el;
                                }}
                                className="venta-card"
                                style={{ 
                                    transition: 'background-color 0.3s ease'
                                }}
                            >
                                <div className="venta-header">
                                    <div className="pedido-info">
                                        <h3>Pedido #{venta.id}</h3>
                                        <p className="venta-fecha">{formatFecha(venta.fecha_venta)}</p>
                                    </div>
                                    <div className="venta-estado-container">
                                        <span 
                                            className="estado-badge"
                                            style={getEstadoStyles(venta.estado)}
                                        >
                                            {venta.estado || 'Pendiente'}
                                        </span>
                                    </div>
                                </div>

                                <div className="venta-productos">
                                    {venta.detalle && venta.detalle.length > 0 ? (
                                        venta.detalle.map((item, idx) => {
                                            const detalles = getProductDetails(item.id_producto);
                                            return (
                                                <Link
                                                    key={idx}
                                                    to={`/producto/${detalles.documentId}`}
                                                    className="producto-item"
                                                >
                                                    <div className="producto-imagen-container">
                                                        <img
                                                            src={detalles.imageUrl}
                                                            alt={detalles.nombre}
                                                            className="producto-imagen"
                                                        />
                                                    </div>
                                                    <div className="producto-info">
                                                        <h4>{detalles.nombre}</h4>
                                                        <p className="producto-material">{detalles.material}</p>
                                                        <p className="producto-cantidad">Cantidad: {item.cantidad} u.</p>
                                                    </div>
                                                    <div className="producto-precio">
                                                        <p>${Number(detalles.precio).toLocaleString('es-AR')}</p>
                                                    </div>
                                                </Link>
                                            );
                                        })
                                    ) : (
                                        <p className="sin-detalles">Sin detalles de productos</p>
                                    )}
                                </div>

                                <div className="venta-footer">
                                    <p className="total-label">Total:</p>
                                    <p className="total-amount">${Number(venta.total).toLocaleString('es-AR')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="historial-empty">
                        <div className="empty-state-content">
                            <p className="empty-icon">📦</p>
                            <p className="empty-message">No tienes compras registradas aún.</p>
                            <Link to="/productos" className="btn-continue-shopping">
                                Explorar productos
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
