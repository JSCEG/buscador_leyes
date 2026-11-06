/**
 * The document sheet: paper that grows out of the shelf's open cover and returns to it on close.
 * It shows only real data; a field the document lacks is left out.
 */
import { coverData, coverHTML } from '../lib/law-cover.js';
import { countFragments } from '../lib/judgment.js';
import '../styles/shelf.css';

const TOPICS_SHOWN = 8;
const LONG_NAME = 70;
const OPEN_MS = 1050;
const CLOSE_MS = 850;
const LINE_MS = 900;
const SHEET_EASE = 'cubic-bezier(.76,0,.18,1)';
const LINE_EASE = 'cubic-bezier(.2,.8,.2,1)';
const FOCUSABLE = 'button:not([disabled]), a[href]';
const icon = paths => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
const ICONS = {
    read: icon('<path d="M12 6.5C10 5 7.5 4.5 4 4.5v14c3.5 0 6 .5 8 2 2-1.5 4.5-2 8-2v-14c-3.5 0-6 .5-8 2Z"/><path d="M12 6.5v14"/>'),
    share: icon('<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.3 10.7 7.4-4.3M8.3 13.3l7.4 4.3"/>'),
    source: icon('<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'),
};

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

function longDate(value) {
    const date = new Date(`${String(value ?? '').slice(0, 10)}T12:00:00`);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

const topicsOf = law => (Array.isArray(law.temas_clave) ? law.temas_clave.filter(topic => typeof topic === 'string' && topic.trim()) : []);
const topicItems = topics => topics.map(topic => `<li>${esc(topic)}</li>`).join('');

function clipFrom(rect) {
    if (!rect) return 'inset(0 round 0)';
    const { innerWidth: width, innerHeight: height } = window;
    return `inset(${rect.top}px ${width - rect.right}px ${height - rect.bottom}px ${rect.left}px round 3px)`;
}

function sheetHTML(law) {
    const data = coverData(law);
    const published = longDate(law.fecha_publicacion);
    const reformed = longDate(law.fecha_ultima_reforma);
    const count = Number.isFinite(law.articulos) && law.articulos > 0 ? countFragments(law.articulos, law) : '';
    const topics = topicsOf(law);
    const source = /^https?:\/\//i.test(String(law.url_original ?? '')) ? law.url_original : '';
    const showTitle = data.title && data.title !== data.name;
    return `<div class="sh-sheet-bar">
        <nav class="sh-sheet-crumbs" aria-label="Ruta">
            <button type="button" data-sheet-home>Inicio</button><span aria-hidden="true">›</span><span>${esc(data.groupLabel)}</span><span aria-hidden="true">›</span><span class="sh-sheet-crumb-now" aria-current="page">${esc(data.name)}</span>
        </nav>
        <button type="button" class="bj-btn bj-btn--secondary bj-btn--sm sh-sheet-close" data-sheet-close>Cerrar</button>
    </div>
    <div class="sh-sheet-body">
        <div class="sh-sheet-book">${coverHTML(law)}</div>
        <div class="sh-sheet-main">
            <p class="sh-sheet-eyebrow" data-sheet-line>${esc(data.typeLabel)}</p>
            <h2 id="sh-sheet-title" data-sheet-line${data.name.length > LONG_NAME ? ' data-long' : ''}>${esc(data.name)}</h2>
            ${data.siglas ? `<p class="sh-sheet-siglas" data-sheet-line>${esc(data.siglas)}</p>` : ''}
            <span class="sh-sheet-accent" data-sheet-line></span>
            ${showTitle ? `<p class="sh-sheet-official" data-sheet-line>${esc(data.title)}</p>` : ''}
            <div class="sh-sheet-actions" data-sheet-line>
                <button type="button" class="bj-btn sh-sheet-read" data-sheet-read>${ICONS.read}Leer</button>
                <button type="button" class="bj-btn bj-btn--secondary" data-sheet-share>${ICONS.share}Compartir</button>
                ${source ? `<a class="bj-btn bj-btn--secondary" data-sheet-source href="${esc(source)}" target="_blank" rel="noopener noreferrer">${ICONS.source}Ver fuente original</a>` : ''}
            </div>
            <div class="sh-sheet-details" data-sheet-line>
                <dl>
                    <div><dt>Colección</dt><dd>${esc(data.groupLabel)}</dd></div>
                    ${published ? `<div data-sheet-published><dt>Publicación</dt><dd>${esc(published)}</dd></div>` : ''}
                    ${reformed ? `<div data-sheet-reform><dt>Última reforma</dt><dd>${esc(reformed)}</dd></div>` : ''}
                    ${count ? `<div data-sheet-count><dt>Contenido</dt><dd>${esc(count)}</dd></div>` : ''}
                </dl>
                ${topics.length ? `<div class="sh-sheet-topics">
                    <h3>Temas</h3>
                    <ul data-sheet-topics>${topicItems(topics.slice(0, TOPICS_SHOWN))}</ul>
                    ${topics.length > TOPICS_SHOWN ? `<button type="button" class="sh-sheet-more" data-sheet-more>Ver todos (${topics.length})</button>` : ''}
                </div>` : ''}
            </div>
        </div>
    </div>`;
}

/**
 * @param {object} law
 * @param {{ host: HTMLElement, getOriginRect: () => DOMRect|null, reducedMotion?: boolean, onRead?: Function, onShare?: Function, onRequestClose?: Function }} options
 * @returns {{ element: HTMLElement, close: () => Promise<void> }}
 */
export function openLawSheet(law, { host, getOriginRect = () => null, reducedMotion = false, onRead = () => {}, onShare = () => {}, onRequestClose = () => {} }) {
    const returnFocus = document.activeElement;
    const element = document.createElement('div');
    element.className = 'sh-sheet';
    element.setAttribute('role', 'dialog');
    element.setAttribute('aria-modal', 'true');
    element.setAttribute('aria-labelledby', 'sh-sheet-title');
    element.innerHTML = sheetHTML(law);
    host.appendChild(element);

    element.addEventListener('click', event => {
        if (event.target.closest('[data-sheet-close], [data-sheet-home]')) onRequestClose();
        else if (event.target.closest('[data-sheet-read]')) onRead(law);
        else if (event.target.closest('[data-sheet-share]')) onShare(law);
        else if (event.target.closest('[data-sheet-more]')) {
            element.querySelector('[data-sheet-topics]').innerHTML = topicItems(topicsOf(law));
            event.target.remove();
        }
    });
    element.addEventListener('keydown', event => {
        if (event.key === 'Escape') { event.stopPropagation(); onRequestClose(); return; }
        if (event.key !== 'Tab') return;
        const items = [...element.querySelectorAll(FOCUSABLE)];
        const first = items[0];
        const last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });

    const ms = value => (reducedMotion ? 1 : value);
    element.animate?.([{ clipPath: clipFrom(getOriginRect()) }, { clipPath: 'inset(0 round 0)' }], { duration: ms(OPEN_MS), easing: SHEET_EASE, fill: 'both' });
    element.querySelectorAll('[data-sheet-line]').forEach((line, index) => {
        line.animate?.([{ transform: 'translateY(32px)', clipPath: 'inset(0 0 100% 0)' }, { transform: 'none', clipPath: 'inset(-8px)' }], {
            duration: ms(LINE_MS), delay: reducedMotion ? 0 : 620 + index * 75, easing: LINE_EASE, fill: 'both',
        });
    });
    element.querySelector('[data-sheet-close]').focus({ preventScroll: true });

    let closing = null;
    function close() {
        if (closing) return closing;
        closing = (async () => {
            element.classList.add('is-closing');
            const animation = element.animate?.([{ clipPath: 'inset(0 round 0)' }, { clipPath: clipFrom(getOriginRect()) }], { duration: ms(CLOSE_MS), easing: SHEET_EASE, fill: 'both' });
            await animation?.finished?.catch(() => {});
            element.remove();
            if (returnFocus?.isConnected) returnFocus.focus?.({ preventScroll: true });
        })();
        return closing;
    }
    return { element, close };
}
