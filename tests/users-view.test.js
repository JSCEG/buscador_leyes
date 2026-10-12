import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/lib/supabase.js', () => ({ supabase: { rpc: vi.fn() } }));
const { relativeTime, summarizeUsers } = await import('../src/scripts/users-view.js');

const NOW = new Date('2026-10-12T12:00:00Z').getTime();
const ago = ms => new Date(NOW - ms).toISOString();
const DAY = 86400000;

describe('users panel', () => {
    it('says how long ago someone was here', () => {
        expect(relativeTime(null, NOW)).toBe('Nunca');
        expect(relativeTime(ago(20 * 1000), NOW)).toBe('Ahora');
        expect(relativeTime(ago(5 * 60000), NOW)).toBe('Hace 5 min');
        expect(relativeTime(ago(3 * 3600000), NOW)).toBe('Hace 3 h');
        expect(relativeTime(ago(DAY + 3600000), NOW)).toBe('Ayer');
        expect(relativeTime(ago(12 * DAY), NOW)).toBe('Hace 12 días');
        expect(relativeTime(ago(65 * DAY), NOW)).toBe('Hace 2 meses');
        expect(relativeTime(ago(400 * DAY), NOW)).toBe('Hace 1 año');
    });
    it('counts registered, confirmed and active users', () => {
        const rows = [
            { confirmado: ago(90 * DAY), ultima_actividad: ago(2 * DAY) },
            { confirmado: ago(90 * DAY), ultima_actividad: ago(20 * DAY) },
            { confirmado: null, ultima_actividad: null },
        ];
        expect(summarizeUsers(rows, NOW)).toEqual({ total: 3, confirmados: 2, activos7: 1, activos30: 2 });
    });
});
