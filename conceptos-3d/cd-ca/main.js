// «Corriente directa y corriente alterna», en 3D: un osciloscopio dibuja en su pantalla el voltaje de una pila
// (corriente directa: una línea plana) o de un contacto de la casa (corriente alterna: una ola de 60 ciclos por segundo).
//
// Entrada: cuánto tiempo cabe en la pantalla (5 a 100 milésimos de segundo). Con 50 ms caben 3 ciclos de 60 Hz.
//
// Cifras:
// - Pila: 1.5 V constantes.
// - Contacto en México: 127 V eficaces, que son 127 × √2 ≈ 180 V de pico; 60 Hz, cada ciclo dura 1 ÷ 60 = 16.7 ms.
// - El Sistema Eléctrico Nacional mantiene la frecuencia entre 59.8 y 60.2 Hz en operación normal.
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';
import { crearCorriente } from '../comun/corriente.js';

const F = 60;
const V_PILA = 1.5;
const V_EFICAZ = 127;
const V_PICO = V_EFICAZ * Math.SQRT2;
const BASE = 0.16;
const PC = 0.182;

let fase = 0;
let ventanaMs = 50;
let piezasC = null;

crearMaquina({
    figura: 'cd-ca',
    nombre: 'el osciloscopio',
    partes: [
        { n: 1, nombre: 'Pila (corriente directa)', ancla: [-2.4, 0.95, 0.9], vista: { tx: -2.3, ty: 0.5, tz: 0.8, az: 16, el: 20, d: 2.6 } },
        { n: 2, nombre: 'Contacto (corriente alterna)', ancla: [-2.5, 1.5, -1.0], vista: { tx: -2.4, ty: 0.85, tz: -0.9, az: 12, el: 10, d: 2.8 } },
        { n: 3, nombre: 'Osciloscopio', ancla: [0.9, 2.0, 0], vista: { tx: 0.8, ty: 0.95, tz: 0, az: 16, el: 12, d: 4.0 } },
        { n: 4, nombre: 'Pantalla', ancla: [0.55, 1.75, 0.5], vista: { tx: 0.55, ty: 1.05, tz: 0.4, az: 2, el: 4, d: 2.4 } },
        { n: 5, nombre: 'Cable de medición', ancla: [-0.9, 0.55, 0.6], vista: { tx: -1.0, ty: 0.4, tz: 0.2, az: 18, el: 30, d: 3.8 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: -0.4, ty: 0.85, tz: 0, az: 18, el: 20, d: 7.4 },
        { id: 'pantalla', texto: 'Pantalla', tx: 0.55, ty: 1.05, tz: 0.4, az: 0, el: 2, d: 2.6 },
        { id: 'arriba', texto: 'Arriba', tx: -0.4, ty: 0.3, tz: 0, az: 0, el: 70, d: 7.4 },
    ],
    entrada: { etiqueta: 'Tiempo en la pantalla', min: 5, max: 100, paso: 1, valor: 50, aria: 'Tiempo que cabe en la pantalla, en milisegundos' },
    selectores: [{ id: 'fuente', etiqueta: 'Qué se mide', valor: 'contacto', opciones: [{ id: 'pila', texto: 'Pila (CD)' }, { id: 'contacto', texto: 'Contacto (CA)' }] }],
    lento: [
        { id: 'lento', texto: '1/60', k: 1 / 60, nota: 'Cámara lenta: un ciclo de la red dura un segundo.' },
        { id: 'real', texto: 'Real', k: 1, nota: 'A velocidad real la ola pasa 60 veces cada segundo.' },
    ],
    hud: '<b data-c="ahora"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'fuente', etiqueta: 'Fuente', nota: 'lo que mide el osciloscopio' },
        { id: 'frecuencia', etiqueta: 'Frecuencia', nota: 'ciclos por segundo' },
        { id: 'ciclo', etiqueta: 'Un ciclo dura', nota: 'T = 1 ÷ f' },
        { id: 'ciclos', etiqueta: 'Ciclos en la pantalla', nota: 'según el tiempo que cabe' },
    ],
    curva: null,
    corte: false,

    construir({ raiz, M, P, TEMA, sombra, contorno, escena }) {
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.16, 3.0), M.ceramica))).translateY(0.08));
        // 1 · pila grande de 1.5 V acostada
        const pila = new THREE.Group();
        pila.position.set(-2.4, BASE + 0.2, 0.9);
        pila.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.75, 36).rotateZ(Math.PI / 2), M.ceramica)), 40));
        pila.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.16, 36).rotateZ(Math.PI / 2), M.borde)).translateX(0.18));
        pila.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 18).rotateZ(Math.PI / 2), M.borde)).translateX(0.41));
        pila.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.32), M.grafito)).translateY(-0.18));
        raiz.add(pila);
        // 2 · contacto en su muro, con clavija
        const contacto = new THREE.Group();
        contacto.position.set(-2.5, BASE, -1.2);
        contacto.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.08), M.ceramica))).translateY(0.5));
        const placa = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.46, 0.03), M.ceramica)));
        placa.position.set(0, 0.6, 0.055);
        contacto.add(placa, sombra(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.42, 0.012), M.borde)).translateY(0.6).translateZ(0.04));
        for (const x of [-0.06, 0.06]) contacto.add(new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.07, 0.01), M.grafito).translateX(x).translateY(0.65).translateZ(0.072));
        contacto.add(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.01, 16).rotateX(Math.PI / 2), M.grafito).translateY(0.55).translateZ(0.072));
        contacto.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.12), M.grafito)).translateY(0.63).translateZ(0.13));
        raiz.add(contacto);
        // 3 y 4 · osciloscopio: caja blanca, perillas, y la pantalla que se dibuja en vivo
        const osci = new THREE.Group();
        osci.position.set(0.9, BASE, 0);
        osci.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.25, 1.0), M.ceramica))).translateY(0.625));
        osci.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.05, 1.02), M.borde)).translateY(1.2));
        for (let i = 0; i < 4; i++) {
            const p = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.075, 0.06, 20).rotateX(Math.PI / 2), i === 0 ? M.borde : M.grafito));
            p.position.set(0.6, 0.95 - i * 0.22, 0.52);
            osci.add(p);
        }
        const borne = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 16).rotateX(Math.PI / 2), M.borde));
        borne.position.set(0.6, 0.15, 0.52);
        osci.add(borne);
        const lienzo = document.createElement('canvas');
        lienzo.width = 512;
        lienzo.height = 340;
        const g = lienzo.getContext('2d');
        const textura = new THREE.CanvasTexture(lienzo);
        textura.colorSpace = THREE.SRGBColorSpace;
        const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.7), new THREE.MeshBasicMaterial({ map: textura }));
        pantalla.position.set(-0.3, 0.7, 0.512); // delante del marco (su frente está en 0.505)
        pantalla.userData.sinResalte = true;
        const marco = sombra(new THREE.Mesh(new THREE.BoxGeometry(1.13, 0.78, 0.02), M.grafito));
        marco.position.set(-0.3, 0.7, 0.495);
        osci.add(marco, pantalla);
        raiz.add(osci);
        // 5 · cable de medición: del borne del osciloscopio por la base a la pila o al contacto
        const curva = (...p) => new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));
        const aPila = curva([1.5, BASE + 0.15, 0.6], [1.4, PC, 0.9], [0.0, PC, 1.2], [-1.6, PC, 1.15], [-1.95, BASE + 0.2, 0.9]);
        const aContacto = curva([1.5, BASE + 0.15, 0.6], [1.6, PC, 0.2], [1.0, PC, -0.75], [-1.5, PC, -0.9], [-2.4, PC, -0.95], [-2.5, 0.75, -1.06]);
        const cables = new THREE.Group();
        const tPila = sombra(new THREE.Mesh(new THREE.TubeGeometry(aPila, 64, 0.022, 8, false), M.cable));
        const tContacto = sombra(new THREE.Mesh(new THREE.TubeGeometry(aContacto, 64, 0.022, 8, false), M.cable));
        cables.add(tPila, tContacto);
        raiz.add(cables);
        const corrientes = { pila: crearCorriente({ raiz, escena, curvas: [aPila], P }), contacto: crearCorriente({ raiz, escena, curvas: [aContacto], P }) };

        const fondo = TEMA === 'oscuro' ? '#0b1a14' : '#0f2219';
        piezasC = { g, lienzo, textura, corrientes, tPila, tContacto, fondo };
        return {
            piezas: { 1: [pila], 2: [contacto], 3: [osci], 4: [pantalla], 5: [cables] },
            movibles: [
                { parte: 1, objetos: [pila], hacia: [-0.3, 0.3, 0.3] },
                { parte: 2, objetos: [contacto], hacia: [-0.3, 0, -0.3] },
                { parte: 3, objetos: [osci], hacia: [0.4, 0, 0] },
            ],
            anclas: { 1: [pila, [0, 0.55, 0]], 2: [contacto, [0, 1.25, 0]], 3: [osci, [0, 1.6, 0]], 4: [osci, [-0.3, 1.25, 0.5]], 5: [cables, [-0.9, 0.4, 1.1]] },
        };
    },

    paso(estado) {
        const { g, lienzo, textura, tPila, tContacto, fondo } = piezasC;
        const { dt, dtSim, e, arrastre } = estado;
        estado.entrada += (estado.entradaObjetivo - estado.entrada) * (1 - Math.exp(-dt / 0.2));
        ventanaMs = estado.entrada;
        const pila = estado.sel.fuente === 'pila';
        const conectado = 1 - clamp(Math.max(e * 8, arrastre[pila ? 1 : 2].length() * 4, arrastre[3].length() * 4), 0, 1);
        fase += 2 * Math.PI * F * dtSim;
        tPila.visible = pila;
        tContacto.visible = !pila;
        // pantalla: rejilla, la curva (pila: línea plana; contacto: la ola), y el punto que la va trazando
        const W = lienzo.width;
        const H = lienzo.height;
        g.fillStyle = fondo;
        g.fillRect(0, 0, W, H);
        g.strokeStyle = 'rgba(160, 200, 170, 0.18)';
        g.lineWidth = 1;
        for (let i = 1; i < 10; i++) { g.beginPath(); g.moveTo((i * W) / 10, 0); g.lineTo((i * W) / 10, H); g.stroke(); }
        for (let j = 1; j < 8; j++) { g.beginPath(); g.moveTo(0, (j * H) / 8); g.lineTo(W, (j * H) / 8); g.stroke(); }
        g.strokeStyle = 'rgba(160, 200, 170, 0.45)';
        g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke();
        const escala = (H / 2 - 16) / 200; // 200 V arriba y abajo
        const escalaPila = (H / 2 - 16) / 2; // con la pila, ±2 V (la pantalla cambia de escala)
        const v = t => pila ? V_PILA : V_PICO * Math.sin(2 * Math.PI * F * t);
        // el trazo se dibuja hasta donde va el «punto» (un barrido cada ventana)
        const barrido = ((fase / (2 * Math.PI * F)) * 1000 % ventanaMs) / ventanaMs;
        g.strokeStyle = '#7ef0a6';
        g.lineWidth = 3;
        g.shadowColor = '#7ef0a6';
        g.shadowBlur = 8;
        g.beginPath();
        let ultimo = [0, 0];
        for (let px = 0; px <= W * barrido; px += 2) {
            const t = (px / W) * ventanaMs / 1000;
            const y = H / 2 - v(t) * conectado * (pila ? escalaPila : escala);
            if (px === 0) g.moveTo(px, y); else g.lineTo(px, y);
            ultimo = [px, y];
        }
        g.stroke();
        g.shadowBlur = 0;
        g.fillStyle = '#d9ffe6';
        g.beginPath(); g.arc(ultimo[0], ultimo[1], 6, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(200, 240, 210, 0.85)';
        g.font = '600 20px Manrope, sans-serif';
        g.fillText(pila ? '0.5 V / div' : '50 V / div', 12, 26);
        g.fillText(`${num(ventanaMs / 10, 1)} ms / div`, W - 140, 26);
        textura.needsUpdate = true;

        const ahora = pila ? V_PILA * conectado : V_PICO * Math.sin(fase) * conectado;
        estado.cdca = { pila, conectado };
        return {
            cifras: {
                ahora: `${ahora >= 0 ? '+' : '−'}${num(Math.abs(ahora), pila ? 1 : 0)} V`,
                hud: pila ? 'Corriente directa: siempre el mismo voltaje' : `Corriente alterna: 127 V eficaces, ${num(V_PICO)} V de pico`,
                fuente: pila ? 'Pila, 1.5 V' : 'Contacto, 127 V',
                frecuencia: pila ? '0 Hz' : `${F} Hz`,
                ciclo: pila ? 'no cambia' : `${num(1000 / F, 1)} ms`,
                ciclos: pila ? '—' : `${num(ventanaMs * F / 1000, 1)}`,
            },
        };
    },

    despues(estado) {
        const { corrientes } = piezasC;
        const { pila, conectado } = estado.cdca;
        const base = { camara: estado.camara, w: estado.w, h: estado.h };
        corrientes.pila.actualizar({ ...base, avance: 0.15, corriente: conectado, dt: estado.dt, visible: pila ? conectado : 0, polos: 1 });
        const polos = 1 - clamp(F * estado.lento.k * 2 - 2, 0, 1);
        corrientes.contacto.actualizar({ ...base, avance: 0.04 * 2 * Math.PI * F, corriente: Math.sin(fase) * conectado, dt: estado.dtSim, visible: pila ? 0 : conectado, polos });
    },
});
