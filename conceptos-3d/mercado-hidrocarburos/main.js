// «Precios, expendio y mercado de combustibles», en 3D: el viaje de un litro de gasolina y lo que cuesta. Atrás, la
// cadena: refinería de referencia en la Costa del Golfo, buquetanque, puerto, ducto, terminal de almacenamiento, pipa y
// estación de servicio. El combustible siempre va por tubería o en tanque, nunca por el aire. Al frente, una probeta de
// «un litro» se llena por capas con lo que pagas: molécula, flete, logística, margen, IEPS e IVA.
//
// Entrada: el precio internacional de referencia ($/L). Botón: con o sin estímulo al IEPS. Con estímulo, Hacienda cobra
// menos IEPS cuando sube el precio internacional para que el precio en la bomba no se dispare; puede llegar al 100 % y
// no toca el IVA.
//
// Cifras de ejemplo, en números redondos: flete 0.90, logística 1.30 y margen 2.20 $/L; cuota completa de IEPS 6.50 $/L;
// IVA 16 %. Las reales cambian: el estímulo se publica cada semana en el DOF. El tope de referencia de 24 $/L es el de la
// estrategia para estabilizar el precio de la gasolina regular.
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';

const BASE = 0.16;
const FLETE = 0.9;
const LOGISTICA = 1.3;
const MARGEN = 2.2;
const CUOTA = 6.5;
const IVA = 0.16;
const META = 24;
const POR_PESO = 0.05; // altura de la probeta por cada peso
const peso = x => `$${num(x, 2)}`;
const calcular = (ref, conEstimulo) => {
    const sinImpuestos = ref + FLETE + LOGISTICA + MARGEN;
    const ieps = conEstimulo ? clamp(META / (1 + IVA) - sinImpuestos, 0, CUOTA) : CUOTA;
    const iva = (sinImpuestos + ieps) * IVA;
    return { sinImpuestos, ieps, iva, precio: sinImpuestos + ieps + iva, estimulo: 1 - ieps / CUOTA };
};

let piezasC = null;
let tiempo = 0;
let actual = calcular(11, true);
let referencia = 11;

crearMaquina({
    figura: 'mercado-hidrocarburos',
    nombre: 'el viaje del litro',
    partes: [
        { n: 1, nombre: 'Costo de referencia internacional', ancla: [-3.0, 1.7, -1.1], vista: { tx: -3.0, ty: 0.7, tz: -1.0, az: 14, el: 16, d: 2.8 } },
        { n: 2, nombre: 'Flete marítimo e internación', ancla: [-2.2, 1.2, 0.0], vista: { tx: -2.0, ty: 0.4, tz: 0, az: 10, el: 18, d: 3.0 } },
        { n: 3, nombre: 'Logística interna (Ducto / Pipa)', ancla: [0.5, 1.3, -1.0], vista: { tx: 0.6, ty: 0.5, tz: -0.8, az: 6, el: 18, d: 3.4 } },
        { n: 4, nombre: 'Carga impositiva (IEPS + IVA)', ancla: [-0.2, 1.7, 1.2], vista: { tx: -0.4, ty: 0.9, tz: 1.1, az: 0, el: 6, d: 3.0 } },
        { n: 5, nombre: 'Precio en dispensario', ancla: [2.7, 1.6, -0.2], vista: { tx: 2.6, ty: 0.7, tz: -0.2, az: -14, el: 12, d: 2.6 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: 0, ty: 0.8, tz: 0, az: 10, el: 20, d: 8.2 },
        { id: 'litro', texto: 'El litro', tx: -0.3, ty: 0.9, tz: 1.1, az: 0, el: 4, d: 3.2 },
        { id: 'arriba', texto: 'Arriba', tx: 0, ty: 0.3, tz: 0, az: 0, el: 70, d: 8.2 },
    ],
    entrada: { etiqueta: 'Precio internacional de referencia', min: 7, max: 18, paso: 0.1, valor: 11, aria: 'Precio internacional de referencia de la gasolina, en pesos por litro' },
    selectores: [{ id: 'estimulo', etiqueta: 'Estímulo al IEPS', valor: 'con', opciones: [{ id: 'con', texto: 'Con estímulo' }, { id: 'sin', texto: 'Sin estímulo' }] }],
    lento: [
        { id: 'lento', texto: 'Despacio', k: 0.35, nota: 'El combustible avanza despacio por la cadena.' },
        { id: 'real', texto: 'Normal', k: 1, nota: 'Del barco a la bomba, el combustible va siempre por tubería o en tanque.' },
    ],
    hud: '<b data-c="precio"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'molecula', etiqueta: 'Molécula', nota: 'la gasolina en la Costa del Golfo' },
        { id: 'estimuloC', etiqueta: 'Estímulo al IEPS', nota: 'lo que Hacienda deja de cobrar' },
        { id: 'ieps', etiqueta: 'IEPS que se cobra', nota: 'por litro' },
        { id: 'iva', etiqueta: 'IVA', nota: '16 % sobre todo lo anterior' },
    ],
    curva: {
        titulo: 'Precio en la bomba según el precio internacional',
        leyenda: [{ texto: 'con estímulo' }, { texto: 'sin estímulo' }],
        nota: 'Cifras de ejemplo. Con estímulo el precio se queda en 24 $ mientras el IEPS alcance a compensar; cuando el estímulo llega al 100 %, vuelve a subir.',
        dibujar(g, w, h, estado) {
            const x = r => ((r - 7) / 11) * (w - 10) + 5;
            const y = p => h - 6 - ((p - 14) / 22) * (h - 14);
            const linea = (con, color, ancho) => {
                g.lineWidth = ancho;
                g.strokeStyle = color;
                g.beginPath();
                for (let r = 7; r <= 18.001; r += 0.1) { const p = calcular(r, con).precio; if (r === 7) g.moveTo(x(r), y(p)); else g.lineTo(x(r), y(p)); }
                g.stroke();
            };
            linea(false, estado.P.tinta, 1.4);
            linea(true, estado.P.acento, 2.4);
            g.fillStyle = estado.P.acento;
            g.beginPath(); g.arc(x(referencia), y(actual.precio), 4.5, 0, Math.PI * 2); g.fill();
        },
    },
    corte: false,
    anchoVertical: 1.95,
    lejaniaMax: 3.1,
    entradaRecorrido: t => 12.5 + 5 * Math.sin(t * 0.3),

    construir({ raiz, M, P, TEMA, sombra, contorno }) {
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.16, 3.4), M.ceramica))).translateY(0.08));
        const GAS = TEMA === 'oscuro' ? '#5fd08a' : '#2f9e5b';
        const curva = (...p) => new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));
        const vidrio = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.08, transparent: true, opacity: 0.28, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide });
        const flujos = [];
        const tuberia = (ruta, n, radio = 0.032) => {
            const tubo = new THREE.Mesh(new THREE.TubeGeometry(ruta, 96, radio, 10, false), vidrio);
            tubo.renderOrder = 2;
            const im = new THREE.InstancedMesh(new THREE.SphereGeometry(radio * 0.75, 8, 6), new THREE.MeshBasicMaterial({ color: GAS }), n);
            im.frustumCulled = false;
            im.renderOrder = 3;
            raiz.add(tubo, im);
            flujos.push({ im, ruta, n });
            return tubo;
        };
        const tanque = (r, h) => {
            const g = new THREE.Group();
            g.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 32), M.ceramica)), 40).translateY(h / 2));
            g.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(r, 0.014, 8, 36).rotateX(Math.PI / 2), M.borde)).translateY(h));
            return g;
        };

        // 1 · refinería de referencia en la Costa del Golfo (otra orilla del mar)
        const ref = new THREE.Group();
        ref.position.set(-3.0, BASE, -1.1);
        ref.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.8), M.mat('#c7ad86', { roughness: 0.85 })))).translateY(0.03));
        ref.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.9, 24), M.ceramica)), 40).translateY(0.5).translateX(-0.2));
        for (const y of [0.35, 0.65]) ref.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.012, 8, 28).rotateX(Math.PI / 2), M.borde)).translateY(y).translateX(-0.2));
        const tr = tanque(0.16, 0.26);
        tr.position.set(0.22, 0.06, 0.1);
        ref.add(tr);
        const etiquetaRef = letrero(0.8, 0.12, 'Costa del Golfo');
        etiquetaRef.position.set(0, 1.15, 0);
        ref.add(etiquetaRef);
        raiz.add(ref);

        // 2 · el mar y el buquetanque, que llega al puerto
        const mar = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.04, 1.5), M.agua);
        mar.position.set(-2.55, BASE + 0.02, 0.15);
        raiz.add(mar);
        const buque = new THREE.Group();
        buque.position.set(-2.4, BASE + 0.04, 0.15);
        const casco = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.16, 0.28), M.ceramica)));
        casco.position.y = 0.08;
        buque.add(casco, sombra(new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.03, 0.3), M.borde)).translateY(0.03));
        buque.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.22), M.ceramica))).translateX(-0.36).translateY(0.25));
        for (let i = 0; i < 3; i++) buque.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 20), M.grafito)).translateX(-0.05 + i * 0.18).translateY(0.18));
        raiz.add(buque);
        const puerto = new THREE.Group();
        puerto.position.set(-1.25, BASE, 0.15);
        puerto.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.8), M.ceramica))).translateY(0.04));
        const tp = tanque(0.18, 0.4);
        tp.position.set(0.05, 0.08, -0.15);
        puerto.add(tp);
        raiz.add(puerto);
        // manguera del barco al tanque del puerto
        const descarga = tuberia(curva([-2.15, BASE + 0.22, 0.15], [-1.8, BASE + 0.35, 0.15], [-1.45, BASE + 0.3, 0.05], [-1.25, BASE + 0.3, 0.0]), 10, 0.025);

        // 3 · ducto a la terminal (TAR), carga de la pipa y su viaje a la estación
        const tar = new THREE.Group();
        tar.position.set(0.4, BASE, -0.95);
        const t1 = tanque(0.28, 0.5);
        t1.position.x = -0.32;
        const t2 = tanque(0.28, 0.5);
        t2.position.x = 0.32;
        tar.add(t1, t2);
        raiz.add(tar);
        const ducto = tuberia(curva([-1.05, BASE + 0.2, -0.05], [-0.7, BASE + 0.05, -0.4], [-0.3, BASE + 0.05, -0.85], [0.08, BASE + 0.1, -0.95]), 24);
        const llenadera = tuberia(curva([0.62, BASE + 0.1, -0.85], [0.9, BASE + 0.05, -0.6], [1.25, BASE + 0.05, -0.35], [1.35, BASE + 0.32, -0.3]), 12, 0.025);
        const pipa = new THREE.Group();
        pipa.position.set(1.55, BASE, -0.25);
        pipa.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.26), M.ceramica))).translateX(-0.36).translateY(0.15));
        pipa.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.55, 28).rotateZ(Math.PI / 2), M.ceramica)), 40).translateX(0.05).translateY(0.2));
        pipa.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.012, 8, 28).rotateY(Math.PI / 2), M.borde)).translateX(0.32).translateY(0.2));
        for (const x of [-0.36, -0.05, 0.22]) for (const z of [-0.13, 0.13]) pipa.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 16).rotateX(Math.PI / 2), M.grafito)).translateX(x).translateY(0.05).translateZ(z));
        raiz.add(pipa);
        const descargaPipa = tuberia(curva([1.88, BASE + 0.18, -0.25], [2.05, BASE + 0.05, -0.15], [2.25, BASE + 0.04, 0.05]), 8, 0.022);

        // 5 · estación de servicio: techumbre, dispensario con su pantalla de precio
        const estacion = new THREE.Group();
        estacion.position.set(2.7, BASE, -0.2);
        for (const [x, z] of [[-0.45, -0.35], [0.45, -0.35], [-0.45, 0.35], [0.45, 0.35]]) estacion.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 10), M.ceramica)).translateX(x).translateY(0.42).translateZ(z));
        estacion.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.08, 0.95), M.ceramica))).translateY(0.89));
        estacion.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.17, 0.025, 0.97), M.borde)).translateY(0.85));
        const dispensario = new THREE.Group();
        dispensario.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.55, 0.2), M.ceramica))).translateY(0.275));
        dispensario.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.03, 0.22), M.borde)).translateY(0.56));
        dispensario.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 8, 20, Math.PI), M.grafito)).translateX(0.16).translateY(0.3).rotateY(Math.PI / 2));
        const precioBomba = pantalla(0.26, 0.14);
        precioBomba.position.set(0, 0.42, 0.102);
        dispensario.add(precioBomba);
        estacion.add(dispensario);
        estacion.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 20), M.grafito)).translateX(-0.45).translateY(0.01).translateZ(0.25));
        raiz.add(estacion);

        // 4 y 5 · la probeta de un litro, por capas (de abajo arriba): molécula, flete, logística, margen, IEPS e IVA
        const litro = new THREE.Group();
        litro.position.set(-0.5, BASE, 1.2);
        const ALTO = 31 * POR_PESO;
        const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, ALTO, 40, 1, true), vidrio);
        tubo.position.y = ALTO / 2 + 0.04;
        tubo.renderOrder = 2;
        litro.add(tubo, sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.05, 40), M.grafito)).translateY(0.025));
        const capaDef = [
            ['Molécula', M.mat(GAS, { roughness: 0.3 })],
            ['Flete', M.acero],
            ['Logística', M.grafito],
            ['Margen', M.ceramica],
            ['IEPS', M.borde],
            ['IVA', M.mat(P.acento, { roughness: 0.4, transparent: true, opacity: 0.55 })],
        ];
        const capas = capaDef.map(([nombre, mat]) => {
            const m = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1, 36), mat);
            const l = letrero(0.42, 0.09, nombre);
            litro.add(m, l);
            return { m, l, alto: 0.01 };
        });
        const meta = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.012, 8, 40).rotateX(Math.PI / 2), M.grafito);
        meta.position.y = 0.05 + META * POR_PESO;
        const metaL = letrero(0.32, 0.09, '24 $');
        metaL.position.set(-0.52, meta.position.y, 0);
        litro.add(meta, metaL);
        raiz.add(litro);

        piezasC = { flujos, buque, capas, precioBomba };
        return {
            piezas: { 1: [ref], 2: [buque, puerto, descarga], 3: [tar, ducto, llenadera, pipa, descargaPipa], 4: [capas[4].m, capas[5].m], 5: [estacion, tubo] },
            movibles: [
                { parte: 1, objetos: [ref], hacia: [-0.3, 0.3, -0.3] },
                { parte: 2, objetos: [buque], hacia: [-0.3, 0.3, 0.3] },
                { parte: 3, objetos: [tar, pipa], hacia: [0, 0.4, -0.3] },
                { parte: 5, objetos: [estacion], hacia: [0.4, 0.3, -0.2] },
                { parte: 4, objetos: [litro], hacia: [0, 0.2, 0.5] },
            ],
            anclas: { 1: [ref, [0, 1.3, 0]], 2: [buque, [0, 0.6, 0]], 3: [tar, [0, 0.9, 0]], 4: [litro, [0.3, 1.6, 0]], 5: [estacion, [0, 1.3, 0]] },
        };
    },

    paso(estado) {
        const S = piezasC;
        const { dt, dtSim, e } = estado;
        estado.entrada += (estado.entradaObjetivo - estado.entrada) * (1 - Math.exp(-dt / 0.3));
        tiempo += dtSim;
        referencia = estado.entrada;
        const con = estado.sel.estimulo === 'con';
        actual = calcular(referencia, con);
        const suave = 1 - Math.exp(-dt / 0.2);

        // la probeta: cada capa mide lo que cuesta, en pesos por litro
        const montos = [referencia, FLETE, LOGISTICA, MARGEN, actual.ieps, actual.iva];
        let y = 0.05;
        let yLetrero = -1; // los letreros no se enciman: cada uno al menos 0.1 arriba del anterior
        S.capas.forEach((c, i) => {
            c.alto += (Math.max(0.0001, montos[i] * POR_PESO) - c.alto) * suave;
            c.m.scale.y = c.alto;
            c.m.position.y = y + c.alto / 2;
            c.m.visible = c.alto > 0.002;
            yLetrero = Math.max(y + c.alto / 2, yLetrero + 0.1);
            c.l.position.set(0.56, yLetrero, 0);
            c.l.visible = c.alto > 0.004;
            y += c.alto;
        });

        // el combustible avanza por tuberías y mangueras; el barco se mece
        const m = new THREE.Matrix4();
        const q = new THREE.Vector3();
        const sueltos = e < 0.15;
        S.flujos.forEach(f => {
            f.im.visible = sueltos;
            if (!sueltos) return;
            for (let i = 0; i < f.n; i++) { f.ruta.getPointAt(((i / f.n) + tiempo * 0.12) % 1, q); m.makeTranslation(q.x, q.y, q.z); f.im.setMatrixAt(i, m); }
            f.im.instanceMatrix.needsUpdate = true;
        });
        S.buque.rotation.x = Math.sin(tiempo * 1.3) * 0.03;
        S.buque.position.y = BASE + 0.04 + Math.sin(tiempo * 1.1) * 0.01;
        S.precioBomba.userData.poner(peso(actual.precio));

        const aguanta = con && actual.estimulo > 0.001 && actual.estimulo < 0.999;
        return {
            cifras: {
                precio: `${peso(actual.precio)} /L`,
                hud: !con ? 'Sin estímulo: el precio sigue al internacional'
                    : aguanta ? 'Con estímulo: el IEPS baja y el precio se aguanta'
                        : actual.estimulo >= 0.999 ? 'Estímulo al 100 %: ya no alcanza, el precio sube'
                            : 'Precio internacional bajo: no hace falta estímulo',
                molecula: `${peso(referencia)} /L`,
                estimuloC: `${num(actual.estimulo * 100)} %`,
                ieps: `${peso(actual.ieps)} /L`,
                iva: `${peso(actual.iva)} /L`,
            },
        };
    },
});

// pantalla del dispensario: números claros sobre fondo oscuro
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
        g.fillStyle = '#13151f';
        g.fillRect(0, 0, c.width, c.height);
        g.fillStyle = '#7ef0a6';
        g.font = `700 ${Math.round(c.height * 0.6)}px Manrope, sans-serif`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(texto, c.width / 2, c.height / 2 + 3);
        t.needsUpdate = true;
    };
    return m;
}

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
    let tam = Math.round(c.height * 0.62);
    g.font = `700 ${tam}px Manrope, sans-serif`;
    tam = Math.floor(tam * Math.min(1, (c.width * 0.92) / Math.max(1, g.measureText(texto).width)));
    g.font = `700 ${tam}px Manrope, sans-serif`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(texto, c.width / 2, c.height / 2 + 2);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ map: t }));
    m.userData.sinResalte = true;
    return m;
}
