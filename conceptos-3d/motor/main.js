// «Motor eléctrico», en 3D y con el formato Búho de «¿Cómo funciona?». El motor WEG de 2 HP, 4 polos y 460 V que probó una tesis de la
// UNAM en su banco de pruebas: con su torquímetro, su electrodinamómetro, su variador y su analizador. Cuatro formas de verlo: cómo gira,
// el arranque, la eficiencia con carga y la temperatura.
// Se arma con: node scripts/build-conceptos-3d.mjs motor
//
// Lo que se repite entre las plantas con física está en conceptos-3d/planta-comun/.
import { clamp01, num } from '../planta-comun/ayudas.js';
import { barrasHTML, leyenda, pintarGrafica, seccionBarras, seccionColores, seccionDiagrama, seccionFuentes, seccionGrafica, seccionTabla, tablaHTML } from '../planta-comun/graficas.js';
import { crearPagina } from '../planta-comun/pagina.js';
import { ARMAZON, CONUEE, DEF, EFICIENCIA, FLUIDOS, LIMITES, METODOS, MOTOR, NORMA, PARTES as PARTES_M, PERDIDAS, PRUEBAS, TNOM, arranque, calor, carga, estadoPlanta, motorEn, operacion, pasoPlanta, pose, sincrona, voltajeVariador } from './modelo.js';
import { P_PLANTA, construir, escenario, materiales } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';

const FIGURA = 'motor';
const f1 = x => num(x, 1);
const f2 = x => num(x, 2);
const PERD100 = Object.values(PERDIDAS).reduce((a, b) => a + b, 0);
const ORDEN = Object.keys(METODOS);

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'carcasa', nombre: 'Carcasa con aletas', modo: 'calor', accion: 'cuatroHoras', eq: 'El armazón llegó a 61.5 °C', recorrido: { noche: false, adentro: false },
        icono: '<rect x="3" y="7" width="18" height="10" rx="4"/><path d="M7 7V5M11 7V5M15 7V5M19 7V5"/>',
        texto: 'Guarda todo y suelta el calor: el aire del ventilador corre por sus aletas. En la prueba de la tesis, a plena carga, el armazón llegó a 61.5 °C después de cuatro horas.' },
    { parte: 'placa', nombre: 'Placa de datos', modo: 'carga', accion: 'plena', eq: `${MOTOR.hp} HP · ${MOTOR.V} V · ${num(MOTOR.rpm)} rpm`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="4" y="6" width="16" height="12" rx="1.5"/><path d="M7 10h10M7 14h6"/>',
        texto: `Dice lo que el motor promete: ${MOTOR.hp} HP (${num(MOTOR.kW, 3)} kW), ${MOTOR.polos} polos, ${MOTOR.V} V, ${num(MOTOR.rpm)} vueltas por minuto, aislamiento clase ${MOTOR.clase} y letra ${MOTOR.letra}. La norma pide que también diga su eficiencia.` },
    { parte: 'caja', nombre: 'Caja de conexiones', modo: 'arranque', accion: 'arrancar', eq: `${MOTOR.V} V en estrella; ${MOTOR.Vyy} V en doble estrella`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="5" y="5" width="14" height="14" rx="1.5"/><circle cx="9" cy="10" r="1"/><circle cx="12" cy="10" r="1"/><circle cx="15" cy="10" r="1"/><circle cx="9" cy="14" r="1"/><circle cx="12" cy="14" r="1"/><circle cx="15" cy="14" r="1"/>',
        texto: `Aquí entran los tres cables de la red. Según cómo se unan sus puntas, el motor trabaja a ${MOTOR.V} V (en estrella) o a ${MOTOR.Vyy} V (en doble estrella).` },
    { parte: 'nucleo', nombre: 'Núcleo del estator', modo: 'gira', abrir: true, accion: 'treinta', eq: `${num(sincrona())} vueltas por minuto a 60 Hz`, recorrido: { noche: false, adentro: true },
        icono: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',
        texto: 'Láminas de acero que guían el campo magnético. Las tres fases de la red, desfasadas, hacen que el campo gire: con 4 polos y 60 Hz, a 1,800 vueltas por minuto (120 × 60 ÷ 4).' },
    { parte: 'bobinas', nombre: 'Bobinas del estator', modo: 'carga', abrir: true, accion: 'plena', eq: `Pierden ${num(PERDIDAS.estator)} W a plena carga`, recorrido: { noche: false, adentro: true },
        icono: '<path d="M5 12c2-6 4-6 6 0s4 6 6 0"/><path d="M3 12h2M19 12h2"/>',
        texto: `El cobre por donde pasa la corriente de la red y que hace el campo. Es lo que más calor suelta: ${num(PERDIDAS.estator)} W de los ${num(PERD100)} que pierde el motor a plena carga.` },
    { parte: 'rotor', nombre: 'Rotor de jaula de ardilla', modo: 'gira', abrir: true, accion: 'sinCarga', eq: 'Va 2.1 % atrás del campo', recorrido: { noche: false, adentro: true },
        icono: '<rect x="5" y="7" width="14" height="10" rx="2"/><path d="M8 7v10M11 7v10M14 7v10M17 7v10"/>',
        texto: 'Barras de aluminio unidas por dos anillos, como una jaula, sin cables ni contactos. El campo que gira induce corriente en ellas y las arrastra. Siempre va un poco atrás del campo: a plena carga, 1,760 contra 1,800 vueltas.' },
    { parte: 'eje', nombre: 'Eje', modo: 'gira', abrir: true, accion: 'plena', eq: `${f2(TNOM)} N·m a plena carga`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 12h18"/><circle cx="12" cy="12" r="3"/>',
        texto: `Saca el giro del motor. Su par nominal es ${num(MOTOR.kW, 3)} kW × 9,549 ÷ ${num(MOTOR.rpm)} = ${f2(TNOM)} N·m; al arrancar da ${f1(PRUEBAS.arranque.par)} N·m y, como máximo, ${f1(PRUEBAS.maximo.par)}.` },
    { parte: 'baleros', nombre: 'Baleros', modo: 'carga', abrir: true, accion: 'pocaCarga', eq: `Fricción y aire: ${f1(PERDIDAS.friccion)} W`, recorrido: { noche: false, adentro: true },
        icono: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="6" r="1"/><circle cx="18" cy="12" r="1"/><circle cx="12" cy="18" r="1"/><circle cx="6" cy="12" r="1"/>',
        texto: `Dejan girar el eje con poco roce. Junto con el ventilador, la fricción se lleva ${f1(PERDIDAS.friccion)} W: poco, pero está aunque el motor no cargue nada.` },
    { parte: 'ventilador', nombre: 'Ventilador', modo: 'calor', abrir: true, accion: 'sobrecarga', eq: 'En el mismo eje', recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="12" r="1.5"/><path d="M12 10c0-4 4-6 5-4M14 12c4 0 6 4 4 5M12 14c0 4-4 6-5 4M10 12c-4 0-6-4-4-5"/>',
        texto: 'Va en el mismo eje que el rotor y sopla aire sobre las aletas de la carcasa, debajo de su tapa de rejilla. Sin él, el calor no saldría.' },
    { parte: 'variador', nombre: 'Arrancador y variador', modo: 'arranque', accion: 'variador', eq: 'Directo: unas 8 veces la corriente', recorrido: { noche: false, adentro: false },
        icono: '<rect x="6" y="3" width="12" height="18" rx="1.5"/><path d="M9 8h6M9 12h6M9 16h3"/>',
        texto: 'Directo, el motor pide de golpe unos 25 A, ocho veces su corriente. Un arrancador suave sube el voltaje poco a poco; un variador sube la frecuencia y además cambia la velocidad. La CONUEE los recomienda en bombeo con caudal variable.' },
    { parte: 'torquimetro', nombre: 'Torquímetro', modo: 'gira', accion: 'plena', eq: 'Mide el par y las vueltas', recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="12" r="7"/><path d="M12 12l4-3"/>',
        texto: 'Entre el motor y el freno, mide el par y la velocidad del eje. Par por velocidad es la potencia que sale: 8.26 N·m a 1,760 vueltas por minuto son 1.52 kW.' },
    { parte: 'dinamometro', nombre: 'Electrodinamómetro', modo: 'carga', accion: 'sobrecarga', eq: 'El freno de la prueba', recorrido: { noche: false, adentro: false },
        icono: '<rect x="4" y="7" width="16" height="10" rx="3"/><path d="M8 12h8"/>',
        texto: 'Un generador que frena al motor: así la prueba lo cargó de 25 a 130 %. Lo que genera se quema en un banco de resistencias.' },
    { parte: 'analizador', nombre: 'Analizador de potencia', modo: 'carga', accion: 'pocaCarga', eq: `${f1(EFICIENCIA[2][1])} % a plena carga`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="4" y="5" width="16" height="12" rx="1.5"/><path d="M7 13l3-3 3 2 4-4"/>',
        texto: `Mide el voltaje, la corriente, la potencia que entra y el factor de potencia. Con el torquímetro da la eficiencia: ${f1(EFICIENCIA[2][1])} % a plena carga y ${f1(EFICIENCIA[5][1])} % a un cuarto.` },
    { parte: 'termopares', nombre: 'Termopares', modo: 'calor', accion: 'cuatroHoras', eq: `Devanado a ${f1(PRUEBAS.temperatura.devanado)} °C`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M10 4v10a3 3 0 1 0 4 0V4a2 2 0 0 0-4 0z"/>',
        texto: `Miden la temperatura de la carcasa. La del devanado sale de cuánto sube su resistencia: de 8.885 a 10.901 Ω, unos ${f1(PRUEBAS.temperatura.devanado)} °C, ${f1(PRUEBAS.temperatura.aumento)} °C sobre el aire.` },
];
const VISTAS = Object.fromEntries(PARTES_M.map(p => [p.id, p.vista]));
let planta = estadoPlanta();
const relojCalor = { texto: 'las horas', avanzar: (p, dt) => { p.horas = Math.min(LIMITES.horas[1], p.horas + dt * 0.25); return p.horas >= LIMITES.horas[1]; }, alSeguir: p => { if (p.horas >= LIMITES.horas[1] - 0.01) p.horas = 0; } };
const MODOS = {
    gira: { nombre: 'Cómo gira', corto: 'Gira', resumen: 'Las tres fases hacen girar un campo magnético; el rotor lo sigue un poco atrás. Con un variador cambia la frecuencia y, con ella, la velocidad. Ponle carga y mira cuánto resbala.', aclara: 'El circuito del motor es de ejemplo, ajustado a las pruebas de la tesis: el par al arranque, a plena carga y el máximo. Con variador, el voltaje sube con la frecuencia hasta 60 Hz.', mando: { nombre: 'Frecuencia', campo: 'f', rango: LIMITES.f, texto: v => `${f1(v)} Hz · campo a ${num(sincrona(v))} rpm` }, mando2: { nombre: 'Carga', campo: 'carga', rango: LIMITES.carga, texto: v => `${num(v * 100)} % del par nominal` } },
    arranque: { nombre: 'El arranque', corto: 'Arranque', resumen: 'Al arrancar, el rotor está quieto y el motor pide de golpe muchas veces su corriente. Elige cómo arrancarlo y con cuánta carga, y arráncalo.', aclara: 'La carga es como la de una bomba: pide más par cuanto más rápido gira. La inercia, la rampa y la carga son de ejemplo.', mando: { nombre: 'Rampa', campo: 'rampa', rango: LIMITES.rampa, texto: v => `${f1(v)} s` }, mando2: { nombre: 'Carga de la bomba', campo: 'cargaArr', rango: LIMITES.cargaArr, texto: v => `${num(v * 100)} % del par nominal` } },
    carga: { nombre: 'Eficiencia con carga', corto: 'Carga', resumen: 'De cada 100 W que entran, salen unos 84 en el eje a plena carga; con poca carga, menos. La norma de 2025 pide 86.5 % a un motor así. Cambia la carga y las horas al año.', aclara: 'Los puntos son los de la prueba de la tesis; la línea, el circuito de ejemplo. La comparación usa un motor de la norma de 2025 con la misma forma de curva.', mando: { nombre: 'Carga', campo: 'carga', rango: LIMITES.carga, texto: v => `${num(v * 100)} % · ${f2(v * MOTOR.kW)} kW` }, mando2: { nombre: 'Horas de trabajo al año', campo: 'anual', rango: LIMITES.anual, texto: v => `${num(v)} h` } },
    calor: { nombre: 'La temperatura', corto: 'Calor', resumen: 'Lo que se pierde se vuelve calor. A plena carga el devanado sube unos 54 °C sobre el aire; su aislamiento clase F aguanta 115. Corre las horas o súbele la carga.', aclara: 'El aumento final sale de la prueba; con otra carga, crece con las pérdidas. Cuánto tarda en calentarse es de ejemplo, parecido a la curva del armazón que midió la tesis.', mando: { nombre: 'Tiempo', campo: 'horas', rango: LIMITES.horas, texto: v => `${f1(v)} h` }, mando2: { nombre: 'Carga', campo: 'carga', rango: LIMITES.carga, texto: v => `${num(v * 100)} % del par nominal` }, reloj: relojCalor },
};
const BOTONES = [
    { id: 'metodo', visible: p => p.modo === 'arranque', pulsado: () => false, texto: p => `Arranque: ${METODOS[p.metodo].toLowerCase()}`, alTocar: p => { p.metodo = ORDEN[(ORDEN.indexOf(p.metodo) + 1) % ORDEN.length]; p.arrancar = false; } },
    { id: 'arrancar', visible: p => p.modo === 'arranque', pulsado: p => p.arrancar, texto: p => (p.arrancar ? 'Parar' : 'Arrancar'), alTocar: p => { p.arrancar = !p.arrancar; planta = estadoPlanta(); } },
];
const ACCIONES = {
    plena: { texto: p => (Math.abs(p.carga - 1) < 0.01 && p.f === 60 ? 'Bajar a 50 %' : 'A plena carga'), hacer: (p, pag) => { const ya = Math.abs(p.carga - 1) < 0.01 && p.f === 60; p.carga = ya ? 0.5 : 1; p.f = 60; pag.invalidar(); pag.ponerMando(); } },
    pocaCarga: { texto: p => (p.carga < 0.3 ? 'A plena carga' : 'Con un cuarto de carga'), hacer: (p, pag) => { p.carga = p.carga < 0.3 ? 1 : 0.25; pag.invalidar(); pag.ponerMando(); } },
    sobrecarga: { texto: p => (p.carga > 1.2 ? 'A plena carga' : 'Con 130 % de carga'), hacer: (p, pag) => { p.carga = p.carga > 1.2 ? 1 : 1.3; pag.invalidar(); pag.ponerMando(); } },
    sinCarga: { texto: p => (p.carga < 0.1 ? 'A plena carga' : 'Casi sin carga'), hacer: (p, pag) => { p.carga = p.carga < 0.1 ? 1 : 0.05; p.f = 60; pag.invalidar(); pag.ponerMando(); } },
    treinta: { texto: p => (p.f === 30 ? 'Volver a 60 Hz' : 'Con el variador a 30 Hz'), hacer: (p, pag) => { p.f = p.f === 30 ? 60 : 30; pag.invalidar(); pag.ponerMando(); } },
    arrancar: { texto: p => (p.arrancar ? 'Parar' : 'Arrancar directo'), hacer: (p, pag) => { if (p.arrancar) p.arrancar = false; else { p.metodo = 'directo'; p.arrancar = true; } planta = estadoPlanta(); pag.invalidar(); pag.rotular(); } },
    variador: { texto: () => 'Arrancar con variador', hacer: (p, pag) => { p.metodo = 'variador'; p.arrancar = true; planta = estadoPlanta(); pag.invalidar(); pag.rotular(); } },
    cuatroHoras: { texto: p => (p.horas >= 4 ? 'Volver al principio' : 'Ver a las 4 horas'), hacer: (p, pag) => { p.horas = p.horas >= 4 ? 0 : 4; p.carga = 1; p.corre = false; pag.invalidar(); pag.ponerMando(); pag.rotular(); } },
};

// ------------------------------------------------------------------ el tablero
const secciones = () => `
    ${seccionDiagrama('Lo que pasa en el motor')}
    ${seccionGrafica('b')}
    ${seccionGrafica('c')}
    ${seccionBarras()}
    ${seccionTabla('La placa y las pruebas', 'h-placa', 'Motor WEG de 2 HP, según una tesis de la UNAM (FES Aragón, 2006).', 'h-tabla-texto')}
    ${seccionTabla('Lo que pide la norma', 'h-norma', 'NOM-016-ENER y guía de la CONUEE.', 'h-tabla-texto')}
    ${seccionTabla('Lo que dice la ley', 'h-regla', 'Ley de Planeación y Transición Energética.')}
    ${seccionColores(FLUIDOS, 'El motor y sus pruebas son reales; el acomodo, la escala y el interior no. Son de ejemplo: el circuito del motor (ajustado a las pruebas), la carga y la inercia del arranque, las rampas y cuánto tarda en calentarse.', 'Colores de lo que corre')}
    ${seccionFuentes(FUENTES, [
        { para: 'Qué es la Eficiencia Energética y que la CONUEE expide las normas oficiales mexicanas de eficiencia energética', titulo: 'Ley de Planeación y Transición Energética, arts. 3, 10 y 11', nota: 'Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio' },
    ])}`;

const medidos = (fx, fy) => EFICIENCIA.map(r => ({ x: fx(r), y: fy(r), texto: '' }));
function alPintarGraficas(L, pag) {
    const { $, pide, graficas } = pag;
    const m = pide.modo;
    graficas.b = null;
    graficas.c = null;
    if (m === 'gira') {
        const V = voltajeVariador(L.f);
        const tope = Math.max(1900, sincrona(L.f) * 1.02);
        const lb = [
            { clase: 'h-s-actual', nombre: `A ${f1(L.f)} Hz`, f: n => (n <= sincrona(L.f) ? motorEn(V, L.f, n).par : 0) },
            ...(Math.abs(L.f - 60) > 0.5 ? [{ clase: 'h-s-sin', nombre: 'A 60 Hz', f: n => (n <= 1800 ? motorEn(MOTOR.V, 60, n).par : 0) }] : []),
            { clase: 'h-s-norma', nombre: 'Lo que pide la carga', f: () => L.carga * TNOM },
        ];
        $('#h-b-t').textContent = 'El par según la velocidad';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `N·m que da el motor a cada velocidad. Arranca con ${f1(PRUEBAS.arranque.par)}, sube hasta unos ${f1(PRUEBAS.maximo.par)} y cae a cero en la velocidad del campo. Trabaja donde su curva cruza la de la carga.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'El par según la velocidad', xMin: 0, xMax: tope, yMin: 0, yMax: 30, ticksX: [0, 600, 1200, 1800], ticksY: [0, 10, 20, 30], etX: 'Vueltas por minuto', etY: 'N·m', lineas: lb, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} rpm · ${lb.slice(0, -1).map(l => `${l.nombre}: ${f1(l.f(x))} N·m`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Vueltas', 'Par', 'Corriente'], [0, 600, 1200, 1500, 1700, 1760, 1790].map(n => { const o = motorEn(MOTOR.V, 60, n); return [num(n), `${f1(o.par)} N·m`, `${f1(o.I)} A`]; }));
        const lc = [{ clase: 'h-s-actual', nombre: 'Modelo a 60 Hz', f: c => operacion(MOTOR.V, 60, c / 100).rpm }];
        $('#h-c-t').textContent = 'La velocidad según la carga, a 60 Hz';
        $('#h-c-ley').innerHTML = `${leyenda(lc)}<i class="h-s-punto"></i>Medido`;
        $('#h-c-pie').textContent = 'Con más carga, el rotor resbala más detrás del campo. Los puntos son las velocidades que midió la tesis de 25 a 130 % de carga.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'La velocidad según la carga', xMin: 0, xMax: 130, yMin: 1740, yMax: 1800, ticksX: [0, 25, 50, 75, 100, 125], ticksY: [1740, 1760, 1780, 1800], etX: 'Carga, % del par nominal', etY: 'rpm', lineas: lc, puntos: medidos(r => r[0], r => r[4]), fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} % · ${f1(lc[0].f(x))} rpm` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Carga', 'Medido', 'Modelo'], EFICIENCIA.map(r => [`${f1(r[0])} %`, `${f1(r[4])} rpm`, `${f1(operacion(MOTOR.V, 60, r[3] / TNOM).rpm)} rpm`]));
    } else if (m === 'arranque') {
        const d = arranque({ metodo: 'directo', rampa: L.rampa, carga: L.carga });
        const tope = Math.min(15, Math.max(3, (L.llega ?? 10) * 1.6));
        const corr = o => t => o.hist[Math.min(o.hist.length - 1, Math.round(t / 0.01))].I;
        const vel = o => t => o.hist[Math.min(o.hist.length - 1, Math.round(t / 0.01))].n;
        const lb = [
            { clase: 'h-s-actual', nombre: METODOS[L.metodo], f: corr(L) },
            ...(L.metodo !== 'directo' ? [{ clase: 'h-s-sin', nombre: 'Directo', f: corr(d) }] : []),
            { clase: 'h-s-norma', nombre: `Nominal: ${f1(PRUEBAS.plena.I)} A`, f: () => PRUEBAS.plena.I },
        ];
        $('#h-b-t').textContent = 'La corriente al arrancar';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `A por fase. Directo pide unos ${num(d.pico)} A, ${f1(d.veces)} veces la nominal (la prueba midió ${f1(PRUEBAS.arranque.I)} A con el rotor bloqueado), y los suelta en cuanto toma velocidad.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'La corriente al arrancar', xMin: 0, xMax: tope, yMin: 0, yMax: 30, ticksX: [0, tope / 4, tope / 2, (3 * tope) / 4, tope].map(x => +x.toFixed(1)), ticksY: [0, 10, 20, 30], etX: 'Segundos', etY: 'A', lineas: lb, fx: x => num(x, 1), fy: y => num(y), punta: x => `${num(x, 2)} s · ${lb.slice(0, -1).map(l => `${l.nombre}: ${f1(l.f(x))} A`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Arranque', 'Pico', 'Veces la nominal', 'Llega en'], ORDEN.map(k => { const o = arranque({ metodo: k, rampa: L.rampa, carga: L.carga }); return [METODOS[k], `${f1(o.pico)} A`, f1(o.veces), o.llega === null ? 'no llega' : `${f2(o.llega)} s`]; }));
        const lc = [
            { clase: 'h-s-actual', nombre: METODOS[L.metodo], f: vel(L) },
            ...(L.metodo !== 'directo' ? [{ clase: 'h-s-sin', nombre: 'Directo', f: vel(d) }] : []),
        ];
        $('#h-c-t').textContent = 'La velocidad al arrancar';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = 'Directo llega en una fracción de segundo; con arrancador suave o con variador, tarda lo que dura la rampa, pero sin el golpe de corriente.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'La velocidad al arrancar', xMin: 0, xMax: tope, yMin: 0, yMax: 1900, ticksX: [0, tope / 4, tope / 2, (3 * tope) / 4, tope].map(x => +x.toFixed(1)), ticksY: [0, 600, 1200, 1800], etX: 'Segundos', etY: 'rpm', lineas: lc, fx: x => num(x, 1), fy: y => num(y), punta: x => `${num(x, 2)} s · ${lc.map(l => `${l.nombre}: ${num(l.f(x))} rpm`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Segundos', ...lc.map(l => l.nombre)], [0.1, 0.25, 0.5, 1, 2, 4].map(t => [num(t, 2), ...lc.map(l => `${num(l.f(t))} rpm`)]));
    } else if (m === 'carga') {
        const lb = [
            { clase: 'h-s-actual', nombre: 'Este motor', f: c => carga({ carga: c / 100 }).efPct },
            { clase: 'h-s-norma', nombre: `Norma 2025: ${num(NORMA.y2025, 1)} %`, f: () => NORMA.y2025 },
            { clase: 'h-s-sin', nombre: `Norma 2002: ${num(NORMA.y2002)} %`, f: () => NORMA.y2002 },
        ];
        $('#h-b-t').textContent = 'La eficiencia según la carga';
        $('#h-b-ley').innerHTML = `${leyenda(lb)}<i class="h-s-punto"></i>Medido`;
        $('#h-b-pie').textContent = `De cada 100 W que entran, cuántos salen en el eje. Con poca carga pesan las pérdidas que no cambian (el núcleo y la fricción). La CONUEE recomienda que trabajen entre ${CONUEE.factor[0]} y ${CONUEE.factor[1]} % de su carga. Las normas comparan a plena carga.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'La eficiencia según la carga', xMin: 5, xMax: 130, yMin: 25, yMax: 95, ticksX: [25, 50, 75, 100, 125], ticksY: [25, 45, 65, 85], etX: 'Carga, %', etY: '%', lineas: lb, puntos: medidos(r => r[0], r => r[1]), refsX: [{ x: CONUEE.factor[0], texto: `${CONUEE.factor[0]} %` }], fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} % · ${f1(lb[0].f(x))} %` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Carga', 'Medido', 'Modelo'], EFICIENCIA.map(r => [`${f1(r[0])} %`, `${f1(r[1])} %`, `${f1(carga({ carga: r[3] / TNOM }).efPct)} %`]));
        const lc = [
            { clase: 'h-s-actual', nombre: 'Cobre del estator', f: c => carga({ carga: c / 100 }).cobre1 },
            { clase: 'h-s-max', nombre: 'Núcleo', f: c => carga({ carga: c / 100 }).nucleo },
            { clase: 'h-s-sin', nombre: 'Cobre del rotor', f: c => carga({ carga: c / 100 }).cobre2 },
            { clase: 'h-s-norma', nombre: 'Fricción', f: c => carga({ carga: c / 100 }).friccion },
        ];
        $('#h-c-t').textContent = 'Lo que se pierde según la carga';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `W. El cobre crece con el cuadrado de la corriente; el núcleo y la fricción casi no cambian. La prueba midió a plena carga ${num(PERDIDAS.estator)} W en el estator, ${num(PERDIDAS.rotor)} en el rotor, ${num(PERDIDAS.nucleo)} en el núcleo y ${f1(PERDIDAS.friccion)} de fricción.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Lo que se pierde según la carga', xMin: 5, xMax: 130, yMin: 0, yMax: 250, ticksX: [25, 50, 75, 100, 125], ticksY: [0, 50, 100, 150, 200, 250], etX: 'Carga, %', etY: 'W', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} % · ${lc.map(l => `${l.nombre}: ${num(l.f(x))} W`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Carga', ...lc.map(l => l.nombre)], [25, 50, 75, 100, 130].map(c => [`${num(c)} %`, ...lc.map(l => `${num(l.f(c))} W`)]));
    } else {
        const tope = Math.max(100, L.ambiente + L.final * 1.15);
        const lb = [
            { clase: 'h-s-actual', nombre: 'Devanado', f: h => calor({ horas: h, carga: L.carga, ambiente: L.ambiente }).devanado },
            { clase: 'h-s-sin', nombre: 'Armazón', f: h => calor({ horas: h, carga: L.carga, ambiente: L.ambiente }).armazon },
        ];
        const plena = Math.abs(L.carga - 1) < 0.02;
        $('#h-b-t').textContent = 'La temperatura en las primeras 5 horas';
        $('#h-b-ley').innerHTML = `${leyenda(lb)}${plena ? '<i class="h-s-punto"></i>Armazón medido' : ''}`;
        $('#h-b-pie').textContent = `°C con el aire a ${num(L.ambiente)} °C. Primero se calienta el cobre y luego, despacio, todo el fierro. ${plena ? 'Los puntos son el armazón que midió la tesis cada media hora.' : 'Los puntos medidos solo se ven a plena carga.'}`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'La temperatura en las primeras 5 horas', xMin: 0, xMax: 5, yMin: 0, yMax: tope, ticksX: [0, 1, 2, 3, 4, 5], ticksY: [0, 25, 50, 75, 100, 125, 150].filter(y => y <= tope), etX: 'Horas', etY: '°C', lineas: lb, puntos: plena ? ARMAZON.map(([h, t]) => ({ x: h, y: t, texto: '' })) : [], fx: x => num(x), fy: y => num(y), punta: x => `${f1(x)} h · ${lb.map(l => `${l.nombre}: ${num(l.f(x))} °C`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Horas', 'Devanado', 'Armazón', 'Armazón medido'], ARMAZON.map(([h, t]) => { const c = calor({ horas: h, carga: L.carga, ambiente: L.ambiente }); return [f1(h), `${num(c.devanado)} °C`, `${num(c.armazon)} °C`, plena ? `${f1(t)} °C` : '—']; }));
        const lc = [
            { clase: 'h-s-actual', nombre: 'Aumento final del devanado', f: c => calor({ horas: 99, carga: c / 100, ambiente: L.ambiente }).final },
            { clase: 'h-s-norma', nombre: `Clase F: ${PRUEBAS.temperatura.permitido} °C`, f: () => PRUEBAS.temperatura.permitido },
        ];
        $('#h-c-t').textContent = 'Cuánto sube, según la carga';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `°C sobre el aire. A plena carga, ${f1(PRUEBAS.temperatura.aumento)} °C, lejos de los ${PRUEBAS.temperatura.permitido} que permite su aislamiento. Crece con las pérdidas, que crecen con el cuadrado de la corriente.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Cuánto sube, según la carga', xMin: 5, xMax: 130, yMin: 0, yMax: 130, ticksX: [25, 50, 75, 100, 125], ticksY: [0, 40, 80, 120], etX: 'Carga, %', etY: '°C', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} % · ${num(lc[0].f(x))} °C` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Carga', 'Aumento final', 'Pérdidas'], [25, 50, 75, 100, 130].map(c => { const o = calor({ horas: 99, carga: c / 100 }); return [`${num(c)} %`, `${num(o.final)} °C`, `${num(o.perd)} W`]; }));
    }
}
function pintarBarras(L, pag) {
    const { $, pide } = pag;
    let filas;
    if (pide.modo === 'gira') {
        filas = [
            { t: 'Velocidad, de la del campo', v: L.vueltasCampo > 0 ? L.rpm / L.vueltasCampo : 0, activa: true, escala: 1, d: 1 },
            { t: 'Corriente, de la nominal', v: L.I / PRUEBAS.plena.I, activa: L.I > PRUEBAS.plena.I * 1.05, escala: 1.6 },
            { t: 'Par, del nominal', v: L.par / TNOM, escala: 1.6 },
        ];
        $('#h-d-t').textContent = 'El motor ahora, de cada 100';
        $('#h-d-pie').textContent = L.debil ? 'Arriba de 60 Hz el voltaje ya no sube: el campo se debilita y el motor da menos par.' : `Resbala ${f1(L.deslizamiento)} %: es lo que necesita para que el campo induzca corriente en el rotor.`;
    } else if (pide.modo === 'arranque') {
        const d = arranque({ metodo: 'directo', rampa: L.rampa, carga: L.carga });
        filas = [
            { t: 'Pico, del de arranque directo', v: L.pico / d.pico, activa: L.metodo === 'directo', escala: 1 },
            { t: 'Corriente ahora, del pico directo', v: L.ahora.I / d.pico, escala: 1 },
            { t: 'Velocidad ahora, de 1,800', v: L.ahora.n / 1800, escala: 1 },
        ];
        $('#h-d-t').textContent = 'El arranque, de cada 100';
        $('#h-d-pie').textContent = `Un pico así calienta los cables y hace caer el voltaje un momento; en motores que arrancan muchas veces, la CONUEE recomienda arrancadores.`;
    } else if (pide.modo === 'carga') {
        filas = [
            { t: 'Eficiencia', v: L.ef, activa: true, escala: 1, d: 1 },
            { t: 'Norma de 2025', v: NORMA.y2025 / 100, escala: 1, d: 1 },
            { t: 'Factor de potencia', v: L.fp, activa: L.fp < 0.5, escala: 1 },
        ];
        $('#h-d-t').textContent = 'Este motor, de cada 100';
        $('#h-d-pie').textContent = L.enRango ? 'En el rango que recomienda la CONUEE.' : `Fuera del rango que recomienda la CONUEE (${CONUEE.factor[0]} a ${CONUEE.factor[1]} %): ${L.carga < 0.65 ? 'un motor más chico trabajaría mejor' : 'se calienta de más'}.`;
    } else {
        filas = [
            { t: 'Aumento ahora, de los 115 °C', v: L.aumento / PRUEBAS.temperatura.permitido, activa: true, escala: 1 },
            { t: 'Aumento final, de los 115 °C', v: L.final / PRUEBAS.temperatura.permitido, activa: L.pasa, escala: 1 },
            { t: 'Pérdidas, de las de plena carga', v: L.perd / calor({ horas: 0, carga: 1, ambiente: L.ambiente }).perd, escala: 2 },
        ];
        $('#h-d-t').textContent = 'El calor, de cada 100';
        $('#h-d-pie').textContent = L.pasa ? 'Pasaría del aumento que aguanta su aislamiento: con el tiempo se dañaría.' : 'Dentro de lo que aguanta su aislamiento clase F.';
    }
    $('#h-barras').innerHTML = barrasHTML(filas);
}
function alPintarFijas({ $ }) {
    $('#h-placa').innerHTML = tablaHTML(['Qué', 'Cuánto'], [
        ['Motor', `${MOTOR.marca}, hecho en ${MOTOR.hecho}; jaula de ardilla, diseño ${MOTOR.nema}`],
        ['Potencia', `${MOTOR.hp} HP (${num(MOTOR.kW, 3)} kW)`],
        ['Voltaje', `${MOTOR.V} V en estrella; ${MOTOR.Vyy} V en doble estrella`],
        ['Polos y velocidad', `${MOTOR.polos} polos; ${num(MOTOR.rpm)} rpm a plena carga`],
        ['Aislamiento y letra', `clase ${MOTOR.clase}; letra ${MOTOR.letra}`],
        ['En vacío (230 V)', `${f2(PRUEBAS.vacio.I)} A; ${f1(PRUEBAS.vacio.P)} W; ${f1(PRUEBAS.vacio.rpm)} rpm`],
        ['Rotor bloqueado (461 V)', `${f1(PRUEBAS.arranque.I)} A; ${f1(PRUEBAS.arranque.par)} N·m (${num(PRUEBAS.arranque.pct)} %)`],
        ['Par máximo', `${f1(PRUEBAS.maximo.par)} N·m (${num(PRUEBAS.maximo.pct)} %)`],
        ['Plena carga (460 V)', `${f2(PRUEBAS.plena.I)} A; ${num(PRUEBAS.plena.P)} W; factor de potencia ${f2(PRUEBAS.plena.fp)}`],
        ['Eficiencia a plena carga', `${f1(EFICIENCIA[2][1])} %`],
        ['Devanado a plena carga', `${f1(PRUEBAS.temperatura.devanado)} °C; sube ${f1(PRUEBAS.temperatura.aumento)} °C`],
    ]);
    $('#h-norma').innerHTML = tablaHTML(['Qué', 'Cuánto'], [
        ['Eficiencia, motor cerrado de 2 HP y 4 polos (NOM de 2002)', `${num(NORMA.y2002, 1)} %; mínima ${num(NORMA.min2002, 1)} %`],
        ['La misma, en la NOM-016-ENER-2025', `${num(NORMA.y2025, 1)} %`],
        ['La de 2025 entra en vigor', `${NORMA.vigor} días después de publicarse (19 de agosto de 2025)`],
        ['Energía de la industria que usan los motores trifásicos', `${CONUEE.industria} %`],
        ['Motores trifásicos en el país', `unos ${f1(CONUEE.motores)} millones`],
        ['Carga recomendada', `de ${CONUEE.factor[0]} a ${CONUEE.factor[1]} %`],
        ['Voltaje', `±${CONUEE.voltaje} % del de la placa`],
        ['Desbalance de voltaje', `hasta ${CONUEE.desbalance} %`],
    ]);
    $('#h-regla').innerHTML = tablaHTML(['Qué', 'Dónde lo dice'], [
        ['Eficiencia Energética: reducir, de forma económicamente viable, la energía que se necesita, con un servicio igual o mejor', 'LPTE, art. 3, fracc. VII'],
        ['La CONUEE promueve la Eficiencia Energética, con autonomía técnica y operativa', 'LPTE, art. 10'],
        ['Promueve el uso óptimo de la energía, desde su explotación hasta su uso final', 'LPTE, art. 11, fracc. I'],
        ['Expide, con aprobación de la SENER, las Normas Oficiales Mexicanas de Eficiencia Energética', 'LPTE, art. 11, fracc. VI'],
    ]);
}
function alActualizar(L, pag) {
    const { pide, ponerCifra, ponerLecturas, nivel, graficas } = pag;
    pintarBarras(L, pag);
    ponerCifra('aT', { gira: 'El campo y el rotor', arranque: 'Al arrancar', carga: 'Lo que entra y lo que sale', calor: 'Lo que se calienta' }[pide.modo]);
    if (pide.modo === 'gira') {
        const aviso = L.debil ? 'Arriba de 60 Hz el voltaje ya no sube: el motor da menos par.' : L.carga > 1.05 ? 'Más carga que la nominal: se calienta de más.' : null;
        ponerLecturas([['Campo', `${num(L.vueltasCampo)} rpm`, `${f1(L.f)} Hz y ${MOTOR.polos} polos`], ['Rotor', `${num(L.rpm)} rpm`, `resbala ${f1(L.deslizamiento)} %`], ['Par', `${f2(L.par)} N·m`, `${num((L.par / TNOM) * 100)} % del nominal`], ['Corriente', `${f2(L.I)} A`, `con ${num(L.V)} V`], ['Potencia en el eje', `${f2(L.util / 1000)} kW`, 'sale'], ['Eficiencia', `${f1(L.ef * 100)} %`, 'de lo que entra']], aviso);
        ponerCifra('hud', `${num(L.rpm)} rpm`);
        ponerCifra('hud2', `campo a ${num(L.vueltasCampo)}`);
        graficas.b?.marcar(L.rpm, L.par);
        graficas.c?.marcar(L.carga * 100, operacion(MOTOR.V, 60, L.carga).rpm);
        nivel(1, 'Velocidad', clamp01(L.rpm / 2250), `${num(L.rpm)} rpm`);
        nivel(2, 'Par', clamp01(L.par / 30), `${f1(L.par)} N·m`);
    } else if (pide.modo === 'arranque') {
        const a = L.ahora;
        const aviso = !L.corriendo ? `Toca «Arrancar». Arranque ${METODOS[L.metodo].toLowerCase()}: pico de ${f1(L.pico)} A, ${f1(L.veces)} veces la nominal.` : L.llega !== null && L.t >= L.llega ? `Llegó a su velocidad en ${f2(L.llega)} s.` : null;
        ponerLecturas([['Tiempo', `${num(L.t >= 0 ? L.t : 0, 2)} s`, 'en cámara lenta'], ['Velocidad', `${num(a.n)} rpm`, 'de unas 1,770'], ['Corriente', `${f1(a.I)} A`, `${f1(a.I / PRUEBAS.plena.I)} veces la nominal`], ['Par del motor', `${f1(a.par)} N·m`, `la bomba pide ${f1(a.Tc)}`], ['Voltaje', `${num(a.V)} V`, `${f1(a.f)} Hz`], ['Pico', `${f1(L.pico)} A`, METODOS[L.metodo].toLowerCase()]], aviso);
        ponerCifra('hud', `${f1(a.I)} A`);
        ponerCifra('hud2', `${num(a.n)} rpm`);
        if (L.corriendo) { graficas.b?.marcar(L.t, a.I); graficas.c?.marcar(L.t, a.n); }
        nivel(1, 'Corriente', clamp01(a.I / 30), `${f1(a.I)} A`);
        nivel(2, 'Velocidad', clamp01(a.n / 1800), `${num(a.n)} rpm`);
    } else if (pide.modo === 'carga') {
        const aviso = !L.cumple2025 ? `Con ${f1(L.efPct)} % no llega a los ${num(NORMA.y2025, 1)} % de la norma de 2025: en ${num(L.anual)} horas gasta unos ${num(L.extra)} kWh más que uno que la cumpla.` : null;
        ponerLecturas([['Entra', `${f2(L.Pin / 1000)} kW`, `${f2(L.I)} A`], ['Sale en el eje', `${f2(L.util / 1000)} kW`, `${num(L.rpm)} rpm`], ['Eficiencia', `${f1(L.efPct)} %`, `norma de 2025: ${num(NORMA.y2025, 1)} %`], ['Factor de potencia', f2(L.fp), 'de la corriente'], ['Pérdidas', `${num(L.perd)} W`, 'se vuelven calor'], ['Al año', `${num(L.energia)} kWh`, `en ${num(L.anual)} horas`]], aviso);
        ponerCifra('hud', `${f1(L.efPct)} %`);
        ponerCifra('hud2', 'de eficiencia');
        graficas.b?.marcar(L.carga * 100, L.efPct);
        graficas.c?.marcar(L.carga * 100, L.cobre1);
        nivel(1, 'Carga', clamp01(L.carga / 1.3), `${num(L.carga * 100)} %`);
        nivel(2, 'Eficiencia', clamp01((L.efPct - 50) / 40), `${f1(L.efPct)} %`);
    } else {
        const aviso = L.pasa ? `Con ${num(L.carga * 100)} % de carga, el devanado subiría ${num(L.final)} °C: pasa de los ${PRUEBAS.temperatura.permitido} de la clase F.` : null;
        ponerLecturas([['Tiempo', `${f1(L.horas)} h`, 'trabajando'], ['Devanado', `${num(L.devanado)} °C`, `sube ${num(L.aumento)} °C`], ['Armazón', `${num(L.armazon)} °C`, 'por fuera'], ['Al final', `${num(L.ambiente + L.final)} °C`, `sube ${num(L.final)} °C`], ['Pérdidas', `${num(L.perd)} W`, `a ${num(L.carga * 100)} %`], ['Permitido', `${PRUEBAS.temperatura.permitido} °C`, `de aumento, clase ${MOTOR.clase}`]], aviso);
        ponerCifra('hud', `${num(L.devanado)} °C`);
        ponerCifra('hud2', `devanado a las ${f1(L.horas)} h`);
        graficas.b?.marcar(L.horas, L.devanado);
        graficas.c?.marcar(L.carga * 100, L.final);
        nivel(1, 'Devanado', clamp01(L.devanado / 140), `${num(L.devanado)} °C`);
        nivel(2, 'Pérdidas', clamp01(L.perd / 600), `${num(L.perd)} W`);
    }
}

// ------------------------------------------------------------------ el banco
const PIDE0 = { f: DEF.f, carga: DEF.carga, metodo: DEF.metodo, rampa: DEF.rampa, cargaArr: DEF.cargaArr, anual: DEF.anual, horas: DEF.horas, arrancar: false, corre: false };
crearPagina({
    figura: FIGURA,
    fichas: FICHAS,
    vistas: VISTAS,
    modos: MODOS,
    botones: BOTONES,
    acciones: ACCIONES,
    modo0: 'gira',
    pide: { ...PIDE0 },
    general: { Lx: 14.4, Lz: 6.4, alto: 3.0, mira: [-0.2, 1.4, 0], az: 22, el: 22, azVertical: 16, elVertical: 30 },
    etiquetas: { lienzo: 'Motor eléctrico en su banco de pruebas, en 3D: arrastra para girarlo, toca un punto para conocerlo', modos: 'Qué ver en el motor', puntos: 'Puntos clave del motor', desarmar: 'Desarmar el motor', lecturas: 'Lo que mide el banco' },
    textoFinal: 'Toca cualquier punto para volver a verlo. Cambia la frecuencia en «Cómo gira», arráncalo en «El arranque», cárgalo en «Eficiencia con carga» o corre las horas en «La temperatura».',
    colores: { guindaSuave: '#f3d4de', claro: '#ffffff' },
    crearDiagrama,
    secciones,
    escena: (renderer, scene, { movil, oscuro }) => {
        const M = materiales(P_PLANTA);
        const est = escenario(renderer, scene, M, { movil, oscuro });
        return { planta: construir(M, P_PLANTA, { movil, oscuro }), est };
    },
    alCambiarModo: (p) => {
        Object.assign(p, PIDE0);
        planta = estadoPlanta();
    },
    alCuadro: ({ dt, pide }) => {
        planta = pasoPlanta(planta, { modo: pide.modo, arrancar: pide.arrancar }, dt);
    },
    poseDe: ({ pide, ve, encendido, t, dt, camara }) => pose({ modo: pide.modo, planta, f: pide.f, carga: pide.carga, metodo: pide.metodo, rampa: pide.rampa, cargaArr: pide.cargaArr, anual: pide.anual, horas: pide.horas, noche: ve.noche, adentro: ve.adentro, desarme: ve.desarme, encendido, t, dt, camara }),
    firma: p => [p.modo, Math.round(p.f * 2), Math.round(p.carga * 50), p.metodo, Math.round(p.rampa * 4), Math.round(p.cargaArr * 20), Math.round(p.anual / 100), Math.round(p.horas * 10)],
    alPintarFijas,
    alPintarGraficas,
    alActualizar,
    prueba: p => ({ f: +p.f.toFixed(1), carga: +p.carga.toFixed(2), metodo: p.metodo, rampa: +p.rampa.toFixed(1), cargaArr: +p.cargaArr.toFixed(2), anual: Math.round(p.anual), horas: +p.horas.toFixed(2), arrancar: p.arrancar, tArr: +planta.tArr.toFixed(2) }),
});
