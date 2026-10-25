/**
 * "¿Cómo funciona?" · Planeación vinculante, regla 54/46 y Desarrollo Mixto.
 *
 * An injection bench: four sources stand behind a transmission bar (the RNT and RGD, the State's
 * exclusive networks) and feed it through cables: a CFE plant, a Desarrollo Mixto plant (half State,
 * half private: Inversión Mixta or Producción de Largo Plazo), a private plant and a battery rack
 * (SAEE). The bar feeds a yearly injection meter, a column whose guinda part is the State's share
 * (CFE plus Desarrollo Mixto) and whose gold part is the private share, with a ring at 54 %. In front,
 * the SENER and CNE desk: the binding plan (PLADESE) and the permit stamp. The pointer sets the
 * private share; below 54 % for the State, the ring raises the alarm.
 *
 * node scripts/conceptos/desarrollo-mixto-sen.mjs [--light]  →  public/conceptos/desarrollo-mixto-sen(-light).html
 */
import * as k from "../../vendor/anatomy/kit/iso-kit.mjs";
import { themeOf, inkOf, labelsSvg, writeFigure } from "./_shared.mjs";

const theme = themeOf();
const INK = inkOf(theme);
const WIDTH = 640;
const HEIGHT = 360;
const RULE = 0.54;
const P_MIN = 0.2;
const P_MAX = 0.6;
const P_REST = 0.38;

const PLATE = { x: -156, y: -62, w: 312, d: 124, r: 10 };
const PLATE_H = 8;
const FOOT_H = 5;
const BUS = { x: -138, y: 30, w: 178, d: 5, r: 1 };
const BUS_Z = 20;
const GAUGE = { cx: 86, cy: -18, r: 17, z0: 7, h: 62 };
const DESK = { x: 88, y: 22, w: 50, d: 30, r: 3 };
const DESK_H = 12;
const SOURCES = [
  { key: "cfe", x: -134, w: 36, h: 24, side: "state" },
  { key: "mixto", x: -88, w: 36, h: 20, side: "mixed" },
  { key: "privado", x: -42, w: 36, h: 9, side: "private" },
  { key: "saee", x: 4, w: 30, h: 14, side: "storage" },
];
const SRC_Y = -48;
const SRC_D = 40;

const P = k.fitProjection([...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [GAUGE.cx, GAUGE.cy, GAUGE.z0 + GAUGE.h + 6]], WIDTH, HEIGHT, { pad: 22, azimuth: 40, elevation: 32 });
const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (items) => items.sort((a, b) => a.depth - b.depth).map((i) => i.svg).join("");

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
  // Engraved footprint of the generation yard behind the bar.
  out.push(L(k.planOutline({ x: -140, y: SRC_Y - 4, w: 180, d: SRC_D + 8, r: 3 }, 0, P), { tone: "faint" }));
  return out.join("");
}

// The four sources. Their roofs carry the colour of who owns the energy.
function source(s) {
  const plan = { x: s.x, y: SRC_Y, w: s.w, d: SRC_D, r: 1.2 };
  const cx = s.x + s.w / 2;
  const out = [];
  if (s.key === "saee") {
    // Battery rack: a plinth with four cells and their terminals.
    out.push(S(k.slabOf(plan, 0, 3, P, 2, 0.4), { tone: "mid" }));
    for (let i = 0; i < 4; i++) {
      const cell = { x: s.x + 2 + i * 6.8, y: SRC_Y + 6, w: 5.6, d: SRC_D - 12, r: 0.8 };
      out.push(S(k.slabOf(cell, 3, s.h, P, 2, 0.4), { tone: "hi", crease: "lo" }));
      out.push(D([at([cell.x + 2.8, cell.y + 4, 3 + s.h]), at([cell.x + 2.8, cell.y + cell.d - 4, 3 + s.h])], { size: 0.8, tone: "mid" }));
    }
    return { depth: k.depthOf([cx, SRC_Y + SRC_D / 2, 0], P), svg: `<g class="cf-src" data-src="${s.key}">${out.join("")}</g>` };
  }
  out.push(S(k.slabOf(plan, 0, s.h, P, 2, 0.5), { tone: "hi", crease: "lo" }));
  if (s.side === "mixed") {
    // Half the roof State, half private: the two partners of a Desarrollo Mixto scheme.
    const left = { x: s.x + 1.5, y: SRC_Y + 1.5, w: s.w / 2 - 1.5, d: SRC_D - 3, r: 0.6 };
    const right = { x: s.x + s.w / 2, y: SRC_Y + 1.5, w: s.w / 2 - 1.5, d: SRC_D - 3, r: 0.6 };
    out.push(`<g class="cf-roof cf-state">${S(k.slabOf(left, s.h, 1.2, P, 2, 0.2), { tone: "hi", crease: "none" })}</g>`);
    out.push(`<g class="cf-roof cf-private">${S(k.slabOf(right, s.h, 1.2, P, 2, 0.2), { tone: "hi", crease: "none" })}</g>`);
    out.push(S(k.cylinder(s.x + 9, SRC_Y + 10, 1.8, s.h + 1.2, 9, P, 16), { tone: "mid" }));
  } else {
    const roof = { x: s.x + 1.5, y: SRC_Y + 1.5, w: s.w - 3, d: SRC_D - 3, r: 0.6 };
    out.push(`<g class="cf-roof cf-${s.side}">${S(k.slabOf(roof, s.h, 1.2, P, 2, 0.2), { tone: "hi", crease: "none" })}</g>`);
    if (s.key === "cfe") {
      for (const dx of [9, 20]) {
        out.push(S(k.cylinder(s.x + dx, SRC_Y + 10, 2.2, s.h + 1.2, 12, P, 18), { tone: "mid" }));
        out.push(L(k.ring(s.x + dx, SRC_Y + 10, 2.2, s.h + 13.2, P, 18), { tone: "lo" }));
      }
    } else {
      // Private solar: a panel grid on the roof.
      const grid = [];
      for (let y = SRC_Y + 6; y <= SRC_Y + SRC_D - 6; y += 6) grid.push(k.lineOnTop([s.x + 3, y], [s.x + s.w - 3, y], s.h + 1.2, P));
      grid.push(k.lineOnTop([cx, SRC_Y + 3], [cx, SRC_Y + SRC_D - 3], s.h + 1.2, P));
      out.push(L(grid.join(""), { tone: "lo" }));
    }
  }
  // A door and a vent on the front face.
  out.push(L(k.segment([s.x + 4, SRC_Y + SRC_D, 1], [s.x + 4, SRC_Y + SRC_D, Math.min(7, s.h - 1)], P) + k.segment([s.x + 9, SRC_Y + SRC_D, 1], [s.x + 9, SRC_Y + SRC_D, Math.min(7, s.h - 1)], P), { tone: "lo" }));
  return { depth: k.depthOf([cx, SRC_Y + SRC_D / 2, 0], P), svg: `<g class="cf-src" data-src="${s.key}">${out.join("")}</g>` };
}

// The bar on insulator posts: the RNT and RGD, exclusive to the State.
function bus() {
  const out = [];
  for (const x of [-128, -84, -40, 4, 32]) {
    out.push(S(k.cylinder(x, BUS.y + BUS.d / 2, 2.4, 0, 2, P, 18), { tone: "mid" }));
    out.push(S(k.cylinder(x, BUS.y + BUS.d / 2, 1.2, 2, BUS_Z - 2, P, 14), { tone: "hi", crease: "lo" }));
    out.push(L([6, 10, 14].map((z) => k.sideArc(x, BUS.y + BUS.d / 2, 2.2, z, P, 12)).join(""), { tone: "lo" }));
  }
  out.push(`<g class="cf-state">${S(k.slabOf(BUS, BUS_Z, 3, P, 2, 0.4), { tone: "hi", crease: "lo" })}</g>`);
  return out.join("");
}

// Cables from each source's front face down to the bar; the dashes flow with the injection.
const feedFrom = (s) => [s.x + s.w / 2, SRC_Y + SRC_D, Math.min(6, s.h - 2)];
function feeders() {
  return SOURCES.map((s) => {
    const [x, y, z] = feedFrom(s);
    const from = at([x, y, z]);
    const to = at([x, BUS.y, BUS_Z + 3]);
    const via = [at([x, y + 6, z]), at([x, BUS.y - 4, BUS_Z + 3])];
    return k.wireSvg(from, to, { via, tone: "mid" }) + `<path class="iso-line cf-flow cf-feed" data-feed="${s.side}" d="${k.pathOf([from, ...via, to])}"/>`;
  }).join("");
}
// From the end of the bar to the meter's collar.
function busToGauge() {
  const from = at([BUS.x + BUS.w, BUS.y + BUS.d / 2, BUS_Z + 1.5]);
  const via = [at([GAUGE.cx - 2, BUS.y + BUS.d / 2, BUS_Z + 1.5]), at([GAUGE.cx - 2, GAUGE.cy + GAUGE.r + 6, BUS_Z + 1.5])];
  const to = at([GAUGE.cx - 2, GAUGE.cy + GAUGE.r + 2, GAUGE.z0]);
  return k.wireSvg(from, to, { via, tone: "mid" }) + `<path class="iso-line cf-flow cf-feed" data-feed="bus" d="${k.pathOf([from, ...via, to])}"/>`;
}

// The yearly injection meter: collar, the two-colour column (rebuilt live) and the 54 % ring.
function gauge() {
  const { cx, cy, r, z0, h } = GAUGE;
  const out = [S(k.cylinder(cx, cy, r + 4, 0, z0, P, 40, 0.6), { tone: "mid" })];
  out.push(L(k.ring(cx, cy, r + 2, z0, P, 40), { tone: "lo" }));
  out.push(`<g data-part="column"></g>`);
  out.push(`<g data-part="rule">${L(k.sideArc(cx, cy, r + 1.4, z0 + RULE * h, P, 40), { tone: "hi", className: "cf-rule" })}</g>`);
  out.push(S(k.cylinder(cx, cy, r + 1.2, z0 + h, 2, P, 40, 0.4), { tone: "mid" }));
  return out.join("");
}

// The SENER and CNE desk: the binding plan as a stack of sheets and the permit stamp.
function desk() {
  const out = [S(k.slabOf(DESK, 0, DESK_H, P, 3, 0.6), { tone: "mid" })];
  out.push(L(k.planOutline(k.insetPlan(DESK, 3), DESK_H, P), { tone: "lo" }));
  for (let i = 0; i < 4; i++) {
    const sheet = { x: DESK.x + 5 + i * 0.6, y: DESK.y + 5 - i * 0.4, w: 20, d: 16, r: 0.6 };
    out.push(S(k.slabOf(sheet, DESK_H + i * 1.1, 1, P, 2, 0.1), { tone: "hi", crease: "faint" }));
  }
  const top = DESK_H + 4.4;
  out.push(L([0, 1, 2].map((i) => k.lineOnTop([DESK.x + 9, DESK.y + 8 + i * 3], [DESK.x + 21, DESK.y + 8 + i * 3], top, P)).join(""), { tone: "lo", free: true }));
  out.push(`<g class="cf-state">${S(k.cylinder(DESK.x + 38, DESK.y + 14, 5, DESK_H, 3, P, 26, 0.4), { tone: "hi", crease: "lo" })}</g>`);
  out.push(S(k.cylinder(DESK.x + 38, DESK.y + 14, 1.6, DESK_H + 3, 7, P, 14), { tone: "mid" }));
  out.push(S(k.cylinder(DESK.x + 38, DESK.y + 14, 2.8, DESK_H + 10, 3, P, 18, 0.6), { tone: "hi", crease: "lo" }));
  return out.join("");
}

const LABELS = [
  { n: 1, name: "SENER planea, CNE da permisos", anchor: [DESK.x + 15, DESK.y + 13, DESK_H + 4.4], dx: 40, dy: 44 },
  { n: 2, name: "Generación de la CFE", anchor: [SOURCES[0].x + 20, SRC_Y + 30, SOURCES[0].h + 1.2], dx: -50, dy: -40 },
  { n: 3, name: "Desarrollo Mixto", anchor: [SOURCES[1].x + 26, SRC_Y + 26, SOURCES[1].h + 1.2], dx: -16, dy: -62 },
  { n: 4, name: "Generación privada", anchor: [SOURCES[2].x + 18, SRC_Y + 26, SOURCES[2].h + 1.2], dx: 26, dy: -70 },
  { n: 5, name: "Baterías (SAEE)", anchor: [SOURCES[3].x + 15, SRC_Y + 20, SOURCES[3].h + 3], dx: 40, dy: -50 },
  { n: 6, name: "RNT y RGD del Estado", anchor: [-60, BUS.y + BUS.d, BUS_Z + 1.5], dx: -30, dy: 56 },
];

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Una bancada de inyección: una central de la CFE, una de Desarrollo Mixto, una privada y un banco de baterías se conectan a una barra que representa las redes del Estado; la barra llena un medidor anual cuya parte guinda es la energía del Estado y la dorada la privada, con una marca en 54 %. Al frente, el escritorio de SENER y la CNE con el plan y el sello de permisos.",
  body: [
    base(),
    byDepth(SOURCES.map(source)),
    `<g data-part="feeders">${feeders()}</g>`,
    bus(),
    gauge(),
    busToGauge(),
    desk(),
    `<g data-part="labels">${labelsSvg(LABELS, at)}</g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const GAUGE = ${JSON.stringify(GAUGE)}, RULE = ${RULE}, P_MIN = ${P_MIN}, P_MAX = ${P_MAX}, P_REST = ${P_REST};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const column = svg.querySelector('[data-part="column"]');
const feeds = [...svg.querySelectorAll(".cf-feed")];
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const pct = (v) => Math.round(v * 100) + " %";
let share = P_REST, target = P_REST, dash = 0, last = 0, clock = 0, frame = 0, touring = true, visible = false, idle = 0, built = -1, shown = "";
const tourAt = (t) => 0.4 + 0.17 * Math.sin(t * 0.35);
function buildColumn(p) {
  const { cx, cy, r, z0, h } = GAUGE;
  const state = (1 - p) * h;
  column.innerHTML = '<g class="cf-state">' + solidSvg(cylinder(cx, cy, r, z0, state, P, 40), { tone: "hi", crease: "lo" }) + '</g>'
    + '<g class="cf-private">' + solidSvg(cylinder(cx, cy, r, z0 + state, h - state, P, 40), { tone: "hi", crease: "lo" }) + '</g>';
}
function draw() {
  const p = share;
  const state = 1 - p;
  const key = Math.round(p * 400);
  if (key !== built) { built = key; buildColumn(p); }
  // Judge the rule on the same whole percentage the reader sees.
  const breach = Math.round(state * 100) < Math.round(RULE * 100);
  svg.classList.toggle("is-breach", breach);
  for (const f of feeds) {
    const side = f.dataset.feed;
    const weight = side === "private" ? p * 1.6 : side === "bus" || side === "storage" ? 0.8 : state * 1.1;
    f.style.opacity = String(clamp(0.25 + weight, 0.25, 1));
    f.style.strokeDashoffset = String(-dash);
  }
  const text = compact
    ? "Estado " + pct(state) + " · privados " + pct(p) + (breach ? " · no cumple" : " · cumple")
    : "Inyección anual: Estado " + pct(state) + " (CFE y Desarrollo Mixto) · privados " + pct(p) + (breach ? " · no cumple el mínimo de 54 %" : " · cumple el mínimo de 54 %");
  if (text !== shown) { shown = text; readout.textContent = text; stage.setAttribute("aria-valuetext", text); }
  stage.setAttribute("aria-valuenow", String(Math.round((p - P_MIN) / (P_MAX - P_MIN) * 100)));
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (touring) { clock += dt; target = tourAt(clock); }
  share = share + (target - share) * (1 - Math.exp(-dt / 0.4));
  dash = (dash + dt * 9) % 200;
  draw();
  frame = visible && !still.matches ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const pause = () => { touring = false; clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; run(); }, 6000); };
const steer = (next) => { pause(); target = clamp(next, P_MIN, P_MAX); if (still.matches) { share = target; draw(); } run(); };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
if (still.matches) touring = false;
stage.addEventListener("pointermove", (event) => {
  const box = svg.getBoundingClientRect();
  steer(P_MIN + clamp((event.clientX - box.left) / box.width, 0, 1) * (P_MAX - P_MIN));
});
stage.addEventListener("keydown", (event) => {
  const step = event.key === "ArrowRight" || event.key === "ArrowUp" ? 0.02 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -0.02 : 0;
  if (!step) return;
  event.preventDefault();
  steer(target + step);
});
draw();
`;

const tones = (top, s0, s1, s2, s3) => `--anatomy-top:${top};--anatomy-shade-0:${s0};--anatomy-shade-1:${s1};--anatomy-shade-2:${s2};--anatomy-shade-3:${s3};--anatomy-face:${s0}`;
const STATE = theme === "light" ? tones("#c4566f", "#a93a57", "#962f4b", "#9f3451", "#872944") : tones("#b04a66", "#953a54", "#7f3048", "#89344e", "#6f293f");
const PRIVATE = theme === "light" ? tones("#e8cf8a", "#d6b766", "#c6a553", "#ceae5c", "#b8964a") : tones("#a98a43", "#8f7438", "#7a6230", "#846a34", "#6a5429");
const css = `.cf-state{${STATE}}
.cf-private{${PRIVATE}}
.cf-feed{stroke:${INK.green};stroke-width:1.6;stroke-dasharray:2.6 9;stroke-linecap:round;fill:none}
.cf-rule{stroke:${INK.gold}!important;stroke-width:2.2!important}
svg.is-breach .cf-rule{stroke:${INK.red}!important;stroke-width:3!important;animation:cf-alarm 1s ease-in-out infinite}
@keyframes cf-alarm{50%{opacity:.35}}
@media (prefers-reduced-motion:reduce){svg.is-breach .cf-rule{animation:none}}`;

writeFigure({
  id: "desarrollo-mixto-sen",
  title: "Planeación vinculante y Desarrollo Mixto",
  theme,
  svg: svg.replace("</svg>", `<style>${css}</style></svg>`),
  live,
  plate: {
    fig: "Fig 10",
    title: "Regla 54/46",
    hint: "Desliza para cambiar la parte privada",
    ariaLabel: "Regla 54/46: las flechas cambian la parte privada de la energía inyectada",
    keys: [
      { mark: "red", label: "Energía del Estado: CFE y Desarrollo Mixto" },
      { mark: "gold", label: "Energía privada; el anillo marca el mínimo del Estado (54 %)" },
      { mark: "green", label: "Energía que entra a la red por la RNT y la RGD" },
    ],
    caption: "La planeación del sector eléctrico es vinculante y está a cargo de la SENER (LSE, art. 12); la CNE otorga los permisos. La Empresa Pública del Estado debe aportar al menos el 54 % de la energía que se inyecta a la red cada año. Los particulares participan con centrales propias o asociados con la CFE en esquemas de Desarrollo Mixto: Producción de Largo Plazo, en la que toda la energía es para la CFE, o Inversión Mixta, con al menos 54 % de participación de la CFE (LSE, arts. 38 a 40). Las baterías (SAEE) dan firmeza a la red, y la transmisión y la distribución son exclusivas del Estado.",
  },
});
