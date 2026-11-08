// «Central geotérmica», en 3D y con el formato Búho de «¿Cómo funciona?». Un bloque de tierra cortado de frente y, encima, la
// central: el calor de la roca, el yacimiento, los pozos, el separador, la turbina, el generador, el condensador, la torre, los
// pozos de reinyección, la subestación, la RNT y las RGD. Cuatro formas de verla: vapor flasheado, vapor seco, ciclo binario y
// lo que pasa a 30 años según cuánta agua regresa. Puntos clave con su ficha, ver por dentro, desarmar, día y noche, y gráficas
// que leen las mismas cifras que mueven la central (modelo.js). Se arma con: node scripts/build-conceptos-3d.mjs geotermica
//
// No usa crearMaquina: la cámara vuela entre las partes y cada parte lleva ficha, tablero y gráficas propias. Sí respeta su
// contrato con Aprende (concepto-height, concepto-part, concepto-select-part, concepto-listo, concepto-fullscreen) y su estilo
// común (clases g-*). El tema del sitio (data-tema) es independiente de la noche de la central: la noche solo cambia la escena.
import * as THREE from 'three';
import { brandMarkSvg } from '../../src/lib/brand-mark.js';
import { AGUA, DEF, FLUIDOS, LIMITES, M_TOTAL, PARTES as PARTES_M, T_COND, binario, calcular, enAnio, flash, pSepOptimo, pose, posicionCamara, puntosCiclo, seco } from './modelo.js';
import { P_PLANTA, materiales, estudio, construir } from './planta.js';
import { crearDiagrama } from './diagrama.js';
import { FUENTES } from './fuentes.js';

const FIGURA = 'geotermica';
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
const ANIOS_POR_SEGUNDO = 0.6; // en «A 30 años»: 30 años en 50 segundos
const MOVIL = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 600;
const avisar = datos => { try { if (parent !== window) parent.postMessage(datos, location.origin); } catch { /* sin padre del mismo origen */ } };

const BASE = flash();
const BIN_BASE = binario();

// ------------------------------------------------------------------ puntos clave
// En el mismo orden y con el mismo número que las partes de la ficha de Aprende (src/data/como-funciona.js).
const FICHAS = [
    { parte: 'roca', nombre: 'Roca caliente', modo: 'flash', accion: 'desarme', recorrido: { noche: false, adentro: false },
        icono: '<path d="M12 3c1 3-3 5-3 9a3 3 0 0 0 6 0c0-1-.4-1.8-1-2.6 2.6 1 4 3.2 4 5.6a6 6 0 0 1-12 0c0-5 5-7 6-12Z"/>',
        texto: 'Todo empieza con calor. Aquí no se quema nada. A varios kilómetros, una cámara de magma o una roca muy caliente calienta lo que tiene encima, y ese calor sube despacio. Por eso hay campos en zonas volcánicas, como Los Azufres, y donde la corteza se adelgaza, como Cerro Prieto.' },
    { parte: 'yacimiento', nombre: 'Yacimiento', modo: 'flash', accion: 'desarme', eq: 'Para la Ley de Geotermia: agua a 80 °C o más', recorrido: { noche: false },
        icono: '<path d="M12 3s6.5 7 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10 12 3 12 3Z"/>',
        texto: 'Es agua muy caliente guardada en las grietas y poros de la roca. Una capa sello, que no deja pasar el agua, la mantiene apretada: por esa presión sigue líquida aunque esté a 280 °C. Si una falla rompe el sello, el vapor se asoma arriba, como en la fumarola que se ve junto a los tubos.' },
    { parte: 'pozo', nombre: 'Pozos productores', modo: 'flash', accion: 'desarme', recorrido: { adentro: false },
        icono: '<path d="M12 21V8M8 8h8M9 4h6M12 4v4"/><path d="M9 12h6M9 16h6"/>',
        texto: `Cuatro pozos sacan ${num(BASE.m * 3.6)} toneladas de agua por hora. En México miden de 600 a 4,400 metros. Son tubos de acero, cada vez más angostos, y abajo van ranurados para que entre el agua. Al subir pierde presión y empieza a hervir: arriba llega agua con vapor. La chimenea ancha es el silenciador: ahí se descarga un pozo cuando no va a la central.` },
    { parte: 'separador', nombre: 'Separador', modo: 'flash', abrir: true, accion: 'desarme', eq: `Con ${num(BASE.tempYac)} °C y ${num(BASE.pSep)} bar: ${num(BASE.x * 100)} % de vapor`,
        icono: '<rect x="7" y="3" width="10" height="18" rx="5"/><path d="M7 15h10M12 3v6"/>',
        texto: 'Aquí baja la presión de golpe y parte del agua se vuelve vapor: a eso se le llama flasheo. La mezcla entra girando. El agua, más pesada, se pega a las paredes y cae; el vapor sale por arriba. Sigue por el vaporducto, cuyas curvas en U dejan que el tubo se estire con el calor sin romperse.' },
    { parte: 'turbina', nombre: 'Turbina', modo: 'flash', abrir: true, accion: 'desarme', eq: `${num(BASE.consumo, 1)} toneladas de vapor por MWh`,
        icono: '<path d="M4 12h16"/><path d="M8 7v10M12 5v14M16 3v18"/>',
        texto: 'Dentro de esta casa de máquinas, el vapor empuja filas de álabes y hace girar el eje. Al avanzar se expande, y por eso los álabes son cada vez más largos. Como sale casi sin presión, le saca mucha energía. En Cerro Prieto, las unidades gastan de 6.8 a 10.6 toneladas de vapor por cada MWh.' },
    { parte: 'generador', nombre: 'Generador', modo: 'flash', abrir: true, accion: 'desarme', eq: `${num(BASE.bruta, 1)} MW en el generador`,
        icono: '<circle cx="12" cy="12" r="7.5"/><path d="M12.8 7.5 9.7 12.6h4.6l-3 4"/>',
        texto: `El mismo eje hace girar un imán de cobre dentro de las bobinas y ahí nace la electricidad. Gira 3,600 veces por minuto para dar los 60 ciclos por segundo de la red mexicana. Bombas y ventiladores se quedan con cerca de 7 de cada 100 MW; a la red salen ${num(BASE.neta, 1)} MW.` },
    { parte: 'condensador', nombre: 'Condensador', modo: 'flash', abrir: true, accion: 'desarme', eq: `${num(T_COND)} °C y 0.12 bar`,
        icono: '<rect x="3" y="7" width="18" height="10" rx="5"/><path d="M8 10v1M12 10v1M16 10v1M8 14v1M12 14v1M16 14v1"/>',
        texto: 'Aquí el vapor se encuentra con una lluvia de agua fría y se vuelve líquido. Al ocupar mucho menos espacio deja un vacío que jala más vapor por la turbina. Los gases que traía, sobre todo CO₂ con algo de H₂S, no se vuelven líquidos: un extractor los saca y suben a la torre por el tubo verde olivo.' },
    { parte: 'torre', nombre: 'Torre de enfriamiento', modo: 'flash', abrir: true, accion: 'desarme', eq: `Se evaporan ${num((BASE.evap / BASE.m) * 100)} de cada 100 kilos que suben`,
        icono: '<path d="M6 21 8 8h8l2 13"/><path d="M8 3c1 1-1 2 0 3M12 2c1 1.3-1 2.5 0 4M16 3c1 1-1 2 0 3"/>',
        texto: `Enfría el agua del condensador. El agua tibia cae por una rejilla mientras tres ventiladores jalan aire, y una parte se evapora y se lleva el calor. Lo blanco que sale no es humo: es vapor de agua. Esa agua ya no regresa; por cada hora se van unas ${num(BASE.evap * 3.6)} toneladas.` },
    { parte: 'reinyeccion', nombre: 'Pozos de reinyección', modo: 'anios', accion: 'desarme', eq: 'Ley de Geotermia, art. 29: el agua debe regresar', recorrido: { adentro: false },
        icono: '<path d="M12 3v14M7 12l5 5 5-5"/><path d="M5 21h14"/>',
        texto: 'El agua que no se evaporó regresa bajo tierra, empujada por una bomba, lejos de los pozos productores. Así se sostiene la presión y el yacimiento dura más. Si entra demasiado cerca, lo enfría: un pozo de Palinpinon, en Filipinas, perdió 50 °C en 4 años. La alberca de la orilla es una laguna de evaporación; Cerro Prieto tiene una de 15 km² para lo que no reinyecta.' },
    { parte: 'binaria', nombre: 'Planta binaria', modo: 'binario', abrir: true, accion: 'desarme', eq: `Con agua a ${num(BIN_BASE.tempBin)} °C: ${num(BIN_BASE.neta, 1)} MW`,
        icono: '<circle cx="8" cy="12" r="4.5"/><circle cx="16" cy="12" r="4.5"/>',
        texto: 'Sirve con agua de menos de 182 °C, que da poco vapor, o con la que sobra del separador. El agua no toca la turbina: calienta isopentano, un líquido que hierve más fácil, en un circuito cerrado. Su vapor mueve una turbina chica y unos ventiladores lo enfrían con aire. No suelta gases ni evapora agua. En Berlín, El Salvador, una así da 9.2 MW.' },
    { parte: 'subestacion', nombre: 'Subestación', modo: 'flash', abrir: true, accion: 'desarme', eq: `${num(BASE.neta, 1)} MW: ${num((BASE.neta * 1e3) / (Math.sqrt(3) * 13.8))} A a 13.8 kV, ${num((BASE.neta * 1e3) / (Math.sqrt(3) * 115))} A a 115 kV`,
        icono: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
        texto: 'El generador da unos 13.8 kV, muy poco para viajar lejos. Este transformador sube el voltaje a 115 kV: con más voltaje, la misma potencia viaja con menos corriente y los cables se calientan menos. El pórtico de al lado conecta la central con la línea.' },
    { parte: 'red', nombre: 'RNT y RGD', modo: 'flash', accion: 'noche', recorrido: { noche: true, adentro: false },
        icono: '<path d="M12 3 6 21M12 3l6 18M8 9h8M7 14h10"/>',
        texto: 'La electricidad sale por la RNT, la Red Nacional de Transmisión, que la lleva lejos y a grandes usuarios. Cerca del pueblo, otra subestación baja el voltaje y las RGD, las Redes Generales de Distribución, la reparten al público. No depende del sol ni del viento: da lo mismo de día que de noche. Los Azufres trabajó en 2017 al 89 % de su capacidad.' },
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
    flash: { nombre: 'Vapor flasheado', corto: 'Flasheo', resumen: 'La forma más común, y la de las unidades grandes de México. El agua del pozo baja de presión, parte se vuelve vapor y ese vapor mueve la turbina.', mando: 'Presión del separador', mando2: 'Temperatura del yacimiento' },
    seco: { nombre: 'Vapor seco', corto: 'Seco', resumen: 'El pozo da vapor, sin agua: va directo a la turbina y no hace falta separador. Es muy raro; se conoce en Larderello, en Italia, y en The Geysers, en Estados Unidos.', mando: 'Presión a la turbina' },
    binario: { nombre: 'Ciclo binario', corto: 'Binaria', resumen: 'Para agua de menos de 182 °C. El agua calienta isopentano en un circuito cerrado y todo regresa al subsuelo: no hay vapor de pozo, ni torre, ni gases.', mando: 'Temperatura del agua' },
    anios: { nombre: 'A 30 años', corto: '30 años', resumen: 'Sacar agua baja la presión del yacimiento, y con ella la potencia. Mueve cuánta agua regresa y mira qué pasa en 30 años. Es un modelo sencillo: un campo real, además, perfora pozos nuevos.', mando: 'Agua que regresa', mando2: 'Año' },
};

// ------------------------------------------------------------------ la página
const controles = () => `
    <div class="g-seg h-procesos" role="radiogroup" aria-label="Qué ver en la central">
        ${Object.entries(MODOS).map(([id, p]) => `<button type="button" role="radio" data-modo="${id}" aria-checked="false"><span class="h-largo">${p.nombre}</span><span class="h-corto">${p.corto}</span></button>`).join('')}
    </div>
    <label class="g-deslizador h-mando"><span class="h-rotulo"><span data-c="mando"></span><b data-c="mandoValor"></b></span><input type="range" data-control="1" min="0" max="100" step="0.25" value="50"></label>
    <label class="g-deslizador h-mando" data-caja2><span class="h-rotulo"><span data-c="mando2"></span><b data-c="mando2Valor"></b></span><input type="range" data-control="2" min="0" max="100" step="0.25" value="50"></label>
    <label class="g-deslizador h-mando"><span class="h-rotulo"><span>Desarmar</span></span><input type="range" data-desarme min="0" max="1" step="0.01" value="0" aria-label="Desarmar la central"></label>
    <button type="button" class="g-chip h-reloj" data-reloj hidden></button>`;
const botonesDePartes = () => FICHAS.map((f, i) => `<button type="button" data-parte="${i}" aria-pressed="false"><span>${i + 1}</span>${f.nombre}</button>`).join('');
const MEXICO = [
    { campo: 'Cerro Prieto', estado: 'Baja California', mw: 570, gwh: 3554, factor: 71.1 },
    { campo: 'Los Azufres', estado: 'Michoacán', mw: 246.6, gwh: 1767, factor: 89.1 },
    { campo: 'Los Humeros', estado: 'Puebla', mw: 93.9, gwh: 416, factor: 81.6 },
    { campo: 'Domo San Pedro', estado: 'Nayarit', mw: 35.5, gwh: 153, factor: null },
    { campo: 'Las Tres Vírgenes', estado: 'Baja California Sur', mw: 10, gwh: 47, factor: 53.6 },
];
const app = document.getElementById('app');
app.innerHTML = `
    <div class="g-escena">
        <div class="h-cielo" aria-hidden="true"></div>
        <canvas class="g-lienzo" aria-label="Central geotérmica en 3D: arrastra para girarla, toca un punto para conocerlo"></canvas>
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
            <div class="g-curva-cab"><b>Tres maneras de usar el calor</b></div>
            <div class="h-tabla-suelta h-tabla-texto"><table id="h-comparar"></table></div>
            <p>Para esta central de ejemplo, con cuatro pozos. La principal aquí es el flasheo porque es la más usada en el mundo y la de las unidades grandes de México.</p>
        </section>
        <section class="g-curva h-media">
            <div class="g-curva-cab"><b>Geotermia en México, 2017</b></div>
            <div class="h-tabla-suelta"><table id="h-mexico"></table></div>
            <p>Suman 956 MW. Cerro Prieto llegó a 740 MW en 2007; en 2011 y 2012 la CFE sacó de operación cuatro unidades porque bajó la producción de vapor.</p>
        </section>
        <section class="g-curva h-colores">
            <div class="g-curva-cab"><b>Colores de los tubos</b></div>
            <ul class="h-tubos">${Object.values(FLUIDOS).map(f => `<li><i style="background:${f.color}"></i>${f.nombre}</li>`).join('')}</ul>
            <p>Central de ejemplo de 25 MW, del tamaño de las unidades de Los Azufres y Los Humeros; no es una central real. La regla mide el subsuelo; la central de arriba no está a esa escala.</p>
        </section>
        <section class="g-curva h-fuentes" aria-labelledby="h-fuentes-t">
            <div class="g-curva-cab"><b id="h-fuentes-t">Fuentes</b></div>
            <ul>
                ${FUENTES.map(f => `<li><span class="h-fuente-para">${f.para}</span><a href="${f.url}" target="_blank" rel="noopener">${f.titulo}</a><small>${f.autor}, ${f.fecha}${f.editorial ? `. ${f.editorial}` : ''}</small></li>`).join('')}
                <li><span class="h-fuente-para">Yacimiento, concesión y agua que debe regresar</span><b>Ley de Geotermia, arts. 2, 8, 21 y 29</b><small>Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio</small></li>
                <li><span class="h-fuente-para">Energía limpia, RNT y RGD</span><b>Ley del Sector Eléctrico, arts. 3 y 19</b><small>Diario Oficial de la Federación, 18 de marzo de 2025. Está en el acervo de este sitio</small></li>
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
const anioPedido = Number(parametros.get('anio'));
const pide = {
    modo: MODOS[parametros.get('modo')] ? parametros.get('modo') : 'flash', adentro: false, desarme: 0, noche: parametros.get('noche') === '1',
    tempYac: DEF.tempYac, pSep: DEF.pSep, pSeco: DEF.pSeco, tempBin: DEF.tempBin, reinyecta: BASE.rMax, anio: Number.isFinite(anioPedido) && parametros.has('anio') ? anioPedido : 0, corre: !parametros.has('anio'),
};
const ve = { adentro: 0, desarme: 0, noche: pide.noche ? 1 : 0, partes: Object.fromEntries(PARTES.map(p => [p, 0])) };
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
    const [Lx, Lz, alto] = [12.3, 7.9, 8.2];
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
        b.hidden = pide.modo !== 'anios';
        b.innerHTML = `${svgIcono(pide.corre ? ICONOS.pausa : ICONOS.seguir)}<span>${pide.corre ? 'Pausar los años' : 'Seguir los años'}</span>`;
    });
}
function cambiarModo(m) {
    if (pide.modo === m) return;
    if (m === 'anios') { pide.anio = 0; pide.corre = !REDUCIR; }
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
        ? 'Toca cualquier punto para volver a verlo. Mueve la presión del separador y mira cómo cambia la potencia, o elige «A 30 años» para ver qué pasa si el agua no regresa al subsuelo.'
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
    rotular();
}
ficha.querySelector('[data-cerrar]').addEventListener('click', () => { pararRecorrido(); cerrarFicha(); });
ficha.querySelector('[data-saltar]').addEventListener('click', () => { pararRecorrido(); pide.adentro = false; pide.noche = false; cambiarModo('flash'); elegir(FINAL); });
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
relojes.forEach(b => b.addEventListener('click', () => { pararRecorrido(); pide.corre = !pide.corre; if (pide.corre && pide.anio >= 29.99) pide.anio = 0; rotular(); }));
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
const rMaxActual = () => flash({ tempYac: pide.tempYac, pSep: pide.pSep }).rMax;
mandos.forEach(d => d.addEventListener('input', () => {
    pararRecorrido();
    const k = Number(d.value) / 100;
    if (pide.modo === 'flash') pide.pSep = deRango(LIMITES.pSep, k);
    if (pide.modo === 'seco') pide.pSeco = deRango(LIMITES.pSeco, k);
    if (pide.modo === 'binario') pide.tempBin = deRango(LIMITES.tempBin, k);
    if (pide.modo === 'anios') pide.reinyecta = k * rMaxActual();
    ponerMando();
    ultimoTablero = 0;
}));
mandos2.forEach(d => d.addEventListener('input', () => {
    pararRecorrido();
    const k = Number(d.value) / 100;
    if (pide.modo === 'flash') pide.tempYac = deRango(LIMITES.tempYac, k);
    if (pide.modo === 'anios') { pide.anio = k * 30; pide.corre = false; rotular(); }
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
    colores = { tinta: v('--tinta'), suave: v('--tinta-suave'), linea: v('--linea'), superficie: v('--ceniza'), fondoPanel: v('--papel-alto'), guinda: v('--rojo'), caliente: FLUIDOS.caliente.color, vapor: FLUIDOS.vapor.color, separada: FLUIDOS.separada.color, regresa: FLUIDOS.regresa.color, isopentano: FLUIDOS.isopentano.color };
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
function pintarGraficas() {
    const m = pide.modo;
    const L = calcular(pide);
    if (m === 'flash') {
        const op = pSepOptimo(pide.tempYac);
        const f = p => flash({ tempYac: pide.tempYac, pSep: p }).neta;
        const yMax = Math.max(10, Math.ceil((f(op) * 1.2) / 10) * 10);
        $('#h-b-t').textContent = 'Potencia según la presión del separador';
        $('#h-b-ley').textContent = '';
        $('#h-b-pie').textContent = `Con poca presión sale mucho vapor, pero débil; con mucha, poco vapor pero fuerte. El mejor punto para ${num(pide.tempYac)} °C está cerca de ${num(op, 1)} bar.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Potencia según la presión del separador', xMin: LIMITES.pSep[0], xMax: LIMITES.pSep[1], yMin: 0, yMax, ticksX: [5, 10, 15, 20, 25], ticksY: [0, yMax / 2, yMax], etX: 'Presión del separador (bar)', etY: 'Potencia a la red (MW)', f, fx: x => num(x), fy: y => num(y), punta: x => `${num(x, 1)} bar · ${num(f(x), 1)} MW` });
        graficas.b.marcar(pide.pSep, f(pide.pSep));
        $('#h-tabla-b').innerHTML = tablaHTML(['bar', '°C', 'Vapor %', 't/h de vapor', 'MW a la red'], [2, 4, 6, 8, 12, 16, 20].map(p => { const q = flash({ tempYac: pide.tempYac, pSep: p }); return [num(p), num(q.Ts), num(q.x * 100), num(q.mv * 3.6), num(q.neta, 1)]; }));
    } else if (m === 'seco') {
        const f = p => seco({ pSeco: p }).neta;
        $('#h-b-t').textContent = 'Potencia según la presión a la turbina';
        $('#h-b-ley').textContent = '';
        $('#h-b-pie').textContent = 'Entre más presión se le pide al pozo, menos vapor entrega, pero cada kilo vale más. La curva del pozo es de ejemplo.';
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Potencia según la presión a la turbina', xMin: LIMITES.pSeco[0], xMax: LIMITES.pSeco[1], yMin: 0, yMax: 60, ticksX: [5, 10, 15, 20, 25], ticksY: [0, 20, 40, 60], etX: 'Presión a la turbina (bar)', etY: 'Potencia a la red (MW)', f, fx: x => num(x), fy: y => num(y), punta: x => `${num(x, 1)} bar · ${num(f(x), 1)} MW` });
        graficas.b.marcar(pide.pSeco, f(pide.pSeco));
        $('#h-tabla-b').innerHTML = tablaHTML(['bar', '°C', 't/h de vapor', 'MW a la red'], [2, 5, 8, 12, 16, 20, 25].map(p => { const q = seco({ pSeco: p }); return [num(p), num(q.Ts), num(q.mv * 3.6), num(q.neta, 1)]; }));
    } else if (m === 'binario') {
        const f = t => binario({ tempBin: t }).neta;
        $('#h-b-t').textContent = 'Potencia según la temperatura del agua';
        $('#h-b-ley').textContent = '';
        $('#h-b-pie').textContent = `Con la misma agua (${num(M_TOTAL * 3.6)} t/h), menos temperatura da mucho menos. Arriba de 182 °C suele convenir más el flasheo.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Potencia según la temperatura del agua', xMin: LIMITES.tempBin[0], xMax: LIMITES.tempBin[1], yMin: 0, yMax: 16, ticksX: [100, 125, 150, 175, 200], ticksY: [0, 4, 8, 12, 16], etX: 'Temperatura del agua (°C)', etY: 'Potencia a la red (MW)', f, fx: x => num(x), fy: y => num(y), refsX: [{ x: 182, texto: '182 °C' }], punta: x => `${num(x)} °C · ${num(f(x), 1)} MW` });
        graficas.b.marcar(pide.tempBin, f(pide.tempBin));
        $('#h-tabla-b').innerHTML = tablaHTML(['°C', 'Hierve a °C', 'Regresa a °C', 'MW a la red'], [100, 120, 140, 160, 180, 200].map(t => { const q = binario({ tempBin: t }); return [num(t), num(q.Te), num(q.Tout), num(q.neta, 1)]; }));
    } else {
        const R = Math.min(pide.reinyecta, rMaxActual());
        const rMax = rMaxActual();
        const fila = (r, x) => enAnio(x, r, pide.tempYac, pide.pSep);
        const series = [
            { clase: 'h-s-sin', nombre: 'Sin reinyección', f: x => fila(0, x).mw },
            { clase: 'h-s-max', nombre: 'Todo lo posible', f: x => fila(rMax, x).mw },
            { clase: 'h-s-actual', nombre: 'Con tu control', f: x => fila(R, x).mw },
        ];
        const yMax = Math.ceil((series[1].f(0) * 1.15) / 5) * 5;
        $('#h-b-t').textContent = 'Potencia a lo largo de 30 años';
        $('#h-b-ley').innerHTML = leyenda(series);
        $('#h-b-pie').textContent = `Sin reinyección, a 30 años queda en ${num((series[0].f(30) / series[0].f(0)) * 100)} %; regresando todo lo posible, en ${num((series[1].f(30) / series[1].f(0)) * 100)} %. Es un modelo sencillo para ver la tendencia.`;
        graficas.b = pintarGrafica($('#h-b-grafica'), { titulo: 'Potencia a lo largo de 30 años', xMin: 0, xMax: 30, yMin: 0, yMax, ticksX: [0, 10, 20, 30], ticksY: [0, yMax / 2, yMax], etX: 'Años de operación', etY: 'Potencia a la red (MW)', lineas: series, fx: x => `${x}`, fy: y => num(y), punta: x => `Año ${num(x)} · sin: ${num(series[0].f(x), 1)} · todo: ${num(series[1].f(x), 1)} · tuyo: ${num(series[2].f(x), 1)} MW` });
        $('#h-tabla-b').innerHTML = tablaHTML(['Año', 'Sin reinyección (MW)', 'Todo lo posible (MW)', 'Con tu control (MW)'], [0, 5, 10, 15, 20, 25, 30].map(a => [num(a), num(series[0].f(a), 1), num(series[1].f(a), 1), num(series[2].f(a), 1)]));
        const pres = [
            { clase: 'h-s-sin', nombre: 'Sin reinyección', f: x => fila(0, x).dp },
            { clase: 'h-s-max', nombre: 'Todo lo posible', f: x => fila(rMax, x).dp },
            { clase: 'h-s-actual', nombre: 'Con tu control', f: x => fila(R, x).dp },
        ];
        $('#h-c-t').textContent = 'Cuánta presión pierde el yacimiento';
        $('#h-c-ley').innerHTML = leyenda(pres);
        $('#h-c-pie').textContent = `Cuando sube tanta agua como entra, la presión se estabiliza. Con reinyección, además, el agua fría enfría poco a poco el yacimiento: unos ${num(pide.tempYac - fila(rMax, 30).T)} °C en 30 años, en este modelo.`;
        graficas.c = pintarGrafica($('#h-c-grafica'), { titulo: 'Cuánta presión pierde el yacimiento', xMin: 0, xMax: 30, yMin: 0, yMax: 25, ticksX: [0, 10, 20, 30], ticksY: [0, 5, 10, 15, 20, 25], etX: 'Años de operación', etY: 'Presión perdida (bar)', lineas: pres, fx: x => `${x}`, fy: y => num(y), punta: x => `Año ${num(x)} · sin: ${num(pres[0].f(x), 1)} · todo: ${num(pres[1].f(x), 1)} · tuyo: ${num(pres[2].f(x), 1)} bar` });
        $('#h-tabla-c').innerHTML = tablaHTML(['Año', 'Sin reinyección (bar)', 'Todo lo posible (bar)', 'Con tu control (bar)'], [0, 5, 10, 15, 20, 25, 30].map(a => [num(a), num(pres[0].f(a), 1), num(pres[1].f(a), 1), num(pres[2].f(a), 1)]));
    }
    if (m !== 'anios') {
        const c = pintarTS($('#h-c-grafica'), L);
        graficas.c = null;
        const esAgua = c.tabla === AGUA;
        $('#h-c-t').textContent = esAgua ? 'El ciclo, en un mapa del agua' : 'El ciclo, en un mapa del isopentano';
        $('#h-c-ley').textContent = '';
        $('#h-c-pie').textContent = esAgua
            ? 'Bajo la campana hay agua y vapor mezclados. A la izquierda es solo líquido; a la derecha, solo vapor. Pasa el dedo por los puntos.'
            : 'Bajo la campana, el isopentano hierve. Su campana se inclina al revés que la del agua: sale seco de la turbina y no moja los álabes.';
        $('#h-tabla-c').innerHTML = tablaHTML(['Punto', '°C', 'bar', 'kJ/kg'], c.puntos.map(p => [`${p.n}. ${p.nombre}`, num(p.T), num(p.P, p.P < 1 ? 2 : 1), num(p.h)]));
    }
    pintarBarras(L);
}
function pintarBarras(L) {
    let filas;
    if (L.anios) {
        const a = L.anios;
        const ev = 1 - a.rMax;
        filas = [{ t: 'Se evapora en la torre', v: ev }, { t: 'Regresa al subsuelo', v: a.R, activa: true }, { t: 'Se queda en la laguna', v: Math.max(0, a.rMax - a.R) }];
        $('#h-d-t').textContent = 'A dónde va cada 100 kilos de agua';
        $('#h-d-pie').textContent = 'Lo que se evapora en la torre ya no regresa: por eso no se puede reinyectar todo. La Ley de Geotermia pide regresar el agua para cuidar el yacimiento (art. 29).';
    } else {
        const r = (L.flash || L.seco || L.binario).reparto;
        filas = [{ t: 'Se vuelve electricidad', v: r.electricidad, activa: true }, { t: L.binario ? 'Se va al aire' : 'Se va en la torre', v: r.torre }, { t: 'Regresa en el agua', v: r.regresa }];
        $('#h-d-t').textContent = 'A dónde va cada 100 de calor';
        $('#h-d-pie').textContent = 'Medido contra regresar el agua a 50 °C. Es poco porque el calor es de baja temperatura, comparado con una flama, pero no cuesta combustible.';
    }
    $('#h-barras').innerHTML = filas.map(f => `<div class="h-barra-f${f.activa ? ' es-activa' : ''}" title="${f.t}: ${num(f.v * 100)} de cada 100"><span>${f.t}</span><i><u style="width:${clamp01(f.v) * 100}%"></u></i><b>${num(f.v * 100)}</b></div>`).join('');
}
function pintarFijas() {
    const fs = flash();
    const fb = binario();
    const fv = seco();
    const porCien = (mw, m) => num((mw / (m * 3.6)) * 100, 1);
    $('#h-comparar').innerHTML = tablaHTML(['', 'A la turbina', 'Temperatura', 'MW por 100 t/h que suben'], [
        ['Vapor seco', 'Vapor del pozo', 'Pozo solo con vapor', porCien(fv.neta, fv.mv)],
        ['Flasheo', 'Vapor que se separa', 'Más de 182 °C', porCien(fs.neta, fs.m)],
        ['Binaria', 'Isopentano', 'Menos de 182 °C', porCien(fb.neta, fb.m)],
    ]);
    const maxMw = Math.max(...MEXICO.map(c => c.mw));
    $('#h-mexico').innerHTML = `<thead><tr><th scope="col">Campo</th><th scope="col" class="h-col-barra">MW</th><th scope="col">GWh</th><th scope="col">Trabajó al</th></tr></thead><tbody>${MEXICO.map(c => `<tr><td><b>${c.campo}</b><small>${c.estado}</small></td><td class="h-col-barra"><span class="h-celda-barra"><u style="width:${(c.mw / maxMw) * 100}%"></u><em>${num(c.mw, c.mw % 1 ? 1 : 0)}</em></span></td><td>${num(c.gwh)}</td><td>${c.factor ? `${num(c.factor)} %` : 's. d.'}</td></tr>`).join('')}</tbody>`;
}
const ACLARA = {
    flash: 'El agua del pozo entra por un lado. Aquí, al bajar la presión, una parte se vuelve vapor; el vapor sube y el agua baja.',
    seco: 'En un campo de vapor seco no hay agua que separar. El vapor pierde presión y temperatura al pasar por los álabes.',
    binario: 'El agua caliente y el isopentano corren en sentidos contrarios, separados por una pared: pasa el calor, no el líquido.',
    anios: 'El yacimiento es como un tanque: lo baja lo que se saca y lo sube lo que regresa, más la recarga natural de la lluvia y los acuíferos.',
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
    const v1 = m === 'flash' ? aRango(LIMITES.pSep, pide.pSep) : m === 'seco' ? aRango(LIMITES.pSeco, pide.pSeco) : m === 'binario' ? aRango(LIMITES.tempBin, pide.tempBin) : (Math.min(pide.reinyecta, rMaxActual()) / rMaxActual()) * 100;
    const v2 = m === 'flash' ? aRango(LIMITES.tempYac, pide.tempYac) : (pide.anio / 30) * 100;
    mandos.forEach(d => { if (document.activeElement !== d) d.value = String(v1); });
    mandos2.forEach(d => { if (document.activeElement !== d || m === 'anios') d.value = String(v2); });
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
    const firma = JSON.stringify([pide.modo, pide.tempYac, pide.pSep, pide.pSeco, pide.tempBin, pide.reinyecta]);
    if (firma !== firmaTablero) { firmaTablero = firma; pintarGraficas(); }
    if (L.flash) {
        const f = L.flash;
        ponerCifra('mandoValor', `${num(f.pSep, 1)} bar · ${num(f.Ts)} °C`);
        ponerCifra('mando2Valor', `${num(f.tempYac)} °C`);
        const aviso = f.x <= 0.002 ? 'El separador está tan caliente como el pozo: ya no sale vapor.' : f.x < 0.08 ? 'Sale muy poco vapor: con agua así conviene una planta binaria.' : null;
        ponerLecturas([['A la red', num(f.neta, 1), 'MW'], ['Vapor', num(f.mv * 3.6), 't/h'], ['Se vuelve vapor', num(f.x * 100, 1), '% del agua'], ['Gasta', num(f.consumo, 1), 't de vapor por MWh'], ['Regresa', num(f.regresa * 3.6), 't/h al subsuelo'], ['Aprovecha', num(f.eficiencia * 100, 1), '% del calor']], aviso);
        ponerCifra('hud', `${num(f.neta, 1)} MW`);
        ponerCifra('hud2', 'a la red, de día y de noche');
        graficas.b?.marcar(f.pSep, f.neta);
        nivel(1, 'Vapor', f.x / 0.5, `${num(f.x * 100)} %`);
        nivel(2, 'Regresa', f.rMax, `${num(f.rMax * 100)} %`);
    } else if (L.seco) {
        const f = L.seco;
        ponerCifra('mandoValor', `${num(f.pSeco, 1)} bar · ${num(f.Ts)} °C`);
        ponerLecturas([['A la red', num(f.neta, 1), 'MW'], ['Vapor', num(f.mv * 3.6), 't/h'], ['Se vuelve vapor', '100', '% del fluido'], ['Gasta', num(f.consumo, 1), 't de vapor por MWh'], ['Regresa', num(f.regresa * 3.6), 't/h al subsuelo'], ['Aprovecha', num(f.eficiencia * 100, 1), '% del calor']], null);
        ponerCifra('hud', `${num(f.neta, 1)} MW`);
        ponerCifra('hud2', 'a la red, con vapor seco');
        graficas.b?.marcar(f.pSeco, f.neta);
        nivel(1, 'Vapor', 1, '100 %');
        nivel(2, 'Regresa', f.rMax, `${num(f.rMax * 100)} %`);
    } else if (L.binario) {
        const f = L.binario;
        ponerCifra('mandoValor', `${num(f.tempBin)} °C`);
        const aviso = f.tempBin > 182 ? 'Arriba de 182 °C ya conviene el flasheo.' : null;
        ponerLecturas([['A la red', num(f.neta, 1), 'MW'], ['Agua caliente', num(f.m * 3.6), 't/h'], ['Isopentano', num(f.mf * 3.6), 't/h, en circuito'], ['Hierve a', num(f.Te), '°C'], ['Regresa a', num(f.Tout), '°C'], ['Aprovecha', num(f.eficiencia * 100, 1), '% del calor']], aviso);
        ponerCifra('hud', `${num(f.neta, 1)} MW`);
        ponerCifra('hud2', 'a la red, con ciclo binario');
        graficas.b?.marcar(f.tempBin, f.neta);
        nivel(1, 'Isopentano', f.mf / 400, `${num(f.mf * 3.6)} t/h`);
        nivel(2, 'Regresa', 1, '100 %');
    } else {
        const a = L.anios;
        ponerCifra('mandoValor', `${num(a.R * 100)} % del agua`);
        ponerCifra('mando2Valor', `Año ${num(a.anio)}`);
        const aviso = a.R < 0.2 ? 'Casi nada regresa: la presión cae rápido y sobra agua caliente que hay que tratar.' : null;
        ponerLecturas([['A la red', num(a.mw, 1), 'MW'], ['Sube', num(a.m * 3.6), 't/h'], ['Regresa', num(a.regresa * 3.6), 't/h'], ['Presión perdida', num(a.dp, 1), 'bar'], ['Yacimiento', num(a.T), '°C'], ['Vapor', num(a.mv * 3.6), 't/h']], aviso);
        ponerCifra('hud', `${num(a.mw, 1)} MW`);
        ponerCifra('hud2', `en el año ${num(a.anio)}, regresando ${num(a.R * 100)} %`);
        graficas.b?.ahora(a.anio);
        graficas.c?.ahora(a.anio);
        nivel(1, 'Presión', 1 - a.dp / 25, `−${num(a.dp, 1)} bar`);
        nivel(2, 'Regresa', a.R, `${num(a.R * 100)} %`);
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
    if (pide.modo === 'anios' && pide.corre && (enPantalla || tableroEnPantalla)) {
        pide.anio = Math.min(30, pide.anio + ANIOS_POR_SEGUNDO * dt);
        if (pide.anio >= 30) { pide.corre = false; rotular(); }
        ponerMando();
    }
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
    miraV.set(0, -1.02 - 0.5 * sale(ve.desarme), -0.05);

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
                cambiarModo('flash');
                elegir(FINAL, { solo: true });
                pararRecorrido();
            } else elegir(elegida + 1, { solo: true });
        }
    }

    const e = pose({
        modo: pide.modo, tempYac: pide.tempYac, pSep: pide.pSep, pSeco: pide.pSeco, tempBin: pide.tempBin, reinyecta: pide.reinyecta, anio: pide.anio, noche: ve.noche, adentro: ve.adentro, desarme: ve.desarme, encendido, t, dt,
        camara: { mira: miraV.toArray(), az, el, d },
    });
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
window.__PLANTA = () => ({ modo: pide.modo, adentro: +ve.adentro.toFixed(2), desarme: +ve.desarme.toFixed(2), noche: +ve.noche.toFixed(2), anio: +pide.anio.toFixed(1), elegida, parte: PARTES[elegida] ?? null, recorrido: auto.on, az: +camara.az.toFixed(1), k: +camara.k.toFixed(2) });
window.__PUNTO = parte => { planta.anclas[parte].getWorldPosition(centro); const r = escena.getBoundingClientRect(); return pantalla(centro).map((c, i) => Math.round(c + (i ? r.top : r.left))); };
window.__MOVER = (o = {}) => { Object.assign(pide, o); if (o.camara) Object.assign(camara, o.camara, { auto: false }); firmaTablero = ''; ultimoTablero = 0; rotular(); if (o.modo) pintarTablero(); };
requestAnimationFrame(cuadro);
