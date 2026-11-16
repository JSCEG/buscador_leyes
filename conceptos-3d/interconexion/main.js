// «Cómo se conecta una central a la red», en 3D y con el formato Búho de «¿Cómo funciona?». El caso real: las centrales fotovoltaicas
// Proteus Solar y Tampico Solar (Guanajuato), conectadas a 115 kV en la subestación San José Iturbide de la CFE, según el estudio de
// interconexión de una tesis de la UNAM. Cuatro formas de verlo: los pasos del trámite del CENACE, lo que corre por la línea (voltajes,
// reactivos y pérdidas), una falla contra lo que pide el Código de Red y quién paga cada obra.
// Se arma con: node scripts/build-conceptos-3d.mjs interconexion
//
// Lo que se repite entre las plantas con física está en conceptos-3d/planta-comun/.
import { clamp01, num } from '../planta-comun/ayudas.js';
import { barrasHTML, leyenda, pintarGrafica, seccionBarras, seccionColores, seccionDiagrama, seccionFuentes, seccionGrafica, seccionTabla, tablaHTML } from '../planta-comun/graficas.js';
import { crearPagina } from '../planta-comun/pagina.js';
import {
    AMPERES_NOMINAL, BANCO_MVAR, CASO, CONV_TOTAL, COSTO_KM, DEF, ESTUDIOS, ETAPAS, FLUIDOS, FRECUENCIA, HUECO, LENTO, LIMITES, MIC, PARTES as PARTES_M, POR_GCR,
    PROYECTOS, RECUPERA, REACTIVOS, S_INVERSORES, SCR, SEGUNDA, TABLA_I1, TENSION, TENSION_CR, THD_MAX, TIPO, TOTAL_DIAS, VECINO, envolvente, falla as calcFalla, flujo, msPermitidos, pose,
} from './modelo.js';
import { P_PLANTA, construir, escenario, materiales } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';

const FIGURA = 'interconexion';
const f1 = x => num(x, 1);
const f2 = x => num(x, 2);
const f3 = x => num(x, 3);
const pct = x => `${num(x * 100)} %`;
const mwR = x => (x < 1 ? f1(x) : num(x));
const millones = x => (x >= 100 ? `${num(x)} millones` : `${f1(x)} millones`);
const NOMBRE_FP = { unidad: 'factor de potencia 1', entrega: 'entrega reactivos (0.95)', absorbe: 'absorbe reactivos (0.95)' };
const SIG_FP = { unidad: 'entrega', entrega: 'absorbe', absorbe: 'unidad' };
const PLENA = flujo({ mw: CASO.mw });
const ENTREGA = flujo({ mw: CASO.mw, fp: 'entrega' });
const MW_SAEE = CASO.mw * SEGUNDA.saee;

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'campo', nombre: 'Las centrales solares', modo: 'linea', accion: 'media', eq: `${num(CASO.modulos.proteus + CASO.modulos.tampico)} paneles de ${CASO.modulos.wp} W`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="3" y="9" width="18" height="8" rx="1" transform="skewX(-12) translate(3 0)"/><path d="M8 17v3M16 17v3"/>',
        texto: `Proteus Solar y Tampico Solar, en San Luis de la Paz y Doctor Mora, Guanajuato. La prensa les da 72 y 36 MW; el estudio de la tesis de la UNAM toma ${num(CASO.mw)} MW en el punto de interconexión. Para el Código de Red son tipo ${TIPO}: más de 30 MW.` },
    { parte: 'inversores', nombre: 'Inversores', modo: 'linea', accion: 'fp', eq: `${num(CASO.inversores.proteus + CASO.inversores.tampico)} de ${CASO.inversores.kva} kVA`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M7 15c2-4 3-4 5 0s3 4 5 0"/>',
        texto: `Pasan la corriente directa de los paneles a alterna de 800 V. Cada grupo llega a un transformador de bloque de ${num(CASO.bloque.mva)} MVA que la sube a 34.5 kV. También dan reactivos: cada inversor, hasta ${CASO.inversores.kvarMax} kVAr.` },
    { parte: 'colectora', nombre: 'Red colectora', modo: 'linea', accion: 'plena', eq: 'Cables enterrados de 34.5 kV', recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 18h18M6 18v-5h4v5M14 18V9h4v9"/><path d="M8 13V7h8"/>',
        texto: 'Cables enterrados llevan la energía de cada estación de inversores a las celdas de la subestación elevadora. Las celdas reúnen los cables y tienen sus interruptores. Esta red es parte de la central.' },
    { parte: 'elevadora', nombre: 'Subestación elevadora', modo: 'linea', accion: 'plena', eq: `${CASO.elevadoras.proteus} + ${CASO.elevadoras.tampico} MVA, de 34.5 a 115 kV`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
        texto: `Dos transformadores suben la energía de 34.5 a 115 kV: uno de ${CASO.elevadoras.proteus} MVA para Proteus y otro de ${CASO.elevadoras.tampico} MVA para Tampico. Con más voltaje, la misma potencia viaja con menos corriente y se pierde menos en el camino.` },
    { parte: 'reactivos', nombre: 'Compensación de reactivos', modo: 'linea', accion: 'banco', eq: `Factor de potencia ${REACTIVOS.fp}`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 3v7M12 14v7M6 10h12M6 14h12"/>',
        texto: `El Código de Red pide poder dar o absorber reactivos hasta un factor de potencia de ${REACTIVOS.fp}. Así, la tesis halló los inversores al ${num(CASO.tesis.cargaEntrega * 100)} %: hace falta compensar. Este banco es de ejemplo.` },
    { parte: 'control', nombre: 'Casa de control', modo: 'falla', accion: 'falla', eq: 'Protecciones y datos al CENACE', abrir: true, recorrido: { noche: false, adentro: true },
        icono: '<rect x="4" y="8" width="16" height="12" rx="1"/><path d="M4 8l8-5 8 5M9 20v-5h6v5"/>',
        texto: 'Aquí están las protecciones, el control de la central y los equipos que mandan datos al CENACE en tiempo real, por la fibra óptica del cable de guarda. El Código de Red pide registrar cada falla con su hora exacta.' },
    { parte: 'linea', nombre: 'Línea de enlace', modo: 'linea', accion: 'plena', eq: `${f2(CASO.linea.km)} km a 115 kV`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 3l-5 18M12 3l5 18M8 9h8M7 14h10"/>',
        texto: `Une la subestación elevadora con el punto de interconexión. A ${num(CASO.mw)} MW lleva ${num(PLENA.amperes)} amperes, la mitad de lo que aguanta su conductor, y pierde unos ${num(PLENA.perdLinea * 1000)} kW. La paga y la mantiene la central.` },
    { parte: 'punto', nombre: 'Punto de interconexión', modo: 'paga', accion: 'modalidad', eq: 'Subestación San José Iturbide', abrir: true, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="12" r="3"/><path d="M3 12h6M15 12h6M12 3v6"/>',
        texto: 'Donde la central entra a la red de la CFE: una subestación de maniobras que parte en dos una línea de 115 kV que ya existía. El CENACE fija el punto en sus estudios; ahí termina lo de la central y empieza lo de la CFE.' },
    { parte: 'medicion', nombre: 'Medición', modo: 'paga', accion: 'modalidad', eq: 'Para cobrar y pagar', recorrido: { noche: false, adentro: false },
        icono: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8 9h8M12 13v3"/>',
        texto: 'Los medidores del punto de interconexión cuentan la energía que entrega la central, para cobrarla y pagarla. El contrato los da en comodato a la CFE; la central puede poner los suyos de respaldo.' },
    { parte: 'red', nombre: 'La red de 115 kV', modo: 'falla', accion: 'falla', eq: `${f1(CASO.corto.trifasico)} kA de cortocircuito`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 20l4-16M20 20L16 4M6 12h12"/>',
        texto: `Una red fuerte: en una falla junto a la subestación aporta ${f1(CASO.corto.trifasico)} kA, unas ${num(SCR)} veces lo que mueve la central. Por eso el voltaje casi no cambia cuando la central sube o baja. Con una red débil, los estudios pueden pedir refuerzos.` },
    { parte: 'refuerzo', nombre: 'Obras de refuerzo', modo: 'paga', accion: 'modalidad', eq: 'En la red, no en la central', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 20h16M7 20V9l5-5 5 5v11M10 20v-5h4v5"/>',
        texto: 'Obras en la red para que aguante la central nueva sin perder calidad ni confiabilidad. En la modalidad individual las paga la central; en la de planeación entran al programa de la red. Esta línea es de ejemplo.' },
    { parte: 'saee', nombre: 'Almacenamiento', modo: 'paga', accion: 'km', eq: `${num(SEGUNDA.saee * 100)} % por ${SEGUNDA.horas} horas`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10v4M7 10v4M11 10v4"/>',
        texto: `Desde la Segunda Convocatoria de 2026, una central renovable nueva debe traer un Sistema de Almacenamiento de Energía Eléctrica (SAEE) de al menos ${num(SEGUNDA.saee * 100)} % de su capacidad por tres horas: aquí, ${num(MW_SAEE)} MW. Proteus y Tampico son de antes.` },
    { parte: 'cenace', nombre: 'CENACE', modo: 'pasos', accion: 'pasos', eq: 'Estudia, instruye y ordena', abrir: true, recorrido: { noche: false, adentro: false },
        icono: '<rect x="3" y="5" width="18" height="11" rx="1.5"/><path d="M8 20h8M12 16v4M7 12l3-3 2 2 4-4"/>',
        texto: 'El Centro Nacional de Control de Energía hace los estudios, define las obras, instruye a la CFE a firmar el contrato y, con el certificado de la unidad de inspección, ordena conectar: la conexión se hace en 72 horas (LSE, art. 48).' },
];
const VISTAS = Object.fromEntries(PARTES_M.map(p => [p.id, p.vista]));
const etapaDe = dia => ETAPAS.find(e => dia < e.hasta) ?? ETAPAS.at(-1);
const relojPasos = { texto: 'el tiempo', avanzar: (p, dt) => { p.dia = Math.min(TOTAL_DIAS, p.dia + dt * 24); return p.dia >= TOTAL_DIAS; }, alSeguir: p => { if (p.dia >= TOTAL_DIAS) p.dia = 0; } };
const relojFalla = { texto: 'la falla', avanzar: (p, dt) => { p.tf = Math.min(LIMITES.tf[1], p.tf + dt * LENTO); return p.tf >= LIMITES.tf[1]; }, alSeguir: p => { if (p.tf >= LIMITES.tf[1]) p.tf = LIMITES.tf[0]; } };
const MODOS = {
    pasos: { nombre: 'Los pasos para conectarse', corto: 'Pasos', resumen: 'Antes de conectarse, el CENACE estudia la central y la red. Luego se firma el contrato, se construyen las obras, se inspeccionan y se prueban. Deja correr el tiempo o mueve los días.', aclara: `Los estudios duran lo que dice el manual del CENACE para una central de 30 a 100 MW (${ESTUDIOS.dias} días hábiles, más la validación). Hay 30 días para pedir el contrato y 10 para firmarlo. La construcción, la inspección y las pruebas dependen de cada proyecto: aquí son de ejemplo.`, mando: { nombre: 'Días hábiles desde la solicitud', campo: 'dia', rango: LIMITES.dia, texto: v => `${num(v)} · ${etapaDe(v).corto}` }, reloj: relojPasos },
    linea: { nombre: 'Lo que corre por la línea', corto: 'Flujo', resumen: 'La central entrega su energía en el punto de interconexión. Mueve cuánto genera y pide reactivos como manda el Código de Red: mira el voltaje en los inversores y cuánto trabajan.', aclara: `Calculado con los datos de la tesis: la línea, los transformadores y el voltaje fijo en el punto de interconexión. Reproduce sus voltajes con menos de 0.005 de diferencia. El banco de capacitores de ${BANCO_MVAR} MVAr es de ejemplo.`, mando: { nombre: 'Lo que entrega la central', campo: 'mw', rango: LIMITES.mw, texto: v => `${num(v)} MW` } },
    falla: { nombre: 'Una falla en la red', corto: 'Falla', resumen: 'Un cortocircuito en una línea de la red baja el voltaje de golpe. El Código de Red pide que la central siga conectada mientras el voltaje no baje de su curva. Cambia cuánto dura la falla.', aclara: 'Curva de la tabla 4.2.1.B del Código de Red para centrales de inversores tipo D. Cómo vuelve el voltaje y cuánta corriente reactiva da la central son de ejemplo: el CENACE fija los suyos en los estudios. La falla va en cámara lenta.', mando: { nombre: 'Lo que dura la falla', campo: 'ms', rango: LIMITES.ms, texto: v => `${num(v)} ms` }, reloj: relojFalla },
    paga: { nombre: 'Quién paga cada obra', corto: 'Costos', resumen: 'La central paga siempre sus estudios y las obras que la unen a la red. Los refuerzos de la red los paga ella o entran al programa de la red, según cómo los pida. Mueve el largo de la línea.', aclara: 'La línea: precios de aportaciones de la CFE de julio de 2018, solo el costo directo. No hay un precio oficial publicado de una bahía ni de una subestación elevadora. Los refuerzos son los de referencia de la primera convocatoria de la SENER.', mando: { nombre: 'Largo de la línea de enlace', campo: 'km', rango: LIMITES.km, texto: v => `${f1(v)} km` } },
};
const BOTONES = [
    { id: 'fp', visible: p => p.modo === 'linea', pulsado: p => p.fp !== 'unidad', texto: p => `Reactivos: ${NOMBRE_FP[p.fp]}`, alTocar: p => { p.fp = SIG_FP[p.fp]; } },
    { id: 'banco', visible: p => p.modo === 'linea', pulsado: p => p.banco, texto: p => (p.banco ? 'Con banco de capacitores' : 'Sin banco de capacitores'), alTocar: p => { p.banco = !p.banco; } },
    { id: 'lejana', visible: p => p.modo === 'falla', pulsado: p => p.residual > 0, texto: p => (p.residual > 0 ? 'Falla lejana: baja a la mitad' : 'Falla cercana: baja a cero'), alTocar: p => { p.residual = p.residual > 0 ? 0 : 0.5; p.tf = LIMITES.tf[0]; p.corre = true; } },
    { id: 'modalidad', visible: p => p.modo === 'paga', pulsado: p => p.modalidad === 'planeacion', texto: p => (p.modalidad === 'planeacion' ? 'Modalidad: planeación' : 'Modalidad: individual'), alTocar: p => { p.modalidad = p.modalidad === 'planeacion' ? 'individual' : 'planeacion'; } },
];
const rehacer = pag => { pag.invalidar(); pag.ponerMando(); };
const ACCIONES = {
    media: { texto: p => (p.mw > 60 ? 'Ver a media generación' : 'Ver a plena generación'), hacer: (p, pag) => { p.mw = p.mw > 60 ? CASO.mw / 2 : CASO.mw; rehacer(pag); } },
    plena: { texto: p => (p.mw < CASO.mw - 0.5 ? 'Ver a plena generación' : 'Ver a media generación'), hacer: (p, pag) => { p.mw = p.mw < CASO.mw - 0.5 ? CASO.mw : CASO.mw / 2; rehacer(pag); } },
    fp: { texto: p => (p.fp === 'unidad' ? 'Pedir reactivos (0.95)' : 'Volver a factor de potencia 1'), hacer: (p, pag) => { p.fp = p.fp === 'unidad' ? 'entrega' : 'unidad'; rehacer(pag); } },
    banco: { texto: p => (p.banco ? 'Quitar el banco' : 'Conectar el banco'), hacer: (p, pag) => { p.banco = !p.banco; if (p.banco) p.fp = 'entrega'; rehacer(pag); } },
    falla: { texto: p => (p.ms > 450 ? 'Una falla de 150 ms' : 'Una falla de 700 ms'), hacer: (p, pag) => { p.ms = p.ms > 450 ? 150 : 700; p.tf = LIMITES.tf[0]; p.corre = true; rehacer(pag); } },
    pasos: { texto: p => (p.dia < TOTAL_DIAS ? 'Ir a la operación comercial' : 'Volver a la solicitud'), hacer: (p, pag) => { p.dia = p.dia < TOTAL_DIAS ? TOTAL_DIAS : 0; p.corre = false; rehacer(pag); } },
    modalidad: { texto: p => (p.modalidad === 'planeacion' ? 'Ver modalidad individual' : 'Ver modalidad planeación'), hacer: (p, pag) => { p.modalidad = p.modalidad === 'planeacion' ? 'individual' : 'planeacion'; rehacer(pag); } },
    km: { texto: p => (p.km < 20 ? 'Una línea de 30 km' : 'La línea del caso'), hacer: (p, pag) => { p.km = p.km < 20 ? 30 : CASO.linea.km; rehacer(pag); } },
};

// ------------------------------------------------------------------ el tablero
const secciones = () => `
    ${seccionDiagrama('Los pasos')}
    ${seccionGrafica('b')}
    ${seccionGrafica('c')}
    ${seccionBarras()}
    ${seccionTabla('Los estudios del CENACE según el tamaño', 'h-mic', 'Manual para la Interconexión (CENACE, 2018), tabla I.1, modalidad individual. Días hábiles y pesos.', 'h-tabla-texto')}
    ${seccionTabla('Lo que pide el Código de Red', 'h-codigo', 'Código de Red 2021 (CRE), manual de interconexión de centrales: tablas 1.1, 2.1, 3.1.1, 3.3.2 y 4.2.1.B y numerales 3.5.1 y 4.1.2.', 'h-tabla-texto')}
    ${seccionTabla('Dónde pide centrales la planeación', 'h-conv', 'SENER, Primera Convocatoria (DOF, 17 de octubre de 2025), anexo técnico. Los refuerzos que comparten varios proyectos se reparten por MW.', 'h-tabla-texto')}
    ${seccionTabla('Lo que dice la ley', 'h-regla', 'Ley del Sector Eléctrico y su Reglamento; Manual para la Interconexión del CENACE.')}
    ${seccionColores(FLUIDOS, 'El caso, la red y las reglas son reales; las fechas de la obra y de las pruebas, el banco de capacitores, la obra de refuerzo y cómo responde la central en una falla son de ejemplo.', 'Colores de lo que corre')}
    ${seccionFuentes(FUENTES, [
        { para: 'Que una central de 0.7 MW o más necesita permiso, que la CFE debe interconectarla cuando es técnicamente factible y una vez hechas las obras que fija el CENACE, los 10 días para firmar el contrato y las 72 horas para conectar, que el permiso no da prelación, las aportaciones, los 7 días para entregar los estudios y la multa por conectar sin contrato', titulo: 'Ley del Sector Eléctrico, arts. 19, 48, 49, 50, 179 y 184', nota: 'Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio' },
        { para: 'Que un permiso no aprueba la interconexión, la planeación vinculante y la capacidad máxima sin refuerzos que debe publicar el CENACE, y que quien conecta solo paga la parte que le toca de la solución más económica', titulo: 'Reglamento de la Ley del Sector Eléctrico, arts. 27, 67 y 130', nota: 'Diario Oficial de la Federación, 3 de octubre de 2025. Está en el acervo de este sitio' },
    ])}`;

const MW_X = { xMin: 0, xMax: CASO.mw, ticksX: [0, 30, 60, 90], etX: 'Lo que entrega la central, MW', fx: x => num(x) };
const T_X = { xMin: LIMITES.tf[0], xMax: LIMITES.tf[1], ticksX: [0, 0.5, 1, 1.5, 2, 2.5], etX: 'Segundos desde la falla', fx: x => f1(x) };
const FP_CLASE = { unidad: 'h-s-actual', entrega: 'h-s-rojo', absorbe: 'h-s-azul' };
const FP_NOMBRE = { unidad: 'Factor de potencia 1', entrega: 'Entrega reactivos', absorbe: 'Absorbe reactivos' };

function alPintarGraficas(L, pag) {
    const { $, pide, graficas } = pag;
    const m = pide.modo;
    graficas.b = null;
    graficas.c = null;
    if (m === 'pasos') {
        const filas = TABLA_I1.slice(1, 8);
        const puntosDias = filas.flatMap(f => [[f.mw[0], f.total], [f.mw[1], f.total]]);
        const lb = [{ clase: 'h-s-actual', nombre: 'Días hábiles de estudios', puntos: puntosDias }];
        $('#h-b-t').textContent = 'Los estudios, según el tamaño';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `Días hábiles que tarda el CENACE en todos los estudios, incluida la validación. Para una central de ${num(CASO.mw)} MW: ${num(ESTUDIOS.dias + ESTUDIOS.validacion)} días.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Los estudios, según el tamaño', xMin: 0, xMax: 1000, ticksX: [0, 250, 500, 750, 1000], etX: 'Tamaño de la central, MW', fx: x => num(x), yMin: 0, yMax: 250, ticksY: [0, 50, 100, 150, 200, 250], etY: 'días hábiles', quebradas: lb, fy: y => num(y), punta: x => { const f = TABLA_I1.find(r => x > r.mw[0] && x <= r.mw[1]) ?? TABLA_I1[1]; return `${num(x)} MW · ${f.total} días hábiles`; } });
        $('#h-tabla-b').innerHTML = tablaHTML(['Tamaño', 'Indicativo', 'Impacto', 'Instalaciones', 'Validación', 'Total'], filas.map(f => [`${mwR(f.mw[0])} a ${num(f.mw[1])} MW`, f.indicativo, f.impacto, f.instalaciones, f.validacion, f.total]));
        const lc = [{ clase: 'h-s-verde', nombre: 'Costo de los estudios', puntos: filas.flatMap(f => [[f.mw[0], f.costo / 1e6], [f.mw[1], f.costo / 1e6]]) }];
        $('#h-c-t').textContent = 'Lo que cuestan los estudios';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Millones de pesos que paga quien pide la interconexión. Para una central de 30 a 100 MW: ${num(ESTUDIOS.costo)} pesos.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Lo que cuestan los estudios', xMin: 0, xMax: 1000, ticksX: [0, 250, 500, 750, 1000], etX: 'Tamaño de la central, MW', fx: x => num(x), yMin: 0, yMax: 4, ticksY: [0, 1, 2, 3, 4], etY: 'millones de pesos', quebradas: lc, fy: y => num(y), punta: x => { const f = TABLA_I1.find(r => x > r.mw[0] && x <= r.mw[1]) ?? TABLA_I1[1]; return `${num(x)} MW · ${num(f.costo)} pesos`; } });
        $('#h-tabla-c').innerHTML = tablaHTML(['Tamaño', 'Costo de los estudios'], TABLA_I1.map(f => [f.mw[1] === Infinity ? `más de ${num(f.mw[0])} MW` : `${mwR(f.mw[0])} a ${num(f.mw[1])} MW`, Array.isArray(f.costo) ? `${num(f.costo[0])} a ${num(f.costo[1])} pesos` : `${num(f.costo)} pesos`]));
    } else if (m === 'linea') {
        const lb = ['unidad', 'entrega', 'absorbe'].map(fp => ({ clase: FP_CLASE[fp], nombre: FP_NOMBRE[fp], f: x => flujo({ mw: x, fp, banco: L.banco }).vInv })).concat([{ clase: 'h-s-norma', nombre: 'Límite: 1.05', f: () => TENSION.max }]);
        $('#h-b-t').textContent = 'El voltaje en los inversores';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `Por unidad: 1 es el voltaje nominal. Para entregar energía y reactivos, el voltaje sube hacia la central. ${L.banco ? 'Con el banco conectado.' : 'Sin el banco.'}`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'El voltaje en los inversores', ...MW_X, yMin: 0.95, yMax: 1.1, ticksY: [0.95, 1, 1.05, 1.1], etY: 'por unidad', lineas: lb, fy: y => f2(y), punta: x => `${num(x)} MW · ${lb.slice(0, 3).map(s => `${s.nombre.toLowerCase()} ${f3(s.f(x))}`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['A 90 MW', 'Este modelo', 'La tesis'], [
            ['Voltaje, factor de potencia 1', f3(PLENA.vInv), f3(CASO.tesis.vInvFp1)],
            ['Voltaje, entregando reactivos', f3(ENTREGA.vInv), f3(CASO.tesis.vInvEntrega)],
            ['Voltaje, absorbiendo reactivos', f3(flujo({ fp: 'absorbe' }).vInv), f3(CASO.tesis.vInvAbsorbe)],
            ['Inversores, entregando reactivos', pct(ENTREGA.carga), pct(CASO.tesis.cargaEntrega)],
        ]);
        const lc = ['unidad', 'entrega', 'absorbe'].map(fp => ({ clase: FP_CLASE[fp], nombre: FP_NOMBRE[fp], f: x => 100 * flujo({ mw: x, fp, banco: L.banco }).carga })).concat([{ clase: 'h-s-norma', nombre: 'Su capacidad', f: () => 100 }]);
        $('#h-c-t').textContent = 'Cuánto trabajan los inversores';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `De cada 100 de lo que pueden dar (${f1(S_INVERSORES)} MVA). Entregando reactivos con factor de potencia 0.95 se pasan de su capacidad; el banco les quita carga.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Cuánto trabajan los inversores', ...MW_X, yMin: 0, yMax: 120, ticksY: [0, 30, 60, 90, 120], etY: '% de su capacidad', lineas: lc, fy: y => num(y), punta: x => `${num(x)} MW · ${lc.slice(0, 3).map(s => `${s.nombre.toLowerCase()} ${num(s.f(x))} %`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['La línea de enlace', 'Valor'], [
            ['Largo', `${f2(CASO.linea.km)} km`],
            ['Conductor', CASO.linea.conductor],
            ['Resistencia', `${num(CASO.linea.r, 5)} Ω por km`],
            ['Reactancia', `${num(CASO.linea.x, 5)} Ω por km`],
            ['Corriente que aguanta', `${num(CASO.linea.amperes)} A`],
            ['A 90 MW', `${num(PLENA.amperes)} A y ${num(PLENA.perdLinea * 1000)} kW de pérdidas`],
        ]);
    } else if (m === 'falla') {
        const F = calcFalla({ ms: pide.ms, residual: pide.residual });
        const lb = [{ clase: 'h-s-actual', nombre: 'El voltaje', f: x => F.voltaje(x) }, { clase: 'h-s-norma', nombre: 'Lo que debe aguantar', f: x => envolvente(x) }];
        $('#h-b-t').textContent = 'El voltaje en el punto de interconexión';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = F.debeQuedarse ? `Mientras el voltaje no baje de la raya, la central debe seguir conectada. Con este voltaje, una falla puede durar hasta ${num(F.msMax)} ms.` : `El voltaje bajó de la raya pasados los ${num(F.msMax)} ms: desde ahí la central ya se puede desconectar.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'El voltaje en el punto de interconexión', ...T_X, yMin: 0, yMax: 1.2, ticksY: [0, 0.3, 0.6, 0.9, 1.2], etY: 'por unidad', lineas: lb, fy: y => f1(y), punta: x => `${f2(x)} s · voltaje ${f2(F.voltaje(x))} · mínimo ${f2(envolvente(x))}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Desde la falla', 'Central de inversores', 'Central de máquinas'], HUECO.asincrona.map(([t, v], i) => [`${num(t * 1000)} ms`, `${f2(v)}`, `${f2(HUECO.sincrona[i][1])} (${num(HUECO.sincrona[i][0] * 1000)} ms)`]));
        const lc = [{ clase: 'h-s-verde', nombre: 'Potencia activa', f: x => 100 * F.potencia(x) }, { clase: 'h-s-azul', nombre: 'Reactivos', f: x => 100 * F.reactiva(x) }];
        $('#h-c-t').textContent = 'Lo que da la central';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = F.debeQuedarse ? `De cada 100 de su capacidad. Durante la falla da reactivos para sostener el voltaje; al liberarse, la potencia vuelve en ${f2(0.35)} s (el Código pide de ${RECUPERA[0]} a ${RECUPERA[1]}).` : 'De cada 100 de su capacidad. Como el voltaje bajó de la raya, la central se desconectó: para volver debe esperar a que la red esté normal y subir poco a poco.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Lo que da la central', ...T_X, yMin: 0, yMax: 120, ticksY: [0, 30, 60, 90, 120], etY: '% de su capacidad', lineas: lc, fy: y => num(y), punta: x => `${f2(x)} s · activa ${num(100 * F.potencia(x))} · reactivos ${num(100 * F.reactiva(x))}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['En la falla', 'Corriente'], [
            ['Lo que aporta la red', `${f1(F.kaRed)} kA`],
            ['Lo que aporta la central (de ejemplo)', `${f2(F.kaCentral)} kA`],
            ['Corriente normal de la central', `${num(AMPERES_NOMINAL)} A`],
        ]);
    } else {
        const puntos = PROYECTOS.map(p => ({ x: p.mw, y: p.porMw, texto: p === VECINO ? 'San Luis de la Paz' : '', izq: false }));
        const lb = [{ clase: 'h-s-actual', nombre: 'Cada proyecto' }];
        $('#h-b-t').textContent = 'Refuerzos de la primera convocatoria';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `Millones de pesos de refuerzos por cada MW, según su tamaño. El de San Luis de la Paz (${num(VECINO.mw)} MW), cerca del caso, comparte una obra de ${num(VECINO.mdp)} millones: le tocan ${num(VECINO.parte)}.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Refuerzos de la primera convocatoria', xMin: 0, xMax: 650, ticksX: [0, 150, 300, 450, 600], etX: 'Tamaño del proyecto, MW', fx: x => num(x), yMin: 0, yMax: 8, ticksY: [0, 2, 4, 6, 8], etY: 'millones por MW', puntos, fy: y => num(y), punta: x => { const p = [...PROYECTOS].sort((a, b) => Math.abs(a.mw - x) - Math.abs(b.mw - x))[0]; return `${p.region}, ${num(p.mw)} MW · ${f2(p.porMw)} millones por MW`; } });
        $('#h-tabla-b').innerHTML = tablaHTML(['Proyecto', 'MW', 'Refuerzos', 'Por MW'], [...PROYECTOS].sort((a, b) => b.porMw - a.porMw).map(p => [`${p.region} (${p.subestacion}, ${p.kv} kV)`, num(p.mw), `${num(p.parte)} millones${p.compartida ? ', compartida' : ''}`, f2(p.porMw)]));
        const lc = [{ clase: 'h-s-actual', nombre: 'Zona rural', f: x => (x * COSTO_KM.rural) / 1e6 }, { clase: 'h-s-cafe', nombre: 'Terreno abrupto', f: x => (x * COSTO_KM.abrupto) / 1e6 }, { clase: 'h-s-azul', nombre: 'Ciudad, con postes', f: x => (x * COSTO_KM.urbano) / 1e6 }];
        $('#h-c-t').textContent = 'Lo que cuesta la línea de enlace';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Millones de pesos de 2018, un circuito de 115 kV con ACSR 795, solo el costo directo. La del caso, de ${f2(CASO.linea.km)} km en zona rural: unos ${f1((CASO.linea.km * COSTO_KM.rural) / 1e6)} millones.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Lo que cuesta la línea de enlace', xMin: 0, xMax: 40, ticksX: [0, 10, 20, 30, 40], etX: 'Largo, km', fx: x => num(x), yMin: 0, yMax: 210, ticksY: [0, 50, 100, 150, 200], etY: 'millones de pesos', lineas: lc, fy: y => num(y), punta: x => `${f1(x)} km · ${lc.map(s => `${s.nombre.toLowerCase()} ${num(s.f(x))}`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Línea de 115 kV, un km', 'Pesos de 2018'], [['Zona rural, terreno normal', num(COSTO_KM.rural)], ['Zona rural, terreno abrupto', num(COSTO_KM.abrupto)], ['Dos circuitos', num(COSTO_KM.dosCircuitos)], ['Ciudad, con postes', num(COSTO_KM.urbano)]]);
    }
}

function pintarBarras(L, pag) {
    const { $, pide } = pag;
    let filas;
    if (pide.modo === 'pasos') {
        const parte = ids => { const es = ETAPAS.filter(e => ids.includes(e.id)); const d0 = es[0].desde; const d1 = es.at(-1).hasta; return clamp01((L.dia - d0) / (d1 - d0)); };
        filas = [
            { t: 'Estudios del CENACE', v: parte(['solicitud', 'indicativo', 'impacto', 'instalaciones']), activa: true },
            { t: 'Contrato', v: parte(['contrato']) },
            { t: 'Obras', v: parte(['obra']) },
            { t: 'Inspección y pruebas', v: parte(['inspeccion', 'pruebas']) },
        ];
        $('#h-d-t').textContent = 'Lo que lleva, de cada 100';
        $('#h-d-pie').textContent = 'Sin el contrato no se construye; sin el certificado de la unidad de inspección no se prueba; sin las pruebas no hay operación comercial.';
    } else if (pide.modo === 'linea') {
        filas = [
            { t: 'Línea, de lo que aguanta', v: L.usoLinea, activa: true },
            { t: 'Inversores, de su capacidad', v: L.carga, escala: 1.2 },
            { t: 'Pérdidas hasta la red', v: L.pInv > 0 ? L.perdidas / L.pInv : 0, d: 1, escala: 0.05 },
        ];
        $('#h-d-t').textContent = 'De cada 100';
        $('#h-d-pie').textContent = 'Las pérdidas incluyen los transformadores, los cables y la línea: casi todo se pierde en los transformadores.';
    } else if (pide.modo === 'falla') {
        filas = [
            { t: 'Voltaje en el punto', v: L.v, activa: true },
            { t: 'Lo que debe aguantar', v: L.minimo },
            { t: 'Potencia de la central', v: L.p },
        ];
        $('#h-d-t').textContent = `A los ${num(L.t * 1000)} ms, de cada 100`;
        $('#h-d-pie').textContent = 'La central sigue conectada mientras el voltaje esté arriba de lo que pide la curva.';
    } else {
        const total = L.linea + L.estudios + L.refuerzo;
        filas = [
            { t: 'La línea, de lo que paga la central', v: L.linea / L.central, activa: true },
            { t: 'Los estudios, de lo que paga', v: L.estudios / L.central },
            { t: 'Refuerzos que paga la central', v: total > 0 ? Math.max(0, L.central - L.linea - L.estudios) / total : 0 },
        ];
        $('#h-d-t').textContent = 'De cada 100';
        $('#h-d-pie').textContent = `Con un refuerzo como el del proyecto de San Luis de la Paz (${num(VECINO.parte)} millones), la modalidad decide quién lo paga.`;
    }
    $('#h-barras').innerHTML = barrasHTML(filas);
}

function alPintarFijas({ $ }) {
    $('#h-mic').innerHTML = tablaHTML(['Tamaño de la central', 'Días hábiles', 'Costo'], TABLA_I1.map(f => [f.mw[1] === Infinity ? `Más de ${num(f.mw[0])} MW` : `${mwR(f.mw[0])} a ${num(f.mw[1])} MW`, num(f.total), Array.isArray(f.costo) ? `${num(f.costo[0])} a ${num(f.costo[1])} pesos` : `${num(f.costo)} pesos`]));
    $('#h-codigo').innerHTML = tablaHTML(['Qué', 'Lo que pide'], [
        ['Tipo de central', `D: más de 30 MW (en el sistema interconectado)`],
        ['Frecuencia', `De ${f1(FRECUENCIA[2].de)} a ${f1(FRECUENCIA[2].a)} Hz sin límite; fuera de ahí, ${FRECUENCIA[1].tiempo} o ${FRECUENCIA[0].tiempo}`],
        ['Voltaje', `De ${f2(TENSION_CR[1].de)} a ${f2(TENSION_CR[1].a)} sin límite; de ${f2(TENSION_CR[0].de)} a ${f2(TENSION_CR[2].a)}, ${TENSION_CR[0].tiempo}`],
        ['Hueco de voltaje (inversores)', `Aguantar ${num(msPermitidos(0))} ms sin voltaje y volver a 0.9 a los 1.5 s`],
        ['Reactivos', `Factor de potencia ${REACTIVOS.fp}, entregando o absorbiendo, en el punto de interconexión`],
        ['Después de una falla', `Recuperar la potencia en ${RECUPERA[0]} a ${RECUPERA[1]} s`],
        ['Distorsión armónica', `${f1(THD_MAX)} % como máximo en el voltaje`],
    ]);
    $('#h-conv').innerHTML = tablaHTML(['Región', 'Proyectos', 'MW', 'Refuerzos', 'Por MW'], POR_GCR.map(g => [g.gcr, g.proyectos, num(g.mw), millones(g.mdp), f2(g.porMw)]).concat([['Todas', CONV_TOTAL.proyectos, num(CONV_TOTAL.mw), millones(CONV_TOTAL.mdp), f2(CONV_TOTAL.mdp / CONV_TOTAL.mw)]]));
    $('#h-regla').innerHTML = tablaHTML(['Qué', 'Dónde lo dice'], [
        ['Una central de 0.7 MW o más necesita permiso; el permiso no aprueba la interconexión', 'LSE, art. 19; RLSE, art. 27'],
        ['La CFE debe interconectar una central cuando es técnicamente factible, con las obras que fija el CENACE', 'LSE, art. 48'],
        ['Contrato en 10 días hábiles y conexión física en 72 horas tras la orden del CENACE', 'LSE, art. 48'],
        ['El permiso no da lugar en la fila; la central puede construir las obras a su costa', 'LSE, art. 49'],
        ['El CENACE entrega al interesado sus modelos y estudios en 7 días naturales', 'LSE, art. 179'],
        ['Conectar sin contrato se multa con 10 % de los ingresos del año anterior', 'LSE, art. 184'],
        ['El CENACE publica la capacidad máxima sin refuerzos, 20 días hábiles después del PLADESE', 'RLSE, art. 67'],
        ['Las obras de interconexión las paga quien conecta; los refuerzos, según la modalidad', `Manual del CENACE, 3.12.3 y 3.12.4 (tope del trámite: ${num(MIC.tope)} días)`],
    ]);
}

function alActualizar(L, pag) {
    const { pide, ponerCifra, ponerLecturas, nivel, graficas } = pag;
    pintarBarras(L, pag);
    ponerCifra('aT', { pasos: 'Los pasos', linea: 'De la central a la red', falla: 'La falla', paga: 'Quién paga' }[pide.modo]);
    ponerCifra('aPie', MODOS[pide.modo].aclara);
    if (pide.modo === 'pasos') {
        const e = L.etapa;
        ponerLecturas([
            ['Día hábil', num(L.dia), `unos ${f1(L.meses)} meses`],
            ['Etapa', L.comercial ? 'Operación comercial' : e.nombre, e.ejemplo ? 'duración de ejemplo' : `${num(e.dias)} días hábiles`],
            ['Estudios', `${num(ESTUDIOS.dias)} días`, 'indicativo, impacto e instalaciones'],
            ['Costo de los estudios', `${num(ESTUDIOS.costo)} pesos`, 'para 30 a 100 MW'],
            ['Obras', pct(L.obra), 'de la construcción'],
            ['Pruebas', `${num(MIC.horasPlena)} horas`, 'al 100 % de carga'],
        ], null);
        ponerCifra('hud', L.comercial ? 'En operación' : e.corto);
        ponerCifra('hud2', `día hábil ${num(L.dia)}`);
        nivel(1, 'Trámite', L.dia / TOTAL_DIAS, pct(L.dia / TOTAL_DIAS));
        nivel(2, 'Obras', L.obra, pct(L.obra));
    } else if (pide.modo === 'linea') {
        const aviso = L.sobrecarga ? `Los inversores tendrían que dar ${pct(L.carga)} de su capacidad: hace falta compensar reactivos.` : L.fueraTension ? `El voltaje en los inversores, ${f3(L.vInv)}, sale del rango de 0.95 a 1.05.` : null;
        ponerLecturas([
            ['Entrega a la red', `${num(L.mw)} MW`, L.mvar === 0 ? 'sin reactivos' : `${L.mvar > 0 ? 'y entrega' : 'y absorbe'} ${f1(Math.abs(L.mvar))} MVAr`],
            ['Voltaje en los inversores', f3(L.vInv), 'por unidad; bien de 0.95 a 1.05'],
            ['Inversores', pct(L.carga), 'de su capacidad'],
            ['Corriente en la línea', `${num(L.amperes)} A`, `de ${num(CASO.linea.amperes)} que aguanta`],
            ['Pérdidas en la línea', `${num(L.perdLinea * 1000)} kW`, `${f1(L.perdidas)} MW en toda la central`],
            ['Banco de capacitores', L.banco ? `${f1(L.qBanco)} MVAr` : 'apagado', `de ${BANCO_MVAR} MVAr, de ejemplo`],
        ], aviso);
        ponerCifra('hud', `${num(L.mw)} MW`);
        ponerCifra('hud2', `voltaje en inversores ${f3(L.vInv)}`);
        graficas.b?.marcar(L.mw, L.vInv);
        graficas.c?.marcar(L.mw, L.carga * 100);
        nivel(1, 'Línea', L.usoLinea, pct(L.usoLinea));
        nivel(2, 'Inversores', clamp01(L.carga), pct(L.carga));
    } else if (pide.modo === 'falla') {
        ponerLecturas([
            ['Voltaje', f2(L.v), `mínimo que pide la curva: ${f2(L.minimo)}`],
            ['La central', L.conectada ? 'Conectada' : 'Desconectada', L.debeQuedarse ? 'debe aguantar esta falla' : `puede salir pasados ${num(L.msMax)} ms`],
            ['Potencia', `${num(L.p * CASO.mw)} MW`, pct(L.p)],
            ['Reactivos', `${num(L.q * 100)} %`, 'de su capacidad, para sostener el voltaje'],
            ['Falla', `${num(L.ms)} ms`, L.residual > 0 ? 'lejana: el voltaje baja a la mitad' : 'cercana: el voltaje baja a cero'],
            ['Corriente de la red', `${f1(L.kaRed)} kA`, `la central da unos ${f2(L.kaCentral)} kA`],
        ], L.debeQuedarse ? null : 'Con esta falla el voltaje baja de la curva: el Código de Red ya no le exige seguir conectada.');
        ponerCifra('hud', `${f2(L.v)}`);
        ponerCifra('hud2', L.t < 0 ? 'voltaje antes de la falla' : `voltaje a los ${num(L.t * 1000)} ms`);
        graficas.b?.marcar(L.t, L.v);
        graficas.c?.marcar(L.t, 100 * L.p);
        nivel(1, 'Voltaje', clamp01(L.v), f2(L.v));
        nivel(2, 'Potencia', clamp01(L.p), pct(L.p));
    } else {
        ponerLecturas([
            ['Línea de enlace', millones(L.linea), `${f1(L.km)} km, precios de 2018`],
            ['Estudios', `${num(ESTUDIOS.costo)} pesos`, 'tabla I.1, de 30 a 100 MW'],
            ['Paga la central', millones(L.central), L.modalidad === 'individual' ? 'con los refuerzos' : 'sin los refuerzos'],
            ['Refuerzos', millones(L.refuerzo), L.modalidad === 'individual' ? 'los paga la central' : 'entran al programa de la red'],
            ['Garantías', `${num(MIC.garantia[0] * 100)} % y ${num(MIC.garantia[1] * 100)} %`, 'de las obras, antes del contrato'],
            ['Almacenamiento', `${num(MW_SAEE)} MW por 3 horas`, 'lo pediría hoy la Segunda Convocatoria'],
        ], null);
        ponerCifra('hud', millones(L.central));
        ponerCifra('hud2', 'paga la central, sin la bahía');
        graficas.c?.marcar(L.km, L.linea);
        graficas.b?.marcar(VECINO.mw, VECINO.porMw);
        nivel(1, 'Línea', clamp01(L.km / LIMITES.km[1]), `${f1(L.km)} km`);
        nivel(2, 'Refuerzos de la central', L.modalidad === 'individual' ? 1 : 0, L.modalidad === 'individual' ? 'sí' : 'no');
    }
}

// ------------------------------------------------------------------ el sitio
const PIDE0 = { ...DEF, corre: false };
crearPagina({
    figura: FIGURA,
    fichas: FICHAS,
    vistas: VISTAS,
    modos: MODOS,
    botones: BOTONES,
    acciones: ACCIONES,
    modo0: 'linea',
    pide: { ...PIDE0 },
    general: { Lx: 16, Lz: 7.4, alto: 3.0, mira: [0, 0.5, 0], az: 16, el: 30, azVertical: 10, elVertical: 40 },
    etiquetas: { lienzo: 'Cómo se conecta una central a la red, en 3D: arrastra para girarla, toca un punto para conocerlo', modos: 'Qué ver de la conexión', puntos: 'Puntos clave de la conexión', desarmar: 'Desarmar', lecturas: 'Lo que se mide en la conexión' },
    textoFinal: 'Toca cualquier punto para volver a verlo. Deja correr los pasos del trámite, pide reactivos, provoca una falla o cambia quién paga los refuerzos.',
    colores: { guindaSuave: '#f3d4de', claro: '#ffffff' },
    crearDiagrama,
    secciones,
    escena: (renderer, scene, { movil, oscuro }) => {
        const M = materiales(P_PLANTA);
        const est = escenario(renderer, scene, M, { movil, oscuro });
        return { planta: construir(M, P_PLANTA, { movil, oscuro }), est };
    },
    alCambiarModo: (p, nuevo) => {
        Object.assign(p, PIDE0);
        if (nuevo === 'pasos') { p.dia = 0; p.corre = true; }
        if (nuevo === 'falla') { p.tf = LIMITES.tf[0]; p.corre = true; }
    },
    poseDe: ({ pide, ve, encendido, t, dt, camara }) => pose({ modo: pide.modo, mw: pide.mw, fp: pide.fp, banco: pide.banco, dia: pide.dia, ms: pide.ms, residual: pide.residual, tf: pide.tf, km: pide.km, modalidad: pide.modalidad, saee: pide.saee, noche: ve.noche, adentro: ve.adentro, desarme: ve.desarme, encendido, t, dt, camara }),
    firma: p => [p.modo, Math.round(p.mw), p.fp, p.banco, Math.round(p.ms), p.residual, Math.round(p.km), p.modalidad, p.saee],
    alPintarFijas,
    alPintarGraficas,
    alActualizar,
    prueba: p => ({ mw: +p.mw.toFixed(1), fp: p.fp, banco: p.banco, dia: Math.round(p.dia), ms: Math.round(p.ms), residual: p.residual, tf: +p.tf.toFixed(2), km: +p.km.toFixed(1), modalidad: p.modalidad, saee: p.saee }),
});
