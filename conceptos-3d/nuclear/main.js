// «Central nuclear», en 3D y con el formato Búho de «¿Cómo funciona?». Una franja de costa con un reactor de agua en ebullición, el
// tipo de Laguna Verde: el combustible, la reacción en cadena, las barras de control, la vasija que hierve, la contención, las turbinas,
// el generador, el condensador, el agua de mar, lo que pasa al apagarlo, el combustible usado, la subestación, la RNT y las RGD. Cuatro
// formas de verla: operando, apagada, con agua a presión para comparar, y el ciclo del combustible. Puntos clave con su ficha, ver por
// dentro, desarmar, día y noche, y gráficas que leen las mismas cifras que mueven la central (modelo.js). Se arma con:
// node scripts/build-conceptos-3d.mjs nuclear
//
// No usa crearMaquina: la cámara vuela entre las partes y cada parte lleva ficha, tablero y gráficas propias. Sí respeta su
// contrato con Aprende (concepto-height, concepto-part, concepto-select-part, concepto-listo, concepto-fullscreen) y su estilo
// común (clases g-*). El tema del sitio (data-tema) es independiente de la noche de la central: la noche solo cambia la escena.
import * as THREE from 'three';
import { brandMarkSvg } from '../../src/lib/brand-mark.js';
import { AGUA, DEF, FLUIDOS, LIMITES, MESES_DENTRO, NUCLEO, PARTES as PARTES_M, QUEMADO_FINAL, T_UNO, UNIDAD, aguaAPresion, aguaParaEnfriar, calcular, calorResidual, cicloVapor, composicion, enElCiclo, equilibrio, estadoReactor, kwPorTonelada, pasoReactor, pose, posicionCamara, puntosCiclo, sat, u235Dia } from './modelo.js';
import { P_PLANTA, materiales, estudio, construir } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';

const FIGURA = 'nuclear';
const D2R = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const clamp01 = x => clamp(x, 0, 1);
const sale = x => 1 - (1 - clamp01(x)) ** 3;
const suave = x => { const k = clamp01(x); return k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2; };
const num = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });

const parametros = new URLSearchParams(location.search);
const raizDoc = document.documentElement;
// en Aprende el tema viene puesto en el HTML; suelta (Artifact), se toma de quien la muestra o del sistema
if (!raizDoc.dataset.tema) {
    const pedido = parametros.get('tema');
    const anfitrion = raizDoc.dataset.theme;
    raizDoc.dataset.tema = pedido === 'oscuro' || pedido === 'claro' ? pedido : anfitrion === 'dark' || (!anfitrion && matchMedia('(prefers-color-scheme: dark)').matches) ? 'oscuro' : 'claro';
}
const OSCURO = raizDoc.dataset.tema === 'oscuro';
const REDUCIR = matchMedia('(prefers-reduced-motion: reduce)').matches;
const RECORRIDO = parametros.get('recorrido') !== 'no' && !REDUCIR;
const ENTRADA_S = 2.6;
const MESES_POR_SEGUNDO = 1.1; // en «Ciclo del combustible»: cinco años en menos de un minuto
const LOG_MAX = Math.log10(T_UNO.sem);
const LOG_POR_SEGUNDO = LOG_MAX / 45; // en «Apagado»: de un segundo a una semana en 45 segundos, con la escala en potencias de diez
const ACELERA = 3; // la reacción responde tres veces más rápido que en la realidad, para alcanzar a verla
const MOVIL = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 600;
const avisar = datos => { try { if (parent !== window) parent.postMessage(datos, location.origin); } catch { /* sin padre del mismo origen */ } };

const BASE = cicloVapor();
const PWR_BASE = aguaAPresion();
const SALE = composicion(MESES_DENTRO);

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'combustible', nombre: 'Combustible', modo: 'operar', accion: 'desarme', eq: `${num(UNIDAD.ensambles)} ensambles: unas ${num(UNIDAD.ensambles * UNIDAD.tEnsamble)} toneladas de uranio`, recorrido: { noche: false, adentro: false },
        icono: '<rect x="8" y="3" width="8" height="18" rx="1.5"/><path d="M8 8h8M8 13h8M8 18h8"/>',
        texto: 'Es uranio. De cada 1,000 átomos en la mina, solo unos 7 son de uranio-235, el que se parte con facilidad; por eso se enriquece hasta unos 40 de cada 1,000. Se hace polvo y se hornea en pastillas de cerámica. Las pastillas se apilan en tubos de metal, y decenas de tubos forman un ensamble. Esta muestra está mucho más grande que los del reactor.' },
    { parte: 'reaccion', nombre: 'Reacción en cadena', modo: 'operar', abrir: true, accion: 'desarme', eq: `Se parten ${num(u235Dia(UNIDAD.termica), 1)} kilos de uranio-235 al día`,
        icono: '<circle cx="12" cy="12" r="3"/><circle cx="5" cy="6" r="1.6"/><circle cx="19" cy="6" r="1.6"/><circle cx="19" cy="18" r="1.6"/><circle cx="5" cy="18" r="1.6"/><path d="m7 7 3 3M17 7l-3 3M17 17l-3-3M7 17l3-3"/>',
        texto: 'Un neutrón golpea un átomo de uranio-235 y lo parte en dos. Eso suelta mucho calor y unos 2.5 neutrones más, que pueden partir otros átomos. El agua los frena, y así chocan más fácil. De cada fisión debe seguir justo un neutrón; los demás se pierden. Aquí están los 444 ensambles, contados uno por uno. Los puntos blancos son neutrones y la luz azul, el brillo de partículas rápidas en el agua.' },
    { parte: 'barras', nombre: 'Barras de control', modo: 'operar', abrir: true, accion: 'apagar', eq: `${num(UNIDAD.barras)} barras en cruz, que entran por abajo`, recorrido: { adentro: false },
        icono: '<path d="M12 3v18M7 8h10M7 16h10"/>',
        texto: 'Son las piezas guindas, en forma de cruz, hechas de un material que se traga neutrones. Entran por abajo, entre los ensambles. Más adentro, menos neutrones siguen la cadena y baja la potencia; más afuera, sube. El vapor también frena la reacción: por eso la potencia se asienta sola. Y si las bombas mueven más agua, hay menos vapor y sube la potencia, sin tocar las barras.' },
    { parte: 'vapor', nombre: 'Vasija y vapor', modo: 'operar', abrir: true, accion: 'desarme', eq: `${num(BASE.tVapor)} °C y ${num(BASE.pVapor)} bar: ${num(BASE.mv * 3.6)} t/h de vapor`,
        icono: '<path d="M7 21h10a2 2 0 0 0 2-2V8a7 7 0 0 0-14 0v11a2 2 0 0 0 2 2Z"/><path d="M9 4c1 1-1 2 0 3M15 4c1 1-1 2 0 3"/>',
        texto: `Es una olla de acero de paredes gruesas. El agua sube entre los ensambles y hierve ahí mismo: por eso se llama de agua en ebullición. Solo ${num((BASE.mv / 8800) * 100)} de cada 100 kilos se vuelven vapor en cada pasada; arriba, separadores y secadores le quitan las gotas. El agua que sobra baja por la orilla y las bombas de chorro la vuelven a empujar. El vapor sale por cuatro tubos a las turbinas.` },
    { parte: 'contencion', nombre: 'Contención', modo: 'operar', abrir: true, accion: 'desarme', eq: 'Mark II: pozo seco arriba, alberca abajo', recorrido: { adentro: false },
        icono: '<path d="M4 21V10a8 8 0 0 1 16 0v11"/><path d="M4 21h16M9 21v-7h6v7"/>',
        texto: 'Lo importante es que el material radiactivo no salga. Por eso hay barreras, una dentro de otra: la pastilla, el tubo sellado, la vasija de acero y esta contención de concreto forrada de acero. Abajo hay una alberca: si se rompe un tubo, el vapor baja por conductos al agua y se vuelve líquido. La tapa guinda de acero se quita en cada recarga.' },
    { parte: 'turbina', nombre: 'Turbinas', modo: 'operar', abrir: true, accion: 'desarme', eq: 'Una de alta presión y dos de baja, en un solo eje',
        icono: '<path d="M4 12h16"/><path d="M8 7v10M12 5v14M16 3v18"/>',
        texto: 'El vapor empuja los álabes y hace girar el eje. Entra por el centro de cada turbina y se abre hacia los lados, con álabes cada vez más largos porque se expande. El cilindro de enfrente le quita agua y lo recalienta entre la turbina de alta y las de baja. Como es el mismo vapor que cruzó el núcleo, trae nitrógeno-16, radiactivo pero que dura segundos: por eso lleva este muro de concreto.' },
    { parte: 'generador', nombre: 'Generador', modo: 'operar', abrir: true, accion: 'desarme', eq: `${num(BASE.bruta)} MW en el generador`,
        icono: '<circle cx="12" cy="12" r="7.5"/><path d="M12.8 7.5 9.7 12.6h4.6l-3 4"/>',
        texto: `El mismo eje hace girar un imán de cobre dentro de las bobinas y ahí nace la electricidad. Con cuatro polos, como este, 1,800 vueltas por minuto dan los 60 ciclos por segundo de la red mexicana. La central se queda con una parte para sus bombas y equipos: salen ${num(BASE.bruta)} MW y a la red llegan ${num(BASE.neta)}.` },
    { parte: 'condensador', nombre: 'Condensador', modo: 'operar', abrir: true, accion: 'desarme', eq: `${num(BASE.tC)} °C y ${num(BASE.pC, 2)} bar`,
        icono: '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 10h10M7 14h10"/>',
        texto: 'Abajo de las turbinas, el vapor cae sobre miles de tubos con agua de mar y se vuelve líquido. Al ocupar mucho menos lugar deja un vacío que jala más vapor. El agua del reactor y la del mar nunca se tocan: las separa la pared del tubo. Luego unas bombas regresan el agua a la vasija, pasando por el cilindro de adelante, donde un poco de vapor la calienta.' },
    { parte: 'enfriamiento', nombre: 'Agua de mar', modo: 'operar', abrir: true, accion: 'noche', eq: `${num(BASE.m3Mar)} m³ por segundo; regresa a unos ${num(BASE.tDescarga)} °C`, recorrido: { adentro: false },
        icono: '<path d="M3 9c3-3 6 3 9 0s6 3 9 0M3 15c3-3 6 3 9 0s6 3 9 0"/>',
        texto: `Aquí no hay torre de enfriamiento: se usa el Golfo de México. Las bombas toman el agua entre dos brazos de roca que protegen la toma, la pasan por el condensador y la devuelven por un canal, unos ${num(BASE.tDescarga - BASE.tMar)} °C más caliente. El canal termina abierto, en el mar, a propósito: la mancha anaranjada es esa agua tibia que se mezcla. Se lleva ${num(BASE.reparto.mar * 100)} de cada 100 de calor del reactor.` },
    { parte: 'emergencia', nombre: 'Apagado y emergencia', modo: 'apagar', abrir: true, accion: 'sinred', eq: `A la hora: ${num(UNIDAD.termica * calorResidual(T_UNO.h))} MW de calor`, recorrido: { noche: false },
        icono: '<path d="M12 3 3 20h18L12 3Z"/><path d="M12 10v5M12 18v.5"/>',
        texto: 'Al apagar entran todas las barras en segundos y la fisión casi se detiene, pero el combustible sigue soltando calor y hay que seguir enfriando. Lo normal es mandar el vapor directo al condensador. Si se va la luz de fuera, arrancan los generadores diésel, y una bomba movida por el propio vapor (la guinda) mete agua del tanque a la vasija; ese vapor termina en la alberca de abajo.' },
    { parte: 'residuos', nombre: 'Combustible usado', modo: 'ciclo', mes: 17.2, abrir: true, accion: 'recarga', eq: `Se cambian ${num(UNIDAD.recambio)} de ${num(UNIDAD.ensambles)} ensambles cada ${num(UNIDAD.mesesCiclo)} meses`, recorrido: { noche: false },
        icono: '<path d="M8 3h8l1 4v13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V7l1-4Z"/><path d="M7 7h10M7 17h10"/>',
        texto: `Cada ${num(UNIDAD.mesesCiclo)} meses se para el reactor, se quitan las tapas y la grúa cambia cerca de un tercio de los ensambles. Los usados siguen calientes y radiactivos, así que van a la alberca del piso de arriba, donde el agua los enfría y blinda. Tras unos años pasan a contenedores de metal y concreto. Esos están afuera, junto al edificio: en Laguna Verde la losa tiene lugar para 130.` },
    { parte: 'subestacion', nombre: 'Subestación', modo: 'operar', abrir: true, accion: 'desarme', eq: `${num(BASE.neta)} MW: ${num((BASE.neta * 1e3) / (Math.sqrt(3) * 400))} amperes a 400 kV`, recorrido: { noche: false, adentro: false },
        icono: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
        texto: 'El voltaje que da el generador es muy poco para viajar lejos. Este transformador lo sube a 400 kV: con más voltaje, la misma potencia viaja con menos corriente y los cables se calientan menos. El pórtico de al lado conecta la central con la línea.' },
    { parte: 'red', nombre: 'RNT y RGD', modo: 'operar', accion: 'noche', recorrido: { noche: true, adentro: false },
        icono: '<path d="M12 3 6 21M12 3l6 18M8 9h8M7 14h10"/>',
        texto: 'La electricidad sale por la RNT, la Red Nacional de Transmisión, que la lleva lejos y a grandes usuarios. Cerca del pueblo, otra subestación baja el voltaje y las RGD, las Redes Generales de Distribución, la reparten al público. Da lo mismo de día que de noche: no depende del sol ni del viento. En 2024, Laguna Verde entregó 11,978 GWh, trabajando al 87.9 % de su capacidad.' },
];
const PARTES = FICHAS.map(f => f.parte);
const FINAL = FICHAS.length;
const VISTAS = Object.fromEntries(PARTES_M.map(p => [p.id, p.vista]));
// cada paso del recorrido dura lo que tarda en leerse su ficha
const pasoS = i => clamp((FICHAS[i]?.texto.split(' ').length ?? 30) * 0.17, 5, 11);
const ICONO_TOCAR = '<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10"/><path d="M12 9.5a1.5 1.5 0 0 1 3 0V11"/><path d="M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.6-2.2L4.4 15.6a1.5 1.5 0 0 1 2.3-1.9L9 16"/>';
const ICONOS = {
    izq: '<path d="M4 12a8 8 0 1 1 2.5 5.8"/><path d="M4 18v-5h5"/>',
    der: '<path d="M20 12a8 8 0 1 0-2.5 5.8"/><path d="M20 18v-5h-5"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    menos: '<path d="M5 12h14"/>',
    luna: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3 7 7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7"/>',
    pausa: '<path d="M8 5v14M16 5v14"/>',
    seguir: '<path d="M7 4.5v15l12-7.5Z"/>',
    abrir: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    cerrar: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
};
const svgIcono = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;

const MODOS = {
    operar: { nombre: 'Agua en ebullición', corto: 'Ebullición', resumen: 'La de Laguna Verde. El agua hierve dentro de la vasija y ese mismo vapor mueve la turbina. Mueve las barras o las bombas y mira cómo responde: el vapor frena la reacción y la potencia se asienta sola.', mando: 'Barras de control adentro', mando2: 'Bombas de recirculación' },
    apagar: { nombre: 'Apagado', corto: 'Apagado', resumen: 'Las barras entran en segundos y se frena la fisión, pero el combustible sigue soltando calor. Mira cuánto queda y cuánta agua hace falta para llevárselo.', mando: 'Tiempo desde que se apagó' },
    presion: { nombre: 'Agua a presión', corto: 'A presión', resumen: 'La más común del mundo, pero no la de México; va aquí para comparar. El agua del reactor va tan apretada que no hierve, y el vapor se hace en un segundo circuito, separado.', mando: 'Presión del primer circuito', mando2: 'Temperatura al salir del núcleo' },
    ciclo: { nombre: 'Ciclo del combustible', corto: 'Combustible', resumen: `La vida de un ensamble: unos ${num(MESES_DENTRO / 12)} años dentro del reactor. Cada ${num(UNIDAD.mesesCiclo)} meses el reactor se para unas semanas y se cambia cerca de un tercio del combustible.`, mando: 'Mes' },
};

// ------------------------------------------------------------------ la página
const controles = () => `
    <div class="g-seg h-procesos" role="radiogroup" aria-label="Qué ver en la central">
        ${Object.entries(MODOS).map(([id, p]) => `<button type="button" role="radio" data-modo="${id}" aria-checked="false"><span class="h-largo">${p.nombre}</span><span class="h-corto">${p.corto}</span></button>`).join('')}
    </div>
    <label class="g-deslizador h-mando"><span class="h-rotulo"><span data-c="mando"></span><b data-c="mandoValor"></b></span><input type="range" data-control="1" min="0" max="100" step="0.25" value="50"></label>
    <label class="g-deslizador h-mando" data-caja2><span class="h-rotulo"><span data-c="mando2"></span><b data-c="mando2Valor"></b></span><input type="range" data-control="2" min="0" max="100" step="0.25" value="50"></label>
    <label class="g-deslizador h-mando"><span class="h-rotulo"><span>Desarmar</span></span><input type="range" data-desarme min="0" max="1" step="0.01" value="0" aria-label="Desarmar la central"></label>
    <span class="h-relojes">
        <button type="button" class="g-chip h-reloj" data-reloj hidden></button>
        <button type="button" class="g-chip h-reloj" data-sinred aria-pressed="false" hidden><span></span></button>
    </span>`;
const botonesDePartes = () => FICHAS.map((f, i) => `<button type="button" data-parte="${i}" aria-pressed="false"><span>${i + 1}</span>${f.nombre}</button>`).join('');
const MEXICO = [
    { campo: 'Unidad 1', desde: 1990, neta: 777, hasta: 2050 },
    { campo: 'Unidad 2', desde: 1995, neta: 775, hasta: 2055 },
];
const numTiempo = s => (s < 60 ? `${num(s)} s` : s < 3600 ? `${num(s / 60)} min` : s < 86400 ? `${num(s / 3600, s < 36000 ? 1 : 0)} h` : `${num(s / 86400, 1)} días`);
const app = document.getElementById('app');
app.innerHTML = `
    <div class="g-escena">
        <div class="h-cielo" aria-hidden="true"></div>
        <canvas class="g-lienzo" aria-label="Central nuclear en 3D: arrastra para girarla, toca un punto para conocerlo"></canvas>
        <div class="h-pines" aria-label="Puntos clave de la central">${FICHAS.map((f, i) => `<button type="button" class="h-pin" data-pin="${i}" aria-label="${i + 1}. ${f.nombre}" title="${f.nombre}"><b>${i + 1}</b><span>${f.nombre}</span></button>`).join('')}</div>
        <svg class="g-guia h-senal" aria-hidden="true"><line/><circle r="4"/></svg>
        <div class="g-escena-acciones">
            <button type="button" class="g-chip" data-recorrido aria-pressed="false"><i></i><span>Recorrido</span></button>
            <span class="g-grupo">
                <button type="button" class="g-chip" data-adentro aria-pressed="false">Ver por dentro</button>
                <button type="button" class="g-chip g-chip-icono" data-luz aria-pressed="false" aria-label="Cambiar a noche" title="Cambiar a noche">${svgIcono(ICONOS.luna)}</button>
                <button type="button" class="g-chip g-chip-icono" data-pantalla aria-pressed="false" aria-label="Pantalla completa" title="Pantalla completa">${svgIcono(ICONOS.abrir)}</button>
            </span>
        </div>
        <button type="button" data-vista="general" hidden></button>
        <div class="g-hud" aria-live="off"><b data-c="hud"></b><span data-c="hud2"></span></div>
        <div class="h-giros" role="toolbar" aria-label="Mover la vista">
            <button type="button" class="g-chip g-chip-icono" data-girar="-1" aria-label="Girar a la izquierda" title="Girar a la izquierda">${svgIcono(ICONOS.izq)}</button>
            <button type="button" class="g-chip g-chip-icono" data-girar="1" aria-label="Girar a la derecha" title="Girar a la derecha">${svgIcono(ICONOS.der)}</button>
            <button type="button" class="g-chip g-chip-icono h-solo-grande" data-zoom="-1" aria-label="Alejar" title="Alejar">${svgIcono(ICONOS.menos)}</button>
            <button type="button" class="g-chip g-chip-icono h-solo-grande" data-zoom="1" aria-label="Acercar" title="Acercar">${svgIcono(ICONOS.mas)}</button>
        </div>
        <div class="g-marca">${brandMarkSvg({ title: 'Buscador Jurídico' })}<span>Buscador Jurídico</span></div>
        <section class="h-ficha" role="group" aria-labelledby="h-ficha-t" aria-describedby="h-ficha-texto" hidden>
            <button type="button" class="h-ficha-x" data-cerrar aria-label="Cerrar">×</button>
            <span class="h-ficha-avance" aria-hidden="true"><i></i></span>
            <p class="h-ficha-paso"></p>
            <div class="h-ficha-cab"><span class="h-ficha-ico"><svg viewBox="0 0 24 24" aria-hidden="true"></svg></span><h2 id="h-ficha-t"></h2></div>
            <p class="h-ficha-texto" id="h-ficha-texto"></p>
            <p class="h-eq" id="h-ficha-eq" hidden></p>
            <div class="h-ficha-pie">
                <button type="button" class="h-flecha" data-ant aria-label="Punto anterior">‹</button>
                <button type="button" class="h-flecha" data-sig aria-label="Punto siguiente">›</button>
                <button type="button" class="h-accion" data-accion></button>
            </div>
            <button type="button" class="h-saltar" data-saltar>Saltar recorrido</button>
        </section>
        <div class="g-flot">
            <nav class="g-flot-partes" aria-label="Puntos clave de la central">${botonesDePartes()}</nav>
            <div class="g-flot-ctrl">${controles()}</div>
        </div>
    </div>
    <div class="g-tablero">
        <section class="g-control" aria-label="Controles">
            ${controles()}
            <p class="h-resumen" data-c="resumen"></p>
            <p class="h-aviso" data-aviso hidden></p>
        </section>
        <section class="h-lecturas" aria-label="Lo que mide la central">
            <div class="g-cifras" id="h-cifras"></div>
            <div class="h-nivel"><span data-c="nivel1T"></span><i><u id="h-nivel-1"></u></i><b data-c="nivel1"></b></div>
            <div class="h-nivel h-nivel-2"><span data-c="nivel2T"></span><i><u id="h-nivel-2"></u></i><b data-c="nivel2"></b></div>
        </section>
        <section class="g-curva h-media">
            <div class="g-curva-cab"><b data-c="aT">Qué pasa adentro</b></div>
            <canvas class="h-diagrama" id="h-diagrama" aria-hidden="true"></canvas>
            <p data-c="aPie"></p>
        </section>
        <section class="g-curva h-media">
            <div class="g-curva-cab"><b id="h-b-t"></b><span class="h-leyenda" id="h-b-ley"></span></div>
            <div class="h-grafica" id="h-b-grafica"></div>
            <p id="h-b-pie"></p>
            <details class="h-tabla"><summary>Ver estos datos como tabla</summary><table id="h-tabla-b"></table></details>
        </section>
        <section class="g-curva h-media">
            <div class="g-curva-cab"><b id="h-c-t"></b><span class="h-leyenda" id="h-c-ley"></span></div>
            <div class="h-grafica" id="h-c-grafica"></div>
            <p id="h-c-pie"></p>
            <details class="h-tabla"><summary>Ver estos datos como tabla</summary><table id="h-tabla-c"></table></details>
        </section>
        <section class="g-curva h-media">
            <div class="g-curva-cab"><b id="h-d-t"></b></div>
            <div class="h-barras" id="h-barras"></div>
            <p id="h-d-pie"></p>
        </section>
        <section class="g-curva h-media">
            <div class="g-curva-cab"><b>Dos formas de hacer vapor</b></div>
            <div class="h-tabla-suelta h-tabla-texto"><table id="h-comparar"></table></div>
            <p>La principal aquí es la de agua en ebullición porque es la de Laguna Verde, la única central nuclear de México.</p>
        </section>
        <section class="g-curva h-media">
            <div class="g-curva-cab"><b>Laguna Verde, Veracruz</b></div>
            <div class="h-tabla-suelta"><table id="h-mexico"></table></div>
            <p>Dos reactores iguales en Alto Lucero. CFE informa 810 MW por unidad y, en 2024, 11,978 GWh entregados: el 8.1 % de la energía que CFE inyectó al sistema. Es cerca del 3 % de la electricidad del país (WNA, con cifras de 2023).</p>
        </section>
        <section class="g-curva h-colores">
            <div class="g-curva-cab"><b>Colores de los tubos</b></div>
            <ul class="h-tubos">${Object.values(FLUIDOS).map(f => `<li><i style="background:${f.color}"></i>${f.nombre}</li>`).join('')}</ul>
            <p>Central de ejemplo con las cifras de una unidad de Laguna Verde; no es el plano real ni un simulador. No está a escala: la vasija y los equipos se dibujaron más grandes para poder verlos. Lo que no sale de una fuente (cuánto frena el vapor, cuánto se calienta el mar) es de ejemplo, para ver la tendencia.</p>
        </section>
        <section class="g-curva h-fuentes" aria-labelledby="h-fuentes-t">
            <div class="g-curva-cab"><b id="h-fuentes-t">Fuentes</b></div>
            <ul>
                ${FUENTES.map(f => `<li><span class="h-fuente-para">${f.para}</span><a href="${f.url}" target="_blank" rel="noopener">${f.titulo}</a><small>${f.autor}, ${f.fecha}${f.editorial ? `. ${f.editorial}` : ''}</small></li>`).join('')}
                <li><span class="h-fuente-para">Energía Limpia, permiso de generación, RNT y RGD</span><b>Ley del Sector Eléctrico, arts. 3 y 19</b><small>Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio</small></li>
                <li><span class="h-fuente-para">Quién conduce la política nuclear y quién vigila la seguridad</span><b>Reglamento Interior de la SENER, arts. 18 y 72 a 74</b><small>Está en el acervo de este sitio</small></li>
            </ul>
        </section>
        <nav class="g-partes" aria-label="Puntos clave de la central">${botonesDePartes()}</nav>
    </div>`;
const $ = s => app.querySelector(s);
const escena = $('.g-escena');
const lienzo = $('.g-lienzo');
const cielo = $('.h-cielo');
const ficha = $('.h-ficha');
const tablero = $('.g-tablero');
const senal = $('.h-senal');
const acciones = $('.g-escena-acciones');
const flot = $('.g-flot');
const botonAdentro = $('[data-adentro]');
const botonRecorrido = $('[data-recorrido]');
const botonLuz = $('[data-luz]');
const botonPantalla = $('[data-pantalla]');
const botonAccion = ficha.querySelector('[data-accion]');
const chips = [...app.querySelectorAll('[data-parte]')];
const pines = [...app.querySelectorAll('[data-pin]')];
const mandos = [...app.querySelectorAll('[data-control="1"]')];
const mandos2 = [...app.querySelectorAll('[data-control="2"]')];
const cajas2 = [...app.querySelectorAll('[data-caja2]')];
const desarmadores = [...app.querySelectorAll('[data-desarme]')];
const relojes = [...app.querySelectorAll('[data-reloj]')];
const botonesRed = [...app.querySelectorAll('[data-sinred]')];

// ------------------------------------------------------------------ escena
let W = 1;
let H = 1;
let renderer;
try {
    renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true });
} catch (err) {
    app.classList.add('sin-webgl');
    avisar({ type: 'concepto-listo', id: FIGURA });
    throw err;
}
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 200);
const M = materiales(P_PLANTA, { movil: MOVIL });
const est = estudio(renderer, scene, M, { movil: MOVIL, oscuro: OSCURO });
const planta = construir(M, P_PLANTA, { movil: MOVIL });
scene.add(planta.raiz);
const DUENO = new Map();
PARTES.forEach((parte, i) => planta.partes[parte].forEach(g => DUENO.set(g, i)));

// ------------------------------------------------------------------ estado
const modoPedido = parametros.get('modo');
const pide = {
    modo: MODOS[modoPedido] ? modoPedido : 'operar', adentro: false, desarme: 0, noche: parametros.get('noche') === '1',
    barras: DEF.barras, flujo: DEF.flujo, pPrim: DEF.pPrim, tSale: DEF.tSale, mes: Number(parametros.get('mes')) || 0, horaLog: 0, sinRed: parametros.get('sinred') === '1', corre: !parametros.has('mes'),
};
let reactor = estadoReactor();
const ve = { adentro: 0, desarme: 0, noche: pide.noche ? 1 : 0, pwr: pide.modo === 'presion' ? 1 : 0, barras: NUCLEO.b0, partes: Object.fromEntries(PARTES.map(p => [p, 0])) };
const fases = planta.giran.map(() => 0);
const camara = { az: -16, el: 18, k: 1, vaz: 0, vel: 0, auto: true, giro: 0, mantener: 0 };
let acomodo = null;
let hoverParte = -1;
let elegida = -1;
const zoom = { f: 0, centro: new THREE.Vector3(0, -0.7, 0), parte: -1, tam: 4, az: -16, el: 18, az0: -16, el0: 18, k0: 1 };
const VUELO_S = 1.25;
const vuelo = { t: 1, c0: new THREE.Vector3(), tam0: 4, az0: 0, el0: 0 };
const cVuelo = new THREE.Vector3();
const libre = { cx: 0, cy: 0, fw: 1, fh: 1 };
const t0 = performance.now();
let entrada = REDUCIR ? 99 : 0;
const auto = { on: false, hecho: !RECORRIDO, t: 0 };
let completa = false;
let ultimoTablero = 0;
let visible = true;
let enPantalla = true;
let tableroEnPantalla = false;
document.addEventListener('visibilitychange', () => { visible = document.visibilityState === 'visible'; });
// fuera de la vista la escena no se dibuja, y el recorrido espera a que regresen
if ('IntersectionObserver' in window) {
    new IntersectionObserver(l => { enPantalla = l.at(-1).isIntersecting; }, { threshold: 0.15 }).observe(escena);
    new IntersectionObserver(l => { tableroEnPantalla = l.at(-1).isIntersecting; }).observe(tablero);
}

function acomodar() {
    const vertical = W / H < 0.9;
    acomodo = { vertical, angosto: W < 620, azBase: vertical ? -10 : -16, elBase: vertical ? 20 : 18 };
    if (camara.auto) { camara.az = acomodo.azBase; camara.el = acomodo.elBase; }
    escena.classList.toggle('es-angosta', acomodo.angosto);
}
function medirLibre(suavizado) {
    const re = escena.getBoundingClientRect();
    let [l, r, t, b] = [0, W, 0, H];
    t = acomodo.angosto ? acciones.getBoundingClientRect().bottom - re.top + 2 : 10;
    if (completa) b = Math.min(b, flot.getBoundingClientRect().top - re.top - 4);
    if (!ficha.hidden) {
        const rf = ficha.getBoundingClientRect();
        if (acomodo.angosto) b = Math.min(b, rf.top - re.top - 4);
        else r = Math.min(r, rf.left - re.left - 6);
    }
    const k = suavizado;
    const destino = { cx: (l + r) / 2, cy: (t + b) / 2, fw: Math.max(120, r - l), fh: Math.max(120, b - t) };
    for (const c of Object.keys(destino)) libre[c] = k >= 1 ? destino[c] : libre[c] + (destino[c] - libre[c]) * k;
    // en pantalla completa la ficha va sobre los controles
    escena.style.setProperty('--flot', completa ? `${Math.max(0, re.bottom - flot.getBoundingClientRect().top)}px` : '0px');
}
// distancia para que todo el bloque quepa en el hueco libre, mirándolo desde este ángulo
function distanciaGeneral(az, el) {
    const [Lx, Lz, alto] = [14.6, 9, 6.9];
    const [sa, ca] = [Math.abs(Math.sin(az * D2R)), Math.abs(Math.cos(az * D2R))];
    const w = Lx * ca + Lz * sa;
    const h = (Lx * sa + Lz * ca) * Math.sin(el * D2R) + alto * Math.cos(el * D2R);
    const tv = Math.tan((camera.fov * D2R) / 2);
    return Math.max((h * H) / (2 * tv * libre.fh), (w * H) / (2 * tv * libre.fw)) * 1.1;
}

// ------------------------------------------------------------------ manos
const punteros = new Map();
let pinza = 0;
let movido = 0;
let ultimaMano = performance.now();
const tomar = () => { camara.auto = false; ultimaMano = performance.now(); };
lienzo.addEventListener('pointerdown', e => {
    if (auto.on) pararRecorrido();
    punteros.set(e.pointerId, [e.clientX, e.clientY]);
    try { lienzo.setPointerCapture(e.pointerId); } catch { /* puntero sintético */ }
    movido = 0;
    if (punteros.size === 2) { const [a, b] = [...punteros.values()]; pinza = Math.hypot(a[0] - b[0], a[1] - b[1]); }
});
lienzo.addEventListener('pointermove', e => {
    if (!punteros.has(e.pointerId)) { apuntar(e.clientX, e.clientY); return; }
    const [x0, y0] = punteros.get(e.pointerId);
    punteros.set(e.pointerId, [e.clientX, e.clientY]);
    if (punteros.size === 2) {
        const [a, b] = [...punteros.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (pinza) { camara.k = clamp(camara.k * (pinza / d), 0.3, 1.7); camara.kMeta = undefined; }
        pinza = d;
        tomar();
        return;
    }
    const dx = e.clientX - x0;
    const dy = e.clientY - y0;
    movido += Math.abs(dx) + Math.abs(dy);
    if (movido < 4) return;
    tomar();
    const ang = -dx * 0.3;
    const elev = dy * 0.2;
    camara.az += ang;
    camara.el = clamp(camara.el + elev, 3, 80);
    camara.vaz = ang * 26;
    camara.vel = elev * 26;
    escena.classList.add('arrastra');
});
lienzo.addEventListener('pointerup', e => {
    const clic = punteros.has(e.pointerId) && movido < 4 && punteros.size === 1;
    punteros.delete(e.pointerId);
    pinza = 0;
    if (!punteros.size) escena.classList.remove('arrastra');
    if (!clic) return;
    const j = parteEn(e.clientX, e.clientY);
    if (j >= 0) elegir(j); else if (elegida >= 0) cerrarFicha();
});
lienzo.addEventListener('pointercancel', e => { punteros.delete(e.pointerId); pinza = 0; escena.classList.remove('arrastra'); });
lienzo.addEventListener('pointerleave', () => { if (!punteros.size) hoverParte = -1; });
lienzo.addEventListener('wheel', e => { e.preventDefault(); tomar(); camara.k = clamp(camara.k * Math.exp(e.deltaY * 0.0012), 0.3, 1.7); camara.kMeta = undefined; }, { passive: false });

const rayo = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function parteEn(x, y) {
    if (entrada < ENTRADA_S * 0.7) return -1;
    const r = lienzo.getBoundingClientRect();
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    rayo.setFromCamera(ndc, camera);
    for (const golpe of rayo.intersectObject(planta.raiz, true)) {
        const o0 = golpe.object;
        if (!o0.isMesh) continue;
        const mat = Array.isArray(o0.material) ? o0.material[0] : o0.material;
        if (mat.transparent && mat.opacity < 0.3) continue;
        let o = o0;
        while (o && !DUENO.has(o)) o = o.parent;
        if (o) return DUENO.get(o);
    }
    return -1;
}
let ultimoApunte = 0;
function apuntar(x, y) {
    const ahora = performance.now();
    if (ahora - ultimoApunte < 100) return;
    ultimoApunte = ahora;
    hoverParte = parteEn(x, y);
    lienzo.style.cursor = hoverParte >= 0 ? 'pointer' : '';
    pines.forEach((p, i) => p.classList.toggle('is-hover', i === hoverParte));
}

// ------------------------------------------------------------------ fichas y botones
function pararRecorrido() {
    auto.on = false;
    auto.hecho = true;
    app.classList.remove('is-auto');
    rotular();
}
function textoAccion() {
    const a = elegida === FINAL ? 'desarme' : FICHAS[elegida]?.accion;
    if (a === 'noche') return pide.noche ? 'Hacer de día' : 'Hacer de noche';
    if (a === 'desarme') return pide.desarme > 0.5 ? 'Armar' : 'Desarmar';
    if (a === 'apagar') return pide.modo === 'apagar' ? 'Encenderlo otra vez' : 'Apagar el reactor';
    if (a === 'sinred') return pide.sinRed ? 'Regresa la luz de fuera' : 'Se va la luz de fuera';
    if (a === 'recarga') return 'Ver otra recarga';
    return '';
}
function ponerDesarme(valor) {
    pide.desarme = clamp01(valor);
    desarmadores.forEach(d => { d.value = String(pide.desarme); });
}
function rotular() {
    botonAdentro.textContent = pide.adentro ? 'Ver por fuera' : 'Ver por dentro';
    botonAdentro.setAttribute('aria-pressed', String(pide.adentro));
    botonLuz.innerHTML = svgIcono(pide.noche ? ICONOS.sol : ICONOS.luna);
    const textoLuz = pide.noche ? 'Cambiar a día' : 'Cambiar a noche';
    botonLuz.setAttribute('aria-label', textoLuz);
    botonLuz.title = textoLuz;
    botonLuz.setAttribute('aria-pressed', String(pide.noche));
    const enCurso = auto.on || !auto.hecho;
    botonRecorrido.setAttribute('aria-pressed', String(enCurso));
    botonRecorrido.querySelector('span').textContent = enCurso ? 'Pausar recorrido' : 'Ver recorrido';
    app.querySelectorAll('[data-modo]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.modo === pide.modo)));
    if (!ficha.hidden) botonAccion.textContent = textoAccion();
    chips.forEach(c => c.setAttribute('aria-pressed', String(Number(c.dataset.parte) === elegida)));
    pines.forEach((p, i) => p.classList.toggle('is-elegido', i === elegida));
    relojes.forEach(b => {
        b.hidden = pide.modo !== 'apagar' && pide.modo !== 'ciclo';
        const que = pide.modo === 'apagar' ? 'el tiempo' : 'los meses';
        b.innerHTML = `${svgIcono(pide.corre ? ICONOS.pausa : ICONOS.seguir)}<span>${pide.corre ? `Pausar ${que}` : `Seguir ${que}`}</span>`;
    });
    botonesRed.forEach(b => {
        b.hidden = pide.modo !== 'apagar';
        b.setAttribute('aria-pressed', String(pide.sinRed));
        b.querySelector('span').textContent = pide.sinRed ? 'Regresa la luz de fuera' : 'Se va la luz de fuera';
    });
}
function cambiarModo(m) {
    if (pide.modo === m) return;
    if (m === 'apagar') { pide.horaLog = 0; pide.corre = !REDUCIR; pide.sinRed = false; }
    if (m === 'ciclo') { pide.mes = 0; pide.corre = !REDUCIR; }
    if (pide.modo === 'apagar') reactor = estadoReactor({ barras: pide.barras / 100, flujo: pide.flujo / 100 });
    pide.modo = m;
    pintarTablero();
    rotular();
}
function elegir(i, { solo = false, desdeApp = false } = {}) {
    if (!solo) pararRecorrido();
    elegida = (i + FINAL + 1) % (FINAL + 1);
    const final = elegida === FINAL;
    const f = FICHAS[elegida];
    ficha.querySelector('.h-ficha-paso').textContent = final ? 'Listo' : `${elegida + 1} de ${FINAL}`;
    ficha.querySelector('.h-ficha-ico svg').innerHTML = final ? ICONO_TOCAR : f.icono;
    ficha.querySelector('#h-ficha-t').textContent = final ? '¿Quedó alguna duda?' : f.nombre;
    ficha.querySelector('.h-ficha-texto').textContent = final
        ? 'Toca cualquier punto para volver a verlo. Mueve las barras de control y mira cómo se asienta la potencia, elige «Apagado» para ver el calor que queda, o «Agua a presión» para comparar con el otro tipo de reactor.'
        : f.texto;
    const eq = ficha.querySelector('#h-ficha-eq');
    eq.hidden = final || !f.eq;
    if (!eq.hidden) eq.textContent = f.eq;
    ficha.classList.toggle('is-final', final);
    const barrita = ficha.querySelector('.h-ficha-avance i');
    barrita.style.animation = 'none';
    void barrita.offsetWidth;
    barrita.style.animation = '';
    barrita.style.animationDuration = `${pasoS(elegida)}s`;
    ficha.hidden = false;
    app.classList.add('is-ficha');
    camara.auto = false;
    ultimaMano = performance.now();
    if (!final) {
        // solo en la tira de pantalla completa: scrollIntoView movería también la página de Aprende
        const tira = $('.g-flot-partes');
        const chip = tira.querySelector(`[data-parte="${elegida}"]`);
        if (completa && chip) tira.scrollTo({ left: chip.offsetLeft - tira.clientWidth / 2 + chip.offsetWidth / 2, behavior: REDUCIR ? 'auto' : 'smooth' });
        cambiarModo(f.modo);
        if (f.mes !== undefined) { pide.mes = f.mes; pide.corre = !REDUCIR; }
        if (solo && f.recorrido) {
            if (f.recorrido.noche !== undefined) pide.noche = f.recorrido.noche;
            if (f.recorrido.adentro !== undefined) pide.adentro = f.recorrido.adentro;
        }
    }
    if (!solo && !desdeApp) avisar({ type: 'concepto-part', figura: FIGURA, n: final ? 0 : elegida + 1 });
    rotular();
}
function cerrarFicha({ desdeApp = false } = {}) {
    const habia = elegida >= 0;
    elegida = -1;
    zoom.parte = -1;
    ficha.hidden = true;
    app.classList.remove('is-ficha');
    if (habia && !desdeApp) avisar({ type: 'concepto-part', figura: FIGURA, n: 0 });
    rotular();
}
function hacerAccion() {
    const a = elegida === FINAL ? 'desarme' : FICHAS[elegida]?.accion;
    if (a === 'noche') pide.noche = !pide.noche;
    if (a === 'desarme') ponerDesarme(pide.desarme > 0.5 ? 0 : 1);
    if (a === 'apagar') cambiarModo(pide.modo === 'apagar' ? 'operar' : 'apagar');
    if (a === 'sinred') { pide.sinRed = !pide.sinRed; firmaTablero = ''; ultimoTablero = 0; }
    if (a === 'recarga') { cambiarModo('ciclo'); pide.mes = 17.2; pide.corre = !REDUCIR; }
    rotular();
}
ficha.querySelector('[data-cerrar]').addEventListener('click', () => { pararRecorrido(); cerrarFicha(); });
ficha.querySelector('[data-saltar]').addEventListener('click', () => { pararRecorrido(); pide.adentro = false; pide.noche = false; cambiarModo('operar'); elegir(FINAL); });
ficha.querySelector('[data-ant]').addEventListener('click', () => elegir(elegida - 1));
ficha.querySelector('[data-sig]').addEventListener('click', () => elegir(elegida + 1));
botonAccion.addEventListener('click', () => { pararRecorrido(); hacerAccion(); });
const alternar = i => { if (elegida === i) { pararRecorrido(); cerrarFicha(); } else elegir(i); };
chips.forEach(c => c.addEventListener('click', () => {
    alternar(Number(c.dataset.parte));
    // la lista va debajo de las gráficas: quien la toca debe ver la central
    if (!completa && elegida >= 0 && c.closest('.g-partes')) escena.scrollIntoView({ block: 'nearest', behavior: REDUCIR ? 'auto' : 'smooth' });
}));
pines.forEach((c, i) => c.addEventListener('click', () => alternar(i)));
botonRecorrido.addEventListener('click', () => {
    if (auto.on || !auto.hecho) { pararRecorrido(); return; }
    Object.assign(auto, { on: true, hecho: false, t: 0 });
    app.classList.add('is-auto');
    ponerDesarme(0);
    elegir(0, { solo: true });
});
$('[data-vista="general"]').addEventListener('click', () => { pararRecorrido(); cerrarFicha(); camara.auto = true; });
app.querySelectorAll('[data-modo]').forEach(b => b.addEventListener('click', () => { pararRecorrido(); if (elegida >= 0) cerrarFicha(); cambiarModo(b.dataset.modo); }));
botonAdentro.addEventListener('click', () => { pararRecorrido(); pide.adentro = !pide.adentro; rotular(); });
botonLuz.addEventListener('click', () => { pararRecorrido(); pide.noche = !pide.noche; rotular(); });
desarmadores.forEach(d => d.addEventListener('input', () => { pararRecorrido(); ponerDesarme(Number(d.value)); rotular(); }));
relojes.forEach(b => b.addEventListener('click', () => {
    pararRecorrido();
    pide.corre = !pide.corre;
    if (pide.corre && pide.modo === 'ciclo' && pide.mes >= LIMITES.mes[1] - 0.01) pide.mes = 0;
    if (pide.corre && pide.modo === 'apagar' && pide.horaLog >= LOG_MAX - 0.01) pide.horaLog = 0;
    rotular();
}));
botonesRed.forEach(b => b.addEventListener('click', () => { pararRecorrido(); pide.sinRed = !pide.sinRed; firmaTablero = ''; ultimoTablero = 0; rotular(); }));
app.querySelectorAll('[data-girar]').forEach(b => {
    const lado = Number(b.dataset.girar);
    let desde = 0;
    let conPuntero = false;
    b.addEventListener('pointerdown', () => { pararRecorrido(); tomar(); conPuntero = true; desde = performance.now(); camara.mantener = lado; });
    const soltar = () => {
        if (!camara.mantener) return;
        if (performance.now() - desde < 260) camara.giro += lado * 45;
        camara.mantener = 0;
    };
    b.addEventListener('pointerup', soltar);
    b.addEventListener('pointerleave', soltar);
    b.addEventListener('pointercancel', soltar);
    b.addEventListener('click', () => { if (!conPuntero) { pararRecorrido(); tomar(); camara.giro += lado * 45; } conPuntero = false; });
});
app.querySelectorAll('[data-zoom]').forEach(b => {
    const lado = Number(b.dataset.zoom);
    b.addEventListener('click', () => { pararRecorrido(); tomar(); camara.kMeta = clamp((camara.kMeta ?? camara.k) * (lado > 0 ? 0.8 : 1.25), 0.3, 1.7); });
});
addEventListener('keydown', e => {
    if (e.key === 'Escape' && completa && !enNativa()) { simular(false); return; }
    if (e.key === 'Escape' && elegida >= 0) { pararRecorrido(); cerrarFicha(); }
    if (elegida >= 0 && e.target === document.body && e.key === 'ArrowRight') elegir(elegida + 1);
    if (elegida >= 0 && e.target === document.body && e.key === 'ArrowLeft') elegir(elegida - 1);
});
const deRango = ([a, b], k) => a + (b - a) * k;
const aRango = ([a, b], x) => ((x - a) / (b - a)) * 100;
mandos.forEach(d => d.addEventListener('input', () => {
    pararRecorrido();
    const k = Number(d.value) / 100;
    if (pide.modo === 'operar') pide.barras = deRango(LIMITES.barras, k);
    if (pide.modo === 'apagar') { pide.horaLog = k * LOG_MAX; pide.corre = false; rotular(); }
    if (pide.modo === 'presion') pide.pPrim = deRango(LIMITES.pPrim, k);
    if (pide.modo === 'ciclo') { pide.mes = deRango(LIMITES.mes, k); pide.corre = false; rotular(); }
    ponerMando();
    ultimoTablero = 0;
}));
mandos2.forEach(d => d.addEventListener('input', () => {
    pararRecorrido();
    const k = Number(d.value) / 100;
    if (pide.modo === 'operar') pide.flujo = deRango(LIMITES.flujo, k);
    if (pide.modo === 'presion') pide.tSale = deRango(LIMITES.tSale, k);
    ponerMando();
    ultimoTablero = 0;
}));
// Lo que manda Aprende: elegir una parte desde su lista.
addEventListener('message', event => {
    if (event.origin !== location.origin || event.data?.type !== 'concepto-select-part') return;
    pararRecorrido();
    const n = Number(event.data.n) || 0;
    if (n >= 1 && n <= FINAL) elegir(n - 1, { desdeApp: true }); else cerrarFicha({ desdeApp: true });
});

// Pantalla completa: la del navegador cuando existe; si no (iPhone), la escena cubre la ventana y Aprende agranda el marco.
const NATIVA = Boolean((escena.requestFullscreen || escena.webkitRequestFullscreen) && (document.fullscreenEnabled || document.webkitFullscreenEnabled));
const enNativa = () => document.fullscreenElement || document.webkitFullscreenElement;
let simulando = false;
function ponerCompleta(on, simulada = false) {
    if (simulando && !simulada) avisar({ type: 'concepto-fullscreen', id: FIGURA, on: false });
    simulando = on && simulada;
    completa = on;
    escena.classList.toggle('completa', on);
    escena.classList.toggle('simulada', on && simulada);
    raizDoc.classList.toggle('g-bloqueo', on && simulada);
    const texto = on ? 'Salir de pantalla completa' : 'Pantalla completa';
    botonPantalla.setAttribute('aria-pressed', String(on));
    botonPantalla.setAttribute('aria-label', texto);
    botonPantalla.title = texto;
    botonPantalla.innerHTML = svgIcono(on ? ICONOS.cerrar : ICONOS.abrir);
    if (simulada) avisar({ type: 'concepto-fullscreen', id: FIGURA, on });
    ajustar();
}
const simular = on => ponerCompleta(on, true);
botonPantalla.addEventListener('click', () => {
    if (!completa) {
        if (!NATIVA) { simular(true); return; }
        const pedir = escena.requestFullscreen ? escena.requestFullscreen() : escena.webkitRequestFullscreen();
        let contesto = false;
        pedir?.then?.(() => { contesto = true; }, () => { contesto = true; if (!enNativa()) simular(true); });
        setTimeout(() => { if (!contesto && !enNativa() && !completa) simular(true); }, 1200);
    } else if (enNativa()) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else simular(false);
});
for (const ev of ['fullscreenchange', 'webkitfullscreenchange']) document.addEventListener(ev, () => ponerCompleta(Boolean(enNativa())));

// ------------------------------------------------------------------ tablero: cifras y gráficas
const diagrama = crearDiagrama($('#h-diagrama'));
let colores = null;
function leerColores() {
    const css = getComputedStyle(raizDoc);
    const v = n => css.getPropertyValue(n).trim();
    colores = { tinta: v('--tinta'), suave: v('--tinta-suave'), linea: v('--linea'), superficie: v('--ceniza'), fondoPanel: v('--papel-alto'), guinda: v('--rojo'), vapor: FLUIDOS.vapor.color, agua: FLUIDOS.agua.color, mar: FLUIDOS.mar.color, primario: FLUIDOS.primario.color };
    return colores;
}
const MARGEN = { i: 36, d: 12, a: 18, b: 36 };
function medirGrafica(el) {
    const ancho = clamp(Math.round(el.clientWidth || 320), 280, 760);
    return [ancho, clamp(Math.round(ancho * 0.54), 176, 300)];
}
/** Dibuja una gráfica en SVG: una línea o varias. Una sola escala, cruz y punta al pasar. */
function pintarGrafica(el, cfg) {
    const [ANCHO, ALTO] = medirGrafica(el);
    const sx = x => MARGEN.i + ((x - cfg.xMin) / (cfg.xMax - cfg.xMin)) * (ANCHO - MARGEN.i - MARGEN.d);
    const sy = y => MARGEN.a + (1 - (y - cfg.yMin) / (cfg.yMax - cfg.yMin)) * (ALTO - MARGEN.a - MARGEN.b);
    const linea = (f, n = 70) => {
        let d = '';
        for (let k = 0; k <= n; k++) { const x = cfg.xMin + ((cfg.xMax - cfg.xMin) * k) / n; d += `${k ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(clamp(f(x), cfg.yMin, cfg.yMax)).toFixed(1)}`; }
        return d;
    };
    let marcas = '';
    if (cfg.f) {
        const d = linea(cfg.f);
        marcas += `<path class="h-g-area" d="${d}L${sx(cfg.xMax)} ${sy(cfg.yMin)}L${sx(cfg.xMin)} ${sy(cfg.yMin)}Z"/><path class="h-g-linea" d="${d}"/>`;
    }
    for (const l of cfg.lineas || []) marcas += `<path class="h-g-serie ${l.clase}" d="${linea(l.f, 96)}"/>`;
    el.innerHTML = `<svg viewBox="0 0 ${ANCHO} ${ALTO}" role="img" aria-label="${cfg.titulo}: ${cfg.etY} según ${cfg.etX}">
        ${cfg.ticksY.map(y => `<line class="h-g-rejilla" x1="${MARGEN.i}" x2="${ANCHO - MARGEN.d}" y1="${sy(y)}" y2="${sy(y)}"/><text class="h-g-t" x="${MARGEN.i - 5}" y="${sy(y) + 3.5}" text-anchor="end">${cfg.fy(y)}</text>`).join('')}
        ${cfg.ticksX.map(x => `<text class="h-g-t" x="${sx(x)}" y="${ALTO - MARGEN.b + 13}" text-anchor="middle">${cfg.fx(x)}</text>`).join('')}
        <text class="h-g-t" x="${(MARGEN.i + ANCHO - MARGEN.d) / 2}" y="${ALTO - 3}" text-anchor="middle">${cfg.etX}</text>
        <text class="h-g-t" x="${MARGEN.i}" y="${MARGEN.a - 3}" text-anchor="start">${cfg.etY}</text>
        ${marcas}
        ${(cfg.puntos || []).map(p => `<circle class="h-g-punto" cx="${sx(p.x)}" cy="${sy(p.y)}" r="5"/><text class="h-g-rt" x="${sx(p.x) + (p.izq ? -9 : 9)}" y="${sy(p.y) + 4}" text-anchor="${p.izq ? 'end' : 'start'}">${p.texto}</text>`).join('')}
        ${(cfg.refsX || []).map(r => `<line class="h-g-ref" x1="${sx(r.x)}" x2="${sx(r.x)}" y1="${MARGEN.a}" y2="${ALTO - MARGEN.b}"/><text class="h-g-rt" x="${sx(r.x) - 3}" y="${MARGEN.a + 10}" text-anchor="end">${r.texto}</text>`).join('')}
        <line class="h-g-ahora" y1="${MARGEN.a}" y2="${ALTO - MARGEN.b}" visibility="hidden"/>
        <line class="h-g-guia" y1="${MARGEN.a}" y2="${ALTO - MARGEN.b}" visibility="hidden"/>
        <circle class="h-g-marca" r="5" visibility="hidden"/>
    </svg><div class="h-g-punta" hidden></div>`;
    const svgEl = el.querySelector('svg');
    const guia = el.querySelector('.h-g-guia');
    const punta = el.querySelector('.h-g-punta');
    const ahora = el.querySelector('.h-g-ahora');
    const marca = el.querySelector('.h-g-marca');
    svgEl.addEventListener('pointermove', e => {
        const r = svgEl.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * ANCHO;
        const x = clamp(cfg.xMin + ((px - MARGEN.i) / (ANCHO - MARGEN.i - MARGEN.d)) * (cfg.xMax - cfg.xMin), cfg.xMin, cfg.xMax);
        guia.setAttribute('x1', sx(x));
        guia.setAttribute('x2', sx(x));
        guia.setAttribute('visibility', 'visible');
        punta.hidden = false;
        punta.textContent = cfg.punta(x);
        punta.style.left = `${clamp((sx(x) / ANCHO) * 100, 26, 74)}%`;
    });
    svgEl.addEventListener('pointerleave', () => { guia.setAttribute('visibility', 'hidden'); punta.hidden = true; });
    return {
        cfg,
        marcar(x, y) { marca.setAttribute('cx', sx(x)); marca.setAttribute('cy', sy(y)); marca.setAttribute('visibility', 'visible'); },
        ahora(x) { ahora.setAttribute('x1', sx(x)); ahora.setAttribute('x2', sx(x)); ahora.setAttribute('visibility', 'visible'); },
    };
}
/** Diagrama temperatura y entropía: la campana del fluido y el camino del ciclo, con sus puntos numerados. */
function pintarTS(el, L) {
    const [ANCHO, ALTO] = medirGrafica(el);
    const c = puntosCiclo(L);
    const tabla = c.tabla;
    const esAgua = tabla === AGUA;
    const [sMin, sMax, tMax] = esAgua ? [0, 9, 400] : [-0.2, 1.6, 200];
    const sx = s => MARGEN.i + ((s - sMin) / (sMax - sMin)) * (ANCHO - MARGEN.i - MARGEN.d);
    const sy = t => MARGEN.a + (1 - t / tMax) * (ALTO - MARGEN.a - MARGEN.b);
    const izq = tabla.filas.map(f => [f[4], f[0]]);
    const der = tabla.filas.map(f => [f[5], f[0]]).reverse();
    const camp = [...izq, [tabla.critico[4], tabla.critico[0]], ...der];
    const dCamp = camp.map(([s, t], i) => `${i ? 'L' : 'M'}${sx(s).toFixed(1)} ${sy(t).toFixed(1)}`).join('');
    const dRuta = c.ruta.map(([s, t], i) => `${i ? 'L' : 'M'}${sx(s).toFixed(1)} ${sy(t).toFixed(1)}`).join('');
    const dOtra = c.otra ? c.otra.map(([s, t], i) => `${i ? 'L' : 'M'}${sx(s).toFixed(1)} ${sy(t).toFixed(1)}`).join('') : '';
    const ticksS = esAgua ? [0, 3, 6, 9] : [0, 0.5, 1, 1.5];
    const ticksT = esAgua ? [0, 100, 200, 300, 400] : [0, 50, 100, 150, 200];
    el.innerHTML = `<svg viewBox="0 0 ${ANCHO} ${ALTO}" role="img" aria-label="Diagrama de temperatura contra entropía del ${tabla.nombre}, con el camino del ciclo">
        ${ticksT.map(t => `<line class="h-g-rejilla" x1="${MARGEN.i}" x2="${ANCHO - MARGEN.d}" y1="${sy(t)}" y2="${sy(t)}"/><text class="h-g-t" x="${MARGEN.i - 5}" y="${sy(t) + 3.5}" text-anchor="end">${t}</text>`).join('')}
        ${ticksS.map(s => `<text class="h-g-t" x="${sx(s)}" y="${ALTO - MARGEN.b + 13}" text-anchor="middle">${num(s, s % 1 ? 1 : 0)}</text>`).join('')}
        <text class="h-g-t" x="${(MARGEN.i + ANCHO - MARGEN.d) / 2}" y="${ALTO - 3}" text-anchor="middle">Entropía (kJ/kg·K)</text>
        <text class="h-g-t" x="${MARGEN.i}" y="${MARGEN.a - 3}" text-anchor="start">Temperatura (°C)</text>
        <path class="h-ts-campana" d="${dCamp}"/>
        ${dOtra ? `<path class="h-ts-otra" d="${dOtra}"/>` : ''}
        <path class="h-ts-ruta" d="${dRuta}"/>
        ${c.puntos.map(p => `<g class="h-ts-p" data-n="${p.n}"><circle cx="${sx(p.s)}" cy="${sy(p.T)}" r="7.5"/><text x="${sx(p.s)}" y="${sy(p.T) + 3.2}" text-anchor="middle">${p.n}</text></g>`).join('')}
        <rect x="${MARGEN.i}" y="${MARGEN.a}" width="${ANCHO - MARGEN.i - MARGEN.d}" height="${ALTO - MARGEN.a - MARGEN.b}" fill="transparent"/>
    </svg><div class="h-g-punta" hidden></div>`;
    const svgEl = el.querySelector('svg');
    const punta = el.querySelector('.h-g-punta');
    svgEl.addEventListener('pointermove', e => {
        const r = svgEl.getBoundingClientRect();
        const [x, y] = [((e.clientX - r.left) / r.width) * ANCHO, ((e.clientY - r.top) / r.height) * ALTO];
        let mejor = null;
        let dm = 1e9;
        for (const p of c.puntos) { const d = Math.hypot(sx(p.s) - x, sy(p.T) - y); if (d < dm) { dm = d; mejor = p; } }
        if (!mejor) return;
        punta.hidden = false;
        punta.textContent = `${mejor.n}. ${mejor.nombre}: ${num(mejor.T)} °C · ${num(mejor.P, mejor.P < 1 ? 2 : 1)} bar`;
        punta.style.left = `${clamp((sx(mejor.s) / ANCHO) * 100, 26, 74)}%`;
        el.querySelectorAll('.h-ts-p').forEach(g => g.classList.toggle('es-elegido', Number(g.dataset.n) === mejor.n));
    });
    svgEl.addEventListener('pointerleave', () => { punta.hidden = true; el.querySelectorAll('.h-ts-p').forEach(g => g.classList.remove('es-elegido')); });
    return c;
}
const leyenda = series => series.map(s => `<i class="${s.clase}"></i>${s.nombre}`).join('');
const tablaHTML = (cab, filas) => `<thead><tr>${cab.map(c => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${filas.map(f => `<tr>${f.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`;
let graficas = {};
const ETIQUETAS_TIEMPO = [[0, '1 s'], [Math.log10(T_UNO.min), '1 min'], [Math.log10(T_UNO.h), '1 h'], [Math.log10(T_UNO.d), '1 día'], [LOG_MAX, '1 sem.']];
const etiquetaLog = (lista, x) => lista.find(([v]) => Math.abs(v - x) < 0.01)?.[1] ?? '';
function pintarGraficas() {
    const m = pide.modo;
    const L = calcular({ modo: m, reactor, tApagado: 10 ** pide.horaLog, sinRed: pide.sinRed, pPrim: pide.pPrim, tSale: pide.tSale, mes: pide.mes });
    graficas.c = null;
    if (m === 'operar') {
        const F = pide.flujo / 100;
        const f = b => equilibrio({ barras: b / 100, flujo: F }) * 100;
        $('#h-b-t').textContent = 'Potencia según las barras de control';
        $('#h-b-ley').textContent = '';
        $('#h-b-pie').textContent = `Con las bombas al ${num(pide.flujo)} %. Casi todo el control está cerca de la orilla: con las barras a media entrada la reacción ya se apaga. Bajar las bombas da más vapor en el núcleo y la potencia baja sola.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Potencia según las barras de control', xMin: LIMITES.barras[0], xMax: LIMITES.barras[1], yMin: 0, yMax: 120, ticksX: [0, 10, 20, 30, 40, 50, 60, 70], ticksY: [0, 25, 50, 75, 100], etX: 'Barras de control adentro (%)', etY: 'Potencia del reactor (%)', f, fx: x => num(x), fy: y => num(y), punta: x => `${num(x)} % adentro · ${num(f(x))} % de potencia` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Barras adentro', 'Potencia', 'Vapor t/h', 'MW a la red'], [0, 12, 20, 30, 40, 50].map(b => { const P = equilibrio({ barras: b / 100, flujo: F }); const q = cicloVapor({ Q: UNIDAD.termica * P }); return [`${num(b)} %`, `${num(P * 100)} %`, num(q.mv * 3.6), num(q.neta)]; }));
    } else if (m === 'apagar') {
        const Qf = x => UNIDAD.termica * calorResidual(10 ** x);
        const Af = x => aguaParaEnfriar(Qf(x));
        const ticks = ETIQUETAS_TIEMPO.map(e => e[0]);
        $('#h-b-t').textContent = 'Calor que sigue saliendo del combustible';
        $('#h-b-ley').textContent = '';
        $('#h-b-pie').textContent = 'El tiempo va en potencias de diez: cada marca es mucho más lejos que la anterior. El calor cae rápido, pero nunca de golpe.';
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Calor que sigue saliendo del combustible', xMin: 0, xMax: LOG_MAX, yMin: 0, yMax: 160, ticksX: ticks, ticksY: [0, 40, 80, 120, 160], etX: 'Tiempo desde que se apagó', etY: 'Calor (MW)', f: Qf, fx: x => etiquetaLog(ETIQUETAS_TIEMPO, x), fy: y => num(y), punta: x => `${numTiempo(10 ** x)} · ${num(Qf(x), 1)} MW` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Tiempo', 'Parte del calor', 'MW'], [[1, '1 s'], [T_UNO.min, '1 min'], [T_UNO.h, '1 h'], [T_UNO.d, '1 día'], [T_UNO.sem, '1 semana']].map(([s, t]) => [t, `${num(calorResidual(s) * 100, 1)} %`, num(UNIDAD.termica * calorResidual(s), 1)]));
        $('#h-c-t').textContent = 'Agua que hay que hervir para llevárselo';
        $('#h-c-ley').textContent = '';
        $('#h-c-pie').textContent = 'Si el agua entra a 40 °C y sale como vapor. Por eso hace falta agua y una forma de moverla durante días, aunque el reactor ya no genere nada.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Agua que hay que hervir para llevárselo', xMin: 0, xMax: LOG_MAX, yMin: 0, yMax: 240, ticksX: ticks, ticksY: [0, 60, 120, 180, 240], etX: 'Tiempo desde que se apagó', etY: 'Agua (t/h)', f: Af, fx: x => etiquetaLog(ETIQUETAS_TIEMPO, x), fy: y => num(y), punta: x => `${numTiempo(10 ** x)} · ${num(Af(x))} t/h` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Tiempo', 't/h de agua'], [[1, '1 s'], [T_UNO.min, '1 min'], [T_UNO.h, '1 h'], [T_UNO.d, '1 día'], [T_UNO.sem, '1 semana']].map(([s, t]) => [t, num(aguaParaEnfriar(UNIDAD.termica * calorResidual(s)))]));
    } else if (m === 'presion') {
        const f = T => sat(AGUA, T).P;
        const p = L.presion;
        $('#h-b-t').textContent = 'Cuándo hierve el agua';
        $('#h-b-ley').textContent = '';
        $('#h-b-pie').textContent = `Arriba de la curva el agua sigue líquida; debajo ya es vapor. El agua en ebullición trabaja justo sobre la curva. El agua a presión va arriba: a ${num(p.pPrim)} bar no hierve hasta ${num(p.tHierve)} °C.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Cuándo hierve el agua', xMin: 250, xMax: 350, yMin: 0, yMax: 180, ticksX: [250, 275, 300, 325, 350], ticksY: [0, 60, 120, 180], etX: 'Temperatura (°C)', etY: 'Presión (bar)', f, fx: x => num(x), fy: y => num(y), puntos: [{ x: BASE.tVapor, y: BASE.pVapor, texto: 'Ebullición' }, { x: p.tSale, y: p.pPrim, texto: 'A presión', izq: true }], punta: x => `A ${num(x)} °C hierve con ${num(f(x))} bar` });
        $('#h-tabla-b').innerHTML = tablaHTML(['bar', 'Hierve a °C'], [50, 70, 100, 125, 155, 170].map(b => [num(b), num(aguaAPresion({ pPrim: b }).tHierve)]));
    } else {
        const lineas = [
            { clase: 'h-s-max', nombre: 'Uranio-235', f: x => composicion(x).u235 },
            { clase: 'h-s-actual', nombre: 'Plutonio que se parte', f: x => composicion(x).pu },
            { clase: 'h-s-sin', nombre: 'Residuos', f: x => composicion(x).residuos },
        ];
        $('#h-b-t').textContent = 'Qué trae un ensamble, mes con mes';
        $('#h-b-ley').innerHTML = leyenda(lineas);
        $('#h-b-pie').textContent = `Al salir, tras unos ${num(MESES_DENTRO / 12)} años y ${num(QUEMADO_FINAL)} GWd por tonelada, aún le queda uranio-235 y ya hizo plutonio. Lo demás, cerca de ${num(SALE.u238)} %, es uranio-238.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Qué trae un ensamble, mes con mes', xMin: 0, xMax: 60, yMin: 0, yMax: 5, ticksX: [0, 18, 36, 54], ticksY: [0, 1, 2, 3, 4, 5], etX: 'Meses dentro del reactor', etY: '% del peso', lineas, fx: x => num(x), fy: y => num(y), refsX: [{ x: 18, texto: 'recarga' }, { x: 36, texto: '' }, { x: 54, texto: '' }], punta: x => `Mes ${num(x)} · U-235: ${num(lineas[0].f(x), 1)} · Pu: ${num(lineas[1].f(x), 1)} · residuos: ${num(lineas[2].f(x), 1)} %` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Mes', 'U-235 %', 'Plutonio %', 'Residuos %', 'GWd/t'], [0, 18, 36, 54, 60].map(a => { const q = composicion(a); return [num(a), num(q.u235, 1), num(q.pu, 1), num(q.residuos, 1), num(q.bu)]; }));
        const Kf = x => Math.log10(kwPorTonelada(10 ** x * T_UNO.anio));
        const X_ANIOS = [[Math.log10(1 / 12), '1 mes'], [0, '1 año'], [Math.log10(5), '5 años'], [1, '10 años']];
        const Y_KW = [[0, '1'], [1, '10'], [2, '100']];
        $('#h-c-t').textContent = 'Calor del combustible usado';
        $('#h-c-ley').textContent = '';
        $('#h-c-pie').textContent = 'Las dos escalas suben de diez en diez. Por eso primero va a la alberca y, cuando ya calienta menos, se puede guardar en seco. A los 40 años su radiactividad es cerca de una milésima de la que traía.';
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Calor del combustible usado', xMin: X_ANIOS[0][0], xMax: 1, yMin: -0.2, yMax: 2.1, ticksX: X_ANIOS.map(e => e[0]), ticksY: Y_KW.map(e => e[0]), etX: 'Tiempo fuera del reactor', etY: 'kW por tonelada', f: Kf, fx: x => etiquetaLog(X_ANIOS, x), fy: y => etiquetaLog(Y_KW, y), punta: x => `${num(10 ** x, 1)} años · ${num(10 ** Kf(x), 1)} kW/t` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Tiempo', 'kW por tonelada'], [[1 / 12, '1 mes'], [1, '1 año'], [5, '5 años'], [10, '10 años']].map(([a, t]) => [t, num(kwPorTonelada(a * T_UNO.anio), 1)]));
    }
    if (m === 'operar' || m === 'presion') {
        const c = pintarTS($('#h-c-grafica'), L);
        $('#h-c-t').textContent = m === 'presion' ? 'El segundo circuito, en un mapa del agua' : 'El ciclo, en un mapa del agua';
        $('#h-c-ley').textContent = '';
        $('#h-c-pie').textContent = m === 'presion'
            ? 'Bajo la campana hay agua y vapor mezclados. El tramo punteado es el primer circuito: se calienta sin llegar a hervir. Pasa el dedo por los puntos.'
            : 'Bajo la campana hay agua y vapor mezclados. A la izquierda es solo líquido; a la derecha, solo vapor. El agua hierve en el reactor sin subir de temperatura: tramo de 2 a 3. Pasa el dedo por los puntos.';
        $('#h-tabla-c').innerHTML = tablaHTML(['Punto', '°C', 'bar', 'kJ/kg'], c.puntos.map(p => [`${p.n}. ${p.nombre}`, num(p.T), num(p.P, p.P < 1 ? 2 : 0), num(p.h)]));
    }
    pintarBarras(L);
}
function pintarBarras(L) {
    let filas;
    if (L.apagar) {
        const t = L.apagar.t;
        const marca = [[1, 'Al apagar'], [T_UNO.h, 'A la hora'], [T_UNO.d, 'Al día'], [T_UNO.sem, 'A la semana']];
        const activa = marca.reduce((b, m, i) => (t >= m[0] ? i : b), 0);
        filas = marca.map(([s, n], i) => ({ t: n, v: calorResidual(s), activa: i === activa, d: 1, escala: 0.08 }));
        $('#h-d-t').textContent = 'Cuánto calor queda, de cada 100';
        $('#h-d-pie').textContent = L.apagar.sinRed ? 'Sin luz de fuera: el vapor mueve una bomba, el agua sale del tanque y la alberca de abajo recibe el vapor. Los generadores diésel dan luz a lo demás.' : 'Con la red disponible, el vapor pasa directo al condensador sin tocar la turbina, y el agua de mar sigue enfriando.';
    } else if (L.ciclo) {
        const q = L.ciclo.comp;
        filas = [{ t: 'Uranio-238', v: q.u238 / 100, activa: true }, { t: 'Uranio-235', v: q.u235 / 100, d: 1 }, { t: 'Plutonio que se parte', v: q.pu / 100, d: 1 }, { t: 'Residuos', v: q.residuos / 100, d: 1 }];
        $('#h-d-t').textContent = `Qué trae el ensamble en el mes ${num(L.ciclo.mes)}`;
        $('#h-d-pie').textContent = 'Casi todo sigue siendo uranio-238, que casi no se parte. La parte de residuos es la que hace peligroso al combustible usado.';
    } else {
        const c = L.operar?.c || L.presion.ciclo;
        const r = c.reparto;
        filas = [{ t: 'Electricidad a la red', v: r.red, activa: true }, { t: 'La usa la propia central', v: r.propia, d: 1 }, { t: 'Se va al mar', v: r.mar }];
        $('#h-d-t').textContent = 'A dónde va cada 100 de calor';
        $('#h-d-pie').textContent = 'Es como en cualquier central de vapor: la mayor parte del calor se va en el condensador. Sin esa parte fría la turbina no podría girar.';
    }
    $('#h-barras').innerHTML = filas.map(f => `<div class="h-barra-f${f.activa ? ' es-activa' : ''}" title="${f.t}: ${num(f.v * 100, f.d ?? 0)} de cada 100"><span>${f.t}</span><i><u style="width:${clamp01(f.v / (f.escala ?? 1)) * 100}%"></u></i><b>${num(f.v * 100, f.d ?? 0)}</b></div>`).join('');
}
function pintarFijas() {
    $('#h-comparar').innerHTML = tablaHTML(['', 'En ebullición', 'A presión'], [
        ['Dónde hierve', 'En la vasija', 'En otro circuito'],
        ['Presión', `${num(BASE.pVapor)} bar`, `${num(PWR_BASE.pPrim)} bar`],
        ['Temperatura', `${num(BASE.tVapor)} °C`, `${num(PWR_BASE.tSale)} °C`],
        ['Barras de control', 'Por abajo, en cruz', 'Por arriba'],
        ['Vapor a la turbina', 'El que cruzó el núcleo', 'De otro circuito, limpio'],
        ['Aprovecha el calor', `${num(BASE.eficiencia * 100)} %`, `${num(PWR_BASE.ciclo.eficiencia * 100)} %`],
        ['En el mundo', '60 reactores, 61 GW', '316 reactores, 306 GW'],
    ]);
    $('#h-mexico').innerHTML = `<thead><tr><th scope="col">Reactor</th><th scope="col">Opera desde</th><th scope="col">MW netos</th><th scope="col">Licencia hasta</th></tr></thead><tbody>${MEXICO.map(c => `<tr><td><b>${c.campo}</b><small>BWR-5, Mark II</small></td><td>${c.desde}</td><td>${num(c.neta)}</td><td>${c.hasta}</td></tr>`).join('')}</tbody>`;
}
const ACLARA = {
    operar: 'Un neutrón parte un átomo, salen más neutrones y uno sigue la cadena. Los demás se los quedan el agua, el uranio-238 o las barras de control.',
    apagar: 'Lo que se ve es lo que hay que resolver: el calor sigue saliendo y tiene que irse a algún lado, con luz de fuera o sin ella.',
    presion: 'El agua que cruza el núcleo le pasa su calor a otra por la pared de unos tubos. Así el agua del reactor nunca llega a la turbina.',
    ciclo: 'De la mina a la losa de contenedores. Lo que hace México en Laguna Verde es la parte del reactor, la alberca y el almacén en seco.',
};
function pintarTablero() {
    const P = MODOS[pide.modo];
    app.dataset.modo = pide.modo;
    ponerCifra('resumen', P.resumen);
    ponerCifra('aPie', ACLARA[pide.modo]);
    ponerCifra('mando', P.mando);
    ponerCifra('mando2', P.mando2 ?? '');
    mandos.forEach(d => d.setAttribute('aria-label', P.mando));
    mandos2.forEach(d => d.setAttribute('aria-label', P.mando2 ?? ''));
    cajas2.forEach(c => { c.hidden = !P.mando2; });
    firmaTablero = '';
    ponerMando();
    ultimoTablero = 0; // las cifras del modo nuevo salen en el siguiente cuadro
}
function ponerMando() {
    const m = pide.modo;
    const v1 = m === 'operar' ? aRango(LIMITES.barras, pide.barras) : m === 'apagar' ? (pide.horaLog / LOG_MAX) * 100 : m === 'presion' ? aRango(LIMITES.pPrim, pide.pPrim) : aRango(LIMITES.mes, pide.mes);
    const v2 = m === 'operar' ? aRango(LIMITES.flujo, pide.flujo) : aRango(LIMITES.tSale, pide.tSale);
    mandos.forEach(d => { if (document.activeElement !== d || m === 'apagar' || m === 'ciclo') d.value = String(v1); });
    mandos2.forEach(d => { if (document.activeElement !== d) d.value = String(v2); });
}
const CIFRAS = {};
function ponerCifra(k, t) { (CIFRAS[k] ??= [...app.querySelectorAll(`[data-c="${k}"]`)]).forEach(n => { if (n.textContent !== t) n.textContent = t; }); }
function ponerLecturas(lista, aviso) {
    const cif = $('#h-cifras');
    if (cif.children.length !== lista.length) cif.innerHTML = lista.map(() => '<div><span></span><b></b><small></small></div>').join('');
    [...cif.children].forEach((d, i) => {
        d.querySelector('span').textContent = lista[i][0];
        d.querySelector('b').textContent = lista[i][1];
        d.querySelector('small').textContent = lista[i][2];
    });
    const a = $('[data-aviso]');
    a.hidden = !aviso;
    if (aviso) a.textContent = aviso;
}
function nivel(k, titulo, frac, valor) {
    ponerCifra(`nivel${k}T`, titulo);
    $(`#h-nivel-${k}`).style.width = `${clamp01(frac) * 100}%`;
    ponerCifra(`nivel${k}`, valor);
}
function actualizarTablero(L) {
    const firma = JSON.stringify([pide.modo, pide.flujo, pide.pPrim, pide.tSale, pide.sinRed]);
    if (firma !== firmaTablero) { firmaTablero = firma; pintarGraficas(); }
    if (L.operar) {
        const O = L.operar;
        const c = O.c;
        ponerCifra('mandoValor', `${num(pide.barras)} %`);
        ponerCifra('mando2Valor', `${num(pide.flujo)} %`);
        const aviso = O.P > 1.003 ? 'Arriba de 100 %: la central no opera más allá de su potencia autorizada.' : O.P < 0.01 ? 'La reacción en cadena se apagó: se pierden más neutrones de los que salen. Todavía queda calor en el combustible.' : null;
        ponerLecturas([['A la red', num(c.neta), 'MW'], ['Calor', num(c.Q), 'MW'], ['Vapor', num(c.mv * 3.6), 't/h'], ['Se vuelve vapor', num(O.calidad * 100), '% en cada pasada'], ['Uranio-235', num(O.u235, 1), 'kg al día'], ['Aprovecha', num(c.eficiencia * 100, 1), '% del calor']], aviso);
        ponerCifra('hud', `${num(c.neta)} MW`);
        ponerCifra('hud2', 'a la red, de día y de noche');
        graficas.b?.marcar(O.barras * 100, Math.min(120, O.P * 100));
        nivel(1, 'Potencia', O.P, `${num(O.P * 100)} %`);
        nivel(2, 'Vapor', O.vacio, `${num(O.vacio * 100)} % del núcleo`);
    } else if (L.apagar) {
        const A = L.apagar;
        ponerCifra('mandoValor', numTiempo(A.t));
        ponerLecturas([['A la red', '0', 'MW'], ['Calor', num(A.Q, A.Q < 20 ? 1 : 0), 'MW'], ['De lo que daba', num(A.pct * 100, 1), '%'], ['Agua', num(A.agua), 't/h que hervir'], ['Tiempo', numTiempo(A.t), 'desde el apagado'], ['Barras', num(UNIDAD.barras), 'adentro']], A.sinRed ? 'Sin luz de fuera: arrancan los generadores diésel, y una bomba movida por el vapor sigue metiendo agua a la vasija.' : null);
        ponerCifra('hud', `${num(A.Q, A.Q < 20 ? 1 : 0)} MW de calor`);
        ponerCifra('hud2', A.sinRed ? 'sin red: con diésel y vapor' : 'sin generar, y hay que seguir enfriando');
        pintarBarras(L);
        graficas.b?.ahora(Math.log10(A.t));
        graficas.b?.marcar(Math.log10(A.t), A.Q);
        graficas.c?.ahora(Math.log10(A.t));
        graficas.c?.marcar(Math.log10(A.t), A.agua);
        nivel(1, 'Calor', A.pct / 0.065, `${num(A.pct * 100, 1)} %`);
        nivel(2, 'Barras', 1, '100 %');
    } else if (L.presion) {
        const p = L.presion;
        const c = p.ciclo;
        ponerCifra('mandoValor', `${num(p.pPrim)} bar`);
        ponerCifra('mando2Valor', `${num(p.tSale)} °C`);
        const aviso = p.hierve ? 'A esta presión el agua del primer circuito herviría. Para eso está el presurizador: mantiene la presión arriba.' : p.margen < 10 ? 'Queda poco margen antes de que hierva el primer circuito.' : null;
        ponerLecturas([['A la red', num(L.neta), 'MW'], ['Primer circuito', num(p.mPrim * 3.6), 't/h'], ['Hierve a', num(p.tHierve), '°C'], ['Margen', num(p.margen), '°C antes de hervir'], ['Vapor', num(c.mv * 3.6), 't/h'], ['Aprovecha', num(c.eficiencia * 100, 1), '% del calor']], aviso);
        ponerCifra('hud', `${num(L.neta)} MW`);
        ponerCifra('hud2', 'con agua a presión, para comparar');
        graficas.b?.marcar(p.tSale, p.pPrim);
        nivel(1, 'Margen', p.margen / 40, `${num(p.margen)} °C`);
        nivel(2, 'Vapor', c.mv / 1400, `${num(c.mv * 3.6)} t/h`);
    } else {
        const C = L.ciclo;
        ponerCifra('mandoValor', `Mes ${num(C.mes)}`);
        ponerLecturas([['A la red', num(L.neta), 'MW'], ['Ciclo', num(C.ciclo), `de 18 meses`], ['Quemado', num(C.comp.bu), 'GWd por tonelada'], ['Uranio-235', num(C.comp.u235, 1), '% del ensamble'], ['Plutonio', num(C.comp.pu, 1), '% que se parte'], ['Uranio nuevo', num(C.usoAnual), 't al año']], C.recarga ? `Recarga: el reactor está parado. Se cambian ${num(UNIDAD.recambio)} de los ${num(UNIDAD.ensambles)} ensambles y los usados van a la alberca.` : null);
        ponerCifra('hud', C.recarga ? 'En recarga' : `${num(L.neta)} MW`);
        ponerCifra('hud2', C.recarga ? 'reactor parado, se cambia combustible' : `mes ${num(C.mes)} de la vida del ensamble`);
        pintarBarras(L);
        graficas.b?.ahora(C.mes);
        nivel(1, 'Quemado', C.comp.bu / QUEMADO_FINAL, `${num((C.comp.bu / QUEMADO_FINAL) * 100)} %`);
        nivel(2, 'Barras', C.barras / 0.4, `${num(C.barras * 100)} % adentro`);
    }
}

// ------------------------------------------------------------------ medidas y mensajes con Aprende
let alturaAvisada = 0;
function avisarAltura() {
    if (completa) return;
    // la altura de lo que hay, no la del documento: el tablero cambia de alto y el marco debe encogerse
    const h = Math.ceil(app.getBoundingClientRect().height);
    if (Math.abs(h - alturaAvisada) < 2) return;
    alturaAvisada = h;
    avisar({ type: 'concepto-height', id: FIGURA, h });
}
let bajoCalidad = false;
let firmaTablero = '';
function ajustar() {
    W = Math.max(1, escena.clientWidth);
    H = Math.max(1, escena.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, bajoCalidad ? 1 : MOVIL ? 1.5 : 2));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    senal.setAttribute('viewBox', `0 0 ${W} ${H}`);
    acomodar();
    medirLibre(1);
    avisarAltura();
    firmaTablero = '';
}
const vigia = new ResizeObserver(ajustar);
vigia.observe(document.body);
vigia.observe(escena);

// ------------------------------------------------------------------ cada cuadro
const v = new THREE.Vector3();
const miraV = new THREE.Vector3();
const centro = new THREE.Vector3();
let anterior = performance.now();
let listo = false;
let cuentaCuadros = 0;
let tiempoCuadros = 0;
function cuadro(ahora) {
    requestAnimationFrame(cuadro);
    const dtReal = clamp((ahora - anterior) / 1000, 0, 1);
    const dt = Math.min(0.05, dtReal);
    anterior = ahora;
    if (!visible) return;
    const seVe = enPantalla || !listo;
    if (seVe) entrada += dt;
    const t = REDUCIR ? 0 : (ahora - t0) / 1000;
    const seguir = (actual, meta, rapidez) => actual + (meta - actual) * (1 - Math.exp(-rapidez * dt));

    if (!bajoCalidad && seVe && entrada > 2 && entrada < 14) {
        cuentaCuadros++;
        tiempoCuadros += dtReal;
        if (cuentaCuadros === 90) {
            if (tiempoCuadros / 90 > 1 / 24) { bajoCalidad = true; ajustar(); }
            cuentaCuadros = 0;
            tiempoCuadros = 0;
        }
    }

    medirLibre(1 - Math.exp(-5 * dt));
    if (pide.modo === 'apagar' && pide.corre && (enPantalla || tableroEnPantalla)) {
        pide.horaLog = Math.min(LOG_MAX, pide.horaLog + LOG_POR_SEGUNDO * dt);
        if (pide.horaLog >= LOG_MAX) { pide.corre = false; rotular(); }
        ponerMando();
    }
    if (pide.modo === 'ciclo' && pide.corre && (enPantalla || tableroEnPantalla)) {
        const lento = enElCiclo(pide.mes).recarga ? 0.12 : 1;
        pide.mes = Math.min(LIMITES.mes[1], pide.mes + MESES_POR_SEGUNDO * lento * dt);
        if (pide.mes >= LIMITES.mes[1]) { pide.corre = false; rotular(); }
        ponerMando();
    }
    reactor = pasoReactor(reactor, { barras: pide.barras / 100, flujo: pide.flujo / 100, apagado: pide.modo === 'apagar' }, dt * ACELERA);
    ve.pwr += clamp((pide.modo === 'presion' ? 1 : 0) - ve.pwr, -dt / 1.1, dt / 1.1);
    const encendido = REDUCIR ? 1 : clamp01((entrada - 0.15) / 2);
    ve.adentro = seguir(ve.adentro, pide.adentro ? 1 : 0, 2.6);
    PARTES.forEach((p, i) => { ve.partes[p] = seguir(ve.partes[p], i === elegida && FICHAS[i].abrir ? 1 : 0, 2.6); });
    ve.desarme += clamp(pide.desarme - ve.desarme, -dt / 1.5, dt / 1.5);
    ve.noche = seguir(ve.noche, pide.noche ? 1 : 0, 2.2);
    cielo.style.opacity = ve.noche.toFixed(3);

    // cámara
    if (!camara.auto && elegida < 0 && !camara.mantener && performance.now() - ultimaMano > 12000) camara.auto = true;
    if (!punteros.size) {
        camara.az += camara.vaz * dt;
        camara.el = clamp(camara.el + camara.vel * dt, 3, 80);
        camara.vaz *= Math.exp(-6 * dt);
        camara.vel *= Math.exp(-6 * dt);
    }
    if (camara.mantener) { camara.az += camara.mantener * 70 * dt; ultimaMano = performance.now(); }
    if (camara.giro) {
        const paso = camara.giro * (1 - Math.exp(-5 * dt));
        camara.az += paso;
        camara.giro = Math.abs(camara.giro - paso) < 0.05 ? 0 : camara.giro - paso;
    }
    if (camara.kMeta !== undefined) camara.k = seguir(camara.k, camara.kMeta, 7);
    if (camara.auto && !REDUCIR) {
        camara.az = seguir(camara.az, acomodo.azBase, 1.2);
        camara.el = seguir(camara.el, acomodo.elBase, 1.2);
        camara.k = seguir(camara.k, 1, 1.2);
        camara.kMeta = undefined;
    }
    let az = camara.az + (camara.auto && !REDUCIR ? Math.sin(t * 0.25) * 5 : 0);
    let el = camara.el + (camara.auto && !REDUCIR ? Math.sin(t * 0.19) * 1.2 : 0);
    let d = distanciaGeneral(az, el) * camara.k * (1 + 0.45 * (1 - sale(entrada / 2.4))) * (1 + 0.26 * sale(ve.desarme));
    miraV.set(0, 1.55 - 0.3 * sale(ve.desarme), -0.05);

    const enfoca = elegida >= 0 && elegida < FINAL;
    apuntarZoom();
    zoom.f = seguir(zoom.f, enfoca ? 1 : 0, 2.4);
    if (zoom.f > 0.001) {
        let c = zoom.centro;
        let tam = zoom.tam;
        let azV = zoom.az;
        let elV = zoom.el;
        if (vuelo.t < 1) {
            vuelo.t = Math.min(1, vuelo.t + dt / VUELO_S);
            const k = suave(vuelo.t);
            c = cVuelo.copy(vuelo.c0).lerp(zoom.centro, k);
            tam = (vuelo.tam0 + (zoom.tam - vuelo.tam0) * k) * (1 + 0.5 * Math.sin(Math.PI * vuelo.t));
            azV = vuelo.az0 + (((zoom.az - vuelo.az0 + 540) % 360) - 180) * k;
            elV = vuelo.el0 + (zoom.el - vuelo.el0) * k;
        }
        const azParte = azV + (camara.az - zoom.az0);
        const elParte = clamp(elV + (camara.el - zoom.el0), 3, 80);
        const tv = Math.tan((camera.fov * D2R) / 2);
        const dParte = Math.max((tam * H) / (2 * tv * libre.fh), (tam * H) / (2 * tv * libre.fw)) * (camara.k / zoom.k0) * (1 + 0.5 * sale(ve.desarme));
        miraV.lerp(c, zoom.f);
        const dif = ((azParte - az + 540) % 360) - 180;
        az += dif * zoom.f;
        el += (elParte - el) * zoom.f;
        d += (dParte - d) * zoom.f;
    }

    if (!auto.hecho && !auto.on && seVe && entrada > ENTRADA_S + 0.6) {
        auto.on = true;
        auto.t = 0;
        app.classList.add('is-auto');
        elegir(0, { solo: true });
    }
    if (auto.on && enPantalla) {
        auto.t += dt;
        if (auto.t >= pasoS(elegida)) {
            auto.t = 0;
            if (elegida + 1 >= FINAL) {
                pide.noche = false;
                pide.adentro = false;
                cambiarModo('operar');
                elegir(FINAL, { solo: true });
                pararRecorrido();
            } else elegir(elegida + 1, { solo: true });
        }
    }

    const e = pose({
        modo: pide.modo, reactor, tApagado: 10 ** pide.horaLog, sinRed: pide.sinRed, pPrim: pide.pPrim, tSale: pide.tSale, mes: pide.mes, noche: ve.noche, adentro: ve.adentro, desarme: ve.desarme, encendido, pwr: ve.pwr, t, dt,
        camara: { mira: miraV.toArray(), az, el, d },
    });
    // las barras se mueven con calma aunque se cambie de modo
    ve.barras = seguir(ve.barras, e.barras, 3);
    e.barras = ve.barras;
    planta.giran.forEach((g, i) => { fases[i] += dt * g.vel(e); });
    e.fases = fases;
    e.abierta = ve.partes;
    est.actualizar(e);
    if (seVe) {
        planta.posar(e);
        camera.position.set(...posicionCamara(e.camara));
        camera.lookAt(...e.camara.mira);
        camera.updateMatrixWorld();
        scene.updateMatrixWorld();
        // la imagen se corre hacia el hueco que dejan la ficha y los mandos
        camera.setViewOffset(W, H, W / 2 - libre.cx, H / 2 - libre.cy, W, H);
        renderer.render(scene, camera);
        marcar();
    }
    if (ahora - ultimoTablero > 120) { ultimoTablero = ahora; actualizarTablero(e.lectura); }
    if (tableroEnPantalla) diagrama.dibujar(pide.modo, t, e.lectura, colores || leerColores());
    if (!listo) { listo = true; avisar({ type: 'concepto-listo', id: FIGURA }); }
    app.classList.toggle('is-menu', entrada > ENTRADA_S * 0.4);
    app.classList.toggle('is-cerca', zoom.f > 0.3);
}

function pantalla(p) {
    v.copy(p).project(camera);
    return [(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H];
}
// a dónde vuela la cámara; corre aunque la escena esté fuera de la vista, para que no brinque al regresar
function apuntarZoom() {
    if (elegida < 0 || elegida >= FINAL) return;
    const f = FICHAS[elegida];
    const V = VISTAS[f.parte];
    // la cámara mira al punto clave, o a donde su vista diga si debe entrar algo más en la toma
    if (V.mira) centro.set(...V.mira); else planta.anclas[f.parte].getWorldPosition(centro);
    if (elegida !== zoom.parte) {
        if (zoom.parte >= 0 && zoom.f > 0.2) {
            vuelo.c0.copy(vuelo.t < 1 ? cVuelo : zoom.centro);
            vuelo.tam0 = zoom.tam;
            vuelo.az0 = zoom.az;
            vuelo.el0 = zoom.el;
            vuelo.t = 0;
        }
        zoom.parte = elegida;
        zoom.az0 = camara.az;
        zoom.el0 = camara.el;
        zoom.k0 = camara.k;
        zoom.az = V.az;
        zoom.el = V.el;
        zoom.tam = V.tam;
    }
    zoom.centro.copy(centro);
}
function marcar() {
    // pines: siguen su punto en pantalla; de cerca solo queda el elegido
    pines.forEach((b, i) => {
        planta.anclas[FICHAS[i].parte].getWorldPosition(centro);
        const [x, y] = pantalla(centro);
        const seMuestra = i === elegida || zoom.f < 0.5;
        const dentro = x > 0 && x < W && y > 0 && y < H;
        b.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
        b.style.visibility = seMuestra && dentro ? 'visible' : 'hidden';
    });
    const linea = senal.querySelector('line');
    const punto = senal.querySelector('circle');
    if (elegida < 0 || elegida >= FINAL || ficha.hidden) { senal.style.opacity = '0'; return; }
    planta.anclas[FICHAS[elegida].parte].getWorldPosition(centro);
    const [px, py] = pantalla(centro);
    const re = escena.getBoundingClientRect();
    const rf = ficha.getBoundingClientRect();
    const r = { left: rf.left - re.left, right: rf.right - re.left, top: rf.top - re.top, bottom: rf.bottom - re.top };
    const fy = py < r.top ? r.top : py > r.bottom ? r.bottom : r.top + 16;
    const ex = px < r.left ? r.left : px > r.right ? r.right : clamp(px, r.left + 16, r.right - 16);
    linea.setAttribute('x1', px.toFixed(1)); linea.setAttribute('y1', py.toFixed(1));
    linea.setAttribute('x2', ex.toFixed(1)); linea.setAttribute('y2', fy.toFixed(1));
    punto.setAttribute('cx', px.toFixed(1)); punto.setAttribute('cy', py.toFixed(1));
    senal.style.opacity = px > r.left && px < r.right && py > r.top && py < r.bottom ? '0' : '1';
}

ajustar();
pintarFijas();
pintarTablero();
rotular();
document.fonts?.ready.then(() => { planta.repintar(); ajustar(); });
addEventListener('load', avisarAltura);
// para las pruebas
window.__PLANTA = () => ({ modo: pide.modo, adentro: +ve.adentro.toFixed(2), desarme: +ve.desarme.toFixed(2), noche: +ve.noche.toFixed(2), P: +reactor.P.toFixed(3), barras: +ve.barras.toFixed(3), mes: +pide.mes.toFixed(1), horaLog: +pide.horaLog.toFixed(2), sinRed: pide.sinRed, elegida, parte: PARTES[elegida] ?? null, recorrido: auto.on, az: +camara.az.toFixed(1), k: +camara.k.toFixed(2) });
window.__PUNTO = parte => { planta.anclas[parte].getWorldPosition(centro); const r = escena.getBoundingClientRect(); return pantalla(centro).map((c, i) => Math.round(c + (i ? r.top : r.left))); };
window.__MOVER = (o = {}) => { Object.assign(pide, o); if (o.camara) Object.assign(camara, o.camara, { auto: false }); firmaTablero = ''; ultimoTablero = 0; rotular(); if (o.modo) pintarTablero(); };
requestAnimationFrame(cuadro);
