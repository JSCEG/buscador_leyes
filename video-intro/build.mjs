// Writes index.html from the site's own artwork, so the video never drifts from the logo.
// Run from the repository root: node video-intro/build.mjs [portrait]
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const root = process.cwd();
const load = file => import(pathToFileURL(path.join(root, file)).href);
const { wingsSvg } = await load('src/lib/brand-wings.js');
const { MARK_BODY, MARK_BROW, MARK_EYE } = await load('src/lib/brand-mark.js');
const { MEXICO_VIEWBOX, MEXICO_STATES } = await load('src/lib/mexico-map.js');

// The official mark, brought to the film's drawing units: the eye keeps its place at (68, 59).
const MARK_SCALE = 0.31;
const fit = d => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${(x * MARK_SCALE - 7.6).toFixed(2)},${(y * MARK_SCALE + 17.5).toFixed(2)}`);
const BROW = fit(MARK_BROW);
const BODY = fit(MARK_BODY);
const EYE = fit(MARK_EYE);

const IVORY = '#F6EFE6';
const ROSE = '#E57A9A';
const NAME = 'Buscador Jurídico';
const SUBTITLE = 'Leyes y reglas de energía de México';
const DURATION = 3.8;
const PORTRAIT = process.argv[2] === 'portrait';
// Keep each eye in step with FILMS in src/scripts/site-intro.js: (x + 68 * scale) / W, (y + 60 * scale) / H.
const LAYOUT = PORTRAIT
  ? { W: 1080, H: 1920, map: [-190, 420, 1460, 993], wings: [60, 544, 960, 384], mark: [403.6, 560, 2.2], words: 970, name: 92, sub: 34, focus: '50% 36%' }
  : { W: 1920, H: 1080, map: [210, 30, 1500, 1020], wings: [260, 104, 1400, 560], mark: [795, 186, 2.65], words: 682, name: 88, sub: 30, focus: '50% 42%' };
const { W, H } = LAYOUT;
const box = ([left, top, width, height]) => `left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px;`

// Open the wings wider than the intro in the page: here the mark stands alone, without sheets.
const wings = wingsSvg({ blade: IVORY, feather: ROSE, className: 'wings' })
  .replace('<g><g class="si-wing">', '<g transform="translate(-48 0)"><g class="si-wing">')
  .replace('matrix(-1 0 0 1 900 0)', 'matrix(-1 0 0 1 948 0)');

const letters = [...NAME].map(ch => (ch === ' ' ? '<span class="gap"> </span>' : `<span class="ch">${ch}</span>`)).join('');
const states = MEXICO_STATES.map(state => `<path class="state" pathLength="1" d="${state.d}"/>`).join('');

const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js"></script>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500..700&family=Noto+Sans:wght@400;500&display=block" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #0d0b0b; }
      #root { position: relative; width: ${W}px; height: ${H}px; overflow: hidden; background: #0d0b0b; }
      #aura { position: absolute; inset: 0; background: radial-gradient(760px 560px at ${LAYOUT.focus}, rgba(155, 34, 71, .34), rgba(155, 34, 71, 0) 72%); }
      #stage { position: absolute; inset: 0; }
      #map { position: absolute; ${box(LAYOUT.map)} }
      .state { fill: none; stroke: #9B2247; stroke-opacity: .38; stroke-width: 1.2; stroke-dasharray: 1 1; stroke-dashoffset: 1; }
      .wings { position: absolute; ${box(LAYOUT.wings)} overflow: visible; }
      #mark { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; overflow: visible; }
      .reveal { fill: none; stroke: #fff; stroke-dasharray: 1 1; stroke-dashoffset: 1; }
      #words { position: absolute; left: 0; right: 0; top: ${LAYOUT.words}px; display: grid; justify-items: center; color: ${IVORY}; }
      #name { display: flex; overflow: hidden; padding: 4px 8px 10px; font: 600 ${LAYOUT.name}px/1.1 Newsreader, serif; letter-spacing: -.01em; }
      #name .ch { display: inline-block; }
      #name .gap { display: inline-block; width: .26em; }
      #rule { width: 150px; height: 3px; margin-top: 14px; background: ${ROSE}; transform-origin: center; }
      #sub { margin-top: 22px; overflow: hidden; font: 400 ${LAYOUT.sub}px/1.3 "Manrope", sans-serif; color: #E9DFD0; }
      #sub span { display: block; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${DURATION}" data-width="${W}" data-height="${H}">
      <div id="aura"></div>
      <div id="stage">
        <svg id="map" viewBox="${MEXICO_VIEWBOX}" aria-hidden="true">${states}</svg>
        ${wings}
        <svg id="mark" viewBox="0 0 ${W} ${H}" aria-hidden="true">
          <defs>
            <filter id="soft" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="9" /></filter>
            <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stop-color="#fff" stop-opacity="0" />
              <stop offset=".5" stop-color="#FFFFFF" stop-opacity=".95" />
              <stop offset="1" stop-color="#fff" stop-opacity="0" />
            </linearGradient>
            <mask id="ink-brow" maskUnits="userSpaceOnUse" x="-20" y="-20" width="170" height="200">
              <path class="reveal" id="r-left" pathLength="1" stroke-width="44" d="M72 46 C44 46 24 38 6 18" />
              <path class="reveal" id="r-right" pathLength="1" stroke-width="44" d="M54 44 C90 46 108 36 124 18" />
              <path class="reveal" id="r-beak" pathLength="1" stroke-width="34" d="M84 40 L88 72" />
            </mask>
            <mask id="ink-body" maskUnits="userSpaceOnUse" x="-20" y="-20" width="170" height="200">
              <path class="reveal" id="r-body" pathLength="1" stroke-width="56" d="M64 40 C34 40 24 58 29 70 C34 82 56 81 68 84 C88 88 98 100 96 116 C94 132 82 146 72 158 L18 120 L-6 122" />
            </mask>
            <mask id="whole" maskUnits="userSpaceOnUse" x="-20" y="-20" width="170" height="200">
              <path fill="#fff" d="${BROW}" /><path fill="#fff" d="${BODY}" />
            </mask>
          </defs>
          <g transform="translate(${LAYOUT.mark[0]} ${LAYOUT.mark[1]}) scale(${LAYOUT.mark[2]})">
            <path id="brow" d="${BROW}" fill="${IVORY}" mask="url(#ink-brow)" />
            <path id="body" d="${BODY}" fill="${IVORY}" mask="url(#ink-body)" />
            <g mask="url(#whole)"><rect id="sweep" x="-70" y="-20" width="46" height="210" fill="url(#sheen)" /></g>
            <path id="glow" d="${EYE}" fill="${ROSE}" filter="url(#soft)" />
            <path id="eye" d="${EYE}" fill="${ROSE}" />
          </g>
        </svg>
        <div id="words">
          <div id="name" aria-label="${NAME}">${letters}</div>
          <div id="rule"></div>
          <p id="sub"><span>${SUBTITLE}</span></p>
        </div>
      </div>
    </div>
    <script>
      const tl = gsap.timeline({ paused: true });
      // The camera settles for the whole film.
      tl.fromTo("#stage", { scale: 1.06 }, { scale: 1, duration: ${DURATION}, ease: "expo.out", transformOrigin: "${LAYOUT.focus}" }, 0);
      // The glow arrives with the mark: on its own, over black, it reads as a dark disc.
      tl.fromTo('#aura', { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'sine.inOut' }, 0.7);
      // 1. In the dark, the eye opens first.
      tl.fromTo(["#eye", "#glow"], { scaleY: 0.05, scaleX: 0.3, opacity: 0, svgOrigin: "68 59" }, { scaleY: 1, scaleX: 1, opacity: 1, duration: 0.55, ease: "expo.out" }, 0.08);
      tl.to("#glow", { opacity: 0.45, duration: 0.8, ease: "sine.inOut" }, 0.7);
      // 2. Its light finds the country.
      tl.to(".state", { strokeDashoffset: 0, duration: 1.5, stagger: 0.012, ease: "power2.inOut" }, 0.2);
      // 3. The brow and the S are written like ink.
      tl.to(["#r-left", "#r-right", "#r-beak"], { strokeDashoffset: 0, duration: 0.55, ease: "power3.inOut" }, 0.38);
      tl.to("#r-body", { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }, 0.58);
      // 4. The wings open, feather by feather.
      document.querySelectorAll(".si-wing").forEach(wing => {
        tl.fromTo(wing.querySelectorAll(".si-feather"),
          { rotation: -48, scale: 0.45, opacity: 0, svgOrigin: "400 230" },
          { rotation: 0, scale: 1, opacity: 1, duration: 0.85, ease: "back.out(1.3)", stagger: 0.04 }, 1.08);
      });
      // 5. A single sweep of light crosses the finished mark.
      tl.to("#sweep", { attr: { x: 150 }, duration: 0.75, ease: "power2.inOut" }, 1.72);
      // 6. The name arrives.
      tl.fromTo("#name .ch", { yPercent: 115 }, { yPercent: 0, duration: 0.65, ease: "expo.out", stagger: 0.018 }, 1.82);
      tl.fromTo("#rule", { scaleX: 0 }, { scaleX: 1, duration: 0.55, ease: "expo.out" }, 2.25);
      tl.fromTo("#sub span", { yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: "expo.out" }, 2.32);
      // 7. It blinks once: it is alive, and the page opens from this eye.
      tl.to(["#eye", "#glow"], { scaleY: 0.1, duration: 0.09, ease: "power2.in", svgOrigin: "68 59" }, 3.2);
      tl.to(["#eye", "#glow"], { scaleY: 1, duration: 0.16, ease: "power2.out", svgOrigin: "68 59" }, 3.29);
      tl.set({}, {}, ${DURATION});
      window.__timelines["main"] = tl;
      tl.seek(0);
    </script>
  </body>
</html>
`;
fs.writeFileSync(path.join(root, 'video-intro/index.html'), html);
console.log('index.html', html.length);
