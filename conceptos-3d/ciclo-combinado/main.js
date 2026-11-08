// «Central de ciclo combinado», en 3D y con el formato Búho de «¿Cómo funciona?». Una central con el equipo de Empalme I (CFE, Sonora): dos
// turbinas de gas con sus generadores, dos recuperadores de calor y una turbina de vapor con su generador, el condensador, la torre, la
// chimenea, la subestación, la RNT y las RGD. Cuatro formas de verla: ciclo combinado, ciclo abierto, clima y arranque. Puntos clave con su
// ficha, ver por dentro, desarmar, día y noche, y gráficas que leen las mismas cifras que mueven la central (modelo.js). Se arma con:
// node scripts/build-conceptos-3d.mjs ciclo-combinado
//
// Lo que se repite entre las plantas con física está en conceptos-3d/planta-comun/.
import { clamp, clamp01, num } from '../planta-comun/ayudas.js';
import { barrasHTML, leyenda, pintarGrafica, seccionBarras, seccionColores, seccionDiagrama, seccionFuentes, seccionGrafica, seccionTabla, tablaHTML } from '../planta-comun/graficas.js';
import { crearPagina } from '../planta-comun/pagina.js';
import { ARRANQUES, DEF, EQUIPO, FLUIDOS, LIMITES, PARTES as PARTES_M, RAMPA_MW_MIN, RECUPERADOR, SITIOS, arranque, central, estadoPlanta, pasoPlanta, pose, tEnQueDa } from './modelo.js';
import { P_PLANTA, construir, escenario, materiales } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';

const FIGURA = 'ciclo-combinado';
const BASE = central();
const UNO = central({ dos: false });
const ABIERTO = central({ abierto: 1 });
const G = BASE.g;
const T_EMPALME = tEnQueDa(EQUIPO.empalme1);

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'gas', nombre: 'Gas natural', modo: 'combinado', accion: 'desarme', eq: `${num(BASE.m3Dia, 1)} millones de m³ de gas al día`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 3c3 4 6 6.5 6 11a6 6 0 0 1-12 0c0-2 1-3.500 2-5 .5 1.500 1.500 2 2 2 0-3 1-5 2-8Z"/>',
        texto: 'Llega por un gasoducto enterrado: por eso el tubo verde sale por el corte del terreno, a la izquierda. Esta estación lo filtra, lo mide y lo calienta un poco antes de mandarlo a las dos turbinas. En México, la red principal de ductos es el Sistema de Transporte y Almacenamiento Nacional Integrado de Gas Natural, que coordina el CENAGAS.' },
    { parte: 'compresor', nombre: 'Aire y compresor', modo: 'combinado', abrir: true, accion: 'enfriar', eq: `${num(G.m)} kg de aire por segundo, a ${num(G.tComp)} °C al salir`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 8h9a3 3 0 1 0-3-3"/><path d="M4 12h14a3 3 0 1 1-3 3"/><path d="M4 16h6a2.500 2.500 0 1 1-2.500 2.500"/>',
        texto: `La turbina respira. El aire pasa por esos filtros, que le quitan el polvo, y luego por muchas hileras de álabes que lo aprietan unas ${num(G.rp)} veces: se calienta a ${num(G.tComp)} °C con solo apretarlo. Mover este compresor se lleva cerca de la mitad de lo que produce la turbina. Por eso importa tanto qué tan fresco y denso entra el aire.` },
    { parte: 'combustion', nombre: 'Combustión', modo: 'combinado', abrir: true, accion: 'desarme', eq: `${num(G.kgGas, 1)} kg de gas por segundo en cada turbina`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="12" r="8"/><path d="M12 8c1.500 2 3 3 3 5a3 3 0 0 1-6 0c0-1 .5-1.800 1-2.500.3.8.8 1 1 1 0-1.300.5-2.300 1-3.500Z"/>',
        texto: `El gas entra por las boquillas verdes, se mezcla con el aire apretado y arde en un anillo de cámaras. Los gases llegan a cerca de ${num(G.tEntra, 0)} °C, más calientes de lo que aguanta el metal: por eso el aire que sobra y un sistema de enfriamiento cuidan las piezas. Por cada kilo de gas entran unos ${num(1 / G.f)} kilos de aire.` },
    { parte: 'turbinaGas', nombre: 'Turbina de gas', modo: 'combinado', abrir: true, accion: 'desarme', eq: `${num(G.W)} MW con ${num(G.eficiencia * 100)} de cada 100 del gas`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 12h16"/><path d="M8 7v10M12 5v14M16 3v18"/>',
        texto: `Los gases se abren paso por cuatro hileras de álabes y empujan el eje, a ${num(EQUIPO.rpm)} vueltas por minuto. Es el mismo eje que mueve al compresor. Salen todavía a ${num(G.tEscape)} °C. Hasta aquí llega una central de ciclo abierto: de cada 100 de energía del gas, unos ${num(G.eficiencia * 100)} se vuelven electricidad y lo demás se va por la chimenea.` },
    { parte: 'gen1', nombre: 'Primer generador', modo: 'combinado', abrir: true, accion: 'desarme', eq: `${num(G.W)} MW en cada generador de gas`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="12" r="7.5"/><path d="M12.8 7.5 9.7 12.600h4.600l-3 4"/>',
        texto: `El mismo eje hace girar un imán de dos polos dentro de las bobinas de cobre, y ahí nace la electricidad. Con dos polos, ${num(EQUIPO.rpm)} vueltas por minuto dan los 60 ciclos por segundo de la red mexicana. Cada turbina de gas tiene el suyo, del lado del aire frío, y la cubierta lleva su propio enfriamiento.` },
    { parte: 'recuperador', nombre: 'Recuperador de calor', modo: 'combinado', abrir: true, accion: 'dos', eq: `${num(BASE.Qrec / BASE.n)} MW de calor; los gases entran a ${num(G.tEscape)} °C y salen a ${num(BASE.r.tChim)} °C`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="4" y="5" width="16" height="14" rx="1.500"/><path d="M8 5v14M12 5v14M16 5v14"/>',
        texto: 'Es la pieza que hace «combinado» al ciclo: una caja llena de tubos con agua, que los gases cruzan antes de irse. No quema nada. Hierve agua a tres presiones, una en cada tambor de arriba, para sacarles más calor a los gases aunque se vayan enfriando. Los tubos van del más caliente, naranja, al más frío, azul. Hay uno por cada turbina de gas: eso es un arreglo 2×1.' },
    { parte: 'turbinaVapor', nombre: 'Turbina de vapor', modo: 'combinado', abrir: true, accion: 'arranque', eq: `${num(BASE.brutaVapor)} MW sin quemar más gas`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 12h18"/><path d="M7 8v8M11 6v12M16 4v16"/><path d="M5 4c1 1-1 2 0 3"/>',
        texto: `El vapor de los dos recuperadores entra por la parte chica, de alta presión; regresa al recuperador a calentarse otra vez y sigue por la de media y la de baja, con álabes cada vez más largos porque se va expandiendo. Sin quemar más gas, da cerca de la mitad de lo que dan las turbinas de gas. Tarda más en reaccionar, porque el recuperador tarda en agarrar calor. El marco de arriba es una grúa para abrirla al darle mantenimiento.` },
    { parte: 'gen2', nombre: 'Segundo generador', modo: 'combinado', abrir: true, accion: 'desarme', eq: `${num(BASE.brutaVapor)} MW; en Empalme I es de la clase de ${num(EQUIPO.vaporClase)}`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="12" r="7.5"/><path d="M12.8 7.5 9.7 12.600h4.600l-3 4"/>',
        texto: 'Igual que el primero, pero lo mueve el vapor. Por eso a estas centrales se les llama de dos ciclos: el gas mueve unos generadores y el calor que sobró mueve otro. Si la turbina de vapor sale de servicio, las de gas pueden seguir solas, en ciclo abierto, gracias a la compuerta.' },
    { parte: 'condensador', nombre: 'Condensador', modo: 'combinado', abrir: true, accion: 'desarme', eq: `${num(BASE.st.tC)} °C y ${num(BASE.st.pC, 2)} bar`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 10h10M7 14h10"/>',
        texto: 'Abajo de la turbina, el vapor cae sobre tubos llenos de agua fría y se vuelve líquido. Al ocupar mucho menos lugar deja un vacío que jala más vapor. Una bomba regresa el agua al recuperador: es siempre la misma agua, en un circuito cerrado. La de la torre corre aparte, por dentro de los tubos; nunca se mezclan.' },
    { parte: 'enfriamiento', nombre: 'Torre de enfriamiento', modo: 'combinado', abrir: true, accion: 'noche', eq: `Se evaporan ${num(BASE.evapora)} toneladas de agua por hora`, recorrido: { adentro: false },
        icono: '<path d="M7 21c1-5 1-7 0-12h10c-1 5-1 7 0 12Z"/><path d="M10 6c1 1-1 2 0 3M14 6c1 1-1 2 0 3"/>',
        texto: 'Aquí se le saca al agua el calor del condensador. Cae en gotas mientras los ventiladores jalan aire, y una parte se evapora y se lleva el calor: esa nube es vapor de agua, no humo. Esta torre es de ejemplo. Empalme enfría con agua de mar, por una toma de mil metros; donde hay poca agua existe el enfriamiento con aire.' },
    { parte: 'chimenea', nombre: 'Chimenea', modo: 'combinado', abrir: true, accion: 'abierto', eq: `${num(BASE.co2MWh, 2)} toneladas de CO₂ por MWh; en ciclo abierto, ${num(ABIERTO.co2MWh, 2)}`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M9 21V6h6v15"/><path d="M12 6c-1-1 1-2 0-3"/><path d="M6 21h12"/>',
        texto: `Por aquí se van los gases, ya a ${num(BASE.r.tChim)} °C, con el CO₂ del gas quemado. El gas natural no está en la lista de Energías Limpias de la ley. La chimenea más corta, junto a la turbina, es la de paso: una compuerta guinda manda los gases directo afuera, a ${num(G.tEscape)} °C. Así la central trabaja en ciclo abierto: arranca más rápido, pero gasta cerca de la mitad más de gas por cada MWh. Las luces rojas avisan a los aviones.` },
    { parte: 'subestacion', nombre: 'Subestación', modo: 'combinado', abrir: true, accion: 'desarme', eq: `${num(BASE.neta)} MW: ${num((BASE.neta * 1e3) / (Math.sqrt(3) * 400))} amperes a 400 kV`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
        texto: 'El voltaje que da un generador es muy poco para viajar lejos. Cada generador tiene su propio transformador, que lo sube; aquí, a 400 kV de ejemplo. Con más voltaje, la misma potencia viaja con menos corriente y los cables se calientan menos. El pórtico de al lado conecta la central con la línea.' },
    { parte: 'red', nombre: 'RNT y RGD', modo: 'combinado', accion: 'noche', recorrido: { noche: true, adentro: false },
        icono: '<path d="M12 3 6 21M12 3l6 18M8 9h8M7 14h10"/>',
        texto: 'La electricidad sale por la RNT, la Red Nacional de Transmisión, que la lleva lejos y a grandes usuarios. Cerca del pueblo, otra subestación baja el voltaje y las RGD, las Redes Generales de Distribución, la reparten al público. El CENACE decide cuándo entra cada central. Las de ciclo combinado dan más de la mitad de la electricidad del país: 61 % entre enero y septiembre de 2025.' },
];
const VISTAS = Object.fromEntries(PARTES_M.map(p => [p.id, p.vista]));

const textoT = v => `${num(v)} °C`;
const textoC = v => `${num(v)} %`;
const textoM = v => `${num(v)} m`;
const MODOS = {
    combinado: { nombre: 'Ciclo combinado', corto: 'Combinado', resumen: 'Dos turbinas de gas y una de vapor, como en Empalme I. Mueve la carga: la de gas responde luego luego y la de vapor le sigue después, cuando el recuperador agarra calor.', aclara: 'Cada 100 de energía del gas se reparten así. Lo que el ciclo abierto tira por la chimenea, aquí todavía mueve una turbina.', mando: { nombre: 'Carga de la central', campo: 'carga', rango: LIMITES.carga, texto: textoC, pinta: false }, mando2: { nombre: 'Temperatura del aire', campo: 'tAire', rango: LIMITES.tAire, texto: textoT, pinta: true } },
    abierto: { nombre: 'Ciclo abierto', corto: 'Abierto', resumen: 'La compuerta manda los gases directo por la chimenea de paso, sin recuperador ni turbina de vapor. Es más rápido y más sencillo, pero tira el calor: gasta cerca de la mitad más de gas por cada MWh.', aclara: 'Sin recuperador, todo lo que no se volvió electricidad se va al aire, muy caliente.', mando: { nombre: 'Carga de la central', campo: 'carga', rango: LIMITES.carga, texto: textoC, pinta: false } },
    clima: { nombre: 'Clima', corto: 'Clima', resumen: 'El aire caliente o de mucha altura pesa menos, y a la turbina le cabe menos. Mueve la temperatura y la altura, y prueba el enfriador de la entrada: evapora agua en el aire que entra.', aclara: 'La turbina siempre mete el mismo volumen. Si el aire pesa menos, le llega menos aire por segundo y quema menos gas.', mando: { nombre: 'Temperatura del aire', campo: 'tAire', rango: LIMITES.tAire, texto: textoT, pinta: true }, mando2: { nombre: 'Altura del sitio', campo: 'altitud', rango: LIMITES.altitud, texto: textoM, pinta: true } },
    arranque: { nombre: 'Arranque', corto: 'Arranque', resumen: 'Cuando el sistema la pide, primero sube la turbina de gas. El vapor tarda: hay que calentar el recuperador y la turbina poco a poco. Por eso ayuda a cubrir cuando cae el sol, si ya viene caliente.', aclara: 'Solo el tiempo total y la rampa salen de fuentes: en caliente, 30 minutos; en frío, hasta 240. El reparto de cada etapa es de ejemplo.', mando: { nombre: 'Minutos desde la orden', campo: 'minutos', rango: p => [0, ARRANQUES[p.tipo].total], texto: (v, p) => `${num(v)} de ${num(ARRANQUES[p.tipo].total)} min`, detiene: true },
        reloj: { texto: 'los minutos', avanzar: (p, dt) => { const A = ARRANQUES[p.tipo]; p.minutos = Math.min(A.total, p.minutos + (dt * A.total) / (p.tipo === 'frio' ? 40 : 30)); return p.minutos >= A.total; }, alSeguir: p => { if (p.minutos >= ARRANQUES[p.tipo].total - 0.01) p.minutos = 0; } } },
};
const BOTONES = [
    { id: 'dos', visible: () => true, pulsado: p => p.dos, texto: p => (p.dos ? 'Dos turbinas de gas (2×1)' : 'Una turbina de gas (1×1)'), alTocar: p => { p.dos = !p.dos; } },
    { id: 'enfriar', visible: p => p.modo === 'clima', pulsado: p => p.enfriar, texto: p => (p.enfriar ? 'Quitar el enfriador' : 'Enfriar el aire de entrada'), alTocar: p => { p.enfriar = !p.enfriar; } },
    { id: 'tipo', visible: p => p.modo === 'arranque', pulsado: p => p.tipo === 'frio', texto: p => (p.tipo === 'frio' ? 'Arranque en frío' : 'Arranque en caliente'), alTocar: p => { p.tipo = p.tipo === 'frio' ? 'caliente' : 'frio'; p.minutos = 0; p.corre = true; } },
];
const ACCIONES = {
    enfriar: { texto: p => (p.modo === 'clima' ? (p.enfriar ? 'Quitar el enfriador' : 'Enfriar el aire') : 'Ver el efecto del clima'), hacer: (p, pag) => { if (p.modo === 'clima') { p.enfriar = !p.enfriar; pag.invalidar(); } else pag.cambiarModo('clima'); } },
    dos: { texto: p => (p.dos ? 'Ver con una turbina (1×1)' : 'Ver con dos turbinas (2×1)'), hacer: (p, pag) => { p.dos = !p.dos; pag.invalidar(); } },
    abierto: { texto: p => (p.modo === 'abierto' ? 'Volver al ciclo combinado' : 'Pasar a ciclo abierto'), hacer: (p, pag) => pag.cambiarModo(p.modo === 'abierto' ? 'combinado' : 'abierto') },
    arranque: { texto: p => (p.modo === 'arranque' ? 'Volver al ciclo combinado' : 'Ver cómo arranca'), hacer: (p, pag) => pag.cambiarModo(p.modo === 'arranque' ? 'combinado' : 'arranque') },
};

// ------------------------------------------------------------------ el tablero
const secciones = () => `
    ${seccionDiagrama('A dónde va la energía')}
    ${seccionGrafica('b')}
    ${seccionGrafica('c')}
    ${seccionBarras()}
    ${seccionTabla('Una o dos turbinas de gas', 'h-arreglos', 'Lo normal es 2×1: en Estados Unidos, la mayoría de los ciclos combinados tienen dos turbinas de gas por una de vapor (EIA). Dos recuperadores le dan vapor a una sola turbina, más grande y más eficiente.')}
    ${seccionTabla('Ciclo abierto y ciclo combinado', 'h-comparar', 'La misma turbina de gas, con y sin recuperador. Los datos salen del modelo con el aire a 15 °C.', 'h-tabla-texto')}
    ${seccionTabla('Ciclos combinados de CFE', 'h-mexico', `Las fuentes no dicen a qué temperatura se midieron los 770 MW de Empalme I; este modelo los da con el aire a unos ${num(T_EMPALME)} °C. El arreglo de las tres de 2025 no viene en las fuentes.`)}
    <section class="g-curva h-media">
        <div class="g-curva-cab"><b>Cuánto pesa en México</b></div>
        <div class="h-barras" id="h-pesa"></div>
        <p>Más de la mitad de la electricidad del país, con menos de la mitad de la capacidad: trabajan muchas horas al año. Por eso México depende tanto del gas natural.</p>
    </section>
    ${seccionColores(FLUIDOS, 'Central de ejemplo con el equipo de Empalme I; no es el plano real ni un simulador. No está a escala: las turbinas se dibujaron más grandes para poder verlas. Empalme enfría con agua de mar; aquí se dibuja una torre, como en el estudio de JICA. Lo que no sale de una fuente (las presiones del vapor, la carga parcial, las etapas del arranque y el voltaje de 400 kV) es de ejemplo, para ver la tendencia.')}
    ${seccionFuentes(FUENTES, [
        { para: 'Permiso de generación, interconexión, quién decide el despacho, RNT y RGD', titulo: 'Ley del Sector Eléctrico, arts. 3, 19, 36 a 40, 49, 114 y 117', nota: 'Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio' },
        { para: 'Transporte de gas por ducto, su sistema nacional y el acceso abierto', titulo: 'Ley del Sector Hidrocarburos, arts. 99, 100 y 104', nota: 'Está en el acervo de este sitio' },
    ])}`;

const f1 = x => num(x, 1);
function tabla41(fn, a, b) {
    const n = 40;
    const puntos = Array.from({ length: n + 1 }, (_, i) => { const x = a + ((b - a) * i) / n; return [x, fn(x)]; });
    return x => {
        const k = clamp((x - a) / (b - a), 0, 1) * n;
        const i = Math.min(n - 1, Math.floor(k));
        return puntos[i][1] + (puntos[i + 1][1] - puntos[i][1]) * (k - i);
    };
}
function alPintarGraficas(L, pag) {
    const { $, pide, graficas } = pag;
    const m = pide.modo;
    const clima = { tAire: pide.tAire, altitud: pide.altitud, humedad: DEF.humedad, enfriar: pide.enfriar, dos: pide.dos };
    const MAX_MW = pide.dos ? 1000 : 500;
    const ticksMW = pide.dos ? [0, 250, 500, 750, 1000] : [0, 125, 250, 375, 500];
    graficas.b = null;
    graficas.c = null;
    if (m === 'combinado') {
        const lineas = [
            { clase: 'h-s-actual', nombre: 'Total a la red', f: tabla41(x => central({ ...clima, carga: x / 100 }).neta, 40, 100) },
            { clase: 'h-s-max', nombre: 'Turbinas de gas', f: tabla41(x => central({ ...clima, carga: x / 100 }).brutaGas, 40, 100) },
            { clase: 'h-s-sin', nombre: 'Turbina de vapor', f: tabla41(x => central({ ...clima, carga: x / 100 }).brutaVapor, 40, 100) },
        ];
        $('#h-b-t').textContent = 'Potencia según la carga';
        $('#h-b-ley').innerHTML = leyenda(lineas);
        $('#h-b-pie').textContent = `Con el aire a ${num(pide.tAire)} °C. La turbina de vapor baja menos: al principio, la de gas cierra los álabes de entrada y deja los gases casi igual de calientes. De aquí sale que siga siendo eficiente con poca carga.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Potencia según la carga', xMin: 40, xMax: 100, yMin: 0, yMax: MAX_MW, ticksX: [40, 55, 70, 85, 100], ticksY: ticksMW, etX: 'Carga de la central (%)', etY: 'MW', lineas, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} % · total ${num(lineas[0].f(x))} · gas ${num(lineas[1].f(x))} · vapor ${num(lineas[2].f(x))} MW` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Carga', 'A la red, MW', 'Gas, MW', 'Vapor, MW', 'Eficiencia'], [100, 85, 70, 55, 40].map(c => { const q = central({ ...clima, carga: c / 100 }); return [`${num(c)} %`, num(q.neta), num(q.brutaGas), num(q.brutaVapor), `${f1(q.eficiencia * 100)} %`]; }));
        const r = L.c.r;
        const Qt = Math.max(1, r.Q / 1000);
        const agua = r.perfil.map(([q, t]) => [q / 1000, t]);
        const gases = [[0, r.tChim], [Qt, r.T4]];
        const series = [{ clase: 'h-s-actual', nombre: 'Gases, se enfrían' }, { clase: 'h-s-max', nombre: 'Agua y vapor, se calientan' }];
        const aguaEn = q => { for (let i = 0; i < agua.length - 1; i++) if (q <= agua[i + 1][0]) return agua[i][1] + ((agua[i + 1][1] - agua[i][1]) * (q - agua[i][0])) / Math.max(0.001, agua[i + 1][0] - agua[i][0]); return agua.at(-1)[1]; };
        $('#h-c-t').textContent = 'Cómo pasa el calor del gas al agua';
        $('#h-c-ley').innerHTML = leyenda(series);
        $('#h-c-pie').textContent = `Dentro del recuperador. Los tramos planos son el agua hirviendo, a tres presiones. Mientras la línea azul vaya pegada a la de los gases, se pierde poco; por eso tres presiones sacan más que una. Los gases nunca bajan de unos ${num(RECUPERADOR.pinch)} °C sobre el agua que hierve.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Cómo pasa el calor del gas al agua', xMin: 0, xMax: Qt, yMin: 0, yMax: 700, ticksX: [0, Math.round(Qt / 2), Math.round(Qt)], ticksY: [0, 175, 350, 525, 700], etX: 'Calor que ya pasó, en MW', etY: '°C', quebradas: [{ clase: 'h-s-actual', puntos: gases }, { clase: 'h-s-max', puntos: agua }], fx: x => num(x), fy: y => num(y), punta: q => `${num(q)} MW · gases ${num(r.tChim + ((r.T4 - r.tChim) * q) / Qt)} °C · agua ${num(aguaEn(q))} °C` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Presión', 'Hierve a', 'Vapor, kg/s'], [['Alta, 150 bar', '342 °C', num(r.mAP)], ['Media, 30 bar', '234 °C', num(r.mMP)], ['Baja, 4 bar', '144 °C', num(r.mBP)]]);
    } else if (m === 'abierto') {
        const cc = tabla41(x => central({ ...clima, carga: x / 100 }).eficiencia * 100, 40, 100);
        const ab = tabla41(x => central({ ...clima, carga: x / 100, abierto: 1 }).eficiencia * 100, 40, 100);
        const lineas = [{ clase: 'h-s-actual', nombre: 'Ciclo combinado', f: cc }, { clase: 'h-s-sin', nombre: 'Ciclo abierto', f: ab }];
        $('#h-b-t').textContent = 'Cuánto aprovecha del gas, según la carga';
        $('#h-b-ley').innerHTML = leyenda(lineas);
        $('#h-b-pie').textContent = 'Con poca carga, las dos pierden. En ciclo abierto cae más rápido porque la turbina es lo único que convierte el calor en electricidad.';
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Cuánto aprovecha del gas', xMin: 40, xMax: 100, yMin: 0, yMax: 70, ticksX: [40, 55, 70, 85, 100], ticksY: [0, 20, 40, 60], etX: 'Carga de la central (%)', etY: '% del gas', lineas, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} % · combinado ${f1(cc(x))} · abierto ${f1(ab(x))} %` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Carga', 'Combinado', 'Abierto'], [100, 85, 70, 55, 40].map(c => [`${num(c)} %`, `${f1(cc(c))} %`, `${f1(ab(c))} %`]));
        const cCO = tabla41(x => central({ ...clima, carga: x / 100 }).co2MWh, 40, 100);
        const aCO = tabla41(x => central({ ...clima, carga: x / 100, abierto: 1 }).co2MWh, 40, 100);
        const l2 = [{ clase: 'h-s-actual', nombre: 'Ciclo combinado', f: cCO }, { clase: 'h-s-sin', nombre: 'Ciclo abierto', f: aCO }];
        $('#h-c-t').textContent = 'CO₂ por cada MWh';
        $('#h-c-ley').innerHTML = leyenda(l2);
        $('#h-c-pie').textContent = 'Es el CO₂ del gas quemado, con el factor de la EIA. No cuenta el metano que se fuga al extraer y mover el gas.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'CO₂ por cada MWh', xMin: 40, xMax: 100, yMin: 0, yMax: 0.8, ticksX: [40, 55, 70, 85, 100], ticksY: [0, 0.2, 0.4, 0.6, 0.8], etX: 'Carga de la central (%)', etY: 't/MWh', lineas: l2, fx: x => num(x), fy: y => num(y, 1), punta: x => `${num(x)} % · combinado ${num(cCO(x), 2)} · abierto ${num(aCO(x), 2)} t/MWh` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Carga', 'Combinado', 'Abierto'], [100, 70, 40].map(c => [`${num(c)} %`, num(cCO(c), 2), num(aCO(c), 2)]));
    } else if (m === 'clima') {
        const sinA = { enfriar: pide.enfriar, dos: pide.dos, humedad: DEF.humedad };
        const lineas = [
            { clase: 'h-s-max', nombre: 'Nivel del mar', f: tabla41(x => central({ ...sinA, tAire: x, altitud: 0 }).neta, 5, 45) },
            { clase: 'h-s-sin', nombre: '1,000 m', f: tabla41(x => central({ ...sinA, tAire: x, altitud: 1000 }).neta, 5, 45) },
            { clase: 'h-s-actual', nombre: '2,240 m, Valle de México', f: tabla41(x => central({ ...sinA, tAire: x, altitud: 2240 }).neta, 5, 45) },
        ];
        $('#h-b-t').textContent = 'Potencia según el calor y la altura';
        $('#h-b-ley').innerHTML = leyenda(lineas);
        $('#h-b-pie').textContent = `Las máquinas se venden a 15 °C y nivel del mar. De 10 a 35 °C pierden cerca de 13 % (JICA). Cada 1,000 pies de altura quitan cerca de 3.5 % más (Power Engineering). La tabla usa un día caluroso de ejemplo en cada sitio. ${pide.enfriar ? 'Con el enfriador, baja menos cuando hace calor.' : ''}`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Potencia según el calor y la altura', xMin: 5, xMax: 45, yMin: 0, yMax: MAX_MW, ticksX: [5, 15, 25, 35, 45], ticksY: ticksMW, etX: 'Temperatura del aire (°C)', etY: 'MW a la red', lineas, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} °C · mar ${num(lineas[0].f(x))} · 1,000 m ${num(lineas[1].f(x))} · 2,240 m ${num(lineas[2].f(x))} MW` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Sitio', 'Altura', 'Aire', 'MW a la red'], SITIOS.map(s => [s.nombre, `${num(s.m)} m`, `${num(s.t)} °C`, num(central({ ...sinA, tAire: s.t, altitud: s.m }).neta)]));
        const ef = tabla41(x => central({ ...sinA, tAire: x, altitud: pide.altitud }).eficiencia * 100, 5, 45);
        $('#h-c-t').textContent = 'Eficiencia según el calor';
        $('#h-c-ley').textContent = '';
        $('#h-c-pie').textContent = 'Con calor pierde poco de eficiencia y mucho de potencia: el problema es que cabe menos aire, no que aproveche peor el gas. El condensador también trabaja peor, porque el agua de la torre sale más caliente.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Eficiencia según el calor', xMin: 5, xMax: 45, yMin: 50, yMax: 65, ticksX: [5, 15, 25, 35, 45], ticksY: [50, 55, 60, 65], etX: 'Temperatura del aire (°C)', etY: '% del gas', f: ef, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} °C · ${f1(ef(x))} %` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Aire', 'Eficiencia'], [5, 15, 25, 35, 45].map(t => [`${num(t)} °C`, `${f1(ef(t))} %`]));
    } else {
        const A = ARRANQUES[pide.tipo];
        const f = min => { const a = arranque(min, pide.tipo); return central({ ...clima, carga: Math.max(a.tg, 0.001), cargaVapor: Math.max(a.tg, 0.001), vapor: a.vapor }); };
        const lineas = [
            { clase: 'h-s-actual', nombre: 'Total a la red', f: tabla41(x => (arranque(x, pide.tipo).tg > 0 ? f(x).neta : 0), 0, A.total) },
            { clase: 'h-s-max', nombre: 'Turbinas de gas', f: tabla41(x => (arranque(x, pide.tipo).tg > 0 ? f(x).brutaGas : 0), 0, A.total) },
            { clase: 'h-s-sin', nombre: 'Turbina de vapor', f: tabla41(x => (arranque(x, pide.tipo).tg > 0 ? f(x).brutaVapor : 0), 0, A.total) },
        ];
        const ticks = pide.tipo === 'frio' ? [0, 60, 120, 180, 240] : [0, 10, 20, 30];
        $('#h-b-t').textContent = `Megawatts en un arranque ${pide.tipo === 'frio' ? 'en frío' : 'en caliente'}`;
        $('#h-b-ley').innerHTML = leyenda(lineas);
        $('#h-b-pie').textContent = pide.tipo === 'frio'
            ? 'Tras muchas horas parada, el metal está frío: subir de golpe lo dañaría. La turbina de gas espera con poca carga hasta que todo se calienta. JICA pide un máximo de 240 minutos en una planta de clase F.'
            : `Con el equipo aún caliente: Siemens da plena carga en 30 minutos, subiendo ${num(RAMPA_MW_MIN)} MW por minuto cada turbina de gas, y la de vapor arranca sin esperar a que terminen.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Megawatts en el arranque', xMin: 0, xMax: A.total, yMin: 0, yMax: MAX_MW, ticksX: ticks, ticksY: ticksMW, etX: 'Minutos desde la orden', etY: 'MW', lineas, fx: x => num(x), fy: y => num(y), punta: x => `Minuto ${num(x)} · total ${num(lineas[0].f(x))} · gas ${num(lineas[1].f(x))} · vapor ${num(lineas[2].f(x))} MW` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Minuto', 'Total', 'Gas', 'Vapor'], ticks.map(x => [num(x), num(lineas[0].f(x)), num(lineas[1].f(x)), num(lineas[2].f(x))]));
        const cal = x => arranque(x, 'caliente');
        const fri = x => arranque(x, 'frio');
        const pot = (a, d) => (a.tg > 0 ? central({ dos: d, carga: Math.max(a.tg, 0.001), cargaVapor: Math.max(a.tg, 0.001), vapor: a.vapor }).neta / central({ dos: d }).neta : 0);
        const l2 = [{ clase: 'h-s-max', nombre: 'En caliente', f: tabla41(x => pot(cal(x), pide.dos) * 100, 0, 240) }, { clase: 'h-s-sin', nombre: 'En frío', f: tabla41(x => pot(fri(x), pide.dos) * 100, 0, 240) }];
        $('#h-c-t').textContent = 'Caliente contra frío';
        $('#h-c-ley').innerHTML = leyenda(l2);
        $('#h-c-pie').textContent = 'Por eso, si se espera que el sistema la pida pronto, conviene mantenerla caliente. Cuando cae el sol, las centrales que ya están listas son las que ayudan.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Caliente contra frío', xMin: 0, xMax: 240, yMin: 0, yMax: 105, ticksX: [0, 60, 120, 180, 240], ticksY: [0, 25, 50, 75, 100], etX: 'Minutos desde la orden', etY: '% de plena carga', lineas: l2, fx: x => num(x), fy: y => num(y), punta: x => `Minuto ${num(x)} · caliente ${num(l2[0].f(x))} % · frío ${num(l2[1].f(x))} %` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Tipo', 'Minutos a plena carga', 'Fuente'], [['En caliente', '30', 'Siemens'], ['En frío', 'Hasta 240', 'JICA']]);
    }
}
function pintarBarras(L, pag) {
    const { $, pide } = pag;
    const c = L.c;
    const R = c.reparto;
    let filas;
    if (pide.modo === 'clima') {
        const ref = central({ dos: pide.dos }).neta;
        const soloT = central({ dos: pide.dos, tAire: pide.tAire }).neta;
        const soloA = central({ dos: pide.dos, altitud: pide.altitud }).neta;
        const conE = central({ dos: pide.dos, tAire: pide.tAire, altitud: pide.altitud, enfriar: true }).neta;
        filas = [{ t: 'Catálogo: 15 °C, nivel del mar', v: 1, escala: 1.1 }, { t: `Con ${num(pide.tAire)} °C`, v: soloT / ref, escala: 1.1 }, { t: `A ${num(pide.altitud)} m`, v: soloA / ref, escala: 1.1 }, { t: 'Con las dos', v: c.neta / ref, activa: true, escala: 1.1 }, { t: 'Con enfriador', v: conE / ref, escala: 1.1 }];
        $('#h-d-t').textContent = 'Lo que da, de cada 100 del catálogo';
        $('#h-d-pie').textContent = 'En un caso real de Power Engineering, enfriar el aire 12 °C recuperó cerca de 8.5 %. Solo sirve donde el aire es seco: no puede bajar del bulbo húmedo.';
    } else if (pide.modo === 'arranque') {
        const A = L.arranque;
        filas = ARRANQUES[pide.tipo].etapas.map(e => ({ t: e[0], v: clamp01((A.min - e[1]) / Math.max(0.01, e[2] - e[1])), activa: A.min >= e[1] && A.min < e[2] }));
        $('#h-d-t').textContent = 'Por dónde va, de cada 100';
        $('#h-d-pie').textContent = 'Las etapas se enciman: la turbina de vapor empieza antes de que termine de subir la de gas.';
    } else {
        filas = [{ t: 'Electricidad, turbinas de gas', v: R.gas, activa: true }, { t: 'Electricidad, turbina de vapor', v: R.vapor, activa: true }, { t: 'Se va en la torre', v: R.torre }, { t: 'Se va por la chimenea', v: R.chimenea }, { t: 'La usa la propia central', v: R.propia, d: 1 }];
        $('#h-d-t').textContent = 'A dónde va cada 100 del gas';
        $('#h-d-pie').textContent = pide.modo === 'abierto' ? 'Sin recuperador no hay vapor ni torre: lo demás se va por la chimenea, muy caliente.' : 'Toda central de vapor tira calor en su condensador: sin esa parte fría, la turbina no podría girar.';
    }
    $('#h-barras').innerHTML = barrasHTML(filas);
}
function alPintarFijas({ $ }) {
    $('#h-pesa').innerHTML = barrasHTML([{ t: 'Electricidad, enero a septiembre de 2025', v: 0.61, activa: true }, { t: 'Electricidad, 2022', v: 0.5505 }, { t: 'Capacidad instalada, 2025', v: 0.43 }, { t: 'Horas que trabajan al año', v: 0.683 }]);
    $('#h-arreglos').innerHTML = tablaHTML(['', '1×1', '2×1'], [
        ['Turbinas de gas', '1', '2'],
        ['Recuperadores', '1', '2'],
        ['Turbinas de vapor', '1', '1'],
        ['Catálogo, MW', num(EQUIPO.unoPorUno), num(EQUIPO.dosPorUno)],
        ['Este modelo, MW', num(UNO.neta), num(BASE.neta)],
        ['Eficiencia del modelo', `${f1(UNO.eficiencia * 100)} %`, `${f1(BASE.eficiencia * 100)} %`],
    ]);
    $('#h-comparar').innerHTML = tablaHTML(['', 'Abierto', 'Combinado'], [
        ['Aprovecha del gas', `${num(ABIERTO.eficiencia * 100)} %`, `${num(BASE.eficiencia * 100)} %`],
        ['MW con el mismo gas', num(ABIERTO.neta), num(BASE.neta)],
        ['Gases a la chimenea', `${num(ABIERTO.tChim)} °C`, `${num(BASE.tChim)} °C`],
        ['CO₂ por MWh', `${num(ABIERTO.co2MWh, 2)} t`, `${num(BASE.co2MWh, 2)} t`],
        ['Agua de enfriamiento', 'Casi nada', `${num(BASE.evapora)} t/h que se evaporan`],
        ['Arranque', 'Más rápido', 'El vapor tarda'],
    ]);
    $('#h-mexico').innerHTML = `<thead><tr><th scope="col">Central</th><th scope="col">Arreglo</th><th scope="col">MW</th></tr></thead><tbody>${[
        ['Empalme I', 'Sonora, SGT6-8000H', '2×1', num(EQUIPO.empalme1)],
        ['Empalme II', 'Sonora, SGT6-8000H', '2×1', num(EQUIPO.empalme2)],
        ['Salamanca', 'Guanajuato, 2025', '—', '958'],
        ['Villa de Reyes', 'San Luis Potosí, 2025', '—', '449'],
        ['El Sauz II', 'Querétaro, 2025', '—', '269'],
    ].map(([n, d, a, m]) => `<tr><td><b>${n}</b><small>${d}</small></td><td>${a}</td><td>${m}</td></tr>`).join('')}</tbody>`;
}
function alActualizar(L, pag) {
    const { pide, ponerCifra, ponerLecturas, nivel, graficas } = pag;
    const c = L.c;
    const g = c.g;
    const n = L.neta;
    pintarBarras(L, pag);
    const lenta = Math.abs(L.carga - L.cargaVapor) > 0.03;
    if (pide.modo === 'combinado') {
        ponerLecturas([['A la red', num(n), 'MW'], ['Turbinas de gas', num(c.brutaGas), 'MW'], ['Turbina de vapor', num(c.brutaVapor), 'MW'], ['Aprovecha', num(c.eficiencia * 100, 1), '% del gas'], ['Gas', num(c.m3Dia, 1), 'millones de m³ al día'], ['CO₂', num(c.co2MWh, 2), 't por MWh']], lenta ? 'La turbina de gas ya llegó; la de vapor viene detrás, porque el recuperador tarda en cambiar de temperatura.' : null);
        ponerCifra('hud', `${num(n)} MW`);
        ponerCifra('hud2', `${pide.dos ? '2×1' : '1×1'}: ${num(c.brutaGas)} de gas y ${num(c.brutaVapor)} de vapor`);
        graficas.b?.marcar(L.carga * 100, n);
        nivel(1, 'Gas', L.carga, `${num(L.carga * 100)} %`);
        nivel(2, 'Vapor', c.brutaVapor / (c.n * 160), `${num(c.brutaVapor)} MW`);
    } else if (pide.modo === 'abierto') {
        const cerrando = c.abierto < 0.98;
        ponerLecturas([['A la red', num(n), 'MW'], ['Turbinas de gas', num(c.brutaGas), 'MW'], ['Turbina de vapor', num(c.brutaVapor), 'MW'], ['Aprovecha', num(c.eficiencia * 100, 1), '% del gas'], ['Gases a la chimenea', num(g.tEscape), '°C'], ['CO₂', num(c.co2MWh, 2), 't por MWh']], cerrando ? 'La compuerta está cambiando: el recuperador se va quedando sin gases calientes y el vapor se acaba.' : null);
        ponerCifra('hud', `${num(n)} MW`);
        ponerCifra('hud2', `solo con las turbinas de gas: ${num(c.eficiencia * 100)} %`);
        graficas.b?.marcar(L.carga * 100, c.eficiencia * 100);
        graficas.c?.marcar(L.carga * 100, c.co2MWh);
        nivel(1, 'Gas', L.carga, `${num(L.carga * 100)} %`);
        nivel(2, 'Compuerta', c.abierto, `${num(c.abierto * 100)} % abierta`);
    } else if (pide.modo === 'clima') {
        const ref = central({ dos: pide.dos }).neta;
        const aviso = pide.tAire >= 38 ? 'Mucho calor: entra menos aire y, además, el agua de la torre sale más caliente y el condensador empeora.' : pide.altitud >= 1500 ? 'A esta altura el aire pesa bastante menos. Por eso una central en el Altiplano no da lo mismo que en la costa con el mismo equipo.' : null;
        ponerLecturas([['A la red', num(n), 'MW'], ['Del catálogo', num((n / ref) * 100), '%'], ['Aire al compresor', num(g.tAireC), '°C'], ['Aire', num(g.m), 'kg/s por turbina'], ['Aprovecha', num(c.eficiencia * 100, 1), '% del gas'], ['Condensador', num(c.st.tC), '°C']], aviso);
        ponerCifra('hud', `${num(n)} MW`);
        ponerCifra('hud2', `con ${num(pide.tAire)} °C a ${num(pide.altitud)} m`);
        const serie = pide.altitud < 500 ? 0 : pide.altitud < 1600 ? 1 : 2;
        const alt = [0, 1000, 2240][serie];
        graficas.b?.marcar(pide.tAire, alt === pide.altitud ? n : graficas.b.cfg.lineas[serie].f(pide.tAire));
        graficas.c?.marcar(pide.tAire, c.eficiencia * 100);
        nivel(1, 'Aire', g.m / 625.3, `${num((g.m / 625.3) * 100)} %`);
        nivel(2, 'Enfriador', pide.enfriar ? 1 : 0, pide.enfriar ? 'Encendido' : 'Apagado');
    } else {
        const A = L.arranque;
        ponerLecturas([['A la red', num(n), 'MW'], ['Turbinas de gas', num(A.tg > 0 ? c.brutaGas : 0), 'MW'], ['Turbina de vapor', num(A.tg > 0 ? c.brutaVapor : 0), 'MW'], ['Tiempo', num(A.min), 'minutos'], ['Falta', num(A.total - A.min), 'minutos'], ['Etapa', A.min >= A.total ? 'Lista' : `${A.etapa.split(' ')[0]}…`, A.min >= A.total ? 'a plena carga' : 'ver abajo']], A.min >= A.total ? 'Ya está a plena carga. Pulsa «Seguir los minutos» para verlo otra vez.' : A.etapa);
        ponerCifra('hud', `${num(n)} MW`);
        ponerCifra('hud2', `minuto ${num(A.min)} de ${num(A.total)}, ${A.tipo === 'frio' ? 'en frío' : 'en caliente'}`);
        graficas.b?.ahora(A.min);
        graficas.c?.ahora(A.min);
        nivel(1, 'Gas', A.tg, `${num(A.tg * 100)} %`);
        nivel(2, 'Vapor', A.vapor, `${num(A.vapor * 100)} %`);
    }
}

// ------------------------------------------------------------------ la central
let planta = estadoPlanta({ carga: DEF.carga / 100 });
const mover = { verDos: 1 };

crearPagina({
    figura: FIGURA,
    fichas: FICHAS,
    vistas: VISTAS,
    modos: MODOS,
    botones: BOTONES,
    acciones: ACCIONES,
    modo0: 'combinado',
    pide: { carga: DEF.carga, tAire: DEF.tAire, altitud: DEF.altitud, minutos: DEF.minutos, tipo: 'caliente', dos: true, enfriar: false },
    general: { Lx: 15.4, Lz: 8.6, alto: 6.2, mira: [0.27, 1.45, 0.25], az: -20, el: 22, azVertical: -14, elVertical: 26 },
    etiquetas: { lienzo: 'Central de ciclo combinado en 3D: arrastra para girarla, toca un punto para conocerlo' },
    textoFinal: 'Toca cualquier punto para volver a verlo. Mueve la carga y mira cómo responde primero la turbina de gas, prueba el ciclo abierto, sube el calor en «Clima» o mira cómo arranca.',
    colores: { fondoTinta: '#3a3b40', tintaSuave: '#8a8d93', elec: FLUIDOS.elec.color, caliente: FLUIDOS.caliente.color, frio: FLUIDOS.frio.color, torre: FLUIDOS.torre.color, aire: FLUIDOS.aire.color },
    crearDiagrama,
    secciones,
    escena: (renderer, scene, { movil, oscuro }) => {
        const M = materiales(P_PLANTA);
        const est = escenario(renderer, scene, M, { movil, oscuro });
        return { planta: construir(M, P_PLANTA, { movil }), est };
    },
    alCambiarModo: (p, m, reducir) => {
        if (m === 'arranque') { p.minutos = 0; p.corre = !reducir; }
        else p.corre = false;
        if (m === 'clima') { p.tAntes = p.tAire; if (p.tAire === DEF.tAire && p.altitud === DEF.altitud) p.tAire = 35; }
        if (p.modo === 'clima') { p.tAire = p.tAntes ?? DEF.tAire; p.altitud = DEF.altitud; p.enfriar = false; }
    },
    alCuadro: ({ dt, pide }) => {
        planta = pasoPlanta(planta, { modo: pide.modo, carga: pide.carga / 100, min: pide.minutos, tipo: pide.tipo }, dt);
        mover.verDos += clamp((pide.dos ? 1 : 0) - mover.verDos, -dt / 1.1, dt / 1.1);
    },
    poseDe: ({ pide, ve, encendido, t, dt, camara }) => pose({ modo: pide.modo, planta, carga: pide.carga / 100, tAire: pide.tAire, altitud: pide.altitud, humedad: DEF.humedad, enfriar: pide.enfriar, dos: pide.dos, min: pide.minutos, tipo: pide.tipo, noche: ve.noche, adentro: ve.adentro, desarme: ve.desarme, encendido, verDos: mover.verDos, t, dt, camara }),
    firma: p => [p.modo, p.tAire, p.altitud, p.enfriar, p.dos, p.tipo],
    alPintarFijas,
    alPintarGraficas,
    alActualizar,
    prueba: p => ({ carga: +planta.tg.toFixed(3), vapor: +planta.vapor.toFixed(3), abierto: +planta.abierto.toFixed(3), minutos: +p.minutos.toFixed(1), dos: p.dos, tAire: p.tAire, altitud: p.altitud, tipo: p.tipo }),
});
