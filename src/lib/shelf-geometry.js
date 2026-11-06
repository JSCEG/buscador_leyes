/**
 * Geometry of the home shelf: where each tome sits on the curved arc, how the spring moves and how
 * the shelf behaves. Pure functions, no DOM, so every value can be tested.
 */
const SPINE = 0.16;
const COVER = 0.72;
const GAP = 0.012;
const FALLOFF_DESKTOP = 1.3;
const FALLOFF_MOBILE = 1.05;
const PERSPECTIVE = 1400;
const VISIBLE_RANGE = 1.95;
const MAX_TURN = 14;
const TABLE_STEP = 2;
const MAX_DT = 0.05;

const smoothstep = x => x * x * (3 - 2 * x);

/** Measures for a tome height H, with the screen-x table the arc integrates once per size. */
export function shelfMetrics(H, { mobile = false } = {}) {
    const U = H * (mobile ? FALLOFF_MOBILE : FALLOFF_DESKTOP);
    const steps = Math.ceil((3 * U) / TABLE_STEP) + 1;
    const xs = new Float64Array(steps);
    for (let i = 1; i < steps; i++) xs[i] = xs[i - 1] + 2 / (1 + (((i - 1) * TABLE_STEP) / U) ** 1.6);
    return { H, ws: H * SPINE, d: H * COVER, gap: H * GAP, U, P: PERSPECTIVE, xs };
}

/** Shortest signed distance from s to v on a circular shelf of n tomes, in [-n/2, n/2). */
export function rel(v, s, n) {
    const offset = (((v - s) % n) + n) % n;
    return offset >= n / 2 ? offset - n : offset;
}

const blend = r => (Math.abs(r) < 1 ? (r + Math.sin(Math.PI * r) / Math.PI) / 2 : Math.sign(r) * 0.5);

/** Distance along the arc from the centre; the open cover pushes its neighbours apart smoothly. */
export function arcLength(r, m) {
    return r * (m.ws + m.gap) + (m.d - m.ws + 1.4 * m.gap) * blend(r);
}

export function screenScale(u, m) {
    return 1 / (1 + (Math.abs(u) / m.U) ** 1.6);
}

/** Screen position at arc length u: far spines pack tighter. */
export function screenX(u, m) {
    const at = Math.min(Math.abs(u) / TABLE_STEP, m.xs.length - 1);
    const low = Math.floor(at);
    const high = Math.min(low + 1, m.xs.length - 1);
    return Math.sign(u) * (m.xs[low] + (m.xs[high] - m.xs[low]) * (at - low));
}

/** Full transform of the tome at relative index r. */
export function tomeTransform(r, m, { lift = 0, tiltX = 0, tiltY = 0 } = {}) {
    const o = smoothstep(Math.max(0, 1 - Math.abs(r)));
    const u = arcLength(r, m);
    const sc = screenScale(u, m);
    if (Math.abs(u) > m.U * VISIBLE_RANGE) {
        return { visible: false, x: 0, y: 0, z: 0, rotateX: 0, rotateY: 0, o, sc, zIndex: 0, spineShade: 0, coverShade: 0 };
    }
    const k = 1 / sc;
    const z = m.P * (1 - k) + o * m.H * 0.1;
    return {
        visible: true,
        x: screenX(u, m) * k,
        y: (m.H * 0.5 * (1 - sc) * 0.42 + o * m.H * 0.012 - lift * m.H * 0.05) * k,
        z,
        rotateX: tiltX * o,
        rotateY: Math.sign(u) * Math.min(1, Math.abs(u) / m.U) * MAX_TURN * (1 - o) - 90 * o + tiltY * o,
        o,
        sc,
        zIndex: Math.round(3000 + z),
        spineShade: Math.min(0.35, o * 0.55 + (1 - sc) * 0.2),
        coverShade: (1 - o) * 0.3,
    };
}

export function stepSpring(s, T, dt, k) {
    return s + (T - s) * (1 - Math.exp(-k * Math.min(dt, MAX_DT)));
}

