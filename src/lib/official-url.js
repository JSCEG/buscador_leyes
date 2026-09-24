/**
 * A safe, working link to an official source. Accepts only absolute http(s) URLs without
 * credentials. The DOF certificate covers dof.gob.mx but not www.dof.gob.mx, so browsers warn
 * on the www host; links are moved to the covered host and the search widget hash is dropped.
 */
export function officialUrl(value) {
    if (typeof value !== 'string' || !value.trim() || /[\r\n\t]/.test(value)) return '';
    let url;
    try { url = new URL(value.trim()); } catch { return ''; }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return '';
    if (/^(www\.)?dof\.gob\.mx$/i.test(url.hostname)) {
        url.protocol = 'https:';
        url.hostname = 'dof.gob.mx';
        if (/^#?gsc\.tab=\d*$/i.test(url.hash)) url.hash = '';
    }
    return url.href;
}
