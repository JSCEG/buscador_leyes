/**
 * Permisos CNE (#permisos): search the CNE permits and read a permit's card — data and status, the official
 * PDFs of its title and resolutions, and the acervo instruments that regulate it. Data comes from the Azure
 * tables the permits bot updates every week (src/lib/permisos-mapa.js): /api/permisos/* first, /api/mapa/* as
 * the fallback. The CNE registry is never called live (since 26/11/2026 it requires reCAPTCHA).
 */
import { loadTechIndex, permitType, techOf, typeTile } from '../lib/permit-type.js';
import { emptyState } from '../lib/empty-art.js';
import { pinButtonHtml } from './desk-view.js';
import { tramiteForPermit } from '../data/tramites.js';
import { permitPinId, permitsHash, permitKind, REGISTRY_URL } from '../lib/cne-api.js';
import { SOURCES, SOURCE, getPermisos, stateLabel, marketLabel, statusLabel, localDate, detailFields } from '../lib/permisos-api.js';
import { resolucionesDePermiso, fechaLabel } from '../lib/resoluciones-api.js';
import { actaHtml } from './resolutions-view.js';
import { buscarPermisos, ligasDePermiso, numeroNorm, https as safeHttps } from '../lib/permisos-mapa.js';
import { esc, number, plural, skeleton, failure as failureFor, lawBySiglas, PDF_ICON, guideLinkHtml } from './cne-shared.js';

const PAGE = 20;
const TECH_WAIT_MS = 1500;
const CNE_SOURCES = SOURCES.filter(s => s.autoridad === 'CNE');
const failure = what => failureFor(what, REGISTRY_URL);
const ESTADO_TONE = { Vigente: 'ok', Operando: 'ok', 'Por iniciar operaciones': 'info', 'En Construcción': 'info', 'Por iniciar obras': 'info' };

export function renderPermitsView(container, catalog = [], { onOpenLaw = () => {}, permit = null, onRoute = () => {} } = {}) {
    const state = { numero: '', titular: '', tabla: '', estatus: '', start: 0 };
    let rows = [];
    let total = 0;
    let recientes = null;
    let request = 0;
    let alive = true;

    const root = document.createElement('div');
    root.className = 'pm-panel';
    root.innerHTML = `
        <form class="pm-form" role="search" novalidate>
            <label><span>Número de permiso</span><input name="numero" placeholder="Ej. E/1439/GEN/2015" autocomplete="off"></label>
            <label><span>Razón social</span><input name="titular" placeholder="Ej. Eólica Cerritos" autocomplete="off"></label>
            <label><span>Actividad</span><select name="tabla"><option value="">Todas las actividades CNE</option>${CNE_SOURCES.map(s => `<option value="${esc(s.key)}">${esc(s.label)}</option>`).join('')}</select></label>
            <label><span>Estatus</span><select name="estatus"><option value="">Todos</option><option value="Vigente">Vigente</option><option value="No vigente">No vigente</option></select></label>
            <div class="pm-form-actions">
                <button type="submit" class="pm-btn pm-btn-primary">Buscar</button>
                <button type="reset" class="pm-btn">Limpiar</button>
            </div>
        </form>
        <p class="pm-status" role="status" aria-live="polite"></p>
        <div class="pm-body"></div>
        <p class="pm-source">Fuente: <a href="${REGISTRY_URL}" target="_blank" rel="noopener">Registro Público de la CNE</a>, en la copia que se actualiza cada semana. Para efectos legales, consulta el documento oficial en PDF.</p>`;
    container.replaceChildren(root);

    const form = root.querySelector('.pm-form');
    const status = root.querySelector('.pm-status');
    const body = root.querySelector('.pm-body');

    // Cards wait a moment for the technologies; without them the tile reads the code of the number.
    let techIndex = null;
    const waitForTechIndex = async () => {
        techIndex ??= await Promise.race([loadTechIndex(), new Promise(resolve => setTimeout(() => resolve(null), TECH_WAIT_MS))]);
    };

    const rowKey = row => `${row.tabla || 'cne'}:${row.id || row.numero}`;
    const pdfTool = (url, numero) => `<a class="pm-card-pdf" href="${esc(url)}" target="_blank" rel="noopener" aria-label="Título de permiso ${esc(numero)} en PDF" title="Título de permiso (PDF)">PDF</a>`;

    function estadoChip(estado) {
        return estado ? `<span class="pm-estado is-${ESTADO_TONE[estado] || 'off'}">${esc(estado)}</span>` : '';
    }

    function card(row) {
        const type = permitType(row.numero, { technology: techOf(techIndex, row.numero) });
        const { sector, activity } = permitKind(row.numero);
        const pdf = safeHttps(row.ligaPermiso) || safeHttps(row.fuenteUrl);
        const entidad = row.efId && row.efId !== '--' ? stateLabel(row.efId, row.entidad) : (row.entidad || '');
        const fuente = SOURCE[row.tabla]?.label || marketLabel(row);
        return `
            <li><button type="button" class="pm-card" data-permit="${esc(rowKey(row))}" data-sector="${sector?.id || 'otro'}">
                <span class="pm-card-top"><span class="pm-num">${esc(row.numero)}</span>${estadoChip(row.estatus || row.estatusFuente)}</span>
                <span class="pm-tipo">${typeTile(type)}<span class="pm-tipo-t">${esc(row.tipo || type.label)}</span></span>
                <span class="pm-holder">${esc(row.razonSocial || 'Titular sin dato')}</span>
                <span class="pm-meta">
                    ${sector ? `<span class="pm-tag">${esc(sector.label)}${activity ? ` · ${esc(activity)}` : ''}</span>` : fuente ? `<span class="pm-tag">${esc(fuente)}</span>` : ''}
                    ${entidad ? `<span>${esc(entidad)}</span>` : ''}
                    ${resCount(row.resCount)}
                </span>
            </button>
            <span class="pm-card-tools">${pinButtonHtml(permitPinId(row.numero), { compact: true })}${pdf ? pdfTool(pdf, row.numero) : ''}</span></li>`;
    }

    function drawList() {
        if (!rows.length && recientes) {
            status.textContent = '';
            body.innerHTML = emptyState({ title: 'Sin permisos recientes con estos filtros', body: 'Busca por número de permiso o por razón social (mínimo 2 caracteres).' });
            return;
        }
        if (!rows.length) {
            status.textContent = '';
            body.innerHTML = emptyState({ title: 'Ningún permiso coincide', body: 'Revisa el número o prueba con una parte de la razón social (mínimo 2 caracteres).' });
            return;
        }
        const from = state.start + 1;
        const to = state.start + rows.length;
        status.textContent = `${recientes ? 'Últimos permisos otorgados · ' : ''}${number(from)}–${number(to)} de ${plural(total, 'permiso', 'permisos')}`;
        body.innerHTML = `
            <ul class="pm-list">${rows.map(card).join('')}</ul>
            <nav class="pm-pager" aria-label="Páginas de resultados">
                <button type="button" class="pm-btn" data-page="-1" ${state.start ? '' : 'disabled'}>← Anteriores</button>
                <button type="button" class="pm-btn" data-page="1" ${to < total ? '' : 'disabled'}>Siguientes →</button>
            </nav>`;
        llenarLigas();
    }

    // Each card counts its resolutions in Azure (dbo.Resoluciones_Permisos_CNE; Ligas_Permisos_CNE when that fails)
    // and, when the row lacks it (the /api/mapa fallback), asks Ligas_Permisos_CNE for the title PDF.
    // Only the visible page; the answers stay on the row for redraws.
    const resCount = n => (Number.isInteger(n) ? `<span class="pm-res-count">${plural(n, 'resolución', 'resoluciones')}</span>` : '');
    const cardOf = row => [...body.querySelectorAll('[data-permit]')].find(b => b.dataset.permit === rowKey(row))?.closest('li');
    function llenarLigas() {
        const pagina = rows;
        for (const row of pagina.filter(r => r.numero && r.resCount === undefined)) {
            row.resCount = null;
            const sinPdf = !safeHttps(row.ligaPermiso) && !safeHttps(row.fuenteUrl);
            const ligas = sinPdf ? ligasDePermiso(row.numero) : null;
            resolucionesDePermiso(row.numero).then(list => list.length, () => ligas || ligasDePermiso(row.numero).then(l => (l.encontrado ? l.resoluciones.length : null)))
                .then(n => {
                    row.resCount = n;
                    if (alive && rows === pagina && Number.isInteger(n)) cardOf(row)?.querySelector('.pm-meta')?.insertAdjacentHTML('beforeend', resCount(n));
                }).catch(() => { row.resCount = undefined; });
            ligas?.then(l => {
                if (!l.ligaPermiso || !alive || rows !== pagina) return;
                row.ligaPermiso = l.ligaPermiso;
                cardOf(row)?.querySelector('.pm-card-tools')?.insertAdjacentHTML('beforeend', pdfTool(l.ligaPermiso, row.numero));
            }).catch(() => {});
        }
    }

    async function load() {
        const id = ++request;
        body.innerHTML = skeleton(6);
        status.textContent = 'Consultando los permisos de la CNE…';
        try {
            const [result] = await Promise.all([buscarPermisos({ ...state, pageSize: PAGE }), waitForTechIndex()]);
            if (!alive || id !== request) return;
            rows = result.rows;
            total = result.total;
            recientes = result.recientes || null;
            drawList();
        } catch {
            if (!alive || id !== request) return;
            status.textContent = '';
            body.innerHTML = failure('los permisos');
        }
    }

    function lawsFor(sector) {
        if (!sector) return [];
        // The catalogue may still be loading when the view opens, so it is read on demand.
        const summaries = typeof catalog === 'function' ? catalog() || [] : catalog;
        return sector.laws.map(siglas => lawBySiglas(summaries, siglas))
            .filter((law, i, list) => law && list.indexOf(law) === i);
    }

    async function showPermit(row, { updateRoute = true } = {}) {
        if (updateRoute) onRoute(row.numero);
        const { sector, activity } = permitKind(row.numero);
        const laws = lawsFor(sector);
        const guide = tramiteForPermit(row.numero);
        const pdfInicial = safeHttps(row.ligaPermiso) || safeHttps(row.fuenteUrl);
        const entidad = row.efId && row.efId !== '--' ? stateLabel(row.efId, row.entidad) : (row.entidad || '');
        const lugar = [entidad, row.municipio].filter(Boolean).join(' · ');
        status.textContent = '';
        body.innerHTML = `
            <article class="pm-detail" data-sector="${sector?.id || 'otro'}" aria-labelledby="pm-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${sector ? `${esc(sector.label)}${activity ? ` · ${esc(activity)}` : ''}` : esc(SOURCE[row.tabla]?.label || 'Permiso')}</span>${estadoChip(row.estatus || row.estatusFuente)}</div>
                    <h2 id="pm-detail-title">${esc(row.numero)}</h2>
                    <p class="pm-holder">${esc(row.razonSocial || 'Titular sin dato')}</p>
                    ${row.tipo ? `<p class="pm-alias">${esc(row.tipo)}</p>` : ''}
                    <div class="pm-actions">
                        <a class="pm-btn pm-btn-primary" data-pdf-link href="${esc(pdfInicial || '#')}" target="_blank" rel="noopener"${pdfInicial ? '' : ' hidden'}>Ver título de permiso (PDF)</a>
                        ${pinButtonHtml(permitPinId(row.numero))}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                        <a class="pm-btn" href="${permitsHash({ mapPermit: row.numero })}" data-map-link${row.coordenadasValidas ? '' : ' hidden'}><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>Ver en el mapa</a>
                    </div>
                </div>
                <dl class="pm-facts" data-facts>
                    <div><dt>Actividad</dt><dd>${esc(SOURCE[row.tabla]?.label || '—')}</dd></div>
                    <div><dt>Mercado</dt><dd>${esc(marketLabel(row) || '—')}</dd></div>
                    <div><dt>Ubicación</dt><dd>${esc(lugar || '—')}</dd></div>
                    <div><dt>Estatus</dt><dd>${esc(statusLabel(row) || '—')}</dd></div>
                    <div><dt>Actualización</dt><dd>${esc(localDate(row.fechaActualizacion) || '—')}</dd></div>
                </dl>
                <section class="pm-section" aria-labelledby="pm-res-title">
                    <h3 id="pm-res-title">Resoluciones</h3>
                    <div class="pm-res">${skeleton(2)}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-law-title">
                    <h3 id="pm-law-title">Marco aplicable</h3>
                    ${laws.length ? `<p class="pm-note">Normativa del acervo que regula esta actividad (orientativo, según el tipo de permiso).</p>
                    <div class="pm-laws">${laws.map(law => `<button type="button" class="pm-law" data-law="${esc(law.id)}"><b>${esc(law.siglas || '')}</b><span>${esc(law.titulo)}</span></button>`).join('')}</div>`
                    : '<p class="pm-note">No identificamos la normativa aplicable a partir del número de este permiso.</p>'}
                    ${guide ? guideLinkHtml(guide) : ''}
                </section>
            </article>`;
        // The card starts where the results were, below the search form.
        body.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Full record from Azure (capacity, dates…): only the fields it brings.
        const factsHost = body.querySelector('[data-facts]');
        if (row.tabla && row.numero) {
            getPermisos('detalle', { tabla: row.tabla, numero: row.numero }).then(det => {
                if (!alive || !factsHost.isConnected) return;
                const extra = detailFields(det?.data || det);
                if (extra.length) factsHost.insertAdjacentHTML('beforeend', extra.map(f => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join(''));
            }).catch(() => { /* without the detail the card keeps the fields of the search */ });
        }

        // The resolutions of the permit (dbo.Resoluciones_Permisos_CNE), newest first; the title PDF from
        // Ligas_Permisos_CNE. Without the resolutions table, the numbers and PDFs of Ligas_Permisos_CNE.
        const resHost = body.querySelector('.pm-res');
        const pdfLink = body.querySelector('[data-pdf-link]');
        const ligas = ligasDePermiso(row.numero);
        ligas.then(hit => {
            const tituloPdf = hit.ligaPermiso || pdfInicial;
            if (alive && tituloPdf && pdfLink.isConnected) { pdfLink.href = tituloPdf; pdfLink.hidden = false; }
        }).catch(() => {});
        const pdfHtml = (url, resNum) => (url
            ? `<a class="pm-res-pdf" href="${esc(url)}" target="_blank" rel="noopener" aria-label="Ver resolución ${esc(resNum || '')} en PDF">${PDF_ICON}Ver resolución (PDF)</a>`
            : '<span class="pm-note">PDF aún no publicado</span>');
        const none = '<p class="pm-note">No hay resoluciones registradas para este permiso.</p>';
        resolucionesDePermiso(row.numero).then(list => {
            if (!alive || !resHost.isConnected) return;
            resHost.innerHTML = list.length ? `<ol class="pm-timeline">${list.map((res, i) => `
                <li class="${i === 0 ? 'is-first' : ''}">
                    <time>${esc(fechaLabel(res.fecha) || 'Sin fecha')}</time>
                    <div>
                        <p class="pm-res-type">${esc(res.tipo || 'Resolución')}</p>
                        <p class="pm-res-meta"><b>${esc(res.numero)}</b>${res.acta ? ` · Sesión ${actaHtml(res)}` : ''}${res.modalidad ? ` · ${esc(res.modalidad)}` : ''}</p>
                        <div class="pm-res-links">
                            ${pdfHtml(res.ligaResolucion, res.numero)}
                            <a class="pm-res-more" href="${permitsHash({ resolution: res.numero })}">Detalle</a>
                        </div>
                    </div>
                </li>`).join('')}</ol>` : none;
        }, () => ligas.then(hit => {
            if (!alive || !resHost.isConnected) return;
            const docs = [...hit.resoluciones, { numero: null, liga: hit.ligaResolucion }, { numero: null, liga: safeHttps(row.ligaResolucion) }]
                .filter(d => d.liga || d.numero).reduce((acc, d) => {
                    const previa = d.liga ? acc.find(x => x.liga === d.liga) : null;
                    if (previa) previa.numero ||= d.numero; else acc.push({ ...d });
                    return acc;
                }, []);
            resHost.innerHTML = docs.length ? `<ol class="pm-timeline">${docs.map(({ numero: resNum, liga: url }, i) => `
                <li class="${i === 0 ? 'is-first' : ''}">
                    <div>
                        <p class="pm-res-type">${resNum ? esc(resNum) : 'Resolución'}</p>
                        <div class="pm-res-links">${pdfHtml(url, resNum)}</div>
                    </div>
                </li>`).join('')}</ol>` : none;
        })).catch(() => {
            if (resHost.isConnected) resHost.innerHTML = '<p class="pm-note">No se pudieron cargar las resoluciones de este permiso.</p>';
        });

        // "Ver en el mapa" only when the map has this permit with coordinates.
        const mapLink = body.querySelector('[data-map-link]');
        if (!row.coordenadasValidas) {
            fetch(`/api/mapa/buscar?q=${encodeURIComponent(row.numero)}&limite=5`, { credentials: 'same-origin' })
                .then(response => (response.ok ? response.json() : null))
                .then(data => {
                    const hit = (data?.resultados || []).find(r => numeroNorm(r.numeroPermiso) === numeroNorm(row.numero) && r.latitud != null);
                    if (!alive || !hit || !mapLink.isConnected) return;
                    mapLink.href = permitsHash({ mapPermit: hit.numeroPermiso });
                    mapLink.hidden = false;
                })
                .catch(() => { /* without the map service the card simply has no map link */ });
        }

        body.querySelector('.pm-back').addEventListener('click', () => {
            onRoute(null);
            if (rows.length) drawList(); else load();
        });
        body.querySelector('.pm-share').addEventListener('click', event => {
            const url = `${location.origin}${location.pathname}#permiso=${encodeURIComponent(row.numero)}`;
            navigator.clipboard?.writeText(url).then(() => { event.target.textContent = 'Enlace copiado'; }, () => {});
        });
        body.querySelectorAll('[data-law]').forEach(button => button.addEventListener('click', () => {
            const law = laws.find(item => String(item.id) === button.dataset.law);
            if (law) onOpenLaw(law);
        }));
    }

    /** Opens a permit by its exact number (deep link). */
    async function openByNumber(numero) {
        const id = ++request;
        body.innerHTML = skeleton(2);
        status.textContent = 'Buscando el permiso…';
        try {
            const result = await buscarPermisos({ numero, pageSize: 10 });
            if (!alive || id !== request) return;
            const match = result.rows.find(row => numeroNorm(row.numero) === numeroNorm(numero) || numeroNorm(row.numeroNorm) === numeroNorm(numero))
                || (result.rows.length === 1 ? result.rows[0] : null);
            if (match) { rows = []; showPermit(match, { updateRoute: false }); return; }
            form.numero.value = numero;
            state.numero = numero;
            rows = result.rows;
            total = result.total;
            recientes = result.recientes || null;
            drawList();
        } catch {
            if (!alive || id !== request) return;
            status.textContent = '';
            body.innerHTML = failure('el permiso');
        }
    }

    form.addEventListener('submit', event => {
        event.preventDefault();
        Object.assign(state, {
            numero: form.numero.value.trim(),
            titular: form.titular.value.trim(),
            tabla: form.tabla.value,
            estatus: form.estatus.value,
            start: 0,
        });
        onRoute(null);
        load();
    });
    form.addEventListener('reset', () => {
        Object.assign(state, { numero: '', titular: '', tabla: '', estatus: '', start: 0 });
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
        const cardButton = event.target.closest('[data-permit]');
        const row = cardButton && rows.find(item => rowKey(item) === cardButton.dataset.permit);
        if (row) showPermit(row);
    });

    if (permit) openByNumber(permit); else load();
    return {
        openPermit: numero => openByNumber(numero),
        showList: () => { if (rows.length) drawList(); else load(); },
        destroy: () => { alive = false; root.remove(); },
    };
}
