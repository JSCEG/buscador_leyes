// «Cómo se genera la electricidad», en 3D y con el formato Búho de «¿Cómo funciona?». El generador de la Central Termoeléctrica Valle
// de México de la CFE: 340 MVA, 20 kV, 3,600 vueltas por minuto, enfriado con hidrógeno y agua. Cuatro formas de verlo: cómo nace el
// voltaje, sincronizar con la red, cargar el generador y lo que se calienta.
// Se arma con: node scripts/build-conceptos-3d.mjs generador
//
// Lo que se repite entre las plantas con física está en conceptos-3d/planta-comun/.
import { clamp01, num } from '../planta-comun/ayudas.js';
import { barrasHTML, leyenda, pintarGrafica, seccionBarras, seccionColores, seccionDiagrama, seccionFuentes, seccionGrafica, seccionTabla, tablaHTML } from '../planta-comun/graficas.js';
import { crearPagina } from '../planta-comun/pagina.js';
import { CODIGO, DEF, EJ, FLUIDOS, GEN, H2, IF_AIRE, LIMITES, PARTES as PARTES_M, SINCRO, VHZ, carga, curvaVacio, estadoPlanta, limitesQ, pasoPlanta, perdidas, pose, sincro, vacio } from './modelo.js';
import { P_PLANTA, construir, escenario, materiales } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';

const FIGURA = 'generador';
const f1 = x => num(x, 1);
const f2 = x => num(x, 2);
const grad = a => num(Math.round(a) || 0);
const PLENA = Math.round(GEN.S * EJ.fp);

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'turbina', nombre: 'Turbina de vapor', modo: 'carga', accion: 'plena', eq: `Hasta ${num(EJ.turbina)} MW, de ejemplo`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 12h4l3-6v12l3-6h8"/>',
        texto: 'El vapor de la caldera empuja sus álabes y hace girar todo el eje. Ella decide la potencia activa: para que el generador entregue más megawatts, hay que abrirle más vapor.' },
    { parte: 'eje', nombre: 'Eje y cople', modo: 'voltaje', accion: 'arrancar', eq: `${num(GEN.rpm)} vueltas por minuto`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M2 12h20M8 8v8M16 8v8"/>',
        texto: 'Une la turbina con el rotor: giran juntos. Con dos polos, cada vuelta es un ciclo, así que 3,600 vueltas por minuto dan 60 Hz. Una hidroeléctrica, más lenta, necesita muchos más polos.' },
    { parte: 'rotor', nombre: 'Rotor de dos polos', modo: 'voltaje', abrir: true, accion: 'arrancar', eq: 'Un polo norte y uno sur', recorrido: { noche: false, adentro: true },
        icono: '<circle cx="12" cy="12" r="7"/><path d="M12 5v14"/>',
        texto: 'Es un electroimán que gira: su campo magnético barre las barras del estator y en ellas aparece el voltaje. A más velocidad, más voltaje y más frecuencia.' },
    { parte: 'campo', nombre: 'Devanado de campo', modo: 'voltaje', abrir: true, accion: 'campo', eq: `${num(GEN.campo)} A a plena carga`, recorrido: { noche: false, adentro: true },
        icono: '<path d="M4 8c4-4 12-4 16 0M4 16c4 4 12 4 16 0"/>',
        texto: 'El cobre de las ranuras del rotor lleva corriente directa y hace el campo magnético. Con más corriente, más voltaje: sin carga y con los 3,519 A del máximo, el voltaje subiría al doble.' },
    { parte: 'nucleo', nombre: 'Núcleo del estator', modo: 'calor', abrir: true, accion: 'aire', eq: 'Láminas de acero', recorrido: { noche: false, adentro: true },
        icono: '<path d="M5 5h14M5 9h14M5 13h14M5 17h14"/>',
        texto: 'Paquetes de láminas delgadas de acero guían el campo magnético hacia las barras. El campo que cambia también lo calienta: es una pérdida que está aunque no haya carga.' },
    { parte: 'barras', nombre: 'Barras del estator', modo: 'carga', abrir: true, accion: 'plena', eq: `${num(GEN.I)} A en ${num(GEN.V * 1000)} V`, recorrido: { noche: false, adentro: true },
        icono: '<path d="M4 6h16M4 12h16M4 18h16"/>',
        texto: 'Tres fases de barras de cobre a lo largo del núcleo. Ahí aparece el voltaje y por ahí sale la corriente: 9,650 A a 20,000 V, unos 340 MVA. Las enfría el agua.' },
    { parte: 'escobillas', nombre: 'Anillos y escobillas', modo: 'voltaje', accion: 'campo', eq: 'Corriente directa al rotor', recorrido: { noche: false, adentro: false },
        icono: '<circle cx="9" cy="12" r="4"/><circle cx="15" cy="12" r="4"/><path d="M9 5V3M15 5V3"/>',
        texto: 'Por dos anillos que giran con el eje y las escobillas de carbón que los rozan entra al rotor la corriente directa del campo. La tesis muestra las de un generador de 300 MVA de esta central.' },
    { parte: 'excitacion', nombre: 'Sistema de excitación', modo: 'carga', accion: 'bajaCampo', eq: `${GEN.excitacion}, ${GEN.excitacionV} V`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6"/>',
        texto: 'Decide cuánta corriente lleva el campo, y así el voltaje y la potencia reactiva: con más campo, el generador da reactiva a la red; con menos, la absorbe. El Código de Red pide control automático.' },
    { parte: 'hidrogeno', nombre: 'Hidrógeno', modo: 'calor', accion: 'aire', eq: `A ${f2(GEN.h2)} kg/cm²`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="8" y="3" width="8" height="18" rx="4"/><path d="M10 8h4"/>',
        texto: 'Llena el generador en lugar de aire: pesa 14 veces menos, guarda unas 14 veces más calor y lo conduce 7 veces mejor, y el rotor pierde 10 a 12 veces menos al girar. Mezclado con aire, del 5 al 75 %, explota.' },
    { parte: 'agua', nombre: 'Agua del estator', modo: 'calor', accion: 'plena', eq: `${num(GEN.agua)} L por hora`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/>',
        texto: 'Un circuito cerrado de agua se lleva el calor de las barras del estator. Según la tesis, enfriar con hidrógeno y agua permite máquinas más chicas para la misma potencia.' },
    { parte: 'bus', nombre: 'Bus de fase aislada', modo: 'carga', accion: 'plena', eq: 'Tres ductos, uno por fase', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="4" cy="7" r="1.5"/>',
        texto: 'Lleva la corriente del generador al transformador: cada fase va dentro de su propio ducto metálico. A plena carga pasan unos 9,800 A por cada una, a 20,000 V.' },
    { parte: 'interruptor', nombre: 'Interruptor de generador', modo: 'sincronizar', accion: 'auto', eq: '52G', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 12h5l6-5M15 12h5"/>',
        texto: 'Conecta el generador a la red. Su verificador de sincronismo no lo deja cerrar si el voltaje, la frecuencia o el ángulo difieren de más: así lo pide la norma CFE G0100-07.' },
    { parte: 'sincro', nombre: 'Sincronoscopio', modo: 'sincronizar', accion: 'auto', eq: `Cerrar con menos de ${SINCRO.verificador.dA}°`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="12" r="8"/><path d="M12 12V5"/>',
        texto: 'Su aguja gira con la diferencia de frecuencia: hacia «rápido» si el generador va más rápido que la red. Se cierra cuando pasa por arriba, despacio y hacia «rápido», para no tomar energía de la red.' },
    { parte: 'transformador', nombre: 'Transformador elevador', modo: 'carga', accion: 'plena', eq: `De ${num(GEN.V)} kV a la red`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
        texto: 'Sube los 20,000 V del generador al voltaje de la red de transmisión, para que la misma energía viaje con menos corriente y se pierda menos.' },
];
const VISTAS = Object.fromEntries(PARTES_M.map(p => [p.id, p.vista]));
let planta = estadoPlanta();
const arranque = { texto: 'el arranque', avanzar: (p, dt) => { p.rpm = Math.min(GEN.rpm, p.rpm + dt * 420); return p.rpm >= GEN.rpm; }, alSeguir: p => { if (p.rpm >= GEN.rpm - 1) p.rpm = 0; } };
const MODOS = {
    voltaje: { nombre: 'Cómo nace el voltaje', corto: 'Voltaje', resumen: 'Gira el rotor y súbele el campo. La frecuencia sale solo de la velocidad: con dos polos, vueltas por minuto entre 60. El voltaje sale de la velocidad y del campo; si sube más que la frecuencia, el núcleo se sobreexcita.', aclara: 'La curva de vacío y su saturación son de ejemplo, ajustadas a los 3,060 A de campo de la placa. Sin carga, el interruptor está abierto.', mando: { nombre: 'Velocidad', campo: 'rpm', rango: LIMITES.rpm, texto: v => `${num(v)} rpm` }, mando2: { nombre: 'Corriente de campo', campo: 'campo', rango: LIMITES.campo, texto: v => `${num(v)} A` }, reloj: arranque },
    sincronizar: { nombre: 'Sincronizar con la red', corto: 'Sincronizar', resumen: 'Antes de conectarlo, el generador debe ir casi igual que la red: mismo voltaje, misma frecuencia y en fase. Ajusta la velocidad y el voltaje, espera a que la aguja pase por arriba y cierra el interruptor.', aclara: 'Los límites son los del verificador de sincronismo de la norma CFE G0100-07. La corriente al cerrar fuera de fase usa reactancias de ejemplo.', mando: { nombre: 'Velocidad', campo: 'rpmS', rango: LIMITES.rpmS, texto: v => `${num(v)} rpm · ${num((v * GEN.polos) / 120, 2)} Hz` }, mando2: { nombre: 'Voltaje del generador', campo: 'vS', rango: LIMITES.vS, texto: v => `${f1(v)} % de la red` } },
    carga: { nombre: 'Cargar el generador', corto: 'Carga', resumen: 'Ya conectado, la turbina decide los megawatts y el campo decide la reactiva. Súbele potencia y mira cómo se adelanta el rotor; bájale el campo y mira cuándo absorbe reactiva o se acerca a perder el paso.', aclara: `La reactancia síncrona de ${f1(EJ.Xd)}, el factor de potencia de ${f2(EJ.fp)}, la turbina de ${num(EJ.turbina)} MW y el margen de ${EJ.delta}° son de ejemplo. La red se toma fija, en su voltaje.`, mando: { nombre: 'Potencia de la turbina', campo: 'P', rango: LIMITES.P, texto: v => `${num(v)} MW` }, mando2: { nombre: 'Corriente de campo', campo: 'campoC', rango: LIMITES.campoC, texto: v => `${num(v)} A` } },
    calor: { nombre: 'Lo que se calienta', corto: 'Calor', resumen: 'Un generador así entrega casi 99 de cada 100 MW que le da la turbina; el resto se vuelve calor en el cobre, el campo, el núcleo y el roce con el gas. Cambia la carga o el gas y mira cuánto se pierde.', aclara: `Las pérdidas del núcleo, del cobre del estator y de la ventilación con aire son de ejemplo; la del campo sale de la placa: ${GEN.excitacionV} V por ${num(GEN.campo)} A.`, mando: { nombre: 'Carga', campo: 'cargaE', rango: LIMITES.cargaE, texto: v => `${num(v * 100)} % de 340 MVA` } },
};
const BOTONES = [
    { id: 'cerrar', visible: p => p.modo === 'sincronizar', pulsado: p => p.cerrar, texto: p => (p.cerrar ? 'Abrir el interruptor' : 'Cerrar el interruptor'), alTocar: p => {
        if (p.cerrar) { p.cerrar = false; return; }
        const s = sincro({ rpmS: p.rpmS, vS: p.vS, angulo: planta.angulo });
        if (s.puede || !p.verificador) p.cerrar = true;
        else p.bloqueo = performance.now();
    } },
    { id: 'verificador', visible: p => p.modo === 'sincronizar', pulsado: p => !p.verificador, texto: p => (p.verificador ? 'Quitar el verificador' : 'Poner el verificador'), alTocar: p => { p.verificador = !p.verificador; } },
    { id: 'medio', visible: p => p.modo === 'calor', pulsado: p => p.medio === 'aire', texto: p => (p.medio === 'aire' ? 'Volver al hidrógeno' : 'Enfriar con aire'), alTocar: p => { p.medio = p.medio === 'aire' ? 'h2' : 'aire'; } },
];
const ACCIONES = {
    plena: { texto: p => (p.P === PLENA && p.campoC === GEN.campo ? 'Regresar a 250 MW' : 'Llevarlo a plena carga'), hacer: (p, pag) => { const ya = p.P === PLENA && p.campoC === GEN.campo; p.P = ya ? DEF.P : PLENA; p.campoC = ya ? DEF.campoC : GEN.campo; p.cargaE = ya ? DEF.cargaE : 1; pag.invalidar(); pag.ponerMando(); } },
    arrancar: { texto: () => 'Arrancar desde cero', hacer: (p, pag) => { p.rpm = 0; p.corre = true; pag.invalidar(); pag.ponerMando(); pag.rotular(); } },
    campo: { texto: p => (p.campo >= GEN.campoMax ? 'Regresar el campo de vacío' : 'Todo el campo, sin carga'), hacer: (p, pag) => { p.campo = p.campo >= GEN.campoMax ? DEF.campo : GEN.campoMax; p.rpm = GEN.rpm; p.corre = false; pag.invalidar(); pag.ponerMando(); } },
    aire: { texto: p => (p.medio === 'aire' ? 'Volver al hidrógeno' : 'Enfriar con aire'), hacer: (p, pag) => { p.medio = p.medio === 'aire' ? 'h2' : 'aire'; pag.invalidar(); pag.rotular(); } },
    bajaCampo: { texto: p => (p.campoC < 2000 ? 'Regresar el campo' : 'Bajarle el campo'), hacer: (p, pag) => { p.campoC = p.campoC < 2000 ? DEF.campoC : 1750; p.P = DEF.P; pag.invalidar(); pag.ponerMando(); } },
    auto: { texto: p => (p.cerrar ? 'Abrir el interruptor' : 'Sincronizar solo'), hacer: (p, pag) => { if (p.cerrar) p.cerrar = false; else { p.rpmS = 3602; p.vS = 102; p.verificador = true; p.auto = true; } pag.invalidar(); pag.ponerMando(); pag.rotular(); } },
};

// ------------------------------------------------------------------ el tablero
const secciones = () => `
    ${seccionDiagrama('Lo que pasa en el generador')}
    ${seccionGrafica('b')}
    ${seccionGrafica('c')}
    ${seccionBarras()}
    ${seccionTabla('La placa del generador', 'h-placa', 'Central Termoeléctrica Valle de México, según una tesis de la UNAM.', 'h-tabla-texto')}
    ${seccionTabla('Para sincronizar', 'h-sincro', 'Valores máximos de la norma CFE G0100-07 (tabla 4).', 'h-tabla-texto')}
    ${seccionTabla('Lo que pide el Código de Red', 'h-codigo', 'A las centrales síncronas: Manual de Interconexión, 2021.', 'h-tabla-texto')}
    ${seccionTabla('Hidrógeno contra aire', 'h-h2', 'Según la misma tesis de la UNAM.', 'h-tabla-texto')}
    ${seccionTabla('Lo que dice la ley', 'h-regla', 'Ley del Sector Eléctrico.')}
    ${seccionColores(FLUIDOS, 'El generador es real; la nave, el acomodo y la escala no. Son de ejemplo: el factor de potencia de 0.85, las reactancias, la saturación, la turbina de 300 MW, el margen de 75° y las pérdidas del núcleo, del cobre y de la ventilación.', 'Colores de lo que corre')}
    ${seccionFuentes(FUENTES, [
        { para: 'Qué es una Central Eléctrica, quién da los permisos, desde qué tamaño se necesita uno y que las centrales operan con las instrucciones del CENACE', titulo: 'Ley del Sector Eléctrico, arts. 3, 11, 19 y 22', nota: 'Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio' },
    ])}`;

function alPintarGraficas(L, pag) {
    const { $, pide, graficas } = pag;
    const m = pide.modo;
    graficas.b = null;
    graficas.c = null;
    if (m === 'voltaje') {
        const lb = [
            { clase: 'h-s-actual', nombre: 'Con saturación', f: a => curvaVacio(a / IF_AIRE) * 100 },
            { clase: 'h-s-sin', nombre: 'Sin saturación', f: a => (a / IF_AIRE) * 100 },
            { clase: 'h-s-norma', nombre: `Alarma V/Hz, ${VHZ.alarma} %`, f: () => VHZ.alarma },
        ];
        $('#h-b-t').textContent = 'La curva de vacío, a 3,600 vueltas por minuto';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `Voltaje sin carga, en por ciento de 20 kV, según la corriente de campo. Con ${num(IF_AIRE)} A da los 20 kV; el hierro se satura y cada ampere de más rinde menos. Curva de ejemplo.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'La curva de vacío', xMin: 0, xMax: GEN.campoMax, yMin: 0, yMax: 300, ticksX: [0, 1000, 2000, 3000], ticksY: [0, 100, 200, 300], etX: 'Corriente de campo, A', etY: '% de 20 kV', lineas: lb, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} A · ${lb.slice(0, 2).map(l => `${l.nombre}: ${num(l.f(x))} %`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Campo', 'Con saturación', 'Sin saturación'], [0, 600, 1235, 2000, 3060, 3519].map(a => [`${num(a)} A`, `${num(lb[0].f(a))} %`, `${num(lb[1].f(a))} %`]));
        const igual = Math.abs(L.campo - IF_AIRE) < 20;
        const lc = [
            ...(igual ? [] : [{ clase: 'h-s-actual', nombre: `Con ${num(L.campo)} A`, f: r => vacio({ rpm: r, campo: L.campo }).v * 100 }]),
            { clase: 'h-s-sin', nombre: `Con ${num(IF_AIRE)} A`, f: r => vacio({ rpm: r, campo: IF_AIRE }).v * 100 },
            { clase: 'h-s-norma', nombre: '20 kV', f: () => 100 },
        ];
        const series = lc.slice(0, -1);
        $('#h-c-t').textContent = 'El voltaje según la velocidad';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = 'Con el mismo campo, el voltaje crece con la velocidad, igual que la frecuencia: a la mitad de vueltas, mitad de voltaje y 30 Hz. Por eso V/Hz se mide como uno solo.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'El voltaje según la velocidad', xMin: 0, xMax: LIMITES.rpm[1], yMin: 0, yMax: 220, ticksX: [0, 900, 1800, 2700, 3600], ticksY: [0, 50, 100, 150, 200], etX: 'Vueltas por minuto', etY: '% de 20 kV', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} rpm, ${f1((x * GEN.polos) / 120)} Hz · ${series.map(l => `${l.nombre}: ${num(l.f(x))} %`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Vueltas', 'Hz', ...series.map(l => l.nombre)], [900, 1800, 2700, 3600, 3780].map(r => [num(r), f1((r * GEN.polos) / 120), ...series.map(l => `${num(l.f(r))} %`)]));
    } else if (m === 'sincronizar') {
        const lb = [
            { clase: 'h-s-actual', nombre: `Con ${f1(L.vS)} % de voltaje`, f: a => sincro({ rpmS: L.rpmS, vS: L.vS, angulo: a }).golpe },
            { clase: 'h-s-sin', nombre: 'Con el mismo voltaje', f: a => sincro({ rpmS: L.rpmS, vS: 100, angulo: a }).golpe },
            { clase: 'h-s-norma', nombre: 'Corriente nominal', f: () => 1 },
        ];
        $('#h-b-t').textContent = 'Si se cierra en este ángulo';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `Veces la corriente nominal (${num(GEN.I)} A) que pasaría al cerrar, según el ángulo entre el generador y la red. En fase casi no pasa nada; a 180°, más de diez veces. Reactancias de ejemplo.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Si se cierra en este ángulo', xMin: -180, xMax: 180, yMin: 0, yMax: 12, ticksX: [-180, -90, 0, 90, 180], ticksY: [0, 3, 6, 9, 12], etX: 'Ángulo, grados', etY: 'veces', lineas: lb, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)}° · ${lb.slice(0, 2).map(l => `${l.nombre}: ${f1(l.f(x))} veces`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Ángulo', 'Veces la nominal', 'kA'], [0, 7, 10, 30, 60, 90, 120, 180].map(a => { const s = sincro({ rpmS: L.rpmS, vS: L.vS, angulo: a }); return [`${num(a)}°`, f1(s.golpe), num(s.kA)]; }));
        const v = SINCRO.verificador.dA;
        const lc = [
            { clase: 'h-s-actual', nombre: `La aguja, con ${num(L.df, 3)} Hz`, f: t => ((((L.angulo + 360 * L.df * t + 180) % 360) + 360) % 360) - 180 },
            { clase: 'h-s-norma', nombre: `±${v}°: se puede cerrar`, f: () => v },
            { clase: 'h-s-max', nombre: `−${v}°`, f: () => -v },
        ];
        $('#h-c-t').textContent = 'La aguja en el próximo minuto';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = L.df === 0 ? 'Con la misma frecuencia la aguja no gira: así nunca llega a la ventana si no está ya en ella.' : `Da una vuelta cada ${f1(L.vuelta)} s. Cada vez que pasa por arriba, queda ${f1((2 * v) / (360 * Math.abs(L.df)))} s dentro de los ±${v}°: más lento, más tiempo para cerrar.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'La aguja en el próximo minuto', xMin: 0, xMax: 60, yMin: -180, yMax: 180, ticksX: [0, 15, 30, 45, 60], ticksY: [-180, -90, 0, 90, 180], etX: 'Segundos', etY: 'Grados', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} s · ${num(lc[0].f(x))}°` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Diferencia', 'Una vuelta cada', 'Tiempo en la ventana'], [0.01, 0.02, 0.04, 0.06, 0.1, 0.5].map(d => [`${num(d, 2)} Hz`, `${f1(1 / d)} s`, `${f1((2 * v) / (360 * d))} s`]));
    } else if (m === 'carga') {
        const lb = [
            { clase: 'h-s-actual', nombre: 'Lo más que da', f: P => limitesQ(P / GEN.S).arriba * GEN.S },
            { clase: 'h-s-max', nombre: 'Lo más que absorbe', f: P => limitesQ(P / GEN.S).abajo * GEN.S },
            { clase: 'h-s-norma', nombre: `Código: ±${num(CODIGO.qp * EJ.turbina)} MVAr`, f: () => CODIGO.qp * EJ.turbina },
            { clase: 'h-s-sin', nombre: 'Código, absorber', f: () => -CODIGO.qp * EJ.turbina },
        ];
        $('#h-b-t').textContent = 'La curva de capabilidad';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `MVAr que puede dar (arriba) y absorber (abajo) a cada potencia. Arriba lo limita el calor del estator o del campo; abajo, la estabilidad. La turbina llega a ${num(EJ.turbina)} MW. El punto es el de ahora.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'La curva de capabilidad', xMin: 0, xMax: 340, yMin: -300, yMax: 400, ticksX: [0, 100, 200, 300], ticksY: [-300, -150, 0, 150, 300], etX: 'Potencia, MW', etY: 'MVAr', lineas: lb, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} MW · da hasta ${num(lb[0].f(x))} MVAr · absorbe hasta ${num(-lb[1].f(x))} MVAr` });
        $('#h-tabla-b').innerHTML = tablaHTML(['MW', 'Da hasta, MVAr', 'Absorbe hasta, MVAr'], [0, 100, 200, 250, 289, 300].map(P => [num(P), num(lb[0].f(P)), num(-lb[1].f(P))]));
        const lc = [
            { clase: 'h-s-actual', nombre: `Con ${num(L.campoC)} A`, f: P => Math.min(90, carga({ P, campoC: L.campoC }).delta) },
            ...(Math.abs(L.campoC - GEN.campo) > 20 ? [{ clase: 'h-s-sin', nombre: `Con ${num(GEN.campo)} A`, f: P => carga({ P, campoC: GEN.campo }).delta }] : []),
            { clase: 'h-s-norma', nombre: `Margen, ${EJ.delta}°`, f: () => EJ.delta },
        ];
        const series = lc.slice(0, -1);
        $('#h-c-t').textContent = 'Cuánto se adelanta el rotor';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `El ángulo de carga (δ) según la potencia. Con más campo, el rotor se adelanta menos y queda más lejos de los 90°, donde se pierde el paso. Se deja un margen; aquí, de ${EJ.delta}°.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Cuánto se adelanta el rotor', xMin: 0, xMax: 340, yMin: 0, yMax: 90, ticksX: [0, 100, 200, 300], ticksY: [0, 30, 60, 90], etX: 'Potencia, MW', etY: 'Grados', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} MW · ${series.map(l => `${l.nombre}: ${l.f(x) >= 89.9 ? 'fuera de paso' : `${num(l.f(x))}°`}`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['MW', ...series.map(l => l.nombre)], [50, 100, 200, 250, 300, 340].map(P => [num(P), ...series.map(l => (l.f(P) >= 89.9 ? 'fuera de paso' : `${num(l.f(P))}°`))]));
    } else {
        const lb = [
            { clase: 'h-s-actual', nombre: 'Cobre del estator', f: s => perdidas({ cargaE: s, medio: L.medio }).cobre },
            { clase: 'h-s-max', nombre: 'Campo', f: s => perdidas({ cargaE: s, medio: L.medio }).campo },
            { clase: 'h-s-sin', nombre: 'Núcleo', f: s => perdidas({ cargaE: s, medio: L.medio }).nucleo },
            { clase: 'h-s-norma', nombre: 'Ventilación', f: s => perdidas({ cargaE: s, medio: L.medio }).ventilacion },
        ];
        $('#h-b-t').textContent = 'Lo que se pierde, según la carga';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `MW con ${L.medio === 'h2' ? 'hidrógeno' : 'aire'}. El núcleo y la ventilación pierden lo mismo con poca o mucha carga; el cobre crece con el cuadrado de la corriente. Valores de ejemplo, salvo el campo.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Lo que se pierde', xMin: 0.1, xMax: 1, yMin: 0, yMax: 2.5, ticksX: [0.1, 0.25, 0.5, 0.75, 1], ticksY: [0, 0.5, 1, 1.5, 2, 2.5], etX: 'Carga', etY: 'MW', lineas: lb, fx: x => `${num(x * 100)} %`, fy: y => f1(y), punta: x => `${num(x * 100)} % · ${lb.map(l => `${l.nombre}: ${f2(l.f(x))} MW`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Carga', ...lb.map(l => l.nombre)], [0.25, 0.5, 0.75, 1].map(s => [`${num(s * 100)} %`, ...lb.map(l => f2(l.f(s)))]));
        const lc = [
            { clase: 'h-s-actual', nombre: 'Con hidrógeno', f: s => perdidas({ cargaE: s, medio: 'h2' }).eficiencia * 100 },
            { clase: 'h-s-max', nombre: 'Con aire', f: s => perdidas({ cargaE: s, medio: 'aire' }).eficiencia * 100 },
        ];
        $('#h-c-t').textContent = 'Lo que sale de cada 100, según la carga';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Eficiencia: de cada 100 MW que da la turbina, cuántos salen a la red. Con hidrógeno, a plena carga, ${f2(perdidas({ cargaE: 1 }).eficiencia * 100)}; con aire, ${f2(perdidas({ cargaE: 1, medio: 'aire' }).eficiencia * 100)}.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'La eficiencia según la carga', xMin: 0.1, xMax: 1, yMin: 90, yMax: 100, ticksX: [0.1, 0.25, 0.5, 0.75, 1], ticksY: [90, 92, 94, 96, 98, 100], etX: 'Carga', etY: '%', lineas: lc, fx: x => `${num(x * 100)} %`, fy: y => num(y), punta: x => `${num(x * 100)} % · ${lc.map(l => `${l.nombre}: ${f2(l.f(x))} %`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Carga', 'Con hidrógeno', 'Con aire'], [0.1, 0.25, 0.5, 0.75, 1].map(s => [`${num(s * 100)} %`, `${f2(lc[0].f(s))} %`, `${f2(lc[1].f(s))} %`]));
    }
}
function pintarBarras(L, pag) {
    const { $, pide } = pag;
    let filas;
    if (pide.modo === 'voltaje') {
        filas = [{ t: 'V/Hz ahora', v: L.vhz / 100, activa: true, escala: 1.4 }, { t: 'Alarma', v: VHZ.alarma / 100, escala: 1.4 }, ...VHZ.pasos.map(p => ({ t: `Disparo en ${num(p.s, p.s < 1 ? 1 : 0)} s`, v: p.pct / 100, escala: 1.4 }))];
        $('#h-d-t').textContent = 'Voltaje entre frecuencia, de cada 100 de lo nominal';
        $('#h-d-pie').textContent = 'Pasos de la norma CFE G0100-07 cuando no hay curva del fabricante: a 106 % dispara en 100 s, a 108 % en 30 s y a 116 % en medio segundo.';
    } else if (pide.modo === 'sincronizar') {
        const v = SINCRO.verificador;
        filas = [
            { t: 'Voltaje, % de más', v: Math.max(0, L.dV) / 100, activa: L.ok.dV, escala: 0.1, d: 1 },
            { t: `Límite: ${v.dV} %`, v: v.dV / 100, escala: 0.1, d: 1 },
            { t: 'Ángulo, grados', v: Math.min(180, Math.abs(L.angulo)) / 100, activa: L.ok.dA, escala: 1.8 },
            { t: `Límite: ${v.dA}°`, v: v.dA / 100, escala: 1.8 },
        ];
        $('#h-d-t').textContent = 'Lo que revisa el verificador';
        $('#h-d-pie').textContent = `Además, la frecuencia del generador debe ir de 0 a +${num(v.df, 2)} Hz arriba de la red: la aguja debe girar hacia «rápido».`;
    } else if (pide.modo === 'carga') {
        filas = [
            { t: 'Corriente del estator', v: L.i, activa: L.limites.estator, escala: 1.2 },
            { t: 'Campo', v: L.campoC / GEN.campoMax, activa: L.limites.campo, escala: 1.2 },
            { t: 'Turbina', v: L.P / EJ.turbina, activa: L.limites.turbina, escala: 1.2 },
            { t: 'Ángulo del rotor', v: L.delta / EJ.delta, activa: L.limites.estabilidad, escala: 1.2 },
        ];
        $('#h-d-t').textContent = 'Qué tan cerca está de cada límite, de cada 100';
        $('#h-d-pie').textContent = L.dentro ? 'Dentro de su curva de capabilidad.' : 'Fuera de su curva: algo se calienta de más o el rotor queda sin margen.';
    } else {
        const t = L.total;
        filas = [['Cobre del estator', L.cobre], ['Campo', L.campo], ['Núcleo', L.nucleo], ['Ventilación', L.ventilacion]].map(([n, v], i) => ({ t: n, v: v / t, activa: i === 3 && L.medio === 'aire', escala: 1 }));
        $('#h-d-t').textContent = `Cómo se reparten los ${f2(t)} MW de calor, de cada 100`;
        $('#h-d-pie').textContent = L.medio === 'h2' ? `Con hidrógeno, la ventilación es lo de menos. Con aire costaría de ${H2.ventilacion[0]} a ${H2.ventilacion[1]} veces más.` : 'Con aire, ventilar el rotor es la pérdida más grande.';
    }
    $('#h-barras').innerHTML = barrasHTML(filas);
}
function alPintarFijas({ $ }) {
    $('#h-placa').innerHTML = tablaHTML(['Qué', 'Cuánto'], [
        ['Fabricante y modelo', `${GEN.fabricante}, ${GEN.modelo}`],
        ['Potencia', `${num(GEN.S * 1000)} kVA`],
        ['Voltaje y corriente', `${num(GEN.V * 1000)} V; ${num(GEN.I)} A`],
        ['Velocidad y frecuencia', `${num(GEN.rpm)} rpm; ${GEN.f} Hz`],
        ['Conexión', '3 fases, en estrella'],
        ['Enfriamiento', `agua e hidrógeno a ${f2(GEN.h2)} kg/cm²`],
        ['Flujo de agua', `${num(GEN.agua)} L por hora`],
        ['Campo a plena carga', `${num(GEN.campo)} A; máximo ${num(GEN.campoMax)} A`],
        ['Excitación', `${GEN.excitacion}; ${GEN.excitacionV} V a plena carga`],
        ['Aislamiento', `clase ${GEN.aislamiento}`],
    ]);
    const s = SINCRO;
    $('#h-sincro').innerHTML = tablaHTML(['Diferencia', 'Norma', 'Verificador', 'Automático'], [
        ['Voltaje', `0 a +${s.norma.dV} %`, `0 a +${s.verificador.dV} %`, `0 a +${s.automatico.dV} %`],
        ['Frecuencia', `±${num(s.norma.df, 3)} Hz`, `+${num(s.verificador.df, 2)} Hz`, `+${num(s.automatico.df, 2)} Hz`],
        ['Ángulo', `±${s.norma.dA}°`, `±${s.verificador.dA}°`, `±${s.automatico.dA}°`],
    ]);
    $('#h-codigo').innerHTML = tablaHTML(['Qué', 'Cuánto'], [
        ['Centrales tipo D en el SIN', `más de ${CODIGO.tipoD} MW`],
        ['Factor de potencia que deben sostener', `${f2(CODIGO.fp)} en atraso y en adelanto`],
        ['Reactiva a potencia máxima (área obligatoria)', `±${f2(CODIGO.qp)} de su potencia`],
        ['Con el voltaje entre', `${f2(CODIGO.v[0])} y ${f2(CODIGO.v[1])} por unidad`],
        ['Control del voltaje', 'excitación automática y permanente'],
    ]);
    $('#h-h2').innerHTML = tablaHTML(['Qué', 'Cuánto'], [
        ['Calor que guarda', `unas ${H2.calor} veces el del aire`],
        ['Cómo conduce el calor', `unas ${H2.conduce} veces mejor`],
        ['Lo que pesa', '1/14 del aire'],
        ['Pérdida por ventilación', `de 1/${H2.ventilacion[0]} a 1/${H2.ventilacion[1]} de la del aire`],
        ['Mezcla con aire que explota', `del ${H2.explota[0]} al ${H2.explota[1]} %`],
        ['Sobrepresión de máquinas modernas', `${f2(H2.sobrepresion[0])} a ${f1(H2.sobrepresion[1])} kg/cm²`],
    ]);
    $('#h-regla').innerHTML = tablaHTML(['Qué', 'Dónde lo dice'], [
        ['Una Central Eléctrica son las instalaciones y equipos que, en un sitio, permiten generar energía eléctrica', 'Ley, art. 3, fracc. V'],
        ['Toda central de 0.7 MW o más necesita permiso de generación; las menores son Generadoras Exentas', 'Ley, art. 19'],
        ['La Comisión Nacional de Energía (CNE) otorga los permisos, con la planeación vinculante de la SENER', 'Ley, art. 11, fracc. I'],
        ['Las centrales operan cumpliendo las Reglas del Mercado y las instrucciones del CENACE', 'Ley, art. 22, fracc. II'],
    ]);
}
function alActualizar(L, pag) {
    const { pide, ponerCifra, ponerLecturas, nivel, graficas } = pag;
    pintarBarras(L, pag);
    ponerCifra('aT', { voltaje: 'La frecuencia y el voltaje', sincronizar: 'El generador y la red', carga: 'El generador conectado', calor: 'Lo que se calienta' }[pide.modo]);
    if (pide.modo === 'voltaje') {
        const aviso = L.vhz > VHZ.pasos[2].pct ? `V/Hz en ${num(L.vhz)} %: la protección dispararía en medio segundo.` : L.vhz > VHZ.alarma ? `V/Hz en ${num(L.vhz)} %: pasa de la alarma de ${VHZ.alarma} %.` : null;
        ponerLecturas([['Velocidad', `${num(L.rpm)} rpm`, `${num(GEN.rpm)} es la nominal`], ['Frecuencia', `${f1(L.f)} Hz`, 'vueltas por minuto entre 60'], ['Voltaje', `${f1(L.kV)} kV`, `${num(L.v * 100)} % de 20 kV`], ['Campo', `${num(L.campo)} A`, `máximo ${num(GEN.campoMax)} A`], ['V/Hz', `${num(L.vhz)} %`, `alarma en ${VHZ.alarma} %`], ['Interruptor', 'abierto', 'sin carga']], aviso);
        ponerCifra('hud', `${f1(L.kV)} kV`);
        ponerCifra('hud2', `${f1(L.f)} Hz`);
        graficas.b?.marcar(L.campo, L.e * 100);
        graficas.c?.marcar(L.rpm, L.v * 100);
        nivel(1, 'Velocidad', clamp01(L.rpm / LIMITES.rpm[1]), `${num(L.rpm)} rpm`);
        nivel(2, 'V/Hz', clamp01(L.vhz / 220), `${num(L.vhz)} %`);
    } else if (pide.modo === 'sincronizar') {
        const bloqueado = pide.bloqueo && performance.now() - pide.bloqueo < 4000;
        const que = [!L.ok.dV && 'el voltaje', !L.ok.df && 'la frecuencia', !L.ok.dA && 'el ángulo'].filter(Boolean).join(', ');
        const aviso = L.cerrado && L.golpe > 2 ? `Se cerró fuera de fase: ${f1(L.golpe)} veces la corriente nominal, unos ${num(L.kA)} kA, y un golpe en el eje.` : bloqueado ? `El verificador no dejó cerrar: falta ${que}.` : !pide.verificador ? 'Sin verificador, el interruptor cierra aunque no esté en fase.' : null;
        ponerLecturas([['Generador', `${f2(L.fg)} Hz`, `${num(L.rpmS)} rpm`], ['Diferencia', `${L.df >= 0 ? '+' : ''}${num(L.df, 3)} Hz`, L.df > 0 ? 'hacia «rápido»' : L.df < 0 ? 'hacia «lento»' : 'quieta'], ['Voltaje', `${L.dV >= 0 ? '+' : ''}${f1(L.dV)} %`, 'contra la red'], ['Ángulo', `${grad(L.angulo)}°`, `se cierra con ±${SINCRO.verificador.dA}°`], ['Una vuelta', Number.isFinite(L.vuelta) ? `${f1(L.vuelta)} s` : 'nunca', 'de la aguja'], ['Interruptor', L.cerrado ? 'cerrado' : 'abierto', L.cerrado ? 'en la red' : L.puede ? 'se puede cerrar' : 'todavía no']], aviso);
        ponerCifra('hud', L.cerrado ? 'En la red' : `${grad(L.angulo)}°`);
        ponerCifra('hud2', L.cerrado ? 'sincronizado' : `${L.df >= 0 ? '+' : ''}${num(L.df, 3)} Hz`);
        graficas.b?.marcar(L.angulo, L.golpe);
        nivel(1, 'Ángulo', clamp01(1 - Math.abs(L.angulo) / 180), `${grad(L.angulo)}°`);
        nivel(2, 'Voltaje', clamp01((L.vS - 94) / 12), `${f1(L.vS)} %`);
    } else if (pide.modo === 'carga') {
        const lim = L.limites;
        const aviso = lim.paso ? 'El campo no alcanza para esa potencia: el rotor pierde el paso y la protección lo saca.' : lim.estator ? 'La corriente pasa de la nominal: el estator se calienta de más.' : lim.campo ? 'El campo pasa de su máximo de 3,519 A.' : lim.turbina ? `La turbina no da más de ${num(EJ.turbina)} MW.` : lim.estabilidad ? `El rotor se adelanta más de ${EJ.delta}°: queda poco margen antes de perder el paso.` : null;
        ponerLecturas([['Potencia', `${num(L.P)} MW`, 'activa'], ['Reactiva', `${num(L.Q)} MVAr`, L.adelanto ? 'la absorbe' : 'la da'], ['Corriente', `${num(L.I)} A`, `${num(L.i * 100)} % de la nominal`], ['Factor de potencia', f2(L.fp), L.adelanto ? 'en adelanto' : 'en atraso'], ['Ángulo del rotor', `${num(L.delta)}°`, `margen hasta ${EJ.delta}°`], ['Campo', `${num(L.campoC)} A`, `E = ${f2(L.E)} por unidad`]], aviso);
        ponerCifra('hud', `${num(L.P)} MW`);
        ponerCifra('hud2', `${num(L.Q)} MVAr`);
        graficas.b?.marcar(L.P, L.Q);
        graficas.c?.marcar(L.P, Math.min(90, L.delta));
        nivel(1, 'Corriente', clamp01(L.i / 1.2), `${num(L.i * 100)} %`);
        nivel(2, 'Ángulo', clamp01(L.delta / 90), `${num(L.delta)}°`);
    } else {
        const aviso = L.medio === 'aire' ? `Con aire se pierden ${f2(L.ventilacion)} MW en ventilación, contra ${f2(perdidas({ cargaE: L.cargaE }).ventilacion)} con hidrógeno.` : null;
        ponerLecturas([['Carga', `${num(L.cargaE * 100)} %`, `${num(L.P)} MW`], ['Calor', `${f2(L.total)} MW`, 'en total'], ['Eficiencia', `${f2(L.eficiencia * 100)} %`, 'sale a la red'], ['Campo', `${f2(L.campo)} MW`, `${num(L.corriente)} A`], ['Cobre', `${f2(L.cobre)} MW`, 'del estator'], ['Ventilación', `${f2(L.ventilacion)} MW`, L.medio === 'h2' ? 'con hidrógeno' : 'con aire']], aviso);
        ponerCifra('hud', `${f2(L.eficiencia * 100)} %`);
        ponerCifra('hud2', 'de eficiencia');
        graficas.b?.marcar(L.cargaE, L.cobre);
        graficas.c?.marcar(L.cargaE, L.eficiencia * 100);
        nivel(1, 'Calor', clamp01(L.total / 6), `${f2(L.total)} MW`);
        nivel(2, 'Eficiencia', clamp01((L.eficiencia - 0.95) / 0.05), `${f2(L.eficiencia * 100)} %`);
    }
}

// ------------------------------------------------------------------ la nave
crearPagina({
    figura: FIGURA,
    fichas: FICHAS,
    vistas: VISTAS,
    modos: MODOS,
    botones: BOTONES,
    acciones: ACCIONES,
    modo0: 'voltaje',
    pide: { rpm: DEF.rpm, campo: DEF.campo, rpmS: DEF.rpmS, vS: DEF.vS, P: DEF.P, campoC: DEF.campoC, cargaE: DEF.cargaE, medio: DEF.medio, cerrar: false, verificador: true, auto: false, bloqueo: 0, corre: false },
    general: { Lx: 16.4, Lz: 6.4, alto: 2.6, mira: [-0.2, 1.0, 0], az: 24, el: 24, azVertical: 16, elVertical: 34 },
    etiquetas: { lienzo: 'Generador de una central termoeléctrica en 3D: arrastra para girarlo, toca un punto para conocerlo', modos: 'Qué ver en el generador', puntos: 'Puntos clave del generador', desarmar: 'Desarmar el generador', lecturas: 'Lo que mide el generador' },
    textoFinal: 'Toca cualquier punto para volver a verlo. Arráncalo en «Cómo nace el voltaje», conéctalo en «Sincronizar con la red», súbele potencia en «Cargar el generador» o enfríalo con aire en «Lo que se calienta».',
    colores: { guindaSuave: '#f3d4de', claro: '#ffffff' },
    crearDiagrama,
    secciones,
    escena: (renderer, scene, { movil, oscuro }) => {
        const M = materiales(P_PLANTA);
        const est = escenario(renderer, scene, M, { movil, oscuro });
        return { planta: construir(M, P_PLANTA, { movil, oscuro }), est };
    },
    alCambiarModo: (p) => {
        Object.assign(p, { rpm: DEF.rpm, campo: DEF.campo, rpmS: DEF.rpmS, vS: DEF.vS, P: DEF.P, campoC: DEF.campoC, cargaE: DEF.cargaE, medio: DEF.medio, cerrar: false, verificador: true, auto: false, bloqueo: 0, corre: false });
        planta = estadoPlanta();
    },
    alCuadro: ({ dt, pide }) => {
        // el sincronizador automático cierra cuando las tres diferencias caben en sus límites, más estrechos que los del verificador
        if (pide.modo === 'sincronizar' && pide.auto && !pide.cerrar) {
            const s = sincro({ rpmS: pide.rpmS, vS: pide.vS, angulo: planta.angulo });
            const a = SINCRO.automatico;
            if (s.dV >= 0 && s.dV <= a.dV && s.df > 0 && s.df <= a.df && Math.abs(s.angulo) <= a.dA) { pide.cerrar = true; pide.auto = false; }
        }
        planta = pasoPlanta(planta, { modo: pide.modo, cerrar: pide.cerrar, rpmS: pide.rpmS, vS: pide.vS }, dt);
    },
    poseDe: ({ pide, ve, encendido, t, dt, camara }) => pose({ modo: pide.modo, planta, rpm: pide.rpm, campo: pide.campo, rpmS: pide.rpmS, vS: pide.vS, P: pide.P, campoC: pide.campoC, cargaE: pide.cargaE, medio: pide.medio, noche: ve.noche, adentro: ve.adentro, desarme: ve.desarme, encendido, t, dt, camara }),
    firma: p => [p.modo, Math.round(p.rpm / 20), Math.round(p.campo / 20), Math.round(p.rpmS), Math.round(p.vS * 10), Math.round(p.P), Math.round(p.campoC / 20), Math.round(p.cargaE * 100), p.medio, Math.round(planta.angulo / 5), p.cerrar],
    alPintarFijas,
    alPintarGraficas,
    alActualizar,
    prueba: p => ({ rpm: Math.round(p.rpm), campo: Math.round(p.campo), rpmS: Math.round(p.rpmS), vS: +p.vS.toFixed(1), P: Math.round(p.P), campoC: Math.round(p.campoC), cargaE: +p.cargaE.toFixed(2), medio: p.medio, cerrar: p.cerrar, verificador: p.verificador, auto: p.auto, angulo: Math.round(planta.angulo), cerrado: planta.cerrado }),
});
