// «Central hidroeléctrica», en 3D y con el formato Búho de «¿Cómo funciona?». Una central de ejemplo con las cifras de La Yesca, en el río Santiago: el embalse, la
// cortina, el vertedor y, cortado de frente, el camino del agua hasta el río, con la casa de máquinas subterránea. Cuatro formas de verla: agua y caída, un día, un
// año y qué pasa si se cae la línea. Puntos clave con su ficha, ver por dentro, desarmar, día y noche, y gráficas que leen las mismas cifras que mueven la central
// (modelo.js). Se arma con: node scripts/build-conceptos-3d.mjs hidroelectrica
//
// Lo que se repite entre las plantas con física está en conceptos-3d/planta-comun/.
import { clamp, clamp01, num } from '../planta-comun/ayudas.js';
import { barrasHTML, leyenda, pintarGrafica, seccionBarras, seccionColores, seccionDiagrama, seccionFuentes, seccionGrafica, seccionTabla, tablaHTML } from '../planta-comun/graficas.js';
import { crearPagina } from '../planta-comun/pagina.js';
import { AGUA, CENTRAL, DEF, ETA, FIN_EVENTO, FLUIDOS, GOLPE_M, LIMITES, MESES, MES_CORTO, NIVEL, PARTES as PARTES_M, TIPOS, UNIDAD, VAIVEN, VIAJE, VOL_UTIL, anual, areaKm2, demandaEn, enHora, enSerie, etaTurbina, kwhPorM3, nivelEnMes, pasoPlanta, estadoPlanta, pose, potenciaMax, rechazo, unidad } from './modelo.js';
import { P_PLANTA, construir, escenario, materiales } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';

const FIGURA = 'hidroelectrica';
const ZD = NIVEL.abajo + UNIDAD.Hd + UNIDAD.perdida;
const ATM = (NIVEL.NAMO - NIVEL.distribuidor) / 10.33;

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'cuenca', nombre: 'Río y cuenca', modo: 'ano', abrir: true, accion: 'lluvioso', eq: `${num(CENTRAL.cuenca)} km² de cuenca · ${num(AGUA.publicada)} millones de m³ al año`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11Z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
        texto: `Todo empieza con la lluvia, que aquí cae sobre ${num(CENTRAL.cuenca)} km². El río Santiago la junta con el Bolaños. De julio a octubre llegan cerca de 75 de cada 100 litros del año. El agua que usó Santa Rosa, río arriba, se usa otra vez aquí, y luego en El Cajón y Aguamilpa.` },
    { parte: 'embalse', nombre: 'Embalse', modo: 'agua', accion: 'bajarEmbalse', eq: `Útil: ${num(VOL_UTIL())} millones de m³, entre ${NIVEL.NAMINO} y ${NIVEL.NAMO} m`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 8c3-2 5 2 9 0s6 2 9 0"/><path d="M3 13c3-2 5 2 9 0s6 2 9 0"/><path d="M3 18c3-2 5 2 9 0s6 2 9 0"/>',
        texto: `Es energía guardada: el agua vale por lo alto que está. Un m³ deja ${num(kwhPorM3(NIVEL.NAMO), 2)} kWh desde el nivel ${NIVEL.NAMO}, y ${num(kwhPorM3(NIVEL.NAMINO), 2)} desde el ${NIVEL.NAMINO}. El NAMO es el nivel más alto de operación normal; el NAMINO, el más bajo. Hasta el NAME, ${NIVEL.NAME} m, sube solo en una crecida.` },
    { parte: 'cortina', nombre: 'Cortina', modo: 'agua', accion: 'desarme', eq: `${CENTRAL.cortina} m desde su base · ${CENTRAL.largo} m de largo`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 20 10 5h4l6 15Z"/><path d="M4 20h16"/><path d="M8 13h8"/>',
        texto: `Aquí se ve desde atrás, cortada. Es un cerro de roca acomodada en capas: aguanta por su peso. Como la roca deja pasar el agua, el sello es una cara de concreto del lado del embalse, unida a la roca por una base y una pantalla. La real es menos empinada; las capas son de ejemplo.` },
    { parte: 'vertedor', nombre: 'Vertedor', modo: 'ano', accion: 'lluvioso', eq: `Hasta ${num(CENTRAL.vertedor.descarga)} m³/s, por ${CENTRAL.vertedor.compuertas} compuertas`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 5h16"/><path d="M7 5v5M12 5v5M17 5v5"/><path d="M5 10h14l-3 10H8Z"/>',
        texto: 'Es la válvula de seguridad. Si entra más agua de la que cabe, las compuertas abren y el agua baja por este canal, sin pasar por las turbinas. Al final, una cubeta la lanza lejos para que no dañe la roca. La Yesca tiene seis, en la otra orilla: aquí se ven tres y de este lado.' },
    { parte: 'toma', nombre: 'Obra de toma', modo: 'agua', accion: 'desarme', eq: `Dos tomas, de ${num(UNIDAD.Qd, 2)} m³/s cada una`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="5" y="4" width="14" height="16" rx="1"/><path d="M9 4v16M12 4v16M15 4v16"/><path d="M5 12h14"/>',
        texto: `Aquí el agua deja el embalse. Las rejillas detienen troncos y basura antes de que lleguen a la turbina. La compuerta guinda baja para vaciar el tubo y darle mantenimiento. La boca va abajo del NAMINO, así que queda cubierta aun con el embalse bajo. Hay una por unidad.` },
    { parte: 'tuberia', nombre: 'Tubería a presión', modo: 'cierre', accion: 'caida', eq: `${num(UNIDAD.L, 1)} m · de ${num(UNIDAD.D1, 1)} a ${num(UNIDAD.D2, 2)} m de diámetro`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 5h5l8 12h5"/><path d="M3 9h3l8 12h7"/>',
        texto: `Un tubo de acero, dentro de un túnel en la roca, baja el agua hasta la turbina. Abajo la presión llega a unas ${num(ATM)} atmósferas. A tope corre a ${num(UNIDAD.Qd / ((Math.PI * 7.53 ** 2) / 4), 1)} m/s, y no se puede frenar de un jalón: pesa miles de toneladas. Prueba tirar la línea y mira qué pasa.` },
    { parte: 'distribuidor', nombre: 'Caracol y distribuidor', modo: 'agua', abrir: true, accion: 'desarme', eq: 'Abre el paso: cambia la potencia, no la velocidad', recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 12a2 2 0 1 1 2 2 4 4 0 1 1 4-4 6 6 0 0 1-6 8 8 8 0 0 1-8-8"/>',
        texto: 'El caracol es un tubo en espiral que se angosta, para que el agua entre pareja por toda la vuelta. Luego cruza dos coronas de paletas: las plateadas la guían; las guinda, el distribuidor, giran para abrir o cerrar el paso. Así se decide cuánta potencia da la unidad.' },
    { parte: 'turbina', nombre: 'Turbina Francis', modo: 'agua', abrir: true, accion: 'cargaBaja', eq: `Rodete de ${num(UNIDAD.rodete, 1)} m · ${UNIDAD.rpm} vueltas por minuto`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="12" r="8"/><path d="M12 12c0-3 2-5 5-5M12 12c3 0 5 2 5 5M12 12c0 3-2 5-5 5M12 12c-3 0-5-2-5-5"/>',
        texto: `El agua entra por fuera del rodete, empuja sus paletas curvas y sale por el centro, hacia abajo. Es la turbina común en caídas medianas. En su mejor punto aprovecha unos ${num(etaTurbina(ETA.apertura) * 100)} de cada 100. A media carga el agua sale girando y la máquina vibra: se evita.` },
    { parte: 'generador', nombre: 'Generador', modo: 'agua', abrir: true, accion: 'desarme', eq: `${UNIDAD.polos} polos a ${UNIDAD.rpm} vueltas: 60 ciclos por segundo`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="12" r="7.500"/><path d="M12.800 7.500 9.700 12.600h4.600l-3 4"/>',
        texto: `Va arriba, en el mismo eje que la turbina. Un rotor con electroimanes gira dentro de bobinas de cobre quietas, y ahí nace la electricidad. Como gira despacio, necesita ${UNIDAD.polos} polos para dar los 60 ciclos de la red, y por eso es tan ancho. Aquí se dibujan ${UNIDAD.polos / 2}.` },
    { parte: 'casa', nombre: 'Casa de máquinas', modo: 'agua', accion: 'desarme', eq: '22.2 × 103.5 × 50 m, bajo tierra', recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 20c2-9 5-14 9-14s7 5 9 14Z"/><path d="M8 20v-5h8v5"/><path d="M6 12h12"/>',
        texto: 'Es una caverna excavada en la roca, casi del largo de una cancha de futbol. Aquí van las dos unidades, una detrás de otra: el corte deja ver la primera completa. Dos grúas de 130 toneladas sacan las piezas para repararlas. El aire entra por lumbreras, y la electricidad sube por otras.' },
    { parte: 'oscilacion', nombre: 'Aspiración y galería', modo: 'cierre', abrir: true, accion: 'caida', eq: `Galería de ${CENTRAL.galeria.join(' × ')} m`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M8 3v8c0 2-2 3-5 3"/><path d="M16 3v18"/><path d="M8 21h13"/><path d="M16 10h5"/>',
        texto: `Bajo el rodete, el tubo de aspiración se abre poco a poco para frenar el agua y aprovecharle más. Luego llega a esta galería, un gran hueco con aire arriba. Si las unidades cierran de pronto, el agua de abajo sigue de largo y aquí el nivel baja y sube, cada ${num(VAIVEN.periodo)} s, como en un vaso.` },
    { parte: 'desfogue', nombre: 'Desfogue', modo: 'agua', accion: 'desarme', eq: `Túnel de ${CENTRAL.desfogue.largo} m, de ${CENTRAL.desfogue.ancho} × ${CENTRAL.desfogue.alto} m`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 8h9c3 0 3 8 6 8h3"/><path d="M3 18c2-1 3 1 5 0s3 1 5 0"/>',
        texto: 'El agua regresa al río por un túnel. No se quema ni se gasta. Pero el río sí cambia: el agua llega a otras horas, y el sedimento se queda en el embalse. Río abajo la espera la siguiente presa, El Cajón. Por ley, parte del agua debe quedarse en el río para conservarlo.' },
    { parte: 'subestacion', nombre: 'Subestación', modo: 'dia', abrir: true, accion: 'desarme', eq: `${num(CENTRAL.mw)} MW · salida de 400 kV, de ejemplo`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 20h16"/><path d="M7 20V8l5-4 5 4v12"/><path d="M7 12h10"/>',
        texto: 'La electricidad sube de la caverna por cables, en una lumbrera. Este transformador eleva el voltaje para que viaje lejos con pocas pérdidas. La nave blanca guarda los interruptores en un gas que aísla, y ocupa menos que una subestación abierta. Voltaje y acomodo son de ejemplo.' },
    { parte: 'red', nombre: 'RNT y RGD', modo: 'dia', accion: 'noche', recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 3 6 21M12 3l6 18M8 9h8M7 14h10"/>',
        texto: 'La electricidad sale por la RNT, la Red Nacional de Transmisión. Las RGD, Redes Generales de Distribución, la reparten al público. El CENACE decide cuándo entra cada central, y debe considerar cuánta agua hay. Como arranca en minutos, se guarda para las horas de más demanda.' },
];
const VISTAS = Object.fromEntries(PARTES_M.map(p => [p.id, p.vista]));

const horaTexto = v => { const h = Math.floor(clamp(v, 0, 24)) % 24; const m = Math.floor((v - Math.floor(v)) * 60); return `${h}:${String(m).padStart(2, '0')}`; };
const textoMes = v => MESES[clamp(Math.round(v), 1, 12) - 1];
const relojDia = { texto: 'el día', avanzar: (p, dt) => { p.hora += (dt * 24) / 30; if (p.hora >= 24) p.hora = 0; return false; }, alSeguir: () => {} };
const relojAno = { texto: 'el año', avanzar: (p, dt) => { p.mes += (dt * 12) / 30; if (p.mes >= 12.49) p.mes = 0.51; return false; }, alSeguir: () => {} };
const MODOS = {
    agua: { nombre: 'Agua y caída', corto: 'Agua', resumen: 'La potencia depende de dos cosas: cuánta agua pasa y desde qué altura cae. Abre el distribuidor y sube o baja el embalse. Fíjate: con el embalse bajo, la unidad ya no llega a su tamaño.', aclara: 'De cada 100 de la energía del agua que cae, a dónde va. Es de las máquinas que más aprovechan.', mando: { nombre: 'Apertura del distribuidor', campo: 'a', rango: LIMITES.a, texto: v => `${num(v)} %` }, mando2: { nombre: 'Nivel del embalse', campo: 'nivel', rango: LIMITES.nivel, texto: v => `${num(v)} m` } },
    dia: { nombre: 'Un día', corto: 'Un día', resumen: 'El agua de un día alcanza para pocas horas a tope. Por eso se guarda para cuando más se necesita: arranca en minutos, y una térmica tarda horas. Mueve la hora, o cambia cuánta agua hay hoy.', aclara: 'La misma agua, repartida hora por hora. Pareja, daría muy poco a cada hora.', mando: { nombre: 'Hora', campo: 'hora', rango: LIMITES.hora, texto: horaTexto }, mando2: { nombre: 'Agua de hoy, en promedio', campo: 'aguaDia', rango: LIMITES.aguaDia, texto: v => `${num(v)} m³/s` }, reloj: relojDia },
    ano: { nombre: 'Un año', corto: 'Un año', resumen: 'Llueve cuatro meses y hay que generar los doce. El embalse se llena en las lluvias y baja poco a poco en el estiaje. Prueba un año seco: no se llena y da la mitad. En uno lluvioso sobra, y se abre el vertedor.', aclara: 'Cuánto entra, cuánto pasa por las turbinas y cuánto se vierte, este mes.', mando: { nombre: 'Mes', campo: 'mes', rango: LIMITES.mes, texto: textoMes }, reloj: relojAno },
    cierre: { nombre: 'Si se cae la línea', corto: 'Cierre', resumen: 'Si la línea falla, la unidad se queda sin carga y se acelera. Hay que cerrar el agua. Muy rápido: el golpe de presión daña la tubería. Muy lento: la máquina se desboca. Mueve el tiempo de cierre y tira la línea.', aclara: 'El distribuidor, la presión y la velocidad durante el cierre. En La Yesca cierra en 9 segundos.', mando: { nombre: 'Tiempo de cierre', campo: 'tc', rango: LIMITES.tc, texto: v => `${num(v, v < 10 ? 1 : 0)} s` } },
};
const ORDEN_TIPOS = ['normal', 'seco', 'lluvioso'];
const BOTONES = [
    { id: 'tipo', visible: p => p.modo === 'ano', pulsado: p => p.tipo !== 'normal', texto: p => TIPOS[p.tipo].nombre, alTocar: p => { p.tipo = ORDEN_TIPOS[(ORDEN_TIPOS.indexOf(p.tipo) + 1) % 3]; } },
    { id: 'caida', visible: p => p.modo === 'cierre', pulsado: () => false, texto: () => 'Que se caiga la línea', alTocar: p => { p.pideCaida = true; } },
];
const ACCIONES = {
    lluvioso: { texto: p => (p.tipo === 'lluvioso' ? 'Volver a un año normal' : 'Ver un año lluvioso'), hacer: (p, pag) => { p.tipo = p.tipo === 'lluvioso' ? 'normal' : 'lluvioso'; p.mes = 9; pag.invalidar(); pag.ponerMando(); } },
    bajarEmbalse: { texto: p => (p.nivel < 530 ? 'Llenar el embalse' : 'Bajar el embalse'), hacer: (p, pag) => { p.nivel = p.nivel < 530 ? NIVEL.NAMO : NIVEL.NAMINO; p.a = 100; pag.invalidar(); pag.ponerMando(); } },
    cargaBaja: { texto: p => (p.a < 60 ? 'Ponerla en su mejor punto' : 'Bajarla a media carga'), hacer: (p, pag) => { p.a = p.a < 60 ? DEF.a : 50; pag.invalidar(); pag.ponerMando(); } },
    caida: { texto: () => 'Que se caiga la línea', hacer: p => { p.pideCaida = true; } },
};

// ------------------------------------------------------------------ el tablero
const secciones = () => `
    ${seccionDiagrama('A dónde va la energía del agua')}
    ${seccionGrafica('b')}
    ${seccionGrafica('c')}
    ${seccionBarras()}
    ${seccionTabla('El modelo contra lo publicado', 'h-curva', `Las cifras publicadas son de La Yesca. Con ellas se comprueba la física de esta figura: la misma fórmula da la potencia, la energía del año y el golpe de presión.`, 'h-tabla-texto')}
    ${seccionTabla('Qué turbina, según la caída', 'h-turbinas', 'No hay una regla exacta: las fuentes dan rangos distintos, y se enciman. Con mucha caída y poca agua, Pelton; con poca caída y mucha agua, Kaplan.')}
    ${seccionTabla('Hidroeléctricas de México', 'h-mexico', 'La mayoría son de la CFE. Hoy moderniza varias de sus centrales y construye Chicoasén II. Zimapán trabaja con aguas residuales del río Tula.')}
    ${seccionTabla('Dos permisos: la electricidad y el agua', 'h-regla', 'Las de 0.7 MW o más piden permiso de generación. Y usar el agua pide concesión, con otra autoridad y otra ley. La nueva Ley General de Aguas, de 2025, no cambió esa parte.')}
    <section class="g-curva h-media">
        <div class="g-curva-cab"><b>Cuánto pesa en México</b></div>
        <div class="h-barras" id="h-pesa"></div>
        <p>Da menos energía de lo que su tamaño sugiere porque trabaja pocas horas y depende de la lluvia. En 2023, con sequía, la generación cayó cerca de 44 % a octubre (CENACE, en Expansión).</p>
    </section>
    ${seccionColores(FLUIDOS, `Central de ejemplo con las cifras de La Yesca; no es el plano real ni un simulador. Nada está a escala: la cortina es más empinada, las máquinas son más grandes y el vaivén de la galería se ve tres veces mayor. Lo que no sale de una fuente (el nivel del río abajo, la forma de la curva de la turbina, el reparto por mes, la demanda, la regla del embalse, las capas de la cortina y los 400 kV) es de ejemplo, para ver la tendencia.`)}
    ${seccionFuentes(FUENTES, [
        { para: 'El agua como Energía Limpia, permiso de generación, terrenos para aprovechar el recurso hidráulico, restricciones hidrológicas al programar la operación, impacto social y consulta previa', titulo: 'Ley del Sector Eléctrico, arts. 3, 19, 88, 90, 119 y 133 a 139', nota: 'Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio' },
        { para: 'Consulta previa y uso del terreno para aprovechar el recurso hidráulico', titulo: 'Reglamento de la Ley del Sector Eléctrico, arts. 2, fracc. VIII, y 23', nota: 'Diario Oficial de la Federación, 3 de octubre de 2025. Está en el acervo de este sitio' },
    ])}`;

const f1 = x => num(x, 1);
const f2 = x => num(x, 2);
function alPintarGraficas(L, pag) {
    const { $, pide, graficas } = pag;
    const m = pide.modo;
    graficas.b = null;
    graficas.c = null;
    if (m === 'agua') {
        const linea = (z, clase, nombre) => ({ clase, nombre, f: a => unidad(a / 100, z).P });
        const lineas = [linea(NIVEL.NAMO, 'h-s-actual', `NAMO, ${NIVEL.NAMO} m`), linea(ZD, 'h-s-sin', `Diseño, ${num(ZD)} m`), linea(NIVEL.NAMINO, 'h-s-max', `NAMINO, ${NIVEL.NAMINO} m`)];
        $('#h-b-t').textContent = 'Potencia de una unidad, según la apertura';
        $('#h-b-ley').innerHTML = leyenda(lineas);
        $('#h-b-pie').textContent = `P = densidad × gravedad × caudal × caída × eficiencia. Arriba, el generador pone el tope: ${f1(UNIDAD.Pmax)} MW. Abajo, aun con todo abierto da ${num(potenciaMax(NIVEL.NAMINO))} MW: falta caída.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Potencia de una unidad', xMin: 0, xMax: 100, yMin: 0, yMax: 400, ticksX: [0, 25, 50, 75, 100], ticksY: [0, 100, 200, 300, 400], etX: 'Apertura del distribuidor, %', etY: 'MW', lineas, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} % · ${num(lineas[0].f(x))}, ${num(lineas[1].f(x))} y ${num(lineas[2].f(x))} MW` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Apertura', `NAMO`, 'Diseño', 'NAMINO'], [20, 40, 60, 80, 87, 100].map(a => [`${a} %`, num(lineas[0].f(a)), num(lineas[1].f(a)), num(lineas[2].f(a))]));
        const fe = a => etaTurbina(a / 100) * 100;
        $('#h-c-t').textContent = 'Qué tanto aprovecha la turbina';
        $('#h-c-ley').textContent = '';
        $('#h-c-pie').textContent = 'Su mejor punto va antes del tope. Con poca apertura aprovecha mucho menos, y entre 30 y 50 % de carga, a veces hasta 70 %, las Francis vibran. La forma es de ejemplo; La Yesca midió 95.61 % ponderado.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Eficiencia de la turbina', xMin: 0, xMax: 100, yMin: 0, yMax: 100, ticksX: [0, 25, 50, 75, 100], ticksY: [0, 25, 50, 75, 100], etX: 'Apertura del distribuidor, %', etY: '%', f: fe, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} % · aprovecha ${num(fe(x))} de cada 100` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Apertura', 'Aprovecha, %'], [20, 40, 60, 80, 87, 100].map(a => [`${a} %`, num(fe(a))]));
    } else if (m === 'dia') {
        const D = L.D;
        const fP = h => D.P(h);
        $('#h-b-t').textContent = `Lo que da, hora por hora, con ${num(pide.aguaDia)} m³/s`;
        $('#h-b-ley').textContent = '';
        $('#h-b-pie').textContent = `Del agua de hoy salen ${num(D.mwh)} MWh; ${num(D.punta * 100)} de cada 100 se dan entre las 18 y las 23 horas. El embalse baja apenas ${f2(D.bajaM)} m, y la lluvia lo repone en su temporada.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Lo que da hora por hora', xMin: 0, xMax: 24, yMin: 0, yMax: 800, ticksX: [0, 6, 12, 18, 24], ticksY: [0, 200, 400, 600, 800], etX: 'Hora', etY: 'MW', f: fP, fx: x => num(x), fy: y => num(y), punta: x => `${horaTexto(x)} · ${num(fP(x))} MW` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Hora', 'MW', 'Unidades'], [12, 16, 18, 19, 20, 21, 22, 23].map(h => { const e = enHora(h + 0.5, { agua: pide.aguaDia, z: DEF.nivel }); return [`${h}:30`, num(e.P), num(e.n)]; }));
        const fD = h => demandaEn(h) * 100;
        $('#h-c-t').textContent = 'La demanda del sistema';
        $('#h-c-ley').textContent = '';
        $('#h-c-pie').textContent = 'En porcentaje de su punto más alto. La forma es de ejemplo. Las centrales que no pueden moverse rápido cubren lo de abajo; la hidroeléctrica toma la punta, y la AIE la llama clave para la flexibilidad del sistema mexicano.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'La demanda del sistema', xMin: 0, xMax: 24, yMin: 60, yMax: 100, ticksX: [0, 6, 12, 18, 24], ticksY: [60, 70, 80, 90, 100], etX: 'Hora', etY: '%', f: fD, fx: x => num(x), fy: y => num(y), punta: x => `${horaTexto(x)} · ${num(fD(x))} %` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Hora', 'Demanda, %'], [0, 4, 8, 12, 16, 20, 22].map(h => [`${h}:00`, num(fD(h))]));
    } else if (m === 'ano') {
        const fxMes = x => MES_CORTO[clamp(Math.round(x), 1, 12) - 1];
        const lineas = ORDEN_TIPOS.map((t, i) => ({ clase: ['h-s-actual', 'h-s-sin', 'h-s-max'][i], nombre: TIPOS[t].nombre, f: x => nivelEnMes(x, t) }));
        $('#h-b-t').textContent = 'El nivel del embalse en un año';
        $('#h-b-ley').innerHTML = leyenda(lineas);
        $('#h-b-pie').textContent = `Baja de noviembre a junio y sube de julio a octubre, cuando llegan cerca de 75 de cada 100 litros. El NAMO es ${NIVEL.NAMO} m y el NAMINO, ${NIVEL.NAMINO} m. La forma de cada mes y la regla son de ejemplo.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Nivel del embalse', xMin: 1, xMax: 12, yMin: 510, yMax: 580, ticksX: [1, 3, 5, 7, 9, 11], ticksY: [520, 540, 560, 580], etX: 'Mes', etY: 'm', lineas, fx: fxMes, fy: y => num(y), punta: x => `${fxMes(x)} · ${lineas.map(l => `${l.nombre}: ${num(l.f(x))} m`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Mes', 'Normal, m', 'Seco, m', 'Lluvioso, m'], MES_CORTO.map((n, i) => [n, num(nivelEnMes(i + 1, 'normal')), num(nivelEnMes(i + 1, 'seco')), num(nivelEnMes(i + 1, 'lluvioso'))]));
        const A = anual({ tipo: pide.tipo });
        const lE = ORDEN_TIPOS.map((t, i) => { const Ax = anual({ tipo: t }); return { clase: ['h-s-actual', 'h-s-sin', 'h-s-max'][i], nombre: TIPOS[t].nombre, f: x => { const k = clamp(x, 1, 12); const j = Math.min(10, Math.floor(k) - 1); return Ax.meses[j].gwh + (Ax.meses[j + 1].gwh - Ax.meses[j].gwh) * (k - (j + 1)); } }; });
        $('#h-c-t').textContent = 'Energía de cada mes';
        $('#h-c-ley').innerHTML = leyenda(lE);
        $('#h-c-pie').textContent = `${TIPOS[pide.tipo].nombre}: ${num(A.gwh)} GWh, con el ${num(A.factor * 100)} % de su capacidad. Lo publicado para La Yesca es de ${num(CENTRAL.gwh[0])} a ${num(CENTRAL.gwh[1])} GWh en un año medio.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Energía por mes', xMin: 1, xMax: 12, yMin: 0, yMax: 320, ticksX: [1, 3, 5, 7, 9, 11], ticksY: [0, 100, 200, 300], etX: 'Mes', etY: 'GWh', lineas: lE, fx: fxMes, fy: y => num(y), punta: x => `${fxMes(x)} · ${lE.map(l => `${l.nombre}: ${num(l.f(x))}`).join(' · ')} GWh` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Mes', 'Entra', 'Turbinas', 'Vierte', 'GWh'], A.meses.map((e, i) => [MES_CORTO[i], num(e.entra), num(e.turbina), num(e.vierte), num(e.gwh)]));
    } else {
        const R = L.R;
        const fH = t => (enSerie(R.h, t) / R.h0 - 1) * 100;
        const fN = t => enSerie(R.n, t) * UNIDAD.rpm;
        const yMaxH = Math.max(50, Math.ceil(R.sobrePresion * 10) * 10 + 10);
        const lH = [{ clase: 'h-s-actual', nombre: 'Presión de más', f: fH }, { clase: 'h-s-max', nombre: 'Lo permitido, hasta', f: () => UNIDAD.presionPermitida[1] * 100 }];
        $('#h-b-t').textContent = `Presión al pie de la tubería, si cierra en ${num(R.tc, R.tc < 10 ? 1 : 0)} s`;
        $('#h-b-ley').innerHTML = leyenda(lH);
        $('#h-b-pie').textContent = `Sube ${num(R.sobrePresion * 100)} %: ${num(R.metros)} m de agua de más. Si se cerrara de un solo golpe, la onda de presión daría ${num(GOLPE_M)} m (Joukowsky): la onda va y vuelve por la tubería en ${f2(VIAJE)} s.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Presión al pie de la tubería', xMin: 0, xMax: FIN_EVENTO, yMin: 0, yMax: yMaxH, ticksX: [0, 5, 10, 15, 20, 25], ticksY: [0, Math.round(yMaxH / 2), yMaxH], etX: 'Segundos desde que cae la línea', etY: '% de más', lineas: lH, fx: x => num(x), fy: y => num(y), punta: x => `${f1(x)} s · +${num(Math.max(0, fH(x)))} %` });
        const lN = [{ clase: 'h-s-actual', nombre: 'Velocidad', f: fN }, { clase: 'h-s-max', nombre: 'Lo permitido', f: () => UNIDAD.rpm * (1 + UNIDAD.velPermitida) }];
        $('#h-c-t').textContent = 'Velocidad de la turbina';
        $('#h-c-ley').innerHTML = leyenda(lN);
        $('#h-c-pie').textContent = `Llega a ${num(R.nMax * UNIDAD.rpm)} vueltas por minuto, ${num(R.sobreVelocidad * 100)} % de más. Mientras el agua siga entrando y nadie use esa energía, se acelera. Sin cerrar, se desbocaría cerca de ${num(UNIDAD.Kr * UNIDAD.rpm)} vueltas.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Velocidad de la turbina', xMin: 0, xMax: FIN_EVENTO, yMin: 100, yMax: 300, ticksX: [0, 5, 10, 15, 20, 25], ticksY: [100, 150, 200, 250, 300], etX: 'Segundos desde que cae la línea', etY: 'vueltas por minuto', lineas: lN, fx: x => num(x), fy: y => num(y), punta: x => `${f1(x)} s · ${num(fN(x))} vueltas por minuto` });
        const filas = [1, 2, 3, 5, 7, 9, 12, 15, 20, 30].map(tc => { const r = rechazo({ tc, z: DEF.nivel }); return [`${tc} s`, `+${num(r.sobrePresion * 100)} %`, `+${num(r.sobreVelocidad * 100)} %`]; });
        $('#h-tabla-b').innerHTML = tablaHTML(['Cierre', 'Presión', 'Velocidad'], filas);
        $('#h-tabla-c').innerHTML = tablaHTML(['Cierre', 'Presión', 'Velocidad'], filas);
    }
}
function pintarBarras(L, pag) {
    const { $, pide } = pag;
    let filas;
    if (pide.modo === 'agua') {
        filas = [NIVEL.NAMINO, 540, ZD, NIVEL.NAMO].map(z => { const P = potenciaMax(z); return { t: `Embalse en ${num(z)} m`, v: P / UNIDAD.Pmax, activa: Math.abs(z - L.z) < 12, escala: 1 }; });
        $('#h-d-t').textContent = 'Lo más que da una unidad, de cada 100 de su tamaño';
        $('#h-d-pie').textContent = `Con el embalse a ${num(L.z)} m: ${num(potenciaMax(L.z))} MW por unidad. Un m³ deja ${f2(L.kwh)} kWh.`;
    } else if (pide.modo === 'dia') {
        const D = L.D;
        filas = [{ t: 'De las 18 a las 23 horas', v: D.punta, activa: true }, { t: 'El resto del día', v: 1 - D.punta }];
        $('#h-d-t').textContent = 'Cuándo da su energía, de cada 100';
        $('#h-d-pie').textContent = `A tope usaría esta agua en ${f1(D.horasTope)} horas. Factor de planta de diseño: ${num(CENTRAL.factor * 100)} %.`;
    } else if (pide.modo === 'ano') {
        filas = ORDEN_TIPOS.map(t => ({ t: TIPOS[t].nombre, v: anual({ tipo: t }).factor, activa: t === pide.tipo, escala: 0.4 }));
        filas.push({ t: 'Promedio de México, 2024', v: 0.21, escala: 0.4 });
        $('#h-d-t').textContent = 'Factor de planta: las horas que trabaja, de cada 100';
        $('#h-d-pie').textContent = 'El de México viene del IMCO; los otros, de este modelo. La Yesca se diseñó para 19 %.';
    } else {
        const R = L.R;
        filas = [{ t: 'Presión, contra lo permitido', v: R.sobrePresion / UNIDAD.presionPermitida[1], escala: 1.6, activa: true }, { t: 'Velocidad, contra lo permitido', v: R.sobreVelocidad / UNIDAD.velPermitida, escala: 1.6, activa: true }];
        $('#h-d-t').textContent = 'Lo que se usa de lo permitido, de cada 100';
        $('#h-d-pie').textContent = `Lo permitido: de ${num(UNIDAD.presionPermitida[0] * 100)} a ${num(UNIDAD.presionPermitida[1] * 100)} % de presión y ${num(UNIDAD.velPermitida * 100)} % de velocidad (tesina UNAM). Si una barra pasa de 100, ese tiempo no sirve.`;
    }
    $('#h-barras').innerHTML = barrasHTML(filas);
}
function alPintarFijas({ $ }) {
    $('#h-pesa').innerHTML = barrasHTML([{ t: 'Capacidad instalada, 2025', v: 0.14, activa: true }, { t: 'Generación neta, 2022', v: 0.1044, d: 1 }, { t: 'Horas que trabajan al año', v: 0.21 }]);
    const U = unidad(1, ZD);
    const A = anual();
    const R = rechazo({ tc: UNIDAD.cierre, z: ZD });
    const Hn = NIVEL.NAMO - NIVEL.abajo - UNIDAD.perdida * (unidad(1, NIVEL.NAMO).Q / UNIDAD.Qd) ** 2;
    const Qn = UNIDAD.Qd * Math.sqrt(Hn / UNIDAD.Hd);
    const Tur = (1000 * 9.81 * Qn * Hn * etaTurbina(1)) / 1e6;
    $('#h-curva').innerHTML = tablaHTML(['Qué', 'Modelo', 'Publicado'], [
        ['Una unidad, con 249 m³/s y 163 m', `${num(U.P)} MW`, '375 a 380 MW'],
        ['Turbina con la caída máxima', `${num(Tur)} MW`, '434.6 MW'],
        ['Energía de un año medio', `${num(A.gwh)} GWh`, '1,210 a 1,228 GWh'],
        ['Horas que trabaja', `${num(A.factor * 100)} %`, '19 %'],
        ['Área del embalse lleno', `${num(areaKm2(NIVEL.NAME), 1)} km²`, '33.5 km²'],
        ['Presión de más, cerrando en 9 s', `${num(R.sobrePresion * 100)} %`, '10 a 18 %'],
        ['Velocidad de más, cerrando en 9 s', `${num(R.sobreVelocidad * 100)} %`, '34 a 41 %'],
    ]);
    $('#h-turbinas').innerHTML = `<thead><tr><th scope="col">Turbina</th><th scope="col">Caída</th><th scope="col">En México</th></tr></thead><tbody>${[
        ['Kaplan', 'Hélice con paletas que giran', '2 a 70 m', 'Para mucha agua y poca caída'],
        ['Francis', 'El agua entra por fuera y sale al centro', '10 a 300 m', `La Yesca, ${num(UNIDAD.Hd)} m`],
        ['Pelton', 'Chorros contra unas cucharas', '80 a 1,600 m', 'Zimapán, 603 m'],
    ].map(([n, d, a, m]) => `<tr><td><b>${n}</b><small>${d}</small></td><td>${a}</td><td>${m}</td></tr>`).join('')}</tbody>`;
    $('#h-mexico').innerHTML = `<thead><tr><th scope="col">Central</th><th scope="col">MW</th><th scope="col">Unidades</th></tr></thead><tbody>${[
        ['Chicoasén', 'Chiapas, río Grijalva', '2,400', '8 de 300 MW'],
        ['Malpaso', 'Entre las que se modernizan', '1,080', ''],
        ['La Yesca', 'Jalisco y Nayarit, río Santiago', '750', '2 de 375 MW'],
        ['Zimapán', 'Hidalgo y Querétaro', '304', '2 Pelton'],
    ].map(([n, d, a, m]) => `<tr><td><b>${n}</b><small>${d}</small></td><td>${a}</td><td>${m}</td></tr>`).join('')}</tbody>`;
    $('#h-regla').innerHTML = tablaHTML(['Para qué', 'Dónde lo dice'], [
        ['Generar electricidad, desde 0.7 MW', 'Ley del Sector Eléctrico, art. 19'],
        ['Usar el agua: la CFE y los demás', 'Ley de Aguas Nacionales, arts. 78 y 80'],
        ['Impacto social y consulta previa', 'Ley del Sector Eléctrico, arts. 133 a 139'],
    ]);
}
function alActualizar(L, pag) {
    const { pide, ponerCifra, ponerLecturas, nivel, graficas } = pag;
    pintarBarras(L, pag);
    ponerCifra('aT', { agua: 'A dónde va la energía del agua', dia: 'La misma agua, repartida en el día', ano: 'El embalse, este mes', cierre: 'Lo que pasa al cerrar' }[pide.modo]);
    if (pide.modo === 'agua') {
        const U = L.u1;
        const aviso = U.tope ? `El generador ya está a tope: el regulador no deja abrir más de ${num(U.a * 100)} %.` : U.a < 0.11 ? 'Tan cerrado, el agua apenas alcanza para mover la máquina.' : U.aspera ? 'A esta carga el agua sale girando y la máquina vibra: se evita trabajar aquí.' : L.z < 530 ? 'Con tan poca caída, aun con todo abierto no llega a su tamaño.' : null;
        ponerLecturas([['A la red', num(L.P), 'MW, las dos unidades'], ['Agua', num(L.Q), 'm³/s'], ['Caída neta', f1(U.Hn), 'm'], ['La turbina aprovecha', num(U.eta * 100), 'de cada 100'], ['Un m³ deja', f2(L.kwh), 'kWh'], ['Embalse', num(L.z), 'm sobre el mar']], aviso);
        ponerCifra('hud', `${num(L.P)} MW`);
        ponerCifra('hud2', `${num(L.Q)} m³/s que caen ${num(U.Hn)} m`);
        graficas.b?.marcar(U.a * 100, U.P);
        graficas.c?.marcar(U.a * 100, U.eta * 100);
        nivel(1, 'Potencia', clamp01(L.P / CENTRAL.mw), `${num((L.P / CENTRAL.mw) * 100)} %`);
        nivel(2, 'Embalse útil', clamp01(L.util / VOL_UTIL()), `${num((L.util / VOL_UTIL()) * 100)} %`);
    } else if (pide.modo === 'dia') {
        const H = L.H;
        const D = L.D;
        const aviso = H.n === 0 ? 'A esta hora, las unidades descansan: el agua se guarda.' : H.n === 2 ? 'Las dos unidades trabajan: son las horas de más demanda.' : null;
        ponerLecturas([['A la red', num(L.P), 'MW'], ['Hora', horaTexto(pide.hora), 'del día'], ['Unidades', num(H.n), 'trabajando'], ['Agua', num(L.Q), 'm³/s en este momento'], ['A tope, alcanza para', f1(D.horasTope), 'horas'], ['El embalse baja', f2(D.bajaM), 'm hoy']], aviso);
        ponerCifra('hud', `${num(L.P)} MW`);
        ponerCifra('hud2', `a las ${horaTexto(pide.hora)}, con ${num(H.n)} ${H.n === 1 ? 'unidad' : 'unidades'}`);
        graficas.b?.marcar(pide.hora, D.P(pide.hora));
        graficas.c?.marcar(pide.hora, demandaEn(pide.hora) * 100);
        nivel(1, 'Potencia', clamp01(L.P / D.Ptot), `${num((L.P / D.Ptot) * 100)} %`);
        nivel(2, 'Demanda', clamp01((demandaEn(pide.hora) - 0.6) / 0.4), `${num(demandaEn(pide.hora) * 100)} %`);
    } else if (pide.modo === 'ano') {
        const A = L.anual;
        const M = L.M;
        const aviso = M.vierte > 1 ? `El embalse está lleno: salen ${num(M.vierte)} millones de m³ por el vertedor, sin generar.` : A.zMax < NIVEL.NAMO - 5 ? 'Este año no se llena: habrá menos agua y menos caída hasta las próximas lluvias.' : null;
        ponerLecturas([['Nivel', num(L.z), 'm sobre el mar'], ['Entra', num(M.entra), 'millones de m³'], ['Por las turbinas', num(M.turbina), 'millones de m³'], ['Este mes', num(M.gwh), 'GWh'], ['Al año', num(A.gwh), 'GWh'], ['Factor de planta', num(A.factor * 100), '%']], aviso);
        ponerCifra('hud', `${num(L.z)} m`);
        ponerCifra('hud2', `${textoMes(pide.mes).toLowerCase()}, ${TIPOS[pide.tipo].nombre.toLowerCase()}`);
        graficas.b?.marcar(pide.mes, nivelEnMes(pide.mes, pide.tipo));
        nivel(1, 'Embalse útil', clamp01(L.util / VOL_UTIL()), `${num((L.util / VOL_UTIL()) * 100)} %`);
        nivel(2, 'Año', clamp01(A.factor / 0.4), `${num(A.factor * 100)} %`);
    } else {
        const R = L.R;
        const E = L.E;
        const aviso = R.sobrePresion > UNIDAD.presionPermitida[1] ? 'Tan rápido, el golpe de presión pasa de lo permitido: se arriesga la tubería.' : R.sobreVelocidad > UNIDAD.velPermitida ? 'Tan lento, la máquina se acelera más de lo permitido.' : null;
        ponerLecturas([[E ? 'Presión de más' : 'Presión de más, máximo', `+${num(E ? Math.max(0, E.h / R.h0 - 1) * 100 : R.sobrePresion * 100)}`, '%'], [E ? 'Vueltas' : 'Vueltas, máximo', num(E ? E.n * UNIDAD.rpm : R.nMax * UNIDAD.rpm), 'por minuto'], ['Distribuidor', num(E ? E.y * 100 : 100), '% abierto'], ['Agua', num(L.Q), 'm³/s'], ['A la red', num(L.P), 'MW'], ['Tiempo', E ? f1(E.t) : '0', 's desde la falla']], aviso);
        ponerCifra('hud', E ? `${num(E.n * UNIDAD.rpm)} vueltas` : `${num(L.P)} MW`);
        ponerCifra('hud2', E ? `+${num(Math.max(0, E.h / R.h0 - 1) * 100)} % de presión` : `cierra en ${num(R.tc, R.tc < 10 ? 1 : 0)} s si falla la línea`);
        if (E) {
            graficas.b?.marcar(E.t, Math.max(0, E.h / R.h0 - 1) * 100);
            graficas.c?.marcar(E.t, E.n * UNIDAD.rpm);
        }
        nivel(1, 'Presión', clamp01(R.sobrePresion / UNIDAD.presionPermitida[1]), `${num((R.sobrePresion / UNIDAD.presionPermitida[1]) * 100)} %`);
        nivel(2, 'Velocidad', clamp01(R.sobreVelocidad / UNIDAD.velPermitida), `${num((R.sobreVelocidad / UNIDAD.velPermitida) * 100)} %`);
    }
}

// ------------------------------------------------------------------ la central
let planta = estadoPlanta({});

crearPagina({
    figura: FIGURA,
    fichas: FICHAS,
    vistas: VISTAS,
    modos: MODOS,
    botones: BOTONES,
    acciones: ACCIONES,
    modo0: 'agua',
    pide: { a: DEF.a, nivel: DEF.nivel, hora: DEF.hora, aguaDia: DEF.aguaDia, mes: DEF.mes, tipo: DEF.tipo, tc: DEF.tc, pideCaida: false },
    general: { Lx: 16.8, Lz: 5.8, alto: 8.6, mira: [0, 1.45, 0.4], az: 24, el: 24, azVertical: 20, elVertical: 26 },
    etiquetas: { lienzo: 'Central hidroeléctrica en 3D: arrastra para girarla, toca un punto para conocerlo', modos: 'Qué ver en la central', puntos: 'Puntos clave de la central' },
    textoFinal: 'Toca cualquier punto para volver a verlo. Baja el embalse en «Agua», mira la tarde en «Un día», prueba un año seco en «Un año», o tira la línea en «Cierre». Y gira la figura: por detrás se ve la cortina por dentro.',
    colores: { fondoTinta: '#3a3b40', elec: FLUIDOS.ca.color, agua: FLUIDOS.agua.color, frio: '#8d939b', guindaSuave: '#d89aae', panel: '#4b6fb5', claro: '#ffffff' },
    crearDiagrama,
    secciones,
    escena: (renderer, scene, { movil, oscuro }) => {
        const M = materiales(P_PLANTA);
        const est = escenario(renderer, scene, M, { movil, oscuro });
        return { planta: construir(M, P_PLANTA, { movil, oscuro }), est };
    },
    alCambiarModo: (p, m) => {
        p.corre = false;
        planta = { ...planta, ev: null, regreso: 0 };
        if (m === 'dia') { p.hora = DEF.hora; p.aguaDia = DEF.aguaDia; }
        if (m === 'ano') { p.mes = DEF.mes; p.tipo = 'normal'; }
        if (m === 'cierre') p.tc = DEF.tc;
        if (m === 'agua') { p.a = DEF.a; p.nivel = DEF.nivel; }
    },
    alCuadro: ({ dt, pide }) => {
        if (pide.pideCaida) { planta = { ...planta, ev: 0 }; pide.pideCaida = false; }
        const m = { lentitud: 1, tc: pide.tc };
        if (pide.modo === 'agua') { m.a1 = pide.a / 100; m.a2 = pide.a / 100; m.z = pide.nivel; m.vierte = 0; }
        else if (pide.modo === 'dia') { const H = enHora(pide.hora, { agua: pide.aguaDia, z: DEF.nivel }); m.a1 = H.n >= 1 ? H.a : 0; m.a2 = H.n >= 2 ? H.a : 0; m.z = DEF.nivel; m.vierte = 0; }
        else if (pide.modo === 'ano') { const k = clamp(Math.round(pide.mes), 1, 12); const M = anual({ tipo: pide.tipo }).meses[k - 1]; m.a1 = M.turbina > 1 ? ETA.apertura : 0; m.a2 = m.a1; m.z = nivelEnMes(pide.mes, pide.tipo); m.vierte = (M.vierte * 1e6) / (30 * 86400); }
        else { m.a1 = 1; m.a2 = 1; m.z = DEF.nivel; m.vierte = 0; }
        planta = pasoPlanta(planta, m, dt);
    },
    poseDe: ({ pide, ve, encendido, t, dt, camara }) => pose({ modo: pide.modo, planta, a: pide.a, nivel: pide.nivel, hora: pide.hora, aguaDia: pide.aguaDia, mes: pide.mes, tipo: pide.tipo, tc: pide.tc, noche: ve.noche, adentro: ve.adentro, desarme: ve.desarme, encendido, t, dt, camara }),
    firma: p => [p.modo, p.modo === 'dia' ? Math.round(p.aguaDia) : 0, p.modo === 'ano' ? p.tipo : 0, p.modo === 'cierre' ? p.tc.toFixed(1) : 0],
    alPintarFijas,
    alPintarGraficas,
    alActualizar,
    prueba: p => ({ a1: +planta.a1.toFixed(3), a2: +planta.a2.toFixed(3), z: +planta.z.toFixed(1), n: +planta.n.toFixed(3), ev: planta.ev, vierte: +planta.vierte.toFixed(1), gal: +planta.gal.toFixed(2), tipo: p.tipo, mes: p.mes, hora: p.hora, tc: p.tc }),
});
