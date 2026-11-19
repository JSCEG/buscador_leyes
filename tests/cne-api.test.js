import { describe, it, expect, vi, afterEach } from 'vitest';
import { permitKind, permitsRoute, resolutionSortKey, annexUrl, permitPdfUrl, resolutionPdfUrl, searchPermits, permitPinId, permitFromPinId, fetchPermit, permitsHash, parseFoundation, permitNumbersIn, resolutionsQueryUrl, searchResolutions, fetchResolution, fetchResolutions, resolutionNumberVariants } from '../src/lib/cne-api.js';

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
        expect(permitsRoute('#mapa-permisos')).toEqual({ tab: 'mapa' });
        expect(permitsRoute('#mapa-permisos?permiso=CNE%2FE%2F1439%2FGEN%2F2015')).toEqual({ tab: 'mapa', mapPermit: 'CNE/E/1439/GEN/2015' });
        expect(permitsRoute('#mapa-permisos?x=1')).toEqual({ tab: 'mapa' });
        expect(permitsRoute('#resoluciones?fecha=2025&tipo=Otorgamiento&x=1')).toEqual({ tab: 'resoluciones', filters: { fecha: '2025', tipo: 'Otorgamiento' } });
        expect(permitsHash({ tab: 'resoluciones', filters: { fecha: '2025', modalidad: 'Gas natural' } })).toBe('#resoluciones?fecha=2025&modalidad=Gas+natural');
        expect(permitsRoute('#tramite=generacion')).toEqual({ tab: 'tramites', tramite: 'generacion' });
        expect(permitsRoute('#cronologia')).toBeNull();
    });
    it('builds the hash back', () => {
        for (const hash of ['#permisos', '#resoluciones', '#panorama-cne', '#tramites', '#mapa-permisos', '#mapa-permisos?permiso=CNE%2FE%2F1439%2FGEN%2F2015', '#tramite=gaslp', '#permiso=CNE%2FE%2F1439%2FGEN%2F2015', '#resolucion=CNE%2FRES%2F062%2F2026']) {
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

// Búsqueda por número de resolución (bug 2026-11-18): la CNE compara el número como texto literal y lo guarda a veces
// con ceros a la izquierda (RES/096/2021) y desde 2025 con «CNE/»; el número que trae el permiso suele ir sin ceros.
describe('resolution numbers', () => {
    afterEach(() => vi.unstubAllGlobals());

    // The number filter (sSearch_1) a request to the resolutions search carries.
    const numberFilter = url => JSON.parse(new URL(url).searchParams.get('aoData')).find(p => p.name === 'sSearch_1').value;
    // A registry that only answers the numbers in `rows` (by exact filter), like the CNE's literal substring search.
    const stubRegistry = rows => {
        const fetchMock = vi.fn(async url => {
            const found = rows[numberFilter(url)] || [];
            return { ok: true, json: async () => ({ iTotalDisplayRecords: found.length, aaData: found }) };
        });
        vi.stubGlobal('fetch', fetchMock);
        return fetchMock;
    };

    it('gives the canonical number and the zero-padded forms the CNE uses', () => {
        expect(resolutionNumberVariants('RES/96/2021')).toEqual(['RES/96/2021', 'RES/096/2021', 'RES/0096/2021']);
        expect(resolutionNumberVariants('RES/33/2012')).toEqual(['RES/33/2012', 'RES/033/2012', 'RES/0033/2012']);
        expect(resolutionNumberVariants('res-96-2021')).toEqual(['RES/96/2021', 'RES/096/2021', 'RES/0096/2021']);
    });
    it('normalizes «Núm.», spaces, dashes, the CNE prefix, extra zeros and two-digit years', () => {
        expect(resolutionNumberVariants('Núm. RES/2526/2024')).toEqual(['RES/2526/2024']);
        expect(resolutionNumberVariants('CNE / RES / 1135 / 2026')).toEqual(['RES/1135/2026']);
        expect(resolutionNumberVariants('cne-res-1135-2026')).toEqual(['RES/1135/2026']);
        expect(resolutionNumberVariants('RES/02526/2024')).toEqual(['RES/2526/2024']);
        expect(resolutionNumberVariants('RES/2526/24')).toEqual(['RES/2526/2024']);
        expect(resolutionNumberVariants('RES/12/98')).toEqual(['RES/12/1998', 'RES/012/1998', 'RES/0012/1998']);
    });
    it('leaves a partial number or free text as it is, trimmed', () => {
        expect(resolutionNumberVariants('RES/062')).toEqual(['RES/062']);
        expect(resolutionNumberVariants('  texto libre ')).toEqual(['texto libre']);
    });
    it('retries the search with the zero-padded forms when the exact number finds nothing', async () => {
        const fetchMock = stubRegistry({ 'RES/096/2021': [{ NumeroResolucion: 'RES/096/2021' }] });
        const result = await searchResolutions({ numero: 'RES/96/2021' }, { length: 10 });
        expect(result).toEqual({ total: 1, rows: [{ NumeroResolucion: 'RES/096/2021' }] });
        expect(fetchMock.mock.calls.map(([url]) => numberFilter(url))).toEqual(['RES/96/2021', 'RES/096/2021']);
    });
    it('opens the resolution the CNE stores with zeros from the number without them', async () => {
        stubRegistry({ 'RES/033/2012': [{ NumeroResolucion: 'RES/033/2012' }] });
        expect((await fetchResolution('RES/33/2012'))?.NumeroResolucion).toBe('RES/033/2012');
    });
    it('prefers the resolution whose CNE prefix matches the one written', async () => {
        const both = [{ NumeroResolucion: 'RES/045/2025' }, { NumeroResolucion: 'CNE/RES/045/2025' }];
        stubRegistry({ 'RES/045/2025': both });
        expect((await fetchResolution('CNE/RES/045/2025'))?.NumeroResolucion).toBe('CNE/RES/045/2025');
        expect((await fetchResolution('Núm. CNE/RES/45/2025'))?.NumeroResolucion).toBe('CNE/RES/045/2025');
        expect((await fetchResolution('RES/045/2025'))?.NumeroResolucion).toBe('RES/045/2025');
        expect(await fetchResolution('RES/046/2025')).toBeNull();
    });
    // The CNE search indexes new resolutions late (on 2026-11-18 it reached CNE/RES/1317/2026) while the permit's
    // file already lists them: «Detalle y fundamento» must open them with what the file gave.
    it('opens a resolution the search has not indexed yet with the data of a permit file already loaded', async () => {
        vi.stubGlobal('fetch', vi.fn(async url => ({
            ok: true,
            json: async () => (String(url).includes('resolucionId=81785')
                ? [{ Acta: 'ACT/031/2026', ExpedienteId: 81785, FechaResolucion: '12/11/2026', TipoResolucion: 'Modificación de permiso', Modalidad: 'Energía eléctrica', NumeroResolucion: 'CNE/RES/1324/2026', REsolucionId: 30411 }]
                : { iTotalDisplayRecords: 0, aaData: [] }),
        })));
        expect(await fetchResolution('CNE/RES/1324/2026')).toBeNull();
        await fetchResolutions(81785);
        expect(await fetchResolution('CNE/RES/1324/2026')).toEqual({
            NumeroResolucion: 'CNE/RES/1324/2026', ResolucionId: 30411, FechaResolucion: '12/11/2026', NumeroActa: 'ACT/031/2026',
            ModalidadResolucion: 'Energía eléctrica', TipoResolucion: 'Modificación de permiso', desdeExpediente: true,
        });
    });
});
