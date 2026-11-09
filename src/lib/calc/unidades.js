/**
 * Units of the energy calculator. Every linear unit stores its factor to the base unit of its
 * magnitude as a fraction of safe integers, built from exact definitions (NIST SP 811):
 * ft = 0.3048 m, lb = 0.45359237 kg, g0 = 9.80665 m/s², gallon = 231 in³, barrel = 42 gallons,
 * Btu = 1 055.05585262 J, cal = 4.1868 J.
 * Bases: J, W, Pa, kg, L, L/d, m/s, m². Temperature is affine and has its own functions.
 * Lists are ordered with the official unit first, so the second one is the natural alternative.
 * `oficial` says whether the unit is in the NOM-008-SE-2021.
 */

const u = (id, nombre, simbolo, magnitud, factor, oficial, extra = {}) => ({ id, nombre, simbolo, magnitud, factor, oficial, ...extra });

const LISTA = [
    // Energía (J)
    u('mj', 'megajoules', 'MJ', 'energia', [1e6, 1], true),
    u('kwh', 'kilowatts-hora', 'kWh', 'energia', [3.6e6, 1], true),
    u('j', 'joules', 'J', 'energia', [1, 1], true),
    u('kj', 'kilojoules', 'kJ', 'energia', [1e3, 1], true),
    u('gj', 'gigajoules', 'GJ', 'energia', [1e9, 1], true),
    u('tj', 'terajoules', 'TJ', 'energia', [1e12, 1], true),
    u('pj', 'petajoules', 'PJ', 'energia', [1e15, 1], true),
    u('wh', 'watts-hora', 'Wh', 'energia', [3600, 1], true),
    u('mwh', 'megawatts-hora', 'MWh', 'energia', [3.6e9, 1], true),
    u('gwh', 'gigawatts-hora', 'GWh', 'energia', [3.6e12, 1], true),
    u('twh', 'terawatts-hora', 'TWh', 'energia', [3.6e15, 1], true),
    u('cal', 'calorías', 'cal', 'energia', [41868, 10000], false),
    u('kcal', 'kilocalorías', 'kcal', 'energia', [41868, 10], false),
    u('btu', 'unidades térmicas británicas (Btu)', 'Btu', 'energia', [105505585262, 1e8], false),
    u('mmbtu', 'millones de Btu (MMBtu)', 'MMBtu', 'energia', [105505585262, 100], false),
    u('therm', 'therms', 'therm', 'energia', [105506000, 1], false),
    u('therm-us', 'therms de EE. UU.', 'therm EE. UU.', 'energia', [105480400, 1], false),
    u('tep', 'toneladas equivalentes de petróleo', 'tep', 'energia', [41868000000, 1], false, { clase: 'convencion', nota: 'balances de energía' }),

    // Potencia (W)
    u('kw', 'kilowatts', 'kW', 'potencia', [1e3, 1], true),
    u('hp', 'caballos de fuerza', 'hp', 'potencia', [745699871582, 1e9], false),
    u('w', 'watts', 'W', 'potencia', [1, 1], true),
    u('mw', 'megawatts', 'MW', 'potencia', [1e6, 1], true),
    u('gw', 'gigawatts', 'GW', 'potencia', [1e9, 1], true),
    u('tw', 'terawatts', 'TW', 'potencia', [1e12, 1], true),
    u('hp-e', 'caballos de fuerza eléctricos', 'hp eléctrico', 'potencia', [746, 1], false),
    u('cv', 'caballos de vapor', 'CV', 'potencia', [73549875, 100000], false),
    u('kcal-h', 'kilocalorías por hora', 'kcal/h', 'potencia', [1163, 1000], false),
    u('btu-h', 'Btu por hora', 'Btu/h', 'potencia', [105505585262, 360000000000], false),
    u('tr', 'toneladas de refrigeración', 'TR', 'potencia', [1055055852620, 300000000], false),

    // Presión (Pa)
    u('kpa', 'kilopascales', 'kPa', 'presion', [1e3, 1], true),
    u('bar', 'bar', 'bar', 'presion', [1e5, 1], false),
    u('pa', 'pascales', 'Pa', 'presion', [1, 1], true),
    u('mpa', 'megapascales', 'MPa', 'presion', [1e6, 1], true),
    u('atm', 'atmósferas', 'atm', 'presion', [101325, 1], false),
    u('kgf-cm2', 'kilogramos fuerza por centímetro cuadrado', 'kg/cm²', 'presion', [980665, 10], false),
    u('psi', 'libras por pulgada cuadrada', 'psi', 'presion', [44482216152605, 6451600000], false),
    u('inh2o', 'pulgadas de columna de agua', 'inH₂O', 'presion', [24908891, 100000], false),
    u('mh2o', 'metros de columna de agua', 'mH₂O', 'presion', [980665, 100], false),
    u('torr', 'torr', 'Torr', 'presion', [101325, 760], false),

    // Temperatura (afín, sin factor)
    u('c', 'grados Celsius', '°C', 'temperatura', null, true),
    u('f', 'grados Fahrenheit', '°F', 'temperatura', null, false),
    u('k', 'kelvin', 'K', 'temperatura', null, true),

    // Masa (kg)
    u('kg', 'kilos', 'kg', 'masa', [1, 1], true),
    u('lb', 'libras', 'lb', 'masa', [45359237, 1e8], false),
    u('t', 'toneladas', 't', 'masa', [1000, 1], true),
    u('ton-corta', 'toneladas cortas', 'ton corta', 'masa', [90718474, 1e5], false),
    u('ton-larga', 'toneladas largas', 'ton larga', 'masa', [10160469088, 1e7], false),

    // Volumen (L)
    u('m3', 'metros cúbicos', 'm³', 'volumen', [1000, 1], true),
    u('l', 'litros', 'L', 'volumen', [1, 1], true),
    u('gal', 'galones', 'gal', 'volumen', [3785411784, 1e9], false),
    u('bl', 'barriles', 'bl', 'volumen', [158987294928, 1e9], false),
    u('mmb', 'millones de barriles (MMb)', 'MMb', 'volumen', [158987294928, 1000], false),
    u('pc', 'pies cúbicos', 'pc', 'volumen', [28316846592, 1e9], false),
    u('mpc', 'miles de pies cúbicos (Mpc)', 'Mpc', 'volumen', [28316846592, 1e6], false),
    u('mmpc', 'millones de pies cúbicos (MMpc)', 'MMpc', 'volumen', [28316846592, 1000], false),
    u('bcf', 'miles de millones de pies cúbicos (Bcf)', 'Bcf', 'volumen', [28316846592, 1], false),

    // Flujo (L/d)
    u('m3-h', 'metros cúbicos por hora', 'm³/h', 'flujo', [24000, 1], true),
    u('l-min', 'litros por minuto', 'L/min', 'flujo', [1440, 1], true),
    u('gpm', 'galones por minuto', 'gpm', 'flujo', [5450992968960, 1e9], false),
    u('bpd', 'barriles diarios', 'bpd', 'flujo', [158987294928, 1e9], false),
    u('mbd', 'miles de barriles diarios (Mbd)', 'Mbd', 'flujo', [158987294928, 1e6], false),
    u('mmpcd', 'millones de pies cúbicos diarios (MMpcd)', 'MMpcd', 'flujo', [28316846592, 1000], false),

    // Velocidad (m/s)
    u('m-s', 'metros por segundo', 'm/s', 'velocidad', [1, 1], true),
    u('km-h', 'kilómetros por hora', 'km/h', 'velocidad', [5, 18], true),
    u('mph', 'millas por hora', 'mph', 'velocidad', [1609344, 3600000], false),
    u('nudo', 'nudos', 'nudo', 'velocidad', [1852, 3600], false),
    u('ft-s', 'pies por segundo', 'ft/s', 'velocidad', [3048, 10000], false),

    // Área (m²)
    u('m2', 'metros cuadrados', 'm²', 'area', [1, 1], true),
    u('ha', 'hectáreas', 'ha', 'area', [10000, 1], true),
    u('km2', 'kilómetros cuadrados', 'km²', 'area', [1e6, 1], true),
    u('ft2', 'pies cuadrados', 'ft²', 'area', [9290304, 1e8], false),
    u('acre', 'acres', 'acre', 'area', [40468564224, 1e7], false),
];

export const MAGNITUDES = ['energia', 'potencia', 'presion', 'temperatura', 'masa', 'volumen', 'flujo', 'velocidad', 'area'];

export const UNIDADES = Object.freeze(Object.fromEntries(LISTA.map(x => [x.id, Object.freeze({ clase: 'exacto', ...x })])));

export const unidadesDe = magnitud => LISTA.filter(x => x.magnitud === magnitud).map(x => UNIDADES[x.id]);

/** A linear conversion. Throws RangeError across magnitudes or for temperature. */
export function convertir(valor, desde, hacia) {
    const a = UNIDADES[desde];
    const b = UNIDADES[hacia];
    if (!a || !b || a.magnitud !== b.magnitud || !a.factor) throw new RangeError(`No se puede convertir ${desde} a ${hacia}`);
    return valor * a.factor[0] / a.factor[1] * b.factor[1] / b.factor[0];
}

function aKelvin(valor, unidad, diferencia) {
    if (unidad === 'k') return valor;
    if (unidad === 'c') return diferencia ? valor : valor + 273.15;
    if (unidad === 'f') return diferencia ? valor / 1.8 : (valor - 32) / 1.8 + 273.15;
    throw new RangeError(`No es temperatura: ${unidad}`);
}

function deKelvin(valor, unidad, diferencia) {
    if (unidad === 'k') return valor;
    if (unidad === 'c') return diferencia ? valor : valor - 273.15;
    if (unidad === 'f') return diferencia ? valor * 1.8 : (valor - 273.15) * 1.8 + 32;
    throw new RangeError(`No es temperatura: ${unidad}`);
}

/** A temperature, or with `diferencia` a temperature difference (10 °C of difference are 18 °F). */
export const convertirTemperatura = (valor, desde, hacia, { diferencia = false } = {}) =>
    deKelvin(aKelvin(valor, desde, diferencia), hacia, diferencia);

export const bajoCeroAbsoluto = (valor, unidad) => aKelvin(valor, unidad, false) < 0;
