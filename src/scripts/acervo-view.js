import { ACERVO_GROUPS, getAcervoGroup, selectAcervo, groupAcervo } from '../lib/acervo-model.js';
import '../styles/acervo.css';

const mountedViews = new WeakMap();
let nextViewId = 0;
const number = value => new Intl.NumberFormat('es-MX').format(value);
const countLabel = count => `${number(count)} ${count === 1 ? 'instrumento' : 'instrumentos'}`;
const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
};

function publicationDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
    const day = value.slice(0, 10);
    const date = new Date(`${day}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === day ? new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date) : null;
}

/** A presentational library. Navigation and persistence remain owned by the app. */
export function renderAcervoView(container, summaries, { state: initialState = {}, onStateChange = () => {}, onOpenLaw = () => {} } = {}) {
    if (!container || typeof container.replaceChildren !== 'function') throw new Error('Falta el contenedor del acervo.');
    mountedViews.get(container)?.destroy();
    const laws = selectAcervo(Array.isArray(summaries) ? summaries : []);
    const state = {
        query: typeof initialState.query === 'string' ? initialState.query.slice(0, 500) : '',
        group: initialState.group === 'all' || ACERVO_GROUPS.some(group => group.id === initialState.group) ? initialState.group : 'all',
        sort: ['title', 'date-newest', 'date-oldest'].includes(initialState.sort) ? initialState.sort : 'title',
        rowScroll: {},
        scrollY: Math.max(0, Number(initialState.scrollY) || 0),
    };
    for (const group of ACERVO_GROUPS) {
        const offset = initialState.rowScroll?.[group.id];
        if (Number.isFinite(offset) && offset >= 0) state.rowScroll[group.id] = offset;
    }
    const id = `acervo-${++nextViewId}`;
    const root = element('section', 'ac-library');
    root.setAttribute('aria-labelledby', `${id}-title`);
    const header = element('header', 'ac-header');
    const titleBlock = element('div', 'ac-title-block');
    titleBlock.append(element('p', 'ac-eyebrow', 'Biblioteca normativa'));
    const title = element('h1', '', 'Acervo regulatorio'); title.id = `${id}-title`;
    titleBlock.append(title, element('p', 'ac-intro', 'Encuentra el instrumento que necesitas y explora su contenido.'));
    const total = element('p', 'ac-total', countLabel(laws.length));
    header.append(titleBlock, total);

    const tools = element('div', 'ac-tools');
    const searchForm = element('form', 'ac-search-form');
    searchForm.setAttribute('role', 'search'); searchForm.setAttribute('aria-label', 'Buscar instrumentos en el acervo');
    const searchLabel = element('label', 'ac-label', 'Buscar en el acervo'); searchLabel.htmlFor = `${id}-search`;
    const searchBox = element('div', 'ac-search-box');
    const searchIcon = element('span', 'ac-search-icon'); searchIcon.setAttribute('aria-hidden', 'true');
    searchIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg>';
    const searchInput = element('input'); searchInput.type = 'search'; searchInput.id = `${id}-search`; searchInput.maxLength = 500; searchInput.autocomplete = 'off'; searchInput.placeholder = 'Instrumento, siglas o tema'; searchInput.value = state.query;
    const clear = element('button', 'ac-clear', '×'); clear.type = 'button'; clear.setAttribute('aria-label', 'Limpiar búsqueda');
    searchBox.append(searchIcon, searchInput, clear); searchForm.append(searchLabel, searchBox);
    const sortLabel = element('label', 'ac-sort-label'); sortLabel.append(element('span', 'ac-label', 'Ordenar por'));
    const sortSelect = element('select'); sortSelect.setAttribute('aria-label', 'Ordenar instrumentos');
    for (const [value, text] of [['title', 'Título'], ['date-newest', 'Más recientes'], ['date-oldest', 'Más antiguos']]) {
        const option = element('option', '', text); option.value = value; option.selected = value === state.sort; sortSelect.append(option);
    }
    sortLabel.append(sortSelect); tools.append(searchForm, sortLabel);
    const filters = element('div', 'ac-filters'); filters.setAttribute('role', 'group'); filters.setAttribute('aria-label', 'Tipo de instrumento');
    const groups = [{ id: 'all', label: 'Todos' }, ...ACERVO_GROUPS];
    const filterButtons = new Map();
    for (const group of groups) {
        const button = element('button', 'ac-filter'); button.type = 'button'; button.dataset.group = group.id;
        button.append(element('span', '', group.label), element('span', 'ac-filter-count'));
        filters.append(button); filterButtons.set(group.id, button);
    }
    const status = element('p', 'ac-result-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
    const body = element('div', 'ac-collections');
    root.append(header, tools, filters, status, body);
    container.replaceChildren(root);
    let destroyed = false;
    let frame = null;
    let restoreRowsOnFrame = false;
    let rowBindings = [];
    const requestFrame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : callback => setTimeout(callback, 0);
    const cancelFrame = typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : clearTimeout;

    function captureRows() {
        for (const { row, groupId, restored } of rowBindings) if (restored) state.rowScroll[groupId] = Math.max(0, row.scrollLeft);
    }

    function captureState() {
        captureRows();
        state.scrollY = Math.max(0, Number(window.scrollY) || 0);
        return { ...state, rowScroll: { ...state.rowScroll } };
    }

    function notify() { if (!destroyed) onStateChange(captureState()); }

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
                    binding.row.scrollLeft = state.rowScroll[binding.groupId] || 0;
                    binding.restored = true;
                }
                restoreRowsOnFrame = false;
            }
            updateRows();
        });
    }

    function makeCard(law) {
        const card = element('button', 'ac-card'); card.type = 'button'; card.dataset.lawId = law.id;
        const title = law.titulo || 'Instrumento sin título';
        card.title = title; card.setAttribute('aria-label', `Abrir ${title}`);
        const groupId = getAcervoGroup(law);
        card.dataset.category = groupId;
        const category = element('span', 'ac-card-category', law.tipo || ACERVO_GROUPS.find(group => group.id === groupId)?.label || 'Instrumento');
        category.title = category.textContent;
        const acronym = element('span', 'ac-card-acronym', law.siglas || 'Sin siglas');
        acronym.title = acronym.textContent;
        const cardTitle = element('span', 'ac-card-title', title);
        const metadata = element('span', 'ac-card-meta');
        const date = publicationDate(law.fecha_publicacion);
        const dateNode = element(date ? 'time' : 'span', '', date || 'Fecha no disponible');
        if (date) { dateNode.dateTime = law.fecha_publicacion; dateNode.title = `Fecha de publicación: ${date}`; }
        const rawCount = law.articulos;
        const fragments = typeof rawCount === 'number' && Number.isFinite(rawCount) && rawCount >= 0 ? `${number(rawCount)} ${rawCount === 1 ? 'fragmento' : 'fragmentos'}` : 'Sin conteo';
        metadata.append(dateNode, element('span', '', fragments));
        const action = element('span', 'ac-card-action', 'Consultar');
        const arrow = element('span', '', '↗'); arrow.setAttribute('aria-hidden', 'true'); action.append(arrow);
        card.append(category, acronym, cardTitle, metadata, action);
        card.addEventListener('click', () => { const snapshot = captureState(); onStateChange(snapshot); onOpenLaw(law, snapshot); });
        return card;
    }

    function renderGroup(group) {
        const section = element('section', 'ac-group'); section.setAttribute('aria-labelledby', `${id}-${group.id}`);
        const groupHeader = element('div', 'ac-group-header');
        const heading = element('h2', '', group.label); heading.id = `${id}-${group.id}`;
        heading.append(element('span', 'ac-group-count', String(group.items.length)));
        const all = element('button', 'ac-see-all', 'Ver todos'); all.type = 'button'; all.setAttribute('aria-label', `Ver todos: ${group.label}`);
        all.addEventListener('click', () => {
            captureRows(); state.group = group.id; renderBody(); notify();
            filterButtons.get(group.id)?.focus({ preventScroll: true });
        });
        groupHeader.append(heading, all);
        const row = element('ul', 'ac-row'); row.dataset.group = group.id;
        row.setAttribute('aria-label', `${group.label}: ${countLabel(group.items.length)}`);
        group.items.forEach(law => { const item = element('li'); item.append(makeCard(law)); row.append(item); });
        const rowFooter = element('div', 'ac-row-footer');
        rowFooter.append(element('span', 'ac-row-hint', 'Desliza o usa las flechas'));
        const arrows = element('div', 'ac-row-arrows');
        const previous = element('button', 'ac-arrow', '←'); previous.type = 'button'; previous.setAttribute('aria-label', `Anteriores en ${group.label}`); previous.setAttribute('aria-controls', `${id}-${group.id}-row`);
        const next = element('button', 'ac-arrow', '→'); next.type = 'button'; next.setAttribute('aria-label', `Siguientes en ${group.label}`); next.setAttribute('aria-controls', `${id}-${group.id}-row`);
        row.id = `${id}-${group.id}-row`;
        const move = direction => {
            const cardWidth = row.firstElementChild?.getBoundingClientRect().width || Math.max(200, row.clientWidth * .85);
            const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (typeof row.scrollBy === 'function') row.scrollBy({ left: direction * (cardWidth + 14), behavior: reduced ? 'auto' : 'smooth' });
            else row.scrollLeft += direction * (cardWidth + 14);
            state.rowScroll[group.id] = row.scrollLeft; updateRows(); notify();
        };
        previous.addEventListener('click', () => move(-1)); next.addEventListener('click', () => move(1));
        row.addEventListener('scroll', () => { if (!destroyed) { state.rowScroll[group.id] = row.scrollLeft; updateRows(); notify(); } }, { passive: true });
        row.addEventListener('focusin', event => event.target.closest('.ac-card')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'auto' }));
        arrows.append(previous, next); rowFooter.append(arrows);
        section.append(groupHeader, row, rowFooter);
        rowBindings.push({ row, groupId: group.id, previous, next, restored: false });
        return section;
    }

    function renderBody() {
        captureRows(); rowBindings = [];
        const selected = selectAcervo(laws, state);
        const queryMatches = selectAcervo(laws, { query: state.query, sort: state.sort });
        for (const group of groups) {
            const button = filterButtons.get(group.id);
            const count = group.id === 'all' ? queryMatches.length : queryMatches.filter(law => getAcervoGroup(law) === group.id).length;
            button.setAttribute('aria-pressed', String(state.group === group.id));
            button.querySelector('.ac-filter-count').textContent = String(count);
        }
        clear.hidden = !state.query;
        const grouped = !state.query.trim() && state.group === 'all';
        body.replaceChildren();
        const groupLabel = ACERVO_GROUPS.find(group => group.id === state.group)?.label;
        status.textContent = grouped ? `${countLabel(selected.length)} para explorar por tipo de instrumento.` : `${countLabel(selected.length)}${groupLabel ? ` en ${groupLabel}` : ''}${state.query.trim() ? ` para «${state.query.trim()}»` : ''}.`;
        if (!selected.length) {
            const empty = element('div', 'ac-empty');
            empty.append(element('h2', '', laws.length ? 'No encontramos instrumentos' : 'El acervo está vacío'), element('p', '', laws.length ? 'Prueba otras siglas, un tema o un título más corto.' : 'Los instrumentos aparecerán aquí cuando el acervo esté disponible.'));
            if (laws.length) {
                const reset = element('button', 'ac-reset', 'Ver todo el acervo'); reset.type = 'button';
                reset.addEventListener('click', () => { state.query = ''; state.group = 'all'; searchInput.value = ''; renderBody(); notify(); searchInput.focus(); });
                empty.append(reset);
            }
            body.append(empty);
        } else if (grouped) {
            groupAcervo(selected).filter(group => group.items.length).forEach(group => body.append(renderGroup(group)));
        } else {
            const list = element('ul', 'ac-results-grid'); list.setAttribute('aria-label', 'Instrumentos encontrados');
            selected.forEach(law => { const item = element('li'); item.append(makeCard(law)); list.append(item); });
            body.append(list);
        }
        scheduleRows({ restore: true });
    }

    searchForm.addEventListener('submit', event => event.preventDefault());
    searchInput.addEventListener('input', () => { state.query = searchInput.value; renderBody(); notify(); });
    clear.addEventListener('click', () => { state.query = ''; searchInput.value = ''; renderBody(); notify(); searchInput.focus(); });
    sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; renderBody(); notify(); });
    filters.addEventListener('click', event => {
        const button = event.target.closest('button[data-group]');
        if (!button) return;
        state.group = button.dataset.group; renderBody(); notify();
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
