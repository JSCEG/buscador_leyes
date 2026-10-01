/**
 * Animated entrance: the mark builds itself (bar, page, lines, lens), light sweeps across it, the
 * name writes in letter by letter, and the site opens through the lens like an iris.
 * Once a day, skippable, and never for deep links or reduced motion.
 */
import { brandMarkSvg } from '../lib/brand-mark.js';
import '../styles/site-intro.css';

const KEY = 'intro-dia';
const NAME = 'Buscador Jurídico';
const HOLD_MS = 3300;
const OPEN_MS = 900;
const today = () => new Date().toISOString().slice(0, 10);

export function shouldShowIntro() {
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
    if (/^#(art-|lectura-|mesa-|ley-)/.test(location.hash)) return false;
    // Coming back from an auth email (reset, confirmation): go straight to the dialog.
    if (/access_token|error_description|type=recovery/.test(location.hash) || /[?&]code=/.test(location.search)) return false;
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
    layer.innerHTML = `<div class="si-aura si-aura-a"></div><div class="si-aura si-aura-b"></div><div class="si-grain"></div>
        <div class="si-stage">
            ${brandMarkSvg({ className: 'si-mark', shine: true })}
            <div class="si-words">
                <p class="si-name" aria-label="${NAME}">${letters(NAME)}</p>
                <span class="si-rule"></span>
                <p class="si-sub">Normativa del sector energético</p>
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
    });
}
