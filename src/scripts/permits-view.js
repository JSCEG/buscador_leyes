/**
 * Permisos CNE (#permisos): search the Comisión Nacional de Energía public registry and read a
 * permit's card — data and status, its resolutions in order, annexes and the acervo instruments
 * that regulate it. Data comes live from the registry (src/lib/cne-api.js).
 */
import { pinButtonHtml } from './desk-view.js';
import { permitPinId, searchPermits, fetchResolutions, fetchAnnexes, permitPdfUrl, resolutionPdfUrl, annexUrl, permitKind, REGISTRY_URL } from '../lib/cne-api.js';
import '../styles/permits.css';

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const fold = value => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const PAGE = 20;
const ESTADO_TONE = { 'Operando': 'ok', 'Por iniciar operaciones': 'info', 'En Construcción': 'info', 'Por iniciar obras': 'info' };
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const dateLabel = value => {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value || '').trim());
    return m ? `${Number(m[1])} ${MONTHS[Number(m[2]) - 1]} ${m[3]}` : '';
};
const number = n => Number(n || 0).toLocaleString('es-MX');
const plural = (n, one, many) => `${number(n)} ${Number(n) === 1 ? one : many}`;
const LAW_TITLES = { LSE: 'ley del sector electrico', LSH: 'ley del sector hidrocarburos', LCNE: 'ley de la comision nacional de energia' };

export function renderPermitsView(container, catalog = [], { onOpenLaw = () => {}, permit = null, onRoute = () => {} } = {}) {
    const state = { numero: '', titular: '', proyecto: '', start: 0 };
    let rows = [];
    let total = 0;
    let request = 0;
    let alive = true;

    const root = document.createElement('section');
    root.className = 'pm-view';
    root.setAttribute('aria-labelledby', 'pm-title');
    root.innerHTML = `
        <div class="pm-head">
            <p class="pm-eyebrow">Registro público · Comisión Nacional de Energía</p>
            <h1 id="pm-title">Permisos CNE</h1>
            <p class="pm-intro">Consulta un permiso, su estado, las resoluciones que lo otorgan o modifican y sus anexos, junto con la normativa del acervo que lo regula.</p>
        </div>
        <form class="pm-form" role="search" novalidate>
            <label><span>Número de permiso</span><input name="numero" placeholder="Ej. E/1439/GEN/2015" autocomplete="off"></label>
            <label><span>Titular</span><input name="titular" placeholder="Razón social" autocomplete="off"></label>
            <label><span>Proyecto</span><input name="proyecto" placeholder="Nombre o alias" autocomplete="off"></label>
            <div class="pm-form-actions">
                <button type="submit" class="pm-btn pm-btn-primary">Buscar</button>
                <button type="reset" class="pm-btn">Limpiar</button>
            </div>
        </form>
        <p class="pm-status" role="status" aria-live="polite"></p>
        <div class="pm-body"></div>
        <p class="pm-source">Fuente: <a href="${REGISTRY_URL}" target="_blank" rel="noopener">Registro Público de la CNE</a>. La información se consulta en vivo y puede cambiar; para efectos legales, consulta el documento oficial.</p>`;
    container.replaceChildren(root);

    const form = root.querySelector('.pm-form');
    const status = root.querySelector('.pm-status');
    const body = root.querySelector('.pm-body');

    const skeleton = n => `<div class="pm-list">${'<div class="pm-card pm-skel"><i></i><i></i><i></i></div>'.repeat(n)}</div>`;
    const failure = what => `
        <div class="pm-error">
            <p><strong>No pudimos consultar ${what}.</strong> El registro de la CNE no respondió; intenta de nuevo en un momento.</p>
            <a class="pm-btn" href="${REGISTRY_URL}" target="_blank" rel="noopener">Abrir el registro de la CNE</a>
        </div>`;

    function estadoChip(estado) {
        return estado ? `<span class="pm-estado is-${ESTADO_TONE[estado] || 'off'}">${esc(estado)}</span>` : '';
    }

    function card(row) {
        const { sector, activity } = permitKind(row.Numero);
        return `
            <li><button type="button" class="pm-card" data-permit="${esc(row.PermisoId)}" data-sector="${sector?.id || 'otro'}">
                <span class="pm-card-top"><span class="pm-num">${esc(row.Numero)}</span>${estadoChip(row.Estado)}</span>
                <span class="pm-holder">${esc(row.Persona || 'Titular sin dato')}</span>
                ${row.AliasProyecto ? `<span class="pm-alias">${esc(row.AliasProyecto)}</span>` : ''}
                <span class="pm-meta">
                    ${sector ? `<span class="pm-tag">${esc(sector.label)}${activity ? ` · ${esc(activity)}` : ''}</span>` : ''}
                    <span>${plural(row.ResolucionesAsociadas, 'resolución', 'resoluciones')}</span>
                    ${row.AnexosAsociados ? `<span>${plural(row.AnexosAsociados, 'anexo', 'anexos')}</span>` : ''}
                </span>
            </button>
            <span class="pm-card-tools">${pinButtonHtml(permitPinId(row.Numero), { compact: true })}<a class="pm-card-pdf" href="${permitPdfUrl(row.PermisoId)}" target="_blank" rel="noopener" aria-label="Título de permiso ${esc(row.Numero)} en PDF" title="Título de permiso (PDF)">PDF</a></span></li>`;
    }

    function drawList() {
        if (!rows.length) {
            status.textContent = '';
            body.innerHTML = '<p class="pm-empty">Ningún permiso coincide con la búsqueda. Revisa el número o prueba con una parte del nombre del titular.</p>';
            return;
        }
        const from = state.start + 1;
        const to = state.start + rows.length;
        status.textContent = `${number(from)}–${number(to)} de ${plural(total, 'permiso', 'permisos')}`;
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
        status.textContent = 'Consultando el registro de la CNE…';
        try {
            const result = await searchPermits({ ...state, length: PAGE });
            if (!alive || id !== request) return;
            rows = result.rows;
            total = result.total;
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
        return sector.laws.map(siglas => summaries.find(law => fold(law.siglas) === fold(siglas))
            || (LAW_TITLES[siglas] && summaries.find(law => fold(law.titulo).startsWith(LAW_TITLES[siglas]))))
            .filter((law, i, list) => law && list.indexOf(law) === i);
    }

    async function showPermit(row, { updateRoute = true } = {}) {
        if (updateRoute) onRoute(row.Numero);
        const { sector, activity } = permitKind(row.Numero);
        const laws = lawsFor(sector);
        status.textContent = '';
        body.innerHTML = `
            <article class="pm-detail" data-sector="${sector?.id || 'otro'}" aria-labelledby="pm-detail-title">
                <button type="button" class="pm-back">← Volver a los resultados</button>
                <div class="pm-detail-head">
                    <div class="pm-card-top"><span class="pm-num">${sector ? `${esc(sector.label)}${activity ? ` · ${esc(activity)}` : ''}` : 'Permiso'}</span>${estadoChip(row.Estado)}</div>
                    <h2 id="pm-detail-title">${esc(row.Numero)}</h2>
                    <p class="pm-holder">${esc(row.Persona || 'Titular sin dato')}</p>
                    ${row.AliasProyecto ? `<p class="pm-alias">${esc(row.AliasProyecto)}</p>` : ''}
                    <div class="pm-actions">
                        <a class="pm-btn pm-btn-primary" href="${permitPdfUrl(row.PermisoId)}" target="_blank" rel="noopener">Ver título de permiso (PDF)</a>
                        ${pinButtonHtml(permitPinId(row.Numero))}
                        <button type="button" class="pm-btn pm-share">Copiar enlace</button>
                    </div>
                </div>
                <dl class="pm-facts">
                    <div><dt>Expediente</dt><dd>${esc(row.NumeroExpediente || '—')}</dd></div>
                    <div><dt>Último acuse</dt><dd>${esc(dateLabel(row.FechaAcuse) || '—')}</dd></div>
                    <div><dt>Resoluciones</dt><dd>${number(row.ResolucionesAsociadas)}</dd></div>
                    <div><dt>Oficios</dt><dd>${number(row.OficiosAsociados)}</dd></div>
                    <div><dt>Acuerdos</dt><dd>${number(row.AcuerdosAsociados)}</dd></div>
                    <div><dt>Anexos</dt><dd>${number(row.AnexosAsociados)}</dd></div>
                </dl>
                <section class="pm-section" aria-labelledby="pm-res-title">
                    <h3 id="pm-res-title">Línea de resoluciones</h3>
                    <div class="pm-res">${skeleton(2)}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-anx-title">
                    <h3 id="pm-anx-title">Anexos</h3>
                    <div class="pm-anx">${row.AnexosAsociados ? skeleton(1) : '<p class="pm-note">Este permiso no tiene anexos publicados.</p>'}</div>
                </section>
                <section class="pm-section" aria-labelledby="pm-law-title">
                    <h3 id="pm-law-title">Marco aplicable</h3>
                    ${laws.length ? `<p class="pm-note">Normativa del acervo que regula esta actividad (orientativo, según el tipo de permiso).</p>
                    <div class="pm-laws">${laws.map(law => `<button type="button" class="pm-law" data-law="${esc(law.id)}"><b>${esc(law.siglas || '')}</b><span>${esc(law.titulo)}</span></button>`).join('')}</div>`
                    : '<p class="pm-note">No identificamos la normativa aplicable a partir del número de este permiso.</p>'}
                </section>
            </article>`;
        // The card starts where the results were, below the search form.
        body.scrollIntoView({ behavior: 'smooth', block: 'start' });

        const resHost = body.querySelector('.pm-res');
        fetchResolutions(row.ExpedienteId).then(list => {
            if (!alive || !resHost.isConnected) return;
            resHost.innerHTML = list.length ? `<ol class="pm-timeline">${list.map((res, i) => {
                const pdf = resolutionPdfUrl(res.REsolucionId);
                return `
                <li class="${i === 0 ? 'is-first' : ''}">
                    <time>${esc(dateLabel(res.FechaResolucion) || 'Sin fecha')}</time>
                    <div>
                        <p class="pm-res-type">${esc(res.TipoResolucion || 'Resolución')}</p>
                        <p class="pm-res-meta"><b>${esc(res.NumeroResolucion || '')}</b>${res.Acta ? ` · Acta ${esc(res.Acta)}` : ''}${res.Modalidad ? ` · ${esc(res.Modalidad)}` : ''}</p>
                        ${pdf ? `<a class="pm-res-pdf" href="${esc(pdf)}" target="_blank" rel="noopener" aria-label="Ver resolución ${esc(res.NumeroResolucion || '')} en PDF"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/></svg>Ver resolución (PDF)</a>` : ''}
                    </div>
                </li>`;
            }).join('')}</ol>`
                : '<p class="pm-note">El registro no muestra resoluciones para este expediente.</p>';
        }).catch(() => { if (resHost.isConnected) resHost.innerHTML = failure('las resoluciones'); });

        if (row.AnexosAsociados) {
            const anxHost = body.querySelector('.pm-anx');
            fetchAnnexes(row.PermisoId).then(list => {
                if (!alive || !anxHost.isConnected) return;
                anxHost.innerHTML = list.length ? `<ul class="pm-annexes">${list.map(annex => {
                    const url = annexUrl(annex);
                    const label = esc(annex.Descripcion || 'Anexo');
                    return `<li>${url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${label}</a>` : `<span>${label}</span><small>Sin archivo público</small>`}</li>`;
                }).join('')}</ul>` : '<p class="pm-note">Este permiso no tiene anexos publicados.</p>';
            }).catch(() => { if (anxHost.isConnected) anxHost.innerHTML = failure('los anexos'); });
        }

        body.querySelector('.pm-back').addEventListener('click', () => {
            onRoute(null);
            if (rows.length) drawList(); else load();
        });
        body.querySelector('.pm-share').addEventListener('click', event => {
            const url = `${location.origin}${location.pathname}#permiso=${encodeURIComponent(row.Numero)}`;
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
            const result = await searchPermits({ numero, length: 10 });
            if (!alive || id !== request) return;
            const match = result.rows.find(row => fold(row.Numero) === fold(numero)) || (result.rows.length === 1 ? result.rows[0] : null);
            if (match) { rows = []; showPermit(match, { updateRoute: false }); return; }
            form.numero.value = numero;
            state.numero = numero;
            rows = result.rows;
            total = result.total;
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
            proyecto: form.proyecto.value.trim(),
            start: 0,
        });
        onRoute(null);
        load();
    });
    form.addEventListener('reset', () => {
        Object.assign(state, { numero: '', titular: '', proyecto: '', start: 0 });
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
        const row = cardButton && rows.find(item => String(item.PermisoId) === cardButton.dataset.permit);
        if (row) showPermit(row);
    });

    if (permit) openByNumber(permit); else load();
    return {
        openPermit: numero => openByNumber(numero),
        showList: () => { if (rows.length) drawList(); else load(); },
        destroy: () => { alive = false; root.remove(); },
    };
}
