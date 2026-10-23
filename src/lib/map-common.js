/**
 * What every permits map shares (the Mapa tab and «CNE y SENER»): base maps, infrastructure networks,
 * the round pins with their infrastructure icon and the clusters split by sector. One source, so the
 * two maps look and behave the same.
 */
import { infraIcon } from './infra-icons.js';

/** Base maps. Default: Esri streets (labelled at every zoom); dark mode uses Esri's dark canvas. */
const BASES = {
    mapa: L => {
        const esri = (name, zIndex, native = 16) => L.tileLayer(`https://server.arcgisonline.com/ArcGIS/rest/services/${name}/MapServer/tile/{z}/{y}/{x}`, { maxZoom: 19, maxNativeZoom: native, zIndex, attribution: 'Tiles &copy; Esri' });
        if (!document.documentElement.classList.contains('dark-mode')) return esri('World_Street_Map', 1, 18);
        return L.layerGroup([esri('Canvas/World_Dark_Gray_Base', 1), esri('Canvas/World_Dark_Gray_Reference', 2)]);
    },
    claro: L => L.tileLayer('https://tiles.maps.eox.at/wmts/1.0.0/terrain-light_3857/default/g/{z}/{y}/{x}.jpg', { maxZoom: 19, maxNativeZoom: 16, attribution: 'Terrain Light &copy; EOX · &copy; OpenStreetMap' }),
    calles: L => L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }),
    satelite: L => L.tileLayer('https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/g/{z}/{y}/{x}.jpg', { maxZoom: 19, maxNativeZoom: 16, attribution: 'Sentinel-2 cloudless &copy; EOX' }),
};
export const BASE_OPTIONS = [['mapa', 'Mapa'], ['claro', 'Relieve'], ['calles', 'Calles'], ['satelite', 'Satélite']];

/**
 * Base map switcher. If a base stops answering (Esri's CDN has blocked requests), it falls back to
 * OpenStreetMap so the map never stays gray, and tells `onFallback`.
 * @returns {(key: string) => void}
 */
export function baseLayers(L, map, { onFallback = () => {} } = {}) {
    let base = null;
    function setBase(key) {
        if (base) map.removeLayer(base);
        const layer = (BASES[key] || BASES.mapa)(L).addTo(map);
        base = layer;
        layer.bringToBack?.();
        if (key === 'calles') return;
        let loaded = 0;
        let failed = 0;
        (layer.getLayers ? layer.getLayers() : [layer]).forEach(tiles => {
            tiles.on('tileload', () => { loaded += 1; });
            tiles.on('tileerror', () => {
                failed += 1;
                if (base !== layer || loaded || failed < 4) return;
                setBase('calles');
                onFallback('calles');
            });
        });
    }
    return setBase;
}

// Network layers (scripts/build-map-networks.mjs builds the files under public/mapa/).
export const NETWORKS = [
    { key: 'transmision', file: 'red-transmision.json', label: 'Líneas de transmisión', short: '69 kV o más · OpenStreetMap', swatch: '#c0392b' },
    { key: 'gasoductos', file: 'gasoductos.json', label: 'Gasoductos', short: 'OpenStreetMap · incompleto', swatch: '#2f6690', color: '#2f6690', dash: '6 4' },
    { key: 'petroliferos', file: 'ductos-petroliferos.json', label: 'Ductos de petrolíferos', short: 'CNH · trazo aproximado', swatch: '#86671d', color: '#86671d', dash: '2 4' },
];
export const KV_CLASSES = [
    { min: 400, color: '#6c2a8f', weight: 2.6, label: '400 kV' },
    { min: 230, color: '#c0392b', weight: 2.1, label: '230 kV' },
    // Teal and gray, not orange or yellow: those are the roads of the base map.
    { min: 115, color: '#0e7c86', weight: 1.6, label: '115–161 kV' },
    { min: 69, color: '#6f6a66', weight: 1.2, label: '69–115 kV' },
];
export const kvClass = kv => KV_CLASSES.find(c => kv >= c.min) || KV_CLASSES[KV_CLASSES.length - 1];

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = v => (v == null || v === '' || Number.isNaN(Number(v))) ? '' : Number(v).toLocaleString('es-MX', { maximumFractionDigits: 2 });

export function networkPopup(n, p, data) {
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

/**
 * Infrastructure networks on a map, loaded on first use.
 * @returns {{ toggle: (key: string, on: boolean, signal?: AbortSignal) => Promise<object|null> }} toggle resolves with
 *   the network's data (its `km` for the note) or null when it could not load.
 */
export function networkLayers(L, map, { pane = 'networks' } = {}) {
    if (!map.getPane(pane)) map.createPane(pane).style.zIndex = 350;
    const renderer = L.canvas({ pane, tolerance: 8 });
    const entries = {};
    async function toggle(key, on, signal) {
        const n = NETWORKS.find(x => x.key === key);
        const entry = entries[key] || (entries[key] = {});
        if (!on) { if (entry.layer) map.removeLayer(entry.layer); return entry.data || null; }
        if (!entry.layer) {
            const response = await fetch(`/mapa/${n.file}`, { signal });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            entry.data = data;
            entry.layer = L.geoJSON(data, {
                attribution: n.key === 'petroliferos' ? 'Ductos: CNH' : '&copy; OpenStreetMap',
                pane,
                renderer,
                style: f => (key === 'transmision'
                    ? { color: kvClass(f.properties.kv).color, weight: kvClass(f.properties.kv).weight, opacity: 0.85 }
                    : { color: n.color, weight: 2.2, opacity: 0.9, dashArray: n.dash }),
                onEachFeature: (f, layer) => layer.bindPopup(() => networkPopup(n, f.properties, data), { className: 'pmm-popup', maxWidth: 300 }),
            });
        }
        entry.layer.addTo(map);
        return entry.data;
    }
    return { toggle };
}

/** Round pin of one sector with its infrastructure icon; `mods`: 'is-novig', 'is-aprox'. */
export function pinIcon(L, cache, sector, icon, mods = '') {
    const key = `${sector}|${icon}|${mods}`;
    if (!cache.has(key)) {
        cache.set(key, L.divIcon({ className: 'pmm-pin-wrap', html: `<span class="pmm-pin ${mods}" data-sector="${sector}">${infraIcon(icon, 13)}</span>`, iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -10] }));
    }
    return cache.get(key);
}

/**
 * One cluster group for every sector, so groups of different sectors do not cover each other. Each bubble
 * is a ring split by sector (markers carry `options.sector`), in proportion to what it holds.
 * @param {string[]} sectors order of the ring
 */
export function sectorCluster(L, sectors) {
    return L.markerClusterGroup({
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
            const stops = sectors.filter(sector => bySector[sector]).map(sector => {
                const from = at;
                at += (bySector[sector] / n) * 100;
                return `var(--c-${sector}) ${from.toFixed(1)}% ${at.toFixed(1)}%`;
            });
            const label = n >= 1000 ? `${Math.round(n / 100) / 10}k` : n;
            return L.divIcon({ className: 'pmm-pin-wrap', html: `<span class="pmm-cluster" style="width:${size}px;height:${size}px;background:conic-gradient(${stops.join(',')})"><b>${label}</b></span>`, iconSize: [size, size] });
        },
    });
}
