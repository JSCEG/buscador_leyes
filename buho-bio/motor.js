// El búho vivo sobre un <canvas>, sin armar nada de interfaz: quien lo muestra pone sus botones y su ficha, y habla con él
// por esta API. Se puede girar arrastrando, acercar con la rueda o pellizcando, tocar sus partes y dejar que las recorra
// solo. La cabeza sigue a la cámara y al puntero como lo hace un búho; respira, parpadea y dilata la pupila de noche.
//
//   const api = montar(canvas, { noche, vidrio, recorrido, alListo, alError, alElegir, alRecorrido })
//   api.elegir(i) · api.cerrar() · api.recorrido() · api.parar() · api.alas(si) · api.adentro(si) · api.desarme(si)
//   api.noche(si) · api.vidrio('ambar'|'guinda'|'azul'|'verde') · api.mirar() · api.pausar(si) · api.enlazar({ ficha, linea, punto, barra }) · api.destruir()
//   reservaAbajo: () => px que ocupan abajo los controles, para encuadrarse arriba de ellos.
//   incrustado: dentro de una página que se desplaza. No se apodera de la rueda ni del dedo vertical, y usa el vidrio ligero.
//   alElegir(i): i de 0 a PARTES.length - 1 es una parte; PARTES.length, la ficha de cierre; -1, sin ficha.
import * as THREE from 'three';
import { D2R, PARTES, PISO, lerp, clamp01, sale, suave, pose, posicionCamara, revisar } from './modelo.js';
import { P_BUHO, materiales, construir, cambiarVidrio, vidrioLigero } from './buho.js';
import { crearEscena } from './escena.js';

export { PARTES };

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const envolver = g => { const x = ((g % 360) + 360) % 360; return x > 180 ? x - 360 : x; };
const PASO_S = 5.2; // segundos por parte en el recorrido
const VUELO_S = 1.25; // vuelo de una parte a otra

export function montar(lienzo, op = {}) {
    const problemas = revisar();
    if (problemas.length) console.warn('búho:', problemas.join(' · '));
    const REDUCIR = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const MOVIL = matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 600;
    const INCRUSTADO = Boolean(op.incrustado);
    const avisar = (nombre, ...args) => { try { op[nombre]?.(...args); } catch (err) { console.error(err); } };

    let escena;
    try {
        escena = crearEscena(lienzo, { movil: MOVIL });
    } catch (err) {
        avisar('alError', err);
        return { destruir() {}, elegir() {}, siguiente() {}, anterior() {}, cerrar() {}, recorrido() {}, parar() {}, alas() {}, adentro() {}, desarme() {}, noche() {}, vidrio() {}, mirar() {}, pausar() {}, enlazar() {}, punto: () => null, info: () => ({}) };
    }
    const { renderer, scene, camera, iluminar } = escena;
    const M = materiales(P_BUHO, { movil: MOVIL || INCRUSTADO, vidrio: op.vidrio || 'azul' });
    const buho = construir(M, P_BUHO);
    scene.add(buho.raiz);

    // las portadas de los libros se pintan con las letras del sitio: se repintan cuando terminen de llegar
    const repintar = () => buho.libros.repintar();
    if (document.fonts) {
        document.fonts.addEventListener?.('loadingdone', repintar);
        Promise.all([document.fonts.load('500 40px Fraunces'), document.fonts.load('700 40px Manrope')]).then(repintar, () => {});
    }

    // partes del búho → índice en PARTES
    const DUENO = new Map();
    PARTES.forEach((f, i) => buho.partes[f.parte].forEach(o => DUENO.set(o, i)));

    // aro sobre la parte señalada
    const aroTex = (() => {
        const c = document.createElement('canvas');
        c.width = c.height = 256;
        const x = c.getContext('2d');
        const g = x.createRadialGradient(128, 128, 62, 128, 128, 128);
        g.addColorStop(0, 'rgba(155,34,71,0)');
        g.addColorStop(0.74, 'rgba(155,34,71,0.32)');
        g.addColorStop(0.84, 'rgba(229,122,154,0.95)');
        g.addColorStop(0.92, 'rgba(155,34,71,0.3)');
        g.addColorStop(1, 'rgba(155,34,71,0)');
        x.fillStyle = g;
        x.fillRect(0, 0, 256, 256);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
    })();
    const aro = new THREE.Sprite(new THREE.SpriteMaterial({ map: aroTex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
    aro.visible = false;

    // ------------------------------------------------------------ estado: lo que se pide y lo que se ve
    const pide = { alas: 0, adentro: 0, desarme: 0, noche: op.noche ? 1 : 0 };
    const ve = { alas: 0, adentro: 0, desarme: 0, noche: pide.noche, luz: REDUCIR ? 1 : 0 };
    const cam = { az: 0, el: 4, k: 1, vaz: 0, vel: 0, auto: true };
    const cabeza = { yaw: 0, pitch: 0, parpado: 0, show: 0 };
    const puntero = { x: 0, y: 0 };
    let W = 1;
    let H = 1;
    let elegida = -1;
    let hover = -1;
    const zoom = { f: 0, centro: new THREE.Vector3(0, 0, 0), tam: 2, parte: -1, az: 0, el: 4 };
    const vuelo = { t: 1, c0: new THREE.Vector3(), tam0: 2, az0: 0, el0: 4 };
    const focoVisible = { az: 0, el: 4, tam: 2 };
    const cVuelo = new THREE.Vector3();
    const auto = { on: false, hecho: !op.recorrido || REDUCIR, t: 0 };
    let entrada = REDUCIR ? 99 : 0;
    let ultimaMano = performance.now();
    const parpadeo = { sig: 2.4, t: -1, reposo: 0 };
    function parpadear() {
        if (REDUCIR || parpadeo.reposo > 0) return;
        parpadeo.t = 0;
        parpadeo.reposo = 0.5;
        parpadeo.sig = 2.6 + Math.random() * 4.2;
    }
    let listo = false;
    let vivo = true;
    const enlaces = { ficha: null, linea: null, punto: null, barra: null };

    // ------------------------------------------------------------ encuadre
    function encuadre(alasVe) {
        const a = suave(alasVe);
        const ancho = lerp(4.0, 10.0, a);
        const arriba = lerp(2.6, 3.9, a);
        const abajo = PISO - 0.3;
        const alto = arriba - abajo;
        const tv = Math.tan((camera.fov * D2R) / 2);
        // abajo van los controles: el búho cabe en lo que queda y la imagen sube la mitad de lo que ocupan
        const reserva = Math.min(H * 0.5, op.reservaAbajo?.() ?? 0);
        const util = 1 - reserva / H;
        const d = Math.max((alto * 1.1) / 2 / tv / util, (ancho * 1.06) / 2 / (tv * (W / H)));
        const baja = 2 * tv * d * (reserva / (2 * H));
        return { d, mira: [0, (arriba + abajo) / 2 - baja, 0] };
    }

    // ------------------------------------------------------------ puntero
    const rect = () => lienzo.getBoundingClientRect();
    const punteros = new Map();
    let pinza = 0;
    let movido = 0;
    const tomar = () => { cam.auto = false; ultimaMano = performance.now(); };
    const abajoP = e => {
        if (auto.on) pararRecorrido();
        punteros.set(e.pointerId, [e.clientX, e.clientY]);
        try { lienzo.setPointerCapture(e.pointerId); } catch { /* sin captura también sirve */ }
        movido = 0;
        if (!INCRUSTADO && punteros.size === 2) { const [a, b] = [...punteros.values()]; pinza = Math.hypot(a[0] - b[0], a[1] - b[1]); }
    };
    let ultimoApunte = 0;
    const mueveP = e => {
        const r = rect();
        puntero.x = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
        puntero.y = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
        if (!punteros.has(e.pointerId)) {
            const ahora = performance.now();
            if (e.pointerType === 'mouse' && ahora - ultimoApunte > 110) {
                ultimoApunte = ahora;
                hover = parteEn(e.clientX, e.clientY);
                lienzo.style.cursor = hover >= 0 ? 'pointer' : 'grab';
            }
            return;
        }
        const [x0, y0] = punteros.get(e.pointerId);
        punteros.set(e.pointerId, [e.clientX, e.clientY]);
        if (!INCRUSTADO && punteros.size === 2) {
            const [a, b] = [...punteros.values()];
            const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
            if (pinza) cam.k = clamp(cam.k * (pinza / d), 0.42, 1.5);
            pinza = d;
            tomar();
            return;
        }
        const dx = e.clientX - x0;
        const dy = e.clientY - y0;
        movido += Math.abs(dx) + Math.abs(dy);
        if (movido < 5) return;
        tomar();
        cam.vaz = -dx * 0.36;
        cam.vel = dy * 0.22;
        cam.az += cam.vaz;
        cam.el = clamp(cam.el + cam.vel, -8, 42);
        if (zoom.f > 0.5 && elegida >= 0) cerrar();
        lienzo.style.cursor = 'grabbing';
    };
    const sueltaP = e => {
        const clic = punteros.has(e.pointerId) && movido < 5 && punteros.size === 1;
        punteros.delete(e.pointerId);
        pinza = 0;
        lienzo.style.cursor = 'grab';
        if (!clic) return;
        const i = parteEn(e.clientX, e.clientY);
        if (i >= 0) elegir(i);
        else if (elegida >= 0) cerrar();
    };
    const cancelaP = e => { punteros.delete(e.pointerId); pinza = 0; };
    const salP = () => { hover = -1; };
    const ruedaP = e => { e.preventDefault(); tomar(); cam.k = clamp(cam.k * Math.exp(e.deltaY * 0.0012), 0.42, 1.5); };
    lienzo.addEventListener('pointerdown', abajoP);
    lienzo.addEventListener('pointermove', mueveP);
    lienzo.addEventListener('pointerup', sueltaP);
    lienzo.addEventListener('pointercancel', cancelaP);
    lienzo.addEventListener('pointerleave', salP);
    if (!INCRUSTADO) lienzo.addEventListener('wheel', ruedaP, { passive: false });
    lienzo.style.cursor = 'grab';
    // incrustado: el dedo que sube o baja mueve la página; el que va de lado gira al búho
    lienzo.style.touchAction = INCRUSTADO ? 'pan-y' : 'none';

    const rayo = new THREE.Raycaster();
    rayo.params.Line.threshold = 0.001;
    const ndc = new THREE.Vector2();
    function parteEn(x, y) {
        const r = rect();
        ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
        rayo.setFromCamera(ndc, camera);
        for (const g of rayo.intersectObject(buho.raiz, true)) {
            if (g.object.isSprite || g.object.isLine || !g.object.visible) continue;
            let o = g.object;
            while (o && !DUENO.has(o)) o = o.parent;
            return o ? DUENO.get(o) : -1;
        }
        return -1;
    }

    // ------------------------------------------------------------ fichas y recorrido
    const FINAL = PARTES.length;
    function pararRecorrido() {
        if (!auto.on && auto.hecho) return;
        auto.on = false;
        auto.hecho = true;
        if (enlaces.barra) enlaces.barra.style.width = '0%';
        avisar('alRecorrido', false);
    }
    function elegir(i, { solo = false } = {}) {
        if (!solo) pararRecorrido();
        const previa = elegida;
        elegida = ((i % (FINAL + 1)) + FINAL + 1) % (FINAL + 1);
        cam.auto = false;
        ultimaMano = performance.now();
        const f = PARTES[elegida];
        if (f && previa !== elegida) {
            cabeza.show = 0;
            parpadear();
        }
        if (f?.alas !== undefined) pide.alasParte = f.alas;
        else delete pide.alasParte;
        avisar('alElegir', elegida);
    }
    function cerrar() {
        elegida = -1;
        zoom.parte = -1;
        delete pide.alasParte;
        pararRecorrido();
        avisar('alElegir', -1);
    }
    function iniciarRecorrido() {
        if (REDUCIR) { elegir(0); return; }
        auto.on = true;
        auto.hecho = false;
        auto.t = 0;
        avisar('alRecorrido', true);
        elegir(0, { solo: true });
    }

    // ------------------------------------------------------------ calidad: si el equipo no alcanza, baja sola
    const medida = { n: 0, suma: 0, nivel: MOVIL || INCRUSTADO ? 1 : 0 };
    function bajarCalidad() {
        medida.nivel += 1;
        if (medida.nivel === 1) vidrioLigero(M);
        if (medida.nivel === 2) { renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25)); renderer.setSize(W, H, false); }
        if (medida.nivel === 3) { renderer.shadowMap.enabled = false; scene.traverse(o => { if (o.material) o.material.needsUpdate = true; }); }
    }

    // ------------------------------------------------------------ cada cuadro
    const v = new THREE.Vector3();
    let anterior = performance.now();
    const t0 = anterior;
    let raf = 0;
    const seguir = (actual, meta, rapidez, dt) => actual + (meta - actual) * (1 - Math.exp(-rapidez * dt));

    let pausado = false;
    function cuadro(ahora) {
        if (!vivo) return;
        if (pausado && listo) { raf = 0; return; }
        raf = requestAnimationFrame(cuadro);
        if (W < 2 || H < 2) return;
        const dt = Math.min(0.06, (ahora - anterior) / 1000);
        const crudo = (ahora - anterior) / 1000;
        anterior = ahora;
        entrada += dt;
        const t = REDUCIR ? 1.2 : (ahora - t0) / 1000;

        if (entrada > 5 && medida.nivel < 3 && !document.hidden) {
            medida.n += 1;
            medida.suma += crudo;
            if (medida.n >= 90) {
                if (medida.suma / medida.n > 0.038) bajarCalidad();
                medida.n = 0;
                medida.suma = 0;
            }
        }

        // entrada: se enciende, abre las alas, las recoge y empieza el recorrido
        ve.luz = REDUCIR ? 1 : sale(entrada / 1.1);
        const estira = REDUCIR ? 0 : suave((entrada - 1.1) / 1.2) * (1 - suave((entrada - 3.4) / 1.2));
        const vertical = W / H < 0.9;
        const metaAlas = Math.max(estira, pide.alasParte ?? pide.alas) * (vertical ? 0.86 : 1);
        ve.alas = seguir(ve.alas, metaAlas, 3, dt);
        if (Math.abs(ve.alas - metaAlas) < 0.0005) ve.alas = metaAlas;
        ve.adentro = seguir(ve.adentro, pide.adentro, 3.2, dt);
        ve.desarme = seguir(ve.desarme, pide.desarme, 2.6, dt);
        if (Math.abs(ve.desarme - pide.desarme) < 0.0005) ve.desarme = pide.desarme;
        ve.noche = seguir(ve.noche, pide.noche, 2.4, dt);

        if (!auto.hecho && !auto.on && entrada > 5.1) iniciarRecorrido();
        if (auto.on) {
            auto.t += dt;
            if (enlaces.barra) enlaces.barra.style.width = `${(100 * Math.min(1, auto.t / PASO_S)).toFixed(1)}%`;
            if (auto.t >= PASO_S) {
                auto.t = 0;
                if (elegida + 1 >= FINAL) { elegir(FINAL, { solo: true }); pararRecorrido(); }
                else elegir(elegida + 1, { solo: true });
            }
        }

        // cámara: entra de lejos; se mece sola; vuelve a mecerse tras 12 s quieto; inercia por tiempo, no por cuadro
        if (!cam.auto && performance.now() - ultimaMano > 12000 && elegida < 0) cam.auto = true;
        if (!punteros.size) {
            const q = dt * 60;
            cam.az += cam.vaz * q;
            cam.el = clamp(cam.el + cam.vel * q, -8, 42);
            cam.vaz *= Math.exp(-6 * dt);
            cam.vel *= Math.exp(-6 * dt);
        }
        let az = cam.az;
        let el = cam.el;
        if (cam.auto && !REDUCIR) {
            cam.az = seguir(cam.az, Math.round(cam.az / 360) * 360, 1.3, dt);
            cam.el = seguir(cam.el, 4, 1.3, dt);
            az += Math.sin(t * 0.33) * 16 - 8;
            el += Math.sin(t * 0.25) * 2.4;
        }
        const E = encuadre(ve.alas);
        let d = E.d * cam.k * (1 + 0.4 * (1 - sale(entrada / 2.4)));
        let mira = E.mira;

        const enfoca = elegida >= 0 && elegida < FINAL;
        zoom.f = seguir(zoom.f, enfoca ? 1 : 0, 2.2, dt);
        if (enfoca && elegida !== zoom.parte) {
            // en la portada el búho vive dentro de una sección: abierto de alas se ve completo, o se cortaría en la orilla
            const f = INCRUSTADO && PARTES[elegida].parte === 'alas' ? { ...PARTES[elegida], mira: [0, 0.6, 0], az: 0, el: 6, tam: 5.4 } : PARTES[elegida];
            if (!REDUCIR && zoom.parte >= 0 && zoom.f > 0.2) {
                vuelo.c0.copy(vuelo.t < 1 ? cVuelo : zoom.centro);
                vuelo.tam0 = focoVisible.tam;
                vuelo.az0 = focoVisible.az;
                vuelo.el0 = focoVisible.el;
                vuelo.t = 0;
            } else vuelo.t = 1;
            zoom.parte = elegida;
            zoom.centro.set(...f.mira);
            zoom.tam = f.tam;
            zoom.az = f.az;
            zoom.el = f.el;
        }
        if (zoom.f > 0.001) {
            let c = zoom.centro;
            let tam = zoom.tam;
            focoVisible.az = zoom.az;
            focoVisible.el = zoom.el;
            if (vuelo.t < 1) {
                vuelo.t = Math.min(1, vuelo.t + dt / VUELO_S);
                const k = suave(vuelo.t);
                c = cVuelo.copy(vuelo.c0).lerp(zoom.centro, k);
                focoVisible.az = vuelo.az0 + envolver(zoom.az - vuelo.az0) * k;
                focoVisible.el = lerp(vuelo.el0, zoom.el, k);
                tam = lerp(vuelo.tam0, zoom.tam, k) * (1 + 0.6 * Math.sin(Math.PI * vuelo.t));
            }
            focoVisible.tam = tam;
            const tv = Math.tan((camera.fov * D2R) / 2);
            const angosto = Math.min(1, W / H) * (vertical ? 0.86 : 1);
            const dParte = clamp((tam * 1.5) / (2 * tv * angosto), 2.2, 40);
            const zf = zoom.f;
            mira = mira.map((m, k) => m + (c.getComponent(k) - m) * zf);
            const haciaParte = envolver(focoVisible.az - az);
            az += haciaParte * zf;
            el += (focoVisible.el - el) * zf;
            d += (dParte - d) * zf;
        }

        // La mirada sigue a la sección elegida, incluso si cambia de destino a medio giro.
        cabeza.show = Math.max(0, cabeza.show - dt);
        let metaYaw = clamp(envolver(az), -140, 140) + puntero.x * 16;
        let metaPitch = clamp(-el * 0.55 + puntero.y * 9, -16, 14);
        if (enfoca) [metaYaw, metaPitch] = PARTES[elegida].mirada;
        if (REDUCIR) { metaYaw = 0; metaPitch = 0; }
        if (cabeza.show > 0) {
            const s = 4.4 - cabeza.show;
            metaYaw = s < 1.4 ? 135 : s < 3.2 ? -135 : 0;
            metaPitch = 0;
        }
        cabeza.yaw = seguir(cabeza.yaw, metaYaw, 4.8, dt);
        cabeza.pitch = seguir(cabeza.pitch, metaPitch, 4.8, dt);

        // parpadeo y pupila
        parpadeo.sig -= dt;
        parpadeo.reposo = Math.max(0, parpadeo.reposo - dt);
        if (parpadeo.sig <= 0) parpadear();
        let parpado = 0;
        if (parpadeo.t >= 0) {
            parpadeo.t += dt;
            parpado = parpadeo.t < 0.08 ? suave(parpadeo.t / 0.08) : 1 - suave((parpadeo.t - 0.08) / 0.15);
            if (parpadeo.t >= 0.23) parpadeo.t = -1;
        }
        cabeza.parpado = parpado;
        const señalada = elegida >= 0 && elegida < FINAL ? elegida : hover;
        const abre = lerp(0.42, 0.8, ve.noche) + (señalada >= 0 ? 0.12 : 0);

        const e = pose({
            alas: ve.alas, adentro: ve.adentro, desarme: ve.desarme * 0.999, noche: ve.noche, t,
            yaw: cabeza.yaw, pitch: cabeza.pitch, parpado, abre, luz: ve.luz, realce: señalada >= 0 ? 1 : 0,
            camara: { mira, az, el, d, fov: 26 },
        });
        if (M.cristal.transmission) renderer.transmissionResolutionScale = ve.adentro > 0.02 ? 1 : 0.6;
        iluminar(e, M.luz.color);
        buho.posar(e);
        camera.position.set(...posicionCamara(e.camara));
        camera.lookAt(...e.camara.mira);
        camera.updateMatrixWorld();

        // la ficha tapa un lado (escritorio) o abajo (celular): la imagen se corre para que la parte quede a la vista
        const rf = enlaces.ficha && zoom.f > 0.001 ? enlaces.ficha.getBoundingClientRect() : null;
        if (rf && rf.width > 0) {
            const R = rect();
            const abajoF = rf.width > R.width * 0.7;
            camera.setViewOffset(W, H, abajoF ? 0 : (rf.width / 2 + 8) * zoom.f, abajoF ? ((R.bottom - rf.top) / 2) * zoom.f : 0, W, H);
        } else camera.clearViewOffset();
        camera.updateMatrixWorld();

        renderer.render(scene, camera);

        // aro sobre la parte señalada (de cerca ya no hace falta)
        const opacidad = señalada >= 0 ? (1 - zoom.f) * 0.9 : 0;
        if (opacidad > 0.02) {
            const f = PARTES[señalada];
            buho.anclas[f.parte].getWorldPosition(aro.position);
            aro.scale.setScalar(Math.min(1.6, f.tam * 0.52) * (1 + 0.04 * Math.sin(t * 4)));
            aro.material.opacity = opacidad;
            aro.visible = true;
            renderer.autoClear = false;
            renderer.clearDepth();
            renderer.render(aro, camera);
            renderer.autoClear = true;
        }
        marcarLinea();

        if (!listo) { listo = true; avisar('alListo'); }
    }

    function pantalla(p) {
        v.copy(p).project(camera);
        return [(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H];
    }
    const vAncla = new THREE.Vector3();
    function marcarLinea() {
        const { linea, punto, ficha } = enlaces;
        if (!linea) return;
        const hay = elegida >= 0 && elegida < FINAL && ficha && ficha.getBoundingClientRect().width > 0;
        if (!hay) {
            linea.style.opacity = '0';
            if (punto) punto.style.opacity = '0';
            return;
        }
        buho.anclas[PARTES[elegida].parte].getWorldPosition(vAncla);
        const [px, py] = pantalla(vAncla);
        const R = rect();
        const r = ficha.getBoundingClientRect();
        const izq = r.left - R.left;
        const arr = r.top - R.top;
        const fx = clamp(px, izq + 16, izq + r.width - 16);
        const fy = py < arr ? arr : py > arr + r.height ? arr + r.height : arr + 18;
        const ex = px < izq ? izq : px > izq + r.width ? izq + r.width : fx;
        linea.setAttribute('x1', px.toFixed(1));
        linea.setAttribute('y1', py.toFixed(1));
        linea.setAttribute('x2', ex.toFixed(1));
        linea.setAttribute('y2', fy.toFixed(1));
        linea.style.opacity = '1';
        if (punto) {
            punto.setAttribute('cx', px.toFixed(1));
            punto.setAttribute('cy', py.toFixed(1));
            punto.style.opacity = '1';
        }
    }

    function ajustar() {
        const r = lienzo.parentElement ? lienzo.parentElement.getBoundingClientRect() : rect();
        W = Math.max(1, Math.round(r.width));
        H = Math.max(1, Math.round(r.height));
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, MOVIL ? 1.75 : 2));
        renderer.setSize(W, H, false);
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
    }
    const ro = new ResizeObserver(ajustar);
    ro.observe(lienzo.parentElement || lienzo);
    ajustar();
    // los materiales se preparan sin congelar la página; mientras tanto quien lo muestra deja su imagen
    let arrancado = false;
    const empezar = () => {
        if (!vivo) return;
        arrancado = true;
        anterior = performance.now();
        raf = requestAnimationFrame(cuadro);
    };
    if (renderer.compileAsync) renderer.compileAsync(scene, camera).then(empezar, empezar);
    else empezar();

    return {
        elegir: i => { pararRecorrido(); elegir(i); },
        siguiente: () => elegir(elegida + 1),
        anterior: () => elegir(elegida - 1),
        cerrar,
        recorrido: iniciarRecorrido,
        parar: () => { elegir(FINAL, { solo: true }); pararRecorrido(); },
        alas: si => { pide.alas = si ? 1 : 0; },
        adentro: si => { pide.adentro = si ? 1 : 0; if (si) pide.desarme = 0; },
        desarme: si => { pide.desarme = si ? 1 : 0; if (si) pide.adentro = 0; },
        noche: si => { pide.noche = si ? 1 : 0; },
        vidrio: nombre => cambiarVidrio(M, nombre),
        mirar: () => { cabeza.show = 4.4; },
        pausar: si => {
            pausado = Boolean(si);
            if (!pausado && vivo && !raf && arrancado) { anterior = performance.now(); raf = requestAnimationFrame(cuadro); }
        },
        enlazar: e => { Object.assign(enlaces, e); },
        // para las pruebas: dónde queda el centro visible de una parte, en px de la ventana
        punto: nombre => {
            const a = buho.anclas[nombre];
            if (!a) return null;
            a.getWorldPosition(vAncla);
            const [x, y] = pantalla(vAncla);
            const R = rect();
            return [x + R.left, y + R.top];
        },
        info: () => ({ nivel: medida.nivel, draws: renderer.info.render.calls, tris: renderer.info.render.triangles, elegida, alas: ve.alas, yaw: cabeza.yaw, pitch: cabeza.pitch, parpado: cabeza.parpado }),
        destruir: () => {
            vivo = false;
            document.fonts?.removeEventListener?.('loadingdone', repintar);
            cancelAnimationFrame(raf);
            ro.disconnect();
            lienzo.removeEventListener('pointerdown', abajoP);
            lienzo.removeEventListener('pointermove', mueveP);
            lienzo.removeEventListener('pointerup', sueltaP);
            lienzo.removeEventListener('pointercancel', cancelaP);
            lienzo.removeEventListener('pointerleave', salP);
            lienzo.removeEventListener('wheel', ruedaP);
            renderer.dispose();
        },
    };
}
