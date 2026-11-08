// La página de una planta con física, igual en todas: la escena con sus puntos clave, las fichas, el vuelo de la cámara, las manos, el
// recorrido, ver por dentro, desarmar, día y noche, pantalla completa, los controles y el contrato con Aprende (concepto-height,
// concepto-part, concepto-select-part, concepto-listo, concepto-fullscreen). El tema del sitio (data-tema) es independiente de la noche de
// la escena: la noche solo cambia la escena. Cada figura pone su modelo, su geometría, sus fichas y su tablero, y esta página los mueve.
//
//   crearPagina({ figura, fichas, vistas, modos, pide, general, escena, poseDe, alCuadro, secciones, alPintarFijas, alPintarGraficas,
//                 alActualizar, firma, crearDiagrama, ... }) → pagina
//
// modos[id]: { nombre, corto, resumen, aclara, mando: { nombre, campo, rango, texto(v) }, mando2: igual, reloj: { texto, avanzar(pide, dt), alSeguir(pide) } }
// fichas[i]: { parte, nombre, modo, abrir, accion, eq, icono, texto, recorrido: { noche, adentro } }
// botones[i]: { id, visible(pide), pulsado(pide), texto(pide), alTocar(pide, pagina) }
// acciones[id]: { texto(pide), hacer(pide, pagina) } además de 'noche' y 'desarme', que ya vienen.
import * as THREE from 'three';
import { brandMarkSvg } from '../../src/lib/brand-mark.js';
import { D2R, ICONO_TOCAR, ICONOS, clamp, clamp01, sale, suave, svgIcono } from './ayudas.js';
import { posicionCamara } from './camara.js';

export function crearPagina(cfg) {
    const { figura: FIGURA, fichas: FICHAS, modos: MODOS, general: GEN, botones: BOTONES = [], acciones: ACCIONES = {}, etiquetas: ET = {} } = cfg;
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
    const MOVIL = matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 600;
    const avisar = datos => { try { if (parent !== window) parent.postMessage(datos, location.origin); } catch { /* sin padre del mismo origen */ } };

    const PARTES = FICHAS.map(f => f.parte);
    const FINAL = FICHAS.length;
    const VISTAS = cfg.vistas;
    // cada paso del recorrido dura lo que tarda en leerse su ficha
    const pasoS = i => clamp((FICHAS[i]?.texto.split(' ').length ?? 30) * 0.17, 5, 11);

    // ------------------------------------------------------------------ la página
    const controles = () => `
    <div class="g-seg h-procesos" role="radiogroup" aria-label="${ET.modos ?? 'Qué ver en la central'}">
        ${Object.entries(MODOS).map(([id, p]) => `<button type="button" role="radio" data-modo="${id}" aria-checked="false"><span class="h-largo">${p.nombre}</span><span class="h-corto">${p.corto}</span></button>`).join('')}
    </div>
    <label class="g-deslizador h-mando" data-caja1><span class="h-rotulo"><span data-c="mando"></span><b data-c="mandoValor"></b></span><input type="range" data-control="1" min="0" max="100" step="0.25" value="50"></label>
    <label class="g-deslizador h-mando" data-caja2><span class="h-rotulo"><span data-c="mando2"></span><b data-c="mando2Valor"></b></span><input type="range" data-control="2" min="0" max="100" step="0.25" value="50"></label>
    <label class="g-deslizador h-mando"><span class="h-rotulo"><span>Desarmar</span></span><input type="range" data-desarme min="0" max="1" step="0.01" value="0" aria-label="${ET.desarmar ?? 'Desarmar la central'}"></label>
    <span class="h-relojes">
        <button type="button" class="g-chip h-reloj" data-reloj hidden></button>
        ${BOTONES.map(b => `<button type="button" class="g-chip h-reloj" data-boton="${b.id}" aria-pressed="false" hidden><span></span></button>`).join('')}
    </span>`;
    const botonesDePartes = () => FICHAS.map((f, i) => `<button type="button" data-parte="${i}" aria-pressed="false"><span>${i + 1}</span>${f.nombre}</button>`).join('');
    const app = document.getElementById('app');
    app.innerHTML = `
    <div class="g-escena">
        <div class="h-cielo" aria-hidden="true"></div>
        <canvas class="g-lienzo" aria-label="${ET.lienzo ?? 'Central en 3D: arrastra para girarla, toca un punto para conocerlo'}"></canvas>
        <div class="h-pines" aria-label="${ET.puntos ?? 'Puntos clave de la central'}">${FICHAS.map((f, i) => `<button type="button" class="h-pin" data-pin="${i}" aria-label="${i + 1}. ${f.nombre}" title="${f.nombre}"><b>${i + 1}</b><span>${f.nombre}</span></button>`).join('')}</div>
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
            <nav class="g-flot-partes" aria-label="${ET.puntos ?? 'Puntos clave de la central'}">${botonesDePartes()}</nav>
            <div class="g-flot-ctrl">${controles()}</div>
        </div>
    </div>
    <div class="g-tablero">
        <section class="g-control" aria-label="Controles">
            ${controles()}
            <p class="h-resumen" data-c="resumen"></p>
            <p class="h-aviso" data-aviso hidden></p>
        </section>
        <section class="h-lecturas" aria-label="${ET.lecturas ?? 'Lo que mide la central'}">
            <div class="g-cifras" id="h-cifras"></div>
            <div class="h-nivel"><span data-c="nivel1T"></span><i><u id="h-nivel-1"></u></i><b data-c="nivel1"></b></div>
            <div class="h-nivel h-nivel-2"><span data-c="nivel2T"></span><i><u id="h-nivel-2"></u></i><b data-c="nivel2"></b></div>
        </section>
        ${cfg.secciones()}
        <nav class="g-partes" aria-label="${ET.puntos ?? 'Puntos clave de la central'}">${botonesDePartes()}</nav>
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
    const { planta, est } = cfg.escena(renderer, scene, { movil: MOVIL, oscuro: OSCURO });
    scene.add(planta.raiz);
    const DUENO = new Map();
    PARTES.forEach((parte, i) => planta.partes[parte].forEach(g => DUENO.set(g, i)));

    // ------------------------------------------------------------------ estado
    const modoPedido = parametros.get('modo');
    const pide = { modo: MODOS[modoPedido] ? modoPedido : (cfg.modo0 ?? Object.keys(MODOS)[0]), adentro: false, desarme: 0, noche: parametros.get('noche') === '1', corre: false, ...cfg.pide };
    const ve = { adentro: 0, desarme: 0, noche: pide.noche ? 1 : 0, partes: Object.fromEntries(PARTES.map(p => [p, 0])) };
    const fases = planta.giran.map(() => 0);
    const azBase = GEN.az ?? -16;
    const elBase = GEN.el ?? 18;
    const camara = { az: azBase, el: elBase, k: 1, vaz: 0, vel: 0, auto: true, giro: 0, mantener: 0 };
    let acomodo = null;
    let hoverParte = -1;
    let elegida = -1;
    const zoom = { f: 0, centro: new THREE.Vector3(0, GEN.mira?.[1] ?? 0, 0), parte: -1, tam: 4, az: azBase, el: elBase, az0: azBase, el0: elBase, k0: 1 };
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
    let firmaTablero = '';
    document.addEventListener('visibilitychange', () => { visible = document.visibilityState === 'visible'; });
    // fuera de la vista la escena no se dibuja, y el recorrido espera a que regresen
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(l => { enPantalla = l.at(-1).isIntersecting; }, { threshold: 0.15 }).observe(escena);
        new IntersectionObserver(l => { tableroEnPantalla = l.at(-1).isIntersecting; }).observe(tablero);
    }

    function acomodar() {
        const vertical = W / H < 0.9;
        acomodo = { vertical, angosto: W < 620, azBase: vertical ? (GEN.azVertical ?? -10) : azBase, elBase: vertical ? (GEN.elVertical ?? 20) : elBase };
        if (camara.auto) { camara.az = acomodo.azBase; camara.el = acomodo.elBase; }
        escena.classList.toggle('es-angosta', acomodo.angosto);
    }
    // pantalla baja y acostada: en pantalla completa los controles van a un lado (ver estilo.css), porque debajo no dejarían lugar a la escena
    const bajaYAcostada = matchMedia('(max-height: 620px) and (orientation: landscape)');
    function medirLibre(suavizado) {
        const re = escena.getBoundingClientRect();
        const rFlot = flot.getBoundingClientRect();
        const alLado = completa && bajaYAcostada.matches;
        let [l, r, t, b] = [0, W, 0, H];
        t = acomodo.angosto ? acciones.getBoundingClientRect().bottom - re.top + 2 : 10;
        if (alLado && rFlot.width > 0) r = Math.min(r, rFlot.left - re.left - 6);
        if (alLado) t = Math.max(t, acciones.getBoundingClientRect().bottom - re.top + 2);
        else if (completa) b = Math.min(b, rFlot.top - re.top - 4);
        if (!ficha.hidden) {
            const rf = ficha.getBoundingClientRect();
            if (acomodo.angosto) b = Math.min(b, rf.top - re.top - 4);
            else r = Math.min(r, rf.left - re.left - 6);
        }
        const k = suavizado;
        const destino = { cx: (l + r) / 2, cy: (t + b) / 2, fw: Math.max(120, r - l), fh: Math.max(120, b - t) };
        for (const c of Object.keys(destino)) libre[c] = k >= 1 ? destino[c] : libre[c] + (destino[c] - libre[c]) * k;
        // en pantalla completa la ficha va sobre los controles
        escena.style.setProperty('--flot', completa && !alLado ? `${Math.max(0, re.bottom - rFlot.top)}px` : '0px');
    }
    // distancia para que todo el bloque quepa en el hueco libre, mirándolo desde este ángulo
    function distanciaGeneral(az, el) {
        const [sa, ca] = [Math.abs(Math.sin(az * D2R)), Math.abs(Math.cos(az * D2R))];
        const w = GEN.Lx * ca + GEN.Lz * sa;
        const h = (GEN.Lx * sa + GEN.Lz * ca) * Math.sin(el * D2R) + GEN.alto * Math.cos(el * D2R);
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
            if (!o0.visible) continue;
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
    const accionDe = () => (elegida === FINAL ? 'desarme' : FICHAS[elegida]?.accion);
    function textoAccion() {
        const a = accionDe();
        if (a === 'noche') return pide.noche ? 'Hacer de día' : 'Hacer de noche';
        if (a === 'desarme') return pide.desarme > 0.5 ? 'Armar' : 'Desarmar';
        return ACCIONES[a]?.texto(pide) ?? '';
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
        const reloj = MODOS[pide.modo].reloj;
        relojes.forEach(b => {
            b.hidden = !reloj;
            if (reloj) b.innerHTML = `${svgIcono(pide.corre ? ICONOS.pausa : ICONOS.seguir)}<span>${pide.corre ? `Pausar ${reloj.texto}` : `Seguir ${reloj.texto}`}</span>`;
        });
        for (const B of BOTONES) {
            app.querySelectorAll(`[data-boton="${B.id}"]`).forEach(b => {
                b.hidden = !B.visible(pide);
                b.setAttribute('aria-pressed', String(B.pulsado(pide)));
                b.querySelector('span').textContent = B.texto(pide);
            });
        }
    }
    function cambiarModo(m) {
        if (pide.modo === m) return;
        cfg.alCambiarModo?.(pide, m, REDUCIR);
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
        ficha.querySelector('.h-ficha-texto').textContent = final ? cfg.textoFinal : f.texto;
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
        const a = accionDe();
        if (a === 'noche') pide.noche = !pide.noche;
        else if (a === 'desarme') ponerDesarme(pide.desarme > 0.5 ? 0 : 1);
        else ACCIONES[a]?.hacer(pide, pagina);
        rotular();
    }
    ficha.querySelector('[data-cerrar]').addEventListener('click', () => { pararRecorrido(); cerrarFicha(); });
    ficha.querySelector('[data-saltar]').addEventListener('click', () => { pararRecorrido(); pide.adentro = false; pide.noche = false; cambiarModo(cfg.modo0 ?? Object.keys(MODOS)[0]); elegir(FINAL); });
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
        if (pide.corre) MODOS[pide.modo].reloj?.alSeguir?.(pide);
        rotular();
    }));
    for (const B of BOTONES) app.querySelectorAll(`[data-boton="${B.id}"]`).forEach(b => b.addEventListener('click', () => { pararRecorrido(); B.alTocar(pide, pagina); invalidar(); rotular(); }));
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
    const rangoDe = m => (typeof m.rango === 'function' ? m.rango(pide) : m.rango);
    const moverMando = (cual, d) => {
        pararRecorrido();
        const m = MODOS[pide.modo][cual];
        if (!m) return;
        pide[m.campo] = deRango(rangoDe(m), Number(d.value) / 100);
        if (m.detiene) { pide.corre = false; rotular(); }
        ponerMando();
        ultimoTablero = 0;
        if (m.pinta) firmaTablero = '';
    };
    mandos.forEach(d => d.addEventListener('input', () => moverMando('mando', d)));
    mandos2.forEach(d => d.addEventListener('input', () => moverMando('mando2', d)));
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

    // ------------------------------------------------------------------ tablero
    const diagrama = cfg.crearDiagrama ? cfg.crearDiagrama($('#h-diagrama')) : null;
    let colores = null;
    function leerColores() {
        const css = getComputedStyle(raizDoc);
        const v = n => css.getPropertyValue(n).trim();
        colores = { tinta: v('--tinta'), suave: v('--tinta-suave'), linea: v('--linea'), superficie: v('--ceniza'), fondoPanel: v('--papel-alto'), guinda: v('--rojo'), ...cfg.colores };
        return colores;
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
    function ponerMando() {
        const P = MODOS[pide.modo];
        const valor = (m, lista) => {
            if (!m) return;
            const v = aRango(rangoDe(m), pide[m.campo]);
            lista.forEach(d => { if (document.activeElement !== d || m.detiene) d.value = String(v); });
        };
        valor(P.mando, mandos);
        valor(P.mando2, mandos2);
        if (P.mando) ponerCifra('mandoValor', P.mando.texto(pide[P.mando.campo], pide));
        if (P.mando2) ponerCifra('mando2Valor', P.mando2.texto(pide[P.mando2.campo], pide));
    }
    function pintarTablero() {
        const P = MODOS[pide.modo];
        app.dataset.modo = pide.modo;
        ponerCifra('resumen', P.resumen);
        ponerCifra('aPie', P.aclara ?? '');
        ponerCifra('mando', P.mando?.nombre ?? '');
        ponerCifra('mando2', P.mando2?.nombre ?? '');
        mandos.forEach(d => d.setAttribute('aria-label', P.mando?.nombre ?? ''));
        mandos2.forEach(d => d.setAttribute('aria-label', P.mando2?.nombre ?? ''));
        cajas2.forEach(c => { c.hidden = !P.mando2; });
        invalidar();
        ponerMando();
    }
    const invalidar = () => { firmaTablero = ''; ultimoTablero = 0; };
    function actualizarTablero(L) {
        const firma = JSON.stringify(cfg.firma?.(pide) ?? [pide.modo]);
        if (firma !== firmaTablero) { firmaTablero = firma; cfg.alPintarGraficas?.(L, pagina); }
        cfg.alActualizar?.(L, pagina);
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
        const reloj = MODOS[pide.modo].reloj;
        if (reloj && pide.corre && (enPantalla || tableroEnPantalla)) {
            if (reloj.avanzar(pide, dt)) { pide.corre = false; rotular(); }
            ponerMando();
        }
        cfg.alCuadro?.({ dt, seguir, pide, ve, pagina });
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
        let d = distanciaGeneral(az, el) * camara.k * (1 + 0.45 * (1 - sale(entrada / 2.4))) * (1 + (GEN.alejarDesarme ?? 0.26) * sale(ve.desarme));
        miraV.set(GEN.mira[0], GEN.mira[1] - 0.3 * sale(ve.desarme), GEN.mira[2]);

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
                    cambiarModo(cfg.modo0 ?? Object.keys(MODOS)[0]);
                    elegir(FINAL, { solo: true });
                    pararRecorrido();
                } else elegir(elegida + 1, { solo: true });
            }
        }

        const e = cfg.poseDe({ pide, ve, encendido, t, dt, camara: { mira: miraV.toArray(), az, el, d } });
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
        if (tableroEnPantalla) diagrama?.dibujar(pide.modo, t, e.lectura, colores || leerColores());
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

    const pagina = {
        $, app, pide, ve, camara, FINAL, REDUCIR, OSCURO, MOVIL,
        ponerCifra, ponerLecturas, nivel, ponerMando, rotular, invalidar, elegir, cerrarFicha, cambiarModo, ponerDesarme, pararRecorrido, leerColores,
        hacerAccion,
    };
    pagina.graficas = {};
    // el modo pedido por la dirección también debe preparar su estado
    if (modoPedido && MODOS[modoPedido]) cfg.alCambiarModo?.(pide, modoPedido, REDUCIR);
    ajustar();
    cfg.alPintarFijas?.(pagina);
    pintarTablero();
    rotular();
    document.fonts?.ready.then(() => { planta.repintar(); ajustar(); });
    addEventListener('load', avisarAltura);
    // para las pruebas
    window.__PLANTA = () => ({ modo: pide.modo, adentro: +ve.adentro.toFixed(2), desarme: +ve.desarme.toFixed(2), noche: +ve.noche.toFixed(2), elegida, parte: PARTES[elegida] ?? null, recorrido: auto.on, az: +camara.az.toFixed(1), k: +camara.k.toFixed(2), ...cfg.prueba?.(pide) });
    window.__PUNTO = parte => { planta.anclas[parte].getWorldPosition(centro); const r = escena.getBoundingClientRect(); return pantalla(centro).map((c, i) => Math.round(c + (i ? r.top : r.left))); };
    window.__MOVER = (o = {}) => { Object.assign(pide, o); if (o.camara) Object.assign(camara, o.camara, { auto: false }); invalidar(); rotular(); if (o.modo) pintarTablero(); };
    requestAnimationFrame(cuadro);
    return pagina;
}
