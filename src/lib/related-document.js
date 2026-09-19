// The reviewed fragment type is authoritative; a mention of a judgment in an
// ordinary article must never turn that article into a related document.
export function relatedDocumentLabel(article) {
    if (article?.tipo_articulo !== 'complementario') return null;
    const label = String(article.articulo_label || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/^resolutivos\b.*\bSCJN\b/i.test(label)) return 'Resolutivos de la SCJN';
    if (/^sentencia\b.*\bSCJN\b/i.test(label)) return 'Sentencia de la SCJN';
    if (/^firmas y promulgacion\b/i.test(label)) return 'Promulgación del decreto';
    return 'Documento complementario';
}
