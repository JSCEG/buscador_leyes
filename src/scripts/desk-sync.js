/**
 * Keeps the reader's desks in their account while they are signed in (table user_mesas).
 * Without a session, or if the table is not available yet, desks stay in this browser.
 */
import { supabase } from '../lib/supabase.js';
import { getCurrentUser, onAuthChange } from './auth.js';
import { exportDesks, markSynced, mergeRemoteDesks, onDeskChange } from '../lib/desk-store.js';

const TABLE = 'user_mesas';
const DEBOUNCE = 800;

/**
 * @param {{ onStatus?: (status: 'local'|'syncing'|'account'|'unavailable') => void }} options
 */
export function initDeskSync({ onStatus = () => {} } = {}) {
    let enabled = false;
    let timer = null;
    const deleted = new Set();

    async function pull(user) {
        onStatus('syncing');
        const { data, error } = await supabase
            .from(TABLE)
            .select('id, nombre, articulos, updated_at')
            .eq('user_id', user.id)
            .order('orden', { ascending: true });
        if (error) {
            // Table not created yet or no access: keep working locally.
            enabled = false;
            onStatus('unavailable');
            return;
        }
        mergeRemoteDesks((data || []).map(row => ({ id: row.id, name: row.nombre, ids: row.articulos, updated: row.updated_at })));
        enabled = true;
        await push();
    }

    async function push() {
        const user = getCurrentUser();
        if (!enabled || !user) return;
        onStatus('syncing');
        const { desks } = exportDesks();
        const rows = desks.map((desk, index) => ({
            id: desk.id, user_id: user.id, nombre: desk.name, articulos: desk.ids, orden: index, updated_at: desk.updated,
        }));
        const { error } = await supabase.from(TABLE).upsert(rows);
        if (!error && deleted.size) {
            const ids = [...deleted];
            const { error: delError } = await supabase.from(TABLE).delete().eq('user_id', user.id).in('id', ids);
            if (!delError) ids.forEach(id => deleted.delete(id));
        }
        if (error) { onStatus('unavailable'); return; }
        markSynced(desks.map(desk => desk.id));
        onStatus('account');
    }

    onDeskChange(detail => {
        if (detail.reason === 'synced') return;
        if (detail.reason === 'deleted' && detail.deskId) deleted.add(detail.deskId);
        if (!enabled) return;
        clearTimeout(timer);
        timer = setTimeout(push, DEBOUNCE);
    });

    onAuthChange(user => {
        clearTimeout(timer);
        if (!user) { enabled = false; onStatus('local'); return; }
        pull(user).catch(() => { enabled = false; onStatus('unavailable'); });
    });
}
