/**
 * What kind of permit a number names, as an icon tile for cards and pop-ups. Electricity takes its
 * technology from the map layer when known; everything else reads the codes of the number. An
 * unknown code never invents a type: generic icon with its activity.
 */
import { infraIcon } from './infra-icons.js';
import { permitKind } from './cne-api.js';
import { TECH_MARKERS } from './tech-markers.js';
import { infraType } from './infra-icons.js';

const SECTOR_TOKEN = { electricidad: '--col-leyes', petroliferos: '--col-convocatorias', gaslp: '--col-normas', gasnatural: '--col-dacg', otro: '--col-otros' };
const clean = numero => String(numero ?? '').toUpperCase().trim().replace(/^CNE\//, '');

function byCodes(numero) {
    const parts = clean(numero).split('/');
    const codes = parts.slice(2);
    const has = (...wanted) => wanted.some(code => codes.includes(code));
    const activity = permitKind(numero).activity;
    if (parts[0] === 'E') {
        if (has('IMP')) return ['importacion', 'Importación'];
        if (has('EXP')) return ['importacion', 'Exportación'];
        if (has('COG')) return ['termica', 'Cogeneración'];
        if (has('AUT', 'AUTC')) return ['autoconsumo', 'Autoabastecimiento'];
        if (has('PP')) return ['generacion', 'Pequeña producción'];
        if (has('PIE')) return ['generacion', 'Producción independiente'];
        if (has('GEN')) return ['generacion', 'Generación'];
        return ['otro', activity || 'Permiso'];
    }
    if (has('AE')) return ['aerodromo', has('ALM') ? 'Almacenamiento en aeródromo' : 'Expendio en aeródromo'];
    if (has('ALM')) return ['almacenamiento', 'Almacenamiento'];
    if (has('TRA')) {
        if (has('OM')) return ['distribucion', 'Transporte sin ducto'];
        if (has('TM')) return ['distribucion', 'Transporte'];
        return ['ducto', 'Transporte por ducto'];
    }
    if (has('DIST', 'DIS')) return has('PLA') ? ['planta', 'Planta de distribución'] : ['distribucion', 'Distribución'];
    if (has('EXP')) return has('AUT', 'ESA') ? ['autoconsumo', 'Autoconsumo'] : ['estacion', 'Estación de servicio'];
    if (has('COMP', 'DESC', 'LICUE', 'REG')) return ['planta', activity || 'Instalación'];
    if (has('COM')) return ['comercio', 'Comercialización'];
    return ['otro', activity || 'Permiso'];
}

export function permitType(numero, { technology = '' } = {}) {
    const sector = permitKind(numero).sector?.id || 'otro';
    if (sector === 'electricidad' && technology) {
        const type = infraType('electricidad', { tecnologia: technology });
        if (type.tech) return { icon: type.icon, label: type.label, tech: type.tech, sector };
    }
    const [icon, label] = byCodes(numero);
    return { icon, label, sector };
}

/** Readable glyph on a tile: white where it reaches 3:1, otherwise ink. */
export function tileInk(hex) {
    const channels = [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16) / 255).map(value => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
    const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    return 1.05 / (luminance + 0.05) >= 3 ? '#fff' : '#0a0707';
}

function tokenValue(name) {
    try { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); } catch { return ''; }
}

export function typeTile(type, { size = '' } = {}) {
    const token = type.tech ? `--tec-${type.tech}` : SECTOR_TOKEN[type.sector] || SECTOR_TOKEN.otro;
    const value = tokenValue(token);
    const ink = /^#[0-9a-f]{6}$/i.test(value) ? tileInk(value) : '#fff';
    const glyph = type.tech ? `<svg viewBox="0 0 24 24" aria-hidden="true">${TECH_MARKERS[type.tech].glyph}</svg>` : infraIcon(type.icon, 21);
    return `<span class="bu-ico${size ? ` is-${size}` : ''}" style="--c:var(${token});--t:${ink}" aria-hidden="true">${glyph}</span>`;
}

let techIndex = null;
/** Number → technology, from the map's electricity layer. Asked once; an empty map if it fails. */
export function loadTechIndex(fetcher = url => fetch(url, { credentials: 'same-origin' }).then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })) {
    techIndex ??= Promise.resolve().then(() => fetcher('/api/mapa/capa?tipo=electricidad')).then(geo => {
        const index = new Map();
        for (const feature of geo?.features || []) {
            const { numeroPermiso, tecnologia } = feature.properties || {};
            if (numeroPermiso && tecnologia) index.set(clean(numeroPermiso), tecnologia);
        }
        return index;
    }).catch(() => new Map());
    return techIndex;
}
export function techOf(index, numero) {
    return index?.get(clean(numero)) || '';
}
export function resetTechIndexForTests() { techIndex = null; }
