/**
 * "¿Cómo funciona?" · Cómo se genera la electricidad.
 *
 * A turbine wheel turns a shaft with a bar magnet (the rotor) between two copper coils on iron
 * pole pieces (the stator). As the magnet turns, the voltage in the coils swings back and forth:
 * alternating current. A needle meter shows the swing and a lamp lights with the power. The
 * pointer (or the arrows) sets the speed. A two-pole machine gives one cycle per turn, so 3,600
 * turns a minute make 60 Hz; the drawing turns slowly so the magnet can be seen, and the voltage
 * grows with the speed (120 V at 3,600 rpm in this model).
 *
 * node scripts/conceptos/generador.mjs [--light]  →  public/conceptos/generador(-light).html
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
const WHEEL_X = -126;
const WHEEL_R = 26;
const METER = [104, 34];
const LAMP = [110, -30];

const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [WHEEL_X, 0, AXIS_Z + WHEEL_R + 2], [LAMP[0], LAMP[1], 80]], WIDTH, HEIGHT, { pad: 30, azimuth: 34, elevation: 30 });
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

// Stator: an iron pole piece on a pedestal, wound with a copper coil whose axis points at the rotor.
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
  out.push(`<path class="cf-copper" d="${coilArc.front}"/>`);
  return out.join("");
}

function shaft() {
  const F = G.frameAlong([SHAFT[0], 0, AXIS_Z], [1, 0, 0]);
  const out = [S(G.disc(0, SHAFT[1] - SHAFT[0], 2.6, F, P), { tone: "mid" })];
  // Bearings on pedestals.
  for (const x of [-84, 36]) {
    out.push(S(k.slabOf({ x: x - 6, y: -8, w: 12, d: 16, r: 1.4 }, 0, AXIS_Z - 7, P, 3, 0.4), { tone: "mid" }));
    const B = G.frameAlong([x - 5, 0, AXIS_Z], [1, 0, 0]);
    out.push(S(G.disc(0, 10, 7, B, P), { tone: "mid" }));
    out.push(L(G.arcOf(B, 5, 7, P), { tone: "lo" }));
  }
  return out.join("");
}

function wheelStatic() {
  const F = G.frameAlong([WHEEL_X, 0, AXIS_Z], [1, 0, 0]);
  const out = [];
  out.push(S(G.disc(0, 5, WHEEL_R, F, P), { tone: "mid" }));
  out.push(S(G.disc(5, 9, 6, F, P), { tone: "mid" }));
  return { svg: out.join(""), F };
}

function meter() {
  const [x, y] = METER;
  const out = [];
  out.push(S(k.slabOf({ x: x - 16, y: y - 12, w: 32, d: 24, r: 2 }, 0, 10, P, 3, 0.6), { tone: "hi", crease: "lo" }));
  out.push(S(k.cylinder(x, y, 10.5, 10, 2, P, 48, 0.4), { tone: "hi", crease: "lo" }));
  const ticks = k.radialTicks(x, y, 9.4, 21, 5, 12, [1.1, 2.4], P, -1.2, 2.4);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(k.faceTextSvg(k.topMatrix([x, y + 5], 12, P, "x"), "V", { size: 3.4, tone: "mid", anchor: "middle" }));
  out.push(`<path class="iso-line" data-tone="lit" data-part="needle" d=""/>`);
  out.push(D([at([x, y, 12])], { size: 0.8, tone: "hi" }));
  return out.join("");
}

function lamp() {
  const [x, y] = LAMP;
  const out = [];
  out.push(S(k.cylinder(x, y, 11, 0, 3.4, P, 36, 0.5), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, 2, 3.4, 40, P, 16), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(x, y, 4.6, 43, 8, P, 22), { tone: "mid" }));
  const bulb = at([x, y, 61]);
  out.push(`<circle class="cf-glow" data-part="glow" cx="${bulb[0].toFixed(1)}" cy="${bulb[1].toFixed(1)}" r="18" opacity="0" style="filter:blur(6px)"/>`);
  out.push(S(G.sphereOf([x, y, 61], 9.5, P), { tone: "hi" }));
  out.push(`<circle class="cf-glow" data-part="tint" cx="${bulb[0].toFixed(1)}" cy="${bulb[1].toFixed(1)}" r="${(9.5 * P.scale).toFixed(1)}" opacity="0"/>`);
  return out.join("");
}

const coilOut = at([POLE_X.x + POLE_X.w, 46, AXIS_Z - 8]);
const toMeter = [coilOut, [at([POLE_X.x + POLE_X.w + 6, 46, 2]), at([METER[0] - 16, 46, 2])], at([METER[0] - 16, METER[1] + 6, 6])];
const toLamp = [coilOut, [at([POLE_X.x + POLE_X.w + 6, 46, 2]), at([LAMP[0] - 14, 46, 2]), at([LAMP[0] - 14, LAMP[1], 2])], at([LAMP[0] - 11, LAMP[1], 2])];
const cable = ([from, via, to]) => k.wireSvg(from, to, { via, tone: "mid" }) + k.lineSvg(k.pathOf([from, ...via, to]), { tone: "green", className: "cf-flow" });

const WHEEL = wheelStatic();
const LABELS = [
  { n: 1, name: "Turbina: algo la hace girar", anchor: [WHEEL_X + 5, 0, AXIS_Z + WHEEL_R - 4], dx: 20, dy: -50 },
  { n: 2, name: "Eje", anchor: [-60, 0, AXIS_Z + 2.6], dx: -10, dy: -62 },
  { n: 3, name: "Imán que gira (rotor)", anchor: [ROTOR[0] + 13, 0, AXIS_Z + MAG_R], dx: 30, dy: -78 },
  { n: 4, name: "Bobinas de cobre (estator)", anchor: [POLE_X.x + 15, 46, AXIS_Z + 12], dx: -60, dy: 70 },
  { n: 5, name: "Voltímetro", anchor: [METER[0], METER[1] + 10, 12], dx: 20, dy: 46 },
  { n: 6, name: "Foco", anchor: [LAMP[0] + 9, LAMP[1], 64], dx: 30, dy: -30 },
];

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Un generador sobre una base: una turbina hace girar un eje con un imán entre dos bobinas de cobre. Al girar el imán se genera corriente alterna en las bobinas, que enciende un foco; un voltímetro muestra cómo el voltaje va y viene.",
  body: [
    base(),
    pole("back"),
    shaft(),
    WHEEL.svg,
    `<g data-part="spokes"></g>`,
    `<g data-part="rotor"></g>`,
    pole("front"),
    `<g data-part="cables">${cable(toLamp)}${cable(toMeter)}</g>`,
    lamp(),
    meter(),
    `<g data-part="labels">${labelsSvg(LABELS, at)}</g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const AXIS_Z = ${AXIS_Z}, ROTOR = ${JSON.stringify(ROTOR)}, MAG_R = ${MAG_R}, WHEEL = ${JSON.stringify(WHEEL.F)}, WHEEL_R = ${WHEEL_R}, METER = ${JSON.stringify(METER)};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const rotorEl = svg.querySelector('[data-part="rotor"]');
const spokesEl = svg.querySelector('[data-part="spokes"]');
const needle = svg.querySelector('[data-part="needle"]');
const glow = svg.querySelector('[data-part="glow"]');
const tint = svg.querySelector('[data-part="tint"]');
const flows = [...svg.querySelectorAll(".cf-flow")];
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const fmt = (n, d = 0) => n.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });
let speed = 0.5, target = 0.5, angle = 0, last = 0, clock = 0, frame = 0, touring = true, visible = false, idle = 0;
const tourAt = (t) => 0.55 + 0.45 * Math.sin(t * 0.4);
function rotorSvg(a) {
  const u = [0, Math.cos(a), Math.sin(a)], v = [0, -Math.sin(a), Math.cos(a)];
  const F = frameOf([ROTOR[0], 0, AXIS_Z], [1, 0, 0], u, v);
  const half = (from, to, cls) => ({ cls, paths: prismOf(F, [[from, -4.5], [to, -4.5], [to, 4.5], [from, 4.5]], 0, ROTOR[1] - ROTOR[0], P), depth: depthOf([ROTOR[0], u[1] * (from + to) / 2, AXIS_Z + u[2] * (from + to) / 2], P) });
  return [half(0, MAG_R, "cf-north"), half(-MAG_R, 0, "cf-south")].sort((x, y) => x.depth - y.depth).map((h) => solidSvg(h.paths, { tone: "hi", crease: "lo", className: h.cls })).join("");
}
function spokesSvg(a) {
  const lines = [];
  for (let i = 0; i < 8; i++) {
    const t = a + (i * Math.PI) / 4;
    const p0 = [WHEEL.o[0] + 5, WHEEL.o[1] + Math.cos(t) * 7, WHEEL.o[2] + Math.sin(t) * 7];
    const p1 = [WHEEL.o[0] + 5, WHEEL.o[1] + Math.cos(t) * (WHEEL_R - 2), WHEEL.o[2] + Math.sin(t) * (WHEEL_R - 2)];
    lines.push(pathOf([iso(p0, P), iso(p1, P)]));
  }
  return '<path class="iso-line" data-tone="lo" d="' + lines.join("") + '"/>';
}
function draw() {
  const rpm = speed * 3600, hz = rpm / 60, volts = speed * 120;
  rotorEl.innerHTML = rotorSvg(angle);
  spokesEl.innerHTML = spokesSvg(angle);
  const swing = Math.sin(angle) * speed;
  const n = swing * 1.15;
  needle.setAttribute("d", pathOf([iso([METER[0], METER[1], 12.2], P), iso([METER[0] + Math.sin(n) * 8.4, METER[1] - Math.cos(n) * 8.4, 12.2], P)]));
  const power = speed * speed;
  glow.setAttribute("opacity", String(Math.min(0.5, power * 0.55)));
  glow.setAttribute("r", String(16 + power * 18));
  tint.setAttribute("opacity", String(power * 0.8));
  for (const line of flows) { line.style.strokeDashoffset = String(Math.sin(angle) * 10 * speed); line.style.opacity = String(0.2 + 0.8 * speed); line.style.visibility = speed > 0.03 ? "visible" : "hidden"; }
  const text = compact ? fmt(rpm) + " rpm · " + fmt(hz) + " Hz · " + fmt(volts) + " V" : fmt(rpm) + " vueltas por minuto · " + fmt(hz) + " Hz · " + fmt(volts) + " V (en cámara lenta)";
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(Math.round(speed * 100)));
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) { clock += dt; target = tourAt(clock); }
  speed = speed + (target - speed) * (1 - Math.exp(-dt / 0.5));
  angle = (angle + dt * Math.PI * 2 * 0.6 * speed) % (Math.PI * 2);
  draw();
  frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => { touring = false; target = clamp(next, 0, 1); clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; run(); }, 4000); if (still.matches) { speed = target; draw(); } run(); };
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

const I = theme === "light" ? { n: "#9B2247", s: "#1E5B4F", cu: "#b87333" } : { n: "#ea8aa8", s: "#6fc2ae", cu: "#d9915a" };
writeFigure({
  id: "generador",
  title: "Cómo se genera la electricidad",
  theme,
  svg: svg.replace("</svg>", `<style>.cf-copper{fill:none;stroke:${I.cu};stroke-width:2.2;stroke-linecap:round}.cf-north .iso-top,.cf-north .iso-shade{fill:${I.n}}.cf-south .iso-top,.cf-south .iso-shade{fill:${I.s}}.cf-north .iso-fill{fill:${I.n}}.cf-south .iso-fill{fill:${I.s}}</style></svg>`),
  live,
  lathe: ["prismOf", "frameOf"],
  plate: {
    fig: "Fig 4",
    title: "Cómo se genera la electricidad",
    hint: "Desliza para cambiar la velocidad",
    ariaLabel: "Generador: las flechas cambian la velocidad de giro",
    keys: [
      { mark: "red", label: "Polo norte del imán" },
      { mark: "green", label: "Polo sur del imán y la corriente que sale" },
    ],
    caption: "Cuando un imán gira junto a una bobina de cobre, empuja la corriente primero en un sentido y luego en el otro: corriente alterna. Así funcionan casi todas las centrales: el agua, el vapor, el gas o el viento hacen girar una turbina, y la turbina, el imán. Con dos polos, cada vuelta es un ciclo: 3,600 vueltas por minuto dan los 60 Hz de la red mexicana. En este modelo, el voltaje crece con la velocidad.",
  },
});
