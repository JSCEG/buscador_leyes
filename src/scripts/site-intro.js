/**
 * Animated entrance. A short film (made in video-intro/) plays when it is ready in time: the eye opens,
 * the mark is written, the wings unfold and the site opens from that eye like an iris. If the film is
 * late, refused or the visitor saves data, the same story plays in CSS, without any wait.
 * Once a day, skippable, and never for deep links or reduced motion.
 */
import { brandMarkSvg } from '../lib/brand-mark.js';
import { wingsSvg } from '../lib/brand-wings.js';
import { MEXICO_VIEWBOX, MEXICO_STATES } from '../lib/mexico-map.js';
import '../styles/site-intro.css';

const KEY = 'intro-dia';
const FIGURES_KEY = 'intro-cifras';
const NAME = 'Buscador Jurídico';
const HOLD_MS = 3400;
const OPEN_MS = 800;
const VIDEO_WAIT_MS = 900;
const VIDEO_LIMIT_MS = 6000;
// eye: where the owl's eye sits in the last frame, as a fraction of the film. See video-intro/build.mjs.
const FILMS = {
    landscape: { src: '/video/intro-landscape.mp4', width: 1920, height: 1080, eye: [0.5079, 0.3194] },
    portrait: { src: '/video/intro-portrait.mp4', width: 720, height: 1280, eye: [0.5122, 0.3604] },
};
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

/** Where a film's eye lands on screen when it is fitted inside `box` without cropping. */
export function eyeCenter(box, { width, height, eye }) {
    const scale = Math.min(box.width / width, box.height / height);
    const shownWidth = width * scale;
    const shownHeight = height * scale;
    return {
        x: box.left + (box.width - shownWidth) / 2 + shownWidth * eye[0],
        y: box.top + (box.height - shownHeight) / 2 + shownHeight * eye[1],
    };
}

function canPlayFilm() {
    const connection = navigator.connection;
    if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return false;
    return Boolean(document.createElement('video').canPlayType?.('video/mp4'));
}

/** Starts the film out of sight. Resolves with it once it really plays, or with null to use the CSS intro. */
function startFilm(layer) {
    const film = innerHeight > innerWidth ? FILMS.portrait : FILMS.landscape;
    const video = document.createElement('video');
    video.className = 'si-video';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('aria-hidden', 'true');
    video.src = film.src;
    layer.prepend(video);
    return new Promise(resolve => {
        let settled = false;
        let waiting = null;
        const settle = playing => {
            if (settled) return;
            settled = true;
            clearTimeout(waiting);
            if (!playing) video.remove();
            resolve(playing ? { video, film } : null);
        };
        waiting = setTimeout(() => settle(false), VIDEO_WAIT_MS);
        video.addEventListener('playing', () => settle(true), { once: true });
        video.addEventListener('error', () => settle(false), { once: true });
        Promise.resolve(video.play()).catch(() => settle(false));
    });
}

/** Opens a growing hole centred on the eye; the ring traces its edge. */
function openIris(layer, point = null) {
    const lens = point ? null : layer.querySelector('.bm-lens circle:last-of-type')?.getBoundingClientRect();
    const x = point ? point.x : lens ? lens.left + lens.width / 2 : innerWidth / 2;
    const y = point ? point.y : lens ? lens.top + lens.height / 2 : innerHeight / 2;
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
                ${wingsSvg({ className: 'si-wings' })}
                <span class="si-sheet si-sheet-1"></span><span class="si-sheet si-sheet-2"></span><span class="si-sheet si-sheet-3"></span>
                ${brandMarkSvg({ className: 'si-mark', shine: true })}
            </div>
            <div class="si-words">
                <p class="si-name" aria-label="${NAME}">${letters(NAME)}</p>
                <span class="si-rule"></span>
                <p class="si-sub">Normativa del sector energético</p>
                ${figures ? `<p class="si-figures"><span><b data-to="${figures.leyes}">0</b> documentos</span><span><b data-to="${figures.articulos}">0</b> artículos y disposiciones</span></p>` : ''}
            </div>
        </div>
        <span class="si-ring" style="left:var(--ix);top:var(--iy)"></span>
        <button type="button" class="si-skip">Saltar</button>`;
    document.body.append(layer);
    document.documentElement.classList.add('intro-on');
    return new Promise(resolve => {
        let done = false;
        let timer = null;
        let playing = null;
        const finish = async () => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            document.removeEventListener('keydown', onKey);
            document.documentElement.classList.remove('intro-on');
            await openIris(layer, playing ? eyeCenter(playing.video.getBoundingClientRect(), playing.film) : null);
            layer.remove();
            resolve();
        };
        const onKey = event => { if (event.key === 'Escape' || event.key === 'Enter') finish(); };
        layer.querySelector('.si-skip').addEventListener('click', finish);
        document.addEventListener('keydown', onKey);
        const playCss = () => {
            requestAnimationFrame(() => layer.classList.add('is-playing'));
            countUp(layer, 2450);
            timer = setTimeout(finish, HOLD_MS);
        };
        if (!canPlayFilm()) { playCss(); return; }
        startFilm(layer).then(started => {
            if (done) return;
            if (!started) { playCss(); return; }
            playing = started;
            layer.classList.add('is-video');
            started.video.addEventListener('ended', finish, { once: true });
            started.video.addEventListener('error', finish, { once: true });
            // A film that stalls halfway must not trap the visitor.
            timer = setTimeout(finish, VIDEO_LIMIT_MS);
        });
    });
}
