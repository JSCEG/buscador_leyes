// «¿Qué es la electricidad?», en 3D: un circuito de pila, interruptor, cable y foco, y una lupa que muestra el cable
// por dentro: el núcleo de cobre con sus átomos y los electrones libres que avanzan, todos a la vez, dentro del forro de
// plástico.
//
// Entrada: cuántas pilas (1 a 4, de 1.5 V cada una). El interruptor abre o cierra el camino: abierto, no hay corriente.
//
// Cifras:
// - Foco de 3 Ω: I = V ÷ R → con 4 pilas (6 V), 2 A; con una (1.5 V), 0.5 A.
// - I = Q ÷ t: la carga que ha pasado crece con la corriente (coulombs = amperes × segundos).
// - Velocidad de los electrones en un cable de cobre de 1 mm²: v = I ÷ (n · e · A), con n = 8.5 × 10²⁸ electrones libres
//   por m³ y e = 1.6 × 10⁻¹⁹ C: v ≈ 0.074 mm/s por cada ampere. Con 2 A, ≈ 0.15 mm/s (la ficha: con 20 A en un cable más
//   grueso, menos de medio milímetro por segundo).
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';
import { crearCorriente } from '../comun/corriente.js';

const R_FOCO = 3;
const V_PILA = 1.5;
const MM_S_POR_A = 1 / (8.5e28 * 1.6e-19 * 1e-6) * 1000; // ≈ 0.0735 mm/s por ampere en 1 mm²
const BASE = 0.16;
const PC = 0.182;

let corriente = 0;
let carga = 0;
let brillo = 0;
let piezasE = null;

crearMaquina({
    figura: 'electricidad',
    nombre: 'el circuito',
    partes: [
        { n: 1, nombre: 'Pila', ancla: [-2.3, 1.05, 0.6], vista: { tx: -2.2, ty: 0.5, tz: 0.6, az: 18, el: 20, d: 2.8 } },
        { n: 2, nombre: 'Interruptor', ancla: [-0.4, 0.85, 1.1], vista: { tx: -0.4, ty: 0.4, tz: 1.1, az: 22, el: 26, d: 2.4 } },
        { n: 3, nombre: 'Cable de cobre', ancla: [0.55, 1.55, -0.3], vista: { tx: 0.5, ty: 1.15, tz: -0.4, az: 14, el: 12, d: 2.6 } },
        { n: 4, nombre: 'Forro de plástico', ancla: [1.25, 1.5, -0.3], vista: { tx: 0.6, ty: 1.15, tz: -0.4, az: 30, el: 14, d: 2.6 } },
        { n: 5, nombre: 'Lupa', ancla: [-0.3, 2.0, -0.4], vista: { tx: 0.5, ty: 1.2, tz: -0.4, az: 8, el: 10, d: 3.6 } },
        { n: 6, nombre: 'Foco', ancla: [2.4, 1.55, 0.4], vista: { tx: 2.3, ty: 0.85, tz: 0.4, az: -16, el: 12, d: 2.6 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: 0, ty: 0.8, tz: 0, az: 20, el: 24, d: 8.0 },
        { id: 'frente', texto: 'Frente', tx: 0, ty: 0.8, tz: 0, az: 0, el: 8, d: 7.6 },
        { id: 'arriba', texto: 'Arriba', tx: 0, ty: 0.3, tz: 0, az: 0, el: 70, d: 8.0 },
        { id: 'lupa', texto: 'Lupa', tx: 0.5, ty: 1.2, tz: -0.4, az: 6, el: 8, d: 3.4 },
    ],
    entrada: { etiqueta: 'Pilas', min: 1, max: 4, paso: 1, valor: 4, aria: 'Número de pilas de 1.5 volts' },
    selectores: [{ id: 'interruptor', etiqueta: 'Interruptor', valor: 'cerrado', opciones: [{ id: 'cerrado', texto: 'Cerrado' }, { id: 'abierto', texto: 'Abierto' }] }],
    lento: [{ id: 'normal', texto: 'Normal', k: 1, nota: 'En la lupa los electrones van miles de veces más rápido que en la realidad, para que se vea.' }],
    hud: '<b data-c="corriente"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'corriente', etiqueta: 'Corriente', nota: 'amperes por el circuito' },
        { id: 'voltaje', etiqueta: 'Voltaje', nota: 'lo que empujan las pilas' },
        { id: 'carga', etiqueta: 'Carga que ha pasado', nota: 'coulombs (I = Q ÷ t)' },
        { id: 'deriva', etiqueta: 'Velocidad real de los electrones', nota: 'en un cable de 1 mm²' },
    ],
    curva: {
        titulo: 'Corriente en el circuito',
        leyenda: [{ texto: 'amperes' }],
        nota: 'Con el interruptor abierto el camino se corta y la corriente es cero.',
        dibujar(g, w, h, estado) {
            const hist = piezasE?.historia;
            if (!hist) return;
            g.strokeStyle = estado.P.acento;
            g.lineWidth = 2.4;
            g.beginPath();
            hist.forEach((v, i) => {
                const x = (i / (hist.length - 1)) * w;
                const y = h - 6 - (v / 2.2) * (h - 14);
                if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
            });
            g.stroke();
        },
    },
    corte: false,

    construir({ raiz, M, P, sombra, contorno, aro, escena }) {
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.16, 3.2), M.ceramica))).translateY(0.08));
        // 1 · pilas: de 1 a 4 en fila, en su porta-pilas; la de la punta lleva el + guinda
        const pila = new THREE.Group();
        pila.position.set(-2.3, BASE, 0.6);
        const porta = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 1.5), M.grafito)));
        porta.position.y = 0.04;
        pila.add(porta);
        const celdas = [0, 1, 2, 3].map(i => {
            const c = new THREE.Group();
            c.position.set(0, 0.22, -0.54 + i * 0.36);
            c.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.32, 28).rotateX(Math.PI / 2), M.ceramica)), 40));
            c.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.08, 28).rotateX(Math.PI / 2), M.borde)).translateZ(0.1));
            c.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 14).rotateX(Math.PI / 2), M.borde)).translateZ(0.175));
            pila.add(c);
            return c;
        });
        raiz.add(pila);
        // 2 · interruptor de cuchilla: base blanca, dos bornes y la cuchilla que sube y baja
        const interruptor = new THREE.Group();
        interruptor.position.set(-0.4, BASE, 1.1);
        interruptor.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.26), M.ceramica))).translateY(0.03));
        for (const x of [-0.25, 0.25]) interruptor.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.08), M.cobre)).translateX(x).translateY(0.13));
        const cuchilla = new THREE.Group();
        cuchilla.position.set(-0.25, 0.18, 0);
        cuchilla.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.025, 0.05), M.cobre)).translateX(0.26));
        cuchilla.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.14, 12), M.borde)).translateX(0.5).translateY(0.07));
        interruptor.add(cuchilla);
        raiz.add(interruptor);
        // 6 · foco en su base
        const foco = new THREE.Group();
        foco.position.set(2.4, BASE, 0.4);
        foco.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.12, 28), M.ceramica))).translateY(0.06));
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

        // 3 y 4 · el cable: núcleo de cobre y forro de plástico; un circuito cerrado por la base
        const curva = (...p) => new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));
        const ida = curva([-2.3, 0.4, 1.36], [-2.3, PC, 1.55], [-1.2, PC, 1.4], [-0.68, PC, 1.15], [-0.65, 0.3, 1.1]);
        const tramo = curva([-0.15, 0.3, 1.1], [0.2, PC, 1.0], [1.4, PC, 0.8], [2.0, PC, 0.45], [2.18, 0.2, 0.4]);
        // el regreso se describe desde el − de la pila: así, como segundo cable de su par, la corriente lo recorre al revés
        const regreso = curva([-2.3, 0.4, -0.16], [-2.3, PC, -0.4], [-1.0, PC, -0.45], [1.0, PC, -0.4], [2.3, PC, -0.4], [2.4, 0.2, 0.15]);
        const forroMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.3, transparent: true, opacity: 0.45, clearcoat: 1, depthWrite: false });
        const cableG = new THREE.Group();
        const forroG = new THREE.Group();
        for (const c of [ida, tramo, regreso]) {
            cableG.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(c, 80, 0.016, 8, false), M.cobre)));
            const forro = new THREE.Mesh(new THREE.TubeGeometry(c, 80, 0.036, 12, false), forroMat);
            forro.renderOrder = 2;
            forroG.add(forro);
        }
        raiz.add(cableG, forroG);
        // ida (+) y regreso (−) forman un par; el tramo del interruptor al foco va solo, sin marca
        const corrientes = [crearCorriente({ raiz, escena, curvas: [ida, regreso], P, radio: 0.022, puntosPorCable: 18 }), crearCorriente({ raiz, escena, curvas: [tramo], P, radio: 0.022, puntosPorCable: 18 })];

        // 5 · la lupa: un aro guinda con mango, y adentro el mismo cable visto en grande sobre el tramo de regreso
        const lupa = new THREE.Group();
        lupa.position.set(0.5, 1.35, -0.4);
        lupa.scale.setScalar(1.35);
        const aroLupa = sombra(new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.045, 14, 64), M.borde));
        const mango = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.7, 16), M.grafito));
        mango.position.set(0.62, -0.62, 0);
        mango.rotation.z = Math.PI / 4;
        const lente = new THREE.Mesh(new THREE.CircleGeometry(0.6, 48), new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, transparent: true, opacity: 0.12, depthWrite: false }));
        lente.position.z = -0.02;
        lente.userData.sinResalte = true;
        lupa.add(aroLupa, mango, lente);
        // el cable en grande: forro (cilindro transparente), núcleo de cobre con su red de átomos y los electrones
        const grande = new THREE.Group();
        grande.position.z = -0.06;
        const forroGrande = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 1.1, 40, 1, true).rotateZ(Math.PI / 2), forroMat);
        forroGrande.renderOrder = 2;
        const nucleo = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.1, 40, 1, true).rotateZ(Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: P.cobre, roughness: 0.4, metalness: 0.3, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
        nucleo.userData.sinResalte = true;
        const atomos = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 12, 10), M.cobre, 60);
        let k = 0;
        const m4 = new THREE.Matrix4();
        for (let x = -0.5; x <= 0.5 + 1e-6 && k < 60; x += 0.125) for (const [y, z] of [[0.12, 0], [-0.12, 0], [0, 0.12], [0, -0.12], [0, 0], [0.09, 0.09], [-0.09, -0.09]]) { if (k < 60) { m4.makeTranslation(x, y, z); atomos.setMatrixAt(k++, m4); } }
        atomos.count = k;
        const ELECTRONES = 70;
        const electrones = new THREE.InstancedMesh(new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshBasicMaterial({ color: P.corriente }), ELECTRONES);
        electrones.frustumCulled = false;
        const semillas = Array.from({ length: ELECTRONES }, (_, i) => ({ x: ((i * 0.618) % 1) * 1.1 - 0.55, y: Math.sin(i * 12.9) * 0.18, z: Math.cos(i * 7.7) * 0.18 }));
        grande.add(forroGrande, nucleo, atomos, electrones);
        lupa.add(grande);
        raiz.add(lupa);

        piezasE = { celdas, cuchilla, vidrio, luz, corrientes, electrones, semillas, historia: new Array(120).fill(0), forroMat, cableG };
        return {
            piezas: { 1: [pila], 2: [interruptor], 3: [cableG], 4: [forroG], 5: [lupa], 6: [foco] },
            movibles: [
                { parte: 1, objetos: [pila], hacia: [-0.4, 0, 0.2] },
                { parte: 2, objetos: [interruptor], hacia: [0, 0.4, 0.4] },
                { parte: 5, objetos: [lupa], hacia: [0, 0.8, 0] },
                { parte: 6, objetos: [foco], hacia: [0.4, 0, 0.2] },
            ],
            anclas: { 1: [pila, [0, 0.85, 0]], 2: [interruptor, [0, 0.6, 0]], 3: [cableG, [0.5, 0.5, -0.4]], 4: [forroG, [1.4, 0.5, -0.4]], 5: [lupa, [0, 0.85, 0]], 6: [foco, [0, 1.65, 0]] },
        };
    },

    paso(estado) {
        const { celdas, cuchilla, vidrio, luz, electrones, semillas, historia } = piezasE;
        const { dt, e, arrastre } = estado;
        const pilas = Math.round(estado.entradaObjetivo);
        estado.entrada = pilas;
        celdas.forEach((c, i) => { c.visible = i < pilas; });
        const cerrado = estado.sel.interruptor === 'cerrado';
        cuchilla.rotation.z += ((cerrado ? 0 : 0.9) - cuchilla.rotation.z) * (1 - Math.exp(-dt / 0.15));
        // sin camino cerrado no hay corriente: interruptor abierto, desarmado o una pieza fuera de lugar
        const camino = cerrado && cuchilla.rotation.z < 0.05 ? 1 - clamp(Math.max(e * 8, ...[1, 2, 6].map(n => arrastre[n].length() * 4)), 0, 1) : 0;
        const V = pilas * V_PILA;
        const objetivo = (V / R_FOCO) * camino;
        corriente += (objetivo - corriente) * (1 - Math.exp(-dt / 0.08));
        carga += corriente * dt;
        historia.push(corriente);
        historia.shift();
        brillo += (((corriente / 2) ** 2) - brillo) * (1 - Math.exp(-dt / 0.1));
        vidrio.material.emissiveIntensity = brillo * 1.6;
        luz.intensity = brillo * 3.5;
        // electrones en la lupa: avanzan juntos, a una velocidad proporcional a la corriente (muy aumentada)
        const m4 = new THREE.Matrix4();
        const avance = corriente * 0.12;
        semillas.forEach((s, i) => {
            s.x += avance * dt;
            if (s.x > 0.55) s.x -= 1.1;
            m4.makeTranslation(s.x, s.y + Math.sin(estado.T * 9 + i) * 0.012, s.z + Math.cos(estado.T * 8 + i) * 0.012);
            electrones.setMatrixAt(i, m4);
        });
        electrones.instanceMatrix.needsUpdate = true;
        estado.elec = { camino };
        return {
            cifras: {
                corriente: `${num(corriente, 2)} A`,
                hud: camino ? `${num(V, 1)} V · ${pilas} ${pilas === 1 ? 'pila' : 'pilas'} · circuito cerrado` : 'Interruptor abierto: no hay corriente',
                voltaje: `${num(V, 1)} V`,
                carga: `${num(carga, 1)} C`,
                deriva: `${num(corriente * MM_S_POR_A, 3)} mm/s`,
            },
        };
    },

    despues(estado) {
        const { corrientes } = piezasE;
        const base = { avance: 0.2, dt: estado.dt, camara: estado.camara, w: estado.w, h: estado.h };
        const visible = clamp(corriente / 0.3, 0, 1);
        corrientes.forEach((c, i) => c.actualizar({ ...base, corriente: corriente / 2, visible, polos: i === 0 ? 1 : 0 }));
    },
});
