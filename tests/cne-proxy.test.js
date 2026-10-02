import { describe, it, expect, vi } from 'vitest';
import { serveCne, upstreamUrl } from '../server/cne-proxy.js';
import { proxyUrl, resolutionsQueryUrl } from '../src/lib/cne-api.js';

const ok = body => vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } }));

describe('upstreamUrl', () => {
    it('forwards only the allowed parameters of each endpoint', () => {
        expect(upstreamUrl('resoluciones', '?resolucionId=97249&tipoEntidad=2'))
            .toBe('https://api-publico.cne.gob.mx/api/Resoluciones/?resolucionId=97249&tipoEntidad=2');
        expect(upstreamUrl('anexos', '?permisoId=31120')).toBe('https://api-publico.cne.gob.mx/api/Permisos/Anexos?permisoId=31120');
    });
    it('rejects unknown, malformed or extra parameters', () => {
        expect(upstreamUrl('anexos', '?permisoId=1&url=https://evil.example')).toBeNull();
        expect(upstreamUrl('anexos', '?permisoId=abc')).toBeNull();
        expect(upstreamUrl('resoluciones', '?aoData=not-json')).toBeNull();
        expect(upstreamUrl('resoluciones', '')).toBeNull();
        expect(upstreamUrl('otra', '?x=1')).toBeNull();
    });
});

describe('serveCne', () => {
    it('relays a GET and caches it', async () => {
        const fetcher = ok([{ Id: 1 }]);
        const store = new Map();
        const cache = { match: async req => store.get(req.url), put: async (req, res) => { store.set(req.url, res); } };
        const request = new Request('https://buscador-juridico.com/api/cne/anexos?permisoId=31120');
        const response = await serveCne(request, 'anexos', { fetcher, cache });
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual([{ Id: 1 }]);
        expect(fetcher.mock.calls[0][0]).toBe('https://api-publico.cne.gob.mx/api/Permisos/Anexos?permisoId=31120');
        await serveCne(request, 'anexos', { fetcher, cache });
        expect(fetcher).toHaveBeenCalledTimes(1);
    });
    it('relays the permits search body and nothing else', async () => {
        const fetcher = ok({ data: [], recordsFiltered: 0 });
        const body = JSON.stringify({ parameters: { start: 0, length: 1 } });
        const response = await serveCne(new Request('https://x/api/cne/permisos', { method: 'POST', body }), 'permisos', { fetcher, cache: null });
        expect(response.status).toBe(200);
        expect(fetcher.mock.calls[0][0]).toBe('https://api-creweb.cne.gob.mx/api/Permisos/ObtenerPermisosPaginados');
        expect(fetcher.mock.calls[0][1].body).toBe(body);
    });
    it('refuses other endpoints, methods and bodies', async () => {
        const fetcher = ok({});
        expect((await serveCne(new Request('https://x/api/cne/drive'), 'drive', { fetcher })).status).toBe(404);
        expect((await serveCne(new Request('https://x/api/cne/permisos'), 'permisos', { fetcher })).status).toBe(405);
        expect((await serveCne(new Request('https://x/api/cne/permisos', { method: 'POST', body: '{"x":1}' }), 'permisos', { fetcher })).status).toBe(400);
        expect((await serveCne(new Request('https://x/api/cne/permisos', { method: 'POST', body: JSON.stringify({ parameters: 'x'.repeat(9000) }) }), 'permisos', { fetcher })).status).toBe(413);
        expect(fetcher).not.toHaveBeenCalled();
    });
    it('answers 502 or 504 when the CNE fails', async () => {
        const failing = vi.fn().mockResolvedValue(new Response('no', { status: 500 }));
        expect((await serveCne(new Request('https://x/api/cne/anexos?permisoId=1'), 'anexos', { fetcher: failing, cache: null })).status).toBe(502);
        const down = vi.fn().mockRejectedValue(new Error('network'));
        expect((await serveCne(new Request('https://x/api/cne/anexos?permisoId=1'), 'anexos', { fetcher: down, cache: null })).status).toBe(504);
    });
});

describe('proxyUrl', () => {
    it('maps the CNE URLs the app uses to the local proxy', () => {
        expect(proxyUrl('https://api-creweb.cne.gob.mx/api/Permisos/ObtenerPermisosPaginados')).toBe('/api/cne/permisos');
        expect(proxyUrl('https://api-publico.cne.gob.mx/api/Permisos/Anexos?permisoId=5')).toBe('/api/cne/anexos?permisoId=5');
        const res = resolutionsQueryUrl({ numero: 'RES/1' });
        expect(proxyUrl(res)).toBe(`/api/cne/resoluciones${res.slice(res.indexOf('?'))}`);
        expect(upstreamUrl('resoluciones', res.slice(res.indexOf('?')))).toBe(res.replace('/api/Resoluciones/?', '/api/Resoluciones/?'));
        expect(proxyUrl('https://drive.cne.gob.mx/Drive/ObtenerPermiso/?id=x')).toBeNull();
    });
});
