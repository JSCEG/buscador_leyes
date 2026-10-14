/**
 * "¿Cómo funciona?" · Almacenamiento de petrolíferos: Terminal TAR (Anatomía isométrica).
 *
 * A model on a base: a floating-roof vertical storage tank inside a concrete containment dike,
 * accompanied by a tank truck loading rack (isleta de llenado) and fire suppression monitor.
 * Moving the slider raises and lowers the floating roof and liquid level (0 to 100,000 barriles),
 * demonstrating how the roof eliminates vapor space to prevent evaporation and fire hazards.
 *
 * node scripts/conceptos/almacenamiento-tar.mjs [--light]  →  public/conceptos/almacenamiento-tar(-light).html
 */
import * as k from "../../vendor/anatomy/kit/iso-kit.mjs";
import * as G from "../../vendor/anatomy/kit/lathe.mjs";
import { themeOf, labelsSvg, writeFigure } from "./_shared.mjs";

const theme = themeOf();
const WIDTH = 640;
const HEIGHT = 400;

const PLATE = { x: -140, y: -60, w: 280, d: 120, r: 8 };
const PLATE_H = 8;
const FOOT_H = 5;

// Positions
const TANK_X = -35;
const TANK_Y = 0;
const TANK_R = 38;
const TANK_H = 65;
const RACK_X = 65;

const P = k.fitProjection([
  ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
  [TANK_X - TANK_R - 10, -50, TANK_H + 15],
  [RACK_X + 45, 45, 45],
  [TANK_X, 0, TANK_H + 20]
], WIDTH, HEIGHT, { pad: 26, azimuth: 34, elevation: 30 });

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

// Containment dike (muro de retención) around the tank
function dike() {
  const out = [];
  const dikePlan = { x: -85, y: -50, w: 100, d: 100, r: 4 };
  out.push(L(k.planOutline(dikePlan, 0, P), { tone: "lo" }));
  out.push(S(k.slabOf(dikePlan, 0, 10, P, 4, 0.4), { tone: "lo" }));
  return out.join("");
}

// Floating roof storage tank
function storageTank() {
  const out = [];
  // Tank foundation ring
  out.push(S(k.cylinder(TANK_X, TANK_Y, TANK_R + 2, 0, 4, P, 36), { tone: "lo" }));
  // Tank outer shell
  out.push(S(k.cylinder(TANK_X, TANK_Y, TANK_R, 4, TANK_H, P, 36), { tone: "mid" }));
  // Top wind girder ring
  out.push(L(k.ring(TANK_X, TANK_Y, TANK_R + 0.8, TANK_H + 4, P, 36), { tone: "hi" }));
  
  // Spiral access stairway lines around shell
  const steps = [];
  for (let a = 0; a <= 180; a += 15) {
    const rad = (a * Math.PI) / 180;
    const sx = TANK_X + (TANK_R + 1.5) * Math.cos(rad);
    const sy = TANK_Y + (TANK_R + 1.5) * Math.sin(rad);
    const sz = 4 + (a / 180) * TANK_H;
    steps.push(at([sx, sy, sz]));
  }
  out.push(`<path d="${steps.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')}" stroke="var(--cf-border)" stroke-width="2" fill="none"/>`);
  
  // Floating roof disc at initial level z=42
  const F = G.frameAlong([TANK_X, TANK_Y, 42], [0, 0, 1]);
  out.push(`<g id="floating-roof">${S(G.disc(0, 3, TANK_R - 1.5, F, P), { tone: "hi" })}</g>`);
  
  return out.join("");
}

// Loading rack (isla de llenado) with truck
function loadingRack() {
  const out = [];
  // Concrete canopy slab
  const island = { x: RACK_X - 18, y: -30, w: 36, d: 60, r: 3 };
  out.push(S(k.slabOf(island, 0, 5, P, 3, 0.4), { tone: "lo" }));
  // Canopy columns
  for (const [x, y] of [[RACK_X - 12, -22], [RACK_X + 12, -22], [RACK_X - 12, 22], [RACK_X + 12, 22]]) {
    out.push(S(k.cylinder(x, y, 2, 5, 34, P, 14), { tone: "mid" }));
  }
  // Overhead roof canopy
  const roof = { x: RACK_X - 22, y: -34, w: 44, d: 68, r: 3 };
  out.push(S(k.slabOf(roof, 39, 4, P, 3, 0.6), { tone: "mid" }));
  
  // Autotanque / Pipa body parked in the bay
  const truck = { x: RACK_X - 7, y: -16, w: 14, d: 32, r: 4 };
  out.push(S(k.slabOf(truck, 5, 14, P, 3, 0.8), { tone: "hi" }));
  // Tanker cylinder on chassis
  const TF = G.frameAlong([RACK_X, -20, 18], [0, 1, 0]);
  out.push(S(G.disc(0, 34, 7, TF, P), { tone: "mid" }));

  // Loading arm down from canopy to truck hatch
  const arm1 = at([RACK_X - 8, -4, 38]);
  const arm2 = at([RACK_X - 2, -4, 25]);
  out.push(`<path d="M${arm1.join(" ")} L${arm2.join(" ")}" stroke="var(--cf-accent)" stroke-width="3" stroke-linecap="round" fill="none"/>`);
  
  // Fire foam cannon on pedestal
  const fx = RACK_X - 30;
  const fy = 35;
  out.push(S(k.cylinder(fx, fy, 2, 0, 16, P, 14), { tone: "lo" }));
  const cannon1 = at([fx, fy, 16]);
  const cannon2 = at([fx + 8, fy - 6, 20]);
  out.push(`<path d="M${cannon1.join(" ")} L${cannon2.join(" ")}" stroke="#c0392b" stroke-width="3.5" stroke-linecap="round" fill="none"/>`);
  
  return out.join("");
}

const labels = [
  { n: 1, name: "Tanque vertical de almacenamiento", anchor: [TANK_X, TANK_Y, TANK_H], dx: -35, dy: -28 },
  { n: 2, name: "Techo flotante hermético (sube/baja)", anchor: [TANK_X, TANK_Y, 44], dx: -45, dy: 14 },
  { n: 3, name: "Dique de contención antiderrames", anchor: [-85, 0, 8], dx: -30, dy: -20 },
  { n: 4, name: "Isla de llenado de autotanques (pipas)", anchor: [RACK_X, 0, 42], dx: 35, dy: -26 },
  { n: 5, name: "Cañón monitor de espuma contra incendio", anchor: [RACK_X - 30, 35, 18], dx: 30, dy: 18 }
];

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Terminal de almacenamiento y reparto (TAR) con tanque de techo flotante e isla de llenado",
  body: [
    `<g data-part="base">${base()}</g>`,
    `<g data-part="dike">${dike()}</g>`,
    `<g data-part="tank">${storageTank()}</g>`,
    `<g data-part="rack">${loadingRack()}</g>`,
    `<g data-part="labels">${labelsSvg(labels, at)}</g>`
  ]
});

const live = `
const stage = document.querySelector(".iso-stage");
const readout = document.querySelector('[data-corner="readout"]');
const roof = document.querySelector("#floating-roof");

let capacityBbl = 65000; // 0 to 100,000 barriles

function update() {
  const percent = Math.round((capacityBbl / 100000) * 100);
  const millonesLitros = (capacityBbl * 0.158987 / 1000).toFixed(1);
  const diasAutonomia = (capacityBbl / 12000).toFixed(1); // ej. consumo regional
  
  // Move the floating roof visually using SVG transform
  if (roof) {
    const risePx = (percent - 65) * 0.55;
    roof.style.transform = "translateY(" + (-risePx).toFixed(1) + "px)";
  }

  if (readout) {
    readout.innerHTML = 'Inventario: <strong style="color:var(--cf-gold);font-size:17px">' + capacityBbl.toLocaleString("es-MX") + ' barriles</strong> (' + percent + ' %) &nbsp;·&nbsp; ' +
      '<span style="color:var(--cf-accent);font-weight:700">' + millonesLitros + ' millones de litros</span> &nbsp;·&nbsp; ' +
      'Autonomía de abasto: <b>' + diasAutonomia + ' días</b>';
  }
}

stage.addEventListener("pointermove", (e) => {
  const rect = stage.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  capacityBbl = Math.round(15000 + ratio * 85000);
  stage.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
  update();
});

stage.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "ArrowUp") { capacityBbl = Math.min(100000, capacityBbl + 5000); update(); }
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") { capacityBbl = Math.max(15000, capacityBbl - 5000); update(); }
});

update();
`;

writeFigure({
  id: "almacenamiento-tar",
  title: "Terminal de Almacenamiento y Reparto (TAR)",
  theme,
  svg,
  controls: "",
  live,
  plate: {
    fig: "Fig. Hidrocarburos",
    title: "Terminal de Almacenamiento y Reparto (TAR)",
    hint: "Desliza para variar el nivel de inventario del tanque",
    ariaLabel: "Simulador de terminal de almacenamiento de petrolíferos",
    keys: [
      { mark: "gold", label: "Tanque de techo flotante, dique de retención e isleta de llenado de pipas" }
    ],
    caption: "El techo flotante descansa directamente sobre la superficie del líquido: al no existir cámara de aire, los hidrocarburos no pueden evaporarse ni generar atmósferas explosivas."
  }
});
