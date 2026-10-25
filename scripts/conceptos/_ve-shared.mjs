/**
 * Shared builder for "¿Cómo funciona?" regulatory & market explainers built with the
 * visual-explainer kit (vendor/visual-explainer, MIT).
 *
 * Physical machines/installations use the 3D isometric kit (vendor/anatomy → _shared.mjs);
 * regulatory architectures, governance flows, merit-order dispatch and price formation use
 * visual-explainer's 2D SVG flowcharts, steppers, waffle grids, stacked bars and small multiples.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderPage, prepareRenderedHtml } from "../../vendor/visual-explainer/kit/render.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "..", "public", "conceptos");

export const themeOf = (argv = process.argv) => (argv.includes("--light") ? "light" : "dark");

export function senerVeCss(theme) {
  const isLight = theme === "light";
  const tokens = isLight
    ? `
      --bg: #faf7f2;
      --surface: #ffffff;
      --border: #e6ddd2;
      --border-bright: #9b8e82;
      --text: #231c1e;
      --text-dim: #635a56;
      --accent: #9B2247;
      --accent-dim: rgba(155, 34, 71, 0.12);
      --ok: #1E5B4F;
      --warn: #A57F2C;
      --risk: #b83227;
      --info: #1b6278;
      --node-top: #ffffff;
      --lift: rgba(35, 28, 30, 0.08);
      --halo: 20%;
    `
    : `
      --bg: #181315;
      --surface: #221b1e;
      --border: #382e32;
      --border-bright: #78696e;
      --text: #f4ede6;
      --text-dim: #b5a89f;
      --accent: #ea8aa8;
      --accent-dim: rgba(234, 138, 168, 0.15);
      --ok: #6fc2ae;
      --warn: #e2b85a;
      --risk: #f28477;
      --info: #7cc4de;
      --node-top: color-mix(in srgb, var(--text) 7%, var(--surface));
      --lift: rgba(0, 0, 0, 0.45);
      --halo: 30%;
    `;

  return `
:root, :root[data-register] {
  color-scheme: ${theme};
  ${tokens}
  --font-body: 'Noto Sans', 'IBM Plex Sans', system-ui, sans-serif;
  --font-display: 'Merriweather', Georgia, serif;
  --font-mono: 'IBM Plex Mono', ui-monospace, monospace;
}
html, body {
  background: transparent !important;
}
main {
  max-width: 100%;
  margin: 0;
  padding: 14px 12px 22px;
  gap: 1.5rem;
}
.ve-card-shell {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 22px 24px;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.5rem;
}
header {
  gap: 0.4rem;
  margin-bottom: 0;
}
header h1 {
  font-size: clamp(1.3rem, 2.5vw, 1.7rem);
  max-width: none;
  line-height: 1.22;
  margin-bottom: 0.1rem;
}
header .lead {
  font-size: 0.94rem;
  max-width: 76ch;
  line-height: 1.55;
}
.kpis {
  gap: 1px;
}
.kpi {
  padding: 16px 18px;
  gap: 0.55rem;
}
.kpi .val {
  font-size: 2.2rem;
}
.frame {
  padding: 18px;
  border-radius: 12px;
}
/* Override kit.css oversized SVG font sizes so labels fit cleanly inside boxes */
.ve-svg {
  min-width: 680px;
  font: 600 13.5px var(--font-body);
}
.ve-n text {
  font-size: 13.5px;
  font-weight: 700;
}
.ve-n .ve-kind {
  font: 700 9.5px var(--font-mono);
  letter-spacing: 0.045em;
  text-transform: uppercase;
  fill: var(--text-dim);
}
.ve-n .sub {
  font: 500 11px var(--font-body);
  letter-spacing: 0;
  fill: var(--text-dim);
}
.ve-el {
  font: 600 10.5px var(--font-mono);
  stroke-width: 6px;
}
.ve-dim text {
  font: 600 10.5px var(--font-mono);
}
.ve-co circle {
  r: 10px;
}
.ve-co text {
  font: 700 11px var(--font-mono);
}
/* Clean section headers and spacious small-multiple cards */
.sec-head {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  border-top: 1px solid var(--border);
  padding-top: 1.25rem;
  margin-bottom: 1rem;
}
.sec-head h2 {
  font-size: clamp(1.15rem, 2vw, 1.38rem);
  line-height: 1.25;
}
.cases {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(15.5rem, 1fr));
  gap: 14px;
}
.case {
  padding: 16px;
  gap: 10px;
}
.case h3 {
  font-size: 0.98rem;
  line-height: 1.3;
}
.case > .ve-label {
  font: 400 0.84rem/1.5 var(--font-body);
  color: var(--text-dim);
}
.ve-mini {
  width: 100%;
  height: auto;
  font: 700 12px var(--font-body);
}
.ve-mini .ve-n text {
  font-size: 12px;
}
.ve-mini .ve-n .sub {
  font: 500 10px var(--font-body);
}
/* Interactive numbered hotspots [data-n] synced with parent view */
[data-n] {
  cursor: pointer;
}
g[data-n]:hover .sh,
g[data-n].is-selected .sh {
  stroke: var(--ok) !important;
  stroke-width: 2.5px !important;
  filter: drop-shadow(0 0 12px color-mix(in srgb, var(--ok) 45%, transparent));
}
.ve-co[data-n] circle {
  transition: transform 150ms ease, fill 150ms ease, stroke 150ms ease;
}
.ve-co[data-n]:hover circle,
.ve-co[data-n].is-selected circle {
  fill: var(--ok) !important;
  stroke: var(--ok) !important;
}
.ve-co[data-n]:hover text,
.ve-co[data-n].is-selected text {
  fill: #fff !important;
}
.case[data-n] {
  transition: border-color 150ms ease, transform 150ms ease, box-shadow 150ms ease;
}
.case[data-n]:hover,
.case[data-n].is-selected {
  border-color: var(--ok) !important;
  transform: translateY(-1px);
  box-shadow: 0 8px 20px -12px color-mix(in srgb, var(--ok) 50%, transparent);
}
.ve-part-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent);
  color: ${isLight ? "#fff" : "#181315"};
  font: 700 11px var(--font-mono);
  margin-right: 6px;
}
.ve-controls-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  margin-bottom: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
}
.ve-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ve-chips button {
  font: 600 12px var(--font-body);
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid var(--border-bright);
  background: var(--bg);
  color: var(--text);
  cursor: pointer;
}
.ve-chips button[aria-pressed="true"] {
  background: var(--accent);
  border-color: var(--accent);
  color: ${isLight ? "#fff" : "#181315"};
}
.ve-slider-box {
  display: flex;
  align-items: center;
  gap: 10px;
  font: 600 12.5px var(--font-mono);
  color: var(--text);
}
.ve-slider-box input[type="range"] {
  accent-color: var(--accent);
  width: 150px;
}
.ve-readout {
  margin-top: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--surface);
  border-left: 4px solid var(--accent);
  font: 500 13.5px/1.5 var(--font-body);
  color: var(--text);
}
.ve-player {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--border);
}
.ve-cap {
  font-size: 0.92rem;
  line-height: 1.55;
  margin-bottom: 6px;
}
.ve-zone {
  fill: color-mix(in srgb, var(--surface) 65%, transparent);
  stroke: var(--border-bright);
  stroke-width: 1.25;
  stroke-dasharray: 6 4;
  rx: 10px;
}
.ve-zone-title {
  fill: var(--text-dim);
  font: 700 10px var(--font-mono);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
`;
}

export function veLiveBridge(id) {
  return `
{
  const partEls = [...document.querySelectorAll("[data-n]")];
  function selectVePart(n, notify = true) {
    partEls.forEach((el) => {
      const match = Number(el.dataset.n) === Number(n);
      el.classList.toggle("is-selected", match);
    });
    if (notify && parent !== window) {
      parent.postMessage({ type: "concepto-part", id: ${JSON.stringify(id)}, figura: ${JSON.stringify(id)}, n: Number(n) }, location.origin);
    }
  }
  partEls.forEach((el) => {
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      const n = Number(el.dataset.n);
      const next = el.classList.contains("is-selected") ? 0 : n;
      selectVePart(next, true);
    });
    el.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        event.stopPropagation();
        const n = Number(el.dataset.n);
        const next = el.classList.contains("is-selected") ? 0 : n;
        selectVePart(next, true);
      }
    });
  });
  window.addEventListener("message", (event) => {
    if (event.origin !== location.origin || event.data?.type !== "concepto-select-part") return;
    selectVePart(Number(event.data.n) || 0, false);
  });

  // Translate stepper Play/Pause button states to Spanish if present
  const playBtn = document.querySelector("[data-play]");
  if (playBtn) {
    const obs = new MutationObserver(() => {
      if (playBtn.textContent === "Play") playBtn.textContent = "▶ Paso a paso";
      else if (playBtn.textContent === "Pause") playBtn.textContent = "⏸ Pausar";
    });
    obs.observe(playBtn, { childList: true, characterData: true, subtree: true });
    if (playBtn.textContent === "Play") playBtn.textContent = "▶ Paso a paso";
  }

  const postHeight = () => {
    if (parent !== window) {
      const h = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      parent.postMessage({ type: "concepto-height", id: ${JSON.stringify(id)}, figura: ${JSON.stringify(id)}, h }, location.origin);
    }
  };
  new ResizeObserver(postHeight).observe(document.body);
  window.addEventListener("load", postHeight);
  setTimeout(postHeight, 120);
}
`;
}

/**
 * Renders a visual-explainer source HTML into public/conceptos/<id>(-light).html.
 */
export function writeVeFigure({ id, title, theme, register = "blueprint", css = "", body, live = "" }) {
  const source = `<!doctype html>
<html lang="es-MX" data-register="${register}">
<head>
<meta charset="utf-8">
<title>${title} · ¿Cómo funciona?</title>
<link rel="stylesheet" href="kit.css" data-ve-kit>
<style>${senerVeCss(theme)}\n${css}</style>
</head>
<body>
<main>
  <div class="ve-card-shell">
    ${body}
  </div>
</main>
<script data-ve-kit></script>
<script>${veLiveBridge(id)}\n${live}</script>
</body>
</html>`;

  const rendered = renderPage(source);
  if (rendered.errors?.length) {
    throw new Error(`visual-explainer errors in ${id}:\n${rendered.errors.join("\n")}`);
  }
  const html = prepareRenderedHtml(rendered.html);
  mkdirSync(OUT, { recursive: true });
  const file = join(OUT, theme === "light" ? `${id}-light.html` : `${id}.html`);
  writeFileSync(file, html);
  console.log("wrote (visual-explainer)", file, Math.round(html.length / 1024), "KB");
}
