// Permisos CNE sobre Azure: /api/permisos/* primero, /api/mapa/* de respaldo, y nunca la CNE en vivo.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buscarPermisos, buscarPermisosMapa, ligasPermiso, ligasDePermiso, ligasDeMuchos, numeroNorm, desdeBuscar, permisoPorNumero } from '../src/lib/permisos-mapa.js';

const json = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

/** Stubs fetch with [regex, body | (url) => response] routes; unknown routes answer 404. Returns the list of URLs asked. */
function stubRoutes(routes) {
    const calls = [];
    vi.stubGlobal('fetch', vi.fn(async url => {
        calls.push(String(url));
        for (const [pattern, resp] of routes) if (pattern.test(url)) return typeof resp === 'function' ? resp(String(url)) : json(resp);
        return json({ code: 'no' }, 404);
    }));
    return calls;
}
const noCne = calls => calls.every(u => u.startsWith('/api/permisos/') || u.startsWith('/api/mapa/'));

const BUSCAR = { total: 3, resultados: [
    { tipo: 'electricidad', numeroPermiso: 'E/2334/GEN/2024', nombre: 'Solar Uno', entidad: 'SONORA', municipio: 'Caborca', tipoPermiso: 'Generación', estatus: 'Operando', latitud: 30.7, longitud: -112.1, vigente: true },
    { tipo: 'electricidad', numeroPermiso: 'E/921/AUT/2012', nombre: 'ABB México', estatus: 'Terminado', latitud: null, longitud: null, vigente: false },
    { tipo: 'gas-lp', numeroPermiso: 'G/018/LPA/2010', nombre: 'Pemex Logística', vigente: true, latitud: 32.3, longitud: -117 },
] };

afterEach(() => vi.unstubAllGlobals());

describe('numeroNorm', () => {
    it('uppercases, drops «CNE/» and leading zeros of each segment', () => {
        expect(numeroNorm('cne/E/0901/GEN/2026')).toBe('E/901/GEN/2026');
    });
});

describe('buscarPermisos', () => {
    it('asks /api/permisos/permisos first, only CNE', async () => {
        const calls = stubRoutes([[/\/api\/permisos\/permisos/, { total: 1, data: [{ tabla: 'electricidad', numero: 'E/1/GEN/2020', razonSocial: 'X' }] }]]);
        const r = await buscarPermisos({ titular: 'pemex', tabla: 'electricidad', estatus: 'Vigente', start: 20, pageSize: 20 });
        expect(r).toEqual({ total: 1, rows: [{ tabla: 'electricidad', numero: 'E/1/GEN/2020', razonSocial: 'X' }] });
        const q = new URL(calls[0], 'https://x').searchParams;
        expect(Object.fromEntries(q)).toEqual({ autoridad: 'CNE', page: '2', pageSize: '20', tabla: 'electricidad', estatus: 'Vigente', q: 'pemex' });
        expect(noCne(calls)).toBe(true);
    });
    it('falls back to /api/mapa when /api/permisos fails, but not on 401', async () => {
        let calls = stubRoutes([[/\/api\/permisos\//, () => json({}, 503)], [/\/api\/mapa\/buscar/, BUSCAR]]);
        const r = await buscarPermisos({ titular: 'so', tabla: 'electricidad' });
        expect(r.rows.map(f => f.numero)).toEqual(['E/2334/GEN/2024']);
        expect(calls.some(u => u.startsWith('/api/mapa/buscar'))).toBe(true);
        expect(noCne(calls)).toBe(true);
        calls = stubRoutes([[/\/api\/permisos\//, () => json({}, 401)], [/\/api\/mapa\/buscar/, BUSCAR]]);
        await expect(buscarPermisos({ titular: 'so' })).rejects.toMatchObject({ status: 401 });
        expect(calls.some(u => u.startsWith('/api/mapa/'))).toBe(false);
    });
    it('without text lists the permits of the current year, highest number first, paged', async () => {
        const anio = new Date().getFullYear();
        const filas = [
            { tipo: 'gas-lp', numeroPermiso: `CNE/LP/596/EXP/ES/${anio}`, nombre: 'B', vigente: true },
            { tipo: 'electricidad', numeroPermiso: `CNE/E/1001/GEN/${anio}`, nombre: 'A', vigente: true },
            { tipo: 'petroliferos', numeroPermiso: 'PL/9999/EXP/ES/2019', nombre: 'Viejo', vigente: true },
            { tipo: 'gas-lp', numeroPermiso: `CNE/LP/856/EXP/ES/${anio}`, nombre: 'C', vigente: false },
        ];
        const calls = stubRoutes([[/\/api\/mapa\/buscar/, { total: filas.length, resultados: filas }]]);
        const r = await buscarPermisos({ pageSize: 2 });
        expect(r.recientes).toBe(anio);
        expect(r.total).toBe(3);
        expect(r.rows.map(f => f.numero)).toEqual([`CNE/E/1001/GEN/${anio}`, `CNE/LP/856/EXP/ES/${anio}`]);
        expect(decodeURIComponent(calls[0])).toContain(`q=/${anio}&limite=500`);
        expect((await buscarPermisos({ start: 2, pageSize: 2 })).rows.map(f => f.numero)).toEqual([`CNE/LP/596/EXP/ES/${anio}`]);
        expect((await buscarPermisos({ tabla: 'gas-lp', estatus: 'Vigente' })).rows.map(f => f.numero)).toEqual([`CNE/LP/596/EXP/ES/${anio}`]);
        expect(noCne(calls)).toBe(true);
    });
    it('opens one permit by its number, ignoring «CNE/» and zeros', async () => {
        stubRoutes([[/\/api\/permisos\/permisos/, { total: 2, data: [{ numero: 'CNE/E/1439/GEN/2015-A' }, { numero: 'CNE/E/1439/GEN/2015', numeroNorm: 'E/1439/GEN/2015' }] }]]);
        expect((await permisoPorNumero('E/01439/GEN/2015')).numero).toBe('CNE/E/1439/GEN/2015');
    });
});

describe('buscarPermisosMapa', () => {
    it('filters /api/mapa/buscar by activity and status, never filling missing fields', async () => {
        stubRoutes([[/\/api\/mapa\/buscar/, BUSCAR]]);
        const e = await buscarPermisosMapa({ titular: 'so', tabla: 'electricidad' });
        expect(e.total).toBe(1);
        expect(e.rows[0]).toMatchObject({ numero: 'E/2334/GEN/2024', coordenadasValidas: true, mercado: 'Electricidad', entidad: 'SONORA' });
        const sinPunto = (await buscarPermisosMapa({ numero: 'E/921' })).rows[0];
        expect(sinPunto.estatus).toBe('No vigente');
        expect(sinPunto.coordenadasValidas).toBe(false);
        const f = desdeBuscar({ numeroPermiso: 'E/1/GEN/2020' });
        expect(f.razonSocial).toBeNull();
        expect(f.entidad).toBeNull();
    });
    it('reads the list tables (supply, transport…) whole and filters by text; text in place of a URL is no link', async () => {
        stubRoutes([[/cne-lista\?tabla=suministro/, { filas: [
            { id: 14, numeroPermiso: 'CNE/E/51/SC/2026', numeroPermisoNorm: 'E/51/SC/2026', razonSocial: 'MEXIENERGI SA DE CV', estatus: 'Vigente', ligaPermiso: 'https://drive.cne.gob.mx/Drive/ObtenerPermiso/?id=x' },
            { id: 15, numeroPermiso: 'CNE/E/52/SC/2026', razonSocial: 'Otra', estatus: 'Vigente', ligaPermiso: 'Ver permiso (PDF)' },
        ] }]]);
        const r = await buscarPermisosMapa({ tabla: 'suministro', titular: 'mexi' });
        expect(r.total).toBe(1);
        expect(r.rows[0].ligaPermiso).toBe('https://drive.cne.gob.mx/Drive/ObtenerPermiso/?id=x');
        expect((await buscarPermisosMapa({ tabla: 'suministro', numero: 'E/52/SC' })).rows[0].ligaPermiso).toBeNull();
    });
});

describe('ligas', () => {
    it('ligasPermiso: title, main resolution and resolutions with number; https only', async () => {
        const calls = stubRoutes([[/\/api\/mapa\/ligas/, {
            encontrado: true, ligaPermiso: 'https://drive.cne.gob.mx/Drive/ObtenerPermiso/?id=a', ligaResolucion: 'http://x',
            resoluciones: [{ numero: 'CNE/RES/062/2026', liga: 'https://drive.cne.gob.mx/Drive/ObtenerResolucion/?id=b' }, { numero: 'x', liga: null }],
        }]]);
        const l = await ligasPermiso('E/1439/GEN/2015');
        expect(l.ligaPermiso).toBe('https://drive.cne.gob.mx/Drive/ObtenerPermiso/?id=a');
        expect(l.ligaResolucion).toBeNull();
        expect(l.resoluciones).toEqual([{ numero: 'CNE/RES/062/2026', liga: 'https://drive.cne.gob.mx/Drive/ObtenerResolucion/?id=b' }]);
        expect(calls[0]).toBe('/api/mapa/ligas?numero=E%2F1439%2FGEN%2F2015');
    });
    it('ligasDePermiso: /api/permisos/ligas pairs each resolution with its number', async () => {
        const calls = stubRoutes([[/\/api\/permisos\/ligas/, { total: 1, data: [{
            numeroPermiso: 'E/1439/GEN/2015', ligaPermiso: 'https://d/p', ligaResolucion: null,
            ligasResoluciones: 'https://d/r1;https://d/r2', numerosResolucion: 'RES/003/1994;RES/007/1996',
        }] }]]);
        const l = await ligasDePermiso('E/1439/GEN/2015');
        expect(l).toEqual({ encontrado: true, ligaPermiso: 'https://d/p', ligaResolucion: null, resoluciones: [{ numero: 'RES/003/1994', liga: 'https://d/r1' }, { numero: 'RES/007/1996', liga: 'https://d/r2' }] });
        expect(calls).toHaveLength(1);
    });
    it('ligasDePermiso: falls back to /api/mapa/ligas when /api/permisos fails', async () => {
        const calls = stubRoutes([[/\/api\/permisos\/ligas/, () => json({}, 503)], [/\/api\/mapa\/ligas/, { encontrado: true, ligaPermiso: 'https://d/p', resoluciones: [] }]]);
        expect((await ligasDePermiso('E/1/GEN/2020')).ligaPermiso).toBe('https://d/p');
        expect(noCne(calls)).toBe(true);
    });
    it('ligasDeMuchos: limited concurrency, progress, skips single failures; throws when all fail', async () => {
        let activos = 0, max = 0;
        stubRoutes([[/\/api\/mapa\/ligas/, async url => {
            activos++; max = Math.max(max, activos);
            await new Promise(r => setTimeout(r, 2));
            activos--;
            const n = decodeURIComponent(url.split('numero=')[1]);
            if (n === 'E/3/GEN/2020') return json({}, 500);
            return json({ encontrado: n !== 'E/2/GEN/2020', ligaPermiso: n === 'E/2/GEN/2020' ? null : `https://d/${n}` });
        }]]);
        const avance = [];
        const numeros = ['E/1/GEN/2020', 'E/2/GEN/2020', 'E/3/GEN/2020', ...Array.from({ length: 10 }, (_, i) => `E/${10 + i}/GEN/2021`), 'E/1/GEN/2020'];
        const filas = await ligasDeMuchos(numeros, { concurrencia: 4, onAvance: (h, t) => avance.push([h, t]) });
        expect(max).toBeLessThanOrEqual(4);
        expect(avance.at(-1)[0]).toBe(13);
        expect(filas).toHaveLength(11);
        stubRoutes([[/\/api\/mapa\/ligas/, () => json({}, 503)]]);
        await expect(ligasDeMuchos(['E/1/GEN/2020', 'E/2/GEN/2020'])).rejects.toMatchObject({ status: 503 });
    });
});
