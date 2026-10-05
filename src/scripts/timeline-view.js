/**
 * General timeline: every instrument in the acervo by publication date, grouped by year, coloured
 * by the issuing authority, with filters by authority, collection and text.
 */
import { ACERVO_GROUPS, getAcervoGroup } from '../lib/acervo-model.js';
import { ISSUERS, issuerOf } from '../lib/issuer.js';
import { shortTitle } from '../lib/short-title.js';
import { PLANNING_FILTER, isPlanning } from '../lib/planning.js';
import '../styles/timeline.css';

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const fold = value => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const dayLabel = iso => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : 'Sin fecha';
};
const groupLabel = id => ACERVO_GROUPS.find(group => group.id === id)?.label || 'Otros';

export function renderTimelineView(container, summaries = [], { onOpenLaw = () => {} } = {}) {
    const items = summaries
        .map(law => {
            const name = shortTitle(law.titulo) || law.titulo || 'Instrumento sin título';
            return { law, name, full: law.titulo || '', day: String(law.fecha_publicacion || '').slice(0, 10), issuer: issuerOf(law), group: getAcervoGroup(law) };
        })
        .map(item => ({ ...item, haystack: fold(`${item.name} ${item.full} ${item.law.siglas || ''} ${item.issuer.label} ${item.issuer.short}`) }));
    const years = items.map(item => item.day.slice(0, 4)).filter(Boolean).sort();
    const range = years.length ? (years[0] === years.at(-1) ? years[0] : `${years[0]}–${years.at(-1)}`) : '';
    const issuerCounts = new Map();
    for (const item of items) issuerCounts.set(item.issuer.id, (issuerCounts.get(item.issuer.id) || 0) + 1);
    const presentIssuers = ISSUERS.filter(issuer => issuerCounts.has(issuer.id));
    const presentGroups = ACERVO_GROUPS.filter(group => items.some(item => item.group === group.id));
    const state = { issuers: new Set(), group: 'all', query: '', newest: true };

    const root = document.createElement('section');
    root.className = 'tl-view';
    root.setAttribute('aria-labelledby', 'tl-title');
    root.innerHTML = `
        <div class="tl-head">
            <p class="tl-eyebrow">Acervo · cronología</p>
            <h1 id="tl-title">Línea del tiempo <span>${esc(range)}</span></h1>
            <p class="tl-intro">Todo lo publicado en el acervo, en orden cronológico. El color indica la dependencia que lo emite.</p>
        </div>
        <div class="tl-controls">
            <label class="tl-search"><span class="sr-only">Buscar en la línea del tiempo</span>
                <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                <input type="search" placeholder="Buscar por nombre, siglas o dependencia" autocomplete="off"></label>
            <select class="tl-group" aria-label="Colección"><option value="all">Todas las colecciones</option>${presentGroups.map(group => `<option value="${group.id}">${esc(group.label)}</option>`).join('')}${items.some(item => isPlanning(item.law)) ? `<option value="${PLANNING_FILTER.id}">${PLANNING_FILTER.label} (planes y programas)</option>` : ''}</select>
            <button type="button" class="tl-order" aria-pressed="true">Más recientes primero</button>
        </div>
        <div class="tl-issuers" role="group" aria-label="Filtrar por dependencia">
            <button type="button" class="tl-chip is-on" data-issuer="all">Todas <span>${items.length}</span></button>
            ${presentIssuers.map(issuer => `<button type="button" class="tl-chip" data-issuer="${issuer.id}" style="--dep:${issuer.color}" aria-pressed="false" title="${esc(issuer.label)}"><i></i>${esc(issuer.short)} <span>${issuerCounts.get(issuer.id)}</span></button>`).join('')}
        </div>
        <p class="tl-status" role="status" aria-live="polite"></p>
        <div class="tl-body"></div>`;
    container.replaceChildren(root);

    const body = root.querySelector('.tl-body');
    const status = root.querySelector('.tl-status');
    const visible = new Map();

    function draw() {
        const terms = fold(state.query).split(/\s+/).filter(Boolean);
        const rows = items
            .filter(item => !state.issuers.size || state.issuers.has(item.issuer.id))
            .filter(item => state.group === 'all' || (state.group === PLANNING_FILTER.id ? isPlanning(item.law) : item.group === state.group))
            .filter(item => terms.every(term => item.haystack.includes(term)))
            .sort((a, b) => (state.newest ? -1 : 1) * a.day.localeCompare(b.day) || a.name.localeCompare(b.name, 'es'));
        visible.clear();
        rows.forEach(item => visible.set(String(item.law.id), item.law));
        status.textContent = rows.length === items.length ? `${rows.length} instrumentos` : `${rows.length} de ${items.length} instrumentos`;
        if (!rows.length) {
            body.innerHTML = '<p class="tl-empty">Ningún instrumento coincide con estos filtros.</p>';
            return;
        }
        const byYear = new Map();
        for (const item of rows) {
            const year = item.day.slice(0, 4) || 'Sin fecha';
            if (!byYear.has(year)) byYear.set(year, []);
            byYear.get(year).push(item);
        }
        body.innerHTML = [...byYear].map(([year, list]) => `
            <section class="tl-year" aria-label="${esc(year)}">
                <h2 class="tl-year-head">${esc(year)} <span>${list.length} ${list.length === 1 ? 'instrumento' : 'instrumentos'}</span></h2>
                <ol class="tl-list">${list.map(item => `
                    <li class="tl-item" style="--dep:${item.issuer.color}">
                        <time class="tl-date" datetime="${esc(item.day)}">${esc(dayLabel(item.day))}</time>
                        <button type="button" class="tl-main" data-law="${esc(item.law.id)}">
                            <span class="tl-name">${esc(item.name)}</span>
                            <span class="tl-meta"><span class="tl-dep"><i></i>${esc(item.issuer.short)}</span><span>${esc(groupLabel(item.group))}</span>${item.law.siglas ? `<span class="tl-sig">${esc(item.law.siglas)}</span>` : ''}</span>
                        </button>
                        <p class="tl-desc">${esc(item.full !== item.name ? item.full : item.issuer.label)}</p>
                    </li>`).join('')}
                </ol>
            </section>`).join('');
    }

    root.querySelector('.tl-search input').addEventListener('input', event => { state.query = event.target.value; draw(); });
    root.querySelector('.tl-group').addEventListener('change', event => { state.group = event.target.value; draw(); });
    const order = root.querySelector('.tl-order');
    order.addEventListener('click', () => {
        state.newest = !state.newest;
        order.textContent = state.newest ? 'Más recientes primero' : 'Más antiguos primero';
        order.setAttribute('aria-pressed', String(state.newest));
        draw();
    });
    root.querySelector('.tl-issuers').addEventListener('click', event => {
        const chip = event.target.closest('[data-issuer]');
        if (!chip) return;
        const id = chip.dataset.issuer;
        if (id === 'all') state.issuers.clear();
        else if (state.issuers.has(id)) state.issuers.delete(id);
        else state.issuers.add(id);
        root.querySelectorAll('.tl-chip').forEach(button => {
            const on = button.dataset.issuer === 'all' ? !state.issuers.size : state.issuers.has(button.dataset.issuer);
            button.classList.toggle('is-on', on);
            button.setAttribute('aria-pressed', String(on));
        });
        draw();
    });
    body.addEventListener('click', event => {
        const button = event.target.closest('[data-law]');
        const law = button && visible.get(button.dataset.law);
        if (law) onOpenLaw(law);
    });
    draw();
    return { destroy: () => root.remove() };
}
