/**
 * The Acervo: every document as a book cover, in rows that slide sideways. Filters by type and by authority
 * rearrange the rows (see acervoReels); navigation and persistence remain owned by the app.
 */
import { PLANNING_FILTER, isPlanning } from '../lib/planning.js';
import { ACERVO_GROUPS, acervoIssuers, acervoReels, getAcervoGroup, selectAcervo } from '../lib/acervo-model.js';
import { ISSUERS } from '../lib/issuer.js';
import { issuerMark } from '../lib/issuer-logos.js';
import { coverData, coverHTML } from '../lib/law-cover.js';
import { fragmentNoun, isJudgment } from '../lib/judgment.js';
import '../styles/shelf.css';
import '../styles/acervo.css';

const mountedViews = new WeakMap();
let nextViewId = 0;
const number = value => new Intl.NumberFormat('es-MX').format(value);
const countLabel = count => `${number(count)} ${count === 1 ? 'documento' : 'documentos'}`;
const SORTS = ['date-newest', 'title', 'date-oldest'];
const TYPE_FILTERS = [{ id: 'all', label: 'Todos' }, ...ACERVO_GROUPS, PLANNING_FILTER];
const ISSUER_IDS = new Set(ISSUERS.map(issuer => issuer.id));
const ARROW = direction => `<svg class="bu-i" viewBox="0 0 24 24" aria-hidden="true"><path d="${direction < 0 ? 'm14 6-6 6 6 6' : 'm10 6 6 6-6 6'}"/></svg>`;

const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
};
const inGroup = (law, groupId) => (groupId === PLANNING_FILTER.id ? isPlanning(law) : getAcervoGroup(law) === groupId);

function readState(initial) {
    const group = initial.group === PLANNING_FILTER.id || ACERVO_GROUPS.some(item => item.id === initial.group) ? initial.group : 'all';
    const rowScroll = {};
    for (const [key, offset] of Object.entries(initial.rowScroll || {})) if (Number.isFinite(offset) && offset >= 0) rowScroll[key] = offset;
    return {
        query: typeof initial.query === 'string' ? initial.query.slice(0, 500) : '',
        group,
        issuer: ISSUER_IDS.has(initial.issuer) ? initial.issuer : 'all',
        sort: SORTS.includes(initial.sort) ? initial.sort : 'date-newest',
        rowScroll,
        scrollY: Math.max(0, Number(initial.scrollY) || 0),
    };
}

export function renderAcervoView(container, summaries, { state: initialState = {}, onStateChange = () => {}, onOpenLaw = () => {}, onOpenStats = null, onShowShelf = null } = {}) {
    if (!container || typeof container.replaceChildren !== 'function') throw new Error('Falta el contenedor del acervo.');
    mountedViews.get(container)?.destroy();
    const laws = selectAcervo(Array.isArray(summaries) ? summaries : [], { sort: 'date-newest' });
    const state = readState(initialState);
    const id = `acervo-${++nextViewId}`;
    let destroyed = false;
    let frame = null;
    let restoreRowsOnFrame = false;
    let rowBindings = [];
    let featuredIndex = 0;
    let featured = [];
    const requestFrame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : callback => setTimeout(callback, 0);
    const cancelFrame = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : clearTimeout;

    // ---------- header and filters ----------
    const root = element('section', 'ac-library');
    root.setAttribute('aria-labelledby', `${id}-title`);
    const head = element('header', 'ac-head');
    const heading = element('div', 'ac-head-text');
    const title = element('h1', '', 'Acervo'); title.id = `${id}-title`;
    heading.append(title, element('p', 'ac-total', countLabel(laws.length)));
    const links = element('nav', 'ac-links'); links.setAttribute('aria-label', 'Otras vistas');
    if (typeof onShowShelf === 'function') {
        const shelf = element('button', 'bu-btn bu-btn-fantasma bu-btn-sm', 'Estante 3D'); shelf.type = 'button'; shelf.dataset.showShelf = '';
        shelf.addEventListener('click', () => onShowShelf());
        links.append(shelf);
    }
    if (typeof onOpenStats === 'function') {
        const stats = element('button', 'bu-btn bu-btn-fantasma bu-btn-sm', 'Estadísticas'); stats.type = 'button';
        stats.addEventListener('click', () => onOpenStats());
        links.append(stats);
    }
    const searchForm = element('form', 'ac-search-form');
    searchForm.setAttribute('role', 'search'); searchForm.setAttribute('aria-label', 'Buscar en el acervo');
    const searchBox = element('div', 'bu-campo ac-search-box');
    searchBox.innerHTML = '<svg class="bu-i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg>';
    const searchInput = element('input');
    searchInput.type = 'search'; searchInput.id = `${id}-search`; searchInput.maxLength = 500; searchInput.autocomplete = 'off';
    searchInput.placeholder = 'Busca por nombre, siglas o tema'; searchInput.value = state.query;
    searchInput.setAttribute('aria-label', 'Buscar en el acervo');
    const clear = element('button', 'ac-clear', '×'); clear.type = 'button'; clear.setAttribute('aria-label', 'Limpiar búsqueda');
    searchBox.append(searchInput, clear); searchForm.append(searchBox);
    head.append(heading, searchForm, links);

    const bar = element('div', 'ac-bar bu-cristal-fuerte');
    const issuerBox = element('label', 'bu-campo ac-issuer');
    issuerBox.append(element('span', 'ac-sr', 'Filtrar por dependencia'));
    const issuerSelect = element('select'); issuerSelect.setAttribute('aria-label', 'Filtrar por dependencia');
    issuerBox.append(issuerSelect);
    const filters = element('div', 'ac-filters'); filters.setAttribute('role', 'group'); filters.setAttribute('aria-label', 'Tipo de documento');
    const filterButtons = new Map();
    for (const group of TYPE_FILTERS) {
        const button = element('button', 'bu-chip ac-filter'); button.type = 'button'; button.dataset.group = group.id;
        button.append(element('span', '', group.label), element('span', 'ac-filter-count'));
        filters.append(button); filterButtons.set(group.id, button);
    }
    // On phones the types are a menu beside the authorities: one line, and every option is a tap away.
    const typeBox = element('label', 'bu-campo ac-type');
    const typeSelect = element('select'); typeSelect.setAttribute('aria-label', 'Filtrar por tipo de documento');
    typeBox.append(typeSelect);
    bar.append(typeBox, issuerBox, filters);

    const billboard = element('section', 'ac-cartel');
    const statusRow = element('div', 'ac-status-row');
    const status = element('p', 'ac-result-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
    const reset = element('button', 'bu-btn bu-btn-fantasma bu-btn-sm ac-reset-filters', 'Quitar filtros'); reset.type = 'button';
    const sortBox = element('label', 'bu-campo ac-sort');
    const sortSelect = element('select'); sortSelect.setAttribute('aria-label', 'Ordenar documentos');
    for (const [value, text] of [['date-newest', 'Más recientes'], ['title', 'Por nombre'], ['date-oldest', 'Más antiguos']]) {
        const option = element('option', '', text); option.value = value; option.selected = value === state.sort; sortSelect.append(option);
    }
    sortBox.append(sortSelect);
    statusRow.append(status, reset, sortBox);
    const body = element('div', 'ac-collections');
    root.append(head, bar, billboard, statusRow, body);
    container.replaceChildren(root);

    // ---------- state ----------
    function captureRows() {
        // A hidden row reports 0: that is not where the reader left it.
        for (const { row, rowId, restored } of rowBindings) if (restored && (row.scrollLeft > 0 || row.clientWidth > 0)) state.rowScroll[rowId] = Math.max(0, row.scrollLeft);
    }
    function captureState() {
        captureRows();
        state.scrollY = Math.max(0, Number(window.scrollY) || 0);
        return { ...state, rowScroll: { ...state.rowScroll } };
    }
    function notify() { if (!destroyed) onStateChange(captureState()); }
    function open(law) {
        const snapshot = captureState();
        onStateChange(snapshot);
        onOpenLaw(law, snapshot);
    }
    function applyFilter(next) {
        captureRows();
        Object.assign(state, next);
        featuredIndex = 0;
        renderBody();
        notify();
    }

    function updateRows() {
        if (destroyed) return;
        for (const { row, previous, next } of rowBindings) {
            const maximum = Math.max(0, row.scrollWidth - row.clientWidth);
            previous.disabled = row.scrollLeft <= 1;
            next.disabled = row.scrollLeft >= maximum - 1;
        }
    }
    function scheduleRows({ restore = false } = {}) {
        restoreRowsOnFrame ||= restore;
        if (frame !== null) cancelFrame(frame);
        frame = requestFrame(() => {
            frame = null;
            if (destroyed) return;
            if (restoreRowsOnFrame) {
                for (const binding of rowBindings) {
                    binding.row.scrollLeft = state.rowScroll[binding.rowId] || 0;
                    binding.restored = true;
                }
                restoreRowsOnFrame = false;
            }
            updateRows();
        });
    }

    // ---------- pieces ----------
    function makeCard(law) {
        const card = element('button', 'ac-card'); card.type = 'button'; card.dataset.lawId = law.id;
        const name = law.titulo || 'Documento sin título';
        card.title = name; card.setAttribute('aria-label', `Abrir ${name}`);
        card.dataset.category = getAcervoGroup(law);
        card.innerHTML = coverHTML(law); // coverHTML escapes every value
        card.addEventListener('click', () => open(law));
        return card;
    }

    function renderRow(reel) {
        const section = element('section', 'ac-group'); section.dataset.row = reel.id;
        const label = `${id}-${reel.id}`;
        section.setAttribute('aria-labelledby', label);
        const rowHead = element('div', 'ac-group-header');
        const name = element('h2', '', reel.label); name.id = label;
        name.append(element('span', 'ac-group-count', String(reel.items.length)));
        rowHead.append(name);
        if (reel.filter) {
            const all = element('button', 'ac-see-all', 'Ver todos'); all.type = 'button'; all.setAttribute('aria-label', `Ver todos: ${reel.label}`);
            all.addEventListener('click', () => {
                applyFilter(reel.filter);
                root.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
            });
            rowHead.append(all);
        }
        const frameBox = element('div', 'ac-row-frame');
        const row = element('ul', 'ac-row'); row.dataset.group = reel.id; row.id = `${label}-row`;
        row.setAttribute('aria-label', `${reel.label}: ${countLabel(reel.items.length)}`);
        reel.items.forEach(law => { const item = element('li'); item.append(makeCard(law)); row.append(item); });
        const arrow = (direction, text) => {
            const button = element('button', `ac-arrow ac-arrow-${direction < 0 ? 'prev' : 'next'}`); button.type = 'button';
            button.innerHTML = ARROW(direction);
            button.setAttribute('aria-label', `${text} en ${reel.label}`); button.setAttribute('aria-controls', row.id);
            button.addEventListener('click', () => {
                const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
                const left = direction * Math.max(200, row.clientWidth * 0.85);
                if (typeof row.scrollBy === 'function') row.scrollBy({ left, behavior: reduced ? 'auto' : 'smooth' });
                else row.scrollLeft += left;
                state.rowScroll[reel.id] = row.scrollLeft; updateRows(); notify();
            });
            return button;
        };
        const previous = arrow(-1, 'Anteriores');
        const next = arrow(1, 'Siguientes');
        row.addEventListener('scroll', () => { if (!destroyed) { state.rowScroll[reel.id] = row.scrollLeft; updateRows(); notify(); } }, { passive: true });
        // Only keyboard focus brings a card into view: returning from a document must not move the row.
        row.addEventListener('focusin', event => { if (event.target.matches(':focus-visible')) event.target.closest('.ac-card')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'auto' }); });
        frameBox.append(row, previous, next);
        section.append(rowHead, frameBox);
        rowBindings.push({ row, rowId: reel.id, previous, next, restored: false });
        return section;
    }

    // The newest document of the selection, with the next ones a click away.
    function renderBillboard() {
        billboard.hidden = !featured.length;
        billboard.replaceChildren();
        if (!featured.length) return;
        const law = featured[Math.min(featuredIndex, featured.length - 1)];
        const data = coverData(law);
        billboard.dataset.category = data.group;
        billboard.setAttribute('aria-label', 'Lo más reciente');
        const cover = element('button', 'ac-cartel-libro'); cover.type = 'button';
        cover.setAttribute('aria-label', `Abrir ${data.title || data.name}`);
        cover.innerHTML = coverHTML(law); // coverHTML escapes every value
        cover.addEventListener('click', () => open(law));
        const text = element('div', 'ac-cartel-texto');
        text.append(element('p', 'ac-cartel-tag', 'Lo más reciente'), element('h2', '', data.name));
        if (data.title && data.title !== data.name) text.append(element('p', 'ac-cartel-titulo', data.title));
        const noun = isJudgment(law) ? fragmentNoun(law) : { one: 'disposición', many: 'disposiciones' };
        const facts = [data.typeLabel, data.year === 'Sin fecha' ? '' : data.year, issuerMark(law)?.label, law.articulos > 0 ? `${number(law.articulos)} ${law.articulos === 1 ? noun.one : noun.many}` : ''].filter(Boolean);
        const list = element('ul', 'ac-cartel-datos');
        facts.forEach(fact => list.append(element('li', '', fact)));
        const actions = element('div', 'ac-cartel-acciones');
        const read = element('button', 'bu-btn bu-btn-primario', 'Abrir'); read.type = 'button'; read.dataset.featuredOpen = law.id;
        read.addEventListener('click', () => open(law));
        actions.append(read);
        if (featured.length > 1) {
            const step = direction => {
                featuredIndex = (featuredIndex + direction + featured.length) % featured.length;
                renderBillboard();
                billboard.querySelector(direction < 0 ? '[data-featured-prev]' : '[data-featured-next]')?.focus();
            };
            const previous = element('button', 'bu-btn bu-btn-contorno ac-cartel-paso'); previous.type = 'button'; previous.dataset.featuredPrev = '';
            previous.innerHTML = ARROW(-1); previous.setAttribute('aria-label', 'Documento anterior');
            previous.addEventListener('click', () => step(-1));
            const next = element('button', 'bu-btn bu-btn-contorno ac-cartel-paso'); next.type = 'button'; next.dataset.featuredNext = '';
            next.innerHTML = ARROW(1); next.setAttribute('aria-label', 'Documento siguiente');
            next.addEventListener('click', () => step(1));
            actions.append(previous, next, element('span', 'ac-cartel-pos', `${Math.min(featuredIndex, featured.length - 1) + 1} de ${featured.length}`));
        }
        text.append(list, actions);
        billboard.append(cover, text);
    }

    function renderFilters() {
        const byQuery = selectAcervo(laws, { query: state.query, issuer: state.issuer });
        for (const group of TYPE_FILTERS) {
            const button = filterButtons.get(group.id);
            const count = group.id === 'all' ? byQuery.length : byQuery.filter(law => inGroup(law, group.id)).length;
            button.setAttribute('aria-pressed', String(state.group === group.id));
            button.querySelector('.ac-filter-count').textContent = String(count);
            button.hidden = !count && group.id !== 'all' && group.id !== state.group;
        }
        const shown = TYPE_FILTERS.filter(group => !filterButtons.get(group.id).hidden);
        typeSelect.replaceChildren(...shown.map(group => {
            const option = element('option', '', group.id === 'all' ? 'Todos los tipos' : `${group.label} (${filterButtons.get(group.id).querySelector('.ac-filter-count').textContent})`);
            option.value = group.id;
            return option;
        }));
        typeSelect.value = state.group;
        typeBox.classList.toggle('is-on', state.group !== 'all');
        const byType = selectAcervo(laws, { query: state.query, group: state.group });
        const options = acervoIssuers(byType);
        const entries = [{ id: 'all', text: 'Todas las dependencias' }, ...options.map(item => ({ id: item.id, text: `${item.label} (${item.count})` }))];
        if (state.issuer !== 'all' && !options.some(item => item.id === state.issuer)) {
            entries.push({ id: state.issuer, text: `${ISSUERS.find(item => item.id === state.issuer).label} (0)` });
        }
        issuerSelect.replaceChildren(...entries.map(entry => { const option = element('option', '', entry.text); option.value = entry.id; return option; }));
        issuerSelect.value = state.issuer;
        issuerBox.classList.toggle('is-on', state.issuer !== 'all');
    }

    function statusText(count) {
        const parts = [countLabel(count)];
        const group = TYPE_FILTERS.find(item => item.id === state.group && item.id !== 'all');
        const issuer = ISSUERS.find(item => item.id === state.issuer);
        if (group) parts.push(`en ${group.label}`);
        if (issuer) parts.push(`de ${issuer.short}`);
        if (state.query.trim()) parts.push(`para «${state.query.trim()}»`);
        return `${parts.join(' ')}.`;
    }

    function renderBody() {
        captureRows(); rowBindings = [];
        const reels = acervoReels(laws, state);
        const filtered = state.group !== 'all' || state.issuer !== 'all' || Boolean(state.query.trim());
        renderFilters();
        clear.hidden = !state.query;
        root.classList.toggle('is-home', !filtered && laws.length > 0);
        featured = state.query.trim() ? [] : reels.featured;
        renderBillboard();
        status.textContent = statusText(reels.items.length);
        statusRow.hidden = !filtered && reels.items.length > 0;
        reset.hidden = !filtered;
        sortBox.hidden = reels.layout !== 'grid' || !reels.items.length;
        body.replaceChildren();
        if (!reels.items.length) {
            const empty = element('div', 'ac-empty');
            empty.append(element('h2', '', laws.length ? 'No encontramos documentos' : 'El acervo está vacío'), element('p', '', laws.length ? 'Prueba otras siglas, un tema o quita algún filtro.' : 'Los documentos aparecerán aquí cuando el acervo esté disponible.'));
            if (laws.length) {
                const resetAll = element('button', 'bu-btn bu-btn-primario ac-reset', 'Ver todo el acervo'); resetAll.type = 'button';
                resetAll.addEventListener('click', () => { searchInput.value = ''; applyFilter({ query: '', group: 'all', issuer: 'all' }); searchInput.focus(); });
                empty.append(resetAll);
            }
            body.append(empty);
        } else if (reels.layout === 'rows') {
            reels.rows.forEach(reel => body.append(renderRow(reel)));
        } else {
            const list = element('ul', 'ac-results-grid'); list.setAttribute('aria-label', 'Documentos encontrados');
            reels.items.forEach(law => { const item = element('li'); item.append(makeCard(law)); list.append(item); });
            body.append(list);
        }
        scheduleRows({ restore: true });
    }

    // ---------- events ----------
    searchForm.addEventListener('submit', event => event.preventDefault());
    searchInput.addEventListener('input', () => { state.query = searchInput.value; renderBody(); notify(); });
    clear.addEventListener('click', () => { searchInput.value = ''; applyFilter({ query: '' }); searchInput.focus(); });
    sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; renderBody(); notify(); });
    issuerSelect.addEventListener('change', () => applyFilter({ issuer: issuerSelect.value }));
    typeSelect.addEventListener('change', () => applyFilter({ group: typeSelect.value }));
    reset.addEventListener('click', () => { searchInput.value = ''; applyFilter({ query: '', group: 'all', issuer: 'all' }); });
    filters.addEventListener('click', event => {
        const button = event.target.closest('button[data-group]');
        if (button) applyFilter({ group: button.dataset.group });
    });
    const resize = () => scheduleRows();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null;
    observer?.observe(root);
    window.addEventListener('resize', resize);
    const api = {
        captureState,
        destroy() {
            if (destroyed) return;
            captureRows(); destroyed = true;
            observer?.disconnect(); window.removeEventListener('resize', resize);
            if (frame !== null) cancelFrame(frame);
            if (mountedViews.get(container) === api) { mountedViews.delete(container); container.replaceChildren(); }
        },
    };
    mountedViews.set(container, api);
    renderBody();
    return api;
}
