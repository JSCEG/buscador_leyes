import { getReaderSource } from '../lib/reader-source.js';
import { createRemotePdf } from '../lib/reader-pdf.js';
import '../styles/reader-source.css';

const mounted = new WeakMap();
let nextId = 0;

function safeUrl(value) {
    if (typeof value !== 'string' || value !== value.trim() || /[\\\r\n\t]/.test(value)) return null;
    if (/^\/(?!\/)/.test(value) && !value.split('/').includes('..')) return value;
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
    } catch { return null; }
}

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function sourceLink(url, label) {
    const target = safeUrl(url);
    if (!target) return null;
    const link = el('a', 'rs-source-link', label);
    link.href = target;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
}

/** Mounting does not fetch. The parent calls open() only when showing the original.
 * Keep the instance while toggling Text / Original to preserve page, zoom and scroll.
 */
export function mountReaderSource(container, article) {
    if (!container || typeof container.replaceChildren !== 'function') throw new Error('Falta el contenedor del documento original.');
    mounted.get(container)?.destroy();
    let destroyed = false;
    let sequence = 0;
    let opened = false;
    let opening = null;
    let pageIndex = 0;
    let zoom = 100;
    let current = null;
    let remotePdf = null;
    const titleId = `reader-source-title-${++nextId}`;
    const articleId = article?.id;
    const articleText = article?.texto ?? article?.contenido ?? article?.text ?? '';
    const originalUrl = article?.url_original ?? article?.originalUrl;
    const shell = el('section', 'reader-source-view');
    shell.setAttribute('aria-labelledby', titleId);
    const header = el('header', 'rs-header');
    const heading = el('h3', '', 'Documento original');
    heading.id = titleId;
    header.append(el('p', 'rs-eyebrow', 'Cotejo documental'), heading);
    const status = el('p', 'rs-status', 'Abre el original para consultar las páginas vinculadas a este fragmento.');
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    const content = el('div', 'rs-content');
    shell.append(header, status, content);
    container.replaceChildren(shell);

    const isCurrent = token => !destroyed && token === sequence;
    const setStatus = message => { status.textContent = message; };

    function fallback(reason, error = false, result = null) {
        if (destroyed) return;
        content.replaceChildren();
        const box = el('div', 'rs-fallback');
        const message = reason === 'source-version-changed'
            ? 'La fuente oficial tiene una edición distinta de la cotejada. El resaltado se pausó hasta revisar su correspondencia. Puedes abrir el PDF oficial actualizado.'
            : reason === 'content-mismatch'
            ? 'El texto de este fragmento cambió desde el último cotejo. Consulta la fuente original para verificarlo.'
                : reason === 'verification-unavailable'
                    ? 'No se pudo comprobar que el texto corresponde a esta edición del documento. Consulta la fuente original para cotejarlo.'
                : error
                ? 'No se pudo cargar la vista del documento. Puedes volver a intentarlo o consultar su fuente.'
                : 'Este fragmento todavía no tiene páginas sincronizadas. Puedes consultar el documento en su fuente original.';
        box.append(el('p', '', message));
        const link = sourceLink(result?.originalUrl || originalUrl, 'Abrir fuente oficial ↗');
        if (link) box.append(link);
        else box.append(el('p', 'rs-muted', 'No hay un enlace de fuente disponible para este fragmento.'));
        if (error) {
            const retry = el('button', 'rs-button', 'Volver a intentar');
            retry.type = 'button';
            retry.addEventListener('click', () => requestPage(pageIndex));
            box.append(retry);
        }
        content.append(box);
        setStatus(error ? 'Vista del original no disponible.' : 'Sin sincronización de página para este fragmento.');
    }

    async function renderPage(result, token) {
        current = result;
        pageIndex = result.pageIndex;
        const page = result.page;
        const imageUrl = safeUrl(page?.imageUrl);
        const remote = result.source?.transport === 'remote-pdf';
        if (!remote && !imageUrl) { fallback(null, true, result); return; }
        content.replaceChildren();
        const toolbar = el('div', 'rs-toolbar');
        toolbar.setAttribute('aria-label', 'Controles de la página original');
        const pages = el('div', 'rs-pages');
        const previous = el('button', 'rs-icon-button', '←');
        previous.type = 'button'; previous.setAttribute('aria-label', 'Página vinculada anterior'); previous.disabled = pageIndex === 0;
        const next = el('button', 'rs-icon-button', '→');
        next.type = 'button'; next.setAttribute('aria-label', 'Página vinculada siguiente'); next.disabled = pageIndex >= result.pages.length - 1;
        const selectLabel = el('label', 'rs-page-label');
        selectLabel.append(el('span', 'rs-sr-only', 'Página del documento original'));
        const select = document.createElement('select');
        select.setAttribute('aria-label', 'Página del documento original');
        result.pages.forEach((linkedPage, index) => {
            const option = el('option', '', `Página ${linkedPage.number} del PDF`);
            option.value = String(index); option.selected = index === pageIndex; select.append(option);
        });
        selectLabel.append(select);
        const isArticle = article?.tipo_articulo === 'ordinario' || /^Artículo\s+\d/i.test(article?.articulo_label || '');
        const pageGroup = el('div', 'rs-page-group');
        pageGroup.append(el('p', 'rs-page-scope', `Páginas de este ${isArticle ? 'artículo' : 'fragmento'}`));
        if (result.pages.length === 1) {
            pages.append(el('span', 'rs-single-page', `Página única · ${page.number} del PDF`));
        } else {
            [...select.options].forEach((option, index) => {
                option.textContent = `${index + 1} de ${result.pages.length} · Página ${result.pages[index].number} del PDF`;
            });
            pages.append(previous, selectLabel, next);
        }
        pageGroup.append(pages);
        const zoomControls = el('div', 'rs-zoom-controls');
        const less = el('button', 'rs-icon-button', '−'); less.type = 'button'; less.setAttribute('aria-label', 'Reducir página original');
        const reset = el('button', 'rs-zoom-reset', `${zoom}%`); reset.type = 'button'; reset.setAttribute('aria-label', 'Ajustar página al ancho');
        const more = el('button', 'rs-icon-button', '+'); more.type = 'button'; more.setAttribute('aria-label', 'Ampliar página original');
        zoomControls.append(less, reset, more);
        toolbar.append(pageGroup, zoomControls);

        const viewport = el('div', 'rs-viewport');
        viewport.tabIndex = 0;
        viewport.setAttribute('role', 'region');
        viewport.setAttribute('aria-label', `Imagen de la página ${page.number} del PDF. Puedes desplazarte por la página ampliada.`);
        const figure = el('div', 'rs-page');
        figure.style.width = `${zoom}%`;
        figure.style.aspectRatio = `${page.width} / ${page.height}`;
        const image = el(remote ? 'canvas' : 'img', 'rs-page-image');
        image.alt = `Página ${page.number} del documento original. El texto accesible está en la vista Texto.`;
        if (remote) { image.setAttribute('role', 'img'); image.setAttribute('aria-label', image.alt); }
        image.width = page.width; image.height = page.height;
        image.decoding = 'async';
        const highlights = (result.highlights || []).filter(box => ['x', 'y', 'width', 'height'].every(key => Number.isFinite(box[key])) && box.width > 0 && box.height > 0 && box.x >= 0 && box.y >= 0 && box.x + box.width <= 100.1 && box.y + box.height <= 100.1);
        figure.append(image);
        for (const box of highlights) {
            const highlight = el('span', 'rs-highlight');
            highlight.setAttribute('aria-hidden', 'true');
            Object.assign(highlight.style, { left: `${box.x}%`, top: `${box.y}%`, width: `${box.width}%`, height: `${box.height}%` });
            figure.append(highlight);
        }
        viewport.append(figure);
        const footer = el('footer', 'rs-footer');
        footer.append(el('p', 'rs-caption', `Página ${page.number} del PDF · ${pageIndex + 1} de ${result.pages.length} páginas vinculadas${highlights.length ? ' · Fragmento resaltado' : ''}.`));
        const pdfLink = sourceLink(result.pdfUrl || result.source?.pdfUrl, 'Abrir PDF completo ↗');
        if (pdfLink) footer.append(pdfLink);
        footer.append(el('p', 'rs-muted', remote
            ? 'PDF consultado en la fuente oficial y verificado contra la edición cotejada. El resaltado orienta la lectura.'
            : 'Imagen de la página original. El resaltado orienta el cotejo; la fuente conserva el documento completo.'));
        content.append(toolbar, viewport, footer);
        if (result.source?.title) heading.textContent = result.source.title;

        const updateZoom = nextZoom => {
            const previousZoom = zoom;
            zoom = Math.max(75, Math.min(250, nextZoom));
            figure.style.width = `${zoom}%`;
            reset.textContent = `${zoom}%`;
            less.disabled = zoom === 75; more.disabled = zoom === 250;
            viewport.scrollTop *= zoom / previousZoom;
            viewport.scrollLeft *= zoom / previousZoom;
            setStatus(`Página ${page.number} del PDF. Ampliación ${zoom}%.`);
        };
        updateZoom(zoom);
        setStatus(remote ? `Consultando el PDF oficial · Página ${page.number}…` : `Cargando imagen de la página ${page.number} del PDF…`);
        less.addEventListener('click', () => updateZoom(zoom - 25));
        more.addEventListener('click', () => updateZoom(zoom + 25));
        reset.addEventListener('click', () => updateZoom(100));
        previous.addEventListener('click', () => requestPage(pageIndex - 1));
        next.addEventListener('click', () => requestPage(pageIndex + 1));
        select.addEventListener('change', () => requestPage(Number(select.value)));
        const loaded = () => {
            if (!isCurrent(token)) return;
            setStatus(`Página ${page.number} del PDF cargada${highlights.length ? '. Fragmento resaltado.' : '.'}`);
            if (highlights.length) {
                const top = Math.min(...highlights.map(box => box.y));
                // Layout dimensions stay stable while the parent dialog animates its scale.
                viewport.scrollTop = Math.max(0, figure.offsetTop + figure.offsetHeight * top / 100 - 24);
            }
        };
        if (remote) {
            figure.style.visibility = 'hidden';
            remotePdf ||= createRemotePdf(result.source);
            try {
                await remotePdf.render(image, page);
                if (!isCurrent(token)) return;
                figure.style.visibility = '';
                loaded();
            } catch (error) {
                if (isCurrent(token)) {
                    remotePdf.destroy(); remotePdf = null;
                    fallback(error.code, true, result);
                }
            }
            return;
        }
        image.addEventListener('load', loaded, { once: true });
        image.addEventListener('error', () => {
            if (!isCurrent(token)) return;
            const failure = el('div', 'rs-image-error');
            failure.append(el('p', '', 'La imagen de esta página no pudo cargarse. El PDF completo sigue disponible en su enlace.'));
            const retry = el('button', 'rs-button', 'Reintentar imagen'); retry.type = 'button'; retry.addEventListener('click', () => requestPage(pageIndex)); failure.append(retry);
            viewport.replaceChildren(failure);
            setStatus('No se pudo cargar la imagen de la página original.');
        }, { once: true });
        image.src = imageUrl;
    }

    async function requestPage(index) {
        const token = ++sequence;
        if (destroyed) return;
        remotePdf?.cancelRender();
        const target = Math.max(0, Number.isInteger(index) ? index : 0);
        const activeControl = content.contains(document.activeElement) ? document.activeElement.getAttribute('aria-label') : null;
        shell.setAttribute('aria-busy', 'true');
        setStatus('Buscando la página del documento original…');
        try {
            const result = await getReaderSource(articleId, { articleText, originalUrl, pageIndex: target });
            if (!isCurrent(token)) return;
            if (result.status !== 'mapped' || result.contentVerified !== true) {
                fallback(result.reason || 'verification-unavailable', result.reason === 'source-unavailable', result); return;
            }
            await renderPage(result, token);
            if (!isCurrent(token)) return;
            if (activeControl) {
                const matchingControl = [...content.querySelectorAll('[aria-label]')].find(control => control.getAttribute('aria-label') === activeControl && !control.disabled);
                (matchingControl || content.querySelector('select'))?.focus({ preventScroll: true });
            }
        } catch {
            if (isCurrent(token)) fallback(null, true, current);
        } finally { if (isCurrent(token)) shell.setAttribute('aria-busy', 'false'); }
    }

    const api = {
        open() {
            if (destroyed) return Promise.resolve();
            if (!opened) { opened = true; opening = requestPage(0); }
            return opening;
        },
        destroy() {
            if (destroyed) return;
            destroyed = true; sequence++;
            remotePdf?.destroy();
            if (mounted.get(container) === api) { mounted.delete(container); container.replaceChildren(); }
        },
    };
    mounted.set(container, api);
    return api;
}
