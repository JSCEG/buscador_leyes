// La red de distribución, hecha con código. Sistema Búho: una calle con sus banquetas y 30 casas con tinaco, unas con paneles. En la
// banqueta de enfrente, los postes: arriba la línea de media tensión, en el poste del centro el transformador con su cortacircuito fusible y
// su apartarrayos, y abajo, en su bastidor, la red de baja tensión con el neutro arriba. De ahí baja una acometida a cada casa, a su
// medidor. Nada está a escala.
//
//   materiales(P)     escenario(renderer, scene, M, { movil, oscuro })
//   construir(M, P, { movil, oscuro }) → { raiz, posar(e), partes, anclas, giran, repintar }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { azar, clamp01, fract, lerp, sale } from '../planta-comun/ayudas.js';
import { caja, cil, crearAyudante, crearTubos, en, estudio, geoEntre, materialesBase, sombra, texturaGrano } from '../planta-comun/piezas.js';
import { colgar } from '../planta-comun/lineas.js';
import { MATERIAL_CONDUCTOR } from '../planta-comun/conductores.js';
import { AEREAS, BAJA, BLOQUE, BORNES, CALLEZ, CASAS, FICHA, FLUIDOS, LINEAS, PARTES, X, Y, ZP, ZS, diablitoPlanta, enLaRed } from './modelo.js';

const PI = Math.PI;
export const P_PLANTA = {
    papel: '#fafafa', noche: '#0a0e12', tinta: '#171317', marfil: '#f3f1ec', grafito: '#303137', acero: '#a7abb3', guinda: '#9b2247', rosa: '#e57a9a',
    tierraDia: '#d6d7c8', tierraNoche: '#23272c', losaDia: '#dcdcda', losaNoche: '#2c3036', suelo: '#b9a688',
};
const COLORES_CASA = ['#e9d8c4', '#d9e4dc', '#f1d9cf', '#e6e0c8', '#d8dde8', '#efe3d3', '#e2cfd6', '#d6e2d0'];

export function materiales(P) {
    const M = materialesBase(P, FLUIDOS);
    Object.assign(M, {
        roca: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#b9a688', 'rgba(70,52,30,0.18)', [7, 1]), roughness: 0.96, envMapIntensity: 0.25 }),
        asfalto: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#8a8c90', 'rgba(0,0,0,0.25)', [12, 2]), roughness: 0.95, envMapIntensity: 0.2 }),
        banqueta: new THREE.MeshStandardMaterial({ color: '#d9d6cf', roughness: 0.9, envMapIntensity: 0.25 }),
        pasto: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#cfd9bf', 'rgba(40,60,30,0.15)', [10, 3]), roughness: 0.95, envMapIntensity: 0.2 }),
        poste: new THREE.MeshStandardMaterial({ color: '#c9c6bf', roughness: 0.85, envMapIntensity: 0.3 }),
        galv: new THREE.MeshStandardMaterial({ color: '#9aa0a8', roughness: 0.45, metalness: 0.7, envMapIntensity: 0.85 }),
        porcelana: new THREE.MeshStandardMaterial({ color: '#8b5a43', roughness: 0.32, metalness: 0.05, envMapIntensity: 0.9 }),
        carrete: new THREE.MeshStandardMaterial({ color: '#efece6', roughness: 0.4, envMapIntensity: 0.6 }),
        trafo: new THREE.MeshStandardMaterial({ color: '#9aa3a6', roughness: 0.45, metalness: 0.4, envMapIntensity: 0.9 }),
        cable: MATERIAL_CONDUCTOR(),
        cableCobre: MATERIAL_CONDUCTOR(),
        acometida: new THREE.MeshStandardMaterial({ color: '#2b2d31', roughness: 0.6, metalness: 0.2 }),
        diablito: new THREE.MeshBasicMaterial({ color: '#e0302a', toneMapped: false }),
        medidor: new THREE.MeshStandardMaterial({ color: '#dfe3e6', roughness: 0.35, metalness: 0.2 }),
        pantalla: new THREE.MeshBasicMaterial({ color: '#7fd0ff', toneMapped: false }),
        panel: new THREE.MeshStandardMaterial({ color: '#23345a', roughness: 0.25, metalness: 0.5, emissive: '#000000', envMapIntensity: 1.2 }),
        marcoPanel: new THREE.MeshStandardMaterial({ color: '#c3c7cc', roughness: 0.35, metalness: 0.7 }),
        tinaco: new THREE.MeshStandardMaterial({ color: '#2c2c2c', roughness: 0.6, envMapIntensity: 0.4 }),
        puerta: new THREE.MeshStandardMaterial({ color: '#7a5a43', roughness: 0.7, envMapIntensity: 0.3 }),
        casaVentana: new THREE.MeshBasicMaterial({ color: '#ffd27a', toneMapped: false }),
        chispa: new THREE.MeshBasicMaterial({ color: '#ffb000', toneMapped: false }),
        tierraX: new THREE.MeshStandardMaterial({ color: '#c8743c', roughness: 0.34, metalness: 0.9, transparent: true }),
    });
    M.cableCobre.color.set('#8a6450');
    M.casas = COLORES_CASA.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, envMapIntensity: 0.3 }));
    M.vaho = { calor: new THREE.SpriteMaterial({ map: M.vaho, color: '#c9b9a6', transparent: true, opacity: 0, depthWrite: false }) };
    return M;
}

const [X0, X1] = BLOQUE.x;
const [Z0, Z1] = BLOQUE.z;
const Y0 = BLOQUE.y[0];
export function escenario(renderer, scene, M, { movil = false, oscuro = false } = {}) {
    const dia = { roca: new THREE.Color(oscuro ? '#c9c5bc' : '#ffffff'), pasto: new THREE.Color(oscuro ? '#c4cbb9' : '#ffffff'), asfalto: new THREE.Color(oscuro ? '#c0c0c0' : '#ffffff'), banqueta: new THREE.Color(oscuro ? '#bdbab3' : '#d9d6cf') };
    const noche = { roca: new THREE.Color('#6a655c'), pasto: new THREE.Color('#545a50'), asfalto: new THREE.Color('#4a4c50'), banqueta: new THREE.Color('#5f5e5a') };
    if (oscuro) { M.acometida.color.set('#7c7f86'); M.galv.color.set('#a9afb7'); }
    return estudio(renderer, scene, {
        movil, oscuro, y0: Y0, alcance: 15,
        alActualizar(n) {
            for (const k of ['roca', 'pasto', 'asfalto', 'banqueta']) M[k].color.copy(dia[k]).lerp(noche[k], n);
        },
    });
}

// ------------------------------------------------------------------ geometrías que se repiten
const memo = new Map();
const una = (k, f) => { if (!memo.has(k)) memo.set(k, f()); return memo.get(k); };
const geoAislador = (h, r) => una(`a${h}|${r}`, () => {
    const g = [new THREE.CylinderGeometry(r * 0.5, r * 0.55, h, 10).translate(0, h / 2, 0)];
    const n = Math.max(2, Math.round(h / 0.04));
    for (let i = 0; i < n; i++) g.push(new THREE.CylinderGeometry(r, r, 0.01, 14).translate(0, 0.02 + (i * (h - 0.04)) / Math.max(1, n - 1), 0));
    return mergeGeometries(g);
});
/** Un conductor que cuelga entre apoyos, igual que los de planta-comun/conductores.js: k es la fase (-1, 0 o 1). */
function geoHilo(apoyos, k = 0, r = 0.0065) {
    const curva = new THREE.CatmullRomCurve3(colgar(apoyos, k).map(p => new THREE.Vector3(...p)));
    return new THREE.TubeGeometry(curva, Math.max(12, Math.round(curva.getLength() * 28)), r, 5);
}
/** Un cable por varios puntos (un puente), como malla. */
const geoPuente = (puntos, r = 0.0055) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(puntos.map(p => new THREE.Vector3(...p))), 16, r, 5, false);
/** Un cable de a a b con su comba, como malla. */
function geoComba(a, b, comba, r = 0.006, n = 12) {
    const pts = [];
    for (let i = 0; i <= n; i++) { const u = i / n; pts.push(new THREE.Vector3(lerp(a[0], b[0], u), lerp(a[1], b[1], u) - comba * 4 * u * (1 - u), lerp(a[2], b[2], u))); }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n + 4, r, 5, false);
}

export function construir(M, P, { movil = false, oscuro = false } = {}) {
    const raiz = new THREE.Group();
    const ids = PARTES.map(p => p.id);
    const kit = crearAyudante(M, raiz, ids, { movil });
    const { partes, giran, unidad, mover, brillo, cub, rotular } = kit;
    const colorSuelo = oscuro ? '#f2efe8' : P.tinta;
    const plano = (padre, texto, x, z, ancho, giro = 0, y = 0.012) => { const r = rotular(padre, texto, x, y, z, colorSuelo, ancho); r.rotation.set(-PI / 2, 0, giro); return r; };
    const malla = (geos, m) => sombra(new THREE.Mesh(mergeGeometries(geos), m));

    // --------- el suelo: el arroyo de la calle, las banquetas, los terrenos y los cortes
    {
        const losa = (x0, x1, z0, z1, y, m) => { const g = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, -Y0 + y, z1 - z0).translate(0, (Y0 + y) / 2, 0), m); g.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); g.receiveShadow = true; raiz.add(g); };
        losa(X0, X1, -CALLEZ.arroyo, CALLEZ.arroyo, -0.01, M.asfalto);
        for (const s of [-1, 1]) {
            losa(X0, X1, s > 0 ? CALLEZ.arroyo : -CALLEZ.banqueta, s > 0 ? CALLEZ.banqueta : -CALLEZ.arroyo, 0.025, M.banqueta);
            losa(X0, X1, s > 0 ? CALLEZ.banqueta : Z0, s > 0 ? Z1 : -CALLEZ.banqueta, 0.02, M.pasto);
        }
        // la raya del centro
        const raya = [];
        for (let x = X0 + 0.3; x < X1 - 0.3; x += 0.7) raya.push(new THREE.BoxGeometry(0.35, 0.004, 0.035).translate(x + 0.17, -0.008, 0));
        raiz.add(new THREE.Mesh(mergeGeometries(raya), M.marfil));
        plano(raiz, 'Calle de ejemplo', -6.2, 0.28, 1.6);
    }

    // --------- las casas: cuerpo, azotea con pretil, tinaco, puerta y ventanas
    const casaU = unidad('casa');
    const medidorU = unidad('medidor');
    const ventanas = [];
    const panelesCasa = new Map();
    const paneles = unidad('paneles');
    {
        const geosVentana = [];
        CASAS.forEach(c => {
            const g = new THREE.Group();
            g.position.set(c.x, 0.02, c.z);
            const m = M.casas[c.i % M.casas.length];
            const alto = Y.techo - 0.02 + (c.i % 3 === 0 ? 0.25 : 0);
            g.add(caja(0.9, alto, 0.8, m));
            g.add(en(caja(0.92, 0.06, 0.82, m), 0, alto, 0));
            g.add(en(cil(0.06, 0.12, M.tinaco), 0.25, alto + 0.06, c.lado * 0.15));
            g.add(en(caja(0.18, 0.34, 0.02, M.puerta), -0.2, 0, -c.lado * 0.41));
            (c.i === FICHA.casa ? casaU : raiz).add(g);
            // ventanas que se prenden de noche
            for (const dx of [0.12, 0.32]) geosVentana.push(new THREE.BoxGeometry(0.14, 0.12, 0.012).translate(c.x + dx, 0.42 + (alto > Y.techo ? 0.25 : 0), c.z - c.lado * 0.405));
            // el medidor y su mufa, en la fachada
            const med = new THREE.Group();
            med.position.set(c.x - 0.38, 0.02, c.z - c.lado * 0.41);
            med.add(en(caja(0.08, 0.11, 0.04, M.medidor), 0, Y.fachada - 0.06, -c.lado * 0.02));
            med.add(en(caja(0.04, 0.02, 0.005, M.pantalla), 0, Y.fachada + 0.0, -c.lado * 0.043));
            med.add(en(cil(0.008, Y.fachada + 0.12 - (Y.fachada + 0.05), M.galv), 0.0, Y.fachada + 0.05, -c.lado * 0.02));
            (c.i === FICHA.medidor ? medidorU : raiz).add(med);
            // paneles en la azotea (se ven solo en las casas que los tienen)
            const pg = new THREE.Group();
            pg.position.set(c.x - 0.12, alto + 0.08, c.z - c.lado * 0.05);
            for (const dz of [-0.16, 0.16]) {
                const pan = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.012, 0.28), M.panel);
                pan.position.set(0, 0.06, dz);
                pan.rotation.x = -c.lado * 0.32;
                pan.castShadow = true;
                pg.add(pan);
                pg.add(en(caja(0.02, 0.06, 0.02, M.marcoPanel), -0.18, 0, dz), en(caja(0.02, 0.06, 0.02, M.marcoPanel), 0.18, 0, dz));
            }
            pg.visible = false;
            paneles.add(pg);
            panelesCasa.set(c.i, pg);
        });
        const v = new THREE.Mesh(mergeGeometries(geosVentana), M.casaVentana);
        raiz.add(v);
        ventanas.push(v);
    }

    // --------- los postes, sus crucetas y la línea de media tensión
    const postes = unidad('postes');
    const alimentador = unidad('alimentador');
    const secundaria = unidad('secundaria');
    const neutro = unidad('neutro');
    const retenida = unidad('retenida');
    {
        const g = [];
        const crucetas = [];
        const pines = [];
        const carretes = [];
        const bastidores = [];
        for (const x of X.postes) {
            g.push(new THREE.CylinderGeometry(0.035, 0.06, Y.poste, 10).translate(x, Y.poste / 2, ZP));
            crucetas.push(new THREE.BoxGeometry(0.05, 0.05, 0.75).translate(x, Y.cruceta, ZP + 0.1));
            pines.push(new THREE.CylinderGeometry(0.02, 0.028, 0.08, 10).translate(x, Y.cruceta + 0.065, ZP + 0.3));
            // el bastidor de la red de baja tensión: neutro arriba y las dos fases
            bastidores.push(new THREE.BoxGeometry(0.02, Y.neutro - Y.fases[1] + 0.12, 0.02).translate(x, (Y.neutro + Y.fases[1]) / 2, ZP - 0.035));
            for (const y of [Y.neutro, ...Y.fases]) carretes.push(new THREE.CylinderGeometry(0.018, 0.018, 0.04, 10).rotateX(PI / 2).translate(x, y, ZS));
        }
        postes.add(malla(g, M.poste));
        postes.add(malla(crucetas, M.galv));
        alimentador.add(malla(pines, M.porcelana));
        secundaria.add(malla(bastidores, M.galv), malla(carretes, M.carrete));
        // la fase de media tensión: llega de fuera del dibujo y va de poste en poste, sobre el aislador de alfiler de cada cruceta
        alimentador.add(malla([geoHilo(AEREAS.mtCalle)], M.cable));
        // la red de baja tensión, de cobre: las dos fases y el neutro, de carrete en carrete del bastidor; remata en los postes de las orillas
        secundaria.add(malla([geoHilo(AEREAS.btCalle, -1), geoHilo(AEREAS.btCalle, 0)], M.cableCobre));
        neutro.add(malla([geoHilo(AEREAS.btCalle, 1)], M.cableCobre));
        // el neutro baja por el poste del transformador a su varilla de tierra (se ve como por rayos X al elegirlo)
        const t = [geoEntre([X.trafo - 0.05, Y.neutro, ZP + 0.03], [X.trafo - 0.05, -0.02, ZP + 0.03], 0.006, 5), geoEntre([X.trafo - 0.05, -0.02, ZP + 0.03], [X.trafo - 0.25, -0.05, ZP + 0.03], 0.006, 5), geoEntre([X.trafo - 0.25, -0.05, ZP + 0.03], [X.trafo - 0.25, -0.34, ZP + 0.03], 0.012, 6)];
        const tm = new THREE.Mesh(mergeGeometries(t), M.tierraX);
        tm.renderOrder = 4;
        neutro.add(tm);
        // retenidas en los postes de las orillas: de la punta del poste a su ancla en el suelo
        for (const x of [X.postes[0], X.postes.at(-1)]) {
            const s = Math.sign(x);
            retenida.add(sombra(new THREE.Mesh(geoEntre([x, Y.cruceta - 0.05, ZP], [x + s * 0.45, 0.03, ZP], 0.008, 5), M.galv)));
            retenida.add(en(caja(0.08, 0.02, 0.08, M.concreto), x + s * 0.45, 0.02, ZP));
            retenida.add(en(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 8).translate(0, 0.1, 0), M.marfil)), x + s * 0.32, 0.03, ZP));
        }
    }

    // --------- el poste del transformador: cortacircuito, apartarrayos y el transformador tipo YT
    const cortacircuito = unidad('cortacircuito');
    const apartarrayos = unidad('apartarrayos');
    const transformador = unidad('transformador');
    let tubo = null;
    {
        // una cruceta más abajo para el cortacircuito y el apartarrayos
        cortacircuito.add(en(caja(0.05, 0.05, 0.5, M.galv), X.trafo, Y.cortacircuito - 0.025, ZP + 0.18));
        // cortacircuito: su cuerpo de porcelana y el tubo portafusible, que cae al fundirse
        const cuerpo = new THREE.Mesh(geoAislador(0.16, 0.022), M.porcelana);
        cuerpo.rotation.x = 0.35;
        cuerpo.position.set(X.trafo + 0.06, Y.cortacircuito + 0.02, ZP + 0.3);
        cortacircuito.add(cuerpo);
        const piv = new THREE.Group();
        piv.position.set(X.trafo + 0.12, Y.cortacircuito + 0.0, ZP + 0.3);
        piv.add(en(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 10).translate(0, 0.1, 0), M.galv)), 0, 0, 0));
        cortacircuito.add(piv);
        tubo = piv;
        // sus contactos: arriba llega la línea; abajo, la bisagra del tubo, de donde sale el puente al transformador
        const [ca, cb] = [BORNES.cortaArriba, BORNES.cortaAbajo];
        cortacircuito.add(en(caja(0.03, 0.02, 0.03, M.galv), ca[0], ca[1] - 0.012, ca[2]));
        cortacircuito.add(en(caja(0.03, 0.025, 0.03, M.galv), cb[0], cb[1] - 0.008, cb[2]));
        cortacircuito.add(sombra(new THREE.Mesh(geoEntre([X.trafo + 0.06, Y.cortacircuito + 0.17, ZP + 0.35], [ca[0], ca[1] - 0.002, ca[2]], 0.005, 5), M.galv)));
        // apartarrayos, acostado en la cruceta
        const ap = new THREE.Mesh(geoAislador(0.18, 0.024), M.porcelana);
        ap.rotation.z = PI / 2;
        ap.position.set(X.trafo - 0.06, Y.cortacircuito + 0.03, ZP + 0.3);
        apartarrayos.add(ap);
        // el transformador: tanque, tapa, boquilla de 7,620 V y las de baja tensión
        const tg = new THREE.Group();
        tg.position.set(X.trafo + 0.14, Y.trafo - 0.18, ZP + 0.14);
        const tanque = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.36, 22).translate(0, 0.18, 0), cub('trafo', ['transformador'], { color: '#9aa3a6', metal: 0.4 }));
        tanque.castShadow = true;
        tg.add(tanque);
        // adentro: el núcleo y las bobinas
        tg.add(en(caja(0.12, 0.2, 0.08, M.nucleo ?? M.grafito), 0, 0.07, 0));
        tg.add(en(cil(0.05, 0.16, M.cobre), 0.0, 0.09, 0.05));
        const tapa = new THREE.Group();
        tapa.add(en(cil(0.14, 0.02, M.trafo), 0, 0.36, 0));
        tapa.add(en(sombra(new THREE.Mesh(geoAislador(0.12, 0.02), M.porcelana)), 0, 0.38, 0));
        tg.add(mover(tapa, [0, 0.3, 0]));
        for (const dz of [-0.06, 0, 0.06]) tg.add(en(sombra(new THREE.Mesh(geoAislador(0.06, 0.014), M.carrete)), -0.13, 0.26, dz).rotateZ(PI / 2));
        tg.add(en(caja(0.04, 0.24, 0.04, M.galv), -0.13, 0.04, 0));
        transformador.add(mover(tg, [0, 0, 0.5]));
        brillo(tg, 0, 0.2, 0, 0.6, '#ff8a3c', 'calor', 1, false);
        // puentes: de la línea al cortacircuito, de este al transformador y de la línea al apartarrayos; cada punta en su borne
        const alfiler = BORNES[`alfiler${X.postes.indexOf(X.trafo)}`];
        const bAp = BORNES.apartarrayos;
        const yLinea = colgar(AEREAS.mtCalle, 0, 64).reduce((m, p) => (Math.abs(p[0] - bAp[0]) < Math.abs(m[0] - bAp[0]) ? p : m))[1];
        const pu = [geoComba(alfiler, BORNES.cortaArriba, 0.02, 0.0055), geoComba(BORNES.cortaAbajo, BORNES.trafoAlta, 0.03, 0.0055), geoComba([bAp[0], yLinea, bAp[2]], bAp, 0, 0.0055)];
        transformador.add(malla(pu, M.cable));
        // y de cada boquilla de baja tensión a su carrete del bastidor, por un lado del poste (la de en medio, al neutro)
        transformador.add(malla(BAJA.map(({ boquilla: b, carrete: c }) => geoPuente([b, [X.trafo - 0.068, (b[1] + c[1]) / 2, ZP + 0.01], c])), M.cableCobre));
        // el calor del transformador cuando se pasa
        const vahos = [];
        for (let i = 0; i < 4; i++) { const s = new THREE.Sprite(M.vaho.calor); s.visible = false; raiz.add(s); vahos.push({ s, fase: i / 4 }); }
        transformador.userData.vahos = vahos;
    }

    // --------- las acometidas: un cable de la red de la calle al medidor de cada casa
    const acometida = unidad('acometida');
    {
        const g = [];
        const gU = [];
        for (const L of LINEAS.filter(l => l.grupo === 'acometidas')) {
            const geo = geoHilo(L.apoyos, 0, 0.004);
            (L.casa === FICHA.acometida ? gU : g).push(geo);
        }
        raiz.add(malla(g, M.acometida));
        acometida.add(malla(gU, M.acometida));
    }

    // --------- los diablitos: un cable colgado directo de la red, sin pasar por el medidor (se ven en las casas que los tienen)
    const diablito = unidad('diablito');
    const diablitos = new Map();
    for (const c of CASAS) {
        const [a, b] = diablitoPlanta(c);
        const g = new THREE.Group();
        g.add(new THREE.Mesh(geoComba(a, b, 0.1, 0.007, 10), M.diablito));
        g.add(en(new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.007, 6, 12, PI), M.diablito), a[0], a[1] + 0.01, a[2]));
        g.visible = false;
        diablito.add(g);
        diablitos.set(c.i, g);
    }

    // --------- el árbol junto a la línea, y la rama que cae sobre la red de baja tensión
    const arbol = unidad('arbol');
    const rama = new THREE.Group();
    {
        arbol.add(en(cil(0.04, 1.1, M.madera, 0.03), X.arbol, 0.02, ZP + 0.18));
        arbol.add(en(sombra(new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), M.hoja)), X.arbol, 1.45, ZP + 0.18));
        rama.add(en(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.7, 6).translate(0, 0.35, 0), M.madera)), 0, 0, 0));
        rama.add(en(sombra(new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), M.hoja)), 0, 0.68, 0));
        rama.rotation.z = PI / 2.4;
        raiz.add(rama);
    }
    const chispa = new THREE.Group();
    chispa.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.03, 0), M.chispa));
    for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.009, 0.14, 4).translate(0, 0.07, 0), M.chispa); r.rotation.set(azar(i, 2) * PI * 2, 0, azar(i, 3) * PI * 2); chispa.add(r); }
    chispa.renderOrder = 7;
    raiz.add(chispa);
    const brilloChispa = brillo(raiz, 0, enLaRed(0), ZS, 0.5, '#ffb000', 'falla', 1.3, false);

    // --------- al desarmar: el transformador se separa, el tubo y el apartarrayos suben, la red de baja tensión sube
    for (const [g, d] of [[cortacircuito, [0, 0.35, 0]], [apartarrayos, [0, 0.5, 0]], [secundaria, [0, 0.25, -0.3]], [neutro, [0, 0.25, -0.3]], [acometida, [0, 0.4, 0]], [paneles, [0, 0.35, 0]]]) mover(g, d);

    // --------- lo que corre por los cables
    const tubos = crearTubos({ raiz, lineas: LINEAS, fluidos: FLUIDOS, M, partes, parteDe: () => null, movil });
    kit.cerrarGotas(new THREE.SphereGeometry(1, 8, 6));

    const anclas = {};
    for (const p of PARTES) { const o = new THREE.Object3D(); o.position.set(...p.ancla); raiz.add(o); anclas[p.id] = o; }

    // ---------- posar
    const colorVentana = new THREE.Color();
    const apagada = new THREE.Color('#4a4f57');
    const encendida = new THREE.Color('#ffd27a');
    function posar(e) {
        const n = e.noche;
        const act = p => (p === 'noche' ? n : p === 'siempre' ? 1 : p ? (e.activo[p] ?? 0) : 1);
        const a = sale(e.desarme * 3);
        const ab = { ...(e.abierta || {}) };
        kit.posar(e, act, ab, { apagar: a });
        tubos.posar(e, a);
        // las ventanas: más luz de noche, menos con poco voltaje, nada si cayó el fusible
        colorVentana.copy(apagada).lerp(encendida, clamp01(e.luz) * (0.35 + 0.65 * n));
        M.casaVentana.color.copy(colorVentana);
        M.pantalla.color.set(e.abierto ? '#2b3036' : '#7fd0ff');
        // paneles y diablitos
        for (const [i, g] of panelesCasa) g.visible = e.paneles.has(i);
        M.panel.emissive.set('#1d3f7a').multiplyScalar(0.25 * e.activo.sol * (1 - n));
        for (const [i, g] of diablitos) g.visible = e.diablitos.has(i) && a < 0.5;
        // el tubo del fusible: de pie, o colgando si se fundió
        const kt = Math.min(1, e.dt * 6);
        tubo.rotation.z = lerp(tubo.rotation.z, e.abierto ? -2.4 : 0, kt);
        // la rama: arriba en el árbol, o sobre la red cuando hay falla
        const xr = e.xRama;
        const [tx, ty, tr] = e.rama ? [xr, enLaRed(xr) + 0.02, PI / 2.05] : [X.arbol - 0.25, 1.35, PI / 2.6];
        rama.position.x = lerp(rama.position.x || tx, tx, kt);
        rama.position.y = lerp(rama.position.y || ty, ty, kt);
        rama.position.z = ZS + 0.02;
        rama.rotation.z = lerp(rama.rotation.z, tr, kt);
        chispa.position.set(xr, enLaRed(xr), ZS);
        brilloChispa.position.copy(chispa.position);
        const parpadeo = 0.6 + 0.4 * Math.sin(e.t * 47) * Math.sin(e.t * 31);
        chispa.visible = e.enFalla && a < 0.5;
        chispa.scale.setScalar(parpadeo);
        chispa.rotation.y = e.t * 9;
        // el calor del transformador
        const calor = e.activo.calor;
        M.vaho.calor.opacity = 0.5 * calor * (1 - a);
        transformador.userData.vahos.forEach(v => {
            v.s.visible = calor > 0.2 && a < 0.5;
            if (!v.s.visible) return;
            const u = fract(e.t * 0.35 + v.fase);
            v.s.position.set(X.trafo + 0.14 + Math.sin(e.t + v.fase * 6) * 0.03, Y.trafo + 0.25 + u * 0.5, ZP + 0.14);
            v.s.scale.setScalar(0.14 + u * 0.25);
        });
        // la tierra se ve como por rayos X al elegir el neutro o al ver por dentro
        const rx = Math.max(e.adentro, ab.neutro ?? 0);
        M.tierraX.depthTest = rx < 0.5;
        M.lampara.color.set('#9a9c9f').lerp(new THREE.Color('#ffe2ad'), n);
        M.ventana.color.set('#3f4a57').lerp(new THREE.Color('#ffc77a'), n);
    }
    return { raiz, posar, partes, anclas, giran, repintar: kit.repintar };
}
