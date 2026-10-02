import { describe, it, expect, vi, afterEach } from 'vitest';
import { permitKind, permitsRoute, resolutionSortKey, annexUrl, permitPdfUrl, searchPermits } from '../src/lib/cne-api.js';

describe('permitKind', () => {
    it('reads sector and activity from the permit number', () => {
        expect(permitKind('CNE/E/1439/GEN/2015')).toMatchObject({ sector: { id: 'electricidad' }, activity: 'Generación' });
        expect(permitKind('E/124-A/PIE/98').sector.id).toBe('electricidad');
        expect(permitKind('CNE/PL/12345/EXP/ES/2016')).toMatchObject({ sector: { id: 'petroliferos' }, activity: 'Expendio' });
        expect(permitKind('CNE/LP/100/DIS/2020').sector.id).toBe('gaslp');
        expect(permitKind('CNE/G/22/LICUE/2018')).toMatchObject({ sector: { id: 'gasnatural' }, activity: 'Licuefacción' });
    });
    it('treats EXP as export for electricity', () => {
        expect(permitKind('CNE/E/5/EXP/2019').activity).toBe('Exportación');
    });
    it('returns no sector for unknown prefixes', () => {
        expect(permitKind('V/123/2020').sector).toBeNull();
    });
});

describe('permitsRoute', () => {
    it('parses the list and permit hashes', () => {
        expect(permitsRoute('#permisos')).toEqual({});
        expect(permitsRoute('#permiso=CNE%2FE%2F1439%2FGEN%2F2015')).toEqual({ permit: 'CNE/E/1439/GEN/2015' });
        expect(permitsRoute('#cronologia')).toBeNull();
    });
});

describe('resolutionSortKey', () => {
    it('orders by date, then by the year in the number', () => {
        expect(resolutionSortKey({ FechaResolucion: '12/05/2026' })).toBe('2026-05-12');
        expect(resolutionSortKey({ FechaResolucion: '', NumeroResolucion: 'RES/1/2015' })).toBe('2015-12-31~');
        expect(resolutionSortKey({})).toBe('9999');
    });
});

describe('links', () => {
    it('only links annexes with a public url', () => {
        expect(annexUrl({ Descripcion: 'x' })).toBeNull();
        expect(annexUrl({ UrlPublic: 'https://a.b/c.pdf' })).toBe('https://a.b/c.pdf');
        expect(annexUrl({ UrlPublic: 'abc' })).toBe('https://drive.cne.gob.mx/Drive/ObtenerHistoricoPermiso/abc');
    });
    it('embeds the permit id in the PDF token', () => {
        const id = new URL(permitPdfUrl(31120)).searchParams.get('id');
        expect(atob(id)).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-31120-[0-9a-f]{12}$/);
    });
});

describe('searchPermits', () => {
    afterEach(() => vi.unstubAllGlobals());
    it('sends column filters in the registry format', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ recordsFiltered: 3, data: [{ Numero: 'X' }] }) });
        vi.stubGlobal('fetch', fetchMock);
        const result = await searchPermits({ numero: ' E/1439 ', titular: 'pemex', start: 20, length: 10 });
        expect(result).toEqual({ total: 3, rows: [{ Numero: 'X' }] });
        const { parameters } = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(parameters.start).toBe(20);
        expect(parameters.length).toBe(10);
        expect(parameters.columns.find(c => c.data === 'Numero').search.value).toBe('E/1439');
        expect(parameters.columns.find(c => c.data === 'Persona').search.value).toBe('pemex');
        expect(parameters.columns.find(c => c.data === 'Estado').search.value).toBe('');
    });
});
