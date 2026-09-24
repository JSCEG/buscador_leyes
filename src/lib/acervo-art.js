/**
 * Line illustrations for the acervo home. Static, trusted markup drawn in code so it stays light,
 * follows the theme through currentColor and can animate (the motion stops with reduced motion).
 */

const f = value => Number(value.toFixed(1));

/** A lattice transmission tower; returns its path and the points where wires hang. */
function tower(cx, base, height, scale) {
    const top = base - height;
    const neck = top + height * 0.24;
    const legAt = y => 20 * scale - (14 * scale) * ((base - y) / (base - neck));
    const parts = [
        `M${f(cx - 20 * scale)} ${base} L${f(cx - 6 * scale)} ${f(neck)} L${cx} ${f(top)} L${f(cx + 6 * scale)} ${f(neck)} L${f(cx + 20 * scale)} ${base}`,
    ];
    const steps = 4;
    for (let i = 0; i < steps; i++) {
        const y1 = base - (base - neck) * (i / steps), y2 = base - (base - neck) * ((i + 1) / steps);
        parts.push(`M${f(cx - legAt(y1))} ${f(y1)} L${f(cx + legAt(y2))} ${f(y2)} M${f(cx + legAt(y1))} ${f(y1)} L${f(cx - legAt(y2))} ${f(y2)}`);
    }
    const upper = top + height * 0.1;
    const armLow = 27 * scale, armHigh = 18 * scale, drop = 7 * scale;
    parts.push(`M${f(cx - armLow)} ${f(neck)} H${f(cx + armLow)} M${f(cx - armHigh)} ${f(upper)} H${f(cx + armHigh)}`);
    const hangs = [[cx - armLow, neck], [cx + armLow, neck], [cx - armHigh, upper], [cx + armHigh, upper]]
        .map(([x, y]) => [f(x), f(y + drop)]);
    for (const [x, y] of hangs) parts.push(`M${x} ${f(y - drop)} V${y}`);
    return { d: parts.join(' '), hangs };
}

const wire = ([x1, y1], [x2, y2], sag) => `M${x1} ${y1} Q${f((x1 + x2) / 2)} ${f(Math.max(y1, y2) + sag)} ${x2} ${y2}`;

function turbine(x, base, height, blade) {
    const hub = base - height;
    const one = `M0 0 C${f(blade * 0.12)} ${f(-blade * 0.25)} ${f(blade * 0.1)} ${f(-blade * 0.7)} 0 ${-blade} C${f(-blade * 0.07)} ${f(-blade * 0.7)} ${f(-blade * 0.07)} ${f(-blade * 0.25)} 0 0Z`;
    return `<path class="ink" d="M${f(x - 2)} ${base} L${f(x - 0.8)} ${hub} M${f(x + 2)} ${base} L${f(x + 0.8)} ${hub}"/>`
        + `<g transform="translate(${x} ${hub})"><g class="ac-art-spin"><circle r="${blade}" fill="none" stroke="none"/>`
        + [0, 120, 240].map(angle => `<path class="ink fill" d="${one}" transform="rotate(${angle})"/>`).join('')
        + '<circle class="accent" r="3"/></g></g>';
}

function buildHero() {
    const ground = 282;
    const t1 = tower(82, ground, 178, 1);
    const t2 = tower(226, ground, 124, 0.7);
    const wires = [], flows = [];
    const left = t1.hangs.map(([, y]) => [-12, f(y + 16)]);
    const right = t2.hangs.map(([, y]) => [500, f(y + 22)]);
    t1.hangs.forEach((point, index) => {
        wires.push(wire(left[index], point, 10), wire(point, t2.hangs[index], 18), wire(t2.hangs[index], right[index], 14));
    });
    flows.push(wire(t1.hangs[1], t2.hangs[1], 18), wire(t2.hangs[3], right[3], 14));
    const sunRays = Array.from({ length: 10 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 10;
        return `M${f(336 + Math.cos(a) * 36)} ${f(70 + Math.sin(a) * 36)} L${f(336 + Math.cos(a) * 46)} ${f(70 + Math.sin(a) * 46)}`;
    }).join(' ');
    const columns = [273, 289, 305, 321].map(x => `M${x} 244 V270`).join(' ');
    const panels = [0, 1, 2].map(i => {
        const x = 300 + i * 58;
        return `<path class="ink fill" d="M${x} 316 L${x + 12} 292 H${x + 58} L${x + 46} 316Z"/>`
            + `<path class="ink thin" d="M${x + 6} 304 H${x + 52} M${x + 27.3} 316 L${x + 39.3} 292"/>`;
    }).join('');
    return `<svg class="ac-art" viewBox="0 0 490 330" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">`
        + `<circle class="accent fill" cx="336" cy="70" r="26"/><path class="accent ac-art-rays" d="${sunRays}"/>`
        + `<path class="ink faint" d="M-10 ${ground} C90 270 170 278 250 281 S400 272 500 278"/>`
        + `<path class="ink thin" d="${wires.join(' ')}"/>`
        + flows.map(d => `<path class="ac-art-flow" pathLength="100" d="${d}"/>`).join('')
        + `<path class="ink" d="${t1.d}"/><path class="ink" d="${t2.d}"/>`
        + `<path class="accent fill" d="M262 236 L297 216 L332 236Z"/><path class="ink" d="M260 236 H334 V242 H260Z ${columns} M258 270 H336 M254 276 H340 M250 282 H344"/><circle class="accent" cx="297" cy="229" r="2.4"/>`
        + turbine(404, ground, 150, 44) + turbine(456, ground, 104, 28)
        + panels
        + `<path class="accent" d="M-10 304 H236 M-10 312 H236 M40 300 V316 M110 300 V316 M180 300 V316"/><circle class="accent" cx="146" cy="308" r="7"/><path class="accent thin" d="M146 301 V315 M139 308 H153"/>`
        + '</svg>';
}

let heroMarkup = null;
export function heroArt() {
    heroMarkup ||= buildHero();
    return heroMarkup;
}

function gear(cx, cy, outer, inner, teeth) {
    const points = [];
    for (let i = 0; i < teeth * 4; i++) {
        const a = (Math.PI * 2 * i) / (teeth * 4) - Math.PI / 2;
        const r = i % 4 < 2 ? outer : inner;
        points.push(`${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r)}`);
    }
    return `M${points.join(' L')}Z`;
}

// Small two-tone scenes for the collection tiles (48×48): tinted shapes carry class "fill".
const SPOTS = Object.freeze({
    leyes: '<path class="fill" d="M8 18 24 9l16 9Z"/><path d="M8 18 24 9l16 9ZM9 18h30M13 22v13M21 22v13M27 22v13M35 22v13M9 35h30M6 40h36"/><circle cx="24" cy="14.6" r="1.5"/>',
    reglamentos: '<path class="fill" d="M24 14c-4.5-3-10-4-17-3v25c7-1 12.5 0 17 3 4.5-3 10-4 17-3V11c-7-1-12.5 0-17 3Z"/><path d="M24 14c-4.5-3-10-4-17-3v25c7-1 12.5 0 17 3 4.5-3 10-4 17-3V11c-7-1-12.5 0-17 3ZM24 14v25M11 18c3.2-.3 6.2.2 9 1.3M11 23c3.2-.3 6.2.2 9 1.3M11 28c3.2-.3 6.2.2 9 1.3M28 23c2.8-1.1 5.8-1.6 9-1.3M28 28c2.8-1.1 5.8-1.6 9-1.3"/><path d="M30 12.4V20l2.6-1.8 2.6 1.8v-8.1"/>',
    acuerdos: '<path d="M16 7h16l7 7v23"/><path class="fill" d="M9 11h17l6 6v25H9Z"/><path d="M9 11h17l6 6v25H9ZM26 11v6h6M13 22h12M13 27h14M13 32h7"/><circle class="fill" cx="27" cy="36" r="5.5"/><circle cx="27" cy="36" r="5.5"/><path d="m24.5 41-1.5 5 4-1.8 4 1.8-1.5-5"/>',
    dacg: '<rect class="fill" x="10" y="9" width="28" height="33" rx="3"/><rect x="10" y="9" width="28" height="33" rx="3"/><path d="M18 6.5h12v5.5H18Z"/><path d="m15 20 2.2 2.2 4-4.2M25 20.5h8M15 28l2.2 2.2 4-4.2M25 28.5h8M15 36l2.2 2.2 4-4.2M25 36.5h8"/>',
    convocatorias: '<path class="fill" d="M7 20v8a2 2 0 0 0 2 2h6l14 9V9L15 18H9a2 2 0 0 0-2 2Z"/><path d="M7 20v8a2 2 0 0 0 2 2h6l14 9V9L15 18H9a2 2 0 0 0-2 2ZM15 18v12M15.5 30l2 9h4l-1.6-7.6"/><path d="M34 19a7.5 7.5 0 0 1 0 10M38.5 14.5a14 14 0 0 1 0 19"/>',
    normas: `<path class="fill" d="${gear(24, 24, 17, 13.5, 9)}"/><path d="${gear(24, 24, 17, 13.5, 9)}"/><circle cx="24" cy="24" r="8"/><path d="m20.4 24.2 2.5 2.5 4.8-5.2"/>`,
    otros: '<path class="fill" d="M8 19h32v19a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2Z"/><path d="M8 19h32v19a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2ZM20 26h8"/><rect x="6" y="12" width="36" height="7" rx="1.6"/><path d="M13 12V7h15l3 3v2"/>',
});

export function collectionSpot(groupId, size = 48) {
    const paths = SPOTS[groupId] || SPOTS.otros;
    return `<svg class="ac-spot" aria-hidden="true" focusable="false" width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}
