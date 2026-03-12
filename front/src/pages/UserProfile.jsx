import React, { useEffect, useState } from 'react'
import './UserProfile.css'
import { useHeaderFooter } from '../hooks/useHeaderFooter'

export default function UserProfile() {
  const [user, setUser] = useState(null)
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', calle: '', numero: '', picture: '' })
  
  const { headerHtml, footerHtml, isLoading: headerLoading } = useHeaderFooter()

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('http://localhost:3001/api/user/me', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (data.loggedIn) {
            setUser(data.user)
            setForm({
              nombre: data.user.nombre || '',
              apellido: data.user.apellido || '',
              telefono: data.user.telefono || '',
              calle: data.user.calle || '',
              numero: data.user.numero || '',
              picture: data.user.picture || ''
            })
          }
        }

        const vres = await fetch('http://localhost:3001/api/user/me/ventas', { credentials: 'include' })
        if (vres.ok) {
          const vdata = await vres.json()
          if (vdata.success) setVentas(vdata.ventas || [])
        }
      } catch (e) {
        console.error('Error loading profile:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading || headerLoading) return (
    <div className="profile-page">
      <div id="header-root" dangerouslySetInnerHTML={{ __html: headerHtml }} />
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Cargando tu perfil...</p>
      </div>
      <div id="footer-root" dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </div>
  )
  if (!user) return <div className="profile-container"><p>No estás logueado.</p></div>

  const miembroDesde = user.fecha_registro ? new Date(user.fecha_registro).toLocaleDateString('es-AR') : (user.miembroDesde || '27/02/2025')

  async function saveProfile(e) {
    e.preventDefault()
    try {
      const res = await fetch('http://localhost:3001/api/user/me', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        setEditing(false)
        const refreshed = await fetch('http://localhost:3001/api/user/me', { credentials: 'include' })
        if (refreshed.ok) {
          const d = await refreshed.json()
          if (d.loggedIn) setUser(d.user)
        }
      } else {
        alert('No se pudo guardar. Intenta nuevamente.')
      }
    } catch (err) {
      console.error('Save error', err)
      alert('Error guardando los cambios')
    }
  }

  return (
    <div className="profile-page">
      <div id="header-root" dangerouslySetInnerHTML={{ __html: headerHtml }} />

      <div className="profile-container">

        {/* COLUMNA IZQUIERDA: Info y Actividad */}
        <aside className="left-column">
          <section className="user-info">
            <h1>Perfil</h1>
            <div className="profile-pic-container">
              <img
                src={user.picture || '/assets/default-avatar.png'}
                alt={user.nombre || "Usuario"}
                className="profile-pic-circle"
              />
            </div>
            <h2 className="user-name">{user.nombre} {user.apellido}</h2>
            <p className="user-email">{user.email}</p>
            <p className="user-bio">
              Nos alegra tenerte en nuestra comunidad de amantes del mate. <br />
              Miembro desde {miembroDesde}.
            </p>
          </section>

          <hr className="divider" />

          <section className="history-section">
            <h3>Historial de compra</h3>
            {ventas && ventas.length > 0 ? (
              ventas.map((venta, index) => (
                <div key={venta.id || index} className="order-item">
                  <p><strong>Pedido #{venta.id}</strong></p>
                  <p>Fecha: {venta.fecha_venta ? new Date(venta.fecha_venta).toLocaleDateString('es-AR') : '—'}</p>
                  <p>Productos: {venta.detalle && venta.detalle.length > 0
                    ? venta.detalle.map(d => d.producto ?
                        (d.producto.material ? `${d.producto.material} ${d.producto.color}` : d.producto.descripcion || 'Producto')
                        : 'Producto').join(', ')
                    : 'Ver detalles'}</p>
                  <p>Estado: {venta.estado || 'Pendiente'}</p>
                  <p>Total: ${venta.total ? Number(venta.total).toLocaleString('de-DE') : '—'}</p>
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
            {user.favoritos && user.favoritos.length > 0 ? (
              user.favoritos.map((fav, i) => (
                <div key={i} className="favorite-card">
                  <img src="/assets/mate-placeholder.jpg" alt="Mate" className="fav-thumb" />
                  <div className="fav-info">
                    <h4>{fav.nombre || 'Producto'}</h4>
                    <p>Color: {fav.color || 'N/A'}</p>
                  </div>
                  <svg className="heart-icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
              ))
            ) : (
              <>
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="favorite-card">
                    <img src="/assets/mate-placeholder.jpg" alt="Mate" className="fav-thumb" />
                    <div className="fav-info">
                      <h4>Mate Imperial</h4>
                      <p>Color: Negro</p>
                    </div>
                    <svg className="heart-icon" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </div>
                ))}
              </>
            )}
          </section>
        </aside>

        {/* COLUMNA DERECHA: Formulario */}
        <main className="right-column">
          <h2 className="form-title">Modificar Información</h2>

          <form className="edit-form" onSubmit={saveProfile}>
            <div className="form-grid">
              <div className="input-group">
                <label>Nombre</label>
                <input
                  type="text"
                  value={user.nombre || ''}
                  disabled
                  placeholder="Tu nombre"
                />
              </div>
              <div className="input-group">
                <label>Apellido</label>
                <input
                  type="text"
                  value={user.apellido || ''}
                  disabled
                  placeholder="Tu apellido"
                />
              </div>
            </div>

            <div className="input-group">
              <label>Correo Electrónico</label>
              <input
                type="email"
                value={user.email || ''}
                disabled
                placeholder="Tu email"
              />
            </div>

            <div className="input-group">
              <label>Dirección</label>
              <input
                type="text"
                value={form.calle}
                onChange={e => setForm({ ...form, calle: e.target.value })}
                placeholder="Tu dirección"
              />
            </div>

            <div className="input-group">
              <label>Código Postal</label>
              <input
                type="text"
                value={form.numero}
                onChange={e => setForm({ ...form, numero: e.target.value })}
                placeholder="Tu código postal"
              />
            </div>

            <div className="input-group">
              <label>Teléfono</label>
              <input
                type="text"
                value={form.telefono}
                onChange={e => setForm({ ...form, telefono: e.target.value })}
                placeholder="Tu teléfono"
              />
            </div>

            <button type="submit" className="btn-save">Guardar Cambios</button>
          </form>
        </main>
      </div>

      <div id="footer-root" dangerouslySetInnerHTML={{ __html: footerHtml }} />
    </div>
  )
}
