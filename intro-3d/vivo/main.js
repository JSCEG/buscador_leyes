// La entrada viva del Buscador Jurídico: el búho mecánico en tiempo real. Al cargar se enciende, abre las alas y saca
// del pecho las secciones del sitio; cada sección es un botón que lleva a ella. Se puede girar arrastrando, acercar con
// la rueda o pellizcando, abrir y cerrar las alas, desarmarlo y armarlo.
//
// Es el mismo búho del video (../buho.js, ../modelo.js): aquí las entradas (alas, desarme, menú) vienen de los botones y
// se suavizan en el tiempo, en vez de salir de estado(t).
//
// Se arma con: node scripts/build-intro-3d.mjs  → public/intro/buho.html (?tema=claro|oscuro)
// Mensajes con el sitio (postMessage, mismo origen):
//   → buho-listo                     ya dibujó el primer cuadro
//   → buho-ir { seccion, ojo:[x,y] } eligieron una sección (ojo: dónde está el ojo, en px, para abrir el iris)
//   → buho-entrar { ojo:[x,y] }      «Entrar al sitio» o Escape
//   → buho-error                     no hay WebGL: el sitio usa la imagen del emblema
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SECCIONES, MODULO, ENGRANE, OJO, pose, posicionCamara } from '../modelo.js';
import { materiales, construirBuho, construirModulo } from '../buho.js';

const D2R = Math.PI / 180;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const clamp01 = x => clamp(x, 0, 1);
const sale = x => 1 - (1 - clamp01(x)) ** 3;
const suave = x => { const k = clamp01(x); return k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2; };

const parametros = new URLSearchParams(location.search);
const OSCURO = parametros.get('tema') ? parametros.get('tema') === 'oscuro' : matchMedia('(prefers-color-scheme: dark)').matches;
const REDUCIR = matchMedia('(prefers-reduced-motion: reduce)').matches;
const EN_SITIO = parent !== window;
document.documentElement.dataset.tema = OSCURO ? 'oscuro' : 'claro';

// Las secciones: el id que entiende el sitio y a dónde ir si la página se abre sola.
const DESTINOS = {
    Buscar: ['buscar', '/#buscar'], Acervo: ['acervo', '/#acervo'], 'Cronología': ['cronologia', '/#cronologia'],
    Permisos: ['permisos', '/#permisos'], Polos: ['polos', '/#polos'], 'Análisis': ['analisis', '/'], Aprende: ['aprende', '/#como-funciona'],
};

const P = {
    fondo: '#faf8f5', tinta: '#171317', suave: '#5b5e63', rosa: '#e57a9a', guinda: '#9b2247',
    ceramica: '#f4f1ec', marfil: '#eee7dc', grafito: '#303137', acero: '#a7abb3',
};

function avisar(type, extra = {}) {
    if (EN_SITIO) parent.postMessage({ type, ...extra }, location.origin);
}

// ------------------------------------------------------------------ la página
const app = document.getElementById('app');
app.innerHTML = `
    <canvas class="b-lienzo" aria-hidden="true"></canvas>
    <svg class="b-guias" aria-hidden="true">${SECCIONES.map(() => '<line/>').join('')}</svg>
    <nav class="b-menu" aria-label="Secciones del sitio">
        ${SECCIONES.map((s, i) => `<button type="button" class="b-sec" data-i="${i}">${s}</button>`).join('')}
    </nav>
    <header class="b-titulo"><p class="b-nombre">Buscador Jurídico</p><span class="b-raya"></span><p class="b-sub">Elige una sección o explora al búho</p></header>
    <div class="b-barra" role="toolbar" aria-label="Controles del búho">
        <button type="button" class="b-chip" data-alas aria-pressed="true">Cerrar alas</button>
        <button type="button" class="b-chip" data-desarme aria-pressed="false">Desarmar</button>
        <button type="button" class="b-chip" data-girar aria-pressed="false">Girar</button>
        <button type="button" class="b-chip b-entrar" data-entrar>Entrar al sitio <span aria-hidden="true">→</span></button>
    </div>
    <p class="b-pista" aria-hidden="true">Arrastra para girarlo</p>`;
const lienzo = app.querySelector('.b-lienzo');
const botones = [...app.querySelectorAll('.b-sec')];
const guias = [...app.querySelectorAll('.b-guias line')];
const titulo = app.querySelector('.b-titulo');
const barra = app.querySelector('.b-barra');
const pista = app.querySelector('.b-pista');

// ------------------------------------------------------------------ escena
let renderer;
try {
    renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true });
} catch (err) {
    avisar('buho-error');
    throw err;
}
const MOVIL = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 600;
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 0.9;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 160);

const cielo = new THREE.HemisphereLight('#ffffff', OSCURO ? '#3a3438' : '#b9b6b0', 0.65);
const sol = new THREE.DirectionalLight('#ffffff', 1.85);
sol.position.set(-6, 5, 3.5);
sol.castShadow = true;
Object.assign(sol.shadow.camera, { left: -3.5, right: 3.5, top: 3, bottom: -3, near: 1, far: 20 });
sol.shadow.mapSize.set(MOVIL ? 1024 : 2048, MOVIL ? 1024 : 2048);
sol.shadow.bias = -0.0004;
sol.shadow.normalBias = 0.01;
const contraluz = new THREE.DirectionalLight('#ffffff', OSCURO ? 1.3 : 0.9);
contraluz.position.set(2, 3, -5);
const relleno = new THREE.DirectionalLight('#ffffff', 0.55);
relleno.position.set(4, 0, 6);
const brillo = new THREE.PointLight(P.rosa, 0.25, 1.4, 2);
brillo.position.set(OJO[0], OJO[1], OJO[2] + 0.35);
scene.add(cielo, sol, contraluz, relleno, brillo);

const textura = pintar => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    pintar(c.getContext('2d'));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
};
const radial = (paradas) => textura(x => {
    const g = x.createRadialGradient(128, 128, 4, 128, 128, 128);
    paradas.forEach(([k, c]) => g.addColorStop(k, c));
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 256);
});
const aura = new THREE.Sprite(new THREE.SpriteMaterial({
    map: radial(OSCURO ? [[0, 'rgba(229,122,154,0.16)'], [0.45, 'rgba(229,122,154,0.05)'], [1, 'rgba(229,122,154,0)']] : [[0, 'rgba(229,122,154,0.1)'], [0.45, 'rgba(229,122,154,0.035)'], [1, 'rgba(229,122,154,0)']]),
    transparent: true, depthWrite: false, toneMapped: false,
}));
aura.position.set(0, 0.25, -1.5);
aura.scale.setScalar(7.5);
scene.add(aura);
const piso = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({
    map: radial(OSCURO ? [[0, 'rgba(0,0,0,0.5)'], [0.5, 'rgba(0,0,0,0.2)'], [1, 'rgba(0,0,0,0)']] : [[0, 'rgba(40,30,34,0.34)'], [0.5, 'rgba(40,30,34,0.12)'], [1, 'rgba(40,30,34,0)']]),
    transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1,
}));
piso.scale.set(6, 1, 2);
piso.position.y = -1.86;
scene.add(piso);

const M = materiales(P);
const raiz = new THREE.Group();
scene.add(raiz);
const buho = construirBuho(M, P);
raiz.add(buho.raiz);
const modulos = await Promise.all(SECCIONES.map(s => construirModulo(M, P, s)));
modulos.forEach((m, i) => { m.grupo.userData.i = i; raiz.add(m.grupo); });
const COLOR = { cara: new THREE.Color(P.ceramica), acento: new THREE.Color(P.guinda), icono: new THREE.Color(P.grafito), blanco: new THREE.Color('#ffffff') };
const NUCLEO = new THREE.Vector3(...ENGRANE.centro);

// ------------------------------------------------------------------ acomodo: horizontal o vertical
// Horizontal: alas abiertas y las secciones en una sonrisa bajo las garras. Vertical (celular): alas a medias, para
// que el búho no quede diminuto, y las secciones en dos filas.
let acomodo = null;
function acomodar() {
    const vertical = innerWidth / innerHeight < 0.9;
    const destinos = vertical
        ? SECCIONES.map((_, i) => (i < 4 ? [-2.1 + 1.4 * i, -2.5, 0.9] : [-1.4 + 1.4 * (i - 4), -3.75, 0.9]))
        : SECCIONES.map((_, i) => { const x = -3.6 + 1.2 * i; return [x, -2.3 - 0.45 * Math.sqrt(Math.max(0, 1 - (x / 4.2) ** 2)), 0.9]; });
    // la caja que debe caber en pantalla (búho con las alas del acomodo, más las secciones con sus etiquetas)
    // abajo queda lugar para la barra de controles
    const caja = vertical ? { x: [-3.2, 3.2], y: [-4.75, 2.3] } : { x: [-4.9, 4.9], y: [-4.0, 2.9] };
    acomodo = { vertical, destinos, caja, alas: vertical ? 0.5 : 1 };
}

// ------------------------------------------------------------------ estado: lo que el visitante pide y lo que se ve
const pide = { alas: 1, desarme: 0, menu: 1, girar: false };
const ve = { alas: 0, desarme: 0, menu: 0, luz: 0, ojo: 0 };
const camara = { az: 0, el: 6, k: 1, vaz: 0, vel: 0, auto: true };
let hover = -1;
const acento = SECCIONES.map(() => 0);
const t0 = performance.now();
let entrada = REDUCIR ? 99 : 0; // segundos desde que empezó la entrada

function distanciaParaCaber() {
    const { caja } = acomodo;
    const ancho = caja.x[1] - caja.x[0];
    const alto = caja.y[1] - caja.y[0];
    const tv = Math.tan((camera.fov * D2R) / 2);
    const aspecto = innerWidth / innerHeight;
    // margen arriba para el título y abajo para la barra de controles
    return Math.max((alto * 1.22) / 2 / tv, (ancho * 1.08) / 2 / (tv * aspecto));
}
function mira() {
    const { caja } = acomodo;
    return [0, (caja.y[0] + caja.y[1]) / 2 - 0.12, 0];
}

// ------------------------------------------------------------------ entrada del usuario
const punteros = new Map();
let pinza = 0;
let movido = 0;
let ultimaMano = performance.now();
const tomar = () => { camara.auto = false; ultimaMano = performance.now(); pista.classList.add('is-oculta'); };
lienzo.addEventListener('pointerdown', e => {
    punteros.set(e.pointerId, [e.clientX, e.clientY]);
    lienzo.setPointerCapture(e.pointerId);
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
        if (pinza) camara.k = clamp(camara.k * (pinza / d), 0.55, 1.6);
        pinza = d;
        tomar();
        return;
    }
    const dx = e.clientX - x0;
    const dy = e.clientY - y0;
    movido += Math.abs(dx) + Math.abs(dy);
    if (movido < 4) return;
    tomar();
    camara.vaz = -dx * 0.35;
    camara.vel = dy * 0.22;
    camara.az += camara.vaz;
    camara.el = clamp(camara.el + camara.vel, -12, 40);
    lienzo.classList.add('arrastra');
});
const soltar = e => {
    const clic = punteros.has(e.pointerId) && movido < 4 && punteros.size === 1;
    punteros.delete(e.pointerId);
    pinza = 0;
    if (!punteros.size) lienzo.classList.remove('arrastra');
    if (clic) { const i = tocar(e.clientX, e.clientY); if (i >= 0) ir(i); }
};
lienzo.addEventListener('pointerup', soltar);
lienzo.addEventListener('pointercancel', e => { punteros.delete(e.pointerId); pinza = 0; lienzo.classList.remove('arrastra'); });
lienzo.addEventListener('pointerleave', () => { if (!punteros.size) hover = -1; });
lienzo.addEventListener('wheel', e => { e.preventDefault(); tomar(); camara.k = clamp(camara.k * Math.exp(e.deltaY * 0.0012), 0.55, 1.6); }, { passive: false });

const rayo = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function tocar(x, y) {
    if (ve.menu < 0.6) return -1;
    ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    rayo.setFromCamera(ndc, camera);
    const golpe = rayo.intersectObjects(modulos.map(m => m.grupo), true)[0];
    if (!golpe) return -1;
    let o = golpe.object;
    while (o && o.userData.i === undefined) o = o.parent;
    return o ? o.userData.i : -1;
}
function apuntar(x, y) {
    hover = tocar(x, y);
    lienzo.style.cursor = hover >= 0 ? 'pointer' : '';
}

botones.forEach((b, i) => {
    b.addEventListener('click', () => ir(i));
    b.addEventListener('pointerenter', () => { hover = i; });
    b.addEventListener('pointerleave', () => { if (hover === i) hover = -1; });
    b.addEventListener('focus', () => { hover = i; });
    b.addEventListener('blur', () => { if (hover === i) hover = -1; });
});

const botonAlas = barra.querySelector('[data-alas]');
const botonDesarme = barra.querySelector('[data-desarme]');
const botonGirar = barra.querySelector('[data-girar]');
botonAlas.addEventListener('click', () => {
    pide.alas = pide.alas > 0 ? 0 : 1;
    botonAlas.setAttribute('aria-pressed', String(pide.alas > 0));
    botonAlas.textContent = pide.alas > 0 ? 'Cerrar alas' : 'Abrir alas';
});
botonDesarme.addEventListener('click', () => {
    pide.desarme = pide.desarme > 0 ? 0 : 1;
    botonDesarme.setAttribute('aria-pressed', String(pide.desarme > 0));
    botonDesarme.textContent = pide.desarme > 0 ? 'Armar' : 'Desarmar';
});
botonGirar.addEventListener('click', () => {
    pide.girar = !pide.girar;
    botonGirar.setAttribute('aria-pressed', String(pide.girar));
    if (pide.girar) { camara.auto = false; ultimaMano = performance.now(); }
});
barra.querySelector('[data-entrar]').addEventListener('click', () => salir('buho-entrar'));
addEventListener('keydown', e => { if (e.key === 'Escape') salir('buho-entrar'); });

let saliendo = false;
function ojoEnPantalla() {
    const p = buho.lentes[0].getWorldPosition(new THREE.Vector3()).project(camera);
    return [Math.round((p.x * 0.5 + 0.5) * innerWidth), Math.round((-p.y * 0.5 + 0.5) * innerHeight)];
}
function salir(type, extra = {}) {
    if (saliendo) return;
    saliendo = true;
    if (EN_SITIO) avisar(type, { ...extra, ojo: ojoEnPantalla() });
    else location.href = extra.destino || '/';
}
function ir(i) {
    const [seccion, destino] = DESTINOS[SECCIONES[i]];
    acento[i] = 1.6; // el módulo elegido late antes de irse
    setTimeout(() => salir('buho-ir', { seccion, destino }), REDUCIR ? 0 : 260);
}

// ------------------------------------------------------------------ cada cuadro
const v = new THREE.Vector3();
let anterior = performance.now();
let listo = false;
function cuadro(ahora) {
    const dt = Math.min(0.05, (ahora - anterior) / 1000);
    anterior = ahora;
    entrada += dt;
    const t = (ahora - t0) / 1000;

    // la entrada: se enciende (0–0.9 s), abre las alas (0.9–2.2 s), saca las secciones (1.9–3.2 s)
    const encender = sale(entrada / 0.9);
    const abrir = suave((entrada - 0.9) / 1.3);
    const menu = clamp01((entrada - 1.9) / 1.3);
    // lo que se ve persigue lo que se pide, con un resorte suave
    const seguir = (actual, meta, rapidez) => actual + (meta - actual) * (1 - Math.exp(-rapidez * dt));
    ve.luz = encender;
    ve.ojo = clamp01((entrada - 0.4) / 0.6);
    ve.alas = seguir(ve.alas, pide.alas * acomodo.alas * abrir, 3.2);
    ve.desarme = seguir(ve.desarme, pide.desarme, 2.6);
    ve.menu = menu;

    // cámara: entra de lejos; luego se mece sola o sigue al visitante (con inercia), y vuelve a mecerse tras 12 s quieto
    if (!camara.auto && !pide.girar && performance.now() - ultimaMano > 12000) camara.auto = true;
    if (!punteros.size) {
        camara.az += camara.vaz;
        camara.el = clamp(camara.el + camara.vel, -12, 40);
        camara.vaz *= Math.exp(-6 * dt);
        camara.vel *= Math.exp(-6 * dt);
    }
    if (pide.girar) camara.az += 24 * dt;
    let az = camara.az;
    let el = camara.el;
    if (camara.auto && !REDUCIR) {
        camara.az = seguir(camara.az, 0, 1.5);
        camara.el = seguir(camara.el, 6, 1.5);
        az += Math.sin(t * 0.35) * 9;
        el += Math.sin(t * 0.27) * 2;
    }
    const d = distanciaParaCaber() * camara.k * (1 + 0.35 * (1 - sale(entrada / 2.2)));

    const e = pose({ alas: ve.alas, desarme: ve.desarme * 0.999, t, aspecto: innerWidth / innerHeight, camara: { mira: mira(), az, el, d } });
    e.luz = ve.luz;
    e.ojo = ve.ojo * (1 + 0.08 * Math.sin(t * 2.2));
    // las secciones no dependen del desarme: salen del pecho con la entrada, una tras otra
    e.modulos = acomodo.destinos.map((destino, i) => {
        acento[i] = seguir(acento[i], i === hover ? 1 : 0, 10);
        const f = sale((menu * 1.3 - 0.05 * i) / 0.95);
        return { f, acento: Math.min(1, acento[i]), etiqueta: clamp01((menu - 0.55 - 0.03 * i) / 0.35), destino };
    });
    dibujar(e, t);
    if (!listo) {
        listo = true;
        avisar('buho-listo');
        app.classList.add('is-listo');
    }
    app.classList.toggle('is-menu', menu > 0.75);
    requestAnimationFrame(cuadro);
}

function pantalla(p) {
    v.copy(p).project(camera);
    return [(v.x * 0.5 + 0.5) * innerWidth, (-v.y * 0.5 + 0.5) * innerHeight];
}

function dibujar(e, t) {
    const k = 0.55 + 0.45 * e.luz;
    sol.intensity = 1.85 * k;
    contraluz.intensity = (OSCURO ? 1.3 : 0.9) * k;
    relleno.intensity = 0.55 * k;
    cielo.intensity = 0.65 * k;
    scene.environmentIntensity = 0.62 * k;
    aura.material.opacity = e.luz;
    M.iris.color.setScalar(0.55 + 0.45 * Math.min(1.3, e.ojo));
    brillo.intensity = 0.25 * e.ojo;
    // respira: sube y baja apenas
    raiz.position.y = REDUCIR ? 0 : Math.sin(t * 1.6) * 0.025 - 0.25 * (1 - e.luz);

    buho.posar(e);
    const c = e.camara;
    camera.position.set(...posicionCamara(c));
    camera.lookAt(...c.mira);
    camera.updateMatrixWorld();

    // las secciones salen girando del pecho y terminan de frente a la cámara, para leerse desde cualquier lado
    e.modulos.forEach((m, i) => {
        const mod = modulos[i];
        const g = mod.grupo;
        g.visible = m.f > 0.002;
        g.position.copy(NUCLEO).lerp(v.set(...m.destino), m.f);
        g.position.z += Math.sin(Math.PI * m.f) * 0.9 + 0.22 * m.acento;
        g.rotation.set(0, (1 - m.f) * Math.PI * 0.9, (1 - m.f) * (i - 3) * 0.25);
        g.quaternion.slerp(camera.quaternion, m.f);
        g.scale.setScalar((0.15 + 0.85 * m.f) * (1 + 0.14 * m.acento));
        mod.cara.color.copy(COLOR.cara).lerp(COLOR.acento, m.acento);
        mod.icono.material.color.copy(COLOR.icono).lerp(COLOR.blanco, m.acento);
    });

    raiz.updateMatrixWorld(true);
    renderer.render(scene, camera);

    // etiquetas (botones) bajo cada módulo y guías del pecho a cada módulo
    const [nx, ny] = pantalla(buho.engrane.getWorldPosition(new THREE.Vector3()));
    e.modulos.forEach((m, i) => {
        const g = modulos[i].grupo;
        const b = botones[i];
        const [x, y] = pantalla(g.position.clone().add(v.set(0, -(MODULO / 2) * g.scale.x - 0.06, 0)));
        b.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, 0)`;
        b.style.opacity = m.etiqueta.toFixed(3);
        b.style.visibility = m.etiqueta > 0.02 ? 'visible' : 'hidden';
        b.classList.toggle('is-activo', m.acento > 0.5);
        const [mx, my] = pantalla(g.position.clone().add(v.set(0, (MODULO / 2) * g.scale.x, 0)));
        const l = guias[i];
        l.setAttribute('x1', nx.toFixed(1)); l.setAttribute('y1', ny.toFixed(1));
        l.setAttribute('x2', mx.toFixed(1)); l.setAttribute('y2', my.toFixed(1));
        l.style.opacity = (m.etiqueta * (0.25 + 0.75 * m.acento) * (1 - e.abierto)).toFixed(3);
    });
}

function ajustar() {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, MOVIL ? 1.75 : 2));
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    acomodar();
}
addEventListener('resize', ajustar);
ajustar();
requestAnimationFrame(cuadro);
