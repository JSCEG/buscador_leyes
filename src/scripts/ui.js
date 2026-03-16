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

    let cachedSummaries = [];
    let currentLawArticles = [];

    // Stats Listener
    window.addEventListener('search-ready', (e) => {
        const { totalLeyes, totalArticulos, summaries } = e.detail;
        cachedSummaries = summaries; // Store for "Leyes" view

        if (statsMinimal) {
            statsMinimal.innerHTML = `
                <span class="opacity-60">Índice activo:</span> 
                <span class="font-semibold text-guinda">${totalLeyes} leyes</span> 
                <span class="mx-1 opacity-30">|</span> 
                <span class="font-semibold text-guinda">${totalArticulos} artículos</span>
            `;
        }
    });

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
        currentFilters = { type: 'all' };
    }

    function showLawsView() {
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

            <!-- Timeline Section -->
            <div class="w-full bg-white border border-gray-100 rounded-xl p-6 mb-10 shadow-sm">
                <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg class="w-5 h-5 text-guinda" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Línea del Tiempo
                </h3>
                <div id="laws-timeline" class="w-full h-48"></div>
            </div>
            
            ${renderCarouselSection('Leyes Federales', leyes)}
            ${renderCarouselSection('Reglamentos', reglamentos)}
            ${renderCarouselSection('Acuerdos y Otros Instrumentos', otros)}
        `;

        // Render Timeline
        setTimeout(() => renderTimeline(cachedSummaries), 100);

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

        return `
            <div class="mb-10 carousel-container group/section">
                <h3 class="text-lg font-bold text-gray-800 mb-4 px-1 flex items-center gap-2">
                    ${title}
                    <span class="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">${items.length}</span>
                </h3>
                
                <div class="relative">
                    <!-- Left Arrow -->
                    <button class="scroll-left absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 bg-white/90 backdrop-blur border border-gray-100 shadow-lg rounded-full p-2 text-gray-600 opacity-0 group-hover/section:opacity-100 transition-opacity disabled:opacity-0 hover:text-guinda hover:scale-110 hidden md:block">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>

                    <!-- Carousel Track -->
                    <div class="carousel-scroll flex gap-4 overflow-x-auto pb-6 -mx-4 px-4 snap-x scrollbar-hide scroll-smooth">
                        ${items.map(law => `
                            <div class="min-w-[280px] w-[280px] md:min-w-[320px] md:w-[320px] snap-start bg-white border border-gray-100 rounded-xl p-6 hover:shadow-xl hover:border-guinda/20 hover:-translate-y-1 transition-all duration-300 group cursor-pointer law-card flex flex-col justify-between h-[200px]" data-title="${law.titulo}">
                                <div>
                                    <span class="text-[9px] font-bold text-guinda uppercase tracking-wider mb-2 bg-guinda/5 w-fit px-2 py-0.5 rounded-full block truncate">${title.split(' ')[0]}</span>
                                    <h3 class="text-base font-serif font-bold text-gray-800 mb-2 group-hover:text-guinda transition-colors leading-snug line-clamp-2" title="${law.titulo}">${law.titulo}</h3>
                                </div>
                                
                                <div class="mt-4 pt-3 border-t border-gray-50 flex justify-between items-end text-xs text-gray-500">
                                    <div class="flex flex-col gap-1">
                                        <span class="flex items-center gap-1">
                                            <svg class="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                            ${law.articulos} arts.
                                        </span>
                                        <span class="text-[10px] text-gray-400">${law.fecha || 'N/D'}</span>
                                    </div>
                                    <svg class="w-5 h-5 text-gray-300 group-hover:text-guinda transition-colors transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                </div>
                            </div>
                        `).join('')}
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

        // Reading Controls State
        let currentFontSize = 100; // Percentage
        let currentTheme = localStorage.getItem('reader-theme') || 'light'; // light, sepia, dark

        lawDetailContainer.innerHTML = `
            <!-- Sticky Reading Controls (Kindle Style) -->
            <div id="reading-controls" class="fixed bottom-6 right-6 z-40 flex flex-col gap-2 animate-fade-in-up">
                 <div class="bg-white/95 backdrop-blur border border-gray-200 shadow-2xl rounded-2xl p-2 flex flex-col gap-2 items-center transition-colors duration-300" id="reading-panel">
                    
                    <!-- Font Size -->
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

                    <!-- Themes -->
                    <div class="flex gap-1">
                        <button class="theme-btn w-6 h-6 rounded-full border-2 border-transparent bg-white shadow-sm hover:scale-110 transition-transform ${currentTheme === 'light' ? 'ring-2 ring-guinda ring-offset-1' : ''}" data-theme="light" title="Modo Claro"></button>
                        <button class="theme-btn w-6 h-6 rounded-full border-2 border-transparent bg-[#f4ecd8] shadow-sm hover:scale-110 transition-transform ${currentTheme === 'sepia' ? 'ring-2 ring-guinda ring-offset-1' : ''}" data-theme="sepia" title="Modo Sepia"></button>
                        <button class="theme-btn w-6 h-6 rounded-full border-2 border-transparent bg-[#1a1a1a] shadow-sm hover:scale-110 transition-transform ${currentTheme === 'dark' ? 'ring-2 ring-guinda ring-offset-1' : ''}" data-theme="dark" title="Modo Oscuro"></button>
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
                    <div class="flex gap-2">
                        <button id="export-csv-btn" class="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:border-guinda hover:text-guinda transition-all flex items-center gap-2 shadow-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            Exportar Excel (CSV)
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

            // Update buttons active state
            themeBtns.forEach(btn => {
                btn.classList.remove('ring-2', 'ring-guinda', 'ring-offset-1');
                if (btn.dataset.theme === theme) {
                    btn.classList.add('ring-2', 'ring-guinda', 'ring-offset-1');
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
                    .bg-dark { background-color: #121212 !important; color: #e0e0e0 !important; }
                    .bg-dark .bg-white { background-color: #1e1e1e !important; border-color: #333 !important; }
                    .bg-dark .text-gray-900, .bg-dark .text-gray-800 { color: #ffffff !important; }
                    .bg-dark .text-gray-600, .bg-dark .text-gray-500 { color: #b0b0b0 !important; }
                    .bg-dark .text-gray-400 { color: #888 !important; }
                    .bg-dark .border-gray-100, .bg-dark .border-gray-200 { border-color: #333 !important; }
                    .bg-dark .bg-gray-50 { background-color: #252525 !important; }
                    .bg-dark #reading-panel { background-color: rgba(30, 30, 30, 0.95) !important; border-color: #333 !important; }
                    .bg-dark .text-guinda { color: #ef4444 !important; } /* Lighter red for dark mode */
                `;
                document.head.appendChild(style);
            }
        };

        // Initialize theme
        applyTheme(currentTheme);

        const updateFontSize = () => {
            if (articlesList) articlesList.style.fontSize = `${currentFontSize}%`;
            if (fontDisplay) fontDisplay.innerText = `${currentFontSize}%`;
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

        list.innerHTML = articles.map(item => {
            const highlightedText = highlightQuery ? highlightText(item.texto, highlightQuery) : item.texto.substring(0, 300) + '...';

            return `
            <div class="bg-white border border-gray-100 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer result-item" data-id="${item.id}">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-bold text-gray-700">${item.articulo_label}</span>
                    <span class="text-[10px] text-gray-400">${item.titulo_nombre || ''}</span>
                </div>
                <p class="text-sm text-gray-600 font-light leading-relaxed line-clamp-3">${highlightedText}</p>
            </div>
            `;
        }).join('');

        // Re-add click listeners for modal
        document.querySelectorAll('#law-articles-list .result-item').forEach(el => {
            el.addEventListener('click', () => {
                openDetail(el.dataset.id);
            });
        });
    }

    function highlightText(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        // Simple highlight, but need to be careful with HTML injection if text had HTML (it doesn't seem to)
        return text.replace(regex, '<mark class="bg-yellow-200 text-gray-900 rounded-sm px-0.5">$1</mark>');
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

    let currentFilters = { type: 'all' };

    // ...

    function renderResults() {
        if (!resultsContainer) return;

        // Filter results first
        let filteredResults = currentSearchResults;
        if (currentFilters.type !== 'all') {
            filteredResults = currentSearchResults.filter(item => {
                if (currentFilters.type === 'ley') return item.ley_origen.toLowerCase().includes('ley');
                if (currentFilters.type === 'reglamento') return item.ley_origen.toLowerCase().includes('reglamento');
                return !item.ley_origen.toLowerCase().includes('ley') && !item.ley_origen.toLowerCase().includes('reglamento');
            });
        }

        const results = filteredResults;
        const query = currentSearchQuery;

        // Render Filter Controls (if not already present)
        let filterControls = document.getElementById('search-filters');
        if (!filterControls && currentSearchResults.length > 0) {
            filterControls = document.createElement('div');
            filterControls.id = 'search-filters';
            filterControls.className = 'flex justify-center gap-2 mb-6 animate-fade-in-up';
            filterControls.innerHTML = `
                <button class="filter-btn px-3 py-1 text-xs rounded-full border border-gray-200 ${currentFilters.type === 'all' ? 'bg-guinda text-white border-guinda' : 'bg-white text-gray-500 hover:border-guinda hover:text-guinda'}" data-type="all">Todos</button>
                <button class="filter-btn px-3 py-1 text-xs rounded-full border border-gray-200 ${currentFilters.type === 'ley' ? 'bg-guinda text-white border-guinda' : 'bg-white text-gray-500 hover:border-guinda hover:text-guinda'}" data-type="ley">Leyes</button>
                <button class="filter-btn px-3 py-1 text-xs rounded-full border border-gray-200 ${currentFilters.type === 'reglamento' ? 'bg-guinda text-white border-guinda' : 'bg-white text-gray-500 hover:border-guinda hover:text-guinda'}" data-type="reglamento">Reglamentos</button>
                <button class="filter-btn px-3 py-1 text-xs rounded-full border border-gray-200 ${currentFilters.type === 'otros' ? 'bg-guinda text-white border-guinda' : 'bg-white text-gray-500 hover:border-guinda hover:text-guinda'}" data-type="otros">Otros</button>
             `;
            resultsContainer.parentNode.insertBefore(filterControls, resultsContainer);

            // Bind events
            filterControls.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    currentFilters.type = e.target.dataset.type;
                    currentPage = 1;
                    // Update active state visual
                    filterControls.querySelectorAll('.filter-btn').forEach(b => {
                        b.className = `filter-btn px-3 py-1 text-xs rounded-full border border-gray-200 bg-white text-gray-500 hover:border-guinda hover:text-guinda transition-colors`;
                    });
                    e.target.className = `filter-btn px-3 py-1 text-xs rounded-full border border-guinda bg-guinda text-white transition-colors`;

                    renderResults();
                });
            });
        } else if (currentSearchResults.length === 0 && filterControls) {
            filterControls.remove();
        }

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-gray-400 font-light text-sm">No encontramos coincidencias con los filtros actuales.</p>
                </div>`;
            // Ensure pagination controls are removed if no results
            const existingNav = document.getElementById('results-container').nextElementSibling;
            if (existingNav && existingNav.classList.contains('pagination-nav')) existingNav.remove();
            return;
        }

        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedResults = results.slice(start, end);

        resultsContainer.innerHTML = paginatedResults.map(item => {
            const highlightedText = highlightText(item.texto.substring(0, 300) + '...', query);

            return `
            <div class="group bg-white border border-transparent hover:border-gray-100 rounded-xl p-5 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 cursor-pointer result-item" data-id="${item.id}">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-[10px] font-bold text-guinda uppercase tracking-wider bg-guinda/5 px-2 py-0.5 rounded-full">${item.ley_origen}</span>
                    <span class="text-[10px] text-gray-400 font-medium tracking-wide truncate max-w-[200px]">${item.titulo_nombre}</span>
                </div>
                <h3 class="text-lg font-serif font-bold text-gray-800 mb-2 group-hover:text-guinda transition-colors">${item.articulo_label}</h3>
                <p class="text-sm text-gray-500 font-light leading-relaxed line-clamp-3">${highlightedText}</p>
            </div>
            `;
        }).join('');

        // Add pagination controls
        renderPaginationControls(results.length, 'results-container', renderResults);

        // Add click listeners
        document.querySelectorAll('.result-item').forEach(el => {
            el.addEventListener('click', () => {
                const id = el.dataset.id;
                openDetail(id);
            });
        });
    }

    function openDetail(id) {
        const item = getArticleById(id);
        if (!item) return;

        modalLey.textContent = item.ley_origen;
        modalTitle.textContent = item.articulo_label;
        modalContent.innerHTML = `
            <div class="mb-6 pb-6 border-b border-gray-50">
                <div class="text-xs text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    Ubicación
                </div>
                <div class="text-sm font-medium text-gray-600">
                    ${item.titulo_nombre} <span class="text-gray-300 mx-1">/</span> ${item.capitulo_nombre}
                </div>
            </div>
            <div class="text-gray-700 leading-8 font-light text-base text-justify">
                ${item.texto.replace(/\n/g, '<br><br>')}
            </div>
        `;

        // Update footer actions in modal
        const modalFooter = modalPanel.querySelector('.bg-gray-50\\/50');
        if (modalFooter) {
            // Re-create footer content to ensure buttons are there
            modalFooter.innerHTML = `
                <div class="flex gap-3">
                    <button class="text-xs font-semibold text-gray-500 hover:text-green-600 transition-colors flex items-center gap-1" id="whatsapp-share-btn">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                        Compartir
                    </button>
                    <button class="text-xs font-semibold text-gray-500 hover:text-guinda transition-colors flex items-center gap-1" id="copy-btn">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                        Copiar Texto
                    </button>
                </div>
             `;

            // Re-bind Copy Listener
            const newCopyBtn = document.getElementById('copy-btn');
            if (newCopyBtn) {
                newCopyBtn.addEventListener('click', () => {
                    const text = modalContent.innerText;
                    navigator.clipboard.writeText(text).then(() => {
                        const originalText = newCopyBtn.innerHTML;
                        newCopyBtn.innerHTML = `<span class="text-verde font-bold">¡Copiado!</span>`;
                        setTimeout(() => {
                            newCopyBtn.innerHTML = originalText;
                        }, 2000);
                    });
                });
            }

            // Bind WhatsApp Listener
            const whatsappBtn = document.getElementById('whatsapp-share-btn');
            if (whatsappBtn) {
                whatsappBtn.addEventListener('click', () => {
                    const text = `*${item.ley_origen}*\n*${item.articulo_label}*\n\n${item.texto.substring(0, 500)}...`;
                    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                    window.open(url, '_blank');
                });
            }
        }

        detailModal.classList.remove('hidden');
        detailModal.classList.add('flex');

        // Animation
        setTimeout(() => {
            modalPanel.classList.remove('scale-95', 'opacity-0');
            modalPanel.classList.add('scale-100', 'opacity-100');
        }, 10);
    }

    function closeModalFunc() {
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
