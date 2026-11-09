/**
 * What each tab of the energy calculator offers: units, products, adjustments, the fixed example
 * shown when the field is empty, and the three shortcut questions.
 * Some units only make sense inside a tab (barrel of oil equivalent, gas LP cylinders, a tank in
 * litres of water, CO₂); they live here, not in unidades.js.
 */
import { UNIDADES, unidadesDe } from './unidades.js';

export const PRODUCTOS_PETROLIFEROS = Object.freeze([
    { id: 'gasolina', nombre: 'Gasolinas y naftas' },
    { id: 'diesel', nombre: 'Diésel' },
    { id: 'turbosina', nombre: 'Turbosina' },
    { id: 'combustoleo', nombre: 'Combustóleo' },
    { id: 'coque', nombre: 'Coque de petróleo' },
    { id: 'maya', nombre: 'Crudo Maya' },
    { id: 'istmo', nombre: 'Crudo Istmo' },
    { id: 'olmeca', nombre: 'Crudo Olmeca' },
]);

/** Units that belong to one tab. `kg` and `l` say how much each one is. */
export const UNIDADES_PESTANA = Object.freeze({
    bep: { id: 'bep', nombre: 'barriles equivalentes de petróleo', simbolo: 'bep', magnitud: 'energia', oficial: false },
    cil10: { id: 'cil10', nombre: 'cilindros de 10 kg', simbolo: 'cilindros de 10 kg', magnitud: 'masa', kg: 10, oficial: false },
    cil20: { id: 'cil20', nombre: 'cilindros de 20 kg', simbolo: 'cilindros de 20 kg', magnitud: 'masa', kg: 20, oficial: false },
    cil30: { id: 'cil30', nombre: 'cilindros de 30 kg', simbolo: 'cilindros de 30 kg', magnitud: 'masa', kg: 30, oficial: false },
    cil45: { id: 'cil45', nombre: 'cilindros de 45 kg', simbolo: 'cilindros de 45 kg', magnitud: 'masa', kg: 45, oficial: false },
    'tanque-agua': { id: 'tanque-agua', nombre: 'litros de agua de un tanque (carga el 85 %)', simbolo: 'L de agua', magnitud: 'volumen', llenado: 0.85, oficial: false },
    kgco2: { id: 'kgco2', nombre: 'kilos de CO₂', simbolo: 'kg de CO₂', magnitud: 'emisiones', oficial: true },
    tco2: { id: 'tco2', nombre: 'toneladas de CO₂', simbolo: 't de CO₂', magnitud: 'emisiones', oficial: true },
});

export const infoUnidad = id => UNIDADES[id] ?? UNIDADES_PESTANA[id] ?? null;
export const nombreUnidad = id => infoUnidad(id)?.nombre ?? id;
export const simboloUnidad = id => infoUnidad(id)?.simbolo ?? id;

export const PESTANAS = Object.freeze([
    {
        id: 'electricidad', titulo: 'Electricidad', productos: [], tieneBase: false, ajustes: [],
        unidades: ['mw', 'kw', 'gw', 'tw', 'kwh', 'mwh', 'gwh', 'twh', 'tj', 'pj'],
        ejemplo: { valor: 1, unidad: 'mw', horas: 1 },
    },
    {
        id: 'petroliferos', titulo: 'Gasolinas y diésel', productos: PRODUCTOS_PETROLIFEROS.map(p => p.id), tieneBase: true, ajustes: ['t', 'd'],
        unidades: ['mbd', 'l', 'm3', 'gal', 'bl', 'mmb', 'kg', 't', 'mj', 'gj', 'tj', 'pj', 'kwh', 'mmbtu', 'bep'],
        ejemplo: { valor: 100, unidad: 'mbd', producto: 'gasolina' },
    },
    {
        id: 'gas-natural', titulo: 'Gas natural', productos: [], tieneBase: false, ajustes: ['c', 'pc', 'k'],
        unidades: ['mmpc', 'pc', 'mpc', 'mmpcd', 'bcf', 'm3', 'kg', 'gj', 'mmbtu', 'therm', 'kwh', 'bep'],
        ejemplo: { valor: 1, unidad: 'mmpc' },
    },
    {
        id: 'gas-lp', titulo: 'Gas LP', productos: [], tieneBase: true, ajustes: ['t', 'm'],
        unidades: ['cil20', 'cil10', 'cil30', 'cil45', 'tanque-agua', 'kg', 'l', 'm3', 'bl', 'mj', 'gj', 'kwh'],
        ejemplo: { valor: 1, unidad: 'cil20' },
    },
    {
        id: 'otras', titulo: 'Otras', productos: [], tieneBase: false, ajustes: ['pm', 'a', 'dt'],
        unidades: [],
        ejemplo: { valor: 1, unidad: 'bar', magnitud: 'presion' },
    },
]);

export const PESTANA = Object.freeze(Object.fromEntries(PESTANAS.map(p => [p.id, p])));

export const ATAJOS = Object.freeze([
    { titulo: '¿Qué es 1 MW?', ruta: { pestana: 'electricidad', valor: 1, unidad: 'mw', horas: 1 } },
    { titulo: '¿Cuánto es un barril?', ruta: { pestana: 'petroliferos', valor: 1, unidad: 'bl', producto: 'gasolina' } },
    { titulo: '¿Cuánto trae mi tanque?', ruta: { pestana: 'gas-lp', valor: 300, unidad: 'tanque-agua' } },
]);

/** The units a person can pick in this state. Coke is measured by mass, so no volume and no bep. */
export function unidadesValidas({ pestana, magnitud, producto } = {}) {
    if (pestana === 'otras') return unidadesDe(magnitud).map(u => u.id);
    const lista = PESTANA[pestana]?.unidades ?? [];
    if (pestana === 'petroliferos' && producto === 'coque') {
        return lista.filter(id => id !== 'bep' && ['masa', 'energia'].includes(UNIDADES[id]?.magnitud));
    }
    return lista;
}
