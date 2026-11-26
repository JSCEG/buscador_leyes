/**
 * Resoluciones tab of the CNE section (#resoluciones, #resolucion=<number>): the CNE resolutions from Azure
 * (dbo.Resoluciones_CNE through /api/permisos/resoluciones*, src/lib/resoluciones-api.js), newest first, and
 * one resolution's card — type, modality, date, session, PDF and the permits it touches. The CNE site is
 * never called live. The proemio and the legal foundation are not in this load, so they are not shown.
 */
import { emptyState } from '../lib/empty-art.js';
import { permitsHash, RESOLUTIONS_URL } from '../lib/cne-api.js';
import { buscarResoluciones, resolucionPorNumero, fechaLabel } from '../lib/resoluciones-api.js';
import { esc, number, plural, skeleton, failure as failureFor, PDF_ICON, guideLinkHtml } from './cne-shared.js';
import { tramiteForResolution } from '../data/tramites.js';

const PAGE = 20;
const failure = what => failureFor(what, RESOLUTIONS_URL);
// Values exactly as dbo.Resoluciones_CNE writes them (the filters match the whole value).
export const TYPES = ['Otorgamiento de permiso', 'Modificación de permiso', 'Transferencia de permiso', 'Terminación de permiso', 'Revocación de permiso',
    'Negativa permiso', 'Sanción', 'Visitas de verificación', 'Regulación', 'Autorización de tarifas', 'Recursos de reconsideración', 'Acreditación', 'Varios'];
export const MODES = ['Electricidad', 'Energía eléctrica', 'Petrolíferos', 'Gas licuado de petróleo', 'Gas natural', 'Hidrocarburos'];
const FIRST_YEAR = 1994;

/** Body of «Ninguna resolución coincide». */
export function noResultsHint(numero = '') {
    return String(numero).trim()
        ? 'Revisa el número (por ejemplo, CNE/RES/1133/2026) o búscalo como texto.'
        : 'Prueba con menos filtros o con otra palabra.';
}

/** The session: a link when its acta has a PDF, plain text otherwise. */
export function actaHtml(row) {
    if (!row.acta) return '—';
    return row.ligaActa ? `<a href="${esc(row.ligaActa)}" target="_blank" rel="noopener">${esc(row.acta)}</a>` : esc(row.acta);
}

export function renderResolutionsView(container, catalog = [], { resolution = null, filters = null, onRoute = () => {} } = {}) {
    const state = { numero: '', texto: '', fecha: '', tipo: '', modalidad: '', acta: '', start: 0 };
    let rows = [];
    let total = 0;
    let request = 0;
    let alive = true;
    const thisYear = new Date().getFullYear();
    const years = Array.from({ length: thisYear - FIRST_YEAR + 1 }, (_, i) => thisYear - i);
    const options = (list, all) => `<option value="">${all}</option>${list.map(v => `<option>${esc(v)}</option>`).join('')}`;

    const root = document.createElement('div');
    root.className = 'pm-panel';
    root.innerHTML = `
        <form class="pm-form pm-form-res" role="search" novalidate>
            <label><span>Número</span><input name="numero" placeholder="Ej. CNE/RES/1133/2026" autocomplete="off"></label>
            <label class="pm-wide"><span>Texto</span><input name="texto" placeholder="Número, tipo, modalidad, acta o mercado" autocomplete="off"></label>
            <label><span>Año</span><select name="fecha">${options(years, 'Todos')}</select></label>
            <label><span>Tipo</span><select name="tipo">${options(TYPES, 'Todos')}</select></label>
            <label><span>Modalidad</span><select name="modalidad">${options(MODES, 'Todas')}</select></label>
            <div class="pm-form-actions">
                <button type="submit" class="pm-btn pm-btn-primary">Buscar</button>
                <button type="reset" class="pm-btn">Limpiar</button>
            </div>
        </form>
        <p class="pm-status" role="status" aria-live="polite"></p>
        <div class="pm-body"></div>
        <p class="pm-source">Fuente: <a href="${RESOLUTIONS_URL}" target="_blank" rel="noopener">Resoluciones de la CNE</a>, en la copia que se actualiza cada semana. Para efectos legales, consulta el documento oficial en PDF.</p>`;
    container.replaceChildren(root);

    const form = root.querySelector('form');
    const status = root.querySelector('.pm-status');
    const body = root.querySelector('.pm-body');

    function card(row) {
        return `
            <li><button type="button" class="pm-card pm-res-card" data-resolution="${esc(row.numero)}" data-sector="${sectorOf(row.modalidad)}">
                <span class="pm-card-top"><span class="pm-num">${esc(row.numero)}</span><span class="pm-date">${esc(fechaLabel(row.fecha))}</span></span>
                <span class="pm-holder pm-res-title">${esc(row.tipo || 'Resolución')}</span>
                <span class="pm-meta">${row.modalidad ? `<span class="pm-tag">${esc(row.modalidad)}</span>` : ''}${row.acta ? `<span>${esc(row.acta)}</span>` : ''}</span>
            </button>
            ${row.ligaResolucion ? `<span class="pm-card-tools"><a class="pm-card-pdf" href="${esc(row.ligaResolucion)}" target="_blank" rel="noopener" aria-label="Resolución ${esc(row.numero)} en PDF" title="Resolución (PDF)">PDF</a></span>` : ''}</li>`;
    }

    function drawList() {
        if (!rows.length) {
            status.textContent = '';
            body.innerHTML = emptyState({ title: 'Ninguna resolución coincide', body: noResultsHint(state.numero) });
            return;
        }
        const to = state.start + rows.length;
        status.textContent = `${number(state.start + 1)}–${number(to)} de ${plural(total, 'resolución', 'resoluciones')} · más recientes primero`;
        body.innerHTML = `
            <ul class="pm-list">${rows.map(card).join('')}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${state.start ? '' : 'disabled'}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${to < total ? '' : 'disabled'}>Siguientes →</button>
            </nav>`;
    }

    async function load() {
        const id = ++request;
        body.innerHTML = skeleton(6);
        status.textContent = 'Consultando las resoluciones de la CNE…';
        try {
            const result = await buscarResoluciones(state, { start: state.start, pageSize: PAGE });
            if (!alive || id !== request) return;
            rows = result.rows;
            total = result.total;
            drawList();
        } catch {
            if (!alive || id !== request) return;
            status.textContent = '';
            body.innerHTML = failure('las resoluciones');
        }
    }

    function showResolution(row, { updateRoute = true } = {}) {
        if (updateRoute) onRoute(row.numero);
        const guide = tramiteForResolution({ ModalidadResolucion: row.modalidad || '' });
        status.textContent = '';
        body.innerHTML = `
            <article class="pm-detail" data-sector="${sectorOf(row.modalidad)}" aria-labelledby="pm-res-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${esc(row.tipo || 'Resolución')}${row.modalidad ? ` · ${esc(row.modalidad)}` : ''}</span><span class="pm-date">${esc(fechaLabel(row.fecha))}</span></div>
                    <h2 id="pm-res-detail-title">${esc(row.numero)}</h2>
                    <div class="pm-actions">
                        ${row.ligaResolucion ? `<a class="pm-btn pm-btn-primary" href="${esc(row.ligaResolucion)}" target="_blank" rel="noopener">${PDF_ICON}Ver resolución (PDF)</a>` : ''}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts pm-facts-3">
                    <div><dt>Fecha</dt><dd>${esc(fechaLabel(row.fecha) || '—')}</dd></div>
                    <div><dt>Sesión</dt><dd>${actaHtml(row)}</dd></div>
                    <div><dt>Mercado</dt><dd>${esc(row.mercado || '—')}</dd></div>
                </dl>
                <p class="pm-note">El proemio y el fundamento legal no están en la base de Azure: consúltalos en el PDF de la resolución.</p>
                <section class="pm-section" aria-labelledby="pm-res-permits">
                    <h3 id="pm-res-permits">Permisos de esta resolución</h3>
                    <div class="pm-res-permits">${row.permisos.length
                        ? `<div class="pm-laws">${row.permisos.map(p => `<a class="pm-law" href="${permitsHash({ permit: p.numero })}"><b>Permiso</b><span>${esc(p.numero)}</span></a>`).join('')}</div>`
                        : '<p class="pm-note">Sin permisos asociados en el registro.</p>'}</div>
                </section>
                ${guide ? `<section class="pm-section" aria-labelledby="pm-res-guide"><h3 id="pm-res-guide">Guía</h3>${guideLinkHtml(guide, 'Guía de este tipo de trámite')}</section>` : ''}
            </article>`;
        body.scrollIntoView({ behavior: 'smooth', block: 'start' });

        body.querySelector('.pm-back').addEventListener('click', () => {
            onRoute(null);
            if (rows.length) drawList(); else load();
        });
        body.querySelector('.pm-share').addEventListener('click', event => {
            const url = `${location.origin}${location.pathname}${permitsHash({ resolution: row.numero })}`;
            navigator.clipboard?.writeText(url).then(() => { event.target.textContent = 'Enlace copiado'; }, () => {});
        });
    }

    /** The card of a list row: asks the full record, which brings the permits. */
    async function openRow(row) {
        showResolution(row);
        try {
            const full = await resolucionPorNumero(row.numero);
            if (alive && full && body.querySelector('#pm-res-detail-title')?.textContent === row.numero) showResolution(full, { updateRoute: false });
        } catch { /* the card keeps the row's data */ }
    }

    async function openByNumber(numero) {
        const id = ++request;
        body.innerHTML = skeleton(2);
        status.textContent = 'Buscando la resolución…';
        try {
            const row = await resolucionPorNumero(numero);
            if (!alive || id !== request) return;
            if (row) { rows = []; showResolution(row, { updateRoute: false }); return; }
            form.numero.value = numero;
            state.numero = numero;
            load();
        } catch {
            if (!alive || id !== request) return;
            status.textContent = '';
            body.innerHTML = failure('la resolución');
        }
    }

    const FIELDS = ['numero', 'texto', 'fecha', 'tipo', 'modalidad'];
    form.addEventListener('submit', event => {
        event.preventDefault();
        Object.assign(state, Object.fromEntries(FIELDS.map(key => [key, form[key].value.trim()])), { acta: '', start: 0 });
        onRoute(null);
        load();
    });
    form.addEventListener('reset', () => {
        Object.assign(state, { numero: '', texto: '', fecha: '', tipo: '', modalidad: '', acta: '', start: 0 });
        onRoute(null);
        setTimeout(load);
    });
    body.addEventListener('click', event => {
        const pageButton = event.target.closest('[data-page]');
        if (pageButton) {
            state.start = Math.max(0, state.start + Number(pageButton.dataset.page) * PAGE);
            load().then(() => root.scrollIntoView({ behavior: 'smooth', block: 'start' }));
            return;
        }
        const cardButton = event.target.closest('[data-resolution]');
        const row = cardButton && rows.find(item => item.numero === cardButton.dataset.resolution);
        if (row) openRow(row);
    });

    /** Runs a search with the given filters (e.g. from a panorama chart) and shows them in the form. */
    function applyFilters(next = {}) {
        Object.assign(state, { numero: '', texto: '', fecha: '', tipo: '', modalidad: '', acta: '', ...next, start: 0 });
        for (const key of FIELDS) {
            const field = form[key];
            // A value the select does not list (an older type) still filters: it is added as an option.
            if (field.tagName === 'SELECT' && state[key] && ![...field.options].some(o => o.value === state[key])) field.add(new Option(state[key], state[key]));
            field.value = state[key] || '';
        }
        load();
    }

    if (resolution) openByNumber(resolution); else if (filters && Object.keys(filters).length) applyFilters(filters); else load();
    return {
        openResolution: numero => openByNumber(numero),
        applyFilters,
        showList: () => { if (rows.length) drawList(); else load(); },
        destroy: () => { alive = false; root.remove(); },
    };
}

/** Colour family of a resolution from its modality text. */
function sectorOf(modalidad = '') {
    const text = String(modalidad || '').toLowerCase();
    if (/el[eé]ctric/.test(text)) return 'electricidad';
    if (/licuado/.test(text)) return 'gaslp';
    if (/gas natural/.test(text)) return 'gasnatural';
    if (/petrol|hidrocarb/.test(text)) return 'petroliferos';
    return 'otro';
}
