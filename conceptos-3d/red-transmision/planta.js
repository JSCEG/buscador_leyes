// La línea de transmisión, hecha con código. Sistema Búho: un tramo de campo con lomas y un río, cruzado por dos líneas de 400 kV de un
// circuito cada una (como la Minatitlán Dos – Temascal Dos de la CFE), con sus torres de fases en horizontal, dos cables por fase, aisladores,
// hilos de guarda y su derecho de vía. A la izquierda la subestación de salida y a la derecha la de llegada, con sus reactores. Los cables se
// cuelgan más con el calor (la flecha sale del modelo). Los claros van muy recortados: nada está a escala.
//
//   materiales(P)     escenario(renderer, scene, M, { movil, oscuro })
//   construir(M, P, { movil, oscuro }) → { raiz, posar(e), partes, anclas, giran, repintar }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { azar, clamp01, fract, lerp, sale } from '../planta-comun/ayudas.js';
import { caja, cil, crearAyudante, crearTubos, en, estudio, geoEntre, materialesBase, sombra, texturaGrano } from '../planta-comun/piezas.js';
import { MATERIAL_CONDUCTOR } from '../planta-comun/conductores.js';
import { BLOQUE, BORNES, CADENA_REMATE, FASES, FLUIDOS, GUARDAS, LINEAS, PARTES, SEP, X, Y, ZL, alturaEn, apoyos, claro, faseReactor, flechaA, puenteRemate, terreno } from './modelo.js';

const PI = Math.PI;
export const P_PLANTA = {
    papel: '#fafafa', noche: '#0a0e12', tinta: '#171317', marfil: '#f3f1ec', grafito: '#303137', acero: '#a7abb3', guinda: '#9b2247', rosa: '#e57a9a',
    tierraDia: '#d6d7c8', tierraNoche: '#23272c', losaDia: '#dcdcda', losaNoche: '#2c3036', suelo: '#b9a688',
};

export function materiales(P) {
    const M = materialesBase(P, FLUIDOS);
    Object.assign(M, {
        terreno: new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.96, envMapIntensity: 0.25 }),
        roca: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#b9a688', 'rgba(70,52,30,0.18)', [7, 1]), roughness: 0.96, envMapIntensity: 0.25 }),
        grava: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#c9c4b9', 'rgba(60,50,40,0.28)', [6, 3]), roughness: 0.95, envMapIntensity: 0.25 }),
        agua: new THREE.MeshStandardMaterial({ color: '#4d9fd0', roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.85, envMapIntensity: 1 }),
        galv: new THREE.MeshStandardMaterial({ color: '#9aa0a8', roughness: 0.45, metalness: 0.7, envMapIntensity: 0.85 }),
        polimero: new THREE.MeshStandardMaterial({ color: '#5f7068', roughness: 0.5, metalness: 0.05, envMapIntensity: 0.7 }),
        porcelana: new THREE.MeshStandardMaterial({ color: '#8b5a43', roughness: 0.32, metalness: 0.05, envMapIntensity: 0.9 }),
        aluminio: new THREE.MeshStandardMaterial({ color: '#d6dade', roughness: 0.28, metalness: 0.85, envMapIntensity: 1 }),
        guarda: new THREE.MeshStandardMaterial({ color: '#6c7077', roughness: 0.45, metalness: 0.7 }),
        trafo: new THREE.MeshStandardMaterial({ color: '#8f999d', roughness: 0.5, metalness: 0.35, envMapIntensity: 0.8 }),
        camara: new THREE.MeshStandardMaterial({ color: '#c9cdd2', roughness: 0.3, metalness: 0.6, envMapIntensity: 0.9 }),
        nucleo: new THREE.MeshStandardMaterial({ color: '#4c5057', roughness: 0.45, metalness: 0.6 }),
        muro: new THREE.MeshStandardMaterial({ color: '#ece6da', roughness: 0.8, envMapIntensity: 0.3 }),
        techo: new THREE.MeshStandardMaterial({ color: '#a4573d', roughness: 0.75, envMapIntensity: 0.3 }),
        malla: new THREE.MeshStandardMaterial({ color: '#9aa0a6', roughness: 0.5, metalness: 0.6, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }),
        brecha: new THREE.MeshStandardMaterial({ color: '#c8b796', roughness: 0.95, envMapIntensity: 0.2 }),
        borde: new THREE.MeshBasicMaterial({ color: P.guinda, transparent: true, opacity: 0.55, depthWrite: false }),
        cota: new THREE.MeshBasicMaterial({ color: P.guinda, toneMapped: false, depthTest: false, transparent: true }),
        quemado: new THREE.MeshStandardMaterial({ color: '#2d2723', roughness: 1, transparent: true, opacity: 0, depthWrite: false }),
        fuego: new THREE.MeshBasicMaterial({ color: '#ff8a1f', toneMapped: false, transparent: true, opacity: 0.92, depthWrite: false }),
        llama: new THREE.MeshBasicMaterial({ color: '#ffd23f', toneMapped: false, transparent: true, opacity: 0.95, depthWrite: false }),
        rayo: new THREE.MeshBasicMaterial({ color: '#ffe066', toneMapped: false, transparent: true, opacity: 0, depthWrite: false }),
        arco: new THREE.MeshBasicMaterial({ color: '#7d5cff', toneMapped: false }),
        bandera: new THREE.MeshBasicMaterial({ color: '#2f8f4e', toneMapped: false }),
        banderaAbierta: new THREE.MeshBasicMaterial({ color: '#e0302a', toneMapped: false }),
    });
    M.tierras = new THREE.MeshStandardMaterial({ color: '#c8743c', roughness: 0.34, metalness: 0.9, envMapIntensity: 1, transparent: true });
    M.cables = [0, 1].map(() => MATERIAL_CONDUCTOR());
    M.puente = MATERIAL_CONDUCTOR();
    M.vaho = { humo: new THREE.SpriteMaterial({ map: M.vaho, color: '#8d857c', transparent: true, opacity: 0, depthWrite: false }) };
    return M;
}

const [X0, X1] = BLOQUE.x;
const [Z0, Z1] = BLOQUE.z;
const Y0 = BLOQUE.y[0];
export function escenario(renderer, scene, M, { movil = false, oscuro = false } = {}) {
    const dia = { terreno: new THREE.Color(oscuro ? '#b4b6aa' : '#ffffff'), roca: new THREE.Color(oscuro ? '#c9c5bc' : '#ffffff'), grava: new THREE.Color(oscuro ? '#bcb8ae' : '#ffffff') };
    const noche = { terreno: new THREE.Color('#5a5f66'), roca: new THREE.Color('#6a655c'), grava: new THREE.Color('#4b4f56') };
    if (oscuro) { M.torre.color.set('#8f929a'); M.galv.color.set('#a9afb7'); M.guarda.color.set('#9a9ea6'); }
    return estudio(renderer, scene, {
        movil, oscuro, y0: Y0, alcance: 15,
        alActualizar(n) {
            M.terreno.color.copy(dia.terreno).lerp(noche.terreno, n);
            M.roca.color.copy(dia.roca).lerp(noche.roca, n);
            M.grava.color.copy(dia.grava).lerp(noche.grava, n);
        },
    });
}

// ------------------------------------------------------------------ geometrías que se repiten
const memo = new Map();
const una = (k, f) => { if (!memo.has(k)) memo.set(k, f()); return memo.get(k); };
/** Aislador de polímero: una varilla con sus faldas, de arriba (y = 0) hacia abajo. */
const geoPolimero = (h, r = 0.011) => una(`p${h}`, () => {
    const g = [new THREE.CylinderGeometry(r * 0.45, r * 0.45, h, 8).translate(0, -h / 2, 0)];
    const n = Math.max(4, Math.round(h / 0.016));
    for (let i = 0; i < n; i++) g.push(new THREE.CylinderGeometry(r * (i % 2 ? 1.6 : 2.1), r * (i % 2 ? 1.6 : 2.1), 0.004, 12).translate(0, -0.012 - (i * (h - 0.024)) / (n - 1), 0));
    return mergeGeometries(g);
});
/** Aislador de porcelana con faldas, de pie (base en y = 0). */
const geoPorcelana = (h, r) => una(`a${h}|${r}`, () => {
    const g = [new THREE.CylinderGeometry(r * 0.5, r * 0.55, h, 10).translate(0, h / 2, 0)];
    const n = Math.max(3, Math.round(h / 0.055));
    for (let i = 0; i < n; i++) g.push(new THREE.CylinderGeometry(r, r, 0.012, 14).translate(0, 0.03 + (i * (h - 0.06)) / (n - 1), 0));
    return mergeGeometries(g);
});
/** Columna de celosía de base cuadrada, de pie. */
const geoCelosia = (h, a = 0.12) => una(`l${h}|${a}`, () => {
    const g = [];
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.push(geoEntre([sx * a / 2, 0, sz * a / 2], [sx * a / 2, h, sz * a / 2], 0.008, 4));
    const n = Math.max(3, Math.round(h / 0.18));
    for (let i = 0; i < n; i++) {
        const [y0, y1] = [(i * h) / n, ((i + 1) * h) / n];
        g.push(geoEntre([-a / 2, y0, -a / 2], [a / 2, y1, -a / 2], 0.004, 3), geoEntre([a / 2, y0, a / 2], [-a / 2, y1, a / 2], 0.004, 3));
        g.push(geoEntre([-a / 2, y0, a / 2], [-a / 2, y1, -a / 2], 0.004, 3), geoEntre([a / 2, y0, -a / 2], [a / 2, y1, a / 2], 0.004, 3));
    }
    return mergeGeometries(g);
});
/**
 * Torre de un circuito con las fases en horizontal: cuatro patas que se juntan en la cintura, un cuerpo que se abre hacia la cruceta, la
 * cruceta a lo largo (z) y dos picos para los hilos de guarda. remate: más robusta.
 */
function geoTorreH(remate = false) {
    const g = [];
    const k = remate ? 1.45 : 1;
    const r1 = 0.0085 * k;
    const r2 = 0.0042 * k;
    const yc = Y.cruceta;
    const yw = yc * 0.6; // cintura
    const pierna = [[0.2 * k, 0.24 * k], [0.065, 0.085], [0.06, 0.42]]; // medios anchos (x, z) en el suelo, en la cintura y en la cruceta
    const niveles = [0, yw, yc];
    const esquinas = (i, sx, sz) => [sx * pierna[i][0], niveles[i], sz * pierna[i][1]];
    for (let i = 0; i < 2; i++) {
        for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.push(geoEntre(esquinas(i, sx, sz), esquinas(i + 1, sx, sz), r1, 4));
        // arriostrado en X por paneles
        const paneles = i === 0 ? 4 : 3;
        for (let p = 0; p < paneles; p++) {
            const u0 = p / paneles;
            const u1 = (p + 1) / paneles;
            const en_ = (u, sx, sz) => { const a = esquinas(i, sx, sz); const b = esquinas(i + 1, sx, sz); return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; };
            for (const [s1, s2] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) {
                g.push(geoEntre(en_(u0, ...s1), en_(u1, ...s2), r2, 3));
                g.push(geoEntre(en_(u0, ...s2), en_(u1, ...s1), r2, 3));
            }
            for (const [s1, s2] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) g.push(geoEntre(en_(u1, ...s1), en_(u1, ...s2), r2, 3));
        }
    }
    // la cruceta: una viga de celosía a lo largo de z
    const ch = 0.07;
    const cz = 0.74;
    for (const [dx, dy] of [[-0.035, 0], [0.035, 0], [-0.035, ch], [0.035, ch]]) g.push(geoEntre([dx, yc + dy, -cz], [dx, yc + dy, cz], r1 * 0.9, 4));
    for (let i = 0; i < 12; i++) {
        const [z0, z1] = [lerp(-cz, cz, i / 12), lerp(-cz, cz, (i + 1) / 12)];
        g.push(geoEntre([-0.035, yc, z0], [-0.035, yc + ch, z1], r2, 3), geoEntre([0.035, yc, z0], [0.035, yc + ch, z1], r2, 3));
        g.push(geoEntre([-0.035, yc + ch, z1], [0.035, yc + ch, z1], r2, 3), geoEntre([-0.035, yc, z1], [0.035, yc, z1], r2, 3));
    }
    // los picos de los hilos de guarda
    for (const zg of GUARDAS) {
        const base = [[-0.035, zg - 0.06], [0.035, zg - 0.06], [0.035, zg + 0.06], [-0.035, zg + 0.06]];
        for (const [x, z] of base) g.push(geoEntre([x, yc + ch, z], [0, Y.guarda, zg], r2 * 1.3, 3));
    }
    return mergeGeometries(g);
}
/** Viga de celosía a lo largo de z, centrada, con su cara de abajo en y = 0. */
const geoViga = largo => una(`v${largo}`, () => {
    const g = [];
    const [w, h] = [0.06, 0.07];
    for (const [x, y] of [[-w / 2, 0], [w / 2, 0], [-w / 2, h], [w / 2, h]]) g.push(geoEntre([x, y, -largo / 2], [x, y, largo / 2], 0.007, 4));
    const n = Math.round(largo / 0.12);
    for (let i = 0; i < n; i++) {
        const [z0, z1] = [-largo / 2 + (i * largo) / n, -largo / 2 + ((i + 1) * largo) / n];
        for (const x of [-w / 2, w / 2]) g.push(geoEntre([x, 0, z0], [x, h, z1], 0.0035, 3));
        g.push(geoEntre([-w / 2, h, z1], [w / 2, h, z1], 0.0035, 3), geoEntre([-w / 2, 0, z1], [w / 2, 0, z1], 0.0035, 3));
    }
    return mergeGeometries(g);
});
/** Un puente de cable con su comba, de a a b. */
function geoComba(a, b, comba) {
    const pts = [];
    for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push(new THREE.Vector3(lerp(a[0], b[0], u), lerp(a[1], b[1], u) - comba * 4 * u * (1 - u), lerp(a[2], b[2], u))); }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.0055, 5, false);
}
/** La parábola de un claro como curva de three.js. */
const puntosClaro = (a, b, f, z, n = 18) => claro(a, b, f, n).map(([x, y]) => new THREE.Vector3(x, y, z));

export function construir(M, P, { movil = false, oscuro = false } = {}) {
    const raiz = new THREE.Group();
    const ids = PARTES.map(p => p.id);
    const kit = crearAyudante(M, raiz, ids, { movil });
    const { partes, giran, unidad, mover, brillo, cub, rotular } = kit;
    const colorSuelo = oscuro ? '#f2efe8' : P.tinta;
    const plano = (padre, texto, x, z, ancho, giro = 0, y = 0.02) => { const r = rotular(padre, texto, x, y, z, colorSuelo, ancho); r.rotation.set(-PI / 2, 0, giro); return r; };
    const malla = (geos, m) => sombra(new THREE.Mesh(mergeGeometries(geos), m));
    const aislador = (padre, x, y, z, h, r = 0.04) => padre.add(en(sombra(new THREE.Mesh(geoPorcelana(h, r), M.porcelana)), x, y, z));

    // --------- el terreno: una malla de alturas, con el derecho de vía despejado, y los cortes
    {
        const [nx, nz] = movil ? [140, 40] : [200, 56];
        const pos = [];
        const col = [];
        const idx = [];
        const c = new THREE.Color();
        const [cBase, cVerde, cBrecha, cOrilla] = [new THREE.Color('#ffffff'), new THREE.Color('#dfe6cf'), new THREE.Color('#efe7d4'), new THREE.Color('#d9cfb4')];
        for (let j = 0; j <= nz; j++) {
            const z = lerp(Z0, Z1, j / nz);
            for (let i = 0; i <= nx; i++) {
                const x = lerp(X0, X1, i / nx);
                pos.push(x, terreno(x, z), z);
                const enDerecho = ZL.some(zl => Math.abs(z - zl) < 0.98);
                c.copy(cBase).lerp(cVerde, enDerecho ? 0.15 : 0.75);
                if (enDerecho) c.lerp(cBrecha, 0.55);
                if (Math.abs(x - X.rio) < 0.42) c.lerp(cOrilla, 0.8 * clamp01(1 - Math.abs(x - X.rio) / 0.42));
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
        const suelo = new THREE.Mesh(g, M.terreno);
        suelo.receiveShadow = true;
        raiz.add(suelo);
        const linea = (n, f) => Array.from({ length: n + 1 }, (_, i) => f(i / n));
        raiz.add(falda(linea(200, u => { const x = lerp(X0, X1, u); return [x, terreno(x, Z0), Z0]; }), M.roca));
        raiz.add(falda(linea(200, u => { const x = lerp(X0, X1, u); return [x, terreno(x, Z1), Z1]; }), M.roca));
        raiz.add(falda(linea(50, u => { const z = lerp(Z0, Z1, u); return [X0, terreno(X0, z), z]; }), M.roca));
        raiz.add(falda(linea(50, u => { const z = lerp(Z0, Z1, u); return [X1, terreno(X1, z), z]; }), M.roca));
        // el río: una lámina en el fondo del valle, que cruza todo el corredor
        const rio = new THREE.Mesh(new THREE.PlaneGeometry(0.34, Z1 - Z0 - 0.02, 1, 30).rotateX(-PI / 2), M.agua);
        const pr = rio.geometry.attributes.position;
        for (let i = 0; i < pr.count; i++) { const x = X.rio + pr.getX(i); const z = pr.getZ(i); pr.setX(i, x + 0.06 * Math.sin(z * 1.3)); pr.setY(i, terreno(X.rio, z) + 0.035); }
        rio.geometry.computeVertexNormals();
        raiz.add(rio);
        // el agua vista en el corte de enfrente
        raiz.add(falda([[X.rio - 0.17, terreno(X.rio, Z1) + 0.035, Z1 + 0.002], [X.rio + 0.17, terreno(X.rio, Z1) + 0.035, Z1 + 0.002]], M.agua, terreno(X.rio, Z1) - 0.05));
    }

    // --------- árboles y matorrales: fuera del derecho de vía, árboles; adentro, solo matorral bajo
    const verde = new THREE.Group();
    raiz.add(verde);
    {
        const troncos = [];
        const copas = [];
        const matas = [];
        for (let i = 0; i < (movil ? 70 : 110); i++) {
            const x = lerp(X0 + 0.25, X1 - 0.25, azar(i, 11));
            const z = lerp(Z0 + 0.2, Z1 - 0.2, azar(i, 12));
            if (Math.abs(x) > 6.15) continue; // las subestaciones
            if (Math.abs(x - X.rio) < 0.22) continue;
            const y = terreno(x, z);
            if (ZL.some(zl => Math.abs(z - zl) < 1.02)) {
                if (azar(i, 13) < 0.5 && Math.abs(x - X.fuego) > 0.5) matas.push(new THREE.IcosahedronGeometry(0.05 + 0.03 * azar(i, 14), 0).translate(x, y + 0.04, z));
                continue;
            }
            const h = 0.22 + 0.2 * azar(i, 15);
            troncos.push(new THREE.CylinderGeometry(0.015, 0.022, h, 5).translate(x, y + h / 2, z));
            copas.push(new THREE.IcosahedronGeometry(0.14 + 0.09 * azar(i, 16), 0).translate(x, y + h + 0.08, z));
        }
        verde.add(malla(troncos, M.madera), malla(copas, M.hoja));
        if (matas.length) verde.add(malla(matas, M.hoja));
    }

    // --------- el derecho de vía: sus orillas y la brecha de mantenimiento
    const derecho = unidad('derecho');
    {
        const orillas = [];
        const brechas = [];
        for (const zl of ZL) {
            for (const s of [-1, 1]) {
                const z = zl + s * 0.98;
                for (let x = -6.05; x < 6.05; x += 0.22) orillas.push(geoEntre([x, terreno(x, z) + 0.012, z], [x + 0.12, terreno(x + 0.12, z) + 0.012, z], 0.008, 3));
            }
            const pos = [];
            const idx = [];
            const n = 160;
            for (let i = 0; i <= n; i++) {
                const x = lerp(-6.1, 6.1, i / n);
                for (const dz of [-0.07, 0.07]) pos.push(x, terreno(x, zl + dz) + 0.008, zl + dz);
                if (i) { const a = (i - 1) * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
            }
            const g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
            g.setIndex(idx);
            g.computeVertexNormals();
            brechas.push(g);
        }
        derecho.add(new THREE.Mesh(mergeGeometries(orillas), M.borde));
        const b = new THREE.Mesh(mergeGeometries(brechas), M.brecha);
        b.receiveShadow = true;
        derecho.add(b);
        plano(derecho, 'Derecho de vía', X.torres[2] - 1.3, ZL[0] + 0.72, 1.4);
    }

    // --------- las torres
    const torres = [[], []]; // por línea: { g, x, y }
    const suspension = unidad('suspension');
    const remate = unidad('remate');
    const segunda = unidad('segunda');
    const aisladores = unidad('aisladores');
    const tierras = unidad('tierras');
    const guarda = unidad('guarda');
    const geoS = geoTorreH(false);
    const geoR = geoTorreH(true);
    const hCadena = Y.cruceta - Y.fase;
    ZL.forEach((zl, i) => {
        X.torres.forEach((x, k) => {
            const y = terreno(x, zl);
            const esRemate = k === 0 || k === X.torres.length - 1;
            const padre = i === 1 ? segunda : esRemate ? remate : suspension;
            const t = new THREE.Group();
            t.position.set(x, y, zl);
            padre.add(t);
            const cuerpo = sombra(new THREE.Mesh(esRemate ? geoR : geoS, M.torre));
            t.add(cuerpo);
            // zapatas
            for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) t.add(en(caja(0.05, 0.03, 0.05, M.concreto), sx * 0.2 * (esRemate ? 1.45 : 1), -0.015, sz * 0.24 * (esRemate ? 1.45 : 1)));
            // cadenas de aisladores: de suspensión (verticales) o de remate (horizontales, a los dos lados). Las de la torre del punto clave
            // van en su propio grupo, en coordenadas del mundo, para poder elegirlas.
            const elegida = i === 0 && k === 1;
            for (const dz of FASES) {
                if (esRemate) {
                    for (const s of [-1, 1]) {
                        const c = sombra(new THREE.Mesh(geoPolimero(hCadena * 1.1), M.polimero));
                        c.rotation.z = (s * PI) / 2;
                        c.position.set(s * 0.04, Y.cruceta - 0.035, dz);
                        t.add(c);
                    }
                    t.add(geoBajante(dz, i));
                } else {
                    const c = sombra(new THREE.Mesh(geoPolimero(hCadena - 0.01), M.polimero));
                    const yugo = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.012, SEP + 0.03), M.aluminio));
                    if (elegida) {
                        c.position.set(x, y + Y.cruceta, zl + dz);
                        yugo.position.set(x, y + Y.fase + 0.004, zl + dz);
                        aisladores.add(c, yugo);
                    } else {
                        c.position.set(0, Y.cruceta, dz);
                        yugo.position.set(0, Y.fase + 0.004, dz);
                        t.add(c, yugo);
                    }
                }
            }
            torres[i].push({ t, x, y, esRemate });
        });
    });
    function geoBajante(dz, i) {
        // en las de remate, el puente que pasa la corriente de la punta de una cadena a la de la otra, por debajo de la cruceta
        const pts = puenteRemate({ x: 0, y: Y.cruceta - 0.035, ancho: CADENA_REMATE }).map(([x, y]) => new THREE.Vector3(x, y, dz));
        return sombra(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, 0.0055, 5, false), M.cables[i]));
    }
    // tierras: contra-antenas y varillas en las cuatro patas de cada torre de la línea 1; se ven como por rayos X al elegirlas
    {
        const g = [];
        for (const { x, y } of torres[0]) {
            const zl = ZL[0];
            for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
                const [px, pz] = [x + sx * 0.2, zl + sz * 0.24];
                const [qx, qz] = [x + sx * 0.75, zl + sz * 0.52];
                g.push(geoEntre([px, y - 0.025, pz], [qx, terreno(qx, qz) - 0.025, qz], 0.006, 4));
                g.push(geoEntre([qx, terreno(qx, qz) - 0.025, qz], [qx, terreno(qx, qz) - 0.17, qz], 0.008, 4));
            }
        }
        const m = new THREE.Mesh(mergeGeometries(g), M.tierras);
        m.renderOrder = 4;
        tierras.add(m);
    }

    // --------- los hilos de guarda, de pico a pico (su flecha no cambia con la corriente)
    {
        const g = [];
        ZL.forEach(zl => {
            for (const dz of GUARDAS) {
                const z = zl + dz;
                const A = [{ x: X.marcoA, y: Y.marco + 0.2, ancho: 0 }, ...X.torres.map(x => ({ x, y: terreno(x, zl) + Y.guarda, ancho: 0 })), { x: X.marcoB, y: Y.marco + 0.2, ancho: 0 }];
                for (let k = 1; k < A.length; k++) g.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(puntosClaro(A[k - 1], A[k], 6.5, z, 14)), 16, 0.006, 4, false));
            }
        });
        guarda.add(malla(g, M.guarda));
        // una de las fibras ópticas va en el hilo de guarda: su caja de empalme en la torre 2
        const t1 = torres[0][1];
        guarda.add(en(caja(0.05, 0.05, 0.03, M.galv), t1.x + 0.06, t1.y + 0.5, ZL[0]));
    }

    // --------- las subestaciones
    const salida = unidad('salida');
    const llegada = unidad('llegada');
    const reactor = unidad('reactor');
    const banderas = { A: [[], []], B: [[], []] }; // por lado, por línea: tres banderas, una por fase
    const puentes = [];
    const interruptores = { A: [[], []], B: [[], []] };
    for (const [lado, padre, xm, xi, xb, sg] of [['A', salida, X.marcoA, X.intA, X.barraA, -1], ['B', llegada, X.marcoB, X.intB, X.barraB, 1]]) {
        const x0 = sg < 0 ? X0 + 0.05 : 6.25;
        const x1 = sg < 0 ? -6.25 : X1 - 0.05;
        const grava = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.03, 4.9).translate(0, -0.012, 0), M.grava);
        grava.position.set((x0 + x1) / 2, 0.006, 0);
        grava.receiveShadow = true;
        padre.add(grava);
        // la cerca
        const cerca = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.22).translate(0, 0.11, 0), M.malla);
        for (const [cxx, cz, w, giro] of [[(x0 + x1) / 2, -2.45, x1 - x0, 0], [(x0 + x1) / 2, 2.45, x1 - x0, 0], [sg < 0 ? x1 : x0, -1.7, 1.5, PI / 2], [sg < 0 ? x1 : x0, 1.7, 1.5, PI / 2]]) {
            const c = cerca.clone();
            c.scale.x = w;
            c.position.set(cxx, 0, cz);
            c.rotation.y = giro;
            padre.add(c);
        }
        ZL.forEach((zl, i) => {
            // el marco donde rematan las líneas: dos columnas y una viga, de celosía galvanizada
            for (const s of [-1, 1]) padre.add(en(sombra(new THREE.Mesh(geoCelosia(Y.marco + 0.08, 0.12), M.galv)), xm, 0, zl + s * 0.82));
            padre.add(en(sombra(new THREE.Mesh(geoViga(1.64), M.galv)), xm, Y.marco, zl));
            // los picos donde rematan los hilos de guarda
            for (const zg of GUARDAS) padre.add(sombra(new THREE.Mesh(geoEntre([xm, Y.marco + 0.07, zl + zg], [xm, Y.marco + 0.2, zl + zg], 0.009, 5), M.galv)));
            for (const [j, dz] of FASES.entries()) {
                const c = sombra(new THREE.Mesh(geoPolimero(0.22), M.polimero));
                c.rotation.z = (-sg * PI) / 2;
                c.position.set(xm - sg * 0.04, Y.marco - 0.04, zl + dz);
                padre.add(c);
                // interruptor de tanque, uno por fase (en 400 kV abren cada fase por separado)
                const tq = new THREE.Group();
                tq.position.set(xi, 0, zl + dz);
                tq.add(en(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.3, 16).rotateZ(PI / 2), M.camara)), 0, 0.36, 0));
                for (const s of [-1, 1]) {
                    tq.add(en(caja(0.035, 0.32, 0.035, M.galv), s * 0.1, 0, 0));
                    const b = new THREE.Group();
                    b.position.set(s * 0.09, 0.4, 0);
                    b.rotation.z = -s * 0.22;
                    b.add(sombra(new THREE.Mesh(geoPorcelana(0.16, 0.03), M.porcelana)));
                    tq.add(b);
                }
                const bandera = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.006), M.bandera);
                bandera.position.set(0, 0.47, 0.07);
                tq.add(bandera);
                padre.add(tq);
                banderas[lado][i].push(bandera);
                interruptores[lado][i].push(tq);
                // los puentes: de la punta de la cadena del marco (donde remata el cable) al interruptor, y del interruptor a su barra
                const k = sg < 0 ? 0 : X.torres.length + 1;
                puentes.push(geoComba(BORNES[`l${i + 1}-${k}-${j}-${sg < 0 ? 'sale' : 'llega'}`], BORNES[`int${lado}${i + 1}-${j}-linea`], 0.05));
                puentes.push(geoComba(BORNES[`int${lado}${i + 1}-${j}-barra`], BORNES[`barra${lado}${i + 1}-${j}`], 0.04));
            }
        });
        // las barras de 400 kV
        for (const dz of [-0.12, 0, 0.12]) {
            padre.add(en(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 4.4, 10).rotateX(PI / 2), M.aluminio)), xb + dz, Y.barra, 0));
        }
        for (const z of [-1.9, 0, 1.9]) for (const dz of [-0.12, 0, 0.12]) aislador(padre, xb + dz, 0, z, Y.barra - 0.02, 0.026);
        // la caseta de control
        const cxs = sg < 0 ? X.casetaA : X.casetaB;
        padre.add(en(caja(0.5, 0.28, 0.4, M.muro), cxs, 0, sg < 0 ? 2.05 : 2.05));
        padre.add(en(caja(0.54, 0.03, 0.44, M.techo), cxs, 0.28, 2.05));
        padre.add(en(caja(0.1, 0.06, 0.005, M.ventana), cxs - 0.12, 0.15, 2.05 + 0.201));
        plano(padre, sg < 0 ? 'Minatitlán Dos' : 'Temascal Dos', sg < 0 ? -7.35 : 7.35, sg < 0 ? -2.15 : -2.15, 1.3);
        brillo(padre, cxs + 0.3, 0.45, 2.3, 0.9, '#ffd9a0', 'noche', 0.5);
    }
    salida.add(malla(puentes.slice(0, puentes.length / 2), M.puente));
    llegada.add(malla(puentes.slice(puentes.length / 2), M.puente));
    // los reactores: uno por línea, en la subestación de llegada, del lado de la línea
    const reactores = [];
    ZL.forEach(zl => {
        const z = zl > 0 ? 2.1 : -2.1;
        const g = new THREE.Group();
        g.position.set(X.reactor, 0, z);
        const tanque = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.3).translate(0, 0.19, 0), cub('reactor', ['reactor'], { color: '#8f999d', metal: 0.35 }));
        tanque.castShadow = true;
        g.add(tanque);
        g.add(en(caja(0.46, 0.03, 0.34, M.concreto), 0, 0, 0));
        // adentro: el núcleo y la bobina
        g.add(en(cil(0.09, 0.24, M.cobre), 0, 0.06, 0));
        g.add(en(cil(0.04, 0.27, M.nucleo), 0, 0.05, 0));
        // radiadores
        for (const s of [-1, 1]) for (let k = 0; k < 4; k++) g.add(en(caja(0.012, 0.26, 0.08, M.trafo), s * 0.24, 0.05, -0.12 + k * 0.08));
        // boquilla y su tapa, que sube al desarmar
        const tapa = new THREE.Group();
        tapa.add(en(caja(0.43, 0.02, 0.31, M.trafo), 0, 0.36, 0));
        tapa.add(en(sombra(new THREE.Mesh(geoPorcelana(0.3, 0.03), M.porcelana)), 0, 0.38, 0));
        g.add(mover(tapa, [0, 0.45, 0]));
        reactor.add(g);
        reactores.push({ g, z });
        brillo(g, 0, 0.75, 0, 0.5, '#7d5cff', 'reactor', 0.9, false);
    });
    // del lado de la línea: de la punta de la cadena del marco, donde remata la fase de afuera, a la boquilla del reactor
    reactor.add(malla(ZL.map((zl, i) => geoComba(BORNES[`l${i + 1}-${X.torres.length + 1}-${faseReactor(i)}-llega`], BORNES[`reactor${i + 1}`], 0.04)), M.puente));

    // --------- los cables: dos por fase, de apoyo en apoyo; se rehacen cuando cambia la flecha
    const conductores = unidad('haz');
    const separadores = unidad('separadores');
    const amortiguadores = unidad('amortiguadores');
    const grupoCable = [new THREE.Group(), new THREE.Group()];
    conductores.add(grupoCable[0]);
    segunda.add(grupoCable[1]);
    const mallaCable = [null, null];
    const mallaSep = [null, null];
    const ultimaFlecha = [NaN, NaN];
    const caminos = [[], []]; // por línea y fase: puntos para lo que corre
    function rehacer(i, f) {
        const zl = ZL[i];
        const A = apoyos(zl);
        const geos = [];
        const seps = [];
        caminos[i] = [];
        for (const dz of FASES) {
            const camino = [];
            for (let k = 1; k < A.length; k++) {
                for (const s of [-1, 1]) geos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(puntosClaro(A[k - 1], A[k], f, zl + dz + (s * SEP) / 2)), 22, 0.0055, 5, false));
                const pts = claro(A[k - 1], A[k], f, 22);
                pts.forEach(([x, y], j) => { if (j || k === 1 || A[k - 1].remate) camino.push([x, y, zl + dz]); });
                // en las torres de remate, la corriente sigue por el puente de abajo de la cruceta
                if (A[k].remate && k < A.length - 1) for (const [x, y] of puenteRemate(A[k]).slice(1, -1)) camino.push([x, y, zl + dz]);
                // separadores a lo largo del claro (en las torres, el primero a 25 o 30 m)
                if (!A[k - 1].marco && !A[k].marco) for (const u of [0.2, 0.5, 0.8]) { const [x, y] = claro(A[k - 1], A[k], f, 20)[Math.round(u * 20)]; seps.push(new THREE.BoxGeometry(0.012, 0.012, SEP + 0.012).translate(x, y, zl + dz)); }
            }
            caminos[i].push(camino);
        }
        if (mallaCable[i]) { grupoCable[i].remove(mallaCable[i]); mallaCable[i].geometry.dispose(); }
        mallaCable[i] = sombra(new THREE.Mesh(mergeGeometries(geos), M.cables[i]));
        grupoCable[i].add(mallaCable[i]);
        if (mallaSep[i]) { (i === 0 ? separadores : segunda).remove(mallaSep[i]); mallaSep[i].geometry.dispose(); }
        mallaSep[i] = new THREE.Mesh(mergeGeometries(seps), M.aluminio);
        (i === 0 ? separadores : segunda).add(mallaSep[i]);
        // las pesas, a 0.26 de cada torre, sobre el cable
        const pg = [];
        for (const dz of FASES) for (let k = 1; k < A.length; k++) {
            const [a, b] = [A[k - 1], A[k]];
            const [xa, xb] = [a.x + a.ancho, b.x - b.ancho];
            const u = 0.26 / (xb - xa);
            for (const s of [-1, 1]) {
                if (!a.marco) pesa(pg, xa + 0.26, alturaEn(a, b, f, u), zl + dz + (s * SEP) / 2);
                if (!b.marco) pesa(pg, xb - 0.26, alturaEn(a, b, f, 1 - u), zl + dz + (s * SEP) / 2);
            }
        }
        if (mallaPesas[i]) { (i === 0 ? amortiguadores : segunda).remove(mallaPesas[i]); mallaPesas[i].geometry.dispose(); }
        mallaPesas[i] = new THREE.Mesh(mergeGeometries(pg), M.galv);
        (i === 0 ? amortiguadores : segunda).add(mallaPesas[i]);
        ultimaFlecha[i] = f;
    }
    // amortiguadores tipo Stockbridge: dos pesas colgadas del cable, cerca de cada grapa; siguen al cable cuando baja
    const mallaPesas = [null, null];
    const pesa = (g, x, y, z) => {
        g.push(geoEntre([x, y, z], [x, y - 0.035, z], 0.003, 3));
        g.push(geoEntre([x - 0.04, y - 0.035, z], [x + 0.04, y - 0.035, z], 0.0025, 3));
        g.push(new THREE.CylinderGeometry(0.009, 0.009, 0.03, 8).rotateZ(PI / 2).translate(x - 0.045, y - 0.035, z));
        g.push(new THREE.CylinderGeometry(0.011, 0.011, 0.035, 8).rotateZ(PI / 2).translate(x + 0.048, y - 0.035, z));
    };
    // la cota de la flecha, en el claro del punto clave: de lo más bajo del cable al suelo
    const cota = new THREE.Group();
    {
        const barra = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 6).translate(0, 0.5, 0), M.cota);
        const puntas = [0, 1].map(() => new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.05, 8), M.cota));
        puntas[1].rotation.x = PI;
        cota.add(barra, ...puntas);
        cota.userData = { barra, puntas };
        cota.renderOrder = 8;
        raiz.add(cota);
    }
    const letreroCota = letreroVivo(oscuro ? '#f2efe8' : P.guinda, movil);
    raiz.add(letreroCota.s);

    // --------- lo que corre: en las subestaciones por crearTubos; en los claros, por su propia curva
    const tubos = crearTubos({ raiz, lineas: LINEAS, fluidos: FLUIDOS, M, partes, parteDe: () => null, movil });
    const porFase = movil ? 34 : 46;
    const energia = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), M.particula, 2 * 3 * porFase);
    energia.frustumCulled = false;
    energia.renderOrder = 3;
    const cEnergia = new THREE.Color(FLUIDOS.alta.color);
    const cFalla = new THREE.Color(FLUIDOS.falla.color);
    for (let k = 0; k < energia.count; k++) energia.setColorAt(k, cEnergia);
    raiz.add(energia);
    const fasesEnergia = [0, 0];

    // --------- el rayo, el arco del aislador y el incendio
    const T1 = torres[0][1];
    const golpe = [T1.x, T1.y + Y.guarda, ZL[0] + GUARDAS[1]];
    const rayoG = [];
    {
        let p0 = [golpe[0] - 0.6, 4.2, golpe[2] + 0.5];
        for (let i = 1; i <= 8; i++) { const u = i / 8; const p1 = [lerp(golpe[0] - 0.6, golpe[0], u) + (azar(i, 9) - 0.5) * 0.3 * (1 - u), lerp(4.2, golpe[1], u), lerp(golpe[2] + 0.5, golpe[2], u) + (azar(i, 8) - 0.5) * 0.2 * (1 - u)]; rayoG.push(geoEntre(p0, p1, 0.03, 4)); p0 = p1; }
    }
    const rayo = new THREE.Mesh(mergeGeometries(rayoG), M.rayo);
    rayo.renderOrder = 7;
    raiz.add(rayo);
    brillo(raiz, ...golpe, 0.9, '#ffe066', 'rayo', 1.5, false);
    // el arco salta por fuera del aislador, de la cruceta al cable
    const zA = ZL[0] + FASES[2];
    const zigzag = (a, b, n, k, r = 0.006) => { const g = []; let p = a; for (let i = 1; i <= n; i++) { const u = i / n; const q = [lerp(a[0], b[0], u) + (i < n ? (azar(i, k) - 0.5) * 0.06 : 0), lerp(a[1], b[1], u), lerp(a[2], b[2], u) + (i < n ? (azar(i, k + 3) - 0.5) * 0.06 : 0)]; g.push(geoEntre(p, q, r, 4)); p = q; } return mergeGeometries(g); };
    const arcosAisl = [0, 1, 2].map(k => { const m = new THREE.Mesh(zigzag([T1.x + 0.02, T1.y + Y.cruceta, zA + 0.04], [T1.x + 0.02, T1.y + Y.fase, zA + 0.04], 6, k + 20, 0.011), M.arco); m.renderOrder = 7; m.visible = false; raiz.add(m); return m; });
    brillo(raiz, T1.x, T1.y + (Y.fase + Y.cruceta) / 2, zA, 0.55, '#7d5cff', 'arco', 1.4, false);
    // el incendio bajo las dos líneas: llamas, humo, el suelo quemado y los arcos del cable al suelo
    const fuego = new THREE.Group();
    raiz.add(fuego);
    const llamas = [];
    for (let i = 0; i < (movil ? 30 : 46); i++) {
        const x = X.fuego + (azar(i, 31) - 0.5) * 0.9;
        const z = lerp(-1.9, 1.9, azar(i, 32));
        const y = terreno(x, z);
        const l = new THREE.Mesh(new THREE.ConeGeometry(0.07 + 0.04 * azar(i, 33), 0.34, 6).translate(0, 0.17, 0), i % 3 ? M.fuego : M.llama);
        l.position.set(x, y, z);
        l.renderOrder = 6;
        fuego.add(l);
        llamas.push({ l, h: azar(i, 34) });
    }
    // el suelo quemado: una mancha que sigue la forma del terreno
    (() => {
        const pos = [];
        const idx = [];
        const [n, m] = [14, 40];
        for (let j = 0; j <= m; j++) for (let i = 0; i <= n; i++) {
            const u = i / n - 0.5;
            const w = j / m - 0.5;
            const x = X.fuego + u * 1.2;
            const z = w * 4.2;
            pos.push(x, terreno(x, z) + 0.012, z);
            // solo las celdas dentro del óvalo, con la orilla un poco dispareja
            const rc = Math.hypot((i - 0.5) / n - 0.5, ((j - 0.5) / m - 0.5)) * 2;
            if (i && j && rc < 0.92 + 0.08 * azar(i, j)) { const a = (j - 1) * (n + 1) + i - 1; idx.push(a, a + n + 1, a + 1, a + 1, a + n + 1, a + n + 2); }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setIndex(idx);
        g.computeVertexNormals();
        const q = new THREE.Mesh(g, M.quemado);
        q.renderOrder = 1;
        raiz.add(q);
    })();
    const humos = [];
    for (let i = 0; i < (movil ? 10 : 16); i++) {
        const s = new THREE.Sprite(M.vaho.humo);
        s.renderOrder = 6;
        raiz.add(s);
        humos.push({ s, x: X.fuego + (azar(i, 41) - 0.5) * 0.8, z: lerp(-1.8, 1.8, azar(i, 42)), fase: azar(i, 43) });
    }
    brillo(raiz, X.fuego, 0.25, 0, 2.2, '#ff8a1f', 'fuego', 0.9, false);
    ZL.forEach(zl => brillo(raiz, X.fuego + 0.05, 0.45, zl, 0.8, '#7d5cff', 'arco', 1.2, false));
    // los arcos por el humo: del cable de cada línea al suelo
    const arcosFuego = ZL.map((zl, i) => [0, 1, 2].map(k => {
        const z = zl + FASES[i === 0 ? 0 : 2];
        const m = new THREE.Mesh(zigzag([X.fuego + 0.1, 0.78, z], [X.fuego, terreno(X.fuego, z) + 0.02, z], 8, k + 50 + i * 7, 0.013), M.arco);
        m.renderOrder = 7;
        m.visible = false;
        raiz.add(m);
        return m;
    }));

    // --------- al desarmar: los cables y los hilos suben, las cadenas suben, los reactores abren
    for (const [g, d] of [[conductores, [0, 0.55, 0]], [separadores, [0, 0.55, 0]], [amortiguadores, [0, 0.45, 0]], [guarda, [0, 0.9, 0]], [aisladores, [0, 0.3, 0]], [tierras, [0, -0.25, 0]]]) mover(g, d);
    kit.cerrarGotas(new THREE.SphereGeometry(1, 8, 6));

    const anclas = {};
    for (const p of PARTES) {
        const o = new THREE.Object3D();
        o.position.set(...p.ancla);
        raiz.add(o);
        anclas[p.id] = o;
    }

    // ---------- posar
    const m4 = new THREE.Matrix4();
    const q0 = new THREE.Quaternion();
    const v3 = new THREE.Vector3();
    const s3 = new THREE.Vector3();
    const gris = MATERIAL_CONDUCTOR().color;
    const grisClaro = new THREE.Color('#8a8d94');
    const rojo = new THREE.Color('#ff5a1f');
    const puntoEn = (camino, u) => {
        const n = camino.length - 1;
        const x = u * n;
        const i = Math.min(n - 1, Math.floor(x));
        const k = x - i;
        const a = camino[i];
        const b = camino[i + 1];
        return v3.set(lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k));
    };
    function posar(e) {
        const n = e.noche;
        const L = e.lectura;
        const act = p => (p === 'noche' ? n : p === 'siempre' ? 1 : p === 'reactor' ? e.reactor : p ? (e.activo[p] ?? 0) : 1);
        const a = sale(e.desarme * 3);
        const ab = { ...(e.abierta || {}) };
        kit.posar(e, act, ab, { apagar: a });
        tubos.posar(e, a);
        // la flecha de cada línea
        e.lineas.forEach((l, i) => {
            const f = l.flecha;
            if (!(Math.abs(f - ultimaFlecha[i]) < 0.02)) rehacer(i, f);
            // el calor se ve en el color del cable
            const caliente = clamp01((l.temp - 55) / 70);
            M.cables[i].color.copy(oscuro ? grisClaro : gris).lerp(rojo, caliente * 0.75);
            M.cables[i].emissive.copy(rojo).multiplyScalar(caliente * 0.55);
        });
        // lo que corre por los claros
        e.lineas.forEach((l, i) => {
            fasesEnergia[i] += e.dt * (0.2 + 0.8 * l.flujo) * 0.05;
            caminos[i].forEach((camino, j) => {
                const cerrada = l.fases[j] > 0;
                for (let p = 0; p < porFase; p++) {
                    const k = (i * 3 + j) * porFase + p;
                    const visible = cerrada && l.flujo > 0.01 && a < 0.5 && camino.length > 1;
                    if (visible) puntoEn(camino, fract(p / porFase + fasesEnergia[i])).y += 0.012;
                    else v3.set(0, -7, 0);
                    s3.setScalar(visible ? 0.016 : 0.0001);
                    energia.setMatrixAt(k, m4.compose(v3, q0, s3));
                    energia.setColorAt(k, l.falla ? cFalla : cEnergia);
                }
            });
        });
        energia.instanceMatrix.needsUpdate = true;
        energia.instanceColor.needsUpdate = true;
        // interruptores: verde cerrado, rojo abierto (por fase)
        e.lineas.forEach((l, i) => {
            l.fases.forEach((c, j) => {
                banderas.A[i][j].material = c ? M.bandera : M.banderaAbierta;
                const cB = c && !(e.extremoB === 0);
                banderas.B[i][j].material = cB ? M.bandera : M.banderaAbierta;
            });
        });
        // la cota de la flecha, en el claro del punto clave
        {
            const i = 0;
            const zl = ZL[i];
            const A = apoyos(zl);
            const k = 3; // entre la segunda y la tercera torre (índices de apoyos: 0 marco, 1..5 torres)
            const f = e.lineas[0].flecha;
            const mid = claro(A[k], A[k + 1], f, 2)[1];
            const z = zl + FASES[2] + 0.05;
            const yS = terreno(mid[0], z);
            const { barra, puntas } = cota.userData;
            barra.position.set(mid[0], yS, z);
            barra.scale.y = Math.max(0.01, mid[1] - yS);
            puntas[0].position.set(mid[0], mid[1] - 0.025, z);
            puntas[1].position.set(mid[0], yS + 0.025, z);
            const ver = (e.modo === 'calor' || (ab.flecha ?? 0) > 0.5) && a < 0.3;
            cota.visible = ver;
            letreroCota.s.visible = ver;
            if (ver) {
                letreroCota.s.position.set(mid[0] + 0.3, (mid[1] + yS) / 2, z + 0.1);
                letreroCota.poner(`${Math.round(L.libre ?? 26.2 - f)} m`);
            }
        }
        // los reactores
        reactores.forEach(r => { r.g.visible = true; });
        // las tierras se ven como por rayos X al elegirlas o al ver por dentro
        const rx = Math.max(e.adentro, ab.tierras ?? 0);
        M.tierras.depthTest = rx < 0.5;
        M.tierras.opacity = rx > 0.5 ? 0.95 : 1;
        // el rayo y el arco del aislador
        M.rayo.opacity = e.rayo > 0.5 ? 0.7 + 0.3 * Math.sin(e.t * 60) : 0;
        rayo.visible = M.rayo.opacity > 0.02 && a < 0.5;
        const k3 = Math.floor(e.t * 24) % 3;
        arcosAisl.forEach((m, i) => { m.visible = e.arcoA > 0.05 && i === k3 && a < 0.5; });
        // el incendio
        const fu = e.fuego;
        fuego.visible = fu > 0.01 && a < 0.5;
        M.quemado.opacity = 0.55 * clamp01(fu * 2);
        llamas.forEach(({ l, h }, i) => {
            const s = fu * (0.6 + 0.5 * Math.abs(Math.sin(e.t * (5 + h * 4) + i)));
            l.scale.set(1, Math.max(0.01, s), 1);
        });
        M.vaho.humo.opacity = 0.55 * fu;
        humos.forEach(hm => {
            hm.s.visible = fu > 0.02 && a < 0.5;
            if (!hm.s.visible) return;
            const u = fract(e.t * 0.12 + hm.fase);
            hm.s.position.set(hm.x + u * 0.5, 0.2 + u * 1.6, hm.z + Math.sin(e.t + hm.fase * 6) * 0.05);
            hm.s.scale.setScalar(0.3 + u * 0.9);
        });
        arcosFuego.forEach((lista, i) => lista.forEach((m, k) => { m.visible = e.arcos[i] > 0.05 && k === k3 && a < 0.5; }));
        M.lampara.color.set('#9a9c9f').lerp(new THREE.Color('#ffe2ad'), n);
        M.ventana.color.set('#3f4a57').lerp(new THREE.Color('#ffc77a'), n);
    }
    // primera vez: los cables con la flecha de 25 °C
    rehacer(0, flechaA(25));
    rehacer(1, flechaA(25));
    return { raiz, posar, partes, anclas, giran, repintar: kit.repintar };
}

/** Un letrero que cambia de texto y siempre mira a la cámara. */
function letreroVivo(color, movil) {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 96;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
    s.scale.set(0.5, 0.1875, 1);
    s.renderOrder = 9;
    let ahora = '';
    return {
        s,
        poner(texto) {
            if (texto === ahora) return;
            ahora = texto;
            const x = c.getContext('2d');
            x.clearRect(0, 0, 256, 96);
            x.font = `600 ${movil ? 64 : 58}px Fraunces, Georgia, serif`;
            x.textAlign = 'center';
            x.textBaseline = 'middle';
            x.fillStyle = color;
            x.fillText(texto, 128, 50);
            tex.needsUpdate = true;
        },
    };
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
