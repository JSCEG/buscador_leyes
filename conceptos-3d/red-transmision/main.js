// «Red Nacional de Transmisión», en 3D: el mapa de México en relieve, con los estados agrupados en las regiones de
// control del CENACE, y un esquema de los grandes corredores de transmisión entre regiones, con sus torres y sus
// subestaciones de enlace. La energía corre por los corredores.
//
// Entrada: el voltaje de transmisión. Para llevar 1,000 MW a 500 km, con menos voltaje hace falta más corriente y se
// pierde mucha más energía en los cables (P = 3 · I² · R). Por eso las líneas troncales son de 400 kV y 230 kV.
//
// Fuentes de la geografía: estados de INEGI (Marco Geoestadístico, diciembre de 2023), simplificados; regiones según el
// Acuerdo de circunscripción territorial de las Gerencias de Control Regional del CENACE (DOF, mayo de 2018), asignando
// cada estado a la región que cubre la mayor parte de él. Los corredores son un esquema, no el trazo real de las líneas.
// Cifras de pérdidas de ejemplo: resistencia de 0.028 Ω por km y fase (dos conductores por fase), factor de potencia 1.
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';
import MEXICO from './mexico.json';

const BASE = 0.16;
const ALTO_MAPA = 0.08;
const P_MW = 1000;
const L_KM = 500;
const R_KM = 0.028;
const proy = (lon, lat) => [(lon + 102) * 0.205, -(lat - 23.4) * 0.225];
const REGIONES = {
    baja: { nombre: 'Baja California', lugar: [-115.5, 32.3], tono: 0 },
    bcs: { nombre: 'Baja California Sur', lugar: [-110.6, 24.4], tono: 0 },
    noroeste: { nombre: 'Noroeste', lugar: [-109.5, 27.2], tono: 1 },
    norte: { nombre: 'Norte', lugar: [-105.6, 27.4], tono: 2 },
    noreste: { nombre: 'Noreste', lugar: [-100.3, 25.6], tono: 1 },
    occidental: { nombre: 'Occidental', lugar: [-102.4, 21.0], tono: 3 },
    central: { nombre: 'Central', lugar: [-99.1, 19.5], tono: 2 },
    oriental: { nombre: 'Oriental', lugar: [-96.6, 17.6], tono: 1 },
    peninsular: { nombre: 'Peninsular', lugar: [-89.6, 20.4], tono: 2 },
};
// corredores entre regiones del Sistema Interconectado Nacional (esquema), en el sentido en que corre la energía
const CORREDORES = [
    ['noroeste', 'norte'], ['noroeste', 'occidental'], ['norte', 'noreste'], ['norte', 'occidental'],
    ['noreste', 'occidental'], ['noreste', 'oriental'], ['occidental', 'central'], ['oriental', 'central'], ['oriental', 'peninsular'],
];
const perdidas = kv => { const i = (P_MW * 1e6) / (Math.sqrt(3) * kv * 1e3); return { i, mw: (3 * i * i * R_KM * L_KM) / 1e6 }; };

let piezasR = null;
let tiempo = 0;
let voltaje = 400;

crearMaquina({
    figura: 'red-transmision',
    nombre: 'la red de transmisión',
    partes: [
        { n: 1, nombre: 'Regiones de control', ancla: [-0.6, 0.9, 0.2], vista: { tx: -0.3, ty: 0.2, tz: 0.1, az: 0, el: 62, d: 6.4 } },
        { n: 2, nombre: 'Corredores de transmisión', ancla: [0.5, 1.0, 0.6], vista: { tx: 0.4, ty: 0.3, tz: 0.6, az: 8, el: 30, d: 3.6 } },
        { n: 3, nombre: 'Torres', ancla: [-0.2, 0.9, 0.9], vista: { tx: -0.3, ty: 0.35, tz: 0.9, az: 10, el: 16, d: 1.8 } },
        { n: 4, nombre: 'Subestaciones de enlace', ancla: [0.6, 0.9, 0.9], vista: { tx: 0.6, ty: 0.3, tz: 0.9, az: 0, el: 30, d: 1.8 } },
        { n: 5, nombre: 'Sistemas de Baja California', ancla: [-2.8, 0.9, -1.8], vista: { tx: -2.3, ty: 0.2, tz: -1.0, az: 20, el: 40, d: 3.4 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: 0, ty: 0.1, tz: 0.1, az: 0, el: 48, d: 8.0 },
        { id: 'arriba', texto: 'Arriba', tx: 0, ty: 0.1, tz: 0, az: 0, el: 84, d: 7.6 },
        { id: 'centro', texto: 'Centro del país', tx: 0.2, ty: 0.3, tz: 0.8, az: 6, el: 24, d: 3.2 },
    ],
    entrada: { etiqueta: 'Voltaje de transmisión', min: 115, max: 400, paso: 5, valor: 400, aria: 'Voltaje de transmisión en kilovolts' },
    selectores: [],
    lento: [
        { id: 'lento', texto: 'Despacio', k: 0.35, nota: 'La energía corre despacio por los corredores.' },
        { id: 'real', texto: 'Normal', k: 1, nota: 'La red enlaza las regiones para que la energía llegue de donde se produce a donde se usa.' },
    ],
    hud: '<b data-c="perdida"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'kv', etiqueta: 'Voltaje', nota: 'de la línea' },
        { id: 'corriente', etiqueta: 'Corriente', nota: `para llevar ${num(P_MW)} MW` },
        { id: 'mw', etiqueta: 'Se pierde', nota: `en ${L_KM} km (ejemplo)` },
        { id: 'llega', etiqueta: 'Llega', nota: 'al otro extremo' },
    ],
    curva: {
        titulo: 'Pérdidas según el voltaje',
        leyenda: [{ texto: `% que se pierde en ${L_KM} km` }],
        nota: 'Cifras de ejemplo. Con el doble de voltaje, la corriente es la mitad y se pierde la cuarta parte.',
        dibujar(g, w, h, estado) {
            const x = kv => ((kv - 115) / 285) * (w - 10) + 5;
            const y = p => h - 6 - (Math.min(p, 100) / 100) * (h - 14);
            g.lineWidth = 2.4;
            g.strokeStyle = estado.P.acento;
            g.beginPath();
            for (let kv = 115; kv <= 400; kv += 5) { const p = (perdidas(kv).mw / P_MW) * 100; if (kv === 115) g.moveTo(x(kv), y(p)); else g.lineTo(x(kv), y(p)); }
            g.stroke();
            for (const kv of [115, 230, 400]) { g.fillStyle = estado.P.tinta; g.fillRect(x(kv) - 0.5, h - 10, 1, 6); }
            g.fillStyle = estado.P.acento;
            g.beginPath(); g.arc(x(voltaje), y((perdidas(voltaje).mw / P_MW) * 100), 4.5, 0, Math.PI * 2); g.fill();
        },
    },
    corte: false,
    anchoVertical: 1.8,
    lejaniaMax: 3.0,
    entradaRecorrido: t => 257.5 + 142.5 * Math.cos(t * 0.3),

    construir({ raiz, M, P, TEMA, sombra, contorno }) {
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.16, 4.8), M.ceramica))).translateY(0.08));
        const oscuro = TEMA === 'oscuro';
        const tonos = oscuro ? ['#cfcac0', '#e6e4df', '#d8d4cc', '#c2bdb3'] : ['#e9e3d6', '#f7f5f1', '#efe9de', '#ddd6c6'];
        const mats = tonos.map(c => M.mat(c, { roughness: 0.7 }));

        // 1 y 5 · el mapa: cada estado en relieve, con el tono de su región
        const mapa = new THREE.Group();
        const baja = new THREE.Group();
        for (const e of MEXICO.estados) {
            const reg = e.nombre === 'Baja California Sur' ? 'bcs' : e.region;
            for (const anillo of e.anillos) {
                const forma = new THREE.Shape(anillo.map(([lon, lat]) => { const [x, z] = proy(lon, lat); return new THREE.Vector2(x, -z); }));
                const geo = new THREE.ExtrudeGeometry(forma, { depth: ALTO_MAPA, bevelEnabled: false });
                geo.rotateX(-Math.PI / 2);
                const m = contorno(sombra(new THREE.Mesh(geo, mats[REGIONES[reg].tono])), 30);
                m.position.y = BASE;
                (reg === 'baja' || reg === 'bcs' ? baja : mapa).add(m);
            }
        }
        raiz.add(mapa, baja);

        // 4 · subestaciones de enlace en cada región, con su letrero
        const TOPE = BASE + ALTO_MAPA;
        const nodos = {};
        const subestaciones = new THREE.Group();
        for (const [id, r] of Object.entries(REGIONES)) {
            const [x, z] = proy(...r.lugar);
            const s = new THREE.Group();
            s.position.set(x, TOPE, z);
            s.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.16), M.ceramica))).translateY(0.04));
            s.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.02, 0.17), M.borde)).translateY(0.09));
            const l = letrero(0.5, 0.11, r.nombre);
            l.position.set(0, 0.22, 0);
            s.add(l);
            s.userData.letrero = l;
            subestaciones.add(s);
            nodos[id] = new THREE.Vector3(x, TOPE + 0.12, z);
        }
        raiz.add(subestaciones);

        // 2 y 3 · corredores: cable en catenarias entre torres, con la energía que corre
        const corredores = new THREE.Group();
        const torres = new THREE.Group();
        const torreGeo = new THREE.CylinderGeometry(0.004, 0.012, 0.2, 4);
        const crucetaGeo = new THREE.BoxGeometry(0.06, 0.006, 0.006);
        const rutas = CORREDORES.map(([a, b]) => {
            const A = nodos[a];
            const B = nodos[b];
            const largo = A.distanceTo(B);
            const n = Math.max(2, Math.round(largo / 0.32));
            const pts = [];
            for (let i = 0; i <= n; i++) {
                const t = i / n;
                const p = A.clone().lerp(B, t);
                p.y = TOPE + 0.2;
                if (i > 0 && i < n) {
                    const torre = sombra(new THREE.Mesh(torreGeo, M.borde));
                    torre.position.set(p.x, TOPE + 0.1, p.z);
                    const cruceta = new THREE.Mesh(crucetaGeo, M.borde);
                    cruceta.position.set(p.x, TOPE + 0.2, p.z);
                    cruceta.lookAt(B.x, TOPE + 0.2, B.z);
                    cruceta.rotateY(Math.PI / 2);
                    torres.add(torre, cruceta);
                }
                pts.push(i === 0 ? A.clone() : i === n ? B.clone() : p);
                if (i < n) { const m = A.clone().lerp(B, (i + 0.5) / n); m.y = TOPE + 0.16; pts.push(m); }
            }
            const curva = new THREE.CatmullRomCurve3(pts);
            const tubo = new THREE.Mesh(new THREE.TubeGeometry(curva, n * 12, 0.008, 6, false), M.grafito.clone());
            corredores.add(tubo);
            return { curva, tubo, largo };
        });
        raiz.add(corredores, torres);
        const puntos = new THREE.InstancedMesh(new THREE.SphereGeometry(0.016, 8, 6), new THREE.MeshBasicMaterial({ color: P.corriente }), rutas.length * 10);
        puntos.frustumCulled = false;
        raiz.add(puntos);

        piezasR = { rutas, puntos, P, subestaciones };
        return {
            piezas: { 1: [mapa], 2: [corredores], 3: [torres], 4: [subestaciones], 5: [baja] },
            movibles: [
                { parte: 5, objetos: [baja], hacia: [-0.3, 0.2, -0.2] },
                { parte: 4, objetos: [subestaciones], hacia: [0, 0.5, 0] },
                { parte: 3, objetos: [torres, corredores], hacia: [0, 0.3, 0] },
            ],
            anclas: { 1: [mapa, [-0.6, 0.5, 0.2]], 2: [corredores, [0.5, 0.6, 0.6]], 3: [torres, [-0.2, 0.55, 0.9]], 4: [subestaciones, [0.6, 0.55, 0.9]], 5: [baja, [-2.8, 0.55, -1.8]] },
        };
    },

    paso(estado) {
        const S = piezasR;
        const { dt, dtSim, e } = estado;
        estado.entrada += (estado.entradaObjetivo - estado.entrada) * (1 - Math.exp(-dt / 0.25));
        voltaje = estado.entrada;
        tiempo += dtSim;
        const { i, mw } = perdidas(voltaje);
        const frac = Math.min(1, mw / P_MW);

        // los cables se «calientan» (guinda) cuanto más se pierde; la energía corre más rápido con más corriente
        S.rutas.forEach(r => r.tubo.material.color.set(estado.P.grafito).lerp(new THREE.Color(estado.P.acento), clamp(frac * 3, 0, 1)));
        const m = new THREE.Matrix4();
        const q = new THREE.Vector3();
        S.puntos.visible = e < 0.2;
        if (S.puntos.visible) {
            S.rutas.forEach((r, k) => {
                for (let j = 0; j < 10; j++) {
                    r.curva.getPointAt(((j / 10) + tiempo * (0.08 + 0.12 * (i / 5020))) % 1, q);
                    m.makeTranslation(q.x, q.y, q.z);
                    S.puntos.setMatrixAt(k * 10 + j, m);
                }
            });
            S.puntos.instanceMatrix.needsUpdate = true;
        }
        // los letreros miran a la cámara
        S.subestaciones.children.forEach(s => s.userData.letrero.quaternion.copy(estado.camara.quaternion));

        const pierde = frac * 100;
        return {
            cifras: {
                perdida: `Se pierde ${num(pierde, pierde < 10 ? 1 : 0)} %`,
                hud: mw >= P_MW ? 'Con este voltaje no llega nada: toda la energía se iría en calor' : voltaje >= 380 ? 'Las troncales de 400 kV llevan mucha energía lejos con poca pérdida' : voltaje >= 220 ? 'A 230 kV todavía conviene para distancias medias' : 'Con poco voltaje, la corriente es enorme y casi todo se pierde',
                kv: `${num(voltaje)} kV`,
                corriente: `${num(i)} A`,
                mw: `${num(Math.min(mw, P_MW))} MW`,
                llega: `${num(Math.max(0, P_MW - mw))} MW`,
            },
        };
    },
});

// letrero: textura de canvas clara con texto guinda
function letrero(ancho, alto, texto) {
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = Math.round(320 * alto / ancho);
    const g = c.getContext('2d');
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    g.fillStyle = '#f7f5f1';
    g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#9b2247';
    let tam = Math.round(c.height * 0.6);
    g.font = `700 ${tam}px Manrope, sans-serif`;
    tam = Math.floor(tam * Math.min(1, (c.width * 0.92) / Math.max(1, g.measureText(texto).width)));
    g.font = `700 ${tam}px Manrope, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(texto, c.width / 2, c.height / 2 + 2);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ map: t, depthTest: false }));
    m.renderOrder = 5;
    m.userData.sinResalte = true;
    return m;
}
