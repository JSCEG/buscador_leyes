// El gasoducto, hecho con código. Sistema Búho: un tramo de campo, con un corte enfrente para ver el tubo enterrado. El gas llega de la izquierda, pasa por dos estaciones
// de compresión, cruza un río y sale por la derecha hacia una central eléctrica y una ciudad. Las cubiertas se vuelven vidrio (adentro = 1) y cada equipo se separa en sus
// piezas (desarme = 1). Por dentro del tubo, el color dice la presión, y lo que corre va más junto y más lento donde hay más presión.
//
//   materiales(P)     escenario(renderer, scene, M, { movil, oscuro })
//   construir(M, P, { movil, oscuro }) → { raiz, posar(e), partes, anclas, giran, repintar }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { azar, clamp01, lerp, sale } from '../planta-comun/ayudas.js';
import { aro, caja, cil, cilX, cilZ, crearAyudante, crearTubos, en, entre, estudio, geoEntre, materialesBase, recipienteGeo, sombra } from '../planta-comun/piezas.js';
import { BLOQUE, DUCTO, ESTACIONES, FLUIDOS, HUECO_ANODOS, LINEAS, PARTES, PMOP, X_ERM, X_ESTACION, X_RIO, X_ROTURA, XV, Z_DUCTO, Z_FONDO, kmDeX, terreno, velocidad, xDeKm, yDucto } from './modelo.js';

const PI = Math.PI;
export const P_PLANTA = {
    papel: '#fafafa', noche: '#0a0e12', tinta: '#171317', marfil: '#f3f1ec', grafito: '#303137', acero: '#a7abb3', guinda: '#9b2247', rosa: '#e57a9a',
    tierraDia: '#d6d7c8', tierraNoche: '#23272c', losaDia: '#dcdcda', losaNoche: '#2c3036', suelo: '#b9a688',
};

/** Tierra del corte: granos y capas, repetidos en coordenadas del mundo. */
function texturaTierra(base, oscuro, claro, repite) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = base;
    x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 7; i++) {
        x.strokeStyle = i % 2 ? oscuro : claro;
        x.lineWidth = 1 + azar(i, 9) * 2.4;
        x.beginPath();
        const y0 = (i + 0.5) * 36;
        for (let k = 0; k <= 8; k++) { const px = (k * 256) / 8; const py = y0 + Math.sin((k / 8) * PI * 2 + i) * 5; if (k) x.lineTo(px, py); else x.moveTo(px, py); }
        x.stroke();
    }
    for (let i = 0; i < 1300; i++) {
        x.fillStyle = azar(i, 41) > 0.5 ? claro : oscuro;
        x.fillRect(azar(i, 42) * 256, azar(i, 43) * 256, 1 + azar(i, 44) * 2.4, 1 + azar(i, 45) * 1.6);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repite);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

export function materiales(P) {
    const M = materialesBase(P, FLUIDOS);
    Object.assign(M, {
        terreno: new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.96, envMapIntensity: 0.25 }),
        roca: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaTierra('#b9a688', 'rgba(70,52,30,0.16)', 'rgba(255,245,225,0.15)', [0.3, 0.42]), roughness: 0.96, envMapIntensity: 0.25, side: THREE.DoubleSide }),
        hueco: new THREE.MeshStandardMaterial({ color: '#8d7e68', roughness: 0.96, envMapIntensity: 0.25, side: THREE.DoubleSide }),
        fondoHueco: new THREE.MeshStandardMaterial({ color: '#6d6152', roughness: 1, envMapIntensity: 0.2, side: THREE.DoubleSide }),
        grava: new THREE.MeshStandardMaterial({ color: '#c9c7bf', roughness: 1, envMapIntensity: 0.25 }),
        agua: new THREE.MeshPhysicalMaterial({ color: '#4d9fd0', roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.12, transparent: true, opacity: 0.66, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1 }),
        marco: new THREE.MeshStandardMaterial({ color: P.grafito, roughness: 0.6, metalness: 0.3, envMapIntensity: 0.6 }),
        ducto: new THREE.MeshPhysicalMaterial({ color: '#dfe6ea', roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.12, transparent: true, opacity: 0.26, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 0.9 }),
        banda: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.62, depthWrite: false, toneMapped: false }),
        soldadura: new THREE.MeshStandardMaterial({ color: '#7a7d84', roughness: 0.45, metalness: 0.8 }),
        fuego: new THREE.MeshBasicMaterial({ color: '#ff7a1f', transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }),
        fuegoIn: new THREE.MeshBasicMaterial({ color: '#ffd35c', transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
        humo: new THREE.SpriteMaterial({ color: '#c9c9c9', transparent: true, opacity: 0.16, depthWrite: false }),
        chorro: new THREE.SpriteMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }),
        ventilador: new THREE.MeshStandardMaterial({ color: '#4d5057', roughness: 0.5, metalness: 0.6, side: THREE.DoubleSide }),
        rejilla: new THREE.MeshStandardMaterial({ color: '#8d919a', roughness: 0.5, metalness: 0.7, envMapIntensity: 0.8 }),
        amarillo: new THREE.MeshStandardMaterial({ color: '#d9a62c', roughness: 0.55, envMapIntensity: 0.5 }),
        azul: new THREE.MeshStandardMaterial({ color: '#2d6f9f', roughness: 0.45, metalness: 0.3, envMapIntensity: 0.6 }),
        techo: new THREE.MeshStandardMaterial({ color: '#8a4a3c', roughness: 0.85, envMapIntensity: 0.3 }),
        coladera: new THREE.MeshStandardMaterial({ color: '#b9b4a6', roughness: 0.9, envMapIntensity: 0.3 }),
        crater: new THREE.MeshStandardMaterial({ color: '#4a3f33', roughness: 1, envMapIntensity: 0.2 }),
    });
    M.humo.map = M.vaho;
    M.chorro.map = M.vaho;
    return M;
}

const [X0, X1] = BLOQUE.x;
const [Z0, Z1] = BLOQUE.z;
const Y0 = BLOQUE.y[0];
export function escenario(renderer, scene, M, { movil = false, oscuro = false } = {}) {
    const P = M.P;
    const dia = { terreno: new THREE.Color(oscuro ? '#a2a497' : P.tierraDia), losa: new THREE.Color(oscuro ? '#9a9b9a' : P.losaDia), concreto: new THREE.Color(oscuro ? '#a5a39c' : '#cfccc5'), grava: new THREE.Color(oscuro ? '#8f8d86' : '#c9c7bf'), roca: new THREE.Color(oscuro ? '#c9c5bc' : '#ffffff'), agua: new THREE.Color('#4d9fd0') };
    const noche = { terreno: new THREE.Color(P.tierraNoche), losa: new THREE.Color(P.losaNoche), concreto: new THREE.Color('#383c42'), grava: new THREE.Color('#2e3136'), roca: new THREE.Color('#6a655c'), agua: new THREE.Color('#1c4564') };
    if (oscuro) { M.torre.color.set('#8f929a'); M.marco.color.set('#7d818a'); }
    return estudio(renderer, scene, {
        movil, oscuro, y0: Y0, alcance: 15,
        alActualizar(n) {
            M.terreno.color.copy(dia.terreno).lerp(noche.terreno, n);
            M.losa.color.copy(dia.losa).lerp(noche.losa, n);
            M.concreto.color.copy(dia.concreto).lerp(noche.concreto, n);
            M.grava.color.copy(dia.grava).lerp(noche.grava, n);
            M.roca.color.copy(dia.roca).lerp(noche.roca, n);
            M.agua.color.copy(dia.agua).lerp(noche.agua, n);
        },
    });
}

function falda(arriba, m, y0 = Y0) {
    const pos = [];
    const uv = [];
    const idx = [];
    arriba.forEach(([x, y, z], i) => {
        pos.push(x, y, z, x, y0, z);
        const s = Math.abs(arriba[0][0] - arriba.at(-1)[0]) > 0.5 ? x : z;
        uv.push(s, y, s, y0);
        if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const f = new THREE.Mesh(g, m);
    f.receiveShadow = true;
    return f;
}
// Una flama: gorda abajo y delgada arriba, con el corazón más claro.
const geoFlama = (r, h) => new THREE.LatheGeometry([[0.001, 0], [r * 0.8, h * 0.1], [r, h * 0.28], [r * 0.72, h * 0.55], [r * 0.3, h * 0.82], [0.001, h]].map(([a, b]) => new THREE.Vector2(a, b)), 14);
function flama(padre, M, x, y, z, r, h) {
    const f = new THREE.Mesh(geoFlama(r, h), M.fuego);
    f.position.set(x, y, z);
    f.renderOrder = 3;
    const n = new THREE.Mesh(geoFlama(r * 0.5, h * 0.62), M.fuegoIn);
    n.position.set(x, y, z);
    n.renderOrder = 4;
    padre.add(f, n);
}

const COLOR_BAJA = new THREE.Color('#d9ebf6');
const COLOR_ALTA = new THREE.Color('#14568e');

export function construir(M, P, { movil = false, oscuro = false } = {}) {
    const raiz = new THREE.Group();
    const ids = PARTES.map(p => p.id);
    const kit = crearAyudante(M, raiz, ids, { movil });
    const { partes, giran, unidad, mover, brillo, cub, rotular } = kit;
    const colorSuelo = oscuro ? '#f2efe8' : P.tinta;
    const plano = (padre, texto, x, z, ancho, giro = 0, y = 0.03) => { const r = rotular(padre, texto, x, y, z, colorSuelo, ancho); r.rotation.set(-PI / 2, 0, giro); return r; };
    const varias = (pares, r, m, seg = 5) => sombra(new THREE.Mesh(mergeGeometries(pares.map(([a, b]) => geoEntre(a, b, r, seg))), m));
    const [XE1, XE2] = X_ESTACION;
    const YT = yDucto(-3);

    // --------- el terreno, el río y el corte de enfrente
    const puntosDucto = [];
    {
        const [nx, nz] = movil ? [120, 40] : [170, 56];
        const pos = [];
        const col = [];
        const idx = [];
        const c = new THREE.Color();
        const [cBase, cLoma, cOrilla] = [new THREE.Color('#ffffff'), new THREE.Color('#d3dcc0'), new THREE.Color('#dacfb6')];
        for (let j = 0; j <= nz; j++) {
            const z = lerp(Z0, Z1, j / nz);
            for (let i = 0; i <= nx; i++) {
                const x = lerp(X0, X1, i / nx);
                const h = terreno(x, z);
                pos.push(x, h, z);
                c.copy(cBase).lerp(cLoma, clamp01(h / 0.4) * 0.9);
                if (h < -0.05) c.lerp(cOrilla, 0.9);
                const v = 0.97 + 0.05 * azar(i * 7 + j * 131, 3);
                col.push(c.r * v, c.g * v, c.b * v);
            }
        }
        for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i; idx.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2); }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        g.setIndex(idx);
        g.computeVertexNormals();
        const malla = new THREE.Mesh(g, M.terreno);
        malla.receiveShadow = true;
        raiz.add(malla);
        const molde = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0 - 0.04, -Y0 - 0.04, Z1 - Z0 - 0.04), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
        molde.position.set((X0 + X1) / 2, Y0 / 2 - 0.02, (Z0 + Z1) / 2);
        molde.castShadow = true;
        raiz.add(molde);
        const linea = (n, f) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
        raiz.add(falda(linea(170, u => { const x = lerp(X0, X1, u); return [x, terreno(x, Z0), Z0]; }), M.roca));
        raiz.add(falda(linea(50, u => { const z = lerp(Z0, Z1, u); return [X0, terreno(X0, z), z]; }), M.roca));
        raiz.add(falda(linea(50, u => { const z = lerp(Z0, Z1, u); return [X1, terreno(X1, z), z]; }), M.roca));
        // el corte: una rebanada con un hueco por donde se ve el tubo, y otro para los ánodos
        const ALTO = 0.25;
        const fin = X_ERM + 0.26;
        const [arriba, abajo] = [[], []];
        for (let i = 0; i <= 190; i++) {
            const x = lerp(X0 + 0.04, fin, i / 190);
            arriba.push([x, yDucto(x) + ALTO]);
            abajo.push([x, yDucto(x) - ALTO]);
            puntosDucto.push(new THREE.Vector3(x, yDucto(x), Z_DUCTO));
        }
        const hueco = [...arriba, ...abajo.slice().reverse()].map(([x, y]) => new THREE.Vector2(x, y));
        const [ax0, ax1] = HUECO_ANODOS.x;
        const [ay0, ay1] = HUECO_ANODOS.y;
        const anodos = [[ax0, ay0], [ax0, ay1], [ax1, ay1], [ax1, ay0]].map(([x, y]) => new THREE.Vector2(x, y));
        const contorno = [[X0, Y0]];
        for (let i = 0; i <= 170; i++) { const x = lerp(X0, X1, i / 170); contorno.push([x, terreno(x, Z1) - 0.015]); }
        contorno.push([X1, Y0]);
        const forma = new THREE.Shape(contorno.map(([x, y]) => new THREE.Vector2(x, y)));
        forma.holes.push(new THREE.Path(hueco), new THREE.Path(anodos));
        const losa = new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: Z1 - Z_FONDO, bevelEnabled: false, steps: 1, curveSegments: 1 }).translate(0, 0, Z_FONDO), [M.roca, M.hueco]);
        losa.receiveShadow = true;
        raiz.add(losa);
        const fondo = pts => { const f = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts)), M.fondoHueco); f.position.z = Z_FONDO + 0.001; raiz.add(f); };
        fondo(hueco);
        fondo(anodos);
        // el río cruza todo el bloque, encima del tubo
        const rio = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.1, Z1 - Z0 - 0.01), M.agua);
        rio.position.set(X_RIO, -0.25, (Z0 + Z1) / 2);
        rio.renderOrder = 4;
        raiz.add(rio);
        partes.cruce.push(rio);
    }

    // --------- el tubo enterrado: su pared de vidrio, el color de la presión y lo que corre adentro
    const curva = new THREE.CatmullRomCurve3(puntosDucto, false, 'catmullrom', 0.2);
    const pared = new THREE.Mesh(new THREE.TubeGeometry(curva, movil ? 180 : 300, 0.15, 18), M.ducto);
    pared.renderOrder = 5;
    raiz.add(pared);
    partes.tubo.push(pared);
    const uniones = [];
    for (let x = X0 + 0.3; x < X_ERM; x += 0.46) uniones.push(en(new THREE.Mesh(new THREE.TorusGeometry(0.152, 0.007, 6, 28).rotateY(PI / 2), M.soldadura), x, yDucto(x), Z_DUCTO));
    uniones.forEach(u => { u.rotation.z = Math.atan2(yDucto(u.position.x + 0.02) - yDucto(u.position.x - 0.02), 0.04); raiz.add(u); });
    // la banda de color: un trozo por tramo
    const N_BANDA = movil ? 90 : 150;
    const banda = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.135, 0.135, 1, 14).rotateZ(PI / 2), M.banda, N_BANDA);
    banda.renderOrder = 3;
    banda.frustumCulled = false;
    const kmBanda = [];
    {
        const m4 = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        const dx = (X_ERM + 0.2 - X0) / N_BANDA;
        for (let i = 0; i < N_BANDA; i++) {
            const x = X0 + 0.05 + (i + 0.5) * dx;
            const a = Math.atan2(yDucto(x + dx / 2) - yDucto(x - dx / 2), dx);
            q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), a);
            m4.compose(new THREE.Vector3(x, yDucto(x), Z_DUCTO), q, new THREE.Vector3(dx * 1.02 / Math.cos(a), 1, 1));
            banda.setMatrixAt(i, m4);
            banda.setColorAt(i, COLOR_ALTA);
            kmBanda.push({ km: kmDeX(x), x });
        }
    }
    raiz.add(banda);
    partes.tubo.push(banda);
    // lo que corre: avanza con la velocidad del gas, así que va más junto donde hay más presión
    const N_GAS = movil ? 90 : 170;
    const gas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.018, 7, 5), M.particula, N_GAS);
    gas.renderOrder = 4;
    gas.frustumCulled = false;
    raiz.add(gas);
    const KM_INI = kmDeX(X0 + 0.1);
    const KM_FIN = DUCTO.km;
    const puntos = Array.from({ length: N_GAS }, (_, i) => ({ km: lerp(KM_INI, KM_FIN, i / N_GAS), dy: (azar(i, 7) - 0.5) * 0.19, dz: (azar(i, 8) - 0.5) * 0.19, vivo: 1 }));
    for (let i = 0; i < N_GAS; i++) gas.setColorAt(i, new THREE.Color('#ffffff'));

    // --------- una válvula de seccionamiento: enterrada en el tubo, y arriba su mecanismo y sus desfogues
    const ruedas = [];
    const valvula = (id, x, nombre, clave) => {
        const g = unidad(id, x, Z_DUCTO);
        const y = yDucto(x);
        const c = cub(nombre, [id], { color: '#6e7178', metal: 0.7 });
        const cuerpo = sombra(new THREE.Mesh(new THREE.SphereGeometry(0.2, 22, 14), c));
        cuerpo.position.y = y;
        g.add(cuerpo);
        g.add(en(cilX(0.175, 0.08, M.grafito, 20), -0.22, y, 0), en(cilX(0.175, 0.08, M.grafito, 20), 0.22, y, 0));
        const bola = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.02, 20).rotateZ(PI / 2), M.guinda);
        bola.position.y = y;
        bola.rotation.y = PI / 2;
        g.add(bola);
        g.add(entre([0, y + 0.18, 0], [0, 0.1, 0], 0.024, M.grafito));
        g.add(en(caja(0.56, 0.03, 0.36, M.concreto), 0, 0.0, 0));
        const op = new THREE.Group();
        op.add(en(caja(0.13, 0.12, 0.13, M.guinda), 0, 0.03, 0));
        const rueda = new THREE.Group();
        rueda.position.set(0, 0.2, 0);
        rueda.add(new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.009, 8, 24).rotateX(PI / 2), M.acero));
        for (const a of [0, PI / 2]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.01, 0.01), M.acero); b.rotation.y = a; rueda.add(b); }
        op.add(rueda);
        op.add(entre([0, 0.15, 0], [0, 0.2, 0], 0.012, M.acero));
        g.add(mover(op, [0, 0.55, 0]));
        // dos desfogues, uno a cada lado: por ahí sale el gas para vaciar el tramo
        for (const s of [-1, 1]) {
            g.add(entre([s * 0.2, 0.02, 0], [s * 0.2, 0.44, 0], 0.012, M.acero));
            g.add(entre([s * 0.2, 0.44, 0], [s * 0.26, 0.5, 0], 0.012, M.acero));
        }
        const pars = [];
        for (const [a, b] of [[-0.27, -0.17], [0.27, -0.17], [-0.27, 0.17], [0.27, 0.17]]) pars.push([[a, 0, b], [a, 0.28, b]]);
        for (const y2 of [0.12, 0.27]) pars.push([[-0.27, y2, -0.17], [0.27, y2, -0.17]], [[-0.27, y2, 0.17], [0.27, y2, 0.17]], [[-0.27, y2, -0.17], [-0.27, y2, 0.17]], [[0.27, y2, -0.17], [0.27, y2, 0.17]]);
        g.add(varias(pars, 0.005, M.marco, 4));
        ruedas.push({ rueda, bola, clave });
    };
    valvula('valvula', XV.v0, 'valvula0', 'v0');
    valvula('valvula', XV.v1, 'valvula1', 'v1');
    valvula('tubo', XV.v2, 'valvula2', 'v2');

    // --------- humo y flamas
    const humos = [];
    const humo = (x, y, z, esc = 0.42) => {
        for (let k = 0; k < 3; k++) {
            const s = new THREE.Sprite(M.humo);
            s.position.set(x, y, z);
            s.renderOrder = 6;
            raiz.add(s);
            humos.push({ s, x, y, z, fase: k / 3, esc, clave: x < 0 ? (x < XE1 + 1.5 ? 'e1' : 'e2') : 'e2' });
        }
    };

    // --------- la estación de compresión
    const estacion = (pre, xs, indice, ids2) => {
        const [parteF, parteC, parteE, parteK] = ids2;
        const clave = indice === 0 ? 'e1' : 'e2';
        const piso = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.016, 2.76), M.grava);
        piso.position.set(xs, 0.009, 1.49);
        piso.receiveShadow = true;
        raiz.add(piso);
        // la cerca
        const cerca = [];
        const [x0, x1, z0, z1] = [xs - 1.2, xs + 1.2, 0.12, 2.86];
        for (let k = 0; k <= 8; k++) { const x = lerp(x0, x1, k / 8); cerca.push([[x, 0, z0], [x, 0.2, z0]], [[x, 0, z1], [x, 0.2, z1]]); }
        for (let k = 1; k < 9; k++) { const z = lerp(z0, z1, k / 9); cerca.push([[x0, 0, z], [x0, 0.2, z]], [[x1, 0, z], [x1, 0.2, z]]); }
        cerca.push([[x0, 0.2, z0], [x1, 0.2, z0]], [[x0, 0.2, z1], [x1, 0.2, z1]], [[x0, 0.2, z0], [x0, 0.2, z1]], [[x1, 0.2, z0], [x1, 0.2, z1]]);
        raiz.add(varias(cerca, 0.0045, M.marco, 4));
        plano(raiz, `Estación ${ESTACIONES[indice].nombre}`, xs, 2.74, 1.2, 0, 0.022);
        // filtros
        {
            const g = unidad(parteF, xs - 0.74, 0);
            const c = cub(`${pre}FiltroC`, [parteF], { color: '#c6c9cc', metal: 0.5 });
            for (const z of [2.25, 1.8, 1.35]) {
                const v = new THREE.Mesh(recipienteGeo(0.12, 0.62, 0.7), c);
                v.position.set(0, 0.07, z);
                sombra(v);
                g.add(mover(v, [0, 0.8, 0]));
                g.add(en(cil(0.09, 0.07, M.grafito, 0.1, 12), 0, 0, z));
                g.add(en(cil(0.105, 0.28, M.coladera, 0.105, 14), 0, 0.26, z));
                g.add(en(cil(0.108, 0.09, new THREE.MeshStandardMaterial({ color: '#7a6248', roughness: 0.4 }), 0.108, 14), 0, 0.09, z));
            }
            g.add(entre([0, 0.2, 2.42], [0, 0.2, 1.3], 0.024, M.acero));
            g.add(entre([0, 0.62, 2.3], [0, 0.62, 1.3], 0.024, M.acero));
        }
        // compresores: una turbina de gas mueve un compresor, cada par en su caseta
        for (const [i, z] of [[0, 1.86], [1, 1.2]]) {
            const g = unidad(parteC, xs, z);
            const c = cub(`${pre}Caseta`, [parteC], { color: '#a9adb3', metal: 0.4 });
            const tapa = new THREE.Group();
            tapa.add(en(caja(0.9, 0.38, 0.46, c), 0.02, 0.02, 0));
            tapa.add(en(caja(0.92, 0.02, 0.48, cub(`${pre}Techo`, [parteC], { color: '#303137', metal: 0.5 })), 0.02, 0.4, 0));
            g.add(mover(tapa, [0, 0.95, 0]));
            g.add(en(caja(0.84, 0.03, 0.4, M.grafito), 0.02, 0.02, 0));
            // el compresor
            const casco = cilX(0.1, 0.24, cub(`${pre}Casco`, [parteC], { color: '#b8bbbd', metal: 0.6 }), 18);
            g.add(en(casco, -0.26, 0.22, 0));
            const rodete = new THREE.Group();
            rodete.position.set(-0.26, 0.22, 0);
            for (let k = 0; k < 8; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.19, 0.012), M.ventilador); b.rotation.x = (k * PI) / 4; rodete.add(b); }
            rodete.visible = true;
            g.add(rodete);
            giran.push({ obj: rodete, eje: 'x', vel: e => 16 * (e.activo[clave] ?? 0) });
            // el eje y la turbina
            g.add(en(cilX(0.02, 0.3, M.acero, 10), -0.02, 0.22, 0));
            g.add(en(cilX(0.075, 0.2, M.guinda, 16), 0.08, 0.22, 0));
            g.add(en(cilX(0.09, 0.2, M.grafito, 16), 0.28, 0.22, 0));
            const fl = new THREE.Mesh(geoFlama(0.05, 0.12).rotateZ(-PI / 2), M.fuego);
            fl.position.set(0.16, 0.22, 0.08);
            fl.renderOrder = 3;
            g.add(fl);
            brillo(g, 0.16, 0.22, 0.24, 0.5, '#ff8a2a', clave, 0.4);
            // toma de aire y chimenea
            g.add(mover(en(caja(0.26, 0.12, 0.3, cub(`${pre}Toma`, [parteC], { color: '#8d919a', metal: 0.7 })), -0.08, 0.42, 0), [0, 1.15, 0]));
            const chim = new THREE.Group();
            chim.add(en(cil(0.06, 0.92, M.grafito, 0.05, 14), 0.5, 0.05, 0));
            chim.add(en(aro(0.058, 0.009, M.guinda), 0.5, 0.88, 0));
            g.add(mover(chim, [0, 0.4, 0]));
            humo(xs + 0.5, 1.04, z, 0.34);
            void i;
        }
        // enfriadores de aire
        {
            const g = unidad(parteE, xs + 0.89, 1.59);
            const pars = [];
            for (const [a, b] of [[-0.24, -0.62], [0.24, -0.62], [-0.24, 0], [0.24, 0], [-0.24, 0.62], [0.24, 0.62]]) pars.push([[a, 0, b], [a, 0.42, b]]);
            g.add(varias(pars, 0.012, M.marco, 4));
            const banco = new THREE.Group();
            banco.add(en(caja(0.52, 0.05, 1.32, M.rejilla), 0, 0.4, 0));
            banco.add(en(caja(0.54, 0.02, 1.34, M.grafito), 0, 0.46, 0));
            const n = 3;
            for (let k = 0; k < n; k++) {
                const zz = -0.42 + k * 0.42;
                const v = new THREE.Group();
                v.position.set(0, 0.5, zz);
                for (let b = 0; b < 4; b++) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.005, 0.04).translate(0.1, 0, 0), M.ventilador); a.rotation.y = (b * PI) / 2; v.add(a); }
                banco.add(v);
                banco.add(en(aro(0.21, 0.01, M.acero), 0, 0.5, zz));
                giran.push({ obj: v, eje: 'y', vel: e => 7 * (e.activo[clave] ?? 0) });
            }
            g.add(mover(banco, [0, 0.8, 0]));
        }
        // control, generador y gas para las turbinas
        {
            const g = unidad(parteK, xs, 0);
            const cuarto = new THREE.Group();
            cuarto.add(en(caja(0.72, 0.28, 0.4, M.marfil), -0.55, 0.012, 0.47));
            cuarto.add(en(caja(0.76, 0.024, 0.44, M.grafito), -0.55, 0.29, 0.47));
            for (let k = 0; k < 4; k++) cuarto.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.006), M.ventana), -0.8 + k * 0.17, 0.17, 0.268));
            g.add(mover(cuarto, [0, 0.6, 0]));
            // la antena lleva los datos al centro de control
            g.add(entre([-1.02, 0, 0.45], [-1.02, 1.02, 0.45], 0.011, M.marco));
            for (const [a, b] of [[-0.05, 0.05], [0.05, 0.05], [0, -0.06]]) g.add(entre([-1.02 + a, 0, 0.45 + b], [-1.02, 0.5, 0.45], 0.005, M.marco));
            const plato = new THREE.Group();
            plato.add(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.05, 0.05, 20), M.rejilla));
            plato.add(entre([0, 0, 0], [0, 0.13, 0], 0.005, M.marco));
            plato.position.set(-1.02, 0.96, 0.5);
            plato.rotation.x = 1.0;
            g.add(plato);
            g.add(en(caja(0.24, 0.16, 0.24, M.amarillo), 0.42, 0.012, 0.52));
        }
        // un letrero de luz para la noche
        brillo(raiz, xs - 0.55, 0.52, 0.48, 0.36, '#ffcf8f', 'noche', 0.5);
        brillo(raiz, xs + 0.9, 0.7, 2.4, 0.3, '#ffcf8f', 'noche', 0.4);
        // las válvulas de entrada y de salida
        for (const dx of [-1.02, 1.02]) {
            const u = unidad(parteF === parteC ? parteF : parteC, xs + dx, 2.62);
            u.add(en(new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.007, 6, 18).rotateX(PI / 2), M.guinda), 0, 0.3, 0));
            u.add(entre([0, 0.2, 0], [0, 0.3, 0], 0.008, M.acero));
        }
    };
    estacion('e1', XE1, 0, ['filtros', 'compresor', 'enfriador', 'control']);
    estacion('e2', XE2, 1, ['estacion2', 'estacion2', 'estacion2', 'estacion2']);

    // --------- la llegada: medición y trampa de diablos
    {
        const g = unidad('llegada', 0, 0);
        g.add(en(cilZ(0.06, 0.04, M.grafito, 16), X0 + 0.07, YT, Z_DUCTO));
        g.add(en(caja(0.34, 0.26, 0.36, M.azul), -7.29, 0.07, 2.36));
        g.add(en(caja(0.36, 0.015, 0.38, M.grafito), -7.29, 0.33, 2.36));
        g.add(en(caja(0.5, 0.012, 0.6, M.concreto), -7.29, 0.004, 2.36));
        plano(raiz, 'Gas que viene de Texas', -7.45, 3.12, 1.7, 0, 0.012);
        const d = unidad('diablos', 0, 0);
        const barril = cilX(0.082, 0.82, cub('barril', ['diablos'], { color: '#a6abb2', metal: 0.6 }), 22);
        barril.position.set(-6.68, 0.24, 2.36);
        d.add(mover(barril, [0, 0.62, 0]));
        const puerta = en(cilX(0.1, 0.03, M.guinda, 22), -7.1, 0.24, 2.36);
        d.add(puerta);
        for (const x of [-6.95, -6.42]) d.add(en(caja(0.06, 0.15, 0.16, M.concreto), x, 0.0, 2.36));
        d.add(entre([-6.95, 0.33, 2.36], [-6.95, 0.42, 2.36], 0.016, M.acero), entre([-6.95, 0.42, 2.36], [-6.3, 0.42, 2.36], 0.016, M.acero), entre([-6.3, 0.42, 2.36], [-6.3, 0.24, 2.36], 0.016, M.acero));
        d.add(en(new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.007, 6, 16).rotateX(PI / 2), M.guinda), -6.6, 0.45, 2.36));
        const diablo = new THREE.Group();
        diablo.add(cilX(0.05, 0.22, M.grafito, 14));
        for (const s of [-0.1, 0.1]) diablo.add(en(cilX(0.072, 0.03, M.guinda, 18), s, 0, 0));
        diablo.position.set(-6.7, 0.24, 2.36);
        d.add(diablo);
        kit.diabloQuieto = diablo;
    }
    // el diablo que corre por el tubo
    const pig = new THREE.Group();
    pig.add(cilX(0.105, 0.26, M.grafito, 16));
    for (const s of [-0.12, 0.12]) pig.add(en(cilX(0.135, 0.035, M.guinda, 20), s, 0, 0));
    pig.visible = false;
    raiz.add(pig);

    // --------- protección catódica: un rectificador y sus ánodos enterrados
    {
        const g = unidad('catodica', 0, 0);
        const [ax0, ax1] = HUECO_ANODOS.x;
        const [ay0, ay1] = HUECO_ANODOS.y;
        for (let k = 0; k < 3; k++) { const x = lerp(ax0 + 0.08, ax1 - 0.08, k / 2); g.add(en(cil(0.028, ay1 - ay0 - 0.14, M.grafito, 0.028, 10), x, ay0 + 0.04, Z_FONDO + 0.12)); }
        g.add(entre([ax0 + 0.08, ay1 - 0.09, Z_FONDO + 0.12], [ax1 - 0.08, ay1 - 0.09, Z_FONDO + 0.12], 0.012, M.cobre));
        g.add(entre([(ax0 + ax1) / 2, ay1 - 0.09, Z_FONDO + 0.12], [(ax0 + ax1) / 2, ay1, Z_FONDO + 0.12], 0.012, M.cobre));
        const x = 2.36;
        const y0 = yDucto(x);
        g.add(entre([x, y0 + 0.15, Z_DUCTO], [x, y0 + 0.25, Z_DUCTO], 0.012, M.cobre));
        g.add(en(caja(0.22, 0.3, 0.14, M.rejilla), x, 0.14, 2.72));
        g.add(en(caja(0.24, 0.016, 0.16, M.grafito), x, 0.44, 2.72));
        g.add(entre([x - 0.07, 0, 2.72], [x - 0.07, 0.14, 2.72], 0.012, M.marco), entre([x + 0.07, 0, 2.72], [x + 0.07, 0.14, 2.72], 0.012, M.marco));
        g.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.004), M.ventana), x, 0.3, 2.794));
    }

    // --------- señales a lo largo de la franja
    {
        const m = [];
        const lista = [-6.72, -5.0, -2.3, -0.2, 1.9, 3.7, 4.5];
        for (const x of lista) m.push(geoEntre([x, 0, 3.27], [x, 0.26, 3.27], 0.009, 5));
        partes.tubo.push(raiz.add(sombra(new THREE.Mesh(mergeGeometries(m), M.amarillo))).children.at(-1));
        for (const x of lista) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.07, 0.006), M.amarillo); p.position.set(x, 0.24, 3.277); raiz.add(p); }
    }
    plano(raiz, 'Río', X_RIO, 1.2, 0.4, 0, -0.195);
    for (const [km, nombre] of [[0, 'km 0'], [150, 'km 150'], [300, 'km 300'], [447, 'km 447']]) {
        const l = rotular(raiz, nombre, xDeKm(km) + (km === 447 ? -0.32 : 0), -1.14, Z1 + 0.006, P.tinta, 1.0);
        l.renderOrder = 3;
    }

    // --------- medición, regulación, olor y las entregas
    {
        const x0 = X_ERM;
        const piso = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.016, 2.32), M.grava);
        piso.position.set(x0 + 1.2, 0.009, 1.72);
        piso.receiveShadow = true;
        raiz.add(piso);
        const cerca = [];
        const [cx0, cx1, cz0, cz1] = [x0 - 0.08, x0 + 2.5, 0.58, 2.86];
        for (let k = 0; k <= 8; k++) { const x = lerp(cx0, cx1, k / 8); cerca.push([[x, 0, cz0], [x, 0.2, cz0]], [[x, 0, cz1], [x, 0.2, cz1]]); }
        for (let k = 1; k < 7; k++) { const z = lerp(cz0, cz1, k / 7); cerca.push([[cx0, 0, z], [cx0, 0.2, z]], [[cx1, 0, z], [cx1, 0.2, z]]); }
        cerca.push([[cx0, 0.2, cz0], [cx1, 0.2, cz0]], [[cx0, 0.2, cz1], [cx1, 0.2, cz1]], [[cx0, 0.2, cz0], [cx0, 0.2, cz1]], [[cx1, 0.2, cz0], [cx1, 0.2, cz1]]);
        raiz.add(varias(cerca, 0.0045, M.marco, 4));
        const g = unidad('medicion', 0, 0);
        // filtro
        const fil = sombra(new THREE.Mesh(recipienteGeo(0.11, 0.54, 0.7), cub('filtroErm', ['medicion'], { color: '#c6c9cc', metal: 0.5 })));
        fil.position.set(x0 + 0.32, 0.05, 2.5);
        g.add(mover(fil, [0, 0.7, 0]));
        g.add(en(cil(0.095, 0.26, M.coladera, 0.095, 14), x0 + 0.32, 0.2, 2.5));
        // calentador: el gas se enfría al bajar de presión
        const cal = new THREE.Group();
        cal.add(en(cilX(0.15, 0.68, cub('calentadorC', ['medicion'], { color: '#dfe0dc' }), 22), x0 + 0.96, 0.22, 2.5));
        g.add(mover(cal, [0, 0.7, 0]));
        const serp = [];
        for (let k = 0; k < 6; k++) { const a = x0 + 0.68 + k * 0.1; serp.push([[a, 0.14, 2.5], [a, 0.3, 2.5]]); if (k < 5) serp.push([[a, k % 2 ? 0.14 : 0.3, 2.5], [a + 0.1, k % 2 ? 0.14 : 0.3, 2.5]]); }
        g.add(varias(serp, 0.009, M.cobre, 6));
        flama(g, M, x0 + 0.72, 0.1, 2.56, 0.03, 0.12);
        for (const dx of [0.72, 1.2]) g.add(en(caja(0.05, 0.1, 0.22, M.concreto), x0 + dx, 0, 2.5));
        g.add(en(cil(0.028, 0.46, M.grafito, 0.024, 10), x0 + 1.16, 0.34, 2.5));
        humo(x0 + 1.16, 0.84, 2.5, 0.2);
        // tres líneas: medidor y regulador
        for (let k = 0; k < 3; k++) {
            const x = x0 + 1.42 + k * 0.22;
            g.add(en(cilZ(0.04, 0.2, M.azul, 12), x, 0.22, 2.05));
            g.add(en(caja(0.05, 0.05, 0.06, M.grafito), x, 0.26, 2.05));
            g.add(en(cilZ(0.04, 0.09, M.acero, 12), x, 0.22, 1.45));
            g.add(entre([x, 0.26, 1.45], [x, 0.31, 1.45], 0.008, M.acero));
            g.add(en(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16), M.amarillo), x, 0.32, 1.45));
            for (const z of [2.3, 1.1]) g.add(en(caja(0.03, 0.2, 0.05, M.concreto), x, 0, z));
        }
        // odorizador
        const o = unidad('olor', 0, 0);
        o.add(en(caja(0.3, 0.012, 0.28, M.concreto), x0 + 2.24, 0.012, 1.16));
        o.add(en(cilX(0.1, 0.28, M.amarillo, 18), x0 + 2.24, 0.22, 1.16));
        for (const s of [-0.09, 0.09]) o.add(en(caja(0.03, 0.12, 0.13, M.grafito), x0 + 2.24 + s, 0.02, 1.16));
        o.add(entre([x0 + 2.24, 0.32, 1.16], [x0 + 2.24, 0.4, 1.16], 0.008, M.acero));
        o.add(en(cil(0.018, 0.015, M.guinda, 0.018, 10), x0 + 2.24, 0.4, 1.16));
        // la ciudad
        const c = unidad('entregas', 0, 0);
        c.add(en(caja(0.24, 0.2, 0.26, M.marfil), x0 + 2.42, 0.01, 1.79));
        const casas = [];
        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { casas.push([7.72 + i * 0.3 + (j % 2) * 0.05, 1.3 + j * 0.45, azar(i * 4 + j, 77)]); }
        for (const [x, z, a] of casas) {
            const h = 0.1 + a * 0.08;
            c.add(en(caja(0.2, h, 0.2, M.marfil), x, 0.005, z));
            const t = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.09, 4).rotateY(PI / 4), M.techo);
            t.position.set(x, h + 0.05, z);
            t.castShadow = true;
            c.add(t);
        }
        plano(raiz, 'Ciudad', 7.95, 1.04, 0.6, 0, 0.012);
        // la central eléctrica
        const k = unidad('entregas', 0, 0);
        k.add(en(caja(0.56, 0.42, 0.8, M.marfil), 7.0, 0.005, -1.45));
        k.add(en(caja(0.6, 0.022, 0.84, M.grafito), 7.0, 0.42, -1.45));
        k.add(en(caja(0.66, 0.62, 0.42, M.rejilla), 7.68, 0.005, -1.45));
        k.add(en(cil(0.1, 1.5, M.grafito, 0.075, 16), 8.12, 0, -1.45));
        k.add(en(aro(0.085, 0.012, M.guinda), 8.12, 1.38, -1.45));
        humo(8.12, 1.56, -1.45, 0.42);
        brillo(k, 7.0, 0.6, -1.0, 0.5, '#ffcf8f', 'noche', 0.5);
        for (let i = 0; i < 4; i++) k.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.006), M.ventana), 6.82 + i * 0.12, 0.24, -1.046));
        plano(raiz, 'Central eléctrica', 7.4, -0.74, 1.1, 0, 0.012);
    }

    // --------- árboles y luces
    {
        const lista = [[-8.1, -2.2], [-7.2, -1.9], [-6.2, -2.3], [-5.5, -1.5], [-5, 1.4], [-5.4, 0.4], [-6.5, 0.9], [-7.8, 1.0], [-6.9, -0.5], [-2.1, -2], [-3.6, -1.6], [-1.6, -1.2], [-0.2, -2.2], [1.4, -2], [0.5, -1.2], [2.5, -1.6], [2.4, 0.9], [3.6, 1.6], [4.3, 0.6], [3, -0.9], [4.2, -2], [5.4, -1.4], [5.8, -2.3], [2.8, 2.2], [4.3, 2.5], [-1.7, 1.2], [-1.8, 2.2], [-5.6, 2.5]];
        const copa = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.14, 1).scale(1.2, 0.9, 1.2).translate(0, 0.14, 0), M.hoja, lista.length);
        const m4x = new THREE.Matrix4();
        const qx = new THREE.Quaternion();
        lista.forEach(([x, z], i) => { const e2 = 0.7 + azar(i, 95) * 0.8; m4x.compose(new THREE.Vector3(x, terreno(x, z), z), qx, new THREE.Vector3(e2, e2, e2)); copa.setMatrixAt(i, m4x); });
        copa.castShadow = true;
        raiz.add(copa);
    }

    // --------- lo que corre por los tubos de arriba
    const tubos = crearTubos({ raiz, lineas: LINEAS, fluidos: FLUIDOS, M, partes, parteDe: L => L.parte ?? null, movil });
    kit.cerrarGotas(new THREE.SphereGeometry(1, 8, 6));

    // --------- la rotura
    const crater = new THREE.Mesh(new THREE.CircleGeometry(0.3, 26).rotateX(-PI / 2), M.crater);
    crater.position.set(X_ROTURA, 0.012, Z_DUCTO - 0.04);
    crater.visible = false;
    raiz.add(crater);
    const grieta = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.018, 8, 26).rotateY(PI / 2), M.guinda);
    grieta.position.set(X_ROTURA, yDucto(X_ROTURA), Z_DUCTO);
    grieta.visible = false;
    raiz.add(grieta);
    const chorros = [];
    for (let k = 0; k < 9; k++) {
        const s = new THREE.Sprite(M.chorro);
        s.renderOrder = 7;
        s.visible = false;
        raiz.add(s);
        chorros.push({ s, fase: k / 9, dx: (azar(k, 21) - 0.5) * 0.22 });
    }

    const anclas = {};
    for (const p of PARTES) {
        const o = new THREE.Object3D();
        o.position.set(...p.ancla);
        raiz.add(o);
        anclas[p.id] = o;
    }

    // ---------- posar
    let firmaBanda = '';
    const color = new THREE.Color();
    const m4 = new THREE.Matrix4();
    const q0 = new THREE.Quaternion();
    const v3 = new THREE.Vector3();
    const s3 = new THREE.Vector3();
    const zona = (km, e) => {
        const L = e.lectura;
        const P0 = L.P.pEn(Math.max(0, km));
        if (!e.F) return P0;
        const x = xDeKm(km);
        if (x > XV.v0 && x < XV.v1) return e.F.P;
        if (x <= XV.v0 && e.F.cerrada) return PMOP;
        return P0;
    };
    function posar(e) {
        const n = e.noche;
        const act = p => (p === 'noche' ? n : p === 'siempre' ? 1 : p ? (e.activo[p] ?? 0) : 1);
        const a = sale(e.desarme * 3);
        const ab = { ...(e.abierta || {}), desarmeV: sale(e.desarme * 2.2) };
        kit.posar(e, act, ab, { apagar: a });
        tubos.posar(e, a);
        const L = e.lectura;
        // el color de la presión
        const firma = `${Math.round(L.q)}|${L.on?.join() ?? ''}|${e.F ? Math.round(e.F.P * 4) : ''}|${e.F?.cerrada ?? ''}`;
        if (firma !== firmaBanda) {
            firmaBanda = firma;
            for (let i = 0; i < N_BANDA; i++) {
                const P2 = zona(kmBanda[i].km, e);
                color.copy(COLOR_BAJA).lerp(COLOR_ALTA, clamp01((P2 - 40) / (PMOP - 40)) ** 1.15);
                banda.setColorAt(i, color);
            }
            banda.instanceColor.needsUpdate = true;
        }
        // lo que corre adentro
        const VIS = 2.9 * (e.encendido ?? 1);
        const q = L.q;
        const F = e.F;
        const [kV0, kV1, kR] = [kmDeX(XV.v0), kmDeX(XV.v1), kmDeX(X_ROTURA)];
        const puente = [e.en.e1 > 0.5 ? [xDeKm(ESTACIONES[0].km) - 1.02, xDeKm(ESTACIONES[0].km) + 1.02] : null, e.en.e2 > 0.5 ? [xDeKm(ESTACIONES[1].km) - 1.02, xDeKm(ESTACIONES[1].km) + 1.02] : null].filter(Boolean);
        puntos.forEach((p, i) => {
            let vel = velocidad(q, L.P.pEn(Math.max(0, p.km))) * VIS;
            if (F) {
                if (p.km < kV0) { if (F.cerrada) vel = 0; } else if (p.km < kR) vel = F.cerrada ? 22 * clamp01(F.P / 60) : 26;
                else if (p.km < kV1) vel = F.cerrada ? -22 * clamp01(F.P / 60) : -26;
            }
            p.km += vel * e.dt;
            if (F && p.km < kR && p.km + 2 > kR && vel > 0) { p.km = F.cerrada ? kR - 0.01 : kV0 + azar(i, e.t) * 2; p.vivo = F.cerrada ? 0 : 1; }
            if (F && p.km >= kR && p.km < kR + 2 && vel < 0) { p.km = F.cerrada ? kR + 0.01 : kV1 - azar(i, e.t) * 2; p.vivo = F.cerrada ? 0 : 1; }
            if (!F) p.vivo = 1;
            if (p.km > KM_FIN) p.km = F ? kV1 + azar(i, 3) * 2 : KM_INI + (p.km - KM_FIN);
            const x = xDeKm(p.km);
            const esconder = p.vivo < 0.5 || puente.some(([x0, x1]) => x > x0 && x < x1) || q < 2 || (F && p.km > kV0 && p.km < kV1 && F.P < 4);
            v3.set(x, yDucto(x) + p.dy, Z_DUCTO + p.dz);
            s3.setScalar(esconder ? 0.0001 : 1 - a);
            m4.compose(v3, q0, s3);
            gas.setMatrixAt(i, m4);
        });
        gas.instanceMatrix.needsUpdate = true;
        // el diablo
        const corre = e.pig !== null && e.pig !== undefined;
        pig.visible = corre;
        kit.diabloQuieto.visible = !corre;
        if (corre) {
            const x = xDeKm(lerp(kmDeX(-6.02), KM_FIN, e.pig));
            pig.position.set(x, yDucto(x), Z_DUCTO);
            pig.rotation.z = Math.atan2(yDucto(x + 0.02) - yDucto(x - 0.02), 0.04);
        }
        // las válvulas: la bola gira un cuarto de vuelta para cerrar
        ruedas.forEach(r => {
            const cerrar = F && F.cerrada && r.clave !== 'v2' ? 1 : 0;
            r.cierre = (r.cierre ?? 0) + (cerrar - (r.cierre ?? 0)) * Math.min(1, e.dt * 2.5);
            r.bola.rotation.y = (PI / 2) * (1 - r.cierre);
            r.rueda.rotation.y = r.cierre * PI * 3;
        });
        // la rotura
        const fuga = F ? clamp01(F.P / 60) : 0;
        crater.visible = Boolean(F);
        grieta.visible = Boolean(F);
        M.chorro.opacity = 0.5 * fuga * (1 - a);
        chorros.forEach(c => {
            c.s.visible = Boolean(F) && fuga > 0.02;
            if (!c.s.visible) return;
            const u = (e.t * 0.8 + c.fase) % 1;
            c.s.position.set(X_ROTURA + c.dx * (0.3 + u * 2.2), 0.05 + u * (0.4 + 1.2 * fuga), Z_DUCTO - 0.05 - u * 0.1);
            c.s.scale.setScalar(0.18 + u * (0.3 + 0.55 * fuga));
        });
        // flamas y humo
        M.fuego.opacity = clamp01(0.3 + 0.6 * e.activo.corre) * (0.85 + 0.15 * Math.sin(e.t * 11));
        M.fuegoIn.opacity = M.fuego.opacity;
        M.humo.opacity = 0.16 * (1 - a) * (1 - 0.6 * n);
        humos.forEach(h => {
            const on = h.x < 4.8 ? (e.activo[h.clave] ?? 0) : 1;
            const u = (e.t * 0.16 + h.fase + h.x * 0.13) % 1;
            h.s.position.set(h.x + u * 0.4, h.y + u * 0.9, h.z - u * 0.2);
            h.s.scale.setScalar(h.esc * (0.35 + u));
            h.s.visible = a < 0.8 && on > 0.05;
        });
        M.lampara.color.set('#9a9c9f').lerp(new THREE.Color('#ffe2ad'), n);
        M.ventana.color.set('#3f4a57').lerp(new THREE.Color('#ffc77a'), n);
    }
    return { raiz, posar, partes, anclas, giran, repintar: kit.repintar };
}
