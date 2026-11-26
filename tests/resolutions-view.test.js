// Resolutions, Panorama and Trámites read Azure through /api/permisos/*: never the CNE site.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { noResultsHint, actaHtml, renderResolutionsView } from '../src/scripts/resolutions-view.js';
import { collect } from '../src/scripts/cne-panorama-view.js';
import { recentResolutions } from '../src/scripts/tramites-view.js';
import { buscarResoluciones, resolucionPorNumero, resolucionesDePermiso, conteoResoluciones, marcoRegulatorio, fechaLabel, resolucion } from '../src/lib/resoluciones-api.js';

vi.mock('../src/lib/supabase.js', () => ({ supabase: {} }));

const json = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
function stubRoutes(routes) {
    const calls = [];
    vi.stubGlobal('fetch', vi.fn(async url => {
        calls.push(String(url));
        for (const [pattern, resp] of routes) if (pattern.test(url)) return typeof resp === 'function' ? resp(String(url)) : json(resp);
        return json({ code: 'not-found' }, 404);
    }));
    return calls;
}
const onlyAzure = calls => calls.every(u => u.startsWith('/api/permisos/'));
const ITEM = {
    resolucionId: 30254, numero: 'CNE/RES/1133/2026', fecha: '2026-09-23', tipo: 'Otorgamiento de permiso', modalidad: 'Electricidad',
    acta: 'ACT/020/2026', ligaResolucion: 'https://drive.cne.gob.mx/Drive/ObtenerResolucion/?id=a', ligaActa: null, mercado: 'Electricidad',
};
const tick = () => new Promise(resolve => setTimeout(resolve, 5));
Element.prototype.scrollIntoView ||= () => {};

afterEach(() => vi.unstubAllGlobals());

describe('resoluciones-api', () => {
    it('maps a resolution without filling what is missing', () => {
        expect(resolucion({ numero: 'X', fecha: null, tipo: '', ligaResolucion: 'http://no', ligaActa: null })).toMatchObject({ numero: 'X', fecha: null, tipo: null, ligaResolucion: null, ligaActa: null, permisos: [] });
        expect(fechaLabel('2026-09-23')).toBe('23 sep 2026');
        expect(fechaLabel(null)).toBe('');
    });
    it('searches newest first with the year as a date range', async () => {
        const calls = stubRoutes([[/\/api\/permisos\/resoluciones\?/, { total: 1, page: 1, pageSize: 20, items: [ITEM] }]]);
        const r = await buscarResoluciones({ texto: 'eólica', fecha: '2026', tipo: 'Otorgamiento de permiso', modalidad: 'Electricidad', acta: 'ACT/020/2026' }, { start: 20, pageSize: 20 });
        expect(r.total).toBe(1);
        expect(r.rows[0].numero).toBe('CNE/RES/1133/2026');
        expect(Object.fromEntries(new URL(calls[0], 'https://x').searchParams)).toEqual({
            q: 'eólica', tipo: 'Otorgamiento de permiso', modalidad: 'Electricidad', acta: 'ACT/020/2026', desde: '2026-01-01', hasta: '2026-12-31', orden: 'fecha_desc', page: '2', pageSize: '20',
        });
        expect(onlyAzure(calls)).toBe(true);
    });
    it('reads one resolution with its permits; a missing one is null', async () => {
        stubRoutes([[/resolucion\?numero=CNE%2FRES%2F1133%2F2026/, { ...ITEM, permisos: [{ numeroPermiso: 'E/73/GEN/2026', tabla: 'electricidad' }] }]]);
        expect((await resolucionPorNumero('CNE/RES/1133/2026')).permisos).toEqual([{ numero: 'E/73/GEN/2026', tabla: 'electricidad' }]);
        expect(await resolucionPorNumero('CNE/RES/9/2026')).toBeNull();
    });
    it('lists a permit’s resolutions newest first, undated last', async () => {
        stubRoutes([[/permiso-resoluciones/, { total: 2, items: [{ ...ITEM, numero: 'B', fecha: null }, { ...ITEM, numero: 'A' }] }]]);
        expect((await resolucionesDePermiso('E/73/GEN/2026')).map(r => r.numero)).toEqual(['A', 'B']);
    });
    it('counts keep null types and years as null', async () => {
        stubRoutes([[/resoluciones-conteo/, { total: 3, porTipo: [{ tipo: null, total: 1 }, { tipo: 'Varios', total: 2 }], porAnio: [{ anio: null, total: 1 }, { anio: 2026, total: 2 }] }]]);
        expect(await conteoResoluciones({})).toEqual({ total: 3, porTipo: [{ tipo: null, total: 1 }, { tipo: 'Varios', total: 2 }], porAnio: [{ anio: null, total: 1 }, { anio: 2026, total: 2 }] });
    });
    it('searches the regulatory framework by its proemio, newest first', async () => {
        const calls = stubRoutes([[/marco-regulatorio/, { total: 1, items: [{ id: 1, numero: 'A/041/2016', fecha: '2016-10-06', tipo: 'ACUERDO', proemio: 'ACUERDO QUE…', link: 'https://drive.cre.gob.mx/x' }] }]]);
        const r = await marcoRegulatorio({ q: 'autoconsumo' }, { pageSize: 6 });
        expect(r.rows[0]).toEqual({ id: 1, numero: 'A/041/2016', fecha: '2016-10-06', tipo: 'ACUERDO', proemio: 'ACUERDO QUE…', link: 'https://drive.cre.gob.mx/x' });
        expect(calls[0]).toContain('orden=fecha_desc');
    });
});

describe('Resoluciones tab', () => {
    it('lists the newest resolutions and opens one with its permits, no proemio, the acta as text without a link', async () => {
        const calls = stubRoutes([
            [/\/resoluciones\?/, { total: 17674, items: [ITEM] }],
            [/\/resolucion\?/, { ...ITEM, permisos: [{ numeroPermiso: 'E/73/GEN/2026', tabla: 'electricidad' }] }],
        ]);
        document.body.innerHTML = '<div id="h"></div>';
        const host = document.getElementById('h');
        const view = renderResolutionsView(host, () => [], {});
        for (let i = 0; i < 4; i++) await tick();
        expect(host.querySelector('.pm-status').textContent).toBe('1–1 de 17,674 resoluciones · más recientes primero');
        host.querySelector('[data-resolution]').click();
        for (let i = 0; i < 4; i++) await tick();
        expect(host.querySelector('#pm-res-detail-title').textContent).toBe('CNE/RES/1133/2026');
        expect(host.querySelector('.pm-proemio')).toBeNull();
        expect(host.querySelector('.pm-facts').textContent).toContain('ACT/020/2026');
        expect(host.querySelector('.pm-facts a')).toBeNull();
        expect(host.querySelector('.pm-res-permits').textContent).toContain('E/73/GEN/2026');
        expect(onlyAzure(calls)).toBe(true);
        view.destroy();
    });
    it('links the acta only when it has a PDF', () => {
        expect(actaHtml({ acta: 'ACT/1/2026', ligaActa: null })).toBe('ACT/1/2026');
        expect(actaHtml({ acta: 'ACT/1/2026', ligaActa: 'https://x/a.pdf' })).toContain('href="https://x/a.pdf"');
        expect(actaHtml({ acta: null })).toBe('—');
        expect(noResultsHint('')).toBe('Prueba con menos filtros o con otra palabra.');
    });
});

describe('Panorama and Trámites', () => {
    it('panorama figures come from the counts, skipping null years and types', async () => {
        const year = new Date().getFullYear();
        const calls = stubRoutes([
            [/\/permisos\?/, { total: 31000, data: [] }],
            [/resoluciones-conteo\?modalidad=/, { total: 5, porTipo: [], porAnio: [] }],
            [/resoluciones-conteo\?desde=/, { total: 9, porTipo: [{ tipo: null, total: 1 }, { tipo: 'Varios', total: 8 }], porAnio: [{ anio: year, total: 9 }] }],
            [/resoluciones-conteo$/, { total: 100, porTipo: [], porAnio: [{ anio: year, total: 9 }, { anio: year - 1, total: 50 }, { anio: null, total: 41 }] }],
        ]);
        const data = await collect();
        expect(data).toMatchObject({ permits: 31000, resolutions: 100, thisYear: 9, byType: [{ label: 'Varios', count: 8 }] });
        expect(data.perYear.at(-1)).toEqual({ year, count: 9 });
        expect(data.perYear.at(-2)).toEqual({ year: year - 1, count: 50 });
        expect(data.byMode.every(m => m.count === 5)).toBe(true);
        expect(onlyAzure(calls)).toBe(true);
    });
    it('a guide with text lists the regulatory framework; with modality and type, the CNE resolutions', async () => {
        const calls = stubRoutes([
            [/marco-regulatorio/, { total: 295, items: [{ id: 1, numero: 'RES/812/2024', fecha: '2024-05-30', tipo: 'RESOLUCIÓN', proemio: 'RESOLUCIÓN…', link: 'https://drive.cre.gob.mx/x' }] }],
            [/\/resoluciones\?/, { total: 7380, items: [ITEM] }],
        ]);
        const byText = await recentResolutions({ texto: 'autoconsumo' });
        expect(byText.rows[0]).toMatchObject({ numero: 'RES/812/2024', texto: 'RESOLUCIÓN…', href: 'https://drive.cre.gob.mx/x', external: true });
        const byType = await recentResolutions({ modalidad: 'Petrolíferos', tipo: 'Otorgamiento de permiso' });
        expect(byType.rows[0]).toMatchObject({ numero: 'CNE/RES/1133/2026', texto: null, href: '#resolucion=CNE%2FRES%2F1133%2F2026' });
        expect(calls[1]).toContain('modalidad=Petrol');
        expect(onlyAzure(calls)).toBe(true);
    });
});

describe('no live CNE', () => {
    it('no client or server code calls the CNE registry or the old /api/cne proxy', () => {
        for (const file of ['src/lib/cne-api.js', 'src/lib/resoluciones-api.js', 'src/lib/permisos-mapa.js', 'src/scripts/permits-view.js', 'src/scripts/resolutions-view.js',
            'src/scripts/cne-panorama-view.js', 'src/scripts/tramites-view.js', 'src/scripts/desk-view.js', 'src/scripts/permits-map-view.js', 'server/reader-dev.js']) {
            expect(readFileSync(file, 'utf8'), file).not.toMatch(/api-creweb|api-publico|\/api\/cne\//);
        }
        expect(existsSync('server/cne-proxy.js')).toBe(false);
        expect(existsSync('functions/api/cne')).toBe(false);
    });
});
