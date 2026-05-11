import './styles/index.css';

// Import Search Engine Logic
import { initSearch } from './scripts/search-engine.js';
import { initUI } from './scripts/ui.js';
import { initAdminIngest } from './scripts/admin-ingest.js';
import { initAuth } from './scripts/auth.js';

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  initUI();
  initSearch();
  initAdminIngest();

  // Setup Admin Nav Clicks (injecting directly into UI's existing navigation flow)
  const navAdminBtn = document.getElementById('nav-admin');
  const mobileNavAdminBtn = document.getElementById('mobile-nav-admin');

  const showAdminView = () => {
      document.getElementById('hero-section').classList.add('hidden');
      document.getElementById('global-search-wrapper').classList.add('hidden');
      document.getElementById('results-container').classList.add('hidden');
      document.getElementById('law-detail-container').classList.add('hidden');
      document.getElementById('analisis-container').classList.add('hidden');
      document.getElementById('quick-filters')?.classList.add('hidden');
      document.getElementById('stats-minimal')?.classList.add('hidden');
      
      const adminContainer = document.getElementById('admin-ingest-container');
      adminContainer.classList.remove('hidden');
      setTimeout(() => adminContainer.classList.remove('opacity-0'), 50);
  };

  if (navAdminBtn) {
      navAdminBtn.addEventListener('click', (e) => {
          e.preventDefault();
          showAdminView();
      });
  }

  if (mobileNavAdminBtn) {
      mobileNavAdminBtn.addEventListener('click', (e) => {
          e.preventDefault();
          showAdminView();
          // Hide mobile menu overlay if present (assuming ID from ui.js)
          const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
          if(mobileMenuOverlay) mobileMenuOverlay.classList.add('hidden');
      });
  }

  // Hook up "Inicio" links to also hide the admin view
  const navInicioBtn = document.getElementById('nav-inicio');
  const mobileNavInicioBtn = document.getElementById('mobile-nav-inicio');
  
  const hideAdminView = () => {
      document.getElementById('admin-ingest-container').classList.add('opacity-0');
      setTimeout(() => {
          document.getElementById('admin-ingest-container').classList.add('hidden');
      }, 500);
  };

  if (navInicioBtn) navInicioBtn.addEventListener('click', hideAdminView);
  if (mobileNavInicioBtn) mobileNavInicioBtn.addEventListener('click', hideAdminView);
});

// En desarrollo: recarga la página completa cuando cambie ui.js o search-engine.js
// para que los event listeners siempre usen la versión más reciente del código.
if (import.meta.hot) {
  import.meta.hot.accept(['./scripts/ui.js', './scripts/search-engine.js', './scripts/admin-ingest.js'], () => {
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
