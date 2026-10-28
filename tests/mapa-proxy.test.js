import { describe, it, expect, vi } from 'vitest';
import { serveMapa, upstreamUrl, fetchHurricanes, DGMESNIE_URL, CNE_TABLES, STATES_URL } from '../server/mapa-proxy.js';
import { insidePolygon, passes, distanceKm, nearest, marketOf, kvClass, stateKey } from '../src/scripts/permits-map-view.js';

const ok = body => vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } }));
const fakeCache = () => {
    const store = new Map();
    return { match: async req => store.get(req.url), put: async (req, res) => { store.set(req.url, res); } };
};
const req = path => new Request(`https://buscador-juridico.com/api/mapa/${path}`);

describe('upstreamUrl', () => {
    it('maps whitelisted endpoints to DGMESNIE', () => {
        expect(upstreamUrl('capa', new URLSearchParams('tipo=gas-lp'))).toBe(`${DGMESNIE_URL}/DashboardProyectos/PermisosEnergeticos?tipo=gas-lp&minLat=14&minLon=-118.5&maxLat=33&maxLon=-86.5&estatus=todos`);
        expect(upstreamUrl('ligas', new URLSearchParams('numero=PL/10559/EXP/ES/2015'))).toBe(`${DGMESNIE_URL}/DashboardProyectos/PermisosEnergeticos/Ligas?numero=PL%2F10559%2FEXP%2FES%2F2015`);
        expect(upstreamUrl('buscar', new URLSearchParams('q=pemex tabasco&limite=8'))).toContain('/Buscar?q=pemex%20tabasco&limite=8');
        expect(upstreamUrl('capa', new URLSearchParams('tipo=gas-lp'), 'http://localhost:5155/')).toMatch(/^http:\/\/localhost:5155\/DashboardProyectos/);
    });
    it('rejects unknown endpoints, markets, extra keys and bad values', () => {
        expect(upstreamUrl('otro', new URLSearchParams())).toBeNull();
        expect(upstreamUrl('capa', new URLSearchParams('tipo=carbon'))).toBeNull();
        expect(upstreamUrl('capa', new URLSearchParams('tipo=gas-lp&x=1'))).toBeNull();
        expect(upstreamUrl('ligas', new URLSearchParams('numero=<script>'))).toBeNull();
        expect(upstreamUrl('buscar', new URLSearchParams('q=a'))).toBeNull();
        expect(upstreamUrl('buscar', new URLSearchParams('q=pemex&limite=9999'))).toBeNull();
    });
});

describe('serveMapa', () => {
    it('proxies a layer and caches it', async () => {
        const fetcher = ok({ type: 'FeatureCollection', features: [] });
        const cache = fakeCache();
        const first = await serveMapa(req('capa?tipo=gas-natural'), 'capa', { fetcher, cache });
        expect(first.status).toBe(200);
        expect(first.headers.get('Cache-Control')).toBe('public, max-age=3600');
        expect(await first.json()).toEqual({ type: 'FeatureCollection', features: [] });
        await serveMapa(req('capa?tipo=gas-natural'), 'capa', { fetcher, cache });
        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(fetcher.mock.calls[0][0]).toContain('tipo=gas-natural');
    });
    it('answers 404/405/400 without calling upstream', async () => {
        const fetcher = ok({});
        expect((await serveMapa(req('nada'), 'nada', { fetcher, cache: null })).status).toBe(404);
        expect((await serveMapa(new Request('https://x/api/mapa/capa?tipo=gas-lp', { method: 'POST' }), 'capa', { fetcher, cache: null })).status).toBe(405);
        expect((await serveMapa(req('capa?tipo=x'), 'capa', { fetcher, cache: null })).status).toBe(400);
        expect(fetcher).not.toHaveBeenCalled();
    });
    it('reports upstream errors as 502 without caching', async () => {
        const fetcher = vi.fn().mockResolvedValue(new Response('no', { status: 500 }));
        const res = await serveMapa(req('actualizacion'), 'actualizacion', { fetcher, cache: null });
        expect(res.status).toBe(502);
        expect(res.headers.get('Cache-Control')).toBe('no-store');
    });
});

describe('fetchHurricanes', () => {
    it('joins active storms with their NHC layers', async () => {
        const fetcher = vi.fn(async url => {
            if (url.includes('CurrentStorms')) return new Response(JSON.stringify({ activeStorms: [{ id: 'ep052026', binNumber: 'EP5', name: 'Simon', classification: 'HU', intensity: '85', latitudeNumeric: 20, longitudeNumeric: -106 }] }));
            if (url.endsWith('?f=json')) return new Response(JSON.stringify({ layers: [{ id: 7, name: 'EP5 Forecast Cone' }] }));
            return new Response(JSON.stringify({ features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [] } }] }));
        });
        const data = await fetchHurricanes(fetcher);
        expect(data.tormentas).toHaveLength(1);
        expect(data.tormentas[0]).toMatchObject({ nombre: 'Simon', intensidadKt: 85 });
        expect(data.features).toHaveLength(1);
        expect(data.features[0].properties).toMatchObject({ capa: 'cono', tormentaId: 'ep052026' });
    });
});

describe('map filters', () => {
    const square = { type: 'Polygon', coordinates: [[[-110, 20], [-100, 20], [-100, 30], [-110, 30], [-110, 20]]] };
    it('detects points inside the forecast cone', () => {
        expect(insidePolygon([-105, 25], square)).toBe(true);
        expect(insidePolygon([-95, 25], square)).toBe(false);
        expect(insidePolygon([-105, 25], { type: 'MultiPolygon', coordinates: [square.coordinates] })).toBe(true);
    });
    it('filters by status and precision', () => {
        expect(passes({ vigente: true })).toBe(true);
        expect(passes({ vigente: false })).toBe(false);
        expect(passes({ vigente: false }, { status: 'no-vigentes' })).toBe(true);
        expect(passes({ vigente: true, precision: 'municipio' }, { status: 'todos', exactOnly: true })).toBe(false);
        expect(passes({ vigente: true, precision: 'exacta' }, { status: 'todos', exactOnly: true })).toBe(true);
    });
});

describe('near me and shared points', () => {
    it('measures distances on the globe', () => {
        // Zócalo (CDMX) to Monterrey's Macroplaza: about 705 km in a straight line.
        expect(distanceKm([19.4326, -99.1332], [25.6694, -100.3097])).toBeGreaterThan(690);
        expect(distanceKm([19.4326, -99.1332], [25.6694, -100.3097])).toBeLessThan(720);
        expect(distanceKm([20, -100], [20, -100])).toBe(0);
    });
    it('lists permits within the radius, closest first, or the nearest ones as a fallback', () => {
        const items = [{ id: 'far', lat: 21, lon: -100 }, { id: 'b', lat: 20.1, lon: -100 }, { id: 'a', lat: 20.05, lon: -100 }];
        const close = nearest(items, [20, -100], { radiusKm: 25 });
        expect(close.within).toBe(true);
        expect(close.items.map(x => x.id)).toEqual(['a', 'b']);
        const none = nearest(items, [30, -110], { radiusKm: 25, fallback: 2 });
        expect(none.within).toBe(false);
        expect(none.items.map(x => x.id)).toEqual(['far', 'b']);
    });
    it('finds the map layer from the permit number', () => {
        expect(marketOf('CNE/E/1439/GEN/2015')).toBe('electricidad');
        expect(marketOf('CNE/PL/12345/EXP/ES/2016')).toBe('petroliferos');
        expect(marketOf('CNE/LP/100/DIS/2020')).toBe('gas-lp');
        expect(marketOf('CNE/G/22/LICUE/2018')).toBe('gas-natural');
        expect(marketOf('V/123/2020')).toBeNull();
    });
});

describe('network layers', () => {
    it('groups transmission lines by voltage', () => {
        expect(kvClass(400).label).toBe('400 kV');
        expect(kvClass(230).label).toBe('230 kV');
        expect(kvClass(138).label).toBe('138 a 161 kV');
        expect(kvClass(115).label).toBe('69 a 115 kV');
        expect(kvClass(69).label).toBe('69 a 115 kV');
        expect(kvClass(34.5).label).toBe('34.5 kV o menor');
        // Colours come from the CENACE tokens; without the stylesheet they fall back to the same code.
        expect(kvClass(400).color).toBe('#0000ff');
    });
});

describe('state filter', () => {
    it('reads the state names the way the registry writes them', () => {
        expect(stateKey('MÉXICO')).toBe('mexico');
        expect(stateKey('VERACRUZ DE IGNACIO DE LA LLAVE')).toBe('veracruz de ignacio de la llave');
        expect(stateKey('Michoacán')).toBe('michoacan de ocampo');
        expect(stateKey('Coahuila de Zaragoza')).toBe('coahuila');
        expect(stateKey('NUEVO  LEÓN')).toBe('nuevo leon');
        expect(stateKey('Texas')).toBe('');
        expect(stateKey(null)).toBe('');
    });
});

describe('CNE tables', () => {
    const tables = `${DGMESNIE_URL}/DashboardProyectos/PermisosEnergeticos/Tablas`;
    it('maps the five tables to DGMESNIE, with the list filters optional', () => {
        expect(CNE_TABLES).toEqual(['transporte', 'comercializacion', 'infraestructura', 'suministro', 'terceros']);
        expect(upstreamUrl('cne-lista', new URLSearchParams('tabla=transporte'))).toBe(`${tables}/Lista?tabla=transporte`);
        expect(upstreamUrl('cne-lista', new URLSearchParams('tabla=suministro&estatus=No vigente&ef=09&tipo=Suministro calificado')))
            .toBe(`${tables}/Lista?tabla=suministro&estatus=No+vigente&ef=09&tipo=Suministro+calificado`);
        expect(upstreamUrl('cne-estados', new URLSearchParams('tabla=comercializacion'))).toBe(`${tables}/Estados?tabla=comercializacion`);
        expect(upstreamUrl('cne-puntos', new URLSearchParams('tabla=infraestructura'))).toBe(`${tables}/Puntos?tabla=infraestructura`);
        expect(upstreamUrl('cne-actualizacion', new URLSearchParams('tabla=terceros'))).toBe(`${tables}/Actualizacion?tabla=terceros`);
        expect(upstreamUrl('estados', new URLSearchParams())).toBe(STATES_URL);
    });
    it('rejects other tables, bad filters and extra keys', () => {
        expect(upstreamUrl('cne-lista', new URLSearchParams('tabla=Laboratorios_UV'))).toBeNull();
        expect(upstreamUrl('cne-lista', new URLSearchParams())).toBeNull();
        expect(upstreamUrl('cne-lista', new URLSearchParams('tabla=transporte&estatus=todos'))).toBeNull();
        expect(upstreamUrl('cne-lista', new URLSearchParams('tabla=transporte&ef=9'))).toBeNull();
        expect(upstreamUrl('cne-lista', new URLSearchParams("tabla=transporte&tipo=x';drop"))).toBeNull();
        expect(upstreamUrl('cne-estados', new URLSearchParams('tabla=transporte&ef=09'))).toBeNull();
        expect(upstreamUrl('estados', new URLSearchParams('x=1'))).toBeNull();
    });
    it('caches the state polygons for a week', async () => {
        const fetcher = ok({ type: 'FeatureCollection', features: [] });
        const response = await serveMapa(req('estados'), 'estados', { fetcher, cache: null });
        expect(response.headers.get('Cache-Control')).toBe('public, max-age=604800');
        expect(fetcher.mock.calls[0][0]).toBe(STATES_URL);
    });
});
