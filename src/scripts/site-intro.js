/**
 * Animated entrance: the mechanical owl in real time (public/intro/buho.html, built from intro-3d/vivo/ with
 * scripts/build-intro-3d.mjs) over the map of Mexico. It opens its wings and shows the site's sections; picking
 * one, or «Entrar al sitio», opens the site from its eye like an iris and goes there. The visitor can also turn it,
 * open and close the wings, and take it apart.
 * If the 3D page does not answer in time (no WebGL, slow network, saving data), the owl emblem picture plays instead
 * (public/img/intro-buho-*.webp); the recorded film stays behind playIntro({ kind: 'video' }), and the CSS intro is
 * the last fallback. Once a day, skippable, and never for deep links or reduced motion.
 */
import { brandMarkSvg } from '../lib/brand-mark.js';
import { wingsSvg } from '../lib/brand-wings.js';
import { MEXICO_VIEWBOX, MEXICO_STATES } from '../lib/mexico-map.js';
import { markWelcomeSeen, startWelcomeTour } from './onboarding.js';
import '../styles/site-intro.css';

const KEY = 'intro-dia';
const FIGURES_KEY = 'intro-cifras';
const NAME = 'Buscador Jurídico';
const HOLD_MS = 3400;
const OPEN_MS = 800;
const VIDEO_WAIT_MS = 900;
const VIDEO_LIMIT_MS = 11000;
// eye: where the owl's eye sits in the last frame, as a fraction of the film. scripts/render-intro-3d.mjs prints it.
const FILMS = {
    landscape: { src: '/video/intro-landscape.mp4', width: 1920, height: 1080, eye: [0.4268, 0.5396] },
    portrait: { src: '/video/intro-portrait.mp4', width: 720, height: 1280, eye: [0.3613, 0.5238] },
};
// The owl emblem: one picture per theme, square and transparent, with its left eye as a fraction of the picture.
const EMBLEMS = {
    light: { src: '/img/intro-buho-claro.webp', width: 842, height: 842, eye: [0.3808, 0.4618] },
    dark: { src: '/img/intro-buho-oscuro.webp', width: 842, height: 842, eye: [0.3797, 0.4643] },
};
const EMBLEM_HOLD_MS = 3000;
const EMBLEM_WAIT_MS = 1500; // the picture is small; the map already draws while it arrives
// The live owl: about 0.7 MB with three.js. It must say it is drawing within this time, or the emblem plays.
const BUHO_SRC = '/intro/buho.html';
const BUHO_WAIT_MS = 7000; // phones on mobile data: the map keeps drawing while it loads
// Where each section of the owl's menu goes: the rail link that opens it.
const BUHO_NAV = {
    buscar: 'nav-inicio', acervo: 'nav-leyes', cronologia: 'nav-cronologia', permisos: 'nav-permisos',
    polos: 'nav-polos', analisis: 'nav-analisis', aprende: 'nav-como-funciona',
};
const INTRO_KIND = 'buho3d';
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
    // To watch it again: every reload while developing, or ?intro on the published site.
    if (import.meta.env?.DEV || /[?&]intro(=|&|$)/.test(location.search)) return true;
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

/**
 * Opens the live owl on purpose, as a quick tutorial: «Guía rápida» (rail, Aprende menu, phone header and «Más») and
 * Ayuda's tour button play its tour of the sections. Without WebGL, the classic welcome tour plays instead.
 */
export function openOwlGuide({ tour = true } = {}) {
    if (document.getElementById('site-intro')) return null;
    // as a guide, the owl is a way to pick a section: «Entrar al sitio» becomes «Cerrar guía»
    return playIntro({ kind: 'buho3d', tour, guide: true, onUnavailable: startWelcomeTour });
}
document.addEventListener('click', event => {
    if (!event.target.closest?.('[data-abrir-buho]')) return;
    event.preventDefault();
    // from the phone's «Más» sheet: close it, so the site is there when the owl leaves
    if (document.getElementById('mobile-menu-drawer')?.contains(event.target)) document.getElementById('close-mobile-menu')?.click();
    openOwlGuide();
});

const darkTheme = () => ['dark', 'contraste'].includes(document.documentElement.dataset.theme);

/** Loads the emblem for the current theme out of sight. Resolves with it once it can be shown, or with null. */
function startEmblem(layer) {
    const emblem = darkTheme() ? EMBLEMS.dark : EMBLEMS.light;
    const img = new Image();
    img.className = 'si-buho';
    img.alt = '';
    img.decoding = 'async';
    img.setAttribute('aria-hidden', 'true');
    img.src = emblem.src;
    layer.querySelector('.si-map').after(img);
    return new Promise(resolve => {
        let settled = false;
        const settle = ready => {
            if (settled) return;
            settled = true;
            clearTimeout(waiting);
            if (!ready) img.remove();
            resolve(ready ? { video: img, film: emblem } : null);
        };
        const waiting = setTimeout(() => settle(false), EMBLEM_WAIT_MS);
        img.addEventListener('load', () => settle(true), { once: true });
        img.addEventListener('error', () => settle(false), { once: true });
        if (img.complete && img.naturalWidth) settle(true);
    });
}

/**
 * Loads the live owl out of sight. Calls `onMessage` with every message it sends; resolves with the iframe once it
 * draws its first frame, or with null (no answer in time, an error, or the visitor saves data).
 */
function startBuho3d(layer, onMessage, tour = true, guide = false) {
    const connection = navigator.connection;
    if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return Promise.resolve(null);
    const frame = document.createElement('iframe');
    frame.className = 'si-buho3d';
    frame.title = 'Búho mecánico: elige una sección del sitio';
    frame.src = `${BUHO_SRC}?tema=${darkTheme() ? 'oscuro' : 'claro'}${tour ? '' : '&recorrido=no'}${guide ? '&modo=guia' : ''}`;
    frame.setAttribute('allowtransparency', 'true');
    layer.querySelector('.si-map').after(frame);
    return new Promise(resolve => {
        let settled = false;
        const settle = ready => {
            if (settled) return;
            settled = true;
            clearTimeout(waiting);
            if (!ready) { window.removeEventListener('message', listen); frame.remove(); }
            resolve(ready ? frame : null);
        };
        const listen = event => {
            if (event.source !== frame.contentWindow || event.origin !== location.origin) return;
            const { type } = event.data || {};
            if (type === 'buho-listo') settle(true);
            else if (type === 'buho-error') settle(false);
            else if (settled) onMessage(event.data);
        };
        const waiting = setTimeout(() => settle(false), BUHO_WAIT_MS);
        window.addEventListener('message', listen);
        frame.addEventListener('error', () => settle(false), { once: true });
        layer.addEventListener('si-done', () => window.removeEventListener('message', listen), { once: true });
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

/**
 * Resolves when the intro has left the screen. `tour: false` opens the live owl straight on its menu, without the
 * automatic tour of its parts (the «Guía del búho» button: the visitor already saw it).
 */
export function playIntro({ kind = INTRO_KIND, tour = true, guide = false, onUnavailable = null } = {}) {
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
                ${brandMarkSvg({ className: 'si-mark', color: '#f1efea', lens: '#e57a9a', shine: true })}
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
        let eye = null; // where the live owl's eye is, in px, when the visitor leaves it
        const finish = async () => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            document.removeEventListener('keydown', onKey);
            document.documentElement.classList.remove('intro-on');
            layer.dispatchEvent(new Event('si-done'));
            await openIris(layer, eye || (playing ? eyeCenter(playing.video.getBoundingClientRect(), playing.film) : null));
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
        const playEmblem = () => startEmblem(layer).then(started => {
            if (done) return;
            if (!started) { playCss(); return; }
            playing = started;
            // keyframes, not transitions: the class can go on at once, without waiting for a frame
            layer.classList.add('is-buho', 'is-buho-on', darkTheme() ? 'is-oscuro' : 'is-claro');
            timer = setTimeout(finish, EMBLEM_HOLD_MS);
        });
        if (kind === 'buho3d') {
            // the map draws while the owl loads; the owl stays until the visitor picks a section or enters
            layer.classList.add('is-buho', 'is-buho-on', 'is-buho3d', darkTheme() ? 'is-oscuro' : 'is-claro');
            const onMessage = ({ type, seccion, ojo } = {}) => {
                if (type !== 'buho-ir' && type !== 'buho-entrar') return;
                if (Array.isArray(ojo)) eye = { x: ojo[0], y: ojo[1] };
                finish().then(() => { if (type === 'buho-ir') document.getElementById(BUHO_NAV[seccion])?.click(); });
            };
            startBuho3d(layer, onMessage, tour, guide).then(frame => {
                if (done) return;
                if (!frame) {
                    // opened on purpose (Ayuda, «Guía del búho»): without the 3D owl, the classic tour instead of a picture
                    if (onUnavailable) { finish().then(onUnavailable); return; }
                    layer.classList.remove('is-buho', 'is-buho-on', 'is-buho3d');
                    playEmblem();
                    return;
                }
                layer.classList.add('is-buho3d-on');
                if (tour) markWelcomeSeen(); // the owl tours the sections: the classic welcome tour is not needed
                frame.focus();
            });
            return;
        }
        if (kind === 'emblem') {
            startEmblem(layer).then(started => {
                if (done) return;
                if (!started) { playCss(); return; }
                playing = started;
                // keyframes, not transitions: the class can go on at once, without waiting for a frame
                layer.classList.add('is-buho', 'is-buho-on', darkTheme() ? 'is-oscuro' : 'is-claro');
                timer = setTimeout(finish, EMBLEM_HOLD_MS);
            });
            return;
        }
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
