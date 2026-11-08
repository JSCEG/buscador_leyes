// «Central geotérmica», en 3D: un bloque de tierra cortado de frente y, encima, una planta de vapor flasheado. La roca
// caliente calienta el agua del yacimiento; el pozo productor la sube; en el separador, al bajar la presión, parte del
// agua se vuelve vapor (flash), que mueve la turbina y el generador; el vapor se condensa y se enfría en la torre, y el
// agua vuelve al subsuelo por el pozo de reinyección.
//
// Entrada: la temperatura del yacimiento (°C).
//
// Modelo (calculado aquí, de ejemplo): 400 kg/s de agua del pozo; separador a 160 °C; fracción de vapor
// x = c · (T − 160) ÷ h_fg con c = 4.2 kJ/kg·K y h_fg = 2,083 kJ/kg; la turbina usa 7.5 toneladas de vapor por hora por
// cada MW. Fuente técnica: EIA, «Geothermal power plants» (agua o vapor de 300 a 700 °F, reinyección, planta binaria).
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';

const BASE = 0.16;
const SUELO = 1.0;
const CORTE = 0.1;
const FLUJO = 400;
const T_SEP = 160;
const vapor = t => Math.max(0, (4.2 * (t - T_SEP)) / 2083);
const megawatts = t => (vapor(t) * FLUJO * 3.6) / 7.5;

let piezasG = null;
let tiempo = 0;
let temp = 250;
let giro = 0;

crearMaquina({
    figura: 'geotermica',
    nombre: 'la central geotérmica',
    partes: [
        { n: 1, nombre: 'Roca caliente', ancla: [0, 0.3, 0.3], vista: { tx: 0, ty: 0.5, tz: 0.1, az: 0, el: 4, d: 5.0 } },
        { n: 2, nombre: 'Yacimiento geotérmico', ancla: [0.3, 0.6, 0.3], vista: { tx: 0.2, ty: 0.55, tz: 0.1, az: 0, el: 4, d: 4.6 } },
        { n: 3, nombre: 'Pozo productor', ancla: [-1.8, 1.6, 0.1], vista: { tx: -1.8, ty: 0.9, tz: 0, az: 14, el: 12, d: 2.6 } },
        { n: 4, nombre: 'Separador', ancla: [-0.9, 1.9, -0.4], vista: { tx: -0.9, ty: 1.3, tz: -0.4, az: 10, el: 14, d: 2.2 } },
        { n: 5, nombre: 'Turbina y generador', ancla: [0.3, 1.7, -0.4], vista: { tx: 0.3, ty: 1.25, tz: -0.4, az: 6, el: 18, d: 2.4 } },
        { n: 6, nombre: 'Torre de enfriamiento', ancla: [1.6, 2.4, -0.5], vista: { tx: 1.6, ty: 1.5, tz: -0.5, az: -10, el: 12, d: 2.8 } },
        { n: 7, nombre: 'Pozo de reinyección', ancla: [2.5, 1.5, 0.1], vista: { tx: 2.5, ty: 0.8, tz: 0, az: -16, el: 12, d: 2.6 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: 0, ty: 0.95, tz: 0, az: 12, el: 16, d: 7.6 },
        { id: 'subsuelo', texto: 'El subsuelo', tx: 0, ty: 0.55, tz: 0.1, az: 0, el: 2, d: 5.6 },
        { id: 'planta', texto: 'La planta', tx: 0.2, ty: 1.3, tz: -0.4, az: 14, el: 22, d: 4.4 },
    ],
    entrada: { etiqueta: 'Temperatura del yacimiento', min: 150, max: 350, paso: 5, valor: 250, aria: 'Temperatura del yacimiento en grados Celsius' },
    selectores: [],
    lento: [
        { id: 'real', texto: 'Normal', k: 1, nota: 'El agua sube por el pozo, se separa el vapor y el agua regresa al subsuelo.' },
        { id: 'lento', texto: 'Despacio', k: 0.35, nota: 'Más despacio, para seguir el camino del agua y del vapor.' },
    ],
    hud: '<b data-c="mw"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'temp', etiqueta: 'Yacimiento', nota: 'temperatura del agua' },
        { id: 'fraccion', etiqueta: 'Se vuelve vapor', nota: 'en el separador' },
        { id: 'vapor', etiqueta: 'Vapor a la turbina', nota: 'toneladas por hora' },
        { id: 'regresa', etiqueta: 'Agua del pozo', nota: 'toneladas por hora (ejemplo)' },
    ],
    curva: {
        titulo: 'Potencia según la temperatura del yacimiento',
        leyenda: [{ texto: 'potencia (MW)' }],
        nota: 'Cifras de ejemplo. Abajo de unos 160 °C no se separa vapor: para eso se usan plantas binarias.',
        dibujar(g, w, h, estado) {
            const x = t => ((t - 150) / 200) * (w - 10) + 5;
            const y = p => h - 6 - (p / 80) * (h - 14);
            g.lineWidth = 2.4;
            g.strokeStyle = estado.P.acento;
            g.beginPath();
            for (let t = 150; t <= 350; t += 2) { if (t === 150) g.moveTo(x(t), y(megawatts(t))); else g.lineTo(x(t), y(megawatts(t))); }
            g.stroke();
            g.fillStyle = estado.P.acento;
            g.beginPath(); g.arc(x(temp), y(megawatts(temp)), 4.5, 0, Math.PI * 2); g.fill();
        },
    },
    corte: false,
    anchoVertical: 1.7,
    lejaniaMax: 2.9,
    entradaRecorrido: t => 250 + 95 * Math.sin(t * 0.25),

    construir({ raiz, M, P, TEMA, sombra, contorno }) {
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.16, 3.0), M.ceramica))).translateY(0.08));
        const oscuro = TEMA === 'oscuro';

        // 1 y 2 · el subsuelo cortado de frente: roca caliente abajo, yacimiento, roca sello y suelo
        const capa = (y0, y1, color) => { const c = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(6.2, y1 - y0, 1.4), M.mat(color, { roughness: 0.85 }))), 30); c.position.set(0, (y0 + y1) / 2, CORTE - 0.7); raiz.add(c); return c; };
        const roca = capa(BASE, 0.4, '#7d5a52');
        const calor = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 0.24), new THREE.MeshBasicMaterial({ color: P.acento, transparent: true, opacity: 0.3 }));
        calor.position.set(0, (BASE + 0.4) / 2, CORTE + 0.002);
        calor.userData.sinResalte = true;
        raiz.add(calor);
        const yacimiento = capa(0.4, 0.68, '#c9b48e');
        capa(0.68, 0.82, '#8e8a84');
        capa(0.82, SUELO, '#c7ad86');
        const agua = new THREE.Mesh(new THREE.PlaneGeometry(6.0, 0.22), new THREE.MeshBasicMaterial({ color: P.agua, transparent: true, opacity: 0.35 }));
        agua.position.set(0, 0.54, CORTE + 0.003);
        agua.userData.sinResalte = true;
        raiz.add(agua);

        const curva = (...p) => new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));
        const vidrio = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.08, transparent: true, opacity: 0.3, clearcoat: 1, depthWrite: false });
        const flujos = [];
        const tubo = (c, r, color, n) => {
            const t = new THREE.Mesh(new THREE.TubeGeometry(c, 64, r, 10, false), vidrio);
            t.renderOrder = 2;
            raiz.add(t);
            const im = new THREE.InstancedMesh(new THREE.SphereGeometry(r * 0.75, 8, 6), new THREE.MeshBasicMaterial({ color }), n);
            im.frustumCulled = false;
            im.renderOrder = 3;
            raiz.add(im);
            const f = { c, im, n, t };
            flujos.push(f);
            return f;
        };
        const VAPOR = oscuro ? '#f1efea' : '#ffffff';
        const MEZCLA = oscuro ? '#c9e4f0' : '#9cc9de';

        // 3 · pozo productor: del yacimiento a la superficie, con su árbol de válvulas
        const cabezal = new THREE.Group();
        cabezal.position.set(-1.8, SUELO, -0.1);
        cabezal.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 16), M.grafito)).translateY(0.15));
        cabezal.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 8, 20).rotateX(Math.PI / 2), M.borde)).translateY(0.22));
        raiz.add(cabezal);
        const subida = tubo(curva([-1.8, 0.5, CORTE + 0.04], [-1.8, 0.8, CORTE + 0.04], [-1.8, SUELO - 0.02, CORTE + 0.04], [-1.8, SUELO + 0.1, -0.05], [-1.8, SUELO + 0.3, -0.1]), 0.035, MEZCLA, 16);

        // 4 · separador: el agua baja de presión y parte se vuelve vapor
        const separador = new THREE.Group();
        separador.position.set(-0.9, SUELO, -0.4);
        separador.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.7, 28), M.ceramica)), 40).translateY(0.45));
        separador.add(sombra(new THREE.Mesh(new THREE.SphereGeometry(0.17, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.ceramica)).translateY(0.8));
        separador.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.014, 8, 30).rotateX(Math.PI / 2), M.borde)).translateY(0.5));
        for (const x of [-0.12, 0.12]) separador.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8), M.grafito)).translateX(x).translateY(0.05));
        raiz.add(separador);
        const aSeparador = tubo(curva([-1.8, SUELO + 0.3, -0.1], [-1.5, SUELO + 0.35, -0.3], [-1.07, SUELO + 0.4, -0.4]), 0.03, MEZCLA, 10);

        // 5 · turbina y generador
        const turbina = new THREE.Group();
        turbina.position.set(0.3, SUELO, -0.4);
        turbina.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.18, 0.5), M.ceramica))).translateY(0.09));
        const carcasa = contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.45, 28).rotateZ(Math.PI / 2), M.ceramica)), 40);
        carcasa.position.set(-0.2, 0.36, 0);
        const eje = new THREE.Group();
        eje.position.set(0, 0.36, 0);
        eje.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.95, 12).rotateZ(Math.PI / 2), M.acero)));
        for (let i = 0; i < 8; i++) { const b = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.3, 0.04), M.borde)); b.position.x = 0.12; b.rotation.x = (i * Math.PI) / 8; eje.add(b); }
        const gen = contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.32, 28).rotateZ(Math.PI / 2), M.cobre)), 40);
        gen.position.set(0.28, 0.36, 0);
        turbina.add(carcasa, eje, gen);
        raiz.add(turbina);
        const aTurbina = tubo(curva([-0.9, SUELO + 0.97, -0.4], [-0.6, SUELO + 1.0, -0.4], [-0.35, SUELO + 0.65, -0.4], [-0.1, SUELO + 0.4, -0.4]), 0.028, VAPOR, 12);

        // 6 · condensador y torre de enfriamiento
        const torre = new THREE.Group();
        torre.position.set(1.6, SUELO, -0.5);
        const perfil = [];
        for (let i = 0; i <= 12; i++) { const y = (i / 12) * 1.0; perfil.push(new THREE.Vector2(0.38 - 0.16 * Math.sin((i / 12) * Math.PI * 0.85), y)); }
        torre.add(contorno(sombra(new THREE.Mesh(new THREE.LatheGeometry(perfil, 40), M.ceramica)), 40));
        torre.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.015, 8, 40).rotateX(Math.PI / 2), M.borde)).translateY(1.0));
        const vaho = [];
        for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, roughness: 1, depthWrite: false })); b.userData = { fase: i / 6, sinResalte: true }; torre.add(b); vaho.push(b); }
        raiz.add(torre);
        const condensado = tubo(curva([0.45, SUELO + 0.15, -0.4], [0.9, SUELO + 0.06, -0.45], [1.25, SUELO + 0.15, -0.5]), 0.025, P.agua, 8);

        // 7 · pozo de reinyección: el agua de la torre y la salmuera del separador regresan al yacimiento
        const cabezal2 = new THREE.Group();
        cabezal2.position.set(2.5, SUELO, -0.1);
        cabezal2.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.25, 16), M.grafito)).translateY(0.12));
        cabezal2.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 8, 20).rotateX(Math.PI / 2), M.borde)).translateY(0.18));
        raiz.add(cabezal2);
        const salmuera = tubo(curva([-0.85, SUELO + 0.05, -0.25], [0.0, SUELO + 0.04, 0.0], [1.4, SUELO + 0.04, 0.05], [2.3, SUELO + 0.05, -0.05], [2.5, SUELO + 0.22, -0.1]), 0.025, P.agua, 18);
        const deTorre = tubo(curva([1.95, SUELO + 0.05, -0.4], [2.3, SUELO + 0.05, -0.2], [2.5, SUELO + 0.2, -0.1]), 0.022, P.agua, 6);
        const bajada = tubo(curva([2.5, SUELO + 0.25, -0.1], [2.5, SUELO + 0.05, -0.05], [2.5, SUELO - 0.02, CORTE + 0.04], [2.5, 0.7, CORTE + 0.04], [2.4, 0.5, CORTE + 0.04]), 0.035, P.agua, 14);

        // línea a la red
        const linea = curva([0.6, SUELO + 0.4, -0.5], [1.0, SUELO + 1.3, -1.0], [2.8, SUELO + 1.0, -1.0]);
        raiz.add(new THREE.Mesh(new THREE.TubeGeometry(linea, 32, 0.012, 6, false), M.grafito));
        const poste = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.03, 1.0, 4), M.borde));
        poste.position.set(2.8, SUELO + 0.5, -1.0);
        raiz.add(poste);

        piezasG = { calor, flujos, subida, aSeparador, aTurbina, condensado, salmuera, deTorre, bajada, eje, vaho };
        return {
            piezas: { 1: [roca, calor], 2: [yacimiento, agua], 3: [cabezal, subida.t], 4: [separador], 5: [turbina], 6: [torre], 7: [cabezal2, bajada.t] },
            movibles: [
                { parte: 4, objetos: [separador], hacia: [-0.2, 0.5, -0.2] },
                { parte: 5, objetos: [turbina], hacia: [0, 0.5, 0.2] },
                { parte: 6, objetos: [torre], hacia: [0.3, 0.3, -0.3] },
            ],
            anclas: { 1: [roca, [0, 0.0, 0.7]], 2: [yacimiento, [0.3, 0.0, 0.7]], 3: [cabezal, [0, 0.6, 0.1]], 4: [separador, [0, 0.95, 0]], 5: [turbina, [0, 0.7, 0]], 6: [torre, [0, 1.4, 0]], 7: [cabezal2, [0, 0.5, 0.1]] },
        };
    },

    paso(estado) {
        const G = piezasG;
        const { dt, dtSim, e } = estado;
        estado.entrada += (estado.entradaObjetivo - estado.entrada) * (1 - Math.exp(-dt / 0.4));
        temp = estado.entrada;
        tiempo += dtSim;
        const x = vapor(temp);
        const mw = megawatts(temp);
        const tVapor = x * FLUJO * 3.6;
        G.calor.material.opacity = 0.15 + 0.5 * clamp((temp - 150) / 200, 0, 1);
        giro += dtSim * 6 * clamp(mw / 30, 0, 1.5);
        G.eje.rotation.x = giro;
        const m = new THREE.Matrix4();
        const q = new THREE.Vector3();
        const hayVapor = x > 0.005;
        const mover = (f, activo, vel) => {
            f.im.visible = activo && e < 0.2;
            if (!f.im.visible) return;
            for (let i = 0; i < f.n; i++) { f.c.getPointAt(((i / f.n) + tiempo * vel) % 1, q); m.makeTranslation(q.x, q.y, q.z); f.im.setMatrixAt(i, m); }
            f.im.instanceMatrix.needsUpdate = true;
        };
        mover(G.subida, true, 0.15);
        mover(G.aSeparador, true, 0.25);
        mover(G.aTurbina, hayVapor, 0.3);
        mover(G.condensado, hayVapor, 0.25);
        mover(G.salmuera, true, 0.08);
        mover(G.deTorre, hayVapor, 0.25);
        mover(G.bajada, true, 0.15);
        G.vaho.forEach(b => {
            const u = (b.userData.fase + tiempo * 0.15) % 1;
            b.visible = hayVapor;
            b.position.set(u * 0.25, 1.05 + u * 0.8, 0);
            b.scale.setScalar(0.6 + u * 1.2);
            b.material.opacity = 0.5 * (1 - u) * clamp(x * 8, 0, 1);
        });

        return {
            cifras: {
                mw: `${num(mw, 1)} MW`,
                hud: !hayVapor ? 'Agua poco caliente: no se separa vapor; aquí convendría una planta binaria' : 'El vapor mueve la turbina y el agua regresa al subsuelo',
                temp: `${num(temp)} °C`,
                fraccion: `${num(x * 100, 1)} %`,
                vapor: `${num(tVapor)} t/h`,
                regresa: `${num(FLUJO * 3.6)} t/h`,
            },
        };
    },
});
