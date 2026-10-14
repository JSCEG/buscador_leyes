/**
 * "¿Cómo funciona?" · Refinación: torre de destilación atmosférica (anatomy kit, vendor/anatomy, MIT).
 *
 * A scale model of a small crude unit on a base. A box furnace with floor burners heats the crude;
 * a transfer line takes it into the flash zone of a tall column (skirt, weld seams, manway, two
 * platforms with ladders and handrails). The vapours rise through the trays and condense at
 * different heights: kerosene (turbosina) and diesel are drawn off the side through flanged lines
 * into product tanks, the residue leaves the bottom through a pump towards the vacuum unit, and the
 * overhead vapour goes to a condenser and a reflux drum that splits gas/LPG (to a sphere) from
 * naphtha (to a tank). A painted scale on the shell shows where each cut condenses.
 *
 * Control: the pointer (or the arrows) sets the furnace outlet temperature, 330–380 °C. Model:
 *   - Crude: a typical blend of the Mexican refining system (Istmo/Maya, about 27 °API), described
 *     by an approximate true-boiling-point (TBP) curve, cumulative % volume distilled vs °C:
 *     40 °C 2.5 % · 100 °C 9 % · 180 °C 21 % · 240 °C 30 % · 300 °C 40 % · 350 °C 48 % · 400 °C 56 %.
 *     Illustrative values, not an assay.
 *   - Cut points on the TBP curve: gas/LPG < 40 °C; naphtha 40–180 °C; kerosene 180–240 °C;
 *     diesel 240 °C up to the residue cut; residue above it. Real product boiling ranges overlap
 *     (the labels give the usual ranges); the model needs one cut point between each pair.
 *   - The residue cut point follows the furnace: about 10 °C below the furnace outlet temperature
 *     (pressure drop and stripping steam roughly cancel the flash cooling). So heating harder
 *     vaporises more: diesel rises and residue falls; the lighter cuts are already all vapour.
 *     Above about 370–380 °C the crude starts to crack and coke the tubes, which is why the slider
 *     stops there. Throughput is fixed at 100,000 barrels a day for the barrel figures.
 *
 * Pipes come from kit/tube.mjs and the geometry is proved by kit/audit.mjs (`--audit`). Those two
 * modules are read from vendor/anatomy/kit when vendored, otherwise from the anatomy skill.
 *
 * node scripts/conceptos/refinacion.mjs [--light] [--audit]  →  public/conceptos/refinacion(-light).html
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as k from "../../vendor/anatomy/kit/iso-kit.mjs";
import * as G from "../../vendor/anatomy/kit/lathe.mjs";
import { themeOf, labelsSvg, writeFigure } from "./_shared.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KITS = [join(HERE, "..", "..", "vendor", "anatomy", "kit"), join(homedir(), ".claude", "skills", "anatomy", "kit")];
const KIT = KITS.find((dir) => existsSync(join(dir, "tube.mjs")) && existsSync(join(dir, "audit.mjs")));
if (!KIT) throw new Error("refinacion: needs kit/tube.mjs and kit/audit.mjs (vendor/anatomy/kit or the anatomy skill)");
const { tubePieces, tubeSvg } = await import(pathToFileURL(join(KIT, "tube.mjs")).href);
const A = await import(pathToFileURL(join(KIT, "audit.mjs")).href);

const theme = themeOf();
const WIDTH = 640;
const HEIGHT = 400;
const DEG = Math.PI / 180;

// ---------- the model (shared with the page) ----------
const MODEL = `
const TBP = [[-40, 0], [40, 2.5], [100, 9], [180, 21], [240, 30], [300, 40], [350, 48], [400, 56], [500, 69], [600, 80]];
const CUTS = { gas: 40, nafta: 180, turbosina: 240 };
const T_MIN = 330, T_MAX = 380, BPD = 100000;
function distilled(t) {
  for (let i = 1; i < TBP.length; i++) if (t <= TBP[i][0]) { const [t0, v0] = TBP[i - 1], [t1, v1] = TBP[i]; return v0 + (v1 - v0) * (t - t0) / (t1 - t0); }
  return TBP[TBP.length - 1][1];
}
function yields(furnace) {
  const cut = furnace - 10;
  const gas = distilled(CUTS.gas), nafta = distilled(CUTS.nafta) - gas, turbosina = distilled(CUTS.turbosina) - distilled(CUTS.nafta);
  const diesel = distilled(cut) - distilled(CUTS.turbosina), residuo = 100 - distilled(cut);
  return { cut, gas, nafta, turbosina, diesel, residuo };
}
`;
const model = new Function(`${MODEL}; return { yields, T_MIN, T_MAX };`)();

// ---------- world ----------
const PLATE = { x: -122, y: -38, w: 292, d: 96, r: 9 };
const PLATE_H = 8;
const FOOT_H = 5;
const CR = 11; // column shell radius
const SKIRT_Z = [5, 27.5];
const SHELL_TOP = 150;
const HEAD = CR / 2; // 2:1 elliptical head
const DRAWS = { residuo: 31, diesel: 68, turbosina: 100, flash: 40 };
const NOZZLE_OUT = 15; // pad face radius from the column axis
const PIPE_R = 1.5;
const FURN = { x: -108, y: 14, w: 36, d: 40, r: 1.2 };
const FURN_Z = [11, 50];
const TANKS = { diesel: { x: 50, y: 0, r: 8, h: 24, colour: "green" }, turbosina: { x: 78, y: 0, r: 8, h: 28, colour: "green" }, nafta: { x: 106, y: 38, r: 7.5, h: 22, colour: "gold" } };
const COND = { x: 106, y0: -22, y1: 6, z: 61, r: 5.5 };
const DRUM = { x: 138, y0: -22, y1: 2, z: 18, r: 6.5 };
const SPHERE = { x: 156, y: -18, z: 23, r: 9 };
const PUMP = { x: 32, y: 18, z: 10 };
const BL = { x: 24, y: 47, w: 12, d: 5, r: 0.8 };
const DIAL = { x: -24, y: 24, z: 46, r: 4.6 };
const FEED = { x: -50, y: 21.5, w: 9, d: 9, r: 0.8 };

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [0, 0, 172], [-90, 34, 104], [COND.x, 0, 172]],
  WIDTH,
  HEIGHT,
  { pad: 14, azimuth: 40, elevation: 30 },
);
const V = G.viewOf(P);
const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const fx = (n) => n.toFixed(1);

// ---------- recorder: every drawn item records its true shape; settle() sets the painter's keys ----------
const R = A.recorder(P);
const record = R.solid;
function item(name, ref, svg, shapes, { bias = 0, route, chunk } = {}) {
  R.put({ piece: "plant", at: ref, bias, svg, shapes, name, route, chunk });
}
const vertical = (o) => G.frameOf(o, [0, 0, 1], [1, 0, 0], [0, 1, 0]);

// A vessel profile with 2:1 elliptical heads: analytic radius and slope, so the shading is smooth.
function vessel(s0, s1, r, { bottom = true, top = true } = {}) {
  const h = r / 2;
  const radius = (s) => {
    if (bottom && s < s0 + h) return r * Math.sqrt(Math.max(0, 1 - ((s0 + h - s) / h) ** 2));
    if (top && s > s1 - h) return r * Math.sqrt(Math.max(0, 1 - ((s - (s1 - h)) / h) ** 2));
    return r;
  };
  const limit = (v) => Math.max(-60, Math.min(60, v));
  const slope = (s) => {
    if (bottom && s < s0 + h) { const t = (s0 + h - s) / h; return limit((r * t) / (h * Math.sqrt(Math.max(1e-4, 1 - t * t)))); }
    if (top && s > s1 - h) { const t = (s - (s1 - h)) / h; return limit((-r * t) / (h * Math.sqrt(Math.max(1e-4, 1 - t * t)))); }
    return 0;
  };
  const N = 16;
  const profile = [];
  if (bottom) {
    profile.push([s0, 0]);
    for (let i = 1; i <= N; i++) { const s = s0 + h * (1 - Math.cos(((i / N) * Math.PI) / 2)); profile.push([s, radius(s), 1]); }
  } else profile.push([s0, r]);
  if (top) {
    for (let i = 0; i <= N; i++) { const s = s1 - h * (1 - Math.cos(((1 - i / N) * Math.PI) / 2)); profile.push(i < N ? [s, radius(s), 1] : [s1, 0]); }
  } else profile.push([s1, r]);
  return { profile, radius, slope };
}

function turned(name, F, profile, style = {}, { inner = "", extra = "", bias = 0, smooth, owner } = {}) {
  const paths = G.solidOf(profile, F, P, smooth ? { smooth } : {});
  const id = R.nameFor(name);
  const shape = record(A.solid(F, profile, { name: id, owner, ...(smooth && smooth.radius ? { radius: smooth.radius } : {}) }));
  const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
  item(id, G.add3(F.o, G.mul3(F.a, mid)), S(paths, { tone: "hi", ...style, inner }) + extra, [shape], { bias });
  return shape;
}

function boxAt(name, plan, z, h, style = {}, { extra = "", bias = 0, bevel = 0.5, steps = 3, inner = "", owner } = {}) {
  const id = R.nameFor(name);
  const shape = record(A.slab(plan, z, h, { name: id, owner }, steps));
  item(id, [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2], S(k.slabOf(plan, z, h, P, steps, bevel), { tone: "mid", ...style, inner }) + extra, [shape], { bias });
  return shape;
}

function flangeAt(name, centre, axis, r, thick, { bolts = 6, tone = "hi", owner } = {}) {
  const F = G.frameAlong(centre, axis);
  const id = R.nameFor(name);
  const towards = G.dot3(F.a, V) > 0 ? thick / 2 : -thick / 2;
  const face = Math.abs(G.dot3(F.a, V)) > 0.12 && bolts ? D(G.dotsOf(F, towards, r * 0.72, bolts, P, { all: true }), { size: 0.34, tone: "mid" }) : "";
  item(id, centre, S(G.disc(-thick / 2, thick / 2, r, F, P), { tone }) + face, [record(A.disc(F, -thick / 2, thick / 2, r, { name: id, owner }))]);
}

// A nozzle pad on a round host whose axis is `hostAxis` through `o`; the pad leaves along `outward`.
function padOn(name, o, outward, hostAxis, hostR, a, s1, { tone = "hi", host, ring = false } = {}) {
  const axis = G.unit3(outward);
  const v = G.unit3(hostAxis);
  const u = G.unit3(G.cross3(v, axis));
  const F = G.frameOf(o, axis, u, v);
  const id = R.nameFor(name);
  const low = G.saddleStart(hostR, a, 0);
  const face = ring && G.dot3(axis, V) > 0.15 ? L(G.circleOf(F, s1, a * 0.55, P, 20), { tone: "faint" }) : "";
  item(id, G.add3(o, G.mul3(axis, (low + s1) / 2)), S(G.saddleOf(F, a, hostR, s1, P), { tone }) + face, [record(A.disc(F, low - 0.05, s1, a, { name: id, seated: true, cut: host ? [host] : [] }))]);
  return G.add3(o, G.mul3(axis, s1));
}

// A boss on a flat face (or on the pole of a head, flat there within 0.15).
function boss(name, centre, outward, r, length, { tone = "hi" } = {}) {
  const F = G.frameAlong(centre, outward);
  const id = R.nameFor(name);
  item(id, G.add3(centre, G.mul3(F.a, length / 2)), S(G.disc(0, length, r, F, P), { tone }), [record(A.disc(F, 0, length, r, { name: id }))]);
  return G.add3(centre, G.mul3(F.a, length));
}

// Pipes: filleted route, an end flange on each port, chunks depth-sorted one by one. Flow marks are
// drawn inside each chunk, phased by screen arc length so the dashes run on through every joint.
function pipe(name, control, r, { flow = null, tone = "hi", bend = 2.8, flangeR = 1.6, maxLength = 24 } = {}) {
  const line = G.fillet(control, Math.max(r * bend, 3), 12, { P, tube: r });
  const total = G.pathLength(line);
  const thick = Math.max(0.9, r * 0.55);
  const collars = [[0, -1], [total, 1]].map(([along, sign]) => {
    const tangent = G.tangentAlong(line, along);
    return { centre: G.add3(G.pointAlong(line, along), G.mul3(tangent, (-sign * thick) / 2)), tangent, gap: sign < 0 ? [0, thick] : [total - thick, total] };
  });
  const gaps = collars.map(({ gap }) => gap);
  const id = R.nameFor(name);
  R.route(id, line, r, { owner: id, gaps, rims: [r * flangeR, r * flangeR], piece: "plant" });
  const dense = G.resample(line, 0.5);
  const cum = [0];
  for (let i = 1; i < dense.length; i++) { const a = at(dense[i - 1]); const b = at(dense[i]); cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const step3 = total / (dense.length - 1);
  const screenAt = (s) => { const f = Math.max(0, Math.min(dense.length - 1, s / step3)); const i = Math.min(Math.floor(f), dense.length - 2); return cum[i] + (cum[i + 1] - cum[i]) * (f - i); };
  tubePieces(line, r, P, { maxLength, gaps, spacing: Math.max(0.8, Math.min(2.2, r * 0.3)) }).forEach((part, index) => {
    const marks = flow ? `<path class="cf-flow" data-flow="${flow[0]}" data-c="${flow[1]}" data-o="${fx(screenAt(part.from ?? 0))}" d="${k.pathOf(part.points.map(at))}"/>` : "";
    item(`${id}:${index}`, part.mid, tubeSvg(part, { tone }) + marks, [A.tube(part.points, part.radii, { name: `${id}:${index}` })], { route: id, chunk: index });
  });
  for (const { centre, tangent } of collars) flangeAt(`${id}.flange`, centre, tangent, r * flangeR, thick, { bolts: r > 1.8 ? 8 : 6, owner: id });
  return line;
}

// ---------- base (static, drawn first; recorded as the stand) ----------
function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const feet = [...k.corners(PLATE, 22), [PLATE.x + PLATE.w / 2, PLATE.y + 22], [PLATE.x + PLATE.w / 2, PLATE.y + PLATE.d - 22]];
  for (const [x, y] of feet.sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  record(A.slab(PLATE, -PLATE_H, PLATE_H, { name: "stand.plate", ground: true }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Ruler strip along the front edge, every 5 units, like a scale model.
  const strip = { x: PLATE.x + 18, y: PLATE.y + PLATE.d - 13, w: 118, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 5, 5, strip.y + 0.8, 0.6, [1.8, 3.4], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3, 0.6]), at([strip.x + strip.w - 2, strip.y + 3, 0.6])], { size: 0.45 }));
  // Label plate with rule lines (they stand for printed text).
  const label = { x: PLATE.x + PLATE.w - 40, y: PLATE.y + PLATE.d - 14, w: 26, d: 8, r: 1 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.4), 0.8, P, 2), { tone: "faint" }));
  out.push(L([[3.2, 18], [5, 12]].map(([dy, len]) => k.lineOnTop([label.x + 4, label.y + dy], [label.x + 4 + len, label.y + dy], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 2.2, label.y + label.d / 2, 0.8]), at([label.x + label.w - 2.2, label.y + label.d / 2, 0.8])], { size: 0.4 }));
  // Concrete pads.
  const pad = (plan, h, name) => { out.push(S(k.slabOf(plan, 0, h, P, 4, 0.4), { tone: "lo" })); record(A.slab(plan, 0, h, { name: `stand.${name}`, ground: true })); };
  pad({ x: FURN.x - 3, y: FURN.y - 3, w: FURN.w + 6, d: FURN.d + 6, r: 1.5 }, 2, "furnace-pad");
  out.push(S(k.cylinder(0, 0, 17.5, 0, 3, P, 64, 0.5), { tone: "lo" }));
  record(A.cylinder(0, 0, 17.5, 0, 3, { name: "stand.column-pad", ground: true }));
  pad({ x: COND.x - 9, y: COND.y0 - 1, w: 18, d: COND.y1 - COND.y0 + 2, r: 1.2 }, 1.2, "cond-pad");
  return out.join("");
}
const BASE = base();

// ---------- the column ----------
const COLUMN_F = vertical([0, 0, 0]);
// Painted temperature scale on the shell: where each cut condenses, with ticks every 4 units of height.
const SCALE = { angle: 26 * DEG, half: 3.6 * DEG };
const ZONES = [
  { from: SKIRT_Z[1] + 1, to: 46, colour: "red", alpha: 0.85 },
  { from: 46, to: 84, colour: "green", alpha: 0.85 },
  { from: 84, to: 116, colour: "green", alpha: 0.45 },
  { from: 116, to: 140, colour: "gold", alpha: 0.85 },
  { from: 140, to: SHELL_TOP - 1, colour: "gold", alpha: 0.45 },
];
function scaleSvg() {
  const quad = (z0, z1) => {
    const pts = [];
    for (let i = 0; i <= 6; i++) pts.push(at(G.pointOf(COLUMN_F, z0, CR, SCALE.angle - SCALE.half + (i / 6) * 2 * SCALE.half)));
    for (let i = 6; i >= 0; i--) pts.push(at(G.pointOf(COLUMN_F, z1, CR, SCALE.angle - SCALE.half + (i / 6) * 2 * SCALE.half)));
    return k.pathOf(pts, true);
  };
  const out = ZONES.map((zone) => `<path class="cf-zone" data-c="${zone.colour}" opacity="${zone.alpha}" d="${quad(zone.from, zone.to)}"/>`);
  out.push(L(quad(ZONES[0].from, ZONES[ZONES.length - 1].to), { tone: "lo" }));
  const edge = SCALE.angle + SCALE.half;
  const minor = [];
  const major = [];
  for (let z = ZONES[0].from + 1; z <= ZONES[ZONES.length - 1].to - 1; z += 4) {
    const big = Math.round(z - ZONES[0].from - 1) % 20 === 0;
    (big ? major : minor).push(k.pathOf([at(G.pointOf(COLUMN_F, z, CR, edge)), at(G.pointOf(COLUMN_F, z, CR, edge + (big ? 5 : 2.8) * DEG))]));
  }
  return out.join("") + L(minor.join(""), { tone: "lo" }) + L(major.join(""), { tone: "mid" });
}
function skirtOpening() {
  // Access opening in the skirt: a rounded hole on the surface, filled dark.
  const pts = [];
  for (let i = 0; i <= 32; i++) {
    const t = (i / 32) * Math.PI * 2;
    pts.push(at(G.pointOf(COLUMN_F, 15 + Math.sin(t) * 5.2, CR, 14 * DEG + Math.cos(t) * 12 * DEG)));
  }
  return `<path class="cf-void" d="${k.pathOf(pts, true)}"/>`;
}
const COL = vessel(SKIRT_Z[0], SHELL_TOP + HEAD, CR, { bottom: false, top: true });
const COLUMN = turned("column.shell", COLUMN_F, COL.profile, { tone: "hi", crease: "lo" }, {
  smooth: { slope: COL.slope, radius: COL.radius, rows: 6 },
  inner: L([SKIRT_Z[1], 52, 86, 118, SHELL_TOP].map((s) => G.arcOf(COLUMN_F, s, CR, P)).join(""), { tone: "faint" }) + skirtOpening() + scaleSvg(),
});
// Base ring with anchor bolts.
{
  const F = vertical([0, 0, 3]);
  item("column.base-ring", [0, 0, 4], S(G.disc(0, 2, 14.5, F, P, { bevel: 0.4 }), { tone: "mid" }) + D(G.dotsOf(F, 2, 13.1, 16, P, { all: true }), { size: 0.45, tone: "mid" }), [record(A.disc(F, 0, 2, 14.5, { name: "column.base-ring" }))]);
}
// Manway with a blind cover, high on the visible side.
{
  const dir = [Math.cos(62 * DEG), Math.sin(62 * DEG), 0];
  const face = padOn("column.manway", [0, 0, 128], dir, [0, 0, 1], CR, 3.8, CR + 2.6, { host: COLUMN });
  const c = G.add3(face, G.mul3(dir, 0.6));
  const F = G.frameAlong(c, dir);
  item("column.manway-cover", c, S(G.disc(-0.6, 0.6, 3.8, F, P), { tone: "hi" }) + D(G.dotsOf(F, 0.6, 3.1, 10, P, { all: true }), { size: 0.34, tone: "mid" }) + L(G.circleOf(F, 0.6, 1.3, P, 18), { tone: "faint" }), [record(A.disc(F, -0.6, 0.6, 3.8, { name: "column.manway-cover" }))]);
}

// Platforms: annular sectors on the visible side with grating, posts and a handrail. One item: the
// whole platform stands in front of the shell; the rails are drawn as lines ending on the posts.
function platform(name, z, a0, a1) {
  const RO = CR + 8.5;
  const T = 1.3;
  const arc = (r, from, to, n) => Array.from({ length: n + 1 }, (_, i) => { const a = (from + ((to - from) * i) / n) * DEG; return [r * Math.cos(a), r * Math.sin(a)]; });
  const ring = [...arc(RO, a0, a1, 40), ...arc(CR, a1, a0, 32)];
  const grate = [];
  for (let a = a0 + 8; a < a1 - 3; a += 8) grate.push(k.lineOnTop([CR * Math.cos(a * DEG), CR * Math.sin(a * DEG)], [RO * Math.cos(a * DEG), RO * Math.sin(a * DEG)], z + T, P));
  const id = R.nameFor(`${name}.floor`);
  const postR = 0.45;
  const rr = RO - 0.9;
  const top = z + T + 7.5;
  const count = Math.round((a1 - a0) / 22);
  const posts = Array.from({ length: count + 1 }, (_, i) => a0 + 2.5 + ((a1 - a0 - 5) * i) / count).map((a) => [rr * Math.cos(a * DEG), rr * Math.sin(a * DEG), a]);
  const shapes = [record(A.extruded(ring, z, T, { name: id }))];
  const postSvg = [...posts].sort((p, q) => k.depthOf([p[0], p[1], 0], P) - k.depthOf([q[0], q[1], 0], P)).map(([x, y]) => S(k.cylinder(x, y, postR, z + T, top - z - T, P, 10), { tone: "mid", crease: "none" })).join("");
  posts.forEach(([x, y]) => shapes.push(record(A.cylinder(x, y, postR, z + T, top - z - T, { name: R.nameFor(`${name}.post`), owner: id }))));
  const railAt = (zz, from, to) => k.pathOf(arc(rr, from, to, Math.max(4, Math.round((to - from) / 3))).map(([x, y]) => at([x, y, zz])));
  const trim = (postR * 0.6) / rr / DEG;
  const knee = posts.slice(0, -1).map((p, i) => railAt(z + T + 3.8, p[2] + trim, posts[i + 1][2] - trim)).join("");
  const svg = S(k.extrude(ring, z, T, P, { convex: false }), { tone: "mid", inner: L(grate.join(""), { tone: "faint" }) }) + L(knee, { tone: "mid" }) + postSvg + `<path class="iso-line cf-rail" data-tone="mid" d="${railAt(top, posts[0][2], posts[posts.length - 1][2])}"/>`;
  const mid = ((a0 + a1) / 2) * DEG;
  item(id, [((CR + RO) / 2) * Math.cos(mid), ((CR + RO) / 2) * Math.sin(mid), z], svg, shapes);
  return z + T;
}
const P1 = platform("p1", 80, -44, 124);
platform("p2", 143, -20, 124);

// Ladders: two rails standing off the shell on clips, rungs between them.
function ladder(name, angle, z0, z1) {
  const a = angle * DEG;
  const radial = [Math.cos(a), Math.sin(a)];
  const side = [-Math.sin(a), Math.cos(a)];
  const rr = CR + 3.6;
  const rails = [-1.9, 1.9].map((t) => [rr * radial[0] + t * side[0], rr * radial[1] + t * side[1]]);
  const rungs = [];
  for (let z = z0 + 2.5; z < z1 - 1; z += 3) rungs.push(k.pathOf([at([...rails[0], z]), at([...rails[1], z])]));
  const plans = rails.map(([x, y]) => ({ x: x - 0.4, y: y - 0.4, w: 0.8, d: 0.8, r: 0.2 }));
  const id = R.nameFor(name);
  const svg = L(rungs.join(""), { tone: "lo" }) + plans.map((plan) => S(k.slabOf(plan, z0, z1 - z0, P, 1), { tone: "mid", crease: "none" })).join("");
  item(id, [rr * radial[0], rr * radial[1], (z0 + z1) / 2], svg, plans.map((plan, i) => record(A.slab(plan, z0, z1 - z0, { name: `${id}.rail${i}`, owner: id }, 1))), { bias: 0.2 });
  const poly = [[-2.3, -0.35], [2.3, -0.35], [2.3, 0.35], [-2.3, 0.35]];
  for (let z = z0 + 10; z < z1 - 4; z += 24) {
    const F = G.frameOf([0, 0, z], [radial[0], radial[1], 0], [side[0], side[1], 0], [0, 0, 1]);
    const cid = R.nameFor(`${name}.clip`);
    item(cid, [(CR + 2) * radial[0], (CR + 2) * radial[1], z], S(G.prismOf(F, poly, CR - 0.3, rr - 0.4, P), { tone: "mid", crease: "none" }), [record(A.prism(F, poly, CR - 0.3, rr - 0.4, { name: cid, seated: true, cut: [COLUMN] }))], { bias: 0.1 });
  }
}
ladder("ladder1", 44, 3, 80);
ladder("ladder2", 110, P1 + 0.1, 143);

// Side nozzles on the shell (pads seated on the round shell) and the vapour nozzle on the top head.
const nozzle = (name, z, angle) => padOn(`column.${name}`, [0, 0, z], [Math.cos(angle * DEG), Math.sin(angle * DEG), 0], [0, 0, 1], CR, name === "flash" ? 3.4 : 3, NOZZLE_OUT, { host: COLUMN });
const N = { flash: nozzle("flash", DRAWS.flash, 90), residuo: nozzle("residuo", DRAWS.residuo, 0), diesel: nozzle("diesel", DRAWS.diesel, 0), turbosina: nozzle("turbosina", DRAWS.turbosina, 0) };
const TOPN = boss("column.vapour", [0, 0, SHELL_TOP + HEAD - 0.15], [0, 0, 1], 3.3, 3.4);

// ---------- furnace ----------
function furnace() {
  const f = FURN;
  for (const [x, y] of k.corners(f, 2.2)) boxAt("furnace.leg", { x: x - 1.2, y: y - 1.2, w: 2.4, d: 2.4, r: 0.3 }, 2, FURN_Z[0] - 2, {}, { bevel: 0.2, steps: 1 });
  // Floor burners: an air register with ribs and a throat into the floor; the throat glows.
  const burner = [[0, 3.2], [2.2, 3.2], [2.2, 2.2], [FURN_Z[0] - 4.2, 2.2]];
  for (const t of [0.25, 0.5, 0.75]) {
    const F = vertical([f.x + f.w / 2, f.y + f.d * t, 4.2]);
    const id = R.nameFor("furnace.burner");
    item(id, [F.o[0], F.o[1], 7.5], S(G.solidOf(burner, F, P), { tone: "mid" }) + L(G.ribsOf(F, 0.2, 2.0, 3.2, 18, P, { seams: true }), { tone: "lo" }) + `<path class="cf-glow" data-part="burner" opacity=".3" d="${G.disc(2.4, FURN_Z[0] - 4.2, 2.2, F, P).fill}"/>`, [record(A.solid(F, burner, { name: id }))]);
  }
  // Radiant box with a seam, stiffeners edge to edge and peep doors that glow.
  const stiff = [];
  for (const x of [f.x + 9, f.x + 18, f.x + 27]) stiff.push(k.segment([x, f.y + f.d, FURN_Z[0]], [x, f.y + f.d, FURN_Z[1]], P));
  for (const y of [f.y + 10, f.y + 20, f.y + 30]) stiff.push(k.segment([f.x + f.w, y, FURN_Z[0]], [f.x + f.w, y, FURN_Z[1]], P));
  const peeps = [];
  for (const x of [f.x + 4.5, f.x + 13.5, f.x + 22.5, f.x + 31.5]) peeps.push(k.pathOf([[x - 1.6, 16], [x + 1.6, 16], [x + 1.6, 20], [x - 1.6, 20]].map(([px, z]) => at([px, f.y + f.d, z])), true));
  for (const y of [f.y + 5, f.y + 15, f.y + 25]) peeps.push(k.pathOf([[y - 1.6, 16], [y + 1.6, 16], [y + 1.6, 20], [y - 1.6, 20]].map(([py, z]) => at([f.x + f.w, py, z])), true));
  boxAt("furnace.radiant", f, FURN_Z[0], FURN_Z[1] - FURN_Z[0], {}, {
    bevel: 0.6,
    inner: L(stiff.join("") + k.sideSeam(f, FURN_Z[0] + 26, P, 3), { tone: "faint" }),
    extra: peeps.map((d) => `<path class="cf-glow" data-part="peep" opacity=".3" d="${d}"/>`).join("") + L(peeps.join(""), { tone: "lo" }),
  });
  boxAt("furnace.roof", k.insetPlan(f, -0.6), FURN_Z[1], 1.4, {}, { bevel: 0.3 });
  const conv = { x: f.x + 7, y: f.y + 9, w: f.w - 14, d: f.d - 18, r: 1 };
  const cz = FURN_Z[1] + 1.4;
  boxAt("furnace.convection", conv, cz, 14, {}, { bevel: 0.5, inner: L(k.sideSeam(conv, cz + 8, P, 3), { tone: "faint" }), extra: D([...[0.2, 0.5, 0.8].map((t) => at([conv.x + conv.w * t, conv.y + conv.d, cz + 11])), ...[0.25, 0.75].map((t) => at([conv.x + conv.w, conv.y + conv.d * t, cz + 11]))], { size: 0.4, tone: "lo" }) });
  // Stack: a gently tapered turned body with a base flange, bands and a lip.
  const z0 = cz + 14;
  const F = vertical([conv.x + conv.w / 2, conv.y + conv.d / 2, z0]);
  const [r0, r1, len] = [4.6, 3.6, 38];
  const radius = (s) => r0 + (r1 - r0) * (s / len);
  item("furnace.stack-flange", G.pointOf(F, 0.7, 0, 0), S(G.disc(0, 1.4, 6, F, P, { bevel: 0.3 }), { tone: "mid" }) + D(G.dotsOf(F, 1.4, 5.3, 12, P, { fade: [0.04, 0.42] }), { size: 0.34, tone: "mid" }), [record(A.disc(F, 0, 1.4, 6, { name: "furnace.stack-flange" }))]);
  item("furnace.stack-lip", G.pointOf(F, len + 0.6, 0, 0), S(G.disc(len, len + 1.2, r1 + 0.7, F, P), { tone: "mid" }), [record(A.disc(F, len, len + 1.2, r1 + 0.7, { name: "furnace.stack-lip" }))]);
  turned("furnace.stack", F, [[1.4, 0], [1.4, r0], [len, r1], [len, 0]], { tone: "hi" }, { inner: L([13, 26].map((s) => G.arcOf(F, s, radius(s), P, { slope: (r1 - r0) / len })).join(""), { tone: "faint" }) });
  CRUDE_IN = boss("furnace.inlet", [conv.x + conv.w, 26, cz + 8], [1, 0, 0], 2.6, 2);
  return boss("furnace.outlet", [f.x + f.w, 36, DRAWS.flash], [1, 0, 0], 3.4, 3);
}
let CRUDE_IN;
const FURN_OUT = furnace();
// Crude feed arrives at a battery-limit block and climbs to the convection section.
boxAt("feed.block", FEED, 0, 12, {}, { bevel: 0.4, inner: L(k.sideSeam(FEED, 8, P, 3), { tone: "faint" }) });
const FEED_TOP = boss("feed.nozzle", [FEED.x + FEED.w / 2, FEED.y + FEED.d / 2, 12], [0, 0, 1], 2.6, 1.6);

// ---------- tanks, pump, overhead system ----------
const LEVELS = {};
function tank(name, t) {
  const F = vertical([t.x, t.y, 0]);
  const roof = 3;
  const prof = [[1.2, 0], [1.2, t.r], [t.h, t.r], [t.h + roof, 3.2], [t.h + roof, 0]];
  const ringId = R.nameFor(`${name}.base`);
  item(ringId, [t.x, t.y, 0.6], S(G.disc(0, 1.2, t.r + 1.2, F, P, { bevel: 0.3 }), { tone: "mid" }) + D(G.dotsOf(F, 1.2, t.r + 0.6, 12, P, { fade: [0.04, 0.42] }), { size: 0.34, tone: "mid" }), [record(A.disc(F, 0, 1.2, t.r + 1.2, { name: ringId }))]);
  // Level gauge: a closed window on the side facing the viewer; the level is set live.
  const aV = 40 * DEG;
  const half = 7 * DEG;
  const edge = (z) => [at(G.pointOf(F, z, t.r, aV - half)), at(G.pointOf(F, z, t.r, aV + half))];
  const [lb, rb] = edge(4);
  const [lt, rt] = edge(t.h - 3);
  LEVELS[name] = { lb, rb, lt, rt };
  const window = `<path class="cf-window" d="${k.pathOf([lb, rb, rt, lt], true)}"/><path class="cf-level" data-level="${name}" data-c="${t.colour}" d=""/>${L(k.pathOf([lb, rb, rt, lt], true), { tone: "lo" })}`;
  const shape = turned(`${name}.tank`, F, prof, { tone: "hi", crease: "lo" }, { inner: L([t.h * 0.36, t.h * 0.68].map((s) => G.arcOf(F, s, t.r, P)).join(""), { tone: "faint" }), extra: window });
  return { shape, top: boss(`${name}.roof-nozzle`, [t.x, t.y, t.h + roof], [0, 0, 1], 2.6, 2.2) };
}
const TK = Object.fromEntries(Object.entries(TANKS).map(([name, t]) => [name, tank(name, t)]));
const NAFTA_Z = 4.2;
const NAFTA_IN = padOn("nafta.inlet", [TANKS.nafta.x, TANKS.nafta.y, NAFTA_Z], [1, 0, 0], [0, 0, 1], TANKS.nafta.r, 2.6, TANKS.nafta.r + 3, { host: TK.nafta.shape });

// Residue pump: volute casing on a pedestal, bearing frame and ribbed motor behind, all on a baseplate.
function pump() {
  const { x, y, z } = PUMP;
  boxAt("pump.base", { x: x - 7, y: y - 22, w: 14, d: 28, r: 1 }, 0, 2.2, {}, { bevel: 0.4, extra: D([[x - 5.5, y - 20.5], [x + 5.5, y - 20.5], [x - 5.5, y + 4.5], [x + 5.5, y + 4.5]].map(([px, py]) => at([px, py, 2.2])), { size: 0.4 }) });
  boxAt("pump.pedestal", { x: x - 3, y: y - 2.5, w: 6, d: 5, r: 0.6 }, 2.2, z - 6 - 2.2, {}, { bevel: 0.3 });
  const C = G.frameOf([x, y - 2.6, z], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const casing = turned("pump.casing", C, [[0, 0], [0, 6], [5.2, 6], [5.2, 0]], { tone: "hi" }, { inner: L(G.arcOf(C, 2.6, 6, P), { tone: "faint" }) });
  const M = G.frameOf([x, y - 2.6, z], [0, -1, 0], [1, 0, 0], [0, 0, 1]);
  turned("pump.bearing", M, [[0, 0], [0, 2.4], [4, 2.4], [4, 3.2], [6, 3.2], [6, 0]], { tone: "mid" });
  boxAt("pump.motor-feet", { x: x - 4.5, y: y - 21, w: 9, d: 12, r: 0.6 }, 2.2, z - 4.6 - 2.2, {}, { bevel: 0.3 });
  turned("pump.motor", M, [[6, 0], [6, 4.6], [18, 4.6], [18, 3.2], [19.2, 3.2], [19.2, 0]], { tone: "mid" }, { extra: k.fadedSvg(G.ribsOf(M, 6, 18, 4.6, 26, P, { fade: [0.1, 0.55] }), { tone: "lo" }) });
  const suction = padOn("pump.suction", [x, y, z], [0, 0, 1], [0, 1, 0], 6, 2.4, 8.4, { host: casing });
  const discharge = boss("pump.discharge", [x, y + 2.6, z], [0, 1, 0], 2.4, 2.4);
  return { suction, discharge };
}
const PU = pump();
// Battery-limit block at the front edge: the residue leaves for the vacuum unit.
boxAt("bl.block", BL, 0, 16, {}, { bevel: 0.4, inner: L(k.sideSeam(BL, 12, P, 3), { tone: "faint" }), extra: D([at([BL.x + 2, BL.y + BL.d, 14]), at([BL.x + BL.w - 2, BL.y + BL.d, 14])], { size: 0.4, tone: "lo" }) });

// Overhead: condenser on a steel stand, reflux drum on saddles, LPG sphere on legs.
const OUT_Y = -7;
const CY = (COND.y0 + COND.y1) / 2;
function overhead() {
  const c = COND;
  const under = c.z - c.r;
  for (const x of [c.x - 6.5, c.x + 6.5]) for (const y of [c.y0 + 2, c.y1 - 2]) boxAt("cond.leg", { x: x - 0.9, y: y - 0.9, w: 1.8, d: 1.8, r: 0.3 }, 1.2, under - 3.4 - 1.2, {}, { steps: 1, bevel: 0.2 });
  for (const x of [c.x - 6.5, c.x + 6.5]) boxAt("cond.beam", { x: x - 1, y: c.y0 + 0.6, w: 2, d: c.y1 - c.y0 - 1.2, r: 0.3 }, under - 3.4, 1.8, {}, { steps: 1, bevel: 0.2 });
  for (const y of [c.y0 + 3, c.y1 - 3]) boxAt("cond.saddle", { x: c.x - 8, y: y - 1.2, w: 16, d: 2.4, r: 0.3 }, under - 1.6, 1.6, {}, { steps: 1, bevel: 0.2 });
  // Shell between two girth flanges, a channel with an elliptical head beyond each: coaxial pieces
  // that meet face to face, so nothing wraps anything.
  const F = G.frameOf([c.x, 0, c.z], [0, 1, 0], [0, 0, 1], [1, 0, 0]);
  const g = 1.6;
  const shell = turned("cond.shell", F, [[c.y0 + g, 0], [c.y0 + g, c.r], [c.y1 - g, c.r], [c.y1 - g, 0]], { tone: "hi", crease: "lo" }, { inner: L(G.arcOf(F, (c.y0 + c.y1) / 2 - 7, c.r, P) + G.arcOf(F, (c.y0 + c.y1) / 2 + 7, c.r, P), { tone: "faint" }) });
  const left = vessel(c.y0 - 2.4 - c.r / 2, c.y0, c.r, { top: false });
  turned("cond.channel", F, left.profile, { tone: "hi", crease: "lo" }, { smooth: { slope: left.slope, radius: left.radius, rows: 5 } });
  const right = vessel(c.y1, c.y1 + 2.4 + c.r / 2, c.r, { bottom: false });
  turned("cond.channel", F, right.profile, { tone: "hi", crease: "lo" }, { smooth: { slope: right.slope, radius: right.radius, rows: 5 } });
  for (const [s0, s1] of [[c.y0, c.y0 + g], [c.y1 - g, c.y1]]) {
    const id = R.nameFor("cond.girth");
    const face = G.dot3(F.a, V) > 0 ? s1 : s0;
    item(id, G.pointOf(F, (s0 + s1) / 2, 0, 0), S(G.disc(s0, s1, c.r + 1, F, P), { tone: "hi" }) + D(G.dotsOf(F, face, c.r + 0.5, 20, P, { fade: [0.04, 0.42] }), { size: 0.32, tone: "mid" }), [record(A.disc(F, s0, s1, c.r + 1, { name: id }))]);
  }
  const inlet = padOn("cond.inlet", [c.x, 0, c.z], [0, 0, 1], [0, 1, 0], c.r, 3.3, c.r + 3, { host: shell });
  const outlet = padOn("cond.outlet", [c.x, OUT_Y, c.z], [0, 0, -1], [0, 1, 0], c.r, 2.3, c.r + 7, { host: shell });
  const d = DRUM;
  for (const y of [d.y0 + 6, d.y1 - 6]) boxAt("drum.saddle", { x: d.x - 5, y: y - 1.3, w: 10, d: 2.6, r: 0.3 }, 0, d.z - d.r, {}, { steps: 1, bevel: 0.2 });
  const DF = G.frameOf([d.x, 0, d.z], [0, 1, 0], [0, 0, 1], [1, 0, 0]);
  const dv = vessel(d.y0 - d.r / 2, d.y1 + d.r / 2, d.r);
  const drum = turned("drum.shell", DF, dv.profile, { tone: "hi", crease: "lo" }, { smooth: { slope: dv.slope, radius: dv.radius, rows: 5 }, inner: L([d.y0, 0, d.y1].map((s) => G.arcOf(DF, s, d.r, P)).join(""), { tone: "faint" }) });
  const drumIn = padOn("drum.inlet", [d.x, OUT_Y, d.z], [0, 0, 1], [0, 1, 0], d.r, 2.2, d.r + 1.6, { host: drum });
  const drumGas = padOn("drum.gas", [d.x, SPHERE.y, d.z], [0, 0, 1], [0, 1, 0], d.r, 2.2, d.r + 1.6, { host: drum });
  const drumLiq = padOn("drum.liquid", [d.x, d.y1 - 2, d.z], [0, 0, -1], [0, 1, 0], d.r, 1.8, d.r + 1.5, { host: drum });
  const s = SPHERE;
  for (const a of [45, 135, 225, 315]) {
    const [x, y] = [s.x + (s.r + 0.9) * Math.cos(a * DEG), s.y + (s.r + 0.9) * Math.sin(a * DEG)];
    const id = R.nameFor("sphere.leg");
    item(id, [x, y, s.z / 2], S(k.cylinder(x, y, 1.6, 0, 1, P, 16), { tone: "lo" }) + S(k.cylinder(x, y, 0.9, 1, s.z - 1, P, 14), { tone: "mid", crease: "none" }), [record(A.cylinder(x, y, 0.9, 1, s.z - 1, { name: id })), record(A.cylinder(x, y, 1.6, 0, 1, { name: `${id}.foot` }))]);
  }
  const SF = vertical([s.x, s.y, s.z]);
  const band = Math.sqrt(s.r ** 2 - 4.4 ** 2);
  item("sphere.shell", [s.x, s.y, s.z], S(G.sphereOf([s.x, s.y, s.z], s.r, P, { steps: 64 }), { tone: "hi", crease: "lo", inner: L(G.arcOf(SF, 0, s.r, P) + G.arcOf(SF, 4.4, band, P, { slope: -4.4 / band }), { tone: "faint" }) }), [record(A.ball([s.x, s.y, s.z], s.r, { name: "sphere.shell" }))]);
  const sphereTop = boss("sphere.nozzle", [s.x, s.y, s.z + s.r - 0.12], [0, 0, 1], 2, 2.2);
  return { inlet, outlet, drumIn, drumGas, drumLiq, sphereTop };
}
const OV = overhead();

// ---------- lines ----------
// Transfer line: furnace outlet → flash zone (hot crude, partly vapour), with a dial on it.
pipe("line.crudo", [CRUDE_IN, [FEED_TOP[0], CRUDE_IN[1], CRUDE_IN[2]], FEED_TOP].reverse(), 1.5, { flow: ["crudo", "red"] });
pipe("line.transfer", [FURN_OUT, [0, 36, DRAWS.flash], N.flash], 2.2, { flow: ["crudo", "red"], flangeR: 1.45 });
{
  const F = vertical([DIAL.x, DIAL.y, 0]);
  item("dial.post", [DIAL.x, DIAL.y, DIAL.z / 2], S(G.disc(0, 1, 2.4, F, P), { tone: "lo" }) + S(G.disc(1, DIAL.z, 0.8, F, P), { tone: "mid", crease: "none" }), [record(A.disc(F, 0, 1, 2.4, { name: "dial.foot" })), record(A.disc(F, 1, DIAL.z, 0.8, { name: "dial.post" }))]);
  const ticks = k.radialTicks(DIAL.x, DIAL.y, DIAL.r - 0.9, 20, 5, DIAL.z + 2.4, [0.8, 1.6], P, 135 * DEG, 270 * DEG);
  item("dial.face", [DIAL.x, DIAL.y, DIAL.z + 1.2], S(k.cylinder(DIAL.x, DIAL.y, DIAL.r, DIAL.z, 2.4, P, 48, 0.4), { tone: "hi", crease: "lo" }) + L(ticks.minor, { tone: "lo" }) + L(ticks.major, { tone: "mid" }) + `<path class="iso-line" data-tone="lit" data-part="needle" d=""/>` + D([at([DIAL.x, DIAL.y, DIAL.z + 2.4])], { size: 0.7, tone: "hi" }), [record(A.cylinder(DIAL.x, DIAL.y, DIAL.r, DIAL.z, 2.4, { name: "dial.face" }))], { bias: 0.3 });
}
// Side draws: nested routes in the plane y = 0 (the higher draw goes farther), so none crosses another.
pipe("line.turbosina", [N.turbosina, [TANKS.turbosina.x, 0, DRAWS.turbosina], TK.turbosina.top], PIPE_R, { flow: ["turbosina", "green"] });
pipe("line.diesel", [N.diesel, [TANKS.diesel.x, 0, DRAWS.diesel], TK.diesel.top], PIPE_R, { flow: ["diesel", "green"] });
pipe("line.residuo", [N.residuo, [PUMP.x, 0, DRAWS.residuo], [PUMP.x, PUMP.y, DRAWS.residuo], PU.suction], 1.5, { flow: ["residuo", "red"], bend: 5.2 });
pipe("line.vacio", [PU.discharge, [PUMP.x, BL.y, PUMP.z]], 1.5, { flow: ["residuo", "red"] });
// Overhead vapour: up from the top head, over to the condenser, down into it.
pipe("line.vapor", [TOPN, [0, 0, 178], [COND.x, 0, 178], OV.inlet], 2.2, { flow: ["vapor", "gold"], flangeR: 1.45 });
pipe("line.condensado", [OV.outlet, [COND.x, OUT_Y, 36], [DRUM.x, OUT_Y, 36], OV.drumIn], 1.4, { flow: ["nafta", "gold"] });
pipe("line.gas", [OV.drumGas, [DRUM.x, SPHERE.y, 46], [SPHERE.x, SPHERE.y, 46], OV.sphereTop], 1.2, { flow: ["gas", "gold"] });
pipe("line.nafta", [OV.drumLiq, [DRUM.x, OV.drumLiq[1], NAFTA_Z], [DRUM.x, TANKS.nafta.y, NAFTA_Z], NAFTA_IN], 1.1, { flow: ["nafta", "gold"] });

// ---------- settle, labels, page ----------
A.settle(R, P);
R.items.sort((a, b) => a.key - b.key);

const LABELS = [
  { n: 1, name: "Horno 350–370 °C", anchor: [FURN.x + 4, FURN.y + FURN.d, 30], dx: -30, dy: 40 },
  { n: 2, name: "Zona flash", anchor: [0, NOZZLE_OUT, DRAWS.flash + 3], dx: -150, dy: 58 },
  { n: 3, name: "Gas y GLP <40 °C", anchor: [SPHERE.x - 4, SPHERE.y + 4, SPHERE.z + 7], dx: 57, dy: -36 },
  { n: 4, name: "Nafta 40–200 °C", anchor: [TANKS.nafta.x + 2, TANKS.nafta.y + 6, 18], dx: 54, dy: 40 },
  { n: 5, name: "Turbosina 150–270 °C", anchor: [60, 0, DRAWS.turbosina + PIPE_R], dx: 140, dy: -40 },
  { n: 6, name: "Diésel 200–350 °C", anchor: [TANKS.diesel.x + 2, TANKS.diesel.y + 7, 14], dx: -40, dy: 82 },
  { n: 7, name: "Residuo >350 °C", anchor: [PUMP.x, BL.y + BL.d, 14], dx: -82, dy: 42 },
  { n: 8, name: "Condensador", anchor: [COND.x, COND.y1, COND.z + 3], dx: 112, dy: -49 },
];

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Maqueta de una unidad de destilación atmosférica: un horno de caja con quemadores en el piso calienta el crudo, que entra por la línea de transferencia a la zona flash de una torre alta con plataformas y escaleras. Los vapores suben y se condensan a distintas alturas: la turbosina y el diésel salen por un costado hacia sus tanques, el residuo sale por el fondo con una bomba hacia la planta de vacío y los vapores del domo pasan por un condensador a un acumulador que separa el gas y GLP (a una esfera) de la nafta (a un tanque).",
  body: [BASE, ...R.items.map((it) => it.svg), `<g data-part="labels">${labelsSvg(LABELS, at)}</g>`],
});

const live = `
${MODEL}
const P = ${JSON.stringify(P)};
const DIAL = ${JSON.stringify(DIAL)};
const LEVELS = ${JSON.stringify(LEVELS)};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const needle = svg.querySelector('[data-part="needle"]');
const glows = [...svg.querySelectorAll('[data-part="peep"],[data-part="burner"]')];
const flows = [...svg.querySelectorAll(".cf-flow")].map((el) => ({ el, key: el.dataset.flow, o: Number(el.dataset.o) }));
const levels = [...svg.querySelectorAll("[data-level]")];
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const pct = (v) => Math.round(v).toLocaleString("es-MX") + " %";
const bpd = (v) => (Math.round(BPD * v / 100 / 100) * 100).toLocaleString("es-MX");
// Readout length follows the card width (the shared compact flag covers phones).
let roomy = false, narrow = false;
new ResizeObserver(() => { const w = stage.getBoundingClientRect().width; roomy = w >= 860; narrow = w < 600; draw(); }).observe(stage);
let temp = 362, target = 362, dash = 0, last = 0, clock = 0, frame = 0, touring = true, visible = false, idle = 0;
const MID = (T_MIN + T_MAX) / 2, SWING = (T_MAX - T_MIN) * 0.46;
const tourAt = (t) => MID + SWING * Math.sin(t * 0.35);
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const f1 = (p) => p[0].toFixed(1) + " " + p[1].toFixed(1);
function draw() {
  const y = yields(temp);
  const heat = (temp - T_MIN) / (T_MAX - T_MIN);
  // Dial: 300–400 °C over 270°.
  const a = (135 + (clamp(temp, 300, 400) - 300) / 100 * 270) * Math.PI / 180;
  needle.setAttribute("d", "M" + f1(iso([DIAL.x, DIAL.y, DIAL.z + 2.5], P)) + "L" + f1(iso([DIAL.x + Math.cos(a) * (DIAL.r - 1.2), DIAL.y + Math.sin(a) * (DIAL.r - 1.2), DIAL.z + 2.5], P)));
  for (const el of glows) el.setAttribute("opacity", String(0.3 + 0.65 * heat));
  const share = { crudo: 1, residuo: y.residuo / 55, diesel: y.diesel / 22, turbosina: y.turbosina / 22, nafta: y.nafta / 22, gas: 0.6, vapor: 0.9 };
  for (const f of flows) { f.el.style.strokeDashoffset = String(f.o - dash); f.el.style.opacity = String(0.25 + 0.75 * Math.min(1, share[f.key])); }
  const fill = { diesel: y.diesel / 24, turbosina: y.turbosina / 24, nafta: y.nafta / 24 };
  for (const el of levels) {
    const L = LEVELS[el.dataset.level], t = clamp(fill[el.dataset.level], 0, 1);
    el.setAttribute("d", "M" + f1(L.lb) + "L" + f1(L.rb) + "L" + f1(lerp(L.rb, L.rt, t)) + "L" + f1(lerp(L.lb, L.lt, t)) + "Z");
  }
  const t = Math.round(temp);
  const text = compact
    ? t + " °C · diésel " + pct(y.diesel) + " · residuo " + pct(y.residuo)
    : roomy
      ? "Horno a " + t + " °C · nafta " + pct(y.nafta) + " · turbosina " + pct(y.turbosina) + " · diésel " + pct(y.diesel) + " (" + bpd(y.diesel) + " b/d) · residuo " + pct(y.residuo)
      : narrow
        ? "Horno a " + t + " °C · diésel " + pct(y.diesel) + " · residuo " + pct(y.residuo)
        : "Horno a " + t + " °C · nafta " + pct(y.nafta) + " · turbosina " + pct(y.turbosina) + " · diésel " + pct(y.diesel) + " · residuo " + pct(y.residuo);
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(t));
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) { clock += dt; target = tourAt(clock); }
  temp = temp + (target - temp) * (1 - Math.exp(-dt / 0.45));
  dash = (dash + dt * 26) % 12;
  draw();
  frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => { touring = false; target = clamp(next, T_MIN, T_MAX); clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; clock = Math.asin(clamp((target - MID) / SWING, -1, 1)) / 0.35; run(); }, 4000); if (still.matches) { temp = target; draw(); } run(); };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (event) => { const box = svg.getBoundingClientRect(); steer(T_MIN + clamp((event.clientX - box.left) / box.width, 0, 1) * (T_MAX - T_MIN)); });
stage.addEventListener("keydown", (event) => {
  const step = event.key === "ArrowRight" || event.key === "ArrowUp" ? 5 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -5 : 0;
  if (event.key === "Home") { event.preventDefault(); steer(T_MIN); return; }
  if (event.key === "End") { event.preventDefault(); steer(T_MAX); return; }
  if (!step) return;
  event.preventDefault();
  steer(Math.round((target + step) / 5) * 5);
});
draw();
`;

const I = theme === "light"
  ? { void: "#d9d2c8", window: "#f3efe9", gold: "#A57F2C", red: "#9B2247", green: "#1E5B4F", flame: "#e07a2e" }
  : { void: "#0e0b0c", window: "#1a1516", gold: "#e2b85a", red: "#ea8aa8", green: "#6fc2ae", flame: "#f2a65a" };
const CSS = `<style>
.cf-void{fill:${I.void};stroke:var(--anatomy-lo);stroke-width:.6}
.cf-window{fill:${I.window}}
[data-c="gold"]{--c:${I.gold}}[data-c="red"]{--c:${I.red}}[data-c="green"]{--c:${I.green}}
.cf-zone{fill:var(--c)}
.cf-level{fill:var(--c);opacity:.8}
.cf-rail{stroke-width:1.1}
.cf-flow{fill:none;stroke:var(--c);stroke-width:1.3;stroke-dasharray:2.2 9.8;stroke-linecap:round}
.cf-glow[data-part]{fill:${I.flame}}
@media (prefers-reduced-motion:reduce){.cf-flow{stroke-dasharray:none;opacity:.5}}
</style>`;

const y0 = model.yields(365);
writeFigure({
  id: "refinacion",
  title: "Torre de destilación atmosférica",
  theme,
  svg: svg.replace("</svg>", `${CSS}</svg>`),
  live,
  plate: {
    fig: "Fig 10",
    title: "Torre de destilación atmosférica",
    hint: "Desliza para cambiar la temperatura del horno",
    ariaLabel: "Torre de destilación: las flechas cambian la temperatura de salida del horno",
    keys: [
      { mark: "red", label: "Crudo caliente y residuo (fondo, más de 350 °C)" },
      { mark: "green", label: "Destilados medios: turbosina y diésel" },
      { mark: "gold", label: "Ligeros: gas, GLP y nafta (domo)" },
    ],
    caption: `El horno calienta el crudo a unos 350–370 °C; en la zona flash de la torre gran parte se vaporiza. Los vapores suben por los platos y se enfrían: cada fracción se condensa a la altura donde la temperatura baja de su punto de ebullición y se extrae por un costado. Arriba salen gas, GLP y nafta, que se condensan fuera de la torre; abajo queda el residuo, que va a la torre de vacío o a coquización. Modelo simplificado con una mezcla típica de crudo mexicano y 100,000 barriles diarios: a 365 °C salen cerca de ${Math.round(y0.nafta)} % de nafta, ${Math.round(y0.turbosina)} % de turbosina, ${Math.round(y0.diesel)} % de diésel y ${Math.round(y0.residuo)} % de residuo. Calentar más vaporiza más diésel, pero arriba de unos 370–380 °C el crudo se empieza a descomponer.`,
  },
});

// The vapour line lands on its own nozzle on the top head; seen at 8×, its flange sits on the head
// outline as a real flanged joint, not a line threaded through the shell.
A.auditOrExit(R, P, { crowd: [["line.vapor", "column.shell"]] });
