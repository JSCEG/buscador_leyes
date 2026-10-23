/**
 * «CNE y SENER» tab of the permits section (#cne-sener): CNE permits and SENER titles (assignments, wells,
 * exploration contracts, foreign trade and biofuels) from the permits API (src/lib/permisos-api.js).
 * One set of filters drives three views of the same records: points with clusters (only what has valid
 * coordinates, e.g. SENER wells), states coloured by count (e.g. assignments, which carry a state but no
 * point), and a table of what has no location. Each record opens a card with its source documents.
 */
import { SECTORS, markerOf, SOURCES, SOURCE, MARKETS, LAWS, getPermisos, getAllPages, stateLabel, marketLabel, statusLabel, shortDate, localDate,
    updatesSummary, detailFields, recordLinks } from '../lib/permisos-api.js';
import { featureStateId, choroplethClass, mexicoCityTime } from '../lib/cne-tables.js';
import { withMapBusy } from '../lib/map-busy.js';
import { BASE_OPTIONS, NETWORKS, KV_CLASSES, baseLayers, networkLayers, pinIcon, sectorCluster } from '../lib/map-common.js';
import { infraIcon } from '../lib/infra-icons.js';
import '../styles/permits-map.css';
import { permitsHash } from '../lib/cne-api.js';
import '../styles/cne-sener.css';

const POINT_LIMIT = 6000;
const PAGE_SIZE = 25;
const MEXICO = [[14.3, -117.5], [32.8, -86.6]];
const PALETTE = ['#f2e4e8', '#e4b8c5', '#cc8099', '#a9496b', '#7a1a38'];

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const count = value => Number(value || 0).toLocaleString('es-MX');
const badge = record => (record?.autoridad === 'SENER' ? '<span class="cs-badge">SENER</span>' : '');
const place = record => [record.municipio, stateLabel(record.efId, record.entidad)].filter(Boolean).join(', ');

async function getEstadosGeo(signal) {
    const response = await fetch('/api/mapa/estados', { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

/**
 * @param {HTMLElement} host
 * @param {{ catalog?: () => object[], onOpenLaw?: Function, record?: { tabla: string, numero: string } | null, onRoute?: Function }} options
 */
export function renderCneSenerView(host, { catalog = () => [], onOpenLaw = () => {}, record = null, onRoute = () => {} } = {}) {
    const filters = { autoridad: 'SENER', tabla: '', mercado: '', estatus: '', q: '' };
    let page = 1;
    let destroyed = false;
    let loadCtrl = null;
    let tableCtrl = null;
    let map = null;
    let L = null;
    let cluster = null;
    let statesLayer = null;
    let statesGeo = null;
    let setBase = null;
    let resizeObserver = null;
    let networks = null;
    const icons = new Map();
    const narrow = () => matchMedia('(max-width: 720px)').matches;

    host.innerHTML = `
        <div class="cs-view">
            <div class="cs-updates" data-updates><span class="cs-muted">Consultando la fecha de actualización…</span></div>
            <form class="cs-filters" data-filters>
                <fieldset class="cs-segment">
                    <legend>Autoridad</legend>
                    ${['', 'CNE', 'SENER'].map(value => `<label><input type="radio" name="cs-autoridad" value="${value}"${value === filters.autoridad ? ' checked' : ''}><span>${value || 'Todas'}</span></label>`).join('')}
                </fieldset>
                <label class="cs-field"><span>Fuente</span><select data-filter="tabla"></select></label>
                <label class="cs-field"><span>Mercado</span><select data-filter="mercado"><option value="">Todos los mercados</option>${MARKETS.map(m => `<option>${esc(m)}</option>`).join('')}</select></label>
                <label class="cs-field"><span>Estatus</span><select data-filter="estatus"><option value="">Todos</option><option value="Vigente">Vigentes</option><option value="No vigente">No vigentes</option></select></label>
            </form>
            <p class="cs-summary" data-summary role="status" aria-live="polite"></p>
            <div class="pmm cs-map-wrap" data-map-root>
                <div class="pmm-bar">
                    <label class="pmm-search">
                        <span class="pmm-sr">Buscar permisos, títulos o pozos</span>
                        <input type="search" data-q autocomplete="off" spellcheck="false" maxlength="120" placeholder="Permiso, título, pozo o razón social">
                    </label>
                    <div class="pmm-tools">
                        <button type="button" class="pm-btn" data-layers-toggle aria-expanded="true" aria-controls="cs-layers">Capas</button>
                        <button type="button" class="pm-btn" data-mexico>Todo México</button>
                        <button type="button" class="pm-btn" data-fullscreen>Pantalla completa</button>
                        <button type="button" class="pm-btn pmm-desk" data-desk aria-label="Mi mesa de consulta">Mi mesa <span class="pmm-desk-count" data-desk-count>0</span></button>
                    </div>
                    <div class="pmm-suggest" data-suggest hidden></div>
                </div>
                <div class="cs-map" data-map aria-label="Mapa de permisos y títulos"></div>
                <aside class="pmm-panel cs-layers" id="cs-layers" data-layers aria-label="Capas del mapa">
                    <p class="pmm-h">Infraestructura</p>
                    ${NETWORKS.map(n => `<label class="pmm-layer"><input type="checkbox" data-network="${n.key}"><span class="pmm-line" style="--line:${n.swatch}"></span><span>${n.label}<small data-network-note="${n.key}">${n.short}</small></span></label>`).join('')}
                    <p class="pmm-kv" data-kv hidden>${KV_CLASSES.map(c => `<span><i style="background:${c.color}"></i>${c.label}</span>`).join('')}</p>
                    <p class="pmm-h">Mapa base</p>
                    <div class="pmm-bases">${BASE_OPTIONS.map(([key, label]) => `<label><input type="radio" name="cs-base" value="${key}"${key === 'mapa' ? ' checked' : ''}> ${label}</label>`).join('')}</div>
                    <p class="pmm-h">Simbología</p>
                    <p class="pmm-legend"><span class="pmm-pin" data-sector="electricidad">${infraIcon('solar', 11)}</span> CNE
                        <span class="pmm-pin" data-sector="sener">${infraIcon('pozo', 11)}</span> SENER
                        <span class="pmm-pin is-novig" data-sector="electricidad">${infraIcon('solar', 11)}</span> No vigente</p>
                    <p class="pmm-legend cs-legend-scale">Registros por estado: menos <b style="background:${PALETTE[0]}"></b><b style="background:${PALETTE[2]}"></b><b style="background:${PALETTE[4]}"></b> más</p>
                </aside>
                <p class="cs-map-note" data-map-note hidden></p>
            </div>
            <section class="cs-table" aria-labelledby="cs-table-title">
                <div class="cs-table-head">
                    <h2 id="cs-table-title">Sin ubicación en el mapa</h2>
                    <p class="cs-muted" data-table-intro>Comercio exterior, contratos, biocombustibles, permisos de alcance nacional y los que no indican dónde están.</p>
                </div>
                <div data-table><p class="cs-muted">Cargando…</p></div>
                <nav class="cs-pager" data-pager aria-label="Páginas de la tabla"></nav>
            </section>
            <p class="cs-foot">Fuentes: registro público de la CNE y publicaciones de la SENER, a través de la API de DGMESNIE. El estatus lo calcula la fuente con su fecha de vigencia.</p>
        </div>
        <dialog class="cs-detail" data-detail aria-labelledby="cs-detail-title"><div data-detail-body></div></dialog>`;
    const $ = selector => host.querySelector(selector);
    const dialog = $('[data-detail]');

    function renderSources() {
        const select = $('[data-filter="tabla"]');
        const options = SOURCES.filter(source => !filters.autoridad || source.autoridad === filters.autoridad);
        if (filters.tabla && !options.some(source => source.key === filters.tabla)) filters.tabla = '';
        select.innerHTML = `<option value="">Todas las fuentes</option>${options.map(source => `<option value="${source.key}"${source.key === filters.tabla ? ' selected' : ''}>${esc(source.label)}${filters.autoridad ? '' : ` (${source.autoridad})`}</option>`).join('')}`;
    }

    // ---------- update dates ----------
    getPermisos('actualizaciones', { pageSize: 100 }).then(body => {
        if (destroyed) return;
        const { byAuthority, bySource } = updatesSummary(body.data || []);
        const heads = ['CNE', 'SENER'].filter(a => byAuthority[a]).map(a => `Datos ${a} al <strong>${esc(localDate(byAuthority[a]))}</strong>`);
        $('[data-updates]').innerHTML = heads.length ? `
            <span>${heads.join('<span class="cs-sep" aria-hidden="true"></span>')}</span>
            <details><summary>Por fuente</summary><ul>${bySource.map(row => `<li><span>${esc(SOURCE[row.source].label)}${row.autoridad === 'SENER' ? ' <span class="cs-badge">SENER</span>' : ''}</span><span>${esc(mexicoCityTime(row.fechaActualizacion) || shortDate(row.fechaActualizacion))}${row.fechaCorteFuente ? ` · corte de la fuente: ${esc(shortDate(row.fechaCorteFuente))}` : ''}</span></li>`).join('')}</ul></details>`
            : '<span class="cs-muted">Fecha de actualización no disponible.</span>';
    }).catch(() => { if (!destroyed) $('[data-updates]').innerHTML = '<span class="cs-muted">Fecha de actualización no disponible.</span>'; });

    // ---------- map ----------
    async function setupMap() {
        L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');
        await import('leaflet.markercluster/dist/MarkerCluster.css');
        globalThis.L = L;
        await import('leaflet.markercluster/dist/leaflet.markercluster.js');
        if (destroyed) return;
        map = L.map($('[data-map]'), { zoomControl: false, preferCanvas: true, minZoom: 3.5, maxZoom: 19, zoomSnap: 0.25, scrollWheelZoom: false });
        L.control.zoom({ position: 'bottomright' }).addTo(map);
        L.control.scale({ position: 'bottomright', imperial: false }).addTo(map);
        // Same base maps, networks, pins and clusters as the Mapa tab (src/lib/map-common.js).
        setBase = baseLayers(L, map, { onFallback: key => { const radio = host.querySelector(`input[name="cs-base"][value="${key}"]`); if (radio) radio.checked = true; } });
        setBase('mapa');
        networks = networkLayers(L, map, { pane: 'cs-networks' });
        map.fitBounds(MEXICO);
        map.on('zoomend', () => statesLayer?.restyle?.());
        // The map is built before the tab has its final size (fonts, the table below): once it has one, frame
        // Mexico again, so phones do not open on half of the United States.
        let framed = false;
        resizeObserver = new ResizeObserver(() => {
            map.invalidateSize({ pan: false });
            if (!framed && $('[data-map]').clientWidth > 0) { framed = true; map.fitBounds(MEXICO); }
        });
        resizeObserver.observe($('[data-map]'));
        map.on('focus', () => map.scrollWheelZoom.enable());
        map.on('blur', () => map.scrollWheelZoom.disable());
        map.createPane('cs-states').style.zIndex = 380;
    }

    function paintStates(rows) {
        if (statesLayer) { map.removeLayer(statesLayer); statesLayer = null; }
        if (!statesGeo) return;
        const counts = new Map(rows.filter(row => row.efId && row.efId !== '--').map(row => [row.efId, Number(row.permisos) || 0]));
        const max = Math.max(0, ...counts.values());
        // Close up the colours fade, so streets and towns of the base map stay readable under the pins.
        const fade = () => { const z = map.getZoom(); return z >= 10 ? 0.15 : z >= 8 ? 0.35 : z >= 6.5 ? 0.6 : 1; };
        const style = feature => {
            const level = choroplethClass(counts.get(featureStateId(feature)) || 0, max);
            return { color: '#ffffff', weight: 0.8, fillColor: level ? PALETTE[level - 1] : '#d9d4cf', fillOpacity: (level ? 0.72 : 0.2) * fade() };
        };
        statesLayer = L.geoJSON(statesGeo, {
            pane: 'cs-states',
            style,
            onEachFeature: (feature, layer) => {
                const id = featureStateId(feature);
                const n = counts.get(id) || 0;
                layer.bindTooltip(`${esc(stateLabel(id))}: ${count(n)} ${n === 1 ? 'registro' : 'registros'}`, { sticky: true });
            },
        }).addTo(map);
        statesLayer.restyle = () => statesLayer.setStyle(style);
    }

    // The same popup as the Mapa tab: kicker with the pin, holder, number, a few facts and the actions.
    function pointPopup(row) {
        const marker = markerOf(row);
        const rows = [['Fuente', SOURCE[row.tabla]?.label], ['Autoridad', row.autoridad], ['Tipo', marker.label !== row.tipo ? row.tipo : ''], ['Estatus', statusLabel(row)], ['Ubicación', row.municipio || row.entidad ? place(row) : '']]
            .filter(([, value]) => value).map(([label, value]) => `<dt>${label}</dt><dd>${esc(value)}</dd>`).join('');
        return `<div class="pmm-pop" data-sector="${marker.sector}">
            <p class="pmm-pop-kicker"><span class="pmm-pin" data-sector="${marker.sector}">${infraIcon(marker.icon, 12)}</span> ${esc(marker.label)}${badge(row)}</p>
            <strong>${esc(row.razonSocial || row.numero)}</strong>
            <p class="pmm-pop-num">${esc(row.numero)}</p>
            <dl>${rows}</dl>
            <div class="pmm-pop-actions">
                <button type="button" class="pm-btn pm-btn-primary" data-open-record="${esc(row.tabla)}" data-numero="${esc(row.numero)}">Ficha y fuente</button>
                ${row.autoridad === 'CNE' ? `<a class="pm-btn" href="${esc(permitsHash({ permit: row.numero }))}">Normativa y resoluciones</a>` : ''}
                <a class="pm-btn" href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${row.latitud},${row.longitud}" target="_blank" rel="noopener">Street View</a>
            </div></div>`;
    }

    function paintPoints(rows) {
        if (cluster) { map.removeLayer(cluster); cluster = null; }
        if (!rows.length) return;
        cluster = sectorCluster(L, SECTORS);
        cluster.addLayers(rows.map(row => {
            const marker = markerOf(row);
            const mods = row.estatus === 'No vigente' ? 'is-novig' : '';
            return L.marker([row.latitud, row.longitud], { icon: pinIcon(L, icons, marker.sector, marker.icon, mods), title: `${marker.label} · ${row.razonSocial || row.numero}`, keyboard: false, sector: marker.sector })
                .bindPopup(() => pointPopup(row), { className: 'pmm-popup', maxWidth: 340 });
        }));
        map.addLayer(cluster);
    }

    // ---------- loading ----------
    const apiFilters = () => Object.fromEntries(Object.entries(filters).filter(([, value]) => value));

    async function load() {
        loadCtrl?.abort();
        loadCtrl = new AbortController();
        const { signal } = loadCtrl;
        page = 1;
        loadTable();
        const note = $('[data-map-note]');
        const summary = $('[data-summary]');
        summary.textContent = 'Consultando…';
        const work = async () => {
            const params = apiFilters();
            // Markers use the light points (number, holder, status, coordinates); the card asks for the rest.
            // Past POINT_LIMIT the map keeps the counts by state and asks to narrow the search.
            const [geo, estados, points] = await Promise.all([
                statesGeo || getEstadosGeo(signal).catch(() => null),
                getPermisos('estados', { ...params, pageSize: 100 }, signal),
                getAllPages('puntos', { ...params, ligero: 'true' }, { signal, limit: POINT_LIMIT }),
            ]);
            statesGeo = geo;
            if (signal.aborted || destroyed) return;
            paintStates(estados.data || []);
            paintPoints(points?.data || []);
            note.hidden = !points.tooMany;
            if (points.tooMany) note.textContent = `Hay ${count(points.total)} registros con ubicación, demasiados para verlos uno por uno. Elige una fuente, un mercado o busca un titular para acotarlos; mientras, el mapa colorea cada estado según cuántos tiene.`;
            const located = (estados.data || []).reduce((sum, row) => sum + (row.efId && row.efId !== '--' ? Number(row.permisos) || 0 : 0), 0);
            summary.innerHTML = `<strong>${count(points.total)}</strong> con punto en el mapa · <strong>${count(located)}</strong> con estado identificado`;
        };
        try {
            await (map ? withMapBusy(map, null, 'Cargando registros…', work) : work());
        } catch (error) {
            if (error.name === 'AbortError' || destroyed) return;
            summary.textContent = error.status === 503 ? 'La consulta de permisos no está disponible en este momento.' : 'No se pudieron cargar los registros. Intenta de nuevo en un momento.';
        }
    }

    async function loadTable() {
        tableCtrl?.abort();
        tableCtrl = new AbortController();
        const box = $('[data-table]');
        const pager = $('[data-pager]');
        box.setAttribute('aria-busy', 'true');
        try {
            // A search lists every match (with or without a point); otherwise the table holds what the map cannot show.
            const searching = Boolean(filters.q);
            $('#cs-table-title').textContent = searching ? `Resultados de «${filters.q}»` : 'Sin ubicación en el mapa';
            $('[data-table-intro]').textContent = searching
                ? 'Todos los registros cuyo número o razón social contienen ese texto, tengan o no punto en el mapa.'
                : 'Comercio exterior, contratos, biocombustibles, permisos de alcance nacional y los que no indican dónde están.';
            const body = await getPermisos(searching ? 'permisos' : 'sin-ubicacion', { ...apiFilters(), page, pageSize: PAGE_SIZE }, tableCtrl.signal);
            if (destroyed) return;
            const rows = body.data || [];
            box.innerHTML = rows.length ? `
                <div class="cs-scroll"><table>
                    <thead><tr><th scope="col">Número</th><th scope="col">Titular</th><th scope="col">Fuente</th><th scope="col">Mercado</th><th scope="col">Entidad</th><th scope="col">Estatus</th></tr></thead>
                    <tbody>${rows.map(row => `<tr>
                        <td><button type="button" class="cs-link" data-open-record="${esc(row.tabla)}" data-numero="${esc(row.numero)}">${esc(row.numero)}</button>${badge(row)}</td>
                        <td>${esc(row.razonSocial || '')}</td>
                        <td>${esc(SOURCE[row.tabla]?.label || row.tabla)}</td>
                        <td>${esc(marketLabel(row))}</td>
                        <td>${esc(stateLabel(row.efId, row.entidad))}</td>
                        <td>${esc(statusLabel(row))}</td>
                    </tr>`).join('')}</tbody>
                </table></div>`
                : `<p class="cs-muted">${filters.q ? 'Ningún registro coincide con esa búsqueda y estos filtros.' : 'No hay registros sin ubicación con estos filtros.'}</p>`;
            const pages = Math.ceil((body.total || 0) / PAGE_SIZE);
            pager.innerHTML = pages > 1 ? `
                <button type="button" class="cs-btn" data-page="${page - 1}"${page <= 1 ? ' disabled' : ''}>Anterior</button>
                <span>Página ${count(page)} de ${count(pages)} · ${count(body.total)} registros</span>
                <button type="button" class="cs-btn" data-page="${page + 1}"${page >= pages ? ' disabled' : ''}>Siguiente</button>`
                : (body.total ? `<span>${count(body.total)} ${body.total === 1 ? 'registro' : 'registros'}</span>` : '');
        } catch (error) {
            if (error.name === 'AbortError' || destroyed) return;
            box.innerHTML = '<p class="cs-muted">No se pudo cargar la tabla. Intenta de nuevo en un momento.</p>';
            pager.innerHTML = '';
        } finally {
            box.removeAttribute('aria-busy');
        }
    }

    // ---------- record card ----------
    let detailCtrl = null;
    async function openRecord(tabla, numero, { route = true } = {}) {
        if (!SOURCE[tabla] || !numero) return;
        if (document.fullscreenElement) await document.exitFullscreen?.().catch(() => {});
        if (route) onRoute({ tabla, numero });
        detailCtrl?.abort();
        detailCtrl = new AbortController();
        const body = $('[data-detail-body]');
        body.innerHTML = '<p class="cs-muted">Cargando la ficha…</p>';
        if (!dialog.open) dialog.showModal();
        try {
            const row = await getPermisos('detalle', { tabla, numero }, detailCtrl.signal);
            if (destroyed) return;
            const law = row.leyAplicable && LAWS[row.leyAplicable];
            const lawEntry = law && catalog().find(item => item.siglas === row.leyAplicable);
            const core = [
                ['Mercado', marketLabel(row)],
                ['Estatus', statusLabel(row)],
                ['Tipo', row.tipo],
                ['Ubicación', place(row)],
                ['Corte de la fuente', shortDate(row.fechaCorte)],
            ].filter(([, value]) => value);
            const links = recordLinks(row);
            const title = row.datos?.tipoContractual && row.datos?.numeroTitulo
                ? { tabla: row.datos.tipoContractual === 'Contrato' ? 'contratos-ee' : 'asignaciones', numero: row.datos.numeroTitulo } : null;
            body.innerHTML = `
                <header class="cs-detail-head">
                    <p class="cs-pop-kicker">${badge(row)}${esc(SOURCE[tabla].label)}${row.autoridad === 'CNE' ? ' · CNE' : ''}</p>
                    <h2 id="cs-detail-title">${esc(row.numero)}</h2>
                    ${row.razonSocial ? `<p class="cs-detail-holder">${esc(row.razonSocial)}</p>` : ''}
                    <button type="button" class="cs-close" data-close aria-label="Cerrar la ficha">×</button>
                </header>
                <dl class="cs-dl">${core.map(([label, value]) => `<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`).join('')}
                    ${law ? `<dt>Ley aplicable</dt><dd>${lawEntry ? `<button type="button" class="cs-link" data-open-law="${esc(row.leyAplicable)}">${esc(law)}</button>` : esc(law)}</dd>` : ''}
                </dl>
                ${links.length || row.autoridad === 'CNE' || title ? `<div class="cs-actions">
                    ${links.map(link => `<a class="cs-btn cs-btn-primary" href="${esc(link.href)}" target="_blank" rel="noopener">${esc(link.label)}</a>`).join('')}
                    ${row.autoridad === 'CNE' ? `<a class="cs-btn" href="${esc(permitsHash({ permit: row.numero }))}">Ver resoluciones y anexos</a>` : ''}
                    ${title ? `<button type="button" class="cs-btn" data-open-record="${esc(title.tabla)}" data-numero="${esc(title.numero)}">Ver el título ${esc(title.numero)}</button>` : ''}
                </div>` : ''}
                ${row.datos?.metodoUbicacion ? `<p class="cs-pop-note">Ubicación del pozo: ${esc(row.datos.metodoUbicacion)}. La fuente no publica la zona UTM; en pozos marinos la posición puede tener error.</p>` : ''}
                <div data-municipios></div>
                <details class="cs-more" open><summary>Datos de la fuente</summary>
                    <dl class="cs-dl">${detailFields(row).map(field => `<dt>${esc(field.label)}</dt><dd>${esc(field.value)}</dd>`).join('')}</dl>
                </details>
                ${row.fuente ? `<p class="cs-muted cs-source">Fuente: ${esc(row.fuente)}</p>` : ''}`;
            if (tabla === 'asignaciones') loadMunicipios(row.numero, detailCtrl.signal);
        } catch (error) {
            if (error.name === 'AbortError' || destroyed) return;
            body.innerHTML = `<header class="cs-detail-head"><h2 id="cs-detail-title">${esc(numero)}</h2><button type="button" class="cs-close" data-close aria-label="Cerrar la ficha">×</button></header>
                <p>${error.status === 404 ? 'No se encontró este registro en la fuente.' : 'No se pudo cargar la ficha. Intenta de nuevo en un momento.'}</p>`;
        }
    }

    async function loadMunicipios(numero, signal) {
        const box = $('[data-municipios]');
        try {
            const body = await getPermisos('asignaciones-municipios', { numero, pageSize: 500 }, signal);
            const rows = body.data || [];
            if (!rows.length || destroyed) return;
            const byState = new Map();
            for (const row of rows) {
                const state = stateLabel(row.efId, row.entidad);
                byState.set(state, [...(byState.get(state) || []), row.municipio || row.municipioFuente].filter(Boolean));
            }
            box.innerHTML = `<details class="cs-more"><summary>Municipios de la asignación (${count(rows.length)})</summary>
                <ul class="cs-munis">${[...byState].map(([state, names]) => `<li><strong>${esc(state)}:</strong> ${esc(names.join(', '))}</li>`).join('')}</ul></details>`;
        } catch { /* the card stands without the list */ }
    }

    function closeRecord() {
        detailCtrl?.abort();
        if (dialog.open) dialog.close();
    }

    // ---------- events ----------
    // While typing: up to 8 matches to jump to. Enter (or «Ver todos») filters the map and the table by the text.
    let typing = null;
    let suggestCtrl = null;
    let suggestItems = [];
    const suggestBox = () => $('[data-suggest]');
    function renderSuggest(term, body, loading) {
        suggestItems = body?.data || [];
        const box = suggestBox();
        box.innerHTML = loading ? '<p class="pmm-muted">Buscando…</p>'
            : suggestItems.length ? `${suggestItems.map((row, i) => {
                const marker = markerOf(row);
                const where = row.latitud != null ? place(row) : 'sin ubicación en el mapa';
                return `<button type="button" data-i="${i}"><span class="pmm-pin" data-sector="${marker.sector}">${infraIcon(marker.icon, 12)}</span>
                    <span><strong>${esc(row.razonSocial || row.numero)}</strong><small>${esc(row.numero)} · ${esc(SOURCE[row.tabla]?.label || row.tabla)}${row.autoridad === 'SENER' ? ' · SENER' : ''} · ${esc(where)}</small></span></button>`;
            }).join('')}
                <button type="button" class="pmm-all" data-all>Ver los ${count(body.total)} registros que coinciden con «${esc(term)}»</button>`
            : '<p class="pmm-muted">Sin coincidencias.</p>';
        box.hidden = false;
    }
    function applySearch(term) {
        suggestBox().hidden = true;
        const next = term.length >= 2 ? term.slice(0, 120) : '';
        if (next !== filters.q) { filters.q = next; load(); }
    }
    function flyToRecord(row) {
        suggestBox().hidden = true;
        if (row.latitud == null || row.longitud == null || !map) { openRecord(row.tabla, row.numero); return; }
        const at = L.latLng(row.latitud, row.longitud);
        map.once('moveend', () => L.popup({ className: 'pmm-popup', maxWidth: 340 }).setLatLng(at).setContent(pointPopup(row)).openOn(map));
        map.setView(at, Math.max(map.getZoom(), 15));
    }
    const onInput = event => {
        if (!event.target.matches('[data-q]')) return;
        const term = event.target.value.trim();
        clearTimeout(typing);
        if (term.length < 2) { suggestBox().hidden = true; if (filters.q) applySearch(''); return; }
        renderSuggest(term, null, true);
        typing = setTimeout(async () => {
            suggestCtrl?.abort();
            suggestCtrl = new AbortController();
            try {
                const body = await getPermisos('permisos', { ...apiFilters(), q: term, page: 1, pageSize: 8 }, suggestCtrl.signal);
                if (event.target.value.trim() === term) renderSuggest(term, body, false);
            } catch (error) { if (error.name !== 'AbortError') renderSuggest(term, { data: [] }, false); }
        }, 300);
    };
    const onKeydown = event => {
        if (!event.target.matches('[data-q]')) return;
        if (event.key === 'Enter') { event.preventDefault(); applySearch(event.target.value.trim()); }
        if (event.key === 'Escape') suggestBox().hidden = true;
    };
    const onChange = event => {
        const t = event.target;
        if (t.matches('[data-q]')) return;
        if (t.name === 'cs-base') { setBase?.(t.value); return; }
        if (t.matches('[data-network]')) {
            const n = NETWORKS.find(x => x.key === t.dataset.network);
            if (t.dataset.network === 'transmision') $('[data-kv]').hidden = !t.checked;
            withMapBusy(map, t, t.checked ? `Cargando ${n.label.toLowerCase()}…` : 'Actualizando el mapa…', async () => {
                try {
                    const data = await networks.toggle(n.key, t.checked);
                    const note = host.querySelector(`[data-network-note="${n.key}"]`);
                    if (note && data) note.textContent = `${n.short} · ${Number(data.km || 0).toLocaleString('es-MX')} km`;
                } catch {
                    t.checked = false;
                    if (n.key === 'transmision') $('[data-kv]').hidden = true;
                }
            });
            return;
        }
        if (t.name === 'cs-autoridad') { filters.autoridad = t.value; renderSources(); load(); }
        else if (t.dataset.filter) { filters[t.dataset.filter] = t.value; load(); }
    };
    const onClick = event => {
        const t = event.target;
        const sug = t.closest('[data-suggest] [data-i]');
        if (sug) { flyToRecord(suggestItems[Number(sug.dataset.i)]); return; }
        if (t.closest('[data-all]')) { applySearch($('[data-q]').value.trim()); return; }
        if (!t.closest('.pmm-search') && !t.closest('[data-suggest]')) suggestBox().hidden = true;
        if (t.closest('[data-layers-toggle]')) {
            const panel = $('[data-layers]');
            panel.hidden = !panel.hidden;
            host.querySelectorAll('[data-layers-toggle]').forEach(btn => btn.setAttribute('aria-expanded', String(!panel.hidden)));
            return;
        }
        if (t.closest('[data-mexico]')) { map?.fitBounds(MEXICO); return; }
        if (t.closest('[data-fullscreen]')) {
            if (document.fullscreenElement) document.exitFullscreen(); else $('[data-map-root]').requestFullscreen?.();
            return;
        }
        if (t.closest('[data-desk]')) { document.getElementById('desk-toggle')?.click(); return; }
        const pageBtn = t.closest('[data-page]');
        if (pageBtn && !pageBtn.disabled) { page = Number(pageBtn.dataset.page); loadTable(); $('.cs-table').scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
        const lawBtn = t.closest('[data-open-law]');
        if (lawBtn) {
            const law = catalog().find(item => item.siglas === lawBtn.dataset.openLaw);
            if (law) { closeRecord(); onOpenLaw(law); }
            return;
        }
        if (t.closest('[data-close]') || t === dialog) closeRecord();
    };
    const onClose = () => { detailCtrl?.abort(); onRoute(null); };
    host.addEventListener('change', onChange);
    host.addEventListener('input', onInput);
    host.addEventListener('keydown', onKeydown);
    // Full screen: the button says how to leave it, and the map takes the new size.
    const onFullscreen = () => {
        const on = document.fullscreenElement === $('[data-map-root]');
        const btn = $('[data-fullscreen]');
        if (btn) btn.textContent = on ? 'Salir de pantalla completa' : 'Pantalla completa';
        setTimeout(() => map?.invalidateSize({ pan: false }), 60);
    };
    document.addEventListener('fullscreenchange', onFullscreen);
    // «Mi mesa» lives in the bar here, as in the Mapa tab: the floating button would sit on the map.
    document.body.classList.add('pmm-open');
    const deskToggle = document.getElementById('desk-toggle');
    const syncDesk = () => {
        const n = deskToggle?.querySelector('.desk-badge')?.textContent || '0';
        $('[data-desk-count]').textContent = n;
        $('[data-desk]').setAttribute('aria-label', `Mi mesa de consulta, ${n} ${n === '1' ? 'elemento fijado' : 'elementos fijados'}`);
    };
    const deskObserver = new MutationObserver(syncDesk);
    if (deskToggle) deskObserver.observe(deskToggle, { childList: true, subtree: true, characterData: true });
    syncDesk();
    host.addEventListener('click', onClick);
    dialog.addEventListener('close', onClose);
    // «Ver ficha» and record links, in the capture phase: Leaflet stops clicks inside popups from bubbling.
    const onPopupClick = event => {
        const openBtn = event.target.closest?.('[data-open-record]');
        if (openBtn && host.contains(openBtn)) { event.stopPropagation(); openRecord(openBtn.dataset.openRecord, openBtn.dataset.numero); }
    };
    host.addEventListener('click', onPopupClick, true);

    renderSources();
    if (narrow()) { $('[data-layers]').hidden = true; host.querySelectorAll('[data-layers-toggle]').forEach(btn => btn.setAttribute('aria-expanded', 'false')); }
    setupMap().then(load).catch(() => {
        if (destroyed) return;
        $('[data-map-note]').hidden = false;
        $('[data-map-note]').textContent = 'No se pudo cargar el mapa; la tabla sigue disponible.';
        loadTable();
    });
    if (record) openRecord(record.tabla, record.numero, { route: false });

    return {
        openRecord: next => openRecord(next.tabla, next.numero, { route: false }),
        showList: closeRecord,
        destroy() {
            destroyed = true;
            loadCtrl?.abort();
            tableCtrl?.abort();
            detailCtrl?.abort();
            clearTimeout(typing);
            host.removeEventListener('change', onChange);
            host.removeEventListener('input', onInput);
            host.removeEventListener('keydown', onKeydown);
            document.removeEventListener('fullscreenchange', onFullscreen);
            if (document.fullscreenElement === $('[data-map-root]')) document.exitFullscreen?.();
            deskObserver.disconnect();
            document.body.classList.remove('pmm-open');
            suggestCtrl?.abort();
            host.removeEventListener('click', onClick);
            host.removeEventListener('click', onPopupClick, true);
            dialog.removeEventListener('close', onClose);
            if (dialog.open) dialog.close();
            resizeObserver?.disconnect();
            map?.remove();
            host.replaceChildren();
        },
    };
}
