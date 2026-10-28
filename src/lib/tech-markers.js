/**
 * Map markers by technology (MarkerSet / TechMarker of the design system): a white stroke glyph on the
 * technology colour (--tec-*), as a pin (single plant), a dot (dense layers) or a dashed ring (not in
 * operation). Returned as SVG text so Leaflet can place it in an L.divIcon.
 */
export const TECH_MARKERS = {
    fv: { name: 'Fotovoltaica', token: '--tec-fv', glyph: '<path d="M5 8h14l-1.5 8h-11z"/><path d="M12 8v8"/><path d="M5.8 12h12.4"/><path d="M10 20h4"/><path d="M12 16v4"/>' },
    eo: { name: 'Eólica', token: '--tec-eo', glyph: '<circle cx="12" cy="9" r="1.4"/><path d="M12 7.6V3"/><path d="M13.2 9.7l4.3 2.4"/><path d="M10.8 9.7l-4.3 2.4"/><path d="M12 10.5V21"/><path d="M9 21h6"/>' },
    hid: { name: 'Hidroeléctrica', token: '--tec-hid', glyph: '<path d="M12 3c3 4 5.5 7 5.5 10.2a5.5 5.5 0 0 1-11 0C6.5 10 9 7 12 3z"/><path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5"/>' },
    cc: { name: 'Ciclo combinado', token: '--tec-cc', glyph: '<path d="M5 12a7 7 0 0 1 12-4.9L19 9"/><path d="M19 4v5h-5"/><path d="M19 12a7 7 0 0 1-12 4.9L5 15"/><path d="M5 20v-5h5"/>' },
    ci: { name: 'Termoeléctrica convencional', token: '--tec-ci', glyph: '<path d="M3 20V12l5 3v-3l5 3V6h4v14z"/><path d="M3 20h18"/><path d="M15 3.5c0-1 1-1 1-2"/>' },
    cog: { name: 'Cogeneración', token: '--tec-cog', glyph: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3"/><path d="M12 18v3"/><path d="M3 12h3"/><path d="M18 12h3"/><path d="M5.6 5.6l2.1 2.1"/><path d="M16.3 16.3l2.1 2.1"/><path d="M5.6 18.4l2.1-2.1"/><path d="M16.3 7.7l2.1-2.1"/>' },
    geo: { name: 'Geotermia', token: '--tec-geo', glyph: '<path d="M3 20l6-9h6l6 9z"/><path d="M10 8c0-2 1.5-2 1.5-4"/><path d="M13.5 8c0-2 1.5-2 1.5-4"/>' },
    csp: { name: 'Termosolar', token: '--tec-csp', glyph: '<circle cx="12" cy="5" r="2"/><path d="M11 21V9h2v12"/><path d="M4 21l3-5"/><path d="M20 21l-3-5"/><path d="M4 8l3 1"/><path d="M20 8l-3 1"/>' },
    bio: { name: 'Bioenergía', token: '--tec-bio', glyph: '<path d="M5 19C5 10 11 5 20 4c-1 9-6 15-15 15z"/><path d="M5 19l8-8"/>' },
    h2: { name: 'Hidrógeno', token: '--tec-h2', glyph: '<path d="M5 6v12"/><path d="M13 6v12"/><path d="M5 12h8"/><path d="M16 14.5a1.6 1.6 0 1 1 2.8 1.1L16 19.5h3.5"/>' },
    nuc: { name: 'Nucleoeléctrica', token: '--tec-nuc', glyph: '<circle cx="12" cy="12" r="1.5"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(-60 12 12)"/>' },
    alm: { name: 'Almacenamiento', token: '--tec-alm', glyph: '<path d="M4 8h14v8H4z"/><path d="M18 11h2v2h-2"/><path d="M7.5 11v2"/><path d="M11 11v2"/><path d="M14.5 11v2"/>' },
};

const glyph = (marker, stroke, x, y, scale) => `<g transform="translate(${x} ${y}) scale(${scale})" style="fill:none;stroke:${stroke};stroke-width:${(2 / scale * (scale < 0.8 ? 0.8 : 1)).toFixed(2)};stroke-linecap:round;stroke-linejoin:round">${marker.glyph}</g>`;

/**
 * @param {keyof TECH_MARKERS} tech
 * @param {{ variant?: 'pin'|'dot'|'ring', size?: number, planned?: boolean, selected?: boolean }} options
 */
export function techMarkerSVG(tech, { variant = 'pin', size, planned = false, selected = false } = {}) {
    const marker = TECH_MARKERS[tech] || TECH_MARKERS.fv;
    const colour = `var(${marker.token})`;
    if (variant === 'pin') {
        const w = size || 36;
        const h = w * 46 / 36;
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="-3 -3 42 52" role="img" aria-label="${marker.name}" style="overflow:visible;filter:drop-shadow(0 3px 4px rgba(18,33,58,.28))">`
            + (selected ? '<path d="M18 -2C7 -2 -2 6.7 -2 17.6 -2 31 18 48.5 18 48.5S38 31 38 17.6C38 6.7 29 -2 18 -2z" style="fill:none;stroke:var(--accent);stroke-width:3"/>' : '')
            + `<path d="M18 1C8.6 1 1 8.4 1 17.6 1 29.5 18 45 18 45s17-15.5 17-27.4C35 8.4 27.4 1 18 1z" style="fill:${planned ? 'var(--surface-1)' : colour};stroke:${planned ? colour : '#ffffff'};stroke-width:2${planned ? ';stroke-dasharray:4 3' : ''}"/>`
            + glyph(marker, planned ? colour : '#ffffff', 7, 6.6, 0.92) + '</svg>';
    }
    const d = size || 28;
    const r = d / 2;
    const ring = variant === 'ring' || planned;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${d + 8}" height="${d + 8}" viewBox="-4 -4 ${d + 8} ${d + 8}" role="img" aria-label="${marker.name}" style="overflow:visible">`
        + (selected ? `<circle cx="${r}" cy="${r}" r="${r + 3.5}" style="fill:none;stroke:var(--accent);stroke-width:2.5"/>` : '')
        + `<circle cx="${r}" cy="${r}" r="${r - 1}" style="fill:${ring ? 'var(--surface-1)' : colour};stroke:${ring ? colour : '#ffffff'};stroke-width:${ring ? 2 : 1.5}${ring ? ';stroke-dasharray:3 2.5' : ''}"/>`
        + (d >= 20 ? glyph(marker, ring ? colour : '#ffffff', r - d * 0.3, r - d * 0.3, d * 0.6 / 24) : '')
        + '</svg>';
}
