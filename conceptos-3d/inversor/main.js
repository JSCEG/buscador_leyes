// «Inversor», en 3D: un banco de pruebas. Un panel solar da corriente directa; dentro del inversor, cuatro transistores
// (un puente H) la conmutan muy rápido hacia un lado y hacia el otro, y un filtro (bobina y capacitor) suaviza esos
// pulsos hasta dejar una onda senoidal de 60 Hz. Un osciloscopio muestra los pulsos (gris) y la onda filtrada (verde).
//
// Entrada: cuántos pulsos da el inversor en cada medio ciclo. Con 1 sale casi una onda cuadrada; con más pulsos, la
// onda filtrada se parece cada vez más a la senoidal de la red.
//
// Modelo (calculado aquí, no ilustrado): modulación senoidal de tres niveles con entrada de 200 V de corriente directa e
// índice 0.9 (180 V de pico, 127 V eficaces), y un filtro de segundo orden de 1 kHz. La distorsión (THD) sale de sumar
// los armónicos de la onda filtrada. Fuente técnica: U.S. Department of Energy, «Solar Integration: Inverters and Grid
// Services Basics».
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';
import { crearCorriente } from '../comun/corriente.js';

const F = 60;
const V_CD = 200;
const M = 0.9;
const FC = 1000;
const ZETA = 0.7;
const MUESTRAS = 3000;
const BASE = 0.16;
const PC = 0.182;

// una onda por número de pulsos, calculada una vez: los pulsos, la onda filtrada y su distorsión
const cache = new Map();
function onda(n) {
    if (cache.has(n)) return cache.get(n);
    const T = 1 / F;
    const dt = T / MUESTRAS;
    const w = 2 * Math.PI * FC;
    const portadora = t => { const x = ((t * F * 2 * n) % 1 + 1) % 1; return 1 - 4 * Math.abs(x - 0.5); }; // triangular −1…1
    const crudo = new Float32Array(MUESTRAS);
    const filtrado = new Float32Array(MUESTRAS);
    let x = 0;
    let v = 0;
    for (let ciclo = 0; ciclo < 6; ciclo++) {
        for (let i = 0; i < MUESTRAS; i++) {
            const t = i * dt;
            const ref = M * Math.sin(2 * Math.PI * F * t);
            const u = V_CD * ((ref > portadora(t) ? 1 : 0) - (-ref > portadora(t) ? 1 : 0));
            const a = w * w * (u - x) - 2 * ZETA * w * v;
            v += a * dt;
            x += v * dt;
            if (ciclo === 5) { crudo[i] = u; filtrado[i] = x; }
        }
    }
    // armónicos de la onda filtrada (del 1 al 60) para la distorsión y el voltaje de la fundamental
    let a1 = 0;
    let resto = 0;
    for (let h = 1; h <= 60; h++) {
        let s = 0;
        let c = 0;
        for (let i = 0; i < MUESTRAS; i++) { const ang = (2 * Math.PI * h * i) / MUESTRAS; s += filtrado[i] * Math.sin(ang); c += filtrado[i] * Math.cos(ang); }
        const amp = (2 / MUESTRAS) * Math.hypot(s, c);
        if (h === 1) a1 = amp; else resto += amp * amp;
    }
    const r = { crudo, filtrado, thd: Math.sqrt(resto) / a1, eficaz: a1 / Math.SQRT2 };
    cache.set(n, r);
    return r;
}

let fase = 0;
let pulsos = 6;
let piezasI = null;

crearMaquina({
    figura: 'inversor',
    nombre: 'el inversor',
    partes: [
        { n: 1, nombre: 'Panel solar', ancla: [-2.4, 1.4, 0], vista: { tx: -2.4, ty: 0.6, tz: 0, az: 18, el: 22, d: 2.8 } },
        { n: 2, nombre: 'Transistores', ancla: [-0.4, 0.9, 0.1], vista: { tx: -0.3, ty: 0.4, tz: 0.05, az: 6, el: 52, d: 2.0 } },
        { n: 3, nombre: 'Filtro (bobina y capacitor)', ancla: [0.2, 0.9, 0.1], vista: { tx: 0.15, ty: 0.4, tz: 0.05, az: -6, el: 48, d: 2.0 } },
        { n: 4, nombre: 'Osciloscopio', ancla: [1.4, 1.8, -0.6], vista: { tx: 1.35, ty: 0.95, tz: -0.5, az: 4, el: 6, d: 2.6 } },
        { n: 5, nombre: 'Salida a la casa', ancla: [2.4, 1.3, 0.7], vista: { tx: 2.3, ty: 0.6, tz: 0.7, az: -16, el: 14, d: 2.4 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: -0.1, ty: 0.75, tz: 0, az: 14, el: 22, d: 7.2 },
        { id: 'dentro', texto: 'Por dentro', tx: -0.1, ty: 0.4, tz: 0.05, az: 0, el: 55, d: 2.6 },
        { id: 'pantalla', texto: 'Pantalla', tx: 1.3, ty: 1.0, tz: -0.4, az: 0, el: 2, d: 2.4 },
    ],
    entrada: { etiqueta: 'Pulsos en cada medio ciclo', min: 1, max: 30, paso: 1, valor: 6, aria: 'Número de pulsos del inversor en cada medio ciclo' },
    selectores: [],
    lento: [
        { id: 'lento', texto: '1/60', k: 1 / 60, nota: 'Cámara lenta: un ciclo dura un segundo y se ven los transistores turnarse.' },
        { id: 'real', texto: 'Real', k: 1, nota: 'A velocidad real los transistores conmutan miles de veces por segundo.' },
    ],
    hud: '<b data-c="thd"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'entra', etiqueta: 'Entra', nota: 'corriente directa del panel' },
        { id: 'sale', etiqueta: 'Sale', nota: 'corriente alterna, 60 Hz' },
        { id: 'conmuta', etiqueta: 'Conmutaciones', nota: 'veces por segundo' },
        { id: 'parecido', etiqueta: 'Distorsión', nota: 'qué tanto se aleja de la senoidal' },
    ],
    curva: {
        titulo: 'Distorsión según los pulsos',
        leyenda: [{ texto: 'distorsión de la onda filtrada (THD)' }],
        nota: 'Con más pulsos, el filtro deja una onda más limpia. Calculado con el modelo de esta figura.',
        dibujar(g, w, h, estado) {
            const x = n => ((n - 1) / 29) * (w - 10) + 5;
            const y = d => h - 6 - (Math.min(d, 0.5) / 0.5) * (h - 14);
            g.lineWidth = 2.4;
            g.strokeStyle = estado.P.acento;
            g.beginPath();
            for (let n = 1; n <= 30; n++) { const d = onda(n).thd; if (n === 1) g.moveTo(x(n), y(d)); else g.lineTo(x(n), y(d)); }
            g.stroke();
            g.fillStyle = estado.P.acento;
            g.beginPath(); g.arc(x(pulsos), y(onda(pulsos).thd), 4.5, 0, Math.PI * 2); g.fill();
        },
    },
    corte: false,
    anchoVertical: 1.5,
    lejaniaMax: 2.7,
    entradaRecorrido: t => Math.round(15.5 - 14.5 * Math.cos(t * 0.25)),

    construir({ raiz, M: Mt, P, TEMA, sombra, contorno, escena }) {
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.16, 3.0), Mt.ceramica))).translateY(0.08));
        const curva = (...p) => new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));

        // 1 · panel solar inclinado, con su caja de conexiones (+ guinda, − grafito)
        const panel = new THREE.Group();
        panel.position.set(-2.4, BASE, 0);
        for (const x of [-0.35, 0.35]) panel.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 10), Mt.grafito)).translateX(x).translateY(0.35));
        const marco = new THREE.Group();
        marco.position.y = 0.75;
        marco.rotation.x = 0.6;
        marco.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.7), Mt.ceramica))));
        const celdas = Mt.mat('#2b3654', { roughness: 0.25, metalness: 0.4 });
        for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) marco.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.012, 0.2), celdas).translateX(-0.36 + i * 0.24).translateY(0.022).translateZ(-0.22 + j * 0.22));
        panel.add(marco);
        const caja = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.2), Mt.ceramica)));
        caja.position.set(0.2, 0.1, 0.35);
        panel.add(caja);
        raiz.add(panel);

        // 2 y 3 · el inversor: caja con tapa de vidrio; dentro, los cuatro transistores, la bobina y el capacitor
        const inv = new THREE.Group();
        inv.position.set(-0.2, BASE, 0);
        inv.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.9), Mt.ceramica))).translateY(0.03));
        for (const [x, z, w, d] of [[0, -0.43, 1.3, 0.04], [0, 0.43, 1.3, 0.04], [-0.63, 0, 0.04, 0.9], [0.63, 0, 0.04, 0.9]]) inv.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(w, 0.34, d), Mt.ceramica))).translateX(x).translateY(0.2).translateZ(z));
        for (const [x, z, w, d] of [[0, -0.44, 1.32, 0.05], [0, 0.44, 1.32, 0.05], [-0.64, 0, 0.05, 0.92], [0.64, 0, 0.05, 0.92]]) inv.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, d), Mt.borde)).translateX(x).translateY(0.38).translateZ(z));
        const tapa = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.01, 0.82), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, transparent: true, opacity: 0.15, depthWrite: false }));
        tapa.position.y = 0.39;
        tapa.renderOrder = 2;
        tapa.userData.sinResalte = true;
        inv.add(tapa);
        const transistores = [];
        [[-0.42, -0.18], [-0.12, -0.18], [-0.42, 0.18], [-0.12, 0.18]].forEach(([x, z]) => {
            const t = new THREE.Group();
            t.position.set(x, 0.06, z);
            t.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.14), Mt.grafito)).translateY(0.06));
            t.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.16), Mt.acero)).translateY(0.01));
            for (const dx of [-0.05, 0, 0.05]) t.add(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 6), Mt.acero).translateX(dx).translateY(0.05).translateZ(-0.09).rotateX(Math.PI / 2));
            const led = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), new THREE.MeshBasicMaterial({ color: P.grafito }));
            led.position.set(0, 0.14, 0.04);
            led.userData.sinResalte = true;
            t.add(led);
            inv.add(t);
            transistores.push({ t, led });
        });
        const bobina = sombra(new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.045, 14, 40), Mt.cobre));
        bobina.position.set(0.2, 0.17, 0);
        bobina.rotation.y = Math.PI / 2;
        const capacitor = new THREE.Group();
        capacitor.position.set(0.45, 0.06, 0.15);
        capacitor.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.24, 24), Mt.borde)).translateY(0.12));
        capacitor.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.071, 0.071, 0.02, 24), Mt.acero)).translateY(0.24));
        inv.add(bobina, capacitor);
        raiz.add(inv);

        // 4 · osciloscopio
        const osci = new THREE.Group();
        osci.position.set(1.4, BASE, -0.6);
        osci.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 0.8), Mt.ceramica))).translateY(0.5));
        osci.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.04, 0.82), Mt.borde)).translateY(0.98));
        const lienzo = document.createElement('canvas');
        lienzo.width = 512;
        lienzo.height = 340;
        const g = lienzo.getContext('2d');
        const textura = new THREE.CanvasTexture(lienzo);
        textura.colorSpace = THREE.SRGBColorSpace;
        const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.63), new THREE.MeshBasicMaterial({ map: textura }));
        pantalla.position.set(-0.15, 0.55, 0.412);
        pantalla.userData.sinResalte = true;
        const bisel = sombra(new THREE.Mesh(new THREE.BoxGeometry(1.03, 0.71, 0.02), Mt.grafito));
        bisel.position.set(-0.15, 0.55, 0.395);
        osci.add(bisel, pantalla);
        for (let i = 0; i < 3; i++) osci.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.05, 18).rotateX(Math.PI / 2), i === 0 ? Mt.borde : Mt.grafito)).translateX(0.5).translateY(0.75 - i * 0.2).translateZ(0.42));
        raiz.add(osci);

        // 5 · salida a la casa: contacto en su muro y un foco
        const salida = new THREE.Group();
        salida.position.set(2.4, BASE, 0.7);
        salida.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.4), Mt.ceramica))).translateY(0.03));
        salida.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 10), Mt.grafito)).translateY(0.3));
        salida.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.1, 20), Mt.borde)).translateY(0.58));
        const bulbo = new THREE.Mesh(new THREE.SphereGeometry(0.15, 28, 20), new THREE.MeshPhysicalMaterial({ color: '#fff7e0', emissive: P.corriente, emissiveIntensity: 0, roughness: 0.2, transparent: true, opacity: 0.85 }));
        bulbo.position.y = 0.76;
        const luz = new THREE.PointLight(TEMA === 'oscuro' ? '#ffd23f' : '#ffcf66', 0, 2.5);
        luz.position.y = 0.76;
        salida.add(bulbo, luz);
        raiz.add(salida);

        // cables: corriente directa del panel al inversor (par ida y regreso); alterna del inversor al foco; sonda al osciloscopio
        const cdIda = curva([-2.25, BASE + 0.12, 0.45], [-2.1, PC, 0.65], [-1.2, PC, 0.6], [-0.9, PC, 0.25], [-0.83, BASE + 0.2, 0.1]);
        const cdReg = curva([-0.83, BASE + 0.2, -0.1], [-0.95, PC, -0.3], [-1.6, PC, -0.1], [-2.05, PC, 0.3], [-2.15, BASE + 0.12, 0.45]);
        const caIda = curva([0.43, BASE + 0.2, 0.1], [0.7, PC, 0.45], [1.6, PC, 0.95], [2.2, PC, 0.85], [2.35, BASE + 0.06, 0.72]);
        const caReg = curva([2.45, BASE + 0.06, 0.68], [2.4, PC, 0.45], [1.6, PC, 0.6], [0.8, PC, 0.2], [0.43, BASE + 0.2, -0.1]);
        const sonda = curva([0.43, BASE + 0.25, -0.2], [0.75, PC, -0.3], [1.0, PC, -0.1], [1.9, PC, -0.1], [1.9, BASE + 0.35, -0.2]);
        const cables = new THREE.Group();
        for (const c of [cdIda, cdReg, caIda, caReg]) cables.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(c, 64, 0.022, 8, false), Mt.cable)));
        cables.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(sonda, 64, 0.016, 8, false), Mt.grafito)));
        raiz.add(cables);
        const corrienteCD = crearCorriente({ raiz, escena, curvas: [cdIda, cdReg], P, radio: 0.022, puntosPorCable: 16 });
        const corrienteCA = crearCorriente({ raiz, escena, curvas: [caIda, caReg], P, radio: 0.022, puntosPorCable: 16 });

        const fondo = TEMA === 'oscuro' ? '#0b1a14' : '#0f2219';
        piezasI = { g, lienzo, textura, fondo, transistores, bulbo, luz, corrienteCD, corrienteCA, P };
        return {
            piezas: { 1: [panel], 2: transistores.map(x => x.t), 3: [bobina, capacitor], 4: [osci], 5: [salida] },
            movibles: [
                { parte: 1, objetos: [panel], hacia: [-0.4, 0.2, 0] },
                { parte: 2, objetos: transistores.map(x => x.t), hacia: [-0.1, 0.9, 0] },
                { parte: 3, objetos: [bobina, capacitor], hacia: [0.1, 0.8, 0.1] },
                { parte: 4, objetos: [osci], hacia: [0.3, 0, -0.4] },
                { parte: 5, objetos: [salida], hacia: [0.4, 0, 0.3] },
            ],
            anclas: { 1: [panel, [0, 1.2, 0]], 2: [inv, [-0.27, 0.6, 0]], 3: [inv, [0.3, 0.6, 0]], 4: [osci, [0, 1.25, 0]], 5: [salida, [0, 1.1, 0]] },
        };
    },

    paso(estado) {
        const S = piezasI;
        const { dt, dtSim, e, arrastre } = estado;
        estado.entrada += (estado.entradaObjetivo - estado.entrada) * (1 - Math.exp(-dt / 0.15));
        pulsos = clamp(Math.round(estado.entrada), 1, 30);
        const o = onda(pulsos);
        fase = (fase + 2 * Math.PI * F * dtSim) % (2 * Math.PI * 1000);
        const conectado = 1 - clamp(Math.max(e * 8, arrastre[1].length() * 4, arrastre[5].length() * 4), 0, 1);
        const i = Math.floor(((fase / (2 * Math.PI)) % 1) * MUESTRAS);
        const u = o.crudo[i] * conectado;
        const vSal = o.filtrado[i] * conectado;

        // los transistores se turnan en diagonal: S1 y S4 dan el pulso positivo; S2 y S3, el negativo
        const lento = estado.lento.k < 0.1;
        S.transistores.forEach((t, k) => {
            const prende = lento ? ((k === 0 || k === 3) ? u > 0 : u < 0) : conectado > 0.5;
            t.led.material.color.set(prende ? ((k === 0 || k === 3) ? S.P.positivo : S.P.corriente) : S.P.grafito);
        });
        const brillo = lento ? (vSal / 180) ** 2 : 0.5;
        S.bulbo.material.emissiveIntensity = 1.6 * brillo * conectado;
        S.luz.intensity = 1.2 * brillo * conectado;

        // osciloscopio: dos ciclos; gris los pulsos, verde la onda filtrada; el punto va trazando
        const { g, lienzo } = S;
        const W = lienzo.width;
        const H = lienzo.height;
        g.fillStyle = S.fondo;
        g.fillRect(0, 0, W, H);
        g.strokeStyle = 'rgba(160, 200, 170, 0.18)';
        g.lineWidth = 1;
        for (let k = 1; k < 10; k++) { g.beginPath(); g.moveTo((k * W) / 10, 0); g.lineTo((k * W) / 10, H); g.stroke(); }
        for (let k = 1; k < 8; k++) { g.beginPath(); g.moveTo(0, (k * H) / 8); g.lineTo(W, (k * H) / 8); g.stroke(); }
        const escala = (H / 2 - 18) / 220;
        const yv = v => H / 2 - v * escala * conectado;
        const barrido = lento ? ((fase / (2 * Math.PI)) % 2) / 2 : 1;
        const trazo = (arr, color, ancho, sombraC) => {
            g.strokeStyle = color;
            g.lineWidth = ancho;
            g.shadowColor = sombraC || 'transparent';
            g.shadowBlur = sombraC ? 8 : 0;
            g.beginPath();
            for (let px = 0; px <= W * barrido; px += 1) {
                const k = Math.floor(((px / W) * 2 % 1) * MUESTRAS) % MUESTRAS;
                if (px === 0) g.moveTo(px, yv(arr[k])); else g.lineTo(px, yv(arr[k]));
            }
            g.stroke();
            g.shadowBlur = 0;
        };
        trazo(o.crudo, 'rgba(200, 210, 205, 0.45)', 1.5);
        trazo(o.filtrado, '#7ef0a6', 3, '#7ef0a6');
        g.fillStyle = 'rgba(200, 240, 210, 0.85)';
        g.font = '600 20px Manrope, sans-serif';
        g.fillText('50 V / div', 12, 26);
        g.fillText('3.3 ms / div', W - 130, 26);
        S.textura.needsUpdate = true;

        estado.inv = { conectado, vSal };
        const conmuta = 2 * pulsos * F;
        return {
            cifras: {
                thd: `Distorsión ${num(o.thd * 100, 1)} %`,
                hud: o.thd < 0.05 ? 'Onda casi senoidal: lista para la red' : o.thd < 0.15 ? 'Se parece a la senoidal, pero todavía con rizos' : 'Todavía se ven los escalones de los pulsos',
                entra: `${V_CD} V CD`,
                sale: `${num(o.eficaz * conectado)} V CA`,
                conmuta: num(conmuta),
                parecido: `${num(o.thd * 100, 1)} %`,
            },
        };
    },

    despues(estado) {
        const S = piezasI;
        const { conectado, vSal } = estado.inv;
        const base = { camara: estado.camara, w: estado.w, h: estado.h };
        S.corrienteCD.actualizar({ ...base, avance: 0.15, corriente: conectado, dt: estado.dt, visible: conectado, polos: 1 });
        const polos = 1 - clamp(F * estado.lento.k * 2 - 2, 0, 1);
        S.corrienteCA.actualizar({ ...base, avance: 0.04 * 2 * Math.PI * F, corriente: (vSal / 180), dt: estado.dtSim, visible: conectado, polos });
    },
});
