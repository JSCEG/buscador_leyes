/**
 * The five CNE tables served by DGMESNIE (transport, marketing, hydrocarbon infrastructure,
 * electricity supply and accredited third parties) inside the permits map, by market: under each
 * market of the panel, «Otras actividades» lists the tables that have permits in that market; crude
 * oil, petrochemicals and the generic «Hidrocarburos» get their own block. Each activity has a
 * filtered table with a detail sheet and, when its vigentes carry them, a choropleth by state and
 * points. Both layers are computed from the table rows (/Tablas/Lista, via cne-lista), so states and
 * coordinates filled in later show up without code changes.
 */
import {
    CNE_TABLES, CNE_TABLE, CNE_MARKETS, CNE_MARKET, COMMON_FACETS, NO_STATE, STATE_NAME, featureStateId, facetOptions, stateOptions,
    filterRows, capacityTotals, validPoint, mexicoCityTime, calendarDate, choroplethClass, marketOf, activityKey, parseActivity,
    activitiesByMarket, stateCounts, inMarket, marketText, marketsOf,
} from '../lib/cne-tables.js';
import { permitsHash } from '../lib/cne-api.js';

const PALETTE = ['#f2e4e8', '#e4b8c5', '#cc8099', '#a9496b', '#7a1a38'];
// The map draws on canvas, which does not read CSS variables: point colours are literal (see permits-map.css).
const POINT_COLORS = { transporte: ['#7a1a38', '#e58aa6'], infraestructura: ['#0e7c86', '#5fc4cc'] };
const pointColor = key => (POINT_COLORS[key] || ['#5b5249', '#c9bfb5'])[document.documentElement.classList.contains('dark-mode') ? 1 : 0];
const PAGE = 100;
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeHref = v => (/^https?:\/\/[^\s"'<>]+$/i.test(String(v ?? '').trim()) ? String(v).trim() : '');
const count = n => Number(n || 0).toLocaleString('es-MX');
const amount = v => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? '' : Number(v).toLocaleString('es-MX', { maximumFractionDigits: 2 }));
const permits = n => `${count(n)} ${n === 1 ? 'permiso' : 'permisos'}`;
const activityLabel = (table, market) => `${CNE_TABLE[table].label} · ${CNE_MARKET[market]?.label || market}`;
/** «Transporte de petrolíferos»: how the map names an activity in plain words. */
const activityPhrase = (table, market) => (market === 'otros'
    ? `${CNE_TABLE[table].label} de otros hidrocarburos`
    : `${CNE_TABLE[table].label} de ${(CNE_MARKET[market]?.label || market).toLowerCase()}`);

/** Ray casting over a GeoJSON ring of [lon, lat]. */
function inRing(ring, x, y) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}
const inPolygon = (polygon, x, y) => inRing(polygon[0], x, y) && !polygon.slice(1).some(hole => inRing(hole, x, y));

/**
 * EF_ID of the state polygon that contains a point, or ''. The map resolves clicks this way because
 * the market layers draw on a canvas above the coloured states and would take the click.
 */
export function stateAt(geo, lat, lon) {
    for (const feature of geo?.features || []) {
        const g = feature.geometry;
        if (!g) continue;
        const polygons = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
        if (polygons.some(polygon => inPolygon(polygon, lon, lat))) return featureStateId(feature);
    }
    return '';
}

/** Part of the panel that is not inside a market: the «otros» block, the update date and the legend. */
export function cnePanelHtml() {
    return `<div class="pmm-cne-market" data-cne-market="otros"></div>
        <p class="pmm-cne-loading" data-cne-loading>Cargando otras actividades de la CNE…</p>
        <p class="pmm-cne-updated" data-cne-updated></p>`;
}

/**
 * «Otras actividades» of one market: one entry per table with permits there, with the table button
 * and only the map layers its vigentes can draw.
 * @param {string} market
 * @param {{ table: string, total: number, vigentes: number, withState: number, withPoint: number }[]} entries
 * @param {{ states?: string|null, points?: Set<string> }} [on] activity keys currently drawn
 */
export function marketActivitiesHtml(market, entries, on = {}) {
    if (!entries.length) return '';
    const title = market === 'otros' ? CNE_MARKET.otros.label : `Otras actividades · ${CNE_MARKET[market]?.label || market}`;
    return `<p class="pmm-cne-sub-h">${esc(title)}</p>
        ${entries.map(e => {
            const t = CNE_TABLE[e.table];
            const key = activityKey(e.table, market);
            const states = e.withState > 0;
            const points = e.withPoint > 0;
            return `<div class="pmm-cne" data-sector="cne-${t.key}" data-activity="${esc(key)}">
                <div class="pmm-cne-head">
                    <span class="pmm-pin" data-sector="cne-${t.key}"><b>${t.code}</b></span>
                    <span class="pmm-cne-name">${esc(t.label)}<small>${count(e.vigentes)} ${e.vigentes === 1 ? 'vigente' : 'vigentes'} · ${count(e.total)} en total</small></span>
                    <button type="button" class="pm-btn pmm-cne-open" data-cne-open="${t.key}" data-cne-market="${esc(market)}" aria-label="Ver la tabla de ${esc(activityLabel(t.key, market))}">Tabla</button>
                </div>
                ${states ? `<label class="pmm-layer pmm-cne-sub"><input type="checkbox" data-cne-states="${esc(key)}"${on.states === key ? ' checked' : ''}><span>Ver por estado<small>Colorea cada estado según cuántos permisos tiene${e.withState < e.vigentes ? ` (${count(e.withState)} de ${count(e.vigentes)} indican su estado)` : ''}</small></span></label>` : ''}
                ${points ? `<label class="pmm-layer pmm-cne-sub"><input type="checkbox" data-cne-points="${esc(key)}"${on.points?.has(key) ? ' checked' : ''}><span>Ver ubicación exacta<small>${count(e.withPoint)} ${e.withPoint === 1 ? 'permiso tiene' : 'permisos tienen'} punto en el mapa</small></span></label>` : ''}
                ${!states && !points ? '<p class="pmm-cne-nomap">Estos permisos no indican su ubicación; consúltalos en la tabla.</p>' : ''}
            </div>`;
        }).join('')}`;
}

/**
 * @param {{ L: any, map: any, root: HTMLElement, getJson: (path: string, signal?: AbortSignal) => Promise<any>, signal: AbortSignal, status: (msg: string, ms?: number) => void }} deps
 */
export function mountCneTables({ L, map, root, getJson, signal, status }) {
    const $ = sel => root.querySelector(sel);
    const data = Object.fromEntries(CNE_TABLES.map(t => [t.key, { rows: null, loading: null, updated: null }]));
    const blankFilters = () => ({ estatus: 'Vigente', efId: '', market: '', q: '', facets: {}, shown: PAGE });
    const filters = Object.fromEntries(CNE_TABLES.map(t => [t.key, blankFilters()]));
    let openKey = null;
    let detailRow = null;
    let statesGeo = null;
    let choropleth = null;
    let choroplethKey = null;
    const pointLayers = {};
    const pointIndex = {};
    const pointsOn = new Set();

    map.createPane('pmm-cne-states').style.zIndex = 380;
    map.createPane('pmm-cne-points').style.zIndex = 620;

    const overlay = document.createElement('section');
    overlay.className = 'pmm-cne-table';
    overlay.hidden = true;
    overlay.setAttribute('aria-label', 'Tabla de permisos CNE');
    overlay.innerHTML = '<div class="pmm-cne-table-inner" data-cne-body></div>';
    $('.pmm-body').append(overlay);
    // What the coloured states mean, on the map itself (not at the end of the panel).
    const legendBox = document.createElement('div');
    legendBox.className = 'pmm-cne-legend';
    legendBox.dataset.cneLegend = '';
    legendBox.hidden = true;
    legendBox.setAttribute('role', 'note');
    $('.pmm-body').append(legendBox);

    // ---------- data ----------
    async function rowsOf(key) {
        const entry = data[key];
        if (entry.rows) return entry.rows;
        entry.loading ||= getJson(`cne-lista?tabla=${key}`, signal).then(body => {
            entry.rows = Array.isArray(body?.filas) ? body.filas : [];
            return entry.rows;
        }).finally(() => { entry.loading = null; });
        return entry.loading;
    }
    const activityRows = key => {
        const { table, market } = parseActivity(key);
        return (data[table].rows || []).filter(row => inMarket(row, market));
    };

    // The panel needs every table to know which market has which activities: they load in the
    // background (≈220 KB compressed in all) and each one is drawn as soon as it arrives.
    function renderActivities() {
        const summary = activitiesByMarket(Object.fromEntries(CNE_TABLES.map(t => [t.key, data[t.key].rows])));
        for (const market of CNE_MARKETS) {
            const box = root.querySelector(`[data-cne-market="${market.key}"]`);
            if (box) box.innerHTML = marketActivitiesHtml(market.key, summary[market.key], { states: choroplethKey, points: pointsOn });
        }
    }
    const loading = $('[data-cne-loading]');
    Promise.allSettled(CNE_TABLES.map(t => rowsOf(t.key).then(renderActivities))).then(results => {
        if (signal.aborted) return;
        const failed = results.filter(r => r.status === 'rejected').length;
        if (!loading) return;
        loading.hidden = !failed;
        if (failed) loading.innerHTML = `No se pudieron cargar ${failed === CNE_TABLES.length ? 'las otras actividades de la CNE' : `${failed} de las tablas de la CNE`}. <button type="button" data-cne-reload>Reintentar</button>`;
    });

    function updatedText(a) {
        if (!a?.disponible) return 'Fecha de actualización no disponible';
        const when = mexicoCityTime(a.fechaActualizacion);
        const cut = calendarDate(a.fechaCorteFuente);
        return [when ? `Actualizado el ${when} (hora de Ciudad de México)` : '', cut ? `corte de la fuente: ${cut}` : '', a.filas ? `${count(a.filas)} filas` : '']
            .filter(Boolean).join(' · ') || 'Fecha de actualización no disponible';
    }

    // The five tables are loaded together; the panel shows the most recent update once.
    CNE_TABLES.forEach(t => {
        getJson(`cne-actualizacion?tabla=${t.key}`, signal).then(a => {
            data[t.key].updated = a;
            const latest = CNE_TABLES.map(x => data[x.key].updated).filter(u => u?.disponible)
                .sort((x, y) => String(y.fechaActualizacion).localeCompare(String(x.fechaActualizacion)))[0];
            const node = $('[data-cne-updated]');
            if (node && latest) node.textContent = `Otras actividades CNE: ${updatedText({ ...latest, filas: 0 })}`;
            if (openKey === t.key) renderTable();
        }).catch(() => {});
    });

    // ---------- choropleth by state (one activity at a time, vigentes) ----------
    async function showStates(key, on) {
        const box = root.querySelector(`[data-cne-states="${CSS.escape(key)}"]`);
        if (!on) {
            if (choroplethKey === key) clearChoropleth();
            return;
        }
        root.querySelectorAll('[data-cne-states]').forEach(input => { if (input.dataset.cneStates !== key) input.checked = false; });
        clearChoropleth();
        const { table, market } = parseActivity(key);
        status(`Cargando ${activityLabel(table, market).toLowerCase()} por estado…`);
        try {
            const [geo] = await Promise.all([statesGeo || getJson('estados', signal), rowsOf(table)]);
            statesGeo = geo;
            if (!box?.checked) return;
            status('');
            paintChoropleth(key, stateCounts(activityRows(key)));
        } catch (error) {
            if (error.name === 'AbortError') return;
            status(`No se pudo cargar ${activityLabel(table, market).toLowerCase()} por estado.`, 5000);
            if (box) box.checked = false;
        }
    }

    function paintChoropleth(key, rows) {
        const { table, market } = parseActivity(key);
        const byState = new Map();
        let noState = 0;
        for (const r of rows) {
            const id = String(r.efId ?? '').trim();
            if (!id || id === NO_STATE) noState += Number(r.permisos) || 0;
            else byState.set(id.padStart(2, '0'), { count: Number(r.permisos) || 0, name: r.entidad });
        }
        const max = Math.max(0, ...[...byState.values()].map(s => s.count));
        const phrase = activityPhrase(table, market);
        choropleth = L.geoJSON(statesGeo, {
            pane: 'pmm-cne-states',
            style: feature => {
                const level = choroplethClass(byState.get(featureStateId(feature))?.count, max);
                return { color: '#ffffff', weight: 0.8, fillColor: level ? PALETTE[level - 1] : '#d9d4cf', fillOpacity: level ? 0.78 : 0.25 };
            },
            onEachFeature: (feature, layer) => {
                const id = featureStateId(feature);
                const entry = byState.get(id);
                const name = STATE_NAME[id] || entry?.name || 'Estado';
                layer.bindTooltip(`<strong>${esc(name)}</strong><br>${entry?.count ? permits(entry.count) : 'Sin permisos'}`, { sticky: true, className: 'pmm-cne-tip' });
            },
        }).addTo(map);
        choroplethKey = key;
        legendBox.hidden = false;
        legendBox.innerHTML = `<div class="pmm-cne-legend-head"><p class="pmm-cne-legend-title">${esc(phrase)}</p><button type="button" class="pmm-cne-legend-off" data-cne-states-off aria-label="Quitar ${esc(phrase)} del mapa">Quitar</button></div>
            <p class="pmm-cne-legend-note">Permisos vigentes por estado. Entre más oscuro, más permisos.</p>
            ${byState.size ? `<p class="pmm-cne-scale"><span>Pocos</span>${PALETTE.map(c => `<i style="background:${c}"></i>`).join('')}<span>Muchos (hasta ${count(max)})</span></p>
            <p class="pmm-cne-legend-note">Toca un estado para ver cuántos hay, en qué municipios y la lista.</p>` : '<p class="pmm-cne-legend-note">Ningún permiso vigente indica su estado todavía.</p>'}
            ${noState ? `<p class="pmm-cne-legend-note">${permits(noState)} no indican su estado y no se pintan. <button type="button" data-cne-open="${table}" data-cne-market="${esc(market)}" data-cne-ef="${NO_STATE}">Ver cuáles</button></p>` : ''}`;
    }

    /** Popup of a state: how many vigentes, the municipalities with most of them, and the list. */
    function statePopup(key, efId, name) {
        const { table, market } = parseActivity(key);
        const inState = activityRows(key).filter(r => r.estatus === 'Vigente' && String(r.efId ?? '').trim().padStart(2, '0') === efId);
        const byTown = new Map();
        let noTown = 0;
        for (const r of inState) {
            const town = String(r.municipio ?? '').trim();
            if (!town) { noTown += 1; continue; }
            byTown.set(town, (byTown.get(town) || 0) + 1);
        }
        const towns = [...byTown.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'));
        const top = towns.slice(0, 5);
        return `<div class="pmm-pop pmm-cne-statepop" data-sector="cne-${table}">
            <p class="pmm-pop-kicker"><span class="pmm-pin" data-sector="cne-${table}"><b>${CNE_TABLE[table].code}</b></span> ${esc(activityPhrase(table, market))}</p>
            <strong>${esc(name)}</strong>
            <p class="pmm-pop-num">${permits(inState.length)} vigentes</p>
            ${top.length ? `<p class="pmm-cne-towns-h">Municipios con más permisos</p><ul class="pmm-cne-towns">${top.map(([town, n]) => `<li><span>${esc(town)}</span><b>${count(n)}</b></li>`).join('')}</ul>
                ${towns.length > top.length ? `<p class="pmm-cne-legend-note">Y ${count(towns.length - top.length)} municipios más.</p>` : ''}` : ''}
            ${noTown ? `<p class="pmm-cne-legend-note">${permits(noTown)} sin municipio indicado.</p>` : ''}
            <div class="pmm-pop-actions"><button type="button" class="pm-btn pm-btn-primary" data-cne-open="${table}" data-cne-market="${esc(market)}" data-cne-ef="${efId}">Ver los ${permits(inState.length)}</button></div>
        </div>`;
    }

    // A click on the map opens the popup of the state under it, unless the same click opened another
    // popup (a permit point of the markets, which sits above the coloured states).
    let lastPopupAt = 0;
    const onPopupOpen = () => { lastPopupAt = Date.now(); };
    const onMapClick = event => {
        if (!choroplethKey || !statesGeo) return;
        const key = choroplethKey;
        setTimeout(() => {
            if (Date.now() - lastPopupAt < 80 || choroplethKey !== key) return;
            const id = stateAt(statesGeo, event.latlng.lat, event.latlng.lng);
            if (!id) return;
            // Leave room for the search bar and chips that float over the top of the map on phones.
            map.openPopup(statePopup(key, id, STATE_NAME[id] || 'Estado'), event.latlng, { className: 'pmm-popup', maxWidth: 300, autoPanPaddingTopLeft: L.point(12, 120), autoPanPaddingBottomRight: L.point(12, 24) });
        }, 0);
    };
    map.on('popupopen', onPopupOpen);
    map.on('click', onMapClick);

    function clearChoropleth() {
        if (choropleth) map.removeLayer(choropleth);
        choropleth = null;
        choroplethKey = null;
        legendBox.hidden = true;
    }

    // ---------- points (vigentes with coordinates) ----------
    async function showPoints(key, on) {
        const box = root.querySelector(`[data-cne-points="${CSS.escape(key)}"]`);
        if (!on) { pointsOn.delete(key); if (pointLayers[key]) map.removeLayer(pointLayers[key]); return; }
        pointsOn.add(key);
        const { table } = parseActivity(key);
        if (!pointLayers[key]) {
            try { await rowsOf(table); } catch (error) {
                if (error.name === 'AbortError') return;
                status('No se pudieron cargar las coordenadas.', 5000);
                pointsOn.delete(key);
                if (box) box.checked = false;
                return;
            }
            const group = L.featureGroup();
            pointIndex[key] = new Map();
            for (const row of activityRows(key)) {
                if (row.estatus !== 'Vigente') continue;
                const at = validPoint(row.latitud, row.longitud);
                if (!at) continue;
                const marker = L.circleMarker(at, { pane: 'pmm-cne-points', radius: 7, weight: 2, color: '#ffffff', fillColor: pointColor(table), fillOpacity: 1, className: `pmm-cne-dot pmm-cne-dot-${table}` });
                marker.bindPopup(() => pointPopup(table, row), { className: 'pmm-popup', maxWidth: 320 });
                marker.addTo(group);
                pointIndex[key].set(String(row.numeroPermiso), marker);
            }
            pointLayers[key] = group;
        }
        if (pointsOn.has(key)) pointLayers[key].addTo(map);
    }

    function pointPopup(key, p) {
        return `<div class="pmm-pop" data-sector="cne-${key}">
            <p class="pmm-pop-kicker"><span class="pmm-pin" data-sector="cne-${key}"><b>${CNE_TABLE[key].code}</b></span> ${esc(activityLabel(key, marketOf(p)))}</p>
            <strong>${esc(p.razonSocial)}</strong>
            <p class="pmm-pop-num">${esc(p.numeroPermiso)}</p>
            <dl>${p.tipoPermiso ? `<dt>Tipo</dt><dd>${esc(p.tipoPermiso)}</dd>` : ''}</dl>
            <div class="pmm-pop-actions"><button type="button" class="pm-btn pm-btn-primary" data-cne-detail="${key}" data-numero="${esc(p.numeroPermiso)}">Ver detalle</button></div>
        </div>`;
    }

    // ---------- table ----------
    async function openTable(key, { efId, market } = {}) {
        openKey = key;
        detailRow = null;
        if (efId !== undefined || market !== undefined) {
            filters[key] = { ...filters[key], efId: efId ?? '', market: market ?? '', estatus: 'Vigente', shown: PAGE };
        }
        overlay.hidden = false;
        const title = filters[key].market ? activityLabel(key, filters[key].market) : CNE_TABLE[key].label;
        $('[data-cne-body]').innerHTML = `<div class="pmm-cne-top"><strong>${esc(title)}</strong><button type="button" class="pmm-close" data-cne-close aria-label="Cerrar tabla">×</button></div><p class="pmm-muted" role="status">Cargando permisos…</p>`;
        try {
            await rowsOf(key);
            if (openKey === key) renderTable();
        } catch (error) {
            if (error.name === 'AbortError' || openKey !== key) return;
            $('[data-cne-body]').innerHTML = `<div class="pmm-cne-top"><strong>${esc(title)}</strong><button type="button" class="pmm-close" data-cne-close aria-label="Cerrar tabla">×</button></div>
                <p class="pmm-muted">No se pudo cargar la tabla. <button type="button" class="pm-btn" data-cne-open="${key}">Reintentar</button></p>`;
        }
    }

    function selectHtml(name, label, options, value, all = 'Todos') {
        return `<label class="pmm-cne-field"><span>${esc(label)}</span><select data-cne-filter="${esc(name)}">
            <option value="">${esc(all)}</option>
            ${options.map(o => `<option value="${esc(o.value)}"${o.value === value ? ' selected' : ''}>${esc(o.label)} (${count(o.count)})</option>`).join('')}
        </select></label>`;
    }

    function renderTable() {
        const key = openKey;
        const t = CNE_TABLE[key];
        const rows = data[key].rows || [];
        const f = filters[key];
        if (detailRow) { renderDetail(key, detailRow); return; }
        const inStatus = filterRows(rows, { estatus: f.estatus, market: f.market });
        const result = filterRows(rows, f);
        // Grouped by market: the market selector replaces the raw «Mercado» facet.
        const facets = [...COMMON_FACETS.filter(x => x.key !== 'mercado'), ...t.facets];
        const marketOptions = CNE_MARKETS.map(m => ({ value: m.key, label: m.label, count: filterRows(rows, { estatus: f.estatus, market: m.key }).length })).filter(o => o.count);
        const totals = t.capacity ? capacityTotals(result) : [];
        const noUnit = t.capacity ? result.filter(r => r.capacidad !== null && r.capacidad !== undefined && (r.unidadCapacidad === null || r.unidadCapacidad === undefined || String(r.unidadCapacidad).trim() === '')).length : 0;
        const stateLabel = id => (id === NO_STATE ? 'Sin entidad' : STATE_NAME[id] || id);
        const body = $('[data-cne-body]');
        const focused = document.activeElement?.closest?.('[data-cne-body]') ? document.activeElement.dataset.cneFilter || (document.activeElement.matches('[data-cne-q]') ? 'q' : '') : '';
        body.innerHTML = `
            <div class="pmm-cne-top">
                <strong>${esc(f.market ? activityLabel(key, f.market) : t.label)} <span class="pmm-cne-badge">${t.code}</span></strong>
                <button type="button" class="pm-btn" data-cne-csv>Exportar CSV</button>
                <button type="button" class="pmm-close" data-cne-close aria-label="Cerrar tabla">×</button>
            </div>
            <form class="pmm-cne-filters" data-cne-form>
                <label class="pmm-cne-field pmm-cne-q"><span>Buscar</span><input type="search" data-cne-q value="${esc(f.q)}" placeholder="Número de permiso, razón social o RFC" autocomplete="off" spellcheck="false"></label>
                <label class="pmm-cne-field"><span>Estatus</span><select data-cne-filter="estatus">
                    ${[['Vigente', 'Vigentes'], ['No vigente', 'No vigentes'], ['', 'Todos']].map(([v, l]) => `<option value="${v}"${f.estatus === v ? ' selected' : ''}>${l}</option>`).join('')}
                </select></label>
                ${selectHtml('market', 'Mercado', marketOptions, f.market, 'Todos los mercados')}
                ${selectHtml('efId', 'Estado', stateOptions(inStatus), f.efId, 'Todo México')}
                ${facets.map(x => selectHtml(x.key, x.label, facetOptions(inStatus, x.key), f.facets[x.key] || '')).join('')}
                <button type="button" class="pm-btn" data-cne-reset>Limpiar filtros</button>
            </form>
            <p class="pmm-cne-summary" role="status">${permits(result.length)} de ${count(rows.length)}${f.efId ? ` · ${esc(stateLabel(f.efId))}` : ''}${totals.length ? ` · Capacidad: ${totals.map(x => `${amount(x.total)} ${esc(x.unit)}`).join(' · ')}` : ''}${noUnit ? ` <small>(${count(noUnit)} sin unidad de capacidad no se suman)</small>` : ''}</p>
            <div class="pmm-cne-scroll" tabindex="0" role="region" aria-label="Permisos de ${esc(t.label)}">
                <table class="pmm-cne-grid">
                    <thead><tr><th scope="col">Permiso</th><th scope="col">Razón social</th><th scope="col">Mercado</th><th scope="col">Tipo de permiso</th><th scope="col">${esc(t.column.label)}</th><th scope="col">Estado</th><th scope="col">Otorgamiento</th><th scope="col">Estatus</th></tr></thead>
                    <tbody>${result.slice(0, f.shown).map((r, i) => `<tr>
                        <td><button type="button" class="pmm-cne-link" data-cne-row="${i}">${esc(r.numeroPermiso)}</button></td>
                        <td>${esc(r.razonSocial)}</td>
                        <td>${esc(marketText(r)) || '<span class="pmm-cne-na">Sin especificar</span>'}</td>
                        <td>${esc(r.tipoPermiso)}</td>
                        <td>${esc(r[t.column.key] ?? '') || '<span class="pmm-cne-na">Sin especificar</span>'}</td>
                        <td>${esc(r.efId ? STATE_NAME[String(r.efId).trim().padStart(2, '0')] || r.entidad : '') || '<span class="pmm-cne-na">Sin entidad</span>'}</td>
                        <td>${esc(calendarDate(r.fechaOtorgamiento))}</td>
                        <td><span class="pmm-cne-status${r.estatus === 'Vigente' ? ' is-on' : ''}">${esc(r.estatus)}</span></td>
                    </tr>`).join('') || '<tr><td colspan="8" class="pmm-cne-empty">Ningún permiso coincide con los filtros.</td></tr>'}</tbody>
                </table>
            </div>
            ${result.length > f.shown ? `<button type="button" class="pm-btn pmm-cne-more" data-cne-more>Mostrar ${count(Math.min(PAGE, result.length - f.shown))} más (quedan ${count(result.length - f.shown)})</button>` : ''}
            <p class="pmm-cne-foot">${esc(updatedText(data[key].updated))} · Fuente: CNE, vía DGMESNIE.</p>`;
        body._result = result;
        if (focused === 'q') { const q = body.querySelector('[data-cne-q]'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
        else if (focused) body.querySelector(`[data-cne-filter="${focused}"]`)?.focus();
    }

    function detailItem(label, value) {
        return value === '' || value === null || value === undefined ? '' : `<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`;
    }

    function renderDetail(key, r) {
        const t = CNE_TABLE[key];
        const own = t.details.map(d => {
            if (d.capacity) return detailItem(d.label, amount(r.capacidad) ? `${amount(r.capacidad)} ${r.unidadCapacidad || '(sin unidad)'}`.trim() : '');
            if (d.number) return detailItem(d.label, amount(r[d.key]) ? `${amount(r[d.key])}${d.unit ? ` ${d.unit}` : ''}` : '');
            return detailItem(d.label, r[d.key]);
        }).join('');
        const stateName = r.efId ? STATE_NAME[String(r.efId).trim().padStart(2, '0')] || r.entidad : '';
        const address = [r.calle, r.colonia, r.codigoPostal ? `C.P. ${r.codigoPostal}` : '', r.municipio, stateName].filter(Boolean).join(', ');
        const point = validPoint(r.latitud, r.longitud);
        const link = (href, text) => (safeHref(href) ? `<a class="pm-btn" href="${esc(safeHref(href))}" target="_blank" rel="noopener noreferrer">${text}</a>` : '');
        $('[data-cne-body]').innerHTML = `
            <div class="pmm-cne-top">
                <button type="button" class="pm-btn" data-cne-back>← Volver a la tabla</button>
                <button type="button" class="pmm-close" data-cne-close aria-label="Cerrar tabla">×</button>
            </div>
            <article class="pmm-cne-detail pmm-pop" data-sector="cne-${key}">
                <p class="pmm-pop-kicker"><span class="pmm-pin" data-sector="cne-${key}"><b>${t.code}</b></span> ${esc(activityLabel(key, marketOf(r)))}</p>
                <h3>${esc(r.razonSocial)}</h3>
                <p class="pmm-pop-num">${esc(r.numeroPermiso)}</p>
                <dl>
                    ${detailItem('Estatus', r.estatus)}${detailItem('Estatus CNE', r.estatusCne)}${detailItem('Estatus de la instalación', r.estatusInstalacion)}
                    ${detailItem(marketsOf(r).length > 1 ? 'Mercados' : 'Mercado', marketText(r))}${detailItem('Tipo de permiso', r.tipoPermiso)}${detailItem('Código de actividad', r.codigoActividad)}
                    ${own}
                    ${detailItem('RFC', r.rfc)}${detailItem('Expediente', r.expediente)}
                    ${detailItem('Otorgamiento', calendarDate(r.fechaOtorgamiento))}${detailItem('Inicio de vigencia', calendarDate(r.inicioVigencia))}${detailItem('Término de vigencia', calendarDate(r.terminoVigencia))}
                    ${detailItem('Ubicación', address || 'Sin domicilio registrado')}
                    ${detailItem('Inversión estimada (dato reportado)', amount(r.inversionEstimada))}
                    ${detailItem('Comentarios', r.comentarios)}
                    ${detailItem('Actualizado', mexicoCityTime(r.fechaActualizacion) ? `${mexicoCityTime(r.fechaActualizacion)} (hora de Ciudad de México)` : '')}
                </dl>
                <div class="pmm-pop-actions">
                    ${link(r.ligaPermiso, 'Ver permiso (PDF)')}${link(r.ligaResolucion, 'Ver resolución (PDF)')}
                    ${t.sheet ? `<a class="pm-btn" href="${permitsHash({ permit: r.numeroPermiso })}">Ficha y normativa</a>` : ''}
                    ${point && r.estatus === 'Vigente' ? `<button type="button" class="pm-btn" data-cne-locate="${esc(activityKey(key, marketOf(r)))}" data-numero="${esc(r.numeroPermiso)}">Ver en el mapa</button>` : ''}
                </div>
            </article>`;
        $('[data-cne-body]').querySelector('[data-cne-back]')?.focus();
    }

    async function openDetail(key, numero) {
        try {
            const rows = await rowsOf(key);
            const row = rows.find(r => String(r.numeroPermiso) === String(numero));
            if (!row) { status('No se encontró el permiso en la tabla.', 4000); return; }
            openKey = key;
            detailRow = row;
            overlay.hidden = false;
            map.closePopup();
            renderTable();
        } catch (error) { if (error.name !== 'AbortError') status('No se pudo cargar la tabla.', 5000); }
    }

    async function locate(key, numero) {
        const box = root.querySelector(`[data-cne-points="${CSS.escape(key)}"]`);
        if (box) box.checked = true;
        await showPoints(key, true);
        const marker = pointIndex[key]?.get(String(numero));
        if (!marker) { status('Este permiso no tiene coordenadas vigentes en el mapa.', 4000); return; }
        overlay.hidden = true;
        map.setView(marker.getLatLng(), Math.max(map.getZoom(), 13));
        marker.openPopup();
    }

    function downloadCsv() {
        const key = openKey;
        const t = CNE_TABLE[key];
        const result = $('[data-cne-body]')._result || [];
        const own = t.details.map(d => d.key).filter((k, i, all) => all.indexOf(k) === i);
        const head = ['NumeroPermiso', 'RazonSocial', 'RFC', 'Mercado', 'MercadosAutorizados', 'TipoPermiso', 'Estatus', 'EstatusCNE', 'Estado', 'Municipio', 'FechaOtorgamiento', 'TerminoVigencia', ...own, ...(t.capacity ? ['UnidadCapacidad'] : []), 'LigaPermiso', 'LigaResolucion'];
        const rows = result.map(r => [r.numeroPermiso, r.razonSocial, r.rfc, r.mercado, r.mercadosAutorizados, r.tipoPermiso, r.estatus, r.estatusCne, r.efId ? STATE_NAME[String(r.efId).trim().padStart(2, '0')] || r.entidad : '', r.municipio, r.fechaOtorgamiento, r.terminoVigencia, ...own.map(k => r[k]), ...(t.capacity ? [r.unidadCapacidad] : []), r.ligaPermiso, r.ligaResolucion]);
        const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([`﻿${[head, ...rows].map(r => r.map(q).join(',')).join('\n')}`], { type: 'text/csv;charset=utf-8' }));
        a.download = `permisos_cne_${key}${filters[key].market ? `_${filters[key].market}` : ''}.csv`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    // ---------- events ----------
    const onChange = e => {
        const t = e.target;
        if (t.matches('[data-cne-states]')) showStates(t.dataset.cneStates, t.checked);
        else if (t.matches('[data-cne-points]')) showPoints(t.dataset.cnePoints, t.checked);
        else if (t.matches('[data-cne-filter]') && openKey) {
            const f = filters[openKey];
            const name = t.dataset.cneFilter;
            if (name === 'estatus' || name === 'efId' || name === 'market') f[name] = t.value;
            else f.facets = { ...f.facets, [name]: t.value };
            f.shown = PAGE;
            renderTable();
        }
    };
    let typing = null;
    const onInput = e => {
        if (!e.target.matches('[data-cne-q]') || !openKey) return;
        const value = e.target.value;
        clearTimeout(typing);
        typing = setTimeout(() => { Object.assign(filters[openKey], { q: value, shown: PAGE }); renderTable(); }, 200);
    };
    // Capture: Leaflet keeps clicks inside desktop popups from bubbling.
    const onClick = e => {
        const t = e.target;
        const open = t.closest('[data-cne-open]');
        if (open) {
            e.preventDefault();
            const options = {};
            if (open.dataset.cneMarket !== undefined) options.market = open.dataset.cneMarket;
            if (open.dataset.cneEf) options.efId = open.dataset.cneEf;
            map.closePopup();
            openTable(open.dataset.cneOpen, options);
            return;
        }
        if (t.closest('[data-cne-states-off]')) {
            const box = choroplethKey && root.querySelector(`[data-cne-states="${CSS.escape(choroplethKey)}"]`);
            if (box) box.checked = false;
            clearChoropleth();
            return;
        }
        if (t.closest('[data-cne-reload]')) {
            loading.textContent = 'Cargando otras actividades de la CNE…';
            Promise.allSettled(CNE_TABLES.map(x => rowsOf(x.key).then(renderActivities))).then(results => {
                const failed = results.filter(r => r.status === 'rejected').length;
                loading.hidden = !failed;
                if (failed) loading.innerHTML = `No se pudieron cargar las otras actividades de la CNE. <button type="button" data-cne-reload>Reintentar</button>`;
            });
            return;
        }
        const detail = t.closest('[data-cne-detail]');
        if (detail) { e.preventDefault(); e.stopPropagation(); openDetail(detail.dataset.cneDetail, detail.dataset.numero); return; }
        const row = t.closest('[data-cne-row]');
        if (row) { detailRow = $('[data-cne-body]')._result[Number(row.dataset.cneRow)]; renderTable(); return; }
        if (t.closest('[data-cne-back]')) { detailRow = null; renderTable(); return; }
        if (t.closest('[data-cne-more]')) { filters[openKey].shown += PAGE; renderTable(); return; }
        if (t.closest('[data-cne-reset]')) { filters[openKey] = blankFilters(); renderTable(); return; }
        if (t.closest('[data-cne-csv]')) { downloadCsv(); return; }
        const where = t.closest('[data-cne-locate]');
        if (where) { locate(where.dataset.cneLocate, where.dataset.numero); return; }
        if (t.closest('[data-cne-close]')) { overlay.hidden = true; openKey = null; detailRow = null; }
    };
    const onSubmit = e => { if (e.target.matches('[data-cne-form]')) e.preventDefault(); };
    const onKey = e => { if (e.key === 'Escape' && !overlay.hidden) { overlay.hidden = true; openKey = null; detailRow = null; } };
    root.addEventListener('change', onChange);
    root.addEventListener('input', onInput);
    root.addEventListener('click', onClick, true);
    root.addEventListener('submit', onSubmit);
    document.addEventListener('keydown', onKey);

    return {
        openTable,
        /** The market blocks of the panel are rebuilt by the map view; draw the activities again. */
        refresh: renderActivities,
        destroy() {
            clearTimeout(typing);
            map.off('popupopen', onPopupOpen);
            map.off('click', onMapClick);
            root.removeEventListener('change', onChange);
            root.removeEventListener('input', onInput);
            root.removeEventListener('click', onClick, true);
            root.removeEventListener('submit', onSubmit);
            document.removeEventListener('keydown', onKey);
        },
    };
}
