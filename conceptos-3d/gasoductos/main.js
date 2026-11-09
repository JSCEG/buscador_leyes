// «Gasoducto», en 3D y con el formato Búho de «¿Cómo funciona?». Con las cifras de Los Ramones Fase II Norte: el gas entra por la izquierda, pasa por dos estaciones de compresión,
// cruza un río y sale a una central eléctrica y a una ciudad. Un corte enfrente deja ver el tubo. Cuatro formas de verlo: la presión, una estación, un día y una fuga.
// Se arma con: node scripts/build-conceptos-3d.mjs gasoductos
//
// Lo que se repite entre las plantas con física está en conceptos-3d/planta-comun/.
import { clamp, clamp01, num } from '../planta-comun/ayudas.js';
import { barrasHTML, leyenda, pintarGrafica, seccionBarras, seccionColores, seccionDiagrama, seccionFuentes, seccionGrafica, seccionTabla, tablaHTML } from '../planta-comun/graficas.js';
import { crearPagina } from '../planta-comun/pagina.js';
import { DEF, DUCTO, ESTACIONES, FLUIDOS, LIMITES, P_ENTREGA, PARED, PARTES as PARTES_M, PMOP, PROFUNDIDAD_NOM, PSI_BAR, VALVULAS_NOM, apretado, capacidad, compresion, enFuga, estadoPlanta, fuga, pasoPlanta, perfil, pose, viaje } from './modelo.js';
import { P_PLANTA, construir, escenario, materiales } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';

const FIGURA = 'gasoductos';
const f1 = x => num(x, 1);
const f2 = x => num(x, 2);
const hora = h => { const a = Math.floor(h % 24); return `${a}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`; };
const P_CAP = perfil(DUCTO.capacidad, 2);
const C_CAP = compresion(DUCTO.capacidad, P_CAP.succion[0]);

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'llegada', nombre: 'Gas que llega', modo: 'presion', accion: 'masGas', eq: 'Cerca de 75 % del gas de México viene de EE. UU.', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 12h12M12 7l5 5-5 5"/><path d="M20 5v14"/>',
        texto: 'Este gas viene de Texas, y llega desde Los Ramones Fase I. Por aquí entra a Los Ramones Fase II Norte, un tubo de 447 km que va de Nuevo León a San Luis Potosí. Sube por ese tubo a la caja azul, que mide cuánto entra, y regresa al ducto. El tubo que sale por la orilla del bloque viene de la frontera.' },
    { parte: 'diablos', nombre: 'Trampa de diablos', modo: 'presion', abrir: true, accion: 'diablo', eq: 'Revisa el tubo por dentro, sin parar el gas', recorrido: { noche: false, adentro: false },
        icono: '<rect x="3" y="9" width="14" height="6" rx="2"/><path d="M17 12h4M7 9v6M13 9v6"/>',
        texto: 'Un diablo es un aparato que cabe justo en el tubo. Se mete por esa puerta guinda, se cierra, y se le da paso al gas, que lo empuja. Unos limpian; otros miden el espesor del acero y buscan corrosión o defectos. Toca el botón y míralo correr por el corte, hasta el final del ducto.' },
    { parte: 'valvula', nombre: 'Válvula de seccionamiento', modo: 'fuga', accion: 'rompe', eq: `Máximo ${VALVULAS_NOM[0].km} km entre válvulas en el campo`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="13" r="4"/><path d="M3 13h5M16 13h5M12 9V4M8 4h8"/>',
        texto: 'Se ve en el corte: la bola está en el tubo, y arriba asoma su mecanismo. Si hay un problema, gira y aísla un tramo. La norma dice qué tan lejos puede estar una de otra: 32 km en el campo y 8 km donde hay mucha gente. Los dos tubos delgados son desfogues, para vaciar el tramo sin riesgo para la gente.' },
    { parte: 'tubo', nombre: 'Tubería enterrada', modo: 'presion', accion: 'masGas', eq: `${DUCTO.pulgadas} pulgadas. Pared de unos ${num(PARED * 1000)} mm, de ejemplo`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 8h18M3 16h18"/><ellipse cx="4" cy="12" rx="1.5" ry="4"/><ellipse cx="20" cy="12" rx="1.5" ry="4"/>',
        texto: 'El color dice la presión: más oscuro, más presión. El tubo mide 42 pulgadas, más de un metro, y en el campo la norma pide al menos 60 cm de tierra encima. Los aros son soldaduras, y las señales amarillas avisan que ahí pasa. El dibujo no está a escala: el tubo se ve mucho más grande de lo que es.' },
    { parte: 'filtros', nombre: 'Filtros', modo: 'estacion', abrir: true, accion: 'estaciones', eq: 'Lo primero al entrar a la estación', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 5h16l-6 7v7l-4-2v-5Z"/>',
        texto: 'El gas sube del tubo y entra a la estación. Trae gotas que se condensaron al bajar la presión, y polvo del interior del ducto. Estos tres filtros lo limpian antes de llegar al compresor. Lo que atrapan se junta abajo.' },
    { parte: 'compresor', nombre: 'Compresor y turbina', modo: 'estacion', abrir: true, accion: 'masGas', eq: `A toda capacidad, unos ${num(C_CAP.MW)} MW por estación`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="8" cy="12" r="5"/><path d="M13 12h3M16 8h5v8h-5zM8 7v10M3 12h10"/>',
        texto: 'Cada caseta guarda una turbina y un compresor en el mismo eje. La turbina quema una pequeña parte del gas que pasa y hace girar el compresor, que empuja el gas y le regresa la presión. Por arriba toma aire, y por la chimenea salen sus gases. Trabajan en paralelo, y se ajustan al gas que hay que mover.' },
    { parte: 'enfriador', nombre: 'Enfriadores', modo: 'estacion', abrir: true, accion: 'masGas', eq: `A toda capacidad, sale del compresor a ${num(C_CAP.sale)} °C`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="12" r="8"/><path d="M12 12c0-4 2-5 4-4M12 12c4 0 5 2 4 4M12 12c0 4-2 5-4 4M12 12c-4 0-5-2-4-4"/>',
        texto: 'Al comprimirse, el gas se calienta. Si entrara así al tubo, podría dañar su recubrimiento y aumentar la corrosión. Por eso pasa por estas parrillas de tubos, y los ventiladores le echan aire, como el radiador de un coche. Luego regresa al ducto, con su presión de vuelta.' },
    { parte: 'control', nombre: 'Control', modo: 'fuga', accion: 'rompe', eq: 'Casi todas se manejan desde lejos', recorrido: { noche: false, adentro: false },
        icono: '<rect x="4" y="5" width="16" height="11" rx="1"/><path d="M9 20h6M12 16v4"/>',
        texto: 'Casi todas las estaciones trabajan sin nadie: un sistema llamado SCADA las vigila desde lejos. Mide presión y flujo, y esa antena manda los datos. El paro de emergencia detecta una caída de presión o una fuga, y actúa solo. La caja amarilla prepara el gas que queman las turbinas.' },
    { parte: 'cruce', nombre: 'Cruce de río', modo: 'presion', accion: 'diablo', eq: 'Abajo de un río, 180 cm de tierra como mínimo', recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 8c3-2 6 2 9 0s6 2 9 0M3 13c3-2 6 2 9 0s6 2 9 0"/><path d="M3 19h18"/>',
        texto: 'Para cruzar un río, el tubo baja más: mira cómo se hunde en el corte. La norma pide al menos 180 cm de tierra encima en suelo normal, porque el agua erosiona. Cruzar una carretera pide 90 cm, y una vía de tren, 120 cm.' },
    { parte: 'estacion2', nombre: 'Otra estación', modo: 'presion', accion: 'apagar', eq: 'Suelen ir cada 80 a 160 km', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 20V10l5 3V10l5 3V6h6v14Z"/>',
        texto: 'Después de unos 150 km, la fricción ya le quitó mucha presión al gas, y otra estación se la regresa. Este tramo tiene dos: en Villagrán y en Doctor Arroyo. Apaga una y mira el color del tubo: pasa menos gas, y con la misma cantidad llega con menos presión.' },
    { parte: 'catodica', nombre: 'Protección catódica', modo: 'presion', accion: 'desarme', eq: 'Un rectificador y ánodos enterrados', recorrido: { noche: false, adentro: false },
        icono: '<rect x="8" y="3" width="8" height="8" rx="1"/><path d="M12 11v10M7 17v4M17 17v4"/>',
        texto: 'La tierra húmeda corroe el acero. Para evitarlo, ese rectificador manda una corriente pequeña por la tierra, de los ánodos negros al tubo. Así, el que se gasta es el ánodo y no el tubo. Mira el otro hueco del corte: ahí están enterrados, y el cable de cobre los une.' },
    { parte: 'medicion', nombre: 'Medición y regulación', modo: 'empaque', abrir: true, accion: 'corte', eq: 'Aquí se entrega el gas', recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="13" r="7"/><path d="M12 13l4-4M12 3v3"/>',
        texto: 'Aquí se entrega. Primero se filtra y pasa por un calentador, porque al bajar la presión el gas se enfría, y los reguladores podrían congelarse. Luego se reparte en tres líneas iguales: las piezas azules miden cuánto sale, y los reguladores amarillos bajan la presión a la que pide quien lo recibe.' },
    { parte: 'olor', nombre: 'Odorización', modo: 'empaque', accion: 'corte', eq: 'Debe oler con solo 1 % de gas en el aire', recorrido: { noche: false, adentro: false },
        icono: '<path d="M8 21c-2-3 2-5 0-8s2-5 0-8M16 21c-2-3 2-5 0-8s2-5 0-8"/>',
        texto: 'El gas natural casi no huele. Este tanque le agrega un líquido de olor muy fuerte, casi siempre un mercaptano, para que una fuga se note. La norma pide que se perciba cuando hay 1 % de gas en el aire, o una quinta parte de lo que haría falta para que explote.' },
    { parte: 'entregas', nombre: 'Central y ciudad', modo: 'empaque', accion: 'corte', eq: 'En 2017, 38 % del gas fue a centrales', recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 21V10l5-3v14M12 21V4h4v17M3 21h18M20 21v-8"/>',
        texto: 'De aquí sale a una central eléctrica y a una ciudad. Las centrales son su mayor cliente, y sin gas no hay luz: en febrero de 2021, Texas dejó de enviar gas, y 4.6 millones de clientes tuvieron fallas eléctricas en México. Corta el gas y mira cuánto aguanta este tubo.' },
];
const VISTAS = Object.fromEntries(PARTES_M.map(p => [p.id, p.vista]));
const mandoQ = { nombre: 'Gas al día (pies³)', campo: 'q', rango: LIMITES.q, texto: v => `${num(v)} millones` };
const MODOS = {
    presion: { nombre: 'Presión', corto: 'Presión', resumen: 'El gas avanza porque va de más presión a menos, y la fricción le quita presión cada vez más rápido. Si mandas el doble, la caída crece cuatro veces. Apaga estaciones y mira cuánto menos pasa.', aclara: 'Más junto, más presión. Al bajar la presión, el gas se estira y va más rápido.', mando: mandoQ },
    estacion: { nombre: 'Estación', corto: 'Estación', resumen: 'Una estación le regresa la presión al gas. Con más gas, la presión cae más y la estación trabaja mucho más: al doble de gas, varias veces la potencia. Y esa potencia se paga con gas.', aclara: 'Lo que cambia en el gas al cruzar una estación.', mando: mandoQ },
    empaque: { nombre: 'Un día', corto: 'Un día', resumen: 'El gas se aprieta, así que el tubo también guarda. De noche la demanda sube y el tubo se vacía un poco; de madrugada se vuelve a llenar. Eso es el empaque. Corta el gas y mira cuánto aguanta.', aclara: 'Lo que entra, lo que sale y lo que guarda el tubo, en este momento. La demanda es de ejemplo.', mando: { nombre: 'Hora del día', campo: 'hora', rango: LIMITES.hora, texto: v => hora(v) }, mando2: { nombre: 'Gas que entra (pies³)', campo: 'oferta', rango: LIMITES.oferta, texto: v => `${num(v)} millones` }, reloj: { texto: 'el día', avanzar: (p, dt) => { p.hora += (dt * 24) / 30; if (p.hora >= 24) p.hora = 0; return false; }, alSeguir: () => {} } },
    fuga: { nombre: 'Una fuga', corto: 'Fuga', resumen: 'Si el tubo se rompe, el gas sale de los dos lados hasta que las válvulas cierran. Luego, solo se vacía lo que quedó entre ellas. Por eso importa qué tan rápido cierran y qué tan juntas están. El modelo es de ejemplo.', aclara: 'El tramo entre dos válvulas, y lo que se pierde.', mando: { nombre: 'Tiempo para cerrar las válvulas', campo: 'tc', rango: LIMITES.tc, texto: v => `${num(v)} minutos` } },
};
const siguiente = (lista, v) => lista[(lista.indexOf(v) + 1) % lista.length];
const BOTONES = [
    { id: 'estaciones', visible: p => p.modo === 'presion' || p.modo === 'estacion', pulsado: p => p.est < 2, texto: p => (p.est === 2 ? 'Las dos estaciones' : p.est === 1 ? 'Una estación' : 'Sin estaciones'), alTocar: p => { p.est = siguiente([2, 1, 0], p.est); } },
    { id: 'pico', visible: p => p.modo === 'empaque', pulsado: p => p.pico !== DEF.pico, texto: p => (p.pico === 0 ? 'Demanda pareja' : p.pico === DEF.pico ? 'Hora pico normal' : 'Hora pico fuerte'), alTocar: p => { p.pico = siguiente([DEF.pico, 60, 0], p.pico); } },
    { id: 'corte', visible: p => p.modo === 'empaque', pulsado: p => p.corte, texto: p => (p.corte ? 'Regresar el gas' : 'Cortar el gas a las 6:00'), alTocar: p => { p.corte = !p.corte; } },
    { id: 'rompe', visible: p => p.modo === 'fuga', pulsado: p => p.rompe, texto: p => (p.rompe ? 'Reparar el tubo' : 'Que se rompa el tubo'), alTocar: p => { p.rompe = !p.rompe; } },
    { id: 'clase', visible: p => p.modo === 'fuga', pulsado: p => p.clase > 0, texto: p => `${VALVULAS_NOM[p.clase].clase}: ${VALVULAS_NOM[p.clase].km} km`, alTocar: p => { p.clase = (p.clase + 1) % VALVULAS_NOM.length; p.rompe = false; } },
];
const ACCIONES = {
    masGas: { texto: p => (p.q > 1300 ? 'Regresar el flujo' : 'Mandar toda su capacidad'), hacer: (p, pag) => { p.q = p.q > 1300 ? DEF.q : DUCTO.capacidad; pag.invalidar(); pag.ponerMando(); } },
    diablo: { texto: () => 'Mandar un diablo', hacer: p => { p.diablo = true; } },
    estaciones: { texto: p => (p.est === 2 ? 'Apagar una estación' : 'Encender las dos'), hacer: (p, pag) => { p.est = p.est === 2 ? 1 : 2; pag.invalidar(); pag.rotular(); } },
    apagar: { texto: p => (p.est === 2 ? 'Apagar esta estación' : 'Encenderla'), hacer: (p, pag) => { p.est = p.est === 2 ? 1 : 2; if (p.est === 1) p.q = DUCTO.capacidad; pag.invalidar(); pag.ponerMando(); pag.rotular(); } },
    rompe: { texto: p => (p.rompe ? 'Reparar el tubo' : 'Que se rompa el tubo'), hacer: (p, pag) => { p.rompe = !p.rompe; pag.invalidar(); pag.rotular(); } },
    corte: { texto: p => (p.corte ? 'Regresar el gas' : 'Cortar el gas'), hacer: (p, pag) => { p.corte = !p.corte; if (p.corte) { p.hora = 6; } pag.invalidar(); pag.ponerMando(); pag.rotular(); } },
};

// ------------------------------------------------------------------ el tablero
const secciones = () => `
    ${seccionDiagrama('Cómo se aprieta el gas')}
    ${seccionGrafica('b')}
    ${seccionGrafica('c')}
    ${seccionBarras()}
    ${seccionTabla('El modelo contra lo publicado', 'h-curva', 'La fricción se ajustó para que dé la capacidad publicada; lo demás sale de la cuenta. Los promedios son de Estados Unidos, en 2006, y de ductos de todo tamaño.', 'h-tabla-texto')}
    ${seccionTabla('Gasoductos de México', 'h-mexico', 'Lo que informó el CENAGAS en 2017; varias fuentes dan cifras un poco distintas. Hoy, la red nacional mide alrededor de 21 mil kilómetros (2026). La capacidad, en millones de pies cúbicos al día.', 'h-tabla-texto')}
    ${seccionTabla('Distancia máxima entre válvulas', 'h-valvulas', 'NOM-020-ASEA-2024, tabla 5. Mientras más gente vive cerca, más juntas deben ir.', 'h-tabla-texto')}
    ${seccionTabla('Tierra encima del tubo, como mínimo', 'h-tierra', 'NOM-020-ASEA-2024: al lomo del tubo, en centímetros. El dibujo no está a escala.', 'h-tabla-texto')}
    ${seccionTabla('Qué permiso pide cada cosa', 'h-regla', 'Transportar gas natural por ducto lo permite la Comisión Nacional de Energía (CNE). La seguridad y el ambiente son de la ASEA, con la NOM-020-ASEA-2024.')}
    <section class="g-curva h-media">
        <div class="g-curva-cab"><b>Quién usó el gas de la red nacional</b></div>
        <div class="h-barras" id="h-pesa"></div>
        <p>De cada 100, de enero a septiembre de 2017, según el CENAGAS.</p>
    </section>
    <section class="g-curva h-media">
        <div class="g-curva-cab"><b>De dónde llegó</b></div>
        <div class="h-barras" id="h-pesa2"></div>
        <p>De cada 100, de enero a septiembre de 2017, según el CENAGAS. Hoy, alrededor de 75 de cada 100 vienen de Estados Unidos (2026).</p>
    </section>
    ${seccionColores(FLUIDOS, `Tiene las cifras de Los Ramones Fase II Norte, pero no es su plano ni un simulador. Nada está a escala. No toma en cuenta que el terreno sube, y de la fuga solo se ve la tendencia. Es de ejemplo: dónde están las estaciones, la fricción, la presión de entrega (${P_ENTREGA} bar), el acero de la pared, la demanda del día y el modelo de la fuga.`)}
    ${seccionFuentes(FUENTES, [
        { para: 'Quién da el permiso de transporte, el acceso abierto y el papel del CENAGAS', titulo: 'Ley del Sector Hidrocarburos, arts. 76, 99, 100, 104 y 116', nota: 'Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio' },
        { para: 'Cuánto dura el permiso, y para qué se otorga', titulo: 'Reglamento de la Ley del Sector Hidrocarburos, arts. 92, 93 y 126', nota: 'Diario Oficial de la Federación, 3 de octubre de 2025. Está en el acervo de este sitio' },
        { para: 'La CNE otorga los permisos de gas natural', titulo: 'Ley de la Comisión Nacional de Energía, art. 9', nota: 'Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio' },
    ])}`;

const KM = [0, 75, 150, 225, 300, 375, 447];
function alPintarGraficas(L, pag) {
    const { $, pide, graficas } = pag;
    const m = pide.modo;
    graficas.b = null;
    graficas.c = null;
    if (m === 'presion') {
        const q = pide.q;
        const lineas = [
            { clase: 'h-s-actual', nombre: 'Con este flujo', f: km => perfil(q, pide.est).pEn(km) },
            { clase: 'h-s-sin', nombre: 'Sin estaciones', f: km => perfil(q, 0).pEn(km) },
            { clase: 'h-s-max', nombre: 'Toda su capacidad', f: km => P_CAP.pEn(km) },
        ];
        $('#h-b-t').textContent = 'La presión a lo largo del ducto';
        $('#h-b-ley').innerHTML = leyenda(lineas);
        $('#h-b-pie').textContent = `La curva cae cada vez más rápido. Cada estación regresa el gas a su máximo, ${num(PMOP, 1)} bar (1,200 libras por pulgada cuadrada).`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'La presión a lo largo del ducto', xMin: 0, xMax: DUCTO.km, yMin: 0, yMax: 90, ticksX: [0, 150, 300, 447], ticksY: [0, 30, 60, 90], etX: 'Kilómetro', etY: 'bar', lineas, fx: x => num(x), fy: y => num(y), punta: x => `km ${num(x)} · ${lineas.map(l => `${l.nombre}: ${num(l.f(x))} bar`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Kilómetro', 'Con este flujo, bar', 'Sin estaciones, bar', 'A capacidad, bar'], KM.map(k => [num(k), ...lineas.map(l => num(l.f(k)))]));
        const pos = n => ({ clase: ['h-s-max', 'h-s-sin', 'h-s-actual'][n], nombre: ['Sin estaciones', 'Una estación', 'Dos estaciones'][n], f: x => perfil(x, n).fin });
        const lc = [pos(2), pos(1), pos(0), { clase: 'h-s-norma', nombre: `Para entregar: ${P_ENTREGA} bar`, f: () => P_ENTREGA }];
        $('#h-c-t').textContent = 'Con cuánta presión llega';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Donde cada línea cruza la punteada está lo más que puede entregar: ${num(capacidad(0))} sin estaciones, ${num(capacidad(1))} con una y ${num(capacidad(2))} con dos. Abajo de 20 bar, el tubo ya no deja pasar más.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Con cuánta presión llega', xMin: 0, xMax: 1800, yMin: 0, yMax: 90, ticksX: [0, 600, 1200, 1800], ticksY: [0, 30, 60, 90], etX: 'Gas que se envía, millones de pies³ al día', etY: 'bar', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} millones · ${lc.slice(0, 3).map(l => `${l.nombre}: ${num(l.f(x))} bar`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Gas al día', 'Sin estaciones, bar', 'Una, bar', 'Dos, bar'], [400, 800, 1000, 1200, 1430, 1800].map(x => [num(x), num(perfil(x, 0).fin), num(perfil(x, 1).fin), num(perfil(x, 2).fin)]));
    } else if (m === 'estacion') {
        const C = q => { const P = perfil(q, 2); return compresion(P.q, P.succion[0]); };
        $('#h-b-t').textContent = 'La potencia de una estación';
        $('#h-b-ley').textContent = '';
        $('#h-b-pie').textContent = `Con las dos estaciones encendidas. Al doble de gas, varias veces la potencia. En Estados Unidos, una estación promedio tiene unos 20 caballos por millón de pies cúbicos; aquí, a toda capacidad, ${num(C_CAP.hp / DUCTO.capacidad)}.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'La potencia de una estación', xMin: 0, xMax: 1800, yMin: 0, yMax: 50, ticksX: [0, 600, 1200, 1800], ticksY: [0, 25, 50], etX: 'Gas que se envía, millones de pies³ al día', etY: 'MW', f: q => C(q).MW, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} millones · ${f1(C(x).MW)} MW` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Gas al día', 'Sube, bar', 'Potencia, MW', 'Caballos', 'Quema, %'], [400, 800, 1000, 1200, 1430, 1800].map(x => { const c = C(x); return [num(x), f1(c.sube), f1(c.MW), num(c.hp), f2(c.pct)]; }));
        $('#h-c-t').textContent = 'Qué tan caliente sale del compresor';
        $('#h-c-ley').textContent = '';
        $('#h-c-pie').textContent = 'Por eso, antes de regresar al tubo, el gas pasa por los enfriadores. Entra a unos 20 °C, de ejemplo.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Qué tan caliente sale', xMin: 0, xMax: 1800, yMin: 0, yMax: 90, ticksX: [0, 600, 1200, 1800], ticksY: [0, 30, 60, 90], etX: 'Gas que se envía, millones de pies³ al día', etY: '°C', f: q => C(q).sale, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} millones · ${num(C(x).sale)} °C` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Gas al día', 'Sale a, °C'], [400, 800, 1000, 1200, 1430, 1800].map(x => [num(x), num(C(x).sale)]));
    } else if (m === 'empaque') {
        const D = L.D;
        const lineas = [{ clase: 'h-s-actual', nombre: 'Lo que piden', f: D.demandaEn }, { clase: 'h-s-sin', nombre: 'Lo que entra', f: D.entraEn }];
        $('#h-b-t').textContent = 'Lo que entra y lo que piden';
        $('#h-b-ley').innerHTML = leyenda(lineas);
        $('#h-b-pie').textContent = 'Donde piden más de lo que entra, el tubo se vacía un poco; donde piden menos, se llena. La forma de la demanda es de ejemplo.';
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Lo que entra y lo que piden', xMin: 0, xMax: 24, yMin: 0, yMax: 1800, ticksX: [0, 6, 12, 18, 24], ticksY: [0, 600, 1200, 1800], etX: 'Hora', etY: 'millones de pies³ al día', lineas, fx: x => num(x), fy: y => num(y), punta: x => `${hora(x)} · piden ${num(D.demandaEn(x))} · entra ${num(D.entraEn(x))}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Hora', 'Piden', 'Entra', 'Guarda'], [0, 4, 8, 12, 16, 20, 22].map(h => [`${h}:00`, num(D.demandaEn(h)), num(D.entraEn(h)), num(D.guardado(h))]));
        const lc = [{ clase: 'h-s-actual', nombre: 'Al llegar', f: D.llegaEn }, { clase: 'h-s-sin', nombre: 'Al salir de la estación', f: D.saleP }, { clase: 'h-s-norma', nombre: `Para entregar: ${P_ENTREGA} bar`, f: () => P_ENTREGA }];
        $('#h-c-t').textContent = 'La presión en el día';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = pide.corte && D.horasCorte !== null ? `Sin gas a las 6:00, la presión baja de ${P_ENTREGA} bar en ${f1(D.horasCorte)} horas. El tubo guarda mucho, pero solo una parte se puede usar sin que le falte presión.` : 'La estación no puede pasar de su presión máxima: lo que falta se nota al llegar.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'La presión en el día', xMin: 0, xMax: 24, yMin: 0, yMax: 90, ticksX: [0, 6, 12, 18, 24], ticksY: [0, 30, 60, 90], etX: 'Hora', etY: 'bar', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${hora(x)} · llega a ${num(D.llegaEn(x))} bar · sale a ${num(D.saleP(x))} bar` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Hora', 'Al llegar, bar', 'Al salir, bar'], [0, 4, 8, 12, 16, 20, 22].map(h => [`${h}:00`, num(D.llegaEn(h)), num(D.saleP(h))]));
    } else {
        const R = L.R;
        const lineas = [{ clase: 'h-s-actual', nombre: 'En el tramo', f: x => enFuga(R, x).P }];
        $('#h-b-t').textContent = 'La presión en el tramo roto';
        $('#h-b-ley').textContent = '';
        $('#h-b-pie').textContent = `Mientras las válvulas sigan abiertas sigue llegando gas. Con ${VALVULAS_NOM[L.clase].km} km entre válvulas, tarda cerca de ${num(R.tau * 3)} minutos en vaciarse casi todo. Modelo de ejemplo.`;
        const xMax = Math.ceil(R.fin / 10) * 10;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'La presión en el tramo roto', xMin: 0, xMax, yMin: 0, yMax: 90, ticksX: [0, Math.round(xMax / 2), xMax], ticksY: [0, 30, 60, 90], etX: 'Minutos desde la rotura', etY: 'bar', f: lineas[0].f, refsX: [{ x: R.tc, texto: 'Cierran' }], fx: x => num(x), fy: y => num(y), punta: x => `Minuto ${num(x)} · ${num(enFuga(R, x).P)} bar` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Minuto', 'Presión, bar', 'Perdido, millones de pies³'], [0, 5, 10, 20, 30, 45, 60].map(x => [num(x), num(enFuga(R, x).P), num(enFuga(R, x).perdido)]));
        const series = VALVULAS_NOM.slice(0, 3).map((v, i) => ({ clase: ['h-s-actual', 'h-s-sin', 'h-s-max'][i], nombre: `${v.km} km`, f: x => fuga({ tc: x, clase: i }).perdido.at(-1) }));
        series.push({ clase: 'h-s-norma', nombre: `${VALVULAS_NOM[3].km} km`, f: x => fuga({ tc: x, clase: 3 }).perdido.at(-1) });
        $('#h-c-t').textContent = 'Lo que se pierde, según qué tan rápido cierran';
        $('#h-c-ley').innerHTML = leyenda(series);
        $('#h-c-pie').textContent = `Millones de pies cúbicos. Una línea por cada distancia entre válvulas. Como comparación, en un día pasan ${num(DUCTO.capacidad)} a toda su capacidad.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Lo que se pierde', xMin: 1, xMax: 30, yMin: 0, yMax: 250, ticksX: [1, 10, 20, 30], ticksY: [0, 125, 250], etX: 'Minutos para cerrar', etY: 'millones de pies³', lineas: series, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} min · ${series.map(l => `${l.nombre}: ${num(l.f(x))}`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Cierran en', ...VALVULAS_NOM.map(v => `${v.km} km`)], [3, 10, 20, 30].map(x => [`${x} min`, ...VALVULAS_NOM.map((_, i) => num(fuga({ tc: x, clase: i }).perdido.at(-1)))]));
    }
}
function pintarBarras(L, pag) {
    const { $, pide } = pag;
    let filas;
    if (pide.modo === 'presion') {
        const P = L.P;
        const paradas = ESTACIONES.filter((_, i) => P.on[i]);
        filas = [{ t: 'Al salir', v: 1 }, ...paradas.map((e, i) => ({ t: `Llega a ${e.nombre}`, v: P.succion[i] / PMOP })), { t: 'Al final del ducto', v: P.fin / PMOP, activa: true }];
        $('#h-d-t').textContent = 'La presión, de cada 100 de su máximo';
        $('#h-d-pie').textContent = `A ${num(PMOP)} bar, en el mismo espacio cabe ${num(apretado(PMOP))} veces más gas que al aire libre.`;
    } else if (pide.modo === 'estacion') {
        const C = L.C;
        filas = ESTACIONES.map((e, i) => ({ t: e.nombre, v: C[i] ? C[i].pct / 100 : 0, escala: 0.01, d: 2 }));
        $('#h-d-t').textContent = 'Gas que quema cada estación, de cada 100';
        $('#h-d-pie').textContent = 'La turbina gasta una pequeña parte del gas que pasa. Eficiencias y poder del gas, de ejemplo.';
    } else if (pide.modo === 'empaque') {
        filas = [{ t: 'Lo que se puede usar', v: L.pct, activa: true }, { t: 'Lo que piden, contra su capacidad', v: L.demanda / DUCTO.capacidad }];
        $('#h-d-t').textContent = 'De cada 100';
        $('#h-d-pie').textContent = `«Lo que se puede usar» va de ${P_ENTREGA} bar a la presión máxima. Sin entrar más gas, alcanzaría para unas ${f1(L.alcanza)} horas antes de bajar de ${P_ENTREGA} bar al llegar.`;
    } else {
        const R = L.R;
        const pierde = R.perdido.at(-1);
        filas = [{ t: 'Lo que había en el tramo', v: R.tramo / pierde, activa: true }, { t: 'Lo que siguió llegando', v: Math.max(0, pierde - R.tramo) / pierde }];
        $('#h-d-t').textContent = 'De dónde sale lo que se pierde, de cada 100';
        $('#h-d-pie').textContent = `En total, cerca de ${num(pierde)} millones de pies cúbicos con ${num(R.L / 1000)} km entre válvulas, cerrando en ${num(R.tc)} minutos.`;
    }
    $('#h-barras').innerHTML = barrasHTML(filas);
}
function alPintarFijas({ $ }) {
    $('#h-curva').innerHTML = tablaHTML(['Qué', 'Modelo', 'Publicado'], [
        ['Capacidad al día, en millones de pies³', num(capacidad(2)), '1,363 a 1,430'],
        ['Distancia entre estaciones', '150 km', '80 a 160 km'],
        ['Lo que sube la presión por estación', `${num(C_CAP.sube / PSI_BAR)} libras`, '250 libras, promedio'],
        ['Caballos por millón de pies³ al día', num(C_CAP.hp / DUCTO.capacidad), 'unos 20, promedio'],
        ['Viaje de punta a punta, a capacidad', `${num(viaje(DUCTO.capacidad))} horas`, 'sin dato'],
    ]);
    $('#h-mexico').innerHTML = tablaHTML(['Sistema', 'Largo, km', 'Capacidad'], [
        ['Sistema Nacional de Gasoductos', '8,867', '5,618'],
        ['Los Ramones Fase I', '116', '2,100'],
        ['Los Ramones Fase II Norte', '447', '1,363'],
        ['Los Ramones Fase II Sur', '292', '1,353'],
        ['Gasoductos de Tamaulipas', '114', '1,000'],
        ['Gasoductos del Bajío', '204', '90'],
        ['Gasoductos de Zacatecas', '172', '20'],
    ]);
    $('#h-valvulas').innerHTML = tablaHTML(['Lugar', 'Quién vive cerca', 'Distancia'], VALVULAS_NOM.map(v => [v.clase, v.nota, `${v.km} km`]));
    $('#h-tierra').innerHTML = tablaHTML(['Lugar', 'Suelo normal', 'Roca'], PROFUNDIDAD_NOM.map(([a, b, c]) => [a, `${b} cm`, `${c} cm`]));
    $('#h-regla').innerHTML = tablaHTML(['Para qué', 'Dónde lo dice'], [
        ['Transportar gas natural: lo permite la CNE, hasta por 30 años', 'Ley del Sector Hidrocarburos, arts. 76 y 116; Reglamento, art. 93'],
        ['Dar servicio a otros: quien tiene el permiso debe dar acceso abierto', 'Ley del Sector Hidrocarburos, art. 104'],
        ['Administrar la red nacional: el CENAGAS', 'Ley del Sector Hidrocarburos, arts. 99 y 100'],
        ['Seguridad del ducto: válvulas, profundidad y olor', 'NOM-020-ASEA-2024'],
    ]);
    $('#h-pesa').innerHTML = barrasHTML([{ t: 'Centrales eléctricas', v: 0.38, activa: true }, { t: 'Pemex', v: 0.22 }, { t: 'Distribución', v: 0.21 }, { t: 'Industria', v: 0.19 }].map(f => ({ ...f, escala: 0.6 })));
    $('#h-pesa2').innerHTML = barrasHTML([{ t: 'Importación, Golfo y Norte', v: 0.53, activa: true }, { t: 'Sureste', v: 0.23 }, { t: 'Otros', v: 0.09 }, { t: 'Burgos', v: 0.08 }, { t: 'Gas natural licuado', v: 0.05 }, { t: 'Importación, Chihuahua', v: 0.02 }].map(f => ({ ...f, escala: 0.6 })));
}
function alActualizar(L, pag) {
    const { pide, ponerCifra, ponerLecturas, nivel, graficas } = pag;
    pintarBarras(L, pag);
    ponerCifra('aT', { presion: 'Cómo se aprieta el gas', estacion: 'Qué pasa en una estación', empaque: 'El tubo como almacén', fuga: 'Un tramo entre dos válvulas' }[pide.modo]);
    if (pide.modo === 'presion') {
        const P = L.P;
        const conEst = L.est === 2 ? 'las dos estaciones' : L.est === 1 ? 'una estación' : 'las estaciones apagadas';
        const aviso = L.corta ? `No pasa tanto: con ${conEst}, el tubo deja pasar ${num(L.q)} como máximo, y llega con muy poca presión.` : P.fin < P_ENTREGA ? `Llega a ${num(P.fin)} bar: ya no alcanza para entregar. Con ${conEst}, lo más que puede es ${num(L.capacidad)}.` : null;
        ponerLecturas([['Gas que pasa', num(L.q), 'millones de pies³ al día'], ['En metros cúbicos', f1((L.q * 28316.8) / 1e6), 'millones al día'], ['Al salir', num(PMOP), 'bar'], ['Al final', num(P.fin), 'bar'], ['Velocidad al final', f1(L.vFin), `m/s; ${num(L.vIni, 1)} al inicio`], ['Tarda', L.viaje > 99 ? '+99' : num(L.viaje), 'horas en cruzar']], aviso);
        ponerCifra('hud', `${num(P.fin)} bar`);
        ponerCifra('hud2', `al final, ${L.est === 0 ? 'sin estaciones' : L.est === 1 ? 'con una estación' : 'con dos estaciones'}`);
        graficas.b?.marcar(DUCTO.km, P.fin);
        graficas.c?.marcar(L.q, P.fin);
        nivel(1, 'Flujo', clamp01(L.q / DUCTO.capacidad), `${num((L.q / DUCTO.capacidad) * 100)} %`);
        nivel(2, 'Presión final', clamp01(P.fin / PMOP), `${num((P.fin / PMOP) * 100)} %`);
    } else if (pide.modo === 'estacion') {
        const C = L.C.find(Boolean);
        const P = L.P;
        if (!C) {
            ponerLecturas([['Gas que pasa', num(L.q), 'millones de pies³ al día'], ['Al final', num(P.fin), 'bar'], ['Potencia', '0', 'MW'], ['Estaciones', '0', 'encendidas'], ['Gas quemado', '0', '%'], ['Capacidad', num(L.capacidad), 'millones de pies³ al día']], 'Sin estaciones, no se le regresa la presión al gas. Enciéndelas con el botón.');
            ponerCifra('hud', '0 MW');
            ponerCifra('hud2', 'estaciones apagadas');
            nivel(1, 'Potencia', 0, '0 MW');
            nivel(2, 'Temperatura', 0, 'sin compresión');
            return;
        }
        const aviso = C.sale > 60 ? `El gas sale a ${num(C.sale)} °C: los enfriadores deben trabajar mucho.` : L.q < 400 ? 'Con tan poco gas, casi no hay nada que comprimir.' : null;
        ponerLecturas([['Entra a', num(PMOP - C.sube), 'bar'], ['Sale a', num(PMOP), 'bar'], ['Potencia', f1(C.MW), `MW; ${num(C.hp)} caballos`], ['Sale del compresor', num(C.sale), '°C'], ['Gas que quema', f2(C.pct), '% del que pasa'], ['Estaciones', num(L.est), 'encendidas']], aviso);
        ponerCifra('hud', `${f1(C.MW)} MW`);
        ponerCifra('hud2', 'de potencia en una estación');
        graficas.b?.marcar(L.q, compresion(L.q, perfil(L.q, 2).succion[0]).MW);
        graficas.c?.marcar(L.q, compresion(L.q, perfil(L.q, 2).succion[0]).sale);
        nivel(1, 'Potencia', clamp01(C.MW / 50), `${num(C.MW)} MW`);
        nivel(2, 'Temperatura', clamp01(C.sale / 90), `${num(C.sale)} °C`);
    } else if (pide.modo === 'empaque') {
        const falta = L.llega < P_ENTREGA;
        const aviso = pide.corte && pide.hora >= DEF.horaCorte ? (falta ? `Ya no entra gas y la presión bajó de ${P_ENTREGA} bar: el tubo aguantó ${f1(L.D.horasCorte ?? 0)} horas.` : 'Ya no entra gas: se entrega lo que guarda el tubo.') : falta ? `Llega a ${num(L.llega)} bar: no alcanza para entregar con la presión debida.` : L.entra < L.demanda ? 'Piden más de lo que entra: el tubo se vacía un poco.' : null;
        ponerLecturas([['Hora', hora(pide.hora), 'del día'], ['Entra', num(L.entra), 'millones de pies³ al día'], ['Piden', num(L.demanda), 'millones de pies³ al día'], ['Guarda', num(L.guardado), 'millones de pies³'], ['Al llegar', num(L.llega), `bar; ${P_ENTREGA} para entregar`], ['Alcanzaría para', f1(L.alcanza), 'horas sin entrar gas']], aviso);
        ponerCifra('hud', num(L.guardado));
        ponerCifra('hud2', 'millones de pies³ en el tubo');
        graficas.b?.marcar(pide.hora, L.demanda);
        graficas.c?.marcar(pide.hora, L.llega);
        nivel(1, 'Por usar', L.pct, `${num(L.pct * 100)} %`);
        nivel(2, 'Piden', clamp01(L.demanda / DUCTO.capacidad), `${num((L.demanda / DUCTO.capacidad) * 100)} %`);
    } else {
        const F = L.F;
        const aviso = !F ? null : !F.cerrada ? 'Las válvulas siguen abiertas: el gas sigue llegando de los dos lados.' : F.vacia ? 'El tramo ya se vació. El resto del ducto conserva su gas.' : 'Las válvulas cerraron. Solo se vacía lo que quedó entre ellas.';
        ponerLecturas([['Minuto', F ? num(F.t) : '—', 'desde la rotura'], ['Presión en el tramo', F ? num(F.P) : num(L.R.P0), 'bar'], ['Gas perdido', F ? num(F.perdido) : '0', 'millones de pies³'], ['Válvulas', F?.cerrada ? 'Cerradas' : 'Abiertas', `a ${num(VALVULAS_NOM[L.clase].km)} km`], ['Se perderían', num(L.R.perdido.at(-1)), 'millones de pies³ en total'], ['Abajo de la rotura', `${f1(L.abajo.horas)} h`, 'de gas guardado']], aviso);
        ponerCifra('hud', F ? num(F.perdido) : `${num(VALVULAS_NOM[L.clase].km)} km`);
        ponerCifra('hud2', F ? 'millones de pies³ perdidos' : 'entre válvulas');
        if (F) graficas.b?.marcar(clamp(F.t, 0, 1e3), F.P);
        graficas.c?.marcar(L.tc, L.R.perdido.at(-1));
        nivel(1, 'Presión', clamp01((F ? F.P : L.R.P0) / PMOP), `${num(F ? F.P : L.R.P0)} bar`);
        nivel(2, 'Perdido', clamp01((F ? F.perdido : 0) / L.R.perdido.at(-1)), `${num(((F ? F.perdido : 0) / L.R.perdido.at(-1)) * 100)} %`);
    }
}

// ------------------------------------------------------------------ el gasoducto
let planta = estadoPlanta({});

crearPagina({
    figura: FIGURA,
    fichas: FICHAS,
    vistas: VISTAS,
    modos: MODOS,
    botones: BOTONES,
    acciones: ACCIONES,
    modo0: 'presion',
    pide: { q: DEF.q, est: DEF.est, pico: DEF.pico, oferta: DEF.oferta, hora: DEF.hora, corte: false, tc: DEF.tc, clase: DEF.clase, rompe: false, diablo: false },
    general: { Lx: 16.8, Lz: 6, alto: 2.9, mira: [0, 0.05, 0], az: 16, el: 28, azVertical: 14, elVertical: 34 },
    etiquetas: { lienzo: 'Gasoducto en 3D: arrastra para girarlo, toca un punto para conocerlo', modos: 'Qué ver en el gasoducto', puntos: 'Puntos clave del gasoducto', desarmar: 'Desarmar el gasoducto' },
    textoFinal: 'Toca cualquier punto para volver a verlo. Manda más gas en «Presión», apaga una estación, corta el gas en «Un día» o rompe el tubo en «Una fuga».',
    colores: { alta: FLUIDOS.alta.color, guindaSuave: '#f3d4de', claro: '#ffffff' },
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
        p.q = DEF.q;
        if (m === 'empaque' || m === 'fuga') p.est = 2;
        if (m === 'empaque') { p.hora = DEF.hora; p.oferta = DEF.oferta; p.pico = DEF.pico; }
    },
    alCuadro: ({ dt, pide }) => {
        planta = pasoPlanta(planta, { q: pide.q, est: pide.est, rompe: pide.modo === 'fuga' && pide.rompe, diablo: pide.diablo }, dt);
        pide.diablo = false;
    },
    poseDe: ({ pide, ve, encendido, t, dt, camara }) => pose({ modo: pide.modo, planta, q: pide.q, est: pide.est, pico: pide.pico, oferta: pide.oferta, hora: pide.hora, corte: pide.corte, tc: pide.tc, clase: pide.clase, noche: ve.noche, adentro: ve.adentro, desarme: ve.desarme, encendido, t, dt, camara }),
    firma: p => [p.modo, p.est, p.modo === 'presion' ? Math.round(p.q / 20) : 0, p.modo === 'empaque' ? [p.pico, Math.round(p.oferta / 10), p.corte] : 0, p.modo === 'fuga' ? [p.clase, Math.round(p.tc)] : 0],
    alPintarFijas,
    alPintarGraficas,
    alActualizar,
    prueba: p => ({ q: +planta.q.toFixed(0), est: p.est, e1: +planta.e1.toFixed(2), e2: +planta.e2.toFixed(2), ev: planta.ev === null ? null : +planta.ev.toFixed(1), pig: planta.pig === null ? null : +planta.pig.toFixed(2), hora: +p.hora.toFixed(1), pico: p.pico, oferta: +p.oferta.toFixed(0), corte: p.corte, tc: +p.tc.toFixed(1), clase: p.clase, rompe: p.rompe }),
});

