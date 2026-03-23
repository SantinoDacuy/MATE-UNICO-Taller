import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './UserProfile.css';

export default function UserProfile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados para la API de Georef (Provincias y Municipios)
    const [provincias, setProvincias] = useState([]);
    const [municipios, setMunicipios] = useState([]);

    const [form, setForm] = useState({
        nombre: '',
        apellido: '',
        telefono: '',
        calle: '',
        numero: '',
        provincia: '',
        ciudad: '',
        picture: ''
    });

    const [headerHtml, setHeaderHtml] = useState('');
    const [footerHtml, setFooterHtml] = useState('');

    // 1. CARGAMOS DISEÑO Y PROVINCIAS
    useEffect(() => {
        fetch('https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre')
            .then(res => res.json())
            .then(data => {
                setProvincias(data.provincias.sort((a, b) => a.nombre.localeCompare(b.nombre)));
            })
            .catch(err => console.error("Error provincias:", err));

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

    // 2. CARGAR MUNICIPIOS
    useEffect(() => {
        if (form.provincia) {
            fetch(`https://apis.datos.gob.ar/georef/api/municipios?provincia=${form.provincia}&max=500&campos=id,nombre`)
                .then(res => res.json())
                .then(data => {
                    setMunicipios(data.municipios.sort((a, b) => a.nombre.localeCompare(b.nombre)));
                })
                .catch(err => console.error("Error municipios:", err));
        } else {
            setMunicipios([]);
        }
    }, [form.provincia]);

    // 3. CARGAR DATOS USUARIO
    useEffect(() => {
        if (!headerHtml) return;

        const timer = setTimeout(async () => {
            try {
                const res = await fetch('http://localhost:3001/api/user/me', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    if (data.loggedIn && data.user) {
                        setUser(data.user);
                        setForm({
                            nombre: data.user.nombre || '',
                            apellido: data.user.apellido || '',
                            telefono: data.user.telefono || '',
                            calle: data.user.calle || '',
                            numero: data.user.numero || '',
                            provincia: data.user.provincia || '',
                            ciudad: data.user.ciudad || '',
                            picture: data.user.picture || ''
                        });

                        const profileNameEl = document.getElementById('mu-profile-name');
                        if (profileNameEl) profileNameEl.textContent = "Perfil";

                        const btnLogout = document.getElementById('mu-logout-button');
                        if (btnLogout) {
                            btnLogout.style.display = 'block';
                            btnLogout.onclick = async (e) => {
                                e.preventDefault();
                                try { await fetch('http://localhost:3001/auth/logout', { method: 'POST', credentials: 'include' }); } catch (err) { }
                                localStorage.removeItem('google_token');
                                window.location.replace('/');
                            };
                        }
                    }
                }

                const vres = await fetch('http://localhost:3001/api/user/me/ventas', { credentials: 'include' });
                if (vres.ok) {
                    const vdata = await vres.json();
                    if (vdata.success && Array.isArray(vdata.ventas)) setVentas(vdata.ventas);
                }
            } catch (e) {
                console.error('Error loading profile:', e);
            } finally {
                setLoading(false);
            }
        }, 50);
        return () => clearTimeout(timer);
    }, [headerHtml, navigate]);

    async function saveProfile(e) {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3001/api/user/me', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) alert('¡Información actualizada! 🧉');
        } catch (err) { alert('Error al guardar'); }
    }

    if (loading || !headerHtml) return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando...</div>;

    const miembroDesde = user?.fecha_registro ? new Date(user.fecha_registro).toLocaleDateString('es-AR') : '27/02/2026';

    return (
        <div className="profile-page">
            <div id="header-root" dangerouslySetInnerHTML={{ __html: headerHtml }} />
            <div className="profile-container">
                <aside className="left-column">
                    <section className="user-info">
                        <h1>Perfil</h1>
                        <div className="profile-pic-container">
                            <img src={user?.picture || '/assets/default-avatar.png'} alt="Usuario" className="profile-pic-circle" />
                        </div>
                        <h2 className="user-name">{user?.nombre} {user?.apellido}</h2>
                        <p className="user-email">{user?.email}</p>
                        <p className="user-bio">Miembro desde {miembroDesde}.</p>
                    </section>
                    <hr className="divider" />
                    <section className="history-section">
                        <h3>Historial de compra</h3>
                        {ventas.length > 0 ? (
                            ventas.map((v) => (
                                <div key={v.id} className="order-item">
                                    <p><strong>Pedido #{v.id}</strong> - {v.estado}</p>
                                    <div className="order-details">
                                        {v.detalle?.map((d, i) => (
                                            <Link key={i} to={`/producto/${d.id_producto}`} className="order-product-link" style={{ display: 'block', fontSize: '13px', color: '#555', marginTop: '5px' }}>
                                                • {d.producto?.material || 'Producto'} ({d.cantidad} u.) - Ver mate
                                            </Link>
                                        ))}
                                    </div>
                                    <p style={{ marginTop: '5px' }}>Total: ${Number(v.total).toLocaleString('es-AR')}</p>
                                    <hr className="sub-divider" />
                                </div>
                            ))
                        ) : <p className="empty-state">No hay compras aún.</p>}
                    </section>
                    <section className="favorites-section">
                        <h3>Favoritos</h3>
                        {user?.favoritos?.length > 0 ? (
                            user.favoritos.map((fav, i) => (
                                <div key={i} className="favorite-card">
                                    <h4>{fav.nombre}</h4>
                                    <p>{fav.color}</p>
                                </div>
                            ))
                        ) : <p style={{ fontSize: '14px', color: '#666' }}>No tenés favoritos guardados.</p>}
                    </section>
                </aside>
                <main className="right-column">
                    <h2 className="form-title">Datos Personales y Envío</h2>
                    <form className="edit-form" onSubmit={saveProfile}>
                        <div className="form-grid">
                            <div className="input-group">
                                <label>Nombre</label>
                                <input type="text" value={user?.nombre || ''} disabled style={{ backgroundColor: '#f9f9f9', cursor: 'not-allowed' }} />
                            </div>
                            <div className="input-group">
                                <label>Apellido</label>
                                <input type="text" value={user?.apellido || ''} disabled style={{ backgroundColor: '#f9f9f9', cursor: 'not-allowed' }} />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Correo Electrónico</label>
                            <input type="email" value={user?.email || ''} disabled style={{ backgroundColor: '#f9f9f9', cursor: 'not-allowed' }} />
                        </div>
                        <hr className="divider" style={{ margin: '20px 0' }} />
                        <div className="form-grid">
                            <div className="input-group">
                                <label>Calle</label>
                                <input type="text" value={form.calle} onChange={e => setForm({ ...form, calle: e.target.value })} placeholder="Ej: Av. Colón" />
                            </div>
                            <div className="input-group">
                                <label>Número</label>
                                <input type="text" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} placeholder="123" />
                            </div>
                        </div>
                        <div className="form-grid">
                            <div className="input-group">
                                <label>Provincia</label>
                                <select value={form.provincia} onChange={e => setForm({ ...form, provincia: e.target.value, ciudad: '' })}>
                                    <option value="">Seleccionar</option>
                                    {provincias.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Ciudad / Localidad</label>
                                <select value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })} disabled={!form.provincia}>
                                    <option value="">Seleccionar</option>
                                    {municipios.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Teléfono</label>
                            <input type="text" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="Ej: 11 1234 5678" />
                        </div>
                        <button type="submit" className="btn-save">Guardar Cambios</button>
                    </form>
                </main>
            </div>
            <div id="footer-root" dangerouslySetInnerHTML={{ __html: footerHtml }} />
        </div>
    );
}