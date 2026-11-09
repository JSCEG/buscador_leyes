// «Subestación eléctrica», en 3D y con el formato Búho de «¿Cómo funciona?». Con el diseño de la subestación Coatepec, en Veracruz: dos líneas
// de 115 kV llegan a sus barras, un transformador de 12/16/20 MVA baja a 13.8 kV y cuatro circuitos salen a la ciudad. Cuatro formas de verla:
// un día de carga, el voltaje, una falla y un mantenimiento sin apagar.
// Se arma con: node scripts/build-conceptos-3d.mjs subestacion
//
// Lo que se repite entre las plantas con física está en conceptos-3d/planta-comun/.
import { clamp01, num } from '../planta-comun/ayudas.js';
import { barrasHTML, leyenda, pintarGrafica, seccionBarras, seccionColores, seccionDiagrama, seccionFuentes, seccionGrafica, seccionTabla, tablaHTML } from '../planta-comun/graficas.js';
import { crearPagina } from '../planta-comun/pagina.js';
import { APARTARRAYOS, CAMBIADOR, CAPACITOR, DEF, FLUIDOS, INTERRUPTOR, LIMITE, LIMITES, PARTES as PARTES_M, PASOS, RECIERRE, REPARTO, SUB, TC, TIERRA, TRAFO, amperes, bloqueo, dia, estadoPlanta, fallaEn, formaEn, mvaDe, pasoPlanta, pose, tRele, tapIdeal, tension } from './modelo.js';
import { P_PLANTA, construir, escenario, materiales } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';

const FIGURA = 'subestacion';
const f1 = x => num(x, 1);
const f2 = x => num(x, 2);
const hora = h => { const x = ((h % 24) + 24) % 24; const m = Math.floor((x % 1) * 60); return `${String(Math.floor(x)).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'lineas', nombre: 'Líneas de 115 kV', modo: 'carga', accion: 'punta', eq: `Llegan de la línea ${SUB.desde}`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M5 21 9 3h6l4 18M7 12h10M3 6h18"/>',
        texto: 'La energía llega en alta tensión por dos líneas: si una falla, queda la otra. Con más voltaje hace falta menos corriente para la misma potencia, y se pierde menos en el camino. Hasta arriba va el cable de guarda, que recibe los rayos antes que los conductores. El marco de acero las recibe y las baja al patio.' },
    { parte: 'apartarrayos', nombre: 'Apartarrayos', modo: 'falla', accion: 'rayo', eq: `Dejan pasar hasta ${APARTARRAYOS.descarga} kV; el equipo aguanta ${num(APARTARRAYOS.aguantaAqui)}`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M13 2 5 13h6l-2 9 8-12h-6z"/>',
        texto: 'Si un rayo pega en la línea, el voltaje se dispara. Estas columnas no hacen nada con el voltaje normal, pero ante un golpe así se vuelven conductoras y mandan el exceso a tierra en un instante. Van a la entrada de cada línea, junto al transformador y en cada circuito. Prueba con el botón.' },
    { parte: 'cuchillas', nombre: 'Cuchillas', modo: 'maniobra', accion: 'paso', eq: 'Se abren sin corriente: no pueden apagar un arco', recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 17h5l9-9M16 17h5"/><circle cx="8" cy="17" r="1.5"/><circle cx="16" cy="17" r="1.5"/>',
        texto: 'Son navajas que se levantan y dejan una abertura que se ve a simple vista. No sirven para cortar la corriente: si se abrieran con carga, se formaría un arco. Por eso primero abre el interruptor y después ellas. Algunas traen una navaja más, que aterriza el equipo para que nadie trabaje con algo energizado.' },
    { parte: 'interruptor', nombre: 'Interruptor de potencia', modo: 'falla', accion: 'falla', eq: `En 115 kV abre en 3 ciclos: ${INTERRUPTOR.alta.ms} milisegundos`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="5" y="7" width="14" height="10" rx="2"/><path d="M2 12h3M19 12h3M9 12h6"/>',
        texto: 'Este sí corta, incluso una falla de miles de amperes. Al separar sus contactos se forma un arco, y un gas, el SF6, lo apaga en milésimas de segundo. Hay uno por línea y uno para el transformador. Ese gas calienta el planeta 23,500 veces más que el CO₂: por eso se cuida que no se escape.' },
    { parte: 'medicion', nombre: 'Transformadores de medida', modo: 'falla', accion: 'falla', eq: `En cada circuito: ${TC} A se vuelven 5 A`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="12" r="7"/><path d="M12 12l4-3M5 12h2M17 12h2"/>',
        texto: 'Los relevadores y los medidores no pueden recibir miles de volts ni cientos de amperes. Estos aparatos les mandan una copia pequeña y fiel: los de corriente, 5 A por cada 600 en un circuito; los de potencial, unos cuantos volts. Con esa copia, la caseta sabe qué pasa y decide cuándo abrir.' },
    { parte: 'barras', nombre: 'Barras de 115 kV', modo: 'carga', accion: 'punta', eq: 'Unen las dos líneas con el transformador', recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 6h18M3 12h18M3 18h18"/><path d="M8 3v18M16 3v18"/>',
        texto: 'Son tubos de aluminio sobre aisladores, uno por fase. A ellas llegan las dos líneas y de ellas sale el transformador. Coatepec tenía además una barra de transferencia, que aquí no se dibuja: con ella y un interruptor de repuesto se puede dar mantenimiento sin desconectar una línea.' },
    { parte: 'transformador', nombre: 'Transformador de potencia', modo: 'carga', abrir: true, accion: 'vent', eq: `${TRAFO.etapas[0]}, ${TRAFO.etapas[1]} o ${TRAFO.etapas[2]} MVA, según sus ventiladores`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
        texto: 'Baja de 115 kV a 13.8 kV. Adentro, un núcleo de hierro y tres devanados de cobre van en aceite. Las pérdidas lo calientan: el aceite sube a los radiadores, se enfría y regresa. Con ventiladores aguanta más carga. Arriba está el tanque conservador, con el relevador Buchholz, que detecta el gas de una falla adentro.' },
    { parte: 'cambiador', nombre: 'Cambiador de derivaciones', modo: 'voltaje', abrir: true, accion: 'masDemanda', eq: `${CAMBIADOR.pasos * 2 + 1} posiciones de 0.625 %: ±10 %`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 3v18M7 8l5-5 5 5M7 16l5 5 5-5"/>',
        texto: 'Cuando sube la carga, el voltaje baja. Este mecanismo cambia cuántas vueltas del devanado se usan, sin cortar la corriente, y sube o baja un poco el voltaje en cada paso. Espera unos segundos antes de moverse, para no reaccionar a cada cambio pequeño. El número del gabinete dice en qué posición va.' },
    { parte: 'barras13', nombre: 'Barras de 13.8 kV', modo: 'maniobra', accion: 'paso', eq: 'Y una de interconexión, para no apagar', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 5v14M20 5v14M4 9h16M4 15h16"/>',
        texto: 'De estas barras sale cada circuito. Más afuera corre otra, la de interconexión: con sus cuchillas de paso se unen las salidas de dos circuitos, y el interruptor de uno lleva a los dos mientras el otro recibe mantenimiento. Así nadie se queda sin luz.' },
    { parte: 'alimentadores', nombre: 'Interruptores de 13.8 kV', modo: 'falla', abrir: true, accion: 'falla', eq: `Abren en unos ${INTERRUPTOR.media.ms} milisegundos`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="4" y="8" width="16" height="9" rx="2"/><path d="M8 8V5M16 8V5M12 12h.01"/>',
        texto: 'Hay uno para el transformador y uno por circuito. El de cada circuito tiene un relevador que mide la corriente: si pasa de lo normal, cuenta, y entre más grande la falla, menos tarda. Después de abrir, vuelve a cerrar solo, por si la falla ya se fue. Con la ficha abierta se ven sus contactos.' },
    { parte: 'capacitores', nombre: 'Banco de capacitores', modo: 'voltaje', accion: 'cap', eq: `${num(CAPACITOR.mvar, 1)} MVAr: seis unidades de 200 kVAr`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M10 4v16M14 4v16M3 12h7M14 12h7"/>',
        texto: 'Los motores y muchos aparatos piden, además de energía, una corriente que va y viene sin hacer trabajo. Estos capacitores la dan aquí mismo, en vez de que viaje desde las centrales. Así baja la corriente que pasa por el transformador y sube un poco el voltaje. Desconéctalos con el botón.' },
    { parte: 'caseta', nombre: 'Caseta de control', modo: 'falla', abrir: true, accion: 'falla', eq: 'Relevadores, medición, control y baterías', recorrido: { noche: false, adentro: false },
        icono: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h4M7 13h10M15 9h2"/>',
        texto: 'Aquí llegan las copias de corriente y voltaje, y aquí están los relevadores que deciden cuándo abrir: el diferencial y el Buchholz cuidan al transformador; los de sobrecorriente, a los circuitos. Sus baterías los mantienen despiertos aunque se vaya la luz. En el tablero, lo de 115 kV va en morado y lo de 13.8 kV en blanco.' },
    { parte: 'tierras', nombre: 'Red de tierras', modo: 'falla', abrir: true, accion: 'rayo', eq: `${num(TIERRA.metros)} m de cobre: ${f2(TIERRA.ohm)} Ω`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 3v9M5 12h14M8 16h8M10.5 20h3"/>',
        texto: 'Bajo la grava hay una malla de cable de cobre, con varillas de 3 m. Todo lo metálico, cerca incluida, va unido a ella. Si una falla manda corriente a la tierra, la malla la reparte para que el voltaje entre los pies, o entre la mano y los pies, no lastime a nadie. La grava ayuda: casi no conduce.' },
    { parte: 'colonia', nombre: 'Circuitos y colonia', modo: 'voltaje', accion: 'largo', eq: 'A la última casa le llega menos voltaje', recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 21V10l5-4 5 4v11M13 21v-7l4-3 4 3v7M3 21h18"/>',
        texto: 'Cada circuito sale en postes hacia su barrio, y el voltaje se va perdiendo a lo largo del cable: a la última casa le llega menos que a la primera. Un transformador de poste lo baja otra vez para las casas; eso se ve en la red de distribución. Si la luz de las ventanas baja, es que llega poco voltaje.' },
];
const VISTAS = Object.fromEntries(PARTES_M.map(p => [p.id, p.vista]));
const MODOS = {
    carga: { nombre: 'Un día de carga', corto: 'Carga', resumen: 'La carga sube de tarde y de noche, y el transformador se calienta con ella. Cuando el aceite pasa de cierta temperatura, se prenden los ventiladores. Cambia la demanda máxima y el calor del día.', aclara: 'El aceite caliente sube a los radiadores y regresa frío. La forma del día es de ejemplo.', mando: { nombre: 'Demanda máxima', campo: 'pico', rango: LIMITES.pico, texto: v => `${num(v)} MW` }, mando2: { nombre: 'Calor del día', campo: 'Tmax', rango: LIMITES.Tmax, texto: v => `${num(v)} °C` }, reloj: { texto: 'el día', avanzar: (p, dt) => { p.hora = (p.hora + (dt * 24) / 36) % 24; return false; } } },
    voltaje: { nombre: 'El voltaje', corto: 'Voltaje', resumen: 'Con más carga, el voltaje baja en el transformador y a lo largo del circuito. El cambiador de derivaciones lo corrige paso a paso, y los capacitores ayudan. Sube la demanda y mira cómo responde.', aclara: 'Del 115 kV que llega hasta la última casa del circuito 1. La banda y la espera del cambiador son de ejemplo.', mando: { nombre: 'Demanda', campo: 'P', rango: LIMITES.P, texto: v => `${f1(v)} MW` }, mando2: { nombre: 'Largo del circuito', campo: 'km', rango: LIMITES.km, texto: v => `${num(v)} km` } },
    falla: { nombre: 'Una falla', corto: 'Falla', resumen: 'Una rama cae sobre el circuito 1 y la corriente se dispara. El relevador cuenta, el interruptor abre, y a los segundos vuelve a cerrar por si la falla ya se fue. Mueve la rama y hazla caer.', aclara: 'El circuito 1, de las barras a la rama. Los ajustes del relevador y del recierre son de ejemplo.', mando: { nombre: 'Dónde cae la rama', campo: 'd', rango: LIMITES.d, texto: v => `a ${f1(v)} km` } },
    maniobra: { nombre: 'Mantenimiento', corto: 'Reparar', resumen: 'Para revisar el interruptor del circuito 2 sin dejar a nadie sin luz, se pasa su carga al interruptor del circuito 1 por la barra de interconexión. El orden importa. Da cada paso con el botón.', aclara: 'Los circuitos 1 y 2, la barra de interconexión y sus cuchillas de paso.', mando: { nombre: 'Demanda', campo: 'P', rango: LIMITES.P, texto: v => `${f1(v)} MW` } },
};
let planta = estadoPlanta();
function avanzarPaso(p, pag) {
    if (p.paso >= PASOS.length - 1) { p.paso = 0; p.aviso = null; }
    else {
        const no = bloqueo(p.paso, p.paso + 1, p.P);
        p.aviso = no;
        if (!no) p.paso += 1;
    }
    pag?.invalidar();
}
const BOTONES = [
    { id: 'vent', visible: p => p.modo === 'carga', pulsado: p => !p.vent, texto: p => (p.vent ? 'Ventiladores en automático' : 'Ventiladores descompuestos'), alTocar: p => { p.vent = !p.vent; } },
    { id: 'cap', visible: p => p.modo === 'voltaje', pulsado: p => !p.cap, texto: p => (p.cap ? 'Con capacitores' : 'Sin capacitores'), alTocar: p => { p.cap = !p.cap; } },
    { id: 'auto', visible: p => p.modo === 'voltaje', pulsado: p => !p.auto, texto: p => (p.auto ? 'Cambiador automático' : 'Cambiador quieto'), alTocar: p => { p.auto = !p.auto; } },
    { id: 'falla', visible: p => p.modo === 'falla', pulsado: p => p.falla, texto: p => (p.falla ? 'Quitar la falla' : 'Que caiga la rama'), alTocar: p => { p.falla = !p.falla; } },
    { id: 'tipo', visible: p => p.modo === 'falla', pulsado: p => p.tipo !== DEF.tipo, texto: p => (p.tipo === 'pasajera' ? 'Falla pasajera' : 'Falla que se queda'), alTocar: p => { p.tipo = p.tipo === 'pasajera' ? 'permanente' : 'pasajera'; p.falla = false; } },
    { id: 'rayo', visible: p => p.modo === 'falla', pulsado: () => false, texto: () => 'Que caiga un rayo', alTocar: p => { p.rayo = true; } },
    { id: 'paso', visible: p => p.modo === 'maniobra', pulsado: p => p.paso > 0, texto: p => PASOS[p.paso].boton ?? 'Regresar todo', alTocar: (p, pag) => avanzarPaso(p, pag) },
    { id: 'mal', visible: p => p.modo === 'maniobra', pulsado: () => false, texto: () => 'Abrir una cuchilla con corriente', alTocar: p => { if (p.paso < 3) { p.arco = true; p.aviso = 'Una cuchilla no apaga arcos: el bloqueo no la deja abrir mientras su interruptor esté cerrado.'; } else p.aviso = 'El interruptor 2 ya está abierto: sus cuchillas pueden abrirse sin arco.'; } },
];
const ACCIONES = {
    punta: { texto: () => 'Ir a la hora de más carga', hacer: (p, pag) => { p.hora = 19.5; p.corre = false; pag.ponerMando(); pag.invalidar(); pag.rotular(); } },
    vent: { texto: p => (p.vent ? 'Descomponer los ventiladores' : 'Arreglar los ventiladores'), hacer: (p, pag) => { p.vent = !p.vent; pag.invalidar(); pag.rotular(); } },
    masDemanda: { texto: p => (p.P > 20 ? 'Regresar la demanda' : 'Subir la demanda a 22 MW'), hacer: (p, pag) => { p.P = p.P > 20 ? DEF.P : 22; pag.invalidar(); pag.ponerMando(); } },
    cap: { texto: p => (p.cap ? 'Desconectar los capacitores' : 'Conectar los capacitores'), hacer: (p, pag) => { p.cap = !p.cap; pag.invalidar(); pag.rotular(); } },
    largo: { texto: p => (p.km > 15 ? 'Acortar el circuito' : 'Alargar el circuito a 20 km'), hacer: (p, pag) => { p.km = p.km > 15 ? DEF.km : 20; pag.invalidar(); pag.ponerMando(); } },
    falla: { texto: p => (p.falla ? 'Quitar la falla' : 'Que caiga la rama'), hacer: (p, pag) => { p.falla = !p.falla; pag.invalidar(); pag.rotular(); } },
    rayo: { texto: () => 'Que caiga un rayo', hacer: p => { p.rayo = true; } },
    paso: { texto: p => PASOS[p.paso].boton ?? 'Regresar todo', hacer: (p, pag) => { avanzarPaso(p, pag); pag.rotular(); } },
};

// ------------------------------------------------------------------ el tablero
const secciones = () => `
    ${seccionDiagrama('El transformador por dentro')}
    ${seccionGrafica('b')}
    ${seccionGrafica('c')}
    ${seccionBarras()}
    ${seccionTabla('La subestación Coatepec', 'h-coatepec', 'El diseño que hizo el Instituto de Investigaciones Eléctricas para la CFE, según una tesis de la UNAM de 1993. Para una de 30 MVA, el transformador comercial era de 18/24/30 MVA.', 'h-tabla-texto')}
    ${seccionTabla('Alta, media y baja tensión', 'h-niveles', 'El Reglamento de la Ley del Sector Eléctrico define la alta y la baja tensión; 13.8 kV queda en medio. El Código de Red de 2016 pedía a los centros de carga aguantar esos voltajes.', 'h-tabla-texto')}
    ${seccionTabla('Qué cuida a cada equipo', 'h-protec', 'Las protecciones del diseño de Coatepec. Los números son los de la lista de equipos de la tesis.', 'h-tabla-texto')}
    ${seccionTabla('La red de tierras de Coatepec', 'h-tierra', `Con un terreno de dos capas, de ${num(TIERRA.rho1, 1)} y ${num(TIERRA.rho2, 1)} Ω·m, medido en el sitio.`, 'h-tabla-texto')}
    ${seccionTabla('Lo que dice la ley', 'h-regla', 'Ley del Sector Eléctrico y su Reglamento.')}
    ${seccionColores(FLUIDOS, 'Tiene el diseño de la subestación Coatepec, pero no es su plano ni un simulador, y nada está a escala. No se dibuja su barra de transferencia de 115 kV. Son de ejemplo: la forma de la carga del día, su reparto entre circuitos, el factor de potencia, la constante de tiempo y el reparto del calor, las temperaturas en que entran los ventiladores, la consigna y las esperas del cambiador, el cable y el largo de los circuitos, y los ajustes del relevador y del recierre.', 'Colores de lo que corre')}
    ${seccionFuentes(FUENTES, [
        { para: 'La Red Eléctrica incluye las subestaciones; quién opera la transmisión y la distribución, y con qué reglas', titulo: 'Ley del Sector Eléctrico, arts. 3, 44, 46 y 57', nota: 'Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio' },
        { para: 'Qué es alta y baja tensión, la calidad del servicio y los daños por voltaje fuera de tolerancia', titulo: 'Reglamento de la Ley del Sector Eléctrico, arts. 2, 93 y 149', nota: 'Está en el acervo de este sitio' },
    ])}`;

function alPintarGraficas(L, pag) {
    const { $, pide, graficas } = pag;
    const m = pide.modo;
    graficas.b = null;
    graficas.c = null;
    if (m === 'carga') {
        const D = L.D;
        const lb = [
            { clase: 'h-s-actual', nombre: 'Carga', f: h => D.en('S', h) },
            { clase: 'h-s-norma', nombre: `Sin ventiladores: ${TRAFO.etapas[0]}`, f: () => TRAFO.etapas[0] },
            { clase: 'h-s-sin', nombre: `Un paso: ${TRAFO.etapas[1]}`, f: () => TRAFO.etapas[1] },
            { clase: 'h-s-max', nombre: `Dos pasos: ${TRAFO.etapas[2]}`, f: () => TRAFO.etapas[2] },
        ];
        $('#h-b-t').textContent = 'La carga del día, contra lo que aguanta';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `MVA que pasan por el transformador. Con ${num(L.pico)} MW de máximo, llega a ${f1(D.max.S)} MVA a las ${hora(D.h[D.S.indexOf(D.max.S)])}. Los capacitores ya están restados. La forma del día es de ejemplo.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'La carga del día', xMin: 0, xMax: 24, yMin: 0, yMax: 28, ticksX: [0, 6, 12, 18, 24], ticksY: [0, 7, 14, 21, 28], etX: 'Hora', etY: 'MVA', lineas: lb, fx: x => num(x), fy: y => num(y), punta: x => `${hora(x)} · ${f1(D.en('S', x))} MVA · ${num(D.en('P', x), 1)} MW` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Hora', 'MW', 'MVA', 'Ventiladores'], [0, 4, 8, 12, 16, 19.5, 22].map(h => [hora(h), f1(D.en('P', h)), f1(D.en('S', h)), ['Apagados', 'Un paso', 'Dos pasos'][D.en('etapa', h)]]));
        const lc = [
            { clase: 'h-s-actual', nombre: 'Punto más caliente', f: h => D.en('caliente', h) },
            { clase: 'h-s-max', nombre: 'Aceite de arriba', f: h => D.en('aceite', h) },
            { clase: 'h-s-sin', nombre: 'Aire', f: h => D.en('aire', h) },
            { clase: 'h-s-norma', nombre: `Límite: ${LIMITE.caliente} °C`, f: () => LIMITE.caliente },
        ];
        $('#h-c-t').textContent = 'Las temperaturas del día';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `El aceite tarda horas en calentarse: su punta llega después que la de la carga. El punto más caliente del devanado llega a ${num(D.max.caliente)} °C${L.vent ? '' : ', sin ventiladores'}. Arriba de ${LIMITE.referencia} °C el aislamiento envejece más rápido.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Las temperaturas del día', xMin: 0, xMax: 24, yMin: 0, yMax: 140, ticksX: [0, 6, 12, 18, 24], ticksY: [0, 35, 70, 105, 140], etX: 'Hora', etY: '°C', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${hora(x)} · devanado ${num(D.en('caliente', x))} °C · aceite ${num(D.en('aceite', x))} °C · aire ${num(D.en('aire', x))} °C` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Hora', 'Aire', 'Aceite', 'Devanado'], [0, 4, 8, 12, 16, 19.5, 22].map(h => [hora(h), num(D.en('aire', h)), num(D.en('aceite', h)), num(D.en('caliente', h))]));
    } else if (m === 'voltaje') {
        const o = { km: L.km, cap: L.cap };
        const lb = [
            { clase: 'h-s-sin', nombre: 'Barras, sin cambiador', f: P => tension({ ...o, P, tap: 0 }).pb * 100 },
            { clase: 'h-s-max', nombre: 'Barras, con cambiador', f: P => tension({ ...o, P, tap: tapIdeal({ ...o, P }) }).pb * 100 },
            { clase: 'h-s-actual', nombre: 'Última casa, con cambiador', f: P => tension({ ...o, P, tap: tapIdeal({ ...o, P }) }).pf * 100 },
            { clase: 'h-s-norma', nombre: '95 %', f: () => 95 },
        ];
        $('#h-b-t').textContent = 'El voltaje, según la demanda';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `Por ciento de 13.8 kV, con un circuito de ${num(L.km)} km. Sin cambiador, el voltaje cae con la carga. Con él, las barras se quedan cerca de ${num(CAMBIADOR.consigna * 100)} %, pero al final del circuito sigue bajando.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'El voltaje, según la demanda', xMin: 0, xMax: 24, yMin: 86, yMax: 106, ticksX: [0, 6, 12, 18, 24], ticksY: [86, 91, 96, 101, 106], etX: 'Demanda, MW', etY: '% de 13.8 kV', lineas: lb, fx: x => num(x), fy: y => num(y), punta: x => `${f1(x)} MW · ${lb.slice(0, 3).map(l => `${l.nombre}: ${f1(l.f(x))} %`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['MW', 'Sin cambiador', 'Con cambiador', 'Última casa', 'Posición'], [0, 6, 12, 18, 24].map(P => [num(P), f1(lb[0].f(P)), f1(lb[1].f(P)), f1(lb[2].f(P)), num(tapIdeal({ ...o, P }))]));
        const fpDe = (P, cap) => tension({ km: L.km, cap, P, tap: tapIdeal({ km: L.km, cap, P }) }).fp;
        const lc = [
            { clase: 'h-s-sin', nombre: 'Sin capacitores', f: P => fpDe(P, false) },
            { clase: 'h-s-actual', nombre: 'Con capacitores', f: P => fpDe(P, true) },
        ];
        const ahorro = tension({ km: L.km, cap: false, P: L.P, tap: L.tap }).I - tension({ km: L.km, cap: true, P: L.P, tap: L.tap }).I;
        $('#h-c-t').textContent = 'El factor de potencia, con y sin capacitores';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `De cada 1 de corriente, cuánto hace trabajo. Los capacitores dan aquí la parte que va y viene: ayudan más con poca carga, porque su tamaño es fijo. Con ${f1(L.P)} MW, ahorran ${num(ahorro)} A en 13.8 kV.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'El factor de potencia', xMin: 1, xMax: 24, yMin: 0.85, yMax: 1, ticksX: [1, 6, 12, 18, 24], ticksY: [0.85, 0.9, 0.95, 1], etX: 'Demanda, MW', etY: 'factor de potencia', lineas: lc, fx: x => num(x), fy: y => f2(y), punta: x => `${f1(x)} MW · ${lc.map(l => `${l.nombre}: ${f2(l.f(x))}`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['MW', 'Sin capacitores', 'Con capacitores'], [2, 6, 12, 18, 24].map(P => [num(P), f2(lc[0].f(P)), f2(lc[1].f(P))]));
    } else if (m === 'falla') {
        const tr = I => tRele(I * 1000);
        $('#h-b-t').textContent = 'El relevador: a más corriente, más rápido';
        $('#h-b-ley').textContent = '';
        $('#h-b-pie').textContent = `Segundos que cuenta antes de mandar abrir, con una curva muy inversa. Con la rama a ${f1(L.d)} km pasan ${num(L.F.I)} A y tarda ${f2(L.F.abre - INTERRUPTOR.media.ms / 1000)} s; luego el interruptor abre en ${f2(INTERRUPTOR.media.ms / 1000)} s. Arranca con ${num(480)} A: de ejemplo.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'El relevador', xMin: 0.4, xMax: 6, yMin: 0, yMax: 5, ticksX: [0.4, 2, 4, 6], ticksY: [0, 1, 2, 3, 4, 5], etX: 'Corriente, miles de A', etY: 'segundos', f: tr, fx: x => f1(x), fy: y => num(y), punta: x => `${num(x * 1000)} A · tarda ${f2(tr(x))} s` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Corriente, A', 'Tarda el relevador, s'], [600, 1000, 2000, 3000, 5000].map(I => [num(I), f2(tRele(I))]));
        $('#h-c-t').textContent = 'La corriente de la falla, según dónde cae';
        $('#h-c-ley').textContent = '';
        $('#h-c-pie').textContent = `Miles de amperes, con una falla entre las tres fases. Entre más lejos, más cable hay de por medio y menos corriente pasa. La red que llega puede dar unos ${num(fallaEn(0) * 1000)} A en las barras de 13.8 kV.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'La corriente de la falla', xMin: 0, xMax: 20, yMin: 0, yMax: 6, ticksX: [0, 5, 10, 15, 20], ticksY: [0, 2, 4, 6], etX: 'Kilómetros del circuito', etY: 'miles de A', f: fallaEn, fx: x => num(x), fy: y => num(y), punta: x => `${f1(x)} km · ${num(fallaEn(x) * 1000)} A · el relevador tarda ${f2(tRele(fallaEn(x) * 1000))} s` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Kilómetros', 'Corriente, A', 'Tarda, s'], [0.2, 1, 4, 10, 20].map(d => [f1(d), num(fallaEn(d) * 1000), f2(tRele(fallaEn(d) * 1000))]));
    } else {
        const r2 = REPARTO[0] + REPARTO[1];
        const lb = [
            { clase: 'h-s-sin', nombre: 'Solo el circuito 1', f: P => amperes(mvaDe(P), SUB.media) * REPARTO[0] },
            { clase: 'h-s-actual', nombre: 'Con el circuito 2', f: P => amperes(mvaDe(P), SUB.media) * r2 },
            { clase: 'h-s-norma', nombre: `TC: ${TC} A`, f: () => TC },
        ];
        $('#h-b-t').textContent = 'La corriente del interruptor 1';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `Amperes por fase. Al llevar los dos circuitos, la suma no debe pasar de los ${TC} A de sus transformadores de corriente: hasta unos ${f1(L.maxMW)} MW de demanda. El reparto entre circuitos es de ejemplo.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'La corriente del interruptor 1', xMin: 0, xMax: 24, yMin: 0, yMax: 900, ticksX: [0, 6, 12, 18, 24], ticksY: [0, 300, 600, 900], etX: 'Demanda, MW', etY: 'A', lineas: lb, fx: x => num(x), fy: y => num(y), punta: x => `${f1(x)} MW · solo: ${num(lb[0].f(x))} A · con el 2: ${num(lb[1].f(x))} A` });
        $('#h-tabla-b').innerHTML = tablaHTML(['MW', 'Solo el 1', 'Con el 2'], [5, 10, 15, 20, 24].map(P => [num(P), num(lb[0].f(P)), num(lb[1].f(P))]));
        const lc = [{ clase: 'h-s-actual', nombre: 'Los dos circuitos', f: h => amperes(mvaDe(L.P * formaEn(h)), SUB.media) * r2 }, { clase: 'h-s-norma', nombre: `TC: ${TC} A`, f: () => TC }];
        $('#h-c-t').textContent = 'A qué hora conviene';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Si ${f1(L.P)} MW fuera la demanda más alta del día, así irían los dos circuitos juntos. De madrugada, con menos carga, sobra margen. La forma del día es de ejemplo.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'A qué hora conviene', xMin: 0, xMax: 24, yMin: 0, yMax: 900, ticksX: [0, 6, 12, 18, 24], ticksY: [0, 300, 600, 900], etX: 'Hora', etY: 'A', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${hora(x)} · ${num(lc[0].f(x))} A` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Hora', 'A, los dos'], [0, 4, 8, 12, 16, 20].map(h => [hora(h), num(lc[0].f(h))]));
    }
}
function pintarBarras(L, pag) {
    const { $, pide } = pag;
    let filas;
    if (pide.modo === 'carga') {
        const sin = dia({ pico: L.pico, Tmax: L.Tmax, vent: false });
        const con = dia({ pico: L.pico, Tmax: L.Tmax, vent: true });
        filas = [{ t: 'Con ventiladores', v: con.dias, activa: L.vent, escala: 2, d: 0 }, { t: 'Sin ventiladores', v: sin.dias, activa: !L.vent, escala: 2 }, { t: `Un día a ${LIMITE.referencia} °C`, v: 1, escala: 2 }];
        $('#h-d-t').textContent = 'La vida que gasta en un día, contra 100 de un día normal';
        $('#h-d-pie').textContent = `A ${LIMITE.referencia} °C en el devanado, el aislamiento envejece a su ritmo normal; con 6 °C más, al doble. Por eso un día caliente y sin ventiladores le cuesta ${num(sin.dias / Math.max(con.dias, 0.001), 0)} veces más vida.`;
    } else if (pide.modo === 'voltaje') {
        const sin = tension({ P: L.P, km: L.km, cap: L.cap, tap: 0 });
        const trafo = 1 - sin.pb;
        filas = [{ t: 'En el transformador', v: Math.max(0, trafo), activa: true, escala: 0.1, d: 1 }, { t: 'En el circuito', v: Math.max(0, L.caida / SUB.media), escala: 0.1, d: 1 }, { t: 'Lo que corrige el cambiador', v: Math.max(0, L.tap * CAMBIADOR.paso), escala: 0.1, d: 1 }];
        $('#h-d-t').textContent = 'Dónde se pierde el voltaje, en % de 13.8 kV';
        $('#h-d-pie').textContent = `Con ${f1(L.P)} MW. El cambiador sube ${f1(L.tap * CAMBIADOR.paso * 100)} % en las barras, para que a la última casa le llegue ${f1(L.pf * 100)} %.`;
    } else if (pide.modo === 'falla') {
        filas = [{ t: 'Pasajeras, hasta', v: 0.87, activa: L.tipo === 'pasajera' }, { t: 'Las que se quedan', v: 0.13, activa: L.tipo !== 'pasajera' }];
        $('#h-d-t').textContent = 'Fallas en redes aéreas, de cada 100';
        $('#h-d-pie').textContent = `Hasta 80 a 87 de cada 100 son pasajeras, como un rayo o una rama que cae al suelo. Por eso el interruptor vuelve a cerrar solo, a los ${RECIERRE.esperas[0]} s y a los ${RECIERRE.esperas[1]} s. Si la falla sigue, se queda abierto.`;
    } else {
        filas = [{ t: 'Interruptor 1', v: L.Ibr1 / TC, activa: true, escala: 1.4 }, { t: 'Interruptor 2', v: L.Ibr2 / TC, escala: 1.4 }, { t: 'Cuchillas de paso', v: L.Ipaso / TC, escala: 1.4 }];
        $('#h-d-t').textContent = `Corriente, de cada 100 de ${TC} A`;
        $('#h-d-pie').textContent = L.Ipaso > 0 ? `El interruptor 1 lleva a los dos circuitos: ${num(L.Ibr1)} A. El 2 ya no lleva nada.` : 'Cada interruptor lleva su propio circuito.';
    }
    $('#h-barras').innerHTML = barrasHTML(filas);
}
function alPintarFijas({ $ }) {
    $('#h-coatepec').innerHTML = tablaHTML(['Qué', 'Cuánto'], [
        ['Transformador', `${TRAFO.etapas.join('/')} MVA, ${TRAFO.conexion}`],
        ['Voltajes', `${SUB.alta} kV a ${num(SUB.media, 1)} kV`],
        ['Impedancia', '8 a 9.5 %'],
        ['Líneas de 115 kV', `${SUB.lineas}, de ${SUB.desde}`],
        ['Circuitos de 13.8 kV', `${SUB.circuitos}`],
        ['Interruptores de 115 kV', `SF6, ${num(INTERRUPTOR.alta.A)} A, ${INTERRUPTOR.alta.kA} kA, 3 ciclos`],
        ['Interruptores de 13.8 kV', `SF6, ${num(INTERRUPTOR.media.A)} A, ${INTERRUPTOR.media.ms} ms`],
        ['Capacitores', `${num(CAPACITOR.mvar, 1)} MVAr: ${CAPACITOR.unidades} de 200 kVAr`],
        ['Apartarrayos de 115 kV', `${APARTARRAYOS.vn} kV, ${APARTARRAYOS.kA} kA`],
        ['Altura', `${num(SUB.altura)} m sobre el mar`],
    ]);
    $('#h-niveles').innerHTML = tablaHTML(['Qué', 'Cuánto', 'Dónde lo dice'], [
        ['Alta tensión', 'más de 35 kV', 'Reglamento, art. 2, fracc. II'],
        ['Baja tensión', '1 kV o menos', 'Reglamento, art. 2, fracc. V'],
        ['Un centro de carga, siempre', 'desde 95 %', 'Código de Red, 2016'],
        ['Hasta 20 minutos', 'de 90 a 110 %', 'Código de Red, 2016'],
    ]);
    $('#h-protec').innerHTML = tablaHTML(['Protección', 'Qué hace'], [
        ['Diferencial (87T)', 'Compara lo que entra y lo que sale del transformador'],
        ['Buchholz (63)', 'Detecta el gas de una falla dentro del transformador'],
        ['Térmica (49T)', 'Prende los ventiladores'],
        ['Sobrecorriente', 'Abre ante una falla; en 13.8 kV, muy inversa'],
        ['Recierre (79)', 'Vuelve a cerrar el interruptor'],
        ['Apartarrayos', 'Mandan a tierra lo que trae un rayo'],
    ]);
    $('#h-tierra').innerHTML = tablaHTML(['Qué', 'Cuánto'], [
        ['Cable de cobre', `${num(TIERRA.metros)} m, calibre ${TIERRA.calibre}`],
        ['Varillas', `${TIERRA.varilla} m de largo`],
        ['Resistencia a tierra', `${f2(TIERRA.ohm)} Ω`],
        ['Grava encima', `${num(TIERRA.grava * 100)} cm`],
        ['Falla con que se diseñó', `${num(10041)} A durante ${num(TIERRA.segundos, 1)} s`],
        ['Cuánto sube la malla', `${num(TIERRA.potencial)} V`],
        ['Voltaje de toque del diseño', `${num(TIERRA.toque)} V`],
        ['Voltaje de paso del diseño', `${num(TIERRA.paso)} V`],
    ]);
    $('#h-regla').innerHTML = tablaHTML(['Qué', 'Dónde lo dice'], [
        ['La Red Eléctrica incluye subestaciones, transformación, compensación, protección y medición', 'Ley, art. 3, fracc. XL'],
        ['Transmitir y distribuir es área estratégica del Estado', 'Ley, art. 57'],
        ['La CFE opera sus redes con instrucciones del CENACE, también para el mantenimiento', 'Ley, art. 44'],
        ['La CNE fija los voltajes y las interrupciones aceptables', 'Ley, art. 46; Reglamento, art. 93'],
        ['Si un cambio de voltaje fuera de tolerancia daña aparatos, se reparan o se pagan', 'Reglamento, art. 149'],
    ]);
}
function alActualizar(L, pag) {
    const { pide, ponerCifra, ponerLecturas, nivel, graficas } = pag;
    pintarBarras(L, pag);
    ponerCifra('aT', { carga: 'El transformador por dentro', voltaje: 'El voltaje a lo largo del camino', falla: 'Lo que ve el relevador', maniobra: 'Por dónde pasa la corriente' }[pide.modo]);
    if (pide.modo === 'carga') {
        const etapa = ['Apagados', 'Un paso', 'Dos pasos'][L.etapa];
        const aviso = L.caliente > LIMITE.caliente ? `El devanado pasa de ${LIMITE.caliente} °C: el aislamiento se gasta muy rápido.` : L.S > TRAFO.etapas[2] ? `Pasa de los ${TRAFO.etapas[2]} MVA que aguanta con los ventiladores.` : !L.vent ? `Sin ventiladores aguanta ${TRAFO.etapas[0]} MVA sin calentarse de más.` : null;
        ponerLecturas([['Hora', hora(L.hora), 'del día'], ['Pasa', `${f1(L.S)} MVA`, `${num(L.uso * 100)} % de ${TRAFO.etapas[2]}`], ['Corriente', `${num(L.Ia)} A`, `en 115 kV; ${num(L.Im)} A en 13.8`], ['Aceite', `${num(L.aceite)} °C`, 'arriba del tanque'], ['Devanado', `${num(L.caliente)} °C`, `su punto más caliente; límite ${LIMITE.caliente}`], ['Ventiladores', etapa, `el aire, a ${num(L.aire)} °C`]], aviso);
        ponerCifra('hud', `${num(L.caliente)} °C`);
        ponerCifra('hud2', 'en el punto más caliente');
        graficas.b?.marcar(L.hora, L.S);
        graficas.c?.marcar(L.hora, L.caliente);
        graficas.b?.ahora(L.hora);
        graficas.c?.ahora(L.hora);
        nivel(1, 'Carga', clamp01(L.uso), `${num(L.uso * 100)} %`);
        nivel(2, 'Calor', clamp01(L.caliente / LIMITE.caliente), `${num(L.caliente)} °C`);
    } else if (pide.modo === 'voltaje') {
        const aviso = L.pf < 0.95 ? 'A la última casa le llega menos de 95 %: el cambiador ya no alcanza o el circuito es muy largo.' : L.auto && L.espera > 0.2 ? 'El voltaje salió de su banda: el cambiador espera y luego da un paso.' : !L.auto && Math.abs(L.pb - CAMBIADOR.consigna) > CAMBIADOR.banda ? 'Con el cambiador quieto, el voltaje de las barras sigue a la carga.' : null;
        ponerLecturas([['En las barras', `${f2(L.Vb)} kV`, `${f1(L.pb * 100)} %`], ['Última casa', `${f2(L.Vf)} kV`, `${f1(L.pf * 100)} %, a ${num(L.km)} km`], ['Cambiador', `${L.tap > 0 ? '+' : ''}${L.tap}`, `de ±${CAMBIADOR.pasos}`], ['Corriente', `${num(L.Im)} A`, 'en 13.8 kV'], ['Factor de potencia', f2(L.fp), 'en el transformador'], ['Capacitores', `${f2(L.Qc)} MVAr`, L.cap ? 'conectados' : 'desconectados']], aviso);
        ponerCifra('hud', `${f1(L.pf * 100)} %`);
        ponerCifra('hud2', 'le llega a la última casa');
        graficas.b?.marcar(L.P, L.pf * 100);
        graficas.c?.marcar(L.P, L.Im);
        nivel(1, 'Barras', clamp01((L.pb - 0.88) / 0.18), `${f1(L.pb * 100)} %`);
        nivel(2, 'Última casa', clamp01((L.pf - 0.88) / 0.18), `${f1(L.pf * 100)} %`);
    } else if (pide.modo === 'falla') {
        const F = L.F;
        const e = L.estado;
        const tr = L.tramo;
        const msg = { falla: 'La corriente se disparó: el relevador cuenta.', abierto: `Abierto: vuelve a cerrar en ${f1(Math.max(0, tr ? tr.t1 - L.t : 0))} s.`, normal: L.t !== null ? 'Volvió a cerrar y la falla ya no estaba: la luz regresó.' : null, bloqueado: 'La falla siguió en cada intento: se queda abierto hasta que una cuadrilla la quite.' }[e];
        const aviso = L.rayo > 0.3 ? `Cayó un rayo: los apartarrayos dejaron pasar unos ${APARTARRAYOS.descarga} kV, y el equipo aguanta ${num(APARTARRAYOS.aguantaAqui)} kV a esta altura.` : msg;
        ponerLecturas([['Rama', `${f1(L.d)} km`, 'sobre el circuito 1'], ['Corriente de falla', `${num(F.I)} A`, `${num(F.I / L.carga1)} veces lo normal`], ['Relevador', `${f2(F.abre - INTERRUPTOR.media.ms / 1000)} s`, 'cuenta antes de mandar abrir'], ['Interruptor', `${f2(INTERRUPTOR.media.ms / 1000)} s`, 'tarda en abrir'], ['Sin luz', L.tipo === 'pasajera' ? `${RECIERRE.esperas[0]} s` : 'hasta reparar', L.tipo === 'pasajera' ? 'si la falla se va sola' : 'si la falla se queda'], ['Estado', { falla: 'En falla', abierto: 'Abierto', normal: 'Con luz', bloqueado: 'Bloqueado' }[e], tr ? `intento ${Math.min(tr.intento + 1, RECIERRE.esperas.length + 1)}` : 'sin falla']], aviso);
        ponerCifra('hud', L.rayo > 0.3 ? `${APARTARRAYOS.descarga} kV` : `${num(F.I)} A`);
        ponerCifra('hud2', L.rayo > 0.3 ? 'deja pasar el apartarrayos' : 'si la rama toca el cable');
        graficas.b?.marcar(F.I / 1000, F.abre - INTERRUPTOR.media.ms / 1000);
        graficas.c?.marcar(L.d, F.I / 1000);
        nivel(1, 'Corriente', clamp01(F.I / 6000), `${num(F.I)} A`);
        nivel(2, 'Tarda', clamp01(F.abre / 4), `${f2(F.abre)} s`);
    } else {
        const p = Math.round(L.anim);
        const aviso = pide.aviso ?? (L.arco > 0.05 ? 'Una cuchilla no apaga arcos.' : L.paso >= 3 && L.Ibr1 > TC ? `El interruptor 1 ya pasa de los ${TC} A de su TC: habría que bajar la carga o regresar el circuito 2.` : null);
        ponerLecturas([['Paso', `${p} de ${PASOS.length - 1}`, PASOS[Math.min(PASOS.length - 1, p)].texto], ['Interruptor 1', `${num(L.Ibr1)} A`, `de ${TC} de su TC`], ['Interruptor 2', `${num(L.Ibr2)} A`, L.paso >= 3 ? 'abierto' : 'cerrado'], ['Por la interconexión', `${num(L.Ipaso)} A`, 'por las cuchillas de paso'], ['Circuito 2', 'Con luz', 'en todos los pasos'], ['Se puede hasta', `${f1(L.maxMW)} MW`, 'de demanda']], aviso);
        ponerCifra('hud', `${p} de ${PASOS.length - 1}`);
        ponerCifra('hud2', 'pasos del mantenimiento');
        graficas.b?.marcar(L.P, L.Ibr1);
        nivel(1, 'Interruptor 1', clamp01(L.Ibr1 / TC), `${num(L.Ibr1)} A`);
        nivel(2, 'Avance', clamp01(L.anim / (PASOS.length - 1)), `${p} de ${PASOS.length - 1}`);
    }
}

// ------------------------------------------------------------------ la subestación
crearPagina({
    figura: FIGURA,
    fichas: FICHAS,
    vistas: VISTAS,
    modos: MODOS,
    botones: BOTONES,
    acciones: ACCIONES,
    modo0: 'carga',
    pide: { pico: DEF.pico, Tmax: DEF.Tmax, hora: DEF.hora, vent: DEF.vent, P: DEF.P, km: DEF.km, cap: DEF.cap, auto: DEF.auto, d: DEF.d, tipo: DEF.tipo, paso: 0, falla: false, rayo: false, arco: false, aviso: null, corre: true },
    general: { Lx: 16.8, Lz: 6, alto: 2.3, mira: [0, 0.55, 0], az: 16, el: 30, azVertical: 14, elVertical: 38 },
    etiquetas: { lienzo: 'Subestación en 3D: arrastra para girarla, toca un punto para conocerlo', modos: 'Qué ver en la subestación', puntos: 'Puntos clave de la subestación', desarmar: 'Desarmar la subestación', lecturas: 'Lo que mide la subestación' },
    textoFinal: 'Toca cualquier punto para volver a verlo. Descompón los ventiladores en «Un día de carga», sube la demanda en «El voltaje», deja caer la rama en «Una falla» o cambia un interruptor sin apagar en «Mantenimiento».',
    colores: { guindaSuave: '#f3d4de', claro: '#ffffff' },
    crearDiagrama,
    secciones,
    escena: (renderer, scene, { movil, oscuro }) => {
        const M = materiales(P_PLANTA);
        const est = escenario(renderer, scene, M, { movil, oscuro });
        return { planta: construir(M, P_PLANTA, { movil, oscuro }), est };
    },
    alCambiarModo: (p, m) => {
        p.corre = m === 'carga';
        p.falla = false;
        p.paso = 0;
        p.aviso = null;
        p.vent = DEF.vent;
        p.cap = DEF.cap;
        p.auto = DEF.auto;
        planta = { ...planta, paso: 0, anim: 0, ev: null, espera: 0, cambios: 0, tap: m === 'voltaje' ? tapIdeal({ P: p.P, km: p.km, cap: DEF.cap }) : planta.tap };
    },
    alCuadro: ({ dt, pide }) => {
        planta = pasoPlanta(planta, { modo: pide.modo, P: pide.P, km: pide.km, cap: pide.cap, auto: pide.auto, falla: pide.modo === 'falla' && pide.falla, d: pide.d, tipo: pide.tipo, paso: pide.modo === 'maniobra' ? pide.paso : 0, rayo: pide.rayo, arco: pide.arco }, dt);
        pide.rayo = false;
        pide.arco = false;
    },
    poseDe: ({ pide, ve, encendido, t, dt, camara }) => pose({ modo: pide.modo, planta, pico: pide.pico, Tmax: pide.Tmax, hora: pide.hora, vent: pide.vent, P: pide.P, km: pide.km, cap: pide.cap, auto: pide.auto, d: pide.d, tipo: pide.tipo, noche: ve.noche, adentro: ve.adentro, desarme: ve.desarme, encendido, t, dt, camara }),
    firma: p => [p.modo, p.modo === 'carga' ? [Math.round(p.pico), Math.round(p.Tmax), p.vent] : 0, p.modo === 'voltaje' ? [Math.round(p.P), Math.round(p.km), p.cap] : 0, p.modo === 'falla' ? [Math.round(p.d * 5), p.tipo] : 0, p.modo === 'maniobra' ? [Math.round(p.P)] : 0],
    alPintarFijas,
    alPintarGraficas,
    alActualizar,
    prueba: p => ({ pico: +p.pico.toFixed(1), Tmax: +p.Tmax.toFixed(0), hora: +p.hora.toFixed(1), vent: p.vent, P: +p.P.toFixed(1), km: +p.km.toFixed(1), cap: p.cap, auto: p.auto, d: +p.d.toFixed(1), tipo: p.tipo, paso: p.paso, falla: p.falla, tap: planta.tap, ev: planta.ev === null ? null : +planta.ev.toFixed(2), anim: +planta.anim.toFixed(2) }),
});
