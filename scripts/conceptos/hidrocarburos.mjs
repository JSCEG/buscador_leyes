/**
 * "¿Cómo funciona?" · ¿Qué son los hidrocarburos? (Estructura molecular interactiva).
 *
 * An interactive isometric plate showing the 3D molecular structure of key hydrocarbons:
 *   - Metano (CH₄): 1 átomo de carbono central con 4 hidrógenos en tetraedro (Gas Natural).
 *   - Propano (C₃H₈): cadena de 3 carbonos con 8 hidrógenos (Gas LP).
 *   - Octano (C₈H₁₈): cadena de 8 carbonos representativa de las gasolinas.
 * Chips at the top let the user switch between molecules to see how molecular weight changes
 * the state from gas to liquid.
 *
 * node scripts/conceptos/hidrocarburos.mjs [--light]  →  public/conceptos/hidrocarburos(-light).html
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
  [0, 0, 90],
  [-70, 0, 50],
  [70, 0, 50]
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

// Draw an atom sphere in 2.5D with realistic gradient shading
function atom(pt, type = "C") {
  const [cx, cy] = at(pt);
  const isC = type === "C";
  const r = isC ? 14 : 9;
  const gradId = isC ? "grad-carbon" : "grad-hydrogen";
  return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r}" fill="url(#${gradId})" stroke="${isC ? '#111' : '#b0a69d'}" stroke-width="0.8"/>
  <text x="${cx.toFixed(1)}" y="${(cy + (isC ? 4.5 : 3.2)).toFixed(1)}" text-anchor="middle" font-family="'Noto Sans', sans-serif" font-weight="700" font-size="${isC ? '11' : '8'}" fill="${isC ? '#fff' : '#2b2326'}" pointer-events="none">${type}</text>`;
}

// Bond line between two atoms
function bond(pA, pB) {
  const [x1, y1] = at(pA);
  const [x2, y2] = at(pB);
  return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--cf-border)" stroke-width="4.5" stroke-linecap="round"/>
  <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${theme === 'light' ? '#706760' : '#c5bdb5'}" stroke-width="2.5" stroke-linecap="round"/>`;
}

// 1. Metano (CH4)
function metano() {
  const c = [0, 0, 48];
  const h1 = [0, 0, 72];
  const h2 = [-20, 16, 36];
  const h3 = [20, 16, 36];
  const h4 = [0, -22, 34];
  const bonds = [bond(c, h1), bond(c, h2), bond(c, h3), bond(c, h4)].join("");
  const atoms = [atom(h4, "H"), atom(h2, "H"), atom(c, "C"), atom(h3, "H"), atom(h1, "H")].join("");
  return `<g class="mol-group" data-mol="metano">${bonds}${atoms}</g>`;
}

// 2. Propano (C3H8)
function propano() {
  const c1 = [-38, 0, 42];
  const c2 = [0, 0, 56];
  const c3 = [38, 0, 42];
  
  const h = [
    [-38, 0, 64], [-38, -20, 32], [-58, 0, 42],
    [0, 20, 68], [0, -20, 44],
    [38, 0, 64], [38, 20, 32], [58, 0, 42]
  ];

  const bonds = [
    bond(c1, c2), bond(c2, c3),
    bond(c1, h[0]), bond(c1, h[1]), bond(c1, h[2]),
    bond(c2, h[3]), bond(c2, h[4]),
    bond(c3, h[5]), bond(c3, h[6]), bond(c3, h[7])
  ].join("");

  const atoms = [
    atom(h[1], "H"), atom(h[2], "H"), atom(c1, "C"), atom(h[0], "H"),
    atom(h[4], "H"), atom(c2, "C"), atom(h[3], "H"),
    atom(c3, "C"), atom(h[5], "H"), atom(h[6], "H"), atom(h[7], "H")
  ].join("");

  return `<g class="mol-group" data-mol="propano" style="display:none">${bonds}${atoms}</g>`;
}

// 3. Octano (C8H18)
function octano() {
  const bonds = [];
  const atoms = [];
  const carbons = [];
  for (let i = 0; i < 8; i++) {
    const x = -70 + i * 20;
    const z = 44 + (i % 2 === 0 ? 0 : 12);
    carbons.push([x, (i % 2) * 6, z]);
  }
  for (let i = 0; i < 7; i++) {
    bonds.push(bond(carbons[i], carbons[i + 1]));
  }
  // Hydrogens top and bottom
  for (let i = 0; i < 8; i++) {
    const [cx, cy, cz] = carbons[i];
    const topH = [cx, cy + 14, cz + 14];
    const botH = [cx, cy - 14, cz - 14];
    bonds.push(bond(carbons[i], topH));
    bonds.push(bond(carbons[i], botH));
    atoms.push(atom(botH, "H"));
    atoms.push(atom(carbons[i], "C"));
    atoms.push(atom(topH, "H"));
  }
  return `<g class="mol-group" data-mol="octano" style="display:none">${bonds.join("")}${atoms.join("")}</g>`;
}

const labels = [
  { n: 1, name: "Átomo de carbono (C)", anchor: [0, 0, 56], dx: -45, dy: -28 },
  { n: 2, name: "Átomo de hidrógeno (H)", anchor: [0, 0, 72], dx: 45, dy: -20 },
  { n: 3, name: "Enlace covalente C-H", anchor: [0, 0, 60], dx: 45, dy: 14 }
];

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "Estructura molecular de hidrocarburos: metano, propano y octano",
  body: [
    `<defs>
      <radialGradient id="grad-carbon" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#4a4245"/>
        <stop offset="60%" stop-color="#211b1d"/>
        <stop offset="100%" stop-color="#0a0809"/>
      </radialGradient>
      <radialGradient id="grad-hydrogen" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="70%" stop-color="#e0d7ce"/>
        <stop offset="100%" stop-color="#aba096"/>
      </radialGradient>
    </defs>`,
    `<g data-part="base">${base()}</g>`,
    `<g data-part="molecules">
      ${metano()}
      ${propano()}
      ${octano()}
    </g>`,
    `<g data-part="labels">${labelsSvg(labels, at)}</g>`
  ]
});

const live = `
const stage = document.querySelector(".iso-stage");
const readout = document.querySelector('[data-corner="readout"]');
const groups = stage.querySelectorAll(".mol-group");
const chips = document.querySelectorAll(".cf-chips button");

const DATA = {
  metano: { formula: "CH₄", estado: "Gas a temperatura ambiente", uso: "Principal componente del Gas Natural", ebullicion: "-161 °C" },
  propano: { formula: "C₃H₈", estado: "Gas licuable a presión moderada", uso: "Componente del Gas LP doméstico", ebullicion: "-42 °C" },
  octano: { formula: "C₈H₁₈", estado: "Líquido volátil", uso: "Base representativa de las gasolinas de motor", ebullicion: "125 °C" }
};

function select(name) {
  groups.forEach(g => {
    g.style.display = g.dataset.mol === name ? "" : "none";
  });
  chips.forEach(c => {
    const active = c.dataset.mol === name;
    c.setAttribute("aria-pressed", String(active));
  });
  const info = DATA[name];
  if (readout && info) {
    readout.innerHTML = '<strong style="color:var(--cf-gold);font-size:18px">' + info.formula + '</strong> · ' + info.estado + ' · <i>' + info.uso + '</i> (Punto de ebullición: ' + info.ebullicion + ')';
  }
}

chips.forEach(c => c.addEventListener("click", () => select(c.dataset.mol)));
select("metano");
`;

const controls = `<div class="cf-chips" role="group" aria-label="Elegir hidrocarburo">
  <button type="button" data-mol="metano" aria-pressed="true">Metano (Gas Natural)</button>
  <button type="button" data-mol="propano" aria-pressed="false">Propano (Gas LP)</button>
  <button type="button" data-mol="octano" aria-pressed="false">Octano (Gasolina)</button>
</div>`;

writeFigure({
  id: "hidrocarburos",
  title: "Estructura molecular de hidrocarburos",
  theme,
  svg,
  controls,
  live,
  plate: {
    fig: "Fig. Hidrocarburos",
    title: "Estructura molecular de hidrocarburos",
    hint: "Toca los botones arriba para cambiar la molécula",
    ariaLabel: "Visualizador interactivo de moléculas de hidrocarburos",
    keys: [
      { mark: "gold", label: "Átomos de carbono (negro) y de hidrógeno (blanco) unidos por enlaces químicos" }
    ],
    caption: "Las moléculas con pocos carbonos (1 a 4) son gases como el metano y el propano; conforme la cadena crece (5 a 12) se convierten en líquidos como las gasolinas."
  }
});
