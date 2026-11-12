// «Central fotovoltaica», en 3D y con el formato Búho de «¿Cómo funciona?». Una central de ejemplo con el sol y el clima de Puerto Peñasco, Sonora,
// y el tamaño que anuncia la CFE para esa central: filas de módulos sobre seguidores, un módulo y una celda de muestra, cajas de conexión, inversor,
// transformador, clima y limpieza, SAEE, subestación, RNT y RGD. Cinco formas de verla: un día, calor y polvo, seguidor o mesa fija, inversor y SAEE.
// Puntos clave con su ficha, ver por dentro, desarmar, día y noche, y gráficas que leen las mismas cifras que mueven la central (modelo.js). Se arma con:
// node scripts/build-conceptos-3d.mjs fotovoltaica
//
// Lo que se repite entre las plantas con física está en conceptos-3d/planta-comun/.
import { clamp, clamp01, num } from '../planta-comun/ayudas.js';
import { barrasHTML, leyenda, pintarGrafica, seccionBarras, seccionColores, seccionDiagrama, seccionFuentes, seccionGrafica, seccionTabla, tablaHTML } from '../planta-comun/graficas.js';
import { crearPagina } from '../planta-comun/pagina.js';
import { CENTRAL, CLIMA, DEF, FLUIDOS, INVERSOR, LIMITES, MESES, MES_CORTO, MODULO, PARTES as PARTES_M, POLVO_DEF, POR_CADENA, PVGIS, SAE_DEF, anual, central, curvaModulo, dia, diaConSAE, enHora, estadoPlanta, giroSeguidor, pasoPlanta, pose, potenciaModulo, solEn, tCelda } from './modelo.js';
import { P_PLANTA, construir, escenario, materiales } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';

const FIGURA = 'fotovoltaica';
const BASE = central();
const ANO = anual();
const ANO_FIJA = anual({ seguidor: false });
const GANA = ANO.gwh / ANO_FIJA.gwh - 1;
const MW_400 = (BASE.red * 1e3) / (Math.sqrt(3) * 400);

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'sol', nombre: 'Sol', modo: 'dia', accion: 'noche', eq: `${num(CLIMA.ghiAnual, 1)} kWh por m² al día, en promedio`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.600 5.600l1.400 1.400M17 17l1.400 1.400M5.600 18.400 7 17M17 7l1.400-1.400"/>',
        texto: `Aquí el sol es el de Puerto Peñasco, Sonora: se mueve con la hora y el mes, y de él salen las sombras y el giro de las filas. Un mediodía despejado de junio llegan cerca de ${num(BASE.luz.total, 0)} W a cada metro cuadrado de módulo. Las bolitas marcan su camino, media hora cada una.` },
    { parte: 'celda', nombre: 'Celda', modo: 'calor', abrir: true, accion: 'desarme', eq: `Cerca de ${num(MODULO.vmp / MODULO.enSerie, 2)} V por celda`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="4" y="4" width="16" height="16" rx="1.500"/><path d="M4 9h16M4 15h16M9 4v16M15 4v16"/>',
        texto: 'Aquí nace la corriente. Son dos capas de silicio: una con electrones de sobra y otra con huecos. Donde se tocan se forma una unión que empuja a los electrones en un solo sentido. La luz los suelta, salen por los hilos de plata, dan la vuelta por el cable y encienden el foco. Esta de muestra está muy agrandada.' },
    { parte: 'modulo', nombre: 'Módulo', modo: 'calor', abrir: true, accion: 'desarme', eq: `${num(MODULO.pmp)} W · ${num(MODULO.ef * 100, 1)} % · ${num(MODULO.largo, 2)} × ${num(MODULO.ancho, 2)} m`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="3" y="6" width="18" height="12" rx="1"/><path d="M3 10h18M3 14h18M9 6v12M15 6v12"/>',
        texto: `Es lo que la gente llama panel. Aquí se ven sus capas: vidrio, encapsulante, ${num(MODULO.celdas)} medias celdas, otro encapsulante y respaldo, con un marco de aluminio. El de esta ficha técnica convierte en electricidad cerca de 21 de cada 100 de la luz, y pierde 0.35 % por cada grado que se calienta.` },
    { parte: 'cadena', nombre: 'Cadena', modo: 'dia', abrir: true, accion: 'desarme', eq: `${POR_CADENA} módulos en serie: hasta ${num(MODULO.vmp * POR_CADENA)} V`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="2" y="9" width="6" height="6"/><rect x="9" y="9" width="6" height="6"/><rect x="16" y="9" width="6" height="6"/><path d="M8 12h1M15 12h1"/>',
        texto: `Un módulo da unos ${num(MODULO.vmp)} V. Conectados uno tras otro suman voltaje: eso es una cadena. Aquí caben ${POR_CADENA}, para no pasar de ${num(MODULO.vSistema)} V ni con frío. Los cables de debajo de los módulos llevan la corriente directa: son los puntos rosas. Con ${num(CENTRAL.mwMayo)} MW harían falta cerca de ${num(BASE.modulos / 1e6, 1)} millones de módulos; la figura solo dibuja unos cuantos.` },
    { parte: 'seguidor', nombre: 'Seguidor', modo: 'seguidor', accion: 'fija', eq: `${num(GANA * 100)} % más al año que con mesa fija`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 14 20 8"/><path d="M12 11v9"/><circle cx="12" cy="11" r="1.800"/><path d="M8 20h8"/>',
        texto: 'Las filas corren de norte a sur y giran de este a oeste para mirar al sol. Un motor por fila mueve ese engrane guinda, en el eje. Al amanecer y al atardecer regresan un poco, porque si no se harían sombra unas a otras. De noche se quedan planas. Lo dirige la cajita blanca del poste.' },
    { parte: 'caja', nombre: 'Caja de conexión', modo: 'dia', abrir: true, accion: 'desarme', eq: `Corriente de cada cadena: hasta ${num(MODULO.imp, 1)} A`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="5" y="4" width="14" height="16" rx="1.500"/><path d="M9 8v4M12 8v4M15 8v4M8 16h8"/>',
        texto: 'Junta las cadenas de varias filas en un solo cable grueso. Adentro lleva fusibles, uno por cadena, que cortan si hay una falla. De aquí, los cables corren por una zanja hasta el inversor. Son de corriente directa: se apagan al irse el sol.' },
    { parte: 'inversor', nombre: 'Inversor', modo: 'inversor', abrir: true, accion: 'desarme', eq: `Hasta ${num(INVERSOR.rMax * 100)} de cada 100 · ${num(INVERSOR.mw, 1)} MW cada uno, en esta ficha`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M6 10h4M6 13h4"/><path d="M13 12c1-3 2-3 3 0s2 3 3 0"/>',
        texto: 'Convierte la corriente directa en alterna, la que usa la red. Sus transistores se abren y se cierran muy rápido, y su filtro de cobre deja la onda limpia, a 60 ciclos por segundo. También busca el voltaje en que los módulos dan más. Si llega más de lo que cabe, lo recorta: esa luz roja avisa.' },
    { parte: 'trafoMT', nombre: 'Transformador', modo: 'dia', abrir: true, accion: 'desarme', eq: 'De 660 V a 34.5 kV', recorrido: { noche: false, adentro: false },
        icono: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
        texto: 'El inversor entrega a bajo voltaje; en esta ficha técnica, a 660 V. Este transformador lo sube a media tensión, 34.5 kV en Villanueva, para llevar la electricidad a la subestación con menos pérdidas. Un cable grueso lleva mucha corriente; con más voltaje, hace falta menos.' },
    { parte: 'clima', nombre: 'Clima y limpieza', modo: 'calor', accion: 'limpiar', eq: `Polvo: ${num(POLVO_DEF, 1)} % de ejemplo`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 21V9"/><path d="M7 9h10"/><circle cx="17" cy="7" r="2"/><path d="M4 7h3M5 4l2 2"/>',
        texto: 'Esta estación mide lo que llega: la cúpula de vidrio es un piranómetro, que mide la luz, y al lado van viento y temperatura. Así se compara lo que da la central con lo que debería dar. El polvo tapa luz: en el mundo quita por lo menos 3 a 4 % al año. El robot guinda recorre la fila y limpia en seco.' },
    { parte: 'sae', nombre: 'SAEE', modo: 'sae', abrir: true, accion: 'nube', eq: `${num(CENTRAL.mwCA * SAE_DEF.pct / 100)} MW por ${SAE_DEF.horas} horas, de ejemplo · regresa ${num(SAE_DEF.ida * 100)} de cada 100`, recorrido: { adentro: false },
        icono: '<rect x="4" y="7" width="14" height="10" rx="1.500"/><path d="M20 10v4M8 10v4M11 10v4M14 10v4"/>',
        texto: 'SAEE quiere decir Sistema de Almacenamiento de Energía Eléctrica. Estas baterías guardan parte del mediodía y la entregan al caer el sol. Si pasa una nube, tapan el hueco. Puerto Peñasco lleva de 190 a 246 MW, según la fuente. Hoy, el CENACE analiza cada central y decide si necesita SAEE y de qué tamaño.' },
    { parte: 'subestacion', nombre: 'Subestación', modo: 'dia', abrir: true, accion: 'desarme', eq: `${num(BASE.red)} MW: ${num(MW_400)} amperes a 400 kV`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 20h16"/><path d="M7 20V8l5-4 5 4v12"/><path d="M7 12h10"/>',
        texto: 'Junta lo que llega de todos los transformadores y lo sube a alta tensión; la subestación de Villanueva va de 34.5 a 400 kV. Con más voltaje, la misma potencia viaja con menos corriente y los cables se calientan menos. Sus interruptores y cuchillas aíslan la central si hay una falla.' },
    { parte: 'red', nombre: 'RNT y RGD', modo: 'dia', accion: 'noche', recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 3 6 21M12 3l6 18M8 9h8M7 14h10"/>',
        texto: 'La electricidad sale por la RNT, la Red Nacional de Transmisión, que la lleva lejos y a grandes usuarios. Las RGD, Redes Generales de Distribución, la reparten al público. El CENACE decide cuándo entra cada central. De noche estas casas siguen encendidas, pero con otras centrales: esta solo da con sol o con su SAEE.' },
];
const VISTAS = Object.fromEntries(PARTES_M.map(p => [p.id, p.vista]));

const textoHora = v => { const h = Math.floor(v % 24); const m = Math.floor(((v % 1) * 60) / 5) * 5; return `${h}:${String(m).padStart(2, '0')} h`; };
const textoMes = v => MESES[clamp(Math.round(v), 1, 12) - 1];
const textoT = v => `${num(v)} °C`;
const textoPct = v => `${num(v, 1)} %`;
const mandoHora = { nombre: 'Hora del sol', campo: 'hora', rango: LIMITES.hora, texto: textoHora, detiene: true };
const relojDia = { texto: 'el día', avanzar: (p, dt) => { p.hora = (p.hora + (dt * 24) / 42) % 24; return false; }, alSeguir: () => {} };
const MODOS = {
    dia: { nombre: 'Un día', corto: 'Día', resumen: 'Un día despejado en Puerto Peñasco. Mueve la hora y el mes: el sol, las sombras y el giro de las filas salen del mismo modelo. O deja pasar una nube.', aclara: 'De cada 100 de la luz que llega a los módulos, a dónde va. Casi toda se vuelve calor: los módulos no llegan a convertir ni la cuarta parte.', mando: mandoHora, mando2: { nombre: 'Mes', campo: 'mes', rango: LIMITES.mes, texto: textoMes, pinta: true }, reloj: relojDia },
    calor: { nombre: 'Calor y polvo', corto: 'Calor', resumen: 'Mediodía de junio. A más calor, menos voltaje y menos potencia. El polvo tapa la luz. Prueba con el aire de un día caliente o déjalo que se ensucie, y límpialo.', aclara: 'La luz suelta electrones, la unión los empuja hacia arriba y regresan por el cable. Con calor, la unión empuja con menos voltaje.', mando: { nombre: 'Temperatura del aire', campo: 'tAire', rango: LIMITES.tAire, texto: textoT, pinta: true }, mando2: { nombre: 'Polvo sobre los módulos', campo: 'polvo', rango: LIMITES.polvo, texto: textoPct, pinta: true } },
    seguidor: { nombre: 'Seguidor o mesa fija', corto: 'Seguidor', resumen: 'Con seguidor, las filas miran al sol toda la mañana y toda la tarde. Con mesa fija, se quedan quietas y miran al sur. Compara: la diferencia casi no se ve al mediodía, pero sí a las 8 de la mañana.', aclara: 'La fila vista de frente, de este a oeste. Mientras más de frente le lleguen los rayos, más luz por metro cuadrado.', mando: mandoHora, mando2: { nombre: 'Inclinación de la mesa fija', campo: 'inclinacion', rango: LIMITES.inclinacion, texto: v => `${num(v)}°`, pinta: true }, reloj: relojDia },
    inversor: { nombre: 'Inversor', corto: 'Inversor', resumen: 'Lo común es poner más módulos de los que caben en el inversor. Así da más en la mañana y en la tarde, a cambio de recortar un poco al mediodía. Súbele para ver hasta dónde conviene.', aclara: 'Un inversor toma corriente directa y entrega alterna, sin pasar de su tamaño. Lo que sobra se queda en los módulos: se recorta.', mando: { nombre: 'Módulos por inversor', campo: 'ilr', rango: LIMITES.ilr, texto: v => `${num(v, 2)} veces`, pinta: true }, mando2: mandoHora, reloj: relojDia },
    sae: { nombre: 'Con SAEE', corto: 'SAEE', resumen: 'El Sistema de Almacenamiento de Energía Eléctrica (SAEE) guarda parte de lo que sobra a mediodía y lo entrega cuando el sol ya no alcanza. Deja correr el día, o deja pasar una nube.', aclara: 'Qué tan lleno está el SAEE y hacia dónde va la energía en este momento.', mando: mandoHora, mando2: { nombre: 'Tamaño del SAEE', campo: 'sae', rango: LIMITES.sae, texto: v => `${num(v)} % de la central`, pinta: true }, reloj: relojDia },
};
const BOTONES = [
    { id: 'nube', visible: p => p.modo === 'dia' || p.modo === 'sae', pulsado: () => false, texto: () => 'Que pase una nube', alTocar: p => { p.pideNube = true; } },
    { id: 'limpiar', visible: p => p.modo === 'calor', pulsado: p => p.limpiando, texto: p => (p.limpiando ? 'Limpiando…' : 'Limpiar los módulos'), alTocar: p => { p.limpiando = true; } },
    { id: 'fija', visible: p => p.modo === 'seguidor', pulsado: p => !p.seguidor, texto: p => (p.seguidor ? 'Con seguidor' : 'Con mesa fija'), alTocar: p => { p.seguidor = !p.seguidor; } },
];
const ACCIONES = {
    fija: { texto: p => (p.seguidor ? 'Ver con mesa fija' : 'Ver con seguidor'), hacer: (p, pag) => { p.seguidor = !p.seguidor; pag.invalidar(); } },
    limpiar: { texto: () => 'Limpiar los módulos', hacer: p => { p.limpiando = true; } },
    nube: { texto: () => 'Que pase una nube', hacer: p => { p.pideNube = true; } },
};

// ------------------------------------------------------------------ el tablero
const secciones = () => `
    ${seccionDiagrama('A dónde va la luz')}
    ${seccionGrafica('b')}
    ${seccionGrafica('c')}
    ${seccionBarras()}
    ${seccionTabla('Seguidor y mesa fija', 'h-comparar', 'Los datos salen de este modelo, con el cielo promedio de cada mes. PVGIS es otro cálculo, de la Comisión Europea, en el mismo punto, con 14 % de pérdidas y sin recorte.', 'h-tabla-texto')}
    ${seccionTabla('Centrales fotovoltaicas de México', 'h-mexico', 'Las fuentes no dicen qué módulos, seguidores ni inversores usa Puerto Peñasco. Su 1,000 MW se lee en condiciones estándar (AFD); las etapas se cuentan en corriente alterna (Forbes), y las baterías cambian de una fuente a otra.')}
    ${seccionTabla('¿Cuánto SAEE pide México?', 'h-regla', 'Las Disposiciones vigentes no fijan un porcentaje. El «30 % por tres horas» viene de un anuncio de 2025 y de notas de prensa de 2026; no aparece en las Disposiciones ni en la Convocatoria que se leyeron.')}
    <section class="g-curva h-media">
        <div class="g-curva-cab"><b>Cuánto pesa en México</b></div>
        <div class="h-barras" id="h-pesa"></div>
        <p>Tiene más capacidad que energía: un MW fotovoltaico trabaja menos horas al año que uno de gas, porque solo da con sol.</p>
    </section>
    ${seccionColores(FLUIDOS, `Central de ejemplo con el sol de Puerto Peñasco y ${num(CENTRAL.mwMayo)} MW de módulos; no es el plano real ni un simulador. Solo se dibujan unas filas y unos cuantos módulos, y la celda de muestra está muy agrandada. El módulo y el inversor salen de fichas técnicas públicas, porque las fuentes no dicen cuáles usa esa central. Lo que no sale de una fuente (pérdidas en cables, curva del inversor, el tamaño del polvo y del SAEE y la manera de cargarlo) es de ejemplo, para ver la tendencia.`)}
    ${seccionFuentes(FUENTES, [
        { para: 'Permiso de generación, autoconsumo, Energías Limpias, quién decide el despacho, RNT y RGD', titulo: 'Ley del Sector Eléctrico, arts. 3, 19, 30, 32, 36 a 40, 49, 82 a 85, 114 y 117', nota: 'Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio' },
        { para: 'Autoconsumo, respaldo propio y SAEE', titulo: 'Reglamento de la Ley del Sector Eléctrico, arts. 58, 59 y 192 a 195', nota: 'Diario Oficial de la Federación, 3 de octubre de 2025. Está en el acervo de este sitio' },
    ])}`;

const f1 = x => num(x, 1);
const HORAS = [0, 6, 12, 18, 24];
const TICKS_MW = [0, 250, 500, 750, 1000];
const mesRedondo = p => clamp(Math.round(p.mes), 1, 12);
const curvaDia = (filas, campo) => x => enHora(filas, x, campo);
function alPintarGraficas(L, pag) {
    const { $, pide, graficas } = pag;
    const m = pide.modo;
    const mes = mesRedondo(pide);
    graficas.b = null;
    graficas.c = null;
    const porMes = (A, B) => x => { const k = clamp(x, 1, 12); const i = Math.min(10, Math.floor(k) - 1); return A.meses[i][B] + (A.meses[i + 1][B] - A.meses[i][B]) * (k - (i + 1)); };
    const ticksMes = [1, 3, 5, 7, 9, 11];
    const fxMes = x => MES_CORTO[clamp(Math.round(x), 1, 12) - 1];
    if (m === 'dia') {
        const D = dia({ mes, polvo: pide.polvo });
        const lineas = [
            { clase: 'h-s-sin', nombre: 'Corriente directa de los módulos', f: curvaDia(D.filas, 'dc') },
            { clase: 'h-s-actual', nombre: 'A la red', f: curvaDia(D.filas, 'red') },
        ];
        $('#h-b-t').textContent = `Un día de ${MESES[mes - 1].toLowerCase()}, despejado`;
        $('#h-b-ley').innerHTML = leyenda(lineas);
        $('#h-b-pie').textContent = `Con seguidor, la curva sube rápido y se queda casi plana. ${D.recorte > 1 ? `Da ${num(D.mwh / 1000, 1)} GWh y recorta ${num(D.recorte / 1000, 2)} GWh al mediodía.` : `Da ${num(D.mwh / 1000, 1)} GWh en el día.`}`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Potencia en el día', xMin: 0, xMax: 24, yMin: 0, yMax: 1000, ticksX: HORAS, ticksY: TICKS_MW, etX: 'Hora del sol', etY: 'MW', lineas, fx: x => `${num(x)} h`, fy: y => num(y), punta: x => `${textoHora(x)} · directa ${num(lineas[0].f(x))} · a la red ${num(lineas[1].f(x))} MW` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Hora', 'Luz, W/m²', 'Celda', 'A la red, MW'], [6, 8, 10, 12, 14, 16, 18].map(h => [`${h} h`, num(enHora(D.filas, h, 'luz')), `${num(enHora(D.filas, h, 'tc'))} °C`, num(enHora(D.filas, h, 'red'))]));
        const A = anual({ polvo: pide.polvo });
        const lm = [{ clase: 'h-s-actual', nombre: 'A la red', f: porMes(A, 'gwh') }];
        $('#h-c-t').textContent = 'Energía de cada mes';
        $('#h-c-ley').innerHTML = '';
        $('#h-c-pie').textContent = `Con el cielo promedio de cada mes (NASA POWER). Al año, ${num(A.gwh)} GWh: un factor de planta de ${num(A.factorCA * 100)} %. Julio y agosto traen más nubes; diciembre, menos horas de sol.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Energía de cada mes', xMin: 1, xMax: 12, yMin: 0, yMax: 280, ticksX: ticksMes, ticksY: [0, 70, 140, 210, 280], etX: 'Mes', etY: 'GWh', lineas: lm, fx: fxMes, fy: y => num(y), punta: x => `${fxMes(x)} · ${num(lm[0].f(x))} GWh` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Mes', 'GWh', 'Luz, kWh/m² al día'], A.meses.map(e => [MES_CORTO[e.mes - 1], num(e.gwh), f1(e.kWhm2)]));
    } else if (m === 'calor') {
        const tc = tCelda(pide.tAire, 1000);
        const luz = 1000 * (1 - pide.polvo / 100);
        const ref = curvaModulo(1000, 25);
        const cur = curvaModulo(luz, tc);
        const pot = c => v => c.i(v) * v;
        const lineas = [
            { clase: 'h-s-max', nombre: 'Ficha técnica, 25 °C y limpio', f: pot(ref) },
            { clase: 'h-s-actual', nombre: `Así, celda a ${num(tc)} °C`, f: pot(cur) },
        ];
        $('#h-b-t').textContent = 'Potencia de un módulo según su voltaje';
        $('#h-b-ley').innerHTML = leyenda(lineas);
        $('#h-b-pie').textContent = `El inversor busca la punta de la curva. Con 1,000 W/m², el aire a ${num(pide.tAire)} °C deja la celda a ${num(tc)} °C: la punta baja de ${num(MODULO.pmp)} a ${num(cur.pmp)} W y se corre a menos voltaje.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Potencia de un módulo', xMin: 0, xMax: 54, yMin: 0, yMax: 600, ticksX: [0, 10, 20, 30, 40, 50], ticksY: [0, 150, 300, 450, 600], etX: 'Voltaje del módulo, V', etY: 'W', lineas, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} V · ficha ${num(lineas[0].f(x))} · así ${num(lineas[1].f(x))} W` });
        graficas.b.marcar(cur.vmp, cur.pmp);
        $('#h-tabla-b').innerHTML = tablaHTML(['', 'Ficha', 'Así'], [['Mejor potencia', `${num(ref.pmp)} W`, `${num(cur.pmp)} W`], ['Voltaje', `${f1(ref.vmp)} V`, `${f1(cur.vmp)} V`], ['Corriente', `${f1(ref.imp)} A`, `${f1(cur.imp)} A`], ['Voltaje abierto', `${f1(ref.voc)} V`, `${f1(cur.voc)} V`]]);
        const porT = t => potenciaModulo(luz, tCelda(t, 1000));
        $('#h-c-t').textContent = 'Potencia según el aire';
        $('#h-c-ley').innerHTML = '';
        $('#h-c-pie').textContent = `Con 1,000 W/m². En Puerto Peñasco el aire llega a ${num(CLIMA.tMax)} °C (NASA POWER): por eso el mediodía de verano rinde menos de lo que parece.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Potencia según el aire', xMin: 0, xMax: 50, yMin: 300, yMax: 600, ticksX: [0, 10, 20, 30, 40, 50], ticksY: [300, 400, 500, 600], etX: 'Temperatura del aire, °C', etY: 'W', f: porT, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} °C · ${num(porT(x))} W` });
        graficas.c.marcar(pide.tAire, porT(pide.tAire));
        $('#h-tabla-c').innerHTML = tablaHTML(['Aire', 'Celda', 'Módulo'], [0, 15, 25, 35, 45].map(t => [`${t} °C`, `${num(tCelda(t, 1000))} °C`, `${num(porT(t))} W`]));
    } else if (m === 'seguidor') {
        const Dseg = dia({ mes, polvo: pide.polvo });
        const Dfij = dia({ mes, polvo: pide.polvo, seguidor: false, inclinacion: pide.inclinacion });
        const lineas = [{ clase: 'h-s-actual', nombre: 'Con seguidor', f: curvaDia(Dseg.filas, 'red') }, { clase: 'h-s-sin', nombre: 'Mesa fija', f: curvaDia(Dfij.filas, 'red') }];
        $('#h-b-t').textContent = `Un día de ${MESES[mes - 1].toLowerCase()}, despejado`;
        $('#h-b-ley').innerHTML = leyenda(lineas);
        $('#h-b-pie').textContent = `Ese día: ${num(Dseg.mwh / 1000, 1)} GWh con seguidor y ${num(Dfij.mwh / 1000, 1)} GWh con mesa fija. La gran diferencia está en las primeras y las últimas horas: justo cuando la mesa fija le da la espalda al sol.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'A la red en el día', xMin: 0, xMax: 24, yMin: 0, yMax: 1000, ticksX: HORAS, ticksY: TICKS_MW, etX: 'Hora del sol', etY: 'MW', lineas, fx: x => `${num(x)} h`, fy: y => num(y), punta: x => `${textoHora(x)} · seguidor ${num(lineas[0].f(x))} · fija ${num(lineas[1].f(x))} MW` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Hora', 'Seguidor, MW', 'Fija, MW'], [6, 8, 10, 12, 14, 16, 18].map(h => [`${h} h`, num(lineas[0].f(h)), num(lineas[1].f(h))]));
        const As = anual({ polvo: pide.polvo });
        const Af = anual({ seguidor: false, inclinacion: pide.inclinacion, polvo: pide.polvo });
        const lm = [{ clase: 'h-s-actual', nombre: 'Con seguidor', f: porMes(As, 'gwh') }, { clase: 'h-s-sin', nombre: 'Mesa fija', f: porMes(Af, 'gwh') }];
        $('#h-c-t').textContent = 'Energía de cada mes';
        $('#h-c-ley').innerHTML = leyenda(lm);
        $('#h-c-pie').textContent = `Al año, el seguidor gana ${num((As.gwh / Af.gwh - 1) * 100)} %. En Estados Unidos, casi 90 % de lo nuevo en 2020 ya llevaba seguidor (LBNL). En invierno, la mesa fija inclinada le recorta ventaja: el sol va bajo y al sur.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Energía de cada mes', xMin: 1, xMax: 12, yMin: 0, yMax: 280, ticksX: ticksMes, ticksY: [0, 70, 140, 210, 280], etX: 'Mes', etY: 'GWh', lineas: lm, fx: fxMes, fy: y => num(y), punta: x => `${fxMes(x)} · seguidor ${num(lm[0].f(x))} · fija ${num(lm[1].f(x))} GWh` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Mes', 'Seguidor, GWh', 'Fija, GWh'], As.meses.map((e, i) => [MES_CORTO[i], num(e.gwh), num(Af.meses[i].gwh)]));
    } else if (m === 'inversor') {
        const D = dia({ mes, polvo: pide.polvo, ilr: pide.ilr });
        const lineas = [{ clase: 'h-s-sin', nombre: 'Lo que llega de los módulos', f: curvaDia(D.filas, 'dc') }, { clase: 'h-s-actual', nombre: 'Lo que sale del inversor', f: curvaDia(D.filas, 'ca') }];
        $('#h-b-t').textContent = 'El recorte, en un día despejado';
        $('#h-b-ley').innerHTML = leyenda(lineas);
        $('#h-b-pie').textContent = `Con ${num(pide.ilr, 2)} veces, ese día se recortan ${num(D.recorte)} MWh. El inversor no entrega más de ${num(CENTRAL.mwCA)} MW: arriba de eso, la curva se queda plana.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'El recorte en el día', xMin: 0, xMax: 24, yMin: 0, yMax: 1250, ticksX: HORAS, ticksY: [0, 250, 500, 750, 1000, 1250], etX: 'Hora del sol', etY: 'MW', lineas, fx: x => `${num(x)} h`, fy: y => num(y), punta: x => `${textoHora(x)} · llegan ${num(lineas[0].f(x))} · salen ${num(lineas[1].f(x))} MW` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Hora', 'Llegan, MW', 'Salen, MW'], [6, 8, 10, 12, 14, 16, 18].map(h => [`${h} h`, num(lineas[0].f(h)), num(lineas[1].f(h))]));
        const fac = x => anual({ ilr: Math.round(x * 20) / 20, polvo: pide.polvo }).factorCA * 100;
        const rec = x => anual({ ilr: Math.round(x * 20) / 20, polvo: pide.polvo }).recorteFrac * 100;
        const interp = fn => x => { const a = Math.floor(x * 20) / 20; const b = a + 0.05; return fn(a) + ((fn(b) - fn(a)) * (x - a)) / 0.05; };
        const l2 = [{ clase: 'h-s-actual', nombre: 'Factor de planta', f: interp(fac) }, { clase: 'h-s-sin', nombre: 'Energía recortada', f: interp(rec) }];
        $('#h-c-t').textContent = 'Cuánto gana con más módulos';
        $('#h-c-ley').innerHTML = leyenda(l2);
        $('#h-c-pie').textContent = 'Cada aumento rinde menos: LBNL lo mide en Estados Unidos, donde lo común anda en 1.25. Más módulos también cuestan más, y por eso no conviene llegar muy alto.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Cuánto gana con más módulos', xMin: 1, xMax: 1.6, yMin: 0, yMax: 40, ticksX: [1, 1.2, 1.4, 1.6], ticksY: [0, 10, 20, 30, 40], etX: 'Módulos por inversor', etY: '%', lineas: l2, fx: x => num(x, 1), fy: y => num(y), punta: x => `${num(x, 2)} veces · factor ${f1(l2[0].f(x))} % · recorta ${f1(l2[1].f(x))} %` });
        graficas.c.marcar(pide.ilr, l2[0].f(pide.ilr));
        $('#h-tabla-c').innerHTML = tablaHTML(['Veces', 'GWh al año', 'Factor', 'Recorta'], [1, 1.1, 1.2, 1.25, 1.3, 1.4, 1.5, 1.6].map(x => { const a = anual({ ilr: x, polvo: pide.polvo }); return [num(x, 2), num(a.gwh), `${f1(a.factorCA * 100)} %`, `${f1(a.recorteFrac * 100)} %`]; }));
    } else {
        const S = diaConSAE({ pct: pide.sae, mes, polvo: pide.polvo });
        const lineas = [{ clase: 'h-s-sin', nombre: 'Solar, sin SAEE', f: curvaDia(S.filas, 'red') }, { clase: 'h-s-actual', nombre: 'A la red, con SAEE', f: curvaDia(S.filas, 'total') }];
        $('#h-b-t').textContent = `Un día de ${MESES[mes - 1].toLowerCase()} con SAEE`;
        $('#h-b-ley').innerHTML = leyenda(lineas);
        $('#h-b-pie').textContent = S.mw > 0 ? `El SAEE de ${num(S.mw)} MW toma ${num(S.cargado)} MWh a media mañana y entrega ${num(S.entregado)} MWh al caer el sol: regresan ${num(SAE_DEF.ida * 100)} de cada 100 (EIA). La energía del día baja un poco, pero llega cuando más falta.` : 'Sin SAEE, la central deja de dar en cuanto se va el sol.';
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Un día con SAEE', xMin: 0, xMax: 24, yMin: 0, yMax: 1000, ticksX: HORAS, ticksY: TICKS_MW, etX: 'Hora del sol', etY: 'MW', lineas, fx: x => `${num(x)} h`, fy: y => num(y), punta: x => `${textoHora(x)} · solar ${num(lineas[0].f(x))} · con SAEE ${num(lineas[1].f(x))} MW` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Hora', 'Solar, MW', 'Con SAEE, MW'], [8, 10, 12, 14, 16, 18, 19, 20, 21].map(h => [`${h} h`, num(lineas[0].f(h)), num(lineas[1].f(h))]));
        const soc = x => enHora(S.filas, x, 'soc') * 100;
        $('#h-c-t').textContent = 'Qué tan lleno está';
        $('#h-c-ley').innerHTML = '';
        $('#h-c-pie').textContent = `De ejemplo: se carga desde las 9:30 y entrega en cuanto lo solar ya casi no alcanza. Con ${SAE_DEF.horas} horas o más, las Disposiciones de la CNE le permiten acreditar potencia.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Qué tan lleno está el SAEE', xMin: 0, xMax: 24, yMin: 0, yMax: 100, ticksX: HORAS, ticksY: [0, 25, 50, 75, 100], etX: 'Hora del sol', etY: '% de carga', f: soc, fx: x => `${num(x)} h`, fy: y => num(y), punta: x => `${textoHora(x)} · ${num(soc(x))} %` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Hora', 'Carga'], [8, 10, 12, 14, 16, 18, 19, 20, 21].map(h => [`${h} h`, `${num(soc(h))} %`]));
    }
}
function pintarBarras(L, pag) {
    const { $, pide } = pag;
    const c = L.c;
    let filas;
    if (pide.modo === 'calor') {
        const luz = 1000;
        const tc = tCelda(pide.tAire, luz);
        const p0 = potenciaModulo(luz, 25);
        filas = [{ t: 'Ficha técnica', v: 1, escala: 1.1 }, { t: `Con ${num(pide.tAire)} °C de aire`, v: potenciaModulo(luz, tc) / p0, escala: 1.1 }, { t: `Con ${f1(pide.polvo)} % de polvo`, v: 1 - pide.polvo / 100, escala: 1.1 }, { t: 'Con los dos', v: potenciaModulo(luz * (1 - pide.polvo / 100), tc) / p0, activa: true, escala: 1.1 }];
        $('#h-d-t').textContent = 'Lo que da, de cada 100 de la ficha';
        $('#h-d-pie').textContent = 'En el mundo, el polvo quita por lo menos 3 a 4 % de la energía al año (IEA PVPS). En un desierto y sin limpiar puede ser mucho más.';
    } else if (pide.modo === 'seguidor') {
        const As = anual({ polvo: pide.polvo });
        const Af = anual({ seguidor: false, inclinacion: pide.inclinacion, polvo: pide.polvo });
        filas = [{ t: 'Seguidor', v: 1, activa: pide.seguidor, escala: 1.1 }, { t: `Mesa fija a ${num(pide.inclinacion)}°`, v: Af.gwh / As.gwh, activa: !pide.seguidor, escala: 1.1 }];
        $('#h-d-t').textContent = 'Energía al año, de cada 100 del seguidor';
        $('#h-d-pie').textContent = `Con ${num(As.gwh)} GWh y ${num(Af.gwh)} GWh. Por eso casi todo lo nuevo en Estados Unidos ya lleva seguidor (LBNL).`;
    } else if (pide.modo === 'inversor') {
        const A = anual({ ilr: pide.ilr, polvo: pide.polvo });
        const uno = anual({ ilr: 1, polvo: pide.polvo });
        filas = [{ t: 'Con tantos módulos como inversor', v: uno.gwh / A.gwh, escala: 1.1 }, { t: `Con ${num(pide.ilr, 2)} veces`, v: 1, activa: true, escala: 1.1 }, { t: 'Se recorta', v: A.recorteFrac, d: 1, escala: 1.1 }];
        $('#h-d-t').textContent = 'Energía al año, de cada 100';
        $('#h-d-pie').textContent = `Con ${num(pide.ilr, 2)} veces hacen falta ${num(((CENTRAL.mwCA * pide.ilr * 1e6) / MODULO.pmp) / 1e6, 2)} millones de módulos para el mismo inversor.`;
    } else if (pide.modo === 'sae') {
        const S = diaConSAE({ pct: pide.sae, mes: mesRedondo(pide), polvo: pide.polvo });
        const base = Math.max(1, S.mwh);
        filas = [{ t: 'Energía solar del día', v: 1, escala: 1.1 }, { t: 'Pasa por el SAEE', v: S.cargado / base, activa: true, escala: 1.1, d: 1 }, { t: 'Regresa a la tarde', v: S.entregado / base, activa: true, escala: 1.1, d: 1 }, { t: 'Se pierde en el SAEE', v: (S.cargado - S.entregado) / base, escala: 1.1, d: 1 }];
        $('#h-d-t').textContent = 'De cada 100 del día';
        $('#h-d-pie').textContent = 'Un SAEE no produce energía: la mueve de hora, y pierde un poco en el camino.';
    } else {
        const R = c.reparto;
        filas = [{ t: 'A la red', v: R.red, activa: true }, { t: 'Se vuelve calor en la celda', v: R.calor }, { t: 'Polvo y reflejo', v: R.polvo + R.reflejo, d: 1 }, { t: 'Cables', v: R.cables, d: 1 }, { t: 'Inversor y recorte', v: R.inversor, d: 1 }, { t: 'Transformadores y línea', v: R.transporte, d: 1 }];
        $('#h-d-t').textContent = 'A dónde va cada 100 de luz';
        $('#h-d-pie').textContent = 'Parece poco, pero la luz no se paga: por eso importa más cuánto da por cada metro de módulo.';
    }
    $('#h-barras').innerHTML = barrasHTML(filas);
}
function alPintarFijas({ $ }) {
    $('#h-pesa').innerHTML = barrasHTML([{ t: 'Capacidad instalada, 2025', v: 0.09, activa: true }, { t: 'Generación neta, 2022', v: 0.0597, d: 1 }, { t: 'Horas que trabajan al año', v: 0.284 }]);
    const uno = ANO;
    const dos = ANO_FIJA;
    const pf = anual({ seguidor: false, ilr: 1 });
    const ps = anual({ ilr: 1 });
    $('#h-comparar').innerHTML = tablaHTML(['', 'Seguidor', 'Mesa fija, 31°'], [
        ['GWh al año', num(uno.gwh), num(dos.gwh)],
        ['Factor de planta', `${f1(uno.factorCA * 100)} %`, `${f1(dos.factorCA * 100)} %`],
        ['kWh por kW, sin recorte', num(ps.porKw), num(pf.porKw)],
        ['Lo mismo en PVGIS', num(PVGIS.seguidor), num(PVGIS.fija)],
        ['Luz en el módulo, kWh/m² al año', num(uno.luz), num(dos.luz)],
    ]);
    $('#h-mexico').innerHTML = `<thead><tr><th scope="col">Central</th><th scope="col">MW</th><th scope="col">Dato</th></tr></thead><tbody>${[
        ['Puerto Peñasco', 'Sonora, CFE. Etapas I y II', '420', 'En operación'],
        ['Puerto Peñasco', 'Las cuatro etapas, para 2028', '1,000', 'De 190 a 246 MW de SAEE'],
        ['Villanueva', 'Coahuila', '828', 'Más de 1,700 GWh al año'],
    ].map(([n, d, a, m]) => `<tr><td><b>${n}</b><small>${d}</small></td><td>${a}</td><td>${m}</td></tr>`).join('')}</tbody>`;
    $('#h-regla').innerHTML = tablaHTML(['Dónde', 'Qué dice'], [
        ['Disposiciones de la CNE, DOF, 16 de abril de 2026', 'El CENACE analiza la variabilidad de la central y puede pedir SAEE o concluir que no hace falta'],
        ['Convocatoria de la SENER, DOF, 15 de mayo de 2026', 'Referencia de 935 MW de SAEE no asociados, de tres horas'],
        ['Anuncio del subsecretario, marzo de 2025 (ESS News)', '30 % de la capacidad, tres horas'],
    ]);
}
function alActualizar(L, pag) {
    const { pide, ponerCifra, ponerLecturas, nivel, graficas } = pag;
    const c = L.c;
    const mes = mesRedondo(pide);
    const n = L.red;
    pintarBarras(L, pag);
    const tituloDiag = { dia: 'A dónde va la luz', calor: 'La celda por dentro', seguidor: 'Cómo le pega el sol a la fila', inversor: 'De directa a alterna', sae: 'El SAEE' }[pide.modo];
    ponerCifra('aT', tituloDiag);
    const deNoche = c.s.elev < 0;
    const hud2Hora = `${textoHora(pide.hora)}, ${MESES[mes - 1].toLowerCase()}`;
    if (pide.modo === 'dia') {
        const aviso = deNoche ? 'De noche no hay nada que convertir: los módulos descansan y las filas se quedan planas.' : L.tapa > 0.1 ? `La nube tapa ${num(L.tapa * 78)} de cada 100 de la luz: la central baja en segundos.` : c.recorte > 1 ? `Al inversor le sobran ${num(c.recorte)} MW: se recortan.` : null;
        ponerLecturas([['A la red', num(n), 'MW'], ['Luz en el módulo', num(c.luz.total), 'W/m²'], ['Celda', num(c.tCelda), '°C'], ['Corriente directa', num(c.dc), 'MW'], ['Cadena', num(c.vCadena), 'V'], ['Las filas giran', num(Math.abs(c.giro)), Math.abs(c.giro) < 0.5 ? '°: van planas' : c.giro > 0 ? '° al este' : '° al oeste']], aviso);
        ponerCifra('hud', `${num(n)} MW`);
        ponerCifra('hud2', hud2Hora);
        graficas.b?.ahora(pide.hora);
        graficas.b?.marcar(pide.hora, n);
        graficas.c?.marcar(mes, anual({ polvo: pide.polvo }).meses[mes - 1].gwh);
        nivel(1, 'Inversor', clamp01(c.carga), `${num(clamp01(c.carga) * 100)} %`);
        nivel(2, 'Recorte', clamp01(c.recorte / 100), `${num(c.recorte)} MW`);
    } else if (pide.modo === 'calor') {
        const cv = curvaModulo(c.luzCelda, c.tCelda);
        const aviso = pide.tAire >= 38 ? 'Hace mucho calor: la celda pasa de los 65 °C, y el voltaje baja.' : pide.polvo >= 8 ? 'Tanto polvo ya se nota. Toca limpiar.' : null;
        ponerLecturas([['Un módulo', num(c.pm), 'W'], ['Celda', num(c.tCelda), '°C'], ['Voltaje', f1(cv.vmp), 'V'], ['Corriente', f1(cv.imp), 'A'], ['A la red', num(n), 'MW'], ['Polvo', f1(pide.polvo), '%']], aviso);
        ponerCifra('hud', `${num(c.pm)} W`);
        ponerCifra('hud2', `un módulo, con ${num(pide.tAire)} °C de aire`);
        nivel(1, 'Luz', clamp01(c.luzCelda / 1100), `${num(c.luzCelda)} W/m²`);
        nivel(2, 'Celda', clamp01(c.tCelda / 90), `${num(c.tCelda)} °C`);
    } else if (pide.modo === 'seguidor') {
        const otra = central({ hora: pide.hora, mes, polvo: pide.polvo, seguidor: !pide.seguidor, inclinacion: pide.inclinacion });
        const aviso = !deNoche && pide.seguidor && Math.abs(giroSeguidor(c.s, { regresa: false }) - c.giro) > 2 ? 'Las filas están regresando para no hacerse sombra unas a otras.' : null;
        ponerLecturas([['A la red', num(n), 'MW'], ['Luz en el módulo', num(c.luz.total), 'W/m²'], ['Aprovecha de la directa', num(c.luz.coseno * 100), '%'], [pide.seguidor ? 'Mesa fija daría' : 'Seguidor daría', num(otra.red), 'MW'], ['Giro', num(Math.abs(c.giro)), '°'], ['Sol', num(Math.max(0, c.s.elev)), '° de alto']], aviso);
        ponerCifra('hud', `${num(n)} MW`);
        ponerCifra('hud2', `${pide.seguidor ? 'con seguidor' : 'con mesa fija'}, ${textoHora(pide.hora)}`);
        graficas.b?.ahora(pide.hora);
        graficas.b?.marcar(pide.hora, n);
        nivel(1, 'Seguidor', clamp01((central({ hora: pide.hora, mes, polvo: pide.polvo }).red) / c.redMax), `${num(central({ hora: pide.hora, mes, polvo: pide.polvo }).red)} MW`);
        nivel(2, 'Mesa fija', clamp01(central({ hora: pide.hora, mes, polvo: pide.polvo, seguidor: false, inclinacion: pide.inclinacion }).red / c.redMax), `${num(central({ hora: pide.hora, mes, polvo: pide.polvo, seguidor: false, inclinacion: pide.inclinacion }).red)} MW`);
    } else if (pide.modo === 'inversor') {
        const A = anual({ ilr: pide.ilr, polvo: pide.polvo });
        const aviso = c.recorte > 1 ? `Sobran ${num(c.recorte)} MW: la luz roja del inversor se enciende.` : pide.ilr >= 1.5 ? 'Con tantos módulos, se recorta mucho en verano.' : null;
        ponerLecturas([['Salen', num(c.ca), 'MW'], ['Llegan', num(c.dc), 'MW'], ['Se recortan', num(c.recorte), 'MW'], ['Rinde', f1(c.rendimientoInv * 100), '%'], ['Al año', num(A.gwh), 'GWh'], ['Factor de planta', f1(A.factorCA * 100), '%']], aviso);
        ponerCifra('hud', `${num(c.ca)} MW`);
        ponerCifra('hud2', `${num(pide.ilr, 2)} veces, ${textoHora(pide.hora)}`);
        graficas.b?.ahora(pide.hora);
        nivel(1, 'Inversor', clamp01(c.ca / CENTRAL.mwCA), `${num((c.ca / CENTRAL.mwCA) * 100)} %`);
        nivel(2, 'Recorte', clamp01(c.recorte / 200), `${num(c.recorte)} MW`);
    } else {
        const aviso = L.tapa > 0.1 && L.descarga > 1 ? 'Pasa una nube y el SAEE tapa el hueco.' : L.descarga > 1 ? 'El sol ya casi no alcanza: entrega el SAEE.' : L.carga > 1 ? 'Sobra a media mañana: el SAEE se llena.' : null;
        ponerLecturas([['A la red', num(n), 'MW'], ['Solar', num(c.red), 'MW'], ['Entra al SAEE', num(L.carga), 'MW'], ['Sale del SAEE', num(L.descarga), 'MW'], ['Carga', num(L.soc * 100), '%'], ['Guarda', num(L.soc * (L.cap ?? 0)), 'MWh']], aviso);
        ponerCifra('hud', `${num(n)} MW`);
        ponerCifra('hud2', `con SAEE, ${textoHora(pide.hora)}`);
        graficas.b?.ahora(pide.hora);
        graficas.b?.marcar(pide.hora, n);
        graficas.c?.ahora(pide.hora);
        nivel(1, 'SAEE', clamp01(L.soc), `${num(L.soc * 100)} %`);
        nivel(2, 'Potencia', clamp01(Math.max(L.carga, L.descarga) / Math.max(1, L.sae)), `${num(Math.max(L.carga, L.descarga))} MW`);
    }
}

// ------------------------------------------------------------------ la central
let planta = estadoPlanta({});
const limpieza = { u: 0 };
let nocheAntes = false;

crearPagina({
    figura: FIGURA,
    fichas: FICHAS,
    vistas: VISTAS,
    modos: MODOS,
    botones: BOTONES,
    acciones: ACCIONES,
    modo0: 'dia',
    pide: { hora: DEF.hora, mes: DEF.mes, tAire: 35, polvo: POLVO_DEF, seguidor: true, inclinacion: DEF.inclinacion, ilr: DEF.ilr, sae: DEF.sae, pideNube: false, limpiando: false },
    general: { Lx: 15.2, Lz: 8.6, alto: 5.9, mira: [0.1, 1.75, 0], az: -18, el: 27, azVertical: -12, elVertical: 32 },
    etiquetas: { lienzo: 'Central fotovoltaica en 3D: arrastra para girarla, toca un punto para conocerlo' },
    textoFinal: 'Toca cualquier punto para volver a verlo. Mueve la hora y mira cómo giran las filas, sube el calor en «Calor», compara con la mesa fija, ponle más módulos al inversor o guarda el mediodía en el SAEE.',
    colores: { fondoTinta: '#3a3b40', elec: FLUIDOS.ca.color, cd: FLUIDOS.cd.color, luz: FLUIDOS.luz.color, sae: FLUIDOS.sae.color, caliente: '#e0642f', frio: '#8d939b', panel: '#4b6fb5', panelSuave: 'rgba(224,69,123,.18)', capaN: '#1e3f86', capaP: '#6d7b92', claro: '#ffffff' },
    crearDiagrama,
    secciones,
    escena: (renderer, scene, { movil, oscuro }) => {
        const M = materiales(P_PLANTA);
        const est = escenario(renderer, scene, M, { movil, oscuro });
        return { planta: construir(M, P_PLANTA, { movil, oscuro }), est };
    },
    alCambiarModo: (p, m) => {
        p.corre = false;
        if (m === 'calor') p.hora = 12;
        if (m === 'sae') p.hora = 19;
        if (p.modo === 'sae' && m !== 'sae') p.hora = 12;
        if (p.modo === 'inversor' && m !== 'inversor') p.ilr = DEF.ilr;
        if (m === 'inversor' && p.hora < 9) p.hora = 12;
        if (p.modo === 'seguidor' && m !== 'seguidor') p.seguidor = true;
        if (m === 'seguidor') p.hora = 8;
        if (p.modo === 'seguidor' && m === 'dia') p.hora = 12;
    },
    alCuadro: ({ dt, pide, pagina }) => {
        // el botón de la luna lleva a la noche; y si la hora ya es de noche, el botón lo dice
        const mes = clamp(Math.round(pide.mes), 1, 12);
        if (pide.noche !== nocheAntes) { pide.hora = pide.noche ? 21 : 12; pide.corre = false; pagina.ponerMando(); pagina.rotular(); }
        const s = solEn(pide.hora, mes);
        const esNoche = s.elev < -1;
        if (esNoche !== pide.noche) { pide.noche = esNoche; pagina.rotular(); }
        nocheAntes = pide.noche;
        // la nube que se pidió
        if (pide.pideNube) { planta = { ...planta, nube: 0 }; pide.pideNube = false; }
        const usaSeguidor = pide.modo === 'seguidor' ? pide.seguidor : true;
        planta = pasoPlanta(planta, { giro: giroSeguidor(s), seguidor: usaSeguidor }, dt);
        // la limpieza: el robot va y viene, y el polvo baja a su paso
        if (pide.limpiando) {
            limpieza.u += dt / 6;
            pide.polvo = Math.max(0, pide.polvo - (dt * Math.max(pide.polvo, 1)) / 2.2);
            if (limpieza.u >= 1) { limpieza.u = 0; pide.limpiando = false; pide.polvo = 0; pagina.rotular(); pagina.invalidar(); }
            pagina.ponerMando();
        }
    },
    poseDe: ({ pide, ve, encendido, t, dt, camara }) => pose({ modo: pide.modo, planta, hora: pide.hora, mes: clamp(Math.round(pide.mes), 1, 12), tAire: pide.tAire, polvo: pide.polvo, seguidor: pide.seguidor, inclinacion: pide.inclinacion, ilr: pide.ilr, sae: pide.sae, adentro: ve.adentro, desarme: ve.desarme, encendido, limpia: limpieza.u, t, dt, camara }),
    firma: p => [p.modo, Math.round(p.mes), Math.round(p.polvo * 2), Math.round(p.tAire), p.inclinacion, p.ilr, p.sae, p.seguidor],
    alPintarFijas,
    alPintarGraficas,
    alActualizar,
    prueba: p => ({ hora: +p.hora.toFixed(2), mes: Math.round(p.mes), giro: +planta.giro.toFixed(1), fija: +planta.fija.toFixed(2), nube: +planta.nube.toFixed(2), polvo: +p.polvo.toFixed(2), tAire: p.tAire, ilr: p.ilr, sae: p.sae, seguidor: p.seguidor }),
});
