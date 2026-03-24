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

