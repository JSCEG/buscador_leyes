/**
 * CNE section routes and permit numbers: the hashes of its tabs, the ids of permits pinned to a desk and the
 * sector and activity read from a permit number. No network here: since 26/11/2026 the CNE registry requires
 * reCAPTCHA, so permits and resolutions come from Azure (src/lib/permisos-mapa.js, src/lib/resoluciones-api.js).
 * REGISTRY_URL and RESOLUTIONS_URL are only links for people to open the official site.
 */
export const REGISTRY_URL = 'https://www.cne.gob.mx/Permisos/';

export const RESOLUTIONS_URL = 'https://www.cne.gob.mx/Resoluciones/';
const RESOLUTION_FILTERS = ['numero', 'texto', 'fecha', 'tipo', 'modalidad', 'acta'];

/**
 * Route of the CNE section: { tab, permit?, resolution?, tramite? } for #permisos, #permiso=<number>,
 * #resoluciones, #resolucion=<number>, #panorama-cne, #tramites, #tramite=<id>, #mapa-permisos and #sener
 * (#sener?tabla=<key>&numero=<number> opens one record; #cne-sener, its first name, still works); otherwise null.
 */
export function permitsRoute(hash = '') {
    if (hash === '#permisos') return { tab: 'permisos' };
    if (hash === '#resoluciones') return { tab: 'resoluciones' };
    // A filtered search, e.g. #resoluciones?fecha=2025&tipo=Otorgamiento (from the panorama charts).
    if (hash.startsWith('#resoluciones?')) {
        const params = new URLSearchParams(hash.slice('#resoluciones?'.length));
        const filters = Object.fromEntries(RESOLUTION_FILTERS.filter(key => params.get(key)).map(key => [key, params.get(key).slice(0, 120)]));
        return { tab: 'resoluciones', filters };
    }
    if (hash === '#panorama-cne') return { tab: 'panorama' };
    if (hash === '#mapa-permisos') return { tab: 'mapa' };
    // A shared point of the map: #mapa-permisos?permiso=<number>.
    if (hash.startsWith('#mapa-permisos?')) {
        const permit = new URLSearchParams(hash.slice('#mapa-permisos?'.length)).get('permiso');
        return permit ? { tab: 'mapa', mapPermit: permit.slice(0, 120) } : { tab: 'mapa' };
    }
    if (hash === '#tramites') return { tab: 'tramites' };
    const sener = /^#(?:cne-)?sener(?:\?(.*))?$/.exec(hash);
    if (sener) {
        const params = new URLSearchParams(sener[1] || '');
        const tabla = params.get('tabla');
        const numero = params.get('numero');
        return tabla && numero && /^[a-z-]{2,30}$/.test(tabla) ? { tab: 'sener', record: { tabla, numero: numero.slice(0, 120) } } : { tab: 'sener' };
    }
    const m = /^#(permiso|resolucion|tramite)=(.+)$/.exec(hash);
    if (!m) return null;
    let value;
    try { value = decodeURIComponent(m[2]); } catch { return null; }
    if (m[1] === 'permiso') return { tab: 'permisos', permit: value };
    if (m[1] === 'tramite') return { tab: 'tramites', tramite: value };
    return { tab: 'resoluciones', resolution: value };
}

/** Hash of a CNE route (inverse of permitsRoute). */
export function permitsHash({ tab = 'permisos', permit = null, resolution = null, tramite = null, filters = null, mapPermit = null, record = null } = {}) {
    if (record) return `#sener?${new URLSearchParams({ tabla: record.tabla, numero: record.numero })}`;
    if (mapPermit) return `#mapa-permisos?${new URLSearchParams({ permiso: mapPermit })}`;
    if (permit) return `#permiso=${encodeURIComponent(permit)}`;
    if (resolution) return `#resolucion=${encodeURIComponent(resolution)}`;
    if (tramite) return `#tramite=${encodeURIComponent(tramite)}`;
    const query = filters ? new URLSearchParams(RESOLUTION_FILTERS.filter(key => filters[key]).map(key => [key, filters[key]])).toString() : '';
    if (tab === 'resoluciones' && query) return `#resoluciones?${query}`;
    return { resoluciones: '#resoluciones', panorama: '#panorama-cne', tramites: '#tramites', mapa: '#mapa-permisos', sener: '#sener' }[tab] || '#permisos';
}

/** Permits pinned to a desk are stored among article ids as 'cne:<permit number>'. */
const PIN_PREFIX = 'cne:';
export const permitPinId = numero => `${PIN_PREFIX}${numero}`;
export const permitFromPinId = id => (String(id).startsWith(PIN_PREFIX) ? String(id).slice(PIN_PREFIX.length) : null);

/** Sector, activity and the acervo instruments that regulate it, read from the permit number. */
const SECTORS = {
    E: { id: 'electricidad', label: 'Electricidad', laws: ['LSE', 'RLSE', 'DACG-PERMISOS-GA', 'LCNE'] },
    PL: { id: 'petroliferos', label: 'Petrolíferos', laws: ['LSH', 'RLSH', 'LCNE'] },
    LP: { id: 'gaslp', label: 'Gas LP', laws: ['LSH', 'RLSH', 'LCNE'] },
    G: { id: 'gasnatural', label: 'Gas natural', laws: ['LSH', 'RLSH', 'LCNE'] },
};
const ACTIVITIES = {
    GEN: 'Generación', COG: 'Cogeneración', AUT: 'Autoabastecimiento', AUTC: 'Autoabastecimiento', PP: 'Pequeña producción',
    PIE: 'Producción independiente', IMP: 'Importación', EXP: 'Expendio', TRA: 'Transporte', ALM: 'Almacenamiento',
    DIS: 'Distribución', COM: 'Comercialización', COMP: 'Compresión', DESC: 'Descompresión', LICUE: 'Licuefacción',
    REG: 'Regasificación', SUM: 'Suministro', GES: 'Gestión de sistemas',
};
export function permitKind(numero = '') {
    const parts = String(numero).toUpperCase().replace(/^CNE\//, '').split('/');
    const sector = SECTORS[parts[0]] || null;
    const code = parts.slice(2).find(part => ACTIVITIES[part]);
    // Electricity numbers use EXP for export; fuels use it for retail (expendio).
    const activity = code === 'EXP' && sector?.id === 'electricidad' ? 'Exportación' : (code ? ACTIVITIES[code] : null);
    return { sector, activity };
}
