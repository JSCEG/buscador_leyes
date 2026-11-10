// «Cómo se equilibra la red», en 3D y con el formato Búho de «¿Cómo funciona?». Un sistema eléctrico de ejemplo del tamaño del Sistema
// Interconectado Nacional en una tarde, con las reglas del Código de Red. Cuatro formas de verlo: se dispara una central, menos máquinas
// girando, la reserva de un día de calor y cuando falta mucho (el corte de carga por pasos).
// Se arma con: node scripts/build-conceptos-3d.mjs equilibrio-red
//
// Lo que se repite entre las plantas con física está en conceptos-3d/planta-comun/.
import { clamp01, num } from '../planta-comun/ayudas.js';
import { barrasHTML, leyenda, pintarGrafica, seccionBarras, seccionColores, seccionDiagrama, seccionFuentes, seccionGrafica, seccionTabla, tablaHTML } from '../planta-comun/graficas.js';
import { crearPagina } from '../planta-comun/pagina.js';
import { AGUANTE, BANDA, CALOR, DEF, EVENTO2020, F0, FEB2021, FLUIDOS, GOB, LIMITES, PARQUE, PARTES as PARTES_M, PASOS, RESERVA, ROCOF_MAX, SEN2024, SISTEMA, UNIDAD, en, estadoPlanta, pasoPlanta, pose, simular } from './modelo.js';
import { P_PLANTA, construir, escenario, materiales } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';

const FIGURA = 'equilibrio-red';
const f1 = x => num(x, 1);
const f2 = x => num(x, 2);
const hora = h => { const x = ((h % 24) + 24) % 24; const m = Math.floor((x % 1) * 60); return `${String(Math.floor(x)).padStart(2, '0')}:${String(m).padStart(2, '0')}`; };
const ESTADO = { normal: 'Normal', alerta: 'Alerta', emergencia: 'Emergencia' };

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'ciclo', nombre: 'Central de ciclo combinado', modo: 'disparo', accion: 'disparo', eq: 'Sus generadores giran con los 60 Hz', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 20V10h6v10M14 20V6h6v14M2 20h20"/>',
        texto: 'Sus turbinas mueven generadores que giran al ritmo de todos los del país; en 2024 eran 39 de cada 100 MW. Su giro guarda energía: si falta generación, la dan en el primer segundo y se frenan un poco.' },
    { parte: 'rotor', nombre: 'El rotor del generador', modo: 'disparo', abrir: true, accion: 'disparo', eq: 'De 2 a 7 s de inercia', recorrido: { noche: false, adentro: true },
        icono: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16"/>',
        texto: 'La inercia es la energía que guarda al girar. Se mide en segundos: cuánto podría dar toda su potencia solo con ese giro, de 2 a 7 s. Cuando falta generación, la red toma esa energía, el rotor se frena y la frecuencia baja.' },
    { parte: 'gobernador', nombre: 'Gobernador de velocidad', modo: 'disparo', accion: 'sinGob', eq: `Estatismo de ${num(GOB.rango[0] * 100)} a ${num(GOB.rango[1] * 100)} %`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 21a8 8 0 1 1 8-8"/><path d="M12 13l5-5"/>',
        texto: 'Si la frecuencia baja, abre más la válvula. Según el Código de Red, empieza en 2 s como máximo, termina en 30 s y no atiende cambios de menos de 0.03 Hz. Sin ellos, perder 810 MW la dejaría en 59.1 Hz.' },
    { parte: 'hidro', nombre: 'Central hidroeléctrica', modo: 'disparo', accion: 'disparo', eq: 'La menor inercia, según el NREL', recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 8h18v12H3zM3 12c3 2 6-2 9 0s6-2 9 0"/>',
        texto: 'Abre más el agua y sube su potencia. En el modelo, el control del Centro Nacional de Control de Energía (CENACE) le pide subir poco a poco hasta regresar a 60 Hz. En 2024 eran 14 de cada 100 MW instalados.' },
    { parte: 'grande', nombre: 'Central que se dispara', modo: 'disparo', accion: 'disparo', eq: `${num(UNIDAD)} MW, como una de Laguna Verde`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M13 2 5 13h6l-2 9 8-12h-6z"/>',
        texto: 'Una protección la saca de golpe y faltan 810 MW. El sistema debe aguantar perder su central más grande sin salir de lo normal: para eso el Código de Red pide tener reserva. En el modelo, la frecuencia baja a 59.82 Hz en 2.5 s.' },
    { parte: 'turbogas', nombre: 'Turbogás de arranque rápido', modo: 'reserva', accion: 'calor', eq: 'Reserva que no está girando', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 18h12V10H4zM16 14h4M8 10V5"/>',
        texto: 'Está apagado, pero arranca y da su potencia en 10 minutos: es reserva no rodante. La reserva del sistema debe pasar de 6 % de la demanda, con al menos la mitad girando. Si baja, el CENACE lo llama.' },
    { parte: 'eolico', nombre: 'Parque eólico', modo: 'inercia', accion: 'renovable', eq: `${f1(SEN2024.pct.eolica)} de cada 100 MW en 2024`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 12v9M12 12 7 4M12 12l8 2M12 12l-7 5"/>',
        texto: 'Se conecta a la red por inversores: no gira al ritmo de la red ni le da inercia propia. Con más viento y sol quedan menos máquinas girando y la frecuencia cae más rápido, aunque los inversores pueden programarse para responder.' },
    { parte: 'solar', nombre: 'Parque solar', modo: 'inercia', accion: 'renovable', eq: `${f1(SEN2024.pct.solar)} de cada 100 MW en 2024`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 18 6 8h15l-3 10zM8 8l-2 10M13 8l-1 10M17 8l-1 10"/>',
        texto: 'No tiene nada que gire: sus paneles dan corriente directa y un inversor la convierte. A mediodía cubre mucha demanda, pero al caer la tarde se apaga cuando la demanda sigue alta. Por eso la reserva más baja del día llega en la noche.' },
    { parte: 'baterias', nombre: 'Baterías', modo: 'inercia', accion: 'bateria', eq: 'Toda su potencia en menos de 1 s', recorrido: { noche: false, adentro: false },
        icono: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10v4M7 10v4M11 10v4"/>',
        texto: 'Dan respuesta rápida: en menos de un segundo llegan a toda su potencia, mucho antes que un gobernador. En el modelo, con 70 % de sol y viento, 500 MW de baterías evitan que la frecuencia baje de 59.8 Hz al perder 810 MW.' },
    { parte: 'red', nombre: 'Línea de transmisión', modo: 'disparo', accion: 'disparo', eq: 'Una sola frecuencia en todo el SIN', recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 3 7 21M12 3l5 18M8 9h8M6 15h12"/>',
        texto: 'Une todas las centrales, así que todos los generadores giran juntos y la frecuencia es la misma en todo el Sistema Interconectado Nacional (SIN). Hay que generar en cada instante lo mismo que se consume.' },
    { parte: 'ciudad', nombre: 'La ciudad', modo: 'reserva', accion: 'calor', eq: 'La carga baja con la frecuencia', recorrido: { noche: true, adentro: false },
        icono: '<path d="M3 21V9h6v12M9 21V4h7v17M16 21v-8h5v8"/>',
        texto: 'Su consumo cambia todo el día, y el sistema debe seguirlo. Cuando la frecuencia baja, la carga también baja un poco: de 1 a 2 % por cada 1 % de frecuencia, porque muchos motores giran más despacio. Eso ayuda a frenar la caída.' },
    { parte: 'relevadores', nombre: 'Relevadores de baja frecuencia', modo: 'corte', accion: 'g2020', eq: `${PASOS.length} pasos, como en el SIN`, recorrido: { noche: true, adentro: false },
        icono: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="1.5"/><circle cx="14" cy="12" r="1.5"/>',
        texto: 'Si la frecuencia cae demasiado, desconectan sectores por pasos para salvar al resto. El 28 de diciembre de 2020 operaron los cuatro y cortaron 8,696 MW. Aquí cada paso corta 6.5 %, de ejemplo.' },
    { parte: 'cenace', nombre: 'Centro de control del CENACE', modo: 'reserva', accion: 'calor', eq: 'Normal con más de 6 % de reserva', recorrido: { noche: false, adentro: false },
        icono: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
        texto: 'Vigila la frecuencia y la reserva. Su control automático pide a las centrales subir hasta regresar a 60 Hz. Con menos de 6 % de reserva declara alerta; con menos de 3 %, emergencia, y puede cortar carga por turnos.' },
    { parte: 'medidor', nombre: 'Medidor de frecuencia', modo: 'disparo', accion: 'disparo', eq: `Normal de ${f1(BANDA.min)} a ${f1(BANDA.max)} Hz`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="13" r="8"/><path d="M12 13l4-4M8 5l-1-2M16 5l1-2"/>',
        texto: 'La frecuencia es la señal del equilibrio: si se genera menos de lo que se consume, baja; si se genera más, sube. El Código de Red pide mantenerla de 59.8 a 60.2 Hz. En 2024, el SIN estuvo en estado operativo normal 96.81 % del tiempo.' },
];
const VISTAS = Object.fromEntries(PARTES_M.map(p => [p.id, p.vista]));
const reloj = { texto: 'el día', avanzar: (p, dt) => { p.hora = (p.hora + (dt * 24) / 40) % 24; return false; } };
const MODOS = {
    disparo: { nombre: 'Sale una central', corto: 'Disparo', resumen: 'De golpe sale una central. En el primer segundo, el giro de las máquinas da la energía que falta y la frecuencia baja; luego los gobernadores la detienen y el CENACE la regresa a 60 Hz en unos minutos. Toca «Que se dispare».', aclara: 'El sistema de 40,000 MW, su inercia, el estatismo de 5 % y el control del CENACE son de ejemplo. La banda normal y los tiempos de los gobernadores son del Código de Red. Los primeros segundos van en cámara lenta y los minutos, rápido.', mando: { nombre: 'Tamaño de la central', campo: 'perdida', rango: LIMITES.perdida, texto: v => `${num(v)} MW` }, mando2: { nombre: 'Demanda del sistema', campo: 'demanda', rango: LIMITES.demanda, texto: v => `${num(v)} MW` } },
    inercia: { nombre: 'Menos máquinas girando', corto: 'Inercia', resumen: 'Con más sol y viento quedan menos máquinas girando y hay menos inercia: al perder la misma central de 810 MW, la frecuencia cae más rápido y más hondo. Las baterías responden en menos de un segundo. Sube el sol y el viento, o pon baterías.', aclara: 'Aquí el sol y el viento no dan inercia ni respuesta; sus inversores podrían programarse para responder. El tamaño de las baterías y sus ajustes son de ejemplo.', mando: { nombre: 'Sol y viento', campo: 'renovable', rango: LIMITES.renovable, texto: v => `${num(v * 100)} % de la demanda` }, mando2: { nombre: 'Baterías', campo: 'bateria', rango: LIMITES.bateria, texto: v => `${num(v)} MW` } },
    reserva: { nombre: 'La reserva del día', corto: 'Reserva', resumen: 'Además de los segundos, hay que cuidar las horas: tener más disponible de lo que se consume. Al caer la tarde se va el sol y la demanda sigue alta. Súbele al calor o saca centrales y mira cuándo entra en alerta o en emergencia.', aclara: `La forma del día, lo disponible sin sol ni viento (${num(PARQUE.firme)} MW) y lo que da cada hora son de ejemplo. La capacidad solar y eólica es la del país en 2024.`, mando: { nombre: 'Demanda máxima del día', campo: 'pico', rango: LIMITES.pico, texto: v => `${num(v)} MW` }, mando2: { nombre: 'Centrales fuera de servicio', campo: 'fuera', rango: LIMITES.fuera, texto: v => `${num(v)} MW` }, reloj },
    corte: { nombre: 'Cuando falta mucho', corto: 'Corte', resumen: 'Si se pierde demasiado, ni la reserva alcanza: la frecuencia cae tan rápido que hay que cortar carga por pasos para que no se caiga todo. Empieza con lo que se perdió el 28 de diciembre de 2020 y toca «Que se pierda».', aclara: 'Las frecuencias de cada paso y su tamaño son de ejemplo. Ese día primero subió la frecuencia y luego bajó; aquí solo se ve la pérdida. Los primeros segundos van muy despacio.', mando: { nombre: 'Lo que se pierde', campo: 'perdidaG', rango: LIMITES.perdidaG, texto: v => `${num(v)} MW` }, mando2: { nombre: 'Demanda', campo: 'demandaG', rango: LIMITES.demandaG, texto: v => `${num(v)} MW` } },
};
let planta = estadoPlanta();
const BOTONES = [
    { id: 'evento', visible: p => p.modo !== 'reserva', pulsado: p => p.evento, texto: p => (p.evento ? 'Regresar' : p.modo === 'corte' ? 'Que se pierda' : 'Que se dispare'), alTocar: p => { p.evento = !p.evento; } },
];
const ACCIONES = {
    disparo: { texto: p => (p.evento ? 'Regresar la central' : 'Que se dispare'), hacer: (p, pag) => { p.evento = !p.evento; pag.invalidar(); pag.rotular(); } },
    sinGob: { texto: p => (p.gob ? 'Quitar los gobernadores' : 'Regresar los gobernadores'), hacer: (p, pag) => { p.gob = !p.gob; p.evento = true; planta = estadoPlanta(); pag.invalidar(); pag.rotular(); } },
    renovable: { texto: p => (p.renovable > 0.5 ? 'Regresar a 15 % de sol y viento' : '70 % de sol y viento'), hacer: (p, pag) => { p.renovable = p.renovable > 0.5 ? SISTEMA.renovable : 0.7; p.bateria = 0; p.evento = true; planta = estadoPlanta(); pag.invalidar(); pag.ponerMando(); } },
    bateria: { texto: p => (p.bateria > 0 ? 'Quitar las baterías' : 'Poner 500 MW de baterías'), hacer: (p, pag) => { p.bateria = p.bateria > 0 ? 0 : 500; p.renovable = 0.7; p.evento = true; planta = estadoPlanta(); pag.invalidar(); pag.ponerMando(); } },
    calor: { texto: p => (p.pico >= CALOR.pico ? 'Regresar a un día normal' : 'Un día de mucho calor'), hacer: (p, pag) => { const mucho = p.pico < CALOR.pico; p.pico = mucho ? CALOR.pico : DEF.pico; p.fuera = mucho ? CALOR.fuera : DEF.fuera; p.hora = CALOR.hora; p.corre = false; pag.invalidar(); pag.ponerMando(); } },
    g2020: { texto: () => 'Lo que se perdió en 2020', hacer: (p, pag) => { p.perdidaG = EVENTO2020.perdida; p.demandaG = EVENTO2020.demanda; p.evento = true; planta = estadoPlanta(); pag.invalidar(); pag.ponerMando(); } },
};

// ------------------------------------------------------------------ el tablero
const secciones = () => `
    ${seccionDiagrama('Lo que pasa en el sistema')}
    ${seccionGrafica('b')}
    ${seccionGrafica('c')}
    ${seccionBarras()}
    ${seccionTabla('Lo que pide el Código de Red', 'h-codigo', 'Disposiciones de la CRE de 2021 (RES/550/2021), vigentes.', 'h-tabla-texto')}
    ${seccionTabla('El sistema en 2024', 'h-2024', 'Reporte de Confiabilidad del Sistema Eléctrico Nacional 2024, de la CNE.', 'h-tabla-texto')}
    ${seccionTabla('Cuando se cortó carga', 'h-cortes', 'Comunicado del CENACE de 2020 y reportes de confiabilidad de 2021 y 2024.', 'h-tabla-texto')}
    ${seccionTabla('Lo que dice la ley', 'h-regla', 'Ley del Sector Eléctrico y su Reglamento.')}
    ${seccionColores(FLUIDOS, 'Es un sistema de ejemplo y nada está a escala. Son de ejemplo: el tamaño del sistema, la inercia promedio, el estatismo de 5 %, el control del CENACE, las baterías, los pasos del corte de carga, la forma del día y lo disponible sin sol ni viento.', 'Colores de lo que corre')}
    ${seccionFuentes(FUENTES, [
        { para: 'El Control Operativo del sistema, la Confiabilidad, los Servicios Conexos, las obligaciones del CENACE y que el Código de Red sigue vigente', titulo: 'Ley del Sector Eléctrico, arts. 3, 14, 15 y 124, y transitorio tercero', nota: 'Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio' },
        { para: 'El protocolo para conseguir potencia en caso de emergencia', titulo: 'Reglamento de la Ley del Sector Eléctrico, art. 14', nota: 'Está en el acervo de este sitio' },
    ])}`;

const tiempo = t => (t === null ? '—' : t < 60 ? `${f1(t)} s` : `${num(Math.floor(t / 60))} min ${String(Math.floor(t % 60)).padStart(2, '0')} s`);
function alPintarGraficas(L, pag) {
    const { $, pide, graficas } = pag;
    const m = pide.modo;
    graficas.b = null;
    graficas.c = null;
    if (m === 'disparo') {
        const S = L.S;
        const sinGob = simular({ perdida: L.perdida, demanda: L.demanda, gobernadores: false, agc: false, tFin: 600 });
        const conGob = pide.gob ? S : simular({ perdida: L.perdida, demanda: L.demanda, tFin: 600 });
        const lb = [
            { clase: 'h-s-actual', nombre: 'Con gobernadores', f: t => en(conGob, 'f', t) },
            { clase: 'h-s-max', nombre: 'Sin gobernadores', f: t => en(sinGob, 'f', t) },
            { clase: 'h-s-norma', nombre: `Límite normal, ${f1(BANDA.min)} Hz`, f: () => BANDA.min },
        ];
        $('#h-b-t').textContent = 'Los primeros 30 segundos';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `Al perder ${num(L.perdida)} MW con ${num(L.demanda)} MW de demanda. Al principio cae ${f2(S.rocof)} Hz por segundo; con gobernadores, lo más bajo es ${f2(conGob.nadir)} Hz. Sin ellos, solo la carga la frenaría, y bajaría hasta ${f2(sinGob.fFin)} Hz.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Los primeros 30 segundos', xMin: 0, xMax: 30, yMin: 58.8, yMax: 60.2, ticksX: [0, 5, 10, 15, 20, 25, 30], ticksY: [58.8, 59.2, 59.6, 60.0], etX: 'Segundos', etY: 'Hz', lineas: lb, fx: x => num(x), fy: y => f1(y), punta: x => `${f1(x)} s · ${lb.slice(0, 2).map(l => `${l.nombre}: ${f2(l.f(x))} Hz`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Segundo', 'Con gobernadores', 'Sin gobernadores'], [0, 1, 2, 3, 5, 10, 20, 30].map(t => [num(t), f2(lb[0].f(t)), f2(lb[1].f(t))]));
        const sinAgc = simular({ perdida: L.perdida, demanda: L.demanda, agc: false, tFin: 600 });
        const lc = [
            { clase: 'h-s-actual', nombre: 'Con el CENACE', f: x => en(conGob, 'f', x * 60) },
            { clase: 'h-s-sin', nombre: 'Sin el CENACE', f: x => en(sinAgc, 'f', x * 60) },
            { clase: 'h-s-norma', nombre: `Límite normal, ${f1(BANDA.min)} Hz`, f: () => BANDA.min },
        ];
        $('#h-c-t').textContent = 'Los siguientes 10 minutos';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = 'Los gobernadores dejan la frecuencia un poco abajo de 60 Hz. El control automático del CENACE pide a las centrales subir hasta regresarla; sin él se quedaría abajo y la reserva rodante quedaría gastada.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Los siguientes 10 minutos', xMin: 0, xMax: 10, yMin: 59.7, yMax: 60.05, ticksX: [0, 2, 4, 6, 8, 10], ticksY: [59.7, 59.8, 59.9, 60.0], etX: 'Minutos', etY: 'Hz', lineas: lc, fx: x => num(x), fy: y => f1(y), punta: x => `minuto ${f1(x)} · ${lc.slice(0, 2).map(l => `${l.nombre}: ${num(l.f(x), 3)} Hz`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Minuto', 'Con el CENACE', 'Sin el CENACE'], [0.5, 1, 2, 4, 6, 10].map(x => [num(x, x % 1 ? 1 : 0), num(lc[0].f(x), 3), num(lc[1].f(x), 3)]));
    } else if (m === 'inercia') {
        const s = (renovable, bateria) => simular({ perdida: UNIDAD, demanda: SISTEMA.demanda, renovable, bateria, tFin: 600 });
        const [A, B, C] = [L.S, s(0, 0), s(0.7, 0)];
        const otro = !(L.bateria === 0 && (Math.abs(L.renovable) < 0.005 || Math.abs(L.renovable - 0.7) < 0.005));
        const lb = [
            ...(otro ? [{ clase: 'h-s-actual', nombre: `${num(L.renovable * 100)} % y ${num(L.bateria)} MW de baterías`, f: t => en(A, 'f', t) }] : []),
            { clase: 'h-s-sin', nombre: 'Sin sol ni viento', f: t => en(B, 'f', t) },
            { clase: 'h-s-max', nombre: '70 %, sin baterías', f: t => en(C, 'f', t) },
            { clase: 'h-s-norma', nombre: `Primer paso del corte, ${f1(PASOS[0].f)} Hz`, f: () => PASOS[0].f },
        ];
        const series = lb.slice(0, -1);
        $('#h-b-t').textContent = 'Los primeros 15 segundos, al perder 810 MW';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `Con menos máquinas girando, la frecuencia cae más rápido: ${f2(B.rocof)} Hz por segundo sin sol ni viento, ${f2(C.rocof)} con 70 %. Si llegara a ${f1(PASOS[0].f)} Hz, operaría el primer paso del corte de carga; aquí no se cuenta.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Los primeros 15 segundos', xMin: 0, xMax: 15, yMin: 59.3, yMax: 60.1, ticksX: [0, 3, 6, 9, 12, 15], ticksY: [59.3, 59.5, 59.7, 59.9, 60.1], etX: 'Segundos', etY: 'Hz', lineas: lb, fx: x => num(x), fy: y => f1(y), punta: x => `${f1(x)} s · ${series.map(l => `${l.nombre}: ${f2(l.f(x))} Hz`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Segundo', ...series.map(l => l.nombre)], [0, 1, 2, 3, 5, 8, 15].map(t => [num(t), ...series.map(l => f2(l.f(t)))]));
        const nadir = b => r => simular({ perdida: UNIDAD, demanda: SISTEMA.demanda, renovable: r, bateria: b, tFin: 40, agc: false }).nadir;
        const lc = [
            { clase: 'h-s-actual', nombre: L.bateria > 0 ? `Con ${num(L.bateria)} MW de baterías` : 'Sin baterías', f: nadir(L.bateria) },
            ...(L.bateria > 0 ? [{ clase: 'h-s-sin', nombre: 'Sin baterías', f: nadir(0) }] : [{ clase: 'h-s-sin', nombre: 'Con 500 MW', f: nadir(500) }]),
            { clase: 'h-s-norma', nombre: `Límite normal, ${f1(BANDA.min)} Hz`, f: () => BANDA.min },
        ];
        const series2 = lc.slice(0, 2);
        $('#h-c-t').textContent = 'Lo más bajo que llega, según el sol y el viento';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = 'El punto más bajo de la frecuencia al perder 810 MW, sin contar el corte de carga. Las baterías llegan antes que los gobernadores y lo suben.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Lo más bajo que llega', xMin: 0, xMax: 0.7, yMin: 59.3, yMax: 60, ticksX: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7], ticksY: [59.3, 59.5, 59.7, 59.9], etX: 'Sol y viento, de la demanda', etY: 'Hz', lineas: lc, fx: x => `${num(x * 100)} %`, fy: y => f1(y), punta: x => `${num(x * 100)} % · ${series2.map(l => `${l.nombre}: ${f2(l.f(x))} Hz`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Sol y viento', ...series2.map(l => l.nombre)], [0, 0.2, 0.4, 0.5, 0.6, 0.7].map(r => [`${num(r * 100)} %`, ...series2.map(l => f2(l.f(r)))]));
    } else if (m === 'reserva') {
        const D = L.D;
        const lb = [
            { clase: 'h-s-actual', nombre: 'Disponible', f: h => D.en('disponible', h) },
            { clase: 'h-s-sin', nombre: 'Demanda', f: h => D.en('demanda', h) },
            { clase: 'h-s-norma', nombre: 'Demanda más 6 %', f: h => D.en('demanda', h) * (1 + RESERVA.normal) },
        ];
        const series = lb.slice(0, 2);
        $('#h-b-t').textContent = 'Lo que hay y lo que se pide';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `MW en cada hora, con ${num(L.fuera)} MW de centrales fuera de servicio. A mediodía el sol ayuda; al caer la tarde se va y la demanda sigue alta. Para estar en normal, lo disponible debe pasar la línea punteada.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Lo que hay y lo que se pide', xMin: 0, xMax: 24, yMin: 25000, yMax: 60000, ticksX: [0, 6, 12, 18, 24], ticksY: [25000, 35000, 45000, 55000], etX: 'Hora', etY: 'MW', lineas: lb, fx: x => num(x), fy: y => num(y), punta: x => `${hora(x)} · ${series.map(l => `${l.nombre}: ${num(l.f(x))} MW`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Hora', 'Disponible', 'Demanda'], [4, 10, 13, 17, 19, 20, 22].map(h => [hora(h), num(lb[0].f(h)), num(lb[1].f(h))]));
        const lc = [
            { clase: 'h-s-actual', nombre: 'Reserva', f: h => D.en('ro', h) * 100 },
            { clase: 'h-s-norma', nombre: 'Normal, 6 %', f: () => RESERVA.normal * 100 },
            { clase: 'h-s-max', nombre: 'Emergencia, abajo de 3 %', f: () => RESERVA.emergencia * 100 },
        ];
        $('#h-c-t').textContent = 'La reserva, hora por hora';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `De cada 100 MW de demanda. Lo más bajo: ${f1(D.minRo * 100)} % a las ${hora(D.horaMin)}. En este día, ${f1(D.horas.normal)} h en normal, ${f1(D.horas.alerta)} en alerta y ${f1(D.horas.emergencia)} en emergencia.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'La reserva, hora por hora', xMin: 0, xMax: 24, yMin: -10, yMax: 30, ticksX: [0, 6, 12, 18, 24], ticksY: [-10, 0, 10, 20, 30], etX: 'Hora', etY: '%', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${hora(x)} · reserva ${f1(lc[0].f(x))} %` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Hora', 'Reserva', 'Estado'], [4, 10, 13, 17, 19, 20, 22].map(h => { const r = D.en('ro', h); return [hora(h), `${f1(r * 100)} %`, ESTADO[r >= RESERVA.normal ? 'normal' : r >= RESERVA.emergencia ? 'alerta' : 'emergencia']]; }));
    } else {
        const S = L.S;
        const sinPasos = simular({ perdida: L.perdida, demanda: L.demanda, renovable: SISTEMA.renovable, pasos: false, tFin: 120 });
        const lb = [
            { clase: 'h-s-actual', nombre: 'Con los cuatro pasos', f: t => en(S, 'f', t) },
            { clase: 'h-s-max', nombre: 'Sin corte de carga', f: t => en(sinPasos, 'f', t) },
            { clase: 'h-s-norma', nombre: `Primer paso, ${f1(PASOS[0].f)} Hz`, f: () => PASOS[0].f },
        ];
        $('#h-b-t').textContent = 'Los primeros 20 segundos';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `Al perder ${num(L.perdida)} MW con ${num(L.demanda)} MW de demanda, cae ${f2(S.rocof)} Hz por segundo${S.rocof > ROCOF_MAX ? `: más de los ${f1(ROCOF_MAX)} que deben aguantar las centrales` : ''}. ${sinPasos.colapso !== null ? `Sin cortar carga, baja de ${num(57)} Hz en ${f1(sinPasos.colapso)} s y el sistema se cae.` : 'Sin cortar carga, alcanza a sostenerse.'}`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Los primeros 20 segundos', xMin: 0, xMax: 20, yMin: 56.5, yMax: 61, ticksX: [0, 5, 10, 15, 20], ticksY: [57, 58, 59, 60, 61], etX: 'Segundos', etY: 'Hz', lineas: lb, fx: x => num(x), fy: y => num(y), punta: x => `${f1(x)} s · ${lb.slice(0, 2).map(l => `${l.nombre}: ${l.f(x) < 56.5 ? 'apagón' : `${f2(l.f(x))} Hz`}`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Segundo', 'Con los pasos', 'Sin corte'], [0, 0.5, 1, 1.5, 2, 5, 10, 20].map(t => [num(t, t % 1 ? 1 : 0), f2(lb[0].f(t)), lb[1].f(t) < 56.5 ? 'apagón' : f2(lb[1].f(t))]));
        const corta = p => simular({ perdida: p, demanda: L.demanda, renovable: SISTEMA.renovable, pasos: true, tFin: 30, agc: false }).cortado;
        const lc = [
            { clase: 'h-s-actual', nombre: 'Se corta', f: corta },
            { clase: 'h-s-sin', nombre: 'Lo que se pierde', f: p => p },
        ];
        $('#h-c-t').textContent = 'Cuánta carga se corta, según lo que se pierde';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `MW, con ${num(L.demanda)} MW de demanda. Cada paso corta ${num(PASOS[0].pct * 100, 1)} % y se corta un poco más de lo que falta. El 28 de diciembre de 2020 se perdieron unos ${num(EVENTO2020.perdida)} MW y se cortaron ${num(EVENTO2020.corte)}.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Cuánta carga se corta', xMin: 1000, xMax: 12000, yMin: 0, yMax: 12000, ticksX: [1000, 4000, 8000, 12000], ticksY: [0, 4000, 8000, 12000], etX: 'Lo que se pierde, MW', etY: 'MW', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} MW perdidos · se cortan ${num(corta(x))} MW` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Se pierde', 'Se corta'], [1000, 2000, 4000, 6000, 9262, 12000].map(p => [num(p), num(corta(p))]));
    }
}
function pintarBarras(L, pag) {
    const { $, pide } = pag;
    let filas;
    if (pide.modo === 'disparo' || pide.modo === 'inercia') {
        const p = Math.max(1, L.perdida);
        filas = [
            { t: 'El giro de las máquinas', v: L.inercia / p, activa: true, escala: 1 },
            { t: 'La carga que baja', v: L.carga / p, escala: 1 },
            { t: 'Gobernadores', v: L.gob / p, escala: 1 },
            { t: 'Baterías', v: L.bat / p, escala: 1 },
            { t: 'Control del CENACE', v: L.agc / p, escala: 1 },
            { t: 'Corte de carga', v: L.cortado / p, escala: 1 },
        ];
        $('#h-d-t').textContent = `Quién cubre los ${num(L.perdida)} MW que faltan, de cada 100`;
        const cubre = L.gob + L.bat + L.agc + L.carga + L.cortado;
        $('#h-d-pie').textContent = L.t === null ? 'Toca «Que se dispare» para verlo.' : L.inercia > 0.3 * p ? 'Primero lo da el giro de las máquinas, que se frenan; por eso baja la frecuencia.' : cubre > 1.02 * p ? 'Ya sobra un poco: las máquinas se aceleran y la frecuencia sube.' : L.agc > L.gob ? 'El CENACE ya pidió subir a las centrales: los gobernadores regresan a su lugar.' : 'Los gobernadores ya responden y la carga baja un poco: la frecuencia deja de caer.';
    } else if (pide.modo === 'reserva') {
        filas = [{ t: `Reserva a las ${hora(L.hora)}`, v: Math.max(0, L.ro), activa: true, escala: 0.25, d: 1 }, { t: 'Para estado normal', v: RESERVA.normal, escala: 0.25, d: 1 }, { t: 'Abajo de esto, emergencia', v: RESERVA.emergencia, escala: 0.25, d: 1 }];
        $('#h-d-t').textContent = 'La reserva, de cada 100 MW de demanda';
        $('#h-d-pie').textContent = `En 2024, el SIN tuvo ${num(SEN2024.alertas)} alertas y ${num(SEN2024.emergencias)} emergencias. El 7 de mayo, con una ola de calor y centrales fuera, hubo ${num(SEN2024.mayo7.disturbios)} interrupciones de carga.`;
    } else {
        filas = PASOS.map((p, i) => ({ t: `Paso ${i + 1}, ${f1(p.f)} Hz`, v: p.pct, activa: L.cortes.some(c => c.i === i), escala: 0.1, d: 1 }));
        $('#h-d-t').textContent = 'Los pasos del corte de carga, de cada 100 MW';
        $('#h-d-pie').textContent = L.cortes.length ? `Operaron ${L.cortes.length} de ${PASOS.length}: se cortaron ${num(L.cortado)} MW.` : `Ninguno ha operado. El 28 de diciembre de 2020 operaron los cuatro y cortaron ${num(EVENTO2020.corte)} MW.`;
    }
    $('#h-barras').innerHTML = barrasHTML(filas);
}
function alPintarFijas({ $ }) {
    $('#h-codigo').innerHTML = tablaHTML(['Qué', 'Cuánto'], [
        ['Frecuencia en estado normal (SIN)', `${f1(BANDA.min)} a ${f1(BANDA.max)} Hz`],
        ['Reserva operativa en estado normal', `más de ${num(RESERVA.normal * 100)} % de la demanda`],
        ['En alerta', `de ${num(RESERVA.emergencia * 100)} a ${num(RESERVA.normal * 100)} %`],
        ['En emergencia', `menos de ${num(RESERVA.emergencia * 100)} %`],
        ['Reserva que ya debe estar girando', 'al menos la mitad'],
        ['Estatismo de los gobernadores', `${num(GOB.rango[0] * 100)} a ${num(GOB.rango[1] * 100)} %`],
        ['Cambio que no deben atender', `menos de ±${num(GOB.banda * 1000)} mHz`],
        ['Cuándo responden', 'empiezan en 2 s; terminan en 30 s'],
        ['Cambio de frecuencia que deben aguantar', `hasta ${f1(ROCOF_MAX)} Hz por segundo`],
        ...AGUANTE.map(a => [`Aguantar de ${f1(a.de)} a ${f1(a.a)} Hz`, a.min === Infinity ? 'sin límite' : `${a.min} minutos`]),
    ]);
    $('#h-2024').innerHTML = tablaHTML(['Qué', 'Cuánto'], [
        ['Tiempo en estado normal (SIN)', `${f2(SEN2024.normal)} %`],
        ['Con la reserva de normal, en mayo y junio', `${f2(SEN2024.mayo)} y ${f2(SEN2024.junio)} %`],
        ['Alertas en el año', num(SEN2024.alertas)],
        ['Emergencias en el año', num(SEN2024.emergencias)],
        ['El 7 de mayo', `${num(SEN2024.mayo7.disturbios)} interrupciones; ${f2(SEN2024.mayo7.MWh)} MWh`],
        ['Capacidad instalada', `${num(SEN2024.capacidad)} MW`],
        ['Ciclo combinado e hidroeléctricas', `${f2(SEN2024.pct.ciclo)} y ${f2(SEN2024.pct.hidro)} %`],
        ['Solar y eólica', `${f2(SEN2024.pct.solar)} y ${f2(SEN2024.pct.eolica)} %`],
    ]);
    $('#h-cortes').innerHTML = tablaHTML(['Cuándo', 'Qué pasó'], [
        ['28 de diciembre de 2020', `Salieron unos ${num(EVENTO2020.perdida)} MW; la frecuencia bajó a ${f1(EVENTO2020.fMin)} Hz y los cuatro pasos cortaron ${num(EVENTO2020.corte)} MW, 26 % de la demanda`],
        ['Febrero de 2021, noreste', `Sin gas por la helada en Texas, el corte por baja frecuencia desconectó ${num(FEB2021.corte, 1)} MW`],
        ['2024, Baja California Sur', 'Sistema aislado: 13 cortes; la frecuencia bajó en promedio a 59.36 Hz'],
    ]);
    $('#h-regla').innerHTML = tablaHTML(['Qué', 'Dónde lo dice'], [
        ['El Control Operativo del sistema, que incluye asignar y despachar centrales con Confiabilidad, es exclusivo del Estado', 'Ley, art. 3, fracc. XII'],
        ['Confiabilidad: satisfacer la demanda con suficiencia y Seguridad de Despacho, con los criterios que emite la CNE', 'Ley, art. 3, fracc. IX'],
        ['Los Servicios Conexos incluyen la reserva operativa, la reserva rodante y la regulación de frecuencia', 'Ley, art. 3, fracc. XLIX'],
        ['El Estado ejerce el Control Operativo a través del CENACE, y sus instrucciones son obligatorias', 'Ley, arts. 14 y 15'],
        ['El CENACE determina lo necesario para la Confiabilidad y asigna y despacha centrales, Demanda Controlable y almacenamiento', 'Ley, art. 124, fraccs. I, II y V'],
        ['El Código de Red sigue vigente mientras no se expidan nuevas disposiciones', 'Ley, transitorio tercero'],
        ['La CNE expide el protocolo para que el CENACE consiga potencia en caso de emergencia', 'Reglamento, art. 14'],
    ]);
}
function alActualizar(L, pag) {
    const { pide, ponerCifra, ponerLecturas, nivel, graficas } = pag;
    pintarBarras(L, pag);
    ponerCifra('aT', { disparo: 'La frecuencia y quién responde', inercia: 'La inercia y las baterías', reserva: 'La reserva de esta hora', corte: 'El corte de carga' }[pide.modo]);
    if (pide.modo === 'reserva') {
        const aviso = L.estado === 'emergencia' ? `Emergencia: la reserva es de ${f1(L.ro * 100)} %. El CENACE corta ${num(L.corte)} MW por turnos.` : L.estado === 'alerta' ? `Alerta: la reserva es de ${f1(L.ro * 100)} %, menos de 6 %.` : null;
        ponerLecturas([['Hora', hora(L.hora), 'del día'], ['Demanda', `${num(L.demanda)} MW`, `máxima de ${num(L.pico)}`], ['Disponible', `${num(L.disponible)} MW`, `${num(L.solar)} de sol, ${num(L.eolica)} de viento`], ['Reserva', `${f1(L.ro * 100)} %`, ESTADO[L.estado]], ['Fuera de servicio', `${num(L.fuera)} MW`, 'centrales que no están'], ['Hay que cortar', `${num(L.corte)} MW`, L.corte > 0 ? 'por turnos' : 'nada']], aviso);
        ponerCifra('hud', `${f1(L.ro * 100)} %`);
        ponerCifra('hud2', `de reserva: ${ESTADO[L.estado].toLowerCase()}`);
        graficas.b?.marcar(L.hora, L.disponible);
        graficas.b?.ahora(L.hora);
        graficas.c?.marcar(L.hora, L.ro * 100);
        graficas.c?.ahora(L.hora);
        nivel(1, 'Reserva', clamp01(L.ro / 0.2), `${f1(L.ro * 100)} %`);
        nivel(2, 'Sol', clamp01(L.solar / PARQUE.solar), `${num(L.solar)} MW`);
        return;
    }
    const S = L.S;
    const fuera = L.f < BANDA.min || L.f > BANDA.max;
    const bajo = pide.modo !== 'corte' && L.t !== null && L.t >= S.tNadir && S.nadir < PASOS[0].f;
    const aviso = L.apagon ? 'La frecuencia bajó de 57 Hz: las centrales se desconectan y el sistema se cae.' : bajo ? `Bajó a ${f2(S.nadir)} Hz: con el corte de carga, aquí operaría el primer paso, a ${f1(PASOS[0].f)} Hz.` : L.cortes.length ? `Operó el corte de carga: ${L.cortes.length} de ${PASOS.length} pasos, ${num(L.cortado)} MW.` : fuera ? `La frecuencia salió de lo normal: ${f2(L.f)} Hz.` : null;
    const estado = L.t === null ? 'sin pérdida' : L.f < F0 - 0.005 ? 'baja' : L.f > F0 + 0.005 ? 'alta' : 'en 60 Hz';
    if (pide.modo === 'inercia') ponerLecturas([['Frecuencia', `${f2(L.f)} Hz`, estado], ['Sol y viento', `${num(L.renovable * 100)} %`, 'de la demanda'], ['Inercia', `${num(S.Ek / 1000)} GW·s`, 'de lo que gira'], ['Cae al principio', `${f2(S.rocof)} Hz/s`, `al perder ${num(UNIDAD)} MW`], ['Lo más bajo', `${f2(S.nadir)} Hz`, `a los ${f1(S.tNadir)} s`], ['Baterías', `${num(L.bat)} MW`, `de ${num(L.bateria)}`]], aviso);
    else if (pide.modo === 'corte') ponerLecturas([['Frecuencia', L.apagon ? 'apagón' : `${f2(L.f)} Hz`, estado], ['Se pierde', `${num(L.perdida)} MW`, `${num((L.perdida / L.demanda) * 100)} % de la demanda`], ['Cae al principio', `${f2(S.rocof)} Hz/s`, `aguantan ${f1(ROCOF_MAX)}`], ['Lo más bajo', `${f2(S.nadir)} Hz`, `a los ${f1(S.tNadir)} s`], ['Pasos', `${L.cortes.length} de ${PASOS.length}`, 'del corte de carga'], ['Se corta', `${num(L.cortado)} MW`, `${num((L.cortado / L.demanda) * 100)} % de la demanda`]], aviso);
    else ponerLecturas([['Frecuencia', `${f2(L.f)} Hz`, estado], ['Falta', `${num(L.perdida)} MW`, `de ${num(L.demanda)} MW`], ['Cae al principio', `${f2(S.rocof)} Hz/s`, `aguantan ${f1(ROCOF_MAX)}`], ['Lo más bajo', `${f2(S.nadir)} Hz`, `a los ${f1(S.tNadir)} s`], ['Gobernadores', `${num(L.gob)} MW`, pide.gob ? `de ${num(S.RR)} de reserva rodante` : 'apagados'], ['Tiempo', tiempo(L.t), L.t === null ? 'toca «Que se dispare»' : 'desde la pérdida']], aviso);
    ponerCifra('hud', L.apagon ? 'Apagón' : `${f2(L.f)} Hz`);
    ponerCifra('hud2', L.t === null ? 'en todo el sistema' : tiempo(L.t));
    const tb = pide.modo === 'disparo' ? 30 : pide.modo === 'inercia' ? 15 : 20;
    if (L.t !== null && L.t <= tb) { graficas.b?.marcar(L.t, L.f); graficas.b?.ahora(L.t); }
    if (pide.modo === 'disparo' && L.t !== null) { graficas.c?.marcar(L.t / 60, L.f); graficas.c?.ahora(L.t / 60); }
    if (pide.modo === 'inercia') graficas.c?.marcar(L.renovable, S.nadir);
    if (pide.modo === 'corte') graficas.c?.marcar(L.perdida, S.cortado);
    nivel(1, 'Frecuencia', clamp01((L.f - 58.5) / 3), L.apagon ? '—' : `${f2(L.f)} Hz`);
    nivel(2, pide.modo === 'corte' ? 'Carga cortada' : 'Reserva usada', pide.modo === 'corte' ? clamp01(L.cortado / (L.demanda * 0.3)) : clamp01((L.gob + L.agc) / Math.max(1, S.RO)), pide.modo === 'corte' ? `${num(L.cortado)} MW` : `${num(L.gob + L.agc)} MW`);
}

// ------------------------------------------------------------------ el sistema
crearPagina({
    figura: FIGURA,
    fichas: FICHAS,
    vistas: VISTAS,
    modos: MODOS,
    botones: BOTONES,
    acciones: ACCIONES,
    modo0: 'disparo',
    pide: { perdida: DEF.perdida, demanda: DEF.demanda, renovable: DEF.renovable, bateria: DEF.bateria, pico: DEF.pico, fuera: DEF.fuera, perdidaG: DEF.perdidaG, demandaG: DEF.demandaG, hora: DEF.hora, evento: false, gob: true, corre: false },
    general: { Lx: 16.8, Lz: 6.8, alto: 2.6, mira: [0, 0.8, 0], az: 16, el: 28, azVertical: 12, elVertical: 38 },
    etiquetas: { lienzo: 'Sistema eléctrico de ejemplo en 3D: arrastra para girarlo, toca un punto para conocerlo', modos: 'Qué ver en el sistema', puntos: 'Puntos clave del sistema', desarmar: 'Desarmar el sistema', lecturas: 'Lo que mide el sistema' },
    textoFinal: 'Toca cualquier punto para volver a verlo. Dispara una central en «Sale una central», sube el sol y el viento en «Menos máquinas girando», súbele al calor en «La reserva del día» o repite el 28 de diciembre de 2020 en «Cuando falta mucho».',
    colores: { guindaSuave: '#f3d4de', claro: '#ffffff' },
    crearDiagrama,
    secciones,
    escena: (renderer, scene, { movil, oscuro }) => {
        const M = materiales(P_PLANTA);
        const est = escenario(renderer, scene, M, { movil, oscuro });
        return { planta: construir(M, P_PLANTA, { movil, oscuro }), est };
    },
    alCambiarModo: (p, m) => {
        Object.assign(p, { perdida: DEF.perdida, demanda: DEF.demanda, renovable: DEF.renovable, bateria: DEF.bateria, pico: DEF.pico, fuera: DEF.fuera, perdidaG: DEF.perdidaG, demandaG: DEF.demandaG, gob: true });
        p.evento = false;
        p.corre = m === 'reserva';
        p.hora = DEF.hora;
        planta = estadoPlanta();
    },
    alCuadro: ({ dt, pide }) => {
        planta = pasoPlanta(planta, { evento: pide.modo !== 'reserva' && pide.evento, tope: pide.modo === 'corte' ? 120 : 600, modo: pide.modo }, dt);
    },
    poseDe: ({ pide, ve, encendido, t, dt, camara }) => pose({ modo: pide.modo, planta, perdida: pide.perdida, demanda: pide.demanda, renovable: pide.renovable, bateria: pide.bateria, pico: pide.pico, fuera: pide.fuera, perdidaG: pide.perdidaG, demandaG: pide.demandaG, hora: pide.hora, gob: pide.gob, noche: ve.noche, adentro: ve.adentro, desarme: ve.desarme, encendido, t, dt, camara }),
    firma: p => [p.modo, Math.round(p.perdida / 10), Math.round(p.demanda / 100), Math.round(p.renovable * 100), Math.round(p.bateria / 10), Math.round(p.pico / 100), Math.round(p.fuera / 100), Math.round(p.perdidaG / 10), Math.round(p.demandaG / 100), p.gob],
    alPintarFijas,
    alPintarGraficas,
    alActualizar,
    prueba: p => ({ hora: +p.hora.toFixed(1), perdida: Math.round(p.perdida), demanda: Math.round(p.demanda), renovable: +p.renovable.toFixed(2), bateria: Math.round(p.bateria), pico: Math.round(p.pico), fuera: Math.round(p.fuera), perdidaG: Math.round(p.perdidaG), demandaG: Math.round(p.demandaG), evento: p.evento, gob: p.gob, corre: p.corre, ev: planta.ev === null ? null : +planta.ev.toFixed(2) }),
});
