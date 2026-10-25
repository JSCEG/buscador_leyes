/**
 * Shared pieces for the "¿Cómo funciona?" figures (scripts/conceptos/*.mjs): institutional colours,
 * numbered part names, the names toggle, the compact (phone) mode, the embedding in the site's
 * iframe and the page writer. Built on the anatomy kit (vendor/anatomy, MIT).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../vendor/anatomy/kit/iso-kit.mjs";
import { kitScript } from "../../vendor/anatomy/scripts/inline-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "..", "public", "conceptos");

export const themeOf = (argv = process.argv) => (argv.includes("--light") ? "light" : "dark");

export function inkOf(theme) {
  return theme === "light"
    ? { red: "#9B2247", green: "#1E5B4F", gold: "#A57F2C", glow: "#e9c46a", tagBg: "#ffffff", tagInk: "#2b2326", screen: "#0f2a24", trace: "#6fe0b8" }
    : { red: "#ea8aa8", green: "#6fc2ae", gold: "#e2b85a", glow: "#f2d27d", tagBg: "#211b1d", tagInk: "#f3ece4", screen: "#0c1f1b", trace: "#7ff0c6" };
}

/** Numbered names: a dot on the part, a leader and a tag. Narrow cards show only the number. */
export function labelsSvg(labels, at) {
  return labels.map(({ n, name, anchor, dx, dy }) => {
    const [ax, ay] = at(anchor);
    const tx = ax + dx;
    const ty = ay + dy;
    const width = 26 + name.length * 5.3;
    const left = dx < 0 ? tx - width + 10 : tx - 10;
    const badge = dx < 0 ? left + width - 10 : left + 10;
    return `<g class="cf-label" data-n="${n}" role="button" tabindex="0" aria-label="Parte ${n}: ${name}">
      <path class="cf-leader" d="M${ax.toFixed(1)} ${ay.toFixed(1)}L${tx.toFixed(1)} ${ty.toFixed(1)}"/>
      <circle class="cf-anchor" cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="1.9"/>
      <rect class="cf-tag cf-full" x="${left.toFixed(1)}" y="${(ty - 9).toFixed(1)}" width="${width.toFixed(1)}" height="18" rx="9"/>
      <circle class="cf-badge" cx="${badge.toFixed(1)}" cy="${ty.toFixed(1)}" r="7"/>
      <text class="cf-num" x="${badge.toFixed(1)}" y="${(ty + 3.2).toFixed(1)}" text-anchor="middle">${n}</text>
      <text class="cf-name cf-full" x="${(dx < 0 ? left + 8 : left + 21).toFixed(1)}" y="${(ty + 3.4).toFixed(1)}">${name}</text>
    </g>`;
  }).join("");
}

/** The CSS every figure shares, after the kit's own. */
export function figureCss(theme) {
  const I = inkOf(theme);
  return `body.iso[data-theme="${theme}"]{--anatomy-red:${I.red};--anatomy-green:${I.green};--cf-gold:${I.gold};--cf-glow:${I.glow};--cf-accent:${I.red};--cf-border:var(--anatomy-mid);--cf-card:var(--anatomy-card)}
.iso-swatch[data-mark="gold"] path{stroke:var(--cf-gold)}
html{background:transparent!important;color-scheme:${theme}}
body{background:transparent!important}
.iso-page{width:100%!important;margin:0!important;padding:0 2px}
.iso-stage{position:relative;touch-action:pan-y}
.cf-flow{stroke-dasharray:2.6 17.4;stroke-width:2.1;stroke-linecap:round}
.cf-leader{fill:none;stroke:var(--anatomy-mid);stroke-width:.8;transition:stroke .15s,stroke-width .15s}
.cf-anchor{fill:var(--anatomy-paper);stroke:var(--anatomy-hi);stroke-width:1;transition:fill .15s,r .15s}
.cf-tag{fill:${I.tagBg};stroke:var(--anatomy-mid);stroke-width:.7;transition:stroke .15s,stroke-width .15s}
.cf-badge{fill:${I.red};transition:fill .15s}
.cf-num{fill:#fff;font:700 9px ui-sans-serif,system-ui,sans-serif;pointer-events:none}
.cf-name{fill:${I.tagInk};font:600 9.5px ui-sans-serif,system-ui,sans-serif;pointer-events:none}
.cf-label{cursor:pointer;outline:none}
.cf-label:hover .cf-tag,.cf-label.is-selected .cf-tag{stroke:${I.green};stroke-width:1.4}
.cf-label:hover .cf-badge,.cf-label.is-selected .cf-badge{fill:${I.green}}
.cf-label.is-selected .cf-anchor{fill:${I.green};stroke:${I.green}}
.cf-label.is-selected .cf-leader{stroke:${I.green};stroke-width:1.3}
.cf-label:focus-visible .cf-tag{stroke:${I.green};stroke-width:2;stroke-dasharray:3 2}
.cf-label:focus-visible .cf-badge{stroke:${I.green};stroke-width:2.5}
.cf-compact .cf-full{display:none}
.cf-compact .cf-badge{r:11}
.cf-compact .cf-num{font-size:13px;transform:translateY(1.4px)}
.cf-no-names [data-part="labels"]{display:none}
.cf-names-toggle,.cf-chips button{padding:5px 11px;border:1px solid var(--anatomy-mid);border-radius:999px;background:${I.tagBg};color:${I.tagInk};font:600 11.5px ui-sans-serif,system-ui,sans-serif;cursor:pointer}
.cf-names-toggle{position:absolute;right:12px;top:34px;z-index:2}
.cf-chips{position:absolute;left:12px;top:34px;z-index:2;display:flex;flex-wrap:wrap;gap:4px;max-width:70%}
.cf-chips button[aria-pressed="true"]{background:${I.red};border-color:${I.red};color:#fff}
.cf-compact .cf-names-toggle{top:0}
.cf-compact .cf-chips{position:relative;top:0;left:0;margin:0 0 8px;max-width:calc(100% - 118px)}
.cf-compact .cf-chips button,.cf-compact .cf-names-toggle{padding:3px 7px;font-size:10px}
.cf-glow{fill:var(--cf-glow)}
.cf-gold{stroke:var(--cf-gold)}
.cf-screen{fill:${I.screen}}
.cf-trace{fill:none;stroke:${I.trace};stroke-width:1.6;stroke-linejoin:round;stroke-linecap:round}
.cf-grid{fill:none;stroke:${I.trace};stroke-width:.35;opacity:.35}
/* Live numbers: big, centred under the drawing, easy to read on a phone. */
.iso-plate{padding-bottom:96px!important}.iso-plate-corner[data-corner="readout"]{left:0;right:0;bottom:0;text-align:center;white-space:normal;font:700 17px/1.35 ui-sans-serif,system-ui,sans-serif;letter-spacing:0;color:var(--anatomy-text)}.iso-plate-corner[data-corner="hint"]{bottom:44px!important}.cf-compact~.iso-plate-corners [data-corner="readout"],.iso-page:has(.cf-compact) [data-corner="readout"]{font-size:14.5px}
`;
}

/** Live code every figure shares: names toggle, compact mode, hotspot selection, frame height for the site. */
export function liveCommon(id) {
  return `
const cfStage = document.querySelector(".iso-stage");
const cfSvg = cfStage.querySelector("svg");
let compact = false;
const cfToggle = document.querySelector("[data-names]");
if (cfToggle) cfToggle.addEventListener("click", (event) => {
  event.stopPropagation();
  const on = cfSvg.classList.contains("cf-no-names");
  cfSvg.classList.toggle("cf-no-names", !on);
  cfToggle.setAttribute("aria-pressed", String(on));
  cfToggle.textContent = on ? "Ocultar nombres" : "Mostrar nombres";
});
// Many figures redraw their labels from draw(), so events are delegated from the svg and the
// selection is re-applied whenever new labels appear.
let cfSelected = 0;
const markCfLabels = () => cfSvg.querySelectorAll(".cf-label[data-n]").forEach((el) => el.classList.toggle("is-selected", Number(el.dataset.n) === cfSelected));
function selectCfPart(n, notify = true) {
  cfSelected = n;
  markCfLabels();
  if (notify && parent !== window) {
    parent.postMessage({ type: "concepto-part", figura: ${JSON.stringify(id)}, n }, location.origin);
  }
}
const toggleCfPart = (el) => selectCfPart(Number(el.dataset.n) === cfSelected ? 0 : Number(el.dataset.n), true);
cfSvg.addEventListener("click", (event) => {
  const el = event.target.closest(".cf-label[data-n]");
  if (!el) return;
  event.stopPropagation();
  toggleCfPart(el);
});
cfSvg.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const el = event.target.closest(".cf-label[data-n]");
  if (!el) return;
  event.preventDefault();
  event.stopPropagation();
  toggleCfPart(el);
});
new MutationObserver((records) => {
  if (cfSelected && records.some((r) => [...r.addedNodes].some((node) => node.nodeType === 1 && (node.matches(".cf-label") || node.querySelector(".cf-label"))))) markCfLabels();
}).observe(cfSvg, { childList: true, subtree: true });
window.addEventListener("message", (event) => {
  if (event.origin !== location.origin || event.data?.type !== "concepto-select-part") return;
  selectCfPart(Number(event.data.n) || 0, false);
});
new ResizeObserver(() => {
  compact = cfStage.getBoundingClientRect().width < 520;
  cfSvg.classList.toggle("cf-compact", compact);
  cfStage.classList.toggle("cf-compact", compact);
  if (typeof draw === "function") draw();
}).observe(cfStage);
const postHeight = () => { if (parent !== window) parent.postMessage({ type: "concepto-height", id: ${JSON.stringify(id)}, h: document.documentElement.scrollHeight }, location.origin); };
new ResizeObserver(postHeight).observe(document.body);
postHeight();
`;
}

const LATHE = readFileSync(join(HERE, "..", "..", "vendor", "anatomy", "kit", "lathe.mjs"), "utf8").replace(/^import .*$/gm, "").replace(/^export /gm, "");
/** Lathe helpers in the page, isolated so their internals don't clash with the kit's names. */
export const latheScript = (names) => `const { ${names.join(", ")} } = (() => {\n${LATHE}\nreturn { ${names.join(", ")} };\n})();\n`;

/** Writes public/conceptos/<id>(-light).html. `controls` is extra HTML placed in the stage. */
export function writeFigure({ id, title, theme, svg, controls = "", live, lathe = [], plate }) {
  const stage = `<div class="iso-stage" tabindex="0" role="slider" aria-label="${plate.ariaLabel}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">${controls}<button type="button" class="cf-names-toggle" data-names aria-pressed="true">Ocultar nombres</button>${svg}</div>`;
  const body = k.plateHtml({ fig: plate.fig, title: plate.title, hint: plate.hint, readout: "", keys: plate.keys, caption: plate.caption, body: stage });
  // Shared code first: the figure's draw() reads `compact` from it.
  const script = `${kitScript()}\n${lathe.length ? latheScript(lathe) : ""}${liveCommon(id)}\n${live}`;
  const html = k.pageHtml({ title: `${title} · ¿Cómo funciona?`, theme, body, script, width: 640 })
    .replace('<html lang="en">', '<html lang="es-MX">')
    .replace("</head>", `<style>${figureCss(theme)}</style></head>`);
  mkdirSync(OUT, { recursive: true });
  const file = join(OUT, theme === "light" ? `${id}-light.html` : `${id}.html`);
  writeFileSync(file, html);
  console.log("wrote", file, Math.round(html.length / 1024), "KB");
}
