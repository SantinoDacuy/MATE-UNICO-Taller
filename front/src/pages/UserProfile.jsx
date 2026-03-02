import React, { useEffect, useState } from 'react'
import './UserProfile.css'

export default function UserProfile() {
  const [user, setUser] = useState(null)
  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', calle: '', numero: '', picture: '' })

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

  if (loading) return <div className="profile-container"><p>Cargando...</p></div>
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
    <div className="profile-container">
      <div className="profile-header">
        <img className="profile-avatar" src={user.picture || '/assets/default-avatar.png'} alt="avatar" />
        <div>
          <h2>{user.nombre} {user.apellido}</h2>
          <p>{user.email}</p>
          <p>Miembro desde {miembroDesde}</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => setEditing(s => !s)} className="btn-small">{editing ? 'Cancelar' : 'Editar perfil'}</button>
        </div>
      </div>

      {editing ? (
        <form className="profile-form" onSubmit={saveProfile}>
          <div className="form-row">
            <label>Nombre</label>
            <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Apellido</label>
            <input value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Teléfono</label>
            <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Calle</label>
            <input value={form.calle} onChange={e => setForm({ ...form, calle: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Número</label>
            <input value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} />
          </div>
          <div className="form-row">
            <label>URL foto</label>
            <input value={form.picture} onChange={e => setForm({ ...form, picture: e.target.value })} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      ) : null}

      <section className="profile-section">
        <h3>Historial de compra</h3>
        {ventas && ventas.length > 0 ? (
          <div className="ventas-list">
            {ventas.map(v => (
              <div key={v.id} className="venta-item">
                <strong>Pedido #{v.id}</strong>
                <div>Fecha: {v.fecha_venta ? new Date(v.fecha_venta).toLocaleDateString('es-AR') : '—'}</div>
                <div>Productos: {v.detalle || 'Ver detalles'}</div>
                <div>Estado: {v.estado || '—'}</div>
                <div>Total: ${v.total ? Number(v.total).toLocaleString('de-DE') : '—'}</div>
              </div>
            ))}
          </div>
        ) : (
          <p>No hay compras registradas.</p>
        )}
      </section>

      <section className="profile-section">
        <h3>Favoritos</h3>
        {user.favoritos && user.favoritos.length > 0 ? (
          <ul className="favoritos-list">
            {user.favoritos.map((f, idx) => (
              <li key={idx}>{f.nombre} — Color: {f.color}</li>
            ))}
          </ul>
        ) : (
          <div className="favoritos-grid">
            <div className="fav-item">Mate Imperial<br/>Color: Negro</div>
            <div className="fav-item">Mate Torpedo<br/>Color: Negro</div>
            <div className="fav-item">Mate Torpedo<br/>Color: Negro</div>
          </div>
        )}
      </section>
    </div>
  )
}
