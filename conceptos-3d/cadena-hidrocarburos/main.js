// «Soberanía, PLADESHi y Asignaciones», en 3D: un bloque de tierra cortado de frente. Abajo, la roca con el petróleo de
// la Nación (reservas probadas, probables y posibles); arriba, dos pozos de PEMEX: uno de Desarrollo Propio (todo de
// PEMEX) y uno de Desarrollo Mixto (PEMEX con un socio). El crudo sube por los pozos y va por ducto a la refinería. Al
// frente, el orden de prelación (art. 11 LSH) y la oficina de la SENER con el plan (PLADESHi).
//
// Entrada: la participación de PEMEX en el contrato del pozo mixto. La ley pide que no baje de 40 % (art. 31 LSH): por
// debajo, el pozo mixto no puede operar.
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';

const BASE = 0.16;
const SUELO = 1.2;
const MINIMO = 40;
const CORTE = 0.1; // la cara de corte del bloque de tierra

let piezasA = null;
let tiempo = 0;
let pemex = 51;
let pastelHecho = -1;

crearMaquina({
    figura: 'cadena-hidrocarburos',
    nombre: 'los pozos',
    partes: [
        { n: 1, nombre: 'Subsuelo de la Nación (Reservas 3P)', ancla: [-0.3, 0.7, 0.4], vista: { tx: -0.3, ty: 0.6, tz: 0.1, az: 2, el: 4, d: 4.6 } },
        { n: 2, nombre: 'Asignación de Desarrollo Propio (PEMEX)', ancla: [-1.7, 2.3, -0.3], vista: { tx: -1.7, ty: 1.4, tz: -0.2, az: 12, el: 16, d: 2.8 } },
        { n: 3, nombre: 'Asignación de Desarrollo Mixto (PEMEX ≥ 40 %)', ancla: [0.8, 2.3, -0.3], vista: { tx: 0.8, ty: 1.4, tz: -0.2, az: 6, el: 16, d: 2.8 } },
        { n: 4, nombre: 'Rectoría SENER (PLADESHi), CNE y ASEA', ancla: [-0.4, 0.9, 0.95], vista: { tx: -0.4, ty: 0.4, tz: 0.9, az: 6, el: 16, d: 2.8 } },
        { n: 5, nombre: 'Refinación y abasto nacional (~1.8 Mbd)', ancla: [2.7, 2.5, -0.7], vista: { tx: 2.6, ty: 1.5, tz: -0.6, az: -14, el: 16, d: 2.8 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: 0, ty: 0.95, tz: 0, az: 10, el: 18, d: 8.0 },
        { id: 'corte', texto: 'El corte', tx: -0.3, ty: 0.7, tz: 0, az: 0, el: 2, d: 6.4 },
        { id: 'arriba', texto: 'Arriba', tx: 0, ty: 0.6, tz: 0, az: 0, el: 70, d: 8.0 },
    ],
    entrada: { etiqueta: 'Participación de PEMEX en el pozo mixto', min: 0, max: 100, paso: 1, valor: 51, aria: 'Porcentaje de participación de PEMEX en el contrato del pozo mixto' },
    selectores: [],
    lento: [
        { id: 'lento', texto: 'Despacio', k: 0.35, nota: 'El crudo sube despacio para ver su camino.' },
        { id: 'real', texto: 'Normal', k: 1, nota: 'El crudo va del yacimiento al pozo, y del pozo a la refinería, siempre por tubería.' },
    ],
    hud: '<b data-c="pemex"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'pemexC', etiqueta: 'PEMEX en el pozo mixto', nota: 'mínimo 40 % (art. 31)' },
        { id: 'socio', etiqueta: 'Socio', nota: 'técnico o financiero' },
        { id: 'permitido', etiqueta: '¿Puede operar?', nota: 'según la Ley del Sector Hidrocarburos' },
        { id: 'pozos', etiqueta: 'Pozos operando', nota: 'propio y mixto' },
    ],
    curva: null,
    corte: false,
    anchoVertical: 1.7,
    lejaniaMax: 2.9,
    entradaRecorrido: t => 50 + 38 * Math.sin(t * 0.3),

    construir({ raiz, M, P, TEMA, sombra, contorno }) {
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.16, 3.2), M.ceramica))).translateY(0.08));
        const oscuro = TEMA === 'oscuro';
        const CRUDO = oscuro ? '#c58d45' : '#5a3b17';

        // 1 · el subsuelo: capas de roca (cortadas de frente) y los yacimientos con sus reservas 3P
        const subsuelo = new THREE.Group();
        const capas = [[BASE, 0.45, '#6f655c'], [0.45, 0.82, '#d9c8a2'], [0.82, 1.02, '#8e8a84'], [1.02, SUELO, '#c7ad86']];
        for (const [y0, y1, color] of capas) {
            const c = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(6.6, y1 - y0, 1.5), M.mat(color, { roughness: 0.85 }))), 30);
            c.position.set(0, (y0 + y1) / 2, CORTE - 0.75);
            subsuelo.add(c);
        }
        const lente = (x, ancho) => {
            const g = new THREE.Group();
            g.position.set(x, 0.63, CORTE + 0.002);
            [['#b08a55', 1, 0.55], ['#7a5428', 0.72, 0.85], [CRUDO === '#c58d45' ? '#3a2a14' : '#2a1b0b', 0.45, 1]].forEach(([color, k, op], i) => {
                const e = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op }));
                e.scale.set(ancho * k, 0.15 * k, 1);
                e.position.z = i * 0.002;
                e.userData.sinResalte = true;
                g.add(e);
            });
            subsuelo.add(g);
            return g;
        };
        lente(-1.7, 1.0);
        lente(0.8, 0.85);
        raiz.add(subsuelo);

        // los pozos: balancín que sube el crudo; tubo de vidrio del yacimiento a la superficie
        const vidrio = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.08, transparent: true, opacity: 0.3, clearcoat: 1, depthWrite: false });
        const curva = (...p) => new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));
        const flujo = (ruta, n, radio = 0.03) => {
            const tubo = new THREE.Mesh(new THREE.TubeGeometry(ruta, 80, radio, 10, false), vidrio);
            tubo.renderOrder = 2;
            const im = new THREE.InstancedMesh(new THREE.SphereGeometry(radio * 0.8, 8, 6), new THREE.MeshBasicMaterial({ color: CRUDO }), n);
            im.frustumCulled = false;
            im.renderOrder = 3;
            return { tubo, im, ruta, n };
        };
        const pozo = (x, techo) => {
            const g = new THREE.Group();
            g.position.set(x, SUELO, -0.3);
            g.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.36), M.grafito)).translateY(0.025));
            for (const s of [-1, 1]) {
                const pata = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.62, 0.05), M.ceramica));
                pata.position.set(0.05, 0.33, s * 0.11);
                pata.rotation.x = s * 0.18;
                g.add(pata);
            }
            const viga = new THREE.Group();
            viga.position.set(0.05, 0.64, 0);
            viga.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.07, 0.07), M.ceramica))));
            const cabeza = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.09, 24, 1, false, -Math.PI / 2, Math.PI), techo));
            cabeza.rotation.x = Math.PI / 2;
            cabeza.position.x = -0.48;
            viga.add(cabeza);
            viga.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.1), M.grafito)).translateX(0.45).translateY(-0.1));
            g.add(viga);
            g.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 12), M.grafito)).translateX(-0.43).translateY(0.1));
            const pastel = new THREE.Group();
            pastel.position.set(0.25, 0.97, 0);
            g.add(pastel);
            const letreroP = letrero(0.95, 0.16, '');
            letreroP.position.set(0.25, 1.22, 0);
            g.add(letreroP);
            raiz.add(g);
            const subida = flujo(curva([x - 0.43 + 0.05, 0.63, CORTE + 0.03], [x - 0.38, 0.9, CORTE + 0.03], [x - 0.38, SUELO - 0.02, CORTE + 0.03], [x - 0.38, SUELO + 0.05, -0.1], [x - 0.38, SUELO + 0.12, -0.3]), 14);
            raiz.add(subida.tubo, subida.im);
            return { g, viga, pastel, letreroP, subida, fase: 0 };
        };
        const propio = pozo(-1.7 + 0.38, M.borde);
        const mixto = pozo(0.8 + 0.38, M.borde);

        // 5 · refinería y ductos: el crudo va por tubería, a ras de suelo, de cada pozo a la refinería
        const refi = new THREE.Group();
        refi.position.set(2.7, SUELO, -0.6);
        refi.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.1, 28), M.ceramica)), 40).translateY(0.55));
        for (const y of [0.3, 0.6, 0.9]) refi.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.014, 8, 32).rotateX(Math.PI / 2), M.borde)).translateY(y));
        for (const [x, z] of [[-0.45, 0.25], [0.4, 0.3]]) {
            refi.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.3, 28), M.ceramica)), 40).translateX(x).translateY(0.15).translateZ(z));
            refi.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.012, 8, 32).rotateX(Math.PI / 2), M.borde)).translateX(x).translateY(0.3).translateZ(z));
        }
        raiz.add(refi);
        const aRefi = [propio, mixto].map((p, i) => {
            const x = p.g.position.x - 0.38;
            const f = flujo(curva([x, SUELO + 0.12, -0.3], [x + 0.2, SUELO + 0.04, -0.55 - i * 0.1], [2.0, SUELO + 0.04, -0.65 - i * 0.1], [2.45, SUELO + 0.04, -0.6 - i * 0.1], [2.55, SUELO + 0.1, -0.6]), 22, 0.026);
            raiz.add(f.tubo, f.im);
            return f;
        });

        // 4 · al frente: la oficina de la SENER con el plan, y el podio del orden de prelación
        const rector = new THREE.Group();
        rector.position.set(-0.4, BASE, 0.95);
        const ofi = new THREE.Group();
        ofi.position.x = -1.6;
        ofi.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.4), M.ceramica))).translateY(0.225));
        ofi.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.05, 0.46), M.borde)).translateY(0.47));
        const plan = letrero(0.7, 0.14, 'PLADESHi');
        plan.position.set(0, 0.3, 0.203);
        ofi.add(plan);
        const firmas = letrero(0.7, 0.1, 'SENER · CNE · ASEA');
        firmas.position.set(0, 0.13, 0.203);
        ofi.add(firmas);
        rector.add(ofi);
        const podio = new THREE.Group();
        podio.position.x = 0.5;
        [[0, 0.36, '1 · Propio'], [-0.62, 0.24, '2 · Mixto'], [0.62, 0.14, '3 · Contratos']].forEach(([x, h, t]) => {
            podio.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.58, h, 0.4), M.ceramica))).translateX(x).translateY(h / 2));
            podio.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.025, 0.42), M.borde)).translateX(x).translateY(h));
            const l = letrero(0.5, 0.1, t);
            l.position.set(x, Math.max(0.07, h - 0.09), 0.203);
            podio.add(l);
        });
        rector.add(podio);
        raiz.add(rector);

        piezasA = { propio, mixto, aRefi, M, P };
        return {
            piezas: { 1: [subsuelo], 2: [propio.g, propio.subida.tubo], 3: [mixto.g, mixto.subida.tubo], 4: [rector], 5: [refi, ...aRefi.map(f => f.tubo)] },
            movibles: [
                { parte: 2, objetos: [propio.g], hacia: [-0.2, 0.6, -0.2] },
                { parte: 3, objetos: [mixto.g], hacia: [0.2, 0.6, -0.2] },
                { parte: 4, objetos: [rector], hacia: [0, 0, 0.5] },
                { parte: 5, objetos: [refi], hacia: [0.4, 0.4, -0.2] },
            ],
            anclas: { 1: [subsuelo, [-0.3, 0.55, CORTE]], 2: [propio.g, [0.25, 1.45, 0]], 3: [mixto.g, [0.25, 1.45, 0]], 4: [rector, [0, 0.7, 0]], 5: [refi, [0, 1.3, 0]] },
        };
    },

    paso(estado) {
        const S = piezasA;
        const { dt, dtSim, e } = estado;
        estado.entrada += (estado.entradaObjetivo - estado.entrada) * (1 - Math.exp(-dt / 0.25));
        tiempo += dtSim;
        pemex = Math.round(estado.entrada);
        const permitido = pemex >= MINIMO;
        const sueltos = 1 - clamp(e * 6, 0, 1);

        // el pastel de participación se rehace solo cuando cambia el número
        if (pemex !== pastelHecho) {
            pastelHecho = pemex;
            const hacer = (grupo, parte) => {
                grupo.clear();
                const tajada = (inicio, largo, mat) => largo > 0.001 && grupo.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.07, 40, 1, false, inicio, largo), mat));
                tajada(0, Math.PI * 2 * parte, S.M.borde);
                tajada(Math.PI * 2 * parte, Math.PI * 2 * (1 - parte), S.M.grafito);
                grupo.rotation.x = Math.PI / 2.4;
            };
            hacer(S.propio.pastel, 1);
            hacer(S.mixto.pastel, pemex / 100);
            S.propio.letreroP.userData.poner('PEMEX 100 %');
            S.mixto.letreroP.userData.poner(permitido ? `PEMEX ${pemex} % · socio ${100 - pemex} %` : `PEMEX ${pemex} %: no permitido`);
        }

        // los balancines cabecean y el crudo corre solo en los pozos que operan
        const m = new THREE.Matrix4();
        const q = new THREE.Vector3();
        const mover = (f, rapidez, fase) => {
            f.im.visible = rapidez > 0.02;
            if (!f.im.visible) return;
            for (let i = 0; i < f.n; i++) {
                f.ruta.getPointAt(((i / f.n) + fase) % 1, q);
                m.makeTranslation(q.x, q.y, q.z);
                f.im.setMatrixAt(i, m);
            }
            f.im.instanceMatrix.needsUpdate = true;
        };
        [[S.propio, 1], [S.mixto, permitido ? 1 : 0]].forEach(([p, opera], i) => {
            p.anda = (p.anda ?? 1) + (opera - (p.anda ?? 1)) * (1 - Math.exp(-dt / 0.4));
            p.fase += dtSim * 1.6 * p.anda;
            p.viga.rotation.z = Math.sin(p.fase * 2) * 0.22 * p.anda;
            mover(p.subida, p.anda * sueltos, (p.fase * 0.08) % 1);
            mover(S.aRefi[i], p.anda * sueltos, (p.fase * 0.05) % 1);
        });

        return {
            cifras: {
                pemex: permitido ? `PEMEX ${num(pemex)} %` : `PEMEX ${num(pemex)} %: no`,
                hud: permitido ? 'El pozo mixto puede operar: PEMEX conserva al menos 40 %' : 'Abajo de 40 % la ley no lo permite (art. 31 LSH)',
                pemexC: `${num(pemex)} %`,
                socio: `${num(100 - pemex)} %`,
                permitido: permitido ? 'sí' : 'no',
                pozos: permitido ? '2 de 2' : '1 de 2',
            },
        };
    },
});

// letrero: textura de canvas clara con texto guinda, que se vuelve a dibujar solo cuando cambia
function letrero(ancho, alto, texto) {
    const c = document.createElement('canvas');
    c.width = 400;
    c.height = Math.round(400 * alto / ancho);
    const g = c.getContext('2d');
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ map: t }));
    m.userData.sinResalte = true;
    let ultimo = null;
    m.userData.poner = s => {
        if (s === ultimo) return;
        ultimo = s;
        g.fillStyle = '#f7f5f1';
        g.fillRect(0, 0, c.width, c.height);
        g.fillStyle = '#9b2247';
        let tam = Math.round(c.height * 0.62);
        g.font = `700 ${tam}px Manrope, sans-serif`;
        tam = Math.floor(tam * Math.min(1, (c.width * 0.92) / Math.max(1, g.measureText(s).width)));
        g.font = `700 ${tam}px Manrope, sans-serif`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(s, c.width / 2, c.height / 2 + 2);
        t.needsUpdate = true;
    };
    m.userData.poner(texto);
    return m;
}
