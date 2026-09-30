/**
 * "Mapa de términos": terms defined across the acervo (built by scripts/build-terms.mjs), grouped by
 * sector and linked when they share fragments. Selecting a term shows where it is defined, which
 * instruments use it and its related terms.
 */
import '../styles/terms.css';

export const SECTORS = {
    electricidad: { label: 'Electricidad', color: '#9b2247' },
    hidrocarburos: { label: 'Hidrocarburos', color: '#a57f2c' },
    transicion: { label: 'Transición y medio ambiente', color: '#1e5b4f' },
    planeacion: { label: 'Planeación y desarrollo', color: '#3f6fb5' },
    institucional: { label: 'Institucional y transparencia', color: '#6b4c9a' },
    transversal: { label: 'Transversales', color: '#7a6f63' },
};
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const plain = value => String(value || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const number = value => new Intl.NumberFormat('es-MX').format(value);
const dateLabel = value => { const d = new Date(value); return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }); };

let dataPromise = null;
export const loadTerms = () => (dataPromise ||= import('../data/analisis-terminos.json').then(m => m.default || m));

/**
 * @param {HTMLElement} host
 * @param {{ summaries: object[], selected?: string, onSelect?: Function, onOpenLaw?: Function, onOpenArticle?: Function, onSearch?: Function }} options
 * @returns {Promise<() => void>} destroy
 */
export async function renderTermsView(host, { summaries = [], selected = '', onSelect = () => {}, onOpenLaw = () => {}, onOpenArticle = () => {}, onSearch = () => {} } = {}) {
    host.innerHTML = '<p class="tm-loading" role="status">Cargando el mapa de términos…</p>';
    const data = await loadTerms();
    const lawById = new Map(summaries.map(law => [String(law.id), law]));
    const terms = data.terms;
    const byId = new Map(terms.map(t => [t.id, t]));
    const sectorCounts = terms.reduce((acc, t) => acc.set(t.sector, (acc.get(t.sector) || 0) + 1), new Map());
    const state = { selected: byId.has(selected) ? selected : '', hidden: new Set(), query: '' };

    host.innerHTML = `<div class="tm-view">
        <p class="tm-intro">Detectamos automáticamente <strong>${terms.length} términos</strong> que las leyes, reglamentos y acuerdos definen y que aparecen en varios instrumentos. Las líneas unen términos que suelen usarse juntos en los mismos artículos. <span class="tm-meta">Actualizado el ${esc(dateLabel(data.generatedAt))} · ${number(data.fragments)} fragmentos analizados</span></p>
        <div class="tm-tools">
            <div class="tm-search"><svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg>
                <input type="search" data-tm-search placeholder="Buscar un término (ej. almacenamiento)" aria-label="Buscar un término" autocomplete="off" list="tm-term-list">
                <datalist id="tm-term-list">${terms.map(t => `<option value="${esc(t.label)}">`).join('')}</datalist></div>
            <div class="tm-sectors" role="group" aria-label="Mostrar sectores">${Object.entries(SECTORS).filter(([id]) => sectorCounts.get(id)).map(([id, s]) =>
                `<button type="button" class="tm-sector" data-tm-sector="${id}" aria-pressed="true" style="--c:${s.color}"><i></i>${esc(s.label)} <span>${sectorCounts.get(id)}</span></button>`).join('')}</div>
        </div>
        <div class="tm-layout">
            <div class="tm-graph"><div class="tm-canvas" role="img" aria-label="Mapa de ${terms.length} términos agrupados por sector"></div>
                <p class="tm-hint">Clic en un término: ver su ficha · Arrastra: mueve · Rueda o pellizco: acerca y aleja</p></div>
            <aside class="tm-detail" aria-live="polite"></aside>
        </div>
    </div>`;

    const detail = host.querySelector('.tm-detail');
    const drawDetail = () => {
        const term = byId.get(state.selected);
        if (!term) {
            const top = [...terms].sort((a, b) => b.instruments.length - a.instruments.length).slice(0, 8);
            detail.innerHTML = `<h3 class="tm-detail-empty-title">Elige un término</h3><p class="tm-muted">Verás dónde se define, en qué instrumentos aparece y con qué otros términos se relaciona.</p>
                <p class="tm-label">Los más presentes en el acervo</p><div class="tm-chips">${top.map(t => `<button type="button" class="tm-chip" data-tm-term="${esc(t.id)}" style="--c:${SECTORS[t.sector]?.color}">${esc(t.label)}</button>`).join('')}</div>`;
            return;
        }
        const sector = SECTORS[term.sector] || SECTORS.transversal;
        const max = Math.max(...term.instruments.map(i => i.count));
        const definedIn = term.definedIn.map(d => ({ ...d, law: lawById.get(String(d.lawId)) })).filter(d => d.law);
        const instruments = term.instruments.map(i => ({ ...i, law: lawById.get(String(i.lawId)) })).filter(i => i.law);
        detail.innerHTML = `<p class="tm-sector-tag" style="--c:${sector.color}"><i></i>${esc(sector.label)}</p>
            <h3 class="tm-title">${esc(term.label)}</h3>
            <p class="tm-muted">Aparece en <strong>${instruments.length}</strong> instrumentos y <strong>${number(term.fragments)}</strong> fragmentos.</p>
            <button type="button" class="tm-primary" data-tm-searchterm>Buscar «${esc(term.label)}» en el acervo</button>
            ${definedIn.length ? `<p class="tm-label">Dónde se define</p><ul class="tm-defs">${definedIn.map(d => `<li><button type="button" data-tm-article="${esc(d.articleId)}"><strong>${esc(d.law.siglas || d.law.titulo)}</strong><span>Ver la definición →</span></button></li>`).join('')}</ul>` : ''}
            ${term.related.length ? `<p class="tm-label">Términos relacionados</p><div class="tm-chips">${term.related.filter(r => byId.has(r.id)).map(r => { const t = byId.get(r.id); return `<button type="button" class="tm-chip" data-tm-term="${esc(t.id)}" style="--c:${SECTORS[t.sector]?.color}" title="Comparten ${r.shared} fragmentos">${esc(t.label)}</button>`; }).join('')}</div>` : ''}
            <p class="tm-label">Dónde se usa más</p>
            <ol class="tm-bars">${instruments.slice(0, 12).map(i => `<li><button type="button" data-tm-law="${esc(i.lawId)}" title="${esc(i.law.titulo)}"><span class="tm-bar-name">${esc(i.law.siglas || i.law.titulo)}</span><span class="tm-bar"><i style="width:${Math.max(4, (i.count / max) * 100)}%"></i></span><span class="tm-bar-n">${i.count}</span></button></li>`).join('')}</ol>
            ${instruments.length > 12 ? `<p class="tm-muted">y ${instruments.length - 12} instrumentos más.</p>` : ''}`;
    };

    // ── Graph ──
    const d3 = globalThis.d3;
    const canvas = host.querySelector('.tm-canvas');
    let destroy = () => {};
    let lightTerm = () => {};
    let applyFilters = () => {};
    if (d3) {
        const width = canvas.clientWidth || 800;
        const height = width < 600 ? Math.round(width * 1.05) : Math.max(460, Math.min(640, Math.round(width * 0.72)));
        const svg = d3.select(canvas).append('svg').attr('viewBox', [-width / 2, -height / 2, width, height]).attr('width', '100%').attr('height', height);
        const layer = svg.append('g');
        const zoom = d3.zoom().scaleExtent([0.3, 3]).on('zoom', e => layer.attr('transform', e.transform));
        svg.call(zoom);
        if (width < 600) svg.call(zoom.transform, d3.zoomIdentity.scale(0.62));
        const sectors = Object.keys(SECTORS).filter(id => sectorCounts.get(id));
        const ring = Math.min(width, height) * 0.3;
        const center = new Map(sectors.map((id, i) => { const a = (i / sectors.length) * Math.PI * 2 - Math.PI / 2; return [id, { x: Math.cos(a) * ring, y: Math.sin(a) * ring }]; }));
        const maxInst = Math.max(...terms.map(t => t.instruments.length));
        const nodes = terms.map(t => ({ ...t, r: 4 + Math.sqrt(t.instruments.length / maxInst) * 14, x: center.get(t.sector).x + (Math.random() - 0.5) * 60, y: center.get(t.sector).y + (Math.random() - 0.5) * 60 }));
        const seen = new Set();
        const links = [];
        for (const t of terms) for (const r of t.related.slice(0, 3)) {
            if (!byId.has(r.id)) continue;
            const key = [t.id, r.id].sort().join('|');
            if (seen.has(key)) continue;
            seen.add(key); links.push({ source: t.id, target: r.id, shared: r.shared });
        }
        const labelled = new Set([...terms].sort((a, b) => b.instruments.length - a.instruments.length).slice(0, width < 600 ? 10 : 34).map(t => t.id));
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(70).strength(0.05))
            .force('charge', d3.forceManyBody().strength(-60))
            .force('collide', d3.forceCollide().radius(d => d.r + (labelled.has(d.id) ? 14 : 5)))
            .force('x', d3.forceX(d => center.get(d.sector).x).strength(0.12))
            .force('y', d3.forceY(d => center.get(d.sector).y).strength(0.12));
        const link = layer.append('g').selectAll('line').data(links).join('line').attr('class', 'tm-link');
        const node = layer.append('g').selectAll('g').data(nodes).join('g')
            .attr('class', d => `tm-node${labelled.has(d.id) ? '' : ' is-minor'}`)
            .attr('tabindex', 0).attr('role', 'button').attr('aria-label', d => `${d.label}, ${d.instruments.length} instrumentos`);
        node.append('circle').attr('r', d => d.r).attr('fill', d => SECTORS[d.sector].color);
        node.append('text').attr('dy', d => d.r + 12).text(d => d.label.length > 28 ? `${d.label.slice(0, 27)}…` : d.label);
        const neighbours = new Map(nodes.map(n => [n.id, new Set([n.id])]));
        links.forEach(l => { neighbours.get(l.source.id || l.source).add(l.target.id || l.target); neighbours.get(l.target.id || l.target).add(l.source.id || l.source); });
        lightTerm = id => {
            const near = id ? neighbours.get(id) : null;
            canvas.classList.toggle('is-focus', Boolean(id));
            node.classed('is-lit', d => Boolean(near?.has(d.id))).classed('is-selected', d => d.id === state.selected);
            link.classed('is-lit', l => Boolean(id) && (l.source.id === id || l.target.id === id));
        };
        applyFilters = () => {
            const q = plain(state.query).trim();
            node.classed('is-hidden', d => state.hidden.has(d.sector)).classed('is-match', d => Boolean(q) && plain(d.label).includes(q));
            link.classed('is-hidden', l => state.hidden.has(l.source.sector) || state.hidden.has(l.target.sector));
        };
        node.on('pointerenter', (_, d) => lightTerm(d.id)).on('pointerleave', () => lightTerm(state.selected))
            .on('click', (event, d) => { if (!event.defaultPrevented) select(d.id); })
            .on('keydown', (event, d) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(d.id); } });
        node.call(d3.drag()
            .on('start', (e, d) => { if (!e.active) simulation.alphaTarget(0.2).restart(); d.fx = d.x; d.fy = d.y; })
            .on('drag', (e, d) => { d.fx = e.x; d.fy = e.y; })
            .on('end', (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));
        simulation.on('tick', () => {
            link.attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y);
            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });
        if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { simulation.stop(); for (let i = 0; i < 300; i++) simulation.tick(); simulation.on('tick')(); }
        destroy = () => simulation.stop();
    } else {
        canvas.innerHTML = '<p class="tm-muted" style="padding:40px;text-align:center">El mapa no pudo cargarse; usa el buscador de términos.</p>';
    }

    function select(id) {
        state.selected = byId.has(id) ? id : '';
        drawDetail();
        lightTerm(state.selected);
        onSelect(state.selected);
        if (state.selected && window.innerWidth < 900) detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    host.addEventListener('click', event => {
        const b = event.target.closest('button');
        if (!b || !host.contains(b)) return;
        if (b.dataset.tmTerm) select(b.dataset.tmTerm);
        else if (b.dataset.tmSector) {
            const id = b.dataset.tmSector;
            if (state.hidden.has(id)) state.hidden.delete(id); else state.hidden.add(id);
            b.setAttribute('aria-pressed', String(!state.hidden.has(id)));
            applyFilters();
        } else if (b.hasAttribute('data-tm-searchterm')) onSearch(byId.get(state.selected)?.label || '');
        else if (b.dataset.tmLaw) onOpenLaw(b.dataset.tmLaw);
        else if (b.dataset.tmArticle) onOpenArticle(b.dataset.tmArticle);
    });
    const search = host.querySelector('[data-tm-search]');
    search.addEventListener('input', () => {
        state.query = search.value;
        applyFilters();
        const exact = terms.find(t => plain(t.label) === plain(search.value).trim());
        if (exact) select(exact.id);
    });
    search.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        const q = plain(search.value).trim();
        const hit = terms.find(t => plain(t.label).startsWith(q)) || terms.find(t => plain(t.label).includes(q));
        if (hit) select(hit.id);
    });

    drawDetail();
    lightTerm(state.selected);
    return destroy;
}
