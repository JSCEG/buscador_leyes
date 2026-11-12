// La planta fotovoltaica de 42 kWp del IER-UNAM en Temixco, hecha con código. Sistema Búho: en la techumbre del auditorio, los cuatro
// subarreglos de 42 módulos (tres cadenas de 14 cada uno), con sus cajas de protección; en el patio, los dos inversores (agrandados), el
// transformador de 45 kVA, el tablero del punto de interconexión y el poste de la red del IER. El inversor 1 se abre: adentro, los
// seguidores de máxima potencia, el bus de corriente directa, el puente de transistores, el filtro, los relevadores y el control; atrás,
// su disipador sin ventiladores. Nada está a escala.
//
//   materiales(P)     escenario(renderer, scene, M, { movil, oscuro })
//   construir(M, P, { movil, oscuro }) → { raiz, posar(e), partes, anclas, giran, repintar }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { sale } from '../planta-comun/ayudas.js';
import { caja, cil, crearAyudante, crearTubos, en, estudio, geoTorre, materialesBase, sombra, texturaGrano } from '../planta-comun/piezas.js';
import { crearLineasAereas } from '../planta-comun/conductores.js';
import { ARREGLO, BLOQUE, CAJAS, EDIFICIO, FLUIDOS, INV, LINEAS, MODULO, PARTES, PLANTA, POSTE, SITIO, SUBARREGLO } from './modelo.js';

const PI = Math.PI;
export const P_PLANTA = {
    papel: '#fafafa', noche: '#0a0e12', tinta: '#171317', marfil: '#f3f1ec', grafito: '#303137', acero: '#a7abb3', guinda: '#9b2247', rosa: '#e57a9a',
    tierraDia: '#d6d7c8', tierraNoche: '#23272c', losaDia: '#dcdcda', losaNoche: '#2c3036', suelo: '#b9a688',
};

export function materiales(P) {
    const M = materialesBase(P, FLUIDOS);
    Object.assign(M, {
        piso: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#cfccc6', 'rgba(0,0,0,0.08)', [8, 3]), roughness: 0.9, envMapIntensity: 0.25 }),
        muro: new THREE.MeshStandardMaterial({ color: '#e6ddcf', roughness: 0.85, envMapIntensity: 0.3 }),
        celdas: new THREE.MeshStandardMaterial({ color: '#1f3256', roughness: 0.25, metalness: 0.35, envMapIntensity: 1.1, emissive: '#000000' }),
        marco: new THREE.MeshStandardMaterial({ color: '#c9ced6', roughness: 0.35, metalness: 0.8, envMapIntensity: 0.9 }),
        rack: new THREE.MeshStandardMaterial({ color: '#9aa0a8', roughness: 0.45, metalness: 0.7, envMapIntensity: 0.85 }),
        aletas: new THREE.MeshStandardMaterial({ color: '#8a9098', roughness: 0.45, metalness: 0.5, envMapIntensity: 0.8, emissive: '#000000' }),
        placa: new THREE.MeshStandardMaterial({ color: '#2f6b3a', roughness: 0.6, metalness: 0.1 }),
        chip: new THREE.MeshStandardMaterial({ color: '#1c1c1e', roughness: 0.5, metalness: 0.2 }),
        capacitor: new THREE.MeshStandardMaterial({ color: '#2f5fa8', roughness: 0.45, metalness: 0.1 }),
        transistor: new THREE.MeshStandardMaterial({ color: '#232326', roughness: 0.4, metalness: 0.3, emissive: '#000000' }),
        nucleoF: new THREE.MeshStandardMaterial({ color: '#5c6168', roughness: 0.4, metalness: 0.75 }),
        relevador: new THREE.MeshStandardMaterial({ color: '#e9e6df', roughness: 0.5 }),
        trafoSeco: new THREE.MeshStandardMaterial({ color: '#7d8f86', roughness: 0.5, metalness: 0.3, envMapIntensity: 0.8 }),
        tablero: new THREE.MeshStandardMaterial({ color: '#c2c7cd', roughness: 0.45, metalness: 0.45, envMapIntensity: 0.8 }),
        pantalla: new THREE.MeshBasicMaterial({ color: '#1f3a4a', toneMapped: false }),
        verde: new THREE.MeshBasicMaterial({ color: '#2fb36a', toneMapped: false }),
        rojo: new THREE.MeshBasicMaterial({ color: '#e0302a', toneMapped: false }),
        ambar: new THREE.MeshBasicMaterial({ color: '#ffb000', toneMapped: false }),
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

/** Un toroide (bobina) parado, con su vuelta de cobre. */
function toroide(M, r) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.42, 10, 24), M.cobre));
    return g;
}

export function construir(M, P, { movil = false, oscuro = false } = {}) {
    const raiz = new THREE.Group();
    const ids = PARTES.map(p => p.id);
    const kit = crearAyudante(M, raiz, ids, { movil });
    const { partes, unidad, mover, brillo, cub, rotular } = kit;
    const colorSuelo = oscuro ? '#f2efe8' : P.tinta;
    const plano = (padre, texto, x, z, ancho, giro = 0, y = 0.012) => { const r = rotular(padre, texto, x, y, z, colorSuelo, ancho); r.rotation.set(-PI / 2, 0, giro); return r; };
    const malla = (geos, m) => sombra(new THREE.Mesh(mergeGeometries(geos), m));
    const H = EDIFICIO.alto;

    // --------- el piso, el auditorio y su techumbre
    {
        const g = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0, -Y0, Z1 - Z0).translate(0, Y0 / 2, 0), M.piso);
        g.receiveShadow = true;
        raiz.add(g);
        const [ex0, ex1] = EDIFICIO.x;
        const [ez0, ez1] = EDIFICIO.z;
        raiz.add(en(caja(ex1 - ex0, H, ez1 - ez0, M.muro), (ex0 + ex1) / 2, 0, (ez0 + ez1) / 2));
        raiz.add(en(caja(ex1 - ex0 + 0.12, 0.08, ez1 - ez0 + 0.12, M.concreto), (ex0 + ex1) / 2, H - 0.02, (ez0 + ez1) / 2));
        // ventanas al frente
        const v = [];
        for (let x = ex0 + 0.7; x < ex1 - 0.4; x += 1.1) v.push(new THREE.BoxGeometry(0.6, 0.55, 0.02).translate(x, 1.05, ez1 + 0.011));
        raiz.add(new THREE.Mesh(mergeGeometries(v), M.ventana));
        rotular(raiz, 'Auditorio Tonatiuh · IER-UNAM, Temixco', (ex0 + ex1) / 2, 1.72, ez1 + 0.02, oscuro ? '#2b2b2b' : P.tinta, 3.2);
    }

    // --------- los módulos: cuatro subarreglos de tres cadenas de 14, inclinados 19° hacia el sur
    const arreglo = unidad('arreglo');
    const cadena = unidad('cadena');
    const incl = (PLANTA.inclinacion * PI) / 180;
    {
        const n = ARREGLO.serie;
        const paso = MODULO.w + 0.012;
        const geoCelda = new THREE.BoxGeometry(MODULO.w, 0.02, MODULO.d);
        const geoMarco = new THREE.BoxGeometry(MODULO.w + 0.012, 0.012, MODULO.d + 0.012);
        const pos = [];
        for (const s of SUBARREGLO) for (let f = 0; f < ARREGLO.cadenas; f++) for (let k = 0; k < n; k++) {
            const x = s.x + (k - (n - 1) / 2) * paso;
            const z = s.z + (f - 1) * MODULO.fila;
            pos.push({ x, z, esCadena: s.id === 2 && f === 2 });
        }
        const m4 = new THREE.Matrix4();
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(incl, 0, 0));
        const v = new THREE.Vector3();
        const uno = new THREE.Vector3(1, 1, 1);
        const resto = pos.filter(p => !p.esCadena);
        const suyos = pos.filter(p => p.esCadena);
        const instancias = (lista, geo, mat, dy) => {
            const im = new THREE.InstancedMesh(geo, mat, lista.length);
            lista.forEach((p, i) => { v.set(p.x, H + 0.22 + dy, p.z); im.setMatrixAt(i, m4.compose(v, q, uno)); });
            im.castShadow = true;
            return im;
        };
        arreglo.add(instancias(resto, geoCelda, M.celdas, 0.008), instancias(resto, geoMarco, M.marco, 0));
        // la cadena de muestra lleva el marco guinda
        cadena.add(instancias(suyos, geoCelda, M.celdas, 0.008), instancias(suyos, geoMarco, M.guinda, 0));
        // los soportes de cada fila
        const r = [];
        for (const s of SUBARREGLO) for (let f = 0; f < ARREGLO.cadenas; f++) {
            const z = s.z + (f - 1) * MODULO.fila;
            const ancho = n * paso;
            r.push(new THREE.BoxGeometry(ancho, 0.03, 0.03).translate(s.x, H + 0.12, z - 0.08), new THREE.BoxGeometry(ancho, 0.03, 0.03).translate(s.x, H + 0.2, z + 0.06));
            for (let k = 0; k <= 4; k++) { const x = s.x - ancho / 2 + (ancho * k) / 4; r.push(new THREE.BoxGeometry(0.03, 0.18, 0.03).translate(x, H + 0.09, z - 0.08), new THREE.BoxGeometry(0.03, 0.1, 0.03).translate(x, H + 0.05, z + 0.06)); }
        }
        arreglo.add(malla(r, M.rack));
        for (const s of SUBARREGLO) rotular(arreglo, `Subarreglo ${s.id}`, s.x, H + 0.02, s.z + 0.55, colorSuelo, 1.1).rotation.set(-PI / 2, 0, 0);
    }

    // --------- las cajas de protección de las cadenas, en el borde de la techumbre
    const cajas = unidad('cajas');
    for (const c of CAJAS) {
        cajas.add(en(caja(0.42, 0.34, 0.24, M.tablero), c.x, c.y, c.z));
        cajas.add(en(caja(0.08, 0.1, 0.03, M.rojo), c.x + 0.12, c.y + 0.18, c.z + 0.13));
    }

    // --------- los dos inversores, sobre su base; el 1 se vuelve vidrio para ver adentro
    const inversor = unidad('inversor');
    const disipador = unidad('disipador');
    const adentroIds = ['mppt', 'bus', 'puente', 'filtro', 'relevadores', 'control'];
    const yI = v => INV.y0 + v * INV.h;
    const zF = INV.z + INV.d / 2;
    const focos = [];
    INV.x.forEach((x, k) => {
        raiz.add(en(caja(INV.w + 0.4, INV.y0, INV.d + 0.3, M.concreto), x, 0, INV.z));
        const mat = k === 0 ? cub('inversor1', adentroIds, { color: '#f3f1ec', metal: 0.05 }) : M.marfil;
        const g = new THREE.Group();
        const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(INV.w, INV.h, INV.d).translate(x, INV.y0 + INV.h / 2, INV.z), mat);
        cuerpo.castShadow = true;
        g.add(cuerpo);
        g.add(new THREE.Mesh(new THREE.BoxGeometry(INV.w + 0.04, 0.06, INV.d + 0.04).translate(x, INV.y0 + INV.h, INV.z), mat));
        inversor.add(g);
        if (k === 0) mover(g, [0, 0, 1.1]);
        // la pantalla y su foco: verde, conectado; rojo, fuera
        inversor.add(en(caja(0.42, 0.14, 0.01, M.pantalla), x, yI(0.88), zF + 0.005));
        const f = en(caja(0.06, 0.06, 0.012, M.verde), x + 0.3, yI(0.9), zF + 0.006);
        inversor.add(f);
        focos.push(f);
        // atrás: las aletas del disipador, sin ventiladores
        const al = [];
        for (let i = 0; i < 13; i++) al.push(new THREE.BoxGeometry(0.02, INV.h * 0.9, 0.2).translate(x - INV.w / 2 + 0.1 + i * ((INV.w - 0.2) / 12), INV.y0 + INV.h * 0.5, INV.z - INV.d / 2 - 0.1));
        disipador.add(malla(al, M.aletas));
        brillo(disipador, x, yI(0.6), INV.z - INV.d / 2 - 0.2, 1.8, '#ff8a3c', 'calor', 1, false);
        plano(raiz, `Inversor ${k + 1}`, x, INV.z + 0.85, 0.9);
    });
    brillo(inversor, INV.x[0], yI(0.6), zF + 0.2, 2.2, '#e0302a', 'alarma', 1.2, false);

    // --------- adentro del inversor 1
    const IX = INV.x[0];
    const zA = zF - 0.1;
    const adentro = new THREE.Group();
    raiz.add(adentro);
    const mppt = unidad('mppt', 0, 0, adentro);
    const bus = unidad('bus', 0, 0, adentro);
    const puente = unidad('puente', 0, 0, adentro);
    const filtro = unidad('filtro', 0, 0, adentro);
    const relevadores = unidad('relevadores', 0, 0, adentro);
    const control = unidad('control', 0, 0, adentro);
    {
        // la placa del fondo
        adentro.add(en(caja(INV.w - 0.08, INV.h - 0.1, 0.02, M.grafito), IX, INV.y0 + 0.05, INV.z - INV.d / 2 + 0.03));
        // los seguidores: las terminales de corriente directa y dos bobinas elevadoras, una por canal
        for (const dx of [-0.45, -0.33]) mppt.add(en(caja(0.08, 0.1, 0.08, M.chip), IX + dx, yI(0.06), zA));
        for (const dx of [-0.36, -0.14]) { const t = toroide(M, 0.075); t.position.set(IX + dx, yI(0.3), zA); mppt.add(t); }
        // el bus: capacitores de película (no electrolíticos)
        for (let i = 0; i < 4; i++) bus.add(en(caja(0.12, 0.16, 0.12, M.capacitor), IX - 0.42 + i * 0.15, yI(0.43), zA));
        bus.add(en(caja(0.62, 0.02, 0.06, M.cobre), IX - 0.2, yI(0.43) + 0.17, zA));
        // el puente: tres módulos de transistores, uno por fase, sobre su placa
        puente.add(en(caja(0.62, 0.03, 0.18, M.aletas), IX - 0.05, yI(0.66), zA - 0.02));
        for (let i = 0; i < 3; i++) puente.add(en(caja(0.16, 0.08, 0.14, M.transistor), IX - 0.25 + i * 0.2, yI(0.66) + 0.03, zA));
        // el filtro: tres bobinas (una por fase) y sus capacitores
        for (let i = 0; i < 3; i++) {
            const y = yI(0.32 + i * 0.13);
            filtro.add(en(caja(0.18, 0.16, 0.12, M.nucleoF), IX + 0.38, y, zA));
            filtro.add(en(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.13, 16).rotateZ(PI / 2), M.cobre), IX + 0.38, y + 0.08, zA + 0.01));
        }
        for (let i = 0; i < 3; i++) filtro.add(en(cil(0.03, 0.08, M.capacitor), IX + 0.18, yI(0.3) + i * 0.1, zA + 0.02));
        // los relevadores de salida: abren para separar el inversor de la red
        for (let i = 0; i < 3; i++) relevadores.add(en(caja(0.09, 0.09, 0.08, M.relevador), IX + 0.24 + i * 0.11, yI(0.11), zA));
        // el control: la tarjeta con su procesador
        control.add(en(caja(0.9, 0.2, 0.02, M.placa), IX, yI(0.8), zA - 0.03));
        for (let i = 0; i < 5; i++) control.add(en(caja(0.08, 0.06, 0.015, M.chip), IX - 0.32 + i * 0.16, yI(0.83), zA - 0.01));
        brillo(puente, IX - 0.05, yI(0.7), zA + 0.08, 0.9, '#7fc8ff', 'puente', 0.8, false);
    }

    // --------- el transformador seco de 45 kVA, de 480 a 220 V
    const transformador = unidad('transformador');
    {
        const [x, z] = SITIO.trafo;
        transformador.add(en(caja(1.0, 1.3, 0.9, M.trafoSeco), x, 0, z));
        const rej = [];
        for (let i = 0; i < 7; i++) rej.push(new THREE.BoxGeometry(0.7, 0.025, 0.01).translate(x, 0.35 + i * 0.1, z + 0.455));
        transformador.add(malla(rej, M.grafito));
        plano(raiz, 'Transformador de 45 kVA', x, z + 0.75, 1.3);
    }

    // --------- el tablero del punto de interconexión, con su interruptor
    const interconexion = unidad('interconexion');
    let focoTab = null;
    {
        const [x, z] = SITIO.tablero;
        interconexion.add(en(caja(0.7, 1.5, 0.45, M.tablero), x, 0, z));
        interconexion.add(en(caja(0.1, 0.22, 0.04, M.grafito), x - 0.15, 1.0, z + 0.24));
        focoTab = en(caja(0.08, 0.08, 0.02, M.verde), x + 0.18, 1.25, z + 0.235);
        interconexion.add(focoTab);
        plano(raiz, 'Punto de interconexión', x, z + 0.7, 1.4);
    }

    // --------- el poste de la red del IER: el cable del tablero sube por dentro y de su cruceta cuelgan las tres fases
    const red = unidad('red');
    {
        const [x, z] = SITIO.poste;
        red.add(en(sombra(new THREE.Mesh(geoTorre(POSTE.alto, 0.16), M.torre)), x, 0, z));
        crearLineasAereas({ raiz, lineas: LINEAS, partes, parteDe: () => 'red', movil });
        brillo(red, x, 2.9, z, 1.6, '#4a4f57', 'isla', 1, false);
        plano(raiz, 'Red del IER, 220 V', x - 0.4, z + 0.45, 1.3);
    }

    // --------- una luminaria
    raiz.add(en(cil(0.04, 3.4, M.rack), 5.2, 0, -2.6));
    raiz.add(en(caja(0.3, 0.08, 0.18, M.lampara), 5.2, 3.36, -2.55));
    brillo(raiz, 5.2, 3.3, -2.55, 1.8, '#ffe2ad', 'noche', 0.9, true);

    // --------- al desarmar: la tapa del inversor 1 sale al frente y sus partes se separan
    mover(mppt, [-0.35, -0.05, 0.5], 0.3);
    mover(bus, [-0.2, 0, 0.75], 0.3);
    mover(puente, [0, 0.25, 0.6], 0.3);
    mover(filtro, [0.35, 0, 0.5], 0.3);
    mover(relevadores, [0.3, -0.05, 0.75], 0.3);
    mover(control, [0, 0.45, 0.3], 0.3);
    mover(cajas, [0, 0.3, 0]);

    // --------- lo que corre por los cables
    const tubos = crearTubos({ raiz, lineas: LINEAS, fluidos: FLUIDOS, M, partes, movil });

    const anclas = {};
    for (const p of PARTES) { const o = new THREE.Object3D(); o.position.set(...p.ancla); raiz.add(o); anclas[p.id] = o; }

    // ---------- posar
    const azul = new THREE.Color('#7fc8ff');
    function posar(e) {
        const act = p => (p === 'noche' ? e.noche : p === 'siempre' ? 1 : p ? (e.activo[p] ?? 0) : 1);
        const a = sale(e.desarme * 3);
        const ab = { ...(e.abierta || {}) };
        kit.posar(e, act, ab, { apagar: a });
        tubos.posar(e, a);
        // los transistores parpadean con la conmutación (en cámara muy lenta)
        const ver = Math.max(e.adentro, ab.puente ?? 0, ab.bus ?? 0, ab.filtro ?? 0, ab.mppt ?? 0, 0.3);
        const parpadeo = 0.5 + 0.5 * Math.sin(e.t * (4 + 30 * (e.conmuta ?? 0)));
        M.transistor.emissive.copy(azul).multiplyScalar(0.5 * (e.activo.puente ?? 0) * parpadeo * ver);
        M.aletas.emissive.set('#ff5a1f').multiplyScalar(0.25 * (e.activo.calor ?? 0));
        // los módulos brillan un poco con el sol
        M.celdas.emissive.set('#2a5aa8').multiplyScalar(0.18 * (e.sol ?? 0));
        focos.forEach(f => { f.material = e.conectado ? M.verde : e.activo.isla ? M.ambar : M.rojo; });
        focoTab.material = e.conectado ? M.verde : M.rojo;
        M.lampara.color.set('#9a9c9f').lerp(new THREE.Color('#ffe2ad'), e.noche);
        M.ventana.color.set('#3f4a57').lerp(new THREE.Color('#ffc77a'), e.noche);
    }
    return { raiz, posar, partes, anclas, giran: kit.giran, repintar: kit.repintar };
}
