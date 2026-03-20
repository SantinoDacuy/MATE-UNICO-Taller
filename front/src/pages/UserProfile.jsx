import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';

export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', calle: '', numero: '', picture: '' });
  
  const [headerHtml, setHeaderHtml] = useState('');
  const [footerHtml, setFooterHtml] = useState('');

  // =========================================================
  // 1. CARGAMOS EL DISEÑO (Header y Footer)
  // =========================================================
  useEffect(() => {
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

  // =========================================================
  // 2. EL CEREBRO BLINDADO PARA EL PERFIL (Trae datos reales)
  // =========================================================
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
              picture: data.user.picture || ''
            });

            // Ponemos el nombre en el Header
            const profileNameEl = document.getElementById('mu-profile-name');
            if (profileNameEl) profileNameEl.textContent = (data.user.nombre || 'Usuario').split(' ')[0];

            // Activamos el botón de cerrar sesión
            const btnLogout = document.getElementById('mu-logout-button');
            if (btnLogout) {
              btnLogout.style.display = 'block';
              btnLogout.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try { 
                  await fetch('http://localhost:3001/auth/logout', { method: 'POST', credentials: 'include' }); 
                } catch(err) {}
                localStorage.removeItem('google_token');
                window.location.replace('/'); 
              };
            }
          } else {
             // Si res.ok es true pero no está logueado (por si acaso)
             setLoading(false);
             return;
          }
        }

        // Traemos las compras
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

  // =========================================================
  // 3. ACTUALIZAR NUMERITO DEL CARRITO
  // =========================================================
  useEffect(() => {
    // Si necesitas el numerito en el perfil, tenés que importar el CartContext, 
    // pero como en tu código original no lo pedías, lo dejo comentado como recordatorio.
    /*
    const timer = setTimeout(() => {
      const badge = document.getElementById('mu-cart-badge');
      if (badge) {
        badge.textContent = totalItems;
        badge.setAttribute('data-count', totalItems);
      }
    }, 50);
    return () => clearTimeout(timer);
    */
  }, [headerHtml]);

  async function saveProfile(e) {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/user/me', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) alert('¡Cambios guardados con éxito!');
    } catch (err) {
      alert('Error guardando los cambios');
    }
  }

  // --- RENDERIZADOS ---
  if (loading || !headerHtml) {
    return (
      <div className="profile-page">
        <div id="header-root" dangerouslySetInnerHTML={{ __html: headerHtml }} />
        <div className="loading-container" style={{textAlign: 'center', padding: '100px 0'}}>
          <div className="loading-spinner"></div>
          <p className="loading-text">Cargando tu perfil...</p>
        </div>
        <div id="footer-root" dangerouslySetInnerHTML={{ __html: footerHtml }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div id="header-root" dangerouslySetInnerHTML={{ __html: headerHtml }} />
        <div style={{textAlign: 'center', padding: '100px 0', minHeight: '60vh'}}>
          <h2>No estás logueado.</h2>
          <button onClick={() => navigate('/login')} style={{padding: '10px 20px', background: '#000', color: '#fff', cursor: 'pointer', marginTop: '20px', borderRadius: '5px'}}>
            Ir al Login
          </button>
        </div>
        <div id="footer-root" dangerouslySetInnerHTML={{ __html: footerHtml }} />
      </div>
    );
  }

  const miembroDesde = user?.fecha_registro ? new Date(user.fecha_registro).toLocaleDateString('es-AR') : '27/02/2025';

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
            <h2 className="user-name">{user?.nombre || 'Sin Nombre'} {user?.apellido || ''}</h2>
            <p className="user-email">{user?.email || 'Sin email'}</p>
            <p className="user-bio">Miembro desde {miembroDesde}.</p>
          </section>

          <hr className="divider" />

          <section className="history-section">
            <h3>Historial de compra</h3>
            {Array.isArray(ventas) && ventas.length > 0 ? (
              ventas.map((venta, index) => (
                <div key={venta?.id || index} className="order-item">
                  <p><strong>Pedido #{venta?.id || 'Desconocido'}</strong></p>
                  <p>Estado: {venta?.estado || 'Pendiente'}</p>
                  <p>Total: ${venta?.total ? Number(venta.total).toLocaleString('es-AR') : '0'}</p>
                  <hr className="sub-divider" />
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No hay compras registradas aún.</p>
                <small>¡Empieza a comprar para ver tu historial aquí!</small>
              </div>
            )}
          </section>

          <section className="favorites-section">
            <h3>Favoritos</h3>
            {Array.isArray(user?.favoritos) && user.favoritos.length > 0 ? (
              user.favoritos.map((fav, i) => (
                <div key={i} className="favorite-card">
                  <div className="fav-info">
                    <h4>{fav?.nombre || 'Producto'}</h4>
                    <p>Color: {fav?.color || 'N/A'}</p>
                  </div>
                </div>
              ))
            ) : (
              <p style={{fontSize: '14px', color: '#666'}}>Todavía no agregaste mates a favoritos.</p>
            )}
          </section>
        </aside>

        <main className="right-column">
          <h2 className="form-title">Modificar Información</h2>
          <form className="edit-form" onSubmit={saveProfile}>
            <div className="form-grid">
              <div className="input-group">
                <label>Nombre</label>
                <input type="text" value={user?.nombre || ''} disabled />
              </div>
              <div className="input-group">
                <label>Apellido</label>
                <input type="text" value={user?.apellido || ''} disabled />
              </div>
            </div>
            <div className="input-group">
              <label>Correo Electrónico</label>
              <input type="email" value={user?.email || ''} disabled />
            </div>
            <div className="input-group">
              <label>Dirección</label>
              <input type="text" value={form.calle} onChange={e => setForm({ ...form, calle: e.target.value })} placeholder="Ej: Av. San Martín 123" />
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