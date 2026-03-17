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
