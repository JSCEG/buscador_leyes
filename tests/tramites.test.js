import { describe, it, expect } from 'vitest';
import { TRAMITES, tramiteById, tramitesForLaw, tramiteForPermit, tramiteForResolution } from '../src/data/tramites.js';

describe('tramites catalogue', () => {
    it('has unique ids and the fields the guide reads', () => {
        expect(new Set(TRAMITES.map(t => t.id)).size).toBe(TRAMITES.length);
        for (const t of TRAMITES) {
            expect(t.title).toBeTruthy();
            for (const key of ['base', 'rules', 'forms', 'calls']) expect(Array.isArray(t[key])).toBe(true);
            expect(t.articles.query.length).toBeGreaterThanOrEqual(3);
            expect(t.articles.in.length).toBeGreaterThan(0);
        }
    });
    it('finds a guide by id', () => {
        expect(tramiteById('generacion').title).toMatch(/generación/);
        expect(tramiteById('nada')).toBeNull();
    });
});

describe('links to guides', () => {
    it('lists the guides that cite an instrument', () => {
        expect(tramitesForLaw('LSE').map(t => t.id)).toContain('generacion');
        expect(tramitesForLaw('rlsh').map(t => t.id)).toEqual(['petroliferos', 'gaslp', 'gasnatural']);
        expect(tramitesForLaw('XYZ')).toEqual([]);
    });
    it('maps a permit number to its guide', () => {
        expect(tramiteForPermit('CNE/E/1439/GEN/2015').id).toBe('generacion');
        expect(tramiteForPermit('E/79/AUT/98').id).toBe('migracion');
        expect(tramiteForPermit('E/123/COG/2010').id).toBe('cogeneracion');
        expect(tramiteForPermit('CNE/PL/911/TRA/OM/2026').id).toBe('petroliferos');
        expect(tramiteForPermit('CNE/LP/5/DIS/2020').id).toBe('gaslp');
        expect(tramiteForPermit('G/22/LICUE/2018').id).toBe('gasnatural');
        expect(tramiteForPermit('V/1/2000')).toBeNull();
    });
    it('maps a resolution to its guide', () => {
        expect(tramiteForResolution({ ModalidadResolucion: 'Gas licuado de petróleo', Proemio: 'PERMISO DE EXPENDIO' }).id).toBe('gaslp');
        expect(tramiteForResolution({ ModalidadResolucion: 'Electricidad', Proemio: 'PERMISO PARA LA GENERACIÓN DE ENERGÍA ELÉCTRICA' }).id).toBe('generacion');
        expect(tramiteForResolution({ ModalidadResolucion: 'Otros', Proemio: 'ACUERDO DE SESIÓN' })).toBeNull();
    });
});
