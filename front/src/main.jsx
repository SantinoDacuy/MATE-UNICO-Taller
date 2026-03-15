import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Cart badge sync: update any header badge based on localStorage and listen for updates
function updateCartBadge(count) {
  const el = document.getElementById('mu-cart-badge');
  if (!el) return;
  el.textContent = String(count);
  el.setAttribute('data-count', String(count));
}

function readCartCountFromStorage() {
  try {
    const raw = localStorage.getItem('mateUnicoCart') || localStorage.getItem('mu_cart_v1');
    if (!raw) return 0;
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return 0;
    return items.reduce((s, it) => s + (Number(it.cantidad) || 0), 0);
  } catch (e) { return 0; }
}

// initial update (may run before header is injected; retry a few times)
const initialCount = readCartCountFromStorage();
let attempts = 0;
const initBadgeInterval = setInterval(() => {
  updateCartBadge(initialCount);
  attempts += 1;
  if (attempts > 10) clearInterval(initBadgeInterval);
}, 300);

// listen for cart updates
window.addEventListener('cart:update', (e) => {
  const cnt = (e && e.detail && typeof e.detail.count === 'number') ? e.detail.count : readCartCountFromStorage();
  // animate badge when updating
  const el = document.getElementById('mu-cart-badge');
  updateCartBadge(cnt);
  if (el) {
    el.classList.remove('pulse');
    // force reflow
    void el.offsetWidth;
    el.classList.add('pulse');
  }
});

// Auth: check current user and update header UI
async function fetchCurrentUser() {
  try {
    const res = await fetch('http://localhost:3001/auth/me', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (e) { return null; }
}

function setProfileUI(user) {
  const nameEl = document.getElementById('mu-profile-name');
  const logoutBtn = document.getElementById('mu-logout-button');
  const profileLink = document.getElementById('mu-profile-link');
  if (!nameEl || !logoutBtn || !profileLink) return;
  if (user && user.loggedIn && user.user) {
    const u = user.user;
    const firstName = (u.nombre || '').split(' ')[0]; // Solo el primer nombre
    nameEl.textContent = firstName || u.email || 'Perfil';
    nameEl.style.color = 'var(--fg)';
    logoutBtn.style.display = 'inline-block';
    profileLink.href = '/perfil';
  } else {
    nameEl.textContent = 'Ingresar';
    nameEl.style.color = 'var(--muted)';
    logoutBtn.style.display = 'none';
    profileLink.href = '/login';
  }
}

// initialize auth UI (retry until header loaded)
let authAttempts = 0;
const authInterval = setInterval(async () => {
  const container = document.getElementById('mu-profile-area');
  if (!container && authAttempts < 12) { authAttempts += 1; return; }
  clearInterval(authInterval);
  const user = await fetchCurrentUser();
  setProfileUI(user);
  // attach logout handler
  const logoutBtn = document.getElementById('mu-logout-button');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('http://localhost:3001/auth/logout', { method: 'POST', credentials: 'include' });
      } catch (e) {
        // ignore
      }
      // clear client cart and update UI
      localStorage.removeItem('mu_cart_v1');
      localStorage.removeItem('mateUnicoCart');
      window.dispatchEvent(new CustomEvent('cart:update', { detail: { count: 0 } }));
      // reset profile
      setProfileUI(null);
      // reload to reflect auth state
      window.location.href = '/login';
    });
  }
}, 250);
