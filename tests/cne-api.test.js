import { describe, it, expect, vi, afterEach } from 'vitest';
import { permitKind, permitsRoute, resolutionSortKey, annexUrl, permitPdfUrl, resolutionPdfUrl, searchPermits, permitPinId, permitFromPinId, fetchPermit, permitsHash, parseFoundation, permitNumbersIn, resolutionsQueryUrl, searchResolutions } from '../src/lib/cne-api.js';

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
        expect(permitsRoute('#permisos')).toEqual({ tab: 'permisos' });
        expect(permitsRoute('#permiso=CNE%2FE%2F1439%2FGEN%2F2015')).toEqual({ tab: 'permisos', permit: 'CNE/E/1439/GEN/2015' });
        expect(permitsRoute('#resoluciones')).toEqual({ tab: 'resoluciones' });
        expect(permitsRoute('#resolucion=CNE%2FRES%2F062%2F2026')).toEqual({ tab: 'resoluciones', resolution: 'CNE/RES/062/2026' });
        expect(permitsRoute('#panorama-cne')).toEqual({ tab: 'panorama' });
        expect(permitsRoute('#tramites')).toEqual({ tab: 'tramites' });
        expect(permitsRoute('#tramite=generacion')).toEqual({ tab: 'tramites', tramite: 'generacion' });
        expect(permitsRoute('#cronologia')).toBeNull();
    });
    it('builds the hash back', () => {
        for (const hash of ['#permisos', '#resoluciones', '#panorama-cne', '#tramites', '#tramite=gaslp', '#permiso=CNE%2FE%2F1439%2FGEN%2F2015', '#resolucion=CNE%2FRES%2F062%2F2026']) {
            expect(permitsHash(permitsRoute(hash))).toBe(hash);
        }
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
    it('links resolutions by their id', () => {
        const url = new URL(resolutionPdfUrl(30179));
        expect(url.pathname).toBe('/Drive/ObtenerResolucion/');
        expect(atob(url.searchParams.get('id'))).toMatch(/-30179-[0-9a-f]{12}$/);
        expect(resolutionPdfUrl(undefined)).toBeNull();
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

describe('permits on a desk', () => {
    afterEach(() => vi.unstubAllGlobals());
    it('round-trips the pin id', () => {
        expect(permitPinId('CNE/E/1439/GEN/2015')).toBe('cne:CNE/E/1439/GEN/2015');
        expect(permitFromPinId('cne:CNE/E/1439/GEN/2015')).toBe('CNE/E/1439/GEN/2015');
        expect(permitFromPinId('12345')).toBeNull();
    });
    it('finds the exact permit among partial matches', async () => {
        const rows = [{ Numero: 'CNE/E/1439/GEN/2015-A' }, { Numero: 'CNE/E/1439/GEN/2015' }];
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ recordsFiltered: 2, data: rows }) }));
        expect(await fetchPermit('cne/e/1439/gen/2015')).toEqual(rows[1]);
    });
});

describe('resolutions', () => {
    afterEach(() => vi.unstubAllGlobals());
    it('puts filters in the legacy DataTables columns', () => {
        const url = new URL(resolutionsQueryUrl({ numero: 'RES/062', fecha: '2026', texto: 'eólica', tipo: 'Otorgamiento', modalidad: 'Gas' }, { start: 40, length: 20 }));
        const data = Object.fromEntries(JSON.parse(url.searchParams.get('aoData')).map(item => [item.name, item.value]));
        expect(data.mDataProp_1).toBe('NumeroResolucion');
        expect(data.sSearch_1).toBe('RES/062');
        expect(data.sSearch_2).toBe('2026');
        expect(data.sSearch_3).toBe('eólica');
        expect(data.sSearch_4).toBe('Gas');
        expect(data.sSearch_5).toBe('Otorgamiento');
        expect(data.iDisplayStart).toBe(40);
        expect(data.sSortDir_0).toBe('desc');
    });
    it('reads totals and rows', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ iTotalDisplayRecords: 7, aaData: [{ NumeroResolucion: 'X' }] }) }));
        expect(await searchResolutions({ fecha: '2025' })).toEqual({ total: 7, rows: [{ NumeroResolucion: 'X' }] });
    });
    it('splits a foundation into instruments and article numbers', () => {
        const text = 'Con fundamento en lo previsto en los artículos 16 y 28 párrafo noveno de la Constitución Política de los Estados Unidos Mexicanos; 1, 3 fracción IV, 76, fracción II, inciso b), 87 y 166 de la Ley del Sector Hidrocarburos; 1, 6 y 85 del Reglamento de la Ley del Sector Hidrocarburos.';
        expect(parseFoundation(text)).toEqual([
            { law: 'Constitución Política de los Estados Unidos Mexicanos', articles: ['16', '28'] },
            { law: 'Ley del Sector Hidrocarburos', articles: ['1', '3', '76', '87', '166'] },
            { law: 'Reglamento de la Ley del Sector Hidrocarburos', articles: ['1', '6', '85'] },
        ]);
    });
    it('finds permit numbers in a proemio, not resolution numbers', () => {
        expect(permitNumbersIn('MODIFICACIÓN DEL PERMISO E/1439/AUT/2015 POR EL NÚMERO CNE/E/1439/GEN/2015; VER CNE/RES/062/2026'))
            .toEqual(['E/1439/AUT/2015', 'CNE/E/1439/GEN/2015']);
    });
});
