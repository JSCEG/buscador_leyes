/**
 * Home screen: search on top, every document on a curved 3D shelf, and a folder per collection.
 * Only the tomes the arc can show exist in the DOM. One frame loop drives them and it stops at rest.
 */
import { groupAcervo, selectAcervo } from '../lib/acervo-model.js';
import { GROUP_LABELS, coverData, coverHTML, spineHTML } from '../lib/law-cover.js';
import { folderHtml } from '../lib/folder-html.js';
import { clampIndex, presencePositions, shelfMetrics, springStep, tomeTransform } from '../lib/shelf-geometry.js';
import { openLawSheet } from './law-sheet.js';
import '../styles/shelf.css';

const FALLBACK_H = 400;
const OMEGA = 7.5;
const MAX_ACCEL = 60;
const MAX_SPEED = 13;
const OMEGA_PRESENCE = 11;
const PRESENCE_RISE = -46;
const MIN_PRESENCE = 0.01;
const DRAG_THRESHOLD = 5;
const WHEEL_SNAP_MS = 160;
const MAX_DT = 0.034;
const FIRST_DT = 0.016;
const SETTLED = 0.01;
const REST = 0.002;
const REST_SPEED = 0.004;
const ARRIVED = 0.05;
const DRAG_OVERRUN = 0.4;
const CAPTION_FAST = 1.5;
// A long shelf opens a few books in, so the arc shows on both sides of the first cover.
const OPENING_INDEX = 3;
const OPENING_MIN_ITEMS = 12;
const CAPTION_MS = 420;
const CAPTION_EASE = 'cubic-bezier(.16,1,.3,1)';
const SEARCH_ICON = '<svg class="bux-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg>';
const ARROW = direction => `<svg width="24" height="12" viewBox="0 0 24 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${direction < 0 ? 'M6 1 1 6l5 5M1 6h22' : 'm18 1 5 5-5 5m5-5H1'}"/></svg>`;

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

/** Shelf order: collections in their usual order, each one by title. Empty collections are left out. */
export function buildShelf(summaries) {
    const groups = groupAcervo(selectAcervo(summaries, { sort: 'title' })).filter(group => group.items.length);
    let firstIndex = 0;
    const segments = groups.map(group => {
        const segment = { group: group.id, firstIndex, count: group.items.length };
        firstIndex += group.items.length;
        return segment;
    });
    return { items: groups.flatMap(group => group.items), segments };
}

const metaLine = data => [data.siglas, data.groupLabel, data.year].filter(Boolean).join(' · ');

function statusHTML(state) {
    if (state === 'loading') return '<div class="sh-status" data-state="loading" role="status"><span class="bux-dots" aria-hidden="true"><i></i><i></i><i></i></span><p>Cargando documentos…</p></div>';
    return '<div class="sh-status" data-state="error" role="alert"><p>No pudimos mostrar el estante en este momento.</p><button type="button" class="bux-btn bux-btn--secondary" data-sh-browse>Ver todos los documentos</button></div>';
}

/**
 * @param {HTMLElement} host
 * @param {{ summaries?: object[], status?: 'loading'|'ready', onSearch?: Function, onOpenLaw?: Function, onShare?: Function, onSheetChange?: Function, onBrowse?: Function, onLegal?: Function, onFeedback?: Function }} options
 */
export function renderShelfView(host, { summaries = [], status = 'loading', onSearch = () => {}, onOpenLaw = () => {}, onShare = () => {}, onSheetChange = () => {}, onBrowse = () => {}, onLegal = () => {}, onFeedback = () => {} } = {}) {
    host.innerHTML = `<div class="sh-view">
        <div class="sh-top">
            <h1>Leyes y reglas de <em>energía</em> de México, en un solo lugar</h1>
            <div class="sh-search bu-cristal">${SEARCH_ICON}<input type="search" class="bux-search__input" aria-label="Buscar en los documentos" placeholder="Busca una ley, un artículo o un tema" autocomplete="off"></div>
        </div>
        <section class="sh-shelf" aria-roledescription="carrusel" aria-label="Estante de documentos" tabindex="0">
            <div class="sh-probe" aria-hidden="true"></div>
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
        <div class="sh-folders" role="group" aria-label="Colecciones" hidden></div>
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
    const folders = view.querySelector('.sh-folders');
    const field = view.querySelector('.sh-search input');

    const reduced = () => Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    const mobile = () => Boolean(window.matchMedia?.('(max-width: 767px)').matches);

    let destroyed = false;
    let items = [];
    let segments = [];
    let metrics = null;
    let positions = [];
    let presences = [];
    let pos = { x: 0, v: 0 };
    let focus = 0;
    let filter = null;
    let pendingOpen = null;
    let wheelRest = 0;
    let active = -1;
    let handle = null;
    let last = 0;
    const tomes = new Map();
    const lifts = new Map();
    let hovered = null;
    let tiltX = 0;
    let tiltY = 0;
    let tiltXTarget = 0;
    let tiltYTarget = 0;
    let sheet = null;
    let sheetLawId = null;
    let drag = null;
    let suppressClick = false;
    let wheelTimer = null;

    function measure() {
        const header = document.querySelector('.bu-cab-m');
        view.style.setProperty('--sh-header', `${header?.offsetHeight || 0}px`);
        view.style.setProperty('--sh-bottom', getComputedStyle(document.body).paddingBottom || '0px');
        metrics = shelfMetrics(probe.getBoundingClientRect().height || FALLBACK_H, { mobile: mobile() });
    }

    function makeTome(law) {
        const tome = document.createElement('div');
        tome.className = 'sh-tome';
        tome.dataset.lawId = law.id;
        tome.innerHTML = `<div class="sh-face sh-face--spine">${spineHTML(law)}</div><div class="sh-face sh-face--cover">${coverHTML(law)}</div><div class="sh-face sh-face--back"></div>`;
        stage.appendChild(tome);
        return tome;
    }

    function drawTomes() {
        items.forEach((law, index) => {
            const presence = presences[index].x;
            const place = presence < MIN_PRESENCE ? null : tomeTransform(positions[index] - pos.x, metrics, { lift: lifts.get(law.id) || 0, tiltX, tiltY });
            let tome = tomes.get(law.id);
            if (!place?.visible) {
                if (tome) { tome.remove(); tomes.delete(law.id); }
                return;
            }
            if (!tome) { tome = makeTome(law); tomes.set(law.id, tome); }
            tome.style.transform = `translate3d(${place.x}px,${place.y + (1 - presence) * PRESENCE_RISE}px,${place.z}px) rotateX(${place.rotateX}deg) rotateY(${place.rotateY}deg)`;
            tome.style.zIndex = place.zIndex;
            tome.style.setProperty('--p', presence.toFixed(3));
            tome.style.setProperty('--spine-shade', place.spineShade.toFixed(3));
            tome.style.setProperty('--cover-shade', place.coverShade.toFixed(3));
            tome.style.setProperty('--cover-text', place.o.toFixed(3));
        });
    }

    function setCaptionLine(box, text, direction, title = '') {
        box.title = title;
        // Only the line on screen slides out; a long jump swaps text directly so lines never stack.
        box.querySelectorAll('.is-leaving').forEach(node => node.remove());
        const previous = [...box.children];
        const line = document.createElement('span');
        line.textContent = text;
        box.appendChild(line);
        if (!previous.length || !direction || reduced() || !line.animate || Math.abs(positions[focus] - pos.x) > CAPTION_FAST) {
            previous.forEach(node => node.remove());
            return;
        }
        const timing = { duration: CAPTION_MS, easing: CAPTION_EASE, fill: 'both' };
        line.animate([{ opacity: 0, transform: `translateY(${direction * 14}px)` }, { opacity: 1, transform: 'none' }], timing);
        previous.forEach(node => {
            node.classList.add('is-leaving');
            const out = node.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateY(${-direction * 12}px)` }], { ...timing, duration: CAPTION_MS * 0.6 });
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
        syncArrows();
    }

    const groupAt = index => segments.find(item => index >= item.firstIndex && index < item.firstIndex + item.count)?.group;
    const isShown = index => filter === null || groupAt(index) === filter;
    const visibleIndexes = () => items.map((_, index) => index).filter(isShown);

    function syncArrows() {
        const shown = visibleIndexes();
        view.querySelector('[data-sh-prev]').disabled = focus === shown[0];
        view.querySelector('[data-sh-next]').disabled = focus === shown.at(-1);
    }

    /** Books ease in and out of the line. Returns whether any is still moving. */
    function stepPresences(dt, instant) {
        let moving = false;
        presences = presences.map((presence, index) => {
            const goal = isShown(index) ? 1 : 0;
            if (instant) return { x: goal, v: 0 };
            if (presence.x === goal && !presence.v) return presence;
            const next = springStep(presence, goal, dt, OMEGA_PRESENCE);
            if (Math.abs(goal - next.x) < REST && Math.abs(next.v) < SETTLED) return { x: goal, v: 0 };
            moving = true;
            return { x: Math.max(0, Math.min(1, next.x)), v: next.v };
        });
        positions = presencePositions(presences.map(presence => presence.x));
        return moving;
    }

    function nearestShown(x) {
        return visibleIndexes().reduce((best, index) => (Math.abs(positions[index] - x) < Math.abs(positions[best] - x) ? index : best), focus);
    }

    function frame(now) {
        handle = null;
        if (destroyed || !items.length) return;
        const dt = last ? Math.min((now - last) / 1000, MAX_DT) : FIRST_DT;
        last = now;
        const instant = reduced();
        let moving = stepPresences(dt, instant);
        if (drag?.moved) {
            focus = nearestShown(pos.x);
            moving = true;
        } else if (instant) {
            pos = { x: positions[focus], v: 0 };
        } else {
            pos = springStep(pos, positions[focus], dt, OMEGA, { maxAccel: MAX_ACCEL, maxSpeed: MAX_SPEED });
            if (Math.abs(positions[focus] - pos.x) < REST && Math.abs(pos.v) < REST_SPEED) pos = { x: positions[focus], v: 0 };
            else moving = true;
        }
        if (focus !== active) showActive(focus, Math.sign(focus - active) || 1);
        const easing = easeHover(dt);
        drawTomes();
        if (pendingOpen !== null && Math.abs(positions[focus] - pos.x) < ARRIVED) {
            const id = pendingOpen;
            pendingOpen = null;
            openSheet(id);
        }
        if (moving || easing || drag) wake();
        else last = 0;
    }

    /** Cover tilt and spine lift ease toward the pointer. Returns whether they are still moving. */
    function easeHover(dt) {
        const tiltEase = 1 - Math.exp(-7 * dt);
        tiltX += (tiltXTarget - tiltX) * tiltEase;
        tiltY += (tiltYTarget - tiltY) * tiltEase;
        let moving = Math.abs(tiltXTarget - tiltX) > SETTLED || Math.abs(tiltYTarget - tiltY) > SETTLED;
        const liftEase = 1 - Math.exp(-12 * dt);
        if (hovered !== null && !lifts.has(hovered)) lifts.set(hovered, 0);
        lifts.forEach((value, id) => {
            const goal = id === hovered ? 1 : 0;
            const next = value + (goal - value) * liftEase;
            if (Math.abs(goal - next) > SETTLED) moving = true;
            if (!goal && next < SETTLED) lifts.delete(id);
            else lifts.set(id, next);
        });
        return moving;
    }

    function wake() {
        if (!destroyed && handle === null) handle = requestAnimationFrame(frame);
    }

    function setStatus(state) {
        view.querySelector('.sh-status')?.remove();
        if (state) shelf.insertAdjacentHTML('beforeend', statusHTML(state));
        caption.hidden = Boolean(state);
        folders.hidden = Boolean(state);
    }

    function setCatalog(next) {
        ({ items, segments } = buildShelf(next));
        tomes.forEach(tome => tome.remove());
        tomes.clear();
        folders.innerHTML = segments.map(segment => folderHtml({
            group: segment.group,
            label: GROUP_LABELS[segment.group],
            count: segment.count,
            sheets: items.slice(segment.firstIndex, segment.firstIndex + segment.count).slice(0, 3).map(law => ({ id: law.id, label: law.siglas || coverData(law).name })),
        })).join('');
        if (!items.length) { setStatus('error'); return; }
        setStatus(null);
        const single = items.length < 2;
        view.querySelector('[data-sh-prev]').hidden = single;
        view.querySelector('[data-sh-next]').hidden = single;
        presences = items.map(() => ({ x: 1, v: 0 }));
        positions = presencePositions(presences.map(presence => presence.x));
        focus = items.length >= OPENING_MIN_ITEMS ? OPENING_INDEX : 0;
        pos = { x: positions[focus], v: 0 };
        filter = null; pendingOpen = null; active = -1; last = 0;
        measure();
        wake();
    }

    function setFailed() { setStatus('error'); }

    const indexOfLaw = id => items.findIndex(law => String(law.id) === String(id));

    function moveBy(delta) {
        if (sheet || items.length < 2) return;
        const shown = visibleIndexes();
        focus = shown[Math.max(0, Math.min(shown.length - 1, shown.indexOf(focus) + delta))];
        pendingOpen = null;
        wake();
    }

    function moveToIndex(index) {
        if (!isShown(index)) setFilter(null);
        focus = clampIndex(index, visibleIndexes());
        wake();
    }

    /** A folder filters at once; pressing the open one brings every document back. */
    function setFilter(group) {
        filter = group;
        pendingOpen = null;
        folders.querySelectorAll('[data-folder]').forEach(folder => {
            const open = folder.dataset.folder === filter;
            folder.toggleAttribute('data-open', open);
            folder.querySelector('[aria-pressed]').setAttribute('aria-pressed', String(open));
            folder.querySelectorAll('[data-sheet-doc]').forEach(page => { page.tabIndex = open ? 0 : -1; });
        });
        const shown = visibleIndexes();
        if (!shown.includes(focus)) focus = shown[Math.floor(shown.length / 2)];
        syncArrows();
        wake();
    }

    /** Brings a book to the front and opens its sheet when it arrives. */
    function bringAndOpen(index) {
        pendingOpen = items[index].id;
        moveToIndex(index);
    }

    function focusLaw(id) {
        const index = indexOfLaw(id);
        if (index < 0) return false;
        moveToIndex(index);
        return true;
    }

    function coverRect() {
        const rect = tomes.get(sheetLawId)?.querySelector('.sh-face--cover')?.getBoundingClientRect();
        return rect?.width ? rect : null;
    }

    function openSheet(id, { silent = false } = {}) {
        const index = indexOfLaw(id);
        if (index < 0) return false;
        if (sheet) {
            if (String(sheetLawId) === String(id)) return true;
            closeSheet({ silent: true });
        }
        const law = items[index];
        // The sheet grows from the real cover, so the shelf is brought to it at once.
        moveToIndex(index);
        stepPresences(0, true);
        pos = { x: positions[focus], v: 0 };
        pendingOpen = null;
        tiltXTarget = 0; tiltYTarget = 0; hovered = null;
        if (index !== active) showActive(index, 0);
        drawTomes();
        if (document.activeElement === document.body) shelf.focus({ preventScroll: true });
        sheetLawId = law.id;
        sheet = openLawSheet(law, {
            host: view,
            getOriginRect: coverRect,
            reducedMotion: reduced(),
            onRead: onOpenLaw,
            onShare,
            onRequestClose: () => closeSheet(),
        });
        if (!silent) onSheetChange(law);
        return true;
    }

    function closeSheet({ silent = false } = {}) {
        if (!sheet) return Promise.resolve();
        const current = sheet;
        sheet = null;
        if (!silent) onSheetChange(null);
        return current.close();
    }

    function onShelfClick(event) {
        if (suppressClick) { suppressClick = false; return; }
        if (sheet) return;
        const tome = event.target.closest('.sh-tome');
        if (!tome) return;
        const index = indexOfLaw(tome.dataset.lawId);
        if (index < 0) return;
        bringAndOpen(index);
    }

    function onPointerDown(event) {
        suppressClick = false;
        if (sheet || event.button !== 0 || items.length < 2 || event.target.closest('.sh-status')) return;
        drag = { x: event.clientX, base: pos.x, moved: false };
    }

    function onPointerMove(event) {
        if (drag) {
            const dx = event.clientX - drag.x;
            if (!drag.moved && Math.abs(dx) <= DRAG_THRESHOLD) return;
            if (!drag.moved) shelf.setPointerCapture?.(event.pointerId);
            drag.moved = true;
            shelf.classList.add('is-dragging');
            hovered = null; tiltXTarget = 0; tiltYTarget = 0;
            const shown = visibleIndexes();
            const low = positions[shown[0]] - DRAG_OVERRUN;
            const high = positions[shown.at(-1)] + DRAG_OVERRUN;
            pos = { x: Math.max(low, Math.min(high, drag.base - dx / (metrics.ws + metrics.gap))), v: 0 };
            wake();
            return;
        }
        if (sheet || reduced() || event.pointerType === 'touch') return;
        trackHover(event);
    }

    function onPointerUp() {
        if (!drag) return;
        if (drag.moved) { suppressClick = true; focus = nearestShown(pos.x); }
        drag = null;
        shelf.classList.remove('is-dragging');
        wake();
    }

    function trackHover(event) {
        const box = shelf.getBoundingClientRect();
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        const { d, H } = metrics;
        const onCover = Math.abs(dx) < 0.55 * d && Math.abs(dy) < 0.55 * H && Math.abs(positions[focus] - pos.x) < 0.3;
        tiltYTarget = onCover ? (dx / (0.55 * d)) * 8 : (dx / (box.width || 1)) * 4;
        tiltXTarget = onCover ? (-dy / (H / 2)) * 5 : 0;
        const id = event.target.closest?.('.sh-tome')?.dataset.lawId ?? null;
        const index = id === null ? -1 : indexOfLaw(id);
        hovered = index >= 0 && Math.abs(positions[index] - pos.x) > 0.5 ? items[index].id : null;
        wake();
    }

    function onPointerLeave() {
        hovered = null; tiltXTarget = 0; tiltYTarget = 0;
        wake();
    }

    function onWheel(event) {
        if (sheet || items.length < 2) return;
        const pageScrolls = document.documentElement.scrollHeight > window.innerHeight + 1;
        const unit = event.deltaMode === 1 ? 16 : 1;
        const delta = pageScrolls || Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if (!delta) return;
        event.preventDefault();
        wheelRest += ((delta * unit) / (metrics.ws + metrics.gap)) * 0.5;
        const steps = Math.trunc(wheelRest);
        if (steps) { wheelRest -= steps; moveBy(steps); }
        clearTimeout(wheelTimer);
        wheelTimer = setTimeout(() => { wheelRest = 0; }, WHEEL_SNAP_MS);
    }

    function onKeyDown(event) {
        if (sheet || !event.target.closest?.('.sh-shelf, .sh-caption')) return;
        if (event.key === 'ArrowRight') { event.preventDefault(); moveBy(1); }
        else if (event.key === 'ArrowLeft') { event.preventDefault(); moveBy(-1); }
        else if (event.key === 'Enter' && event.target === shelf && active >= 0) openSheet(items[active].id);
    }

    function onResize() {
        if (destroyed) return;
        measure();
        if (items.length) { drawTomes(); wake(); }
    }

    view.addEventListener('click', event => {
        if (event.target.closest('[data-sh-prev]')) { moveBy(-1); return; }
        if (event.target.closest('[data-sh-next]')) { moveBy(1); return; }
        if (event.target.closest('[data-sh-open]')) { if (!sheet && active >= 0) openSheet(items[active].id); return; }
        const page = event.target.closest('[data-sheet-doc]');
        if (page) {
            const index = indexOfLaw(page.dataset.sheetDoc);
            if (index >= 0 && !sheet) bringAndOpen(index);
            return;
        }
        const folder = event.target.closest('[data-folder] [aria-pressed]');
        if (folder) {
            if (!sheet) { const group = folder.closest('[data-folder]').dataset.folder; setFilter(filter === group ? null : group); }
            return;
        }
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

    stage.addEventListener('click', onShelfClick);
    shelf.addEventListener('pointerdown', onPointerDown);
    shelf.addEventListener('pointermove', onPointerMove);
    shelf.addEventListener('pointerup', onPointerUp);
    shelf.addEventListener('pointercancel', onPointerUp);
    shelf.addEventListener('pointerleave', onPointerLeave);
    shelf.addEventListener('wheel', onWheel, { passive: false });
    view.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    const resizeObserver = window.ResizeObserver ? new ResizeObserver(onResize) : null;
    resizeObserver?.observe(view);

    measure();
    if (status === 'ready') setCatalog(summaries);
    else setStatus('loading');
    view.classList.add('is-entered');

    function destroy() {
        destroyed = true;
        if (handle !== null) cancelAnimationFrame(handle);
        handle = null;
        clearTimeout(wheelTimer);
        window.removeEventListener('resize', onResize);
        resizeObserver?.disconnect();
        tomes.clear();
        lifts.clear();
        sheet = null;
        host.innerHTML = '';
    }

    return { destroy, setCatalog, setFailed, focusLaw, openSheet, closeSheet };
}
