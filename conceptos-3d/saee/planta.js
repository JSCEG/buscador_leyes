// El sitio de almacenamiento, hecho con código. Sistema Búho: a la izquierda, el patio del SAEE no asociado (diez contenedores de baterías,
// sus inversores bidireccionales, el clima de cada contenedor, el control y el transformador elevador); al fondo, la subestación de la Red
// Nacional de Transmisión con el SAEE de la red, el medidor y el CENACE; a la derecha, la central solar con su propio SAEE y una fábrica con
// el suyo; al frente, una mina sin red con sus paneles, su batería y su planta diésel. Nada está a escala.
//
//   materiales(P)     escenario(renderer, scene, M, { movil, oscuro })
//   construir(M, P, { movil, oscuro }) → { raiz, posar(e), partes, anclas, giran, repintar }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { sale } from '../planta-comun/ayudas.js';
import { caja, cil, crearAyudante, crearTubos, en, estudio, geoTorre, materialesBase, sombra, texturaGrano } from '../planta-comun/piezas.js';
import { ALTO_LINEA, BLOQUE, CONT, FILAS_SAEE, FLUIDOS, LINEAS, PARTES, POR_FILA, SITIO } from './modelo.js';

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
        concreto: new THREE.MeshStandardMaterial({ color: '#cfccc5', roughness: 0.85 }),
        contenedor: new THREE.MeshStandardMaterial({ color: '#efede8', roughness: 0.45, metalness: 0.2, envMapIntensity: 0.7 }),
        rack: new THREE.MeshStandardMaterial({ color: '#3a4048', roughness: 0.5, metalness: 0.5 }),
        modulo: new THREE.MeshStandardMaterial({ color: '#5a6470', roughness: 0.4, metalness: 0.4 }),
        gabinete: new THREE.MeshStandardMaterial({ color: '#e6e3dc', roughness: 0.5 }),
        trafo: new THREE.MeshStandardMaterial({ color: '#6a7078', roughness: 0.5, metalness: 0.5, envMapIntensity: 0.8 }),
        porcelana: new THREE.MeshStandardMaterial({ color: '#8a5a44', roughness: 0.35 }),
        panel: new THREE.MeshStandardMaterial({ color: '#1f3354', roughness: 0.25, metalness: 0.6, envMapIntensity: 1.1 }),
        muro: new THREE.MeshStandardMaterial({ color: '#e1ddd3', roughness: 0.8 }),
        techo: new THREE.MeshStandardMaterial({ color: '#c3c6cb', roughness: 0.55, metalness: 0.4 }),
        ventana: new THREE.MeshStandardMaterial({ color: '#7fa2bf', roughness: 0.15, metalness: 0.4, envMapIntensity: 1.2 }),
        diesel: new THREE.MeshStandardMaterial({ color: '#c9a227', roughness: 0.45, metalness: 0.3 }),
        cerca: new THREE.MeshStandardMaterial({ color: '#9ca0a6', roughness: 0.5, metalness: 0.6, transparent: true, opacity: 0.55 }),
        tierraMina: new THREE.MeshStandardMaterial({ color: '#b79b74', roughness: 1 }),
        pantalla: new THREE.MeshBasicMaterial({ color: '#1f3a4a', toneMapped: false }),
        nivelSaee: new THREE.MeshBasicMaterial({ color: '#2fb36a', toneMapped: false }),
        nivelVacio: new THREE.MeshBasicMaterial({ color: '#c9ccd1', toneMapped: false }),
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
    const niveles = { saee: [], ce: [], mina: [] };
    const losa = (geo, m, x, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, 0, z); o.receiveShadow = true; raiz.add(o); return o; };

    // ---------- el suelo
    losa(new THREE.BoxGeometry(X1 - X0, -Y0, Z1 - Z0).translate(0, Y0 / 2, 0), M.piso, 0, 0);

    /** Un contenedor de baterías: caja que se vuelve vidrio, racks con módulos adentro, su clima en un extremo y su barra de carga. */
    function contenedor(padre, x, z, { largo = CONT.largo, ancho = CONT.ancho, alto = CONT.alto, cubierta = 'contSaee', abre = ['contenedores', 'clima'], nivel = null, ventila = null, guinda = true } = {}) {
        const g = new THREE.Group();
        g.position.set(x, 0, z);
        padre.add(g);
        // racks y módulos por dentro
        const r = [];
        const m = [];
        const n = Math.max(2, Math.round(largo / 0.16));
        for (let i = 0; i < n; i++) {
            const xi = -largo / 2 + 0.08 + (i + 0.5) * ((largo - 0.22) / n);
            for (const lado of [-1, 1]) {
                r.push(new THREE.BoxGeometry(0.1, alto * 0.82, 0.02).translate(xi, alto * 0.41 + 0.02, lado * (ancho / 2 - 0.08)));
                for (let k = 0; k < 5; k++) m.push(new THREE.BoxGeometry(0.09, alto * 0.12, 0.08).translate(xi, 0.06 + k * alto * 0.16, lado * (ancho / 2 - 0.08)));
            }
        }
        g.add(malla(r, M.rack));
        g.add(malla(m, M.modulo));
        // la caja
        const mat = cub(cubierta, abre, { color: '#efede8', metal: 0.2 });
        const casco = sombra(new THREE.Mesh(new THREE.BoxGeometry(largo, alto, ancho).translate(0, alto / 2 + 0.02, 0), mat));
        g.add(casco);
        g.add(en(caja(largo + 0.02, 0.02, ancho + 0.02, M.concreto), 0, 0, 0));
        if (guinda) for (const lado of [-1, 1]) g.add(en(caja(largo + 0.004, 0.03, 0.006, M.guinda), 0, alto * 0.84, lado * (ancho / 2 + 0.003)));
        // la barra de carga, en el costado que da al frente
        if (nivel) {
            const w = largo * 0.7;
            g.add(en(new THREE.Mesh(new THREE.BoxGeometry(w, 0.035, 0.006).translate(w / 2, 0, 0), M.nivelVacio), -w / 2, alto * 0.62, ancho / 2 + 0.005));
            const lleno = new THREE.Mesh(new THREE.BoxGeometry(w, 0.035, 0.008).translate(w / 2, 0, 0), M.nivelSaee);
            lleno.position.set(-w / 2, alto * 0.62, ancho / 2 + 0.008);
            g.add(lleno);
            niveles[nivel].push(lleno);
        }
        // el clima: una unidad en el extremo con su ventilador
        if (ventila) {
            const u = new THREE.Group();
            u.position.set(largo / 2 + 0.05, 0.02, 0);
            u.add(en(caja(0.1, alto * 0.75, ancho * 0.8, M.gabinete), 0, 0, 0));
            const aspa = new THREE.Group();
            aspa.position.set(0.055, alto * 0.45, 0);
            for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.11, 0.025), M.grafito); b.rotation.x = (k * 2 * PI) / 3; aspa.add(b); }
            u.add(aspa);
            ventila.add(u);
            u.position.add(g.position);
            g.userData.clima = u;
            giran.push({ obj: aspa, eje: 'x', vel: e => 2 + 10 * ((e.activo.carga ?? 0) + (e.activo.descarga ?? 0)) });
        }
        return g;
    }

    // ---------- 1 · el patio del SAEE no asociado: diez contenedores, inversores, clima, control y transformador
    const contenedores = unidad('contenedores');
    const pcs = unidad('pcs');
    const clima = unidad('clima');
    {
        const [cx, cz] = SITIO.saee;
        losa(new THREE.BoxGeometry(5.9, 0.02, 2.7).translate(0, 0.01, 0), M.grava, cx, cz);
        const filasZ = [cz - 0.55, cz + 0.55];
        for (let f = 0; f < FILAS_SAEE; f++) for (let i = 0; i < POR_FILA; i++) {
            const x = cx + (i - (POR_FILA - 1) / 2) * 1.15;
            const c = contenedor(contenedores, x, filasZ[f], { nivel: 'saee', ventila: clima });
            mover(c, [0, 0, f === 0 ? -0.5 : 0.5], i * 0.05);
            mover(c.userData.clima, [0, 0, f === 0 ? -0.5 : 0.5], i * 0.05);
        }
        // los inversores bidireccionales entre las filas, uno por cada par de contenedores
        for (let i = 0; i < POR_FILA; i++) {
            const x = cx + (i - (POR_FILA - 1) / 2) * 1.15;
            const p = new THREE.Group();
            p.add(en(caja(0.34, 0.3, 0.26, M.gabinete), 0, 0, 0));
            p.add(en(caja(0.14, 0.06, 0.005, M.pantalla), 0, 0.2, 0.133));
            p.add(en(caja(0.3, 0.03, 0.22, M.trafo), 0, 0.3, 0));
            p.position.set(x, 0, cz);
            pcs.add(p);
        }
        // la cerca
        const cerca = [];
        const [w, d] = [5.9, 2.7];
        for (let k = 0; k <= 12; k++) for (const s of [-1, 1]) cerca.push(new THREE.BoxGeometry(0.02, 0.3, 0.02).translate(cx - w / 2 + (k * w) / 12, 0.15, cz + (s * d) / 2));
        cerca.push(new THREE.BoxGeometry(w, 0.22, 0.004).translate(cx, 0.15, cz - d / 2), new THREE.BoxGeometry(w, 0.22, 0.004).translate(cx, 0.15, cz + d / 2));
        raiz.add(new THREE.Mesh(mergeGeometries(cerca), M.cerca));
        brillo(contenedores, cx, 0.9, cz, 3.4, '#4fa3ff', 'carga', 0.8, false);
        brillo(contenedores, cx, 0.9, cz, 3.4, '#2fb36a', 'descarga', 0.8, false);
        plano(raiz, 'SAEE no asociado · 100 MW · 300 MWh', cx, cz + 1.6, 3.0);
    }
    const control = unidad('control');
    {
        const [x, z] = SITIO.control;
        control.add(en(caja(0.8, 0.42, 0.42, M.gabinete), x, 0, z));
        control.add(en(caja(0.3, 0.14, 0.005, M.pantalla), x - 0.15, 0.24, z + 0.212));
        control.add(en(caja(0.12, 0.3, 0.005, M.grafito), x + 0.24, 0.02, z + 0.212));
        const antena = en(cil(0.012, 0.45, M.acero), x + 0.3, 0.42, z - 0.1);
        control.add(antena);
        plano(raiz, 'Control', x, z + 0.4, 0.6);
    }
    const trafo = unidad('trafo');
    {
        const [x, z] = SITIO.trafo;
        trafo.add(en(caja(0.7, 0.04, 0.6, M.concreto), x, 0, z));
        trafo.add(en(caja(0.46, 0.5, 0.34, M.trafo), x, 0.04, z));
        const rad = [];
        for (let k = 0; k < 6; k++) rad.push(new THREE.BoxGeometry(0.02, 0.36, 0.12).translate(x - 0.18 + k * 0.07, 0.3, z + 0.24));
        trafo.add(malla(rad, M.trafo));
        for (let k = 0; k < 3; k++) trafo.add(en(cil(0.025, 0.22, M.porcelana), x - 0.13 + k * 0.13, 0.54, z - 0.05));
        plano(raiz, 'Transformador', x, z + 0.48, 0.9);
    }
    const medidor = unidad('medidor');
    {
        const [x, z] = SITIO.medidor;
        medidor.add(en(cil(0.02, 0.5, M.acero), x, 0, z));
        medidor.add(en(caja(0.22, 0.26, 0.12, M.gabinete), x, 0.42, z));
        medidor.add(en(caja(0.12, 0.08, 0.005, M.pantalla), x, 0.56, z + 0.061));
        plano(raiz, 'Medición', x, z + 0.32, 0.6);
    }

    // ---------- 2 · la subestación de la RNT y su SAEE
    const subestacion = unidad('subestacion');
    {
        const [x, z] = SITIO.subestacion;
        losa(new THREE.BoxGeometry(2.8, 0.02, 1.8).translate(0, 0.01, 0), M.grava, x, z);
        const marco = [];
        for (const dx of [-1.0, 1.0]) for (const dz of [-0.6, 0.6]) marco.push(new THREE.BoxGeometry(0.06, 1.7, 0.06).translate(x + dx, 0.85, z + dz));
        for (const dz of [-0.6, 0.6]) marco.push(new THREE.BoxGeometry(2.06, 0.06, 0.06).translate(x, 1.7, z + dz));
        marco.push(new THREE.BoxGeometry(0.04, 0.04, 1.2).translate(x - 1.0, 1.5, z), new THREE.BoxGeometry(0.04, 0.04, 1.2).translate(x + 1.0, 1.5, z));
        subestacion.add(malla(marco, M.acero));
        const barras = [];
        for (let k = 0; k < 3; k++) barras.push(new THREE.BoxGeometry(2.0, 0.02, 0.02).translate(x, 1.35 - k * 0.0, z - 0.3 + k * 0.3));
        subestacion.add(malla(barras, M.cobre ?? M.acero));
        for (let k = 0; k < 4; k++) {
            const xi = x - 0.75 + k * 0.5;
            subestacion.add(en(caja(0.18, 0.5, 0.18, M.gabinete), xi, 0, z));
            for (let a = 0; a < 3; a++) subestacion.add(en(cil(0.025, 0.4, M.porcelana), xi - 0.06 + a * 0.06, 0.5, z));
        }
        plano(raiz, 'Subestación · 230 kV', x, z + 1.05, 1.5);
        // dos torres que traen la línea de la Red Nacional de Transmisión
        for (const xt of [-6.9, -3.2]) raiz.add(en(sombra(new THREE.Mesh(geoTorre(ALTO_LINEA + 0.45, 0.32), M.acero)), xt, 0, -3.4));
    }
    const saeeRed = unidad('saeeRed');
    {
        const [x, z] = SITIO.saeeRed;
        contenedor(saeeRed, x, z, { largo: 0.7, cubierta: 'contRed', abre: ['saeeRed'], guinda: false });
        plano(raiz, 'SAEE de la red', x, z + 0.32, 0.9);
    }
    const cenace = unidad('cenace');
    {
        const [x, z] = SITIO.cenace;
        cenace.add(en(caja(1.4, 0.9, 0.9, M.muro), x, 0, z));
        cenace.add(en(caja(1.46, 0.05, 0.96, M.techo), x, 0.9, z));
        const v = [];
        for (let k = 0; k < 4; k++) for (const y of [0.25, 0.6]) v.push(new THREE.BoxGeometry(0.22, 0.18, 0.01).translate(x - 0.48 + k * 0.32, y, z + 0.455));
        cenace.add(malla(v, M.ventana));
        const plato = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 8, 0, PI * 2, 0, PI / 2.6), M.gabinete);
        plato.rotation.x = -0.7;
        cenace.add(en(plato, x + 0.4, 1.1, z - 0.1));
        cenace.add(en(cil(0.02, 0.2, M.acero), x + 0.4, 0.92, z - 0.1));
        plano(raiz, 'CENACE', x, z + 0.62, 0.8);
    }

    // ---------- 3 · la central solar y su SAEE
    const central = unidad('central');
    {
        const [cx, cz] = SITIO.central;
        const paneles = [];
        const patas = [];
        for (let f = 0; f < 5; f++) {
            const z = cz - 1.2 + f * 0.6;
            const g = new THREE.BoxGeometry(5.0, 0.02, 0.36);
            g.rotateX(-0.45);
            g.translate(cx, 0.28, z);
            paneles.push(g);
            for (let k = 0; k < 7; k++) patas.push(new THREE.BoxGeometry(0.03, 0.26, 0.03).translate(cx - 2.4 + k * 0.8, 0.13, z));
        }
        central.add(malla(paneles, M.panel));
        central.add(malla(patas, M.acero));
        const [ix, iz] = SITIO.inversorCE;
        central.add(en(caja(0.6, 0.5, 0.4, M.gabinete), ix, 0, iz));
        central.add(en(caja(0.24, 0.1, 0.005, M.pantalla), ix, 0.34, iz + 0.202));
        brillo(central, ix, 0.8, iz, 1.6, '#ff8a3c', 'tirada', 1.2, false);
        plano(raiz, 'Central solar · 240 MW · contrato de 200 MW', cx, cz + 1.75, 3.0);
    }
    const saeeCE = unidad('saeeCE');
    {
        const [x, z] = SITIO.saeeCE;
        for (const dx of [-0.55, 0.55]) for (const dz of [-0.25, 0.25]) contenedor(saeeCE, x + dx, z + dz, { cubierta: 'contCE', abre: ['saeeCE'], nivel: 'ce' });
        brillo(saeeCE, x, 0.8, z, 2.0, '#4fa3ff', 'carga', 0.7, false);
        brillo(saeeCE, x, 0.8, z, 2.0, '#2fb36a', 'descarga', 0.7, false);
        plano(raiz, 'SAEE de la central', x, z + 0.62, 1.4);
    }

    // ---------- 4 · la fábrica y su SAEE, que no puede inyectar a la red
    const fabrica = unidad('fabrica');
    {
        const [x, z] = SITIO.fabrica;
        fabrica.add(en(caja(1.9, 0.9, 1.1, M.muro), x - 0.3, 0, z));
        const dientes = [];
        for (let k = 0; k < 4; k++) {
            const g = new THREE.BoxGeometry(0.48, 0.03, 1.12);
            g.rotateZ(0.5);
            g.translate(x - 1.05 + k * 0.48 + 0.2, 1.0, z);
            dientes.push(g);
        }
        fabrica.add(malla(dientes, M.techo));
        const v = [];
        for (let k = 0; k < 5; k++) v.push(new THREE.BoxGeometry(0.2, 0.16, 0.01).translate(x - 1.0 + k * 0.36, 0.5, z + 0.555));
        fabrica.add(malla(v, M.ventana));
        contenedor(fabrica, x + 1.0, z + 0.2, { largo: 0.55, cubierta: 'contCC', abre: ['fabrica'], guinda: false });
        plano(raiz, 'Fábrica · su SAEE no inyecta', x, z + 0.75, 1.6);
    }

    // ---------- 5 · la mina sin red: paneles, batería, castillete y planta diésel
    const mina = unidad('mina');
    const diesel = unidad('diesel');
    {
        const [x, z] = SITIO.mina;
        losa(new THREE.BoxGeometry(1.6, 0.02, 1.6).translate(0, 0.01, 0), M.tierraMina, x, z);
        const pan = [];
        for (const dz of [-0.55, -0.2]) { const g = new THREE.BoxGeometry(0.8, 0.02, 0.24); g.rotateX(-0.45); g.translate(x - 0.35, 0.2, z + dz); pan.push(g); }
        mina.add(malla(pan, M.panel));
        for (const dz of [-0.4, 0.0]) contenedor(mina, x + 0.45, z + dz, { largo: 0.5, cubierta: 'contMina', abre: ['mina'], nivel: 'mina', guinda: false });
        // el castillete del tiro, con su polea que gira cuando hay energía
        const cast = [];
        for (const dx of [-0.15, 0.15]) cast.push(new THREE.BoxGeometry(0.03, 0.75, 0.03).translate(x - 0.4 + dx, 0.375, z + 0.45));
        cast.push(new THREE.BoxGeometry(0.33, 0.03, 0.03).translate(x - 0.4, 0.75, z + 0.45));
        mina.add(malla(cast, M.acero));
        const polea = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 6, 18), M.grafito);
        polea.position.set(x - 0.4, 0.78, z + 0.45);
        mina.add(polea);
        giran.push({ obj: polea, eje: 'z', vel: () => 1.5 });
        const [dx, dz] = SITIO.diesel;
        diesel.add(en(caja(0.6, 0.36, 0.34, M.diesel), dx, 0, dz));
        diesel.add(en(cil(0.03, 0.3, M.grafito), dx + 0.2, 0.36, dz - 0.08));
        diesel.add(en(caja(0.2, 0.12, 0.005, M.grafito), dx - 0.1, 0.18, dz + 0.171));
        brillo(diesel, dx + 0.2, 0.85, dz - 0.08, 0.9, '#8a8f98', 'diesel', 1.0, false);
        plano(raiz, 'Mina sin red', x, z + 0.95, 1.1);
    }

    // ---------- lo que corre por los cables
    const tubos = crearTubos({ raiz, lineas: LINEAS, fluidos: FLUIDOS, M, partes, parteDe: L => ({ cenace: 'cenace', mina: 'mina', saeeCE: 'saeeCE', fabrica: 'fabrica' }[L.id] ?? null), movil });

    const anclas = {};
    for (const p of PARTES) { const o = new THREE.Object3D(); o.position.set(...p.ancla); raiz.add(o); anclas[p.id] = o; }

    // ---------- posar
    function posar(e) {
        const act = p => (p === 'noche' ? e.noche : p === 'siempre' ? 1 : p ? (e.activo[p] ?? 0) : 1);
        const a = sale(e.desarme * 3);
        const ab = { ...(e.abierta || {}) };
        kit.posar(e, act, ab, { apagar: a });
        tubos.posar(e, a);
        const llenar = (lista, x) => lista.forEach(m => { m.scale.x = Math.max(0.02, Math.min(1, x)); });
        llenar(niveles.saee, e.activo.socSaee ?? 0);
        llenar(niveles.ce, e.activo.socCE ?? 0);
        llenar(niveles.mina, e.activo.socMina ?? 0);
        M.lampara.color.set('#9a9c9f').lerp(new THREE.Color('#ffe2ad'), e.noche);
    }
    return { raiz, posar, partes, anclas, giran, repintar: kit.repintar };
}
