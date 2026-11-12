// Las centrales térmicas. Los equipos se modelan en Blender (blender/equipos.py → equipos.glb, con scripts/build-blender.mjs); aquí
// se les pone el piso, el mar, las torres de la red, los tubos con lo que corre por ellos, el humo y las luces. Sistema Búho.
//
//   materiales(P)     escenario(renderer, scene, M, { movil, oscuro })
//   construir(M, P, gltf, { movil, oscuro }) → { raiz, posar(e), partes, anclas, giran, repintar }
import * as THREE from 'three';
import { azar, fract, sale } from '../planta-comun/ayudas.js';
import { montarGlb } from '../planta-comun/glb.js';
import { crearAyudante, crearTubos, estudio, geoTorre, materialesBase, sombra, texturaGrano } from '../planta-comun/piezas.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ALTO_CHIMENEA, ALTO_TORRE, BLOQUE, FLUIDOS, LINEAS, MAR, PARTES, POSTES, SITIO, TORRES, Z_TORRES, colgar } from './lugar.js';

const PI = Math.PI;
export const P_PLANTA = {
    papel: '#fafafa', noche: '#0a0e12', tinta: '#171317', marfil: '#f3f1ec', grafito: '#303137', acero: '#a7abb3', guinda: '#9b2247', rosa: '#e57a9a',
    tierraDia: '#d6d7c8', tierraNoche: '#23272c', losaDia: '#dcdcda', losaNoche: '#2c3036', suelo: '#b9a688',
};

export function materiales(P) {
    const M = materialesBase(P, FLUIDOS);
    Object.assign(M, {
        piso: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#d4cfc4', 'rgba(0,0,0,0.07)', [10, 5]), roughness: 0.95, envMapIntensity: 0.25 }),
        mar: new THREE.MeshPhysicalMaterial({ color: '#4d9fd0', roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.12, transparent: true, opacity: 0.72, envMapIntensity: 1 }),
        fondoMar: new THREE.MeshStandardMaterial({ color: '#2f5f7a', roughness: 1 }),
        muro: new THREE.MeshStandardMaterial({ color: '#e1ddd3', roughness: 0.8 }),
        techo: new THREE.MeshStandardMaterial({ color: '#c3c6cb', roughness: 0.55, metalness: 0.4 }),
        vidrioV: new THREE.MeshStandardMaterial({ color: '#7fa2bf', roughness: 0.15, metalness: 0.4, envMapIntensity: 1.2 }),
        gabinete: new THREE.MeshStandardMaterial({ color: '#e6e3dc', roughness: 0.5 }),
        trafo: new THREE.MeshStandardMaterial({ color: '#8b9097', roughness: 0.45, metalness: 0.55, envMapIntensity: 0.8 }),
        porcelana: new THREE.MeshStandardMaterial({ color: '#8a5a44', roughness: 0.35 }),
        tubos: new THREE.MeshStandardMaterial({ color: '#b5683c', roughness: 0.4, metalness: 0.7 }),
        tanque: new THREE.MeshStandardMaterial({ color: '#dcd9d2', roughness: 0.35, metalness: 0.4, envMapIntensity: 0.9 }),
        carbon: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#5b5854', 'rgba(255,255,255,0.1)', [5, 2]), roughness: 0.95, envMapIntensity: 0.3 }),
        llama: new THREE.MeshBasicMaterial({ color: '#ff8a3c', toneMapped: false }),
        conductor: new THREE.MeshStandardMaterial({ color: '#7d838b', roughness: 0.38, metalness: 0.85, envMapIntensity: 1 }),
        aislador: new THREE.MeshStandardMaterial({ color: '#9fb8c4', roughness: 0.25, metalness: 0.1 }),
        bcs: new THREE.MeshStandardMaterial({ color: '#e7e2d6', roughness: 0.95, envMapIntensity: 0.25 }),
    });
    return M;
}

const [X0, X1] = BLOQUE.x;
const [Z0, Z1] = BLOQUE.z;
const Y0 = BLOQUE.y[0];
export function escenario(renderer, scene, M, { movil = false, oscuro = false } = {}) {
    const dia = { piso: new THREE.Color(oscuro ? '#c9c6c0' : '#ffffff'), mar: new THREE.Color('#4d9fd0'), bcs: new THREE.Color(oscuro ? '#bdb8ad' : '#e7e2d6') };
    const noche = { piso: new THREE.Color('#5d5b58'), mar: new THREE.Color('#1c4564'), bcs: new THREE.Color('#4f4d4a') };
    return estudio(renderer, scene, { movil, oscuro, y0: Y0, alcance: 15, alActualizar(n) { for (const k of Object.keys(dia)) M[k].color.copy(dia[k]).lerp(noche[k], n); } });
}

export function construir(M, P, gltf, { movil = false, oscuro = false } = {}) {
    const raiz = new THREE.Group();
    const kit = crearAyudante(M, raiz, PARTES.map(p => p.id), { movil });
    const { partes, brillo, rotular } = kit;
    const colorSuelo = oscuro ? '#f2efe8' : P.tinta;
    const plano = (texto, x, z, ancho, giro = 0, y = 0.012) => { const r = rotular(raiz, texto, x, y, z, colorSuelo, ancho); r.rotation.set(-PI / 2, 0, giro); return r; };
    const losa = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.receiveShadow = true; raiz.add(o); return o; };

    // ---------- el suelo, el mar y el muelle
    losa(X1 - X0, -Y0, MAR.z0 - Z0, M.piso, (X0 + X1) / 2, Y0 / 2, (Z0 + MAR.z0) / 2);
    losa(X1 - MAR.x1, -Y0, Z1 - MAR.z0, M.piso, (MAR.x1 + X1) / 2, Y0 / 2, (MAR.z0 + Z1) / 2);
    losa(MAR.x1 - MAR.x0, 0.04, Z1 - MAR.z0, M.fondoMar, (MAR.x0 + MAR.x1) / 2, Y0 + 0.02, (MAR.z0 + Z1) / 2);
    const mar = losa(MAR.x1 - MAR.x0, -Y0 - 0.1, Z1 - MAR.z0, M.mar, (MAR.x0 + MAR.x1) / 2, (Y0 - 0.1) / 2, (MAR.z0 + Z1) / 2);
    mar.renderOrder = 1;
    sombra(losa(MAR.x1 - MAR.x0, 0.06, 0.06, M.concreto, (MAR.x0 + MAR.x1) / 2, -0.02, MAR.z0 + 0.03));
    // el sistema aislado de Baja California Sur: su propio terreno, sin línea a la red nacional
    const [bx, bz] = SITIO.motores;
    losa(3.4, 0.015, 2.9, M.bcs, bx, 0.008, bz);
    plano('Sistema de Baja California Sur: no se conecta a la red nacional', bx, bz + 1.32, 3.2);

    // ---------- los equipos que vienen de Blender
    const { sincronizar } = montarGlb(gltf, kit, M, raiz, {
        movil,
        giros: {
            rotor: e => 3 + 20 * (e.activo.vapor ?? 0),
            rueda: e => 1.4 * (e.activo.patio ?? 0),
            precalentador: e => 0.5 * (e.activo.vapor ?? 0),
            turbogas: e => 3 + 26 * (e.activo.turbogas ?? 0),
            radiador: e => 1 + 9 * (e.activo.motores ?? 0),
        },
    });

    // ---------- las torres de la red y los postes que sostienen las líneas entre equipos
    const torre = geoTorre(ALTO_TORRE);
    for (const x of TORRES) {
        const t = sombra(new THREE.Mesh(torre, M.torre));
        t.position.set(x, 0, Z_TORRES);
        raiz.add(t);
        partes.subestacion.push(t);
    }
    for (const [id, [x, z, h]] of Object.entries(POSTES)) {
        const t = sombra(new THREE.Mesh(geoTorre(h, 0.16), M.torre));
        t.position.set(x, 0, z);
        raiz.add(t);
        partes[id].push(t);
    }
    // los conductores: tres fases de aluminio que cuelgan entre apoyos, con sus cadenas de aisladores en postes y torres
    const PARTE_LINEA = { aRed: 'trafo', turbogasRed: 'turbogas', rnt: 'subestacion', aislado: 'motores' };
    for (const L of LINEAS.filter(l => l.apoyos)) {
        const hilos = [];
        const cadenas = [];
        for (const k of [-1, 0, 1]) {
            const curva = new THREE.CatmullRomCurve3(colgar(L.apoyos, k).map(p => new THREE.Vector3(...p)));
            hilos.push(new THREE.TubeGeometry(curva, Math.round(curva.getLength() * 28), 0.0065, 5));
            for (const a of L.apoyos) {
                if (!a.aislador) continue;
                // la cadena de aisladores: un tramo con sus platos, colgando de la cruceta
                for (let j = 0; j < 4; j++) {
                    const g = new THREE.CylinderGeometry(0.016, 0.016, 0.008, 10);
                    g.translate(a.p[0] + k * a.fase[0], a.p[1] - 0.012 - (j * (a.aislador - 0.02)) / 3, a.p[2] + k * a.fase[2]);
                    cadenas.push(g);
                }
                const eje = new THREE.CylinderGeometry(0.004, 0.004, a.aislador, 6);
                eje.translate(a.p[0] + k * a.fase[0], a.p[1] - a.aislador / 2, a.p[2] + k * a.fase[2]);
                cadenas.push(eje);
            }
        }
        const parte = partes[PARTE_LINEA[L.id]];
        const malla = new THREE.Mesh(mergeGeometries(hilos), M.conductor);
        malla.castShadow = !movil;
        raiz.add(malla);
        parte.push(malla);
        if (cadenas.length) {
            const aisladores = new THREE.Mesh(mergeGeometries(cadenas), M.aislador);
            raiz.add(aisladores);
            parte.push(aisladores);
        }
    }
    plano('A la red de Baja California Sur', POSTES.motores[0] - 0.55, POSTES.motores[1] + 0.42, 1.3, PI / 2);

    // ---------- brillos: la flama del hogar, los escapes, las luces de la chimenea
    const [cx, cz] = SITIO.caldera;
    const caldera = kit.unidad('caldera');
    brillo(caldera, cx - 0.22, 1.05, cz, 0.9, '#ff8a3c', 'vapor', 0.7, true);
    const [hx, hz] = SITIO.chimenea;
    const chimenea = kit.unidad('chimenea');
    for (const a of [0, 2.1, 4.2]) brillo(chimenea, hx + 0.26 * Math.cos(a), ALTO_CHIMENEA - 0.05, hz + 0.26 * Math.sin(a), 0.22, '#ff3b3b', 'noche', 0.9, true);
    const [gx, gz] = SITIO.turbogas;
    const turbogas = kit.unidad('turbogas');
    for (const dz of [-0.48, 0.48]) brillo(turbogas, gx + 0.12, 0.28, gz + dz, 0.45, '#ff8a3c', 'turbogas', 0.6, true);
    const motores = kit.unidad('motores');
    for (let i = 0; i < 4; i++) brillo(motores, bx - 1.25 + 0.38 + i * 0.58, 0.3, bz + 0.12, 0.4, '#ff8a3c', 'motores', 0.5, true);

    // ---------- el humo de la chimenea, el de la turbogás y el de los motores
    const humos = [];
    const humo = (x, y, z, n, alto, ancho, proceso, color) => {
        for (let i = 0; i < (movil ? Math.ceil(n * 0.6) : n); i++) {
            const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.vaho, color, transparent: true, depthWrite: false, opacity: 0 }));
            s.renderOrder = 5;
            raiz.add(s);
            humos.push({ s, x, y, z, u: i / n, h: azar(i, x * 7 + z), alto, ancho, proceso });
        }
    };
    humo(hx, ALTO_CHIMENEA, hz, 7, 2.2, 1.3, 'humo', '#d9d6d0');
    for (const dz of [-0.48, 0.48]) humo(gx + 0.75, 1.3, gz + dz, 4, 0.9, 0.6, 'turbogas', '#e4e1db');
    for (let i = 0; i < 4; i++) humo(bx - 1.25 + 0.38 + i * 0.58, 1.6, bz + 0.4, 3, 0.7, 0.4, 'motores', '#d4d0c9');

    // ---------- los letreros del piso
    plano('Patio de carbón', SITIO.patio[0], SITIO.patio[1] + 0.95, 1.4);
    plano('Combustóleo', SITIO.combustoleo[0], SITIO.combustoleo[1] + 0.9, 1.1);
    plano('Agua de mar', SITIO.toma[0] - 1.6, MAR.z0 + 0.32, 1.1, 0, -0.04);
    plano('Sala de turbinas', SITIO.turbina[0] + 0.6, SITIO.turbina[1] + 0.68, 1.4);
    plano('Turbogás', gx, gz + 1.05, 0.9);
    plano('Subestación', SITIO.subestacion[0], SITIO.subestacion[1] + 0.8, 1.0);
    plano('CENACE', SITIO.cenace[0], SITIO.cenace[1] + 0.68, 0.7);

    // ---------- lo que corre por los tubos y los cables
    const tubos = crearTubos({
        raiz, lineas: LINEAS, fluidos: FLUIDOS, M, partes, movil,
        parteDe: L => ({ banda: 'patio', molido1: 'molinos', molido2: 'molinos', molido3: 'molinos', combustoleo: 'combustoleo', vapor: 'caldera', cruce: 'turbina', retorno: 'condensador', marEntra: 'condensador', marSale: 'condensador', gases: 'precipitador', generador: 'generador', aRed: 'trafo', turbogasRed: 'turbogas', rnt: 'subestacion', aislado: 'motores', gasoducto: 'turbogas', senal: 'cenace' }[L.id] ?? null),
    });

    const anclas = {};
    for (const p of PARTES) { const o = new THREE.Object3D(); o.position.set(...p.ancla); raiz.add(o); anclas[p.id] = o; }

    // ---------- posar
    function posar(e) {
        const act = p => (p === 'noche' ? e.noche : p === 'siempre' ? 1 : p ? (e.activo[p] ?? 0) : 1);
        const a = sale(e.desarme * 3);
        kit.posar(e, act, { ...(e.abierta || {}) }, { apagar: a });
        tubos.posar(e, a);
        sincronizar();
        const colorHumo = new THREE.Color('#d9d6d0').lerp(new THREE.Color('#6d6a66'), e.noche);
        for (const b of humos) {
            const fuerza = (e.activo[b.proceso] ?? 0) * e.encendido;
            b.s.visible = fuerza > 0.02 && a < 0.5;
            if (!b.s.visible) continue;
            const u = fract(e.t * 0.11 + b.u + b.h * 0.1);
            b.s.position.set(b.x + u * b.ancho * 0.6 + Math.sin(e.t * 0.5 + b.h * 9) * 0.05, b.y + 0.1 + u * b.alto, b.z - u * b.ancho * 0.25);
            b.s.scale.setScalar(0.25 + u * b.ancho);
            if (b.proceso === 'humo') b.s.material.color.copy(colorHumo);
            b.s.material.opacity = 0.55 * fuerza * Math.min(1, u * 5) * (1 - u);
        }
        M.lampara.color.set('#9a9c9f').lerp(new THREE.Color('#ffe2ad'), e.noche);
    }
    return { raiz, posar, partes, anclas, giran: kit.giran, repintar: kit.repintar };
}
