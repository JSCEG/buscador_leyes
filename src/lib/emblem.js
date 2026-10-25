/**
 * Section emblems: layered paper, an extruded glyph and one golden object, in light CSS 3D.
 * A single pointer listener tilts the emblem of whatever header the pointer is over, so views
 * can re-render their headers freely.
 */
import '../styles/emblem.css';

const KINDS = {
    cronologia: { glyph: 'calendario', accent: 'alfiler' },
    permisos: { glyph: 'pin', accent: 'sello' },
    'como-funciona': { glyph: 'rayo', accent: 'engrane' },
    reto: { glyph: 'pregunta', accent: 'medalla' },
    analisis: { glyph: 'red', accent: 'orbita' },
    estadisticas: { glyph: 'barras', accent: 'dona' },
    ayuda: { glyph: 'dialogo', accent: 'brujula' },
    guardados: { glyph: 'marcador', accent: 'clip' },
};

/** Markup for a section emblem, pinned to the right edge of its `data-emblem-host` header. */
export function emblemHtml(kind) {
    const { glyph, accent } = KINDS[kind];
    const layers = [5, 4, 3, 2, 1, 0]
        .map(n => `<span class="em-layer" style="--layer:${n};background-image:url(/img/emblem-${glyph}.svg)"></span>`)
        .join('');
    return `
        <div class="em em-${kind}" aria-hidden="true">
            <div class="em-float">
                <div class="em-object" data-emblem-object>
                    <div class="em-shadow"></div>
                    <div class="em-paper em-paper-back"><span></span></div>
                    <div class="em-paper em-paper-middle"><span></span></div>
                    <div class="em-paper em-paper-front"><span></span></div>
                    <div class="em-glyph">${layers}</div>
                    <div class="em-accent em-accent-${accent}"></div>
                </div>
            </div>
        </div>`;
}

function reset(host) {
    const object = host?.querySelector('[data-emblem-object]');
    object?.style.removeProperty('--em-rx');
    object?.style.removeProperty('--em-ry');
}

export function initEmblems() {
    const interactive = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    if (!interactive.matches) return;

    let active = null;
    let frame = 0;
    let x = 0;
    let y = 0;
    document.addEventListener('pointermove', event => {
        const host = event.target instanceof Element ? event.target.closest('[data-emblem-host]') : null;
        if (host !== active) {
            reset(active);
            active = host;
        }
        if (!host) return;
        x = event.clientX;
        y = event.clientY;
        if (frame) return;
        frame = requestAnimationFrame(() => {
            frame = 0;
            const object = active?.querySelector('[data-emblem-object]');
            if (!object) return;
            const rect = active.getBoundingClientRect();
            const dx = (x - rect.left) / rect.width - 0.5;
            const dy = (y - rect.top) / rect.height - 0.5;
            object.style.setProperty('--em-ry', `${-16 + dx * 12}deg`);
            object.style.setProperty('--em-rx', `${-8 - dy * 10}deg`);
        });
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => {
        cancelAnimationFrame(frame);
        frame = 0;
        reset(active);
        active = null;
    });
}
