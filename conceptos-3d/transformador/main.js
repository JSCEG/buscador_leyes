// «Transformador», en 3D: un núcleo de hierro con dos bobinas. La corriente alterna de la bobina de pocas vueltas
// magnetiza el núcleo; el magnetismo va y viene por el hierro e induce voltaje en la bobina de muchas vueltas.
//
// Entrada: las vueltas de la bobina de salida (Ns, de 1 a 30). La bobina de entrada tiene Np = 3. Las bobinas se
// dibujan con exactamente esas vueltas. El tiempo mueve la corriente alterna (60 Hz) y el magnetismo del núcleo.
//
// Cifras (las de la ficha):
// - Vs ÷ Vp = Ns ÷ Np: con 3 y 25 vueltas, 13.8 kV × 25 ÷ 3 = 115 kV.
// - Vp × Ip ≈ Vs × Is: 30 MW ÷ 13.8 kV ≈ 2,174 A; 30 MW ÷ 115 kV ≈ 261 A. (Cuenta de una fase, como en la ficha; en
//   trifásica cada corriente se divide además entre √3.)
// - Pérdida en la línea = I² × R: con la corriente 8.3 veces menor se pierde (2,174 ÷ 261)² ≈ 69 veces menos.
// - El magnetismo del núcleo va un cuarto de ciclo detrás del voltaje (Φ = ∫ v dt): cuando el voltaje cruza cero, el
//   magnetismo está en su punto más alto.
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';
import { crearCorriente } from '../comun/corriente.js';

const NP = 3;
const VP_KV = 13.8;
const POTENCIA_MW = 30;
const F = 60;
const PISO_CABLE = 0.182;
// núcleo: dos piernas verticales y dos yugos; las bobinas abrazan las piernas
const XL = 0.7; // centro de cada pierna
const LADO = 0.36; // sección de la pierna
const Y0 = 0.34; // abajo del yugo inferior
const Y1 = 2.48; // arriba del yugo superior
const YUGO = 0.18;
const B0 = 0.8; // donde empiezan las bobinas
const ALTO_BOBINA = 1.12;

let fase = 0;
let ns = 25;
let piezasT = null;

crearMaquina({
    figura: 'transformador',
    nombre: 'el transformador',
    partes: [
        { n: 1, nombre: 'Núcleo de hierro', ancla: [0, Y1 + 0.1, 0.2], vista: { tx: 0, ty: 1.4, tz: 0, az: 18, el: 14, d: 4.6 } },
        { n: 2, nombre: 'Bobina de pocas vueltas', ancla: [-XL, B0 + ALTO_BOBINA + 0.15, 0.4], vista: { tx: -XL, ty: 1.35, tz: 0, az: -24, el: 14, d: 3.4 } },
        { n: 3, nombre: 'Bobina de muchas vueltas', ancla: [XL, B0 + ALTO_BOBINA + 0.15, 0.4], vista: { tx: XL, ty: 1.35, tz: 0, az: 24, el: 14, d: 3.4 } },
        { n: 4, nombre: 'Lado de bajo voltaje', ancla: [-2.45, 1.05, 0], vista: { tx: -2.0, ty: 0.7, tz: 0, az: -30, el: 16, d: 3.6 } },
        { n: 5, nombre: 'Lado de alto voltaje', ancla: [1.75, 2.1, 0], vista: { tx: 2.1, ty: 1.4, tz: 0, az: 30, el: 12, d: 4.6 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: 0, ty: 1.25, tz: 0, az: 26, el: 16, d: 8.6 },
        { id: 'frente', texto: 'Frente', tx: 0, ty: 1.25, tz: 0, az: 0, el: 6, d: 8.2 },
        { id: 'lado', texto: 'Lado', tx: 0, ty: 1.25, tz: 0, az: 84, el: 10, d: 7.4 },
        { id: 'arriba', texto: 'Arriba', tx: 0, ty: 0.8, tz: 0, az: 0, el: 66, d: 8.8 },
        { id: 'nucleo', texto: 'Núcleo', tx: 0, ty: 1.4, tz: 0, az: 10, el: 8, d: 4.4 },
    ],
    entrada: { etiqueta: 'Vueltas de salida', min: 1, max: 30, paso: 1, valor: 25, aria: 'Número de vueltas de la bobina de salida' },
    hud: '<b data-c="vs"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'vs', etiqueta: 'Voltaje de salida', nota: 'entran 13.8 kV' },
        { id: 'ip', etiqueta: 'Corriente de entrada', nota: 'en la bobina de pocas vueltas' },
        { id: 'is', etiqueta: 'Corriente de salida', nota: 'en la bobina de muchas vueltas' },
        { id: 'perdida', etiqueta: 'Pérdida en la línea', nota: 'comparada con no transformar' },
    ],
    curva: {
        titulo: 'Voltaje de entrada y de salida',
        leyenda: [{ texto: 'salida' }, { texto: 'entrada' }],
        nota: 'La misma frecuencia, distinta altura: el transformador solo cambia el tamaño del voltaje.',
        dibujar(g, w, h, estado) {
            const vs = VP_KV * ns / NP;
            const tope = Math.max(vs, VP_KV);
            const serie = (amp, color, ancho) => {
                g.strokeStyle = color;
                g.lineWidth = ancho;
                g.beginPath();
                for (let px = 0; px <= w; px += 2) {
                    const a = fase - Math.PI * 4 * (1 - px / w);
                    const y = h / 2 - Math.sin(a) * amp / tope * (h / 2 - 8);
                    if (px === 0) g.moveTo(px, y); else g.lineTo(px, y);
                }
                g.stroke();
            };
            serie(VP_KV, estado.P.tinta, 1.4);
            serie(vs, estado.P.acento, 2.4);
        },
    },
    corte: false,

    construir({ raiz, M, P, sombra, contorno, escena }) {
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.16, 2.9), M.ceramica))).translateY(0.08));

        // 1 · Núcleo de hierro laminado (grafito), apoyado en dos patas blancas
        const nucleo = new THREE.Group();
        const caja = (w, h, d, x, y) => { const m = sombra(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.grafito)); m.position.set(x, y, 0); return m; };
        const ancho = 2 * XL + LADO;
        nucleo.add(caja(ancho, YUGO, LADO, 0, Y0 + YUGO / 2));
        for (const s of [-1, 1]) nucleo.add(caja(LADO, Y1 - Y0 - 2 * YUGO, LADO, s * XL, (Y0 + Y1) / 2));
        // láminas: rayas finas en el frente, para que se lea que el hierro va en hojas
        const lamina = new THREE.MeshBasicMaterial({ color: P.suave, transparent: true, opacity: 0.35 });
        for (let i = 1; i < 6; i++) for (const s of [-1, 1]) {
            const r = new THREE.Mesh(new THREE.PlaneGeometry(0.006, Y1 - Y0 - 2 * YUGO), lamina);
            r.position.set(s * XL - LADO / 2 + (i * LADO) / 6, (Y0 + Y1) / 2, LADO / 2 + 0.002);
            nucleo.add(r);
        }
        const yugoArriba = caja(ancho, YUGO, LADO, 0, Y1 - YUGO / 2);
        for (const s of [-1, 1]) {
            const pata = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.5, Y0 - 0.16, 0.6), M.ceramica)));
            pata.position.set(s * XL, 0.16 + (Y0 - 0.16) / 2, 0);
            raiz.add(pata);
        }
        raiz.add(nucleo, yugoArriba);
        // el magnetismo: puntos guinda que recorren el núcleo por su cara de enfrente y van y vienen con la corriente
        const e = 0.02;
        const lazo = new THREE.CatmullRomCurve3([
            [-XL, Y0 + YUGO / 2 + 0.12], [-XL, Y1 - YUGO / 2 - 0.12], [-XL + 0.12, Y1 - YUGO / 2], [XL - 0.12, Y1 - YUGO / 2], [XL, Y1 - YUGO / 2 - 0.12],
            [XL, Y0 + YUGO / 2 + 0.12], [XL - 0.12, Y0 + YUGO / 2], [-XL + 0.12, Y0 + YUGO / 2],
        ].map(([x, y]) => new THREE.Vector3(x, y, LADO / 2 + e)), true);
        const FLUJO = 34;
        const flujoMat = new THREE.MeshBasicMaterial({ color: P.acento, transparent: true });
        const flujo = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 10, 8), flujoMat, FLUJO);
        flujo.frustumCulled = false;
        raiz.add(flujo);

        // 2 y 3 · Bobinas: hélices de cobre con el número exacto de vueltas
        const helice = (vueltas, radio, grueso) => {
            const pts = [];
            const pasos = Math.max(48, vueltas * 40);
            for (let i = 0; i <= pasos; i++) {
                const t = i / pasos;
                const a = t * vueltas * Math.PI * 2;
                pts.push(new THREE.Vector3(Math.cos(a) * radio, B0 + t * ALTO_BOBINA, Math.sin(a) * radio));
            }
            return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pasos, grueso, 8, false);
        };
        const cobre1 = M.cobre.clone();
        const cobre2 = M.cobre.clone();
        const primaria = new THREE.Group();
        primaria.position.x = -XL;
        primaria.add(sombra(new THREE.Mesh(helice(NP, 0.34, 0.06), cobre1)));
        const secundaria = new THREE.Group();
        secundaria.position.x = XL;
        const espirasSec = sombra(new THREE.Mesh(helice(ns, 0.3, 0.02), cobre2));
        secundaria.add(espirasSec);
        // carretes: tapas guinda arriba y abajo de cada bobina
        for (const [g, r] of [[primaria, 0.42], [secundaria, 0.34]]) {
            for (const y of [B0 - 0.05, B0 + ALTO_BOBINA + 0.05]) {
                const tapa = sombra(new THREE.Mesh(new THREE.TorusGeometry(r, 0.02, 10, 48).rotateX(Math.PI / 2), M.borde));
                tapa.position.y = y;
                g.add(tapa);
            }
        }
        raiz.add(primaria, secundaria);

        // 4 · Lado de bajo voltaje: la caja del generador de la central, con dos boquillas cortas
        const bajo = new THREE.Group();
        bajo.position.set(-2.45, 0.16, 0);
        bajo.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.62, 1.0), M.ceramica))).translateY(0.31));
        const boquilla = (alto, faldas) => {
            const b = new THREE.Group();
            b.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, alto, 16), M.ceramica)).translateY(alto / 2));
            for (let i = 0; i < faldas; i++) {
                const f = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.025, 24), i % 2 ? M.ceramica : M.borde));
                f.position.y = 0.08 + i * ((alto - 0.12) / Math.max(1, faldas - 1));
                b.add(f);
            }
            b.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 12), M.grafito)).translateY(alto + 0.04));
            return b;
        };
        for (const z of [-0.22, 0.22]) { const b = boquilla(0.32, 3); b.position.set(0.15, 0.62, z); bajo.add(b); }
        const rotulo = (texto, ancho = 0.5) => {
            const c = document.createElement('canvas');
            c.width = 256;
            c.height = 96;
            const g = c.getContext('2d');
            g.fillStyle = P.tinta;
            g.font = '700 52px Manrope, sans-serif';
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            g.fillText(texto, 128, 52);
            const t = new THREE.CanvasTexture(c);
            t.colorSpace = THREE.SRGBColorSpace;
            return new THREE.Mesh(new THREE.PlaneGeometry(ancho, ancho * 0.375), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
        };
        const r1 = rotulo('13.8 kV', 0.62);
        r1.position.set(0, 0.32, 0.505);
        bajo.add(r1);
        raiz.add(bajo);

        // 5 · Lado de alto voltaje: dos boquillas altas y la línea que sale hacia una torre
        const alto = new THREE.Group();
        alto.position.set(1.75, 0.16, 0);
        for (const z of [-0.32, 0.32]) { const b = boquilla(1.5, 9); b.position.set(0, 0, z); alto.add(b); }
        const torre = new THREE.Group();
        torre.position.set(1.1, 0, 0);
        for (const [x, z] of [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]]) {
            const p = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 2.2, 8), M.grafito));
            p.position.set(x * 0.6, 1.1, z * 0.6);
            p.rotation.set(z * 0.12, 0, -x * 0.12);
            torre.add(p);
        }
        const brazo = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.0), M.grafito));
        brazo.position.y = 1.95;
        torre.add(brazo);
        for (const z of [-0.32, 0.32]) {
            const aislador = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 12), M.ceramica));
            aislador.position.set(0, 1.81, z);
            torre.add(aislador);
        }
        alto.add(torre);
        const r2 = rotulo('115 kV', 0.5);
        r2.position.set(0.55, 0.012, 0.85);
        r2.rotation.x = -Math.PI / 2;
        alto.add(r2);
        raiz.add(alto);

        // Cables. Bajo voltaje: gruesos, de la caja del generador por la bancada a la bobina de pocas vueltas.
        // Alto voltaje: de la bobina de muchas vueltas por la bancada a las boquillas; de ahí, la línea va por el aire a
        // la torre, como en una subestación.
        const curva = (...p) => new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));
        const PC = PISO_CABLE;
        const cablesBajo = [
            curva([-2.0, 0.3, 0.3], [-1.9, PC + 0.03, 0.4], [-1.4, PC + 0.03, 0.45], [-XL - 0.45, PC + 0.03, 0.35], [-XL - 0.36, B0 - 0.05, 0.12]),
            curva([-2.0, 0.3, -0.3], [-1.9, PC + 0.03, -0.4], [-1.4, PC + 0.03, -0.45], [-XL - 0.45, PC + 0.03, -0.35], [-XL - 0.36, B0 + ALTO_BOBINA, -0.12]),
        ];
        const cablesAlto = [
            curva([XL + 0.32, B0 + ALTO_BOBINA, 0.1], [XL + 0.42, PC, 0.3], [1.3, PC, 0.36], [1.68, PC, 0.32], [1.75 - 0.08, 0.22, 0.32]),
            curva([XL + 0.32, B0, -0.1], [XL + 0.42, PC, -0.3], [1.3, PC, -0.36], [1.68, PC, -0.32], [1.75 - 0.08, 0.22, -0.32]),
        ];
        const lineas = [
            curva([1.75, 1.82, 0.32], [2.3, 1.62, 0.32], [2.85, 1.7, 0.32]),
            curva([1.75, 1.82, -0.32], [2.3, 1.62, -0.32], [2.85, 1.7, -0.32]),
        ];
        const cableGrueso = c => raiz.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(c, 64, 0.04, 10, false), M.cable)));
        const cableFino = c => raiz.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(c, 64, 0.016, 8, false), M.cable)));
        cablesBajo.forEach(cableGrueso);
        cablesAlto.forEach(cableFino);
        lineas.forEach(cableFino);
        const corrientes = {
            bajo: crearCorriente({ raiz, escena, curvas: cablesBajo, P, radio: 0.045 }),
            alto: crearCorriente({ raiz, escena, curvas: [...cablesAlto], P, radio: 0.024 }),
            linea: crearCorriente({ raiz, escena, curvas: lineas, P, radio: 0.024, puntosPorCable: 14 }),
        };

        piezasT = { primaria, secundaria, espirasSec, helice, cobre1, cobre2, flujo, flujoMat, lazo, FLUJO, corrientes, nucleo };
        return {
            piezas: { 1: [nucleo, yugoArriba], 2: [primaria], 3: [secundaria], 4: [bajo], 5: [alto] },
            // el yugo de arriba sube por encima de todo para liberar las piernas (2.39 + 2.05 = 4.44, arriba de las bobinas,
            // que terminan en 3.67); las bobinas suben hasta salirse de las piernas
            // (su base, a 0.8, sube 1.75 y queda en 2.55, arriba del núcleo que termina en 2.48)
            movibles: [
                { parte: 1, objetos: [yugoArriba], hacia: [0, 2.05, -0.3] },
                { parte: 2, objetos: [primaria], hacia: [-0.15, 1.75, 0] },
                { parte: 3, objetos: [secundaria], hacia: [0.15, 1.75, 0] },
                { parte: 4, objetos: [bajo], hacia: [-0.45, 0, 0] },
                { parte: 5, objetos: [alto], hacia: [0.4, 0, 0] },
            ],
            anclas: { 1: [nucleo, [0, 1.45, 0.25]], 2: [primaria, [-0.45, B0 + ALTO_BOBINA + 0.25, 0]], 3: [secundaria, [0.45, B0 + ALTO_BOBINA + 0.25, 0]], 4: [bajo, [0, 1.05, 0]], 5: [alto, [0, 1.95, 0]] },
        };
    },

    paso(estado) {
        const { espirasSec, helice, cobre1, cobre2, flujo, flujoMat, lazo, FLUJO } = piezasT;
        const { dtSim, e, arrastre, M } = estado;
        // las vueltas de salida son enteras: cuando cambian, la bobina se vuelve a enrollar
        const objetivo = Math.round(estado.entradaObjetivo);
        if (objetivo !== ns) {
            ns = objetivo;
            espirasSec.geometry.dispose();
            espirasSec.geometry = helice(ns, 0.3, clamp(0.4 * ALTO_BOBINA / ns / 2, 0.012, 0.05));
        }
        estado.entrada = ns;
        // con el núcleo abierto (desarmado o un pedazo fuera de lugar) el magnetismo ya no pasa: no hay voltaje de salida
        const cerrado = 1 - clamp(Math.max(e * 10, arrastre[1].length() * 4, arrastre[2].length() * 4, arrastre[3].length() * 4), 0, 1);
        fase += 2 * Math.PI * F * dtSim;
        const vs = VP_KV * ns / NP;
        const ip = (POTENCIA_MW * 1000) / VP_KV; // A
        const is = (POTENCIA_MW * 1000) / vs;
        const sen = Math.sin(fase);
        const flujoAhora = -Math.cos(fase) * cerrado; // un cuarto de ciclo detrás del voltaje

        // magnetismo en el núcleo
        const m4 = new THREE.Matrix4();
        const p = new THREE.Vector3();
        flujoMat.opacity = cerrado * (0.35 + 0.65 * Math.abs(flujoAhora));
        flujo.visible = cerrado > 0.02;
        for (let i = 0; i < FLUJO; i++) {
            const u = (((i / FLUJO) + 0.035 * flujoAhora) % 1 + 1) % 1;
            lazo.getPointAt(u, p);
            m4.makeTranslation(p.x, p.y, p.z);
            flujo.setMatrixAt(i, m4);
        }
        flujo.instanceMatrix.needsUpdate = true;
        // bobinas: brillan con su corriente (las dos al ritmo de la red)
        cobre1.emissive.set(estado.P.cobre);
        cobre1.emissiveIntensity = Math.abs(sen) * 0.3 * cerrado;
        cobre2.emissive.set(estado.P.cobre);
        cobre2.emissiveIntensity = Math.abs(sen) * 0.3 * cerrado;

        const cables = 1 - clamp(Math.max(e * 6, arrastre[2].length() * 3, arrastre[3].length() * 3, arrastre[4].length() * 3, arrastre[5].length() * 3), 0, 1);
        M.cable.opacity = cables;
        M.cable.visible = cables > 0.02;
        estado.trafo = { cables, cerrado, ip, is, sen };

        const veces = (ip / is) ** 2;
        return {
            cifras: {
                vs: `${num(vs * cerrado, vs < 100 ? 1 : 0)} kV`,
                hud: `Entran ${num(VP_KV, 1)} kV · ${ns} ÷ ${NP} vueltas`,
                ip: `${num(ip)} A`,
                is: `${num(is * cerrado)} A`,
                perdida: ns === NP ? 'la misma' : veces > 1 ? `${num(veces, veces < 10 ? 1 : 0)} veces menos` : `${num(1 / veces, 1 / veces < 10 ? 1 : 0)} veces más`,
            },
        };
    },

    // corriente por los cables: gruesa y con mucho vaivén del lado de bajo voltaje; fina y casi quieta del alto
    despues(estado) {
        const { corrientes } = piezasT;
        const { cables, cerrado, ip, is, sen } = estado.trafo;
        const ciclos = F * estado.lento.k;
        const polos = 1 - clamp(ciclos * 2 - 2, 0, 1);
        const base = { dt: estado.dtSim, camara: estado.camara, w: estado.w, h: estado.h, polos };
        // amplitud de ida y vuelta proporcional a la corriente: avance ÷ ω
        const avance = I => 0.09 * (2 * Math.PI * F) * (I / 2174);
        corrientes.bajo.actualizar({ ...base, avance: avance(ip), corriente: sen, visible: cables });
        corrientes.alto.actualizar({ ...base, avance: avance(is), corriente: -sen * cerrado, visible: cables * cerrado });
        corrientes.linea.actualizar({ ...base, avance: avance(is), corriente: -sen * cerrado, visible: cables * cerrado });
    },
});
