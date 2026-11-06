/**
 * Home screen: search on top, every document on a curved 3D shelf, and a ruler by collection.
 * Only the tomes the arc can show exist in the DOM. One frame loop drives them and it stops at rest.
 */
import { groupAcervo, selectAcervo } from '../lib/acervo-model.js';
import { GROUP_LABELS, coverData, coverHTML, spineHTML } from '../lib/law-cover.js';
import { rel, rulerPosition, rulerSegments, shelfMetrics, stepSpring, tomeTransform } from '../lib/shelf-geometry.js';
import '../styles/shelf.css';

const FALLBACK_H = 400;
const SPRING = 5.2;
const REST = 0.001;
const CAPTION_MS = 650;
const CAPTION_EASE = 'cubic-bezier(.2,.8,.2,1)';
const SEARCH_ICON = '<svg class="bj-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg>';
const ARROW = direction => `<svg width="24" height="12" viewBox="0 0 24 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${direction < 0 ? 'M6 1 1 6l5 5M1 6h22' : 'm18 1 5 5-5 5m5-5H1'}"/></svg>`;

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const mod = (value, n) => ((value % n) + n) % n;

/** Shelf order: collections in their usual order, each one by title. Empty collections are left out. */
export function buildShelf(summaries) {
    const groups = groupAcervo(selectAcervo(summaries, { sort: 'title' })).filter(group => group.items.length);
    const widths = rulerSegments(groups.map(group => group.items.length));
    return {
        items: groups.flatMap(group => group.items),
        segments: widths.map((segment, index) => ({ ...segment, group: groups[index].id })),
    };
}

const metaLine = data => [data.siglas, data.groupLabel, data.year].filter(Boolean).join(' · ');

function statusHTML(state) {
    if (state === 'loading') return '<div class="sh-status" data-state="loading" role="status"><span class="bj-dots" aria-hidden="true"><i></i><i></i><i></i></span><p>Cargando documentos…</p></div>';
    return '<div class="sh-status" data-state="error" role="alert"><p>No pudimos mostrar el estante en este momento.</p><button type="button" class="bj-btn bj-btn--secondary" data-sh-browse>Ver todos los documentos</button></div>';
}

/**
 * @param {HTMLElement} host
 * @param {{ summaries?: object[], status?: 'loading'|'ready', onSearch?: Function, onOpenLaw?: Function, onShare?: Function, onSheetChange?: Function, onBrowse?: Function, onLegal?: Function, onFeedback?: Function }} options
 */
export function renderShelfView(host, { summaries = [], status = 'loading', onSearch = () => {}, onBrowse = () => {}, onLegal = () => {}, onFeedback = () => {} } = {}) {
    host.innerHTML = `<div class="sh-view">
        <div class="sh-top">
            <h1>Leyes y reglas de energía de México, en un solo lugar</h1>
            <div class="sh-search">${SEARCH_ICON}<input type="search" aria-label="Buscar en los documentos" placeholder="Busca una ley, un artículo o un tema" autocomplete="off"></div>
        </div>
        <section class="sh-shelf" aria-roledescription="carrusel" aria-label="Estante de documentos" tabindex="0">
            <div class="sh-probe" aria-hidden="true"></div>
            <div class="sh-floor" aria-hidden="true"></div>
            <div class="sh-stage" aria-hidden="true"></div>
        </section>
        <div class="sh-caption" hidden>
            <button type="button" class="sh-arrow" data-sh-prev aria-label="Documento anterior">${ARROW(-1)}</button>
            <div class="sh-caption-text">
                <div class="sh-caption-title"></div>
                <div class="sh-caption-meta"></div>
                <button type="button" class="sh-open" data-sh-open>Abrir ficha</button>
            </div>
            <button type="button" class="sh-arrow" data-sh-next aria-label="Documento siguiente">${ARROW(1)}</button>
            <p class="sh-sr" aria-live="polite"></p>
        </div>
        <div class="sh-ruler" hidden>
            <div class="sh-ruler-line" aria-hidden="true"></div>
            <div class="sh-ruler-dot" aria-hidden="true"></div>
            <p class="sh-ruler-active" aria-hidden="true"></p>
        </div>
        <footer class="sh-foot">
            <button type="button" class="sh-foot-browse" data-sh-browse>Ver todos los documentos</button>
            <p>Herramienta de consulta y apoyo. El texto con validez jurídica es el publicado en el Diario Oficial de la Federación o en la fuente oficial de cada documento.</p>
            <nav aria-label="Información del sitio">
                <a href="#" data-legal="terminos">Términos de uso</a>
                <a href="#" data-legal="privacidad">Privacidad</a>
                <button type="button" data-feedback>Enviar comentario</button>
            </nav>
        </footer>
    </div>`;

    const view = host.querySelector('.sh-view');
    const shelf = view.querySelector('.sh-shelf');
    const stage = view.querySelector('.sh-stage');
    const probe = view.querySelector('.sh-probe');
    const caption = view.querySelector('.sh-caption');
    const titleBox = view.querySelector('.sh-caption-title');
    const metaBox = view.querySelector('.sh-caption-meta');
    const live = view.querySelector('.sh-sr');
    const ruler = view.querySelector('.sh-ruler');
    const dotEl = view.querySelector('.sh-ruler-dot');
    const rulerLabel = view.querySelector('.sh-ruler-active');
    const field = view.querySelector('.sh-search input');

    const reduced = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    const mobile = () => Boolean(window.matchMedia?.('(max-width: 767px)').matches);

    let destroyed = false;
    let items = [];
    let segments = [];
    let metrics = null;
    let s = 0;
    let T = 0;
    let dot = 0;
    let active = -1;
    let handle = null;
    let last = 0;
    const tomes = new Map();

    function measure() {
        const header = document.querySelector('.site-header');
        if (header?.offsetHeight) view.style.setProperty('--sh-header', `${header.offsetHeight}px`);
        metrics = shelfMetrics(probe.getBoundingClientRect().height || FALLBACK_H, { mobile: mobile() });
    }

    function makeTome(law) {
        const tome = document.createElement('div');
        tome.className = 'sh-tome';
        tome.dataset.lawId = law.id;
        tome.innerHTML = `<div class="sh-face sh-face--spine">${spineHTML(law)}</div><div class="sh-face sh-face--cover">${coverHTML(law)}</div>`;
        stage.appendChild(tome);
        return tome;
    }

    function drawTomes() {
        const n = items.length;
        items.forEach((law, index) => {
            const place = tomeTransform(rel(index, s, n), metrics);
            let tome = tomes.get(law.id);
            if (!place.visible) {
                if (tome) { tome.remove(); tomes.delete(law.id); }
                return;
            }
            if (!tome) { tome = makeTome(law); tomes.set(law.id, tome); }
            tome.style.transform = `translate3d(${place.x}px,${place.y}px,${place.z}px) rotateX(${place.rotateX}deg) rotateY(${place.rotateY}deg)`;
            tome.style.zIndex = place.zIndex;
            tome.style.setProperty('--spine-shade', place.spineShade.toFixed(3));
            tome.style.setProperty('--cover-shade', place.coverShade.toFixed(3));
        });
    }

    function setCaptionLine(box, text, direction, title = '') {
        box.title = title;
        const previous = [...box.children];
        const line = document.createElement('span');
        line.textContent = text;
        box.appendChild(line);
        if (!previous.length || !direction || reduced() || !line.animate) {
            previous.forEach(node => node.remove());
            return;
        }
        const timing = { duration: CAPTION_MS, easing: CAPTION_EASE, fill: 'both' };
        line.animate([{ transform: `translateY(${direction * 105}%)` }, { transform: 'none' }], timing);
        previous.forEach(node => {
            node.classList.add('is-leaving');
            const out = node.animate([{ transform: 'none' }, { transform: `translateY(${-direction * 105}%)` }], timing);
            out.onfinish = () => node.remove();
            out.oncancel = () => node.remove();
        });
    }

    function showActive(index, direction) {
        active = index;
        const law = items[index];
        const data = coverData(law);
        setCaptionLine(titleBox, data.name, direction, data.title || data.name);
        setCaptionLine(metaBox, metaLine(data), direction);
        live.textContent = `${data.name}. ${metaLine(data)}`;
        view.querySelector('[data-sh-open]').setAttribute('aria-label', `Abrir ficha de ${data.name}`);
        const segment = segments.find(item => index >= item.firstIndex && index < item.firstIndex + item.count);
        rulerLabel.textContent = segment ? GROUP_LABELS[segment.group] : '';
        view.querySelectorAll('[data-sh-segment]').forEach(button => {
            if (button.dataset.shSegment === segment?.group) button.setAttribute('aria-current', 'true');
            else button.removeAttribute('aria-current');
        });
    }

    function frame(now) {
        handle = null;
        if (destroyed || !items.length) return;
        const dt = last ? (now - last) / 1000 : 0;
        last = now;
        const instant = reduced();
        s = instant ? T : stepSpring(s, T, dt, SPRING);
        if (Math.abs(T - s) < REST) s = T;
        const n = items.length;
        const index = mod(Math.round(s), n);
        if (index !== active) showActive(index, Math.sign(T - s) || 1);
        const target = rulerPosition(index, segments);
        dot = instant || Math.abs(target - dot) > 0.5 ? target : dot + (target - dot) * (1 - Math.exp(-14 * Math.min(dt, 0.05)));
        if (Math.abs(target - dot) < 0.0005) dot = target;
        dotEl.style.left = `${dot * 100}%`;
        drawTomes();
        if (s !== T || dot !== target) wake();
        else last = 0;
    }

    function wake() {
        if (!destroyed && handle === null) handle = requestAnimationFrame(frame);
    }

    function setStatus(state) {
        view.querySelector('.sh-status')?.remove();
        if (state) shelf.insertAdjacentHTML('beforeend', statusHTML(state));
        caption.hidden = Boolean(state);
        ruler.hidden = Boolean(state);
    }

    function setCatalog(next) {
        ({ items, segments } = buildShelf(next));
        tomes.forEach(tome => tome.remove());
        tomes.clear();
        ruler.querySelectorAll('[data-sh-segment]').forEach(button => button.remove());
        ruler.insertAdjacentHTML('beforeend', segments.map(segment => `<button type="button" class="sh-segment" data-sh-segment="${segment.group}" style="left:${segment.start * 100}%;width:${(segment.end - segment.start) * 100}%" aria-label="Ir a ${esc(GROUP_LABELS[segment.group])}"><span>${esc(GROUP_LABELS[segment.group])}</span></button>`).join(''));
        if (!items.length) { setStatus('error'); return; }
        setStatus(null);
        const single = items.length < 2;
        view.querySelector('[data-sh-prev]').hidden = single;
        view.querySelector('[data-sh-next]').hidden = single;
        s = 0; T = 0; active = -1; last = 0;
        dot = rulerPosition(0, segments);
        measure();
        wake();
    }

    function setFailed() { setStatus('error'); }

    view.addEventListener('click', event => {
        if (event.target.closest('[data-sh-browse]')) { onBrowse(); return; }
        const legal = event.target.closest('[data-legal]');
        if (legal) { event.preventDefault(); onLegal(legal.dataset.legal); return; }
        if (event.target.closest('[data-feedback]')) onFeedback();
    });
    field.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        const query = field.value.trim();
        if (query) onSearch(query);
    });

    measure();
    if (status === 'ready') setCatalog(summaries);
    else setStatus('loading');
    // The shelf unfolds once the intro has finished.
    Promise.resolve(window.__introDone).then(() => { if (!destroyed) view.classList.add('is-entered'); });

    function destroy() {
        destroyed = true;
        if (handle !== null) cancelAnimationFrame(handle);
        handle = null;
        tomes.clear();
        host.innerHTML = '';
    }

    return { destroy, setCatalog, setFailed };
}
