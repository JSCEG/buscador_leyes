// «Planta de hidrógeno», en 3D y con el formato Búho de «¿Cómo funciona?». Cuatro formas de verla: hidrógeno verde (agua y
// electricidad renovable), pirólisis de metano (hidrógeno turquesa, otra ruta), electricidad (el hidrógeno guardado regresa
// a la red) y un día completo, donde sol y viento alimentan a la red, cargan las baterías y hacen hidrógeno; en la tarde
// entregan las baterías y de madrugada el hidrógeno. Las baterías y el hidrógeno son el SAE, el Sistema de Almacenamiento de
// Energía. Puntos clave con su ficha, ver por dentro, desarmar, día y noche, y gráficas que leen las mismas cifras que mueven
// la planta (modelo.js). Se arma con: node scripts/build-conceptos-3d.mjs hidrogeno
//
// No usa crearMaquina: la cámara vuela entre las partes y cada parte lleva ficha, tablero y gráficas propias. Sí respeta su
// contrato con Aprende (concepto-height, concepto-part, concepto-select-part, concepto-listo, concepto-fullscreen) y su estilo
// común (clases g-*). El tema del sitio (data-tema) es independiente de la noche de la planta: la noche solo cambia la escena.
import * as THREE from 'three';
import { brandMarkSvg } from '../../src/lib/brand-mark.js';
import { BATERIA, FLUIDOS, PARTES as PARTES_M, PASO_HORAS, PLANTA, calcular, conversionEquilibrio, diaCompleto, energiaUtil, idaYVuelta, nocheEnHora, pose, posicionCamara, voltajeElectrolisis, voltajePila, V_REVERSIBLE, V_TERMONEUTRO, AGUA_POR_KG, O2_POR_KG, C_POR_KG } from './modelo.js';
import { P_PLANTA, materiales, estudio, construir } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';

const FIGURA = 'hidrogeno';
const D2R = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const clamp01 = x => clamp(x, 0, 1);
const sale = x => 1 - (1 - clamp01(x)) ** 3;
const suave = x => { const k = clamp01(x); return k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2; };
const num = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const horaTexto = h => { const m = Math.floor((((h % 24) + 24) % 24) * 60); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

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
const HORAS_POR_SEGUNDO = 0.04; // en los procesos sueltos: cada segundo, unos dos minutos y medio de planta
const DIA_HORAS_POR_SEGUNDO = 0.5; // en «Un día»: 24 horas en 48 segundos
const MOVIL = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 600;
const avisar = datos => { try { if (parent !== window) parent.postMessage(datos, location.origin); } catch { /* sin padre del mismo origen */ } };

const UTIL = energiaUtil();
const IDA = idaYVuelta();
const REGRESA_H2 = num(IDA.fraccion * 100);
const REGRESA_BAT = num(BATERIA.eficiencia * 100);

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'renovable', nombre: 'Sol y viento', proceso: 'verde', accion: 'noche', recorrido: { noche: false, adentro: false },
        icono: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3 7 7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7"/>',
        texto: `${PLANTA.solarMW} MW de paneles y ${PLANTA.vientoMW} MW de viento. Esta electricidad es la que hace verde al hidrógeno: si viniera de gas o carbón, ya no lo sería. De noche solo queda el viento y la planta baja su producción.` },
    { parte: 'agua', nombre: 'Agua pura', proceso: 'verde', abrir: true, accion: 'desarme',
        icono: '<path d="M12 3s6.5 7 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10 12 3 12 3Z"/>',
        texto: `El electrolizador necesita agua muy limpia. Pasa por ósmosis inversa y resinas que le quitan las sales. Cada kilo de hidrógeno consume ${num(AGUA_POR_KG, 1)} litros, más lo que se desecha al purificarla.` },
    { parte: 'electrolizador', nombre: 'Electrolizador', proceso: 'verde', abrir: true, accion: 'desarme', eq: '2 H₂O + electricidad → 2 H₂ + O₂',
        icono: '<path d="M4 7h16M4 12h16M4 17h16"/><path d="M8 4v16M16 4v16"/>',
        texto: 'Aquí nace el hidrógeno verde. La electricidad parte el agua en una membrana: el hidrógeno sale por un lado y el oxígeno por el otro, dos de hidrógeno por cada uno de oxígeno. Gasta unos 55 kWh por kilo.' },
    { parte: 'separadores', nombre: 'Separadores', proceso: 'verde', abrir: true, accion: 'desarme',
        icono: '<rect x="5" y="4" width="6" height="16" rx="3"/><rect x="13" y="7" width="6" height="13" rx="3"/><path d="M5 13h6M13 14h6"/>',
        texto: `El gas sale mezclado con agua. En estos recipientes el agua cae y regresa al electrolizador, y el hidrógeno sigue su camino. Por cada kilo de hidrógeno salen ${num(O2_POR_KG, 1)} kilos de oxígeno, que se venden o se liberan al aire por el tubo azul.` },
    { parte: 'refinacion', nombre: 'Refinación', proceso: 'verde', abrir: true, accion: 'desarme', eq: `Pureza: ${PLANTA.pureza} %`,
        icono: '<rect x="4" y="3" width="7" height="18" rx="3.5"/><rect x="13" y="3" width="7" height="18" rx="3.5"/><path d="M4 11h7M13 15h7"/>',
        texto: 'Aquí se refina el gas. Un catalizador convierte los restos de oxígeno en agua, y dos torres rellenas de material absorbente atrapan lo demás. Se turnan: mientras una limpia, la otra se regenera.' },
    { parte: 'compresor', nombre: 'Compresor', proceso: 'verde', abrir: true, accion: 'desarme',
        icono: '<circle cx="8" cy="12" r="4.5"/><path d="M12.5 12H21M17 8v8"/>',
        texto: `El hidrógeno pesa tan poco que hay que apretarlo para guardarlo: de 30 a ${PLANTA.presionBar} bar. Un pistón lo hace, y gasta cerca de 3 kWh por kilo.` },
    { parte: 'tanques', nombre: 'Tanques', proceso: 'verde', abrir: true, accion: 'desarme',
        icono: '<rect x="3" y="7" width="18" height="10" rx="5"/><path d="M8 7v10M16 7v10"/>',
        texto: `Guardan el hidrógeno para cuando no hay sol: ${num(PLANTA.tanqueKg)} kilos a ${PLANTA.presionBar} bar. A esa presión, un kilo ocupa unos 42 litros y guarda casi tanta energía como 4 litros de gasolina. La tira de luces marca el nivel.` },
    { parte: 'baterias', nombre: 'SAE de baterías', proceso: 'dia', hora: 18, abrir: true, accion: 'desarme', eq: `${BATERIA.mw} MW · ${BATERIA.mwh} MWh · regresan unos ${REGRESA_BAT} de cada 100 kWh`, recorrido: { adentro: false },
        icono: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21.5 10.5v3M7 10v4M11 10v4M15 10v4"/>',
        texto: 'SAE quiere decir Sistema de Almacenamiento de Energía. Estas baterías no guardan hidrógeno: guardan electricidad. De día se cargan con lo que sobra del sol y, al caer la tarde, la entregan a la red en un instante. Rinden mucho, pero solo alcanzan para unas horas.' },
    { parte: 'pila', nombre: 'SAE de hidrógeno', proceso: 'pila', abrir: true, accion: 'noche', eq: '2 H₂ + O₂ → 2 H₂O + electricidad + calor', recorrido: { noche: true },
        icono: '<rect x="3" y="7" width="15" height="10" rx="2"/><path d="M21 10v4M11 9.5 8.5 12.5H12L9.5 15"/>',
        texto: 'Cuando se agotan las baterías entra el hidrógeno de los tanques. Una celda de combustible hace lo contrario del electrolizador: el hidrógeno suelta electrones, que salen por un cable, y luego se une con el oxígeno del aire. Solo sale agua y calor. El agua no es el combustible: es lo que queda cuando el hidrógeno ya entregó su energía.' },
    { parte: 'red', nombre: 'RNT y RGD', proceso: 'pila', accion: 'noche', recorrido: { noche: true, adentro: false },
        icono: '<path d="M12 3 6 21M12 3l6 18M8 9h8M7 14h10"/>',
        texto: `Un inversor y un transformador suben el voltaje y la electricidad sale por la RNT, la Red Nacional de Transmisión. Las RGD, las Redes Generales de Distribución, la llevan hasta las casas. De cada 100 kWh guardados regresan unos ${REGRESA_BAT} en baterías y unos ${REGRESA_H2} con hidrógeno.` },
    { parte: 'pirolisis', nombre: 'Pirólisis', proceso: 'turquesa', abrir: true, accion: 'desarme', eq: 'CH₄ + calor → C + 2 H₂', recorrido: { noche: false },
        icono: '<path d="M7 21h10M9 21V8a3 3 0 0 1 6 0v13"/><path d="M12 14v3M10.5 11h3"/>',
        texto: `Otra ruta, que da hidrógeno turquesa, no verde. El metano llega del tanque esférico de franja morada, burbujea en metal fundido a unos 1,000 °C y se parte en hidrógeno y carbono sólido: ${num(C_POR_KG)} kilos de carbono por cada kilo de hidrógeno. El reactor no suelta CO₂, pero usa gas natural, que puede fugarse al extraerlo.` },
];
const PARTES = FICHAS.map(f => f.parte);
const FINAL = FICHAS.length;
const VISTAS = Object.fromEntries(PARTES_M.map(p => [p.id, p.vista]));
// cada paso del recorrido dura lo que tarda en leerse su ficha
const pasoS = i => clamp((FICHAS[i]?.texto.split(' ').length ?? 30) * 0.17, 5, 10);
const ICONO_TOCAR = '<path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10"/><path d="M12 9.5a1.5 1.5 0 0 1 3 0V11"/><path d="M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.6-2.2L4.4 15.6a1.5 1.5 0 0 1 2.3-1.9L9 16"/>';
const ICONOS = {
    izq: '<path d="M4 12a8 8 0 1 1 2.5 5.8"/><path d="M4 18v-5h5"/>',
    der: '<path d="M20 12a8 8 0 1 0-2.5 5.8"/><path d="M20 18v-5h-5"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    menos: '<path d="M5 12h14"/>',
    luna: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>',
    sol: FICHAS[0].icono,
    pausa: '<path d="M8 5v14M16 5v14"/>',
    seguir: '<path d="M7 4.5v15l12-7.5Z"/>',
    abrir: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    cerrar: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
};
const svgIcono = d => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;

const PROCESOS = {
    verde: { nombre: 'Hidrógeno verde', corto: 'Verde', resumen: 'Agua + electricidad renovable → hidrógeno + oxígeno', eq: '2 H₂O + electricidad → 2 H₂ + O₂', mando: 'Corriente al electrolizador' },
    turquesa: { nombre: 'Pirólisis', corto: 'Pirólisis', resumen: 'Metano + calor → hidrógeno + carbono sólido. Da hidrógeno turquesa, no verde.', eq: 'CH₄ + calor → C + 2 H₂', mando: 'Temperatura del reactor' },
    pila: { nombre: 'Electricidad', corto: 'Electricidad', resumen: 'Hidrógeno + oxígeno del aire → electricidad + agua. El agua es lo que sale, no el combustible.', eq: '2 H₂ + O₂ → 2 H₂O + electricidad + calor', mando: 'Demanda al SAE de hidrógeno' },
    dia: { nombre: 'Un día', corto: 'Un día', resumen: 'De día, sol y viento alimentan a la red, cargan las baterías y hacen hidrógeno. En la tarde entregan las baterías; de madrugada, el hidrógeno.', eq: '', mando: 'Hora del día' },
};

// ------------------------------------------------------------------ la página
const controles = () => `
    <div class="g-seg h-procesos" role="radiogroup" aria-label="Qué ver en la planta">
        ${Object.entries(PROCESOS).map(([id, p]) => `<button type="button" role="radio" data-proceso="${id}" aria-checked="false"><span class="h-largo">${p.nombre}</span><span class="h-corto">${p.corto}</span></button>`).join('')}
    </div>
    <label class="g-deslizador h-mando"><span class="h-rotulo"><span data-c="mando"></span><b data-c="mandoValor"></b></span><input type="range" data-control min="0" max="100" step="0.25" value="85"></label>
    <label class="g-deslizador h-mando"><span class="h-rotulo"><span>Desarmar</span></span><input type="range" data-desarme min="0" max="1" step="0.01" value="0" aria-label="Desarmar la planta"></label>
    <button type="button" class="g-chip h-reloj" data-reloj hidden></button>`;
const botonesDePartes = () => FICHAS.map((f, i) => `<button type="button" data-parte="${i}" aria-pressed="false"><span>${i + 1}</span>${f.nombre}</button>`).join('');
const app = document.getElementById('app');
app.innerHTML = `
    <div class="g-escena">
        <div class="h-cielo" aria-hidden="true"></div>
        <canvas class="g-lienzo" aria-label="Planta de hidrógeno en 3D: arrastra para girarla, toca un punto para conocerlo"></canvas>
        <div class="h-pines" aria-label="Puntos clave de la planta">${FICHAS.map((f, i) => `<button type="button" class="h-pin" data-pin="${i}" aria-label="${i + 1}. ${f.nombre}" title="${f.nombre}"><b>${i + 1}</b><span>${f.nombre}</span></button>`).join('')}</div>
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
            <nav class="g-flot-partes" aria-label="Puntos clave de la planta">${botonesDePartes()}</nav>
            <div class="g-flot-ctrl">${controles()}</div>
        </div>
    </div>
    <div class="g-tablero">
        <section class="g-control" aria-label="Controles">
            ${controles()}
            <p class="h-resumen" data-c="resumen"></p>
            <p class="h-eq" data-eq></p>
            <p class="h-aviso" data-aviso hidden></p>
        </section>
        <section class="h-lecturas" aria-label="Lo que mide la planta">
            <div class="g-cifras" id="h-cifras"></div>
            <div class="h-nivel"><span>Tanques</span><i><u id="h-nivel-tanques"></u></i><b data-c="nivelTanques"></b></div>
            <div class="h-nivel h-nivel-bat"><span>Baterías</span><i><u id="h-nivel-baterias"></u></i><b data-c="nivelBaterias"></b></div>
        </section>
        <section class="g-curva h-media" id="h-slot-a">
            <div class="g-curva-cab"><b id="h-a-t">Qué pasa adentro</b><span class="h-leyenda" id="h-a-ley"></span></div>
            <canvas class="h-diagrama" id="h-diagrama" aria-hidden="true"></canvas>
            <div class="h-grafica" id="h-a-grafica" hidden></div>
            <p id="h-a-pie" hidden></p>
        </section>
        <section class="g-curva h-media" id="h-slot-b">
            <div class="g-curva-cab"><b id="h-b-t"></b><span class="h-leyenda" id="h-b-ley"></span></div>
            <div class="h-grafica" id="h-b-grafica"></div>
            <p id="h-b-pie"></p>
            <details class="h-tabla"><summary>Ver estos datos como tabla</summary><table id="h-tabla"></table></details>
        </section>
        <section class="g-curva h-media" id="h-slot-c">
            <div class="g-curva-cab"><b id="h-c-t"></b><span class="h-leyenda" id="h-c-ley"></span></div>
            <div class="h-barras" id="h-barras"></div>
            <div class="h-grafica" id="h-c-grafica" hidden></div>
            <p id="h-c-pie"></p>
        </section>
        <section class="g-curva h-media">
            <div class="g-curva-cab"><b>Colores de los tubos</b></div>
            <ul class="h-tubos">${Object.values(FLUIDOS).map(f => `<li><i style="background:${f.color}"></i>${f.nombre}</li>`).join('')}</ul>
            <p>Planta de ejemplo con cifras típicas de estos equipos, no de una planta real.</p>
        </section>
        <section class="g-curva h-fuentes" aria-labelledby="h-fuentes-t">
            <div class="g-curva-cab"><b id="h-fuentes-t">Fuentes</b></div>
            <ul>
                ${FUENTES.map(f => `<li><span class="h-fuente-para">${f.para}</span><a href="${f.url}" target="_blank" rel="noopener">${f.titulo}</a><small>${f.autor}, ${f.fecha}${f.editorial ? `. ${f.editorial}` : ''}</small></li>`).join('')}
                <li><span class="h-fuente-para">Hidrógeno como energía limpia y almacenamiento</span><b>Ley del Sector Eléctrico, arts. 3, 19 y 82 a 85</b><small>Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio</small></li>
            </ul>
        </section>
        <nav class="g-partes" aria-label="Puntos clave de la planta">${botonesDePartes()}</nav>
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
const mandos = [...app.querySelectorAll('[data-control]')];
const desarmadores = [...app.querySelectorAll('[data-desarme]')];
const relojes = [...app.querySelectorAll('[data-reloj]')];

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
const M = materiales(P_PLANTA);
const est = estudio(renderer, scene, M, { movil: MOVIL, oscuro: OSCURO });
const planta = construir(M, P_PLANTA);
scene.add(planta.raiz);
const DUENO = new Map();
PARTES.forEach((parte, i) => planta.partes[parte].forEach(g => DUENO.set(g, i)));

// ------------------------------------------------------------------ estado
const horaPedida = Number(parametros.get('hora'));
const pide = { proceso: PROCESOS[parametros.get('proceso')] ? parametros.get('proceso') : 'verde', adentro: false, desarme: 0, noche: parametros.get('noche') === '1', carga: 0.85, demanda: 0.8, temp: 1000, hora: Number.isFinite(horaPedida) && parametros.has('hora') ? horaPedida : 9, corre: !parametros.has('hora') };
const ve = { adentro: 0, desarme: 0, noche: pide.noche ? 1 : 0, nivel: 0.35, soc: 0.6, partes: Object.fromEntries(PARTES.map(p => [p, 0])) };
const fases = planta.giran.map(() => 0);
const camara = { az: 24, el: 30, k: 1, vaz: 0, vel: 0, auto: true, giro: 0, mantener: 0 };
let acomodo = null;
let hoverParte = -1;
let elegida = -1;
const zoom = { f: 0, centro: new THREE.Vector3(0, 0.6, -0.1), parte: -1, tam: 4, az: 24, el: 30, az0: 24, el0: 30, k0: 1 };
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
    acomodo = { vertical, angosto: W < 620, azBase: vertical ? 74 : 22, elBase: vertical ? 52 : 30 };
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
// distancia para que toda la planta quepa en el hueco libre, mirándola desde este ángulo
function distanciaGeneral(az, el) {
    const [Lx, Lz, alto] = [12.9, 9.7, 4.2];
    const [sa, ca] = [Math.abs(Math.sin(az * D2R)), Math.abs(Math.cos(az * D2R))];
    const w = Lx * ca + Lz * sa;
    const h = (Lx * sa + Lz * ca) * Math.sin(el * D2R) + alto * Math.cos(el * D2R);
    const tv = Math.tan((camera.fov * D2R) / 2);
    return Math.max((h * H) / (2 * tv * libre.fh), (w * H) / (2 * tv * libre.fw)) * 0.94;
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
    if (a === 'noche') return nocheActual() ? 'Hacer de día' : 'Hacer de noche';
    if (a === 'desarme') return pide.desarme > 0.5 ? 'Armar' : 'Desarmar';
    return '';
}
const nocheActual = () => (pide.proceso === 'dia' ? nocheEnHora(pide.hora) > 0.5 : pide.noche);
function ponerNoche(si) {
    pide.noche = si;
    if (pide.proceso === 'dia') { pide.hora = si ? 21 : 12; pide.corre = false; ponerMando(); }
}
function ponerDesarme(valor) {
    pide.desarme = clamp01(valor);
    desarmadores.forEach(d => { d.value = String(pide.desarme); });
}
function rotular() {
    botonAdentro.textContent = pide.adentro ? 'Ver por fuera' : 'Ver por dentro';
    botonAdentro.setAttribute('aria-pressed', String(pide.adentro));
    const noche = nocheActual();
    botonLuz.innerHTML = svgIcono(noche ? ICONOS.sol : ICONOS.luna);
    const textoLuz = noche ? 'Cambiar a día' : 'Cambiar a noche';
    botonLuz.setAttribute('aria-label', textoLuz);
    botonLuz.title = textoLuz;
    botonLuz.setAttribute('aria-pressed', String(noche));
    const enCurso = auto.on || !auto.hecho;
    botonRecorrido.setAttribute('aria-pressed', String(enCurso));
    botonRecorrido.querySelector('span').textContent = enCurso ? 'Pausar recorrido' : 'Ver recorrido';
    app.querySelectorAll('[data-proceso]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.proceso === pide.proceso)));
    if (!ficha.hidden) botonAccion.textContent = textoAccion();
    chips.forEach(c => c.setAttribute('aria-pressed', String(Number(c.dataset.parte) === elegida)));
    pines.forEach((p, i) => p.classList.toggle('is-elegido', i === elegida));
    relojes.forEach(b => {
        b.hidden = pide.proceso !== 'dia';
        b.innerHTML = `${svgIcono(pide.corre ? ICONOS.pausa : ICONOS.seguir)}<span>${pide.corre ? 'Pausar el día' : 'Seguir el día'}</span>`;
    });
}
function cambiarProceso(p) {
    if (pide.proceso === p) return;
    if (pide.proceso === 'dia') pide.noche = nocheEnHora(pide.hora) > 0.5;
    if (p === 'dia') { pide.hora = pide.noche ? 20 : 9; pide.corre = !REDUCIR; }
    pide.proceso = p;
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
        ? 'Toca cualquier punto para volver a verlo. Elige «Un día» para ver las 24 horas de la planta: quién le entrega a la red a cada hora y cuánta energía queda guardada.'
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
        cambiarProceso(f.proceso);
        if (f.proceso === 'dia' && f.hora !== undefined) { pide.hora = f.hora; pide.corre = !REDUCIR; ponerMando(); }
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
    if (a === 'noche') ponerNoche(!nocheActual());
    if (a === 'desarme') ponerDesarme(pide.desarme > 0.5 ? 0 : 1);
    rotular();
}
ficha.querySelector('[data-cerrar]').addEventListener('click', () => { pararRecorrido(); cerrarFicha(); });
ficha.querySelector('[data-saltar]').addEventListener('click', () => { pararRecorrido(); pide.adentro = false; pide.noche = false; elegir(FINAL); });
ficha.querySelector('[data-ant]').addEventListener('click', () => elegir(elegida - 1));
ficha.querySelector('[data-sig]').addEventListener('click', () => elegir(elegida + 1));
botonAccion.addEventListener('click', () => { pararRecorrido(); hacerAccion(); });
const alternar = i => { if (elegida === i) { pararRecorrido(); cerrarFicha(); } else elegir(i); };
chips.forEach(c => c.addEventListener('click', () => {
    alternar(Number(c.dataset.parte));
    // la lista va debajo de las gráficas: quien la toca debe ver la planta
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
app.querySelectorAll('[data-proceso]').forEach(b => b.addEventListener('click', () => { pararRecorrido(); if (elegida >= 0) cerrarFicha(); cambiarProceso(b.dataset.proceso); }));
botonAdentro.addEventListener('click', () => { pararRecorrido(); pide.adentro = !pide.adentro; rotular(); });
botonLuz.addEventListener('click', () => { pararRecorrido(); ponerNoche(!nocheActual()); rotular(); });
desarmadores.forEach(d => d.addEventListener('input', () => { pararRecorrido(); ponerDesarme(Number(d.value)); rotular(); }));
relojes.forEach(b => b.addEventListener('click', () => { pararRecorrido(); pide.corre = !pide.corre; rotular(); }));
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
mandos.forEach(d => d.addEventListener('input', () => {
    pararRecorrido();
    const k = Number(d.value) / 100;
    if (pide.proceso === 'verde') pide.carga = k;
    if (pide.proceso === 'pila') pide.demanda = k;
    if (pide.proceso === 'turquesa') pide.temp = 500 + 800 * k;
    if (pide.proceso === 'dia') { pide.hora = k * 24; pide.corre = false; rotular(); }
    ponerMando();
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
    colores = { tinta: v('--tinta'), suave: v('--tinta-suave'), linea: v('--linea'), superficie: v('--ceniza'), fondoPanel: v('--papel-alto'), guinda: v('--rojo'), elec: FLUIDOS.elec.color, h2: FLUIDOS.h2.color, o2: FLUIDOS.o2.color, agua: FLUIDOS.agua.color, ch4: FLUIDOS.ch4.color };
    return colores;
}
const GRAFICAS = {
    verde: {
        titulo: 'Curva de polarización de una celda', xMin: 0, xMax: 2, yMin: 1.1, yMax: 2.1, ticksX: [0, 0.5, 1, 1.5, 2], ticksY: [1.2, 1.5, 1.8, 2.1],
        etX: 'Densidad de corriente (A/cm²)', etY: 'Voltaje (V)', f: voltajeElectrolisis, fx: x => num(x, 1), fy: y => num(y, 1),
        refs: [{ y: V_REVERSIBLE, texto: `Mínimo: ${num(V_REVERSIBLE, 2)} V` }, { y: V_TERMONEUTRO, texto: `Sin pérdida de calor: ${num(V_TERMONEUTRO, 2)} V` }],
        punta: x => `${num(x, 2)} A/cm² · ${num(voltajeElectrolisis(x), 2)} V`, pie: 'Más corriente da más hidrógeno, pero cada celda pide más voltaje. Lo que queda arriba de 1.48 V se pierde como calor.',
        tabla: { cab: ['A/cm²', 'V', 'kWh/kg (celda)'], filas: [0.25, 0.5, 1, 1.5, 2].map(i => [num(i, 2), num(voltajeElectrolisis(i), 2), num(voltajeElectrolisis(i) * 26.59, 1)]) },
    },
    pila: {
        titulo: 'Curva de la celda de combustible', xMin: 0, xMax: 1.3, yMin: 0.3, yMax: 1.3, ticksX: [0, 0.4, 0.8, 1.2], ticksY: [0.4, 0.8, 1.2],
        etX: 'Densidad de corriente (A/cm²)', etY: 'Voltaje (V)', f: x => voltajePila(Math.max(x, 0.002)), fx: x => num(x, 1), fy: y => num(y, 1),
        refs: [{ y: V_REVERSIBLE, texto: `Máximo teórico: ${num(V_REVERSIBLE, 2)} V` }],
        punta: x => `${num(x, 2)} A/cm² · ${num(voltajePila(Math.max(x, 0.002)), 2)} V`, pie: 'Entre más corriente se le pide, menos voltaje da cada celda. Lo que le falta para llegar a 1.23 V sale como calor.',
        tabla: { cab: ['A/cm²', 'V', 'kWh/kg'], filas: [0.2, 0.4, 0.8, 1, 1.2].map(i => [num(i, 2), num(voltajePila(i), 2), num(voltajePila(i) * 26.59, 1)]) },
    },
    turquesa: {
        titulo: 'Metano que se puede partir, según la temperatura', xMin: 400, xMax: 1300, yMin: 0, yMax: 100, ticksX: [400, 700, 1000, 1300], ticksY: [0, 50, 100],
        etX: 'Temperatura (°C)', etY: 'Conversión (%)', f: x => conversionEquilibrio(x) * 100, fx: x => num(x), fy: y => num(y),
        refs: [], punta: x => `${num(x)} °C · ${num(conversionEquilibrio(x) * 100)} %`, pie: 'Es el límite teórico de equilibrio a presión atmosférica; un reactor real convierte menos.',
        tabla: { cab: ['°C', 'Conversión %'], filas: [500, 700, 900, 1000, 1200].map(t => [num(t), num(conversionEquilibrio(t) * 100)]) },
    },
};
const ANCHO = 320;
const ALTO = 170;
const MARGEN = { i: 32, d: 8, a: 10, b: 32 };
/** Dibuja una gráfica en SVG: una línea, varias líneas o áreas apiladas. Una sola escala, cruz y punta al pasar. */
function pintarGrafica(el, cfg) {
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
    if (cfg.apiladas) {
        const filas = diaCompleto();
        const xs = [...filas.map(f => f.h), 24];
        const fila = i => filas[i % filas.length];
        const base = xs.map(() => 0);
        for (const capa of cfg.apiladas) {
            const arriba = xs.map((_, i) => base[i] + capa.valor(fila(i)));
            const d = xs.map((x, i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(arriba[i]).toFixed(1)}`).join('') + [...xs].reverse().map((x, i) => `L${sx(x).toFixed(1)} ${sy(base[xs.length - 1 - i]).toFixed(1)}`).join('') + 'Z';
            marcas += `<path class="h-g-capa ${capa.clase}" d="${d}"/>`;
            xs.forEach((_, i) => { base[i] = arriba[i]; });
        }
    }
    for (const l of cfg.lineas || []) marcas += `<path class="h-g-serie ${l.clase}" d="${linea(l.f, 96)}"/>`;
    el.innerHTML = `<svg viewBox="0 0 ${ANCHO} ${ALTO}" role="img" aria-label="${cfg.titulo}: ${cfg.etY} según ${cfg.etX}">
        ${cfg.ticksY.map(y => `<line class="h-g-rejilla" x1="${MARGEN.i}" x2="${ANCHO - MARGEN.d}" y1="${sy(y)}" y2="${sy(y)}"/><text class="h-g-t" x="${MARGEN.i - 5}" y="${sy(y) + 3.5}" text-anchor="end">${cfg.fy(y)}</text>`).join('')}
        ${cfg.ticksX.map(x => `<text class="h-g-t" x="${sx(x)}" y="${ALTO - MARGEN.b + 13}" text-anchor="middle">${cfg.fx(x)}</text>`).join('')}
        <text class="h-g-t" x="${(MARGEN.i + ANCHO - MARGEN.d) / 2}" y="${ALTO - 3}" text-anchor="middle">${cfg.etX}</text>
        ${marcas}
        ${(cfg.refs || []).map(r => `<line class="h-g-ref" x1="${MARGEN.i}" x2="${ANCHO - MARGEN.d}" y1="${sy(r.y)}" y2="${sy(r.y)}"/><text class="h-g-rt" x="${ANCHO - MARGEN.d}" y="${sy(r.y) - 3}" text-anchor="end">${r.texto}</text>`).join('')}
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
const leyenda = series => series.map(s => `<i class="${s.clase}"></i>${s.nombre}`).join('');
const horaFila = h => { const f = diaCompleto(); return f[Math.round(clamp(h, 0, 24) / PASO_HORAS) % f.length]; };
const SERIES = { directo: 'h-s-directo', bateria: 'h-s-bateria', h2: 'h-s-h2' };
const ejeHoras = { xMin: 0, xMax: 24, ticksX: [0, 6, 12, 18, 24], fx: x => `${x} h`, etX: 'Hora del día' };
const USOS = [
    { clase: SERIES.directo, nombre: 'A la red', valor: f => f.directo },
    { clase: SERIES.bateria, nombre: 'A las baterías', valor: f => f.carga },
    { clase: SERIES.h2, nombre: 'A hacer hidrógeno', valor: f => f.elec },
];
const ENTREGAS = [
    { clase: SERIES.directo, nombre: 'Sol y viento', valor: f => f.directo },
    { clase: SERIES.bateria, nombre: 'SAE de baterías', valor: f => f.descarga },
    { clase: SERIES.h2, nombre: 'SAE de hidrógeno', valor: f => f.saeH2 },
];
const GUARDADO = [
    { clase: SERIES.bateria, nombre: 'Baterías', f: x => horaFila(x).soc * 100 },
    { clase: SERIES.h2, nombre: 'Tanques', f: x => horaFila(x).nivel * 100 },
];
const puntaApilada = capas => x => `${horaTexto(x)} · ${capas.map(c => `${c.nombre}: ${num(c.valor(horaFila(x)), 1)} MW`).join(' · ')}`;
let graficas = {};
function pintarDia() {
    $('#h-a-t').textContent = 'Para qué se usa lo que generan sol y viento';
    $('#h-a-ley').innerHTML = leyenda(USOS);
    $('#h-a-pie').textContent = `Primero se cumple con la red; lo que sobra carga las baterías y lo demás hace hidrógeno. En un día esta planta genera unos ${num(diaCompleto().reduce((a, f) => a + f.ren * PASO_HORAS, 0))} MWh.`;
    graficas.a = pintarGrafica($('#h-a-grafica'), { ...ejeHoras, titulo: 'Para qué se usa lo que generan sol y viento', etY: 'Potencia (MW)', yMin: 0, yMax: 12, ticksY: [0, 4, 8, 12], fy: y => num(y), apiladas: USOS, punta: puntaApilada(USOS) });
    $('#h-b-t').textContent = 'De dónde sale lo que recibe la red';
    $('#h-b-ley').innerHTML = leyenda(ENTREGAS);
    const conBat = diaCompleto().filter(f => f.descarga > 0.01).map(f => f.h);
    const conH2 = diaCompleto().filter(f => f.saeH2 > 0.01 && f.h < 12).map(f => f.h);
    $('#h-b-pie').textContent = `Las baterías entregan de ${horaTexto(conBat[0])} a ${horaTexto(conBat.at(-1))}. Al terminarse entra el hidrógeno, hasta las ${horaTexto(conH2.at(-1))}.`;
    graficas.b = pintarGrafica($('#h-b-grafica'), { ...ejeHoras, titulo: 'De dónde sale lo que recibe la red', etY: 'Potencia (MW)', yMin: 0, yMax: 5, ticksY: [0, 1, 2, 3, 4, 5], fy: y => num(y), apiladas: ENTREGAS, punta: puntaApilada(ENTREGAS) });
    $('#h-tabla').innerHTML = `<thead><tr><th scope="col">Hora</th><th scope="col">Sol y viento (MW)</th><th scope="col">Baterías (MW)</th><th scope="col">Hidrógeno (MW)</th><th scope="col">Electrolizador (MW)</th><th scope="col">Baterías (%)</th><th scope="col">Tanques (%)</th></tr></thead><tbody>${[0, 3, 6, 9, 12, 15, 18, 21].map(h => { const f = horaFila(h); return `<tr><td>${horaTexto(h)}</td><td>${num(f.directo, 1)}</td><td>${num(f.descarga - f.carga, 1)}</td><td>${num(f.saeH2, 1)}</td><td>${num(f.elec, 1)}</td><td>${num(f.soc * 100)}</td><td>${num(f.nivel * 100)}</td></tr>`; }).join('')}</tbody>`;
    $('#h-c-t').textContent = 'Cuánta energía hay guardada';
    $('#h-c-ley').innerHTML = leyenda(GUARDADO);
    $('#h-c-pie').textContent = `De cada 100 kWh guardados regresan unos ${REGRESA_BAT} en baterías y unos ${REGRESA_H2} con hidrógeno. A cambio, los tanques llenos guardan unos ${num(UTIL.tanques)} MWh útiles contra ${num(UTIL.baterias)} de las baterías.`;
    graficas.c = pintarGrafica($('#h-c-grafica'), { ...ejeHoras, titulo: 'Cuánta energía hay guardada', etY: 'Nivel (%)', yMin: 0, yMax: 100, ticksY: [0, 50, 100], fy: y => num(y), lineas: GUARDADO, punta: x => `${horaTexto(x)} · Baterías: ${num(horaFila(x).soc * 100)} % · Tanques: ${num(horaFila(x).nivel * 100)} %` });
}
function pintarBarras() {
    const ref = calcular({ proceso: 'verde', carga: 1, sol: 1 }).verde.kwhKg;
    const piro = calcular({ proceso: 'turquesa', temp: pide.temp }).turquesa.kwhKg;
    const filas = [{ id: 'verde', t: 'Electrólisis usa', v: ref }, { id: 'turquesa', t: 'Pirólisis usa (calor)', v: piro }, { id: 'pila', t: 'SAE de hidrógeno devuelve', v: IDA.sale }];
    $('#h-barras').innerHTML = filas.map(f => `<div class="h-barra-f${f.id === pide.proceso ? ' es-activa' : ''}" title="${f.t}: ${num(f.v, 1)} kWh por kilo de hidrógeno"><span>${f.t}</span><i><u style="width:${(f.v / 60) * 100}%"></u></i><b>${num(f.v)} kWh</b></div>`).join('');
    $('#h-c-t').textContent = 'Energía por kilo de hidrógeno';
    $('#h-c-ley').textContent = '';
    $('#h-c-pie').textContent = `De cada 100 kWh que entran al electrolizador, el SAE de hidrógeno regresa unos ${REGRESA_H2}.`;
}
function pintarTablero() {
    const P = PROCESOS[pide.proceso];
    const esDia = pide.proceso === 'dia';
    app.dataset.proceso = pide.proceso;
    ponerCifra('resumen', P.resumen);
    $('[data-eq]').textContent = P.eq;
    $('[data-eq]').hidden = !P.eq;
    $('#h-diagrama').hidden = esDia;
    $('#h-a-grafica').hidden = !esDia;
    $('#h-a-pie').hidden = !esDia;
    $('#h-barras').hidden = esDia;
    $('#h-c-grafica').hidden = !esDia;
    if (esDia) pintarDia();
    else {
        $('#h-a-t').textContent = 'Qué pasa adentro';
        $('#h-a-ley').textContent = '';
        const cfg = GRAFICAS[pide.proceso];
        $('#h-b-t').textContent = cfg.titulo;
        $('#h-b-ley').textContent = '';
        $('#h-b-pie').textContent = cfg.pie;
        graficas = { b: pintarGrafica($('#h-b-grafica'), cfg) };
        $('#h-tabla').innerHTML = `<thead><tr>${cfg.tabla.cab.map(c => `<th scope="col">${c}</th>`).join('')}</tr></thead><tbody>${cfg.tabla.filas.map(f => `<tr>${f.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`;
        pintarBarras();
    }
    ponerCifra('mando', P.mando);
    mandos.forEach(d => d.setAttribute('aria-label', P.mando));
    ponerMando();
    ultimoTablero = 0; // las cifras del proceso nuevo salen en el siguiente cuadro
}
function ponerMando() {
    const valor = pide.proceso === 'verde' ? pide.carga * 100 : pide.proceso === 'pila' ? pide.demanda * 100 : pide.proceso === 'dia' ? (pide.hora / 24) * 100 : ((pide.temp - 500) / 800) * 100;
    mandos.forEach(d => { if (document.activeElement !== d || pide.proceso === 'dia') d.value = String(valor); });
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
function actualizarTablero(L) {
    let aviso = null;
    if (L.verde) {
        const v = L.verde;
        ponerCifra('mandoValor', `${num(v.i, 2)} A/cm²`);
        if (ve.nivel >= 0.999) aviso = 'Los tanques están llenos: la producción se detiene.';
        else if (v.limitada) aviso = `Solo hay ${num(L.disponible, 1)} MW disponibles${L.sol < 0.05 ? ': de noche, solo el viento' : ''}.`;
        ponerLecturas([['Consume', num(v.total, 1), 'MW'], ['Voltaje', num(v.v, 2), 'V por celda'], ['Hidrógeno', num(v.kgH), 'kg/h'], ['Agua', num(v.aguaLH), 'L/h'], ['Oxígeno', num(v.o2KgH), 'kg/h'], ['Gasto', num(v.kwhKg, 1), 'kWh/kg']], aviso);
        ponerCifra('hud', `${num(v.kgH)} kg/h`);
        ponerCifra('hud2', 'de hidrógeno verde');
        graficas.b?.cfg === GRAFICAS.verde && graficas.b.marcar(v.i, v.v);
    } else if (L.turquesa) {
        const q = L.turquesa;
        ponerCifra('mandoValor', `${num(q.temp)} °C`);
        if (ve.nivel >= 0.999) aviso = 'Los tanques están llenos: la producción se detiene.';
        else if (q.x < 0.9) aviso = 'A esta temperatura queda metano sin partir, y hay que separarlo después.';
        ponerLecturas([['Conversión', num(q.x * 100), '% (límite)'], ['Hidrógeno', num(q.kgH), 'kg/h'], ['Metano', num(q.ch4KgH), 'kg/h'], ['Carbono', num(q.cKgH), 'kg/h'], ['Calor', num(q.kwhKg, 1), 'kWh/kg'], ['CO₂ directo', '0', 'kg/h']], aviso);
        ponerCifra('hud', `${num(q.kgH)} kg/h`);
        ponerCifra('hud2', 'de hidrógeno turquesa');
        graficas.b?.cfg === GRAFICAS.turquesa && graficas.b.marcar(q.temp, q.x * 100);
    } else if (L.pila) {
        const c = L.pila;
        ponerCifra('mandoValor', `${num(c.i, 2)} A/cm²`);
        if (ve.nivel <= 0.002) aviso = 'Los tanques están vacíos: el SAE de hidrógeno se detiene.';
        ponerLecturas([['Entrega', num(c.mw, 2), 'MW'], ['Voltaje', num(c.v, 2), 'V por celda'], ['Hidrógeno', num(c.kgH), 'kg/h'], ['Agua que sale', num(c.aguaLH), 'L/h'], ['Calor', num(c.calorMW, 1), 'MW'], ['Rinde', num(c.kwhKg, 1), 'kWh/kg']], aviso);
        ponerCifra('hud', `${num(c.mw, 2)} MW`);
        ponerCifra('hud2', 'a la red, desde el hidrógeno');
        graficas.b?.cfg === GRAFICAS.pila && graficas.b.marcar(Math.max(c.i, 0.002), clamp(c.v, 0.3, 1.3));
    } else if (L.dia) {
        const d = L.dia;
        ponerCifra('mandoValor', horaTexto(d.h));
        const bat = d.descarga > 0.01 ? [`${num(d.descarga, 1)}`, 'MW que entregan'] : d.carga > 0.01 ? [`${num(d.carga, 1)}`, 'MW que reciben'] : ['0', 'MW, en reposo'];
        ponerLecturas([['Sol y viento', num(d.ren, 1), 'MW'], ['A la red', num(d.red, 1), 'MW'], ['Baterías', bat[0], bat[1]], ['Electrolizador', num(d.elec, 1), 'MW'], ['SAE de hidrógeno', num(d.saeH2, 1), 'MW'], ['Hidrógeno', num(d.kgEntra - d.kgSale), 'kg/h netos']], null);
        ponerCifra('hud', horaTexto(d.h));
        ponerCifra('hud2', d.descarga > d.saeH2 && d.descarga > 0.05 ? `Entregan las baterías: ${num(d.descarga, 1)} MW` : d.saeH2 > 0.05 ? `Entrega el hidrógeno: ${num(d.saeH2, 1)} MW` : d.carga > 0.05 ? `Se cargan las baterías: ${num(d.carga, 1)} MW` : d.elec > 0.05 ? `Se hace hidrógeno: ${num(d.kgEntra)} kg/h` : `A la red: ${num(d.red, 1)} MW`);
        for (const g of Object.values(graficas)) g?.ahora(d.h);
    }
    $('#h-nivel-tanques').style.width = `${ve.nivel * 100}%`;
    ponerCifra('nivelTanques', `${num(ve.nivel * 100)} % · ${num(ve.nivel * PLANTA.presionBar)} bar`);
    $('#h-nivel-baterias').style.width = `${ve.soc * 100}%`;
    ponerCifra('nivelBaterias', `${num(ve.soc * 100)} % · ${num(ve.soc * BATERIA.mwh, 1)} MWh`);
}

// ------------------------------------------------------------------ medidas y mensajes con Aprende
let alturaAvisada = 0;
function avisarAltura() {
    if (completa) return;
    // la altura de lo que hay, no la del documento: «Un día» es más alto y al salir de ahí el marco debe encogerse
    const h = Math.ceil(app.getBoundingClientRect().height);
    if (Math.abs(h - alturaAvisada) < 2) return;
    alturaAvisada = h;
    avisar({ type: 'concepto-height', id: FIGURA, h });
}
let bajoCalidad = false;
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
    if (pide.proceso === 'dia' && pide.corre && (enPantalla || tableroEnPantalla)) {
        pide.hora = (pide.hora + DIA_HORAS_POR_SEGUNDO * dt) % 24;
        ponerMando();
    }
    const encendido = REDUCIR ? 1 : clamp01((entrada - 0.15) / 2);
    ve.adentro = seguir(ve.adentro, pide.adentro ? 1 : 0, 2.6);
    PARTES.forEach((p, i) => { ve.partes[p] = seguir(ve.partes[p], i === elegida && FICHAS[i].abrir ? 1 : 0, 2.6); });
    ve.desarme += clamp(pide.desarme - ve.desarme, -dt / 1.5, dt / 1.5);
    const metaNoche = pide.proceso === 'dia' ? nocheEnHora(pide.hora) : pide.noche ? 1 : 0;
    ve.noche = seguir(ve.noche, metaNoche, pide.proceso === 'dia' ? 6 : 2.2);
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
    let az = camara.az + (camara.auto && !REDUCIR ? Math.sin(t * 0.25) * 6 : 0);
    let el = camara.el + (camara.auto && !REDUCIR ? Math.sin(t * 0.19) * 1.5 : 0);
    let d = distanciaGeneral(az, el) * camara.k * (1 + 0.45 * (1 - sale(entrada / 2.4))) * (1 + 0.16 * sale(ve.desarme));
    miraV.set(0, 0.55 + 0.5 * sale(ve.desarme), -0.15);

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
            tam = (vuelo.tam0 + (zoom.tam - vuelo.tam0) * k) * (1 + 0.7 * Math.sin(Math.PI * vuelo.t));
            azV = vuelo.az0 + (zoom.az - vuelo.az0) * k;
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
                cambiarProceso('verde');
                elegir(FINAL, { solo: true });
                pararRecorrido();
            } else elegir(elegida + 1, { solo: true });
        }
    }

    // lo guardado: en «Un día» sale del reparto del día; en los demás, los tanques se integran con lo que entra y lo que sale
    const esDia = pide.proceso === 'dia';
    const cargaPedida = pide.proceso === 'pila' ? pide.demanda : pide.carga;
    const lleno = !esDia && pide.proceso !== 'pila' && ve.nivel >= 0.999;
    const vacio = pide.proceso === 'pila' && ve.nivel <= 0.002;
    const e = pose({
        proceso: pide.proceso, carga: lleno || vacio ? 0 : cargaPedida, temp: pide.temp, noche: ve.noche, adentro: ve.adentro, desarme: ve.desarme, encendido, nivel: ve.nivel, soc: ve.soc, hora: pide.hora, t, dt,
        camara: { mira: miraV.toArray(), az, el, d },
    });
    if (lleno) e.flujos.alta = 0;
    if (esDia) {
        ve.nivel = seguir(ve.nivel, e.lectura.dia.nivel, 5);
        ve.soc = seguir(ve.soc, e.lectura.dia.soc, 5);
    } else if (!REDUCIR) ve.nivel = clamp01(ve.nivel + ((e.lectura.h2Entra * (lleno ? 0 : 1) - e.lectura.h2Sale) * HORAS_POR_SEGUNDO * dt) / PLANTA.tanqueKg);
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
    if (!esDia && tableroEnPantalla) diagrama.dibujar(pide.proceso, t, Math.max(0.15, e.f[pide.proceso]), colores || leerColores(), pide.temp);
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
pintarTablero();
rotular();
document.fonts?.ready.then(ajustar);
addEventListener('load', avisarAltura);
// para las pruebas
window.__PLANTA = () => ({ proceso: pide.proceso, adentro: +ve.adentro.toFixed(2), desarme: +ve.desarme.toFixed(2), noche: +ve.noche.toFixed(2), nivel: +ve.nivel.toFixed(3), soc: +ve.soc.toFixed(3), hora: +pide.hora.toFixed(2), elegida, parte: PARTES[elegida] ?? null, recorrido: auto.on, az: +camara.az.toFixed(1), k: +camara.k.toFixed(2) });
window.__PUNTO = parte => { planta.anclas[parte].getWorldPosition(centro); const r = escena.getBoundingClientRect(); return pantalla(centro).map((c, i) => Math.round(c + (i ? r.top : r.left))); };
requestAnimationFrame(cuadro);
