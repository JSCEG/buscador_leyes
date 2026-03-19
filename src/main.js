import './styles/index.css';

// Import Search Engine Logic
import { initSearch } from './scripts/search-engine.js';
import { initUI } from './scripts/ui.js';

document.addEventListener('DOMContentLoaded', () => {
  initUI();
  initSearch();
});

// En desarrollo: recarga la página completa cuando cambie ui.js o search-engine.js
// para que los event listeners siempre usen la versión más reciente del código.
if (import.meta.hot) {
  import.meta.hot.accept(['./scripts/ui.js', './scripts/search-engine.js'], () => {
    import.meta.hot.invalidate();
  });
}

// ── Service Worker ────────────────────────────────────────────────────────────
// __BUILD_TIME__ es reemplazado por Vite en cada build (ver vite.config.js →
// define). Pasarlo como query string al SW garantiza que un nuevo deploy
// fuerza al browser a descargar el nuevo SW, que a su vez limpia cachés viejos.
if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`/sw.js?v=${__BUILD_TIME__}`)
      .then((reg) => {
        console.log('[SW] Registrado:', reg.scope);
        // Comprueba si hay una actualización disponible inmediatamente
        reg.update();
      })
      .catch((err) => console.warn('[SW] Registro fallido:', err));
  });
}
