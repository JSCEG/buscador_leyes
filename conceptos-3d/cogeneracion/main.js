// «Cogeneración», en 3D y con el formato Búho de «¿Cómo funciona?». Una fábrica con su planta de cogeneración del tamaño de la de Nuevo
// Pemex (turbina de gas, caldera de recuperación, vapor al proceso) y un ingenio azucarero que quema su bagazo, con la red y el CENACE.
// Cuatro formas de verlo: juntos o por separado, si es eficiente, la energía obligada y la despachable, y el ingenio en la zafra.
// Se arma con: node scripts/build-conceptos-3d.mjs cogeneracion
//
// Lo que se repite entre las plantas con física está en conceptos-3d/planta-comun/.
import { clamp01, num } from '../planta-comun/ayudas.js';
import { barrasHTML, leyenda, pintarGrafica, seccionBarras, seccionColores, seccionDiagrama, seccionFuentes, seccionGrafica, seccionTabla, tablaHTML } from '../planta-comun/graficas.js';
import { crearPagina } from '../planta-comun/pagina.js';
import { CEL, CICLO_NUEVO, DEF, ETA_MIN, FLUIDOS, INGENIOS, LIMITES, MESES, MW_POR_TH, NACIONAL, PARTES as PARTES_M, PLANTA, REALES, REF_E, REF_H, VAPOR_DIA, cuenta, estadoPlanta, ingenio, operar, pasoPlanta, pose, vaporMinimo } from './modelo.js';
import { P_PLANTA, construir, escenario, materiales } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';

const FIGURA = 'cogeneracion';
const f1 = x => num(x, 1);
const pct = x => `${num(x * 100)} %`;
const corto = m => MESES[Math.round(m)]?.slice(0, 3) ?? '';
const BASE = operar({ vapor: PLANTA.vaporBase });
const MINIMO = vaporMinimo('regla');

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'gas', nombre: 'Estación de gas', modo: 'juntos', accion: 'separado', eq: 'Mide y regula el gas', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 12h16M7 8v8M17 8v8"/><circle cx="12" cy="12" r="2.5"/>',
        texto: `Aquí entra el gas natural que quema la turbina. En la planta de ejemplo, a plena carga entran ${num(BASE.F)} MW de energía en gas; salen ${num(BASE.E)} MW de electricidad y ${num(BASE.H)} MW de vapor útil.` },
    { parte: 'turbina', nombre: 'Turbina de gas', modo: 'juntos', abrir: true, accion: 'poco', eq: `${num(PLANTA.mw)} MW, como Nuevo Pemex`, recorrido: { noche: false, adentro: true },
        icono: '<path d="M3 9l5-3v12l-5-3zM8 7h10v10H8"/><path d="M18 9l3 1v4l-3 1"/>',
        texto: `Quema el gas y mueve el generador. Sola aprovecha unas ${num(PLANTA.etaE * 100)} de cada 100 partes del combustible; el resto sale en gases de 430 a 590 °C, que la cogeneración usa en vez de tirarlos.` },
    { parte: 'generador', nombre: 'Generador', modo: 'despacho', abrir: true, accion: 'maximo', eq: 'Electricidad para la fábrica y la red', recorrido: { noche: false, adentro: true },
        icono: '<circle cx="12" cy="12" r="7"/><path d="M9 12h6M12 9v6"/>',
        texto: `Convierte el giro en electricidad. En la figura, la fábrica usa ${num(PLANTA.consumoFabrica + PLANTA.auxiliares)} MW y lo demás va a la red. Nuevo Pemex da toda la electricidad de su complejo y manda lo que sobra a otros centros de Pemex.` },
    { parte: 'recuperador', nombre: 'Caldera de recuperación', modo: 'juntos', abrir: true, accion: 'vapor800', eq: `${num(PLANTA.vaporBase)} t/h; ${num(PLANTA.vaporMax)} con postcombustión`, recorrido: { noche: false, adentro: true },
        icono: '<rect x="5" y="4" width="14" height="16" rx="1.5"/><path d="M9 4v16M13 4v16M17 4v16"/>',
        texto: `Con el calor de los gases hace vapor de alta presión: ${num(PLANTA.vaporBase)} t/h a plena carga. Con quemadores extra, la postcombustión, llega a ${num(PLANTA.vaporMax)} t/h, como en Nuevo Pemex.` },
    { parte: 'chimenea', nombre: 'Chimenea', modo: 'eficiente', accion: 'poco', eq: 'Lo que no se aprovecha', recorrido: { noche: false, adentro: false },
        icono: '<path d="M9 21V7h6v14M8 7h8M11 4c0-1 2-1 2-2"/>',
        texto: `Por aquí sale lo que no se usa. Si la fábrica pide poco vapor, el calor se tira y la planta deja de ahorrar: con menos de ${num(MINIMO)} t/h gasta más gas que producir lo mismo por separado.` },
    { parte: 'vapor', nombre: 'Vapor al proceso', modo: 'eficiente', accion: 'vapor500', eq: '42 kg/cm² y 385 °C', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 16h11a4 4 0 0 0 0-8"/><path d="M8 5c0 2 2 2 2 4M12 5c0 2 2 2 2 4"/>',
        texto: `Cada kg de vapor lleva ${num(PLANTA.kjPorKg)} kJ, como el de la refinería de Madero. Este calor útil es lo que hace eficiente a la cogeneración: sin él, la turbina sola desperdiciaría dos terceras partes del gas.` },
    { parte: 'proceso', nombre: 'Fábrica', modo: 'despacho', abrir: true, accion: 'madrugada', eq: 'El vapor manda', recorrido: { noche: false, adentro: true },
        icono: '<path d="M3 20V10l6 4V10l6 4V6h6v14z"/>',
        texto: 'Pide más vapor de día que de noche. La electricidad que sale de cubrir ese vapor es la energía obligada: el CENACE debe recibirla aunque no sea la más barata (LSE, art. 43).' },
    { parte: 'caldera', nombre: 'Caldera aparte', modo: 'juntos', accion: 'separado', eq: 'Producir por separado', recorrido: { noche: false, adentro: false },
        icono: '<rect x="4" y="9" width="12" height="9" rx="4"/><path d="M16 13h3M10 9V5"/>',
        texto: `Sin cogeneración, el vapor sale de una caldera como esta y la electricidad, de una central. La regla compara contra una caldera de ${num(REF_H.vapor * 100)} % y una central de 31 a 50 %, según el tamaño.` },
    { parte: 'trafo', nombre: 'Transformador y medición', modo: 'despacho', accion: 'maximo', eq: 'Mide lo que entra y sale', recorrido: { noche: false, adentro: false },
        icono: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
        texto: 'Sube el voltaje para la red. La planta mide la electricidad, el vapor y el gas de todo el año: con esas cifras se calcula si es eficiente y cuántos certificados le tocan.' },
    { parte: 'subestacion', nombre: 'Subestación', modo: 'despacho', accion: 'desarme', eq: 'Lo que sobra va a la red', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 20h16M7 20V8h10v12M7 12h10"/>',
        texto: 'Por aquí sale lo que la fábrica no usa. La capacidad del permiso se fija según el calor que pide el proceso, no según lo que la planta quiera vender (LSE, art. 42).' },
    { parte: 'cenace', nombre: 'CENACE', modo: 'despacho', accion: 'madrugada', eq: 'Obligada y despachable', recorrido: { noche: false, adentro: false },
        icono: '<rect x="3" y="5" width="18" height="11" rx="1.5"/><path d="M8 20h8M12 16v4M7 12l3-3 2 2 4-4"/>',
        texto: 'Recibe la energía obligada; la despachable entra solo si el mercado la pide. Si la planta ofrece como obligada más de lo que justifica el vapor durante seis meses, su permiso pierde su objeto.' },
    { parte: 'ingenio', nombre: 'Ingenio azucarero', modo: 'ingenio', abrir: true, accion: 'brasil', eq: `${num(INGENIOS.zafra.ingenios)} ingenios en la zafra 2025/26`, recorrido: { noche: false, adentro: true },
        icono: '<path d="M4 20V9l8-5 8 5v11z"/><path d="M9 20v-6h6v6"/>',
        texto: 'Muele la caña de noviembre a julio. De cada tonelada salen casi 300 kg de bagazo, que en vez de basura es su combustible: con él hace su vapor y su electricidad.' },
    { parte: 'bagazo', nombre: 'Bagazo', modo: 'ingenio', accion: 'agosto', eq: `${f1(INGENIOS.porTonelada.bagazo * 100)} % de la caña`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 19h18L14 8l-3 4-2-2z"/>',
        texto: 'Es lo que queda al exprimir la caña, con la mitad de agua. Como no es combustible fósil, la electricidad de un ingenio que solo quema bagazo cuenta 100 % como energía limpia.' },
    { parte: 'turbinaVapor', nombre: 'Caldera de bagazo y turbina de vapor', modo: 'ingenio', abrir: true, accion: 'brasil28', eq: `${f1(INGENIOS.porTonelada.kwh)} kWh por tonelada de caña`, recorrido: { noche: false, adentro: true },
        icono: '<rect x="4" y="5" width="7" height="15" rx="1"/><path d="M11 13h4l5-2v6l-5-2h-4"/>',
        texto: `Quema el bagazo, hace vapor y mueve una turbina. En 2023/24 los ingenios sacaron ${f1(INGENIOS.porTonelada.kwh)} kWh por tonelada; en Brasil la mayoría vende unos ${INGENIOS.brasil.comun} de excedente y los más modernos, ${INGENIOS.brasil.moderno}.` },
];
const VISTAS = Object.fromEntries(PARTES_M.map(p => [p.id, p.vista]));
let planta = estadoPlanta();
const relojDia = { texto: 'el día', avanzar: (p, dt) => { p.hora = (p.hora + dt * 1.2) % 24; return false; }, alSeguir: () => {} };
const relojAnio = { texto: 'el año', avanzar: (p, dt) => { p.mes = (p.mes + dt * 0.7) % 12; return false; }, alSeguir: () => {} };
const MANDO_VAPOR = { nombre: 'Vapor que pide la fábrica', campo: 'vapor', rango: LIMITES.vapor, texto: v => `${num(v)} t/h` };
const MODOS = {
    juntos: { nombre: 'Juntos o por separado', corto: 'Juntos', resumen: 'La cogeneración hace electricidad y vapor con el mismo gas. Compara cuánto quema contra producir lo mismo con una central y una caldera. Mueve el vapor que pide la fábrica.', aclara: `Planta de ejemplo del tamaño de Nuevo Pemex: ${num(PLANTA.mw)} MW y ${num(PLANTA.vaporBase)} t/h, hasta ${num(PLANTA.vaporMax)} con postcombustión. La eficiencia de la turbina y las condiciones del vapor son de ejemplo. Se compara con las eficiencias de referencia de la regla.`, mando: MANDO_VAPOR },
    eficiente: { nombre: '¿Es eficiente?', corto: 'Eficiente', resumen: 'La regla compara lo que costaría producir lo mismo por separado con lo que se quemó. Si ahorra, es eficiente, y lo que ahorra se vuelve energía libre de combustible, que recibe Certificados de Energías Limpias.', aclara: 'Cuenta de la CRE vigente (RES/1838/2016 con A/018/2023): central de 277 MW a 115 kV, eficiencia de referencia de 47 %, factor de pérdidas de 0.98 y caldera de 90 %. Las horas de operación son de ejemplo.', mando: MANDO_VAPOR, mando2: { nombre: 'Horas al año', campo: 'horasAnio', rango: LIMITES.horasAnio, texto: v => `${num(v)} h` } },
    despacho: { nombre: 'Obligada y despachable', corto: 'Despacho', resumen: 'La electricidad que sale de cubrir el vapor es obligada: el CENACE debe recibirla. Lo que la planta podría dar de más es despachable: entra solo si el mercado la pide. Recorre el día.', aclara: 'Vapor y consumo de la fábrica de ejemplo. Ofertas como dice el transitorio tercero de las Disposiciones de Cogeneración: el mínimo es la obligada y el máximo, la capacidad menos lo que usa la fábrica.', mando: { nombre: 'Hora', campo: 'hora', rango: LIMITES.hora, texto: v => `${Math.floor(v)}:00 · ${num(VAPOR_DIA[Math.floor(v) % 24])} t/h de vapor` }, reloj: relojDia },
    ingenio: { nombre: 'Ingenio azucarero', corto: 'Ingenio', resumen: 'Un ingenio quema el bagazo de su caña para hacer vapor y electricidad durante la zafra, de noviembre a julio. Mueve el mes y prueba vender excedentes como los ingenios de Brasil.', aclara: 'Un ingenio del tamaño promedio de la zafra 2025/26 (1.06 millones de toneladas de caña), con lo que dio cada tonelada en 2023/24 según la CONADESUCA.', mando: { nombre: 'Mes', campo: 'mes', rango: LIMITES.mes, texto: v => MESES[Math.round(v)] }, mando2: { nombre: 'Excedente que vende', campo: 'excedente', rango: LIMITES.excedente, texto: v => (v < 0.5 ? 'nada' : `${num(v)} kWh por tonelada`) }, reloj: relojAnio },
};
const BOTONES = [
    { id: 'separado', visible: p => p.modo === 'juntos', pulsado: p => p.separado, texto: p => (p.separado ? 'Ver: por separado' : 'Ver: juntos'), alTocar: p => { p.separado = !p.separado; } },
    { id: 'ref', visible: p => p.modo === 'juntos', pulsado: p => p.ref === 'nuevo', texto: p => (p.ref === 'nuevo' ? `Contra: ciclo nuevo (${num(CICLO_NUEVO * 100)} %)` : 'Contra: la regla (47 %)'), alTocar: p => { p.ref = p.ref === 'nuevo' ? 'regla' : 'nuevo'; } },
    { id: 'maximo', visible: p => p.modo === 'despacho', pulsado: p => p.maximo, texto: p => (p.maximo ? 'El mercado pide: el máximo' : 'El mercado pide: lo mínimo'), alTocar: p => { p.maximo = !p.maximo; } },
];
const ACCIONES = {
    separado: { texto: p => (p.separado ? 'Ver juntos' : 'Ver por separado'), hacer: (p, pag) => { p.separado = !p.separado; pag.invalidar(); pag.ponerMando(); } },
    poco: { texto: p => (p.vapor <= 200 ? 'Ver 500 t/h' : 'Ver 200 t/h'), hacer: (p, pag) => { p.vapor = p.vapor <= 200 ? 500 : 200; pag.invalidar(); pag.ponerMando(); } },
    vapor800: { texto: p => (p.vapor >= 790 ? 'Ver 500 t/h' : 'Ver 800 t/h'), hacer: (p, pag) => { p.vapor = p.vapor >= 790 ? 500 : 800; pag.invalidar(); pag.ponerMando(); } },
    vapor500: { texto: () => 'Ver 500 t/h', hacer: (p, pag) => { p.vapor = 500; pag.invalidar(); pag.ponerMando(); } },
    maximo: { texto: p => (p.maximo ? 'Ver solo la obligada' : 'Ver el máximo'), hacer: (p, pag) => { p.maximo = !p.maximo; pag.invalidar(); pag.ponerMando(); } },
    madrugada: { texto: p => (Math.floor(p.hora) < 6 ? 'Ver el mediodía' : 'Ver las 3 de la mañana'), hacer: (p, pag) => { p.hora = Math.floor(p.hora) < 6 ? 12 : 3; p.corre = false; pag.invalidar(); pag.ponerMando(); } },
    brasil: { texto: p => (p.excedente >= 70 ? 'Sin vender excedentes' : 'Vender 72 kWh por tonelada'), hacer: (p, pag) => { p.excedente = p.excedente >= 70 ? 0 : 72; pag.invalidar(); pag.ponerMando(); } },
    brasil28: { texto: p => (Math.abs(p.excedente - 28) < 1 ? 'Sin vender excedentes' : 'Vender 28 kWh por tonelada'), hacer: (p, pag) => { p.excedente = Math.abs(p.excedente - 28) < 1 ? 0 : 28; pag.invalidar(); pag.ponerMando(); } },
    agosto: { texto: p => (Math.round(p.mes) === 7 ? 'Ver febrero' : 'Ver agosto'), hacer: (p, pag) => { p.mes = Math.round(p.mes) === 7 ? 1 : 7; p.corre = false; pag.invalidar(); pag.ponerMando(); } },
};

// ------------------------------------------------------------------ el tablero
const secciones = () => `
    ${seccionDiagrama('Juntos o por separado')}
    ${seccionGrafica('b')}
    ${seccionGrafica('c')}
    ${seccionBarras()}
    ${seccionTabla('Las eficiencias de referencia', 'h-reglas', 'RES/1838/2016 y RES/003/2011 de la CRE, con los valores del Acuerdo A/018/2023. Siguen vigentes mientras la CNE emite sus Criterios Técnicos de Cogeneración.')}
    ${seccionTabla('Cogeneraciones de México', 'h-reales', 'Banobras, IDOM, Abengoa, Cuenta Pública 2024 y SENER (PLADESE 2025-2039).', 'h-tabla-texto')}
    ${seccionTabla('Los ingenios azucareros', 'h-ingenios', 'CONADESUCA: zafra 2025/26 y 11° Informe estadístico (zafra 2023/24).', 'h-tabla-texto')}
    ${seccionTabla('Lo que dice la ley', 'h-regla', 'Ley del Sector Eléctrico, su reglamento y las Disposiciones de Cogeneración de la CNE.')}
    ${seccionColores(FLUIDOS, 'Las reglas, el tamaño de la planta (Nuevo Pemex), las cifras del país y de los ingenios son reales; la eficiencia de la turbina, las condiciones del vapor, la demanda de la fábrica y las horas de operación son de ejemplo.', 'Colores de lo que corre')}
    ${seccionFuentes(FUENTES, [
        { para: 'Que la cogeneración cuenta como energía limpia si es eficiente, igual que los ingenios; que el permiso puede tener la modalidad de cogeneración; qué es; que su capacidad se limita al calor que no aprovecha el proceso; y su despacho obligado', titulo: 'Ley del Sector Eléctrico, arts. 3, 18, 41, 42 y 43', nota: 'Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio' },
        { para: 'Qué es la cogeneración, en qué figuras se da, cómo se fija su capacidad y su despacho obligado, y que la eficiente recibe Certificados por su energía libre de combustible fósil', titulo: 'Reglamento de la Ley del Sector Eléctrico, arts. 89 a 92 y 191', nota: 'Diario Oficial de la Federación, 3 de octubre de 2025. Está en el acervo de este sitio' },
    ])}`;

const VAPOR_X = { xMin: 0, xMax: 800, ticksX: [0, 200, 400, 600, 800], etX: 't/h de vapor', fx: x => num(x) };
const MES_X = { xMin: 0, xMax: 11, ticksX: [0, 2, 4, 6, 8, 10], etX: 'Mes', fx: x => corto(x) };
const HORA_X = { xMin: 0, xMax: 24, ticksX: [0, 6, 12, 18, 24], etX: 'Hora', fx: x => num(x) };
const escala = (max, paso) => { const tope = Math.max(paso, Math.ceil((max * 1.08) / paso) * paso); return { yMax: tope, ticksY: Array.from({ length: Math.floor(tope / paso) + 1 }, (_, i) => i * paso) }; };
const kDe = (v, ref = 'regla') => cuenta(operar({ vapor: v }), { ref });

function alPintarGraficas(L, pag) {
    const { $, pide, graficas } = pag;
    const m = pide.modo;
    graficas.b = null;
    graficas.c = null;
    if (m === 'juntos') {
        const lb = [{ clase: 'h-s-actual', nombre: 'Juntos', f: x => operar({ vapor: x }).F }, { clase: 'h-s-sin', nombre: 'Por separado', f: x => kDe(x, pide.ref).EP }];
        $('#h-b-t').textContent = 'El gas que se quema';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `MW de combustible según el vapor que pide la fábrica, con la turbina a plena carga. Arriba de ${num(L.minimo)} t/h, la cogeneración quema menos que producir lo mismo por separado.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'El gas que se quema', ...VAPOR_X, yMin: 0, yMax: 1400, ticksY: [0, 350, 700, 1050, 1400], etY: 'MW', lineas: lb, fy: y => num(y), punta: x => `${num(x)} t/h · juntos ${num(lb[0].f(x))} · separado ${num(lb[1].f(x))} MW` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Vapor', 'Juntos', 'Por separado', 'Ahorro'], [0, 200, 300, 400, 500, 650, 800].map(v => { const k = kDe(v, pide.ref); return [`${num(v)} t/h`, `${num(operar({ vapor: v }).F)} MW`, `${num(k.EP)} MW`, pct(k.APEP)]; }));
        const lc = [{ clase: 'h-s-actual', nombre: 'Contra la regla (47 %)', f: x => 100 * kDe(x).APEP }, { clase: 'h-s-sin', nombre: `Contra un ciclo nuevo (${num(CICLO_NUEVO * 100)} %)`, f: x => 100 * kDe(x, 'nuevo').APEP }, { clase: 'h-s-norma', nombre: 'Sin ahorro', f: () => 0 }];
        $('#h-c-t').textContent = 'Lo que ahorra';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `De cada 100 partes de gas que se quemarían por separado. Contra un ciclo combinado nuevo, que ya es muy eficiente, el ahorro es menor: se necesitan unas ${num(vaporMinimo('nuevo'))} t/h para empezar a ahorrar.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Lo que ahorra', ...VAPOR_X, yMin: -80, yMax: 40, ticksY: [-80, -40, 0, 40], etY: 'de cada 100', lineas: lc, fy: y => num(y), punta: x => `${num(x)} t/h · ${num(lc[0].f(x))} · ${num(lc[1].f(x))} de cada 100` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Vapor', 'Contra la regla', 'Contra un ciclo nuevo'], [200, 300, 400, 500, 650, 800].map(v => [`${num(v)} t/h`, pct(kDe(v).APEP), pct(kDe(v, 'nuevo').APEP)]));
    } else if (m === 'eficiente') {
        const lb = [{ clase: 'h-s-verde', nombre: 'Libre de combustible', f: x => 100 * kDe(x).pctELC }, { clase: 'h-s-norma', nombre: 'Umbral: mayor que cero', f: () => 0 }];
        $('#h-b-t').textContent = 'La energía libre de combustible';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `De cada 100 MWh que genera. Es eficiente si la línea verde pasa de cero: con ${num(L.minimo)} t/h o más. Con la postcombustión sube el vapor, pero también el gas: el porcentaje casi no cambia.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'La energía libre de combustible', ...VAPOR_X, yMin: -40, yMax: 40, ticksY: [-40, -20, 0, 20, 40], etY: 'de cada 100', lineas: lb, fy: y => num(y), punta: x => `${num(x)} t/h · ${num(lb[0].f(x))} de cada 100 MWh` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Vapor', 'Ahorro', 'Libre de combustible', '¿Eficiente?'], [100, 200, 250, 300, 400, 500, 800].map(v => { const k = kDe(v); return [`${num(v)} t/h`, `${num(k.AEP)} MW`, pct(k.pctELC), k.eficiente ? 'sí' : 'no']; }));
        const lc = [{ clase: 'h-s-actual', nombre: 'Cogeneración eficiente', puntos: NACIONAL.mw.map(([a, x]) => [a, x]) }];
        $('#h-c-t').textContent = 'La cogeneración eficiente en México';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `MW instalados. En 2024 eran ${num(NACIONAL.mw.at(-1)[1])} MW: ${f1((100 * NACIONAL.mw.at(-1)[1]) / NACIONAL.mwSen2024)} % de la capacidad del país; dieron ${num(NACIONAL.gwh2024)} GWh, ${f1((100 * NACIONAL.gwh2024) / NACIONAL.gwhLimpia2024)} % de la generación limpia.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'La cogeneración eficiente en México', xMin: 2014, xMax: 2024, ticksX: [2014, 2016, 2018, 2020, 2022, 2024], etX: 'Año', fx: x => String(Math.round(x)), yMin: 0, yMax: 2500, ticksY: [0, 500, 1000, 1500, 2000, 2500], etY: 'MW', quebradas: lc, fy: y => num(y), punta: x => { const a = NACIONAL.mw.find(([y]) => y === Math.round(x)); return a ? `${a[0]} · ${num(a[1])} MW` : ''; } });
        $('#h-tabla-c').innerHTML = tablaHTML(['Año', 'MW'], NACIONAL.mw.map(([a, x]) => [String(a), num(x)]));
    } else if (m === 'despacho') {
        const lb = [{ clase: 'h-s-actual', nombre: 'Obligada', puntos: L.diaMin.map((d, h) => [h + 0.5, d.obligada]) }, { clase: 'h-s-sin', nombre: 'Lo más que puede dar a la red', puntos: L.diaMin.map((d, h) => [h + 0.5, d.maximoRed]) }];
        $('#h-b-t').textContent = 'Lo que va a la red';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = 'MW cada hora. La obligada sigue al vapor de la fábrica; entre ella y la línea de arriba está la despachable. De noche la fábrica usa casi todo y no hay obligada.';
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Lo que va a la red', ...HORA_X, yMin: 0, yMax: 160, ticksY: [0, 40, 80, 120, 160], etY: 'MW', quebradas: lb, fy: y => num(y), punta: x => { const d = L.diaMin[Math.min(23, Math.floor(x))]; return `${Math.floor(x)}:00 · obligada ${num(d.obligada)} · máximo ${num(d.maximoRed)} MW`; } });
        $('#h-tabla-b').innerHTML = tablaHTML(['Hora', 'Vapor', 'Obligada', 'Despachable'], L.diaMin.filter((_, h) => h % 3 === 0).map(d => [`${d.h}:00`, `${num(d.vapor)} t/h`, `${num(d.obligada)} MW`, `${num(d.despachable)} MW`]));
        const lc = [{ clase: 'h-s-rojo', nombre: 'Vapor que pide', puntos: VAPOR_DIA.map((v, h) => [h + 0.5, v]) }];
        $('#h-c-t').textContent = 'El vapor de la fábrica';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `t/h cada hora, de ejemplo. La planta registra ante el CENACE su demanda térmica más alta, la más baja y la que espera 80 % del tiempo (Disposiciones de Cogeneración, numeral 2.8).`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'El vapor de la fábrica', ...HORA_X, yMin: 0, yMax: 600, ticksY: [0, 150, 300, 450, 600], etY: 't/h', quebradas: lc, fy: y => num(y), punta: x => `${Math.floor(x)}:00 · ${num(VAPOR_DIA[Math.min(23, Math.floor(x))])} t/h` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Hora', 'Vapor'], VAPOR_DIA.map((v, h) => [`${h}:00`, `${num(v)} t/h`]).filter((_, h) => h % 2 === 0));
    } else {
        const lb = [{ clase: 'h-s-amarillo', nombre: 'Genera', puntos: L.anio.map((x, i) => [i, x.generaMWh]) }, ...(L.excedente > 0.5 ? [{ clase: 'h-s-verde', nombre: 'Vendería', puntos: L.anio.map((x, i) => [i, x.vendeMWh]) }] : [])];
        const mx = Math.max(...L.anio.map(x => Math.max(x.generaMWh, x.vendeMWh)));
        $('#h-b-t').textContent = 'Un día de cada mes';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `MWh al día en un ingenio promedio. Fuera de zafra, de agosto a octubre, no hay caña ni bagazo. Genera ${f1(INGENIOS.porTonelada.kwh)} kWh por tonelada de caña.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Un día de cada mes', ...MES_X, yMin: 0, ...escala(mx, mx > 200 ? 100 : 25), etY: 'MWh al día', quebradas: lb, fy: y => num(y), punta: x => { const k = L.anio[Math.round(x)]; return `${MESES[Math.round(x)]} · genera ${num(k.generaMWh)} · vendería ${num(k.vendeMWh)} MWh`; } });
        $('#h-tabla-b').innerHTML = tablaHTML(['Mes', 'Caña al día', 'Genera', 'Vendería'], L.anio.map((x, i) => [MESES[i], `${num(x.caniaDia)} t`, `${num(x.generaMWh)} MWh`, `${num(x.vendeMWh)} MWh`]));
        const lc = [{ clase: 'h-s-verde', nombre: 'Todos los ingenios', f: x => ingenio({ excedente: x }).nacionalGWh }];
        $('#h-c-t').textContent = 'Si todos vendieran excedentes';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `GWh en una zafra con la caña de 2025/26. Como los ingenios comunes de Brasil (${INGENIOS.brasil.comun} kWh por tonelada): ${num(ingenio({ excedente: INGENIOS.brasil.comun }).nacionalGWh)} GWh; como los más modernos (${INGENIOS.brasil.moderno}): ${num(ingenio({ excedente: INGENIOS.brasil.moderno }).nacionalGWh)}.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Si todos vendieran excedentes', xMin: 0, xMax: 72, ticksX: [0, 24, 48, 72], etX: 'kWh por tonelada que vende', fx: x => num(x), yMin: 0, yMax: 4000, ticksY: [0, 1000, 2000, 3000, 4000], etY: 'GWh', lineas: lc, fy: y => num(y), punta: x => `${num(x)} kWh/t · ${num(lc[0].f(x))} GWh` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Vende por tonelada', 'Todo el país'], [0, 10, 28, 50, 72].map(x => [`${x} kWh`, `${num(ingenio({ excedente: x }).nacionalGWh)} GWh`]));
    }
}

function pintarBarras(L, pag) {
    const { $, pide } = pag;
    let filas;
    if (pide.modo === 'juntos') {
        const op = L.op;
        filas = [
            { t: 'Del gas, electricidad', v: op.etaE, activa: true, escala: 1 },
            { t: 'Del gas, vapor útil', v: op.etaH, escala: 1 },
            { t: 'Del gas, se pierde', v: op.perdidas / op.F, escala: 1 },
        ];
        $('#h-d-t').textContent = 'El gas, de cada 100';
        $('#h-d-pie').textContent = `Aprovecha ${num(op.total * 100)} de cada 100 partes del gas. Una turbina sola aprovecharía unas ${num(PLANTA.etaE * 100)}.`;
    } else if (pide.modo === 'eficiente') {
        const k = L.k;
        filas = [
            { t: 'Energía libre de combustible', v: Math.max(0, k.pctELC), activa: k.eficiente, escala: 1 },
            { t: 'Ahorro de energía primaria', v: Math.max(0, k.APEP), escala: 1 },
            { t: 'Prueba anterior, ahorro', v: Math.max(0, Math.min(1, k.h)), escala: 1 },
        ];
        $('#h-d-t').textContent = 'La cuenta, de cada 100';
        $('#h-d-pie').textContent = `La prueba anterior pide ${num(k.hMin * 100)} % de ahorro a una central de 100 MW o más: ${k.cumpleAnterior ? 'la pasa' : 'no la pasa'}. Para los certificados basta con ahorrar algo.`;
    } else if (pide.modo === 'despacho') {
        const a = L.ahora;
        filas = [
            { t: 'Carga de la turbina', v: a.carga, activa: true, escala: 1 },
            { t: 'Lo que va a la red, del máximo', v: a.maximoRed > 0 ? a.aRed / a.maximoRed : 0, escala: 1 },
            { t: 'Energía libre de combustible', v: Math.max(0, a.k.pctELC), escala: 1 },
        ];
        $('#h-d-t').textContent = 'Esta hora, de cada 100';
        $('#h-d-pie').textContent = L.maximo ? 'Al dar el máximo, sobra calor que no pide la fábrica y sale por la chimenea: baja la energía libre de combustible.' : 'Con solo la obligada, la turbina da lo que exige el vapor y casi no se tira calor.';
    } else {
        filas = [
            { t: 'De la caña, bagazo', v: INGENIOS.porTonelada.bagazo, activa: true, escala: 1 },
            { t: 'Del bagazo, agua', v: INGENIOS.porTonelada.humedad, escala: 1 },
            { t: 'Energía limpia, solo con bagazo', v: L.pctELC, escala: 1 },
        ];
        $('#h-d-t').textContent = 'El ingenio, de cada 100';
        $('#h-d-pie').textContent = `En 2023/24, ${INGENIOS.anterior.conPetroleo} de ${INGENIOS.anterior.ingenios} ingenios todavía usaban petróleo; esa parte no cuenta como limpia.`;
    }
    $('#h-barras').innerHTML = barrasHTML(filas);
}

function alPintarFijas({ $ }) {
    $('#h-reglas').innerHTML = tablaHTML(['Tamaño de la central', 'Eficiencia de referencia'], [
        ...REF_E.map(([tope, r], i) => {
            const desde = i ? REF_E[i - 1][0] : 0;
            return [i === 0 ? 'electricidad, menos de 0.5 MW' : Number.isFinite(tope) ? `electricidad, de ${num(desde, desde < 1 ? 1 : 0)} a ${num(tope)} MW` : `electricidad, más de ${num(desde)} MW`, pct(r)];
        }),
        ['vapor o agua caliente', pct(REF_H.vapor)],
        ['prueba anterior: ahorro mínimo', ETA_MIN.map(([, e]) => pct(e)).join(', ')],
    ]);
    $('#h-reales').innerHTML = tablaHTML(['Planta', 'Capacidad', 'Vapor o energía', 'Nota'], [...REALES, ['Nuevas de Pemex y CFE', `${num(NACIONAL.nuevas.reduce((s, n) => s + n[1], 0))} MW`, NACIONAL.nuevas.map(n => `${n[0]} ${num(n[1])}`).join(', '), 'en 2029 y 2030, según el PLADESE']]);
    const z = INGENIOS.zafra;
    $('#h-ingenios').innerHTML = tablaHTML(['Qué', 'Cuánto'], [
        ['Ingenios en la zafra 2025/26', num(z.ingenios)],
        ['Zafra', `del ${z.inicio} al ${z.fin} (${num(z.dias)} días)`],
        ['Caña molida', `${f1(z.caniaT / 1e6)} millones de t`],
        ['Azúcar', `${f1(z.azucarT / 1e6)} millones de t`],
        ['Bagazo por tonelada de caña (2023/24)', `${num(INGENIOS.porTonelada.bagazo * 1000)} kg, ${num(INGENIOS.porTonelada.humedad * 100)} % de agua`],
        ['Vapor por tonelada de caña', `${num(INGENIOS.porTonelada.vapor * 1000)} kg`],
        ['Electricidad por tonelada de caña', `${f1(INGENIOS.porTonelada.kwh)} kWh`],
        ['Electricidad de todos los ingenios, 2023/24', `${num(INGENIOS.anterior.kwh / 1e6)} GWh`],
    ]);
    $('#h-regla').innerHTML = tablaHTML(['Qué', 'Dónde lo dice'], [
        ['La cogeneración eficiente y los ingenios son energía limpia', 'LSE, art. 3'],
        ['El permiso de generación puede tener la modalidad de cogeneración', 'LSE, arts. 18 y 41'],
        ['Su capacidad: solo la potencia del calor que no aprovecha el proceso', 'LSE, art. 42; RLSE, art. 91'],
        ['Despacho obligado, limitado a lo que exige el calor del proceso', 'LSE, art. 43; RLSE, art. 92'],
        ['Qué es: electricidad y calor en secuencia, de una sola fuente', 'RLSE, art. 89'],
        ['Certificados por el porcentaje de energía libre de combustible fósil', 'RLSE, art. 191'],
        ['Energía obligada y energía despachable', 'Disposiciones de Cogeneración, numeral 1.4'],
        ['Pierde su objeto si ofrece como obligada más de lo que justifica el calor seis meses seguidos', 'Disposiciones de Cogeneración, numeral 3.7'],
    ]);
}

function alActualizar(L, pag) {
    const { pide, ponerCifra, ponerLecturas, nivel, graficas } = pag;
    pintarBarras(L, pag);
    ponerCifra('aT', { juntos: 'Juntos o por separado', eficiente: '¿Es eficiente?', despacho: 'Obligada y despachable', ingenio: 'El ingenio en la zafra' }[pide.modo]);
    if (pide.modo === 'juntos') {
        const { op, k } = L;
        const aviso = op.post > 0.5 ? `Pide más de ${num(PLANTA.vaporBase)} t/h: entra la postcombustión, que quema gas aparte.` : op.tirado > 1 ? `Sobra calor: ${num(op.tirado)} MW salen por la chimenea.` : null;
        ponerLecturas([['Gas', `${num(op.F)} MW`, 'lo que se quema'], ['Electricidad', `${num(op.E)} MW`, `${num(op.etaE * 100)} % del gas`], ['Vapor útil', `${num(op.vaporTh)} t/h`, `${num(op.H)} MW`], ['Por separado', `${num(k.EP)} MW`, `central de ${num(k.RefE * 100)} % y caldera de 90 %`], [k.AEP >= 0 ? 'Ahorra' : 'Gasta de más', `${num(Math.abs(k.AEP))} MW`, `${num(Math.abs(k.APEP) * 100)} de cada 100`], ['Aprovecha', `${num(op.total * 100)} %`, 'del gas']], aviso);
        ponerCifra('hud', `${k.AEP >= 0 ? '' : '−'}${num(Math.abs(k.APEP) * 100)} %`);
        ponerCifra('hud2', pide.separado ? 'por separado: caldera y red' : k.AEP >= 0 ? 'de gas que ahorra' : 'gasta más que por separado');
        graficas.b?.marcar(L.vapor, op.F);
        graficas.c?.marcar(L.vapor, 100 * k.APEP);
        nivel(1, 'Vapor', clamp01(L.vapor / PLANTA.vaporMax), `${num(L.vapor)} t/h`);
        nivel(2, 'Aprovecha', clamp01(op.total), `${num(op.total * 100)} %`);
    } else if (pide.modo === 'eficiente') {
        const { op, k } = L;
        const aviso = k.eficiente ? null : 'No ahorra combustible: no es cogeneración eficiente ni recibe certificados.';
        ponerLecturas([['¿Eficiente?', k.eficiente ? 'sí' : 'no', 'si ahorra algo de combustible'], [k.AEP >= 0 ? 'Ahorro' : 'Gasta de más', `${num(Math.abs(k.AEP))} MW`, `${num(Math.abs(k.APEP) * 100)} de cada 100`], ['Libre de combustible', k.eficiente ? `${f1(k.pctELC * 100)} %` : 'nada', `${num(Math.max(0, k.ELC))} MW`], ['Certificados al año', num(L.cel), `con ${num(L.horasAnio)} horas`], ['Electricidad al año', `${num(L.mwh / 1000)} GWh`, `${num(op.E)} MW`], ['Prueba anterior', k.cumpleAnterior ? 'la pasa' : 'no la pasa', `pide ${num(k.hMin * 100)} % de ahorro`]], aviso);
        ponerCifra('hud', `${f1(k.pctELC * 100)} %`);
        ponerCifra('hud2', 'libre de combustible');
        graficas.b?.marcar(L.vapor, 100 * k.pctELC);
        nivel(1, 'Vapor', clamp01(L.vapor / PLANTA.vaporMax), `${num(L.vapor)} t/h`);
        nivel(2, 'Libre', clamp01(k.pctELC), `${f1(k.pctELC * 100)} %`);
    } else if (pide.modo === 'despacho') {
        const a = L.ahora;
        const aviso = L.maximo && a.op.tirado > 1 ? `Para dar el máximo se tiran ${num(a.op.tirado)} MW de calor por la chimenea.` : null;
        ponerLecturas([['Vapor', `${num(a.vapor)} t/h`, `${Math.floor(a.h)}:00`], ['Obligada', `${num(a.obligada)} MW`, 'el CENACE debe recibirla'], ['Despachable', `${num(a.despachable)} MW`, 'si el mercado la pide'], ['A la red', `${num(a.aRed)} MW`, L.maximo ? 'el máximo' : 'lo mínimo'], ['La fábrica', `${num(a.propio)} MW`, 'con usos auxiliares'], ['Turbina', `${num(a.carga * 100)} %`, `${num(a.carga * PLANTA.mw)} MW`]], aviso);
        ponerCifra('hud', `${num(a.aRed)} MW`);
        ponerCifra('hud2', `a la red, ${Math.floor(a.h)}:00`);
        graficas.b?.marcar(a.h + 0.5, a.obligada);
        graficas.c?.marcar(a.h + 0.5, a.vapor);
        nivel(1, 'Turbina', clamp01(a.carga), `${num(a.carga * 100)} %`);
        nivel(2, 'Vapor', clamp01(a.vapor / PLANTA.vaporMax), `${num(a.vapor)} t/h`);
    } else {
        const aviso = L.zafra ? null : 'Fuera de zafra: el ingenio no muele, no hay bagazo ni electricidad.';
        ponerLecturas([['Caña al día', `${num(L.caniaDia)} t`, MESES[L.mes]], ['Bagazo', `${num(L.bagazoDia)} t`, 'al día'], ['Vapor', `${num(L.vaporTh)} t/h`, 'para el proceso y la turbina'], ['Genera', `${num(L.generaMWh)} MWh`, `al día, ${f1(L.mwPromedio)} MW`], ['Vendería', `${num(L.vendeMWh)} MWh`, `al día, ${f1(L.mwVende)} MW`], ['Todo el país', `${num(L.nacionalGWh)} GWh`, 'en una zafra, vendiendo así']], aviso);
        ponerCifra('hud', `${f1(L.mwPromedio)} MW`);
        ponerCifra('hud2', L.zafra ? `con bagazo, ${MESES[L.mes]}` : 'fuera de zafra');
        graficas.b?.marcar(L.mes, L.generaMWh);
        graficas.c?.marcar(L.excedente, L.nacionalGWh);
        nivel(1, 'Zafra', L.zafra ? 1 : 0, L.zafra ? 'sí' : 'no');
        nivel(2, 'Vende', clamp01(L.excedente / 72), `${num(L.excedente)} kWh/t`);
    }
}

// ------------------------------------------------------------------ el sitio
const PIDE0 = { vapor: DEF.vapor, ref: DEF.ref, separado: DEF.separado, horasAnio: DEF.horasAnio, hora: DEF.hora, maximo: DEF.maximo, mes: DEF.mes, excedente: DEF.excedente, corre: false };
crearPagina({
    figura: FIGURA,
    fichas: FICHAS,
    vistas: VISTAS,
    modos: MODOS,
    botones: BOTONES,
    acciones: ACCIONES,
    modo0: 'juntos',
    pide: { ...PIDE0 },
    general: { Lx: 16, Lz: 7.4, alto: 2.6, mira: [0, 0.6, -0.3], az: 16, el: 32, azVertical: 10, elVertical: 40 },
    etiquetas: { lienzo: 'Planta de cogeneración e ingenio azucarero en 3D: arrastra para girarlos, toca un punto para conocerlo', modos: 'Qué ver de la cogeneración', puntos: 'Puntos clave de la cogeneración', desarmar: 'Desarmar la planta', lecturas: 'Lo que mide la planta' },
    textoFinal: 'Toca cualquier punto para volver a verlo. Baja el vapor en «Juntos o por separado», mira cuándo deja de ser eficiente, recorre el día de la fábrica o vende excedentes en el ingenio.',
    colores: { guindaSuave: '#f3d4de', claro: '#ffffff' },
    crearDiagrama,
    secciones,
    escena: (renderer, scene, { movil, oscuro }) => {
        const M = materiales(P_PLANTA);
        const est = escenario(renderer, scene, M, { movil, oscuro });
        return { planta: construir(M, P_PLANTA, { movil, oscuro }), est };
    },
    alCambiarModo: (p, nuevo) => {
        const { vapor } = p;
        Object.assign(p, PIDE0);
        if (nuevo === 'eficiente') p.vapor = vapor;
        planta = estadoPlanta();
    },
    alCuadro: ({ dt, pide }) => {
        planta = pasoPlanta(planta, { modo: pide.modo }, dt);
    },
    poseDe: ({ pide, ve, encendido, t, dt, camara }) => pose({ modo: pide.modo, vapor: pide.vapor, ref: pide.ref, separado: pide.separado, horasAnio: pide.horasAnio, hora: pide.hora, maximo: pide.maximo, mes: pide.mes, excedente: pide.excedente, noche: ve.noche, adentro: ve.adentro, desarme: ve.desarme, encendido, t, dt, camara }),
    firma: p => [p.modo, Math.round(p.vapor / 5), p.ref, p.separado, Math.round(p.horasAnio / 100), Math.floor(p.hora), p.maximo, Math.round(p.mes), Math.round(p.excedente)],
    alPintarFijas,
    alPintarGraficas,
    alActualizar,
    prueba: p => ({ vapor: Math.round(p.vapor), ref: p.ref, separado: p.separado, horasAnio: Math.round(p.horasAnio), hora: +p.hora.toFixed(1), maximo: p.maximo, mes: Math.round(p.mes), excedente: Math.round(p.excedente), t: +planta.t.toFixed(1), cel: CEL.requisito2026, mwTh: MW_POR_TH }),
});
