/**
 * "¿Cómo funciona?" · Voltaje, corriente y potencia.
 *
 * A bench power supply with a voltage knob, a voltmeter and an ammeter, two cables and a 12 V,
 * 24 W lamp. Turning the knob (pointer or arrows) sets the voltage from 0 to 12 V; the lamp is a
 * fixed 6 Ω load, so the current is V / 6 (Ohm's law) and the power V × I. The lamp glows with the
 * power and the pulses on the cables run with the current.
 *
 * node scripts/conceptos/voltaje.mjs [--light]  →  public/conceptos/voltaje(-light).html
 */
import * as k from "../../vendor/anatomy/kit/iso-kit.mjs";
import * as G from "../../vendor/anatomy/kit/lathe.mjs";
import { themeOf, labelsSvg, writeFigure } from "./_shared.mjs";

const theme = themeOf();
const WIDTH = 640;
const HEIGHT = 400;
const R_LAMP = 6;
const V_MAX = 12;

const PLATE = { x: -130, y: -64, w: 262, d: 128, r: 8 };
const PLATE_H = 8;
const FOOT_H = 5;
const PSU = { x: -112, y: -34, w: 78, d: 46, r: 3 };
const PSU_H = 40;
const FRONT = PSU.y + PSU.d;
const LAMP = [74, -6];

const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [LAMP[0], LAMP[1], 92], [PSU.x, PSU.y, PSU_H + 4]], WIDTH, HEIGHT, { pad: 30, azimuth: 36, elevation: 32 });
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
  const strip = { x: PLATE.x + 14, y: PLATE.y + PLATE.d - 14, w: PLATE.w - 28, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 5, 5, strip.y + 0.8, 0.6, [2, 3.4], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  return out.join("");
}

// Screen on the front face: a dark window with digits written by the live code.
const facePoint = (x, z) => [x, FRONT, z];
function screen(x0, x1, z0, z1, part, unit) {
  const out = [];
  out.push(`<path class="cf-screen" d="${k.pathOf([at(facePoint(x0, z0)), at(facePoint(x1, z0)), at(facePoint(x1, z1)), at(facePoint(x0, z1))], true)}"/>`);
  out.push(L(k.pathOf([at(facePoint(x0, z0)), at(facePoint(x1, z0)), at(facePoint(x1, z1)), at(facePoint(x0, z1))], true), { tone: "mid" }));
  out.push(`<text class="cf-digits" data-part="${part}" transform="${k.sideMatrix([x1 - 3, FRONT], z0 + 3.2, P, "left")}" font-size="7.2" text-anchor="end">0.0</text>`);
  out.push(k.faceTextSvg(k.sideMatrix([x0 + 1, FRONT], z1 + 4.2, P, "left"), unit, { size: 3.4, tone: "mid" }));
  return out.join("");
}

function supply() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(PSU, -2), 0, 0.1, P)}" style="filter:blur(4px)"/>`);
  for (const [x, y] of k.corners(PSU, 6)) out.push(S(k.cylinder(x, y, 2.6, 0, 2.2, P, 16), { tone: "lo" }));
  out.push(S(k.slabOf(PSU, 2.2, PSU_H, P, 4, 0.8), { tone: "hi", crease: "lo", inner: L(k.sideSeam(PSU, 2.2 + PSU_H - 6, P, 4), { tone: "faint" }) }));
  // Carry handle on top.
  out.push(S(k.slabOf({ x: PSU.x + 18, y: PSU.y + PSU.d / 2 - 2, w: 42, d: 4, r: 1.6 }, 2.2 + PSU_H, 2.2, P, 3, 0.4), { tone: "mid" }));
  // Vents on the side (+x face).
  for (let i = 0; i < 6; i++) {
    const y = PSU.y + 8 + i * 5;
    out.push(L(k.segment([PSU.x + PSU.w, y, 12], [PSU.x + PSU.w, y, 30], P), { tone: "lo" }));
  }
  out.push(screen(PSU.x + 6, PSU.x + 34, 26, 36, "volts", "VOLTS"));
  out.push(screen(PSU.x + 42, PSU.x + 70, 26, 36, "amps", "AMPERES"));
  // Knob (voltage) on the front face, turning on the y axis.
  const F = G.frameAlong([PSU.x + 20, FRONT, 13], [0, 1, 0]);
  out.push(S(G.disc(0, 1.2, 8.4, F, P), { tone: "mid" }));
  out.push(S(G.disc(1.2, 5.2, 7, F, P), { tone: "mid" }));
  out.push(L(G.ribsOf(F, 1.4, 5, 7, 26, P, { seams: true }), { tone: "lo" }));
  out.push(`<path class="iso-line" data-tone="lit" data-part="knob" d=""/>`);
  out.push(k.faceTextSvg(k.sideMatrix([PSU.x + 9, FRONT], 3.8, P, "left"), "0", { size: 3, tone: "mid" }));
  out.push(k.faceTextSvg(k.sideMatrix([PSU.x + 28, FRONT], 3.8, P, "left"), "12 V", { size: 3, tone: "mid" }));
  // Terminals: red (+) and black (−).
  for (const [x, cls] of [[PSU.x + 50, "cf-term-plus"], [PSU.x + 62, "cf-term-minus"]]) {
    const T = G.frameAlong([x, FRONT, 12], [0, 1, 0]);
    out.push(S(G.disc(0, 2.4, 3.2, T, P), { tone: "mid" }));
    out.push(`<circle class="${cls}" cx="${at([x, FRONT + 2.4, 12])[0].toFixed(1)}" cy="${at([x, FRONT + 2.4, 12])[1].toFixed(1)}" r="2.2"/>`);
  }
  return { svg: out.join(""), knob: F };
}

function lamp() {
  const [x, y] = LAMP;
  const out = [];
  out.push(S(k.cylinder(x, y, 14, 0, 4, P, 40, 0.6), { tone: "mid" }));
  out.push(L(k.ring(x, y, 10.5, 4, P, 40), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, 2.2, 4, 46, P, 18), { tone: "mid", crease: "none" }));
  out.push(L([18, 32].map((z) => k.sideArc(x, y, 2.2, z, P, 10)).join(""), { tone: "faint" }));
  out.push(S(k.cylinder(x, y, 5.4, 50, 9, P, 24), { tone: "mid" }));
  out.push(L([52.5, 55, 57.5].map((z) => k.sideArc(x, y, 5.4, z, P, 16)).join(""), { tone: "lo" }));
  const bulb = at([x, y, 70]);
  out.push(`<circle class="cf-glow" data-part="glow" cx="${bulb[0].toFixed(1)}" cy="${bulb[1].toFixed(1)}" r="12" opacity="0"/>`);
  out.push(S(G.sphereOf([x, y, 70], 11, P), { tone: "hi" }));
  // Filament.
  out.push(`<circle class="cf-glow" data-part="tint" cx="${bulb[0].toFixed(1)}" cy="${bulb[1].toFixed(1)}" r="${(11 * P.scale).toFixed(1)}" opacity="0"/>`);
  out.push(`<path class="cf-filament" data-part="filament" d="${k.pathOf([at([x - 3, y, 62]), at([x - 2, y, 70]), at([x, y, 72]), at([x + 2, y, 70]), at([x + 3, y, 62])])}"/>`);
  return out.join("");
}

const wirePlus = [at([PSU.x + 50, FRONT + 2.4, 12]), [at([PSU.x + 50, FRONT + 10, 2]), at([LAMP[0] - 8, FRONT + 10, 2])], at([LAMP[0] - 8, LAMP[1] + 10, 4])];
const wireMinus = [at([PSU.x + 62, FRONT + 2.4, 12]), [at([PSU.x + 62, FRONT + 4, 2]), at([LAMP[0] - 12, FRONT + 4, 2])], at([LAMP[0] - 12, LAMP[1] + 6, 4])];
const cable = ([from, via, to], tone) => k.wireSvg(from, to, { via, tone: "mid" }) + k.lineSvg(k.pathOf([from, ...via, to]), { tone, className: "cf-flow" });

const PSU_PARTS = supply();
const LABELS = [
  { n: 1, name: "Fuente de poder", anchor: [PSU.x + 40, PSU.y + PSU.d / 2, PSU_H + 4.4], dx: -10, dy: -40 },
  { n: 2, name: "Voltímetro (V)", anchor: [PSU.x + 20, FRONT, 37], dx: -60, dy: -30 },
  { n: 3, name: "Amperímetro (A)", anchor: [PSU.x + 56, FRONT, 37], dx: 60, dy: -46 },
  { n: 4, name: "Perilla de voltaje", anchor: [PSU.x + 20, FRONT + 5.2, 13], dx: -64, dy: 40 },
  { n: 5, name: "Cables", anchor: [10, FRONT + 10, 2], dx: 10, dy: 46 },
  { n: 6, name: "Foco", anchor: [LAMP[0] + 11, LAMP[1], 74], dx: 34, dy: -28 },
];

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Una fuente de poder de laboratorio con un voltímetro, un amperímetro y una perilla de voltaje, conectada con dos cables a un foco. Al subir el voltaje, la corriente y la potencia aumentan y el foco brilla más.",
  body: [
    base(),
    PSU_PARTS.svg,
    `<g data-part="cables">${cable(wireMinus, "green")}${cable(wirePlus, "red")}</g>`,
    lamp(),
    `<g data-part="labels">${labelsSvg(LABELS, at)}</g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const KNOB = ${JSON.stringify(PSU_PARTS.knob)};
const R_LAMP = ${R_LAMP}, V_MAX = ${V_MAX};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const volts = svg.querySelector('[data-part="volts"]');
const amps = svg.querySelector('[data-part="amps"]');
const knob = svg.querySelector('[data-part="knob"]');
const glow = svg.querySelector('[data-part="glow"]');
const tint = svg.querySelector('[data-part="tint"]');
const filament = svg.querySelector('[data-part="filament"]');
const flows = [...svg.querySelectorAll(".cf-flow")];
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const fmt = (n, d) => n.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });
let v = 6, target = 6, dash = 0, last = 0, clock = 0, frame = 0, touring = true, visible = false, idle = 0;
const tourAt = (t) => 6 + 6 * Math.sin(t * 0.55);
const knobPoint = (r, angle, s) => iso([KNOB.o[0] + KNOB.a[0] * s + (KNOB.u[0] * Math.cos(angle) + KNOB.v[0] * Math.sin(angle)) * r, KNOB.o[1] + KNOB.a[1] * s + (KNOB.u[1] * Math.cos(angle) + KNOB.v[1] * Math.sin(angle)) * r, KNOB.o[2] + KNOB.a[2] * s + (KNOB.u[2] * Math.cos(angle) + KNOB.v[2] * Math.sin(angle)) * r], P);
function draw() {
  const i = v / R_LAMP, p = v * i, share = p / (V_MAX * V_MAX / R_LAMP);
  volts.textContent = fmt(v, 1);
  amps.textContent = fmt(i, 2);
  const angle = -2.4 + (v / V_MAX) * 4.8;
  knob.setAttribute("d", pathOf([knobPoint(1.2, angle, 5.2), knobPoint(6, angle, 5.2)]));
  glow.setAttribute("opacity", String(Math.min(0.5, share * 0.55)));
  glow.setAttribute("r", String(20 + share * 22));
  tint.setAttribute("opacity", String(share * 0.8));
  filament.style.opacity = String(0.35 + share * 0.65);
  for (const line of flows) { line.style.strokeDashoffset = String(-dash); line.style.opacity = String(0.15 + 0.85 * Math.min(1, i / 2)); line.style.visibility = v > 0.05 ? "visible" : "hidden"; }
  const text = fmt(v, 1) + " V · " + fmt(i, 2) + " A · " + fmt(p, 1) + " W";
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(Math.round(v / V_MAX * 100)));
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) { clock += dt; target = tourAt(clock); }
  v = calm ? target : v + (target - v) * (1 - Math.exp(-dt / 0.25));
  dash = (dash + dt * 40 * (v / R_LAMP) / 2) % 20;
  draw();
  frame = visible && !calm ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => { touring = false; target = clamp(next, 0, V_MAX); clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; clock = Math.asin(clamp((target - 6) / 6, -1, 1)) / 0.55; run(); }, 4000); if (still.matches) { v = target; draw(); } run(); };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (event) => { const box = svg.getBoundingClientRect(); steer(clamp((event.clientX - box.left) / box.width, 0, 1) * V_MAX); });
stage.addEventListener("keydown", (event) => {
  const step = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 0;
  if (!step) return;
  event.preventDefault();
  steer(Math.round(target + step));
});
draw();
`;

writeFigure({
  id: "voltaje",
  title: "Voltaje, corriente y potencia",
  theme,
  svg: svg.replace("</svg>", "").concat(`<style>[data-part="glow"]{filter:blur(6px)}.cf-digits{fill:${theme === "light" ? "#7ff0c6" : "#7ff0c6"};font:700 7.2px ui-monospace,monospace}.cf-term-plus{fill:var(--anatomy-red)}.cf-term-minus{fill:#1b1b1b;stroke:var(--anatomy-mid);stroke-width:.6}.cf-filament{fill:none;stroke:var(--cf-gold);stroke-width:1}</style></svg>`),
  live,
  plate: {
    fig: "Fig 1",
    title: "Voltaje, corriente y potencia",
    hint: "Desliza para girar la perilla",
    ariaLabel: "Fuente de poder: las flechas suben o bajan el voltaje",
    keys: [
      { mark: "red", label: "Cable positivo: la corriente sale hacia el foco" },
      { mark: "green", label: "Cable negativo: la corriente regresa a la fuente" },
    ],
    caption: `El voltaje (V) es el empuje que da la fuente; la corriente (A) es cuánta electricidad fluye; la potencia (W) es cuánta energía se usa cada segundo: watts = volts × amperes. Este foco de 12 V y 24 W se comporta como una resistencia de ${R_LAMP} Ω, así que la corriente es el voltaje entre ${R_LAMP} (ley de Ohm).`,
  },
});
