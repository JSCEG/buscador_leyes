/**
 * "¿Cómo funciona?" · CENACE y el despacho eléctrico (MEM).
 *
 * A dispatch bench: the power plants stand on a plate in merit order, cheapest first. Each block is
 * as wide as its capacity (1 GW = 4 units along the GW ruler) and as tall as its variable cost.
 * A carriage on the front rail carries the national demand as a light curtain: every plant to its
 * left is dispatched, and the one the curtain cuts is the marginal unit, whose cost sets the energy
 * component of the PML on the CENACE console. Capacities and costs are illustrative, the same as
 * the concept's text: base and renewables 0–18 GW at ~0 $/MWh, combined cycle 18–40 GW at ~880,
 * gas turbines 40–54 GW at ~2,150.
 *
 * node scripts/conceptos/mercado-cenace.mjs [--light]  →  public/conceptos/mercado-cenace(-light).html
 */
import * as k from "../../vendor/anatomy/kit/iso-kit.mjs";
import { themeOf, inkOf, labelsSvg, writeFigure } from "./_shared.mjs";

const theme = themeOf();
const INK = inkOf(theme);
const WIDTH = 640;
const HEIGHT = 330;

// The model: three tiers in merit order. GW are illustrative capacities, costs illustrative $/MWh.
const TIERS = [
  { key: "base", name: "base y renovables", from: 0, to: 18, cost: 0 },
  { key: "ciclo", name: "ciclo combinado", from: 18, to: 40, cost: 880 },
  { key: "punta", name: "turbogás (punta)", from: 40, to: 54, cost: 2150 },
];
const GW_MAX = 54;
const D_MIN = 12;
const D_MAX = 50;
const D_REST = 34;
const MOD_GW = 2;

const X0 = -150;
const U = 4; // world units per GW
const xOf = (gw) => X0 + gw * U;
const heightOf = (cost) => 6 + (cost / 2150) * 64;
const ROW = { y: -24, d: 38 };
const PLATE = { x: -166, y: -46, w: 330, d: 104, r: 9 };
const PLATE_H = 8;
const FOOT_H = 5;
const RAIL = { x: X0 - 6, y: 24, w: GW_MAX * U + 12, d: 12, r: 2 };
const RAIL_H = 3;
const MAST_H = 86;
const DESK = { x: 96, y: -38, w: 52, d: 40, r: 3 };
const DESK_H = 16;
const DIAL = { cx: 110, cy: 2, r: 9 };

const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [xOf(54), ROW.y, 76], [X0, 30, MAST_H + 6]], WIDTH, HEIGHT, { pad: 22, azimuth: 68, elevation: 30 });
const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of k.corners(PLATE, 22).sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P))) {
    out.push(S(k.cylinder(x, y, 6.5, -PLATE_H - FOOT_H, 1.6, P, 26), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 26), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // A footprint for each tier, engraved in the plate: the merit order reads even where a block is low.
  for (const t of TIERS) out.push(L(k.planOutline({ x: xOf(t.from) + 0.5, y: ROW.y - 3, w: (t.to - t.from) * U - 1, d: ROW.d + 6, r: 1.5 }, 0, P), { tone: "faint" }));
  return out.join("");
}

// The GW ruler: a strip along the front with a tick every GW, a long one every 10.
function rail() {
  const out = [S(k.slabOf(RAIL, 0, RAIL_H, P, 4, 0.5), { tone: "hi", crease: "lo" })];
  const ticks = k.topTicks(xOf(0), xOf(GW_MAX), U, 10, RAIL.y + 1.2, RAIL_H, [2.6, 5], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(L(k.lineOnTop([xOf(0), RAIL.y + RAIL.d - 2.5], [xOf(GW_MAX), RAIL.y + RAIL.d - 2.5], RAIL_H, P), { tone: "faint" }));
  out.push(D([at([xOf(0), RAIL.y + 1.2, RAIL_H])], { size: 0.7, tone: "hi" }));
  return out.join("");
}

// One module per 2 GW, built at its place; the live code switches its state.
function modules() {
  const list = [];
  for (const t of TIERS) {
    const h = heightOf(t.cost);
    for (let gw = t.from; gw < t.to; gw += MOD_GW) {
      const x = xOf(gw) + 0.6;
      const w = MOD_GW * U - 1.2;
      const plan = { x, y: ROW.y, w, d: ROW.d, r: 0.8 };
      const parts = [S(k.slabOf(plan, 0, h, P, 2, 0.4), { tone: "hi", crease: "lo" })];
      const cx = x + w / 2;
      if (t.key === "base") {
        // Solar and hydro: a panel grid on the top.
        const grid = [];
        for (let y = ROW.y + 4; y <= ROW.y + ROW.d - 4; y += 5) grid.push(k.lineOnTop([x + 1, y], [x + w - 1, y], h, P));
        grid.push(k.lineOnTop([cx, ROW.y + 2], [cx, ROW.y + ROW.d - 2], h, P));
        parts.push(L(grid.join(""), { tone: "lo" }));
      } else if (t.key === "ciclo") {
        // Combined cycle: a heat-recovery stack on the back half, a seam band on the front.
        parts.push(S(k.cylinder(cx, ROW.y + 10, 1.8, h, 8, P, 16), { tone: "mid" }));
        parts.push(L(k.ring(cx, ROW.y + 10, 1.8, h + 8, P, 16), { tone: "lo" }));
        parts.push(L(k.lineOnTop([x + 1, ROW.y + ROW.d - 6], [x + w - 1, ROW.y + ROW.d - 6], h, P), { tone: "lo" }));
      } else {
        // Gas turbine: a short exhaust and three vent lines.
        parts.push(S(k.cylinder(cx, ROW.y + 12, 1.4, h, 5, P, 14), { tone: "mid" }));
        const vents = [0, 1, 2].map((i) => k.lineOnTop([x + 1.2, ROW.y + 22 + i * 4], [x + w - 1.2, ROW.y + 22 + i * 4], h, P));
        parts.push(L(vents.join(""), { tone: "lo" }));
      }
      list.push({ gw, depth: k.depthOf([cx, ROW.y + ROW.d / 2, 0], P), svg: `<g class="cf-mod" data-tier="${t.key}" data-a="${gw}" data-b="${gw + MOD_GW}">${parts.join("")}</g>` });
    }
  }
  // The curtain stands inside the row: behind every module to its right (nearer the viewer at this
  // azimuth), in front of the ones it has passed. The live code moves it as the demand changes.
  const sorted = list.sort((a, b) => a.depth - b.depth);
  const cut = sorted.findIndex((m) => m.gw >= D_REST);
  sorted.splice(cut < 0 ? sorted.length : cut, 0, { svg: curtain() });
  return `<g data-part="row">${sorted.map((m) => m.svg).join("")}</g>`;
}

function curtain() {
  const x = xOf(D_REST);
  const plane = k.pathOf([at([x, ROW.y - 6, 0]), at([x, ROW.y + ROW.d + 4, 0]), at([x, ROW.y + ROW.d + 4, MAST_H - 6]), at([x, ROW.y - 6, MAST_H - 6])], true);
  return `<g data-part="curtain"><path class="cf-curtain" d="${plane}"/>${L(k.segment([x, ROW.y - 6, MAST_H - 6], [x, ROW.y + ROW.d + 4, MAST_H - 6], P), { tone: "mid", className: "cf-curtain-edge" })}</g>`;
}

// The demand carriage on the rail, with its mast. Drawn at rest; the live code slides it.
function demand() {
  const x = xOf(D_REST);
  const carriage = { x: x - 6, y: RAIL.y - 1, w: 12, d: RAIL.d + 2, r: 1.5 };
  const parts = [
    S(k.slabOf(carriage, RAIL_H, 5, P, 3, 0.6), { tone: "mid" }),
    S(k.cylinder(x, RAIL.y + RAIL.d / 2, 1.5, RAIL_H + 5, MAST_H - RAIL_H - 5, P, 16), { tone: "hi", lit: true }),
    S(k.cylinder(x, RAIL.y + RAIL.d / 2, 2.6, MAST_H, 2, P, 18), { tone: "mid" }),
    D([at([x - 4, RAIL.y + 2, RAIL_H + 5]), at([x + 4, RAIL.y + 2, RAIL_H + 5])], { size: 0.5 }),
  ];
  return `<g data-part="demand">${parts.join("")}</g>`;
}

// The CENACE console: a desk with a slanted screen for the PML and a dial whose needle follows it.
function console_() {
  const out = [S(k.slabOf(DESK, 0, DESK_H, P, 3, 0.6), { tone: "mid" })];
  out.push(L(k.planOutline(k.insetPlan(DESK, 3), DESK_H, P), { tone: "lo" }));
  const screen = { x: DESK.x + 20, y: DESK.y + 4, w: 29, d: 4, r: 0.6 };
  out.push(S(k.slabOf(screen, DESK_H, 22, P, 2, 0.3), { tone: "hi", crease: "lo" }));
  // The screen face looks toward the viewer's left side (the -y face).
  const glass = [[screen.x + 2, screen.y, DESK_H + 4], [screen.x + screen.w - 2, screen.y, DESK_H + 4], [screen.x + screen.w - 2, screen.y, DESK_H + 19], [screen.x + 2, screen.y, DESK_H + 19]];
  out.push(`<path class="cf-screen" d="${k.pathOf(glass.map(at), true)}"/>`);
  const m = k.sideMatrix([screen.x + screen.w / 2, screen.y], DESK_H + 15, P, "left");
  out.push(`<g class="cf-screen-text">${k.faceTextSvg(m, "PML", { size: 3.4, tone: "hi", anchor: "middle" })}</g>`);
  out.push(`<g class="cf-screen-text">${k.faceTextSvg(k.sideMatrix([screen.x + screen.w / 2, screen.y], DESK_H + 9, P, "left"), "$880", { size: 4.6, tone: "hi", anchor: "middle" }).replace("<text", '<text data-part="pml"')}</g>`);
  out.push(S(k.cylinder(DIAL.cx, DIAL.cy, DIAL.r + 1.6, DESK_H, 1.4, P, 32), { tone: "hi", crease: "lo" }));
  const ticks = k.radialTicks(DIAL.cx, DIAL.cy, DIAL.r, 24, 4, DESK_H + 1.4, [1.6, 3], P, Math.PI * 0.75, Math.PI * 1.5);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(`<path class="cf-needle" data-part="needle" d=""/>`);
  out.push(D([at([DIAL.cx, DIAL.cy, DESK_H + 1.4])], { size: 1, tone: "hi" }));
  // Keys along the front edge of the desk.
  out.push(D([0, 1, 2, 3, 4].map((i) => at([DESK.x + 6 + i * 4, DESK.y + DESK.d - 5, DESK_H])), { size: 0.7 }));
  return out.join("");
}

const LABELS = [
  // The demand moves, so its name points at the GW ruler the carriage rides on.
  { n: 1, name: "Consumo nacional (demanda)", anchor: [xOf(6), RAIL.y + RAIL.d, RAIL_H], dx: 30, dy: 56 },
  { n: 2, name: "Base y renovables", anchor: [xOf(5), ROW.y + 4, heightOf(0)], dx: -4, dy: -46 },
  { n: 3, name: "Ciclo combinado", anchor: [xOf(22), ROW.y + 6, heightOf(880)], dx: -24, dy: -66 },
  { n: 4, name: "Turbogás (punta)", anchor: [xOf(47), ROW.y + 6, heightOf(2150)], dx: 10, dy: -34 },
  { n: 5, name: "Consola del CENACE: PML", anchor: [DESK.x + DESK.w / 2, DESK.y + DESK.d, DESK_H], dx: -36, dy: 58 },
];

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Una bancada de despacho: las centrales están en fila de la más barata a la más cara; cada bloque es tan ancho como su capacidad y tan alto como su costo. Un carro con la demanda nacional corta la fila: las centrales a su izquierda están despachadas y la que corta fija el precio en la consola del CENACE.",
  body: [
    base(),
    modules(),
    rail(),
    demand(),
    console_(),
    `<g data-part="labels">${labelsSvg(LABELS, at)}</g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const TIERS = ${JSON.stringify(TIERS)};
const U = ${U}, D_MIN = ${D_MIN}, D_MAX = ${D_MAX}, D_REST = ${D_REST};
const DIAL = ${JSON.stringify(DIAL)}, DESK_H = ${DESK_H};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const mods = [...svg.querySelectorAll(".cf-mod")].map((el) => ({ el, a: Number(el.dataset.a), b: Number(el.dataset.b) }));
const mast = svg.querySelector('[data-part="demand"]');
const curtain = svg.querySelector('[data-part="curtain"]');
const row = svg.querySelector('[data-part="row"]');
const order = [...row.children].filter((el) => el !== curtain);
const needle = svg.querySelector('[data-part="needle"]');
const pmlText = svg.querySelector('[data-part="pml"]');
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const fmt = (n) => Math.round(n).toLocaleString("es-MX");
let demandNow = D_REST, target = D_REST, last = 0, clock = 0, frame = 0, touring = true, visible = false, idle = 0, shown = "";
const tourAt = (t) => 31 + 17 * Math.sin(t * 0.32);
const tierAt = (d) => TIERS.find((t) => d > t.from && d <= t.to) || TIERS[0];
function draw() {
  const d = demandNow;
  const tier = tierAt(d);
  for (const m of mods) {
    const state = m.b <= d ? "on" : m.a < d ? "marginal" : "off";
    if (m.el.dataset.state !== state) m.el.dataset.state = state;
  }
  const shift = translateAlong(P, [(d - D_REST) * U, 0, 0]);
  mast.setAttribute("transform", shift);
  curtain.setAttribute("transform", shift);
  // Keep the curtain in its slot of the row: just before the first module it has not reached.
  const ahead = order.find((el) => Number(el.dataset.a) >= d) || null;
  if (curtain.nextElementSibling !== ahead) row.insertBefore(curtain, ahead);
  const sweep = Math.PI * 1.5, from = Math.PI * 0.75;
  const angle = from + sweep * clamp(tier.cost / 2400, 0, 1);
  // Same angle convention as the kit's radialTicks: x along sin, y along -cos.
  const tip = iso([DIAL.cx + Math.sin(angle) * 7.4, DIAL.cy - Math.cos(angle) * 7.4, DESK_H + 1.6], P);
  const tail = iso([DIAL.cx - Math.sin(angle) * 2, DIAL.cy + Math.cos(angle) * 2, DESK_H + 1.6], P);
  needle.setAttribute("d", "M" + tail[0].toFixed(2) + " " + tail[1].toFixed(2) + "L" + tip[0].toFixed(2) + " " + tip[1].toFixed(2));
  const price = "$" + fmt(tier.cost);
  if (pmlText.textContent !== price) pmlText.textContent = price;
  const text = compact
    ? fmt(d) + " GW · PML ≈ " + price + "/MWh"
    : "Demanda " + fmt(d) + " GW · última central: " + tier.name + " · PML ≈ " + price + "/MWh (energía)";
  if (text !== shown) { shown = text; readout.textContent = text; stage.setAttribute("aria-valuetext", text); }
  stage.setAttribute("aria-valuenow", String(Math.round((d - D_MIN) / (D_MAX - D_MIN) * 100)));
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) { clock += dt; target = tourAt(clock); }
  demandNow = demandNow + (target - demandNow) * (1 - Math.exp(-dt / 0.35));
  draw();
  frame = visible && !still.matches && (touring || Math.abs(target - demandNow) > 0.02) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const pause = () => { touring = false; clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; run(); }, 6000); };
const steer = (next) => { pause(); target = clamp(next, D_MIN, D_MAX); if (still.matches) { demandNow = target; draw(); } run(); };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (event) => {
  const box = svg.getBoundingClientRect();
  steer(D_MIN + clamp((event.clientX - box.left) / box.width, 0, 1) * (D_MAX - D_MIN));
});
stage.addEventListener("keydown", (event) => {
  const step = event.key === "ArrowRight" || event.key === "ArrowUp" ? 2 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -2 : 0;
  if (!step) return;
  event.preventDefault();
  steer(target + step);
});
draw();
`;

// Module states: dispatched plants in green, the marginal one in gold, idle ones stay paper.
const tones = (top, s0, s1, s2, s3) => `--anatomy-top:${top};--anatomy-shade-0:${s0};--anatomy-shade-1:${s1};--anatomy-shade-2:${s2};--anatomy-shade-3:${s3};--anatomy-face:${s0}`;
const ON = theme === "light" ? tones("#d4e7e1", "#b5d3ca", "#9fc4b8", "#a9cbc0", "#8fb8ab") : tones("#2f5a50", "#264b43", "#1f3f38", "#23453d", "#1a3630");
const MARGINAL = theme === "light" ? tones("#f3e2b4", "#e5cb86", "#d8b96c", "#dec079", "#cdae5f") : tones("#6d5622", "#5c481c", "#4d3c17", "#54421a", "#433413");
const css = `.cf-mod{transition:filter .25s}
.cf-mod[data-state="on"]{${ON}}
.cf-mod[data-state="marginal"]{${MARGINAL}}
.cf-curtain{fill:${INK.red};fill-opacity:${theme === "light" ? 0.13 : 0.2};stroke:${INK.red};stroke-width:.8;stroke-opacity:.6}
.cf-curtain-edge{stroke:${INK.red}!important}
.cf-screen{fill:${INK.screen}}
.cf-screen-text text{fill:${INK.trace}!important}
.cf-needle{fill:none;stroke:${INK.red};stroke-width:1.4;stroke-linecap:round}`;

writeFigure({
  id: "mercado-cenace",
  title: "CENACE y el despacho eléctrico",
  theme,
  svg: svg.replace("</svg>", `<style>${css}</style></svg>`),
  live,
  plate: {
    fig: "Fig 9",
    title: "Despacho por orden de mérito",
    hint: "Desliza para mover la demanda",
    ariaLabel: "Despacho del CENACE: las flechas cambian la demanda nacional",
    keys: [
      { mark: "green", label: "Centrales despachadas: entran de la más barata a la más cara" },
      { mark: "gold", label: "Unidad marginal: la última que entra fija la parte de energía del PML" },
    ],
    caption: "El CENACE ejerce el control operativo del Sistema Eléctrico Nacional (LSE, art. 124): cada momento ordena las centrales de la más barata a la más cara y despacha hasta cubrir la demanda, respetando las restricciones de seguridad de la red. La última central que entra es la unidad marginal y su costo fija la parte de energía del Precio Marginal Local; en cada nodo se le suman las pérdidas y la congestión. Capacidades y costos de la figura son ilustrativos.",
  },
});
