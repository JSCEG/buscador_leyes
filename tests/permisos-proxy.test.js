import { describe, it, expect } from 'vitest';
import { upstreamUrl, servePermisos } from '../server/permisos-proxy.js';
import { permitsRoute, permitsHash } from '../src/lib/cne-api.js';
import { marketLabel, statusLabel, stateLabel, updatesSummary, detailFields, recordLinks, localDate, getAllPages } from '../src/lib/permisos-api.js';

const BASE = 'https://api.example/api/v1';
const params = text => new URLSearchParams(text);

describe('permits API proxy', () => {
    it('forwards only whitelisted endpoints and valid params, in a stable order', () => {
        expect(upstreamUrl('puntos', params('tabla=pozos&autoridad=SENER'), BASE)).toBe(`${BASE}/puntos?autoridad=SENER&tabla=pozos`);
        expect(upstreamUrl('asignaciones-municipios', params('numero=A-0001'), BASE)).toBe(`${BASE}/asignaciones/municipios?numero=A-0001`);
        expect(upstreamUrl('catalogo', params(''), BASE)).toBe(`${BASE}/catalogo`);
        expect(upstreamUrl('puntos', params('tabla=electricidad&ligero=true&q=pemex'), BASE)).toBe(`${BASE}/puntos?ligero=true&q=pemex&tabla=electricidad`);
        expect(upstreamUrl('estados', params('mercado=Gas natural&estatus=Vigente'), BASE)).toContain('mercado=Gas+natural');
    });

    it('rejects unknown endpoints, keys, values, repeats and missing required params', () => {
        expect(upstreamUrl('admin', params(''), BASE)).toBeNull();
        expect(upstreamUrl('puntos', params('tabla=nope'), BASE)).toBeNull();
        expect(upstreamUrl('puntos', params('autoridad=CNE&autoridad=SENER'), BASE)).toBeNull();
        expect(upstreamUrl('puntos', params('pageSize=501'), BASE)).toBeNull();
        expect(upstreamUrl('puntos', params('mpo=001'), BASE)).toBeNull();
        expect(upstreamUrl('catalogo', params('x=1'), BASE)).toBeNull();
        expect(upstreamUrl('detalle', params('tabla=pozos'), BASE)).toBeNull();
        expect(upstreamUrl('ligas', params('tabla=ligas'), BASE)).toBeNull();
        expect(upstreamUrl('sin-ubicacion', params('ligero=true'), BASE)).toBeNull();
        expect(upstreamUrl('puntos', params('ligero=1'), BASE)).toBeNull();
        expect(upstreamUrl('permisos', params('q=a'), BASE)).toBeNull();
        expect(upstreamUrl('permisos', params('q=<script>'), BASE)).toBeNull();
    });

    it('sends the key upstream, never to the browser, and caches the answer', async () => {
        const seen = [];
        const fetcher = async (url, init) => { seen.push({ url, key: init.headers['X-Api-Key'] }); return new Response('{"total":1,"data":[]}', { status: 200 }); };
        const store = new Map();
        const cache = { match: async req => store.get(req.url)?.clone(), put: async (req, res) => { store.set(req.url, res); } };
        const request = new Request('https://buscador-juridico.com/api/permisos/puntos?tabla=pozos');
        const first = await servePermisos(request, 'puntos', { key: 'secret', base: BASE, fetcher, cache });
        expect(first.status).toBe(200);
        expect(first.headers.get('X-Api-Key')).toBeNull();
        expect(await first.text()).toBe('{"total":1,"data":[]}');
        await servePermisos(request, 'puntos', { key: 'secret', base: BASE, fetcher, cache });
        expect(seen).toEqual([{ url: `${BASE}/puntos?tabla=pozos`, key: 'secret' }]);
    });

    it('answers 503 without a key and hides upstream auth errors', async () => {
        const request = new Request('https://buscador-juridico.com/api/permisos/catalogo');
        expect((await servePermisos(request, 'catalogo', { key: '', cache: null })).status).toBe(503);
        const denied = await servePermisos(request, 'catalogo', { key: 'x', base: BASE, cache: null, fetcher: async () => new Response('{"detail":"bad key"}', { status: 401 }) });
        expect(denied.status).toBe(502);
        expect(await denied.text()).toBe('{"code":"upstream-auth"}');
        const missing = await servePermisos(new Request('https://b.com/api/permisos/detalle?tabla=pozos&numero=X'), 'detalle', { key: 'x', base: BASE, cache: null, fetcher: async () => new Response('', { status: 404 }) });
        expect(missing.status).toBe(404);
    });
});

describe('SENER tab', () => {
    it('routes the tab and one record, and builds their addresses back', () => {
        expect(permitsRoute('#sener')).toEqual({ tab: 'sener' });
        expect(permitsRoute('#sener?tabla=pozos&numero=AGUA%20NACIDA-1')).toEqual({ tab: 'sener', record: { tabla: 'pozos', numero: 'AGUA NACIDA-1' } });
        // Links shared with the first name of the tab keep working.
        expect(permitsRoute('#cne-sener?tabla=pozos&numero=X')).toEqual({ tab: 'sener', record: { tabla: 'pozos', numero: 'X' } });
        expect(permitsHash({ record: { tabla: 'asignaciones', numero: 'A-0001' } })).toBe('#sener?tabla=asignaciones&numero=A-0001');
        expect(permitsHash({ tab: 'sener' })).toBe('#sener');
        expect(permitsRoute('#mapa-permisos')).toEqual({ tab: 'mapa' });
    });

    it('labels markets, status and states as people read them', () => {
        expect(marketLabel({ mercado: 'Varios', mercadosAutorizados: 'Gas natural;Petróleo crudo' })).toBe('Gas natural, Petróleo crudo');
        expect(statusLabel({ estatus: null, estatusFuente: 'En producción' })).toBe('En producción');
        expect(statusLabel({ estatus: 'Vigente', estatusFuente: 'Operando' })).toBe('Vigente (Operando)');
        expect(stateLabel('30', 'VERACRUZ DE IGNACIO DE LA LLAVE')).toBe('Veracruz');
        expect(stateLabel('--', 'Sin entidad')).toBe('Sin entidad');
        expect(localDate('2026-10-23T03:42:20Z')).toMatch(/22/);
    });

    it('summarizes the latest load per authority and per source', () => {
        const { byAuthority, bySource } = updatesSummary([
            { autoridad: 'SENER', tabla: 'Pozos_SENER', clave: 'pozos', fechaActualizacion: '2026-10-22T10:00:00Z' },
            { autoridad: 'SENER', tabla: 'Asignaciones_SENER', fechaActualizacion: '2026-10-23T03:00:00Z' },
            { autoridad: 'CNE', tabla: 'Electricidad_autorizado', fechaActualizacion: '2026-10-21T00:00:00Z' },
        ]);
        expect(byAuthority).toEqual({ SENER: '2026-10-23T03:00:00Z', CNE: '2026-10-21T00:00:00Z' });
        expect(bySource.map(row => row.source)).toEqual(['electricidad', 'asignaciones', 'pozos']);
    });

    it('lists source fields without the ones shown elsewhere, and its links once each', () => {
        const fields = detailFields({ datos: { numeroPermiso: 'X', razonSocial: 'Y', fechaOtorgamiento: '1994-03-10', capacidadAutorizadaMW: 255, rfc: 'S/D', modalidad: null } });
        expect(fields.map(f => f.label)).toEqual(['Fecha de otorgamiento', 'Capacidad autorizada (MW)']);
        expect(recordLinks({ autoridad: 'CNE', ligaPermiso: 'https://a/p.pdf', fuenteUrl: 'https://a/p.pdf', ligaResolucion: null }))
            .toEqual([{ href: 'https://a/p.pdf', label: 'Ver el permiso' }]);
        expect(recordLinks({ autoridad: 'SENER', fuenteUrl: 'javascript:alert(1)' })).toEqual([]);
    });

    it('stops after the first page when there are too many points', async () => {
        const original = globalThis.fetch;
        let calls = 0;
        globalThis.fetch = async () => { calls += 1; return new Response(JSON.stringify({ total: 5000, data: [{ n: 1 }] })); };
        try {
            const result = await getAllPages('puntos', {}, { limit: 3000 });
            expect(result).toEqual({ total: 5000, data: [], tooMany: true });
            expect(calls).toBe(1);
        } finally {
            globalThis.fetch = original;
        }
    });
});
