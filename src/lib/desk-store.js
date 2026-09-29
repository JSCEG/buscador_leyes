/**
 * "Mesa de consulta": the articles a reader keeps open side by side while they keep navigating.
 * Only ids are stored (in this browser); the text is fetched when the desk is shown.
 */
export const DESK_LIMIT = 12;
export const SIDE_BY_SIDE_LIMIT = 3;
const STORAGE_KEY = 'mesa-consulta-v1';
const events = new EventTarget();

function read() {
    try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        return Array.isArray(raw) ? [...new Set(raw.filter(id => typeof id === 'string' && id))].slice(0, DESK_LIMIT) : [];
    } catch { return []; }
}

let ids = read();

function save(reason, id) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch { /* private mode: keep it in memory */ }
    events.dispatchEvent(new CustomEvent('change', { detail: { ids: [...ids], reason, id } }));
}

export const getDesk = () => [...ids];
export const isPinned = id => ids.includes(String(id));

/** Adds an article; returns { ok, reason } where reason is 'added', 'already' or 'full'. */
export function pin(id) {
    id = String(id || '');
    if (!id) return { ok: false, reason: 'invalid' };
    if (ids.includes(id)) return { ok: true, reason: 'already' };
    if (ids.length >= DESK_LIMIT) return { ok: false, reason: 'full' };
    ids.push(id);
    save('added', id);
    return { ok: true, reason: 'added' };
}

export function unpin(id) {
    id = String(id);
    if (!ids.includes(id)) return false;
    ids = ids.filter(x => x !== id);
    save('removed', id);
    return true;
}

export function togglePin(id) {
    return isPinned(id) ? { ok: unpin(id), reason: 'removed' } : pin(id);
}

/** Moves an article up (-1) or down (+1) in the desk. */
export function moveInDesk(id, delta) {
    const from = ids.indexOf(String(id));
    const to = from + delta;
    if (from < 0 || to < 0 || to >= ids.length) return false;
    const next = [...ids];
    [next[from], next[to]] = [next[to], next[from]];
    ids = next;
    save('moved', id);
    return true;
}

export function clearDesk() {
    if (!ids.length) return;
    ids = [];
    save('cleared');
}

/** Replaces the desk (a shared link); extra ids beyond the limit are dropped. */
export function setDesk(next) {
    ids = [...new Set((next || []).map(String).filter(Boolean))].slice(0, DESK_LIMIT);
    save('replaced');
    return getDesk();
}

export function onDeskChange(listener) {
    const handler = event => listener(event.detail);
    events.addEventListener('change', handler);
    return () => events.removeEventListener('change', handler);
}

/** '#mesa-id1,id2' shares a desk. */
export const deskHash = list => `#mesa-${list.map(encodeURIComponent).join(',')}`;
export function parseDeskHash(hash) {
    if (!String(hash || '').startsWith('#mesa-')) return null;
    return hash.slice(6).split(',').map(part => { try { return decodeURIComponent(part); } catch { return ''; } }).filter(Boolean);
}

/** For tests: reload from storage. */
export function reloadDesk() { ids = read(); }
