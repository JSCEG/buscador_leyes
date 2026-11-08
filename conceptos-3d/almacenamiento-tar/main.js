// «Almacenamiento de petrolíferos (TAR)», en 3D: tres tanques verticales de techo flotante dentro de su dique de
// contención, la isleta donde se llenan las pipas y el sistema contra incendios.
//
// Entrada: el nivel de los tanques (0 a 100 %). El techo flotante va encima del combustible: sube y baja con él, así
// no queda aire con vapores entre el líquido y el techo. Dos pruebas: una fuga (el dique la retiene) y el sistema
// contra incendios (los monitores lanzan espuma).
//
// Cifras:
// - Cada tanque: 100,000 barriles (la ficha: «hasta 100,000 barriles»). 1 barril = 158.987 L → 15.9 millones de litros.
// - Venta supuesta de esta terminal: 30,000 barriles al día (≈ 4.8 millones de litros). Es una cifra de ejemplo para una
//   terminal mediana: llena, alcanza para 10 días; la política de almacenamiento mínimo de SENER pide 5 días de venta
//   de gasolina y diésel (a esta terminal le pide estar al menos a la mitad).
// - Una pipa: 20,000 litros (≈ 126 barriles), medidos a 20 °C (temperatura de referencia de la medición fiscal).
// - El dique retiene el 100 % del tanque más grande (la ficha); aquí, la fuga de un tanque entero cabe con espacio.
import * as THREE from 'three';
import { crearMaquina, clamp, num } from '../comun/maquina.js';

const BARRILES_TANQUE = 100000;
const LITROS_BARRIL = 158.987;
const VENTA_DIA = 30000; // barriles
const MINIMO_DIAS = 5;
const PIPA_L = 20000;
const R_TANQUE = 0.72;
const ALTO_TANQUE = 1.5;
const BASE = 0.16;
const DIQUE = { x0: -3.55, x1: 0.85, z0: -1.65, z1: 1.55, alto: 0.32 };
const TANQUES = [
    { x: -2.55, z: -0.65, producto: 'Magna', color: '#6f9a55' },
    { x: -0.65, z: -0.65, producto: 'Premium', color: '#c0563f' },
    { x: -1.6, z: 0.75, producto: 'Diésel', color: '#c8a45a' },
];

let nivel = 0.8;
let derrame = 0; // altura del líquido derramado dentro del dique (0 a 1 del muro)
let espuma = 0; // cuánto chorro hay (0 a 1)
let pipasLlenas = 0;
let piezasT = null;

const diasDe = n => (n * BARRILES_TANQUE * TANQUES.length) / VENTA_DIA;

crearMaquina({
    figura: 'almacenamiento-tar',
    nombre: 'la terminal',
    partes: [
        { n: 1, nombre: 'Tanques verticales', ancla: [-1.6, 2.0, 0.75], vista: { tx: -1.6, ty: 1.0, tz: 0, az: 24, el: 30, d: 5.2 }, corte: true },
        { n: 2, nombre: 'Dique de contención', ancla: [0.85, 0.75, 1.55], vista: { tx: -1.2, ty: 0.3, tz: 0.6, az: 30, el: 26, d: 5.6 } },
        { n: 3, nombre: 'Isleta de llenado de pipas', ancla: [2.35, 1.65, 0], vista: { tx: 2.3, ty: 0.7, tz: 0, az: 34, el: 18, d: 3.8 } },
        { n: 4, nombre: 'Sistema contra incendios', ancla: [1.1, 1.3, -1.2], vista: { tx: -0.6, ty: 0.8, tz: -0.6, az: 40, el: 26, d: 5.4 } },
    ],
    vistas: [
        { id: 'general', texto: 'General', tx: -0.3, ty: 0.7, tz: 0, az: 24, el: 30, d: 9.6 },
        { id: 'frente', texto: 'Frente', tx: -0.3, ty: 0.7, tz: 0, az: 0, el: 10, d: 9.0 },
        { id: 'arriba', texto: 'Arriba', tx: -0.3, ty: 0.3, tz: 0, az: 0, el: 72, d: 9.4 },
        { id: 'adentro', texto: 'Adentro', tx: -1.6, ty: 0.9, tz: 0, az: 18, el: 16, d: 5.8, corte: true },
    ],
    entrada: { etiqueta: 'Nivel de los tanques', min: 0, max: 100, paso: 1, valor: 80, aria: 'Nivel de los tanques, en porcentaje' },
    selectores: [
        { id: 'fuga', etiqueta: 'Fuga', valor: 'no', opciones: [{ id: 'no', texto: 'Sin fuga' }, { id: 'si', texto: 'Simular fuga' }] },
        { id: 'fuego', etiqueta: 'Sistema contra incendios', valor: 'espera', opciones: [{ id: 'espera', texto: 'En espera' }, { id: 'prueba', texto: 'Probar espuma' }] },
    ],
    lento: [{ id: 'normal', texto: 'Normal', k: 1, nota: 'Las pipas y la espuma se mueven a ritmo de maqueta.' }],
    anchoVertical: 1.55,
    lejaniaMax: 3.5,
    // en el recorrido los tanques se vacían hasta debajo del mínimo y se vuelven a llenar
    entradaRecorrido: t => 55 + 40 * Math.cos((t / 36) * Math.PI * 2),
    hud: '<b data-c="dias"></b><span data-c="hud"></span>',
    cifras: [
        { id: 'barriles', etiqueta: 'Inventario', nota: 'barriles en los tres tanques' },
        { id: 'dias', etiqueta: 'Alcanza para', nota: 'el mínimo de SENER es 5 días' },
        { id: 'pipas', etiqueta: 'Pipas llenadas', nota: '20,000 litros cada una, medidos a 20 °C' },
        { id: 'dique', etiqueta: 'Dique', nota: 'retiene el 100 % de un tanque' },
    ],
    curva: {
        titulo: 'Días de venta guardados',
        leyenda: [{ texto: 'inventario' }, { texto: 'mínimo (5 días)' }],
        nota: 'Por debajo de la línea, la terminal no cumple el inventario mínimo.',
        dibujar(g, w, h, estado) {
            const dias = diasDe(nivel);
            const x = d => (d / 10) * (w - 8) + 4;
            g.clearRect(0, 0, w, h);
            const alto = Math.min(30, h - 34);
            const y = (h - alto) / 2;
            g.fillStyle = estado.TEMA === 'oscuro' ? '#262a36' : '#ebebe9';
            g.fillRect(4, y, w - 8, alto);
            g.fillStyle = dias < MINIMO_DIAS ? estado.P.acento : estado.P.tinta;
            g.fillRect(4, y, Math.max(0, x(dias) - 4), alto);
            g.strokeStyle = estado.P.acento;
            g.lineWidth = 2;
            g.setLineDash([5, 4]);
            g.beginPath(); g.moveTo(x(MINIMO_DIAS), y - 10); g.lineTo(x(MINIMO_DIAS), y + alto + 10); g.stroke();
            g.setLineDash([]);
            g.fillStyle = estado.P.suave;
            g.font = '600 11px Manrope, sans-serif';
            for (let d = 0; d <= 10; d += 2) g.fillText(`${d}`, x(d) - 3, y + alto + 22);
        },
    },
    corte: true,

    construir({ raiz, M, P, TEMA, sombra, contorno, conCorte }) {
        raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.16, 3.8), M.ceramica))).translateY(0.08));
        const rotulo = (texto, ancho, alto, tam = 52) => {
            const c = document.createElement('canvas');
            c.width = 256;
            c.height = Math.round(256 * alto / ancho);
            const g = c.getContext('2d');
            g.fillStyle = P.tinta;
            g.font = `700 ${tam}px Manrope, sans-serif`;
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            g.fillText(texto, 128, c.height / 2 + 2);
            const t = new THREE.CanvasTexture(c);
            t.colorSpace = THREE.SRGBColorSpace;
            return new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
        };

        // 2 · dique de contención: muro bajo de concreto con su borde guinda; piso interior gris
        const dique = new THREE.Group();
        const anchoD = DIQUE.x1 - DIQUE.x0;
        const fondoD = DIQUE.z1 - DIQUE.z0;
        const cx = (DIQUE.x0 + DIQUE.x1) / 2;
        const cz = (DIQUE.z0 + DIQUE.z1) / 2;
        const muro = (w, d, x, z) => {
            const m = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(w, DIQUE.alto, d), M.ceramica)));
            m.position.set(x, BASE + DIQUE.alto / 2, z);
            const borde = sombra(new THREE.Mesh(new THREE.BoxGeometry(w + 0.01, 0.025, d + 0.01), M.borde));
            borde.position.set(x, BASE + DIQUE.alto + 0.012, z);
            dique.add(m, borde);
        };
        muro(anchoD, 0.1, cx, DIQUE.z0);
        muro(anchoD, 0.1, cx, DIQUE.z1);
        muro(0.1, fondoD, DIQUE.x0, cz);
        muro(0.1, fondoD, DIQUE.x1, cz);
        raiz.add(dique);
        // el derrame: una lámina del color del producto que sube dentro del dique (nunca por encima del muro)
        const charco = new THREE.Mesh(new THREE.BoxGeometry(anchoD - 0.12, 1, fondoD - 0.12), new THREE.MeshStandardMaterial({ color: TANQUES[1].color, transparent: true, opacity: 0.75, roughness: 0.15 }));
        charco.position.set(cx, BASE, cz);
        charco.scale.y = 0.001;
        charco.userData.sinResalte = true;
        raiz.add(charco);

        // 1 · tanques: casco blanco (se corta con «Ver por dentro»), banda guinda, el producto y el techo flotante
        const tanques = TANQUES.map(t => {
            const g = new THREE.Group();
            g.position.set(t.x, BASE, t.z);
            const casco = sombra(new THREE.Mesh(new THREE.CylinderGeometry(R_TANQUE, R_TANQUE, ALTO_TANQUE, 56, 1, true), conCorte(M.ceramica.clone())));
            casco.position.y = ALTO_TANQUE / 2;
            contorno(casco, 30, Object.assign(M.contorno.clone(), { clippingPlanes: casco.material.clippingPlanes }));
            const banda = sombra(new THREE.Mesh(new THREE.CylinderGeometry(R_TANQUE + 0.005, R_TANQUE + 0.005, 0.07, 56, 1, true), conCorte(M.borde.clone())));
            banda.position.y = ALTO_TANQUE - 0.06;
            const fondo = sombra(new THREE.Mesh(new THREE.CylinderGeometry(R_TANQUE, R_TANQUE, 0.02, 56), M.grafito));
            fondo.position.y = 0.01;
            const liquido = new THREE.Mesh(new THREE.CylinderGeometry(R_TANQUE - 0.02, R_TANQUE - 0.02, 1, 48), new THREE.MeshStandardMaterial({ color: t.color, roughness: 0.2, transparent: true, opacity: 0.9 }));
            liquido.userData.sinResalte = true;
            // techo flotante: disco grafito con su sello guinda; va encima del líquido
            const techo = new THREE.Group();
            techo.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(R_TANQUE - 0.03, R_TANQUE - 0.03, 0.05, 48), M.grafito)));
            techo.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(R_TANQUE - 0.03, 0.02, 8, 48).rotateX(Math.PI / 2), M.borde)));
            const nombre = rotulo(t.producto, 0.6, 0.16);
            nombre.position.set(0, 0.95, R_TANQUE + 0.01);
            nombre.material.clippingPlanes = casco.material.clippingPlanes;
            g.add(casco, banda, fondo, liquido, techo, nombre);
            raiz.add(g);
            return { g, casco, liquido, techo };
        });
        // tubería de llegada (del ducto) a los tanques, por el piso
        const curva = (...p) => new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));
        const tuboG = (c, r = 0.035) => raiz.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(c, 64, r, 10, false), M.grafito)));
        tuboG(curva([-3.8, 0.22, -1.25], [-3.0, 0.22, -1.25], [-2.55, 0.22, -1.25], [-2.55, 0.3, -1.36]));
        tuboG(curva([-2.55, 0.22, -1.25], [-0.65, 0.22, -1.25], [-0.65, 0.3, -1.36]));
        tuboG(curva([-3.0, 0.22, -1.25], [-3.2, 0.22, 0.75], [-2.3, 0.22, 0.75]));
        // de los tanques a la isleta
        tuboG(curva([0.05, 0.25, -0.65], [1.4, 0.22, -0.4], [2.0, 0.22, -0.25], [2.1, 0.25, -0.1]));

        // 3 · isleta de llenado: techo con borde guinda, postes, dos brazos de carga y medidores
        const isleta = new THREE.Group();
        isleta.position.set(2.35, BASE, 0);
        const techoIsleta = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 2.2), M.ceramica)));
        techoIsleta.position.y = 1.32;
        const bordeIsleta = sombra(new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.04, 2.22), M.borde));
        bordeIsleta.position.y = 1.27;
        isleta.add(techoIsleta, bordeIsleta);
        for (const [x, z] of [[-0.65, -1.0], [0.65, -1.0], [-0.65, 1.0], [0.65, 1.0]]) {
            const poste = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.28, 0.08), M.ceramica)));
            poste.position.set(x, 0.64, z);
            isleta.add(poste);
        }
        const plataforma = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 2.0), M.ceramica)));
        plataforma.position.set(0, 0.06, 0);
        isleta.add(plataforma);
        const brazos = [-0.45, 0.45].map(z => {
            const b = new THREE.Group();
            b.position.set(0, 0.9, z);
            const columna = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 12), M.grafito));
            columna.position.y = -0.4;
            const pivote = new THREE.Group();
            const tramo1 = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 12).rotateZ(Math.PI / 2), M.grafito));
            tramo1.position.x = 0.3;
            const codo = new THREE.Group();
            codo.position.x = 0.6;
            const tramo2 = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 12), M.grafito));
            tramo2.position.y = -0.25;
            const boca = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.035, 0.08, 14), M.borde));
            boca.position.y = -0.5;
            codo.add(tramo2, boca);
            pivote.add(tramo1, codo);
            b.add(columna, pivote);
            const medidor = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.12), M.ceramica)));
            medidor.position.set(-0.1, -0.55, 0.0);
            b.add(medidor);
            isleta.add(b);
            return { b, pivote, codo };
        });
        raiz.add(isleta);
        // pipas: cabina blanca con franja guinda y tanque blanco; llegan, se llenan y se van
        const pipa = () => {
            const g = new THREE.Group();
            const cabina = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.32, 0.38), M.ceramica)));
            cabina.position.set(0, 0.26, 0.62);
            const franja = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.39), M.borde));
            franja.position.set(0, 0.2, 0.62);
            const tanque = contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.95, 28).rotateX(Math.PI / 2), M.ceramica)), 40);
            tanque.position.set(0, 0.3, -0.05);
            const chasis = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.06, 1.35), M.grafito));
            chasis.position.set(0, 0.1, 0.12);
            for (const [x, z] of [[-0.15, 0.6], [0.15, 0.6], [-0.15, -0.3], [0.15, -0.3]]) {
                const rueda = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 16).rotateZ(Math.PI / 2), M.grafito));
                rueda.position.set(x, 0.07, z);
                g.add(rueda);
            }
            const barra = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.9), new THREE.MeshBasicMaterial({ color: P.acento }));
            barra.position.set(0.18, 0.3, -0.05);
            barra.userData.sinResalte = true;
            g.add(cabina, franja, tanque, chasis, barra);
            raiz.add(g);
            return { g, barra, t: 0 };
        };
        const pipas = [pipa(), pipa()];
        pipas[1].t = 0.5;

        // 4 · sistema contra incendios: tanque de espuma, casa de bombas, anillo de agua y tres monitores
        const fuego = new THREE.Group();
        const tanqueEspuma = contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.75, 28), M.ceramica)), 40);
        tanqueEspuma.position.set(1.4, BASE + 0.375, -1.3);
        const bandaEsp = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.08, 28), M.borde));
        bandaEsp.position.set(1.4, BASE + 0.6, -1.3);
        const bombas = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.4), M.ceramica)));
        bombas.position.set(1.95, BASE + 0.175, -1.3);
        fuego.add(tanqueEspuma, bandaEsp, bombas);
        // anillo de agua contra incendio: tramos rectos alrededor del dique, a ras de piso
        const anillo = new THREE.CurvePath();
        const esquinas = [[1.25, -1.3], [DIQUE.x1 + 0.14, -1.3], [DIQUE.x1 + 0.14, DIQUE.z0 - 0.12], [DIQUE.x0 - 0.12, DIQUE.z0 - 0.12], [DIQUE.x0 - 0.12, DIQUE.z1 + 0.12], [DIQUE.x1 + 0.14, DIQUE.z1 + 0.12], [DIQUE.x1 + 0.14, -0.9]];
        for (let i = 1; i < esquinas.length; i++) anillo.add(new THREE.LineCurve3(new THREE.Vector3(esquinas[i - 1][0], 0.2, esquinas[i - 1][1]), new THREE.Vector3(esquinas[i][0], 0.2, esquinas[i][1])));
        fuego.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(anillo, 200, 0.02, 8, false), M.borde)));
        const monitores = [[DIQUE.x0 - 0.12, DIQUE.z0 - 0.12, -2.55, -0.65], [DIQUE.x1 + 0.14, DIQUE.z0 - 0.12, -0.65, -0.65], [DIQUE.x0 - 0.12, DIQUE.z1 + 0.12, -1.6, 0.75]].map(([x, z, tx, tz]) => {
            const m = new THREE.Group();
            m.position.set(x, BASE, z);
            m.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 10), M.grafito)).translateY(0.25));
            const cabeza = new THREE.Group();
            cabeza.position.y = 0.52;
            cabeza.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, 0.22, 12).rotateX(Math.PI / 2), M.borde)).translateZ(0.11));
            // apunta hacia su tanque (giro) y hacia arriba (inclinación), para lanzar la espuma en arco
            cabeza.rotation.set(-0.6, Math.atan2(tx - x, tz - z), 0, 'YXZ');
            m.add(cabeza);
            fuego.add(m);
            return { m, objetivo: new THREE.Vector3(tx, BASE + ALTO_TANQUE + 0.1, tz) };
        });
        raiz.add(fuego);
        // la espuma: puntos blancos en arco de cada monitor a su tanque
        const ESPUMA = 30;
        // espuma blanca con un poco de azul para que se distinga del papel
        const espumaMat = new THREE.MeshBasicMaterial({ color: TEMA === 'oscuro' ? '#ffffff' : '#cfe0ea', transparent: true, opacity: 0.95 });
        const chorros = monitores.map(() => { const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 8, 6), espumaMat, ESPUMA); im.frustumCulled = false; raiz.add(im); return im; });

        piezasT = { tanques, charco, pipas, brazos, monitores, chorros, ESPUMA, isleta };
        return {
            piezas: { 1: tanques.map(t => t.g), 2: [dique], 3: [isleta], 4: [fuego] },
            // los cascos suben y dejan ver el producto y el techo flotante; el dique se abre; la isleta sube
            movibles: [
                ...tanques.map(t => ({ parte: 1, objetos: [t.casco], hacia: [0, 1.6, 0] })),
                { parte: 2, objetos: [dique], hacia: [0, 0, 0.5] },
                { parte: 3, objetos: [isleta], hacia: [0.4, 0.5, 0] },
                { parte: 4, objetos: [fuego], hacia: [0.3, 0.35, -0.3] },
            ],
            anclas: { 1: [tanques[2].g, [0, 2.0, 0]], 2: [dique, [DIQUE.x1, BASE + 0.6, DIQUE.z1]], 3: [isleta, [0, 1.6, 0]], 4: [fuego, [1.4, 1.2, -1.3]] },
        };
    },

    paso(estado) {
        const { tanques, charco, pipas, brazos, monitores, chorros, ESPUMA } = piezasT;
        const { dt, e } = estado;
        estado.entrada += (estado.entradaObjetivo - estado.entrada) * (1 - Math.exp(-dt / 0.5));
        nivel = estado.entrada / 100;
        const fuga = estado.sel.fuga === 'si';
        // nivel y techo flotante de cada tanque (el que fuga baja a cero; su producto llena el dique)
        derrame += ((fuga ? 1 : 0) - derrame) * (1 - Math.exp(-dt / 2.5));
        tanques.forEach((t, i) => {
            const n = i === 1 ? nivel * (1 - derrame) : nivel;
            const alto = Math.max(0.02, n * (ALTO_TANQUE - 0.12));
            t.liquido.scale.y = alto;
            t.liquido.position.y = 0.02 + alto / 2;
            t.techo.position.y = 0.02 + alto + 0.03;
        });
        // el derrame de un tanque entero cabe en el dique: llena ~ la mitad del muro (volumen del tanque ÷ área del dique)
        const areaDique = (DIQUE.x1 - DIQUE.x0 - 0.12) * (DIQUE.z1 - DIQUE.z0 - 0.12);
        const volumenTanque = Math.PI * R_TANQUE ** 2 * nivel * (ALTO_TANQUE - 0.12);
        const alturaDerrame = Math.min(DIQUE.alto * 0.95, (volumenTanque * derrame) / areaDique);
        charco.scale.y = Math.max(0.001, alturaDerrame);
        charco.position.y = BASE + charco.scale.y / 2;
        charco.visible = derrame > 0.01;

        // pipas: entran por el frente, se paran bajo el brazo, se llenan y se van por atrás
        const ciclo = 16; // s por pipa
        pipas.forEach((p, i) => {
            p.t = (p.t + dt / ciclo) % 1;
            const u = p.t;
            const bahia = i === 0 ? -0.45 : 0.45;
            let z;
            let llenado = 0;
            if (u < 0.2) z = 2.6 - (u / 0.2) * (2.6 - bahia);
            else if (u < 0.75) { z = bahia; llenado = clamp((u - 0.28) / 0.4, 0, 1); }
            else z = bahia - ((u - 0.75) / 0.25) * 3.2;
            p.g.position.set(2.35 + 0.42, BASE, z);
            p.g.visible = Math.abs(z) < 2.3;
            p.barra.scale.z = Math.max(0.02, llenado);
            p.barra.position.z = -0.05 - 0.45 * (1 - llenado);
            // el brazo baja mientras llena
            const baja = u > 0.22 && u < 0.73 ? 1 : 0;
            const b = brazos[i];
            b.pivote.rotation.z += ((baja ? -0.35 : 0.25) - b.pivote.rotation.z) * (1 - Math.exp(-dt / 0.3));
            b.codo.rotation.z = -b.pivote.rotation.z;
            if (u > 0.74 && !p.contada) { p.contada = true; pipasLlenas += 1; }
            if (u < 0.1) p.contada = false;
        });

        // espuma: arcos de cada monitor a su tanque
        espuma += ((estado.sel.fuego === 'prueba' && e < 0.05 ? 1 : 0) - espuma) * (1 - Math.exp(-dt / 0.4));
        const m4 = new THREE.Matrix4();
        const p = new THREE.Vector3();
        const desde = new THREE.Vector3();
        monitores.forEach((mon, k) => {
            mon.m.children[1].getWorldPosition(desde);
            chorros[k].visible = espuma > 0.02;
            for (let i = 0; i < ESPUMA; i++) {
                const u = ((i / ESPUMA) + estado.T * 0.6) % 1;
                p.lerpVectors(desde, mon.objetivo, u);
                p.y += Math.sin(u * Math.PI) * 0.9;
                const s = espuma * (0.6 + u * 0.8);
                m4.makeScale(s, s, s).setPosition(p);
                chorros[k].setMatrixAt(i, m4);
            }
            chorros[k].instanceMatrix.needsUpdate = true;
        });

        const barriles = BARRILES_TANQUE * nivel * (TANQUES.length - derrame);
        const dias = barriles / VENTA_DIA;
        return {
            cifras: {
                dias: `${num(dias, 1)} días`,
                hud: `${num(barriles)} barriles · ${dias < MINIMO_DIAS ? 'por debajo del mínimo de 5 días' : 'cumple el mínimo de 5 días'}`,
                barriles: `${num(barriles)} bbl`,
                pipas: `${num(pipasLlenas)}`,
                dique: derrame > 0.05 ? `retiene ${num(BARRILES_TANQUE * nivel * derrame)} bbl` : 'seco',
            },
        };
    },
});
