// La guía del Buscador Jurídico: el búho biomecánico con su menú. Se muestra de dos maneras, las dos dentro de un iframe:
//   ?modo=guia     a pantalla completa, sobre el mapa (src/scripts/site-intro.js)
//   ?modo=portada  en la portada, abajo (src/scripts/landing-owl.js): no se apodera del desplazamiento ni arranca solo, y no
//                  lleva menú propio: usa el menú principal del sitio
// Otros parámetros: ?tema=claro|oscuro · ?vidrio=azul|verde|ambar|guinda · ?recorrido=no
//
// Se arma con: node scripts/build-buho-bio.mjs → public/intro/buho-bio.html
// Mensajes con el sitio (postMessage, mismo origen):
//   → buho-listo                     ya dibujó el primer cuadro
//   → buho-ir { seccion, ojo:[x,y] } eligieron una sección (ojo: dónde está, en px, para abrir el iris)
//   → buho-entrar { ojo:[x,y] }      «Cerrar guía» o Escape
//   → buho-error                     no hay WebGL: el sitio deja lo que tenía
//   → buho-parte { seccion }         en la portada: qué sección señalar en el menú del sitio (null: ninguna)
//   ← buho-visible { visible }       fuera de la vista no se dibuja
//   ← buho-tema { tema }             cambió el tema del sitio
//   ← buho-elegir { seccion }        en la portada: el cursor pasó por esa sección en el menú del sitio
import { montar, PARTES } from '../motor.js';
import { VIDRIOS_BUHO, elegirVidrioDelBuho } from '../../src/lib/buho-vidrio.js';

const parametros = new URLSearchParams(location.search);
const MODO = parametros.get('modo') || 'guia';
const PORTADA = MODO === 'portada';
const GUIA = !PORTADA;
const EN_SITIO = parent !== window;
const CON_RECORRIDO = GUIA && parametros.get('recorrido') !== 'no';
const vidrioPedido = parametros.get('vidrio');
let vidrio = VIDRIOS_BUHO.includes(vidrioPedido) ? vidrioPedido : 'azul';
let oscuro = parametros.get('tema') ? parametros.get('tema') === 'oscuro' : matchMedia('(prefers-color-scheme: dark)').matches;

const avisar = (type, extra = {}) => { if (EN_SITIO) parent.postMessage({ type, ...extra }, location.origin); };

const SITIO = {
    Buscar: ['buscar', '/#buscar'], Acervo: ['acervo', '/#acervo'], 'Cronología': ['cronologia', '/#cronologia'],
    Permisos: ['permisos', '/#permisos'], Polos: ['polos', '/#polos'], 'Análisis': ['analisis', '/'], Aprende: ['aprende', '/#como-funciona'],
};
// en el orden de PARTES; los iconos son los del menú del sitio (index.html)
const FICHAS = [
    { nombre: 'Buscar', icono: 'M17.6 10.8a6.8 6.8 0 1 1-13.6 0 6.8 6.8 0 0 1 13.6 0Z M16 16l4.5 4.5', texto: 'Escribe una palabra y encuéntrala en el texto de todos los documentos. Ves los resultados en lista o en un mapa de relaciones.' },
    { nombre: 'Acervo', icono: 'M4.5 3h4A1.5 1.5 0 0 1 10 4.5v4A1.5 1.5 0 0 1 8.5 10h-4A1.5 1.5 0 0 1 3 8.5v-4A1.5 1.5 0 0 1 4.5 3Z M15.5 3h4A1.5 1.5 0 0 1 21 4.5v4a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 14 8.5v-4A1.5 1.5 0 0 1 15.5 3Z M4.5 14h4a1.5 1.5 0 0 1 1.5 1.5v4A1.5 1.5 0 0 1 8.5 21h-4A1.5 1.5 0 0 1 3 19.5v-4A1.5 1.5 0 0 1 4.5 14Z M15.5 14h4a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a1.5 1.5 0 0 1-1.5-1.5v-4a1.5 1.5 0 0 1 1.5-1.5Z', texto: 'Todos los documentos, por tipo y por dependencia. Abre cualquiera para leerlo por artículos o como libro.' },
    { nombre: 'Cronología', icono: 'M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0Z M12 7.5V12l3 2', texto: 'Cuándo salió cada ley, reglamento o acuerdo, y cómo han cambiado con el tiempo: una vértebra tras otra, como su columna.' },
    { nombre: 'Permisos', icono: 'M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z M14 3v5h5 M14.6 14a2.6 2.6 0 1 1-5.2 0 2.6 2.6 0 0 1 5.2 0Z M10.6 16.2l-.9 3.3 2.3-1.1 2.3 1.1-.9-3.3', texto: 'Los permisos de energía que otorgan la CNE y la SENER: quién los tiene, de qué tipo y dónde.' },
    { nombre: 'Polos', icono: 'M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z M14.4 10a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0Z', texto: 'Los polos de desarrollo del país: dónde están en el mapa y qué se planea en cada uno.' },
    { nombre: 'Análisis', icono: 'M8.5 6a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z M20.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z M12.5 18a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z M8.4 6.4l7.2 1.2 M6.9 8.4l2.2 7.2 M16.6 10.1l-5 6', texto: 'Los temas que cruzan varias leyes y los términos clave: dónde se usan y cómo se conectan.' },
    { nombre: 'Aprende', icono: 'M12 6.5C10 5 7 4.5 4 5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5Z M12 6.5V20', texto: 'Cómo funcionan una planta solar, un transformador o una refinería, en modelos 3D que puedes girar y desarmar.' },
];
const ICONO_TOCAR = 'M9 11V5.5a1.5 1.5 0 0 1 3 0V10 M12 9.5a1.5 1.5 0 0 1 3 0V11 M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.6-2.2L4.4 15.6a1.5 1.5 0 0 1 2.3-1.9L9 16';
const MUESTRAS = { azul: ['Vidrio azul', '#2e6fb0'], verde: ['Vidrio verde', '#0e8a6e'], ambar: ['Vidrio ámbar', '#e8860f'], guinda: ['Vidrio guinda', '#9b2247'] };
const FINAL = FICHAS.length;

const trazo = (d, tam) => `<svg viewBox="0 0 24 24" width="${tam}" height="${tam}" aria-hidden="true"><path class="bb-trazo" d="${d}"></path></svg>`;

const app = document.getElementById('app');
app.className = `bb-raiz ${PORTADA ? 'bb-portada' : 'bb-guia'}`;
app.innerHTML = `
    <canvas class="bb-lienzo" aria-label="Búho biomecánico en 3D: arrástralo para girarlo y toca una parte para saber a qué sección lleva"></canvas>
    <svg class="bb-senal" aria-hidden="true"><line></line><circle r="4"></circle></svg>
    ${GUIA ? `<header class="bb-titulo bb-cristal">
        <p class="bb-kicker">Buscador Jurídico</p>
        <h1>Guía <span>rápida</span></h1>
        <p class="bb-pista">Toca una parte o elige una sección.</p>
    </header>` : ''}
    ${GUIA ? `<nav class="bb-secs bb-cristal" aria-label="Secciones del sitio">
        ${FICHAS.map((f, i) => `<button type="button" class="bb-sec" data-i="${i}" aria-pressed="false">${f.nombre}</button>`).join('')}
    </nav>` : ''}
    <div class="bb-barra bb-fuerte" role="toolbar" aria-label="Controles del búho">
        <button type="button" class="bb-chip" data-recorrido aria-pressed="false">Recorrido</button>
        <button type="button" class="bb-chip" data-alas aria-pressed="false">Abrir alas</button>
        <button type="button" class="bb-chip" data-dentro aria-pressed="false">Por dentro</button>
        <button type="button" class="bb-chip" data-desarme aria-pressed="false">Desarmar</button>
        <button type="button" class="bb-chip" data-mirar>Girar cabeza</button>
        <div class="bb-colores" role="group" aria-label="Color del vidrio">
            ${VIDRIOS_BUHO.map(v => `<button type="button" class="bb-color" data-vidrio="${v}" aria-label="${MUESTRAS[v][0]}" title="${MUESTRAS[v][0]}" aria-pressed="${v === vidrio}"><span style="background-color:${MUESTRAS[v][1]}"></span></button>`).join('')}
        </div>
    </div>
    ${GUIA ? '<button type="button" class="bb-salir" data-entrar>Cerrar guía</button>' : ''}
    <section class="bb-ficha bb-fuerte" aria-live="polite" aria-labelledby="bb-ficha-t" hidden>
        <div class="bb-ficha-cab">
            <p class="bb-paso"></p>
            <button type="button" class="bb-x" data-cerrar aria-label="Cerrar">${trazo('M6 6l12 12M18 6L6 18', 18)}</button>
        </div>
        <span class="bb-avance" aria-hidden="true" hidden><i></i></span>
        <div class="bb-ficha-nombre"><span class="bb-ico"></span><h2 id="bb-ficha-t"></h2></div>
        <p class="bb-texto"></p>
        <div class="bb-ficha-pie">
            <button type="button" class="bb-flecha" data-ant aria-label="Parte anterior">${trazo('M15 6l-6 6 6 6', 18)}</button>
            <button type="button" class="bb-flecha" data-sig aria-label="Parte siguiente">${trazo('M9 6l6 6-6 6', 18)}</button>
            <button type="button" class="bb-ir" data-ir></button>
        </div>
        <button type="button" class="bb-saltar" data-saltar hidden>Saltar recorrido</button>
    </section>`;

const $ = s => app.querySelector(s);
const lienzo = $('.bb-lienzo');
const ficha = $('.bb-ficha');
const secciones = [...app.querySelectorAll('.bb-sec')];
const ponerTema = () => { app.classList.toggle('bb-noche', oscuro); app.classList.toggle('bb-dia', !oscuro); };
ponerTema();

let elegida = -1;
let enRecorrido = false;
const estado = { alas: false, dentro: false, desarme: false };

function salir(type, extra = {}) {
    const ojo = api.punto('ojos');
    if (EN_SITIO) avisar(type, { ...extra, ojo });
    else location.href = extra.destino || '/';
}
function mostrarFicha(i) {
    elegida = i;
    secciones.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    app.classList.toggle('bb-con-ficha', i >= 0);
    if (PORTADA) avisar('buho-parte', { seccion: i >= 0 && i < FINAL ? SITIO[FICHAS[i].nombre][0] : null });
    ficha.hidden = i < 0;
    if (i < 0) return;
    const final = i >= FINAL;
    const f = FICHAS[i];
    $('.bb-paso').textContent = final ? 'Listo' : `${i + 1} de ${FICHAS.length}`;
    $('.bb-ico').innerHTML = trazo(final ? ICONO_TOCAR : f.icono, 22);
    $('#bb-ficha-t').textContent = final ? '¿Alguna no quedó clara?' : f.nombre;
    $('.bb-texto').textContent = final ? 'Toca esa parte del búho y te la vuelve a explicar. También puedes elegir una sección.' : f.texto;
    $('[data-ir]').textContent = final ? (GUIA ? 'Cerrar guía' : 'Ver otra vez') : `Ir a ${f.nombre}`;
}
function ponerRecorrido(si) {
    enRecorrido = si;
    $('[data-recorrido]').setAttribute('aria-pressed', String(si));
    $('.bb-avance').hidden = !si;
    $('[data-saltar]').hidden = !si;
}

// lo que ocupan los controles abajo; con la ficha abierta en celular se esconden, y entonces se conserva lo último medido
let reserva = 0;
function medirReserva() {
    const caja = app.getBoundingClientRect();
    const tope = [$('.bb-barra'), $('.bb-secs')].filter(Boolean)
        .map(el => el.getBoundingClientRect())
        .filter(r => r.height > 0 && r.width > caja.width * 0.5)
        .reduce((m, r) => Math.min(m, r.top - caja.top), caja.height);
    if (tope < caja.height) reserva = caja.height - tope + 8;
}
new ResizeObserver(medirReserva).observe(app);
medirReserva();

const api = montar(lienzo, {
    reservaAbajo: () => reserva,
    noche: oscuro,
    vidrio,
    recorrido: CON_RECORRIDO,
    incrustado: PORTADA,
    alListo: () => { window.__LISTO = true; avisar('buho-listo'); },
    alError: () => avisar('buho-error'),
    alElegir: mostrarFicha,
    alRecorrido: ponerRecorrido,
});
api.enlazar({ ficha, linea: $('.bb-senal line'), punto: $('.bb-senal circle'), barra: $('.bb-avance i') });
window.__API = api;
window.__PUNTO = parte => api.punto(parte);

function ir(i) {
    const [seccion, destino] = SITIO[FICHAS[i].nombre];
    salir('buho-ir', { seccion, destino });
}
app.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.i !== undefined) { api.elegir(Number(b.dataset.i)); return; }
    if (b.dataset.vidrio) {
        vidrio = b.dataset.vidrio;
        api.vidrio(vidrio);
        elegirVidrioDelBuho(vidrio);
        app.querySelectorAll('[data-vidrio]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        return;
    }
    if ('recorrido' in b.dataset) { if (enRecorrido) api.parar(); else api.recorrido(); return; }
    if ('alas' in b.dataset) {
        estado.alas = !estado.alas;
        api.alas(estado.alas);
        b.setAttribute('aria-pressed', String(estado.alas));
        b.textContent = estado.alas ? 'Cerrar alas' : 'Abrir alas';
        return;
    }
    if ('dentro' in b.dataset) {
        estado.dentro = !estado.dentro;
        estado.desarme = false;
        api.adentro(estado.dentro);
        b.setAttribute('aria-pressed', String(estado.dentro));
        $('[data-desarme]').setAttribute('aria-pressed', 'false');
        $('[data-desarme]').textContent = 'Desarmar';
        return;
    }
    if ('desarme' in b.dataset) {
        estado.desarme = !estado.desarme;
        estado.dentro = false;
        api.desarme(estado.desarme);
        b.setAttribute('aria-pressed', String(estado.desarme));
        b.textContent = estado.desarme ? 'Armar' : 'Desarmar';
        $('[data-dentro]').setAttribute('aria-pressed', 'false');
        return;
    }
    if ('mirar' in b.dataset) { api.mirar(); return; }
    if ('entrar' in b.dataset) { salir('buho-entrar'); return; }
    if ('cerrar' in b.dataset) { api.cerrar(); return; }
    if ('ant' in b.dataset) { api.anterior(); return; }
    if ('sig' in b.dataset) { api.siguiente(); return; }
    if ('saltar' in b.dataset) { api.parar(); return; }
    if ('ir' in b.dataset) {
        if (elegida < FINAL) ir(elegida);
        else if (GUIA) salir('buho-entrar');
        else api.recorrido();
    }
});
addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (elegida >= 0) api.cerrar(); else if (GUIA) salir('buho-entrar'); }
    if (elegida >= 0 && e.key === 'ArrowRight') api.siguiente();
    if (elegida >= 0 && e.key === 'ArrowLeft') api.anterior();
});
addEventListener('message', e => {
    if (e.source !== parent || e.origin !== location.origin) return;
    const { type, visible, tema, seccion } = e.data || {};
    if (type === 'buho-elegir') {
        const i = FICHAS.findIndex(f => SITIO[f.nombre][0] === seccion);
        if (i >= 0 && i !== elegida) api.elegir(i);
    }
    if (type === 'buho-visible') api.pausar(!visible);
    if (type === 'buho-tema') { oscuro = tema === 'oscuro'; ponerTema(); api.noche(oscuro); }
});
