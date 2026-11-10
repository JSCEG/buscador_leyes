// El banco de autotransformadores AT42 de la Subestación Santa Cruz, hecho con código. Sistema Búho: tres unidades de una fase sobre sus
// bases, cada una con su tanque, su boquilla de 400 kV, su boquilla de 230 kV, su neutro a tierra, las boquillas del terciario (unidas en
// delta entre las tres), su cambiador de derivaciones, sus radiadores con ventiladores y su conservador con el relevador Buchholz. La
// fase C (la unidad AT421C de la tesis) se abre: adentro, el núcleo de tres piernas y los devanados terciario, común y serie. A la
// izquierda, la llegada de 400 kV con su interruptor y el tablero de la protección diferencial; a la derecha, la salida de 230 kV.
// Nada está a escala.
//
//   materiales(P)     escenario(renderer, scene, M, { movil, oscuro })
//   construir(M, P, { movil, oscuro }) → { raiz, posar(e), partes, anclas, giran, repintar }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { lerp, sale } from '../planta-comun/ayudas.js';
import { caja, cil, cilX, crearAyudante, crearTubos, en, estudio, geoEntre, materialesBase, sombra, texturaGrano } from '../planta-comun/piezas.js';
import { BANCO, BLOQUE, DEVANADO, FLUIDOS, LINEAS, NUCLEO, PARTES, SITIO, TANQUE, UX } from './modelo.js';

const PI = Math.PI;
export const P_PLANTA = {
    papel: '#fafafa', noche: '#0a0e12', tinta: '#171317', marfil: '#f3f1ec', grafito: '#303137', acero: '#a7abb3', guinda: '#9b2247', rosa: '#e57a9a',
    tierraDia: '#d6d7c8', tierraNoche: '#23272c', losaDia: '#dcdcda', losaNoche: '#2c3036', suelo: '#b9a688',
};

export function materiales(P) {
    const M = materialesBase(P, FLUIDOS);
    Object.assign(M, {
        piso: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#cfccc6', 'rgba(0,0,0,0.08)', [8, 3]), roughness: 0.9, envMapIntensity: 0.25 }),
        grava: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#b8b2a6', 'rgba(0,0,0,0.22)', [3, 3]), roughness: 0.95, envMapIntensity: 0.2 }),
        trafo: new THREE.MeshStandardMaterial({ color: '#8e979b', roughness: 0.45, metalness: 0.45, envMapIntensity: 0.9 }),
        cambiador: new THREE.MeshStandardMaterial({ color: '#79838a', roughness: 0.45, metalness: 0.45, envMapIntensity: 0.9 }),
        radiador: new THREE.MeshStandardMaterial({ color: '#9aa2a6', roughness: 0.5, metalness: 0.4, envMapIntensity: 0.8 }),
        porcelana: new THREE.MeshStandardMaterial({ color: '#8b5a43', roughness: 0.32, metalness: 0.05, envMapIntensity: 0.9 }),
        galv: new THREE.MeshStandardMaterial({ color: '#9aa0a8', roughness: 0.45, metalness: 0.7, envMapIntensity: 0.85 }),
        bus: new THREE.MeshStandardMaterial({ color: '#b8bdc4', roughness: 0.4, metalness: 0.6, envMapIntensity: 0.8 }),
        laminas: new THREE.MeshStandardMaterial({ color: '#6c7178', roughness: 0.42, metalness: 0.75, envMapIntensity: 0.9, emissive: '#000000' }),
        papel: new THREE.MeshStandardMaterial({ color: '#d9c7a3', roughness: 0.8 }),
        serie: new THREE.MeshStandardMaterial({ color: '#c8743c', roughness: 0.34, metalness: 0.85, envMapIntensity: 1, emissive: '#000000' }),
        comun: new THREE.MeshStandardMaterial({ color: '#b0602e', roughness: 0.36, metalness: 0.85, envMapIntensity: 1, emissive: '#000000' }),
        terciario: new THREE.MeshStandardMaterial({ color: '#d79a62', roughness: 0.38, metalness: 0.8, envMapIntensity: 1, emissive: '#000000' }),
        aspa: new THREE.MeshStandardMaterial({ color: '#5b6067', roughness: 0.5, metalness: 0.5 }),
        verde: new THREE.MeshBasicMaterial({ color: '#2fb36a', toneMapped: false }),
        rojo: new THREE.MeshBasicMaterial({ color: '#e0302a', toneMapped: false }),
        ambar: new THREE.MeshBasicMaterial({ color: '#ffb000', toneMapped: false }),
        apagado: new THREE.MeshBasicMaterial({ color: '#4a4f57', toneMapped: false }),
        pantalla: new THREE.MeshBasicMaterial({ color: '#203040', toneMapped: false }),
    });
    return M;
}

const [X0, X1] = BLOQUE.x;
const [Z0, Z1] = BLOQUE.z;
const Y0 = BLOQUE.y[0];
export function escenario(renderer, scene, M, { movil = false, oscuro = false } = {}) {
    const dia = new THREE.Color(oscuro ? '#c9c6c0' : '#ffffff');
    const noche = new THREE.Color('#5d5b58');
    return estudio(renderer, scene, { movil, oscuro, y0: Y0, alcance: 15, alActualizar(n) { M.piso.color.copy(dia).lerp(noche, n); M.grava.color.copy(dia).lerp(noche, n); } });
}

/** Una boquilla: brida, cuerpo con faldones, y la terminal arriba. */
function boquilla(M, h, r) {
    const g = new THREE.Group();
    g.add(cil(r * 1.7, 0.08, M.galv));
    const cuerpo = [new THREE.CylinderGeometry(r * 0.72, r, h - 0.2, 16).translate(0, 0.08 + (h - 0.2) / 2, 0)];
    const n = Math.max(4, Math.round((h - 0.35) / 0.085));
    for (let i = 0; i < n; i++) {
        const y = 0.22 + i * ((h - 0.4) / n);
        const rr = lerp(r, r * 0.72, (y - 0.08) / (h - 0.2));
        cuerpo.push(new THREE.CylinderGeometry(rr * 1.45, rr * 1.6, 0.025, 16).translate(0, y, 0));
    }
    g.add(sombra(new THREE.Mesh(mergeGeometries(cuerpo), M.porcelana)));
    g.add(en(cil(r * 0.95, 0.12, M.galv), 0, h - 0.12, 0));
    g.add(en(cil(r * 0.3, 0.12, M.bus), 0, h, 0));
    return g;
}

/** Un devanado: discos de cobre en anillo, con un cuarto abierto hacia el frente para ver los de adentro. */
function devanado(M, mat, ri, ro, y0, y1, abierto = true) {
    const geos = [];
    const n = 15;
    const paso = (y1 - y0) / n;
    const phi0 = abierto ? PI / 4 + 0.15 : 0;
    const largo = abierto ? 1.5 * PI - 0.3 : 2 * PI;
    for (let i = 0; i < n; i++) {
        const a = y0 + i * paso;
        const b = a + paso * 0.8;
        const perfil = [new THREE.Vector2(ri, a), new THREE.Vector2(ro, a), new THREE.Vector2(ro, b), new THREE.Vector2(ri, b), new THREE.Vector2(ri, a)];
        geos.push(new THREE.LatheGeometry(perfil, 40, phi0, largo));
        if (abierto) for (const phi of [phi0, phi0 + largo]) {
            const q = new THREE.PlaneGeometry(ro - ri, b - a).translate((ri + ro) / 2, (a + b) / 2, 0).rotateY(phi - PI / 2);
            geos.push(q);
        }
    }
    const m = sombra(new THREE.Mesh(mergeGeometries(geos.map(g => g.toNonIndexed())), mat));
    m.material.side = THREE.DoubleSide;
    // las tiras de cartón aislante entre un devanado y otro
    const tiras = [];
    for (let k = 0; k < 10; k++) {
        const phi = phi0 + (k + 0.5) * (largo / 10);
        tiras.push(new THREE.BoxGeometry(0.012, y1 - y0 + 0.04, ro - ri + 0.01).translate(0, (y0 + y1) / 2, (ri + ro) / 2).rotateY(phi));
    }
    const t = new THREE.Mesh(mergeGeometries(tiras), M.papel);
    const g = new THREE.Group();
    g.add(m, t);
    return g;
}

export function construir(M, P, { movil = false, oscuro = false } = {}) {
    const raiz = new THREE.Group();
    const ids = PARTES.map(p => p.id);
    const kit = crearAyudante(M, raiz, ids, { movil });
    const { partes, giran, unidad, mover, brillo, cub, rotular } = kit;
    const colorSuelo = oscuro ? '#f2efe8' : P.tinta;
    const plano = (padre, texto, x, z, ancho, giro = 0, y = 0.012) => { const r = rotular(padre, texto, x, y, z, colorSuelo, ancho); r.rotation.set(-PI / 2, 0, giro); return r; };
    const malla = (geos, m) => sombra(new THREE.Mesh(mergeGeometries(geos), m));
    const { w: TW, d: TD, y0: TY0, y1: TY1 } = TANQUE;
    const C = UX[2];

    // --------- el piso de la subestación, la grava de las fosas y las bases de concreto
    {
        const g = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0, -Y0, Z1 - Z0).translate(0, Y0 / 2, 0), M.piso);
        g.receiveShadow = true;
        raiz.add(g);
        for (const x of UX) {
            const gr = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.03, 3.6).translate(x, 0.015, -0.2), M.grava);
            gr.receiveShadow = true;
            raiz.add(gr);
            raiz.add(en(caja(2.5, TY0, 1.9, M.concreto), x, 0, 0));
        }
    }

    // --------- los tanques: el de la fase C se vuelve vidrio para ver el núcleo y los devanados
    const tanque = unidad('tanque');
    UX.forEach((x, k) => {
        const mat = k === 2 ? cub('tanqueC', ['nucleo', 'serie', 'comun', 'terciario'], { color: '#8e979b', metal: 0.45 }) : M.trafo;
        const g = new THREE.Group();
        const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(TW, TY1 - TY0, TD).translate(x, (TY0 + TY1) / 2, 0), mat);
        cuerpo.castShadow = true;
        g.add(cuerpo);
        g.add(new THREE.Mesh(new THREE.BoxGeometry(TW + 0.08, 0.07, TD + 0.08).translate(x, TY1 - 0.035, 0), mat));
        // los refuerzos del tanque
        const ref = [];
        for (const dx of [-0.75, -0.25, 0.25, 0.75]) for (const z of [TD / 2 + 0.02, -TD / 2 - 0.02]) ref.push(new THREE.BoxGeometry(0.06, TY1 - TY0 - 0.1, 0.04).translate(x + dx, (TY0 + TY1) / 2, z));
        g.add(new THREE.Mesh(mergeGeometries(ref), mat));
        tanque.add(g);
        plano(raiz, k === 2 ? `Fase C · ${BANCO.unidad}` : `Fase ${'ABC'[k]}`, x, 1.45, 1.4, 0, 0.04);
    });

    // --------- las boquillas de 400 kV y de 230 kV, sobre sus torretas con los transformadores de corriente
    const boqAT = unidad('boquillaAT');
    const boqBT = unidad('boquillaBT');
    const neutro = unidad('neutro');
    const terciario = unidad('terciario');
    const diferencial = unidad('diferencial');
    UX.forEach((x) => {
        for (const [grupo, s, h, r] of [[boqAT, SITIO.at, SITIO.at.h, 0.12], [boqBT, SITIO.bt, SITIO.bt.h, 0.1]]) {
            const tc = en(cil(r * 1.9, 0.22, M.trafo), x + s.dx, TY1, s.z);
            diferencial.add(tc);
            const b = en(boquilla(M, h - 0.22, r), x + s.dx, TY1 + 0.22, s.z);
            grupo.add(b);
        }
        // el neutro (H0X0) con su bajada a tierra
        const nb = en(boquilla(M, SITIO.neutro.h, 0.07), x + SITIO.neutro.dx, TY1, SITIO.neutro.z);
        neutro.add(nb);
        const yt = TY1 + SITIO.neutro.h;
        neutro.add(sombra(new THREE.Mesh(mergeGeometries([
            geoEntre([x + SITIO.neutro.dx, yt, SITIO.neutro.z], [x + 1.32, yt, SITIO.neutro.z], 0.02, 6),
            geoEntre([x + 1.32, yt, SITIO.neutro.z], [x + 1.32, 0.04, SITIO.neutro.z], 0.02, 6),
            geoEntre([x + 1.32, 0.04, SITIO.neutro.z], [x + 1.32, 0.04, SITIO.neutro.z + 0.9], 0.02, 6),
        ]), M.cobre)));
        neutro.add(en(caja(0.18, 0.03, 0.18, M.cobre), x + 1.32, 0.0, SITIO.neutro.z + 0.9));
        // las dos boquillas del terciario
        for (const d of [-0.17, 0.17]) { terciario.add(en(boquilla(M, SITIO.terciario.h, 0.06), x + SITIO.terciario.dx + d, TY1, SITIO.terciario.z)); }
    });
    // el delta del terciario: une las unidades A-B, B-C y C-A por arriba
    {
        const yt = TY1 + SITIO.terciario.h + 0.04;
        const zt = SITIO.terciario.z;
        const p = k => [UX[k] + SITIO.terciario.dx - 0.17, UX[k] + SITIO.terciario.dx + 0.17];
        const y = SITIO.delta.y;
        const g = [];
        for (const [a, b] of [[0, 1], [1, 2]]) {
            const xa = p(a)[1];
            const xb = p(b)[0];
            g.push(geoEntre([xa, yt, zt], [xa, y, zt], 0.025, 6), geoEntre([xa, y, zt], [xb, y, zt], 0.025, 6), geoEntre([xb, y, zt], [xb, yt, zt], 0.025, 6));
        }
        const xa = p(2)[1];
        const xb = p(0)[0];
        const y2 = y + 0.22;
        const z2 = zt + 0.25;
        g.push(geoEntre([xa, yt, zt], [xa, y2, z2], 0.025, 6), geoEntre([xa, y2, z2], [xb, y2, z2], 0.025, 6), geoEntre([xb, y2, z2], [xb, yt, zt], 0.025, 6));
        terciario.add(malla(g, M.bus));
    }

    // --------- el conservador con el relevador Buchholz en su tubo
    const conservador = unidad('conservador');
    UX.forEach((x) => {
        const s = SITIO.conservador;
        const g = new THREE.Group();
        g.add(en(cilX(s.r, s.largo, M.trafo, 20), x + s.dx, s.y, s.z));
        for (const dx of [-0.55, 0.55]) g.add(en(caja(0.06, s.y - TY1 - s.r + 0.02, 0.06, M.grafito), x + s.dx + dx, TY1, s.z));
        g.add(en(cilX(s.r * 0.6, 0.03, M.marfil, 16), x + s.dx - s.largo / 2 - 0.015, s.y, s.z));
        const xb = x + SITIO.buchholz.dx;
        g.add(entreTubo([xb, TY1, -0.55], [xb, s.y - s.r, s.z], 0.035, M.trafo));
        g.add(en(caja(0.16, 0.12, 0.13, M.grafito), xb, (TY1 + s.y - s.r) / 2 - 0.06, (-0.55 + s.z) / 2));
        g.add(en(caja(0.07, 0.06, 0.01, M.marfil), xb, (TY1 + s.y - s.r) / 2 - 0.03, (-0.55 + s.z) / 2 + 0.07));
        conservador.add(g);
    });
    function entreTubo(a, b, r, m) { return sombra(new THREE.Mesh(geoEntre(a, b, r, 10), m)); }

    // --------- los radiadores atrás, con sus ventiladores
    const radiadores = unidad('radiadores');
    const aspas = [];
    UX.forEach((x) => {
        const s = SITIO.radiador;
        const zc = (s.z[0] + s.z[1]) / 2;
        const prof = s.z[0] - s.z[1];
        const pan = [];
        for (let i = 0; i < 9; i++) pan.push(new THREE.BoxGeometry(0.035, TY1 - TY0 - 0.5, prof).translate(x + lerp(s.x[0], s.x[1], i / 8), (TY0 + TY1) / 2 + 0.05, zc));
        radiadores.add(malla(pan, M.radiador));
        const cab = [];
        for (const y of [TY1 - 0.25, TY0 + 0.25]) {
            cab.push(new THREE.CylinderGeometry(0.05, 0.05, s.x[1] - s.x[0] + 0.1, 10).rotateZ(PI / 2).translate(x, y, zc));
            for (const dx of [-0.6, 0.6]) cab.push(geoEntre([x + dx, y, -TD / 2], [x + dx, y, zc], 0.05, 10));
        }
        radiadores.add(malla(cab, M.trafo));
        // tres ventiladores debajo, soplando hacia arriba entre las aletas
        for (const dx of [-0.6, 0, 0.6]) {
            const aro = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.02, 6, 24).rotateX(PI / 2), M.grafito);
            aro.position.set(x + dx, TY0 + 0.05, zc);
            radiadores.add(aro);
            const a = new THREE.Group();
            for (let j = 0; j < 4; j++) a.add(new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.01, 0.06).translate(0.09, 0, 0).rotateY((j * PI) / 2), M.aspa));
            a.position.set(x + dx, TY0 + 0.05, zc);
            radiadores.add(a);
            aspas.push(a);
        }
    });
    {
        const r = { v: 0 };
        for (const a of aspas) giran.push({ obj: a, eje: 'y', vel: e => { r.v = lerp(r.v, (e.ventiladores ?? 0) * 9, Math.min(1, (e.dt || 0.016) * 0.8)); return r.v; } });
    }

    // --------- el cambiador de derivaciones bajo carga, al frente, con su mecanismo y su posición
    const cambiador = unidad('cambiador');
    UX.forEach((x, k) => {
        const s = SITIO.cambiador;
        const g = new THREE.Group();
        // el de la fase C se vuelve vidrio con lo de adentro: si no, tapa los devanados
        const adentro = ['nucleo', 'serie', 'comun', 'terciario'];
        const mc = k === 2 ? cub('cambiadorC', adentro, { color: '#79838a', metal: 0.45 }) : M.cambiador;
        const mg = k === 2 ? cub('gabineteC', adentro, { color: '#f3f1ec', metal: 0.05 }) : M.marfil;
        g.add(en(caja(0.62, 1.0, 0.26, mc), x + s.dx, 1.15, TD / 2 + 0.13));
        g.add(en(caja(0.46, 0.55, 0.24, mg), x + s.dx, 0.42, TD / 2 + 0.16));
        g.add(en(cil(0.02, 0.18, M.grafito), x + s.dx + 0.15, 0.97, TD / 2 + 0.2));
        rotular(g, String(BANCO.posicion), x + s.dx, 0.72, TD / 2 + 0.285, oscuro ? '#f2efe8' : P.tinta, 0.5);
        cambiador.add(g);
    });

    // --------- adentro de la fase C: el núcleo de tres piernas y los devanados
    const activa = new THREE.Group();
    raiz.add(activa);
    const nucleo = unidad('nucleo', 0, 0, activa);
    const serie = unidad('serie', 0, 0, activa);
    const comun = unidad('comun', 0, 0, activa);
    const terciarioDev = unidad('terciario', 0, 0, activa);
    const tiembla = new THREE.Group();
    {
        const { y0, y1, ancho, pierna, fondo, yugo } = NUCLEO;
        const g = [];
        g.push(new THREE.CylinderGeometry(pierna, pierna, y1 - y0 - 2 * yugo + 0.02, 28).translate(C, (y0 + y1) / 2, 0));
        for (const dx of [-ancho / 2 + 0.1, ancho / 2 - 0.1]) g.push(new THREE.BoxGeometry(0.2, y1 - y0, fondo).translate(C + dx, (y0 + y1) / 2, 0));
        for (const y of [y0 + yugo / 2, y1 - yugo / 2]) g.push(new THREE.BoxGeometry(ancho, yugo, fondo).translate(C, y, 0));
        // las juntas de las láminas: rayas finas
        for (let i = 1; i < 12; i++) for (const dx of [-ancho / 2 + 0.1, ancho / 2 - 0.1]) g.push(new THREE.BoxGeometry(0.205, 0.004, fondo + 0.004).translate(C + dx, y0 + (i * (y1 - y0)) / 12, 0));
        nucleo.add(malla(g, M.laminas));
        // las prensas de los yugos
        const pr = [];
        for (const y of [y0 + yugo / 2, y1 - yugo / 2]) for (const z of [fondo / 2 + 0.03, -fondo / 2 - 0.03]) pr.push(new THREE.BoxGeometry(ancho + 0.1, yugo * 0.8, 0.04).translate(C, y, z));
        nucleo.add(malla(pr, M.grafito));
        // las patas del núcleo, sobre el fondo del tanque
        nucleo.add(en(caja(ancho, y0 - TY0, 0.5, M.grafito), C, TY0, 0));
        brillo(nucleo, C, (y0 + y1) / 2, 0.2, 2.2, '#7e57c2', 'satura', 1.4, false);
        brillo(nucleo, C, (y0 + y1) / 2, 0.2, 1.5, '#e0302a', 'satura', 0.6, false);
        const D = DEVANADO;
        terciarioDev.add(devanado(M, M.terciario, D.terciario[0], D.terciario[1], D.y0, D.y1));
        comun.add(devanado(M, M.comun, D.comun[0], D.comun[1], D.y0, D.y1));
        serie.add(devanado(M, M.serie, D.serie[0], D.serie[1], D.y0, D.y1));
        for (const g2 of [terciarioDev, comun, serie]) { g2.position.x = C; tiembla.add(g2); }
        activa.add(tiembla);
        brillo(activa, C, (D.y0 + D.y1) / 2, 0.5, 2.0, '#ff8a3c', 'calor', 0.9, false);
        brillo(activa, C, (D.y0 + D.y1) / 2, 0.6, 3.0, '#ffb000', 'fallaDentro', 1.6, false);
    }

    // --------- la llegada de 400 kV: pórtico e interruptor de tres polos
    const interruptor = unidad('interruptor');
    let focoInt = null;
    {
        const xi = SITIO.interruptor.x;
        const zs = SITIO.z400;
        for (const z of zs) {
            interruptor.add(en(caja(0.3, 1.4, 0.3, M.galv), xi, 0, z));
            interruptor.add(en(boquilla(M, SITIO.y400 - 0.2 - 1.4 - 0.12, 0.08), xi, 1.4, z));
            interruptor.add(en(cilX(0.11, 0.95, M.porcelana, 14), xi, SITIO.y400 - 0.2, z));
        }
        interruptor.add(en(caja(0.5, 0.75, 0.35, M.marfil), xi, 0, zs[2] + 0.75));
        focoInt = en(caja(0.16, 0.1, 0.02, M.verde), xi, 0.6, zs[2] + 0.93);
        interruptor.add(focoInt);
        brillo(interruptor, xi, SITIO.y400 - 0.2, zs[1], 1.6, '#e0302a', 'disparo', 1.2, false);
        plano(raiz, 'Interruptor de 400 kV', xi, 0.75, 1.7);
        // los pórticos
        const xp = SITIO.portico400;
        const g = [];
        for (const z of [zs[0] - 0.45, zs[2] + 0.45]) g.push(new THREE.BoxGeometry(0.14, SITIO.y400 + 0.25, 0.14).translate(xp, (SITIO.y400 + 0.25) / 2, z));
        g.push(new THREE.BoxGeometry(0.12, 0.12, zs[2] - zs[0] + 1.1).translate(xp, SITIO.y400 + 0.2, (zs[0] + zs[2]) / 2));
        const zb = SITIO.z230;
        const xq = SITIO.portico230;
        for (const z of [zb[2] - 0.45, zb[0] + 0.45]) g.push(new THREE.BoxGeometry(0.14, SITIO.y230 + 0.25, 0.14).translate(xq, (SITIO.y230 + 0.25) / 2, z));
        g.push(new THREE.BoxGeometry(0.12, 0.12, zb[0] - zb[2] + 1.1).translate(xq, SITIO.y230 + 0.2, (zb[0] + zb[2]) / 2));
        raiz.add(malla(g, M.galv));
        plano(raiz, 'Llegan 400 kV', xp + 0.9, -2.3, 1.3);
        plano(raiz, 'Salen 230 kV', xq - 0.9, -0.3, 1.3);
        brillo(raiz, xq - 0.3, SITIO.y230, zb[1], 3.0, '#ffb000', 'falla', 2, false);
    }

    // --------- la protección diferencial (87T): su tablero, con un foco que dice si dispara o se bloquea
    let focoDif = null;
    {
        const [x, z] = SITIO.diferencial;
        diferencial.add(en(caja(0.95, 1.75, 0.5, M.marfil), x, 0, z));
        diferencial.add(en(caja(0.55, 0.32, 0.02, M.pantalla), x, 1.25, z + 0.255));
        focoDif = en(caja(0.18, 0.1, 0.02, M.verde), x, 0.95, z + 0.255);
        diferencial.add(focoDif);
        brillo(diferencial, x, 1.0, z + 0.4, 1.0, '#ffb000', 'bloqueo', 1.2, false);
        brillo(diferencial, x, 1.0, z + 0.4, 1.2, '#e0302a', 'disparo', 1.4, false);
        plano(raiz, 'Protección diferencial', x, z + 0.75, 1.7);
    }

    // --------- luminarias de la subestación
    for (const [x, z] of [[-1.65, -2.9], [4.95, -2.9]]) {
        raiz.add(en(cil(0.05, 4.2, M.galv), x, 0, z));
        raiz.add(en(caja(0.35, 0.1, 0.2, M.lampara), x, 4.15, z - 0.05));
        brillo(raiz, x, 4.05, z - 0.05, 1.8, '#ffe2ad', 'noche', 0.9, true);
    }

    // --------- al desarmar: la parte activa de la fase C sale al frente y los devanados se levantan de la pierna
    mover(activa, [0, 0, 2.3]);
    mover(serie, [0, 1.25, 0], 0.45);
    mover(comun, [0, 0.62, 0], 0.45);
    for (const [g, d] of [[conservador, [0, 0.45, 0]], [radiadores, [0, 0, -0.35]], [interruptor, [0, 0.3, 0]]]) mover(g, d);

    // --------- lo que corre por los cables y por dentro
    const tubos = crearTubos({ raiz, lineas: LINEAS, fluidos: FLUIDOS, M, partes, parteDe: L => (L.id.startsWith('aceite') ? 'radiadores' : null), movil });

    const anclas = {};
    for (const p of PARTES) { const o = new THREE.Object3D(); o.position.set(...p.ancla); raiz.add(o); anclas[p.id] = o; }

    // ---------- posar
    const color = new THREE.Color();
    function posar(e) {
        const act = p => (p === 'noche' ? e.noche : p === 'siempre' ? 1 : p ? (e.activo[p] ?? 0) : 1);
        const a = sale(e.desarme * 3);
        const ab = { ...(e.abierta || {}) };
        kit.posar(e, act, ab, { apagar: a });
        tubos.posar(e, a);
        // los devanados brillan con su corriente; el núcleo, cuando se satura
        const ver = Math.max(e.adentro, ab.serie ?? 0, ab.comun ?? 0, ab.nucleo ?? 0, ab.terciario ?? 0, 0.35);
        M.serie.emissive.set('#ff5a1f').multiplyScalar(0.28 * (e.activo.serie ?? 0) * ver);
        M.comun.emissive.set('#ff5a1f').multiplyScalar(0.28 * (e.activo.comun ?? 0) * ver);
        M.laminas.emissive.copy(color.set('#7e57c2')).multiplyScalar(0.45 * (e.activo.satura ?? 0) * ver);
        // los devanados tiemblan con la fuerza de la falla
        tiembla.position.set(Math.sin(e.t * 63) * 0.012 * (e.tiembla ?? 0), 0, Math.cos(e.t * 57) * 0.008 * (e.tiembla ?? 0));
        focoInt.material = e.cerrado ? M.verde : M.rojo;
        focoDif.material = e.activo.disparo ? M.rojo : e.activo.bloqueo ? M.ambar : M.verde;
        M.lampara.color.set('#9a9c9f').lerp(new THREE.Color('#ffe2ad'), e.noche);
    }
    return { raiz, posar, partes, anclas, giran, repintar: kit.repintar };
}
