import { officialUrl } from './official-url.js';

// An explicit publication header in a reviewed results sheet identifies its own
// source and date. Ordinary links and dates in legal text are just citations.
export function resultPublication(type, html) {
    if (type !== 'complementario' || !html?.startsWith('<p data-publicacion="resultados">')) return null;
    const template = document.createElement('template');
    template.innerHTML = html.slice(0, html.indexOf('</p>') + 4);
    const header = template.content.firstElementChild;
    const date = header?.querySelector('time')?.getAttribute('datetime');
    const link = header?.querySelector('a[href]');
    const source = officialUrl(link?.getAttribute('href'));
    const publisher = link?.textContent.trim();
    if (!source || !publisher || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const parsed = new Date(date + 'T00:00:00Z');
    if (!Number.isFinite(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== date) return null;
    return { date, source, publisher };
}

// The reviewed fragment type is authoritative; a mention of a judgment in an
// ordinary article must never turn that article into a related document.
export function relatedDocumentLabel(article) {
    if (article?.tipo_articulo !== 'complementario') return null;
    const label = String(article.articulo_label || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Signatures, indexes and editorial notes belong to the current record;
    // their shared ingestion type does not make them separate documents.
    if (/^(?:firmas?\b|(?:nota editorial|guia)\b|indice\b|referencia a otros articulos\b)/i.test(label)) return null;
    if (/^resolutivos\b.*\bSCJN\b/i.test(label)) return 'Resolutivos de la SCJN';
    if (/^sentencia\b.*\bSCJN\b/i.test(label)) return 'Sentencia de la SCJN';
    if (/^fe de erratas\b/i.test(label)) return 'Fe de erratas';
    return 'Documento complementario';
}
