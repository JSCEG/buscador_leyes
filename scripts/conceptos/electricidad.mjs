/**
 * "¿Cómo funciona?" · ¿Qué es la electricidad?
 *
 * The simplest circuit on a bench: a battery, a knife switch and a lamp joined by insulated copper
 * wire. A magnifying glass over one wire shows what is inside: the copper's fixed positive ions and
 * its free electrons. With the switch open the electrons only jiggle in place and the lamp is off;
 * closed, they all drift together, slowly, from the battery's negative end round to its positive
 * end, and the lamp lights at once (the drift in a real wire is under a millimetre per second; the
 * signal travels near the speed of light because each electron pushes the next). The dots on the
 * wire follow the electrons.
 *
 * node scripts/conceptos/electricidad.mjs [--light]  →  public/conceptos/electricidad(-light).html
 */
import * as k from "../../vendor/anatomy/kit/iso-kit.mjs";
import * as G from "../../vendor/anatomy/kit/lathe.mjs";
import { themeOf, inkOf, labelsSvg, writeFigure } from "./_shared.mjs";

const theme = themeOf();
const INK = inkOf(theme);
const WIDTH = 640;
const HEIGHT = 400;

const PLATE = { x: -150, y: -64, w: 300, d: 128, r: 8 };
const PLATE_H = 8;
const FOOT_H = 5;
const BATTERY = [-88, 34];
const LAMP = [104, -22];
const SWITCH = { hinge: [-14, 40], contact: [14, 40], z: 10, blade: 28 };
const LENS_AT = [62, 40, 2];

const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [LAMP[0], LAMP[1], 80], [PLATE.x, PLATE.y, 40]], WIDTH, HEIGHT, { pad: 24, azimuth: 34, elevation: 30 });
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

function battery() {
  const [x, y] = BATTERY;
  const out = [];
  out.push(S(k.slabOf({ x: x - 18, y: y - 12, w: 36, d: 24, r: 2 }, 0, 4, P, 3, 0.4), { tone: "mid" }));
  const F = G.frameAlong([x - 16, y, 16], [1, 0, 0]);
  out.push(S(G.disc(0, 30, 11.5, F, P), { tone: "hi", crease: "lo" }));
  out.push(S(G.disc(30, 33, 4.2, F, P), { tone: "mid" }));
  out.push(L(G.arcOf(F, 8, 11.5, P), { tone: "lo" }));
  out.push(k.faceTextSvg(k.topMatrix([x - 2, y], 27.6, P, "x"), "1.5 V", { size: 5, tone: "mid", anchor: "middle" }));
  out.push(k.faceTextSvg(k.topMatrix([x + 12, y], 27.6, P, "x"), "+", { size: 6, tone: "hi", anchor: "middle" }));
  out.push(k.faceTextSvg(k.topMatrix([x - 13, y], 27.6, P, "x"), "−", { size: 6, tone: "hi", anchor: "middle" }));
  return out.join("");
}

// Knife switch: a base, two posts and a blade drawn live (closed flat, open raised).
function knife() {
  const [hx, hy] = SWITCH.hinge;
  const [cx] = SWITCH.contact;
  const out = [S(k.slabOf({ x: hx - 8, y: hy - 7, w: cx - hx + 16, d: 14, r: 1.6 }, 0, 4, P, 3, 0.5), { tone: "mid" })];
  for (const x of [hx, cx]) out.push(S(k.slabOf({ x: x - 3, y: hy - 3, w: 6, d: 6, r: 0.8 }, 4, SWITCH.z - 4, P, 2, 0.3), { tone: "hi", crease: "lo" }));
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

// One loop of insulated wire, from the battery's negative end round to its positive end, in the
// direction the electrons drift. The switch breaks it between its two posts.
const NEG = [BATTERY[0] - 16, BATTERY[1], 16];
const POS = [BATTERY[0] + 17, BATTERY[1], 16];
const legA = [NEG, [NEG[0] - 8, NEG[1], 2], [NEG[0] - 8, -36, 2], [LAMP[0], -36, 2], [LAMP[0], LAMP[1] - 11, 2]];
const legB = [[LAMP[0], LAMP[1] + 11, 2], [LAMP[0], 40, 2], [SWITCH.contact[0] + 3, 40, 2], [SWITCH.contact[0], 40, SWITCH.z]];
const legC = [[SWITCH.hinge[0], 40, SWITCH.z], [SWITCH.hinge[0] - 3, 40, 2], [POS[0] + 8, 40, 2], [POS[0] + 8, POS[1], 2], POS];
const wire = (points) => {
  const d = k.pathOf(points.map(at));
  return `<path class="cf-jacket" d="${d}"/><path class="cf-core" d="${d}"/><path class="iso-line cf-flow cf-e-flow" d="${d}"/>`;
};
const ends = [legA[0], legA.at(-1), legB[0], legB.at(-1), legC[0], legC.at(-1)].map(at);

// The magnifying glass: a 2D inset (screen space) looking into the wire at LENS_AT.
const LENS = { cx: 492, cy: 92, r: 60 };
const BAND = 20;
const lensTarget = at(LENS_AT);
function lens() {
  const { cx, cy, r } = LENS;
  const top = cy - r + BAND;
  const bottom = cy + r - BAND;
  const ions = [];
  for (let y = top + 11; y < bottom - 4; y += 21) {
    for (let x = cx - r + 6 + ((Math.round((y - top) / 21) % 2) * 11); x < cx + r; x += 22) {
      ions.push(`<g class="cf-ion"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.2"/><path d="M${(x - 2.4).toFixed(1)} ${y.toFixed(1)}h4.8M${x.toFixed(1)} ${(y - 2.4).toFixed(1)}v4.8"/></g>`);
    }
  }
  const angle = Math.atan2(lensTarget[1] - cy, lensTarget[0] - cx);
  const rim = [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  return `<g data-part="lens">
    <path class="cf-lens-link" d="M${lensTarget[0].toFixed(1)} ${lensTarget[1].toFixed(1)}L${rim[0].toFixed(1)} ${rim[1].toFixed(1)}"/>
    <circle class="cf-lens-spot" cx="${lensTarget[0].toFixed(1)}" cy="${lensTarget[1].toFixed(1)}" r="4"/>
    <path class="cf-lens-handle" d="M${(cx + r * 0.72).toFixed(1)} ${(cy + r * 0.72).toFixed(1)}l26 26"/>
    <clipPath id="cf-lens-clip"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>
    <g clip-path="url(#cf-lens-clip)">
      <rect class="cf-copper-bg" x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${2 * r}"/>
      <rect class="cf-plastic" x="${cx - r}" y="${cy - r}" width="${2 * r}" height="${BAND}"/>
      <rect class="cf-plastic" x="${cx - r}" y="${bottom}" width="${2 * r}" height="${BAND}"/>
      ${ions.join("")}
      <g data-part="electrons"></g>
    </g>
    <circle class="cf-lens-rim" cx="${cx}" cy="${cy}" r="${r}"/>
  </g>`;
}

const LABELS = [
  { n: 1, name: "Pila", anchor: [BATTERY[0] - 2, BATTERY[1], 27.5], dx: -40, dy: -46 },
  { n: 2, name: "Interruptor", anchor: [0, 40, 6], dx: -10, dy: 70 },
  { n: 3, name: "Cable de cobre", anchor: [-50, 40, 2], dx: -50, dy: 46 },
  { n: 4, name: "Forro de plástico (aislante)", anchor: [10, -36, 2], dx: -30, dy: -62 },
  { n: 5, name: "Lupa: dentro del cable", anchor: [LENS_AT[0], LENS_AT[1], 2], dx: 60, dy: 50 },
  { n: 6, name: "Foco", anchor: [LAMP[0] + 9, LAMP[1], 64], dx: -60, dy: -24 },
];

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Un circuito sencillo: una pila, un interruptor y un foco unidos por cable de cobre forrado de plástico. Una lupa muestra el interior del cable: los átomos de cobre fijos y los electrones libres. Con el interruptor abierto, los electrones solo se agitan y el foco está apagado; cerrado, avanzan todos juntos, despacio, y el foco enciende.",
  body: [
    base(),
    `<g data-part="wires">${wire(legA)}${wire(legB)}${wire(legC)}${D(ends, { size: 0.7, tone: "hi" })}</g>`,
    knife(),
    `<path class="cf-blade" data-part="blade" d="M0 0"/>`,
    battery(),
    lamp(),
    lens(),
    `<g data-part="labels">${labelsSvg(LABELS, at)}</g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const SWITCH = ${JSON.stringify(SWITCH)}, LENS = ${JSON.stringify(LENS)}, BAND = ${BAND};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const blade = svg.querySelector('[data-part="blade"]');
const glow = svg.querySelector('[data-part="glow"]');
const tint = svg.querySelector('[data-part="tint"]');
const flows = [...svg.querySelectorAll(".cf-e-flow")];
const electronsEl = svg.querySelector('[data-part="electrons"]');
const readout = document.querySelector("[data-readout]");
const chips = [...document.querySelectorAll("[data-sw]")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
stage.setAttribute("role", "group");
["aria-valuemin", "aria-valuemax", "aria-valuenow"].forEach((name) => stage.removeAttribute(name));
// Free electrons in the lens: a fixed pseudo-random start, slow drift when closed, jiggle always.
let seed = 7;
const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
const left = LENS.cx - LENS.r, width = LENS.r * 2, top = LENS.cy - LENS.r + BAND + 3, height = LENS.r * 2 - BAND * 2 - 6;
const electrons = Array.from({ length: 14 }, () => ({ x: left + rand() * width, y: top + rand() * height, p: rand() * 6.28 }));
electronsEl.innerHTML = electrons.map(() => '<g class="cf-electron"><circle r="3.4"/><path d="M-1.7 0h3.4"/></g>').join("");
const dots = [...electronsEl.children];
let closed = true, open = 0, clock = 0, last = 0, frame = 0, touring = true, visible = false, idle = 0;
function setClosed(next) { closed = next; chips.forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.sw === "on") === next))); draw(); }
function draw() {
  // open = 0 closed … 1 fully raised; the blade turns about the hinge post.
  const a = open * 1.0, [hx, hy] = SWITCH.hinge;
  const tip = [hx + Math.cos(a) * SWITCH.blade, hy, SWITCH.z + Math.sin(a) * SWITCH.blade];
  blade.setAttribute("d", pathOf([iso([hx, hy, SWITCH.z], P), iso(tip, P)]));
  const on = 1 - open;
  const lit = on > 0.98 ? 1 : 0;
  glow.setAttribute("opacity", String(0.5 * lit));
  glow.setAttribute("r", String(30 * lit + 10));
  tint.setAttribute("opacity", String(0.8 * lit));
  for (const line of flows) { line.style.visibility = lit ? "visible" : "hidden"; line.style.strokeDashoffset = String(-clock * 9); }
  electrons.forEach((e, i) => dots[i].setAttribute("transform", "translate(" + e.x.toFixed(1) + " " + (e.y + Math.sin(clock * 9 + e.p) * 1.6).toFixed(1) + ")"));
  const text = lit
    ? (compact ? "Cerrado · hay corriente" : "Circuito cerrado · hay corriente: los electrones avanzan todos juntos, despacio")
    : (compact ? "Abierto · no hay corriente" : "Circuito abierto · no hay corriente: los electrones solo se agitan en su lugar");
  if (readout.textContent !== text) readout.textContent = text;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  clock += dt;
  if (touring) { const want = Math.floor(clock / 5) % 2 === 0; if (want !== closed) setClosed(want); }
  open += ((closed ? 0 : 1) - open) * (1 - Math.exp(-dt / 0.12));
  const drift = open < 0.02 ? 16 : 0;
  for (const e of electrons) {
    e.x += (drift + (Math.sin(clock * 3 + e.p * 5) * 6)) * dt;
    if (e.x > left + width + 4) e.x -= width + 8;
    if (e.x < left - 4) e.x += width + 8;
  }
  draw();
  frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const pause = () => { touring = false; clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; run(); }, 8000); };
const toggle = (next) => { pause(); setClosed(next); if (still.matches) { open = next ? 0 : 1; draw(); } run(); };
chips.forEach((b) => b.addEventListener("click", (event) => { event.stopPropagation(); toggle(b.dataset.sw === "on"); }));
stage.addEventListener("keydown", (event) => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); toggle(!closed); } });
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
setClosed(true);
`;

const C = theme === "light"
  ? { jacket: "#b8b1a9", core: "#b87333", bg: "#f6dcc4", plastic: "#d9d3cc", ion: "#c98a55", ionInk: "#fff", e: INK.red, rim: "#6b6460" }
  : { jacket: "#5b5357", core: "#d9915a", bg: "#4a3020", plastic: "#3a3436", ion: "#9a6438", ionInk: "#f3ece4", e: INK.red, rim: "#b3a89e" };
writeFigure({
  id: "electricidad",
  title: "¿Qué es la electricidad?",
  theme,
  svg: svg.replace("</svg>", `<style>.cf-jacket{fill:none;stroke:${C.jacket};stroke-width:5.4;stroke-linecap:round;stroke-linejoin:round}.cf-core{fill:none;stroke:${C.core};stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round;opacity:.0}.cf-e-flow{stroke:${C.e};stroke-width:2.6;stroke-dasharray:3 9}.cf-blade{fill:none;stroke:var(--anatomy-hi);stroke-width:4;stroke-linecap:round}.cf-copper-bg{fill:${C.bg}}.cf-plastic{fill:${C.plastic}}.cf-ion circle{fill:${C.ion}}.cf-ion path{stroke:${C.ionInk};stroke-width:1.3}.cf-electron circle{fill:${C.e}}.cf-electron path{stroke:#fff;stroke-width:1.2}.cf-lens-rim{fill:none;stroke:${C.rim};stroke-width:5}.cf-lens-handle{stroke:${C.rim};stroke-width:8;stroke-linecap:round}.cf-lens-link{stroke:${C.rim};stroke-width:1;stroke-dasharray:3 3}.cf-lens-spot{fill:none;stroke:${C.rim};stroke-width:1.4}</style></svg>`),
  controls: `<div class="cf-chips" role="group" aria-label="Interruptor"><button type="button" data-sw="on" aria-pressed="true">Cerrar circuito</button><button type="button" data-sw="off" aria-pressed="false">Abrir circuito</button></div>`,
  live,
  plate: {
    fig: "Fig 1",
    title: "¿Qué es la electricidad?",
    hint: "Abre o cierra el circuito",
    ariaLabel: "Circuito con pila, interruptor y foco; los botones abren o cierran el interruptor",
    keys: [
      { mark: "red", label: "Electrones (carga negativa) y su movimiento por el cable" },
    ],
    caption: "Los cables son de cobre, un metal con electrones libres, forrados de plástico, que es aislante. La pila empuja a los electrones, pero solo hay corriente si el circuito está cerrado. Dentro del cable (la lupa), los átomos de cobre se quedan fijos y los electrones libres avanzan todos juntos, muy despacio: menos de un milímetro por segundo. El foco enciende al instante porque cada electrón empuja al siguiente en todo el cable a la vez. La lupa va en cámara lenta y muy aumentada.",
  },
});
