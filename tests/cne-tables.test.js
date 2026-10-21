import { describe, expect, it } from 'vitest';
import {
    CNE_TABLES, CNE_TABLE, NULL_VALUE, NO_STATE, normalizePermitNumber, featureStateId, facetOptions, stateOptions,
    filterRows, capacityTotals, validPoint, mexicoCityTime, calendarDate, choroplethClass,
    marketOf, activityKey, parseActivity, activitiesByMarket, stateCounts,
} from '../src/lib/cne-tables.js';
import { cnePanelHtml, marketActivitiesHtml, stateAt } from '../src/scripts/cne-tables-layer.js';

const rows = [
    { numeroPermiso: 'CNE/PL/0922/TRA/OM/2026', numeroPermisoNorm: 'PL/922/TRA/OM/2026', razonSocial: 'Transportes del Golfo, S.A. de C.V.', rfc: 'TGO010101AAA', estatus: 'Vigente', efId: '30', entidad: 'Veracruz', tipoPermiso: 'Transporte', mercado: 'Petrolíferos', medioTransporte: 'Autotanque/semirremolque', capacidad: 30000, unidadCapacidad: 'litros' },
    { numeroPermiso: 'PL/1001/TRA/OM/2025', numeroPermisoNorm: 'PL/1001/TRA/OM/2025', razonSocial: 'Ductos Norte', estatus: 'Vigente', efId: null, tipoPermiso: 'Transporte', mercado: 'Petrolíferos', medioTransporte: 'Ducto', capacidad: 5000, unidadCapacidad: null },
    { numeroPermiso: 'G/0055/TRA/2019', numeroPermisoNorm: 'G/55/TRA/2019', razonSocial: 'Gas del Bajío', estatus: 'No vigente', efId: '11', tipoPermiso: 'Transporte', mercado: 'Gas natural', medioTransporte: null, capacidad: 100, unidadCapacidad: 'litros' },
];

describe('CNE tables', () => {
    it('declares the five tables with their map layer, apart from Laboratorios_UV', () => {
        expect(CNE_TABLES.map(t => t.key)).toEqual(['transporte', 'comercializacion', 'infraestructura', 'suministro', 'terceros']);
        expect(CNE_TABLE.transporte.map).toEqual({ states: true, points: true });
        expect(CNE_TABLE.comercializacion.map).toEqual({ states: true, points: false });
        expect(CNE_TABLE.infraestructura.map).toEqual({ states: false, points: true });
        expect(CNE_TABLE.suministro.column.key).toBe('cobertura');
        expect(CNE_TABLE.terceros.column.key).toBe('ambito');
    });

    it('normalizes permit numbers like NumeroPermisoNorm', () => {
        expect(normalizePermitNumber('CNE/PL/0922/TRA/OM/2026')).toBe('PL/922/TRA/OM/2026');
        expect(normalizePermitNumber(' cne/pl/ 0922 /tra ')).toBe('PL/922/TRA');
        expect(normalizePermitNumber('E/000/GEN')).toBe('E/0/GEN');
    });

    it('filters by status (Vigente by default), state, facets and number or name', () => {
        expect(filterRows(rows)).toHaveLength(2);
        expect(filterRows(rows, { estatus: '' })).toHaveLength(3);
        expect(filterRows(rows, { efId: NO_STATE }).map(r => r.razonSocial)).toEqual(['Ductos Norte']);
        expect(filterRows(rows, { efId: '30' })).toHaveLength(1);
        expect(filterRows(rows, { facets: { medioTransporte: 'Ducto' } })).toHaveLength(1);
        expect(filterRows(rows, { estatus: '', facets: { medioTransporte: NULL_VALUE } }).map(r => r.razonSocial)).toEqual(['Gas del Bajío']);
        expect(filterRows(rows, { q: 'cne/pl/0922' })).toHaveLength(1);
        expect(filterRows(rows, { q: 'golfo' })).toHaveLength(1);
        expect(filterRows(rows, { estatus: '', q: 'BAJIO' })).toHaveLength(1);
    });

    it('lists facet and state options with empty values labelled', () => {
        expect(facetOptions(rows, 'medioTransporte').map(o => o.label)).toEqual(['Autotanque/semirremolque', 'Ducto', 'Sin especificar']);
        expect(stateOptions(rows).map(o => o.label)).toEqual(['Guanajuato', 'Veracruz', 'Sin entidad']);
    });

    it('adds capacity only per known unit', () => {
        expect(capacityTotals(rows)).toEqual([{ unit: 'litros', total: 30100 }]);
    });

    it('matches state polygons by INEGI code or name', () => {
        expect(featureStateId({ properties: { CVE_ENT: '09', NOMGEO: 'Ciudad de México' } })).toBe('09');
        expect(featureStateId({ properties: { cve_ent: 7 } })).toBe('07');
        expect(featureStateId({ properties: { name: 'Veracruz de Ignacio de la Llave' } })).toBe('30');
        expect(featureStateId({ properties: { ESTADO: 'México' } })).toBe('15');
        expect(featureStateId({ properties: { id: 'MX-JAL' } })).toBe('');
    });

    it('plots only coordinates inside México', () => {
        expect(validPoint(19.43, -99.13)).toEqual([19.43, -99.13]);
        expect(validPoint(0, 0)).toBeNull();
        expect(validPoint(-99.13, 19.43)).toBeNull();
        expect(validPoint(null, -99)).toBeNull();
    });

    it('shows UTC timestamps in Mexico City time and calendar dates unshifted', () => {
        expect(mexicoCityTime('2026-10-21T16:05:00Z')).toMatch(/21 de octubre de 2026.*10:05/);
        expect(mexicoCityTime('2026-10-21 16:05:00')).toMatch(/10:05/);
        expect(mexicoCityTime(null)).toBe('');
        expect(calendarDate('2026-03-04')).toMatch(/4 mar.* 2026/);
        expect(calendarDate('1900-01-01')).toBe('');
    });

    it('classes the choropleth', () => {
        expect(choroplethClass(0, 100)).toBe(0);
        expect(choroplethClass(100, 100)).toBe(5);
        expect(choroplethClass(3, 100)).toBe(1);
    });
});

describe('CNE activities by market', () => {
    it('reads the market of a row without case or accents; the rest is «otros»', () => {
        expect(marketOf({ mercado: 'Petrolíferos' })).toBe('petroliferos');
        expect(marketOf({ mercado: 'Gas Natural' })).toBe('gas-natural');
        expect(marketOf({ mercado: 'GAS LP' })).toBe('gas-lp');
        expect(marketOf({ mercado: 'Electricidad' })).toBe('electricidad');
        for (const mercado of ['Petróleo crudo', 'Petroquímicos', 'Hidrocarburos', null]) expect(marketOf({ mercado })).toBe('otros');
        expect(parseActivity(activityKey('transporte', 'gas-natural'))).toEqual({ table: 'transporte', market: 'gas-natural' });
    });

    it('summarizes each table per market with what the map can draw', () => {
        const summary = activitiesByMarket({
            transporte: rows,
            comercializacion: [{ mercado: 'Hidrocarburos', estatus: 'Vigente' }],
            infraestructura: [{ mercado: 'Gas Natural', estatus: 'Vigente', latitud: 19.4, longitud: -99.1 }, { mercado: 'Gas Natural', estatus: 'No vigente', efId: '09' }],
            suministro: null, terceros: [],
        });
        expect(summary.petroliferos).toEqual([{ table: 'transporte', market: 'petroliferos', total: 2, vigentes: 2, withState: 1, withPoint: 0 }]);
        expect(summary['gas-natural'].map(e => [e.table, e.vigentes, e.withState, e.withPoint])).toEqual([['transporte', 0, 0, 0], ['infraestructura', 1, 0, 1]]);
        expect(summary.otros.map(e => e.table)).toEqual(['comercializacion']);
        expect(summary.electricidad).toEqual([]);
        expect(summary['gas-lp']).toEqual([]);
    });

    it('counts vigentes per state like /Tablas/Estados, with «Sin entidad» apart', () => {
        expect(stateCounts(rows)).toEqual([{ efId: '30', entidad: 'Veracruz', permisos: 1 }, { efId: NO_STATE, entidad: 'Sin entidad', permisos: 1 }]);
        expect(filterRows(rows, { market: 'gas-natural', estatus: '' }).map(r => r.razonSocial)).toEqual(['Gas del Bajío']);
    });

    it('lists only activities with permits and only the layers their vigentes can draw', () => {
        const box = document.createElement('div');
        box.innerHTML = marketActivitiesHtml('gas-natural', [
            { table: 'transporte', total: 10, vigentes: 8, withState: 5, withPoint: 0 },
            { table: 'infraestructura', total: 3, vigentes: 3, withState: 0, withPoint: 2 },
            { table: 'terceros', total: 4, vigentes: 4, withState: 0, withPoint: 0 },
        ], { states: activityKey('transporte', 'gas-natural') });
        expect(box.querySelector('.pmm-cne-sub-h').textContent).toBe('Otras actividades · Gas natural');
        expect([...box.querySelectorAll('[data-cne-open]')].map(b => [b.dataset.cneOpen, b.dataset.cneMarket])).toEqual([['transporte', 'gas-natural'], ['infraestructura', 'gas-natural'], ['terceros', 'gas-natural']]);
        expect([...box.querySelectorAll('[data-cne-states]')].map(b => [b.dataset.cneStates, b.checked])).toEqual([['transporte|gas-natural', true]]);
        expect([...box.querySelectorAll('[data-cne-points]')].map(b => b.dataset.cnePoints)).toEqual(['infraestructura|gas-natural']);
        expect(box.querySelectorAll('.pmm-cne-nomap')).toHaveLength(1);
        expect(marketActivitiesHtml('gas-lp', [])).toBe('');
        expect(cnePanelHtml()).toContain('data-cne-market="otros"');
    });
    it('finds the state under a map click, holes included', () => {
        const square = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
        const geo = { type: 'FeatureCollection', features: [
            { type: 'Feature', properties: { cve_ent: '30' }, geometry: { type: 'Polygon', coordinates: [square(-98, 17, -94, 22), square(-96.5, 19, -95.5, 20)] } },
            { type: 'Feature', properties: { cve_ent: '09' }, geometry: { type: 'MultiPolygon', coordinates: [[square(-99.4, 19.1, -98.9, 19.6)]] } },
        ] };
        expect(stateAt(geo, 18, -97)).toBe('30');
        expect(stateAt(geo, 19.5, -96)).toBe('');
        expect(stateAt(geo, 19.4, -99.1)).toBe('09');
        expect(stateAt(geo, 30, -110)).toBe('');
    });
});
