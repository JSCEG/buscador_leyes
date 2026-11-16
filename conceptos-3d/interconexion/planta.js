// Cómo se conecta una central a la red, hecho con código. Sistema Búho. A la izquierda, las centrales Proteus y Tampico con sus
// estaciones de inversores; al centro, la subestación elevadora (celdas de 34.5 kV, banco de capacitores, dos transformadores, barras de
// 115 kV y casa de control); la línea de enlace con su fibra óptica en el cable de guarda; a la derecha, la subestación de maniobras de
// la CFE con la bahía de la central, la medición y el entronque de la línea que ya existía; atrás, el CENACE. Las obras aparecen
// conforme avanza el trámite. Nada está a escala.
//
//   materiales(P)     escenario(renderer, scene, M, { movil, oscuro })
//   construir(M, P, { movil, oscuro }) → { raiz, posar(e), partes, anclas, giran, repintar }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp01, sale } from '../planta-comun/ayudas.js';
import { caja, cil, crearAyudante, crearTubos, en, estudio, geoTorre, materialesBase, sombra, texturaGrano } from '../planta-comun/piezas.js';
import { crearLineasAereas } from '../planta-comun/conductores.js';
import { ALTO_MARCO, ALTO_TORRE, BAHIAS, BE, BLOQUE, BORNES, BP, CAMPOS, ESTACIONES, FLUIDOS, LINEAS, MARCOS, PARTES, SITIO, TORRES, ZANJAS } from './lugar.js';

const PI = Math.PI;
export const P_PLANTA = {
    papel: '#fafafa', noche: '#0a0e12', tinta: '#171317', marfil: '#f3f1ec', grafito: '#303137', acero: '#a7abb3', guinda: '#9b2247', rosa: '#e57a9a',
    tierraDia: '#d6d7c8', tierraNoche: '#23272c', losaDia: '#dcdcda', losaNoche: '#2c3036', suelo: '#b9a688',
};

export function materiales(P) {
    const M = materialesBase(P, FLUIDOS);
    Object.assign(M, {
        piso: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#d6d1c4', 'rgba(0,0,0,0.07)', [10, 5]), roughness: 0.95, envMapIntensity: 0.25 }),
        grava: new THREE.MeshStandardMaterial({ color: '#b8b4ab', map: texturaGrano('#bdb8ae', 'rgba(0,0,0,0.12)', [6, 3]), roughness: 1 }),
        zanja: new THREE.MeshStandardMaterial({ color: '#c2b49a', roughness: 1 }),
        gabinete: new THREE.MeshStandardMaterial({ color: '#e6e3dc', roughness: 0.5 }),
        trafo: new THREE.MeshStandardMaterial({ color: '#6a7078', roughness: 0.5, metalness: 0.5, envMapIntensity: 0.8 }),
        porcelana: new THREE.MeshStandardMaterial({ color: '#8a5a44', roughness: 0.35 }),
        panel: new THREE.MeshStandardMaterial({ color: '#1f3354', roughness: 0.25, metalness: 0.6, envMapIntensity: 1.1 }),
        marcoPanel: new THREE.MeshStandardMaterial({ color: '#c9ccd1', roughness: 0.4, metalness: 0.7 }),
        muro: new THREE.MeshStandardMaterial({ color: '#e1ddd3', roughness: 0.8 }),
        techo: new THREE.MeshStandardMaterial({ color: '#c3c6cb', roughness: 0.55, metalness: 0.4 }),
        ventanaV: new THREE.MeshStandardMaterial({ color: '#7fa2bf', roughness: 0.15, metalness: 0.4, envMapIntensity: 1.2 }),
        contenedor: new THREE.MeshStandardMaterial({ color: '#efede8', roughness: 0.45, metalness: 0.2, envMapIntensity: 0.7 }),
        capacitor: new THREE.MeshStandardMaterial({ color: '#d9dbde', roughness: 0.35, metalness: 0.5 }),
        cerca: new THREE.MeshStandardMaterial({ color: '#9ca0a6', roughness: 0.5, metalness: 0.6, transparent: true, opacity: 0.55 }),
        pantalla: new THREE.MeshBasicMaterial({ color: '#1f3a4a', toneMapped: false }),
        pantallaViva: new THREE.MeshBasicMaterial({ color: '#2fb36a', toneMapped: false }),
        rayo: new THREE.MeshBasicMaterial({ color: '#fff4c2', toneMapped: false, transparent: true }),
        abierto: new THREE.MeshBasicMaterial({ color: '#d64545', toneMapped: false }),
        estaca: new THREE.MeshStandardMaterial({ color: '#d96a2b', roughness: 0.6 }),
    });
    return M;
}

const [X0, X1] = BLOQUE.x;
const [Z0, Z1] = BLOQUE.z;
const Y0 = BLOQUE.y[0];
export function escenario(renderer, scene, M, { movil = false, oscuro = false } = {}) {
    const dia = new THREE.Color(oscuro ? '#c9c6c0' : '#ffffff');
    const noche = new THREE.Color('#5d5b58');
    return estudio(renderer, scene, { movil, oscuro, y0: Y0, alcance: 15, alActualizar(n) { M.piso.color.copy(dia).lerp(noche, n); } });
}

export function construir(M, P, { movil = false, oscuro = false } = {}) {
    const raiz = new THREE.Group();
    const kit = crearAyudante(M, raiz, PARTES.map(p => p.id), { movil });
    const { partes, giran, unidad, brillo, cub, rotular } = kit;
    const colorSuelo = oscuro ? '#f2efe8' : P.tinta;
    const plano = (padre, texto, x, z, ancho, giro = 0, y = 0.012) => { const r = rotular(padre, texto, x, y, z, colorSuelo, ancho); r.rotation.set(-PI / 2, 0, giro); return r; };
    const malla = (geos, m) => sombra(new THREE.Mesh(mergeGeometries(geos), m));
    const losa = (geo, m, x, z, padre = raiz) => { const o = new THREE.Mesh(geo, m); o.position.set(x, 0, z); o.receiveShadow = true; padre.add(o); return o; };
    // lo que se va construyendo: cada pieza crece del piso entre `desde` y `hasta` de la obra (0–1)
    const obras = [];
    const obra = (obj, desde, hasta = desde + 0.12) => { obras.push({ obj, desde, hasta }); return obj; };

    // ---------- el suelo, las zanjas y los patios de grava
    losa(new THREE.BoxGeometry(X1 - X0, -Y0, Z1 - Z0).translate(0, Y0 / 2, 0), M.piso, 0, 0);
    const zanjas = new THREE.Group();
    raiz.add(zanjas);
    zanjas.add(losa(new THREE.BoxGeometry(SITIO.celdas[0] - 0.35 - (ESTACIONES[0][0] - 0.05), 0.012, 0.2).translate(0, 0.006, 0), M.zanja, (SITIO.celdas[0] - 0.35 + ESTACIONES[0][0] - 0.05) / 2, ZANJAS.proteus + 0.05, zanjas));
    zanjas.add(losa(new THREE.BoxGeometry(ZANJAS.paso + 0.1 - (ESTACIONES[4][0] - 0.05), 0.012, 0.16).translate(0, 0.006, 0), M.zanja, (ZANJAS.paso + 0.1 + ESTACIONES[4][0] - 0.05) / 2, ZANJAS.tampico + 0.02, zanjas));
    zanjas.add(losa(new THREE.BoxGeometry(0.14, 0.012, ZANJAS.tampico - -0.5 + 0.1).translate(0, 0.006, 0), M.zanja, ZANJAS.paso + 0.02, (ZANJAS.tampico - 0.5) / 2, zanjas));
    obra(zanjas, 0.32, 0.45);
    const patioElev = losa(new THREE.BoxGeometry(3.15, 0.02, 2.55).translate(0, 0.01, 0), M.grava, -2.2, 0.2);
    obra(patioElev, 0.06, 0.12);
    const patioPoi = losa(new THREE.BoxGeometry(3.1, 0.02, 3.3).translate(0, 0.01, 0), M.grava, 4.55, 0.25);
    obra(patioPoi, 0.06, 0.12);

    // ---------- piezas de subestación
    /** Una columna de acero con su aislador de porcelana encima; la punta queda en y. */
    const geoApoyo = (x, z, y) => [new THREE.BoxGeometry(0.03, y - 0.12, 0.03).translate(x, (y - 0.12) / 2, z), new THREE.CylinderGeometry(0.011, 0.015, 0.12, 8).translate(x, y - 0.06, z)];
    /** Un interruptor: tres polos (columna, cámara de porcelana y cabeza), separados a lo largo de `eje`. */
    function interruptor(padre, [x, y, z], eje, sep = 0.24) {
        const acero = [];
        const porc = [];
        const cabeza = [];
        for (let k = -1; k <= 1; k++) {
            const px = eje === 'x' ? x + k * sep : x;
            const pz = eje === 'z' ? z + k * sep : z;
            acero.push(new THREE.BoxGeometry(0.035, 0.42, 0.035).translate(px, 0.21, pz));
            porc.push(new THREE.CylinderGeometry(0.014, 0.019, y - 0.47, 10).translate(px, 0.42 + (y - 0.47) / 2, pz));
            cabeza.push(new THREE.CylinderGeometry(0.026, 0.026, 0.05, 10).translate(px, y - 0.025, pz));
        }
        acero.push(new THREE.BoxGeometry(eje === 'x' ? 2 * sep + 0.08 : 0.08, 0.05, eje === 'z' ? 2 * sep + 0.08 : 0.08).translate(x, 0.4, z));
        padre.add(malla(acero, M.acero), malla(porc, M.porcelana), malla(cabeza, M.grafito));
    }
    /** Un marco de remate: dos postes, la viga donde cuelgan las cadenas de aisladores y un mástil para el cable de guarda. */
    function marco(padre, [x, z], eje, { mastil = false } = {}) {
        const g = [];
        const vy = ALTO_MARCO * 0.95 + 0.035;
        for (const s of [-1, 1]) {
            const px = eje === 'x' ? x + s * 0.42 : x;
            const pz = eje === 'z' ? z + s * 0.42 : z;
            g.push(new THREE.BoxGeometry(0.055, ALTO_MARCO, 0.055).translate(px, ALTO_MARCO / 2, pz));
            g.push(new THREE.BoxGeometry(0.16, 0.02, 0.16).translate(px, 0.01, pz));
        }
        g.push(new THREE.BoxGeometry(eje === 'x' ? 0.92 : 0.06, 0.05, eje === 'z' ? 0.92 : 0.06).translate(x, vy, z));
        if (mastil) g.push(new THREE.BoxGeometry(0.03, ALTO_MARCO + 0.12 - vy, 0.03).translate(x, (ALTO_MARCO + 0.12 + vy) / 2, z));
        padre.add(malla(g, M.torre));
    }
    /** Tres barras a lo largo de z, separadas en x, sobre columnas con aisladores. */
    function barras(padre, x0, sep, y, [z0, z1]) {
        const tubos = [];
        const apoyos = [];
        for (let k = -1; k <= 1; k++) {
            const x = x0 + k * sep;
            tubos.push(new THREE.CylinderGeometry(0.009, 0.009, z1 - z0, 8).rotateX(PI / 2).translate(x, y, (z0 + z1) / 2));
            for (let i = 0; i <= Math.round((z1 - z0) / 0.7); i++) apoyos.push(...geoApoyo(x, z0 + ((z1 - z0) * i) / Math.round((z1 - z0) / 0.7), y - 0.015));
        }
        padre.add(malla(tubos, M.acero), malla(apoyos.filter((_, i) => i % 2 === 0), M.acero), malla(apoyos.filter((_, i) => i % 2 === 1), M.porcelana));
    }
    /** Una casa de control: muros que se vuelven vidrio, techo, puerta, gabinetes y pantallas adentro. */
    function casa(padre, [x, z], ancho, fondo, alto, cubierta, abre, { antena = false } = {}) {
        const mat = cub(cubierta, abre, { color: '#e1ddd3' });
        padre.add(en(sombra(new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, fondo).translate(0, alto / 2, 0), mat)), x, 0, z));
        padre.add(en(caja(ancho + 0.06, 0.04, fondo + 0.06, M.techo), x, alto, z));
        const adentro = [];
        for (let k = 0; k < 4; k++) adentro.push(new THREE.BoxGeometry(0.1, alto * 0.75, 0.12).translate(x - ancho / 2 + 0.12 + k * 0.14, alto * 0.375, z - fondo / 2 + 0.1));
        padre.add(malla(adentro, M.grafito));
        padre.add(en(caja(ancho * 0.4, 0.12, 0.01, M.pantallaViva), x + ancho * 0.15, alto * 0.45, z - fondo / 2 + 0.17));
        padre.add(en(caja(0.12, alto * 0.62, 0.01, M.grafito), x - ancho * 0.3, 0, z + fondo / 2 + 0.005));
        if (antena) padre.add(en(cil(0.01, 0.42, M.acero), x + ancho * 0.35, alto, z - fondo * 0.3));
    }

    // ---------- 1 · las centrales: filas de paneles, inversores y estaciones con su transformador de bloque
    const campo = unidad('campo');
    const inversores = unidad('inversores');
    const filas = [];
    for (const [nombre, c] of Object.entries(CAMPOS)) {
        c.filas.forEach((z, i) => {
            const g = new THREE.Group();
            const largo = c.x[1] - c.x[0];
            const xm = (c.x[0] + c.x[1]) / 2;
            const pan = new THREE.BoxGeometry(largo, 0.018, 0.34);
            pan.rotateX(-0.42);
            pan.translate(xm, 0.3, z);
            const marcoP = new THREE.BoxGeometry(largo + 0.02, 0.01, 0.012);
            marcoP.translate(xm, 0.23, z + 0.15);
            const patas = [];
            for (let k = 0; k <= Math.round(largo / 0.6); k++) patas.push(new THREE.BoxGeometry(0.025, 0.28, 0.025).translate(c.x[0] + (k * largo) / Math.round(largo / 0.6), 0.14, z));
            g.add(malla([pan], M.panel), malla([marcoP, ...patas], M.marcoPanel));
            campo.add(g);
            filas.push(g);
            // los inversores de cadena, colgados de las patas cada cierto trecho
            const inv = [];
            for (let k = 1; k < Math.round(largo / 0.9); k++) inv.push(new THREE.BoxGeometry(0.07, 0.09, 0.035).translate(c.x[0] + k * 0.9, 0.11, z + 0.03));
            const gi = malla(inv, M.gabinete);
            inversores.add(gi);
            const orden = nombre === 'proteus' ? i : i + 7;
            obra(g, 0.08 + orden * 0.045, 0.16 + orden * 0.045);
            obra(gi, 0.2 + orden * 0.035, 0.26 + orden * 0.035);
        });
    }
    obra(plano(raiz, 'Proteus Solar', (CAMPOS.proteus.x[0] + CAMPOS.proteus.x[1]) / 2, CAMPOS.proteus.filas.at(-1) + 0.4, 1.7), 0.1, 0.11);
    obra(plano(raiz, 'Tampico Solar', (CAMPOS.tampico.x[0] + CAMPOS.tampico.x[1]) / 2, CAMPOS.tampico.filas.at(-1) + 0.36, 1.6), 0.4, 0.41);
    ESTACIONES.forEach(([x, z], i) => {
        const g = new THREE.Group();
        g.add(en(caja(0.5, 0.03, 0.36, M.concreto), x, 0, z));
        g.add(en(caja(0.26, 0.26, 0.24, M.trafo), x - 0.06, 0.03, z));
        const rad = [];
        for (let k = 0; k < 4; k++) rad.push(new THREE.BoxGeometry(0.018, 0.2, 0.08).translate(x - 0.16 + k * 0.066, 0.15, z + 0.16));
        g.add(malla(rad, M.trafo));
        g.add(en(caja(0.14, 0.3, 0.22, M.gabinete), x + 0.16, 0.03, z));
        inversores.add(g);
        obra(g, 0.3 + i * 0.03, 0.4 + i * 0.03);
    });
    // antes de la obra: estacas donde irá la central
    const estacas = new THREE.Group();
    {
        const e = [];
        for (const [x, z] of [[-7.7, -0.4], [-3.95, -0.4], [-7.7, 3.3], [-3.95, 3.3], [-7.7, -3.65], [-4.9, -3.65], [-7.7, -2.35], [-4.9, -2.35]]) e.push(new THREE.BoxGeometry(0.03, 0.22, 0.03).translate(x, 0.11, z));
        estacas.add(malla(e, M.estaca));
        plano(estacas, 'Aquí irán las centrales', -5.8, 1.4, 2.4);
        raiz.add(estacas);
    }

    // ---------- 2 · la subestación elevadora
    const colectora = unidad('colectora');
    {
        const [x, z] = SITIO.celdas;
        const g = new THREE.Group();
        g.add(en(caja(0.5, 0.45, 1.0, M.gabinete), x, 0, z));
        const lineas = [];
        for (let k = 1; k < 5; k++) lineas.push(new THREE.BoxGeometry(0.505, 0.4, 0.006).translate(x, 0.22, z - 0.5 + k * 0.2));
        g.add(malla(lineas, M.grafito));
        g.add(en(caja(0.18, 0.05, 0.006, M.pantalla), x + 0.05, 0.36, z + 0.503));
        colectora.add(g);
        obra(g, 0.14, 0.24);
        obra(plano(raiz, 'Celdas de 34.5 kV', x - 0.05, z + 0.78, 1.0), 0.2, 0.21);
    }
    const reactivos = unidad('reactivos');
    {
        const [x, z] = SITIO.banco;
        const g = new THREE.Group();
        g.add(en(caja(0.7, 0.03, 0.62, M.concreto), x, 0, z));
        const marco = [];
        for (const dx of [-0.28, 0.28]) for (const dz of [-0.24, 0.24]) marco.push(new THREE.BoxGeometry(0.03, 0.5, 0.03).translate(x + dx, 0.28, z + dz));
        for (const y of [0.22, 0.42]) marco.push(new THREE.BoxGeometry(0.6, 0.02, 0.52).translate(x, y, z));
        g.add(malla(marco, M.acero));
        const latas = [];
        const boq = [];
        for (const y of [0.23, 0.43]) for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) {
            latas.push(new THREE.BoxGeometry(0.07, 0.11, 0.1).translate(x - 0.22 + i * 0.11, y + 0.065, z - 0.14 + j * 0.14));
            boq.push(new THREE.CylinderGeometry(0.008, 0.01, 0.04, 6).translate(x - 0.22 + i * 0.11, y + 0.14, z - 0.14 + j * 0.14));
        }
        g.add(malla(latas, M.capacitor), malla(boq, M.porcelana));
        // la caja donde llega el cable, del lado de las celdas
        const [bx, by, bz] = BORNES.banco;
        g.add(en(caja(0.12, by + 0.04, 0.04, M.gabinete), bx, 0, bz - 0.02));
        reactivos.add(g);
        obra(g, 0.5, 0.58);
        brillo(reactivos, x, 0.5, z, 1.0, '#2f7fd1', 'banco', 0.6, false);
        obra(plano(raiz, 'Banco de capacitores', x, z + 0.52, 1.1), 0.55, 0.56);
    }
    const elevadora = unidad('elevadora');
    /** Un transformador elevador: tanque, radiadores, tanque conservador, boquillas de alta al este y caja de baja al oeste. */
    function transformador([x, z], ancho, alto, fondo, alta, sepAlta, baja) {
        const g = new THREE.Group();
        g.add(en(caja(ancho + 0.2, 0.05, fondo + 0.2, M.concreto), x, 0, z));
        g.add(en(caja(ancho, alto, fondo, M.trafo), x, 0.05, z));
        const rad = [];
        for (const s of [-1, 1]) for (let k = 0; k < 5; k++) rad.push(new THREE.BoxGeometry(0.02, alto * 0.75, 0.13).translate(x - ancho * 0.36 + (k * ancho * 0.72) / 4, 0.05 + alto * 0.45, z + s * (fondo / 2 + 0.07)));
        g.add(malla(rad, M.trafo));
        g.add(en(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, fondo * 0.7, 14).rotateX(PI / 2), M.trafo), x - ancho * 0.25, 0.05 + alto + 0.12, z));
        g.add(en(caja(0.03, 0.08, 0.03, M.trafo), x - ancho * 0.25, 0.05 + alto, z));
        const [ax, ay, az] = alta;
        const boq = [];
        for (let k = -1; k <= 1; k++) boq.push(new THREE.CylinderGeometry(0.013, 0.022, ay - (0.05 + alto), 10).translate(ax, (ay + 0.05 + alto) / 2, az + k * sepAlta));
        g.add(malla(boq, M.porcelana));
        g.add(en(caja(Math.abs(ax - x) * 2 - ancho + 0.06, 0.05, sepAlta * 2 + 0.1, M.trafo), (ax + x + ancho / 2) / 2, 0.05 + alto - 0.05, az));
        const [lx, ly, lz] = baja;
        g.add(en(caja(Math.abs(lx - x) - ancho / 2 - 0.01, 0.22, 0.22, M.trafo), (lx + 0.01 + x - ancho / 2) / 2, ly - 0.11, lz));
        elevadora.add(g);
        return g;
    }
    obra(transformador(SITIO.t1, 0.56, 0.58, 0.55, BORNES.altaT1, 0.12, BORNES.bajaT1), 0.18, 0.3);
    obra(transformador(SITIO.t2, 0.46, 0.5, 0.45, BORNES.altaT2, 0.1, BORNES.bajaT2), 0.22, 0.34);
    {
        const g = new THREE.Group();
        barras(g, BE.x, BE.fase, BE.y, BE.z);
        interruptor(g, BORNES.interruptorSalida, 'z');
        elevadora.add(g);
        obra(g, 0.26, 0.4);
        obra(plano(raiz, 'Subestación elevadora · 34.5/115 kV', -2.2, 1.68, 2.2), 0.2, 0.21);
    }
    const linea = unidad('linea');
    {
        const g = new THREE.Group();
        marco(g, MARCOS.salida, 'z', { mastil: true });
        const [qx, qy, qz] = BORNES.pieSalida;
        g.add(en(caja(0.08, qy + 0.05, 0.08, M.gabinete), qx + 0.04, 0, qz));
        linea.add(g);
        obra(g, 0.36, 0.46);
    }
    const control = unidad('control');
    {
        const g = new THREE.Group();
        casa(g, SITIO.control, 0.8, 0.6, 0.5, 'casaControl', ['control'], { antena: true });
        control.add(g);
        obra(g, 0.12, 0.22);
        obra(plano(raiz, 'Casa de control', SITIO.control[0], SITIO.control[1] + 0.48, 0.9), 0.2, 0.21);
    }

    // ---------- 3 · la línea de enlace
    const torre = geoTorre(ALTO_TORRE, 0.26);
    const torres = {};
    for (const [id, lista] of Object.entries(TORRES)) {
        torres[id] = lista.map(([x, z], i) => {
            const t = en(sombra(new THREE.Mesh(torre, M.torre)), x, 0, z);
            raiz.add(t);
            partes[{ enlace: 'linea', red1: 'red', red2: 'red', refuerzo: 'refuerzo' }[id]].push(t);
            if (id === 'enlace') obra(t, 0.42 + i * 0.05, 0.52 + i * 0.05);
            return t;
        });
    }
    obra(plano(raiz, 'Línea de enlace · 115 kV · 4.76 km', 1.25, 0.95, 2.2), 0.5, 0.51);

    // ---------- 4 · la subestación de maniobras San José Iturbide (CFE): barras, bahías, medición y casa de control
    const punto = unidad('punto');
    let bahiaRefuerzo = null;
    const red = unidad('red');
    const refuerzo = unidad('refuerzo');
    const medicion = unidad('medicion');
    {
        const g = new THREE.Group();
        barras(g, BP.x, BP.fase, BP.y, BP.z);
        punto.add(g);
        obra(g, 0.2, 0.32);
        const bahias = {};
        for (const [id, [z, s]] of Object.entries(BAHIAS)) {
            const b = new THREE.Group();
            interruptor(b, BORNES[`interruptor_${id}`], 'z');
            marco(b, MARCOS[id], 'z', { mastil: id === 'central' });
            ({ central: punto, red1: red, red2: red, refuerzo }[id]).add(b);
            bahias[id] = b;
            if (id !== 'refuerzo') obra(b, id === 'central' ? 0.3 : 0.6, id === 'central' ? 0.42 : 0.7);
        }
        const [qx, qy, qz] = BORNES.pieCentral;
        punto.add(en(caja(0.08, qy + 0.05, 0.08, M.gabinete), qx, 0, qz - 0.04));
        obra(punto.children.at(-1), 0.36, 0.46);
        // la medición: tres transformadores de instrumento en la bahía de la central y el gabinete de los medidores
        const m = new THREE.Group();
        const ti = [];
        const tp = [];
        const xm = (MARCOS.central[0] + BORNES.interruptor_central[0]) / 2;
        for (let k = -1; k <= 1; k++) {
            ti.push(new THREE.BoxGeometry(0.035, 0.38, 0.035).translate(xm, 0.19, SITIO.poi[1] + k * 0.24));
            tp.push(new THREE.CylinderGeometry(0.016, 0.022, 0.24, 10).translate(xm, 0.5, SITIO.poi[1] + k * 0.24));
            tp.push(new THREE.CylinderGeometry(0.032, 0.032, 0.07, 10).translate(xm, 0.65, SITIO.poi[1] + k * 0.24));
        }
        m.add(malla(ti, M.acero), malla(tp, M.porcelana));
        const [mx, mz] = SITIO.medidor;
        m.add(en(cil(0.02, 0.4, M.acero), mx, 0, mz));
        m.add(en(caja(0.26, 0.3, 0.14, M.gabinete), mx, 0.36, mz));
        m.add(en(caja(0.14, 0.07, 0.005, M.pantallaViva), mx, 0.53, mz + 0.072));
        medicion.add(m);
        obra(m, 0.4, 0.5);
        const c = new THREE.Group();
        casa(c, SITIO.casaPoi, 0.85, 0.65, 0.5, 'casaPoi', ['punto'], { antena: true });
        punto.add(c);
        obra(c, 0.16, 0.26);
        obra(plano(raiz, 'Subestación San José Iturbide · CFE', 4.55, 1.98, 2.2), 0.2, 0.21);
        obra(plano(raiz, 'Medición', mx, mz + 0.26, 0.6), 0.45, 0.46);
        plano(raiz, 'A la red de 115 kV', 7.35, -0.05, 1.0);
        plano(raiz, 'A la red de 115 kV', TORRES.red1[0][0] + 0.55, -3.1, 1.0, PI / 2);
        bahiaRefuerzo = bahias.refuerzo;
    }
    const cenace = unidad('cenace');
    {
        const [x, z] = SITIO.cenace;
        const mat = cub('cenace', ['cenace'], { color: '#e1ddd3' });
        cenace.add(en(sombra(new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.9).translate(0, 0.45, 0), mat)), x, 0, z));
        cenace.add(en(caja(1.46, 0.05, 0.96, M.techo), x, 0.9, z));
        const pant = [];
        for (let k = 0; k < 3; k++) pant.push(new THREE.BoxGeometry(0.3, 0.2, 0.01).translate(x - 0.42 + k * 0.42, 0.55, z - 0.4));
        cenace.add(malla(pant, M.pantallaViva));
        const mesas = [];
        for (let k = 0; k < 3; k++) mesas.push(new THREE.BoxGeometry(0.34, 0.2, 0.18).translate(x - 0.42 + k * 0.42, 0.1, z - 0.1));
        cenace.add(malla(mesas, M.grafito));
        const plato = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 8, 0, PI * 2, 0, PI / 2.6), M.gabinete);
        plato.rotation.x = -0.7;
        cenace.add(en(plato, x + 0.4, 1.1, z - 0.1));
        cenace.add(en(cil(0.02, 0.2, M.acero), x + 0.4, 0.92, z - 0.1));
        const [kx, ky, kz] = BORNES.cenace;
        cenace.add(en(caja(0.04, ky + 0.06, 0.14, M.gabinete), kx - 0.02, 0, kz));
        plano(raiz, 'CENACE', x, z + 0.62, 0.8);
    }

    // ---------- 5 · el almacenamiento que hoy pide la Segunda Convocatoria
    const saee = unidad('saee');
    {
        const [x, z] = SITIO.saee;
        for (let i = 0; i < 3; i++) {
            const cx = x - 0.62 + i * 0.62;
            saee.add(en(caja(0.56, 0.28, 0.3, M.contenedor), cx, 0.02, z));
            saee.add(en(caja(0.562, 0.025, 0.004, M.guinda), cx, 0.24, z + 0.152));
        }
        const [sx, sy, sz] = BORNES.saee;
        saee.add(en(caja(0.18, sy + 0.12, 0.08, M.gabinete), sx, 0, sz - 0.04));
        saee.add(en(caja(0.24, 0.32, 0.24, M.gabinete), x + 0.95, 0, z));
        plano(saee, 'Almacenamiento · 30 % por 3 horas', x, z + 0.42, 1.8);
    }

    // ---------- los conductores (cada línea por separado, para poder mostrarla u ocultarla) y lo que corre por ellos
    const PARTE_LINEA = { subeT1: 'elevadora', subeT2: 'elevadora', salida: 'elevadora', enlace: 'linea', fibra: 'linea', bahiaCentral: 'punto', bahiaRed1: 'red', red1: 'red', bahiaRed2: 'red', red2: 'red', vieja: 'red', bahiaRefuerzo: 'refuerzo', refuerzo: 'refuerzo' };
    const conductores = {};
    for (const L of LINEAS.filter(l => l.apoyos)) conductores[L.id] = crearLineasAereas({ raiz, lineas: [L], partes, parteDe: () => PARTE_LINEA[L.id], movil, grueso: L.id === 'fibra' ? 0.004 : 0.0065 });
    const PARTE_CABLE = { banco: 'reactivos', saee: 'saee', datosPlanta: 'control', datosPoi: 'punto', datosCenace: 'cenace' };
    const tubos = crearTubos({
        raiz, lineas: LINEAS, fluidos: FLUIDOS, M, partes, movil,
        parteDe: L => PARTE_CABLE[L.id] ?? (L.id.startsWith('colectora') || L.id.startsWith('baja') ? 'colectora' : null),
        activa: (L, e) => visibleLinea(L.id, e),
    });
    /** Cuándo existe cada línea: las de la central y la subestación nueva, ya construidas; la vieja, antes del entronque. */
    function visibleLinea(id, e) {
        if (id === 'vieja') return !e.entronque;
        if (['bahiaRed1', 'red1', 'bahiaRed2', 'red2'].includes(id)) return e.entronque;
        if (id === 'refuerzo' || id === 'bahiaRefuerzo') return e.refuerzo;
        if (id === 'saee') return e.saee;
        const hecha = { colectora: 0.62, baja: 0.62, sube: 0.58, salida: 0.58, enlace: 0.66, fibra: 0.68, bahiaCentral: 0.62, banco: 0.6, datos: 0.7 };
        const k = Object.keys(hecha).find(p => id.startsWith(p));
        return k ? e.obra >= hecha[k] : true;
    }

    // ---------- la falla: el arco en la línea de la red y los interruptores que abren
    const fallaP = [(MARCOS.red2[0] + TORRES.red2[0][0]) / 2, ALTO_TORRE * 0.78, BAHIAS.red2[0]];
    const rayo = (() => {
        const pts = [];
        let [x, y, z] = fallaP;
        for (let k = 0; k < 7; k++) { pts.push(new THREE.Vector3(x, y, z)); x += (k % 2 ? 0.07 : -0.06); y -= fallaP[1] / 7; z += (k % 2 ? -0.04 : 0.05); }
        pts.push(new THREE.Vector3(x, 0.02, z));
        const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05), 40, 0.012, 5), M.rayo);
        m.renderOrder = 7;
        raiz.add(m);
        return m;
    })();
    brillo(raiz, ...fallaP, 1.4, '#fff1b8', 'falla', 1.2, false);
    const abiertos = {};
    for (const [id, p] of [['red2', BORNES.interruptor_red2], ['salida', BORNES.interruptorSalida]]) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), M.abierto);
        m.position.set(p[0], p[1] + 0.1, p[2]);
        m.renderOrder = 7;
        raiz.add(m);
        abiertos[id] = m;
    }

    // ---------- brillos: el sol sobre los paneles
    brillo(campo, -5.8, 0.6, 1.4, 4.4, '#ffd27a', 'sol', 0.35, false);

    const anclas = {};
    for (const p of PARTES) { const o = new THREE.Object3D(); o.position.set(...p.ancla); raiz.add(o); anclas[p.id] = o; }

    // ---------- posar
    function posar(e) {
        const act = p => (p === 'noche' ? e.noche : p === 'siempre' ? 1 : p ? (e.activo[p] ?? 0) : 1);
        const a = sale(e.desarme * 3);
        kit.posar(e, act, { ...(e.abierta || {}) }, { apagar: a });
        tubos.posar(e, a);
        for (const { obj, desde, hasta } of obras) {
            const k = clamp01((e.obra - desde) / (hasta - desde));
            obj.visible = k > 0.002;
            obj.scale.y = Math.max(0.001, sale(k));
        }
        estacas.visible = e.obra < 0.05;
        for (const [id, mallas] of Object.entries(conductores)) {
            const v = visibleLinea(id, e);
            for (const m of mallas) m.visible = v;
        }
        for (const t of torres.refuerzo) t.visible = e.refuerzo;
        bahiaRefuerzo.visible = e.refuerzo;
        saee.visible = e.saee;
        rayo.visible = Boolean(e.falla?.enFalla) && Math.sin(e.t * 60) > -0.3;
        abiertos.red2.visible = Boolean(e.falla?.abierta || e.falla?.enFalla);
        abiertos.salida.visible = Boolean(e.falla?.sale);
        M.lampara.color.set('#9a9c9f').lerp(new THREE.Color('#ffe2ad'), e.noche);
    }
    return { raiz, posar, partes, anclas, giran, repintar: kit.repintar };
}
