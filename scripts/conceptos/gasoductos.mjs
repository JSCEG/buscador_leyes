/**
 * "¿Cómo funciona?" · Gasoducto y estación de compresión (anatomy kit, vendor/anatomy, MIT).
 *
 * A bench model of one stretch of a trunk gas pipeline: the steel pipe comes out of the ground
 * (a cut earth berm) on concrete piers with strap clamps, passes an inlet pressure gauge and a
 * tee, a closed sectioning ball valve with its gear operator and handwheel, a second tee, an
 * ultrasonic meter and an outlet gauge, and goes back into the ground. Because the mainline valve
 * is closed, the gas has to go up the suction line into a centrifugal compressor on a skid, driven
 * through a coupling by a gas turbine (exhaust stack, air-filter house), and comes back down the
 * discharge line at full pressure.
 *
 * The pointer (or the arrows) sets the flow. One small model drives the needles, the dashes and
 * the readout (stated in the caption as simplified):
 *   - 36-inch line (inside diameter 0.87 m); the previous station, 120 km upstream, delivers 80 bar
 *     and this one restores 80 bar (its discharge set point);
 *   - friction on the way: p_in² = 80² − K·Q² (Weymouth-type square law), with K chosen so that at
 *     1,500 MMPCD the gas arrives at 50 bar; at 300 MMPCD it arrives at 79 bar;
 *   - gas speed = actual flow / pipe area, actual flow = Q (standard m³/s) × (1.013 / p_abs) ×
 *     (T / 288.7 K) × Z, with T = 288 K and Z = 0.88. The same mass flow moves slower after the
 *     compressor because it is denser, and the dashes show that.
 *
 * node scripts/conceptos/gasoductos.mjs [--light] [--audit]  →  public/conceptos/gasoductos(-light).html
 *
 * tube.mjs and audit.mjs come from the anatomy kit; the repo vendors iso-kit and lathe only, so
 * they are loaded from vendor/anatomy/kit when present and from the installed skill otherwise.
 */
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as k from "../../vendor/anatomy/kit/iso-kit.mjs";
import * as G from "../../vendor/anatomy/kit/lathe.mjs";
import { themeOf, labelsSvg, writeFigure } from "./_shared.mjs";

async function kitModule(name) {
  const bases = [new URL("../../vendor/anatomy/kit/", import.meta.url), pathToFileURL(join(homedir(), ".claude", "skills", "anatomy", "kit") + "/")];
  for (const base of bases) {
    const url = new URL(name, base);
    if (existsSync(fileURLToPath(url))) return import(url.href);
  }
  throw new Error(`anatomy kit module ${name} not found (vendor/anatomy/kit or ~/.claude/skills/anatomy/kit)`);
}
const { tubePieces, tubeSvg } = await kitModule("tube.mjs");
const A = await kitModule("audit.mjs");

const theme = themeOf();
const WIDTH = 640;
const HEIGHT = 400;

// ---------- the model (shared with the page) ----------
const MODEL = `
const Q_MIN = 300, Q_MAX = 1500, P_OUT = 80, P_LOW = 50, D_IN = 0.87, ZF = 0.88, T_GAS = 288, P_ATM = 1.013;
const K_SEG = (P_OUT * P_OUT - P_LOW * P_LOW) / (Q_MAX * Q_MAX);
const STD_M3S = 1e6 * 0.0283168 / 86400;
const inletBar = (q) => Math.sqrt(P_OUT * P_OUT - K_SEG * q * q);
const speedOf = (q, bar) => q * STD_M3S * (P_ATM / (bar + P_ATM)) * (T_GAS / 288.7) * ZF / (Math.PI * D_IN * D_IN / 4);
`;
const model = new Function(`${MODEL}; return { inletBar, speedOf, P_OUT, Q_MIN, Q_MAX };`)();

// ---------- world ----------
const PLATE = { x: -160, y: -70, w: 320, d: 132, r: 9 };
const PLATE_H = 9;
const FOOT_H = 5;
const LINE_Y = 28; // mainline
const LINE_Z = 18;
const LINE_R = 6;
const LAT_R = 4.5; // suction and discharge lines
const BERM_X = 126; // inner faces of the two earth berms
const SLEEVE = 1.4;
const TEE_A = -64;
const TEE_B = 9;
const TEE_R = 8;
const VALVE_X = -28;
const METER = [42, 68];
const GAUGES = [-102, 100];
const PIERS = [-114, -86, -50, -6, 30, 82, 114];
const ST_Y = -30; // station axis
const AXIS_Z = 18;
const CASE_R = 11;
const NOZZLE = [-9, 9];
const SUCTION_Z = 58;
const DISCHARGE_Z = 50;
const SKID = { x: -34, y: -50, w: 160, d: 40, r: 2 };
const COLLECTOR = { x: 34, y: -41, w: 14, d: 22, r: 1.2 };
const COLLECTOR_H = 30;
const STACK = [41, ST_Y];
const STACK_TOP = 72;
const FILTER = { x: 94, y: -48, w: 28, d: 36, r: 1.5 };
const FILTER_H = 36;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [STACK[0], STACK[1], STACK_TOP + 2], [TEE_A, ST_Y, SUCTION_Z + 6], [TEE_A, LINE_Y, SUCTION_Z + 6]],
  WIDTH,
  HEIGHT,
  { pad: 20, azimuth: 56, elevation: 32 },
);
const V = G.viewOf(P);
const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);

// ---------- recorder: every drawn item records its true shape ----------
const R = A.recorder(P);
const record = R.solid;
const STAND = { owner: "stand.base" };
function put(name, ref, svg, shapes, bias = 0) {
  const id = R.nameFor(name);
  R.put({ piece: "all", at: ref, bias, svg, shapes: shapes.map((shape) => record({ ...shape, name: shape.name ?? id })), name: id });
  return id;
}
function slab(name, plan, z, h, style = {}, { extra = "", steps = 3, bevel = 0.5, owner, bias = 0, ground = false } = {}) {
  const centre = [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2];
  return put(name, centre, S(k.slabOf(plan, z, h, P, steps, bevel), { tone: "mid", ...style }) + extra, [A.slab(plan, z, h, { owner, ground }, steps)], bias);
}
function cyl(name, x, y, r, z, h, style = {}, { extra = "", bevel = 0, owner, bias = 0 } = {}) {
  return put(name, [x, y, z + h / 2], S(k.cylinder(x, y, r, z, h, P, Math.max(24, Math.round(r * 6)), bevel), { tone: "mid", ...style }) + extra, [A.cylinder(x, y, r, z, h, { owner })], bias);
}
function disc(name, F, s0, s1, r, style = {}, { extra = "", owner, bias = 0, bevel = 0 } = {}) {
  return put(name, G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2)), S(G.disc(s0, s1, r, F, P, { bevel }), { tone: "hi", ...style }) + extra, [A.disc(F, s0, s1, r, { owner })], bias);
}
function turned(name, F, profile, style = {}, { extra = "", owner, bias = 0 } = {}) {
  const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
  put(name, G.add3(F.o, G.mul3(F.a, mid)), S(G.solidOf(profile, F, P), { tone: "hi", ...style }) + extra, [A.solid(F, profile, { owner })], bias);
  return R.solids[R.solids.length - 1];
}
function ballAt(name, centre, r, { owner, tone = "hi" } = {}) {
  return put(name, centre, S(G.sphereOf(centre, r, P, { steps: G.stepsFor(r, 32) }), { tone }), [A.ball(centre, r, { owner })]);
}
// A flat-topped pad on a curved host (saddle), so a flange or stem sits on it flush.
function padOn(name, hosts, point, outward, a, h, { tone = "hi", owner } = {}) {
  const list = [hosts].flat();
  const inside = (p) => list.some((shape) => A.sdf(shape, p) < 0);
  const axis = G.unit3(outward);
  const F = G.frameAlong(point, axis);
  const start = (angle) => {
    let lo = -2.5 * a;
    let hi = h;
    if (!inside(G.pointOf(F, lo, a, angle))) return 0;
    for (let step = 0; step < 40; step++) {
      const mid = (lo + hi) / 2;
      if (inside(G.pointOf(F, mid, a, angle))) lo = mid;
      else hi = mid;
    }
    return hi;
  };
  const low = Math.min(...Array.from({ length: 48 }, (_, index) => start((index / 48) * Math.PI * 2)));
  put(name, G.add3(point, G.mul3(axis, h / 2)), S(G.saddleOf(F, a, start, h, P), { tone }), [A.disc(F, low - 0.05, h, a, { owner, seated: true, cut: list })]);
  return G.add3(point, G.mul3(axis, h));
}

// Pipes: fillet the legs, gap the pipe under every collar, record each chunk; flow dashes run on
// each chunk, phased by 3D arc length from the route's start so they continue through joints.
function pipe(name, control, r, { flanges = [true, true], flangeR = 1.5, gaps: extra = [], bands = [], flow = () => null, tone = "hi", maxLength = 22, rims } = {}) {
  const line = G.fillet(control, Math.max(r * 2.6, 3), 14, { P, tube: r });
  const total = G.pathLength(line);
  const id = R.nameFor(name);
  const collars = [];
  [[0, -1], [total, 1]].forEach(([along, sign], index) => {
    if (!flanges[index]) return;
    const thick = Math.max(1.2, r * 0.55);
    const tangent = G.tangentAlong(line, along);
    collars.push({ kind: "flange", centre: G.add3(G.pointAlong(line, along), G.mul3(tangent, (-sign * thick) / 2)), tangent, radius: r * flangeR, thick, gap: sign < 0 ? [0, thick] : [total - thick, total] });
  });
  for (const along of bands) collars.push({ kind: "band", centre: G.pointAlong(line, along), tangent: G.tangentAlong(line, along), radius: r * 1.14, thick: 1.6, gap: [along - 0.8, along + 0.8] });
  const gaps = [...collars.map(({ gap }) => gap), ...extra].sort((a, b) => a[0] - b[0]);
  R.route(id, line, r, { owner: id, gaps, rims: rims ?? flanges.map((on) => (on ? r * flangeR : r)), piece: "all" });
  tubePieces(line, r, P, { maxLength, spacing: Math.max(0.8, r * 0.2), gaps }).forEach((part, index) => {
    const kind = flow(part);
    let dash = "";
    if (kind) {
      const length = G.pathLength(part.points);
      dash = `<path class="gd-flow" data-flow="${kind}" data-from="${part.from.toFixed(2)}" pathLength="${length.toFixed(2)}" d="${k.pathOf(part.points.map(at))}"/>`;
    }
    R.put({ piece: "all", at: part.mid, svg: tubeSvg(part, { tone }) + dash, name: `${id}:${index}`, route: id, chunk: index, shapes: [A.tube(part.points, part.radii)] });
  });
  for (const { kind, centre, tangent, radius, thick } of collars) {
    const F = G.frameAlong(centre, tangent);
    const face = G.dot3(F.a, V) > 0 ? thick / 2 : -thick / 2;
    const bolts = kind === "flange" && Math.abs(G.dot3(F.a, V)) > 0.12 ? D(G.dotsOf(F, face, radius * 0.78, 8, P, { all: true }), { size: 0.42, tone: "mid" }) : "";
    put(`${id}.${kind}`, centre, S(G.disc(-thick / 2, thick / 2, radius, F, P), { tone: kind === "band" ? "mid" : tone }) + bolts, [A.disc(F, -thick / 2, thick / 2, radius, { owner: id })]);
  }
  line.owner = id;
  return line;
}

// ---------- base ----------
function baseSvg() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of k.corners(PLATE, 22).sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Right of way: a gravel bed under the mainline, between the berms.
  const bed = { x: -BERM_X, y: LINE_Y - 13, w: BERM_X * 2, d: 26, r: 2 };
  out.push(S(k.slabOf(bed, 0, 0.6, P, 4), { tone: "lo", crease: "none" }));
  out.push(D(k.dotGrid(bed.x + 3, bed.y + 3, 62, 6, 4, 0.6, P), { size: 0.26, tone: "faint" }));
  // Ruler strip along the front edge, every 5 units, a major every 25.
  const strip = { x: PLATE.x + 40, y: PLATE.y + PLATE.d - 12, w: PLATE.w - 120, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 5, 5, strip.y + 0.6, 0.6, [1.8, 3.4], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3, 0.6]), at([strip.x + strip.w - 2, strip.y + 3, 0.6])], { size: 0.45 }));
  // Label plate at the front right corner.
  const label = { x: PLATE.x + PLATE.w - 66, y: PLATE.y + PLATE.d - 15, w: 40, d: 10, r: 1 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.4), 0.8, P), { tone: "faint" }));
  out.push(L([[3, 30], [5, 24], [7, 28]].map(([dy, len]) => k.lineOnTop([label.x + 4, label.y + dy], [label.x + 4 + len, label.y + dy], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + 2, label.y + 5, 0.8]), at([label.x + label.w - 2, label.y + 5, 0.8])], { size: 0.4 }));
  return out.join("");
}
record(A.box([PLATE.x, PLATE.y, -PLATE_H], [PLATE.x + PLATE.w, PLATE.y + PLATE.d, 0], { name: "stand.plate", ...STAND }));
record(A.box([-BERM_X, LINE_Y - 13, 0], [BERM_X, LINE_Y + 13, 0.6], { name: "stand.bed", ...STAND }));

// ---------- earth berms: the pipe comes out of the ground and goes back in ----------
const BERM_H = 28;
function berm(sign) {
  const y0 = LINE_Y - 17;
  const y1 = LINE_Y + 17;
  const xi = sign * BERM_X;
  const top = sign * (BERM_X + 8);
  const foot = sign * (BERM_X + 26);
  const poly = sign < 0 ? [[xi, 0], [xi, BERM_H], [top, BERM_H], [foot, 0]] : [[foot, 0], [top, BERM_H], [xi, BERM_H], [xi, 0]];
  const F = G.frameOf([0, 0, 0], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  // Gravel on the slope and the top: rows of dots in the slope's own plane.
  const dots = [];
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 7; j++) {
      const t = (i + 0.5) / 6;
      dots.push(at([top + (foot - top) * t, y0 + 2.5 + j * 4.8, BERM_H * (1 - t)]));
    }
  }
  for (let j = 0; j < 7; j++) for (const f of [0.3, 0.7]) dots.push(at([xi + (top - xi) * f, y0 + 2.5 + j * 4.8, BERM_H]));
  put(`stand.berm${sign < 0 ? "L" : "R"}`, [(xi + foot) / 2, LINE_Y, BERM_H / 3], S(G.prismOf(F, poly, y0, y1, P), { tone: "lo" }) + D(dots, { size: 0.32, tone: "mid" }), [A.prism(F, poly, y0, y1, { ...STAND, ground: true })]);
  // Wall sleeve (link seal) where the pipe leaves the earth.
  const SF = G.frameAlong([xi, LINE_Y, LINE_Z], [sign < 0 ? 1 : -1, 0, 0]);
  disc(`stand.sleeve${sign < 0 ? "L" : "R"}`, SF, 0, SLEEVE, LINE_R + 2.6, { tone: "mid" }, { owner: "stand.base", extra: D(G.dotsOf(SF, SLEEVE, LINE_R + 1.4, 8, P, { all: true }), { size: 0.38, tone: "lo" }) });
}
berm(-1);
berm(1);

// ---------- mainline on piers ----------
for (const x of PIERS) {
  slab("stand.pier", { x: x - 4.5, y: LINE_Y - 8, w: 9, d: 16, r: 1 }, 0.6, 3.4, { tone: "lo" }, { ground: true, owner: "stand.base" });
  slab("pier.saddle", { x: x - 1.6, y: LINE_Y - 4, w: 3.2, d: 8, r: 0.5 }, 4, LINE_Z - LINE_R * 1.14 - 4, { tone: "mid" }, { owner: "line", extra: D([at([x, LINE_Y + 4, 5.2])], { size: 0.4, tone: "lo" }) });
}
const VALVE_HALF = LINE_R * 2.4;
const teeCut = Math.sqrt(TEE_R ** 2 - LINE_R ** 2);
const x0 = -BERM_X + SLEEVE;
const along = (x) => x - x0;
pipe(
  "line",
  [[x0, LINE_Y, LINE_Z], [BERM_X - SLEEVE, LINE_Y, LINE_Z]],
  LINE_R,
  {
    flanges: [false, false],
    bands: [...PIERS, ...GAUGES].map(along),
    gaps: [
      [along(TEE_A - teeCut), along(TEE_A + teeCut)],
      [along(VALVE_X - VALVE_HALF), along(VALVE_X + VALVE_HALF)],
      [along(TEE_B - teeCut), along(TEE_B + teeCut)],
      [along(METER[0]), along(METER[1])],
    ],
    flow: (part) => {
      const x = part.mid[0];
      return x < TEE_A ? "in" : x > TEE_B ? "out" : null;
    },
    maxLength: 26,
  },
);
ballAt("tee.A", [TEE_A, LINE_Y, LINE_Z], TEE_R, { owner: "line" });
ballAt("tee.B", [TEE_B, LINE_Y, LINE_Z], TEE_R, { owner: "line" });

// ---------- sectioning ball valve, gear operator and handwheel ----------
function valve() {
  const r = LINE_R;
  const centre = [VALVE_X, LINE_Y, LINE_Z];
  const F = G.frameAlong(centre, [1, 0, 0]);
  // A ball valve body: a cast sphere with a short neck and a flange at each end.
  const crown = r * 2;
  const NECK = r * 1.2;
  const FLR = r * 1.6;
  const FT = 2.4;
  const rimS = Math.sqrt(crown ** 2 - NECK ** 2);
  ballAt("valve.ball", centre, crown, { owner: "line" });
  for (const sign of [-1, 1]) {
    const [n0, n1] = sign < 0 ? [-VALVE_HALF + FT, -rimS] : [rimS, VALVE_HALF - FT];
    disc("valve.end", F, n0, n1, NECK, { tone: "hi" }, { owner: "line" });
    const [f0, f1] = sign < 0 ? [-VALVE_HALF, -VALVE_HALF + FT] : [VALVE_HALF - FT, VALVE_HALF];
    const face = G.dot3(F.a, V) > 0 ? f1 : f0;
    disc("valve.flange", F, f0, f1, FLR, { tone: "hi" }, { owner: "line", extra: D(G.dotsOf(F, face, FLR * 0.8, 8, P, { all: true }), { size: 0.42, tone: "mid" }) });
  }
  // Support under the body.
  slab("valve.support", { x: VALVE_X - 5, y: LINE_Y - 6, w: 10, d: 12, r: 1 }, 0.6, LINE_Z - crown - 0.6, { tone: "lo" });
  const NF = G.frameAlong(centre, [0, 0, 1]);
  const s0 = crown - 0.25;
  const s1 = crown + 5;
  disc("valve.neck", NF, s0, s1, r * 0.55, { tone: "hi" }, { bias: 0.2 });
  disc("valve.bonnet", NF, s1, s1 + 1.4, r * 0.95, { tone: "mid" }, { extra: D(G.dotsOf(NF, s1 + 1.4, r * 0.75, 6, P, { all: true }), { size: 0.36, tone: "lo" }) });
  const gz = LINE_Z + s1 + 1.4;
  const box = { x: VALVE_X - 6, y: LINE_Y - 6, w: 12, d: 12, r: 1.2 };
  const GH = 9;
  slab("valve.gear", box, gz, GH, { tone: "hi", inner: L(k.sideSeam(box, gz + 3, P, 3), { tone: "faint" }) }, { extra: D(k.corners(box, 1.6).map(([x, y]) => at([x, y, gz + GH])), { size: 0.4 }) });
  // Position indicator on the lid: a bar across the pipe means "closed".
  slab("valve.indicator", { x: VALVE_X - 1, y: LINE_Y - 4.5, w: 2, d: 9, r: 0.6 }, gz + GH, 1.2, { tone: "mid" }, { extra: D([at([VALVE_X, LINE_Y, gz + GH + 1.2])], { size: 0.5, tone: "hi" }) });
  // Handwheel on the face toward the viewer (+y), on a short stem.
  const WF = G.frameOf([VALVE_X, LINE_Y + 6, gz + GH / 2], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  disc("valve.stem", WF, 0, 3.5, 1.1, { tone: "mid" });
  const WR = 6.4;
  const spokeAt = (i) => { const t = (i / 5) * Math.PI * 2 + 0.3; return [G.pointOf(WF, 4, 1.45, t), G.pointOf(WF, 4, WR - 1.05, t)]; };
  const spokes = [0, 1, 2, 3, 4].map((i) => k.pathOf(spokeAt(i).map(at))).join("");
  put("valve.wheel", G.pointOf(WF, 4.2, 0, 0), S(G.ringBand(3.4, 4.6, WR - 1.1, WR, WF, P), { tone: "hi" }) + L(spokes, { tone: "mid" }) + S(G.disc(3.4, 4.8, 1.5, WF, P), { tone: "mid" }), [A.ring(WF, 3.4, 4.6, WR - 1.1, WR, {}), A.disc(WF, 3.4, 4.8, 1.5, {}), ...[0, 1, 2, 3, 4].map((i) => A.tube(spokeAt(i), 0.3, {}))], 0.2);
  return { top: [VALVE_X, LINE_Y, gz + GH] };
}
const VALVE = valve();

// ---------- ultrasonic meter run ----------
function meter() {
  const F = G.frameAlong([METER[0], LINE_Y, LINE_Z], [1, 0, 0]);
  const len = METER[1] - METER[0];
  const FT = 2.4;
  const FR = LINE_R * 1.6;
  const BR = LINE_R * 1.22;
  for (const [s0, s1] of [[0, FT], [len - FT, len]]) {
    const face = G.dot3(F.a, V) > 0 ? s1 : s0;
    disc("meter.flange", F, s0, s1, FR, { tone: "hi" }, { owner: "line", extra: D(G.dotsOf(F, face, FR * 0.8, 8, P, { all: true }), { size: 0.42, tone: "mid" }) });
  }
  const host = turned("meter.body", F, [[FT, BR], [len - FT, BR]], { tone: "hi", inner: L(G.arcOf(F, len / 2, BR, P), { tone: "faint" }) }, { owner: "line" });
  // Transducer pairs, angled across the bore, on the side toward the viewer.
  for (const [s, t] of [[7, 0.6], [len - 7, 0.6], [7, 1.35], [len - 7, 1.35]]) {
    const dir = [0, Math.cos(t), Math.sin(t)];
    const point = G.add3(G.pointOf(F, s, 0, 0), G.mul3(dir, BR));
    padOn("meter.boss", host, point, dir, 1.7, 2.2, { tone: "mid", owner: "line" });
  }
}
meter();

// ---------- pressure gauges on the mainline ----------
const GAUGE_R = 8.5;
const GAUGE_TOP = LINE_Z + 21.5;
const DIAL = { from: -0.59 - 2.36, span: 4.71 }; // 270° sweep centred on "away from the viewer"
function gauge(x, id) {
  const top = [x, LINE_Y, LINE_Z + LINE_R * 1.14 - 0.1];
  cyl("gauge.stem", x, LINE_Y, 0.75, top[2], 3.2, { tone: "mid", crease: "none" }, { owner: "line" });
  cyl("gauge.root", x, LINE_Y, 2.2, top[2] + 3.2, 2.6, { tone: "mid" }, { extra: L(k.knurl(x, LINE_Y, 2.2, top[2] + 3.4, top[2] + 5.6, 10, P, 0.3), { tone: "lo" }) });
  cyl("gauge.stem2", x, LINE_Y, 1, top[2] + 5.8, GAUGE_TOP - 4 - top[2] - 5.8, { tone: "mid", crease: "none" });
  const z0 = GAUGE_TOP - 4;
  const ticks = k.radialTicks(x, LINE_Y, GAUGE_R - 2, 20, 5, GAUGE_TOP, [1, 2.1], P, DIAL.from, DIAL.span);
  const n = DIAL.from + (DIAL.span * 80) / 100;
  const tip = (a, len) => [x + Math.sin(a) * len, LINE_Y - Math.cos(a) * len, GAUGE_TOP + 0.2];
  const face = [
    L(k.knurl(x, LINE_Y, GAUGE_R, z0 + 0.4, GAUGE_TOP - 1.2, 40, P, 0.3), { tone: "lo" }),
    L(k.ring(x, LINE_Y, GAUGE_R - 1.4, GAUGE_TOP, P, 48), { tone: "lo" }),
    L(ticks.minor, { tone: "lo" }),
    L(ticks.major, { tone: "mid" }),
    `<path class="iso-line" data-tone="lit" data-part="needle-${id}" data-free="start" d="${k.pathOf([at(tip(n + Math.PI, 1.4)), at(tip(n, GAUGE_R - 2.4))])}" style="stroke-width:1.2"/>`,
    D([at([x, LINE_Y, GAUGE_TOP + 0.2])], { size: 0.9, tone: "hi" }),
  ].join("");
  cyl("gauge.case", x, LINE_Y, GAUGE_R, z0, 4, { tone: "hi", crease: "lo" }, { bevel: 0.5, extra: face });
}
gauge(GAUGES[0], "in");
gauge(GAUGES[1], "out");

// ---------- compressor skid ----------
slab("stand.skid", SKID, 0, 4, { tone: "lo" }, { ground: true, owner: "stand.base", steps: 3, bevel: 0.6, extra: D(k.corners(SKID, 2.4).map(([x, y]) => at([x, y, 4])), { size: 0.45 }) });
for (const x of [-9, 9]) slab("comp.pedestal", { x: x - 3, y: ST_Y - 7, w: 6, d: 14, r: 0.8 }, 4, AXIS_Z - CASE_R - 4, { tone: "mid" });
const CF = G.frameAlong([0, ST_Y, AXIS_Z], [1, 0, 0]);
const CASE_PROFILE = [[-24, 5.5], [-19, 5.5], [-19, 8.4], [-16, 8.4], [-16, CASE_R], [16, CASE_R], [16, 8.4], [19, 8.4], [19, 5.5], [24, 5.5]];
const seams = [-6, 6].map((s) => G.arcOf(CF, s, CASE_R, P)).join("");
const CASE = turned("comp.casing", CF, CASE_PROFILE, { tone: "hi", inner: L(seams, { tone: "faint" }) }, {
  extra: D([...G.dotsOf(CF, -16, 9.7, 12, P, { fade: [0.04, 0.42] }), ...G.dotsOf(CF, 16, 9.7, 12, P, { fade: [0.04, 0.42] })], { size: 0.4, tone: "mid" }),
});
// Coupling guard from the compressor's bearing housing to the turbine's exhaust collector.
const GF = G.frameAlong([24, ST_Y, AXIS_Z], [1, 0, 0]);
turned("comp.coupling", GF, [[0, 3.4], [COLLECTOR.x - 24, 3.4]], { tone: "mid", inner: L(G.arcOf(GF, (COLLECTOR.x - 24) / 2, 3.4, P), { tone: "faint" }) });
// Suction and discharge nozzles on top of the casing: saddle pad, neck, neck flange.
const NOZZLE_TOP = [];
for (const [x, dir] of [[NOZZLE[0], [0, 0, 1]], [NOZZLE[1], [0, 1, 0]]]) {
  const top = padOn("comp.nozzle-pad", CASE, G.add3([x, ST_Y, AXIS_Z], G.mul3(dir, CASE_R)), dir, LAT_R + 0.9, 1.6, { tone: "hi" });
  const NF = G.frameAlong(top, dir);
  disc("comp.neck", NF, 0, 2.4, LAT_R + 0.3, { tone: "hi" });
  disc("comp.neck-flange", NF, 2.4, 4, LAT_R * 1.5, { tone: "hi" }, { extra: D(G.dotsOf(NF, 4, LAT_R * 1.17, 8, P, { all: true }), { size: 0.4, tone: "mid" }) });
  NOZZLE_TOP.push(G.add3(top, G.mul3(dir, 4)));
}

// ---------- gas turbine: exhaust collector and stack, gas generator, air-filter house ----------
slab("turb.collector", COLLECTOR, 4, COLLECTOR_H, { tone: "mid", inner: L(k.sideSeam(COLLECTOR, 4 + COLLECTOR_H - 6, P, 3), { tone: "faint" }) }, { extra: D(k.corners(COLLECTOR, 1.8).map(([x, y]) => at([x, y, 4 + COLLECTOR_H])), { size: 0.4 }) });
const stackZ = 4 + COLLECTOR_H;
cyl("turb.stack-base", STACK[0], STACK[1], 7.4, stackZ, 2, { tone: "mid" });
cyl("turb.stack", STACK[0], STACK[1], 5.6, stackZ + 2, STACK_TOP - stackZ - 4, { tone: "hi", crease: "none" }, { extra: L([stackZ + 14, stackZ + 26].map((z) => k.sideArc(STACK[0], STACK[1], 5.6, z, P, 20)).join(""), { tone: "faint" }) });
cyl("turb.stack-lip", STACK[0], STACK[1], 6.4, STACK_TOP - 2, 2, { tone: "hi" }, { extra: `<path class="gd-void" d="${k.ring(STACK[0], STACK[1], 4.9, STACK_TOP, P, 32)}"/>` });
const TF = G.frameAlong([COLLECTOR.x + COLLECTOR.w, ST_Y, AXIS_Z], [1, 0, 0]);
const TURB_LEN = FILTER.x - (COLLECTOR.x + COLLECTOR.w);
const TURB_PROFILE = [[0, 8], [7, 8], [7, 9.6], [21, 9.6], [21, 8.6], [35, 7.2], [40, 7.2], [40, 8.8], [TURB_LEN, 8.8]];
turned("turb.body", TF, TURB_PROFILE, { tone: "hi", inner: L([12, 16].map((s) => G.arcOf(TF, s, 9.6, P)).join(""), { tone: "faint" }) }, {
  extra: D(G.dotsOf(TF, 7, 8.8, 14, P, { fade: [0.04, 0.42] }), { size: 0.38, tone: "mid" }),
});
for (const [s, r] of [[4, 8], [44, 8.8]]) slab("turb.pedestal", { x: TF.o[0] + s - 2.5, y: ST_Y - 6, w: 5, d: 12, r: 0.8 }, 4, AXIS_Z - r - 4, { tone: "mid" });
const vents = [];
for (let i = 0; i < 6; i++) {
  const z = 10 + i * 4;
  vents.push(k.pathOf([at([FILTER.x + 3, FILTER.y + FILTER.d, z]), at([FILTER.x + FILTER.w - 3, FILTER.y + FILTER.d, z]), at([FILTER.x + FILTER.w - 3, FILTER.y + FILTER.d, z + 1.4]), at([FILTER.x + 3, FILTER.y + FILTER.d, z + 1.4])], true));
  vents.push(k.pathOf([at([FILTER.x + FILTER.w, FILTER.y + 3, z]), at([FILTER.x + FILTER.w, FILTER.y + FILTER.d - 3, z]), at([FILTER.x + FILTER.w, FILTER.y + FILTER.d - 3, z + 1.4]), at([FILTER.x + FILTER.w, FILTER.y + 3, z + 1.4])], true));
}
slab("turb.filter", FILTER, 4, FILTER_H, { tone: "mid", inner: L(k.sideSeam(FILTER, 4 + FILTER_H - 5, P, 3), { tone: "faint" }) }, { extra: L(vents.join(""), { tone: "lo" }) });
slab("turb.hood", k.insetPlan(FILTER, -1.2), 4 + FILTER_H, 2.2, { tone: "mid" }, { extra: D(k.corners(k.insetPlan(FILTER, -1.2), 2).map(([x, y]) => at([x, y, 6.2 + FILTER_H])), { size: 0.4 }) });

// ---------- control house: the station is run from here ----------
const HOUSE = { x: -152, y: -60, w: 42, d: 28, r: 1 };
const HOUSE_H = 24;
{
  const front = HOUSE.y + HOUSE.d;
  const side = HOUSE.x + HOUSE.w;
  const panel = [HOUSE.x + 14, HOUSE.x + 28].map((x) => k.segment([x, front, 2], [x, front, 2 + HOUSE_H], P)).join("");
  const louvre = [0, 1, 2, 3].map((i) => k.pathOf([[side, front - 20, 14 + i * 2.2], [side, front - 8, 14 + i * 2.2], [side, front - 8, 15.2 + i * 2.2], [side, front - 20, 15.2 + i * 2.2]].map(at), true)).join("");
  slab("stand.house-pad", k.insetPlan(HOUSE, -3), 0, 2, { tone: "lo" }, { ground: true, owner: "stand.base" });
  slab("house.body", HOUSE, 2, HOUSE_H, { tone: "mid", inner: L(panel, { tone: "faint" }) }, { extra: L(louvre, { tone: "lo" }) });
  slab("house.roof", k.insetPlan(HOUSE, -1.6), 2 + HOUSE_H, 1.8, { tone: "mid" }, { extra: D(k.corners(k.insetPlan(HOUSE, -1.6), 1.6).map(([x, y]) => at([x, y, 3.8 + HOUSE_H])), { size: 0.4 }) });
  // Door with its handle on the front, a step, and the air conditioner on the side.
  slab("house.door", { x: HOUSE.x + 17, y: front, w: 8, d: 0.6, r: 0.2 }, 2, 15, { tone: "mid" }, { extra: D([at([HOUSE.x + 23.6, front + 0.6, 9.5])], { size: 0.45, tone: "hi" }) });
  slab("house.step", { x: HOUSE.x + 15.5, y: front, w: 11, d: 2.6, r: 0.4 }, 2, 1, { tone: "lo" });
  const AF = G.frameAlong([side + 4, HOUSE.y + 8.5, 9.5], [1, 0, 0]);
  slab("house.ac", { x: side, y: HOUSE.y + 4, w: 4, d: 9, r: 0.5 }, 6, 7, { tone: "mid" }, { extra: L(G.circleOf(AF, 0, 2.6, P, 24), { tone: "lo" }) + D([at(AF.o)], { size: 0.5, tone: "lo" }) });
  const sign = { x: HOUSE.x + 4, y: front, w: 9, d: 0.5, r: 0.2 };
  slab("house.sign", sign, 15, 5, { tone: "lo", crease: "none" }, { extra: L([16.5, 18.2].map((z) => k.segment([sign.x + 1.2, front + 0.5, z], [sign.x + sign.w - 1.2, front + 0.5, z], P)).join(""), { tone: "faint", free: true }) });
}

// ---------- suction and discharge lines, with pipe-rack posts ----------
const branchUp = Math.sqrt(TEE_R ** 2 - LAT_R ** 2);
pipe("suction", [[TEE_A, LINE_Y, LINE_Z + branchUp], [TEE_A, LINE_Y, SUCTION_Z], [TEE_A, ST_Y, SUCTION_Z], [NOZZLE[0], ST_Y, SUCTION_Z], NOZZLE_TOP[0]], LAT_R, { flanges: [false, true], flow: () => "in", rims: [LAT_R, LAT_R * 1.5] });
pipe("discharge", [NOZZLE_TOP[1], [TEE_B, LINE_Y - branchUp, LINE_Z]], LAT_R, { flanges: [true, false], flow: () => "out", rims: [LAT_R * 1.5, LAT_R] });
function post(x, y, zTop, owner) {
  slab("rack.foot", { x: x - 3.5, y: y - 3.5, w: 7, d: 7, r: 0.8 }, 0, 1.4, { tone: "lo" }, { ground: true, owner: "stand.base", extra: D(k.corners({ x: x - 3.5, y: y - 3.5, w: 7, d: 7 }, 1.2).map(([px, py]) => at([px, py, 1.4])), { size: 0.36 }) });
  cyl("rack.post", x, y, 1.6, 1.4, zTop - 2.6 - 1.4, { tone: "mid", crease: "none" });
  slab("rack.shoe", { x: x - 3, y: y - 3, w: 6, d: 6, r: 0.6 }, zTop - 2.6, 2.6, { tone: "mid" }, { owner });
}
post(-46, ST_Y, SUCTION_Z - LAT_R, "suction");
post(TEE_B, 3, LINE_Z - LAT_R, "discharge");

// ---------- settle the painter's order from the recorded shapes ----------
A.settle(R, P);
R.items.sort((a, b) => a.key - b.key);

// ---------- labels ----------
const LABELS = [
  { n: 1, name: "Gasoducto enterrado", anchor: [-118, LINE_Y + 2, LINE_Z + LINE_R], dx: 10, dy: 128 },
  { n: 2, name: "Manómetro de llegada", anchor: [GAUGES[0] - GAUGE_R * 0.7, LINE_Y - GAUGE_R * 0.7, GAUGE_TOP - 0.4], dx: -2, dy: -82 },
  { n: 3, name: "Válvula de seccionamiento (cerrada)", anchor: [VALVE_X - 3, LINE_Y + 9, LINE_Z + 23], dx: -6, dy: 136 },
  { n: 4, name: "Compresor centrífugo", anchor: [-2, ST_Y + 4, AXIS_Z + CASE_R - 0.6], dx: -40, dy: -106 },
  { n: 5, name: "Turbina de gas", anchor: [COLLECTOR.x + COLLECTOR.w + 16, ST_Y + 4, AXIS_Z + 9.3], dx: 34, dy: -60 },
  { n: 6, name: "Medidor de flujo", anchor: [(METER[0] + METER[1]) / 2, LINE_Y + 4, LINE_Z + LINE_R * 1.22 - 0.6], dx: 12, dy: 100 },
  { n: 7, name: "Manómetro de salida", anchor: [GAUGES[1] + GAUGE_R * 0.7, LINE_Y + GAUGE_R * 0.7, GAUGE_TOP - 2], dx: 50, dy: 46 },
];

if (process.argv.includes("--anchors")) console.log(LABELS.map((l) => l.n + ":" + at(l.anchor).map((v) => v.toFixed(0)).join(",")).join("  "), "plate", [[PLATE.x, PLATE.y, 0], [PLATE.x + PLATE.w, PLATE.y, 0], [PLATE.x, PLATE.y + PLATE.d, 0], [PLATE.x + PLATE.w, PLATE.y + PLATE.d, 0]].map((p) => at(p).map((v) => v.toFixed(0)).join(",")).join(" "));
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Maqueta de un tramo de gasoducto: el tubo de acero sale de la tierra sobre soportes de concreto, pasa por un manómetro, una válvula de seccionamiento cerrada y un medidor, y vuelve a enterrarse. Como la válvula está cerrada, el gas sube a una estación de compresión: un compresor centrífugo movido por una turbina de gas le devuelve la presión perdida por fricción.",
  body: [baseSvg(), ...R.items.map((item) => item.svg), `<g data-part="labels">${labelsSvg(LABELS, at)}</g>`],
});

// ---------- live code ----------
const live = `
${MODEL}
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const P = ${JSON.stringify(P)};
const GAUGES = ${JSON.stringify(GAUGES)}, LINE_Y = ${LINE_Y}, GAUGE_TOP = ${GAUGE_TOP}, GAUGE_R = ${GAUGE_R}, DIAL = ${JSON.stringify(DIAL)};
const needles = { in: svg.querySelector('[data-part="needle-in"]'), out: svg.querySelector('[data-part="needle-out"]') };
const flows = [...svg.querySelectorAll(".gd-flow")].map((el) => ({ el, kind: el.dataset.flow, from: Number(el.dataset.from) }));
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const fmt = (n, d = 0) => n.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });
let q = 900, target = 900, phaseIn = 0, phaseOut = 0, last = 0, clock = 0, frame = 0, touring = true, visible = false, idle = 0;
const tourAt = (t) => (Q_MIN + Q_MAX) / 2 + ((Q_MAX - Q_MIN) / 2) * 0.92 * Math.sin(t * 0.32);
function needle(el, x, bar) {
  const a = DIAL.from + DIAL.span * clamp(bar / 100, 0, 1);
  const tip = (b, len) => iso([x + Math.sin(b) * len, LINE_Y - Math.cos(b) * len, GAUGE_TOP + 0.2], P);
  el.setAttribute("d", pathOf([tip(a + Math.PI, 1.4), tip(a, GAUGE_R - 2.4)]));
}
function draw() {
  const pin = inletBar(q), vin = speedOf(q, pin);
  needle(needles.in, GAUGES[0], pin);
  needle(needles.out, GAUGES[1], P_OUT);
  for (const f of flows) f.el.style.strokeDashoffset = String(f.from - (f.kind === "in" ? phaseIn : phaseOut));
  const text = compact
    ? fmt(q) + " MMPCD · " + fmt(pin) + " → " + fmt(P_OUT) + " bar · " + fmt(vin, 1) + " m/s"
    : fmt(q) + " MMPCD · llega a " + fmt(pin) + " bar, sale a " + fmt(P_OUT) + " bar · gas a " + fmt(vin, 1) + " m/s";
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(Math.round(q)));
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) { clock += dt; target = tourAt(clock); }
  q = q + (target - q) * (1 - Math.exp(-dt / 0.45));
  // Dashes move at the gas speed, slowed for the eye (1 m/s = 1.6 model units per second).
  phaseIn += dt * speedOf(q, inletBar(q)) * 1.6;
  phaseOut += dt * speedOf(q, P_OUT) * 1.6;
  draw();
  frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => { touring = false; target = clamp(next, Q_MIN, Q_MAX); clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; clock = Math.asin(clamp((target - (Q_MIN + Q_MAX) / 2) / (((Q_MAX - Q_MIN) / 2) * 0.92), -1, 1)) / 0.32; run(); }, 4000); if (still.matches) { q = target; draw(); } run(); };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (event) => { const box = svg.getBoundingClientRect(); steer(Q_MIN + clamp((event.clientX - box.left) / box.width, 0, 1) * (Q_MAX - Q_MIN)); });
stage.addEventListener("keydown", (event) => {
  const step = event.key === "ArrowRight" || event.key === "ArrowUp" ? 100 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -100 : 0;
  if (event.key === "Home") { event.preventDefault(); steer(Q_MIN); return; }
  if (event.key === "End") { event.preventDefault(); steer(Q_MAX); return; }
  if (!step) return;
  event.preventDefault();
  steer(Math.round((target + step) / 100) * 100);
});
draw();
`;

const I = theme === "light" ? { in: "#1E5B4F", out: "#9B2247", void: "#3b3436" } : { in: "#6fc2ae", out: "#ea8aa8", void: "#0d0a0b" };
const STYLE = `<style>.gd-flow{fill:none;stroke-width:1.7;stroke-linecap:round;stroke-dasharray:2.4 7.6}.gd-flow[data-flow="in"]{stroke:${I.in}}.gd-flow[data-flow="out"]{stroke:${I.out}}.gd-void{fill:${I.void};stroke:var(--anatomy-lo);stroke-width:.6}</style>`;
const lo = model.inletBar(model.Q_MAX);
writeFigure({
  id: "gasoductos",
  title: "Gasoducto y estación de compresión",
  theme,
  svg: svg.replace("</svg>", `${STYLE}</svg>`),
  live,
  plate: {
    fig: "Fig 9",
    title: "Gasoducto y compresión",
    hint: "Desliza para cambiar el flujo de gas",
    ariaLabel: "Gasoducto: las flechas cambian el flujo de gas en millones de pies cúbicos diarios",
    keys: [
      { mark: "green", label: "Gas que llega, con la presión que perdió en el camino" },
      { mark: "red", label: "Gas comprimido que sigue su viaje" },
    ],
    caption: `El gas natural viaja comprimido por tubos de acero. La fricción con la pared le quita presión, así que cada 100 a 150 km una estación de compresión se la devuelve: con la válvula de la línea cerrada, el gas sube a un compresor centrífugo movido por una turbina de gas y regresa al ducto. Modelo simplificado de un ducto de 36 pulgadas: la estación anterior entrega ${model.P_OUT} bar y, tras 120 km, el gas llega con menos presión cuanto más flujo lleva (${Math.round(lo)} bar con ${model.Q_MAX.toLocaleString("es-MX")} MMPCD); el compresor lo regresa a ${model.P_OUT} bar. Ya comprimido, el mismo gas ocupa menos volumen y avanza más despacio.`,
  },
});

// Looked at 8×: both nozzle flanges sit on the casing they are bolted to, and the discharge
// nozzle only overlaps the skid floor on screen.
A.auditOrExit(R, P, { crowd: [["discharge", "comp.casing"], ["suction", "comp.casing"], ["discharge", "stand.skid"]] });
