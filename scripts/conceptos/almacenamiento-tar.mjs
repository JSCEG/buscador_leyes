/**
 * "¿Cómo funciona?" · Terminal de Almacenamiento y Reparto (TAR), as a scale model.
 *
 * On a base: one vertical atmospheric tank with an external floating roof, inside a containment
 * dike. A cutaway window in the shell shows the roof riding on the fuel: the pontoon deck, its rim
 * seal against the shell, the support legs underneath and the rolling ladder that slides along a
 * track on the deck as the roof goes up and down. Outside: the spiral stairway, the wind girder,
 * a float level gauge, two foam chambers with their risers to foam inlets outside the dike, the
 * inlet from the poliducto with its valve, the outlet through a pump to the loading rack
 * (llenadera) where a tank truck is filled through a bottom-loading arm, a meter and a grounding
 * cable; a fire monitor and the dike's drain valve in front.
 *
 * The slider (pointer, arrows) sets the inventory. The model, stated here and in the caption:
 *   - tank: 55,000 barrels between the bottom and the maximum fill level (1 bbl = 158.987 L);
 *   - the roof floats on the fuel; below the height of its legs it lands and a vapour space opens;
 *   - the terminal sells 6,000 barrels a day, so days of autonomy = inventory / 6,000;
 *   - the minimum the SENER policy asks for, 5 days of average sales, is a red mark on the gauge;
 *   - the dike (wall height × free area inside) holds more than the whole tank; checked below.
 *
 * node scripts/conceptos/almacenamiento-tar.mjs [--light] [--audit]
 *   →  public/conceptos/almacenamiento-tar(-light).html
 */
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as k from "../../vendor/anatomy/kit/iso-kit.mjs";
import * as G from "../../vendor/anatomy/kit/lathe.mjs";
import { themeOf, labelsSvg, writeFigure } from "./_shared.mjs";

// tube.mjs and audit.mjs ship with the anatomy kit; use the vendored copy if there is one.
const HERE = dirname(fileURLToPath(import.meta.url));
const kitFile = (name) => {
  const vendored = join(HERE, "..", "..", "vendor", "anatomy", "kit", name);
  const skill = join(process.env.USERPROFILE ?? process.env.HOME ?? "", ".claude", "skills", "anatomy", "kit", name);
  return pathToFileURL(existsSync(vendored) ? vendored : skill).href;
};
const { tubePieces, tubeSvg } = await import(kitFile("tube.mjs"));
const A = await import(kitFile("audit.mjs"));

const theme = themeOf();
const WIDTH = 640;
const HEIGHT = 400;

// ---------- the model ----------
const CAPACITY_BBL = 55000;
const SALES_BBL_DAY = 6000;
const MIN_DAYS = 5;
const L_PER_BBL = 158.987;

// ---------- world ----------
const PLATE = { x: -143, y: -80, w: 236, d: 154, r: 9 };
const PLATE_H = 9;
const FOOT_H = 5;
const T = [-67, -7]; // tank centre
const R = 32; // shell radius
const ZB = 2; // tank bottom (on its ring foundation)
const H = 50; // shell top
const FILL = 42; // maximum liquid height above the bottom (maximum fill level)
const LEG = 6; // roof support legs: the roof lands when the fuel is lower than this
const DECK_T = 3.4; // pontoon deck thickness
const AZ = 58;
const FRONT = AZ; // the angle around the shell that faces the viewer
const WIN = [FRONT + 10, FRONT + 62]; // cutaway window, degrees around the shell
const WIN_Z = ZB + 1.2; // window sill
const STAIR = { from: FRONT - 12, to: FRONT - 92 }; // climbs from the front round to the right // the stairway climbs from -95° at the bottom to -10° at the top
const GIRDER_Z = H - 6;
const GAUGE_A = FRONT - 1;
const FOAM_A = [FRONT + 70, FRONT + 82];
const DIKE = { x: -134, y: -70, w: 134, d: 126, wall: 3, h: 13 };
const SLOT_X = [-47, -42]; // drain slot in the front wall

const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [T[0], T[1] - R, H + 2], [T[0] - R, T[1], H + 2], [60, -40, 50]], WIDTH, HEIGHT, { pad: 8, azimuth: AZ, elevation: 37 });
const at = (point) => k.iso(point, P);
const V = G.viewOf(P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const rad = (deg) => (deg * Math.PI) / 180;
const onShell = (deg, r, z) => [T[0] + r * Math.cos(rad(deg)), T[1] + r * Math.sin(rad(deg)), z];
const LIMBS = [FRONT - 90, FRONT + 90];

// ---------- recorder: every drawn item with its true shape, ordered by measured depth ----------
const REC = A.recorder(P);
const record = REC.solid;
const put = (name, centre, svg, shapes = [], bias = 0) => REC.put({ piece: "tar", at: centre, bias, svg, name: REC.nameFor(name), shapes });
const box = (name, plan, z, h, style = {}, { extra = "", steps = 3, bevel = 0.4, bias = 0, owner, inner } = {}) =>
  put(name, [plan.x + plan.w / 2, plan.y + plan.d / 2, z + h / 2], S(k.slabOf(plan, z, h, P, steps, bevel), { tone: "mid", ...style, inner }) + extra, [record(A.slab(plan, z, h, { name, owner }, steps))], bias);
const post = (name, x, y, r, z, h, style = {}, { extra = "", steps = 24, bias = 0, owner, inner } = {}) =>
  put(name, [x, y, z + h / 2], S(k.cylinder(x, y, r, z, h, P, steps), { tone: "mid", ...style, inner }) + extra, [record(A.cylinder(x, y, r, z, h, { name, owner }))], bias);
const prism = (name, ring, z, h, style = {}, { extra = "", bias = 0, owner, convex = true, inner } = {}) => {
  const c = ring.reduce((s, p) => [s[0] + p[0] / ring.length, s[1] + p[1] / ring.length], [0, 0]);
  put(name, [c[0], c[1], z + h / 2], S(k.extrude(ring, z, h, P, { convex }), { tone: "mid", ...style, inner }) + extra, [record(A.extruded(ring, z, h, { name, owner }))], bias);
};
const discAt = (name, F, s0, s1, r, style = {}, { extra = "", bias = 0, owner, seated, cut, inner } = {}) =>
  put(name, G.pointOf(F, (s0 + s1) / 2, 0, 0), S(G.disc(s0, s1, r, F, P), { tone: "mid", ...style, inner }) + extra, [record(A.disc(F, s0, s1, r, { name, owner, seated, cut }))], bias);
const ballAt = (name, c, r, style = {}, { owner, bias = 0 } = {}) => put(name, c, S(G.sphereOf(c, r, P), { tone: "mid", ...style }), [record(A.ball(c, r, { name, owner }))], bias);
const turned = (name, F, profile, style = {}, { extra = "", owner, bias = 0, inner } = {}) => {
  const s = profile.map(([v]) => v);
  const shape = record(A.solid(F, profile, { name, owner }));
  put(name, G.pointOf(F, (Math.min(...s) + Math.max(...s)) / 2, 0, 0), S(G.solidOf(profile, F, P), { tone: "mid", ...style, inner }) + extra, [shape], bias);
  return shape;
};

/** A pipe: filleted route, end flanges and a gate valve as collars (gaps), chunks depth-sorted. */
function pipe(name, control, r, { tone = "hi", flanges = [true, true], valve = null, maxLength = 14, cable = false, touch } = {}) {
  const id = REC.nameFor(name);
  const line = G.fillet(control, Math.max(r * 3, cable ? 3 : 4), 12, { P, tube: r });
  const total = G.pathLength(line);
  const collars = [];
  [[0, -1], [total, 1]].forEach(([along, sign], index) => {
    if (!flanges[index]) return;
    const thick = Math.max(0.9, r * 0.5);
    const tangent = G.tangentAlong(line, along);
    collars.push({ centre: G.add3(G.pointAlong(line, along), G.mul3(tangent, (-sign * thick) / 2)), tangent, radius: r * 1.6, thick, gap: sign < 0 ? [0, thick] : [total - thick, total] });
  });
  const gaps = collars.map((c) => c.gap);
  let valveAt = null;
  if (valve) {
    const along = valve * total;
    const half = r * 2.5;
    gaps.push([along - half, along + half]);
    valveAt = { half, centre: G.pointAlong(line, along), tangent: G.tangentAlong(line, along) };
  }
  REC.route(id, line, r, { owner: id, touch, gaps, limp: cable, rims: flanges.map((on) => (on ? r * 1.6 : r)), piece: "tar" });
  tubePieces(line, r, P, { maxLength, spacing: cable ? 1 : 1.6, gaps }).forEach((part, index) =>
    REC.put({ piece: "tar", at: part.mid, svg: tubeSvg(part, { tone }), name: `${id}:${index}`, route: id, chunk: index, shapes: [A.tube(part.points, part.radii)] }),
  );
  for (const c of collars) {
    const F = G.frameAlong(c.centre, c.tangent);
    const face = G.dot3(F.a, V) > 0 ? c.thick / 2 : -c.thick / 2;
    const bolts = Math.abs(G.dot3(F.a, V)) > 0.15 ? D(G.dotsOf(F, face, c.radius * 0.72, 8, P, { all: true }), { size: 0.38, tone: "mid" }) : "";
    discAt(`${id}.flange`, F, -c.thick / 2, c.thick / 2, c.radius, { tone }, { extra: bolts, owner: id, bias: 0.05 });
  }
  if (valveAt) gateValve(`${id}.valve`, valveAt, r, id);
  return { id, line, total };
}

/** Gate valve on a straight: flanged body, bonnet up, stem and handwheel. */
function gateValve(id, { centre, tangent, half }, r, owner) {
  const F = G.frameAlong(centre, tangent);
  const body = [[-half, r * 1.6], [-half + r * 0.6, r * 1.6], [-half + r * 0.6, r * 1.15], [-r * 0.9, r * 1.15], [-r * 0.9, r * 1.45], [r * 0.9, r * 1.45], [r * 0.9, r * 1.15], [half - r * 0.6, r * 1.15], [half - r * 0.6, r * 1.6], [half, r * 1.6]];
  const toward = G.dot3(F.a, V);
  const faces = Math.abs(toward) > 0.15 ? [toward > 0 ? half : -half] : [];
  turned(id, F, body, { tone: "hi" }, { owner, extra: faces.map((s) => D(G.dotsOf(F, s, r * 1.3, 8, P, { all: true }), { size: 0.36, tone: "mid" })).join("") });
  const up = [0, 0, 1];
  const B = G.frameAlong([centre[0], centre[1], centre[2] + r * 1.3], up);
  discAt(`${id}.bonnet`, B, 0, r * 1.8, r * 0.85, { tone: "hi" }, { owner, inner: L(G.arcOf(B, r * 0.9, r * 0.85, P), { tone: "faint" }) });
  discAt(`${id}.yoke`, B, r * 1.8, r * 2.3, r * 1.05, { tone: "mid" }, { owner });
  discAt(`${id}.stem`, B, r * 2.3, r * 3.7, r * 0.22, { tone: "mid" }, { owner });
  const W = G.frameAlong([centre[0], centre[1], centre[2] + r * 1.3 + r * 3.7], up);
  const top = W.o[2] + r * 0.32;
  put(`${id}.wheel`, W.o, S(G.ringBand(0, r * 0.32, r * 0.2, r * 1.55, W, P), { tone: "hi" }) + L(k.ring(W.o[0], W.o[1], r * 1.1, top, P, 32) + k.lineOnTop([W.o[0] - r * 1.1, W.o[1]], [W.o[0] + r * 1.1, W.o[1]], top, P) + k.lineOnTop([W.o[0], W.o[1] - r * 1.1], [W.o[0], W.o[1] + r * 1.1], top, P), { tone: "mid" }), [record(A.ring(W, 0, r * 0.32, r * 0.2, r * 1.55, { name: `${id}.wheel`, owner }))], 0.1);
  put(`${id}.hub`, W.o, S(G.disc(r * 0.32, r * 0.7, r * 0.35, W, P), { tone: "mid" }), [record(A.disc(W, r * 0.32, r * 0.7, r * 0.35, { name: `${id}.hub`, owner }))], 0.2);
}

// ---------- base ----------
const back = [];
back.push(`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`);
for (const [x, y] of k.corners(PLATE, 22).sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P))) {
  back.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
  back.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
}
back.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
back.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
const screws = k.corners(PLATE, 10);
back.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
back.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
record(A.slab(PLATE, -PLATE_H, PLATE_H, { name: "stand.plate" }));
// Concrete floor of the dike (a shallow inlay with its joints) and the truck lane.
const FLOOR = { x: DIKE.x + DIKE.wall, y: DIKE.y + DIKE.wall, w: DIKE.w - 2 * DIKE.wall, d: DIKE.d - 2 * DIKE.wall, r: 0.5 };
back.push(S(k.slabOf(FLOOR, 0, 0.4, P, 2), { tone: "lo", crease: "none" }));
const LANE = { x: 40, y: -58, w: 22, d: 112, r: 2 };
back.push(S(k.slabOf(LANE, 0, 0.4, P, 3), { tone: "lo", crease: "none" }));
back.push(L([-20, 0, 20].map((y) => k.lineOnTop([LANE.x, y], [LANE.x + LANE.w, y], 0.4, P)).join(""), { tone: "faint" }));
// Ruler strip along the front edge and a label plate.
const strip = { x: 4, y: PLATE.y + PLATE.d - 13, w: 60, d: 7, r: 1 };
back.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 5, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
back.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
back.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
const tag = { x: 68, y: PLATE.y + PLATE.d - 18, w: 24, d: 12, r: 1 };
back.push(S(k.slabOf(tag, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
back.push(L(k.planOutline(k.insetPlan(tag, 1.6), 0.8, P), { tone: "faint" }));
back.push(L([[3.4, 16], [6, 11], [8.6, 14]].map(([dy, w]) => k.lineOnTop([tag.x + 3, tag.y + dy], [tag.x + 3 + w, tag.y + dy], 0.8, P)).join(""), { tone: "lo", free: true }));
back.push(D([at([tag.x + 23, tag.y + 3, 0.8]), at([tag.x + 23, tag.y + 9, 0.8])], { size: 0.45 }));

// ---------- dike: four walls, a drain slot in the front one ----------
{
  const { x, y, w, d, wall, h } = DIKE;
  const capped = (name, plan) => box(name, plan, 0, h, { tone: "mid" }, { bevel: 0.5 });
  capped("dike.back", { x, y, w, d: wall, r: 0.6 });
  capped("dike.left", { x, y: y + wall, w: wall, d: d - 2 * wall, r: 0.6 });
  capped("dike.right", { x: x + w - wall, y: y + wall, w: wall, d: d - 2 * wall, r: 0.6 });
  capped("dike.front", { x, y: y + d - wall, w: SLOT_X[0] - x, d: wall, r: 0.6 });
  capped("dike.front", { x: SLOT_X[1], y: y + d - wall, w: x + w - SLOT_X[1], d: wall, r: 0.6 });
}
const DIKE_FREE = FLOOR.w * FLOOR.d - Math.PI * (R + 3) ** 2;
const DIKE_HOLD = (DIKE_FREE * (DIKE.h - 1)) / (Math.PI * R * R * FILL); // dike volume (1 unit of freeboard) / full tank
if (DIKE_HOLD < 1) throw new Error(`dike holds only ${DIKE_HOLD}`);

// ---------- tank ----------
post("tank.ring", T[0], T[1], R + 3, 0, ZB, { tone: "lo" }, { steps: 96 });
const arcPts = (r, z, a0, a1, n = 40) => Array.from({ length: n + 1 }, (_, i) => at(onShell(a0 + ((a1 - a0) * i) / n, r, z)));
const arcLine = (r, z, a0, a1, n) => k.pathOf(arcPts(r, z, a0, a1, n));
const SEAMS = [13, 24, 35];
const shellSeams = SEAMS.map((z) => [[LIMBS[0], WIN[0]], [WIN[1], LIMBS[1]]].map(([a0, a1]) => arcLine(R, z, a0, a1, 40)).join("")).join("");
const shell = S(k.cylinder(T[0], T[1], R, ZB, H - ZB, P, 128), { tone: "hi", crease: "none", inner: L(shellSeams, { tone: "faint" }) });

// The opening: the open top and the cutaway window, one clip.
const topRing = k.pathOf(Array.from({ length: 96 }, (_, i) => at(onShell((i * 360) / 96, R - 0.4, H))), true);
const windowPoly = k.pathOf([...arcPts(R + 0.05, WIN_Z, WIN[0], WIN[1]), ...arcPts(R + 0.05, H, WIN[1], WIN[0])], true);
const cavityBack = (z) => arcPts(R - 0.6, z, LIMBS[1], LIMBS[0] + 360, 60);
const innerCourses = SEAMS.map((z) => k.pathOf(cavityBack(z))).join("");
// The cut edges of the shell around the window: the two vertical cuts and the sill.
const cutFace = (deg) => k.pathOf([at(onShell(deg, R, WIN_Z)), at(onShell(deg, R, H)), at(onShell(deg, R - 1, H)), at(onShell(deg, R - 1, WIN_Z))], true);
const sill = k.pathOf([...arcPts(R, WIN_Z, WIN[0], WIN[1], 30), ...arcPts(R - 1, WIN_Z, WIN[1], WIN[0], 30)], true);

// Floating roof, built at its landed position (bottom at ZB + LEG) and moved by the page.
const ROOF_Z = ZB + LEG;
const ROOF_R = R - 2.2;
const LADDER_A = FRONT + 168; // the rolling ladder hangs from a gauger's platform at the back of the rim
const LU = [Math.cos(rad(LADDER_A)), Math.sin(rad(LADDER_A))];
const roofLegs = Array.from({ length: 12 }, (_, i) => 15 + i * 30)
  .map((deg) => [T[0] + (R - 4) * Math.cos(rad(deg)), T[1] + (R - 4) * Math.sin(rad(deg))])
  .concat(Array.from({ length: 10 }, (_, i) => 18 + i * 36).map((deg) => [T[0] + (R - 12) * Math.cos(rad(deg)), T[1] + (R - 12) * Math.sin(rad(deg))]))
  .concat([[T[0], T[1]], [T[0] + 11 * Math.cos(rad(200)), T[1] + 11 * Math.sin(rad(200))], [T[0] + 11 * Math.cos(rad(20)), T[1] + 11 * Math.sin(rad(20))]])
  .sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P))
  .map(([x, y]) => S(k.cylinder(x, y, 0.7, ZB, LEG, P, 12), { tone: "mid", crease: "none" }) + S(k.cylinder(x, y, 1.3, ZB, 0.5, P, 14), { tone: "lo", crease: "none" }))
  .join("");
const deckTop = ROOF_Z + DECK_T;
const bulkheads = Array.from({ length: 16 }, (_, i) => (i * 360) / 16).map((deg) => k.segment(onShell(deg, R - 9, deckTop), onShell(deg, ROOF_R - 0.05, deckTop), P)).join("");
const trackA = [T[0] + 15 * LU[0], T[1] + 15 * LU[1]];
const trackB = [T[0] - 13 * LU[0], T[1] - 13 * LU[1]];
const trackSide = [-LU[1] * 2, LU[0] * 2];
const trackPlan = (s) => [[trackA[0] + s * trackSide[0], trackA[1] + s * trackSide[1]], [trackB[0] + s * trackSide[0], trackB[1] + s * trackSide[1]]];
const roofDeck = [
  S(k.cylinder(T[0], T[1], R - 0.5, ROOF_Z + 0.6, 1.6, P, 128), { tone: "lo", crease: "none" }), // rim seal against the shell
  S(k.cylinder(T[0], T[1], ROOF_R, ROOF_Z, DECK_T, P, 128, 0.6), {
    tone: "hi",
    lit: true,
    inner: L(k.ring(T[0], T[1], R - 9, deckTop, P, 96), { tone: "mid" }) + L(bulkheads, { tone: "faint" }) + L(k.ring(T[0], T[1], 3, deckTop, P, 32), { tone: "lo" }),
  }),
  L([-1, 1].map((s) => k.lineOnTop(...trackPlan(s), deckTop, P)).join("") + [trackA, trackB].map(([x, y]) => k.lineOnTop([x - trackSide[0], y - trackSide[1]], [x + trackSide[0], y + trackSide[1]], deckTop, P)).join(""), { tone: "mid" }),
  D([at([T[0], T[1], deckTop])], { size: 0.7, tone: "hi" }),
].join("");

const tankSvg = [
  shell,
  `<g clip-path="url(#tar-open)"><g class="tar-in">`,
  `<path class="tar-cavity" d="${topRing}${windowPoly}"/>`,
  L(innerCourses, { tone: "faint" }),
  `<g data-part="legs">${roofLegs}</g>`,
  `<g data-part="fuel"></g>`,
  `<g data-part="roof">${roofDeck}</g>`,
  `<g data-part="ladder"></g>`,
  `</g></g>`,
  `<path class="iso-shade" data-shade="1" d="${cutFace(WIN[0])}"/><path class="iso-shade" data-shade="2" d="${cutFace(WIN[1])}"/><path class="iso-top" d="${sill}"/>`,
  L(cutFace(WIN[0]) + cutFace(WIN[1]) + sill, { tone: "hi" }),
  L(k.pathOf(arcPts(R, H, WIN[1], WIN[0] + 360, 90)) + k.pathOf(arcPts(R - 1, H, WIN[1], WIN[0] + 360, 90)), { tone: "hi" }),
].join("");
const SHELL = record(A.cylinder(T[0], T[1], R, ZB, H - ZB, { name: "tank.shell" }));
put("tank.shell", [T[0], T[1], (ZB + H) / 2], tankSvg, [SHELL]);

// Wind girder: an angle ring round the shell, cut at the window and at the stair.
const STAIR_AT = (z) => STAIR.from + ((STAIR.to - STAIR.from) * (z - ZB)) / (H - ZB);
const girderCross = STAIR_AT(GIRDER_Z + 1);
const annulus = (a0, a1, r0, r1, n = 24) => [...Array.from({ length: n + 1 }, (_, i) => onShell(a0 + ((a1 - a0) * i) / n, r1, 0)), ...Array.from({ length: n + 1 }, (_, i) => onShell(a1 - ((a1 - a0) * i) / n, r0, 0))].map(([x, y]) => [x, y]);
for (const [a0, a1] of [[LIMBS[0], girderCross - 5], [girderCross + 5, WIN[0]], [WIN[1], LIMBS[1]]].filter(([a0, a1]) => a1 - a0 > 2)) prism("tank.girder", annulus(a0, a1, R, R + 2.4), GIRDER_Z, 1.2, { tone: "mid" }, { convex: false });

// Spiral stairway: treads on a helical stringer, a landing at the top and a handrail on posts.
{
  const treads = [];
  for (let z = ZB + 3; z <= H - 2; z += 3.4) treads.push(z);
  const seen = (p) => G.dot3(G.sub3(p, [T[0], T[1], p[2]]), V) > -R * 0.25;
  treads.forEach((z) => {
    const a = STAIR_AT(z);
    prism("stair.tread", annulus(a - 2.2, a + 2.2, R + 0.05, R + 6.2, 3), z - 0.5, 0.6, { tone: "mid" });
  });
  const top = STAIR_AT(H - 1);
  prism("stair.landing", annulus(top - 2, top + 12, R + 0.05, R + 6.2, 6), H - 1.6, 0.8, { tone: "mid" });
  // Stringer: from the floor up under the treads to the landing.
  const SR = R + 4.3;
  const helix = Array.from({ length: 44 }, (_, i) => {
    const z = ZB + 1 + ((H - 3.4 - ZB - 1) * i) / 43;
    return onShell(STAIR_AT(z + 3.05), SR, z);
  });
  const first = helix[0];
  const last = helix[helix.length - 1];
  const body = helix.filter(seen);
  pipe("stair.stringer", [[first[0], first[1], 0], ...body.filter((p) => p[2] > 3), [last[0], last[1], H - 1.6]], 0.55, { tone: "mid", flanges: [false, false], maxLength: 8, cable: true });
  // Handrail: posts on every third tread, the rail on them, dropping onto the first and last seen treads.
  const RR = R + 5.7;
  const shown = treads.filter((z) => seen(onShell(STAIR_AT(z), RR, z)) && z < H - 14);
  const z0 = shown[0];
  const z1 = shown[shown.length - 1];
  const railAt = (z) => onShell(STAIR_AT(z), RR, z + 6);
  const railPts = Array.from({ length: 10 }, (_, i) => railAt(z0 + ((z1 - z0) * i) / 9));
  // The rail ends on a knob on top of each end post (rim on the ball).
  const KNOB = 0.65;
  const into = (from, toward) => G.add3(from, G.mul3(G.unit3(G.sub3(toward, from)), Math.sqrt(KNOB * KNOB - 0.4 * 0.4)));
  const route = [into(railPts[0], railPts[1]), ...railPts.slice(1, -1), into(railPts[9], railPts[8])];
  pipe("stair.rail", route, 0.4, { tone: "mid", flanges: [false, false], maxLength: 8, cable: true, touch: ["stair.post*"] });
  shown.filter((z, i) => i % 3 === 0 || z === z1).forEach((z) => {
    const p = onShell(STAIR_AT(z), RR, z + 0.1);
    const end = z === z0 || z === z1;
    post("stair.post", p[0], p[1], 0.35, z + 0.1, end ? 5.9 - KNOB + 0.05 : 5.5, { tone: "mid", crease: "none" }, { steps: 12 });
    if (end) ballAt("stair.knob", railAt(z), KNOB, { tone: "mid" });
  });
}

// Level gauge: a float gauge board on the shell, with a scale, the 5-day mark and a moving pointer.
const GAUGE = { z0: ZB + 2, z1: GIRDER_Z - 0.3 };
{
  const n = [Math.cos(rad(GAUGE_A)), Math.sin(rad(GAUGE_A))];
  const point = (r, t, z) => [T[0] + n[0] * r - n[1] * t, T[1] + n[1] * r + n[0] * t, z];
  const ring = [[R, -2.2], [R + 1.6, -2.2], [R + 1.6, 2.2], [R, 2.2]].map(([r, t]) => point(r, t, 0).slice(0, 2));
  const face = (t, z) => point(R + 1.6, t, z);
  const scaleTicks = [];
  for (let i = 0; i <= 10; i++) {
    const z = GAUGE.z0 + 2 + ((GAUGE.z1 - GAUGE.z0 - 4) * i) / 10;
    scaleTicks.push(k.segment(face(-2.2, z), face(i % 5 === 0 ? -0.2 : -1.1, z), P));
  }
  const share = (MIN_DAYS * SALES_BBL_DAY) / CAPACITY_BBL;
  const minMark = GAUGE.z0 + 2 + (GAUGE.z1 - GAUGE.z0 - 4) * share;
  const pz = GAUGE.z0 + 2;
  const pointer = k.pathOf([face(0.2, pz), face(2.2, pz - 1), face(2.2, pz + 1)].map(at), true);
  prism("gauge.board", ring, GAUGE.z0, GAUGE.z1 - GAUGE.z0, { tone: "hi", crease: "lo" }, {
    extra:
      L(scaleTicks.join(""), { tone: "mid" }) +
      `<path class="iso-line tar-min" d="${k.segment(face(-2.2, minMark), face(2.2, minMark), P)}"/>` +
      L(k.segment(face(1.2, GAUGE.z0), face(1.2, GAUGE.z1), P), { tone: "lo" }) +
      `<g data-part="pointer"><path class="tar-pointer" d="${pointer}"/></g>`,
  });
}

// Foam chambers at the rim, risers down the shell on clips, out over the front wall to inlets.
FOAM_A.forEach((deg) => {
  const c = onShell(deg, R + 4.2, 0);
  const n = [Math.cos(rad(deg)), Math.sin(rad(deg))];
  const span = (r0, r1, half, z, h, name) => {
    const ring = [[r0, -half], [r1, -half], [r1, half], [r0, half]].map(([r, t]) => [T[0] + n[0] * r - n[1] * t, T[1] + n[1] * r + n[0] * t]);
    prism(name, ring, z, h, { tone: "mid" });
  };
  post("foam.chamber", c[0], c[1], 2.4, GIRDER_Z + 1.2, 4.6, { tone: "hi" }, { inner: L(k.sideArc(c[0], c[1], 2.4, GIRDER_Z + 3.4, P, 20), { tone: "faint" }) });
  post("foam.cap", c[0], c[1], 1.4, GIRDER_Z + 5.8, 1, { tone: "mid" });
  const inletY = DIKE.y + DIKE.d + 14;
  pipe("foam.riser", [[c[0], c[1], GIRDER_Z + 1.2], [c[0], c[1], 28], [c[0], inletY, 28], [c[0], inletY, 9.6]], 1.2, { tone: "hi", flanges: [false, true], touch: ["foam.clip*"] });
  for (const z of [14, 28]) span(R, R + 3, 0.8, z, 0.8, "foam.clip");
  // Foam inlet: a post with a capped hose coupling, where a foam truck connects.
  box("foam.inlet-post", { x: c[0] - 2.2, y: inletY - 2.2, w: 4.4, d: 4.4, r: 0.5 }, 0, 9.6, { tone: "mid" });
  const F = G.frameAlong([c[0], inletY + 2.2, 6], [0, 1, 0]);
  discAt("foam.coupling", F, 0, 2, 1.3, { tone: "hi" }, { extra: L(G.circleOf(F, 2, 0.7, P, 16), { tone: "lo" }) });
});

// Shell nozzles (saddled to the shell), the inlet from the poliducto and the outlet to the pump.
const nozzle = (deg, z, r) => {
  const n = [Math.cos(rad(deg)), Math.sin(rad(deg)), 0];
  const F = G.frameAlong([T[0], T[1], z], n);
  put("tank.nozzle", G.pointOf(F, R + 1.5, 0, 0), S(G.saddleOf(F, r * 1.7, R, R + 3, P), { tone: "hi" }), [record(A.disc(F, R - 0.6, R + 3, r * 1.7, { name: "tank.nozzle", seated: true, cut: [SHELL] }))]);
  return G.pointOf(F, R + 3, 0, 0);
};
const PIPE_R = 2;
const INLET_A = FRONT - 88;
const inA = nozzle(INLET_A, ZB + 5, PIPE_R);
const inB = G.add3(inA, G.mul3([Math.cos(rad(INLET_A)), Math.sin(rad(INLET_A)), 0], 4));
const POLI = [34, -54]; // where the buried poliducto comes up
const RUN_X = 12;
pipe("inlet", [inA, inB, [-12, inB[1], inA[2]], [-12, inB[1], 20], [RUN_X, inB[1], 20], [RUN_X, POLI[1], 20], [POLI[0], POLI[1], 20], [POLI[0], POLI[1], 3]], PIPE_R, { valve: 0.13, touch: ["pipe.support*"] });
box("poliducto.pad", { x: POLI[0] - 5, y: POLI[1] - 5, w: 10, d: 10, r: 1 }, 0, 3, { tone: "lo" }, { extra: D(k.corners({ x: POLI[0] - 5, y: POLI[1] - 5, w: 10, d: 10 }, 1.4).map(([x, y]) => at([x, y, 3])), { size: 0.4 }) });
// The buried poliducto arrives at the edge of the plate under a marker post.
post("poliducto.marker", POLI[0] + 8, PLATE.y + 8, 0.8, 0, 9, { tone: "mid" }, { steps: 12 });
box("poliducto.sign", { x: POLI[0] + 7.6, y: PLATE.y + 5.4, w: 0.8, d: 5.2, r: 0.2 }, 9, 3.4, { tone: "hi" });
box("pipe.support", { x: RUN_X - 1.4, y: -40 - 1.4, w: 2.8, d: 2.8, r: 0.4 }, 0, 20 - PIPE_R, { tone: "lo" });

const OUT_Z = ZB + 5;
const outA = nozzle(0, OUT_Z, PIPE_R);
const PUMP = { x: 14, y: T[1], z: 9 };
pipe("outlet", [outA, [-12, outA[1], OUT_Z], [-12, outA[1], 20], [4, outA[1], 20], [4, outA[1], PUMP.z], [PUMP.x, outA[1], PUMP.z]], PIPE_R, { valve: 0.12, touch: ["pipe.support*"] });

// Pump: casing and motor on a skid; discharge up to the rack header.
box("pump.skid", { x: PUMP.x - 2, y: PUMP.y - 6, w: 26, d: 12, r: 1 }, 0, 2.6, { tone: "lo" }, { extra: D(k.corners({ x: PUMP.x - 2, y: PUMP.y - 6, w: 26, d: 12 }, 1.6).map(([x, y]) => at([x, y, 2.6])), { size: 0.45 }) });
{
  const F = G.frameAlong([PUMP.x, PUMP.y, PUMP.z], [1, 0, 0]);
  const CASING = turned("pump.casing", F, [[0, 3.4], [1.2, 3.4], [1.2, 6.2], [6, 6.2], [6, 3.4], [7.6, 3.4]], { tone: "hi" }, { extra: D(G.dotsOf(F, 1.2, 4.8, 10, P, { fade: [0.04, 0.42] }), { size: 0.36 }) });
  const B = G.frameAlong([PUMP.x + 3.6, PUMP.y, PUMP.z], [0, 0, 1]);
  put("pump.outlet", [PUMP.x + 3.6, PUMP.y, PUMP.z + 7.4], S(G.saddleOf(B, PIPE_R * 1.7, 6.2, 8.6, P), { tone: "hi" }), [record(A.disc(B, 5.6, 8.6, PIPE_R * 1.7, { name: "pump.outlet", seated: true, cut: [CASING] }))], 0.2);
  box("pump.foot", { x: PUMP.x + 1, y: PUMP.y - 3, w: 5, d: 6, r: 0.4 }, 2.6, PUMP.z - 6.2 - 2.6 + 0.2, { tone: "mid" });
  turned("pump.coupling", F, [[7.6, 1.6], [9.6, 1.6]], { tone: "mid" });
  turned("pump.motor", F, [[9.6, 4.6], [10.6, 4.6], [10.6, 4.9], [22, 4.9], [22, 4], [23.4, 4]], { tone: "hi" }, { extra: k.fadedSvg(G.ribsOf(F, 11.4, 21.2, 4.9, 22, P, { fade: [0.1, 0.55], seams: true }), { tone: "lo" }) });
  box("pump.motor-foot", { x: PUMP.x + 11, y: PUMP.y - 3.6, w: 10, d: 7.2, r: 0.4 }, 2.6, PUMP.z - 4.9 - 2.6 + 0.2, { tone: "mid" });
}
const RISER = [80, T[1]];
const HEADER_Z = 30; // the product header runs overhead on the rack
pipe("discharge", [[PUMP.x + 3.6, PUMP.y, PUMP.z + 8.6], [PUMP.x + 3.6, PUMP.y, HEADER_Z], [RISER[0], RISER[1], HEADER_Z], [RISER[0], RISER[1], 18.6]], PIPE_R, { valve: 0.5 });

// ---------- loading rack (llenadera) ----------
const ISLAND = { x: 73.5, y: -42, w: 13, d: 76, r: 1.5 };
box("rack.island", ISLAND, 0, 2.2, { tone: "mid" }, { bevel: 0.6, extra: L(k.planOutline(k.insetPlan(ISLAND, 1.4), 2.2, P), { tone: "faint" }) });
const COLS = [[83.5, -34], [83.5, 26]];
COLS.forEach(([x, y]) => box("rack.column", { x: x - 1.6, y: y - 1.6, w: 3.2, d: 3.2, r: 0.4 }, 2.2, 44 - 2.2, { tone: "mid" }));
const CANOPY = { x: 75, y: -44, w: 15, d: 76, r: 1.2 }; // over the island only, so the truck stays in view
box("rack.canopy", CANOPY, 44, 2.6, { tone: "mid" }, { bevel: 0.6, steps: 3, inner: L(k.sideSeam(CANOPY, 45.3, P, 3), { tone: "faint" }) });
// Meter on the riser, its register, the swivel and the bottom-loading arm to the truck's adapter.
const TRUCK = { x: 52, tankZ: 17, tankR: 8, y0: -36, y1: 22 };
const ADAPTER = { x: TRUCK.x + 6.5, y: T[1] - 3, w: 3.6, d: 6, r: 0.5 };
{
  const F = G.frameAlong([RISER[0], RISER[1], 11], [0, 0, 1]);
  turned("rack.meter", F, [[0, 2.6], [0.8, 2.6], [0.8, 3.0], [6.8, 3.0], [6.8, 3.4], [7.6, 3.4]], { tone: "hi" }, { inner: L(G.arcOf(F, 3.8, 3.4, P), { tone: "faint" }) });
  const reg = { x: RISER[0] + 2.9, y: RISER[1] - 2, w: 3, d: 4, r: 0.5 };
  box("rack.register", reg, 13, 4, { tone: "hi" }, { extra: L(k.ring(reg.x + 1.5, reg.y + 2, 1.2, 17, P, 20), { tone: "lo" }) + D([at([reg.x + 1.5, reg.y + 2, 17])], { size: 0.4, tone: "hi" }) });
  ballAt("rack.swivel", [RISER[0], RISER[1], 9], 2, { tone: "hi" });
  box("rack.riser-stand", { x: RISER[0] - 1.2, y: RISER[1] - 1.2, w: 2.4, d: 2.4, r: 0.4 }, 2.2, 9 - 2 - 2.2 + 0.2, { tone: "mid" });
  const start = [RISER[0] - Math.sqrt(4 - 1.4 * 1.4), RISER[1], 9];
  pipe("rack.arm", [start, [ADAPTER.x + ADAPTER.w, RISER[1], 9]], 1.4, { tone: "hi", flanges: [false, true] });
}
// Grounding: a monitor box on the column, cable to a clamp on the truck chassis.
box("rack.ground-box", { x: COLS[0][0] - 1.6 - 2.6, y: -36, w: 2.6, d: 4, r: 0.4 }, 12, 6, { tone: "hi" }, { extra: D([at([COLS[0][0] - 1.6 - 1.3, -32, 16])], { size: 0.6, tone: "hi" }) });
pipe("rack.ground", [[COLS[0][0] - 1.6 - 2.6, -34, 13.4], [COLS[0][0] - 9, -34, 13.4], [TRUCK.x + 10, -14, 6], [TRUCK.x + 6.5, -14, 6]], 0.45, { tone: "mid", flanges: [false, false], cable: true });

// ---------- tank truck (autotanque) ----------
{
  const chassis = { x: TRUCK.x - 6.5, y: -40, w: 13, d: 80, r: 1 };
  box("truck.chassis", chassis, 5, 2.2, { tone: "lo" });
  box("truck.adapter", ADAPTER, 6.2, 5.4, { tone: "mid" });
  [-30, -6, 16].forEach((y) => box("truck.saddle", { x: TRUCK.x - 5, y: y - 1.5, w: 10, d: 3, r: 0.4 }, 7.2, TRUCK.tankZ - TRUCK.tankR - 7.2 + 0.3, { tone: "mid" }));
  const F = G.frameAlong([TRUCK.x, TRUCK.y0, TRUCK.tankZ], [0, 1, 0]);
  const len = TRUCK.y1 - TRUCK.y0;
  const head = 3.2;
  const radius = (s) => (s < head ? TRUCK.tankR * Math.sqrt(Math.max(0, 1 - ((head - s) / head) ** 2)) : s > len - head ? TRUCK.tankR * Math.sqrt(Math.max(0, 1 - ((s - len + head) / head) ** 2)) : TRUCK.tankR);
  const knots = [...Array.from({ length: 13 }, (_, i) => 0.02 + (head - 0.02) * Math.sin((i / 12) * Math.PI / 2) ** 2), ...Array.from({ length: 13 }, (_, i) => len - head + (head - 0.02) * (1 - Math.cos((i / 12) * Math.PI / 2) ** 2))];
  const meridian = [[0.02, 0], ...knots.map((s) => [s, radius(s), 1]), [len - 0.02, 0]];
  const slope = (s) => (radius(Math.min(len - 0.02, s + 0.01)) - radius(Math.max(0.02, s - 0.01))) / 0.02;
  const paths = G.lathe(meridian, F, P, { smooth: { slope, radius } });
  const seams = [len * 0.34, len * 0.67].map((s) => G.arcOf(F, s, TRUCK.tankR, P)).join("");
  put("truck.tank", [TRUCK.x, (TRUCK.y0 + TRUCK.y1) / 2, TRUCK.tankZ], S(paths, { tone: "hi", inner: L(seams, { tone: "faint" }) }), [record(A.lathe(F, meridian, { name: "truck.tank", radius }))]);
  [-26, -9, 8].forEach((y) => post("truck.hatch", TRUCK.x, y, 2.4, TRUCK.tankZ + TRUCK.tankR - 0.4, 1.4, { tone: "mid" }, { extra: L(k.ring(TRUCK.x, y, 1.4, TRUCK.tankZ + TRUCK.tankR + 1, P, 20), { tone: "lo" }) }));
  // Cab.
  const cab = { x: TRUCK.x - 6.5, y: 26, w: 13, d: 14, r: 1.6 };
  box("truck.cab", cab, 7.2, 14, { tone: "hi" }, { steps: 4, bevel: 0.6, inner: L(k.sideSeam(cab, 13, P, 4), { tone: "faint" }) });
  box("truck.windscreen", { x: cab.x + 1.4, y: cab.y + cab.d, w: cab.w - 2.8, d: 0.5, r: 0.2 }, 14.4, 5.4, { tone: "lo" }, { steps: 2 });
  box("truck.bumper", { x: cab.x - 0.4, y: cab.y + cab.d, w: cab.w + 0.8, d: 1.4, r: 0.4 }, 5, 2.4, { tone: "mid" });
  box("truck.door", { x: cab.x + cab.w, y: cab.y + 2, w: 0.4, d: 7, r: 0.1 }, 9, 9, { tone: "mid" }, { steps: 2 });
  // Wheels: axle pairs on both sides.
  [-31, -21.6, 28, 37.4].forEach((y) =>
    [TRUCK.x - 6.5 - 2.4, TRUCK.x + 6.5].forEach((x) => {
      const W = G.frameAlong([x, y, 4.4], [1, 0, 0]);
      const outer = x > TRUCK.x ? 2.4 : 0;
      discAt("truck.tyre", W, 0, 2.4, 4.4, { tone: "lo" }, { extra: L(G.circleOf(W, outer, 2.6, P, 24), { tone: "mid" }) + D([at(G.pointOf(W, outer, 0, 0))], { size: 0.6, tone: "mid" }) });
    }),
  );
}

// ---------- fire protection and the dike drain ----------
const MONITOR = [-10, PLATE.y + PLATE.d - 12];
{
  const M = MONITOR;
  post("fire.hydrant", M[0], M[1], 2, 0, 12, { tone: "mid" }, { inner: L(k.sideArc(M[0], M[1], 2, 3, P, 16), { tone: "faint" }) });
  post("fire.hydrant-cap", M[0], M[1], 2.6, 12, 1.4, { tone: "hi" });
  const F = G.frameAlong([M[0] + 2, M[1], 6], [1, 0, 0]);
  discAt("fire.outlet", F, 0, 1.8, 1.1, { tone: "hi" }, { extra: L(G.circleOf(F, 1.8, 0.6, P, 12), { tone: "lo" }) });
  post("fire.monitor-base", M[0], M[1], 1.2, 13.4, 1.4, { tone: "mid" });
  const aim = G.unit3(G.sub3([T[0], T[1], H], [M[0], M[1], 16]));
  ballAt("fire.monitor-joint", [M[0], M[1], 16.4], 1.6, { tone: "hi" });
  turned("fire.monitor", G.frameAlong([M[0], M[1], 16.4], aim), [[1.2, 1.1], [3, 1.1], [3, 0.9], [8.5, 0.55], [8.5, 0.8], [9.6, 0.8]], { tone: "hi" });
  // Drain: sump inside the dike, pipe through the slot in the front wall, valve outside, to a pit.
  const yWall = DIKE.y + DIKE.d - DIKE.wall;
  const X = (SLOT_X[0] + SLOT_X[1]) / 2;
  box("dike.sump", { x: X - 3, y: yWall - 14, w: 6, d: 5, r: 0.5 }, 0, 2.2, { tone: "lo" }, { extra: L([1, 2, 3, 4, 5].map((i) => k.lineOnTop([X - 3 + i, yWall - 14], [X - 3 + i, yWall - 9], 2.2, P)).join(""), { tone: "faint" }) });
  const pit = { x: X - 4, y: yWall + DIKE.wall + 14, w: 8, d: 7, r: 0.8 };
  box("dike.pit", pit, 0, 2.4, { tone: "lo" }, { extra: L(k.planOutline(k.insetPlan(pit, 1.2), 2.4, P), { tone: "faint" }) });
  pipe("dike.drain", [[X, yWall - 9, 1.4], [X, pit.y, 1.4]], 0.9, { tone: "hi", flanges: [false, false], valve: 0.55 });
}

A.settle(REC, P);
REC.items.sort((a, b) => a.key - b.key);

// ---------- labels ----------
const roofAnchor = (z) => [T[0] + (R - 3) * Math.cos(rad(FRONT + 30)), T[1] + (R - 3) * Math.sin(rad(FRONT + 30)), z];
const LABELS = [
  { n: 1, name: "Tanque vertical", anchor: onShell(FRONT - 62, R, 30), dx: 70, dy: -62 },
  { n: 2, name: "Techo flotante", anchor: roofAnchor(ROOF_Z + DECK_T), dx: -100, dy: -64 },
  { n: 3, name: "Medidor de nivel", anchor: onShell(GAUGE_A, R + 1.6, 30), dx: 18, dy: -108 },
  { n: 4, name: "Cámara de espuma", anchor: onShell(FOAM_A[1], R + 4.2, H + 1.2), dx: -36, dy: -34 },
  { n: 5, name: "Dique de contención", anchor: [DIKE.x + 10, DIKE.y + DIKE.d, DIKE.h], dx: 1, dy: 118 },
  { n: 6, name: "Válvula de drenaje", anchor: [(SLOT_X[0] + SLOT_X[1]) / 2, DIKE.y + DIKE.d + 7, 3], dx: -10, dy: 68 },
  { n: 7, name: "Llegada por poliducto", anchor: [RUN_X, -40, 20 + PIPE_R], dx: 16, dy: -40 },
  { n: 8, name: "Llenadera", anchor: [CANOPY.x + CANOPY.w, CANOPY.y + 30, 46.6], dx: 20, dy: -24 },
  { n: 9, name: "Brazo de carga", anchor: [(RISER[0] + ADAPTER.x + ADAPTER.w) / 2, RISER[1], 10.4], dx: 40, dy: 40 },
  { n: 10, name: "Autotanque (pipa)", anchor: [TRUCK.x + 6.5, 34, 19], dx: 30, dy: 46 },
  { n: 11, name: "Monitor contra incendio", anchor: [MONITOR[0], MONITOR[1], 14], dx: 20, dy: 56 },
];
// Tags must not overlap each other, nor leave the card.
{
  const rects = LABELS.map(({ name, anchor, dx, dy }) => {
    const [ax, ay] = at(anchor);
    const width = 26 + name.length * 5.3;
    const left = dx < 0 ? ax + dx - width + 10 : ax + dx - 10;
    return { name, x0: left, x1: left + width, y0: ay + dy - 9, y1: ay + dy + 9 };
  });
  rects.forEach((a, i) => {
    if (process.argv.includes("--labels")) console.log(a.name, LABELS[i].anchor.map((v) => Math.round(v)).join(","), "→ anchor", at(LABELS[i].anchor).map(Math.round).join(","), "tag", Math.round(a.x0), Math.round(a.y0), Math.round(a.x1), Math.round(a.y1));
    if (a.x0 < 4 || a.x1 > WIDTH - 4 || a.y0 < 26 || a.y1 > HEIGHT - 4) console.warn("label off card:", a.name, JSON.stringify(a));
    rects.slice(i + 1).forEach((b) => {
      if (a.x0 < b.x1 + 3 && b.x0 < a.x1 + 3 && a.y0 < b.y1 + 3 && b.y0 < a.y1 + 3) console.warn("labels overlap:", a.name, "×", b.name);
    });
  });
}

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Maqueta de una terminal de almacenamiento y reparto: un tanque vertical con techo flotante dentro de un dique de contención; una ventana en la pared deja ver el techo flotando sobre el combustible. El producto llega por poliducto, sale por una bomba hacia la llenadera y se carga a un autotanque con un brazo de carga por el fondo. Hay cámaras de espuma, un monitor contra incendio y la válvula de drenaje del dique.",
  body: [`<defs><clipPath id="tar-open"><path d="${topRing}"/><path d="${windowPoly}"/></clipPath></defs>`, ...back, ...REC.items.map((item) => item.svg), `<g data-part="labels">${labelsSvg(LABELS, at)}</g>`],
});

// ---------- live ----------
const live = `
const P = ${JSON.stringify(P)};
const T = ${JSON.stringify(T)}, R = ${R}, ZB = ${ZB}, FILL = ${FILL}, LEG = ${LEG}, DECK_T = ${DECK_T}, ROOF_Z = ${ROOF_Z};
const CAPACITY_BBL = ${CAPACITY_BBL}, SALES_BBL_DAY = ${SALES_BBL_DAY}, MIN_DAYS = ${MIN_DAYS}, L_PER_BBL = ${L_PER_BBL};
const LU = ${JSON.stringify(LU)}, LADDER = 42, PIVOT = ${JSON.stringify([T[0] + (R - 0.6) * LU[0], T[1] + (R - 0.6) * LU[1], H])};
const GAUGE = ${JSON.stringify(GAUGE)};
const ROOF_ANCHOR = ${JSON.stringify(roofAnchor(ROOF_Z + DECK_T))};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const fuelEl = svg.querySelector('[data-part="fuel"]');
const roofEl = svg.querySelector('[data-part="roof"]');
const legsEl = svg.querySelector('[data-part="legs"]');
const ladderEl = svg.querySelector('[data-part="ladder"]');
const pointerEl = svg.querySelector('[data-part="pointer"]');
const roofLabel = svg.querySelector('.cf-label[data-n="2"]');
const roofLeader = roofLabel && roofLabel.querySelector(".cf-leader");
const roofDot = roofLabel && roofLabel.querySelector(".cf-anchor");
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const fmt = (n, d = 0) => n.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });
// The model: inventory share -> fuel height; the roof floats on it until it lands on its legs.
const fuelZ = (share) => ZB + FILL * share;
const roofBottom = (share) => Math.max(ZB + LEG, fuelZ(share));
let level = 0.62, target = 0.62, last = 0, clock = 0, frame = 0, touring = true, visible = false, idle = 0, shown = -1;
const tourAt = (t) => 0.5 - 0.44 * Math.cos(t * 0.22);
function ladderSvg(deckTop) {
  const wz = deckTop + 0.7;
  const drop = PIVOT[2] - wz;
  const run = Math.sqrt(Math.max(0, LADDER * LADDER - drop * drop));
  const foot = [PIVOT[0] - LU[0] * run, PIVOT[1] - LU[1] * run, wz];
  const side = [-LU[1] * 1.5, LU[0] * 1.5];
  const rail = (s) => pathOf([iso([PIVOT[0] + side[0] * s, PIVOT[1] + side[1] * s, PIVOT[2]], P), iso([foot[0] + side[0] * s, foot[1] + side[1] * s, foot[2]], P)]);
  const rungs = [];
  for (let i = 1; i < 14; i++) {
    const t = i / 14;
    const p = [PIVOT[0] + (foot[0] - PIVOT[0]) * t, PIVOT[1] + (foot[1] - PIVOT[1]) * t, PIVOT[2] + (foot[2] - PIVOT[2]) * t];
    rungs.push(pathOf([iso([p[0] - side[0], p[1] - side[1], p[2]], P), iso([p[0] + side[0], p[1] + side[1], p[2]], P)]));
  }
  const wheels = [-1, 1].map((s) => iso([foot[0] + side[0] * s, foot[1] + side[1] * s, foot[2]], P));
  const pins = [-1, 1].map((s) => iso([PIVOT[0] + side[0] * s, PIVOT[1] + side[1] * s, PIVOT[2]], P));
  return '<path class="iso-line" data-tone="mid" d="' + rungs.join("") + '"/><path class="iso-line" data-tone="hi" d="' + rail(-1) + rail(1) + '"/>' + dotsSvg(wheels, { size: 0.9, tone: "hi" }) + dotsSvg(pins, { size: 0.7, tone: "mid" });
}
function draw() {
  const key = Math.round(level * 1000);
  if (key !== shown) {
    shown = key;
    const z = fuelZ(level);
    const roof = roofBottom(level);
    const lift = roof - ROOF_Z;
    fuelEl.innerHTML = z > ZB + 0.3 ? solidSvg(cylinder(T[0], T[1], R - 0.6, ZB, z - ZB, P, 128), { tone: "mid", crease: "none", className: "tar-fuel" }) : "";
    const move = translateAlong(P, [0, 0, lift]);
    roofEl.setAttribute("transform", move);
    ladderEl.innerHTML = ladderSvg(roof + DECK_T);
    const pz = (GAUGE.z1 - GAUGE.z0 - 4) * level;
    if (pointerEl) pointerEl.setAttribute("transform", translateAlong(P, [0, 0, pz]));
    if (roofLabel) {
      const a = iso([ROOF_ANCHOR[0], ROOF_ANCHOR[1], ROOF_ANCHOR[2] + lift], P);
      roofLeader.setAttribute("d", roofLeader.getAttribute("d").replace(/^M[^L]+/, "M" + a[0].toFixed(1) + " " + a[1].toFixed(1)));
      roofDot.setAttribute("cx", a[0].toFixed(1));
      roofDot.setAttribute("cy", a[1].toFixed(1));
    }
  }
  const bbl = CAPACITY_BBL * level;
  const days = bbl / SALES_BBL_DAY;
  const landed = fuelZ(level) < ZB + LEG;
  const state = landed ? (compact ? " · techo apoyado" : " · techo apoyado en sus patas") : days < MIN_DAYS ? (compact ? " · bajo el mínimo" : " · bajo el mínimo de " + MIN_DAYS + " días") : "";
  const text = compact
    ? fmt(level * 100) + " % · " + fmt(bbl) + " bbl · " + fmt(days, 1) + " días" + state
    : fmt(level * 100) + " % · " + fmt(bbl) + " barriles · " + fmt(bbl * L_PER_BBL / 1e6, 2) + " millones de litros · " + fmt(days, 1) + " días de venta" + state;
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(Math.round(level * 100)));
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) { clock += dt; target = tourAt(clock); }
  level = level + (target - level) * (1 - Math.exp(-dt / 0.45));
  draw();
  frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => { touring = false; target = clamp(next, 0, 1); clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; clock = Math.acos(clamp((0.5 - target) / 0.44, -1, 1)) / 0.22; run(); }, 4000); if (still.matches) { level = target; draw(); } run(); };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (event) => { const box = svg.getBoundingClientRect(); steer(clamp((event.clientX - box.left - box.width * 0.1) / (box.width * 0.8), 0, 1)); });
stage.addEventListener("keydown", (event) => {
  const step = event.key === "ArrowRight" || event.key === "ArrowUp" ? 0.05 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -0.05 : 0;
  if (event.key === "Home") { event.preventDefault(); steer(0); return; }
  if (event.key === "End") { event.preventDefault(); steer(1); return; }
  if (!step) return;
  event.preventDefault();
  steer(Math.round((target + step) * 20) / 20);
});
draw();
`;

const I = theme === "light"
  ? { fuel: "#ead7a3", fuelTop: "#f2e4bd", fuelEdge: "#a57f2c", cavity: "#d5d2ca", min: "#9B2247" }
  : { fuel: "#4a3c1f", fuelTop: "#594827", fuelEdge: "#e2b85a", cavity: "#0d0c0c", min: "#ea8aa8" };
const CSS = `<style>
.tar-cavity{fill:${I.cavity}}
.tar-fuel>.iso-fill,.tar-fuel>.iso-shade{fill:${I.fuel}}
.tar-fuel>.iso-top{fill:${I.fuelTop}}
.tar-fuel>.iso-edge{stroke:${I.fuelEdge}}
.tar-min{stroke:${I.min};stroke-width:1.1}
.tar-pointer{fill:${I.min};stroke:none}
</style>`;

writeFigure({
  id: "almacenamiento-tar",
  title: "Terminal de almacenamiento y reparto",
  theme,
  svg: svg.replace("</svg>", `${CSS}</svg>`),
  live,
  plate: {
    fig: "Fig 11",
    title: "Terminal de almacenamiento (TAR)",
    hint: "Desliza para cambiar el inventario",
    ariaLabel: "Terminal de almacenamiento: las flechas cambian el inventario del tanque",
    keys: [
      { mark: "lit", label: "Techo flotante: sube y baja con el combustible" },
      { mark: "gold", label: "Combustible en el tanque" },
      { mark: "red", label: `Marca de ${MIN_DAYS} días de venta en el medidor` },
    ],
    caption: `El combustible llega por poliducto, se guarda en tanques verticales y sale por una bomba a la llenadera, donde un brazo de carga llena la pipa por el fondo mientras un medidor registra el volumen y un cable de tierra descarga la electricidad estática. El techo flota sobre el líquido, así casi no queda espacio para vapores que se evaporen o se incendien; si el nivel baja más que sus patas, el techo se apoya y se forma ese espacio. El dique de contención puede retener todo el tanque si se derrama; las cámaras de espuma y el monitor combaten un incendio. Modelo simplificado: un tanque de ${CAPACITY_BBL.toLocaleString("es-MX")} barriles y ventas de ${SALES_BBL_DAY.toLocaleString("es-MX")} barriles al día; los días de autonomía son el inventario entre la venta diaria. La política de SENER pide inventarios mínimos de ${MIN_DAYS} días de venta promedio.`,
  },
});

// The rail ends on knobs that sit on their own posts: looked at 8x, a knob on a post, not a crossing.
A.auditOrExit(REC, P, { crowd: [["stair.rail", "stair.post*"]] });
