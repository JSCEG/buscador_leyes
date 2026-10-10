/**
 * Map of energy permits (#mapa-permisos), a tab of the CNE section.
 *
 * Data comes through server/mapa-proxy.js: permits with coordinates, status and location precision
 * from DGMESNIE (tables updated weekly against the CNE public registry), the official PDF links of
 * each permit and its resolutions, and active hurricanes from NOAA. Leaflet is loaded only when the
 * tab opens. Each point links to the permit sheet of this site (#permiso=…), which lists the laws
 * that regulate it.
 */
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { permitsHash, permitKind } from '../lib/cne-api.js';
import { infraType, infraIcon } from '../lib/infra-icons.js';
import '../styles/permits-map.css';

const API = '/api/mapa';
const MEXICO = [[14.3, -118.4], [32.8, -86.6]];

// Same sector colours as the permit cards (permits.css); `code` is the permit-number prefix.
const MARKETS = [
    { key: 'electricidad', sector: 'electricidad', code: 'E', label: 'Generación eléctrica', on: true },
    { key: 'petroliferos', sector: 'petroliferos', code: 'PL', label: 'Petrolíferos', on: false },
    { key: 'gas-lp', sector: 'gaslp', code: 'LP', label: 'Gas LP', on: false },
    { key: 'gas-natural', sector: 'gasnatural', code: 'G', label: 'Gas natural', on: true },
];
const MARKET = Object.fromEntries(MARKETS.map(m => [m.key, m]));
const PRECISION = {
    exacta: 'Ubicación del permiso (fuente oficial)',
    calle: 'Ubicación aproximada por dirección',
    municipio: 'Ubicación aproximada (centro del municipio)',
};
// Network layers (scripts/build-map-networks.mjs builds the files under public/mapa/).
const NETWORKS = [
    { key: 'transmision', file: 'red-transmision.json', label: 'Líneas de transmisión', short: '69 kV o más · OpenStreetMap', swatch: '#c0392b' },
    { key: 'gasoductos', file: 'gasoductos.json', label: 'Gasoductos', short: 'OpenStreetMap · incompleto', swatch: '#2f6690', color: '#2f6690', dash: '6 4' },
    { key: 'petroliferos', file: 'ductos-petroliferos.json', label: 'Ductos de petrolíferos', short: 'CNH · trazo aproximado', swatch: '#86671d', color: '#86671d', dash: '2 4' },
];
const KV_CLASSES = [
    { min: 400, color: '#6c2a8f', weight: 2.6, label: '400 kV' },
    { min: 230, color: '#c0392b', weight: 2.1, label: '230 kV' },
    // Teal and gray, not orange or yellow: those are the roads of the base map.
    { min: 115, color: '#0e7c86', weight: 1.6, label: '115–161 kV' },
    { min: 69, color: '#6f6a66', weight: 1.2, label: '69–115 kV' },
];
export const kvClass = kv => KV_CLASSES.find(c => kv >= c.min) || KV_CLASSES[KV_CLASSES.length - 1];
const CLASSES = { HU: 'Huracán', MH: 'Huracán mayor', TS: 'Tormenta tropical', TD: 'Depresión tropical', STS: 'Tormenta subtropical', STD: 'Depresión subtropical', PTC: 'Potencial ciclón tropical' };
const KT_KMH = 1.852;

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fold = v => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const num = v => (v == null || v === '' || Number.isNaN(Number(v))) ? '' : Number(v).toLocaleString('es-MX', { maximumFractionDigits: 2 });
const date = v => {
    const d = v ? new Date(v) : null;
    return !d || Number.isNaN(d.getTime()) || d.getFullYear() < 1950 ? '' : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
};
const saffir = kt => kt >= 137 ? 5 : kt >= 113 ? 4 : kt >= 96 ? 3 : kt >= 83 ? 2 : kt >= 64 ? 1 : 0;

async function getJson(path, signal) {
    const response = await fetch(`${API}/${path}`, { signal, credentials: 'same-origin' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

/** Point-in-polygon (ray casting) for GeoJSON Polygon / MultiPolygon, [lon, lat]. */
export function insidePolygon([x, y], geometry) {
    const polys = geometry?.type === 'Polygon' ? [geometry.coordinates] : geometry?.type === 'MultiPolygon' ? geometry.coordinates : [];
    const inRing = ring => {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const [xi, yi] = ring[i];
            const [xj, yj] = ring[j];
            if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
        }
        return inside;
    };
    return polys.some(([outer, ...holes]) => inRing(outer) && !holes.some(inRing));
}

/** Filter of the layer: status (vigente) and location precision. */
export function passes(p, { status = 'vigentes', exactOnly = false } = {}) {
    const statusOk = status === 'todos' || (status === 'vigentes' ? p.vigente !== false : p.vigente === false);
    return statusOk && (!exactOnly || (p.precision || 'exacta') === 'exacta');
}

/** Great-circle distance in km between two [lat, lon] points. */
export function distanceKm([lat1, lon1], [lat2, lon2]) {
    const rad = Math.PI / 180;
    const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2
        + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Closest items to `here` ([lat, lon]); each item has `lat` and `lon`. Those within `radiusKm`, or,
 * when none is that close, the `fallback` nearest ones, so the list is never empty far from any plant.
 */
export function nearest(items, here, { radiusKm = 25, limit = 200, fallback = 10 } = {}) {
    const sorted = items.map(item => ({ ...item, km: distanceKm(here, [item.lat, item.lon]) })).sort((a, b) => a.km - b.km);
    const close = sorted.filter(item => item.km <= radiusKm);
    return close.length ? { within: true, items: close.slice(0, limit) } : { within: false, items: sorted.slice(0, fallback) };
}

/** Map layer that holds a permit, from the prefix of its number (CNE/E/…, CNE/PL/…). */
export function marketOf(numero) {
    const sector = permitKind(numero).sector?.id;
    return MARKETS.find(m => m.sector === sector)?.key || null;
}

/**
 * @param {HTMLElement} container
 * @param {{ permit?: string|null }} [options] permit to open on load (shared link)
 * @returns {{ destroy: () => void, focusPermit: (numero: string) => void }}
 */
export async function renderPermitsMapView(container, { permit = null } = {}) {
    // The clustering plugin registers itself on the global L.
    window.L = window.L || L;
    await import('leaflet.markercluster/dist/leaflet.markercluster.js');

    // hiddenTypes: '<market>|<infrastructure label>' switched off in the layers panel.
    const state = { status: 'vigentes', exactOnly: false, hiddenTypes: new Set(), layers: {}, missing: {}, cones: [], timers: [], ctrl: new AbortController() };
    MARKETS.forEach(m => { state.layers[m.key] = { on: m.on }; });

    container.innerHTML = `
        <div class="pmm">
            <div class="pmm-bar">
                <button type="button" class="pmm-back" data-map-back aria-label="Volver a permisos"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>
                <label class="pmm-search">
                    <span class="pmm-sr">Buscar en el mapa</span>
                    <input type="text" autocomplete="off" spellcheck="false" placeholder="Permiso, razón social, estado o municipio" data-q>
                </label>
                <div class="pmm-tools">
                    <button type="button" class="pm-btn" data-toggle-panel aria-expanded="true">Capas</button>
                    <button type="button" class="pm-btn" data-mexico>Todo México</button>
                    <button type="button" class="pm-btn" data-fullscreen>Pantalla completa</button>
                </div>
                <div class="pmm-suggest" data-suggest hidden></div>
            </div>
            <div class="pmm-body">
                <div class="pmm-map" data-map></div>
                <div class="pmm-chipbar" data-chipbar aria-label="Filtros rápidos"></div>
                <div class="pmm-fabs">
                    <button type="button" class="pmm-fab" data-locate aria-label="Mi ubicación"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/><circle cx="12" cy="12" r="7.5"/></svg></button>
                    <button type="button" class="pmm-fab" data-fab-layers aria-label="Capas"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/></svg></button>
                </div>
                <section class="pmm-sheet" data-sheet hidden aria-label="Permiso seleccionado">
                    <button type="button" class="pmm-sheet-handle" data-sheet-toggle aria-label="Expandir"></button>
                    <button type="button" class="pmm-close pmm-sheet-close" data-sheet-close aria-label="Cerrar">×</button>
                    <div class="pmm-sheet-body" data-sheet-body></div>
                </section>
                <aside class="pmm-panel" data-panel aria-label="Capas del mapa">
                    <p class="pmm-h">Permisos</p>
                    <div class="pmm-chips" role="group" aria-label="Estatus">
                        <button type="button" data-status="vigentes" class="is-on">Vigentes</button>
                        <button type="button" data-status="no-vigentes">No vigentes</button>
                        <button type="button" data-status="todos">Todos</button>
                    </div>
                    <div class="pmm-chips"><button type="button" data-exact>Solo ubicaciones exactas</button></div>
                    <div data-markets></div>
                    <p class="pmm-h">Infraestructura</p>
                    ${NETWORKS.map(n => `<label class="pmm-layer"><input type="checkbox" data-network="${n.key}"><span class="pmm-line" style="--line:${n.swatch}"></span><span>${n.label}<small data-network-note="${n.key}">${n.short}</small></span></label>`).join('')}
                    <p class="pmm-kv" data-kv hidden>${KV_CLASSES.map(c => `<span><i style="background:${c.color}"></i>${c.label}</span>`).join('')}</p>
                    <p class="pmm-h">Clima</p>
                    <label class="pmm-layer"><input type="checkbox" data-hurricanes checked><span>Huracanes activos<small>NOAA · cono y trayectoria</small></span></label>
                    <p class="pmm-h">Mapa base</p>
                    <div class="pmm-bases">
                        <label><input type="radio" name="pmm-base" value="mapa" checked> Mapa</label>
                        <label><input type="radio" name="pmm-base" value="claro"> Relieve</label>
                        <label><input type="radio" name="pmm-base" value="calles"> Calles</label>
                        <label><input type="radio" name="pmm-base" value="satelite"> Satélite</label>
                    </div>
                    <p class="pmm-legend"><span class="pmm-pin" data-sector="electricidad">${infraIcon('solar', 11)}</span> Ubicación del permiso
                        <span class="pmm-pin is-aprox" data-sector="electricidad">${infraIcon('solar', 11)}</span> Aproximada
                        <span class="pmm-pin is-novig" data-sector="electricidad">${infraIcon('solar', 11)}</span> No vigente</p>
                    <p class="pmm-updated" data-updated>Consultando fecha de actualización…</p>
                </aside>
                <aside class="pmm-results" data-results hidden aria-label="Resultados">
                    <div class="pmm-results-head"><strong data-results-title></strong><button type="button" class="pmm-close" data-results-close aria-label="Cerrar">×</button></div>
                    <div class="pmm-results-actions"><button type="button" class="pm-btn" data-results-csv>Exportar CSV</button></div>
                    <div class="pmm-results-list" data-results-list></div>
                </aside>
                <button type="button" class="pmm-storm" data-storm hidden></button>
                <p class="pmm-status" data-status-msg hidden role="status"></p>
            </div>
            <p class="pmm-note">Coordenadas, estatus y ligas: DGMESNIE con el registro público de la CNE (actualización semanal). Los puntos con anillo punteado son ubicaciones aproximadas.</p>
        </div>`;

    const $ = sel => container.querySelector(sel);
    const status = (msg, ms) => {
        const el = $('[data-status-msg]');
        clearTimeout(status.t);
        el.hidden = !msg;
        el.textContent = msg || '';
        if (msg && ms) status.t = setTimeout(() => { el.hidden = true; }, ms);
    };

    // ---------- map ----------
    const map = L.map($('[data-map]'), { zoomControl: false, preferCanvas: true, minZoom: 3.5, maxZoom: 19, zoomSnap: 0.5 });
    const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
    // On phones the map takes the whole screen, like a maps app (styles under body.pmm-open).
    document.body.classList.add('pmm-open');
    // Fit México in the part of the screen the search box and chips leave free.
    const fitMexico = () => map.fitBounds(MEXICO, isMobile() ? { paddingTopLeft: [0, 110], paddingBottomRight: [0, 10] } : {});
    if (!isMobile()) {
        L.control.zoom({ position: 'bottomright' }).addTo(map);
        L.control.scale({ position: 'bottomright', imperial: false }).addTo(map);
    }
    fitMexico();
    const resizeObserver = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    resizeObserver.observe($('[data-map]'));
    const BASES = {
        // Default: streets, towns and states labelled at every zoom (the terrain base has no labels
        // when zoomed in, so on a phone there was nothing to find your way by). Esri needs no key.
        // Dark mode: dark gray canvas with its labels layer on top.
        mapa: () => {
            const esri = (name, zIndex, native = 16) => L.tileLayer(`https://server.arcgisonline.com/ArcGIS/rest/services/${name}/MapServer/tile/{z}/{y}/{x}`, { maxZoom: 19, maxNativeZoom: native, zIndex, attribution: 'Tiles &copy; Esri' });
            if (!document.documentElement.classList.contains('dark-mode')) return esri('World_Street_Map', 1, 18);
            return L.layerGroup([esri('Canvas/World_Dark_Gray_Base', 1), esri('Canvas/World_Dark_Gray_Reference', 2)]);
        },
        claro: () => L.tileLayer('https://tiles.maps.eox.at/wmts/1.0.0/terrain-light_3857/default/g/{z}/{y}/{x}.jpg', { maxZoom: 19, maxNativeZoom: 16, attribution: 'Terrain Light &copy; EOX · &copy; OpenStreetMap' }),
        calles: () => L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { subdomains: 'abc', maxZoom: 19, attribution: '&copy; OpenStreetMap' }),
        satelite: () => L.tileLayer('https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/g/{z}/{y}/{x}.jpg', { maxZoom: 19, maxNativeZoom: 16, attribution: 'Sentinel-2 cloudless &copy; EOX' }),
    };
    let base = BASES.mapa().addTo(map);

    // ---------- permit layers ----------
    const icons = new Map();
    const iconFor = (m, p) => {
        const mods = [p.vigente === false ? 'is-novig' : '', (p.precision || 'exacta') !== 'exacta' ? 'is-aprox' : ''].filter(Boolean).join(' ');
        const type = infraType(m.key, p);
        const key = `${m.key}|${type.icon}|${mods}`;
        if (!icons.has(key)) {
            icons.set(key, L.divIcon({ className: 'pmm-pin-wrap', html: `<span class="pmm-pin ${mods}" data-sector="${m.sector}">${infraIcon(type.icon, 13)}</span>`, iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -10] }));
        }
        return icons.get(key);
    };
    // One cluster group for every market, so groups of different sectors no longer cover each
    // other. Each bubble is a ring split by sector, in proportion to what it holds.
    const newCluster = () => L.markerClusterGroup({
        chunkedLoading: true,
        showCoverageOnHover: false,
        disableClusteringAtZoom: 15,
        maxClusterRadius: z => (z < 8 ? 60 : 40),
        iconCreateFunction: cluster => {
            const n = cluster.getChildCount();
            const size = n < 50 ? 32 : n < 500 ? 38 : 46;
            const bySector = {};
            for (const child of cluster.getAllChildMarkers()) bySector[child.options.sector] = (bySector[child.options.sector] || 0) + 1;
            let at = 0;
            const stops = MARKETS.filter(m => bySector[m.sector]).map(m => {
                const from = at;
                at += (bySector[m.sector] / n) * 100;
                return `var(--c-${m.sector}) ${from.toFixed(1)}% ${at.toFixed(1)}%`;
            });
            const label = n >= 1000 ? `${Math.round(n / 100) / 10}k` : n;
            return L.divIcon({ className: 'pmm-pin-wrap', html: `<span class="pmm-cluster" style="width:${size}px;height:${size}px;background:conic-gradient(${stops.join(',')})"><b>${label}</b></span>`, iconSize: [size, size] });
        },
    });

    const typeKey = (m, label) => `${m.key}|${label}`;
    const visible = (m, p) => passes(p, state) && !state.hiddenTypes.has(typeKey(m, infraType(m.key, p).label));

    let cluster = null;
    function paint() {
        // A fresh group each time: clearing one still adding in chunks corrupts MarkerCluster.
        if (cluster) map.removeLayer(cluster);
        cluster = newCluster();
        const markers = [];
        for (const m of MARKETS) {
            const layer = state.layers[m.key];
            layer.index = new Map();
            if (!layer.on || !layer.data) continue;
            for (const f of layer.data) {
                const p = f.properties || {};
                if (!visible(m, p)) continue;
                const [lon, lat] = f.geometry.coordinates;
                const marker = L.marker([lat, lon], { icon: iconFor(m, p), title: `${infraType(m.key, p).label} · ${p.nombre}`, keyboard: false, sector: m.sector });
                marker.feature = f;
                marker.bindPopup(() => popupHtml(m, p, lat, lon), { className: 'pmm-popup', maxWidth: 340 });
                marker.on('popupopen', ev => {
                    if (isMobile()) { marker.closePopup(); openSheet(m, p, lat, lon); return; }
                    fillLinks(ev.popup, p.numeroPermiso);
                });
                layer.index.set(p.numeroPermiso, marker);
                markers.push(marker);
            }
        }
        cluster.addLayers(markers);
        map.addLayer(cluster);
        renderCounts();
    }

    async function load(key) {
        const layer = state.layers[key];
        if (layer.data) return;
        if (!layer.loading) {
            status(`Cargando ${MARKET[key].label.toLowerCase()}…`);
            layer.loading = Promise.all([
                getJson(`capa?tipo=${key}`, state.ctrl.signal),
                getJson(`sin-ubicacion?tipo=${key}`, state.ctrl.signal).catch(() => []),
            ]).then(([geo, missing]) => {
                layer.data = geo.features || [];
                state.missing[key] = missing;
                status('');
            }).catch(error => {
                if (error.name !== 'AbortError') status(`No se pudo cargar ${MARKET[key].label.toLowerCase()}.`, 5000);
                layer.on = false;
                const box = container.querySelector(`[data-market="${key}"]`);
                if (box) box.checked = false;
            }).finally(() => { layer.loading = null; });
        }
        await layer.loading;
    }

    async function toggle(key, on) {
        const layer = state.layers[key];
        layer.on = on;
        if (!on) { paint(); countInCones(); return; }
        await load(key);
        if (layer.on && layer.data) paint();
        countInCones();
    }

    function renderMarkets() {
        $('[data-markets]').innerHTML = MARKETS.map(m => `
            <label class="pmm-layer" data-sector="${m.sector}">
                <input type="checkbox" data-market="${m.key}" ${state.layers[m.key].on ? 'checked' : ''}>
                <span class="pmm-pin" data-sector="${m.sector}"><b>${m.code}</b></span>
                <span>${m.label}<small data-count="${m.key}"></small></span>
            </label>
            <ul class="pmm-types" data-types="${m.key}"></ul>
            <button type="button" class="pmm-missing" data-missing="${m.key}" hidden></button>`).join('');
    }

    function renderCounts() {
        for (const m of MARKETS) {
            const layer = state.layers[m.key];
            const count = container.querySelector(`[data-count="${m.key}"]`);
            const types = container.querySelector(`[data-types="${m.key}"]`);
            if (types) {
                const byType = new Map();
                if (layer.on) {
                    for (const f of layer.data || []) {
                        const p = f.properties || {};
                        if (!passes(p, state)) continue;
                        const t = infraType(m.key, p);
                        const row = byType.get(t.label) || { ...t, n: 0 };
                        row.n += 1;
                        byType.set(t.label, row);
                    }
                }
                // Each technology switches on and off; the count is what the status filter leaves.
                types.innerHTML = [...byType.values()].sort((a, b) => b.n - a.n).map(t => {
                    const off = state.hiddenTypes.has(typeKey(m, t.label));
                    return `<li data-sector="${m.sector}"><button type="button" class="pmm-type${off ? ' is-off' : ''}" data-type="${esc(typeKey(m, t.label))}" aria-pressed="${!off}"><span>${infraIcon(t.icon, 13)} ${esc(t.label)}</span><span>${t.n.toLocaleString('es-MX')}</span></button></li>`;
                }).join('');
            }
            const missingBtn = container.querySelector(`[data-missing="${m.key}"]`);
            if (count) count.textContent = layer.data && layer.on ? `${layer.index ? layer.index.size.toLocaleString('es-MX') : 0} en el mapa` : '';
            const missing = (state.missing[m.key] || []).filter(x => passes({ vigente: x.esVigente }, { status: state.status }));
            if (missingBtn) {
                missingBtn.hidden = !layer.on || !state.missing[m.key];
                missingBtn.textContent = `Sin coordenadas: ${missing.length.toLocaleString('es-MX')}`;
                missingBtn.disabled = missing.length === 0;
            }
        }
    }

    function setFilters(changes) {
        Object.assign(state, changes);
        container.querySelectorAll('[data-status]').forEach(b => b.classList.toggle('is-on', b.dataset.status === state.status));
        $('[data-exact]').classList.toggle('is-on', state.exactOnly);
        paint();
        countInCones();
    }

    // ---------- popup ----------
    function popupHtml(m, p, lat, lon) {
        const rows = [];
        const add = (k, v) => { if (v) rows.push(`<dt>${k}</dt><dd>${esc(v)}</dd>`); };
        const type = infraType(m.key, p);
        add('Mercado', m.label);
        add('Infraestructura', type.label);
        add('Tipo', p.tipoPermiso);
        add('Tecnología', p.tecnologia);
        add('Estatus', `${p.estatus || ''}${p.vigente === false && !fold(p.estatus).includes('vigente') ? ' · no vigente' : ''}`);
        add('Otorgamiento', date(p.fechaOtorgamiento));
        const capacity = p.capacidad > 0 ? `${num(p.capacidad)} ${p.unidadCapacidad || ''}`.trim() : (p.capacidadTexto && p.capacidadTexto !== '0' ? p.capacidadTexto : '');
        add('Capacidad', capacity);
        add('Ubicación', [p.municipioNombre, p.entidadNombre].filter(Boolean).join(', '));
        add('Precisión', PRECISION[p.precision || 'exacta'] || PRECISION.exacta);
        return `<div class="pmm-pop" data-sector="${m.sector}">
            <p class="pmm-pop-kicker"><span class="pmm-pin" data-sector="${m.sector}">${infraIcon(type.icon, 12)}</span> ${esc(type.label)}</p>
            <strong>${esc(p.nombre)}</strong>
            <p class="pmm-pop-num">${esc(p.numeroPermiso)}</p>
            <dl>${rows.join('')}</dl>
            <div class="pmm-pop-actions">
                <a class="pm-btn pm-btn-primary" href="${permitsHash({ permit: p.numeroPermiso })}">Ficha y normativa</a>
                <button type="button" class="pm-btn" data-share="${esc(p.numeroPermiso)}">Compartir</button>
                <span data-links="${esc(p.numeroPermiso)}">${linksHtml(p.numeroPermiso)}</span>
                ${(p.precision || 'exacta') === 'exacta' ? `<a class="pm-btn" href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lon}" target="_blank" rel="noopener">Street View</a>` : ''}
            </div></div>`;
    }

    // Official links (permit and resolutions). The popup content is a function, so popup.update()
    // rebuilds it: the links go in through this cache instead of being injected into the DOM.
    const linksCache = new Map();
    function linksHtml(numero) {
        const l = linksCache.get(numero);
        // Without a link in the registry the popup stays without these buttons.
        if (!l?.encontrado) return '';
        const link = (href, text) => (href ? `<a class="pm-btn" href="${esc(href)}" target="_blank" rel="noopener">${text}</a>` : '');
        const resolutions = l.resoluciones || [];
        return link(l.ligaPermiso, 'Ver permiso') + link(l.ligaResolucion, 'Ver resolución')
            + (resolutions.length > 1 ? `<details class="pmm-res"><summary>Resoluciones (${resolutions.length})</summary><ul>${resolutions.map(r => `<li><a href="${esc(r.liga)}" target="_blank" rel="noopener">${esc(r.numero)}</a></li>`).join('')}</ul></details>` : '');
    }
    async function fillLinks(popup, numero) {
        if (linksCache.has(numero)) return;
        try {
            linksCache.set(numero, await getJson(`ligas?numero=${encodeURIComponent(numero)}`));
            if (popup.isOpen()) popup.update();
        } catch { linksCache.set(numero, null); /* the popup keeps working without links */ }
    }

    // ---------- phone: bottom sheet, quick chips and my location (Google Maps style) ----------
    let sheetKey = null;
    async function openSheet(m, p, lat, lon) {
        const sheet = $('[data-sheet]');
        sheetKey = p.numeroPermiso;
        const render = () => { $('[data-sheet-body]').innerHTML = popupHtml(m, p, lat, lon); };
        render();
        $('[data-results]').hidden = true;
        if (isMobile()) $('[data-panel]').hidden = true;
        sheet.classList.remove('is-open');
        sheet.hidden = false;
        $('[data-storm]').classList.add('is-behind');
        // Point above the sheet, as in Google Maps: shift by half the sheet height.
        const target = map.project([lat, lon]).add([0, sheet.offsetHeight / 2]);
        map.panTo(map.unproject(target), { animate: true });
        if (!linksCache.has(p.numeroPermiso)) {
            try { linksCache.set(p.numeroPermiso, await getJson(`ligas?numero=${encodeURIComponent(p.numeroPermiso)}`)); } catch { linksCache.set(p.numeroPermiso, null); }
            if (sheetKey === p.numeroPermiso && !sheet.hidden) render();
        }
    }
    function closeSheet() { $('[data-sheet]').hidden = true; $('[data-storm]').classList.remove('is-behind'); sheetKey = null; }

    const STATUS_CYCLE = { vigentes: 'todos', todos: 'no-vigentes', 'no-vigentes': 'vigentes' };
    const STATUS_LABEL = { vigentes: 'Vigentes', todos: 'Todos', 'no-vigentes': 'No vigentes' };
    function renderChips() {
        $('[data-chipbar]').innerHTML = `<button type="button" class="pmm-qchip is-status" data-qstatus>${STATUS_LABEL[state.status]} ▾</button>${MARKETS.map(m => `
            <button type="button" class="pmm-qchip ${state.layers[m.key].on ? 'is-on' : ''}" data-qmarket="${m.key}" data-sector="${m.sector}"><span class="pmm-pin" data-sector="${m.sector}"><b>${m.code}</b></span>${m.label}</button>`).join('')}`;
    }

    let locateLayer = null;
    function locate() {
        if (!navigator.geolocation) { status('Tu navegador no comparte la ubicación.', 4000); return; }
        status('Buscando tu ubicación…');
        navigator.geolocation.getCurrentPosition(pos => {
            const { latitude, longitude, accuracy } = pos.coords;
            if (locateLayer) map.removeLayer(locateLayer);
            locateLayer = L.layerGroup([
                L.circle([latitude, longitude], { radius: Math.min(accuracy, 2000), color: '#1a73e8', weight: 1, fillColor: '#1a73e8', fillOpacity: 0.12, interactive: false }),
                L.circleMarker([latitude, longitude], { radius: 7, color: '#ffffff', weight: 2.5, fillColor: '#1a73e8', fillOpacity: 1, interactive: false }),
            ]).addTo(map);
            map.setView([latitude, longitude], Math.max(map.getZoom(), 13));
            status('');
            showNearby([latitude, longitude]);
        }, () => status('No se pudo obtener tu ubicación (revisa el permiso del navegador).', 5000), { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
    }

    // ---------- near me: permits of the layers on, closest first ----------
    function showNearby(here) {
        const points = [];
        for (const m of MARKETS) {
            const layer = state.layers[m.key];
            if (!layer.on || !layer.data) continue;
            for (const f of layer.data) {
                const p = f.properties || {};
                if (!visible(m, p)) continue;
                const [lon, lat] = f.geometry.coordinates;
                points.push({ m, p, lat, lon });
            }
        }
        if (!points.length) return;
        const { within, items } = nearest(points, here);
        state.near = items;
        const km = d => (d < 1 ? `${Math.round(d * 1000)} m` : `${d.toLocaleString('es-MX', { maximumFractionDigits: d < 10 ? 1 : 0 })} km`);
        const html = `${within ? '' : '<p class="pmm-muted">No hay permisos a menos de 25 km; estos son los más cercanos.</p>'}${items.map((x, i) => `
            <button type="button" class="pmm-item" data-near="${i}"><strong>${esc(x.p.nombre)}</strong>
                <small><span class="pmm-near-km">${km(x.km)}</span> · ${esc(infraType(x.m.key, x.p).label)} · ${esc(x.p.numeroPermiso)}</small></button>`).join('')}`;
        showResults(within ? `${items.length.toLocaleString('es-MX')} ${items.length === 1 ? 'permiso' : 'permisos'} a menos de 25 km` : 'Permisos más cercanos', html,
            [['Distancia_km', 'Mercado', 'Permiso', 'RazonSocial', 'Estado', 'Municipio'], ...items.map(x => [x.km.toFixed(2), x.m.label, x.p.numeroPermiso, x.p.nombre, x.p.entidadNombre, x.p.municipioNombre])]);
    }

    // ---------- shareable link to one point ----------
    async function share(numero) {
        const url = `${location.origin}${location.pathname}${permitsHash({ mapPermit: numero })}`;
        if (navigator.share && isMobile()) {
            try { await navigator.share({ title: `Permiso ${numero} en el mapa`, url }); } catch { /* cancelled */ }
            return;
        }
        try { await navigator.clipboard.writeText(url); status('Enlace copiado.', 2500); } catch { window.prompt('Copia el enlace:', url); }
    }
    async function focusPermit(numero) {
        const tipo = marketOf(numero);
        if (!tipo) { status('Este permiso no está en el mapa.', 4000); return; }
        await flyTo({ tipo, numeroPermiso: numero });
    }

    // ---------- results panel (search, permits without coordinates, hurricane cone) ----------
    let csvRows = null;
    function showResults(title, html, rows) {
        $('[data-results-title]').textContent = title;
        $('[data-results-list]').innerHTML = html;
        csvRows = rows;
        $('[data-results-csv]').hidden = !rows?.length;
        $('[data-results]').hidden = false;
    }
    function downloadCsv() {
        if (!csvRows?.length) return;
        const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
        const text = `﻿${csvRows.map(r => r.map(q).join(',')).join('\n')}`;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
        a.download = 'permisos_mapa.csv';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    function showMissing(key) {
        const m = MARKET[key];
        const list = (state.missing[key] || []).filter(x => passes({ vigente: x.esVigente }, { status: state.status }));
        const groups = new Map();
        list.forEach(x => {
            const g = `${x.municipio || 'Municipio sin dato'}, ${x.entidad || 'Estado sin dato'}`;
            if (!groups.has(g)) groups.set(g, []);
            groups.get(g).push(x);
        });
        const html = `<p class="pmm-muted">No se pintan: sus coordenadas faltan, valen 0 o caen fuera de México.</p>${[...groups.entries()].map(([g, xs]) => `
            <p class="pmm-group">${esc(g)} <span>${xs.length}</span></p>
            ${xs.map(x => `<a class="pmm-item" href="${permitsHash({ permit: x.numeroPermiso })}"><strong>${esc(x.nombre)}</strong><small>${esc(x.numeroPermiso)} · ${esc(x.estatus)}</small></a>`).join('')}`).join('')}`;
        showResults(`Sin coordenadas · ${m.label} (${list.length.toLocaleString('es-MX')})`, html,
            [['Permiso', 'RazonSocial', 'Estado', 'Municipio', 'Estatus'], ...list.map(x => [x.numeroPermiso, x.nombre, x.entidad, x.municipio, x.estatus])]);
    }

    async function flyTo(item) {
        const key = item.tipo;
        const box = container.querySelector(`[data-market="${key}"]`);
        if (!state.layers[key].on) { if (box) box.checked = true; await toggle(key, true); }
        else await load(key);
        let marker = state.layers[key].index?.get(item.numeroPermiso);
        if (!marker && (state.status !== 'todos' || state.exactOnly)) {
            setFilters({ status: 'todos', exactOnly: false });
            marker = state.layers[key].index?.get(item.numeroPermiso);
        }
        if (!marker) { status(item.latitud == null ? 'Este permiso no tiene coordenadas.' : 'El permiso no está en el mapa.', 4000); return; }
        map.invalidateSize({ pan: false });
        map.once('moveend', () => setTimeout(() => {
            if (isMobile()) openSheet(MARKET[key], marker.feature?.properties || item, marker.getLatLng().lat, marker.getLatLng().lng);
            else marker.openPopup();
        }, 60));
        map.setView(marker.getLatLng(), Math.max(map.getZoom(), 16));
    }

    // ---------- search (DGMESNIE in-memory index through the proxy) ----------
    let suggestTimer = null;
    let suggestCtrl = null;
    let suggestItems = [];
    const input = $('[data-q]');
    function renderSuggest(term, data, loading) {
        const box = $('[data-suggest]');
        suggestItems = data?.resultados || [];
        box.innerHTML = loading ? '<p class="pmm-muted">Buscando…</p>'
            : suggestItems.length ? `${suggestItems.map((r, i) => `<button type="button" data-i="${i}"><span class="pmm-pin" data-sector="${MARKET[r.tipo]?.sector || 'otro'}"><b>${MARKET[r.tipo]?.code || '?'}</b></span>
                <span><strong>${esc(r.nombre)}</strong><small>${esc(r.numeroPermiso)} · ${esc([r.municipio, r.entidad].filter(Boolean).join(', '))}${r.vigente === false ? ' · no vigente' : ''}</small></span></button>`).join('')}
                <button type="button" class="pmm-all" data-all>Ver los ${Number(data.total || 0).toLocaleString('es-MX')} permisos que coinciden con «${esc(term)}»</button>`
            : '<p class="pmm-muted">Sin coincidencias.</p>';
        box.hidden = false;
    }
    input.addEventListener('input', () => {
        const term = input.value.trim();
        clearTimeout(suggestTimer);
        if (term.length < 2) { $('[data-suggest]').hidden = true; return; }
        renderSuggest(term, null, true);
        suggestTimer = setTimeout(async () => {
            suggestCtrl?.abort();
            suggestCtrl = new AbortController();
            try {
                const data = await getJson(`buscar?q=${encodeURIComponent(term)}&limite=8`, suggestCtrl.signal);
                if (input.value.trim() === term) renderSuggest(term, data, false);
            } catch (error) { if (error.name !== 'AbortError') renderSuggest(term, { resultados: [] }, false); }
        }, 260);
    });
    async function searchAll() {
        const term = input.value.trim();
        if (term.length < 2) return;
        $('[data-suggest]').hidden = true;
        status(`Buscando «${term}»…`);
        try {
            const data = await getJson(`buscar?q=${encodeURIComponent(term)}&limite=500`);
            status('');
            const items = data.resultados || [];
            state.found = items;
            const html = items.map((r, i) => `<button type="button" class="pmm-item" data-found="${i}"><strong>${esc(r.nombre)}</strong>
                <small>${esc(MARKET[r.tipo]?.label || r.tipo)} · ${esc(r.numeroPermiso)} · ${esc([r.municipio, r.entidad].filter(Boolean).join(', '))}${r.vigente === false ? ' · no vigente' : ''}</small></button>`).join('') || '<p class="pmm-muted">Sin resultados.</p>';
            showResults(`${Number(data.total || 0).toLocaleString('es-MX')} permisos · «${term}»`, html,
                [['Mercado', 'Permiso', 'RazonSocial', 'Estatus', 'Estado', 'Municipio', 'Latitud', 'Longitud'], ...items.map(r => [MARKET[r.tipo]?.label || r.tipo, r.numeroPermiso, r.nombre, r.estatus, r.entidad, r.municipio, r.latitud, r.longitud])]);
        } catch { status('No fue posible completar la búsqueda.', 4000); }
    }
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); searchAll(); }
        if (e.key === 'Escape') $('[data-suggest]').hidden = true;
    });

    // ---------- hurricanes (NOAA) and permits inside the forecast cone ----------
    let stormLayer = null;
    async function loadHurricanes() {
        try {
            const data = await getJson('huracanes', state.ctrl.signal);
            if (!$('[data-hurricanes]').checked) return;
            if (stormLayer) map.removeLayer(stormLayer);
            const byKind = { cono: [], historico: [], pronostico: [], punto: [] };
            (data.features || []).forEach(f => (byKind[f.properties.capa] || []).push(f));
            stormLayer = L.featureGroup([
                L.geoJSON(byKind.cono, { interactive: false, style: { color: '#5E5A55', weight: 1.2, dashArray: '4 3', fillColor: '#ffffff', fillOpacity: 0.28 } }),
                L.geoJSON(byKind.historico, { interactive: false, style: { color: '#5E5A55', weight: 2 } }),
                L.geoJSON(byKind.pronostico, { interactive: false, style: { color: '#1c1b1a', weight: 2, dashArray: '6 4' } }),
            ]);
            (data.tormentas || []).forEach(t => {
                if (t.latitud == null) return;
                const cat = saffir(t.intensidadKt || 0);
                L.marker([t.latitud, t.longitud], {
                    icon: L.divIcon({ className: 'pmm-pin-wrap', html: `<span class="pmm-storm-pin">${cat || '•'}</span><span class="pmm-storm-name">${esc(t.nombre)}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] }),
                    zIndexOffset: 2000,
                }).bindPopup(`<div class="pmm-pop"><strong>${esc(CLASSES[t.clasificacion] || t.clasificacion)} ${esc(t.nombre)}</strong><dl>
                    ${cat ? `<dt>Categoría</dt><dd>${cat}</dd>` : ''}
                    ${t.intensidadKt ? `<dt>Viento</dt><dd>${Math.round(t.intensidadKt * KT_KMH)} km/h</dd>` : ''}
                    ${t.presionMb ? `<dt>Presión</dt><dd>${t.presionMb} mb</dd>` : ''}</dl>
                    ${t.aviso ? `<div class="pmm-pop-actions"><a class="pm-btn" href="${esc(t.aviso)}" target="_blank" rel="noopener">Aviso NHC</a></div>` : ''}</div>`, { className: 'pmm-popup' }).addTo(stormLayer);
            });
            stormLayer.addTo(map);
            state.cones = byKind.cono.map(f => {
                const t = (data.tormentas || []).find(s => s.id === f.properties.tormentaId) || {};
                return { feature: f, name: t.nombre || f.properties.stormname || 'Ciclón' };
            });
            countInCones();
        } catch (error) { if (error.name !== 'AbortError') status('No fue posible consultar al National Hurricane Center.', 4000); }
    }
    function countInCones() {
        const box = $('[data-storm]');
        if (!$('[data-hurricanes]').checked || !state.cones.length) { box.hidden = true; return; }
        const bbox = geometry => {
            const pts = (geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates).flat(2);
            return pts.reduce((b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)], [Infinity, Infinity, -Infinity, -Infinity]);
        };
        const results = state.cones.map(c => {
            const [minX, minY, maxX, maxY] = bbox(c.feature.geometry);
            const items = [];
            for (const m of MARKETS) {
                const layer = state.layers[m.key];
                if (!layer.on || !layer.data) continue;
                for (const f of layer.data) {
                    const p = f.properties || {};
                    const [x, y] = f.geometry.coordinates;
                    if (x < minX || x > maxX || y < minY || y > maxY || !visible(m, p)) continue;
                    if (insidePolygon(f.geometry.coordinates, c.feature.geometry)) items.push({ m, p, coords: f.geometry.coordinates });
                }
            }
            return { ...c, items };
        }).filter(c => c.items.length);
        state.inCone = results;
        box.hidden = !results.length;
        // One short line; the list per storm opens on tap.
        const total = results.reduce((sum, c) => sum + c.items.length, 0);
        const names = results.map(c => c.name).join(' y ');
        box.innerHTML = `<span aria-hidden="true">🌀</span> <b>${esc(names)}</b> · ${total.toLocaleString('es-MX')} ${total === 1 ? 'permiso' : 'permisos'} en el cono <span class="pmm-storm-more" aria-hidden="true">›</span>`;
        box.setAttribute('aria-label', `${results.map(c => `${c.name}: ${c.items.length} permisos en el cono`).join('; ')}. Ver la lista`);
    }
    function showCone() {
        const rows = [['Ciclon', 'Mercado', 'Permiso', 'RazonSocial', 'Estado', 'Municipio']];
        const html = (state.inCone || []).map(c => `<p class="pmm-group">${esc(c.name)} <span>${c.items.length}</span></p>${c.items.map(x => {
            rows.push([c.name, x.m.label, x.p.numeroPermiso, x.p.nombre, x.p.entidadNombre, x.p.municipioNombre]);
            return `<a class="pmm-item" href="${permitsHash({ permit: x.p.numeroPermiso })}"><strong>${esc(x.p.nombre)}</strong><small>${esc(x.m.label)} · ${esc(x.p.numeroPermiso)} · ${esc([x.p.municipioNombre, x.p.entidadNombre].filter(Boolean).join(', '))}</small></a>`;
        }).join('')}`).join('');
        showResults('Permisos en el cono de pronóstico (capas encendidas)', html, rows);
    }

    // ---------- network layers: transmission lines and pipelines (static files, loaded on demand) ----------
    // Their own pane, under the permits and the hurricane cones; a wider click tolerance for thin lines.
    map.createPane('pmm-networks').style.zIndex = 350;
    const networkRenderer = L.canvas({ pane: 'pmm-networks', tolerance: 8 });
    const networks = {};
    async function toggleNetwork(key, on) {
        const n = NETWORKS.find(x => x.key === key);
        const entry = networks[key] || (networks[key] = {});
        if (key === 'transmision') $('[data-kv]').hidden = !on;
        if (!on) { if (entry.layer) map.removeLayer(entry.layer); return; }
        if (!entry.layer) {
            status(`Cargando ${n.label.toLowerCase()}…`);
            try {
                const response = await fetch(`/mapa/${n.file}`, { signal: state.ctrl.signal });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                status('');
                const note = container.querySelector(`[data-network-note="${key}"]`);
                if (note) note.textContent = `${n.short} · ${Number(data.km || 0).toLocaleString('es-MX')} km`;
                entry.layer = L.geoJSON(data, {
                    attribution: n.key === 'petroliferos' ? 'Ductos: CNH' : '&copy; OpenStreetMap',
                    pane: 'pmm-networks',
                    renderer: networkRenderer,
                    style: f => (key === 'transmision'
                        ? { color: kvClass(f.properties.kv).color, weight: kvClass(f.properties.kv).weight, opacity: 0.85 }
                        : { color: n.color, weight: 2.2, opacity: 0.9, dashArray: n.dash }),
                    onEachFeature: (f, layer) => layer.bindPopup(() => networkPopup(n, f.properties, data), { className: 'pmm-popup', maxWidth: 300 }),
                });
            } catch (error) {
                if (error.name !== 'AbortError') status(`No se pudo cargar ${n.label.toLowerCase()}.`, 5000);
                const box = container.querySelector(`[data-network="${key}"]`);
                if (box) box.checked = false;
                if (key === 'transmision') $('[data-kv]').hidden = true;
                return;
            }
        }
        if (container.querySelector(`[data-network="${key}"]`)?.checked) entry.layer.addTo(map);
    }
    function networkPopup(n, p, data) {
        const rows = [];
        const add = (k, v) => { if (v) rows.push(`<dt>${k}</dt><dd>${esc(v)}</dd>`); };
        add('Tensión', p.kv ? `${num(p.kv)} kV` : '');
        add('Servicio', p.servicio);
        add('Región', p.region);
        add('Operador', p.operador);
        // OpenStreetMap splits lines into short pieces; only the CNH pipelines are whole routes.
        if (n.key === 'petroliferos') add('Longitud', p.km ? `${num(p.km)} km` : '');
        const title = p.nombre || (p.kv ? `Línea de ${num(p.kv)} kV` : 'Sin nombre registrado');
        return `<div class="pmm-pop"><p class="pmm-pop-kicker"><span class="pmm-line" style="--line:${n.key === 'transmision' ? kvClass(p.kv).color : n.swatch}"></span> ${esc(n.label)}</p>
            <strong>${esc(title)}</strong><dl>${rows.join('')}</dl>
            <p class="pmm-muted">${esc(data.fuente)}. ${esc(data.nota)}</p></div>`;
    }

    // ---------- update date ----------
    getJson('actualizacion', state.ctrl.signal).then(a => {
        $('[data-updated]').textContent = a?.disponible && a.general
            ? `Datos actualizados al ${new Date(a.general).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })} · Fuente: CNE`
            : 'Fecha de actualización no disponible';
    }).catch(() => { $('[data-updated]').textContent = 'Fecha de actualización no disponible'; });

    // ---------- events ----------
    renderMarkets();
    container.addEventListener('change', e => {
        const t = e.target;
        if (t.matches('[data-market]')) { toggle(t.dataset.market, t.checked).then(renderChips); renderChips(); }
        else if (t.matches('[data-network]')) toggleNetwork(t.dataset.network, t.checked);
        else if (t.matches('[data-hurricanes]')) {
            if (t.checked) loadHurricanes();
            else { if (stormLayer) map.removeLayer(stormLayer); state.cones = []; countInCones(); }
        } else if (t.matches('input[name="pmm-base"]')) { map.removeLayer(base); base = BASES[t.value]().addTo(map); base.bringToBack?.(); }
    });
    // Capture phase: Leaflet stops clicks inside desktop popups from bubbling up to the container.
    container.addEventListener('click', e => {
        const shareBtn = e.target.closest('[data-share]');
        if (shareBtn) share(shareBtn.dataset.share);
    }, true);
    container.addEventListener('click', e => {
        const t = e.target;
        const statusBtn = t.closest('[data-status]');
        if (statusBtn) { setFilters({ status: statusBtn.dataset.status }); renderChips(); return; }
        if (t.closest('[data-exact]')) { setFilters({ exactOnly: !state.exactOnly }); return; }
        const missing = t.closest('[data-missing]');
        if (missing) { showMissing(missing.dataset.missing); return; }
        const sug = t.closest('[data-suggest] [data-i]');
        if (sug) { $('[data-suggest]').hidden = true; flyTo(suggestItems[Number(sug.dataset.i)]); return; }
        if (t.closest('[data-all]')) { searchAll(); return; }
        const found = t.closest('[data-found]');
        if (found) { flyTo(state.found[Number(found.dataset.found)]); return; }
        const near = t.closest('[data-near]');
        if (near) { const x = state.near[Number(near.dataset.near)]; flyTo({ tipo: x.m.key, numeroPermiso: x.p.numeroPermiso }); return; }
        const typeBtn = t.closest('[data-type]');
        if (typeBtn) {
            const key = typeBtn.dataset.type;
            if (state.hiddenTypes.has(key)) state.hiddenTypes.delete(key); else state.hiddenTypes.add(key);
            paint();
            countInCones();
            return;
        }
        if (t.closest('[data-results-close]')) { $('[data-results]').hidden = true; return; }
        if (t.closest('[data-results-csv]')) { downloadCsv(); return; }
        if (t.closest('[data-storm]')) { showCone(); return; }
        if (t.closest('[data-sheet-close]')) { closeSheet(); return; }
        if (t.closest('[data-sheet-toggle]')) { $('[data-sheet]').classList.toggle('is-open'); return; }
        if (t.closest('[data-locate]')) { locate(); return; }
        if (t.closest('[data-fab-layers]')) { closeSheet(); $('[data-results]').hidden = true; const panel = $('[data-panel]'); panel.hidden = !panel.hidden; return; }
        if (t.closest('[data-qstatus]')) { setFilters({ status: STATUS_CYCLE[state.status] }); renderChips(); return; }
        const qm = t.closest('[data-qmarket]');
        if (qm) {
            const key = qm.dataset.qmarket;
            const on = !state.layers[key].on;
            const box = container.querySelector(`[data-market="${key}"]`);
            if (box) box.checked = on;
            toggle(key, on).then(renderChips);
            renderChips();
            return;
        }
        if (t.closest('[data-mexico]')) { fitMexico(); return; }
        if (t.closest('[data-map-back]')) { location.hash = '#permisos'; return; }
        if (t.closest('[data-toggle-panel]')) {
            const panel = $('[data-panel]');
            panel.hidden = !panel.hidden;
            t.closest('[data-toggle-panel]').setAttribute('aria-expanded', String(!panel.hidden));
            return;
        }
        if (t.closest('[data-fullscreen]')) {
            const root = container.querySelector('.pmm');
            if (document.fullscreenElement) document.exitFullscreen(); else root.requestFullscreen?.();
            return;
        }
        if (!t.closest('.pmm-search') && !t.closest('[data-suggest]')) $('[data-suggest]').hidden = true;
    });
    renderChips();
    if (isMobile()) {
        $('[data-panel]').hidden = true;
        window.scrollTo({ top: 0 });
    }

    const initial = Promise.all(MARKETS.filter(m => m.on).map(m => toggle(m.key, true)));
    if (permit) initial.then(() => focusPermit(permit));
    loadHurricanes();
    state.timers.push(setInterval(loadHurricanes, 10 * 60 * 1000));

    return {
        focusPermit,
        destroy() {
            state.ctrl.abort();
            suggestCtrl?.abort();
            state.timers.forEach(clearInterval);
            clearTimeout(suggestTimer);
            resizeObserver.disconnect();
            document.body.classList.remove('pmm-open');
            map.remove();
            container.replaceChildren();
        },
    };
}
