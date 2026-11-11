// «Almacenamiento de energía (SAEE)», en 3D y con el formato Búho de «¿Cómo funciona?». Un sitio de ejemplo en la zona de Chihuahua con
// las cinco formas de integrar un Sistema de Almacenamiento de Energía Eléctrica que reconocen las Disposiciones de la CNE: no asociado,
// junto a una central solar, en una fábrica, de la red y en una mina sin red. Cuatro formas de verlo: compra y venta con los precios reales
// del CENACE, junto a la central, el tolling con la CFE y sin red.
// Se arma con: node scripts/build-conceptos-3d.mjs saee
//
// Lo que se repite entre las plantas con física está en conceptos-3d/planta-comun/.
import { clamp01, num } from '../planta-comun/ayudas.js';
import { barrasHTML, leyenda, pintarGrafica, seccionBarras, seccionColores, seccionDiagrama, seccionFuentes, seccionGrafica, seccionTabla, tablaHTML } from '../planta-comun/graficas.js';
import { crearPagina } from '../planta-comun/pagina.js';
import { ATB, CENTRAL, CONVOCATORIA, DEF, EIA, FLUIDOS, LIMITES, MESES, MINA, PARTES as PARTES_M, SAEE, aislado, anio, dieselLh, estadoPlanta, factorPlanta, junto, pasoPlanta, perfilAnual, pose, tolling, totalConvocatoria } from './modelo.js';
import { P_PLANTA, construir, escenario, materiales } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';

const FIGURA = 'saee';
const f1 = x => num(x, 1);
const mill = x => num(x / 1e6, 1);
const hm = h => `${Math.floor(h)}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`;
const nombreMes = m => MESES[Math.round(m)]?.nombre ?? '';
const corto = m => MESES[Math.round(m)]?.corto ?? '';
const A = anio();
const MINA_SEP = aislado({});
const PERFIL_A = perfilAnual();

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'contenedores', nombre: 'Contenedores de baterías', modo: 'mercado', abrir: true, accion: 'septiembre', eq: `${SAEE.P} MW · ${num(SAEE.P * SAEE.horas)} MWh · ${SAEE.horas} horas`, recorrido: { noche: false, adentro: true },
        icono: '<rect x="3" y="8" width="18" height="9" rx="1.5"/><path d="M7 8v9M11 8v9M15 8v9"/>',
        texto: `Diez contenedores con celdas de litio. Juntos dan ${SAEE.P} MW durante ${SAEE.horas} horas, como pide la convocatoria de la SENER. Guardan energía cuando sobra y la regresan cuando falta: de cada 100 MWh, unos ${num(ATB.ida * 100)}.` },
    { parte: 'clima', nombre: 'Clima del contenedor', modo: 'mercado', abrir: true, accion: 'febrero', eq: 'Trabaja más al cargar y descargar', recorrido: { noche: false, adentro: true },
        icono: '<circle cx="12" cy="12" r="7"/><path d="M12 5v14M5 12h14M7 7l10 10M17 7 7 17"/>',
        texto: 'Cada contenedor lleva su aire acondicionado, que trabaja más mientras la batería carga o descarga. Para estudiar un SAEE, el CENACE pide su tecnología, su capacidad, su potencia, qué tan rápido responde y qué tan hondo se descarga.' },
    { parte: 'pcs', nombre: 'Inversores bidireccionales', modo: 'mercado', abrir: true, accion: 'nueve', eq: 'De directa a alterna, en los dos sentidos', recorrido: { noche: false, adentro: true },
        icono: '<path d="M4 9h12l-3-3M20 15H8l3 3"/>',
        texto: 'Las baterías guardan corriente directa y la red es alterna. Estos inversores la convierten en los dos sentidos: para cargar toman de la red y para descargar le entregan. Ellos deciden cuánta potencia entra o sale.' },
    { parte: 'control', nombre: 'Control del SAEE', modo: 'mercado', accion: 'mediodia', eq: 'Ofertas al mercado', recorrido: { noche: false, adentro: false },
        icono: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M9 20h6M12 16v4M7 12l3-3 2 2 4-4"/>',
        texto: 'Aquí se decide cuándo cargar y cuándo descargar. En un SAEE no asociado decide la Almacenadora, que ofrece comprar y vender en el mercado; el CENACE manda el despacho y, si la red lo necesita, puede darle instrucciones en cualquier momento.' },
    { parte: 'trafo', nombre: 'Transformador elevador', modo: 'mercado', accion: 'nueve', eq: 'Sube el voltaje para la subestación', recorrido: { noche: false, adentro: false },
        icono: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
        texto: 'Sube el voltaje para llegar a la subestación; al cargar, la energía va al revés. Para las reglas, al tomar energía el SAEE es un centro de carga, y al entregarla, una central.' },
    { parte: 'medidor', nombre: 'Sistema de medición', modo: 'tolling', accion: 'pagoAlto', eq: 'Lo que entra y lo que sale', recorrido: { noche: false, adentro: false },
        icono: '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
        texto: 'Mide hora por hora lo que la batería toma y lo que entrega en su punto de interconexión. Con eso se liquida en el mercado. Todo SAEE que opera en el mercado debe tenerlo, sea cual sea su modalidad.' },
    { parte: 'subestacion', nombre: 'Subestación', modo: 'mercado', accion: 'septiembre', eq: 'Llega la Red Nacional de Transmisión', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 20V8l8-4 8 4v12M8 20v-6h8v6"/>',
        texto: 'Aquí llegan la batería, la central y la Red Nacional de Transmisión (RNT), y de aquí sale la energía de la fábrica. Para conectarse, el SAEE presenta una sola solicitud de estudios al CENACE: para tomar energía y para entregarla.' },
    { parte: 'cenace', nombre: 'CENACE', modo: 'mercado', accion: 'febrero', eq: 'Despacha y estudia', recorrido: { noche: false, adentro: false },
        icono: '<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M8 9V6h8v3M12 13v3"/>',
        texto: 'El Centro Nacional de Control de Energía (CENACE) despacha cada hora y estudia cada conexión. Con una central de sol o de viento puede pedirle un SAEE o concluir que no hace falta. También puede contratar SAEE no asociados para la confiabilidad.' },
    { parte: 'central', nombre: 'Central solar', modo: 'central', accion: 'mayo', eq: `${CENTRAL.mwCA} MW, contrato de ${CENTRAL.contrato} MW`, recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 18 7 8h10l3 10z"/><path d="M8 13h8M11 8l-1 10M13 8l1 10"/>',
        texto: `Una central de ejemplo de ${CENTRAL.mwCA} MW con contrato de interconexión de ${CENTRAL.contrato} MW: a mediodía de primavera da más de lo que puede entregar. Sin batería eso se tira; con batería se guarda para la noche. Nunca entrega más que su contrato.` },
    { parte: 'saeeCE', nombre: 'SAEE de la central', modo: 'central', abrir: true, accion: 'sinBateria', eq: '30 % de la central, 3 horas', recorrido: { noche: false, adentro: true },
        icono: '<rect x="3" y="9" width="12" height="8" rx="1.5"/><path d="M15 12h2M19 6l-2 4h3l-2 4"/>',
        texto: 'Es parte de la central: no necesita permiso de almacenamiento y vende por medio de quien representa a la central. Solo se permite en centrales de Energías Renovables. Se carga con la central o, si lo declara, con la red.' },
    { parte: 'fabrica', nombre: 'Fábrica con SAEE', modo: 'mercado', abrir: true, accion: 'mediodia', eq: 'No inyecta ni vende', recorrido: { noche: false, adentro: false },
        icono: '<path d="M3 20V10l5 3V10l5 3V7l8 4v9z"/>',
        texto: 'Un centro de carga puede tener su SAEE sin permiso. Solo se carga desde su punto de conexión, sin pasar de su demanda contratada, y usa esa energía en el sitio: no puede inyectarla a la red ni venderla.' },
    { parte: 'saeeRed', nombre: 'SAEE de la red', modo: 'mercado', abrir: true, accion: 'nueve', eq: 'De la Transportista o la Distribuidora', recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 3v18M6 7h12M8 7l-3 6h6zM16 7l-3 6h6z"/>',
        texto: 'Es parte de la red y solo puede ser de la Transportista o de la Distribuidora. Lo opera el CENACE para la confiabilidad; la energía que toma y entrega no se paga ni se cobra, y sus costos van a las tarifas reguladas.' },
    { parte: 'mina', nombre: 'Mina sin red', modo: 'aislado', abrir: true, accion: 'sinBateriaMina', eq: 'Autoconsumo aislado', recorrido: { noche: false, adentro: false },
        icono: '<path d="M4 20h16M7 20V9h10v11M7 9l5-5 5 5"/>',
        texto: 'Lejos de la red, produce su propia energía: es autoconsumo aislado, sin conexión a la Red Nacional de Transmisión ni a las Redes Generales de Distribución. Lo que antes era abasto aislado hoy se resuelve así. Su SAEE se carga con sus paneles.' },
    { parte: 'diesel', nombre: 'Planta diésel', modo: 'aislado', accion: 'nublado', eq: `Unos ${num(MINA_SEP.litros, 0)} L al día en septiembre`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="4" y="9" width="14" height="9" rx="1.5"/><path d="M14 9V5h3v4M8 13h6"/>',
        texto: 'Entra cuando no hay sol ni batería. Gasta una parte fija solo por estar prendida y otra por cada kWh, como en la curva de ejemplo del manual de HOMER. Cada hora de batería le quita horas de trabajo y litros de diésel.' },
];
const VISTAS = Object.fromEntries(PARTES_M.map(p => [p.id, p.vista]));
let planta = estadoPlanta();
const relojDia = { texto: 'el día', avanzar: (p, dt) => { p.hora = (p.hora + dt * 1.2) % 24; return false; }, alSeguir: () => {} };
const MODOS = {
    mercado: { nombre: 'Compra y venta', corto: 'Mercado', resumen: 'El SAEE no asociado compra energía cuando está barata y la vende cuando está cara. Con los precios reales de Chihuahua: lo más barato, a mediodía; lo más caro, a las 9 de la noche. Elige el mes y las horas que guarda.', aclara: 'Precios del CENACE, zona de carga Chihuahua, Mercado del Día en Adelanto. La batería hace a lo más un ciclo al día y carga antes de descargar. No se cuentan la potencia ni los servicios conexos, que también se pagan.', mando: { nombre: 'Mes', campo: 'mes', rango: LIMITES.mes, texto: v => `${nombreMes(v)} de ${MESES[Math.round(v)].anio}` }, mando2: { nombre: 'Horas que guarda', campo: 'horas', rango: LIMITES.horas, texto: v => `${f1(v)} h · ${num(SAEE.P * v)} MWh` }, reloj: relojDia },
    central: { nombre: 'Junto a la central', corto: 'Central', resumen: 'La batería de la central guarda lo que no cabe en su contrato y lo del mediodía barato, y lo entrega en la noche cara. Cambia el mes y el tamaño de la batería.', aclara: 'Central, contrato y batería de ejemplo, con el sol de Chihuahua (NASA POWER) y los precios reales del mes. Se carga solo con la central.', mando: { nombre: 'Mes', campo: 'mes', rango: LIMITES.mes, texto: v => `${nombreMes(v)} de ${MESES[Math.round(v)].anio}` }, mando2: { nombre: 'Tamaño de la batería', campo: 'pct', rango: LIMITES.pct, texto: v => `${num(v)} % · ${num((CENTRAL.contrato * v) / 100)} MW, 3 h` }, reloj: relojDia },
    tolling: { nombre: 'El tolling', corto: 'Tolling', resumen: 'En un tolling, la CFE paga a la Almacenadora un monto fijo al mes, decide cuándo carga y descarga la batería y se queda con lo que gane en el mercado. Mueve el pago y la suerte del año.', aclara: 'El pago fijo es de ejemplo: los contratos no son públicos. El mercado es lo que habría ganado la batería de 100 MW y 3 horas con los precios reales del año, sin contar potencia ni costos. Con inversión mixta la CFE es dueña de al menos 54 % del proyecto, así que parte del pago regresa a ella.', mando: { nombre: 'Pago fijo', campo: 'pago', rango: LIMITES.pago, texto: v => `${num(v)} mil $ por MW al mes` }, mando2: { nombre: 'Precios del año', campo: 'factor', rango: LIMITES.factor, texto: v => (Math.abs(v - 1) < 0.03 ? 'como los de 2025-2026' : `${num(v * 100)} % de los de 2025-2026`) } },
    aislado: { nombre: 'Sin red', corto: 'Aislado', resumen: 'La mina no tiene red: de día usa el sol, guarda lo que sobra y en la noche usa la batería; cuando no alcanza, prende la planta diésel. Cambia las horas de batería y las nubes.', aclara: 'Mina, paneles y demanda de ejemplo, con el sol de Chihuahua (NASA POWER). El diésel sigue la curva de ejemplo del manual de HOMER.', mando: { nombre: 'Horas de batería', campo: 'horasMina', rango: LIMITES.horasMina, texto: v => `${f1(v)} h · ${f1(MINA.bateria * v)} MWh` }, mando2: { nombre: 'Nubes', campo: 'nubes', rango: LIMITES.nubes, texto: v => `${num(v * 100)} % menos sol` }, reloj: relojDia },
};
const BOTONES = [
    { id: 'esquema', visible: p => p.modo === 'tolling', pulsado: () => false, texto: p => (p.esquema === 'mixta' ? 'Esquema: inversión mixta' : 'Esquema: largo plazo'), alTocar: p => { p.esquema = p.esquema === 'mixta' ? 'plp' : 'mixta'; } },
];
const ACCIONES = {
    septiembre: { texto: p => (Math.round(p.mes) === 10 ? 'Ver febrero' : 'Ver septiembre'), hacer: (p, pag) => { p.mes = Math.round(p.mes) === 10 ? 3 : 10; p.hora = 20.5; pag.invalidar(); pag.ponerMando(); } },
    febrero: { texto: p => (Math.round(p.mes) === 3 ? 'Ver septiembre' : 'Ver febrero'), hacer: (p, pag) => { p.mes = Math.round(p.mes) === 3 ? 10 : 3; p.hora = 12.5; pag.invalidar(); pag.ponerMando(); } },
    nueve: { texto: () => 'Ver las 9 de la noche', hacer: (p, pag) => { p.hora = 21; p.corre = false; pag.invalidar(); pag.rotular(); } },
    mediodia: { texto: () => 'Ver el mediodía', hacer: (p, pag) => { p.hora = 12.5; p.corre = false; pag.invalidar(); pag.rotular(); } },
    mayo: { texto: () => 'Mediodía de mayo', hacer: (p, pag) => { p.mes = 6; p.hora = 12.5; p.corre = false; pag.invalidar(); pag.ponerMando(); } },
    sinBateria: { texto: p => (p.pct > 0 ? 'Quitar la batería' : 'Poner 30 % de batería'), hacer: (p, pag) => { p.pct = p.pct > 0 ? 0 : 30; pag.invalidar(); pag.ponerMando(); } },
    pagoAlto: { texto: p => (p.pago > 60 ? 'Pago de 60 mil' : 'Pago de 90 mil'), hacer: (p, pag) => { p.pago = p.pago > 60 ? 60 : 90; pag.invalidar(); pag.ponerMando(); } },
    sinBateriaMina: { texto: p => (p.horasMina > 0 ? 'Quitar la batería' : 'Poner 4 horas'), hacer: (p, pag) => { p.horasMina = p.horasMina > 0 ? 0 : 4; pag.invalidar(); pag.ponerMando(); } },
    nublado: { texto: p => (p.nubes > 0.3 ? 'Día despejado' : 'Día nublado'), hacer: (p, pag) => { p.nubes = p.nubes > 0.3 ? 0 : 0.6; pag.invalidar(); pag.ponerMando(); } },
};

// ------------------------------------------------------------------ el tablero
const secciones = () => `
    ${seccionDiagrama('Lo que pasa en el día')}
    ${seccionGrafica('b')}
    ${seccionGrafica('c')}
    ${seccionBarras()}
    ${seccionTabla('Las cinco formas de tener un SAEE', 'h-modalidades', 'Disposiciones de la CNE del 16 de abril de 2026 y Reglamento de la Ley del Sector Eléctrico, art. 193.')}
    ${seccionTabla('Lo que busca la convocatoria de la SENER', 'h-convocatoria', 'Segunda y cuarta modificaciones, Diario Oficial de la Federación, 10 de julio y 29 de octubre de 2026.')}
    ${seccionTabla('La batería y el año de precios', 'h-bateria', 'NREL/NLR ATB 2025, EIA y precios del CENACE.', 'h-tabla-texto')}
    ${seccionTabla('Lo que dice la ley', 'h-regla', 'Ley del Sector Eléctrico y su reglamento.')}
    ${seccionColores(FLUIDOS, 'Los precios, la batería de 3 horas, la eficiencia, el sol de Chihuahua y las reglas son reales; el sitio, los tamaños, la central, la fábrica, la mina, su demanda y el pago fijo del tolling son de ejemplo. La batería hace un ciclo al día.', 'Colores de lo que corre')}
    ${seccionFuentes(FUENTES, [
        { para: 'Qué es un SAEE, que la SENER fija cómo participan, que la CNE fija sus contraprestaciones, que pueden ofrecer energía, y qué es el autoconsumo aislado', titulo: 'Ley del Sector Eléctrico, arts. 3, fracc. L, 31, 32 y 82 a 85', nota: 'Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio' },
        { para: 'Qué es una Almacenadora, quién necesita permiso de almacenamiento, que el CENACE puede contratarlos y que no reciben CEL', titulo: 'Reglamento de la Ley del Sector Eléctrico, arts. 2, fracc. I, y 192 a 195', nota: 'Diario Oficial de la Federación, 3 de octubre de 2025. Está en el acervo de este sitio' },
    ])}`;

const MES_X = { xMin: 0, xMax: 11, ticksX: [0, 2, 4, 6, 8, 10], fx: x => corto(x) };
const HORA_X = { xMin: 0, xMax: 24, ticksX: [0, 6, 12, 18, 24], etX: 'Hora', fx: x => num(x) };
const escala = (max, paso) => { const tope = Math.max(paso, Math.ceil((max * 1.08) / paso) * paso); return { yMax: tope, ticksY: Array.from({ length: Math.floor(tope / paso) + 1 }, (_, i) => i * paso) }; };
const pasoDe = max => (max > 3000 ? 1000 : max > 1500 ? 500 : max > 600 ? 200 : max > 250 ? 100 : max > 100 ? 50 : max > 40 ? 10 : 5);
function alPintarGraficas(L, pag) {
    const { $, pide, graficas } = pag;
    const m = pide.modo;
    graficas.b = null;
    graficas.c = null;
    if (m === 'mercado') {
        const lb = [{ clase: 'h-s-actual', nombre: `Precio, ${L.M.nombre}`, f: x => L.perfil[Math.min(23, Math.floor(x))] }, { clase: 'h-s-sin', nombre: 'Promedio del año', f: x => PERFIL_A[Math.min(23, Math.floor(x))] }];
        const max = Math.max(...L.perfil, ...PERFIL_A);
        const e = escala(max, pasoDe(max));
        $('#h-b-t').textContent = 'El precio de cada hora';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `$/MWh en el día promedio de ${L.M.nombre}, zona de Chihuahua. La batería compra en las horas más baratas y vende en las más caras: carga de ${num(Math.min(...horasCon(L.d.carga)))} a ${num(Math.max(...horasCon(L.d.carga)) + 1)} h y descarga de ${num(Math.min(...horasCon(L.d.descarga)))} a ${num(Math.max(...horasCon(L.d.descarga)) + 1)} h.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'El precio de cada hora', ...HORA_X, yMin: 0, ...e, etY: '$/MWh', lineas: lb, fy: y => num(y), punta: x => `${num(Math.floor(x))}:00 · ${num(L.perfil[Math.min(23, Math.floor(x))])} $/MWh` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Hora', `Precio en ${L.M.corto}`, 'La batería'], Array.from({ length: 24 }, (_, h) => [`${h}:00`, `${num(L.perfil[h])} $`, L.d.carga[h] > 0.01 ? `toma ${num(L.d.carga[h])} MWh` : L.d.descarga[h] > 0.01 ? `entrega ${num(L.d.descarga[h])} MWh` : '—']));
        const lc = [{ clase: 'h-s-actual', nombre: `Con ${f1(L.horas)} h`, f: x => L.a.meses[Math.round(x)].ganancia / 1e6 }, ...(Math.abs(L.horas - SAEE.horas) > 0.05 ? [{ clase: 'h-s-sin', nombre: `Con ${SAEE.horas} h`, f: x => A.meses[Math.round(x)].ganancia / 1e6 }] : [])];
        const mx = Math.max(...L.a.meses.map(x => x.ganancia), ...A.meses.map(x => x.ganancia)) / 1e6;
        $('#h-c-t').textContent = 'Lo que ganó cada mes';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Millones de pesos al mes, sumando los días reales, con ${num(SAEE.P)} MW: comprar menos lo que vende. En el año, ${mill(L.a.total)} millones; septiembre deja casi diez veces lo de febrero.`;
        const qc = [{ clase: 'h-s-actual', puntos: L.a.meses.map((x, i) => [i, x.ganancia / 1e6]) }, ...(lc.length > 1 ? [{ clase: 'h-s-sin', puntos: A.meses.map((x, i) => [i, x.ganancia / 1e6]) }] : [])];
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Lo que ganó cada mes', ...MES_X, etX: 'Mes', yMin: 0, ...escala(mx, pasoDe(mx)), etY: 'millones de $', quebradas: qc, fy: y => num(y), punta: x => `${nombreMes(x)} · ${mill(L.a.meses[Math.round(x)].ganancia)} millones` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Mes', `Con ${f1(L.horas)} h`, 'Peor día', 'Mejor día'], L.a.meses.map(x => [`${x.nombre} ${x.anio}`, `${mill(x.ganancia)} millones`, `${num(x.peor / 1000)} mil`, `${num(x.mejor / 1000)} mil`]));
    } else if (m === 'central') {
        const lb = [{ clase: 'h-s-sin', nombre: 'La central, sin límite', f: x => L.c.bruta[Math.min(23, Math.floor(x))] }, { clase: 'h-s-actual', nombre: 'A la red, con batería', f: x => L.red[Math.min(23, Math.floor(x))] }, { clase: 'h-s-norma', nombre: `Contrato: ${CENTRAL.contrato} MW`, f: () => CENTRAL.contrato }];
        $('#h-b-t').textContent = `Un día de ${L.M.nombre}`;
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `MW, hora por hora. ${L.tirada > 0.5 ? `Sin batería se tirarían ${num(L.tirada)} MWh que no caben en el contrato; con ella se recuperan ${num(L.recuperada)}.` : 'Este mes no sobra nada del contrato: la batería solo mueve el mediodía a la noche.'} Después de las 18 h entrega ${num(L.tardeCon)} MWh, contra ${num(L.tardeSin)} sin batería.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: `Un día de ${L.M.nombre}`, ...HORA_X, yMin: 0, yMax: 260, ticksY: [0, 50, 100, 150, 200, 250], etY: 'MW', lineas: lb, fy: y => num(y), punta: x => { const h = Math.min(23, Math.floor(x)); return `${h}:00 · sin límite ${num(L.c.bruta[h])} MW · a la red ${num(L.red[h])} MW`; } });
        $('#h-tabla-b').innerHTML = tablaHTML(['Hora', 'Sin límite', 'A la red', 'Batería'], Array.from({ length: 24 }, (_, h) => [`${h}:00`, `${num(L.c.bruta[h])} MW`, `${num(L.red[h])} MW`, L.d.carga[h] > 0.01 ? `toma ${num(L.d.carga[h])}` : L.d.descarga[h] > 0.01 ? `entrega ${num(L.d.descarga[h])}` : '—']));
        const tam = [0, 10, 20, 30, 40, 50, 60];
        const extra = new Map(tam.map(p => [p, junto({ mes: L.mes, pct: p }).extra / 1000]));
        const fino = Array.from({ length: 13 }, (_, i) => [i * 5, junto({ mes: L.mes, pct: i * 5 }).extra / 1000]);
        const lc = [{ clase: 'h-s-actual', nombre: `Día promedio de ${L.M.nombre}` }];
        const mx = Math.max(...extra.values());
        $('#h-c-t').textContent = 'Lo que gana de más, según la batería';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = 'Miles de pesos más al día que la misma central sin batería, con los precios del día promedio. Crece con la batería, pero cada MW de más gana menos: ya no hay tanto que mover.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Lo que gana de más', xMin: 0, xMax: 60, ticksX: [0, 20, 40, 60], etX: 'Batería, % de la central', yMin: 0, ...escala(mx, pasoDe(mx)), etY: 'miles de $', quebradas: [{ clase: 'h-s-actual', puntos: fino }], fx: x => num(x), fy: y => num(y), punta: x => { const k = Math.round(x / 5); return `${num(k * 5)} % · ${num(fino[Math.min(12, k)][1])} mil $ al día`; } });
        $('#h-tabla-c').innerHTML = tablaHTML(['Batería', 'MW', 'Ingreso extra al día'], tam.map(p => [`${p} %`, num((CENTRAL.contrato * p) / 100), `${num(extra.get(p))} mil $`]));
    } else if (m === 'tolling') {
        const Tt = L.T;
        const lb = [{ clase: 'h-s-actual', nombre: 'Lo que da el mercado', f: x => Tt.meses[Math.round(x)].mercado / 1e6 }, { clase: 'h-s-norma', nombre: 'Pago fijo', f: () => Tt.meses[0].fijo / 1e6 }];
        const mx = Math.max(...Tt.meses.map(x => x.mercado), Tt.meses[0].fijo) / 1e6;
        $('#h-b-t').textContent = 'El mercado y el pago fijo, cada mes';
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `Millones de pesos al mes. La Almacenadora cobra siempre lo mismo; la CFE se queda con la diferencia: gana en ${12 - Tt.mesesPierde} meses y pone de su bolsa en ${Tt.mesesPierde}.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'El mercado y el pago fijo', ...MES_X, etX: 'Mes', yMin: 0, ...escala(mx, pasoDe(mx)), etY: 'millones de $', quebradas: [{ clase: 'h-s-actual', puntos: Tt.meses.map((x, i) => [i, x.mercado / 1e6]) }], lineas: [lb[1]], fy: y => num(y), punta: x => `${nombreMes(x)} · mercado ${mill(Tt.meses[Math.round(x)].mercado)} · pago ${mill(Tt.meses[0].fijo)} millones` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Mes', 'Mercado', 'Pago fijo', 'Le queda a la CFE'], Tt.meses.map(x => [`${x.nombre} ${x.anio}`, `${mill(x.mercado)}`, `${mill(x.fijo)}`, `${x.cfe < 0 ? '−' : ''}${mill(Math.abs(x.cfe))}`]));
        const lc = [{ clase: 'h-s-actual', nombre: 'Le queda a la CFE', f: x => tolling({ pago: x, factor: pide.factor, esquema: 'plp' }).cfeAnio / 1e6 }, { clase: 'h-s-azul', nombre: 'Cobra la Almacenadora', f: x => (x * 1000 * SAEE.P * 12) / 1e6 }];
        $('#h-c-t').textContent = 'Quién se queda con qué en el año';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = `Millones de pesos al año según el pago fijo, sin contar costos. Con los precios de 2025-2026 la CFE queda tablas con unos ${num(Tt.empate * pide.factor)} mil $ por MW al mes; arriba de eso pierde.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Quién se queda con qué', xMin: 0, xMax: 150, ticksX: [0, 50, 100, 150], etX: 'Pago fijo, mil $ por MW al mes', yMin: -120, yMax: 200, ticksY: [-100, 0, 100, 200], etY: 'millones de $', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} mil · CFE ${num(lc[0].f(x))} · Almacenadora ${num(lc[1].f(x))} millones` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Pago fijo', 'Almacenadora', 'CFE'], [0, 30, 60, 90, 120, 150].map(p => { const t = tolling({ pago: p, factor: pide.factor, esquema: 'plp' }); return [`${p} mil`, `${mill(t.almacenadoraAnio)}`, `${mill(t.cfeAnio)}`]; }));
    } else {
        const lb = [{ clase: 'h-s-norma', nombre: 'Demanda', f: x => L.demanda[Math.min(23, Math.floor(x))] }, { clase: 'h-s-sin', nombre: 'Sol', f: x => L.solar[Math.min(23, Math.floor(x))] }, { clase: 'h-s-verde', nombre: 'Batería', f: x => L.r.descarga[Math.min(23, Math.floor(x))] }, { clase: 'h-s-gris', nombre: 'Diésel', f: x => L.r.diesel[Math.min(23, Math.floor(x))] }];
        const mx = Math.max(MINA.dia, ...L.solar);
        $('#h-b-t').textContent = `Un día de ${L.M.nombre} en la mina`;
        $('#h-b-ley').innerHTML = leyenda(lb);
        $('#h-b-pie').textContent = `MW, hora por hora. Del sol, directo o pasando por la batería, sale ${num(L.deSol * 100)} % de lo que usa la mina; lo demás, del diésel: ${num(L.horasDiesel)} horas y unos ${num(L.litros)} litros al día.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Un día en la mina', ...HORA_X, yMin: 0, ...escala(mx, 1), etY: 'MW', lineas: lb, fy: y => num(y), punta: x => { const h = Math.min(23, Math.floor(x)); return `${h}:00 · demanda ${f1(L.demanda[h])} · sol ${f1(L.solar[h])} · batería ${f1(L.r.descarga[h])} · diésel ${f1(L.r.diesel[h])} MW`; } });
        $('#h-tabla-b').innerHTML = tablaHTML(['Hora', 'Demanda', 'Sol', 'Batería', 'Diésel'], Array.from({ length: 24 }, (_, h) => [`${h}:00`, f1(L.demanda[h]), f1(L.solar[h]), f1(L.r.descarga[h]), f1(L.r.diesel[h])]));
        const lc = [{ clase: 'h-s-gris', nombre: 'Diésel al día', f: x => aislado({ mes: L.mes, horasMina: x, nubes: L.nubes }).litros }];
        const mx2 = aislado({ mes: L.mes, horasMina: 0, nubes: L.nubes }).litros;
        $('#h-c-t').textContent = 'El diésel según la batería';
        $('#h-c-ley').innerHTML = leyenda(lc);
        $('#h-c-pie').textContent = 'Litros de diésel al día según las horas de batería, con el sol de este mes y estas nubes. Llega un punto en que ya no hay sol de sobra que guardar.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'El diésel según la batería', xMin: 0, xMax: 10, ticksX: [0, 2, 4, 6, 8, 10], etX: 'Horas de batería', yMin: 0, ...escala(mx2, pasoDe(mx2)), etY: 'litros', lineas: lc, fx: x => num(x), fy: y => num(y), punta: x => `${f1(x)} h · ${num(lc[0].f(x))} L al día` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Batería', 'Del sol', 'Horas de diésel', 'Litros al día'], [0, 2, 4, 6, 8, 10].map(h => { const o = aislado({ mes: L.mes, horasMina: h, nubes: L.nubes }); return [`${h} h`, `${num(o.deSol * 100)} %`, num(o.horasDiesel), num(o.litros)]; }));
    }
}
const horasCon = arr => { const h = arr.map((x, i) => (x > 0.01 ? i : null)).filter(x => x !== null); return h.length ? h : [0]; };

function pintarBarras(L, pag) {
    const { $, pide } = pag;
    let filas;
    if (pide.modo === 'mercado') {
        filas = [
            { t: 'Estado de carga', v: L.socPct, activa: true, escala: 1 },
            { t: 'Precio ahora, del más caro del día', v: L.precio / Math.max(...L.perfil), escala: 1 },
            { t: 'De lo que toma, regresa', v: ATB.ida, escala: 1 },
        ];
        $('#h-d-t').textContent = 'La batería, de cada 100';
        $('#h-d-pie').textContent = `Con ${f1(L.horas)} horas guarda ${num(L.E)} MWh. Las de EE. UU. regresaron ${num(EIA.ida * 100)} de cada 100 en 2019.`;
    } else if (pide.modo === 'central') {
        filas = [
            { t: 'Lo que se iba a tirar, recuperado', v: L.tirada > 0.5 ? L.recuperada / L.tirada : 0, activa: L.tirada > 0.5, escala: 1 },
            { t: 'Estado de carga', v: L.socPct, escala: 1 },
            { t: 'Ingreso, del de sin batería', v: L.ingresoSin > 0 ? L.ingresoCon / L.ingresoSin : 1, activa: true, escala: 2 },
        ];
        $('#h-d-t').textContent = 'La central, de cada 100';
        $('#h-d-pie').textContent = `La central entrega ${num(factorPlanta() * 100)} % de lo que cabría en su contrato si diera ${CENTRAL.contrato} MW todo el año.`;
    } else if (pide.modo === 'tolling') {
        const Tt = L.T;
        filas = [
            { t: 'Para la CFE, de lo que da el mercado', v: Tt.mercadoAnio > 0 ? Math.max(0, Tt.cfeAnio) / Tt.mercadoAnio : 0, activa: true, escala: 1 },
            { t: 'Para la Almacenadora', v: Tt.mercadoAnio > 0 ? Tt.almacenadoraAnio / Tt.mercadoAnio : 0, escala: 1.5 },
            { t: 'Meses en que la CFE pone, de 12', v: Tt.mesesPierde / 12, activa: Tt.mesesPierde > 6, escala: 1 },
        ];
        $('#h-d-t').textContent = 'El año, de cada 100';
        $('#h-d-pie').textContent = Tt.cfeAnio < 0 ? 'Con este pago la CFE pierde en el año: el riesgo de precio es todo suyo.' : 'La Almacenadora no corre riesgo de precio: el que lo corre es la CFE.';
    } else {
        filas = [
            { t: 'Del sol, directo o por la batería', v: L.deSol, activa: true, escala: 1 },
            { t: 'Del diésel', v: L.deDiesel, activa: L.deDiesel > 0.5, escala: 1 },
            { t: 'Estado de carga', v: L.socPct, escala: 1 },
        ];
        $('#h-d-t').textContent = 'La mina, de cada 100';
        $('#h-d-pie').textContent = `De cada 100 kWh que usa la mina en el día. Sin batería: ${num(aislado({ mes: L.mes, horasMina: 0, nubes: L.nubes }).deSol * 100)} del sol.`;
    }
    $('#h-barras').innerHTML = barrasHTML(filas);
}
function alPintarFijas({ $ }) {
    const si = 'Sí';
    $('#h-modalidades').innerHTML = tablaHTML(['Forma', 'Permiso de almacenamiento', 'Vende en el mercado', 'Entrega a la red'], [
        ['No asociado, de una Almacenadora', 'Sí, de la CNE (0.7 MW o más)', `${si}, directo o representado`, si],
        ['De una central de Energías Renovables', 'No: es parte de la central', 'Por medio de la central', 'Sí, sin pasar de su contrato'],
        ['De un centro de carga', 'No', 'No', 'No'],
        ['De un autoconsumo', 'No: va con el permiso de generación', 'Según su autoconsumo', 'Aislado, no; interconectado, según su permiso'],
        ['De la red (Transportista o Distribuidora)', 'No', 'No: no se paga ni se cobra', 'Lo opera el CENACE'],
    ]);
    $('#h-convocatoria').innerHTML = tablaHTML(['Región', 'MW', 'Horas'], [...CONVOCATORIA.regiones.map(([r, mw]) => [r, num(mw), num(CONVOCATORIA.horas)]), ['Total', num(totalConvocatoria()), `${num(totalConvocatoria() * CONVOCATORIA.horas)} MWh`]]);
    $('#h-bateria').innerHTML = tablaHTML(['Qué', 'Cuánto'], [
        ['De cada 100 MWh que toma, regresa', `${num(ATB.ida * 100)} (ATB 2025); ${num(EIA.ida * 100)} medido en EE. UU. en 2019`],
        ['Vida', `${ATB.vida} años, con un ciclo al día`],
        ['Celdas', 'litio, ferrofosfato (LFP)'],
        ['La del sitio', `${SAEE.P} MW, ${num(SAEE.P * SAEE.horas)} MWh (${SAEE.horas} horas)`],
        ['Precio promedio en Chihuahua', `${num(PERFIL_A.reduce((s, x) => s + x, 0) / 24)} $/MWh`],
        ['Hora más barata, en promedio', `${PERFIL_A.indexOf(Math.min(...PERFIL_A))}:00 (${num(Math.min(...PERFIL_A))} $/MWh)`],
        ['Hora más cara, en promedio', `${PERFIL_A.indexOf(Math.max(...PERFIL_A))}:00 (${num(Math.max(...PERFIL_A))} $/MWh)`],
        ['Lo que habría ganado en el año', `${mill(A.total)} millones de $; ${num(A.porMW / 1000)} mil por MW`],
        ['Ciclos en el año', num(A.ciclos)],
        ['Diésel de la mina, día de septiembre', `${num(MINA_SEP.litros)} L con ${num(DEF.horasMina)} h de batería; ${num(dieselLh(MINA.diesel * 1000, MINA.dia * 1000))} L/h a ${MINA.dia} MW`],
    ]);
    $('#h-regla').innerHTML = tablaHTML(['Qué', 'Dónde lo dice'], [
        ['Qué es un Sistema de Almacenamiento de Energía Eléctrica', 'LSE, art. 3, fracc. L'],
        ['La SENER fija cómo participan y sus permisos; la CNE, sus contraprestaciones', 'LSE, arts. 82 a 84'],
        ['Pueden ofrecer energía y Productos Asociados', 'LSE, art. 85'],
        ['Autoconsumo aislado: sin conexión a la RNT ni a las RGD', 'LSE, art. 31'],
        ['Autoconsumo intermitente que vende excedentes: respaldo propio con SAEE, o pagarlo', 'LSE, art. 32, fracc. III'],
        ['Almacenadora: titular de permisos de almacenamiento de SAEE no asociados', 'RLSE, art. 2, fracc. I'],
        ['No asociados de 0.7 MW o más: permiso de la CNE; los de una central, no', 'RLSE, art. 193'],
        ['El CENACE puede contratarlos y los usa en emergencias', 'RLSE, art. 194'],
        ['No reciben Certificados de Energías Limpias', 'RLSE, art. 195'],
    ]);
}
function alActualizar(L, pag) {
    const { pide, ponerCifra, ponerLecturas, nivel, graficas } = pag;
    pintarBarras(L, pag);
    ponerCifra('aT', { mercado: 'Las 24 horas', central: 'Lo que hace la central', tolling: 'Quién se queda con qué', aislado: 'De dónde sale la energía' }[pide.modo]);
    if (pide.modo === 'mercado') {
        const aviso = L.precio < 0 ? 'Precio negativo: le pagan por cargar.' : null;
        ponerLecturas([['Precio ahora', `${num(L.precio)} $`, `por MWh, ${hm(L.hora)} h`], ['Batería', `${num(L.socPct * 100)} %`, `${num(L.soc)} de ${num(L.E)} MWh`], ['Ahora', L.carga > 0.5 ? `toma ${num(L.carga)} MW` : L.descarga > 0.5 ? `entrega ${num(L.descarga)} MW` : 'espera', L.carga > 0.5 ? 'compra' : L.descarga > 0.5 ? 'vende' : 'sin moverse'], ['Gana en el día', `${num(L.d.ganancia / 1000)} mil $`, `día promedio de ${L.M.nombre}`], ['Ganó en el mes', `${mill(L.mesReal.ganancia)} millones`, 'sumando los días reales'], ['En el año', `${mill(L.a.total)} millones`, `${num(L.a.porMW / 1000)} mil $ por MW`]], aviso);
        ponerCifra('hud', `${num(L.precio)} $/MWh`);
        ponerCifra('hud2', `${hm(L.hora)} h, ${L.M.nombre}`);
        graficas.b?.marcar(L.hora, L.precio);
        graficas.c?.marcar(L.mes, L.a.meses[L.mes].ganancia / 1e6);
        nivel(1, 'Carga', clamp01(L.socPct), `${num(L.socPct * 100)} %`);
        nivel(2, 'Precio', clamp01(L.precio / Math.max(...L.perfil)), `${num(L.precio)} $`);
    } else if (pide.modo === 'central') {
        const a = L.ahora;
        const aviso = a.bruta > CENTRAL.contrato + 0.5 ? (L.P > 0 ? `Da ${num(a.bruta)} MW y el contrato es de ${CENTRAL.contrato}: la batería guarda lo que no cabe.` : `Da ${num(a.bruta)} MW y el contrato es de ${CENTRAL.contrato}: sin batería, lo demás se tira.`) : null;
        ponerLecturas([['La central', `${num(a.bruta)} MW`, `${hm(L.hora)} h`], ['A la red', `${num(a.red)} MW`, `contrato de ${CENTRAL.contrato} MW`], ['La batería', a.carga > 0.5 ? `toma ${num(a.carga)} MW` : a.descarga > 0.5 ? `entrega ${num(a.descarga)} MW` : 'espera', `${num(L.P)} MW, ${num(L.E)} MWh`], ['Precio ahora', `${num(a.precio)} $`, 'por MWh'], ['Gana de más', `${num(L.extra / 1000)} mil $`, 'al día, con la batería'], ['Recupera', `${num(L.recuperada)} MWh`, `de ${num(L.tirada)} que se tirarían`]], aviso);
        ponerCifra('hud', `${num(a.red)} MW`);
        ponerCifra('hud2', `a la red, ${hm(L.hora)} h`);
        graficas.b?.marcar(L.hora, a.red);
        graficas.c?.marcar(L.pct, L.extra / 1000);
        nivel(1, 'Sol', clamp01(a.bruta / CENTRAL.mwCA), `${num(a.bruta)} MW`);
        nivel(2, 'Batería', clamp01(L.socPct), `${num(L.socPct * 100)} %`);
    } else if (pide.modo === 'tolling') {
        const Tt = L.T;
        const aviso = Tt.cfeAnio < 0 ? `Con ${num(Tt.pago)} mil $ por MW al mes, la CFE paga más de lo que gana la batería en el año.` : null;
        ponerLecturas([['El mercado da', `${mill(Tt.mercadoAnio)} millones`, 'en el año'], ['Pago fijo', `${mill(Tt.fijoAnio)} millones`, `${num(Tt.pago)} mil $ por MW al mes`], ['Le queda a la CFE', `${Tt.cfeAnio < 0 ? '−' : ''}${mill(Math.abs(Tt.cfeAnio))} millones`, `pone en ${Tt.mesesPierde} meses`], ['Almacenadora', `${mill(Tt.almacenadoraAnio)} millones`, 'sin riesgo de precio'], ['Empate', `${num(Tt.empate * pide.factor)} mil $`, 'por MW al mes'], ['Esquema', Tt.esquema === 'mixta' ? 'inversión mixta' : 'largo plazo', Tt.esquema === 'mixta' ? 'la CFE con 54 %' : 'el Estado no pone capital']], aviso);
        ponerCifra('hud', `${Tt.cfeAnio < 0 ? '−' : ''}${mill(Math.abs(Tt.cfeAnio))} millones`);
        ponerCifra('hud2', 'le quedan a la CFE en el año');
        graficas.c?.marcar(Tt.pago, Tt.cfeAnio / 1e6);
        nivel(1, 'Mercado', clamp01(Tt.mercadoAnio / 1.5e8), `${mill(Tt.mercadoAnio)} M`);
        nivel(2, 'Pago fijo', clamp01(Tt.fijoAnio / 1.5e8), `${mill(Tt.fijoAnio)} M`);
    } else {
        const a = L.ahora;
        const aviso = a.diesel > 0.01 ? `Sin sol ni batería: la planta diésel da ${f1(a.diesel)} MW.` : null;
        ponerLecturas([['Demanda', `${f1(a.demanda)} MW`, `${hm(L.hora)} h`], ['Sol', `${f1(a.solar)} MW`, `${L.M.nombre}`], ['Batería', a.carga > 0.01 ? `toma ${f1(a.carga)} MW` : a.descarga > 0.01 ? `entrega ${f1(a.descarga)} MW` : 'espera', `${num(L.socPct * 100)} %`], ['Diésel', `${f1(a.diesel)} MW`, `${num(L.horasDiesel)} h al día`], ['Litros al día', num(L.litros), 'de diésel'], ['Del sol', `${num(L.deSol * 100)} %`, 'de lo que usa']], aviso);
        ponerCifra('hud', `${num(L.deSol * 100)} % sol`);
        ponerCifra('hud2', `${num(L.litros)} L de diésel al día`);
        graficas.b?.marcar(L.hora, a.demanda);
        graficas.c?.marcar(L.horasMina, L.litros);
        nivel(1, 'Batería', clamp01(L.socPct), `${num(L.socPct * 100)} %`);
        nivel(2, 'Diésel', clamp01(a.diesel / MINA.diesel), `${f1(a.diesel)} MW`);
    }
}

// ------------------------------------------------------------------ el sitio
const PIDE0 = { mes: DEF.mes, horas: DEF.horas, hora: DEF.hora, pct: DEF.pct, pago: DEF.pago, factor: DEF.factor, esquema: DEF.esquema, horasMina: DEF.horasMina, nubes: DEF.nubes, corre: false };
crearPagina({
    figura: FIGURA,
    fichas: FICHAS,
    vistas: VISTAS,
    modos: MODOS,
    botones: BOTONES,
    acciones: ACCIONES,
    modo0: 'mercado',
    pide: { ...PIDE0 },
    general: { Lx: 16, Lz: 8, alto: 2.6, mira: [0, 0.6, 0], az: 16, el: 32, azVertical: 10, elVertical: 40 },
    etiquetas: { lienzo: 'Sitio de almacenamiento de energía en 3D: arrastra para girarlo, toca un punto para conocerlo', modos: 'Qué ver en el almacenamiento', puntos: 'Puntos clave del almacenamiento', desarmar: 'Desarmar el sitio', lecturas: 'Lo que mide el sitio' },
    textoFinal: 'Toca cualquier punto para volver a verlo. Cambia el mes en «Compra y venta», ponle batería a la central, mueve el pago del tolling o quítale la batería a la mina.',
    colores: { guindaSuave: '#f3d4de', claro: '#ffffff' },
    crearDiagrama,
    secciones,
    escena: (renderer, scene, { movil, oscuro }) => {
        const M = materiales(P_PLANTA);
        const est = escenario(renderer, scene, M, { movil, oscuro });
        return { planta: construir(M, P_PLANTA, { movil, oscuro }), est };
    },
    alCambiarModo: (p, nuevo) => {
        const mes = p.mes;
        Object.assign(p, PIDE0);
        p.mes = mes;
        if (nuevo === 'central') { p.mes = 6; p.hora = 12.5; }
        planta = estadoPlanta();
    },
    alCuadro: ({ dt, pide }) => {
        planta = pasoPlanta(planta, { modo: pide.modo }, dt);
    },
    poseDe: ({ pide, ve, encendido, t, dt, camara }) => pose({ modo: pide.modo, mes: pide.mes, horas: pide.horas, hora: pide.hora, pct: pide.pct, pago: pide.pago, factor: pide.factor, esquema: pide.esquema, horasMina: pide.horasMina, nubes: pide.nubes, noche: ve.noche, adentro: ve.adentro, desarme: ve.desarme, encendido, t, dt, camara }),
    firma: p => [p.modo, Math.round(p.mes), Math.round(p.horas * 4), Math.round(p.pct), Math.round(p.pago), Math.round(p.factor * 20), p.esquema, Math.round(p.horasMina * 2), Math.round(p.nubes * 20)],
    alPintarFijas,
    alPintarGraficas,
    alActualizar,
    prueba: p => ({ mes: Math.round(p.mes), horas: +p.horas.toFixed(1), hora: +p.hora.toFixed(2), pct: Math.round(p.pct), pago: Math.round(p.pago), factor: +p.factor.toFixed(2), esquema: p.esquema, horasMina: +p.horasMina.toFixed(1), nubes: +p.nubes.toFixed(2), t: +planta.t.toFixed(1) }),
});
