// «Voltaje, corriente y potencia», en 3D: una fuente de poder con su perilla alimenta un foco. Un voltímetro mide el
// voltaje en el foco; un amperímetro mide la corriente a la ida y otro al regreso (marcan lo mismo: la corriente no se
// gasta, se gasta la energía).
//
// Entrada: el voltaje de la fuente (0 a 12 V).
//
// Cifras (las de la ficha): foco de unos 6 Ω. Ley de Ohm, I = V ÷ R: con 12 V, 2 A. Potencia, P = V × I: 24 W.
// Energía, E = P × t: en una hora, 24 Wh (0.024 kWh).
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';
import { crearCorriente } from '../comun/corriente.js';

const R_FOCO = 6;
const V_MAX = 12;
const BASE = 0.16;
const PC = 0.182;

let volts = 12;
let amperes = 2;
let brillo = 0;
let piezasV = null;

// pantalla digital: textura de canvas que se vuelve a dibujar solo cuando cambia el texto
function pantalla(ancho, alto) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = Math.round(256 * alto / ancho);
    const g = c.getContext('2d');
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ map: t }));
    m.userData.sinResalte = true;
    let ultimo = '';
    m.userData.poner = texto => {
        if (texto === ultimo) return;
        ultimo = texto;
        g.fillStyle = '#e9efe6';
        g.fillRect(0, 0, c.width, c.height);
        g.fillStyle = '#0a0707';
        g.font = `700 ${Math.round(Math.min(c.height * 0.62, 64 * (c.width / 256) * 1.6))}px Manrope, sans-serif`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(texto, c.width / 2, c.height / 2 + 4);
        t.needsUpdate = true;
    };
    return m;
}

crearMaquina({
    figura: 'voltaje',
    nombre: 'el circuito',
    partes: [
        { n: 1, nombre: 'Fuente de poder', ancla: [-2.2, 1.25, 0.2], vista: { tx: -2.2, ty: 0.6, tz: 0.2, az: 18, el: 16, d: 3.0 } },
        { n: 2, nombre: 'Voltímetro (V)', ancla: [1.3, 1.3, 1.05], vista: { tx: 1.4, ty: 0.6, tz: 1.0, az: 6, el: 16, d: 2.6 } },
        { n: 3, nombre: 'Amperímetro (A)', ancla: [-0.6, 1.0, 1.0], vista: { tx: -0.6, ty: 0.5, tz: 1.0, az: 6, el: 18, d: 2.4 } },
        { n: 4, nombre: 'Perilla de voltaje', ancla: [-1.95, 0.95, 0.75], vista: { tx: -2.0, ty: 0.55, tz: 0.6, az: 12, el: 18, d: 2.0 } },
        { n: 5, nombre: 'Cables', ancla: [0.4, 0.5, 1.3], vista: { tx: 0.2, ty: 0.3, tz: 0.6, az: 22, el: 34, d: 4.4 } },
        { n: 6, nombre: 'Foco', ancla: [2.4, 1.65, 0.1], vista: { tx: 2.4, ty: 0.9, tz: 0.1, az: -12, el: 12, d: 2.6 } },
        { n: 7, nombre: 'Amperímetro de regreso', ancla: [0.4, 1.0, -0.85], vista: { tx: 0.4, ty: 0.5, tz: -0.85, az: 8, el: 20, d: 2.4 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: 0, ty: 0.7, tz: 0, az: 20, el: 26, d: 7.8 },
        { id: 'frente', texto: 'Frente', tx: 0, ty: 0.7, tz: 0, az: 0, el: 10, d: 7.2 },
        { id: 'arriba', texto: 'Arriba', tx: 0, ty: 0.3, tz: 0, az: 0, el: 70, d: 7.8 },
        { id: 'medidores', texto: 'Medidores', tx: 0.1, ty: 0.6, tz: 0.4, az: 4, el: 22, d: 5.0 },
    ],
    entrada: { etiqueta: 'Voltaje de la fuente', min: 0, max: V_MAX, paso: 0.1, valor: 12, aria: 'Voltaje de la fuente de poder, en volts' },
    lento: [{ id: 'normal', texto: 'Normal', k: 1, nota: 'La corriente directa va siempre en el mismo sentido.' }],
    entradaRecorrido: t => 6 + 6 * Math.cos((t / 30) * Math.PI * 2),
    hud: '<b data-c="potencia"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'voltaje', etiqueta: 'Voltaje', nota: 'el empuje, en volts' },
        { id: 'corriente', etiqueta: 'Corriente', nota: 'I = V ÷ R, con R = 6 Ω' },
        { id: 'potencia', etiqueta: 'Potencia', nota: 'P = V × I, en watts' },
        { id: 'energia', etiqueta: 'Energía en una hora', nota: 'E = P × t' },
    ],
    curva: {
        titulo: 'Corriente y potencia según el voltaje',
        leyenda: [{ texto: 'potencia (W)' }, { texto: 'corriente (A × 10)' }],
        nota: 'La corriente crece en línea recta con el voltaje; la potencia crece más rápido (V × V ÷ R).',
        dibujar(g, w, h, estado) {
            const x = v => (v / V_MAX) * (w - 8) + 4;
            const y = val => h - 6 - (val / 26) * (h - 14);
            g.lineWidth = 1.4;
            g.strokeStyle = estado.P.tinta;
            g.beginPath(); g.moveTo(x(0), y(0)); g.lineTo(x(V_MAX), y((V_MAX / R_FOCO) * 10)); g.stroke();
            g.lineWidth = 2.4;
            g.strokeStyle = estado.P.acento;
            g.beginPath();
            for (let v = 0; v <= V_MAX; v += 0.2) { const p = v * v / R_FOCO; if (v === 0) g.moveTo(x(v), y(p)); else g.lineTo(x(v), y(p)); }
            g.stroke();
            g.fillStyle = estado.P.acento;
            g.beginPath(); g.arc(x(volts), y(volts * amperes), 4.5, 0, Math.PI * 2); g.fill();
        },
    },
    corte: false,

    construir({ raiz, M, P, sombra, contorno, escena }) {
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.16, 3.0), M.ceramica))).translateY(0.08));
        const caja = (w, h, d) => contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.ceramica)));
        // 1 y 4 · fuente de poder con su pantalla, su perilla guinda y dos bornes (+ guinda, − grafito)
        const fuente = new THREE.Group();
        fuente.position.set(-2.2, BASE, 0.2);
        fuente.add(caja(1.0, 0.8, 0.8).translateY(0.4));
        const pFuente = pantalla(0.5, 0.2);
        pFuente.position.set(-0.15, 0.6, 0.402);
        fuente.add(pFuente);
        const perilla = new THREE.Group();
        perilla.position.set(0.25, 0.42, 0.42);
        perilla.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.08, 28).rotateX(Math.PI / 2), M.borde)));
        perilla.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.09, 0.02), M.ceramica)).translateY(0.05).translateZ(0.05));
        fuente.add(perilla);
        const borne = (x, mat) => fuente.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.08, 14).rotateX(Math.PI / 2), mat)).translateX(x).translateY(0.16).translateZ(0.43));
        borne(-0.3, M.borde);
        borne(-0.1, M.grafito);
        raiz.add(fuente);
        // medidores: caja blanca, pantalla y letra
        const medidor = (x, z, letra) => {
            const g = new THREE.Group();
            g.position.set(x, BASE, z);
            g.add(caja(0.55, 0.42, 0.3).translateY(0.21));
            const p = pantalla(0.42, 0.17);
            p.position.set(0, 0.28, 0.152);
            const l = pantalla(0.12, 0.1);
            l.position.set(0, 0.1, 0.152);
            l.userData.poner(letra);
            g.add(p, l);
            raiz.add(g);
            return { g, p };
        };
        const amperimetro = medidor(-0.6, 1.0, 'A');
        const voltimetro = medidor(1.4, 1.05, 'V');
        const amperimetro2 = medidor(0.4, -0.85, 'A');
        // 6 · foco
        const foco = new THREE.Group();
        foco.position.set(2.4, BASE, 0.1);
        foco.add(caja(0.5, 0.12, 0.5).translateY(0.06));
        foco.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.75, 12), M.grafito)).translateY(0.5));
        foco.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.2, 24), M.grafito)).translateY(0.95));
        foco.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.018, 10, 40).rotateX(Math.PI / 2), M.borde)).translateY(1.05));
        const vidrio = new THREE.Mesh(new THREE.SphereGeometry(0.26, 32, 24), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.05, transparent: true, opacity: 0.28, emissive: new THREE.Color('#ffcc66'), emissiveIntensity: 0 }));
        vidrio.position.y = 1.26;
        vidrio.userData.sinResalte = true;
        const luz = new THREE.PointLight('#ffcf7a', 0, 4, 1.6);
        luz.position.y = 1.26;
        foco.add(vidrio, luz);
        raiz.add(foco);
        // 5 · cables por la base: + de la fuente → amperímetro → foco; foco → amperímetro de regreso → − de la fuente;
        // y el voltímetro, en paralelo con el foco
        const curva = (...p) => new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));
        const ida = [
            curva([-2.5, 0.32, 0.66], [-2.45, PC, 0.9], [-1.4, PC, 1.15], [-0.9, PC, 1.15], [-0.87, 0.3, 1.0]),
            curva([-0.33, 0.3, 1.0], [-0.2, PC, 1.2], [1.0, PC, 1.35], [2.1, PC, 0.7], [2.15, 0.2, 0.25]),
        ];
        const regreso = [
            curva([-2.3, 0.32, 0.66], [-2.2, PC, 0.0], [-1.0, PC, -0.8], [0.0, PC, -0.95], [0.12, 0.3, -0.85]),
            curva([0.68, 0.3, -0.85], [1.0, PC, -0.9], [2.2, PC, -0.5], [2.4, 0.2, -0.16]),
        ];
        const aVoltimetro = [curva([2.2, 0.2, 0.35], [1.9, PC, 0.9], [1.68, 0.3, 1.05]), curva([2.6, 0.2, 0.3], [2.1, PC, 1.25], [1.15, PC, 1.25], [1.12, 0.3, 1.05])];
        const cables = new THREE.Group();
        [...ida, ...regreso].forEach(c => cables.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(c, 64, 0.022, 8, false), M.cable))));
        aVoltimetro.forEach(c => cables.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(c, 48, 0.014, 8, false), M.cable))));
        raiz.add(cables);
        // la corriente: par ida (+) y regreso (−); por el voltímetro casi no pasa (tiene una resistencia enorme)
        const corrientes = [0, 1].map(i => crearCorriente({ raiz, escena, curvas: [ida[i], regreso[i]], P, radio: 0.026, puntosPorCable: 16 }));

        piezasV = { pFuente, perilla, amperimetro, voltimetro, amperimetro2, vidrio, luz, corrientes };
        return {
            piezas: { 1: [fuente], 2: [voltimetro.g], 3: [amperimetro.g], 4: [perilla], 5: [cables], 6: [foco], 7: [amperimetro2.g] },
            movibles: [
                { parte: 1, objetos: [fuente], hacia: [-0.4, 0, 0] },
                { parte: 2, objetos: [voltimetro.g], hacia: [0, 0.5, 0.3] },
                { parte: 3, objetos: [amperimetro.g], hacia: [0, 0.5, 0.3] },
                { parte: 6, objetos: [foco], hacia: [0.4, 0, 0] },
                { parte: 7, objetos: [amperimetro2.g], hacia: [0, 0.5, -0.3] },
            ],
            anclas: { 1: [fuente, [0, 1.05, 0]], 2: [voltimetro.g, [0, 0.7, 0]], 3: [amperimetro.g, [0, 0.7, 0]], 4: [fuente, [0.25, 0.75, 0.45]], 5: [cables, [0.2, 0.4, 1.3]], 6: [foco, [0, 1.65, 0]], 7: [amperimetro2.g, [0, 0.7, 0]] },
        };
    },

    paso(estado) {
        const { pFuente, perilla, amperimetro, voltimetro, amperimetro2, vidrio, luz } = piezasV;
        const { dt, e, arrastre } = estado;
        estado.entrada += (estado.entradaObjetivo - estado.entrada) * (1 - Math.exp(-dt / 0.2));
        volts = estado.entrada;
        // el camino se corta si se desarma o se mueve la fuente, el foco o un amperímetro
        const camino = 1 - clamp(Math.max(e * 8, ...[1, 3, 6, 7].map(n => arrastre[n].length() * 4)), 0, 1);
        amperes = (volts / R_FOCO) * camino;
        const watts = volts * amperes;
        perilla.rotation.z = -(volts / V_MAX) * Math.PI * 1.5 + Math.PI * 0.75;
        pFuente.userData.poner(`${num(volts, 1)} V`);
        amperimetro.p.userData.poner(`${num(amperes, 2)} A`);
        amperimetro2.p.userData.poner(`${num(amperes, 2)} A`);
        voltimetro.p.userData.poner(`${num(volts * camino, 1)} V`);
        brillo += (((watts / 24)) - brillo) * (1 - Math.exp(-dt / 0.1));
        vidrio.material.emissiveIntensity = clamp(brillo, 0, 1.2) * 1.6;
        luz.intensity = clamp(brillo, 0, 1.2) * 3.5;
        estado.volt = { camino };
        return {
            cifras: {
                potencia: `${num(watts, 1)} W`,
                hud: `${num(volts, 1)} V × ${num(amperes, 2)} A`,
                voltaje: `${num(volts, 1)} V`,
                corriente: `${num(amperes, 2)} A`,
                energia: `${num(watts, 1)} Wh`,
            },
        };
    },

    despues(estado) {
        const { corrientes } = piezasV;
        const base = { avance: 0.18, dt: estado.dt, camara: estado.camara, w: estado.w, h: estado.h };
        const visible = clamp(amperes / 0.3, 0, 1);
        corrientes.forEach((c, i) => c.actualizar({ ...base, corriente: amperes / 2, visible, polos: i === 0 ? 1 : 0 }));
    },
});
