import './styles/index.css';

// Import Search Engine Logic
import { initSearch } from './scripts/search-engine.js';
import { initUI } from './scripts/ui.js';

document.addEventListener('DOMContentLoaded', () => {
  initUI();
  initSearch();
});
