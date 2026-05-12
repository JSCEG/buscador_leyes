import { performSearch, getArticleById, getArticlesByLaw, getSearchCountsByLaw, getThemesByLawName, updateArticle } from './search-engine.js';
import { renderAnalisisView } from './analisis.js';
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
                .dark-mode { background-color: #050505 !important; color: #FFFFFF !important; }
                .dark-mode header { background-color: rgba(5, 5, 5, 0.8) !important; border-bottom: 2px solid #FF1E56 !important; backdrop-filter: blur(10px); box-shadow: 0 0 20px rgba(255, 30, 86, 0.2); }
                .dark-mode footer { background-color: #000000 !important; border-top: 1px solid rgba(255, 30, 86, 0.2) !important; }
                
                /* Neutralización de Fondos Blancos */
                .dark-mode .bg-white, 
                .dark-mode .bg-gray-50, 
                .dark-mode .bg-slate-50,
                .dark-mode .bg-gray-50\\/50,
                .dark-mode .bg-white.rounded-3xl,
                .dark-mode .atema-card,
                .dark-mode #modal-panel { 
                    background-color: #050505 !important; 
                    color: #FFFFFF !important; 
                    border-color: rgba(255, 30, 86, 0.2) !important; 
                }

                .dark-mode .border-gray-100, 
                .dark-mode .border-gray-200 { border-color: rgba(255, 255, 255, 0.05) !important; }
                
                /* Tables & Results */
                .dark-mode table { border-collapse: separate; border-spacing: 0; width: 100%; }
                .dark-mode thead tr { background-color: rgba(255, 30, 86, 0.05) !important; }
                .dark-mode table thead th { 
                    color: #FF1E56 !important; 
                    border-bottom: 2px solid #FF1E56 !important; 
                    background-color: #080808 !important;
                    font-weight: 900 !important;
                }
                .dark-mode table tbody tr { border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important; transition: all 0.2s; }
                .dark-mode table tbody tr:hover { background-color: rgba(255, 255, 255, 0.02) !important; }
                .dark-mode table td { color: rgba(255, 255, 255, 0.8) !important; border-right: 1px solid rgba(255, 255, 255, 0.03); }

                /* Specific Components */
                .dark-mode #search-filters .bg-white { background-color: #000000 !important; border-color: #FF1E56 !important; }
                .dark-mode #search-input { background-color: #000000 !important; border: 1px solid #FFB800 !important; color: #ffffff !important; box-shadow: 0 0 15px rgba(255, 184, 0, 0.1) !important; }
                .dark-mode #search-input::placeholder { color: rgba(255, 255, 255, 0.2) !important; }
                
                /* Highlights & Accents */
                .dark-mode mark { background-color: rgba(255, 184, 0, 0.3) !important; color: #FFB800 !important; border-bottom: 1px solid #FFB800; }
                .dark-mode .text-guinda { color: #FF1E56 !important; text-shadow: 0 0 8px rgba(255, 30, 86, 0.4); }
                .dark-mode .text-verde { color: #00FF9D !important; }
                .dark-mode .bg-guinda { background-color: #FF1E56 !important; }
                
                /* Modals */
                .dark-mode #detail-modal { background-color: rgba(0, 0, 0, 0.8) !important; backdrop-filter: blur(12px); }
                .dark-mode #modal-panel { border: 1px solid rgba(255, 30, 86, 0.3) !important; box-shadow: 0 0 40px rgba(255, 30, 86, 0.1) !important; }
                
                /* Admin Specifics */
                .dark-mode #admin-dropzone { border-color: rgba(255, 184, 0, 0.3) !important; background-color: rgba(255, 184, 0, 0.02) !important; }
                .dark-mode #admin-dropzone h3 { color: #FFB800 !important; }
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
    let currentLawArticles = [];

    // Lógica de clasificación avanzada de instrumentos
    function classifyInstrument(s) {
        // Priorizar el campo 'tipo' si viene de la base de datos
        if (s.tipo) {
            const t = s.tipo.toLowerCase();
            if (t === 'ley') return { id: 'ley', label: 'Leyes Federales', color: 'guinda', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' };
            if (t === 'reglamento') return { id: 'reglamento', label: 'Reglamentos', color: 'emerald-700', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' };
            if (t === 'acuerdo') return { id: 'acuerdo', label: 'Acuerdos', color: 'amber-600', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' };
            if (t === 'dacg') return { id: 'dacg', label: 'DACG\'s', color: 'blue-700', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' };
            if (t === 'nom') return { id: 'nom', label: 'NOMs', color: 'purple-700', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' };
            if (t === 'permiso') return { id: 'permiso', label: 'Permisos', color: 'cyan-700', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' };
            if (t === 'manual') return { id: 'manual', label: 'Manuales', color: 'slate-600', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' };
        }

        // Fallback a detección por texto en título
        const t = (s.titulo || '').toLowerCase();
        if (t.startsWith('ley ')) return { id: 'ley', label: 'Leyes', color: 'guinda', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' };
        if (t.startsWith('reglamento ')) return { id: 'reglamento', label: 'Reglamentos', color: 'emerald-700', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' };
        if (t.includes('acuerdo')) return { id: 'acuerdo', label: 'Acuerdos', color: 'amber-600', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' };
        if (t.includes('disposiciones administrativas') || t.includes('dacg')) return { id: 'dacg', label: 'DACG\'s', color: 'blue-700', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' };
        if (t.includes('norma oficial') || t.includes('nom-')) return { id: 'nom', label: 'NOMs', color: 'purple-700', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' };
        if (t.includes('permiso')) return { id: 'permiso', label: 'Permisos', color: 'cyan-700', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' };
        if (t.includes('manual') || t.includes('lineamientos')) return { id: 'manual', label: 'Manuales', color: 'slate-600', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' };
        return { id: 'otros', label: 'Otros', color: 'gray-500', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' };
    }

    function renderAcervoAnalytics(summaries) {
        const dashboard = document.getElementById('acervo-visual-dashboard');
        if (!dashboard) return;
        
        dashboard.classList.remove('hidden');
        dashboard.style.display = 'block'; // Keep block for D3 measurements if needed, or rely on flex

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
            { id: 'otros', label: 'Otros', color: '#64748b', count: (counts['permiso'] || 0) + (counts['manual'] || 0) + (counts['otros'] || 0) }
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
        const { summaries } = e.detail;
        cachedSummaries = summaries;

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
        if (list && list.length) {
            const promises = list.map(lid => getArticleById(lid));
            currentModalList = (await Promise.all(promises)).filter(Boolean);
        }
        openDetail(id);
    });
    document.addEventListener('analisis:goHome', () => resetToHero());

    // Compare modal close
    document.getElementById('close-compare-modal')?.addEventListener('click', closeCompareModal);
    document.getElementById('compare-modal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('compare-modal')) closeCompareModal();
    });

    // ── Deep Linking, Toast & Skeleton Loaders ────────────────────────────────
    function setHash(hash) {
        // pushState en lugar de replaceState para que el botón Atrás del navegador
        // pueda retroceder entre artículos, leyes y la vista de inicio.
        history.pushState(null, '', hash ? `${location.pathname}${hash}` : location.pathname);
    }

    async function handleInitialHash() {
        const hash = location.hash;
        if (!hash) return;
        if (hash.startsWith('#art-')) {
            const id = decodeURIComponent(hash.slice(5));
            const item = await getArticleById(id);
            if (!item) return;
            currentModalList = [item];
            openDetail(id);
        } else if (hash.startsWith('#ley-')) {
            const leyId = decodeURIComponent(hash.slice(5));
            const law = cachedSummaries.find(l => l.id === leyId);
            if (law) openLawDetail(law);
        }
    }

    // Maneja el botón Atrás / Adelante del navegador.
    // Restaura la vista correcta según el hash de la URL.
    window.addEventListener('popstate', async () => {
        const hash = location.hash;
        if (!hash) {
            // Sin hash → regresar a la pantalla de inicio
            resetToHero();
        } else if (hash.startsWith('#art-')) {
            const id = decodeURIComponent(hash.slice(5));
            const item = await getArticleById(id);
            if (!item) return;
            currentModalList = [item];
            openDetail(id);
        } else if (hash.startsWith('#ley-')) {
            const leyId = decodeURIComponent(hash.slice(5));
            const law = cachedSummaries.find(l => l.id === leyId);
            if (law) openLawDetail(law);
        }
    });

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
    let currentFilters = { type: 'all', law: 'all', artNum: '' };
    let currentModalList = [];
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
        document.getElementById('global-search-wrapper')?.classList.remove('hidden');
    }
    function hideGlobalSearch() {
        document.getElementById('global-search-wrapper')?.classList.add('hidden');
        // Clear value so no stale query lingers
        if (searchInput) searchInput.value = '';
    }

    function hideAllViews() {
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

    function resetToHero() {
        setHash(null);
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
    
    function showLawsView() {
        setHash(null);
        destroyTOC();
        showGlobalSearch();
        setActiveNav('nav-leyes');
        // Transition UI
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

        if (searchInput) searchInput.value = '';
        currentSearchQuery = '';
        currentFilters = { type: 'all', law: 'all', artNum: '' };
        currentPage = 1;

        // Render Laws Table
        if (cachedSummaries.length === 0) {
            resultsContainer.innerHTML = `<div class="w-full flex justify-center py-12"><div class="animate-spin h-6 w-6 border-2 border-guinda border-t-transparent rounded-full"></div></div>`;
            return;
        }

        resultsContainer.innerHTML = `
            <div class="w-full mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-serif font-bold text-gray-800 mb-1">Acervo Energético</h2>
                    <p class="text-xs text-gray-400 font-medium italic">Listado completo de instrumentos jurídicos vigentes.</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-black text-guinda bg-guinda/5 px-2.5 py-1 rounded-full border border-guinda/10 uppercase tracking-widest">${cachedSummaries.length} Instrumentos</span>
                </div>
            </div>

            <div class="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden w-full max-w-5xl mx-auto animate-fade-in-up">
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-100">
                                <th class="px-6 py-4 font-bold text-gray-400 uppercase tracking-widest">Título del Instrumento</th>
                                <th class="px-4 py-4 font-bold text-gray-400 uppercase tracking-widest w-[10%]">Siglas</th>
                                <th class="px-4 py-4 font-bold text-gray-400 uppercase tracking-widest text-center w-[15%]">Tipo</th>
                                <th class="px-4 py-4 font-bold text-gray-400 uppercase tracking-widest w-[15%]">Publicación</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-50">
                            ${cachedSummaries.sort((a,b) => a.titulo.localeCompare(b.titulo)).map(ley => {
                                const typeInfo = classifyInstrument(ley);
                                const date = ley.fecha_publicacion ? new Date(ley.fecha_publicacion).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) : '---';
                                
                                const typeStyle = {
                                    ley: 'bg-guinda/5 text-guinda border-guinda/10',
                                    reglamento: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                                    acuerdo: 'bg-blue-50 text-blue-700 border-blue-100',
                                    dacg: 'bg-blue-50 text-blue-700 border-blue-100',
                                    nom: 'bg-amber-50 text-amber-700 border-amber-100',
                                    otros: 'bg-gray-50 text-gray-500 border-gray-100'
                                }[typeInfo.id] || 'bg-gray-50 text-gray-500 border-gray-100';

                                return `
                                    <tr class="hover:bg-gray-50/80 transition-colors group cursor-pointer law-row-item" data-title="${ley.titulo}">
                                        <td class="px-6 py-4">
                                            <div class="font-bold text-gray-800 group-hover:text-guinda transition-colors" title="${ley.titulo}">${ley.titulo}</div>
                                            ${ley.url_original ? `<a href="${ley.url_original}" target="_blank" class="text-[9px] text-guinda hover:underline flex items-center gap-1 mt-1 opacity-60 hover:opacity-100">
                                                <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg> Ver en DOF
                                            </a>` : ''}
                                        </td>
                                        <td class="px-4 py-4 font-mono text-[11px] font-bold text-gray-400">${ley.siglas || '---'}</td>
                                        <td class="px-4 py-4 text-center">
                                            <span class="px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-widest ${typeStyle}">
                                                ${typeInfo.id}
                                            </span>
                                        </td>
                                        <td class="px-4 py-4 text-gray-400 font-medium">${date}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Add listeners to law rows
        document.querySelectorAll('.law-row-item').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.closest('a')) return;
                const title = row.dataset.title;
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

    // renderTimeline eliminado — vis.js no está instalado como dependencia.
    // Si se quiere restaurar la línea de tiempo, instalar "vis-timeline" via npm
    // y volver a integrar la función aquí.

    function renderCarouselSection(title, items) {
        if (items.length === 0) return '';

        // Usamos el primer item para determinar el estilo base del carrusel si es necesario,
        // pero cada tarjeta se clasificará individualmente.
        const firstType = classifyInstrument(items[0]);
        
        const catConfig = {
            ley: { accent: '#9B2247', label: 'Ley Federal', textColor: 'text-guinda', bgTag: 'bg-guinda/5', img: '/assets/categories/leyes.png' },
            reglamento: { accent: '#1E5B4F', label: 'Reglamento', textColor: 'text-emerald-800', bgTag: 'bg-emerald-50', img: '/assets/categories/reglamentos.png' },
            acuerdo: { accent: '#A57F2C', label: 'Acuerdo', textColor: 'text-amber-800', bgTag: 'bg-amber-50', img: '/assets/categories/otros.png' },
            dacg: { accent: '#1e40af', label: 'DACG', textColor: 'text-blue-800', bgTag: 'bg-blue-50', img: '/assets/categories/otros.png' },
            nom: { accent: '#7e22ce', label: 'NOM', textColor: 'text-purple-800', bgTag: 'bg-purple-50', img: '/assets/categories/otros.png' },
            permiso: { accent: '#0891b2', label: 'Permiso', textColor: 'text-cyan-800', bgTag: 'bg-cyan-50', img: '/assets/categories/otros.png' },
            manual: { accent: '#475569', label: 'Manual', textColor: 'text-slate-800', bgTag: 'bg-slate-50', img: '/assets/categories/otros.png' },
            otros: { accent: '#64748b', label: 'Instrumento', textColor: 'text-gray-800', bgTag: 'bg-gray-50', img: '/assets/categories/otros.png' }
        };

        const baseCat = catConfig[firstType.id] || catConfig.otros;

        // Category icons (SVG paths)
        const iconPath = firstType.id === 'ley'
            ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"/>`
            : firstType.id === 'reglamento'
                ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>`
                : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>`;

        return `
            <div class="mb-8 carousel-container group/section">
                <div class="flex items-center justify-between mb-4 px-1">
                    <h3 class="text-lg font-serif font-bold text-gray-800 flex items-center gap-3">
                        <div class="w-1.5 h-6 rounded-full" style="background-color: ${baseCat.accent}"></div>
                        ${title}
                        <span class="text-xs font-normal text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">${items.length}</span>
                    </h3>
                </div>

                <div class="relative">
                    <!-- Left Arrow -->
                    <button class="scroll-left absolute left-0 top-1/2 -translate-y-1/2 -ml-3 z-10 bg-white shadow-xl border border-gray-100 rounded-full p-2 text-gray-600 opacity-0 group-hover/section:opacity-100 transition-all disabled:opacity-0 hover:text-guinda hover:scale-110 hidden md:block">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <div class="carousel-scroll flex gap-6 overflow-x-auto pb-6 -mx-4 px-4 snap-x scrollbar-hide scroll-smooth">
                        ${items.map(law => {
                            const snippet = law.resumen
                                ? law.resumen.replace(/\n/g, ' ').slice(0, 75) + (law.resumen.length > 75 ? '…' : '')
                                : 'Consulta los artículos y disposiciones vigentes.';
                            
                            const typeInfo = classifyInstrument(law);
                            const cat = catConfig[typeInfo.id] || catConfig.otros;

                            return `
                            <div class="min-w-[260px] w-[260px] md:min-w-[300px] md:w-[300px] snap-start rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer law-card group flex flex-col"
                                data-title="${law.titulo.replace(/"/g, '&quot;')}">
                                
                                <!-- Card Image -->
                                <div class="relative h-44 overflow-hidden">
                                    <img src="${cat.img}" alt="${law.titulo}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                    
                                    <!-- Siglas Badge -->
                                    ${law.siglas ? `
                                    <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm border border-white/20">
                                        <span class="text-[10px] font-black ${cat.textColor}">${law.siglas}</span>
                                    </div>
                                    ` : ''}
                                </div>

                                <!-- Card Content -->
                                <div class="p-6 flex flex-col flex-1">
                                    <span class="text-[10px] font-black uppercase tracking-widest ${cat.textColor} ${cat.bgTag} px-2.5 py-1 rounded-md w-fit mb-4 border border-current opacity-80">${cat.label}</span>
                                    
                                    <h3 class="text-base md:text-lg font-serif font-bold text-gray-800 leading-tight line-clamp-2 mb-3 group-hover:text-guinda transition-colors" title="${law.titulo.replace(/"/g, '&quot;')}">${law.titulo}</h3>
                                    
                                    <p class="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-4 font-light">${snippet}</p>
                                    
                                    <div class="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
                                        <div class="flex flex-col gap-1">
                                            <div class="flex items-center gap-2 text-gray-400 text-[11px] font-medium">
                                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                <span>${law.fecha_publicacion || 'Mayo 2025'}</span>
                                            </div>
                                            ${law.url_original ? `
                                            <a href="${law.url_original}" target="_blank" class="view-original-link flex items-center gap-1 text-guinda font-bold text-[10px] hover:underline mt-1" onclick="event.stopPropagation()">
                                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                                VER ORIGINAL
                                            </a>
                                            ` : ''}
                                        </div>
                                        
                                        <div class="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-guinda group-hover:text-white group-hover:border-guinda group-hover:shadow-lg group-hover:shadow-guinda/20 transition-all">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>`;
                        }).join('')}
                    <!-- Right Arrow -->
                    <button class="scroll-right absolute right-0 top-1/2 -translate-y-1/2 -mr-3 z-10 bg-white shadow-xl border border-gray-100 rounded-full p-2 text-gray-600 opacity-0 group-hover/section:opacity-100 transition-all hover:text-guinda hover:scale-110 hidden md:block">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>
            </div>
        `;

    }

    async function openLawDetail(law) {
        if (!lawDetailContainer) return;
        destroyTOC(); // Remove any previous TOC before building a new one
        hideGlobalSearch(); // Single search bar: use the scoped one inside the law view

        // Limpiar el query, filtros y barra de filtros flotante al entrar a una ley
        currentSearchQuery = '';
        currentFilters = { type: 'all', law: 'all', artNum: '' };
        if (searchInput) searchInput.value = '';
        document.getElementById('search-filters')?.remove();
        document.querySelector('.pagination-nav')?.remove();
        setActiveNav('nav-leyes');

        // Fetch all articles for this law
        currentLawArticles = await getArticlesByLaw(law.titulo);

        // Calculate detailed stats
        const chapters = [...new Set(currentLawArticles.map(a => a.capitulo_nombre).filter(Boolean))];
        const titles = [...new Set(currentLawArticles.map(a => a.titulo_nombre).filter(Boolean))];
        const transitorios = currentLawArticles.filter(a => a.articulo_label.toLowerCase().includes('transitorio')).length;

        // Fetch themes from DB
        const dbThemes = await getThemesByLawName(law.titulo);
        const dbCapitulos = dbThemes.filter(t => t.nivel === 'capitulo').length;
        const dbTitulos = dbThemes.filter(t => t.nivel === 'titulo').length;
        const chaptersCount = dbCapitulos > 0 ? dbCapitulos : chapters.length;

        // Hide other views
        resultsContainer.classList.add('hidden');
        heroSection.classList.add('hidden');
        quickFilters.classList.add('hidden');
        statsMinimal.classList.add('hidden');
        document.getElementById('analisis-container')?.classList.add('hidden', 'opacity-0');

        // Show Law Detail
        lawDetailContainer.classList.remove('hidden');
        setTimeout(() => lawDetailContainer.classList.remove('opacity-0'), 50);
        setHash(`#ley-${encodeURIComponent(law.id)}`);

        // Reading Controls State
        let currentFontSize = 100; // Percentage
        let currentTheme = 'light'; // light, sepia, dark

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
                <nav aria-label="Ruta de navegación" class="flex items-center gap-1.5 text-xs text-gray-400 mb-5 flex-wrap">
                    <button id="crumb-inicio" class="hover:text-guinda transition-colors font-medium" aria-label="Ir al inicio">Inicio</button>
                    <svg class="w-3 h-3 text-gray-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    <button id="crumb-categoria" class="hover:text-guinda transition-colors font-medium" aria-label="Ver todas las leyes">${law.titulo.toLowerCase().startsWith('ley') ? 'Leyes Federales' : law.titulo.toLowerCase().startsWith('reglamento') ? 'Reglamentos' : 'Acuerdos y Otros'}</button>
                    <svg class="w-3 h-3 text-gray-200 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    <span class="text-gray-600 font-semibold truncate max-w-[180px] sm:max-w-xs" title="${law.titulo.replace(/"/g, '&quot;')}">${law.titulo}</span>
                </nav>
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6">
                    <div>
                        <span class="text-xs font-bold text-guinda uppercase tracking-widest bg-guinda/5 px-2 py-1 rounded-full">Marco Legal Vigente ${law.siglas ? `· ${law.siglas}` : ''}</span>
                        <h1 class="text-2xl sm:text-3xl font-head font-bold text-gray-900 mt-2 mb-2">${law.titulo}</h1>
                        <p class="text-sm text-gray-500 font-light">Publicado: <span class="font-bold text-gray-700">${law.fecha_publicacion || 'N/D'}</span> · Última reforma: <span class="font-bold text-gray-700">${law.fecha_ultima_reforma || 'N/D'}</span></p>
                        ${law.resumen ? `<div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 text-sm text-gray-600 font-light leading-relaxed max-w-4xl">${law.resumen.split('\n\n')[0]}</div>` : ''}
                    </div>
                    <div class="flex gap-2 flex-wrap">
                        ${law.url_original ? `<a href="${law.url_original}" target="_blank" class="px-4 py-2 bg-guinda text-white text-xs font-semibold rounded-lg hover:bg-guinda/90 transition-all flex items-center gap-2 shadow-sm">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                            Ver en DOF
                        </a>` : ''}
                        <!-- Share button for the law -->
                        <div class="relative" id="law-share-wrapper">
                            <button id="law-share-btn" class="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:border-green-500 hover:text-green-600 transition-all flex items-center gap-2 shadow-sm">
                                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                Compartir
                            </button>
                            <div id="law-share-menu" class="hidden absolute bottom-full mb-2 right-0 bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden w-56 z-20">
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
                     <span class="text-3xl font-head font-bold text-guinda">${chaptersCount}</span>
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
                    <div class="flex flex-wrap gap-2 content-start" id="themes-container">
                        ${law.temas_clave && law.temas_clave.length > 0 ? law.temas_clave.map(t => `<button class="theme-tag text-xs bg-guinda/5 text-guinda border border-guinda/10 px-3 py-1.5 rounded-lg shadow-sm font-medium hover:bg-guinda hover:text-white transition-all cursor-pointer" data-theme="${t}">${t}</button>`).join('') : '<span class="text-xs text-gray-400">Ingresa temas conceptuales al cargar la ley desde el Gestor</span>'}
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
                
                <!-- Load More -->
                <div id="load-more-container" class="mt-8 mb-12 flex justify-center">
                    <!-- Dynamic button -->
                </div>
            </div>
        `;

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
        const ordinarios = currentLawArticles.filter(a => a.tipo_articulo === 'ordinario' || a.tipo_articulo === 'preambulo');
        const transitoriosArr = currentLawArticles.filter(a => a.tipo_articulo === 'transitorio');

        const buildGrid = (arr) => arr.map((art, i) => {
            const { loggedIn, fav: isFav } = getFavoriteUiState(art.id);
            const hasNote = !!getNote(art.id);
            let label = '';
            
            if (art.tipo_articulo === 'preambulo') {
                label = 'Pre.';
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
            </div>
        `;

        // Build list items HTML (grouped)
        const buildList = (arr) => arr.map((art) => {
            const hasNote = !!getNote(art.id);
            const { loggedIn, fav: isFav } = getFavoriteUiState(art.id);
            const preview = art.texto ? art.texto.replace(/\s+/g, ' ').substring(0, 100).trim() + '...' : '';
            const typeLabel = art.tipo_articulo === 'transitorio' ? 'TRANS' : 
                             art.tipo_articulo === 'preambulo' ? 'PREAM' : 'ART';
            
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
                    <p class="text-sm font-bold text-gray-800">Índice de Artículos</p>
                    <p class="text-[10px] text-gray-400 mt-0.5">${currentLawArticles.length} artículos · clic para abrir</p>
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

        // Render D3 Chart
        setTimeout(() => {
            renderLawStructureChart(currentLawArticles, dbThemes);
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

        // Breadcrumb listeners
        document.getElementById('crumb-inicio')?.addEventListener('click', () => resetToHero());
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

        currentModalList = articles;

        list.innerHTML = articles.map(item => {
            const highlightedText = highlightQuery ? highlightText(item.texto, highlightQuery) : item.texto.substring(0, 300) + '...';
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
            <div class="relative bg-white border ${isSelected ? 'border-guinda/30' : 'border-gray-100'} rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer result-item" data-id="${item.id}">
                <div class="flex items-center justify-between mb-2 pr-14">
                    <span class="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        ${item.articulo_label}
                        ${hasNote ? '<span class="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" title="Tiene nota"></span>' : ''}
                    </span>
                    <span class="text-[10px] text-gray-400 font-medium text-right ml-2 line-clamp-2">${[item.titulo_nombre, item.capitulo_nombre].filter(Boolean).join(' · ')}</span>
                </div>
                <p class="text-sm text-gray-600 font-light leading-relaxed line-clamp-3">${highlightedText}</p>
                <button class="bookmark-card-btn absolute top-3 right-9 p-1 ${loggedIn ? 'text-gray-300 hover:text-guinda' : 'text-guinda'} transition-colors" data-id="${item.id}" title="${favTitle}">${bookmarkIcon}</button>
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

    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Palabras vacías del español que no deben resaltarse en búsquedas multi-palabra
    const STOP_WORDS_ES = new Set([
        'de', 'la', 'el', 'los', 'las', 'en', 'a', 'con', 'por', 'para', 'del', 'al',
        'se', 'su', 'sus', 'que', 'no', 'un', 'una', 'o', 'y', 'e', 'ni', 'u', 'lo',
        'le', 'les', 'me', 'te', 'nos', 'mi', 'si', 'es', 'son', 'fue', 'ser', 'ha',
        'han', 'hay', 'más', 'ya', 'pero', 'como', 'este', 'esta', 'ese', 'esa',
        'ante', 'bajo', 'cada', 'cual', 'donde', 'entre', 'hacia', 'hasta',
        'muy', 'poco', 'sin', 'sobre', 'solo', 'tan', 'todo', 'tras', 'otros'
    ]);

    function highlightText(text, query) {
        if (!query || !text) return text || '';
        
        // Extraer frases entre comillas
        const phrases = [];
        const cleanQuery = query.replace(/"([^"]+)"/g, (match, p) => {
            if (p.trim()) phrases.push(p.trim());
            return ' ';
        });

        const terms = cleanQuery.trim().split(/\s+/).filter(t => t.length > 0);
        const totalElements = terms.length + phrases.length;
        const isMultiElement = totalElements > 1;

        // Filtrar palabras sueltas (stopwords y longitud)
        const words = terms.filter(w =>
            isMultiElement
                ? w.length > 3 && !STOP_WORDS_ES.has(w.toLowerCase())
                : w.length > 1
        );

        // Combinar frases exactas y palabras relevantes
        const allToHighlight = [...phrases, ...words];
        if (allToHighlight.length === 0) return text;

        // Ordenar por longitud descendente para que las frases largas coincidan antes que sus palabras individuales
        allToHighlight.sort((a, b) => b.length - a.length);

        const pattern = allToHighlight.map(w => escapeRegex(w)).join('|');
        const regex = new RegExp(`(${pattern})`, 'gi');
        return text.replace(regex, '<mark class="hl">$1</mark>');
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

        // Debounce timer
        let searchDebounceTimer = null;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

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
                <p style="font-size:13px;color:#374151;line-height:1.7;margin:0 0 ${note ? '10px' : '0'};">${item.texto.substring(0, 800)}${item.texto.length > 800 ? '…' : ''}</p>
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
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
    }
    // ── Fin Exportar ───────────────────────────────────────────────────────────

    async function showFavoritesView() {
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
                    <p class="text-sm text-gray-500 font-light leading-relaxed line-clamp-3">${item.texto.substring(0, 300)}...</p>
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

    function shareLawVia(law, platform) {
        const lawUrl = `${location.origin}${location.pathname}#ley-${encodeURIComponent(law.id)}`;
        const title = law.titulo;
        const resumen = law.resumen ? law.resumen.split('\n\n')[0].substring(0, 400) : `${law.articulos} artículos`;
        const body = `🏛️ *${law.titulo}*\n📅 Publicado: ${law.fecha}\n📖 ${law.articulos} artículos\n\n${resumen}\n\n${lawUrl}`;
        const shortText = `${law.titulo} — Marco Legal Energético SENER`;
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
        
        if (cachedSummaries.length === 0) {
            resultsContainer.classList.remove('hidden');
            resultsContainer.innerHTML = `<div class="w-full flex justify-center py-16"><div class="animate-spin h-8 w-8 border-2 border-guinda border-t-transparent rounded-full"></div></div>`;
            return;
        }

        // Show the D3 Dashboard
        renderAcervoAnalytics(cachedSummaries);
        
        // Also show the detailed stats below
        resultsContainer.classList.remove('hidden');
        setTimeout(() => resultsContainer.classList.remove('opacity-0'), 50);

        const existingFilters = document.getElementById('search-filters');
        if (existingFilters) existingFilters.remove();

        const total = cachedSummaries.reduce((sum, l) => sum + l.articulos, 0);
        const leyes = cachedSummaries.filter(l => l.titulo.toLowerCase().startsWith('ley'));
        const reglamentos = cachedSummaries.filter(l => l.titulo.toLowerCase().startsWith('reglamento'));
        const otros = cachedSummaries.filter(l => !l.titulo.toLowerCase().startsWith('ley') && !l.titulo.toLowerCase().startsWith('reglamento'));
        const sorted = [...cachedSummaries].sort((a, b) => b.articulos - a.articulos);
        const maxArticulos = sorted[0]?.articulos || 1;

        resultsContainer.innerHTML = `
            <div class="w-full max-w-5xl mx-auto mb-10 animate-fade-in-up">
                <div class="flex items-end justify-between mb-8 border-b border-gray-100 pb-6">
                    <div>
                        <span class="text-[10px] font-black text-guinda uppercase tracking-[0.2em] mb-2 block">Visualización de Datos</span>
                        <h2 class="text-3xl font-serif font-bold text-gray-800">Estadísticas del Marco Jurídico</h2>
                    </div>
                    <div class="text-right">
                        <span class="text-[11px] font-medium text-gray-400 block italic">Última actualización: Mayo 2025</span>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-12">
                    <div class="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div class="absolute top-0 right-0 w-24 h-24 bg-guinda/5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                        <span class="text-4xl font-serif font-bold text-guinda block mb-1 relative">${cachedSummaries.length}</span>
                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest relative">Total de Leyes</span>
                    </div>
                    <div class="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div class="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                        <span class="text-4xl font-serif font-bold text-gray-800 block mb-1 relative">${total.toLocaleString('es-MX')}</span>
                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest relative">Artículos Totales</span>
                    </div>
                    <div class="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                        <span class="text-4xl font-serif font-bold text-emerald-700 block mb-1 relative">${leyes.length}</span>
                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest relative">Leyes Federales</span>
                    </div>
                    <div class="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div class="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                        <span class="text-4xl font-serif font-bold text-amber-700 block mb-1 relative">${reglamentos.length + otros.length}</span>
                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest relative">Reglamentos y Otros</span>
                    </div>
                </div>

                <div class="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 mb-10">
                    <h3 class="font-serif font-bold text-xl text-gray-800 mb-8 flex items-center gap-3">
                        <div class="w-1.5 h-6 bg-guinda rounded-full"></div>
                        Densidad de Artículos por Documento
                    </h3>
                    <div class="space-y-5">
                        ${sorted.map(law => {
                            const isLey = law.titulo.toLowerCase().startsWith('ley');
                            const isReg = law.titulo.toLowerCase().startsWith('reglamento');
                            const barColor = isLey ? 'bg-guinda' : isReg ? 'bg-emerald-700' : 'bg-amber-700';
                            const pct = Math.round((law.articulos / maxArticulos) * 100);
                            return `
                            <div class="group cursor-pointer stat-law-row" data-titulo="${law.titulo.replace(/"/g, '&quot;')}">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-[13px] font-bold text-gray-700 group-hover:text-guinda transition-colors truncate max-w-[80%]" title="${law.titulo}">${law.titulo}</span>
                                    <span class="text-xs font-black text-gray-400">${law.articulos} <span class="font-normal text-[10px] uppercase ml-1">arts.</span></span>
                                </div>
                                <div class="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                                    <div class="h-full rounded-full transition-all duration-1000 ${barColor}" style="width:0%;" data-target="${pct}"></div>
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    ${[
                        { label: 'Leyes Federales', items: leyes, color: 'guinda' },
                        { label: 'Reglamentos', items: reglamentos, color: 'emerald-700' },
                        { label: 'Acuerdos y Otros', items: otros, color: 'amber-700' }
                    ].map(cat => `
                        <div class="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div class="flex items-center justify-between mb-6 pb-4 border-b border-gray-50">
                                <span class="text-[10px] font-black text-${cat.color} uppercase tracking-widest">${cat.label}</span>
                                <span class="text-[10px] bg-gray-50 text-gray-500 font-bold px-2 py-0.5 rounded-full">${cat.items.length}</span>
                            </div>
                            <div class="space-y-3">
                                ${cat.items.map(l => `
                                    <div class="text-xs text-gray-500 leading-relaxed hover:text-guinda cursor-pointer transition-colors stat-law-row flex items-start gap-2" data-titulo="${l.titulo.replace(/"/g, '&quot;')}" title="${l.titulo}">
                                        <span class="mt-1.5 w-1 h-1 rounded-full bg-gray-200 flex-shrink-0"></span>
                                        ${l.titulo}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Animate bars after render
        setTimeout(() => {
            resultsContainer.querySelectorAll('[data-target]').forEach(bar => {
                bar.style.width = bar.dataset.target + '%';
            });
        }, 100);

        document.querySelectorAll('.stat-law-row').forEach(row => {
            row.addEventListener('click', () => {
                const law = cachedSummaries.find(l => l.titulo === row.dataset.titulo);
                if (law) openLawDetail(law);
            });
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
                    <h2 class="text-4xl font-serif font-bold text-gray-800 mb-6 italic">¿Cómo podemos ayudarle?</h2>
                    <div class="w-20 h-1 bg-guinda mx-auto rounded-full opacity-20"></div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    <div class="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all">
                        <div class="w-12 h-12 bg-guinda/5 rounded-2xl flex items-center justify-center text-guinda mb-6">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        </div>
                        <h3 class="text-lg font-bold text-gray-800 mb-3">Búsqueda Avanzada</h3>
                        <p class="text-sm text-gray-500 leading-relaxed">Utilice operadores para refinar sus resultados. Use <span class="font-mono text-guinda px-1 bg-guinda/5 rounded">"frase exacta"</span> para coincidencias literales o <span class="font-mono text-guinda px-1 bg-guinda/5 rounded">termino1 & termino2</span> para artículos que contengan ambos.</p>
                    </div>

                    <div class="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all">
                        <div class="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-700 mb-6">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        </div>
                        <h3 class="text-lg font-bold text-gray-800 mb-3">Descarga de Fichas</h3>
                        <p class="text-sm text-gray-500 leading-relaxed">Cada artículo y ley cuenta con una opción de <span class="font-bold text-gray-700 italic">"Ver Original"</span> que le dirigirá al documento PDF oficial del Diario Oficial de la Federación.</p>
                    </div>
                </div>

                <div class="bg-white rounded-[2.5rem] p-10 text-gray-800 border border-gray-100 shadow-xl shadow-gray-200/30 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-guinda/5 rounded-full -mr-32 -mt-32 blur-2xl"></div>
                    <div class="relative z-10 flex flex-col md:flex-row items-center gap-10">
                        <div class="flex-1">
                            <h3 class="text-2xl font-serif font-bold mb-4">¿No encuentra lo que busca?</h3>
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
        
        if (loadingIndicator) loadingIndicator.classList.remove('hidden');

        // RE-FETCH WITH CURRENT FILTERS & PAGE
        const { data: results, total: totalResults } = await performSearch(currentSearchQuery, currentPage, itemsPerPage, currentFilters);
        currentSearchResults = results;
        const query = currentSearchQuery;

        if (loadingIndicator) loadingIndicator.classList.add('hidden');

        // Render Filter Controls 
        const existingFilters = document.getElementById('search-filters');
        if (existingFilters) existingFilters.remove();

        const filterControls = document.createElement('div');
        filterControls.id = 'search-filters';
        filterControls.className = 'w-full max-w-5xl mx-auto mb-8 animate-fade-in-up';
        
        filterControls.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 bg-[#54153B] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-900/20">
                        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800 font-head">${query || 'Explorar'}</h2>
                        <p class="text-xs text-gray-400">Explora la distribución de artículos y disposiciones</p>
                    </div>
                </div>
                <div class="flex flex-col md:items-end gap-3">
                    <div class="flex flex-wrap gap-2">
                        <button class="filter-btn px-6 py-2 text-xs font-bold rounded-full border-2 transition-all ${currentFilters.type === 'all' ? 'bg-[#1E5B4F] text-white border-[#1E5B4F] shadow-lg shadow-green-900/10' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'}" data-type="all">TODOS</button>
                        ${(() => {
                            const typeLabels = {
                                ley: 'LEYES',
                                reglamento: 'REGLAMENTOS',
                                acuerdo: 'ACUERDOS',
                                dacg: "DACG's",
                                nom: 'NOMs',
                                permiso: 'PERMISOS',
                                manual: 'MANUALES',
                                otros: 'INSTITUCIONAL'
                            };
                            // Obtener tipos únicos presentes en el acervo
                            const availableTypes = [...new Set(cachedSummaries.map(s => s.tipo).filter(Boolean))].sort();
                            
                            return availableTypes.map(t => {
                                const label = typeLabels[t] || t.toUpperCase();
                                const isActive = currentFilters.type === t;
                                const activeClass = 'bg-[#1E5B4F] text-white border-[#1E5B4F] shadow-lg shadow-green-900/10';
                                const inactiveClass = 'bg-white text-gray-500 border-gray-100 hover:border-gray-300';
                                return `<button class="filter-btn px-6 py-2 text-xs font-bold rounded-full border-2 transition-all ${isActive ? activeClass : inactiveClass}" data-type="${t}">${label}</button>`;
                            }).join('');
                        })()}
                    </div>
                    <div class="relative flex items-center w-full md:w-80 group">
                        <svg class="absolute left-4 w-4 h-4 text-gray-300 group-hover:text-guinda transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        <input type="text" id="art-number-filter" placeholder="Nº artículo o palabra clave local"
                            value="${currentFilters.artNum}"
                            class="text-xs border rounded-full pl-10 pr-4 py-2.5 w-full focus:outline-none focus:ring-2 focus:ring-guinda/10 focus:border-guinda/40 bg-gray-50/50 hover:bg-white transition-all ${currentFilters.artNum ? 'border-guinda text-guinda' : 'border-gray-200 text-gray-500'}">
                    </div>
                    ${(currentFilters.type !== 'all' || currentFilters.artNum) ? `
                    <button id="clear-all-filters" class="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-widest flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        Limpiar filtros
                    </button>` : ''}
                </div>
            </div>
        `;
        // Insert filters above results
        resultsContainer.parentNode.insertBefore(filterControls, resultsContainer);
        
        // Attach filter events
        filterControls.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentFilters.type = e.target.dataset.type;
                currentPage = 1;
                renderResults();
            });
        });
        const artNumInput = document.getElementById('art-number-filter');
        if (artNumInput) {
            let artNumTimer;
            artNumInput.addEventListener('input', (e) => {
                clearTimeout(artNumTimer);
                artNumTimer = setTimeout(() => {
                    currentFilters.artNum = e.target.value.trim();
                    currentPage = 1;
                    renderResults();
                }, 400);
            });
        }
        document.getElementById('clear-all-filters')?.addEventListener('click', () => {
            currentFilters = { type: 'all', law: 'all', artNum: '' };
            currentPage = 1;
            renderResults();
        });

        if (results.length === 0) {
            const isFiltered = currentFilters.type !== 'all' || currentFilters.artNum;
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
                
            resultsContainer.querySelectorAll('.empty-suggestion').forEach(btn => {
                btn.addEventListener('click', () => {
                    const searchInput = document.getElementById('law-search-input');
                    if (searchInput) {
                        searchInput.value = btn.textContent;
                        searchInput.dispatchEvent(new Event('input'));
                    }
                });
            });
            document.getElementById('empty-browse-laws')?.addEventListener('click', () => { if (typeof showLawsView === 'function') showLawsView(); });
            const existingNav = document.getElementById('results-container').nextElementSibling;
            if (existingNav && existingNav.classList.contains('pagination-nav')) existingNav.remove();
            return;
        }

        currentModalList = results; // full filtered list for modal prev/next nav

        // DATA TABLES UI
        // Fetch counts by law for summary bar (fire-and-forget, won't block table render)
        const lawCounts = await getSearchCountsByLaw(query, currentFilters);
        const totalGlobal = lawCounts.reduce((s, l) => s + l.count, 0);
        const badgeColors = [
            'bg-guinda/10 text-guinda border-guinda/20',
            'bg-blue-50 text-blue-700 border-blue-200',
            'bg-emerald-50 text-emerald-700 border-emerald-200',
            'bg-amber-50 text-amber-700 border-amber-200',
            'bg-violet-50 text-violet-700 border-violet-200',
            'bg-rose-50 text-rose-700 border-rose-200',
            'bg-cyan-50 text-cyan-700 border-cyan-200',
            'bg-orange-50 text-orange-700 border-orange-200'
        ];

        resultsContainer.innerHTML = `
            <div class="w-full max-w-5xl mx-auto mb-10 animate-fade-in-up">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5">
                        <div class="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                        </div>
                        <div>
                            <span class="text-sm font-bold text-gray-800"><span class="text-guinda text-lg">${totalResults}</span> coincidencias totales</span>
                            <p class="text-xs text-gray-400">en ${lawCounts.length} documento${lawCounts.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-[11px] font-bold text-guinda uppercase tracking-widest truncate max-w-[80%]">${lawCounts[0]?.ley || 'Leyes'}</span>
                            <span class="text-[11px] font-bold text-gray-400">${lawCounts[0] ? Math.round((lawCounts[0].count / totalGlobal) * 100) : 0}%</span>
                        </div>
                        <div class="w-full bg-gray-50 h-1.5 rounded-full overflow-hidden">
                            <div class="bg-guinda h-full rounded-full transition-all duration-1000" style="width: ${lawCounts[0] ? (lawCounts[0].count / totalGlobal) * 100 : 0}%"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden w-full max-w-5xl mx-auto animate-fade-in-up">
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="bg-gray-50 border-b border-gray-100">
                                <th class="px-5 py-3 font-bold text-gray-400 uppercase tracking-widest w-[20%]">Instrumento</th>
                                <th class="px-4 py-3 font-bold text-gray-400 uppercase tracking-widest w-[15%]">Artículo</th>
                                <th class="px-5 py-3 font-bold text-gray-400 uppercase tracking-widest w-[50%]">Extracto</th>
                                <th class="px-5 py-3 font-bold text-gray-400 uppercase tracking-widest text-right w-[15%]">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-50">
                            ${results.map(item => {
                                const highlightedText = highlightText(item.texto.substring(0, 140) + '...', query);
                                const highlightedLabel = highlightText(item.articulo_label, query);
                                const { loggedIn, fav: isFav, title: favTitle } = getFavoriteUiState(item.id);
                                return `
                                <tr class="group hover:bg-gray-50/50 transition-all duration-200 cursor-pointer result-item" data-id="${item.id}">
                                    <td class="px-5 py-3 align-top">
                                        <div class="flex flex-col gap-1">
                                            <div class="flex items-center gap-2">
                                                <div class="inline-block px-2 py-0.5 bg-guinda/5 border border-guinda/10 rounded text-[9px] font-black text-guinda uppercase tracking-widest shadow-sm" title="${item.ley_origen}">
                                                    ${item.siglas_ley || (item.ley_origen.length > 15 ? item.ley_origen.substring(0, 15) + '...' : item.ley_origen)}
                                                </div>
                                                ${item.url_original ? `
                                                <a href="${item.url_original}" target="_blank" class="text-gray-300 hover:text-guinda transition-colors" title="Ver en DOF">
                                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                                </a>` : ''}
                                            </div>
                                            <div class="text-[9px] text-gray-400 font-medium flex items-center gap-1">
                                                <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                ${item.fecha_publicacion ? new Date(item.fecha_publicacion).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Fecha N/A'}
                                            </div>
                                            <div class="text-[10px] text-gray-400 font-medium truncate max-w-[120px] italic" title="${[item.titulo_nombre, item.capitulo_nombre].filter(Boolean).join(' · ')}">
                                                ${[item.titulo_nombre, item.capitulo_nombre].filter(Boolean).join(' · ') || 'Disposiciones Generales'}
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-4 py-3 align-top font-bold text-guinda text-[12px]">
                                        ${highlightedLabel}
                                    </td>
                                    <td class="px-5 py-3 align-top text-gray-600 leading-relaxed text-[12px]">
                                        ${highlightedText}
                                    </td>
                                    <td class="px-5 py-3 align-top text-right">
                                        <div class="flex items-center justify-end gap-2">
                                            <button class="bookmark-card-btn p-1.5 rounded-lg border border-gray-100 bg-white text-gray-300 hover:text-guinda hover:border-guinda/30 transition-all shadow-sm" data-id="${item.id}" title="${favTitle}">
                                                ${isFav 
                                                    ? '<svg class="w-3.5 h-3.5 text-guinda" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>'
                                                    : '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Add pagination controls using the total count from backend
        renderPaginationControls(totalResults, 'results-container', renderResults);

        // Add click listeners 
        document.querySelectorAll('.result-item').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('.bookmark-card-btn')) return;
                openDetail(el.dataset.id);
            });
        });
        document.querySelectorAll('.bookmark-card-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!toggleFavorite(btn.dataset.id)) return;
                renderResults();
            });
        });
        document.querySelectorAll('#results-container .compare-card-btn').forEach(btn => {
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
        // Law badge filter click
        document.querySelectorAll('.law-badge-filter').forEach(btn => {
            btn.addEventListener('click', () => {
                const clickedLaw = btn.dataset.law;
                // Toggle: if already active, remove filter; else apply it
                if (currentFilters.law === clickedLaw) {
                    currentFilters.law = 'all';
                } else {
                    currentFilters.law = clickedLaw;
                }
                currentPage = 1;
                renderResults();
            });
        });

        // Animate results
        if (typeof anime !== 'undefined') {
            anime({
                targets: '#results-container .result-item',
                translateX: [20, 0],
                opacity: [0, 1],
                easing: 'easeOutQuint',
                duration: 600,
                delay: anime.stagger(50)
            });
        }
    }

    async function openDetail(id) {
        const item = await getArticleById(id);
        if (!item) return;

        modalLey.textContent = item.ley_origen;
        modalTitle.textContent = item.articulo_label;
        // Make law label clickable — goes to that law's detail
        modalLey.onclick = () => {
            const law = cachedSummaries.find(l => l.titulo === item.ley_origen);
            if (law) { closeModalFunc(); setTimeout(() => openLawDetail(law), 310); }
        };

        // 1. Detectar si el contenido es Markdown (especialmente si tiene tablas)
        const hasMarkdown = item.texto.includes('|') || item.texto.includes('**') || item.texto.includes('###');
        
        let finalHtml = '';
        if (hasMarkdown) {
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

            finalHtml = `<div class="text-gray-800 leading-[1.85] text-[0.92rem]" style="font-family:'Merriweather',serif; text-align:justify; hyphens:auto;">
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
        const hl = (text) => activeQuery ? highlightText(text, activeQuery) : text;

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
                <span class="font-medium">Búsqueda:</span> <mark class="hl">${activeQuery}</mark>
            </div>` : ''}
            ${hl(finalHtml)}
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

        // Update URL for sharing
        setHash(`#art-${encodeURIComponent(id)}`);

        detailModal.classList.remove('hidden');
        detailModal.classList.add('flex');
        
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
        setHash(null);
        modalPanel.classList.remove('scale-100', 'opacity-100');
        modalPanel.classList.add('scale-95', 'opacity-0');

        setTimeout(() => {
            detailModal.classList.add('hidden');
            detailModal.classList.remove('flex');
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
    function showAnalisisView() {
        if (searchInput) searchInput.value = '';
        currentSearchQuery = '';
        currentFilters = { type: 'all', law: 'all', artNum: '' };
        
        setHash(null);
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

        if (analisisContainer.children.length === 0) {
            renderAnalisisView(analisisContainer);
        }
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
                    <h2 class="text-4xl font-serif font-bold text-gray-800 mb-6 italic">¿Cómo podemos ayudarle?</h2>
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
                        <p class="text-xs text-gray-400 leading-relaxed">Utilice términos técnicos del sector como "CENACE", "Transmisión" o "Soberanía" para encontrar artículos específicos en todas las leyes vigentes.</p>
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

                <section class="bg-gray-900 text-white p-10 rounded-3xl relative overflow-hidden">
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

        // ? — keyboard help (anywhere except inputs)
        if (e.key === '?' && !inInput) {
            e.preventDefault();
            showKeyboardHelp();
            return;
        }

        // Esc — close things
        if (e.key === 'Escape') {
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
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
            return;
        }

        // Arrow navigation (only when modal is open and not in input)
        if (modalOpen && !inInput) {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                document.getElementById('modal-next-btn')?.click();
                return;
            }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
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
    resetToHero = function() {
        originalResetToHero();
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
}
