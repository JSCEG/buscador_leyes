import pptxgen from 'pptxgenjs';

const COLORS = {
    guinda: '9B2247',
    guindaDark: '7A1A38',
    guindaLight: 'B24C6C',
    verde: '1E5B4F',
    dorado: 'A57F2C',
    doradoLight: 'D6B46A',
    gris: '98989A',
    grisClaro: 'E5E5E5',
    texto: '2B2B2B',
    muted: '666666',
    white: 'FFFFFF',
    dark: '1E1E1E'
};

const SLIDE = { w: 13.333, h: 7.5 };
const FONT_HEAD = 'Patria';
const FONT_BODY = 'Noto Sans';
const LOGO_GOB = '/img/logo_gob.png';
const LOGO_SENER = '/img/logo_sener.png';
const COVER_IMAGE = '/img/mujer.png';
const WEB_COVER_IMAGE = '/img/portada_ppt.png';
const ANIME_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js';
const HIGHCHARTS_CDN = 'https://code.highcharts.com/highcharts.js';
const HIGHCHARTS_TREEMAP_CDN = 'https://code.highcharts.com/modules/treemap.js';
const SHAPE = {
    rect: 'rect',
    roundRect: 'roundRect'
};

export async function generateLawPresentation(law, articles = [], themes = []) {
    if (!law || !Array.isArray(articles) || articles.length === 0) {
        throw new Error('No hay artículos suficientes para generar la presentación.');
    }

    const assets = await loadAssets();
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = 'Secretaría de Energía';
    pptx.company = 'SENER';
    pptx.subject = `Presentación del instrumento jurídico: ${law.titulo}`;
    pptx.title = law.titulo;
    pptx.lang = 'es-MX';
    pptx.theme = {
        headFontFace: FONT_HEAD,
        bodyFontFace: FONT_BODY,
        lang: 'es-MX'
    };
    pptx.margin = 0;

    const model = buildPresentationModel(law, articles, themes);

    addCoverSlide(pptx, model, assets);
    addSummarySlide(pptx, model, assets);
    addStructureSlide(pptx, model, assets);
    addThemesSlide(pptx, model, assets);
    addKeyArticlesSlides(pptx, model, assets);
    addClosingSlide(pptx, model, assets);

    await pptx.writeFile({ fileName: `${model.fileBase}.pptx`, compression: true });
}

export function openLawPresentationDeck(law, articles = [], themes = []) {
    if (!law || !Array.isArray(articles) || articles.length === 0) {
        throw new Error('No hay artículos suficientes para presentar este instrumento.');
    }

    ensureWebDeckStyles();
    loadAnimeJs();
    loadHighchartsTreemap();

    const existing = document.getElementById('law-presentation-overlay');
    existing?.remove();

    const model = buildPresentationModel(law, articles, themes);
    const overlay = document.createElement('div');
    overlay.id = 'law-presentation-overlay';
    overlay.className = 'law-presentation-overlay';
    overlay.innerHTML = renderWebDeck(model);
    document.body.appendChild(overlay);

    initializePresentationRuntime(overlay, model, law, articles, themes, { embedded: false });
}

export function renderLawPresentationEmbed(target, law, articles = [], themes = []) {
    if (!target || !law || !Array.isArray(articles) || articles.length === 0) return;

    ensureWebDeckStyles();
    loadAnimeJs();
    loadHighchartsTreemap();

    const model = buildPresentationModel(law, articles, themes);
    target.classList.add('law-presentation-embed');
    target.innerHTML = renderWebDeck(model);
    initializePresentationRuntime(target, model, law, articles, themes, { embedded: true });
}

function initializePresentationRuntime(root, model, law, articles, themes, opts = {}) {
    const slides = [...root.querySelectorAll('.lp-slide')];
    const current = root.querySelector('#lp-current-slide');
    const total = root.querySelector('#lp-total-slides');
    const prev = root.querySelector('#lp-prev-slide');
    const next = root.querySelector('#lp-next-slide');
    const close = root.querySelector('#lp-close');
    const fullscreen = root.querySelector('#lp-fullscreen');
    const download = root.querySelector('#lp-download-pptx');
    const progress = root.querySelector('#lp-progress');
    const container = root.querySelector('#lp-slide-container');
    const details = root.querySelector('#lp-interaction-detail');
    let activeIndex = 0;

    if (total) total.textContent = String(slides.length);

    const updateScale = () => {
        const bounds = opts.embedded ? root.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight };
        const availableHeight = opts.embedded ? Math.max(420, bounds.height || 620) : window.innerHeight;
        const scale = Math.min((bounds.width || window.innerWidth) / 1333, availableHeight / 750, 1);
        root.style.setProperty('--lp-scale', String(Math.max(scale, 0.24)));
    };

    const showSlide = (index) => {
        activeIndex = Math.max(0, Math.min(index, slides.length - 1));
        slides.forEach((slide, i) => slide.classList.toggle('active', i === activeIndex));
        if (current) current.textContent = String(activeIndex + 1);
        if (progress) progress.style.width = `${((activeIndex + 1) / slides.length) * 100}%`;
        if (prev) prev.disabled = activeIndex === 0;
        if (next) next.disabled = activeIndex === slides.length - 1;
        animateWebSlide(slides[activeIndex], activeIndex);
        renderHighchartsTreemap(slides[activeIndex], model);
    };

    const closeDeck = () => {
        window.removeEventListener('resize', updateScale);
        document.removeEventListener('keydown', keyHandler);
        if (document.fullscreenElement === root) document.exitFullscreen?.();
        if (opts.embedded) {
            root.classList.add('hidden');
        } else {
            root.remove();
        }
    };

    const keyHandler = (event) => {
        if (!opts.embedded && !document.getElementById('law-presentation-overlay')) return;
        if (opts.embedded && !root.matches(':hover') && document.activeElement?.closest?.('.law-presentation-embed') !== root) return;
        if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
            event.preventDefault();
            showSlide(activeIndex + 1);
        }
        if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
            event.preventDefault();
            showSlide(activeIndex - 1);
        }
        if (event.key === 'Escape') closeDeck();
        if (event.key.toLowerCase() === 'f') root.requestFullscreen?.();
    };

    prev?.addEventListener('click', () => showSlide(activeIndex - 1));
    next?.addEventListener('click', () => showSlide(activeIndex + 1));
    close?.addEventListener('click', closeDeck);
    fullscreen?.addEventListener('click', () => {
        if (document.fullscreenElement) document.exitFullscreen?.();
        else root.requestFullscreen?.();
    });
    download?.addEventListener('click', async () => {
        download.disabled = true;
        download.textContent = 'Generando...';
        try {
            await generateLawPresentation(law, articles, themes);
        } finally {
            download.disabled = false;
            download.textContent = 'Descargar PPTX';
        }
    });

    container?.addEventListener('click', (event) => {
        if (event.target.closest('button, a, .lp-treemap-chart, .lp-treemap-fallback')) return;
        showSlide(activeIndex + 1);
    });

    root.querySelectorAll('[data-lp-detail]').forEach(el => {
        el.addEventListener('click', (event) => {
            event.stopPropagation();
            const title = el.dataset.lpTitle || 'Detalle';
            const text = el.dataset.lpDetail || '';
            if (!details) return;
            details.querySelector('strong').textContent = title;
            details.querySelector('p').textContent = text;
            details.classList.add('active');
            animateInteractionPanel(details);
        });
    });

    details?.querySelector('button')?.addEventListener('click', () => details.classList.remove('active'));

    window.addEventListener('resize', updateScale);
    document.addEventListener('keydown', keyHandler);
    updateScale();
    showSlide(0);
}

function loadAnimeJs() {
    if (window.anime || document.getElementById('animejs-cdn')) return;
    const script = document.createElement('script');
    script.id = 'animejs-cdn';
    script.src = ANIME_CDN;
    script.async = true;
    document.head.appendChild(script);
}

function loadHighchartsTreemap() {
    if (window.Highcharts?.seriesTypes?.treemap || document.getElementById('highcharts-treemap-cdn')) return;

    const loadTreemapModule = () => {
        if (document.getElementById('highcharts-treemap-cdn')) return;
        const moduleScript = document.createElement('script');
        moduleScript.id = 'highcharts-treemap-cdn';
        moduleScript.src = HIGHCHARTS_TREEMAP_CDN;
        moduleScript.async = true;
        document.head.appendChild(moduleScript);
    };

    if (window.Highcharts) {
        loadTreemapModule();
        return;
    }

    if (!document.getElementById('highcharts-cdn')) {
        const script = document.createElement('script');
        script.id = 'highcharts-cdn';
        script.src = HIGHCHARTS_CDN;
        script.async = true;
        script.onload = loadTreemapModule;
        document.head.appendChild(script);
    } else {
        setTimeout(loadTreemapModule, 350);
    }
}

function renderHighchartsTreemap(slide, model, attempt = 0) {
    const container = slide?.querySelector('.lp-treemap-chart');
    if (!container || container.dataset.rendered === 'true') return;

    if (!window.Highcharts?.seriesTypes?.treemap) {
        if (attempt < 16) {
            setTimeout(() => renderHighchartsTreemap(slide, model, attempt + 1), 250);
        }
        return;
    }

    container.dataset.rendered = 'true';
    const deckRoot = slide.closest('.law-presentation-overlay, .law-presentation-embed') || document;
    const detailPanel = deckRoot.querySelector('#lp-interaction-detail');
    const data = model.treemapData.length ? model.treemapData : buildTreemapData(model.articles);

    window.Highcharts.chart(container, {
        chart: {
            backgroundColor: 'transparent',
            spacing: [0, 0, 0, 0],
            style: { fontFamily: 'Noto Sans, Outfit, sans-serif' }
        },
        title: { text: null },
        credits: { enabled: false },
        exporting: { enabled: false },
        tooltip: {
            useHTML: true,
            borderColor: '#A57F2C',
            backgroundColor: 'rgba(255,255,255,.96)',
            formatter() {
                const count = this.point.custom?.count || 1;
                const label = count === 1 ? 'artículo' : 'artículos';
                return `<strong style="color:#9B2247">${escapeHtml(this.point.name)}</strong><br>${count} ${label}`;
            }
        },
        colorAxis: {
            minColor: '#F6EEF1',
            maxColor: '#9B2247'
        },
        plotOptions: {
            series: {
                cursor: 'pointer',
                point: {
                    events: {
                        click() {
                            if (!detailPanel) return;
                            detailPanel.querySelector('strong').textContent = this.name || 'Detalle';
                            detailPanel.querySelector('p').textContent = this.custom?.detail || `${this.custom?.count || 1} artículos`;
                            detailPanel.classList.add('active');
                            animateInteractionPanel(detailPanel);
                        }
                    }
                }
            }
        },
        series: [{
            type: 'treemap',
            layoutAlgorithm: 'squarified',
            allowTraversingTree: true,
            animationLimit: 1000,
            borderColor: '#FFFFFF',
            borderRadius: 5,
            borderWidth: 2,
            dataLabels: {
                enabled: true,
                style: {
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: '800',
                    textOutline: '0 1px 2px rgba(0,0,0,.45)'
                },
                formatter() {
                    if (this.point.node?.level <= 2) return this.point.name;
                    return String(this.point.name || '').slice(0, 42);
                }
            },
            levels: [
                { level: 1, borderWidth: 3, dataLabels: { enabled: true, style: { fontSize: '14px', color: '#FFFFFF', textOutline: '0 1px 2px rgba(0,0,0,.55)' } }, colorByPoint: true },
                { level: 2, borderWidth: 2, dataLabels: { enabled: true, style: { fontSize: '11px', color: '#FFFFFF', textOutline: '0 1px 2px rgba(0,0,0,.5)' } } },
                { level: 3, borderWidth: 1, dataLabels: { enabled: true, style: { fontSize: '9px', color: '#FFFFFF', textOutline: '0 1px 2px rgba(0,0,0,.48)' } } }
            ],
            data
        }]
    });
}

function animateWebSlide(slide, index) {
    if (!slide) return;
    if (!window.anime) {
        slide.classList.remove('lp-animate-ready');
        void slide.offsetWidth;
        slide.classList.add('lp-animate-ready');
        return;
    }

    const anime = window.anime;
    anime.remove(slide.querySelectorAll('[data-animate]'));
    anime({
        targets: slide,
        opacity: [0.35, 1],
        scale: [0.985, 1],
        duration: 360,
        easing: 'easeOutQuad'
    });

    if (index === 0) {
        anime({
            targets: slide.querySelectorAll('.lp-cover-top, .lp-cover-footer'),
            scaleX: [0, 1],
            transformOrigin: ['left center', 'left center'],
            duration: 520,
            easing: 'easeOutQuad'
        });
        anime({
            targets: slide.querySelectorAll('[data-animate]'),
            opacity: [0, 1],
            translateY: [28, 0],
            delay: anime.stagger(70),
            duration: 680,
            easing: 'easeOutQuad'
        });
        anime({
            targets: slide.querySelector('.lp-cover-bg'),
            scale: [1.035, 1],
            duration: 1100,
            easing: 'easeOutQuad'
        });
        return;
    }

    anime({
        targets: slide.querySelectorAll('[data-animate]'),
        opacity: [0, 1],
        translateY: [18, 0],
        delay: anime.stagger(48),
        duration: 520,
        easing: 'easeOutQuad'
    });

    slide.querySelectorAll('[data-count]').forEach(el => animateNumberCountUp(el));
    anime({
        targets: slide.querySelectorAll('.lp-bar-row i, .lp-flow-meter i'),
        scaleX: [0, 1],
        transformOrigin: ['left center', 'left center'],
        delay: anime.stagger(80),
        duration: 640,
        easing: 'easeOutQuart'
    });
}

function animateNumberCountUp(el) {
    if (!window.anime || !el) return;
    const value = Number(el.dataset.count || el.textContent.replace(/[^\d.]/g, ''));
    if (!Number.isFinite(value)) return;
    const target = { value: 0 };
    window.anime({
        targets: target,
        value,
        round: Number.isInteger(value) ? 1 : 100,
        duration: 920,
        easing: 'easeOutQuad',
        update: () => {
            el.textContent = Math.round(target.value).toLocaleString('es-MX');
        }
    });
}

function animateInteractionPanel(panel) {
    if (!window.anime || !panel) return;
    window.anime({
        targets: panel,
        opacity: [0, 1],
        translateY: [12, 0],
        duration: 240,
        easing: 'easeOutQuad'
    });
}

function buildPresentationModel(law, articles, themes) {
    const cleanArticles = articles.map(article => ({
        ...article,
        cleanText: normalizeText(article.texto || '')
    }));
    const transitorios = cleanArticles.filter(a =>
        /transitorio/i.test(a.articulo_label || '') || a.tipo_articulo === 'transitorio'
    );
    const titles = unique(cleanArticles.map(a => a.titulo_nombre).filter(Boolean));
    const chapters = unique(cleanArticles.map(a => a.capitulo_nombre).filter(Boolean));
    const sections = unique(cleanArticles.map(a => a.seccion_nombre).filter(Boolean));
    const themeLabels = law.temas_clave?.length
        ? law.temas_clave
        : unique(themes.map(t => t.nombre).filter(Boolean)).slice(0, 12);

    return {
        law,
        articles: cleanArticles,
        keyArticles: selectKeyArticles(cleanArticles).slice(0, 8),
        fileBase: `Presentacion_${slugify(law.siglas || law.titulo || 'instrumento')}`,
        typeLabel: getTypeLabel(law),
        summary: normalizeText(law.resumen || '').slice(0, 620),
        metrics: {
            totalArticles: cleanArticles.length,
            titles: titles.length,
            chapters: chapters.length,
            sections: sections.length,
            transitorios: transitorios.length
        },
        structureRows: buildStructureRows(cleanArticles, themes),
        treemapData: buildTreemapData(cleanArticles),
        themeLabels,
        transitorios
    };
}

function renderWebDeck(model) {
    const articleSlides = chunk(model.keyArticles, 2).map((items, index) => `
        <section class="lp-slide">
            ${renderSlideShell('ARTÍCULOS CLAVE', `
                <p class="lp-eyebrow">Selección ${index + 1}</p>
                <h2>Artículos relevantes para revisar</h2>
                <div class="lp-article-grid">
                    ${items.map(article => `
                        <article class="lp-article-card" data-animate data-lp-title="${escapeAttr(article.articulo_label || 'Artículo')}" data-lp-detail="${escapeAttr(buildArticleDetailText(article))}">
                            <div>
                                <strong>${escapeHtml(article.articulo_label || 'Artículo')}</strong>
                                <span>${escapeHtml(buildLocation(article))}</span>
                            </div>
                            <p>${escapeHtml(excerpt(article.cleanText, 300))}</p>
                            <small>${escapeHtml(article._keyReason || 'Artículo seleccionado por relevancia normativa')}</small>
                            <em>Click para ver más</em>
                        </article>
                    `).join('')}
                </div>
            `)}
        </section>
    `).join('');

    return `
        <div id="lp-slide-container" class="lp-slide-container">
            <section class="lp-slide lp-cover active">
                <img class="lp-cover-bg" src="${WEB_COVER_IMAGE}" alt="" aria-hidden="true">
                <div class="lp-cover-overlay"></div>
                <div class="lp-cover-top">
                    <img src="/img/logo_gob.png" alt="Gobierno de México">
                    <span></span>
                    <img src="/img/logo_sener.png" alt="SENER">
                    <p>Subsecretaría de Electricidad · Dirección General de Modernización del Sector Eléctrico Nacional</p>
                </div>
                <div class="lp-cover-body">
                    <p class="lp-eyebrow" data-animate>Marco Legal Energético</p>
                    <h1 data-animate>${escapeHtml(model.law.titulo)}</h1>
                    <div class="lp-cover-rule" data-animate></div>
                    <p class="lp-cover-meta" data-animate>${escapeHtml(model.typeLabel)} · ${escapeHtml(model.law.siglas || 'Sin siglas')}</p>
                    <p class="lp-cover-date" data-animate>Publicación: ${escapeHtml(model.law.fecha_publicacion || 'N/D')} · Última reforma: ${escapeHtml(model.law.fecha_ultima_reforma || 'N/D')}</p>
                </div>
                <div class="lp-cover-footer"><span></span><span></span><span></span></div>
            </section>

            <section class="lp-slide">
                ${renderSlideShell('RESUMEN GENERAL', `
                    <p class="lp-eyebrow" data-animate>${escapeHtml(model.law.siglas || model.typeLabel)}</p>
                    <h2 data-animate>${escapeHtml(model.law.titulo)}</h2>
                    <div class="lp-summary-layout">
                        <div class="lp-summary-text" data-animate data-lp-title="Resumen general" data-lp-detail="${escapeAttr(model.summary || 'No hay resumen cargado para este instrumento. La presentación se construye con metadatos, estructura y artículos disponibles en el acervo.')}">${escapeHtml(model.summary || 'No hay resumen cargado para este instrumento. La presentación se construye con metadatos, estructura y artículos disponibles en el acervo.')}</div>
                        <div class="lp-kpis" data-animate>
                            ${renderKpi(model.metrics.totalArticles, 'Artículos')}
                            ${renderKpi(model.metrics.chapters, 'Capítulos')}
                            ${renderKpi(model.metrics.transitorios, 'Transitorios')}
                        </div>
                    </div>
                    <div class="lp-info-strip">
                        ${renderInfo('Tipo', model.typeLabel)}
                        ${renderInfo('Publicación', model.law.fecha_publicacion || 'N/D')}
                        ${renderInfo('Fuente', model.law.url_original ? 'Fuente oficial registrada' : 'Sin URL registrada')}
                    </div>
                `)}
            </section>

            <section class="lp-slide">
                ${renderSlideShell('ESTRUCTURA JURÍDICA', `
                    <p class="lp-eyebrow" data-animate>Estructura detectada</p>
                    <h2 data-animate>Mapa normativo del instrumento</h2>
                    <div class="lp-normative-map">
                        <div class="lp-normative-kpis" data-animate>
                            ${renderStructureKpi(model.metrics.titles, 'Títulos', 'Nivel superior')}
                            ${renderStructureKpi(model.metrics.chapters, 'Capítulos', 'Organización temática')}
                            ${renderStructureKpi(model.metrics.sections, 'Secciones', 'Subdivisiones')}
                            ${renderStructureKpi(model.metrics.transitorios, 'Transitorios', 'Régimen de entrada')}
                        </div>
                        <div class="lp-normative-main">
                            ${renderNormativeFlow(model)}
                            ${renderStructureTable(model.structureRows)}
                        </div>
                    </div>
                `)}
            </section>

            <section class="lp-slide lp-treemap-slide">
                ${renderSlideShell('MAPA COMPLETO', `
                    <p class="lp-eyebrow" data-animate>Vista integral</p>
                    <h2 data-animate>Treemap del instrumento completo</h2>
                    <div class="lp-treemap-layout" data-animate>
                        <div class="lp-treemap-chart" aria-label="Treemap del instrumento"></div>
                        ${renderTreemapFallback(model)}
                    </div>
                    <p class="lp-note lp-treemap-note" data-animate>El tamaño de cada bloque representa artículos o volumen de texto disponible. Click en un bloque para ver más detalle.</p>
                `)}
            </section>

            <section class="lp-slide">
                ${renderSlideShell('TEMAS PRINCIPALES', `
                    <p class="lp-eyebrow" data-animate>Temas cargados</p>
                    <h2 data-animate>Temas del instrumento</h2>
                    <div class="lp-theme-cloud" data-animate>
                        ${(model.themeLabels.length ? model.themeLabels : ['Sin temas conceptuales cargados']).slice(0, 18).map((theme, i) => `
                            <span class="lp-theme lp-theme-${i % 3}" data-lp-title="Tema principal" data-lp-detail="${escapeAttr(theme)}">${escapeHtml(theme)}</span>
                        `).join('')}
                    </div>
                    <p class="lp-note" data-animate>Los temas se toman de los metadatos del acervo. Cuando no existen temas cargados, el visor conserva un estado neutral.</p>
                `)}
            </section>

            ${articleSlides}

            <section class="lp-slide lp-close-slide">
                <img class="lp-close-bg" src="${WEB_COVER_IMAGE}" alt="" aria-hidden="true">
                <div class="lp-close-overlay"></div>
                <div class="lp-close-panel">
                    <div class="lp-close-logos" data-animate>
                        <img src="/img/logo_gob.png" alt="Gobierno de México">
                        <span></span>
                        <img src="/img/logo_sener.png" alt="SENER">
                    </div>
                    <p class="lp-eyebrow" data-animate>Cierre</p>
                    <h2 data-animate>${escapeHtml(model.law.titulo)}</h2>
                    <p data-animate>Consulta siempre el texto oficial vigente para interpretación jurídica, reformas y disposiciones aplicables.</p>
                    ${renderOfficialSourceLink(model.law.url_original)}
                </div>
                <div class="lp-cover-footer"><span></span><span></span><span></span></div>
            </section>
        </div>

        <aside id="lp-interaction-detail" class="lp-interaction-detail" aria-live="polite">
            <button type="button" aria-label="Cerrar detalle">×</button>
            <strong>Detalle</strong>
            <p></p>
        </aside>

        <div class="lp-controls" aria-label="Controles de presentación">
            <button id="lp-prev-slide" type="button">‹</button>
            <span><b id="lp-current-slide">1</b>/<b id="lp-total-slides">1</b></span>
            <button id="lp-next-slide" type="button">›</button>
            <button id="lp-fullscreen" type="button">Pantalla completa</button>
            <button id="lp-download-pptx" type="button">Descargar PPTX</button>
            <button id="lp-close" type="button">Cerrar</button>
        </div>
        <div class="lp-progress-track"><div id="lp-progress"></div></div>
    `;
}

function renderSlideShell(title, content) {
    return `
        <div class="lp-shell">
            <header class="lp-header">
                <div class="lp-brand">SENER</div>
                <div class="lp-title">${escapeHtml(title)}</div>
                <img src="/img/logo_sener.png" alt="SENER">
            </header>
            <main class="lp-content">${content}</main>
            <footer class="lp-footer"></footer>
        </div>
    `;
}

function renderKpi(value, label) {
    return `<div class="lp-kpi" data-lp-title="${escapeAttr(label)}" data-lp-detail="${escapeAttr(`${value} ${label.toLowerCase()} identificados en este instrumento.`)}"><strong data-count="${escapeAttr(value)}">${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`;
}

function renderStructureKpi(value, label, caption) {
    return `
        <button type="button" class="lp-structure-kpi" data-lp-title="${escapeAttr(label)}" data-lp-detail="${escapeAttr(`${value} ${label.toLowerCase()} identificados. ${caption}.`)}">
            <strong data-count="${escapeAttr(value)}">${escapeHtml(value)}</strong>
            <span>${escapeHtml(label)}</span>
            <small>${escapeHtml(caption)}</small>
        </button>
    `;
}

function renderInfo(label, value) {
    return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function renderOfficialSourceLink(url) {
    if (!url) {
        return `<small data-animate class="lp-source-link lp-source-link-muted">Fuente oficial no registrada en el acervo</small>`;
    }

    return `
        <a data-animate class="lp-source-link" href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer" title="Abrir fuente oficial en nueva pestaña">
            <span>Consultar fuente oficial</span>
            <strong>${escapeHtml(url)}</strong>
        </a>
    `;
}

function buildArticleDetailText(article) {
    const parts = [
        buildLocation(article),
        article._keyReason,
        article.cleanText || article.texto
    ].filter(Boolean);
    return parts.join('\n\n');
}

function renderBars(model) {
    const items = [
        { label: 'Títulos', value: model.metrics.titles, color: 'guinda' },
        { label: 'Capítulos', value: model.metrics.chapters, color: 'verde' },
        { label: 'Secciones', value: model.metrics.sections, color: 'dorado' },
        { label: 'Transitorios', value: model.metrics.transitorios, color: 'gris' }
    ].filter(item => item.value > 0);
    const max = Math.max(...items.map(item => item.value), 1);

    return `<div class="lp-bars">
        ${items.map(item => `
            <div class="lp-bar-row" data-animate data-lp-title="${escapeAttr(item.label)}" data-lp-detail="${escapeAttr(`${item.value} ${item.label.toLowerCase()} detectados en la estructura del instrumento.`)}">
                <span>${escapeHtml(item.label)}</span>
                <div><i class="lp-bar-${item.color}" style="width:${Math.max(8, (item.value / max) * 100)}%"></i></div>
                <strong>${escapeHtml(item.value)}</strong>
            </div>
        `).join('')}
    </div>`;
}

function renderNormativeFlow(model) {
    const items = [
        { label: 'Títulos', value: model.metrics.titles, color: 'guinda', note: 'Ejes principales del ordenamiento' },
        { label: 'Capítulos', value: model.metrics.chapters, color: 'verde', note: 'Agrupan materias y obligaciones' },
        { label: 'Secciones', value: model.metrics.sections, color: 'dorado', note: 'Precisan reglas específicas' },
        { label: 'Transitorios', value: model.metrics.transitorios, color: 'gris', note: 'Definen vigencia y transición' }
    ];
    const max = Math.max(...items.map(item => item.value), 1);

    return `<div class="lp-normative-flow" data-animate>
        <div class="lp-flow-head">
            <span>Estructura normativa</span>
            <strong>${escapeHtml(model.metrics.totalArticles)} artículos</strong>
        </div>
        ${items.map((item, index) => `
            <div class="lp-flow-row lp-flow-${item.color}" data-lp-title="${escapeAttr(item.label)}" data-lp-detail="${escapeAttr(item.note)}">
                <div class="lp-flow-index">${index + 1}</div>
                <div class="lp-flow-copy">
                    <strong>${escapeHtml(item.label)}</strong>
                    <span>${escapeHtml(item.note)}</span>
                </div>
                <div class="lp-flow-meter">
                    <i style="width:${Math.max(7, (item.value / max) * 100)}%"></i>
                </div>
                <b>${escapeHtml(item.value)}</b>
            </div>
        `).join('')}
    </div>`;
}

function renderTreemapFallback(model) {
    const leaves = model.treemapData
        .filter(item => item.parent && item.value)
        .slice(0, 42);

    return `<div class="lp-treemap-fallback">
        ${leaves.map((item, index) => `
            <button type="button" class="lp-treemap-tile lp-treemap-tile-${index % 4}" data-lp-title="${escapeAttr(item.name)}" data-lp-detail="${escapeAttr(item.custom?.detail || item.name)}" style="--tile-size:${Math.max(44, Math.min(140, Number(item.value || 1) * 16))}px">
                <span>${escapeHtml(item.name)}</span>
            </button>
        `).join('')}
    </div>`;
}

function renderStructureTable(rows) {
    const visible = rows.length ? rows : [{ nivel: 'N/D', nombre: 'Sin estructura cargada' }];
    return `<div class="lp-mini-table lp-structure-outline" data-animate>
        <div class="lp-mini-head"><span>Nivel</span><span>Primeros apartados</span></div>
        ${visible.slice(0, 9).map(row => `
            <div class="lp-mini-row"><span>${escapeHtml(row.nivel)}</span><strong>${escapeHtml(row.nombre)}</strong></div>
        `).join('')}
    </div>`;
}

function buildTreemapData(articles) {
    const groups = new Map();
    const colors = ['#9B2247', '#1E5B4F', '#A57F2C', '#7A1A38', '#B24C6C', '#6F6F72', '#8A6A22', '#2F7568'];

    articles.forEach((article, index) => {
        const title = article.titulo_nombre || 'Estructura general';
        const chapter = article.capitulo_nombre || article.seccion_nombre || inferArticleBucket(article, index);
        const groupId = `g-${slugify(title) || 'general'}`;
        const chapterId = `${groupId}-c-${slugify(chapter) || index}`;

        if (!groups.has(groupId)) {
            groups.set(groupId, {
                id: groupId,
                name: title,
                parent: '',
                color: colors[groups.size % colors.length],
                custom: { count: 0, detail: title },
                children: new Map()
            });
        }

        const group = groups.get(groupId);
        group.custom.count += 1;
        if (!group.children.has(chapterId)) {
            const chapterIndex = group.children.size;
            group.children.set(chapterId, {
                id: chapterId,
                name: chapter,
                parent: groupId,
                color: shadeHexColor(group.color, chapterIndex % 2 === 0 ? -10 : 10),
                custom: { count: 0, detail: `${title}\n\n${chapter}` },
                children: []
            });
        }

        const chapterNode = group.children.get(chapterId);
        chapterNode.custom.count += 1;
        chapterNode.children.push({
            id: `${chapterId}-a-${index}`,
            name: article.articulo_label || `Artículo ${index + 1}`,
            parent: chapterId,
            value: Math.max(1, Math.ceil((article.cleanText || article.texto || '').length / 850)),
            color: shadeHexColor(chapterNode.color || group.color, (index % 4) * 7 - 8),
            custom: {
                count: 1,
                detail: buildArticleDetailText(article)
            }
        });
    });

    const data = [];
    groups.forEach(group => {
        data.push({
            id: group.id,
            name: group.name,
            parent: group.parent,
            color: group.color,
            custom: {
                count: group.custom.count,
                detail: `${group.name}\n\n${group.custom.count} artículos`
            }
        });

        group.children.forEach(chapter => {
            data.push({
                id: chapter.id,
                name: chapter.name,
                parent: chapter.parent,
                color: chapter.color,
                custom: {
                    count: chapter.custom.count,
                    detail: `${chapter.custom.detail}\n\n${chapter.custom.count} artículos`
                }
            });
            data.push(...chapter.children);
        });
    });

    return data;
}

function inferArticleBucket(article, index) {
    if (article.tipo_articulo === 'transitorio' || /transitorio/i.test(article.articulo_label || '')) return 'Transitorios';
    const bucket = Math.floor(index / 20) + 1;
    return `Bloque ${bucket}`;
}

function shadeHexColor(hex, percent) {
    const clean = String(hex || '#9B2247').replace('#', '');
    const num = parseInt(clean, 16);
    if (Number.isNaN(num)) return '#9B2247';

    const amt = Math.round(2.55 * percent);
    const r = Math.max(0, Math.min(255, (num >> 16) + amt));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

function ensureWebDeckStyles() {
    if (document.getElementById('law-presentation-web-style')) return;

    const style = document.createElement('style');
    style.id = 'law-presentation-web-style';
    style.innerHTML = `
        .law-presentation-overlay{--lp-scale:1;position:fixed;inset:0;z-index:9999;background:#1E1E1E;color:#2b2b2b;overflow:hidden;font-family:'Noto Sans','Outfit',sans-serif}
        .law-presentation-embed{--lp-scale:1;position:relative;width:100%;height:auto;aspect-ratio:1333/750;min-height:420px;background:#fff;border:1px solid rgba(165,127,44,.35);border-radius:10px;box-shadow:0 16px 36px rgba(0,0,0,.16);overflow:hidden;font-family:'Noto Sans','Outfit',sans-serif}
        .law-presentation-embed.hidden{display:none}
        .lp-slide-container{width:1333px;height:750px;position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(var(--lp-scale));transform-origin:center center;box-shadow:0 22px 60px rgba(0,0,0,.45);background:#fff}
        .lp-slide{position:absolute;inset:0;display:none;width:1333px;height:750px;background:#fff;opacity:0;transition:opacity .25s ease}
        .lp-slide.active{display:block;opacity:1}
        .lp-slide.lp-animate-ready [data-animate]{animation:lpFadeUp .48s ease both}
        .lp-shell{width:100%;height:100%;display:flex;flex-direction:column;background:#fff;overflow:hidden}
        .lp-header{height:74px;display:grid;grid-template-columns:1fr 2fr 1fr;align-items:center;padding:14px 34px;background:linear-gradient(180deg,#fafafa 0%,#fff 100%);border-bottom:2px solid #9B2247}
        .lp-brand{font-family:'Patria','Noto Sans',sans-serif;font-weight:700;font-size:21px;color:#9B2247;display:flex;gap:10px;align-items:center}
        .lp-brand:before{content:'';width:4px;height:25px;background:#9B2247;border-radius:2px}
        .lp-title{text-align:center;font-family:'Patria','Noto Sans',sans-serif;font-weight:700;font-size:24px;text-transform:uppercase;letter-spacing:.02em;color:#2b2b2b}
        .lp-title:before,.lp-title:after{content:'·';color:#A57F2C;margin:0 14px}
        .lp-header img{height:39px;justify-self:end}
        .lp-content{flex:1;padding:42px 58px 36px}
        .lp-content h2{font-family:'Patria','Noto Sans',sans-serif;font-size:38px;line-height:1.08;color:#2b2b2b;margin:6px 0 28px;max-width:980px}
        .lp-eyebrow{text-transform:uppercase;letter-spacing:.16em;color:#9B2247;font-weight:800;font-size:13px}
        .lp-footer{height:9px;background:linear-gradient(90deg,#9B2247 0 62%,#A57F2C 62% 100%)}
        .lp-cover{background:#6a172f;color:#fff;overflow:hidden}
        .lp-cover-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;opacity:1}
        .lp-cover-overlay{position:absolute;inset:0;background:linear-gradient(135deg,rgba(155,34,71,.36) 0%,rgba(30,91,79,.26) 60%,rgba(0,0,0,.48) 100%);z-index:1}
        .lp-cover-top{position:relative;z-index:2;height:86px;background:rgba(255,255,255,.96);display:flex;align-items:center;gap:24px;padding:18px 56px;color:#2b2b2b}
        .lp-cover-top img:first-child{height:56px}.lp-cover-top img:nth-child(3){height:48px}.lp-cover-top span{height:48px;width:1px;background:#98989A}.lp-cover-top p{font-size:11px;line-height:1.25;max-width:430px;color:#555}
        .lp-cover-body{position:relative;z-index:2;padding:96px 72px 0 28%;max-width:1180px}
        .lp-cover h1{font-family:'Patria','Noto Sans',sans-serif;font-size:58px;line-height:1.02;margin:18px 0 28px;color:#fff;text-wrap:balance;text-shadow:0 2px 12px rgba(0,0,0,.32)}
        .lp-cover-rule{width:520px;height:6px;background:#D6B46A;margin-bottom:28px}.lp-cover-meta{font-size:22px;font-weight:800}.lp-cover-date{margin-top:16px;font-size:15px;color:rgba(255,255,255,.78)}
        .lp-cover-footer{position:absolute;left:0;right:0;bottom:0;height:18px;display:grid;grid-template-columns:1fr 1fr 1fr;z-index:3}.lp-cover-footer span:nth-child(1){background:#9B2247}.lp-cover-footer span:nth-child(2){background:#1E5B4F}.lp-cover-footer span:nth-child(3){background:#A57F2C}
        [data-lp-detail]{cursor:pointer}.lp-summary-layout{display:grid;grid-template-columns:1.45fr 1fr;gap:36px}.lp-summary-text{font-size:22px;line-height:1.46;color:#333;background:#F8F9FA;border-left:7px solid #9B2247;padding:28px;transition:transform .2s ease,box-shadow .2s ease}
        .lp-summary-text:hover,.lp-kpi:hover,.lp-theme:hover,.lp-article-card:hover,.lp-bar-row:hover{transform:translateY(-3px);box-shadow:0 14px 28px rgba(0,0,0,.11)}
        .lp-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.lp-kpi{background:#F8F9FA;border:1px solid #E5E5E5;padding:26px 12px;text-align:center;transition:transform .2s ease,box-shadow .2s ease}.lp-kpi strong{display:block;font-family:'Patria';font-size:44px;color:#9B2247}.lp-kpi span{text-transform:uppercase;letter-spacing:.08em;font-weight:800;font-size:12px;color:#666}
        .lp-info-strip{margin-top:34px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.lp-info-strip div{border-top:3px solid #A57F2C;background:#F8F9FA;padding:18px}.lp-info-strip span{display:block;color:#9B2247;font-size:11px;text-transform:uppercase;letter-spacing:.12em;font-weight:800}.lp-info-strip strong{display:block;margin-top:7px;font-size:15px;color:#333}
        .lp-normative-map{display:flex;flex-direction:column;gap:24px}.lp-normative-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.lp-structure-kpi{border:1px solid #E5E5E5;border-top:4px solid #9B2247;background:#fff;text-align:left;border-radius:8px;padding:15px 16px;box-shadow:0 8px 18px rgba(0,0,0,.05);cursor:pointer;transition:transform .2s ease,box-shadow .2s ease}.lp-structure-kpi:hover{transform:translateY(-3px);box-shadow:0 14px 28px rgba(0,0,0,.1)}.lp-structure-kpi strong{display:block;font-family:'Patria';font-size:34px;line-height:1;color:#9B2247}.lp-structure-kpi span{display:block;margin-top:7px;text-transform:uppercase;font-size:11px;font-weight:900;letter-spacing:.1em;color:#2b2b2b}.lp-structure-kpi small{display:block;margin-top:5px;font-size:10px;color:#777}.lp-normative-main{display:grid;grid-template-columns:1.08fr .92fr;gap:28px;align-items:start}.lp-normative-flow{background:linear-gradient(180deg,#fff 0%,#F8F9FA 100%);border:1px solid #E5E5E5;border-radius:8px;padding:20px;box-shadow:0 10px 24px rgba(0,0,0,.06)}.lp-flow-head{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #E5E5E5;padding-bottom:13px;margin-bottom:16px}.lp-flow-head span{font-size:11px;text-transform:uppercase;letter-spacing:.14em;font-weight:900;color:#9B2247}.lp-flow-head strong{font-size:12px;color:#A57F2C}.lp-flow-row{display:grid;grid-template-columns:38px 1fr 190px 34px;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid rgba(152,152,154,.18);cursor:pointer}.lp-flow-row:last-child{border-bottom:0}.lp-flow-index{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#9B2247;color:#fff;font-weight:900;font-size:12px}.lp-flow-copy strong{display:block;font-size:16px;color:#2b2b2b}.lp-flow-copy span{display:block;margin-top:3px;font-size:11px;color:#666;line-height:1.3}.lp-flow-meter{height:12px;background:#ECECEC;border-radius:999px;overflow:hidden}.lp-flow-meter i{display:block;height:100%;border-radius:999px;transform-origin:left center}.lp-flow-row b{font-size:16px;color:#9B2247}.lp-flow-guinda .lp-flow-meter i,.lp-flow-guinda .lp-flow-index{background:#9B2247}.lp-flow-verde .lp-flow-meter i,.lp-flow-verde .lp-flow-index{background:#1E5B4F}.lp-flow-dorado .lp-flow-meter i,.lp-flow-dorado .lp-flow-index{background:#A57F2C}.lp-flow-gris .lp-flow-meter i,.lp-flow-gris .lp-flow-index{background:#98989A}.lp-structure-outline{border-radius:8px;overflow:hidden;box-shadow:0 10px 24px rgba(0,0,0,.05)}
        .lp-treemap-slide .lp-content{padding-top:36px}.lp-treemap-layout{position:relative;height:438px;border:1px solid #E5E5E5;border-radius:10px;background:linear-gradient(180deg,#fff 0%,#F8F9FA 100%);box-shadow:0 12px 28px rgba(0,0,0,.08);overflow:hidden}.lp-treemap-chart{position:absolute;inset:16px;z-index:2}.lp-treemap-fallback{position:absolute;inset:16px;z-index:1;display:flex;align-content:flex-start;align-items:stretch;gap:7px;flex-wrap:wrap;overflow:hidden}.lp-treemap-chart[data-rendered="true"] + .lp-treemap-fallback{display:none}.lp-treemap-tile{min-width:var(--tile-size);height:calc(var(--tile-size) * .72);flex:1 1 var(--tile-size);border:0;border-radius:7px;background:#9B2247;color:#fff;text-align:left;padding:8px 10px;overflow:hidden;cursor:pointer;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25);transition:transform .18s ease,filter .18s ease}.lp-treemap-tile:hover{transform:translateY(-2px);filter:brightness(1.08)}.lp-treemap-tile span{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;font-size:10px;line-height:1.2;font-weight:900;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.45)}.lp-treemap-tile-1{background:#1E5B4F}.lp-treemap-tile-2{background:#A57F2C}.lp-treemap-tile-3{background:#7A1A38}.lp-treemap-note{margin-top:14px;font-size:12px}
        .lp-structure-layout{display:grid;grid-template-columns:1.1fr .9fr;gap:42px}.lp-bars{padding-top:12px}.lp-bar-row{display:grid;grid-template-columns:125px 1fr 50px;align-items:center;gap:16px;margin-bottom:24px;font-size:18px;font-weight:800;padding:8px;border-radius:6px;transition:transform .2s ease,box-shadow .2s ease}.lp-bar-row div{height:18px;background:#F1F2F4;overflow:hidden}.lp-bar-row i{display:block;height:100%;transform-origin:left center}.lp-bar-guinda{background:#9B2247}.lp-bar-verde{background:#1E5B4F}.lp-bar-dorado{background:#A57F2C}.lp-bar-gris{background:#98989A}.lp-bar-row strong{color:#9B2247}
        .lp-mini-table{border:1px solid #E5E5E5;background:#fff}.lp-mini-head,.lp-mini-row{display:grid;grid-template-columns:105px 1fr}.lp-mini-head{background:#9B2247;color:#fff;text-transform:uppercase;font-size:12px;font-weight:800;letter-spacing:.08em}.lp-mini-head span,.lp-mini-row span,.lp-mini-row strong{padding:12px 14px}.lp-mini-row{border-top:1px solid #E5E5E5}.lp-mini-row span{color:#A57F2C;font-weight:800}.lp-mini-row strong{font-size:14px;color:#333}
        .lp-theme-cloud{display:grid;grid-template-columns:repeat(3,1fr);gap:17px}.lp-theme{display:flex;align-items:center;min-height:52px;border-radius:6px;border:1px solid currentColor;padding:12px 16px;text-transform:uppercase;font-size:13px;font-weight:800;letter-spacing:.06em;background:#F8F9FA;transition:transform .2s ease,box-shadow .2s ease}.lp-theme-0{color:#9B2247}.lp-theme-1{color:#1E5B4F}.lp-theme-2{color:#A57F2C}.lp-note{margin-top:34px;background:#F8F9FA;border:1px solid #E5E5E5;padding:16px 20px;color:#666;font-size:15px}
        .lp-article-grid{display:grid;grid-template-columns:1fr;gap:18px}.lp-article-card{position:relative;min-height:196px;max-height:208px;overflow:hidden;border:1px solid #E5E5E5;border-left:8px solid #9B2247;background:#F8F9FA;padding:18px 24px 34px;transition:transform .2s ease,box-shadow .2s ease}.lp-article-card:after{content:'';position:absolute;left:0;right:0;bottom:0;height:56px;background:linear-gradient(180deg,rgba(248,249,250,0),#F8F9FA 58%);pointer-events:none}.lp-article-card div{display:flex;align-items:baseline;gap:16px;min-width:0}.lp-article-card strong{font-family:'Patria';font-size:25px;color:#9B2247;white-space:nowrap}.lp-article-card span{font-size:12px;color:#666;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lp-article-card p{margin:10px 0 9px;font-size:15.5px;line-height:1.34;color:#333;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}.lp-article-card small{display:block;font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:#A57F2C;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lp-article-card em{position:absolute;right:22px;bottom:13px;z-index:1;font-style:normal;font-size:10px;text-transform:uppercase;letter-spacing:.1em;font-weight:900;color:#9B2247;background:#fff;border:1px solid rgba(155,34,71,.18);border-radius:999px;padding:6px 10px;box-shadow:0 6px 14px rgba(0,0,0,.07)}
        .lp-close-slide{background:#F7F7F5;overflow:hidden}.lp-close-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.24;filter:saturate(.85) contrast(.92)}.lp-close-overlay{position:absolute;inset:0;background:linear-gradient(90deg,rgba(255,255,255,.97) 0%,rgba(255,255,255,.94) 64%,rgba(155,34,71,.86) 64%,rgba(155,34,71,.9) 100%)}.lp-close-slide:after{content:'';position:absolute;right:0;top:0;bottom:0;width:25%;background:linear-gradient(180deg,rgba(155,34,71,.92),rgba(122,26,56,.94));z-index:1}.lp-close-panel{position:relative;z-index:2;padding:58px 68px;color:#2b2b2b;width:64%;max-width:780px}.lp-close-logos{display:inline-flex;align-items:center;gap:18px;background:#fff;padding:12px 18px;border:1px solid #E5E5E5;box-shadow:0 10px 24px rgba(0,0,0,.08);margin-bottom:52px}.lp-close-logos img{height:42px;width:auto}.lp-close-logos span{width:1px;height:38px;background:#98989A}.lp-close-panel h2{font-family:'Patria';font-size:38px;line-height:1.1;margin:16px 0 24px;color:#9B2247;text-shadow:none;max-width:700px}.lp-close-panel p{font-size:20px;line-height:1.42;color:#2b2b2b;max-width:660px}.lp-source-link{display:inline-flex;flex-direction:column;gap:4px;margin-top:34px;max-width:560px;padding:13px 16px;border:1px solid rgba(165,127,44,.38);border-left:4px solid #A57F2C;border-radius:8px;background:rgba(255,255,255,.82);color:#7A1A38;text-decoration:none;box-shadow:0 8px 18px rgba(0,0,0,.06);transition:transform .2s ease,box-shadow .2s ease,background .2s ease}.lp-source-link:hover{transform:translateY(-2px);box-shadow:0 14px 28px rgba(0,0,0,.12);background:#fff}.lp-source-link span{font-size:11px;text-transform:uppercase;letter-spacing:.12em;font-weight:900;color:#9B2247}.lp-source-link strong{font-size:12.5px;line-height:1.35;color:#A57F2C;word-break:break-word}.lp-source-link-muted{color:#A57F2C;font-size:14px;font-weight:700;word-break:break-word}
        .lp-controls{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:10001;display:flex;align-items:center;gap:12px;background:rgba(30,30,30,.88);border:1px solid rgba(255,255,255,.14);box-shadow:0 12px 30px rgba(0,0,0,.35);backdrop-filter:blur(10px);padding:9px 14px;border-radius:999px;color:#fff;font-size:13px}
        .law-presentation-embed .lp-controls{position:absolute;bottom:14px;z-index:5}
        .law-presentation-embed #lp-close{display:none}
        .law-presentation-embed .lp-progress-track{position:absolute}
        .law-presentation-embed .lp-interaction-detail{position:absolute;right:18px;top:18px;max-height:calc(100% - 90px)}
        .lp-controls button{border:0;border-radius:999px;background:rgba(255,255,255,.1);color:#fff;padding:8px 13px;font-weight:800;cursor:pointer}.lp-controls button:hover{background:#9B2247}.lp-controls button:disabled{opacity:.35;cursor:not-allowed}.lp-controls span{min-width:48px;text-align:center}
        .lp-progress-track{position:fixed;left:0;right:0;bottom:0;height:5px;background:rgba(255,255,255,.12);z-index:10002}.lp-progress-track div{height:100%;background:#D6B46A;width:0;transition:width .22s ease}
        .lp-interaction-detail{position:fixed;right:28px;top:28px;width:390px;max-height:calc(100vh - 120px);z-index:10003;background:rgba(255,255,255,.97);border:1px solid rgba(165,127,44,.35);border-left:5px solid #9B2247;box-shadow:0 18px 44px rgba(0,0,0,.28);border-radius:8px;padding:18px 20px;color:#2b2b2b;display:none;overflow:auto}.lp-interaction-detail.active{display:block}.lp-interaction-detail button{position:sticky;float:right;right:0;top:0;border:0;background:#fff;color:#9B2247;font-size:22px;cursor:pointer}.lp-interaction-detail strong{display:block;font-family:'Patria';font-size:20px;color:#9B2247;margin-bottom:8px;padding-right:28px}.lp-interaction-detail p{font-size:13px;line-height:1.55;color:#555;padding-right:8px;white-space:pre-line}
        .law-presentation-embed .lp-progress-track{position:absolute;z-index:6}
        .law-presentation-embed .lp-interaction-detail{position:absolute;right:18px;top:18px;max-height:calc(100% - 90px);z-index:7}
        @keyframes lpFadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @media (max-width:700px){.law-presentation-embed{min-height:360px}.lp-controls{bottom:12px;gap:6px;padding:7px;max-width:96vw;overflow:auto}.lp-controls button{padding:7px 9px;font-size:11px}.lp-controls button:nth-of-type(4){display:none}}
    `;
    document.head.appendChild(style);
}

function addCoverSlide(pptx, model, assets) {
    const slide = pptx.addSlide();
    paintBase(slide, { cover: true });

    if (assets.cover) {
        slide.addShape(SHAPE.rect, {
            x: 8.45, y: 0, w: 4.883, h: SLIDE.h,
            fill: { color: COLORS.guinda, transparency: 8 },
            line: { color: COLORS.guinda }
        });
        slide.addImage({ data: assets.cover, x: 8.65, y: 0.45, w: 3.85, h: 6.7, transparency: 16 });
    }

    addLogoPair(slide, assets, 0.55, 0.48);
    slide.addText('MARCO LEGAL ENERGÉTICO', {
        x: 0.7, y: 1.7, w: 6.8, h: 0.35,
        fontFace: FONT_BODY, fontSize: 10, bold: true,
        color: COLORS.guinda, charSpace: 2.4
    });
    slide.addText(model.law.titulo, {
        x: 0.65, y: 2.14, w: 7.45, h: 1.45,
        fontFace: FONT_HEAD, fontSize: fitTitleSize(model.law.titulo), bold: true,
        color: COLORS.guinda, breakLine: false, fit: 'shrink'
    });
    slide.addShape(SHAPE.rect, {
        x: 0.7, y: 3.92, w: 5.9, h: 0.06,
        fill: { color: COLORS.dorado }, line: { color: COLORS.dorado }
    });
    slide.addText([
        { text: model.typeLabel.toUpperCase(), options: { bold: true } },
        { text: `  ·  ${model.law.siglas || 'SIN SIGLAS'}` }
    ], {
        x: 0.7, y: 4.18, w: 6.8, h: 0.35,
        fontFace: FONT_BODY, fontSize: 11, color: COLORS.texto
    });
    slide.addText(`Publicación: ${model.law.fecha_publicacion || 'N/D'}\nÚltima reforma: ${model.law.fecha_ultima_reforma || 'N/D'}`, {
        x: 0.7, y: 4.75, w: 5.3, h: 0.7,
        fontFace: FONT_BODY, fontSize: 10, color: COLORS.muted,
        breakLine: false
    });
    slide.addText('Presentación generada desde el Buscador Jurídico SENER', {
        x: 0.7, y: 6.35, w: 6.5, h: 0.3,
        fontFace: FONT_BODY, fontSize: 9.5, color: COLORS.muted
    });
    addCoverFooter(slide);
}

function addSummarySlide(pptx, model, assets) {
    const slide = pptx.addSlide();
    addContentShell(slide, assets, 'RESUMEN GENERAL');
    addSectionTitle(slide, model.law.siglas || model.typeLabel, model.law.titulo);

    const summary = model.summary || 'No hay resumen cargado para este instrumento. La presentación se construye con metadatos, estructura y artículos disponibles en el acervo.';
    slide.addText(summary, {
        x: 0.75, y: 1.65, w: 6.45, h: 2.15,
        fontFace: FONT_BODY, fontSize: 14, color: COLORS.texto,
        breakLine: false, fit: 'shrink',
        valign: 'mid'
    });

    const kpis = [
        { value: model.metrics.totalArticles, label: 'ARTÍCULOS' },
        { value: model.metrics.chapters, label: 'CAPÍTULOS' },
        { value: model.metrics.transitorios, label: 'TRANSITORIOS' }
    ];
    kpis.forEach((kpi, i) => addKpiCard(slide, 7.75 + i * 1.65, 1.65, 1.42, 1.38, kpi.value, kpi.label));

    addInfoRow(slide, 0.75, 4.25, 'Tipo de instrumento', model.typeLabel);
    addInfoRow(slide, 0.75, 4.82, 'Publicación', model.law.fecha_publicacion || 'N/D');
    addInfoRow(slide, 0.75, 5.39, 'Última reforma', model.law.fecha_ultima_reforma || 'N/D');
    addInfoRow(slide, 0.75, 5.96, 'Fuente oficial', model.law.url_original ? 'Documento disponible en DOF / fuente original' : 'Sin URL original registrada');

    slide.addShape(SHAPE.rect, {
        x: 7.75, y: 3.55, w: 4.6, h: 2.35,
        fill: { color: 'F8F9FA' },
        line: { color: COLORS.grisClaro }
    });
    slide.addText('Puntos de revisión', {
        x: 8.05, y: 3.85, w: 4.0, h: 0.28,
        fontFace: FONT_HEAD, fontSize: 17, bold: true, color: COLORS.guinda
    });
    slide.addText('Esta presentación sintetiza la estructura normativa, los temas cargados y una selección de artículos relevantes. No sustituye la consulta del texto oficial.', {
        x: 8.05, y: 4.35, w: 3.95, h: 1.05,
        fontFace: FONT_BODY, fontSize: 11, color: COLORS.muted,
        fit: 'shrink'
    });
}

function addStructureSlide(pptx, model, assets) {
    const slide = pptx.addSlide();
    addContentShell(slide, assets, 'ESTRUCTURA JURÍDICA');
    addSectionTitle(slide, 'Estructura detectada', 'Distribución por niveles normativos');

    const chartData = [
        { label: 'Títulos', value: model.metrics.titles, color: COLORS.guinda },
        { label: 'Capítulos', value: model.metrics.chapters, color: COLORS.verde },
        { label: 'Secciones', value: model.metrics.sections, color: COLORS.dorado },
        { label: 'Transitorios', value: model.metrics.transitorios, color: COLORS.gris }
    ].filter(item => item.value > 0);
    const max = Math.max(...chartData.map(d => d.value), 1);

    chartData.forEach((item, i) => {
        const y = 1.65 + i * 0.78;
        slide.addText(item.label, {
            x: 0.85, y, w: 1.35, h: 0.28,
            fontFace: FONT_BODY, fontSize: 11, bold: true, color: COLORS.texto
        });
        slide.addShape(SHAPE.rect, {
            x: 2.35, y: y + 0.04, w: 4.85, h: 0.25,
            fill: { color: 'F1F2F4' },
            line: { color: 'F1F2F4' }
        });
        slide.addShape(SHAPE.rect, {
            x: 2.35, y: y + 0.04, w: Math.max(0.25, (item.value / max) * 4.85), h: 0.25,
            fill: { color: item.color },
            line: { color: item.color }
        });
        slide.addText(String(item.value), {
            x: 7.45, y: y - 0.03, w: 0.5, h: 0.3,
            fontFace: FONT_BODY, fontSize: 11, bold: true, color: item.color
        });
    });

    slide.addText('Primeros apartados registrados', {
        x: 8.2, y: 1.2, w: 3.8, h: 0.3,
        fontFace: FONT_HEAD, fontSize: 17, bold: true, color: COLORS.guinda
    });
    addMiniTable(slide, model.structureRows.slice(0, 8), 8.2, 1.72, 4.35, 4.5);
}

function addThemesSlide(pptx, model, assets) {
    const slide = pptx.addSlide();
    addContentShell(slide, assets, 'TEMAS PRINCIPALES');
    addSectionTitle(slide, 'Temas cargados', 'Temas del instrumento');

    const themes = model.themeLabels.length ? model.themeLabels.slice(0, 18) : ['Sin temas conceptuales cargados'];
    themes.forEach((theme, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = 0.82 + col * 4.08;
        const y = 1.55 + row * 0.72;
        const color = [COLORS.guinda, COLORS.verde, COLORS.dorado][col];
        slide.addShape(SHAPE.roundRect, {
            x, y, w: 3.55, h: 0.45,
            fill: { color, transparency: 90 },
            line: { color, transparency: 25 },
            radius: 0.08
        });
        slide.addText(String(theme).toUpperCase(), {
            x: x + 0.18, y: y + 0.11, w: 3.2, h: 0.18,
            fontFace: FONT_BODY, fontSize: 8.5, bold: true,
            color, charSpace: 0.55,
            fit: 'shrink'
        });
    });

    slide.addShape(SHAPE.rect, {
        x: 0.82, y: 6.02, w: 11.7, h: 0.62,
        fill: { color: 'F8F9FA' },
        line: { color: COLORS.grisClaro }
    });
    slide.addText('Los temas se toman de los metadatos del acervo. Cuando no existen temas cargados, la presentación conserva el esquema y muestra un estado neutral.', {
        x: 1.05, y: 6.19, w: 11.25, h: 0.22,
        fontFace: FONT_BODY, fontSize: 9.5, color: COLORS.muted
    });
}

function addKeyArticlesSlides(pptx, model, assets) {
    const chunks = chunk(model.keyArticles, 2);
    chunks.forEach((items, idx) => {
        const slide = pptx.addSlide();
        addContentShell(slide, assets, 'ARTÍCULOS CLAVE');
        addSectionTitle(slide, `Selección ${idx + 1}`, 'Artículos relevantes para revisar');
        items.forEach((article, i) => addArticleCard(slide, article, 0.82, 1.45 + i * 2.65, 11.7, 2.15));
    });
}

function addClosingSlide(pptx, model, assets) {
    const slide = pptx.addSlide();
    paintBase(slide, { cover: false, dark: true });
    addLogoPair(slide, assets, 0.7, 0.55, true);
    slide.addText('CIERRE', {
        x: 0.8, y: 1.75, w: 2.6, h: 0.3,
        fontFace: FONT_BODY, fontSize: 10, bold: true,
        color: COLORS.doradoLight, charSpace: 2.2
    });
    slide.addText(model.law.titulo, {
        x: 0.8, y: 2.22, w: 8.4, h: 1.3,
        fontFace: FONT_HEAD, fontSize: 30, bold: true,
        color: COLORS.white, fit: 'shrink'
    });
    slide.addText('Consulta siempre el texto oficial vigente para interpretación jurídica, reformas y disposiciones aplicables.', {
        x: 0.85, y: 4.0, w: 7.2, h: 0.72,
        fontFace: FONT_BODY, fontSize: 15, color: 'E5E5E5',
        fit: 'shrink'
    });
    slide.addText(model.law.url_original || 'Fuente oficial no registrada en el acervo', {
        x: 0.85, y: 5.35, w: 9.8, h: 0.38,
        fontFace: FONT_BODY, fontSize: 10, color: COLORS.doradoLight,
        fit: 'shrink'
    });
    addCoverFooter(slide);
}

function addContentShell(slide, assets, title) {
    paintBase(slide);
    addLogoPair(slide, assets, 0.42, 0.25);
    slide.addText(title, {
        x: 4.2, y: 0.36, w: 5.1, h: 0.25,
        fontFace: FONT_BODY, fontSize: 8.5, bold: true,
        align: 'center', color: COLORS.guinda, charSpace: 2
    });
    slide.addShape(SHAPE.rect, {
        x: 0, y: 7.34, w: 8.0, h: 0.16,
        fill: { color: COLORS.guinda },
        line: { color: COLORS.guinda }
    });
    slide.addShape(SHAPE.rect, {
        x: 8.0, y: 7.34, w: 5.333, h: 0.16,
        fill: { color: COLORS.dorado },
        line: { color: COLORS.dorado }
    });
}

function paintBase(slide, opts = {}) {
    slide.background = { color: opts.dark ? COLORS.dark : COLORS.white };
    if (!opts.dark) {
        slide.addShape(SHAPE.rect, {
            x: 0, y: 0, w: SLIDE.w, h: SLIDE.h,
            fill: { color: COLORS.white },
            line: { color: COLORS.white }
        });
        slide.addShape(SHAPE.rect, {
            x: 0, y: 0, w: SLIDE.w, h: 0.06,
            fill: { color: COLORS.guinda },
            line: { color: COLORS.guinda }
        });
        slide.addShape(SHAPE.rect, {
            x: 4.45, y: 0, w: 4.45, h: 0.06,
            fill: { color: COLORS.verde },
            line: { color: COLORS.verde }
        });
        slide.addShape(SHAPE.rect, {
            x: 8.9, y: 0, w: 4.43, h: 0.06,
            fill: { color: COLORS.dorado },
            line: { color: COLORS.dorado }
        });
    } else {
        slide.addShape(SHAPE.rect, {
            x: 0, y: 0, w: SLIDE.w, h: SLIDE.h,
            fill: { color: COLORS.dark },
            line: { color: COLORS.dark }
        });
        slide.addShape(SHAPE.rect, {
            x: 8.55, y: 0, w: 4.78, h: SLIDE.h,
            fill: { color: COLORS.guinda },
            line: { color: COLORS.guinda }
        });
    }
}

function addCoverFooter(slide) {
    slide.addShape(SHAPE.rect, {
        x: 0, y: 7.2, w: 4.45, h: 0.3,
        fill: { color: COLORS.guinda },
        line: { color: COLORS.guinda }
    });
    slide.addShape(SHAPE.rect, {
        x: 4.45, y: 7.2, w: 4.45, h: 0.3,
        fill: { color: COLORS.verde },
        line: { color: COLORS.verde }
    });
    slide.addShape(SHAPE.rect, {
        x: 8.9, y: 7.2, w: 4.43, h: 0.3,
        fill: { color: COLORS.dorado },
        line: { color: COLORS.dorado }
    });
}

function addLogoPair(slide, assets, x, y, inverted = false) {
    const opacity = inverted ? 18 : 0;
    if (assets.gob) slide.addImage({ data: assets.gob, x, y, w: 1.65, h: 0.43, transparency: opacity });
    if (assets.sener) slide.addImage({ data: assets.sener, x: x + 1.95, y, w: 1.55, h: 0.43, transparency: opacity });
}

function addSectionTitle(slide, eyebrow, title) {
    slide.addText(String(eyebrow || '').toUpperCase(), {
        x: 0.75, y: 0.9, w: 4.2, h: 0.25,
        fontFace: FONT_BODY, fontSize: 8, bold: true,
        color: COLORS.guinda, charSpace: 1.8
    });
    slide.addText(title, {
        x: 0.75, y: 1.12, w: 11.4, h: 0.48,
        fontFace: FONT_HEAD, fontSize: 25, bold: true,
        color: COLORS.texto, fit: 'shrink'
    });
}

function addKpiCard(slide, x, y, w, h, value, label) {
    slide.addShape(SHAPE.rect, {
        x, y, w, h,
        fill: { color: 'F8F9FA' },
        line: { color: COLORS.grisClaro }
    });
    slide.addText(String(value), {
        x, y: y + 0.22, w, h: 0.45,
        fontFace: FONT_HEAD, fontSize: 25, bold: true,
        align: 'center', color: COLORS.guinda
    });
    slide.addText(label, {
        x: x + 0.08, y: y + 0.88, w: w - 0.16, h: 0.25,
        fontFace: FONT_BODY, fontSize: 7.5, bold: true,
        align: 'center', color: COLORS.muted, charSpace: 0.8,
        fit: 'shrink'
    });
}

function addInfoRow(slide, x, y, label, value) {
    slide.addText(label.toUpperCase(), {
        x, y, w: 1.75, h: 0.22,
        fontFace: FONT_BODY, fontSize: 7.5, bold: true,
        color: COLORS.guinda, charSpace: 0.8
    });
    slide.addText(value, {
        x: x + 1.9, y: y - 0.02, w: 4.8, h: 0.28,
        fontFace: FONT_BODY, fontSize: 10, color: COLORS.texto,
        fit: 'shrink'
    });
}

function addMiniTable(slide, rows, x, y, w, h) {
    slide.addShape(SHAPE.rect, {
        x, y, w, h,
        fill: { color: COLORS.white },
        line: { color: COLORS.grisClaro }
    });
    slide.addShape(SHAPE.rect, {
        x, y, w, h: 0.36,
        fill: { color: COLORS.guinda },
        line: { color: COLORS.guinda }
    });
    slide.addText('NIVEL', { x: x + 0.18, y: y + 0.1, w: 0.7, h: 0.15, fontFace: FONT_BODY, fontSize: 7, bold: true, color: COLORS.white });
    slide.addText('APARTADO', { x: x + 1.0, y: y + 0.1, w: w - 1.2, h: 0.15, fontFace: FONT_BODY, fontSize: 7, bold: true, color: COLORS.white });

    const visible = rows.length ? rows : [{ nivel: 'N/D', nombre: 'Sin estructura cargada' }];
    visible.slice(0, 8).forEach((row, i) => {
        const yy = y + 0.47 + i * 0.45;
        slide.addText(row.nivel, {
            x: x + 0.18, y: yy, w: 0.8, h: 0.22,
            fontFace: FONT_BODY, fontSize: 7.2, bold: true,
            color: COLORS.dorado
        });
        slide.addText(row.nombre, {
            x: x + 1.0, y: yy - 0.02, w: w - 1.2, h: 0.28,
            fontFace: FONT_BODY, fontSize: 8.5,
            color: COLORS.texto, fit: 'shrink'
        });
    });
}

function addArticleCard(slide, article, x, y, w, h) {
    slide.addShape(SHAPE.rect, {
        x, y, w, h,
        fill: { color: 'F8F9FA' },
        line: { color: COLORS.grisClaro }
    });
    slide.addShape(SHAPE.rect, {
        x, y, w: 0.12, h,
        fill: { color: COLORS.guinda },
        line: { color: COLORS.guinda }
    });
    slide.addText(article.articulo_label || 'Artículo', {
        x: x + 0.35, y: y + 0.25, w: 2.2, h: 0.33,
        fontFace: FONT_HEAD, fontSize: 17, bold: true,
        color: COLORS.guinda, fit: 'shrink'
    });
    slide.addText(buildLocation(article), {
        x: x + 2.65, y: y + 0.31, w: w - 3.0, h: 0.22,
        fontFace: FONT_BODY, fontSize: 8.5,
        color: COLORS.muted, fit: 'shrink'
    });
    slide.addText(excerpt(article.cleanText, 430), {
        x: x + 0.35, y: y + 0.78, w: w - 0.7, h: 0.95,
        fontFace: FONT_BODY, fontSize: 11.2,
        color: COLORS.texto, breakLine: false, fit: 'shrink'
    });
    slide.addText(article._keyReason || 'Artículo seleccionado por relevancia normativa', {
        x: x + 0.35, y: y + 1.78, w: w - 0.7, h: 0.22,
        fontFace: FONT_BODY, fontSize: 8,
        bold: true, color: COLORS.dorado, charSpace: 0.45,
        fit: 'shrink'
    });
}

function buildStructureRows(articles, themes) {
    if (themes?.length) {
        return themes
            .filter(t => t.nombre)
            .slice(0, 12)
            .map(t => ({ nivel: formatLevel(t.nivel), nombre: t.nombre }));
    }

    const rows = [];
    unique(articles.map(a => a.titulo_nombre).filter(Boolean)).forEach(name => rows.push({ nivel: 'TÍTULO', nombre: name }));
    unique(articles.map(a => a.capitulo_nombre).filter(Boolean)).forEach(name => rows.push({ nivel: 'CAP.', nombre: name }));
    unique(articles.map(a => a.seccion_nombre).filter(Boolean)).forEach(name => rows.push({ nivel: 'SECC.', nombre: name }));
    return rows.slice(0, 12);
}

function selectKeyArticles(articles) {
    const rules = [
        { pattern: /\bobjeto\b|\bfinalidad\b/i, reason: 'Define objeto o finalidad del instrumento', weight: 80 },
        { pattern: /\bsecretar[ií]a\b|\bSENER\b/i, reason: 'Relaciona atribuciones de la Secretaría de Energía', weight: 70 },
        { pattern: /\bplaneaci[oó]n\b|\bprograma\b|\bestrategia\b/i, reason: 'Contiene reglas de planeación o política energética', weight: 65 },
        { pattern: /\bpermiso\b|\bautorizaci[oó]n\b|\bsolicitud\b/i, reason: 'Regula permisos, autorizaciones o trámites', weight: 55 },
        { pattern: /\bsanci[oó]n\b|\binfracci[oó]n\b|\bmultas?\b/i, reason: 'Incluye régimen de cumplimiento o sanciones', weight: 50 },
        { pattern: /\btransitorio\b/i, reason: 'Disposición transitoria relevante', weight: 45 },
    ];

    return articles
        .map((article, index) => {
            let score = Math.max(0, 30 - index);
            let reason = 'Primeros artículos del instrumento';
            for (const rule of rules) {
                if (rule.pattern.test(`${article.articulo_label || ''} ${article.cleanText || ''}`)) {
                    score += rule.weight;
                    reason = rule.reason;
                    break;
                }
            }
            if (article.capitulo_nombre) score += 8;
            if ((article.cleanText || '').length > 800) score += 6;
            return { ...article, _keyScore: score, _keyReason: reason };
        })
        .sort((a, b) => b._keyScore - a._keyScore)
        .filter((article, index, arr) => arr.findIndex(a => a.articulo_label === article.articulo_label) === index);
}

async function loadAssets() {
    const [gob, sener, cover] = await Promise.all([
        imageToDataUri(LOGO_GOB),
        imageToDataUri(LOGO_SENER),
        imageToDataUri(COVER_IMAGE)
    ]);
    return { gob, sener, cover };
}

async function imageToDataUri(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const blob = await response.blob();
        return await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
}

function getTypeLabel(law) {
    const raw = (law.tipo || law.titulo || '').toLowerCase();
    if (raw.includes('reglamento')) return 'Reglamento';
    if (raw.includes('acuerdo')) return 'Acuerdo';
    if (raw.includes('decreto')) return 'Decreto';
    if (raw.includes('nom') || raw.includes('norma')) return 'Norma Oficial Mexicana';
    if (raw.includes('manual')) return 'Manual / Lineamiento';
    if (raw.includes('dacg')) return 'Disposición administrativa';
    if (raw.includes('ley')) return 'Ley';
    return 'Instrumento jurídico';
}

function formatLevel(level) {
    const value = String(level || 'Nivel').toUpperCase();
    if (value === 'CAPITULO') return 'CAP.';
    if (value === 'SECCION') return 'SECC.';
    return value;
}

function normalizeText(text) {
    return String(text || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/[#*_`|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function buildLocation(article) {
    return [article.titulo_nombre, article.capitulo_nombre, article.seccion_nombre]
        .filter(Boolean)
        .join(' · ') || 'Ubicación general del instrumento';
}

function excerpt(text, max) {
    if (!text) return 'Sin texto disponible para este artículo.';
    return text.length > max ? `${text.slice(0, max).trim()}...` : text;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
}

function fitTitleSize(title) {
    const len = String(title || '').length;
    if (len > 115) return 24;
    if (len > 80) return 28;
    return 34;
}

function slugify(value) {
    return String(value || 'instrumento')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 70) || 'instrumento';
}

function unique(values) {
    return [...new Set(values.map(v => String(v || '').trim()).filter(Boolean))];
}

function chunk(items, size) {
    const output = [];
    for (let i = 0; i < items.length; i += size) output.push(items.slice(i, i + size));
    return output.length ? output : [[]];
}
