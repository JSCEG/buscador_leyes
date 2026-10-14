/**
 * "¿Cómo funciona?" · Cómo se forma el precio de la gasolina al público en México.
 *
 * A model on a base: a fuel dispenser on its island (cabinet, head with the price display drawn in
 * the plane of its face, hose and nozzle in its boot, crash posts), fed by a pipeline stub from a
 * barrel that stands for the international reference. Beside it, a measuring column: a ruler
 * graduated in pesos per litre and a stack of blocks, one per component of the pump price, each as
 * tall as its share. Moving the pointer (or the arrow keys) changes the international reference;
 * the blocks, the cursor on the ruler and the pump display all follow one small model.
 *
 * The model is ILLUSTRATIVE (the caption says "cifras ilustrativas"). Assumptions, pesos per litre
 * of gasolina regular (menor a 91 octanos):
 *   - Molécula: import parity = reference price of gasoline on the US Gulf Coast (USD per gallon)
 *     × a fixed exchange rate of 18.50 MXN/USD ÷ 3.78541 litres per gallon.
 *   - Logística: 1.45 fixed (ocean freight, internación, pipeline or tank truck, storage at a TAR).
 *   - IEPS cuota: 6.45 full rate, a round figure of the order of the current federal quota (SHCP
 *     updates it every year). The weekly stimulus that SHCP publishes in the DOF reduces it. In
 *     this model the stimulus grows linearly from 0 % at 2.00 USD/gal to 100 % at 3.40 USD/gal;
 *     the real percentage is set week by week and is not a formula.
 *   - Otras cuotas IEPS: 0.70 fixed (the quota for the states, art. 2-A fr. II LIEPS, plus the
 *     IEPS on fossil fuels / carbon), round illustrative figure.
 *   - Margen comercial: 2.10 fixed (wholesaler plus service station); in reality it is free.
 *   - IVA: 16 % on the sum of everything above.
 * Each component is rounded to centavos and IVA is 16 % of their sum, so the blocks add up to the
 * pump price exactly. Retail prices are market prices (liberalized 2017–2018); the voluntary
 * agreement of about $24 per litre of regular (2025), monitored by Profeco, is marked on the ruler
 * but is not part of this arithmetic. The CNE grants the permits; it does not set retail prices.
 *
 * node scripts/conceptos/mercado-hidrocarburos.mjs [--light]
 *   →  public/conceptos/mercado-hidrocarburos(-light).html
 */
import * as k from "../../vendor/anatomy/kit/iso-kit.mjs";
import * as G from "../../vendor/anatomy/kit/lathe.mjs";
import { themeOf, labelsSvg, writeFigure } from "./_shared.mjs";

const theme = themeOf();
const WIDTH = 640;
const HEIGHT = 400;

// ---------- the model (shared with the page) ----------
const MODEL = `
const FX = 18.5, L_PER_GAL = 3.78541;
const LOGISTICA = 145, IEPS_CUOTA = 645, IEPS_OTRAS = 70, MARGEN = 210;
const REF_MIN = 1.4, REF_MAX = 3.8;
const stimulusOf = (ref) => Math.min(1, Math.max(0, (ref - 2.0) / 1.4));
function priceOf(ref) {
  const s = stimulusOf(ref);
  const mol = Math.round(ref * FX / L_PER_GAL * 100);
  const ieps = Math.round(IEPS_CUOTA * (1 - s));
  const sub = mol + LOGISTICA + ieps + IEPS_OTRAS + MARGEN;
  const iva = Math.round(sub * 0.16);
  const parts = [mol, LOGISTICA, ieps, IEPS_OTRAS, MARGEN, iva];
  return { s, parts, total: sub + iva };
}
`;
const PARTS = [
  { id: "mol", name: "Molécula (referencia internacional)", short: "Molécula", tag: "Molécula" },
  { id: "log", name: "Logística", short: "Logística", tag: "Logística" },
  { id: "ieps", name: "IEPS: cuota federal menos el estímulo", short: "IEPS", tag: "IEPS (cuota)" },
  { id: "otr", name: "Otras cuotas IEPS (a entidades y carbono)", short: "Otras IEPS", tag: "Otras cuotas IEPS" },
  { id: "mar", name: "Margen comercial", short: "Margen", tag: "Margen comercial" },
  { id: "iva", name: "IVA 16 %", short: "IVA", tag: "IVA 16 %" },
];

// ---------- world ----------
const PLATE = { x: -172, y: -56, w: 254, d: 112, r: 8 };
const PLATE_H = 8;
const FOOT_H = 5;
const ISLAND = { x: -104, y: -30, w: 88, d: 58, r: 6 };
const ISLAND_H = 6;
const CAB = { x: -82, y: -13, w: 44, d: 24, r: 2 };
const CAB_Z = [ISLAND_H + 3, 50];
const HEAD = { x: -85, y: -15, w: 50, d: 28, r: 2.5 };
const HEAD_Z = [50, 86];
const FRONT = HEAD.y + HEAD.d; // the face that carries the display (+y)
const WIN = { x0: -79, x1: -41, z0: 64, z1: 79, r: 1.6, depth: 1.6 };
const BARREL = [-150, -8];
const BARREL_R = 14;
const BARREL_H = 40;
const PIPE_Y = -8;
const PIPE_Z = 13;
const PIPE_X = [BARREL[0] + BARREL_R - 1, ISLAND.x];
const COL = { x: 34, y: -13, w: 26, d: 26, r: 1 };
const COL_Z0 = 9;
const PESO = 3; // world units per peso
const POST = { x: 16, y: -4, w: 7, d: 8, r: 0.3 };
const POST_TOP = COL_Z0 + 28 * PESO + 3;
const RULE_Y = POST.y + POST.d; // the ruler's face (+y)
const RULE_X = POST.x + POST.w; // ticks hang from this edge

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [HEAD.x, HEAD.y, HEAD_Z[1] + 6], [HEAD.x + HEAD.w, HEAD.y + HEAD.d, HEAD_Z[1] + 6], [POST.x, POST.y, POST_TOP + 2], [COL.x + COL.w, COL.y + COL.d, POST_TOP], [112, -40, 60]],
  WIDTH,
  HEIGHT,
  { pad: 22, azimuth: 55, elevation: 33 },
);
const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
const planeOf = (y) => k.sideMatrix([0, y], 0, P, "left");
const flat = (x0, z0, x1, z1, r, steps = 6) => k.pathOf(k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, steps).map(([u, z]) => [u, -z]), true);

// A rounded opening in a +y face, with its inner walls, clipped to itself (desk-computer recipe).
let clips = 0;
function recess({ x0, x1, z0, z1, r, depth }, y, back = "", backClass = "cf-screen") {
  const id = `mh-clip-${clips++}`;
  const ring = k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, 6);
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const { sinA } = k.cameraOf(P);
  const tops = [];
  const sides = [[], [], [], []];
  ring.forEach(([ax, az], index) => {
    const [bx, bz] = ring[(index + 1) % ring.length];
    const length = Math.hypot(bx - ax, bz - az) || 1;
    let [nx, nz] = [(bz - az) / length, -(bx - ax) / length];
    if (nx * (cx - (ax + bx) / 2) + nz * (cz - (az + bz) / 2) < 0) [nx, nz] = [-nx, -nz];
    if (nx <= 0 && nz <= 0) return;
    const quad = k.pathOf([at([ax, y, az]), at([bx, y, bz]), at([bx, y - depth, bz]), at([ax, y - depth, az])], true);
    if (nz >= nx) tops.push(quad);
    else sides[Math.min(3, Math.max(0, Math.floor(((nx * -sinA + 1) / 2) * 4)))].push(quad);
  });
  const shape = flat(x0, z0, x1, z1, r);
  return [
    `<clipPath id="${id}"><path transform="${planeOf(y)}" d="${shape}"/></clipPath>`,
    `<g clip-path="url(#${id})">`,
    `<path class="iso-top" d="${tops.join("")}"/>`,
    ...sides.map((d, shade) => (d.length ? `<path class="iso-shade" data-shade="${shade}" d="${d.join("")}"/>` : "")),
    `<g transform="${planeOf(y - depth)}"><path class="${backClass}" d="${shape}"/>${back}<path class="iso-line" data-tone="faint" d="${shape}"/></g>`,
    `</g>`,
    `<g transform="${planeOf(y)}"><path class="iso-line" data-tone="lo" d="${shape}"/></g>`,
  ].join("");
}

// ---------- base ----------
function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 20))) {
    out.push(S(k.cylinder(x, y, 6.5, -PLATE_H - FOOT_H, 1.6, P, 26), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 26), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 9);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // Label plate at the front left, rule lines standing for text.
  const label = { x: PLATE.x + 16, y: PLATE.y + PLATE.d - 16, w: 34, d: 9, r: 1.2 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  out.push(L([26, 18].map((w, i) => k.lineOnTop([label.x + 4, label.y + 3 + i * 3], [label.x + 4 + w, label.y + 3 + i * 3], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + label.w - 3, label.y + label.d / 2, 0.8])], { size: 0.45 }));
  return out.join("");
}

// ---------- the origin: a barrel and a pipeline stub with a gate valve ----------
function barrel() {
  const [x, y] = BARREL;
  const out = [];
  out.push(S(k.cylinder(x, y, BARREL_R + 2, 0, 1.6, P, 40), { tone: "lo" }));
  // The drum in segments with two rolling hoops standing proud of it, painted bottom to top.
  const cuts = [1.6, 8, 9.6, 35, 36.6, 1.6 + BARREL_H];
  for (let i = 0; i < cuts.length - 1; i++) {
    const hoop = i % 2 === 1;
    const inner = !hoop && i === 2 ? L([18, 26].map((z) => k.sideArc(x, y, BARREL_R, z, P, 28)).join(""), { tone: "faint" }) : "";
    out.push(S(k.cylinder(x, y, BARREL_R + (hoop ? 0.7 : 0), cuts[i], cuts[i + 1] - cuts[i], P, 48, i === cuts.length - 2 ? 0.6 : 0), { tone: "mid", crease: "none", inner }));
  }
  const top = 1.6 + BARREL_H;
  out.push(L(k.ring(x, y, BARREL_R - 2, top, P, 40), { tone: "lo" }));
  out.push(S(k.cylinder(x + 5, y - 4, 2.4, top, 1.6, P, 18), { tone: "mid" }));
  out.push(D([at([x + 5, y - 4, top + 1.6])], { size: 0.5, tone: "lo" }));
  out.push(S(k.cylinder(x - 6, y + 3, 1.4, top, 1, P, 14), { tone: "mid" }));
  return out.join("");
}
function pipeline() {
  const out = [];
  const F = G.frameAlong([PIPE_X[0], PIPE_Y, PIPE_Z], [1, 0, 0]);
  const len = PIPE_X[1] - PIPE_X[0];
  // Saddle support under the pipe.
  out.push(S(k.slabOf({ x: -126, y: PIPE_Y - 5, w: 6, d: 10, r: 0.8 }, 0, PIPE_Z - 4, P, 3, 0.4), { tone: "mid" }));
  out.push(S(G.disc(0, len, 3.6, F, P), { tone: "mid" }));
  // Flanges at the barrel, either side of the valve and at the island.
  for (const s of [0, 12, 22, len - 1.6]) out.push(S(G.disc(s, s + 1.6, 5.6, F, P), { tone: "mid" }));
  // Gate valve body between the two middle flanges, with stem and handwheel.
  out.push(S(G.disc(13.6, 22, 5, F, P), { tone: "mid" }));
  const vx = PIPE_X[0] + 17.8;
  out.push(S(k.cylinder(vx, PIPE_Y, 1, PIPE_Z + 4.6, 9, P, 12), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(vx, PIPE_Y, 6, PIPE_Z + 13.6, 1.4, P, 32), { tone: "mid" }));
  out.push(L(k.ring(vx, PIPE_Y, 4.2, PIPE_Z + 15, P, 28), { tone: "lo" }));
  out.push(D([at([vx, PIPE_Y, PIPE_Z + 15])], { size: 0.6, tone: "hi" }));
  return out.join("");
}

// ---------- the island and the dispenser ----------
function island() {
  const out = [];
  out.push(S(k.slabOf(ISLAND, 0, ISLAND_H, P, 6, 0.8), { tone: "mid", inner: L(k.sideSeam(ISLAND, 2.2, P, 6), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(ISLAND, 3), ISLAND_H, P), { tone: "faint" }));
  const pad = { x: CAB.x - 3, y: CAB.y - 2, w: CAB.w + 6, d: CAB.d + 4, r: 1.4 };
  out.push(S(k.slabOf(pad, ISLAND_H, 3, P, 3, 0.4), { tone: "lo" }));
  out.push(D(k.corners(pad, 1.6).map(([x, y]) => at([x, y, ISLAND_H + 3])), { size: 0.4 }));
  return out.join("");
}
function bollard(x, y) {
  const out = [];
  out.push(S(k.cylinder(x, y, 3.6, ISLAND_H, 1, P, 20), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, 2.6, ISLAND_H + 1, 20, P, 20, 0), { tone: "mid", crease: "none", inner: L([ISLAND_H + 12, ISLAND_H + 15].map((z) => k.sideArc(x, y, 2.6, z, P, 12)).join(""), { tone: "lo" }) }));
  out.push(S(G.sphereOf([x, y, ISLAND_H + 21], 2.6, P), { tone: "mid" }));
  return out.join("");
}
function cabinet() {
  const out = [];
  const [z0, z1] = CAB_Z;
  out.push(S(k.slabOf(CAB, z0, z1 - z0, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(CAB, z0 + 4, P, 4), { tone: "faint" }) }));
  const y = CAB.y + CAB.d;
  // Two doors on the front: the joint runs the full face; a handle on each.
  out.push(L(k.segment([CAB.x + CAB.w / 2, y, z0 + 4], [CAB.x + CAB.w / 2, y, z1], P), { tone: "lo" }));
  for (const hx of [CAB.x + CAB.w / 2 - 3.6, CAB.x + CAB.w / 2 + 2.2]) out.push(S(k.slabOf({ x: hx, y, w: 1.4, d: 1, r: 0.3 }, 28, 7, P, 2), { tone: "mid", crease: "none" }));
  // Vents: closed slots on each door.
  const slots = [];
  for (let i = 0; i < 4; i++) for (const x0 of [CAB.x + 4, CAB.x + CAB.w / 2 + 4]) slots.push(flat(x0, 14 + i * 3.2, x0 + 14, 15.4 + i * 3.2, 0.7, 3));
  out.push(`<g transform="${planeOf(y)}"><path class="iso-line" data-tone="lo" d="${slots.join("")}"/></g>`);
  out.push(D([[CAB.x + 2.5, z1 - 3], [CAB.x + CAB.w - 2.5, z1 - 3], [CAB.x + 2.5, z0 + 6.5], [CAB.x + CAB.w - 2.5, z0 + 6.5]].map(([x, z]) => at([x, y, z])), { size: 0.45, tone: "lo" }));
  return out.join("");
}
// Nozzle boot on the +x side of the cabinet, with the nozzle resting in it.
const BOOT = { x: CAB.x + CAB.w, y: -5, w: 5, d: 10, r: 0.8 };
function boot() {
  const out = [];
  out.push(S(k.slabOf(BOOT, 30, 12, P, 3, 0.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(BOOT, 1), 42, P, 3), { tone: "lo" }));
  return out.join("");
}
// The nozzle hangs in its boot: spout inside, grip below with the trigger guard, ferrule at the
// grip's end where the hose comes in.
const NOZ_X = BOOT.x + BOOT.w / 2;
function nozzle() {
  const out = [];
  out.push(S(k.slabOf({ x: NOZ_X - 1.7, y: -3, w: 3.4, d: 6, r: 1.2 }, 22, 8, P, 3, 0.4), { tone: "hi", crease: "lo" }));
  out.push(S(k.slabOf({ x: NOZ_X - 0.7, y: 3, w: 1.4, d: 2.4, r: 0.5 }, 23.5, 5, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(NOZ_X, 0, 2, 18.6, 3.4, P, 18), { tone: "mid" }));
  return out.join("");
}
// The hose: from the ferrule it sags in a loop and rises to the swivel on the head's side.
const SWIVEL = [HEAD.x + HEAD.w + 3.4, 2, 70];
function hosePath() {
  const a = [NOZ_X, 0, 18.6], b = [NOZ_X + 2, 1, -1], c = [SWIVEL[0] + 24, 3, 62], d = SWIVEL;
  const pts = [];
  for (let i = 0; i <= 32; i++) {
    const t = i / 32, u = 1 - t;
    pts.push(at([0, 1, 2].map((j) => u * u * u * a[j] + 3 * u * u * t * b[j] + 3 * u * t * t * c[j] + t * t * t * d[j])));
  }
  return k.pathOf(pts);
}
const hose = () => { const d = hosePath(); return `<path class="mh-hose-edge" d="${d}"/><path class="mh-hose" d="${d}"/>`; };
function swivel() {
  const F = G.frameAlong([HEAD.x + HEAD.w, SWIVEL[1], SWIVEL[2]], [1, 0, 0]);
  return S(G.disc(0, 3.4, 2.4, F, P), { tone: "mid" }) + S(G.disc(2.2, 3.4, 2.9, F, P), { tone: "mid" });
}
function head() {
  const out = [];
  const [z0, z1] = HEAD_Z;
  out.push(S(k.slabOf(HEAD, z0, z1 - z0, P, 4, 0.8), { tone: "hi", crease: "lo", inner: L(k.sideSeam(HEAD, z0 + 4, P, 4), { tone: "faint" }) }));
  // The price display, drawn in the plane of the front face and clipped to its window.
  const cx = (WIN.x0 + WIN.x1) / 2;
  const screen = [
    `<path class="mh-scan" d="${Array.from({ length: 7 }, (_, i) => `M${WIN.x0} ${-(WIN.z0 + 1.2 + i * 2)}H${WIN.x1}`).join("")}"/>`,
    `<text class="mh-digits" data-part="price" x="${cx + 3}" y="${-(WIN.z0 + 3.4)}" font-size="8.6" text-anchor="middle">23.63</text>`,
    `<text class="mh-unit" x="${WIN.x0 + 2}" y="${-(WIN.z0 + 3.4)}" font-size="4.2">$</text>`,
    `<text class="mh-unit" x="${WIN.x1 - 1.6}" y="${-(WIN.z1 - 4.2)}" font-size="2.6" text-anchor="end">/L</text>`,
    `<text class="mh-unit" x="${WIN.x0 + 2}" y="${-(WIN.z1 - 4.2)}" font-size="2.6">PRECIO</text>`,
  ].join("");
  out.push(recess(WIN, FRONT, screen));
  // Engraved grade label under the window, on its own little plate.
  out.push(`<g transform="${planeOf(FRONT)}"><path class="iso-line" data-tone="lo" d="${flat(-72, 56, -48, 61, 0.8, 3)}"/><text class="iso-face-text" data-tone="mid" x="-60" y="-57.4" font-size="3" text-anchor="middle">REGULAR</text></g>`);
  out.push(D([[HEAD.x + 2.6, z1 - 2.6], [HEAD.x + HEAD.w - 2.6, z1 - 2.6], [HEAD.x + 2.6, z0 + 2.6], [HEAD.x + HEAD.w - 2.6, z0 + 2.6]].map(([x, z]) => at([x, FRONT, z])), { size: 0.45, tone: "lo" }));
  // Crown on top with its seam.
  const crown = k.insetPlan(HEAD, 2);
  out.push(S(k.slabOf(crown, z1, 4, P, 4, 0.5), { tone: "mid", inner: L(k.sideSeam(crown, z1 + 2, P, 4), { tone: "faint" }) }));
  return out.join("");
}

// ---------- the measuring column ----------
function columnBase() {
  const out = [];
  const plinth = { x: 8, y: -22, w: 60, d: 44, r: 3 };
  out.push(S(k.slabOf(plinth, 0, 5, P, 5, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(plinth, 3), 5, P), { tone: "faint" }));
  out.push(D(k.corners(plinth, 1.6).map(([x, y]) => at([x, y, 5])), { size: 0.45 }));
  // The tray the blocks stand on.
  const tray = { x: COL.x - 3, y: COL.y - 3, w: COL.w + 6, d: COL.d + 6, r: 1.6 };
  out.push(S(k.slabOf(tray, 5, COL_Z0 - 5, P, 4, 0.5), { tone: "mid" }));
  out.push(D(k.corners(tray, 1.4).map(([x, y]) => at([x, y, COL_Z0])), { size: 0.4 }));
  // Post foot.
  out.push(S(k.slabOf({ x: POST.x - 2, y: POST.y - 2, w: POST.w + 4, d: POST.d + 4, r: 1 }, 5, 3, P, 3, 0.4), { tone: "mid" }));
  return out.join("");
}
function ruler() {
  const out = [];
  out.push(S(k.slabOf(POST, 8, POST_TOP - 8, P, 2, 0.4), { tone: "mid" }));
  const minor = [], major = [];
  for (let p = 0; p <= 28; p++) {
    const z = COL_Z0 + p * PESO;
    (p % 5 === 0 ? major : minor).push(k.segment([RULE_X - 1, RULE_Y, z], [RULE_X - 1 - (p % 5 === 0 ? 3.4 : 1.8), RULE_Y, z], P));
  }
  // The rule line the ticks hang from, running the full height of the face.
  out.push(L(k.segment([RULE_X - 1, RULE_Y, 8], [RULE_X - 1, RULE_Y, POST_TOP], P), { tone: "lo" }));
  out.push(L(minor.join(""), { tone: "lo" }), L(major.join(""), { tone: "mid" }));
  // The $24 reference of the voluntary agreement: a red mark across the full face.
  const z24 = COL_Z0 + 24 * PESO;
  out.push(L(k.segment([RULE_X - 1, RULE_Y, z24], [POST.x + POST.r, RULE_Y, z24], P), { tone: "red", className: "mh-cap" }));
  const nums = [0, 5, 10, 15, 20, 25].map((p) => `<text class="iso-face-text" data-tone="mid" x="${POST.x + 0.6}" y="${-(COL_Z0 + p * PESO - 1)}" font-size="2.6">${p}</text>`).join("");
  out.push(`<g transform="${planeOf(RULE_Y)}">${nums}</g>`);
  out.push(S(k.slabOf(k.insetPlan(POST, -0.6), POST_TOP, 1.4, P, 2, 0.3), { tone: "mid" }));
  return out.join("");
}

// ---------- labels ----------
const LABELS = [
  { n: 1, name: "Referencia internacional", anchor: [BARREL[0] + 5, BARREL[1] - 4, BARREL_H + 3.2], dx: -1, dy: -44 },
  { n: 2, name: "Importación y logística", anchor: [PIPE_X[0] + 17.8, PIPE_Y, PIPE_Z + 15], dx: -13, dy: 173 },
  { n: 3, name: "Precio en la bomba", anchor: [WIN.x1 - 4, FRONT, WIN.z1 + 3.5], dx: 44, dy: -50 },
  { n: 4, name: "Regla en $/litro", anchor: [POST.x + POST.w / 2, POST.y + POST.d / 2, POST_TOP + 1.4], dx: 14, dy: -24 },
];

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Maqueta: un barril y un ducto con válvula llegan a la isla de una gasolinera con su dispensario, que muestra el precio por litro. Junto a ella, una columna de bloques sobre una regla en pesos por litro: cada bloque es una parte del precio (molécula, logística, IEPS, otras cuotas, margen e IVA). Cifras ilustrativas.",
  body: [
    base(),
    barrel(),
    pipeline(),
    island(),
    bollard(ISLAND.x + 7, ISLAND.y + 8),
    cabinet(),
    boot(),
    head(),
    hose(),
    nozzle(),
    swivel(),
    bollard(ISLAND.x + ISLAND.w - 7, ISLAND.y + ISLAND.d - 8),
    columnBase(),
    ruler(),
    `<g data-part="stack"></g>`,
    `<g data-part="cursor"></g>`,
    `<g data-part="values"></g>`,
    `<g data-part="labels">${labelsSvg(LABELS, at)}</g>`,
  ],
});

const live = `
${MODEL}
const P = ${JSON.stringify(P)};
const COL = ${JSON.stringify(COL)}, COL_Z0 = ${COL_Z0}, PESO = ${PESO}, POST = ${JSON.stringify(POST)};
const IDS = ${JSON.stringify(PARTS.map((p) => p.id))};
const NAMES = ${JSON.stringify(PARTS.map((p) => p.tag))};
const SHORT = ${JSON.stringify(PARTS.map((p) => p.short))};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const stackEl = svg.querySelector('[data-part="stack"]');
const cursorEl = svg.querySelector('[data-part="cursor"]');
const valuesEl = svg.querySelector('[data-part="values"]');
const priceEl = svg.querySelector('[data-part="price"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const peso = (c) => (c / 100).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd = (v) => v.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const at = (p) => iso(p, P);
let ref = 2.2, target = 2.2, last = 0, clock = 0, frame = 0, touring = true, visible = false, idle = 0, shown = "";
const tourAt = (t) => REF_MIN + (REF_MAX - REF_MIN) * (0.5 - 0.5 * Math.cos(t * 0.28));
// Value tags beside the blocks: spread so they never touch, each with a leader to its block.
function valuesSvg(spans, parts) {
  const xFace = COL.x + COL.w, yMid = COL.y + COL.d * 0.5;
  const gap = compact ? 28 : 19;
  const items = spans.map(([z0, z1], i) => ({ i, anchor: at([xFace, yMid, (z0 + z1) / 2]), show: z1 - z0 > 0.05 || IDS[i] === "ieps" })).filter((it) => it.show);
  // Top to bottom: push each tag down to clear the one above, then back up from the lowest anchor.
  items.sort((a, b) => a.anchor[1] - b.anchor[1]);
  items.forEach((it, n) => { it.y = n ? Math.max(it.anchor[1], items[n - 1].y + gap) : it.anchor[1]; });
  const floor = items.length ? items[items.length - 1].anchor[1] + gap * 0.5 : 0;
  for (let n = items.length - 1; n >= 0; n--) { const limit = n === items.length - 1 ? floor : items[n + 1].y - gap; if (items[n].y > limit) items[n].y = limit; }
  const x0 = at([xFace, COL.y, COL_Z0])[0] + (compact ? 16 : 18);
  return items.map((it) => {
    const label = compact ? "$" + peso(parts[it.i]) : NAMES[it.i] + " $" + peso(parts[it.i]);
    const w = (compact ? 20 : 22) + label.length * (compact ? 8.6 : 5.3);
    const ty = it.y;
    const [ax, ay] = it.anchor;
    return '<g class="mh-tag">' +
      '<path class="cf-leader" d="M' + ax.toFixed(1) + " " + ay.toFixed(1) + "L" + (x0 - 6).toFixed(1) + " " + ty.toFixed(1) + "H" + x0.toFixed(1) + '"/>' +
      '<circle class="cf-anchor" cx="' + ax.toFixed(1) + '" cy="' + ay.toFixed(1) + '" r="1.6"/>' +
      '<rect class="cf-tag" x="' + x0.toFixed(1) + '" y="' + (ty - (compact ? 13 : 9)).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + (compact ? 26 : 18) + '" rx="' + (compact ? 13 : 9) + '"/>' +
      '<circle class="mh-key mh-k-' + IDS[it.i] + '" cx="' + (x0 + (compact ? 12 : 9)).toFixed(1) + '" cy="' + ty.toFixed(1) + '" r="' + (compact ? 5.6 : 3.6) + '"/>' +
      '<text class="cf-name mh-val" x="' + (x0 + (compact ? 22 : 16)).toFixed(1) + '" y="' + (ty + (compact ? 5.4 : 3.4)).toFixed(1) + '">' + label + "</text></g>";
  }).join("");
}
function draw() {
  const { s, parts, total } = priceOf(ref);
  const key = parts.join(",") + (compact ? "c" : "");
  if (key !== shown) {
    shown = key;
    let z = COL_Z0;
    const spans = [];
    let blocks = "";
    parts.forEach((c, i) => {
      const h = (c / 100) * PESO;
      spans.push([z, z + h]);
      if (h > 0.05) blocks += solidSvg(slabOf(COL, z, h, P, 3, Math.min(0.4, h / 3)), { tone: "hi", crease: "lo", className: "mh-b mh-b-" + IDS[i] });
      z += h;
    });
    stackEl.innerHTML = blocks;
    // The cursor on the ruler reads the top of the stack: the pump price.
    const cz = z;
    const slider = { x: POST.x + POST.w, y: POST.y + 1, w: 4, d: POST.d - 2, r: 0.6 };
    cursorEl.innerHTML = solidSvg(slabOf(slider, cz - 1.6, 3.2, P, 2, 0.3), { tone: "mid" }) +
      '<path class="iso-line mh-index" data-tone="lit" d="' + pathOf([at([slider.x + slider.w, POST.y + POST.d / 2, cz]), at([COL.x, POST.y + POST.d / 2, cz])]) + '"/>' +
      dotsSvg([at([slider.x + slider.w / 2, POST.y + POST.d / 2, cz + 1.6]), at([slider.x + slider.w, POST.y + POST.d / 2, cz])], { size: 0.5, tone: "hi" });
    valuesEl.innerHTML = valuesSvg(spans, parts);
    priceEl.textContent = peso(total);
  }
  const text = compact
    ? usd(ref) + " USD/gal · estímulo IEPS " + Math.round(s * 100) + " % · $" + peso(total) + "/L"
    : "Referencia " + usd(ref) + " USD/galón · estímulo al IEPS " + Math.round(s * 100) + " % · precio al público $" + peso(total) + " por litro";
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(Math.round(ref * 100) / 100));
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) { clock += dt; target = tourAt(clock); }
  ref = ref + (target - ref) * (1 - Math.exp(-dt / 0.4));
  draw();
  frame = visible && !still.matches && (touring || Math.abs(target - ref) > 0.0005) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => { touring = false; target = clamp(next, REF_MIN, REF_MAX); clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; clock = Math.acos(clamp(1 - 2 * (target - REF_MIN) / (REF_MAX - REF_MIN), -1, 1)) / 0.28; run(); }, 4000); if (still.matches) { ref = target; draw(); } run(); };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (event) => { const box = svg.getBoundingClientRect(); steer(REF_MIN + clamp((event.clientX - box.left) / box.width, 0, 1) * (REF_MAX - REF_MIN)); });
stage.addEventListener("keydown", (event) => {
  const step = event.key === "ArrowRight" || event.key === "ArrowUp" ? 0.1 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -0.1 : 0;
  if (event.key === "Home") { event.preventDefault(); steer(REF_MIN); return; }
  if (event.key === "End") { event.preventDefault(); steer(REF_MAX); return; }
  if (!step) return;
  event.preventDefault();
  steer(Math.round((target + step) * 10) / 10);
});
draw();
`;

const C = theme === "light"
  ? { mol: "#b08a33", log: "#2f7a69", ieps: "#9B2247", otr: "#8a6fb0", mar: "#4f7392", iva: "#8d847a", hose: "#4a4044", hoseEdge: "#231c1f", digits: "#7ff0c6" }
  : { mol: "#e2b85a", log: "#6fc2ae", ieps: "#ea8aa8", otr: "#c4a7e7", mar: "#9bbbd6", iva: "#c4bab0", hose: "#4d4347", hoseEdge: "#151112", digits: "#7ff0c6" };
const blockCss = PARTS.map(({ id }) => {
  const c = C[id];
  return `.mh-b-${id} .iso-fill,.mh-b-${id} .iso-top{fill:color-mix(in srgb,${c} 78%,white)}.mh-b-${id} .iso-shade[data-shade="0"]{fill:color-mix(in srgb,${c} 80%,black)}.mh-b-${id} .iso-shade[data-shade="1"]{fill:color-mix(in srgb,${c} 88%,black)}.mh-b-${id} .iso-shade[data-shade="2"]{fill:${c}}.mh-b-${id} .iso-shade[data-shade="3"]{fill:color-mix(in srgb,${c} 92%,white)}.mh-k-${id}{fill:${c}}.iso-swatch[data-mark="${id}"] path{stroke:${c};stroke-width:5;stroke-linecap:butt}`;
}).join("");
const style = `<style>${blockCss}
.mh-hose-edge{fill:none;stroke:${C.hoseEdge};stroke-width:4.4;stroke-linecap:round}
.mh-hose{fill:none;stroke:${C.hose};stroke-width:3.2;stroke-linecap:round}
.mh-scan{fill:none;stroke:${C.digits};stroke-width:.15;opacity:.18}
.mh-digits{fill:${C.digits};font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-weight:700;letter-spacing:.02em}
.mh-unit{fill:${C.digits};opacity:.8;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-weight:600}
.mh-cap{stroke-width:1.1}
.mh-index{stroke-width:1.1}
.cf-compact .mh-val{font-size:15.5px}
</style>`;

writeFigure({
  id: "mercado-hidrocarburos",
  title: "Cómo se forma el precio de la gasolina",
  theme,
  svg: svg.replace("</svg>", `${style}</svg>`),
  live,
  plate: {
    fig: "Fig 12",
    title: "Cómo se forma el precio de la gasolina",
    hint: "Desliza para mover la referencia internacional",
    ariaLabel: "Precio de la gasolina: las flechas cambian la referencia internacional en dólares por galón",
    keys: PARTS.map(({ id, name }) => ({ mark: id, label: name })).concat([{ mark: "red", label: "Marca de $24: referencia del acuerdo voluntario" }]),
    caption: "El precio de la gasolina al público es un precio de mercado. Se arma con la molécula (lo que costaría importarla desde la Costa del Golfo de EE. UU., en dólares por galón y al tipo de cambio), la logística para traerla y almacenarla, las cuotas del IEPS, el margen del mayorista y de la estación y, al final, el 16 % de IVA sobre todo lo anterior. Cuando la referencia sube, la SHCP aplica cada semana un estímulo fiscal que reduce la cuota del IEPS y amortigua el alza; si el estímulo llega al 100 %, el aumento pasa completo. Desde 2025 hay un acuerdo voluntario para mantener la gasolina regular cerca de $24 por litro, que Profeco vigila en las estaciones. Cifras ilustrativas: tipo de cambio fijo de 18.50 pesos por dólar, logística, cuotas y margen fijos y un estímulo que en esta maqueta crece con la referencia.",
  },
});
