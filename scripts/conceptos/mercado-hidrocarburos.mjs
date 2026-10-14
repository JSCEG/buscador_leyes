/**
 * "¿Cómo funciona?" · Precios y mercado de combustibles (Anatomía isométrica y simulador de precios).
 *
 * A model on a base: a modern service station fuel dispenser island with digital price displays,
 * nozzle holsters, and an interactive crude-to-pump economic simulator.
 * Moving the slider adjusts the international crude benchmark (40 to 120 USD/barril), demonstrating
 * how the Mexican counter-cyclical IEPS fiscal stimulus protects consumers from sharp spikes.
 *
 * node scripts/conceptos/mercado-hidrocarburos.mjs [--light]  →  public/conceptos/mercado-hidrocarburos(-light).html
 */
import * as k from "../../vendor/anatomy/kit/iso-kit.mjs";
import { themeOf, labelsSvg, writeFigure } from "./_shared.mjs";

const theme = themeOf();
const WIDTH = 640;
const HEIGHT = 400;

const PLATE = { x: -130, y: -55, w: 260, d: 110, r: 8 };
const PLATE_H = 8;
const FOOT_H = 5;

const P = k.fitProjection([
  ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
  [-60, 0, 85],
  [60, 0, 85],
  [0, 0, 95]
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

// Fueling island concrete curb
function island() {
  const curb = { x: -50, y: -26, w: 100, d: 52, r: 8 };
  return S(k.slabOf(curb, 0, 7, P, 6, 0.4), { tone: "lo" });
}

// Fuel dispenser pump unit
function dispenser() {
  const out = [];
  // Main cabinet lower body
  const lower = { x: -22, y: -16, w: 44, d: 32, r: 3 };
  out.push(S(k.slabOf(lower, 7, 38, P, 4, 0.8), { tone: "mid" }));
  
  // Upper digital display head
  const upper = { x: -26, y: -18, w: 52, d: 36, r: 3 };
  out.push(S(k.slabOf(upper, 45, 34, P, 4, 0.8), { tone: "hi" }));

  // Digital readout screens on front face
  const screenP1 = at([-18, 18.5, 52]);
  const screenP2 = at([18, 18.5, 52]);
  const screenP3 = at([18, 18.5, 72]);
  const screenP4 = at([-18, 18.5, 72]);
  out.push(`<polygon points="${screenP1.join(",")} ${screenP2.join(",")} ${screenP3.join(",")} ${screenP4.join(",")}" fill="#0f2a24" stroke="var(--cf-border)" stroke-width="0.8"/>`);
  // Text inside digital screen
  const screenCenter = at([0, 18.5, 62]);
  out.push(`<text id="pump-price-text" x="${screenCenter[0].toFixed(1)}" y="${(screenCenter[1] + 4).toFixed(1)}" text-anchor="middle" font-family="monospace" font-weight="700" font-size="12" fill="#7ff0c6">$24.15 / L</text>`);

  // Side nozzle holsters & hoses (green regular, red premium, black diesel)
  const hoses = [
    { x: -24, color: "#1E5B4F", name: "regular" },
    { x: 24, color: "#9B2247", name: "premium" }
  ];
  for (const h of hoses) {
    const h1 = at([h.x, 0, 42]);
    const h2 = at([h.x + (h.x > 0 ? 12 : -12), 0, 16]);
    const h3 = at([h.x + (h.x > 0 ? 8 : -8), 0, 26]);
    out.push(`<path d="M${h1.join(" ")} Q${h2.join(" ")} ${h3.join(" ")}" stroke="${h.color}" stroke-width="3" stroke-linecap="round" fill="none"/>`);
    // Nozzle pistol
    out.push(S(k.cylinder(h.x + (h.x > 0 ? 8 : -8), 0, 3, 26, 8, P, 12), { tone: "hi" }));
  }

  // Crash barrier bollards (bolardos de protección) at the island ends
  for (const x of [-40, 40]) {
    out.push(S(k.cylinder(x, 0, 4, 7, 24, P, 18), { tone: "hi" }));
    out.push(L(k.ring(x, 0, 4.2, 28, P, 18), { tone: "lo" }));
  }

  return out.join("");
}

const labels = [
  { n: 1, name: "Dispensario de combustibles multilínea", anchor: [0, 0, 75], dx: -45, dy: -28 },
  { n: 2, name: "Pantalla digital de litros y precio vigente", anchor: [0, 18, 62], dx: -40, dy: -12 },
  { n: 3, name: "Manguera con pistola de corte automático", anchor: [-24, 0, 30], dx: -35, dy: 14 },
  { n: 4, name: "Isla de concreto y barrera de protección", anchor: [40, 0, 22], dx: 35, dy: -20 },
  { n: 5, name: "Precio supervisado por la CNE", anchor: [0, -16, 75], dx: 45, dy: -26 }
];

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Dispensario de combustibles y estructura de precios al consumidor",
  body: [
    `<g data-part="base">${base()}</g>`,
    `<g data-part="island">${island()}</g>`,
    `<g data-part="dispenser">${dispenser()}</g>`,
    `<g data-part="labels">${labelsSvg(labels, at)}</g>`
  ]
});

const live = `
const stage = document.querySelector(".iso-stage");
const readout = document.querySelector('[data-corner="readout"]');
const pumpText = document.querySelector("#pump-price-text");

let crudePriceUsd = 75; // USD por barril (WTI / Brent)

function update() {
  // Conversión económica simplificada al modelo mexicano
  // 1 barril = 159 litros. Tipo de cambio ~19.50 MXN/USD
  const moleculaMx = (crudePriceUsd * 19.5 / 159) * 1.35; // ~12.50 MXN a 75 USD
  const logistica = 2.45; // transporte marítimo, ducto y TAR
  const margenEstacion = 1.85; // utilidad y operación gasolinera
  
  // Estímulo fiscal al IEPS contracíclico: si el crudo supera 70 USD, Hacienda subsidia parte del IEPS
  const iepsBase = 6.17;
  const estimuloHacienda = crudePriceUsd > 70 ? Math.min(5.5, (crudePriceUsd - 70) * 0.12) : 0;
  const iepsNeto = Math.max(0.67, iepsBase - estimuloHacienda);
  const iva = (moleculaMx + logistica + margenEstacion + iepsNeto) * 0.16;
  const precioFinal = moleculaMx + logistica + margenEstacion + iepsNeto + iva;

  if (pumpText) {
    pumpText.textContent = "$" + precioFinal.toFixed(2) + " / L";
  }

  if (readout) {
    readout.innerHTML = 'Crudo de referencia: <strong style="color:var(--cf-gold);font-size:16px">$' + crudePriceUsd + ' USD/barril</strong> &nbsp;→&nbsp; ' +
      'Precio en bomba: <strong style="color:var(--cf-accent);font-size:17px">$' + precioFinal.toFixed(2) + ' / litro</strong><br>' +
      '<span style="font-size:13px;opacity:0.85">Molécula: $' + moleculaMx.toFixed(2) + ' · Logística: $' + logistica.toFixed(2) + ' · Margen: $' + margenEstacion.toFixed(2) + ' · IEPS neto: $' + iepsNeto.toFixed(2) + (estimuloHacienda > 0 ? ' (Hacienda subsidia $' + estimuloHacienda.toFixed(2) + ')' : '') + ' · IVA: $' + iva.toFixed(2) + '</span>';
  }
}

stage.addEventListener("pointermove", (e) => {
  const rect = stage.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  crudePriceUsd = Math.round(40 + ratio * 80);
  stage.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
  update();
});

stage.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" || e.key === "ArrowUp") { crudePriceUsd = Math.min(120, crudePriceUsd + 5); update(); }
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") { crudePriceUsd = Math.max(40, crudePriceUsd - 5); update(); }
});

update();
`;

writeFigure({
  id: "mercado-hidrocarburos",
  title: "Precios y mercado de combustibles",
  theme,
  svg,
  controls: "",
  live,
  plate: {
    fig: "Fig. Hidrocarburos",
    title: "Estructura del precio de gasolinas al público",
    hint: "Desliza el cursor para simular el impacto del precio internacional del crudo",
    ariaLabel: "Simulador de formación de precios de combustibles",
    keys: [
      { mark: "gold", label: "Dispensario de estación de servicio con desglose de impuestos y logística" }
    ],
    caption: "El precio en la bomba no depende solo del petróleo: se integra por el costo de importación de la molécula, el flete marítimo, el poliducto, el margen del gasolinero y el IEPS con su estímulo fiscal semanal."
  }
});
