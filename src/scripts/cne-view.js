/**
 * Permits section: the Comisión Nacional de Energía (permits, resolutions, panorama, trámites and map) and the
 * Secretaría de Energía (its titles and permits), as tabs under one header, grouped by authority. Each tab is its own module; switching
 * back and forth inside the section keeps the open tab instead of rebuilding it.
 */
import { renderPermitsView } from './permits-view.js';
import { renderResolutionsView } from './resolutions-view.js';
import { renderPanoramaView } from './cne-panorama-view.js';
import { renderTramitesView } from './tramites-view.js';
import { permitsHash } from '../lib/cne-api.js';
import '../styles/permits.css';

// Tabs a visitor has not opened yet pulse and say "Nuevo" until they do (remembered per browser).
const SEEN_KEY = 'cne-pestanas-vistas';
const readSeen = () => { try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); } catch { return new Set(); } };
function markSeen(tab) {
    const seen = readSeen();
    if (seen.has(tab)) return;
    seen.add(tab);
    try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seen])); } catch { /* private mode */ }
}

const TABS = [
    { id: 'permisos', group: 'CNE', label: 'Permisos', intro: 'Consulta un permiso, su estado, las resoluciones que lo otorgan o modifican y sus anexos, junto con la normativa del acervo que lo regula.' },
    { id: 'resoluciones', group: 'CNE', label: 'Resoluciones', intro: 'Busca entre las resoluciones de la CNE por número, texto, año, tipo o modalidad, y abre el fundamento legal de cada una en el acervo.' },
    { id: 'panorama', group: 'CNE', label: 'Panorama', intro: 'Lo que la CNE ha resuelto: cifras por año, por tipo y por modalidad, y lo más reciente.' },
    { id: 'tramites', group: 'CNE', label: 'Trámites', intro: 'Guías por tipo de permiso: la normativa que lo regula, sus formatos y convocatorias, los artículos clave y las resoluciones recientes de la CNE.' },
    { id: 'mapa', group: 'CNE', label: 'Mapa', intro: 'Dónde están los permisos de electricidad, petrolíferos, gas LP y gas natural, con su estatus, las ligas a su permiso y resoluciones, y los ciclones activos.' },
    { id: 'sener', group: 'SENER', label: 'Títulos y permisos', intro: 'Títulos y permisos de la Secretaría de Energía: asignaciones, pozos, contratos de exploración y extracción, comercio exterior y biocombustibles, con su fuente oficial.' },
];

const MAP_ICON = '<svg class="bu-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6Z"/><path d="M9 4v14M15 6v14"/></svg>';
// The map, drawn small: a few streets and pins in the colours of its permits.
const MAP_ART = `<svg class="pm-mapa-art" viewBox="0 0 120 80" aria-hidden="true">
    <rect x="1" y="1" width="118" height="78" rx="12" class="pm-mapa-fondo"/>
    <path class="pm-mapa-calle" d="M-2 52c22-6 34 10 58 2s30-24 66-14M30-2c4 24-6 40 4 84M86-2c-6 30 10 50 0 84"/>
    <g class="pm-mapa-pin" style="--c:var(--rojo)"><path d="M36 38c-6 0-10 4-10 9 0 7 10 15 10 15s10-8 10-15c0-5-4-9-10-9Z"/><circle cx="36" cy="47" r="3.4"/></g>
    <g class="pm-mapa-pin" style="--c:var(--col-acuerdos)"><path d="M78 16c-5 0-8 3.5-8 7.5 0 6 8 12.5 8 12.5s8-6.5 8-12.5c0-4-3-7.5-8-7.5Z"/><circle cx="78" cy="23.5" r="2.8"/></g>
    <g class="pm-mapa-pin" style="--c:var(--col-convocatorias)"><path d="M96 46c-4 0-7 3-7 6.5 0 5 7 11 7 11s7-6 7-11c0-3.5-3-6.5-7-6.5Z"/><circle cx="96" cy="52.5" r="2.4"/></g>
</svg>`;

const AUTHORITIES = [
    { id: 'cne', short: 'CNE', name: 'Comisión Nacional de Energía' },
    { id: 'sener', short: 'SENER', name: 'Secretaría de Energía' },
];

/** The authority behind a view, with its acronym and full name. */
export function authorityTag(aut) {
    const authority = AUTHORITIES.find(item => item.id === aut) || AUTHORITIES[0];
    return `<b>${authority.short}</b>${authority.name}`;
}

/**
 * @param {HTMLElement} container
 * @param {() => object[]} catalog acervo summaries (read on demand)
 * @param {{ route: { tab: string, permit?: string, resolution?: string }, onOpenLaw: Function, setHash: (hash: string) => void }} options
 */
export function renderCneView(container, catalog, { route = { tab: 'permisos' }, onOpenLaw = () => {}, setHash = () => {} } = {}) {
    let current = null;
    let currentTab = null;

    const root = document.createElement('section');
    root.className = 'pm-view';
    root.setAttribute('aria-labelledby', 'pm-title');
    root.innerHTML = `
        <div class="pm-head">
            <nav class="bu-seg pm-aut-switch" aria-label="Autoridad">${AUTHORITIES.map(aut => `<a href="${aut.id === 'sener' ? '#sener' : '#permisos'}" data-aut-link="${aut.id}">${aut.short}</a>`).join('')}</nav>
            <p class="pm-autoridad" data-authority></p>
            <h1 id="pm-title">Permisos de energía</h1>
            <p class="pm-intro"></p>
            <nav class="pm-tabs" role="tablist" aria-label="Secciones de permisos">
                ${AUTHORITIES.map(aut => `<div class="pm-tab-grupo" data-aut="${aut.id}"><span class="pm-tab-group" aria-hidden="true">${aut.short}</span>${TABS.filter(tab => tab.group === aut.short).map(tab => `<a role="tab" class="pm-tab${tab.id === 'mapa' ? ' is-destacado' : ''}" id="pm-tab-${tab.id}" href="${permitsHash({ tab: tab.id })}" data-tab="${tab.id}" aria-controls="pm-tabpanel" aria-label="${tab.label} · ${tab.group}">${tab.id === 'mapa' ? MAP_ICON : ''}${tab.label}<span class="pm-tab-new" aria-hidden="true">Nuevo</span></a>`).join('')}</div>`).join('')}
            </nav>
        </div>
        <a class="pm-mapa-promo" href="${permitsHash({ tab: 'mapa' })}">
            ${MAP_ART}
            <span class="pm-mapa-texto"><strong>Ve los permisos en el mapa</strong><span>Centrales, gasolineras, ductos y almacenes, con su estatus y sus resoluciones. Filtra por estado o por tipo.</span></span>
            <span class="bu-btn bu-btn-primario pm-mapa-cta">${MAP_ICON}Abrir el mapa</span>
        </a>
        <div id="pm-tabpanel" class="pm-tabpanel" role="tabpanel"></div>`;
    container.replaceChildren(root);
    const host = root.querySelector('.pm-tabpanel');

    function open(tab, next) {
        current?.destroy();
        currentTab = tab;
        markSeen(tab);
        const seen = readSeen();
        root.querySelectorAll('.pm-tab').forEach(link => {
            const fresh = !seen.has(link.dataset.tab) && link.dataset.tab !== 'permisos';
            link.classList.toggle('is-new', fresh);
            if (fresh) link.setAttribute('aria-description', 'Nueva sección'); else link.removeAttribute('aria-description');
        });
        const info = TABS.find(item => item.id === tab) || TABS[0];
        root.querySelector('.pm-intro').textContent = info.intro;
        root.querySelector('[data-authority]').innerHTML = authorityTag(tab === 'sener' ? 'sener' : 'cne');
        root.classList.toggle('en-sener', tab === 'sener');
        // One authority per page: its own tabs only, and no tab row when there is a single tab.
        const authority = tab === 'sener' ? 'sener' : 'cne';
        root.querySelectorAll('.pm-tab-grupo').forEach(group => { group.hidden = group.dataset.aut !== authority; });
        root.querySelector('.pm-tabs').hidden = TABS.filter(item => item.group === authority.toUpperCase()).length < 2;
        root.querySelectorAll('[data-aut-link]').forEach(link => {
            if (link.dataset.autLink === authority) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
        });
        root.classList.toggle('en-mapa', tab === 'mapa');
        root.querySelector('.pm-mapa-promo').hidden = tab !== 'permisos';
        root.querySelectorAll('.pm-tab').forEach(link => {
            const on = link.dataset.tab === tab;
            link.setAttribute('aria-selected', String(on));
            link.classList.toggle('is-on', on);
        });
        // Over the map the tabs stay in one sliding row: keep the open one in view, with its neighbours showing.
        const row = root.querySelector('.pm-tabs');
        const active = root.querySelector('.pm-tab.is-on');
        if (active) row.scrollLeft += active.getBoundingClientRect().left - row.getBoundingClientRect().left - (row.clientWidth - active.offsetWidth) / 2;
        host.setAttribute('aria-labelledby', `pm-tab-${tab}`);
        if (tab === 'resoluciones') {
            current = renderResolutionsView(host, catalog, {
                resolution: next.resolution || null,
                filters: next.filters || null,
                onRoute: number => setHash(permitsHash({ tab, resolution: number })),
            });
        } else if (tab === 'tramites') {
            current = renderTramitesView(host, catalog, { tramite: next.tramite || null, onOpenLaw });
        } else if (tab === 'panorama') {
            current = renderPanoramaView(host);
        } else if (tab === 'sener') {
            // Like the map, its module (and Leaflet) loads only when the tab opens.
            const pending = {
                destroyed: false,
                view: null,
                record: next.record || null,
                destroy() { this.destroyed = true; this.view?.destroy(); },
                openRecord(record) { if (this.view) this.view.openRecord(record); else this.record = record; },
                showList() { this.record = null; this.view?.showList(); },
            };
            current = pending;
            host.innerHTML = '<p class="pm-loading">Cargando los títulos de la SENER…</p>';
            import('./cne-sener-view.js')
                .then(module => module.renderCneSenerView(host, {
                    catalog,
                    onOpenLaw,
                    record: pending.record,
                    onRoute: record => setHash(permitsHash(record ? { record } : { tab: 'sener' })),
                }))
                .then(view => { if (pending.destroyed) view.destroy(); else pending.view = view; })
                .catch(() => { if (!pending.destroyed) host.innerHTML = '<p class="pm-loading">No se pudo cargar esta sección. Revisa tu conexión e intenta de nuevo.</p>'; });
        } else if (tab === 'mapa') {
            // Leaflet only loads when the map tab opens; until then `current` must still be destroyable.
            const pending = {
                destroyed: false,
                view: null,
                permit: next.mapPermit || null,
                destroy() { this.destroyed = true; this.view?.destroy(); },
                focusPermit(permit) { if (this.view) this.view.focusPermit(permit); else this.permit = permit; },
            };
            current = pending;
            host.innerHTML = '<p class="pm-loading">Cargando el mapa…</p>';
            import('./permits-map-view.js')
                .then(module => module.renderPermitsMapView(host, { permit: pending.permit }))
                .then(view => { if (pending.destroyed) view.destroy(); else pending.view = view; })
                .catch(() => { if (!pending.destroyed) host.innerHTML = '<p class="pm-loading">No se pudo cargar el mapa. Revisa tu conexión e intenta de nuevo.</p>'; });
        } else {
            current = renderPermitsView(host, catalog, {
                permit: next.permit || null,
                onOpenLaw,
                onRoute: number => setHash(permitsHash({ tab, permit: number })),
            });
        }
    }

    function go(next = { tab: 'permisos' }) {
        const tab = next.tab || 'permisos';
        if (tab !== currentTab) { open(tab, next); return; }
        if (tab === 'permisos') { if (next.permit) current.openPermit(next.permit); else current.showList(); }
        else if (tab === 'resoluciones') {
            if (next.resolution) current.openResolution(next.resolution);
            else if (next.filters && Object.keys(next.filters).length) current.applyFilters(next.filters);
            else current.showList();
        }
        else if (tab === 'tramites') { if (next.tramite) current.openTramite(next.tramite); else current.showList(); }
        else if (tab === 'mapa' && next.mapPermit) current.focusPermit(next.mapPermit);
        else if (tab === 'sener') { if (next.record) current.openRecord(next.record); else current.showList(); }
    }

    go(route);
    return { go, destroy: () => { current?.destroy(); root.remove(); } };
}
