/**
 * Guías de trámite: for each kind of permit, the acervo instruments that govern it, found by their
 * acronym. Nothing here states requirements or steps: the guide shows the instruments, the articles
 * that mention the procedure (searched live in the acervo) and the CNE's recent resolutions of that
 * kind (queried live). Instruments missing from the acervo are simply not shown.
 *
 * - base: laws and regulations of the sector
 * - rules: administrative provisions and agreements specific to the procedure
 * - forms: official forms
 * - calls: calls (convocatorias) and their amendments
 * - articles: search in the acervo for the articles about the procedure, limited to `in`
 * - resolutions: filters for the CNE resolutions search (text of the proemio, type)
 */
export const TRAMITES = [
    {
        id: 'generacion',
        title: 'Permiso de generación de energía eléctrica',
        sector: 'electricidad',
        base: ['LSE', 'RLSE', 'LCNE'],
        rules: ['DACG-PERMISOS-GA', 'DACG-Planeación Vinculante', 'MODELOS-INTERCONEXION', 'DACG-ACCESO-REDES'],
        forms: [],
        calls: ['CONV-GEN-2', 'CONV-GEN-2-M1', 'CONV-GEN-2-M2', 'CONV-GEN-2-M3', 'CONV-GEN-2-M4', 'CONV-GEN-1', 'CONV-GEN-1-M1', 'CONV-GEN-1-M2', 'CONV-GEN-1-M3'],
        articles: { query: 'permiso de generación', in: ['LSE', 'RLSE', 'DACG-PERMISOS-GA'] },
        resolutions: { texto: 'generación de energía eléctrica', tipo: 'Otorgamiento' },
    },
    {
        id: 'almacenamiento',
        title: 'Almacenamiento de energía eléctrica',
        sector: 'electricidad',
        base: ['LSE', 'RLSE', 'LCNE'],
        rules: ['DACG-PERMISOS-GA', 'ACUERDO-CNE-16/04/2026-DACG-SAE'],
        forms: ['FORMATOS-SAEE'],
        calls: ['CONV-ESTRATEGICOS', 'CONV-ESTRATEGICOS-M1', 'CONV-ESTRATEGICOS-M2', 'CONV-ESTRATEGICOS-M3'],
        articles: { query: 'almacenamiento de energía', in: ['LSE', 'RLSE', 'DACG-PERMISOS-GA', 'ACUERDO-CNE-16/04/2026-DACG-SAE'] },
        resolutions: null,
    },
    {
        id: 'autoconsumo',
        title: 'Generación para autoconsumo',
        sector: 'electricidad',
        base: ['LSE', 'RLSE', 'LCNE'],
        rules: ['AUTOCONSUMO-0.7-20', 'VENTANILLA-AUTOCONSUMO'],
        forms: ['FORMATO-AUTOCONSUMO'],
        calls: [],
        articles: { query: 'autoconsumo', in: ['LSE', 'RLSE', 'AUTOCONSUMO-0.7-20', 'VENTANILLA-AUTOCONSUMO'] },
        resolutions: { texto: 'autoconsumo' },
    },
    {
        id: 'cogeneracion',
        title: 'Generación en la modalidad de cogeneración',
        sector: 'electricidad',
        base: ['LSE', 'RLSE', 'LCNE'],
        rules: ['DACG-COGENERACION'],
        forms: ['FORMATOS-COGENERACION'],
        calls: [],
        articles: { query: 'cogeneración', in: ['LSE', 'RLSE', 'DACG-COGENERACION'] },
        resolutions: { texto: 'cogeneración' },
    },
    {
        id: 'migracion',
        title: 'Migración de permisos de autoabastecimiento y cogeneración',
        sector: 'electricidad',
        base: ['LSE', 'RLSE'],
        rules: ['MIGRACION-PERMISOS', 'MIGRACION-ACLARACION', 'MIGRACION-MODIFICACION'],
        forms: [],
        calls: [],
        articles: { query: 'migración', in: ['MIGRACION-PERMISOS', 'MIGRACION-MODIFICACION', 'LSE', 'RLSE'] },
        resolutions: { texto: 'migración' },
    },
    {
        id: 'electromovilidad',
        title: 'Electromovilidad: infraestructura de carga',
        sector: 'electricidad',
        base: ['LSE', 'RLSE'],
        rules: ['DACG-ELECTROMOVILIDAD'],
        forms: [],
        calls: [],
        articles: { query: 'carga de vehículos eléctricos', in: ['DACG-ELECTROMOVILIDAD', 'LSE', 'RLSE'] },
        resolutions: null,
    },
    {
        id: 'petroliferos',
        title: 'Permisos de petrolíferos',
        sector: 'petroliferos',
        base: ['LSH', 'RLSH', 'LCNE'],
        rules: [],
        forms: [],
        calls: [],
        articles: { query: 'permiso petrolíferos', in: ['LSH', 'RLSH'] },
        resolutions: { modalidad: 'Petrolíferos', tipo: 'Otorgamiento' },
    },
    {
        id: 'gaslp',
        title: 'Permisos de gas licuado de petróleo',
        sector: 'gaslp',
        base: ['LSH', 'RLSH', 'LCNE'],
        rules: [],
        forms: [],
        calls: [],
        articles: { query: 'gas licuado de petróleo permiso', in: ['LSH', 'RLSH'] },
        resolutions: { modalidad: 'Gas licuado', tipo: 'Otorgamiento' },
    },
    {
        id: 'gasnatural',
        title: 'Permisos de gas natural',
        sector: 'gasnatural',
        base: ['LSH', 'RLSH', 'LCNE'],
        rules: [],
        forms: [],
        calls: ['CONV-SISTRANGAS'],
        articles: { query: 'gas natural permiso', in: ['LSH', 'RLSH'] },
        resolutions: { modalidad: 'Gas natural', tipo: 'Otorgamiento' },
    },
    {
        id: 'biocombustibles',
        title: 'Permisos de biocombustibles',
        sector: 'otro',
        base: ['LBio', 'RLBio'],
        rules: [],
        forms: ['FORMATOS-BIOCOMBUSTIBLES'],
        calls: [],
        articles: { query: 'permiso', in: ['LBio', 'RLBio'] },
        resolutions: null,
    },
    {
        id: 'geotermia',
        title: 'Geotermia',
        sector: 'otro',
        base: ['LGeo', 'RLGeo'],
        rules: [],
        forms: [],
        calls: [],
        articles: { query: 'permiso concesión', in: ['LGeo', 'RLGeo'] },
        resolutions: null,
    },
];

export const tramiteById = id => TRAMITES.find(tramite => tramite.id === id) || null;

const fold = value => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Guides that cite an instrument (by acronym), in catalogue order. */
export function tramitesForLaw(siglas) {
    const wanted = fold(siglas);
    if (!wanted) return [];
    return TRAMITES.filter(t => [...t.base, ...t.rules, ...t.forms, ...t.calls].some(s => fold(s) === wanted));
}

/** Guide for a permit number: its sector and, for electricity, its activity code. */
export function tramiteForPermit(numero) {
    const parts = String(numero || '').toUpperCase().replace(/^CNE\//, '').split('/');
    const codes = parts.slice(2);
    if (parts[0] === 'PL') return tramiteById('petroliferos');
    if (parts[0] === 'LP') return tramiteById('gaslp');
    if (parts[0] === 'G') return tramiteById('gasnatural');
    if (parts[0] !== 'E') return null;
    if (codes.includes('COG')) return tramiteById('cogeneracion');
    // Self-supply permits of the previous regime migrate to the current figures.
    if (codes.some(code => code === 'AUT' || code === 'AUTC')) return tramiteById('migracion');
    if (codes.some(code => code === 'ALM' || code === 'SAE')) return tramiteById('almacenamiento');
    return tramiteById('generacion');
}

/** Guide for a CNE resolution, from its modality and proemio. */
export function tramiteForResolution(row = {}) {
    const text = fold(`${row.ModalidadResolucion || ''} ${row.Proemio || ''}`);
    if (/migracion/.test(text) && /autoabastecimiento|cogeneracion/.test(text)) return tramiteById('migracion');
    if (/autoconsumo/.test(text)) return tramiteById('autoconsumo');
    if (/cogeneracion/.test(text)) return tramiteById('cogeneracion');
    if (/almacenamiento de energia electrica/.test(text)) return tramiteById('almacenamiento');
    if (/gas licuado/.test(text)) return tramiteById('gaslp');
    if (/gas natural/.test(text)) return tramiteById('gasnatural');
    if (/petrol/.test(text)) return tramiteById('petroliferos');
    if (/electric|generacion/.test(text)) return tramiteById('generacion');
    return null;
}
