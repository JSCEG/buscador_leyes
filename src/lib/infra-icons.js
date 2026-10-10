/**
 * Type of infrastructure of an energy permit and its line icon (24×24, stroked with currentColor),
 * in the same style as collection-icons.js. Fuel and gas permits are classified by permit type;
 * electricity by generation technology. Static, trusted markup.
 */
const PATHS = Object.freeze({
    // Bomba de combustible: estación de servicio / carburación / GNC
    estacion: '<path d="M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"/><path d="M3 21h12"/><path d="M6.5 8h5"/><path d="M14 10h2a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0V8l-3-3"/>',
    // Camión: distribución por medios distintos a ducto
    distribucion: '<path d="M2.5 6.5h11v9h-11z"/><path d="M13.5 9.5h4l3 3v3h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    // Tanque: almacenamiento
    almacenamiento: '<ellipse cx="12" cy="5.5" rx="7" ry="2.5"/><path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13"/><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>',
    // Avión: almacenamiento en aeródromos
    aerodromo: '<path d="M21 15.5 13.5 11V4.8a1.5 1.5 0 0 0-3 0V11L3 15.5v2l7.5-2.3V19l-2 1.5v1.5l3.5-1 3.5 1v-1.5l-2-1.5v-3.8l7.5 2.3z"/>',
    // Planta industrial: planta de distribución
    planta: '<path d="M3 21V10l5 3V10l5 3V6l5 3v12z"/><path d="M3 21h18"/><path d="M7 17h2M12 17h2M17 17h1"/>',
    // Edificio: autoconsumo
    autoconsumo: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M8 7h3M13 7h3M8 11h3M13 11h3M10 21v-4h4v4"/>',
    solar: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5V5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12H5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/>',
    eolica: '<path d="M12 12v9.5M9 21.5h6"/><path d="M12 12V3.5c2 1.5 2.4 4.6 0 8.5Z"/><path d="m12 12 7.3 4.2c-2.3 1-5.2-.2-7.3-4.2Z"/><path d="m12 12-7.3 4.2c.3-2.5 2.8-4.3 7.3-4.2Z"/>',
    hidro: '<path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11Z"/><path d="M9.5 14.5A2.5 2.5 0 0 0 12 17"/>',
    termica: '<path d="M12 21.5c3.6 0 6-2.4 6-5.8 0-3.4-2.4-5.4-3.4-8.2-1 1.7-2 2.3-3 2.3.4-2.6-.6-5.1-2.6-7.3-.4 3.6-5 6.2-5 11.2 0 4.2 3.4 7.8 8 7.8Z"/>',
    bioenergia: '<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15Z"/><path d="m5 19 8-8"/>',
    geotermia: '<path d="M10 14.5V4.5a2 2 0 0 1 4 0v10a4 4 0 1 1-4 0Z"/><path d="M12 9v7"/>',
    nuclear: '<circle cx="12" cy="12" r="1.5"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)"/>',
    importacion: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
    generacion: '<path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12Z"/>',
    otro: '<circle cx="12" cy="10" r="3"/><path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11Z"/>',
});

const fold = v => String(v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// [fragment of the technology name, icon, label]
const TECHNOLOGIES = [
    ['fotovolt', 'solar', 'Fotovoltaica'],
    ['eolic', 'eolica', 'Eólica'],
    ['hidro', 'hidro', 'Hidroeléctrica'],
    ['ciclo combinado', 'termica', 'Ciclo combinado'],
    ['turbogas', 'termica', 'Turbogás'],
    ['combustion interna', 'termica', 'Combustión interna'],
    ['termoelectrica', 'termica', 'Termoeléctrica convencional'],
    ['carbo', 'termica', 'Carboeléctrica'],
    ['lecho', 'termica', 'Lecho fluidizado'],
    ['cogeneracion', 'termica', 'Cogeneración'],
    ['bioenerg', 'bioenergia', 'Bioenergía'],
    ['geoterm', 'geotermia', 'Geotérmica'],
    ['nucle', 'nuclear', 'Nucleoeléctrica'],
    ['importacion', 'importacion', 'Importación'],
];

/** { icon, label } of a permit of the given market ('electricidad' | 'petroliferos' | 'gas-lp' | 'gas-natural'). */
export function infraType(market, permit = {}) {
    const type = fold(permit.tipoPermiso);
    if (market === 'electricidad') {
        const tech = fold(permit.tecnologia);
        const hit = TECHNOLOGIES.find(([fragment]) => tech.includes(fragment));
        return hit ? { icon: hit[1], label: hit[2] } : { icon: 'generacion', label: permit.tecnologia || 'Generación eléctrica' };
    }
    if (market === 'gas-natural') return type.includes('distribu') ? { icon: 'distribucion', label: 'Distribución' } : { icon: 'estacion', label: 'Expendio de GNC' };
    if (type.includes('aerodromo')) return { icon: 'aerodromo', label: 'Almacenamiento en aeródromos' };
    if (type.includes('almacenamiento')) return { icon: 'almacenamiento', label: 'Almacenamiento' };
    if (type.includes('autoconsumo')) return { icon: 'autoconsumo', label: 'Autoconsumo' };
    if (type.includes('planta')) return { icon: 'planta', label: 'Planta de distribución' };
    if (type.includes('distribu')) return { icon: 'distribucion', label: 'Distribución' };
    if (type.includes('expendio')) return { icon: 'estacion', label: market === 'gas-lp' ? 'Estación de carburación' : 'Estación de servicio' };
    return { icon: 'otro', label: permit.tipoPermiso || 'Sin clasificar' };
}

export function infraIcon(icon, size = 14) {
    const paths = PATHS[icon] || PATHS.otro;
    return `<svg aria-hidden="true" focusable="false" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}
