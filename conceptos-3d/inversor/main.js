// «Inversor: de corriente directa a alterna», en 3D y con el formato Búho de «¿Cómo funciona?». La planta fotovoltaica de 42 kWp del
// Instituto de Energías Renovables de la UNAM en Temixco, con sus dos inversores ABB TRIO de 20 kW. Cuatro formas de verlo: un día en
// Temixco, cómo sale la onda, con la red y el calor.
// Se arma con: node scripts/build-conceptos-3d.mjs inversor
//
// Lo que se repite entre las plantas con física está en conceptos-3d/planta-comun/.
import { clamp01, num } from '../planta-comun/ayudas.js';
import { barrasHTML, leyenda, pintarGrafica, seccionBarras, seccionColores, seccionDiagrama, seccionFuentes, seccionGrafica, seccionTabla, tablaHTML } from '../planta-comun/graficas.js';
import { crearPagina } from '../planta-comun/pagina.js';
import { AJUSTE, ARREGLO, CEC, DEF, EJ, FLUIDOS, LIMITES, MEDIDO, MODULOS, PARTES as PARTES_M, PLANTA, RED, TRAFO, TRIO, aire, armonicasOnda, brazo, canal, celda, dia, eficiencia, estadoPlanta, maxPorCalor, onda, pasoPlanta, pose, sol, tiempoFrecuencia, tiempoTension } from './modelo.js';
import { P_PLANTA, construir, escenario, materiales } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';

const FIGURA = 'inversor';
const f1 = x => num(x, 1);
const f2 = x => num(x, 2);
const hm = h => { const m = Math.round(h * 60); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };
const kW = w => f1(w / 1000);
const segundos = t => (Number.isFinite(t) ? (t < 1 ? `${num(t, 2)} s` : `${num(t)} s`) : 'sigue');

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'arreglo', nombre: 'Arreglo de 168 módulos', modo: 'dia', accion: 'mediodia', eq: `${f2(PLANTA.kWp)} kWp, inclinados ${PLANTA.inclinacion}°`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="3" y="6" width="18" height="12" rx="1"/><path d="M3 12h18M9 6v12M15 6v12"/>',
        texto: 'En la techumbre del auditorio Tonatiuh del IER-UNAM, en Temixco: 84 módulos Yingli de 250 W y 84 Solarever de 260 W, inclinados 19° hacia el sur. Dan corriente directa: siempre en el mismo sentido.' },
    { parte: 'cadena', nombre: 'Cadena de 14 módulos', modo: 'dia', accion: 'mediodia', eq: `${num(ARREGLO.serie * MODULOS.yingli.Vmp, 1)} V a 25 °C (Yingli)`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 12h3M18 12h3"/><rect x="6" y="9" width="4" height="6"/><rect x="14" y="9" width="4" height="6"/><path d="M10 12h4"/>',
        texto: 'Catorce módulos en serie suman su voltaje: 417 V con Yingli y 441 V con Solarever, a 25 °C. Con la celda caliente del mediodía, el voltaje baja a unos 375 V.' },
    { parte: 'cajas', nombre: 'Protección de las cadenas', modo: 'dia', accion: 'nublado', eq: 'Una caja por subarreglo', recorrido: { noche: false, adentro: false },
        icono: '<rect x="5" y="4" width="14" height="16" rx="1.5"/><path d="M9 9h6M9 13h6"/>',
        texto: 'Cada cadena lleva un protector contra la corriente que regresaría si se sombrea, y un desconector para separarla. Aquí se juntan tres cadenas y bajan al inversor.' },
    { parte: 'inversor', nombre: 'Inversor de 20 kW', modo: 'calor', accion: 'plena', eq: `Hasta ${num(TRIO.efMax, 1)} de cada 100`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8 9c1.5-3 2.5 3 4 0s2.5 3 4 0"/>',
        texto: 'Dos inversores ABB TRIO, uno por cada 84 módulos. Cada uno toma la corriente directa y entrega 20 kW de corriente alterna trifásica a 480 V y 60 Hz. Pesa 71 kg y no lleva transformador adentro.' },
    { parte: 'mppt', nombre: 'Seguidores de máxima potencia', modo: 'dia', abrir: true, accion: 'nublado', eq: `${ARREGLO.canales} por inversor, hasta ${TRIO.Icanal} A cada uno`, recorrido: { noche: false, adentro: true },
        icono: '<path d="M4 18c3-10 9-12 16-12"/><circle cx="14" cy="8" r="2"/>',
        texto: 'Cada canal mueve su voltaje hasta encontrar la punta de la curva de sus tres cadenas, donde dan más potencia. Si cambia el sol o la temperatura, la punta se mueve y el seguidor la vuelve a buscar.' },
    { parte: 'bus', nombre: 'Bus de corriente directa', modo: 'onda', abrir: true, accion: 'cuadrada', eq: 'Capacitores sin electrolito', recorrido: { noche: false, adentro: true },
        icono: '<path d="M4 8h16M4 16h16"/><path d="M9 8v8M15 8v8"/>',
        texto: 'Unos capacitores guardan la corriente directa por un instante, para que los transistores tengan de dónde tomar en cada pulso. La ficha dice que no son electrolíticos, los que más se gastan.' },
    { parte: 'puente', nombre: 'Puente de transistores', modo: 'onda', abrir: true, accion: 'cuadrada', eq: 'Miles de cambios por segundo', recorrido: { noche: false, adentro: true },
        icono: '<path d="M6 4v16M18 4v16M6 8h4l4 8h4M6 16h4l4-8h4"/>',
        texto: 'Transistores, interruptores sin piezas que se muevan, conectan cada fase al lado positivo o al negativo, muy rápido. Con pulsos más anchos donde la onda debe ser alta, la corriente sigue a una senoidal.' },
    { parte: 'filtro', nombre: 'Filtro de salida', modo: 'onda', abrir: true, accion: 'resonancia', eq: 'Bobinas y capacitores', recorrido: { noche: false, adentro: true },
        icono: '<path d="M3 12h3c1-4 2-4 3 0s2 4 3 0 2-4 3 0 2 4 3 0h3"/>',
        texto: 'Las bobinas frenan los cambios rápidos de los pulsos y los capacitores se llevan lo que queda: a la red sale casi pura la onda de 60 Hz. Si los pulsos caen en la frecuencia propia del filtro, la distorsión se dispara.' },
    { parte: 'disipador', nombre: 'Disipador sin ventiladores', modo: 'calor', accion: 'calorAire', eq: `Reduce potencia arriba de ${TRIO.reduce} °C`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M5 20V8M9 20V5M13 20V8M17 20V5"/><path d="M3 20h18"/>',
        texto: 'Lo que se pierde se vuelve calor, unos 670 W a plena carga en el modelo. Las aletas lo sueltan al aire sin ventiladores. Con el aire a más de 45 °C, el inversor baja su potencia para no calentarse de más.' },
    { parte: 'relevadores', nombre: 'Relevadores y anti-isla', modo: 'red', abrir: true, accion: 'apagon', eq: `Debe salir en ${num(RED.isla, 1)} s si queda en isla`, recorrido: { noche: false, adentro: true },
        icono: '<path d="M4 12h5l6-5M15 12h5"/><circle cx="9" cy="12" r="1.5"/>',
        texto: 'Abren para separar el inversor de la red. Si se va la luz, el inversor no debe seguir alimentando la calle: quien la repara podría electrocutarse. La regla le da medio segundo para notarlo y salir.' },
    { parte: 'control', nombre: 'Control', modo: 'red', abrir: true, accion: 'bajaFrec', eq: 'Vigila el voltaje y la frecuencia', recorrido: { noche: false, adentro: true },
        icono: '<rect x="4" y="6" width="16" height="12" rx="1.5"/><path d="M8 10h3M8 14h8"/>',
        texto: 'Decide cuándo prende cada transistor, busca la punta de cada canal y vigila la red. Si el voltaje o la frecuencia salen de rango, cuenta el tiempo que permite la regla y desconecta.' },
    { parte: 'transformador', nombre: 'Transformador de 45 kVA', modo: 'dia', accion: 'mediodia', eq: `De ${TRAFO.alta} a ${TRAFO.baja} V`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
        texto: 'Los inversores entregan a 480 V y la red del instituto es de 220 V: este transformador seco baja el voltaje. Es de 45 kVA, 10 % más que los 40 kW de los dos inversores.' },
    { parte: 'interconexion', nombre: 'Punto de interconexión', modo: 'red', accion: 'altoV', eq: 'Aquí se miden las reglas', recorrido: { noche: false, adentro: false },
        icono: '<rect x="6" y="3" width="12" height="18" rx="1.5"/><path d="M10 8h4M12 12v5"/>',
        texto: 'Donde la planta se une con la red. Aquí deben cumplirse las especificaciones técnicas de la generación distribuida: la distorsión, los tiempos para desconectarse y la espera de 5 minutos para volver.' },
    { parte: 'red', nombre: 'La red', modo: 'red', accion: 'apagon', eq: 'Corriente alterna de 60 Hz', recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 3v18M6 7h12M8 7l-3 5M16 7l3 5"/>',
        texto: 'La red marca el voltaje y la frecuencia; el inversor la sigue. Por eso solo puede entregar energía si hay red: sin ella, se apaga aunque haya sol.' },
];
const VISTAS = Object.fromEntries(PARTES_M.map(p => [p.id, p.vista]));
let planta = estadoPlanta();
const relojDia = { texto: 'el día', avanzar: (p, dt) => { p.hora = Math.min(LIMITES.hora[1], p.hora + dt * 0.6); return p.hora >= LIMITES.hora[1]; }, alSeguir: p => { if (p.hora >= LIMITES.hora[1] - 0.01) p.hora = LIMITES.hora[0]; } };
const MODOS = {
    dia: { nombre: 'Un día en Temixco', corto: 'Día', resumen: 'El sol cambia toda la mañana y toda la tarde, y con él la curva de las cadenas. Los seguidores mueven el voltaje para sacar lo más que se pueda. Corre el día o ponle nubes.', aclara: `Un día despejado de mayo, calibrado a los ${f1(MEDIDO.inversores)} kW que midió la tesis el ${MEDIDO.fecha}. El sol, el aire y el transformador son de ejemplo; las cadenas y el inversor salen de sus fichas.`, mando: { nombre: 'Hora', campo: 'hora', rango: LIMITES.hora, texto: v => `${hm(v)} h` }, mando2: { nombre: 'Nubes', campo: 'nubes', rango: LIMITES.nubes, texto: v => `${num(v * 100)} % menos sol` }, reloj: relojDia },
    onda: { nombre: 'Cómo sale la onda', corto: 'Onda', resumen: 'Los transistores solo saben prender y apagar. Con muchos pulsos de ancho variable y un filtro, la corriente que sale sigue a una senoidal. Cambia cuántos pulsos da y mira la distorsión.', aclara: 'El índice de modulación, el bus de 870 V y el filtro son de ejemplo. Solo cuenta la distorsión de los pulsos; la ficha da menos de 3 % con todo.', mando: { nombre: 'Pulsos por ciclo', campo: 'N', rango: LIMITES.N, texto: v => `${num(v)} · ${num((Math.round(v) * 60) / 1000, 1)} kHz` }, mando2: { nombre: 'Carga', campo: 's', rango: LIMITES.s, texto: v => `${num(v * 100)} % de 20 kW` } },
    red: { nombre: 'Con la red', corto: 'Red', resumen: 'Una planta conectada a la red debe salirse si el voltaje o la frecuencia se van de rango, más rápido cuanto más lejos. Si se va la luz, debe notarlo en medio segundo. Prueba.', aclara: 'Los tiempos son los de las especificaciones de la generación distribuida (CRE, RES/142/2017), para una central asíncrona de más de 30 kW. Los ajustes de 10 y 60 s y el tiempo en notar la isla son de ejemplo.', mando: { nombre: 'Voltaje en el punto de interconexión', campo: 'v', rango: LIMITES.v, texto: v => `${num(v)} % · ${num((v * TRAFO.baja) / 100)} V` }, mando2: { nombre: 'Frecuencia', campo: 'f', rango: LIMITES.f, texto: v => `${f1(v)} Hz` } },
    calor: { nombre: 'Calor y eficiencia', corto: 'Calor', resumen: 'De cada 100 W que entran, salen casi 98: el resto se vuelve calor y lo sueltan las aletas. Súbele la carga o calienta el aire y mira la eficiencia y cuánto puede dar.', aclara: `La curva de eficiencia es de ejemplo, ajustada a los ${num(TRIO.efMax, 1)} % y ${num(TRIO.efCEC, 1)} % CEC de la ficha; cuánto baja arriba de ${TRIO.reduce} °C también es de ejemplo.`, mando: { nombre: 'Carga', campo: 'carga', rango: LIMITES.carga, texto: v => `${num(v * 100)} % · ${f1(v * 20)} kW` }, mando2: { nombre: 'Temperatura del aire', campo: 'ta', rango: LIMITES.ta, texto: v => `${num(v)} °C` } },
};
const BOTONES = [
    { id: 'apagon', visible: p => p.modo === 'red', pulsado: p => p.apagon, texto: p => (p.apagon ? 'Que regrese la luz' : 'Que se vaya la luz'), alTocar: p => { p.apagon = !p.apagon; } },
];
const ACCIONES = {
    mediodia: { texto: p => (Math.abs(p.hora - 13.6) < 0.05 && p.nubes === 0 ? 'Ver las 9 de la mañana' : 'Ver el mediodía'), hacer: (p, pag) => { const ya = Math.abs(p.hora - 13.6) < 0.05 && p.nubes === 0; p.hora = ya ? 9 : 13.6; p.nubes = 0; p.corre = false; pag.invalidar(); pag.ponerMando(); pag.rotular(); } },
    nublado: { texto: p => (p.nubes > 0 ? 'Quitar las nubes' : 'Que pase una nube'), hacer: (p, pag) => { p.nubes = p.nubes > 0 ? 0 : 0.6; pag.invalidar(); pag.ponerMando(); } },
    cuadrada: { texto: p => (p.N <= 1 ? 'Volver a 16 kHz' : 'Un solo pulso por ciclo'), hacer: (p, pag) => { p.N = p.N <= 1 ? DEF.N : 1; pag.invalidar(); pag.ponerMando(); } },
    resonancia: { texto: p => (p.N === 60 ? 'Volver a 16 kHz' : 'Pulsos en la resonancia'), hacer: (p, pag) => { p.N = p.N === 60 ? DEF.N : 60; pag.invalidar(); pag.ponerMando(); } },
    apagon: { texto: p => (p.apagon ? 'Que regrese la luz' : 'Que se vaya la luz'), hacer: (p, pag) => { p.apagon = !p.apagon; pag.invalidar(); pag.rotular(); } },
    bajaFrec: { texto: p => (p.f < 59 ? 'Volver a 60 Hz' : 'Bajar a 58 Hz'), hacer: (p, pag) => { p.f = p.f < 59 ? DEF.f : 58; pag.invalidar(); pag.ponerMando(); } },
    altoV: { texto: p => (p.v > 110 ? 'Volver al voltaje normal' : 'Subir el voltaje a 115 %'), hacer: (p, pag) => { p.v = p.v > 110 ? DEF.v : 115; pag.invalidar(); pag.ponerMando(); } },
    plena: { texto: p => (p.carga >= 1 ? 'Volver a 75 %' : 'A plena carga'), hacer: (p, pag) => { p.carga = p.carga >= 1 ? DEF.carga : 1; pag.invalidar(); pag.ponerMando(); } },
    calorAire: { texto: p => (p.ta > 45 ? 'Volver a 35 °C' : 'Aire a 55 °C'), hacer: (p, pag) => { p.ta = p.ta > 45 ? DEF.ta : 55; p.carga = 1; pag.invalidar(); pag.ponerMando(); } },
};

// ------------------------------------------------------------------ el tablero
const secciones = () => `
    ${seccionDiagrama('Lo que pasa en el inversor')}
    ${seccionGrafica('b')}
    ${seccionGrafica('c')}
    ${seccionBarras()}
    ${seccionTabla('La planta del IER', 'h-placa', 'Según una tesis de maestría del IER-UNAM, 2017.', 'h-tabla-texto')}
    ${seccionTabla('La ficha del inversor', 'h-ficha-inv', 'ABB TRIO-20.0-TL-OUTD, del anexo de la misma tesis.', 'h-tabla-texto')}
    ${seccionTabla('Lo que pide la red', 'h-reglas', 'Especificaciones técnicas de la generación distribuida (CRE, RES/142/2017).', 'h-tabla-texto')}
    ${seccionTabla('Lo que dice la ley', 'h-regla', 'Ley del Sector Eléctrico.')}
    ${seccionColores(FLUIDOS, 'La planta es real; el acomodo, la escala y el interior del inversor no. Son de ejemplo: el sol y el aire del día, el transformador, la curva de eficiencia, cuánto baja la potencia con el calor, el bus, el filtro, los ajustes de frecuencia y el tiempo en notar una isla.', 'Colores de lo que corre')}
    ${seccionFuentes(FUENTES, [
        { para: 'Qué es la Generación Distribuida, que no necesita permiso, cómo puede usar o vender su energía y su acceso a la red', titulo: 'Ley del Sector Eléctrico, arts. 3, 24, 25 y 26', nota: 'Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio' },
    ])}`;

function alPintarGraficas(L, pag) {
    const { $, pide, graficas } = pag;
    const m = pide.modo;
    graficas.b = null;
    graficas.c = null;
    if (m === 'dia') {
        const lb = [
            { clase: 'h-s-max', nombre: 'Lo que podrían dar los módulos', f: h => dia({ hora: h, nubes: L.nubes }).Pdisp / 1000 },
            { clase: 'h-s-actual', nombre: 'Salida de los inversores', f: h => dia({ hora: h, nubes: L.nubes }).Pac / 1000 },
            ...(L.nubes > 0 ? [{ clase: 'h-s-sin', nombre: 'Despejado', f: h => dia({ hora: h }).Pac / 1000 }] : []),
            { clase: 'h-s-norma', nombre: `Medido: ${f1(MEDIDO.inversores)} kW`, f: () => MEDIDO.inversores },
        ];
        const series = lb.slice(0, -1);
        $('#h-b-t').textContent = 'La potencia durante el día';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `kW de los dos inversores. El ${MEDIDO.fecha} entregaron de las ${hm(MEDIDO.inicio)} a las ${hm(MEDIDO.fin)} y llegaron a ${f1(MEDIDO.inversores)} kW. Hora de 2017, con horario de verano.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'La potencia durante el día', xMin: 6, xMax: 21, yMin: 0, yMax: 45, ticksX: [6, 9, 12, 15, 18, 21], ticksY: [0, 10, 20, 30, 40], etX: 'Hora', etY: 'kW', lineas: lb, fx: x => `${num(x)} h`, fy: y => num(y), punta: x => `${hm(x)} · ${series.map(l => `${l.nombre}: ${f1(l.f(x))} kW`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Hora', 'Sol, W/m²', 'Celda', 'Salida'], [8, 10, 12, 13.6, 15, 17, 19].map(h => { const d = dia({ hora: h, nubes: L.nubes }); return [hm(h), num(d.G), `${num(d.Tc)} °C`, `${kW(d.Pac)} kW`]; }));
        const c = L.inv[0].canales[0];
        const curva = V => (V * c.curva(V)) / 1000;
        const lc = [
            { clase: 'h-s-actual', nombre: `Un canal a las ${hm(L.hora)}`, f: curva },
            { clase: 'h-s-max', nombre: `Tope de ${TRIO.Icanal} A`, f: V => (V * TRIO.Icanal) / 1000 },
            ...(Math.abs(L.hora - 13.6) > 0.05 || L.nubes > 0 ? [{ clase: 'h-s-sin', nombre: 'Al mediodía despejado', f: V => (V * canal('yingli', sol(13.6), celda(sol(13.6), aire(13.6))).curva(V)) / 1000 }] : []),
        ];
        $('#h-c-t').textContent = 'La curva de un canal: tres cadenas Yingli';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `kW según el voltaje. El punto es donde lo pone el seguidor. Arriba de ${TRIO.plena[0]} V el inversor puede dar toda su potencia; con la celda caliente, la punta queda abajo, pero el canal opera desde ${TRIO.opera[0]} V.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'La curva de un canal', xMin: 0, xMax: 600, yMin: 0, yMax: 12, ticksX: [0, 200, 400, 600], ticksY: [0, 3, 6, 9, 12], etX: 'Voltaje, V', etY: 'kW', refsX: [{ x: TRIO.plena[0], texto: `${TRIO.plena[0]} V` }], lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} V · ${lc.map(l => `${l.nombre}: ${f2(l.f(x))} kW`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Voltaje', 'Corriente', 'kW'], [200, 300, 350, Math.round(c.V), 420, 450, 500].map(V => [`${num(V)} V`, `${f1(c.curva(V))} A`, f2(curva(V))]));
    } else if (m === 'onda') {
        const N = L.N;
        const ms = 1000 / 60;
        // con muchos pulsos se ve solo el principio del ciclo, para que quepan unos 14
        const ventana = ms * Math.min(1, 14 / N);
        const pts = [];
        const muestras = 1600;
        let prev = null;
        for (let i = 0; i <= muestras; i++) { const x = (ventana * i) / muestras; const v = brazo((2 * Math.PI * x) / ms, N); if (prev !== null && v !== prev) pts.push([x, prev]); pts.push([x, v]); prev = v; }
        const lb = [
            { clase: 'h-s-sin', nombre: 'Lo que hace un brazo de transistores', puntos: pts },
            { clase: 'h-s-actual', nombre: 'La onda que se busca', f: x => EJ.m * Math.sin((2 * Math.PI * x) / ms) },
        ];
        $('#h-b-t').textContent = ventana < ms ? `Lo que hacen los transistores en ${num(ventana, 2)} ms` : 'Lo que hacen los transistores en un ciclo';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `Un brazo conecta su fase al lado positivo (+1) o al negativo (−1) del bus. Con ${num(N)} pulsos por ciclo conmuta ${num(L.conmuta)} veces por segundo; donde la onda sube, el pulso positivo dura más.${ventana < ms ? ' Se ve solo el principio del ciclo de 16.7 ms.' : ''}`;
        const ticks = [0, 0.25, 0.5, 0.75, 1].map(k => +(k * ventana).toFixed(ventana < 1 ? 2 : 1));
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Lo que hacen los transistores', xMin: 0, xMax: ventana, yMin: -1.3, yMax: 1.3, ticksX: ticks, ticksY: [-1, 0, 1], etX: 'Milisegundos', etY: '× mitad del bus', lineas: [lb[1]], quebradas: [lb[0]], fx: x => num(x, ventana < 1 ? 2 : 1), fy: y => num(y), punta: x => `${num(x, 2)} ms · brazo: ${brazo((2 * Math.PI * x) / ms, N) > 0 ? '+1' : '−1'} · onda: ${f2(lb[1].f(x))}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Pulsos por ciclo', 'Frecuencia', 'Cambios por segundo'], [1, 9, 45, 99, 150, 267, 400].map(n => [num(n), `${num((n * 60) / 1000, 2)} kHz`, num(2 * n * 60)]));
        const lc = [
            { clase: 'h-s-actual', nombre: 'Distorsión contra la corriente nominal', f: k => onda({ N: (k * 1000) / 60 }).tdd },
            ...(L.s < 0.99 ? [{ clase: 'h-s-max', nombre: `Contra la corriente a ${num(L.s * 100)} % de carga`, f: k => onda({ N: (k * 1000) / 60, s: L.s }).thd }] : []),
            { clase: 'h-s-norma', nombre: `Límite: ${RED.tdd} %`, f: () => RED.tdd },
        ];
        const series = lc.slice(0, -1);
        $('#h-c-t').textContent = 'La distorsión según los pulsos';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Por ciento de la corriente. La regla la mide contra la corriente nominal: con poca carga, la misma distorsión pesa más. Además de los 5 % en total, cada armónica tiene su propio límite. El filtro resuena cerca de ${num((EJ.filtro.resonancia * 60) / 1000, 1)} kHz.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'La distorsión según los pulsos', xMin: 0.06, xMax: 24, yMin: 0, yMax: 20, ticksX: [0, 6, 12, 18, 24], ticksY: [0, 5, 10, 15, 20], etX: 'Frecuencia de los pulsos, kHz', etY: '%', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${f1(x)} kHz · ${series.map(l => `${l.nombre}: ${f2(l.f(x))} %`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Frecuencia', 'Distorsión', 'Peor armónica', 'De su límite', 'Cumple'], [9, 45, 99, 150, 200, 267, 400].map(n => { const o = onda({ N: n }); return [`${num(o.khz, 1)} kHz`, `${f2(o.tdd)} %`, num(o.peor.h), `${num(o.peor.veces * 100)} %`, o.cumple ? 'sí' : 'no']; }));
    } else if (m === 'red') {
        const tope = 2.5;
        const pv = [[30, 0.16], [50, 0.16], [50, 2], [88, 2], [88, tope], [110, tope], [110, 1], [120, 1], [120, 0.16], [135, 0.16]];
        const lb = [{ clase: 'h-s-actual', nombre: 'Tiempo máximo para salir (arriba: sigue operando)', puntos: pv }];
        $('#h-b-t').textContent = 'Cuánto aguanta con el voltaje fuera de rango';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = 'Segundos para desconectarse según el voltaje en el punto de interconexión, en por ciento del nominal. Entre 88 y 110 % opera sin límite; muy lejos, en 0.16 s, unos diez ciclos.';
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Cuánto aguanta con el voltaje fuera de rango', xMin: 30, xMax: 135, yMin: 0, yMax: tope, ticksX: [30, 50, 88, 110, 135], ticksY: [0, 0.5, 1, 1.5, 2], etX: 'Voltaje, % del nominal', etY: 's', quebradas: lb, fx: x => num(x), fy: y => num(y, 1), punta: x => `${num(x)} % · ${Number.isFinite(tiempoTension(x)) ? `sale en ${segundos(tiempoTension(x))}` : 'opera'}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Voltaje', 'Desconectarse en'], [['menos de 50 %', '0.16 s'], ['de 50 a 88 %', '2 s'], ['de 88 a 110 %', 'opera'], ['de 110 a 120 %', '1 s'], ['más de 120 %', '0.16 s']]);
        const pf = [[55.5, 0.16], [57, 0.16], [57, AJUSTE.baja], [58.8, AJUSTE.baja], [58.8, 320], [61.2, 320], [61.2, AJUSTE.alta], [62, AJUSTE.alta], [62, 0.16], [63.5, 0.16]];
        const lc = [{ clase: 'h-s-actual', nombre: 'Tiempo para salir, con ajustes de ejemplo (arriba: sigue operando)', puntos: pf }];
        $('#h-c-t').textContent = 'Cuánto aguanta con la frecuencia fuera de rango';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Para una central asíncrona de más de 30 kW. Entre 58.8 y 61.2 Hz opera. De 57 a 58.8 Hz debe aguantar al menos ${RED.frecuencia.bajaMin} s y salir antes de ${RED.frecuencia.bajaMax}; de 61.2 a 62 Hz, salir antes de ${RED.frecuencia.altaMax} s. Aquí, ${AJUSTE.baja} y ${AJUSTE.alta} s.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Cuánto aguanta con la frecuencia fuera de rango', xMin: 55.5, xMax: 63.5, yMin: 0, yMax: 320, ticksX: [56, 57, 58.8, 61.2, 63], ticksY: [0, 100, 200, 300], etX: 'Frecuencia, Hz', etY: 's', quebradas: lc, fx: x => num(x, 1), fy: y => num(y), punta: x => `${f1(x)} Hz · ${Number.isFinite(tiempoFrecuencia(x)) ? `sale en ${segundos(tiempoFrecuencia(x))}` : 'opera'}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Frecuencia', 'Desconectarse en'], [['más de 62 Hz', '0.16 s'], ['de 61.2 a 62 Hz', `hasta ${RED.frecuencia.altaMax} s (aquí, ${AJUSTE.alta})`], ['de 58.8 a 61.2 Hz', 'opera'], ['de 57 a 58.8 Hz', `de ${RED.frecuencia.bajaMin} a ${RED.frecuencia.bajaMax} s (aquí, ${AJUSTE.baja})`], ['menos de 57 Hz', '0.16 s']]);
    } else {
        const lb = [
            { clase: 'h-s-actual', nombre: 'Eficiencia', f: p => eficiencia(p) * 100 },
            { clase: 'h-s-norma', nombre: `CEC: ${num(TRIO.efCEC, 1)} %`, f: () => TRIO.efCEC },
        ];
        $('#h-b-t').textContent = 'La eficiencia según la carga';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `De cada 100 W de corriente directa, cuántos salen de alterna. Con poca carga pesa lo que gasta el propio inversor; con mucha, el calor en los transistores y las bobinas. La CEC pesa más la carga de 75 %. Curva de ejemplo.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'La eficiencia según la carga', xMin: 0.02, xMax: 1.1, yMin: 94, yMax: 99, ticksX: [0.25, 0.5, 0.75, 1], ticksY: [94, 95, 96, 97, 98, 99], etX: 'Carga', etY: '%', lineas: lb, fx: x => `${num(x * 100)} %`, fy: y => num(y), punta: x => `${num(x * 100)} % · ${f2(lb[0].f(x))} %` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Carga', 'Eficiencia', 'Peso en la CEC'], CEC.map(([p, w]) => [`${num(p * 100)} %`, `${f2(eficiencia(p) * 100)} %`, `${num(w * 100)} %`]));
        const lc = [
            { clase: 'h-s-actual', nombre: 'Lo más que puede dar', f: t => maxPorCalor(t) / 1000 },
            { clase: 'h-s-norma', nombre: 'Potencia nominal: 20 kW', f: () => TRIO.P / 1000 },
        ];
        $('#h-c-t').textContent = 'Lo más que da, según el aire';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Sin ventiladores, el calor sale por las aletas: con el aire más caliente sale peor. La ficha dice que reduce su potencia arriba de ${TRIO.reduce} °C y que opera hasta ${TRIO.temp[1]} °C; cuánto reduce es de ejemplo.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Lo más que da, según el aire', xMin: 10, xMax: 60, yMin: 0, yMax: 24, ticksX: [10, 20, 30, 40, 50, 60], ticksY: [0, 8, 16, 24], etX: 'Aire, °C', etY: 'kW', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} °C · ${f1(lc[0].f(x))} kW` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Aire', 'Lo más que da'], [25, 35, 45, 50, 55, 60].map(t => [`${num(t)} °C`, `${f1(maxPorCalor(t) / 1000)} kW`]));
    }
}
function pintarBarras(L, pag) {
    const { $, pide } = pag;
    let filas;
    if (pide.modo === 'dia') {
        const [a, b] = L.inv;
        filas = [
            { t: 'Inversor 1 (Yingli)', v: a.Pac / TRIO.P, activa: true, escala: 1.1 },
            { t: 'Inversor 2 (Solarever)', v: b.Pac / TRIO.P, escala: 1.1 },
            { t: `Corriente de un canal, de ${TRIO.Icanal} A`, v: a.canales[0].I / TRIO.Icanal, activa: a.canales[0].I > 0.95 * TRIO.Icanal, escala: 1 },
            { t: 'Voltaje de un canal, de 450 V', v: a.canales[0].V / TRIO.plena[0], escala: 1.2 },
        ];
        $('#h-d-t').textContent = 'Qué tan cargado va, de cada 100';
        $('#h-d-pie').textContent = L.opera ? `Al mediodía, cada canal llega cerca de sus ${TRIO.Icanal} A; con la celda caliente, su voltaje queda abajo de ${TRIO.plena[0]} V.` : 'Sin sol suficiente, el inversor no arranca: necesita al menos 65 W.';
    } else if (pide.modo === 'onda') {
        filas = [
            { t: 'Distorsión, % (límite 5)', v: L.tdd / 100, activa: L.tdd > RED.tdd, escala: 0.1, d: 1 },
            { t: 'Peor armónica, de su límite', v: L.peor.veces, activa: L.peor.veces > 1, escala: 2 },
            { t: 'Con esta carga, %', v: L.thd / 100, escala: 0.1, d: 1 },
        ];
        $('#h-d-t').textContent = 'La corriente que sale a la red';
        $('#h-d-pie').textContent = L.cumple ? 'Cumple: menos de 5 % en total y cada armónica abajo de su límite.' : `No cumple: ${L.tdd > RED.tdd ? 'pasa de 5 % en total' : `la armónica ${num(L.peor.h)} pasa de su límite de ${num(L.peor.lim * 100, 1)} %`}.`;
    } else if (pide.modo === 'red') {
        filas = [
            { t: 'Voltaje, % del nominal', v: L.v / 100, activa: Number.isFinite(L.tv), escala: 1.4 },
            { t: 'Frecuencia, % de 60 Hz', v: L.f / 60, activa: Number.isFinite(L.tf), escala: 1.1, d: 1 },
            { t: 'Espera para volver, de 5 min', v: L.espera / RED.vuelta.espera, activa: L.espera > 0, escala: 1 },
        ];
        $('#h-d-t').textContent = 'Lo que vigila el control';
        $('#h-d-pie').textContent = `Para volver, el voltaje debe estar en rango y la frecuencia entre ${f1(RED.vuelta.f[0])} y ${f1(RED.vuelta.f[1])} Hz durante 5 minutos. Aquí la espera corre 60 veces más rápido.`;
    } else {
        filas = [
            { t: 'Eficiencia', v: L.ef, activa: true, escala: 1, d: 1 },
            { t: 'Lo que se vuelve calor', v: L.Pac > 0 ? L.perd / (L.Pac + L.perd) : 0, escala: 0.05, d: 1 },
            { t: 'Potencia, de lo más que puede dar', v: L.tope > 0 ? Math.min(L.carga * TRIO.P, L.tope) / L.tope : 0, activa: L.recorta, escala: 1 },
        ];
        $('#h-d-t').textContent = 'El inversor, de cada 100';
        $('#h-d-pie').textContent = L.recorta ? `Con el aire a ${num(L.ta)} °C solo puede dar ${f1(L.tope / 1000)} kW: recorta.` : `Pierde ${num(L.perd)} W; el disipador queda a unos ${num(L.disipador)} °C (de ejemplo).`;
    }
    $('#h-barras').innerHTML = barrasHTML(filas);
}
function alPintarFijas({ $ }) {
    $('#h-placa').innerHTML = tablaHTML(['Qué', 'Cuánto'], [
        ['Lugar', `${PLANTA.lugar}, IER-UNAM, Temixco, Mor.; ${num(PLANTA.altitud)} m`],
        ['Potencia', `${f2(PLANTA.kWp)} kWp; ${PLANTA.modulos} módulos`],
        ['Módulos', `84 ${MODULOS.yingli.nombre} y 84 ${MODULOS.solarever.nombre}`],
        ['Arreglo', `cadenas de ${ARREGLO.serie}; ${ARREGLO.cadenas} por canal; ${ARREGLO.canales} canales por inversor`],
        ['Inclinación', `${PLANTA.inclinacion}° hacia el sur`],
        ['Sol', `${f1(PLANTA.irradiacion)} kWh/m² al día, promedio del año`],
        ['Inversores', '2 ABB TRIO-20.0-TL-OUTD'],
        ['Transformador', `${TRAFO.kVA} kVA, ${TRAFO.alta}/${TRAFO.baja} V, seco`],
        [`Medido el ${MEDIDO.fecha}`, `${f1(MEDIDO.inversores)} kW de los inversores; ${num(MEDIDO.transformador)} kW del transformador`],
        [`Medido el ${MEDIDO.otro.fecha}`, `${num(MEDIDO.otro.inversores)} kW y ${num(MEDIDO.otro.transformador)} kW`],
    ]);
    $('#h-ficha-inv').innerHTML = tablaHTML(['Qué', 'Cuánto'], [
        ['Potencia', `${num(TRIO.P)} W; máximo ${num(TRIO.Pmax)} W`],
        ['Salida', `${TRIO.V} V, 3 fases, 60 Hz; ${TRIO.Iac} A`],
        ['Seguidores', `${ARREGLO.canales}; ${num(TRIO.Pcanal)} W y ${TRIO.Icanal} A cada uno`],
        ['Voltaje de entrada', `opera de ${TRIO.opera[0]} a ${TRIO.opera[1]} V; plena potencia de ${TRIO.plena[0]} a ${TRIO.plena[1]} V; máximo ${num(TRIO.Vmax)} V`],
        ['Arranque', `${TRIO.arranque} V; entrega desde ${TRIO.umbral} W`],
        ['Eficiencia', `${num(TRIO.efMax, 1)} % máxima; ${num(TRIO.efCEC, 1)} % CEC`],
        ['Distorsión a potencia nominal', `menos de ${TRIO.thd} %`],
        ['Factor de potencia', `más de ${num(TRIO.fp, 3)}; ajustable ±${num(TRIO.fpAjuste, 1)}`],
        ['Temperatura', `de ${TRIO.temp[0]} a ${TRIO.temp[1]} °C; reduce arriba de ${TRIO.reduce} °C`],
        ['Enfriamiento y peso', `convección natural; ${TRIO.kg} kg`],
    ]);
    $('#h-reglas').innerHTML = tablaHTML(['Qué', 'Cuánto'], [
        ['Distorsión de la corriente', `${RED.tdd} % de la nominal`],
        ['Cada armónica impar', 'de 4 % (menores a 11) a 0.3 % (mayores a 35)'],
        ['Corriente directa', `menos de ${num(RED.cd, 1)} %`],
        ['Voltaje de 88 a 110 %', 'opera'],
        ['Frecuencia de 58.8 a 61.2 Hz', 'opera'],
        ['Isla no intencional', `salir en ${num(RED.isla, 1)} s`],
        ['Para volver', `${f1(RED.vuelta.f[0])} a ${f1(RED.vuelta.f[1])} Hz y esperar ${num(RED.vuelta.espera / 60)} min`],
        ['Circuito desenergizado', 'no debe energizarlo'],
    ]);
    $('#h-regla').innerHTML = tablaHTML(['Qué', 'Dónde lo dice'], [
        ['Generación Distribuida: la de una Generadora Exenta, en una central conectada a un circuito de distribución con muchos Centros de Carga', 'Ley, art. 3, fracc. XXII'],
        ['Es Generación Distribuida si la central es de menos de 0.7 MW', 'Ley, art. 25'],
        ['Una Generadora Exenta no necesita permiso para generar', 'Ley, art. 3, fracc. XXIV'],
        ['Puede usar su energía o venderla por medio de una Suministradora', 'Ley, art. 24'],
        ['Tiene acceso a las Redes Generales de Distribución cuando es técnicamente factible', 'Ley, art. 26'],
        ['Las especificaciones técnicas de interconexión deben incluir provisiones para la Generación Distribuida', 'Ley, art. 26, fracc. II'],
    ]);
}
function alActualizar(L, pag) {
    const { pide, ponerCifra, ponerLecturas, nivel, graficas } = pag;
    pintarBarras(L, pag);
    ponerCifra('aT', { dia: 'La planta a esta hora', onda: 'De pulsos a senoidal', red: 'El inversor y la red', calor: 'Lo que se calienta' }[pide.modo]);
    if (pide.modo === 'dia') {
        const c = L.inv[0].canales[0];
        const aviso = !L.opera ? 'Sin sol suficiente: los inversores no entregan.' : c.I > 0.95 * TRIO.Icanal ? `Cada canal va cerca de sus ${TRIO.Icanal} A.` : null;
        ponerLecturas([['Sol', `${num(L.G)} W/m²`, `a las ${hm(L.hora)}`], ['Celda', `${num(L.Tc)} °C`, `aire a ${num(L.ta)} °C`], ['Un canal', `${num(c.V)} V`, `${f1(c.I)} A`], ['Corriente directa', `${kW(L.Pdc)} kW`, 'de los módulos'], ['Corriente alterna', `${kW(L.Pac)} kW`, 'de los inversores'], ['Al transformador', `${kW(L.trafo)} kW`, 'a 220 V']], aviso);
        ponerCifra('hud', `${kW(L.Pac)} kW`);
        ponerCifra('hud2', `a las ${hm(L.hora)}`);
        graficas.b?.marcar(L.hora, L.Pac / 1000);
        graficas.c?.marcar(c.V, c.P / 1000);
        nivel(1, 'Sol', clamp01(L.G / 1100), `${num(L.G)} W/m²`);
        nivel(2, 'Salida', clamp01(L.Pac / 40000), `${kW(L.Pac)} kW`);
    } else if (pide.modo === 'onda') {
        const aviso = L.N <= 3 ? 'Con tan pocos pulsos sale casi una onda cuadrada: muchas armónicas.' : !L.cumple ? (L.tdd > RED.tdd ? `La distorsión, ${f1(L.tdd)} %, pasa del 5 % que permite la regla.` : `La armónica ${num(L.peor.h)} pasa de su límite de ${num(L.peor.lim * 100, 1)} %.`) : null;
        ponerLecturas([['Pulsos', `${num(L.N)} por ciclo`, `${f1(L.khz)} kHz`], ['Cambios', `${num(L.conmuta)}`, 'por segundo'], ['Distorsión', `${f2(L.tdd)} %`, 'de la corriente nominal'], ['Con esta carga', `${f2(L.thd)} %`, `a ${num(L.s * 100)} %`], ['Peor armónica', num(L.peor.h), `${num(L.peor.veces * 100)} % de su límite`], ['Voltaje por fase', `${num(L.fase)} V`, 'eficaz']], aviso);
        ponerCifra('hud', `${f2(L.tdd)} %`);
        ponerCifra('hud2', `de distorsión a ${f1(L.khz)} kHz`);
        graficas.c?.marcar(L.khz, L.tdd);
        nivel(1, 'Pulsos', clamp01(L.N / 400), `${f1(L.khz)} kHz`);
        nivel(2, 'Distorsión', clamp01(L.tdd / 20), `${f1(L.tdd)} %`);
    } else if (pide.modo === 'red') {
        const isla = L.apagon;
        const aviso = isla ? (L.conectado ? `Se fue la luz: el inversor lo nota en ${num(EJ.detecta, 1)} s y debe salir antes de ${num(RED.isla, 1)} s.` : 'Desconectado: no alimenta la calle sin red, aunque haya sol.') : !L.opera ? (L.conectado ? `Fuera de rango por ${L.porque}: debe salir en ${segundos(L.t)}; le quedan ${segundos(Math.max(0, L.t - L.fuera))} (el reloj corre 10 veces más rápido).` : `Fuera de rango por ${L.porque}: ya se desconectó.`) : !L.conectado ? `Todo en rango: espera ${num(L.espera / 60, 1)} min para volver.` : null;
        ponerLecturas([['Voltaje', `${num(L.volts)} V`, `${num(L.v)} % de 220 V`], ['Frecuencia', `${f1(L.f)} Hz`, '60 es la nominal'], ['Por voltaje', segundos(L.tv), 'para salir'], ['Por frecuencia', segundos(L.tf), 'para salir'], ['Inversor', L.conectado ? 'conectado' : 'fuera', isla ? 'sin red' : 'con red'], ['Para volver', L.espera > 0 ? `${num(L.espera / 60, 1)} min` : '—', L.vuelve ? 'en rango' : 'fuera de rango']], aviso);
        ponerCifra('hud', L.conectado ? 'Conectado' : 'Fuera');
        ponerCifra('hud2', isla ? 'se fue la luz' : `${num(L.v)} % · ${f1(L.f)} Hz`);
        graficas.b?.marcar(L.v, Math.min(2.5, L.tv));
        graficas.c?.marcar(L.f, Math.min(320, Number.isFinite(L.tf) ? L.tf : 320));
        nivel(1, 'Voltaje', clamp01((L.v - 30) / 105), `${num(L.v)} %`);
        nivel(2, 'Frecuencia', clamp01((L.f - 55.5) / 8), `${f1(L.f)} Hz`);
    } else {
        const aviso = L.recorta ? `Con el aire a ${num(L.ta)} °C solo puede dar ${f1(L.tope / 1000)} kW.` : null;
        ponerLecturas([['Salida', `${f1(L.Pac / 1000)} kW`, `${num(L.p * 100)} % de 20 kW`], ['Eficiencia', `${f2(L.ef * 100)} %`, 'sale de cada 100'], ['Calor', `${num(L.perd)} W`, 'por las aletas'], ['Disipador', `${num(L.disipador)} °C`, 'de ejemplo'], ['Lo más que da', `${f1(L.tope / 1000)} kW`, `con aire a ${num(L.ta)} °C`], ['CEC', `${f2(L.cec * 100)} %`, `ficha: ${num(TRIO.efCEC, 1)} %`]], aviso);
        ponerCifra('hud', `${f2(L.ef * 100)} %`);
        ponerCifra('hud2', 'de eficiencia');
        graficas.b?.marcar(L.carga, L.ef * 100);
        graficas.c?.marcar(L.ta, L.tope / 1000);
        nivel(1, 'Carga', clamp01(L.carga / 1.1), `${num(L.carga * 100)} %`);
        nivel(2, 'Calor', clamp01(L.perd / 800), `${num(L.perd)} W`);
    }
}

// ------------------------------------------------------------------ la planta
const PIDE0 = { hora: DEF.hora, nubes: DEF.nubes, N: DEF.N, s: DEF.s, v: DEF.v, f: DEF.f, carga: DEF.carga, ta: DEF.ta, apagon: false, corre: false };
crearPagina({
    figura: FIGURA,
    fichas: FICHAS,
    vistas: VISTAS,
    modos: MODOS,
    botones: BOTONES,
    acciones: ACCIONES,
    modo0: 'dia',
    pide: { ...PIDE0 },
    general: { Lx: 17.2, Lz: 7.2, alto: 3.4, mira: [-0.4, 1.4, -0.5], az: 16, el: 26, azVertical: 12, elVertical: 34 },
    etiquetas: { lienzo: 'Planta fotovoltaica con sus inversores en 3D: arrastra para girarla, toca un punto para conocerlo', modos: 'Qué ver en el inversor', puntos: 'Puntos clave del inversor', desarmar: 'Desarmar el inversor', lecturas: 'Lo que mide el inversor' },
    textoFinal: 'Toca cualquier punto para volver a verlo. Corre el día en «Un día en Temixco», cambia los pulsos en «Cómo sale la onda», quita la luz en «Con la red» o calienta el aire en «Calor y eficiencia».',
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
        planta = pasoPlanta(planta, { modo: pide.modo, apagon: pide.apagon, v: pide.v, f: pide.f }, dt);
    },
    poseDe: ({ pide, ve, encendido, t, dt, camara }) => pose({ modo: pide.modo, planta, hora: pide.hora, nubes: pide.nubes, N: pide.N, s: pide.s, v: pide.v, f: pide.f, carga: pide.carga, ta: pide.ta, noche: ve.noche, adentro: ve.adentro, desarme: ve.desarme, encendido, t, dt, camara }),
    firma: p => [p.modo, Math.round(p.hora * 4), Math.round(p.nubes * 20), Math.round(p.N), Math.round(p.s * 20), Math.round(p.v), Math.round(p.f * 10), Math.round(p.carga * 50), Math.round(p.ta)],
    alPintarFijas,
    alPintarGraficas,
    alActualizar,
    prueba: p => ({ hora: +p.hora.toFixed(2), nubes: +p.nubes.toFixed(2), N: Math.round(p.N), s: +p.s.toFixed(2), v: Math.round(p.v), f: +p.f.toFixed(1), carga: +p.carga.toFixed(2), ta: Math.round(p.ta), apagon: p.apagon, conectado: planta.conectado, espera: Math.round(planta.espera), tIsla: +planta.tIsla.toFixed(3) }),
});
// la onda se calcula una vez por cada número de pulsos; se adelanta la del arranque
armonicasOnda(DEF.N);
