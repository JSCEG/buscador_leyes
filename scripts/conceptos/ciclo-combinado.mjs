/**
 * "¿Cómo funciona?" · Central de ciclo combinado.
 *
 * A scale model on a base: natural gas enters through a flanged supply pipe with a gate valve into
 * the axial compressor and combustion chamber, spinning the gas turbine and its first generator
 * (Brayton cycle). The hot exhaust gases (~550 °C) pass into the Heat Recovery Steam Generator
 * (HRSG), boiling water into high-pressure steam that drives the steam turbine and its second
 * generator (Rankine cycle), while a condenser and cooling tower close the water loop.
 *
 * node scripts/conceptos/ciclo-combinado.mjs [--light]
 *   →  public/conceptos/ciclo-combinado(-light).html
 */
import * as k from "../../vendor/anatomy/kit/iso-kit.mjs";
import * as G from "../../vendor/anatomy/kit/lathe.mjs";
import { themeOf, inkOf, labelsSvg, writeFigure } from "./_shared.mjs";

const theme = themeOf();
const INK = inkOf(theme);
const WIDTH = 640;
const HEIGHT = 400;

const PLATE = { x: -176, y: -66, w: 352, d: 132, r: 8 };
const PLATE_H = 8;
const FOOT_H = 5;
const AXIS_Y = 20;
const AXIS_Z = 24;
const HRSG = { x: -14, y: -44, w: 48, d: 38, r: 2.5 };
const HRSG_H = 62;
const STACK = [HRSG.x + HRSG.w / 2, HRSG.y + HRSG.d / 2];
const TOWER = [138, -20];

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    [STACK[0], STACK[1], 96],
    [TOWER[0] + 24, TOWER[1] + 24, 76],
    [-170, 56, 48],
  ],
  WIDTH,
  HEIGHT,
  { pad: 24, azimuth: 35, elevation: 31 },
);
const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of k.corners(PLATE, 20).sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P))) {
    out.push(S(k.cylinder(x, y, 6.5, -PLATE_H - FOOT_H, 1.6, P, 26), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 26), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 9);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  return out.join("");
}

// 1. Gas inlet pipe + valve at left front
function gasInlet() {
  const out = [];
  const F = G.frameAlong([-164, AXIS_Y, AXIS_Z], [1, 0, 0]);
  out.push(S(k.slabOf({ x: -154, y: AXIS_Y - 5, w: 6, d: 10, r: 0.8 }, 0, AXIS_Z - 4, P, 3, 0.4), { tone: "mid" }));
  out.push(S(G.disc(0, 34, 3.8, F, P), { tone: "mid" }));
  for (const s of [0, 12, 22, 32]) out.push(S(G.disc(s, s + 1.6, 5.8, F, P), { tone: "mid" }));
  const vx = -164 + 17.8;
  out.push(S(k.cylinder(vx, AXIS_Y, 1.1, AXIS_Z + 4.5, 8, P, 12), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(vx, AXIS_Y, 5.5, AXIS_Z + 12.5, 1.4, P, 28), { tone: "hi" }));
  return out.join("");
}

// 2 & 3. Compressor + Combustion Chamber + Gas Turbine + Gen 1
function gasTurbineTrain() {
  const out = [];
  // Concrete skid under GT train
  out.push(S(k.slabOf({ x: -130, y: AXIS_Y - 16, w: 104, d: 32, r: 2 }, 0, 6, P, 4, 0.5), { tone: "lo" }));
  const F = G.frameAlong([-128, AXIS_Y, AXIS_Z], [1, 0, 0]);
  // Compressor section
  out.push(S(G.disc(0, 22, 10.5, F, P), { tone: "mid" }));
  out.push(L(G.ribsOf(F, 2, 20, 10.5, 28, P, { seams: true }), { tone: "lo" }));
  // Combustion chamber (central ring with flame glow)
  out.push(S(G.disc(22, 40, 13.5, F, P), { tone: "hi", crease: "lo" }));
  const flamePt = at([-128 + 31, AXIS_Y + 11, AXIS_Z + 4]);
  out.push(`<circle class="cf-glow" data-part="flame" cx="${flamePt[0].toFixed(1)}" cy="${flamePt[1].toFixed(1)}" r="12" opacity="0.5" style="filter:blur(5px)"/>`);
  // Expansion turbine section
  out.push(S(G.disc(40, 62, 11.5, F, P), { tone: "mid" }));
  // Shaft + Generator 1
  out.push(S(G.disc(62, 72, 3.2, F, P), { tone: "mid" }));
  out.push(S(G.disc(72, 98, 12.5, F, P), { tone: "hi", crease: "lo" }));
  out.push(k.faceTextSvg(k.topMatrix([-128 + 85, AXIS_Y], AXIS_Z + 12.6, P, "x"), "GEN 1", { size: 4.2, tone: "mid", anchor: "middle" }));
  return { svg: out.join(""), F };
}

// 4. Heat Recovery Steam Generator (HRSG)
function hrsgTower() {
  const out = [];
  out.push(S(k.slabOf({ x: HRSG.x - 3, y: HRSG.y - 3, w: HRSG.w + 6, d: HRSG.d + 6, r: 3 }, 0, 4, P, 4, 0.5), { tone: "lo" }));
  out.push(S(k.slabOf(HRSG, 4, HRSG_H, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(HRSG, 26, P, 4) + k.sideSeam(HRSG, 46, P, 4), { tone: "faint" }) }));
  // Stack on top
  out.push(S(k.cylinder(STACK[0], STACK[1], 11, 4 + HRSG_H, 4, P, 28), { tone: "lo" }));
  out.push(S(k.cylinder(STACK[0], STACK[1], 8.5, 8 + HRSG_H, 24, P, 32, 0.5), { tone: "hi", crease: "lo" }));
  out.push(L(k.ring(STACK[0], STACK[1], 6.5, 32 + HRSG_H, P, 28), { tone: "lo" }));
  // Steam drum on top front of HRSG
  const drumF = G.frameAlong([HRSG.x + 6, HRSG.y + HRSG.d - 4, 4 + HRSG_H + 5], [1, 0, 0]);
  out.push(S(G.disc(0, 36, 5.2, drumF, P), { tone: "hi", crease: "lo" }));
  return out.join("");
}

// 5. Steam Turbine + Generator 2
function steamTurbineTrain() {
  const out = [];
  out.push(S(k.slabOf({ x: 38, y: AXIS_Y - 15, w: 82, d: 30, r: 2 }, 0, 6, P, 4, 0.5), { tone: "lo" }));
  const F = G.frameAlong([42, AXIS_Y, AXIS_Z], [1, 0, 0]);
  // HP/LP steam turbine stages
  out.push(S(G.disc(0, 18, 9.5, F, P), { tone: "mid" }));
  out.push(S(G.disc(18, 38, 12.5, F, P), { tone: "hi", crease: "lo" }));
  out.push(L(G.ribsOf(F, 20, 36, 12.5, 28, P, { seams: true }), { tone: "lo" }));
  // Shaft + Generator 2
  out.push(S(G.disc(38, 48, 3.2, F, P), { tone: "mid" }));
  out.push(S(G.disc(48, 74, 12, F, P), { tone: "hi", crease: "lo" }));
  out.push(k.faceTextSvg(k.topMatrix([42 + 61, AXIS_Y], AXIS_Z + 12.1, P, "x"), "GEN 2", { size: 4.2, tone: "mid", anchor: "middle" }));
  return { svg: out.join(""), F };
}

// 6. Cooling tower & condenser
function coolingTower() {
  const [x, y] = TOWER;
  const out = [];
  out.push(S(k.cylinder(x, y, 22, 0, 5, P, 36), { tone: "lo" }));
  const cuts = [
    [5, 18, 19.5],
    [18, 34, 16.5],
    [34, 50, 14.8],
    [50, 64, 16.2],
  ];
  for (const [z0, z1, r] of cuts) {
    out.push(S(k.cylinder(x, y, r, z0, z1 - z0, P, 36, z1 === 64 ? 0.5 : 0), { tone: "mid" }));
  }
  out.push(L(k.ring(x, y, 13.5, 64, P, 32), { tone: "lo" }));
  return out.join("");
}

const GT = gasTurbineTrain();
const ST = steamTurbineTrain();

// Connecting ducts & pipes
const gasPath = k.pathOf([[-164, AXIS_Y, AXIS_Z], [-100, AXIS_Y, AXIS_Z]].map(at));
const exhaustPath = k.pathOf([[-66, AXIS_Y, AXIS_Z + 8], [-66, -18, AXIS_Z + 8], [HRSG.x, -18, AXIS_Z + 8], [STACK[0], STACK[1], 56]].map(at));
const steamPath = k.pathOf([[HRSG.x + HRSG.w - 4, HRSG.y + HRSG.d - 4, 68], [52, HRSG.y + HRSG.d - 4, 68], [52, AXIS_Y, AXIS_Z + 9]].map(at));
const condPath = k.pathOf([[70, AXIS_Y, AXIS_Z - 6], [138, AXIS_Y, 8], [TOWER[0], TOWER[1], 8]].map(at));

const LABELS = [
  { n: 1, name: "Entrada de gas natural", anchor: [-146, AXIS_Y, AXIS_Z + 13], dx: -10, dy: 58 },
  { n: 2, name: "Compresor y cámara de combustión", anchor: [-98, AXIS_Y, AXIS_Z + 13.5], dx: -44, dy: -56 },
  { n: 3, name: "Turbina de gas", anchor: [-44, AXIS_Y, AXIS_Z + 12.5], dx: -20, dy: 64 },
  { n: 4, name: "Recuperador de calor (HRSG)", anchor: [STACK[0], STACK[1], 82], dx: -52, dy: -28 },
  { n: 5, name: "Turbina de vapor", anchor: [80, AXIS_Y, AXIS_Z + 12.5], dx: 10, dy: 64 },
  { n: 6, name: "Torre de enfriamiento / Condensador", anchor: [TOWER[0] + 8, TOWER[1], 58], dx: -36, dy: -34 },
];

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Maqueta de una central de ciclo combinado: el gas natural entra al compresor y cámara de combustión para mover la turbina de gas (primer generador); los gases de escape calientes pasan al recuperador de calor (HRSG) para producir vapor y mover la turbina de vapor (segundo generador), con su condensador y torre de enfriamiento.",
  body: [
    base(),
    hrsgTower(),
    coolingTower(),
    `<path class="iso-line" data-tone="mid" d="${exhaustPath}"/><path class="iso-line cf-flow" data-tone="red" data-part="exhaust" d="${exhaustPath}"/>`,
    `<path class="iso-line" data-tone="mid" d="${steamPath}"/><path class="iso-line cf-flow" data-tone="green" data-part="steam" d="${steamPath}"/>`,
    `<path class="iso-line" data-tone="lo" d="${condPath}"/>`,
    gasInlet(),
    `<path class="iso-line cf-flow cf-gold" data-part="gas" d="${gasPath}"/>`,
    GT.svg,
    ST.svg,
    `<g data-part="rotors"></g>`,
    `<g data-part="labels">${labelsSvg(LABELS, at)}</g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const AXIS_Y = ${AXIS_Y}, AXIS_Z = ${AXIS_Z};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const rotorsEl = svg.querySelector('[data-part="rotors"]');
const flameEl = svg.querySelector('[data-part="flame"]');
const gasFlow = svg.querySelector('[data-part="gas"]');
const exhaustFlow = svg.querySelector('[data-part="exhaust"]');
const steamFlow = svg.querySelector('[data-part="steam"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const fmt = (n) => Math.round(n).toLocaleString("es-MX");
let load = 0.78, target = 0.78, angle = 0, last = 0, clock = 0, frame = 0, touring = true, visible = false, idle = 0;
const tourAt = (t) => 0.7 + 0.28 * Math.sin(t * 0.45);
function wheelLines(cx, r, a) {
  const lines = [];
  for (let i = 0; i < 6; i++) {
    const t = a + (i * Math.PI) / 3;
    const p0 = [cx, AXIS_Y + Math.cos(t) * 2.5, AXIS_Z + Math.sin(t) * 2.5];
    const p1 = [cx, AXIS_Y + Math.cos(t) * r, AXIS_Z + Math.sin(t) * r];
    lines.push(pathOf([iso(p0, P), iso(p1, P)]));
  }
  return lines.join("");
}
function draw() {
  const pct = Math.round(40 + load * 60);
  const gtMw = Math.round(140 + load * 210);
  const stMw = Math.round(70 + load * 115);
  const totalMw = gtMw + stMw;
  const eff = (52 + load * 8).toFixed(1);
  rotorsEl.innerHTML = '<path class="iso-line" data-tone="lit" d="' + wheelLines(-64, 9.5, angle) + wheelLines(82, 9.5, angle * 0.85) + '"/>';
  flameEl.setAttribute("opacity", String((0.25 + load * 0.65).toFixed(2)));
  flameEl.setAttribute("r", String((10 + load * 10).toFixed(1)));
  const off = -angle * 8;
  gasFlow.style.strokeDashoffset = String(off);
  exhaustFlow.style.strokeDashoffset = String(off * 1.15);
  steamFlow.style.strokeDashoffset = String(off * 0.95);
  const text = compact
    ? "Carga " + pct + " % · Gas " + fmt(gtMw) + " MW + Vapor " + fmt(stMw) + " MW = " + fmt(totalMw) + " MW"
    : "Carga " + pct + " % · Turbina de gas: " + fmt(gtMw) + " MW + Turbina de vapor (HRSG): " + fmt(stMw) + " MW = " + fmt(totalMw) + " MW · Eficiencia " + eff + " %";
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(pct));
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) { clock += dt; target = tourAt(clock); }
  load = load + (target - load) * (1 - Math.exp(-dt / 0.45));
  angle = (angle + dt * Math.PI * 2 * (0.45 + load * 0.75)) % (Math.PI * 20);
  draw();
  frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => { touring = false; target = clamp(next, 0, 1); clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; run(); }, 4500); if (still.matches) { load = target; draw(); } run(); };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (event) => { const box = svg.getBoundingClientRect(); steer(clamp((event.clientX - box.left) / box.width, 0, 1)); });
stage.addEventListener("keydown", (event) => {
  const step = event.key === "ArrowRight" || event.key === "ArrowUp" ? 0.1 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -0.1 : 0;
  if (!step) return;
  event.preventDefault();
  steer(Math.round((target + step) * 10) / 10);
});
draw();
`;

writeFigure({
  id: "ciclo-combinado",
  title: "Central de ciclo combinado",
  theme,
  svg,
  live,
  plate: {
    fig: "Fig 8",
    title: "Central de ciclo combinado (Brayton + Rankine)",
    hint: "Desliza para cambiar la carga de la central · toca cualquier número para ver la pieza",
    ariaLabel: "Central de ciclo combinado: las flechas cambian el nivel de carga",
    keys: [
      { mark: "gold", label: "Gas natural de entrada" },
      { mark: "red", label: "Gases calientes de escape hacia el HRSG (>500 °C)" },
      { mark: "green", label: "Vapor de alta presión y energía generada" },
    ],
    caption: "Con el mismo gas natural se produce electricidad dos veces: primero al quemar el gas en la turbina de combustión (GEN 1) y luego al aprovechar sus gases calientes de escape en el recuperador de calor (HRSG) para hervir agua y mover la turbina de vapor (GEN 2), alcanzando eficiencias cercanas al 60 %. Cifras ilustrativas.",
  },
});
