import { describe, expect, it, vi } from 'vitest';
import { noResultsHint, resolutionSourceNote } from '../src/scripts/resolutions-view.js';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));

// The CNE search indexes new resolutions late (on 2026-11-18 it reached CNE/RES/1317/2026); the permit's file
// already lists them, so the detail can be built from the file, and an empty search by number explains why.
describe('resolutions the CNE search has not indexed yet', () => {
    it('warns that a detail built from the permit file lacks the proemio and foundation', () => {
        const note = resolutionSourceNote({ NumeroResolucion: 'CNE/RES/1324/2026', desdeExpediente: true });
        expect(note).toContain('class="pm-note"');
        expect(note).toContain('aún no la publica en su buscador');
        expect(note).toContain('expediente del permiso');
        expect(resolutionSourceNote({ NumeroResolucion: 'CNE/RES/1317/2026' })).toBe('');
    });
    it('explains an empty search by number may be a recent resolution', () => {
        expect(noResultsHint('CNE/RES/1324/2026')).toContain('aún no la publique en su buscador');
        expect(noResultsHint('CNE/RES/1324/2026')).toContain('Detalle y fundamento');
        expect(noResultsHint('')).toBe('Prueba con menos filtros o con una parte del texto.');
    });
});
