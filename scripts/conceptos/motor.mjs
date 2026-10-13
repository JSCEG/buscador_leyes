/**
 * "¿Cómo funciona?" · Motor eléctrico.
 *
 * The generator run backwards: the same two iron pole pieces wound with copper coils (the stator)
 * and a bar magnet on a shaft (the rotor), but now current goes into the coils and the shaft turns
 * a fan. Current in a coil makes its pole piece a magnet (an electromagnet): the tops of the pole
 * pieces show which one is north (guinda) and which south (verde). The rotor's north is pulled to
 * the stator's south, and the current flips every half turn so the pull keeps it turning:
 * - "Corriente directa": a 12 V battery through a control box that reverses the current each half
 *   turn (the brushes and commutator of a DC motor do the same mechanically). The pointer sets the
 *   speed, as a higher voltage would.
 * - "Corriente alterna": a wall outlet; the current reverses by itself, and this synchronous motor
 *   turns in step with it: one turn per cycle, so 60 Hz gives 3,600 turns a minute. The pointer
 *   sets the frequency, as a variable-frequency drive would.
 * The drawing turns in slow motion so the magnet can be seen.
 *
 * node scripts/conceptos/motor.mjs [--light]  →  public/conceptos/motor(-light).html
 */
import * as k from "../../vendor/anatomy/kit/iso-kit.mjs";
import * as G from "../../vendor/anatomy/kit/lathe.mjs";
import { themeOf, labelsSvg, writeFigure } from "./_shared.mjs";

const theme = themeOf();
const WIDTH = 640;
const HEIGHT = 400;

const PLATE = { x: -150, y: -64, w: 300, d: 128, r: 8 };
const PLATE_H = 8;
const FOOT_H = 5;
const AXIS_Z = 42;
const SHAFT = [-128, 66];
const ROTOR = [-22, 4];
const MAG_R = 17;
const POLE_X = { x: -24, w: 30 };
const FAN_X = -126;
const FAN_R = 28;
const BATTERY = [104, 36];
const CONTROL = { x: 50, y: 30, w: 24, d: 18, r: 2 };
const OUTLET = { x: 92, y: -52, w: 30, d: 10, r: 1.2 };
const OUTLET_H = 42;

const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [FAN_X, 0, AXIS_Z + FAN_R + 2], [OUTLET.x, OUTLET.y, OUTLET_H + 4]], WIDTH, HEIGHT, { pad: 30, azimuth: 34, elevation: 30 });
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

// Stator: an iron pole piece on a pedestal, wound with a copper coil. Its top carries the live
// polarity tint (north or south) and a letter.
function pole(side) {
  const sign = side === "back" ? -1 : 1;
  const y0 = sign < 0 ? -50 : 24;
  const y1 = sign < 0 ? -24 : 50;
  const out = [];
  const pedestal = { x: POLE_X.x + 4, y: Math.min(y0, y1) + 6, w: POLE_X.w - 8, d: 14, r: 1.4 };
  out.push(S(k.slabOf(pedestal, 0, AXIS_Z - 12, P, 3, 0.4), { tone: "mid" }));
  const plan = { x: POLE_X.x, y: y0, w: POLE_X.w, d: y1 - y0, r: 1.2 };
  const coilArc = k.coil(sign < 0 ? y0 + 4 : y1 - 4, sign < 0 ? y1 - 4 : y0 + 4, [POLE_X.x + POLE_X.w / 2, AXIS_Z], 13.5, 8, "y", P);
  out.push(`<path class="cf-copper" d="${coilArc.back}"/>`);
  out.push(S(k.slabOf(plan, AXIS_Z - 12, 24, P, 3, 0.6), { tone: "mid" }));
  out.push(`<path class="cf-pole" data-pole="${side}" d="${k.planOutline(k.insetPlan(plan, 2), AXIS_Z + 12, P)}" opacity="0"/>`);
  const [cx, cy] = at([POLE_X.x + POLE_X.w / 2, (y0 + y1) / 2, AXIS_Z + 12]);
  out.push(`<text class="cf-pole-letter" data-letter="${side}" x="${cx.toFixed(1)}" y="${(cy + 4.4).toFixed(1)}" text-anchor="middle"></text>`);
  out.push(`<path class="cf-copper" d="${coilArc.front}"/>`);
  return out.join("");
}

function shaft() {
  const F = G.frameAlong([SHAFT[0], 0, AXIS_Z], [1, 0, 0]);
  const out = [S(G.disc(0, SHAFT[1] - SHAFT[0], 2.6, F, P), { tone: "mid" })];
  for (const x of [-84, 36]) {
    out.push(S(k.slabOf({ x: x - 6, y: -8, w: 12, d: 16, r: 1.4 }, 0, AXIS_Z - 7, P, 3, 0.4), { tone: "mid" }));
    const B = G.frameAlong([x - 5, 0, AXIS_Z], [1, 0, 0]);
    out.push(S(G.disc(0, 10, 7, B, P), { tone: "mid" }));
    out.push(L(G.arcOf(B, 5, 7, P), { tone: "lo" }));
  }
  return out.join("");
}

// The fan the motor turns: a hub drawn once, blades rebuilt each frame in the page.
function fanHub() {
  const F = G.frameAlong([FAN_X, 0, AXIS_Z], [1, 0, 0]);
  return { svg: S(G.disc(2, 10, 6.5, F, P), { tone: "mid" }), F };
}

function battery() {
  const [x, y] = BATTERY;
  const out = [];
  out.push(S(k.slabOf({ x: x - 18, y: y - 12, w: 36, d: 24, r: 2 }, 0, 4, P, 3, 0.4), { tone: "mid" }));
  const F = G.frameAlong([x - 16, y, 16], [1, 0, 0]);
  out.push(S(G.disc(0, 30, 11.5, F, P), { tone: "hi", crease: "lo" }));
  out.push(S(G.disc(30, 33, 4.2, F, P), { tone: "mid" }));
  out.push(L(G.arcOf(F, 8, 11.5, P), { tone: "lo" }));
  out.push(k.faceTextSvg(k.topMatrix([x - 2, y], 27.6, P, "x"), "12 V", { size: 5, tone: "mid", anchor: "middle" }));
  out.push(k.faceTextSvg(k.topMatrix([x + 12, y], 27.6, P, "x"), "+", { size: 6, tone: "hi", anchor: "middle" }));
  return out.join("");
}

// The control box that reverses the current every half turn (the job of brushes and commutator).
function control() {
  const c = CONTROL;
  const out = [S(k.slabOf(c, 0, 12, P, 3, 0.6), { tone: "hi", crease: "lo" })];
  out.push(L(k.planOutline(k.insetPlan(c, 3), 12, P), { tone: "lo" }));
  const leds = [[c.x + 7, c.y + c.d / 2], [c.x + 17, c.y + c.d / 2]];
  leds.forEach(([x, y], i) => {
    const [px, py] = at([x, y, 12]);
    out.push(`<circle class="cf-led" data-led="${i}" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="1.8"/>`);
  });
  return out.join("");
}

function outlet() {
  const o = OUTLET;
  const out = [];
  out.push(S(k.slabOf(o, 0, OUTLET_H, P, 3, 0.6), { tone: "hi", crease: "lo" }));
  const face = o.y + o.d;
  const plate = (x, z) => at([x, face, z]);
  out.push(L(k.pathOf([plate(o.x + 5, 12), plate(o.x + o.w - 5, 12), plate(o.x + o.w - 5, 34), plate(o.x + 5, 34)], true), { tone: "mid" }));
  for (const x of [o.x + 11, o.x + 19]) out.push(L(k.pathOf([plate(x, 26), plate(x, 30)]), { tone: "hi" }));
  out.push(L(k.sideRing([o.x + 15, face, 19], 1.6, "y", P), { tone: "hi" }));
  out.push(D([plate(o.x + 15, 15), plate(o.x + 15, 32)], { size: 0.6, tone: "lo" }));
  return out.join("");
}

const coilOut = at([POLE_X.x + POLE_X.w, 46, AXIS_Z - 8]);
const viaFloor = at([POLE_X.x + POLE_X.w + 6, 46, 2]);
const toControl = [coilOut, [viaFloor, at([CONTROL.x - 4, 46, 2])], at([CONTROL.x, 42, 6])];
const toBattery = [at([CONTROL.x + CONTROL.w, 40, 6]), [at([BATTERY[0] - 22, 40, 2])], at([BATTERY[0] - 17, BATTERY[1], 16])];
const toOutlet = [coilOut, [viaFloor, at([OUTLET.x + 15, 46, 2]), at([OUTLET.x + 15, OUTLET.y + OUTLET.d + 8, 2])], at([OUTLET.x + 15, OUTLET.y + OUTLET.d, 24])];
const cable = ([from, via, to], source, tone) => `<g data-cable="${source}">${k.wireSvg(from, to, { via, tone: "mid" })}${k.lineSvg(k.pathOf([from, ...via, to]), { tone, className: "cf-flow" })}</g>`;

const FAN = fanHub();
const LABELS = [
  { n: 1, name: "Ventilador: lo que mueve el motor", anchor: [FAN_X + 4, 0, AXIS_Z + 7], dx: 10, dy: -78 },
  { n: 2, name: "Imán que gira (rotor)", anchor: [ROTOR[0] + 13, 0, AXIS_Z + MAG_R], dx: 30, dy: -78 },
  { n: 3, name: "Bobinas: electroimanes (estator)", anchor: [POLE_X.x + 15, 46, AXIS_Z + 12], dx: -60, dy: 70 },
  { n: 4, name: "Control: invierte la corriente", anchor: [CONTROL.x + 12, CONTROL.y + 9, 12], dx: -20, dy: 66 },
  { n: 5, name: "Pila (corriente directa)", anchor: [BATTERY[0] + 4, BATTERY[1], 27.5], dx: 10, dy: 52 },
  { n: 6, name: "Contacto (corriente alterna)", anchor: [OUTLET.x + 15, OUTLET.y + 4, OUTLET_H], dx: 10, dy: -42 },
];

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Un motor eléctrico sobre una base: dos bobinas de cobre sobre piezas de hierro rodean un imán montado en un eje que mueve un ventilador. La corriente convierte las bobinas en imanes que jalan y empujan al imán del eje. Se puede conectar a una pila, con un control que invierte la corriente cada media vuelta, o a un contacto de corriente alterna, que se invierte sola.",
  body: [
    base(),
    pole("back"),
    shaft(),
    `<g data-part="fan"></g>`,
    FAN.svg,
    `<g data-part="rotor"></g>`,
    pole("front"),
    outlet(),
    `<g data-part="cables">${cable(toOutlet, "ca", "green")}${cable(toControl, "cd", "red")}${cable(toBattery, "cd", "red")}</g>`,
    control(),
    battery(),
    `<g data-part="labels">${labelsSvg(LABELS, at)}</g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const AXIS_Z = ${AXIS_Z}, ROTOR = ${JSON.stringify(ROTOR)}, MAG_R = ${MAG_R}, FAN = ${JSON.stringify(FAN.F)}, FAN_R = ${FAN_R};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const rotorEl = svg.querySelector('[data-part="rotor"]');
const fanEl = svg.querySelector('[data-part="fan"]');
const poles = { back: svg.querySelector('[data-pole="back"]'), front: svg.querySelector('[data-pole="front"]') };
const letters = { back: svg.querySelector('[data-letter="back"]'), front: svg.querySelector('[data-letter="front"]') };
const leds = [...svg.querySelectorAll(".cf-led")];
const cables = [...svg.querySelectorAll("[data-cable]")];
const readout = document.querySelector("[data-readout]");
const chips = [...document.querySelectorAll("[data-source]")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const fmt = (n, d = 0) => n.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });
let source = "cd", speed = 0.6, target = 0.6, angle = 0.3, last = 0, clock = 0, frame = 0, touring = true, visible = false, idle = 0;
const tourAt = (t) => 0.6 + 0.35 * Math.sin(t * 0.45);
function setSource(next) {
  source = next;
  chips.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.source === next)));
  cables.forEach((c) => { c.style.opacity = c.dataset.cable === next ? "1" : "0.25"; });
  draw();
}
function rotorSvg(a) {
  const u = [0, Math.cos(a), Math.sin(a)], v = [0, -Math.sin(a), Math.cos(a)];
  const F = frameOf([ROTOR[0], 0, AXIS_Z], [1, 0, 0], u, v);
  const half = (from, to, cls) => ({ cls, paths: prismOf(F, [[from, -4.5], [to, -4.5], [to, 4.5], [from, 4.5]], 0, ROTOR[1] - ROTOR[0], P), depth: depthOf([ROTOR[0], u[1] * (from + to) / 2, AXIS_Z + u[2] * (from + to) / 2], P) });
  return [half(0, MAG_R, "cf-north"), half(-MAG_R, 0, "cf-south")].sort((x, y) => x.depth - y.depth).map((h) => solidSvg(h.paths, { tone: "hi", crease: "lo", className: h.cls })).join("");
}
function fanSvg(a) {
  const blades = [];
  for (let i = 0; i < 4; i++) {
    const t = a + (i * Math.PI) / 2;
    const point = (r, w) => iso([FAN.o[0] + 4 + w * 3, FAN.o[1] + Math.cos(t + w * 0.32) * r, FAN.o[2] + Math.sin(t + w * 0.32) * r], P);
    const pts = [point(6, -0.4), point(FAN_R, -1), point(FAN_R + 1, 0), point(FAN_R, 1), point(6, 0.4)];
    blades.push({ d: pathOf(pts, true), depth: depthOf([FAN.o[0], Math.cos(t) * 14, FAN.o[2] + Math.sin(t) * 14], P) });
  }
  return blades.sort((x, y) => x.depth - y.depth).map((b) => '<path class="cf-blade" d="' + b.d + '"/>').join("");
}
// Current in the coils: the control flips it each half turn (DC); the outlet's sine flips by itself (AC).
// Positive current makes the front pole north and the back pole south, which pulls the rotor's north round.
function current(a) { return source === "cd" ? (Math.sin(a) >= 0 ? 1 : -1) : Math.sin(a); }
function draw() {
  rotorEl.innerHTML = rotorSvg(angle);
  fanEl.innerHTML = fanSvg(angle);
  const i = current(angle), on = speed > 0.03;
  const strength = on ? Math.abs(i) : 0;
  const frontNorth = i >= 0;
  for (const [side, north] of [["front", frontNorth], ["back", !frontNorth]]) {
    poles[side].setAttribute("class", "cf-pole " + (north ? "is-north" : "is-south"));
    poles[side].setAttribute("opacity", String(0.15 + 0.75 * strength));
    letters[side].textContent = strength > 0.25 ? (north ? "N" : "S") : "";
  }
  leds.forEach((led, n) => led.classList.toggle("is-on", source === "cd" && on && (n === 0) === (i > 0)));
  for (const c of cables) {
    const line = c.querySelector(".cf-flow");
    const live = c.dataset.cable === source && on;
    line.style.visibility = live ? "visible" : "hidden";
    line.style.strokeDashoffset = String(source === "cd" ? -clock * 14 * speed : Math.sin(angle) * 10);
  }
  const rpm = source === "cd" ? speed * 3000 : speed * 3600, hz = speed * 60;
  const text = source === "cd"
    ? (compact ? "Directa · " + fmt(rpm) + " rpm" : "Corriente directa · " + fmt(rpm) + " vueltas por minuto · se invierte 2 veces por vuelta")
    : (compact ? "Alterna · " + fmt(hz) + " Hz · " + fmt(rpm) + " rpm" : "Corriente alterna · " + fmt(hz) + " Hz → " + fmt(rpm) + " vueltas por minuto (en cámara lenta)");
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(Math.round(speed * 100)));
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  clock += dt;
  if (touring) { target = tourAt(clock); const want = Math.floor(clock / 8) % 2 ? "ca" : "cd"; if (want !== source) setSource(want); }
  speed = speed + (target - speed) * (1 - Math.exp(-dt / 0.5));
  angle = (angle + dt * Math.PI * 2 * 0.6 * speed) % (Math.PI * 2);
  draw();
  frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const pause = () => { touring = false; clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; run(); }, 6000); };
chips.forEach((b) => b.addEventListener("click", (event) => { event.stopPropagation(); pause(); setSource(b.dataset.source); run(); }));
const steer = (next) => { pause(); target = clamp(next, 0, 1); if (still.matches) { speed = target; draw(); } run(); };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (event) => { const box = svg.getBoundingClientRect(); steer(clamp((event.clientX - box.left) / box.width, 0, 1)); });
stage.addEventListener("keydown", (event) => {
  const step = event.key === "ArrowRight" || event.key === "ArrowUp" ? 0.1 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -0.1 : 0;
  if (!step) return;
  event.preventDefault();
  steer(Math.round((target + step) * 10) / 10);
});
setSource("cd");
`;

const I = theme === "light"
  ? { n: "#9B2247", s: "#1E5B4F", cu: "#b87333", blade: "#d9dde2", led: "#e2b85a", off: "#c8c2bb" }
  : { n: "#ea8aa8", s: "#6fc2ae", cu: "#d9915a", blade: "#4a5059", led: "#f2d27d", off: "#4a4245" };
writeFigure({
  id: "motor",
  title: "Motor eléctrico",
  theme,
  svg: svg.replace("</svg>", `<style>.cf-copper{fill:none;stroke:${I.cu};stroke-width:2.2;stroke-linecap:round}.cf-north .iso-top,.cf-north .iso-shade,.cf-north .iso-fill{fill:${I.n}}.cf-south .iso-top,.cf-south .iso-shade,.cf-south .iso-fill{fill:${I.s}}.cf-pole.is-north{fill:${I.n}}.cf-pole.is-south{fill:${I.s}}.cf-pole-letter{fill:#fff;font:800 12px ui-sans-serif,system-ui,sans-serif;pointer-events:none}.cf-blade{fill:${I.blade};stroke:var(--anatomy-mid);stroke-width:.7;stroke-linejoin:round}.cf-led{fill:${I.off};stroke:var(--anatomy-mid);stroke-width:.5}.cf-led.is-on{fill:${I.led}}</style></svg>`),
  controls: `<div class="cf-chips" role="group" aria-label="Fuente de corriente"><button type="button" data-source="cd" aria-pressed="true">Corriente directa</button><button type="button" data-source="ca" aria-pressed="false">Corriente alterna</button></div>`,
  live,
  lathe: ["prismOf", "frameOf"],
  plate: {
    fig: "Fig 3",
    title: "Motor eléctrico",
    hint: "Desliza para cambiar la velocidad",
    ariaLabel: "Motor eléctrico: las flechas cambian la velocidad",
    keys: [
      { mark: "red", label: "Polo norte" },
      { mark: "green", label: "Polo sur" },
    ],
    caption: "Un motor es un generador al revés. La corriente convierte cada bobina en un imán (un electroimán); el polo norte del imán del eje es jalado por el polo sur de las bobinas y empujado por el norte. Para que siga girando, la corriente de las bobinas se invierte cada media vuelta. Con corriente directa lo hace un control (o, en motores sencillos, unas escobillas que rozan el eje). Con corriente alterna se invierte sola: este motor gira al ritmo de la red, una vuelta por ciclo, 3,600 por minuto a 60 Hz. Los motores de alterna más comunes son de inducción: su rotor no lleva imán; la corriente aparece en él por inducción.",
  },
});
