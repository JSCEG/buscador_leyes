// «Central hidroeléctrica», en 3D: una presa cortada de lado. El embalse guarda el agua en alto; la compuerta de toma la
// deja pasar a la tubería a presión, que baja hasta la casa de máquinas; ahí el agua hace girar la turbina, que mueve al
// generador, y sale por el desfogue al río. La energía depende de cuánta agua pasa y de cuánto cae.
//
// Entrada: el caudal que pasa por la turbina (m³/s). Botón: embalse alto o bajo (cambia la caída).
//
// Modelo (calculado aquí): P = ρ · g · Q · H · η, con ρ = 1,000 kg/m³, g = 9.81 m/s² y eficiencia de 90 %; caída de
// 100 m con el embalse alto y 70 m con el bajo. La turbina gira siempre a la misma velocidad (está sincronizada con la
// red); lo que cambia con el caudal es cuánto abren sus álabes directores. Fuente técnica: DOE, «How Hydropower Works».
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';

const BASE = 0.16;
const ETA = 0.9;
const Q_MAX = 300;
const RPM = 180;
const potencia = (q, h) => (1000 * 9.81 * q * h * ETA) / 1e6;

let piezasH = null;
let tiempo = 0;
let caudal = 180;
let caida = 100;
let giro = 0;

crearMaquina({
    figura: 'hidroelectrica',
    nombre: 'la presa',
    partes: [
        { n: 1, nombre: 'Embalse', ancla: [-2.2, 1.9, 0], vista: { tx: -2.0, ty: 0.9, tz: 0, az: 14, el: 18, d: 3.6 } },
        { n: 2, nombre: 'Cortina', ancla: [-0.6, 2.2, 0.5], vista: { tx: -0.6, ty: 1.0, tz: 0, az: 24, el: 14, d: 3.4 } },
        { n: 3, nombre: 'Compuerta de toma', ancla: [-0.95, 1.4, 0.2], vista: { tx: -0.9, ty: 0.9, tz: 0, az: 30, el: 10, d: 2.0 }, corte: true },
        { n: 4, nombre: 'Tubería a presión', ancla: [-0.2, 0.9, 0.2], vista: { tx: -0.2, ty: 0.6, tz: 0, az: 10, el: 12, d: 2.6 }, corte: true },
        { n: 5, nombre: 'Turbina', ancla: [0.7, 0.55, 0.3], vista: { tx: 0.7, ty: 0.4, tz: 0, az: 14, el: 22, d: 1.8 }, corte: true },
        { n: 6, nombre: 'Generador', ancla: [0.7, 1.05, 0.3], vista: { tx: 0.7, ty: 0.75, tz: 0, az: 14, el: 18, d: 1.8 }, corte: true },
        { n: 7, nombre: 'Desfogue y río', ancla: [2.0, 0.6, 0.3], vista: { tx: 1.9, ty: 0.3, tz: 0, az: -10, el: 18, d: 2.8 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: -0.2, ty: 0.85, tz: 0, az: 18, el: 16, d: 7.2 },
        { id: 'adentro', texto: 'Adentro', tx: 0.3, ty: 0.6, tz: 0, az: 8, el: 10, d: 3.2, corte: true },
        { id: 'lado', texto: 'De lado', tx: -0.2, ty: 0.8, tz: 0, az: 0, el: 2, d: 6.0, corte: true },
    ],
    entrada: { etiqueta: 'Agua por la turbina', min: 0, max: Q_MAX, paso: 5, valor: 180, aria: 'Caudal de agua por la turbina en metros cúbicos por segundo' },
    selectores: [{ id: 'nivel', etiqueta: 'Embalse', valor: 'alto', opciones: [{ id: 'alto', texto: 'Embalse alto' }, { id: 'bajo', texto: 'Embalse bajo' }] }],
    lento: [
        { id: 'lento', texto: '1/10', k: 0.1, nota: 'Cámara lenta: la turbina gira 10 veces más despacio.' },
        { id: 'real', texto: 'Real', k: 1, nota: 'A velocidad real la turbina da 180 vueltas por minuto, sincronizada con la red.' },
    ],
    hud: '<b data-c="mw"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'caudal', etiqueta: 'Caudal', nota: 'agua que pasa cada segundo' },
        { id: 'caida', etiqueta: 'Caída', nota: 'del embalse a la turbina' },
        { id: 'alabes', etiqueta: 'Álabes directores', nota: 'cuánto abren' },
        { id: 'hogares', etiqueta: 'En una hora', nota: 'energía producida' },
    ],
    curva: {
        titulo: 'Potencia según el caudal',
        leyenda: [{ texto: 'embalse alto (100 m)' }, { texto: 'embalse bajo (70 m)' }],
        nota: 'Más agua o más caída, más potencia: P = ρ · g · Q · H · η.',
        dibujar(g, w, h, estado) {
            const x = q => (q / Q_MAX) * (w - 10) + 5;
            const y = p => h - 6 - (p / 270) * (h - 14);
            g.lineWidth = 1.4;
            g.strokeStyle = estado.P.tinta;
            g.beginPath(); g.moveTo(x(0), y(0)); g.lineTo(x(Q_MAX), y(potencia(Q_MAX, 70))); g.stroke();
            g.lineWidth = 2.4;
            g.strokeStyle = estado.P.acento;
            g.beginPath(); g.moveTo(x(0), y(0)); g.lineTo(x(Q_MAX), y(potencia(Q_MAX, 100))); g.stroke();
            g.fillStyle = estado.P.acento;
            g.beginPath(); g.arc(x(caudal), y(potencia(caudal, caida)), 4.5, 0, Math.PI * 2); g.fill();
        },
    },
    corte: true,
    anchoVertical: 1.6,
    lejaniaMax: 2.8,
    entradaRecorrido: t => 150 + 140 * Math.sin(t * 0.25),

    construir({ raiz, M, P, sombra, contorno, conCorte }) {
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.16, 2.6), M.ceramica))).translateY(0.08));
        const roca = M.mat(P.ceramica === '#f7f5f1' ? '#d9cfbd' : '#bfb6a6', { roughness: 0.9 });

        // 1 · embalse: el agua guardada en alto, entre laderas
        const embalse = new THREE.Group();
        const vaso = sombra(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 2.2), roca));
        vaso.position.set(-2.1, BASE + 0.15, 0);
        const agua = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1, 2.1), M.agua);
        embalse.add(vaso, agua);
        raiz.add(embalse);

        // 2 · cortina: muro de concreto en forma de cuña
        const perfil = new THREE.Shape([new THREE.Vector2(-0.35, 0), new THREE.Vector2(0.35, 0), new THREE.Vector2(0.05, 1.75), new THREE.Vector2(-0.12, 1.75)]);
        const cortinaGeo = new THREE.ExtrudeGeometry(perfil, { depth: 2.3, bevelEnabled: false }).translate(0, 0, -1.15);
        const cortina = contorno(sombra(new THREE.Mesh(cortinaGeo, conCorte(M.ceramica.clone()))), 30);
        cortina.position.set(-0.65, BASE, 0);
        const corona = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 2.32), conCorte(M.borde.clone())));
        corona.position.set(-0.68, BASE + 1.77, 0);
        raiz.add(cortina, corona);

        // 3 · compuerta de toma, en la cara del embalse: sube o baja según el caudal
        const toma = new THREE.Group();
        toma.position.set(-0.98, BASE + 0.85, 0);
        toma.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.42), M.grafito)).translateY(0.1));
        const compuerta = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.34), M.borde));
        toma.add(compuerta);
        raiz.add(toma);

        // 4 · tubería a presión: de la toma, por dentro de la cortina, a la casa de máquinas
        const ruta = new THREE.CatmullRomCurve3([[-0.98, BASE + 0.85, 0], [-0.6, BASE + 0.65, 0], [-0.2, BASE + 0.4, 0], [0.25, BASE + 0.3, 0], [0.5, BASE + 0.32, 0]].map(p => new THREE.Vector3(...p)));
        const vidrio = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.08, transparent: true, opacity: 0.3, clearcoat: 1, depthWrite: false });
        const tuberia = new THREE.Mesh(new THREE.TubeGeometry(ruta, 64, 0.09, 16, false), vidrio);
        tuberia.renderOrder = 2;
        raiz.add(tuberia);

        // 5 y 6 · casa de máquinas: caracol de la turbina, rodete que gira, álabes directores y generador encima
        const casa = new THREE.Group();
        casa.position.set(0.75, BASE, 0);
        const muros = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 1.1), conCorte(M.ceramica.clone()))));
        muros.position.y = 0.5;
        const techo = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.05, 1.14), conCorte(M.borde.clone())));
        techo.position.y = 1.02;
        casa.add(muros, techo);
        const caracol = sombra(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.07, 14, 40), M.grafito));
        caracol.rotation.x = Math.PI / 2;
        caracol.position.set(0, 0.32, 0);
        const rodete = new THREE.Group();
        rodete.position.set(0, 0.32, 0);
        for (let i = 0; i < 9; i++) { const a = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.018), M.acero)); a.position.set(Math.cos((i * 2 * Math.PI) / 9) * 0.07, 0, Math.sin((i * 2 * Math.PI) / 9) * 0.07); a.rotation.y = -(i * 2 * Math.PI) / 9 + 0.5; rodete.add(a); }
        rodete.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.1, 16), M.acero)));
        const alabes = [];
        for (let i = 0; i < 12; i++) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.01), M.borde); const ang = (i * 2 * Math.PI) / 12; a.position.set(Math.cos(ang) * 0.15, 0.32, Math.sin(ang) * 0.15); a.userData.ang = ang; casa.add(a); alabes.push(a); }
        const flecha = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.36, 12), M.acero));
        flecha.position.set(0, 0.55, 0);
        const generador = new THREE.Group();
        generador.position.set(0, 0.8, 0);
        generador.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.22, 32), M.cobre)));
        generador.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.015, 8, 32).rotateX(Math.PI / 2), M.borde)).translateY(0.11));
        casa.add(caracol, rodete, flecha, generador);
        raiz.add(casa);

        // 7 · desfogue y río, más abajo
        const rio = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 1.0), M.agua);
        rio.position.set(2.15, BASE + 0.03, 0);
        const desfogue = new THREE.CatmullRomCurve3([[0.75, BASE + 0.25, 0.1], [1.1, BASE + 0.12, 0.1], [1.5, BASE + 0.07, 0.05], [3.1, BASE + 0.07, 0]].map(p => new THREE.Vector3(...p)));
        raiz.add(rio);

        // gotas de agua: por la tubería y por el desfogue
        const gotas = (curva, n, r) => { const im = new THREE.InstancedMesh(new THREE.SphereGeometry(r, 8, 6), new THREE.MeshBasicMaterial({ color: P.agua }), n); im.frustumCulled = false; im.renderOrder = 3; raiz.add(im); return { im, curva, n }; };
        const flujoTubo = gotas(ruta, 24, 0.035);
        const flujoRio = gotas(desfogue, 26, 0.03);
        // línea a la red
        const linea = new THREE.CatmullRomCurve3([[1.0, BASE + 1.0, -0.4], [1.6, BASE + 1.3, -0.8], [2.6, BASE + 1.1, -0.9]].map(p => new THREE.Vector3(...p)));
        raiz.add(new THREE.Mesh(new THREE.TubeGeometry(linea, 32, 0.012, 6, false), M.grafito));
        const torre = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.03, 1.2, 4), M.borde));
        torre.position.set(2.6, BASE + 0.6, -0.9);
        raiz.add(torre);

        piezasH = { agua, compuerta, rodete, alabes, flujoTubo, flujoRio, generador };
        return {
            piezas: { 1: [embalse], 2: [cortina, corona], 3: [toma], 4: [tuberia], 5: [rodete, caracol, ...alabes], 6: [generador, flecha], 7: [rio] },
            movibles: [
                { parte: 6, objetos: [generador, flecha], hacia: [0, 0.8, 0] },
                { parte: 5, objetos: [rodete, caracol, ...alabes], hacia: [0, 0.4, 0.7] },
                { parte: 3, objetos: [toma], hacia: [-0.3, 0.4, 0] },
            ],
            anclas: { 1: [embalse, [-2.1, 1.7, 0]], 2: [cortina, [0, 1.9, 0.5]], 3: [toma, [0, 0.4, 0.2]], 4: [tuberia, [-0.2, 0.75, 0.2]], 5: [rodete, [0, 0.15, 0.3]], 6: [generador, [0, 0.3, 0.3]], 7: [rio, [0, 0.4, 0.3]] },
        };
    },

    paso(estado) {
        const S = piezasH;
        const { dt, dtSim, e } = estado;
        estado.entrada += (estado.entradaObjetivo - estado.entrada) * (1 - Math.exp(-dt / 0.4));
        caudal = estado.entrada;
        const alto = estado.sel.nivel === 'alto';
        caida += ((alto ? 100 : 70) - caida) * (1 - Math.exp(-dt / 0.6));
        tiempo += dtSim;
        const mw = potencia(caudal, caida);
        const abre = caudal / Q_MAX;

        // nivel del agua del embalse (la caída se ve en la altura del agua)
        const nivel = 0.5 + (caida - 70) / 30 * 0.9;
        S.agua.scale.y = nivel;
        S.agua.position.set(-2.2, BASE + 0.3 + nivel / 2, 0);
        S.compuerta.position.y = 0.05 + abre * 0.3;
        S.alabes.forEach(a => { a.rotation.y = -a.userData.ang + 0.3 + abre * 0.9; });
        const opera = caudal > 2 ? 1 : 0;
        giro += opera * (RPM / 60) * 2 * Math.PI * dtSim;
        S.rodete.rotation.y = giro;
        S.generador.rotation.y = giro;
        const m = new THREE.Matrix4();
        const q = new THREE.Vector3();
        [[S.flujoTubo, 0.5], [S.flujoRio, 0.25]].forEach(([fl, vel]) => {
            fl.im.visible = opera && e < 0.2;
            if (!fl.im.visible) return;
            for (let i = 0; i < fl.n; i++) { fl.curva.getPointAt(((i / fl.n) + tiempo * vel * (0.3 + abre) / Math.max(0.1, estado.lento.k) * 0.1) % 1, q); m.makeTranslation(q.x, q.y, q.z); fl.im.setMatrixAt(i, m); }
            fl.im.instanceMatrix.needsUpdate = true;
        });

        return {
            cifras: {
                mw: `${num(mw, 1)} MW`,
                hud: caudal < 2 ? 'Compuerta cerrada: el agua se queda guardada en el embalse' : alto ? 'Embalse alto: cada litro cae 100 m' : 'Embalse bajo: con menos caída, la misma agua da menos energía',
                caudal: `${num(caudal)} m³/s`,
                caida: `${num(caida)} m`,
                alabes: `${num(abre * 100)} %`,
                hogares: `${num(mw)} MWh`,
            },
        };
    },
});
