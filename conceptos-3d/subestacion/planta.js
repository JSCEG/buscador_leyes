// La subestación, hecha con código. Sistema Búho: un predio con su cerca y su grava, y debajo la red de tierras. Por la izquierda llegan las
// dos líneas de 115 kV a su marco; cada una pasa por apartarrayos, cuchillas, transformadores de corriente e interruptor hasta las barras.
// El transformador baja a 13.8 kV, las barras de 13.8 kV reparten a cuatro circuitos, y el primero llega a la colonia. Las cubiertas se
// vuelven vidrio (adentro = 1) y cada equipo se separa en sus piezas (desarme = 1).
//
//   materiales(P)     escenario(renderer, scene, M, { movil, oscuro })
//   construir(M, P, { movil, oscuro }) → { raiz, posar(e), partes, anclas, giran, repintar }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { azar, clamp01, fract, lerp, sale } from '../planta-comun/ayudas.js';
import { caja, cil, crearAyudante, crearTubos, en, estudio, geoEntre, geoTorre, materialesBase, sombra, texturaGrano } from '../planta-comun/piezas.js';
import { BLOQUE, CAMBIADOR, CAPAC, CASETA, CERCA, COLONIA, FASE_A, FASE_M, FLUIDOS, LINEAS, PARTES, X, Y, ZF, ZL } from './modelo.js';

const PI = Math.PI;
export const P_PLANTA = {
    papel: '#fafafa', noche: '#0a0e12', tinta: '#171317', marfil: '#f3f1ec', grafito: '#303137', acero: '#a7abb3', guinda: '#9b2247', rosa: '#e57a9a',
    tierraDia: '#d6d7c8', tierraNoche: '#23272c', losaDia: '#dcdcda', losaNoche: '#2c3036', suelo: '#b9a688',
};

export function materiales(P) {
    const M = materialesBase(P, FLUIDOS);
    Object.assign(M, {
        terreno: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#ffffff', 'rgba(0,0,0,0.05)', [8, 3]), roughness: 0.96, envMapIntensity: 0.25 }),
        roca: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#b9a688', 'rgba(70,52,30,0.18)', [7, 1]), roughness: 0.96, envMapIntensity: 0.25 }),
        porcelana: new THREE.MeshStandardMaterial({ color: '#8b5a43', roughness: 0.32, metalness: 0.05, envMapIntensity: 0.9 }),
        galv: new THREE.MeshStandardMaterial({ color: '#b3b8be', roughness: 0.42, metalness: 0.75, envMapIntensity: 0.9 }),
        marco: new THREE.MeshStandardMaterial({ color: '#9ea4ab', roughness: 0.45, metalness: 0.7, envMapIntensity: 0.8 }),
        aluminio: new THREE.MeshStandardMaterial({ color: '#d6dade', roughness: 0.28, metalness: 0.85, envMapIntensity: 1 }),
        cable: new THREE.MeshStandardMaterial({ color: '#45474d', roughness: 0.55, metalness: 0.5 }),
        trafo: new THREE.MeshStandardMaterial({ color: '#8f999d', roughness: 0.5, metalness: 0.35, envMapIntensity: 0.8 }),
        camara: new THREE.MeshStandardMaterial({ color: '#c9cdd2', roughness: 0.3, metalness: 0.6, envMapIntensity: 0.9 }),
        nucleo: new THREE.MeshStandardMaterial({ color: '#4c5057', roughness: 0.45, metalness: 0.6 }),
        aspa: new THREE.MeshStandardMaterial({ color: '#3f4248', roughness: 0.5, metalness: 0.6, side: THREE.DoubleSide }),
        poste: new THREE.MeshStandardMaterial({ color: '#c4c1ba', roughness: 0.85, envMapIntensity: 0.3 }),
        muro: new THREE.MeshStandardMaterial({ color: '#ece6da', roughness: 0.8, envMapIntensity: 0.3 }),
        techo: new THREE.MeshStandardMaterial({ color: '#a4573d', roughness: 0.75, envMapIntensity: 0.3 }),
        malla: new THREE.MeshStandardMaterial({ color: '#9aa0a6', roughness: 0.5, metalness: 0.6, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }),
        tablero: new THREE.MeshStandardMaterial({ color: '#5a5e66', roughness: 0.5, metalness: 0.4 }),
        puerta: new THREE.MeshStandardMaterial({ color: P.guinda, roughness: 0.5, metalness: 0.2 }),
        casaVentana: new THREE.MeshBasicMaterial({ color: '#ffd27a', toneMapped: false }),
        bandera: new THREE.MeshBasicMaterial({ color: '#2b2b2b', toneMapped: false }),
        rayo: new THREE.MeshBasicMaterial({ color: '#ffd23f', toneMapped: false, transparent: true, opacity: 0, depthWrite: false }),
        chispa: new THREE.MeshBasicMaterial({ color: '#ffb000', toneMapped: false }),
        arco: new THREE.MeshBasicMaterial({ color: '#4f7dff', toneMapped: false }),
    });
    M.vaho = { calor: new THREE.SpriteMaterial({ map: M.vaho, color: '#c9b9a6', transparent: true, opacity: 0, depthWrite: false }) };
    return M;
}

const [X0, X1] = BLOQUE.x;
const [Z0, Z1] = BLOQUE.z;
const Y0 = BLOQUE.y[0];
export function escenario(renderer, scene, M, { movil = false, oscuro = false } = {}) {
    const P = M.P;
    const dia = { terreno: new THREE.Color(oscuro ? '#a2a497' : P.tierraDia), roca: new THREE.Color(oscuro ? '#c9c5bc' : '#ffffff'), concreto: new THREE.Color(oscuro ? '#a5a39c' : '#cfccc5') };
    const noche = { terreno: new THREE.Color(P.tierraNoche), roca: new THREE.Color('#6a655c'), concreto: new THREE.Color('#383c42') };
    if (oscuro) { M.torre.color.set('#8f929a'); M.cable.color.set('#8a8d94'); }
    return estudio(renderer, scene, {
        movil, oscuro, y0: Y0, alcance: 15,
        alActualizar(n) {
            M.terreno.color.copy(dia.terreno).lerp(noche.terreno, n);
            M.roca.color.copy(dia.roca).lerp(noche.roca, n);
            M.concreto.color.copy(dia.concreto).lerp(noche.concreto, n);
        },
    });
}

// ------------------------------------------------------------------ geometrías que se repiten
const memo = new Map();
const una = (k, f) => { if (!memo.has(k)) memo.set(k, f()); return memo.get(k); };
/** Columna de porcelana con sus faldas, base en y = 0. */
const geoAislador = (h, r) => una(`a${h}|${r}`, () => {
    const g = [new THREE.CylinderGeometry(r * 0.5, r * 0.55, h, 10).translate(0, h / 2, 0)];
    const n = Math.max(3, Math.round(h / 0.055));
    for (let i = 0; i < n; i++) g.push(new THREE.CylinderGeometry(r, r, 0.012, 14).translate(0, 0.03 + (i * (h - 0.06)) / (n - 1), 0));
    return mergeGeometries(g);
});
const geoColumna = (h, w = 0.07) => una(`c${h}|${w}`, () => mergeGeometries([new THREE.BoxGeometry(w, h, w).translate(0, h / 2, 0), new THREE.BoxGeometry(w * 2.2, 0.02, w * 2.2).translate(0, 0.01, 0)]));
/** Columna de celosía, base en y = 0. */
const geoCelosia = (h, a = 0.12) => una(`l${h}|${a}`, () => {
    const g = [];
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.push(geoEntre([sx * a / 2, 0, sz * a / 2], [sx * a / 2, h, sz * a / 2], 0.009, 4));
    const n = Math.max(3, Math.round(h / 0.18));
    for (let i = 0; i < n; i++) {
        const [y0, y1] = [(i * h) / n, ((i + 1) * h) / n];
        g.push(geoEntre([-a / 2, y0, -a / 2], [a / 2, y1, -a / 2], 0.004, 3), geoEntre([a / 2, y0, a / 2], [-a / 2, y1, a / 2], 0.004, 3));
        g.push(geoEntre([-a / 2, y0, a / 2], [-a / 2, y1, -a / 2], 0.004, 3), geoEntre([a / 2, y0, -a / 2], [a / 2, y1, a / 2], 0.004, 3));
    }
    return mergeGeometries(g);
});
/** Un conductor de a a b, con su comba. */
function geoConductor(a, b, r = 0.008, comba = 0) {
    if (!comba) return geoEntre(a, b, r, 5);
    const pts = [];
    for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push(new THREE.Vector3(lerp(a[0], b[0], u), lerp(a[1], b[1], u) - comba * 4 * u * (1 - u), lerp(a[2], b[2], u))); }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, r, 5, false);
}

export function construir(M, P, { movil = false, oscuro = false } = {}) {
    const raiz = new THREE.Group();
    const ids = PARTES.map(p => p.id);
    const kit = crearAyudante(M, raiz, ids, { movil });
    const { partes, giran, unidad, mover, brillo, cub, rotular } = kit;
    const colorSuelo = oscuro ? '#f2efe8' : P.tinta;
    const plano = (padre, texto, x, z, ancho, giro = 0, y = 0.02) => { const r = rotular(padre, texto, x, y, z, colorSuelo, ancho); r.rotation.set(-PI / 2, 0, giro); return r; };
    const malla = (geos, m) => sombra(new THREE.Mesh(mergeGeometries(geos), m));
    const aislador = (padre, x, y, z, h, r = 0.04) => padre.add(en(sombra(new THREE.Mesh(geoAislador(h, r), M.porcelana)), x, y, z));
    const columna = (padre, x, z, h, w = 0.07, m = M.galv) => padre.add(en(sombra(new THREE.Mesh(geoColumna(h, w), m)), x, 0, z));
    const conductores = { alta: [], media: [] };
    const cuerda = (nivel, a, b, comba = 0, r = nivel === 'alta' ? 0.008 : 0.006) => conductores[nivel].push(geoConductor(a, b, r, comba));

    // --------- el predio, la grava, la cerca y la red de tierras
    const cx = (CERCA.x[0] + CERCA.x[1]) / 2;
    const cz = (CERCA.z[0] + CERCA.z[1]) / 2;
    const [cw, cd] = [CERCA.x[1] - CERCA.x[0], CERCA.z[1] - CERCA.z[0]];
    {
        const fuera = new THREE.Shape([[X0, Z0], [X1, Z0], [X1, Z1], [X0, Z1]].map(([x, z]) => new THREE.Vector2(x, z)));
        fuera.holes.push(new THREE.Path([[CERCA.x[0], CERCA.z[0]], [CERCA.x[0], CERCA.z[1]], [CERCA.x[1], CERCA.z[1]], [CERCA.x[1], CERCA.z[0]]].map(([x, z]) => new THREE.Vector2(x, z))));
        const piso = new THREE.Mesh(new THREE.ShapeGeometry(fuera).rotateX(PI / 2), M.terreno);
        piso.position.y = -0.001;
        piso.receiveShadow = true;
        raiz.add(piso);
        const molde = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0 - 0.04, -Y0 - 0.04, Z1 - Z0 - 0.04), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
        molde.position.set((X0 + X1) / 2, Y0 / 2 - 0.02, (Z0 + Z1) / 2);
        molde.castShadow = true;
        raiz.add(molde);
        const pared = (w, d, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, -Y0, d), M.roca); m.position.set(x, Y0 / 2, z); m.receiveShadow = true; raiz.add(m); };
        pared(X1 - X0, 0.02, (X0 + X1) / 2, Z0 + 0.01);
        pared(X1 - X0, 0.02, (X0 + X1) / 2, Z1 - 0.01);
        pared(0.02, Z1 - Z0, X0 + 0.01, 0);
        pared(0.02, Z1 - Z0, X1 - 0.01, 0);
        // el fondo de tierra, que se ve cuando la grava se vuelve vidrio
        const fondo = new THREE.Mesh(new THREE.PlaneGeometry(cw, cd).rotateX(-PI / 2), M.roca);
        fondo.position.set(cx, -0.5, cz);
        raiz.add(fondo);
    }
    const tierras = unidad('tierras');
    {
        const grava = new THREE.Mesh(new THREE.BoxGeometry(cw, 0.04, cd).translate(0, -0.02, 0), cub('grava', ['tierras'], { color: '#c8c3b8' }));
        cubiertas_mapa(kit, 'grava', texturaGrano('#c9c4b9', 'rgba(60,50,40,0.28)', [10, 4]));
        grava.position.set(cx, 0.002, cz);
        grava.receiveShadow = true;
        tierras.add(grava);
        const g = [];
        for (let x = CERCA.x[0] + 0.2; x <= CERCA.x[1] - 0.1; x += 0.62) g.push(geoEntre([x, -0.08, CERCA.z[0] + 0.15], [x, -0.08, CERCA.z[1] - 0.15], 0.009, 4));
        for (let z = CERCA.z[0] + 0.15; z <= CERCA.z[1] - 0.1; z += 0.56) g.push(geoEntre([CERCA.x[0] + 0.2, -0.08, z], [CERCA.x[1] - 0.15, -0.08, z], 0.009, 4));
        for (const x of [CERCA.x[0] + 0.2, (CERCA.x[0] + CERCA.x[1]) / 2, CERCA.x[1] - 0.2]) for (const z of [CERCA.z[0] + 0.15, 0, CERCA.z[1] - 0.15]) g.push(geoEntre([x, -0.08, z], [x, -0.46, z], 0.012, 6));
        // bajantes: cada estructura va unida a la red
        for (const [x, z] of [[X.marco, ZL[0] - 0.42], [X.marco, ZL[1] + 0.42], [X.interruptor, ZL[0]], [X.interruptor, ZL[1]], [X.trafo + 0.5, 0.45], [X.interruptor13, ZF[0] + 0.3], [CAPAC.x, CAPAC.z + 0.3]]) g.push(geoEntre([x, 0.12, z], [x, -0.08, z], 0.007, 4));
        tierras.add(mover(malla(g, M.cobre), [0, -0.28, 0]));
        // la cerca, también unida a la red
        const c = [];
        const postes = [];
        for (let x = CERCA.x[0]; x <= CERCA.x[1] + 1e-6; x += (CERCA.x[1] - CERCA.x[0]) / 15) postes.push([x, CERCA.z[0]], [x, CERCA.z[1]]);
        for (let z = CERCA.z[0]; z <= CERCA.z[1] + 1e-6; z += (CERCA.z[1] - CERCA.z[0]) / 6) postes.push([CERCA.x[0], z], [CERCA.x[1], z]);
        for (const [x, z] of postes) c.push(geoEntre([x, 0, z], [x, 0.36, z], 0.009, 5));
        for (const [a, b] of [[[CERCA.x[0], CERCA.z[0]], [CERCA.x[1], CERCA.z[0]]], [[CERCA.x[0], CERCA.z[1]], [CERCA.x[1], CERCA.z[1]]], [[CERCA.x[0], CERCA.z[0]], [CERCA.x[0], CERCA.z[1]]], [[CERCA.x[1], CERCA.z[0]], [CERCA.x[1], CERCA.z[1]]]]) c.push(geoEntre([a[0], 0.36, a[1]], [b[0], 0.36, b[1]], 0.006, 4));
        tierras.add(malla(c, M.galv));
        const tela = (w, d, x, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w || d, 0.34), M.malla); m.position.set(x, 0.18, z); if (!w) m.rotation.y = PI / 2; tierras.add(m); };
        tela(cw, 0, cx, CERCA.z[0]);
        tela(cw, 0, cx, CERCA.z[1]);
        tela(0, cd, CERCA.x[0], cz);
        tela(0, cd, CERCA.x[1], cz);
    }

    // --------- 1 · las líneas de 115 kV: torres, cable de guarda y marco de remate
    const lineas = unidad('lineas');
    const torre = new THREE.Mesh(geoTorre(2.05, 0.3), M.torre);
    ZL.forEach((z, i) => {
        const t = sombra(torre.clone());
        t.position.set(X.torre, 0, z);
        t.rotation.y = PI / 2;
        lineas.add(t);
        const marco = new THREE.Group();
        for (const s of [-1, 1]) marco.add(en(sombra(new THREE.Mesh(geoCelosia(Y.marco + 0.12, 0.11), M.marco)), X.marco, 0, z + s * 0.45));
        marco.add(en(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.02), M.marco)), X.marco, Y.marco + 0.08, z));
        // aisladores de suspensión del marco y de la torre
        for (const dz of FASE_A) {
            marco.add(en(sombra(new THREE.Mesh(geoAislador(0.12, 0.03), M.porcelana)), X.marco, Y.marco - 0.09, z + dz));
            lineas.add(en(sombra(new THREE.Mesh(geoAislador(0.12, 0.03), M.porcelana)), X.torre, Y.torre - 0.08, z + dz * 1.15));
            cuerda('alta', [X0 + 0.02, Y.torre - 0.05, z + dz * 1.15], [X.torre, Y.torre - 0.08, z + dz * 1.15], 0.05);
            cuerda('alta', [X.torre, Y.torre - 0.08, z + dz * 1.15], [X.marco, Y.marco - 0.09, z + dz], 0.1);
            cuerda('alta', [X.marco, Y.marco - 0.09, z + dz], [X.apartarrayos + 0.12, Y.contacto, z + dz], 0.04);
        }
        // cable de guarda: arriba de todo, contra los rayos
        cuerda('alta', [X0 + 0.02, 2.12, z], [X.torre, 2.05, z], 0.04, 0.004);
        cuerda('alta', [X.torre, 2.05, z], [X.marco, Y.marco + 0.14, z], 0.06, 0.004);
        lineas.add(marco);
        plano(raiz, i ? 'De Jalapa II' : 'De Jalapa I', X.torre + 0.08, z + 0.78 * (i ? 1 : -1), 1.2);
    });

    // --------- piezas de 115 kV, una por fase
    const apartarrayos = unidad('apartarrayos');
    const cuchillas = unidad('cuchillas');
    const medicion = unidad('medicion');
    const interruptor = unidad('interruptor');
    const pararrayos = (padre, x, z, alto, base, r = 0.045) => {
        columna(padre, x, z, base, 0.07);
        aislador(padre, x, base, z, alto, r);
        const anillo = new THREE.Mesh(new THREE.TorusGeometry(r * 1.6, r * 0.18, 6, 20).rotateX(PI / 2), M.aluminio);
        padre.add(en(anillo, x, base + alto + 0.01, z));
    };
    /** Cuchilla de una fase, a lo largo de x: dos columnas y una navaja que se levanta para abrir. */
    const cuchilla = (padre, xa, xb, z, yc, h, r = 0.035, tierra = false, propia = true) => {
        const base = yc - h - 0.05;
        if (propia) columna(padre, (xa + xb) / 2, z, base, 0.06);
        padre.add(en(sombra(new THREE.Mesh(new THREE.BoxGeometry(xb - xa + 0.08, 0.035, 0.05), M.galv)), (xa + xb) / 2, base + 0.017, z));
        aislador(padre, xa, base + 0.03, z, h - 0.02, r);
        aislador(padre, xb, base + 0.03, z, h - 0.02, r);
        for (const x of [xa, xb]) padre.add(en(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.04), M.aluminio)), x, yc - 0.01, z));
        const piv = new THREE.Group();
        piv.position.set(xa, yc + 0.012, z);
        piv.add(en(sombra(new THREE.Mesh(new THREE.BoxGeometry(xb - xa, 0.014, 0.022), M.aluminio)), (xb - xa) / 2, 0, 0));
        padre.add(piv);
        let tierraPiv = null;
        if (tierra) {
            tierraPiv = new THREE.Group();
            tierraPiv.position.set(xb + 0.02, base + 0.05, z + 0.05);
            tierraPiv.add(en(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.012, yc - base - 0.06, 0.012), M.galv)), 0, (yc - base - 0.06) / 2, 0));
            tierraPiv.rotation.z = -PI / 2 + 0.15;
            padre.add(tierraPiv);
        }
        return { piv, tierraPiv };
    };
    /** Interruptor de tanque: el SF6 y los contactos van dentro de un tanque aterrizado; entra y sale por dos boquillas. */
    const tanqueMuerto = (padre, x, z) => {
        padre.add(en(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.38, 18).rotateZ(PI / 2), M.camara)), x, 0.52, z));
        for (const s of [-1, 1]) {
            padre.add(en(caja(0.04, 0.45, 0.04, M.galv), x + s * 0.13, 0, z));
            const b = new THREE.Group();
            b.position.set(x + s * 0.11, 0.57, z);
            b.rotation.z = -s * 0.22;
            b.add(sombra(new THREE.Mesh(geoAislador(0.5, 0.036), M.porcelana)));
            b.add(en(cil(0.02, 0.04, M.aluminio), 0, 0.5, 0));
            padre.add(b);
        }
    };
    const bornaT = (x, s) => [x + s * (0.11 + Math.sin(0.22) * 0.52), 0.57 + Math.cos(0.22) * 0.52];
    const tcFase = (padre, x, z, base, h) => {
        columna(padre, x, z, base, 0.08);
        aislador(padre, x, base, z, h, 0.055);
        padre.add(en(cil(0.06, 0.12, M.trafo), x, base + h, z));
    };
    const mecanismo = (padre, x, z) => {
        const g = new THREE.Group();
        g.add(en(caja(0.18, 0.3, 0.14, M.galv), 0, 0.12, 0));
        g.add(en(caja(0.04, 0.12, 0.04, M.galv), 0, 0, 0));
        const bandera = new THREE.Group();
        bandera.position.set(0.091, 0.34, 0);
        bandera.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.06, 0.016), M.bandera), 0, 0.03, 0));
        g.add(bandera);
        g.position.set(x, 0, z);
        padre.add(g);
        return bandera;
    };
    const bahia = (z, conLinea) => {
        for (const dz of FASE_A) {
            const zz = z + dz;
            if (conLinea) {
                pararrayos(apartarrayos, X.apartarrayos, zz, 0.48, 0.62);
                cuchilla(cuchillas, X.cuchillaLinea - 0.17, X.cuchillaLinea + 0.17, zz, Y.contacto, 0.42, 0.035, true);
                tcFase(medicion, X.tc, zz, 0.5, 0.52);
                tanqueMuerto(interruptor, X.interruptor, zz);
                cuchilla(cuchillas, X.cuchillaBarra - 0.17, X.cuchillaBarra + 0.17, zz, Y.contacto, 0.42);
                cuerda('alta', [X.apartarrayos + 0.12, Y.contacto, zz], [X.cuchillaLinea - 0.17, Y.contacto, zz]);
                cuerda('alta', [X.cuchillaLinea + 0.17, Y.contacto, zz], [X.tc, Y.contacto - 0.06, zz], 0.02);
                const [bi, yb] = bornaT(X.interruptor, -1);
                const [bd] = bornaT(X.interruptor, 1);
                cuerda('alta', [X.tc, Y.contacto - 0.06, zz], [bi, yb, zz], 0.02);
                cuerda('alta', [bd, yb, zz], [X.cuchillaBarra - 0.17, Y.contacto, zz], 0.02);
                cuerda('alta', [X.apartarrayos, 1.12, zz], [X.apartarrayos + 0.12, Y.contacto, zz]);
            } else {
                cuchilla(cuchillas, X.cuchillaBanco - 0.17, X.cuchillaBanco + 0.17, zz, Y.contacto, 0.42);
                tanqueMuerto(interruptor, X.interruptorBanco, zz);
                const [bi, yb] = bornaT(X.interruptorBanco, -1);
                const [bd] = bornaT(X.interruptorBanco, 1);
                cuerda('alta', [X.cuchillaBanco + 0.17, Y.contacto, zz], [bi, yb, zz], 0.02);
                cuerda('alta', [bd, yb, zz], [X.boqAlta, Y.boqAlta, zz * 0.9], 0.04);
                pararrayos(apartarrayos, X.interruptorBanco + 0.42, zz, 0.42, 0.5, 0.04);
                cuerda('alta', [X.interruptorBanco + 0.42, 0.95, zz], [X.interruptorBanco + 0.5, 1.22, zz * 0.95]);
            }
        }
        mecanismo(interruptor, conLinea ? X.interruptor + 0.2 : X.interruptorBanco + 0.2, z + 0.42);
    };
    ZL.forEach(z => bahia(z, true));
    bahia(0, false);

    // --------- 6 · barras de 115 kV y los transformadores de potencial
    const barras = unidad('barras');
    X.barra.forEach((x, k) => {
        barras.add(en(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 4.6, 10).rotateX(PI / 2), M.aluminio)), x, Y.barra, 0));
        for (const z of [-2.1, -0.65, 0.65, 2.1]) { columna(barras, x, z, 1.0, 0.06); aislador(barras, x, 1.0, z, Y.barra - 1.02, 0.035); }
        // de cada bahía a su barra: suben y pasan por encima de las otras dos fases
        for (const z of ZL) { const zz = z + FASE_A[k]; cuerda('alta', [X.cuchillaBarra + 0.17, Y.contacto, zz], [X.cuchillaBarra + 0.17, Y.barra + 0.14, zz]); cuerda('alta', [X.cuchillaBarra + 0.17, Y.barra + 0.14, zz], [x, Y.barra, zz], 0.02); }
        cuerda('alta', [x, Y.barra, FASE_A[k]], [x, Y.barra + 0.14, FASE_A[k]]);
        cuerda('alta', [x, Y.barra + 0.14, FASE_A[k]], [X.cuchillaBanco - 0.17, Y.barra + 0.14, FASE_A[k]]);
        cuerda('alta', [X.cuchillaBanco - 0.17, Y.barra + 0.14, FASE_A[k]], [X.cuchillaBanco - 0.17, Y.contacto, FASE_A[k]]);
        tcFase(medicion, x, -2.48, 0.48, 0.46);
        cuerda('alta', [x, Y.barra, -2.28], [x, 1.06, -2.48], 0.01);
    });
    plano(raiz, 'Barras de 115 kV', X.barra[1] - 0.05, 2.55, 1.3);

    // --------- 7 · el transformador
    const trafo = unidad('transformador');
    const cambiador = unidad('cambiador');
    const XT = X.trafo;
    let tapLetrero = null;
    {
        trafo.add(en(caja(1.2, 0.06, 1.2, M.concreto), XT, 0, 0));
        const tanque = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.86, 0.7).translate(0, 0.43, 0), cub('trafo', ['transformador', 'cambiador'], { color: '#8f999d', metal: 0.35 }));
        tanque.position.set(XT, 0.06, 0);
        tanque.castShadow = true;
        trafo.add(tanque);
        const tapa = new THREE.Group();
        tapa.add(en(caja(0.86, 0.03, 0.74, M.trafo), XT, 0.92, 0));
        // boquillas: tres altas de 115 kV y cuatro bajas (tres fases y el neutro)
        FASE_A.forEach(dz => { aislador(tapa, X.boqAlta, 0.95, dz * 0.9, 0.42, 0.04); tapa.add(en(cil(0.02, 0.04, M.aluminio), X.boqAlta, 1.37, dz * 0.9)); });
        FASE_M.forEach(dz => aislador(tapa, X.boqBaja, 0.95, dz * 1.5, 0.2, 0.032));
        aislador(tapa, X.boqBaja, 0.95, 0.3, 0.14, 0.028);
        // tanque conservador, con el relevador Buchholz en su tubo
        tapa.add(en(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.56, 18).rotateX(PI / 2), M.trafo)), XT - 0.05, 1.26, 0.04));
        for (const z of [-0.18, 0.24]) tapa.add(en(caja(0.03, 0.26, 0.03, M.galv), XT - 0.05, 0.95, z));
        tapa.add(en(sombra(new THREE.Mesh(geoEntre([XT - 0.05, 1.18, -0.05], [XT - 0.05, 0.96, -0.05], 0.014, 8), M.trafo)), 0, 0, 0));
        tapa.add(en(caja(0.05, 0.05, 0.05, M.guinda), XT - 0.05, 1.06, -0.05));
        trafo.add(mover(tapa, [0, 0.62, 0]));
        // radiadores y ventiladores
        for (const s of [-1, 1]) {
            const banco = new THREE.Group();
            const r = [];
            for (let i = 0; i < 7; i++) r.push(new THREE.BoxGeometry(0.018, 0.56, 0.2).translate(XT - 0.3 + i * 0.1, 0.48, s * 0.47));
            r.push(new THREE.CylinderGeometry(0.018, 0.018, 0.72, 8).rotateZ(PI / 2).translate(XT, 0.78, s * 0.39), new THREE.CylinderGeometry(0.018, 0.018, 0.72, 8).rotateZ(PI / 2).translate(XT, 0.2, s * 0.39));
            banco.add(malla(r, M.trafo));
            [-0.17, 0.17].forEach((dx, i) => {
                const aro = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.008, 6, 20).rotateX(PI / 2), M.aspa);
                banco.add(en(aro, XT + dx, 0.15, s * 0.47));
                const rotor = new THREE.Group();
                rotor.position.set(XT + dx, 0.15, s * 0.47);
                for (let k = 0; k < 4; k++) { const aspa = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.004, 0.025).translate(0.035, 0, 0), M.aspa); aspa.rotation.set(0.35, (k * PI) / 2, 0); rotor.add(aspa); }
                banco.add(rotor);
                const etapa = i + 1;
                giran.push({ obj: rotor, eje: 'y', vel: e => (e.etapa >= etapa && e.desarme < 0.5 ? 26 : 0) });
            });
            trafo.add(mover(banco, [0, 0, s * 0.5]));
        }
        // por dentro: el núcleo y los tres devanados
        const dentro = new THREE.Group();
        dentro.add(malla([new THREE.BoxGeometry(0.1, 0.07, 0.62).translate(XT, 0.16, 0), new THREE.BoxGeometry(0.1, 0.07, 0.62).translate(XT, 0.8, 0), ...FASE_A.map(dz => new THREE.BoxGeometry(0.08, 0.62, 0.08).translate(XT, 0.48, dz * 1.05))], M.nucleo));
        FASE_A.forEach(dz => { dentro.add(en(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 20).translate(0, 0.25, 0), M.cobre)), XT, 0.22, dz * 1.05)); });
        trafo.add(dentro);
        brillo(trafo, XT, 0.55, 0, 0.9, '#ff9a5c', 'calor', 0.5, false);
        // el cambiador de derivaciones, en su compartimiento, y el gabinete que lo mueve, con su indicador
        const cg = new THREE.Group();
        const comp = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.56, 0.3).translate(0, 0.28, 0), cub('cambiador', ['cambiador'], { color: '#8f999d', metal: 0.35 }));
        comp.position.set(X.trafo + 0.48, 0.24, -0.16);
        comp.castShadow = true;
        cg.add(comp);
        const sel = cg;
        sel.add(en(cil(0.07, 0.42, M.camara), X.trafo + 0.48, 0.3, -0.16));
        for (let i = 0; i < 9; i++) sel.add(en(caja(0.01, 0.02, 0.01, M.cobre), X.trafo + 0.48 + Math.cos((i / 9) * 2 * PI) * 0.072, 0.38 + (i % 3) * 0.1, -0.16 + Math.sin((i / 9) * 2 * PI) * 0.072));
        cambiador.add(mover(cg, [0.45, 0, 0]));
        cambiador.add(en(caja(0.1, 0.22, 0.18, M.galv), X.trafo + 0.47, 0, 0.2));
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 96;
        const tx = new THREE.CanvasTexture(c);
        tx.colorSpace = THREE.SRGBColorSpace;
        const pant = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.11), new THREE.MeshBasicMaterial({ map: tx, toneMapped: false }));
        pant.position.set(X.trafo + 0.522, 0.14, 0.2);
        pant.rotation.y = PI / 2;
        cambiador.add(pant);
        let ultimo = null;
        tapLetrero = n => {
            if (n === ultimo) return;
            ultimo = n;
            const x = c.getContext('2d');
            x.fillStyle = '#16181d';
            x.fillRect(0, 0, 128, 96);
            x.fillStyle = '#ffd27a';
            x.font = '700 50px Manrope, sans-serif';
            x.textAlign = 'center';
            x.textBaseline = 'middle';
            x.fillText(`${n > 0 ? '+' : ''}${n}`, 64, 42);
            x.font = '600 16px Manrope, sans-serif';
            x.fillStyle = '#c8d0da';
            x.fillText(`de ±${CAMBIADOR.pasos}`, 64, 80);
            tx.needsUpdate = true;
        };
        tapLetrero(0);
    }
    const vahos = [];
    for (let i = 0; i < 6; i++) { const s = new THREE.Sprite(M.vaho.calor); s.visible = false; raiz.add(s); vahos.push({ s, x: X.trafo - 0.25 + (i % 3) * 0.25, z: (i < 3 ? -1 : 1) * 0.47, fase: azar(i, 3) }); }

    // --------- 9 · barras de 13.8 kV, barra de interconexión y cuchillas de paso
    const barras13 = unidad('barras13');
    const alimentadores = unidad('alimentadores');
    X.barra13.forEach((x, k) => {
        barras13.add(en(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 4.5, 10).rotateX(PI / 2), M.aluminio)), x, Y.barra13, 0));
        for (const z of [-2.15, -1.1, 0, 1.1, 2.15]) { columna(barras13, x, z, 0.78, 0.05); aislador(barras13, x, 0.78, z, Y.barra13 - 0.8, 0.028); }
        const xi = X.interconexion[k];
        barras13.add(en(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, ZF[0] - ZF[3] + 0.5, 10).rotateX(PI / 2), M.aluminio)), xi, Y.interconexion, (ZF[0] + ZF[3]) / 2));
        for (const z of [ZF[3] - 0.25, (ZF[3] + ZF[2]) / 2, (ZF[2] + ZF[1]) / 2, (ZF[1] + ZF[0]) / 2, ZF[0] + 0.25]) { columna(barras13, xi, z, 1.05, 0.05); aislador(barras13, xi, 1.05, z, Y.interconexion - 1.07, 0.026); }
    });
    plano(raiz, 'Barras de 13.8 kV', X.barra13[1] + 0.95, 2.55, 1.3);
    // el interruptor de 13.8 kV del transformador
    const tanqueChico = (padre, x, z, nombre, abre) => {
        const g = new THREE.Group();
        for (const [dx, dz] of [[-0.12, -0.14], [0.12, -0.14], [-0.12, 0.14], [0.12, 0.14]]) g.add(en(caja(0.025, 0.5, 0.025, M.galv), x + dx, 0, z + dz));
        const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.34).translate(0, 0.1, 0), cub(nombre, abre, { color: '#b9bec4', metal: 0.6 }));
        cuerpo.position.set(x, 0.5, z);
        cuerpo.castShadow = true;
        g.add(cuerpo);
        const contactos = [];
        FASE_M.forEach(dz => {
            for (const dx of [-0.07, 0.07]) aislador(g, x + dx, 0.7, z + dz, 0.2, 0.022);
            g.add(en(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 8).rotateZ(PI / 2), M.cobre), x - 0.04, 0.6, z + dz));
            const movil = new THREE.Group();
            movil.position.set(x + 0.06, 0.6, z + dz);
            movil.add(en(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 8).rotateZ(PI / 2), M.cobre), -0.045, 0, 0));
            g.add(movil);
            contactos.push(movil);
        });
        padre.add(g);
        return { g, contactos, bandera: mecanismo(padre, x, z - 0.28) };
    };
    tanqueChico(alimentadores, X.interruptorBaja, 0, 'int13b', ['alimentadores']);
    FASE_M.forEach((dz, k) => {
        cuerda('media', [X.boqBaja, Y.boqBaja, dz * 1.5], [X.interruptorBaja - 0.07, 0.9, dz], 0.03);
        cuerda('media', [X.interruptorBaja + 0.07, 0.9, dz], [X.barra13[k], Y.barra13, dz], 0.02);
    });
    // los cuatro circuitos: cuchilla, interruptor, cuchilla, apartarrayos, y la cuchilla de paso hacia la barra de interconexión
    const circuitos = [];
    ZF.forEach((zf, i) => {
        const marco = [];
        for (const x of [X.cuchilla13 - 0.18, X.cuchillaSal + 0.18]) for (const s of [-1, 1]) marco.push(geoEntre([x, 0, zf + s * 0.22], [x, 0.7, zf + s * 0.22], 0.016, 5));
        for (const s of [-1, 1]) marco.push(geoEntre([X.cuchilla13 - 0.18, 0.7, zf + s * 0.22], [X.cuchillaSal + 0.18, 0.7, zf + s * 0.22], 0.014, 5));
        for (const x of [X.cuchilla13, X.cuchillaSal]) marco.push(geoEntre([x, 0.69, zf - 0.22], [x, 0.69, zf + 0.22], 0.012, 5));
        alimentadores.add(malla(marco, M.marco));
        const navs = { barra: [], linea: [], tierra: [], paso: [] };
        FASE_M.forEach((dz, k) => {
            const z = zf + dz;
            const a = cuchilla(cuchillas, X.cuchilla13 - 0.15, X.cuchilla13 + 0.15, z, Y.contacto13, 0.22, 0.024, true, false);
            const b = cuchilla(cuchillas, X.cuchillaSal - 0.15, X.cuchillaSal + 0.15, z, Y.contacto13, 0.22, 0.024, true, false);
            navs.barra.push(a.piv); navs.linea.push(b.piv); navs.tierra.push(a.tierraPiv, b.tierraPiv);
            cuerda('media', [X.barra13[k], Y.barra13, z], [X.cuchilla13 - 0.15, Y.contacto13, z], 0.01);
            cuerda('media', [X.cuchilla13 + 0.15, Y.contacto13, z], [X.interruptor13 - 0.07, 0.9, z]);
            cuerda('media', [X.interruptor13 + 0.07, 0.9, z], [X.cuchillaSal - 0.15, Y.contacto13, z]);
            cuerda('media', [X.cuchillaSal + 0.15, Y.contacto13, z], [X.apartarrayos13, Y.contacto13, z]);
            pararrayos(apartarrayos, X.apartarrayos13, z, 0.22, 0.6, 0.026);
            cuerda('media', [X.apartarrayos13, Y.contacto13, z], [X.postes[0], Y.poste, z], 0.03);
            // la cuchilla de paso: de la línea del circuito a la barra de interconexión
            const xi = X.interconexion[k];
            barras13.add(en(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.03), M.aluminio)), xi, Y.contacto13 + 0.01, z));
            const piv = new THREE.Group();
            piv.position.set(xi, Y.contacto13 + 0.015, z);
            piv.add(en(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.012, Y.interconexion - Y.contacto13 - 0.02, 0.016), M.aluminio)), 0, (Y.interconexion - Y.contacto13 - 0.02) / 2, 0));
            barras13.add(piv);
            navs.paso.push(piv);
        });
        const int = tanqueChico(alimentadores, X.interruptor13, zf, `int13_${i}`, ['alimentadores']);
        circuitos.push({ ...navs, ...int });
        plano(raiz, `Circuito ${i + 1}`, X.postes[0] + 0.45, zf + 0.28, 0.75, 0, 0.012);
    });

    // --------- 11 · el banco de capacitores
    const capacitores = unidad('capacitores');
    const navCap = [];
    {
        const g = [];
        for (const [dx, dz] of [[-0.36, -0.2], [0.36, -0.2], [-0.36, 0.2], [0.36, 0.2]]) g.push(geoEntre([CAPAC.x + dx, 0, CAPAC.z + dz], [CAPAC.x + dx, 0.62, CAPAC.z + dz], 0.016, 5));
        for (const y of [0.32, 0.62]) for (const dz of [-0.2, 0.2]) g.push(geoEntre([CAPAC.x - 0.36, y, CAPAC.z + dz], [CAPAC.x + 0.36, y, CAPAC.z + dz], 0.012, 5));
        capacitores.add(malla(g, M.marco));
        capacitores.add(en(caja(0.78, 0.02, 0.46, M.galv), CAPAC.x, 0.32, CAPAC.z));
        capacitores.add(en(caja(0.78, 0.02, 0.46, M.galv), CAPAC.x, 0.62, CAPAC.z));
        for (let i = 0; i < 6; i++) {
            const [x, y] = [CAPAC.x - 0.24 + (i % 3) * 0.24, i < 3 ? 0.34 : 0.64];
            capacitores.add(en(caja(0.12, 0.17, 0.2, M.aluminio), x, y, CAPAC.z));
            aislador(capacitores, x, y + 0.17, CAPAC.z, 0.07, 0.016);
        }
        FASE_M.forEach((dz, k) => {
            const a = cuchilla(capacitores, X.barra13[2] + 0.09, X.barra13[2] + 0.35, CAPAC.z + dz, 0.92, 0.2, 0.022);
            navCap.push(a.piv);
            cuerda('media', [X.barra13[k], Y.barra13, -2.2], [X.barra13[2] + 0.09, 0.92, CAPAC.z + dz], 0.02);
            cuerda('media', [X.barra13[2] + 0.35, 0.92, CAPAC.z + dz], [CAPAC.x - 0.24 + k * 0.24, 0.88, CAPAC.z], 0.02);
        });
    }

    // --------- 12 · la caseta de control
    const caseta = unidad('caseta');
    {
        const [x0, x1] = CASETA.x;
        const [z0, z1] = CASETA.z;
        const [w, d] = [x1 - x0, z1 - z0];
        const xc = (x0 + x1) / 2;
        const zc = (z0 + z1) / 2;
        caseta.add(en(caja(w + 0.08, 0.04, d + 0.08, M.concreto), xc, 0, zc));
        const muros = new THREE.Mesh(new THREE.BoxGeometry(w, CASETA.h, d).translate(0, CASETA.h / 2, 0), cub('caseta', ['caseta'], { color: '#ece6da', metal: 0 }));
        muros.position.set(xc, 0.04, zc);
        muros.castShadow = true;
        caseta.add(muros);
        caseta.add(mover(en(caja(w + 0.1, 0.04, d + 0.1, M.galv), xc, CASETA.h + 0.04, zc), [0, 0.55, 0]));
        caseta.add(en(new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.34), M.puerta), xc + 0.45, 0.21, z1 + 0.002));
        for (const dx of [-0.5, -0.15]) caseta.add(en(new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.12), M.ventana), xc + dx, 0.36, z1 + 0.002));
        caseta.add(en(caja(0.18, 0.16, 0.08, M.galv), x0 + 0.2, 0.3, z1 + 0.04));
        // por dentro: los tableros de protección y control, con sus lámparas
        for (let i = 0; i < 6; i++) {
            const x = x0 + 0.18 + i * 0.22;
            caseta.add(en(caja(0.18, 0.42, 0.1, M.tablero), x, 0.05, z0 + 0.1));
            for (let k = 0; k < 3; k++) brillo(caseta, x - 0.04 + k * 0.04, 0.36, z0 + 0.16, 0.08, k === 1 ? '#f5c242' : '#5fd18a', 'siempre', 0.9, false);
        }
        caseta.add(en(caja(0.4, 0.2, 0.18, M.tablero), xc, 0.04, zc + 0.12));
        // la trinchera de cables hacia el patio
        caseta.add(en(caja(0.12, 0.02, 1.3, M.concreto), xc + 0.55, 0, z1 + 0.65));
    }

    // --------- 14 · los circuitos en sus postes y la colonia
    const colonia = unidad('colonia');
    const postes = [];
    X.postes.forEach((x, k) => ZF.forEach((zf, i) => {
        if (i > 0 && k > 2) return;
        postes.push([x, zf, i, k]);
    }));
    {
        const g = [];
        const c = [];
        for (const [x, zf] of postes) {
            g.push(new THREE.CylinderGeometry(0.022, 0.032, Y.poste + 0.1, 8).translate(x, (Y.poste + 0.1) / 2, zf - 0.02));
            c.push(new THREE.BoxGeometry(0.035, 0.03, 0.4).translate(x, Y.poste - 0.04, zf));
        }
        colonia.add(malla(g, M.poste));
        colonia.add(malla(c, M.galv));
        for (const [x, zf] of postes) for (const dz of FASE_M) aislador(colonia, x, Y.poste - 0.025, zf + dz, 0.04, 0.012);
        ZF.forEach((zf, i) => {
            const xs = i === 0 ? X.postes : X.postes.slice(0, 3);
            for (let k = 0; k < xs.length - 1; k++) for (const dz of FASE_M) cuerda('media', [xs[k], Y.poste, zf + dz], [xs[k + 1], Y.poste, zf + dz], 0.05);
        });
        plano(raiz, 'A la ciudad', X.postes[2] + 0.55, (ZF[2] + ZF[3]) / 2, 0.95, 0, 0.012);
        // transformador de poste: lo explica la red de distribución
        colonia.add(en(cil(0.045, 0.12, M.trafo), X.postes[3] + 0.06, 0.8, ZF[0] - 0.08));
        // casas, a los dos lados del circuito
        const casas = [];
        for (let i = 0; i < 8; i++) {
            const x = COLONIA.x[0] + 0.1 + (i % 4) * 0.72;
            const z = i < 4 ? 2.62 : 0.95;
            const w = 0.42 + azar(i, 3) * 0.1;
            const h = 0.22 + azar(i, 4) * 0.08;
            const casa = new THREE.Group();
            casa.add(en(caja(w, h, 0.34, M.muro), 0, 0, 0));
            const techo = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.27, 0.12, 4, 1).rotateY(PI / 4).scale(w / 0.37, 1, 0.34 / 0.37), M.techo));
            techo.position.y = h + 0.06;
            casa.add(techo);
            const lado = i < 4 ? -1 : 1;
            for (const dx of [-w / 4, w / 4]) casa.add(en(new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.07), M.casaVentana), dx, h * 0.55, lado * 0.171));
            casa.children.slice(-2).forEach(v => { v.rotation.y = lado > 0 ? 0 : PI; });
            casa.position.set(x, 0, z);
            colonia.add(casa);
            casas.push(casa);
            // la acometida, del poste a la casa
            const xp = X.postes.reduce((m, p) => (Math.abs(p - x) < Math.abs(m - x) ? p : m), X.postes[2]);
            cuerda('media', [xp, Y.poste - 0.3, ZF[0]], [x, h + 0.02, z - lado * 0.17], 0.03, 0.003);
        }
        for (const [x, zf, i, k] of postes) if (i === 0 && k > 1) brillo(colonia, x, Y.poste - 0.12, zf + 0.2, 0.3, '#ffd9a0', 'luz', 0.8);
        // árboles de adorno
        for (const [x, z] of [[5.9, -0.6], [7.6, -1.9], [8.05, 0.3], [4.2, -2.6], [-7.6, 2.5]]) {
            colonia.add(en(cil(0.025, 0.24, M.madera), x, 0, z));
            colonia.add(en(sombra(new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), M.hoja)), x, 0.38, z));
        }
    }
    // el árbol junto al circuito 1, con la rama que se le cae encima
    const arbol = new THREE.Group();
    arbol.add(en(cil(0.032, 0.62, M.madera), 0, 0, 0));
    arbol.add(en(sombra(new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 1), M.hoja)), 0, 0.82, 0));
    const rama = new THREE.Group();
    rama.position.set(0, 0.98, 0);
    rama.add(en(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.62, 6).translate(0, 0.31, 0), M.madera)), 0, 0, 0));
    rama.add(en(sombra(new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 0), M.hoja)), 0, 0.6, 0));
    arbol.add(rama);
    arbol.position.set(5, 0, ZF[0] + 0.4);
    colonia.add(arbol);
    // la chispa de la falla: una malla, porque un brillo casi no se ve sobre el papel claro
    const chispa = new THREE.Group();
    chispa.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.03, 0), M.chispa));
    for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.009, 0.16, 4).translate(0, 0.08, 0), M.chispa); r.rotation.set(azar(i, 2) * PI * 2, 0, azar(i, 3) * PI * 2); chispa.add(r); }
    chispa.renderOrder = 7;
    raiz.add(chispa);
    const brilloChispa = brillo(raiz, 5, Y.poste, ZF[0], 0.5, '#ffb000', 'falla', 1.3, false);

    // --------- el rayo y el arco
    const rayoG = [];
    let p0 = [X.torre + 0.5, 3.6, ZL[1] + 0.4];
    for (let i = 1; i <= 7; i++) { const p1 = [lerp(X.torre + 0.5, X.marco - 0.45, i / 7) + (azar(i, 9) - 0.5) * 0.3, lerp(3.6, Y.torre - 0.02, i / 7), ZL[1] + 0.4 - (i / 7) * 0.4 + (azar(i, 8) - 0.5) * 0.2]; rayoG.push(geoEntre(p0, p1, 0.014, 4)); p0 = p1; }
    const rayo = new THREE.Mesh(mergeGeometries(rayoG), M.rayo);
    rayo.renderOrder = 7;
    raiz.add(rayo);
    FASE_A.forEach(dz => brillo(raiz, X.apartarrayos, 1.08, ZL[1] + dz, 0.5, '#ffb000', 'rayo', 1.3, false));
    // el arco de una cuchilla que se abre con corriente: tres zigzags que se turnan
    const arcos = [0, 1, 2].map(k => {
        const g = [];
        let a = [X.cuchilla13 + 0.15, Y.contacto13 + 0.01, ZF[1]];
        for (let i = 1; i <= 5; i++) { const b = [X.cuchilla13 + 0.15 - i * 0.03, Y.contacto13 + 0.01 + i * 0.045, ZF[1] + (azar(i, k + 5) - 0.5) * 0.06]; g.push(geoEntre(a, b, 0.006, 4)); a = b; }
        const m = new THREE.Mesh(mergeGeometries(g), M.arco);
        m.renderOrder = 7;
        m.visible = false;
        raiz.add(m);
        return m;
    });
    brillo(raiz, X.cuchilla13 + 0.08, Y.contacto13 + 0.12, ZF[1], 0.5, '#5b8cff', 'arco', 1.4, false);

    // --------- los conductores, juntos en una malla por nivel de tensión; al desarmar se quitan
    const cables = [malla(conductores.alta, M.cable), malla(conductores.media, M.cable)];
    cables.forEach(c => raiz.add(c));
    // al desarmar, cada familia de equipos sube a su propia altura
    for (const [g, d] of [[apartarrayos, [0, 0.5, 0]], [cuchillas, [0, 0.85, 0]], [medicion, [0, 0.65, 0]], [interruptor, [0, 1.05, 0]], [barras, [0, 1.3, 0]], [barras13, [0, 1.1, 0]], [alimentadores, [0, 0.7, 0]], [capacitores, [0, 0.6, 0]], [lineas, [-0.5, 0, 0]]]) mover(g, d);

    // --------- lo que corre por los conductores
    const tubos = crearTubos({ raiz, lineas: LINEAS, fluidos: FLUIDOS, M, partes, parteDe: () => null, movil });
    kit.cerrarGotas(new THREE.SphereGeometry(1, 8, 6));

    // lámparas del patio, de noche
    for (const [x, z] of [[-5.6, -2.6], [-2.6, 2.6], [0.9, -2.6], [2.4, 2.6], [-6.8, 2.6]]) brillo(raiz, x, 0.62, z, 0.95, '#ffd9a0', 'noche', 0.45);

    const anclas = {};
    for (const p of PARTES) {
        const o = new THREE.Object3D();
        o.position.set(...p.ancla);
        raiz.add(o);
        anclas[p.id] = o;
    }

    // ---------- posar
    const colorVentana = new THREE.Color();
    const apagada = new THREE.Color('#4a4f57');
    const encendida = new THREE.Color('#ffd27a');
    const abrirNavaja = (piv, cerrada, angulo = 1.25) => { piv.rotation.z = (1 - cerrada) * angulo; };
    function posar(e) {
        const n = e.noche;
        const L = e.lectura;
        const act = p => (p === 'noche' ? n : p === 'siempre' ? 1 : p === 'calor' ? e.calor : p ? (e.activo[p] ?? 0) : 1);
        const a = sale(e.desarme * 3);
        const ab = { ...(e.abierta || {}) };
        kit.posar(e, act, ab, { apagar: a });
        tubos.posar(e, a);
        // el cambiador y sus ventiladores
        tapLetrero(e.tap);
        // los interruptores y las cuchillas de los circuitos
        circuitos.forEach((C, i) => {
            const cerrado = e.int[`a${i + 1}`] ?? 1;
            C.contactos.forEach(m => { m.position.x = X.interruptor13 + 0.06 + (1 - cerrado) * 0.05; });
            C.bandera.rotation.x = (1 - cerrado) * (PI / 2);
            const cuch = i === 1 ? e.cuch.a2b : 1;
            C.barra.forEach(p => abrirNavaja(p, cuch));
            C.linea.forEach(p => abrirNavaja(p, i === 1 ? e.cuch.a2l : 1));
            const tierra = i === 1 ? e.tierra : 0;
            C.tierra.forEach(p => { if (p) p.rotation.z = lerp(-PI / 2 + 0.15, 0, tierra); });
            const paso = i === 0 ? e.paso.a1 : i === 1 ? e.paso.a2 : 0;
            C.paso.forEach(p => { p.rotation.z = (1 - paso) * 1.1; });
        });
        navCap.forEach(p => abrirNavaja(p, e.int.cap));
        // el calor del transformador
        M.vaho.calor.opacity = 0.5 * e.calor * (1 - a);
        vahos.forEach(v => {
            v.s.visible = e.calor > 0.25 && a < 0.5;
            if (!v.s.visible) return;
            const u = fract(e.t * 0.35 + v.fase);
            v.s.position.set(v.x + Math.sin(e.t + v.fase * 6) * 0.03, 0.85 + u * 0.55, v.z);
            v.s.scale.setScalar(0.18 + u * 0.3);
        });
        // la colonia: luz en las ventanas
        colorVentana.copy(apagada).lerp(encendida, clamp01(e.luz1));
        M.casaVentana.color.copy(colorVentana);
        // la rama y la falla
        const xf = e.xFalla ?? 5;
        arbol.position.x = xf;
        const hayFalla = e.modo === 'falla' && L.t !== null;
        const toca = hayFalla && !e.rama;
        // arriba (sin falla), sobre el cable (falla) o en el suelo (ya cayó)
        const [ry, rx] = e.rama ? [0.06, PI / 2] : toca ? [0.98, 0.95] : [0.98, 0.35];
        const k = Math.min(1, e.dt * 9);
        rama.position.y = lerp(rama.position.y, ry, k);
        rama.rotation.x = lerp(rama.rotation.x, -rx, k);
        chispa.position.set(xf, Y.poste - 0.03, ZF[0] + 0.13);
        brilloChispa.position.copy(chispa.position);
        const parpadeo = 0.6 + 0.4 * Math.sin(e.t * 47) * Math.sin(e.t * 31);
        chispa.visible = e.chispa > 0 && a < 0.5;
        chispa.scale.setScalar(parpadeo);
        chispa.rotation.y = e.t * 9;
        // el rayo
        M.rayo.opacity = e.rayo > 0.55 ? 0.65 + 0.35 * Math.sin(e.t * 60) : 0;
        rayo.visible = M.rayo.opacity > 0.02 && a < 0.5;
        const k3 = Math.floor(e.t * 24) % 3;
        arcos.forEach((m, i) => { m.visible = e.arco > 0.05 && i === k3 && a < 0.5; });
        cables.forEach(c => { c.visible = a < 0.3; });
        M.lampara.color.set('#9a9c9f').lerp(new THREE.Color('#ffe2ad'), n);
        M.ventana.color.set('#3f4a57').lerp(new THREE.Color('#ffc77a'), n);
    }
    return { raiz, posar, partes, anclas, giran, repintar: kit.repintar };
}

/** La grava lleva textura sobre el material de cubierta que hace el ayudante. */
function cubiertas_mapa(kit, nombre, mapa) {
    const c = kit.cubiertas[nombre];
    if (!c) return;
    c.mat.map = mapa;
    c.mat.color.set('#ffffff');
    c.mat.needsUpdate = true;
}
