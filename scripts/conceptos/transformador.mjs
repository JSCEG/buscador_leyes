/**
 * "¿Cómo funciona?" · Transformador.
 *
 * A square iron core lying on blocks, with a 3-turn coil on one leg and a 25-turn coil on the
 * other (ratio 3 : 25). In "Elevador" mode the 13.8 kV of a power plant's generator goes in the
 * small coil and 115 kV comes out of the big one; "Reductor" runs it the other way. The
 * pointer sets the power that passes (0 to 50 MW). Power in = power out (ideal transformer), so the
 * current drops by the same factor the voltage rises: about 8 times less current, and the line losses,
 * which grow with the square of the current, about 69 times less. Pulses are wider and denser on
 * the high-current side.
 *
 * node scripts/conceptos/transformador.mjs [--light]  →  public/conceptos/transformador(-light).html
 */
import * as k from "../../vendor/anatomy/kit/iso-kit.mjs";
import { themeOf, labelsSvg, writeFigure } from "./_shared.mjs";

const theme = themeOf();
const WIDTH = 640;
const HEIGHT = 400;
const V_LOW = 13.8;
const TURNS = [3, 25];
const RATIO = TURNS[1] / TURNS[0];
const V_HIGH = V_LOW * RATIO;
const P_MAX = 50;

const PLATE = { x: -122, y: -52, w: 244, d: 104, r: 8 };
const PLATE_H = 8;
const FOOT_H = 5;
const CORE_Z = 22;
const CORE_H = 12;
const LEG_W = 12;
const LEFT_X = -48;
const RIGHT_X = 36;
const CORE_Y = [-34, 34];

const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [0, 0, CORE_Z + CORE_H + 30]], WIDTH, HEIGHT, { pad: 30, azimuth: 30, elevation: 34 });
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

const legPlan = (x) => ({ x, y: CORE_Y[0], w: LEG_W, d: CORE_Y[1] - CORE_Y[0], r: 0.8 });
const yokePlan = (y) => ({ x: LEFT_X, y, w: RIGHT_X + LEG_W - LEFT_X, d: LEG_W, r: 0.8 });
// Laminations: thin lines on the top of each core piece, the way a real core is stacked.
function laminations(plan, along) {
  const lines = [];
  const z = CORE_Z + CORE_H;
  if (along === "y") for (let x = plan.x + 2; x < plan.x + plan.w - 1; x += 2) lines.push(k.lineOnTop([x, plan.y + 1], [x, plan.y + plan.d - 1], z, P));
  else for (let y = plan.y + 2; y < plan.y + plan.d - 1; y += 2) lines.push(k.lineOnTop([plan.x + 1, y], [plan.x + plan.w - 1, y], z, P));
  return L(lines.join(""), { tone: "faint" });
}
function blocks() {
  const out = [];
  for (const [x, y] of [[LEFT_X + 6, CORE_Y[0] + 6], [LEFT_X + 6, CORE_Y[1] - 6], [RIGHT_X + 6, CORE_Y[0] + 6], [RIGHT_X + 6, CORE_Y[1] - 6]]) {
    out.push(S(k.slabOf({ x: x - 7, y: y - 7, w: 14, d: 14, r: 1.4 }, 0, CORE_Z, P, 3, 0.4), { tone: "mid" }));
  }
  return out.join("");
}
function coil(x, turns, from, to, cls) {
  const c = k.coil(from, to, [x + LEG_W / 2, CORE_Z + CORE_H / 2], 11, turns, "y", P, 20);
  return { back: `<path class="${cls}" d="${c.back}"/>`, front: `<path class="${cls}" d="${c.front}"/>` };
}
function core() {
  const out = [];
  const back = yokePlan(CORE_Y[0]);
  const front = yokePlan(CORE_Y[1] - LEG_W);
  const primary = coil(LEFT_X, TURNS[0], -16, 16, "cf-copper cf-thick");
  const secondary = coil(RIGHT_X, TURNS[1], -22, 22, "cf-copper");
  out.push(S(k.slabOf(back, CORE_Z, CORE_H, P, 2, 0.4), { tone: "mid" }), laminations(back, "x"));
  out.push(primary.back, secondary.back);
  for (const x of [LEFT_X, RIGHT_X]) out.push(S(k.slabOf(legPlan(x), CORE_Z, CORE_H, P, 2, 0.4), { tone: "mid" }), laminations(legPlan(x), "y"));
  out.push(primary.front, secondary.front);
  out.push(S(k.slabOf(front, CORE_Z, CORE_H, P, 2, 0.4), { tone: "mid" }), laminations(front, "x"));
  return `<g class="cf-iron">${out.join("")}</g>`;
}

// Terminal blocks with insulators: low voltage on the left, high voltage on the right.
function terminal(x, y, high) {
  const out = [];
  const plan = { x: x - 9, y: y - 7, w: 18, d: 14, r: 1.4 };
  out.push(S(k.slabOf(plan, 0, 12, P, 3, 0.5), { tone: "hi", crease: "lo" }));
  const h = high ? 22 : 10;
  out.push(S(k.cylinder(x, y, 2.6, 12, h, P, 18), { tone: "hi", crease: "none" }));
  out.push(L(Array.from({ length: high ? 5 : 2 }, (_, i) => k.sideArc(x, y, 3.6, 15 + i * 4, P, 14)).join(""), { tone: "lo" }));
  out.push(D([at([x, y, 12 + h])], { size: 0.9, tone: "hi" }));
  return out.join("");
}
const LV = [-92, 20];
const HV = [88, 20];
const leadLow = [at([LV[0], LV[1], 22]), [at([LV[0], LV[1], 30]), at([LEFT_X + LEG_W / 2, LV[1], 30])], at([LEFT_X + LEG_W / 2, 12, CORE_Z + CORE_H / 2 + 11])];
const leadHigh = [at([HV[0], HV[1], 34]), [at([HV[0], HV[1], 40]), at([RIGHT_X + LEG_W / 2, HV[1], 40])], at([RIGHT_X + LEG_W / 2, 18, CORE_Z + CORE_H / 2 + 11])];
const lead = ([from, via, to], cls, tone) => k.wireSvg(from, to, { via, tone: "mid" }) + `<path class="iso-line cf-flow ${cls}" data-tone="${tone}" d="${k.pathOf([from, ...via, to])}"/>`;

const LABELS = [
  { n: 1, name: "Núcleo de hierro", anchor: [6, CORE_Y[0] + 6, CORE_Z + CORE_H], dx: 70, dy: -34 },
  { n: 2, name: "Bobina de pocas vueltas", anchor: [LEFT_X + LEG_W / 2, 0, CORE_Z + CORE_H / 2 + 11], dx: -6, dy: -56 },
  { n: 3, name: "Bobina de muchas vueltas", anchor: [RIGHT_X + LEG_W / 2, 6, CORE_Z + CORE_H / 2 + 11], dx: 74, dy: 26 },
  { n: 4, name: "Lado de bajo voltaje", anchor: [LV[0], LV[1], 22], dx: -20, dy: 70 },
  { n: 5, name: "Lado de alto voltaje", anchor: [HV[0], HV[1], 34], dx: 20, dy: 60 },
];

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Un transformador: un núcleo cuadrado de hierro con una bobina de cobre de pocas vueltas en un lado y otra de muchas vueltas en el otro, cada una con su terminal. Como elevador, recibe bajo voltaje y entrega alto voltaje con mucha menos corriente; como reductor, al revés.",
  body: [
    base(),
    blocks(),
    core(),
    terminal(LV[0], LV[1], false),
    terminal(HV[0], HV[1], true),
    `<g data-part="leads">${lead(leadLow, "cf-low", "green")}${lead(leadHigh, "cf-high", "green")}</g>`,
    `<g data-part="labels">${labelsSvg(LABELS, at)}</g>`,
  ],
});

const live = `
const V_LOW = ${V_LOW}, V_HIGH = ${V_HIGH}, RATIO = ${RATIO}, P_MAX = ${P_MAX};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const low = svg.querySelector(".cf-low");
const high = svg.querySelector(".cf-high");
const readout = document.querySelector("[data-readout]");
const chips = [...document.querySelectorAll("[data-mode]")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const fmt = (n, d = 0) => n.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });
let mode = "elevador", power = 30, target = 30, dash = 0, last = 0, clock = 0, frame = 0, touring = true, visible = false, idle = 0;
const tourAt = (t) => 28 + 18 * Math.sin(t * 0.5);
function setMode(next) { mode = next; chips.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === next))); draw(); }
function draw() {
  const iLow = power * 1000 / V_LOW, iHigh = power * 1000 / V_HIGH;
  const dir = mode === "elevador" ? 1 : -1;
  low.style.strokeDashoffset = String(-dash * dir * RATIO / 2.5);
  high.style.strokeDashoffset = String(dash * dir / 2.5);
  for (const line of [low, high]) { line.style.opacity = String(0.2 + 0.8 * power / P_MAX); line.style.visibility = power > 0.3 ? "visible" : "hidden"; }
  const [vin, iin, vout, iout] = mode === "elevador" ? [V_LOW, iLow, V_HIGH, iHigh] : [V_HIGH, iHigh, V_LOW, iLow];
  const text = compact
    ? fmt(power) + " MW · entra " + fmt(vin, 1) + " kV · sale " + fmt(vout, 1) + " kV"
    : fmt(power) + " MW · entra " + fmt(vin, 1) + " kV y " + fmt(iin) + " A · sale " + fmt(vout, 1) + " kV y " + fmt(iout) + " A";
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(Math.round(power / P_MAX * 100)));
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) { clock += dt; target = tourAt(clock); const want = Math.floor(clock / 9) % 2 ? "reductor" : "elevador"; if (want !== mode) setMode(want); }
  power = power + (target - power) * (1 - Math.exp(-dt / 0.35));
  dash = (dash + dt * 10 * (power / P_MAX)) % 200;
  draw();
  frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const pause = () => { touring = false; clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; run(); }, 6000); };
chips.forEach((b) => b.addEventListener("click", (event) => { event.stopPropagation(); pause(); setMode(b.dataset.mode); run(); }));
const steer = (next) => { pause(); target = clamp(next, 0, P_MAX); if (still.matches) { power = target; draw(); } run(); };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (event) => { const box = svg.getBoundingClientRect(); steer(clamp((event.clientX - box.left) / box.width, 0, 1) * P_MAX); });
stage.addEventListener("keydown", (event) => {
  const step = event.key === "ArrowRight" || event.key === "ArrowUp" ? 5 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -5 : 0;
  if (!step) return;
  event.preventDefault();
  steer(target + step);
});
setMode("elevador");
`;

const cu = theme === "light" ? "#b87333" : "#d9915a";
// Iron grey for the core so it reads apart from the white base.
const iron = theme === "light"
  ? ".cf-iron{--anatomy-top:#c3c8cf;--anatomy-shade-0:#a9afb8;--anatomy-shade-1:#959ca6;--anatomy-shade-2:#a0a7b0;--anatomy-shade-3:#8b929c;--anatomy-face:#a9afb8}"
  : ".cf-iron{--anatomy-top:#5d646e;--anatomy-shade-0:#4c535c;--anatomy-shade-1:#41474f;--anatomy-shade-2:#474e56;--anatomy-shade-3:#3b4148;--anatomy-face:#4c535c}";
writeFigure({
  id: "transformador",
  title: "Transformador",
  theme,
  svg: svg.replace("</svg>", `<style>.cf-copper{fill:none;stroke:${cu};stroke-width:1.8;stroke-linecap:round}.cf-thick{stroke-width:3.4}.cf-low{stroke-width:3.6;stroke-dasharray:3 6}.cf-high{stroke-width:1.6;stroke-dasharray:2 12}${iron}</style></svg>`),
  controls: `<div class="cf-chips" role="group" aria-label="Tipo de transformador"><button type="button" data-mode="elevador" aria-pressed="true">Elevador</button><button type="button" data-mode="reductor" aria-pressed="false">Reductor</button></div>`,
  live,
  plate: {
    fig: "Fig 6",
    title: "Transformador",
    hint: "Desliza para cambiar la potencia",
    ariaLabel: "Transformador: las flechas cambian la potencia que pasa",
    keys: [
      { mark: "green", label: "Corriente alterna: gruesa donde hay mucha corriente, delgada donde hay poca" },
    ],
    caption: `El transformador cambia el voltaje sin cambiar la potencia. La corriente alterna en la bobina de pocas vueltas magnetiza el núcleo de hierro, y el núcleo induce corriente en la otra bobina; el voltaje cambia en la misma proporción que el número de vueltas (aquí, ${TURNS[0]} y ${TURNS[1]} vueltas). Como elevador, la central sube ${V_LOW} kV a ${Math.round(V_HIGH)} kV: la misma potencia viaja con unas ${Math.round(RATIO)} veces menos corriente y las pérdidas en la línea, que crecen con el cuadrado de la corriente, bajan unas ${Math.round(RATIO * RATIO)} veces. Cerca de tu casa, uno reductor la baja otra vez.`,
  },
});
