// «Tarifas y recibo de luz», en 3D y con el formato Búho de «¿Cómo funciona?». Una calle de ejemplo: la casa con su medidor, su clima y
// sus aparatos; la red que le lleva la energía, la central, el CENACE, la oficina de la CFE que cobra y el Gobierno federal que pone la
// aportación; una tienda y una fábrica. Cuatro formas de verlo: tu recibo, lo que cuesta de verdad, la tarifa DAC y los negocios.
// Se arma con: node scripts/build-conceptos-3d.mjs tarifas
//
// Lo que se repite entre las plantas con física está en conceptos-3d/planta-comun/.
import { clamp01, num } from '../planta-comun/ayudas.js';
import { barrasHTML, leyenda, pintarGrafica, seccionBarras, seccionColores, seccionDiagrama, seccionFuentes, seccionGrafica, seccionTabla, tablaHTML } from '../planta-comun/graficas.js';
import { crearPagina } from '../planta-comun/pagina.js';
import { APARATOS, BASE, CLIMA, COSTO, DAC, DEF, DIVISIONES, ESLABONES, FLUIDOS, LIMITES, LIMITE_DAC, MESES, NEGOCIO, NOMBRES, PARTES as PARTES_M, SUBSIDIO, TARIFAS, TEMPERATURA, anio, cobro, cobroDac, costoReal, estadoPlanta, pasoPlanta, pose, tarifaDe } from './modelo.js';
import { P_PLANTA, construir, escenario, materiales } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';

const FIGURA = 'tarifas';
const f1 = x => num(x, 1);
const f2 = x => num(x, 2);
const f3 = x => num(x, 3);
const pesos = x => `${num(x)} $`;
const corto = m => MESES[Math.round(m)]?.slice(0, 3) ?? '';
const VMC = DIVISIONES.central;
const NOR = DIVISIONES.noroeste;
const cargoDe = (region, cat, id) => COSTO.cargos(region, cat).find(p => p.id === id);
const genVMC = cargoDe('central', 'DB1', 'energia').kwh + cargoDe('central', 'DB1', 'capacidad').kwh;
const KWH_CLIMA_7 = CLIMA.kw * 7 * 30;

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'casa', nombre: 'Casa', modo: 'recibo', accion: 'kwh400', eq: 'Tarifa doméstica: de la 1 a la 1F', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 11 12 4l8 7v9H4z"/><path d="M10 20v-5h4v5"/>',
        texto: 'Una casa paga con una tarifa doméstica, de la 1 a la 1F, según el calor del verano en su localidad. Cada kWh se cobra al precio de su bloque: los primeros salen baratos y los que pasan del límite, caros. Mueve los kWh y la tarifa, y mira el recibo.' },
    { parte: 'medidor', nombre: 'Medidor', modo: 'recibo', accion: 'minimo', eq: 'Cuenta los kWh', recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="12" r="8"/><path d="M12 12l4-3M8 16h8"/>',
        texto: 'Cuenta los kilowatts-hora que usa la casa. Si usa menos de 25 kWh en un mes, se cobran 25. El recibo suele llegar cada dos meses: en el de ejemplo de la CFE, el bloque básico de dos meses es de 150 kWh, el doble del de un mes.' },
    { parte: 'clima', nombre: 'Aire acondicionado', modo: 'dac', abrir: true, accion: 'climaLargo', eq: `Minisplit de 1 tonelada: ${num(CLIMA.kw * 1000)} W`, recorrido: { noche: false, adentro: true },
        icono: '<rect x="3" y="6" width="18" height="7" rx="1.5"/><path d="M7 16v3M12 16v4M17 16v3"/>',
        texto: `Un minisplit de 1 tonelada gasta ${num(CLIMA.kw * 1000)} W: 7 horas al día son ${num(KWH_CLIMA_7)} kWh al mes, más que todo lo demás de la casa. En verano es lo que empuja el promedio de 12 meses hacia la tarifa DAC.` },
    { parte: 'aparatos', nombre: 'Aparatos de la casa', modo: 'recibo', abrir: true, accion: 'sinClima', eq: `${num(BASE)} kWh al mes sin clima`, recorrido: { noche: true, adentro: true },
        icono: '<rect x="6" y="3" width="12" height="18" rx="1.5"/><path d="M6 10h12M9 6v2M9 13v3"/>',
        texto: `Refrigerador, tele, lavadora, microondas y seis focos LED: unos ${num(BASE)} kWh al mes con la tabla de la CFE, casi lo que usa en promedio una casa en México (${num(SUBSIDIO.kwhMedio)}). El refrigerador solo se lleva ${num(APARATOS[0].kwhMes)}.` },
    { parte: 'poste', nombre: 'Transformador de poste', modo: 'costo', accion: 'noroeste', eq: 'Distribución: casi tanto como generar', recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 3v18M7 7h10"/><rect x="13" y="10" width="5" height="6" rx="1"/>',
        texto: `Baja el voltaje de la red de distribución al de la casa. Llevar la energía por estas redes cuesta ${f2(VMC.DB1.distribucion)} $ por kWh en el Valle de México y ${f2(NOR.DB1.distribucion)} en el Noroeste, casi tanto como producirla. La CNE fija esa Tarifa Regulada.` },
    { parte: 'alumbrado', nombre: 'Alumbrado público', modo: 'negocio', accion: 'noche', eq: 'Lo paga el municipio', recorrido: { noche: true, adentro: false },
        icono: '<path d="M8 21V6h8"/><path d="M14 6l3 3h-6z"/>',
        texto: 'Lo paga el municipio, con su propia tarifa: 4.36 $ por kWh en 2025. Algunos lo cobran en el recibo de luz; la Suprema Corte invalidó el de Oaxaca de Juárez por ser un impuesto al consumo de luz.' },
    { parte: 'subestacion', nombre: 'Subestación', modo: 'costo', accion: 'desarme', eq: 'De transmisión a distribución', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 20h16M7 20V8h10v12M7 12h10"/>',
        texto: 'Baja el voltaje de la Red Nacional de Transmisión al de las Redes Generales de Distribución, que llegan hasta la casa. La CNE fija una Tarifa Regulada para cada red con las metodologías que manda la ley (LSE, art. 158).' },
    { parte: 'transmision', nombre: 'Red Nacional de Transmisión', modo: 'costo', accion: 'noroeste', eq: `${f2(cargoDe('central', 'DB1', 'transmision').kwh)} $ por kWh`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M8 21 12 3l4 18M9 9h6M6 14h12"/>',
        texto: `Lleva la energía en alta tensión de las centrales a las regiones. Cuesta ${f3(cargoDe('central', 'DB1', 'transmision').kwh)} $ por kWh, lo mismo en todo el país para quien se conecta abajo de 220 kV.` },
    { parte: 'central', nombre: 'Central eléctrica', modo: 'costo', accion: 'kwh400', eq: `Energía y capacidad: ${f2(genVMC)} $ por kWh`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 20V10l5 3V10l5 3V6h4v14z"/>',
        texto: `Generar cuesta dos cosas: la energía que se produce y la capacidad de tener centrales listas para la hora de más demanda. En una casa del Valle de México suman ${f2(genVMC)} $ por kWh: más de la mitad del costo. Son lo único que la CNE ajusta cada mes.` },
    { parte: 'cenace', nombre: 'CENACE', modo: 'costo', accion: 'kwh400', eq: 'Menos de 2 centavos por kWh', recorrido: { noche: false, adentro: false },
        icono: '<rect x="3" y="5" width="18" height="11" rx="1.5"/><path d="M8 20h8M12 16v4M7 12l3-3 2 2 4-4"/>',
        texto: `Opera la red y el mercado. Su servicio cuesta ${num(cargoDe('central', 'DB1', 'cenace').kwh, 4)} $ por kWh, y los servicios conexos que no están en el mercado, ${num(cargoDe('central', 'DB1', 'scnmem').kwh, 4)}: juntos, menos de 2 centavos de cada kWh.` },
    { parte: 'suministro', nombre: 'CFE Suministro Básico', modo: 'recibo', accion: 'verano', eq: 'Te cobra el recibo', recorrido: { noche: false, adentro: false },
        icono: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8 8h8M8 12h8M8 16h5"/>',
        texto: `Vende la energía a quien la pida y cobra el recibo (LSE, art. 63). Su servicio cuesta ${f2(VMC.suministro)} $ al mes por casa en el Valle de México y ${f2(NOR.suministro)} en el Noroeste. El recibo debe mostrar lo que cuesta cada eslabón (art. 159).` },
    { parte: 'gobierno', nombre: 'Gobierno federal', modo: 'costo', accion: 'poco', eq: `${num(SUBSIDIO.pef2026)} millones en 2026`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 9h18L12 4zM5 9v9M9 9v9M15 9v9M19 9v9M3 20h18"/>',
        texto: `Pone la diferencia entre lo que cuesta la energía y lo que paga la casa: la aportación gubernamental. El Presupuesto de 2026 trae ${num(SUBSIDIO.pef2026)} millones de pesos de subsidio a las tarifas eléctricas, que también cubre el riego agrícola.` },
    { parte: 'comercio', nombre: 'Tienda', modo: 'negocio', abrir: true, accion: 'tienda', eq: 'Tarifa PDBT, sin subsidio', recorrido: { noche: false, adentro: true },
        icono: '<path d="M4 9h16l-1-4H5zM5 9v11h14V9M10 20v-5h4v5"/>',
        texto: `Una tienda con hasta 25 kW paga la tarifa PDBT, que la CNE calcula con los mismos eslabones y sin subsidio: ${f2(NEGOCIO.pdbt.central.fijo)} $ al mes más ${f3(NEGOCIO.pdbt.central.kwh)} $ por kWh en el Valle de México. Cada kWh le cuesta más del doble que a una casa con poco consumo.` },
    { parte: 'fabrica', nombre: 'Fábrica', modo: 'negocio', accion: 'noche', eq: 'GDMTH: el precio cambia con la hora', recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 20V10l6 4V10l6 4V6h6v14z"/>',
        texto: 'Con 100 kW o más en media tensión paga la GDMTH: la energía cuesta más en horas punta y paga aparte su demanda; en 2025, 2.75 $ por kWh en promedio. Con 1 MW o más puede ser Usuario Calificado.' },
];
const VISTAS = Object.fromEntries(PARTES_M.map(p => [p.id, p.vista]));
let planta = estadoPlanta();
const relojAnio = { texto: 'el año', avanzar: (p, dt) => { p.mes = (p.mes + dt * 0.7) % 12; return false; }, alSeguir: () => {} };
const textoTarifa = v => { const t = tarifaDe(v); return TEMPERATURA[t] ? `${t} · verano de ${TEMPERATURA[t]} °C o más` : `${t} · sin verano`; };
const MODOS = {
    recibo: { nombre: 'Tu recibo', corto: 'Recibo', resumen: 'Cada kWh se paga al precio de su bloque: los primeros, baratos; los que pasan del límite, caros. Mueve los kWh del mes y la tarifa, de la 1 a la 1F, y mira cuánto pagas y cuánto cuesta de verdad.', aclara: 'Tarifas de la CFE de 2026: en verano, las de octubre; fuera de verano, las de noviembre. Se cuenta un mes, con IVA de 16 %; el recibo suele llegar cada dos meses. Sin el Derecho de Alumbrado Público, que cobran solo algunos municipios.', mando: { nombre: 'Consumo del mes', campo: 'kwh', rango: LIMITES.kwh, texto: v => `${num(v)} kWh` }, mando2: { nombre: 'Tarifa', campo: 'tarifaIdx', rango: LIMITES.tarifaIdx, texto: textoTarifa } },
    costo: { nombre: 'Lo que cuesta', corto: 'Costo', resumen: 'Llevar la energía a la casa cuesta en cada eslabón: generar, transmitir, distribuir, operar la red y cobrar. La CNE calcula ese costo; la tarifa doméstica cobra menos y el Gobierno pone la diferencia. Cambia los kWh y la región.', aclara: `Cargos de la CNE de ${COSTO.mes}, sin IVA: DB1 para casas con hasta 150 kWh al mes y DB2 para las demás. Dos divisiones de ejemplo: Valle de México Centro y Noroeste.`, mando: { nombre: 'Consumo del mes', campo: 'kwh', rango: LIMITES.kwh, texto: v => `${num(v)} kWh` }, mando2: { nombre: 'Tarifa', campo: 'tarifaIdx', rango: LIMITES.tarifaIdx, texto: textoTarifa } },
    dac: { nombre: 'Alto consumo (DAC)', corto: 'DAC', resumen: 'Si el promedio de los últimos 12 meses pasa el límite de su tarifa, la casa pasa a la DAC: cargo fijo y cada kWh a más de 6 $, sin aportación. Mueve las horas de aire acondicionado y la tarifa.', aclara: `Casa de ejemplo: ${num(BASE)} kWh al mes de aparatos y un minisplit de 1 tonelada que se usa más de mayo a octubre. Cada mes con las tarifas de octubre o noviembre de 2026; la DAC, de noviembre de 2026.`, mando: { nombre: 'Aire acondicionado', campo: 'horasClima', rango: LIMITES.horasClima, texto: v => `${f1(v)} h al día en julio` }, mando2: { nombre: 'Tarifa', campo: 'tarifaIdx', rango: LIMITES.tarifaIdx, texto: textoTarifa }, reloj: relojAnio },
    negocio: { nombre: 'Tienda y fábrica', corto: 'Negocios', resumen: 'Una tienda paga la tarifa PDBT y una fábrica la GDMTH, sin subsidio: cada kWh les cuesta más que a una casa con poco consumo. Mueve los kWh de la tienda.', aclara: `PDBT de ${NEGOCIO.pdbt.mes}. Precios medios de 2025 de la CFE, sin IVA.`, mando: { nombre: 'Consumo de la tienda', campo: 'tienda', rango: LIMITES.tienda, texto: v => `${num(v)} kWh al mes` } },
};
const BOTONES = [
    { id: 'verano', visible: p => p.modo === 'recibo' || p.modo === 'costo', pulsado: p => p.verano, texto: p => (p.verano ? 'Temporada: verano' : 'Temporada: fuera de verano'), alTocar: p => { p.verano = !p.verano; } },
    { id: 'region', visible: p => p.modo !== 'recibo', pulsado: () => false, texto: p => `Región: ${DIVISIONES[p.region].nombre}`, alTocar: p => { p.region = p.region === 'central' ? 'noroeste' : 'central'; } },
    { id: 'equipos', visible: p => p.modo === 'dac', pulsado: () => false, texto: p => `Minisplits: ${p.equipos}`, alTocar: p => { p.equipos = (p.equipos % 3) + 1; } },
];
const ACCIONES = {
    kwh400: { texto: p => (p.kwh > 300 ? 'Ver 150 kWh' : 'Ver 400 kWh'), hacer: (p, pag) => { p.kwh = p.kwh > 300 ? 150 : 400; pag.invalidar(); pag.ponerMando(); } },
    minimo: { texto: p => (p.kwh < 30 ? 'Ver 150 kWh' : 'Ver 10 kWh'), hacer: (p, pag) => { p.kwh = p.kwh < 30 ? 150 : 10; pag.invalidar(); pag.ponerMando(); } },
    sinClima: { texto: () => 'Ver la casa sin clima', hacer: (p, pag) => { p.kwh = Math.round(BASE); pag.invalidar(); pag.ponerMando(); } },
    verano: { texto: p => (p.verano ? 'Ver fuera de verano' : 'Ver en verano'), hacer: (p, pag) => { p.verano = !p.verano; pag.invalidar(); pag.ponerMando(); } },
    noroeste: { texto: p => (p.region === 'noroeste' ? 'Ver el Valle de México' : 'Ver el Noroeste'), hacer: (p, pag) => { p.region = p.region === 'noroeste' ? 'central' : 'noroeste'; pag.invalidar(); pag.ponerMando(); } },
    poco: { texto: p => (p.kwh <= 100 ? 'Ver 150 kWh' : 'Ver 100 kWh'), hacer: (p, pag) => { p.kwh = p.kwh <= 100 ? 150 : 100; pag.invalidar(); pag.ponerMando(); } },
    climaLargo: { texto: p => (p.horasClima >= 8 ? 'Ver 4 horas al día' : 'Ver 8 horas al día'), hacer: (p, pag) => { p.horasClima = p.horasClima >= 8 ? 4 : 8; pag.invalidar(); pag.ponerMando(); } },
    tienda: { texto: p => (p.tienda > 1500 ? 'Ver 900 kWh' : 'Ver 2,000 kWh'), hacer: (p, pag) => { p.tienda = p.tienda > 1500 ? 900 : 2000; pag.invalidar(); pag.ponerMando(); } },
};

// ------------------------------------------------------------------ el tablero
const secciones = () => `
    ${seccionDiagrama('Tu recibo')}
    ${seccionGrafica('b')}
    ${seccionGrafica('c')}
    ${seccionBarras()}
    ${seccionTabla('Las tarifas domésticas de 2026', 'h-tarifas', 'Bloques de verano en kWh al mes (fuera de verano, todas cobran 75 kWh de básico). CFE y oficio de la SHCP 349-B-1-070.')}
    ${seccionTabla('Lo que cuesta cada eslabón', 'h-eslabones', `Pesos por kWh, sin IVA; el suministro, pesos al mes. CNE, tarifas finales de ${COSTO.mes} (DOF, 27 de octubre de 2026).`)}
    ${seccionTabla('El subsidio y los usuarios', 'h-subsidio', 'Presupuesto de Egresos 2026, Cuenta Pública 2024 y CFE.', 'h-tabla-texto')}
    ${seccionTabla('Lo que gastan los aparatos', 'h-aparatos', 'Tabla de la CFE, boletín CFE-BP-72/23 (15 de junio de 2023).')}
    ${seccionTabla('Lo que dice la ley', 'h-regla', 'Ley del Sector Eléctrico, su reglamento y el acuerdo presidencial del 31 de diciembre de 2025.')}
    ${seccionColores(FLUIDOS, 'Las tarifas, los costos de cada eslabón, el subsidio, los precios medios y lo que gastan los aparatos son reales; la calle, la casa, sus horas de clima, la tienda y la fábrica son de ejemplo.', 'Colores de lo que corre')}
    ${seccionFuentes(FUENTES, [
        { para: 'Qué es la Suministradora de Servicios Básicos y que vende a quien lo pida; que la CNE fija las metodologías de las Tarifas Reguladas y aplica las tarifas finales; que el Ejecutivo puede fijar otro mecanismo para algunos usuarios si el recibo muestra los componentes de la CNE; y los programas de Justicia Energética', titulo: 'Ley del Sector Eléctrico, arts. 3, fracc. LIV, 63, 132, 158 y 159', nota: 'Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio' },
        { para: 'Que un centro de carga con 1 MW o más puede registrarse como Usuario Calificado mientras la SENER fija ese nivel', titulo: 'Reglamento de la Ley del Sector Eléctrico, transitorio vigésimo sexto', nota: 'Diario Oficial de la Federación, 3 de octubre de 2025. Está en el acervo de este sitio' },
    ])}`;

/** El eje de kWh: lo bastante largo para ver todos los bloques, el límite de la DAC y el consumo elegido. */
function ejeKwh(t, v, kwh) {
    const fin = TARIFAS[t][v ? 'verano' : 'fuera'].bloques.filter(b => Number.isFinite(b[1])).reduce((x, b) => x + b[1], 0);
    const pide = Math.max(fin * 1.5, LIMITE_DAC[t] * 1.2, kwh * 1.15, 400);
    const paso = pide <= 500 ? 100 : pide <= 1000 ? 200 : 250;
    const xMax = Math.min(1500, Math.ceil(pide / paso) * paso);
    return { xMin: 0, xMax, ticksX: Array.from({ length: Math.floor(xMax / paso) + 1 }, (_, i) => i * paso), etX: 'kWh al mes', fx: x => num(x) };
}
const MES_X = { xMin: 0, xMax: 11, ticksX: [0, 2, 4, 6, 8, 10], etX: 'Mes', fx: x => corto(x) };
const escala = (max, paso) => { const tope = Math.max(paso, Math.ceil((max * 1.08) / paso) * paso); return { yMax: tope, ticksY: Array.from({ length: Math.floor(tope / paso) + 1 }, (_, i) => i * paso) }; };
const pasoDe = max => (max > 30000 ? 10000 : max > 12000 ? 4000 : max > 6000 ? 2000 : max > 3000 ? 1000 : max > 1500 ? 500 : max > 600 ? 200 : max > 250 ? 100 : max > 100 ? 50 : max > 40 ? 10 : 5);
const pagadoSinIva = (t, v, k) => cobro(t, k, v).energia;
const costoDe = (k, region) => costoReal(k, 0, region).total;

function alPintarGraficas(L, pag) {
    const { $, pide, graficas } = pag;
    const m = pide.modo;
    graficas.b = null;
    graficas.c = null;
    if (m === 'recibo' || m === 'costo') {
        const t = L.tarifa;
        const v = pide.verano;
        const region = pide.region;
        const KWH_X = ejeKwh(t, v, L.r.cobrar);
        const fin = KWH_X.xMax;
        if (m === 'recibo') {
            const lb = [{ clase: 'h-s-actual', nombre: `Tarifa ${t}`, f: x => cobro(t, x, v).total }, ...(t !== '1' ? [{ clase: 'h-s-sin', nombre: 'Tarifa 1', f: x => cobro('1', x, v).total }] : [])];
            const mx = Math.max(...lb.map(s => s.f(fin)));
            $('#h-b-t').textContent = 'Lo que pagas según los kWh';
            $('#h-b-ley').innerHTML = leyenda(lb);
            $('#h-b-pie').textContent = `Pesos al mes con IVA, ${v ? 'en verano' : 'fuera de verano'}. La curva se empina en cada bloque: en la tarifa ${t}, cada kWh después de ${num(L.r.bloques.at(-1).desde)} cuesta ${f3(L.r.bloques.at(-1).precio)} $.`;
            graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Lo que pagas según los kWh', ...KWH_X, yMin: 0, ...escala(mx, pasoDe(mx)), etY: '$ al mes', lineas: lb, fy: y => num(y), punta: x => `${num(x)} kWh · ${pesos(lb[0].f(x))}` });
            $('#h-tabla-b').innerHTML = tablaHTML(['kWh al mes', `Tarifa ${t}`, 'Cada kWh'], [50, 100, 150, 200, 300, 500, 750, 1000, 1500].map(k => { const r = cobro(t, k, v); return [num(k), pesos(r.total), `${f2(r.medio)} $`]; }));
        } else {
            const lb = [{ clase: 'h-s-actual', nombre: 'Pagas, del costo', f: x => (100 * pagadoSinIva(t, v, x)) / costoDe(x, region) }, { clase: 'h-s-norma', nombre: 'El costo completo', f: () => 100 }];
            $('#h-b-t').textContent = 'Lo que pagas, de cada 100 del costo';
            $('#h-b-ley').innerHTML = leyenda(lb);
            const cruce = Array.from({ length: 1476 }, (_, i) => i + 25).find(k => pagadoSinIva(t, v, k) >= costoDe(k, region));
            $('#h-b-pie').textContent = cruce ? `Sin IVA. Con poco consumo el Gobierno pone casi la mitad; desde unos ${num(cruce)} kWh al mes, la tarifa ${t} cobra más que el costo que calcula la CNE.` : `Sin IVA. Con la tarifa ${t}${v ? ' en verano' : ''}, hasta 1,500 kWh se paga menos que el costo: el Gobierno pone el resto.`;
            graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Lo que pagas, de cada 100 del costo', ...KWH_X, yMin: 0, yMax: 200, ticksY: [0, 50, 100, 150, 200], etY: 'de cada 100', lineas: lb, fy: y => num(y), punta: x => `${num(x)} kWh · pagas ${num(lb[0].f(x))} de cada 100` });
            $('#h-tabla-b').innerHTML = tablaHTML(['kWh al mes', 'Cuesta', 'Pagas', 'De cada 100'], [50, 100, 150, 200, 300, 500, 1000].map(k => { const c = costoDe(k, region); const p = pagadoSinIva(t, v, k); return [num(k), pesos(c), pesos(p), num((100 * p) / c)]; }));
        }
        if (m === 'recibo') {
            const lc = [{ clase: 'h-s-rosa', nombre: 'Lo que cuesta', f: x => costoDe(x, region) }, { clase: 'h-s-verde', nombre: 'Lo que pagas', f: x => pagadoSinIva(t, v, x) }];
            const mx = Math.max(lc[0].f(fin), lc[1].f(fin));
            $('#h-c-t').textContent = 'Lo que cuesta y lo que pagas';
            $('#h-c-ley').innerHTML = leyenda(lc);
            $('#h-c-pie').textContent = `Pesos al mes sin IVA, con los costos de la CNE en ${DIVISIONES[region].nombre}. Donde la verde va abajo, el Gobierno pone la diferencia; donde va arriba, la casa paga más que el costo.`;
            graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Lo que cuesta y lo que pagas', ...KWH_X, yMin: 0, ...escala(mx, pasoDe(mx)), etY: '$ al mes', lineas: lc, fy: y => num(y), punta: x => `${num(x)} kWh · cuesta ${pesos(lc[0].f(x))} · pagas ${pesos(lc[1].f(x))}` });
            $('#h-tabla-c').innerHTML = tablaHTML(['kWh al mes', 'Cuesta', 'Pagas', 'Diferencia'], [50, 100, 150, 200, 300, 500, 1000, 1500].map(k => { const c = lc[0].f(k); const p = lc[1].f(k); return [num(k), pesos(c), pesos(p), p < c ? `Gobierno ${pesos(c - p)}` : `de más ${pesos(p - c)}`]; }));
        } else {
            const anios = [[2023, 76624.8], [2024, SUBSIDIO.real2024], [2025, SUBSIDIO.real2025], [2026, SUBSIDIO.pef2026]];
            const lc = [{ clase: 'h-s-rosa', nombre: 'Subsidio a las tarifas', puntos: anios.map(([a, x]) => [a, x / 1000]) }];
            $('#h-c-t').textContent = 'El subsidio a las tarifas eléctricas';
            $('#h-c-ley').innerHTML = leyenda(lc);
            $('#h-c-pie').textContent = `Miles de millones de pesos al año: lo que la SHCP le pasa a la CFE para cubrir la diferencia. 2026 es lo que trae el Presupuesto; en el primer semestre ya iban ${f1(SUBSIDIO.enero_junio2026 / 1000)} mil millones.`;
            graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'El subsidio a las tarifas eléctricas', xMin: 2023, xMax: 2026, ticksX: [2023, 2024, 2025, 2026], etX: 'Año', fx: x => String(Math.round(x)), yMin: 0, yMax: 100, ticksY: [0, 25, 50, 75, 100], etY: 'miles de millones', quebradas: lc, fy: y => num(y), punta: x => { const a = anios[Math.round(x) - 2023]; return `${a[0]} · ${f1(a[1] / 1000)} mil millones`; } });
            $('#h-tabla-c').innerHTML = tablaHTML(['Año', 'Millones de $', 'De dónde'], [[2023, num(76624.8, 1), 'Cuenta Pública 2024'], [2024, num(SUBSIDIO.real2024, 1), 'Cuenta Pública 2024'], [2025, num(SUBSIDIO.real2025, 1), 'CFE, reporte a la BMV'], [2026, num(SUBSIDIO.pef2026, 1), 'Presupuesto de Egresos']]);
        }
    } else if (m === 'dac') {
        const t = L.tarifa;
        const base = { tarifa: t, equipos: pide.equipos, region: pide.region };
        const lb = [{ clase: 'h-s-actual', nombre: 'Con la DAC', f: x => anio({ ...base, horasClima: x }).pago / 1000 }, { clase: 'h-s-sin', nombre: `Si siguiera en la ${t}`, f: x => anio({ ...base, horasClima: x }).pagoNormal / 1000 }];
        const mx = Math.max(lb[0].f(24), lb[1].f(24));
        $('#h-b-t').textContent = 'Lo que pagas en el año';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = L.a.horasLimite <= 24 ? `Miles de pesos al año, con IVA. Con más de ${f1(L.a.horasLimite)} horas de clima al día en julio, el promedio pasa de ${num(L.a.limite)} kWh y el recibo salta a la DAC.` : `Miles de pesos al año, con IVA. En la tarifa ${t}, con ${L.a.equipos} minisplit${L.a.equipos > 1 ? 's' : ''}, ni todo el día de clima pasa el límite de ${num(L.a.limite)} kWh.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Lo que pagas en el año', xMin: 0, xMax: 24, ticksX: [0, 6, 12, 18, 24], etX: 'Horas de clima al día en julio', fx: x => num(x), yMin: 0, ...escala(mx, pasoDe(mx)), etY: 'miles de $', lineas: lb, fy: y => num(y), punta: x => `${f1(x)} h · ${f1(lb[0].f(x))} mil $ al año` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Horas al día', 'Promedio kWh', 'Tarifa', 'Pagas al año'], [0, 2, 4, 6, 8, 12, 16, 24].map(h => { const a = anio({ ...base, horasClima: h }); return [num(h), num(a.promedio), a.enDac ? 'DAC' : t, pesos(a.pago)]; }));
        const recibo = x => (L.a.enDac ? x.dac.total : x.recibo.total);
        const lc = [{ clase: 'h-s-actual', nombre: 'Recibo del mes', puntos: L.a.meses.map((x, i) => [i, recibo(x)]) }, { clase: 'h-s-rosa', nombre: 'Lo que cuesta', puntos: L.a.meses.map((x, i) => [i, x.costo.total * 1.16]) }];
        const mx2 = Math.max(...L.a.meses.map(x => Math.max(recibo(x), x.costo.total * 1.16)));
        $('#h-c-t').textContent = 'Cada mes';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = L.a.enDac ? `Pesos al mes con IVA. En la DAC cada kWh cuesta ${f3(DAC.regiones[pide.region].kwh)} $ más IVA, más de lo que cuesta llevarlo: ${pesos(L.a.pago - L.a.costo * 1.16)} de más en el año.` : `Pesos al mes con IVA. El Gobierno pone ${pesos(L.a.aportacion)} en el año.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Cada mes', ...MES_X, yMin: 0, ...escala(mx2, pasoDe(mx2)), etY: '$ al mes', quebradas: lc, fy: y => num(y), punta: x => { const k = L.a.meses[Math.round(x)]; return `${k.nombre} · ${num(k.total)} kWh · ${pesos(recibo(k))}`; } });
        $('#h-tabla-c').innerHTML = tablaHTML(['Mes', 'kWh', 'Recibo', 'Cuesta'], L.a.meses.map(x => [x.nombre, num(x.total), pesos(recibo(x)), pesos(x.costo.total * 1.16)]));
    } else {
        const r = pide.region;
        const lb = [{ clase: 'h-s-actual', nombre: 'Tienda, PDBT', f: x => (NEGOCIO.pdbt[r].fijo + x * NEGOCIO.pdbt[r].kwh) * 1.16 }, { clase: 'h-s-rojo', nombre: 'Casa en DAC', f: x => cobroDac(r, x).total }];
        const mx = Math.max(lb[0].f(3000), lb[1].f(3000));
        $('#h-b-t').textContent = 'Lo que paga la tienda';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `Pesos al mes con IVA, ${DIVISIONES[r].nombre}. La PDBT no tiene bloques: cada kWh cuesta lo mismo, ${f3(NEGOCIO.pdbt[r].kwh)} $, más un cargo fijo. Una casa en DAC paga todavía más.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Lo que paga la tienda', xMin: 0, xMax: 3000, ticksX: [0, 1000, 2000, 3000], etX: 'kWh al mes', fx: x => num(x), yMin: 0, ...escala(mx, pasoDe(mx)), etY: '$ al mes', lineas: lb, fy: y => num(y), punta: x => `${num(x)} kWh · ${pesos(lb[0].f(x))}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['kWh al mes', 'Tienda', 'Casa en DAC'], [100, 500, 1000, 2000, 3000].map(k => [num(k), pesos(lb[0].f(k)), pesos(lb[1].f(k))]));
        const lc = [{ clase: 'h-s-actual', nombre: 'Tienda, PDBT', f: x => (NEGOCIO.pdbt[r].fijo + x * NEGOCIO.pdbt[r].kwh) / x }, { clase: 'h-s-verde', nombre: 'Casa, tarifa 1', f: x => cobro('1', x, false).medio }];
        $('#h-c-t').textContent = 'Lo que cuesta cada kWh';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = 'Pesos por kWh sin IVA. A una casa, cada kWh le sale más caro mientras más usa; a la tienda, casi igual: siempre arriba de 3 $.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Lo que cuesta cada kWh', xMin: 50, xMax: 1500, ticksX: [50, 500, 1000, 1500], etX: 'kWh al mes', fx: x => num(x), yMin: 0, yMax: 5, ticksY: [0, 1, 2, 3, 4, 5], etY: '$ por kWh', lineas: lc, fy: y => num(y), punta: x => `${num(x)} kWh · tienda ${f2(lc[0].f(x))} $ · casa ${f2(lc[1].f(x))} $` });
        $('#h-tabla-c').innerHTML = tablaHTML(['kWh al mes', 'Tienda', 'Casa, tarifa 1'], [50, 150, 300, 600, 1000, 1500].map(k => [num(k), `${f2(lc[0].f(k))} $`, `${f2(lc[1].f(k))} $`]));
    }
}

function pintarBarras(L, pag) {
    const { $, pide } = pag;
    let filas;
    if (pide.modo === 'recibo') {
        const r = L.r;
        const caros = r.bloques.filter(b => b.nombre === 'Excedente' || b.nombre === 'Intermedio alto').reduce((s, b) => s + b.kwh, 0);
        filas = [
            { t: 'De tus kWh, en el básico', v: r.bloques[0].kwh / r.cobrar, activa: true, escala: 1 },
            { t: 'En los bloques más caros', v: caros / r.cobrar, activa: caros > 0, escala: 1 },
            { t: 'Pagas, de lo que cuesta', v: L.k.razon, escala: 2 },
        ];
        $('#h-d-t').textContent = 'Tu mes, de cada 100';
        $('#h-d-pie').textContent = L.k.razon > 1 ? `Con ${num(r.cobrar)} kWh pagas más que el costo de la CNE: ${pesos(L.k.deMas)} de más, sin IVA.` : `Con ${num(r.cobrar)} kWh el Gobierno pone ${pesos(L.k.aportacion)} al mes.`;
    } else if (pide.modo === 'costo') {
        filas = L.k.partes.map(p => ({ t: p.nombre, v: p.importe / L.k.total, escala: 0.6, activa: p.id === 'energia' }));
        $('#h-d-t').textContent = 'El costo, de cada 100';
        $('#h-d-pie').textContent = `Con ${num(L.k.kwh)} kWh en ${DIVISIONES[pide.region].nombre}: la generación se lleva ${num((100 * (L.k.partes[0].importe + L.k.partes[1].importe)) / L.k.total)} de cada 100.`;
    } else if (pide.modo === 'dac') {
        const a = L.a;
        filas = [
            { t: 'Promedio de 12 meses, del límite', v: a.promedio / a.limite, activa: a.enDac, escala: 1.5 },
            { t: 'Del consumo del año, el clima', v: (a.promedio - BASE) / a.promedio, escala: 1 },
            { t: 'Pagas, de lo que cuesta', v: a.pago / (a.costo * 1.16), escala: 3 },
        ];
        $('#h-d-t').textContent = 'El año, de cada 100';
        $('#h-d-pie').textContent = a.enDac ? 'En la DAC la casa paga más de lo que cuesta llevarle la energía.' : `Le faltan ${num(a.limite - a.promedio)} kWh de promedio para pasar a la DAC.`;
    } else {
        filas = L.partes.map(p => ({ t: p.nombre, v: p.importe / (L.pdbt.energia), escala: 0.6, activa: p.id === 'energia' }));
        $('#h-d-t').textContent = 'El recibo de la tienda, de cada 100';
        $('#h-d-pie').textContent = 'Los mismos eslabones que una casa, sin aportación. Su cargo de generación es más del doble que el de una casa: la CNE reparte el costo según cómo consume cada tipo de usuario.';
    }
    $('#h-barras').innerHTML = barrasHTML(filas);
}

function alPintarFijas({ $ }) {
    $('#h-tarifas').innerHTML = tablaHTML(['Tarifa', 'Verano de', 'Bloques en verano', 'Límite DAC'], NOMBRES.map(n => {
        const b = TARIFAS[n].verano.bloques.filter(x => Number.isFinite(x[1])).map(x => num(x[1])).join(' + ');
        return [n, TEMPERATURA[n] ? `${TEMPERATURA[n]} °C` : '—', n === '1' ? `${b} (todo el año)` : b, `${num(LIMITE_DAC[n])} kWh`];
    }));
    const fila = (e, f) => [e.nombre, ...['central', 'noroeste'].flatMap(r => ['DB1', 'DB2'].map(c => f(COSTO.cargos(r, c).find(p => p.id === e.id))))];
    $('#h-eslabones').innerHTML = tablaHTML(['Eslabón', 'Valle de México, DB1', 'DB2', 'Noroeste, DB1', 'DB2'], ESLABONES.map(e => fila(e, p => (p.fijo != null ? `${f2(p.fijo)} al mes` : num(p.kwh, 4)))));
    $('#h-subsidio').innerHTML = tablaHTML(['Qué', 'Cuánto'], [
        ['Subsidios a las tarifas eléctricas, 2026', `${num(SUBSIDIO.pef2026, 1)} millones de $ (Presupuesto)`],
        ['Lo que recibió la CFE en 2025', `${num(SUBSIDIO.real2025, 1)} millones de $`],
        ['Usuarios domésticos, 2025', `${f1(SUBSIDIO.domesticos2025)} millones`],
        ['En la DAC, 2024', `${num(SUBSIDIO.dac2024)} usuarios`],
        ['Lo que usa una casa en promedio', `${num(SUBSIDIO.kwhMedio)} kWh al mes`],
        ['Precio medio de una casa, 2025', '1.60 $ por kWh'],
        ['Precio medio de la DAC, 2025', '6.38 $ por kWh'],
        ['Lo que sube cada mes la tarifa doméstica', '0.311 % (la inflación de un año, repartida)'],
    ]);
    $('#h-aparatos').innerHTML = tablaHTML(['Aparato', 'Watts', 'Uso', 'kWh al mes'], [...APARATOS.map(a => [a.nombre, num(a.w), a.uso, f1(a.kwhMes)]), [CLIMA.nombre, num(CLIMA.kw * 1000), '7 h al día', num(KWH_CLIMA_7)]]);
    $('#h-regla').innerHTML = tablaHTML(['Qué', 'Dónde lo dice'], [
        ['La CFE, como Suministradora de Servicios Básicos, vende a quien lo pida', 'LSE, arts. 3, fracc. LIV, y 63'],
        ['La CNE fija las metodologías de las Tarifas Reguladas: transmisión, distribución, suministro, CENACE y servicios conexos', 'LSE, art. 158'],
        ['La CNE aplica las tarifas finales del Suministro Básico y publica sus memorias de cálculo', 'LSE, art. 159'],
        ['El Ejecutivo puede fijar otro mecanismo para algunos usuarios; el recibo debe mostrar los componentes de la CNE', 'LSE, art. 159'],
        ['La SHCP fija las tarifas domésticas', 'Acuerdo presidencial, DOF 31 de diciembre de 2025'],
        ['Programas de Justicia Energética con apoyos focalizados', 'LSE, art. 132'],
        ['Con 1 MW o más, un centro de carga puede ser Usuario Calificado', 'RLSE, transitorio vigésimo sexto'],
    ]);
}

function alActualizar(L, pag) {
    const { pide, ponerCifra, ponerLecturas, nivel, graficas } = pag;
    pintarBarras(L, pag);
    ponerCifra('aT', { recibo: 'Tus kWh, bloque por bloque', costo: 'Lo que cuesta y quién lo paga', dac: 'Los 12 meses y el límite', negocio: 'Lo que cuesta cada kWh en 2025' }[pide.modo]);
    if (pide.modo === 'recibo' || pide.modo === 'costo') {
        const r = L.r;
        const k = L.k;
        const caro = [...r.bloques].reverse().find(b => b.kwh > 0);
        const gob = k.aportacion > 0 ? ['Pone el Gobierno', pesos(k.aportacion), `pagas ${num(k.pagaPct * 100)} de cada 100`] : ['Pagas de más', pesos(k.deMas), 'más que el costo'];
        const aviso = L.pasaDac ? `Si tu promedio de 12 meses pasa de ${num(L.limiteDac)} kWh, la casa pasa a la DAC.` : null;
        if (pide.modo === 'recibo') {
            ponerLecturas([['Pagas al mes', pesos(r.total), 'con IVA'], ['En dos meses', pesos(L.bimestre), 'el recibo suele ser bimestral'], ['Cada kWh', `${f2(r.medio)} $`, 'en promedio, sin IVA'], ['Bloque más caro', caro.nombre, `${f3(caro.precio)} $ por kWh`], ['Cuesta de verdad', pesos(k.total), `al mes, sin IVA (${k.categoria})`], gob], aviso);
        } else {
            const p = id => k.partes.find(x => x.id === id).importe;
            ponerLecturas([['Cuesta', pesos(k.total), `${f2(k.porKwh)} $ por kWh`], ['Generación', pesos(p('energia') + p('capacidad')), 'energía y capacidad'], ['Redes', pesos(p('transmision') + p('distribucion')), 'transmisión y distribución'], ['CFE y CENACE', pesos(p('suministro') + p('cenace') + p('scnmem')), 'suministro y operación'], ['Pagas', pesos(r.energia), 'sin IVA'], gob], aviso);
        }
        ponerCifra('hud', pesos(pide.modo === 'recibo' ? r.total : k.total));
        ponerCifra('hud2', pide.modo === 'recibo' ? `al mes, tarifa ${L.tarifa}, ${num(r.cobrar)} kWh` : `cuesta llevar ${num(k.kwh)} kWh`);
        graficas.b?.marcar(r.cobrar, pide.modo === 'recibo' ? r.total : 100 * k.razon);
        if (pide.modo === 'recibo') graficas.c?.marcar(r.cobrar, k.total);
        nivel(1, 'Consumo', clamp01(r.cobrar / L.limiteDac), `${num(r.cobrar)} kWh`);
        nivel(2, 'Pagas', clamp01(k.razon), `${num(k.razon * 100)} %`);
    } else if (pide.modo === 'dac') {
        const a = L.a;
        const x = L.ahora;
        const recibo = a.enDac ? x.dac.total : x.recibo.total;
        const aviso = a.enDac ? 'El promedio pasó el límite: todos los meses se cobran con la DAC hasta que baje.' : null;
        ponerLecturas([['Promedio de 12 meses', `${num(a.promedio)} kWh`, `límite: ${num(a.limite)}`], ['Tarifa', a.enDac ? 'DAC' : a.tarifa, a.enDac ? 'sin aportación' : 'con aportación'], ['Este mes', `${num(x.total)} kWh`, x.nombre], ['Recibo del mes', pesos(recibo), 'con IVA'], ['En el año', pesos(a.pago), 'con IVA'], ['Límite de clima', a.horasLimite > 24 ? 'no lo pasa' : `${f1(a.horasLimite)} h al día`, 'para pasar a la DAC']], aviso);
        ponerCifra('hud', a.enDac ? 'DAC' : `Tarifa ${a.tarifa}`);
        ponerCifra('hud2', `promedio ${num(a.promedio)} de ${num(a.limite)} kWh`);
        graficas.b?.marcar(pide.horasClima, a.pago / 1000);
        graficas.c?.marcar(L.mes, recibo);
        nivel(1, 'Promedio', clamp01(a.promedio / a.limite), `${num(a.promedio)} kWh`);
        nivel(2, 'Clima', clamp01(x.clima / 600), `${num(x.clima)} kWh`);
    } else {
        const t = L.pdbt;
        const casa = cobro('1', SUBSIDIO.kwhMedio, false);
        ponerLecturas([['La tienda paga', pesos(t.total), 'al mes, con IVA'], ['Cada kWh', `${f2(t.medio)} $`, 'sin IVA'], ['Cargo fijo', `${f2(t.fijo)} $`, 'al mes'], ['Una casa con poco consumo', `${f2(casa.medio)} $`, `por kWh, ${num(SUBSIDIO.kwhMedio)} kWh en tarifa 1`], ['Comercio en 2025', '4.12 $', 'precio medio por kWh'], ['Industria en media tensión', '2.75 $', 'precio medio por kWh, 2025']], null);
        ponerCifra('hud', pesos(t.total));
        ponerCifra('hud2', `al mes, tienda con ${num(L.tienda)} kWh`);
        graficas.b?.marcar(L.tienda, t.total);
        graficas.c?.marcar(Math.min(1500, L.tienda), t.medio);
        nivel(1, 'Consumo', clamp01(L.tienda / 3000), `${num(L.tienda)} kWh`);
        nivel(2, 'Cada kWh', clamp01(t.medio / 5), `${f2(t.medio)} $`);
    }
}

// ------------------------------------------------------------------ el sitio
const PIDE0 = { tarifaIdx: DEF.tarifaIdx, kwh: DEF.kwh, verano: DEF.verano, region: DEF.region, horasClima: DEF.horasClima, equipos: DEF.equipos, mes: DEF.mes, tienda: DEF.tienda, corre: false };
crearPagina({
    figura: FIGURA,
    fichas: FICHAS,
    vistas: VISTAS,
    modos: MODOS,
    botones: BOTONES,
    acciones: ACCIONES,
    modo0: 'recibo',
    pide: { ...PIDE0 },
    general: { Lx: 16, Lz: 7.3, alto: 2.4, mira: [0, 0.6, -0.35], az: 16, el: 32, azVertical: 10, elVertical: 40 },
    etiquetas: { lienzo: 'Calle con la casa, la red eléctrica y quién paga el recibo, en 3D: arrastra para girarla, toca un punto para conocerlo', modos: 'Qué ver de las tarifas', puntos: 'Puntos clave del recibo de luz', desarmar: 'Desarmar la calle', lecturas: 'Lo que dice el recibo' },
    textoFinal: 'Toca cualquier punto para volver a verlo. Sube los kWh en «Tu recibo», cambia la región en «Lo que cuesta», prende el clima en «Alto consumo» o mueve los kWh de la tienda.',
    colores: { guindaSuave: '#f3d4de', claro: '#ffffff' },
    crearDiagrama,
    secciones,
    escena: (renderer, scene, { movil, oscuro }) => {
        const M = materiales(P_PLANTA);
        const est = escenario(renderer, scene, M, { movil, oscuro });
        return { planta: construir(M, P_PLANTA, { movil, oscuro }), est };
    },
    alCambiarModo: (p, nuevo) => {
        const { tarifaIdx, region } = p;
        Object.assign(p, PIDE0);
        p.tarifaIdx = tarifaIdx;
        p.region = region;
        if (nuevo === 'dac') p.mes = 6;
        planta = estadoPlanta();
    },
    alCuadro: ({ dt, pide }) => {
        planta = pasoPlanta(planta, { modo: pide.modo }, dt);
    },
    poseDe: ({ pide, ve, encendido, t, dt, camara }) => pose({ modo: pide.modo, tarifaIdx: pide.tarifaIdx, kwh: pide.kwh, verano: pide.verano, region: pide.region, horasClima: pide.horasClima, equipos: pide.equipos, mes: pide.mes, tienda: pide.tienda, noche: ve.noche, adentro: ve.adentro, desarme: ve.desarme, encendido, t, dt, camara }),
    firma: p => [p.modo, Math.round(p.tarifaIdx), Math.round(p.kwh / 5), p.verano, p.region, Math.round(p.horasClima * 2), p.equipos, Math.round(p.mes), Math.round(p.tienda / 10)],
    alPintarFijas,
    alPintarGraficas,
    alActualizar,
    prueba: p => ({ tarifa: tarifaDe(p.tarifaIdx), kwh: Math.round(p.kwh), verano: p.verano, region: p.region, horasClima: +p.horasClima.toFixed(1), equipos: p.equipos, mes: Math.round(p.mes), tienda: Math.round(p.tienda), t: +planta.t.toFixed(1) }),
});
