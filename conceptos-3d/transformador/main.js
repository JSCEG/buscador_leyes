// «Transformador», en 3D y con el formato Búho de «¿Cómo funciona?». El banco de autotransformadores AT42 de la Subestación Santa Cruz
// de la CFE: tres unidades de una fase de 110 MVA, 400/230 kV. Cinco formas de verlo: cómo cambia el voltaje, por qué es
// autotransformador, con carga, al energizarlo y una falla.
// Se arma con: node scripts/build-conceptos-3d.mjs transformador
//
// Lo que se repite entre las plantas con física está en conceptos-3d/planta-comun/.
import { clamp01, num } from '../planta-comun/ayudas.js';
import { barrasHTML, leyenda, pintarGrafica, seccionBarras, seccionColores, seccionDiagrama, seccionFuentes, seccionGrafica, seccionTabla, tablaHTML } from '../planta-comun/graficas.js';
import { crearPagina } from '../planta-comun/pagina.js';
import { A, BANCO, CONEXION, DEF, DIF, EJ, FASE, FLUIDOS, I0, IN, LIMITES, NORMA, P0, PARTES as PARTES_M, PRUEBA, ZBASE, auto, carga, corrienteEn, energizar, estadoPlanta, falla, fallaConZ, magnet, parteNucleo, pasoPlanta, pose, relacion } from './modelo.js';
import { P_PLANTA, construir, escenario, materiales } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';

const FIGURA = 'transformador';
const f1 = x => num(x, 1);
const f2 = x => num(x, 2);
const fpTexto = a => { const fp = Math.cos((a * Math.PI) / 180); return a > 0.5 ? `${f2(fp)} en atraso` : a < -0.5 ? `${f2(fp)} en adelanto` : '1.00'; };
const alfaTexto = a => `${num(a)}°${a < 4 || a > 176 ? ' · voltaje en cero' : Math.abs(a - 90) < 4 ? ' · voltaje en su máximo' : ''}`;
const remTexto = r => `${r > 0.004 ? '+' : r < -0.004 ? '−' : ''}${num(Math.abs(r) * 100)} %`;
const A_TXT = f2(A);

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'banco', nombre: 'Banco de tres unidades', modo: 'auto', accion: 'plena', eq: `3 × ${BANCO.Su} MVA = ${BANCO.S} MVA`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="3" y="8" width="5" height="10" rx="1"/><rect x="9.5" y="8" width="5" height="10" rx="1"/><rect x="16" y="8" width="5" height="10" rx="1"/>',
        texto: 'Tres autotransformadores de una fase, uno por cada fase de la red, forman el banco AT42 de la Subestación Santa Cruz de la CFE. Juntos pasan hasta 330 MVA entre los anillos de 400 y 230 kV de la Ciudad de México.' },
    { parte: 'boquillaAT', nombre: 'Boquilla de 400 kV', modo: 'relacion', accion: 'sobre', eq: `${num(FASE.alta)} kV de la fase a tierra`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 2v4M9 6h6M8.5 9h7M9 12h6M8.5 15h7M9 18h6M10 21h4"/>',
        texto: 'Por aquí entra la línea de 400 kV sin tocar el tanque: un aislador largo con faldones. Cada unidad va de una fase a tierra, así que su devanado ve 231 kV, no 400.' },
    { parte: 'boquillaBT', nombre: 'Boquilla de 230 kV', modo: 'relacion', accion: 'sobre', eq: `400 ÷ 230 = ${A_TXT}`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 5v3M9.5 8h5M9 11h6M9.5 14h5M10 17h4"/>',
        texto: `Por aquí sale la energía al anillo de 230 kV. El voltaje baja en la proporción de las vueltas, 400 entre 230, y la corriente sube en esa misma proporción: de ${num(IN.alta)} a ${num(IN.baja)} A por fase a plena carga.` },
    { parte: 'nucleo', nombre: 'Núcleo de acero', modo: 'relacion', abrir: true, accion: 'sobre', eq: 'El flujo sale de voltaje ÷ frecuencia', recorrido: { noche: false, adentro: true },
        icono: '<rect x="4" y="4" width="16" height="16" rx="1"/><rect x="9" y="8" width="6" height="8"/>',
        texto: 'Láminas delgadas de acero llevan el flujo magnético de un devanado al otro. Al voltaje nominal trabaja en el codo de su curva: con 10 % más de voltaje pide unas cinco veces más corriente, y más arriba se satura.' },
    { parte: 'serie', nombre: 'Devanado serie', modo: 'auto', abrir: true, accion: 'plena', eq: `${num(FASE.alta - FASE.baja)} kV · ${num(IN.alta)} A`, recorrido: { noche: false, adentro: true },
        icono: '<path d="M7 4v16M17 4v16M7 7h10M7 11h10M7 15h10M7 19h10"/>',
        texto: `La parte del devanado que solo usa el lado de 400 kV, en serie con el común. Lleva toda la corriente del lado de 400 kV, ${num(IN.alta)} A por fase a plena carga, pero solo ${num(FASE.alta - FASE.baja)} de los ${num(FASE.alta)} kV.` },
    { parte: 'comun', nombre: 'Devanado común', modo: 'auto', abrir: true, accion: 'plena', eq: `${num(FASE.baja)} kV · ${num(IN.baja - IN.alta)} A`, recorrido: { noche: false, adentro: true },
        icono: '<path d="M8 4v16M16 4v16M8 9h8M8 15h8"/>',
        texto: `Lo comparten los dos lados. Por él pasa solo la diferencia entre la corriente de 230 kV y la de 400 kV: ${num(IN.baja - IN.alta)} A en vez de ${num(IN.baja)}. Por eso un autotransformador usa menos cobre y menos núcleo.` },
    { parte: 'terciario', nombre: 'Devanado terciario', modo: 'relacion', abrir: true, accion: 'sobre', eq: 'En delta entre las tres unidades', recorrido: { noche: false, adentro: true },
        icono: '<path d="M12 4 21 19H3Z"/>',
        texto: 'Un tercer devanado, pegado al núcleo, que se une en delta (un triángulo) entre las tres unidades por sus boquillas de arriba. Con él desaparecen los problemas que darían las cargas desequilibradas entre una fase y el neutro.' },
    { parte: 'neutro', nombre: 'Neutro a tierra', modo: 'auto', accion: 'plena', eq: 'El punto común, H0X0', recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 3v10M6 13h12M8 16h8M10.5 19h3"/>',
        texto: 'Aquí se unen los dos lados, y va a tierra. En un autotransformador el lado de 400 kV y el de 230 kV no están aislados entre sí; con su punto común a tierra se evita que una falla deje un lado a un voltaje peligroso.' },
    { parte: 'cambiador', nombre: 'Cambiador de derivaciones', modo: 'carga', accion: 'atraso', eq: `Posición ${BANCO.posicion}, la nominal`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="12" r="8"/><path d="M12 12l4-4M12 4v2M20 12h-2M12 20v-2M4 12h2"/>',
        texto: 'Cambia unas cuantas vueltas sin desconectar el banco, para corregir el voltaje que cae con la carga. La norma CFE K0000-06 le pide ±10 %, en pasos de 0.625 % o de 1 %.' },
    { parte: 'tanque', nombre: 'Tanque y aceite', modo: 'carga', accion: 'plena', eq: `Hasta ${NORMA.subida.caliente} °C sobre el ambiente`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="5" y="5" width="14" height="15" rx="1.5"/><path d="M5 10h14"/>',
        texto: `El núcleo y los devanados van sumergidos en aceite, que aísla y se lleva el calor. La norma pide que los devanados no suban más de ${NORMA.subida.promedio} °C en promedio, ni ${NORMA.subida.caliente} °C en su punto más caliente, sobre un ambiente de ${NORMA.subida.ambiente} °C.` },
    { parte: 'radiadores', nombre: 'Radiadores y ventiladores', modo: 'carga', accion: 'plena', eq: 'Aire natural y aire forzado', recorrido: { noche: false, adentro: false },
        icono: '<path d="M5 4v16M9 4v16M13 4v16M17 4v16M3 20h18"/>',
        texto: `El aceite caliente sube, baja por los radiadores y se enfría. Con poca carga basta el aire natural; con mucha, se prenden los ventiladores. En el modelo, arriba de ${num(EJ.ventiladores * 100)} % de su corriente.` },
    { parte: 'conservador', nombre: 'Conservador y Buchholz', modo: 'falla', accion: 'dentro', eq: 'Gas o golpe de aceite: dispara', recorrido: { noche: false, adentro: false },
        icono: '<rect x="4" y="4" width="16" height="6" rx="3"/><path d="M12 10v5"/><rect x="9" y="15" width="6" height="5" rx="1"/>',
        texto: 'Un tanque arriba deja que el aceite crezca y se encoja con el calor. En su tubo va el relevador Buchholz: junta el gas que suelta una falla adentro y siente el golpe del aceite; da alarma y dispara.' },
    { parte: 'interruptor', nombre: 'Interruptor de 400 kV', modo: 'energizar', accion: 'peor', eq: 'Conecta el banco a la red', recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 12h6l6-5M15 12h6"/>',
        texto: 'Conecta el banco a la red de 400 kV. Al energizarlo, el momento en que cierra decide el golpe: con el voltaje en cero, el flujo del núcleo puede llegar a 2.5 veces el normal y la corriente a 5 a 8 veces la nominal.' },
    { parte: 'diferencial', nombre: 'Protección diferencial', modo: 'energizar', accion: 'sinBloqueo', eq: `Bloqueo: ${DIF.h2} % de 2.ª armónica`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 12h5M15 12h5"/><circle cx="12" cy="12" r="3"/><path d="M12 4v5M12 15v5"/>',
        texto: `Compara lo que entra con lo que sale: si no cuadra, hay una falla adentro y abre. Al energizar entra corriente que no sale, pero con mucha segunda armónica (120 Hz): con ${DIF.h2} % o más, se bloquea (CFE G0100-07).` },
];
const VISTAS = Object.fromEntries(PARTES_M.map(p => [p.id, p.vista]));
let planta = estadoPlanta();
const MODOS = {
    relacion: { nombre: 'El voltaje', corto: 'Voltaje', resumen: 'El voltaje baja en la proporción de las vueltas: 400 entre 230. El núcleo lleva un flujo que pone el voltaje entre la frecuencia. Sube el voltaje o baja la frecuencia y mira cuándo se satura el acero.', aclara: 'La relación y la prueba de excitación son del banco real. La curva del núcleo es de ejemplo, ajustada a esa prueba; las pérdidas del núcleo, una estimación.', mando: { nombre: 'Voltaje en el lado de 400 kV', campo: 'v', rango: LIMITES.v, texto: v => `${num(v)} % · ${num((v * BANCO.alta) / 100)} kV` }, mando2: { nombre: 'Frecuencia de la red', campo: 'f', rango: LIMITES.f, texto: v => `${f1(v)} Hz` } },
    auto: { nombre: 'Autotransformador', corto: 'Auto', resumen: 'Tiene un solo devanado por fase con una salida intermedia. Así, una parte de la energía pasa directo por el cobre y solo el resto pasa por el núcleo. Súbele la carga y mira la corriente de cada parte.', aclara: 'Las cuentas salen de la placa: 400 y 230 kV, 110 MVA por unidad.', mando: { nombre: 'Carga del banco', campo: 's', rango: LIMITES.s, texto: v => `${num(v * 100)} % · ${num(v * BANCO.S)} MVA` } },
    carga: { nombre: 'Con carga', corto: 'Carga', resumen: 'Con carga, la corriente pasa por la impedancia del banco: el voltaje de 230 kV cae (o sube, si la carga es capacitiva) y el cobre se calienta. Cambia la carga y su factor de potencia.', aclara: `La impedancia de ${f2(BANCO.z * 100)} % es de la placa. Las pérdidas del cobre (${num(EJ.pc)} kW a plena carga) son de ejemplo; las del núcleo, una estimación con la prueba. La red de 400 kV se toma fija.`, mando: { nombre: 'Carga', campo: 's', rango: LIMITES.s, texto: v => `${num(v * 100)} % · ${num(v * BANCO.S)} MVA` }, mando2: { nombre: 'Factor de potencia', campo: 'ang', rango: LIMITES.ang, texto: fpTexto } },
    energizar: { nombre: 'Al energizarlo', corto: 'Energizar', resumen: 'Al cerrar el interruptor, el núcleo puede pedir un golpe de corriente de varias veces la nominal. Depende del momento del ciclo en que cierra y del flujo que quedó en el núcleo. Elige y cierra.', aclara: 'Los límites son de los apuntes de Rodríguez Pozueta y de la norma CFE G0100-07. La curva del núcleo, cuánto tarda en apagarse el golpe y el arranque de la diferencial son de ejemplo.', mando: { nombre: 'Momento del ciclo al cerrar', campo: 'alfa', rango: LIMITES.alfa, texto: alfaTexto }, mando2: { nombre: 'Flujo que quedó en el núcleo', campo: 'rem', rango: LIMITES.rem, texto: remTexto } },
    falla: { nombre: 'Una falla', corto: 'Falla', resumen: 'Si cae una falla en la barra de 230 kV, la corriente la limitan la red y la impedancia del banco. Cambia qué tan fuerte es la red, haz caer la falla y compárala con una adentro del banco.', aclara: 'Los niveles de diseño, el factor de 2.55 y los 2 segundos son de la norma CFE K0000-06. La falla es en las tres fases y la red de 400 kV se toma con su potencia de cortocircuito.', mando: { nombre: 'Potencia de cortocircuito de la red de 400 kV', campo: 'scc', rango: LIMITES.scc, texto: v => `${num(v)} MVA` } },
};
const reEnergizar = p => { p.cerrar = false; planta = estadoPlanta(); p.cerrar = true; };
const BOTONES = [
    { id: 'cerrar', visible: p => p.modo === 'energizar', pulsado: p => p.cerrar && !planta.disparo, texto: p => (p.cerrar && !planta.disparo ? 'Abrir el interruptor' : 'Cerrar el interruptor'), alTocar: p => { if (p.cerrar && !planta.disparo) p.cerrar = false; else reEnergizar(p); } },
    { id: 'restriccion', visible: p => p.modo === 'energizar', pulsado: p => !p.restriccion, texto: p => (p.restriccion ? 'Quitar el bloqueo' : 'Poner el bloqueo'), alTocar: p => { p.restriccion = !p.restriccion; if (p.cerrar) reEnergizar(p); } },
    { id: 'falla', visible: p => p.modo === 'falla', pulsado: p => p.falla, texto: p => (p.falla ? 'Quitar la falla' : 'Que caiga la falla'), alTocar: p => { p.falla = !p.falla; } },
    { id: 'dentro', visible: p => p.modo === 'falla', pulsado: p => p.dentro, texto: p => (p.dentro ? 'Falla adentro del banco' : 'Falla en la barra de 230 kV'), alTocar: p => { p.dentro = !p.dentro; } },
];
const ACCIONES = {
    plena: { texto: p => (p.s >= 1 ? `Regresar a ${num(DEF.s * 100)} %` : 'Llevarlo a plena carga'), hacer: (p, pag) => { p.s = p.s >= 1 ? DEF.s : 1; pag.invalidar(); pag.ponerMando(); } },
    sobre: { texto: p => (p.v > 100 ? 'Regresar a 400 kV' : 'Subir el voltaje 10 %'), hacer: (p, pag) => { p.v = p.v > 100 ? DEF.v : 110; p.f = DEF.f; pag.invalidar(); pag.ponerMando(); } },
    atraso: { texto: p => (p.s >= 1 && p.ang > 20 ? 'Regresar la carga' : 'Que caiga el voltaje'), hacer: (p, pag) => { const ya = p.s >= 1 && p.ang > 20; p.s = ya ? DEF.s : 1; p.ang = DEF.ang; pag.invalidar(); pag.ponerMando(); } },
    peor: { texto: () => 'Cerrar en el peor momento', hacer: (p, pag) => { p.alfa = 0; p.rem = CONEXION.remanente; p.restriccion = true; reEnergizar(p); pag.invalidar(); pag.ponerMando(); pag.rotular(); } },
    sinBloqueo: { texto: p => (p.restriccion ? 'Energizar sin el bloqueo' : 'Volver a poner el bloqueo'), hacer: (p, pag) => { p.restriccion = !p.restriccion; p.alfa = 0; p.rem = CONEXION.remanente; reEnergizar(p); pag.invalidar(); pag.ponerMando(); pag.rotular(); } },
    dentro: { texto: p => (p.falla && p.dentro ? 'Quitar la falla' : 'Una falla adentro del banco'), hacer: (p, pag) => { const ya = p.falla && p.dentro; p.falla = !ya; p.dentro = !ya; pag.invalidar(); pag.rotular(); } },
};

// ------------------------------------------------------------------ el tablero
const secciones = () => `
    ${seccionDiagrama('Lo que pasa en el banco')}
    ${seccionGrafica('b')}
    ${seccionGrafica('c')}
    ${seccionBarras()}
    ${seccionTabla('El banco de Santa Cruz', 'h-placa', 'Unidad AT421C, fase C, según una tesis de la UNAM.', 'h-tabla-texto')}
    ${seccionTabla('Lo que pide la CFE', 'h-norma', 'Especificación CFE K0000-06 y procedimiento CFE G0100-07.', 'h-tabla-texto')}
    ${seccionTabla('Lo que dice la ley', 'h-regla', 'Ley del Sector Eléctrico y su Reglamento.')}
    ${seccionColores(FLUIDOS, 'El banco es real; el acomodo, la escala y el interior no son los de la placa. Son de ejemplo: la curva del núcleo, las pérdidas del cobre, cuánto tarda en apagarse el golpe al energizar y el arranque de la diferencial. Las pérdidas del núcleo son una estimación con la prueba.', 'Colores de lo que corre')}
    ${seccionFuentes(FUENTES, [
        { para: 'La Red Eléctrica incluye los equipos de transformación; qué es la Red Nacional de Transmisión, quién la opera y que es área estratégica', titulo: 'Ley del Sector Eléctrico, arts. 3, 44 y 57, y su Reglamento, art. 2', nota: 'La Ley se publicó en el Diario Oficial de la Federación el 18 de marzo de 2025. Están en el acervo de este sitio' },
    ])}`;

function alPintarGraficas(L, pag) {
    const { $, pide, graficas } = pag;
    const m = pide.modo;
    graficas.b = null;
    graficas.c = null;
    if (m === 'relacion') {
        const lb = [
            { clase: 'h-s-actual', nombre: 'Lo que pide el núcleo', f: x => magnet(x / 100) * IN.alta },
            { clase: 'h-s-sin', nombre: 'Si el acero no se saturara', f: x => (x / 100) * I0 * IN.alta },
        ];
        $('#h-b-t').textContent = 'La curva del núcleo';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `Corriente de excitación (A del lado de 400 kV) según el flujo, en por ciento del normal. Al voltaje nominal son unos ${f2(I0 * IN.alta)} A; pasado el codo, cada poco de flujo pide mucha corriente. La norma pide probarlo hasta ${NORMA.pruebas[2]} %. Curva de ejemplo.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'La curva del núcleo', xMin: 0, xMax: 125, yMin: 0, yMax: 60, ticksX: [0, 25, 50, 75, 100, 125], ticksY: [0, 15, 30, 45, 60], etX: 'Flujo (V/Hz), % del normal', etY: 'A', refsX: [{ x: NORMA.pruebas[2], texto: `${NORMA.pruebas[2]} %` }], lineas: lb, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} % · ${lb.map(l => `${l.nombre}: ${f2(l.f(x))} A`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Flujo', 'Corriente', 'Veces la de 100 %', 'Pérdidas del núcleo'], [90, 100, 105, 110, 115, 120, 125].map(v => { const r = relacion({ v }); return [`${num(v)} %`, `${f2(r.iA)} A`, f1(r.veces), `${num(r.p0)} kW`]; }));
        const igual = Math.abs(L.v - 100) < 0.5;
        const lc = [
            ...(igual ? [] : [{ clase: 'h-s-actual', nombre: `Con ${num(L.v)} % de voltaje`, f: f => relacion({ v: L.v, f }).vhz }]),
            { clase: 'h-s-sin', nombre: 'Con 400 kV', f: f => relacion({ v: 100, f }).vhz },
            { clase: 'h-s-norma', nombre: `${NORMA.pruebas[2]} %: hasta donde se prueba`, f: () => NORMA.pruebas[2] },
        ];
        const series = lc.slice(0, -1);
        $('#h-c-t').textContent = 'El flujo según la frecuencia';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = 'Con el mismo voltaje, si la frecuencia baja el flujo sube: lo que cuenta es el voltaje entre la frecuencia (V/Hz). Si bajan juntos, el flujo no cambia.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'El flujo según la frecuencia', xMin: LIMITES.f[0], xMax: LIMITES.f[1], yMin: 80, yMax: 140, ticksX: [54, 56, 58, 60, 62], ticksY: [80, 100, 120, 140], etX: 'Frecuencia, Hz', etY: '% del flujo normal', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${f1(x)} Hz · ${series.map(l => `${l.nombre}: ${num(l.f(x))} %`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Frecuencia', ...series.map(l => l.nombre)], [54, 57, 60, 61, 63].map(f => [`${num(f)} Hz`, ...series.map(l => `${num(l.f(f))} %`)]));
    } else if (m === 'auto') {
        const lb = [
            { clase: 'h-s-flujo', nombre: 'Por el núcleo', f: a => parteNucleo(a) * 100 },
            { clase: 'h-s-cobre', nombre: 'Directo por el cobre', f: a => 100 - parteNucleo(a) * 100 },
        ];
        $('#h-b-t').textContent = 'Por dónde pasa la energía, según la relación';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `De cada 100 MVA, cuántos pasan por el núcleo: 1 − 1/a. Con 400 entre 230 (a = ${A_TXT}), ${num(parteNucleo() * 100)} de cada 100. Con relaciones cercanas a 2 o menores conviene; con relaciones grandes casi todo pasa por el núcleo y se pierde la ventaja.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Por dónde pasa la energía', xMin: 1, xMax: 6, yMin: 0, yMax: 100, ticksX: [1, 2, 3, 4, 5, 6], ticksY: [0, 25, 50, 75, 100], etX: 'Relación entre los voltajes (a)', etY: '% de la energía', refsX: [{ x: A, texto: '400/230' }], lineas: lb, fx: x => num(x), fy: y => num(y), punta: x => `a = ${f2(x)} · ${lb.map(l => `${l.nombre}: ${num(l.f(x))} %`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Voltajes', 'a', 'Por el núcleo', 'Por el cobre'], [[400, 230], [230, 115], [400, 115], [115, 34.5], [400, 20]].map(([h, b]) => [`${num(h)}/${num(b, b % 1 ? 1 : 0)} kV`, f2(h / b), `${num(parteNucleo(h / b) * 100)} %`, `${num(100 - parteNucleo(h / b) * 100)} %`]));
        const lc = [
            { clase: 'h-s-max', nombre: 'Lado de 230 kV', f: s => auto({ s }).Ib },
            { clase: 'h-s-actual', nombre: 'Devanado serie (lado de 400 kV)', f: s => auto({ s }).serie },
            { clase: 'h-s-sin', nombre: 'Devanado común', f: s => auto({ s }).comun },
        ];
        $('#h-c-t').textContent = 'La corriente de cada parte, según la carga';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Amperes por fase. Del lado de 230 kV salen ${num(IN.baja)} A a plena carga, pero por el devanado común pasan solo ${num(IN.baja - IN.alta)}: el resto llega directo del lado de 400 kV.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'La corriente de cada parte', xMin: 0, xMax: LIMITES.s[1], yMin: 0, yMax: 1100, ticksX: [0, 0.25, 0.5, 0.75, 1, 1.25], ticksY: [0, 250, 500, 750, 1000], etX: 'Carga', etY: 'A por fase', lineas: lc, fx: x => `${num(x * 100)} %`, fy: y => num(y), punta: x => `${num(x * 100)} % · ${lc.map(l => `${l.nombre}: ${num(l.f(x))} A`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Carga', ...lc.map(l => l.nombre)], [0.25, 0.5, 0.75, 1, 1.25].map(s => [`${num(s * 100)} %`, ...lc.map(l => `${num(l.f(s))} A`)]));
    } else if (m === 'carga') {
        const angs = [[0, 'Factor de potencia 1', 'h-s-sin'], [DEF.ang, '0.90 en atraso', 'h-s-max'], [-DEF.ang, '0.90 en adelanto', 'h-s-norma']];
        const otras = angs.filter(([a]) => Math.abs(a - L.ang) > 0.5);
        const lb = [
            { clase: 'h-s-actual', nombre: `Con ${fpTexto(L.ang)}`, f: s => carga({ s, ang: L.ang }).kV },
            ...otras.map(([a, n, c]) => ({ clase: c, nombre: n, f: s => carga({ s, ang: a }).kV })),
        ];
        $('#h-b-t').textContent = 'El voltaje en 230 kV, según la carga';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `Con la red de 400 kV fija. Con carga inductiva (en atraso) el voltaje cae; con carga capacitiva (en adelanto) sube. A plena carga y 0.90 en atraso cae ${f1(carga({ s: 1, ang: DEF.ang }).caida)} %: unos ${carga({ s: 1, ang: DEF.ang }).pasos} pasos del cambiador para corregirlo.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'El voltaje en 230 kV', xMin: 0, xMax: LIMITES.s[1], yMin: 210, yMax: 250, ticksX: [0, 0.25, 0.5, 0.75, 1, 1.25], ticksY: [210, 220, 230, 240, 250], etX: 'Carga', etY: 'kV', lineas: lb, fx: x => `${num(x * 100)} %`, fy: y => num(y), punta: x => `${num(x * 100)} % · ${lb.map(l => `${l.nombre}: ${f1(l.f(x))} kV`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Carga', ...lb.map(l => l.nombre)], [0.25, 0.5, 0.75, 1, 1.25].map(s => [`${num(s * 100)} %`, ...lb.map(l => `${f1(l.f(s))} kV`)]));
        const lc = [
            { clase: 'h-s-actual', nombre: `Con ${fpTexto(L.ang)}`, f: s => carga({ s, ang: L.ang }).eficiencia * 100 },
            ...(Math.abs(L.ang) > 0.5 ? [{ clase: 'h-s-sin', nombre: 'Factor de potencia 1', f: s => carga({ s, ang: 0 }).eficiencia * 100 }] : []),
        ];
        $('#h-c-t').textContent = 'Lo que sale de cada 100, según la carga';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Eficiencia. El núcleo pierde unos ${num(P0)} kW siempre que está energizado; el cobre, con el cuadrado de la corriente. Su mejor punto es donde se igualan, a ${num(L.mejor * 100)} % de carga.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'La eficiencia según la carga', xMin: 0.05, xMax: LIMITES.s[1], yMin: 99, yMax: 100, ticksX: [0.25, 0.5, 0.75, 1, 1.25], ticksY: [99, 99.25, 99.5, 99.75, 100], etX: 'Carga', etY: '%', lineas: lc, fx: x => `${num(x * 100)} %`, fy: y => f2(y), punta: x => `${num(x * 100)} % · ${lc.map(l => `${l.nombre}: ${f2(l.f(x))} %`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Carga', 'Núcleo', 'Cobre', 'Eficiencia'], [0.1, 0.25, 0.55, 0.75, 1, 1.25].map(s => { const c = carga({ s, ang: L.ang }); return [`${num(s * 100)} %`, `${num(c.p0)} kW`, `${num(c.pc)} kW`, `${f2(c.eficiencia * 100)} %`]; }));
    } else if (m === 'energizar') {
        const lb = [
            { clase: 'h-s-actual', nombre: 'Con este cierre', f: ms => corrienteEn(ms / 1000, L.alfa, L.rem) },
            { clase: 'h-s-sin', nombre: 'Cerrando en el máximo, sin flujo guardado', f: ms => corrienteEn(ms / 1000, 90, 0) },
            { clase: 'h-s-norma', nombre: 'Pico nominal', f: () => 1 },
        ];
        $('#h-b-t').textContent = 'La corriente en los primeros 100 ms';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `Veces el pico de la corriente nominal (${num(IN.alta)} A del lado de 400 kV). Seis ciclos de 60 Hz. El golpe va casi todo hacia un lado: por eso lleva tanta segunda armónica.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'La corriente en los primeros 100 ms', xMin: 0, xMax: 100, yMin: -6, yMax: 6, ticksX: [0, 25, 50, 75, 100], ticksY: [-6, -3, 0, 3, 6], etX: 'Milisegundos', etY: 'veces', lineas: lb, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} ms · ${lb.slice(0, 2).map(l => `${l.nombre}: ${f1(l.f(x))}`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Momento', 'Pico', 'Segunda armónica', 'Diferencial'], [[0, L.rem], [45, L.rem], [90, L.rem], [135, L.rem], [180, L.rem], [90, 0]].map(([a, r]) => { const e = energizar({ alfa: a, rem: r, restriccion: L.restriccion }); return [`${num(a)}°, ${remTexto(r)}`, `${f1(e.pico)} veces`, `${num(e.pct2)} %`, e.dispara ? 'dispara' : e.opera ? 'se bloquea' : 'no la ve']; }));
        const igual = Math.abs(L.rem) < 0.01;
        const lc = [
            ...(igual ? [] : [{ clase: 'h-s-actual', nombre: `Con ${remTexto(L.rem)} de flujo guardado`, f: a => energizar({ alfa: a, rem: L.rem }).pico }]),
            { clase: 'h-s-sin', nombre: 'Sin flujo guardado', f: a => energizar({ alfa: a, rem: 0 }).pico },
            { clase: 'h-s-norma', nombre: `Peor caso según Pozueta: de ${CONEXION.veces[0]} a ${CONEXION.veces[1]} veces`, f: () => CONEXION.veces[0] },
        ];
        const series = lc.slice(0, -1);
        $('#h-c-t').textContent = 'El golpe según el momento de cerrar';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = 'Pico de la corriente (veces el nominal) según el punto del ciclo en que cierra el interruptor: 0° es el voltaje en cero, 90° en su máximo. El flujo guardado cambia cuál es el mejor momento.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'El golpe según el momento de cerrar', xMin: 0, xMax: 180, yMin: 0, yMax: 7, ticksX: [0, 45, 90, 135, 180], ticksY: [0, 2, 4, 6], etX: 'Momento del ciclo, grados', etY: 'veces', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)}° · ${series.map(l => `${l.nombre}: ${f1(l.f(x))} veces`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Momento', ...series.map(l => l.nombre)], [0, 30, 60, 90, 120, 150, 180].map(a => [`${num(a)}°`, ...series.map(l => `${f1(l.f(a))} veces`)]));
    } else {
        const lb = [
            { clase: 'h-s-max', nombre: `Primer pico (× ${f2(NORMA.asimetria)})`, f: s => falla({ scc: s }).pico },
            { clase: 'h-s-actual', nombre: 'Corriente de falla', f: s => falla({ scc: s }).kA },
            { clase: 'h-s-sin', nombre: 'Con una red infinita', f: () => falla({}).kAsinRed },
        ];
        $('#h-b-t').textContent = 'La corriente de falla, según la red';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `kA que pasan por el banco hacia una falla en 230 kV. Aun con una red infinita, la impedancia del banco la deja en ${f1(falla({}).kAsinRed)} kA, ${f1(falla({}).sinRed)} veces la nominal. El primer pico es mayor por la asimetría (norma CFE K0000-06).`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'La corriente de falla', xMin: LIMITES.scc[0], xMax: LIMITES.scc[1], yMin: 0, yMax: 20, ticksX: [10000, 20000, 30000, 40000], ticksY: [0, 5, 10, 15, 20], etX: 'Potencia de cortocircuito de la red, MVA', etY: 'kA', refsX: [{ x: NORMA.diseno[1].MVA, texto: 'Diseño 420 kV' }], lineas: lb, fx: x => num(x / 1000) + ' mil', fy: y => num(y), punta: x => `${num(x)} MVA · ${lb.slice(0, 2).map(l => `${l.nombre}: ${f1(l.f(x))} kA`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Red', 'Falla', 'Primer pico', 'Fuerza'], [2000, 5000, 10000, 20000, 30000, 40000].map(s => { const r = falla({ scc: s }); return [`${num(s)} MVA`, `${f1(r.kA)} kA`, `${f1(r.pico)} kA`, `${num(r.fuerza)} veces`]; }));
        const lc = [
            { clase: 'h-s-actual', nombre: `Con ${num(L.scc)} MVA de red`, f: z => fallaConZ(z / 100, L.scc) },
            { clase: 'h-s-sin', nombre: 'Con una red infinita', f: z => fallaConZ(z / 100, 1e9) },
        ];
        $('#h-c-t').textContent = 'La falla según la impedancia del banco';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Con menos impedancia, más corriente de falla. El banco tiene ${f2(BANCO.z * 100)} %; la norma acepta ±${num(NORMA.zTol * 100)} % en un autotransformador. Más impedancia limita la falla pero hace caer más el voltaje con carga.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'La falla según la impedancia', xMin: 4, xMax: 20, yMin: 0, yMax: 20, ticksX: [4, 8, 12, 16, 20], ticksY: [0, 5, 10, 15, 20], etX: 'Impedancia del banco, %', etY: 'kA', refsX: [{ x: BANCO.z * 100, texto: 'Placa' }], lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${f1(x)} % · ${lc.map(l => `${l.nombre}: ${f1(l.f(x))} kA`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Impedancia', 'Falla', 'Fuerza'], [5, 8, BANCO.z * 100, 15, 20].map(z => { const r = falla({ scc: L.scc, z: z / 100 }); return [`${f2(z)} %`, `${f1(r.kA)} kA`, `${num(r.fuerza)} veces`]; }));
    }
}
function pintarBarras(L, pag) {
    const { $, pide } = pag;
    let filas;
    if (pide.modo === 'relacion') {
        filas = [
            { t: 'Flujo (V/Hz), % del normal', v: L.vhz / 100, activa: !L.probado, escala: 1.3 },
            { t: 'Prueba más alta, %', v: NORMA.pruebas[2] / 100, escala: 1.3 },
            { t: 'Pérdidas, % de las normales', v: L.p0 / P0, escala: 1.6 },
            { t: 'Corriente, veces la normal', v: L.veces / 100, activa: L.satura, escala: 0.5 },
        ];
        $('#h-d-t').textContent = 'El núcleo ahora';
        $('#h-d-pie').textContent = `La norma CFE K0000-06 pide medir sus pérdidas y su corriente de excitación a ${NORMA.pruebas.join(', ')} % del voltaje. Si el flujo sube por arriba de eso, la protección diferencial ve la quinta armónica (se bloquea con ${DIF.h5} %).`;
    } else if (pide.modo === 'auto') {
        filas = [
            { t: 'Directo por el cobre', v: 1 - L.parte, activa: true, escala: 1 },
            { t: 'Por el núcleo', v: L.parte, escala: 1 },
            { t: 'Corriente del común contra la de 230 kV', v: IN.baja > 0 ? (IN.baja - IN.alta) / IN.baja : 0, escala: 1 },
        ];
        $('#h-d-t').textContent = 'Cómo pasa la energía, de cada 100';
        $('#h-d-pie').textContent = `Un transformador de dos devanados movería todo por el núcleo: ${f2(L.veces)} veces más de lo que mueve este.`;
    } else if (pide.modo === 'carga') {
        filas = [
            { t: 'Corriente, de la nominal', v: L.i, activa: L.i > 1, escala: 1.3 },
            { t: 'Caída del voltaje', v: Math.max(0, L.caida) / 100, activa: L.caida > 5, escala: 0.1, d: 1 },
            { t: 'Pérdidas del cobre', v: L.pc / L.perd, escala: 1 },
            { t: 'Pérdidas del núcleo', v: L.p0 / L.perd, escala: 1 },
        ];
        $('#h-d-t').textContent = 'Con esta carga, de cada 100';
        $('#h-d-pie').textContent = L.ventiladores ? 'Pasa de 70 % de su corriente: los ventiladores están prendidos.' : 'Con esta carga basta el aire natural: los ventiladores están apagados.';
    } else if (pide.modo === 'energizar') {
        filas = [
            { t: 'Segunda armónica, %', v: L.pct2 / 100, activa: L.bloquea, escala: 1 },
            { t: 'Bloqueo, %', v: DIF.h2 / 100, escala: 1 },
            { t: `Golpe, % de las ${DIF.sinRestriccion} veces`, v: L.pico / DIF.sinRestriccion, activa: L.sinRestr, escala: 1 },
        ];
        $('#h-d-t').textContent = 'Lo que revisa la diferencial';
        $('#h-d-pie').textContent = `Con ${DIF.h2} % o más de segunda armónica se bloquea. Su parte sin restricción dispara con ${DIF.sinRestriccion} veces la nominal pase lo que pase; este golpe de ${f1(L.pico)} veces llega a ${num((L.pico / DIF.sinRestriccion) * 100)} de cada 100.`;
    } else {
        filas = [
            { t: 'La limita el banco', v: BANCO.z / (BANCO.z + L.zs), activa: true, escala: 1 },
            { t: 'La limita la red', v: L.zs / (BANCO.z + L.zs), escala: 1 },
            { t: `Falla, % de los ${NORMA.diseno[0].kA} kA de diseño`, v: L.kA / NORMA.diseno[0].kA, escala: 1 },
        ];
        $('#h-d-t').textContent = 'Quién limita la falla, de cada 100';
        $('#h-d-pie').textContent = `La fuerza en los devanados crece con el cuadrado de la corriente: ${num(L.fuerza)} veces la de plena carga. Debe aguantarla ${NORMA.falla.s} segundos sin que el cobre pase de ${NORMA.falla.cobre} °C.`;
    }
    $('#h-barras').innerHTML = barrasHTML(filas);
}
function alPintarFijas({ $ }) {
    $('#h-placa').innerHTML = tablaHTML(['Qué', 'Cuánto'], [
        ['Banco', `${BANCO.nombre}, Subestación ${BANCO.sub} (CFE)`],
        ['Unidades', `${BANCO.unidades} autotransformadores de una fase`],
        ['Potencia', `${BANCO.Su} MVA cada una; ${BANCO.S} MVA el banco`],
        ['Voltajes', `${num(BANCO.alta)}/${num(BANCO.baja)} kV`],
        ['Relación', `a = ${A_TXT}`],
        ['Impedancia', `${f2(BANCO.z * 100)} % (${f1(BANCO.z * ZBASE)} Ω del lado de 400 kV)`],
        ['Corriente nominal por fase', `${num(IN.alta)} A en 400 kV; ${num(IN.baja)} A en 230 kV`],
        ['Cambiador', `bajo carga; posición nominal ${BANCO.posicion}`],
        ['Prueba de excitación (fase C)', `${num(PRUEBA.kV)} kV; ${num(PRUEBA.mA, 3)} mA; ${num(PRUEBA.W, 3)} W`],
        ['Pérdidas del núcleo estimadas', `${num(P0)} kW el banco`],
    ]);
    $('#h-norma').innerHTML = tablaHTML(['Qué', 'Cuánto'], [
        ['Tolerancia de la impedancia (autotransformador)', `±${num(NORMA.zTol * 100)} %`],
        ['Aguantar una falla externa', `${NORMA.falla.s} s; cobre hasta ${NORMA.falla.cobre} °C`],
        ['Falla de diseño en 245 y 420 kV', `${NORMA.diseno[0].kA} kA`],
        ['Factor de asimetría (X/R = 14)', f2(NORMA.asimetria)],
        ['Subida de temperatura de los devanados', `${NORMA.subida.promedio} °C en promedio; ${NORMA.subida.caliente} °C en el punto más caliente`],
        ['Pruebas de excitación', `a ${NORMA.pruebas.join(', ')} % del voltaje`],
        ['Cambiador bajo carga', `±${NORMA.cambiador.banda} %: 16 pasos de 0.625 % o 10 de 1 %`],
        ['Diferencial: bloqueo por segunda armónica', `${DIF.h2} % (${DIF.h2Grupo} % en grupo con generador)`],
        ['Diferencial: bloqueo por quinta armónica', `${DIF.h5} %`],
        ['Diferencial sin restricción', `${DIF.sinRestriccion} veces la nominal`],
    ]);
    $('#h-regla').innerHTML = tablaHTML(['Qué', 'Dónde lo dice'], [
        ['La Red Eléctrica la forman líneas, subestaciones y equipos de transformación, compensación, protección y medición', 'Ley, art. 3, fracc. XL'],
        ['La Red Nacional de Transmisión lleva la energía a las Redes Generales de Distribución y a grandes usuarios', 'Ley, art. 3, fracc. XLI'],
        ['La Transportista es una Empresa Pública del Estado: la CFE', 'Ley, art. 3, fraccs. XX y LXIII'],
        ['La CFE opera sus redes con las instrucciones del CENACE, también para el mantenimiento', 'Ley, art. 44'],
        ['Transmitir energía eléctrica es un área estratégica exclusiva del Estado', 'Ley, art. 57'],
        ['Alta tensión es la de más de 35 kV', 'Reglamento, art. 2, fracc. II'],
    ]);
}
function alActualizar(L, pag) {
    const { pide, ponerCifra, ponerLecturas, nivel, graficas } = pag;
    pintarBarras(L, pag);
    ponerCifra('aT', { relacion: 'El voltaje y el flujo', auto: 'Por dónde pasa la energía', carga: 'El banco con carga', energizar: 'Al cerrar el interruptor', falla: 'La falla' }[pide.modo]);
    if (pide.modo === 'relacion') {
        const aviso = L.satura ? `Flujo en ${num(L.vhz)} %: el núcleo se satura y pide ${num(L.veces)} veces la corriente normal.` : !L.probado ? `Flujo en ${num(L.vhz)} %: pasa del ${NORMA.pruebas[2]} % con que se prueba.` : null;
        ponerLecturas([['Lado de 400 kV', `${num(L.kVa)} kV`, `${num(L.v)} % del nominal`], ['Lado de 230 kV', `${f1(L.kVb)} kV`, `÷ ${A_TXT}`], ['Frecuencia', `${f1(L.f)} Hz`, '60 es la nominal'], ['Flujo (V/Hz)', `${num(L.vhz)} %`, `se prueba hasta ${NORMA.pruebas[2]} %`], ['Corriente de excitación', `${f2(L.iA)} A`, `${f1(L.veces)} veces la normal`], ['Pérdidas del núcleo', `${num(L.p0)} kW`, 'el banco']], aviso);
        ponerCifra('hud', `${f1(L.kVb)} kV`);
        ponerCifra('hud2', `flujo ${num(L.vhz)} %`);
        graficas.b?.marcar(L.vhz, L.iA);
        graficas.c?.marcar(L.f, L.vhz);
        nivel(1, 'Flujo', clamp01(L.vhz / 125), `${num(L.vhz)} %`);
        nivel(2, 'Excitación', clamp01(L.iA / 60), `${f1(L.iA)} A`);
    } else if (pide.modo === 'auto') {
        ponerLecturas([['Pasa', `${num(L.S)} MVA`, `${num(L.s * 100)} % del banco`], ['Lado de 400 kV', `${num(L.Ia)} A`, 'por fase, por el serie'], ['Lado de 230 kV', `${num(L.Ib)} A`, 'por fase'], ['Devanado común', `${num(L.comun)} A`, 'la diferencia'], ['Por el núcleo', `${num(L.nucleo)} MVA`, `${num(L.parte * 100)} %`], ['Directo por el cobre', `${num(L.cobre)} MVA`, `${num(100 - L.parte * 100)} %`]], L.s > 1.005 ? 'Pasa de su potencia nominal: el cobre y el aceite se calientan de más.' : null);
        ponerCifra('hud', `${num(L.S)} MVA`);
        ponerCifra('hud2', `${num(L.parte * 100)} % por el núcleo`);
        graficas.b?.marcar(A, L.parte * 100);
        graficas.c?.marcar(L.s, L.comun);
        nivel(1, 'Carga', clamp01(L.s / 1.3), `${num(L.s * 100)} %`);
        nivel(2, 'Común', clamp01(L.comun / 1100), `${num(L.comun)} A`);
    } else if (pide.modo === 'carga') {
        const aviso = L.i > 1.02 ? 'Pasa de su corriente nominal: el cobre y el aceite se calientan de más.' : L.caida > 5 ? `El voltaje cae ${f1(L.caida)} %: el cambiador tendría que subir unos ${L.pasos} pasos.` : L.caida < -3 ? `Con carga capacitiva el voltaje sube ${f1(-L.caida)} %.` : null;
        ponerLecturas([['Lado de 230 kV', `${f1(L.kV)} kV`, L.caida >= 0 ? `cae ${f1(L.caida)} %` : `sube ${f1(-L.caida)} %`], ['Potencia', `${num(L.P)} MW`, `${num(L.Q)} MVAr`], ['Corriente', `${num(L.I)} A`, `${num(L.i * 100)} % de la nominal`], ['Pérdidas', `${num(L.perd)} kW`, `núcleo ${num(L.p0)}, cobre ${num(L.pc)}`], ['Eficiencia', `${f2(L.eficiencia * 100)} %`, 'sale de cada 100'], ['Ventiladores', L.ventiladores ? 'prendidos' : 'apagados', `arriba de ${num(EJ.ventiladores * 100)} %`]], aviso);
        ponerCifra('hud', `${f1(L.kV)} kV`);
        ponerCifra('hud2', `${f2(L.eficiencia * 100)} % de eficiencia`);
        graficas.b?.marcar(L.s, L.kV);
        graficas.c?.marcar(Math.max(0.05, L.s), L.eficiencia * 100);
        nivel(1, 'Corriente', clamp01(L.i / 1.3), `${num(L.i * 100)} %`);
        nivel(2, 'Caída', clamp01(Math.abs(L.caida) / 8), `${f1(L.caida)} %`);
    } else if (pide.modo === 'energizar') {
        const aviso = L.disparo ? 'La diferencial disparó: vio una corriente que entra y no sale, sin bloqueo. El banco quedó fuera.' : L.cerrado && L.opera && L.bloquea ? `Golpe de ${f1(L.pico)} veces: la diferencial lo vio, pero tiene ${num(L.pct2)} % de segunda armónica y se bloqueó.` : L.cerrado && L.sinTransitorio ? 'Cerró justo cuando el flujo que pide la red coincide con el que quedó: sin golpe.' : null;
        ponerLecturas([['Momento', `${num(L.alfa)}°`, alfaTexto(L.alfa).split('· ')[1] ?? 'del ciclo'], ['Flujo guardado', remTexto(L.rem), 'del normal'], ['Flujo máximo', `${f2(L.phiMax)} veces`, 'el normal'], ['Golpe', `${f1(L.pico)} veces`, `${num(L.A)} A de pico`], ['Segunda armónica', `${num(L.pct2)} %`, `se bloquea con ${DIF.h2} %`], ['Interruptor', L.disparo ? 'disparó' : L.cerrado ? 'cerrado' : 'abierto', L.restriccion ? 'con bloqueo' : 'sin bloqueo']], aviso);
        ponerCifra('hud', `${f1(L.pico)} veces`);
        ponerCifra('hud2', L.disparo ? 'disparó la diferencial' : L.cerrado ? `golpe al cerrar · ${num(Math.max(0, L.tc) * 1000)} ms` : 'si cierra ahora');
        graficas.b?.marcar(L.cerrado && L.tc >= 0 ? L.tc * 1000 : 0, L.cerrado && L.tc >= 0 ? L.ahora : 0);
        graficas.c?.marcar(L.alfa, L.pico);
        nivel(1, 'Golpe', clamp01(L.pico / 7), `${f1(L.pico)} veces`);
        nivel(2, '2.ª armónica', clamp01(L.pct2 / 60), `${num(L.pct2)} %`);
    } else {
        const aviso = !L.hay ? null : L.dentro ? 'Falla adentro: la diferencial ve corriente que entra y no sale, y el Buchholz siente el golpe del aceite. Abren los interruptores.' : 'Falla afuera: la corriente que entra es la que sale, así que la diferencial no dispara; la libra la protección de la línea de 230 kV.';
        ponerLecturas([['Red de 400 kV', `${num(L.scc)} MVA`, `${f2(L.zs * 100)} % sobre ${BANCO.S} MVA`], ['Falla en 230 kV', `${f1(L.kA)} kA`, L.dentro ? 'si cae afuera' : `${f1(L.i)} veces la nominal`], ['Primer pico', `${f1(L.pico)} kA`, `× ${f2(NORMA.asimetria)}`], ['Del lado de 400 kV', `${f1(L.kAalta)} kA`, 'por fase'], ['Fuerza en los devanados', `${num(L.fuerza)} veces`, 'la de plena carga'], ['Diferencial', L.hay && L.dentro ? 'dispara' : 'no dispara', L.dentro ? 'falla adentro' : 'falla afuera']], aviso);
        ponerCifra('hud', `${f1(L.kA)} kA`);
        ponerCifra('hud2', `${num(L.fuerza)} veces la fuerza`);
        graficas.b?.marcar(L.scc, L.kA);
        graficas.c?.marcar(BANCO.z * 100, L.kA);
        nivel(1, 'Falla', clamp01(L.i / 10), `${f1(L.i)} veces`);
        nivel(2, 'Fuerza', clamp01(L.fuerza / 85), `${num(L.fuerza)} veces`);
    }
}

// ------------------------------------------------------------------ la subestación
const PIDE0 = { v: DEF.v, f: DEF.f, s: DEF.s, ang: DEF.ang, alfa: DEF.alfa, rem: DEF.rem, scc: DEF.scc, cerrar: false, restriccion: true, falla: false, dentro: false };
crearPagina({
    figura: FIGURA,
    fichas: FICHAS,
    vistas: VISTAS,
    modos: MODOS,
    botones: BOTONES,
    acciones: ACCIONES,
    modo0: 'auto',
    pide: { ...PIDE0 },
    general: { Lx: 17.6, Lz: 6.8, alto: 4.8, mira: [0, 1.9, 0], az: 18, el: 22, azVertical: 14, elVertical: 30 },
    etiquetas: { lienzo: 'Banco de autotransformadores en 3D: arrastra para girarlo, toca un punto para conocerlo', modos: 'Qué ver en el transformador', puntos: 'Puntos clave del transformador', desarmar: 'Desarmar el transformador', lecturas: 'Lo que mide el banco' },
    textoFinal: 'Toca cualquier punto para volver a verlo. Sube el voltaje en «El voltaje», mira las corrientes en «Autotransformador», cárgalo en «Con carga», ciérralo en «Al energizarlo» o haz caer «Una falla».',
    colores: { guindaSuave: '#f3d4de', claro: '#ffffff' },
    crearDiagrama,
    secciones,
    escena: (renderer, scene, { movil, oscuro }) => {
        const M = materiales(P_PLANTA);
        const est = escenario(renderer, scene, M, { movil, oscuro });
        return { planta: construir(M, P_PLANTA, { movil, oscuro }), est };
    },
    alCambiarModo: (p) => {
        Object.assign(p, PIDE0);
        planta = estadoPlanta();
    },
    alCuadro: ({ dt, pide }) => {
        planta = pasoPlanta(planta, { modo: pide.modo, cerrar: pide.cerrar, alfa: pide.alfa, rem: pide.rem, restriccion: pide.restriccion, falla: pide.falla }, dt);
    },
    poseDe: ({ pide, ve, encendido, t, dt, camara }) => pose({ modo: pide.modo, planta, v: pide.v, f: pide.f, s: pide.s, ang: pide.ang, alfa: pide.alfa, rem: pide.rem, restriccion: pide.restriccion, scc: pide.scc, dentro: pide.dentro, falla: pide.falla, noche: ve.noche, adentro: ve.adentro, desarme: ve.desarme, encendido, t, dt, camara }),
    firma: p => [p.modo, Math.round(p.v), Math.round(p.f * 10), Math.round(p.s * 100), Math.round(p.ang), Math.round(p.alfa), Math.round(p.rem * 100), Math.round(p.scc / 100), p.cerrar, p.restriccion, p.falla, p.dentro],
    alPintarFijas,
    alPintarGraficas,
    alActualizar,
    prueba: p => ({ v: Math.round(p.v), f: +p.f.toFixed(1), s: +p.s.toFixed(2), ang: +p.ang.toFixed(1), alfa: Math.round(p.alfa), rem: +p.rem.toFixed(2), scc: Math.round(p.scc), cerrar: p.cerrar, restriccion: p.restriccion, falla: p.falla, dentro: p.dentro, cerrado: planta.cerrado, disparo: planta.disparo, tc: +planta.tc.toFixed(3) }),
});
