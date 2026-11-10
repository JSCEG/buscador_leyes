/**
 * What each tab of the energy calculator offers: units, products, adjustments, the fixed example
 * shown when the field is empty, and the three shortcut questions.
 * Some units only make sense inside a tab (barrel of oil equivalent, gas LP cylinders, a tank in
 * litres of water, CO₂); they live here, not in unidades.js.
 */
import { MAGNITUDES, UNIDADES, unidadesDe } from './unidades.js';
import { CIUDADES, CONDICIONES, MEZCLAS_LP } from './ajustes.js';
import { ENERGETICOS } from './energeticos.js';

export { MAGNITUDES };

export const PRODUCTOS_PETROLIFEROS = Object.freeze([
    { id: 'gasolina', nombre: 'Gasolinas y naftas' },
    { id: 'diesel', nombre: 'Diésel' },
    { id: 'turbosina', nombre: 'Turbosina (querosenos)' },
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

export const infoUnidad = id => (Object.hasOwn(UNIDADES, id) ? UNIDADES[id] : Object.hasOwn(UNIDADES_PESTANA, id) ? UNIDADES_PESTANA[id] : null);
export const nombreUnidad = id => infoUnidad(id)?.nombre ?? id;
export const magnitudUnidad = id => infoUnidad(id)?.magnitud ?? null;

/** One of each unit: «1 cilindro de 20 kg», «1 mil barriles diarios (Mbd)». */
export const UNA = Object.freeze({
    mj: 'megajoule', kwh: 'kilowatt-hora', j: 'joule', kj: 'kilojoule', gj: 'gigajoule', tj: 'terajoule', pj: 'petajoule', wh: 'watt-hora', mwh: 'megawatt-hora', gwh: 'gigawatt-hora', twh: 'terawatt-hora',
    cal: 'caloría', kcal: 'kilocaloría', btu: 'unidad térmica británica (Btu)', mmbtu: 'millón de Btu (MMBtu)', therm: 'therm', 'therm-us': 'therm de EE. UU.', tep: 'tonelada equivalente de petróleo',
    kw: 'kilowatt', hp: 'caballo de fuerza', w: 'watt', mw: 'megawatt', gw: 'gigawatt', tw: 'terawatt', 'hp-e': 'caballo de fuerza eléctrico', cv: 'caballo de vapor', 'kcal-h': 'kilocaloría por hora', 'btu-h': 'Btu por hora', tr: 'tonelada de refrigeración',
    kpa: 'kilopascal', bar: 'bar', pa: 'pascal', mpa: 'megapascal', atm: 'atmósfera', 'kgf-cm2': 'kilogramo fuerza por centímetro cuadrado', psi: 'libra por pulgada cuadrada', inh2o: 'pulgada de columna de agua', mh2o: 'metro de columna de agua', torr: 'torr',
    c: 'grado Celsius', f: 'grado Fahrenheit', k: 'kelvin',
    kg: 'kilo', lb: 'libra', t: 'tonelada', 'ton-corta': 'tonelada corta', 'ton-larga': 'tonelada larga',
    m3: 'metro cúbico', l: 'litro', gal: 'galón', bl: 'barril', mmb: 'millón de barriles (MMb)', pc: 'pie cúbico', mpc: 'mil pies cúbicos (Mpc)', mmpc: 'millón de pies cúbicos (MMpc)', bcf: 'mil millones de pies cúbicos (Bcf)',
    'm3-h': 'metro cúbico por hora', 'l-min': 'litro por minuto', gpm: 'galón por minuto', bpd: 'barril diario', mbd: 'mil barriles diarios (Mbd)', mmpcd: 'millón de pies cúbicos diarios (MMpcd)',
    'm-s': 'metro por segundo', 'km-h': 'kilómetro por hora', mph: 'milla por hora', nudo: 'nudo', 'ft-s': 'pie por segundo',
    m2: 'metro cuadrado', ha: 'hectárea', km2: 'kilómetro cuadrado', ft2: 'pie cuadrado', acre: 'acre',
    bep: 'barril equivalente de petróleo', cil10: 'cilindro de 10 kg', cil20: 'cilindro de 20 kg', cil30: 'cilindro de 30 kg', cil45: 'cilindro de 45 kg',
    'tanque-agua': UNIDADES_PESTANA['tanque-agua'].nombre.replace(/^litros/, 'litro'), kgco2: 'kilo de CO₂', tco2: 'tonelada de CO₂',
});

// The same unit means something narrower inside a tab: gas LP cubic metres are liquid (a vapour m³
// holds about 290 times less energy), natural gas cubic metres are at the condition chosen in «Ajustar».
const NOMBRES_POR_PESTANA = {
    'gas-lp': { m3: ['metros cúbicos de gas líquido', 'metro cúbico de gas líquido'] },
    'gas-natural': { m3: ['metros cúbicos, en la condición de «Ajustar»', 'metro cúbico, en la condición de «Ajustar»'] },
};
/** The unit's name inside a tab; with `una`, for exactly one. */
export function nombreUnidadEn(pestana, id, { una = false } = {}) {
    const propio = NOMBRES_POR_PESTANA[pestana]?.[id];
    if (propio) return propio[una ? 1 : 0];
    return (una && Object.hasOwn(UNA, id)) ? UNA[id] : nombreUnidad(id);
}

// What «Ajustar» offers, as option lists, so the screen never reads the engine's tables.
export const OPCIONES_MEZCLA = Object.freeze(Object.entries(MEZCLAS_LP).map(([id, m]) => ({ id, nombre: m.nombre })));
export const OPCIONES_CONDICION = Object.freeze(Object.entries(CONDICIONES).map(([id, c]) => ({ id, nombre: c.nombre })));
export const ALTITUDES = Object.freeze(Object.values(CIUDADES).map(c => ({ nombre: c.nombre, altitud: c.altitud })));
export const temperaturaReferencia = producto => (Object.hasOwn(ENERGETICOS, producto) ? ENERGETICOS[producto].tRef : null);
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
