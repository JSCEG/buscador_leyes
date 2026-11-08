// «¿Qué son los hidrocarburos?», en 3D: un banco de química con una molécula de bolitas y palitos (carbono en grafito,
// hidrógeno en blanco, enlaces en guinda) que crece de 1 a 24 carbonos. A su lado, un frasco muestra si esa sustancia es
// gas, líquido o sólido a 25 °C, un termómetro marca a qué temperatura hierve y un quemador la quema.
//
// Entrada: cuántos átomos de carbono tiene la cadena (alcanos lineales, CₙH₂ₙ₊₂).
//
// Cifras (alcanos lineales a presión normal):
// - Puntos de ebullición y de fusión de tablas de referencia (CRC Handbook): metano −161.5 °C … tetracosano 391 °C.
//   A 25 °C: de 1 a 4 carbonos son gases, de 5 a 17 líquidos y de 18 en adelante sólidos (ceras).
// - Calor de combustión (poder calorífico superior): ΔH ≈ 658.5 n + 232 kJ/mol (metano 890 kJ/mol, octano ≈ 5 500).
//   Masa molar: 14.027 n + 2.016 g/mol. Por kilo da de 55.5 MJ/kg (metano) a ≈ 47 MJ/kg (cadenas largas).
// - Combustión completa: CₙH₂ₙ₊₂ + (3n + 1)/2 O₂ → n CO₂ + (n + 1) H₂O.
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';

const N_MAX = 24;
const BASE = 0.16;
// ebullición y fusión, en °C, de n = 1 a 24
const EBULLE = [-161.5, -88.6, -42.1, -0.5, 36.1, 68.7, 98.4, 125.7, 150.8, 174.1, 195.9, 216.3, 235.4, 253.5, 270.6, 286.8, 302.0, 316.3, 329.9, 343.0, 356.5, 369.0, 380.0, 391.3];
const FUNDE = [-182.5, -182.8, -187.7, -138.3, -129.7, -95.3, -90.6, -56.8, -53.5, -29.7, -25.6, -9.6, -5.4, 5.9, 9.9, 18.2, 22.0, 28.2, 32.1, 36.8, 40.5, 44.4, 47.6, 50.9];
const NOMBRES = ['metano', 'etano', 'propano', 'butano', 'pentano', 'hexano', 'heptano', 'octano', 'nonano', 'decano', 'undecano', 'dodecano', 'tridecano', 'tetradecano', 'pentadecano', 'hexadecano', 'heptadecano', 'octadecano', 'nonadecano', 'icosano', 'henicosano', 'docosano', 'tricosano', 'tetracosano'];
const uso = n => n === 1 ? 'gas natural'
    : n === 2 ? 'materia prima de plásticos'
        : n <= 4 ? 'gas LP'
            : n <= 10 ? 'gasolinas'
                : n <= 13 ? 'turbosina'
                    : n <= 17 ? 'diésel'
                        : n <= 20 ? 'parafinas y ceras'
                            : 'combustóleo y asfalto';
const estadoA25 = n => (EBULLE[n - 1] < 25 ? 'gas' : FUNDE[n - 1] > 25 ? 'sólido' : 'líquido');
const kJmol = n => 658.5 * n + 232;
const masa = n => 14.027 * n + 2.016;
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const sub = k => (k === 1 ? '' : String(k).replace(/\d/g, d => SUB[d]));
const formula = n => `C${sub(n)}H${sub(2 * n + 2)}`;
const fraccion = k => (k % 1 === 0 ? String(k) : `${k * 2}/2`);

// geometría del alcano en zigzag (unidades de la molécula: enlace C–C = 1)
const PASO = Math.sin(54.75 * Math.PI / 180); // 0.8165
const MEDIA = Math.cos(54.75 * Math.PI / 180) / 2; // 0.2887
const R_C = 0.3;
const R_H = 0.2;
const L_CH = 0.72;
const PC = 0.182;

let piezasH = null;
let giro = 0;
let tiempo = 0;
let escalaMol = 0.6;

crearMaquina({
    figura: 'hidrocarburos',
    nombre: 'el banco de química',
    partes: [
        { n: 1, nombre: 'Átomo de carbono', ancla: [-0.5, 1.9, 0], vista: { tx: -0.4, ty: 1.35, tz: 0, az: 10, el: 12, d: 3.0 } },
        { n: 2, nombre: 'Átomo de hidrógeno', ancla: [0.1, 1.95, 0.2], vista: { tx: -0.4, ty: 1.35, tz: 0, az: 26, el: 22, d: 3.0 } },
        { n: 3, nombre: 'Enlace químico', ancla: [-0.2, 1.75, 0], vista: { tx: -0.4, ty: 1.35, tz: 0, az: 4, el: 6, d: 2.4 } },
        { n: 4, nombre: 'Frasco', ancla: [2.0, 1.35, 0.4], vista: { tx: 2.0, ty: 0.65, tz: 0.4, az: -14, el: 14, d: 2.6 } },
        { n: 5, nombre: 'Termómetro', ancla: [2.75, 2.0, -0.45], vista: { tx: 2.75, ty: 1.05, tz: -0.45, az: -10, el: 8, d: 2.8 } },
        { n: 6, nombre: 'Quemador', ancla: [-2.75, 1.55, 0.5], vista: { tx: -2.75, ty: 0.75, tz: 0.45, az: 16, el: 14, d: 2.8 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: 0, ty: 0.95, tz: 0, az: 14, el: 18, d: 7.6 },
        { id: 'molecula', texto: 'Molécula', tx: -0.4, ty: 1.35, tz: 0, az: 8, el: 10, d: 3.6 },
        { id: 'arriba', texto: 'Arriba', tx: 0, ty: 0.3, tz: 0, az: 0, el: 70, d: 7.6 },
    ],
    entrada: { etiqueta: 'Átomos de carbono', min: 1, max: N_MAX, paso: 1, valor: 8, aria: 'Átomos de carbono en la molécula' },
    selectores: [{ id: 'fuego', etiqueta: 'Quemador', valor: 'si', opciones: [{ id: 'si', texto: 'Quemar' }, { id: 'no', texto: 'Apagar' }] }],
    lento: [
        { id: 'lento', texto: 'Despacio', k: 0.3, nota: 'La molécula gira despacio para ver dónde va cada átomo.' },
        { id: 'real', texto: 'Normal', k: 1, nota: 'Los átomos vibran sin parar; en la realidad lo hacen billones de veces por segundo.' },
    ],
    hud: '<b data-c="formula"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'estado', etiqueta: 'A 25 °C es', nota: 'gas, líquido o sólido' },
        { id: 'ebulle', etiqueta: 'Hierve a', nota: 'a presión normal' },
        { id: 'calor', etiqueta: 'Calor al quemarse', nota: 'por cada kilo' },
        { id: 'oxigeno', etiqueta: 'Oxígeno para quemarla', nota: 'moléculas de O₂ por molécula' },
    ],
    curva: {
        titulo: 'Temperatura a la que hierve, según los carbonos',
        leyenda: [{ texto: 'punto de ebullición' }, { texto: '25 °C' }],
        nota: 'Cadenas más largas se atraen más entre sí: hace falta más calor para separarlas y volverlas gas.',
        dibujar(g, w, h, estado) {
            const x = n => ((n - 1) / (N_MAX - 1)) * (w - 10) + 5;
            const y = t => h - 6 - ((t + 200) / 620) * (h - 14);
            g.lineWidth = 1.2;
            g.strokeStyle = estado.P.tinta;
            g.setLineDash([4, 4]);
            g.beginPath(); g.moveTo(x(1), y(25)); g.lineTo(x(N_MAX), y(25)); g.stroke();
            g.setLineDash([]);
            g.lineWidth = 2.4;
            g.strokeStyle = estado.P.acento;
            g.beginPath();
            EBULLE.forEach((t, i) => (i === 0 ? g.moveTo(x(i + 1), y(t)) : g.lineTo(x(i + 1), y(t))));
            g.stroke();
            const n = clamp(Math.round(estado.entrada), 1, N_MAX);
            g.fillStyle = estado.P.acento;
            g.beginPath(); g.arc(x(n), y(EBULLE[n - 1]), 4.5, 0, Math.PI * 2); g.fill();
        },
    },
    corte: false,
    anchoVertical: 1.65,
    lejaniaMax: 2.8,

    construir({ raiz, M, P, TEMA, sombra, contorno }) {
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.16, 3.0), M.ceramica))).translateY(0.08));

        // 1, 2 y 3 · la molécula sobre su soporte: un disco que la hace girar sobre su eje
        const soporte = new THREE.Group();
        soporte.position.set(-0.4, BASE, 0);
        soporte.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.12, 48), M.ceramica)), 40).translateY(0.06));
        soporte.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.022, 10, 48).rotateX(Math.PI / 2), M.borde)).translateY(0.12));
        soporte.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.36, 16), M.grafito)).translateY(0.3));
        soporte.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.06, 24), M.borde)).translateY(0.5));
        raiz.add(soporte);

        const mol = new THREE.Group();
        mol.position.set(-0.4, 1.35, 0);
        const giroG = new THREE.Group();
        mol.add(giroG);
        raiz.add(mol);
        const esferaC = new THREE.SphereGeometry(R_C, 28, 20);
        const esferaH = new THREE.SphereGeometry(R_H, 22, 16);
        const barra = new THREE.CylinderGeometry(0.075, 0.075, 1, 12);
        const carbonos = [];
        const hidrogenos = []; // { m, enlace, c (de qué carbono), dir }
        const enlacesCC = [];
        const posC = i => new THREE.Vector3(i * PASO, i % 2 === 0 ? -MEDIA : MEDIA, 0);
        const ponerEnlace = (m, a, b) => {
            const d = new THREE.Vector3().subVectors(b, a);
            m.position.copy(a).addScaledVector(d, 0.5);
            m.scale.set(1, d.length(), 1);
            m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
        };
        const s = Math.sin(54.75 * Math.PI / 180);
        const c = Math.cos(54.75 * Math.PI / 180);
        for (let i = 0; i < N_MAX; i++) {
            const m = sombra(new THREE.Mesh(esferaC, M.grafito));
            m.position.copy(posC(i));
            giroG.add(m);
            carbonos.push({ m, mostrar: 0 });
            const arriba = i % 2 === 0 ? -1 : 1; // los carbonos de abajo tienen sus H hacia abajo
            for (const z of [-1, 1]) {
                const h = sombra(new THREE.Mesh(esferaH, M.ceramica));
                const e = sombra(new THREE.Mesh(barra, M.borde));
                giroG.add(h, e);
                hidrogenos.push({ m: h, enlace: e, c: i, dir: new THREE.Vector3(0, arriba * c, z * s), mostrar: 0 });
            }
            if (i > 0) {
                const e = sombra(new THREE.Mesh(barra, M.borde));
                ponerEnlace(e, posC(i - 1), posC(i));
                giroG.add(e);
                enlacesCC.push({ m: e, mostrar: 0 });
            }
        }
        // el hidrógeno del principio (fijo en el carbono 0) y el del final (va al último carbono)
        const extremo = () => { const h = sombra(new THREE.Mesh(esferaH, M.ceramica)); const e = sombra(new THREE.Mesh(barra, M.borde)); giroG.add(h, e); return { m: h, enlace: e }; };
        const hInicio = { ...extremo(), c: 0, dir: new THREE.Vector3(-s, c, 0) };
        const hFinal = extremo();

        // 4 · frasco de vidrio con tapa: dentro, la sustancia a 25 °C
        const frasco = new THREE.Group();
        frasco.position.set(2.0, BASE, 0.4);
        const vidrio = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.06, transparent: true, opacity: 0.22, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide });
        const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.95, 40, 1, true), vidrio);
        tubo.position.y = 0.475;
        tubo.renderOrder = 2;
        frasco.add(tubo, contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.05, 40), M.ceramica)), 40).translateY(0.025));
        frasco.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.12, 40), M.ceramica)), 40).translateY(1.0));
        frasco.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.022, 10, 48).rotateX(Math.PI / 2), M.borde)).translateY(0.94));
        const colorLiquido = new THREE.Color();
        const liquido = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 1, 36), M.mat('#e8c46a', { roughness: 0.15, transparent: true, opacity: 0.75 }));
        liquido.renderOrder = 1;
        const cera = contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.31, 0.42, 36), M.mat('#efe9d8', { roughness: 0.7 }))), 40);
        cera.position.y = 0.26;
        const gas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 10, 8), M.mat(P.suave, { roughness: 0.4 }), 28);
        gas.frustumCulled = false;
        const semillas = Array.from({ length: 28 }, (_, i) => [Math.sin(i * 12.9898) * 43758.5453 % 1, Math.sin(i * 78.233) * 12543.1 % 1, Math.sin(i * 39.425) * 9137.7 % 1].map(Math.abs));
        frasco.add(liquido, cera, gas);
        raiz.add(frasco);

        // 5 · termómetro: tablilla blanca, tubo de vidrio con su columna guinda, marcas cada 100 °C y la de 25 °C
        const termo = new THREE.Group();
        termo.position.set(2.75, BASE, -0.45);
        termo.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.7, 0.08), M.ceramica))).translateY(0.95));
        termo.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.3), M.grafito)).translateY(0.05));
        const T0 = 0.3;
        const T1 = 1.6;
        const altura = t => T0 + ((t + 200) / 600) * (T1 - T0);
        const capilar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, T1 - T0 + 0.08, 16), vidrio);
        capilar.position.set(0, (T0 + T1) / 2, 0.07);
        capilar.renderOrder = 2;
        const bulbo = sombra(new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 14), M.borde));
        bulbo.position.set(0, T0 - 0.04, 0.07);
        const columna = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1, 12), M.borde);
        columna.position.set(0, T0, 0.07);
        termo.add(capilar, bulbo, columna);
        for (let t = -200; t <= 400; t += 100) {
            const marca = new THREE.Mesh(new THREE.BoxGeometry(t === 0 ? 0.14 : 0.09, 0.012, 0.01), M.grafito);
            marca.position.set(-0.12, altura(t), 0.045);
            termo.add(marca);
        }
        const ambiente = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.014, 0.012), M.mat(P.corriente, { roughness: 0.5 }));
        ambiente.position.set(0, altura(25), 0.05);
        termo.add(ambiente);
        const lectura = pantalla(0.34, 0.13);
        lectura.position.set(0, 1.72, 0.045);
        termo.add(lectura);
        raiz.add(termo);

        // 6 · quemador: la sustancia llega por una manguera desde su tanque (lo flamable nunca va por el aire)
        const quemador = new THREE.Group();
        quemador.position.set(-2.75, BASE, 0.5);
        quemador.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.08, 36), M.ceramica)), 40).translateY(0.04));
        quemador.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.62, 20), M.grafito)).translateY(0.39));
        quemador.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.016, 8, 24).rotateX(Math.PI / 2), M.borde)).translateY(0.7));
        const llave = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.05), M.borde));
        llave.position.set(0.1, 0.18, 0);
        quemador.add(llave);
        const flamaMat = new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
        const nucleoMat = new THREE.MeshBasicMaterial({ color: '#6fa8ff', transparent: true, opacity: 0.85, depthWrite: false });
        const flama = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.42, 20, 1, true).translate(0, 0.21, 0), flamaMat);
        const nucleo = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.16, 16, 1, true).translate(0, 0.08, 0), nucleoMat);
        flama.position.y = nucleo.position.y = 0.72;
        flama.renderOrder = nucleo.renderOrder = 4;
        flama.userData.sinResalte = nucleo.userData.sinResalte = true;
        quemador.add(flama, nucleo);
        // humo de la combustión: CO₂ (grafito con dos oxígenos) y H₂O (oxígeno con dos hidrógenos) que suben
        const oxigeno = M.mat(P.agua, { roughness: 0.4 });
        const productos = [];
        for (let i = 0; i < 6; i++) {
            const p = new THREE.Group();
            if (i % 2 === 0) {
                p.add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), M.grafito));
                for (const x of [-0.06, 0.06]) p.add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 10), oxigeno).translateX(x));
            } else {
                p.add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), oxigeno));
                for (const x of [-0.045, 0.045]) p.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), M.ceramica).translateX(x).translateY(-0.03));
            }
            p.userData.fase = i / 6;
            p.userData.sinResalte = true;
            quemador.add(p);
            productos.push(p);
        }
        raiz.add(quemador);
        const tanque = new THREE.Group();
        tanque.position.set(-2.75, BASE, -0.75);
        tanque.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.6, 32), M.ceramica)), 40).translateY(0.34));
        tanque.add(sombra(new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.ceramica)).translateY(0.64));
        tanque.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.018, 10, 40).rotateX(Math.PI / 2), M.borde)).translateY(0.2));
        tanque.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 14), M.borde)).translateY(0.88));
        raiz.add(tanque);
        const curva = (...p) => new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));
        const manguera = sombra(new THREE.Mesh(new THREE.TubeGeometry(curva([-2.75, 0.92, -0.75], [-2.75, 1.0, -0.45], [-2.55, PC, -0.25], [-2.55, PC, 0.35], [-2.65, 0.34, 0.5]), 64, 0.022, 8, false), M.cable));
        raiz.add(manguera);

        piezasH = {
            carbonos, hidrogenos, enlacesCC, hInicio, hFinal, giroG, mol, ponerEnlace, posC, s, c,
            liquido, cera, gas, semillas, colorLiquido, columna, altura, lectura, flama, nucleo, flamaMat, productos, TEMA,
        };
        const atomosC = carbonos.map(x => x.m);
        const atomosH = [...hidrogenos.map(x => x.m), hInicio.m, hFinal.m];
        const enlaces = [...enlacesCC.map(x => x.m), ...hidrogenos.map(x => x.enlace), hInicio.enlace, hFinal.enlace];
        return {
            piezas: { 1: atomosC, 2: atomosH, 3: enlaces, 4: [frasco], 5: [termo], 6: [quemador, tanque, manguera] },
            movibles: [
                { parte: 1, objetos: [mol, soporte], hacia: [0, 0.5, 0] },
                { parte: 4, objetos: [frasco], hacia: [0.35, 0, 0.35] },
                { parte: 5, objetos: [termo], hacia: [0.35, 0, -0.35] },
                { parte: 6, objetos: [quemador], hacia: [-0.35, 0, 0.3] },
            ],
            anclas: { 1: [mol, [0, 0.45, 0]], 2: [mol, [0.5, 0.5, 0.2]], 3: [mol, [0.2, 0.35, 0]], 4: [frasco, [0, 1.2, 0]], 5: [termo, [0, 1.85, 0]], 6: [quemador, [0, 1.3, 0]] },
        };
    },

    paso(estado) {
        const H = piezasH;
        const { dt, dtSim, e } = estado;
        estado.entrada += (estado.entradaObjetivo - estado.entrada) * (1 - Math.exp(-dt / 0.25));
        const n = clamp(Math.round(estado.entrada), 1, N_MAX);
        tiempo += dtSim;
        giro += dtSim * 0.6;
        const separar = 1 + e * 1.4; // al desarmar, los átomos se separan del centro

        // la molécula: cada átomo aparece o se va poco a poco; se centra y se encoge para caber en el banco
        const largo = (n - 1) * PASO + 2 * (R_C + L_CH);
        escalaMol += (Math.min(0.62, 3.4 / largo) - escalaMol) * (1 - Math.exp(-dt / 0.3));
        H.mol.scale.setScalar(escalaMol);
        H.giroG.rotation.x = giro;
        H.giroG.position.x = -((n - 1) * PASO) / 2 * separar;
        const suave = 1 - Math.exp(-dt / 0.12);
        const vibra = i => 1 + Math.sin(tiempo * 9 + i * 1.7) * 0.025;
        const posC = i => H.posC(i).multiplyScalar(separar);
        H.carbonos.forEach((cb, i) => {
            cb.mostrar += ((i < n ? 1 : 0) - cb.mostrar) * suave;
            cb.m.visible = cb.mostrar > 0.02;
            cb.m.scale.setScalar(cb.mostrar);
            cb.m.position.copy(posC(i));
        });
        H.enlacesCC.forEach((en, j) => {
            en.mostrar += ((j + 1 < n ? 1 : 0) - en.mostrar) * suave;
            en.m.visible = en.mostrar > 0.02 && e < 0.5;
            // el enlace crece desde el carbono anterior mientras aparece el nuevo
            H.ponerEnlace(en.m, posC(j), posC(j).lerp(posC(j + 1), en.mostrar));
            en.m.scale.x = en.m.scale.z = 1 - e * 2;
        });
        const ponerH = (h, i, dir, k) => {
            const centro = posC(i);
            const k1 = h.mostrar ?? 1;
            const p = centro.clone().addScaledVector(dir, L_CH * vibra(k) * separar * k1);
            h.m.position.copy(p);
            h.m.scale.setScalar(k1);
            h.m.visible = k1 > 0.02;
            h.enlace.visible = h.m.visible && e < 0.5;
            H.ponerEnlace(h.enlace, centro, p);
            h.enlace.scale.x = h.enlace.scale.z = 1 - e * 2;
        };
        H.hidrogenos.forEach((h, k) => {
            h.mostrar += ((h.c < n ? 1 : 0) - h.mostrar) * suave;
            ponerH(h, h.c, h.dir, k);
        });
        ponerH(H.hInicio, 0, H.hInicio.dir, 99);
        const ultimo = n - 1;
        const dirFinal = new THREE.Vector3(H.s, (ultimo % 2 === 0 ? 1 : -1) * H.c, 0);
        ponerH(H.hFinal, ultimo, dirFinal, 98);

        // el frasco: gas (puntos que rebotan), líquido (más oscuro cuanto más larga la cadena) o sólido (cera)
        const fase = estadoA25(n);
        const esGas = fase === 'gas';
        H.gas.visible = esGas;
        if (esGas) {
            const m = new THREE.Matrix4();
            H.semillas.forEach(([a, b, c], i) => {
                const ang = a * Math.PI * 2 + tiempo * (0.4 + b);
                const r = 0.08 + c * 0.2;
                m.makeTranslation(Math.cos(ang) * r, 0.12 + ((b * 0.8 + tiempo * (0.15 + c * 0.2)) % 1) * 0.76, Math.sin(ang) * r);
                H.gas.setMatrixAt(i, m);
            });
            H.gas.instanceMatrix.needsUpdate = true;
        }
        H.liquido.visible = fase === 'líquido';
        const nivel = 0.5;
        H.liquido.scale.y = nivel;
        H.liquido.position.y = 0.05 + nivel / 2;
        H.colorLiquido.set('#f2e3a6').lerp(new THREE.Color('#8a5a1c'), clamp((n - 5) / 12, 0, 1));
        H.liquido.material.color.copy(H.colorLiquido);
        H.cera.visible = fase === 'sólido';
        H.cera.material.color.set('#efe9d8').lerp(new THREE.Color('#3a2a1a'), clamp((n - 19) / 5, 0, 1));

        // el termómetro marca la temperatura a la que hierve
        const t = EBULLE[n - 1];
        const alto = H.altura(t) - H.altura(-200) + 0.01;
        H.columna.scale.y += (alto - H.columna.scale.y) * suave;
        H.columna.position.y = H.altura(-200) + H.columna.scale.y / 2;
        H.lectura.userData.poner(`${num(t, 0)} °C`);

        // el quemador: la flama crece con el calor que suelta cada molécula
        const fuego = estado.sel.fuego === 'si' ? 1 - clamp(e * 6 + estado.arrastre[6].length() * 4, 0, 1) : 0;
        const tam = 0.7 + Math.min(1.1, Math.sqrt(kJmol(n) / kJmol(1)) * 0.25);
        const parpadeo = 1 + Math.sin(tiempo * 23) * 0.05 + Math.sin(tiempo * 37) * 0.04;
        H.flama.visible = H.nucleo.visible = fuego > 0.02;
        H.flama.scale.set(fuego * tam, fuego * tam * parpadeo, fuego * tam);
        H.nucleo.scale.setScalar(fuego * tam);
        H.flamaMat.opacity = 0.75 * fuego;
        H.productos.forEach(p => {
            const u = (p.userData.fase + tiempo * 0.35) % 1;
            p.visible = fuego > 0.02;
            p.position.set(Math.sin(u * 9 + p.userData.fase * 6) * 0.1, 0.72 + 0.45 * tam + u * 0.9, Math.cos(u * 7) * 0.06);
            p.scale.setScalar(Math.sin(u * Math.PI) * fuego);
            p.rotation.y = u * 6;
        });

        const o2 = (3 * n + 1) / 2;
        return {
            cifras: {
                formula: formula(n),
                hud: `${NOMBRES[n - 1]} · ${uso(n)}`,
                estado: fase,
                ebulle: `${num(t, 1)} °C`,
                calor: `${num(kJmol(n) / masa(n), 1)} MJ/kg`,
                oxigeno: fraccion(o2),
            },
        };
    },
});

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
        g.font = `700 ${Math.round(c.height * 0.58)}px Manrope, sans-serif`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(texto, c.width / 2, c.height / 2 + 3);
        t.needsUpdate = true;
    };
    return m;
}
