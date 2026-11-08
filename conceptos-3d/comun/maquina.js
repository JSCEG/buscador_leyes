// Motor común de las máquinas de «¿Cómo funciona?». Arma la página (escena, tablero, pantalla completa, logo), la
// cámara, el recorrido, desarmar, arrastrar piezas, las etiquetas, la gráfica y los mensajes con Aprende. Cada máquina
// solo describe sus piezas y su física:
//
//   crearMaquina({
//     figura, nombre,                 // id de la figura (el mismo de Aprende) y cómo se llama («el motor»)
//     partes: [{ n, nombre, ancla, vista, corte? }],   // en el orden y con el número de la ficha
//     vistas: [{ id, texto, tx, ty, tz, az, el, d, corte? }],  // la primera es la general
//     entrada: { etiqueta, min, max, paso, valor, aria },      // el deslizador principal
//     selectores: [{ id, etiqueta, opciones: [{ id, texto }], valor }],   // botones extra (p. ej. la fuente)
//     cifras: [{ id, etiqueta, nota }], hud,                   // tablero y cifra grande (HTML con data-c)
//     curva: { titulo, leyenda: [{ texto, color }], nota, dibujar(g, w, h, estado) },
//     corte: true,                    // si tiene «Ver por dentro»
//     anchoVertical: 1.1, lejaniaMax: 2.4,   // en un celular vertical: qué tan ancha es la máquina y cuánto se aleja
//     construir(k) → { piezas, movibles, anclas },             // las piezas (k trae raiz, M, P, ayudas, plano…)
//     paso(estado) → { cifras: { id: texto } },                // la física de cada cuadro
//     despues(estado), entradaRecorrido(t)                     // opcionales: tras la cámara; entrada en el recorrido
//   })
//
// Una sola entrada mueve todo: el deslizador. La máquina decide qué hace con ella en paso(); nada se anima a mano.
import { Vector3, Vector2, Plane, Raycaster, Group, DoubleSide, Color } from 'three';
import { brandMarkSvg } from '../../src/lib/brand-mark.js';
import { tema, paleta, materiales, ayudantes, estudio } from './estilo.js';

const ICONO_ABRIR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
const ICONO_CERRAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';
export const LENTO = [
    { id: 'lento', texto: '1/60', k: 1 / 60, nota: 'Cámara lenta: 60 veces más despacio.' },
    { id: 'medio', texto: '1/10', k: 1 / 10, nota: 'Cámara lenta: 10 veces más despacio.' },
    { id: 'real', texto: 'Real', k: 1, nota: 'A velocidad real el ojo ya no alcanza a ver el giro.' },
];
const D2R = Math.PI / 180;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const num = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function crearMaquina(def) {
    const FIGURA = def.figura;
    const TEMA = tema();
    const P = paleta(TEMA);
    const REDUCIR = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const PARTES = def.partes;
    const VISTAS = def.vistas;
    const LENTOS = def.lento || LENTO;
    const SELECTORES = def.selectores || [];
    const ent = def.entrada;

    // ------------------------------------------------------------------ la página
    const controles = () => `
        <label class="g-deslizador"><span>${esc(ent.etiqueta)}</span><input type="range" data-entrada min="${ent.min}" max="${ent.max}" step="${ent.paso}" value="${ent.valor}" aria-label="${esc(ent.aria || ent.etiqueta)}"></label>
        <label class="g-deslizador"><span>Desarmar</span><input type="range" data-desarme min="0" max="1" step="0.01" value="0" aria-label="Desarmar ${esc(def.nombre)}"></label>
        <div class="g-filas">
            ${SELECTORES.map(s => `<div class="g-seg" role="radiogroup" aria-label="${esc(s.etiqueta)}">${s.opciones.map(o => `<button type="button" role="radio" data-sel="${s.id}" data-op="${o.id}" aria-checked="false">${esc(o.texto)}</button>`).join('')}</div>`).join('')}
            <div class="g-seg" role="radiogroup" aria-label="Cámara lenta">${LENTOS.map(l => `<button type="button" role="radio" data-lento="${l.id}" aria-checked="false">${l.texto}</button>`).join('')}</div>
            <div class="g-seg" role="radiogroup" aria-label="Vista de cámara">${VISTAS.map(v => `<button type="button" role="radio" data-vista="${v.id}" aria-checked="false">${esc(v.texto)}</button>`).join('')}</div>
        </div>`;
    const botonesDePartes = () => PARTES.map(p => `<button type="button" data-parte="${p.n}" aria-pressed="false"><span>${p.n}</span>${esc(p.nombre)}</button>`).join('');
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="g-escena">
            <canvas class="g-lienzo" aria-hidden="true"></canvas>
            <svg class="g-guia" aria-hidden="true"><line x1="0" y1="0" x2="0" y2="0"/><circle r="4"/></svg>
            <div class="g-etiqueta" hidden><b></b><span></span></div>
            <div class="g-escena-acciones">
                <button type="button" class="g-chip" data-recorrido aria-pressed="true"><i></i><span>Recorrido</span></button>
                <span class="g-grupo">
                    ${def.corte ? '<button type="button" class="g-chip" data-corte aria-pressed="false">Ver por dentro</button>' : ''}
                    <button type="button" class="g-chip g-chip-icono" data-pantalla aria-pressed="false" aria-label="Pantalla completa" title="Pantalla completa">${ICONO_ABRIR}</button>
                </span>
            </div>
            <div class="g-hud" aria-live="off">${def.hud}</div>
            <div class="g-nums" aria-hidden="true">${PARTES.map(p => `<span data-num="${p.n}"><b>${p.n}</b><i>${esc(p.nombre)}</i></span>`).join('')}</div>
            <div class="g-marca">${brandMarkSvg({ title: 'Buscador Jurídico' })}<span>Buscador Jurídico</span></div>
            <div class="g-flot">
                <nav class="g-flot-partes" aria-label="Partes de ${esc(def.nombre)}">${botonesDePartes()}</nav>
                <div class="g-flot-ctrl">${controles()}</div>
            </div>
        </div>
        <div class="g-tablero">
            <section class="g-control" aria-label="Controles">${controles()}</section>
            <section class="g-cifras" aria-label="Lo que mide ${esc(def.nombre)}">
                ${def.cifras.map(c => `<div><span>${esc(c.etiqueta)}</span><b data-c="${c.id}"></b><small>${esc(c.nota)}</small></div>`).join('')}
            </section>
            ${def.curva ? `<section class="g-curva" aria-label="${esc(def.curva.titulo)}">
                <div class="g-curva-cab"><b>${esc(def.curva.titulo)}</b><span>${(def.curva.leyenda || []).map((l, i) => `<i class="f${i + 1}"></i>${esc(l.texto)}`).join('')}</span></div>
                <canvas aria-hidden="true"></canvas>
                <p>${esc(def.curva.nota || '')}</p>
            </section>` : ''}
            <nav class="g-partes" aria-label="Partes de ${esc(def.nombre)}">${botonesDePartes()}</nav>
        </div>`;
    const $ = s => app.querySelector(s);
    const lienzo = $('.g-lienzo');
    const escena = $('.g-escena');

    // ------------------------------------------------------------------ la escena
    const { renderer, scene, camera, sol } = estudio(lienzo, P, TEMA);
    const M = materiales(P);
    const { sombra, contorno, aro } = ayudantes(M);
    // «Ver por dentro»: una pared invisible en z = 0 quita la mitad de enfrente de lo que lleve conCorte
    const plano = new Plane(new Vector3(0, 0, -1), 50);
    const conCorte = material => { material.clippingPlanes = [plano]; material.side = DoubleSide; return material; };
    const raiz = new Group();
    scene.add(raiz);
    const { piezas, movibles, anclas } = def.construir({ raiz, M, P, TEMA, sombra, contorno, aro, plano, conCorte, escena, sol, scene });

    // resaltar la pieza elegida con un tinte guinda
    const acento = new Color(P.acento);
    const resaltar = n => {
        for (const [k, objetos] of Object.entries(piezas)) for (const o of objetos) o.traverse(m => {
            if (!m.isMesh || !m.material?.emissive || m.userData.sinResalte) return;
            if (!m.userData.original) m.userData.original = m.material;
            m.material = Number(k) === n ? m.userData.resaltado ??= Object.assign(m.userData.original.clone(), { emissive: acento.clone(), emissiveIntensity: 0.09 }) : m.userData.original;
        });
    };
    // desarmar y arrastrar
    for (const m of movibles) for (const o of m.objetos) { o.userData.base = o.position.clone(); o.userData.parte = m.parte; }
    const desplazamiento = n => anclas[n][0].position.clone().sub(anclas[n][0].userData.base || anclas[n][0].position);
    const arrastre = Object.fromEntries(PARTES.map(p => [p.n, new Vector3()]));
    const piezaDe = objeto => { for (let o = objeto; o; o = o.parent) if (o.userData.parte) return o.userData.parte; return 0; };

    // ------------------------------------------------------------------ estado
    const estado = {
        entrada: Number(ent.valor), entradaObjetivo: Number(ent.valor), lento: LENTOS[0], sel: {}, parte: 0,
        T: 0, dt: 0, dtSim: 0, e: 0, arrastre, completa: false, camara: camera, escena, M, P, TEMA, plano,
        w: 0, h: 0, recorrido: false,
    };
    let parte = 0;
    let corte = 0;
    let corteManual = false;
    const cam = { ...VISTAS[0] };
    const orbita = { az: 0, el: 0, k: 1 };
    const recorrido = { activo: !REDUCIR, t: 0, paso: -1 };
    let ultimoToque = -99;
    let bajada = 0;
    let desarme = 0;
    let desarmeVis = 0;
    let vista = VISTAS[0].id;

    const elegirLento = id => {
        estado.lento = LENTOS.find(l => l.id === id) || LENTOS[0];
        app.querySelectorAll('[data-lento]').forEach(b => {
            b.setAttribute('aria-checked', String(b.dataset.lento === estado.lento.id));
            b.title = LENTOS.find(l => l.id === b.dataset.lento).nota;
        });
    };
    const elegirVista = id => {
        vista = id;
        app.querySelectorAll('[data-vista]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.vista === id)));
    };
    const elegirSel = (id, op) => {
        estado.sel[id] = op;
        app.querySelectorAll(`[data-sel="${id}"]`).forEach(b => b.setAttribute('aria-checked', String(b.dataset.op === op)));
    };
    SELECTORES.forEach(s => elegirSel(s.id, s.valor));
    elegirVista(VISTAS[0].id);
    elegirLento(LENTOS[0].id);

    const botonesPartes = [...app.querySelectorAll('[data-parte]')];
    const etiqueta = $('.g-etiqueta');
    const guia = $('.g-guia');
    function elegirParte(n, { avisar = false } = {}) {
        parte = n;
        estado.parte = n;
        botonesPartes.forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.parte) === n)));
        resaltar(n);
        const p = PARTES.find(x => x.n === n);
        etiqueta.hidden = !p;
        guia.style.display = p ? '' : 'none';
        if (p) {
            etiqueta.querySelector('b').textContent = p.n;
            etiqueta.querySelector('span').textContent = p.nombre;
        }
        if (!corteManual) corte = p?.corte ? 1 : 0;
        if (avisar) parent.postMessage({ type: 'concepto-part', figura: FIGURA, n }, location.origin);
    }

    const btnRecorrido = $('[data-recorrido]');
    const btnCorte = $('[data-corte]');
    const pintarBotones = () => {
        btnRecorrido.setAttribute('aria-pressed', String(recorrido.activo));
        btnRecorrido.querySelector('span').textContent = recorrido.activo ? 'Pausar recorrido' : 'Ver recorrido';
        btnCorte?.setAttribute('aria-pressed', String(corte > 0.5));
    };
    const tomarControl = () => {
        ultimoToque = estado.T;
        if (!recorrido.activo) return;
        recorrido.activo = false;
        pintarBotones();
    };

    // ------------------------------------------------------------------ controles
    const entradas = [...app.querySelectorAll('input[data-entrada]')];
    const ponerEntrada = valor => {
        estado.entradaObjetivo = clamp(valor, Number(ent.min), Number(ent.max));
        entradas.forEach(d => { d.value = String(estado.entradaObjetivo); });
    };
    entradas.forEach(d => d.addEventListener('input', () => { tomarControl(); ponerEntrada(Number(d.value)); }));
    app.querySelectorAll('[data-lento]').forEach(b => b.addEventListener('click', () => { tomarControl(); elegirLento(b.dataset.lento); }));
    app.querySelectorAll('[data-sel]').forEach(b => b.addEventListener('click', () => { tomarControl(); elegirSel(b.dataset.sel, b.dataset.op); }));
    const desarmadores = [...app.querySelectorAll('input[data-desarme]')];
    const ponerDesarme = valor => {
        desarme = clamp(valor, 0, 1);
        desarmadores.forEach(d => { d.value = String(desarme); });
    };
    desarmadores.forEach(d => d.addEventListener('input', () => { tomarControl(); ponerDesarme(Number(d.value)); }));
    app.querySelectorAll('[data-vista]').forEach(b => b.addEventListener('click', () => {
        tomarControl();
        const v = VISTAS.find(x => x.id === b.dataset.vista);
        elegirParte(0, { avisar: true });
        elegirVista(v.id);
        if (!corteManual) corte = v.corte ? 1 : 0;
        Object.assign(orbita, { az: 0, el: 0, k: 1 });
    }));
    botonesPartes.forEach(b => b.addEventListener('click', () => {
        // si la pieza la eligió el recorrido, tocarla la deja elegida en vez de soltarla
        const delRecorrido = recorrido.activo;
        tomarControl();
        const n = Number(b.dataset.parte);
        elegirParte(parte === n && !delRecorrido ? 0 : n, { avisar: true });
        Object.assign(orbita, { az: 0, el: 0, k: 1 });
    }));
    btnCorte?.addEventListener('click', () => { tomarControl(); corteManual = true; corte = corte > 0.5 ? 0 : 1; pintarBotones(); });
    btnRecorrido.addEventListener('click', event => {
        event.stopPropagation();
        if (recorrido.activo) { tomarControl(); return; }
        Object.assign(recorrido, { activo: true, t: 0, paso: -1 });
        corteManual = false;
        Object.assign(orbita, { az: 0, el: 0, k: 1 });
        pintarBotones();
    });

    // Pantalla completa: la del navegador cuando existe; si no (iPhone), la escena cubre la ventana y Aprende agranda el marco.
    const btnPantalla = $('[data-pantalla]');
    const NATIVA = Boolean((escena.requestFullscreen || escena.webkitRequestFullscreen) && (document.fullscreenEnabled || document.webkitFullscreenEnabled));
    const enNativa = () => document.fullscreenElement || document.webkitFullscreenElement;
    let simulando = false;
    function ponerCompleta(on, simulada = false) {
        if (simulando && !simulada && parent !== window) parent.postMessage({ type: 'concepto-fullscreen', id: FIGURA, on: false }, location.origin);
        simulando = on && simulada;
        estado.completa = on;
        escena.classList.toggle('completa', on);
        escena.classList.toggle('simulada', on && simulada);
        document.documentElement.classList.toggle('g-bloqueo', on && simulada);
        const texto = on ? 'Salir de pantalla completa' : 'Pantalla completa';
        btnPantalla.setAttribute('aria-pressed', String(on));
        btnPantalla.setAttribute('aria-label', texto);
        btnPantalla.title = texto;
        btnPantalla.innerHTML = on ? ICONO_CERRAR : ICONO_ABRIR;
        if (simulada && parent !== window) parent.postMessage({ type: 'concepto-fullscreen', id: FIGURA, on }, location.origin);
        medir();
    }
    const simular = on => ponerCompleta(on, true);
    btnPantalla.addEventListener('click', () => {
        if (!estado.completa) {
            if (!NATIVA) { simular(true); return; }
            const pedir = escena.requestFullscreen ? escena.requestFullscreen() : escena.webkitRequestFullscreen();
            // si el navegador la niega o no contesta, la escena cubre la ventana de todos modos
            let contesto = false;
            pedir?.then?.(() => { contesto = true; }, () => { contesto = true; if (!enNativa()) simular(true); });
            setTimeout(() => { if (!contesto && !enNativa() && !estado.completa) simular(true); }, 1200);
        } else if (enNativa()) {
            (document.exitFullscreen || document.webkitExitFullscreen).call(document);
        } else simular(false);
    });
    for (const ev of ['fullscreenchange', 'webkitfullscreenchange']) document.addEventListener(ev, () => ponerCompleta(Boolean(enNativa())));
    addEventListener('keydown', e => { if (e.key === 'Escape' && estado.completa && !enNativa()) simular(false); });

    window.addEventListener('message', event => {
        if (event.origin !== location.origin || event.data?.type !== 'concepto-select-part') return;
        tomarControl();
        elegirParte(Number(event.data.n) || 0);
        Object.assign(orbita, { az: 0, el: 0, k: 1 });
    });

    // Girar con el dedo o el ratón; acercar con la rueda o con dos dedos. Sobre una pieza, el dedo la arrastra.
    const punteros = new Map();
    let distanciaPinza = 0;
    const rayo = new Raycaster();
    const puntero = new Vector2();
    const planoArrastre = new Plane();
    const tomada = { n: 0, desde: new Vector3(), inicio: new Vector3(), punto: new Vector3() };
    const rayoDesde = e => {
        const r = lienzo.getBoundingClientRect();
        puntero.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        rayo.setFromCamera(puntero, camera);
    };
    lienzo.addEventListener('pointerdown', e => {
        tomarControl();
        punteros.set(e.pointerId, [e.clientX, e.clientY]);
        lienzo.setPointerCapture(e.pointerId);
        escena.classList.add('arrastra');
        if (punteros.size !== 1) { tomada.n = 0; return; }
        rayoDesde(e);
        const golpe = rayo.intersectObjects(raiz.children, true).find(g => g.object.visible && piezaDe(g.object));
        if (!golpe) return;
        tomada.n = piezaDe(golpe.object);
        planoArrastre.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new Vector3()).negate(), golpe.point);
        tomada.desde.copy(golpe.point);
        tomada.inicio.copy(arrastre[tomada.n]);
        if (parte !== tomada.n) elegirParte(tomada.n, { avisar: true });
    });
    lienzo.addEventListener('pointermove', e => {
        if (!punteros.has(e.pointerId)) return;
        if (tomada.n && punteros.size === 1) {
            rayoDesde(e);
            if (rayo.ray.intersectPlane(planoArrastre, tomada.punto)) {
                arrastre[tomada.n].copy(tomada.inicio).add(tomada.punto.sub(tomada.desde)).clampLength(0, 2.2);
                arrastre[tomada.n].y = Math.max(arrastre[tomada.n].y, -0.2);
            }
            ultimoToque = estado.T;
            return;
        }
        const [x0, y0] = punteros.get(e.pointerId);
        punteros.set(e.pointerId, [e.clientX, e.clientY]);
        if (punteros.size === 2) {
            const [a, b] = [...punteros.values()];
            const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
            if (distanciaPinza) orbita.k = clamp(orbita.k * (distanciaPinza / d), 0.45, 2);
            distanciaPinza = d;
            return;
        }
        orbita.az -= (e.clientX - x0) * 0.35;
        orbita.el = clamp(orbita.el + (e.clientY - y0) * 0.25, -15, 55);
        ultimoToque = estado.T;
    });
    const soltar = e => { punteros.delete(e.pointerId); distanciaPinza = 0; tomada.n = 0; if (!punteros.size) escena.classList.remove('arrastra'); };
    lienzo.addEventListener('pointerup', soltar);
    lienzo.addEventListener('pointercancel', soltar);
    lienzo.addEventListener('wheel', e => { e.preventDefault(); tomarControl(); orbita.k = clamp(orbita.k * Math.exp(e.deltaY * 0.0012), 0.45, 2); }, { passive: false });

    // ------------------------------------------------------------------ gráfica, cifras y medidas
    const curva = $('.g-curva canvas');
    const cg = curva?.getContext('2d');
    function dibujarCurva() {
        if (!cg) return;
        const pr = Math.min(devicePixelRatio || 1, 2);
        const w = curva.clientWidth;
        const h = curva.clientHeight;
        if (curva.width !== Math.round(w * pr)) { curva.width = Math.round(w * pr); curva.height = Math.round(h * pr); }
        cg.setTransform(pr, 0, 0, pr, 0, 0);
        cg.clearRect(0, 0, w, h);
        cg.strokeStyle = TEMA === 'oscuro' ? '#262a36' : '#d9dbdb';
        cg.lineWidth = 1;
        cg.beginPath(); cg.moveTo(0, h / 2); cg.lineTo(w, h / 2); cg.stroke();
        def.curva.dibujar(cg, w, h, estado);
    }
    const CIFRAS = {};
    const ponerCifra = (k, t) => { (CIFRAS[k] ??= [...app.querySelectorAll(`[data-c="${k}"]`)]).forEach(n => { n.textContent = t; }); };
    let alturaAvisada = 0;
    const avisarAltura = () => {
        if (estado.completa) return;
        const h = Math.ceil(document.documentElement.scrollHeight);
        if (Math.abs(h - alturaAvisada) < 2) return;
        alturaAvisada = h;
        parent.postMessage({ type: 'concepto-height', id: FIGURA, h }, location.origin);
    };
    function medir() {
        const w = escena.clientWidth;
        const h = escena.clientHeight;
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.fov = w / h < 1.1 ? 42 : 30;
        camera.updateProjectionMatrix();
        guia.setAttribute('viewBox', `0 0 ${w} ${h}`);
        avisarAltura();
    }
    const vigia = new ResizeObserver(medir);
    vigia.observe(document.body);
    vigia.observe(escena);
    medir();

    // ------------------------------------------------------------------ el recorrido
    // Arranca quieto, sube la entrada hasta su valor, visita cada pieza, se desarma un momento y se vuelve a armar.
    const PASO = 5.2;
    function guionRecorrido(dt) {
        recorrido.t += dt;
        const t = recorrido.t;
        if (t < 4) {
            ponerEntrada(Number(ent.min) + (Number(ent.valor) - Number(ent.min)) * Math.min(1, t / 3.4));
            if (parte) elegirParte(0);
            if (desarme) ponerDesarme(0);
            return;
        }
        // la máquina puede mover su entrada durante el recorrido (p. ej. la hora del día); si no, se queda en su valor
        if (def.entradaRecorrido) ponerEntrada(def.entradaRecorrido(t - 4));
        else if (estado.entradaObjetivo !== Number(ent.valor)) ponerEntrada(Number(ent.valor));
        const finPartes = 4 + PARTES.length * PASO;
        if (t < finPartes) {
            const paso = Math.floor((t - 4) / PASO);
            if (paso !== recorrido.paso) {
                recorrido.paso = paso;
                if (vista !== VISTAS[0].id) elegirVista(VISTAS[0].id);
                elegirParte(PARTES[paso].n);
            }
            return;
        }
        if (recorrido.paso !== 'desarme') { recorrido.paso = 'desarme'; elegirParte(0); }
        const u = t - finPartes;
        ponerDesarme(u < 1 ? 0 : u < 2.4 ? (u - 1) / 1.4 : u < 6 ? 1 : u < 7.4 ? 1 - (u - 6) / 1.4 : 0);
        if (u > 10) { ponerDesarme(0); Object.assign(recorrido, { t: 0, paso: -1 }); }
    }

    // ------------------------------------------------------------------ cada cuadro
    const proyectado = new Vector3();
    const extraV = new Vector3();
    const haciaV = new Vector3();
    const nums = $('.g-nums');
    const numEls = Object.fromEntries([...nums.children].map(el => [el.dataset.num, el]));
    let antes = performance.now();
    let visible = true;
    document.addEventListener('visibilitychange', () => { visible = document.visibilityState === 'visible'; });
    function cuadro(ahora) {
        requestAnimationFrame(cuadro);
        // un cuadro puede traer una marca de tiempo anterior al arranque (marco cargado en segundo plano): nunca negativo
        const dt = clamp((ahora - antes) / 1000, 0, 0.1);
        antes = ahora;
        if (!visible) return;
        estado.T += dt;
        if (recorrido.activo) guionRecorrido(dt);
        else if (estado.T - ultimoToque > 30 && !REDUCIR) { Object.assign(recorrido, { activo: true, t: 4, paso: -1 }); corteManual = false; pintarBotones(); }

        desarmeVis += (desarme - desarmeVis) * (1 - Math.exp(-dt / 0.35));
        const e = desarmeVis < 0.0005 ? 0 : desarmeVis * desarmeVis * (3 - 2 * desarmeVis);
        for (const n of Object.keys(arrastre)) if (Number(n) !== tomada.n) arrastre[n].multiplyScalar(Math.exp(-dt / 0.28));
        for (const m of movibles) {
            haciaV.set(...m.hacia);
            for (const o of m.objetos) o.position.copy(o.userData.base).addScaledVector(haciaV, e).add(arrastre[m.parte]);
        }
        plano.constant += ((corte ? 0 : 50) - plano.constant) * (1 - Math.exp(-dt / 0.25));
        Object.assign(estado, { dt, dtSim: dt * estado.lento.k, e, recorrido: recorrido.activo, w: escena.clientWidth, h: escena.clientHeight });

        // la física de la máquina (antes de la cámara); lo que dependa de la cámara va en despues()
        const salida = def.paso(estado) || {};

        // cámara: vista de la pieza (o la elegida) más lo que el visitante gire o acerque
        const p = PARTES.find(x => x.n === parte);
        const vistaActual = VISTAS.find(x => x.id === vista) || VISTAS[0];
        const meta = p ? { ...p.vista } : { ...vistaActual, d: vistaActual.d * (1 + (camera.aspect < 1.1 ? 0.12 : 0.35) * e), ty: vistaActual.ty + 0.4 * e };
        const corrida = p && anclas[p.n] ? desplazamiento(p.n) : new Vector3();
        meta.tx += corrida.x; meta.ty += corrida.y; meta.tz += corrida.z;
        const giro = recorrido.activo && !p ? Math.sin(estado.T * 0.15) * 8 : 0;
        const k = 1 - Math.exp(-dt / 0.45);
        cam.tx += (meta.tx - cam.tx) * k;
        cam.ty += (meta.ty - cam.ty) * k;
        cam.tz += (meta.tz - cam.tz) * k;
        cam.az += (meta.az + orbita.az + giro - cam.az) * k;
        cam.el += (clamp(meta.el + orbita.el, -10, 70) - cam.el) * k;
        // en vertical la máquina, que es ancha, necesita más distancia para caber
        const lejania = camera.aspect < 1.1 ? clamp((def.anchoVertical || 1.1) / camera.aspect, 1.25, def.lejaniaMax || 2.4) : 1;
        cam.d += (meta.d * orbita.k * lejania - cam.d) * k;
        // en pantalla completa las barras de abajo tapan; la cámara baja un poco y la máquina sube en el cuadro
        bajada += ((estado.completa ? 0.05 * cam.d : 0) - bajada) * k;
        camera.position.set(cam.tx + cam.d * Math.cos(cam.el * D2R) * Math.sin(cam.az * D2R), cam.ty - bajada + cam.d * Math.sin(cam.el * D2R), cam.tz + cam.d * Math.cos(cam.el * D2R) * Math.cos(cam.az * D2R));
        camera.lookAt(cam.tx, cam.ty - bajada, cam.tz);
        renderer.render(scene, camera);
        def.despues?.(estado);

        // etiqueta con su guía hacia la pieza
        const w = estado.w;
        const h = estado.h;
        if (p) {
            proyectado.set(...p.ancla).add(corrida).project(camera);
            const x = (proyectado.x * 0.5 + 0.5) * w;
            const y = (-proyectado.y * 0.5 + 0.5) * h;
            const ex = clamp(x + (x > w * 0.6 ? -150 : 40), 12, w - etiqueta.offsetWidth - 12);
            const ey = clamp(y - 70, 12, h - etiqueta.offsetHeight - 12);
            etiqueta.style.transform = `translate(${ex}px, ${ey}px)`;
            const linea = guia.querySelector('line');
            linea.setAttribute('x1', ex + etiqueta.offsetWidth / 2);
            linea.setAttribute('y1', ey + etiqueta.offsetHeight);
            linea.setAttribute('x2', x);
            linea.setAttribute('y2', y);
            guia.querySelector('circle').setAttribute('cx', x);
            guia.querySelector('circle').setAttribute('cy', y);
        }
        // desarmada, cada pieza lleva su número; la elegida se marca ahí, sin segunda etiqueta
        const verNums = clamp((e - 0.15) / 0.3, 0, 1);
        etiqueta.style.visibility = !p || verNums < 0.5 ? '' : 'hidden';
        guia.style.visibility = etiqueta.style.visibility;
        nums.style.opacity = String(verNums);
        nums.hidden = verNums === 0;
        if (verNums) {
            for (const [n, [obj, extra]] of Object.entries(anclas)) {
                obj.getWorldPosition(proyectado).add(extraV.set(...extra)).project(camera);
                const el = numEls[n];
                el.style.transform = `translate(${(proyectado.x * 0.5 + 0.5) * w}px, ${(-proyectado.y * 0.5 + 0.5) * h}px) translate(-50%, -50%)`;
                el.classList.toggle('activo', Number(n) === parte);
            }
        }
        for (const [id, texto] of Object.entries(salida.cifras || {})) ponerCifra(id, texto);
        dibujarCurva();
        pintarBotones();
    }
    pintarBotones();
    elegirParte(0);
    requestAnimationFrame(cuadro);
    addEventListener('load', avisarAltura);
    return { estado };
}
