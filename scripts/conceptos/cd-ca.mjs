/**
 * "¿Cómo funciona?" · Corriente directa y corriente alterna.
 *
 * An oscilloscope on a bench, fed either by a 12 V battery (direct current) or by a wall outlet
 * (alternating current, 127 V and 60 Hz in Mexico: the voltage swings between about +180 V and
 * −180 V, 60 cycles a second, so the current changes direction 120 times a second). The screen
 * draws the voltage over time, slowed down so one cycle lasts about a second; the pulses on the
 * cable run one way with the battery and back and forth with the outlet.
 *
 * node scripts/conceptos/cd-ca.mjs [--light]  →  public/conceptos/cd-ca(-light).html
 */
import * as k from "../../vendor/anatomy/kit/iso-kit.mjs";
import * as G from "../../vendor/anatomy/kit/lathe.mjs";
import { themeOf, labelsSvg, writeFigure } from "./_shared.mjs";

const theme = themeOf();
const WIDTH = 640;
const HEIGHT = 400;

const PLATE = { x: -140, y: -62, w: 280, d: 124, r: 8 };
const PLATE_H = 8;
const FOOT_H = 5;
const SCOPE = { x: -46, y: -40, w: 92, d: 48, r: 3 };
const SCOPE_H = 56;
const FRONT = SCOPE.y + SCOPE.d;
const SCREEN = { x0: SCOPE.x + 8, x1: SCOPE.x + 62, z0: 14, z1: 48 };
const BATTERY = [-96, 36];
const OUTLET = { x: 84, y: 8, w: 30, d: 14, r: 2 };
const OUTLET_H = 40;

const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [SCOPE.x, SCOPE.y, SCOPE_H + 4], [OUTLET.x + OUTLET.w, OUTLET.y, OUTLET_H]], WIDTH, HEIGHT, { pad: 30, azimuth: 34, elevation: 30 });
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

const onFace = (x, z) => at([x, FRONT, z]);
function scope() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(SCOPE, -2), 0, 0.1, P)}" style="filter:blur(4px)"/>`);
  for (const [x, y] of k.corners(SCOPE, 6)) out.push(S(k.cylinder(x, y, 2.6, 0, 2.2, P, 16), { tone: "lo" }));
  out.push(S(k.slabOf(SCOPE, 2.2, SCOPE_H, P, 4, 0.8), { tone: "hi", crease: "lo", inner: L(k.sideSeam(SCOPE, 2.2 + SCOPE_H - 6, P, 4), { tone: "faint" }) }));
  for (let i = 0; i < 7; i++) {
    const y = SCOPE.y + 8 + i * 5;
    out.push(L(k.segment([SCOPE.x + SCOPE.w, y, 16], [SCOPE.x + SCOPE.w, y, 42], P), { tone: "lo" }));
  }
  // Screen with its grid: the trace is drawn by the live code in the same plane.
  const { x0, x1, z0, z1 } = SCREEN;
  const frame = k.pathOf([onFace(x0, z0), onFace(x1, z0), onFace(x1, z1), onFace(x0, z1)], true);
  out.push(`<path class="cf-screen" d="${frame}"/>`);
  const grid = [];
  for (let i = 1; i < 8; i++) { const x = x0 + ((x1 - x0) * i) / 8; grid.push(k.pathOf([onFace(x, z0), onFace(x, z1)])); }
  for (let i = 1; i < 6; i++) { const z = z0 + ((z1 - z0) * i) / 6; grid.push(k.pathOf([onFace(x0, z), onFace(x1, z)])); }
  out.push(`<path class="cf-grid" d="${grid.join("")}"/>`);
  out.push(`<path class="cf-axis" d="${k.pathOf([onFace(x0, (z0 + z1) / 2), onFace(x1, (z0 + z1) / 2)])}"/>`);
  out.push(`<path class="cf-trace" data-part="trace" d=""/>`);
  out.push(L(frame, { tone: "mid" }));
  out.push(k.faceTextSvg(k.sideMatrix([x0 + 1, FRONT], z1 + 4, P, "left"), "VOLTAJE EN EL TIEMPO", { size: 3.2, tone: "mid" }));
  // Knobs to the right of the screen.
  for (const [x, z] of [[SCOPE.x + 72, 40], [SCOPE.x + 84, 40], [SCOPE.x + 72, 26], [SCOPE.x + 84, 26]]) {
    const F = G.frameAlong([x, FRONT, z], [0, 1, 0]);
    out.push(S(G.disc(0, 3, 4, F, P), { tone: "mid" }));
    out.push(L(G.ribsOf(F, 0.4, 2.8, 4, 18, P, { seams: true }), { tone: "lo" }));
  }
  // Probe socket.
  const socket = G.frameAlong([SCOPE.x + 78, FRONT, 12], [0, 1, 0]);
  out.push(S(G.disc(0, 2.6, 3.4, socket, P), { tone: "mid" }));
  return out.join("");
}

function battery() {
  const [x, y] = BATTERY;
  const out = [];
  const holder = { x: x - 18, y: y - 12, w: 36, d: 24, r: 2 };
  out.push(S(k.slabOf(holder, 0, 4, P, 3, 0.4), { tone: "mid" }));
  const F = G.frameAlong([x - 16, y, 16], [1, 0, 0]);
  out.push(S(G.disc(0, 30, 11.5, F, P), { tone: "hi", crease: "lo" }));
  out.push(S(G.disc(30, 33, 4.2, F, P), { tone: "mid" }));
  out.push(L(G.arcOf(F, 8, 11.5, P), { tone: "lo" }));
  out.push(k.faceTextSvg(k.topMatrix([x - 2, y], 27.6, P, "x"), "12 V", { size: 5, tone: "mid", anchor: "middle" }));
  out.push(k.faceTextSvg(k.topMatrix([x + 12, y], 27.6, P, "x"), "+", { size: 6, tone: "hi", anchor: "middle" }));
  return out.join("");
}

function outlet() {
  const o = OUTLET;
  const out = [];
  out.push(S(k.slabOf(o, 0, OUTLET_H, P, 3, 0.6), { tone: "hi", crease: "lo" }));
  const face = o.y + o.d;
  const plate = (x, z) => at([x, face, z]);
  out.push(L(k.pathOf([plate(o.x + 5, 12), plate(o.x + o.w - 5, 12), plate(o.x + o.w - 5, 34), plate(o.x + 5, 34)], true), { tone: "mid" }));
  // Two flat slots and the round ground, as in a Mexican outlet.
  for (const x of [o.x + 11, o.x + 19]) out.push(L(k.pathOf([plate(x, 26), plate(x, 30)]), { tone: "hi" }));
  out.push(L(k.sideRing([o.x + 15, face, 19], 1.6, "y", P), { tone: "hi" }));
  out.push(D([plate(o.x + 15, 15), plate(o.x + 15, 32)], { size: 0.6, tone: "lo" }));
  out.push(k.faceTextSvg(k.sideMatrix([o.x + 5, face], 39, P, "left"), "127 V · 60 Hz", { size: 3.2, tone: "mid" }));
  return out.join("");
}

const probeFrom = { pila: at([BATTERY[0] + 17, BATTERY[1], 16]), contacto: at([OUTLET.x + 15, OUTLET.y + OUTLET.d, 26]) };
const probeTo = at([SCOPE.x + 78, FRONT + 2.6, 12]);
const cableVia = { pila: [at([BATTERY[0] + 22, BATTERY[1] + 4, 2]), at([SCOPE.x + 78, FRONT + 14, 2])], contacto: [at([OUTLET.x + 15, OUTLET.y + OUTLET.d + 8, 6]), at([SCOPE.x + 78, FRONT + 14, 2])] };
const cablePath = (source) => k.pathOf([probeFrom[source], ...cableVia[source], probeTo]);

const LABELS = [
  { n: 1, name: "Pila (corriente directa)", anchor: [BATTERY[0] - 2, BATTERY[1], 27.5], dx: -30, dy: 92 },
  { n: 2, name: "Contacto (corriente alterna)", anchor: [OUTLET.x + 15, OUTLET.y + 4, OUTLET_H], dx: 0, dy: -50 },
  { n: 3, name: "Osciloscopio", anchor: [SCOPE.x + 46, SCOPE.y + 24, SCOPE_H + 2.2], dx: -40, dy: -40 },
  { n: 4, name: "Pantalla: voltaje en el tiempo", anchor: [SCREEN.x0 + 4, FRONT, SCREEN.z0 + 4], dx: -40, dy: 70 },
  { n: 5, name: "Cable de medición", anchor: [SCOPE.x + 78, FRONT + 14, 2], dx: 34, dy: 50 },
];

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Un osciloscopio sobre una mesa, con una pila de 12 volts y un contacto de pared. Conectado a la pila, su pantalla muestra una línea recta: corriente directa. Conectado al contacto, muestra una onda que sube y baja 60 veces por segundo: corriente alterna.",
  body: [
    base(),
    scope(),
    battery(),
    outlet(),
    `<g data-part="cable"><path class="iso-line cf-cable" data-tone="mid" d="M0 0"/><path class="iso-line cf-flow" data-tone="red" d="M0 0"/><circle class="iso-wire-end" data-part="end-a" r="1.2"/><circle class="iso-wire-end" cx="${probeTo[0].toFixed(1)}" cy="${probeTo[1].toFixed(1)}" r="1.2"/></g>`,
    `<g data-part="labels">${labelsSvg(LABELS, at)}</g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const SCREEN = ${JSON.stringify(SCREEN)}, FRONT = ${FRONT};
const CABLES = ${JSON.stringify({ pila: cablePath("pila"), contacto: cablePath("contacto") })};
const ENDS = ${JSON.stringify(probeFrom)};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const trace = svg.querySelector('[data-part="trace"]');
const cable = svg.querySelector(".cf-cable");
const flow = svg.querySelector(".cf-flow");
const endA = svg.querySelector('[data-part="end-a"]');
const readout = document.querySelector("[data-readout]");
const chips = [...document.querySelectorAll("[data-source]")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
let source = "pila", phase = 0, last = 0, frame = 0, visible = false, touring = true, clock = 0, idle = 0;
const onFace = (x, z) => iso([x, FRONT, z], P);
function setSource(next) {
  source = next;
  chips.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.source === next)));
  cable.setAttribute("d", CABLES[next]);
  flow.setAttribute("d", CABLES[next]);
  flow.setAttribute("data-tone", next === "pila" ? "red" : "green");
  endA.setAttribute("cx", ENDS[next][0].toFixed(1));
  endA.setAttribute("cy", ENDS[next][1].toFixed(1));
  draw();
}
function draw() {
  const { x0, x1, z0, z1 } = SCREEN;
  const mid = (z0 + z1) / 2, amp = (z1 - z0) * 0.4;
  const points = [];
  for (let i = 0; i <= 80; i++) {
    const t = i / 80;
    const value = source === "pila" ? 0.55 : Math.sin(t * Math.PI * 4 - phase);
    points.push(onFace(x0 + 1 + (x1 - x0 - 2) * t, mid + value * amp));
  }
  trace.setAttribute("d", pathOf(points));
  const offset = source === "pila" ? -phase * 9 : Math.sin(phase) * 14;
  flow.style.strokeDashoffset = String(offset);
  const text = source === "pila" ? "Directa · 12 V constantes · siempre en el mismo sentido" : (compact ? "Alterna · 127 V · 60 Hz" : "Alterna · 127 V · 60 Hz · cambia de sentido 120 veces por segundo");
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  phase += dt * Math.PI * 2 * 0.9;
  if (touring) { clock += dt; const want = Math.floor(clock / 5) % 2 ? "contacto" : "pila"; if (want !== source) setSource(want); }
  draw();
  frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
chips.forEach((b) => b.addEventListener("click", (event) => { event.stopPropagation(); touring = false; clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; clock = source === "pila" ? 0 : 5; run(); }, 8000); setSource(b.dataset.source); run(); }));
stage.addEventListener("keydown", (event) => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); touring = false; setSource(source === "pila" ? "contacto" : "pila"); } });
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
setSource("pila");
`;

writeFigure({
  id: "cd-ca",
  title: "Corriente directa y alterna",
  theme,
  svg: svg.replace("</svg>", `<style>.cf-axis{fill:none;stroke:#7ff0c6;stroke-width:.5;opacity:.6}.cf-cable{fill:none}</style></svg>`),
  controls: `<div class="cf-chips" role="group" aria-label="Fuente"><button type="button" data-source="pila" aria-pressed="true">Pila</button><button type="button" data-source="contacto" aria-pressed="false">Contacto de pared</button></div>`,
  live,
  plate: {
    fig: "Fig 2",
    title: "Corriente directa y alterna",
    hint: "Elige la fuente arriba",
    ariaLabel: "Osciloscopio: las flechas cambian entre la pila y el contacto",
    keys: [
      { mark: "red", label: "Directa: la corriente va siempre en un sentido" },
      { mark: "green", label: "Alterna: va y viene, 60 veces por segundo" },
    ],
    caption: "Una pila da corriente directa: el voltaje es constante y la corriente fluye siempre en el mismo sentido. La red eléctrica entrega corriente alterna: en México, el contacto de una casa da 127 V a 60 Hz; el voltaje sube y baja 60 veces por segundo y la corriente cambia de sentido 120 veces. La pantalla va en cámara lenta para que se vea la onda.",
  },
});
