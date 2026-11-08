// «Cómo se equilibra la red», en 3D: la red no guarda energía, así que lo que se genera debe igualar a lo que se consume
// en cada instante. Un gran volante (los generadores que giran sincronizados) marca la frecuencia: si la demanda sube y
// la generación no, el volante se frena y la frecuencia baja de 60 Hz. Entonces responden las reservas: las baterías en
// fracciones de segundo, la reserva rodante en segundos y el control del CENACE poco a poco hasta regresar a 60 Hz.
//
// Entrada: la demanda del sistema (MW). Botón: con o sin reserva.
//
// Modelo (calculado aquí): sistema de ejemplo de 10,000 MW, inercia H = 5 s, estatismo del 5 % en la reserva rodante
// (hasta 800 MW, 4 s), baterías de hasta 300 MW (0.3 s), control automático de generación integral, y la carga que baja
// 2 % por cada 1 % que baja la frecuencia. La ecuación de oscilación: df/dt = 60 · (G − D) ÷ (2 · H · S).
// Fuente técnica: U.S. Department of Energy, «Solar Integration: Inverters and Grid Services Basics» (frecuencia e inercia).
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';

const S = 10000;
const H = 5;
const BASE_MW = 10000;
const RESERVA = 800;
const BATERIA = 300;
const BASE = 0.16;

let piezasE = null;
let f = 60;
let pr = 0;
let pb = 0;
let agc = 0;
let giro = 0;
let reloj = 0;
const historia = [];

crearMaquina({
    figura: 'equilibrio-red',
    nombre: 'la red',
    partes: [
        { n: 1, nombre: 'Generadores (inercia)', ancla: [-0.2, 1.9, 0], vista: { tx: -0.2, ty: 0.9, tz: 0, az: 10, el: 14, d: 3.2 } },
        { n: 2, nombre: 'Reserva rodante', ancla: [-2.3, 1.7, -0.5], vista: { tx: -2.3, ty: 0.7, tz: -0.5, az: 16, el: 14, d: 2.6 } },
        { n: 3, nombre: 'Baterías', ancla: [-2.3, 1.0, 0.8], vista: { tx: -2.3, ty: 0.4, tz: 0.8, az: 14, el: 16, d: 2.2 } },
        { n: 4, nombre: 'Demanda', ancla: [2.4, 1.4, 0.2], vista: { tx: 2.4, ty: 0.6, tz: 0.2, az: -14, el: 16, d: 2.8 } },
        { n: 5, nombre: 'Medidor de frecuencia', ancla: [0.2, 2.4, 0.8], vista: { tx: 0.0, ty: 1.55, tz: 0.6, az: 0, el: 4, d: 1.8 } },
        { n: 6, nombre: 'Control del CENACE', ancla: [1.1, 1.3, -1.1], vista: { tx: 1.1, ty: 0.6, tz: -1.0, az: -6, el: 10, d: 2.2 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: 0, ty: 0.85, tz: 0, az: 10, el: 18, d: 7.2 },
        { id: 'medidor', texto: 'Frecuencia', tx: 0.0, ty: 1.55, tz: 0.6, az: 0, el: 4, d: 2.0 },
        { id: 'arriba', texto: 'Arriba', tx: 0, ty: 0.3, tz: 0, az: 0, el: 70, d: 7.2 },
    ],
    entrada: { etiqueta: 'Demanda del sistema', min: 9000, max: 11000, paso: 50, valor: 10000, aria: 'Demanda del sistema en megawatts' },
    selectores: [{ id: 'reserva', etiqueta: 'Reservas', valor: 'con', opciones: [{ id: 'con', texto: 'Con reserva' }, { id: 'sin', texto: 'Sin reserva' }] }],
    lento: [
        { id: 'real', texto: 'Real', k: 1, nota: 'A velocidad real: las baterías responden en fracciones de segundo y la reserva en segundos.' },
        { id: 'lento', texto: 'Despacio', k: 0.35, nota: 'Los segundos pasan más despacio para ver quién responde primero.' },
    ],
    hud: '<b data-c="hz"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'demanda', etiqueta: 'Demanda', nota: 'lo que se consume' },
        { id: 'genera', etiqueta: 'Generación', nota: 'lo que se produce' },
        { id: 'reserva', etiqueta: 'Reserva en uso', nota: `de ${num(RESERVA)} MW` },
        { id: 'bateria', etiqueta: 'Baterías', nota: `de ${num(BATERIA)} MW` },
    ],
    curva: {
        titulo: 'Frecuencia en los últimos 40 segundos',
        leyenda: [{ texto: 'frecuencia (Hz)' }, { texto: '60 Hz' }],
        nota: 'Al subir la demanda, la frecuencia cae; las reservas la frenan y el control del CENACE la regresa a 60 Hz.',
        dibujar(g, w, h, estado) {
            const y = hz => h / 2 - ((hz - 60) / 1.2) * (h / 2 - 6);
            g.lineWidth = 1.2;
            g.strokeStyle = estado.P.tinta;
            g.setLineDash([4, 4]);
            g.beginPath(); g.moveTo(4, y(60)); g.lineTo(w - 4, y(60)); g.stroke();
            g.setLineDash([]);
            if (historia.length < 2) return;
            g.lineWidth = 2.4;
            g.strokeStyle = estado.P.acento;
            g.beginPath();
            historia.forEach((v, i) => { const x = 4 + (i / 399) * (w - 8); const yy = clamp(y(v), 2, h - 2); if (i === 0) g.moveTo(x, yy); else g.lineTo(x, yy); });
            g.stroke();
        },
    },
    corte: false,
    anchoVertical: 1.7,
    lejaniaMax: 2.9,
    entradaRecorrido: t => (Math.floor(t / 12) % 2 ? 10600 : 10000),

    construir({ raiz, M, P, sombra, contorno }) {
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.16, 3.0), M.ceramica))).translateY(0.08));
        const curva = (...p) => new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));
        const flujo = (c, n) => {
            raiz.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(c, 48, 0.02, 8, false), M.cable)));
            const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.024, 8, 6), new THREE.MeshBasicMaterial({ color: P.corriente }), n);
            im.frustumCulled = false;
            raiz.add(im);
            return { c, im, n, fase: 0 };
        };

        // 1 · el volante: todos los generadores que giran juntos, a la misma frecuencia
        const volante = new THREE.Group();
        volante.position.set(-0.2, BASE, 0);
        volante.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 0.7), M.ceramica))).translateY(0.15));
        for (const x of [-0.55, 0.55]) volante.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.3), M.grafito)).translateX(x).translateY(0.6));
        const rueda = new THREE.Group();
        rueda.position.y = 0.95;
        rueda.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.32, 48).rotateZ(Math.PI / 2), M.ceramica)), 40));
        for (const s of [-1, 1]) rueda.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.025, 10, 60).rotateY(Math.PI / 2), M.borde)).translateX(s * 0.16));
        for (let i = 0; i < 6; i++) { const r = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 1.0), M.borde)); r.rotation.x = (i * Math.PI) / 6; rueda.add(r); }
        rueda.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 16).rotateZ(Math.PI / 2), M.acero)));
        volante.add(rueda);
        raiz.add(volante);

        // 5 · medidor de frecuencia: carátula con aguja, de 59 a 61 Hz
        const medidor = new THREE.Group();
        medidor.position.set(0.0, BASE, 0.75);
        medidor.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 10), M.grafito)).translateY(0.6));
        const caratula = new THREE.Group();
        caratula.position.y = 1.4;
        caratula.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 40).rotateX(Math.PI / 2), M.ceramica)), 40));
        caratula.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.02, 10, 48), M.borde)));
        const escala = escalaHz(0.6);
        escala.position.z = 0.032;
        caratula.add(escala);
        const aguja = new THREE.Group();
        aguja.position.z = 0.045;
        aguja.add(new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.28, 0.008).translate(0, 0.13, 0), M.borde));
        aguja.add(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.02, 16).rotateX(Math.PI / 2), M.grafito));
        caratula.add(aguja);
        medidor.add(caratula);
        raiz.add(medidor);

        // 2 · reserva rodante: una central con su barra de potencia
        const reserva = new THREE.Group();
        reserva.position.set(-2.3, BASE, -0.5);
        reserva.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.6), M.ceramica))).translateY(0.25));
        reserva.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.04, 0.62), M.borde)).translateY(0.5));
        reserva.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.6, 16), M.ceramica)).translateY(0.8).translateX(0.25));
        const barraR = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.01), M.mat(P.corriente, { roughness: 0.5 }));
        barraR.position.set(0, 0.3, 0.306);
        reserva.add(barraR);
        raiz.add(reserva);

        // 3 · baterías
        const baterias = new THREE.Group();
        baterias.position.set(-2.3, BASE, 0.8);
        for (const x of [-0.25, 0.25]) {
            baterias.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.3), M.ceramica))).translateX(x).translateY(0.15));
            baterias.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.03, 0.32), M.borde)).translateX(x).translateY(0.31));
        }
        const barraB = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.01), M.mat(P.corriente, { roughness: 0.5 }));
        barraB.position.set(0, 0.16, 0.156);
        baterias.add(barraB);
        raiz.add(baterias);

        // 4 · la demanda: una ciudad cuyas ventanas se encienden según lo que consume
        const ciudad = new THREE.Group();
        ciudad.position.set(2.4, BASE, 0.2);
        const ventanas = [];
        [[-0.4, -0.4, 0.7], [0.15, -0.45, 1.0], [-0.35, 0.3, 0.5], [0.25, 0.3, 0.8], [0.6, -0.1, 0.45]].forEach(([x, z, alto]) => {
            ciudad.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.34, alto, 0.34), M.ceramica))).translateX(x).translateY(alto / 2).translateZ(z));
            ciudad.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.03, 0.36), M.borde)).translateX(x).translateY(alto).translateZ(z));
            for (let k = 0; k < Math.floor(alto / 0.16); k++) {
                const v = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.07), new THREE.MeshBasicMaterial({ color: P.grafito }));
                v.position.set(x, 0.12 + k * 0.16, z + 0.172);
                v.userData.sinResalte = true;
                ciudad.add(v);
                ventanas.push(v);
            }
        });
        raiz.add(ciudad);

        // 6 · control del CENACE: consola que manda la señal de ajuste a la reserva
        const consola = new THREE.Group();
        consola.position.set(1.1, BASE, -1.1);
        consola.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.4), M.ceramica))).translateY(0.2));
        consola.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.03, 0.42), M.borde)).translateY(0.4));
        const pantalla = pantallaTexto(0.56, 0.24);
        pantalla.position.set(0, 0.22, 0.205);
        consola.add(pantalla);
        raiz.add(consola);

        // flujos: de la reserva y las baterías al volante; del volante a la ciudad
        const fReserva = flujo(curva([-1.9, BASE + 0.2, -0.3], [-1.4, 0.19, -0.2], [-0.9, BASE + 0.2, -0.1]), 10);
        const fBateria = flujo(curva([-1.85, BASE + 0.15, 0.75], [-1.4, 0.19, 0.4], [-0.9, BASE + 0.2, 0.15]), 10);
        const fCiudad = flujo(curva([0.5, BASE + 0.2, 0.1], [1.2, 0.19, 0.3], [2.0, BASE + 0.2, 0.25]), 18);
        const senal = curva([1.1, BASE + 0.45, -1.1], [-0.6, BASE + 1.4, -1.1], [-2.3, BASE + 0.9, -0.6]);
        const linea = new THREE.Mesh(new THREE.TubeGeometry(senal, 48, 0.006, 6, false), new THREE.MeshBasicMaterial({ color: P.acento, transparent: true, opacity: 0.5 }));
        raiz.add(linea);
        const pulso = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), new THREE.MeshBasicMaterial({ color: P.acento }));
        raiz.add(pulso);

        piezasE = { rueda, aguja, barraR, barraB, ventanas, pantalla, fReserva, fBateria, fCiudad, senal, pulso };
        return {
            piezas: { 1: [volante], 2: [reserva], 3: [baterias], 4: [ciudad], 5: [medidor], 6: [consola, linea] },
            movibles: [
                { parte: 2, objetos: [reserva], hacia: [-0.3, 0.3, -0.3] },
                { parte: 3, objetos: [baterias], hacia: [-0.3, 0.2, 0.3] },
                { parte: 4, objetos: [ciudad], hacia: [0.4, 0, 0.2] },
                { parte: 5, objetos: [medidor], hacia: [0, 0.3, 0.4] },
                { parte: 6, objetos: [consola], hacia: [0.2, 0, -0.4] },
            ],
            anclas: { 1: [volante, [0, 1.7, 0]], 2: [reserva, [0, 1.2, 0]], 3: [baterias, [0, 0.6, 0]], 4: [ciudad, [0, 1.2, 0]], 5: [medidor, [0, 1.85, 0]], 6: [consola, [0, 0.8, 0]] },
        };
    },

    paso(estado) {
        const E = piezasE;
        const { dt, dtSim } = estado;
        estado.entrada += (estado.entradaObjetivo - estado.entrada) * (1 - Math.exp(-dt / 0.15));
        const demanda = estado.entrada;
        const con = estado.sel.reserva === 'con';
        // la física en pasos de 10 ms
        let resto = Math.min(dtSim, 0.25);
        while (resto > 1e-6) {
            const h = Math.min(0.01, resto);
            resto -= h;
            const d = f - 60;
            const carga = demanda * (1 + 2 * (d / 60));
            const objR = con ? clamp(-(d / 60) / 0.05 * S + agc, -RESERVA, RESERVA) : 0;
            pr += (objR - pr) * (h / 4);
            const objB = con ? clamp(-d * 3000, -BATERIA, BATERIA) : 0;
            pb += (objB - pb) * (h / 0.3);
            if (con) agc = clamp(agc - 1500 * d * h, -RESERVA, RESERVA); else agc *= 1 - h;
            if (con && Math.abs(d) < 0.003) pb *= 1 - h * 0.5; // las baterías se retiran cuando ya regresó la frecuencia
            const gen = BASE_MW + pr + pb;
            f += (60 * (gen - carga)) / (2 * H * S) * h;
            f = clamp(f, 57, 63);
        }
        reloj += dtSim;
        while (reloj > 0.1) { reloj -= 0.1; historia.push(f); if (historia.length > 400) historia.shift(); }
        const gen = BASE_MW + pr + pb;
        const d = f - 60;

        giro += dtSim * (f / 60) * 3;
        E.rueda.rotation.x = giro;
        E.aguja.rotation.z = -clamp(d, -1, 1) * 1.2;
        E.barraR.scale.x = Math.max(0.01, Math.abs(pr) / RESERVA);
        E.barraR.position.x = -0.3 + 0.3 * E.barraR.scale.x;
        E.barraB.scale.x = Math.max(0.01, Math.abs(pb) / BATERIA);
        E.barraB.position.x = -0.4 + 0.4 * E.barraB.scale.x;
        const encendidas = Math.round(((demanda - 8500) / 3000) * E.ventanas.length);
        E.ventanas.forEach((v, i) => v.material.color.set(i < encendidas ? estado.P.corriente : estado.P.grafito));
        E.pantalla.userData.poner(['Ajuste de la reserva', `${agc >= 0 ? '+' : '−'}${num(Math.abs(agc))} MW`]);

        const m = new THREE.Matrix4();
        const q = new THREE.Vector3();
        const mover = (fl, rapidez) => {
            fl.im.visible = Math.abs(rapidez) > 0.01;
            if (!fl.im.visible) return;
            fl.fase = (fl.fase + dt * 0.6 * rapidez + 1) % 1;
            for (let i = 0; i < fl.n; i++) { fl.c.getPointAt(((i / fl.n) + fl.fase + 1) % 1, q); m.makeTranslation(q.x, q.y, q.z); fl.im.setMatrixAt(i, m); }
            fl.im.instanceMatrix.needsUpdate = true;
        };
        mover(E.fReserva, pr / RESERVA);
        mover(E.fBateria, pb / BATERIA);
        mover(E.fCiudad, demanda / 10000);
        E.pulso.visible = con && Math.abs(d) > 0.005;
        if (E.pulso.visible) E.senal.getPointAt((performance.now() / 1500) % 1, E.pulso.position);

        return {
            cifras: {
                hz: `${num(f, 2)} Hz`,
                hud: Math.abs(d) < 0.02 ? 'Equilibrio: se genera lo mismo que se consume' : !con && d < -0.5 ? 'Sin reserva la frecuencia no se recupera: habría que desconectar carga' : d < 0 ? 'Falta generación: la frecuencia baja y responden las reservas' : 'Sobra generación: la frecuencia sube y las reservas bajan',
                demanda: `${num(demanda)} MW`,
                genera: `${num(gen)} MW`,
                reserva: `${num(pr)} MW`,
                bateria: `${num(pb)} MW`,
            },
        };
    },
});

// escala de la carátula: de 59 a 61 Hz, con 60 al centro
function escalaHz(diametro) {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(256, 256, 250, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#0a0707';
    g.fillStyle = '#0a0707';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (let k = -10; k <= 10; k++) {
        const a = -Math.PI / 2 + (k / 10) * 1.2;
        const r1 = k % 5 === 0 ? 170 : 190;
        g.lineWidth = k % 5 === 0 ? 5 : 2;
        g.beginPath(); g.moveTo(256 + Math.cos(a) * r1, 256 + Math.sin(a) * r1); g.lineTo(256 + Math.cos(a) * 215, 256 + Math.sin(a) * 215); g.stroke();
        if (k % 5 === 0) { g.font = '700 34px Manrope, sans-serif'; g.fillText(num(60 + k / 10, 1), 256 + Math.cos(a) * 130, 256 + Math.sin(a) * 130); }
    }
    g.fillStyle = '#9b2247';
    g.font = '700 40px Manrope, sans-serif';
    g.fillText('Hz', 256, 330);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.CircleGeometry(diametro / 2, 48), new THREE.MeshBasicMaterial({ map: t }));
    m.userData.sinResalte = true;
    return m;
}

// pantalla de dos renglones
function pantallaTexto(ancho, alto) {
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = Math.round(320 * alto / ancho);
    const g = c.getContext('2d');
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ map: t }));
    m.userData.sinResalte = true;
    let ultimo = '';
    m.userData.poner = ([a, b]) => {
        if (a + b === ultimo) return;
        ultimo = a + b;
        g.fillStyle = '#13151f';
        g.fillRect(0, 0, c.width, c.height);
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillStyle = '#a4a7ae';
        g.font = `600 ${Math.round(c.height * 0.2)}px Manrope, sans-serif`;
        g.fillText(a, c.width / 2, c.height * 0.3);
        g.fillStyle = '#ffd23f';
        g.font = `700 ${Math.round(c.height * 0.34)}px Manrope, sans-serif`;
        g.fillText(b, c.width / 2, c.height * 0.68);
        t.needsUpdate = true;
    };
    return m;
}
