/**
 * "¿Cómo funciona?" · Central fotovoltaica (anatomy kit, vendor/anatomy, MIT).
 *
 * A model on a base: one row of eight 550 W modules on a single-axis tracker, its combiner box,
 * the DC cable to a central inverter, the inverter's AC to a medium-voltage transformer, and the
 * line to the grid on two poles. A pyranometer measures the sunlight. Hovering (or the arrow keys)
 * sets the hour; the tracker follows the sun and every number comes from one small model:
 *   - sun hour angle 15° per hour from solar noon; the tracker turns with it up to ±60°;
 *   - clear-sky irradiance on the modules, peak 1000 W/m² at noon (the STC rating level);
 *   - DC power = modules × 550 W × irradiance / 1000; the inverter delivers 98 % of it as AC.
 * It is a simplified clear day, not a forecast: the caption says so.
 *
 * node scripts/conceptos/fotovoltaica.mjs [--light]  →  public/conceptos/fotovoltaica(-light).html
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../vendor/anatomy/kit/iso-kit.mjs";
import * as G from "../../vendor/anatomy/kit/lathe.mjs";
import { kitScript } from "../../vendor/anatomy/scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "..", "public", "conceptos");
const theme = process.argv.includes("--light") ? "light" : "dark";

const WIDTH = 640;
const HEIGHT = 400;

// ---------- the model (shared with the page) ----------
const PER_ROW = 8;
const ROWS_Y = [-34, 26];
const MODULES = PER_ROW * ROWS_Y.length;
const MODULE_W = 550;
const INVERTER_EFF = 0.98;
const TRACK_LIMIT = 60;
const MODEL = `
const MODULES = ${MODULES}, MODULE_W = ${MODULE_W}, INVERTER_EFF = ${INVERTER_EFF}, TRACK_LIMIT = ${TRACK_LIMIT};
const sunAngle = (hour) => (hour - 12) * 15;
const trackerAngle = (hour) => Math.max(-TRACK_LIMIT, Math.min(TRACK_LIMIT, sunAngle(hour)));
function irradiance(hour) {
  const elevation = 90 - Math.abs(sunAngle(hour));
  if (elevation <= 0) return 0;
  const clear = Math.pow(Math.sin(elevation * Math.PI / 180), 0.35);
  const miss = Math.abs(sunAngle(hour) - trackerAngle(hour)) * Math.PI / 180;
  return Math.round(1000 * clear * Math.cos(miss));
}
const dcPower = (hour) => MODULES * MODULE_W * irradiance(hour) / 1000;
const acPower = (hour) => dcPower(hour) * INVERTER_EFF;
`;
const model = new Function(`${MODEL}; return { sunAngle, trackerAngle, irradiance, dcPower, acPower };`)();

// ---------- world ----------
const PLATE = { x: -176, y: -74, w: 364, d: 150, r: 9 };
const PLATE_H = 9;
const FOOT_H = 5;
let ROW_Y = ROWS_Y[0]; // the row being drawn (posts, tube and drive read it)
const TUBE_Z = 40;
const TUBE_R = 2.6;
const ROW_X0 = -158;
const MOD_W = 23;
const MOD_GAP = 1.2;
const MOD_D = 50;
const MOD_T = 1.6;
const ROW_X1 = ROW_X0 + PER_ROW * MOD_W + (PER_ROW - 1) * MOD_GAP;
const POSTS = [ROW_X0 + 10, ROW_X0 + 58, ROW_X0 + 106, ROW_X0 + 154, ROW_X1 - 10];
const DRIVE_X = POSTS[2];
const COMBINERS = [{ x: ROW_X1 + 10, y: ROWS_Y[0] - 6, w: 12, d: 9, r: 1 }, { x: ROW_X1 + 8, y: ROWS_Y[1] + 30, w: 12, d: 9, r: 1 }];
const COMBINER = COMBINERS[0];
const INV = { x: 58, y: 12, w: 52, d: 30, r: 2 };
const INV_H = 28;
const SKID = { x: 52, y: 4, w: 112, d: 46, r: 2 };
const TX = { x: 126, y: 16, w: 30, d: 24, r: 1.5 };
const TX_H = 26;
const POLE_A = [150, -44];
const POLE_B = [172, 52];
const POLE_H = 78;
const PYRANO = [-170, 62];

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [POLE_A[0], POLE_A[1], POLE_H + 6], [POLE_B[0], POLE_B[1], POLE_H + 6], [ROW_X0, ROWS_Y[0] - 26, TUBE_Z + 28], [ROW_X1, ROWS_Y[1] + 26, TUBE_Z + 28]],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: 38, elevation: 40 },
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
  // Gravel pad under the row and the concrete pad of the power station.
  for (const y of ROWS_Y) {
    out.push(S(k.slabOf({ x: ROW_X0 - 8, y: y - 26, w: ROW_X1 - ROW_X0 + 16, d: 52, r: 3 }, 0, 0.6, P, 4), { tone: "lo", crease: "none" }));
    out.push(D(k.dotGrid(ROW_X0 - 4, y - 22, 46, 11, 4.4, 0.6, P), { size: 0.28, tone: "faint" }));
  }
  out.push(S(k.slabOf(SKID, 0, 3, P, 4, 0.5), { tone: "mid" }));
  out.push(D(k.corners(SKID, 3).map(([x, y]) => at([x, y, 3])), { size: 0.45 }));
  // Cable trench lid from the row to the station, with its seams.
  const trench = { x: COMBINER.x + 2, y: ROW_Y + 10, w: 8, d: 48, r: 1 };
  out.push(S(k.slabOf(trench, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  out.push(L([0.3, 0.55, 0.8].map((f) => k.lineOnTop([trench.x, trench.y + trench.d * f], [trench.x + trench.w, trench.y + trench.d * f], 0.8, P)).join(""), { tone: "faint" }));
  // Ruler strip along the front edge, every 5 units, like a scale model.
  const strip = { x: PLATE.x + 16, y: PLATE.y + PLATE.d - 15, w: PLATE.w - 32, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 5, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
  return out.join("");
}

// ---------- grid line: two poles with three conductors ----------
function pole([x, y]) {
  const out = [];
  out.push(S(k.cylinder(x, y, 4.2, 0, 3, P, 24), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, 2.4, 3, POLE_H - 3, P, 20, 0), { tone: "mid", crease: "none" }));
  out.push(L([18, 36, 54].map((z) => k.sideArc(x, y, 2.4, z, P, 12)).join(""), { tone: "faint" }));
  const arm = { x: x - 1.6, y: y - 14, w: 3.2, d: 28, r: 0.6 };
  out.push(S(k.slabOf(arm, POLE_H - 6, 2.6, P, 2, 0.3), { tone: "mid" }));
  for (const dy of [-11, 0, 11]) {
    out.push(S(k.cylinder(x, y + dy, 1.1, POLE_H - 3.4, 3.4, P, 14), { tone: "hi", crease: "none" }));
    out.push(L(k.knurl(x, y + dy, 1.1, POLE_H - 3.2, POLE_H - 0.2, 6, P, 0.2), { tone: "lo" }));
  }
  out.push(S(k.cylinder(x, y, 3, POLE_H, 1.2, P, 18), { tone: "mid" }));
  return out.join("");
}
const phase = (index) => [-11, 0, 11][index];
const conductor = (index, sag = 7) => {
  const a = [POLE_A[0], POLE_A[1] + phase(index), POLE_H];
  const b = [POLE_B[0], POLE_B[1] + phase(index), POLE_H];
  const points = Array.from({ length: 17 }, (_, i) => {
    const t = i / 16;
    return at([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] - sag * 4 * t * (1 - t)]);
  });
  return k.pathOf(points);
};

// ---------- tracker row ----------
function posts() {
  const out = [];
  for (const x of POSTS) {
    out.push(S(k.cylinder(x, ROW_Y, 3.4, 0, 2.4, P, 20), { tone: "lo" }));
    out.push(S(k.slabOf({ x: x - 1.6, y: ROW_Y - 2.4, w: 3.2, d: 4.8, r: 0.4 }, 2.4, TUBE_Z - 2.4 - 3, P, 2, 0.3), { tone: "mid" }));
    out.push(S(k.slabOf({ x: x - 2.6, y: ROW_Y - 3.2, w: 5.2, d: 6.4, r: 0.8 }, TUBE_Z - 3.4, 2.2, P, 3), { tone: "mid" }));
    out.push(D([at([x, ROW_Y + 3.2, TUBE_Z - 2.3])], { size: 0.4, tone: "lo" }));
  }
  return out.join("");
}
function tube() {
  const F = G.frameAlong([ROW_X0 - 4, ROW_Y, TUBE_Z], [1, 0, 0]);
  const length = ROW_X1 - ROW_X0 + 8;
  const out = [S(G.disc(0, length, TUBE_R, F, P), { tone: "mid" })];
  out.push(S(G.disc(-1, 0.6, TUBE_R + 0.5, F, P), { tone: "mid" }), S(G.disc(length - 0.6, length + 1, TUBE_R + 0.5, F, P), { tone: "mid" }));
  return out.join("");
}
function drive() {
  const out = [];
  const F = G.frameAlong([DRIVE_X - 4, ROW_Y, TUBE_Z], [1, 0, 0]);
  out.push(S(G.disc(0, 8, 5.6, F, P), { tone: "mid" }));
  out.push(L(G.ribsOf(F, 0.6, 7.4, 5.6, 28, P, { seams: true }), { tone: "lo" }));
  out.push(S(k.slabOf({ x: DRIVE_X - 3, y: ROW_Y + 5, w: 6, d: 7, r: 1 }, TUBE_Z - 8, 7, P, 3, 0.4), { tone: "mid" }));
  out.push(D([at([DRIVE_X, ROW_Y + 12, TUBE_Z - 4.5])], { size: 0.5, tone: "hi" }));
  return out.join("");
}

// One module: the frame turns about the torque tube by `angle` (degrees, + tilts toward +y).
function moduleAt(index, angle, rowY) {
  const t = (angle * Math.PI) / 180;
  const across = [0, Math.cos(t), Math.sin(t)];
  const normal = [0, -Math.sin(t), Math.cos(t)];
  const cx = ROW_X0 + MOD_W / 2 + index * (MOD_W + MOD_GAP);
  const lift = TUBE_R + 1.8;
  const o = [cx, rowY + normal[1] * lift, TUBE_Z + normal[2] * lift];
  return { F: G.frameOf(o, normal, [1, 0, 0], across), o, normal, across, cx };
}

// ---------- combiner box ----------
function combiner(c = COMBINER) {
  const out = [];
  out.push(S(k.slabOf({ x: c.x + 4.4, y: c.y + 3.6, w: 3.2, d: 2.4, r: 0.4 }, 0, 14, P, 2, 0.3), { tone: "mid" }));
  out.push(S(k.slabOf(c, 14, 15, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(c, 25, P, 3), { tone: "faint" }) }));
  out.push(S(k.slabOf(k.insetPlan(c, -0.6), 29, 1.6, P, 3, 0.4), { tone: "mid" }));
  out.push(D([at([c.x + 3, c.y + c.d, 18]), at([c.x + c.w - 3, c.y + c.d, 18])], { size: 0.45, tone: "lo" }));
  return out.join("");
}

// ---------- inverter and transformer ----------
function inverter() {
  const out = [];
  const plan = INV;
  out.push(S(k.slabOf(plan, 3, INV_H, P, 4, 0.8), { tone: "hi", crease: "lo", inner: L(k.sideSeam(plan, 3 + INV_H - 5, P, 4), { tone: "faint" }) }));
  // Vents on the front face (+y), closed slots.
  for (let i = 0; i < 7; i++) {
    const x = plan.x + 6 + i * 3;
    out.push(L(k.segment([x, plan.y + plan.d, 10], [x, plan.y + plan.d, 19], P), { tone: "lo" }));
  }
  // Two doors with handles on the side facing the viewer (+x end face).
  out.push(L(k.segment([plan.x + 28, plan.y + plan.d, 6], [plan.x + 28, plan.y + plan.d, 3 + INV_H - 6], P), { tone: "faint" }));
  out.push(S(k.slabOf({ x: plan.x + 31, y: plan.y + plan.d, w: 1.4, d: 1.2, r: 0.3 }, 12, 5, P, 2), { tone: "mid", crease: "none" }));
  // Label plate with rule lines.
  const plate = { x: plan.x + 34, y: plan.y + plan.d, w: 9, d: 0.5, r: 0.2 };
  out.push(S(k.slabOf(plate, 20, 5, P, 2), { tone: "lo", crease: "none" }));
  out.push(L([21.5, 23, 24.5].map((z) => k.segment([plate.x + 1.2, plate.y + 0.5, z], [plate.x + plate.w - 1.2, plate.y + 0.5, z], P)).join(""), { tone: "faint", free: true }));
  // Roof fans.
  for (const x of [plan.x + 12, plan.x + 34]) {
    out.push(S(k.cylinder(x, plan.y + plan.d / 2, 5, 3 + INV_H, 1.4, P, 32), { tone: "mid" }));
    out.push(L(k.ring(x, plan.y + plan.d / 2, 3.4, 3 + INV_H + 1.4, P, 32), { tone: "lo" }));
    out.push(D([at([x, plan.y + plan.d / 2, 3 + INV_H + 1.4])], { size: 0.6, tone: "lo" }));
  }
  out.push(D(k.corners(plan, 2.4).map(([x, y]) => at([x, y, 3 + INV_H])), { size: 0.45, tone: "lo" }));
  return out.join("");
}
function transformer() {
  const out = [];
  const plan = TX;
  // Radiator fins on the far side (−y), behind the tank.
  for (let i = 0; i < 6; i++) {
    out.push(S(k.slabOf({ x: plan.x + 3 + i * 3.6, y: plan.y - 5, w: 1.2, d: 5.4, r: 0.2 }, 6, TX_H - 6, P, 2), { tone: "mid", crease: "none" }));
  }
  out.push(S(k.slabOf({ x: plan.x - 1, y: plan.y - 1, w: plan.w + 2, d: plan.d + 2, r: 1 }, 3, 2, P, 3), { tone: "lo" }));
  out.push(S(k.slabOf(plan, 5, TX_H - 5, P, 3, 0.6), { tone: "mid", inner: L(k.sideSeam(plan, TX_H - 3, P, 3), { tone: "faint" }) }));
  out.push(S(k.slabOf(k.insetPlan(plan, -0.8), TX_H, 1.6, P, 3, 0.4), { tone: "mid" }));
  // Three medium-voltage bushings on the lid, sheds as rings.
  for (const dx of [6, 13, 20]) {
    const x = plan.x + dx;
    const y = plan.y + plan.d / 2 - 3;
    out.push(S(k.cylinder(x, y, 1.6, TX_H + 1.6, 8, P, 16), { tone: "hi", crease: "none" }));
    out.push(L([TX_H + 4, TX_H + 6.4, TX_H + 8.6].map((z) => k.sideArc(x, y, 2.2, z, P, 10)).join(""), { tone: "lo" }));
    out.push(D([at([x, y, TX_H + 9.6])], { size: 0.6, tone: "hi" }));
  }
  // Label plate.
  const plate = { x: plan.x + 6, y: plan.y + plan.d, w: 12, d: 0.5, r: 0.2 };
  out.push(S(k.slabOf(plate, 9, 6, P, 2), { tone: "lo", crease: "none" }));
  out.push(L([11, 12.8].map((z) => k.segment([plate.x + 1.4, plate.y + 0.5, z], [plate.x + plate.w - 1.4, plate.y + 0.5, z], P)).join(""), { tone: "faint", free: true }));
  return out.join("");
}

// ---------- pyranometer on a mast ----------
function pyranometer() {
  const [x, y] = PYRANO;
  const out = [];
  out.push(S(k.slabOf({ x: x - 5, y: y - 5, w: 10, d: 10, r: 1 }, 0, 2, P, 3, 0.4), { tone: "lo" }));
  out.push(D(k.corners({ x: x - 5, y: y - 5, w: 10, d: 10 }, 1.6).map(([px, py]) => at([px, py, 2])), { size: 0.4 }));
  out.push(S(k.cylinder(x, y, 1.3, 2, 40, P, 14), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf({ x: x - 1, y: y - 1, w: 9, d: 2, r: 0.4 }, 38, 1.6, P, 2), { tone: "mid" }));
  const head = [x + 7, y];
  out.push(S(k.cylinder(head[0], head[1], 4.4, 39.6, 2.4, P, 28), { tone: "mid" }));
  out.push(L(k.ring(head[0], head[1], 3.4, 42, P, 28), { tone: "lo" }));
  out.push(S(G.sphereOf([head[0], head[1], 42.6], 2.2, P), { tone: "hi", lit: true }));
  return out.join("");
}

// ---------- assemble ----------
const row0 = model.trackerAngle(10);
const cableDC = () => {
  const c = COMBINER;
  return [at([c.x + 6, c.y + c.d, 16]), [at([c.x + 6, ROW_Y + 12, 0.8]), at([c.x + 6, INV.y + INV.d / 2, 0.8])], at([INV.x, INV.y + INV.d / 2, 8])];
};
const cableDC2 = () => {
  const c = COMBINERS[1];
  return [at([c.x + 6, c.y, 16]), [at([c.x + 6, c.y - 2, 0.8]), at([INV.x + 12, c.y - 2, 0.8])], at([INV.x + 12, INV.y + INV.d, 8])];
};
const cableAC = [at([INV.x + INV.w, INV.y + 10, 14]), [], at([TX.x, TX.y + 8, 12])];
const cableMV = () => {
  const top = [TX.x + 20, TX.y + TX.d / 2 - 3, TX_H + 9.6];
  return [at(top), [at([TX.x + 20, TX.y - 8, TX_H + 9.6]), at([POLE_A[0] + 2.4, TX.y - 8, 30]), at([POLE_A[0] + 2.4, POLE_A[1], 30])], at([POLE_A[0] + 2.4, POLE_A[1], POLE_H - 8])];
};

const stringCable = (row) => {
  const y = ROWS_Y[row] + 3.4;
  const c = COMBINERS[row];
  const post = ROW_X1 - 10;
  const end = row === 0 ? [c.x, c.y + c.d / 2, 22] : [c.x + 6, c.y, 22];
  const via = row === 0 ? [[post, y, TUBE_Z - 4], [post, y, 22], [c.x - 3, y, 22]] : [[post, y, TUBE_Z - 4], [post, y, 22], [c.x + 6, y, 22]];
  return [at([post, y, TUBE_Z - 4]), via.slice(1).map(at), at(end)];
};
const cableSvg = ([from, via, to], tone) => k.wireSvg(from, to, { via, tone: "mid" }) + k.lineSvg(k.pathOf([from, ...via, to]), { tone, className: "pv-flow" });

// Numbered names: a dot on the part, a short leader and a tag. Narrow cards show the number only.
const LABELS = [
  { n: 1, name: "Módulos solares", anchor: [ROW_X0 + 34, ROWS_Y[0], TUBE_Z + 3], dx: -26, dy: -78 },
  { n: 2, name: "Seguidor solar", anchor: [ROW_X1 - 10, ROWS_Y[1] + 2.4, 14], dx: -120, dy: 14 },
  { n: 3, name: "Caja de conexiones", anchor: [COMBINERS[1].x + 6, COMBINERS[1].y + 4.5, 30.6], dx: -60, dy: 54 },
  { n: 4, name: "Inversor", anchor: [INV.x + 26, INV.y + 6, 3 + INV_H], dx: 4, dy: -62 },
  { n: 5, name: "Transformador", anchor: [TX.x + 8, TX.y + TX.d, 14], dx: -8, dy: 62 },
  { n: 6, name: "Línea a la red", anchor: [POLE_A[0], POLE_A[1], POLE_H + 1.2], dx: 18, dy: -26 },
  { n: 7, name: "Piranómetro", anchor: [PYRANO[0] + 7, PYRANO[1], 44.8], dx: -30, dy: -34 },
];
function labelsSvg() {
  return LABELS.map(({ n, name, anchor, dx, dy }) => {
    const [ax, ay] = at(anchor);
    const tx = ax + dx;
    const ty = ay + dy;
    const width = 26 + name.length * 5.3;
    const left = dx < 0 ? tx - width + 10 : tx - 10;
    return `<g class="pv-label" data-n="${n}" role="button" tabindex="0" aria-label="Parte ${n}: ${name}">
      <path class="pv-leader" d="M${ax.toFixed(1)} ${ay.toFixed(1)}L${tx.toFixed(1)} ${ty.toFixed(1)}"/>
      <circle class="pv-anchor" cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="1.9"/>
      <rect class="pv-tag pv-full" x="${left.toFixed(1)}" y="${(ty - 9).toFixed(1)}" width="${width.toFixed(1)}" height="18" rx="9"/>
      <circle class="pv-badge" cx="${(dx < 0 ? left + width - 10 : left + 10).toFixed(1)}" cy="${ty.toFixed(1)}" r="7"/>
      <text class="pv-num" x="${(dx < 0 ? left + width - 10 : left + 10).toFixed(1)}" y="${(ty + 3.2).toFixed(1)}" text-anchor="middle">${n}</text>
      <text class="pv-name pv-full" x="${(dx < 0 ? left + 8 : left + 21).toFixed(1)}" y="${(ty + 3.4).toFixed(1)}">${name}</text>
    </g>`;
  }).join("");
}

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Maqueta de una central fotovoltaica: dos filas de ocho módulos solares sobre seguidores de un eje que gira con el sol, una caja de conexiones, el cable de corriente directa hasta el inversor, el transformador que eleva la tensión y la línea hacia la red en dos postes. Un piranómetro mide la radiación del sol.",
  body: [
    base(),
    `<g data-part="grid">${[pole(POLE_A), [0, 1, 2].map((i) => L(conductor(i), { tone: "mid" })).join(""), pole(POLE_B)].join("")}</g>`,
    `<g data-part="flow-mv">${L(conductor(0), { tone: "green", className: "pv-flow" })}${L(conductor(1), { tone: "green", className: "pv-flow" })}${L(conductor(2), { tone: "green", className: "pv-flow" })}</g>`,
    ...ROWS_Y.flatMap((y, row) => { ROW_Y = y; return [posts(), tube(), drive(), `<g data-part="modules" data-row="${row}"></g>`]; }),
    combiner(COMBINERS[0]),
    combiner(COMBINERS[1]),
    `<g data-part="strings">${cableSvg(stringCable(0), "red")}${cableSvg(stringCable(1), "red")}</g>`,
    `<g data-part="cable-dc2">${k.wireSvg(cableDC2()[0], cableDC2()[2], { via: cableDC2()[1], tone: "mid" })}${k.lineSvg(k.pathOf([cableDC2()[0], ...cableDC2()[1], cableDC2()[2]]), { tone: "red", className: "pv-flow" })}</g>`,
    `<g data-part="cable-dc">${k.wireSvg(cableDC()[0], cableDC()[2], { via: cableDC()[1], tone: "mid" })}${k.lineSvg(k.pathOf([cableDC()[0], ...cableDC()[1], cableDC()[2]]), { tone: "red", className: "pv-flow" })}</g>`,
    inverter(),
    transformer(),
    `<g data-part="cable-ac">${k.wireSvg(cableAC[0], cableAC[2], { tone: "mid" })}${k.lineSvg(k.pathOf([cableAC[0], cableAC[2]]), { tone: "green", className: "pv-flow" })}</g>`,
    `<g data-part="sun" aria-hidden="true"></g>`,
    `<g data-part="sky" aria-hidden="true"></g>`,
    `<g data-part="cable-mv">${k.wireSvg(cableMV()[0], cableMV()[2], { via: cableMV()[1], tone: "mid" })}${k.lineSvg(k.pathOf([cableMV()[0], ...cableMV()[1], cableMV()[2]]), { tone: "green", className: "pv-flow" })}</g>`,
    pyranometer(),
    `<g data-part="labels">${labelsSvg()}</g>`,
  ],
});

// Live code: rebuild the eight modules for the tracker angle; the cables' dashes run with power.
const LATHE = readFileSync(join(HERE, "..", "..", "vendor", "anatomy", "kit", "lathe.mjs"), "utf8").replace(/^import .*$/gm, "").replace(/^export /gm, "");
const live = `
${MODEL}
const P = ${JSON.stringify(P)};
const ROW_X0 = ${ROW_X0}, ROWS_Y = ${JSON.stringify(ROWS_Y)}, PER_ROW = ${PER_ROW}, TUBE_Z = ${TUBE_Z}, TUBE_R = ${TUBE_R}, MOD_W = ${MOD_W}, MOD_GAP = ${MOD_GAP}, MOD_D = ${MOD_D}, MOD_T = ${MOD_T};
${moduleAt.toString().replace(/G\./g, "")}
function modulesSvg(angle, rowY) {
  const list = Array.from({ length: PER_ROW }, (_, index) => moduleAt(index, angle, rowY));
  list.sort((a, b) => depthOf(a.o, P) - depthOf(b.o, P));
  const view = viewOf(P);
  return list.map(({ F, o, normal, across }) => {
    const half = [MOD_W / 2, MOD_D / 2];
    const poly = [[-half[0], -half[1]], [half[0], -half[1]], [half[0], half[1]], [-half[0], half[1]]];
    const paths = prismOf(F, poly, 0, MOD_T, P);
    const facing = dot3(normal, view) > 0;
    let inner = "";
    if (facing) {
      const on = (x, y) => iso([o[0] + normal[0] * MOD_T + x, o[1] + normal[1] * MOD_T + across[1] * y, o[2] + normal[2] * MOD_T + across[2] * y], P);
      const rows = [];
      for (let i = 1; i < 6; i++) { const y = -half[1] + 1 + (i * (MOD_D - 2)) / 6; rows.push(pathOf([on(-half[0] + 1, y), on(half[0] - 1, y)])); }
      const cols = [];
      for (let i = 1; i < 3; i++) { const x = -half[0] + 1 + (i * (MOD_W - 2)) / 3; cols.push(pathOf([on(x, -half[1] + 1), on(x, half[1] - 1)])); }
      inner = '<path class="iso-line" data-tone="faint" d="' + rows.join("") + cols.join("") + '"/>' + '<path class="iso-line" data-tone="lo" d="' + pathOf([on(-half[0] + 1, -half[1] + 1), on(half[0] - 1, -half[1] + 1), on(half[0] - 1, half[1] - 1), on(-half[0] + 1, half[1] - 1)], true) + '"/>';
    } else {
      // The back: two mounting rails across the module and the junction box with its cable.
      const under = (x, y) => iso([o[0] + x, o[1] + across[1] * y, o[2] + across[2] * y], P);
      const rails = [-half[1] * 0.55, half[1] * 0.55].map((y) => pathOf([under(-half[0] + 0.6, y), under(half[0] - 0.6, y)])).join("");
      const box = pathOf([under(-2.6, half[1] * 0.78), under(2.6, half[1] * 0.78), under(2.6, half[1] * 0.92), under(-2.6, half[1] * 0.92)], true);
      inner = '<path class="iso-line" data-tone="mid" d="' + rails + '"/>' + '<path class="iso-line" data-tone="lo" d="' + box + '"/>';
    }
    return solidSvg(paths, { tone: "hi", crease: "lo", lit: facing && sunLit, inner });
  }).join("");
}
let sunLit = true;
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const modulesEls = [...svg.querySelectorAll('[data-part="modules"]')];
const flows = [...svg.querySelectorAll(".pv-flow")];
const sunEl = svg.querySelector('[data-part="sun"]');
const VIEW = svg.viewBox.baseVal;
const CENTRE = [-60, 0, 30];
function sunSvg(hour, angle) {
  const theta = sunAngle(hour);
  if (Math.abs(theta) >= 88) return "";
  const t = theta * Math.PI / 180;
  const dir = [0, -Math.sin(t), Math.cos(t)];
  const rays = [];
  ROWS_Y.forEach((rowY) => {
    [1, 3, 5, 7].forEach((index) => {
      const { o, normal } = moduleAt(index, angle, rowY);
      const hit = [o[0] + normal[0] * MOD_T, o[1] + normal[1] * MOD_T, o[2] + normal[2] * MOD_T];
      const from = iso([hit[0] + dir[0] * 74, hit[1] + dir[1] * 74, hit[2] + dir[2] * 74], P);
      const to = iso(hit, P);
      rays.push('<path class="pv-ray" d="' + pathOf([from, to]) + '"/><circle class="pv-hit" cx="' + to[0].toFixed(1) + '" cy="' + to[1].toFixed(1) + '" r="1.3"/>');
    });
  });
  let reach = 170, at2 = null;
  for (; reach > 40; reach -= 6) {
    at2 = iso([CENTRE[0] + dir[0] * reach, CENTRE[1] + dir[1] * reach, CENTRE[2] + dir[2] * reach], P);
    if (at2[0] > VIEW.x + 22 && at2[0] < VIEW.x + VIEW.width - 22 && at2[1] > VIEW.y + 22) break;
  }
  const spokes = Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return pathOf([[at2[0] + Math.cos(a) * 12, at2[1] + Math.sin(a) * 12], [at2[0] + Math.cos(a) * 16.5, at2[1] + Math.sin(a) * 16.5]]); }).join("");
  return rays.join("") + '<path class="pv-spokes" d="' + spokes + '"/><circle class="pv-sun" cx="' + at2[0].toFixed(1) + '" cy="' + at2[1].toFixed(1) + '" r="8.5"/>';
}
let shownSun = null, litShown = -1, compact = false;
// Weather: share of the clear-sky light that reaches the modules (approximate, for teaching).
//   despejado 100 %; nubes: a passing cloud cuts it to about a quarter while it covers the plant;
//   lluvia: thick clouds, about 15 %.
const skyEl = svg.querySelector('[data-part="sky"]');
let weather = "despejado", cloudClock = 0;
const CLOUDS = [{ x0: -330, y: -10, size: 1 }, { x0: -60, y: 40, size: 0.8 }];
const cloudX = (cloud) => ((cloud.x0 + cloudClock * 22 + 330) % 660) - 330;
function cover() {
  if (weather === "lluvia") return 1;
  if (weather !== "nubes") return 0;
  return Math.min(1, CLOUDS.reduce((sum, c) => sum + Math.exp(-(((cloudX(c) + 40) / 62) ** 2)) * c.size, 0));
}
const skyFactor = () => (weather === "lluvia" ? 0.15 : 1 - 0.75 * cover());
function puff(cx, cy, r, dark) {
  const parts = [[0, 0, 1], [-0.95, 0.25, 0.7], [0.95, 0.22, 0.75], [-0.45, -0.45, 0.72], [0.45, -0.4, 0.8]];
  // Outline pass (wider circles) under a fill pass: one clean silhouette, no inner seams.
  const circles = (grow, cls) => parts.map(([dx, dy, k]) => '<circle class="' + cls + (dark ? ' is-dark' : '') + '" cx="' + (cx + dx * r).toFixed(1) + '" cy="' + (cy + dy * r).toFixed(1) + '" r="' + (r * k + grow).toFixed(1) + '"/>').join("");
  return circles(0.9, 'pv-cloud-edge') + circles(0, 'pv-cloud');
}
function skySvg() {
  if (weather === "despejado") return "";
  const list = weather === "lluvia" ? [{ x: -150, y: -20 }, { x: -30, y: 30 }, { x: 70, y: -10 }] : CLOUDS.map((c) => ({ x: cloudX(c), y: c.y, size: c.size }));
  let out = "";
  for (const c of list) {
    const size = c.size || 1.15;
    const shadow = iso([c.x, c.y, 0], P);
    out += '<ellipse class="pv-shadow" cx="' + shadow[0].toFixed(1) + '" cy="' + shadow[1].toFixed(1) + '" rx="' + (62 * size).toFixed(1) + '" ry="' + (26 * size).toFixed(1) + '"/>';
  }
  for (const c of list) {
    const size = c.size || 1.15;
    const top = iso([c.x, c.y, 118], P);
    out += puff(top[0], top[1], 22 * size, weather === "lluvia");
    if (weather === "lluvia") {
      const drops = [];
      for (let i = 0; i < 9; i++) {
        const x = top[0] - 34 + i * 8.5;
        const y0 = top[1] + 18 + ((i * 37 + rain) % 70);
        drops.push(pathOf([[x, y0], [x - 2.2, y0 + 9]]));
      }
      out += '<path class="pv-rain" d="' + drops.join("") + '"/>';
    }
  }
  return out;
}
let rain = 0;
const weatherButtons = [...document.querySelectorAll("[data-weather]")];
weatherButtons.forEach((button) => button.addEventListener("click", (event) => {
  event.stopPropagation();
  weather = button.dataset.weather;
  weatherButtons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
  shownSun = null;
  run();
  draw();
}));
const toggle = document.querySelector("[data-names]");
const setNames = (on) => { svg.classList.toggle("pv-no-names", !on); toggle.setAttribute("aria-pressed", String(on)); toggle.textContent = on ? "Ocultar nombres" : "Mostrar nombres"; };
toggle.addEventListener("click", (event) => { event.stopPropagation(); setNames(svg.classList.contains("pv-no-names")); });
new ResizeObserver(() => { compact = stage.getBoundingClientRect().width < 520; svg.classList.toggle("pv-compact", compact); stage.classList.toggle("pv-compact", compact); draw(); }).observe(stage);
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const fmtHour = (h) => { const hh = Math.floor(h), mm = Math.round((h - hh) * 60 / 15) * 15; return String(mm === 60 ? hh + 1 : hh).padStart(2, "0") + ":" + String(mm === 60 ? 0 : mm).padStart(2, "0"); };
const kw = (w) => (w / 1000).toLocaleString("es-MX", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
let hour = 10, target = 10, angle = trackerAngle(10), dash = 0, ray = 0, last = 0, clock = 0, frame = 0, touring = true, visible = false, idle = 0, shownAngle = null;
const tourAt = (t) => 6 + ((t / 14) % 1) * 13;
function draw() {
  const rounded = Math.round(angle * 4) / 4;
  sunLit = irradiance(hour) > 0 && skyFactor() > 0.5;
  if ((sunLit ? 1 : 0) !== litShown) { litShown = sunLit ? 1 : 0; shownAngle = null; }
  if (rounded !== shownAngle) { shownAngle = rounded; modulesEls.forEach((el, row) => { el.innerHTML = modulesSvg(rounded, ROWS_Y[row]); }); }
  const g = Math.round(irradiance(hour) * skyFactor());
  const dc = MODULES * MODULE_W * g / 1000, ac = dc * INVERTER_EFF;
  const share = ac / (MODULES * MODULE_W);
  for (const line of flows) { line.style.strokeDashoffset = String(-dash); line.style.opacity = String(0.35 + 0.65 * Math.min(1, share * 1.4)); line.style.visibility = g > 0 ? "visible" : "hidden"; }
  const sunKey = Math.round(hour * 20) + ":" + rounded + ":" + weather + ":" + (cover() > 0.5);
  if (sunKey !== shownSun) { shownSun = sunKey; sunEl.innerHTML = sunSvg(hour, rounded); }
  sunEl.style.opacity = String(1 - 0.85 * cover());
  skyEl.innerHTML = skySvg();
  sunEl.style.setProperty("--ray", String(-ray));
  const sky = weather === "lluvia" ? " · lluvia" : cover() > 0.4 ? " · nube" : "";
  const text = compact ? fmtHour(hour) + sky + " · " + g + " W/m² · " + kw(ac) + " kW" : fmtHour(hour) + " h" + sky + " · " + g + " W/m² · módulos " + kw(dc) + " kW · red " + kw(ac) + " kW";
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(Math.round(hour * 10) / 10));
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) { clock += dt; target = tourAt(clock); }
  hour = calm ? target : hour + (target - hour) * (1 - Math.exp(-dt / 0.35));
  const want = trackerAngle(hour);
  angle = calm ? want : angle + (want - angle) * (1 - Math.exp(-dt / 0.6));
  dash = (dash + dt * 46 * Math.min(1, acPower(hour) * skyFactor() / (MODULES * MODULE_W) * 1.3)) % 20;
  cloudClock += dt;
  rain = (rain + dt * 90) % 70;
  ray = (ray + dt * 30) % 18;
  draw();
  frame = visible && !calm ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => { touring = false; target = clamp(next, 5.5, 18.5); clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; clock = ((target - 6) / 13) * 14; run(); }, 4000); if (still.matches) { hour = target; angle = trackerAngle(hour); draw(); } run(); };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (event) => { const box = svg.getBoundingClientRect(); steer(5.5 + clamp((event.clientX - box.left) / box.width, 0, 1) * 13); });
stage.addEventListener("keydown", (event) => {
  const step = event.key === "ArrowRight" || event.key === "ArrowUp" ? 0.5 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -0.5 : 0;
  if (event.key === "Home") { event.preventDefault(); steer(6); return; }
  if (event.key === "End") { event.preventDefault(); steer(18); return; }
  if (!step) return;
  event.preventDefault();
  steer(Math.round((target + step) * 2) / 2);
});
draw();
// Embedded in the site: tell the page how tall the card is, so the frame fits it.
const pvLabels = [...svg.querySelectorAll(".pv-label[data-n]")];
function selectPvPart(n, notify = true) {
  pvLabels.forEach((el) => el.classList.toggle("is-selected", Number(el.dataset.n) === n));
  if (notify && parent !== window) {
    parent.postMessage({ type: "concepto-part", figura: "fotovoltaica", n }, location.origin);
  }
}
pvLabels.forEach((el) => {
  el.addEventListener("click", (event) => {
    event.stopPropagation();
    const n = Number(el.dataset.n);
    selectPvPart(el.classList.contains("is-selected") ? 0 : n, true);
  });
  el.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      const n = Number(el.dataset.n);
      selectPvPart(el.classList.contains("is-selected") ? 0 : n, true);
    }
  });
});
window.addEventListener("message", (event) => {
  if (event.origin !== location.origin || event.data?.type !== "concepto-select-part") return;
  selectPvPart(Number(event.data.n) || 0, false);
});
const postHeight = () => { if (parent !== window) parent.postMessage({ type: "concepto-height", id: "fotovoltaica", h: document.documentElement.scrollHeight }, location.origin); };
new ResizeObserver(postHeight).observe(document.body);
postHeight();
`;

const peak = model.dcPower(12) / 1000;
const body = k.plateHtml({
  fig: "Fig 1",
  title: "Central fotovoltaica",
  hint: "Desliza para mover la hora · toca un número para ver la pieza",
  readout: "",
  keys: [
    { mark: "red", label: "Corriente directa: de los módulos al inversor" },
    { mark: "green", label: "Corriente alterna: del inversor a la red" },
    { mark: "lit", label: "Rayos de sol sobre los módulos" },
  ],
  caption: `Dos filas de ${PER_ROW} módulos de ${MODULE_W} W en seguidores que giran con el sol hasta ±${TRACK_LIMIT}°. La luz se vuelve corriente directa; el inversor la convierte en alterna (${Math.round(INVERTER_EFF * 100)} %) y el transformador eleva la tensión para la red. Modelo simplificado: con cielo despejado las dos filas dan hasta ${peak.toLocaleString("es-MX", { maximumFractionDigits: 1 })} kW al mediodía; una nube que pasa baja la producción a cerca de una cuarta parte y la lluvia a cerca del 15 % (valores aproximados). Una central real tiene miles de filas.`,
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Central fotovoltaica: las flechas cambian la hora del día" aria-valuemin="6" aria-valuemax="18" aria-valuenow="10"><div class="pv-weather" role="group" aria-label="Clima"><button type="button" data-weather="despejado" aria-pressed="true">☀ Despejado</button><button type="button" data-weather="nubes" aria-pressed="false">⛅ Nubes</button><button type="button" data-weather="lluvia" aria-pressed="false">🌧 Lluvia</button></div><button type="button" class="pv-names-toggle" data-names aria-pressed="true">Ocultar nombres</button>${svg}</div>`,
});

// Embedded in the site through an iframe: no page margins, the card fills the frame.
const INK = theme === "light"
  ? { red: "#9B2247", green: "#1E5B4F", sun: "#A57F2C", sunGlow: "#e9c46a", page: "#f7f5f2", tagBg: "#ffffff", tagInk: "#2b2326" }
  : { red: "#ea8aa8", green: "#6fc2ae", sun: "#e2b85a", sunGlow: "#f2d27d", page: "#161213", tagBg: "#211b1d", tagInk: "#f3ece4" };
const FIG_CSS = `body.iso[data-theme="${theme}"]{--anatomy-red:${INK.red};--anatomy-green:${INK.green};--pv-sun:${INK.sun};--pv-glow:${INK.sunGlow}}
.iso-solid[data-lit]>.iso-edge{stroke:var(--pv-sun)}
.pv-flow{stroke-dasharray:2.6 17.4;stroke-width:2.1;stroke-linecap:round}
.pv-ray{fill:none;stroke:var(--pv-sun);stroke-width:1.1;stroke-dasharray:7 11;stroke-dashoffset:var(--ray,0);stroke-linecap:round;opacity:.9}
.pv-hit{fill:var(--pv-glow)}
.pv-sun{fill:var(--pv-glow);stroke:var(--pv-sun);stroke-width:1.4}
.pv-spokes{fill:none;stroke:var(--pv-sun);stroke-width:1.5;stroke-linecap:round}
.pv-leader{fill:none;stroke:var(--anatomy-mid);stroke-width:.8;transition:stroke .15s,stroke-width .15s}
.pv-anchor{fill:var(--anatomy-paper);stroke:var(--anatomy-hi);stroke-width:1;transition:fill .15s}
.pv-tag{fill:${INK.tagBg};stroke:var(--anatomy-mid);stroke-width:.7;transition:stroke .15s,stroke-width .15s}
.pv-badge{fill:${INK.red};transition:fill .15s}
.pv-num{fill:#fff;font:700 9px ui-sans-serif,system-ui,sans-serif;pointer-events:none}
.pv-name{fill:${INK.tagInk};font:600 9.5px ui-sans-serif,system-ui,sans-serif;pointer-events:none}
.pv-label{cursor:pointer;outline:none}
.pv-label:hover .pv-tag,.pv-label.is-selected .pv-tag{stroke:${INK.green};stroke-width:1.4}
.pv-label:hover .pv-badge,.pv-label.is-selected .pv-badge{fill:${INK.green}}
.pv-label.is-selected .pv-anchor{fill:${INK.green};stroke:${INK.green}}
.pv-label.is-selected .pv-leader{stroke:${INK.green};stroke-width:1.3}
.pv-label:focus-visible .pv-tag{stroke:${INK.green};stroke-width:2;stroke-dasharray:3 2}
.pv-label:focus-visible .pv-badge{stroke:${INK.green};stroke-width:2.5}
.pv-compact .pv-full{display:none}
.pv-compact .pv-badge{r:11}
.pv-compact .pv-num{font-size:13px;transform:translateY(1.4px)}
.pv-no-names [data-part="labels"]{display:none}
.iso-stage{position:relative}
.pv-names-toggle{position:absolute;right:12px;top:34px;z-index:2;padding:5px 11px;border:1px solid var(--anatomy-mid);border-radius:999px;background:${INK.tagBg};color:${INK.tagInk};font:600 11.5px ui-sans-serif,system-ui,sans-serif;cursor:pointer}
.pv-weather{position:absolute;left:12px;top:34px;z-index:2;display:flex;gap:4px}
.pv-weather button{padding:5px 10px;border:1px solid var(--anatomy-mid);border-radius:999px;background:${INK.tagBg};color:${INK.tagInk};font:600 11.5px ui-sans-serif,system-ui,sans-serif;cursor:pointer}
.pv-weather button[aria-pressed="true"]{background:${INK.red};border-color:${INK.red};color:#fff}
.pv-cloud{fill:${INK.tagBg}}
.pv-cloud-edge{fill:var(--anatomy-mid)}
.pv-cloud.is-dark{fill:var(--anatomy-lo)}
.pv-cloud-edge.is-dark{fill:var(--anatomy-mid)}
.pv-shadow{fill:#000;opacity:.12;filter:blur(6px)}
.pv-rain{fill:none;stroke:${INK.green};stroke-width:1.1;stroke-linecap:round;opacity:.8}
.pv-compact .pv-weather,.pv-compact .pv-names-toggle{top:28px}
.pv-compact .pv-weather button,.pv-compact .pv-names-toggle{padding:3px 7px;font-size:10px}
@media (prefers-reduced-motion:reduce){.pv-ray{stroke-dasharray:none}}`;
const EMBED_CSS = `<style>${FIG_CSS}</style><style>html{background:transparent!important;color-scheme:${theme}}.iso-page{width:100%!important;margin:0!important;padding:0 2px}body{background:transparent!important}.iso-stage{touch-action:pan-y}.iso-plate{padding-bottom:96px!important}.iso-plate-corner[data-corner=\"readout\"]{left:0;right:0;bottom:0;text-align:center;white-space:normal;font:700 17px/1.35 ui-sans-serif,system-ui,sans-serif;letter-spacing:0;color:var(--anatomy-text)}.iso-plate-corner[data-corner=\"hint\"]{bottom:44px!important}.cf-compact~.iso-plate-corners [data-corner=\"readout\"],.iso-page:has(.cf-compact) [data-corner=\"readout\"]{font-size:14.5px}</style>`;
const html = k.pageHtml({ title: "Central fotovoltaica · ¿Cómo funciona?", theme, body, script: `${kitScript()}\nconst { prismOf, frameOf, viewOf, dot3 } = (() => {\n${LATHE}\nreturn { prismOf, frameOf, viewOf, dot3 };\n})();\n${live}`, width: WIDTH })
  .replace('<html lang="en">', '<html lang="es-MX">')
  .replace("</head>", `${EMBED_CSS}</head>`);
mkdirSync(OUT, { recursive: true });
const file = join(OUT, theme === "light" ? "fotovoltaica-light.html" : "fotovoltaica.html");
writeFileSync(file, html);
console.log("wrote", file, Math.round(html.length / 1024), "KB");
