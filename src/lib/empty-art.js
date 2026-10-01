/**
 * Small line illustrations for empty states, in the brand colors. Decorative (aria-hidden).
 * Kinds: 'search' (nothing found), 'saved' (no favorites), 'desk' (empty desk), 'missing' (gone).
 */
const G = '#9b2247';
const A = '#c9a04a';
const PAGE = (x, y, r = 0) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect width="58" height="74" rx="7" fill="var(--ea-paper,#fff)" stroke="${G}" stroke-width="2.4"/><path d="M12 18h34M12 28h34M12 38h22" stroke="${G}" stroke-width="2.4" stroke-linecap="round" opacity=".35"/></g>`;

const ART = {
    search: `${PAGE(26, 30, -8)}${PAGE(62, 22, 6)}
        <circle cx="104" cy="78" r="22" fill="var(--ea-bg,#fbf3f5)" stroke="${A}" stroke-width="4"/><path d="m120 94 16 16" stroke="${A}" stroke-width="6" stroke-linecap="round"/>
        <path d="M96 72q8-6 16 0" stroke="${G}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`,
    saved: `${PAGE(40, 26, -5)}
        <path d="M86 20h34v56l-17-12-17 12Z" fill="var(--ea-bg,#fbf3f5)" stroke="${G}" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="m97 40 5 5 9-10" stroke="${A}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>
        <circle cx="34" cy="26" r="3" fill="${A}"/><circle cx="136" cy="92" r="2.5" fill="${A}"/>`,
    desk: `<rect x="18" y="86" width="132" height="8" rx="4" fill="${G}" opacity=".18"/>
        ${PAGE(30, 18, -6)}${PAGE(84, 14, 5)}
        <g transform="translate(70 6)"><circle cx="8" cy="8" r="7" fill="${A}"/><path d="M8 15v12" stroke="${A}" stroke-width="3" stroke-linecap="round"/></g>`,
    missing: `${PAGE(52, 22, 0)}
        <circle cx="112" cy="36" r="16" fill="var(--ea-bg,#fbf3f5)" stroke="${A}" stroke-width="3"/><path d="M112 29v8M112 42v.5" stroke="${A}" stroke-width="3.4" stroke-linecap="round"/>`,
};

export function emptyArt(kind = 'search') {
    return `<svg class="empty-art" viewBox="0 0 168 112" width="168" height="112" aria-hidden="true" focusable="false" fill="none">${ART[kind] || ART.search}</svg>`;
}
