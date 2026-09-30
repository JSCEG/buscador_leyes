/**
 * First-visit welcome tour: a few short steps that point at real parts of the page.
 * Shown once per browser; Ayuda can start it again.
 */
import '../styles/onboarding.css';

const KEY = 'bienvenida-v1';
const STEPS = [
    { title: 'Bienvenida al Buscador Jurídico', text: 'Leyes, reglamentos, acuerdos y demás disposiciones del sector energético en un solo lugar. Te mostramos lo esencial en cuatro pasos.' },
    { target: '#nav-leyes, #bottom-nav [data-nav="nav-leyes"]', title: 'Acervo', text: 'Todos los instrumentos organizados por colección. Abre cualquiera para leerlo completo, ver su línea del tiempo o su estructura.' },
    { target: '#nav-inicio, #bottom-nav [data-nav="nav-inicio"]', title: 'Buscar', text: 'Busca una palabra en el texto de todo el acervo. Verás los resultados en lista o en un mapa de relaciones entre instrumentos.' },
    { target: '#nav-analisis, #bottom-nav [data-nav="nav-analisis"]', title: 'Análisis', text: 'El mapa de términos: los conceptos clave que definen las leyes, dónde se usan y cómo se conectan.' },
    { target: '#desk-toggle', title: 'Tu mesa de consulta', text: 'Fija artículos con el botón «Fijar» y tenlos a la mano mientras sigues navegando; puedes verlos lado a lado y organizarlos por tema.' },
];

const visible = el => el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden';
const findTarget = selector => selector ? selector.split(',').map(s => document.querySelector(s.trim())).find(visible) || null : null;

export function hasSeenWelcome() {
    try { return localStorage.getItem(KEY) === '1'; } catch { return true; }
}

export function startWelcomeTour() {
    document.getElementById('welcome-tour')?.remove();
    let index = 0;
    const returnFocus = document.activeElement;
    const layer = document.createElement('div');
    layer.id = 'welcome-tour';
    layer.innerHTML = `<div class="wt-spot" aria-hidden="true"></div>
        <div class="wt-card" role="dialog" aria-modal="true" aria-labelledby="wt-title" aria-describedby="wt-text">
            <p class="wt-step"></p><h2 id="wt-title"></h2><p id="wt-text"></p>
            <div class="wt-actions"><button type="button" class="wt-skip" data-wt-skip>Saltar</button>
                <span class="wt-dots" aria-hidden="true">${STEPS.map(() => '<i></i>').join('')}</span>
                <button type="button" class="wt-back" data-wt-back>Atrás</button><button type="button" class="wt-next" data-wt-next>Siguiente</button></div>
        </div>`;
    document.body.append(layer);
    const card = layer.querySelector('.wt-card');
    const spot = layer.querySelector('.wt-spot');

    const finish = () => {
        try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
        layer.remove();
        document.removeEventListener('keydown', onKey, true);
        window.removeEventListener('resize', place);
        if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    };

    function place() {
        const step = STEPS[index];
        const target = findTarget(step.target);
        layer.classList.toggle('is-centered', !target);
        if (!target) { spot.style.cssText = ''; card.style.cssText = ''; return; }
        const r = target.getBoundingClientRect();
        const pad = 6;
        spot.style.cssText = `left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px`;
        const cw = Math.min(360, window.innerWidth - 24);
        const below = r.bottom + 14 + 220 < window.innerHeight;
        const left = Math.max(12, Math.min(window.innerWidth - cw - 12, r.left + r.width / 2 - cw / 2));
        card.style.cssText = `width:${cw}px;left:${left}px;${below ? `top:${r.bottom + 14}px` : `bottom:${window.innerHeight - r.top + 14}px`}`;
    }

    function show() {
        const step = STEPS[index];
        layer.querySelector('.wt-step').textContent = index ? `Paso ${index} de ${STEPS.length - 1}` : 'Bienvenida';
        layer.querySelector('#wt-title').textContent = step.title;
        layer.querySelector('#wt-text').textContent = step.text;
        layer.querySelector('[data-wt-back]').hidden = index === 0;
        layer.querySelector('[data-wt-next]').textContent = index === STEPS.length - 1 ? 'Empezar' : index === 0 ? 'Ver recorrido' : 'Siguiente';
        layer.querySelectorAll('.wt-dots i').forEach((dot, i) => dot.classList.toggle('is-on', i === index));
        place();
        layer.querySelector('[data-wt-next]').focus();
    }

    function onKey(event) {
        if (event.key === 'Escape') { event.stopPropagation(); finish(); }
        else if (event.key === 'ArrowRight') { event.preventDefault(); layer.querySelector('[data-wt-next]').click(); }
        else if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); index--; show(); }
        else if (event.key === 'Tab') {
            const items = [...card.querySelectorAll('button:not([hidden])')];
            const at = items.indexOf(document.activeElement);
            if (event.shiftKey && at <= 0) { event.preventDefault(); items.at(-1).focus(); }
            else if (!event.shiftKey && at === items.length - 1) { event.preventDefault(); items[0].focus(); }
        }
    }

    layer.addEventListener('click', event => {
        const b = event.target.closest('button');
        if (!b) return;
        if (b.hasAttribute('data-wt-skip')) finish();
        else if (b.hasAttribute('data-wt-back')) { index = Math.max(0, index - 1); show(); }
        else if (b.hasAttribute('data-wt-next')) { if (index === STEPS.length - 1) finish(); else { index++; show(); } }
    });
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', place);
    show();
}
