/**
 * "Mesas de consulta": named sets of articles a reader keeps at hand while navigating.
 * One desk is active; pin buttons add to it. Desks live in this browser and, when the
 * reader signs in, are synchronized with their account (see desk-sync.js).
 */
export const DESK_LIMIT = 24;
export const DESKS_LIMIT = 20;
export const SIDE_BY_SIDE_LIMIT = 3;
const STORAGE_KEY = 'mesas-consulta-v2';
const LEGACY_KEY = 'mesa-consulta-v1';
const events = new EventTarget();

const newId = () => (globalThis.crypto?.randomUUID?.() || `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
const now = () => new Date().toISOString();
const cleanIds = list => [...new Set((list || []).map(String).filter(Boolean))].slice(0, DESK_LIMIT);
const cleanName = name => String(name || '').replace(/\s+/g, ' ').trim().slice(0, 80);

function blankDesk(name = 'Mi mesa', ids = []) {
    return { id: newId(), name: cleanName(name) || 'Mi mesa', ids: cleanIds(ids), updated: now() };
}

function read() {
    try {
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (raw && Array.isArray(raw.desks) && raw.desks.length) {
            const desks = raw.desks.filter(d => d && d.id).slice(0, DESKS_LIMIT)
                .map(d => ({ id: String(d.id), name: cleanName(d.name) || 'Mesa', ids: cleanIds(d.ids), updated: d.updated || now() }));
            const active = desks.some(d => d.id === raw.active) ? raw.active : desks[0].id;
            return { active, desks, synced: Array.isArray(raw.synced) ? raw.synced.map(String) : [] };
        }
        // First run after the single-desk version: keep its articles in "Mi mesa".
        const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]');
        const desk = blankDesk('Mi mesa', Array.isArray(legacy) ? legacy : []);
        return { active: desk.id, desks: [desk], synced: [] };
    } catch {
        const desk = blankDesk();
        return { active: desk.id, desks: [desk], synced: [] };
    }
}

let state = read();

function save(reason, detail = {}) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* private mode: keep it in memory */ }
    events.dispatchEvent(new CustomEvent('change', { detail: { reason, ...detail, active: state.active } }));
}

const findDesk = id => state.desks.find(d => d.id === id);
const activeDesk = () => findDesk(state.active) || state.desks[0];
const touch = desk => { desk.updated = now(); };

// ── Desks ───────────────────────────────────────────────────────────
export const getDesks = () => state.desks.map(d => ({ ...d, ids: [...d.ids] }));
export const getActiveDesk = () => { const d = activeDesk(); return { ...d, ids: [...d.ids] }; };

export function setActiveDesk(id) {
    if (!findDesk(id) || state.active === id) return false;
    state.active = id;
    save('switched', { deskId: id });
    return true;
}

export function createDesk(name, ids = []) {
    if (state.desks.length >= DESKS_LIMIT) return { ok: false, reason: 'full' };
    const desk = blankDesk(name || `Mesa ${state.desks.length + 1}`, ids);
    state.desks.push(desk);
    state.active = desk.id;
    save('created', { deskId: desk.id });
    return { ok: true, desk: { ...desk } };
}

export function renameDesk(id, name) {
    const desk = findDesk(id);
    const clean = cleanName(name);
    if (!desk || !clean || desk.name === clean) return false;
    desk.name = clean; touch(desk);
    save('renamed', { deskId: id });
    return true;
}

export function duplicateDesk(id) {
    const desk = findDesk(id);
    if (!desk) return { ok: false, reason: 'missing' };
    return createDesk(`${desk.name} (copia)`, desk.ids);
}

/** Deletes a desk; the last one is emptied instead so there is always an active desk. */
export function deleteDesk(id) {
    const desk = findDesk(id);
    if (!desk) return false;
    if (state.desks.length === 1) {
        desk.ids = []; touch(desk);
        save('cleared', { deskId: id });
        return true;
    }
    state.desks = state.desks.filter(d => d.id !== id);
    if (state.active === id) state.active = state.desks[0].id;
    save('deleted', { deskId: id });
    return true;
}

// ── Articles of the active desk ─────────────────────────────────────
export const getDesk = () => [...activeDesk().ids];
export const isPinned = id => activeDesk().ids.includes(String(id));

/** Adds an article; returns { ok, reason } where reason is 'added', 'already' or 'full'. */
export function pin(id, deskId = state.active) {
    id = String(id || '');
    const desk = findDesk(deskId);
    if (!id || !desk) return { ok: false, reason: 'invalid' };
    if (desk.ids.includes(id)) return { ok: true, reason: 'already' };
    if (desk.ids.length >= DESK_LIMIT) return { ok: false, reason: 'full' };
    desk.ids.push(id); touch(desk);
    save('added', { id, deskId });
    return { ok: true, reason: 'added' };
}

export function unpin(id, deskId = state.active) {
    id = String(id);
    const desk = findDesk(deskId);
    if (!desk?.ids.includes(id)) return false;
    desk.ids = desk.ids.filter(x => x !== id); touch(desk);
    save('removed', { id, deskId });
    return true;
}

export function togglePin(id) {
    return isPinned(id) ? { ok: unpin(id), reason: 'removed' } : pin(id);
}

/** Moves an article up (-1) or down (+1) in the active desk. */
export function moveInDesk(id, delta) {
    const desk = activeDesk();
    const from = desk.ids.indexOf(String(id));
    const to = from + delta;
    if (from < 0 || to < 0 || to >= desk.ids.length) return false;
    [desk.ids[from], desk.ids[to]] = [desk.ids[to], desk.ids[from]];
    touch(desk);
    save('moved', { id, deskId: desk.id });
    return true;
}

export function clearDesk() {
    const desk = activeDesk();
    if (!desk.ids.length) return;
    desk.ids = []; touch(desk);
    save('cleared', { deskId: desk.id });
}

/** Replaces the active desk's articles (tests, legacy links). */
export function setDesk(next) {
    const desk = activeDesk();
    desk.ids = cleanIds(next); touch(desk);
    save('replaced', { deskId: desk.id });
    return getDesk();
}

// ── Sync with an account ────────────────────────────────────────────
/** Remembers which desks exist in the account (after an upload). */
export function markSynced(ids) {
    state.synced = [...new Set(ids.map(String))];
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

/** Snapshot for the account copy. */
export const exportDesks = () => ({ active: state.active, desks: getDesks() });

/**
 * Merges desks from the account: the newer copy of each desk wins; desks only present here
 * are kept (the sync then uploads them). Returns the ids of local desks newer than remote.
 */
export function mergeRemoteDesks(remote) {
    const byId = new Map(state.desks.map(d => [d.id, d]));
    const newerHere = [];
    for (const r of remote || []) {
        const desk = { id: String(r.id), name: cleanName(r.name) || 'Mesa', ids: cleanIds(r.ids), updated: r.updated || now() };
        const local = byId.get(desk.id);
        if (!local || new Date(desk.updated) >= new Date(local.updated)) byId.set(desk.id, desk);
        else newerHere.push(local.id);
    }
    const remoteIds = new Set((remote || []).map(r => String(r.id)));
    // Desks that were in the account before and are gone now were deleted on another device.
    const synced = new Set(state.synced || []);
    for (const d of state.desks) {
        if (remoteIds.has(d.id)) continue;
        if (synced.has(d.id)) byId.delete(d.id); else newerHere.push(d.id);
    }
    // An empty untouched "Mi mesa" from this browser should not clutter an account that has desks.
    let desks = [...byId.values()];
    if (remote?.length) desks = desks.filter(d => remoteIds.has(d.id) || d.ids.length || d.name !== 'Mi mesa');
    state.desks = desks.slice(0, DESKS_LIMIT);
    if (!state.desks.length) state.desks = [blankDesk()];
    if (!findDesk(state.active)) state.active = state.desks[0].id;
    save('synced');
    return newerHere.filter(id => findDesk(id));
}

export function onDeskChange(listener) {
    const handler = event => listener(event.detail);
    events.addEventListener('change', handler);
    return () => events.removeEventListener('change', handler);
}

// ── Share links ─────────────────────────────────────────────────────
/** '#mesa-<nombre>:id1,id2' shares a desk; the older '#mesa-id1,id2' still opens. */
export const deskHash = (list, name = '') => `#mesa-${name ? `${encodeURIComponent(cleanName(name))}:` : ''}${list.map(encodeURIComponent).join(',')}`;
export function parseDeskHash(hash) {
    if (!String(hash || '').startsWith('#mesa-')) return null;
    let body = hash.slice(6);
    let name = '';
    const colon = body.indexOf(':');
    if (colon >= 0) { name = body.slice(0, colon); body = body.slice(colon + 1); }
    const decode = part => { try { return decodeURIComponent(part); } catch { return ''; } };
    return { name: cleanName(decode(name)), ids: body.split(',').map(decode).filter(Boolean) };
}

/** For tests: reload from storage. */
export function reloadDesk() { state = read(); }
