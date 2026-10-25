/**
 * Animated entrance: the states of Mexico trace themselves and light up, three sheets land, the mark
 * builds on them (bar, page, lines, lens), the name writes in with the size of the acervo counting up,
 * and the site opens through the lens like an iris.
 * Once a day, skippable, and never for deep links or reduced motion.
 */
import { brandMarkSvg } from '../lib/brand-mark.js';
import { MEXICO_VIEWBOX, MEXICO_STATES } from '../lib/mexico-map.js';
import '../styles/site-intro.css';

const KEY = 'intro-dia';
const FIGURES_KEY = 'intro-cifras';
const NAME = 'Buscador Jurídico';
const HOLD_MS = 3400;
const OPEN_MS = 800;
const today = () => new Date().toISOString().slice(0, 10);

// The acervo's size arrives after the intro starts, so the intro shows the figures of the last visit.
window.addEventListener('search-ready', event => {
    const { totalLeyes, totalArticulos } = event.detail || {};
    if (!totalLeyes || !totalArticulos) return;
    try { localStorage.setItem(FIGURES_KEY, JSON.stringify({ leyes: totalLeyes, articulos: totalArticulos })); } catch { /* ignore */ }
});
function savedFigures() {
    try {
        const { leyes, articulos } = JSON.parse(localStorage.getItem(FIGURES_KEY)) || {};
        return leyes > 0 && articulos > 0 ? { leyes, articulos } : null;
    } catch { return null; }
}

const mapSvg = () => `<svg class="si-map" viewBox="${MEXICO_VIEWBOX}" aria-hidden="true">
    <g class="si-states">${MEXICO_STATES.map((s, i) => `<path d="${s.d}" pathLength="1" style="--i:${i}"/>`).join('')}</g>
    <g class="si-dots">${MEXICO_STATES.map((s, i) => `<circle cx="${s.at[0]}" cy="${s.at[1]}" r="5" class="${i % 3 ? '' : 'is-gold'}" style="--i:${i}"/>`).join('')}</g>
</svg>`;

/** Counts each [data-to] number up from zero, with an ease-out, starting after `delay`. */
function countUp(layer, delay) {
    const nodes = [...layer.querySelectorAll('[data-to]')];
    if (!nodes.length) return;
    const fmt = new Intl.NumberFormat('es-MX');
    setTimeout(() => {
        const start = performance.now();
        const step = now => {
            const t = Math.min(1, (now - start) / 900);
            const eased = 1 - (1 - t) ** 3;
            nodes.forEach(node => { node.textContent = fmt.format(Math.round(Number(node.dataset.to) * eased)); });
            if (t < 1 && layer.isConnected) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }, delay);
}

export function shouldShowIntro() {
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
    if (/^#(art-|lectura-|mesa-|ley-)/.test(location.hash)) return false;
    // Coming back from an auth email (reset, confirmation): go straight to the dialog.
    if (/access_token|error_description|(^|[#&])type=/.test(location.hash) || /[?&](code|type)=/.test(location.search)) return false;
    try { return localStorage.getItem(KEY) !== today(); } catch { return false; }
}

const letters = text => [...text].map((ch, i) => ch === ' '
    ? '<span class="si-gap"> </span>'
    : `<span class="si-ch" style="--i:${i}">${ch}</span>`).join('');

/** Opens a growing hole centred on the lens; the ring traces its edge. */
function openIris(layer) {
    const lens = layer.querySelector('.bm-lens circle:last-of-type')?.getBoundingClientRect();
    const x = lens ? lens.left + lens.width / 2 : innerWidth / 2;
    const y = lens ? lens.top + lens.height / 2 : innerHeight / 2;
    const max = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 40;
    const ring = layer.querySelector('.si-ring');
    layer.style.setProperty('--ix', `${x}px`);
    layer.style.setProperty('--iy', `${y}px`);
    layer.classList.add('is-opening');
    const start = performance.now();
    return new Promise(resolve => {
        const step = now => {
            const t = Math.min(1, (now - start) / OPEN_MS);
            const eased = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
            const r = eased * max;
            layer.style.setProperty('--r', `${r}px`);
            if (ring) {
                ring.style.width = ring.style.height = `${r * 2}px`;
                ring.style.opacity = String(1 - t);
            }
            if (t < 1) requestAnimationFrame(step); else resolve();
        };
        requestAnimationFrame(step);
    });
}

/** Resolves when the intro has left the screen. */
export function playIntro() {
    try { localStorage.setItem(KEY, today()); } catch { /* ignore */ }
    const layer = document.createElement('div');
    layer.id = 'site-intro';
    layer.setAttribute('role', 'presentation');
    const figures = savedFigures();
    layer.innerHTML = `<div class="si-aura si-aura-a"></div><div class="si-aura si-aura-b"></div>${mapSvg()}<div class="si-grain"></div>
        <div class="si-stage">
            <div class="si-emblem">
                <span class="si-sheet si-sheet-1"></span><span class="si-sheet si-sheet-2"></span><span class="si-sheet si-sheet-3"></span>
                ${brandMarkSvg({ className: 'si-mark', cut: '#f6efe6', shine: true })}
            </div>
            <div class="si-words">
                <p class="si-name" aria-label="${NAME}">${letters(NAME)}</p>
                <span class="si-rule"></span>
                <p class="si-sub">Normativa del sector energético</p>
                ${figures ? `<p class="si-figures"><span><b data-to="${figures.leyes}">0</b> instrumentos</span><span><b data-to="${figures.articulos}">0</b> artículos y disposiciones</span></p>` : ''}
            </div>
        </div>
        <span class="si-ring" style="left:var(--ix);top:var(--iy)"></span>
        <button type="button" class="si-skip">Saltar</button>`;
    document.body.append(layer);
    document.documentElement.classList.add('intro-on');
    return new Promise(resolve => {
        let done = false;
        const finish = async () => {
            if (done) return;
            done = true;
            document.removeEventListener('keydown', onKey);
            document.documentElement.classList.remove('intro-on');
            await openIris(layer);
            layer.remove();
            resolve();
        };
        const timer = setTimeout(finish, HOLD_MS);
        const skip = () => { clearTimeout(timer); finish(); };
        const onKey = event => { if (event.key === 'Escape' || event.key === 'Enter') skip(); };
        layer.querySelector('.si-skip').addEventListener('click', skip);
        document.addEventListener('keydown', onKey);
        requestAnimationFrame(() => layer.classList.add('is-playing'));
        countUp(layer, 2450);
    });
}
