/**
 * "¿Cómo funciona?" · Transporte por ducto y gasoductos (Anatomía isométrica).
 *
 * A model on a base: a high-pressure natural gas transmission pipeline with a sectioning ball
 * valve, a centrifugal compressor booster unit, and an inline diagnostic pressure gauge.
 * Moving the slider adjusts the throughput (500 to 2,500 millones de pies cúbicos diarios - MMPCD)
 * showing how pressure ratio and gas velocity respond.
 *
 * node scripts/conceptos/gasoductos.mjs [--light]  →  public/conceptos/gasoductos(-light).html
 */
import * as k from "../../vendor/anatomy/kit/iso-kit.mjs";
import * as G from "../../vendor/anatomy/kit/lathe.mjs";
import { themeOf, labelsSvg, writeFigure } from "./_shared.mjs";

const theme = themeOf();
const WIDTH = 640;
const HEIGHT = 400;

const PLATE = { x: -140, y: -55, w: 280, d: 110, r: 8 };
const PLATE_H = 8;
const FOOT_H = 5;

// Positions
const PIPE_Y = 0;
const PIPE_Z = 20;
const PIPE_R = 12;
const VALVE_X = -60;
const COMPRESSOR_X = 35;

const P = k.fitProjection([
  ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
  [-130, 0, PIPE_Z],
  [130, 0, PIPE_Z],
  [COMPRESSOR_X, 0, 75],
  [VALVE_X, 0, 60]
], WIDTH, HEIGHT, { pad: 28, azimuth: 30, elevation: 30 });

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

// Pipeline: horizontal cylinder across the stage
function pipeline() {
  const out = [];
  const F = G.frameAlong([-130, PIPE_Y, PIPE_Z], [1, 0, 0]);
  // Main pipe length
  out.push(S(G.disc(0, 260, PIPE_R, F, P), { tone: "mid" }));
  // Weld seams along the pipe
  for (const x of [-100, -20, 90]) {
    out.push(L(G.arcOf(G.frameAlong([x, PIPE_Y, PIPE_Z], [1, 0, 0]), 0, PIPE_R + 0.4, P), { tone: "hi" }));
  }
  // Pipeline support pedestals
  for (const x of [-110, -15, 110]) {
    const ped = { x: x - 8, y: -12, w: 16, d: 24, r: 2 };
    out.push(S(k.slabOf(ped, 0, PIPE_Z - PIPE_R + 1, P, 3, 0.4), { tone: "lo" }));
  }
  return out.join("");
}

// Sectioning valve unit
function valve() {
  const out = [];
  // Valve flange rings
  const F1 = G.frameAlong([VALVE_X - 14, PIPE_Y, PIPE_Z], [1, 0, 0]);
  const F2 = G.frameAlong([VALVE_X + 14, PIPE_Y, PIPE_Z], [1, 0, 0]);
  out.push(S(G.disc(0, 4, PIPE_R + 4, F1, P), { tone: "hi" }));
  out.push(S(G.disc(0, 4, PIPE_R + 4, F2, P), { tone: "hi" }));
  // Valve body housing
  const body = { x: VALVE_X - 10, y: -14, w: 20, d: 28, r: 3 };
  out.push(S(k.slabOf(body, PIPE_Z - 14, 28, P, 4, 0.8), { tone: "hi" }));
  // Valve bonnet neck going up
  out.push(S(k.cylinder(VALVE_X, PIPE_Y, 5, PIPE_Z + 14, 18, P, 20), { tone: "mid" }));
  // Yellow actuator handwheel on top
  out.push(S(k.cylinder(VALVE_X, PIPE_Y, 12, PIPE_Z + 32, 4, P, 24), { tone: "hi" }));
  out.push(L(k.ring(VALVE_X, PIPE_Y, 10, PIPE_Z + 36, P, 20), { tone: "lo" }));
  return out.join("");
}

// Centrifugal compressor unit
function compressor() {
  const out = [];
  // Compressor skid concrete base
  const skid = { x: COMPRESSOR_X - 28, y: -28, w: 56, d: 56, r: 4 };
  out.push(S(k.slabOf(skid, 0, 8, P, 4, 0.6), { tone: "lo" }));
  // Compressor centrifugal volute casing
  out.push(S(k.cylinder(COMPRESSOR_X, PIPE_Y, 20, 8, 30, P, 32), { tone: "hi" }));
  out.push(S(k.cylinder(COMPRESSOR_X, PIPE_Y, 14, 38, 22, P, 24), { tone: "mid" }));
  // Gas intake and discharge pipes
  const pIn1 = at([COMPRESSOR_X - 15, -18, PIPE_Z]);
  const pIn2 = at([COMPRESSOR_X - 15, PIPE_Y, PIPE_Z]);
  const pOut1 = at([COMPRESSOR_X + 15, PIPE_Y, PIPE_Z]);
  const pOut2 = at([COMPRESSOR_X + 15, 18, PIPE_Z]);
  out.push(`<path d="M${pIn1.join(" ")} L${pIn2.join(" ")}" stroke="var(--cf-border)" stroke-width="6" stroke-linecap="round" fill="none"/>`);
  out.push(`<path d="M${pOut1.join(" ")} L${pOut2.join(" ")}" stroke="var(--cf-accent)" stroke-width="6" stroke-linecap="round" fill="none"/>`);
  return out.join("");
}

// Pressure gauge indicator
function gauge() {
  const out = [];
  const gx = -20;
  out.push(S(k.cylinder(gx, PIPE_Y, 2, PIPE_Z + PIPE_R, 12, P, 16), { tone: "mid" }));
  // Gauge face
  const dial = at([gx, PIPE_Y, PIPE_Z + PIPE_R + 18]);
  out.push(`<circle cx="${dial[0].toFixed(1)}" cy="${dial[1].toFixed(1)}" r="10" fill="var(--cf-card)" stroke="var(--cf-accent)" stroke-width="1.6"/>
  <line x1="${dial[0].toFixed(1)}" y1="${dial[1].toFixed(1)}" x2="${(dial[0] + 5).toFixed(1)}" y2="${(dial[1] - 5).toFixed(1)}" stroke="#c0392b" stroke-width="1.8" stroke-linecap="round"/>`);
  return out.join("");
}

const labels = [
  { n: 1, name: "Tubería de acero al carbono (alta presión)", anchor: [-100, 0, PIPE_Z], dx: -30, dy: -30 },
  { n: 2, name: "Válvula de seccionamiento de bola", anchor: [VALVE_X, 0, PIPE_Z + 36], dx: -25, dy: -28 },
  { n: 3, name: "Manómetro de presión (75 bar)", anchor: [-20, 0, PIPE_Z + 30], dx: -15, dy: -26 },
  { n: 4, name: "Estación de compresión centrífuga", anchor: [COMPRESSOR_X, 0, 52], dx: 35, dy: -28 },
  { n: 5, name: "Soporte y anclaje antivibratorio", anchor: [COMPRESSOR_X - 20, -25, 4], dx: 35, dy: 18 }
];

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Gasoducto de alta presión con válvula de seccionamiento y estación de compresión",
  body: [
    `<g data-part="base">${base()}</g>`,
    `<g data-part="pipeline">${pipeline()}</g>`,
    `<g data-part="valve">${valve()}</g>`,
    `<g data-part="compressor">${compressor()}</g>`,
    `<g data-part="gauge">${gauge()}</g>`,
    `<g data-part="labels">${labelsSvg(labels, at)}</g>`
  ]
});

const live = `
const stage = document.querySelector(".iso-stage");
const readout = document.querySelector('[data-corner="readout"]');

let flowRate = 1200; // MMPCD (millones de pies cúbicos diarios)

function update() {
  const pressureBar = Math.round(55 + (flowRate / 2500) * 35);
  const velocityMs = (8 + (flowRate / 2500) * 12).toFixed(1);
  if (readout) {
    readout.innerHTML = 'Flujo: <strong style="color:var(--cf-gold);font-size:17px">' + flowRate.toLocaleString("es-MX") + ' MMPCD</strong> &nbsp;·&nbsp; ' +
      'Presión en ducto: <strong style="color:var(--cf-accent)">' + pressureBar + ' bar</strong> &nbsp;·&nbsp; ' +
      'Velocidad del gas: <b>' + velocityMs + ' m/s</b>';
  }
}

stage.addEventListener("pointermove", (e) => {
  const rect = stage.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  flowRate = Math.round(500 + ratio * 2000);
  stage.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
  update();
});

stage.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "ArrowUp") { flowRate = Math.min(2500, flowRate + 100); update(); }
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") { flowRate = Math.max(500, flowRate - 100); update(); }
});

update();
`;

writeFigure({
  id: "gasoductos",
  title: "Gasoducto y estación de compresión",
  theme,
  svg,
  controls: "",
  live,
  plate: {
    fig: "Fig. Hidrocarburos",
    title: "Gasoducto de alta presión y compresión",
    hint: "Desliza para cambiar el flujo de gas natural (MMPCD)",
    ariaLabel: "Simulador de gasoducto y compresión de gas natural",
    keys: [
      { mark: "gold", label: "Tubería troncal con válvulas de corte y compresores de refuerzo" }
    ],
    caption: "El gas natural viaja comprimido a entre 50 y 90 bar. Cada 100 a 150 km, una estación de compresión restablece la presión que el fluido pierde por fricción con las paredes del tubo."
  }
});
