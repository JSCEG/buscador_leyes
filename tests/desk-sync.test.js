import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = { rows: [], upserts: [], selectError: null, listeners: [] };
vi.mock('../src/lib/supabase.js', () => ({
    supabase: {
        from: () => ({
            select: () => ({ eq: () => ({ order: async () => ({ data: state.selectError ? null : state.rows, error: state.selectError }) }) }),
            upsert: async rows => { state.upserts.push(rows); return { error: null }; },
            delete: () => ({ eq: () => ({ in: async () => ({ error: null }) }) }),
        }),
    },
}));
vi.mock('../src/scripts/auth.js', () => ({
    getCurrentUser: () => state.user,
    onAuthChange: cb => { state.listeners.push(cb); cb(state.user); },
}));

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('desk sync', () => {
    beforeEach(() => {
        vi.resetModules();
        localStorage.clear();
        Object.assign(state, { rows: [], upserts: [], selectError: null, listeners: [], user: null });
    });

    it('stays local without a session and says so', async () => {
        const { initDeskSync } = await import('../src/scripts/desk-sync.js');
        const onStatus = vi.fn();
        initDeskSync({ onStatus });
        expect(onStatus).toHaveBeenLastCalledWith('local');
    });

    it('brings account desks in and uploads the local ones on sign-in', async () => {
        const store = await import('../src/lib/desk-store.js');
        store.pin('a');
        state.rows = [{ id: 'r1', nombre: 'Terralia', articulos: ['x'], updated_at: new Date().toISOString() }];
        const { initDeskSync } = await import('../src/scripts/desk-sync.js');
        const onStatus = vi.fn();
        initDeskSync({ onStatus });
        state.user = { id: 'u1' };
        state.listeners.forEach(cb => cb(state.user));
        await flush(); await flush();
        expect(store.getDesks().map(d => d.name)).toEqual(['Mi mesa', 'Terralia']);
        expect(state.upserts.at(-1).map(r => [r.nombre, r.articulos, r.user_id])).toEqual([['Mi mesa', ['a'], 'u1'], ['Terralia', ['x'], 'u1']]);
        expect(onStatus).toHaveBeenLastCalledWith('account');
    });

    it('keeps working locally when the account table is not available', async () => {
        state.user = { id: 'u1' };
        state.selectError = { code: '42P01' };
        const { initDeskSync } = await import('../src/scripts/desk-sync.js');
        const onStatus = vi.fn();
        initDeskSync({ onStatus });
        await flush();
        expect(onStatus).toHaveBeenLastCalledWith('unavailable');
        expect(state.upserts).toHaveLength(0);
    });
});
