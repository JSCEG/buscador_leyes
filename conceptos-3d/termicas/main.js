// «Centrales térmicas», en 3D y con el formato Búho de «¿Cómo funciona?». Las que queman combustible sin ser de ciclo combinado: una
// central de vapor que quema carbón o combustóleo, una turbogás para las horas pico y una central de motores de combustión interna
// en el sistema aislado de Baja California Sur. Los equipos se modelan en Blender (blender/equipos.py → equipos.glb).
// Cuatro formas de verlo: la unidad de vapor con su combustible, cuánto tarda cada una en arrancar, cuánto cuesta cada MWh y la red
// aislada. Se arma con: node scripts/build-blender.mjs termicas && node scripts/build-conceptos-3d.mjs termicas
//
// Lo que se repite entre las plantas con física está en conceptos-3d/planta-comun/.
import { clamp01, num } from '../planta-comun/ayudas.js';
import { leerGlb } from '../planta-comun/glb.js';
import { barrasHTML, leyenda, pintarGrafica, seccionBarras, seccionColores, seccionDiagrama, seccionFuentes, seccionGrafica, seccionTabla, tablaHTML } from '../planta-comun/graficas.js';
import { crearPagina } from '../planta-comun/pagina.js';
import { AGUA, AZUFRE_NOM016, BCS, COMBUSTIBLES, DEF, EFICIENCIAS, FACTOR_SEN, FLUIDOS, IEPS, LIMITES, MARGEN, NACIONAL, NOM085, OPCIONES, PARTES as PARTES_M, PETACALCO, PRECIOS, RETIROS, TECNO, UNIDADES, costo, eficiencia, estadoPlanta, minutosPlena, modoAislado, pasoPlanta, porMWh, potenciaArranque, pose, unidadVapor } from './modelo.js';
import { P_PLANTA, construir, escenario, materiales } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';
import EQUIPOS from './equipos.glb';

const FIGURA = 'termicas';
const f1 = x => num(x, 1);
const f2 = x => num(x, 2);
const pct = x => `${num(x * 100)} %`;
const NOMBRE_COMB = { carbon: 'carbón', combustoleo: 'combustóleo', gas: 'gas natural' };
const SIGUIENTE_COMB = { carbon: 'combustoleo', combustoleo: 'gas', gas: 'carbon' };
const PLENA = { carbon: unidadVapor({ comb: 'carbon' }), combustoleo: unidadVapor({ comb: 'combustoleo' }), gas: unidadVapor({ comb: 'gas' }) };
const horas = m => (m >= 90 ? `${f1(m / 60)} horas` : `${num(m)} minutos`);
const fp = tec => NACIONAL.gwh[tec] / ((NACIONAL.mw[tec] * NACIONAL.horas2024) / 1000);

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'patio', nombre: 'Patio de carbón', modo: 'vapor', accion: 'carbon', eq: `${num(PLENA.carbon.th)} t de carbón por hora`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 19h18l-5-8-3 4-3-6z"/>',
        texto: `El carbón llega importado y se apila al aire libre; Petacalco, en Guerrero, tiene su propia terminal. La apiladora-recuperadora lo acomoda y lo vuelve a tomar con su rueda. Una unidad de ${num(UNIDADES.vapor)} MW quema unas ${num(PLENA.carbon.th)} toneladas por hora.` },
    { parte: 'combustoleo', nombre: 'Tanques de combustóleo', modo: 'vapor', accion: 'combustoleo', eq: 'Se calienta para que fluya', recorrido: { noche: false, adentro: false },
        icono: '<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v11c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6"/>',
        texto: `Lo más pesado que sale de una refinería: tan espeso que se calienta para que fluya. La norma le permite hasta ${f1(AZUFRE_NOM016.tope * 100)} % de azufre: sin un equipo que lo quite, cada MWh suelta unos ${num(PLENA.combustoleo.so2mwh)} kg de dióxido de azufre.` },
    { parte: 'molinos', nombre: 'Tolvas y molinos', modo: 'vapor', abrir: true, accion: 'carbon', eq: 'Lo vuelven polvo', recorrido: { noche: false, adentro: true },
        icono: '<path d="M6 3h12l-3 7H9z"/><circle cx="12" cy="16" r="4"/>',
        texto: 'El carbón baja de las tolvas a los molinos, que lo muelen hasta dejarlo como talco. El aire caliente lo sopla a los quemadores y arde suspendido en el hogar, casi como un gas.' },
    { parte: 'caldera', nombre: 'Caldera', modo: 'vapor', abrir: true, accion: 'carga50', eq: `${num(UNIDADES.vapor)} MW de ejemplo`, recorrido: { noche: false, adentro: true },
        icono: '<rect x="6" y="3" width="12" height="18" rx="1.5"/><path d="M9 3v18M12 3v18M15 3v18"/>',
        texto: `Adentro, el fuego calienta paredes hechas de tubos llenos de agua. El agua hierve, el vapor se junta en el domo de arriba y los sobrecalentadores lo calientan todavía más. Petacalco tiene ${num(PETACALCO.duales)} unidades duales de ${num(UNIDADES.vapor)} MW, que queman carbón o combustóleo.` },
    { parte: 'precipitador', nombre: 'Filtro de cenizas', modo: 'vapor', abrir: true, accion: 'carbon', eq: `${f1(PLENA.carbon.cenizasTh)} t de ceniza por hora`, recorrido: { noche: false, adentro: true },
        icono: '<rect x="4" y="5" width="16" height="10" rx="1"/><path d="M8 15l2 4h4l2-4M8 5v10M12 5v10M16 5v10"/>',
        texto: 'Un precipitador electrostático: carga con electricidad la ceniza de los gases, que se pega a placas de metal y cae a las tolvas. Atrapa más de 99 de cada 100 partículas finas. La NOM-085 fija cuánto puede salir por la chimenea.' },
    { parte: 'chimenea', nombre: 'Chimenea', modo: 'costo', accion: 'gas', eq: `${f2(PLENA.carbon.co2mwh)} t de CO2 por MWh con carbón`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M9 21V7h6v14M8 7h8M11 4c0-1 2-1 2-2"/>',
        texto: `Por aquí salen los gases. Cada MWh suelta unas ${f2(PLENA.carbon.co2mwh)} t de CO2 con carbón, ${f2(PLENA.combustoleo.co2mwh)} con combustóleo y ${f2(PLENA.gas.co2mwh)} con gas. El promedio de la red mexicana en 2024 fue de ${f2(FACTOR_SEN[2024])}.` },
    { parte: 'turbina', nombre: 'Turbina de vapor', modo: 'vapor', abrir: true, accion: 'carga50', eq: 'Alta presión y dos de baja', recorrido: { noche: false, adentro: true },
        icono: '<path d="M3 9l5-3v12l-5-3zM8 7h10v10H8"/><path d="M18 9l3 1v4l-3 1"/>',
        texto: `El vapor empuja la turbina de alta presión y luego las dos de baja, más grandes porque el vapor se expande. Todas giran con el generador. Aprovecha unas ${num(eficiencia('vapor', 'carbon') * 100)} de cada 100 partes del combustible; la CFE dice que su vapor ronda 30.` },
    { parte: 'generador', nombre: 'Generador', modo: 'arranque', abrir: true, accion: 'frio', eq: `${num(UNIDADES.vapor)} MW`, recorrido: { noche: false, adentro: true },
        icono: '<circle cx="12" cy="12" r="7"/><path d="M9 12h6M12 9v6"/>',
        texto: `Convierte el giro en electricidad. Una unidad de vapor tarda en arrancar: en el modelo, en caliente llega a plena carga en ${horas(minutosPlena('vapor'))} y en frío, en ${horas(minutosPlena('vapor', true))}.` },
    { parte: 'condensador', nombre: 'Condensador y agua de mar', modo: 'vapor', abrir: true, accion: 'carga50', eq: `${num(PLENA.carbon.marM3s)} m³ de agua por segundo`, recorrido: { noche: false, adentro: true },
        icono: '<path d="M3 17c2 0 2-2 4.5-2S10 17 12 17s2-2 4.5-2S19 17 21 17"/><rect x="6" y="5" width="12" height="7" rx="2"/>',
        texto: `Aquí el vapor que sale de la turbina se vuelve agua, enfriado con agua de mar que regresa unos ${num(AGUA.dT)} °C más caliente. Ahí se va más de la mitad de la energía del combustible: Petacalco usa 99 m³ por segundo.` },
    { parte: 'trafo', nombre: 'Transformador elevador', modo: 'costo', accion: 'noche', eq: 'Sube el voltaje', recorrido: { noche: false, adentro: false },
        icono: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
        texto: 'Sube el voltaje que sale del generador para mandar la electricidad lejos con menos pérdidas, por la Red Nacional de Transmisión (RNT).' },
    { parte: 'turbogas', nombre: 'Turbogás', modo: 'arranque', abrir: true, accion: 'arrancar', eq: `Plena carga en ${horas(minutosPlena('turbogas'))}`, recorrido: { noche: false, adentro: true },
        icono: '<path d="M3 9l5-3v12l-5-3zM8 7h10v10H8"/><path d="M18 9h3M18 15h3"/>',
        texto: `Una turbina de gas sola, sin recuperar el calor de sus gases. Aprovecha menos el combustible, pero llega a plena carga en minutos: por eso cubre las horas pico. La CFE usa turbinas aeroderivadas en Mexicali para el verano. En 2024 el país tenía ${num(NACIONAL.mw.turbogas)} MW.` },
    { parte: 'motores', nombre: 'Motores de combustión interna', modo: 'aislado', abrir: true, accion: 'pico', eq: `${num(NACIONAL.mw.combustionInterna)} MW en el país`, recorrido: { noche: false, adentro: true },
        icono: '<rect x="4" y="8" width="12" height="9" rx="1"/><path d="M7 8V5h6v3M16 11h4v3h-4"/>',
        texto: `Motores lentos y enormes, como los de un barco, que queman combustóleo. Arrancan en minutos y en 2024 trabajaron ${num(fp('combustionInterna') * 100)} % del tiempo. La CCI Baja California Sur I, en La Paz, tiene cuatro de ${num(Math.min(...UNIDADES.motores))} a ${num(Math.max(...UNIDADES.motores))} MW.` },
    { parte: 'subestacion', nombre: 'Subestación y RNT', modo: 'costo', accion: 'desarme', eq: 'A la Red Nacional de Transmisión', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 20h16M7 20V8h10v12M7 12h10"/>',
        texto: 'Junta la electricidad de las unidades y la sube a la Red Nacional de Transmisión (RNT). Las Redes Generales de Distribución (RGD) la llevan después a las casas y negocios.' },
    { parte: 'cenace', nombre: 'CENACE', modo: 'costo', accion: 'gas', eq: 'Despacha por costo', recorrido: { noche: false, adentro: false },
        icono: '<rect x="3" y="5" width="18" height="11" rx="1.5"/><path d="M8 20h8M12 16v4M7 12l3-3 2 2 4-4"/>',
        texto: 'El Centro Nacional de Control de Energía decide qué centrales operan, empezando por las de menor costo variable (LSE, arts. 117 y 120). Quien va a retirar una central debe avisarle, y si hace falta para la confiabilidad puede pedir que siga disponible (art. 155).' },
];
const VISTAS = Object.fromEntries(PARTES_M.map(p => [p.id, p.vista]));
let planta = estadoPlanta();
const relojArranque = { texto: 'el arranque', avanzar: (p, dt) => { p.minuto = Math.min(LIMITES.minuto[1], p.minuto + dt * 40); return p.minuto >= LIMITES.minuto[1]; }, alSeguir: p => { if (p.minuto >= LIMITES.minuto[1]) p.minuto = 0; } };
const relojDia = { texto: 'el día', avanzar: (p, dt) => { p.hora = (p.hora + dt * 1.2) % 24; return false; }, alSeguir: () => {} };
const MODOS = {
    vapor: { nombre: 'La central de vapor', corto: 'Vapor', resumen: 'El combustible calienta agua hasta volverla vapor, que mueve una turbina. Cambia la carga y el combustible: mira cuánto se aprovecha, cuánto se va al mar y cuánto CO2 sale.', aclara: `Unidad de ${num(UNIDADES.vapor)} MW, como las duales de Petacalco. Régimen térmico probado y CO2 de cada combustible de la EIA; carbón importado con ${f1(COMBUSTIBLES.carbon.azufre * 100)} % de azufre (CFE) y combustóleo con el tope de la norma, ${f1(AZUFRE_NOM016.tope * 100)} %. Lo que sale por la chimenea y la carga mínima de ${pct(TECNO.vapor.minimo)} son de ejemplo.`, mando: { nombre: 'Carga', campo: 'carga', rango: LIMITES.carga, texto: v => pct(v) } },
    arranque: { nombre: 'Cuánto tarda en arrancar', corto: 'Arranque', resumen: 'Cuando la demanda sube de golpe, no todas pueden responder igual. Mira cuánto tarda cada máquina desde la orden de arrancar hasta su plena carga.', aclara: `Tiempos y rampas típicos de cada tecnología (Agora Energiewende, la agencia danesa de energía y Wärtsilä), no de una central en particular. Unidad de vapor de ${num(UNIDADES.vapor)} MW, turbogás de ${num(UNIDADES.turbogas.reduce((s, x) => s + x, 0))} MW (de ejemplo) y los motores de la CCI Baja California Sur I, ${num(UNIDADES.motores.reduce((s, x) => s + x, 0))} MW.`, mando: { nombre: 'Minutos desde la orden', campo: 'minuto', rango: LIMITES.minuto, texto: v => horas(v) }, reloj: relojArranque },
    costo: { nombre: 'Cuánto cuesta cada MWh', corto: 'Costo', resumen: 'El CENACE despacha primero lo que cuesta menos producir. El costo variable depende de cuánto combustible gasta cada máquina y de su precio. Mueve el precio del gas.', aclara: 'Combustóleo y diésel: lo que pagó la CFE en 2024. Carbón: lo que gastó la CFE en carbón entre lo que quemó (cálculo propio). Gas: Henry Hub 2025, sin transporte. Solo el combustible, sin mantenimiento ni inversión. El impuesto al carbono es el IEPS de 2026.', mando: { nombre: 'Precio del gas', campo: 'gas', rango: LIMITES.gas, texto: v => `${f2(v)} USD por millón de BTU` } },
    aislado: { nombre: 'Una red aislada', corto: 'Aislada', resumen: 'Baja California Sur opera como un sistema aparte del interconectado nacional. Sin vecinos que la ayuden si falla una central, necesita más reserva: el PLADESE le pide 35 %.', aclara: `Demanda máxima de 2024 del PLADESE (${num(BCS.pico2024)} MW) y su crecimiento de ${f1(BCS.crecePico * 100)} % al año. La forma del día es de ejemplo.`, mando: { nombre: 'Hora', campo: 'hora', rango: LIMITES.hora, texto: v => `${Math.floor(v)}:00` }, mando2: { nombre: 'Año', campo: 'anio', rango: LIMITES.anio, texto: v => String(Math.round(v)) }, reloj: relojDia },
};
const BOTONES = [
    { id: 'comb', visible: p => p.modo === 'vapor', pulsado: p => p.comb !== 'carbon', texto: p => `Combustible: ${NOMBRE_COMB[p.comb]}`, alTocar: p => { p.comb = SIGUIENTE_COMB[p.comb]; } },
    { id: 'frio', visible: p => p.modo === 'arranque', pulsado: p => p.frio, texto: p => (p.frio ? 'Arranque en frío' : 'Arranque en caliente'), alTocar: p => { p.frio = !p.frio; p.minuto = 0; } },
];
const ACCIONES = {
    carbon: { texto: p => (p.comb === 'carbon' ? 'Ver con combustóleo' : 'Ver con carbón'), hacer: (p, pag) => { p.comb = p.comb === 'carbon' ? 'combustoleo' : 'carbon'; pag.invalidar(); pag.ponerMando(); } },
    combustoleo: { texto: p => (p.comb === 'combustoleo' ? 'Ver con gas' : 'Ver con combustóleo'), hacer: (p, pag) => { p.comb = p.comb === 'combustoleo' ? 'gas' : 'combustoleo'; pag.invalidar(); pag.ponerMando(); } },
    gas: { texto: p => (p.gas >= 8 ? `Gas a ${f2(PRECIOS.gas)} dólares` : 'Gas a 9 dólares'), hacer: (p, pag) => { p.gas = p.gas >= 8 ? PRECIOS.gas : 9; pag.invalidar(); pag.ponerMando(); } },
    carga50: { texto: p => (p.carga <= 0.55 ? 'Ver a plena carga' : 'Ver a media carga'), hacer: (p, pag) => { p.carga = p.carga <= 0.55 ? 1 : 0.5; pag.invalidar(); pag.ponerMando(); } },
    frio: { texto: p => (p.frio ? 'Arranque en caliente' : 'Arranque en frío'), hacer: (p, pag) => { p.frio = !p.frio; p.minuto = 0; pag.invalidar(); pag.ponerMando(); } },
    arrancar: { texto: () => 'Dar la orden de arrancar', hacer: (p, pag) => { p.minuto = 0; p.corre = true; pag.invalidar(); pag.ponerMando(); } },
    pico: { texto: p => (p.anio >= 2039 ? 'Ver 2024' : 'Ver 2039'), hacer: (p, pag) => { p.anio = p.anio >= 2039 ? 2024 : 2039; pag.invalidar(); pag.ponerMando(); } },
};

// ------------------------------------------------------------------ el tablero
const secciones = () => `
    ${seccionDiagrama('La central de vapor')}
    ${seccionGrafica('b')}
    ${seccionGrafica('c')}
    ${seccionBarras()}
    ${seccionTabla('Las térmicas del país en 2024', 'h-pais', 'SENER, PLADESE 2025-2039, tablas 2.1 y 2.2.', 'h-tabla-texto')}
    ${seccionTabla('Lo que se va a sustituir o retirar', 'h-retiros', 'SENER, PLADESE 2025-2039, capítulos 3 y 4 y tabla A1.8 (las candidatas no tienen año).', 'h-tabla-texto')}
    ${seccionTabla('Lo que sale por la chimenea', 'h-normas', 'NOM-085-SEMARNAT-2011, tabla 1: calderas de más de 530 GJ/h con combustible sólido o líquido. ppm en volumen, base seca, 5 % de oxígeno.')}
    ${seccionTabla('Lo que dice la ley', 'h-regla', 'Ley del Sector Eléctrico.')}
    ${seccionColores(FLUIDOS, 'La capacidad, la generación, los precios y las reglas son reales; las unidades de la figura, sus eficiencias, sus tiempos de arranque y la forma del día son de ejemplo.', 'Colores de lo que corre')}
    ${seccionFuentes(FUENTES, [
        { para: 'Qué son las Energías Limpias (el carbón, el combustóleo, el diésel y la turbogás no están en la lista), el despacho por costo, el aviso de retiro al CENACE y que una central necesaria para la confiabilidad siga disponible', titulo: 'Ley del Sector Eléctrico, arts. 3, 22, 79, 81, 117, 120 y 155', nota: 'Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio' },
    ])}`;

const CARGA_X = { xMin: 30, xMax: 100, ticksX: [30, 50, 70, 100], etX: 'Carga, %', fx: x => num(x) };
const MIN_X = { xMin: 0, xMax: 600, ticksX: [0, 120, 240, 360, 480, 600], etX: 'Minutos desde la orden', fx: x => (x >= 60 ? `${num(x / 60)} h` : num(x)) };
const GAS_X = { xMin: 2, xMax: 12, ticksX: [2, 4, 6, 8, 10, 12], etX: 'Gas, USD por millón de BTU', fx: x => num(x) };
const HORA_X = { xMin: 0, xMax: 24, ticksX: [0, 6, 12, 18, 24], etX: 'Hora', fx: x => num(x) };
const CLASE = { carbon: 'h-s-actual', combustoleo: 'h-s-cafe', gas: 'h-s-azul' };

function alPintarGraficas(L, pag) {
    const { $, pide, graficas } = pag;
    const m = pide.modo;
    graficas.b = null;
    graficas.c = null;
    if (m === 'vapor') {
        const lb = ['carbon', 'combustoleo', 'gas'].map(c => ({ clase: CLASE[c], nombre: NOMBRE_COMB[c][0].toUpperCase() + NOMBRE_COMB[c].slice(1), f: x => 100 * eficiencia('vapor', c, Math.max(x / 100, TECNO.vapor.minimo)) }));
        $('#h-b-t').textContent = 'Lo que se aprovecha';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `De cada 100 partes de la energía del combustible, cuántas salen como electricidad. A media carga se aprovecha menos. Una unidad nueva de diseño llega a ${f1(EFICIENCIAS.copar.vapor350 * 100)}; la CFE dice que su vapor convencional ronda ${num(EFICIENCIAS.cfeVapor * 100)}.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Lo que se aprovecha', ...CARGA_X, yMin: 28, yMax: 36, ticksY: [28, 30, 32, 34, 36], etY: 'de cada 100', lineas: lb, fy: y => num(y), punta: x => `${num(x)} % · ${lb.map(s => `${s.nombre.toLowerCase()} ${f1(s.f(x))}`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Carga', 'Carbón', 'Combustóleo', 'Gas'], [0.4, 0.5, 0.7, 0.85, 1].map(k => [pct(k), ...['carbon', 'combustoleo', 'gas'].map(c => `${f1(eficiencia('vapor', c, k) * 100)} %`)]));
        const lc = ['carbon', 'combustoleo', 'gas'].map(c => ({ clase: CLASE[c], nombre: NOMBRE_COMB[c][0].toUpperCase() + NOMBRE_COMB[c].slice(1), f: x => porMWh('vapor', c, Math.max(x / 100, TECNO.vapor.minimo)).co2 })).concat([{ clase: 'h-s-norma', nombre: 'Promedio de la red 2024', f: () => FACTOR_SEN[2024] }]);
        $('#h-c-t').textContent = 'El CO2 de cada MWh';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Toneladas de CO2 por MWh. El carbón suelta casi el doble que el gas. La raya es el promedio de toda la red mexicana en 2024: ${f2(FACTOR_SEN[2024])}.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'El CO2 de cada MWh', ...CARGA_X, yMin: 0, yMax: 1.2, ticksY: [0, 0.3, 0.6, 0.9, 1.2], etY: 't por MWh', lineas: lc, fy: y => f1(y), punta: x => `${num(x)} % · ${lc.slice(0, 3).map(s => `${s.nombre.toLowerCase()} ${f2(s.f(x))}`).join(' · ')}` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Combustible', 'CO2 por MWh', 'SO2 por MWh', 'Ceniza'], ['carbon', 'combustoleo', 'gas'].map(c => { const u = PLENA[c]; return [NOMBRE_COMB[c], `${f2(u.co2mwh)} t`, `${f1(u.so2mwh)} kg`, `${f1(u.cenizasTh)} t/h`]; }));
    } else if (m === 'arranque') {
        const ids = [['vapor', 'Vapor'], ['turbogas', 'Turbogás'], ['motores', 'Motores']];
        const lb = ids.map(([id, n], i) => ({ clase: ['h-s-actual', 'h-s-azul', 'h-s-cafe'][i], nombre: n, f: x => 100 * potenciaArranque(id, x, L.frio) }));
        $('#h-b-t').textContent = 'De la orden a plena carga';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `De cada 100 de su capacidad, cuánto da cada una después de la orden de arrancar, ${L.frio ? 'en frío' : 'en caliente'}. La de vapor primero calienta la caldera y la turbina; las otras empiezan casi de inmediato.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'De la orden a plena carga', ...MIN_X, yMin: 0, yMax: 100, ticksY: [0, 25, 50, 75, 100], etY: '% de su capacidad', lineas: lb, fy: y => num(y), punta: x => `${horas(x)} · ${lb.map(s => `${s.nombre.toLowerCase()} ${num(s.f(x))} %`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Máquina', 'Carga mínima', 'Plena, en caliente', 'Plena, en frío'], ids.map(([id, n]) => { const T = TECNO[id]; return [n, pct(T.minimo), horas(minutosPlena(id)), horas(minutosPlena(id, true))]; }));
        const lc = [{ clase: 'h-s-actual', nombre: 'Lo que trabajó cada una en 2024', puntos: [['convencional', 1], ['carbon', 2], ['turbogas', 3], ['combustionInterna', 4]].map(([k, x]) => [x, 100 * fp(k)]) }];
        $('#h-c-t').textContent = 'Cuánto trabajaron en 2024';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = 'De cada 100 horas del año, cuántas habrían trabajado a plena carga: 1 vapor convencional, 2 carbón, 3 turbogás, 4 combustión interna. Cálculo propio con la capacidad y la generación del PLADESE.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Cuánto trabajaron en 2024', xMin: 0.5, xMax: 4.5, ticksX: [1, 2, 3, 4], etX: 'Tecnología', fx: x => ['', 'Vapor', 'Carbón', 'Turbogás', 'Motores'][Math.round(x)] ?? '', yMin: 0, yMax: 80, ticksY: [0, 20, 40, 60, 80], etY: 'de cada 100 horas', quebradas: lc, fy: y => num(y), punta: x => { const k = ['', 'convencional', 'carbon', 'turbogas', 'combustionInterna'][Math.round(x)]; return k ? `${num(100 * fp(k))} de cada 100 horas` : ''; } });
        $('#h-tabla-c').innerHTML = tablaHTML(['Tecnología', 'MW', 'GWh', 'Trabajó'], [['Vapor convencional', 'convencional'], ['Carboeléctrica', 'carbon'], ['Turbogás', 'turbogas'], ['Combustión interna', 'combustionInterna']].map(([n, k]) => [n, num(NACIONAL.mw[k]), num(NACIONAL.gwh[k]), pct(fp(k))]));
    } else if (m === 'costo') {
        const lb = OPCIONES.filter(o => o.id !== 'turbogasDiesel').map((o, i) => ({ clase: ['h-s-actual', 'h-s-cafe', 'h-s-azul', 'h-s-verde', 'h-s-amarillo'][i], nombre: o.nombre, f: x => costo(o, { gas: x }).usd }));
        $('#h-b-t').textContent = 'El combustible de cada MWh';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `Dólares de combustible por MWh según el precio del gas. La turbogás con diésel no cabe en la gráfica: ${num(costo(OPCIONES.find(o => o.id === 'turbogasDiesel')).usd)} dólares por MWh.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'El combustible de cada MWh', ...GAS_X, yMin: 0, yMax: 200, ticksY: [0, 50, 100, 150, 200], etY: 'USD por MWh', lineas: lb, fy: y => num(y), punta: x => `gas a ${f2(x)} · ${lb.map(s => `${s.nombre.toLowerCase()} ${num(s.f(x))}`).join(' · ')}` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Opción', 'Aprovecha', 'Precio', 'Combustible por MWh', 'Impuesto al carbono'], L.orden.map(o => [o.nombre, pct(o.eta), `${f2(o.precio)} USD/MMBtu`, `${num(o.usd)} USD`, o.impuesto > 0 ? `${num(o.impuesto)} pesos` : 'sin cuota']));
        const lc = [{ clase: 'h-s-rojo', nombre: 'CO2 por MWh', puntos: L.orden.map((o, i) => [i + 1, o.co2]) }, { clase: 'h-s-norma', nombre: 'Promedio de la red 2024', f: () => FACTOR_SEN[2024] }];
        $('#h-c-t').textContent = 'Y su CO2';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Toneladas de CO2 por MWh, en el mismo orden de costo: ${L.orden.map((o, i) => `${i + 1} ${o.nombre.toLowerCase()}`).join(', ')}.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Y su CO2', xMin: 0.5, xMax: L.orden.length + 0.5, ticksX: L.orden.map((_, i) => i + 1), etX: 'De la más barata a la más cara', fx: x => num(x), yMin: 0, yMax: 1.2, ticksY: [0, 0.3, 0.6, 0.9, 1.2], etY: 't por MWh', quebradas: lc.slice(0, 1), lineas: lc.slice(1), fy: y => f1(y), punta: x => { const o = L.orden[Math.round(x) - 1]; return o ? `${o.nombre} · ${f2(o.co2)} t` : ''; } });
        $('#h-tabla-c').innerHTML = tablaHTML(['Opción', 'CO2 por MWh'], L.orden.map(o => [o.nombre, `${f2(o.co2)} t`]));
    } else {
        const lb = [{ clase: 'h-s-amarillo', nombre: 'Demanda', puntos: L.dia.map((d, h) => [h + 0.5, d]) }, { clase: 'h-s-verde', nombre: 'Instalada con 35 % de reserva', f: () => L.instalada }, { clase: 'h-s-norma', nombre: 'Con el 21.3 % del sistema nacional', f: () => L.conMargenSin }];
        $('#h-b-t').textContent = 'Un día de verano';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `MW cada hora en ${L.anio}, con una forma del día de ejemplo y la demanda máxima del PLADESE. Con 35 % de reserva hacen falta ${num(L.instalada)} MW instalados; con el margen del sistema nacional bastarían ${num(L.conMargenSin)}.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Un día de verano', ...HORA_X, yMin: 0, yMax: 1600, ticksY: [0, 400, 800, 1200, 1600], etY: 'MW', quebradas: lb.slice(0, 1), lineas: lb.slice(1), fy: y => num(y), punta: x => `${Math.floor(x)}:00 · ${num(L.dia[Math.min(23, Math.floor(x))])} MW` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Hora', 'Demanda'], L.dia.map((d, h) => [`${h}:00`, `${num(d)} MW`]).filter((_, h) => h % 3 === 0));
        const lc = [{ clase: 'h-s-actual', nombre: 'Demanda máxima', f: x => modoAislado({ anio: x }).pico }, { clase: 'h-s-verde', nombre: 'Instalada con 35 % de reserva', f: x => modoAislado({ anio: x }).instalada }];
        $('#h-c-t').textContent = 'Lo que crece';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `MW. El PLADESE espera que la demanda máxima crezca ${f1(BCS.crecePico * 100)} % al año: de ${num(BCS.pico2024)} MW en 2024 a unos ${num(L.pico2039)} en 2039.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Lo que crece', xMin: 2024, xMax: 2039, ticksX: [2024, 2027, 2030, 2033, 2036, 2039], etX: 'Año', fx: x => String(Math.round(x)), yMin: 0, yMax: 1600, ticksY: [0, 400, 800, 1200, 1600], etY: 'MW', lineas: lc, fy: y => num(y), punta: x => `${Math.round(x)} · ${num(lc[0].f(Math.round(x)))} MW de demanda` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Año', 'Demanda máxima', 'Instalada con reserva'], [2024, 2027, 2030, 2033, 2036, 2039].map(a => { const k = modoAislado({ anio: a }); return [String(a), `${num(k.pico)} MW`, `${num(k.instalada)} MW`]; }));
    }
}

function pintarBarras(L, pag) {
    const { $, pide } = pag;
    let filas;
    if (pide.modo === 'vapor') {
        const u = L.u;
        filas = [
            { t: 'Del combustible, electricidad', v: u.mw / u.q, activa: true },
            { t: 'Del combustible, al mar', v: u.condensador / u.q },
            { t: 'Del combustible, por la chimenea', v: u.chimenea / u.q },
        ];
        $('#h-d-t').textContent = 'El combustible, de cada 100';
        $('#h-d-pie').textContent = 'Lo que no se vuelve electricidad se va en el agua de mar del condensador o con los gases de la chimenea.';
    } else if (pide.modo === 'arranque') {
        filas = [['vapor', 'Vapor'], ['turbogas', 'Turbogás'], ['motores', 'Motores']].map(([id, n], i) => ({ t: `${n}, de su capacidad`, v: L.p[id], activa: i === 0 }));
        $('#h-d-t').textContent = `A los ${horas(L.minuto)}`;
        $('#h-d-pie').textContent = 'Una unidad de vapor no puede bajar de su carga mínima sin apagarse, y apagarla y prenderla le cuesta horas. Por eso las rápidas cubren los picos.';
    } else if (pide.modo === 'costo') {
        const mx = Math.max(...L.orden.map(o => o.usd));
        filas = L.orden.map((o, i) => ({ t: o.nombre, v: o.usd / mx, activa: i === 0, escala: 1 }));
        $('#h-d-t').textContent = 'Del más caro, de cada 100';
        $('#h-d-pie').textContent = `La más barata con estos precios: ${L.orden[0].nombre.toLowerCase()}, ${num(L.orden[0].usd)} dólares por MWh de combustible.`;
    } else {
        filas = [
            { t: 'Demanda de esta hora, de la máxima', v: L.ahora / L.pico, activa: true },
            { t: 'Reserva del sistema aislado', v: MARGEN.sibcs },
            { t: 'Reserva del sistema nacional', v: MARGEN.sin },
        ];
        $('#h-d-t').textContent = 'Esta hora, de cada 100';
        $('#h-d-pie').textContent = 'Si falla una central grande, el sistema aislado no puede pedir ayuda a sus vecinos: tiene que tener la reserva en casa.';
    }
    $('#h-barras').innerHTML = barrasHTML(filas);
}

function alPintarFijas({ $ }) {
    $('#h-pais').innerHTML = tablaHTML(['Tecnología', '2024', 'En 2010'], [
        ['Vapor convencional', `${num(NACIONAL.mw.convencional)} MW · ${num(NACIONAL.gwh.convencional)} GWh`, `${num(NACIONAL.gwh2010.convencional)} GWh`],
        ['Carboeléctrica', `${num(NACIONAL.mw.carbon)} MW · ${num(NACIONAL.gwh.carbon)} GWh`, `${num(NACIONAL.gwh2010.carbon)} GWh`],
        ['Turbogás', `${num(NACIONAL.mw.turbogas)} MW · ${num(NACIONAL.gwh.turbogas)} GWh`, `${num(NACIONAL.gwh2010.turbogas)} GWh`],
        ['Combustión interna', `${num(NACIONAL.mw.combustionInterna)} MW · ${num(NACIONAL.gwh.combustionInterna)} GWh`, `${num(NACIONAL.gwh2010.combustionInterna)} GWh`],
        ['Todo el sistema', `${num(NACIONAL.mw.total)} MW · ${num(NACIONAL.gwh.total)} GWh`, ''],
    ]);
    $('#h-retiros').innerHTML = tablaHTML(['Qué', 'MW'], [
        ['Termoeléctricas que se sustituyen (2028)', num(RETIROS.sustituye.convencional)],
        ['Turbogás que se sustituye (2030)', num(RETIROS.sustituye.turbogas)],
        ['Combustión interna que se sustituye (2033)', num(RETIROS.sustituye.combustionInterna)],
        [`Candidatas a retiro antes de 2039 (${num(RETIROS.candidatas.unidades)} unidades)`, num(RETIROS.candidatas.mw)],
        ['De ellas, carboeléctricas', num(RETIROS.candidatas.carbon)],
    ]);
    $('#h-normas').innerHTML = tablaHTML(['Contaminante', 'Valle de México', 'Zonas críticas', 'Resto del país'], [
        ['Dióxido de azufre', `${num(NOM085.so2.valle)} ppm`, `${num(NOM085.so2.criticas)} ppm`, `${num(NOM085.so2.resto)} ppm`],
        ['Óxidos de nitrógeno', `${num(NOM085.nox.valle)} ppm`, `${num(NOM085.nox.criticas)} ppm`, `${num(NOM085.nox.resto)} ppm`],
        ['Partículas', `${num(NOM085.particulas.valle)} mg/m³`, `${num(NOM085.particulas.criticas)} mg/m³`, `${num(NOM085.particulas.resto)} mg/m³`],
    ]);
    $('#h-regla').innerHTML = tablaHTML(['Qué', 'Dónde lo dice'], [
        ['La lista de Energías Limpias: no nombra al carbón, al combustóleo, al diésel ni a la turbogás', 'LSE, art. 3, fracc. XXI'],
        ['El CENACE despacha por costo, sin importar de quién es la central', 'LSE, arts. 117 y 120'],
        ['La SENER fija en el PLADESE el programa de instalación y retiro de centrales', 'LSE, arts. 10 y 12'],
        ['Quien va a retirar una central debe avisarle al CENACE', 'LSE, art. 22, fracc. IV'],
        ['Si una central que se va a retirar hace falta, el CENACE puede pedir que siga disponible', 'LSE, art. 155'],
        ['Baja California Sur tiene su propio sistema interconectado y reglas especiales', 'LSE, arts. 79 y 81'],
    ]);
}

function alActualizar(L, pag) {
    const { pide, ponerCifra, ponerLecturas, nivel, graficas } = pag;
    pintarBarras(L, pag);
    ponerCifra('aT', { vapor: 'La central de vapor', arranque: 'Cuánto tarda en arrancar', costo: 'Cuánto cuesta cada MWh', aislado: 'Una red aislada' }[pide.modo]);
    if (pide.modo === 'vapor') {
        const u = L.u;
        const c = COMBUSTIBLES[u.comb];
        const aviso = pide.carga < u.carga - 0.001 ? `No puede bajar de ${pct(u.carga)} sin apagar la caldera.` : null;
        ponerLecturas([
            ['Electricidad', `${num(u.mw)} MW`, `${pct(u.carga)} de ${num(UNIDADES.vapor)} MW`],
            ['Aprovecha', `${f1(u.eta * 100)} %`, 'de la energía del combustible'],
            ['Combustible', u.litrosH ? `${num(u.litrosH / 1000)} m³/h` : u.th ? `${num(u.th)} t/h` : `${num(u.gjH)} GJ/h`, NOMBRE_COMB[u.comb]],
            ['CO2', `${f2(u.co2mwh)} t/MWh`, `${num(u.co2th)} t por hora`],
            ['Dióxido de azufre', c.azufre ? `${f1(u.so2mwh)} kg/MWh` : 'casi nada', c.azufre ? `azufre de ${f1(c.azufre * 100)} %, sin equipo que lo quite` : 'el gas casi no trae azufre'],
            ['Agua de mar', `${f1(u.marM3s)} m³/s`, `regresa ${num(AGUA.dT)} °C más caliente`],
        ], aviso);
        ponerCifra('hud', `${f1(u.eta * 100)} %`);
        ponerCifra('hud2', `se aprovecha, con ${NOMBRE_COMB[u.comb]}`);
        graficas.b?.marcar(u.carga * 100, u.eta * 100);
        graficas.c?.marcar(u.carga * 100, u.co2mwh);
        nivel(1, 'Carga', clamp01(u.carga), pct(u.carga));
        nivel(2, 'Aprovecha', clamp01(u.eta / 0.4), `${f1(u.eta * 100)} %`);
    } else if (pide.modo === 'arranque') {
        const mw = { vapor: L.p.vapor * UNIDADES.vapor, turbogas: L.p.turbogas * UNIDADES.turbogas.reduce((s, x) => s + x, 0), motores: L.p.motores * UNIDADES.motores.reduce((s, x) => s + x, 0) };
        ponerLecturas([
            ['Desde la orden', horas(L.minuto), L.frio ? 'en frío' : 'en caliente'],
            ['Vapor', `${num(mw.vapor)} MW`, L.p.vapor > 0 ? pct(L.p.vapor) : 'calentando'],
            ['Turbogás', `${num(mw.turbogas)} MW`, L.p.turbogas > 0 ? pct(L.p.turbogas) : 'arrancando'],
            ['Motores', `${num(mw.motores)} MW`, L.p.motores > 0 ? pct(L.p.motores) : 'arrancando'],
            ['Vapor a plena carga', horas(L.plena.vapor), 'desde la orden'],
            ['Turbogás a plena carga', horas(L.plena.turbogas), 'desde la orden'],
        ], null);
        ponerCifra('hud', horas(L.minuto));
        ponerCifra('hud2', 'desde la orden de arrancar');
        graficas.b?.marcar(L.minuto, 100 * L.p.vapor);
        nivel(1, 'Vapor', L.p.vapor, pct(L.p.vapor));
        nivel(2, 'Turbogás', L.p.turbogas, pct(L.p.turbogas));
    } else if (pide.modo === 'costo') {
        const [a, b] = L.orden;
        ponerLecturas([
            ['La más barata', a.nombre, `${num(a.usd)} USD por MWh`],
            ['La siguiente', b.nombre, `${num(b.usd)} USD por MWh`],
            ['Gas', `${f2(L.gas)} USD`, 'por millón de BTU'],
            ['Combustóleo', `${f2(PRECIOS.combustoleo)} USD`, 'por millón de BTU, CFE 2024'],
            ['Carbón', `${f2(PRECIOS.carbon)} USD`, 'por millón de BTU, cálculo propio'],
            ['Impuesto al carbono', `${num(costo(OPCIONES[0]).impuesto)} pesos`, 'por MWh con carbón; el gas no paga'],
        ], null);
        ponerCifra('hud', `${num(a.usd)} USD`);
        ponerCifra('hud2', `por MWh: ${a.nombre.toLowerCase()}`);
        graficas.b?.marcar(L.gas, costo(OPCIONES.find(o => o.id === 'turbogasGas'), { gas: L.gas }).usd);
        nivel(1, 'Gas', clamp01((L.gas - 2) / 10), `${f1(L.gas)} USD`);
        nivel(2, 'Más barata', 1, a.nombre);
    } else {
        ponerLecturas([
            ['Demanda', `${num(L.ahora)} MW`, `${Math.floor(L.hora)}:00 de ${L.anio}`],
            ['Demanda máxima', `${num(L.pico)} MW`, L.anio === 2024 ? 'la de 2024, del PLADESE' : `con ${f1(BCS.crecePico * 100)} % al año`],
            ['Reserva', pct(MARGEN.sibcs), 'que pide el PLADESE'],
            ['Instalada', `${num(L.instalada)} MW`, 'para cubrir la máxima con reserva'],
            ['Con el margen nacional', `${num(L.conMargenSin)} MW`, `reserva de ${f1(MARGEN.sin * 100)} %`],
            ['Consumo de 2024', `${num(BCS.consumoBruto2024)} GWh`, 'bruto, del PLADESE'],
        ], null);
        ponerCifra('hud', `${num(L.ahora)} MW`);
        ponerCifra('hud2', `${Math.floor(L.hora)}:00 en ${L.anio}`);
        graficas.b?.marcar(Math.floor(L.hora) + 0.5, L.ahora);
        graficas.c?.marcar(L.anio, L.pico);
        nivel(1, 'Demanda', clamp01(L.ahora / L.pico), pct(L.ahora / L.pico));
        nivel(2, 'Año', clamp01((L.anio - 2024) / 15), String(L.anio));
    }
}

// ------------------------------------------------------------------ el sitio
const gltf = await leerGlb(EQUIPOS);
const PIDE0 = { carga: DEF.carga, comb: DEF.comb, minuto: DEF.minuto, frio: DEF.frio, gas: DEF.gas, hora: DEF.hora, anio: DEF.anio, corre: false };
crearPagina({
    figura: FIGURA,
    fichas: FICHAS,
    vistas: VISTAS,
    modos: MODOS,
    botones: BOTONES,
    acciones: ACCIONES,
    modo0: 'vapor',
    pide: { ...PIDE0 },
    general: { Lx: 16, Lz: 7.4, alto: 5.2, mira: [0, 0.8, -0.3], az: 18, el: 30, azVertical: 10, elVertical: 38 },
    etiquetas: { lienzo: 'Centrales térmicas en 3D: arrastra para girarlas, toca un punto para conocerlo', modos: 'Qué ver de las centrales térmicas', puntos: 'Puntos clave de las centrales térmicas', desarmar: 'Desarmar las centrales', lecturas: 'Lo que miden las centrales' },
    textoFinal: 'Toca cualquier punto para volver a verlo. Cambia el combustible de la central de vapor, da la orden de arrancar, mueve el precio del gas o recorre un día de la red aislada.',
    colores: { guindaSuave: '#f3d4de', claro: '#ffffff' },
    crearDiagrama,
    secciones,
    escena: (renderer, scene, { movil, oscuro }) => {
        const M = materiales(P_PLANTA);
        const est = escenario(renderer, scene, M, { movil, oscuro });
        return { planta: construir(M, P_PLANTA, gltf, { movil, oscuro }), est };
    },
    alCambiarModo: p => {
        Object.assign(p, PIDE0);
        planta = estadoPlanta();
    },
    alCuadro: ({ dt, pide }) => {
        planta = pasoPlanta(planta, { modo: pide.modo }, dt);
    },
    poseDe: ({ pide, ve, encendido, t, dt, camara }) => pose({ modo: pide.modo, carga: pide.carga, comb: pide.comb, minuto: pide.minuto, frio: pide.frio, gas: pide.gas, hora: pide.hora, anio: pide.anio, noche: ve.noche, adentro: ve.adentro, desarme: ve.desarme, encendido, t, dt, camara }),
    firma: p => [p.modo, Math.round(p.carga * 100), p.comb, Math.round(p.minuto), p.frio, Math.round(p.gas * 10), Math.floor(p.hora), Math.round(p.anio)],
    alPintarFijas,
    alPintarGraficas,
    alActualizar,
    prueba: p => ({ carga: +p.carga.toFixed(2), comb: p.comb, minuto: Math.round(p.minuto), frio: p.frio, gas: +p.gas.toFixed(2), hora: +p.hora.toFixed(1), anio: Math.round(p.anio), t: +planta.t.toFixed(1), ieps: IEPS.carbon.cuota }),
});
