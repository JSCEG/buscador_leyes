// La cogeneración, hecha con código. Sistema Búho: a la izquierda, una fábrica con su planta de cogeneración (estación de gas, turbina de
// gas, generador, caldera de recuperación con su chimenea, el vapor que va al proceso y una caldera aparte); atrás, la subestación, la
// línea a la red y el CENACE; a la derecha, un ingenio azucarero con su pila de bagazo, su caldera y su turbina de vapor. Nada está a escala.
//
//   materiales(P)     escenario(renderer, scene, M, { movil, oscuro })
//   construir(M, P, { movil, oscuro }) → { raiz, posar(e), partes, anclas, giran, repintar }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { sale } from '../planta-comun/ayudas.js';
import { caja, cil, cilX, crearAyudante, crearTubos, en, estudio, geoTorre, materialesBase, sombra, texturaGrano } from '../planta-comun/piezas.js';
import { crearLineasAereas } from '../planta-comun/conductores.js';
import { ALTO_CHIMENEA, ALTO_TORRE, BLOQUE, BORNES, DUCTO, FLUIDOS, GIRO_POSTE, LINEAS, PARTES, POSTES, RECUPERADOR, SITIO, TORRES, TURBINA, Z_TORRES } from './lugar.js';

const PI = Math.PI;
export const P_PLANTA = {
    papel: '#fafafa', noche: '#0a0e12', tinta: '#171317', marfil: '#f3f1ec', grafito: '#303137', acero: '#a7abb3', guinda: '#9b2247', rosa: '#e57a9a',
    tierraDia: '#d6d7c8', tierraNoche: '#23272c', losaDia: '#dcdcda', losaNoche: '#2c3036', suelo: '#b9a688',
};

export function materiales(P) {
    const M = materialesBase(P, FLUIDOS);
    Object.assign(M, {
        piso: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#d4cfc4', 'rgba(0,0,0,0.07)', [10, 5]), roughness: 0.95, envMapIntensity: 0.25 }),
        grava: new THREE.MeshStandardMaterial({ color: '#b8b4ab', map: texturaGrano('#bdb8ae', 'rgba(0,0,0,0.12)', [6, 3]), roughness: 1 }),
        muro: new THREE.MeshStandardMaterial({ color: '#e1ddd3', roughness: 0.8 }),
        techo: new THREE.MeshStandardMaterial({ color: '#c3c6cb', roughness: 0.55, metalness: 0.4 }),
        vidrioV: new THREE.MeshStandardMaterial({ color: '#7fa2bf', roughness: 0.15, metalness: 0.4, envMapIntensity: 1.2 }),
        gabinete: new THREE.MeshStandardMaterial({ color: '#e6e3dc', roughness: 0.5 }),
        trafo: new THREE.MeshStandardMaterial({ color: '#8b9097', roughness: 0.45, metalness: 0.55, envMapIntensity: 0.8 }),
        porcelana: new THREE.MeshStandardMaterial({ color: '#8a5a44', roughness: 0.35 }),
        tubos: new THREE.MeshStandardMaterial({ color: '#b5683c', roughness: 0.4, metalness: 0.7 }),
        tanque: new THREE.MeshStandardMaterial({ color: '#dcd9d2', roughness: 0.35, metalness: 0.4, envMapIntensity: 0.9 }),
        cania: new THREE.MeshStandardMaterial({ color: '#7d8f4a', roughness: 0.9 }),
        bagazo: new THREE.MeshStandardMaterial({ color: '#cdb071', map: texturaGrano('#d2b779', 'rgba(60,40,0,0.18)', [3, 3]), roughness: 1 }),
        tierraIng: new THREE.MeshStandardMaterial({ color: '#c8b896', roughness: 1 }),
        pantalla: new THREE.MeshBasicMaterial({ color: '#1f3a4a', toneMapped: false }),
        llama: new THREE.MeshBasicMaterial({ color: '#ff8a3c', toneMapped: false }),
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
    const ids = PARTES.map(p => p.id);
    const kit = crearAyudante(M, raiz, ids, { movil });
    const { partes, giran, unidad, mover, brillo, cub, rotular } = kit;
    const colorSuelo = oscuro ? '#f2efe8' : P.tinta;
    const plano = (padre, texto, x, z, ancho, giro = 0, y = 0.012) => { const r = rotular(padre, texto, x, y, z, colorSuelo, ancho); r.rotation.set(-PI / 2, 0, giro); return r; };
    const malla = (geos, m) => sombra(new THREE.Mesh(mergeGeometries(geos), m));
    const losa = (geo, m, x, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, 0, z); o.receiveShadow = true; raiz.add(o); return o; };

    // ---------- el suelo
    losa(new THREE.BoxGeometry(X1 - X0, -Y0, Z1 - Z0).translate(0, Y0 / 2, 0), M.piso, 0, (Z0 + Z1) / 2);
    losa(new THREE.BoxGeometry(5.6, 0.02, 2.0).translate(0, 0.01, 0), M.grava, -4.8, 0.5);

    // ---------- 1 · la estación de gas: regula la presión y mide lo que entra
    const gas = unidad('gas');
    {
        const [x, z] = SITIO.gas;
        gas.add(en(caja(0.7, 0.04, 0.6, M.concreto), x, 0, z));
        for (const dz of [-0.15, 0.15]) gas.add(en(cilX(0.06, 0.6, M.fluido.gas), x, 0.22, z + dz));
        for (const dx of [-0.15, 0.12]) gas.add(en(caja(0.12, 0.22, 0.42, M.gabinete), x + dx, 0.04, z));
        gas.add(en(caja(0.16, 0.26, 0.12, M.gabinete), x + 0.25, 0.04, z - 0.25));
        gas.add(en(caja(0.08, 0.04, 0.005, M.pantalla), x + 0.25, 0.22, z - 0.187));
        plano(raiz, 'Gas natural', x, z + 0.55, 0.9);
    }

    // ---------- 2 · la turbina de gas, en su caseta, y el generador
    const turbina = unidad('turbina');
    const generador = unidad('generador');
    const ejeY = 0.38;
    {
        const [x, z] = SITIO.turbina;
        const { largo, ancho, alto } = TURBINA;
        turbina.add(en(caja(largo + 0.1, 0.06, ancho + 0.1, M.concreto), x, 0, z));
        const caseta = sombra(new THREE.Mesh(new THREE.BoxGeometry(largo, alto, ancho).translate(0, alto / 2 + 0.06, 0), cub('caseta', ['turbina', 'generador'], { color: '#efede8', metal: 0.15 })));
        caseta.position.set(x, 0, z);
        turbina.add(mover(caseta, [0, 1.2, 0]));
        turbina.add(mover(en(caja(largo + 0.02, 0.03, 0.006, M.guinda), x, alto * 0.82, z + ancho / 2 + 0.003), [0, 1.2, 0]));
        // adentro: compresor, cámara de combustión y turbina en un solo eje
        const rotor = new THREE.Group();
        rotor.position.set(x, ejeY, z);
        const perfil = [[-0.75, 0.08], [-0.75, 0.2], [-0.15, 0.12], [0.0, 0.17], [0.15, 0.14], [0.7, 0.24], [0.7, 0.08]];
        const lathe = new THREE.LatheGeometry(perfil.map(([px, r]) => new THREE.Vector2(r, px)), 24).rotateZ(-PI / 2);
        rotor.add(sombra(new THREE.Mesh(lathe, M.acero)));
        for (let i = 0; i < 6; i++) rotor.add(en(new THREE.Mesh(new THREE.TorusGeometry(0.15 - i * 0.005, 0.012, 6, 20).rotateY(PI / 2), M.grafito), -0.62 + i * 0.09, 0, 0));
        turbina.add(rotor);
        giran.push({ obj: rotor, eje: 'x', vel: e => 2 + 16 * (e.activo.turbina ?? 0) });
        brillo(turbina, x + 0.02, ejeY, z, 0.9, '#ff8a3c', 'turbina', 0.7, false);
        // la entrada de aire con sus filtros
        turbina.add(en(caja(0.35, 0.5, ancho + 0.1, M.gabinete), x - largo / 2 - 0.05, alto * 0.55, z));
        plano(raiz, 'Turbina de gas', x, z + 0.6, 1.1);
        const [gx2, gz2] = SITIO.generador;
        generador.add(en(caja(0.7, ejeY - 0.18, 0.5, M.concreto), gx2, 0, gz2));
        const est = cilX(0.24, 0.62, cub('estator', ['generador'], { color: '#efede8', metal: 0.2 }), 32);
        est.position.set(gx2, ejeY, gz2);
        generador.add(mover(est, [0, 0.9, 0]));
        const rg = new THREE.Group();
        rg.position.set(gx2, ejeY, gz2);
        rg.add(cilX(0.08, 0.66, M.acero));
        for (let i = 0; i < 2; i++) rg.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.06, 0.12), M.cobre), 0, i ? -0.12 : 0.12, 0));
        generador.add(rg);
        giran.push({ obj: rg, eje: 'x', vel: e => 2 + 16 * (e.activo.turbina ?? 0) });
        brillo(generador, gx2, ejeY, gz2 + 0.3, 0.7, FLUIDOS.elec.color, 'generador', 0.5, false);
        plano(raiz, 'Generador', gx2, gz2 + 0.55, 0.8);
        // la caja de bornes del generador y el ducto de barras que lleva la electricidad al transformador (no es un cable que cuelga)
        const [dx, , dz] = DUCTO.generador;
        const dzT = DUCTO.trafo[2];
        generador.add(en(caja(0.22, 0.34, 0.1, M.gabinete), dx, 0, dz));
        const ducto = [
            new THREE.BoxGeometry(0.12, DUCTO.alto + 0.05 - 0.34, 0.1).translate(dx, (0.34 + DUCTO.alto + 0.05) / 2, dz),
            new THREE.BoxGeometry(0.12, 0.1, dz - dzT + 0.1).translate(dx, DUCTO.alto, (dz + dzT) / 2),
        ];
        // un soporte a medio camino
        ducto.push(new THREE.BoxGeometry(0.04, DUCTO.alto - 0.05, 0.04).translate(dx, (DUCTO.alto - 0.05) / 2, (dz + dzT) / 2));
        generador.add(malla(ducto, M.acero));
    }

    // ---------- 3 · la caldera de recuperación y la chimenea
    const recuperador = unidad('recuperador');
    const chimenea = unidad('chimenea');
    {
        const [x, z] = SITIO.recuperador;
        const { largo, ancho, alto } = RECUPERADOR;
        // ducto de escape que sube de la turbina a la caldera
        const [tx, tz] = SITIO.turbina;
        recuperador.add(en(caja(x - largo / 2 - (tx + TURBINA.largo / 2), 0.5, 0.5, M.acero), (x - largo / 2 + tx + TURBINA.largo / 2) / 2, 0.15, tz));
        const cuerpo = sombra(new THREE.Mesh(new THREE.BoxGeometry(largo, alto, ancho).translate(0, alto / 2, 0), cub('caldera', ['recuperador'], { color: '#e9e6df', metal: 0.25 })));
        cuerpo.position.set(x, 0, z);
        recuperador.add(mover(cuerpo, [0, 0, 1.4]));
        // adentro: los haces de tubos donde el agua se vuelve vapor
        const haces = [];
        for (let i = 0; i < 4; i++) for (let k = 0; k < 7; k++) haces.push(new THREE.CylinderGeometry(0.018, 0.018, alto - 0.3, 6).translate(x - largo / 2 + 0.2 + i * 0.24, alto / 2, z - ancho / 2 + 0.15 + k * 0.1));
        recuperador.add(malla(haces, M.tubos));
        // el domo de vapor arriba
        recuperador.add(en(cilX(0.12, largo * 0.8, M.tanque), x, alto + 0.12, z + 0.15));
        brillo(recuperador, x - 0.2, alto * 0.45, z, 1.6, '#ff8a3c', 'escape', 0.55, false);
        plano(raiz, 'Caldera de recuperación', x, z + 0.75, 1.5);
        const [cx2, cz2] = SITIO.chimenea;
        chimenea.add(en(cil(0.17, ALTO_CHIMENEA, M.acero, 0.15), cx2, 0, cz2));
        chimenea.add(en(cil(0.175, 0.08, M.guinda), cx2, ALTO_CHIMENEA - 0.25, cz2));
        chimenea.add(en(caja(0.35, 0.3, 0.3, M.acero), (cx2 + x + largo / 2) / 2, alto - 0.35, cz2));
        brillo(chimenea, cx2, ALTO_CHIMENEA + 0.25, cz2, 0.9, '#c9ccd1', 'chimenea', 0.55, false);
    }

    // ---------- 4 · el proceso: la fábrica que usa el vapor, y una caldera aparte
    const proceso = unidad('proceso');
    {
        const [x, z] = SITIO.proceso;
        proceso.add(en(caja(2.0, 0.9, 1.3, cub('fabrica', ['proceso'], { color: '#e1ddd3', metal: 0.02 })), x + 0.1, 0, z));
        const dientes = [];
        for (let k = 0; k < 4; k++) { const g = new THREE.BoxGeometry(0.5, 0.03, 1.32); g.rotateZ(0.5); g.translate(x - 0.6 + k * 0.5, 0.98, z); dientes.push(g); }
        proceso.add(malla(dientes, M.techo));
        // adentro: reactores calentados con vapor
        for (const dx of [-0.45, 0.1, 0.65]) {
            proceso.add(en(cil(0.2, 0.6, M.tanque), x + dx, 0.02, z + 0.1));
            proceso.add(en(new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.02, 6, 20).rotateX(PI / 2), M.fluido.vapor), x + dx, 0.3, z + 0.1));
        }
        brillo(proceso, x, 0.5, z, 1.6, '#d64545', 'proceso', 0.4, false);
        // la caja de conexión en la pared, donde entra el cable que viene del transformador
        const [fbx, fby, fbz] = BORNES.fabrica;
        proceso.add(en(caja(0.16, 0.2, 0.08, M.gabinete), fbx, fby, fbz + 0.01));
        plano(raiz, 'Fábrica: el proceso usa el vapor', x, z + 0.95, 2.0);
    }
    const caldera = unidad('caldera');
    {
        const [x, z] = SITIO.caldera;
        caldera.add(en(caja(0.9, 0.04, 0.6, M.concreto), x, 0, z));
        const cuerpo = cilX(0.24, 0.8, M.tanque, 28);
        cuerpo.position.set(x, 0.3, z);
        caldera.add(cuerpo);
        caldera.add(en(caja(0.18, 0.32, 0.3, M.gabinete), x - 0.45, 0.04, z));
        caldera.add(en(cil(0.05, 0.55, M.acero), x + 0.3, 0.5, z));
        brillo(caldera, x - 0.3, 0.3, z, 0.8, '#ff8a3c', 'caldera', 0.8, false);
        plano(raiz, 'Caldera aparte', x, z + 0.5, 0.9);
    }

    // ---------- 5 · el transformador, la subestación, la red y el CENACE
    const trafo = unidad('trafo');
    {
        const [x, z] = SITIO.trafo;
        trafo.add(en(caja(0.7, 0.04, 0.6, M.concreto), x, 0, z));
        trafo.add(en(caja(0.44, 0.5, 0.34, M.trafo), x, 0.04, z));
        const rad = [];
        for (let k = 0; k < 6; k++) rad.push(new THREE.BoxGeometry(0.02, 0.36, 0.12).translate(x - 0.17 + k * 0.07, 0.3, z + 0.24));
        trafo.add(malla(rad, M.trafo));
        for (let k = 0; k < 3; k++) trafo.add(en(cil(0.025, 0.22, M.porcelana), x - 0.13 + k * 0.13, 0.54, z - 0.05));
        // la caja de baja tensión, donde llega el ducto del generador
        trafo.add(en(caja(0.2, 0.11, 0.1, M.trafo), x, 0.54, DUCTO.trafo[2]));
        trafo.add(en(caja(0.18, 0.26, 0.12, M.gabinete), x + 0.45, 0.04, z));
        trafo.add(en(caja(0.1, 0.06, 0.005, M.pantalla), x + 0.45, 0.2, z + 0.063));
        plano(raiz, 'Transformador y medición', x, z + 0.5, 1.4);
    }
    const subestacion = unidad('subestacion');
    {
        const [x, z] = SITIO.subestacion;
        losa(new THREE.BoxGeometry(1.8, 0.02, 1.2).translate(0, 0.01, 0), M.grava, x, z);
        const marco = [];
        for (const dx of [-0.7, 0.7]) for (const dz of [-0.4, 0.4]) marco.push(new THREE.BoxGeometry(0.05, 1.4, 0.05).translate(x + dx, 0.7, z + dz));
        for (const dz of [-0.4, 0.4]) marco.push(new THREE.BoxGeometry(1.45, 0.05, 0.05).translate(x, 1.4, z + dz));
        subestacion.add(malla(marco, M.acero));
        const barras = [];
        for (let k = 0; k < 3; k++) barras.push(new THREE.BoxGeometry(1.4, 0.018, 0.018).translate(x, 1.2, z - 0.25 + k * 0.25));
        subestacion.add(malla(barras, M.cobre));
        subestacion.add(en(caja(0.4, 0.42, 0.32, M.trafo), x, 0.02, z + 0.05));
        for (let k = 0; k < 3; k++) subestacion.add(en(cil(0.02, 0.18, M.porcelana), x - 0.12 + k * 0.12, 0.44, z));
        // el gabinete de control, donde llega el cable del CENACE
        const [gbx, , gbz] = BORNES.gabineteSubestacion;
        subestacion.add(en(caja(0.2, 0.3, 0.12, M.gabinete), gbx - 0.1, 0, gbz));
        subestacion.add(en(caja(0.08, 0.05, 0.005, M.pantalla), gbx - 0.1, 0.2, gbz + 0.063));
        plano(raiz, 'Subestación', x, z + 0.8, 1.0);
    }
    for (const xt of TORRES) {
        const t = en(sombra(new THREE.Mesh(geoTorre(ALTO_TORRE, 0.3), M.torre)), xt, 0, Z_TORRES);
        raiz.add(t);
        partes.subestacion.push(t);
    }
    // los postes que sostienen las líneas: el de esquina del transformador y el del ingenio, en la orilla
    for (const [id, [xp, zp, h]] of Object.entries(POSTES)) {
        const t = en(sombra(new THREE.Mesh(geoTorre(h, 0.16), M.torre)), xp, 0, zp);
        t.rotation.y = GIRO_POSTE[id];
        raiz.add(t);
        partes[id === 'trafo' ? 'trafo' : 'turbinaVapor'].push(t);
    }
    // los conductores: tres fases de aluminio que cuelgan entre apoyos, con sus cadenas de aisladores (planta-comun/conductores.js)
    const PARTE_LINEA = { aRed: 'trafo', barras: 'subestacion', rnt: 'subestacion', ingenioRed: 'turbinaVapor' };
    crearLineasAereas({ raiz, lineas: LINEAS, partes, parteDe: L => PARTE_LINEA[L.id], movil });
    plano(raiz, 'Red Nacional de Transmisión', (TORRES[0] + TORRES[1]) / 2, Z_TORRES + 0.45, 1.8);
    const cenace = unidad('cenace');
    {
        const [x, z] = SITIO.cenace;
        cenace.add(en(caja(1.1, 0.75, 0.8, M.muro), x, 0, z));
        cenace.add(en(caja(1.16, 0.05, 0.86, M.techo), x, 0.75, z));
        const v = [];
        for (let k = 0; k < 3; k++) for (const y of [0.2, 0.48]) v.push(new THREE.BoxGeometry(0.22, 0.16, 0.01).translate(x - 0.33 + k * 0.33, y, z + 0.405));
        cenace.add(malla(v, M.vidrioV));
        const plato = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 8, 0, PI * 2, 0, PI / 2.6), M.gabinete);
        plato.rotation.x = -0.7;
        cenace.add(en(plato, x + 0.3, 0.95, z - 0.1));
        cenace.add(en(cil(0.02, 0.16, M.acero), x + 0.3, 0.77, z - 0.1));
        // la caja de donde sale el cable de control
        const [cbx, cby, cbz] = BORNES.cenace;
        cenace.add(en(caja(0.04, 0.16, 0.14, M.gabinete), cbx - 0.02, cby - 0.08, cbz));
        plano(raiz, 'CENACE', x, z + 0.58, 0.8);
    }

    // ---------- 6 · el ingenio azucarero: caña, molinos, bagazo, caldera y turbina de vapor
    const ingenio = unidad('ingenio');
    const bagazo = unidad('bagazo');
    const turbinaVapor = unidad('turbinaVapor');
    {
        losa(new THREE.BoxGeometry(5.0, 0.02, 4.4).translate(0, 0.01, 0), M.tierraIng, 5.5, 0.7);
        const [x, z] = SITIO.ingenio;
        ingenio.add(en(caja(1.9, 0.95, 1.2, cub('ingenio', ['ingenio'], { color: '#e8e2d4', metal: 0.02 })), x, 0, z));
        ingenio.add(en(caja(1.96, 0.06, 1.26, M.techo), x, 0.95, z));
        // adentro: la fila de molinos que exprime la caña
        for (let k = 0; k < 4; k++) {
            const m = new THREE.Group();
            m.position.set(x - 0.6 + k * 0.4, 0.3, z);
            const rodillo = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 16).rotateX(PI / 2), M.grafito));
            m.add(rodillo, en(caja(0.02, 0.2, 0.31, M.acero), 0, -0.1, 0));
            ingenio.add(m);
            giran.push({ obj: m, eje: 'z', vel: e => 3 * (e.activo.zafra ?? 0) });
        }
        // el patio de caña
        const cania = [];
        for (let k = 0; k < 24; k++) { const g = new THREE.CylinderGeometry(0.015, 0.015, 0.7, 5).rotateZ(PI / 2).rotateY(((k % 5) - 2) * 0.08); g.translate(x - 1.5, 0.05 + Math.floor(k / 6) * 0.03, z + 0.5 - (k % 6) * 0.06); cania.push(g); }
        ingenio.add(malla(cania, M.cania));
        brillo(ingenio, x, 0.5, z, 1.4, '#d64545', 'zafra', 0.4, false);
        // los letreros del ingenio van sobre su piso, que está 2 cm arriba
        plano(raiz, 'Ingenio azucarero', x, z + 0.85, 1.4, 0, 0.026);
        // la pila de bagazo
        const [bx, bz] = SITIO.bagazo;
        const pila = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.55, 18).translate(0, 0.275, 0), M.bagazo);
        pila.scale.set(1, 1, 0.8);
        pila.position.set(bx, 0, bz);
        sombra(pila);
        bagazo.add(pila);
        bagazo.userData.pila = pila;
        plano(raiz, 'Bagazo', bx, bz + 0.65, 0.6);
        // la caldera de bagazo y la turbina de vapor
        const [vx, vz] = SITIO.turbinaVapor;
        turbinaVapor.add(en(caja(0.8, 1.3, 0.9, cub('calderaBagazo', ['turbinaVapor'], { color: '#e9e6df', metal: 0.2 })), vx - 0.5, 0, vz));
        turbinaVapor.add(en(cil(0.12, 2.0, M.acero, 0.1), vx - 0.75, 0, vz - 0.3));
        brillo(turbinaVapor, vx - 0.5, 0.3, vz, 1.0, '#ff8a3c', 'zafra', 0.7, false);
        turbinaVapor.add(en(caja(0.9, 0.06, 0.5, M.concreto), vx + 0.45, 0, vz));
        const tv = cilX(0.15, 0.5, M.acero, 20);
        tv.position.set(vx + 0.3, 0.3, vz);
        turbinaVapor.add(tv);
        turbinaVapor.add(en(cilX(0.16, 0.35, M.marfil, 20), vx + 0.72, 0.3, vz));
        brillo(turbinaVapor, vx + 0.5, 0.3, vz + 0.3, 0.7, FLUIDOS.elec.color, 'zafra', 0.5, false);
        // el transformador del ingenio: del generador le llegan unas barras; de sus boquillas sale la línea a la red
        const [ux, uz] = SITIO.trafoIngenio;
        turbinaVapor.add(en(caja(0.45, 0.04, 0.4, M.concreto), ux, 0, uz));
        turbinaVapor.add(en(caja(0.3, 0.36, 0.26, M.trafo), ux, 0.04, uz));
        const radI = [];
        for (let k = 0; k < 4; k++) radI.push(new THREE.BoxGeometry(0.08, 0.26, 0.02).translate(ux - 0.105 + k * 0.07, 0.2, uz - 0.15));
        turbinaVapor.add(malla(radI, M.trafo));
        for (let k = -1; k <= 1; k++) turbinaVapor.add(en(cil(0.02, 0.16, M.porcelana), ux, 0.4, uz + k * 0.09));
        const x0b = vx + 0.72 + 0.175;
        turbinaVapor.add(malla([new THREE.BoxGeometry(ux - 0.15 - x0b, 0.08, 0.1).translate((ux - 0.15 + x0b) / 2, 0.3, uz)], M.acero));
        plano(raiz, 'A la red', (ux + POSTES.ingenio[0]) / 2 + 0.15, POSTES.ingenio[1] + 0.42, 0.6, 0, 0.026);
        brillo(turbinaVapor, vx - 0.75, 2.2, vz - 0.3, 0.8, '#c9ccd1', 'zafra', 0.5, false);
        plano(raiz, 'Caldera de bagazo y turbina de vapor', vx, vz + 0.75, 2.0, 0, 0.026);
    }

    // ---------- lo que corre por los tubos y los cables
    const tubos = crearTubos({ raiz, lineas: LINEAS, fluidos: FLUIDOS, M, partes, parteDe: L => ({ gasoducto: 'gas', vapor: 'vapor', vaporCaldera: 'caldera', retorno: 'vapor', aRed: 'trafo', rnt: 'subestacion', ingenioRed: 'turbinaVapor', banda: 'bagazo', molinos: 'ingenio', vaporIngenio: 'turbinaVapor', senal: 'cenace' }[L.id] ?? null), movil });

    const anclas = {};
    for (const p of PARTES) { const o = new THREE.Object3D(); o.position.set(...p.ancla); raiz.add(o); anclas[p.id] = o; }

    // ---------- posar
    function posar(e) {
        const act = p => (p === 'noche' ? e.noche : p === 'siempre' ? 1 : p ? (e.activo[p] ?? 0) : 1);
        const a = sale(e.desarme * 3);
        const ab = { ...(e.abierta || {}) };
        kit.posar(e, act, ab, { apagar: a });
        tubos.posar(e, a);
        const pila = bagazo.userData.pila;
        if (pila) pila.scale.set(0.5 + 0.6 * (e.activo.pila ?? 0.5), 0.4 + 0.8 * (e.activo.pila ?? 0.5), 0.45 + 0.5 * (e.activo.pila ?? 0.5));
        M.lampara.color.set('#9a9c9f').lerp(new THREE.Color('#ffe2ad'), e.noche);
    }
    return { raiz, posar, partes, anclas, giran, repintar: kit.repintar };
}
