// «Red Nacional de Transmisión», en 3D y con el formato Búho de «¿Cómo funciona?». Con las medidas de la línea de 400 kV Minatitlán Dos –
// Temascal Dos de la CFE, en Veracruz: 225 km, 659 torres y dos cables Bluejay por fase. Cuatro formas de verla: llevar la energía lejos,
// el cable que se calienta y se cuelga, qué tan lejos se puede, y un rayo y un incendio.
// Se arma con: node scripts/build-conceptos-3d.mjs red-transmision
//
// Lo que se repite entre las plantas con física está en conceptos-3d/planta-comun/.
import { clamp01, num } from '../planta-comun/ayudas.js';
import { barrasHTML, leyenda, pintarGrafica, seccionBarras, seccionColores, seccionDiagrama, seccionFuentes, seccionGrafica, seccionTabla, tablaHTML } from '../planta-comun/graficas.js';
import { crearPagina } from '../planta-comun/pagina.js';
import { AISLADOR, ANGULO, BLUEJAY, CATALOGO, CLARO, DEF, EVENTO2020, FLUIDOS, LIMITES, LINEA, PARTES as PARTES_M, PIE, REACTOR, SIL, TENSE, TORRE, VIENTOS, VOLTAJES, ALFA, corrienteCritica, estadoPlanta, flechaA, lejos, limites, pasoPlanta, pose, temperaturaCon, tensionA, vacio, voltajeAislador } from './modelo.js';
import { P_PLANTA, construir, escenario, materiales } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';

const FIGURA = 'red-transmision';
const f1 = x => num(x, 1);
const toneladas = N => N / 9806.65;

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'salida', nombre: 'Subestación de salida', modo: 'lejos', accion: 'mas', eq: `Sale por dos líneas de ${LINEA.kV} kV`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 20h16M6 20V9l6-5 6 5v11M9 13h6M9 16h6"/>',
        texto: 'Aquí empiezan las dos líneas. Cada fase tiene su propio interruptor: en 400 kV se puede abrir una fase sola y volver a cerrarla. Las barras juntan la energía antes de mandarla. Las medidas son las de la línea Minatitlán Dos – Temascal Dos de la CFE, de 225 km; junto a ella se dibuja una segunda línea.' },
    { parte: 'remate', nombre: 'Torre de remate', modo: 'calor', accion: 'calorMax', eq: `Cada cable jala con unas ${num(toneladas(tensionA(TENSE.ref)), 1)} toneladas`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M8 21 12 3l4 18M6 8h12M9 14h6"/>',
        texto: 'Donde la línea empieza, termina o da vuelta, la torre aguanta el jalón de los cables: cada uno tira con unas 3 toneladas. Por eso es más robusta, y sus aisladores van acostados, en el sentido del cable. Un puente pasa la corriente por debajo de la cruceta, de un lado al otro.' },
    { parte: 'suspension', nombre: 'Torre de suspensión', modo: 'calor', accion: 'calorMax', eq: `Fases a ${num(TORRE.altura, 1)} m del suelo y a ${num(TORRE.fases[1] - TORRE.fases[0], 1)} m una de otra`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M7 21 12 4l5 17M5 8h14M12 4v4"/>',
        texto: 'La mayoría de las 659 torres de la línea solo cuelgan los cables. Cada fase va en su cadena de aisladores, a 26.2 m de altura y a 12.5 m de la otra, para que el aire entre ellas las aísle. Entre torre y torre hay, en promedio, 342 m.' },
    { parte: 'haz', nombre: 'Dos cables por fase', modo: 'lejos', accion: 'voltaje', eq: `Bluejay de ${num(BLUEJAY.kcmil)} kcmil, a ${num(TORRE.separacion * 100)} cm uno del otro`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="8" cy="12" r="3.5"/><circle cx="16" cy="12" r="3.5"/>',
        texto: 'Cada fase lleva dos cables de aluminio con alma de acero, llamados Bluejay, a 45 cm uno del otro. Repartir la corriente en dos los calienta menos, y juntos se comportan como un cable más grueso: la línea puede llevar más energía. Cambia el voltaje para ver cuánta corriente le toca a cada uno.' },
    { parte: 'separadores', nombre: 'Separadores', modo: 'calor', accion: 'viento', eq: 'El primero a 25 o 30 m de la torre', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 8h16M4 16h16M9 8v8M15 8v8"/>',
        texto: 'Mantienen los dos cables de cada fase a la misma distancia; sin ellos, se golpearían entre sí. El primero va a 25 o 30 m de la torre, y los demás a no más de 75 m entre ellos. Aquí se dibujan tres por claro.' },
    { parte: 'amortiguadores', nombre: 'Amortiguadores', modo: 'calor', accion: 'viento', eq: 'Pesas que frenan la vibración', recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 4v8M5 12h14"/><circle cx="5" cy="12" r="2.5"/><circle cx="19" cy="12" r="3"/>',
        texto: 'El viento hace vibrar los cables. Con los años, esa vibración cansa los alambres de aluminio y los puede romper. Estas dos pesas, colgadas cerca de la torre, frenan la vibración. Dónde van se decide con lo que miden registradores de vibración.' },
    { parte: 'aisladores', nombre: 'Aisladores', modo: 'falla', accion: 'rayo', eq: `Aguantan ${num(AISLADOR.aguanta)} kV de un rayo`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 3v18M8 7h8M7 11h10M8 15h8"/>',
        texto: 'Sostienen el cable sin dejar pasar la corriente a la torre. Los de esta línea son de polímero, con faldas. Aguantan 1,480 kV de un rayo; si el voltaje pasa de eso, salta un arco por fuera y la fase queda en falla hasta que las protecciones la abren.' },
    { parte: 'guarda', nombre: 'Hilos de guarda', modo: 'falla', accion: 'rayo', eq: `A ${num(TORRE.alturaGuarda, 2)} m, arriba de las fases`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 6c6 4 12 4 18 0M3 14c6 4 12 4 18 0"/>',
        texto: 'Son los dos cables de hasta arriba. No llevan energía: reciben los rayos antes que las fases y los mandan a tierra por la torre. Son de acero con aluminio, y pueden llevar fibra óptica por dentro. Según la tesis de esta línea, más de 60 de cada 100 salidas por falla de la última década fueron por rayos.' },
    { parte: 'tierras', nombre: 'Tierras de la torre', abrir: true, modo: 'falla', accion: 'tierraMala', eq: `La CFE pide ${PIE.maximo} Ω como máximo`, recorrido: { noche: false, adentro: true },
        icono: '<path d="M12 3v9M5 12h14M8 16h8M10.5 20h3"/>',
        texto: 'Cuando un rayo pega en el hilo de guarda, su corriente baja por la torre al suelo. Si el suelo la recibe mal, la torre sube de voltaje y un arco salta de la torre a la fase, al revés de lo normal. Por eso cada pata lleva varillas y cables enterrados, y la CFE pide no más de 10 Ω.' },
    { parte: 'flecha', nombre: 'La flecha', abrir: true, modo: 'calor', accion: 'calorMax', eq: `A 25 °C el cable baja ${f1(flechaA(25))} m a media distancia`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 6c5 10 13 10 18 0M12 14v6"/>',
        texto: 'Entre torre y torre el cable cuelga: eso es la flecha. Con el calor, el aluminio se estira y el cable baja: entre 25 y 75 °C, unos 2 m en un claro medio. Por eso la CFE coloca las torres pensando en el cable a 50 °C y sin viento, y revisa que no quede nada debajo.' },
    { parte: 'derecho', nombre: 'Derecho de vía', modo: 'falla', accion: 'incendio', eq: 'Una franja libre bajo cada línea', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 4v16M20 4v16M4 12h16"/>',
        texto: 'Bajo la línea queda una franja sin árboles altos ni construcciones: en una de dos circuitos de 400 kV en Jalisco, de 36.5 a 38.6 m de ancho. Una brecha deja revisarla a pie, y también se patrulla en helicóptero. Si un incendio llega abajo, el humo y la ceniza pueden hacer saltar un arco.' },
    { parte: 'segunda', nombre: 'La otra línea', modo: 'falla', accion: 'incendio', eq: 'Si sale una, la otra lleva todo', recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 8h18M3 16h18"/>',
        texto: 'Dos líneas entre las mismas subestaciones se respaldan: si una sale, la otra lleva toda la energía. Pero si van juntas, un mismo incendio puede sacar a las dos. Así pasó el 28 de diciembre de 2020 entre Nuevo León y Tamaulipas: salieron con 69 segundos de diferencia.' },
    { parte: 'reactor', nombre: 'Reactor', abrir: true, modo: 'limite', accion: 'abrir', eq: `${num(REACTOR.mvar)} MVAr por línea (de ejemplo)`, recorrido: { noche: false, adentro: true },
        icono: '<rect x="5" y="7" width="14" height="12" rx="2"/><path d="M12 3v4M9 11c1.5-2 4.5-2 6 0M9 15c1.5-2 4.5-2 6 0"/>',
        texto: 'Una línea larga también funciona como un capacitor: da energía reactiva. Con poca carga, o abierta en una punta, esa reactiva sube el voltaje al final: es el efecto Ferranti. El reactor, una gran bobina, absorbe lo que sobra. Prueba a abrir la punta de llegada.' },
    { parte: 'llegada', nombre: 'Subestación de llegada', modo: 'limite', accion: 'lejos600', eq: `A ${num(LINEA.km)} km de la de salida`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 20h16M6 20V9l6-5 6 5v11M10 20v-5h4v5"/>',
        texto: 'La energía llega a sus barras y sigue a otras líneas y a las ciudades. Aquí también se sostiene el voltaje, y entre las dos puntas se abre un ángulo: entre más energía pasa, más grande. Si crece demasiado, las centrales de las dos puntas se salen de paso; por eso se deja margen.' },
];
const VISTAS = Object.fromEntries(PARTES_M.map(p => [p.id, p.vista]));
const MODOS = {
    lejos: { nombre: 'Llevar la energía lejos', corto: 'Lejos', resumen: `Por las dos líneas van ${num(DEF.P)} MW. Con más voltaje, la misma energía necesita menos corriente, y los cables se calientan y pierden menos. Cambia la energía y prueba con 230 o 115 kV.`, aclara: 'Con los mismos cables a cualquier voltaje, para comparar. En la red, cada voltaje lleva sus propios cables y torres.', mando: { nombre: 'Energía', campo: 'P', rango: LIMITES.P, texto: v => `${num(v)} MW` } },
    calor: { nombre: 'El cable se calienta', corto: 'Calor', resumen: 'La corriente calienta los cables, y también el sol; el viento y lo que irradian los enfrían. Más calientes, se estiran y bajan. Sube la energía o el calor del día, o quita el viento.', aclara: 'El balance de calor de la norma IEEE 738, con el cable Bluejay. El clima es de ejemplo.', mando: { nombre: 'Energía', campo: 'P', rango: LIMITES.P, texto: v => `${num(v)} MW` }, mando2: { nombre: 'Calor del día', campo: 'Ta', rango: LIMITES.Ta, texto: v => `${num(v)} °C` } },
    limite: { nombre: 'Qué tan lejos', corto: 'Distancia', resumen: 'Entre más larga la línea, menos puede llevar: primero la limita el calor de sus cables y después la estabilidad. Con poca carga, el voltaje sube a la mitad; con mucha, baja. Alarga la línea o ábrela en una punta.', aclara: 'Las dos puntas sostienen su voltaje. El margen de 30° y el reactor son de ejemplo.', mando: { nombre: 'Largo', campo: 'km', rango: LIMITES.km, texto: v => `${num(v)} km` }, mando2: { nombre: 'Energía', campo: 'P', rango: LIMITES.P, texto: v => `${num(v)} MW` } },
    falla: { nombre: 'Un rayo y un incendio', corto: 'Fallas', resumen: 'Si un rayo pega en el hilo de guarda y la tierra de la torre es mala, salta un arco: la fase se abre y se vuelve a cerrar. Un incendio bajo las dos líneas puede sacarlas a ambas, como en 2020. Cambia la fuerza del rayo y la tierra.', aclara: 'El rayo va en cámara lenta. El incendio sigue los tiempos del 28 de diciembre de 2020.', mando: { nombre: 'Fuerza del rayo', campo: 'kA', rango: LIMITES.kA, texto: v => `${num(v)} kA` }, mando2: { nombre: 'Tierra de la torre', campo: 'R', rango: LIMITES.R, texto: v => `${f1(v)} Ω` } },
};
let planta = estadoPlanta();
const vientoDe = v => VIENTOS.find(w => Math.abs(w.v - v) < 1e-6) ?? VIENTOS[0];
const BOTONES = [
    { id: 'kV', visible: p => p.modo === 'lejos', pulsado: p => p.kV !== 400, texto: p => `A ${num(p.kV)} kV`, alTocar: p => { p.kV = VOLTAJES[(VOLTAJES.indexOf(p.kV) + 1) % VOLTAJES.length]; } },
    { id: 'viento', visible: p => p.modo === 'calor', pulsado: p => p.v !== DEF.v, texto: p => vientoDe(p.v).texto, alTocar: p => { p.v = VIENTOS[(VIENTOS.indexOf(vientoDe(p.v)) + 1) % VIENTOS.length].v; } },
    { id: 'sol', visible: p => p.modo === 'calor', pulsado: p => !p.sol, texto: p => (p.sol ? 'De día, con sol' : 'De noche, sin sol'), alTocar: p => { p.sol = !p.sol; } },
    { id: 'reactor', visible: p => p.modo === 'limite', pulsado: p => p.reactor, texto: p => (p.reactor ? 'Con reactores' : 'Sin reactores'), alTocar: p => { p.reactor = !p.reactor; } },
    { id: 'abierta', visible: p => p.modo === 'limite', pulsado: p => p.abierta, texto: p => (p.abierta ? 'Cerrar la punta de llegada' : 'Abrir la punta de llegada'), alTocar: p => { p.abierta = !p.abierta; } },
    { id: 'rayo', visible: p => p.modo === 'falla', pulsado: () => false, texto: () => 'Que caiga un rayo', alTocar: p => { p.rayo = true; } },
    { id: 'incendio', visible: p => p.modo === 'falla', pulsado: p => p.incendio, texto: p => (p.incendio ? 'Apagar el fuego' : 'Incendio bajo las líneas'), alTocar: p => { p.incendio = !p.incendio; } },
];
const ACCIONES = {
    mas: { texto: p => (p.P > 1500 ? `Regresar a ${num(DEF.P)} MW` : 'Subir a 2,400 MW'), hacer: (p, pag) => { p.P = p.P > 1500 ? DEF.P : 2400; pag.invalidar(); pag.ponerMando(); } },
    voltaje: { texto: p => (p.kV === 400 ? 'Probar con 230 kV' : 'Regresar a 400 kV'), hacer: (p, pag) => { p.kV = p.kV === 400 ? 230 : 400; pag.invalidar(); pag.rotular(); } },
    calorMax: { texto: p => (p.Ta > 35 ? 'Regresar a un día normal' : 'Un día de 40 °C con 2,400 MW'), hacer: (p, pag) => { const caliente = p.Ta > 35; p.Ta = caliente ? DEF.Ta : 40; p.P = caliente ? DEF.P : 2400; pag.invalidar(); pag.ponerMando(); } },
    viento: { texto: p => (p.v < 0.5 ? 'Regresar el viento' : 'Quitar el viento'), hacer: (p, pag) => { p.v = p.v < 0.5 ? DEF.v : 0.2; pag.invalidar(); pag.rotular(); } },
    rayo: { texto: () => 'Que caiga un rayo', hacer: p => { p.rayo = true; } },
    tierraMala: { texto: p => (p.R > 20 ? `Tierra de ${f1(DEF.R)} Ω y un rayo` : 'Tierra de 30 Ω y un rayo'), hacer: (p, pag) => { p.R = p.R > 20 ? DEF.R : 30; p.rayo = true; pag.invalidar(); pag.ponerMando(); } },
    incendio: { texto: p => (p.incendio ? 'Apagar el fuego' : 'Incendio bajo las líneas'), hacer: (p, pag) => { p.incendio = !p.incendio; pag.invalidar(); pag.rotular(); } },
    abrir: { texto: p => (p.abierta ? 'Cerrar la punta de llegada' : 'Abrir la punta de llegada'), hacer: (p, pag) => { p.abierta = !p.abierta; pag.invalidar(); pag.rotular(); } },
    lejos600: { texto: p => (p.km > 400 ? `Regresar a ${num(LINEA.km)} km` : 'Alargarla a 600 km'), hacer: (p, pag) => { p.km = p.km > 400 ? LINEA.km : 600; pag.invalidar(); pag.ponerMando(); } },
};

// ------------------------------------------------------------------ el tablero
const secciones = () => `
    ${seccionDiagrama('Lo que pasa en la línea')}
    ${seccionGrafica('b')}
    ${seccionGrafica('c')}
    ${seccionBarras()}
    ${seccionTabla('La línea Minatitlán Dos – Temascal Dos', 'h-linea', 'De la CFE, en el sur de Veracruz, según una tesis del Tecnológico de Ciudad Madero de 2019 con datos de la Gerencia Regional de Transmisión Oriente.', 'h-tabla-texto')}
    ${seccionTabla('El cable Bluejay', 'h-cable', 'Del catálogo de Prysmian. La dilatación se calcula por la proporción de aluminio y acero.', 'h-tabla-texto')}
    ${seccionTabla('El 28 de diciembre de 2020', 'h-2020', 'Según el comunicado del CENACE, su informe del segundo semestre de 2020 y la explicación de la CFE.', 'h-tabla-texto')}
    ${seccionTabla('Cómo se cuida una línea', 'h-cuida', 'Del programa de mantenimiento de unas líneas de 400 kV en Jalisco, en su manifestación de impacto ambiental.', 'h-tabla-texto')}
    ${seccionTabla('Lo que dice la ley', 'h-regla', 'Ley del Sector Eléctrico y su Reglamento.')}
    ${seccionColores(FLUIDOS, 'Tiene las medidas de la línea Minatitlán Dos – Temascal Dos, pero no es su plano ni un simulador, y nada está a escala: los claros van muy recortados y la separación de los dos cables de cada fase, aumentada. La segunda línea, el río, el sentido de la energía, el clima, los reactores, el margen de 30° y la cuenta del voltaje del aislador con el rayo son de ejemplo.', 'Colores de lo que corre')}
    ${seccionFuentes(FUENTES, [
        { para: 'Qué es la Red Nacional de Transmisión, quién la amplía, quién la opera y los terrenos que necesita', titulo: 'Ley del Sector Eléctrico, arts. 3, 13, 14, 44, 47, 57, 90 y 91', nota: 'Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio' },
        { para: 'El aviso a la SENER y a la SEDATU cuando se negocia un terreno para una línea', titulo: 'Reglamento de la Ley del Sector Eléctrico, art. 222', nota: 'Está en el acervo de este sitio' },
    ])}`;

function alPintarGraficas(L, pag) {
    const { $, pide, graficas } = pag;
    const m = pide.modo;
    graficas.b = null;
    graficas.c = null;
    const serieKV = { 400: 'h-s-actual', 230: 'h-s-max', 115: 'h-s-sin' };
    if (m === 'lejos') {
        const lb = VOLTAJES.map(kV => ({ clase: serieKV[kV], nombre: `${kV} kV`, f: P => lejos({ P, kV }).pct * 100 }));
        $('#h-b-t').textContent = 'Lo que se pierde, según la energía';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `De cada 100 MW que salen, cuántos se van en calor en ${num(LINEA.km)} km. La corriente crece con la energía, y las pérdidas, con el cuadrado de la corriente. Con el doble de voltaje, se pierde la cuarta parte.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Lo que se pierde', xMin: 0, xMax: 3000, yMin: 0, yMax: 40, ticksX: [0, 1000, 2000, 3000], ticksY: [0, 10, 20, 30, 40], etX: 'Energía, MW', etY: 'de cada 100', lineas: lb, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} MW · ${lb.map(l => `${l.nombre}: ${f1(l.f(x))}`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['MW', '400 kV', '230 kV', '115 kV'], [300, 600, 900, 1500, 2400].map(P => [num(P), ...VOLTAJES.map(kV => f1(lejos({ P, kV }).pct * 100))]));
        const lc = [...VOLTAJES.map(kV => ({ clase: serieKV[kV], nombre: `${kV} kV`, f: P => lejos({ P, kV }).Ic })), { clase: 'h-s-norma', nombre: `Aguanta ${num(BLUEJAY.ampacidad)} A`, f: () => BLUEJAY.ampacidad }];
        $('#h-c-t').textContent = 'La corriente de cada cable';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Amperes por cable, con dos cables por fase y las dos líneas. El catálogo da ${num(BLUEJAY.ampacidad)} A para que el cable no pase de ${CATALOGO.Tc} °C, con sol, aire a ${CATALOGO.Ta} °C y viento de ${num(CATALOGO.v, 2)} m/s.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'La corriente de cada cable', xMin: 0, xMax: 3000, yMin: 0, yMax: 3000, ticksX: [0, 1000, 2000, 3000], ticksY: [0, 1000, 2000, 3000], etX: 'Energía, MW', etY: 'A por cable', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} MW · ${lc.slice(0, 3).map(l => `${l.nombre}: ${num(l.f(x))} A`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['MW', '400 kV', '230 kV', '115 kV'], [300, 600, 900, 1500, 2400].map(P => [num(P), ...VOLTAJES.map(kV => num(lejos({ P, kV }).Ic))]));
    } else if (m === 'calor') {
        const cond = v => ({ Ta: L.Ta, v, sol: L.sol });
        const Tde = (P, v) => temperaturaCon(P / 2 / (Math.sqrt(3) * LINEA.kV) * 1000 / TORRE.haz, cond(v));
        const lb = [...VIENTOS.map((w, i) => ({ clase: ['h-s-actual', 'h-s-max', 'h-s-sin'][i], nombre: w.texto, f: P => Tde(P, w.v) })), { clase: 'h-s-norma', nombre: `${CATALOGO.Tc} °C`, f: () => CATALOGO.Tc }];
        $('#h-b-t').textContent = 'La temperatura del cable, según la energía';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `Con el aire a ${num(L.Ta)} °C${L.sol ? ' y sol' : ', de noche'}. El viento es lo que más enfría: casi sin viento, el mismo cable se calienta mucho más.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'La temperatura del cable', xMin: 0, xMax: 3000, yMin: 0, yMax: 160, ticksX: [0, 1000, 2000, 3000], ticksY: [0, 40, 80, 120, 160], etX: 'Energía, MW', etY: '°C', lineas: lb, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} MW · ${lb.slice(0, 3).map(l => `${l.nombre}: ${num(l.f(x))} °C`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['MW', ...VIENTOS.map(w => w.texto)], [600, 1200, 1800, 2400, 3000].map(P => [num(P), ...VIENTOS.map(w => num(Tde(P, w.v)))]));
        const lc = [{ clase: 'h-s-actual', nombre: 'Flecha', f: T => flechaA(T) }];
        $('#h-c-t').textContent = 'Cuánto baja el cable con el calor';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Metros que cuelga a media distancia, en un claro medio de ${num(CLARO)} m. Se estira ${num(ALFA * 1e6, 1)} millonésimas de su largo por cada grado. La CFE coloca las torres con la flecha a ${TENSE.diseno} °C.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'La flecha', xMin: 0, xMax: 120, yMin: 7, yMax: 14, ticksX: [0, 25, 50, 75, 100, 120], ticksY: [7, 9, 11, 13], etX: 'Temperatura del cable, °C', etY: 'm', lineas: lc, refsX: [{ x: TENSE.diseno, texto: 'Diseño' }], fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} °C · baja ${f1(flechaA(x))} m · queda a ${f1(TORRE.altura - flechaA(x))} m del suelo plano` });
        $('#h-tabla-c').innerHTML = tablaHTML(['°C', 'Flecha, m', 'Al suelo, m'], [0, 25, 50, 75, 100].map(T => [num(T), f1(flechaA(T)), f1(TORRE.altura - flechaA(T))]));
    } else if (m === 'limite') {
        const lb = [
            { clase: 'h-s-sin', nombre: 'El calor de los cables', f: km => limites({ km }).termico },
            { clase: 'h-s-max', nombre: `La estabilidad, ${ANGULO}°`, f: km => limites({ km }).estabilidad },
            { clase: 'h-s-norma', nombre: 'Potencia natural', f: () => SIL * 2 },
        ];
        $('#h-b-t').textContent = 'Cuánto pueden llevar las dos, según el largo';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `MW. Manda el más bajo de los dos límites. Una línea corta la limita el calor; una larga, la estabilidad. Con ${num(L.km)} km pueden llevar ${num(L.lim.manda)} MW, ${f1(L.lim.manda / L.sil)} veces su potencia natural.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Cuánto pueden llevar', xMin: 50, xMax: 600, yMin: 0, yMax: 4000, ticksX: [50, 200, 400, 600], ticksY: [0, 1000, 2000, 3000, 4000], etX: 'Largo, km', etY: 'MW', lineas: lb, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} km · calor: ${num(lb[0].f(x))} MW · estabilidad: ${num(lb[1].f(x))} MW` });
        $('#h-tabla-b').innerHTML = tablaHTML(['km', 'Calor', 'Estabilidad', 'Manda'], [60, 150, 225, 400, 600].map(km => { const l = limites({ km }); return [num(km), num(l.termico), num(l.estabilidad), l.cual === 'termico' ? 'el calor' : 'la estabilidad']; }));
        const lc = [
            { clase: 'h-s-sin', nombre: 'Sin reactor', f: km => vacio({ km }) * 100 },
            { clase: 'h-s-actual', nombre: 'Con reactor', f: km => vacio({ km, reactor: true }) * 100 },
            { clase: 'h-s-norma', nombre: '105 %', f: () => 105 },
        ];
        $('#h-c-t').textContent = 'El voltaje en la punta abierta';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Por ciento de ${LINEA.kV} kV, si la línea se energiza desde un solo lado. Sube con el cuadrado del largo. Un reactor de ${num(REACTOR.mvar)} MVAr, de ejemplo, lo regresa.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'La punta abierta', xMin: 50, xMax: 600, yMin: 95, yMax: 140, ticksX: [50, 200, 400, 600], ticksY: [95, 105, 115, 125, 135], etX: 'Largo, km', etY: '% de 400 kV', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} km · sin reactor: ${f1(lc[0].f(x))} % · con reactor: ${f1(lc[1].f(x))} %` });
        $('#h-tabla-c').innerHTML = tablaHTML(['km', 'Sin reactor', 'Con reactor'], [100, 225, 400, 600].map(km => [num(km), f1(vacio({ km }) * 100), f1(vacio({ km, reactor: true }) * 100)]));
    } else {
        const lb = [
            { clase: 'h-s-actual', nombre: `Con ${f1(L.R)} Ω`, f: kA => voltajeAislador(kA, L.R) },
            { clase: 'h-s-max', nombre: `Con ${PIE.maximo} Ω`, f: kA => voltajeAislador(kA, PIE.maximo) },
            { clase: 'h-s-sin', nombre: 'Con 1 Ω', f: kA => voltajeAislador(kA, 1) },
            { clase: 'h-s-norma', nombre: `Aguanta ${num(AISLADOR.aguanta)} kV`, f: () => AISLADOR.aguanta },
        ];
        $('#h-b-t').textContent = 'El voltaje en el aislador, según el rayo';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `kV. Entre peor la tierra de la torre, más sube con el mismo rayo. La cuenta está ajustada para dar los 1,610 kV de la simulación de la tesis con un rayo de 45 kA: es de ejemplo.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'El voltaje en el aislador', xMin: 10, xMax: 150, yMin: 0, yMax: 6000, ticksX: [10, 50, 100, 150], ticksY: [0, 2000, 4000, 6000], etX: 'Rayo, kA', etY: 'kV', lineas: lb, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} kA · ${lb.slice(0, 3).map(l => `${l.nombre}: ${num(l.f(x))} kV`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['kA', `${f1(L.R)} Ω`, `${PIE.maximo} Ω`, '1 Ω'], [20, 40, 60, 100, 150].map(kA => [num(kA), num(lb[0].f(kA)), num(lb[1].f(kA)), num(lb[2].f(kA))]));
        $('#h-c-t').textContent = 'El rayo que ya rompe el aislamiento, según la tierra';
        $('#h-c-ley').textContent = '';
        $('#h-c-pie').textContent = `kA. Con una tierra de ${PIE.maximo} Ω, la que pide la CFE como máximo, basta un rayo de ${num(corrienteCritica(PIE.maximo))} kA; con 1 Ω, hace falta uno de ${num(corrienteCritica(1))} kA. Los rayos van de 1 a 200 kA.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'El rayo que rompe el aislamiento', xMin: 1, xMax: 60, yMin: 0, yMax: 70, ticksX: [1, 10, 20, 40, 60], ticksY: [0, 20, 40, 60], etX: 'Tierra de la torre, Ω', etY: 'kA', f: corrienteCritica, refsX: [{ x: PIE.maximo, texto: 'CFE' }], fx: x => num(x), fy: y => num(y), punta: x => `${f1(x)} Ω · rompe con ${num(corrienteCritica(x))} kA` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Ω', 'Rompe con, kA'], [1, 5, 10, 20, 40, 60].map(R => [num(R), num(corrienteCritica(R))]));
    }
}
function pintarBarras(L, pag) {
    const { $, pide } = pag;
    let filas;
    if (pide.modo === 'lejos') {
        filas = [{ t: 'Llega', v: 1 - L.pct, activa: true, d: 1 }, { t: 'Se va en calor', v: L.pct, d: 1 }];
        $('#h-d-t').textContent = 'De cada 100 MW que salen';
        $('#h-d-pie').textContent = `A ${num(L.kV)} kV, con ${num(L.P)} MW. Lo que se pierde calienta los cables y el aire alrededor.`;
    } else if (pide.modo === 'calor') {
        const entra = Math.max(0.01, L.joule + L.solar);
        filas = [{ t: 'Lo calienta su corriente', v: L.joule / entra, activa: true }, { t: 'Lo calienta el sol', v: L.solar / entra }, { t: 'Se lo lleva el viento', v: L.conveccion / entra }, { t: 'Lo irradia', v: L.radiacion / entra }];
        $('#h-d-t').textContent = 'El calor, de cada 100 que entran';
        $('#h-d-pie').textContent = 'En equilibrio, lo que entra es lo mismo que sale: así se queda en su temperatura.';
    } else if (pide.modo === 'limite') {
        const P = L.abierta ? 0 : L.P;
        filas = [{ t: 'Del calor de los cables', v: P / L.lim.termico, activa: L.lim.cual === 'termico', escala: 1.2 }, { t: 'De la estabilidad', v: P / L.lim.estabilidad, activa: L.lim.cual === 'estabilidad', escala: 1.2 }, { t: 'De su potencia natural', v: P / L.sil, escala: 1.2 }];
        $('#h-d-t').textContent = 'Qué tanto usan de cada límite, de cada 100';
        $('#h-d-pie').textContent = `Con ${num(P)} MW y ${num(L.km)} km. Si una barra pasa de 100, la línea se saldría de lo seguro.`;
    } else {
        filas = [{ t: 'Voltaje del aislador', v: L.S.V / AISLADOR.aguanta, activa: L.S.salta, escala: 1.5 }, { t: 'Tierra de la torre', v: L.R / PIE.maximo, escala: 1.5 }, { t: 'Corriente de la línea que queda', v: (L.enUna.I) / (TORRE.haz * BLUEJAY.ampacidad), escala: 1.5 }];
        $('#h-d-t').textContent = 'De cada 100 de lo que aguanta';
        $('#h-d-pie').textContent = `Si sale una línea, la otra lleva los ${num(EVENTO2020.flujo)} MW: ${num(L.enUna.I)} A por fase, y el calor de sus cables todavía aguanta. Pero el ángulo entre las puntas llega a ${num(L.enUna.delta)}°.`;
    }
    $('#h-barras').innerHTML = barrasHTML(filas);
}
function alPintarFijas({ $ }) {
    $('#h-linea').innerHTML = tablaHTML(['Qué', 'Cuánto'], [
        ['Voltaje', `${num(LINEA.kV)} kV`],
        ['Largo', `${num(LINEA.km)} km`],
        ['Torres', `${num(LINEA.torres)}`],
        ['Claro medio', `${num(CLARO)} m`],
        ['Cables por fase', `${TORRE.haz} Bluejay, a ${num(TORRE.separacion * 100)} cm`],
        ['Fases', `a ${num(TORRE.altura, 1)} m de altura, ${num(TORRE.fases[1] - TORRE.fases[0], 1)} m entre sí`],
        ['Hilos de guarda', `2, de alumoweld 7 núm. 8, a ${num(TORRE.alturaGuarda, 2)} m`],
        ['Aisladores', 'De polímero'],
        ['Tierras medidas', '0.6 a 13.3 Ω por torre'],
    ]);
    $('#h-cable').innerHTML = tablaHTML(['Qué', 'Cuánto'], [
        ['Aluminio', `${num(BLUEJAY.kcmil)} kcmil, ${BLUEJAY.hilos} hilos de aluminio y acero`],
        ['Diámetro', `${num(BLUEJAY.D * 1000)} mm`],
        ['Peso', `${num(BLUEJAY.masa * 1000)} kg por km`],
        ['Se rompe con', '13,533 kgf'],
        ['Resistencia a 20 °C', `${num(BLUEJAY.Rcd20, 4)} Ω por km`],
        ['Resistencia a 75 °C', `${num(BLUEJAY.Rca75, 4)} Ω por km`],
        ['Corriente', `${num(BLUEJAY.ampacidad)} A con sol, aire a 25 °C y viento de 0.61 m/s`],
        ['Se estira', `${num(ALFA * 1e6, 1)} millonésimas por °C`],
    ]);
    $('#h-2020').innerHTML = tablaHTML(['Qué', 'Cuándo o cuánto'], [
        ['Sale la primera línea Güémez – Lajas; su recierre monopolar no sirve', EVENTO2020.primera],
        ['Sale la segunda', EVENTO2020.segunda],
        ['Lo que llevaban', `${num(EVENTO2020.flujo)} MW`],
        ['El incendio', `a ${EVENTO2020.km} km de la subestación Güémez, en un tramo de 1 km, con viento de ${EVENTO2020.viento} km/h`],
        ['La frecuencia', `subió a ${num(EVENTO2020.fMax, 2)} Hz y bajó a ${num(EVENTO2020.fMin, 1)} Hz`],
        ['Carga desconectada', `${num(EVENTO2020.carga)} MW, 26 % de la demanda`],
        ['Toda la carga de vuelta', '16:12, 1 h 44 min después'],
    ]);
    $('#h-cuida').innerHTML = tablaHTML(['Qué', 'Cada cuándo'], [
        ['Inspección mayor, pieza por pieza', 'una vez al año'],
        ['Inspecciones menores', 'dos al año'],
        ['Patrullaje en helicóptero o avioneta', 'programado'],
        ['Poda de árboles de más de 3 m', 'cada 4 años'],
        ['Medir la resistencia a tierra', 'cada 6 años'],
        ['Cambiar aislamiento con la línea energizada', 'cada año'],
    ]);
    $('#h-regla').innerHTML = tablaHTML(['Qué', 'Dónde lo dice'], [
        ['La Red Nacional de Transmisión lleva la energía a las Redes Generales de Distribución y a grandes usuarios', 'Ley, art. 3, fracc. XLI'],
        ['Operarla es parte del Control Operativo, exclusivo del Estado; lo ejerce el CENACE', 'Ley, arts. 3, fracc. XII, y 14'],
        ['Se amplía con los programas que autoriza la SENER, con la opinión de la CNE; la CFE los construye', 'Ley, arts. 13 y 47'],
        ['La CFE la opera con las instrucciones del CENACE, también para su mantenimiento', 'Ley, art. 44'],
        ['Es área estratégica; sus terrenos están sujetos a servidumbre legal', 'Ley, art. 57'],
        ['El uso de los terrenos se negocia con sus dueños, y se avisa a la SENER y a la SEDATU', 'Ley, arts. 90 y 91; Reglamento, art. 222'],
    ]);
}
function alActualizar(L, pag) {
    const { pide, ponerCifra, ponerLecturas, nivel, graficas } = pag;
    pintarBarras(L, pag);
    ponerCifra('aT', { lejos: 'Lo que sale y lo que llega', calor: 'Lo que calienta y lo que enfría', limite: 'El voltaje a lo largo de la línea', falla: 'La torre y las dos líneas' }[pide.modo]);
    if (pide.modo === 'lejos') {
        const aviso = !L.cabe ? `A ${num(L.kV)} kV, cada cable llevaría ${num(L.Ic)} A: más de los ${num(BLUEJAY.ampacidad)} que aguanta.` : L.pct > 0.1 ? `Se pierden más de 10 de cada 100 MW en el camino.` : null;
        ponerLecturas([['Voltaje', `${num(L.kV)} kV`, 'entre fases'], ['Corriente', `${num(L.I)} A`, 'por fase, en cada línea'], ['Cada cable', `${num(L.Ic)} A`, `a ${num(L.Tc)} °C`], ['Se pierden', `${num(L.perdida)} MW`, `${f1(L.pct * 100)} de cada 100`], ['Llegan', `${num(L.llega)} MW`, `a ${num(LINEA.km)} km`], ['En un año', `${num((L.perdida * 8760) / 1000)} GWh`, 'si fuera así todo el año']], aviso);
        ponerCifra('hud', `${num(L.perdida)} MW`);
        ponerCifra('hud2', 'se van en calor en el camino');
        graficas.b?.marcar(L.P, L.pct * 100);
        graficas.c?.marcar(L.P, L.Ic);
        nivel(1, 'Pérdidas', clamp01(L.pct / 0.3), `${f1(L.pct * 100)} %`);
        nivel(2, 'Cada cable', clamp01(L.Ic / BLUEJAY.ampacidad), `${num(L.Ic)} A`);
    } else if (pide.modo === 'calor') {
        const aviso = L.Tc > CATALOGO.Tc ? `El cable pasa de ${CATALOGO.Tc} °C, con la que el catálogo da su corriente: se acerca a dañarse y baja de más.` : L.Tc > TENSE.diseno ? `Más caliente que los ${TENSE.diseno} °C del diseño: el cable baja más de lo que se calculó al colocar las torres.` : null;
        ponerLecturas([['Energía', `${num(L.P)} MW`, 'por las dos líneas'], ['Cada cable', `${num(L.Ic)} A`, `con este clima, ${num(L.maxIc)} A lo llevan a ${CATALOGO.Tc} °C`], ['Cable', `${num(L.Tc)} °C`, `el aire, a ${num(L.Ta)} °C`], ['Flecha', `${f1(L.flecha)} m`, `${f1(L.diseno)} m a ${TENSE.diseno} °C`], ['Al suelo', `${f1(L.libre)} m`, 'a media distancia, en plano'], ['Jalón', `${f1(toneladas(tensionA(L.Tc)))} t`, 'de cada cable: menos con el calor']], aviso);
        ponerCifra('hud', `${num(L.Tc)} °C`);
        ponerCifra('hud2', 'en los cables');
        graficas.b?.marcar(L.P, L.Tc);
        graficas.c?.marcar(L.Tc, L.flecha);
        nivel(1, 'Cable', clamp01(L.Tc / 120), `${num(L.Tc)} °C`);
        nivel(2, 'Flecha', clamp01((L.flecha - 7) / 7), `${f1(L.flecha)} m`);
    } else if (pide.modo === 'limite') {
        const P = L.abierta ? 0 : L.P;
        const aviso = L.abierta ? (L.fin > 1.05 ? `La punta abierta llega a ${f1(L.fin * 100)} %: hace falta el reactor.` : null) : !L.ok ? 'No cabe: con este largo, las centrales de las dos puntas se saldrían de paso.' : P > L.lim.termico ? 'Los cables pasarían de su temperatura.' : L.delta > ANGULO ? `El ángulo pasa de ${ANGULO}°: queda poco margen si hay una falla.` : null;
        ponerLecturas([['Largo', `${num(L.km)} km`, 'de la línea'], ['Pasan', `${num(P)} MW`, 'por las dos líneas'], ['Ángulo', L.abierta ? '—' : `${f1(L.delta)}°`, 'entre las dos puntas'], ['Reactiva al final', L.abierta ? '—' : `${num(Math.abs(L.Qr))} MVAr`, L.abierta ? 'con la punta abierta' : L.Qr >= 0 ? 'la da la línea' : 'la pide la línea'], ['Punta abierta', `${f1((L.reactor ? L.conReactor : L.sinReactor) * 100)} %`, L.reactor ? 'con reactor' : 'sin reactor'], ['Pueden llevar', `${num(L.lim.manda)} MW`, L.lim.cual === 'termico' ? 'las limita el calor' : 'las limita la estabilidad']], aviso);
        ponerCifra('hud', L.abierta ? `${f1(L.fin * 100)} %` : `${f1(L.delta)}°`);
        ponerCifra('hud2', L.abierta ? 'en la punta abierta' : 'entre las dos puntas');
        graficas.b?.marcar(L.km, L.lim.manda);
        graficas.c?.marcar(L.km, (L.reactor ? L.conReactor : L.sinReactor) * 100);
        nivel(1, 'Uso', clamp01(P / L.lim.manda), `${num((P / L.lim.manda) * 100)} %`);
        nivel(2, 'Ángulo', clamp01((L.abierta ? 0 : L.delta) / 60), L.abierta ? '—' : `${num(L.delta)}°`);
    } else {
        const tr = L.tramoR;
        const tf = L.tramoF;
        const msgR = !tr ? null : tr.estado === 'golpe' ? 'El rayo pega en el hilo de guarda y baja por la torre.' : tr.estado === 'arco' ? 'La torre subió de voltaje: salta un arco al cable.' : tr.estado === 'monopolar' ? 'Las protecciones abren solo esa fase, en las dos puntas, y esperan.' : tr.estado === 'normal' ? 'Vuelven a cerrar: el arco ya se apagó y la línea sigue.' : 'El aislador aguantó: la línea ni se enteró.';
        const msgF = !tf ? null : { fuego: 'El fuego crece bajo las dos líneas.', arco1: 'El humo y la ceniza dejan pasar un arco: falla en la línea 1.', monopolar1: 'Abre esa fase y espera para volver a cerrar.', recierre1: 'Al volver a cerrar, el fuego sigue: falla otra vez.', una: `La línea 1 queda fuera; la 2 lleva todo, con ${num(L.enUna.delta)}° entre las puntas.`, arco2: 'El arco llega a la línea 2.', separadas: 'Las dos fuera: de un lado sobra energía y del otro falta. En 2020, la frecuencia subió a 61.82 Hz y bajó a 58.9 Hz.' }[tf.estado];
        const aviso = msgF ?? msgR;
        const queda = L.abiertas === 2 ? 'ninguna' : L.abiertas === 1 ? `${num(L.enUna.I)} A` : `${num(L.enDos.I)} A`;
        ponerLecturas([['Rayo', `${num(L.kA)} kA`, 'en el hilo de guarda'], ['Tierra', `${f1(L.R)} Ω`, `la CFE pide ${PIE.maximo} como máximo`], ['Aislador', `${num(L.S.V)} kV`, `aguanta ${num(AISLADOR.aguanta)}`], ['Rompe con', `${num(L.S.critica)} kA`, 'con esta tierra'], ['Corriente', queda, L.abiertas === 0 ? 'por fase, en cada línea' : L.abiertas === 1 ? 'por fase, en la que queda' : 'pasa'], ['Líneas', `${2 - L.abiertas} de 2`, 'en servicio']], aviso);
        ponerCifra('hud', `${num(L.S.V)} kV`);
        ponerCifra('hud2', 'en el aislador con ese rayo');
        graficas.b?.marcar(L.kA, L.S.V);
        graficas.c?.marcar(L.R, L.S.critica);
        nivel(1, 'Aislador', clamp01(L.S.V / AISLADOR.aguanta / 1.5), `${num((L.S.V / AISLADOR.aguanta) * 100)} %`);
        nivel(2, 'Tierra', clamp01(L.R / (PIE.maximo * 3)), `${f1(L.R)} Ω`);
    }
}

// ------------------------------------------------------------------ la línea
crearPagina({
    figura: FIGURA,
    fichas: FICHAS,
    vistas: VISTAS,
    modos: MODOS,
    botones: BOTONES,
    acciones: ACCIONES,
    modo0: 'lejos',
    pide: { P: DEF.P, kV: DEF.kV, Ta: DEF.Ta, v: DEF.v, sol: DEF.sol, km: DEF.km, reactor: DEF.reactor, abierta: DEF.abierta, kA: DEF.kA, R: DEF.R, rayo: false, incendio: false },
    general: { Lx: 16.8, Lz: 6, alto: 2.2, mira: [0, 0.55, 0], az: 18, el: 26, azVertical: 14, elVertical: 36 },
    etiquetas: { lienzo: 'Línea de transmisión en 3D: arrastra para girarla, toca un punto para conocerlo', modos: 'Qué ver en la línea', puntos: 'Puntos clave de la línea', desarmar: 'Desarmar la línea', lecturas: 'Lo que mide la línea' },
    textoFinal: 'Toca cualquier punto para volver a verlo. Prueba otros voltajes en «Llevar la energía lejos», quita el viento en «El cable se calienta», abre una punta en «Qué tan lejos» o provoca un incendio en «Un rayo y un incendio».',
    colores: { guindaSuave: '#f3d4de', claro: '#ffffff' },
    crearDiagrama,
    secciones,
    escena: (renderer, scene, { movil, oscuro }) => {
        const M = materiales(P_PLANTA);
        const est = escenario(renderer, scene, M, { movil, oscuro });
        return { planta: construir(M, P_PLANTA, { movil, oscuro }), est };
    },
    alCambiarModo: p => {
        // cada modo empieza con lo de siempre
        Object.assign(p, { P: DEF.P, Ta: DEF.Ta, km: DEF.km, kA: DEF.kA, R: DEF.R });
        p.incendio = false;
        p.rayo = false;
        p.abierta = false;
        p.reactor = DEF.reactor;
        p.kV = DEF.kV;
        p.v = DEF.v;
        p.sol = DEF.sol;
        planta = estadoPlanta();
    },
    alCuadro: ({ dt, pide }) => {
        planta = pasoPlanta(planta, { rayo: pide.modo === 'falla' && pide.rayo, incendio: pide.modo === 'falla' && pide.incendio }, dt);
        pide.rayo = false;
    },
    poseDe: ({ pide, ve, encendido, t, dt, camara }) => pose({ modo: pide.modo, planta, P: pide.P, kV: pide.kV, Ta: pide.Ta, v: pide.v, sol: pide.sol, km: pide.km, reactor: pide.reactor, abierta: pide.abierta, kA: pide.kA, R: pide.R, noche: ve.noche, adentro: ve.adentro, desarme: ve.desarme, encendido, t, dt, camara }),
    firma: p => [p.modo, p.modo === 'lejos' ? [Math.round(p.P / 20), p.kV] : 0, p.modo === 'calor' ? [Math.round(p.P / 20), Math.round(p.Ta), p.v, p.sol] : 0, p.modo === 'limite' ? [Math.round(p.km / 5), Math.round(p.P / 20), p.reactor, p.abierta] : 0, p.modo === 'falla' ? [Math.round(p.kA), Math.round(p.R)] : 0],
    alPintarFijas,
    alPintarGraficas,
    alActualizar,
    prueba: p => ({ P: Math.round(p.P), kV: p.kV, Ta: +p.Ta.toFixed(1), v: p.v, sol: p.sol, km: Math.round(p.km), reactor: p.reactor, abierta: p.abierta, kA: Math.round(p.kA), R: +p.R.toFixed(1), incendio: p.incendio, rayo: planta.rayo === null ? null : +planta.rayo.toFixed(3), fuego: planta.fuego === null ? null : +planta.fuego.toFixed(2) }),
});
