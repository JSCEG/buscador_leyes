import { describe, it, expect, vi } from 'vitest';

vi.mock('../src/lib/supabase.js', () => ({ supabase: { rpc: vi.fn(() => Promise.resolve({ data: null, error: null })) } }));
const { searchTerm } = await import('../src/lib/usage.js');

describe('«Lo más buscado» search terms', () => {
    it('stores the term in lower case with single spaces', () => {
        expect(searchTerm('  Generación   DISTRIBUIDA ')).toBe('generación distribuida');
        expect(searchTerm('LSE: artículo 12')).toBe('lse: artículo 12');
    });

    it('never sends what looks like personal data, nor empty or overlong terms', () => {
        expect(searchTerm('persona@correo.mx')).toBeNull();
        expect(searchTerm('5512345678')).toBeNull();
        expect(searchTerm('curp 1234567')).toBeNull();
        expect(searchTerm('a')).toBeNull();
        expect(searchTerm('x'.repeat(81))).toBeNull();
        expect(searchTerm('')).toBeNull();
    });
});
