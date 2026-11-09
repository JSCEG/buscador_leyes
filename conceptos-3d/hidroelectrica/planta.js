// La central hidroeléctrica, hecha con código. Sistema Búho: una rebanada del valle de un río con dos cortes. El de enfrente pasa por la orilla derecha y deja ver
// el camino del agua: toma, tubería, casa de máquinas subterránea, galería de oscilación y desfogue. El de atrás pasa por en medio del valle y deja ver por dentro
// la cortina y el embalse. Las cubiertas se vuelven vidrio (adentro = 1) y cada equipo se separa en sus piezas (desarme = 1).
//
//   materiales(P)     escenario(renderer, scene, M, { movil, oscuro })
//   construir(M, P, { movil, oscuro }) → { raiz, posar(e), partes, anclas, giran, repintar }
import * as THREE from 'three';
import { azar, clamp01, lerp, sale } from '../planta-comun/ayudas.js';
import { aro, caja, cil, crearAyudante, crearTubos, en, entre, estudio, geoTorre, materialesBase, sombra, texturaGrano } from '../planta-comun/piezas.js';
import { BLOQUE, CAVERNA, CORTINA, EQUIPOS, FIN_VERTEDOR, FLUIDOS, GALERIA, LINEAS, LOSA, MAQUINA, NIVEL, PARTES, PUNTAS_TORRE, TORRES, TUBO, VERTEDOR, Y, YABAJO, terreno, vertedorY, vertedorZ } from './modelo.js';

const PI = Math.PI;
export const P_PLANTA = {
    papel: '#fafafa', noche: '#0a0e12', tinta: '#171317', marfil: '#f3f1ec', grafito: '#303137', acero: '#a7abb3', guinda: '#9b2247', rosa: '#e57a9a',
    tierraDia: '#d6d7c8', tierraNoche: '#23272c', losaDia: '#dcdcda', losaNoche: '#2c3036', suelo: '#b9a688',
};

/** Roca del corte: granos y capas, repetidos en coordenadas del mundo. */
function texturaRoca(base, oscuro, claro, repite) {
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
/** Enrocamiento: muchas piedras. */
function texturaPiedras(repite) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#a7a297';
    x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 560; i++) {
        const v = 148 + Math.floor(azar(i, 51) * 60);
        x.fillStyle = `rgb(${v},${v - 4},${v - 11})`;
        x.beginPath();
        x.ellipse(azar(i, 52) * 256, azar(i, 53) * 256, 3 + azar(i, 54) * 7, 2 + azar(i, 55) * 5, azar(i, 56) * 3, 0, PI * 2);
        x.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repite);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

export function materiales(P) {
    const M = materialesBase(P, FLUIDOS);
    const env = { envMapIntensity: 0.8 };
    Object.assign(M, {
        terreno: new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.96, envMapIntensity: 0.25 }),
        roca: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaRoca('#b9a688', 'rgba(70,52,30,0.16)', 'rgba(255,245,225,0.15)', [0.28, 0.42]), roughness: 0.96, envMapIntensity: 0.25, side: THREE.DoubleSide }),
        hueco: new THREE.MeshStandardMaterial({ color: '#8d7e68', roughness: 0.96, envMapIntensity: 0.25, side: THREE.DoubleSide }),
        fondoHueco: new THREE.MeshStandardMaterial({ color: '#6d6152', roughness: 1, envMapIntensity: 0.2, side: THREE.DoubleSide }),
        muro: new THREE.MeshStandardMaterial({ color: '#d3d1cb', roughness: 0.92, envMapIntensity: 0.35, side: THREE.DoubleSide }),
        piso: new THREE.MeshStandardMaterial({ color: '#b8b7b2', roughness: 0.82, envMapIntensity: 0.35 }),
        enrocado: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaPiedras([1.2, 1.2]), roughness: 1, envMapIntensity: 0.25 }),
        caraConcreto: new THREE.MeshStandardMaterial({ color: '#cfcdc6', roughness: 0.85, envMapIntensity: 0.4, side: THREE.DoubleSide }),
        agua: new THREE.MeshPhysicalMaterial({ color: '#4d9fd0', roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.12, transparent: true, opacity: 0.58, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1 }),
        aguaRio: new THREE.MeshPhysicalMaterial({ color: '#4d9fd0', roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.15, transparent: true, opacity: 0.68, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1 }),
        aguaCanal: new THREE.MeshBasicMaterial({ color: '#cfe9f7', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }),
        tuboAgua: new THREE.MeshPhysicalMaterial({ color: FLUIDOS.agua.color, roughness: 0.25, transparent: true, opacity: 0.5, clearcoat: 0.8, envMapIntensity: 0.6, depthWrite: false, side: THREE.DoubleSide }),
        rodete: new THREE.MeshStandardMaterial({ color: '#c6a35d', roughness: 0.28, metalness: 0.92, envMapIntensity: 1, side: THREE.DoubleSide }),
        rodeteAcero: new THREE.MeshStandardMaterial({ color: '#b6bac2', roughness: 0.3, metalness: 0.9, envMapIntensity: 1, side: THREE.DoubleSide }),
        nube: new THREE.MeshStandardMaterial({ color: '#eef0f2', roughness: 1, transparent: true, opacity: 0, depthWrite: false, envMapIntensity: 0.4 }),
        lluvia: new THREE.MeshBasicMaterial({ color: '#7fb6d8', transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
        linea: new THREE.MeshBasicMaterial({ color: P.guinda }),
        rocio: new THREE.SpriteMaterial({ map: null, color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
        zona2: new THREE.MeshStandardMaterial({ color: '#d9d1bd', roughness: 1, side: THREE.DoubleSide }),
        zona3a: new THREE.MeshStandardMaterial({ color: '#c0b39b', roughness: 1, side: THREE.DoubleSide }),
        zona3b: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaPiedras([0.9, 0.9]), roughness: 1, side: THREE.DoubleSide }),
        zonaT: new THREE.MeshStandardMaterial({ color: '#c9c5bd', map: texturaPiedras([0.5, 0.5]), roughness: 1, side: THREE.DoubleSide }),
        grano: texturaGrano,
        ...env && {},
    });
    M.rocio.map = M.vaho;
    return M;
}

const Y0 = BLOQUE.y[0];
export function escenario(renderer, scene, M, { movil = false, oscuro = false } = {}) {
    const P = M.P;
    const dia = { terreno: new THREE.Color(oscuro ? '#a2a497' : P.tierraDia), losa: new THREE.Color(oscuro ? '#9a9b9a' : P.losaDia), concreto: new THREE.Color(oscuro ? '#a5a39c' : '#cfccc5'), roca: new THREE.Color(oscuro ? '#c9c5bc' : '#ffffff'), agua: new THREE.Color('#4d9fd0'), muro: new THREE.Color(oscuro ? '#a7a6a0' : '#d3d1cb'), enrocado: new THREE.Color(oscuro ? '#bdbab3' : '#ffffff') };
    const noche = { terreno: new THREE.Color(P.tierraNoche), losa: new THREE.Color(P.losaNoche), concreto: new THREE.Color('#383c42'), roca: new THREE.Color('#6a655c'), agua: new THREE.Color('#1c4564'), muro: new THREE.Color('#6d6d6a'), enrocado: new THREE.Color('#57585c') };
    if (oscuro) M.torre.color.set('#8f929a');
    return estudio(renderer, scene, {
        movil, oscuro, y0: Y0, alcance: 15,
        alActualizar(n) {
            M.terreno.color.copy(dia.terreno).lerp(noche.terreno, n);
            M.losa.color.copy(dia.losa).lerp(noche.losa, n);
            M.concreto.color.copy(dia.concreto).lerp(noche.concreto, n);
            M.caraConcreto.color.copy(dia.concreto).lerp(noche.concreto, n);
            M.roca.color.copy(dia.roca).lerp(noche.roca, n);
            M.agua.color.copy(dia.agua).lerp(noche.agua, n);
            M.aguaRio.color.copy(dia.agua).lerp(noche.agua, n);
            M.muro.color.copy(dia.muro).lerp(noche.muro, n * 0.6);
            M.enrocado.color.copy(dia.enrocado).lerp(noche.enrocado, n);
            M.zona3b.color.copy(dia.enrocado).lerp(noche.enrocado, n);
        },
    });
}

/** Tubo de radio variable a lo largo de una curva: el radio sale de r(u), con u de 0 a 1. */
function tuboVar(curva, r, seg = 80, lados = 14) {
    const marcos = curva.computeFrenetFrames(seg, false);
    const pos = [];
    const idx = [];
    const p = new THREE.Vector3();
    for (let i = 0; i <= seg; i++) {
        const u = i / seg;
        curva.getPointAt(u, p);
        const rad = r(u);
        const [N, B] = [marcos.normals[i], marcos.binormals[i]];
        for (let j = 0; j < lados; j++) {
            const a = (j / lados) * PI * 2;
            const [c, s] = [Math.cos(a) * rad, Math.sin(a) * rad];
            pos.push(p.x + N.x * c + B.x * s, p.y + N.y * c + B.y * s, p.z + N.z * c + B.z * s);
        }
    }
    for (let i = 0; i < seg; i++) {
        for (let j = 0; j < lados; j++) {
            const [a, b, c, d] = [i * lados + j, i * lados + (j + 1) % lados, (i + 1) * lados + j, (i + 1) * lados + (j + 1) % lados];
            idx.push(a, c, b, b, c, d);
        }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
}
const curvaDe = (pts, tension = 0.3) => new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'catmullrom', tension);
/** Un álabe del rodete: curva de afuera hacia adentro y de arriba hacia abajo, entre la corona y la banda. */
function geoAlabe() {
    const [filas, cols] = [9, 4];
    const pos = [];
    const idx = [];
    for (let i = 0; i <= filas; i++) {
        const u = i / filas;
        const rad = lerp(0.222, 0.1, u ** 1.15);
        const th = -1.05 * u; // de la entrada a la salida va hacia atrás del giro: así el agua le deja su giro al rodete
        const arriba = lerp(0.07, 0.02, u);
        const abajo = lerp(-0.03, -0.13, u);
        for (let j = 0; j <= cols; j++) {
            const y = lerp(arriba, abajo, j / cols);
            pos.push(Math.sin(th) * rad, y, Math.cos(th) * rad);
        }
    }
    for (let i = 0; i < filas; i++) for (let j = 0; j < cols; j++) { const a = i * (cols + 1) + j; idx.push(a, a + 1, a + cols + 1, a + 1, a + cols + 2, a + cols + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
}
/** Falda: una tira vertical desde una línea de puntos hasta el fondo del bloque. */
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

export function construir(M, P, { movil = false, oscuro = false } = {}) {
    const raiz = new THREE.Group();
    const ids = PARTES.map(p => p.id);
    const kit = crearAyudante(M, raiz, ids, { movil });
    const { partes, giran, unidad, mover, brillo, cub, rotular } = kit;
    const colorTexto = oscuro ? '#f2efe8' : P.tinta;
    const colorCorte = oscuro ? '#f6f1e6' : '#2a2118';
    const [X0, X1] = BLOQUE.x;
    const [Z0, Z1] = BLOQUE.z;
    const YT = MAQUINA.y;
    const CX = MAQUINA.x;

    // --------- el terreno: una malla de alturas, y los cortes
    {
        const [nx, nz] = movil ? [126, 44] : [176, 60];
        const pos = [];
        const col = [];
        const idx = [];
        const yNAME = Y(NIVEL.NAME);
        const c = new THREE.Color();
        const [cBase, cRoca, cOrilla, cBajo] = [new THREE.Color('#ffffff'), new THREE.Color('#aaa294'), new THREE.Color('#dacfb6'), new THREE.Color('#d3dcc0')];
        for (let j = 0; j <= nz; j++) {
            const z = lerp(Z0, Z1, j / nz);
            for (let i = 0; i <= nx; i++) {
                const x = lerp(X0, X1, i / nx);
                const h = terreno(x, z);
                const sobre = z > LOSA.z - 0.05 && x > LOSA.x[0] - 0.02 && x < LOSA.x[1] + 0.02 ? 0.006 : 0;
                pos.push(x, h + sobre, z);
                const incl = Math.hypot(terreno(x + 0.05, z) - terreno(x - 0.05, z), terreno(x, z + 0.05) - terreno(x, z - 0.05)) * 10;
                c.copy(cBase).lerp(cBajo, clamp01(1 - h / 1.2) * 0.8);
                c.lerp(cRoca, clamp01((incl - 0.9) / 1.2));
                if ((x < LOSA.x[0] || z < 1.8) && x < CORTINA.xU && h < yNAME + 0.02 && h > Y(NIVEL.NAMINO) - 0.1) c.lerp(cOrilla, 0.9);
                const v = 0.97 + 0.05 * azar(i * 7 + j * 131, 3);
                col.push(c.r * v, c.g * v, c.b * v);
            }
        }
        for (let j = 0; j < nz; j++) {
            for (let i = 0; i < nx; i++) {
                const a = j * (nx + 1) + i;
                idx.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2);
            }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
        g.setIndex(idx);
        g.computeVertexNormals();
        const malla = new THREE.Mesh(g, M.terreno);
        malla.castShadow = true;
        malla.receiveShadow = true;
        raiz.add(malla);
        // los cortes de los lados y de atrás
        const linea = (n, f) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
        raiz.add(falda(linea(170, u => { const x = lerp(X0, X1, u); return [x, terreno(x, Z0), Z0]; }), M.roca));
        raiz.add(falda(linea(50, u => { const z = lerp(Z0, Z1, u); return [X0, terreno(X0, z), z]; }), M.roca));
        raiz.add(falda(linea(50, u => { const z = lerp(Z0, Z1, u); return [X1, terreno(X1, z), z]; }), M.roca));
        raiz.add(falda(linea(40, u => { const x = lerp(X0, LOSA.x[0], u); return [x, terreno(x, Z1), Z1]; }), M.roca));
        raiz.add(falda(linea(40, u => { const x = lerp(LOSA.x[1], X1, u); return [x, terreno(x, Z1), Z1]; }), M.roca));
    }

    // --------- el camino del agua, hueco en la rebanada de enfrente
    const [CX0, CX1] = CAVERNA.x;
    const [CY0, CY1] = CAVERNA.y;
    const [GX0, GX1] = GALERIA.x;
    const [GY0, GY1] = GALERIA.y;
    const lineaDe = id => LINEAS.find(l => l.id === id);
    const curvaTubo = curvaDe(lineaDe('tubo').puntos, 0.06);
    const curvaDesfogue = curvaDe(lineaDe('desfogue').puntos, 0.06);
    {
        const W = 0.21;
        const bordes = (curva, x0, x1, w) => {
            const [a, b] = [[], []];
            const t = new THREE.Vector3();
            const p = new THREE.Vector3();
            for (let i = 0; i <= 80; i++) {
                curva.getPointAt(i / 80, p);
                if (p.x < x0 || p.x > x1) continue;
                curva.getTangentAt(i / 80, t);
                a.push([p.x - t.y * w, p.y + t.x * w]);
                b.push([p.x + t.y * w, p.y - t.x * w]);
            }
            return [a, b];
        };
        const [tubArr, tubAba] = bordes(curvaTubo, -4.9, CX0 - 0.02, W);
        const [desArr, desAba] = bordes(curvaDesfogue, GX1 + 0.02, LOSA.x[1] - 0.04, W);
        const hueco = [
            [-4.9, tubArr[0][1]], ...tubArr, [CX0, tubArr.at(-1)[1]], [CX0, CY1], [1.84, CY1], [1.84, 1.86], [2.08, 1.86], [2.08, CY1], [CX1, CY1], [CX1, -0.5], [GX0, -0.5], [GX0, GY1], [GX1, GY1], [GX1, desArr[0][1]], ...desArr,
            [LOSA.x[1] - 0.04, desArr.at(-1)[1]], [LOSA.x[1] - 0.04, desAba.at(-1)[1]], ...desAba.slice().reverse(), [GX1, desAba[0][1]], [GX1, GY0], [GX0, GY0], [GX0, -1.1], [CX1, -1.12], [CX1, CY0], [CX0, CY0], [CX0, tubAba.at(-1)[1]], ...tubAba.slice().reverse(), [-4.9, tubAba[0][1]],
        ].map(([x, y]) => new THREE.Vector2(x, y));
        const contorno = [[LOSA.x[0], Y0]];
        for (let i = 0; i <= 230; i++) { const x = lerp(LOSA.x[0], LOSA.x[1], i / 230); contorno.push([x, terreno(x, Z1) - 0.02]); } // un poco abajo del terreno, para que su orilla no asome entre cuadros de la malla
        contorno.push([LOSA.x[1], Y0]);
        const forma = new THREE.Shape(contorno.map(([x, y]) => new THREE.Vector2(x, y)));
        forma.holes.push(new THREE.Path(hueco));
        const g = new THREE.ExtrudeGeometry(forma, { depth: Z1 - LOSA.z, bevelEnabled: false, steps: 1, curveSegments: 1 }).translate(0, 0, LOSA.z);
        const losa = new THREE.Mesh(g, [M.roca, M.hueco]);
        losa.receiveShadow = true;
        raiz.add(losa);
        // el fondo de cada ranura (la caverna sigue más atrás)
        const plano = (pts, m, z) => { const f = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)))), m); f.position.z = z; raiz.add(f); return f; };
        plano([[-4.9, tubArr[0][1]], ...tubArr, [CX0, tubArr.at(-1)[1]], [CX0, tubAba.at(-1)[1]], ...tubAba.slice().reverse(), [-4.9, tubAba[0][1]]], M.fondoHueco, LOSA.z + 0.001);
        plano([[1.84, CY1], [1.84, 1.86], [2.08, 1.86], [2.08, CY1]], M.fondoHueco, LOSA.z + 0.001);
        plano([[CX1, -0.5], [GX0, -0.5], [GX0, GY1], [GX1, GY1], [GX1, desArr[0][1]], ...desArr, [LOSA.x[1] - 0.04, desArr.at(-1)[1]], [LOSA.x[1] - 0.04, desAba.at(-1)[1]], ...desAba.slice().reverse(), [GX1, desAba[0][1]], [GX1, GY0], [GX0, GY0], [GX0, -1.1], [CX1, -1.12]], M.fondoHueco, LOSA.z + 0.001);
    }

    // --------- el embalse y el río
    const planta2 = (pts, y0) => {
        const f = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
        const g = new THREE.ExtrudeGeometry(f, { depth: 1, bevelEnabled: false, steps: 1 }).rotateX(-PI / 2);
        const m = new THREE.Mesh(g, M.agua);
        m.position.y = y0;
        m.renderOrder = 4;
        raiz.add(m);
        return m;
    };
    const e = 0.004;
    const yBaseLago = -0.1;
    const lago = planta2([[X0 + e, Z0 + e], [CORTINA.xU, Z0 + e], [CORTINA.xU, 1.79], [LOSA.x[0] - e, 1.79], [LOSA.x[0] - e, Z1 - e], [X0 + e, Z1 - e]], yBaseLago);
    partes.embalse.push(lago);
    const yBaseRio = -0.2;
    const rio = planta2([[2.2, Z0 + e], [X1 - e, Z0 + e], [X1 - e, Z1 - e], [LOSA.x[1] + 0.03, Z1 - e], [LOSA.x[1] + 0.03, 2.5], [2.2, 2.5]], yBaseRio);
    rio.material = M.aguaRio;
    rio.scale.y = YABAJO - yBaseRio;
    partes.desfogue.push(rio);
    // el río que llega, por su cauce
    {
        const pts = lineaDe('llega').puntos;
        const cur = curvaDe(pts, 0.2);
        const n = 40;
        const pos = [];
        const idx = [];
        const q = new THREE.Vector3();
        for (let i = 0; i <= n; i++) {
            cur.getPointAt(i / n, q);
            const w = 0.14 + 0.05 * (i / n);
            for (const s of [-1, 1]) { const z = q.z + s * w; pos.push(q.x, terreno(q.x, z) + 0.016, z); }
            if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setIndex(idx);
        g.computeVertexNormals();
        const m = new THREE.Mesh(g, M.aguaRio);
        m.renderOrder = 3;
        raiz.add(m);
        partes.cuenca.push(m);
    }
    // los niveles, marcados en el corte del agua
    {
        const u = unidad('embalse');
        const zL = Z1 + 0.003;
        for (const [nom, el] of [['NAMO, 575 m', NIVEL.NAMO], ['NAMINO, 518 m', NIVEL.NAMINO]]) {
            const y = Y(el);
            const l = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.012, 0.004), M.linea);
            l.position.set(-5.98, y, zL);
            u.add(l);
            rotular(u, nom, -6.12, y + 0.095, zL, colorCorte, 0.92);
        }
        rotular(u, 'Embalse', -5.95, Y(NIVEL.NAMINO) + 0.62, zL, colorCorte, 1.3);
    }

    // --------- la cuenca: nube y lluvia
    const nubes = new THREE.Group();
    {
        const u = unidad('cuenca');
        u.add(nubes);
        [[-7.6, 6.2, -0.8, 0.62], [-7, 6.3, -0.9, 0.78], [-6.3, 6.2, -0.7, 0.6], [-7.2, 6.1, -0.1, 0.55], [-6.5, 6.05, 0, 0.5], [-7.9, 6, -0.3, 0.42]].forEach(([x, y, z, r]) => {
            const n = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 2).scale(1.25, 0.62, 1), M.nube);
            n.position.set(x, y, z);
            n.renderOrder = 6;
            nubes.add(n);
        });
    }
    const nGotas = movil ? 46 : 90;
    const lluvia = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.006, 0.006, 0.26, 4), M.lluvia, nGotas);
    lluvia.frustumCulled = false;
    lluvia.renderOrder = 5;
    raiz.add(lluvia);
    const gotasL = Array.from({ length: nGotas }, (_, i) => ({ x: -8.3 + azar(i, 61) * 2.6, z: -1.6 + azar(i, 62) * 2.3, f: azar(i, 63), v: 0.8 + azar(i, 64) * 0.5 }));

    // --------- la cortina: enrocamiento con cara de concreto
    {
        const C = CORTINA;
        const g = unidad('cortina');
        const f = new THREE.Shape([[C.xPieU, -0.1], [C.xPieU, 0], [C.xU, C.alto], [C.xD, C.alto], [C.xPieD, 0], [C.xPieD, -0.1]].map(([x, y]) => new THREE.Vector2(x, y)));
        const largo = C.z[1] - C.z[0];
        const cuerpo = sombra(new THREE.Mesh(new THREE.ExtrudeGeometry(f, { depth: largo, bevelEnabled: false, steps: 1 }).translate(0, 0, C.z[0]), [M.zona3b, M.enrocado]));
        g.add(cuerpo);
        // la cara de concreto: losas, de arriba abajo
        const n = new THREE.Vector3(-(C.alto), C.xU - C.xPieU, 0).normalize().multiplyScalar(0.01);
        const quad = new THREE.BufferGeometry();
        quad.setAttribute('position', new THREE.Float32BufferAttribute([C.xPieU + n.x, n.y, C.z[0], C.xU + n.x, C.alto + n.y, C.z[0], C.xU + n.x, C.alto + n.y, C.z[1], C.xPieU + n.x, n.y, C.z[1]], 3));
        quad.setIndex([0, 2, 1, 0, 3, 2]);
        quad.computeVertexNormals();
        const cara = new THREE.Mesh(quad, M.caraConcreto);
        cara.receiveShadow = true;
        g.add(cara);
        for (let k = 1; k < 8; k++) {
            const z = lerp(C.z[0], C.z[1], k / 8);
            const j = entre([C.xPieU + n.x * 1.4, n.y * 1.4, z], [C.xU + n.x * 1.4, C.alto + n.y * 1.4, z], 0.004, M.grafito);
            j.castShadow = false;
            g.add(j);
        }
        // la corona: camino y parapeto
        g.add(en(caja(C.xD - C.xU + 0.02, 0.035, largo, M.concreto), (C.xU + C.xD) / 2, C.alto - 0.005, (C.z[0] + C.z[1]) / 2));
        g.add(en(caja(0.035, 0.115, largo, M.concreto), C.xU + 0.016, C.alto, (C.z[0] + C.z[1]) / 2));
        g.add(en(caja(0.012, 0.03, largo, M.acero), C.xD - 0.008, C.alto + 0.028, (C.z[0] + C.z[1]) / 2));
        // bermas de la cara de abajo
        for (const k of [0.27, 0.5, 0.73]) {
            const y = C.alto * k;
            g.add(en(caja(0.09, 0.012, largo, M.losa), C.xD + C.pend * (C.alto - y) + 0.02, y - 0.006, (C.z[0] + C.z[1]) / 2));
        }
        // lo de adentro, en el corte de atrás
        const zc = C.z[0] - 0.005;
        const zona = (pts, m, dz = 0) => {
            const s = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)))), m);
            s.position.z = zc - dz;
            g.add(s);
            return s;
        };
        const borde = (d, y) => C.xPieU + C.pend * y + d; // cada zona va paralela a la cara de arriba
        const A = C.alto;
        zona([[C.xPieU, 0], [C.xU, A], [C.xD, A], [C.xPieD, 0]], M.zona3b);
        zona([[0.15, 0], [C.xD - 0.02, A * 0.97], [C.xD, A], [C.xPieD, 0]], M.zonaT, 0.001);
        zona([[borde(0.12, 0), 0], [borde(0.12, A), A], [borde(0.36, A), A], [borde(0.36, 0), 0]], M.zona3a, 0.002);
        zona([[borde(0.03, 0), 0], [borde(0.03, A), A], [borde(0.12, A), A], [borde(0.12, 0), 0]], M.zona2, 0.003);
        zona([[borde(-0.012, 0), 0], [borde(-0.012, A), A], [borde(0.03, A), A], [borde(0.03, 0), 0]], M.concreto, 0.004);
        // la base en la roca y la pantalla de inyección
        zona([[C.xPieU - 0.14, 0.04], [C.xPieU + 0.2, 0.04], [C.xPieU + 0.2, -0.14], [C.xPieU - 0.14, -0.14]], M.concreto, 0.004);
        for (let k = 0; k < 8; k++) {
            const s = new THREE.Mesh(new THREE.PlaneGeometry(0.018, 0.13), M.linea);
            s.position.set(C.xPieU + 0.03, -0.24 - k * 0.18, Z0 - 0.007);
            s.rotation.y = PI;
            g.add(s);
        }
        const zt = Z0 - 0.012;
        const tintaZona = oscuro ? '#f6f1e6' : '#171317';
        rotular(g, 'Cara de concreto', -1.72, 0.62, zt, tintaZona, 1, PI);
        const guia = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 0.012), M.linea);
        guia.position.set(-2.72, 0.62, zt);
        guia.rotation.y = PI;
        g.add(guia);
        rotular(g, 'Enrocamiento', -0.9, 1.55, zt, tintaZona, 1.2, PI);
        rotular(g, 'Base y pantalla', C.xPieU + 0.72, -1.5, zt, colorCorte, 1.1, PI);
        rotular(g, 'Cortina: 210 m', 0.62, 4.62, zt, colorTexto, 1.05, PI);
    }

    // --------- el vertedor
    let compuertasV = [];
    let rocio;
    {
        const g = unidad('vertedor');
        const xs = [];
        for (let i = 0; i <= 56; i++) xs.push(lerp(VERTEDOR.x, FIN_VERTEDOR, i / 56));
        const pos = [];
        const idx = [];
        const pos2 = [];
        const idx2 = [];
        xs.forEach((x, i) => {
            const zc = vertedorZ(x);
            const y = vertedorY(x);
            const w = lerp(0.38, 0.26, i / 56);
            const alto = 0.17;
            pos.push(x, y + alto, zc - w - 0.03, x, y, zc - w, x, y, zc + w, x, y + alto, zc + w + 0.03);
            pos2.push(x, y + 0.012, zc - w, x, y + 0.012, zc + w);
            if (i) {
                const a = (i - 1) * 4;
                for (const k of [0, 1, 2]) idx.push(a + k, a + k + 1, a + k + 4, a + k + 1, a + k + 5, a + k + 4);
                const b = (i - 1) * 2;
                idx2.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
            }
        });
        const gc = new THREE.BufferGeometry();
        gc.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        gc.setIndex(idx);
        gc.computeVertexNormals();
        const canal = new THREE.Mesh(gc, M.muro);
        canal.castShadow = true;
        canal.receiveShadow = true;
        g.add(canal);
        const gh = new THREE.BufferGeometry();
        gh.setAttribute('position', new THREE.Float32BufferAttribute(pos2, 3));
        gh.setIndex(idx2);
        const lamina = new THREE.Mesh(gh, M.aguaCanal);
        lamina.renderOrder = 4;
        g.add(lamina);
        // pilas y compuertas radiales
        const top = 4.72;
        const zS = VERTEDOR.z;
        const cres = VERTEDOR.cresta;
        const anchoB = (VERTEDOR.ancho) / 3;
        for (let k = 0; k <= 3; k++) g.add(en(caja(0.34, top - cres + 0.05, 0.038, M.concreto), -0.9, cres - 0.05, zS - VERTEDOR.ancho / 2 + k * anchoB));
        g.add(en(caja(0.3, 0.04, VERTEDOR.ancho + 0.06, M.concreto), -0.9, top, zS));
        g.add(en(caja(0.3, 0.05, VERTEDOR.ancho, M.muro), -0.9, cres - 0.05, zS));
        // el muro que separa la entrada del vertedor del extremo de la cortina
        g.add(en(caja(1.05, top - 3.1, 0.54, M.concreto), -1.2, 3.1, zS - VERTEDOR.ancho / 2 - 0.26));
        for (let k = 0; k < 3; k++) {
            const c = new THREE.Group();
            c.position.set(-1, 0, zS - VERTEDOR.ancho / 2 + (k + 0.5) * anchoB);
            const puerta = new THREE.Mesh(new THREE.BoxGeometry(0.022, top - cres - 0.05, anchoB - 0.05).translate(0, (top - cres - 0.05) / 2, 0), M.guinda);
            puerta.position.y = cres;
            puerta.castShadow = true;
            c.add(puerta);
            for (const s of [-1, 1]) c.add(en(entre([0.02, cres + 0.1, s * (anchoB / 2 - 0.05)], [0.16, top - 0.2, s * (anchoB / 2 - 0.05)], 0.008, M.acero), 0, 0, 0));
            g.add(c);
            compuertasV.push(puerta);
        }
        // cubeta: lanza el agua hacia el río
        rocio = new THREE.Sprite(M.rocio);
        rocio.position.set(3.95, 0.34, -1.05);
        rocio.scale.setScalar(1.7);
        rocio.renderOrder = 7;
        raiz.add(rocio);
        const letrero = rotular(raiz, 'Río Santiago', 5.2, YABAJO + 0.03, -0.1, colorTexto, 1.05);
        letrero.rotation.set(-PI / 2, 0, -0.8);
    }

    // --------- la toma: rejillas, compuerta, torre y grúa
    const compuertasT = [];
    const toma = (zc, principal) => {
        const g = unidad(principal ? 'toma' : 'toma');
        const yb = Y(NIVEL.tomaMin);
        const ys = Y(NIVEL.tomaSup);
        const top = 5.08;
        const x0 = -5.22;
        const x1 = -4.92;
        const w = 0.28;
        for (const x of [x0, x1]) for (const s of [-1, 1]) g.add(en(caja(0.05, top - yb, 0.05, M.concreto), x, yb, zc + s * w));
        g.add(en(caja(x1 - x0 + 0.1, 0.05, 2 * w + 0.1, M.concreto), (x0 + x1) / 2, top, zc));
        g.add(en(caja(x1 - x0 + 0.05, ys - yb + 0.03, 0.03, M.concreto), (x0 + x1) / 2, yb, zc + w));
        g.add(en(caja(x1 - x0 + 0.05, ys - yb + 0.03, 0.03, M.concreto), (x0 + x1) / 2, yb, zc - w));
        g.add(en(caja(x1 - x0 + 0.05, 0.05, 2 * w, M.concreto), (x0 + x1) / 2, ys, zc));
        g.add(en(caja(0.34, 0.025, 2 * w + 0.05, M.concreto), (x0 + x1) / 2, yb - 0.02, zc));
        // rejillas
        for (let k = 0; k <= 8; k++) g.add(en(caja(0.012, ys - yb, 0.012, M.acero), x0 - 0.01, yb, zc - w + (k * 2 * w) / 8));
        for (let k = 1; k < 4; k++) g.add(en(caja(0.01, 0.012, 2 * w, M.acero), x0 - 0.01, yb + (k * (ys - yb)) / 4, zc));
        // compuerta, arriba: se baja solo para dar mantenimiento
        const c = new THREE.Mesh(new THREE.BoxGeometry(0.03, ys - yb + 0.02, 2 * w - 0.02).translate(0, (ys - yb) / 2, 0), M.guinda);
        c.position.set(-5.05, ys + 0.1, zc);
        c.castShadow = true;
        g.add(c);
        compuertasT.push(c);
        for (const s of [-1, 1]) g.add(en(entre([0, ys + (ys - yb) + 0.15, s * 0.2], [0, top, s * 0.2], 0.005, M.acero), -5.05, 0, zc));
        g.add(en(caja(0.12, 0.08, 0.32, M.grafito), -5.05, top + 0.05, zc));
        // boca de la tubería
        const boca = sombra(new THREE.Mesh(new THREE.CylinderGeometry(TUBO.r + 0.01, 0.25, 0.26, 24, 1, true).rotateZ(PI / 2), M.concreto));
        boca.position.set(-4.84, Y(NIVEL.tomaCentro), zc);
        boca.material = M.muro;
        g.add(boca);
        return g;
    };
    toma(TUBO.z, true);
    toma(1.72, false);
    // la grúa de la toma
    {
        const g = unidad('toma');
        const yg = 5.13;
        for (const x of [-5.25, -4.9]) g.add(en(caja(0.03, 0.025, 1.95, M.grafito), x, yg - 0.01, 2.33));
        const zg = 2.38;
        for (const x of [-5.25, -4.9]) g.add(entre([x, yg, zg - 0.1], [x, yg + 0.34, zg], 0.012, M.grafito), entre([x, yg, zg + 0.1], [x, yg + 0.34, zg], 0.012, M.grafito));
        g.add(entre([-5.25, yg + 0.34, zg], [-4.9, yg + 0.34, zg], 0.02, M.guinda));
    }

    // --------- la tubería a presión, con su blindaje
    const tuboMalla = (() => {
        const g = unidad('tuberia');
        const r = u => (u < 0.72 ? TUBO.r : lerp(TUBO.r, 0.108, (u - 0.72) / 0.22 > 1 ? 1 : (u - 0.72) / 0.22));
        const t = new THREE.Mesh(tuboVar(curvaTubo, r, 120, 18), M.tuboAgua);
        t.renderOrder = 2;
        g.add(t);
        for (let k = 1; k < 13; k++) {
            const u = k / 13;
            const q = curvaTubo.getPointAt(u);
            const tan = curvaTubo.getTangentAt(u);
            const a = new THREE.Mesh(new THREE.TorusGeometry(r(u) + 0.006, 0.006, 6, 24), M.acero);
            a.position.copy(q);
            a.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
            g.add(a);
        }
        rotular(g, 'Tubería a presión', -2.28, 1.56, Z1 + 0.004, colorCorte, 1.5).rotation.z = -0.81;
        return t;
    })();

    // --------- la caverna, por dentro (una sola luz, sin sombra del cerro)
    const dentroC = new THREE.Group();
    raiz.add(dentroC);
    const lamparas = [];
    {
        const g = unidad('casa', 0, 0, dentroC);
        const [Z_A, Z_B] = [CAVERNA.z[0], CAVERNA.z[1]];
        const pared = (w, h, x, y, z, rx, ry, m = M.muro) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.set(rx, ry, 0); g.add(p); return p; };
        const ancho = CX1 - CX0;
        const alto = CY1 - CY0;
        const hondo = Z_B - Z_A;
        pared(ancho, alto, (CX0 + CX1) / 2, (CY0 + CY1) / 2, Z_A, 0, 0);
        pared(hondo, alto, CX0 + 0.001, (CY0 + CY1) / 2, (Z_A + Z_B) / 2, 0, PI / 2);
        pared(hondo, alto, CX1 - 0.001, (CY0 + CY1) / 2, (Z_A + Z_B) / 2, 0, -PI / 2);
        pared(ancho, hondo, (CX0 + CX1) / 2, CY1 - 0.001, (Z_A + Z_B) / 2, PI / 2, 0);
        pared(ancho, hondo, (CX0 + CX1) / 2, CY0 + 0.001, (Z_A + Z_B) / 2, -PI / 2, 0, M.piso);
        // el piso de los generadores: cubre lo de atrás y deja ver la unidad 1 hasta abajo
        const yPiso = 0.42;
        g.add(en(caja(ancho, 0.03, 1.28, M.piso), (CX0 + CX1) / 2, yPiso - 0.03, Z_A + 0.64));
        g.add(en(caja(0.17, 0.03, Z_B - Z_A - 1.28, M.piso), CX0 + 0.085, yPiso - 0.03, Z_A + 1.28 + (Z_B - Z_A - 1.28) / 2));
        g.add(en(caja(0.17, 0.03, Z_B - Z_A - 1.28, M.piso), CX1 - 0.085, yPiso - 0.03, Z_A + 1.28 + (Z_B - Z_A - 1.28) / 2));
        for (const x of [CX0 + 0.17, CX1 - 0.17]) {
            g.add(en(caja(0.008, 0.08, Z_B - Z_A - 1.28, M.guinda), x, yPiso + 0.07, Z_A + 1.28 + (Z_B - Z_A - 1.28) / 2));
            for (let k = 0; k < 5; k++) g.add(en(caja(0.008, 0.08, 0.008, M.acero), x, yPiso, Z_A + 1.32 + k * 0.33));
        }
        // la grúa viajera, con sus rieles
        for (const x of [CX0 + 0.04, CX1 - 0.04]) g.add(en(caja(0.04, 0.03, hondo, M.grafito), x, 1.12, (Z_A + Z_B) / 2));
        const puente = new THREE.Group();
        puente.position.set(0, 1.15, 1.75);
        puente.add(en(caja(ancho - 0.06, 0.05, 0.12, M.guinda), (CX0 + CX1) / 2, 0, 0));
        puente.add(en(caja(0.18, 0.06, 0.14, M.grafito), 1.2, -0.04, 0));
        puente.add(en(cil(0.005, 0.2, M.grafito), 1.2, -0.24, 0));
        puente.add(en(caja(0.04, 0.03, 0.03, M.guinda), 1.2, -0.27, 0));
        g.add(puente);
        // luces del techo
        for (const x of [0.75, 1.65]) for (let k = 0; k < 4; k++) {
            const l = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.05), M.lampara);
            l.position.set(x, CY1 - 0.012, Z_A + 0.35 + k * 0.7);
            g.add(l);
            lamparas.push(l);
        }
        kit.luz(g, 1.2, 1.08, 2.45, '#ffe6c2', 1.6, 'noche', 4.2);
        const rotulo = rotular(raiz, 'Casa de máquinas', 1.2, 1.56, Z1 + 0.004, colorCorte, 1.45);
        partes.casa.push(rotulo);
    }

    // --------- una unidad: caracol, distribuidor, rodete, tubo de aspiración, flecha y generador
    const distribuidores = [];
    const unidadH = (i, CZ) => {
        const prin = i === 0;
        const dueno = id => (prin ? id : 'casa');
        // el caracol: el agua entra por la tubería y rodea al rodete
        const rho = th => MAQUINA.Rc + radio(th);
        const radio = th => 0.112 * (1 - th / (PI * 2)) ** 0.62 + 0.024;
        const pts = [];
        for (let k = 0; k <= 30; k++) { const th = (k / 30) * (PI * 2 * 0.93); pts.push(new THREE.Vector3(CX + Math.sin(th) * rho(th), YT, CZ + Math.cos(th) * rho(th))); }
        const cuCar = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2);
        const gD = unidad(dueno('distribuidor'), 0, 0, dentroC);
        const matC = prin ? cub('caracolC', ['distribuidor', 'turbina'], { color: '#5d7a97', metal: 0.5 }) : M.grafito;
        const caracol = sombra(new THREE.Mesh(tuboVar(cuCar, u => radio(u * PI * 2 * 0.93), 70, 14), matC));
        gD.add(prin ? mover(caracol, [0, 0, 1.25]) : caracol);
        // tramo que une la tubería con el caracol
        if (prin) {
            // antedistribuidor fijo, distribuidor que se abre y anillos
            const ajuste = mover(new THREE.Group(), [0, 0, 0.95]);
            gD.add(ajuste);
            ajuste.add(en(aro(0.335, 0.012, M.acero), CX, YT + 0.085, CZ));
            ajuste.add(en(aro(0.335, 0.012, M.acero), CX, YT - 0.085, CZ));
            for (let k = 0; k < 18; k++) {
                const a = (k / 18) * PI * 2;
                const v = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.17, 0.06), M.acero);
                v.position.set(CX + Math.sin(a) * 0.32, YT, CZ + Math.cos(a) * 0.32);
                v.rotation.y = a + PI / 2 + 0.5;
                ajuste.add(v);
            }
            for (let k = 0; k < 20; k++) {
                const a = (k / 20) * PI * 2;
                const v = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.14, 0.075), M.guinda);
                v.position.set(CX + Math.sin(a) * 0.268, YT, CZ + Math.cos(a) * 0.268);
                v.userData.a = a;
                ajuste.add(v);
                distribuidores.push(v);
            }
            // tapa de la turbina: se vuelve vidrio
            const tapa = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.3, 0.09, 30).translate(0, 0.045, 0), cub('tapaT', ['turbina', 'distribuidor'], { color: '#6c7076', metal: 0.6 })));
            tapa.position.set(CX, YT + 0.09, CZ);
            gD.add(mover(tapa, [0, 0.75, 1.25]));
            // el rodete
            const gR = unidad('turbina', 0, 0, dentroC);
            const rodete = new THREE.Group();
            rodete.position.set(CX, YT, CZ);
            const geoA = geoAlabe();
            for (let k = 0; k < 13; k++) {
                const b = new THREE.Mesh(geoA, M.rodete);
                b.rotation.y = (k / 13) * PI * 2;
                b.castShadow = true;
                rodete.add(b);
            }
            const corona = new THREE.Mesh(new THREE.LatheGeometry([[0.02, 0.09], [0.1, 0.09], [0.2, 0.08], [0.228, 0.07], [0.228, 0.058], [0.14, 0.05], [0.02, 0.03]].map(([x, y]) => new THREE.Vector2(x, y)), 34), M.rodeteAcero);
            rodete.add(corona);
            const banda = new THREE.Mesh(new THREE.LatheGeometry([[0.228, -0.03], [0.2, -0.08], [0.165, -0.14], [0.172, -0.14], [0.208, -0.08], [0.236, -0.03]].map(([x, y]) => new THREE.Vector2(x, y)), 34), M.rodeteAcero);
            rodete.add(banda);
            rodete.add(en(new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.13, 20).rotateX(PI).translate(0, -0.03, 0), M.rodeteAcero), 0, 0, 0));
            const movR = mover(new THREE.Group(), [0, -0.05, 1.7]);
            movR.add(rodete);
            gR.add(movR);
            giran.push({ obj: rodete, eje: 'y', vel: e => (e.n1 * 2.5 * PI * 2) * 0.28 });
        }
        // la flecha
        const gG = unidad(dueno('generador'), 0, 0, dentroC);
        const flecha = new THREE.Group();
        flecha.position.set(CX, 0, CZ);
        flecha.add(en(cil(0.048, 0.88, M.acero, 0.048, 20), 0, YT + 0.12, 0));
        flecha.add(en(aro(0.1, 0.012, M.grafito), 0, 0.2, 0));
        flecha.add(en(cil(0.09, 0.06, M.grafito, 0.09, 20), 0, 0.17, 0));
        gG.add(prin ? mover(flecha, [0, 0.0, 2.1]) : flecha);
        // el generador
        const yG = 0.5;
        const altoG = 0.44;
        gG.add(en(cil(0.66, 0.08, M.concreto, 0.66, 40), CX, 0.42, CZ));
        const matG = prin ? cub('generadorC', ['generador'], { color: '#7f8d9b', metal: 0.55 }) : new THREE.MeshStandardMaterial({ color: '#7f8d9b', metalness: 0.55, roughness: 0.5 });
        const carc = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.62, altoG, 44, 1, true), matG));
        carc.position.set(CX, yG + altoG / 2, CZ);
        const tapaG = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.6, 0.08, 40).translate(0, 0.04, 0), matG));
        tapaG.position.set(CX, yG + altoG, CZ);
        gG.add(prin ? mover(carc, [0, 0, 1.1]) : carc, prin ? mover(tapaG, [0, 0.55, 1.1]) : tapaG);
        const cubreS = new THREE.Group();
        cubreS.add(en(cil(0.13, 0.06, M.grafito, 0.13, 24), CX, yG + altoG + 0.08, CZ));
        cubreS.add(en(cil(0.09, 0.07, M.guinda, 0.09, 24), CX, yG + altoG + 0.14, CZ));
        gG.add(prin ? mover(cubreS, [0, 0.55, 1.1]) : cubreS);
        if (prin) {
            // estator: el cobre, quieto
            const est = new THREE.Group();
            for (let k = 0; k < 42; k++) {
                const a = (k / 42) * PI * 2;
                const b = new THREE.Mesh(new THREE.BoxGeometry(0.02, altoG * 0.84, 0.03), M.cobre);
                b.position.set(CX + Math.sin(a) * 0.53, yG + altoG * 0.5, CZ + Math.cos(a) * 0.53);
                b.rotation.y = a;
                est.add(b);
            }
            est.add(en(aro(0.54, 0.018, M.cobre), CX, yG + altoG * 0.92, CZ), en(aro(0.54, 0.018, M.cobre), CX, yG + altoG * 0.08, CZ));
            gG.add(mover(est, [0, 0, 0.9]));
            // rotor: el imán que gira. Aquí, 24 de sus 48 polos
            const rotor = new THREE.Group();
            rotor.position.set(CX, yG + altoG * 0.5, CZ);
            rotor.add(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, altoG * 0.7, 40), M.acero));
            for (let k = 0; k < 24; k++) {
                const a = (k / 24) * PI * 2;
                const b = new THREE.Mesh(new THREE.BoxGeometry(0.052, altoG * 0.68, 0.075), k % 2 ? M.guinda : M.cobre);
                b.position.set(Math.sin(a) * 0.45, 0, Math.cos(a) * 0.45);
                b.rotation.y = a;
                rotor.add(b);
            }
            const movG = mover(new THREE.Group(), [0, 0, 2.1]);
            movG.add(rotor);
            gG.add(movG);
            giran.push({ obj: rotor, eje: 'y', vel: e => (e.n1 * 2.5 * PI * 2) * 0.28 });
            brillo(gG, CX, yG + altoG / 2, CZ, 1.5, FLUIDOS.ca.color, 'gen', 0.26, false);
            // tubo de aspiración: abre y gira hacia la galería
            const gA = unidad('oscilacion', 0, 0, dentroC);
            const matA = cub('aspC', ['oscilacion', 'turbina'], { color: '#5d7a97', metal: 0.5 });
            const perfil = [[0.165, YT - 0.14], [0.2, -0.6], [0.24, -0.8]].map(([x, y]) => new THREE.Vector2(x, y));
            const cono = sombra(new THREE.Mesh(new THREE.LatheGeometry(perfil, 28), matA));
            cono.position.set(CX, 0, CZ);
            gA.add(cono);
            const cuA = curvaDe(lineaDe('aspira').puntos.map(p => [...p]), 0.2);
            const codo = sombra(new THREE.Mesh(tuboVar(cuA, u => lerp(0.24, 0.17, clamp01(u * 1.4)), 60, 16), matA));
            gA.add(codo);
        } else {
            const cono = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.24, 0.5, 24), M.grafito));
            cono.position.set(CX, -0.62, CZ);
            gG.add(cono);
        }
    };
    unidadH(0, MAQUINA.z1);
    unidadH(1, MAQUINA.z2);

    // --------- la galería de oscilación y el desfogue
    let aguaGaleria;
    {
        const g = unidad('oscilacion');
        const ancho = GX1 - GX0 - 0.012;
        aguaGaleria = new THREE.Mesh(new THREE.BoxGeometry(ancho, 1, Z1 - LOSA.z - 0.012).translate(0, 0.5, 0), M.aguaRio);
        aguaGaleria.position.set((GX0 + GX1) / 2, GY0 + 0.004, (LOSA.z + Z1) / 2);
        aguaGaleria.renderOrder = 4;
        g.add(aguaGaleria);
        // compuerta de la galería y su grúa
        const zc = TUBO.z;
        g.add(en(caja(0.03, 0.38, 0.44, M.guinda), GX1 - 0.06, GY1 - 0.72, zc));
        g.add(en(entre([0, -0.34, 0], [0, 0.27, 0], 0.006, M.acero), GX1 - 0.06, GY1 - 0.1, zc));
        g.add(en(caja(GX1 - GX0 - 0.02, 0.05, 0.1, M.grafito), (GX0 + GX1) / 2, GY1 - 0.12, zc));
        const r = rotular(raiz, 'Galería de oscilación', 2.96, 1.38, Z1 + 0.004, colorCorte, 1.15);
        partes.oscilacion.push(r);
        // el desfogue, hasta el río
        const d = unidad('desfogue');
        const t = new THREE.Mesh(tuboVar(curvaDesfogue, () => 0.17, 60, 18), M.tuboAgua);
        t.renderOrder = 2;
        d.add(t);
        d.add(en(caja(0.1, 0.44, 0.56, M.concreto), LOSA.x[1] + 0.02, -0.22, TUBO.z));
        const rd = rotular(raiz, 'Desfogue', 4.85, 0.52, Z1 + 0.004, colorCorte, 0.95);
        partes.desfogue.push(rd);
    }

    // --------- subestación: sube la electricidad para que viaje lejos
    const yp = 1.92;
    const transformador = (padre, id, nombre, x, z, esc = 1) => {
        const g = unidad(id, x, z, padre);
        g.position.y = yp;
        const c = cub(nombre, [id], { color: '#5a5c63', metal: 0.5 });
        const tanque = caja(0.62 * esc, 0.62 * esc, 0.72 * esc, c);
        tanque.position.y = 0.04;
        g.add(mover(tanque, [0, 1.15, 0]));
        const tapa = caja(0.66 * esc, 0.035, 0.76 * esc, M.grafito);
        tapa.position.y = 0.04 + 0.62 * esc;
        g.add(mover(tapa, [0, 1.15, 0]));
        for (const s of [-1, 1]) for (let i = 0; i < 6; i++) g.add(mover(en(caja(0.09 * esc, 0.5 * esc, 0.018, M.acero), s * 0.37 * esc, 0.08, (-0.27 + i * 0.108) * esc), [s * 0.5, 0, 0]));
        g.add(en(caja(0.34 * esc, 0.48 * esc, 0.06, M.grafito), 0, 0.08, 0));
        for (const k of [-0.2, 0, 0.2]) g.add(en(cil(0.09 * esc, 0.36 * esc, M.cobre, 0.09 * esc, 16), 0, 0.12, k * esc));
        const boq = new THREE.Group();
        for (const k of [-0.22, 0, 0.22]) {
            boq.add(en(cil(0.024, 0.32 * esc, M.marfil, 0.012, 10), 0, 0.68 * esc, k * esc));
            for (let i = 0; i < 3; i++) boq.add(en(aro(0.03 - i * 0.003, 0.006, M.marfil), 0, 0.73 * esc + i * 0.07 * esc, k * esc));
        }
        g.add(mover(boq, [0, 1.15, 0]));
        brillo(g, 0, 0.36, 0.5, 0.6, FLUIDOS.ca.color, 'red', 0.14);
        return g;
    };
    {
        const u = unidad('subestacion');
        u.add(en(caja(2.4, 0.016, 1.46, M.grava ?? M.losa), 3.75, yp - 0.002, 1.85));
        transformador(raiz, 'subestacion', 'tanqueAlta', 3.2, 1.85, 1);
        // subestación blindada: una nave cerrada con sus ventanas
        const b = unidad('subestacion', 4.24, 1.82);
        b.position.y = yp;
        const cb = cub('blindadaC', ['subestacion'], { color: '#e7e6e0' });
        b.add(mover(caja(0.86, 0.5, 1.06, cb), [0, 1.3, 0]));
        b.add(mover(en(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 1.1), M.acero), 0, 0.52, 0), [0, 1.3, 0]));
        for (let k = 0; k < 3; k++) b.add(en(cil(0.06, 0.34, M.acero, 0.06, 12), -0.2, 0.05, -0.32 + k * 0.32), en(caja(0.3, 0.06, 0.05, M.acero), 0.02, 0.18, -0.32 + k * 0.32));
        // pórtico de salida
        const p = unidad('subestacion', 4.77, 2.05);
        p.position.y = yp;
        p.add(entre([0, 0, -0.32], [0, 1.42, -0.32], 0.02, M.acero), entre([0, 0, 0.32], [0, 1.42, 0.32], 0.02, M.acero), entre([0, 1.42, -0.34], [0, 1.42, 0.34], 0.02, M.acero));
        for (const z of [-0.14, 0, 0.14]) p.add(en(cil(0.012, 0.1, M.marfil, 0.012, 8), 0, 1.44, z));
    }

    // --------- RNT y RGD: torres, subestación reductora, postes y pueblo
    {
        const u = unidad('red');
        const geoT = geoTorre(2.7);
        TORRES.forEach(([x, z]) => {
            const y = terreno(x, z);
            const t = new THREE.Mesh(geoT, M.torre);
            t.position.set(x, y, z);
            u.add(t);
            u.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.012, 0.56), M.losa), x, y + 0.006, z));
        });
        const rnt = LINEAS.find(l => l.id === 'rnt');
        for (const s of [-1, 1]) {
            const pts = rnt.puntos.map(([x, y, z]) => new THREE.Vector3(x + s * 0.09, y - 0.02, z + s * 0.04));
            u.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2), 150, 0.008, 5), M.torre));
        }
        const yr = terreno(7.5, -1.65);
        const r = unidad('red', 7.5, -1.65);
        r.position.y = yr;
        r.add(caja(0.66, 0.04, 0.6, M.losa));
        r.add(en(caja(0.32, 0.4, 0.38, M.grafito), 0, 0.04, 0));
        for (const z of [-0.11, 0, 0.11]) r.add(en(cil(0.016, 0.2, M.marfil, 0.01, 8), 0.05, 0.44, z));
        for (const [a, b] of [[[-0.26, 0, -0.26], [-0.26, 1.28, -0.26]], [[-0.26, 0, 0.26], [-0.26, 1.28, 0.26]], [[0.26, 0, -0.26], [0.26, 1.28, -0.26]], [[0.26, 0, 0.26], [0.26, 1.28, 0.26]], [[-0.28, 1.28, 0.26], [0.28, 1.28, 0.26]], [[-0.28, 1.28, -0.26], [0.28, 1.28, -0.26]], [[0, 1.28, -0.26], [0, 1.28, 0.26]]]) r.add(entre(a, b, 0.014, M.acero));
        r.add(entre([0, 1.28, 0], [0, 0.44, 0], 0.012, M.acero));
        for (const [x, z, h] of [[6.5, -1.82, 1], [5.9, -1.85, 0.78]]) {
            const y = terreno(x, z);
            u.add(en(cil(0.018, h, M.madera, 0.014, 8), x, y, z));
            u.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.26), M.madera), x, y + h - 0.02, z));
        }
        const casas = [[5.55, -2.1, 0.34, 0.26, 0.24], [5.05, -2.15, 0.3, 0.3, 0.2], [6.15, -2.2, 0.34, 0.26, 0.26], [5.3, -1.72, 0.38, 0.28, 0.24], [4.82, -1.8, 0.28, 0.24, 0.22], [6.6, -2.25, 0.26, 0.22, 0.2]];
        casas.forEach(([x, z, w, d, h], i) => {
            const g = new THREE.Group();
            g.position.set(x, terreno(x, z), z);
            g.rotation.y = (azar(i, 81) - 0.5) * 0.4;
            g.add(caja(w, h, d, M.marfil));
            const techo = sombra(new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w, d) * 0.56, 0.12, 4).rotateY(PI / 4).translate(0, 0.06, 0), M.guinda));
            techo.position.y = h;
            g.add(techo);
            const v = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.008), M.ventana);
            v.position.set(-w * 0.2, h * 0.55, d / 2 + 0.005);
            g.add(v);
            const v2 = v.clone();
            v2.position.x = w * 0.2;
            g.add(v2);
            u.add(g);
        });
    }

    // --------- árboles, donde no estorban
    {
        const lista = [];
        const yN = Y(NIVEL.NAME);
        for (let i = 0; lista.length < (movil ? 110 : 220) && i < 4000; i++) {
            const x = lerp(X0 + 0.15, X1 - 0.15, azar(i, 91));
            const z = lerp(Z0 + 0.12, Z1 - 0.12, azar(i, 92));
            const h = terreno(x, z);
            if (x < CORTINA.xU && h < yN + 0.1) continue;
            if (x > CORTINA.xPieU - 0.05 && x < CORTINA.xPieD + 0.1 && z < 0.7) continue;
            if (x > -1.2 && x < 3.1 && Math.abs(z - vertedorZ(x)) < 0.56) continue;
            if (x > 2.45 && x < 5.2 && z > 0.95 && z < 2.7) continue;
            if (x > -5.5 && x < -4.5) continue;
            if (x > 6.8 && z < -0.9) continue;
            if (x > 4.6 && x < 7 && z < -1.3) continue;
            if (h < YABAJO + 0.14) continue;
            const inc = Math.hypot(terreno(x + 0.06, z) - terreno(x - 0.06, z), terreno(x, z + 0.06) - terreno(x, z - 0.06)) * 8;
            if (inc > 1.2) continue;
            lista.push([x, h, z]);
        }
        const copa = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.1, 1).scale(1.15, 0.95, 1.15).translate(0, 0.085, 0), M.hoja, lista.length);
        const m4x = new THREE.Matrix4();
        const qx = new THREE.Quaternion();
        lista.forEach(([x, y, z], i) => { const es = 0.6 + azar(i, 95) * 0.75; m4x.compose(new THREE.Vector3(x, y, z), qx, new THREE.Vector3(es, es, es)); copa.setMatrixAt(i, m4x); });
        copa.castShadow = true;
        raiz.add(copa);
    }

    // ---------- lo que corre
    const parteDe = L => L.parte ?? null;
    const tubos = crearTubos({ raiz, lineas: LINEAS, fluidos: FLUIDOS, M, partes, parteDe, movil });
    kit.cerrarGotas(new THREE.SphereGeometry(1, 8, 6));
    // adentro de la caverna no cae la sombra del cerro
    dentroC.traverse(o => { if (o.isMesh) o.receiveShadow = false; });

    const anclas = {};
    for (const p of PARTES) {
        const o = new THREE.Object3D();
        o.position.set(...p.ancla);
        raiz.add(o);
        anclas[p.id] = o;
    }

    // ---------- posar
    const m4 = new THREE.Matrix4();
    const v3 = new THREE.Vector3();
    const s3 = new THREE.Vector3();
    const q0 = new THREE.Quaternion();
    function posar(e) {
        const n = e.noche;
        const L = e.encendido;
        const act = p => (p === 'noche' ? Math.max(n, 0.55) : p ? (e.activo[p] ?? 0) : 1);
        const a = sale(e.desarme * 3);
        const ab = { ...(e.abierta || {}), desarmeV: sale(e.desarme * 2.2) };
        kit.posar(e, act, ab, { apagar: a });
        tubos.posar(e, a);
        // el agua del embalse
        lago.scale.y = Math.max(0.01, e.nivel - yBaseLago);
        // el distribuidor abre y cierra
        const giro = lerp(1.32, 0.42, clamp01(e.a1));
        distribuidores.forEach(v => { v.rotation.y = v.userData.a - giro; }); // de canto cierra el paso; casi de frente lo abre, y el agua entra girando con el rodete
        // la tubería se ve según corre el agua
        const f = e.flujos.tubo ?? 0;
        M.tuboAgua.opacity = lerp(0.3, 0.6, clamp01(f * 2)) * (1 - a * 0.7);
        tuboMalla.visible = true;
        // el nivel de la galería: el vaivén se ve tres veces más grande de lo que es
        aguaGaleria.scale.y = Math.max(0.02, YABAJO - (GALERIA.y[0] + 0.004) + e.gal * 0.42);
        // el vertedor
        const ver = clamp01(e.vierte / 200);
        compuertasV.forEach(c => { c.position.y = VERTEDOR.cresta + ver * 0.55; });
        M.aguaCanal.opacity = 0.75 * clamp01(ver * 3) * (1 - a);
        M.rocio.opacity = 0.75 * clamp01(ver * 2) * (1 - a);
        rocio.visible = M.rocio.opacity > 0.01;
        // la lluvia y la nube
        const verCuenca = ab.cuenca ?? 0;
        const ll = Math.max(e.lluvia > 0.35 && e.modo === 'ano' ? e.lluvia : 0, verCuenca * 0.8) * (1 - a);
        M.nube.opacity = clamp01(ll * 1.6) * 0.9;
        nubes.visible = M.nube.opacity > 0.01;
        M.lluvia.opacity = clamp01(ll * 1.2) * 0.7;
        lluvia.visible = M.lluvia.opacity > 0.01;
        if (lluvia.visible) {
            const nivelG = e.nivel;
            gotasL.forEach((g, i) => {
                const y = 5.85 - ((e.t * g.v * 1.7 + g.f) % 1) * (5.85 - Math.max(nivelG, terreno(g.x, g.z)));
                v3.set(g.x, y, g.z);
                s3.setScalar(1);
                lluvia.setMatrixAt(i, m4.compose(v3, q0, s3));
            });
            lluvia.instanceMatrix.needsUpdate = true;
        }
        // neones
        M.neonElec.color.set(FLUIDOS.ca.color).multiplyScalar((0.14 + 0.86 * e.activo.gen) * L);
        M.neonGuinda.color.set(P_PLANTA.rosa).multiplyScalar(0.5 * L);
        M.lampara.color.set('#d8d4c8').lerp(new THREE.Color('#ffe2ad'), n);
        M.ventana.color.set('#3f4a57').lerp(new THREE.Color('#ffc77a'), n);
    }
    void PUNTAS_TORRE;
    return { raiz, posar, partes, anclas, giran, repintar: kit.repintar, equipos: EQUIPOS };
}
