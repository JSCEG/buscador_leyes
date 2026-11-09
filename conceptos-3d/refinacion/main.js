// «Refinería», en 3D y con el formato Búho de «¿Cómo funciona?». Una refinería de ejemplo con el tamaño y el crudo de Olmeca (Dos Bocas, Tabasco): el crudo entra por
// la izquierda y los combustibles salen por la derecha. Cuatro formas de verla: la torre, la conversión, el azufre y el octano. Puntos clave con su ficha, ver por
// dentro, desarmar, día y noche, y gráficas que leen las mismas cifras que la mueven (modelo.js). Se arma con: node scripts/build-conceptos-3d.mjs refinacion
//
// Lo que se repite entre las plantas con física está en conceptos-3d/planta-comun/.
import { clamp, clamp01, num } from '../planta-comun/ayudas.js';
import { barrasHTML, leyenda, pintarGrafica, seccionBarras, seccionColores, seccionDiagrama, seccionFuentes, seccionGrafica, seccionTabla, tablaHTML } from '../planta-comun/graficas.js';
import { crearPagina } from '../planta-comun/pagina.js';
import { CALIDAD, CALIENTE, CRUDOS, DEF, FLUIDOS, HORNO_MAX, LIMITES, LISTA_CORTES, NIVELES, NOMBRES_CORTE, ORDEN_CRUDOS, PARTES as PARTES_M, REFINERIA, REND, azufreDeCortes, azufreDiesel, balance, destilado, destinoAzufre, estadoPlanta, hidrogeno, octano, pasoPlanta, pose, rendimientoReformado, severidadPara } from './modelo.js';
import { P_PLANTA, construir, escenario, materiales } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';

const FIGURA = 'refinacion';
const S0 = destinoAzufre();
const B0 = balance();
const f1 = x => num(x, 1);
const f2 = x => num(x, 2);

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'crudo', nombre: 'Crudo', modo: 'torre', abrir: true, accion: 'crudo', eq: `La refinería Olmeca: ${num(REFINERIA.carga)} mil barriles al día`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11Z"/>',
        texto: `Llega por ese ducto de la izquierda y se guarda en estos tanques. No todos los crudos son iguales. El Maya es pesado (${num(CRUDOS.maya.api, 1)} °API) y trae ${num(CRUDOS.maya.s, 1)} % de azufre; el crudo Olmeca es ligero (${num(CRUDOS.olmeca.api, 1)} °API) y trae ${f2(CRUDOS.olmeca.s)} %. Mientras más pesado, más se queda en el fondo de la torre, y más plantas hacen falta para sacarle gasolina.` },
    { parte: 'desaladora', nombre: 'Desaladora', modo: 'torre', abrir: true, accion: 'desarme', eq: 'El primer paso: agua, sales y sólidos se van', recorrido: { noche: false, adentro: false },
        icono: '<rect x="3" y="8" width="18" height="8" rx="4"/><path d="M3 13h18M8 16v3M16 16v3"/>',
        texto: 'El crudo trae agua, sales y sólidos que dañarían los equipos. Aquí se separan: lo sucio se asienta abajo con el agua, y el crudo limpio sigue su camino. Por eso adentro ves dos capas: la azul es el agua con las sales. Ese tubo delgado de abajo se la lleva, para tratarla aparte.' },
    { parte: 'horno', nombre: 'Horno', modo: 'torre', abrir: true, accion: 'desarme', eq: `Cerca de ${DEF.horno} °C a la salida`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 21c-4 0-6-3-6-6 0-4 4-5 4-10 3 2 3 5 2 7 2-1 3-2 3-4 2 2 3 4 3 7 0 3-2 6-6 6Z"/>',
        texto: `Un fuego directo calienta el crudo, que pasa por dentro de esos tubos. Sale cerca de ${DEF.horno} °C, ya medio hecho vapor. No conviene pasar de unos ${HORNO_MAX} °C: las moléculas se empiezan a romper y dejan coque dentro de los tubos. Por eso lo más pesado se separa de otra forma.` },
    { parte: 'torre', nombre: 'Torre de destilación', modo: 'torre', abrir: true, accion: 'desarme', eq: 'Separa por temperatura, sin cambiar las moléculas', recorrido: { noche: false, adentro: false },
        icono: '<path d="M9 21V5a3 3 0 0 1 6 0v16"/><path d="M9 9h6M9 13h6M9 17h6M15 7h4M15 15h4"/>',
        texto: 'El vapor sube por decenas de platos y se va enfriando: abajo hace más calor, arriba menos. Cada sustancia se vuelve líquida en el plato de su temperatura, y de ahí se saca. Lo que llega hasta arriba se enfría con ese ventilador y cae en el tanque negro: es la nafta. Lo que no hirvió se junta en el fondo.' },
    { parte: 'vacio', nombre: 'Torre de vacío', modo: 'conversion', abrir: true, accion: 'nivelArriba', eq: `Maya: ${num(CRUDOS.maya.v.residuo, 1)} de cada 100 quedan como residuo`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M10 21V10L8 7V4h8v3l-2 3v11"/><path d="M6 13h12"/>',
        texto: 'Lo del fondo pasa por otro horno y llega aquí, a baja presión: así hierve sin romperse. Por eso es tan ancha: a baja presión, el vapor ocupa muchísimo. Separa el gasóleo pesado, que irá a la FCC, del residuo muy espeso, que irá a la coquizadora. Esos dos tubos guinda de arriba hacen el vacío.' },
    { parte: 'reforma', nombre: 'Reformadora', modo: 'octano', abrir: true, accion: 'ronAlto', eq: `La nafta de Maya tiene RON de ${num(CRUDOS.maya.ron, 1)}`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="7" cy="12" r="3"/><circle cx="17" cy="12" r="3"/><path d="M10 12h4M12 3v4M12 17v4"/>',
        texto: `Esa nafta no sirve en un motor: se encendería antes de tiempo. Aquí pasa por tres reactores con platino, cerca de 500 °C, que reacomodan sus moléculas. Sube mucho el octanaje, y de paso suelta hidrógeno. Pero el azufre envenena el platino: antes se le quita. A más octano, sale un poco menos de volumen.` },
    { parte: 'hds', nombre: 'Hidrodesulfuradora', modo: 'azufre', abrir: true, accion: 'severidadBaja', eq: `Diésel: ${CALIDAD.sDiesel} mg/kg como máximo. Gasolina: ${CALIDAD.sGasolinaProm} en promedio`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M8 21V6a4 4 0 0 1 8 0v15"/><path d="M8 10h8M8 15h8"/><path d="M4 21h16"/>',
        texto: 'Aquí se le quita el azufre al diésel y a otras corrientes. Pasan con hidrógeno por un catalizador, de 300 a 400 °C y de 30 a 130 atmósferas. El hidrógeno se lleva el azufre como un gas, H₂S, que se aparta en el tanque negro. El compresor guinda empuja el hidrógeno: la refinería necesita muchísimo.' },
    { parte: 'fcc', nombre: 'Desintegración catalítica', modo: 'conversion', abrir: true, accion: 'nivelArriba', eq: 'Reactor a 535 °C · regenerador a 715 °C', recorrido: { noche: false, adentro: false },
        icono: '<path d="M6 21V5h4v16"/><circle cx="16" cy="14" r="4"/><path d="M10 7h4l2 3"/>',
        texto: 'La FCC rompe moléculas grandes de gasóleo en otras chicas: gasolina y gases. Un polvo caliente, el catalizador, sube con la carga por ese tubo alto. Se ensucia de coque y baja al regenerador, donde el coque se quema a 715 °C. Ese calor regresa con el polvo, y empieza otra vuelta. Da vueltas sin parar.' },
    { parte: 'coquizadora', nombre: 'Coquizadora', modo: 'conversion', abrir: true, accion: 'nivelArriba', eq: `Con Maya, unas ${num(Math.round(B0.coqueT / 100) * 100)} t de coque al día`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="5" y="4" width="5" height="14" rx="2"/><rect x="14" y="4" width="5" height="14" rx="2"/><path d="M3 21h18"/>',
        texto: 'Le saca lo último al residuo. Sale del horno a unos 500 °C y en el tambor se rompe poco a poco: el vapor sigue a la columna y abajo crece un sólido, el coque. Un tambor se llena en 12 a 24 horas. Se enfría con agua y, desde esas torres, se corta con chorros, mientras el otro se llena. Fíjate cómo se turnan.' },
    { parte: 'hidrogeno', nombre: 'Planta de hidrógeno', modo: 'azufre', abrir: true, accion: 'severidadBaja', eq: 'Da lo que la reformadora no alcanza', recorrido: { noche: false, adentro: false },
        icono: '<path d="M7 5v14M17 5v14M7 12h10"/>',
        texto: 'La reformadora da hidrógeno, pero no alcanza para quitar tanto azufre. Esta planta hace el resto. En ese horno de tubos, vapor de agua y gas reaccionan a muy alta temperatura; luego, esas columnas blancas lo limpian. Mientras más azufre traiga el crudo, más hidrógeno pide la refinería.' },
    { parte: 'azufre', nombre: 'Planta de azufre', modo: 'azufre', abrir: true, accion: 'crudo', eq: `Con Maya entran unas ${num(Math.round(S0.entra / 100) * 100)} t de azufre al día`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 3 4 8v8l8 5 8-5V8Z"/><path d="M4 8l8 5 8-5M12 13v8"/>',
        texto: 'El gas con azufre de toda la refinería llega aquí. La columna blanca lo separa con aminas. En el horno y los lechos del proceso Claus, parte se quema y el gas se vuelve azufre, que se enfría y queda sólido. Se vende, entre otras cosas, para hacer ácido sulfúrico. Lo que no se atrapa saldría por la chimenea.' },
    { parte: 'mezclado', nombre: 'Mezclado y tanques', modo: 'octano', abrir: true, accion: 'ronBajo', eq: `Regular: índice de ${CALIDAD.regular}. Premium: ${CALIDAD.premium}`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="8" cy="7" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="17" r="2"/>',
        texto: 'Ninguna gasolina sale tal cual de una planta: se mezclan corrientes hasta cumplir la norma. Reformado y alquilado suben el octano; la nafta ligera lo baja. La Regular debe llegar a un índice de 87, y la Premium a 91. Antes de salir se comprueba su calidad. La esfera guarda gas LP a presión.' },
    { parte: 'servicios', nombre: 'Servicios y quemador', modo: 'torre', accion: 'noche', eq: 'Vapor, agua de enfriamiento y seguridad', recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 21c-3 0-5-2-5-5 0-3 3-4 3-8 3 2 4 4 3 6 1 0 2-1 2-3 2 2 2 3 2 5 0 3-2 5-5 5Z"/><path d="M4 21h16"/>',
        texto: 'Una refinería es casi una ciudad. Las torres de enfriamiento le sacan calor al agua; la caldera da vapor, y en el cuarto de control se vigila todo. El quemador, ese tubo alto con flama, es de seguridad: si algo falla, los gases se queman ahí arriba en vez de escapar. Su flama se ve desde lejos.' },
    { parte: 'salida', nombre: 'Salida al mercado', modo: 'conversion', accion: 'noche', eq: 'Ducto, buque y autotanque: otros permisos', recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 15h18l-3 5H6Z"/><path d="M8 15V9h8v6M12 9V5"/>',
        texto: 'Los combustibles salen en buque, en autotanque o por ducto, rumbo a los almacenes. Refinar lo permite la Secretaría de Energía. Transportar, guardar y vender gasolina y diésel lo permite la Comisión Nacional de Energía. Cada una de esas actividades lleva su propio permiso.' },
];
const VISTAS = Object.fromEntries(PARTES_M.map(p => [p.id, p.vista]));

const nivelDe = p => clamp(Math.round(p), 0, 3);
const MODOS = {
    torre: { nombre: 'La torre', corto: 'Torre', resumen: 'El crudo se calienta y se separa por temperatura. Súbele al horno: hierve más y queda menos abajo. Cambia de crudo: con el Maya, más de la mitad se queda en el fondo; con el Olmeca, solo un tercio.', aclara: 'De cada 100 barriles de crudo, qué sale a cada altura de la torre.', mando: { nombre: 'Temperatura del horno', campo: 'horno', rango: LIMITES.horno, texto: v => `${num(v)} °C` } },
    conversion: { nombre: 'Conversión', corto: 'Conversión', resumen: 'Destilar no alcanza. Agrega plantas una por una, y mira cómo baja el combustóleo y sube la gasolina. Por eso una refinería para crudo pesado es tan grande: rompe lo pesado para hacer ligero.', aclara: 'De cada 100 barriles de crudo, qué sale con estas plantas.', mando: { nombre: 'Plantas que trabajan', campo: 'plantas', rango: LIMITES.plantas, texto: v => NIVELES[nivelDe(v)] }, mando2: { nombre: 'Crudo procesado al día', campo: 'carga', rango: LIMITES.carga, texto: v => `${num(v)} mil barriles` } },
    azufre: { nombre: 'Azufre', corto: 'Azufre', resumen: 'El azufre hay que sacarlo, y entre más se quita, más hidrógeno se gasta. Baja la severidad y mira cómo el diésel deja de cumplir la norma. Con un crudo dulce, cuesta mucho menos.', aclara: 'A dónde va el azufre que entra con el crudo en un día.', mando: { nombre: 'Severidad de la hidrodesulfuradora', campo: 'severidad', rango: LIMITES.severidad, texto: v => `${num(v)} %` } },
    octano: { nombre: 'Octano', corto: 'Octano', resumen: 'La nafta sale con muy poco octano. Súbele a la reformadora: gana octano y da más hidrógeno, pero sale menos gasolina. La norma pide 87 en la Regular y 91 en la Premium.', aclara: 'Cuánto octano trae cada corriente de la gasolina, y la mezcla.', mando: { nombre: 'Octano de la reformadora (RON)', campo: 'ron', rango: LIMITES.ron, texto: v => num(v) } },
};
const BOTONES = [
    { id: 'crudo', visible: () => true, pulsado: p => p.crudo !== 'maya', texto: p => `Crudo ${CRUDOS[p.crudo].nombre}`, alTocar: p => { p.crudo = ORDEN_CRUDOS[(ORDEN_CRUDOS.indexOf(p.crudo) + 1) % 3]; } },
];
const ACCIONES = {
    crudo: { texto: p => `Probar con ${CRUDOS[ORDEN_CRUDOS[(ORDEN_CRUDOS.indexOf(p.crudo) + 1) % 3]].nombre}`, hacer: (p, pag) => { p.crudo = ORDEN_CRUDOS[(ORDEN_CRUDOS.indexOf(p.crudo) + 1) % 3]; pag.invalidar(); pag.rotular(); } },
    nivelArriba: { texto: p => (nivelDe(p.plantas) === 3 ? 'Apagar plantas' : 'Encender plantas'), hacer: (p, pag) => { p.plantas = nivelDe(p.plantas) === 3 ? 1 : 3; pag.invalidar(); pag.ponerMando(); } },
    severidadBaja: { texto: p => (p.severidad < 60 ? 'Subir la severidad' : 'Bajar la severidad'), hacer: (p, pag) => { p.severidad = p.severidad < 60 ? DEF.severidad : 40; pag.invalidar(); pag.ponerMando(); } },
    ronAlto: { texto: p => (p.ron > 100 ? 'Regresar a RON de 98' : 'Subir a RON de 104'), hacer: (p, pag) => { p.ron = p.ron > 100 ? DEF.ron : 104; pag.invalidar(); pag.ponerMando(); } },
    ronBajo: { texto: p => (p.ron < 90 ? 'Regresar a RON de 98' : 'Bajar a RON de 85'), hacer: (p, pag) => { p.ron = p.ron < 90 ? DEF.ron : 85; pag.invalidar(); pag.ponerMando(); } },
};

// ------------------------------------------------------------------ el tablero
const secciones = () => `
    ${seccionDiagrama('Lo que pasa en la torre')}
    ${seccionGrafica('b')}
    ${seccionGrafica('c')}
    ${seccionBarras()}
    ${seccionTabla('El modelo contra lo publicado', 'h-curva', 'Con el diseño de la refinería Olmeca, en Dos Bocas, se comprueba la cuenta. El diésel coincide; la gasolina queda 15 % abajo, porque aquí cada planta rinde lo de una refinería típica, de ejemplo.', 'h-tabla-texto')}
    ${seccionTabla('Tres crudos mexicanos', 'h-crudos', 'Análisis publicados en Oil & Gas Journal en el año 2000. Cada lote varía: hoy el Maya ronda 21 a 22 °API. Las columnas dicen cuántos de cada 100 barriles salen de cada corte.', 'h-tabla-texto')}
    ${seccionTabla('Refinerías de Pemex', 'h-mexico', 'En barriles al día: lo que pueden procesar contra lo que de verdad procesaron. Pemex tiene más; aquí solo van aquellas de las que se leyó la cifra. Ninguna de las tres de México llegó a su capacidad en 2025.')}
    ${seccionTabla('Qué permiso pide cada cosa', 'h-regla', 'Refinar el petróleo lo permite la Secretaría de Energía; lo que viene después, la Comisión Nacional de Energía. La seguridad y el ambiente son de otra autoridad: la ASEA. Las cifras de calidad de esta figura salen de la NOM-016-CRE-2016.')}
    <section class="g-curva h-media">
        <div class="g-curva-cab"><b>Qué tanto trabaja la refinería Olmeca</b></div>
        <div class="h-barras" id="h-pesa"></div>
        <p>De cada 100 de su capacidad de ${num(REFINERIA.carga)} mil barriles al día, según datos de Pemex. En abril de 2026 hubo un incendio en el área de coque.</p>
    </section>
    ${seccionColores(FLUIDOS, 'Refinería de ejemplo con el tamaño y el crudo de la refinería Olmeca, en Dos Bocas; no es su plano ni un simulador. Son menos plantas de las 17 que tiene (no se dibuja, por ejemplo, la que hace el alquilado), y nada está a escala. Lo que no sale de una fuente (cuánto rinde cada planta, lo que el azufre deja en cada corriente, el hidrógeno que se gasta, la curva de la reformadora y la de la severidad) es de ejemplo, para ver la tendencia.')}
    ${seccionFuentes(FUENTES, [
        { para: 'Quién da el permiso de refinar y de lo demás, qué es un petrolífero, y quién vigila la calidad', titulo: 'Ley del Sector Hidrocarburos, arts. 5, 76, 112 y 115', nota: 'Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio' },
        { para: 'Qué es refinar, cuánto dura el permiso y quién responde por la calidad', titulo: 'Reglamento de la Ley del Sector Hidrocarburos, arts. 3, fracc. XL, 93, 102 y 103', nota: 'Diario Oficial de la Federación, 3 de octubre de 2025. Está en el acervo de este sitio' },
    ])}`;

const CLASES = ['h-s-actual', 'h-s-sin', 'h-s-max'];
const fxNivel = x => ['Destilar', 'Vacío', 'FCC', 'Coque'][clamp(Math.round(x), 0, 3)];
const nombreNivel = x => NIVELES[clamp(Math.round(x), 0, 3)];
function alPintarGraficas(L, pag) {
    const { $, pide, graficas } = pag;
    const m = pide.modo;
    graficas.b = null;
    graficas.c = null;
    const c = pide.crudo;
    if (m === 'torre') {
        const lineas = ORDEN_CRUDOS.map((k, i) => ({ clase: CLASES[i], nombre: CRUDOS[k].nombre, f: T => destilado(k, T) }));
        $('#h-b-t').textContent = 'Cuánto ya hirvió, según la temperatura';
        $('#h-b-ley').innerHTML = leyenda(lineas);
        $('#h-b-pie').textContent = `Es la curva de destilación de cada crudo. A 344 °C ya hirvió 39 % del Maya y 65 % del Olmeca. El crudo llega a la torre unos 25 °C abajo de la salida del horno (de ejemplo). Lo que no hierve antes de unos ${HORNO_MAX} °C se separa en la torre de vacío.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Cuánto ya hirvió', xMin: 0, xMax: 600, yMin: 0, yMax: 100, ticksX: [0, 100, 200, 300, 400, 500, 600], ticksY: [0, 25, 50, 75, 100], etX: 'Temperatura, °C', etY: '% del crudo', lineas, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} °C · ${lineas.map(l => `${l.nombre}: ${num(l.f(x))} %`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['°C', 'Maya, %', 'Istmo, %', 'Olmeca, %'], [100, 177, 274, 344, 400, 538].map(T => [num(T), num(destilado('maya', T)), num(destilado('istmo', T)), num(destilado('olmeca', T))]));
        const puntos = [[103, 'nafta'], [225, 'keroseno'], [309, 'ligero'], [441, 'pesado'], [650, 'residuo']];
        const sLin = k => T => { const P = puntos.map(([x, n]) => [x, CRUDOS[k].ss[n]]); if (T <= P[0][0]) return P[0][1]; for (let i = 1; i < P.length; i++) if (T <= P[i][0]) return P[i - 1][1] + (P[i][1] - P[i - 1][1]) * ((T - P[i - 1][0]) / (P[i][0] - P[i - 1][0])); return P.at(-1)[1]; };
        const lc = ORDEN_CRUDOS.map((k, i) => ({ clase: CLASES[i], nombre: CRUDOS[k].nombre, f: sLin(k) }));
        $('#h-c-t').textContent = 'Azufre de cada corte';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = 'Lo más pesado trae más azufre. Por eso casi todo el azufre del crudo se queda en el residuo, y por eso sacarle gasolina al fondo del barril obliga a tratarla mucho más.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Azufre de cada corte', xMin: 100, xMax: 650, yMin: 0, yMax: 6, ticksX: [100, 200, 300, 400, 500, 600], ticksY: [0, 2, 4, 6], etX: 'Temperatura a la que hierve, °C', etY: '% en masa', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} °C · ${lc.map(l => `${l.nombre}: ${f1(l.f(x))} %`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Corte', 'Maya, %', 'Istmo, %', 'Olmeca, %'], ['nafta', 'keroseno', 'ligero', 'pesado', 'residuo'].map(n => [NOMBRES_CORTE[n], ...ORDEN_CRUDOS.map(k => num(CRUDOS[k].ss[n], 2))]));
    } else if (m === 'conversion') {
        const porNivel = (prod) => x => { const a = clamp(x, 0, 3); const i = Math.min(2, Math.floor(a)); const p0 = balance({ crudo: c, plantas: i, carga: pide.carga }).productos[prod]; const p1 = balance({ crudo: c, plantas: i + 1, carga: pide.carga }).productos[prod]; return p0 + (p1 - p0) * (a - i); };
        const lineas = [{ clase: 'h-s-actual', nombre: 'Gasolina', f: porNivel('gasolina') }, { clase: 'h-s-sin', nombre: 'Diésel', f: porNivel('diesel') }, { clase: 'h-s-max', nombre: 'Combustóleo', f: porNivel('combustoleo') }];
        $('#h-b-t').textContent = `Lo que sale del ${CRUDOS[c].nombre}, según las plantas`;
        $('#h-b-ley').innerHTML = leyenda(lineas);
        $('#h-b-pie').textContent = `Con ${num(pide.carga)} mil barriles al día. La torre de vacío sola no cambia lo que sale, pero sin ella no hay qué mandar a la FCC y a la coquizadora.`;
        const ymax = Math.ceil(Math.max(...[0, 1, 2, 3].flatMap(n => { const P = balance({ crudo: c, plantas: n, carga: pide.carga }).productos; return [P.gasolina, P.diesel, P.combustoleo]; })) / 50) * 50;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Lo que sale, según las plantas', xMin: 0, xMax: 3, yMin: 0, yMax: ymax, ticksX: [0, 1, 2, 3], ticksY: [0, Math.round(ymax / 2), ymax], etX: 'Plantas que trabajan', etY: 'miles de barriles al día', lineas, fx: fxNivel, fy: y => num(y), punta: x => `${nombreNivel(x)} · ${lineas.map(l => `${l.nombre}: ${num(l.f(x))}`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Plantas', 'Gasolina', 'Diésel', 'Combustóleo', 'Coque, t'], [0, 1, 2, 3].map(n => { const B = balance({ crudo: c, plantas: n, carga: pide.carga }); return [NIVELES[n], num(B.productos.gasolina), num(B.productos.diesel), num(B.productos.combustoleo), num(B.coqueT)]; }));
        const lg = ORDEN_CRUDOS.map((k, i) => ({ clase: CLASES[i], nombre: CRUDOS[k].nombre, f: x => { const a = clamp(x, 0, 3); const j = Math.min(2, Math.floor(a)); const p0 = balance({ crudo: k, plantas: j }).ligeros; const p1 = balance({ crudo: k, plantas: j + 1 }).ligeros; return (p0 + (p1 - p0) * (a - j)) * 100; } }));
        $('#h-c-t').textContent = 'Combustibles ligeros, de cada 100 barriles';
        $('#h-c-ley').innerHTML = leyenda(lg);
        $('#h-c-pie').textContent = 'Gasolina, diésel y gas LP. Solo destilando, el Maya da mucho menos que el Olmeca. Con todas las plantas, la diferencia casi se borra. Eso cuesta: es lo que hace valer más a un crudo ligero.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Combustibles ligeros', xMin: 0, xMax: 3, yMin: 0, yMax: 100, ticksX: [0, 1, 2, 3], ticksY: [0, 25, 50, 75, 100], etX: 'Plantas que trabajan', etY: 'de cada 100', lineas: lg, fx: fxNivel, fy: y => num(y), punta: x => `${nombreNivel(x)} · ${lg.map(l => `${l.nombre}: ${num(l.f(x))}`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Plantas', 'Maya', 'Istmo', 'Olmeca'], [0, 1, 2, 3].map(n => [NIVELES[n], ...ORDEN_CRUDOS.map(k => num(balance({ crudo: k, plantas: n }).ligeros * 100))]));
    } else if (m === 'azufre') {
        const nivel = nivelDe(pide.plantas);
        const lineas = ORDEN_CRUDOS.map((k, i) => ({ clase: CLASES[i], nombre: CRUDOS[k].nombre, f: x => Math.log10(Math.max(1, azufreDiesel({ crudo: k, plantas: nivel, severidad: x }).sale)) }));
        const limite = { clase: 'h-s-norma', nombre: `Máximo: ${CALIDAD.sDiesel} mg/kg`, f: () => Math.log10(CALIDAD.sDiesel) };
        $('#h-b-t').textContent = 'Azufre que le queda al diésel';
        $('#h-b-ley').innerHTML = leyenda([...lineas, limite]);
        $('#h-b-pie').textContent = `Cada línea de la cuadrícula es diez veces más azufre. Para llegar a ${CALIDAD.sDiesel} mg/kg, el ${CRUDOS.maya.nombre} pide ${num(severidadPara({ crudo: 'maya', plantas: nivel }))} % de severidad, y el ${CRUDOS.olmeca.nombre}, ${num(severidadPara({ crudo: 'olmeca', plantas: nivel }))} %. La línea punteada es el máximo de la norma. La forma de la curva es de ejemplo.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Azufre que le queda al diésel', xMin: 0, xMax: 100, yMin: 0, yMax: 5, ticksX: [0, 25, 50, 75, 100], ticksY: [0, 1, 2, 3, 4, 5], etX: 'Severidad, %', etY: 'mg/kg', lineas: [...lineas, limite], fx: x => num(x), fy: y => num(10 ** y), punta: x => `${num(x)} % · ${lineas.map(l => `${l.nombre}: ${num(10 ** l.f(x))}`).join(' · ')} mg/kg` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Severidad', 'Maya', 'Istmo', 'Olmeca'], [0, 25, 50, 75, 90, 100].map(x => [`${x} %`, ...ORDEN_CRUDOS.map(k => num(azufreDiesel({ crudo: k, plantas: nivel, severidad: x }).sale))]));
        const usa = x => hidrogeno({ crudo: c, plantas: nivel, severidad: x, ron: pide.ron }).usa;
        const da = () => hidrogeno({ crudo: c, plantas: nivel, severidad: pide.severidad, ron: pide.ron }).da;
        const lh = [{ clase: 'h-s-actual', nombre: 'Lo que se usa', f: usa }, { clase: 'h-s-sin', nombre: 'Lo que da la reformadora', f: da }];
        $('#h-c-t').textContent = `Hidrógeno al día, con ${CRUDOS[c].nombre}`;
        $('#h-c-ley').innerHTML = leyenda(lh);
        $('#h-c-pie').textContent = 'Lo que falta lo hace la planta de hidrógeno. Cifras de ejemplo.';
        const ymax = Math.ceil(usa(100) / 100) * 100 || 100;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Hidrógeno al día', xMin: 0, xMax: 100, yMin: 0, yMax: ymax, ticksX: [0, 25, 50, 75, 100], ticksY: [0, Math.round(ymax / 2), ymax], etX: 'Severidad, %', etY: 't al día', lineas: lh, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} % · usa ${num(usa(x))} t · la reformadora da ${num(da())} t` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Severidad', 'Usa, t', 'Planta, t'], [0, 25, 50, 75, 100].map(x => { const H = hidrogeno({ crudo: c, plantas: nivel, severidad: x, ron: pide.ron }); return [`${x} %`, num(H.usa), num(H.planta)]; }));
    } else {
        const nivel = nivelDe(pide.plantas);
        const fI = x => octano({ crudo: c, plantas: nivel, ron: x }).indice;
        const lineas = [{ clase: 'h-s-actual', nombre: 'La mezcla', f: fI }, { clase: 'h-s-sin', nombre: 'Regular', f: () => CALIDAD.regular }, { clase: 'h-s-max', nombre: 'Premium', f: () => CALIDAD.premium }];
        $('#h-b-t').textContent = 'Índice de octano de la mezcla';
        $('#h-b-ley').innerHTML = leyenda(lineas);
        $('#h-b-pie').textContent = 'El índice es (RON + MON) ÷ 2. Con toda esta mezcla se llega a la Regular. Para la Premium se aparta lo de más octano, como el reformado y el alquilado.';
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Índice de octano', xMin: 85, xMax: 104, yMin: 75, yMax: 95, ticksX: [85, 90, 95, 100], ticksY: [75, 80, 85, 90, 95], etX: 'RON del reformado', etY: 'índice', lineas, fx: x => num(x), fy: y => num(y), punta: x => `RON ${num(x)} · índice de ${f1(fI(x))}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['RON', 'Índice', 'Gasolina', 'Hidrógeno, t'], [85, 90, 95, 98, 100, 104].map(r => { const O = octano({ crudo: c, plantas: nivel, ron: r }); return [num(r), f1(O.indice), num(O.gasolina), num(O.h2)]; }));
        const fG = x => octano({ crudo: c, plantas: nivel, ron: x }).gasolina;
        const y0 = Math.floor(fG(104) / 10) * 10 - 10;
        const y1 = Math.ceil(fG(85) / 10) * 10 + 10;
        $('#h-c-t').textContent = 'Gasolina al día';
        $('#h-c-ley').textContent = '';
        $('#h-c-pie').textContent = `A más octano, menos volumen: con RON de 100 sale ${num(rendimientoReformado(100) * 100)} de cada 100 de lo que entra a la reformadora. Cifras de ejemplo.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Gasolina al día', xMin: 85, xMax: 104, yMin: y0, yMax: y1, ticksX: [85, 90, 95, 100], ticksY: [y0, Math.round((y0 + y1) / 2), y1], etX: 'RON del reformado', etY: 'miles de barriles', f: fG, fx: x => num(x), fy: y => num(y), punta: x => `RON ${num(x)} · ${num(fG(x))} mil barriles` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Corriente', 'Miles de barriles', 'RON', 'MON'], octano({ crudo: c, plantas: nivel, ron: pide.ron }).filas.map(f => [f.nombre, num(f.v), num(f.ron), num(f.mon)]));
    }
}
function pintarBarras(L, pag) {
    const { $, pide } = pag;
    let filas;
    if (pide.modo === 'torre') {
        const To = L.To;
        filas = [{ t: 'Gas', v: To.cortes.gas / 100, d: 1 }, { t: 'Nafta', v: To.cortes.nafta / 100 }, { t: 'Queroseno', v: To.cortes.keroseno / 100 }, { t: 'Gasóleo ligero', v: To.cortes.ligero / 100 }, { t: 'Se queda en el fondo', v: To.fondo / 100, activa: true }].map(f => ({ ...f, escala: 0.9 }));
        $('#h-d-t').textContent = `Lo que sale, de cada 100 barriles de ${L.C.nombre}`;
        $('#h-d-pie').textContent = `Con el horno a ${num(L.T)} °C, se vaporiza ${num(To.vapor)} % en la torre.`;
    } else if (pide.modo === 'conversion') {
        const P = L.B.productos;
        const k = 1 / L.B.carga;
        filas = [{ t: 'Gasolina', v: P.gasolina * k, activa: true }, { t: 'Diésel y queroseno', v: P.diesel * k }, { t: 'Gas LP', v: P.glp * k }, { t: 'Combustóleo', v: P.combustoleo * k }].map(f => ({ ...f, escala: 0.7 }));
        $('#h-d-t').textContent = 'Lo que sale, de cada 100 barriles';
        $('#h-d-pie').textContent = L.B.coqueT > 1 ? `Y además ${num(L.B.coqueT)} toneladas de coque al día. Por eso los líquidos suman menos de 100.` : 'Aún sin coque: el fondo del barril sale como combustóleo, el producto que menos vale.';
    } else if (pide.modo === 'azufre') {
        const S = L.S;
        filas = [{ t: 'Azufre sólido', v: S.solido / S.entra, activa: true }, { t: 'En el coque', v: S.enCoque / S.entra }, { t: 'En el combustóleo', v: S.combustoleo / S.entra }, { t: 'Por la chimenea', v: S.chimenea / S.entra, d: 1 }, { t: 'En los productos', v: S.enProductos / S.entra, d: 1 }];
        $('#h-d-t').textContent = 'A dónde va el azufre, de cada 100';
        $('#h-d-pie').textContent = `Con ${L.C.nombre} entran ${num(S.entra)} toneladas al día. El reparto y lo que atrapa la planta (${num(S.recupera * 100)} %) son de ejemplo.`;
    } else {
        const O = L.O;
        filas = O.filas.map(f => ({ t: f.nombre, v: f.v / O.total, activa: f.id === 'reformado' }));
        $('#h-d-t').textContent = 'De qué está hecha la gasolina, de cada 100';
        $('#h-d-pie').textContent = `Con RON de ${num(L.ron)}, la reformadora da ${num(L.H.da)} toneladas de hidrógeno al día. Cifras de ejemplo.`;
    }
    $('#h-barras').innerHTML = barrasHTML(filas);
}
function alPintarFijas({ $ }) {
    $('#h-pesa').innerHTML = barrasHTML([{ t: 'Diciembre de 2025', v: 263.402 / REFINERIA.carga, activa: true }, { t: 'Junio de 2026', v: 141 / REFINERIA.carga }, { t: 'Promedio a agosto de 2026', v: 248 / REFINERIA.carga }]);
    const A = azufreDeCortes('maya');
    const B = balance();
    $('#h-curva').innerHTML = tablaHTML(['Qué', 'Modelo', 'Publicado'], [
        ['Azufre del Maya, sumando sus cortes', `${f2(A.azufre)} %`, '3.4 %'],
        ['Grados API del Maya, sumando sus cortes', `${f1(A.api)}`, '21.5'],
        ['Gasolina al día', `${num(B.productos.gasolina)} mil`, '173 mil'],
        ['Diésel al día', `${num(B.productos.diesel)} mil`, '125 mil'],
        ['Gasolina y diésel, de cada 100 barriles', num(((B.productos.gasolina + B.productos.diesel) / B.carga) * 100), num(((REFINERIA.gasolina + REFINERIA.diesel) / REFINERIA.carga) * 100)],
        ['Coque, de la masa del residuo', `${num(REND.coker.coqueMasa * 100)} %`, '18 a 30 %'],
    ]);
    $('#h-crudos').innerHTML = tablaHTML(['Corte', 'Maya', 'Istmo', 'Olmeca'], [
        ['°API', ...ORDEN_CRUDOS.map(k => num(CRUDOS[k].api, 1))],
        ['Azufre, %', ...ORDEN_CRUDOS.map(k => num(CRUDOS[k].s, 2))],
        ...LISTA_CORTES.map(n => [NOMBRES_CORTE[n], ...ORDEN_CRUDOS.map(k => num(CRUDOS[k].v[n], 1))]),
    ]);
    $('#h-mexico').innerHTML = `<thead><tr><th scope="col">Refinería</th><th scope="col">Capacidad</th><th scope="col">Procesó</th></tr></thead><tbody>${[
        ['Olmeca', 'Paraíso, Tabasco', '340 mil', '263 mil, dic. 2025'],
        ['Salina Cruz', 'Oaxaca', '330 mil', '210 mil, 2025'],
        ['Tula', 'Hidalgo', '270 mil', '221 mil, 2025'],
        ['Deer Park', 'Texas, Estados Unidos', '340 mil', '295 mil, 1.er sem. 2025'],
    ].map(([n, d, a, m]) => `<tr><td><b>${n}</b><small>${d}</small></td><td>${a}</td><td>${m}</td></tr>`).join('')}</tbody>`;
    $('#h-regla').innerHTML = tablaHTML(['Para qué', 'Dónde lo dice'], [
        ['Refinar petróleo: lo permite la SENER, hasta por 30 años', 'Ley del Sector Hidrocarburos, arts. 76 y 115; Reglamento, art. 93'],
        ['Transportar, guardar y vender petrolíferos: lo permite la CNE', 'Ley del Sector Hidrocarburos, art. 76'],
        ['Calidad de los petrolíferos: la CNE la vigila', 'Ley del Sector Hidrocarburos, art. 112; NOM-016-CRE-2016'],
    ]);
}
function alActualizar(L, pag) {
    const { pide, ponerCifra, ponerLecturas, nivel, graficas } = pag;
    pintarBarras(L, pag);
    ponerCifra('aT', { torre: 'Lo que pasa en la torre', conversion: 'De 100 barriles de crudo', azufre: 'A dónde va el azufre', octano: 'El octano de la gasolina' }[pide.modo]);
    if (pide.modo === 'torre') {
        const To = L.To;
        const aviso = To.seRompe ? `Tan caliente, el crudo empieza a romperse y a dejar coque en los tubos. Por eso no se pasa de unos ${HORNO_MAX} °C.` : L.T < 330 ? 'Tan frío, mucho diésel se queda abajo sin separarse.' : null;
        ponerLecturas([['Se vaporiza', num(To.vapor), '% del crudo'], ['Nafta', num(To.cortes.nafta), 'de cada 100'], ['Queroseno', num(To.cortes.keroseno), 'de cada 100'], ['Gasóleo ligero', num(To.cortes.ligero), 'de cada 100'], ['Queda en el fondo', num(To.fondo), 'de cada 100'], ['Crudo', L.C.nombre, `${num(L.C.api, 1)} °API, ${num(L.C.s, 1)} % de azufre`]], aviso);
        ponerCifra('hud', `${num(L.T)} °C`);
        ponerCifra('hud2', `${L.C.nombre}: ${num(To.fondo)} de 100 en el fondo`);
        graficas.b?.marcar(L.T - CALIENTE, destilado(L.crudo, L.T - CALIENTE));
        nivel(1, 'Horno', clamp01((L.T - 280) / 120), `${num(L.T)} °C`);
        nivel(2, 'Se vaporiza', clamp01(To.vapor / 100), `${num(To.vapor)} %`);
    } else if (pide.modo === 'conversion') {
        const B = L.B;
        const P = B.productos;
        const aviso = L.nivel === 0 ? 'Solo destilando, con crudo Maya, el 61 % sale como fondo. Es lo que hacía falta convertir.' : L.nivel === 1 ? 'La torre de vacío ya separa el gasóleo y el residuo, pero aún no se rompen.' : null;
        ponerLecturas([['Gasolina', num(P.gasolina), 'miles de barriles al día'], ['Diésel y queroseno', num(P.diesel), 'miles de barriles al día'], ['Gas LP', num(P.glp), 'miles de barriles al día'], ['Combustóleo', num(P.combustoleo), 'miles de barriles al día'], ['Coque', num(B.coqueT), 't al día'], ['Combustibles ligeros', num(B.ligeros * 100), 'de cada 100']], aviso);
        ponerCifra('hud', `${num(P.gasolina)} mil`);
        ponerCifra('hud2', 'barriles de gasolina al día');
        graficas.b?.marcar(L.nivel, P.gasolina);
        graficas.c?.marcar(L.nivel, balance({ crudo: L.crudo, plantas: L.nivel }).ligeros * 100);
        nivel(1, 'Carga', clamp01(L.carga / REFINERIA.carga), `${num((L.carga / REFINERIA.carga) * 100)} %`);
        nivel(2, 'Ligeros', clamp01(B.ligeros), `${num(B.ligeros * 100)} %`);
    } else if (pide.modo === 'azufre') {
        const D = L.D;
        const aviso = !D.cumple ? `Así el diésel no cumple la norma: lleva ${num(D.sale)} mg/kg, y el máximo es ${CALIDAD.sDiesel}.` : L.severidad > 99 ? 'Al tope, gasta mucho más hidrógeno y casi no gana: ya cumplía la norma.' : null;
        ponerLecturas([['Azufre en el diésel', num(D.sale, D.sale < 100 ? 1 : 0), `mg/kg; máximo ${CALIDAD.sDiesel}`], ['Azufre que entra', num(L.S.entra), 't al día'], ['Azufre sólido', num(L.S.solido), 't al día'], ['Hidrógeno que usa', num(L.H.usa), 't al día'], ['La reformadora da', num(L.H.da), 't al día'], ['Su planta da', num(L.H.planta), 't al día']], aviso);
        ponerCifra('hud', `${num(D.sale, D.sale < 100 ? 1 : 0)} mg/kg`);
        ponerCifra('hud2', `de azufre en el diésel, con ${L.C.nombre}`);
        graficas.b?.marcar(L.severidad, Math.log10(Math.max(1, D.sale)));
        graficas.c?.marcar(L.severidad, L.H.usa);
        nivel(1, 'Severidad', clamp01(L.severidad / 100), `${num(L.severidad)} %`);
        nivel(2, 'Planta de H₂', clamp01(L.H.planta / Math.max(L.H.usa, 1)), `${num((L.H.planta / Math.max(L.H.usa, 1)) * 100)} %`);
    } else {
        const O = L.O;
        const aviso = O.indice < CALIDAD.regular ? `Con índice de ${f1(O.indice)}, la mezcla no llega a la Regular. Hay que subirle a la reformadora o agregar otra cosa con mucho octano.` : L.ron > 102 ? 'Tan alto, gana poco octano y pierde más volumen.' : null;
        ponerLecturas([['Índice de la mezcla', f1(O.indice), `Regular: ${CALIDAD.regular}; Premium: ${CALIDAD.premium}`], ['Gasolina', num(O.gasolina), 'miles de barriles al día'], ['Reformado', num(O.filas[1].v), 'miles de barriles al día'], ['Hidrógeno que da', num(O.h2), 't al día'], ['Nafta tal cual', num(L.C.ron, 1), 'RON'], ['Reformado', num(L.ron), 'RON']], aviso);
        ponerCifra('hud', `Índice ${f1(O.indice)}`);
        ponerCifra('hud2', `con reformado de RON ${num(L.ron)}`);
        graficas.b?.marcar(L.ron, O.indice);
        graficas.c?.marcar(L.ron, O.gasolina);
        nivel(1, 'Índice', clamp01((O.indice - 75) / 20), f1(O.indice));
        nivel(2, 'Rendimiento', clamp01(rendimientoReformado(L.ron)), `${num(rendimientoReformado(L.ron) * 100)} %`);
    }
}

// ------------------------------------------------------------------ la refinería
let planta = estadoPlanta({});

crearPagina({
    figura: FIGURA,
    fichas: FICHAS,
    vistas: VISTAS,
    modos: MODOS,
    botones: BOTONES,
    acciones: ACCIONES,
    modo0: 'torre',
    pide: { crudo: DEF.crudo, horno: DEF.horno, plantas: DEF.plantas, severidad: DEF.severidad, ron: DEF.ron, carga: DEF.carga },
    general: { Lx: 16.8, Lz: 8.8, alto: 6.4, mira: [0, 1.15, 0], az: 24, el: 26, azVertical: 20, elVertical: 30 },
    etiquetas: { lienzo: 'Refinería en 3D: arrastra para girarla, toca un punto para conocerlo', modos: 'Qué ver en la refinería', puntos: 'Puntos clave de la refinería', desarmar: 'Desarmar la refinería' },
    textoFinal: 'Toca cualquier punto para volver a verlo. Cambia de crudo en «Torre», apaga plantas en «Conversión», baja la severidad en «Azufre» o sube el octano en «Octano».',
    colores: { fondoTinta: '#3a3b40', coque: '#7a7c82', nafta: FLUIDOS.nafta.color, medio: FLUIDOS.medio.color, residuo: FLUIDOS.residuo.color, azufre: FLUIDOS.azufre.color, frio: '#8d939b', guindaSuave: '#d89aae', claro: '#ffffff' },
    crearDiagrama,
    secciones,
    escena: (renderer, scene, { movil, oscuro }) => {
        const M = materiales(P_PLANTA);
        const est = escenario(renderer, scene, M, { movil, oscuro });
        return { planta: construir(M, P_PLANTA, { movil, oscuro }), est };
    },
    alCambiarModo: (p, m) => {
        p.corre = false;
        if (m === 'torre') p.horno = DEF.horno;
        if (m === 'conversion') { p.plantas = DEF.plantas; p.carga = DEF.carga; }
        if (m === 'azufre') p.severidad = DEF.severidad;
        if (m === 'octano') p.ron = DEF.ron;
        if (m !== 'conversion') p.plantas = DEF.plantas;
    },
    alCuadro: ({ dt, pide }) => {
        planta = pasoPlanta(planta, { plantas: nivelDe(pide.plantas), horno: pide.modo === 'torre' ? pide.horno : DEF.horno, severidad: pide.severidad, ron: pide.ron }, dt);
    },
    poseDe: ({ pide, ve, encendido, t, dt, camara }) => pose({ modo: pide.modo, planta, crudo: pide.crudo, horno: pide.horno, plantas: nivelDe(pide.plantas), severidad: pide.severidad, ron: pide.ron, carga: pide.carga, noche: ve.noche, adentro: ve.adentro, desarme: ve.desarme, encendido, t, dt, camara }),
    firma: p => [p.modo, p.crudo, p.modo === 'conversion' ? [nivelDe(p.plantas), Math.round(p.carga)] : 0],
    alPintarFijas,
    alPintarGraficas,
    alActualizar,
    prueba: p => ({ crudo: p.crudo, horno: +planta.horno.toFixed(0), plantas: nivelDe(p.plantas), severidad: +planta.severidad.toFixed(0), ron: +planta.ron.toFixed(1), vacio: +planta.vacio.toFixed(2), fcc: +planta.fcc.toFixed(2), coker: +planta.coker.toFixed(2), ciclo: +planta.ciclo.toFixed(2), carga: p.carga }),
});
