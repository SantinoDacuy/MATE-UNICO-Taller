import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import './HistorialCompras.css';

export default function HistorialCompras() {
    const [searchParams] = useSearchParams();
    const ventaIdParam = searchParams.get('ventaId');
    const navigate = useNavigate();

    const [ventas, setVentas] = useState([]);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);

    const ventasRefs = useRef({});

    // Cargar productos desde Strapi
    useEffect(() => {
        fetch('http://localhost:1337/api/productos?populate=*')
            .then(res => res.json())
            .then(data => {
                if (data && data.data) {
                    setProductos(data.data);
                }
            })
            .catch(err => console.error("Error cargando productos de Strapi:", err));
    }, []);

    // Cargar ventas del backend
    useEffect(() => {
        const fetchVentas = async () => {
            try {
                const vres = await fetch('http://localhost:3001/api/user/me/ventas', { credentials: 'include' });
                if (vres.ok) {
                    const vdata = await vres.json();
                    if (vdata.success && Array.isArray(vdata.ventas)) {
                        setVentas(vdata.ventas);
                    }
                } else {
                    navigate('/login');
                }
            } catch (err) {
                console.error("Error fetching ventas:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchVentas();
    }, [navigate]);

    // Scroll automático si hay param
    useEffect(() => {
        if (ventaIdParam && ventas.length > 0 && !loading) {
            const timer = setTimeout(() => {
                const ventaElement = ventasRefs.current[ventaIdParam];
                if (ventaElement) {
                    ventaElement.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start' 
                    });
                    // Highlight temporal
                    ventaElement.style.transition = 'background-color 0.3s ease';
                    ventaElement.style.backgroundColor = '#fffacd';
                    setTimeout(() => {
                        ventaElement.style.backgroundColor = '#fff';
                    }, 2000);
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [ventaIdParam, ventas, loading]);

    // Helpers
    const getProductDetails = (nombreProducto) => {
        const prod = productos.find(p => p.nombre?.toLowerCase() === nombreProducto?.toLowerCase());
        if (prod) {
            return {
                nombre: prod.nombre,
                material: prod.material,
                documentId: prod.documentId,
                imageUrl: prod.imagenes && prod.imagenes.length > 0 ? `http://localhost:1337${prod.imagenes[0].url}` : '/assets/default-placeholder.png'
            };
        }
        return { 
            nombre: nombreProducto || 'Producto Desconocido', 
            material: 'Sin especificar', 
            documentId: '', 
            imageUrl: '/assets/default-placeholder.png' 
        };
    };

    const getEstadoStyles = (estado) => {
        const est = estado ? estado.trim() : '';
        switch (est) {
            case 'Entregado':
            case 'Confirmado':
                return { backgroundColor: '#d4edda', color: '#155724' }; // Green
            case 'En camino':
            case 'Despachado':
            case 'Preparando':
                return { backgroundColor: '#fff3cd', color: '#856404' }; // Yellow/Orange
            case 'Rechazado':
            case 'Cancelado':
                return { backgroundColor: '#f8d7da', color: '#721c24' }; // Red
            case 'Pendiente':
            default:
                return { backgroundColor: '#cce5ff', color: '#004085' }; // Blue
        }
    };

    const formatFecha = (fechaString) => {
        if (!fechaString) return '';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(fechaString).toLocaleDateString('es-AR', options);
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando historial...</div>;

    return (
        <div className="historial-page">
            <div className="historial-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h1 className="historial-title">Historial de Compras</h1>
                    <button className="btn-volver" onClick={() => navigate('/perfil')}>
                        ← Volver al Perfil
                    </button>
                </div>
                
                {ventas.length === 0 ? (
                    <div className="empty-state">
                        <h2>No tienes compras realizadas</h2>
                        <p>Cuando realices compras aparecerán aquí.</p>
                        <button className="btn-volver" onClick={() => navigate('/perfil')} style={{marginTop: '15px'}}>Volver al perfil</button>
                    </div>
                ) : (
                    <div className="ventas-list">
                        {ventas.map((venta) => (
                            <div 
                                key={venta.id} 
                                className="venta-card" 
                                ref={(el) => (ventasRefs.current[venta.id] = el)}
                            >
                                <div className="venta-header">
                                    <div className="pedido-info">
                                        <h3>Pedido #{venta.id}</h3>
                                        <p>{formatFecha(venta.fecha_venta)}</p>
                                    </div>
                                    <div className="venta-estado-container" style={{ display: 'flex', gap: '10px' }}>
                                        <span className="estado-badge" style={getEstadoStyles(venta.estado)} title="Estado de Pago">
                                            Pago: {venta.estado}
                                        </span>
                                        {venta.estado_envio && (
                                            <span className="estado-badge" style={getEstadoStyles(venta.estado_envio)} title="Estado de Envío">
                                                Envío: {venta.estado_envio}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="venta-productos">
                                    {venta.detalle?.map((d, index) => {
                                        const prodDetails = getProductDetails(d.producto_nombre);
                                        return (
                                            <Link 
                                                key={index} 
                                                to={prodDetails.documentId ? `/producto/${prodDetails.documentId}` : '#'} 
                                                className="producto-item-link"
                                            >
                                                <div className="producto-imagen-container">
                                                    <img src={prodDetails.imageUrl} alt={prodDetails.nombre} />
                                                </div>
                                                <div className="producto-info">
                                                    <h4>{prodDetails.nombre}</h4>
                                                    <p>{prodDetails.material || 'Producto'}</p>
                                                    <p>Cantidad: {d.cantidad} u.</p>
                                                    <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>
                                                        Precio unitario: ${Number(d.precio_unitario || 0).toLocaleString('es-AR')}
                                                    </p>
                                                </div>
                                                <div className="producto-precio">
                                                    <p>${Number(d.subtotal || 0).toLocaleString('es-AR')}</p>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                                
                                <div className="venta-footer">
                                    <p style={{fontSize: '1.2rem', color: '#666', fontWeight:'bold'}}>Total:</p>
                                    <p className="total-amount">${Number(venta.total).toLocaleString('es-AR')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
