/**
 * Full-page reading of one article (#lectura-<id>), meant to live in its own browser tab
 * while the reader keeps navigating the app in another one.
 */
import { articleHtml } from '../lib/article-html.js';
import { collectionIcon } from '../lib/collection-icons.js';
import { getAcervoGroup, ACERVO_GROUPS } from '../lib/acervo-model.js';
import { pinButtonHtml } from './desk-view.js';
import '../styles/article-page.css';
import { LEGAL_NOTE } from './site-dialogs.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

export const articlePageHash = id => `#lectura-${encodeURIComponent(id)}`;
export function parseArticlePageHash(hash) {
    if (!String(hash || '').startsWith('#lectura-')) return null;
    try { return decodeURIComponent(hash.slice(9)); } catch { return null; }
}

/**
 * @param {HTMLElement} container
 * @param {{ item: object, law: object|null, sourceUrl?: string, onOpenLaw?: Function, onOpenInApp?: Function }} options
 */
export function renderArticlePage(container, { item, law, sourceUrl = '', onOpenLaw = () => {}, onOpenInApp = () => {} }) {
    const group = law ? getAcervoGroup(law) : 'otros';
    const groupLabel = ACERVO_GROUPS.find(g => g.id === group)?.label || 'Instrumento';
    const path = [item.titulo_nombre, item.capitulo_nombre].filter(Boolean).join(' · ');
    container.innerHTML = `<article class="ap-view" aria-labelledby="ap-title">
        <header class="ap-head" data-category="${group}">
            <p class="ap-eyebrow"><span class="ap-ico">${collectionIcon(group, 16)}</span>${esc(groupLabel)}${item.siglas_ley ? ` · ${esc(item.siglas_ley)}` : ''}</p>
            <h1 id="ap-title">${esc(item.articulo_label)}</h1>
            <p class="ap-law">${esc(item.ley_origen)}</p>
            ${path ? `<p class="ap-path">${esc(path)}</p>` : ''}
            <div class="ap-actions">
                ${pinButtonHtml(item.id)}
                ${law ? '<button type="button" class="ap-btn" data-ap-law>Ver la ley completa</button>' : ''}
                ${sourceUrl ? `<a class="ap-btn" href="${esc(sourceUrl)}" target="_blank" rel="noopener noreferrer">Fuente oficial ↗</a>` : ''}
                <button type="button" class="ap-btn" data-ap-print>Imprimir</button>
                <button type="button" class="ap-btn" data-ap-app>Abrir en el lector</button>
            </div>
        </header>
        <div class="ap-text">${articleHtml(item.texto)}</div>
        <p class="ap-note">${esc(LEGAL_NOTE)}</p>
    </article>`;
    document.title = `${item.articulo_label} · ${item.siglas_ley || item.ley_origen} · Buscador Jurídico`;
    const root = container.querySelector('.ap-view');
    root.addEventListener('click', event => {
        const target = event.target.closest('button');
        if (!target) return;
        if (target.matches('[data-ap-law]')) onOpenLaw(law);
        else if (target.matches('[data-ap-print]')) window.print();
        else if (target.matches('[data-ap-app]')) onOpenInApp(item.id);
    });
}
