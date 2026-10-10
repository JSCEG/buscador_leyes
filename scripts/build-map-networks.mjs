/**
 * Builds the network layers of the permits map (public/mapa/*.json), loaded only when a layer is
 * switched on:
 *   - red-transmision.json      power lines of 69 kV and up, from OpenStreetMap (collaborative, not
 *                               official: no public national layer of the Red Nacional de Transmisión exists)
 *   - gasoductos.json           natural gas pipelines, from OpenStreetMap (same caveat)
 *   - ductos-petroliferos.json  fuel pipelines, CNH layer published by SEMARNAT (official, approximate route)
 *
 * Geometries are simplified (Douglas-Peucker, ~40 m) and rounded to 4 decimals to keep the files
 * light. Run again to refresh: node scripts/build-map-networks.mjs
 */
import { writeFile, mkdir } from 'node:fs/promises';

const OUT = new URL('../public/mapa/', import.meta.url);
const OVERPASS = 'https://overpass-api.de/api/interpreter';
const PETROLIFEROS = 'https://geomaticasig1.semarnat.gob.mx/arcgis/rest/services/Hosted/Ductos_Petrol%C3%ADferos_Pemex/FeatureServer/2/query';
const TOLERANCE = 0.0004;
const today = new Date().toISOString().slice(0, 10);

async function overpass(query) {
    const response = await fetch(OVERPASS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'buscador-juridico.com map layers' },
        body: new URLSearchParams({ data: query }),
    });
    if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);
    return (await response.json()).elements || [];
}

function simplify(points, tolerance) {
    if (points.length < 3) return points;
    const keep = new Uint8Array(points.length);
    keep[0] = keep[points.length - 1] = 1;
    const stack = [[0, points.length - 1]];
    while (stack.length) {
        const [a, b] = stack.pop();
        const [x1, y1] = points[a];
        const [x2, y2] = points[b];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1e-12;
        let max = 0;
        let at = -1;
        for (let i = a + 1; i < b; i++) {
            const d = Math.abs(dy * points[i][0] - dx * points[i][1] + x2 * y1 - y2 * x1) / len;
            if (d > max) { max = d; at = i; }
        }
        if (max > tolerance) { keep[at] = 1; stack.push([a, at], [at, b]); }
    }
    return points.filter((_, i) => keep[i]);
}

const round = coords => coords.map(([x, y]) => [Math.round(x * 1e4) / 1e4, Math.round(y * 1e4) / 1e4]);
const lineKm = coords => {
    let km = 0;
    for (let i = 1; i < coords.length; i++) {
        const [x1, y1] = coords[i - 1];
        const [x2, y2] = coords[i];
        const r = Math.PI / 180;
        const a = Math.sin(((y2 - y1) * r) / 2) ** 2 + Math.cos(y1 * r) * Math.cos(y2 * r) * Math.sin(((x2 - x1) * r) / 2) ** 2;
        km += 6371 * 2 * Math.asin(Math.sqrt(a));
    }
    return km;
};
const geometry = coords => ({ type: 'LineString', coordinates: round(simplify(coords, TOLERANCE)) });
const maxKv = voltage => Math.max(0, ...String(voltage || '').split(/[;,]/).map(v => Number(v.trim()) / 1000).filter(Number.isFinite));

async function save(name, meta, features) {
    const km = Math.round(features.reduce((sum, f) => sum + f.properties.km, 0));
    const body = { ...meta, generado: today, tramos: features.length, km, type: 'FeatureCollection', features };
    await writeFile(new URL(name, OUT), JSON.stringify(body));
    console.log(`${name}: ${features.length} tramos, ${km.toLocaleString('es-MX')} km`);
}

await mkdir(OUT, { recursive: true });

// Power lines of 69 kV and up (CFE's transmission range runs from 69 to 400 kV).
const lines = await overpass('[out:json][timeout:300];area["ISO3166-1"="MX"][admin_level=2]->.mx;way["power"="line"]["voltage"](area.mx);out tags geom;');
await save('red-transmision.json', {
    fuente: 'OpenStreetMap (colaborativo, no oficial) · ODbL',
    nota: 'Líneas eléctricas de 69 kV o más registradas en OpenStreetMap. Trazo aproximado; puede estar incompleto.',
}, lines.map(way => {
    const kv = maxKv(way.tags.voltage);
    if (kv < 69 || !way.geometry) return null;
    const coords = way.geometry.map(p => [p.lon, p.lat]);
    return { type: 'Feature', properties: { kv, nombre: way.tags.name || '', operador: way.tags.operator || '', km: Math.round(lineKm(coords) * 10) / 10 }, geometry: geometry(coords) };
}).filter(Boolean));

// Natural gas pipelines.
const gas = await overpass('[out:json][timeout:300];area["ISO3166-1"="MX"][admin_level=2]->.mx;way["man_made"="pipeline"]["substance"~"^(gas|natural_gas|cng)$"](area.mx);out tags geom;');
await save('gasoductos.json', {
    fuente: 'OpenStreetMap (colaborativo, no oficial) · ODbL',
    nota: 'Gasoductos registrados en OpenStreetMap. Trazo aproximado; incompleto.',
}, gas.filter(way => way.geometry).map(way => {
    const coords = way.geometry.map(p => [p.lon, p.lat]);
    return { type: 'Feature', properties: { nombre: way.tags.name || '', operador: way.tags.operator || '', km: Math.round(lineKm(coords) * 10) / 10 }, geometry: geometry(coords) };
}));

// Fuel pipelines (CNH).
const params = new URLSearchParams({ where: '1=1', outFields: 'ducto,servicio,regin,longitud', outSR: '4326', f: 'geojson' });
const petro = await (await fetch(`${PETROLIFEROS}?${params}`)).json();
await save('ductos-petroliferos.json', {
    fuente: 'Comisión Nacional de Hidrocarburos con información de SENER y CRE (publicado por SEMARNAT)',
    nota: 'La propia fuente advierte que el trazo es aproximado y no refleja la ubicación real de los ductos.',
}, (petro.features || []).flatMap(f => {
    const parts = f.geometry?.type === 'MultiLineString' ? f.geometry.coordinates : f.geometry ? [f.geometry.coordinates] : [];
    return parts.map(coords => ({
        type: 'Feature',
        properties: { nombre: f.properties.ducto || '', servicio: f.properties.servicio || '', region: f.properties.regin || '', km: Math.round(lineKm(coords) * 10) / 10 },
        geometry: geometry(coords),
    }));
}));
