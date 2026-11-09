// «Central eólica», en 3D y con el formato Búho de «¿Cómo funciona?». Una central de ejemplo con el aerogenerador y el tamaño del Parque Eólico Reynosa,
// Tamaulipas: tres aerogeneradores en fila con el viento, el primero con todo por dentro, la subestación, la RNT y las RGD. Cuatro formas de verla: viento,
// control, un año y estela. Puntos clave con su ficha, ver por dentro, desarmar, día y noche, y gráficas que leen las mismas cifras que mueven la central
// (modelo.js). Se arma con: node scripts/build-conceptos-3d.mjs eolica
//
// Lo que se repite entre las plantas con física está en conceptos-3d/planta-comun/.
import { clamp, clamp01, num } from '../planta-comun/ayudas.js';
import { barrasHTML, leyenda, pintarGrafica, seccionBarras, seccionColores, seccionDiagrama, seccionFuentes, seccionGrafica, seccionTabla, tablaHTML } from '../planta-comun/graficas.js';
import { crearPagina } from '../planta-comun/pagina.js';
import { BETZ, CURVA_V126, DEF, FACTOR_OTRAS, FLUIDOS, K_WEIBULL, LAMBDA_OPT, LIMITES, MESES, MES_CORTO, OTRAS, PARQUE, PARTES as PARTES_M, SEPARACION, SITIOS, TURBINA, aerogenerador, anual, cp, deficit, estadoPlanta, fila, pasoPlanta, pose, vientoA, weibull } from './modelo.js';
import { P_PLANTA, construir, escenario, materiales } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';

const FIGURA = 'eolica';
const A9 = aerogenerador(9);
const A15 = aerogenerador(15);
const AMP_400 = ((PARQUE.mw) * 1e3) / (Math.sqrt(3) * 400);
const DESVIO30 = 1 - aerogenerador(8, { desvio: 30 }).mw / aerogenerador(8).mw;

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'viento', nombre: 'Viento', modo: 'viento', accion: 'tormenta', eq: `Reynosa: ${num(SITIOS.reynosa.anual, 1)} m/s a 50 m, en promedio`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 9h11a3 3 0 1 0-3-3"/><path d="M3 14h16a3 3 0 1 1-3 3"/><path d="M3 19h7"/>',
        texto: 'Todo sale del aire en movimiento. Si el viento sopla al doble, lleva ocho veces más energía: por eso importa tanto dónde se pone cada máquina. Este mástil mide el viento a varias alturas con sus copas giratorias. Los hilos azules son el viento: fíjate cómo se frena al cruzar cada rotor.' },
    { parte: 'aspas', nombre: 'Aspas', modo: 'viento', accion: 'tormenta', eq: `Rotor de ${num(TURBINA.D)} m · ${num(TURBINA.area)} m² · ${num(A9.rpm, 1)} vueltas por minuto con 9 m/s`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="12" r="1.800"/><path d="M12 10V3c2 1 2.500 3.500 0 7Z"/><path d="m13.700 13 6 3.500c-1.900 1.200-4.300.3-6-3.500Z"/><path d="m10.300 13-6 3.500c1.900 1.200 4.300.3 6-3.500Z"/>',
        texto: `Trabajan como el ala de un avión: el aire crea una diferencia de presión que las jala, y eso hace girar el rotor. No las empuja de frente. Este rotor mide ${num(TURBINA.D)} metros, y su círculo cubre cerca de dos canchas de futbol. Se hacen de fibra de vidrio y se tuercen de la raíz a la punta.` },
    { parte: 'paso', nombre: 'Paso de las aspas', modo: 'control', abrir: true, accion: 'tormenta', eq: `Con 15 m/s, giradas ${num(A15.beta)}° para no pasar de ${num(TURBINA.mw, 2)} MW`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="12" r="3"/><path d="M12 9V3M9.400 13.500l-5 3M14.600 13.500l5 3"/><path d="M6 6.500c1-1 2-1.500 3-1.700"/>',
        texto: 'Cada aspa gira sobre su propio eje, con un motor en el buje. Con poco viento va de frente, y toma todo lo que puede. Cuando sobra, se gira para soltar lo de más y no pasar del tamaño de la máquina. Con tormenta se pone de canto: el viento pasa sin empujarla.' },
    { parte: 'eje', nombre: 'Eje y freno', modo: 'viento', abrir: true, accion: 'desarme', eq: `Eje lento: ${num(A9.rpm, 1)} vueltas por minuto, con mucha fuerza`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 12h18"/><rect x="8" y="9" width="3" height="6"/><circle cx="17" cy="12" r="3.500"/>',
        texto: 'El rotor gira lento y con mucha fuerza. Este eje grueso, sobre su cojinete, lleva ese giro a la multiplicadora. De ahí sale un eje delgado y rápido, con un disco y una mordaza guinda: es el freno. Sujeta el rotor para darle mantenimiento; para detenerlo, primero se giran las aspas.' },
    { parte: 'multiplicadora', nombre: 'Multiplicadora', modo: 'viento', abrir: true, accion: 'desarme', eq: `Por ${TURBINA.multiplica}: de ${num(A15.rpm, 1)} a ${num(A15.rpm * TURBINA.multiplica)} vueltas por minuto, de ejemplo`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="9" cy="10" r="5"/><circle cx="17" cy="16" r="3"/><path d="M9 7v6M6 10h6"/>',
        texto: 'Es una caja de engranes. Toma el giro lento del rotor y lo vuelve muy rápido, porque un generador chico necesita girar rápido. Tiene tres etapas, una tras otra, y cada una acelera más. Algunos aerogeneradores no la llevan: conectan el rotor directo a un generador mucho más grande.' },
    { parte: 'generador', nombre: 'Generador', modo: 'viento', abrir: true, accion: 'desarme', eq: `${num(TURBINA.mw, 2)} MW como máximo; en una máquina parecida, a 690 V`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="12" r="7.500"/><path d="M12.800 7.500 9.700 12.600h4.600l-3 4"/>',
        texto: `Aquí nace la electricidad: el eje rápido hace girar un imán dentro de bobinas de cobre. Con ${TURBINA.polos} polos, ${num(1200)} vueltas por minuto dan los 60 ciclos por segundo de la red. El radiador del techo saca su calor. De cada 100 de lo que entra por el eje, salen cerca de ${num(94)} ya como electricidad; el resto es calor.` },
    { parte: 'convertidor', nombre: 'Convertidor y transformador', modo: 'viento', abrir: true, accion: 'desarme', eq: 'De unos 690 V a 34.5 kV', recorrido: { noche: false, adentro: false },
        icono: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 12c1-3 2-3 3 0s2 3 3 0 2-3 3 0"/>',
        texto: 'El viento cambia a cada rato, y con él, el giro. Esta electrónica, en la cola de la góndola, deja la electricidad a los 60 ciclos de la red aunque el rotor vaya más lento o más rápido. El cable baja por la torre hasta el transformador del pie, que sube el voltaje para la red interna del parque.' },
    { parte: 'orientacion', nombre: 'Orientación', modo: 'control', abrir: true, accion: 'desviar', eq: `Desviada 30°, da ${num(DESVIO30 * 100)} % menos`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="12" r="8"/><path d="M12 4v4M12 16v4M4 12h4M16 12h4"/><path d="m12 12 3-3"/>',
        texto: 'La veleta del techo dice de dónde viene el viento, y estos motores giran toda la góndola sobre una corona, arriba de la torre, para mirarlo de frente. Importa: si el rotor no ve el viento de frente, le entra menos aire. Prueba a desviarla en el modo Control y mira cómo baja la potencia.' },
    { parte: 'torre', nombre: 'Torre', modo: 'viento', abrir: true, accion: 'noche', eq: `Este modelo: ${TURBINA.bujes.map(h => num(h)).join(', ')} m`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M10 21 11 4h2l1 17Z"/><path d="M8 21h8M10.500 11h3"/>',
        texto: 'Es un tubo de acero, por tramos, que se adelgaza hacia arriba. Por dentro lleva una escalera y los cables que bajan del generador; abajo tiene una puerta. Más alto hay más viento y menos remolinos del suelo, y por eso son tan altas. La luz roja de la góndola avisa a los aviones.' },
    { parte: 'cimentacion', nombre: 'Cimentación', modo: 'viento', abrir: true, accion: 'desarme', eq: 'Forma y tamaño de ejemplo', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 18h16l-3-5H7Z"/><path d="M12 13V4M9 13V8M15 13V8"/>',
        texto: 'Para verla, aquí el aerogenerador sube: de verdad queda enterrada. Es una zapata de concreto con varillas de acero, y un anillo de pernos que amarra la torre. Su trabajo es que el viento no tumbe la máquina: el rotor empuja arriba, muy lejos del suelo. Forma y tamaño son de ejemplo.' },
    { parte: 'estela', nombre: 'Estela', modo: 'estela', abrir: true, accion: 'estelaSep', eq: `A ${SEPARACION} diámetros, el aire va ${num(deficit(SEPARACION) * 100)} % más lento`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 6v12"/><path d="M4 8c6 0 10 1 16 3"/><path d="M4 16c6 0 10-1 16-3"/>',
        texto: `Quien toma viento lo deja más lento y revuelto, y al de atrás le llega menos. Por eso se separan: cerca de ${SEPARACION} diámetros es lo común, unos ${num(SEPARACION * TURBINA.D)} metros. Más lejos se pierde menos, pero cuesta más en caminos, cables y terreno. Aquí, para que quepan, están mucho más cerca.` },
    { parte: 'subestacion', nombre: 'Subestación', modo: 'viento', abrir: true, accion: 'desarme', eq: `Parque de ${num(PARQUE.mw)} MW: ${num(AMP_400)} amperes a 400 kV, de ejemplo`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 20h16"/><path d="M7 20V8l5-4 5 4v12"/><path d="M7 12h10"/>',
        texto: 'Los cables enterrados traen aquí la electricidad de todos los aerogeneradores, a media tensión, a menudo 34.5 kV. Este transformador la sube a alta tensión para que viaje lejos con menos pérdidas. Los interruptores y las cuchillas aíslan la central si hay una falla.' },
    { parte: 'red', nombre: 'RNT y RGD', modo: 'viento', accion: 'noche', recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 3 6 21M12 3l6 18M8 9h8M7 14h10"/>',
        texto: 'La electricidad sale por la RNT, la Red Nacional de Transmisión, que la lleva lejos y a grandes usuarios. Las RGD, Redes Generales de Distribución, la reparten al público. El CENACE decide cuándo entra cada central. El viento no avisa: por eso importa pronosticarlo y tener otras centrales listas.' },
];
const VISTAS = Object.fromEntries(PARTES_M.map(p => [p.id, p.vista]));

const textoV = v => `${num(v, 1)} m/s`;
const textoMes = v => MESES[clamp(Math.round(v), 1, 12) - 1];
const reloj = { texto: 'el año', avanzar: (p, dt) => { p.mes = p.mes + (dt * 12) / 28; if (p.mes >= 12.49) p.mes = 1; return false; }, alSeguir: () => {} };
const MODOS = {
    viento: { nombre: 'Viento', corto: 'Viento', resumen: 'Mueve el viento y mira la curva de esta máquina: no arranca con poco, sube muy rápido, se queda en su tamaño y se detiene con demasiado. O deja que pase una tormenta.', aclara: 'De cada 100 de la energía del viento que cruza el rotor, a dónde va.', mando: { nombre: 'Viento a la altura del buje', campo: 'v', rango: LIMITES.v, texto: textoV } },
    control: { nombre: 'Paso y orientación', corto: 'Control', resumen: 'Aquí mandas tú. Gira las aspas y desvía la góndola, y mira cuánta potencia se pierde. La máquina lo hace sola, varias veces por minuto, para no pasar de su tamaño y mirar siempre al viento.', aclara: 'Un corte a la mitad del aspa, visto desde su punta. El viento baja y el aspa avanza; juntos hacen el viento que el aspa siente. Si le llega bien, la empuja hacia adelante.', mando: { nombre: 'Paso de las aspas', campo: 'paso', rango: LIMITES.paso, texto: v => `${num(v)}°` }, mando2: { nombre: 'Desvío de la góndola', campo: 'desvio', rango: LIMITES.desvio, texto: v => `${num(v)}°`, pinta: false } },
    ano: { nombre: 'Un año', corto: 'Un año', resumen: 'El viento cambia con el mes y con el sitio. Compara Reynosa con el Istmo de Tehuantepec, donde en invierno soplan fuerte los «nortes». Y sube la torre: arriba hay más viento.', aclara: 'Más arriba, más viento: el aire se frena contra el suelo. A la altura del buje se le suele calcular con un exponente de 1/7.', mando: { nombre: 'Mes', campo: 'mes', rango: LIMITES.mes, texto: textoMes, pinta: true }, mando2: { nombre: 'Altura del buje', campo: 'buje', rango: LIMITES.buje, texto: v => `${num(v)} m`, pinta: true }, reloj },
    estela: { nombre: 'Estela', corto: 'Estela', resumen: 'Detrás de cada rotor el aire va más lento. Junta o separa las máquinas y mira cuánto le queda a la de atrás. El caso de la figura es el peor: las tres en fila con el viento.', aclara: 'Vista desde arriba. La estela se abre y se va llenando de aire rápido, y por eso a más distancia se recupera.', mando: { nombre: 'Distancia entre aerogeneradores', campo: 'sep', rango: LIMITES.separacion, texto: v => `${num(v, 1)} diámetros`, pinta: false }, mando2: { nombre: 'Viento', campo: 'v', rango: [4, 14], texto: textoV, pinta: true } },
};
const BOTONES = [
    { id: 'tormenta', visible: p => p.modo === 'viento', pulsado: () => false, texto: () => 'Que llegue una tormenta', alTocar: p => { p.pideTormenta = true; } },
    { id: 'sitio', visible: p => p.modo === 'ano', pulsado: p => p.sitio === 'istmo', texto: p => (p.sitio === 'istmo' ? 'Istmo de Tehuantepec' : 'Reynosa, Tamaulipas'), alTocar: p => { p.sitio = p.sitio === 'istmo' ? 'reynosa' : 'istmo'; } },
    { id: 'vientoC', visible: p => p.modo === 'control', pulsado: () => false, texto: p => `Viento de ${num(p.v)} m/s`, alTocar: p => { const o = [6, 9, 12, 16]; p.v = o[(o.indexOf(p.v) + 1) % 4] ?? 9; } },
];
const ACCIONES = {
    tormenta: { texto: () => 'Que llegue una tormenta', hacer: p => { p.pideTormenta = true; } },
    desviar: { texto: p => (p.desvio > 0 ? 'Ponerla de frente' : 'Desviarla 30°'), hacer: (p, pag) => { p.desvio = p.desvio > 0 ? 0 : 30; pag.invalidar(); pag.ponerMando(); } },
    estelaSep: { texto: p => (p.sep > 4 ? 'Juntarlas a 3 diámetros' : 'Separarlas a 7 diámetros'), hacer: (p, pag) => { p.sep = p.sep > 4 ? 3 : 7; pag.invalidar(); pag.ponerMando(); } },
};

// ------------------------------------------------------------------ el tablero
const secciones = () => `
    ${seccionDiagrama('A dónde va el viento')}
    ${seccionGrafica('b')}
    ${seccionGrafica('c')}
    ${seccionBarras()}
    ${seccionTabla('El modelo contra una curva publicada', 'h-curva', 'No hay curva pública abierta de la V136-3.45. Por eso se comprueba con la V126-3.45, una máquina hermana: mismo tamaño y rotor más chico. Con ese rotor, el modelo debe dar lo que dice la curva.', 'h-tabla-texto')}
    ${seccionTabla('Parques eólicos de México', 'h-mexico', 'Reynosa y Eólica del Sur son dos de los más grandes. No encontré cuánta energía dan en un año en una fuente abierta. En Eólica del Sur hubo polémica por la consulta a pueblos indígenas, y la Suprema Corte rechazó la demanda (Energías Renovables, 2019).')}
    ${seccionTabla('¿Cuánto SAE pide México?', 'h-regla', 'Las Disposiciones vigentes no fijan un porcentaje para las centrales. El Sistema de Almacenamiento de Energía (SAE) no está en esta figura: en la fotovoltaica se ve cómo trabaja.')}
    <section class="g-curva h-media">
        <div class="g-curva-cab"><b>Cuánto pesa en México</b></div>
        <div class="h-barras" id="h-pesa"></div>
        <p>Da menos de lo que su capacidad sugiere porque depende del viento: un MW eólico trabaja menos horas al año que uno de gas.</p>
    </section>
    ${seccionColores(FLUIDOS, `Central de ejemplo con la máquina y el tamaño de Reynosa; no es el plano real ni un simulador. Aquí solo hay tres de los ${num(PARQUE.n)} aerogeneradores, y mucho más juntos que en la realidad. Lo que no sale de una fuente (forma de la curva de Cp, velocidad de punta, multiplicadora, pérdidas, cimentación, voltaje de 400 kV y cuánto tarda en responder) es de ejemplo, para ver la tendencia.`)}
    ${seccionFuentes(FUENTES, [
        { para: 'Permiso de generación, viento como Energía Limpia, RNT, RGD, quién decide el despacho, impacto social y consulta previa', titulo: 'Ley del Sector Eléctrico, arts. 3, 17, 19, 25, 30, 32, 35 a 40, 49, 114, 117 y 133 a 139', nota: 'Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio' },
        { para: 'Consulta previa y respaldo propio', titulo: 'Reglamento de la Ley del Sector Eléctrico, arts. 2, fracc. VIII, y 59', nota: 'Diario Oficial de la Federación, 3 de octubre de 2025. Está en el acervo de este sitio' },
    ])}`;

const f1 = x => num(x, 1);
const f2 = x => num(x, 2);
const curvaMW = (o = {}) => v => aerogenerador(v, o).mw;
function alPintarGraficas(L, pag) {
    const { $, pide, graficas } = pag;
    const m = pide.modo;
    graficas.b = null;
    graficas.c = null;
    const MES = clamp(Math.round(pide.mes), 1, 12);
    if (m === 'viento') {
        const P = curvaMW();
        const lineas = [{ clase: 'h-s-actual', nombre: 'V136-3.45, modelo', f: P }, { clase: 'h-s-sin', nombre: 'V126-3.45, publicada', f: curvaMW({ D: CURVA_V126.D }) }];
        $('#h-b-t').textContent = 'Curva de potencia';
        $('#h-b-ley').innerHTML = leyenda(lineas);
        $('#h-b-pie').textContent = `Arranca con ${TURBINA.Varranque} m/s, llega a su tamaño cerca de 11 m/s y se detiene con ${f1(TURBINA.Vparo)} m/s. Abajo de eso crece con el cubo del viento: con el doble de viento, ocho veces más.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Curva de potencia', xMin: 0, xMax: 30, yMin: 0, yMax: 4, ticksX: [0, 5, 10, 15, 20, 25, 30], ticksY: [0, 1, 2, 3, 4], etX: 'Viento a la altura del buje, m/s', etY: 'MW', lineas, fx: x => num(x), fy: y => num(y), punta: x => `${f1(x)} m/s · ${f2(P(x))} MW` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Viento', 'MW', 'Vueltas por minuto', 'Paso'], [3, 5, 7, 9, 11, 15, 20, 23].map(v => { const a = aerogenerador(v); return [`${v} m/s`, f2(a.mw), f1(a.rpm), `${num(a.beta)}°`]; }));
        const lc = [{ clase: 'h-s-actual', nombre: 'Lo que toma el rotor', f: x => cp(x, 0) * 100 }, { clase: 'h-s-max', nombre: 'Límite de Betz', f: () => BETZ * 100 }];
        $('#h-c-t').textContent = 'Qué tanto toma del viento';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Según qué tan rápido va la punta del aspa contra el viento. Su mejor punto es cerca de ${f1(LAMBDA_OPT)} veces; por eso, con poco viento, el rotor gira más despacio. El límite de Betz dice que ninguno puede pasar de 59 de cada 100.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Qué tanto toma del viento', xMin: 2, xMax: 14, yMin: 0, yMax: 70, ticksX: [2, 4, 6, 8, 10, 12, 14], ticksY: [0, 20, 40, 60], etX: 'Punta del aspa contra el viento, veces', etY: '%', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${f1(x)} veces · ${num(cp(x, 0) * 100)} %` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Veces', 'Toma, %'], [4, 6, 8, 10, 12].map(x => [num(x), num(cp(x, 0) * 100)]));
    } else if (m === 'control') {
        const v = pide.v;
        const pasoF = b => aerogenerador(v, { paso: b }).mw;
        const dF = d => aerogenerador(v, { desvio: d }).mw;
        $('#h-b-t').textContent = `Potencia según el paso, con ${num(v)} m/s`;
        $('#h-b-ley').textContent = '';
        $('#h-b-pie').textContent = 'Basta girar unos grados para soltar mucho viento. Con el giro de ese momento, pasando de unos 20°, el aspa ya casi no empuja.';
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Potencia según el paso', xMin: 0, xMax: 40, yMin: 0, yMax: 4, ticksX: [0, 10, 20, 30, 40], ticksY: [0, 1, 2, 3, 4], etX: 'Paso de las aspas, grados', etY: 'MW', f: pasoF, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)}° · ${f2(pasoF(x))} MW` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Paso', 'MW'], [0, 3, 6, 10, 15, 20, 30].map(b => [`${b}°`, f2(pasoF(b))]));
        $('#h-c-t').textContent = `Potencia según el desvío, con ${num(v)} m/s`;
        $('#h-c-ley').textContent = '';
        $('#h-c-pie').textContent = 'Si la góndola no mira al viento de frente, el rotor solo aprovecha la parte que le llega de frente. Por eso la veleta y los motores trabajan todo el día.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Potencia según el desvío', xMin: 0, xMax: 45, yMin: 0, yMax: 4, ticksX: [0, 15, 30, 45], ticksY: [0, 1, 2, 3, 4], etX: 'Desvío de la góndola, grados', etY: 'MW', f: dF, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)}° · ${f2(dF(x))} MW` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Desvío', 'MW'], [0, 10, 20, 30, 45].map(d => [`${d}°`, f2(dF(d))]));
    } else if (m === 'ano') {
        const S = SITIOS[pide.sitio];
        const media = vientoA(S.ws50[MES - 1], pide.buje);
        const horas = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][MES - 1] * 24;
        const fH = v => weibull(v, media) * horas;
        $('#h-b-t').textContent = `Cuántas horas sopla cada viento: ${MESES[MES - 1].toLowerCase()}`;
        $('#h-b-ley').textContent = '';
        $('#h-b-pie').textContent = `En ${S.corto}, con ${f1(media)} m/s en promedio. El viento casi nunca es el promedio: hay horas de calma y horas de mucho viento. Su reparto es de ejemplo (Weibull, con k = ${f1(K_WEIBULL)}).`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Horas por viento', xMin: 0, xMax: 25, yMin: 0, yMax: 110, ticksX: [0, 5, 10, 15, 20, 25], ticksY: [0, 25, 50, 75, 100], etX: 'Viento, m/s', etY: 'horas por m/s', f: fH, fx: x => num(x), fy: y => num(y), punta: x => `${f1(x)} m/s · ${num(fH(x))} horas por m/s` });
        graficas.b.marcar(media, fH(media));
        $('#h-tabla-b').innerHTML = tablaHTML(['Viento', 'Horas por m/s'], [2, 4, 6, 8, 10, 12, 15, 20].map(v => [`${v} m/s`, num(fH(v))]));
        const Ar = anual({ sitio: 'reynosa', buje: pide.buje });
        const Ai = anual({ sitio: 'istmo', buje: pide.buje });
        const porMes = A => x => { const k = clamp(x, 1, 12); const i = Math.min(10, Math.floor(k) - 1); return A.meses[i].gwh + (A.meses[i + 1].gwh - A.meses[i].gwh) * (k - (i + 1)); };
        const l2 = [{ clase: 'h-s-actual', nombre: 'Reynosa', f: porMes(Ar) }, { clase: 'h-s-sin', nombre: 'Istmo', f: porMes(Ai) }];
        const fxMes = x => MES_CORTO[clamp(Math.round(x), 1, 12) - 1];
        $('#h-c-t').textContent = 'Energía de un aerogenerador, por mes';
        $('#h-c-ley').innerHTML = leyenda(l2);
        $('#h-c-pie').textContent = `A ${num(pide.buje)} m, Reynosa da ${f1(Ar.gwh)} GWh al año y el Istmo ${f1(Ai.gwh)}, con la misma máquina. El viento de NASA POWER es un promedio de una zona grande: en un buen sitio del Istmo sopla más.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Energía por mes', xMin: 1, xMax: 12, yMin: 0, yMax: 2, ticksX: [1, 3, 5, 7, 9, 11], ticksY: [0, 0.5, 1, 1.5, 2], etX: 'Mes', etY: 'GWh', lineas: l2, fx: fxMes, fy: y => num(y, 1), punta: x => `${fxMes(x)} · Reynosa ${f2(l2[0].f(x))} · Istmo ${f2(l2[1].f(x))} GWh` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Mes', 'Reynosa, GWh', 'Istmo, GWh'], Ar.meses.map((e, i) => [MES_CORTO[i], f2(e.gwh), f2(Ai.meses[i].gwh)]));
    } else {
        const v = pide.v;
        const a = aerogenerador(v);
        const uX = x => v * (1 - deficit(x, a.Ct));
        $('#h-b-t').textContent = `El viento detrás de un rotor, con ${num(v, 1)} m/s`;
        $('#h-b-ley').textContent = '';
        $('#h-b-pie').textContent = 'Modelo de Jensen. Se recupera poco a poco. Con la potencia al cubo del viento, perder poca velocidad cuesta bastante energía.';
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Viento detrás del rotor', xMin: 1, xMax: 15, yMin: 0, yMax: Math.ceil(v) + 1, ticksX: [1, 3, 5, 7, 9, 11, 13, 15], ticksY: [0, Math.round(v / 2), Math.ceil(v) + 1], etX: 'Distancia, en diámetros', etY: 'm/s', f: uX, fx: x => num(x), fy: y => num(y), punta: x => `${f1(x)} diámetros · ${f1(uX(x))} m/s` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Distancia', 'Viento', 'Más lento'], [3, 5, 7, 10, 12, 15].map(x => [`${x} diámetros`, `${f1(uX(x))} m/s`, `${num(deficit(x, a.Ct) * 100)} %`]));
        const pe = x => fila(v, 3, x).perdida * 100;
        $('#h-c-t').textContent = 'Cuánto se pierde con tres en fila';
        $('#h-c-ley').textContent = '';
        $('#h-c-pie').textContent = `Es el peor caso, con el viento justo en la línea de las máquinas. El viento cambia y los parques se acomodan en contra de él; por eso, en todo un año, este modelo descuenta ${num(OTRAS.estela * 100)} %, de ejemplo.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Pérdida con tres en fila', xMin: 3, xMax: 12, yMin: 0, yMax: 60, ticksX: [3, 5, 7, 9, 11], ticksY: [0, 20, 40, 60], etX: 'Distancia, en diámetros', etY: '%', f: pe, fx: x => num(x), fy: y => num(y), punta: x => `${f1(x)} diámetros · ${num(pe(x))} %` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Distancia', 'Se pierde', 'Metros'], [3, 5, 7, 10, 12].map(x => [`${x} diámetros`, `${num(pe(x))} %`, num(x * TURBINA.D)]));
    }
}
function pintarBarras(L, pag) {
    const { $, pide } = pag;
    let filas;
    if (pide.modo === 'control') {
        const ref = aerogenerador(pide.v).mw || 1;
        const soloP = aerogenerador(pide.v, { paso: pide.paso }).mw / ref;
        const soloD = aerogenerador(pide.v, { desvio: pide.desvio }).mw / ref;
        filas = [{ t: 'La máquina sola', v: 1, escala: 1.1 }, { t: `Con ${num(pide.paso)}° de paso`, v: soloP, escala: 1.1 }, { t: `Con ${num(pide.desvio)}° de desvío`, v: soloD, escala: 1.1 }, { t: 'Con los dos', v: L.mw / ref, activa: true, escala: 1.1 }];
        $('#h-d-t').textContent = 'Lo que da, de cada 100';
        $('#h-d-pie').textContent = 'El control automático busca el mejor paso y mira al viento: lo que ves aquí es lo que se perdería sin él.';
    } else if (pide.modo === 'ano') {
        filas = TURBINA.bujes.map(h => { const a = anual({ sitio: pide.sitio, buje: h }); return { t: `Buje de ${num(h)} m`, v: a.factor, activa: Math.abs(h - pide.buje) < 15, escala: 0.7, d: 0 }; });
        $('#h-d-t').textContent = 'Factor de planta según la altura';
        $('#h-d-pie').textContent = `Ya con ${num((1 - FACTOR_OTRAS) * 100)} % menos por estelas, disponibilidad y cables, de ejemplo. El promedio de México es 32.2 % (IMCO); este rotor es muy grande para su potencia, y por eso trabaja más horas.`;
    } else if (pide.modo === 'estela') {
        filas = L.fila.lista.map((t, i) => ({ t: `Aerogenerador ${i + 1}: ${f1(t.u)} m/s`, v: t.mw / TURBINA.mw, activa: i === 0, escala: 1 }));
        $('#h-d-t').textContent = 'Qué tanto da cada uno, de cada 100 de su tamaño';
        $('#h-d-pie').textContent = `Con ${num(pide.sep, 1)} diámetros se pierde ${num(L.fila.perdida * 100)} % de lo que darían sin estela.`;
    } else {
        const R = L.reparto;
        filas = [{ t: 'A la red', v: R.red, activa: true }, { t: 'Lo suelta el paso', v: R.suelta }, { t: 'Se queda en la máquina', v: R.maquina }, { t: 'Se pierde en las aspas', v: R.aspas }, { t: 'Sigue de largo', v: R.sigue }];
        $('#h-d-t').textContent = 'A dónde va cada 100 del viento';
        $('#h-d-pie').textContent = 'Nadie puede tomarlo todo: si el aire se detuviera detrás del rotor, ya no dejaría pasar más. El límite es 59 de cada 100.';
    }
    $('#h-barras').innerHTML = barrasHTML(filas);
}
function alPintarFijas({ $ }) {
    $('#h-pesa').innerHTML = barrasHTML([{ t: 'Capacidad instalada, 2025', v: 0.08, activa: true }, { t: 'Generación neta, 2022', v: 0.0603, d: 1 }, { t: 'Horas que trabajan al año', v: 0.322 }]);
    $('#h-curva').innerHTML = tablaHTML(['Viento', 'Modelo, kW', 'Publicada, kW'], CURVA_V126.puntos.slice(0, 9).map(([v, kw]) => [`${v} m/s`, num(aerogenerador(v, { D: CURVA_V126.D }).mw * 1000), num(kw)]));
    $('#h-mexico').innerHTML = `<thead><tr><th scope="col">Parque</th><th scope="col">MW</th><th scope="col">Máquinas</th></tr></thead><tbody>${[
        ['Reynosa', 'Tamaulipas, Zuma Energía', '424', '123 Vestas V136'],
        ['Eólica del Sur', 'Oaxaca, Istmo de Tehuantepec', '396', '132'],
    ].map(([n, d, a, m]) => `<tr><td><b>${n}</b><small>${d}</small></td><td>${a}</td><td>${m}</td></tr>`).join('')}</tbody>`;
    $('#h-regla').innerHTML = tablaHTML(['Dónde', 'Qué dice'], [
        ['Disposiciones de la CNE, DOF, 16 de abril de 2026', 'El CENACE analiza la variabilidad de la central y puede pedir SAE o concluir que no hace falta'],
        ['Ley del Sector Eléctrico, art. 32', 'En autoconsumo intermitente que vende excedentes, respaldo propio con SAE, o pagarlo'],
    ]);
}
function alActualizar(L, pag) {
    const { pide, ponerCifra, ponerLecturas, nivel, graficas } = pag;
    const a = L.a;
    const mw = L.mw;
    pintarBarras(L, pag);
    ponerCifra('aT', { viento: 'A dónde va el viento', control: 'Por qué gira un aspa', ano: 'Más arriba, más viento', estela: 'La estela, desde arriba' }[pide.modo]);
    if (pide.modo === 'viento') {
        const aviso = L.parado ? `Más de ${f1(TURBINA.Vparo)} m/s: las aspas de canto y el freno puesto. Regresa cuando baje de ${num(TURBINA.Vregresa)} m/s.` : L.v < TURBINA.Varranque ? `Abajo de ${TURBINA.Varranque} m/s no alcanza ni para moverse.` : L.beta > 1 ? `Sobra viento: las aspas se giran ${num(L.beta)}° para no pasar de ${f2(TURBINA.mw)} MW.` : null;
        ponerLecturas([['A la red', f2(mw), 'MW'], ['Viento', f1(L.v), 'm/s'], ['Rotor', f1(L.rpm), 'vueltas por minuto'], ['Paso', num(L.beta), '°'], ['Toma del viento', num(a.cp * 100), '%'], ['Los 123', num(L.parque), 'MW']], aviso);
        ponerCifra('hud', `${f2(mw)} MW`);
        ponerCifra('hud2', `un aerogenerador, con ${f1(L.v)} m/s`);
        graficas.b?.marcar(clamp(L.v, 0, 30), mw);
        graficas.c?.marcar(clamp(a.lambda || 2, 2, 14), a.cp * 100);
        nivel(1, 'Potencia', clamp01(mw / TURBINA.mw), `${num((mw / TURBINA.mw) * 100)} %`);
        nivel(2, 'Rotor', clamp01(L.rpm / 12), `${f1(L.rpm)} rpm`);
    } else if (pide.modo === 'control') {
        const aviso = L.beta > 18 ? 'Con tanto paso, el aspa ya casi no toma viento.' : L.desvio > 20 ? 'Tan desviada, al rotor le llega mucho menos viento de frente.' : null;
        ponerLecturas([['A la red', f2(mw), 'MW'], ['Viento', f1(L.v), 'm/s'], ['Paso', num(L.beta), '°'], ['Desvío', num(L.desvio), '°'], ['Toma del viento', num(a.cp * 100), '%'], ['Rotor', f1(L.rpm), 'vueltas por minuto']], aviso);
        ponerCifra('hud', `${f2(mw)} MW`);
        ponerCifra('hud2', `con ${num(L.beta)}° de paso y ${num(L.desvio)}° de desvío`);
        graficas.b?.marcar(clamp(L.beta, 0, 40), aerogenerador(pide.v, { paso: L.beta }).mw);
        graficas.c?.marcar(L.desvio, aerogenerador(pide.v, { desvio: L.desvio }).mw);
        nivel(1, 'Potencia', clamp01(mw / TURBINA.mw), `${num((mw / TURBINA.mw) * 100)} %`);
        nivel(2, 'Paso', clamp01(L.beta / 90), `${num(L.beta)}°`);
    } else if (pide.modo === 'ano') {
        const A = anual({ sitio: pide.sitio, buje: pide.buje });
        const M = A.meses[L.mes - 1];
        ponerLecturas([['Viento medio', f1(M.media), 'm/s en el buje'], ['Este mes', f2(M.gwh), 'GWh'], ['Al año', f1(A.gwh), 'GWh'], ['Factor de planta', num(A.factor * 100), '%'], ['Los 123, al año', num(A.parque), 'GWh'], ['Aire', f2(M.rho), 'kg/m³']], null);
        ponerCifra('hud', `${f1(M.media)} m/s`);
        ponerCifra('hud2', `${L.S.corto}, ${MESES[L.mes - 1].toLowerCase()}, a ${num(pide.buje)} m`);
        graficas.c?.marcar(L.mes, M.gwh);
        nivel(1, 'Este mes', clamp01(M.factor), `${num(M.factor * 100)} %`);
        nivel(2, 'Año', clamp01(A.factor), `${num(A.factor * 100)} %`);
    } else {
        const F = L.fila;
        const aviso = pide.sep < 5 ? 'Tan cerca, la de atrás recibe mucho menos viento y más revuelto.' : pide.sep > 10 ? 'Tan separadas se pierde poco, pero caben menos en el terreno.' : null;
        ponerLecturas([['Primero', f2(F.lista[0].mw), 'MW'], ['Segundo', f2(F.lista[1].mw), 'MW'], ['Tercero', f2(F.lista[2].mw), 'MW'], ['Los tres', f2(F.total), 'MW'], ['Se pierde', num(F.perdida * 100), '%'], ['Separación', num(pide.sep * TURBINA.D), 'm']], aviso);
        ponerCifra('hud', `${f2(F.total)} MW`);
        ponerCifra('hud2', `los tres, a ${num(pide.sep, 1)} diámetros`);
        graficas.b?.marcar(pide.sep, L.v * (1 - deficit(pide.sep, a.Ct)));
        graficas.c?.marcar(pide.sep, F.perdida * 100);
        nivel(1, 'El de atrás', clamp01(F.lista[2].mw / Math.max(F.lista[0].mw, 0.01)), `${num((F.lista[2].mw / Math.max(F.lista[0].mw, 0.01)) * 100)} %`);
        nivel(2, 'Se pierde', clamp01(F.perdida), `${num(F.perdida * 100)} %`);
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
    modo0: 'viento',
    pide: { v: DEF.v, mes: DEF.mes, sitio: DEF.sitio, buje: DEF.buje, sep: DEF.separacion, paso: DEF.paso, desvio: DEF.desvio, pideTormenta: false },
    general: { Lx: 15.2, Lz: 8.6, alto: 6.4, mira: [0.1, 2.5, 0], az: -24, el: 20, azVertical: -18, elVertical: 24 },
    etiquetas: { lienzo: 'Central eólica en 3D: arrastra para girarla, toca un punto para conocerlo', modos: 'Qué ver en la central', puntos: 'Puntos clave de la central' },
    textoFinal: 'Toca cualquier punto para volver a verlo. Sube el viento hasta que se detenga, gira las aspas en «Control», compara Reynosa con el Istmo en «Un año» o junta las máquinas en «Estela».',
    colores: { fondoTinta: '#3a3b40', elec: FLUIDOS.ca.color, aire: FLUIDOS.aire.color, frio: '#8d939b', guindaSuave: '#d89aae', panel: '#4b6fb5', claro: '#ffffff' },
    crearDiagrama,
    secciones,
    escena: (renderer, scene, { movil, oscuro }) => {
        const M = materiales(P_PLANTA);
        const est = escenario(renderer, scene, M, { movil, oscuro });
        return { planta: construir(M, P_PLANTA, { movil, oscuro }), est };
    },
    alCambiarModo: (p, m) => {
        p.corre = false;
        if (m === 'control') { p.paso = 0; p.desvio = 0; if (![6, 9, 12, 16].includes(p.v)) p.v = 9; }
        if (m === 'estela') p.v = 9;
        if (p.modo === 'control') { p.paso = 0; p.desvio = 0; }
    },
    alCuadro: ({ dt, pide }) => {
        if (pide.pideTormenta) { planta = { ...planta, tormenta: 0 }; pide.pideTormenta = false; }
        const S = SITIOS[pide.sitio];
        const m = clamp(Math.round(pide.mes), 1, 12) - 1;
        const v = pide.modo === 'ano' ? vientoA(S.ws50[m], pide.buje) : pide.v;
        const control = pide.modo === 'control';
        planta = pasoPlanta(planta, { v, desvio: control ? pide.desvio : 0, paso: control ? pide.paso : null }, dt);
    },
    poseDe: ({ pide, ve, encendido, t, dt, camara }) => pose({ modo: pide.modo, planta, v: pide.v, mes: clamp(Math.round(pide.mes), 1, 12), sitio: pide.sitio, buje: pide.buje, separacion: pide.sep, paso: pide.paso, desvio: pide.desvio, noche: ve.noche, adentro: ve.adentro, desarme: ve.desarme, encendido, t, dt, camara }),
    firma: p => [p.modo, Math.round(p.mes), p.sitio, p.buje, p.modo === 'estela' || p.modo === 'control' ? p.v : 0],
    alPintarFijas,
    alPintarGraficas,
    alActualizar,
    prueba: p => ({ v: +planta.v.toFixed(2), rpm: +planta.rpm.toFixed(2), beta: +planta.beta.toFixed(1), parado: planta.parado, desvio: +planta.desvio.toFixed(1), tormenta: +planta.tormenta.toFixed(2), mes: Math.round(p.mes), sitio: p.sitio, buje: p.buje, sep: p.sep }),
});
