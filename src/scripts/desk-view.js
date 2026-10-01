/**
 * Mesa de consulta: a side panel that keeps several articles open while the reader navigates,
 * plus a side-by-side view for up to three of them. Pin buttons anywhere in the app use
 * `data-pin-article="<id>"`; one delegated listener handles them all.
 */
import { emptyArt } from '../lib/empty-art.js';
import {
    DESK_LIMIT, DESKS_LIMIT, SIDE_BY_SIDE_LIMIT, getDesk, getDesks, getActiveDesk, setActiveDesk, createDesk, renameDesk,
    duplicateDesk, deleteDesk, isPinned, pin, togglePin, unpin, moveInDesk, clearDesk, onDeskChange, deskHash,
} from '../lib/desk-store.js';
import { articleHtml } from '../lib/article-html.js';
import { collectionIcon } from '../lib/collection-icons.js';
import { getAcervoGroup } from '../lib/acervo-model.js';
import { withProgress } from '../lib/nav-progress.js';
import '../styles/desk.css';

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
// Value for a quoted attribute selector (CSS.escape is not available everywhere).
const attr = value => String(value ?? '').replace(/["\\]/g, ch => `\\${ch}`);
const PIN_ICON = '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6l-1 6 4 3v2H6v-2l4-3-1-6Z"/><path d="M12 15v6"/></svg>';
const DESK_ICON = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="7" height="16" rx="1.5"/><rect x="14" y="4" width="7" height="10" rx="1.5"/><path d="M14 18h7"/></svg>';

/** Pin button markup for any list or reader. */
export function pinButtonHtml(id, { compact = false } = {}) {
    const pinned = isPinned(id);
    return `<button type="button" class="pin-btn${compact ? ' pin-compact' : ''}${pinned ? ' is-pinned' : ''}" data-pin-article="${esc(id)}" aria-pressed="${pinned}" title="${pinned ? 'Quitar de mi mesa' : 'Fijar en mi mesa de consulta'}">${PIN_ICON}<span class="pin-label">${pinned ? 'En mi mesa' : 'Fijar'}</span></button>`;
}

export function syncPinButtons(root = document) {
    root.querySelectorAll('[data-pin-article]').forEach(button => {
        const pinned = isPinned(button.dataset.pinArticle);
        button.classList.toggle('is-pinned', pinned);
        button.setAttribute('aria-pressed', String(pinned));
        button.title = pinned ? 'Quitar de mi mesa' : 'Fijar en mi mesa de consulta';
        const label = button.querySelector('.pin-label');
        if (label) label.textContent = pinned ? 'En mi mesa' : 'Fijar';
    });
}

/**
 * @param {object} options
 * @param {(ids: string[]) => Promise<object[]>} options.loadArticles
 * @param {(id: string, list: string[]) => void} options.onOpenArticle
 * @param {(item: object) => object|null} options.lawFor
 * @param {(message: string, icon?: string) => void} options.notify
 */
export function initDesk({ loadArticles, onOpenArticle, lawFor = () => null, notify = () => {} }) {
    const cache = new Map();
    const selected = new Set();
    const expanded = new Set();
    let open = false;
    let loading = null;
    let returnFocus = null;

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.id = 'desk-toggle';
    toggle.className = 'desk-toggle';
    toggle.setAttribute('aria-controls', 'desk-panel');
    toggle.setAttribute('aria-expanded', 'false');

    const panel = document.createElement('aside');
    panel.id = 'desk-panel';
    panel.className = 'desk-panel';
    panel.setAttribute('aria-labelledby', 'desk-title');
    panel.hidden = true;
    panel.innerHTML = `
        <header class="desk-head">
            <div class="desk-head-main">
                <h2 id="desk-title" class="desk-eyebrow">Mesas de consulta</h2>
                <div class="desk-switch">
                    <label class="desk-sr" for="desk-select">Mesa activa</label>
                    <select id="desk-select"></select>
                    <button type="button" class="desk-icon-btn desk-menu-btn" data-desk-menu aria-haspopup="true" aria-expanded="false" aria-controls="desk-menu" aria-label="Acciones de la mesa">⋯</button>
                    <div class="desk-menu" id="desk-menu" hidden>
                        <button type="button" data-desk-new>Nueva mesa</button>
                        <button type="button" data-desk-rename>Renombrar</button>
                        <button type="button" data-desk-duplicate>Duplicar</button>
                        <button type="button" data-desk-delete>Borrar mesa</button>
                    </div>
                </div>
                <p class="desk-count" aria-live="polite"></p>
                <div class="desk-sheet" hidden></div>
            </div>
            <button type="button" class="desk-close" data-desk-close aria-label="Cerrar la mesa">×</button>
        </header>
        <div class="desk-tools">
            <button type="button" class="desk-tool desk-side" data-desk-side>Ver lado a lado</button>
            <button type="button" class="desk-tool" data-desk-share>Copiar liga</button>
            <button type="button" class="desk-tool desk-clear" data-desk-clear>Vaciar</button>
        </div>
        <p class="desk-hint"></p>
        <ol class="desk-list"></ol>
        <div class="desk-empty">
            ${emptyArt('desk')}<p><strong>Esta mesa está vacía.</strong></p>
            <p>Usa el botón <span class="desk-inline-pin">${PIN_ICON} Fijar</span> en un artículo para tenerlo a la mano mientras sigues consultando. Caben hasta ${DESK_LIMIT}.</p>
        </div>
        <p class="desk-status"></p>`;

    const side = document.createElement('div');
    side.id = 'desk-side';
    side.className = 'desk-side-view';
    side.setAttribute('role', 'dialog');
    side.setAttribute('aria-modal', 'true');
    side.setAttribute('aria-labelledby', 'desk-side-title');
    side.hidden = true;

    document.body.append(toggle, panel, side);
    const list = panel.querySelector('.desk-list');

    const itemFor = id => cache.get(id);
    const groupOf = item => { const law = item && lawFor(item); return law ? getAcervoGroup(law) : 'otros'; };

    function sideIds() {
        const desk = getDesk();
        const chosen = desk.filter(id => selected.has(id));
        return (chosen.length >= 2 ? chosen : desk).slice(0, SIDE_BY_SIDE_LIMIT);
    }

    async function ensureLoaded() {
        const missing = getDesk().filter(id => !cache.has(id));
        if (!missing.length) return;
        loading ||= withProgress(loadArticles(missing))
            .then(items => { for (const item of items) cache.set(item.id, item); })
            .catch(() => notify('No se pudieron cargar los artículos de tu mesa.', '!'))
            .finally(() => { loading = null; });
        await loading;
    }

    function renderToggle() {
        const count = getDesk().length;
        toggle.hidden = false;
        toggle.classList.toggle('is-empty', count === 0);
        const name = getActiveDesk().name;
        toggle.innerHTML = `${DESK_ICON}<span class="desk-toggle-label">${esc(name)}</span><span class="desk-badge">${count}</span>`;
        toggle.setAttribute('aria-label', `Mesa de consulta «${name}», ${count} ${count === 1 ? 'artículo' : 'artículos'}`);
        toggle.setAttribute('aria-expanded', String(open));
    }

    function card(id, index, total, others = []) {
        const item = itemFor(id);
        if (!item) {
            return `<li class="desk-card is-missing" data-id="${esc(id)}"><div class="desk-card-head"><div class="desk-card-meta"><h3>Artículo no disponible</h3><p>Ya no está en el acervo.</p></div>
                <button type="button" class="desk-icon-btn" data-desk-remove="${esc(id)}" aria-label="Quitar de la mesa">×</button></div></li>`;
        }
        const group = groupOf(item);
        const isOpen = expanded.has(id);
        const law = lawFor(item);
        return `<li class="desk-card${isOpen ? ' is-open' : ''}" data-id="${esc(id)}" data-category="${group}">
            <div class="desk-card-head">
                <label class="desk-check" title="Elegir para ver lado a lado">
                    <input type="checkbox" data-desk-select="${esc(id)}" ${selected.has(id) ? 'checked' : ''} aria-label="Elegir ${esc(item.articulo_label)} para ver lado a lado">
                </label>
                <div class="desk-card-meta">
                    <p class="desk-card-law"><span class="desk-ico">${collectionIcon(group, 13)}</span>${esc(item.siglas_ley || law?.siglas || '')}</p>
                    <h3>${esc(item.articulo_label)}</h3>
                    <p class="desk-card-source" title="${esc(item.ley_origen)}">${esc(item.ley_origen)}</p>
                </div>
                <div class="desk-card-actions">
                    <button type="button" class="desk-icon-btn" data-desk-move="-1" data-id="${esc(id)}" aria-label="Subir" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button type="button" class="desk-icon-btn" data-desk-move="1" data-id="${esc(id)}" aria-label="Bajar" ${index === total - 1 ? 'disabled' : ''}>↓</button>
                    <button type="button" class="desk-icon-btn" data-desk-remove="${esc(id)}" aria-label="Quitar ${esc(item.articulo_label)} de la mesa">×</button>
                </div>
            </div>
            <div class="desk-text" id="desk-text-${esc(id)}">${articleHtml(item.texto)}</div>
            <div class="desk-card-foot">
                <button type="button" class="desk-link" data-desk-expand="${esc(id)}" aria-expanded="${isOpen}" aria-controls="desk-text-${esc(id)}">${isOpen ? 'Contraer' : 'Ver completo'}</button>
                ${others.length ? `<select class="desk-copy" data-desk-copy="${esc(id)}" aria-label="Copiar ${esc(item.articulo_label)} a otra mesa"><option value="">Copiar a…</option>${others.map(d => `<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('')}</select>` : ''}
                <button type="button" class="desk-link" data-desk-open="${esc(id)}">Abrir en el lector</button>
            </div>
        </li>`;
    }

    function renderPanel() {
        const ids = getDesk();
        for (const id of [...selected]) if (!ids.includes(id)) selected.delete(id);
        const desks = getDesks();
        const active = getActiveDesk();
        const others = desks.filter(d => d.id !== active.id);
        const select = panel.querySelector('#desk-select');
        select.innerHTML = desks.map(d => `<option value="${esc(d.id)}"${d.id === active.id ? ' selected' : ''}>${esc(d.name)} (${d.ids.length})</option>`).join('');
        panel.querySelector('[data-desk-new]').disabled = desks.length >= DESKS_LIMIT;
        panel.querySelector('[data-desk-duplicate]').disabled = desks.length >= DESKS_LIMIT;
        panel.querySelector('.desk-count').textContent = `${ids.length} de ${DESK_LIMIT} artículos · ${desks.length} ${desks.length === 1 ? 'mesa' : 'mesas'}`;
        panel.querySelector('.desk-empty').hidden = ids.length > 0;
        panel.querySelector('.desk-tools').hidden = ids.length === 0;
        const sideButton = panel.querySelector('[data-desk-side]');
        sideButton.disabled = ids.length < 2;
        sideButton.textContent = selected.size >= 2 ? `Ver lado a lado (${selected.size})` : 'Ver lado a lado';
        panel.querySelector('.desk-hint').textContent = ids.length >= 2
            ? (selected.size >= 2 ? '' : `Marca de 2 a ${SIDE_BY_SIDE_LIMIT} artículos para verlos lado a lado; si no marcas, se muestran los primeros ${SIDE_BY_SIDE_LIMIT}.`)
            : '';
        list.innerHTML = ids.map((id, index) => card(id, index, ids.length, others)).join('');
    }

    async function render() {
        renderToggle();
        syncPinButtons();
        if (!open) return;
        renderPanel();
        if (getDesk().some(id => !cache.has(id))) {
            await ensureLoaded();
            if (open) renderPanel();
        }
    }

    function setOpen(next, { focus = true } = {}) {
        if (open === next) return;
        open = next;
        document.body.classList.toggle('desk-open', open);
        panel.hidden = !open;
        if (open) {
            returnFocus = document.activeElement;
            render().then(() => { if (focus) panel.querySelector('.desk-close')?.focus(); });
        } else {
            renderToggle();
            if (focus && panel.contains(document.activeElement)) (returnFocus?.isConnected ? returnFocus : toggle).focus();
        }
    }

    async function openSide() {
        await ensureLoaded();
        const ids = sideIds().filter(id => cache.has(id));
        if (ids.length < 2) { notify('Necesitas al menos dos artículos en tu mesa.', '!'); return; }
        side.innerHTML = `<div class="desk-side-inner">
            <header class="desk-side-head">
                <h2 id="desk-side-title">Lado a lado</h2>
                <button type="button" class="desk-close" data-side-close aria-label="Cerrar vista lado a lado">×</button>
            </header>
            <div class="desk-columns" style="--cols:${ids.length}">
                ${ids.map(id => {
                    const item = cache.get(id); const group = groupOf(item);
                    return `<article class="desk-column" data-category="${group}" aria-labelledby="side-${esc(id)}">
                        <header><p class="desk-card-law"><span class="desk-ico">${collectionIcon(group, 13)}</span>${esc(item.siglas_ley || '')}</p>
                            <h3 id="side-${esc(id)}">${esc(item.articulo_label)}</h3><p class="desk-card-source">${esc(item.ley_origen)}</p></header>
                        <div class="desk-column-text">${articleHtml(item.texto)}</div>
                    </article>`;
                }).join('')}
            </div></div>`;
        side.hidden = false;
        document.body.classList.add('desk-side-open');
        side.querySelector('[data-side-close]').focus();
    }

    function closeSide() {
        if (side.hidden) return;
        side.hidden = true;
        document.body.classList.remove('desk-side-open');
        panel.querySelector('[data-desk-side]')?.focus();
    }

    let sheetResolve = null;
    /** Shows a small form or question inside the panel; resolves with the answer or null. */
    function openSheet(html) {
        closeSheet(null);
        const sheet = panel.querySelector('.desk-sheet');
        sheet.innerHTML = html;
        sheet.hidden = false;
        requestAnimationFrame(() => { const field = sheet.querySelector('input, button'); field?.focus(); field?.select?.(); });
        return new Promise(resolve => { sheetResolve = resolve; });
    }
    function closeSheet(value) {
        const sheet = panel.querySelector('.desk-sheet');
        if (sheet) { sheet.hidden = true; sheet.innerHTML = ''; }
        const resolve = sheetResolve; sheetResolve = null;
        resolve?.(value);
    }
    const askName = (label, value, submit) => openSheet(`<form class="desk-form" data-sheet-form>
        <label for="desk-name">${esc(label)}</label>
        <div class="desk-form-row"><input id="desk-name" name="name" maxlength="80" required autocomplete="off" value="${esc(value)}">
        <button type="submit" class="desk-tool desk-side">${esc(submit)}</button><button type="button" class="desk-tool" data-sheet-cancel>Cancelar</button></div>
    </form>`);
    const askConfirm = (question, yes) => openSheet(`<div class="desk-form desk-ask" role="alertdialog" aria-label="${esc(question)}"><p>${esc(question)}</p>
        <div class="desk-form-row"><button type="button" class="desk-tool desk-danger" data-sheet-yes>${esc(yes)}</button><button type="button" class="desk-tool" data-sheet-cancel>Cancelar</button></div></div>`);
    const showLink = url => openSheet(`<div class="desk-form"><label for="desk-link">Copia la liga de tu mesa</label>
        <div class="desk-form-row"><input id="desk-link" readonly value="${esc(url)}"><button type="button" class="desk-tool" data-sheet-cancel>Listo</button></div></div>`);

    function toggleMenu(force) {
        const menu = panel.querySelector('.desk-menu');
        const button = panel.querySelector('[data-desk-menu]');
        const show = force ?? menu.hidden;
        menu.hidden = !show;
        button.setAttribute('aria-expanded', String(show));
        if (show) menu.querySelector('button:not(:disabled)')?.focus();
    }

    const STATUS = {
        local: 'Tus mesas se guardan en este navegador. Inicia sesión para tenerlas en cualquier equipo.',
        syncing: 'Guardando en tu cuenta…',
        account: 'Tus mesas están guardadas en tu cuenta.',
        unavailable: 'Tus mesas se guardan en este navegador; tu cuenta aún no las admite.',
    };
    function setStatus(status) {
        panel.querySelector('.desk-status').textContent = STATUS[status] || '';
        panel.dataset.sync = status;
    }
    setStatus('local');

    // Pin buttons anywhere: capture phase so the card underneath does not open.
    document.addEventListener('click', event => {
        const button = event.target.closest?.('[data-pin-article]');
        if (!button) return;
        event.preventDefault();
        event.stopPropagation();
        const result = togglePin(button.dataset.pinArticle);
        const count = getDesk().length;
        if (result.reason === 'full') notify(`La mesa «${getActiveDesk().name}» está llena (${DESK_LIMIT}). Quita un artículo o usa otra mesa.`, '!');
        else if (result.reason === 'added') {
            notify(`Fijado en «${getActiveDesk().name}» (${count} de ${DESK_LIMIT})`, '📌');
            toggle.classList.remove('is-bump'); void toggle.offsetWidth; toggle.classList.add('is-bump');
        } else if (result.reason === 'removed') notify(`Quitado de «${getActiveDesk().name}»`, '✓');
    }, true);

    toggle.addEventListener('click', () => setOpen(!open));

    panel.addEventListener('click', event => {
        if (!panel.querySelector('.desk-menu').hidden && !event.target.closest('.desk-switch')) toggleMenu(false);
        const target = event.target.closest('button');
        if (!target) return;
        if (target.matches('[data-desk-close]')) setOpen(false);
        else if (target.matches('[data-desk-menu]')) toggleMenu();
        else if (target.closest('.desk-menu')) {
            toggleMenu(false);
            const active = getActiveDesk();
            const back = () => panel.querySelector('#desk-select')?.focus();
            if (target.matches('[data-desk-new]')) {
                askName('Nombre de la nueva mesa', '', 'Crear').then(name => {
                    if (name === null) return back();
                    const result = createDesk(name || undefined);
                    if (!result.ok) notify(`Puedes tener hasta ${DESKS_LIMIT} mesas.`, '!');
                    else { selected.clear(); notify(`Mesa «${result.desk.name}» creada; lo que fijes irá ahí.`, '✓'); }
                    back();
                });
            } else if (target.matches('[data-desk-rename]')) {
                askName('Nuevo nombre de la mesa', active.name, 'Guardar').then(name => {
                    if (name && renameDesk(active.id, name)) notify('Mesa renombrada', '✓');
                    back();
                });
            } else if (target.matches('[data-desk-duplicate]')) {
                const result = duplicateDesk(active.id);
                if (result.ok) notify(`Se creó «${result.desk.name}»`, '✓');
                back();
            } else if (target.matches('[data-desk-delete]')) {
                askConfirm(`¿Borrar la mesa «${active.name}» y sus ${active.ids.length} artículos fijados? Los artículos siguen en el acervo.`, 'Borrar mesa').then(yes => {
                    if (yes) { selected.clear(); deleteDesk(active.id); notify('Mesa borrada', '✓'); }
                    back();
                });
            }
        }
        else if (target.matches('[data-sheet-cancel]')) closeSheet(null);
        else if (target.matches('[data-sheet-yes]')) closeSheet(true)
        else if (target.matches('[data-desk-remove]')) {
            const id = target.dataset.deskRemove;
            const next = target.closest('.desk-card')?.nextElementSibling?.dataset.id || target.closest('.desk-card')?.previousElementSibling?.dataset.id;
            unpin(id);
            requestAnimationFrame(() => (panel.querySelector(`.desk-card[data-id="${attr(next || '')}"] [data-desk-remove]`) || panel.querySelector('.desk-close'))?.focus());
        } else if (target.matches('[data-desk-move]')) {
            const id = target.dataset.id; const delta = Number(target.dataset.deskMove);
            if (moveInDesk(id, delta)) requestAnimationFrame(() => panel.querySelector(`.desk-card[data-id="${attr(id)}"] [data-desk-move="${delta}"]:not([disabled])`)?.focus()
                || panel.querySelector(`.desk-card[data-id="${attr(id)}"] [data-desk-move]:not([disabled])`)?.focus());
        } else if (target.matches('[data-desk-expand]')) {
            const id = target.dataset.deskExpand;
            if (expanded.has(id)) expanded.delete(id); else expanded.add(id);
            const li = target.closest('.desk-card');
            li.classList.toggle('is-open', expanded.has(id));
            target.textContent = expanded.has(id) ? 'Contraer' : 'Ver completo';
            target.setAttribute('aria-expanded', String(expanded.has(id)));
        } else if (target.matches('[data-desk-open]')) {
            onOpenArticle(target.dataset.deskOpen, getDesk().map(id => cache.get(id)).filter(Boolean));
        } else if (target.matches('[data-desk-side]')) {
            openSide();
        } else if (target.matches('[data-desk-share]')) {
            const url = `${location.origin}${location.pathname}${deskHash(getDesk(), getActiveDesk().name)}`;
            (navigator.clipboard?.writeText(url) || Promise.reject())
                .then(() => notify('Liga de tu mesa copiada', '✓'))
                .catch(() => { showLink(url); });
        } else if (target.matches('[data-desk-clear]')) {
            askConfirm(`¿Quitar todos los artículos de «${getActiveDesk().name}»?`, 'Vaciar mesa').then(yes => { if (yes) { selected.clear(); clearDesk(); } });
        }
    });

    panel.addEventListener('submit', event => {
        const form = event.target.closest('[data-sheet-form]');
        if (!form) return;
        event.preventDefault();
        closeSheet(form.elements.name.value.trim());
    });

    panel.addEventListener('change', event => {
        if (event.target.id === 'desk-select') {
            selected.clear();
            setActiveDesk(event.target.value);
            requestAnimationFrame(() => panel.querySelector('#desk-select')?.focus());
            return;
        }
        const copy = event.target.closest('[data-desk-copy]');
        if (copy) {
            const target = getDesks().find(d => d.id === copy.value);
            if (target) {
                const result = pin(copy.dataset.deskCopy, target.id);
                notify(result.reason === 'full' ? `«${target.name}» ya tiene ${DESK_LIMIT} artículos.` : result.reason === 'already' ? `Ya estaba en «${target.name}».` : `Copiado a «${target.name}»`, result.ok ? '✓' : '!');
            }
            copy.value = '';
            return;
        }
        const box = event.target.closest('[data-desk-select]');
        if (!box) return;
        const id = box.dataset.deskSelect;
        if (box.checked && selected.size >= SIDE_BY_SIDE_LIMIT) {
            box.checked = false;
            notify(`Puedes ver hasta ${SIDE_BY_SIDE_LIMIT} artículos lado a lado.`, '!');
            return;
        }
        if (box.checked) selected.add(id); else selected.delete(id);
        renderPanel();
        panel.querySelector(`[data-desk-select="${attr(id)}"]`)?.focus();
    });

    side.addEventListener('click', event => {
        if (event.target.closest('[data-side-close]') || event.target === side) closeSide();
    });

    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape') return;
        if (!panel.querySelector('.desk-sheet').hidden) { event.stopPropagation(); closeSheet(null); }
        else if (!panel.querySelector('.desk-menu').hidden) { event.stopPropagation(); toggleMenu(false); panel.querySelector('[data-desk-menu]').focus(); }
        else if (!side.hidden) { event.stopPropagation(); closeSide(); }
        else if (open && panel.contains(document.activeElement)) { event.stopPropagation(); setOpen(false); }
    }, true);

    onDeskChange(detail => {
        if (detail.reason === 'switched' || detail.reason === 'created' || detail.reason === 'deleted') selected.clear();
        render();
    });
    renderToggle();

    return {
        open: () => setOpen(true),
        close: () => setOpen(false),
        isOpen: () => open,
        refresh: render,
        setStatus,
    };
}
