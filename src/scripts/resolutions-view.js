/**
 * Resoluciones tab of the CNE section (#resoluciones, #resolucion=<number>): search the CNE
 * resolutions (https://www.cne.gob.mx/Resoluciones/) and read one — its proemio, PDF, the permits
 * it mentions and its legal foundation, with each cited article linked to the acervo when we have it.
 */
import {
    searchResolutions, fetchResolution, resolutionPdfUrl, parseFoundation, permitNumbersIn, permitsHash, RESOLUTIONS_URL,
} from '../lib/cne-api.js';
import { getArticleIdsByNumber } from './search-engine.js';
import { esc, number, plural, dateLabel, skeleton, failure as failureFor, lawByCitedName, PDF_ICON } from './cne-shared.js';

const PAGE = 20;
const failure = what => failureFor(what, RESOLUTIONS_URL);
const TYPES = ['Otorgamiento de permiso', 'Modificación de permiso', 'Terminación de permiso', 'Transferencia de permiso', 'Negativa permiso',
    'Revocación de permiso', 'Sanción', 'Visitas de verificación', 'Regulación', 'Autorización de tarifas', 'Recursos de reconsideración', 'Varios'];
const MODES = ['Electricidad', 'Energía eléctrica', 'Hidrocarburos', 'Petrolíferos', 'Gas natural', 'Gas licuado de petróleo', 'Mercados de Hidrocarburos', 'Otros'];
const FIRST_YEAR = 1995;

export function renderResolutionsView(container, catalog = [], { resolution = null, onRoute = () => {} } = {}) {
    const state = { numero: '', texto: '', fecha: '', tipo: '', modalidad: '', start: 0 };
    let rows = [];
    let total = 0;
    let request = 0;
    let alive = true;
    const summaries = () => (typeof catalog === 'function' ? catalog() || [] : catalog);
    const thisYear = new Date().getFullYear();
    const years = Array.from({ length: thisYear - FIRST_YEAR + 1 }, (_, i) => thisYear - i);

    const root = document.createElement('div');
    root.className = 'pm-panel';
    root.innerHTML = `
        <form class="pm-form pm-form-res" role="search" novalidate>
            <label><span>Número</span><input name="numero" placeholder="Ej. RES/062/2026" autocomplete="off"></label>
            <label class="pm-wide"><span>Texto de la resolución</span><input name="texto" placeholder="Titular, número de permiso o tema" autocomplete="off"></label>
            <label><span>Año</span><select name="fecha"><option value="">Todos</option>${years.map(y => `<option>${y}</option>`).join('')}</select></label>
            <label><span>Tipo</span><input name="tipo" list="pm-res-types" placeholder="Todos" autocomplete="off"></label>
            <label><span>Modalidad</span><input name="modalidad" list="pm-res-modes" placeholder="Todas" autocomplete="off"></label>
            <datalist id="pm-res-types">${TYPES.map(t => `<option value="${esc(t)}">`).join('')}</datalist>
            <datalist id="pm-res-modes">${MODES.map(t => `<option value="${esc(t)}">`).join('')}</datalist>
            <div class="pm-form-actions">
                <button type="submit" class="pm-btn pm-btn-primary">Buscar</button>
                <button type="reset" class="pm-btn">Limpiar</button>
            </div>
        </form>
        <p class="pm-status" role="status" aria-live="polite"></p>
        <div class="pm-body"></div>
        <p class="pm-source">Fuente: <a href="${RESOLUTIONS_URL}" target="_blank" rel="noopener">Resoluciones de la CNE</a>. La información se consulta en vivo; para efectos legales, consulta el documento oficial.</p>`;
    container.replaceChildren(root);

    const form = root.querySelector('form');
    const status = root.querySelector('.pm-status');
    const body = root.querySelector('.pm-body');

    function card(row) {
        return `
            <li><button type="button" class="pm-card pm-res-card" data-resolution="${esc(row.NumeroResolucion)}" data-sector="${sectorOf(row.ModalidadResolucion)}">
                <span class="pm-card-top"><span class="pm-num">${esc(row.NumeroResolucion)}</span><span class="pm-date">${esc(dateLabel(row.FechaResolucion))}</span></span>
                <span class="pm-holder pm-res-title">${esc(row.TipoResolucion || 'Resolución')}</span>
                <span class="pm-alias">${esc(row.Proemio || '')}</span>
                <span class="pm-meta">${row.ModalidadResolucion ? `<span class="pm-tag">${esc(row.ModalidadResolucion)}</span>` : ''}${row.NumeroActa ? `<span>${esc(row.NumeroActa)}</span>` : ''}</span>
            </button>
            <span class="pm-card-tools"><a class="pm-card-pdf" href="${esc(resolutionPdfUrl(row.ResolucionId))}" target="_blank" rel="noopener" aria-label="Resolución ${esc(row.NumeroResolucion)} en PDF" title="Resolución (PDF)">PDF</a></span></li>`;
    }

    function drawList() {
        if (!rows.length) {
            status.textContent = '';
            body.innerHTML = '<p class="pm-empty">Ninguna resolución coincide. Prueba con menos filtros o con una parte del texto.</p>';
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
            const result = await searchResolutions(state, { start: state.start, length: PAGE });
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

    function foundationHtml(text) {
        const groups = parseFoundation(text);
        if (!groups.length) return text ? `<p class="pm-note">${esc(text)}</p>` : '<p class="pm-note">La CNE no publica la fundamentación de esta resolución.</p>';
        return `<ul class="pm-found">${groups.map((group, i) => {
            const law = lawByCitedName(summaries(), group.law);
            return `<li data-found="${i}" ${law ? `data-law-id="${esc(law.id)}"` : ''}>
                <p class="pm-found-law">${law ? `<b>${esc(law.siglas || '')}</b> ` : ''}${esc(group.law)}${law ? '' : ' <small>(no está en el acervo)</small>'}</p>
                <p class="pm-found-arts">${group.articles.map(n => `<span class="pm-art" data-art="${esc(n)}">Art. ${esc(n)}</span>`).join('')}</p>
            </li>`;
        }).join('')}</ul>
        <details class="pm-found-text"><summary>Texto completo de la fundamentación</summary><p>${esc(text)}</p></details>`;
    }

    /** Turns the cited articles that exist in the acervo into links. */
    async function linkFoundation(host, text) {
        const groups = parseFoundation(text);
        await Promise.all(groups.map(async (group, i) => {
            const item = host.querySelector(`[data-found="${i}"][data-law-id]`);
            if (!item) return;
            const ids = await getArticleIdsByNumber(item.dataset.lawId, group.articles);
            if (!alive || !item.isConnected) return;
            item.querySelectorAll('[data-art]').forEach(span => {
                const id = ids[span.dataset.art];
                if (!id) return;
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'pm-art is-linked';
                button.dataset.article = id;
                button.textContent = span.textContent;
                button.title = 'Abrir el artículo';
                span.replaceWith(button);
            });
        }));
    }

    function showResolution(row, { updateRoute = true } = {}) {
        if (updateRoute) onRoute(row.NumeroResolucion);
        const permits = permitNumbersIn(row.Proemio);
        const pdf = resolutionPdfUrl(row.ResolucionId);
        status.textContent = '';
        body.innerHTML = `
            <article class="pm-detail" data-sector="${sectorOf(row.ModalidadResolucion)}" aria-labelledby="pm-res-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${esc(row.TipoResolucion || 'Resolución')}${row.ModalidadResolucion ? ` · ${esc(row.ModalidadResolucion)}` : ''}</span><span class="pm-date">${esc(dateLabel(row.FechaResolucion))}</span></div>
                    <h2 id="pm-res-detail-title">${esc(row.NumeroResolucion)}</h2>
                    <p class="pm-proemio">${esc(row.Proemio || '')}</p>
                    <div class="pm-actions">
                        ${pdf ? `<a class="pm-btn pm-btn-primary" href="${esc(pdf)}" target="_blank" rel="noopener">${PDF_ICON}Ver resolución (PDF)</a>` : ''}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts pm-facts-3">
                    <div><dt>Fecha</dt><dd>${esc(dateLabel(row.FechaResolucion) || '—')}</dd></div>
                    <div><dt>Sesión</dt><dd>${esc(row.NumeroActa || '—')}</dd></div>
                    ${row.Ponente ? `<div><dt>Ponente</dt><dd>${esc(row.Ponente)}</dd></div>` : ''}
                </dl>
                ${permits.length ? `<section class="pm-section" aria-labelledby="pm-res-permits">
                    <h3 id="pm-res-permits">Permisos que menciona</h3>
                    <div class="pm-laws">${permits.map(n => `<a class="pm-law" href="${permitsHash({ permit: n })}"><b>Permiso</b><span>${esc(n)}</span></a>`).join('')}</div>
                </section>` : ''}
                <section class="pm-section" aria-labelledby="pm-res-found">
                    <h3 id="pm-res-found">Fundamento legal</h3>
                    <p class="pm-note">Artículos que cita la resolución. Los que están en el acervo se pueden abrir.</p>
                    <div class="pm-found-host">${foundationHtml(row.Fundamentacion || '')}</div>
                </section>
            </article>`;
        body.scrollIntoView({ behavior: 'smooth', block: 'start' });
        linkFoundation(body.querySelector('.pm-found-host'), row.Fundamentacion || '').catch(() => {});

        body.querySelector('.pm-back').addEventListener('click', () => {
            onRoute(null);
            if (rows.length) drawList(); else load();
        });
        body.querySelector('.pm-share').addEventListener('click', event => {
            const url = `${location.origin}${location.pathname}${permitsHash({ resolution: row.NumeroResolucion })}`;
            navigator.clipboard?.writeText(url).then(() => { event.target.textContent = 'Enlace copiado'; }, () => {});
        });
    }

    async function openByNumber(numero) {
        const id = ++request;
        body.innerHTML = skeleton(2);
        status.textContent = 'Buscando la resolución…';
        try {
            const row = await fetchResolution(numero);
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

    form.addEventListener('submit', event => {
        event.preventDefault();
        Object.assign(state, {
            numero: form.numero.value.trim(), texto: form.texto.value.trim(), fecha: form.fecha.value,
            tipo: form.tipo.value.trim(), modalidad: form.modalidad.value.trim(), start: 0,
        });
        onRoute(null);
        load();
    });
    form.addEventListener('reset', () => {
        Object.assign(state, { numero: '', texto: '', fecha: '', tipo: '', modalidad: '', start: 0 });
        onRoute(null);
        setTimeout(load);
    });
    body.addEventListener('click', event => {
        const article = event.target.closest('[data-article]');
        if (article) {
            document.dispatchEvent(new CustomEvent('analisis:openArticle', { detail: { id: article.dataset.article, list: [article.dataset.article] } }));
            return;
        }
        const pageButton = event.target.closest('[data-page]');
        if (pageButton) {
            state.start = Math.max(0, state.start + Number(pageButton.dataset.page) * PAGE);
            load().then(() => root.scrollIntoView({ behavior: 'smooth', block: 'start' }));
            return;
        }
        const cardButton = event.target.closest('[data-resolution]');
        const row = cardButton && rows.find(item => item.NumeroResolucion === cardButton.dataset.resolution);
        if (row) showResolution(row);
    });

    if (resolution) openByNumber(resolution); else load();
    return {
        openResolution: numero => openByNumber(numero),
        showList: () => { if (rows.length) drawList(); else load(); },
        destroy: () => { alive = false; root.remove(); },
    };
}

/** Colour family of a resolution from its modality text. */
function sectorOf(modalidad = '') {
    const text = modalidad.toLowerCase();
    if (/el[eé]ctric/.test(text)) return 'electricidad';
    if (/licuado/.test(text)) return 'gaslp';
    if (/gas natural/.test(text)) return 'gasnatural';
    if (/petrol|hidrocarb/.test(text)) return 'petroliferos';
    return 'otro';
}
