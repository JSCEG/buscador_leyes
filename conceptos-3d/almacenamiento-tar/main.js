// «Terminal de almacenamiento», en 3D y con el formato Búho de «¿Cómo funciona?». Con el tamaño de la TAR Añil: las tandas llegan por un poliducto enterrado, un densímetro y un
// múltiple las reparten, los tanques las guardan, y las pipas se las llevan a las gasolineras. Cuatro formas de verla: la reserva, las tandas, los vapores y un derrame.
// Se arma con: node scripts/build-conceptos-3d.mjs almacenamiento-tar
//
// Lo que se repite entre las plantas con física está en conceptos-3d/planta-comun/.
import { clamp01, num } from '../planta-comun/ayudas.js';
import { barrasHTML, leyenda, pintarGrafica, seccionBarras, seccionColores, seccionDiagrama, seccionFuentes, seccionGrafica, seccionTabla, tablaHTML } from '../planta-comun/graficas.js';
import { crearPagina } from '../planta-comun/pagina.js';
import { DEF, DIQUE, ESPUMA, FLUIDOS, LIMITES, NACIONAL, ORDEN, OTRAS, PARTES as PARTES_M, PIPA, POLITICA, PRODUCTOS, STOCK, TANQUES, TECHOS, TERMINAL, anchoEscena, areaDique, calcular, densidadEn, derrame, enDerrame, espumaDe, estadoPlanta, evapora, filaEn, interfaz, litrosA20, pasoPlanta, pipasPorHora, pose, trenEn, ventaDe, volumen } from './modelo.js';
import { P_PLANTA, construir, escenario, materiales } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';

const FIGURA = 'almacenamiento-tar';
const f1 = x => num(x, 1);
const f2 = x => num(x, 2);
const E0 = { fijo: evapora({ techo: 'fijo' }), externo: evapora({ techo: 'externo' }), membrana: evapora({ techo: 'membrana' }), diesel: evapora({ techo: 'fijo', tanque: TANQUES[3], stock: STOCK.diesel }) };

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'poliducto', nombre: 'Poliducto', modo: 'tandas', accion: 'aMezcla', eq: 'De Tuxpan a Azcapotzalco, 311 km', recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 8h18M3 16h18"/><path d="M9 8v8M15 8v8"/>',
        texto: 'Por el mismo tubo viajan gasolina y diésel, una tanda tras otra. El corte lo deja ver. Añil recibe por ducto desde la terminal 18 de Marzo, en Azcapotzalco, y a esa le llega el combustible por los 311 km del ducto de Tuxpan. Aquí sube a la superficie, en una trampa como la de los gasoductos.' },
    { parte: 'densimetro', nombre: 'Densímetro y válvulas', modo: 'tandas', abrir: true, accion: 'aMezcla', eq: 'Regular, 730 kg/m³. Diésel, unos 840', recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="13" r="7"/><path d="M12 13l4-4M12 3v3"/>',
        texto: 'Una forma de saber qué viene llegando es medir cuánto pesa, porque cada producto pesa distinto. Cuando la lectura cambia, el múltiple mueve sus válvulas y manda cada tanda a su tanque. Fíjate en las lámparas: la grande dice a dónde va. Hacerlo lento cuesta caro: mezcla más.' },
    { parte: 'mezcla', nombre: 'Tanque de mezcla', modo: 'tandas', abrir: true, accion: 'aMezcla', eq: 'Se reprocesa o se desecha', recorrido: { noche: false, adentro: false },
        icono: '<path d="M6 4v16h12V4"/><path d="M6 12c2-2 4 2 6 0s4 2 6 0"/>',
        texto: 'Donde dos tandas se tocan, se revuelven un poco. Esa parte ya no es ni gasolina ni diésel, y no cumple con ninguna de las dos. Se aparta en un tanque propio, y después se reprocesa o se desecha. Añil tiene cinco tanques de combustible: este sexto está aquí para explicarlo.' },
    { parte: 'externo', nombre: 'Techo flotante', modo: 'vapores', accion: 'techo', eq: `Se evaporan unos ${num(E0.externo.total)} kg al día, contra ${num(E0.fijo.total)}`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M5 5v15h14V5"/><path d="M5 11h14M9 11V8M15 11V8"/>',
        texto: 'Este tanque no tiene tapa: el techo flota sobre la gasolina, y sube y baja con ella. Mira su escalera, que se inclina. Como no queda espacio encima, casi no hay de dónde salga vapor. Un sello cierra la orilla. Si el nivel baja mucho, el techo se apoya en sus patas.' },
    { parte: 'membrana', nombre: 'Membrana flotante', modo: 'vapores', abrir: true, accion: 'techo', eq: 'La norma pide esto o algo igual en gasolina', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 8l8-4 8 4v12H4z"/><path d="M4 13h16"/>',
        texto: 'Es un tanque con techo fijo, pero por dentro lleva una cubierta de aluminio que flota sobre la gasolina. Así no le pega el viento y no le entra la lluvia. La norma obliga a controlar los vapores de la gasolina: con un techo flotante, con membrana, o con un techo fijo conectado a la recuperación de vapores.' },
    { parte: 'fijo', nombre: 'Techo fijo', modo: 'vapores', abrir: true, accion: 'techo', eq: `Diésel: ${f1(E0.diesel.total)} kg al día`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 9l8-4 8 4v11H4z"/><path d="M4 9h16"/>',
        texto: 'El diésel casi no se evapora: a 25 °C, su presión de vapor es cientos de veces menor que la de la gasolina. Por eso le basta un techo fijo, con una válvula de presión y vacío que lo deja respirar. Con gasolina, ese espacio de arriba se llenaría de vapor, y saldría cada vez que el tanque se llena.' },
    { parte: 'medicion', nombre: 'Medición', modo: 'reserva', abrir: true, accion: 'corte', eq: `20,000 L a 30 °C son ${num(litrosA20(PIPA.litros, 30))} L a 20 °C`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M6 3v18M6 7h4M6 11h6M6 15h4"/><circle cx="17" cy="9" r="3"/>',
        texto: 'Cada tanque mide su nivel y su temperatura sin que nadie suba, y el cuarto de control lo ve todo. La temperatura importa: la gasolina caliente ocupa más. Por eso en México los petrolíferos se reportan como si estuvieran a 20 °C. La regla de color al lado de cada tanque dice cuánto tiene.' },
    { parte: 'dique', nombre: 'Dique y drenaje', modo: 'derrame', accion: 'rompe', eq: 'Muros de unos 1.8 m', recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 20h18M5 20v-5M19 20v-5"/><path d="M9 20V8h6v12"/>',
        texto: 'Si un tanque se rompe, el combustible se queda en este corral de concreto. Con un tanque solo, debe caber 1.1 veces lo que guarda. Con varios, lo del mayor más la lluvia esperada. El piso, impermeable, baja hacia el drenaje aceitoso, que lleva al separador. Toca el botón y míralo llenarse.' },
    { parte: 'bombas', nombre: 'Bombas', modo: 'reserva', abrir: true, accion: 'masPipas', eq: 'Una línea por producto', recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="12" r="7"/><path d="M12 12l5-5M3 12h2M19 12h2"/>',
        texto: 'Los tanques no empujan solos con la fuerza suficiente. Estas bombas toman cada producto y lo mandan por su propia línea a las llenaderas. Cada línea lleva un solo producto, para no revolverlos. Trabajan cuando hay pipas cargando.' },
    { parte: 'aditivos', nombre: 'Aditivos', modo: 'reserva', abrir: true, accion: 'masPipas', eq: 'Se agrega en la misma línea', recorrido: { noche: false, adentro: false },
        icono: '<path d="M9 3h6M10 3v6l-5 10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2l-5-10V3"/>',
        texto: 'Aquí se le agregan a la gasolina los aditivos, en un punto de la línea o en el tanque. La norma pide que lleguen con la presión suficiente para entrar a un tubo que ya está a presión, y un tanque propio para guardarlos. El dibujo muestra un solo tanque y una bomba dosificadora, como ejemplo.' },
    { parte: 'llenaderas', nombre: 'Llenaderas', modo: 'reserva', abrir: true, accion: 'masPipas', eq: `En Añil, en una hora: ${TERMINAL.entran} entraron y ${TERMINAL.salen} salieron`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 17h13V8H3zM16 11h4l1 3v3h-5"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/>',
        texto: 'Las pipas se cargan aquí, casi todas de 20 mil litros. La gasolina entra solo por el fondo, nunca por arriba: así no salpica ni hace vapor de más. Cada posición tiene un controlador que recibe el pedido, mide y corta al llegar. También revisa la conexión a tierra y que la pipa no se sobrellene.' },
    { parte: 'vapores', nombre: 'Recuperación de vapores', modo: 'vapores', abrir: true, accion: 'urv', eq: `Límite: ${POLITICA.emisionMg} mg por litro`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M8 21v-9M16 21v-9M5 12h14"/><path d="M8 8c-2-2 2-3 0-5M16 8c-2-2 2-3 0-5"/>',
        texto: 'Una pipa vacía está llena de vapores de gasolina. Al cargarla, el líquido los empuja hacia afuera. Por eso cada posición lleva un segundo tubo que se los lleva a esta unidad, que los recupera en vez de soltarlos. La norma la pide en terminales que mueven más de 946 mil litros de gasolina al día.' },
    { parte: 'incendio', nombre: 'Agua y espuma', modo: 'derrame', abrir: true, accion: 'espuma', eq: `Para el tanque de ${TANQUES[1].mb} mil barriles: ${num(espumaDe(TANQUES[1]).flujo)} L/min`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 3s6 6 6 11a6 6 0 0 1-12 0c0-5 6-11 6-11z"/>',
        texto: 'El agua sola no apaga un fuego de gasolina: la gasolina flota. Por eso se mezcla con un concentrado que hace espuma, y la espuma tapa el líquido. Las cajas rojas en lo alto de los tanques son cámaras de espuma, y la red roja lleva agua a los monitores. Prueba el sistema con el botón.' },
    { parte: 'reparto', nombre: 'Pipa y gasolinera', modo: 'reserva', accion: 'masPipas', eq: 'Distribuir y vender también pide permiso', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 21V5h9v16M13 10h3l2 3v5a2 2 0 0 0 4 0V9l-3-3"/>',
        texto: 'De aquí, el combustible sale en pipa a las gasolineras. Al descargar, la pipa puede recibir de regreso los vapores del tanque enterrado, y traerlos de vuelta: eso se llama balance de vapores. Por eso una pipa «vacía» llega llena de vapor a la terminal, donde se recupera.' },
];
const VISTAS = Object.fromEntries(PARTES_M.map(p => [p.id, p.vista]));
const MODOS = {
    reserva: { nombre: 'Reserva', corto: 'Reserva', resumen: 'Una terminal es un colchón entre el ducto, que trae a su ritmo, y las pipas, que salen todo el día. Si el ducto se corta, lo único que queda es lo que hay en los tanques. Mueve las pipas y corta el ducto.', aclara: 'Lo que hay en los tanques, en días de venta. El reparto por producto es de ejemplo.', mando: { nombre: 'Pipas por hora', campo: 'pipas', rango: LIMITES.pipas, texto: v => `${num(v)} de 20 mil L` }, mando2: { nombre: 'Llega al día', campo: 'entra', rango: LIMITES.entra, texto: v => `${num(v)} mil barriles` }, reloj: { texto: 'los días', avanzar: (p, dt) => { p.dia += (dt * LIMITES.dia[1]) / 32; if (p.dia >= LIMITES.dia[1]) { p.dia = LIMITES.dia[1]; return true; } return false; }, alSeguir: p => { if (p.dia >= LIMITES.dia[1]) p.dia = 0; } } },
    tandas: { nombre: 'Tandas', corto: 'Tandas', resumen: 'Gasolina y diésel comparten el tubo, una tanda detrás de otra. Donde se tocan se mezclan, y esa mezcla crece con la distancia. Lo que importa es apartarla a tiempo. Cambia el largo del viaje y la velocidad.', aclara: 'Lo que viene llegando, y a dónde lo manda el múltiple. Tandas y mezcla no están a escala.', mando: { nombre: 'Largo del viaje', campo: 'km', rango: LIMITES.km, texto: v => `${num(v)} km` }, mando2: { nombre: 'Velocidad', campo: 'v', rango: LIMITES.v, texto: v => `${f1(v)} m/s` } },
    vapores: { nombre: 'Vapores', corto: 'Vapores', resumen: 'La gasolina se evapora, y más con calor. Con un techo fijo, cada vez que el tanque se llena empuja vapor hacia afuera. Con uno flotante, casi no hay espacio de dónde salga. Cambia el techo y la temperatura.', aclara: 'La misma gasolina y el mismo tanque, con cada techo. Viento y accesorios, de ejemplo.', mando: { nombre: 'Temperatura', campo: 'T', rango: LIMITES.T, texto: v => `${num(v)} °C` } },
    derrame: { nombre: 'Un derrame', corto: 'Derrame', resumen: 'Se abre un agujero al pie del tanque mayor, y el combustible cae al dique hasta que el nivel de afuera iguala al de adentro. El dique evita que se filtre al suelo o que se salga de la terminal. Cambia el agujero y la altura del muro.', aclara: 'De lado: el tanque y el dique. El modelo es de ejemplo.', mando: { nombre: 'Tamaño del agujero', campo: 'agujero', rango: LIMITES.agujero, texto: v => `${num(v)} cm` } },
};
const siguiente = (lista, v) => lista[(lista.indexOf(v) + 1) % lista.length];
const LLENADERAS = [6, 4, 2];
const BOTONES = [
    { id: 'llenaderas', visible: p => p.modo === 'reserva', pulsado: p => p.llenaderas !== DEF.llenaderas, texto: p => `${p.llenaderas} llenaderas abiertas`, alTocar: p => { p.llenaderas = siguiente(LLENADERAS, p.llenaderas); } },
    { id: 'corte', visible: p => p.modo === 'reserva', pulsado: p => p.corte, texto: p => (p.corte ? 'Regresar el ducto' : 'Cortar el ducto el día 1'), alTocar: p => { p.corte = !p.corte; if (p.corte) { p.dia = 0; p.corre = true; } } },
    { id: 'techo', visible: p => p.modo === 'vapores', pulsado: p => p.techo !== DEF.techo, texto: p => TECHOS[p.techo].corto, alTocar: p => { p.techo = siguiente(Object.keys(TECHOS), p.techo); } },
    { id: 'urv', visible: p => p.modo === 'vapores', pulsado: p => !p.urv, texto: p => (p.urv ? 'Con recuperación' : 'Sin recuperación'), alTocar: p => { p.urv = !p.urv; } },
    { id: 'rompe', visible: p => p.modo === 'derrame', pulsado: p => p.rompe, texto: p => (p.rompe ? 'Reparar el tanque' : 'Que se abra el agujero'), alTocar: p => { p.rompe = !p.rompe; } },
    { id: 'muro', visible: p => p.modo === 'derrame', pulsado: p => p.muro !== DEF.muro, texto: p => `Muro de ${f1(p.muro)} m`, alTocar: p => { p.muro = siguiente([1.8, 1, 0.5], p.muro); p.rompe = false; } },
];
const ACCIONES = {
    masPipas: { texto: p => (p.pipas > 20 ? 'Regresar las pipas' : 'Que lleguen 24 por hora'), hacer: (p, pag) => { p.pipas = p.pipas > 20 ? DEF.pipas : 24; pag.invalidar(); pag.ponerMando(); } },
    corte: { texto: p => (p.corte ? 'Regresar el ducto' : 'Cortar el ducto'), hacer: (p, pag) => { p.corte = !p.corte; if (p.corte) { p.dia = 0; p.corre = true; } pag.invalidar(); pag.ponerMando(); pag.rotular(); } },
    aMezcla: { texto: () => 'Ver llegar la mezcla', hacer: p => { p.aMezcla = true; } },
    techo: { texto: p => `Probar: ${TECHOS[siguiente(Object.keys(TECHOS), p.techo)].corto.toLowerCase()}`, hacer: (p, pag) => { p.techo = siguiente(Object.keys(TECHOS), p.techo); pag.invalidar(); pag.rotular(); } },
    urv: { texto: p => (p.urv ? 'Apagar la recuperación' : 'Encender la recuperación'), hacer: (p, pag) => { p.urv = !p.urv; pag.invalidar(); pag.rotular(); } },
    rompe: { texto: p => (p.rompe ? 'Reparar el tanque' : 'Que se abra el agujero'), hacer: (p, pag) => { p.rompe = !p.rompe; pag.invalidar(); pag.rotular(); } },
    espuma: { texto: () => 'Probar la espuma', hacer: p => { p.espuma = true; } },
};

// ------------------------------------------------------------------ el tablero
const secciones = () => `
    ${seccionDiagrama('Cuántos días hay en los tanques')}
    ${seccionGrafica('b')}
    ${seccionGrafica('c')}
    ${seccionBarras()}
    ${seccionTabla('Tres terminales de la Ciudad de México', 'h-terminales', 'Capacidades en miles de barriles, de la Sener (2018). Las pipas se contaron en una sola hora de enero de 2019, en plena escasez: no son un promedio. Los días salen de suponer esa hora todo el día, y la terminal llena. 18 de Marzo también surte a otras terminales.', 'h-tabla-texto')}
    ${seccionTabla('Cuántos días de reserva', 'h-dias', 'Días de venta. Son cifras distintas, de fechas y fuentes distintas; una nota de 2026 dice que no hay una medición unificada.', 'h-tabla-texto')}
    ${seccionTabla('Lo que se evapora con cada techo', 'h-techos', `Con el método de AP-42, a ${DEF.T} °C y a la altura de la Ciudad de México, en el tanque de ${TANQUES[0].mb} mil barriles. El diésel, en uno de ${TANQUES[3].mb} mil. Viento, accesorios y lo que se mueve al día son de ejemplo.`, 'h-tabla-texto')}
    ${seccionTabla('Lo que pide la norma', 'h-norma', 'NOM-006-ASEA-2017.')}
    ${seccionTabla('La espuma de cada tanque', 'h-espuma', `A ${ESPUMA.tasa} litros por minuto y m², durante ${ESPUMA.minutos} minutos, con ${num(ESPUMA.concentrado * 100)} % de concentrado: lo que indica una guía de ingeniería para techo fijo. Para el sello de un techo flotante se usan ${ESPUMA.sello} litros por minuto y m², solo en el anillo. El anillo de ${num(ESPUMA.anillo * 100)} cm es de ejemplo.`, 'h-tabla-texto')}
    ${seccionTabla('Qué permiso pide cada cosa', 'h-regla', 'Guardar petrolíferos lo permite la Comisión Nacional de Energía (CNE). La seguridad y el ambiente son de la ASEA, con la NOM-006-ASEA-2017.')}
    <section class="g-curva h-media">
        <div class="g-curva-cab"><b>Cómo les llega el combustible a las terminales de Pemex</b></div>
        <div class="h-barras" id="h-pesa"></div>
        <p>Número de terminales, de las 73 de 2019. La fuente no dice cómo les llega a las otras 8.</p>
    </section>
    <section class="g-curva h-media">
        <div class="g-curva-cab"><b>Capacidad de las terminales de Pemex</b></div>
        <div class="h-barras" id="h-pesa2"></div>
        <p>Millones de barriles, según la Sener (2018): lo que miden y lo que se puede usar. Hoy hay ${NACIONAL.pemex} terminales de Pemex y ${NACIONAL.privadas} privadas (2026).</p>
    </section>
    ${seccionColores(FLUIDOS, 'Tiene el tamaño de la TAR Añil y sus cinco tanques, pero no es su plano ni un simulador. Nada está a escala. Es de ejemplo: cómo se reparte su capacidad entre los tanques y qué tipo de techo tiene cada uno, el reparto de la venta, el caudal de cada brazo, el diámetro del poliducto, el tanque de mezcla, el viento y los accesorios de los techos, y el modelo del derrame.')}
    ${seccionFuentes(FUENTES, [
        { para: 'Quién da el permiso de almacenamiento, el acceso abierto y quién fija los niveles mínimos', titulo: 'Ley del Sector Hidrocarburos, arts. 5, 76, 104, 115 y 116', nota: 'Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio' },
        { para: 'Qué es el almacenamiento, para qué se da el permiso y quién acredita el mínimo', titulo: 'Reglamento de la Ley del Sector Hidrocarburos, arts. 109, 111 y 112', nota: 'Diario Oficial de la Federación, 3 de octubre de 2025. Está en el acervo de este sitio' },
        { para: 'La CNE otorga los permisos de petrolíferos', titulo: 'Ley de la Comisión Nacional de Energía, art. 9', nota: 'Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio' },
    ])}`;

const VELOCIDADES = [[1.5, 'h-s-actual'], [0.5, 'h-s-sin'], [0.1, 'h-s-max']];
function alPintarGraficas(L, pag) {
    const { $, pide, graficas } = pag;
    const m = pide.modo;
    graficas.b = null;
    graficas.c = null;
    if (m === 'reserva') {
        const R = L.R;
        const lineas = [...ORDEN.map((p, i) => ({ clase: ['h-s-actual', 'h-s-sin', 'h-s-max'][i], nombre: PRODUCTOS[p].nombre, f: d => R.diasEn(p, d) })), { clase: 'h-s-norma', nombre: `Política: ${POLITICA.gasolina} días`, f: () => POLITICA.gasolina }];
        $('#h-b-t').textContent = 'Cuántos días de venta hay en los tanques';
        $('#h-b-ley').innerHTML = leyenda(lineas);
        $('#h-b-pie').textContent = pide.corte ? `Sin ducto, la regular se acaba el día ${f1(R.seAcaba.regular ?? 10)}. La política pide ${POLITICA.gasolina} días a quien vende, no a cada terminal.` : `Con lo que llega y lo que sale, el nivel sube, baja o se queda igual. La política pide ${POLITICA.gasolina} días a quien vende, no a cada terminal.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Cuántos días de venta hay', xMin: 0, xMax: 10, yMin: 0, yMax: 8, ticksX: [0, 2, 4, 6, 8, 10], ticksY: [0, 2, 4, 6, 8], etX: 'Día', etY: 'días de venta', lineas, fx: x => num(x), fy: y => num(y), punta: x => `Día ${f1(x)} · ${lineas.slice(0, 3).map(l => `${l.nombre}: ${f1(l.f(x))}`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Día', ...ORDEN.map(p => PRODUCTOS[p].nombre), 'Total, miles de barriles'], [0, 2, 4, 6, 8, 10].map(d => [num(d), ...ORDEN.map(p => f1(R.diasEn(p, d))), num(R.totalEn(d))]));
        const lc = [[6, 'h-s-actual'], [4, 'h-s-sin'], [2, 'h-s-max']].map(([n, clase]) => ({ clase, nombre: `${n} llenaderas`, f: h => filaEn(pide.pipas, n, h) }));
        $('#h-c-t').textContent = 'Cuántas pipas esperan';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Cada llenadera atiende unas ${f1(pipasPorHora(1))} pipas por hora: 10 minutos de carga y 15 de maniobras, de ejemplo. Con ${num(pide.pipas)} por hora, ${pide.pipas > pipasPorHora(6) ? 'ni con seis se alcanza: la fila crece' : 'la fila depende de cuántas estén abiertas'}.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Cuántas pipas esperan', xMin: 0, xMax: 12, yMin: 0, yMax: 120, ticksX: [0, 4, 8, 12], ticksY: [0, 40, 80, 120], etX: 'Horas', etY: 'pipas', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `Hora ${f1(x)} · ${lc.map(l => `${l.nombre}: ${num(l.f(x))}`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Horas', ...lc.map(l => l.nombre)], [0, 2, 4, 8, 12].map(h => [num(h), ...lc.map(l => num(l.f(h)))]));
    } else if (m === 'tandas') {
        const A = L.A;
        const medMin = (A.largo / L.v / 60) * 0.75;
        const dens = x => densidadEn(x * L.v * 60, A.largo);
        $('#h-b-t').textContent = 'Lo que lee el densímetro';
        $('#h-b-ley').textContent = '';
        $('#h-b-pie').textContent = `Al pasar de regular a diésel. Entre las dos líneas, lo que llega trae más de 1 % del otro producto, y se manda al tanque de mezcla: unos ${num(A.minutos)} minutos. Ese 1 % es de ejemplo.`;
        const c = (A.largo / 2 / L.v / 60);
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Lo que lee el densímetro', xMin: -medMin, xMax: medMin, yMin: 720, yMax: 860, ticksX: [-Math.round(medMin), 0, Math.round(medMin)], ticksY: [720, 790, 860], etX: 'Minutos', etY: 'kg/m³', f: dens, refsX: [{ x: -c, texto: 'Abre' }, { x: c, texto: 'Cierra' }], fx: x => num(x), fy: y => num(y), punta: x => `Minuto ${num(x)} · ${num(dens(x))} kg/m³` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Minuto', 'kg/m³', 'Del segundo producto, %'], [-1, -0.5, 0, 0.5, 1].map(u => { const x = u * c; const d = dens(x); return [num(x), num(d), num(((d - PRODUCTOS.regular.rho) / (PRODUCTOS.diesel.rho - PRODUCTOS.regular.rho)) * 100)]; }));
        const lc = VELOCIDADES.map(([v, clase]) => ({ clase, nombre: `${f1(v)} m/s`, f: km => interfaz({ km, v }).barriles }));
        $('#h-c-t').textContent = 'Cuánta mezcla sale, según el camino';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Barriles de mezcla entre regular y diésel. Cuatro veces el camino, el doble de mezcla. Ir más rápido ayuda poco, salvo que el tubo vaya muy lento. Entre dos gasolinas sale menos: ${num(L.B.barriles)} barriles aquí.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Cuánta mezcla sale', xMin: 10, xMax: 311, yMin: 0, yMax: 3000, ticksX: [10, 100, 200, 311], ticksY: [0, 1000, 2000, 3000], etX: 'Kilómetros del viaje', etY: 'barriles', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} km · ${lc.map(l => `${l.nombre}: ${num(l.f(x))}`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Kilómetros', ...lc.map(l => l.nombre)], [10, 50, 100, 200, 311].map(k => [num(k), ...lc.map(l => num(l.f(k)))]));
    } else if (m === 'vapores') {
        const lineas = [
            { clase: 'h-s-actual', nombre: 'Gasolina, techo fijo', f: T => evapora({ T, techo: 'fijo' }).total },
            { clase: 'h-s-sin', nombre: 'Gasolina, flotante', f: T => evapora({ T, techo: 'externo' }).total },
            { clase: 'h-s-max', nombre: 'Gasolina, membrana', f: T => evapora({ T, techo: 'membrana' }).total },
            { clase: 'h-s-norma', nombre: 'Diésel, techo fijo', f: T => evapora({ T, techo: 'fijo', tanque: TANQUES[3], stock: STOCK.diesel }).total },
        ];
        $('#h-b-t').textContent = 'Lo que se evapora al día';
        $('#h-b-ley').innerHTML = leyenda(lineas);
        $('#h-b-pie').textContent = `Kilos al día. Las tres de abajo casi tocan el cero: esa es la diferencia. Con techo fijo y ${num(L.T)} °C, unos ${num(L.fijo.trabajo)} kg salen al llenarse y ${num(L.fijo.respira)} kg al respirar.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Lo que se evapora al día', xMin: 5, xMax: 40, yMin: 0, yMax: 2400, ticksX: [5, 15, 25, 40], ticksY: [0, 800, 1600, 2400], etX: 'Temperatura, °C', etY: 'kg al día', lineas, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} °C · ${lineas.map(l => `${l.nombre}: ${num(l.f(x))}`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['°C', 'Fijo', 'Flotante', 'Membrana', 'Diésel'], [10, 20, 25, 30, 40].map(T => [num(T), ...lineas.map(l => f1(l.f(T)))]));
        const fa = T => litrosA20(PIPA.litros, T);
        $('#h-c-t').textContent = 'Lo que mide una pipa, a 20 °C';
        $('#h-c-ley').textContent = '';
        $('#h-c-pie').textContent = `Una pipa de 20,000 L cargada a ${num(L.T)} °C son ${num(fa(L.T))} L a 20 °C, la temperatura con que se reportan en México. Con la tabla de corrección de Canadá para gasolina.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Lo que mide una pipa, a 20 °C', xMin: 5, xMax: 40, yMin: 19400, yMax: 20400, ticksX: [5, 15, 20, 30, 40], ticksY: [19400, 19900, 20400], etX: 'Temperatura al cargar, °C', etY: 'litros a 20 °C', f: fa, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} °C · ${num(fa(x))} litros` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Carga a', 'Litros a 20 °C', 'Diferencia'], [10, 15, 20, 25, 30, 35, 40].map(T => [`${num(T)} °C`, num(fa(T)), num(fa(T) - PIPA.litros)]));
    } else {
        const R = L.R;
        const xMax = Math.max(1, Math.ceil(R.fin * 1.05));
        const lineas = [
            { clase: 'h-s-actual', nombre: 'Adentro del tanque', f: x => enDerrame(R, x).h },
            { clase: 'h-s-sin', nombre: 'En el dique', f: x => enDerrame(R, x).hd },
            { clase: 'h-s-norma', nombre: `Muro: ${f1(L.muro)} m`, f: () => L.muro },
        ];
        $('#h-b-t').textContent = 'Los dos niveles';
        $('#h-b-ley').innerHTML = leyenda(lineas);
        $('#h-b-pie').textContent = `Con un agujero de ${num(L.agujero)} cm, al principio salen unos ${num(R.Q0)} m³ por hora. Se detiene cuando los dos niveles se igualan${R.seSale > 1 ? `, pero el muro no alcanza: ${num(R.seSale)} m³ se salen` : ''}.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Los dos niveles', xMin: 0, xMax, yMin: 0, yMax: 12, ticksX: [0, Math.round(xMax / 2), xMax], ticksY: [0, 4, 8, 12], etX: 'Horas', etY: 'metros', lineas, fx: x => num(x), fy: y => num(y), punta: x => `Hora ${f1(x)} · tanque: ${f1(enDerrame(R, x).h)} m · dique: ${f2(enDerrame(R, x).hd)} m` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Agujero', 'Tarda, horas', 'Sale al inicio, m³/h', 'Sale en total, m³'], [5, 10, 20, 40, 60].map(a => { const D = derrame({ agujero: a, muro: L.muro }); return [`${a} cm`, num(D.fin), num(D.Q0), num(D.total)]; }));
        const lc = [{ clase: 'h-s-actual', nombre: 'Tres tanques juntos', f: h => areaDique(h) }, { clase: 'h-s-sin', nombre: 'El mayor, solo', f: h => areaDique(h, ['t1']) }];
        $('#h-c-t').textContent = 'El terreno que pide el dique';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Metros cuadrados, con la regla de la norma. A menos muro, más terreno. Con ${num(1.8, 1)} m, el dique de tres tanques pide ${num(areaDique(1.8))} m². Toda la terminal de Añil mide ${num(TERMINAL.superficie)} m².`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'El terreno que pide el dique', xMin: 0.6, xMax: 3.6, yMin: 0, yMax: 30000, ticksX: [0.6, 1.8, 3.6], ticksY: [0, 10000, 20000, 30000], etX: 'Altura del muro, metros', etY: 'm²', lineas: lc, fx: x => f1(x), fy: y => num(y), punta: x => `${f1(x)} m · ${lc.map(l => `${l.nombre}: ${num(l.f(x))} m²`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Muro', ...lc.map(l => l.nombre)], [1, 1.5, 1.8, 2.5, 3.6].map(h => [`${f1(h)} m`, ...lc.map(l => num(l.f(h)))]));
    }
}
function pintarBarras(L, pag) {
    const { $, pide } = pag;
    let filas;
    if (pide.modo === 'reserva') {
        filas = TANQUES.map(t => ({ t: `${PRODUCTOS[t.prod].nombre}, ${num(t.mb, t.mb % 1 ? 1 : 0)} mil`, v: L.niveles[t.id], activa: t.id === 't1' }));
        $('#h-d-t').textContent = 'Qué tan lleno está cada tanque, de cada 100';
        $('#h-d-pie').textContent = `De los ${TERMINAL.nominal} mil barriles que mide, se pueden usar ${TERMINAL.operativa} mil. El resto incluye el fondo que las bombas no alcanzan y el margen de arriba. Cómo se reparte es de ejemplo.`;
    } else if (pide.modo === 'tandas') {
        filas = [{ t: 'Mezcla entre regular y diésel', v: L.A.barriles / 3000, activa: true, escala: 1, d: 0 }, { t: 'Mezcla entre dos gasolinas', v: L.B.barriles / 3000 }];
        $('#h-d-t').textContent = 'La mezcla, contra 3,000 barriles';
        $('#h-d-pie').textContent = `Con ${num(L.km)} km a ${f1(L.v)} m/s. En Estados Unidos, el ducto Colonial mezclaba 2,400 barriles por cambio con compuertas lentas, y 120 con unas más rápidas: también cuenta qué tan rápido se corta.`;
    } else if (pide.modo === 'vapores') {
        const max = Math.max(L.fijo.total, 1);
        filas = [{ t: 'Techo fijo', v: L.fijo.total / max, activa: L.techo === 'fijo' }, { t: 'Techo flotante', v: L.externo.total / max, activa: L.techo === 'externo' }, { t: 'Membrana', v: L.membrana.total / max, activa: L.techo === 'membrana' }, { t: 'Diésel, techo fijo', v: L.diesel.total / max }];
        $('#h-d-t').textContent = 'Lo que se evapora, de cada 100 del techo fijo';
        $('#h-d-pie').textContent = `A ${num(L.T)} °C, la presión de vapor de la gasolina es ${num(L.P / L.Pd)} veces la del diésel.`;
    } else {
        const R = L.R;
        filas = [{ t: 'Lo que cabe en el dique', v: clamp01(L.cabe / Math.max(L.pide, L.cabe)), activa: true }, { t: 'Lo que pide la norma', v: clamp01(L.pide / Math.max(L.pide, L.cabe)) }];
        $('#h-d-t').textContent = 'El dique, de cada 100';
        $('#h-d-pie').textContent = `Con muro de ${f1(L.muro)} m caben ${num(L.cabe)} m³. La norma pide ${num(L.pide)} m³: el tanque mayor, ${num(volumen(TANQUES[0]))} m³, más ${num(DIQUE.lluvia * DIQUE.area)} m³ de lluvia. Por el agujero saldrían ${num(R.total)} m³. El área del dique, ${num(DIQUE.area)} m², es de ejemplo.`;
    }
    $('#h-barras').innerHTML = barrasHTML(filas);
}
function alPintarFijas({ $ }) {
    $('#h-terminales').innerHTML = tablaHTML(['Terminal', 'Mide', 'Se usa', 'Días, llena'], OTRAS.map(o => [o.nombre, num(o.nominal), num(o.operativa), f1(o.operativa / ventaDe(o.salen))]));
    $('#h-dias').innerHTML = tablaHTML(['Qué', 'Días', 'De cuándo'], [
        ['Lo que pide la política: gasolina y diésel', num(POLITICA.gasolina), '2020 a 2025'],
        ['Lo que pide la política: turbosina', num(POLITICA.turbosina), '2020 a 2025'],
        ['Promedio de las terminales de Pemex', f1(NACIONAL.autonomia), '2019'],
        ['Lo que estima el sector', '3 a 6', '2026'],
        ['Países que importan petróleo, según la Agencia Internacional de Energía', '90', '2026'],
    ]);
    $('#h-techos').innerHTML = tablaHTML(['Techo', 'kg al día', 'Litros al día'], [
        ['Techo fijo con gasolina', num(E0.fijo.total), num(E0.fijo.total / 0.671)],
        ['Techo flotante con gasolina', f1(E0.externo.total), f1(E0.externo.total / 0.671)],
        ['Membrana con gasolina', f1(E0.membrana.total), f1(E0.membrana.total / 0.671)],
        ['Techo fijo con diésel', f1(E0.diesel.total), f1(E0.diesel.total / 0.851)],
    ]);
    $('#h-norma').innerHTML = tablaHTML(['Qué', 'Cuánto'], [
        ['Entre dos tanques de hasta 45 m', '1/6 de la suma de sus diámetros'],
        ['Dique con un tanque', '1.1 veces lo que guarda'],
        ['Dique con varios', 'el mayor, más la lluvia esperada'],
        ['Altura de los muros', 'alrededor de 1.8 m'],
        ['Del tanque al muro', 'al menos 1.5 m'],
        ['Piso del dique', 'impermeable, con pendiente de 1 %'],
        ['Tanques de gasolina', 'techo flotante, membrana o techo fijo con recuperación'],
        ['Gasolina a las pipas', 'solo por el fondo'],
        ['Recuperar vapores', 'desde 946,353 litros de gasolina al día'],
        ['Vapores en las llenaderas', `menos de ${POLITICA.emisionMg} mg por litro`],
    ]);
    $('#h-espuma').innerHTML = tablaHTML(['Tanque', 'Litros por minuto', 'Agua y espuma, m³'], TANQUES.map(t => { const E = espumaDe(t); return [`${PRODUCTOS[t.prod].nombre}, ${num(t.mb, t.mb % 1 ? 1 : 0)} mil`, num(E.flujo), num(E.total)]; }));
    $('#h-regla').innerHTML = tablaHTML(['Para qué', 'Dónde lo dice'], [
        ['Guardar petrolíferos: lo permite la CNE', 'Ley del Sector Hidrocarburos, arts. 76 y 116; Ley de la CNE, art. 9'],
        ['El permiso: para un Sistema y una capacidad', 'Reglamento, arts. 111 y 112'],
        ['Dar servicio a otros: acceso abierto', 'Ley del Sector Hidrocarburos, art. 104'],
        ['El mínimo de días: lo fija la SENER', 'Ley del Sector Hidrocarburos, art. 115; Reglamento, art. 109'],
        ['Seguridad: tanques, diques y vapores', 'NOM-006-ASEA-2017'],
    ]);
    $('#h-pesa').innerHTML = barrasHTML([{ t: 'Por ducto', v: 35 / 73, activa: true }, { t: 'En pipa', v: 19 / 73 }, { t: 'En barco', v: 10 / 73 }, { t: 'En tren', v: 1 / 73 }].map(f => ({ ...f, escala: 0.6 })));
    $('#h-pesa2').innerHTML = barrasHTML([{ t: 'Lo que miden', v: NACIONAL.nominal / 20, activa: true }, { t: 'Lo que se puede usar', v: NACIONAL.operativa / 20 }]);
}
function alActualizar(L, pag) {
    const { pide, ponerCifra, ponerLecturas, nivel, graficas } = pag;
    pintarBarras(L, pag);
    ponerCifra('aT', { reserva: 'Cuántos días hay en los tanques', tandas: 'Dos tandas en el mismo tubo', vapores: 'Qué hace cada techo', derrame: 'El tanque y su dique' }[pide.modo]);
    if (pide.modo === 'reserva') {
        const R = L.R;
        const fila = Math.round(L.fila);
        const vacio = R.primero !== null && pide.dia >= R.primero;
        const aviso = vacio ? `Se acabó la primera: el día ${f1(R.primero)}. Las pipas se van vacías.` : pide.corte && pide.dia >= DEF.diaCorte ? 'El ducto está cortado: solo sale lo que hay en los tanques.' : L.pipas > L.capacidad ? `Llegan ${num(L.pipas)} pipas por hora y solo se atienden ${num(L.capacidad)}: la fila crece.` : L.entra < L.venta - 0.5 ? 'Sale más de lo que llega: los tanques se vacían poco a poco.' : null;
        ponerLecturas([['Día', f1(pide.dia), `de ${LIMITES.dia[1]}`], ['En los tanques', num(L.total), `mil barriles; ${TERMINAL.operativa} usables`], ['Sale al día', f1(L.venta), 'mil barriles'], ['Llega al día', num(L.entra), 'mil barriles'], ['Pipas que atiende', f1(L.capacidad), `por hora, con ${num(L.llenaderas)}`], ['Pipas en fila', num(fila), 'esperando']], aviso);
        ponerCifra('hud', `${f1(L.dias)} días`);
        ponerCifra('hud2', 'de venta en los tanques');
        graficas.b?.marcar(pide.dia, L.porProd.regular);
        graficas.c?.marcar(12, filaEn(pide.pipas, pide.llenaderas, 12));
        nivel(1, 'Lleno', clamp01(L.total / TERMINAL.operativa), `${num((L.total / TERMINAL.operativa) * 100)} %`);
        nivel(2, 'Llenaderas', clamp01(L.pipas / L.capacidad), `${num((L.pipas / L.capacidad) * 100)} %`);
    } else if (pide.modo === 'tandas') {
        const nom = { regular: 'Regular', premium: 'Premium', diesel: 'Diésel', mezcla: 'Mezcla' };
        const aviso = L.ruta === 'mezcla' ? 'Viene mezcla: el múltiple la manda a su propio tanque.' : pide.v < 0.25 ? 'Tan lento, el tubo se mezcla mucho más: casi no hay turbulencia que aplane el frente.' : null;
        ponerLecturas([['Llega ahora', nom[L.ruta], 'al múltiple'], ['Densidad', num(L.rho), 'kg/m³'], ['Mezcla', f2(L.A.largo / 1000), `km; ${num(L.A.barriles)} barriles`], ['Tarda en pasar', num(L.A.minutos), 'minutos'], ['Caudal', num(L.flujoM3h), 'm³ por hora'], ['Tarda el viaje', num(L.horas), 'horas']], aviso);
        ponerCifra('hud', num(L.A.barriles));
        ponerCifra('hud2', 'barriles de mezcla');
        graficas.c?.marcar(L.km, L.A.barriles);
        nivel(1, 'Mezcla', clamp01(L.A.barriles / 3000), `${num(L.A.barriles)} bbl`);
        nivel(2, 'Velocidad', clamp01(pide.v / LIMITES.v[1]), `${f1(pide.v)} m/s`);
    } else if (pide.modo === 'vapores') {
        const E = L.E;
        const aviso = !L.urv ? `Sin recuperación, salen ${num(L.pipa.mgPorLitro)} mg por litro cargado: arriba del límite de ${POLITICA.emisionMg}.` : L.techo === 'fijo' ? 'Con gasolina, la norma no permite un techo fijo sin control de vapores.' : null;
        ponerLecturas([['Se evapora', num(E.total, E.total < 100 ? 1 : 0), 'kg al día'], ['En litros', num(E.total / 0.671, E.total < 100 ? 1 : 0), 'al día'], ['Presión de vapor', f1(L.P * 6.895), 'kPa'], ['Vapor de una pipa', f1(L.pipa.sin), 'kg, sin recuperar'], ['Se suelta', f1(L.pipa.sale), `kg; ${num(L.pipa.mgPorLitro)} mg/L`], ['20,000 L son', num(L.a20), 'litros a 20 °C']], aviso);
        ponerCifra('hud', `${num(E.total, E.total < 100 ? 1 : 0)} kg`);
        ponerCifra('hud2', 'se evaporan al día');
        graficas.b?.marcar(L.T, E.total);
        graficas.c?.marcar(L.T, L.a20);
        nivel(1, 'Evapora', clamp01(E.total / L.fijo.total), `${num((E.total / L.fijo.total) * 100)} %`);
        nivel(2, 'Vapor', clamp01(L.pipa.mgPorLitro / 1000), `${num(L.pipa.mgPorLitro)} mg/L`);
    } else {
        const F = L.F;
        const aviso = !F ? (L.muro < DEF.muro ? `Con muro de ${f1(L.muro)} m, el dique ya no cumple la norma.` : null) : F.escapa > 1 ? `Se está saliendo: ${num(F.escapa)} m³ pasaron por encima del muro.` : F.acabo ? 'Los dos niveles ya se igualaron. Queda recoger lo derramado.' : 'El combustible cae al dique. Sale con menos fuerza a medida que el tanque baja.';
        ponerLecturas([['Hora', F ? f1(F.t) : '—', 'desde que se abrió'], ['En el tanque', f1(F ? F.h : L.niveles.t1 * TANQUES[0].H), 'metros'], ['En el dique', f2(F ? F.hd : 0), `metros; muro de ${f1(L.muro)}`], ['Ha salido', num(F ? F.sale : 0), 'm³'], ['Caben', num(L.cabe), 'm³ en el dique'], ['Pide la norma', num(L.pide), 'm³']], aviso);
        ponerCifra('hud', F ? `${f2(F.hd)} m` : num(L.cabe));
        ponerCifra('hud2', F ? 'de combustible en el dique' : 'm³ caben en el dique');
        if (F) graficas.b?.marcar(Math.min(F.t, L.R.fin), F.h);
        graficas.c?.marcar(L.muro, areaDique(L.muro));
        nivel(1, 'Tanque', clamp01((F ? F.h : L.niveles.t1 * TANQUES[0].H) / TANQUES[0].H), `${f1(F ? F.h : L.niveles.t1 * TANQUES[0].H)} m`);
        nivel(2, 'Dique', clamp01((F ? F.hd : 0) / L.muro), `${f2(F ? F.hd : 0)} m`);
    }
}

// ------------------------------------------------------------------ la terminal
let planta = estadoPlanta();
const aLaMezcla = (s, anchoDe) => {
    for (let d = 0.2; d < 30; d += 0.1) { const T = trenEn(s + d, anchoDe); if (T.a !== T.b) return s + d - 1.4; }
    return s;
};

crearPagina({
    figura: FIGURA,
    fichas: FICHAS,
    vistas: VISTAS,
    modos: MODOS,
    botones: BOTONES,
    acciones: ACCIONES,
    modo0: 'reserva',
    pide: { pipas: DEF.pipas, entra: DEF.entra, llenaderas: DEF.llenaderas, corte: false, dia: DEF.dia, km: DEF.km, v: DEF.v, T: DEF.T, techo: DEF.techo, urv: DEF.urv, agujero: DEF.agujero, muro: DEF.muro, rompe: false, espuma: false, aMezcla: false },
    general: { Lx: 16.8, Lz: 6.4, alto: 2.2, mira: [0, 0.05, 0], az: 16, el: 30, azVertical: 14, elVertical: 36 },
    etiquetas: { lienzo: 'Terminal de almacenamiento en 3D: arrastra para girarla, toca un punto para conocerlo', modos: 'Qué ver en la terminal', puntos: 'Puntos clave de la terminal', desarmar: 'Desarmar la terminal' },
    textoFinal: 'Toca cualquier punto para volver a verlo. Corta el ducto en «Reserva», mira llegar la mezcla en «Tandas», cambia el techo en «Vapores» o abre un agujero en «Un derrame».',
    colores: { guindaSuave: '#f3d4de', claro: '#ffffff' },
    crearDiagrama,
    secciones,
    escena: (renderer, scene, { movil, oscuro }) => {
        const M = materiales(P_PLANTA);
        const est = escenario(renderer, scene, M, { movil, oscuro });
        return { planta: construir(M, P_PLANTA, { movil, oscuro }), est };
    },
    alCambiarModo: (p, m) => {
        p.corre = false;
        p.rompe = false;
        p.corte = false;
        p.pipas = DEF.pipas;
        p.llenaderas = DEF.llenaderas;
        p.muro = DEF.muro;
        p.urv = DEF.urv;
        p.techo = DEF.techo;
        if (m === 'reserva') { p.dia = 0; p.corre = true; }
        if (m === 'tandas') { p.km = DEF.km; p.v = DEF.v; }
    },
    alCuadro: ({ dt, pide }) => {
        const quieto = pide.modo === 'reserva' && pide.corte && pide.dia >= DEF.diaCorte;
        const vel = pide.modo === 'derrame' ? calcular({ modo: 'derrame', agujero: pide.agujero, muro: pide.muro }).R.fin / 24 : undefined;
        planta = pasoPlanta(planta, { pipas: pide.modo === 'reserva' ? pide.pipas : DEF.pipas, llenaderas: pide.modo === 'reserva' ? pide.llenaderas : DEF.llenaderas, v: quieto ? 0 : pide.modo === 'tandas' ? pide.v : DEF.v, rompe: pide.modo === 'derrame' && pide.rompe, espuma: pide.espuma, vel }, dt);
        pide.espuma = false;
        if (pide.aMezcla) {
            pide.aMezcla = false;
            planta = { ...planta, s: aLaMezcla(planta.s, (a, b) => anchoEscena(a, b, pide.km, pide.v)) };
        }
    },
    poseDe: ({ pide, ve, encendido, t, dt, camara }) => pose({ modo: pide.modo, planta, pipas: pide.pipas, llenaderas: pide.llenaderas, entra: pide.entra, corte: pide.corte, dia: pide.dia, km: pide.km, v: pide.v, T: pide.T, techo: pide.techo, urv: pide.urv, agujero: pide.agujero, muro: pide.muro, noche: ve.noche, adentro: ve.adentro, desarme: ve.desarme, encendido, t, dt, camara }),
    firma: p => [p.modo, p.modo === 'reserva' ? [p.pipas, p.llenaderas, Math.round(p.entra), p.corte] : 0, p.modo === 'tandas' ? [Math.round(p.km / 5), Math.round(p.v * 10)] : 0, p.modo === 'vapores' ? [p.techo, p.urv, Math.round(p.T)] : 0, p.modo === 'derrame' ? [p.agujero, p.muro] : 0],
    alPintarFijas,
    alPintarGraficas,
    alActualizar,
    prueba: p => ({ pipas: p.pipas, entra: +p.entra.toFixed(0), llenaderas: p.llenaderas, corte: p.corte, dia: +p.dia.toFixed(1), km: +p.km.toFixed(0), v: +p.v.toFixed(2), T: +p.T.toFixed(0), techo: p.techo, urv: p.urv, agujero: +p.agujero.toFixed(0), muro: p.muro, rompe: p.rompe, fila: +planta.fila.toFixed(1), ev: planta.ev === null ? null : +planta.ev.toFixed(1), s: +planta.s.toFixed(1) }),
});
