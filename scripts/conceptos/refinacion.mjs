/**
 * "¿Cómo funciona?" · Refinación: Torre de destilación fraccionada.
 *
 * A model on a base: a preheat furnace heating crude oil to ~370 °C, an atmospheric distillation
 * column with fractionation trays, condenser at the top, and side strippers delivering cuts:
 *   - Domo (<100 °C): gases licuados y gasolinas ligeras
 *   - Medio-alto (~180 °C): turbosina y queroseno
 *   - Medio-bajo (~280 °C): diésel automotriz
 *   - Fondo (>350 °C): residuo atmosférico (combustóleo y asfalto)
 * Moving the slider adjusts the crude processing rate (20,000 to 200,000 barriles/día).
 *
 * node scripts/conceptos/refinacion.mjs [--light]  →  public/conceptos/refinacion(-light).html
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
const FURNACE_X = -85;
const TOWER_X = -5;
const TANKS_X = 85;
const TOWER_R = 22;
const TOWER_H = 110;

const P = k.fitProjection([
  ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
  [TOWER_X, 0, TOWER_H + 20],
  [FURNACE_X, 0, 70],
  [TANKS_X + 25, 30, 40]
], WIDTH, HEIGHT, { pad: 28, azimuth: 32, elevation: 28 });

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

// Preheat furnace on the left
function furnace() {
  const out = [];
  const plan = { x: FURNACE_X - 25, y: -25, w: 50, d: 50, r: 4 };
  out.push(S(k.slabOf(plan, 0, 35, P, 4, 0.6), { tone: "mid" }));
  // Burner flame window glow
  const p1 = at([FURNACE_X - 10, 25, 8]);
  const p2 = at([FURNACE_X + 10, 25, 8]);
  const p3 = at([FURNACE_X + 10, 25, 22]);
  const p4 = at([FURNACE_X - 10, 25, 22]);
  out.push(`<polygon class="cf-glow" points="${p1.join(",")} ${p2.join(",")} ${p3.join(",")} ${p4.join(",")}" opacity="0.85"/>`);
  // Exhaust chimney stack
  out.push(S(k.cylinder(FURNACE_X, 0, 6, 35, 45, P, 20), { tone: "mid" }));
  // Transfer line pipe to tower
  const tPipe1 = at([FURNACE_X + 25, 0, 18]);
  const tPipe2 = at([TOWER_X - TOWER_R, 0, 18]);
  out.push(`<path d="M${tPipe1.join(" ")} L${tPipe2.join(" ")}" stroke="var(--cf-accent)" stroke-width="4" stroke-linecap="round" fill="none"/>`);
  return out.join("");
}

// Distillation tower in center with trays
function tower() {
  const out = [];
  // Skirt support at base
  out.push(S(k.cylinder(TOWER_X, 0, TOWER_R + 2, 0, 14, P, 32), { tone: "lo" }));
  // Main column body
  out.push(S(k.cylinder(TOWER_X, 0, TOWER_R, 14, TOWER_H - 14, P, 32), { tone: "mid" }));
  
  // Tray levels (external rings indicating fractionation stages)
  const trayHeights = [30, 52, 74, 94];
  for (const z of trayHeights) {
    out.push(L(k.ring(TOWER_X, 0, TOWER_R + 0.8, z, P, 32), { tone: "hi" }));
  }

  // Top dome cap
  const dome = G.frameAlong([TOWER_X, 0, TOWER_H], [0, 0, 1]);
  out.push(S(G.disc(0, 4, TOWER_R, dome, P), { tone: "hi" }));

  // Draw product draw-off pipes to the right
  const pipeZ = [
    { z: 102, label: "gasolinas", color: "var(--cf-gold)" },
    { z: 76, label: "turbosina", color: "#e9c46a" },
    { z: 54, label: "diesel", color: "#1E5B4F" },
    { z: 20, label: "fondo", color: "#6b6460" }
  ];

  for (const { z, color } of pipeZ) {
    const p1 = at([TOWER_X + TOWER_R, 0, z]);
    const p2 = at([TANKS_X - 15, 0, z]);
    const p3 = at([TANKS_X - 15, 0, z - 12]);
    out.push(`<path d="M${p1[0].toFixed(1)} ${p1[1].toFixed(1)} L${p2[0].toFixed(1)} ${p2[1].toFixed(1)} L${p3[0].toFixed(1)} ${p3[1].toFixed(1)}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>`);
  }

  return out.join("");
}

// Storage manifold tanks on the right
function tanks() {
  const out = [];
  const tankDefs = [
    { y: -35, h: 28, r: 12, name: "Gasolinas" },
    { y: -10, h: 32, r: 13, name: "Turbosina" },
    { y: 15, h: 36, r: 14, name: "Diésel" },
    { y: 40, h: 24, r: 15, name: "Combustóleo" }
  ];
  for (const t of tankDefs) {
    out.push(S(k.cylinder(TANKS_X + 15, t.y, t.r, 0, t.h, P, 22), { tone: "mid" }));
    out.push(L(k.ring(TANKS_X + 15, t.y, t.r, t.h, P, 22), { tone: "lo" }));
  }
  return out.join("");
}

const labels = [
  { n: 1, name: "Horno precalentador (370 °C)", anchor: [FURNACE_X, 0, 36], dx: -20, dy: -24 },
  { n: 2, name: "Zona de evaporación (Flash)", anchor: [TOWER_X - 10, 0, 20], dx: -35, dy: -12 },
  { n: 3, name: "Torre de destilación", anchor: [TOWER_X, 0, 65], dx: -45, dy: -30 },
  { n: 4, name: "Gasolinas y nafta (<100 °C)", anchor: [TOWER_X + 14, 0, 102], dx: 45, dy: -26 },
  { n: 5, name: "Turbosina y Diésel (~250 °C)", anchor: [TOWER_X + 14, 0, 60], dx: 45, dy: -6 },
  { n: 6, name: "Fondo: Combustóleo y asfalto", anchor: [TOWER_X + 14, 0, 18], dx: 45, dy: 18 }
];

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Torre de destilación atmosférica de petróleo crudo y productos refinados",
  body: [
    `<g data-part="base">${base()}</g>`,
    `<g data-part="furnace">${furnace()}</g>`,
    `<g data-part="tower">${tower()}</g>`,
    `<g data-part="tanks">${tanks()}</g>`,
    `<g data-part="labels">${labelsSvg(labels, at)}</g>`
  ]
});

const live = `
const stage = document.querySelector(".iso-stage");
const readout = document.querySelector('[data-corner="readout"]');

let crudeRate = 100000; // barriles por día

function update() {
  const m3 = Math.round(crudeRate * 0.158987); // 1 barril = 159 litros
  const gasolinasL = Math.round(crudeRate * 0.38 * 159);
  const dieselL = Math.round(crudeRate * 0.28 * 159);
  const turbosinaL = Math.round(crudeRate * 0.08 * 159);
  
  if (readout) {
    readout.innerHTML = '<strong>' + crudeRate.toLocaleString("es-MX") + '</strong> barriles/día de crudo &nbsp;→&nbsp; ' +
      '<span style="color:var(--cf-gold);font-weight:700">' + (gasolinasL / 1e6).toFixed(1) + 'M L</span> gasolinas · ' +
      '<span style="color:#1E5B4F;font-weight:700">' + (dieselL / 1e6).toFixed(1) + 'M L</span> diésel';
  }
}

stage.addEventListener("pointermove", (e) => {
  const rect = stage.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  crudeRate = Math.round(30000 + ratio * 170000);
  stage.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
  update();
});

stage.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "ArrowUp") { crudeRate = Math.min(200000, crudeRate + 10000); update(); }
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") { crudeRate = Math.max(30000, crudeRate - 10000); update(); }
});

update();
`;

writeFigure({
  id: "refinacion",
  title: "Torre de destilación fraccionada",
  theme,
  svg,
  controls: "",
  live,
  plate: {
    fig: "Fig. Hidrocarburos",
    title: "Torre de destilación fraccionada",
    hint: "Desliza para cambiar la tasa de procesamiento de crudo",
    ariaLabel: "Simulador de torre de destilación de refinería",
    keys: [
      { mark: "gold", label: "Cortes de gasolinas, turbosina, diésel y combustóleo" }
    ],
    caption: "El petróleo crudo entra a la torre precalentado a 370 °C; al subir por la columna fraccionadora, los vapores se enfrían y se condensan en platos recolectores según su punto de ebullición.",
  }
});
