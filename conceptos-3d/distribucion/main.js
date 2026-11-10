// «Red de distribución», en 3D y con el formato Búho de «¿Cómo funciona?». Una calle de ejemplo hecha con los criterios de la CFE: un
// transformador de poste de 37.5 kVA baja una fase de 13.2 kV a 120/240 V para 30 casas. Cuatro formas de verla: un día en la calle, el
// voltaje hasta tu casa (y los paneles), una rama en los cables y lo que se pierde.
// Se arma con: node scripts/build-conceptos-3d.mjs distribucion
//
// Lo que se repite entre las plantas con física está en conceptos-3d/planta-comun/.
import { clamp01, num } from '../planta-comun/ayudas.js';
import { barrasHTML, leyenda, pintarGrafica, seccionBarras, seccionColores, seccionDiagrama, seccionFuentes, seccionGrafica, seccionTabla, tablaHTML } from '../planta-comun/graficas.js';
import { crearPagina } from '../planta-comun/pagina.js';
import { CABLE, CALIDAD, CALLE, CRITERIO, DEF, FLUIDOS, FUSIBLE, GD, KVA_MEDIO, LIMITES, PANEL, PARTES as PARTES_M, PERDIDAS, RED, SERVICIOS_MEDIO, TRAFO, calle, dia, estadoPlanta, falla, funde, pasoPlanta, perdidas, plenaCarga, pose } from './modelo.js';
import { P_PLANTA, construir, escenario, materiales } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';

const FIGURA = 'distribucion';
const f1 = x => num(x, 1);
const hora = h => { const x = ((h % 24) + 24) % 24; const m = Math.floor((x % 1) * 60); return `${String(Math.floor(x)).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'alimentador', nombre: 'Línea de media tensión', modo: 'dia', accion: 'punta', eq: `${f1(TRAFO.primarioLL / 1000)} kV; a la calle, una fase de ${num(TRAFO.primario)} V`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 6h18M6 6v14M18 6v14"/>',
        texto: 'Viene de la subestación con 13.2 kV entre fases; a esta calle llega una fase, 7,620 V contra el neutro. La CFE tiene 555,336 km de estas líneas. En un fraccionamiento, el voltaje no debe caer más de 50 V por kilómetro.' },
    { parte: 'apartarrayos', nombre: 'Apartarrayos', modo: 'falla', accion: 'rama', eq: 'Manda a tierra el exceso de un rayo', recorrido: { noche: false, adentro: false },
        icono: '<path d="M13 2 5 13h6l-2 9 8-12h-6z"/>',
        texto: 'Va acostado en la cruceta, junto al cortacircuito. Con el voltaje normal no hace nada; si un rayo dispara el voltaje, deja pasar el exceso a tierra y protege al transformador.' },
    { parte: 'cortacircuito', nombre: 'Cortacircuito fusible', modo: 'falla', accion: 'rama', eq: `Un listón de ${num(FUSIBLE.A)} A, de ejemplo`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 3v6M12 15v6M9 9h6v6H9z"/>',
        texto: 'Protege al transformador. Dentro del tubo va un listón fusible: si pasa demasiada corriente se funde, el tubo se suelta y queda colgando, y se nota desde la calle. La cuadrilla lo vuelve a cerrar con una pértiga larga.' },
    { parte: 'transformador', nombre: 'Transformador de poste', modo: 'dia', abrir: true, accion: 'muchas', eq: `${f1(TRAFO.kVA)} kVA: de ${num(TRAFO.primario)} V a ${TRAFO.fase}/${TRAFO.entre} V`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
        texto: 'Baja el voltaje para las casas: 120 V entre cada fase y el neutro, y 240 V entre las dos fases. La CFE tiene 1.66 millones de transformadores, de 36.7 kVA en promedio, con unos 30 servicios cada uno. Se pone en el centro de la carga.' },
    { parte: 'postes', nombre: 'Postes', modo: 'voltaje', accion: 'paneles', eq: 'Arriba la media tensión; abajo la baja', recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 3v18M7 6h10M9 12h6"/>',
        texto: 'Llevan dos redes. Arriba, en la cruceta, la de media tensión; más abajo, en un bastidor, la de baja tensión. Para la red de baja tensión, la CFE pide postes de por lo menos 9 m.' },
    { parte: 'retenida', nombre: 'Retenida', modo: 'dia', accion: 'punta', eq: 'Un cable de acero que equilibra el jalón', recorrido: { noche: false, adentro: false },
        icono: '<path d="M6 3v18M6 4l12 16"/>',
        texto: 'En los postes de las orillas, los cables jalan para un solo lado. La retenida, un cable de acero anclado al suelo, equilibra ese jalón para que el poste no se incline. Donde pasa gente, lleva un protector para que nadie se lastime.' },
    { parte: 'secundaria', nombre: 'Red de baja tensión', modo: 'voltaje', accion: 'paneles', eq: `Cobre calibre 2: no más de ${num(CRITERIO.caidaBT * 100)} % de caída`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 7h18M3 12h18M3 17h18"/>',
        texto: 'Tres cables en el bastidor: el neutro arriba y dos fases. Para un transformador de 37.5 kVA, la CFE pide cobre calibre 2, y que a la hora de más consumo el voltaje no baje más de 3 % hasta la última casa.' },
    { parte: 'neutro', nombre: 'Neutro y tierra', modo: 'falla', abrir: true, accion: 'rama', eq: 'Unido en todos los postes', recorrido: { noche: false, adentro: true },
        icono: '<path d="M12 3v9M5 12h14M8 16h8M10.5 20h3"/>',
        texto: 'Es el cable de regreso, y se une en todos los postes. En el poste del transformador baja por un cable a una varilla enterrada: si algo falla, la corriente tiene por dónde irse sin pasar por las personas.' },
    { parte: 'acometida', nombre: 'Acometida', modo: 'dia', accion: 'calor', eq: 'De la red de la calle al medidor', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 5c6 2 10 8 16 14"/>',
        texto: 'Un cable baja de la red de baja tensión a cada casa y llega a la mufa, el tubo junto al medidor. Si cruza la calle, se compensa con otra en sentido contrario o se deja floja, para no jalar el poste.' },
    { parte: 'medidor', nombre: 'Medidor', modo: 'perdidas', accion: 'diablitos', eq: `${f1(RED.electronicos)} millones son electrónicos`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 9h6"/>',
        texto: 'Cuenta la energía que usa la casa, en kWh. Una vivienda en México gastó en promedio 1,852 kWh en 2018. De los medidores de la CFE, 37.2 millones son electrónicos, y algunos se leen a distancia. Lo que no pasa por él no se cobra.' },
    { parte: 'casa', nombre: 'Casa', modo: 'dia', accion: 'calor', eq: `${TRAFO.fase} V en el contacto; ${TRAFO.entre} V entre fases`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 21V10l9-7 9 7v11M9 21v-6h6v6"/>',
        texto: 'Gasta poco de madrugada y más en la noche, cuando todos están en casa. Como no todas prenden todo a la vez, un transformador aguanta a muchas. Donde hay aire acondicionado, el consumo sube mucho y el transformador se puede pasar.' },
    { parte: 'paneles', nombre: 'Paneles en el techo', modo: 'voltaje', accion: 'paneles', eq: `${num(GD.MW)} MW conectados en el país`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 18 6 8h15l-3 10zM8 8l-2 10M13 8l-1 10M17 8l-1 10"/>',
        texto: 'Son generación distribuida: centrales de menos de 0.7 MW en un circuito de distribución. A mediodía pueden dar más de lo que gasta la calle; entonces la energía regresa por la red y el voltaje sube. En 2024 había 4,447 MW, casi todos solares.' },
    { parte: 'diablito', nombre: 'Diablito', modo: 'perdidas', accion: 'diablitos', eq: 'Energía que no pasa por el medidor', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 4l8 6M12 10v10M8 20h8"/>',
        texto: 'Un cable colgado de la red, que se salta el medidor. Es peligroso y es robo: la ley deja suspender el servicio a quien consume sin que lo registre el medidor. En 2024, las pérdidas no técnicas fueron 8.64 de cada 100 kWh que entraron a la red.' },
    { parte: 'arbol', nombre: 'Árbol', modo: 'falla', accion: 'rama', eq: 'Una rama puede tocar los cables', recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 21v-7M12 14c-4 0-6-3-6-6a6 6 0 0 1 12 0c0 3-2 6-6 6z"/>',
        texto: 'Las ramas que tocan los cables causan fallas: la corriente se dispara y el fusible del transformador se funde. Por eso se podan los árboles cerca de las líneas. Una falla lejos del transformador da menos corriente, y el fusible tarda más.' },
];
const VISTAS = Object.fromEntries(PARTES_M.map(p => [p.id, p.vista]));
// Un consumo de ejemplo para casas con aire acondicionado en un lugar caluroso; no viene de una fuente.
const CON_AIRE = 6000;
const reloj = { texto: 'el día', avanzar: (p, dt) => { p.hora = (p.hora + (dt * 24) / 36) % 24; return false; } };
const MODOS = {
    dia: { nombre: 'Un día en la calle', corto: 'Día', resumen: 'La calle gasta poco de madrugada y más en la noche. Como no todas las casas prenden todo a la vez, un transformador de 37.5 kVA alcanza para 30. Súmale casas o consumo y mira cuándo se pasa.', aclara: `La forma del día y el consumo con aire acondicionado, ${num(CON_AIRE)} kWh al año, son de ejemplo. El consumo de 1,852 kWh al año es el promedio de una vivienda en 2018.`, mando: { nombre: 'Casas', campo: 'casas', rango: LIMITES.casas, texto: v => `${num(v)} casas` }, mando2: { nombre: 'Consumo de cada casa', campo: 'consumo', rango: LIMITES.consumo, texto: v => `${num(v)} kWh al año` }, reloj },
    voltaje: { nombre: 'El voltaje hasta tu casa', corto: 'Voltaje', resumen: 'La energía pierde un poco de voltaje en el transformador y a lo largo de la red. Con paneles en los techos, a mediodía la energía puede regresar y el voltaje sube. Cambia cuántas casas tienen paneles.', aclara: `Un panel de ${num(PANEL.kW)} kW por casa y la reactancia del cable son de ejemplo.`, mando: { nombre: 'Casas con paneles', campo: 'paneles', rango: LIMITES.paneles, texto: v => `${num(v * 100)} %` }, mando2: { nombre: 'Consumo de cada casa', campo: 'consumo', rango: LIMITES.consumo, texto: v => `${num(v)} kWh al año` }, reloj },
    falla: { nombre: 'Una rama en los cables', corto: 'Falla', resumen: 'Cuando una rama junta dos cables, la corriente se dispara. Cerca del transformador, el fusible se funde al instante; lejos, la corriente es menor y tarda más. Con un fusible muy grande, ya no alcanza a ver la falla.', aclara: 'La curva del fusible es de ejemplo.', mando: { nombre: 'Dónde cae la rama', campo: 'd', rango: LIMITES.d, texto: v => `a ${num(v)} m` }, mando2: { nombre: 'Tamaño del fusible', campo: 'fusible', rango: LIMITES.fusible, texto: v => `${num(v)} A` } },
    perdidas: { nombre: 'Lo que se pierde', corto: 'Pérdidas', resumen: 'Una parte de la energía se va en calor: en el núcleo del transformador, en sus devanados y en los cables. Otra se la llevan los diablitos sin pagar. Cambia cuántas casas están colgadas.', aclara: 'Las pérdidas del transformador son de ejemplo. Las cifras del país son de CFE Distribución, 2024.', mando: { nombre: 'Casas con diablito', campo: 'diablitos', rango: LIMITES.diablitos, texto: v => `${num(v * 100)} %` }, mando2: { nombre: 'Consumo de cada casa', campo: 'consumo', rango: LIMITES.consumo, texto: v => `${num(v)} kWh al año` } },
};
let planta = estadoPlanta();
const BOTONES = [
    { id: 'rama', visible: p => p.modo === 'falla', pulsado: p => p.falla, texto: p => (p.falla ? 'Quitar la rama' : 'Que caiga la rama'), alTocar: p => { p.falla = !p.falla; } },
];
const ACCIONES = {
    punta: { texto: () => 'Ir a la hora de más consumo', hacer: (p, pag) => { p.hora = 20; p.corre = false; pag.invalidar(); pag.rotular(); } },
    muchas: { texto: p => (p.casas > 40 ? `Regresar a ${CALLE.casas} casas` : 'Conectar 60 casas'), hacer: (p, pag) => { p.casas = p.casas > 40 ? CALLE.casas : 60; p.hora = 20; p.corre = false; pag.invalidar(); pag.ponerMando(); } },
    calor: { texto: p => (p.consumo > 3000 ? 'Regresar al consumo promedio' : 'Casas con aire acondicionado'), hacer: (p, pag) => { p.consumo = p.consumo > 3000 ? CALLE.consumo : CON_AIRE; p.hora = 20; p.corre = false; pag.invalidar(); pag.ponerMando(); } },
    paneles: { texto: p => (p.paneles > 0.9 ? 'Regresar los paneles' : 'Paneles en todas, al mediodía'), hacer: (p, pag) => { const todos = p.paneles > 0.9; p.paneles = todos ? DEF.paneles : 1; p.hora = 13; p.corre = false; pag.invalidar(); pag.ponerMando(); } },
    rama: { texto: p => (p.falla ? 'Quitar la rama' : 'Que caiga la rama'), hacer: (p, pag) => { p.falla = !p.falla; pag.invalidar(); pag.rotular(); } },
    diablitos: { texto: p => (p.diablitos > 0.25 ? 'Regresar los diablitos' : 'Una de cada tres casas colgada'), hacer: (p, pag) => { p.diablitos = p.diablitos > 0.25 ? DEF.diablitos : 0.33; pag.invalidar(); pag.ponerMando(); } },
};

// ------------------------------------------------------------------ el tablero
const secciones = () => `
    ${seccionDiagrama('Lo que pasa en la calle')}
    ${seccionGrafica('b')}
    ${seccionGrafica('c')}
    ${seccionBarras()}
    ${seccionTabla('La red de CFE Distribución', 'h-red', 'Al cierre de 2024, según su Programa de Ampliación y Modernización 2025-2039.', 'h-tabla-texto')}
    ${seccionTabla('Lo que pide la CFE en una calle', 'h-criterios', 'Criterios para líneas monofásicas con transformador tipo YT, según una tesis de la UNAM.', 'h-tabla-texto')}
    ${seccionTabla('Lo que se acepta', 'h-calidad', 'Indicadores de las Redes Generales de Distribución, según el mismo programa de la CFE.', 'h-tabla-texto')}
    ${seccionTabla('Lo que dice la ley', 'h-regla', 'Ley del Sector Eléctrico y su Reglamento.')}
    ${seccionColores(FLUIDOS, 'Es una calle de ejemplo, hecha con los criterios de la CFE, y nada está a escala. Son de ejemplo: la forma del consumo del día, los paneles de 3 kW, la reactancia del cable, las pérdidas del transformador, su impedancia y la curva del fusible.', 'Colores de lo que corre')}
    ${seccionFuentes(FUENTES, [
        { para: 'Qué son las Redes Generales de Distribución, la Distribuidora y la generación distribuida; cuándo se puede suspender el servicio', titulo: 'Ley del Sector Eléctrico, arts. 3, 25, 26, 27, 44, 46, 56 y 57', nota: 'Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio' },
        { para: 'Qué es baja tensión, el voltaje que se acepta y los daños por un voltaje fuera de tolerancia', titulo: 'Reglamento de la Ley del Sector Eléctrico, arts. 2, 93 y 149', nota: 'Está en el acervo de este sitio' },
    ])}`;

function alPintarGraficas(L, pag) {
    const { $, pide, graficas } = pag;
    const m = pide.modo;
    graficas.b = null;
    graficas.c = null;
    if (m === 'dia') {
        const D = L.D;
        const lb = [{ clase: 'h-s-actual', nombre: 'Carga', f: h => D.en('uso', h) * TRAFO.kVA }, { clase: 'h-s-norma', nombre: `Aguanta ${f1(TRAFO.kVA)} kVA`, f: () => TRAFO.kVA }];
        $('#h-b-t').textContent = 'La carga del día, contra lo que aguanta';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `kVA que pasan por el transformador con ${num(L.casas)} casas. La punta llega a las ${hora(D.horaPico)}, con ${num(D.maxUso * 100)} % de su capacidad.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'La carga del día', xMin: 0, xMax: 24, yMin: 0, yMax: 80, ticksX: [0, 6, 12, 18, 24], ticksY: [0, 20, 40, 60, 80], etX: 'Hora', etY: 'kVA', lineas: lb, fx: x => num(x), fy: y => num(y), punta: x => `${hora(x)} · ${f1(D.en('uso', x) * TRAFO.kVA)} kVA` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Hora', 'kVA', 'De cada 100'], [3, 8, 13, 18, 20, 22].map(h => [hora(h), f1(D.en('uso', h) * TRAFO.kVA), num(D.en('uso', h) * 100)]));
        const usoMax = (casas, consumo) => dia({ casas, consumo }).maxUso * TRAFO.kVA;
        const otro = Math.abs(L.consumo - CALLE.consumo) > 60 && Math.abs(L.consumo - CON_AIRE) > 60;
        const lc = [
            { clase: 'h-s-sin', nombre: '1,852 kWh, el promedio', f: n => usoMax(Math.round(n), CALLE.consumo) },
            ...(otro ? [{ clase: 'h-s-actual', nombre: `${num(L.consumo)} kWh`, f: n => usoMax(Math.round(n), L.consumo) }] : []),
            { clase: 'h-s-max', nombre: `${num(CON_AIRE)} kWh, con aire`, f: n => usoMax(Math.round(n), CON_AIRE) },
            { clase: 'h-s-norma', nombre: `Aguanta ${f1(TRAFO.kVA)} kVA`, f: () => TRAFO.kVA },
        ];
        const series = lc.slice(0, -1);
        $('#h-c-t').textContent = 'La punta del día, según cuántas casas';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `kVA en la hora de más consumo. En promedio, cada transformador de la CFE tiene unos ${num(SERVICIOS_MEDIO)} servicios.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'La punta según las casas', xMin: 10, xMax: 60, yMin: 0, yMax: 120, ticksX: [10, 20, 30, 40, 50, 60], ticksY: [0, 30, 60, 90, 120], etX: 'Casas', etY: 'kVA', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} casas · ${series.map(l => `${l.nombre}: ${f1(l.f(x))} kVA`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Casas', ...series.map(l => l.nombre)], [10, 20, 30, 45, 60].map(n => [num(n), ...series.map(l => f1(l.f(n)))]));
    } else if (m === 'voltaje') {
        const fin = p => h => calle({ hora: h, consumo: L.consumo, paneles: p }).fin * 100;
        const lb = [
            { clase: 'h-s-sin', nombre: 'Sin paneles', f: fin(0) },
            { clase: 'h-s-actual', nombre: `Paneles en ${num(L.paneles * 100)} %`, f: fin(L.paneles) },
            { clase: 'h-s-max', nombre: 'Paneles en todas', f: fin(1) },
            { clase: 'h-s-norma', nombre: 'Límite, 105 %', f: () => 105 },
        ];
        $('#h-b-t').textContent = 'El voltaje de la última casa, en el día';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `Por ciento de ${TRAFO.fase} V, a ${CALLE.largo} m del transformador. De noche baja por el consumo; a mediodía, con muchos paneles, sube. El suministro debe quedar entre 95 y 105 %.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'El voltaje de la última casa', xMin: 0, xMax: 24, yMin: 94, yMax: 108, ticksX: [0, 6, 12, 18, 24], ticksY: [94, 97, 100, 103, 106], etX: 'Hora', etY: '% de 120 V', lineas: lb, fx: x => num(x), fy: y => num(y), punta: x => `${hora(x)} · ${lb.slice(0, 3).map(l => `${l.nombre}: ${f1(l.f(x))} %`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Hora', 'Sin paneles', 'Ahora', 'En todas'], [3, 9, 13, 16, 20].map(h => [hora(h), f1(lb[0].f(h)), f1(lb[1].f(h)), f1(lb[2].f(h))]));
        const lc = [{ clase: 'h-s-actual', nombre: 'A las 13 h', f: p => calle({ hora: 13, consumo: L.consumo, paneles: p }).fin * 100 }, { clase: 'h-s-norma', nombre: 'Límite, 105 %', f: () => 105 }];
        $('#h-c-t').textContent = 'A mediodía, según cuántas casas tienen paneles';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Voltaje de la última casa a la 1 de la tarde. En 2024 llegaron unas ${num(GD.solicitudes)} solicitudes al año para conectar paneles en baja tensión; ${f1(GD.hasta10)} de cada 100, de 10 kW o menos.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'A mediodía', xMin: 0, xMax: 1, yMin: 98, yMax: 108, ticksX: [0, 0.25, 0.5, 0.75, 1], ticksY: [98, 100, 102, 104, 106, 108], etX: 'Casas con paneles', etY: '% de 120 V', lineas: lc, fx: x => `${num(x * 100)} %`, fy: y => num(y), punta: x => `${num(x * 100)} % con paneles · ${f1(lc[0].f(x))} %` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Con paneles', 'Última casa, 13 h'], [0, 0.25, 0.5, 0.75, 1].map(p => [`${num(p * 100)} %`, `${f1(lc[0].f(p))} %`]));
    } else if (m === 'falla') {
        $('#h-b-t').textContent = 'La corriente de la falla, según dónde cae';
        $('#h-b-ley').textContent = '';
        $('#h-b-pie').textContent = `Amperes en 240 V. Junto al transformador, ${num(falla({ d: 0 }).Ib)} A; entre más cable de por medio, menos. A plena carga pasan ${num((TRAFO.kVA * 1000) / TRAFO.entre)} A.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'La corriente de la falla', xMin: 0, xMax: CALLE.largo, yMin: 0, yMax: 7000, ticksX: [0, 25, 50, 75, 100], ticksY: [0, 2000, 4000, 6000], etX: 'Metros del transformador', etY: 'A', f: d => falla({ d }).Ib, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} m · ${num(falla({ d: x }).Ib)} A en 240 V · ${f1(falla({ d: x }).Ip)} A en el fusible` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Metros', 'A en 240 V', 'A en el fusible'], [0, 25, 50, 75, 105].map(d => [num(d), num(falla({ d }).Ib), f1(falla({ d }).Ip)]));
        const tde = A => d => Math.min(10, funde(falla({ d }).Ip, A));
        const lc = [
            { clase: 'h-s-sin', nombre: 'Fusible de 5 A', f: tde(5) },
            { clase: 'h-s-actual', nombre: `De ${num(L.fusible)} A`, f: tde(L.fusible) },
            { clase: 'h-s-max', nombre: 'De 15 A', f: tde(15) },
        ];
        $('#h-c-t').textContent = 'Cuánto tarda el fusible, según dónde cae la rama';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Segundos; arriba de 10, se cuenta como que no se funde. Un fusible chico se funde antes, pero debe aguantar la carga normal: ${f1(plenaCarga())} A a plena carga. Curva de ejemplo.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Cuánto tarda el fusible', xMin: 5, xMax: CALLE.largo, yMin: 0, yMax: 10, ticksX: [5, 25, 50, 75, 100], ticksY: [0, 2, 4, 6, 8, 10], etX: 'Metros del transformador', etY: 's', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} m · ${lc.map(l => `${l.nombre}: ${l.f(x) >= 10 ? 'no se funde' : `${f1(l.f(x))} s`}`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Metros', '5 A', `${num(L.fusible)} A`, '15 A'], [5, 30, 60, 90, 105].map(d => [num(d), ...lc.map(l => (l.f(d) >= 10 ? 'no' : f1(l.f(d))))]));
    } else {
        const pt = consumo => perdidas({ consumo, diablitos: 0 });
        const lb = [
            { clase: 'h-s-sin', nombre: 'Núcleo', f: c => (pt(c).nucleo / pt(c).entra) * 100 },
            { clase: 'h-s-max', nombre: 'Devanados', f: c => (pt(c).cobre / pt(c).entra) * 100 },
            { clase: 'h-s-actual', nombre: 'Cables', f: c => (pt(c).cables / pt(c).entra) * 100 },
        ];
        $('#h-b-t').textContent = 'Lo que se calienta, según el consumo';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = 'De cada 100 kWh que entran a la calle. El núcleo pierde lo mismo con mucha o poca carga: pesa más cuando se consume poco. Los devanados y los cables pierden con el cuadrado de la corriente.';
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Lo que se calienta', xMin: 1000, xMax: 6000, yMin: 0, yMax: 4, ticksX: [1000, 2000, 3000, 4000, 5000, 6000], ticksY: [0, 1, 2, 3, 4], etX: 'Consumo de cada casa, kWh al año', etY: 'de cada 100', lineas: lb, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} kWh · ${lb.map(l => `${l.nombre}: ${num(l.f(x), 2)}`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['kWh al año', 'Núcleo', 'Devanados', 'Cables'], [1000, 1852, 3000, 4500, 6000].map(c => [num(c), ...lb.map(l => num(l.f(c), 2))]));
        const lc = [
            { clase: 'h-s-actual', nombre: 'Esta calle', f: d => perdidas({ consumo: L.consumo, diablitos: d }).pctNoTecnicas * 100 },
            { clase: 'h-s-norma', nombre: `País: ${num(PERDIDAS.noTecnicas, 2)}`, f: () => PERDIDAS.noTecnicas },
            { clase: 'h-s-max', nombre: `Oriente: ${num(PERDIDAS.oriente, 2)}`, f: () => PERDIDAS.oriente },
        ];
        $('#h-c-t').textContent = 'Lo que no se cobra, según los diablitos';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `De cada 100 kWh que entran. En 2024, en todo el país, ${num(PERDIDAS.noTecnicas, 2)}; en la División Oriente, ${num(PERDIDAS.oriente, 2)}. La CRE reconoce ${PERDIDAS.cre} %.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Lo que no se cobra', xMin: 0, xMax: 0.4, yMin: 0, yMax: 40, ticksX: [0, 0.1, 0.2, 0.3, 0.4], ticksY: [0, 10, 20, 30, 40], etX: 'Casas con diablito', etY: 'de cada 100', lineas: lc, fx: x => `${num(x * 100)} %`, fy: y => num(y), punta: x => `${num(x * 100)} % de las casas · ${f1(lc[0].f(x))} de cada 100` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Casas con diablito', 'No se cobra, de cada 100'], [0, 0.1, 0.2, 0.3, 0.4].map(d => [`${num(d * 100)} %`, f1(lc[0].f(d))]));
    }
}
function pintarBarras(L, pag) {
    const { $, pide } = pag;
    let filas;
    if (pide.modo === 'dia') {
        filas = [{ t: `Ahora, ${hora(L.hora)}`, v: L.uso, activa: true, escala: 1.5 }, { t: `En la punta, ${hora(L.D.horaPico)}`, v: L.D.maxUso, escala: 1.5 }];
        $('#h-d-t').textContent = 'Carga del transformador, de cada 100 de lo que aguanta';
        $('#h-d-pie').textContent = L.D.maxUso > 1 ? 'En la punta se pasa: se calienta de más y su aislamiento se gasta.' : 'Le sobra capacidad: así aguanta que crezca la calle o un día de calor.';
    } else if (pide.modo === 'voltaje') {
        const tr = Math.abs(L.dT);
        const red = Math.abs(L.fin - 1 + L.dT);
        filas = [{ t: L.P < 0 ? 'Sube en el transformador' : 'Baja en el transformador', v: tr, activa: true, escala: 0.06, d: 1 }, { t: L.P < 0 ? 'Sube a lo largo de la red' : 'Baja a lo largo de la red', v: red, escala: 0.06, d: 1 }, { t: 'Lo que pide la CFE en la red', v: CRITERIO.caidaBT, escala: 0.06, d: 1 }];
        $('#h-d-t').textContent = 'Lo que cambia el voltaje, de cada 100';
        $('#h-d-pie').textContent = `A las ${hora(L.hora)}, la última casa recibe ${f1(L.fin * 100)} % de ${TRAFO.fase} V.`;
    } else if (pide.modo === 'falla') {
        const F0 = falla({ d: 0 });
        filas = [{ t: 'Junto al transformador', v: 1, escala: 1 }, { t: `A ${num(L.d)} m`, v: L.S.Ib / F0.Ib, activa: true, escala: 1 }];
        $('#h-d-t').textContent = 'La corriente de la falla, de cada 100 junto al transformador';
        $('#h-d-pie').textContent = 'El cable de por medio frena la corriente. Por eso una falla lejana tarda más en fundir el fusible, y si no lo funde, la CFE pide otra protección.';
    } else {
        const t = PERDIDAS.tramos;
        const pct = v => v / PERDIDAS.ingresada;
        filas = [{ t: 'No técnicas', v: PERDIDAS.noTecnicas / 100, activa: true, escala: 0.1, d: 2 }, { t: 'Circuitos de media tensión', v: pct(t.mt), escala: 0.1, d: 2 }, { t: 'Redes de baja tensión', v: pct(t.bt), escala: 0.1, d: 2 }, { t: 'Transformadores de poste', v: pct(t.trafos), escala: 0.1, d: 2 }, { t: 'Acometidas y medidores', v: pct(t.acometidas), escala: 0.1, d: 2 }, { t: 'Subestaciones', v: pct(t.atmt), escala: 0.1, d: 2 }];
        $('#h-d-t').textContent = 'Lo que se perdió en 2024, de cada 100 kWh que entraron a la red';
        $('#h-d-pie').textContent = `En todo el país: ${f1(PERDIDAS.total)} TWh de ${f1(PERDIDAS.ingresada)}. Las técnicas sumaron ${num(PERDIDAS.tecnicas, 2)} de cada 100, por tramo; las no técnicas, ${num(PERDIDAS.noTecnicas, 2)}.`;
    }
    $('#h-barras').innerHTML = barrasHTML(filas);
}
function alPintarFijas({ $ }) {
    $('#h-red').innerHTML = tablaHTML(['Qué', 'Cuánto'], [
        ['Transformadores de poste y de pedestal', num(RED.transformadores)],
        ['Su capacidad', `${num(RED.MVA)} MVA; ${f1(KVA_MEDIO)} kVA en promedio`],
        ['Servicios', `${f1(RED.servicios)} millones; unos ${num(SERVICIOS_MEDIO)} por transformador`],
        ['Líneas de media tensión', `${num(RED.kmMT)} km`],
        ['Líneas de baja tensión', `${num(RED.kmBT)} km`],
        ['Medidores electrónicos', `${f1(RED.electronicos)} millones`],
        ['Generación distribuida', `${num(GD.MW)} MW; ${f1(GD.solar)} % solar`],
    ]);
    $('#h-criterios').innerHTML = tablaHTML(['Qué', 'Cuánto'], [
        ['Voltaje de suministro', `±${num(CRITERIO.suministro * 100)} %`],
        ['Caída en la red de baja tensión', `${num(CRITERIO.caidaBT * 100)} % monofásica; ${num(CRITERIO.caidaBT3F * 100)} % trifásica`],
        ['Caída en la línea de 13 kV de un fraccionamiento', `${num(CRITERIO.voltsKm)} V por km`],
        ['Cable de cobre para 25 / 37.5 / 50 / 75 kVA', 'calibre 4 / 2 / 1/0 / 3/0'],
        ['Poste de la red de baja tensión', 'de 9 m o más'],
        ['Dónde va el transformador', 'en el centro de la carga'],
    ]);
    $('#h-calidad').innerHTML = tablaHTML(['Qué', 'Límite'], [
        ['Duración de las interrupciones, por usuario al año', `${CALIDAD.saidi} minutos`],
        ['Interrupciones por usuario al año', num(CALIDAD.saifi, 2)],
        ['Duración de cada interrupción', `${CALIDAD.caidi} minutos`],
        ['Voltaje en las barras de media tensión', `±${num(CALIDAD.tension * 100)} %`],
        ['Factor de potencia de los circuitos', `${num(CALIDAD.fp, 2)} o más`],
        ['Pérdidas técnicas y no técnicas (CRE)', `${PERDIDAS.cre} % cada una`],
    ]);
    $('#h-regla').innerHTML = tablaHTML(['Qué', 'Dónde lo dice'], [
        ['Las Redes Generales de Distribución reparten la energía al público en general; la Distribuidora es la CFE', 'Ley, art. 3, fraccs. XIX, XX y XLII'],
        ['Generación distribuida: menos de 0.7 MW en un circuito de distribución', 'Ley, arts. 3, fracc. XXII, y 25'],
        ['Tiene acceso a la red si es técnicamente factible, y puede vender su energía', 'Ley, arts. 26 y 27'],
        ['La Distribuidora opera con las instrucciones del CENACE', 'Ley, art. 44'],
        ['Las reglas de calidad y continuidad del servicio las pone la CNE', 'Ley, art. 46'],
        ['Distribuir es un área estratégica del Estado y de utilidad pública: los terrenos para sus instalaciones pueden quedar sujetos a servidumbre', 'Ley, art. 57'],
        ['Puede suspender el servicio a quien consuma sin que lo registre el medidor', 'Ley, art. 56, fracc. VI'],
        ['Baja tensión: 1 kV o menos', 'Reglamento, art. 2, fracc. V'],
        ['El servicio sigue las reglas de calidad de la CNE; si un cambio de voltaje fuera de tolerancia daña aparatos, se reparan o se pagan', 'Reglamento, arts. 93 y 149'],
    ]);
}
function alActualizar(L, pag) {
    const { pide, ponerCifra, ponerLecturas, nivel, graficas } = pag;
    pintarBarras(L, pag);
    ponerCifra('aT', { dia: 'El transformador y las casas', voltaje: 'El voltaje a lo largo de la calle', falla: 'La rama y el fusible', perdidas: 'A dónde se va la energía' }[pide.modo]);
    if (pide.modo === 'dia') {
        const aviso = L.uso > 1 ? `El transformador pasa de sus ${f1(TRAFO.kVA)} kVA: se calienta de más.` : L.D.maxUso > 1 ? 'A esta hora aguanta, pero en la punta se pasa.' : null;
        ponerLecturas([['Hora', hora(L.hora), 'del día'], ['Casas', num(L.casas), `${num(L.consumo)} kWh al año cada una`], ['Calle', `${f1(L.carga)} kW`, `${f1(L.S)} kVA`], ['Transformador', `${num(L.uso * 100)} %`, `de ${f1(TRAFO.kVA)} kVA`], ['Corriente', `${num(L.I)} A`, `en ${TRAFO.entre} V; ${f1(L.Ip)} A en ${num(TRAFO.primario)} V`], ['Una casa', `${num(L.casa * 1000)} W`, `${f1(L.diaKWh)} kWh en el día`]], aviso);
        ponerCifra('hud', `${num(L.uso * 100)} %`);
        ponerCifra('hud2', 'de carga en el transformador');
        graficas.b?.marcar(L.hora, L.S);
        graficas.b?.ahora(L.hora);
        graficas.c?.marcar(L.casas, L.D.maxUso * TRAFO.kVA);
        nivel(1, 'Transformador', clamp01(L.uso / 1.5), `${num(L.uso * 100)} %`);
        nivel(2, 'Última casa', clamp01((L.fin - 0.9) / 0.15), `${f1(L.fin * 100)} %`);
    } else if (pide.modo === 'voltaje') {
        const aviso = L.fin > 1 + CRITERIO.suministro ? `La última casa recibe ${f1(L.fin * 100)} %: pasa del 105 %.` : 1 - L.fin > CRITERIO.caidaBT ? `En la red se pierde más de ${num(CRITERIO.caidaBT * 100)} %.` : L.P < 0 ? 'Los paneles dan más de lo que gastan las casas: la energía regresa al transformador.' : null;
        ponerLecturas([['Hora', hora(L.hora), 'del día'], ['Paneles', `${num(L.paneles * 100)} %`, `de las casas; ${f1(L.panel)} kW cada uno ahora`], ['Por el transformador', `${f1(Math.abs(L.P))} kW`, L.P < 0 ? 'de regreso' : 'hacia las casas'], ['Última casa', `${f1(L.fin * 120)} V`, `${f1(L.fin * 100)} % de 120 V`], ['Junto al transformador', `${f1((1 - L.dT) * 120)} V`, `${f1((1 - L.dT) * 100)} %`], ['Cable', CABLE.calibre, `cobre, ${CALLE.largo} m de cada lado`]], aviso);
        ponerCifra('hud', `${f1(L.fin * 120)} V`);
        ponerCifra('hud2', 'en la última casa');
        graficas.b?.marcar(L.hora, L.fin * 100);
        graficas.b?.ahora(L.hora);
        graficas.c?.marcar(L.paneles, calle({ hora: 13, consumo: L.consumo, paneles: L.paneles }).fin * 100);
        nivel(1, 'Última casa', clamp01((L.fin - 0.9) / 0.2), `${f1(L.fin * 100)} %`);
        nivel(2, 'Regresa', clamp01(-L.P / 60), L.P < 0 ? `${f1(-L.P)} kW` : '0 kW');
    } else if (pide.modo === 'falla') {
        const S = L.S;
        const msg = { normal: null, falla: 'La rama junta los cables: la corriente se dispara y el fusible se calienta.', abierto: `El fusible se fundió y el tubo cayó: la calle se queda sin luz. En promedio, una interrupción no debe durar más de ${CALIDAD.caidi} minutos.`, sigue: 'El fusible no alcanza a fundirse: la falla sigue y el cable se calienta. Aquí la CFE pide un interruptor en la red de baja tensión.' }[L.estado];
        ponerLecturas([['Rama', `a ${num(L.d)} m`, 'del transformador'], ['Falla', `${num(S.Ib)} A`, `en ${TRAFO.entre} V`], ['En el fusible', `${f1(S.Ip)} A`, `${f1(S.Ip / L.fusible)} veces su tamaño`], ['Se funde en', Number.isFinite(S.t) && S.t < 10 ? `${S.t < 0.1 ? 'menos de 0.1' : f1(S.t)} s` : 'no se funde', `fusible de ${num(L.fusible)} A`], ['Carga normal', `${f1(plenaCarga())} A`, 'a plena carga, en el fusible'], ['Estado', { normal: 'Con luz', falla: 'En falla', abierto: 'Sin luz', sigue: 'Falla sin despejar' }[L.estado], L.t === null ? 'sin falla' : `segundo ${f1(L.t)}`]], msg);
        ponerCifra('hud', `${num(S.Ib)} A`);
        ponerCifra('hud2', 'si la rama toca el cable');
        graficas.b?.marcar(L.d, S.Ib);
        graficas.c?.marcar(L.d, Math.min(10, S.t));
        nivel(1, 'Corriente', clamp01(S.Ib / 7000), `${num(S.Ib)} A`);
        nivel(2, 'Tarda', clamp01(Math.min(10, S.t) / 10), Number.isFinite(S.t) && S.t < 10 ? `${f1(S.t)} s` : 'no');
    } else {
        const P = L.Pd;
        const aviso = P.pctNoTecnicas * 100 > PERDIDAS.noTecnicas ? `Lo que no se cobra pasa de las ${num(PERDIDAS.noTecnicas, 2)} de cada 100 del país.` : null;
        ponerLecturas([['Entra a la calle', `${f1(P.entra)} kWh`, 'en un día'], ['Se cobra', `${f1(P.cobrada)} kWh`, `${f1((P.cobrada / P.entra) * 100)} de cada 100`], ['Diablitos', `${f1(P.robada)} kWh`, `${f1(P.pctNoTecnicas * 100)} de cada 100`], ['Calor', `${f1(P.tecnicas)} kWh`, `${f1(P.pctTecnicas * 100)} de cada 100`], ['Núcleo', `${f1(P.nucleo)} kWh`, 'aunque no haya carga'], ['Cables y devanados', `${f1(P.cables + P.cobre)} kWh`, 'con el cuadrado de la corriente']], aviso);
        ponerCifra('hud', `${f1((1 - P.cobrada / P.entra) * 100)} %`);
        ponerCifra('hud2', 'de la energía no se cobra');
        graficas.b?.marcar(L.consumo, (P.cables / P.entra) * 100);
        graficas.c?.marcar(L.diablitos, P.pctNoTecnicas * 100);
        nivel(1, 'No se cobra', clamp01(P.pctNoTecnicas / 0.3), `${f1(P.pctNoTecnicas * 100)} %`);
        nivel(2, 'Calor', clamp01(P.pctTecnicas / 0.1), `${f1(P.pctTecnicas * 100)} %`);
    }
}

// ------------------------------------------------------------------ la calle
crearPagina({
    figura: FIGURA,
    fichas: FICHAS,
    vistas: VISTAS,
    modos: MODOS,
    botones: BOTONES,
    acciones: ACCIONES,
    modo0: 'dia',
    pide: { hora: DEF.hora, casas: DEF.casas, consumo: DEF.consumo, paneles: DEF.paneles, d: DEF.d, fusible: DEF.fusible, diablitos: DEF.diablitos, falla: false, corre: true },
    general: { Lx: 16.8, Lz: 6, alto: 2.4, mira: [0, 0.8, 0], az: 18, el: 26, azVertical: 14, elVertical: 36 },
    etiquetas: { lienzo: 'Calle con su red de distribución en 3D: arrastra para girarla, toca un punto para conocerlo', modos: 'Qué ver en la calle', puntos: 'Puntos clave de la calle', desarmar: 'Desarmar la red', lecturas: 'Lo que mide la calle' },
    textoFinal: 'Toca cualquier punto para volver a verlo. Conecta más casas en «Un día en la calle», pon paneles en «El voltaje hasta tu casa», deja caer la rama en «Una rama en los cables» o cuelga diablitos en «Lo que se pierde».',
    colores: { guindaSuave: '#f3d4de', claro: '#ffffff' },
    crearDiagrama,
    secciones,
    escena: (renderer, scene, { movil, oscuro }) => {
        const M = materiales(P_PLANTA);
        const est = escenario(renderer, scene, M, { movil, oscuro });
        return { planta: construir(M, P_PLANTA, { movil, oscuro }), est };
    },
    alCambiarModo: (p, m) => {
        Object.assign(p, { casas: DEF.casas, consumo: DEF.consumo, paneles: DEF.paneles, d: DEF.d, fusible: DEF.fusible, diablitos: DEF.diablitos });
        p.falla = false;
        p.corre = m === 'dia' || m === 'voltaje';
        p.hora = m === 'voltaje' ? 12 : DEF.hora;
        planta = estadoPlanta();
    },
    alCuadro: ({ dt, pide }) => {
        planta = pasoPlanta(planta, { falla: pide.modo === 'falla' && pide.falla }, dt);
    },
    poseDe: ({ pide, ve, encendido, t, dt, camara }) => pose({ modo: pide.modo, planta, hora: pide.hora, casas: Math.round(pide.casas), consumo: pide.consumo, paneles: pide.paneles, d: pide.d, fusible: pide.fusible, diablitos: pide.diablitos, noche: ve.noche, adentro: ve.adentro, desarme: ve.desarme, encendido, t, dt, camara }),
    firma: p => [p.modo, p.modo === 'dia' ? [Math.round(p.casas), Math.round(p.consumo / 50)] : 0, p.modo === 'voltaje' ? [Math.round(p.paneles * 40), Math.round(p.consumo / 50)] : 0, p.modo === 'falla' ? [Math.round(p.d), Math.round(p.fusible)] : 0, p.modo === 'perdidas' ? [Math.round(p.diablitos * 100), Math.round(p.consumo / 50)] : 0],
    alPintarFijas,
    alPintarGraficas,
    alActualizar,
    prueba: p => ({ hora: +p.hora.toFixed(1), casas: Math.round(p.casas), consumo: Math.round(p.consumo), paneles: +p.paneles.toFixed(2), d: Math.round(p.d), fusible: Math.round(p.fusible), diablitos: +p.diablitos.toFixed(2), falla: p.falla, corre: p.corre, ev: planta.falla === null ? null : +planta.falla.toFixed(2) }),
});
