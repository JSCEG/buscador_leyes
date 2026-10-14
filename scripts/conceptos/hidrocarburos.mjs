/**
 * "¿Cómo funciona?" · ¿Qué son los hidrocarburos? (anatomy kit, vendor/anatomy, MIT).
 *
 * A molecular-model kit on a bench plate: a ball-and-stick model held up by a display stand,
 * the kit's tray of spare balls in front, a boiling-point scale with a sliding cursor and a
 * sealed vial that shows what the substance is at 25 °C. The chips (or the arrow keys) pick
 * methane, propane or octane: the old bonds come off, the balls fly between the tray and the
 * model, and the new molecule snaps together. The scale's cursor slides to its boiling point
 * and the vial fills with liquid or empties to a gas.
 *
 * The geometry is a true staggered alkane chain: C–C 1.54 Å, C–H 1.09 Å, every angle the
 * tetrahedral 109.5°, drawn at 22 units per ångström. The kit holds 8 carbons and 18 hydrogens,
 * exactly one octane (CₙH₂ₙ₊₂), so the balls left in the tray are the ones the model doesn't use.
 * Boiling points at 1 atm: methane −161.5 °C, propane −42 °C, n-octane 125.6 °C.
 *
 * node scripts/conceptos/hidrocarburos.mjs [--light]  →  public/conceptos/hidrocarburos(-light).html
 */
import * as k from "../../vendor/anatomy/kit/iso-kit.mjs";
import { themeOf, labelsSvg, writeFigure } from "./_shared.mjs";

const theme = themeOf();
const WIDTH = 640;
const HEIGHT = 352;

// ---------- the model (shared with the page) ----------
const MOLECULES = {
  metano: { n: 1, formula: "CH₄", name: "Metano", fuel: "gas natural", bp: -161.5 },
  propano: { n: 3, formula: "C₃H₈", name: "Propano", fuel: "gas LP", bp: -42 },
  octano: { n: 8, formula: "C₈H₁₈", name: "Octano", fuel: "gasolina", bp: 125.6 },
};
const ROOM = 25;
const ANG = 22; // world units per ångström
const CC = 1.54 * ANG;
const CH = 1.09 * ANG;
const HALF = (109.47 / 2) * (Math.PI / 180);
const R_C = 11.5;
const R_H = 7.4;
const R_STICK = 2;
const X0 = -52; // model centre
const MZ = 82; // height of the chain's mid-plane
const MODEL = `
const CC = ${CC}, CH = ${CH}, HALF = ${HALF}, X0 = ${X0}, MZ = ${MZ};
// A staggered zig-zag chain in the x–z plane; the middle of the chain sits high so the stand's
// cup meets the middle carbon (odd chains) or the middle C–C bond (even chains).
function moleculeOf(n) {
  const step = CC * Math.sin(HALF), lift = CC * Math.cos(HALF) / 2;
  const mid = (n - 1) / 2;
  const high = (i) => (n % 2 ? ((Math.round(i - mid) % 2) + 2) % 2 === 0 : ((i % 2) + 2) % 2 === 1);
  const at = (i) => [X0 + (i - mid) * step, 0, MZ + (high(i) ? lift : -lift)];
  const carbons = Array.from({ length: n }, (_, i) => at(i));
  const hydrogens = [], bonds = [];
  const unit = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  for (let i = 0; i < n; i++) {
    const c = carbons[i];
    const toward = [at(i - 1), at(i + 1)].map((p) => unit([p[0] - c[0], p[1] - c[1], p[2] - c[2]]));
    // Ends of the chain: the neighbour that isn't there is a hydrogen, along the same bond.
    if (i === 0) { hydrogens.push([c[0] + toward[0][0] * CH, 0, c[2] + toward[0][2] * CH]); bonds.push(["C", i, "H", hydrogens.length - 1]); }
    if (i === n - 1) { hydrogens.push([c[0] + toward[1][0] * CH, 0, c[2] + toward[1][2] * CH]); bonds.push(["C", i, "H", hydrogens.length - 1]); }
    const b = unit([toward[0][0] + toward[1][0], 0, toward[0][2] + toward[1][2]]);
    for (const side of [-1, 1]) {
      const d = [-b[0] * Math.cos(HALF), side * Math.sin(HALF), -b[2] * Math.cos(HALF)];
      hydrogens.push([c[0] + d[0] * CH, c[1] + d[1] * CH, c[2] + d[2] * CH]);
      bonds.push(["C", i, "H", hydrogens.length - 1]);
    }
    if (i > 0) bonds.push(["C", i - 1, "C", i]);
  }
  return { carbons, hydrogens, bonds };
}
`;
const model = new Function(`${MODEL}; return { moleculeOf };`)();
for (const [id, m] of Object.entries(MOLECULES)) {
  const g = model.moleculeOf(m.n);
  if (g.hydrogens.length !== 2 * m.n + 2) throw new Error(`${id}: ${g.hydrogens.length} H`);
  // Every bond the true length, every H–C–H and C–C–C angle tetrahedral.
  for (const [ka, ia, kb, ib] of g.bonds) {
    const a = (ka === "C" ? g.carbons : g.hydrogens)[ia], b = (kb === "C" ? g.carbons : g.hydrogens)[ib];
    const len = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    if (Math.abs(len - (kb === "C" ? CC : CH)) > 1e-6) throw new Error(`${id}: bond ${len}`);
  }
}

// ---------- world ----------
const PLATE = { x: -200, y: -66, w: 384, d: 160, r: 10 };
const PLATE_H = 8;
const FOOT_H = 5;
const TRAY = { x: -186, y: 22, w: 200, d: 64, r: 3 };
const TRAY_H = 5;
const C_SLOTS = Array.from({ length: 8 }, (_, i) => [TRAY.x + 14.5 + i * 24.4, TRAY.y + 14]);
const H_SLOTS = Array.from({ length: 18 }, (_, i) => [TRAY.x + 15 + (i % 9) * 21.25, TRAY.y + 37 + Math.floor(i / 9) * 16.5]);
const STAND = [X0, 0];
const CUP_TOP = MZ - 1.5;
const BOARD = { x: 112, y: -46, w: 22, d: 7, r: 0 };
const BOARD_Z0 = 6;
const BOARD_H = 116;
const T_MIN = -200;
const T_MAX = 150;
const T_Z0 = BOARD_Z0 + 8;
const T_Z1 = BOARD_Z0 + BOARD_H - 8;
const zOfT = (t) => T_Z0 + ((t - T_MIN) / (T_MAX - T_MIN)) * (T_Z1 - T_Z0);
const FACE_Y = BOARD.y + BOARD.d;
const VIAL = [142, 30];
const VIAL_R = 12;
const VIAL_Z0 = 7;
const VIAL_H = 52;
const PLAQUE = { x: 34, y: 66, w: 64, d: 16, r: 1.6 };

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [BOARD.x, BOARD.y, BOARD_Z0 + BOARD_H + 2], [X0 - 130, 0, MZ + 32], [X0 + 130, 0, MZ + 32]],
  WIDTH,
  HEIGHT,
  { pad: 18, headroom: 52, azimuth: 64, elevation: 30 },
);
const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (items, key) => [...items].sort((a, b) => k.depthOf(key(a), P) - k.depthOf(key(b), P));

// ---------- base ----------
function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 22), ([x, y]) => [x, y, 0])) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Ruler strip along the back edge, one major tick per ångström (22 units), minor every 0.2 Å.
  const strip = { x: PLATE.x + 20, y: PLATE.y + 9, w: 268, d: 8, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const t = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4.4, 5, strip.y + strip.d, 0.6, [-2.4, -4.4], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(D([at([strip.x + 1.6, strip.y + 2.4, 0.6]), at([strip.x + strip.w - 1.6, strip.y + 2.4, 0.6])], { size: 0.45 }));
  return out.join("");
}

// ---------- the kit's tray: sockets for 8 carbons and 18 hydrogens ----------
function tray() {
  const out = [];
  out.push(S(k.slabOf(TRAY, 0, TRAY_H, P, 6, 0.8), { tone: "mid", inner: L(k.sideSeam(TRAY, 2.4, P, 6), { tone: "faint" }) }));
  const top = TRAY_H;
  out.push(L(k.planOutline(k.insetPlan(TRAY, 2.2), top, P, 6), { tone: "faint" }));
  // The divider groove between the carbon row and the hydrogen rows runs from rim groove to rim groove.
  out.push(L(k.lineOnTop([TRAY.x + 2.2, TRAY.y + 25], [TRAY.x + TRAY.w - 2.2, TRAY.y + 25], top, P), { tone: "lo" }));
  out.push(L(C_SLOTS.map(([x, y]) => k.ring(x, y, 7.8, top, P, 32)).join(""), { tone: "lo" }));
  out.push(L(H_SLOTS.map(([x, y]) => k.ring(x, y, 5.2, top, P, 24)).join(""), { tone: "lo" }));
  out.push(D([...C_SLOTS, ...H_SLOTS].map(([x, y]) => at([x, y, top])), { size: 0.55, tone: "lo" }));
  return out.join("");
}

// ---------- display stand: a weighted foot, a rod with a clamp and a cup ----------
function stand() {
  const [x, y] = STAND;
  const out = [];
  out.push(S(k.cylinder(x, y, 19, 0, 3.6, P, 56, 0.6), { tone: "mid" }));
  out.push(L(k.ring(x, y, 14.6, 3.6, P, 48), { tone: "faint" }));
  out.push(D([0, 1, 2].map((i) => { const a = i * 2.094 + 0.5; return at([x + Math.cos(a) * 16.8, y + Math.sin(a) * 16.8, 3.6]); }), { size: 0.5 }));
  out.push(S(k.cylinder(x, y, 6, 3.6, 6, P, 32), { tone: "mid" }));
  out.push(L(k.knurl(x, y, 6, 4, 9.2, 30, P, 0.3), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, 2.4, 9.6, 36, P, 20), { tone: "mid", crease: "none" }));
  // Height clamp with its thumb screw on the side that faces the viewer.
  const clampZ = 44;
  out.push(S(k.cylinder(x, y, 4.2, clampZ, 7, P, 28, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: x + 3.6, y: y - 1.5, w: 4, d: 3, r: 0.4 }, clampZ + 2, 3, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(x + 9.4, y, 2.6, clampZ + 0.4, 6.2, P, 24), { tone: "mid" }));
  out.push(L(k.knurl(x + 9.4, y, 2.6, clampZ + 0.8, clampZ + 6.2, 14, P, 0.3), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, 1.5, clampZ + 7, CUP_TOP - 3.4 - clampZ - 7, P, 16), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(x, y, 3.2, CUP_TOP - 3.4, 3.4, P, 24, 0.3), { tone: "mid" }));
  out.push(L(k.ring(x, y, 2.2, CUP_TOP, P, 20), { tone: "lo" }));
  return out.join("");
}

// ---------- boiling-point scale with its cursor ----------
function board() {
  const out = [];
  const foot = { x: BOARD.x - 6, y: BOARD.y - 5, w: BOARD.w + 12, d: BOARD.d + 16, r: 2 };
  out.push(S(k.slabOf(foot, 0, BOARD_Z0, P, 4, 0.8), { tone: "mid" }));
  out.push(D(k.corners(foot, 2.6).map(([x, y]) => at([x, y, BOARD_Z0])), { size: 0.45 }));
  out.push(S(k.slabOf(BOARD, BOARD_Z0, BOARD_H, P, 3, 0), { tone: "hi", crease: "lo" }));
  // Ticks every 10 °C, rooted on the board's left edge; major every 50 °C, zero longest.
  const minor = [], major = [];
  for (let t = T_MIN; t <= T_MAX; t += 10) {
    const z = zOfT(t);
    const len = t === 0 ? 6.4 : t % 50 === 0 ? 5 : 3.2;
    (t % 50 === 0 ? major : minor).push(k.segment([BOARD.x, FACE_Y, z], [BOARD.x + len, FACE_Y, z], P));
  }
  out.push(L(minor.join(""), { tone: "lo" }), L(major.join(""), { tone: "mid" }));
  // A rule down the face, bottom edge to top edge: the column the boiling points hang from.
  const RULE = BOARD.x + BOARD.w - 5;
  out.push(L(k.segment([RULE, FACE_Y, BOARD_Z0], [RULE, FACE_Y, BOARD_Z0 + BOARD_H], P), { tone: "faint" }));
  // Room temperature (25 °C): a gold band from the left edge to the rule.
  out.push(L(k.segment([BOARD.x, FACE_Y, zOfT(ROOM)], [RULE, FACE_Y, zOfT(ROOM)], P), { tone: "mid", className: "hc-room" }));
  // The three boiling points as notches rooted on the rule.
  out.push(L(Object.values(MOLECULES).map((m) => k.segment([RULE - 4.5, FACE_Y, zOfT(m.bp)], [RULE, FACE_Y, zOfT(m.bp)], P)).join(""), { tone: "mid", className: "hc-notch" }));
  out.push(k.faceTextSvg(k.sideMatrix([BOARD.x + 3, FACE_Y], BOARD_Z0 + BOARD_H - 2.6, P, "left"), "°C", { size: 3.6, tone: "mid" }));
  out.push(D([at([BOARD.x + BOARD.w / 2, FACE_Y, BOARD_Z0 + 3]), at([BOARD.x + BOARD.w / 2 + 4, FACE_Y, BOARD_Z0 + BOARD_H - 4])], { size: 0.45 }));
  return out.join("");
}
// The cursor clips onto the face; built at 0 °C and moved along z by the page.
function cursor() {
  const z = zOfT(0) - 2;
  const plan = { x: BOARD.x - 2, y: FACE_Y, w: BOARD.w + 4, d: 2.6, r: 0.6 };
  const out = [S(k.slabOf(plan, z, 4, P, 2, 0.3), { tone: "hi", lit: true })];
  out.push(L(k.segment([plan.x, plan.y + plan.d, z + 2], [plan.x + plan.w, plan.y + plan.d, z + 2], P), { tone: "lit" }));
  out.push(S(k.slabOf({ x: plan.x + plan.w, y: plan.y + 0.4, w: 3.2, d: 1.8, r: 0.4 }, z + 0.8, 2.4, P, 2), { tone: "mid", crease: "none" }));
  return out.join("");
}

// ---------- the vial: what the substance is at 25 °C ----------
function vialBack() {
  const [x, y] = VIAL;
  const out = [];
  out.push(S(k.cylinder(x, y, 18, 0, 3, P, 56, 0.5), { tone: "mid" }));
  out.push(D([0, 1, 2, 3].map((i) => { const a = i * Math.PI / 2 + Math.PI / 4; return at([x + Math.cos(a) * 15.4, y + Math.sin(a) * 15.4, 3]); }), { size: 0.45 }));
  out.push(S(k.cylinder(x, y, VIAL_R + 1.6, 3, 4, P, 40), { tone: "mid" }));
  // Glass: a pale body whose outline is drawn now; the content goes on top of it.
  out.push(S(k.cylinder(x, y, VIAL_R, VIAL_Z0, VIAL_H, P, 48), { tone: "mid", crease: "none", className: "hc-glass" }));
  return out.join("");
}
function vialFront() {
  const [x, y] = VIAL;
  const top = VIAL_Z0 + VIAL_H;
  const out = [];
  // Stopper and its cap.
  out.push(S(k.cylinder(x, y, VIAL_R + 0.6, top - 2, 7, P, 40, 0.4), { tone: "mid" }));
  out.push(L(k.knurl(x, y, VIAL_R + 0.6, top - 1.4, top + 4.4, 30, P, 0.3), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, 3, top + 5, 2, P, 20), { tone: "mid" }));
  // A shine down the glass, from the collar to the stopper.
  const a = Math.PI * 0.62;
  // A highlight streak on the glass: a closed sliver from the collar to the stopper.
  const p = (r, da, z) => [x + Math.cos(a + da) * r, y + Math.sin(a + da) * r, z];
  out.push(`<path class="hc-shine" d="${k.pathOf([p(VIAL_R, 0, 7.4), p(VIAL_R, 0.13, 7.4), p(VIAL_R, 0.13, top - 2), p(VIAL_R, 0, top - 2)].map(at), true)}"/>`);
  return out.join("");
}

// ---------- plaque ----------
function plaque() {
  const out = [S(k.slabOf(PLAQUE, 0, 0.8, P, 4), { tone: "lo", crease: "none" })];
  out.push(L(k.planOutline(k.insetPlan(PLAQUE, 1.6), 0.8, P), { tone: "faint" }));
  out.push(L([[34, 4.4], [26, 7], [40, 9.6]].map(([w, dy]) => k.lineOnTop([PLAQUE.x + 6, PLAQUE.y + dy], [PLAQUE.x + 6 + w, PLAQUE.y + dy], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([PLAQUE.x + 3, PLAQUE.y + PLAQUE.d / 2, 0.8]), at([PLAQUE.x + PLAQUE.w - 3, PLAQUE.y + PLAQUE.d / 2, 0.8])], { size: 0.45 }));
  return out.join("");
}

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Un juego de modelos moleculares sobre una base: un modelo de esferas y varillas en un soporte, con esferas negras de carbono y blancas de hidrógeno; al frente, la charola con las piezas que no se usan; a la derecha, una escala de temperatura de ebullición con un cursor y un frasco que muestra si la sustancia es gas o líquido a 25 °C.",
  body: [
    base(),
    plaque(),
    tray(),
    board(),
    `<g data-part="cursor">${cursor()}</g>`,
    `<g data-part="model"></g>`,
    vialBack(),
    `<g data-part="vial"></g>`,
    vialFront(),
    `<g data-part="labels"></g>`,
  ],
});

const STAND_SVG = stand();
const live = `
${MODEL}
const P = ${JSON.stringify(P)};
const MOLECULES = ${JSON.stringify(MOLECULES)}, ORDER = ["metano", "propano", "octano"], ROOM = ${ROOM};
const R_C = ${R_C}, R_H = ${R_H}, R_STICK = ${R_STICK}, TRAY_TOP = ${TRAY_H};
const C_SLOTS = ${JSON.stringify(C_SLOTS)}, H_SLOTS = ${JSON.stringify(H_SLOTS)};
const STAND_SVG = ${JSON.stringify(STAND_SVG)}, STAND_KEY = [${X0}, 0, ${CUP_TOP - 14}];
const T_MIN = ${T_MIN}, T_MAX = ${T_MAX}, T_Z0 = ${T_Z0}, T_Z1 = ${T_Z1};
const zOfT = (t) => T_Z0 + ((t - T_MIN) / (T_MAX - T_MIN)) * (T_Z1 - T_Z0);
const VIAL = ${JSON.stringify(VIAL)}, VIAL_R = ${VIAL_R}, VIAL_Z0 = ${VIAL_Z0}, VIAL_H = ${VIAL_H};
const BOARD = ${JSON.stringify(BOARD)}, FACE_Y = ${FACE_Y};
const TRAY = ${JSON.stringify(TRAY)};
const labelsSvg = ${labelsSvg.toString()};
const at = (p) => iso(p, P);
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const modelEl = svg.querySelector('[data-part="model"]');
const cursorEl = svg.querySelector('[data-part="cursor"]');
const vialEl = svg.querySelector('[data-part="vial"]');
const labelsEl = svg.querySelector('[data-part="labels"]');
const readout = document.querySelector("[data-readout]");
const chips = [...document.querySelectorAll("[data-mol]")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const fmt = (n) => n.toLocaleString("es-MX", { maximumFractionDigits: 1 }).replace("-", "−");
const traySpot = (kind, i) => { const s = kind === "C" ? C_SLOTS[i] : H_SLOTS[i]; return [s[0], s[1], TRAY_TOP + (kind === "C" ? R_C : R_H) * 0.72]; };
const GEOM = Object.fromEntries(ORDER.map((id) => [id, moleculeOf(MOLECULES[id].n)]));
function targetsOf(id) {
  const g = GEOM[id];
  return { C: C_SLOTS.map((_, i) => g.carbons[i] || traySpot("C", i)), H: H_SLOTS.map((_, i) => g.hydrogens[i] || traySpot("H", i)) };
}
// Every ball has a place: on the model or in its socket in the tray.
let current = "metano", pos = targetsOf("metano"), from = pos, to = pos, since = 99, bondAlpha = 1, oldBonds = GEOM.metano.bonds;
const delays = { C: C_SLOTS.map((_, i) => i * 0.05), H: H_SLOTS.map((_, i) => 0.12 + i * 0.03) };
const FLY = 0.9, OFF = 0.3;
const settleAt = () => OFF + Math.max(...delays.H) + FLY;
let tempNow = MOLECULES.metano.bp, levelNow = 0;
function sphere(p, kind) {
  return { depth: depthOf(p, P), svg: solidSvg(sphereOf(p, kind === "C" ? R_C : R_H, P, { steps: 40 }), { tone: kind === "C" ? "mid" : "hi", className: kind === "C" ? "hc-c" : "hc-h" }) };
}
function stick(a, b, ra, rb, alpha) {
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], len = Math.hypot(d[0], d[1], d[2]);
  const F = frameAlong(a, d);
  const s0 = Math.sqrt(ra * ra - R_STICK * R_STICK) - 0.4, s1 = len - Math.sqrt(rb * rb - R_STICK * R_STICK) + 0.4;
  const mid = [a[0] + d[0] / 2, a[1] + d[1] / 2, a[2] + d[2] / 2];
  return { depth: depthOf(mid, P), svg: '<g opacity="' + alpha.toFixed(2) + '">' + solidSvg(disc(s0, s1, R_STICK, F, P, { steps: 16 }), { tone: "mid", className: "hc-stick" }) + "</g>" };
}
function modelSvg() {
  const items = [{ depth: depthOf(STAND_KEY, P), svg: STAND_SVG }];
  for (const kind of ["C", "H"]) pos[kind].forEach((p) => items.push(sphere(p, kind)));
  const bonds = since < OFF ? oldBonds : GEOM[current].bonds;
  if (bondAlpha > 0.01) for (const [ka, ia, kb, ib] of bonds) items.push(stick(pos[ka][ia], pos[kb][ib], ka === "C" ? R_C : R_H, kb === "C" ? R_C : R_H, bondAlpha));
  items.sort((a, b) => a.depth - b.depth);
  return items.map((item) => item.svg).join("");
}
function vialSvg(level, clock) {
  const [x, y] = VIAL;
  let out = "";
  if (level > 0.01) {
    const h = level * (VIAL_H - 10);
    out += solidSvg(cylinder(x, y, VIAL_R - 0.9, VIAL_Z0 + 0.6, h, P, 40), { tone: "mid", crease: "none", className: "hc-liquid" });
  }
  // Gas: a few molecules drifting through the whole vial; they fade as liquid takes over.
  const gas = 1 - level / 0.42;
  if (gas > 0.02) {
    const dots = [];
    for (let i = 0; i < 14; i++) {
      const a = i * 2.39996 + clock * (0.35 + (i % 3) * 0.12), r = (VIAL_R - 3.2) * Math.sqrt(((i * 0.618) % 1) * 0.85 + 0.1);
      const z = VIAL_Z0 + 5 + (((i * 0.381 + clock * 0.06 * (1 + (i % 4) * 0.3)) % 1 + 1) % 1) * (VIAL_H - 12);
      dots.push(at([x + Math.cos(a) * r, y + Math.sin(a) * r, z]));
    }
    out += '<g opacity="' + clamp(gas, 0, 1).toFixed(2) + '">' + dotsSvg(dots, { size: 0.75, tone: "mid" }) + "</g>";
  }
  return out;
}
function labelList() {
  const g = GEOM[current];
  const n = g.carbons.length, c = g.carbons[n > 4 ? 4 : n - 1];
  let h = g.hydrogens[0], best = -1e9;
  for (const p of g.hydrogens) { const score = p[2] * 2 + p[0] - Math.abs(p[1]) * 0.4; if (score > best) { best = score; h = p; } }
  const b0 = g.carbons[0], b1 = g.hydrogens[0];
  const mid = [b0[0] + (b1[0] - b0[0]) * 0.55, b0[1] + (b1[1] - b0[1]) * 0.55, b0[2] + (b1[2] - b0[2]) * 0.55 + R_STICK];
  return [
    { n: 1, name: "Carbono (C)", anchor: [c[0], c[1], c[2] + R_C * 0.6], dx: 30, dy: n > 4 ? 68 : 70 },
    { n: 2, name: "Hidrógeno (H)", anchor: [h[0], h[1], h[2] + R_H * 0.7], dx: n > 4 ? -6 : 30, dy: n > 4 ? -36 : -8 },
    { n: 3, name: "Enlace C–H", anchor: mid, dx: -38, dy: -4 },
    { n: 4, name: "Piezas sin usar", anchor: [TRAY.x + 60, TRAY.y + TRAY.d, 3], dx: -8, dy: 30 },
    { n: 5, name: "Ebullición", anchor: [BOARD.x + BOARD.w + 3, FACE_Y + 1, zOfT(tempNow) + 1], dx: 26, dy: -30 },
    { n: 6, name: "Frasco a 25 °C", anchor: [VIAL[0] + VIAL_R * 0.7, VIAL[1] + VIAL_R * 0.7, VIAL_Z0 + VIAL_H - 12], dx: 26, dy: 26 },
  ];
}
let clock = 0, last = 0, frame = 0, visible = false, touring = !still.matches, tourClock = 0, idle = 0, shownKey = "";
function select(id, user) {
  if (user) { touring = false; clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; tourClock = 0; run(); }, 9000); }
  chips.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mol === id)));
  if (id === current) return;
  oldBonds = GEOM[current].bonds;
  from = { C: pos.C.map((p) => p.slice()), H: pos.H.map((p) => p.slice()) };
  current = id;
  to = targetsOf(id);
  since = 0;
  if (still.matches) { since = 99; pos = to; bondAlpha = 1; tempNow = MOLECULES[id].bp; levelNow = MOLECULES[id].bp > ROOM ? 0.42 : 0; }
  draw();
  run();
}
function step(dt) {
  if (since < 50) {
    since += dt;
    const done = settleAt();
    bondAlpha = since < OFF ? 1 - since / OFF : clamp((since - done) / 0.35, 0, 1);
    for (const kind of ["C", "H"]) pos[kind] = from[kind].map((p, i) => {
      const q = to[kind][i];
      if (p[0] === q[0] && p[1] === q[1] && p[2] === q[2]) return q;
      const t = ease(clamp((since - OFF - delays[kind][i]) / FLY, 0, 1));
      const hop = Math.sin(Math.PI * t) * 26;
      return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t + hop];
    });
    if (since > done + 0.4) { since = 99; pos = to; bondAlpha = 1; }
  }
  const m = MOLECULES[current];
  tempNow += (m.bp - tempNow) * (1 - Math.exp(-dt / 0.45));
  const wantLevel = m.bp > ROOM ? 0.42 : 0;
  levelNow += (wantLevel - levelNow) * (1 - Math.exp(-dt / 0.6));
}
function draw() {
  modelEl.innerHTML = modelSvg();
  cursorEl.setAttribute("transform", translateAlong(P, [0, 0, zOfT(tempNow) - zOfT(0)]));
  vialEl.innerHTML = vialSvg(levelNow, clock);
  const key = current + (since > 50 ? ":rest" : ":move") + (compact ? ":c" : "") + Math.round(tempNow);
  if (key !== shownKey) { shownKey = key; labelsEl.innerHTML = labelsSvg(labelList(), at); }
  labelsEl.style.opacity = since > 50 ? "1" : "0";
  const m = MOLECULES[current];
  const state = m.bp > ROOM ? "líquido" : "gas";
  const text = compact
    ? m.formula + " · " + m.n + " C · " + state + " a 25 °C · hierve a " + fmt(m.bp) + " °C"
    : m.name + " " + m.formula + " (" + m.fuel + ") · " + m.n + (m.n === 1 ? " carbono" : " carbonos") + " · a 25 °C es " + state + " · hierve a " + fmt(m.bp) + " °C";
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(ORDER.indexOf(current) * 50));
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  clock += dt;
  if (touring) { tourClock += dt; if (tourClock > 5.5) { tourClock = 0; select(ORDER[(ORDER.indexOf(current) + 1) % 3], false); } }
  step(dt);
  draw();
  frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible && !still.matches) { last = 0; frame = requestAnimationFrame(tick); } };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
chips.forEach((b) => b.addEventListener("click", (event) => { event.stopPropagation(); select(b.dataset.mol, true); }));
stage.addEventListener("keydown", (event) => {
  const dir = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 0;
  if (!dir) return;
  event.preventDefault();
  select(ORDER[clamp(ORDER.indexOf(current) + dir, 0, 2)], true);
});
draw();
`;

const controls = `<div class="cf-chips" role="group" aria-label="Elegir hidrocarburo">
  <button type="button" data-mol="metano" aria-pressed="true">Metano · CH₄</button>
  <button type="button" data-mol="propano" aria-pressed="false">Propano · C₃H₈</button>
  <button type="button" data-mol="octano" aria-pressed="false">Octano · C₈H₁₈</button>
</div>`;

const INK = theme === "light"
  ? { c: ["#2c2c31", "#37373d", "#43434a", "#505057"], cEdge: "#141416", hEdge: "#5a5a60", liquid: "#e9c46a", liquidEdge: "#A57F2C", glass: "#eef3f2", room: "#A57F2C", notch: "#9B2247" }
  : { c: ["#2a2a2f", "#34343a", "#3f3f46", "#4c4c54"], cEdge: "#9a9aa0", hEdge: "#f2f2f2", liquid: "#7d6020", liquidEdge: "#e2b85a", glass: "#18201f", room: "#e2b85a", notch: "#ea8aa8" };
const hShades = theme === "light" ? ["#d9d9d6", "#e6e6e3", "#f1f1ee", "#fbfbfa"] : ["#8e8e8e", "#a8a8a8", "#c2c2c2", "#dadada"];
const CSS = `<style>
.hc-c>.iso-fill{fill:${INK.c[0]}}${INK.c.map((c, i) => `.iso-solid.hc-c[data-seamless]>.iso-shade[data-shade="${i}"]{fill:${c};stroke:${c}}`).join("")}.hc-c>.iso-edge{stroke:${INK.cEdge}}
.hc-h>.iso-fill{fill:${hShades[0]}}${hShades.map((c, i) => `.iso-solid.hc-h[data-seamless]>.iso-shade[data-shade="${i}"]{fill:${c};stroke:${c}}`).join("")}.hc-h>.iso-edge{stroke:${INK.hEdge}}
.hc-glass>.iso-fill,.hc-glass>.iso-shade,.hc-glass>.iso-top{fill:${INK.glass};stroke:none}
.hc-liquid>.iso-fill,.hc-liquid>.iso-shade{fill:${INK.liquid};stroke:none;opacity:.85}.hc-liquid>.iso-top{fill:${INK.liquid};opacity:.6}.hc-liquid>.iso-edge{stroke:${INK.liquidEdge}}
.hc-shine{fill:#ffffff;opacity:.55;stroke:none}.hc-room{stroke:${INK.room};stroke-width:1.3}.hc-notch{stroke:${INK.notch};stroke-width:1.1}
</style>`;

writeFigure({
  id: "hidrocarburos",
  title: "Estructura molecular de hidrocarburos",
  theme,
  svg: svg.replace("</svg>", `${CSS}</svg>`),
  controls,
  live,
  lathe: ["sphereOf", "disc", "frameAlong"],
  plate: {
    fig: "Fig 8",
    title: "Hidrocarburos: cadenas de carbono",
    hint: "Elige una molécula",
    ariaLabel: "Modelo molecular: las flechas cambian entre metano, propano y octano",
    keys: [
      { mark: "raised", label: "Esferas negras: carbono · blancas: hidrógeno" },
      { mark: "gold", label: "Marca de 25 °C en la escala" },
      { mark: "red", label: "Punto de ebullición de cada molécula" },
    ],
    caption: "Un hidrocarburo es una cadena de átomos de carbono rodeada de hidrógenos: cada carbono forma cuatro enlaces, por eso estos alcanos tienen la fórmula CₙH₂ₙ₊₂. Mientras más larga la cadena, más se atraen las moléculas entre sí y más alto es su punto de ebullición: el metano (1 carbono) hierve a −161.5 °C y el propano (3) a −42 °C, así que a 25 °C son gases; el octano (8) hierve a 125.6 °C y es líquido, como la gasolina. Distancias reales a escala: C–C 1.54 Å, C–H 1.09 Å, ángulos de 109.5°.",
  },
});
