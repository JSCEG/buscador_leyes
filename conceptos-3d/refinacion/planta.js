// La refinería, hecha con código. Sistema Búho: un terreno junto al mar donde el crudo entra por la izquierda y los combustibles salen por la derecha: tanques,
// desaladora, hornos, torres, FCC, coquizadora, reformadora, hidrodesulfuradora, hidrógeno, azufre, mezclado, servicios, quemador y muelle. Las cubiertas se vuelven
// vidrio (adentro = 1) y cada equipo se separa en sus piezas (desarme = 1).
//
//   materiales(P)     escenario(renderer, scene, M, { movil, oscuro })
//   construir(M, P, { movil, oscuro }) → { raiz, posar(e), partes, anclas, giran, repintar }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { azar, clamp01, lerp, sale } from '../planta-comun/ayudas.js';
import { aro, caja, cil, cilX, cilZ, crearAyudante, crearTubos, en, entre, estudio, geoEntre, materialesBase, recipienteGeo, sombra } from '../planta-comun/piezas.js';
import { AZUF, BLOQUE, COKER, CRUDOS, DESALADORA, EQUIPOS, ESFERA, FCC, FLARE, FLUIDOS, H2P, HDS, HORNO_A, HORNO_V, LINEAS, PARTES, REFORMA, TANQUES_CRUDO, TANQUES_PROD, TORRE_A, TORRE_V } from './modelo.js';

const PI = Math.PI;
export const P_PLANTA = {
    papel: '#fafafa', noche: '#0a0e12', tinta: '#171317', marfil: '#f3f1ec', grafito: '#303137', acero: '#a7abb3', guinda: '#9b2247', rosa: '#e57a9a',
    tierraDia: '#d6d7c8', tierraNoche: '#23272c', losaDia: '#dcdcda', losaNoche: '#2c3036', suelo: '#b9a688',
};

export function materiales(P) {
    const M = materialesBase(P, FLUIDOS);
    Object.assign(M, {
        grava: new THREE.MeshStandardMaterial({ color: '#c9c7bf', roughness: 1, envMapIntensity: 0.25 }),
        marco: new THREE.MeshStandardMaterial({ color: P.grafito, roughness: 0.6, metalness: 0.3, envMapIntensity: 0.6 }),
        agua: new THREE.MeshPhysicalMaterial({ color: '#4d9fd0', roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.12, transparent: true, opacity: 0.62, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1 }),
        fuego: new THREE.MeshBasicMaterial({ color: '#ff7a1f', transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }),
        fuegoIn: new THREE.MeshBasicMaterial({ color: '#ffd35c', transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
        llama: new THREE.MeshBasicMaterial({ color: '#ff9a2e', transparent: true, depthWrite: false, toneMapped: false }),
        lecho: new THREE.MeshBasicMaterial({ color: '#ff8c3a', transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
        humo: new THREE.SpriteMaterial({ color: '#c9c9c9', transparent: true, opacity: 0.2, depthWrite: false }),
        coque: new THREE.MeshStandardMaterial({ color: '#2f2c2a', roughness: 0.95, envMapIntensity: 0.3 }),
        catal: new THREE.MeshStandardMaterial({ color: '#b9b4a6', roughness: 0.9, envMapIntensity: 0.3 }),
        azufreS: new THREE.MeshStandardMaterial({ color: '#d9c92c', roughness: 0.75, envMapIntensity: 0.4 }),
        casco: new THREE.MeshStandardMaterial({ color: '#3b3f47', roughness: 0.55, metalness: 0.4, envMapIntensity: 0.6 }),
        cascoBajo: new THREE.MeshStandardMaterial({ color: P.guinda, roughness: 0.6, envMapIntensity: 0.4 }),
        ventilador: new THREE.MeshStandardMaterial({ color: '#4d5057', roughness: 0.5, metalness: 0.6, side: THREE.DoubleSide }),
        rejilla: new THREE.MeshStandardMaterial({ color: '#8d919a', roughness: 0.5, metalness: 0.7, envMapIntensity: 0.8 }),
    });
    M.humo.map = M.vaho;
    return M;
}

const Y0 = BLOQUE.y[0];
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
    return f;
}
// Los platos de una columna: abajo caliente, arriba frío.
function platos(g, r, y0, y1, n) {
    const c0 = new THREE.Color('#b13a22');
    const c1 = new THREE.Color('#e7c04a');
    for (let k = 0; k < n; k++) {
        const u = k / (n - 1);
        const p = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.012, r - 0.012, 0.012, 20), new THREE.MeshStandardMaterial({ color: c0.clone().lerp(c1, u), roughness: 0.5, metalness: 0.3 }));
        p.position.y = lerp(y0, y1, u);
        g.add(p);
    }
}
export function escenario(renderer, scene, M, { movil = false, oscuro = false } = {}) {
    const P = M.P;
    const dia = { tierra: new THREE.Color(oscuro ? '#a2a497' : P.tierraDia), losa: new THREE.Color(oscuro ? '#9a9b9a' : P.losaDia), concreto: new THREE.Color(oscuro ? '#a5a39c' : '#cfccc5'), grava: new THREE.Color(oscuro ? '#8f8d86' : '#c9c7bf'), suelo: new THREE.Color(P.suelo), agua: new THREE.Color('#4d9fd0') };
    const noche = { tierra: new THREE.Color(P.tierraNoche), losa: new THREE.Color(P.losaNoche), concreto: new THREE.Color('#383c42'), grava: new THREE.Color('#2e3136'), suelo: new THREE.Color('#3a352f'), agua: new THREE.Color('#1c4564') };
    if (oscuro) { M.torre.color.set('#8f929a'); M.marco.color.set('#7d818a'); }
    return estudio(renderer, scene, {
        movil, oscuro, y0: Y0, alcance: 15,
        alActualizar(n) {
            M.tierra.color.copy(dia.tierra).lerp(noche.tierra, n);
            M.losa.color.copy(dia.losa).lerp(noche.losa, n);
            M.concreto.color.copy(dia.concreto).lerp(noche.concreto, n);
            M.grava.color.copy(dia.grava).lerp(noche.grava, n);
            M.suelo.color.copy(dia.suelo).lerp(noche.suelo, n * 0.8);
            M.agua.color.copy(dia.agua).lerp(noche.agua, n);
        },
    });
}

export function construir(M, P, { movil = false, oscuro = false } = {}) {
    const raiz = new THREE.Group();
    const ids = PARTES.map(p => p.id);
    const kit = crearAyudante(M, raiz, ids, { movil });
    const { partes, giran, unidad, mover, brillo, cub, rotular } = kit;
    const colorTexto = oscuro ? '#f2efe8' : P.tinta;
    const [X0, X1] = BLOQUE.x;
    const [Z0, Z1] = BLOQUE.z;
    const MAR = BLOQUE.mar;
    const plano = (padre, texto, x, z, ancho, giro = 0, y = 0.012) => { const r = rotular(padre, texto, x, y, z, colorTexto, ancho); r.rotation.set(-PI / 2, 0, giro); return r; };
    const varias = (pares, r, m, seg = 5) => sombra(new THREE.Mesh(mergeGeometries(pares.map(([a, b]) => geoEntre(a, b, r, seg))), m));

    // --------- el terreno y el mar
    {
        const t = new THREE.Group();
        raiz.add(t);
        const molde = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0 - 0.04, -Y0 - 0.04, Z1 - Z0 - 0.04), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
        molde.position.set((X0 + X1) / 2, Y0 / 2, (Z0 + Z1) / 2);
        molde.castShadow = true;
        t.add(molde);
        const b = new THREE.Mesh(new THREE.BoxGeometry(MAR - X0, -Y0, Z1 - Z0), [M.suelo, M.suelo, M.tierra, M.suelo, M.suelo, M.suelo]);
        b.position.set((X0 + MAR) / 2, Y0 / 2, (Z0 + Z1) / 2);
        b.receiveShadow = true;
        t.add(b);
        const lecho = new THREE.Mesh(new THREE.BoxGeometry(X1 - MAR, BLOQUE.lecho - Y0, Z1 - Z0), M.suelo);
        lecho.position.set((MAR + X1) / 2, (Y0 + BLOQUE.lecho) / 2, (Z0 + Z1) / 2);
        lecho.receiveShadow = true;
        t.add(lecho);
        const agua = new THREE.Mesh(new THREE.BoxGeometry(X1 - MAR - 0.008, BLOQUE.agua - BLOQUE.lecho, Z1 - Z0 - 0.008), M.agua);
        agua.position.set((MAR + X1) / 2, (BLOQUE.agua + BLOQUE.lecho) / 2, (Z0 + Z1) / 2);
        agua.renderOrder = 4;
        t.add(agua);
        partes.salida.push(agua);
        const losa = (x0, x1, z0, z1, m = M.losa, h = 0.018) => {
            const l = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, h, z1 - z0), m);
            l.position.set((x0 + x1) / 2, h / 2, (z0 + z1) / 2);
            l.receiveShadow = true;
            t.add(l);
        };
        // los terrenos de cada planta y las calles que las unen
        losa(-6.4, 6.55, 0.75, 4.2, M.grava);
        losa(-6.4, 6.55, -4.2, -0.45, M.grava);
        losa(-8.3, -6.4, -4.2, 4.2, M.grava);
        losa(-6.4, 6.55, -0.45, 0.75, M.concreto, 0.026);
        losa(-6.3, 4.5, 1.35, 1.6, M.losa, 0.026);
        losa(-6.3, 4.5, -1.15, -0.9, M.losa, 0.026);
        for (const x of [-4.95, -0.65, 2.2]) { losa(x - 0.11, x + 0.11, 0.75, 4.1, M.losa, 0.024); losa(x - 0.11, x + 0.11, -4.1, -0.45, M.losa, 0.024); }
        // bordo de los tanques
        for (const [x0, x1, z0, z1] of [[-8.25, -6.75, -3.6, 3.3], [4.25, 5.65, -3.3, 3.55]]) {
            for (const [a, b2] of [[[x0, z0], [x1, z0]], [[x0, z1], [x1, z1]], [[x0, z0], [x0, z1]], [[x1, z0], [x1, z1]]]) {
                const ancho = Math.abs(a[0] - b2[0]) + 0.05;
                const hondo = Math.abs(a[1] - b2[1]) + 0.05;
                const bordo = new THREE.Mesh(new THREE.BoxGeometry(ancho, 0.07, hondo), M.concreto);
                bordo.position.set((a[0] + b2[0]) / 2, 0.035, (a[1] + b2[1]) / 2);
                bordo.receiveShadow = true;
                t.add(bordo);
            }
        }
        // el muro del muelle
        const muro = new THREE.Mesh(new THREE.BoxGeometry(0.05, -BLOQUE.lecho + 0.02, Z1 - Z0), M.concreto);
        muro.position.set(MAR, BLOQUE.lecho / 2 + 0.01, 0);
        t.add(muro);
        const letrero = plano(raiz, 'Golfo de México', 7.55, 3.35, 1.6, PI / 2, BLOQUE.agua + 0.012);
        letrero.rotation.set(-PI / 2, 0, PI / 2);
    }

    // --------- el puente de tubos: por aquí pasa todo
    {
        const u = new THREE.Group();
        raiz.add(u);
        const pares = [];
        for (let x = -6; x <= 4.4; x += 0.72) {
            for (const z of [-0.02, 0.56]) pares.push([[x, 0, z], [x, 1.02, z]]);
            pares.push([[x, 0.72, -0.02], [x, 0.72, 0.56]], [[x, 0.92, -0.02], [x, 0.92, 0.56]]);
        }
        for (const z of [-0.02, 0.56]) { pares.push([[-6, 0.72, z], [4.4, 0.72, z]], [[-6, 0.92, z], [4.4, 0.92, z]]); }
        u.add(varias(pares, 0.012, M.marco, 4));
    }

    // --------- un tanque con techo que flota
    const tanques = [];
    const tanque = (id, nombre, x, z, r, h, fluido, rotulo = null) => {
        const g = unidad(id, x, z);
        const cuerpo = cub(nombre, [id], { color: '#e9e7e1' });
        const lado = sombra(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 40, 1, true).translate(0, h / 2, 0), cuerpo));
        g.add(mover(lado, [0, 1.15, 0]));
        // lo de adentro
        const mLiq = new THREE.MeshStandardMaterial({ color: FLUIDOS[fluido].color, roughness: 0.3, envMapIntensity: 0.6 });
        const liq = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.02, r - 0.02, 1, 32).translate(0, 0.5, 0), mLiq);
        liq.scale.y = h * 0.62;
        g.add(liq);
        const techo = sombra(new THREE.Mesh(new THREE.CylinderGeometry(r - 0.015, r - 0.015, 0.03, 36), M.acero));
        techo.position.y = h * 0.64;
        g.add(techo);
        tanques.push({ liq, techo, h, f: azar(x * 7 + z * 13, 3) });
        g.add(en(aro(r + 0.004, 0.008, M.acero), 0, h, 0));
        // escalera en espiral
        const peldanos = [];
        for (let k = 0; k < 16; k++) { const a = -0.6 + (k / 16) * 2.2; const y = (k / 16) * h; peldanos.push([[Math.cos(a) * (r + 0.015), y, Math.sin(a) * (r + 0.015)], [Math.cos(a + 0.12) * (r + 0.015), y + h / 16, Math.sin(a + 0.12) * (r + 0.015)]]); }
        g.add(varias(peldanos, 0.006, M.grafito, 4));
        if (rotulo) { const l = rotular(g, rotulo, 0, h * 0.5, r + 0.008, P.tinta, r * 1.6); l.renderOrder = 3; }
        return g;
    };
    TANQUES_CRUDO.forEach(([x, z], i) => tanque('crudo', `crudoT${i}`, x, z, 0.62, 0.62, 'crudo', i === 3 ? 'Crudo' : null));
    TANQUES_PROD.forEach((t, i) => tanque('mezclado', `prodT${i}`, t.x, t.z, 0.54, 0.76, t.f, t.n));
    // la llegada del ducto
    {
        const g = unidad('crudo');
        g.add(en(cilX(0.05, 0.14, M.grafito, 12), X0 + 0.1, 0.2, 3.6));
        g.add(en(cil(0.08, 0.04, M.guinda, 0.08, 12), -7.05, 0.1, 3.6));
    }

    // --------- la desaladora
    {
        const g = unidad('desaladora', DESALADORA.x, DESALADORA.z);
        const c = cub('desaladoraC', ['desaladora'], { color: '#dfe0dc' });
        const cuerpo = new THREE.Group();
        cuerpo.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(DESALADORA.r, DESALADORA.r, DESALADORA.l - 0.2, 26, 1, true).rotateZ(PI / 2), c)));
        for (const s of [-1, 1]) { const tapa = new THREE.Mesh(new THREE.SphereGeometry(DESALADORA.r, 22, 12), c); tapa.scale.x = 0.5; tapa.position.x = (s * (DESALADORA.l - 0.2)) / 2; cuerpo.add(tapa); }
        cuerpo.position.y = DESALADORA.y;
        g.add(mover(cuerpo, [0, 0.9, 0]));
        // adentro: agua abajo con sal, crudo arriba, y las placas
        const largo = DESALADORA.l - 0.22;
        const crudo = new THREE.Mesh(new THREE.CylinderGeometry(DESALADORA.r - 0.012, DESALADORA.r - 0.012, largo, 26).rotateZ(PI / 2), new THREE.MeshStandardMaterial({ color: FLUIDOS.crudo.color, roughness: 0.3 }));
        crudo.position.y = DESALADORA.y;
        g.add(crudo);
        // media caña más abajo: el agua con las sales, que se asienta
        const agua = new THREE.Mesh(new THREE.CylinderGeometry(DESALADORA.r - 0.008, DESALADORA.r - 0.008, largo + 0.004, 26, 1, false, PI * 1.12, PI * 0.76).rotateZ(PI / 2), new THREE.MeshStandardMaterial({ color: '#7fb6d8', roughness: 0.3, side: THREE.DoubleSide }));
        agua.position.y = DESALADORA.y;
        g.add(agua);
        for (const k of [-0.28, 0.28]) { g.add(en(caja(0.05, 0.22, 0.32, M.concreto), k, 0, 0)); }
        // el agua salada se va
        g.add(entre([0.1, DESALADORA.y - 0.18, 0.1], [0.1, 0.05, 0.42], 0.012, M.acero));
    }

    // --------- los hornos
    const humos = [];
    const humo = (x, y, z, esc = 0.55) => {
        for (let k = 0; k < 3; k++) {
            const s = new THREE.Sprite(M.humo);
            s.position.set(x, y, z);
            s.renderOrder = 6;
            raiz.add(s);
            humos.push({ s, x, y, z, fase: k / 3, esc });
        }
    };
    const hornoDe = (id, nombre, H) => {
        const g = unidad(id, H.x, H.z);
        const c = cub(nombre, [id], { color: '#8e8f93', metal: 0.4 });
        const caraG = new THREE.Group();
        caraG.add(en(caja(H.ancho, H.alto, H.largo, c), 0, 0.04, 0));
        caraG.add(en(new THREE.Mesh(new THREE.BoxGeometry(H.ancho + 0.04, 0.04, H.largo + 0.04), M.grafito), 0, H.alto + 0.06, 0));
        g.add(mover(caraG, [0, 0.95, 0]));
        // tubos y fuego
        for (let k = 0; k < 6; k++) { const z = -H.largo / 2 + 0.1 + (k * (H.largo - 0.2)) / 5; g.add(entre([-H.ancho / 2 + 0.07, 0.14, z], [-H.ancho / 2 + 0.07, H.alto - 0.08, z], 0.018, M.acero), entre([H.ancho / 2 - 0.07, 0.14, z], [H.ancho / 2 - 0.07, H.alto - 0.08, z], 0.018, M.acero)); }
        for (let k = 0; k < 3; k++) {
            flama(g, M, 0, 0.06, (-H.largo / 2 + 0.14) + (k * (H.largo - 0.28)) / 2, 0.08, H.alto * 0.52);
        }
        const chim = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.095, H.chimenea - H.alto, 16).translate(0, (H.chimenea - H.alto) / 2, 0), M.grafito));
        chim.position.set(0, H.alto + 0.06, 0);
        g.add(chim);
        g.add(en(aro(0.075, 0.012, M.guinda), 0, H.chimenea - 0.15, 0));
        brillo(g, 0, H.alto * 0.45, H.largo / 2 + 0.02, 1.1, '#ff8a2a', 'horno', 0.55);
        humo(H.x, H.chimenea + 0.1, H.z);
        return g;
    };
    hornoDe('horno', 'hornoC', HORNO_A);
    hornoDe('vacio', 'hornoVC', { ...HORNO_V, chimenea: HORNO_V.chimenea });

    // --------- una torre: cuerpo que se hace vidrio, plataformas, escalera
    const luces = [];
    const plataformas = (g, r, ys) => {
        ys.forEach(y => { g.add(en(aro(r + 0.03, 0.013, M.acero), 0, y, 0)); luces.push([g.position.x + r + 0.03, y + 0.04, g.position.z]); });
    };
    // torre atmosférica
    {
        const T = TORRE_A;
        const g = unidad('torre', T.x, T.z);
        const c = cub('torreAC', ['torre'], { color: '#c3c5c5', metal: 0.5 });
        const h = T.y1 - T.y0;
        const cuerpo = sombra(new THREE.Mesh(recipienteGeo(T.r, h, 0.45), c));
        cuerpo.position.y = T.y0;
        g.add(mover(cuerpo, [0, 0, 1.25]));
        // los platos: de abajo caliente a arriba frío
        const n = 14;
        const c0 = new THREE.Color('#b13a22');
        const c1 = new THREE.Color('#e7c04a');
        for (let k = 0; k < n; k++) {
            const u = k / (n - 1);
            const y = lerp(T.y0 + 0.75, T.y1 - 0.25, u);
            const m = new THREE.MeshStandardMaterial({ color: c0.clone().lerp(c1, u), roughness: 0.5, metalness: 0.3 });
            const p = new THREE.Mesh(new THREE.CylinderGeometry(T.r - 0.012, T.r - 0.012, 0.012, 24), m);
            p.position.y = y;
            g.add(p);
            // la bajante, alternada
            g.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.012), M.rejilla), 0, y - 0.06, (k % 2 ? 1 : -1) * (T.r - 0.08)));
        }
        const fondo = new THREE.Mesh(new THREE.CylinderGeometry(T.r - 0.015, T.r - 0.03, 0.34, 24), new THREE.MeshStandardMaterial({ color: FLUIDOS.residuo.color, roughness: 0.4 }));
        fondo.position.y = T.y0 + 0.2;
        g.add(fondo);
        plataformas(g, T.r, [0.95, 1.9, 2.85, 3.8, 4.55]);
        // escalera
        g.add(entre([T.r + 0.045, 0.04, 0.08], [T.r + 0.045, T.y1 + 0.05, 0.08], 0.006, M.grafito), entre([T.r + 0.045, 0.04, -0.08], [T.r + 0.045, T.y1 + 0.05, -0.08], 0.006, M.grafito));
        // agotadores de los cortes, de lado
        const s = cub('agotadores', ['torre'], { color: '#c3c5c5', metal: 0.5 });
        for (const [y, z, dx] of [[2.8, -0.25, 0.53], [1.85, -0.28, 0.5]]) g.add(en(cil(0.085, 0.72, s, 0.085, 14), dx, y, z));
        // el domo y su condensador de aire, con su ventilador
        const dc = unidad('torre', -2.25, 3.34);
        for (const [x, z] of [[-0.3, -0.16], [0.3, -0.16], [-0.3, 0.16], [0.3, 0.16]]) dc.add(entre([x, 0, z], [x, 2.88, z], 0.013, M.marco));
        dc.add(en(caja(0.74, 0.08, 0.44, M.rejilla), 0, 2.88, 0));
        const v = new THREE.Group();
        v.position.set(0, 3.0, 0);
        for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.006, 0.05).translate(0.17, 0, 0), M.ventilador); b.rotation.y = (k * 2 * PI) / 3; v.add(b); }
        dc.add(v);
        giran.push({ obj: v, eje: 'y', vel: () => 5.5 });
        dc.add(en(cilX(0.15, 0.56, M.grafito, 18), 0, 1.68, 0));
        for (const s2 of [-0.28, 0.28]) { const t2 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), M.grafito); t2.scale.x = 0.4; t2.position.set(s2, 1.68, 0); dc.add(t2); }
    }
    // torre de vacío: la cintura ancha deja que el vapor a baja presión pase despacio
    {
        const T = TORRE_V;
        const g = unidad('vacio', T.x, T.z);
        const c = cub('torreVC', ['vacio'], { color: '#b8bbbd', metal: 0.5 });
        const perfil = [[0.001, 0], [0.26, 0.02], [0.32, 0.4], [T.r, 0.9], [T.r, 2.05], [0.28, 2.52], [0.2, 2.86], [0.001, 2.98]].map(([r, y]) => new THREE.Vector2(r, y));
        const cuerpo = sombra(new THREE.Mesh(new THREE.LatheGeometry(perfil, 32), c));
        cuerpo.position.y = T.y0;
        g.add(mover(cuerpo, [0, 0, 1.3]));
        for (const y of [1.1, 1.65, 2.1]) {
            const lecho = new THREE.Mesh(new THREE.CylinderGeometry(T.r - 0.03, T.r - 0.03, 0.24, 26), M.rejilla);
            lecho.position.y = y;
            g.add(lecho);
        }
        const fondo = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.32, 24), new THREE.MeshStandardMaterial({ color: FLUIDOS.residuo.color, roughness: 0.4 }));
        fondo.position.y = T.y0 + 0.2;
        g.add(fondo);
        plataformas(g, T.r, [1, 2.05]);
        g.add(en(aro(0.23, 0.012, M.acero), 0, 2.85, 0));
        // lo que hace el vacío: eyectores arriba
        for (const k of [-0.08, 0.08]) g.add(entre([0, 3.08, k], [0.42, 3.2, k], 0.022, M.guinda));
        g.add(en(cil(0.08, 0.2, M.grafito, 0.08, 12), 0.5, 3.04, 0));
        g.add(entre([0.5, 3.04, 0], [0.5, 0.05, 0.1], 0.012, M.acero));
    }

    // --------- reformadora: tres reactores en fila y su calentador
    {
        const g = unidad('reforma');
        const c = cub('reactorR', ['reforma'], { color: '#c6c9cc', metal: 0.5 });
        REFORMA.reactores.forEach(([x, z], i) => {
            const u = unidad('reforma', x, z);
            const cuerpo = sombra(new THREE.Mesh(recipienteGeo(REFORMA.r, REFORMA.alto, 0.7), c));
            cuerpo.position.y = REFORMA.y0;
            u.add(mover(cuerpo, [0, 0.95, 0]));
            const lecho = new THREE.Mesh(new THREE.CylinderGeometry(REFORMA.r - 0.02, REFORMA.r - 0.02, REFORMA.alto * 0.62, 18), M.catal);
            lecho.position.y = REFORMA.y0 + REFORMA.alto / 2;
            u.add(lecho);
            u.add(en(cil(REFORMA.r * 0.6, 0.3, M.grafito, REFORMA.r * 0.9, 16), 0, 0, 0));
            if (i < 2) g.add(entre([x + REFORMA.r, 0.85, z], [x + 0.6 - REFORMA.r, 0.85, z], 0.018, M.acero));
        });
        // calentador largo
        const chC = cub('hornoR', ['reforma'], { color: '#8e8f93', metal: 0.4 });
        g.add(mover(en(caja(1.7, 0.62, 0.34, chC), -3.15, 0.03, -1.45), [0, 0.75, 0]));
        for (let k = 0; k < 4; k++) flama(g, M, -3.7 + k * 0.38, 0.06, -1.45, 0.05, 0.32);
        g.add(en(cil(0.05, 1.4, M.grafito, 0.04, 12), -2.45, 0.65, -1.45));
        humo(-2.45, 2.1, -1.45, 0.42);
    }

    // --------- hidrodesulfuradora: reactor grueso, calentador, separador y compresor
    {
        const g = unidad('hds', HDS.x, HDS.z);
        const c = cub('reactorH', ['hds'], { color: '#b8bbbd', metal: 0.5 });
        const cuerpo = sombra(new THREE.Mesh(recipienteGeo(HDS.r, HDS.alto, 0.6), c));
        cuerpo.position.y = 0.16;
        g.add(mover(cuerpo, [0, 1.15, 0]));
        for (const y of [0.55, 1.05, 1.55]) {
            const lecho = new THREE.Mesh(new THREE.CylinderGeometry(HDS.r - 0.02, HDS.r - 0.02, 0.32, 18), M.catal);
            lecho.position.y = y;
            g.add(lecho);
        }
        g.add(en(cil(HDS.r * 0.7, 0.16, M.grafito, HDS.r * 0.9, 16), 0, 0, 0));
        const u = unidad('hds');
        u.add(en(caja(0.42, 0.58, 0.42, cub('hornoH', ['hds'], { color: '#8e8f93', metal: 0.4 })), -1.75, 0.03, -3.05));
        u.add(en(cil(0.04, 1.15, M.grafito, 0.03, 12), -1.75, 0.6, -3.05));
        humo(-1.75, 1.82, -3.05, 0.36);
        u.add(en(cilX(0.13, 0.52, M.grafito, 18), -0.15, 0.32, -3.15));
        u.add(entre([HDS.x + 0.15, 0.2, HDS.z - 0.18], [-0.35, 0.3, -3.15], 0.018, M.acero));
        // compresor del hidrógeno, con su motor
        u.add(en(caja(0.3, 0.16, 0.2, M.guinda), -1.6, 0.03, -2.2));
        const eje = new THREE.Group();
        eje.position.set(-1.35, 0.13, -2.2);
        for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.02), M.acero); b.rotation.x = (k * PI) / 4; eje.add(b); }
        u.add(eje);
        giran.push({ obj: eje, eje: 'x', vel: () => 9 });
    }

    // --------- FCC: elevador, reactor, regenerador y su columna
    const lechoFcc = [];
    {
        const g = unidad('fcc');
        const [xr, zr] = FCC.riser;
        const cR = cub('reactorF', ['fcc'], { color: '#c6c9cc', metal: 0.5 });
        const cG = cub('regenF', ['fcc'], { color: '#a8abae', metal: 0.5 });
        // el elevador: un tubo alto por donde sube todo
        const riser = cil(0.07, 2.78, cub('riserF', ['fcc'], { color: '#b8bbbd', metal: 0.6 }), 0.07, 16);
        riser.position.set(xr, 0.25, zr);
        g.add(riser);
        // el reactor arriba
        const reactor = sombra(new THREE.Mesh(recipienteGeo(0.34, 0.62, 0.7), cR));
        reactor.position.set(xr, 2.72, zr);
        g.add(mover(reactor, [0, 0.9, 0]));
        // ciclones adentro
        for (const k of [-1, 1]) g.add(en(cil(0.05, 0.3, M.rejilla, 0.075, 12), xr + k * 0.15, 2.92, zr));
        // regenerador: quema el coque del polvo
        const [xg, zg, yg, rg] = FCC.regen;
        const regen = sombra(new THREE.Mesh(recipienteGeo(rg, 1.2, 0.5), cG));
        regen.position.set(xg, yg, zg);
        g.add(mover(regen, [0, 1.7, 0]));
        const lecho = new THREE.Mesh(new THREE.CylinderGeometry(rg - 0.03, rg - 0.03, 0.72, 26), M.lecho);
        lecho.position.set(xg, yg + 0.42, zg);
        lecho.renderOrder = 3;
        g.add(lecho);
        lechoFcc.push(lecho);
        const baseP = [];
        for (let k = 0; k < 4; k++) { const a = (k / 4) * PI * 2 + PI / 4; baseP.push([[xg + Math.cos(a) * 0.42, 0, zg + Math.sin(a) * 0.42], [xg + Math.cos(a) * 0.42, yg + 0.05, zg + Math.sin(a) * 0.42]]); }
        g.add(varias(baseP, 0.026, M.grafito, 8));
        brillo(g, xg, yg + 0.5, zg + rg, 1.4, '#ff7a2a', 'fcc', 0.34);
        // salida de los gases, a su chimenea
        g.add(entre([xg, yg + 1.22, zg], [xg + 0.3, yg + 1.5, zg + 0.5], 0.05, M.grafito));
        g.add(entre([xg + 0.3, yg + 1.5, zg + 0.5], [1.92, 2.5, 3.5], 0.05, M.grafito));
        g.add(en(cil(0.11, 3.45, M.grafito, 0.075, 16), 1.92, 0, 3.5));
        g.add(en(aro(0.09, 0.014, M.guinda), 1.92, 3.25, 3.5));
        humo(1.92, 3.55, 3.5, 0.6);
        // la columna que separa lo que sale
        const [xc, zc, rc, hc] = FCC.columna;
        const u = unidad('fcc', xc, zc);
        const col = sombra(new THREE.Mesh(recipienteGeo(rc, hc - 0.1, 0.5), cub('columnaF2', ['fcc'], { color: '#c3c5c5', metal: 0.5 })));
        col.position.y = 0.1;
        u.add(mover(col, [0, 0, 1]));
        platos(u, rc, 0.5, 2.6, 8);
        u.add(en(aro(rc + 0.025, 0.012, M.acero), 0, 1.5, 0), en(aro(rc + 0.025, 0.012, M.acero), 0, 2.5, 0));
        luces.push([xc + rc + 0.03, 2.54, zc], [xg + rg, yg + 1, zg]);
    }

    // --------- coquizadora: dos tambores, el horno, la columna, las torres de perforación y el coque
    const tambores = [];
    {
        const g = unidad('coquizadora');
        const c = cub('tamborC', ['coquizadora'], { color: '#b5b7b8', metal: 0.5 });
        // la estructura que los carga
        const pares = [];
        const [x0, x1, z0, z1] = [2.62, 4.1, 1.72, 2.58];
        for (const x of [x0, 3.36, x1]) for (const z of [z0, z1]) pares.push([[x, 0, z], [x, 2.9, z]]);
        for (const y of [0.95, 1.9, 2.9]) { pares.push([[x0, y, z0], [x1, y, z0]], [[x0, y, z1], [x1, y, z1]], [[x0, y, z0], [x0, y, z1]], [[3.36, y, z0], [3.36, y, z1]], [[x1, y, z0], [x1, y, z1]]); }
        g.add(varias(pares, 0.016, M.marco, 4));
        COKER.tambores.forEach(([x, z], i) => {
            const u = unidad('coquizadora', x, z);
            const perfil = [[0.001, 0], [0.06, 0], [COKER.r, 0.32], [COKER.r, COKER.alto - 0.1], [0.14, COKER.alto], [0.001, COKER.alto + 0.04]].map(([r, y]) => new THREE.Vector2(r, y));
            const cuerpo = sombra(new THREE.Mesh(new THREE.LatheGeometry(perfil, 28), c));
            cuerpo.position.y = COKER.y0;
            u.add(mover(cuerpo, [0, 0, -1.1]));
            // el coque que va creciendo
            const coque = new THREE.Mesh(new THREE.CylinderGeometry(COKER.r - 0.02, COKER.r - 0.02, 1, 22).translate(0, 0.5, 0), M.coque);
            coque.position.y = COKER.y0 + 0.22;
            u.add(coque);
            // la torre y su perforadora
            const d = [];
            for (const [a, b] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]]) d.push([[a, 2.9, b], [a * 0.3, 3.75, b * 0.3]]);
            for (const y of [3.15, 3.45]) { const k = lerp(0.14, 0.042, (y - 2.9) / 0.85); d.push([[-k, y, -k], [k, y, -k]], [[k, y, -k], [k, y, k]], [[k, y, k], [-k, y, k]], [[-k, y, k], [-k, y, -k]]); }
            u.add(varias(d, 0.007, M.marco, 4));
            const barra = cil(0.01, 1, M.acero, 0.01, 6);
            barra.position.y = 2.8;
            u.add(barra);
            tambores.push({ coque, barra, fase: i * 0.5 });
        });
        // el horno y la columna
        hornoDe('coquizadora', 'hornoCq', { x: COKER.horno[0], z: COKER.horno[1], ancho: 0.62, largo: 0.5, alto: 0.72, chimenea: 2.3 });
        const [xc, zc, rc, hc] = COKER.columna;
        const u = unidad('coquizadora', xc, zc);
        const col = sombra(new THREE.Mesh(recipienteGeo(rc, hc - 0.1, 0.5), cub('columnaC2', ['coquizadora'], { color: '#c3c5c5', metal: 0.5 })));
        col.position.y = 0.1;
        u.add(mover(col, [0, 0, 1]));
        platos(u, rc, 0.5, 2.3, 7);
        // el montón de coque y el canal de agua
        const monton = sombra(new THREE.Mesh(new THREE.ConeGeometry(0.72, 0.42, 26).translate(0, 0.21, 0), M.coque));
        monton.position.set(3.36, 0.012, 0.98);
        monton.scale.z = 0.5;
        g.add(monton);
        const plat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.02, 1.0), M.concreto);
        plat.position.set(3.36, 0.012, 2.15);
        g.add(plat);
        plano(g, 'Coque', 3.36, 1.42, 0.5, 0, 0.03);
    }

    // --------- planta de hidrógeno: un horno de tubos y las columnas que lo limpian
    {
        const g = unidad('hidrogeno', H2P.x, H2P.z);
        const c = cub('hidrogenoC', ['hidrogeno'], { color: '#8e8f93', metal: 0.4 });
        g.add(mover(en(caja(1.06, 0.62, 0.54, c), 0.1, 0.03, 0), [0, 0.85, 0]));
        const tubos = [];
        for (let k = 0; k < 9; k++) { const x = -0.32 + k * 0.105; tubos.push([[x, 0.05, 0], [x, 0.94, 0]]); }
        g.add(varias(tubos, 0.014, M.acero, 6));
        for (const k of [0, 1, 2]) flama(g, M, -0.24 + k * 0.32, 0.06, 0.14, 0.06, 0.32);
        g.add(en(cil(0.05, 1.05, M.grafito, 0.04, 12), 0.55, 0.65, -0.1));
        humo(H2P.x + 0.55, 1.75, H2P.z - 0.1, 0.36);
        for (let k = 0; k < 5; k++) g.add(en(cil(0.06, 0.48, M.marfil, 0.06, 12), -0.55 + k * 0.17, 0.03, 0.42));
        g.add(entre([-0.6, 0.53, 0.42], [0.14, 0.53, 0.42], 0.009, M.acero));
    }

    // --------- azufre: las aminas, el horno Claus y el azufre sólido
    {
        const g = unidad('azufre', AZUF.x, AZUF.z);
        const c = cub('clausC', ['azufre'], { color: '#c6c9cc', metal: 0.4 });
        g.add(en(cil(0.1, 1.15, M.marfil, 0.1, 16), -0.55, 0.03, -0.32));
        const cuerpo = new THREE.Group();
        cuerpo.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 1, 22, 1, true).rotateZ(PI / 2), c)));
        for (const s of [-1, 1]) { const t2 = new THREE.Mesh(new THREE.SphereGeometry(0.19, 16, 10), c); t2.scale.x = 0.4; t2.position.x = s * 0.5; cuerpo.add(t2); }
        cuerpo.position.set(0.08, 0.3, 0);
        g.add(mover(cuerpo, [0, 0.8, 0]));
        for (let k = 0; k < 3; k++) g.add(en(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.18, 14).rotateZ(PI / 2), M.catal), -0.2 + k * 0.28, 0.3, 0));
        const fuegoC = new THREE.Mesh(geoFlama(0.08, 0.26).rotateZ(-PI / 2), M.fuego);
        fuegoC.position.set(-0.46, 0.3, 0);
        fuegoC.renderOrder = 3;
        g.add(fuegoC);
        g.add(en(cil(0.04, 0.9, M.grafito, 0.03, 10), 0.75, 0.03, -0.3));
        // el azufre, ya sólido
        const pila = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.2, 0.62), M.azufreS));
        pila.position.set(1.05, 0.11, 0);
        g.add(pila);
        const pila2 = sombra(new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.2, 4).rotateY(PI / 4), M.azufreS));
        pila2.position.set(1.05, 0.3, 0);
        g.add(pila2);
        rotular(g, 'Azufre', 1.05, 0.11, 0.33, P.tinta, 0.56).renderOrder = 3;
    }

    // --------- mezclado: la esfera de gas y el múltiple
    {
        const g = unidad('mezclado');
        const c = cub('esferaC', ['mezclado'], { color: '#e9e7e1' });
        const e2 = sombra(new THREE.Mesh(new THREE.SphereGeometry(ESFERA.r, 28, 18), c));
        e2.position.set(ESFERA.x, 0.62, ESFERA.z);
        g.add(mover(e2, [0, 1.05, 0]));
        const patas = [];
        for (let k = 0; k < 6; k++) { const a = (k / 6) * PI * 2; patas.push([[ESFERA.x + Math.cos(a) * 0.36, 0, ESFERA.z + Math.sin(a) * 0.36], [ESFERA.x + Math.cos(a) * 0.36, 0.62, ESFERA.z + Math.sin(a) * 0.36]]); }
        g.add(varias(patas, 0.016, M.grafito, 6));
        rotular(g, 'Gas LP', ESFERA.x, 0.64, ESFERA.z + ESFERA.r + 0.01, P.tinta, 0.56).renderOrder = 3;
        // múltiple de mezcla
        const pares = [];
        for (const z of [-0.5, -0.2, 0.1]) pares.push([[4.25, 0.32, z], [4.42, 0.32, z]]);
        g.add(varias(pares, 0.014, M.guinda, 8));
        g.add(en(caja(0.24, 0.3, 0.9, M.grafito), 4.22, 0.02, -0.2));
    }

    // --------- servicios y quemador
    let llama;
    const vahos = [];
    {
        const g = unidad('servicios');
        // quemador: gas de seguridad, con su flama
        const f = unidad('servicios', FLARE.x, FLARE.z);
        f.add(cil(0.05, FLARE.alto, M.grafito, 0.032, 12));
        const tirantes = [];
        for (const a of [0.3, 2.4, 4.5]) tirantes.push([[Math.cos(a) * 0.72, 0, Math.sin(a) * 0.72], [0, FLARE.alto * 0.8, 0]]);
        f.add(varias(tirantes, 0.004, M.acero, 4));
        llama = new THREE.Group();
        llama.position.set(0, FLARE.alto, 0);
        llama.add(new THREE.Mesh(geoFlama(0.1, 0.5), M.llama));
        f.add(llama);
        brillo(f, 0, FLARE.alto + 0.2, 0, 1.4, '#ff8a2a', 'siempre', 0.6);
        // dos torres de enfriamiento, con su vapor
        [[-5.45, -2.45], [-4.45, -2.45]].forEach(([x, z]) => {
            const u = unidad('servicios', x, z);
            u.add(caja(0.86, 0.56, 0.86, M.marfil));
            for (let k = 0; k < 5; k++) u.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.012, 0.88), M.rejilla), 0, 0.08 + k * 0.08, 0));
            u.add(en(cil(0.31, 0.18, M.concreto, 0.36, 22), 0, 0.56, 0));
            const v = new THREE.Group();
            v.position.set(0, 0.68, 0);
            for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.006, 0.05).translate(0.14, 0, 0), M.ventilador); b.rotation.y = (k * PI) / 2; v.add(b); }
            u.add(v);
            giran.push({ obj: v, eje: 'y', vel: () => 4.5 });
            for (let k = 0; k < 3; k++) {
                const s = new THREE.Sprite(M.humo.clone());
                s.material.color.set('#ffffff');
                s.position.set(x, 0.9, z);
                s.renderOrder = 6;
                raiz.add(s);
                vahos.push({ s, x, z, fase: k / 3 });
            }
        });
        // caldera y cuarto de control
        g.add(en(caja(0.62, 0.42, 0.42, M.grafito), -4.6, 0.02, -3.55));
        g.add(en(cil(0.06, 1.55, M.grafito, 0.045, 12), -4.32, 0.02, -3.55));
        humo(-4.32, 1.68, -3.55, 0.42);
        g.add(en(caja(0.9, 0.3, 0.42, M.marfil), -5.5, 0.02, -1.0));
        for (let k = 0; k < 5; k++) { const w = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.006), M.ventana); w.position.set(-5.84 + k * 0.17, 0.18, -0.785); g.add(w); }
    }

    // --------- la salida: muelle, buque, autotanque
    {
        const g = unidad('salida');
        // el muelle sobre pilotes
        const muelle = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.05, 2.9), M.concreto);
        muelle.position.set(6.92, 0.1, 0.1);
        muelle.castShadow = true;
        muelle.receiveShadow = true;
        g.add(muelle);
        const pilotes = [];
        for (let k = 0; k < 8; k++) for (const x of [6.68, 7.18]) pilotes.push([[x, BLOQUE.lecho, -1.28 + k * 0.4], [x, 0.09, -1.28 + k * 0.4]]);
        g.add(varias(pilotes, 0.022, M.grafito, 6));
        // brazos de carga
        for (const z of [-0.6, 0.8]) {
            g.add(entre([7, 0.12, z], [7, 0.78, z], 0.02, M.guinda));
            g.add(entre([7, 0.78, z], [7.3, 0.7, z], 0.016, M.guinda));
        }
        // el buque
        const b = new THREE.Group();
        b.position.set(7.82, 0, 0);
        const forma = new THREE.Shape();
        forma.moveTo(-0.46, -2);
        forma.lineTo(0.46, -2);
        forma.lineTo(0.46, 1.5);
        forma.quadraticCurveTo(0.42, 2, 0, 2.28);
        forma.quadraticCurveTo(-0.42, 2, -0.46, 1.5);
        forma.closePath();
        const casco = sombra(new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: 0.42, bevelEnabled: false }).rotateX(-PI / 2), M.casco));
        casco.position.y = 0.18;
        casco.scale.z = 1;
        b.add(casco);
        const obra = sombra(new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: 0.3, bevelEnabled: false }).rotateX(-PI / 2), M.cascoBajo));
        obra.position.y = -0.12;
        b.add(obra);
        // cubierta con tanques, tubo central, y puente atrás
        for (let k = 0; k < 6; k++) b.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.03, 0.46), M.guinda), 0, 0.605, -1.2 + k * 0.53));
        b.add(entre([0, 0.65, -1.5], [0, 0.65, 1.7], 0.018, M.acero));
        b.add(en(caja(0.72, 0.44, 0.42, M.marfil), 0, 0.6, -1.7));
        b.add(en(caja(0.5, 0.2, 0.28, M.marfil), 0, 1.04, -1.7));
        for (let k = 0; k < 4; k++) b.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.006), M.ventana), -0.15 + k * 0.1, 1.15, -1.555));
        b.add(en(cil(0.06, 0.26, M.guinda, 0.05, 12), 0, 1.24, -1.78));
        humo(7.82, 1.55, -1.78, 0.32);
        g.add(b);
        // el ducto que sale del bloque, con su remate
        g.add(en(cilZ(0.05, 0.14, M.grafito, 12), TANQUES_PROD[3].x, 0.14, Z1 - 0.1));
        // llenadera de autotanques
        const p = unidad('salida', 6.1, 3.25);
        for (const [x, z] of [[-0.4, -0.45], [0.4, -0.45], [-0.4, 0.45], [0.4, 0.45]]) p.add(entre([x, 0, z], [x, 0.62, z], 0.012, M.acero));
        p.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.03, 1.06), M.guinda), 0, 0.64, 0));
        const pipa = new THREE.Group();
        pipa.add(en(caja(0.22, 0.02, 0.8, M.grafito), 0, 0.07, -0.06));
        pipa.add(en(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.56, 16).rotateX(PI / 2), M.marfil), 0, 0.2, -0.16));
        pipa.add(en(caja(0.22, 0.2, 0.18, M.guinda), 0, 0.09, 0.26));
        for (const z of [-0.36, -0.1, 0.26]) for (const s of [-0.1, 0.1]) pipa.add(en(new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.03, 12).rotateZ(PI / 2), M.grafito), s, 0.04, z));
        p.add(pipa);
    }

    // --------- árboles en las orillas, y las luces de la noche
    {
        const lista = [[-8, -4], [-7.2, -4.05], [-8.15, 3.95], [-6.6, 4], [-5.2, 4.1], [-3.7, 4.12], [1, 4.1], [3.6, 4.1], [4.6, 4.05], [6.2, -4.1], [4.7, -4.12], [3.2, -4.1], [1.7, -4.1], [0.2, -4.1], [-1.4, -4.1], [-3, -4.1], [-6.9, -3.9], [6.3, 1.9], [6.35, -1.6]];
        const copa = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.14, 1).scale(1.2, 0.9, 1.2).translate(0, 0.14, 0), M.hoja, lista.length);
        const m4x = new THREE.Matrix4();
        const qx = new THREE.Quaternion();
        lista.forEach(([x, z], i) => { const e = 0.7 + azar(i, 95) * 0.7; m4x.compose(new THREE.Vector3(x, 0, z), qx, new THREE.Vector3(e, e, e)); copa.setMatrixAt(i, m4x); });
        copa.castShadow = true;
        raiz.add(copa);
        const extra = [[-6, 0.98, 0.25], [-3.8, 0.98, 0.25], [-1.6, 0.98, 0.25], [0.6, 0.98, 0.25], [2.8, 0.98, 0.25], [4.3, 0.98, 0.25], [2.65, 1.94, 1.72], [4.08, 1.94, 1.72], [2.65, 2.94, 2.58], [4.08, 2.94, 2.58], [-1.35, 3.2, 2.4], [-3.15, 1.3, -2.2], [HDS.x, 2.2, HDS.z], [H2P.x, 1.1, H2P.z], [AZUF.x, 0.95, AZUF.z], [6.9, 0.8, -1.2], [6.9, 0.8, 1.4], [6.1, 0.72, 3.25], [-7.5, 0.82, -1.85], [-7.5, 0.82, 1.65], [5.9, 0.9, -2], [5.9, 0.9, 2]];
        const todas = [...luces, ...extra];
        const foco = new THREE.InstancedMesh(new THREE.SphereGeometry(0.018, 6, 5), M.lampara, todas.length);
        todas.forEach(([x, y, z], i) => { m4x.makeTranslation(x, y, z); foco.setMatrixAt(i, m4x); });
        raiz.add(foco);
        const g = new THREE.Group();
        raiz.add(g);
        todas.filter((_, i) => i % 2 === 0).forEach(([x, y, z]) => brillo(g, x, y, z, 0.36, '#ffcf8f', 'noche', 0.5));
    }

    // ---------- lo que corre por los tubos
    const parteDe = L => L.parte ?? null;
    const tubos = crearTubos({ raiz, lineas: LINEAS, fluidos: FLUIDOS, M, partes, parteDe, movil });
    kit.cerrarGotas(new THREE.SphereGeometry(1, 8, 6));

    const anclas = {};
    for (const p of PARTES) {
        const o = new THREE.Object3D();
        o.position.set(...p.ancla);
        raiz.add(o);
        anclas[p.id] = o;
    }
    const apagables = [[kit.cubiertas.reactorF, 'fcc'], [kit.cubiertas.regenF, 'fcc'], [kit.cubiertas.riserF, 'fcc'], [kit.cubiertas.columnaF2, 'fcc'], [kit.cubiertas.tamborC, 'coker'], [kit.cubiertas.columnaC2, 'coker'], [kit.cubiertas.torreVC, 'vacio']].map(([c, id]) => ({ mat: c.mat, id, color: c.mat.color.clone() }));
    const gris = new THREE.Color('#8a8c8e');

    // ---------- posar
    function posar(e) {
        const n = e.noche;
        const act = p => (p === 'noche' ? n : p === 'siempre' ? 1 : p ? (e.activo[p] ?? 0) : 1);
        const a = sale(e.desarme * 3);
        const ab = { ...(e.abierta || {}), desarmeV: sale(e.desarme * 2.2) };
        kit.posar(e, act, ab, { apagar: a });
        tubos.posar(e, a);
        // los hornos
        M.fuego.opacity = clamp01(0.35 + 0.55 * e.activo.horno) * (0.85 + 0.15 * Math.sin(e.t * 11));
        M.fuegoIn.opacity = M.fuego.opacity;
        // el nivel de los tanques se mueve despacio
        tanques.forEach(t => {
            const k = 0.42 + 0.3 * (0.5 + 0.5 * Math.sin(e.t * 0.05 + t.f * 6));
            t.liq.scale.y = t.h * k;
            t.techo.position.y = t.h * k + 0.015;
        });
        // lecho de la FCC
        M.lecho.opacity = 0.62 * e.en.fcc * (0.85 + 0.15 * Math.sin(e.t * 7));
        // los tambores se llenan de coque por turnos: uno llena; el otro se enfría y se corta
        tambores.forEach(t => {
            const u = (e.ciclo + t.fase) % 1;
            const llena = u < 0.5;
            const nivel = llena ? u * 2 : Math.max(0, 1 - Math.max(0, u - 0.7) / 0.3);
            t.coque.scale.y = Math.max(0.01, nivel * (COKER.alto - 0.34)) * (e.en.coker > 0.02 ? 1 : 0.01);
            const baja = u > 0.7 ? (u - 0.7) / 0.3 : 0;
            t.barra.scale.y = 0.12 + baja * 1.6;
            t.barra.position.y = 3.65 - t.barra.scale.y;
        });
        // las plantas apagadas pierden color
        apagables.forEach(p => { p.mat.color.copy(p.color).lerp(gris, 1 - clamp01(e.en[p.id] ?? 1)); });
        // el quemador
        const s = 1 + 0.18 * Math.sin(e.t * 9) + 0.1 * Math.sin(e.t * 23);
        llama.scale.set(s, 1 + 0.25 * Math.sin(e.t * 7), s);
        M.llama.opacity = 0.9 * (1 - a);
        // humo y vapor
        const hum = 0.14 + 0.1 * e.activo.horno;
        M.humo.opacity = hum * (1 - a) * (1 - 0.6 * n);
        humos.forEach(h => {
            const u = (e.t * 0.16 + h.fase + h.x * 0.13) % 1;
            h.s.position.set(h.x + u * 0.5, h.y + u * 1.1, h.z - u * 0.25);
            h.s.scale.setScalar(h.esc * (0.35 + u));
            h.s.visible = a < 0.8;
        });
        vahos.forEach(h => {
            const u = (e.t * 0.2 + h.fase + h.x * 0.2) % 1;
            h.s.position.set(h.x + u * 0.2, 0.86 + u * 0.95, h.z - u * 0.1);
            h.s.scale.setScalar(0.32 + u * 0.55);
            h.s.material.opacity = (1 - u) * 0.34 * (1 - a) * (1 - 0.5 * n);
            h.s.visible = a < 0.8;
        });
        // neones y luces
        M.lampara.color.set('#9a9c9f').lerp(new THREE.Color('#ffe2ad'), n);
        M.ventana.color.set('#3f4a57').lerp(new THREE.Color('#ffc77a'), n);
    }
    return { raiz, posar, partes, anclas, giran, repintar: kit.repintar, equipos: EQUIPOS, crudos: CRUDOS };
}
