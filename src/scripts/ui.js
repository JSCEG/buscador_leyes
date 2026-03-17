import { performSearch, getArticleById, getArticlesByLaw } from './search-engine.js';

export function initUI() {
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results-container');
    const lawDetailContainer = document.getElementById('law-detail-container');
    const statsMinimal = document.getElementById('stats-minimal');
    const heroSection = document.getElementById('hero-section');
    const mainContainer = document.getElementById('main-container');
    const quickFilters = document.getElementById('quick-filters');
    const detailModal = document.getElementById('detail-modal');
    const modalPanel = document.getElementById('modal-panel');
    const modalContent = document.getElementById('modal-content');
    const modalTitle = document.getElementById('modal-title');
    const modalLey = document.getElementById('modal-ley');
    const closeModal = document.getElementById('close-modal');
    const copyBtn = document.getElementById('copy-btn');
    const loadingIndicator = document.getElementById('loading-indicator');

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

    let cachedSummaries = [];
    let currentLawArticles = [];

    // Stats Listener
    window.addEventListener('search-ready', (e) => {
        const { totalLeyes, totalArticulos, summaries } = e.detail;
        cachedSummaries = summaries;

        if (statsMinimal) {
            statsMinimal.innerHTML = `
                <span class="opacity-60">Índice activo:</span>
                <span class="font-semibold text-guinda">${totalLeyes} leyes</span>
                <span class="mx-1 opacity-30">|</span>
                <span class="font-semibold text-guinda">${totalArticulos} artículos</span>
            `;
        }
        updateFavoritesBtn();
        // Handle URL hash (deep link) once data is ready
        setTimeout(handleInitialHash, 0);
    });

    // Favorites nav buttons
    const navFavBtn = document.getElementById('nav-favorites');
    const mobileFavBtn = document.getElementById('mobile-nav-favorites');
    if (navFavBtn) navFavBtn.addEventListener('click', () => showFavoritesView());
    if (mobileFavBtn) mobileFavBtn.addEventListener('click', () => { showFavoritesView(); toggleMobileMenu(false); });

    // Stats nav buttons
    const navStatsBtn = document.getElementById('nav-stats');
    const mobileNavStats = document.getElementById('mobile-nav-stats');
    if (navStatsBtn) navStatsBtn.addEventListener('click', (e) => { e.preventDefault(); showStatsView(); });
    if (mobileNavStats) mobileNavStats.addEventListener('click', (e) => { e.preventDefault(); showStatsView(); toggleMobileMenu(false); });

    // Compare modal close
    document.getElementById('close-compare-modal')?.addEventListener('click', closeCompareModal);
    document.getElementById('compare-modal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('compare-modal')) closeCompareModal();
    });

    // ── Deep Linking, Toast & Skeleton Loaders ────────────────────────────────
    function setHash(hash) {
        history.replaceState(null, '', hash ? `${location.pathname}${hash}` : location.pathname);
    }

    function handleInitialHash() {
        const hash = location.hash;
        if (!hash) return;
        if (hash.startsWith('#art-')) {
            const id = decodeURIComponent(hash.slice(5));
            const item = getArticleById(id);
            if (!item) return;
            currentModalList = [item];
            openDetail(id);
        } else if (hash.startsWith('#ley-')) {
            const leyId = decodeURIComponent(hash.slice(5));
            const law = cachedSummaries.find(l => l.id === leyId);
            if (law) openLawDetail(law);
        }
    }

    function showToast(message, icon = '✓', color = 'bg-gray-900') {
        const existing = document.getElementById('app-toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.id = 'app-toast';
        toast.className = `fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-5 py-3 ${color} text-white text-xs font-semibold rounded-full shadow-2xl transition-all duration-300 opacity-0 scale-90 pointer-events-none`;
        toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
        document.body.appendChild(toast);
        requestAnimationFrame(() => {
            toast.classList.replace('opacity-0', 'opacity-100');
            toast.classList.replace('scale-90', 'scale-100');
        });
        setTimeout(() => {
            toast.classList.replace('opacity-100', 'opacity-0');
            toast.classList.replace('scale-100', 'scale-90');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
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

    function resetToHero() {
        setHash(null);
        if (searchInput) searchInput.value = '';
        heroSection.classList.remove('hidden');
        quickFilters.classList.remove('hidden');
        statsMinimal.classList.remove('hidden');

        mainContainer.classList.add('justify-center', 'pt-24');
        mainContainer.classList.remove('pt-8');

        resultsContainer.classList.add('hidden', 'opacity-0');
        resultsContainer.innerHTML = '';

        if (lawDetailContainer) lawDetailContainer.classList.add('hidden', 'opacity-0');

        // Clean up external controls (Filters & Pagination)
        const filters = document.getElementById('search-filters');
        if (filters) filters.remove();

        const pagination = document.querySelector('.pagination-nav');
        if (pagination) pagination.remove();

        // Reset state
        currentPage = 1;
        currentFilters = { type: 'all', law: 'all' };
    }

    function showLawsView() {
        setHash(null);
        // Transition UI
        heroSection.classList.add('hidden');
        quickFilters.classList.add('hidden');
        statsMinimal.classList.add('hidden');
        if (lawDetailContainer) lawDetailContainer.classList.add('hidden', 'opacity-0');

        mainContainer.classList.remove('justify-center', 'pt-24');
        mainContainer.classList.add('pt-8');

        resultsContainer.classList.remove('hidden');
        setTimeout(() => resultsContainer.classList.remove('opacity-0'), 50);

        if (searchInput) searchInput.value = '';

        // Render Laws Grid
        if (cachedSummaries.length === 0) {
            resultsContainer.innerHTML = `<div class="text-center py-12 text-gray-400">Cargando leyes...</div>`;
            return;
        }

        // Categorize Documents
        const leyes = cachedSummaries.filter(l => l.titulo.toLowerCase().startsWith('ley'));
        const reglamentos = cachedSummaries.filter(l => l.titulo.toLowerCase().startsWith('reglamento'));
        const otros = cachedSummaries.filter(l => !l.titulo.toLowerCase().startsWith('ley') && !l.titulo.toLowerCase().startsWith('reglamento'));

        resultsContainer.innerHTML = `
            <div class="w-full mb-8">
                <h2 class="text-2xl font-head font-bold text-gray-800 mb-2">Marco Jurídico Disponible</h2>
                <p class="text-sm text-gray-400 font-light">Explora las leyes y reglamentos indexados en el sistema.</p>
            </div>
            
            ${renderCarouselSection('Leyes Federales', leyes)}
            ${renderCarouselSection('Reglamentos', reglamentos)}
            ${renderCarouselSection('Acuerdos y Otros Instrumentos', otros)}
        `;

        // Add listeners to law cards
        document.querySelectorAll('.law-card').forEach(card => {
            card.addEventListener('click', () => {
                const title = card.dataset.title;
                const law = cachedSummaries.find(l => l.titulo === title);
                if (law) openLawDetail(law);
            });
        });

        // Add Scroll Listeners
        document.querySelectorAll('.carousel-container').forEach(container => {
            const scrollContainer = container.querySelector('.carousel-scroll');
            const leftBtn = container.querySelector('.scroll-left');
            const rightBtn = container.querySelector('.scroll-right');

            if (leftBtn && rightBtn && scrollContainer) {
                leftBtn.addEventListener('click', () => {
                    scrollContainer.scrollBy({ left: -300, behavior: 'smooth' });
                });

                rightBtn.addEventListener('click', () => {
                    scrollContainer.scrollBy({ left: 300, behavior: 'smooth' });
                });
            }
        });
    }

    function renderTimeline(laws) {
        const container = document.getElementById('laws-timeline');
        if (!container || !window.vis) return;

        container.innerHTML = '';

        // Parse dates
        const parseDate = (dateStr) => {
            if (!dateStr) return null;
            // Handle DD/MM/YYYY
            const parts = dateStr.split('/');
            if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]);
            return new Date(dateStr); // Fallback
        };

        const data = laws.map(l => ({
            id: l.id,
            content: l.titulo,
            start: parseDate(l.fecha),
            type: 'point',
            group: l.titulo.toLowerCase().startsWith('ley') ? 1 :
                l.titulo.toLowerCase().startsWith('reglamento') ? 2 : 3,
            className: l.titulo.toLowerCase().startsWith('ley') ? 'vis-item-ley' :
                l.titulo.toLowerCase().startsWith('reglamento') ? 'vis-item-reglamento' : 'vis-item-otro'
        })).filter(d => d.start && !isNaN(d.start));

        if (data.length === 0) {
            container.innerHTML = '<div class="text-xs text-gray-400 text-center py-10">No hay fechas disponibles para la línea de tiempo.</div>';
            return;
        }

        const groups = new vis.DataSet([
            { id: 1, content: 'Leyes', className: 'vis-group-ley' },
            { id: 2, content: 'Reglamentos', className: 'vis-group-reglamento' },
            { id: 3, content: 'Otros', className: 'vis-group-otro' }
        ]);

        const items = new vis.DataSet(data);

        const options = {
            height: '350px', // Increased height
            minHeight: '350px',
            start: new Date(2010, 0, 1),
            end: new Date(),
            zoomMin: 1000 * 60 * 60 * 24 * 30, // Min zoom: 1 month
            zoomMax: 1000 * 60 * 60 * 24 * 365 * 50, // Max zoom: 50 years
            horizontalScroll: true,
            verticalScroll: true,
            zoomKey: 'ctrlKey',
            orientation: 'top',
            stack: true,
            tooltip: {
                followMouse: true,
                overflowMethod: 'cap'
            },
            format: {
                minorLabels: {
                    minute: 'h:mma',
                    hour: 'h:mma',
                    weekday: 'ddd D',
                    day: 'D',
                    week: 'w',
                    month: 'MMM', // Month abbreviation (Ene, Feb...)
                    year: 'YYYY'
                },
                majorLabels: {
                    minute: 'dddd D MMMM',
                    hour: 'dddd D MMMM',
                    weekday: 'MMMM YYYY',
                    day: 'MMMM YYYY',
                    week: 'MMMM YYYY',
                    month: 'YYYY', // Year shown above months
                    year: ''
                }
            },
            locale: 'es' // Ensure Spanish locale if available or default
        };

        const timeline = new vis.Timeline(container, items, groups, options);

        // Add custom styles for Vis.js
        const style = document.createElement('style');
        style.innerHTML = `
            .vis-item { border-color: transparent; background-color: transparent; font-size: 10px; }
            .vis-item-ley .vis-item-content { background-color: #9B2247; color: white; border-radius: 4px; padding: 4px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .vis-item-reglamento .vis-item-content { background-color: #D4C19C; color: #1F2937; border-radius: 4px; padding: 4px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .vis-item-otro .vis-item-content { background-color: #6B7280; color: white; border-radius: 4px; padding: 4px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .vis-label { font-family: 'Noto Sans', sans-serif; font-weight: 600; color: #4B5563; }
            .vis-time-axis .vis-text { color: #9CA3AF; font-size: 10px; }
            .vis-timeline { border: none; }
            .vis-panel.vis-center, .vis-panel.vis-left, .vis-panel.vis-right, .vis-panel.vis-top, .vis-panel.vis-bottom { border-color: #F3F4F6; }
        `;
        document.head.appendChild(style);

        // Event Listeners
        timeline.on('select', function (properties) {
            if (properties.items.length > 0) {
                const selectedId = properties.items[0];
                const selectedLaw = laws.find(l => l.id === selectedId);
                if (selectedLaw) openLawDetail(selectedLaw);
            }
        });
    }

    function renderCarouselSection(title, items) {
        if (items.length === 0) return '';

        const isLey = title.toLowerCase().includes('ley');
        const isReglamento = title.toLowerCase().includes('reglamento');

        // Category color config
        const cat = isLey
            ? { accent: '#9B2247', gradFrom: '#6b1532', gradTo: '#9B2247', label: 'Ley Federal', dotClass: 'bg-guinda' }
            : isReglamento
            ? { accent: '#1E5B4F', gradFrom: '#14403a', gradTo: '#1E5B4F', label: 'Reglamento', dotClass: 'bg-emerald-700' }
            : { accent: '#A57F2C', gradFrom: '#7a5c1e', gradTo: '#A57F2C', label: 'Instrumento', dotClass: 'bg-amber-700' };

        // Category icons (SVG paths)
        const iconPath = isLey
            ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>`
            : isReglamento
            ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>`
            : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>`;

        return `
            <div class="mb-10 carousel-container group/section">
                <h3 class="text-lg font-bold text-gray-800 mb-4 px-1 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full ${cat.dotClass} flex-shrink-0"></span>
                    ${title}
                    <span class="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">${items.length}</span>
                </h3>

                <div class="relative">
                    <!-- Left Arrow -->
                    <button class="scroll-left absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 bg-white/90 backdrop-blur border border-gray-100 shadow-lg rounded-full p-2 text-gray-600 opacity-0 group-hover/section:opacity-100 transition-opacity disabled:opacity-0 hover:text-guinda hover:scale-110 hidden md:block">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>

                    <!-- Carousel Track -->
                    <div class="carousel-scroll flex gap-5 overflow-x-auto pb-6 -mx-4 px-4 snap-x scrollbar-hide scroll-smooth">
                        ${items.map(law => {
                            const snippet = law.resumen
                                ? law.resumen.replace(/\n/g, ' ').slice(0, 110) + (law.resumen.length > 110 ? '…' : '')
                                : (law.temas_clave && law.temas_clave.length > 0
                                    ? law.temas_clave.slice(0, 3).join(' · ')
                                    : 'Ver artículos');
                            return `
                            <div class="min-w-[300px] w-[300px] md:min-w-[340px] md:w-[340px] snap-start rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer law-card group flex flex-col h-[280px]"
                                data-title="${law.titulo.replace(/"/g, '&quot;')}"
                                style="background: linear-gradient(160deg, ${cat.gradFrom} 0%, ${cat.gradTo} 100%);">

                                <!-- Top: icon + label -->
                                <div class="flex items-start justify-between px-5 pt-5 pb-3">
                                    <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style="background: rgba(255,255,255,0.15); backdrop-filter: blur(4px);">
                                        <svg class="w-6 h-6 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">${iconPath}</svg>
                                    </div>
                                    <span class="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full text-white/80" style="background: rgba(255,255,255,0.15);">${cat.label}</span>
                                </div>

                                <!-- Middle: title + description -->
                                <div class="flex-1 px-5 pb-2 flex flex-col justify-center">
                                    <h3 class="text-sm font-bold text-white leading-snug line-clamp-2 mb-2 group-hover:text-white/90 transition-colors" title="${law.titulo.replace(/"/g, '&quot;')}">${law.titulo}</h3>
                                    <p class="text-[11px] text-white/65 leading-relaxed line-clamp-3">${snippet}</p>
                                </div>

                                <!-- Footer: metadata bar -->
                                <div class="flex items-center justify-between px-5 py-3" style="background: rgba(0,0,0,0.25); backdrop-filter: blur(4px);">
                                    <div class="flex items-center gap-1.5 text-white/70 text-[10px]">
                                        <svg class="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        <span>${law.articulos} artículos</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-white/50 text-[10px]">${law.fecha || 'N/D'}</span>
                                        <svg class="w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                    </div>
                                </div>
                            </div>`;
                        }).join('')}
                    </div>

                    <!-- Right Arrow -->
                    <button class="scroll-right absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 bg-white/90 backdrop-blur border border-gray-100 shadow-lg rounded-full p-2 text-gray-600 opacity-0 group-hover/section:opacity-100 transition-opacity hover:text-guinda hover:scale-110 hidden md:block">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>
            </div>
        `;
    }

    function openLawDetail(law) {
        if (!lawDetailContainer) return;

        // Fetch all articles for this law
        currentLawArticles = getArticlesByLaw(law.titulo);

        // Calculate detailed stats
        const chapters = [...new Set(currentLawArticles.map(a => a.capitulo_nombre).filter(Boolean))];
        const titles = [...new Set(currentLawArticles.map(a => a.titulo_nombre).filter(Boolean))];
        const transitorios = currentLawArticles.filter(a => a.articulo_label.toLowerCase().includes('transitorio')).length;

        // Hide other views
        resultsContainer.classList.add('hidden');
        heroSection.classList.add('hidden');
        quickFilters.classList.add('hidden');
        statsMinimal.classList.add('hidden');

        // Show Law Detail
        lawDetailContainer.classList.remove('hidden');
        setTimeout(() => lawDetailContainer.classList.remove('opacity-0'), 50);
        setHash(`#ley-${encodeURIComponent(law.id)}`);

        // Reading Controls State
        let currentFontSize = 100; // Percentage
        let currentTheme = localStorage.getItem('reader-theme') || 'light'; // light, sepia, dark

        lawDetailContainer.innerHTML = `
            <!-- Desktop Reading Controls (hidden on mobile) -->
            <div id="reading-controls" class="hidden md:flex fixed bottom-6 right-6 z-40 flex-col gap-2 animate-fade-in-up">
                 <div class="bg-white/95 backdrop-blur border border-gray-200 shadow-2xl rounded-2xl p-2 flex flex-col gap-2 items-center transition-colors duration-300" id="reading-panel">
                    <div class="flex items-center gap-1 bg-gray-50 rounded-full p-1">
                        <button id="btn-font-decrease" class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors" title="Letra más pequeña">
                            <span class="font-serif text-sm">A</span>
                        </button>
                        <span id="font-size-display" class="text-[10px] font-bold text-gray-400 w-8 text-center">${currentFontSize}%</span>
                        <button id="btn-font-increase" class="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors" title="Letra más grande">
                            <span class="font-serif text-lg font-bold">A</span>
                        </button>
                    </div>
                    <div class="w-full h-px bg-gray-100"></div>
                    <div class="flex gap-1">
                        <button class="theme-btn w-6 h-6 rounded-full border-2 border-transparent bg-white shadow-sm hover:scale-110 transition-transform ${currentTheme === 'light' ? 'ring-2 ring-guinda ring-offset-1' : ''}" data-theme="light" title="Modo Claro"></button>
                        <button class="theme-btn w-6 h-6 rounded-full border-2 border-transparent bg-[#f4ecd8] shadow-sm hover:scale-110 transition-transform ${currentTheme === 'sepia' ? 'ring-2 ring-guinda ring-offset-1' : ''}" data-theme="sepia" title="Modo Sepia"></button>
                        <button class="theme-btn w-6 h-6 rounded-full border-2 border-transparent bg-[#1a1a1a] shadow-sm hover:scale-110 transition-transform ${currentTheme === 'dark' ? 'ring-2 ring-guinda ring-offset-1' : ''}" data-theme="dark" title="Modo Oscuro"></button>
                    </div>
                 </div>
            </div>

            <!-- Mobile: floating settings toggle -->
            <button id="mobile-reading-toggle" class="md:hidden fixed bottom-6 right-6 z-50 w-12 h-12 bg-white border border-gray-200 shadow-xl rounded-full flex items-center justify-center text-gray-500 hover:text-guinda transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            </button>
            <!-- Mobile reading overlay -->
            <div id="mobile-reading-overlay" class="md:hidden fixed inset-0 bg-black/30 z-40 hidden"></div>
            <!-- Mobile reading bottom sheet -->
            <div id="mobile-reading-sheet" class="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-gray-100 transform translate-y-full transition-transform duration-300">
                <div class="flex justify-center pt-3 pb-1"><div class="w-10 h-1 bg-gray-200 rounded-full"></div></div>
                <div class="px-6 pb-10 pt-2">
                    <p class="text-sm font-bold text-gray-800 mb-5">Opciones de lectura</p>
                    <div class="mb-6">
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Tamaño de texto</p>
                        <div class="flex items-center gap-4">
                            <button id="mob-font-decrease" class="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center font-serif text-xl text-gray-600 active:bg-guinda active:text-white transition-colors">A</button>
                            <span id="mob-font-display" class="flex-1 text-center text-sm font-bold text-gray-500">${currentFontSize}%</span>
                            <button id="mob-font-increase" class="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center font-serif text-3xl font-bold text-gray-600 active:bg-guinda active:text-white transition-colors">A</button>
                        </div>
                    </div>
                    <div>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Fondo</p>
                        <div class="grid grid-cols-3 gap-3">
                            <button class="mob-theme-btn h-14 rounded-2xl border-2 flex items-center justify-center text-xs font-bold transition-all bg-white ${currentTheme === 'light' ? 'border-guinda text-guinda' : 'border-gray-100 text-gray-700'}" data-theme="light">Blanco</button>
                            <button class="mob-theme-btn h-14 rounded-2xl border-2 flex items-center justify-center text-xs font-bold transition-all bg-[#f4ecd8] ${currentTheme === 'sepia' ? 'border-guinda text-guinda' : 'border-transparent text-[#5b4636]'}" data-theme="sepia">Sepia</button>
                            <button class="mob-theme-btn h-14 rounded-2xl border-2 flex items-center justify-center text-xs font-bold transition-all bg-[#1a1a1a] ${currentTheme === 'dark' ? 'border-guinda' : 'border-transparent'} text-white" data-theme="dark">Oscuro</button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mb-8 animate-fade-in-up transition-colors duration-300" id="law-header-area">
                <button id="back-to-laws" class="text-xs font-semibold text-gray-400 hover:text-guinda mb-4 flex items-center gap-1 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    Regresar al índice
                </button>
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6">
                    <div>
                        <span class="text-xs font-bold text-guinda uppercase tracking-widest bg-guinda/5 px-2 py-1 rounded-full">Marco Legal Vigente</span>
                        <h1 class="text-3xl sm:text-4xl font-head font-bold text-gray-900 mt-3 mb-2">${law.titulo}</h1>
                        <p class="text-sm text-gray-500">Publicado: ${law.fecha} · Última reforma: ${law.fecha}</p>
                        ${law.resumen ? `<div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-600 font-light leading-relaxed max-w-4xl">${law.resumen.split('\n\n')[0]}</div>` : ''}
                    </div>
                    <div class="flex gap-2 flex-wrap">
                        <!-- Share button for the law -->
                        <div class="relative" id="law-share-wrapper">
                            <button id="law-share-btn" class="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:border-green-500 hover:text-green-600 transition-all flex items-center gap-2 shadow-sm">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                Compartir
                            </button>
                            <div id="law-share-menu" class="hidden absolute top-full mt-2 right-0 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden w-48 z-20">
                                <button id="law-share-text-btn" class="block w-full text-left px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-50 hover:text-green-600 transition-colors">📝 Compartir resumen</button>
                                <div class="border-t border-gray-50"></div>
                                <button id="law-share-link-btn" class="block w-full text-left px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors">🔗 Copiar enlace a la ley</button>
                            </div>
                        </div>
                        <button id="export-csv-btn" class="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:border-guinda hover:text-guinda transition-all flex items-center gap-2 shadow-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            Exportar CSV
                        </button>
                        <button id="print-btn" class="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:border-guinda hover:text-guinda transition-all flex items-center gap-2 shadow-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                            Imprimir / PDF
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats & Structure Dashboard -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in-up" style="animation-delay: 0.1s;">
                 <!-- Metric Cards -->
                 <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center items-center hover:shadow-md transition-shadow">
                     <span class="text-3xl font-head font-bold text-guinda">${currentLawArticles.length}</span>
                     <span class="text-xs text-gray-400 uppercase tracking-widest mt-1">Artículos</span>
                 </div>
                 <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center items-center hover:shadow-md transition-shadow">
                     <span class="text-3xl font-head font-bold text-guinda">${chapters.length}</span>
                     <span class="text-xs text-gray-400 uppercase tracking-widest mt-1">Capítulos</span>
                 </div>
                 <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center items-center hover:shadow-md transition-shadow">
                     <span class="text-3xl font-head font-bold text-guinda">${transitorios}</span>
                     <span class="text-xs text-gray-400 uppercase tracking-widest mt-1">Transitorios</span>
                 </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 animate-fade-in-up" style="animation-delay: 0.2s;">
                <!-- Structure Chart (Expanded) -->
                <div class="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 class="font-head font-bold text-gray-800 mb-6 text-sm flex items-center gap-2">
                        <svg class="w-4 h-4 text-guinda" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        Distribución de Contenido
                    </h3>
                    <div id="law-structure-chart" class="w-full h-64"></div>
                </div>

                <!-- Topics Cloud -->
                <div class="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 class="font-head font-bold text-gray-800 mb-6 text-sm flex items-center gap-2">
                        <svg class="w-4 h-4 text-guinda" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                        Temas Principales
                    </h3>
                    <div class="flex flex-wrap gap-2 content-start">
                        ${law.temas_clave ? law.temas_clave.map(t => `<button class="theme-filter-btn text-xs bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-100 hover:bg-guinda hover:text-white hover:border-guinda transition-all shadow-sm" data-theme="${t}">${t}</button>`).join('') : '<span class="text-xs text-gray-400">No disponibles</span>'}
                    </div>
                </div>
            </div>

            <!-- Main Content Area -->
            <div class="animate-fade-in-up" style="animation-delay: 0.3s;">
                <!-- Scoped Search -->
                <div class="relative mb-6 group max-w-2xl mx-auto">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg class="h-4 w-4 text-gray-400 group-focus-within:text-guinda transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input type="text" id="law-search-input" 
                        class="block w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-full text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-guinda/10 focus:border-guinda transition-all" 
                        placeholder="Buscar artículos específicos en ${law.titulo}...">
                </div>

                <!-- Articles List -->
                <div id="law-articles-list" class="space-y-4 max-w-4xl mx-auto">
                    <!-- Render initial articles -->
                </div>
            </div>
        `;

        // Render initial articles (first 20 to avoid lag)
        renderLawArticles(currentLawArticles.slice(0, 20), '');

        // Render D3 Chart
        setTimeout(() => {
            renderLawStructureChart(currentLawArticles);
        }, 100);

        // Reading Controls Listeners
        const articlesList = document.getElementById('law-articles-list');
        const increaseBtn = document.getElementById('btn-font-increase');
        const decreaseBtn = document.getElementById('btn-font-decrease');
        const fontDisplay = document.getElementById('font-size-display');
        const themeBtns = document.querySelectorAll('.theme-btn');
        const headerArea = document.getElementById('law-header-area');

        // Apply saved theme immediately
        const applyTheme = (theme) => {
            currentTheme = theme;
            localStorage.setItem('reader-theme', theme);

            document.body.className = `bg-${theme} text-gray-900 font-body min-h-screen flex flex-col antialiased transition-colors duration-300`;

            // Update desktop buttons active state
            themeBtns.forEach(btn => {
                btn.classList.remove('ring-2', 'ring-guinda', 'ring-offset-1');
                if (btn.dataset.theme === theme) {
                    btn.classList.add('ring-2', 'ring-guinda', 'ring-offset-1');
                }
            });
            // Update mobile sheet buttons active state
            document.querySelectorAll('.mob-theme-btn').forEach(btn => {
                btn.classList.remove('border-guinda', 'text-guinda');
                btn.classList.add('border-transparent');
                if (btn.dataset.theme === theme) {
                    btn.classList.remove('border-transparent');
                    btn.classList.add('border-guinda');
                    if (theme !== 'dark') btn.classList.add('text-guinda');
                }
            });

            // Ensure styles exist
            if (!document.getElementById('reader-themes-style')) {
                const style = document.createElement('style');
                style.id = 'reader-themes-style';
                style.innerHTML = `
                    /* Sepia Mode */
                    .bg-sepia { background-color: #f4ecd8 !important; color: #5b4636 !important; }
                    .bg-sepia .bg-white { background-color: #fdf6e3 !important; border-color: #e6dcb1 !important; }
                    .bg-sepia .text-gray-900, .bg-sepia .text-gray-800 { color: #433422 !important; }
                    .bg-sepia .text-gray-600, .bg-sepia .text-gray-500 { color: #5b4636 !important; }
                    .bg-sepia #reading-panel { background-color: rgba(253, 246, 227, 0.95) !important; border-color: #e6dcb1 !important; }
                    
                    /* Dark Mode */
                    .bg-dark { background-color: #121212 !important; color: #e5e5e5 !important; }
                    .bg-dark .bg-white { background-color: #1e1e1e !important; border-color: #2d2d2d !important; }
                    .bg-dark .text-gray-900, .bg-dark .text-gray-800 { color: #ffffff !important; }
                    .bg-dark .text-gray-700 { color: #d4d4d4 !important; }
                    .bg-dark .text-gray-600, .bg-dark .text-gray-500 { color: #a3a3a3 !important; }
                    .bg-dark .text-gray-400 { color: #737373 !important; }
                    .bg-dark .border-gray-100, .bg-dark .border-gray-200 { border-color: #2d2d2d !important; }
                    .bg-dark .bg-gray-50 { background-color: #252525 !important; }
                    .bg-dark .bg-guinda\/5 { background-color: rgba(239, 68, 68, 0.1) !important; }
                    .bg-dark #reading-panel { background-color: rgba(30, 30, 30, 0.95) !important; border-color: #404040 !important; }
                    .bg-dark .text-guinda { color: #f87171 !important; } /* Soft red for dark mode */
                    .bg-dark #search-input { background-color: #1e1e1e !important; border-color: #404040 !important; color: #ffffff !important; }
                    .bg-dark #search-input::placeholder { color: #737373 !important; }
                    .bg-dark .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important; }
                    .bg-dark .hover\:bg-gray-50:hover { background-color: #2d2d2d !important; }
                `;
                document.head.appendChild(style);
            }
        };

        // Initialize theme
        applyTheme(currentTheme);

        const updateFontSize = () => {
            if (articlesList) articlesList.style.fontSize = `${currentFontSize}%`;
            document.querySelectorAll('#font-size-display, #mob-font-display').forEach(el => {
                el.innerText = `${currentFontSize}%`;
            });
        };

        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => {
                if (currentFontSize < 250) {
                    currentFontSize += 10;
                    updateFontSize();
                }
            });
        }

        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => {
                if (currentFontSize > 80) {
                    currentFontSize -= 10;
                    updateFontSize();
                }
            });
        }

        if (fontDisplay) {
            fontDisplay.addEventListener('click', () => {
                currentFontSize = 100;
                updateFontSize();
            });
            fontDisplay.style.cursor = 'pointer';
            fontDisplay.title = 'Restablecer al 100%';
        }

        themeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                applyTheme(e.target.dataset.theme);
            });
        });

        // Mobile reading sheet
        const mobileReadingToggle = document.getElementById('mobile-reading-toggle');
        const mobileReadingSheet = document.getElementById('mobile-reading-sheet');
        const mobileReadingOverlay = document.getElementById('mobile-reading-overlay');

        const toggleMobileReadingSheet = (show) => {
            mobileReadingSheet?.classList.toggle('translate-y-full', !show);
            mobileReadingOverlay?.classList.toggle('hidden', !show);
        };

        mobileReadingToggle?.addEventListener('click', () => toggleMobileReadingSheet(true));
        mobileReadingOverlay?.addEventListener('click', () => toggleMobileReadingSheet(false));

        document.getElementById('mob-font-decrease')?.addEventListener('click', () => {
            if (currentFontSize > 80) { currentFontSize -= 10; updateFontSize(); }
        });
        document.getElementById('mob-font-increase')?.addEventListener('click', () => {
            if (currentFontSize < 250) { currentFontSize += 10; updateFontSize(); }
        });
        document.querySelectorAll('.mob-theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                applyTheme(btn.dataset.theme);
                toggleMobileReadingSheet(false);
            });
        });

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

        if (lawShareTextBtn) {
            lawShareTextBtn.addEventListener('click', () => {
                lawShareMenu?.classList.add('hidden');
                const resumen = law.resumen ? law.resumen.split('\n\n')[0].substring(0, 600) : `${law.articulos} artículos`;
                const text = `🏛️ *${law.titulo}*\n📅 Publicado: ${law.fecha}\n\n${resumen}\n\n📖 ${law.articulos} artículos`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
            });
        }

        if (lawShareLinkBtn) {
            lawShareLinkBtn.addEventListener('click', () => {
                lawShareMenu?.classList.add('hidden');
                const url = `${location.origin}${location.pathname}#ley-${encodeURIComponent(law.id)}`;
                navigator.clipboard.writeText(url).then(() => showToast('¡Enlace copiado!', '🔗', 'bg-blue-600'));
            });
        }

        // Print / PDF
        document.getElementById('print-btn')?.addEventListener('click', () => window.print());

        // Listeners
        document.getElementById('back-to-laws').addEventListener('click', () => {
            // Reset to light mode globally when leaving reading view if you want
            // applyTheme('light'); 
            showLawsView();
        });

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

        const lawSearchInput = document.getElementById('law-search-input');
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

            renderLawArticles(filtered.slice(0, 50), query); // Show top 50 matches
        });

        document.getElementById('export-csv-btn').addEventListener('click', () => {
            exportToCSV(currentLawArticles, `${law.titulo}.csv`);
        });
    }

    function renderLawStructureChart(articles) {
        const chartContainer = document.getElementById('law-structure-chart');
        if (!chartContainer) return;

        if (!window.d3) {
            chartContainer.innerHTML = '<div class="flex items-center justify-center h-full text-xs text-gray-400">Cargando visualización...</div>';
            // Retry once after a delay
            setTimeout(() => renderLawStructureChart(articles), 1000);
            return;
        }

        chartContainer.innerHTML = '';

        if (!articles || articles.length === 0) {
            chartContainer.innerHTML = '<div class="flex items-center justify-center h-full text-xs text-gray-400">No hay datos para visualizar</div>';
            return;
        }

        // Process data: Count articles per Title/Chapter
        const dataMap = {};
        articles.forEach(a => {
            let key = a.titulo_nombre || a.capitulo_nombre || 'General';
            // Clean key
            // Remove common prefixes
            key = key.replace(/^TÍTULO\s+/i, '').replace(/^CAPÍTULO\s+/i, '');
            // Remove roman numerals only if they are at the start followed by a separator or end of string
            // e.g. "I. DISPOSICIONES" -> "DISPOSICIONES", "PRIMERO" -> ""
            key = key.replace(/^[IVXLCDM]+\.?\s*-?\s*/, '');
            // Remove ordinal words if they appear at start (e.g. "PRIMERO", "SEGUNDO")
            key = key.replace(/^(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|SÉPTIMO|OCTAVO|NOVENO|DÉCIMO)\.?\s*-?\s*/i, '');

            key = key.trim();

            if (!key) key = 'General';
            if (key.length > 25) key = key.substring(0, 25) + '...';

            dataMap[key] = (dataMap[key] || 0) + 1;
        });

        const data = Object.entries(dataMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

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

        currentModalList = articles;

        list.innerHTML = articles.map(item => {
            const highlightedText = highlightQuery ? highlightText(item.texto, highlightQuery) : item.texto.substring(0, 300) + '...';
            const bookmarkIcon = isFavorite(item.id)
                ? `<svg class="w-3.5 h-3.5 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>`
                : `<svg class="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>`;
            const isSelected = compareSelection.includes(item.id);
            const compareColor = isSelected ? 'text-guinda' : (compareSelection.length >= 2 ? 'text-gray-100' : 'text-gray-300 hover:text-guinda');
            const compareBg = isSelected ? 'bg-guinda/10' : '';

            return `
            <div class="relative bg-white border ${isSelected ? 'border-guinda/30' : 'border-gray-100'} rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer result-item" data-id="${item.id}">
                <div class="flex items-center justify-between mb-2 pr-14">
                    <span class="text-xs font-bold text-gray-700">${item.articulo_label}</span>
                    <span class="text-[10px] text-gray-400">${item.titulo_nombre || ''}</span>
                </div>
                <p class="text-sm text-gray-600 font-light leading-relaxed line-clamp-3">${highlightedText}</p>
                <button class="bookmark-card-btn absolute top-3 right-9 p-1 text-gray-300 hover:text-guinda transition-colors" data-id="${item.id}">${bookmarkIcon}</button>
                <button class="compare-card-btn absolute top-3 right-3 p-1 ${compareColor} ${compareBg} rounded transition-colors" data-id="${item.id}" title="Comparar artículo">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/></svg>
                </button>
            </div>
            `;
        }).join('');

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
                toggleFavorite(btn.dataset.id);
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

    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function highlightText(text, query) {
        if (!query || !text) return text || '';
        const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 text-gray-900 rounded-sm px-0.5">$1</mark>');
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
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
        localStorage.setItem('search-history', JSON.stringify(history.slice(0, 10)));
    }

    function getHistory() {
        return JSON.parse(localStorage.getItem('search-history') || '[]');
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

    // Search Input Listener
    if (searchInput) {
        // Autocomplete Container
        const autocompleteContainer = document.createElement('div');
        autocompleteContainer.id = 'autocomplete-results';
        autocompleteContainer.className = 'absolute w-full bg-white border border-gray-100 rounded-2xl shadow-xl mt-2 hidden z-50 overflow-hidden';
        searchInput.parentNode.appendChild(autocompleteContainer);

        // Hide autocomplete on click outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !autocompleteContainer.contains(e.target)) {
                autocompleteContainer.classList.add('hidden');
            }
        });

        // Show search history on focus when input is empty
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim().length > 0) return;
            const history = getHistory();
            if (history.length === 0) return;

            autocompleteContainer.innerHTML = `
                <div class="px-4 py-2 text-[10px] uppercase tracking-widest text-gray-400 font-bold bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span>Búsquedas recientes</span>
                    <button id="clear-all-history" class="text-gray-300 hover:text-guinda transition-colors text-[9px] normal-case tracking-normal">Borrar todo</button>
                </div>
                ${history.slice(0, 7).map(q => `
                    <div class="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors history-item" data-query="${q}">
                        <svg class="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="text-sm text-gray-600 truncate flex-1">${q}</span>
                        <button class="remove-history-item text-gray-200 hover:text-gray-500 transition-colors text-base leading-none flex-shrink-0" data-query="${q}">×</button>
                    </div>
                `).join('')}
            `;
            autocompleteContainer.classList.remove('hidden');

            document.getElementById('clear-all-history')?.addEventListener('click', (e) => {
                e.stopPropagation();
                localStorage.removeItem('search-history');
                autocompleteContainer.classList.add('hidden');
            });

            autocompleteContainer.querySelectorAll('.history-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (e.target.classList.contains('remove-history-item')) {
                        e.stopPropagation();
                        const q = e.target.dataset.query;
                        const updated = getHistory().filter(h => h !== q);
                        localStorage.setItem('search-history', JSON.stringify(updated));
                        item.remove();
                        if (autocompleteContainer.querySelectorAll('.history-item').length === 0) {
                            autocompleteContainer.classList.add('hidden');
                        }
                        return;
                    }
                    searchInput.value = item.dataset.query;
                    searchInput.dispatchEvent(new Event('input'));
                    autocompleteContainer.classList.add('hidden');
                });
            });
        });

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            if (query.length > 2) {
                // UI Transition to "Search Mode"
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

                // Autocomplete Logic
                if (cachedSummaries.length > 0) {
                    const suggestions = cachedSummaries.filter(s => s.titulo.toLowerCase().includes(query.toLowerCase())).slice(0, 5);

                    if (suggestions.length > 0) {
                        autocompleteContainer.innerHTML = `
                            <div class="px-4 py-2 text-[10px] uppercase tracking-widest text-gray-400 font-bold bg-gray-50 border-b border-gray-100">Sugerencias Directas</div>
                            ${suggestions.map(s => `
                                <div class="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors suggestion-item" data-title="${s.titulo}">
                                    <svg class="w-4 h-4 text-guinda opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                    <span class="text-sm text-gray-700 font-medium truncate">${s.titulo}</span>
                                </div>
                            `).join('')}
                         `;
                        autocompleteContainer.classList.remove('hidden');

                        // Bind suggestion clicks
                        autocompleteContainer.querySelectorAll('.suggestion-item').forEach(item => {
                            item.addEventListener('click', () => {
                                const title = item.dataset.title;
                                const law = cachedSummaries.find(l => l.titulo === title);
                                if (law) {
                                    openLawDetail(law);
                                    autocompleteContainer.classList.add('hidden');
                                    searchInput.value = ''; // Clear search
                                }
                            });
                        });
                    } else {
                        autocompleteContainer.classList.add('hidden');
                    }
                }

                // Debounce search slightly for performance
                setTimeout(() => {
                    const results = performSearch(query);
                    currentSearchResults = results;
                    currentSearchQuery = query;
                    currentPage = 1;
                    currentFilters = { type: 'all', law: 'all' };
                    saveToHistory(query);
                    renderResults();
                    if (loadingIndicator) loadingIndicator.classList.add('hidden');
                }, 100);

            } else if (query.length === 0) {
                // Reset to "Hero Mode"
                heroSection.classList.remove('hidden');
                quickFilters.classList.remove('hidden');
                statsMinimal.classList.remove('hidden');

                mainContainer.classList.add('justify-center', 'pt-24');
                mainContainer.classList.remove('pt-8');

                resultsContainer.classList.add('hidden', 'opacity-0');
                resultsContainer.innerHTML = '';
            }
        });
    }

    let currentFilters = { type: 'all', law: 'all' };
    let currentModalList = [];
    let compareSelection = [];

    // Favorites helpers
    function getFavorites() {
        return JSON.parse(localStorage.getItem('article-favorites') || '[]');
    }
    function isFavorite(id) {
        return getFavorites().includes(id);
    }
    function toggleFavorite(id) {
        const favs = getFavorites();
        const idx = favs.indexOf(id);
        if (idx >= 0) favs.splice(idx, 1);
        else favs.unshift(id);
        localStorage.setItem('article-favorites', JSON.stringify(favs));
        updateFavoritesBtn();
    }
    function updateFavoritesBtn() {
        const count = getFavorites().length;
        document.querySelectorAll('#nav-favorites, #mobile-nav-favorites').forEach(btn => {
            if (!btn) return;
            btn.classList.toggle('hidden', count === 0);
            btn.querySelectorAll('.fav-count').forEach(el => el.textContent = count);
        });
    }
    function showFavoritesView() {
        setHash(null);
        const favIds = getFavorites();
        heroSection.classList.add('hidden');
        quickFilters.classList.add('hidden');
        statsMinimal.classList.add('hidden');
        if (lawDetailContainer) lawDetailContainer.classList.add('hidden', 'opacity-0');
        mainContainer.classList.remove('justify-center', 'pt-24');
        mainContainer.classList.add('pt-8');
        resultsContainer.classList.remove('hidden');
        setTimeout(() => resultsContainer.classList.remove('opacity-0'), 50);

        const existingFilters = document.getElementById('search-filters');
        if (existingFilters) existingFilters.remove();

        if (favIds.length === 0) {
            resultsContainer.innerHTML = `<div class="text-center py-16 text-gray-400 text-sm">No tienes artículos guardados aún.</div>`;
            return;
        }
        const items = favIds.map(id => getArticleById(id)).filter(Boolean);

        currentModalList = items;

        resultsContainer.innerHTML = `
            <div class="w-full mb-6">
                <h2 class="text-xl font-head font-bold text-gray-800 mb-1 flex items-center gap-2">
                    <svg class="w-5 h-5 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                    Mis Favoritos
                </h2>
                <p class="text-xs text-gray-400">${items.length} artículo${items.length !== 1 ? 's' : ''} guardado${items.length !== 1 ? 's' : ''}</p>
            </div>
            ${items.map(item => `
            <div class="group relative bg-white border border-transparent hover:border-gray-100 rounded-xl p-5 hover:shadow-lg transition-all duration-300 cursor-pointer result-item" data-id="${item.id}">
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                    <span class="text-[10px] font-bold text-guinda uppercase tracking-wider bg-guinda/5 px-2 py-0.5 rounded-full">${item.ley_origen}</span>
                    <span class="text-[10px] text-gray-400 truncate max-w-[200px]">${item.titulo_nombre || ''}</span>
                </div>
                <h3 class="text-lg font-serif font-bold text-gray-800 mb-2 group-hover:text-guinda transition-colors">${item.articulo_label}</h3>
                <p class="text-sm text-gray-500 font-light leading-relaxed line-clamp-3">${item.texto.substring(0, 300)}...</p>
            </div>
            `).join('')}
        `;
        document.querySelectorAll('#results-container .result-item').forEach(el => {
            el.addEventListener('click', () => openDetail(el.dataset.id));
        });
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
            const q = document.getElementById('law-search-input')?.value.toLowerCase().trim() || '';
            renderLawArticles(currentLawArticles.slice(0, 50), q);
        });
        document.getElementById('compare-go-btn')?.addEventListener('click', () => {
            openCompare(compareSelection[0], compareSelection[1]);
        });
    }

    function openCompare(id1, id2) {
        const item1 = getArticleById(id1);
        const item2 = getArticleById(id2);
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
        setTimeout(() => {
            comparePanel?.classList.remove('scale-95', 'opacity-0');
            comparePanel?.classList.add('scale-100', 'opacity-100');
        }, 10);

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

    function shareArticleText(item) {
        const text = `📋 *${item.articulo_label}*\n🏛️ ${item.ley_origen}\n\n${item.texto.substring(0, 800)}${item.texto.length > 800 ? '...' : ''}`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
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

    function shareComparisonText(item1, item2) {
        const text = `⚖️ *Comparación de Artículos*\n\n` +
            `📋 *${item1.articulo_label}* – ${item1.ley_origen}\n${item1.texto.substring(0, 400)}${item1.texto.length > 400 ? '...' : ''}\n\n` +
            `📋 *${item2.articulo_label}* – ${item2.ley_origen}\n${item2.texto.substring(0, 400)}${item2.texto.length > 400 ? '...' : ''}`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }
    // ── End WhatsApp Share ───────────────────────────────────────────────────

    function showStatsView() {
        setHash(null);
        heroSection.classList.add('hidden');
        quickFilters.classList.add('hidden');
        statsMinimal.classList.add('hidden');
        if (lawDetailContainer) lawDetailContainer.classList.add('hidden', 'opacity-0');
        mainContainer.classList.remove('justify-center', 'pt-24');
        mainContainer.classList.add('pt-8');
        resultsContainer.classList.remove('hidden');
        setTimeout(() => resultsContainer.classList.remove('opacity-0'), 50);

        const existingFilters = document.getElementById('search-filters');
        if (existingFilters) existingFilters.remove();

        if (cachedSummaries.length === 0) {
            resultsContainer.innerHTML = `<div class="text-center py-16 text-gray-400">Cargando datos...</div>`;
            return;
        }

        const total = cachedSummaries.reduce((sum, l) => sum + l.articulos, 0);
        const leyes = cachedSummaries.filter(l => l.titulo.toLowerCase().startsWith('ley'));
        const reglamentos = cachedSummaries.filter(l => l.titulo.toLowerCase().startsWith('reglamento'));
        const otros = cachedSummaries.filter(l => !l.titulo.toLowerCase().startsWith('ley') && !l.titulo.toLowerCase().startsWith('reglamento'));
        const sorted = [...cachedSummaries].sort((a, b) => b.articulos - a.articulos);
        const maxArticulos = sorted[0]?.articulos || 1;

        resultsContainer.innerHTML = `
            <div class="w-full mb-8">
                <h2 class="text-2xl font-head font-bold text-gray-800 mb-2">Estadísticas del Marco Jurídico</h2>
                <p class="text-sm text-gray-400 font-light">Resumen del corpus legal indexado en el sistema.</p>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
                    <span class="text-3xl font-head font-bold text-guinda block">${cachedSummaries.length}</span>
                    <span class="text-xs text-gray-400 uppercase tracking-widest mt-1 block">Total Leyes</span>
                </div>
                <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
                    <span class="text-3xl font-head font-bold text-guinda block">${total.toLocaleString('es-MX')}</span>
                    <span class="text-xs text-gray-400 uppercase tracking-widest mt-1 block">Artículos</span>
                </div>
                <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
                    <span class="text-3xl font-head font-bold text-emerald-700 block">${leyes.length}</span>
                    <span class="text-xs text-gray-400 uppercase tracking-widest mt-1 block">Leyes Fed.</span>
                </div>
                <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm text-center hover:shadow-md transition-shadow">
                    <span class="text-3xl font-head font-bold text-amber-700 block">${reglamentos.length + otros.length}</span>
                    <span class="text-xs text-gray-400 uppercase tracking-widest mt-1 block">Regl./Otros</span>
                </div>
            </div>

            <div class="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
                <h3 class="font-bold text-gray-800 text-sm mb-5 flex items-center gap-2">
                    <svg class="w-4 h-4 text-guinda" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                    Artículos por Ley
                </h3>
                <div class="space-y-3">
                    ${sorted.map(law => {
                        const isLey = law.titulo.toLowerCase().startsWith('ley');
                        const isReg = law.titulo.toLowerCase().startsWith('reglamento');
                        const barColor = isLey ? '#9B2247' : isReg ? '#1E5B4F' : '#A57F2C';
                        const pct = Math.round((law.articulos / maxArticulos) * 100);
                        return `
                        <div class="flex items-center gap-3 cursor-pointer group stat-law-row" data-titulo="${law.titulo.replace(/"/g, '&quot;')}">
                            <div class="text-xs text-gray-500 w-44 truncate flex-shrink-0 group-hover:text-guinda transition-colors" title="${law.titulo}">${law.titulo}</div>
                            <div class="flex-1 h-5 bg-gray-50 rounded-full overflow-hidden">
                                <div class="h-full rounded-full transition-all duration-500" style="width:${pct}%; background:${barColor};"></div>
                            </div>
                            <span class="text-xs font-bold text-gray-500 w-8 text-right flex-shrink-0">${law.articulos}</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                ${[
                    { label: 'Leyes Federales', items: leyes, textClass: 'text-guinda', bgClass: 'bg-guinda/5' },
                    { label: 'Reglamentos', items: reglamentos, textClass: 'text-emerald-700', bgClass: 'bg-emerald-50' },
                    { label: 'Acuerdos y Otros', items: otros, textClass: 'text-amber-700', bgClass: 'bg-amber-50' }
                ].map(cat => `
                    <div class="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                        <div class="flex items-center justify-between mb-4">
                            <span class="text-xs font-bold ${cat.textClass} uppercase tracking-widest">${cat.label}</span>
                            <span class="text-xs ${cat.bgClass} ${cat.textClass} font-bold px-2 py-0.5 rounded-full">${cat.items.length}</span>
                        </div>
                        <div class="space-y-1.5">
                            ${cat.items.map(l => `
                                <div class="text-xs text-gray-500 truncate hover:text-guinda cursor-pointer transition-colors stat-law-row" data-titulo="${l.titulo.replace(/"/g, '&quot;')}" title="${l.titulo}">${l.titulo}</div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        document.querySelectorAll('.stat-law-row').forEach(row => {
            row.addEventListener('click', () => {
                const law = cachedSummaries.find(l => l.titulo === row.dataset.titulo);
                if (law) openLawDetail(law);
            });
        });
    }

    // ...

    function renderResults() {
        if (!resultsContainer) return;

        // Filter results first
        let filteredResults = currentSearchResults;
        if (currentFilters.type !== 'all') {
            filteredResults = filteredResults.filter(item => {
                if (currentFilters.type === 'ley') return item.ley_origen.toLowerCase().includes('ley');
                if (currentFilters.type === 'reglamento') return item.ley_origen.toLowerCase().includes('reglamento');
                return !item.ley_origen.toLowerCase().includes('ley') && !item.ley_origen.toLowerCase().includes('reglamento');
            });
        }
        if (currentFilters.law !== 'all') {
            filteredResults = filteredResults.filter(item => item.ley_origen === currentFilters.law);
        }

        const results = filteredResults;
        const query = currentSearchQuery;

        // Render Filter Controls — recreate on each render to reflect current state
        const existingFilters = document.getElementById('search-filters');
        if (existingFilters) existingFilters.remove();

        if (currentSearchResults.length > 0) {
            const filterControls = document.createElement('div');
            filterControls.id = 'search-filters';
            filterControls.className = 'flex flex-col items-center gap-2 mb-6 animate-fade-in-up';

            const uniqueLaws = [...new Set(currentSearchResults.map(r => r.ley_origen))].sort();

            filterControls.innerHTML = `
                <div class="flex flex-wrap justify-center gap-2">
                    <button class="filter-btn px-3 py-1 text-xs rounded-full border transition-colors ${currentFilters.type === 'all' ? 'bg-guinda text-white border-guinda' : 'bg-white text-gray-500 border-gray-200 hover:border-guinda hover:text-guinda'}" data-type="all">Todos</button>
                    <button class="filter-btn px-3 py-1 text-xs rounded-full border transition-colors ${currentFilters.type === 'ley' ? 'bg-guinda text-white border-guinda' : 'bg-white text-gray-500 border-gray-200 hover:border-guinda hover:text-guinda'}" data-type="ley">Leyes</button>
                    <button class="filter-btn px-3 py-1 text-xs rounded-full border transition-colors ${currentFilters.type === 'reglamento' ? 'bg-guinda text-white border-guinda' : 'bg-white text-gray-500 border-gray-200 hover:border-guinda hover:text-guinda'}" data-type="reglamento">Reglamentos</button>
                    <button class="filter-btn px-3 py-1 text-xs rounded-full border transition-colors ${currentFilters.type === 'otros' ? 'bg-guinda text-white border-guinda' : 'bg-white text-gray-500 border-gray-200 hover:border-guinda hover:text-guinda'}" data-type="otros">Otros</button>
                </div>
                ${uniqueLaws.length > 1 ? `
                <select id="law-filter-select" class="text-xs border rounded-full px-4 py-1.5 focus:outline-none bg-white cursor-pointer transition-colors ${currentFilters.law !== 'all' ? 'border-guinda text-guinda' : 'border-gray-200 text-gray-500 hover:border-guinda'}">
                    <option value="all">Todas las leyes</option>
                    ${uniqueLaws.map(l => `<option value="${l}" ${currentFilters.law === l ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
                ` : ''}
            `;
            resultsContainer.parentNode.insertBefore(filterControls, resultsContainer);

            filterControls.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    currentFilters.type = e.target.dataset.type;
                    currentPage = 1;
                    renderResults();
                });
            });

            const lawSelect = document.getElementById('law-filter-select');
            if (lawSelect) {
                lawSelect.addEventListener('change', (e) => {
                    currentFilters.law = e.target.value;
                    currentPage = 1;
                    renderResults();
                });
            }
        }

        if (results.length === 0) {
            const isFiltered = currentFilters.type !== 'all' || currentFilters.law !== 'all';
            resultsContainer.innerHTML = `
                <div class="text-center py-16 px-4">
                    <div class="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <svg class="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                    <h3 class="font-head text-lg font-bold text-gray-700 mb-2">
                        ${isFiltered ? 'Sin resultados con los filtros actuales' : `Sin resultados para "<span class="text-guinda">${query}</span>"`}
                    </h3>
                    <p class="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
                        ${isFiltered ? 'Prueba cambiando o eliminando los filtros aplicados.' : 'Intenta con otras palabras, un artículo específico o explora directamente las leyes.'}
                    </p>
                    ${!isFiltered ? `
                    <div class="flex flex-wrap gap-2 justify-center mb-4">
                        ${['Transmisión', 'Generación', 'CENACE', 'Distribución', 'Tarifas', 'Permisos'].map(s =>
                            `<button class="empty-suggestion px-4 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-xs text-gray-500 hover:bg-guinda/5 hover:border-guinda/30 hover:text-guinda transition-all">${s}</button>`
                        ).join('')}
                    </div>
                    <button id="empty-browse-laws" class="text-xs font-semibold text-guinda hover:text-guinda/70 transition-colors underline underline-offset-2">Explorar todas las leyes →</button>
                    ` : ''}
                </div>`;
            // Wire suggestion chips
            resultsContainer.querySelectorAll('.empty-suggestion').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (searchInput) {
                        searchInput.value = btn.textContent;
                        searchInput.dispatchEvent(new Event('input'));
                    }
                });
            });
            document.getElementById('empty-browse-laws')?.addEventListener('click', () => showLawsView());
            // Remove pagination
            const existingNav = document.getElementById('results-container').nextElementSibling;
            if (existingNav && existingNav.classList.contains('pagination-nav')) existingNav.remove();
            return;
        }

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedResults = results.slice(start, end);
        const maxScore = results[0]?.score || 1;
        currentModalList = results; // full filtered list for modal prev/next nav

        resultsContainer.innerHTML = paginatedResults.map(item => {
            const highlightedText = highlightText(item.texto.substring(0, 300) + '...', query);
            const highlightedLabel = highlightText(item.articulo_label, query);
            const relevanceBadge = getRelevanceBadge(item.score, maxScore);
            const bookmarkIcon = isFavorite(item.id)
                ? `<svg class="w-4 h-4 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>`
                : `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>`;

            return `
            <div class="group relative bg-white border border-transparent hover:border-gray-100 rounded-xl p-5 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer result-item" data-id="${item.id}">
                <button class="bookmark-card-btn absolute top-3 right-3 p-1.5 text-gray-300 hover:text-guinda transition-colors rounded-full hover:bg-guinda/5 z-10" data-id="${item.id}" title="Guardar en favoritos">${bookmarkIcon}</button>
                <div class="flex items-center gap-2 mb-2 flex-wrap pr-8">
                    <span class="text-[10px] font-bold text-guinda uppercase tracking-wider bg-guinda/5 px-2 py-0.5 rounded-full">${item.ley_origen}</span>
                    <span class="text-[10px] text-gray-400 font-medium tracking-wide truncate max-w-[200px]">${item.titulo_nombre || ''}</span>
                    <span class="ml-auto">${relevanceBadge}</span>
                </div>
                <h3 class="text-lg font-serif font-bold text-gray-800 mb-2 group-hover:text-guinda transition-colors">${highlightedLabel}</h3>
                <p class="text-sm text-gray-500 font-light leading-relaxed line-clamp-3">${highlightedText}</p>
            </div>
            `;
        }).join('');

        // Add pagination controls
        renderPaginationControls(results.length, 'results-container', renderResults);

        // Add click listeners (open modal or toggle bookmark)
        document.querySelectorAll('.result-item').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('.bookmark-card-btn')) return;
                openDetail(el.dataset.id);
            });
        });
        document.querySelectorAll('.bookmark-card-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(btn.dataset.id);
                renderResults(); // re-render to reflect new state
            });
        });
    }

    function openDetail(id) {
        const item = getArticleById(id);
        if (!item) return;

        modalLey.textContent = item.ley_origen;
        modalTitle.textContent = item.articulo_label;
        
        // Clean text: replace multiple newlines with single paragraph breaks, but preserve structure
        let cleanText = item.texto
            .replace(/\r\n/g, '\n') // Normalize newlines
            .replace(/\n\s*\n/g, '\n\n') // Normalize multiple newlines to double
            .replace(/([a-z,;])\n([a-z])/g, '$1 $2'); // Join lines that shouldn't be broken (lowercase end -> lowercase start)

        modalContent.innerHTML = `
            <div class="mb-6 pb-6 border-b border-gray-100">
                <div class="text-[10px] font-bold text-guinda uppercase tracking-widest mb-2 flex items-center gap-1.5 bg-guinda/5 w-fit px-2 py-1 rounded-full">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    Ubicación en el documento
                </div>
                <div class="text-sm text-gray-700 font-medium">
                    <span class="block mb-1 text-gray-500 text-xs uppercase tracking-wide">Título / Capítulo</span>
                    ${item.titulo_nombre} 
                    <span class="text-gray-300 mx-2">|</span> 
                    ${item.capitulo_nombre}
                </div>
            </div>
            
            <div class="prose prose-sm max-w-none text-gray-800 leading-relaxed font-serif text-justify">
                ${cleanText.split('\n\n').map(p => `<p class="mb-4">${p}</p>`).join('')}
            </div>
        `;

        // Prev/Next navigation
        const currentIndex = currentModalList.findIndex(a => a.id === id);
        const total = currentModalList.length;

        const prevBtn = document.getElementById('modal-prev-btn');
        const nextBtn = document.getElementById('modal-next-btn');
        const navCounter = document.getElementById('modal-nav-counter');

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
            navCounter.textContent = currentIndex >= 0 ? `${currentIndex + 1}/${total}` : '';
        }

        // Bookmark button in modal header
        const bookmarkBtn = document.getElementById('modal-bookmark-btn');
        if (bookmarkBtn) {
            const fav = isFavorite(id);
            bookmarkBtn.innerHTML = fav
                ? `<svg class="w-5 h-5 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>`
                : `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>`;
            bookmarkBtn.onclick = () => {
                toggleFavorite(id);
                openDetail(id); // re-render to update icon
            };
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
                shareMenu.classList.toggle('hidden');
            };
            document.addEventListener('click', function hideShareMenu(e) {
                if (!e.target.closest('#share-menu-wrapper')) {
                    shareMenu.classList.add('hidden');
                    document.removeEventListener('click', hideShareMenu);
                }
            });
        }
        if (shareTextBtn) shareTextBtn.onclick = () => { shareMenu?.classList.add('hidden'); shareArticleText(item); };
        if (shareImageBtn) shareImageBtn.onclick = () => { shareMenu?.classList.add('hidden'); shareArticleImage(item); };

        // Update URL for sharing
        setHash(`#art-${encodeURIComponent(id)}`);

        detailModal.classList.remove('hidden');
        detailModal.classList.add('flex');

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
        setHash(null);
        modalPanel.classList.remove('scale-100', 'opacity-100');
        modalPanel.classList.add('scale-95', 'opacity-0');

        setTimeout(() => {
            detailModal.classList.add('hidden');
            detailModal.classList.remove('flex');
        }, 300);
    }

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
}
