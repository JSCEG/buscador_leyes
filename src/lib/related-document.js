// The reviewed fragment type is authoritative; a mention of a judgment in an
// ordinary article must never turn that article into a related document.
export function relatedDocumentLabel(article) {
    if (article?.tipo_articulo !== 'complementario') return null;
    const label = String(article.articulo_label || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Signatures, indexes and editorial notes belong to the current record;
    // their shared ingestion type does not make them separate documents.
    if (/^(?:firmas?\b|nota editorial\b|indice\b|referencia a otros articulos\b)/i.test(label)) return null;
    if (/^resolutivos\b.*\bSCJN\b/i.test(label)) return 'Resolutivos de la SCJN';
    if (/^sentencia\b.*\bSCJN\b/i.test(label)) return 'Sentencia de la SCJN';
    if (/^fe de erratas\b/i.test(label)) return 'Fe de erratas';
    return 'Documento complementario';
}
