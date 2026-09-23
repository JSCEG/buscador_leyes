import { searchArticles, searchCountsByLawId, getArticleById, getArticlesByLaw, getThemesByLawName, updateArticle } from './search-engine.js';
import { getTextPreview, highlightText, highlightHtml } from '../lib/article-preview.js';
import { renderAnalisisView } from './analisis.js';
import { openLawPresentationDeck, renderLawPresentationEmbed } from './law-presentation.js';
import { initReaderControls, readerControlsHtml } from './reader-controls.js';
import { mountReaderSource } from './reader-source-view.js';
import { renderAcervoView } from './acervo-view.js';
import { renderStatsView } from './stats-view.js';
import { renderSearchResults } from './search-results-view.js';
import { collectionIcon } from '../lib/collection-icons.js';
import '../styles/law-reader.css';
import { ACERVO_GROUPS, getAcervoGroup } from '../lib/acervo-model.js';
import { relatedDocumentLabel } from '../lib/related-document.js';
import { renderInstrumentTimeline } from './instrument-timeline-view.js';
import { isLoggedIn, getCurrentUser, onAuthChange, login, register, logout, dbGetFavorites, dbAddFavorite, dbRemoveFavorite, dbGetAllNotes, dbSaveNote, isAdmin } from './auth.js';

export function initUI() {
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results-container');
    const lawDetailContainer = document.getElementById('law-detail-container');
    const statsMinimal = document.getElementById('stats-minimal');
    const heroSection = document.getElementById('hero-section');
    const mainContainer = document.getElementById('main-container');
    const quickFilters = document.getElementById('quick-filters');
    const globalSearchWrapper = document.getElementById('global-search-wrapper');
    const featuresSection = document.getElementById('features-section');
    const detailModal = document.getElementById('detail-modal');
    const modalPanel = document.getElementById('modal-panel');
    const modalContent = document.getElementById('modal-content');
    const modalTitle = document.getElementById('modal-title');
    const modalLey = document.getElementById('modal-ley');
    const closeModal = document.getElementById('close-modal');
    const copyBtn = document.getElementById('copy-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const modalEditBtn = document.getElementById('modal-edit-btn');
    const readerControls = initReaderControls();
    const readerOriginal = document.getElementById('reader-original');
    const readerBody = document.getElementById('reader-body');
    document.getElementById('reader-settings-slot').innerHTML = readerControlsHtml();
    readerControls.sync();
    let readerSource = null;
    let readerMode = 'text';
    let readerOpenRequest = 0;
    let readerReturnFocus = null;
    const setReaderMode = mode => {
        readerMode = mode;
        readerBody.dataset.mode = mode;
        modalPanel.classList.toggle('reader-wide', mode === 'split');
        modalContent.classList.toggle('hidden', mode === 'original');
        readerOriginal.classList.toggle('hidden', mode === 'text');
        document.querySelectorAll('[data-reader-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.readerMode === mode)));
        if (mode !== 'text') readerSource?.open();
    };
    document.querySelectorAll('[data-reader-mode]').forEach(button => button.addEventListener('click', () => setReaderMode(button.dataset.readerMode)));
    const readerMedia = window.matchMedia?.('(min-width: 1000px)');
    readerMedia?.addEventListener('change', e => { if (!e.matches && readerMode === 'split') setReaderMode('text'); });
    const releaseReader = () => {
        readerOpenRequest++;
        readerSource?.destroy();
        readerSource = null;
        document.body.classList.remove('reader-modal-open');
    };

    // Nav elements
    const navInicio = document.getElementById('nav-inicio');
    const navLeyes = document.getElementById('nav-leyes');

    // Mobile Menu Elements
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');
    const mobileMenuDrawer = document.getElementById('mobile-menu-drawer');
    const closeMobileMenu = document.getElementById('close-mobile-menu');
    const mobileNavInicio = document.getElementById('mobile-nav-inicio');
    const mobileNavLeyes = document.getElementById('mobile-nav-leyes');

    // ── Auth DB caches (null = not loaded / user not logged in) ───────────────
    let dbFavoritesSet = null; // Set<string> when loaded
    let dbNotesMap = null;     // Map<string,string> when loaded
    let searchHistory = [];
    let openAuthModal = () => {};
    let closeAuthModal = () => {};

    // ── Modo oscuro global ─────────────────────────────────────────────────────
    let isDark = localStorage.getItem('app-dark-mode') === 'true';

    function applyGlobalDark(dark) {
        isDark = dark;
        localStorage.setItem('app-dark-mode', dark);
        document.documentElement.classList.toggle('dark-mode', dark);

        // Ensure global dark styles exist
        if (!document.getElementById('global-dark-style')) {
            const s = document.createElement('style');
            s.id = 'global-dark-style';
            s.innerHTML = `
                .dark-mode { background-color: #1E1E1E !important; color: #F4F6F8 !important; }
                .dark-mode body { background-color: #1E1E1E !important; color: #F4F6F8 !important; }
                .dark-mode header { background-color: rgba(30, 30, 30, 0.96) !important; border-bottom: 0 !important; backdrop-filter: blur(10px); box-shadow: 0 1px 0 rgba(214, 180, 106, 0.22) !important; }
                .dark-mode header::after { background: linear-gradient(90deg, #9B2247 0 58%, #A57F2C 58% 100%) !important; }
                .dark-mode footer { background-color: #171717 !important; border-top: 1px solid rgba(214, 180, 106, 0.25) !important; }
                
                .dark-mode .bg-white, 
                .dark-mode .bg-gray-50, 
                .dark-mode .bg-gray-100, 
                .dark-mode .bg-slate-50,
                .dark-mode .bg-white\\/70,
                .dark-mode .bg-white\\/80,
                .dark-mode .bg-white\\/95,
                .dark-mode .bg-gray-50\\/50,
                .dark-mode .bg-white.rounded-3xl,
                .dark-mode .atema-card,
                .dark-mode #modal-panel { 
                    background-color: #242424 !important; 
                    color: #F4F6F8 !important; 
                    border-color: rgba(229, 229, 229, 0.14) !important; 
                }

                .dark-mode .border-gray-100, 
                .dark-mode .border-gray-200 { border-color: rgba(229, 229, 229, 0.14) !important; }
                
                .dark-mode table { border-collapse: separate; border-spacing: 0; width: 100%; }
                .dark-mode thead tr { background-color: #7A1A38 !important; }
                .dark-mode table thead th { 
                    color: #FFFFFF !important; 
                    border-bottom: 2px solid #A57F2C !important; 
                    background-color: #7A1A38 !important;
                    font-weight: 800 !important;
                }
                .dark-mode table tbody tr { border-bottom: 1px solid rgba(229, 229, 229, 0.10) !important; transition: all 0.2s; }
                .dark-mode table tbody tr:hover { background-color: rgba(214, 180, 106, 0.06) !important; }
                .dark-mode table td { color: rgba(244, 246, 248, 0.86) !important; border-right: 1px solid rgba(229, 229, 229, 0.06); }

                .dark-mode #search-filters .bg-white { background-color: #242424 !important; border-color: rgba(214, 180, 106, 0.35) !important; }
                .dark-mode #search-input { background-color: #242424 !important; border: 1px solid rgba(214, 180, 106, 0.5) !important; color: #F4F6F8 !important; box-shadow: 0 0 0 4px rgba(165, 127, 44, 0.08) !important; }
                .dark-mode #search-input::placeholder { color: rgba(244, 246, 248, 0.45) !important; }
                
                .dark-mode mark { background-color: rgba(214, 180, 106, 0.24) !important; color: #F4F6F8 !important; border-bottom: 1px solid #D6B46A; }
                .dark-mode .text-guinda { color: #D6B46A !important; text-shadow: none !important; }
                .dark-mode .text-verde { color: #7FB1A6 !important; }
                .dark-mode .text-dorado { color: #D6B46A !important; }
                .dark-mode .bg-guinda { background-color: #9B2247 !important; }
                
                .dark-mode #detail-modal { background-color: rgba(0, 0, 0, 0.8) !important; backdrop-filter: blur(12px); }
                .dark-mode #modal-panel { border: 1px solid rgba(214, 180, 106, 0.22) !important; box-shadow: 0 20px 48px rgba(0, 0, 0, 0.38) !important; }
                
                .dark-mode #admin-dropzone { border-color: rgba(214, 180, 106, 0.35) !important; background-color: rgba(165, 127, 44, 0.08) !important; }
                .dark-mode #admin-dropzone h3 { color: #D6B46A !important; }
            `;
            document.head.appendChild(s);
        }

        // Update icons
        const moonIcons = document.querySelectorAll('#darkmode-icon-moon, #mobile-darkmode-moon');
        const sunIcons = document.querySelectorAll('#darkmode-icon-sun, #mobile-darkmode-sun');
        const label = document.getElementById('mobile-darkmode-label');
        moonIcons.forEach(el => el.classList.toggle('hidden', dark));
        sunIcons.forEach(el => el.classList.toggle('hidden', !dark));
        if (label) label.textContent = dark ? 'Modo claro' : 'Modo oscuro';
    }

    // Mobile Menu Logic
    function toggleMobileMenu(show) {
        if (!mobileMenuDrawer || !mobileMenuOverlay) return;

        if (show) {
            mobileMenuOverlay.classList.remove('hidden');
            // Force reflow
            void mobileMenuOverlay.offsetWidth;
            mobileMenuOverlay.classList.remove('opacity-0');
            mobileMenuDrawer.classList.remove('translate-x-full');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        } else {
            mobileMenuOverlay.classList.add('opacity-0');
            mobileMenuDrawer.classList.add('translate-x-full');
            document.body.style.overflow = ''; // Restore scrolling
            setTimeout(() => {
                mobileMenuOverlay.classList.add('hidden');
            }, 300);
        }
    }

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => toggleMobileMenu(true));
    if (closeMobileMenu) closeMobileMenu.addEventListener('click', () => toggleMobileMenu(false));
    if (mobileMenuOverlay) mobileMenuOverlay.addEventListener('click', () => toggleMobileMenu(false));

    // Mobile Nav Links
    if (mobileNavInicio) {
        mobileNavInicio.addEventListener('click', (e) => {
            e.preventDefault();
            resetToHero();
            toggleMobileMenu(false);
        });
    }

    if (mobileNavLeyes) {
        mobileNavLeyes.addEventListener('click', (e) => {
            e.preventDefault();
            showLawsView();
            toggleMobileMenu(false);
        });
    }



    // Initialize dark mode from saved preference
    applyGlobalDark(isDark);

    document.getElementById('darkmode-toggle')?.addEventListener('click', () => applyGlobalDark(!isDark));
    document.getElementById('mobile-darkmode-toggle')?.addEventListener('click', () => applyGlobalDark(!isDark));
    // ── Fin Modo Oscuro ────────────────────────────────────────────────────────

    // Mobile Menu Logic
    function toggleMobileMenu(show) {
        if (!mobileMenuDrawer || !mobileMenuOverlay) return;

        if (show) {
            mobileMenuOverlay.classList.remove('hidden');
            // Force reflow
            void mobileMenuOverlay.offsetWidth;
            mobileMenuOverlay.classList.remove('opacity-0');
            mobileMenuDrawer.classList.remove('translate-x-full');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        } else {
            mobileMenuOverlay.classList.add('opacity-0');
            mobileMenuDrawer.classList.add('translate-x-full');
            document.body.style.overflow = ''; // Restore scrolling
            setTimeout(() => {
                mobileMenuOverlay.classList.add('hidden');
            }, 300);
        }
    }

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => toggleMobileMenu(true));
    if (closeMobileMenu) closeMobileMenu.addEventListener('click', () => toggleMobileMenu(false));
    if (mobileMenuOverlay) mobileMenuOverlay.addEventListener('click', () => toggleMobileMenu(false));

    // Mobile Nav Links
    if (mobileNavInicio) {
        mobileNavInicio.addEventListener('click', (e) => {
            e.preventDefault();
            resetToHero();
            toggleMobileMenu(false);
        });
    }

    if (mobileNavLeyes) {
        mobileNavLeyes.addEventListener('click', (e) => {
            e.preventDefault();
            showLawsView();
            toggleMobileMenu(false);
        });
    }

    // Admin visibility logic
    const updateAdminVisibility = () => {
        const adminBtn = document.getElementById('nav-admin');
        const mobileAdminBtn = document.getElementById('mobile-nav-admin');
        const isUserAdmin = isAdmin();
        
        if (adminBtn) adminBtn.classList.toggle('hidden', !isUserAdmin);
        if (mobileAdminBtn) mobileAdminBtn.classList.toggle('hidden', !isUserAdmin);
    };

    onAuthChange(() => {
        updateAdminVisibility();
    });

    let cachedSummaries = [];
    let catalogLoaded = false;
    let activeNavId = 'nav-inicio';
    let acervoState = { query: '', group: 'all', sort: 'title', rowScroll: {}, scrollY: 0 };
    let acervoView = null;
    let statsView = null;
    let lawOutlineSync = null;
    let lawOutlineObserver = null;
    const formatLawDate = value => {
        if (!/^\d{4}-\d{2}-\d{2}/.test(String(value || ''))) return '';
        const date = new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
        return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
    };
    const safeHttpUrl = url => { try { const parsed = new URL(url); return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : ''; } catch { return ''; } };
    let acervoReturnFocusId = null;
    let lawOpenRequest = 0;
    let searchDebounceTimer = null;
    let searchRenderRequest = 0;
    let currentLawArticles = [];
    let cachedRelaciones = [];           // filas de ley_relaciones
    let relacionesPorAfectada = {};      // ley_id afectada -> [relaciones]

    const REL_TIPO_LABELS = {
        modifica: 'Modificado por',
        reforma: 'Reformado por',
        adiciona: 'Adicionado por',
        abroga: 'Abrogado por',
        sustituye: 'Sustituido por'
    };

    function indexRelaciones(relaciones) {
        cachedRelaciones = relaciones || [];
        relacionesPorAfectada = {};
        for (const rel of cachedRelaciones) {
            (relacionesPorAfectada[rel.ley_afectada_id] ||= []).push(rel);
        }
    }

    function summaryById(leyId) {
        return cachedSummaries.find(s => s.id === leyId) || null;
    }

    // Badge compacto para tarjetas de resultados: la ley de este artículo
    // tiene una modificación posterior cargada en el acervo.
    function buildRelacionBadge(leyId) {
        const rels = relacionesPorAfectada[leyId] || [];
        if (!rels.length) return '';
        const rel = rels[0];
        const nueva = summaryById(rel.ley_nueva_id);
        if (!nueva) return '';
        const label = REL_TIPO_LABELS[rel.tipo] || 'Modificado por';
        const fecha = rel.fecha || nueva.fecha_publicacion;
        const fechaTxt = fecha ? ` (${new Date(fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', timeZone: 'UTC' })})` : '';
        const ref = nueva.siglas || (nueva.titulo.length > 28 ? nueva.titulo.substring(0, 28) + '...' : nueva.titulo);
        return `
            <button class="rel-open-law inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-[9px] font-bold text-amber-700 hover:bg-amber-100 transition-colors uppercase tracking-wide w-fit"
                data-ley-id="${nueva.id}" title="${label}: ${nueva.titulo.replace(/"/g, '&quot;')}">
                <svg class="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                ${label}: ${ref}${fechaTxt}
            </button>`;
    }

    // Listener delegado para los badges de relaciones en resultados.
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.rel-open-law');
        if (!btn) return;
        e.stopPropagation();
        const summary = summaryById(btn.dataset.leyId);
        if (summary) openLawDetail(summary);
    });

    // Lógica de clasificación avanzada de instrumentos
    function classifyInstrument(s) {
        const otherType = { id: 'otros', label: 'Otros instrumentos', color: 'gris', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' };
        // Priorizar el campo 'tipo' si viene de la base de datos
        if (s.tipo) {
            const t = s.tipo.toLowerCase();
            if (t === 'otros') return otherType;
            if (t === 'ley') return { id: 'ley', label: 'Leyes Federales', color: 'guinda', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' };
            if (t === 'reglamento') return { id: 'reglamento', label: 'Reglamentos', color: 'verde', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' };
            if (t === 'acuerdo') return { id: 'acuerdo', label: 'Acuerdos', color: 'dorado', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' };
            if (t === 'decreto') return { id: 'decreto', label: 'Decretos', color: 'purple-700', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' };
            if (t === 'dacg') return { id: 'dacg', label: 'DACG\'s', color: 'blue-700', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' };
            if (t === 'nom') return { id: 'nom', label: 'NOMs', color: 'gris', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' };
            if (t === 'permiso') return { id: 'permiso', label: 'Permisos', color: 'cyan-700', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' };
            if (t === 'manual') return { id: 'manual', label: 'Manuales', color: 'slate-600', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' };
        }

        // Fallback a detección por texto en título
        const t = (s.titulo || '').toLowerCase();
        if (t.startsWith('ley ')) return { id: 'ley', label: 'Leyes', color: 'guinda', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' };
        if (t.startsWith('reglamento ')) return { id: 'reglamento', label: 'Reglamentos', color: 'verde', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' };
        if (t.includes('acuerdo')) return { id: 'acuerdo', label: 'Acuerdos', color: 'dorado', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' };
        if (t.includes('decreto')) return { id: 'decreto', label: 'Decretos', color: 'purple-700', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' };
        if (t.includes('disposiciones administrativas') || t.includes('dacg')) return { id: 'dacg', label: 'DACG\'s', color: 'blue-700', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' };
        if (t.includes('norma oficial') || t.includes('nom-')) return { id: 'nom', label: 'NOMs', color: 'gris', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' };
        return otherType;
    }

    function renderAcervoAnalytics(summaries) {
        const dashboard = document.getElementById('acervo-visual-dashboard');
        if (!dashboard) return;

        dashboard.classList.remove('hidden', 'opacity-0');
        dashboard.style.removeProperty('display');

        // 1. Data Processing
        const counts = summaries.reduce((acc, s) => {
            const type = classifyInstrument(s).id;
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        const total = summaries.length;
        const categories = [
            { id: 'ley', label: 'Leyes Federales', color: '#9B2247', count: counts['ley'] || 0 },
            { id: 'reglamento', label: 'Reglamentos', color: '#1E5B4F', count: counts['reglamento'] || 0 },
            { id: 'acuerdo', label: 'Acuerdos', color: '#A57F2C', count: counts['acuerdo'] || 0 },
            { id: 'dacg', label: 'DACG\'s', color: '#2563eb', count: counts['dacg'] || 0 },
            { id: 'nom', label: 'NOMs', color: '#7c3aed', count: counts['nom'] || 0 },
            { id: 'otros', label: 'Otros', color: '#64748b', count: (counts['decreto'] || 0) + (counts['permiso'] || 0) + (counts['manual'] || 0) + (counts['otros'] || 0) }
        ].filter(c => c.count > 0);

        // Update Total Display
        const totalDisplay = document.getElementById('total-count-display');
        if (totalDisplay) {
            let start = 0;
            const duration = 2000;
            const startTime = performance.now();
            const animateTotal = (now) => {
                const progress = Math.min((now - startTime) / duration, 1);
                const value = Math.floor(total * progress);
                totalDisplay.textContent = value;
                if (progress < 1) requestAnimationFrame(animateTotal);
            };
            requestAnimationFrame(animateTotal);
        }

        // 2. Render Legend
        const legendContainer = document.getElementById('analytics-legend');
        if (legendContainer) {
            legendContainer.innerHTML = categories.map(cat => `
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white transition-colors cursor-default">
                    <div class="w-2.5 h-2.5 rounded-full shadow-sm" style="background-color: ${cat.color}"></div>
                    <span class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">${cat.label}</span>
                </div>
            `).join('');
        }

        // 3. D3 Donut Chart
        renderDonutChart(categories, total);

        // 4. D3 Bar Chart (Simplified rows with D3 logic)
        renderBarCharts(categories, total);
    }

    function renderDonutChart(data, total) {
        const container = document.getElementById('donut-chart-container');
        if (!container) return;
        container.innerHTML = '';

        const width = container.clientWidth || 360;
        const height = width;
        const margin = 20;
        const radius = Math.min(width, height) / 2 - margin;

        const svg = d3.select('#donut-chart-container')
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        const pie = d3.pie()
            .sort(null)
            .value(d => d.count)
            .padAngle(0.04);

        const arc = d3.arc()
            .innerRadius(radius * 0.75)
            .outerRadius(radius)
            .cornerRadius(8);

        const arcHover = d3.arc()
            .innerRadius(radius * 0.72)
            .outerRadius(radius * 1.05)
            .cornerRadius(12);

        const path = svg.selectAll('path')
            .data(pie(data))
            .enter()
            .append('path')
            .attr('fill', d => d.data.color)
            .attr('d', arc)
            .attr('stroke', 'white')
            .attr('stroke-width', '2')
            .each(function(d) { this._current = d; });

        // Entry Animation
        path.transition()
            .duration(1500)
            .attrTween('d', function(d) {
                const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
                return (t) => arc(interpolate(t));
            })
            .ease(d3.easeElasticOut.amplitude(1).period(0.6));

        // Interactivity
        path.on('mouseenter', function(event, d) {
            d3.select(this)
                .transition()
                .duration(400)
                .attr('d', arcHover)
                .style('filter', 'drop-shadow(0 10px 15px rgba(0,0,0,0.1))');
            
            // Subtle pulse to total display
            const totalDisplay = d3.select('#total-count-display');
            totalDisplay.transition()
                .duration(200)
                .style('transform', 'scale(1.1)')
                .style('color', d.data.color);
        })
        .on('mouseleave', function(event, d) {
            d3.select(this)
                .transition()
                .duration(400)
                .attr('d', arc)
                .style('filter', 'none');
            
            const totalDisplay = d3.select('#total-count-display');
            totalDisplay.transition()
                .duration(300)
                .style('transform', 'scale(1)')
                .style('color', '#9B2247');
        });
    }

    function renderBarCharts(data, total) {
        const container = document.getElementById('bar-chart-container');
        if (!container) return;
        container.innerHTML = '';

        data.sort((a, b) => b.count - a.count).forEach((cat, i) => {
            const percentage = ((cat.count / total) * 100).toFixed(1);
            const row = document.createElement('div');
            row.className = 'group';
            row.innerHTML = `
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm" style="background-color: ${cat.color}">
                            <span class="text-[10px] font-black">${cat.count}</span>
                        </div>
                        <span class="text-xs font-bold text-gray-700 uppercase tracking-widest">${cat.label}</span>
                    </div>
                    <span class="text-[11px] font-black text-gray-400 group-hover:text-guinda transition-colors">${percentage}%</span>
                </div>
                <div class="w-full bg-gray-50 h-2.5 rounded-full overflow-hidden border border-gray-100/50">
                    <div class="bar-fill h-full rounded-full transition-all duration-[1500ms] ease-out-expo" 
                         style="width: 0%; background-color: ${cat.color}; box-shadow: 0 0 15px ${cat.color}33">
                    </div>
                </div>
            `;
            container.appendChild(row);

            // Animate width
            setTimeout(() => {
                const fill = row.querySelector('.bar-fill');
                if (fill) fill.style.width = `${percentage}%`;
            }, 100 + (i * 100));
        });
    }


    // Stats Listener
    window.addEventListener('search-ready', (e) => {
        const { summaries, relaciones } = e.detail;
        cachedSummaries = summaries;
        catalogLoaded = true;
        indexRelaciones(relaciones);

        // Si se abrió una vista durante la consulta, sustituir su indicador de carga.
        if (activeNavId === 'nav-leyes' && !location.hash) showLawsView(acervoState, { updateHistory: false });
        if (activeNavId === 'nav-stats' && !location.hash) showStatsView();

        // No longer auto-rendering on home, user wants it only in stats
        // renderAcervoAnalytics(summaries); 

        // Handle URL hash (deep link) once data is ready
        setTimeout(handleInitialHash, 0);
    });

    // Favorites nav buttons
    const navFavBtn = document.getElementById('nav-favorites');
    const mobileFavBtn = document.getElementById('mobile-nav-favorites');
    if (navFavBtn) navFavBtn.addEventListener('click', () => showFavoritesView());
    if (mobileFavBtn) mobileFavBtn.addEventListener('click', () => { showFavoritesView(); toggleMobileMenu(false); });

    // Análisis nav buttons
    const navAnalisis = document.getElementById('nav-analisis');
    const mobileNavAnalisis = document.getElementById('mobile-nav-analisis');
    if (navAnalisis) navAnalisis.addEventListener('click', (e) => { e.preventDefault(); showAnalisisView(); });
    if (mobileNavAnalisis) mobileNavAnalisis.addEventListener('click', (e) => { e.preventDefault(); showAnalisisView(); toggleMobileMenu(false); });

    // Stats nav buttons
    const navStatsBtn = document.getElementById('nav-stats');
    const mobileNavStats = document.getElementById('mobile-nav-stats');
    if (navStatsBtn) navStatsBtn.addEventListener('click', (e) => { e.preventDefault(); showStatsView(); });
    if (mobileNavStats) mobileNavStats.addEventListener('click', (e) => { e.preventDefault(); showStatsView(); toggleMobileMenu(false); });

    // Ayuda nav buttons
    const navAyudaBtn = document.getElementById('nav-ayuda');
    const mobileNavAyuda = document.getElementById('mobile-nav-ayuda');
    if (navAyudaBtn) navAyudaBtn.addEventListener('click', (e) => { e.preventDefault(); showAyudaView(); });
    if (mobileNavAyuda) mobileNavAyuda.addEventListener('click', (e) => { e.preventDefault(); showAyudaView(); toggleMobileMenu(false); });

    // Custom events from análisis module
    document.addEventListener('analisis:openArticle', async (e) => {
        const { id, list } = e.detail;
        const request = ++readerOpenRequest;
        const originHash = location.hash;
        if (location.hash.startsWith('#explorar')) {
            explorerModalReturn = explorerReturnContext(location.hash);
        }
        if (list && list.length) {
            const promises = list.map(lid => getArticleById(lid));
            const items = (await Promise.all(promises)).filter(Boolean);
            if (request !== readerOpenRequest || location.hash !== originHash) return;
            currentModalList = items;
        }
        openDetail(id);
    });
    document.addEventListener('analisis:stateChange', (e) => {
        explorerViewHash = explorerHash(e.detail);
        setHash(explorerViewHash);
    });
    document.addEventListener('analisis:goHome', () => showLawsView());
    document.addEventListener('analisis:openLaw', (e) => {
        const summary = summaryById(e.detail?.id);
        if (summary) openLawDetail(summary);
    });

    // Compare modal close
    document.getElementById('close-compare-modal')?.addEventListener('click', closeCompareModal);
    document.getElementById('compare-modal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('compare-modal')) closeCompareModal();
    });

    // ── Deep Linking, Toast & Skeleton Loaders ────────────────────────────────
    function setHash(hash) {
        // pushState en lugar de replaceState para que el botón Atrás del navegador
        // pueda retroceder entre artículos, leyes y la vista de inicio.
        if (location.hash === (hash || '')) return;
        history.pushState(null, '', hash ? `${location.pathname}${hash}` : location.pathname);
    }

    function explorerHash({ topicId, entityId } = {}) {
        const params = new URLSearchParams();
        if (topicId) params.set('tema', topicId);
        if (entityId) params.set('entidad', entityId);
        return `#explorar${params.size ? `?${params}` : ''}`;
    }

    function explorerRoute(hash) {
        if (hash !== '#explorar' && !hash.startsWith('#explorar?')) return null;
        const params = new URLSearchParams(hash.split('?')[1] || '');
        return { topicId: params.get('tema') || undefined, entityId: params.get('entidad') || undefined };
    }

    function acervoHash(state) {
        const params = new URLSearchParams();
        if (state.query) params.set('q', state.query);
        if (state.group !== 'all') params.set('grupo', state.group);
        if (state.sort !== 'title') params.set('orden', state.sort);
        return `#acervo${params.size ? `?${params}` : ''}`;
    }

    function acervoRoute(hash) {
        if (hash !== '#acervo' && !hash.startsWith('#acervo?')) return null;
        const params = new URLSearchParams(hash.split('?')[1] || '');
        return {
            ...acervoState,
            query: (params.get('q') || '').slice(0, 500),
            group: ACERVO_GROUPS.some(group => group.id === params.get('grupo')) ? params.get('grupo') : 'all',
            sort: ['date-newest', 'date-oldest'].includes(params.get('orden')) ? params.get('orden') : 'title',
        };
    }

    function explorerReturnContext(hash) {
        const focus = document.activeElement;
        return {
            hash, focus, scrollY: window.scrollY,
            articleId: focus?.closest('[data-open-article]')?.dataset.openArticle,
            entityId: focus?.closest('[data-select-entity]')?.dataset.selectEntity,
        };
    }

    function restoreExplorerPosition(context) {
        if (!context) return;
        const container = document.getElementById('analisis-container');
        const restoredArticle = context.articleId && [...(container?.querySelectorAll('[data-open-article]') || [])]
            .find(button => button.dataset.openArticle === context.articleId);
        const restoredEntity = context.entityId && [...(container?.querySelectorAll('[data-select-entity]') || [])]
            .find(button => button.dataset.selectEntity === context.entityId);
        const focus = context.focus?.isConnected ? context.focus : restoredArticle || restoredEntity || container?.querySelector('#explorer-entity-title');
        focus?.focus({ preventScroll: true });
        window.scrollTo({ top: context.scrollY, behavior: 'instant' });
    }

    async function handleInitialHash() {
        const hash = location.hash;
        if (!hash) return;
        const explorer = explorerRoute(hash);
        const acervo = acervoRoute(hash);
        if (hash === '#buscar') {
            clearTimeout(closeModalTimer);
            detailModal.classList.add('hidden');
            detailModal.classList.remove('flex');
            releaseReader();
            explorerModalReturn = null;
            resetToHero({ updateHistory: false });
        } else if (acervo) {
            clearTimeout(closeModalTimer);
            detailModal.classList.add('hidden');
            detailModal.classList.remove('flex');
            releaseReader();
            explorerModalReturn = null;
            showLawsView(acervo, { updateHistory: false });
        } else if (explorer) {
            const returnContext = explorerModalReturn?.hash === hash ? explorerModalReturn : null;
            clearTimeout(closeModalTimer);
            detailModal.classList.add('hidden');
            detailModal.classList.remove('flex');
            releaseReader();
            await showAnalisisView(explorer, { updateHistory: false });
            restoreExplorerPosition(returnContext);
            explorerModalReturn = null;
        } else if (hash.startsWith('#art-')) {
            const request = ++readerOpenRequest;
            const id = decodeURIComponent(hash.slice(5));
            const item = await getArticleById(id);
            if (request !== readerOpenRequest || location.hash !== hash) return;
            if (!item) { showToast('No se encontró este artículo en el acervo.', '!'); return; }
            const instrumentArticles = await getArticlesByLaw(item.ley_origen);
            if (request !== readerOpenRequest || location.hash !== hash) return;
            currentModalList = instrumentArticles.some(article => article.id === id)
                ? [...instrumentArticles.filter(article => !relatedDocumentLabel(article)), ...instrumentArticles.filter(article => relatedDocumentLabel(article))]
                : [item];
            await openDetail(id, { updateHistory: false });
        } else if (hash.startsWith('#ley-')) {
            clearTimeout(closeModalTimer);
            detailModal.classList.add('hidden');
            detailModal.classList.remove('flex');
            releaseReader();
            explorerModalReturn = null;
            const leyId = decodeURIComponent(hash.slice(5));
            const law = cachedSummaries.find(l => l.id === leyId);
            if (law) await openLawDetail(law, { updateHistory: false });
        }
    }

    // Maneja el botón Atrás / Adelante del navegador.
    // Restaura la vista correcta según el hash de la URL.
    window.addEventListener('popstate', async () => {
        if (!location.hash) {
            // Sin hash → regresar a la pantalla de inicio
            clearTimeout(closeModalTimer);
            detailModal.classList.add('hidden');
            detailModal.classList.remove('flex');
            releaseReader();
            explorerModalReturn = null;
            showLawsView(acervoState, { updateHistory: false });
        } else {
            await handleInitialHash();
        }
    });
    // El explorador local no necesita esperar a que termine la consulta del acervo.
    if (explorerRoute(location.hash) || acervoRoute(location.hash)) setTimeout(handleInitialHash, 0);

    function showToast(message, icon = '✓', color = 'bg-gray-900') {
        const existing = document.getElementById('app-toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.id = 'app-toast';
        // Improved mobile positioning and premium styling
        toast.className = `fixed bottom-12 md:bottom-24 left-1/2 z-[10000] flex items-center gap-3 px-6 py-3.5 ${color} text-white text-xs font-bold rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.25)] border border-white/10 backdrop-blur-md transition-all duration-500 opacity-0 pointer-events-none whitespace-nowrap`;
        toast.style.transform = 'translateX(-50%) scale(0.95)';
        toast.style.left = '50%';
        
        toast.innerHTML = `<span class="flex-shrink-0 text-base">${icon}</span><span>${message}</span>`;
        document.body.appendChild(toast);
        
        // Use timeout to ensure DOM insertion before animation
        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) scale(1)';
            toast.classList.remove('opacity-0');
            toast.classList.add('opacity-100');
        }, 10);

        setTimeout(() => {
            toast.style.transform = 'translateX(-50%) scale(0.95)';
            toast.classList.remove('opacity-100');
            toast.classList.add('opacity-0');
            setTimeout(() => toast.remove(), 500);
        }, 3000);
    }

    function showSkeletons(count = 5) {
        resultsContainer.innerHTML = Array(count).fill('').map(() => `
            <div class="animate-pulse rounded-xl p-5 border border-gray-50 bg-white">
                <div class="flex gap-2 mb-3">
                    <div class="h-4 bg-gray-100 rounded-full w-24"></div>
                    <div class="h-4 bg-gray-100 rounded-full w-36"></div>
                    <div class="h-4 bg-gray-100 rounded-full w-10 ml-auto"></div>
                </div>
                <div class="h-6 bg-gray-100 rounded-lg w-48 mb-3"></div>
                <div class="space-y-2">
                    <div class="h-3 bg-gray-100 rounded w-full"></div>
                    <div class="h-3 bg-gray-100 rounded w-5/6"></div>
                    <div class="h-3 bg-gray-100 rounded w-4/6"></div>
                </div>
            </div>
        `).join('');
    }
    // ── End Utilities ──────────────────────────────────────────────────────────

    let currentSearchQuery = '';
    let currentSearchResults = [];
    let currentPage = 1;
    let currentFilters = { type: 'all', law: 'all', artNum: '' };
    let currentModalList = [];
    let explorerModalReturn = null;
    let explorerViewHash = '#explorar';
    let closeModalTimer;
    let compareSelection = [];
    const itemsPerPage = 10;

    function renderPaginationControls(totalItems, containerId, renderFunction) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Remove existing pagination if any
        const existingNav = container.nextElementSibling;
        if (existingNav && existingNav.classList.contains('pagination-nav')) {
            existingNav.remove();
        }

        if (totalItems <= itemsPerPage) return;

        const totalPages = Math.ceil(totalItems / itemsPerPage);

        const nav = document.createElement('nav');
        nav.className = 'pagination-nav flex justify-center items-center gap-2 mt-8 mb-4';

        // Prev Button
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>`;
        prevBtn.className = `p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-guinda hover:text-white hover:border-guinda transition-all ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`;
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                renderFunction();
                window.scrollTo({ top: container.offsetTop - 100, behavior: 'smooth' });
            }
        };

        // Page Info
        const pageInfo = document.createElement('span');
        pageInfo.className = 'text-xs text-gray-500 font-medium';
        pageInfo.innerText = `Página ${currentPage} de ${totalPages}`;

        // Next Button
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>`;
        nextBtn.className = `p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-guinda hover:text-white hover:border-guinda transition-all ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`;
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderFunction();
                window.scrollTo({ top: container.offsetTop - 100, behavior: 'smooth' });
            }
        };

        nav.appendChild(prevBtn);
        nav.appendChild(pageInfo);
        nav.appendChild(nextBtn);

        container.parentNode.insertBefore(nav, container.nextSibling);
    }

    // Navigation Logic
    if (navInicio) {
        navInicio.addEventListener('click', (e) => {
            e.preventDefault();
            resetToHero();
        });
    }

    if (navLeyes) {
        navLeyes.addEventListener('click', (e) => {
            e.preventDefault();
            showLawsView();
        });
    }

    // ── Limpieza global del TOC ────────────────────────────────────────────────
    function destroyTOC() {
        lawOutlineObserver?.disconnect();
        lawOutlineSync = null;
        document.body.classList.remove('law-reading');
        document.getElementById('toc-toggle-btn')?.remove();
        const panel = document.getElementById('toc-panel');
        if (panel) {
            panel.classList.add('translate-y-full');
            setTimeout(() => panel.remove(), 310);
        }
        document.body.style.overflow = '';
    }
    // ── Fin limpieza TOC ───────────────────────────────────────────────────────

    // ── Nav activo ─────────────────────────────────────────────────────────────
    // ── Nav activo ──
    const NAV_IDS = ['nav-inicio', 'nav-leyes', 'nav-analisis', 'nav-favorites', 'nav-stats', 'nav-ayuda',
                     'mobile-nav-inicio', 'mobile-nav-leyes', 'mobile-nav-analisis', 'mobile-nav-stats', 'mobile-nav-ayuda'];
    function setActiveNav(activeId) {
        cancelPendingSearch();
        if (activeId !== 'nav-leyes') releaseAcervo();
        activeNavId = activeId;
        NAV_IDS.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const isActive = id === activeId || id === 'mobile-' + activeId;
            
            // Premium active state
            if (isActive) {
                el.classList.add('text-guinda', 'font-bold');
                el.classList.remove('text-gray-500');
                if (!id.startsWith('mobile-')) {
                    el.style.borderBottom = '2px solid #9B2247';
                    el.style.paddingBottom = '2px';
                }
            } else {
                el.classList.remove('text-guinda', 'font-bold');
                el.classList.add('text-gray-500');
                el.style.borderBottom = 'none';
                el.style.paddingBottom = '0';
            }
        });
    }

    function showGlobalSearch() {
        document.getElementById('global-search-wrapper')?.classList.remove('hidden', 'opacity-0');
    }
    function hideGlobalSearch() {
        document.getElementById('global-search-wrapper')?.classList.add('hidden');
        // Clear value so no stale query lingers
        if (searchInput) searchInput.value = '';
    }

    function cancelPendingSearch() {
        clearTimeout(searchDebounceTimer);
        searchRenderRequest++;
        loadingIndicator?.classList.add('hidden');
    }

    function releaseAcervo() {
        if (!acervoView) return;
        acervoState = acervoView.captureState();
        acervoView.destroy();
        acervoView = null;
    }

    function hideAllViews() {
        cancelPendingSearch();
        releaseAcervo();
        const containers = [
            'hero-section',
            'global-search-wrapper',
            'quick-filters',
            'results-container',
            'law-detail-container',
            'analisis-container',
            'admin-ingest-container',
            'stats-minimal',
            'help-view-container',
            'features-section',
            'acervo-visual-dashboard'
        ];
        containers.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.add('hidden');
                el.classList.add('opacity-0');
            }
        });
    }

    function resetToHero({ updateHistory = true } = {}) {
        if (updateHistory) setHash('#buscar');
        destroyTOC();
        hideAllViews();
        
        if (heroSection) heroSection.classList.remove('hidden');
        if (globalSearchWrapper) globalSearchWrapper.classList.remove('hidden');
        if (quickFilters) quickFilters.classList.remove('hidden');
        if (statsMinimal) statsMinimal.classList.remove('hidden');
        if (featuresSection) featuresSection.classList.remove('hidden');
        
        setTimeout(() => {
            if (heroSection) heroSection.classList.remove('opacity-0');
            if (globalSearchWrapper) globalSearchWrapper.classList.remove('opacity-0');
            if (featuresSection) featuresSection.classList.remove('opacity-0');
        }, 50);

        setActiveNav('nav-inicio');
        animateHero();
    }

    function animateHero() {
        if (typeof anime !== 'undefined') {
            anime({
                targets: '#hero-section .relative, #global-search-wrapper',
                translateY: [30, 0],
                opacity: [0, 1],
                delay: anime.stagger(150),
                easing: 'easeOutExpo',
                duration: 1500
            });
        }
    }

        mainContainer.classList.add('justify-center', 'pt-24');
        mainContainer.classList.remove('pt-8');

        resultsContainer.classList.add('hidden', 'opacity-0');
        resultsContainer.innerHTML = '';

        if (lawDetailContainer) lawDetailContainer.classList.add('hidden', 'opacity-0');
        document.getElementById('analisis-container')?.classList.add('hidden', 'opacity-0');
        document.getElementById('admin-ingest-container')?.classList.add('hidden', 'opacity-0');

        // Clean up external controls (Filters & Pagination)
        const filters = document.getElementById('search-filters');
        if (filters) filters.remove();

        const pagination = document.querySelector('.pagination-nav');
        if (pagination) pagination.remove();

        // Reset state
        currentPage = 1;
        currentFilters = { type: 'all', law: 'all', artNum: '' };
        setActiveNav('nav-inicio');
    
    function showLawsView(state = acervoState, { updateHistory = true } = {}) {
        lawOpenRequest++;
        acervoState = { ...state };
        acervoView?.destroy();
        acervoView = null;
        destroyTOC();
        hideAllViews();
        hideGlobalSearch();
        setActiveNav('nav-leyes');
        if (updateHistory) setHash(acervoHash(acervoState));
        mainContainer.classList.remove('justify-center', 'pt-24');
        mainContainer.classList.add('pt-8');
        resultsContainer.classList.remove('hidden', 'opacity-0');
        if (searchInput) searchInput.value = '';
        currentSearchQuery = '';
        currentFilters = { type: 'all', law: 'all', artNum: '' };
        currentPage = 1;
        document.getElementById('search-filters')?.remove();
        document.querySelector('.pagination-nav')?.remove();
        if (!catalogLoaded) {
            resultsContainer.innerHTML = '<div class="w-full flex justify-center py-12" role="status" aria-label="Cargando acervo"><div class="animate-spin h-6 w-6 border-2 border-guinda border-t-transparent rounded-full"></div></div>';
            return;
        }
        acervoView = renderAcervoView(resultsContainer, cachedSummaries, {
            onOpenStats: () => showStatsView(),
            state: acervoState,
            onStateChange(next) {
                acervoState = { ...next };
                // Typing changes this view's route without adding one history entry per letter.
                if (activeNavId === 'nav-leyes' && !resultsContainer.classList.contains('hidden')) {
                    history.replaceState(null, '', `${location.pathname}${acervoHash(acervoState)}`);
                }
            },
            onOpenLaw(law, next) {
                acervoState = { ...next, scrollY: window.scrollY };
                acervoReturnFocusId = law.id;
                openLawDetail(law);
            },
        });
        const currentView = acervoView;
        requestAnimationFrame(() => {
            if (currentView !== acervoView || activeNavId !== 'nav-leyes' || (location.hash && !acervoRoute(location.hash)) || resultsContainer.classList.contains('hidden')) return;
            if (acervoReturnFocusId) {
                const button = [...resultsContainer.querySelectorAll('[data-law-id]')].find(el => el.dataset.lawId === acervoReturnFocusId);
                button?.focus({ preventScroll: true });
                acervoReturnFocusId = null;
            }
            window.scrollTo({ top: acervoState.scrollY || 0, behavior: 'instant' });
        });
    }

    async function openLawDetail(law, { updateHistory = true } = {}) {
        if (!lawDetailContainer) return;
        const request = ++lawOpenRequest;
        const originHash = location.hash;
        destroyTOC(); // Remove any previous TOC before building a new one
        hideGlobalSearch(); // Single search bar: use the scoped one inside the law view

        // Limpiar el query, filtros y barra de filtros flotante al entrar a una ley
        currentSearchQuery = '';
        currentFilters = { type: 'all', law: 'all', artNum: '' };
        if (searchInput) searchInput.value = '';
        document.getElementById('search-filters')?.remove();
        document.querySelector('.pagination-nav')?.remove();
        setActiveNav('nav-leyes');

        // A later selection or return to the library cancels this navigation.
        const [articles, dbThemes] = await Promise.all([
            getArticlesByLaw(law.titulo), getThemesByLawName(law.titulo),
        ]);
        if (request !== lawOpenRequest || location.hash !== originHash || activeNavId !== 'nav-leyes') return;
        releaseAcervo();
        currentLawArticles = articles;

        // Calculate detailed stats
        const chapters = [...new Set(currentLawArticles.map(a => a.capitulo_nombre).filter(Boolean))];
        const titles = [...new Set(currentLawArticles.map(a => a.titulo_nombre).filter(Boolean))];
        const transitorios = currentLawArticles.filter(a => a.articulo_label.toLowerCase().includes('transitorio')).length;

        // Fetch themes from DB
        const dbCapitulos = dbThemes.filter(t => t.nivel === 'capitulo').length;
        const dbTitulos = dbThemes.filter(t => t.nivel === 'titulo').length;
        const chaptersCount = dbCapitulos > 0 ? dbCapitulos : chapters.length;
        const lawGroup = getAcervoGroup(law);
        const lawGroupLabel = ACERVO_GROUPS.find(group => group.id === lawGroup)?.label || 'Instrumento';

        // Hide other views
        resultsContainer.classList.add('hidden');
        heroSection.classList.add('hidden');
        quickFilters.classList.add('hidden');
        statsMinimal.classList.add('hidden');
        document.getElementById('analisis-container')?.classList.add('hidden', 'opacity-0');

        // Show Law Detail
        lawDetailContainer.classList.remove('hidden');
        setTimeout(() => lawDetailContainer.classList.remove('opacity-0'), 50);
        if (updateHistory) setHash(`#ley-${encodeURIComponent(law.id)}`);

        lawDetailContainer.innerHTML = `
            <div id="law-header-area" class="lr-header animate-fade-in-up">
                <nav aria-label="Ruta de navegación" class="lr-crumbs">
                    <button id="crumb-inicio" aria-label="Ir al inicio">Inicio</button><span aria-hidden="true">›</span>
                    <button id="crumb-categoria" aria-label="Volver al acervo">Acervo</button><span aria-hidden="true">›</span>
                    <span class="lr-crumb-current" title="${escapeHtml(law.titulo)}">${escapeHtml(law.siglas || law.titulo)}</span>
                </nav>
                <div class="lr-head-main">
                    <div class="lr-head-text">
                        <p class="lr-eyebrow" data-category="${lawGroup}"><span class="lr-eyebrow-ico">${collectionIcon(lawGroup, 16)}</span>${escapeHtml(lawGroupLabel)}${law.siglas ? ` · ${escapeHtml(law.siglas)}` : ''}</p>
                        <h1 class="lr-title">${escapeHtml(law.titulo)}</h1>
                        <ul class="lr-meta" aria-label="Datos del instrumento">
                            <li><span>Publicación</span><strong>${escapeHtml(formatLawDate(law.fecha_publicacion) || 'Sin fecha')}</strong></li>
                            ${law.fecha_ultima_reforma ? `<li><span>Última reforma</span><strong>${escapeHtml(formatLawDate(law.fecha_ultima_reforma))}</strong></li>` : ''}
                            <li><span>Fragmentos</span><strong>${currentLawArticles.length}</strong></li>
                            ${chaptersCount ? `<li><span>Capítulos</span><strong>${chaptersCount}</strong></li>` : ''}
                            ${transitorios ? `<li><span>Transitorios</span><strong>${transitorios}</strong></li>` : ''}
                        </ul>
                    </div>
                    <div class="lr-actions">
                        ${safeHttpUrl(law.url_original) ? `<a href="${escapeHtml(safeHttpUrl(law.url_original))}" target="_blank" rel="noopener noreferrer" class="lr-btn lr-btn-primary">Fuente oficial <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg></a>` : ''}
                        <!-- Share button for the law -->
                        <div class="relative" id="law-share-wrapper">
                            <button id="law-share-btn" class="lr-btn">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                Compartir
                            </button>
                            <div id="law-share-menu" class="hidden absolute top-full mt-2 right-0 bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden w-56 z-20">
                                <div class="px-4 py-2 bg-gray-50/80 border-b border-gray-50">
                                    <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Compartir ley</span>
                                </div>
                                <button id="law-share-whatsapp-btn" class="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                                    <span class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style="background:#25D366">
                                        <svg viewBox="0 0 24 24" fill="white" class="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                    </span>
                                    WhatsApp
                                </button>
                                <div class="border-t border-gray-50 mx-3 my-0.5"></div>
                                <button id="law-share-telegram-btn" class="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                                    <span class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style="background:#229ED9">
                                        <svg viewBox="0 0 24 24" fill="white" class="w-4 h-4"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                                    </span>
                                    Telegram
                                </button>
                                <button id="law-share-twitter-btn" class="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                                    <span class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-black">
                                        <svg viewBox="0 0 24 24" fill="white" class="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                    </span>
                                    Twitter / X
                                </button>
                                <button id="law-share-email-btn" class="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                                    <span class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-gray-500">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                                    </span>
                                    Correo electrónico
                                </button>
                                <div class="border-t border-gray-50 mx-3 my-0.5"></div>
                                <button id="law-share-link-btn" class="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                    <span class="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-blue-100">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
                                    </span>
                                    Copiar enlace
                                </button>
                            </div>
                        </div>
                        <details class="lr-more">
                            <summary class="lr-btn">Más</summary>
                            <div class="lr-more-menu">
                                <button id="present-law-btn" class="lr-more-item"><span class="present-label">Presentar en pantalla completa</span></button>
                                <button id="export-csv-btn" class="lr-more-item">Exportar artículos (CSV)</button>
                                <button id="print-btn" class="lr-more-item">Imprimir o guardar PDF</button>
                            </div>
                        </details>
                    </div>
                </div>
            </div>

            <nav class="lr-tabs" role="tablist" aria-label="Secciones del instrumento">
                <button role="tab" id="lr-tab-texto" aria-controls="lr-panel-texto" aria-selected="true" data-law-tab="texto">Texto</button>
                <button role="tab" id="lr-tab-linea" aria-controls="lr-panel-linea" aria-selected="false" data-law-tab="linea">Línea del tiempo</button>
                <button role="tab" id="lr-tab-presentacion" aria-controls="lr-panel-presentacion" aria-selected="false" data-law-tab="presentacion">Presentación</button>
                <button role="tab" id="lr-tab-estructura" aria-controls="lr-panel-estructura" aria-selected="false" data-law-tab="estructura">Estructura y temas</button>
            </nav>

            <section id="lr-panel-texto" class="lr-panel" role="tabpanel" aria-labelledby="lr-tab-texto" data-law-panel="texto">
                <div class="lr-reading">
                    <aside class="lr-outline" aria-label="Índice del instrumento">
                        <p class="lr-outline-title">Índice</p>
                        <nav id="law-outline"></nav>
                    </aside>
                    <div class="lr-body">
                        <div class="lr-search">
                            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/></svg>
                            <input type="text" id="law-search-input" autocomplete="off" placeholder="Buscar dentro de ${escapeHtml(law.siglas || 'este instrumento')}…" aria-label="Buscar dentro de ${escapeHtml(law.titulo)}">
                        </div>
                        <div class="reader-toolbar reader-law-toolbar">
                            <span>Lectura del instrumento</span>
                            ${readerControlsHtml()}
                        </div>
                        <div id="law-articles-list" class="lr-articles"></div>
                        <div id="load-more-container" class="mt-8 mb-12 flex justify-center"></div>
                    </div>
                </div>
            </section>

            <section id="lr-panel-linea" class="lr-panel" role="tabpanel" aria-labelledby="lr-tab-linea" data-law-panel="linea" hidden>
                <div id="law-timeline"></div>
            </section>

            <section id="lr-panel-presentacion" class="lr-panel" role="tabpanel" aria-labelledby="lr-tab-presentacion" data-law-panel="presentacion" hidden>
                <p class="lr-panel-intro">Recorrido visual del instrumento. Usa las flechas o haz clic en las tarjetas; activa pantalla completa para presentar.</p>
                <div id="law-presentation-embed" class="w-full"></div>
            </section>

            <section id="lr-panel-estructura" class="lr-panel" role="tabpanel" aria-labelledby="lr-tab-estructura" data-law-panel="estructura" hidden>
                <div class="lr-structure">
                    <div class="lr-card">
                        <h2 class="lr-card-title">Distribución del contenido</h2>
                        <div id="law-structure-chart" class="w-full h-64"></div>
                    </div>
                    <div class="lr-card">
                        <h2 class="lr-card-title">Temas principales</h2>
                        <div class="flex flex-wrap gap-2 content-start" id="themes-container">
                            ${law.temas_clave && law.temas_clave.length > 0 ? law.temas_clave.map(t => `<button class="theme-tag lr-theme" data-theme="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join('') : '<span class="text-xs text-gray-400">Este instrumento todavía no tiene temas registrados.</span>'}
                        </div>
                    </div>
                </div>
            </section>
        `;

        renderInstrumentTimeline(document.getElementById('law-timeline'), {
            law, summaries: cachedSummaries, articles: currentLawArticles, relations: cachedRelaciones,
        }, {
            onOpenLaw: id => openLawDetail(summaryById(id)),
            onOpenArticle: id => {
                currentModalList = [...currentLawArticles.filter(article => !relatedDocumentLabel(article)), ...currentLawArticles.filter(article => relatedDocumentLabel(article))];
                openDetail(id);
            },
        });

        // Secondary panels render the first time they are opened: hidden containers have no size.
        const renderedPanels = new Set(['texto', 'linea']);
        const panelRenderers = {
            presentacion: () => renderLawPresentationEmbed(document.getElementById('law-presentation-embed'), law, currentLawArticles, dbThemes),
            estructura: () => renderLawStructureChart(currentLawArticles, dbThemes),
        };
        const showLawPanel = (name, { focusTab = false } = {}) => {
            lawDetailContainer.querySelectorAll('[data-law-tab]').forEach(tab => {
                const active = tab.dataset.lawTab === name;
                tab.setAttribute('aria-selected', String(active));
                tab.tabIndex = active ? 0 : -1;
                if (active && focusTab) tab.focus();
            });
            lawDetailContainer.querySelectorAll('[data-law-panel]').forEach(panel => { panel.hidden = panel.dataset.lawPanel !== name; });
            if (!renderedPanels.has(name)) { renderedPanels.add(name); panelRenderers[name]?.(); }
            document.body.classList.toggle('law-reading', name === 'texto');
        };
        const lawTabs = [...lawDetailContainer.querySelectorAll('[data-law-tab]')];
        lawTabs.forEach((tab, index) => {
            tab.tabIndex = index === 0 ? 0 : -1;
            tab.addEventListener('click', () => showLawPanel(tab.dataset.lawTab));
            tab.addEventListener('keydown', event => {
                const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
                if (!step) return;
                event.preventDefault();
                showLawPanel(lawTabs[(index + step + lawTabs.length) % lawTabs.length].dataset.lawTab, { focusTab: true });
            });
        });
        showLawPanel('texto');
        window.scrollTo({ top: 0, behavior: 'instant' });

        // ── Tabla de contenidos (índice flotante) ──────────────────────────────
        const tocBtn = document.createElement('button');
        tocBtn.id = 'toc-toggle-btn';
        tocBtn.className = 'fixed bottom-24 left-4 z-40 bg-white border border-gray-200 shadow-xl rounded-2xl px-4 py-2.5 text-xs font-bold text-gray-600 flex items-center gap-2 hover:text-guinda hover:border-guinda transition-all duration-300 group animate-fade-in-up';
        tocBtn.innerHTML = `
            <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h10M4 18h6"/></svg>
            Índice
            <span class="bg-guinda/10 text-guinda px-1.5 py-0.5 rounded-full text-[9px] font-bold">${currentLawArticles.length}</span>
        `;
        document.body.appendChild(tocBtn);

        // Build grid buttons HTML (separated by type)
        const relacionados = currentLawArticles.filter(a => relatedDocumentLabel(a));
        const ordinarios = currentLawArticles.filter(a => a.tipo_articulo !== 'transitorio' && !relatedDocumentLabel(a));
        const transitoriosArr = currentLawArticles.filter(a => a.tipo_articulo === 'transitorio');

        const buildGrid = (arr) => arr.map((art, i) => {
            const { loggedIn, fav: isFav } = getFavoriteUiState(art.id);
            const hasNote = !!getNote(art.id);
            let label = '';
            
            if (art.tipo_articulo === 'preambulo') {
                label = 'Pre.';
            } else if (art.tipo_articulo === 'anexo' || art.tipo_articulo === 'complementario') {
                label = art.tipo_articulo === 'anexo' ? `Anx.${i+1}` : `Comp.${i+1}`;
            } else if (art.tipo_articulo === 'transitorio') {
                const match = art.articulo_label.match(/(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO|D[ÉE]CIMO|UND[ÉE]CIMO|DUOD[ÉE]CIMO|VIG[ÉE]SIMO|[ÚU]NICO|\d+)/i);
                label = match ? `T.${match[0].substring(0,3)}.` : `T.${i+1}`;
            } else {
                const num = art.articulo_label.match(/\d+/);
                label = num ? `Art.${num[0]}` : `Art.${i+1}`;
            }

            return `<button class="toc-art-btn toc-art-grid-btn text-[10px] font-bold rounded-lg py-2 px-1 border transition-all text-center relative
                ${isFav ? 'border-guinda/30 bg-guinda/5 text-guinda' : loggedIn ? 'border-gray-100 bg-white text-gray-600 hover:border-guinda hover:text-guinda hover:bg-guinda/5' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-guinda/40 hover:text-guinda'}"
                style="display:flex; width:100%; min-width:0; justify-content:center; align-items:center; box-sizing:border-box;"
                data-id="${art.id}" title="${loggedIn ? art.articulo_label : `${art.articulo_label} · Requiere inicio de sesión para guardar`}">
                ${label}
                ${!loggedIn && !isFav ? '<span class="absolute top-1 left-1 w-3.5 h-3.5 rounded-full bg-white border border-guinda/20 text-guinda flex items-center justify-center shadow-sm"><svg class="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v2H5a1 1 0 00-1 1v5a2 2 0 002 2h8a2 2 0 002-2V9a1 1 0 00-1-1h-1V6a4 4 0 00-4-4zm-2 6V6a2 2 0 114 0v2H8z" clip-rule="evenodd"></path></svg></span>' : ''}
                ${hasNote ? '<span class="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-amber-400 rounded-full"></span>' : ''}
            </button>`;
        }).join('');

        const gridHTML = `
            <div class="toc-grid-scroll space-y-6 px-5 pb-10 overflow-y-auto h-full scroll-smooth" style="width:100%; min-width:100%; max-width:100%; box-sizing:border-box;">
                ${ordinarios.length > 0 ? `
                    <div class="mb-6">
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Cuerpo Principal</p>
                        <div class="toc-grid-layout" style="display:grid; width:100%; min-width:100%; max-width:100%; grid-template-columns:repeat(auto-fit, minmax(72px, 1fr)); gap:0.5rem; align-items:stretch;">
                            ${buildGrid(ordinarios)}
                        </div>
                    </div>
                ` : ''}
                ${transitoriosArr.length > 0 ? `
                    <div>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Artículos Transitorios</p>
                        <div class="toc-grid-layout" style="display:grid; width:100%; min-width:100%; max-width:100%; grid-template-columns:repeat(auto-fit, minmax(72px, 1fr)); gap:0.5rem; align-items:stretch;">
                            ${buildGrid(transitoriosArr)}
                        </div>
                    </div>
                ` : ''}
                ${relacionados.length ? `
                    <div class="related-documents-index">
                        <p class="related-documents-title">Documentos relacionados</p>
                        <p class="related-documents-description">Complementos que acompañan al instrumento.</p>
                        <div class="toc-grid-layout" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(72px, 1fr)); gap:0.5rem;">
                            ${buildGrid(relacionados)}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        // Build list items HTML (grouped)
        const buildList = (arr) => arr.map((art) => {
            const hasNote = !!getNote(art.id);
            const { loggedIn, fav: isFav } = getFavoriteUiState(art.id);
            const preview = escapeHtml(getTextPreview(art.texto, 100));
            const typeLabel = art.tipo_articulo === 'transitorio' ? 'TRANS' : 
                             art.tipo_articulo === 'preambulo' ? 'PREAM' :
                             art.tipo_articulo === 'anexo' ? 'ANEXO' :
                             art.tipo_articulo === 'complementario' ? 'COMPL' : 'ART';
            
            return `<button class="toc-art-btn w-full flex flex-col gap-2 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-guinda/5 group/item
                ${isFav ? 'text-guinda' : loggedIn ? 'text-gray-700 hover:text-guinda' : 'text-gray-600'}"
                data-id="${art.id}" title="${loggedIn ? art.articulo_label : `${art.articulo_label} · Requiere inicio de sesión para guardar`}">
                <div class="flex items-center gap-3">
                    <span class="flex-shrink-0 text-[9px] font-bold min-w-[42px] text-center py-1 rounded-md
                        ${isFav ? 'bg-guinda/10 text-guinda' : loggedIn ? 'bg-gray-100 text-gray-500 group-hover/item:bg-guinda/10 group-hover/item:text-guinda' : 'bg-gray-100 text-gray-500'}">
                        ${typeLabel}
                    </span>
                    <span class="text-xs font-medium flex-1 leading-snug truncate">
                        ${art.articulo_label}
                    </span>
                    ${isFav
                ? '<svg class="w-3 h-3 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/></svg>'
                : (!loggedIn ? '<span class="w-5 h-5 rounded-full bg-white border border-guinda/20 text-guinda flex items-center justify-center shadow-sm"><svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v2H5a1 1 0 00-1 1v5a2 2 0 002 2h8a2 2 0 002-2V9a1 1 0 00-1-1h-1V6a4 4 0 00-4-4zm-2 6V6a2 2 0 114 0v2H8z" clip-rule="evenodd"></path></svg></span>' : '')}
                </div>
                ${preview ? `<span class="text-[10px] text-gray-400 leading-tight line-clamp-1">${preview}</span>` : ''}
            </button>`;
        }).join('');

        const structureHTML = dbThemes.length > 0 ? dbThemes.map(t => {
            const icon = t.nivel === 'titulo' ? '📕' : t.nivel === 'capitulo' ? '📘' : '📗';
            const indent = t.nivel === 'capitulo' ? 'pl-6' : t.nivel === 'seccion' ? 'pl-10' : 'pl-2';
            const textClass = t.nivel === 'titulo' ? 'font-bold text-gray-800' : 'font-medium text-gray-600 text-xs';
            return `<button class="toc-structure-btn w-full text-left py-2 ${indent} hover:bg-guinda/5 rounded-lg transition-all group" data-query="${t.nombre}">
                <span class="inline-block w-4 text-center mr-1">${icon}</span>
                <span class="${textClass} group-hover:text-guinda transition-colors">${t.nombre}</span>
            </button>`;
        }).join('') : '<p class="text-center py-10 text-gray-400 text-xs italic">No hay estructura temática detectada para esta ley.</p>';

        const listHTML = `
            <div class="space-y-4 px-5 pb-10 overflow-y-auto h-full scroll-smooth">
                ${ordinarios.length > 0 ? `
                    <div class="mb-4">
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Cuerpo Principal</p>
                        <div class="flex flex-col gap-1">${buildList(ordinarios)}</div>
                    </div>
                ` : ''}
                ${transitoriosArr.length > 0 ? `
                    <div>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Transitorios</p>
                        <div class="flex flex-col gap-1">${buildList(transitoriosArr)}</div>
                    </div>
                ` : ''}
                ${relacionados.length ? `
                    <div class="related-documents-index">
                        <p class="related-documents-title">Documentos relacionados</p>
                        <div class="flex flex-col gap-1">${buildList(relacionados)}</div>
                    </div>
                ` : ''}
            </div>
        `;

        const tocPanel = document.createElement('div');
        tocPanel.id = 'toc-panel';
        tocPanel.className = 'fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 transform translate-y-full transition-transform duration-300 flex flex-col';
        tocPanel.style.maxHeight = '75vh';
        tocPanel.innerHTML = `
            <!-- Handle bar -->
            <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div class="w-10 h-1 bg-gray-200 rounded-full"></div>
            </div>
            <!-- Header -->
            <div class="flex items-center justify-between px-5 pt-2 pb-3 flex-shrink-0 border-b border-gray-50">
                <div>
                    <p class="text-sm font-bold text-gray-800">Índice del instrumento</p>
                    <p class="text-[10px] text-gray-400 mt-0.5">${currentLawArticles.length} fragmentos · clic para abrir</p>
                </div>
                <button id="toc-close-btn" class="p-2 text-gray-400 hover:text-guinda transition-colors rounded-full hover:bg-guinda/5" aria-label="Cerrar índice">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
            <!-- Tabs -->
            <div class="flex gap-1 px-5 py-2 flex-shrink-0 bg-gray-50/50">
                <button id="toc-tab-grid" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all bg-guinda text-white shadow-sm">
                    Cuadrícula
                </button>
                <button id="toc-tab-list" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all text-gray-500 hover:text-guinda hover:bg-guinda/5">
                    Lista
                </button>
                <button id="toc-tab-structure" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all text-gray-500 hover:text-guinda hover:bg-guinda/5">
                    Estructura
                </button>
                <!-- Quick search inside TOC -->
                <div class="ml-auto relative flex items-center">
                    <svg class="absolute left-2.5 w-3 h-3 text-gray-300 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    <input id="toc-search" type="text" placeholder="Filtrar…"
                        class="text-[10px] border border-gray-200 rounded-full pl-7 pr-3 py-1 w-24 focus:outline-none focus:border-guinda focus:ring-1 focus:ring-guinda/20 transition-all bg-white placeholder-gray-300">
                </div>
            </div>
            <!-- Content: Grid view (default) -->
            <div id="toc-content-grid" class="overflow-y-auto flex-1 px-4 py-3" style="display:block; width:100%; min-width:0; flex:1 1 auto; box-sizing:border-box;">
                <div style="display:block; width:100%;">
                    ${gridHTML}
                </div>
            </div>
            <!-- Content: List view (hidden) -->
            <div id="toc-content-list" class="hidden overflow-y-auto flex-1 px-3 py-2 space-y-0.5">
                ${listHTML}
            </div>
            <!-- Content: Structure view (hidden) -->
            <div id="toc-content-structure" class="hidden overflow-y-auto flex-1 px-5 py-4 space-y-1">
                ${structureHTML}
            </div>
        `;
        document.body.appendChild(tocPanel);

        const tabGrid = tocPanel.querySelector('#toc-tab-grid');
        const tabList = tocPanel.querySelector('#toc-tab-list');
        const tabStructure = tocPanel.querySelector('#toc-tab-structure');
        const contentGrid = tocPanel.querySelector('#toc-content-grid');
        const contentList = tocPanel.querySelector('#toc-content-list');
        const contentStructure = tocPanel.querySelector('#toc-content-structure');
        const tocSearch = tocPanel.querySelector('#toc-search');

        const activeTabCls = ['bg-guinda', 'text-white', 'shadow-sm'];
        const inactiveTabCls = ['text-gray-500', 'hover:text-guinda', 'hover:bg-guinda/5'];

        const switchTab = (activeTab, activeContent) => {
            [tabGrid, tabList, tabStructure].forEach(t => {
                t.classList.remove(...activeTabCls);
                t.classList.add(...inactiveTabCls);
            });
            [contentGrid, contentList, contentStructure].forEach(c => c.classList.add('hidden'));
            
            activeTab.classList.add(...activeTabCls);
            activeTab.classList.remove(...inactiveTabCls);
            activeContent.classList.remove('hidden');
        };

        tabGrid.addEventListener('click', () => switchTab(tabGrid, contentGrid));
        tabList.addEventListener('click', () => switchTab(tabList, contentList));
        tabStructure.addEventListener('click', () => switchTab(tabStructure, contentStructure));

        // Structure navigation
        tocPanel.querySelectorAll('.toc-structure-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const query = btn.dataset.query;
                toggleToc(false);
                const lawSearch = document.getElementById('law-search-input');
                if (lawSearch) {
                    lawSearch.value = query;
                    lawSearch.dispatchEvent(new Event('input'));
                    // Optional: scroll to first result
                    setTimeout(() => {
                        const first = document.querySelector('#law-articles-list article');
                        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                }
            });
        });

        // TOC search filter
        if (tocSearch) {
            tocSearch.addEventListener('input', (e) => {
                const q = e.target.value.toLowerCase().trim();
                const activeContent = contentList.classList.contains('hidden') ? contentGrid : contentList;
                activeContent.querySelectorAll('.toc-art-btn').forEach(btn => {
                    const matches = !q || btn.title?.toLowerCase().includes(q) || btn.textContent.toLowerCase().includes(q);
                    btn.style.display = matches ? '' : 'none';
                });
            });
            tocSearch.addEventListener('click', (e) => e.stopPropagation());
        }

        let tocOpen = false;
        const toggleToc = (show) => {
            tocOpen = show;
            if (show) {
                tocPanel.classList.remove('translate-y-full');
                document.body.style.overflow = 'hidden';
            } else {
                tocPanel.classList.add('translate-y-full');
                document.body.style.overflow = '';
            }
        };

        tocBtn.addEventListener('click', () => toggleToc(!tocOpen));
        tocPanel.querySelector('#toc-close-btn')?.addEventListener('click', () => toggleToc(false));

        tocPanel.querySelectorAll('.toc-art-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                toggleToc(false);
                openDetail(btn.dataset.id);
            });
        });

        // ── Fin Tabla de contenidos ────────────────────────────────────────────

        // Theme tag filtering
        tocPanel.querySelectorAll('.theme-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const theme = tag.dataset.theme;
                const lawSearch = document.getElementById('law-search-input');
                if (lawSearch) {
                    lawSearch.value = theme;
                    lawSearch.dispatchEvent(new Event('input'));
                    lawSearch.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        });

        // Also add listeners to the themes cloud above
        document.querySelectorAll('#themes-container .theme-tag').forEach(tag => {
            tag.addEventListener('click', () => {
                const theme = tag.dataset.theme;
                const lawSearch = document.getElementById('law-search-input');
                if (lawSearch) {
                    lawSearch.value = theme;
                    lawSearch.dispatchEvent(new Event('input'));
                    lawSearch.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        });

        // Pagination for law articles
        let articlesShown = 20;
        const updateLoadMore = (totalItems) => {
            const container = document.getElementById('load-more-container');
            if (!container) return;
            
            if (articlesShown >= totalItems) {
                container.innerHTML = '';
            } else {
                container.innerHTML = `
                    <button id="btn-load-more-law" class="px-8 py-3 bg-white border border-gray-200 text-gray-600 rounded-full text-xs font-bold hover:border-guinda hover:text-guinda transition-all shadow-sm flex items-center gap-2">
                        Ver más artículos
                        <span class="text-[10px] opacity-60">(${totalItems - articlesShown} restantes)</span>
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                    </button>
                `;
                document.getElementById('btn-load-more-law')?.addEventListener('click', () => {
                    articlesShown += 50;
                    const query = document.getElementById('law-search-input')?.value || '';
                    const filtered = query.length > 2 
                        ? currentLawArticles.filter(a => a.texto.toLowerCase().includes(query.toLowerCase()) || a.articulo_label.toLowerCase().includes(query.toLowerCase()))
                        : currentLawArticles;
                    
                    renderLawArticles(filtered.slice(0, articlesShown), query);
                    updateLoadMore(filtered.length);
                });
            }
        };

        // Render initial articles
        renderLawArticles(currentLawArticles.slice(0, articlesShown), '');
        updateLoadMore(currentLawArticles.length);

        // ── Índice lateral: títulos y capítulos, con la sección en lectura resaltada ──
        function buildLawOutline() {
            const outline = document.getElementById('law-outline');
            if (!outline) return;
            const ordered = [...currentLawArticles.filter(a => !relatedDocumentLabel(a)), ...currentLawArticles.filter(a => relatedDocumentLabel(a))];
            const entries = [];
            const sectionOf = new Map();
            let title = null, chapter = null, inTransitorios = false, inRelated = false;
            const push = (level, label, id) => { entries.push({ level, label, id, key: String(entries.length) }); };
            for (const article of ordered) {
                if (relatedDocumentLabel(article)) {
                    if (!inRelated) { inRelated = true; push(1, 'Documentos relacionados', article.id); }
                } else if (article.tipo_articulo === 'transitorio') {
                    if (!inTransitorios) { inTransitorios = true; push(1, 'Transitorios', article.id); }
                } else {
                    if ((article.titulo_nombre || null) !== title) { title = article.titulo_nombre || null; chapter = null; if (title) push(1, title, article.id); }
                    if ((article.capitulo_nombre || null) !== chapter) { chapter = article.capitulo_nombre || null; if (chapter) push(title ? 2 : 1, chapter, article.id); }
                }
                if (entries.length) sectionOf.set(article.id, entries.at(-1).key);
            }
            // Instruments without titles or chapters get a plain article list instead.
            if (entries.length < 2) {
                entries.length = 0;
                ordered.slice(0, 120).forEach(article => { push(1, article.articulo_label, article.id); sectionOf.set(article.id, entries.at(-1).key); });
            }
            const split = label => { const [head, ...rest] = String(label).split(/\s+[—–-]\s+/); return rest.length ? `<strong>${escapeHtml(head)}</strong><span>${escapeHtml(rest.join(' — '))}</span>` : `<span>${escapeHtml(head)}</span>`; };
            outline.innerHTML = entries.map(entry => `<button class="lr-outline-item lr-level-${entry.level}" data-outline-id="${escapeHtml(entry.id)}" data-outline-key="${entry.key}">${split(entry.label)}</button>`).join('');
            outline.onclick = event => {
                const button = event.target.closest('[data-outline-id]');
                if (!button) return;
                const id = button.dataset.outlineId;
                const lawSearch = document.getElementById('law-search-input');
                if (lawSearch?.value) { lawSearch.value = ''; lawSearch.dispatchEvent(new Event('input')); }
                const index = ordered.findIndex(article => article.id === id);
                if (index >= articlesShown) {
                    articlesShown = index + 20;
                    renderLawArticles(currentLawArticles.slice(0, articlesShown), '');
                    updateLoadMore(currentLawArticles.length);
                }
                const card = document.querySelector(`#law-articles-list .result-item[data-id="${CSS.escape(id)}"]`);
                if (!card) return;
                card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                card.classList.remove('lr-flash'); void card.offsetWidth; card.classList.add('lr-flash');
            };
            lawOutlineSync = () => {
                lawOutlineObserver?.disconnect();
                if (typeof IntersectionObserver !== 'function') return;
                lawOutlineObserver = new IntersectionObserver(items => {
                    const visible = items.filter(item => item.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
                    if (!visible) return;
                    const key = sectionOf.get(visible.target.dataset.id);
                    outline.querySelectorAll('.lr-outline-item').forEach(item => item.classList.toggle('is-active', item.dataset.outlineKey === key));
                    const active = outline.querySelector('.is-active');
                    if (active && outline.scrollHeight > outline.clientHeight) active.scrollIntoView({ block: 'nearest' });
                }, { rootMargin: '-90px 0px -65% 0px' });
                document.querySelectorAll('#law-articles-list .result-item').forEach(card => lawOutlineObserver.observe(card));
            };
            lawOutlineSync();
        }

        // Update pagination on search
        const lawSearchInput = document.getElementById('law-search-input');
        if (lawSearchInput) {
            lawSearchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                let filtered = currentLawArticles;

                if (query.length > 2) {
                    filtered = currentLawArticles.filter(a =>
                        a.texto.toLowerCase().includes(query) ||
                        a.articulo_label.toLowerCase().includes(query) ||
                        (a.titulo_nombre && a.titulo_nombre.toLowerCase().includes(query)) ||
                        (a.capitulo_nombre && a.capitulo_nombre.toLowerCase().includes(query))
                    );
                }

                articlesShown = 50; // Reset shown count on new search
                renderLawArticles(filtered.slice(0, articlesShown), query);
                updateLoadMore(filtered.length);
            });
        }

        buildLawOutline();

        readerControls.sync();

        // Law share button wiring
        const lawShareBtn = document.getElementById('law-share-btn');
        const lawShareMenu = document.getElementById('law-share-menu');
        const lawShareTextBtn = document.getElementById('law-share-text-btn');
        const lawShareLinkBtn = document.getElementById('law-share-link-btn');

        if (lawShareBtn && lawShareMenu) {
            lawShareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                lawShareMenu.classList.toggle('hidden');
            });
            document.addEventListener('click', function hideLawShareMenu(e) {
                if (!e.target.closest('#law-share-wrapper')) {
                    lawShareMenu.classList.add('hidden');
                    document.removeEventListener('click', hideLawShareMenu);
                }
            });
        }

        // Law share platform buttons
        const lawShareActions = {
            'law-share-whatsapp-btn': () => shareLawVia(law, 'whatsapp'),
            'law-share-telegram-btn': () => shareLawVia(law, 'telegram'),
            'law-share-twitter-btn': () => shareLawVia(law, 'twitter'),
            'law-share-email-btn': () => shareLawVia(law, 'email'),
            'law-share-link-btn': () => {
                const url = `${location.origin}${location.pathname}#ley-${encodeURIComponent(law.id)}`;
                navigator.clipboard.writeText(url).then(() => showToast('¡Enlace copiado!', '🔗', 'bg-blue-600'));
            }
        };
        Object.entries(lawShareActions).forEach(([id, action]) => {
            document.getElementById(id)?.addEventListener('click', () => {
                lawShareMenu?.classList.add('hidden');
                action();
            });
        });

        // Print / PDF
        document.getElementById('print-btn')?.addEventListener('click', () => window.print());

        const presentBtn = document.getElementById('present-law-btn');
        presentBtn?.addEventListener('click', () => {
            const label = presentBtn.querySelector('.present-label');
            const originalLabel = label?.textContent || 'Presentar';
            try {
                presentBtn.disabled = true;
                if (label) label.textContent = 'Abriendo...';
                openLawPresentationDeck(law, currentLawArticles, dbThemes);
            } catch (error) {
                console.error('[Presentation] Error:', error);
                showToast(error.message || 'No se pudo generar la presentación', '!', 'bg-gray-800');
            } finally {
                presentBtn.disabled = false;
                if (label) label.textContent = originalLabel;
            }
        });

        // Breadcrumb listeners
        document.getElementById('crumb-inicio')?.addEventListener('click', () => showLawsView({ group: 'all', query: '', sort: 'title' }));
        document.getElementById('crumb-categoria')?.addEventListener('click', () => showLawsView());

        // Theme Filter Listeners
        document.querySelectorAll('.theme-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.target.dataset.theme;
                const searchInput = document.getElementById('law-search-input');
                if (searchInput) {
                    searchInput.value = theme;
                    searchInput.dispatchEvent(new Event('input'));
                }
            });
        });



        document.getElementById('export-csv-btn').addEventListener('click', () => {
            exportToCSV(currentLawArticles, `${law.titulo}.csv`);
        });
    }

    function renderLawStructureChart(articles, themes = []) {
        const chartContainer = document.getElementById('law-structure-chart');
        if (!chartContainer) return;

        if (!window.d3) {
            chartContainer.innerHTML = '<div class="flex items-center justify-center h-full text-xs text-gray-400">&nbsp;</div>';
            setTimeout(() => renderLawStructureChart(articles, themes), 1000);
            return;
        }

        chartContainer.innerHTML = '';

        if (!articles || articles.length === 0) {
            chartContainer.innerHTML = '<div class="flex items-center justify-center h-full text-xs text-gray-400">No hay datos para visualizar</div>';
            return;
        }

        // Use themes from DB if available, otherwise fallback to article fields
        let data;
        if (themes && themes.length > 0) {
            // Count themes by nivel
            const titulos = themes.filter(t => t.nivel === 'titulo');
            const capitulos = themes.filter(t => t.nivel === 'capitulo');
            const secciones = themes.filter(t => t.nivel === 'seccion');
            const transitorios = articles.filter(a => a.articulo_label?.toLowerCase().includes('transitorio')).length;
            const ordinarios = articles.length - transitorios;

            data = [];
            if (titulos.length > 0) data.push({ name: `Títulos`, value: titulos.length, color: '#7A1C3A' });
            if (capitulos.length > 0) data.push({ name: `Capítulos`, value: capitulos.length, color: '#2563eb' });
            if (secciones.length > 0) data.push({ name: `Secciones`, value: secciones.length, color: '#059669' });
            data.push({ name: `Artículos`, value: ordinarios, color: '#6b7280' });
            if (transitorios > 0) data.push({ name: `Transitorios`, value: transitorios, color: '#d97706' });
        } else {
            const dataMap = {};
            articles.forEach(a => {
                const tipo = a.articulo_label?.toLowerCase().includes('transitorio') ? 'Transitorios' :
                             a.tipo_articulo === 'preambulo' ? 'Preámbulo' : 'Artículos';
                dataMap[tipo] = (dataMap[tipo] || 0) + 1;
            });
            data = Object.entries(dataMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);
        }

        if (data.length === 0) {
            chartContainer.innerHTML = '<div class="flex items-center justify-center h-full text-xs text-gray-400">Datos insuficientes</div>';
            return;
        }

        const margin = { top: 10, right: 30, bottom: 20, left: 220 }; // Increased left margin for long titles
        const width = chartContainer.clientWidth;
        // Dynamic height based on data
        const barHeight = 35; // Thicker bars
        const height = Math.max(chartContainer.clientHeight, data.length * barHeight + margin.top + margin.bottom);

        // Clear previous SVG if any
        d3.select(chartContainer).select("svg").remove();

        const svg = d3.select(chartContainer)
            .append("svg")
            .attr("width", "100%")
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto; font: 11px sans-serif;"); // Slightly larger font

        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.value)])
            .range([margin.left, width - margin.right]);

        const y = d3.scaleBand()
            .domain(data.map(d => d.name))
            .rangeRound([margin.top, height - margin.bottom])
            .padding(0.3);

        // Clean up any existing tooltips
        d3.selectAll(".d3-tooltip").remove();

        const tooltip = d3.select("body").append("div")
            .attr("class", "d3-tooltip absolute bg-gray-900/90 backdrop-blur text-white text-[10px] rounded-lg py-1.5 px-3 pointer-events-none opacity-0 transition-opacity z-50 shadow-xl border border-gray-700")
            .style("display", "none");

        svg.append("g")
            .attr("fill", "#9B2247")
            .selectAll("rect")
            .data(data)
            .join("rect")
            .attr("x", x(0))
            .attr("y", d => y(d.name))
            .attr("width", d => Math.max(0, x(d.value) - x(0)))
            .attr("height", y.bandwidth())
            .attr("rx", 4)
            .on("mouseover", (event, d) => {
                d3.select(event.target).attr("fill", "#7A1C39");
                tooltip.style("opacity", "1").style("display", "block").text(`${d.name}: ${d.value} artículos`);
            })
            .on("mousemove", (event) => {
                tooltip.style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", (event) => {
                d3.select(event.target).attr("fill", "#9B2247");
                tooltip.style("opacity", "0").style("display", "none");
            });

        svg.append("g")
            .attr("fill", "black")
            .attr("text-anchor", "start")
            .attr("font-size", "10px")
            .selectAll("text")
            .data(data)
            .join("text")
            .attr("x", d => x(d.value) + 4)
            .attr("y", d => y(d.name) + y.bandwidth() / 2)
            .attr("dy", "0.35em")
            .text(d => d.value);

        // Y Axis with labels
        svg.append("g")
            .call(d3.axisLeft(y).tickSize(0))
            .attr("transform", `translate(${margin.left},0)`)
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("text")
                .attr("fill", "#4B5563")
                .attr("font-weight", "500")
                .style("text-anchor", "end")
                .attr("dx", "-6")
            );
    }

    function renderLawArticles(articles, highlightQuery) {
        const list = document.getElementById('law-articles-list');
        if (!list) return;

        if (articles.length === 0) {
            list.innerHTML = `<div class="text-center py-8 text-gray-400 text-sm">No se encontraron artículos que coincidan con la búsqueda.</div>`;
            return;
        }

        const primary = articles.filter(item => !relatedDocumentLabel(item));
        const related = articles.filter(item => relatedDocumentLabel(item));
        // Card pagination must not truncate navigation through the instrument.
        const navigationQuery = (highlightQuery || '').toLowerCase().trim();
        const navigationArticles = navigationQuery.length > 2
            ? currentLawArticles.filter(item => [item.texto, item.articulo_label, item.titulo_nombre, item.capitulo_nombre].some(value => value?.toLowerCase().includes(navigationQuery)))
            : currentLawArticles;
        currentModalList = [...navigationArticles.filter(item => !relatedDocumentLabel(item)), ...navigationArticles.filter(item => relatedDocumentLabel(item))];

        const renderCard = item => {
            const relatedLabel = relatedDocumentLabel(item);
            const highlightedText = highlightText(getTextPreview(item.texto, 900), highlightQuery);
            const hasNote = !!getNote(item.id);
            const { loggedIn, fav: isFav, title: favTitle } = getFavoriteUiState(item.id);
            const bookmarkIcon = isFav
                ? `<svg class="w-3.5 h-3.5 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>`
                : (!loggedIn
                    ? `<span class="w-6 h-6 rounded-full bg-white border border-guinda/20 text-guinda flex items-center justify-center shadow-sm"><svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v2H5a1 1 0 00-1 1v5a2 2 0 002 2h8a2 2 0 002-2V9a1 1 0 00-1-1h-1V6a4 4 0 00-4-4zm-2 6V6a2 2 0 114 0v2H8z" clip-rule="evenodd"></path></svg></span>`
                    : `<svg class="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>`);
            const isSelected = compareSelection.includes(item.id);
            const compareColor = isSelected ? 'text-guinda' : (compareSelection.length >= 2 ? 'text-gray-100' : 'text-gray-300 hover:text-guinda');
            const compareBg = isSelected ? 'bg-guinda/10' : '';

            return `
            <div class="relative bg-white border ${isSelected ? 'border-guinda/30' : 'border-gray-100'} rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer result-item${relatedLabel ? ' related-document-card' : ''}" data-id="${item.id}">
                ${relatedLabel ? `<div class="related-document-badge-row"><span class="related-document-badge">${relatedLabel}</span></div>` : ''}
                <div class="flex items-center justify-between mb-2 pr-14">
                    <span class="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        ${item.articulo_label}
                        ${hasNote ? '<span class="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" title="Tiene nota"></span>' : ''}
                    </span>
                    <span class="text-[10px] text-gray-400 font-medium text-right ml-2 line-clamp-2">${[item.titulo_nombre, item.capitulo_nombre].filter(Boolean).join(' · ')}</span>
                </div>
                <p class="reader-preview text-gray-600">${highlightedText}</p>${getTextPreview(item.texto, 100000).length > 900 ? '<span class="lr-read-more">Seguir leyendo →</span>' : ''}
                <button class="bookmark-card-btn absolute top-3 right-9 p-1 ${loggedIn ? 'text-gray-300 hover:text-guinda' : 'text-guinda'} transition-colors" data-id="${item.id}" title="${favTitle}">${bookmarkIcon}</button>
                <button class="compare-card-btn absolute top-3 right-3 p-1 ${compareColor} ${compareBg} rounded transition-colors" data-id="${item.id}" title="Comparar artículo">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/></svg>
                </button>
            </div>
            `;
        };
        list.innerHTML = primary.map(renderCard).join('') + (related.length ? `
            <section class="related-documents" aria-labelledby="related-documents-title">
                <div class="related-documents-intro">
                    <h2 id="related-documents-title" class="related-documents-title">Documentos relacionados</h2>
                    <p class="related-documents-description">Documentos complementarios que acompañan al instrumento. Se muestran separados de su articulado.</p>
                </div>
                <div class="space-y-4">${related.map(renderCard).join('')}</div>
            </section>
        ` : '');

        lawOutlineSync?.();
        document.querySelectorAll('#law-articles-list .result-item').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('.bookmark-card-btn') || e.target.closest('.compare-card-btn')) return;
                openDetail(el.dataset.id);
            });
        });
        document.querySelectorAll('#law-articles-list .bookmark-card-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const lawSearchInput = document.getElementById('law-search-input');
                if (!toggleFavorite(btn.dataset.id)) return;
                const q = lawSearchInput ? lawSearchInput.value.toLowerCase().trim() : '';
                renderLawArticles(currentLawArticles.slice(0, 50), q);
            });
        });
        document.querySelectorAll('#law-articles-list .compare-card-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const idx = compareSelection.indexOf(id);
                if (idx >= 0) {
                    compareSelection.splice(idx, 1);
                } else if (compareSelection.length < 2) {
                    compareSelection.push(id);
                }
                updateCompareBar();
                const q = document.getElementById('law-search-input')?.value.toLowerCase().trim() || '';
                renderLawArticles(currentLawArticles.slice(0, 50), q);
            });
        });
    }

    function getRelevanceBadge(score, maxScore) {
        const ratio = maxScore > 0 ? score / maxScore : 0;
        if (ratio >= 0.6) return `<span class="text-[9px] font-bold text-guinda bg-guinda/10 px-1.5 py-0.5 rounded-full">Alta</span>`;
        if (ratio >= 0.25) return `<span class="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Media</span>`;
        return `<span class="text-[9px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full">Baja</span>`;
    }

    function exportToCSV(data, filename) {
        const headers = ['Ley', 'Artículo', 'Texto'];
        const rows = data.map(item => [
            `"${item.ley_origen}"`,
            `"${item.articulo_label}"`,
            `"${item.texto.replace(/"/g, '""')}"` // Escape quotes
        ]);

        const csvContent = [
            headers.join(';'),
            ...rows.map(r => r.join(';'))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Search History Helpers
    function saveToHistory(query) {
        const history = getHistory().filter(q => q !== query);
        history.unshift(query);
        searchHistory = history.slice(0, 10);
    }

    function getHistory() {
        return searchHistory;
    }

    // Quick Filters
    if (quickFilters) {
        quickFilters.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                searchInput.value = e.target.textContent;
                searchInput.dispatchEvent(new Event('input'));
            }
        });
    }

    // ── Autocomplete helpers ───────────────────────────────────────────────────
    function normalizeText(str) {
        return str.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function highlightMatch(text, query) {
        const normText = normalizeText(text);
        const normQuery = normalizeText(query);
        const idx = normText.indexOf(normQuery);
        if (idx === -1) return escapeHtml(text);
        return escapeHtml(text.slice(0, idx))
            + `<mark class="bg-guinda/10 text-guinda font-semibold not-italic">${escapeHtml(text.slice(idx, idx + query.length))}</mark>`
            + escapeHtml(text.slice(idx + query.length));
    }

    function escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ── Search Input Listener ─────────────────────────────────────────────────
    if (searchInput) {
        // Autocomplete Container
        const autocompleteContainer = document.createElement('div');
        autocompleteContainer.id = 'autocomplete-results';
        autocompleteContainer.className = 'absolute w-full bg-white border border-gray-100 rounded-2xl shadow-xl mt-2 hidden z-50 overflow-hidden max-h-96 overflow-y-auto';
        searchInput.parentNode.appendChild(autocompleteContainer);

        // Keyboard navigation state
        let activeIndex = -1;

        function getNavigableItems() {
            return Array.from(autocompleteContainer.querySelectorAll('[data-navigable]'));
        }

        function setActiveItem(index) {
            const items = getNavigableItems();
            items.forEach((el, i) => {
                el.classList.toggle('bg-gray-50', i === index);
                el.setAttribute('aria-selected', i === index ? 'true' : 'false');
            });
            activeIndex = index;
            if (items[index]) items[index].scrollIntoView({ block: 'nearest' });
        }

    function closeAutocomplete() {
        autocompleteContainer.classList.add('hidden');
        activeIndex = -1;
    }

    function getAutocompleteArticlePool() {
        if (currentLawArticles.length > 0) return currentLawArticles;
        if (currentSearchResults.length > 0) return currentSearchResults;
        return [];
    }

        // Hide on click outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !autocompleteContainer.contains(e.target)) {
                closeAutocomplete();
            }
        });

        // Keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
            if (autocompleteContainer.classList.contains('hidden')) return;
            const items = getNavigableItems();
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveItem(Math.min(activeIndex + 1, items.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveItem(Math.max(activeIndex - 1, -1));
                if (activeIndex === -1) items.forEach(el => el.classList.remove('bg-gray-50'));
            } else if (e.key === 'Enter' && activeIndex >= 0) {
                e.preventDefault();
                items[activeIndex]?.click();
            } else if (e.key === 'Enter') {
                closeAutocomplete(); // the search itself already runs as the user types
            } else if (e.key === 'Escape') {
                closeAutocomplete();
            }
        });

        // Render autocomplete dropdown
        function renderAutocomplete(query) {
            activeIndex = -1;
            const sections = [];

            if (!query) {
                // Show recent history
                const history = getHistory();
                if (history.length === 0) { closeAutocomplete(); return; }
                sections.push({
                    label: 'Búsquedas recientes',
                    extra: `<button id="clear-all-history" class="text-gray-300 hover:text-guinda transition-colors text-[9px] normal-case tracking-normal">Borrar todo</button>`,
                    items: history.slice(0, 7).map(q => ({
                        html: `
                            <svg class="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <span class="text-sm text-gray-600 truncate flex-1">${escapeHtml(q)}</span>
                            <button class="remove-history-item text-gray-200 hover:text-gray-500 transition-colors text-base leading-none flex-shrink-0" data-query="${escapeHtml(q)}">×</button>`,
                        attrs: `data-navigable data-query="${escapeHtml(q)}" class="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors history-item"`,
                    }))
                });
            } else {
                // Law-level suggestions
                const lawMatches = cachedSummaries
                    .filter(s => normalizeText(s.titulo).includes(normalizeText(query)))
                    .slice(0, 4);

                if (lawMatches.length > 0) {
                    sections.push({
                        label: 'Leyes',
                        items: lawMatches.map(s => ({
                            html: `
                                <svg class="w-4 h-4 text-guinda opacity-50 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                <span class="text-sm text-gray-700 font-medium truncate">${highlightMatch(s.titulo, query)}</span>`,
                            attrs: `data-navigable data-law-title="${escapeHtml(s.titulo)}" class="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors suggestion-law"`,
                        }))
                    });
                }

                // In Supabase mode there is no full in-memory corpus.
                // Restrict article suggestions to the currently open law or current results page.
                const allArticles = getAutocompleteArticlePool();
                const normQ = normalizeText(query);
                const artMatches = [];
                for (const art of allArticles) {
                    if (artMatches.length >= 4) break;
                    const label = art.articulo_label || '';
                    const titulo = art.titulo_nombre || '';
                    const capitulo = art.capitulo_nombre || '';
                    const matchField = [label, titulo, capitulo].find(f => f && normalizeText(f).includes(normQ));
                    if (matchField) {
                        artMatches.push({ art, matchField });
                    }
                }

                if (artMatches.length > 0) {
                    sections.push({
                        label: currentLawArticles.length > 0 ? 'Artículos de esta ley' : 'Artículos visibles',
                        items: artMatches.map(({ art, matchField }) => ({
                            html: `
                                <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                <div class="flex flex-col min-w-0">
                                    <span class="text-sm text-gray-700 font-medium truncate">${highlightMatch(matchField, query)}</span>
                                    <span class="text-[11px] text-gray-400 truncate">${escapeHtml(art.ley_origen)}</span>
                                </div>`,
                            attrs: `data-navigable data-article-id="${escapeHtml(art.id)}" class="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors suggestion-article"`,
                        }))
                    });
                }
            }

            if (sections.length === 0) { closeAutocomplete(); return; }

            autocompleteContainer.innerHTML = sections.map(sec => `
                <div class="px-4 py-2 text-[10px] uppercase tracking-widest text-gray-400 font-bold bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span>${sec.label}</span>
                    ${sec.extra || ''}
                </div>
                ${sec.items.map(it => `<div ${it.attrs}>${it.html}</div>`).join('')}
            `).join('');

            autocompleteContainer.classList.remove('hidden');

            // Bind: clear all history
            document.getElementById('clear-all-history')?.addEventListener('click', (e) => {
                e.stopPropagation();
                searchHistory = [];
                closeAutocomplete();
            });

            // Bind: history items
            autocompleteContainer.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (e.target.classList.contains('remove-history-item')) {
                        e.stopPropagation();
                        const q = e.target.dataset.query;
                        const updated = getHistory().filter(h => h !== q);
                        searchHistory = updated;
                        item.remove();
                        if (autocompleteContainer.querySelectorAll('.history-item').length === 0) closeAutocomplete();
                        return;
                    }
                    searchInput.value = item.dataset.query;
                    searchInput.dispatchEvent(new Event('input'));
                    closeAutocomplete();
                });
            });

            // Bind: law suggestions
            autocompleteContainer.querySelectorAll('.suggestion-law').forEach(item => {
                item.addEventListener('click', () => {
                    const title = item.dataset.lawTitle;
                    const law = cachedSummaries.find(l => l.titulo === title);
                    if (law) {
                        openLawDetail(law);
                        closeAutocomplete();
                        searchInput.value = '';
                    }
                });
            });

            // Bind: article suggestions
            autocompleteContainer.querySelectorAll('.suggestion-article').forEach(item => {
                item.addEventListener('click', () => {
                    const articleId = item.dataset.articleId;
                    if (articleId) {
                        openDetail(articleId);
                        closeAutocomplete();
                        searchInput.value = '';
                    }
                });
            });
        }

        // Show history on focus (empty input)
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length > 0) return;
            renderAutocomplete('');
        });

        // Prevent document click handler from closing autocomplete when user
        // taps/clicks directly on the search input (covers both desktop and mobile).
        searchInput.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!searchInput.value.trim()) {
                renderAutocomplete('');
            }
        });

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            cancelPendingSearch();
            releaseAcervo();

            if (query.length > 2) {
                // UI Transition to "Search Mode"
                destroyTOC();
                if (lawDetailContainer) lawDetailContainer.classList.add('hidden', 'opacity-0');
                heroSection.classList.add('hidden');
                heroSection.classList.remove('block');
                quickFilters.classList.add('hidden');
                statsMinimal.classList.add('hidden');

                mainContainer.classList.remove('justify-center', 'pt-24');
                mainContainer.classList.add('pt-8');

                resultsContainer.classList.remove('hidden');
                setTimeout(() => resultsContainer.classList.remove('opacity-0'), 50);

                if (loadingIndicator) loadingIndicator.classList.remove('hidden');
                showSkeletons();

                // Autocomplete suggestions
                renderAutocomplete(query);

                // Debounced search
                clearTimeout(searchDebounceTimer);
                searchDebounceTimer = setTimeout(async () => {
                    currentSearchQuery = query;
                    currentPage = 1;
                    currentFilters = { type: 'all', law: 'all', artNum: '' };
                    saveToHistory(query);
                    await renderResults();
                }, 250);

            } else if (query.length === 0) {
                // Reset to "Hero Mode"
                destroyTOC();
                if (lawDetailContainer) lawDetailContainer.classList.add('hidden', 'opacity-0');
                heroSection.classList.remove('hidden');
                quickFilters.classList.remove('hidden');
                statsMinimal.classList.remove('hidden');

                mainContainer.classList.add('justify-center', 'pt-24');
                mainContainer.classList.remove('pt-8');

                resultsContainer.classList.add('hidden', 'opacity-0');
                resultsContainer.innerHTML = '';

                // Remove sibling pagination/filters (not children of resultsContainer)
                document.querySelector('.pagination-nav')?.remove();
                document.getElementById('search-filters')?.remove();

                // Reset search state
                currentPage = 1;
                currentSearchResults = [];
                currentSearchQuery = '';

                // Mostrar historial si existe, en lugar de cerrar el autocomplete
                renderAutocomplete('');
            }
        });
    }



    // ── Favorites helpers (Supabase only) ──────────────────────────────────────
    function getFavorites() {
        if (!isLoggedIn() || dbFavoritesSet === null) return [];
        return [...dbFavoritesSet];
    }
    function isFavorite(id) {
        if (!isLoggedIn() || dbFavoritesSet === null) return false;
        return dbFavoritesSet.has(id);
    }
    function toggleFavorite(id) {
        if (!isLoggedIn() || dbFavoritesSet === null) {
            showToast('Inicia sesión para guardar favoritos', '🔐', 'bg-gray-800');
            openAuthModal();
            return false;
        }

        if (dbFavoritesSet.has(id)) {
            dbFavoritesSet.delete(id);
            dbRemoveFavorite(id).catch(e => console.error('[Auth] Error removing favorite:', e));
        } else {
            dbFavoritesSet.add(id);
            dbAddFavorite(id).catch(e => console.error('[Auth] Error adding favorite:', e));
        }
        updateFavoritesBtn();
        return true;
    }
    function updateFavoritesBtn() {
        const count = getFavorites().length;
        const notesCount = Object.keys(getAllNotes()).length;
        document.querySelectorAll('#nav-favorites, #mobile-nav-favorites').forEach(btn => {
            if (!btn) return;
            btn.classList.toggle('hidden', count === 0 && notesCount === 0);
            btn.querySelectorAll('.fav-count').forEach(el => el.textContent = count);
        });
    }

    // ── Notes helpers (Supabase only) ──────────────────────────────────────────
    function getAllNotes() {
        if (!isLoggedIn() || dbNotesMap === null) return {};
        return Object.fromEntries(dbNotesMap);
    }
    function getNote(id) {
        if (!isLoggedIn() || dbNotesMap === null) return '';
        return dbNotesMap.get(id) || '';
    }
    function saveNote(id, text) {
        if (!isLoggedIn() || dbNotesMap === null) {
            showToast('Inicia sesión para guardar notas', '🔐', 'bg-gray-800');
            openAuthModal();
            return false;
        }
        if (text.trim()) dbNotesMap.set(id, text.trim());
        else dbNotesMap.delete(id);
        dbSaveNote(id, text).catch(e => console.error('[Auth] Error saving note:', e));
        return true;
    }
    // ── End Notes/Favorites helpers ───────────────────────────────────────────

    function getFavoriteUiState(id) {
        const loggedIn = isLoggedIn();
        const fav = isFavorite(id);
        return {
            loggedIn,
            fav,
            title: loggedIn
                ? (fav ? 'Quitar de favoritos' : 'Guardar en favoritos')
                : 'Inicia sesión para guardar favoritos',
        };
    }

    // ── Exportar notas y favoritos ─────────────────────────────────────────────
    function exportItemsAsHTML(items, title, includeNotes = false) {
        const today = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
        const rows = items.map(item => {
            const note = includeNotes ? getNote(item.id) : '';
            return `
            <div style="margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid #f0f0f0;page-break-inside:avoid;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                    <span style="font-size:10px;font-weight:700;color:#9B2247;background:#fdf2f5;padding:2px 8px;border-radius:99px;text-transform:uppercase;letter-spacing:0.08em;">${item.ley_origen}</span>
                    ${item.titulo_nombre ? `<span style="font-size:10px;color:#6b7280;">${item.titulo_nombre}</span>` : ''}
                </div>
                <h3 style="font-size:15px;font-weight:700;color:#111;margin:0 0 8px;">${item.articulo_label}</h3>
                <p style="font-size:13px;color:#374151;line-height:1.7;margin:0 0 ${note ? '10px' : '0'};">${escapeHtml(getTextPreview(item.texto, 800))}</p>
                ${note ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 12px;margin-top:8px;">
                    <span style="font-size:10px;font-weight:700;color:#92400e;display:block;margin-bottom:4px;">📝 Mi nota</span>
                    <p style="font-size:12px;color:#78350f;margin:0;line-height:1.6;">${note}</p>
                </div>` : ''}
            </div>`;
        }).join('');

        const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
        <title>${title} — SENER</title>
        <style>
            body{font-family:'Noto Sans',Arial,sans-serif;max-width:860px;margin:40px auto;padding:0 24px;color:#1f2937;}
            h1{font-size:22px;font-weight:700;color:#9B2247;margin-bottom:4px;}
            .meta{font-size:11px;color:#9ca3af;margin-bottom:32px;padding-bottom:16px;border-bottom:2px solid #f3f4f6;}
            @media print{body{margin:16px;}h1{font-size:18px;}}
        </style></head><body>
        <h1>${title}</h1>
        <div class="meta">Secretaría de Energía · Gobierno de México · Exportado el ${today} · ${items.length} artículo${items.length !== 1 ? 's' : ''}</div>
        ${rows}
        </body></html>`;

        const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${title.replace(/\s+/g, '_')}_${today.replace(/\s/g, '-')}.html`;
        a.click();
        URL.revokeObjectURL(a.href);
    }

    function exportItemsAsCSV(items, filename, includeNotes = false) {
        const headers = ['Ley', 'Artículo', 'Título', 'Texto', ...(includeNotes ? ['Nota personal'] : [])];
        const rows = items.map(item => [
            `"${(item.ley_origen || '').replace(/"/g, '""')}"`,
            `"${(item.articulo_label || '').replace(/"/g, '""')}"`,
            `"${(item.titulo_nombre || '').replace(/"/g, '""')}"`,
            `"${(item.texto || '').replace(/"/g, '""')}"`,
            ...(includeNotes ? [`"${getNote(item.id).replace(/"/g, '""')}"`] : [])
        ]);
        const csvContent = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    }
    // ── Fin Exportar ───────────────────────────────────────────────────────────

    async function showFavoritesView() {
        setActiveNav('nav-favorites');
        setHash(null);
        destroyTOC();
        showGlobalSearch();
        const favIds = getFavorites();
        heroSection.classList.add('hidden');
        quickFilters.classList.add('hidden');
        statsMinimal.classList.add('hidden');
        if (lawDetailContainer) lawDetailContainer.classList.add('hidden', 'opacity-0');
        document.getElementById('analisis-container')?.classList.add('hidden', 'opacity-0');
        document.getElementById('admin-ingest-container')?.classList.add('hidden', 'opacity-0');
        mainContainer.classList.remove('justify-center', 'pt-24');
        mainContainer.classList.add('pt-8');
        resultsContainer.classList.remove('hidden');
        setTimeout(() => resultsContainer.classList.remove('opacity-0'), 50);

        const existingFilters = document.getElementById('search-filters');
        if (existingFilters) existingFilters.remove();
        // La pagination-nav es sibling de results-container (no hijo), hay que limpiarla explícitamente
        document.querySelector('.pagination-nav')?.remove();

        if (favIds.length === 0) {
            resultsContainer.innerHTML = `<div class="text-center py-16 text-gray-400 text-sm">No tienes artículos guardados aún.</div>`;
            return;
        }
        
        resultsContainer.innerHTML = `<div class="w-full flex justify-center py-12"><div class="animate-spin h-6 w-6 border-2 border-guinda border-t-transparent rounded-full"></div></div>`;
        const promises = favIds.map(id => getArticleById(id));
        const items = (await Promise.all(promises)).filter(Boolean);

        currentModalList = items;
        currentPage = 1;

        // ── Render estático: cabecera + contenedor de tarjetas ─────────────────
        resultsContainer.innerHTML = `
            <div class="w-full mb-6 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h2 class="text-xl font-head font-bold text-gray-800 mb-1 flex items-center gap-2">
                        <svg class="w-5 h-5 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                        Mis Favoritos
                    </h2>
                    <p class="text-xs text-gray-400">${items.length} artículo${items.length !== 1 ? 's' : ''} guardado${items.length !== 1 ? 's' : ''}</p>
                </div>
                <div class="flex gap-2 flex-wrap">
                    <div class="relative group/export">
                        <button class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:border-guinda hover:text-guinda transition-all shadow-sm" id="export-favs-btn">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                            Exportar
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                        </button>
                        <div id="export-favs-menu" class="hidden absolute right-0 top-full mt-1 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden w-52 z-20">
                            <div class="px-4 py-2 bg-gray-50/80 border-b border-gray-50">
                                <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Exportar favoritos</span>
                            </div>
                            <button id="export-favs-html" class="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                                <span class="w-6 h-6 rounded-lg flex items-center justify-center bg-blue-50"><svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></span>
                                Descargar HTML (imprimible)
                            </button>
                            <button id="export-favs-csv" class="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors">
                                <span class="w-6 h-6 rounded-lg flex items-center justify-center bg-green-50"><svg class="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18M10 3v18M14 3v18"/></svg></span>
                                Descargar CSV (Excel)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div id="fav-cards" class="space-y-4"></div>
        `;

        // Wire export buttons (una sola vez)
        const exportFavsBtn = document.getElementById('export-favs-btn');
        const exportFavsMenu = document.getElementById('export-favs-menu');
        if (exportFavsBtn && exportFavsMenu) {
            exportFavsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                exportFavsMenu.classList.toggle('hidden');
            });
            document.addEventListener('click', function hideExportMenu(e) {
                if (!e.target.closest('#export-favs-btn') && !e.target.closest('#export-favs-menu')) {
                    exportFavsMenu.classList.add('hidden');
                    document.removeEventListener('click', hideExportMenu);
                }
            });
        }
        document.getElementById('export-favs-html')?.addEventListener('click', () => {
            exportFavsMenu?.classList.add('hidden');
            exportItemsAsHTML(items, 'Mis Favoritos SENER', false);
            showToast('¡Exportando HTML!', '📄', 'bg-blue-600');
        });
        document.getElementById('export-favs-csv')?.addEventListener('click', () => {
            exportFavsMenu?.classList.add('hidden');
            exportItemsAsCSV(items, 'favoritos_SENER.csv', false);
            showToast('¡Exportando CSV!', '📊', 'bg-green-700');
        });

        // ── Render paginado de tarjetas ────────────────────────────────────────
        const renderFavPage = () => {
            const favCards = document.getElementById('fav-cards');
            if (!favCards) return;

            const start = (currentPage - 1) * itemsPerPage;
            const pageItems = items.slice(start, start + itemsPerPage);

            favCards.innerHTML = pageItems.map(item => {
                const isSelected = compareSelection.includes(item.id);
                const cmpColor = isSelected
                    ? 'text-guinda bg-guinda/10'
                    : (compareSelection.length >= 2 ? 'text-gray-100 cursor-not-allowed' : 'text-gray-300 hover:text-guinda hover:bg-guinda/10');
                const hasNote = !!getNote(item.id);
                return `
                <div class="group relative bg-white border border-transparent hover:border-gray-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300 result-item" data-id="${item.id}">
                    <div class="flex items-center gap-2 mb-2 flex-wrap">
                        <span class="text-[10px] font-bold text-guinda uppercase tracking-wider bg-guinda/5 px-2 py-0.5 rounded-full">${item.ley_origen}</span>
                        <span class="text-[10px] text-gray-400 truncate max-w-xs md:max-w-[180px]">${[item.titulo_nombre, item.capitulo_nombre].filter(Boolean).join(' · ')}</span>
                        <div class="ml-auto flex items-center gap-1.5 flex-shrink-0">
                            ${hasNote ? '<span class="w-1.5 h-1.5 bg-amber-400 rounded-full" title="Tiene nota personal"></span>' : ''}
                            <button class="compare-card-btn p-1.5 rounded-full transition-colors focus:outline-none ${cmpColor}" data-id="${item.id}" title="Seleccionar para comparar">
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/></svg>
                            </button>
                        </div>
                    </div>
                    <h3 class="text-lg font-serif font-bold text-gray-800 mb-2 group-hover:text-guinda transition-colors cursor-pointer">${item.articulo_label}</h3>
                    <p class="text-sm text-gray-500 font-light leading-relaxed line-clamp-3">${escapeHtml(getTextPreview(item.texto))}</p>
                </div>`;
            }).join('');

            // Clic en tarjeta para abrir detalle
            favCards.querySelectorAll('.result-item').forEach(el => {
                el.addEventListener('click', (e) => {
                    if (e.target.closest('.compare-card-btn')) return;
                    openDetail(el.dataset.id);
                });
            });

            // Clic en botón de comparación
            favCards.querySelectorAll('.compare-card-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.dataset.id;
                    const idx = compareSelection.indexOf(id);
                    if (idx >= 0) compareSelection.splice(idx, 1);
                    else if (compareSelection.length < 2) compareSelection.push(id);
                    updateCompareBar();
                    refreshCompareButtons();
                });
            });

            renderPaginationControls(items.length, 'fav-cards', renderFavPage);
        };

        renderFavPage();
    }

    // Compare helpers
    function updateCompareBar() {
        const rc = document.getElementById('reading-controls');
        let bar = document.getElementById('compare-bar');
        if (compareSelection.length === 0) {
            bar?.remove();
            // Restore reading controls position
            if (rc) { rc.classList.remove('bottom-16'); rc.classList.add('bottom-6'); }
            return;
        }
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'compare-bar';
            document.body.appendChild(bar);
        }
        // Push desktop reading controls up so they don't overlap the bar
        if (rc) { rc.classList.remove('bottom-6'); rc.classList.add('bottom-16'); }
        bar.className = 'fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-2xl py-3 px-6 flex items-center justify-between';
        bar.innerHTML = `
            <div class="flex items-center gap-3">
                <svg class="w-4 h-4 text-guinda" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/></svg>
                <span class="text-xs font-bold text-gray-700">${compareSelection.length} de 2 seleccionados</span>
                ${compareSelection.length < 2 ? '<span class="text-xs text-gray-400">Selecciona un artículo más para comparar</span>' : ''}
            </div>
            <div class="flex items-center gap-2">
                <button id="compare-clear-btn" class="text-xs text-gray-400 hover:text-guinda transition-colors px-3 py-1.5">Limpiar</button>
                ${compareSelection.length === 2
                ? `<button id="compare-go-btn" class="px-4 py-2 bg-guinda text-white text-xs font-bold rounded-full hover:bg-guinda/90 transition-colors">Comparar →</button>`
                : ''}
            </div>
        `;
        document.getElementById('compare-clear-btn')?.addEventListener('click', () => {
            compareSelection = [];
            updateCompareBar();
            refreshCompareButtons();
        });
        document.getElementById('compare-go-btn')?.addEventListener('click', () => {
            openCompare(compareSelection[0], compareSelection[1]);
        });
    }

    async function openCompare(id1, id2) {
        const item1 = await getArticleById(id1);
        const item2 = await getArticleById(id2);
        if (!item1 || !item2) return;
        const compareModal = document.getElementById('compare-modal');
        const compareContent = document.getElementById('compare-content');
        const comparePanel = document.getElementById('compare-panel');
        if (!compareModal || !compareContent) return;

        const renderItem = (item) => `
            <div class="flex flex-col">
                <div class="mb-4 p-3 bg-guinda/5 rounded-xl border border-guinda/10">
                    <span class="text-[10px] font-bold text-guinda uppercase tracking-wider block mb-1">${item.ley_origen}</span>
                    <h4 class="font-bold text-gray-800 text-sm mb-0.5">${item.articulo_label}</h4>
                    <span class="text-xs text-gray-400">${item.titulo_nombre || ''} ${item.capitulo_nombre ? '· ' + item.capitulo_nombre : ''}</span>
                </div>
                <div class="text-sm text-gray-700 font-serif leading-relaxed">
                    ${item.texto.split('\n\n').map(p => `<p class="mb-3">${p}</p>`).join('')}
                </div>
            </div>`;

        compareContent.innerHTML = renderItem(item1) + renderItem(item2);
        compareModal.classList.remove('hidden');
        compareModal.classList.add('flex');
        
        if (typeof anime !== 'undefined') {
            comparePanel?.classList.remove('scale-95', 'opacity-0');
            comparePanel?.classList.add('scale-100', 'opacity-100');
            anime({
                targets: comparePanel,
                scale: [0.9, 1],
                opacity: [0, 1],
                easing: 'easeOutElastic(1, .6)',
                duration: 800
            });
        } else {
            setTimeout(() => {
                comparePanel?.classList.remove('scale-95', 'opacity-0');
                comparePanel?.classList.add('scale-100', 'opacity-100');
            }, 10);
        }

        // Compare share button wiring
        const cShareBtn = document.getElementById('compare-share-btn');
        const cShareMenu = document.getElementById('compare-share-menu');
        const cShareTextBtn = document.getElementById('compare-share-text-btn');
        if (cShareBtn && cShareMenu) {
            cShareBtn.onclick = (e) => {
                e.stopPropagation();
                cShareMenu.classList.toggle('hidden');
            };
            document.addEventListener('click', function hideCShareMenu(e) {
                if (!e.target.closest('#compare-share-menu-wrapper')) {
                    cShareMenu.classList.add('hidden');
                    document.removeEventListener('click', hideCShareMenu);
                }
            });
        }
        if (cShareTextBtn) cShareTextBtn.onclick = () => { cShareMenu?.classList.add('hidden'); shareComparisonText(item1, item2); };
    }

    function closeCompareModal() {
        const compareModal = document.getElementById('compare-modal');
        const comparePanel = document.getElementById('compare-panel');
        comparePanel?.classList.remove('scale-100', 'opacity-100');
        comparePanel?.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            compareModal?.classList.add('hidden');
            compareModal?.classList.remove('flex');
        }, 300);
    }

    // Actualiza el estado visual de todos los botones de comparación en el DOM
    // sin re-renderizar la vista completa. Usado tras cambios en compareSelection.
    function refreshCompareButtons() {
        document.querySelectorAll('.compare-card-btn').forEach(btn => {
            const id = btn.dataset.id;
            const isSelected = compareSelection.includes(id);
            const disabled = !isSelected && compareSelection.length >= 2;
            btn.classList.toggle('text-guinda', isSelected);
            btn.classList.toggle('bg-guinda/10', isSelected);
            btn.classList.toggle('text-gray-100', disabled);
            btn.classList.toggle('cursor-not-allowed', disabled);
            btn.classList.toggle('text-gray-300', !isSelected && !disabled);
            btn.classList.toggle('hover:text-guinda', !isSelected && !disabled);
            btn.classList.toggle('hover:bg-guinda/10', !isSelected && !disabled);
        });
    }

    // ── WhatsApp Share ──────────────────────────────────────────────────────
    async function generateArticleImage(item) {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 500;
        const ctx = canvas.getContext('2d');

        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#9B2247');
        grad.addColorStop(1, '#6b1532');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Decorative circle
        ctx.beginPath();
        ctx.arc(canvas.width - 60, 60, 120, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.fill();

        // Law badge
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.beginPath();
        ctx.roundRect(40, 40, 20 + ctx.measureText(item.ley_origen).width + 16, 28, 14);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.fillText(item.ley_origen, 56, 59);

        // Article title
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px system-ui, sans-serif';
        const titleLines = wrapText(ctx, item.articulo_label, canvas.width - 80, 28);
        titleLines.forEach((line, i) => ctx.fillText(line, 40, 110 + i * 38));

        // Divider
        const dividerY = 110 + titleLines.length * 38 + 16;
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, dividerY);
        ctx.lineTo(canvas.width - 40, dividerY);
        ctx.stroke();

        // Article text snippet
        const snippetStart = dividerY + 24;
        const maxTextHeight = canvas.height - snippetStart - 60;
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.font = '16px Georgia, serif';
        const snippet = item.texto.replace(/\s+/g, ' ').trim().substring(0, 500);
        const textLines = wrapText(ctx, snippet, canvas.width - 80, 16);
        let linesDone = 0;
        for (const line of textLines) {
            if (linesDone * 24 > maxTextHeight) {
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.font = '13px system-ui, sans-serif';
                ctx.fillText('...', 40, snippetStart + linesDone * 24);
                break;
            }
            ctx.fillText(line, 40, snippetStart + linesDone * 24);
            linesDone++;
        }

        // Footer
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fillRect(0, canvas.height - 44, canvas.width, 44);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText('Buscador de Leyes Energéticas · SENER', 40, canvas.height - 16);

        return canvas.toDataURL('image/png');
    }

    function wrapText(ctx, text, maxWidth, fontSize) {
        const words = text.split(' ');
        const lines = [];
        let current = '';
        for (const word of words) {
            const test = current ? current + ' ' + word : word;
            if (ctx.measureText(test).width > maxWidth && current) {
                lines.push(current);
                current = word;
            } else {
                current = test;
            }
        }
        if (current) lines.push(current);
        return lines;
    }

    async function shareArticleText(item) {
        const artUrl = `${location.origin}${location.pathname}#art-${encodeURIComponent(item.id)}`;
        const text = `📋 *${item.articulo_label}*\n🏛️ ${item.ley_origen}\n\n${item.texto.substring(0, 800)}${item.texto.length > 800 ? '...' : ''}\n\nVer artículo: ${artUrl}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: item.articulo_label,
                    text: text,
                    url: artUrl
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }
    }

    async function shareArticleImage(item) {
        const dataUrl = await generateArticleImage(item);
        // Try Web Share API first (mobile), else download
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'articulo.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                title: item.articulo_label,
                text: `${item.articulo_label} · ${item.ley_origen}`,
                files: [file]
            });
        } else {
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `${item.articulo_label.replace(/\s+/g, '_')}.png`;
            a.click();
        }
    }

    async function shareComparisonText(item1, item2) {
        const text = `⚖️ *Comparación de Artículos*\n\n` +
            `📋 *${item1.articulo_label}* – ${item1.ley_origen}\n${item1.texto.substring(0, 400)}${item1.texto.length > 400 ? '...' : ''}\n\n` +
            `📋 *${item2.articulo_label}* – ${item2.ley_origen}\n${item2.texto.substring(0, 400)}${item2.texto.length > 400 ? '...' : ''}`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Comparación de Artículos SENER',
                    text: text
                });
            } catch (err) {
                console.log('Error sharing:', err);
            }
        } else {
            const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
            window.open(url, '_blank');
        }
    }

    function shareArticleVia(item, platform) {
        const artUrl = `${location.origin}${location.pathname}#art-${encodeURIComponent(item.id)}`;
        const title = `${item.articulo_label} · ${item.ley_origen}`;
        const body = `📋 *${item.articulo_label}*\n🏛️ ${item.ley_origen}\n\n${item.texto.substring(0, 500)}${item.texto.length > 500 ? '...' : ''}\n\n${artUrl}`;
        const shortText = `${item.articulo_label} · ${item.ley_origen} — Marco Legal Energético SENER`;
        const map = {
            telegram: `https://t.me/share/url?url=${encodeURIComponent(artUrl)}&text=${encodeURIComponent(title)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shortText)}&url=${encodeURIComponent(artUrl)}`,
            email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`
        };
        if (map[platform]) window.open(map[platform], '_blank');
    }

    async function shareLawVia(law, platform) {
        const lawUrl = `${location.origin}${location.pathname}#ley-${encodeURIComponent(law.id)}`;
        const title = law.titulo;
        const resumen = law.resumen ? law.resumen.split('\n\n')[0].substring(0, 400) : `${law.articulos} artículos`;
        const body = `🏛️ *${law.titulo}*\n📅 Publicado: ${law.fecha}\n📖 ${law.articulos} artículos\n\n${resumen}\n\n${lawUrl}`;
        const shortText = `${law.titulo} — Marco Legal Energético SENER`;

        if (platform === 'whatsapp' && navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: body,
                    url: lawUrl
                });
                return;
            } catch (err) {
                console.log('Error sharing:', err);
            }
        }

        const map = {
            whatsapp: `https://wa.me/?text=${encodeURIComponent(body)}`,
            telegram: `https://t.me/share/url?url=${encodeURIComponent(lawUrl)}&text=${encodeURIComponent(title)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shortText)}&url=${encodeURIComponent(lawUrl)}`,
            email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`
        };
        if (map[platform]) window.open(map[platform], '_blank');
    }
    // ── End Share ────────────────────────────────────────────────────────────

    function showStatsView() {
        setHash(null);
        destroyTOC();
        hideAllViews();
        
        setActiveNav('nav-stats');
        mainContainer.classList.remove('justify-center', 'pt-24');
        mainContainer.classList.add('pt-8');
        
        if (!catalogLoaded) {
            resultsContainer.classList.remove('hidden');
            resultsContainer.innerHTML = `<div class="w-full flex justify-center py-16"><div class="animate-spin h-8 w-8 border-2 border-guinda border-t-transparent rounded-full"></div></div>`;
            return;
        }

        resultsContainer.classList.remove('hidden', 'opacity-0');
        statsView?.destroy();
        statsView = renderStatsView(resultsContainer, cachedSummaries, {
            onOpenLaw: law => openLawDetail(law),
            onOpenGroup: group => showLawsView({ ...acervoState, group, query: '' }),
        });
    }

    function showAyudaView() {
        setHash(null);
        destroyTOC();
        hideGlobalSearch();
        setActiveNav('nav-ayuda');
        heroSection.classList.add('hidden');
        quickFilters.classList.add('hidden');
        statsMinimal.classList.add('hidden');
        if (lawDetailContainer) lawDetailContainer.classList.add('hidden', 'opacity-0');
        document.getElementById('analisis-container')?.classList.add('hidden', 'opacity-0');
        document.getElementById('admin-ingest-container')?.classList.add('hidden', 'opacity-0');
        mainContainer.classList.remove('justify-center', 'pt-24');
        mainContainer.classList.add('pt-8');
        resultsContainer.classList.remove('hidden');
        setTimeout(() => resultsContainer.classList.remove('opacity-0'), 50);

        resultsContainer.innerHTML = `
            <div class="w-full max-w-4xl mx-auto animate-fade-in-up">
                <div class="text-center mb-16">
                    <span class="text-[10px] font-black text-guinda uppercase tracking-[0.3em] mb-4 block">Centro de Soporte y Guía</span>
                    <h2 class="text-4xl font-head font-bold text-gray-800 mb-6">¿Cómo podemos ayudarle?</h2>
                    <div class="w-20 h-1 bg-guinda mx-auto rounded-full opacity-20"></div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    <div class="bg-white p-8 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all">
                        <div class="w-12 h-12 bg-guinda/5 rounded-lg flex items-center justify-center text-guinda mb-6">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        </div>
                        <h3 class="text-lg font-bold text-gray-800 mb-3">Búsqueda Avanzada</h3>
                        <p class="text-sm text-gray-500 leading-relaxed">Utilice operadores para refinar sus resultados. Use <span class="font-mono text-guinda px-1 bg-guinda/5 rounded">"frase exacta"</span> para coincidencias literales o <span class="font-mono text-guinda px-1 bg-guinda/5 rounded">termino1 & termino2</span> para artículos que contengan ambos.</p>
                    </div>

                    <div class="bg-white p-8 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all">
                        <div class="w-12 h-12 bg-verde/10 rounded-lg flex items-center justify-center text-verde mb-6">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        </div>
                        <h3 class="text-lg font-bold text-gray-800 mb-3">Descarga de Fichas</h3>
                        <p class="text-sm text-gray-500 leading-relaxed">Cada artículo y ley cuenta con una opción de <span class="font-bold text-gray-700 italic">"Ver Original"</span> que le dirigirá al documento PDF oficial del Diario Oficial de la Federación.</p>
                    </div>
                </div>

                <div class="bg-white rounded-lg p-10 text-gray-800 border border-gray-200 shadow-sm relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-guinda/5 rounded-full -mr-32 -mt-32 blur-2xl"></div>
                    <div class="relative z-10 flex flex-col md:flex-row items-center gap-10">
                        <div class="flex-1">
                            <h3 class="text-2xl font-head font-bold mb-4">¿No encuentra lo que busca?</h3>
                            <p class="text-gray-500 text-sm leading-relaxed mb-6">Nuestro equipo técnico y jurídico está disponible para resolver dudas sobre el funcionamiento de la plataforma o la veracidad del corpus legal.</p>
                            <div class="flex flex-wrap gap-4">
                                <a href="mailto:soporte@sener.gob.mx" class="px-6 py-3 bg-guinda text-xs font-black uppercase tracking-widest rounded-full hover:bg-guinda-dk transition-colors shadow-lg shadow-guinda/20 text-white">Contactar Soporte</a>
                                <button class="px-6 py-3 border border-gray-200 text-xs font-black uppercase tracking-widest rounded-full hover:bg-gray-50 transition-colors text-gray-600">Manual de Usuario</button>
                            </div>
                        </div>
                        <div class="w-32 h-32 bg-guinda/5 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg class="w-16 h-16 text-guinda/40" fill="currentColor" viewBox="0 0 20 20"><path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"></path><path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z"></path></svg>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ...

    async function renderResults() {
        if (!resultsContainer) return;
        const request = ++searchRenderRequest;
        const query = currentSearchQuery;
        
        if (loadingIndicator) loadingIndicator.classList.remove('hidden');

        const filters = { ...currentFilters };
        // Collection and instrument facets filter by law id; the acervo model decides collections.
        const lawIds = filters.law !== 'all' ? [filters.law]
            : filters.type !== 'all' ? cachedSummaries.filter(law => getAcervoGroup(law) === filters.type).map(law => law.id) : null;
        const [{ data: results, total: totalResults, ranked }, lawCounts] = await Promise.all([
            searchArticles(query, { page: currentPage, limit: itemsPerPage, lawIds, artNum: filters.artNum }),
            searchCountsByLawId(query, { artNum: filters.artNum }),
        ]);
        if (request !== searchRenderRequest) return;
        currentSearchResults = results;
        currentModalList = results; // modal prev/next follows the visible page
        if (loadingIndicator) loadingIndicator.classList.add('hidden');
        document.getElementById('search-filters')?.remove();

        renderSearchResults(resultsContainer, {
            query, results, total: totalResults, ranked, lawCounts, summaries: cachedSummaries, filters,
            favoriteState: id => { const { fav, title } = getFavoriteUiState(id); return { fav, title }; },
            relationBadge: buildRelacionBadge,
            onOpenArticle: id => openDetail(id),
            onToggleFavorite: id => { if (toggleFavorite(id)) renderResults(); },
            onFilter: next => {
                currentFilters = { type: next.type, law: next.law, artNum: next.artNum };
                currentPage = 1;
                renderResults();
            },
        });
        if (results.length) renderPaginationControls(totalResults, 'results-container', renderResults);
        else if (resultsContainer.nextElementSibling?.classList.contains('pagination-nav')) resultsContainer.nextElementSibling.remove();
    }

    async function openDetail(id, { updateHistory = true } = {}) {
        const request = ++readerOpenRequest;
        // También preserva el regreso al usar Adelante del navegador desde el explorador.
        if (!explorerModalReturn && activeNavId === 'nav-analisis') {
            explorerModalReturn = explorerReturnContext(explorerViewHash);
        }
        const item = await getArticleById(id);
        if (request !== readerOpenRequest) return;
        if (!item) {
            if (detailModal.classList.contains('hidden')) explorerModalReturn = null;
            showToast('No se encontró este artículo en el acervo.', '!');
            return;
        }
        clearTimeout(closeModalTimer);
        const firstOpen = detailModal.classList.contains('hidden');
        if (firstOpen) readerReturnFocus = document.activeElement;

        modalLey.textContent = item.ley_origen;
        modalTitle.textContent = item.articulo_label;
        const relatedLabel = relatedDocumentLabel(item);
        const relatedNotice = document.getElementById('reader-related-notice');
        relatedNotice.hidden = !relatedLabel;
        relatedNotice.querySelector('.related-document-badge').textContent = relatedLabel || '';
        // Make law label clickable — goes to that law's detail
        modalLey.onclick = () => {
            const law = cachedSummaries.find(l => l.titulo === item.ley_origen);
            if (law) { closeModalFunc(); setTimeout(() => openLawDetail(law), 310); }
        };

        // 1. Detectar si el contenido es Markdown (especialmente si tiene tablas)
        const hasMarkdown = item.texto.includes('|') || item.texto.includes('**') || item.texto.includes('###');
        
        let finalHtml = '';
        if (/<(?:div|p|table|section|ul|ol|h[1-6])\b/i.test(item.texto)) {
            // Reviewed HTML already carries its paragraph/table structure.
            finalHtml = item.texto;
        } else if (hasMarkdown) {
            // Usar marked para el renderizado (especialmente para tablas)
            finalHtml = `<div class="prose-container">
                <div class="prose prose-sm max-w-none prose-p:leading-relaxed">
                    ${marked.parse(item.texto)}
                </div>
            </div>`;
        } else {
            // Lógica de formateo legal tradicional (Legacy)
            let cleanText = item.texto
                .replace(/\r\n/g, '\n')
                .replace(/\n\s*\n/g, '\n\n')
                .replace(/([a-z,;])\n([a-z])/ig, '$1 $2')
                .replace(/(?<=^|\s)(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX|XXI|XXII|XXIII|XXIV|XXV|XXVI|XXVII|XXVIII|XXIX|XXX)\.\s/g, '\n\n$1. ')
                .replace(/(?<=^|\s)([A-Z]+|\d+)\.\s/g, '\n\n$1. ')
                .replace(/(?<=^|\s)([a-z])\)\s/g, '\n\n$1) ')
                .replace(/\n{3,}/g, '\n\n');

            finalHtml = `<div class="text-gray-800 leading-[1.85] text-[0.92rem]" style="font-family:'Noto Sans',system-ui,sans-serif; text-align:justify; hyphens:auto;">
                ${cleanText.split('\n\n').map(p => {
                    let extraClass = '';
                    const trimmed = p.trim();
                    if (/^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV|XVI|XVII|XVIII|XIX|XX|XXI|XXII|XXIII|XXIV|XXV|XXVI|XXVII|XXVIII|XXIX|XXX)\.\s/.test(trimmed)) {
                        extraClass = 'ml-4 md:ml-8 pl-4 border-l-2 border-guinda/30 text-gray-700 font-medium';
                    } else if (/^[a-z]\)\s/.test(trimmed)) {
                        extraClass = 'ml-10 md:ml-16 pl-3 border-l text-gray-600 text-[0.85rem]';
                    } else if (/^\d+\.\s/.test(trimmed) || /^[A-Z]+\.\s/.test(trimmed)) {
                        extraClass = 'ml-4 md:ml-8 pl-4 border-l-2 border-gray-200 text-gray-700';
                    }
                    return `<p class="mb-4 ${extraClass}">${p}</p>`;
                }).join('')}
            </div>`;
        }

        // Highlight search terms in modal content
        // Usa el query global o, si estamos en la vista de ley, el del buscador interno
        const activeQuery = currentSearchQuery || document.getElementById('law-search-input')?.value.trim() || '';
        const hl = (html) => highlightHtml(html, activeQuery);

        // Sanitizar título y capítulo
        const sanitize = v => (v && v !== 'null' && v !== 'undefined' && v.trim()) ? v.trim() : null;
        const tituloStr = sanitize(item.titulo_nombre);
        const capituloStr = sanitize(item.capitulo_nombre);
        const locationParts = [tituloStr, capituloStr].filter(Boolean);

        modalContent.innerHTML = `
            ${locationParts.length ? `
            <div class="mb-5 pb-5 border-b border-gray-50">
                <div class="flex items-center gap-1.5 text-[9px] font-bold text-guinda/60 uppercase tracking-[0.2em] mb-2">
                    <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
                    Ubicación en el documento
                </div>
                <div class="flex flex-wrap gap-x-2 gap-y-1">
                    ${locationParts.map((p, i) => `
                        <span class="text-xs text-gray-600 font-medium">${p}</span>
                        ${i < locationParts.length - 1 ? '<span class="text-gray-200">›</span>' : ''}
                    `).join('')}
                </div>
            </div>` : ''}
            ${activeQuery ? `
            <div class="mb-5 flex items-center gap-2 text-[11px] text-guinda/70 bg-guinda/5 border border-guinda/10 px-3 py-2 rounded-lg">
                <svg class="w-3 h-3 flex-shrink-0 text-guinda/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <span class="font-medium">Búsqueda:</span> <mark class="hl">${escapeHtml(activeQuery)}</mark>
            </div>` : ''}
            <div class="reader-text">${hl(finalHtml)}</div>
        `;

        // Prev/Next navigation
        const currentIndex = currentModalList.findIndex(a => a.id === id);
        const total = currentModalList.length;

        const prevBtn = document.getElementById('modal-prev-btn');
        const nextBtn = document.getElementById('modal-next-btn');
        const navCounter = document.getElementById('modal-nav-counter');
        const previousArticle = currentIndex > 0 ? currentModalList[currentIndex - 1] : null;
        const nextArticle = currentIndex >= 0 ? currentModalList[currentIndex + 1] : null;
        const labelNavigation = (button, labelId, destination, direction) => {
            if (!button) return;
            const label = destination?.articulo_label || `Sin ${direction.toLowerCase()}`;
            document.getElementById(labelId).textContent = label;
            button.setAttribute('aria-label', destination ? `${direction}: ${label}` : label);
            button.title = destination ? `${direction}: ${label}` : label;
        };
        labelNavigation(prevBtn, 'modal-prev-label', previousArticle, 'Anterior');
        labelNavigation(nextBtn, 'modal-next-label', nextArticle, 'Siguiente');

        if (prevBtn) {
            prevBtn.disabled = currentIndex <= 0;
            prevBtn.onclick = () => {
                if (currentIndex > 0) openDetail(currentModalList[currentIndex - 1].id);
            };
        }
        if (nextBtn) {
            nextBtn.disabled = currentIndex < 0 || currentIndex >= total - 1;
            nextBtn.onclick = () => {
                if (currentIndex < total - 1) openDetail(currentModalList[currentIndex + 1].id);
            };
        }
        if (navCounter) {
            navCounter.textContent = currentIndex >= 0 ? `${currentIndex + 1} de ${total}` : '';
        }

        // Bookmark button in modal header
        const bookmarkBtn = document.getElementById('modal-bookmark-btn');
        if (bookmarkBtn) {
            const { loggedIn, fav, title: favTitle } = getFavoriteUiState(id);
            bookmarkBtn.innerHTML = fav
                ? `<svg class="w-5 h-5 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>`
                : (loggedIn
                    ? `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>`
                    : `<span class="w-8 h-8 rounded-full bg-guinda/5 border border-guinda/10 text-guinda flex items-center justify-center"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v2H5a1 1 0 00-1 1v5a2 2 0 002 2h8a2 2 0 002-2V9a1 1 0 00-1-1h-1V6a4 4 0 00-4-4zm-2 6V6a2 2 0 114 0v2H8z" clip-rule="evenodd"></path></svg></span>`);
            bookmarkBtn.title = favTitle;
            bookmarkBtn.classList.toggle('text-guinda', !loggedIn || fav);
            bookmarkBtn.onclick = () => {
                if (toggleFavorite(id)) {
                    openDetail(id); // re-render to update icon
                }
            };
        }

        // Admin Edit Button
        if (modalEditBtn) {
            const userIsAdmin = isAdmin();
            modalEditBtn.classList.toggle('hidden', !userIsAdmin);
            
            if (userIsAdmin) {
                modalEditBtn.onclick = () => {
                    const chunkModal = document.getElementById('edit-chunk-modal');
                    const chunkModalPanel = document.getElementById('chunk-modal-panel');
                    const chunkContentInput = document.getElementById('edit-chunk-content');
                    const chunkTitleLabel = document.getElementById('chunk-modal-identificador');
                    const saveBtn = document.getElementById('save-chunk-edit');
                    const cancelBtn = document.getElementById('cancel-chunk-edit');
                    const closeBtn = document.getElementById('close-chunk-modal');

                    chunkTitleLabel.textContent = `Editar: ${item.articulo_label}`;
                    chunkContentInput.value = item.texto;

                    // Toolbar logic
                    const addTableBtn = document.getElementById('editor-add-table');
                    const addBoldBtn = document.getElementById('editor-add-bold');

                    const insertAtCursor = (text) => {
                        const start = chunkContentInput.selectionStart;
                        const end = chunkContentInput.selectionEnd;
                        const val = chunkContentInput.value;
                        chunkContentInput.value = val.substring(0, start) + text + val.substring(end);
                        chunkContentInput.focus();
                        chunkContentInput.selectionStart = chunkContentInput.selectionEnd = start + text.length;
                    };

                    if (addTableBtn) {
                        addTableBtn.onclick = () => {
                            const tableTemplate = "\n| Columna 1 | Columna 2 | Columna 3 |\n|-----------|-----------|-----------|\n| Dato 1    | Dato 2    | Dato 3    |\n| Dato 4    | Dato 5    | Dato 6    |\n";
                            insertAtCursor(tableTemplate);
                        };
                    }

                    if (addBoldBtn) {
                        addBoldBtn.onclick = () => {
                            const start = chunkContentInput.selectionStart;
                            const end = chunkContentInput.selectionEnd;
                            const selected = chunkContentInput.value.substring(start, end);
                            if (selected) {
                                insertAtCursor(`**${selected}**`);
                            } else {
                                insertAtCursor("**Negrita**");
                            }
                        };
                    }

                    // Mostrar modal
                    chunkModal.classList.remove('hidden');
                    chunkModal.classList.add('flex');
                    setTimeout(() => {
                        chunkModalPanel.classList.remove('scale-95', 'opacity-0');
                        chunkModalPanel.classList.add('scale-100', 'opacity-100');
                    }, 10);

                    // Funciones de cierre
                    const closeEdit = () => {
                        chunkModalPanel.classList.remove('scale-100', 'opacity-100');
                        chunkModalPanel.classList.add('scale-95', 'opacity-0');
                        setTimeout(() => {
                            chunkModal.classList.add('hidden');
                            chunkModal.classList.remove('flex');
                        }, 300);
                    };

                    cancelBtn.onclick = closeEdit;
                    closeBtn.onclick = closeEdit;

                    // Función de guardado real en DB
                    saveBtn.onclick = async () => {
                        const newText = chunkContentInput.value;
                        try {
                            saveBtn.disabled = true;
                            saveBtn.textContent = 'Guardando...';
                            
                            // IMPORTANTE: El nombre de la columna en la DB es 'contenido'
                            await updateArticle(item.id, { contenido: newText });
                            
                            item.texto = newText; // Actualizar objeto local para la UI
                            closeEdit();
                            // Refrescar la vista de detalle
                            openDetail(item.id);
                        } catch (err) {
                            alert('Error al guardar: ' + err.message);
                        } finally {
                            saveBtn.disabled = false;
                            saveBtn.textContent = 'Guardar Cambios';
                        }
                    };
                };
            }
        }

        // Copy button (static in HTML)
        const copyBtnEl = document.getElementById('copy-btn');
        if (copyBtnEl) {
            copyBtnEl.onclick = () => {
                navigator.clipboard.writeText(modalContent.innerText).then(() => {
                    showToast('¡Texto copiado!', '📋');
                });
            };
        }

        // Share button wiring
        const shareBtn = document.getElementById('share-btn');
        const shareMenu = document.getElementById('share-menu');
        const shareTextBtn = document.getElementById('share-text-btn');
        const shareImageBtn = document.getElementById('share-image-btn');
        if (shareBtn && shareMenu) {
            shareBtn.onclick = (e) => {
                e.stopPropagation();
                // En móviles, si existe navigator.share, lo usamos directamente para el texto
                // evitando el menú desplegable que puede verse mal
                if (window.innerWidth < 640 && navigator.share) {
                    shareArticleText(item);
                    return;
                }
                shareMenu.classList.toggle('hidden');
            };
            document.addEventListener('click', function hideShareMenu(e) {
                if (!e.target.closest('#share-menu-wrapper')) {
                    shareMenu.classList.add('hidden');
                    document.removeEventListener('click', hideShareMenu);
                }
            });
        }
        // Notes panel — append after article content
        const existingNote = getNote(id);
        modalContent.innerHTML += `
            <div class="mt-8 pt-6 border-t border-gray-100 ${isLoggedIn() ? '' : 'bg-gradient-to-br from-white to-guinda/5 rounded-2xl px-4 pb-4'}" id="notes-section">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                        <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                        Mis notas
                    </span>
                    <button id="delete-note-btn" class="text-[10px] text-red-300 hover:text-red-500 transition-colors ${existingNote ? '' : 'hidden'}" aria-label="Borrar nota">Borrar</button>
                </div>
                <textarea id="article-note-input"
                    placeholder="${isLoggedIn() ? 'Escribe tus anotaciones sobre este artículo...' : 'Inicia sesión para guardar notas de este artículo en tu cuenta.'}"
                    class="w-full text-xs ${isLoggedIn() ? 'text-gray-700 border-amber-100 focus:ring-2 focus:ring-amber-200 focus:border-amber-300 bg-amber-50/40' : 'text-gray-500 border-guinda/20 bg-white placeholder:text-gray-400 cursor-not-allowed'} border rounded-xl p-3 resize-none focus:outline-none transition-all leading-relaxed font-light"
                    rows="3" aria-label="Notas del artículo" ${isLoggedIn() ? '' : 'readonly'}>${existingNote}</textarea>
                <div class="flex items-center justify-between mt-2">
                    <span id="note-saved-indicator" class="text-[10px] ${isLoggedIn() ? 'text-amber-500' : 'text-guinda'} flex items-center gap-1 ${isLoggedIn() ? (existingNote ? '' : 'invisible') : ''}">
                        ${isLoggedIn()
                ? '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>Guardada'
                : '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 8a6 6 0 10-12 0v2H5a1 1 0 00-1 1v5a2 2 0 002 2h8a2 2 0 002-2v-5a1 1 0 00-1-1h-1V8a4 4 0 10-8 0v2h6V8a2 2 0 114 0v2h-1a1 1 0 00-1 1v5h1a2 2 0 002-2v-5a1 1 0 00-1-1h-1V8z" clip-rule="evenodd"></path></svg>Solo con cuenta'}
                    </span>
                    <button id="save-note-btn" class="text-xs font-semibold transition-colors px-3 py-1.5 rounded-lg ${isLoggedIn() ? 'text-guinda hover:text-guinda/70 bg-guinda/5 hover:bg-guinda/10' : 'text-white bg-guinda hover:bg-guinda-dk shadow-sm'}" aria-label="Guardar nota">${isLoggedIn() ? 'Guardar' : 'Iniciar sesión'}</button>
                </div>
                ${isLoggedIn() ? '' : '<p class="mt-2 text-[11px] text-gray-500">Las notas se guardan solo en tu cuenta de Supabase.</p>'}
            </div>
        `;

        // Wire notes buttons
        const noteInput = document.getElementById('article-note-input');
        const saveNoteBtn = document.getElementById('save-note-btn');
        const deleteNoteBtn = document.getElementById('delete-note-btn');
        const noteSavedIndicator = document.getElementById('note-saved-indicator');

        if (saveNoteBtn && noteInput) {
            saveNoteBtn.addEventListener('click', () => {
                if (!saveNote(id, noteInput.value)) return;
                showToast('¡Nota guardada!', '📝', 'bg-amber-600');
                noteSavedIndicator?.classList.remove('invisible');
                if (deleteNoteBtn) deleteNoteBtn.classList.toggle('hidden', !noteInput.value.trim());
            });
        }
        if (deleteNoteBtn && noteInput) {
            deleteNoteBtn.addEventListener('click', () => {
                if (!saveNote(id, '')) return;
                noteInput.value = '';
                noteSavedIndicator?.classList.add('invisible');
                deleteNoteBtn.classList.add('hidden');
                showToast('Nota eliminada', '🗑️', 'bg-gray-600');
            });
        }

        // Cite button — formal citation
        const citeBtn = document.getElementById('cite-btn');
        if (citeBtn) {
            citeBtn.onclick = () => {
                const today = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
                const artUrl = `${location.origin}${location.pathname}#art-${encodeURIComponent(id)}`;
                const citation = `${item.articulo_label} de la ${item.ley_origen}${item.fecha_publicacion ? ', publicada el ' + item.fecha_publicacion : ''}. Secretaría de Energía, Gobierno de México. Consultado el ${today}. Disponible en: ${artUrl}`;

                // Try clipboard API; fall back to a selectable popover (required on mobile/HTTP)
                const tryClipboard = navigator.clipboard && typeof navigator.clipboard.writeText === 'function'
                    ? navigator.clipboard.writeText(citation)
                    : Promise.reject(new Error('Clipboard API not available'));

                tryClipboard
                    .then(() => showToast('¡Cita copiada!', '📖', 'bg-guinda'))
                    .catch(() => {
                        // Fallback: show citation in a selectable popover
                        const existingPopover = document.getElementById('citation-popover');
                        if (existingPopover) { existingPopover.remove(); return; }

                        const popover = document.createElement('div');
                        popover.id = 'citation-popover';
                        popover.className = 'fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4';
                        popover.innerHTML = `
                            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                                <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-guinda/5">
                                    <span class="text-xs font-bold text-guinda uppercase tracking-widest flex items-center gap-2">
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg>
                                        Cita formal
                                    </span>
                                    <button id="citation-popover-close" class="text-gray-400 hover:text-guinda transition-colors text-lg leading-none">×</button>
                                </div>
                                <div class="p-5">
                                    <p class="text-[11px] text-gray-400 mb-2">Mantén pulsado el texto para seleccionar y copiar:</p>
                                    <textarea id="citation-text-area" readonly
                                        class="w-full text-xs text-gray-700 border border-gray-100 rounded-xl p-3 resize-none focus:outline-none bg-gray-50 leading-relaxed font-light select-all"
                                        rows="4">${citation}</textarea>
                                    <button id="citation-copy-btn" class="mt-3 w-full py-2.5 bg-guinda text-white text-xs font-semibold rounded-xl hover:bg-guinda/90 transition-colors">
                                        Copiar cita
                                    </button>
                                </div>
                            </div>`;

                        document.body.appendChild(popover);

                        // Auto-select text for easy copying
                        setTimeout(() => {
                            const ta = document.getElementById('citation-text-area');
                            if (ta) { ta.focus(); ta.select(); }
                        }, 100);

                        // Copy button inside popover (second attempt, now with user gesture)
                        document.getElementById('citation-copy-btn')?.addEventListener('click', () => {
                            const ta = document.getElementById('citation-text-area');
                            if (ta) {
                                ta.select();
                                try { document.execCommand('copy'); } catch (_) {}
                                if (navigator.clipboard) {
                                    navigator.clipboard.writeText(citation).catch(() => {});
                                }
                                showToast('¡Cita copiada!', '📖', 'bg-guinda');
                                popover.remove();
                            }
                        });

                        // Close handlers
                        document.getElementById('citation-popover-close')?.addEventListener('click', () => popover.remove());
                        popover.addEventListener('click', (e) => { if (e.target === popover) popover.remove(); });
                    });
            };
        }

        // Wire all share platform buttons
        const shareActions = {
            'share-text-btn': () => shareArticleText(item),
            'share-image-btn': () => shareArticleImage(item),
            'share-telegram-btn': () => shareArticleVia(item, 'telegram'),
            'share-twitter-btn': () => shareArticleVia(item, 'twitter'),
            'share-email-btn': () => shareArticleVia(item, 'email'),
        };
        Object.entries(shareActions).forEach(([btnId, action]) => {
            const btn = document.getElementById(btnId);
            if (btn) btn.onclick = () => { shareMenu?.classList.add('hidden'); action(); };
        });

        readerSource?.destroy();
        readerSource = mountReaderSource(readerOriginal, item);
        modalContent.scrollTop = 0;
        setReaderMode(readerMode);
        readerControls.sync();

        // Update URL for sharing
        if (updateHistory) setHash(`#art-${encodeURIComponent(id)}`);

        detailModal.classList.remove('hidden');
        detailModal.classList.add('flex');
        document.body.classList.add('reader-modal-open');
        if (firstOpen) closeModal.focus({ preventScroll: true });
        
        if (typeof anime !== 'undefined') {
            anime({
                targets: modalPanel,
                scale: [0.9, 1],
                opacity: [0, 1],
                easing: 'easeOutElastic(1, .6)',
                duration: 800
            });
        }

        // Wire share-link-btn if present
        const shareLinkBtn = document.getElementById('share-link-btn');
        if (shareLinkBtn) {
            shareLinkBtn.onclick = () => {
                shareMenu?.classList.add('hidden');
                const url = `${location.origin}${location.pathname}#art-${encodeURIComponent(id)}`;
                navigator.clipboard.writeText(url).then(() => showToast('¡Enlace copiado!', '🔗', 'bg-blue-600'));
            };
        }

        // Animation
        setTimeout(() => {
            modalPanel.classList.remove('scale-95', 'opacity-0');
            modalPanel.classList.add('scale-100', 'opacity-100');
        }, 10);
    }

    function closeModalFunc() {
        readerOpenRequest++;
        const returnContext = explorerModalReturn;
        explorerModalReturn = null;
        setHash(returnContext?.hash || null);
        modalPanel.classList.remove('scale-100', 'opacity-100');
        modalPanel.classList.add('scale-95', 'opacity-0');

        closeModalTimer = setTimeout(() => {
            detailModal.classList.add('hidden');
            detailModal.classList.remove('flex');
            releaseReader();
            restoreExplorerPosition(returnContext);
            if (!returnContext && readerReturnFocus?.isConnected) readerReturnFocus.focus({ preventScroll: true });
        }, 300);
    }

    // ── Atajos de teclado ─────────────────────────────────────────────────────
    function showKeyboardHelp() {
        let helpModal = document.getElementById('keyboard-help-modal');
        if (helpModal) { helpModal.remove(); return; }
        helpModal = document.createElement('div');
        helpModal.id = 'keyboard-help-modal';
        helpModal.className = 'fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4';
        helpModal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in-up">
                <div class="flex items-center justify-between mb-5">
                    <h3 class="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <svg class="w-4 h-4 text-guinda" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                        Atajos de Teclado
                    </h3>
                    <button id="kbd-help-close" class="text-gray-400 hover:text-guinda transition-colors text-lg leading-none">×</button>
                </div>
                <div class="space-y-2.5 text-xs">
                    ${[
                ['/', 'Enfocar el buscador'],
                ['Esc', 'Cerrar modal / panel'],
                ['← →', 'Artículo anterior / siguiente'],
                ['?', 'Mostrar esta ayuda'],
                ['f', 'Agregar/quitar de favoritos'],
                ['c', 'Copiar texto del artículo'],
            ].map(([key, desc]) => `
                        <div class="flex items-center justify-between">
                            <span class="text-gray-500">${desc}</span>
                            <kbd class="bg-gray-100 border border-gray-200 rounded px-2 py-0.5 font-mono text-[11px] text-gray-700 shadow-sm">${key}</kbd>
                        </div>
                    `).join('')}
                </div>
                <div class="mt-5 pt-4 border-t border-gray-50 text-[10px] text-gray-400 text-center">
                    Presiona <kbd class="bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 font-mono text-[10px]">?</kbd> para abrir esta ayuda
                </div>
            </div>
        `;
        document.body.appendChild(helpModal);
        helpModal.addEventListener('click', (e) => { if (e.target === helpModal) helpModal.remove(); });
        document.getElementById('kbd-help-close')?.addEventListener('click', () => helpModal.remove());
    }

    // ── Análisis de Temas Transversales ──────────────────────────────────────────
    async function showAnalisisView(state = {}, { updateHistory = true } = {}) {
        if (searchInput) searchInput.value = '';
        currentSearchQuery = '';
        currentFilters = { type: 'all', law: 'all', artNum: '' };
        
        explorerViewHash = explorerHash(state);
        if (updateHistory) setHash(explorerViewHash);
        destroyTOC();
        hideGlobalSearch();
        setActiveNav('nav-analisis');
        document.getElementById('search-filters')?.remove();
        document.querySelector('.pagination-nav')?.remove();
        heroSection.classList.add('hidden');
        quickFilters.classList.add('hidden');
        statsMinimal.classList.add('hidden');
        resultsContainer.classList.add('hidden', 'opacity-0');
        resultsContainer.innerHTML = '';
        if (lawDetailContainer) lawDetailContainer.classList.add('hidden', 'opacity-0');
        document.getElementById('admin-ingest-container')?.classList.add('hidden', 'opacity-0');

        mainContainer.classList.remove('justify-center', 'pt-24');
        mainContainer.classList.add('pt-8');

        const analisisContainer = document.getElementById('analisis-container');
        if (!analisisContainer) return;
        analisisContainer.classList.remove('hidden');
        setTimeout(() => analisisContainer.classList.remove('opacity-0'), 50);

        await renderAnalisisView(analisisContainer, state);
    }
    // ── Fin Análisis ─────────────────────────────────────────────────────────────

    document.getElementById('keyboard-help-btn')?.addEventListener('click', showKeyboardHelp);
    
    // Wire Ayuda nav items to show the help modal
    function showHelpView() {
        hideLawDetail();
        resetToHero();
        heroSection.classList.add('hidden');
        globalSearchWrapper.classList.add('hidden');
        quickFilters.classList.add('hidden');
        statsMinimal.classList.add('hidden');
        resultsContainer.classList.add('hidden');

        let helpContainer = document.getElementById('help-view-container');
        if (!helpContainer) {
            helpContainer = document.createElement('div');
            helpContainer.id = 'help-view-container';
            helpContainer.className = 'w-full max-w-4xl mx-auto py-12 px-6 fade-in';
            mainContainer.appendChild(helpContainer);
        }
        helpContainer.classList.remove('hidden');
        setActiveNav('nav-ayuda');

        helpContainer.innerHTML = `
            <div class="space-y-12">
                <header class="text-center">
                    <span class="text-[10px] font-bold tracking-[0.3em] text-guinda uppercase mb-3 block">Soporte Institucional</span>
                    <h2 class="text-4xl font-head font-bold text-gray-800 mb-6">¿Cómo podemos ayudarle?</h2>
                    <p class="text-gray-500 max-w-2xl mx-auto text-sm leading-relaxed">
                        Bienvenido al portal de ayuda del Marco Legal Energético. Aquí encontrará información sobre cómo utilizar las herramientas de búsqueda y análisis del sector energético.
                    </p>
                </header>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <!-- Card 1 -->
                    <div class="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div class="w-10 h-10 bg-guinda/5 rounded-lg flex items-center justify-center text-guinda mb-5">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        </div>
                        <h3 class="font-bold text-gray-800 mb-3">Búsqueda Avanzada</h3>
                        <p class="text-xs text-gray-400 leading-relaxed">Utilice términos técnicos del sector como "CENACE", "Transmisión" o "Soberanía" para encontrar artículos y disposiciones en el acervo.</p>
                    </div>
                    <!-- Card 2 -->
                    <div class="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        <div class="w-10 h-10 bg-guinda/5 rounded-lg flex items-center justify-center text-guinda mb-5">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                        </div>
                        <h3 class="font-bold text-gray-800 mb-3">Análisis Transversal</h3>
                        <p class="text-xs text-gray-400 leading-relaxed">Visualice cómo se interconectan los temas clave a través de diferentes leyes y reglamentos mediante nuestras gráficas interactivas.</p>
                    </div>
                </div>

                <section class="bg-[#1E1E1E] text-white p-10 rounded-lg relative overflow-hidden border border-dorado/30">
                    <div class="relative z-10">
                        <h3 class="text-xl font-bold mb-4">Atajos de Teclado</h3>
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div class="flex items-center gap-2">
                                <kbd class="bg-white/10 px-2 py-1 rounded text-[10px] font-mono border border-white/20">/</kbd>
                                <span class="text-[10px] opacity-70">Buscar</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <kbd class="bg-white/10 px-2 py-1 rounded text-[10px] font-mono border border-white/20">?</kbd>
                                <span class="text-[10px] opacity-70">Esta guía</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <kbd class="bg-white/10 px-2 py-1 rounded text-[10px] font-mono border border-white/20">Esc</kbd>
                                <span class="text-[10px] opacity-70">Cerrar</span>
                            </div>
                        </div>
                    </div>
                    <div class="absolute -right-8 -bottom-8 opacity-10">
                        <svg class="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                    </div>
                </section>
            </div>
        `;
    }

    document.getElementById('nav-ayuda')?.addEventListener('click', (e) => { e.preventDefault(); showHelpView(); });
    document.getElementById('mobile-nav-ayuda')?.addEventListener('click', (e) => { e.preventDefault(); showHelpView(); toggleMobileMenu(false); });

    document.addEventListener('keydown', (e) => {
        const tag = e.target.tagName;
        const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable;
        const modalOpen = !detailModal.classList.contains('hidden');

        if (modalOpen && e.key === 'Tab' && modalPanel.contains(document.activeElement)) {
            const focusable = [...modalPanel.querySelectorAll('button:not([disabled]), a[href], input, select, textarea, summary, [tabindex="0"]')]
                .filter(el => el.getClientRects().length && !el.closest('[hidden], .hidden') && (!el.closest('details:not([open])') || el.tagName === 'SUMMARY'));
            const first = focusable[0], last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
            if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
        }

        // ? — keyboard help (anywhere except inputs)
        if (e.key === '?' && !inInput) {
            e.preventDefault();
            showKeyboardHelp();
            return;
        }

        // Esc — close things
        if (e.key === 'Escape') {
            const settings = modalOpen && modalPanel.querySelector('.reader-settings[open]');
            if (settings) { settings.open = false; settings.querySelector('summary').focus(); return; }
            // Close keyboard help
            const khm = document.getElementById('keyboard-help-modal');
            if (khm) { khm.remove(); return; }
            // Close TOC panel
            const tocPanel = document.getElementById('toc-panel');
            if (tocPanel && !tocPanel.classList.contains('translate-y-full')) {
                tocPanel.classList.add('translate-y-full');
                document.body.style.overflow = '';
                return;
            }
            // Close detail modal
            if (modalOpen) { closeModalFunc(); return; }
            // Close compare modal
            const compareModalEl = document.getElementById('compare-modal');
            if (compareModalEl && !compareModalEl.classList.contains('hidden')) { closeCompareModal(); return; }
            return;
        }

        // / — focus search (not in input)
        if (e.key === '/' && !inInput) {
            e.preventDefault();
            if (!modalOpen && globalSearchWrapper.classList.contains('hidden')) resetToHero();
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
            return;
        }

        // Arrow navigation (only when modal is open and not in input)
        if (modalOpen && !inInput && !e.target.closest('button, a, summary, #reader-original')) {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                document.getElementById('modal-next-btn')?.click();
                return;
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                document.getElementById('modal-prev-btn')?.click();
                return;
            }
            // f — toggle favorite
            if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                document.getElementById('modal-bookmark-btn')?.click();
                return;
            }
            // c — copy text
            if ((e.key === 'c' || e.key === 'C') && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                document.getElementById('copy-btn')?.click();
                return;
            }
        }
    });
    // ── Fin Atajos ────────────────────────────────────────────────────────────

    if (closeModal) closeModal.addEventListener('click', closeModalFunc);

    // Close on click outside
    detailModal?.addEventListener('click', (e) => {
        if (e.target === detailModal) closeModalFunc();
    });

    // Copy functionality
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const text = modalContent.innerText;
            navigator.clipboard.writeText(text).then(() => {
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = `<span class="text-verde font-bold">¡Copiado!</span>`;
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                }, 2000);
            });
        });
    }

    // ── Auth UI ───────────────────────────────────────────────────────────────
    function initAuthUI() {
        const loginBtn = document.getElementById('nav-login-btn');
        const mobileLoginBtn = document.getElementById('mobile-nav-login-btn');
        const authModal = document.getElementById('auth-modal');
        const closeAuthModalBtn = document.getElementById('close-auth-modal');
        const authForm = document.getElementById('auth-form');
        const authNameGroup = document.getElementById('auth-name-group');
        const authNameInput = document.getElementById('auth-name');
        const authNameError = document.getElementById('auth-name-error');
        const authEmailInput = document.getElementById('auth-email');
        const authPasswordInput = document.getElementById('auth-password');
        const authSubmitBtn = document.getElementById('auth-submit-btn');
        const authLogoutBtn = document.getElementById('auth-logout-btn');
        const authMsgEl = document.getElementById('auth-msg');
        const authLoggedIn = document.getElementById('auth-logged-in');
        const authUserName = document.getElementById('auth-user-name');
        const authUserEmail = document.getElementById('auth-user-email');
        const navUserLabel = document.getElementById('nav-user-label');
        const mobileUserLabel = document.getElementById('mobile-user-label');
        const authTabsEl = document.getElementById('auth-tabs');
        const authTabBtns = document.querySelectorAll('.auth-tab');

        let currentTab = 'login';

        openAuthModal = function () {
            authModal.classList.remove('hidden');
            authModal.classList.add('flex');
            updateAuthModalState();
            if (typeof anime !== 'undefined') {
                const authPanel = document.getElementById('auth-panel');
                if (authPanel) {
                    anime({
                        targets: authPanel,
                        scale: [0.9, 1],
                        opacity: [0, 1],
                        easing: 'easeOutElastic(1, .6)',
                        duration: 800
                    });
                }
            }
        };

        closeAuthModal = function () {
            authModal.classList.add('hidden');
            authModal.classList.remove('flex');
            authMsgEl.classList.add('hidden');
        };

        function getUserDisplayName(user) {
            if (!user) return 'Entrar';

            const metadataName = user.user_metadata?.full_name
                || user.user_metadata?.name
                || user.user_metadata?.username;

            if (typeof metadataName === 'string' && metadataName.trim()) {
                return formatUserDisplayName(metadataName);
            }

            if (typeof user.email === 'string' && user.email.includes('@')) {
                return formatUserDisplayName(user.email.split('@')[0].replace(/[._-]+/g, ' '));
            }

            return 'Usuario';
        }

        function normalizeUserName(value) {
            return value.replace(/\s+/g, ' ').trim();
        }

        function formatUserDisplayName(value) {
            const normalized = normalizeUserName(value);
            if (!normalized) return '';

            return normalized
                .split(' ')
                .filter(Boolean)
                .map(part => {
                    if (part.includes('-')) {
                        return part
                            .split('-')
                            .map(token => token ? token.charAt(0).toUpperCase() + token.slice(1).toLowerCase() : '')
                            .join('-');
                    }

                    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
                })
                .join(' ');
        }

        function validateUserName(value) {
            const normalized = normalizeUserName(value);

            if (!normalized) {
                return 'Ingresa tu nombre para crear la cuenta.';
            }

            if (normalized.length < 3) {
                return 'El nombre debe tener al menos 3 caracteres.';
            }

            if (/\d/.test(normalized)) {
                return 'El nombre no puede contener números.';
            }

            if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/.test(normalized)) {
                return 'Usa solo letras, espacios, apóstrofes o guiones.';
            }

            const letterCount = (normalized.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g) || []).length;
            if (letterCount < 3) {
                return 'El nombre debe contener al menos 3 letras.';
            }

            return null;
        }

        function renderNameValidation(message = '') {
            if (!authNameInput || !authNameError) return;

            const hasError = Boolean(message);
            authNameInput.classList.toggle('border-red-300', hasError);
            authNameInput.classList.toggle('focus:ring-red-100', hasError);
            authNameInput.classList.toggle('focus:border-red-400', hasError);
            authNameError.textContent = message;
            authNameError.classList.toggle('hidden', !hasError);
        }

        function updateAuthSubmitState() {
            if (!authSubmitBtn) return;

            if (currentTab !== 'register') {
                authSubmitBtn.disabled = false;
                authSubmitBtn.classList.remove('opacity-60', 'cursor-not-allowed');
                return;
            }

            const nameError = validateUserName(authNameInput?.value || '');
            const canSubmit = !nameError;
            authSubmitBtn.disabled = !canSubmit;
            authSubmitBtn.classList.toggle('opacity-60', !canSubmit);
            authSubmitBtn.classList.toggle('cursor-not-allowed', !canSubmit);
        }

        function updateAuthModalState() {
            const user = getCurrentUser();
            if (user) {
                authForm.classList.add('hidden');
                authTabsEl.classList.add('hidden');
                authLoggedIn.classList.remove('hidden');
                if (authUserName) authUserName.textContent = getUserDisplayName(user);
                authUserEmail.textContent = user.email;
            } else {
                authForm.classList.remove('hidden');
                authTabsEl.classList.remove('hidden');
                authLoggedIn.classList.add('hidden');
            }
        }

        function showAuthMsg(msg, isError = true) {
            authMsgEl.textContent = msg;
            authMsgEl.className = `mb-4 p-3 rounded-lg text-sm font-medium ${isError
                ? 'bg-red-50 text-red-600 border border-red-100'
                : 'bg-green-50 text-green-600 border border-green-100'}`;
        }

        function updateNavLoginBtn(user) {
            const label = user ? getUserDisplayName(user) : 'Entrar';
            if (navUserLabel) navUserLabel.textContent = label;
            if (mobileUserLabel) mobileUserLabel.textContent = label;
            
            // Gestor Visibility (Admin only)
            const navAdmin = document.getElementById('nav-admin');
            const mobileNavAdmin = document.getElementById('mobile-nav-admin');
            // Gestor Visibility: allow @sener.gob.mx, admins, or any logged in user if force flag set
            const showAdmin = user && (
                user.email.endsWith('@sener.gob.mx') || 
                user.app_metadata?.role === 'admin' || 
                localStorage.getItem('force-admin') === 'true' ||
                true // For now, let's allow ANY logged in user to see the admin link as requested
            );
            
            if (navAdmin) navAdmin.classList.toggle('hidden', !showAdmin);
            if (mobileNavAdmin) mobileNavAdmin.classList.toggle('hidden', !showAdmin);

            if (loginBtn) {
                loginBtn.classList.toggle('text-guinda', !!user);
                loginBtn.classList.toggle('border-guinda/30', !!user);
            }
        }

        function setAuthTab(nextTab) {
            currentTab = nextTab;
            if (authNameGroup) authNameGroup.classList.toggle('hidden', currentTab !== 'register');
            if (currentTab !== 'register') renderNameValidation('');
            authTabBtns.forEach(t => {
                const active = t.dataset.tab === currentTab;
                t.classList.toggle('bg-white', active);
                t.classList.toggle('shadow', active);
                t.classList.toggle('text-guinda', active);
                t.classList.toggle('text-gray-500', !active);
            });
            authSubmitBtn.textContent = currentTab === 'login' ? 'Iniciar sesión' : 'Crear cuenta';
            updateAuthSubmitState();
        }

        // Open modal
        if (loginBtn) loginBtn.addEventListener('click', openAuthModal);
        if (mobileLoginBtn) mobileLoginBtn.addEventListener('click', () => {
            openAuthModal();
            toggleMobileMenu(false);
        });

        // Close modal
        if (closeAuthModalBtn) closeAuthModalBtn.addEventListener('click', closeAuthModal);
        authModal.addEventListener('click', (e) => { if (e.target === authModal) closeAuthModal(); });

        // Tabs
        authTabBtns.forEach(tab => {
            tab.addEventListener('click', () => {
                setAuthTab(tab.dataset.tab);
                authMsgEl.classList.add('hidden');
            });
        });

        authNameInput?.addEventListener('input', () => {
            if (currentTab !== 'register') return;
            renderNameValidation(validateUserName(authNameInput.value) || '');
            updateAuthSubmitState();
        });

        authNameInput?.addEventListener('blur', () => {
            if (currentTab !== 'register') return;
            renderNameValidation(validateUserName(authNameInput.value) || '');
            updateAuthSubmitState();
        });

        // Form submit
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = normalizeUserName(authNameInput?.value || '');
            const email = authEmailInput.value.trim();
            const password = authPasswordInput.value;
            if (!email || !password) return;
            if (currentTab === 'register') {
                const nameError = validateUserName(fullName);
                if (nameError) {
                    renderNameValidation(nameError);
                    showAuthMsg(nameError);
                    return;
                }
                renderNameValidation('');
            }

            authSubmitBtn.disabled = true;
            authSubmitBtn.textContent = 'Procesando…';
            authMsgEl.classList.add('hidden');

            try {
                if (currentTab === 'login') {
                    await login(email, password);
                    closeAuthModal();
                    showToast('¡Sesión iniciada!', '✓', 'bg-green-600');
                } else {
                    await register(email, password, fullName);
                    setAuthTab('login');
                    authPasswordInput.value = '';
                    if (authNameInput) authNameInput.value = fullName;
                    showAuthMsg('Cuenta creada. Revisa tu correo y luego vuelve a iniciar sesión.', false);
                }
            } catch (err) {
                showAuthMsg(err.message || 'Error de autenticación');
            } finally {
                authSubmitBtn.disabled = false;
                authSubmitBtn.textContent = currentTab === 'login' ? 'Iniciar sesión' : 'Crear cuenta';
            }
        });

        // Logout
        if (authLogoutBtn) {
            authLogoutBtn.addEventListener('click', async () => {
                await logout();
                closeAuthModal();
                showToast('Sesión cerrada', '👋', 'bg-gray-600');
            });
        }

        // React to auth state changes (login / logout)
        onAuthChange(async (user) => {
            updateNavLoginBtn(user);
            updateAuthModalState();

            if (user) {
                // Load DB data into caches
                try {
                    const [favIds, allNotes] = await Promise.all([dbGetFavorites(), dbGetAllNotes()]);
                    dbFavoritesSet = new Set(favIds);
                    dbNotesMap = new Map(Object.entries(allNotes));
                } catch (e) {
                    console.error('[Auth] Error cargando datos del usuario:', e);
                    dbFavoritesSet = new Set();
                    dbNotesMap = new Map();
                }
            } else {
                dbFavoritesSet = null;
                dbNotesMap = null;
            }

            updateFavoritesBtn();
            // Refresh favorites view if it is currently open
            if (!resultsContainer.classList.contains('hidden') && document.getElementById('fav-cards')) {
                showFavoritesView();
            }
        });
    }
    initAuthUI();
    // ── Fin Auth UI ───────────────────────────────────────────────────────────
    function initAnimations() {
        if (typeof anime === 'undefined') return;

        // Hero cascading entry animation
        anime({
            targets: [
                '#hero-section .flex.items-center.justify-center.gap-3', 
                '#hero-section h1', 
                '#hero-section p'
            ],
            translateY: [20, 0],
            opacity: [0, 1],
            easing: 'easeOutElastic(1, .8)',
            duration: 1200,
            delay: anime.stagger(150, {start: 100})
        });

        // Search container animation
        anime({
            targets: '#global-search-wrapper',
            translateY: [30, 0],
            opacity: [0, 1],
            easing: 'easeOutQuint',
            duration: 1000,
            delay: 400
        });

        // "Busquedas Rapidas" pills animation
        anime({
            targets: '#quick-filters button',
            translateY: [15, 0],
            opacity: [0, 1],
            easing: 'easeOutExpo',
            duration: 800,
            delay: anime.stagger(50, {start: 600})
        });

        // Watermark breathing animation
        anime({
            targets: '#watermark-symbol',
            opacity: [0.02, 0.06],
            scale: [0.95, 1.05],
            easing: 'easeInOutSine',
            duration: 4000,
            direction: 'alternate',
            loop: true
        });

        // Search Input Interactive Focus
        const searchInputEl = document.getElementById('search-input');
        const searchContainerEl = document.getElementById('search-input-container') || searchInputEl.parentElement;
        
        if (searchInputEl && searchContainerEl) {
            searchInputEl.addEventListener('focus', () => {
                anime({
                    targets: searchContainerEl,
                    scale: 1.03,
                    boxShadow: '0 10px 25px -5px rgba(155, 34, 71, 0.15), 0 8px 10px -6px rgba(155, 34, 71, 0.1)',
                    duration: 400,
                    easing: 'easeOutElastic(1, .8)'
                });
            });
            
            searchInputEl.addEventListener('blur', () => {
                anime({
                    targets: searchContainerEl,
                    scale: 1,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    duration: 300,
                    easing: 'easeOutCubic'
                });
            });
        }
    }

    // Initialize initial animations
    initAnimations();

    // Trigger hero animation when resetToHero is called
    const originalResetToHero = resetToHero;
    resetToHero = function(options) {
        originalResetToHero(options);
        if (typeof anime !== 'undefined') {
            anime({
                targets: ['#hero-section', '#global-search-wrapper', '#quick-filters'],
                opacity: [0, 1],
                translateY: [10, 0],
                easing: 'easeOutQuad',
                duration: 600,
                delay: anime.stagger(100)
            });
        }
    };
    if (!location.hash) showLawsView(acervoState, { updateHistory: false });
}
