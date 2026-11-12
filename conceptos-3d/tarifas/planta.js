// La calle de las tarifas, hecha con código. Sistema Búho: al frente a la derecha, la casa con su medidor, su clima y sus aparatos, sus
// vecinas y una tienda; en la banqueta, el alumbrado público; en la calle, los postes con el transformador; atrás, la subestación, la línea
// de transmisión, la central y el CENACE; al frente a la izquierda, la oficina de la CFE que cobra el recibo, el Gobierno federal que pone
// la aportación y una fábrica en media tensión. Nada está a escala.
//
//   materiales(P)     escenario(renderer, scene, M, { movil, oscuro })
//   construir(M, P, { movil, oscuro }) → { raiz, posar(e), partes, anclas, giran, repintar }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { sale } from '../planta-comun/ayudas.js';
import { caja, cil, crearAyudante, crearTubos, en, estudio, geoTorre, materialesBase, sombra, texturaGrano } from '../planta-comun/piezas.js';
import { crearLineasAereas } from '../planta-comun/conductores.js';
import { ABRE_CRUCETA, ALTO_POSTE, ALTO_TORRE, ALTO_VECINAS, BLOQUE, BORNES, CALLE, CASA, CRUCETAS, FLUIDOS, LAMPARAS, LINEAS, PARTES, POSTE_TRAFO, POSTES, SITIO, TORRES, Z_LAMPARA, Z_POSTE, Z_TORRES } from './lugar.js';

const PI = Math.PI;
export const P_PLANTA = {
    papel: '#fafafa', noche: '#0a0e12', tinta: '#171317', marfil: '#f3f1ec', grafito: '#303137', acero: '#a7abb3', guinda: '#9b2247', rosa: '#e57a9a',
    tierraDia: '#d6d7c8', tierraNoche: '#23272c', losaDia: '#dcdcda', losaNoche: '#2c3036', suelo: '#b9a688',
};

export function materiales(P) {
    const M = materialesBase(P, FLUIDOS);
    Object.assign(M, {
        piso: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#d4cfc4', 'rgba(0,0,0,0.07)', [10, 5]), roughness: 0.95, envMapIntensity: 0.25 }),
        asfalto: new THREE.MeshStandardMaterial({ color: '#5b5e63', map: texturaGrano('#6a6d72', 'rgba(0,0,0,0.18)', [12, 1]), roughness: 0.95 }),
        banqueta: new THREE.MeshStandardMaterial({ color: '#d9d5cc', roughness: 0.9 }),
        raya: new THREE.MeshBasicMaterial({ color: '#f2efe6' }),
        grava: new THREE.MeshStandardMaterial({ color: '#b8b4ab', map: texturaGrano('#bdb8ae', 'rgba(0,0,0,0.12)', [6, 3]), roughness: 1 }),
        muroCasa: new THREE.MeshStandardMaterial({ color: '#efe3cf', roughness: 0.85 }),
        muroAzul: new THREE.MeshStandardMaterial({ color: '#cfdde6', roughness: 0.85 }),
        muroRosa: new THREE.MeshStandardMaterial({ color: '#efd6cf', roughness: 0.85 }),
        muro: new THREE.MeshStandardMaterial({ color: '#e1ddd3', roughness: 0.8 }),
        techo: new THREE.MeshStandardMaterial({ color: '#c3c6cb', roughness: 0.55, metalness: 0.4 }),
        azotea: new THREE.MeshStandardMaterial({ color: '#cbb9a6', roughness: 0.9 }),
        vidrioV: new THREE.MeshStandardMaterial({ color: '#7fa2bf', roughness: 0.15, metalness: 0.4, envMapIntensity: 1.2 }),
        luzCasa: new THREE.MeshBasicMaterial({ color: '#9fb3c4', toneMapped: false }),
        puerta: new THREE.MeshStandardMaterial({ color: '#7a6248', roughness: 0.7 }),
        tinaco: new THREE.MeshStandardMaterial({ color: '#2a2b2e', roughness: 0.6 }),
        blanco: new THREE.MeshStandardMaterial({ color: '#f4f3ef', roughness: 0.4, metalness: 0.1 }),
        gabinete: new THREE.MeshStandardMaterial({ color: '#e6e3dc', roughness: 0.5 }),
        trafo: new THREE.MeshStandardMaterial({ color: '#8b9097', roughness: 0.45, metalness: 0.55, envMapIntensity: 0.8 }),
        porcelana: new THREE.MeshStandardMaterial({ color: '#8a5a44', roughness: 0.35 }),
        poste: new THREE.MeshStandardMaterial({ color: '#b9b6ae', roughness: 0.85 }),
        sofa: new THREE.MeshStandardMaterial({ color: '#6e7f8f', roughness: 0.8 }),
        pantalla: new THREE.MeshBasicMaterial({ color: '#1f3a4a', toneMapped: false }),
        papelRecibo: new THREE.MeshBasicMaterial({ color: '#fbfaf7', toneMapped: false, side: THREE.DoubleSide }),
        renglon: new THREE.MeshBasicMaterial({ color: '#b6b2aa', toneMapped: false }),
        totalRecibo: new THREE.MeshBasicMaterial({ color: '#2fb36a', toneMapped: false }),
        toldo: new THREE.MeshStandardMaterial({ color: '#9b2247', roughness: 0.6 }),
        columna: new THREE.MeshStandardMaterial({ color: '#ebe7de', roughness: 0.6 }),
        chimenea: new THREE.MeshStandardMaterial({ color: '#c9c7c2', roughness: 0.6, metalness: 0.2 }),
        tronco: new THREE.MeshStandardMaterial({ color: '#7a6248', roughness: 0.9 }),
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
    const recibo = { hoja: null, total: null };

    // ---------- el suelo, la calle y la banqueta
    losa(new THREE.BoxGeometry(X1 - X0, -Y0, Z1 - Z0).translate(0, Y0 / 2, 0), M.piso, 0, (Z0 + Z1) / 2);
    {
        const largo = X1 - CALLE.x0;
        const xm = (X1 + CALLE.x0) / 2;
        losa(new THREE.BoxGeometry(largo, 0.012, CALLE.z1 - CALLE.z0).translate(0, 0.006, 0), M.asfalto, xm, (CALLE.z0 + CALLE.z1) / 2);
        losa(new THREE.BoxGeometry(largo, 0.03, 0.38).translate(0, 0.015, 0), M.banqueta, xm, CALLE.z1 + 0.19);
        losa(new THREE.BoxGeometry(largo, 0.03, 0.3).translate(0, 0.015, 0), M.banqueta, xm, CALLE.z0 - 0.15);
        const rayas = [];
        for (let x = CALLE.x0 + 0.3; x < X1 - 0.2; x += 0.6) rayas.push(new THREE.BoxGeometry(0.3, 0.004, 0.035).translate(x, 0.014, (CALLE.z0 + CALLE.z1) / 2));
        raiz.add(new THREE.Mesh(mergeGeometries(rayas), M.raya));
    }

    /** Una casa de azotea plana con tinaco, ventanas que se encienden de noche y su medidor al frente. */
    function casita(padre, x, z, { ancho = 1.2, fondo = 0.9, alto = 0.66, muro = M.muroCasa, cubierta = null, abre = [] } = {}) {
        const g = new THREE.Group();
        g.position.set(x, 0, z);
        padre.add(g);
        const mat = cubierta ? cub(cubierta, abre, { color: '#efe3cf', metal: 0.02 }) : muro;
        g.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, fondo).translate(0, alto / 2, 0), mat)));
        // el pretil de la azotea y el tinaco
        const pretil = [];
        for (const s of [-1, 1]) {
            pretil.push(new THREE.BoxGeometry(ancho + 0.04, 0.07, 0.04).translate(0, alto + 0.035, (s * (fondo + 0.0)) / 2));
            pretil.push(new THREE.BoxGeometry(0.04, 0.07, fondo).translate((s * ancho) / 2, alto + 0.035, 0));
        }
        g.add(malla(pretil, cubierta ? mat : muro));
        g.add(en(cil(0.09, 0.18, M.tinaco), ancho * 0.28, alto, -fondo * 0.18));
        // la puerta y las ventanas del frente (el frente mira a la calle: z positivo)
        g.add(en(caja(0.18, 0.36, 0.012, M.puerta), -ancho * 0.12, 0, fondo / 2 + 0.006));
        const v = [];
        for (const dx of [-ancho * 0.36, ancho * 0.2]) v.push(new THREE.BoxGeometry(0.22, 0.17, 0.008).translate(dx, alto * 0.5, fondo / 2 + 0.005));
        const vid = new THREE.Mesh(mergeGeometries(v), M.luzCasa);
        g.add(vid);
        g.userData.ventanas = vid;
        return g;
    }

    // ---------- 1 · la casa: medidor, clima y aparatos
    const casa = unidad('casa');
    const medidor = unidad('medidor');
    const clima = unidad('clima');
    const aparatos = unidad('aparatos');
    const ventanasCasa = [];
    {
        const [x, z] = SITIO.casa;
        const { ancho, fondo, alto } = CASA;
        losa(new THREE.BoxGeometry(ancho + 0.3, 0.02, fondo + 0.3).translate(0, 0.01, 0), M.banqueta, x, z);
        const c = casita(casa, x, z, { ancho, fondo, alto, cubierta: 'casa', abre: ['casa', 'aparatos', 'clima'] });
        ventanasCasa.push(c.userData.ventanas);
        // por dentro: piso, un muro, sala y cocina
        aparatos.add(en(caja(ancho - 0.06, 0.012, fondo - 0.06, M.azotea), x, 0.005, z));
        aparatos.add(en(caja(0.02, alto * 0.9, fondo - 0.1, M.muroCasa), x + 0.12, 0.01, z));
        // el refrigerador
        aparatos.add(en(caja(0.2, 0.46, 0.18, M.blanco), x - 0.55, 0.01, z - 0.32));
        aparatos.add(en(caja(0.006, 0.12, 0.012, M.acero), x - 0.47, 0.32, z - 0.22));
        // la tele, el sillón, la lavadora y los focos
        aparatos.add(en(caja(0.3, 0.17, 0.015, M.pantalla), x - 0.2, 0.26, z - 0.44));
        aparatos.add(en(caja(0.34, 0.12, 0.14, M.sofa), x - 0.2, 0.01, z + 0.12));
        aparatos.add(en(caja(0.16, 0.2, 0.16, M.blanco), x + 0.5, 0.01, z - 0.34));
        for (const [fx, fz] of [[-0.35, 0.1], [0.45, 0.0]]) {
            aparatos.add(en(new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), M.lampara), x + fx, alto - 0.08, z + fz));
            brillo(aparatos, x + fx, alto - 0.12, z + fz, 0.45, '#ffd28a', 'focos', 0.9, false);
        }
        // el clima: el evaporador adentro, arriba, y la condensadora en el muro de un lado con su ventilador
        clima.add(en(caja(0.3, 0.08, 0.05, M.blanco), x + 0.45, alto - 0.2, z - 0.44));
        const cond = new THREE.Group();
        cond.position.set(x + ancho / 2 + 0.08, 0.06, z + 0.15);
        cond.add(en(caja(0.12, 0.26, 0.32, M.gabinete), 0, 0, 0));
        const aspa = new THREE.Group();
        aspa.position.set(0.065, 0.13, 0);
        for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.18, 0.04), M.grafito); b.rotation.x = (k * 2 * PI) / 3; aspa.add(b); }
        cond.add(aspa);
        cond.add(en(caja(0.04, 0.14, 0.14, M.soporte ?? M.acero), -0.07, 0.02, 0));
        clima.add(cond);
        giran.push({ obj: aspa, eje: 'x', vel: e => 1 + 14 * (e.activo.clima ?? 0) });
        brillo(clima, x + ancho / 2 + 0.25, 0.4, z + 0.15, 0.8, '#4fa3ff', 'clima', 0.55, false);
        mover(cond, [0.5, 0, 0]);
        // el medidor en el frente, con su mufa y el tubo que sube a la azotea
        const mx = x - 0.5;
        const mz = z + fondo / 2 + 0.02;
        medidor.add(en(cil(0.012, alto - 0.25, M.acero), mx, 0.42, mz));
        medidor.add(en(cil(0.02, 0.04, M.grafito), mx, alto + 0.16, mz));
        medidor.add(en(caja(0.14, 0.2, 0.06, M.gabinete), mx, 0.34, mz + 0.01));
        const vista = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 18).rotateX(PI / 2), M.vidrio);
        vista.position.set(mx, 0.45, mz + 0.05);
        medidor.add(vista);
        medidor.add(en(caja(0.07, 0.03, 0.004, M.pantalla), mx, 0.43, mz + 0.062));
        brillo(medidor, mx, 0.45, mz + 0.09, 0.35, '#2fb36a', 'medidor', 0.8, false);
        mover(medidor.children[2], [0, 0, 0.3]);
        plano(raiz, 'Casa · tarifa doméstica', x, z + fondo / 2 + 0.28, 1.4);
    }
    // ---------- las vecinas y la tienda
    {
        const colores = [M.muroAzul, M.muroRosa];
        SITIO.vecinas.forEach(([x, z], i) => {
            losa(new THREE.BoxGeometry(1.4, 0.02, 1.2).translate(0, 0.01, 0), M.banqueta, x, z);
            const c = casita(raiz, x, z, { ancho: 1.15, fondo: 0.92, alto: ALTO_VECINAS[i], muro: colores[i] });
            ventanasCasa.push(c.userData.ventanas);
            raiz.add(en(caja(0.08, 0.1, 0.04, M.gabinete), x - 0.4, 0.3, z + 0.48));
            // el tubo que sube del medidor a la mufa, donde entra la acometida
            const [mx, my, mz] = BORNES[`mufaVecina${i + 1}`];
            raiz.add(en(cil(0.01, my - 0.03 - 0.4, M.acero), mx, 0.4, mz));
            raiz.add(en(cil(0.016, 0.03, M.grafito), mx, my - 0.03, mz));
        });
    }
    const comercio = unidad('comercio');
    {
        const [x, z] = SITIO.comercio;
        losa(new THREE.BoxGeometry(1.2, 0.02, 1.2).translate(0, 0.01, 0), M.banqueta, x, z);
        const c = casita(comercio, x, z, { ancho: 0.95, fondo: 0.95, alto: 0.62, cubierta: 'comercio', abre: ['comercio'] });
        ventanasCasa.push(c.userData.ventanas);
        // el toldo a rayas y el refrigerador de refrescos que no se apaga
        const toldo = [[], []];
        for (let k = 0; k < 5; k++) { const g = new THREE.BoxGeometry(0.19, 0.012, 0.24); g.rotateX(-0.35); g.translate(-0.38 + k * 0.19, 0.5, 0.58); toldo[k % 2].push(g); }
        comercio.add(en(malla(toldo[0], M.toldo), x, 0, z));
        comercio.add(en(malla(toldo[1], M.blanco), x, 0, z));
        comercio.add(en(caja(0.3, 0.44, 0.16, M.blanco), x + 0.18, 0.01, z - 0.3));
        comercio.add(en(caja(0.24, 0.34, 0.005, M.vidrioV), x + 0.18, 0.06, z - 0.217));
        comercio.add(en(caja(0.1, 0.12, 0.04, M.gabinete), x - 0.3, 0.3, z + 0.49));
        comercio.add(en(cil(0.01, 0.48, M.acero), x - 0.3, 0.36, z + 0.5));
        // la mufa, donde entra la acometida
        comercio.add(en(cil(0.016, 0.03, M.grafito), x - 0.3, BORNES.mufaComercio[1] - 0.03, z + 0.5));
        plano(raiz, 'Tienda · PDBT', x, z + 0.75, 0.9);
    }

    // ---------- 2 · la red de distribución: postes, transformador y alumbrado
    const poste = unidad('poste');
    const alumbrado = unidad('alumbrado');
    {
        // los postes de media tensión: cruceta con tres aisladores (el de en medio, sobre la punta); los de esquina la llevan girada
        const piezas = { calle: [[], [], []], fabrica: [[], [], []] };
        const alto = ALTO_POSTE - 0.025;
        CRUCETAS.forEach(({ x, z, giro }, i) => {
            const [ps, crucetas, aisl] = piezas[i < POSTES.length ? 'calle' : 'fabrica'];
            ps.push(new THREE.CylinderGeometry(0.022, 0.034, alto, 8).translate(x, alto / 2, z));
            crucetas.push(new THREE.BoxGeometry(0.03, 0.03, 0.42).rotateY(giro).translate(x, ALTO_POSTE - 0.04, z));
            for (const k of [-1, 0, 1]) aisl.push(new THREE.CylinderGeometry(0.012, 0.012, 0.05, 6).translate(x + k * ABRE_CRUCETA * Math.sin(giro), ALTO_POSTE, z + k * ABRE_CRUCETA * Math.cos(giro)));
        });
        // el soporte de baja tensión de los postes que siguen al del transformador
        for (const id of ['bt1', 'bt3', 'bt4']) {
            const [x, y, z] = BORNES[id];
            piezas.calle[1].push(new THREE.BoxGeometry(0.018, 0.018, 0.07).translate(x, y - 0.03, Z_POSTE + 0.035));
            piezas.calle[2].push(new THREE.CylinderGeometry(0.014, 0.014, 0.03, 8).translate(x, y - 0.015, z));
        }
        for (const [k, [ps, crucetas, aisl]] of Object.entries(piezas)) {
            const padre = k === 'calle' ? raiz : unidad('fabrica');
            padre.add(malla(ps, M.poste));
            padre.add(malla(crucetas, M.grafito));
            padre.add(malla(aisl, M.porcelana));
        }
        // el transformador de poste: un tanque gris colgado, con su salida a la casa
        poste.add(en(cil(0.085, 0.24, M.trafo), POSTE_TRAFO + 0.1, 0.78, Z_POSTE));
        poste.add(en(caja(0.04, 0.03, 0.18, M.grafito), POSTE_TRAFO + 0.05, 0.98, Z_POSTE));
        for (const dz of [-0.04, 0.04]) poste.add(en(cil(0.012, 0.06, M.porcelana), POSTE_TRAFO + 0.1, 1.02, Z_POSTE + dz));
        // la boquilla de media tensión, donde llega el puente de la línea
        const [ax, ay, az] = BORNES.trafoPosteAlta;
        poste.add(en(cil(0.014, ay - 1.02, M.porcelana), ax, 1.02, az));
        brillo(poste, POSTE_TRAFO + 0.1, 0.9, Z_POSTE, 0.7, '#f2b233', 'poste', 0.6, false);
        mover(poste.children[0], [0, 0, -0.4]);
        // el alumbrado público: lámparas en la banqueta que prenden de noche
        for (const x of LAMPARAS) {
            const g = new THREE.Group();
            g.position.set(x, 0, Z_LAMPARA);
            g.add(en(cil(0.014, 1.0, M.grafito), 0, 0, 0));
            g.add(en(caja(0.02, 0.02, 0.28, M.grafito), 0, 0.99, -0.13));
            g.add(en(caja(0.08, 0.025, 0.12, M.gabinete), 0, 0.965, -0.27));
            g.add(en(caja(0.06, 0.006, 0.09, M.lampara), 0, 0.96, -0.27));
            alumbrado.add(g);
            brillo(alumbrado, x, 0.88, Z_LAMPARA - 0.27, 1.1, '#ffd28a', 'alumbrado', 0.9, false);
        }
        plano(raiz, 'Red de distribución', (POSTES[0] + POSTES[1]) / 2, Z_POSTE - 0.32, 1.3);
    }
    // unos árboles en la banqueta
    {
        const troncos = [];
        const copas = [];
        for (const [x, z] of [[2.6, 2.65], [6.2, 2.65], [0.9, -0.4], [-1.9, 1.6], [-5.2, 2.9]]) {
            troncos.push(new THREE.CylinderGeometry(0.02, 0.03, 0.3, 6).translate(x, 0.15, z));
            copas.push(new THREE.IcosahedronGeometry(0.2, 1).translate(x, 0.42, z));
        }
        raiz.add(malla(troncos, M.tronco));
        raiz.add(malla(copas, M.hoja));
    }

    // ---------- 3 · la subestación, la línea de transmisión, la central y el CENACE
    const subestacion = unidad('subestacion');
    {
        const [x, z] = SITIO.subestacion;
        losa(new THREE.BoxGeometry(2.0, 0.02, 1.3).translate(0, 0.01, 0), M.grava, x, z);
        const marco = [];
        for (const dx of [-0.75, 0.75]) for (const dz of [-0.45, 0.45]) marco.push(new THREE.BoxGeometry(0.05, 1.4, 0.05).translate(x + dx, 0.7, z + dz));
        for (const dz of [-0.45, 0.45]) marco.push(new THREE.BoxGeometry(1.55, 0.05, 0.05).translate(x, 1.4, z + dz));
        subestacion.add(malla(marco, M.acero));
        const barras = [];
        for (let k = 0; k < 3; k++) barras.push(new THREE.BoxGeometry(1.5, 0.018, 0.018).translate(x, 1.2, z - 0.25 + k * 0.25));
        subestacion.add(malla(barras, M.cobre));
        // dos transformadores de potencia: atrás las boquillas de alta, que bajan de las barras; al frente las de baja, de donde sale la media tensión
        for (const [dx, lado] of [[-0.35, 'Oeste'], [0.35, 'Este']]) {
            subestacion.add(en(caja(0.34, 0.38, 0.3, M.trafo), x + dx, 0.02, z + 0.05));
            const rad = [];
            for (let k = 0; k < 5; k++) rad.push(new THREE.BoxGeometry(0.018, 0.28, 0.1).translate(x + dx - 0.12 + k * 0.06, 0.22, z + 0.25));
            subestacion.add(malla(rad, M.trafo));
            const [, ay, az] = BORNES[`alta${lado}`];
            const [, by, bz] = BORNES[`trafo${lado}`];
            for (let k = -1; k <= 1; k++) {
                subestacion.add(en(cil(0.022, ay - 0.4, M.porcelana), x + dx + k * 0.1, 0.4, az));
                subestacion.add(en(cil(0.018, by - 0.4, M.porcelana), x + dx + k * 0.1, 0.4, bz));
            }
        }
        plano(raiz, 'Subestación · 115 a 13.8 kV', x, z + 0.85, 1.6);
    }
    const transmision = unidad('transmision');
    for (const xt of TORRES) transmision.add(en(sombra(new THREE.Mesh(geoTorre(ALTO_TORRE, 0.3), M.torre)), xt, 0, Z_TORRES));
    plano(raiz, 'Red Nacional de Transmisión', (TORRES[0] + TORRES[1]) / 2, Z_TORRES + 0.45, 1.8);

    const central = unidad('central');
    {
        const [x, z] = SITIO.central;
        losa(new THREE.BoxGeometry(2.6, 0.02, 1.6).translate(0, 0.01, 0), M.grava, x, z);
        central.add(en(caja(1.4, 0.7, 0.8, M.muro), x - 0.2, 0, z + 0.1));
        central.add(en(caja(1.46, 0.05, 0.86, M.techo), x - 0.2, 0.7, z + 0.1));
        central.add(en(caja(1.4, 0.04, 0.006, M.guinda), x - 0.2, 0.55, z + 0.504));
        for (const dx of [0.75, 1.05]) {
            central.add(en(cil(0.11, 1.6, M.chimenea), x + dx, 0, z - 0.2));
            central.add(en(caja(0.3, 0.5, 0.4, M.gabinete), x + dx - 0.05, 0, z + 0.25));
            brillo(central, x + dx, 1.75, z - 0.2, 0.55, '#c9ccd1', 'central', 0.5, false);
        }
        central.add(en(caja(0.4, 0.34, 0.3, M.trafo), x + 0.55, 0, z - 0.6));
        // las tres boquillas del transformador, de donde sale la línea de transmisión
        const [bx, by, bz] = BORNES.centralTrafo;
        for (const dz of [-0.1, 0, 0.1]) central.add(en(cil(0.02, by - 0.34, M.porcelana), bx, 0.34, bz + dz));
        plano(raiz, 'Central eléctrica', x, z + 0.95, 1.2);
    }
    const cenace = unidad('cenace');
    {
        const [x, z] = SITIO.cenace;
        cenace.add(en(caja(1.2, 0.8, 0.8, M.muro), x, 0, z));
        cenace.add(en(caja(1.26, 0.05, 0.86, M.techo), x, 0.8, z));
        const v = [];
        for (let k = 0; k < 3; k++) for (const y of [0.22, 0.52]) v.push(new THREE.BoxGeometry(0.24, 0.17, 0.01).translate(x - 0.36 + k * 0.36, y, z + 0.405));
        cenace.add(malla(v, M.vidrioV));
        const plato = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 8, 0, PI * 2, 0, PI / 2.6), M.gabinete);
        plato.rotation.x = -0.7;
        cenace.add(en(plato, x + 0.35, 1.0, z - 0.1));
        cenace.add(en(cil(0.02, 0.18, M.acero), x + 0.35, 0.82, z - 0.1));
        // la caja de donde sale el cable de control
        const [kx, ky, kz] = BORNES.cenace;
        cenace.add(en(caja(0.04, 0.16, 0.14, M.gabinete), kx - 0.02, ky - 0.08, kz));
        plano(raiz, 'CENACE', x, z + 0.58, 0.8);
    }

    // ---------- 4 · la oficina de la CFE que cobra, con el recibo que flota encima
    const suministro = unidad('suministro');
    {
        const [x, z] = SITIO.suministro;
        losa(new THREE.BoxGeometry(2.0, 0.02, 1.2).translate(0, 0.01, 0), M.banqueta, x, z);
        suministro.add(en(caja(1.7, 0.66, 0.9, M.muro), x, 0, z));
        suministro.add(en(caja(1.76, 0.05, 0.96, M.techo), x, 0.66, z));
        suministro.add(en(caja(1.72, 0.08, 0.006, M.guinda), x, 0.5, z - 0.454));
        suministro.add(en(caja(1.2, 0.3, 0.008, M.vidrioV), x - 0.1, 0.1, z - 0.452));
        suministro.add(en(caja(0.22, 0.4, 0.01, M.vidrioV), x + 0.6, 0, z - 0.452));
        // el recibo: una hoja con su franja, sus renglones y su total
        const hoja = new THREE.Group();
        hoja.position.set(x, 1.25, z);
        hoja.rotation.set(-0.12, 0.25, 0);
        hoja.add(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.66), M.papelRecibo));
        hoja.add(en(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.08), M.guinda), 0, 0.29, 0.002));
        const r = [];
        for (let k = 0; k < 6; k++) r.push(new THREE.PlaneGeometry(k % 3 === 2 ? 0.22 : 0.36, 0.022).translate(k % 3 === 2 ? -0.07 : 0, 0.17 - k * 0.055, 0.003));
        hoja.add(new THREE.Mesh(mergeGeometries(r), M.renglon));
        const total = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.06), M.totalRecibo);
        total.position.set(0, -0.22, 0.003);
        hoja.add(total);
        hoja.children.forEach(m => { m.castShadow = false; });
        suministro.add(hoja);
        recibo.hoja = hoja;
        recibo.total = total;
        brillo(suministro, x, 1.25, z, 0.7, '#2fb36a', 'pago', 0.35, false);
        plano(raiz, 'CFE · Suministro Básico', x, z + 0.75, 1.5);
    }
    // ---------- 5 · el Gobierno federal, que pone la aportación
    const gobierno = unidad('gobierno');
    {
        const [x, z] = SITIO.gobierno;
        losa(new THREE.BoxGeometry(2.0, 0.02, 1.2).translate(0, 0.01, 0), M.banqueta, x, z);
        gobierno.add(en(caja(1.7, 0.08, 0.95, M.columna), x, 0, z));
        gobierno.add(en(caja(1.5, 0.62, 0.62, M.muro), x, 0.08, z + 0.12));
        const cols = [];
        for (let k = 0; k < 6; k++) cols.push(new THREE.CylinderGeometry(0.035, 0.035, 0.6, 10).translate(x - 0.65 + k * 0.26, 0.38, z - 0.36));
        gobierno.add(malla(cols, M.columna));
        gobierno.add(en(caja(1.66, 0.07, 0.86, M.columna), x, 0.68, z + 0.03));
        const fr = new THREE.Shape([new THREE.Vector2(-0.83, 0), new THREE.Vector2(0.83, 0), new THREE.Vector2(0, 0.22)]);
        const fron = new THREE.Mesh(new THREE.ExtrudeGeometry(fr, { depth: 0.82, bevelEnabled: false }), M.columna);
        fron.position.set(x, 0.75, z - 0.38);
        gobierno.add(sombra(fron));
        brillo(gobierno, x, 0.95, z - 0.2, 0.75, '#e57a9a', 'aporte', 0.4, false);
        plano(raiz, 'Gobierno federal', x, z + 0.75, 1.2);
    }
    // ---------- 6 · la fábrica en media tensión, con su propia subestación
    const fabrica = unidad('fabrica');
    {
        const [x, z] = SITIO.fabrica;
        fabrica.add(en(caja(1.9, 0.85, 1.1, M.muro), x - 0.25, 0, z));
        const dientes = [];
        for (let k = 0; k < 4; k++) {
            const g = new THREE.BoxGeometry(0.48, 0.03, 1.12);
            g.rotateZ(0.5);
            g.translate(x - 1.0 + k * 0.48 + 0.2, 0.95, z);
            dientes.push(g);
        }
        fabrica.add(malla(dientes, M.techo));
        const v = [];
        for (let k = 0; k < 5; k++) v.push(new THREE.BoxGeometry(0.2, 0.15, 0.01).translate(x - 0.95 + k * 0.36, 0.48, z + 0.555));
        fabrica.add(malla(v, M.vidrioV));
        fabrica.add(en(caja(0.36, 0.36, 0.3, M.trafo), x + 0.95, 0, z - 0.25));
        for (let k = 0; k < 3; k++) fabrica.add(en(cil(0.018, 0.14, M.porcelana), x + 0.85 + k * 0.1, 0.36, z - 0.25));
        plano(raiz, 'Fábrica · GDMTH', x, z + 0.8, 1.2);
    }

    // ---------- los conductores: tres fases de aluminio en media y alta tensión, un solo cable en baja (planta-comun/conductores.js)
    const PARTE_LINEA = { rnt: 'transmision', barrasOeste: 'subestacion', barrasEste: 'subestacion', mt: 'poste', puente: 'poste', bt: 'poste', secundaria: 'poste', secundariaOeste: 'poste', vecina1: 'poste', vecina2: 'poste', comercio: 'comercio', fabrica: 'fabrica' };
    crearLineasAereas({ raiz, lineas: LINEAS, partes, parteDe: L => PARTE_LINEA[L.id], movil });

    // ---------- lo que corre por los cables y lo que va y viene en pesos
    const tubos = crearTubos({ raiz, lineas: LINEAS, fluidos: FLUIDOS, M, partes, parteDe: L => ({ rnt: 'transmision', mt: 'poste', bt: 'poste', senal: 'cenace', fabrica: 'fabrica', comercio: 'comercio', pago: 'suministro', aporte: 'gobierno', dap: 'alumbrado' }[L.id] ?? null), movil });

    const anclas = {};
    for (const p of PARTES) { const o = new THREE.Object3D(); o.position.set(...p.ancla); raiz.add(o); anclas[p.id] = o; }

    // ---------- posar
    const luzDia = new THREE.Color('#9fb3c4');
    const luzNoche = new THREE.Color('#ffc77a');
    function posar(e) {
        const act = p => (p === 'noche' ? e.noche : p === 'siempre' ? 1 : p ? (e.activo[p] ?? 0) : 1);
        const a = sale(e.desarme * 3);
        const ab = { ...(e.abierta || {}) };
        kit.posar(e, act, ab, { apagar: a });
        tubos.posar(e, a);
        M.luzCasa.color.copy(luzDia).lerp(luzNoche, e.noche);
        M.lampara.color.set('#9a9c9f').lerp(new THREE.Color('#ffe2ad'), Math.max(e.noche, e.activo.focos ?? 0));
        if (recibo.hoja) {
            recibo.hoja.position.y = 1.25 + 0.04 * Math.sin(e.t * 1.3);
            recibo.total.scale.x = Math.max(0.05, Math.min(1, e.activo.total ?? 0.5));
            recibo.total.position.x = -0.18 * (1 - recibo.total.scale.x);
        }
    }
    return { raiz, posar, partes, anclas, giran, repintar: kit.repintar };
}
