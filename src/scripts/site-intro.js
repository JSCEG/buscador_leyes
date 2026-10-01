/**
 * Animated entrance: the mark builds itself (bar, page, lines, lens), the name appears and the
 * curtain lifts into the site. Once a day, skippable, and never for deep links or reduced motion.
 */
import { brandMarkSvg } from '../lib/brand-mark.js';
import '../styles/site-intro.css';

const KEY = 'intro-dia';
const today = () => new Date().toISOString().slice(0, 10);

export function shouldShowIntro() {
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
    if (/^#(art-|lectura-|mesa-|ley-)/.test(location.hash)) return false;
    try { return localStorage.getItem(KEY) !== today(); } catch { return false; }
}

/** Resolves when the intro has left the screen. */
export function playIntro() {
    try { localStorage.setItem(KEY, today()); } catch { /* ignore */ }
    const layer = document.createElement('div');
    layer.id = 'site-intro';
    layer.setAttribute('role', 'presentation');
    layer.innerHTML = `<div class="si-stage">
            ${brandMarkSvg({ className: 'si-mark' })}
            <div class="si-words"><p class="si-name">Buscador Jurídico</p><p class="si-sub">Secretaría de Energía · Gobierno de México</p></div>
        </div>
        <button type="button" class="si-skip">Saltar</button>`;
    document.body.append(layer);
    document.documentElement.classList.add('intro-on');
    return new Promise(resolve => {
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            layer.classList.add('is-leaving');
            document.documentElement.classList.remove('intro-on');
            setTimeout(() => { layer.remove(); resolve(); }, 650);
        };
        const timer = setTimeout(finish, 2700);
        layer.querySelector('.si-skip').addEventListener('click', () => { clearTimeout(timer); finish(); });
        document.addEventListener('keydown', function onKey(event) {
            if (event.key !== 'Escape' && event.key !== 'Enter') return;
            document.removeEventListener('keydown', onKey);
            clearTimeout(timer); finish();
        });
        requestAnimationFrame(() => layer.classList.add('is-playing'));
    });
}
