/**
 * A document as a digital book: two pages from 900 px and one below, with a 3D turn over real fronts
 * and backs. The text comes from the same source as the article reader and is never altered; the
 * citation stays per article, because pages change with the letter size.
 */
import { paginateInSlices, pageOfArticle } from '../lib/book-paginate.js';
import { OUTLINE_HEAD, bookOutline, outlineRowHtml, paginateOutline } from '../lib/book-outline.js';
import { bookShareTargets } from '../lib/book-share.js';
import { coverData } from '../lib/law-cover.js';
import { issuerMark } from '../lib/issuer-logos.js';
import { openPickerSheet } from '../lib/article-picker.js';
import { initReaderControls, readerControlsHtml } from './reader-controls.js';
import '../styles/book.css';

const TWO_PAGES_FROM = 900;
const PHONE_BELOW = 768;
const MAX_PAGE_W = 490;
const MAX_SINGLE_W = 560;
const PAGE_RATIO = 1.42;
const PAGE_CHROME = 150;
const PHONE_CHROME = 150;
const MAX_COLS_DOUBLE = 5;
const MAX_COLS_SINGLE = 3;
const TURN_MS = 780;
const TURN_SINGLE_MS = 624;
const TURN_EASE = 'cubic-bezier(.45,.05,.25,1)';
const DRAG_TO_TURN = 40;
const REPAGINATE_MS = 200;
const COVER = 'cover';
const INDEX = 'index';
const END = 'end';
const SAMPLE_PAGE_NUMBER = '000';

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const storageKey = id => `libro-v1:${id}`;
const reduced = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
// Same document, width, height and settings: same pages.
const memory = new Map();

function loadState(id) {
    try { return { marks: [], ...JSON.parse(localStorage.getItem(storageKey(id)) || '{}') }; } catch { return { marks: [] }; }
}
function saveState(id, state) {
    try { localStorage.setItem(storageKey(id), JSON.stringify(state)); } catch { /* the book still works without storage */ }
}

const ICON = {
    back: '<svg class="bu-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    next: '<svg class="bu-i" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
    index: '<svg class="bu-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
    mark: '<svg class="bu-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-3.5L6 21Z"/></svg>',
    articles: '<svg class="bu-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/></svg>',
    share: '<svg class="bu-i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="m8.3 10.7 7.4-4.3M8.3 13.3l7.4 4.3"/></svg>',
};
const MENU = [['leer', 'Leer por artículo'], ['original', 'Ver el original'], ['cita', 'Copiar cita formal'], ['copiar', 'Copiar'], ['compartir', 'Compartir'], ['fijar', 'Fijar'], ['guardar', 'Guardar']];

/** Measures on a hidden page. Only what changed since the last call is laid out again. */
function createMeasurer(host, w, h) {
    const page = document.createElement('div');
    page.className = 'bk-pg is-de bk-medidor';
    page.style.cssText = `width:${w}px;height:${h}px`;
    page.innerHTML = '<div class="bk-tx"></div>';
    host.append(page);
    const box = page.firstChild;
    const style = getComputedStyle(page);
    const available = h - (parseFloat(style.paddingTop) || 0) - (parseFloat(style.paddingBottom) || 0);
    let shown = [];
    return {
        fits(list) {
            let same = 0;
            while (same < shown.length && same < list.length && shown[same] === list[same]) same += 1;
            while (box.children.length > same) box.lastElementChild.remove();
            for (let index = same; index < list.length; index++) box.insertAdjacentHTML('beforeend', list[index]);
            shown = list.slice();
            return box.scrollHeight <= available;
        },
        remove: () => page.remove(),
    };
}

/**
 * @param {HTMLElement} host
 * @param {{ law: object, articles: object[], pickerArticles?: object[], indexLabel?: Function, onOpenArticle?: Function, onArticleAction?: Function, onExit?: Function, notify?: Function, paginator?: Function, getShareUrl?: Function, initialArticle?: string|null }} options
 * @returns {{ destroy: Function, goToArticle: Function, goToIndex: Function, currentArticle: Function }}
 */
export function renderBookView(host, { law, articles, pickerArticles = articles, indexLabel, onArticleAction = () => {}, onExit = () => {}, notify = () => {}, paginator = paginateInSlices, getShareUrl = () => location.href, initialArticle = null }) {
    const state = loadState(law.id);
    const data = coverData(law);
    let destroyed = false;
    let spread = 0;
    let pages = [];
    let tables = {};
    let layout = { w: MAX_PAGE_W, h: 680, double: true };
    let turn = null;
    let turnCount = 0;
    let dragStart = null;
    let repaginateTimer = null;
    let build = 0;
    // The article asked for stays current until the reader turns the page: a spread shows two pages.
    let pinnedArticle = null;
    let startArticle = initialArticle;
    let articlePage = new Map();

    host.innerHTML = `<div class="bk" data-category="${data.group}">
        <div class="bk-bar">
            <button type="button" class="bu-btn bu-btn-contorno bu-btn-sm bk-regreso" data-book-exit aria-label="Volver a Por artículo">${ICON.back}Volver</button>
            <button type="button" class="bu-btn bu-btn-contorno bu-btn-sm" data-book-index>${ICON.index}Índice</button>
            <button type="button" class="bu-btn bu-btn-contorno bu-btn-sm" data-book-articles>${ICON.articles}Artículos</button>
            <span class="bk-caption" data-book-caption></span>
            <button type="button" class="bu-btn bu-btn-contorno bu-btn-sm" data-book-mark aria-pressed="false">${ICON.mark}Marcar</button>
            <button type="button" class="bu-btn bu-btn-contorno bu-btn-sm" data-book-share aria-haspopup="menu">${ICON.share}Compartir</button>
            <div class="reader-toolbar bk-ajustes" data-book-settings>${readerControlsHtml()}</div>
        </div>
        <div class="bk-escena" tabindex="0" role="group" aria-label="Libro. Usa las flechas para cambiar de página."><div class="bk-libro" data-book></div><div class="bk-carga" data-book-loading role="status" hidden><svg viewBox="33 24 379 448" aria-hidden="true"><use href="#buho-mark"/></svg><p>Preparando el libro<span data-book-percent></span></p><span class="bk-barra" aria-hidden="true"><i data-book-bar></i></span></div></div>
        <div class="bk-pie">
            <button type="button" class="bk-fl" data-book-prev aria-label="Página anterior">${ICON.back}</button>
            <div class="bk-scrub"><input type="range" data-book-range min="0" max="0" step="1" aria-label="Ir a la página"><span data-book-count aria-live="polite" role="status"></span></div>
            <button type="button" class="bk-fl" data-book-next aria-label="Página siguiente">${ICON.next}</button>
        </div>
    </div>`;
    const root = host.querySelector('.bk');
    initReaderControls(root.querySelector('[data-book-settings]'));
    const book = root.querySelector('[data-book]');
    const scene = root.querySelector('.bk-escena');
    const loader = root.querySelector('[data-book-loading]');
    const range = root.querySelector('[data-book-range]');
    const countBox = root.querySelector('[data-book-count]');

    const step = () => (layout.double ? 2 : 1);
    const align = index => (layout.double ? index - (index % 2) : index);
    const lastIndex = () => pages.length - 1;

    function measureLayout() {
        const width = window.innerWidth || TWO_PAGES_FROM;
        const available = host.clientWidth || width;
        const double = width >= TWO_PAGES_FROM;
        const phone = width < PHONE_BELOW;
        const high = (window.innerHeight || 900) - (phone ? PHONE_CHROME : PAGE_CHROME);
        const w = double ? Math.min(MAX_PAGE_W, Math.floor(available / 2)) : Math.min(MAX_SINGLE_W, Math.floor(available));
        return { w, h: phone ? high : Math.min(Math.round(w * PAGE_RATIO), high), double };
    }

    function pageHtml(index, side) {
        const page = pages[index];
        const sideClass = side === 'iz' ? 'is-iz' : 'is-de';
        if (!page) return `<div class="bk-pg ${sideClass}"><div class="bk-vacia"><svg viewBox="33 24 379 448" aria-hidden="true"><use href="#buho-mark"/></svg></div></div>`;
        const marked = state.marks.includes(index) ? '<span class="bk-marca"></span>' : '';
        if (page.kind === COVER) {
            const issuer = issuerMark(law);
            return `<div class="bk-pg ${sideClass}">${marked}<div class="bk-portada"><span class="bk-kick">${esc(data.typeLabel)}</span><strong>${esc(data.siglas || data.name)}</strong><span class="bk-regla"></span><span class="bk-nombre">${esc(data.name)}</span>${issuer?.logo ? `<img class="bk-logo" src="${esc(issuer.logo)}" alt="${esc(issuer.label)}" decoding="async">` : ''}<span class="bk-meta">${esc([data.year, issuer?.logo ? '' : issuer?.short].filter(Boolean).join(' · '))}</span><svg class="bk-buho" viewBox="33 24 379 448" aria-hidden="true"><use href="#buho-mark"/></svg></div></div>`;
        }
        if (page.kind === INDEX) {
            const rows = page.entries.map(entry => outlineRowHtml(entry, articlePage.get(entry.articleId) ?? '')).join('');
            return `<div class="bk-pg ${sideClass}">${marked}<div class="bk-cab"><span>${esc(data.siglas)}</span><span>Índice</span></div><div class="bk-tx bk-ind">${page.first ? OUTLINE_HEAD : ''}${rows}</div><div class="bk-num">${index}</div></div>`;
        }
        if (page.kind === END) {
            return `<div class="bk-pg ${sideClass}"><div class="bk-final"><svg class="bk-buho" viewBox="33 24 379 448" aria-hidden="true"><use href="#buho-mark"/></svg><p>Herramienta de consulta y apoyo. El texto con validez jurídica es el publicado en el Diario Oficial de la Federación o en la fuente oficial de cada documento.</p></div></div>`;
        }
        return `<div class="bk-pg ${sideClass}">${marked}<div class="bk-cab"><span>${esc(data.siglas)}</span><span>${esc(page.caption)}</span></div><div class="bk-tx">${page.html}</div><button type="button" class="bk-al-indice" data-book-toindex>Índice</button><div class="bk-num">${index}</div></div>`;
    }

    function syncChrome(index = spread) {
        const total = lastIndex();
        range.max = String(Math.max(0, total));
        range.value = String(Math.max(0, index));
        const second = layout.double && index + 1 <= total;
        countBox.textContent = index <= 0 ? `Portada · ${total} páginas` : second ? `Páginas ${index}–${index + 1} de ${total}` : `Página ${index} de ${total}`;
        root.querySelector('[data-book-caption]').textContent = pages[Math.max(index, 1)]?.caption || '';
        root.querySelector('[data-book-prev]').disabled = index <= 0;
        root.querySelector('[data-book-next]').disabled = index + step() > total;
        root.querySelector('[data-book-mark]').setAttribute('aria-pressed', String(state.marks.includes(index)));
    }

    function persist() {
        state.page = spread;
        state.articleId = currentArticle();
        saveState(law.id, state);
    }

    function paint() {
        turn = null;
        book.classList.toggle('is-una', !layout.double);
        book.innerHTML = layout.double ? pageHtml(spread, 'iz') + pageHtml(spread + 1, 'de') : pageHtml(spread, 'de');
        syncChrome();
        persist();
    }

    function turnPage(direction) {
        const next = spread + direction * step();
        if (next < 0 || next > lastIndex()) return;
        pinnedArticle = null;
        // A second press finishes the turn under way, so the next one is never cut.
        if (turn) turn.finish?.();
        if (reduced() || !book.animate) { spread = next; paint(); return; }
        const previous = spread;
        const leaf = document.createElement('div');
        leaf.className = 'bk-hoja';
        const shade = '<span class="bk-sombra"></span>';
        let duration = TURN_MS;
        let keyframes;
        if (layout.double) {
            if (direction > 0) {
                book.innerHTML = pageHtml(previous, 'iz') + pageHtml(next + 1, 'de');
                leaf.style.left = `${layout.w}px`;
                leaf.style.transformOrigin = 'left center';
                leaf.innerHTML = `<div class="bk-cara">${pageHtml(previous + 1, 'de')}${shade}</div><div class="bk-cara is-dorso">${pageHtml(next, 'iz')}${shade}</div>`;
            } else {
                book.innerHTML = pageHtml(next, 'iz') + pageHtml(previous + 1, 'de');
                leaf.style.left = '0';
                leaf.style.transformOrigin = 'right center';
                leaf.innerHTML = `<div class="bk-cara">${pageHtml(previous, 'iz')}${shade}</div><div class="bk-cara is-dorso">${pageHtml(next + 1, 'de')}${shade}</div>`;
            }
            keyframes = [{ transform: 'rotateY(0deg)' }, { transform: `rotateY(${direction > 0 ? -180 : 180}deg)` }];
        } else {
            duration = TURN_SINGLE_MS;
            const forward = direction > 0;
            book.innerHTML = pageHtml(forward ? next : previous, 'de');
            leaf.style.left = '0';
            leaf.style.transformOrigin = 'left center';
            leaf.innerHTML = `<div class="bk-cara">${pageHtml(forward ? previous : next, 'de')}${shade}</div>`;
            const flat = { transform: 'rotateY(0deg)', opacity: 1 };
            const lifted = { transform: 'rotateY(-105deg)', opacity: 0.4 };
            keyframes = forward ? [flat, lifted] : [lifted, flat];
        }
        book.append(leaf);
        const animation = leaf.animate(keyframes, { duration, easing: TURN_EASE, fill: 'forwards' });
        leaf.querySelectorAll('.bk-sombra').forEach(node => node.animate([{ opacity: 0 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], { duration, easing: 'ease-in-out' }));
        spread = next;
        turn = animation;
        const mine = ++turnCount;
        animation.onfinish = () => { if (mine === turnCount) paint(); };
        animation.oncancel = () => { if (mine === turnCount) turn = null; };
        syncChrome(next);
        persist();
    }

    function currentArticle() {
        if (pinnedArticle !== null) return pinnedArticle;
        for (let index = Math.max(spread, 1); index <= lastIndex(); index++) {
            if (pages[index]?.articleIds?.length) return pages[index].articleIds[0];
        }
        return state.articleId ?? null;
    }

    function goToArticle(id) {
        const content = pages.slice(1);
        const found = pageOfArticle(content, id);
        if (found < 0) return false;
        pinnedArticle = id;
        spread = align(found + 1);
        paint();
        return true;
    }

    function goToIndex() {
        pinnedArticle = null;
        if (turn) turn.finish?.();
        const first = pages.findIndex(page => page.kind === INDEX);
        spread = align(first < 0 ? 0 : first);
        paint();
    }

    function placeMenu(menu, button) {
        root.append(menu);
        const box = button.getBoundingClientRect();
        const home = root.getBoundingClientRect();
        menu.style.left = `${Math.max(0, Math.min(box.left - home.left, home.width - 260))}px`;
        menu.style.top = `${box.bottom - home.top + 6}px`;
        menu.addEventListener('keydown', event => { if (event.key === 'Escape') { menu.remove(); button.focus?.(); } });
    }

    function openShareMenu(button) {
        root.querySelector('.bk-menu')?.remove();
        const url = getShareUrl(currentArticle());
        const title = data.siglas || data.name;
        const menu = document.createElement('div');
        menu.className = 'bk-menu bu-cristal-fuerte';
        menu.setAttribute('role', 'menu');
        menu.innerHTML = `<h5>Compartir esta lectura</h5>${bookShareTargets({ title, url }).map(target => `<a role="menuitem" data-share="${target.id}" href="${esc(target.href)}" target="_blank" rel="noopener noreferrer">${esc(target.label)}</a>`).join('')}<button type="button" role="menuitem" data-share-copy>Copiar enlace</button>${navigator.share ? '<button type="button" role="menuitem" data-share-native>Más opciones…</button>' : ''}`;
        placeMenu(menu, button);
        menu.addEventListener('click', event => {
            if (event.target.closest('[data-share-copy]')) {
                navigator.clipboard?.writeText(url).then(() => notify('Enlace copiado'), () => notify('No se pudo copiar el enlace'));
            } else if (event.target.closest('[data-share-native]')) {
                navigator.share({ title, url }).catch(() => {});
            } else if (!event.target.closest('a')) return;
            menu.remove();
        });
        menu.querySelector('a').focus({ preventScroll: true });
    }

    function openMenu(button) {
        root.querySelector('.bk-menu')?.remove();
        const id = button.dataset.bookArticle;
        const menu = document.createElement('div');
        menu.className = 'bk-menu bu-cristal-fuerte';
        menu.setAttribute('role', 'menu');
        menu.innerHTML = `<h5>${esc(button.textContent)}</h5>${MENU.map(([key, label]) => `<button type="button" role="menuitem" data-book-action="${key}">${label}</button>`).join('')}`;
        placeMenu(menu, button);
        menu.addEventListener('click', event => {
            const action = event.target.closest('[data-book-action]')?.dataset.bookAction;
            if (!action) return;
            menu.remove();
            onArticleAction(action, id);
        });
        menu.querySelector('button').focus({ preventScroll: true });
    }

    function openTable(id) {
        const table = tables[id];
        if (!table) return;
        const viewer = document.createElement('div');
        viewer.className = 'lr-table-viewer';
        viewer.setAttribute('role', 'dialog');
        viewer.setAttribute('aria-modal', 'true');
        viewer.setAttribute('aria-label', table.title);
        viewer.innerHTML = `<button type="button" class="bu-btn bu-btn-contorno bu-btn-sm" data-close>Cerrar</button><div class="lr-table" tabindex="0">${table.html}</div>`;
        const close = () => viewer.remove();
        viewer.querySelector('[data-close]').addEventListener('click', close);
        viewer.addEventListener('keydown', event => { if (event.key === 'Escape') { event.stopPropagation(); close(); } });
        document.body.append(viewer);
        viewer.querySelector('[data-close]').focus({ preventScroll: true });
    }

    function openFigure(src) {
        const viewer = document.createElement('div');
        viewer.className = 'lr-table-viewer';
        viewer.setAttribute('role', 'dialog');
        viewer.setAttribute('aria-modal', 'true');
        viewer.setAttribute('aria-label', 'Figura');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'bu-btn bu-btn-contorno bu-btn-sm';
        button.textContent = 'Cerrar';
        const image = document.createElement('img');
        image.src = src;
        image.alt = 'Figura de la publicación oficial';
        image.className = 'bk-fig-grande';
        viewer.append(button, image);
        const close = () => viewer.remove();
        button.addEventListener('click', close);
        viewer.addEventListener('keydown', event => { if (event.key === 'Escape') { event.stopPropagation(); close(); } });
        document.body.append(viewer);
        button.focus({ preventScroll: true });
    }

    function toggleMark() {
        state.marks = state.marks.includes(spread) ? state.marks.filter(page => page !== spread) : [...state.marks, spread];
        persist();
        paint();
    }

    const settingsKey = () => {
        const style = getComputedStyle(document.documentElement);
        return ['--reader-font-size', '--reader-line-height', '--reader-font-family'].map(name => style.getPropertyValue(name)).join('|');
    };

    async function paginateAll() {
        const mine = ++build;
        layout = measureLayout();
        root.classList.toggle('is-full', (window.innerWidth || TWO_PAGES_FROM) < PHONE_BELOW);
        root.style.setProperty('--pg-w', `${layout.w}px`);
        root.style.setProperty('--pg-h', `${layout.h}px`);
        const key = [law.id, layout.w, layout.h, layout.double, settingsKey()].join('::');
        const keepArticle = startArticle ?? currentArticleBeforeBuild();
        startArticle = null;
        let result = memory.get(key);
        if (!result) {
            showLoader();
            await Promise.resolve(document.fonts?.ready);
            if (destroyed || mine !== build) return;
            const measurer = createMeasurer(root, layout.w, layout.h);
            try {
                const content = await paginator(articles, { fits: measurer.fits, maxTableCols: layout.double ? MAX_COLS_DOUBLE : MAX_COLS_SINGLE }, { onProgress: fraction => { if (mine === build) progress(fraction); } });
                const outline = paginateOutline(bookOutline(articles), list => measurer.fits([OUTLINE_HEAD, ...list.map(entry => outlineRowHtml(entry, SAMPLE_PAGE_NUMBER))]));
                result = { ...content, outline };
            } finally {
                measurer.remove();
            }
            if (destroyed || mine !== build) return;
            memory.set(key, result);
        }
        loader.hidden = true;
        pages = [{ kind: COVER }, ...result.outline.map((entries, index) => ({ kind: INDEX, entries, first: index === 0, caption: 'Índice' })), ...result.pages, { kind: END }];
        tables = result.tables;
        articlePage = new Map();
        pages.forEach((page, index) => (page.articleIds || []).forEach(id => { if (!articlePage.has(id)) articlePage.set(id, index); }));
        if (keepArticle == null || !goToArticle(keepArticle)) {
            spread = align(Math.min(Number(state.page) || 0, lastIndex()));
            paint();
        }
    }

    function progress(fraction) {
        const percent = Math.round(Math.min(1, Math.max(0, fraction)) * 100);
        loader.querySelector('[data-book-percent]').textContent = ` · ${percent}%`;
        loader.querySelector('[data-book-bar]').style.width = `${percent}%`;
    }

    function showLoader() {
        progress(0);
        loader.hidden = false;
        if (!pages.length) book.innerHTML = layout.double ? pageHtml(-1, 'iz') + pageHtml(-1, 'de') : pageHtml(-1, 'de');
    }

    function currentArticleBeforeBuild() {
        return pages.length ? currentArticle() : state.articleId;
    }

    root.addEventListener('click', event => {
        if (!event.target.closest('.bk-menu')) root.querySelector('.bk-menu')?.remove();
        if (event.target.closest('[data-book-prev]')) { turnPage(-1); return; }
        if (event.target.closest('[data-book-next]')) { turnPage(1); return; }
        if (event.target.closest('[data-book-exit]')) { onExit(currentArticle()); return; }
        if (event.target.closest('[data-book-mark]')) { toggleMark(); return; }
        if (event.target.closest('[data-book-index], [data-book-toindex]')) { goToIndex(); return; }
        const shareButton = event.target.closest('[data-book-share]');
        if (shareButton) { openShareMenu(shareButton); return; }
        const entry = event.target.closest('[data-book-goto]');
        if (entry) { goToArticle(entry.dataset.bookGoto); return; }
        if (event.target.closest('[data-book-articles]')) {
            openPickerSheet(pickerArticles, id => goToArticle(id), indexLabel ? { indexLabel } : {});
            return;
        }
        const articleButton = event.target.closest('[data-book-article]');
        if (articleButton) { openMenu(articleButton); return; }
        const tableButton = event.target.closest('[data-book-table]');
        if (tableButton) { openTable(tableButton.dataset.bookTable); return; }
        const figure = event.target.closest('[data-book-figure]');
        if (figure) openFigure(figure.dataset.bookFigure);
    });
    range.addEventListener('input', () => { pinnedArticle = null; spread = align(Number(range.value)); paint(); });
    scene.addEventListener('keydown', event => {
        if (event.key === 'ArrowRight') { turnPage(1); event.preventDefault(); }
        if (event.key === 'ArrowLeft') { turnPage(-1); event.preventDefault(); }
    });
    scene.addEventListener('pointerdown', event => { if (!event.target.closest('button, a')) dragStart = event.clientX; });
    scene.addEventListener('pointerup', event => {
        if (dragStart === null) return;
        const delta = event.clientX - dragStart;
        dragStart = null;
        if (Math.abs(delta) > DRAG_TO_TURN) turnPage(delta < 0 ? 1 : -1);
    });

    const repaginate = () => {
        clearTimeout(repaginateTimer);
        repaginateTimer = setTimeout(() => { if (!destroyed) start(); }, REPAGINATE_MS);
    };
    window.addEventListener('resize', repaginate);
    // Reading settings live as custom properties on the root: a change of letter lays the pages out again.
    const settingsObserver = typeof MutationObserver === 'function' ? new MutationObserver(repaginate) : null;
    settingsObserver?.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

    function start() {
        return paginateAll().catch(error => {
            console.error('[Libro] No se pudo paginar:', error);
            if (destroyed) return;
            notify('No se pudo armar el libro. Sigues en la lectura por artículo.');
            onExit(null);
        });
    }
    const ready = start();

    function destroy() {
        destroyed = true;
        clearTimeout(repaginateTimer);
        window.removeEventListener('resize', repaginate);
        settingsObserver?.disconnect();
        turn = null;
        host.innerHTML = '';
    }

    return { destroy, goToArticle, goToIndex, currentArticle, ready, turnPage };
}
