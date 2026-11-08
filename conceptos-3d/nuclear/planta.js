// La central nuclear, hecha con código. Sistema Búho: cubiertas de marfil sobre estructura de grafito y acero, en una franja de
// costa cortada de frente para ver el mar. Un reactor de agua en ebullición con contención Mark II, abierto por capas: edificio,
// contención, vasija y núcleo con sus 444 ensambles y 109 barras contados uno a uno. Cada fluido tiene su color y corre visible por
// tubos de vidrio. Las cubiertas se vuelven vidrio (adentro = 1) y cada equipo se separa en sus piezas (desarme = 1).
//
//   materiales(P, { movil })                  estudio(renderer, scene, M, { movil, oscuro })
//   construir(M, P, { movil }) → { raiz, posar(e), partes, anclas, giran, repintar }
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BLOQUE, COSTA_Z, EDIFICIO, EJE, EQUIPOS, FLUIDOS, LINEAS, MAR_Y, MUESTRA, NAVE, PARTES, RX, SECO, TORRES, VASIJA, rejillaNucleo } from './modelo.js';

const PI = Math.PI;
const clamp01 = x => Math.min(1, Math.max(0, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sale = x => 1 - (1 - clamp01(x)) ** 3;
const fract = x => x - Math.floor(x);
const azar = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

export const P_PLANTA = {
    papel: '#fafafa', noche: '#0a0e12', tinta: '#171317', marfil: '#f3f1ec', grafito: '#303137', acero: '#a7abb3', guinda: '#9b2247', rosa: '#e57a9a',
    tierraDia: '#c8c5be', tierraNoche: '#23272c', losaDia: '#dcdcda', losaNoche: '#2c3036', suelo: '#b7a78b', fondo: '#8a8172', roca: '#6b675f',
    marDia: '#6fb7d0', marNoche: '#16303d',
};

function texturaBrillo() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 2, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.28, 'rgba(255,255,255,0.32)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.07)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
}
function texturaVaho() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,0.75)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.32)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
}
function texturaGrano(base, oscuro, repite) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = base;
    x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2400; i++) {
        x.fillStyle = azar(i, 31) > 0.5 ? 'rgba(255,255,255,0.09)' : oscuro;
        x.fillRect(azar(i, 32) * 256, azar(i, 33) * 256, 1 + azar(i, 34) * 2, 1 + azar(i, 35) * 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repite);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}
// olas: rayas suaves y claras que se deslizan sobre el color del mar
function texturaOlas() {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const x = c.getContext('2d');
    x.fillStyle = '#fff';
    x.fillRect(0, 0, 512, 512);
    x.lineCap = 'round';
    for (let i = 0; i < 230; i++) {
        const [u, v] = [azar(i, 51) * 512, azar(i, 52) * 512];
        const l = 16 + azar(i, 53) * 52;
        x.strokeStyle = azar(i, 54) > 0.45 ? `rgba(255,255,255,${0.2 + azar(i, 55) * 0.4})` : `rgba(10,50,70,${0.06 + azar(i, 56) * 0.12})`;
        x.lineWidth = 1 + azar(i, 57) * 2.4;
        x.beginPath();
        x.moveTo(u - l, v);
        x.quadraticCurveTo(u, v + 3 - azar(i, 58) * 6, u + l, v);
        x.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(3.6, 0.8);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}
/** Letrero: una tira transparente con su nombre. */
function letrero(texto, color, movil, ancho = 2.4) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 96;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    const pintar = () => {
        const x = c.getContext('2d');
        x.clearRect(0, 0, 512, 96);
        x.font = `600 ${movil ? 66 : 58}px Fraunces, Georgia, serif`;
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.fillStyle = color;
        x.fillText(texto, 256, 50);
        t.needsUpdate = true;
    };
    pintar();
    const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, ancho * 0.1875), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
    m.renderOrder = 2;
    return { m, pintar };
}

export function materiales(P, { movil = false } = {}) {
    const env = { envMapIntensity: 0.8 };
    const M = {
        P, brillo: texturaBrillo(), vaho: texturaVaho(),
        marfil: new THREE.MeshPhysicalMaterial({ color: P.marfil, roughness: 0.5, metalness: 0.05, clearcoat: 0.35, clearcoatRoughness: 0.4, ...env }),
        cubierta: new THREE.MeshPhysicalMaterial({ color: P.marfil, roughness: 0.48, metalness: 0.05, clearcoat: 0.4, clearcoatRoughness: 0.35, transparent: true, side: THREE.DoubleSide, ...env }),
        grafito: new THREE.MeshStandardMaterial({ color: P.grafito, roughness: 0.5, metalness: 0.65, ...env }),
        acero: new THREE.MeshStandardMaterial({ color: P.acero, roughness: 0.34, metalness: 0.9, envMapIntensity: 1 }),
        torre: new THREE.MeshStandardMaterial({ color: P.grafito, roughness: 0.5, metalness: 0.65, ...env }),
        cobre: new THREE.MeshStandardMaterial({ color: '#c8743c', roughness: 0.34, metalness: 0.9, envMapIntensity: 1 }),
        guinda: new THREE.MeshPhysicalMaterial({ color: P.guinda, roughness: 0.45, metalness: 0.1, clearcoat: 0.5, ...env }),
        azul: new THREE.MeshPhysicalMaterial({ color: FLUIDOS.agua.color, roughness: 0.45, metalness: 0.1, clearcoat: 0.5, ...env }),
        losa: new THREE.MeshStandardMaterial({ color: P.losaDia, roughness: 0.9, envMapIntensity: 0.3 }),
        concreto: new THREE.MeshStandardMaterial({ color: '#cfccc5', roughness: 0.92, envMapIntensity: 0.3 }),
        tierra: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#ffffff', 'rgba(0,0,0,0.05)', [6, 3.2]), roughness: 0.95, envMapIntensity: 0.25 }),
        suelo: new THREE.MeshStandardMaterial({ color: P.suelo, map: texturaGrano('#ffffff', 'rgba(0,0,0,0.1)', [6, 1]), roughness: 0.95, envMapIntensity: 0.25 }),
        fondo: new THREE.MeshStandardMaterial({ color: P.fondo, map: texturaGrano('#ffffff', 'rgba(0,0,0,0.1)', [6, 1]), roughness: 0.95, envMapIntensity: 0.25 }),
        roca: new THREE.MeshStandardMaterial({ color: P.roca, roughness: 0.9, flatShading: true, envMapIntensity: 0.3 }),
        madera: new THREE.MeshStandardMaterial({ color: '#7a6248', roughness: 0.85, envMapIntensity: 0.3 }),
        hoja: new THREE.MeshStandardMaterial({ color: '#3f5d44', roughness: 0.9, envMapIntensity: 0.3 }),
        vidrio: new THREE.MeshPhysicalMaterial({ color: '#dff2ff', roughness: 0.08, transparent: true, opacity: 0.16, clearcoat: 1, clearcoatRoughness: 0.05, depthWrite: false, side: THREE.DoubleSide }),
        tuberia: new THREE.MeshPhysicalMaterial({ color: P.acero, roughness: 0.3, metalness: 0.6, transparent: true, opacity: 0.34, clearcoat: 0.6, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 0.8 }),
        aguaRx: new THREE.MeshPhysicalMaterial({ color: '#8fb4ff', roughness: 0.15, transparent: true, opacity: 0.2, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide }),
        aguaAlberca: new THREE.MeshPhysicalMaterial({ color: '#38a6c9', roughness: 0.12, transparent: true, opacity: 0.55, clearcoat: 1, depthWrite: false }),
        marVol: new THREE.MeshPhysicalMaterial({ color: '#3f97b8', roughness: 0.2, transparent: true, opacity: 0.62, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide }),
        marArriba: new THREE.MeshPhysicalMaterial({ color: P.marDia, map: texturaOlas(), roughness: 0.28, metalness: 0.05, clearcoat: 0.4, clearcoatRoughness: 0.5, transparent: true, opacity: 0.94, envMapIntensity: 0.3 }),
        canal: new THREE.MeshPhysicalMaterial({ color: FLUIDOS.marCaliente.color, roughness: 0.2, transparent: true, opacity: 0.5, clearcoat: 1, depthWrite: false }),
        ensamble: new THREE.MeshStandardMaterial({ color: '#7d838d', roughness: 0.45, metalness: 0.6, envMapIntensity: 0.8 }),
        pastilla: new THREE.MeshStandardMaterial({ color: '#5b5e66', roughness: 0.4, metalness: 0.5, envMapIntensity: 1 }),
        zirconio: new THREE.MeshStandardMaterial({ color: '#c8ccd4', roughness: 0.3, metalness: 0.85, envMapIntensity: 1 }),
        cherenkov: new THREE.MeshBasicMaterial({ color: '#2f8fff', transparent: true, opacity: 0, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
        ventana: new THREE.MeshBasicMaterial({ color: '#ffc77a', toneMapped: false }),
        lampara: new THREE.MeshBasicMaterial({ color: '#ffe2ad', toneMapped: false }),
        neonElec: new THREE.MeshBasicMaterial({ color: FLUIDOS.elec.color, toneMapped: false }),
        neonGuinda: new THREE.MeshBasicMaterial({ color: P.rosa, toneMapped: false }),
        neutron: new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
        particula: new THREE.MeshBasicMaterial({ toneMapped: false }),
        fluido: {},
    };
    for (const [k, f] of Object.entries(FLUIDOS)) M.fluido[k] = new THREE.MeshBasicMaterial({ color: f.color, toneMapped: false });
    return M;
}

// ------------------------------------------------------------------ estudio
const Y0 = BLOQUE.y[0];
export function estudio(renderer, scene, M, { movil = false, oscuro = false } = {}) {
    const P = M.P;
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = !movil;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;

    const cielo = new THREE.HemisphereLight('#ffffff', '#b8b2a8', 0.7);
    const sol = new THREE.DirectionalLight('#ffffff', 2.2);
    sol.castShadow = !movil;
    Object.assign(sol.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 50 });
    sol.shadow.mapSize.set(2048, 2048);
    sol.shadow.bias = -0.0006;
    sol.shadow.normalBias = 0.025;
    const reflector = new THREE.DirectionalLight('#ffffff', 0.1);
    reflector.position.set(3, 8, 9);
    scene.add(cielo, sol, reflector);

    // como en las demás figuras de Aprende: solo recibe sombra y deja ver el papel del sitio
    const suelo = new THREE.Mesh(new THREE.CircleGeometry(34, 64).rotateX(-PI / 2), new THREE.ShadowMaterial({ color: '#000000', opacity: oscuro ? 0.35 : 0.14 }));
    suelo.position.y = Y0 - 0.02;
    suelo.receiveShadow = true;
    scene.add(suelo);

    const estrellas = (() => {
        const n = 110;
        const pos = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const a = azar(i, 1) * PI * 2;
            const r = 28 + azar(i, 2) * 10;
            pos.set([Math.cos(a) * r, 4 + azar(i, 3) * 18, Math.sin(a) * r], i * 3);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const m = new THREE.Points(g, new THREE.PointsMaterial({ color: '#dfe9ff', size: 0.09, transparent: true, depthWrite: false, toneMapped: false }));
        m.frustumCulled = false;
        scene.add(m);
        return m;
    })();

    const dia = { sol: new THREE.Color('#ffffff'), tierra: new THREE.Color(oscuro ? '#8f8c86' : P.tierraDia), losa: new THREE.Color(oscuro ? '#9a9b9a' : P.losaDia), mar: new THREE.Color(oscuro ? '#3f8aa5' : P.marDia), concreto: new THREE.Color(oscuro ? '#a5a39c' : '#cfccc5') };
    if (oscuro) M.torre.color.set('#8f929a');
    const noche = { sol: new THREE.Color('#9db6ff'), tierra: new THREE.Color(P.tierraNoche), losa: new THREE.Color(P.losaNoche), mar: new THREE.Color(P.marNoche), concreto: new THREE.Color('#383c42') };
    const v = new THREE.Vector3();
    function actualizar(e) {
        const n = e.noche;
        const a = lerp(0.95, -0.2, n);
        v.set(3.5 + 3 * n, 8 + 8 * Math.max(0, Math.sin(a * 1.1 + 0.6)), 12 - 15 * n);
        sol.position.copy(v);
        sol.intensity = lerp(2, 0.32, n);
        sol.color.copy(dia.sol).lerp(noche.sol, n);
        cielo.intensity = lerp(0.72, 0.18, n);
        reflector.intensity = lerp(0.1, 0.55, n);
        scene.environmentIntensity = lerp(0.5, 0.22, n);
        M.tierra.color.copy(dia.tierra).lerp(noche.tierra, n);
        M.losa.color.copy(dia.losa).lerp(noche.losa, n);
        M.concreto.color.copy(dia.concreto).lerp(noche.concreto, n);
        M.marArriba.color.copy(dia.mar).lerp(noche.mar, n);
        M.marVol.color.set('#3f97b8').lerp(noche.mar, n * 0.7);
        estrellas.material.opacity = clamp01((n - 0.3) * 1.5);
        estrellas.visible = estrellas.material.opacity > 0.01;
    }
    return { actualizar };
}

// ------------------------------------------------------------------ piezas sueltas
const sombra = m => { m.castShadow = true; m.receiveShadow = true; return m; };
const caja = (w, h, d, m) => sombra(new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), m));
const cil = (r, h, m, rTop = r, seg = 24) => sombra(new THREE.Mesh(new THREE.CylinderGeometry(rTop, r, h, seg).translate(0, h / 2, 0), m));
const cilX = (r, l, m, seg = 20) => sombra(new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, seg).rotateZ(PI / 2), m));
const cilZ = (r, l, m, seg = 16) => sombra(new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, seg).rotateX(PI / 2), m));
const aro = (r, t, m) => new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 36).rotateX(PI / 2), m);
const aroX = (r, t, m) => new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 36).rotateY(PI / 2), m);
const en = (o, x, y, z) => { o.position.set(x, y, z); return o; };
/** Cilindro entre dos puntos, como geometría suelta para juntarla después. */
function geoEntre(a, b, r, seg = 5) {
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...b);
    const d = B.clone().sub(A);
    const g = new THREE.CylinderGeometry(r, r, d.length(), seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()));
    g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
    return g;
}
const entre = (a, b, r, m) => sombra(new THREE.Mesh(geoEntre(a, b, r), m));
/** Recipiente vertical con tapas abombadas, base en y = 0. */
function recipienteGeo(r, h, bombeo = 0.55) {
    const puntos = [];
    const tapa = r * bombeo;
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * (PI / 2); puntos.push(new THREE.Vector2(Math.sin(a) * r, tapa - Math.cos(a) * tapa)); }
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * (PI / 2); puntos.push(new THREE.Vector2(Math.cos(a) * r, h - tapa + Math.sin(a) * tapa)); }
    return new THREE.LatheGeometry(puntos, 36);
}
/** Media carcasa a lo largo de x: mitad de arriba o de abajo, según un perfil [[x, r], …]. */
function mediaCarcasa(perfil, arriba) {
    const puntos = perfil.map(([x, r]) => new THREE.Vector2(r, x));
    return new THREE.LatheGeometry(puntos, 28, arriba ? PI : 0, PI).rotateZ(-PI / 2);
}
/** Torre de transmisión: cuatro patas y arriostrado en X. Con su punta en y = h. */
function geoTorre(h, base = 0.36) {
    const g = [];
    const ancho = y => lerp(base, 0.07, Math.min(1, y / (h * 0.82)));
    const nudos = [0, 0.3, 0.55, 0.76, 0.86, 0.94].map(k => k * h);
    for (let i = 0; i < nudos.length - 1; i++) {
        const [y0, y1] = [nudos[i], nudos[i + 1]];
        const [a0, a1] = [ancho(y0), ancho(y1)];
        for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.push(geoEntre([sx * a0, y0, sz * a0], [sx * a1, y1, sz * a1], 0.012));
        for (const [a, b, c, d] of [[[-1, -1], [1, -1], [1, -1], [-1, -1]], [[1, -1], [1, 1], [1, 1], [1, -1]], [[1, 1], [-1, 1], [-1, 1], [1, 1]], [[-1, 1], [-1, -1], [-1, -1], [-1, 1]]]) {
            g.push(geoEntre([a[0] * a0, y0, a[1] * a0], [b[0] * a1, y1, b[1] * a1], 0.006));
            g.push(geoEntre([c[0] * a0, y0, c[1] * a0], [d[0] * a1, y1, d[1] * a1], 0.006));
        }
    }
    const brazoY = h * 0.92;
    g.push(geoEntre([-0.3, brazoY, 0], [0.3, brazoY, 0], 0.012));
    g.push(geoEntre([0, brazoY, -0.3], [0, brazoY, 0.3], 0.012));
    g.push(geoEntre([0, h * 0.86, 0], [0, h * 1.0, 0], 0.012));
    return mergeGeometries(g);
}
/** Figura plana (z, y) estirada a lo largo de todo x. */
function perfilEnX(puntos, x0, x1) {
    const f = new THREE.Shape();
    puntos.forEach(([z, y], i) => { if (i) f.lineTo(z, y); else f.moveTo(z, y); });
    f.closePath();
    return new THREE.ExtrudeGeometry(f, { depth: x1 - x0, bevelEnabled: false }).rotateY(-PI / 2).translate(x1, 0, 0);
}

// ------------------------------------------------------------------ la central
export function construir(M, P, { movil = false } = {}) {
    const raiz = new THREE.Group();
    const partes = Object.fromEntries(PARTES.map(p => [p.id, []]));
    const movibles = [];
    const giran = [];
    const brillos = [];
    const luces = [];
    const vahos = [];
    const lampNoche = new THREE.Color('#ffe2ad');
    const ventanaNoche = new THREE.Color('#ffc77a');
    const cubiertas = {};
    const enCubierta = {};
    const rotulos = [];
    // lo que depende del tipo de reactor: el de ebullición y, para comparar, el de agua a presión
    const gBWR = new THREE.Group();
    const gPWR = new THREE.Group();
    raiz.add(gBWR, gPWR);
    gPWR.visible = false;
    const unidad = (id, x = 0, z = 0, padre = raiz) => { const g = new THREE.Group(); g.position.set(x, 0, z); padre.add(g); partes[id].push(g); return g; };
    const mover = (obj, d, k = 0) => { movibles.push({ obj, p0: obj.position.clone(), d: new THREE.Vector3(...d), k }); return obj; };
    const brillo = (padre, x, y, z, esc, color, proceso = null, fuerza = 1, noche = true) => {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.brillo, color, transparent: true, depthWrite: false, depthTest: false, toneMapped: false }));
        s.position.set(x, y, z);
        s.scale.setScalar(esc);
        s.renderOrder = 6;
        padre.add(s);
        brillos.push({ s, proceso, fuerza, noche });
        return s;
    };
    const luz = (padre, x, y, z, color, fuerza, proceso, alcance = 5) => {
        const l = new THREE.PointLight(color, 0, alcance, 2);
        l.position.set(x, y, z);
        padre.add(l);
        luces.push({ l, fuerza, proceso });
    };
    // Una cubierta se vuelve vidrio cuando se elige alguna de estas partes, o con «Ver por dentro».
    const cub = (nombre, abre, opciones = {}) => {
        if (!cubiertas[nombre]) {
            const mat = M.cubierta.clone();
            if (opciones.color) mat.color.set(opciones.color);
            if (opciones.metal !== undefined) mat.metalness = opciones.metal;
            cubiertas[nombre] = { mat, abre };
        }
        return cubiertas[nombre].mat;
    };
    const gotas = { vapor: [], agua: [], mar: [] };
    const gota = (fluido, proceso, x, z, y0, y1, vel = 0.4, r = 0.02, abre = 0.02, soloBWR = false) => gotas[fluido].push({ proceso, x, z, y0, y1, vel, r, abre, soloBWR, h: azar(gotas[fluido].length, x + z) });
    const rotular = (padre, texto, x, y, z, color, ancho = 2.4, giro = 0) => {
        const l = letrero(texto, color, movil, ancho);
        l.m.position.set(x, y, z);
        l.m.rotation.y = giro;
        padre.add(l.m);
        rotulos.push(l);
        return l.m;
    };

    // --------- el terreno: tierra, costa, mar
    const [X0, X1] = BLOQUE.x;
    const [Z0, Z1] = BLOQUE.z;
    {
        const terreno = new THREE.Group();
        raiz.add(terreno);
        // el terreno entero da una sola sombra en el papel: sin esto, las de las piezas lo atraviesan y caen sueltas.
        // Es invisible, y bajo el mar va bajo el fondo para no oscurecer el agua.
        const molde = (y0, y1, z0, z1) => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0 - 0.04, y1 - y0, z1 - z0), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
            m.position.set(0, (y0 + y1) / 2, (z0 + z1) / 2);
            m.castShadow = true;
            terreno.add(m);
        };
        molde(Y0 + 0.02, -0.02, Z0 + 0.02, COSTA_Z);
        molde(Y0 + 0.02, -1.25, COSTA_Z, Z1 - 0.02);
        const prof = COSTA_Z - Z0;
        const geo = new THREE.BoxGeometry(X1 - X0, -Y0, prof);
        const bloque = new THREE.Mesh(geo, [M.suelo, M.suelo, M.tierra, M.suelo, M.suelo, M.suelo]);
        bloque.position.set(0, Y0 / 2, Z0 + prof / 2);
        bloque.receiveShadow = true;
        terreno.add(bloque);
        // el fondo del mar y el agua, vistos de frente en el corte
        const fondoY = z => lerp(-0.62, -1.18, clamp01((z - COSTA_Z) / (Z1 - COSTA_Z)) ** 0.8);
        const puntosFondo = [];
        for (let i = 0; i <= 12; i++) { const z = lerp(COSTA_Z, Z1, i / 12); puntosFondo.push([z, fondoY(z) + 0.02 * Math.sin(i * 1.9)]); }
        terreno.add(new THREE.Mesh(perfilEnX([[COSTA_Z, Y0], ...puntosFondo, [Z1, Y0]], X0, X1), M.fondo));
        const volumen = new THREE.Mesh(perfilEnX([...puntosFondo, [Z1, MAR_Y], [COSTA_Z, MAR_Y]], X0, X1), M.marVol);
        volumen.renderOrder = 1;
        terreno.add(volumen);
        const arriba = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - COSTA_Z).rotateX(-PI / 2), M.marArriba);
        arriba.position.set(0, MAR_Y, (COSTA_Z + Z1) / 2);
        arriba.renderOrder = 2;
        terreno.add(arriba);
        partes.enfriamiento.push(arriba);
        // malecón
        const malecon = caja(X1 - X0, 0.34, 0.12, M.concreto);
        malecon.position.set(0, -0.34, COSTA_Z - 0.04);
        terreno.add(malecon);
        // rocas que protegen la toma de agua: dos brazos abiertos hacia el mar
        const brazos = [];
        for (const [s, x0] of [[-1, 0.55], [1, 2.35]]) for (let i = 0; i < (movil ? 16 : 26); i++) { const k = i / 25; brazos.push([x0 + s * Math.sin(k * 1.1) * 0.5 - s * k * 0.5, lerp(COSTA_Z + 0.03, 3.25, k), 0.08 + azar(i, s + 7) * 0.09]); }
        const rocas = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), M.roca, brazos.length);
        const m4 = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        brazos.forEach(([x, z, r], i) => { q.setFromEuler(new THREE.Euler(azar(i, 3) * 3, azar(i, 4) * 3, 0)); rocas.setMatrixAt(i, m4.compose(new THREE.Vector3(x, MAR_Y + r * 0.2, z), q, new THREE.Vector3(r, r, r))); });
        rocas.castShadow = true;
        terreno.add(rocas);
        partes.enfriamiento.push(rocas);
        rotular(terreno, 'Golfo de México', -3.9, -0.5, Z1 + 0.01, 'rgba(255,255,255,0.92)', 2.3);
        // losas y un camino
        const losa = (x0, x1, z0, z1, h = 0.03) => {
            const l = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, h, z1 - z0), M.losa);
            l.position.set((x0 + x1) / 2, h / 2, (z0 + z1) / 2);
            l.receiveShadow = true;
            terreno.add(l);
        };
        losa(-5.25, 4.95, -2.15, 1.75);
        losa(4.85, 7, -1.3, 0.75);
        losa(-4.9, -2.5, -3.3, -2.1);
        losa(SECO.x[0], SECO.x[1], SECO.z[0], SECO.z[1]);
        losa(-1.4, -0.2, -3.2, -2.1);
        losa(-5.35, -5.2, -2, 1.5, 0.02);
    }

    // --------- edificio del reactor
    const pisoRecarga = 3.75;
    const [EX0, EX1] = EDIFICIO.x;
    const [EZ0, EZ1] = EDIFICIO.z;
    const EH = EDIFICIO.h;
    const abreEdificio = ['reaccion', 'barras', 'vapor', 'contencion', 'emergencia', 'residuos', 'recargaV', 'desarmeV'];
    {
        const c = cub('edificio', abreEdificio);
        const g = unidad('contencion', 0, 0, gBWR);
        const pared = (w, d, x, z, dir) => { const m = caja(w, EH, d, c); m.position.set(x, 0, z); g.add(mover(m, dir)); return m; };
        pared(EX1 - EX0, 0.05, (EX0 + EX1) / 2, EZ0, [0, 0, -1.6]);
        pared(EX1 - EX0, 0.05, (EX0 + EX1) / 2, EZ1, [0, 0, 1.6]);
        pared(0.05, EZ1 - EZ0, EX0, (EZ0 + EZ1) / 2, [-1.5, 0, 0]);
        pared(0.05, EZ1 - EZ0, EX1, (EZ0 + EZ1) / 2, [1.5, 0, 0]);
        const techo = caja(EX1 - EX0 + 0.14, 0.09, EZ1 - EZ0 + 0.14, c);
        techo.position.set((EX0 + EX1) / 2, EH, (EZ0 + EZ1) / 2);
        g.add(mover(techo, [0, 3, 0]));
        // franja y ventanas: se apagan cuando la pared se vuelve vidrio
        enCubierta.edificio = [];
        const franja = caja(EX1 - EX0, 0.07, 0.012, M.guinda);
        franja.position.set((EX0 + EX1) / 2, 4.62, EZ1 + 0.03);
        g.add(franja);
        enCubierta.edificio.push(franja);
        for (let i = 0; i < 5; i++) {
            const v = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.012), M.ventana);
            v.position.set(lerp(EX0 + 0.45, EX1 - 0.45, i / 4), 4.3, EZ1 + 0.03);
            g.add(v);
            enCubierta.edificio.push(v);
        }
        const puerta = caja(0.6, 0.72, 0.012, M.grafito);
        puerta.position.set(EX0 + 0.75, 0, EZ1 + 0.03);
        g.add(puerta);
        enCubierta.edificio.push(puerta);
        for (const y of [1.45, 2.85]) {
            const r = caja(EX1 - EX0, 0.012, 0.012, M.grafito);
            r.position.set((EX0 + EX1) / 2, y, EZ1 + 0.03);
            g.add(r);
            enCubierta.edificio.push(r);
        }
        // piso de recarga, con el hueco sobre la contención
        const piso = new THREE.Shape();
        piso.moveTo(EX0, EZ0); piso.lineTo(EX1, EZ0); piso.lineTo(EX1, EZ1); piso.lineTo(EX0, EZ1); piso.closePath();
        const hueco = new THREE.Path();
        hueco.absarc(RX.x, RX.z, 0.82, 0, PI * 2, true);
        piso.holes.push(hueco);
        const alb = new THREE.Path();
        alb.moveTo(-4.95, -1.1); alb.lineTo(-4.95, 0.5); alb.lineTo(-4.33, 0.5); alb.lineTo(-4.33, -1.1); alb.closePath();
        piso.holes.push(alb);
        const pisoM = new THREE.Mesh(new THREE.ExtrudeGeometry(piso, { depth: 0.07, bevelEnabled: false }).rotateX(PI / 2), M.concreto);
        pisoM.position.y = pisoRecarga;
        pisoM.receiveShadow = true;
        g.add(mover(pisoM, [0, 2.4, 0]));
        // grúa puente: mueve los ensambles en la recarga
        const grua = new THREE.Group();
        grua.position.y = 4.78;
        for (const x of [-0.08, 0.08]) grua.add(en(caja(0.05, 0.1, EZ1 - EZ0 - 0.1, M.grafito), x, 0, (EZ0 + EZ1) / 2));
        const carro = caja(0.26, 0.08, 0.3, M.guinda);
        carro.position.set(0, 0.03, RX.z);
        grua.add(carro);
        const mastil = cil(0.012, 1, M.acero, 0.012, 6);
        mastil.position.set(0, -1, RX.z);
        grua.add(mastil);
        const colgado = caja(0.05, 0.42, 0.05, M.zirconio);
        colgado.position.set(0, -1.42, RX.z);
        grua.add(colgado);
        grua.position.x = RX.x;
        g.add(mover(grua, [0, 2.9, 0]));
        partes.residuos.push(grua);
        enCubierta.grua = { grua, mastil, colgado };
    }

    // --------- contención: la alberca de supresión abajo y el pozo seco arriba (Mark II)
    {
        const g = unidad('contencion', RX.x, RX.z, gBWR);
        const conc = cub('contencionD', ['reaccion', 'barras', 'vapor'], { color: '#dcd9d2' });
        const pool = sombra(new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.85, 40, 1, true).translate(0, 0.525, 0), cub('albercaD', ['contencion', 'emergencia', 'reaccion', 'barras', 'vapor', 'desarmeV'], { color: '#dcd9d2' })));
        g.add(pool);
        g.add(en(new THREE.Mesh(new THREE.CylinderGeometry(1.28, 1.28, 0.1, 40), M.concreto), 0, 0.05, 0));
        // el agua de la alberca, en un anillo
        const anillo = new THREE.Mesh(new THREE.LatheGeometry([new THREE.Vector2(0.38, 0.1), new THREE.Vector2(1.22, 0.1), new THREE.Vector2(1.22, 0.74), new THREE.Vector2(0.38, 0.74), new THREE.Vector2(0.38, 0.1)], 40), M.aguaAlberca);
        anillo.renderOrder = 1;
        g.add(anillo);
        const losaD = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.1, 40), M.concreto);
        losaD.position.y = 1;
        g.add(losaD);
        // tubos que bajan el vapor al agua si algo se rompe
        for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2 + 0.2; g.add(entre([Math.cos(a) * 0.82, 1.02, Math.sin(a) * 0.82], [Math.cos(a) * 0.82, 0.42, Math.sin(a) * 0.82], 0.022, M.acero)); }
        // pozo seco: un cono truncado de concreto
        const pozo = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.25, 2.3, 40, 1, true).translate(0, 2.2, 0), conc));
        g.add(mover(pozo, [0, 0, 2.2]));
        const collar = aro(0.81, 0.016, M.acero);
        collar.position.y = 3.35;
        g.add(mover(collar, [0, 0, 2.2]));
        // la tapa de acero: se quita en cada recarga
        const tapa = new THREE.Mesh(new THREE.SphereGeometry(0.8, 36, 14, 0, PI * 2, 0, PI / 2), M.guinda);
        tapa.castShadow = true;
        tapa.scale.y = 0.55;
        tapa.position.y = 3.35;
        const tapaG = new THREE.Group();
        tapaG.add(tapa);
        g.add(mover(tapaG, [0, 3.2, 0]));
        enCubierta.tapaPozo = tapaG;
        cubiertas.tapaD = { mat: tapa.material = M.guinda.clone(), abre: ['reaccion', 'barras', 'vapor'] };
        tapa.material.transparent = true;
        // el soporte de la vasija: un cilindro abierto al centro
        const ped = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.1, 28, 1, true).translate(0, 0.65, 0), cub('pedestal', ['barras'], { color: '#c4c1ba' })));
        g.add(ped);
    }

    // --------- vasija: casco de acero, núcleo, separadores y secadores
    const nucleo = rejillaNucleo();
    let frente;
    let gBarrasMov;
    let neutrones;
    const [NY0, NY1] = VASIJA.nucleo;
    {
        const g = unidad('vapor', RX.x, RX.z, gBWR);
        partes.reaccion.push(g);
        const casco = cub('casco', ['reaccion', 'barras', 'vapor'], { color: '#b9bdc4', metal: 0.75 });
        const r = VASIJA.r;
        // el cuerpo abierto arriba, y la tapa aparte
        const perfil = [];
        const tapaR = r * 0.55;
        for (let i = 0; i <= 8; i++) { const a = (i / 8) * (PI / 2); perfil.push(new THREE.Vector2(Math.sin(a) * r, VASIJA.y0 + tapaR - Math.cos(a) * tapaR)); }
        perfil.push(new THREE.Vector2(r, 3.37));
        const cuerpo = sombra(new THREE.Mesh(new THREE.LatheGeometry(perfil, 36), casco));
        g.add(mover(cuerpo, [0, 0, 3.4]));
        const brida = aro(r + 0.015, 0.03, M.grafito);
        brida.position.y = 3.37;
        g.add(mover(brida, [0, 0, 3.4]));
        const tapa = new THREE.Mesh(new THREE.SphereGeometry(r, 36, 12, 0, PI * 2, 0, PI / 2), casco);
        tapa.castShadow = true;
        tapa.scale.y = 0.6;
        tapa.position.y = 3.37;
        const tapaG = new THREE.Group();
        tapaG.add(tapa);
        g.add(mover(tapaG, [0, 4, 0]));
        enCubierta.tapaVasija = tapaG;
        // agua por dentro, hasta arriba de los separadores
        const agua = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.02, r - 0.02, 3 - 1.28, 32).translate(0, (3 + 1.28) / 2, 0), M.aguaRx);
        agua.renderOrder = 1;
        g.add(agua);
        // envolvente del núcleo y bombas de chorro alrededor: veinte, en dos grupos de diez
        const env = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 1.04, 32, 1, true).translate(0, 2.2, 0), M.tuberia);
        env.renderOrder = 1;
        g.add(env);
        const chorro = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.014, 0.014, 0.9, 6).translate(0, 0.45, 0), M.acero, 20);
        const m4 = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        for (let i = 0; i < 20; i++) { const a = (i / 20) * PI * 2 + 0.16; chorro.setMatrixAt(i, m4.setPosition(Math.cos(a) * 0.49, 1.72, Math.sin(a) * 0.49)); }
        g.add(chorro);
        g.add(en(new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.03, 32), M.acero), 0, NY0 - 0.02, 0));
        g.add(en(aro(0.42, 0.012, M.acero), 0, NY1 + 0.005, 0));
        // el núcleo: los 444 ensambles reales
        const H = NY1 - NY0;
        const lado = nucleo.paso * 0.9;
        const geoE = new THREE.BoxGeometry(lado, H, lado).translate(0, H / 2, 0);
        const atras = nucleo.ensambles.filter(([, z]) => z <= 0);
        const delante = nucleo.ensambles.filter(([, z]) => z > 0);
        const instancias = (lista, material) => {
            const im = new THREE.InstancedMesh(geoE, material, lista.length);
            lista.forEach(([x, z], i) => im.setMatrixAt(i, m4.setPosition(x, 0, z)));
            im.castShadow = false;
            return im;
        };
        const gN = new THREE.Group();
        gN.position.y = NY0;
        gN.add(instancias(atras, M.ensamble));
        frente = new THREE.Group();
        frente.add(instancias(delante, M.ensamble));
        gN.add(frente);
        g.add(gN);
        // la luz azul del agua sobre el núcleo: radiación de Cherenkov
        const azul = new THREE.Mesh(new THREE.CylinderGeometry(0.415, 0.415, H + 0.02, 32, 1, true).translate(0, (NY0 + NY1) / 2, 0), M.cherenkov);
        azul.renderOrder = 3;
        g.add(azul);
        brillo(g, 0, (NY0 + NY1) / 2, 0.15, 1.3, '#4fb6ff', 'reactor', 0.18);
        luz(g, 0, (NY0 + NY1) / 2, 0.7, '#6fc2ff', 4, 'reactor', 3);
        // barras de control: las 109, en cruz; suben y bajan juntas
        const blade = 0.5;
        const t = nucleo.paso * 1.7;
        const geoB = mergeGeometries([
            new THREE.BoxGeometry(t, blade, 0.006).translate(0, blade / 2, 0),
            new THREE.BoxGeometry(0.006, blade, t).translate(0, blade / 2, 0),
            new THREE.CylinderGeometry(0.004, 0.004, 0.55, 5).translate(0, -0.275, 0),
        ]);
        const barras = new THREE.InstancedMesh(geoB, M.guinda, nucleo.barras.length);
        nucleo.barras.forEach(([x, z], i) => barras.setMatrixAt(i, m4.setPosition(x, 0, z)));
        gBarrasMov = new THREE.Group();
        gBarrasMov.position.y = NY0 - blade;
        gBarrasMov.add(barras);
        g.add(gBarrasMov);
        partes.barras.push(gBarrasMov);
        // sus mecanismos, abajo de la vasija
        const crd = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0085, 0.0085, 0.56, 5).translate(0, 0.28, 0), M.acero, nucleo.barras.length);
        nucleo.barras.forEach(([x, z], i) => crd.setMatrixAt(i, m4.setPosition(x, 0.62, z)));
        const gCrd = new THREE.Group();
        gCrd.add(crd);
        g.add(gCrd);
        partes.barras.push(gCrd);
        // separadores de humedad y secadores
        const sep = [];
        for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) if (Math.hypot(i, j) <= 4.2) sep.push([i * 0.082, j * 0.082]);
        const separadores = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.028, 0.028, 0.34, 8).translate(0, 0.17, 0), M.acero, sep.length);
        sep.forEach(([x, z], i) => separadores.setMatrixAt(i, m4.setPosition(x, 2.72, z)));
        g.add(separadores);
        g.add(en(new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.02, 32), M.acero), 0, 2.72, 0));
        const secadores = new THREE.Group();
        for (const [x, w] of [[-0.3, 0.14], [-0.1, 0.16], [0.1, 0.16], [0.3, 0.14]]) {
            const largo = 2 * Math.sqrt(Math.max(0.01, 0.48 ** 2 - (Math.abs(x) + 0.05) ** 2));
            for (const s of [-1, 1]) {
                const b = new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, 0.22, largo), M.zirconio);
                b.position.set(x + s * w * 0.13, 3.2, 0);
                b.rotation.z = s * 0.34;
                secadores.add(b);
            }
        }
        g.add(mover(secadores, [0, 2.6, 0]));
        // lo que hierve: burbujas que suben del núcleo, y agua que baja por la orilla hacia las bombas de chorro
        const nB = movil ? 44 : 80;
        for (let i = 0; i < nB; i++) {
            const a = azar(i, 21) * PI * 2;
            const rr = Math.sqrt(azar(i, 22)) * 0.38;
            gota('vapor', 'hervor', RX.x + Math.cos(a) * rr, RX.z + Math.sin(a) * rr, lerp(NY0 + 0.3, NY1, azar(i, 23) * 0.7), 3.02, 0.55, 0.0125, 0.012, true);
        }
        for (let i = 0; i < 26; i++) {
            const a = azar(i, 24) * PI * 2;
            gota('vapor', 'hervor', RX.x + Math.cos(a) * azar(i, 25) * 0.42, RX.z + Math.sin(a) * azar(i, 25) * 0.42, 3.06, 3.42, 0.9, 0.018, 0.02, true);
        }
        for (let i = 0; i < 24; i++) {
            const a = azar(i, 26) * PI * 2;
            gota('agua', 'recirc', RX.x + Math.cos(a) * 0.475, RX.z + Math.sin(a) * 0.475, 2.95, 1.75, 0.5, 0.013, 0.004, true);
        }
        // neutrones: los que siguen la reacción en cadena
        const nN = movil ? 36 : 70;
        neutrones = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 5), M.neutron, nN);
        neutrones.frustumCulled = false;
        neutrones.renderOrder = 4;
        g.add(neutrones);
        // bombas de recirculación
        for (const x of [0.85, -0.85]) {
            const b = new THREE.Group();
            b.position.set(x, 0, 0);
            b.add(en(cil(0.12, 0.2, M.grafito), 0, 1.1, 0), en(cil(0.085, 0.24, M.azul), 0, 1.3, 0));
            g.add(b);
        }
    }

    // --------- alberca de combustible, en el piso de recarga
    {
        const g = unidad('residuos', 0, 0, gBWR);
        const c = M.concreto;
        const [x0, x1, z0, z1, y0, y1] = [-4.95, -4.33, -1.1, 0.5, 2.38, pisoRecarga];
        const borde = (w, h, d, x, y, z) => g.add(en(caja(w, h, d, c), x, y, z));
        borde(x1 - x0 + 0.06, 0.04, z1 - z0 + 0.06, (x0 + x1) / 2, y0 - 0.04, (z0 + z1) / 2);
        const cris = cub('albercaPared', ['residuos', 'recargaV'], { color: '#c9c6bf' });
        for (const [w, d, x, z] of [[0.02, z1 - z0, x1, (z0 + z1) / 2], [x1 - x0, 0.02, (x0 + x1) / 2, z1], [x1 - x0, 0.02, (x0 + x1) / 2, z0]]) g.add(en(caja(w, y1 - y0, d, cris), x, y0, z));
        const agua = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 - 0.02, y1 - y0 - 0.1, z1 - z0 - 0.02).translate((x0 + x1) / 2, (y0 + y1 - 0.1) / 2, (z0 + z1) / 2), M.aguaAlberca);
        agua.renderOrder = 1;
        g.add(agua);
        // los ensambles usados, bajo el agua, y su luz azul
        const ens = [];
        for (let i = 0; i < 7; i++) for (let j = 0; j < 22; j++) ens.push([x0 + 0.06 + i * 0.075, z0 + 0.06 + j * 0.068]);
        const rack = new THREE.InstancedMesh(new THREE.BoxGeometry(0.055, 0.55, 0.05).translate(0, 0.275, 0), M.ensamble, ens.length);
        const m4 = new THREE.Matrix4();
        ens.forEach(([x, z], i) => rack.setMatrixAt(i, m4.setPosition(x, y0, z)));
        g.add(rack);
        brillo(g, (x0 + x1) / 2, y0 + 0.3, 0.6, 0.9, '#58c3f0', null, 0.3);
    }

    // --------- la muestra: una pastilla, una barra y un ensamble, mucho más grandes que en el núcleo
    {
        const g = unidad('combustible', MUESTRA.x, MUESTRA.z);
        g.add(caja(1.3, 0.05, 0.9, M.grafito), en(caja(1.14, 0.1, 0.74, M.marfil), 0, 0.05, 0));
        // ensamble: diez por diez, con su canal cortado por delante
        const e = new THREE.Group();
        e.position.set(-0.32, 0.15, 0);
        const p = 0.042;
        const rods = [];
        for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) { if (i >= 4 && i <= 5 && j >= 4 && j <= 5) continue; rods.push([(i - 4.5) * p, (j - 4.5) * p]); }
        const barras = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.016, 0.016, 1.6, 8).translate(0, 0.86, 0), M.zirconio, rods.length);
        const m4 = new THREE.Matrix4();
        rods.forEach(([x, z], i) => barras.setMatrixAt(i, m4.setPosition(x, 0, z)));
        barras.castShadow = true;
        e.add(barras);
        // dos barras de agua al centro
        e.add(en(cil(0.04, 1.6, M.tuberia), 0, 0.06, 0));
        // rejillas que separan las barras
        for (const y of [0.32, 0.62, 0.92, 1.22, 1.52]) e.add(en(caja(p * 10.3, 0.03, p * 10.3, M.acero), 0, y, 0));
        e.add(en(caja(p * 10.7, 0.1, p * 10.7, M.grafito), 0, -0.03, 0), en(caja(p * 10.7, 0.06, p * 10.7, M.grafito), 0, 1.68, 0));
        e.add(en(new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.014, 8, 20, PI), M.acero), 0, 1.74, 0));
        // el canal de metal, solo atrás y a un lado
        const canal = new THREE.MeshPhysicalMaterial({ color: '#9fa5ae', roughness: 0.35, metalness: 0.8, transparent: true, opacity: 0.55, side: THREE.DoubleSide, envMapIntensity: 1 });
        e.add(en(caja(p * 10.7, 1.62, 0.006, canal), 0, 0.04, -p * 5.35), en(caja(0.006, 1.62, p * 10.7, canal), -p * 5.35, 0.04, 0));
        g.add(e);
        // barra abierta: las pastillas se ven apiladas
        const b = new THREE.Group();
        b.position.set(0.14, 0.15, 0.08);
        const tubo = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 1.58, 18, 1, true, -0.4, PI * 1.25).translate(0, 0.84, 0), new THREE.MeshPhysicalMaterial({ color: '#c8ccd4', roughness: 0.3, metalness: 0.75, side: THREE.DoubleSide, envMapIntensity: 1 }));
        tubo.castShadow = true;
        b.add(tubo);
        const nP = 22;
        const past = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.036, 0.036, 0.058, 18), M.pastilla, nP);
        for (let i = 0; i < nP; i++) past.setMatrixAt(i, m4.setPosition(0, 0.085 + i * 0.062, 0));
        past.castShadow = true;
        b.add(past);
        b.add(en(cil(0.04, 0.05, M.acero), 0, 0, 0), en(cil(0.044, 0.05, M.acero), 0, 1.6, 0));
        g.add(b);
        // pastillas sueltas, grandes, junto a su escala
        for (const [x, y, z] of [[0.33, 0.15, 0.1], [0.46, 0.15, -0.12], [0.33, 0.15, -0.16]]) { const pa = cil(0.085, 0.15, M.pastilla, 0.085, 28); pa.position.set(x, y, z); g.add(pa); }
        const sobre = cil(0.085, 0.15, M.pastilla, 0.085, 28);
        sobre.position.set(0.33, 0.3, -0.16);
        g.add(sobre);
        const grupoR = new THREE.Group();
        grupoR.position.z = 0.455;
        const color = 'rgba(30,26,30,0.92)';
        rotular(grupoR, 'Ensamble', -0.32, 0.1, -0.08, color, 0.5);
        rotular(grupoR, 'Barra', 0.1, 0.1, -0.08, color, 0.4);
        rotular(grupoR, 'Pastillas', 0.42, 0.1, -0.08, color, 0.46);
        g.add(grupoR);
    }

    // --------- nave de turbinas
    const [NX0, NX1] = NAVE.x;
    const [NZ0, NZ1] = NAVE.z;
    const NH = NAVE.h;
    const abreNave = ['turbina', 'generador', 'condensador', 'desarmeV'];
    {
        const casa = cub('nave', abreNave);
        const g = unidad('turbina');
        const pared = (w, d, x, z, dir) => { const m = caja(w, NH, d, casa); m.position.set(x, 0, z); g.add(mover(m, dir)); return m; };
        pared(NX1 - NX0, 0.04, (NX0 + NX1) / 2, NZ0, [0, 0, -1.3]);
        pared(NX1 - NX0, 0.04, (NX0 + NX1) / 2, NZ1, [0, 0, 1.3]);
        pared(0.04, NZ1 - NZ0, NX0, (NZ0 + NZ1) / 2, [-0.9, 0, 0]);
        pared(0.04, NZ1 - NZ0, NX1, (NZ0 + NZ1) / 2, [1.2, 0, 0]);
        const techo = caja(NX1 - NX0 + 0.16, 0.07, NZ1 - NZ0 + 0.16, casa);
        techo.position.set((NX0 + NX1) / 2, NH, (NZ0 + NZ1) / 2);
        g.add(mover(techo, [0, 2.8, 0]));
        const cumbre = caja(NX1 - NX0 - 0.6, 0.1, 0.55, casa);
        cumbre.position.set((NX0 + NX1) / 2, NH + 0.07, (NZ0 + NZ1) / 2);
        g.add(mover(cumbre, [0, 2.8, 0]));
        enCubierta.nave = [];
        for (let i = 0; i < 9; i++) {
            const v = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.012), M.ventana);
            v.position.set(lerp(NX0 + 0.4, NX1 - 0.4, i / 8), 2.36, NZ1 + 0.024);
            g.add(v);
            enCubierta.nave.push(v);
        }
        const puerta = caja(0.6, 0.86, 0.012, M.grafito);
        puerta.position.set(NX1 - 0.65, 0, NZ1 + 0.024);
        g.add(puerta);
        enCubierta.nave.push(puerta);
        const franja = caja(NX1 - NX0, 0.05, 0.012, M.guinda);
        franja.position.set((NX0 + NX1) / 2, 2.78, NZ1 + 0.024);
        g.add(franja);
        enCubierta.nave.push(franja);
        // la mesa de la turbina
        const mesa = caja(NX1 - NX0 - 0.15, 0.08, NZ1 - NZ0 - 0.2, M.losa);
        mesa.position.set((NX0 + NX1) / 2, 1.2, (NZ0 + NZ1) / 2);
        g.add(mover(mesa, [0, 0.9, 0]));
        for (const x of [-0.8, 0.45, 3.3, 4.55]) for (const z of [-1.2, 0.95]) g.add(en(caja(0.09, 1.2, 0.09, M.losa), x, 0, z));
        // muro de concreto: el vapor de este reactor pasa directo y hay que blindar la turbina
        const blind = cub('blindaje', abreNave, { color: '#c9c6bf' });
        { const m = caja(3.9, 1.22, 0.06, blind); m.position.set(1.32, 1.28, 1); g.add(mover(m, [0, 0, 1.5])); }
        { const m = caja(3.9, 1.22, 0.06, M.concreto); m.position.set(1.32, 1.28, -1.25); g.add(mover(m, [0, 0, -1.5])); }
    }

    // --------- turbinas: una de alta presión y dos de baja, sobre un solo eje
    const [EJ, TZ] = [EJE.y, EJE.z];
    const giroVapor = e => 12 * e.activo.turbina;
    const carcasas = [
        { c: -0.05, media: 0.5, rIni: 0.26, rFin: 0.42, etapas: 5, largoIni: 0.04, largoFin: 0.1, nombre: 'carcasaHP' },
        { c: 1.3, media: 0.55, rIni: 0.36, rFin: 0.62, etapas: 6, largoIni: 0.06, largoFin: 0.26, nombre: 'carcasaL1' },
        { c: 2.55, media: 0.55, rIni: 0.36, rFin: 0.62, etapas: 6, largoIni: 0.06, largoFin: 0.26, nombre: 'carcasaL2' },
    ];
    {
        const g = unidad('turbina', 0, TZ);
        const rotor = new THREE.Group();
        rotor.position.set(0, EJ, 0);
        rotor.add(en(cilX(0.05, 5.4, M.acero), 1.97, 0, 0));
        const total = carcasas.reduce((n, c) => n + c.etapas * 2 * 22, 0);
        const alabes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.018, 1, 0.042), M.marfil, total);
        const m4 = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        const ejeX = new THREE.Vector3(1, 0, 0);
        let k = 0;
        for (const c of carcasas) {
            const mat = cub(c.nombre, ['turbina']);
            // el vapor entra por el centro y se abre hacia los dos lados
            const perfil = [[-c.media, 0.05], [-c.media, c.rFin - 0.08], [-c.media * 0.85, c.rFin], [-c.media * 0.2, c.rIni + 0.04], [0, c.rIni + 0.08], [c.media * 0.2, c.rIni + 0.04], [c.media * 0.85, c.rFin], [c.media, c.rFin - 0.08], [c.media, 0.05]];
            const arriba = sombra(new THREE.Mesh(mediaCarcasa(perfil, true), mat));
            arriba.position.set(c.c, EJ, 0);
            g.add(mover(arriba, [0, 1.25, 0]));
            const abajo = sombra(new THREE.Mesh(mediaCarcasa(perfil, false), mat));
            abajo.position.set(c.c, EJ, 0);
            g.add(abajo);
            for (const s of [-1, 1]) {
                const b = caja(c.media * 2, 0.024, 0.05, M.grafito);
                b.position.set(c.c, EJ - 0.012, s * (c.rFin - 0.03));
                g.add(mover(b, [0, 1.25, 0]));
            }
            g.add(en(caja(0.1, EJ - 1.28 - 0.1, 0.22, M.grafito), c.c - c.media - 0.05, 1.28, 0), en(caja(0.1, EJ - 1.28 - 0.1, 0.22, M.grafito), c.c + c.media + 0.05, 1.28, 0));
            for (const s of [-1, 1]) {
                for (let e = 0; e < c.etapas; e++) {
                    const x = c.c + s * (0.06 + (e * (c.media - 0.12)) / (c.etapas - 1));
                    const raizR = 0.09 + e * 0.012;
                    const largo = lerp(c.largoIni, c.largoFin, e / (c.etapas - 1));
                    const disco = cilX(raizR, 0.025, M.acero);
                    disco.position.x = x;
                    rotor.add(disco);
                    for (let i = 0; i < 22; i++) {
                        const a = (i / 22) * PI * 2;
                        q.setFromAxisAngle(ejeX, a);
                        const r = raizR + largo / 2;
                        m4.compose(new THREE.Vector3(x, Math.cos(a) * r, Math.sin(a) * r), q, new THREE.Vector3(1, largo, 1));
                        alabes.setMatrixAt(k++, m4);
                    }
                }
            }
        }
        alabes.castShadow = true;
        rotor.add(alabes);
        g.add(mover(rotor, [0, 0.55, 0]));
        giran.push({ obj: rotor, eje: 'x', vel: giroVapor });
        // separador y recalentador: seca el vapor entre la turbina de alta y las de baja
        const msr = new THREE.Group();
        msr.position.set(1.55, 1.75, 0.72 - TZ);
        msr.add(cilX(0.2, 2.7, M.marfil, 24));
        for (const s of [-1, 1]) msr.add(en(new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 10).scale(0.5, 1, 1), M.marfil), s * 1.35, 0, 0));
        for (const x of [-0.9, 0.9]) msr.add(en(caja(0.12, 0.42, 0.28, M.grafito), x, -0.42, 0));
        g.add(mover(msr, [0, 1.6, 0.9]));
    }

    // --------- generador: cuatro polos de cobre dentro de las bobinas
    {
        const g = unidad('generador', 3.8, TZ);
        const c = cub('estator', ['generador']);
        const carcasa = cilX(0.42, 1, c, 36);
        carcasa.position.y = EJ;
        g.add(mover(carcasa, [0, 1.3, 0]));
        for (const x of [-0.5, 0.5]) {
            const b = aroX(0.42, 0.026, M.grafito);
            b.position.set(x, EJ, 0);
            g.add(mover(b, [0, 1.3, 0]));
        }
        for (let i = 1; i < 8; i++) {
            const b = aroX(0.425, 0.008, M.acero);
            b.position.set(-0.5 + i * 0.125, EJ, 0);
            g.add(mover(b, [0, 1.3, 0]));
        }
        g.add(en(caja(1, EJ - 1.28 - 0.3, 0.6, M.grafito), 0, 1.28, 0));
        for (let i = 5; i < 12; i++) {
            const a = (i / 16) * PI * 2;
            const b = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.05, 0.08), M.cobre);
            b.position.set(0, EJ + Math.cos(a) * 0.33, Math.sin(a) * 0.33);
            b.rotation.x = a;
            g.add(b);
        }
        const rotor = new THREE.Group();
        rotor.position.set(0, EJ, 0);
        rotor.add(cilX(0.12, 0.84, M.acero));
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * PI * 2;
            const polo = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.14), M.cobre);
            polo.position.set(0, Math.cos(a) * 0.19, Math.sin(a) * 0.19);
            polo.rotation.x = a;
            rotor.add(polo);
        }
        rotor.add(en(aroX(0.24, 0.012, M.neonElec), -0.42, 0, 0), en(aroX(0.24, 0.012, M.neonElec), 0.42, 0, 0));
        g.add(mover(rotor, [0, 0.6, 0]));
        giran.push({ obj: rotor, eje: 'x', vel: giroVapor });
        const exc = cilX(0.16, 0.2, M.marfil);
        exc.position.set(0.62, EJ, 0);
        g.add(exc);
        brillo(g, 0, EJ, 0.45, 0.8, FLUIDOS.elec.color, 'turbina', 0.32);
    }

    // --------- condensador: tubos con agua de mar y el vapor que cae hecho agua
    {
        const g = unidad('condensador', 0, 0);
        const c = cub('conchaC', ['condensador', 'enfriamiento'], { color: '#b5b8bf', metal: 0.5 });
        const [x0, x1, y0, y1, z0, z1] = EQUIPOS.condensador;
        const cuerpo = caja(x1 - x0, y1 - y0, z1 - z0, c);
        cuerpo.position.set((x0 + x1) / 2, y0, (z0 + z1) / 2);
        g.add(mover(cuerpo, [0, 0, 1.45]));
        // cajas de agua de mar por delante
        const caj = caja(x1 - x0 - 0.1, 0.85, 0.08, M.grafito);
        caj.position.set((x0 + x1) / 2, 0.14, z1 + 0.03);
        caj.material = cub('cajaAgua', ['condensador', 'enfriamiento'], { color: FLUIDOS.mar.color });
        g.add(mover(caj, [0, 0, 1.45]));
        // los tubos: miles en la realidad, aquí unos cuantos
        const tubos = [];
        for (let i = 0; i < 32; i++) for (let j = 0; j < 7; j++) tubos.push([lerp(x0 + 0.1, x1 - 0.1, i / 31), lerp(0.46, 1.02, j / 6)]);
        const m4 = new THREE.Matrix4();
        const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.014, 0.014, z1 - z0 - 0.04, 6).rotateX(PI / 2), M.fluido.mar, tubos.length);
        tubos.forEach(([x, y], i) => im.setMatrixAt(i, m4.setPosition(x, y, (z0 + z1) / 2)));
        g.add(im);
        const charco = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 - 0.02, 0.18, z1 - z0 - 0.02).translate((x0 + x1) / 2, 0.21, (z0 + z1) / 2), M.aguaRx);
        g.add(charco);
        for (let i = 0; i < 46; i++) gota('agua', 'turbina', lerp(x0 + 0.1, x1 - 0.1, azar(i, 41)), lerp(z0 + 0.1, z1 - 0.1, azar(i, 42)), 1.04, 0.3, 1.05, 0.014, 0.008);
        // calentadores de agua y bombas
        const calent = new THREE.Group();
        calent.position.set(-0.42, 0.4, 0.72);
        calent.add(cilX(0.18, 1.54, M.marfil, 22));
        for (const s of [-1, 1]) calent.add(en(new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 10).scale(0.45, 1, 1), M.marfil), s * 0.77, 0, 0));
        for (const x of [-0.5, 0.5]) calent.add(en(caja(0.1, 0.22, 0.24, M.grafito), x, -0.4, 0));
        g.add(mover(calent, [0, 0, 1.2]));
        const bomba = new THREE.Group();
        bomba.position.set(-1.1, 0.04, 0.2);
        bomba.add(en(caja(0.38, 0.16, 0.34, M.grafito), 0, 0, 0), en(cil(0.11, 0.24, M.azul), 0, 0.16, 0));
        g.add(bomba);
        const cond = new THREE.Group();
        cond.position.set(0.3, 0.04, TZ);
        cond.add(cil(0.08, 0.16, M.grafito), en(cil(0.05, 0.16, M.azul), 0, 0.16, 0));
        g.add(cond);
    }

    // --------- agua de mar: casa de bombas, canal de descarga y la mancha tibia en el mar
    let pluma;
    {
        const g = unidad('enfriamiento', 0, 0);
        const c = cub('casaMar', ['enfriamiento', 'condensador', 'desarmeV'], { color: '#dcd9d2' });
        const [x0, x1, y0, y1, z0, z1] = EQUIPOS.bombasMar;
        const casa = caja(x1 - x0, y1 - y0, z1 - z0, c);
        casa.position.set((x0 + x1) / 2, y0, (z0 + z1) / 2);
        g.add(mover(casa, [0, 1.6, 0]));
        for (const x of [1.45, 1.9, 2.35]) {
            g.add(en(cil(0.13, 0.3, M.grafito), x, 0.02, 1.56), en(cil(0.09, 0.28, M.fluido.mar), x, 0.32, 1.56));
            giran.push({ obj: g.children.at(-1), eje: 'y', vel: e => 4 * e.activo.mar });
        }
        // canal de descarga: abierto, hasta el mar
        const pts = [[3, 1.5], [5.9, 1.5]];
        for (const s of [-0.13, 0.13]) g.add(en(caja(pts[1][0] - pts[0][0], 0.12, 0.03, M.concreto), (pts[0][0] + pts[1][0]) / 2, 0, 1.5 + s));
        const agua = new THREE.Mesh(new THREE.BoxGeometry(pts[1][0] - pts[0][0], 0.02, 0.24), M.canal);
        agua.position.set((pts[0][0] + pts[1][0]) / 2, 0.075, 1.5);
        agua.renderOrder = 1;
        g.add(agua);
        pluma = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 1.9).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ map: M.brillo, color: FLUIDOS.marCaliente.color, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }));
        pluma.position.set(6, MAR_Y + 0.012, 2.85);
        pluma.renderOrder = 3;
        g.add(pluma);
    }

    // --------- emergencia: generadores diésel, tanque de agua y los equipos que no dependen de la red
    {
        const g = unidad('emergencia');
        const [x0, x1, y0, y1, z0, z1] = EQUIPOS.diesel;
        const casa = caja(x1 - x0, y1 - y0, z1 - z0, M.marfil);
        casa.position.set((x0 + x1) / 2, y0, (z0 + z1) / 2);
        g.add(mover(casa, [0, 1.3, 0]));
        const t = caja(x1 - x0 + 0.08, 0.05, z1 - z0 + 0.08, M.grafito);
        t.position.set((x0 + x1) / 2, y1, (z0 + z1) / 2);
        g.add(mover(t, [0, 1.3, 0]));
        [-0.65, 0, 0.65].forEach((dx, i) => {
            const cx = (x0 + x1) / 2 + dx;
            const puerta = caja(0.36, 0.56, 0.012, M.grafito);
            puerta.position.set(cx, 0, z0 - 0.008);
            g.add(puerta);
            const f = caja(0.5, 0.05, 0.01, M.guinda);
            f.position.set(cx, 0.72, z0 - 0.008);
            g.add(f);
            const chim = cil(0.05, 0.42, M.grafito, 0.04, 12);
            chim.position.set(cx, y1 + 0.03, z0 + 0.2);
            g.add(chim);
            for (let k = 0; k < 4; k++) {
                const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.vaho, color: '#555a60', transparent: true, depthWrite: false, opacity: 0 }));
                s.renderOrder = 5;
                raiz.add(s);
                vahos.push({ s, x: cx, z: z0 + 0.2, u: k / 4, h: azar(k, i + 91), y0: y1 + 0.46 });
            }
        });
        // tanque de agua para emergencias
        const tan = unidad('emergencia', -0.8, -2.6);
        tan.add(cil(0.38, 1, M.marfil, 0.38, 32), en(cil(0.39, 0.03, M.grafito, 0.39, 32), 0, 1, 0), en(aro(0.385, 0.008, M.grafito), 0, 0.5, 0));
        // adentro del edificio: la bomba que mueve el vapor y el intercambiador de calor
        const adentro = unidad('emergencia', 0, 0, gBWR);
        const rc = EQUIPOS.rcic;
        adentro.add(en(caja(rc[1] - rc[0], 0.16, rc[5] - rc[4], M.grafito), (rc[0] + rc[1]) / 2, 0.08, (rc[4] + rc[5]) / 2));
        adentro.add(en(cilX(0.1, 0.34, M.guinda), (rc[0] + rc[1]) / 2, 0.34, (rc[4] + rc[5]) / 2));
        const rh = EQUIPOS.rhr;
        const hx = cil(0.14, 0.46, M.marfil, 0.14, 18);
        hx.position.set((rh[0] + rh[1]) / 2, 0.08, (rh[4] + rh[5]) / 2);
        adentro.add(hx);
        const tb = EQUIPOS.tablero;
        adentro.add(en(caja(tb[1] - tb[0], tb[3] - tb[2], tb[5] - tb[4] - 0.05, M.grafito), (tb[0] + tb[1]) / 2, tb[2], (tb[4] + tb[5]) / 2 + 0.02));
    }

    // --------- combustible en seco: contenedores sobre su losa
    {
        const g = unidad('residuos');
        const [xa, xb] = SECO.x;
        const [za, zb] = SECO.z;
        const c = [];
        for (let i = 0; i < 4; i++) for (let j = 0; j < 5; j++) { if (i === 3 && j > 1) continue; c.push([lerp(xa + 0.28, xb - 0.28, i / 3), lerp(za + 0.25, zb - 0.25, j / 4)]); }
        const cuerpo = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.135, 0.135, 0.56, 24).translate(0, 0.28, 0), M.marfil, c.length);
        const tapa = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.14, 0.14, 0.03, 24).translate(0, 0.575, 0), M.grafito, c.length);
        const m4 = new THREE.Matrix4();
        c.forEach(([x, z], i) => { cuerpo.setMatrixAt(i, m4.setPosition(x, 0.03, z)); tapa.setMatrixAt(i, m4.setPosition(x, 0.03, z)); });
        cuerpo.castShadow = true;
        g.add(cuerpo, tapa);
        // cerca
        const cerca = [];
        for (let i = 0; i <= 9; i++) { const k = i / 9; for (const [x, z] of [[lerp(xa, xb, k), za], [lerp(xa, xb, k), zb], [xa, lerp(za, zb, k)], [xb, lerp(za, zb, k)]]) cerca.push(geoEntre([x, 0, z], [x, 0.3, z], 0.006, 4)); }
        for (const [a, b] of [[[xa, za], [xb, za]], [[xa, zb], [xb, zb]], [[xa, za], [xa, zb]], [[xb, za], [xb, zb]]]) cerca.push(geoEntre([a[0], 0.3, a[1]], [b[0], 0.3, b[1]], 0.005, 4));
        g.add(new THREE.Mesh(mergeGeometries(cerca), M.grafito));
    }

    // --------- subestación: transformador y pórtico de salida
    {
        const g = unidad('subestacion', 5.38, -0.3);
        const c = cub('tanque', ['subestacion'], { color: '#5a5c63', metal: 0.5 });
        const tanque = caja(0.7, 0.86, 1.2, c);
        tanque.position.y = 0.06;
        g.add(mover(tanque, [0, 1.3, 0]));
        const tapa = caja(0.74, 0.04, 1.24, M.grafito);
        tapa.position.y = 0.92;
        g.add(mover(tapa, [0, 1.3, 0]));
        g.add(caja(0.86, 0.06, 1.34, M.losa));
        for (const s of [-1, 1]) {
            for (let i = 0; i < 8; i++) {
                const r = caja(0.1, 0.68, 0.02, M.acero);
                r.position.set(s * 0.42, 0.12, -0.46 + i * 0.132);
                g.add(mover(r, [s * 0.7, 0, 0]));
            }
        }
        g.add(en(caja(0.44, 0.68, 0.1, M.grafito), 0, 0.12, 0));
        for (const z of [-0.36, 0, 0.36]) g.add(en(cil(0.14, 0.5, M.cobre, 0.14, 18), 0, 0.2, z));
        const boquillas = new THREE.Group();
        for (const z of [-0.38, 0, 0.38]) {
            const b = cil(0.034, 0.36, M.marfil, 0.018, 12);
            b.position.set(0.12, 0.96, z);
            boquillas.add(b);
            for (let i = 0; i < 4; i++) { const f = aro(0.04 - i * 0.003, 0.008, M.marfil); f.position.set(0.12, 1.02 + i * 0.075, z); boquillas.add(f); }
            const m = cil(0.018, 0.1, M.acero);
            m.position.set(-0.17, 0.96, z);
            boquillas.add(m);
        }
        g.add(mover(boquillas, [0, 1.3, 0]));
        const conserv = cilZ(0.08, 0.8, M.grafito, 14);
        conserv.position.set(-0.26, 1.12, 0);
        g.add(mover(conserv, [0, 1.3, 0]));
        brillo(g, 0, 0.5, 0.65, 0.9, FLUIDOS.elec.color, 'red', 0.2);
        const p = unidad('subestacion', 6.3, -0.3);
        p.add(entre([-0.25, 0, 0], [-0.25, 2.6, 0], 0.028, M.acero), entre([0.25, 0, 0], [0.25, 2.6, 0], 0.028, M.acero), entre([-0.27, 2.6, 0], [0.27, 2.6, 0], 0.028, M.acero));
        for (const x of [-0.16, 0, 0.16]) {
            p.add(en(cil(0.013, 0.1, M.marfil, 0.013, 8), x, 2.62, 0));
            p.add(en(caja(0.05, 0.16, 0.05, M.grafito), x, 1.2, 0));
            p.add(en(cil(0.02, 0.6, M.marfil, 0.012, 8), x, 1.36, 0));
            p.add(en(cil(0.018, 1.2, M.acero, 0.018, 8), x, 0, 0));
        }
    }

    // --------- RNT y RGD: torres, subestación reductora, postes y pueblo
    {
        const u = unidad('red');
        const geoT = geoTorre(3.3);
        TORRES.forEach(([x, z]) => {
            const t = new THREE.Mesh(geoT, M.torre);
            t.position.set(x, 0, z);
            u.add(t);
            u.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.012, 0.8), M.losa), x, 0.006, z));
        });
        const rnt = LINEAS.find(l => l.id === 'rnt');
        for (const s of [-1, 1]) {
            const pts = rnt.puntos.map(([x, y, z]) => new THREE.Vector3(x + s * 0.13, y - 0.02, z + s * 0.13));
            u.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2), 150, 0.009, 5), M.torre));
        }
        const r = unidad('red', 0.3, -3.9);
        r.add(caja(0.8, 0.04, 0.72, M.losa));
        r.add(en(caja(0.36, 0.42, 0.42, M.grafito), 0, 0.04, 0));
        for (const z of [-0.12, 0, 0.12]) r.add(en(cil(0.016, 0.2, M.marfil, 0.01, 8), 0.05, 0.46, z));
        for (const [a, b] of [[[-0.3, 0, -0.3], [-0.3, 1.5, -0.3]], [[-0.3, 0, 0.3], [-0.3, 1.5, 0.3]], [[0.3, 0, -0.3], [0.3, 1.5, -0.3]], [[0.3, 0, 0.3], [0.3, 1.5, 0.3]], [[-0.32, 1.5, 0.3], [0.32, 1.5, 0.3]], [[-0.32, 1.5, -0.3], [0.32, 1.5, -0.3]], [[0, 1.5, -0.3], [0, 1.5, 0.3]]]) r.add(entre(a, b, 0.016, M.acero));
        r.add(entre([0, 1.5, 0], [0, 0.46, 0], 0.012, M.acero));
        for (const [x, z, h] of [[-0.55, -3.85, 1], [-1.1, -3.8, 0.72]]) {
            u.add(en(cil(0.018, h, M.madera, 0.014, 8), x, 0, z));
            u.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.26), M.madera), x, h - 0.02, z));
        }
        const casas = [[-1.42, -3.95, 0.34, 0.26, 0.24], [-1.92, -3.98, 0.3, 0.3, 0.2], [-1.38, -3.4, 0.38, 0.28, 0.24], [-2, -3.46, 0.34, 0.26, 0.26], [-2.42, -3.9, 0.32, 0.24, 0.2], [-2.46, -3.36, 0.28, 0.24, 0.22], [-1.7, -4.28, 0.26, 0.22, 0.2]];
        casas.forEach(([x, z, w, d, h], i) => {
            const g = new THREE.Group();
            g.position.set(x, 0, z);
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

    // --------- agua a presión, para comparar: contención con domo, vasija, dos generadores de vapor y un presurizador
    {
        const g = unidad('contencion', RX.x, RX.z, gPWR);
        const c = cub('domo', ['pwrV', 'reaccion', 'barras', 'vapor', 'contencion'], { color: '#dcd9d2' });
        const pared = sombra(new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 3.15, 44, 1, true).translate(0, 1.575, 0), c));
        g.add(mover(pared, [0, 0, 2.3]));
        const domo = sombra(new THREE.Mesh(new THREE.SphereGeometry(1.5, 44, 14, 0, PI * 2, 0, PI / 2), c));
        domo.scale.y = 0.75;
        domo.position.y = 3.15;
        const domoG = new THREE.Group();
        domoG.add(domo);
        g.add(mover(domoG, [0, 3, 0]));
        g.add(en(new THREE.Mesh(new THREE.CylinderGeometry(1.53, 1.53, 0.08, 44), M.concreto), 0, 0.04, 0));
        g.add(en(new THREE.Mesh(new THREE.CylinderGeometry(1.46, 1.46, 0.06, 44), M.losa), 0, 0.82, 0));
        const casco = cub('cascoP', ['pwrV', 'reaccion', 'barras', 'vapor'], { color: '#b9bdc4', metal: 0.75 });
        const v = new THREE.Mesh(recipienteGeo(0.42, 1.75, 0.5).translate(0, 1, 0), casco);
        v.castShadow = true;
        g.add(v);
        const nucleoP = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.72, 24).translate(0, 1.56, 0), M.ensamble);
        g.add(nucleoP);
        const azul = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.74, 24, 1, true).translate(0, 1.56, 0), M.cherenkov);
        azul.renderOrder = 3;
        g.add(azul);
        // en este reactor las barras entran por arriba
        const mecan = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.009, 0.009, 0.5, 5).translate(0, 0.25, 0), M.acero, 21);
        const m4 = new THREE.Matrix4();
        let k = 0;
        for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { if (Math.hypot(i, j) > 2.3 || k >= 21) continue; mecan.setMatrixAt(k++, m4.setPosition(i * 0.06, 2.72, j * 0.06)); }
        mecan.count = k;
        g.add(mecan);
        // generadores de vapor y bombas
        for (const z of [0.52, -0.52]) {
            const s = new THREE.Group();
            s.position.set(0.78, 1, z);
            s.add(sombra(new THREE.Mesh(recipienteGeo(0.22, 2, 0.5), M.marfil)));
            s.add(en(aro(0.225, 0.012, M.grafito), 0, 1.15, 0));
            g.add(s);
            const b = new THREE.Group();
            b.position.set(0.53, 0.85, z * 0.14);
            const zb = z > 0 ? 0.375 : -0.375;
            b.position.z = zb;
            b.add(cil(0.09, 0.2, M.grafito), en(cil(0.06, 0.16, M.azul), 0, 0.2, 0));
            g.add(b);
        }
        const pres = new THREE.Mesh(recipienteGeo(0.13, 1.1, 0.5).translate(-0.1, 1.6, 0.85), M.guinda);
        pres.castShadow = true;
        g.add(pres);
    }

    // ---------- árboles en las orillas y lámparas
    {
        const lista = [[-6.85, -3.9], [-6.2, -4.1], [-5.3, -3.9], [-6.8, -3.1], [3.4, -4.2], [2.6, -2.6], [4.6, -2.6], [5.6, -3.3], [6.85, -4.2], [6.9, 1.3], [5.3, 1.05]];
        const n = lista.length;
        const copa = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.2, 1).translate(0, 0.36, 0), M.hoja, n);
        const tronco = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.02, 0.026, 0.28, 6).translate(0, 0.14, 0), M.madera, n);
        const m4 = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        lista.forEach(([x, z], i) => {
            const e = 0.75 + azar(i, 95) * 0.6;
            m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(e, e, e));
            copa.setMatrixAt(i, m4);
            tronco.setMatrixAt(i, m4);
        });
        copa.castShadow = true;
        raiz.add(copa, tronco);
    }
    [[-1.55, 1.55], [-1.55, -1.9], [4.85, 1], [4.85, -1.4], [6.8, 0.6], [-5.2, -2.3]].forEach(([x, z]) => {
        const g = new THREE.Group();
        g.position.set(x, 0, z);
        g.add(cil(0.018, 1.45, M.grafito, 0.013, 8));
        const cab = caja(0.16, 0.03, 0.08, M.lampara);
        cab.position.y = 1.45;
        g.add(cab);
        raiz.add(g);
        brillo(g, 0, 1.44, 0, 1, '#ffcf8f', 'noche', 0.55);
        const charco = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ map: M.brillo, color: '#ffc27a', transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending, opacity: 0 }));
        charco.position.y = 0.04;
        charco.renderOrder = 1;
        g.add(charco);
        brillos.push({ s: charco, proceso: 'noche', fuerza: 0.22, noche: true, charco: true });
    });
    // soportes de los tubos entre edificios
    const soportes = new THREE.Group();
    raiz.add(soportes);
    for (const z of [-0.5, -0.05]) soportes.add(en(cil(0.018, 2.42, M.grafito, 0.018, 8), -1.55, 0, z));
    soportes.add(en(caja(0.1, 0.02, 0.8, M.grafito), -1.55, 2.4, -0.3));

    // ---------- tubos
    const curvaDe = puntos => new THREE.CatmullRomCurve3(puntos.map(p => new THREE.Vector3(...p)), false, 'catmullrom', 0.06);
    const SOLO_PWR = /^(caliente|frio|surge|vaporP|aguaP)/;
    const SOLO_BWR = /^(vaporDentro|agua3|recirc|rcic|rhr|dieselElec)/;
    const lineas = LINEAS.map(L => {
        const curva = curvaDe(L.puntos);
        const largo = curva.getLength();
        const mat = L.cable
            ? M.torre
            : new THREE.MeshPhysicalMaterial({ color: FLUIDOS[L.fluido].color, roughness: 0.25, transparent: true, opacity: 0.4, clearcoat: 0.8, envMapIntensity: 0.6, depthWrite: false });
        const tubo = new THREE.Mesh(new THREE.TubeGeometry(curva, Math.max(14, Math.round(largo * (L.cable ? 12 : 18))), L.r * (L.cable ? 0.7 : 1.3), 8), mat);
        tubo.renderOrder = 2;
        raiz.add(tubo);
        curva.arcLengthDivisions = 200;
        return { L, curva, largo, mat, tubo, n: L.cable ? Math.max(6, Math.round(largo * 2.4)) : Math.max(3, Math.round(largo * (movil ? 4 : 6))), tipo: SOLO_PWR.test(L.id) ? 'pwr' : SOLO_BWR.test(L.id) ? 'bwr' : null, base: new THREE.Color(FLUIDOS[L.fluido].color), fase: 0 };
    });
    for (const l of lineas) {
        const parte = /^(vaporDentro|cruce|vaporFuera|extraccion|escape)/.test(l.L.id) ? 'turbina' : /^(marEntra|marSale|toma)/.test(l.L.id) ? 'enfriamiento' : /^(rnt|rgd)/.test(l.L.id) ? 'red' : /^(gen|trafo)/.test(l.L.id) ? 'subestacion' : /^(rcic|rhr|diesel)/.test(l.L.id) ? 'emergencia' : null;
        if (parte) partes[parte].push(l.tubo);
    }
    const geoP = new THREE.SphereGeometry(1, 8, 6);
    let total = 0;
    lineas.forEach(l => { l.desde = total; total += l.n; });
    const particulas = new THREE.InstancedMesh(geoP, M.particula, total);
    particulas.frustumCulled = false;
    particulas.renderOrder = 3;
    raiz.add(particulas);
    const colorVacio = new THREE.Color('#aeb2b8');
    lineas.forEach(l => { for (let i = 0; i < l.n; i++) particulas.setColorAt(l.desde + i, l.base); });
    particulas.instanceColor.needsUpdate = true;
    const mallasGota = {};
    for (const [k, lista] of Object.entries(gotas)) {
        if (!lista.length) continue;
        const malla = new THREE.InstancedMesh(geoP, M.fluido[k], lista.length);
        malla.frustumCulled = false;
        raiz.add(malla);
        mallasGota[k] = { malla, lista };
    }

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
    const v = new THREE.Vector3();
    const s3 = new THREE.Vector3();
    // lo que corre por los tubos avanza con su flujo: si el flujo cambia, no da brincos
    const fasesLinea = lineas.map(() => 0);
    const fasesGota = {};
    let recargaV = 0;
    let anclaPWR = false;
    let olas = 0;
    const humoDia = new THREE.Color('#6b7077');
    const humoNoche = new THREE.Color('#aab0b8');
    function posar(e) {
        const n = e.noche;
        const L = e.encendido;
        const act = p => (p === 'noche' ? n : p ? (e.activo[p] ?? 0) : 1);
        recargaV += ((e.activo.recarga ?? 0) - recargaV) * (1 - Math.exp(-2.4 * e.dt));
        const esPWR = e.pwr >= 0.5;
        if (esPWR !== anclaPWR) {
            anclaPWR = esPWR;
            anclas.residuos.position.set(...(esPWR ? [-6.15, 0.95, -1.2] : PARTES.find(p => p.id === 'residuos').ancla));
        }
        // cambio de reactor: un edificio se hunde y el otro sube
        const altura = Math.max(0.001, sale(Math.abs(2 * e.pwr - 1)));
        gBWR.visible = !esPWR;
        gPWR.visible = esPWR;
        (esPWR ? gPWR : gBWR).scale.y = altura;
        lineas.forEach((l, i) => { fasesLinea[i] += e.dt * (0.25 + 0.75 * (e.flujos[l.L.id] ?? 0)) * 0.35; l.fase = fasesLinea[i]; });
        for (const p of ['turbina', 'hervor', 'recirc']) fasesGota[p] = (fasesGota[p] ?? 0) + e.dt * (0.15 + act(p));
        const d = e.desarme;
        movibles.forEach(({ obj, p0, d: dir, k }) => {
            const x = sale(clamp01((d * (1 + k) - k) * 1.05));
            obj.position.copy(p0).addScaledVector(dir, x);
        });
        const ab = { ...(e.abierta || {}), recargaV, pwrV: esPWR ? 1 : 0, desarmeV: sale(d * 2.2) };
        for (const [nombre, { mat, abre }] of Object.entries(cubiertas)) {
            const op = 1 - 0.93 * Math.max(e.adentro, ...abre.map(p => ab[p] ?? 0));
            mat.opacity = op;
            mat.depthWrite = op > 0.6;
            mat.transparent = true;
            const o = enCubierta[nombre];
            if (Array.isArray(o)) o.forEach(x => x.scale.setScalar(Math.max(0.0001, clamp01((op - 0.12) / 0.45))));
        }
        const a = sale(d * 3);
        // tubos y partículas
        M.tuberia.opacity = 0.34 * (1 - a);
        soportes.visible = a < 0.6 && !esPWR;
        lineas.forEach(l => {
            const f = e.flujos[l.L.id] ?? 0;
            const deEsteReactor = !l.tipo || (l.tipo === 'pwr') === esPWR;
            if (!l.L.cable) {
                const vivo = clamp01(f * 5);
                l.mat.color.copy(colorVacio).lerp(l.base, vivo);
                l.mat.opacity = lerp(0.34, lerp(0.42, 0.74, clamp01(f * 2)), vivo) * (1 - a);
            }
            l.tubo.visible = a < 0.98 && deEsteReactor;
            const visible = f > 0.01 && a < 0.5 && deEsteReactor;
            for (let p = 0; p < l.n; p++) {
                const r = visible ? Math.max(l.L.r * 0.9, 0.018) : 0;
                if (r > 0) l.curva.getPointAt(fract(p / l.n + (l.fase * 1.4) / Math.max(0.6, l.largo)), v);
                else v.set(0, -7, 0);
                s3.setScalar(Math.max(r, 0.0001));
                particulas.setMatrixAt(l.desde + p, m4.compose(v, q0, s3));
            }
        });
        particulas.instanceMatrix.needsUpdate = true;
        // gotas y burbujas
        for (const { malla, lista } of Object.values(mallasGota)) {
            lista.forEach((b, i) => {
                const f = act(b.proceso);
                const u = fract((fasesGota[b.proceso] ?? 0) * b.vel + b.h);
                const fuera = (b.soloBWR && esPWR) || a >= 0.5 || f <= 0.02;
                const r = fuera ? 0 : b.r * Math.min(1, u * 8) * (1 - u * u * u * 0.5) * (0.5 + 0.5 * f);
                v.set(b.x + Math.sin(e.t * 3 + b.h * 40) * b.abre, lerp(b.y0, b.y1, u), b.z + Math.cos(e.t * 2.6 + b.h * 30) * b.abre);
                s3.setScalar(Math.max(r, 0.0001));
                malla.setMatrixAt(i, m4.compose(v, q0, s3));
            });
            malla.instanceMatrix.needsUpdate = true;
        }
        // barras de control: entran desde abajo
        gBarrasMov.position.y = NY0 - 0.5 + clamp01(e.barras) * (NY1 - NY0);
        // al abrir el núcleo se baja la mitad de delante, para ver las barras
        const corte = Math.max((ab.barras ?? 0) * 0.94, (ab.reaccion ?? 0) * 0.55);
        frente.scale.y = Math.max(0.02, 1 - corte);
        // la luz azul y los neutrones siguen la potencia
        const P = clamp01(e.activo.reactor);
        M.cherenkov.opacity = (0.05 + 0.3 * P) * (1 - a);
        neutrones.visible = !esPWR && a < 0.5;
        if (neutrones.visible) {
            const cuantos = neutrones.count;
            for (let i = 0; i < cuantos; i++) {
                const h = azar(i, 201);
                const vel = 1.3 + h * 1.2;
                const vivo = azar(i, 202) < P * 1.02;
                const fa = e.t * vel + h * 40;
                const rr = 0.36 * (0.2 + 0.8 * Math.abs(Math.sin(fa * 0.37 + h * 9)));
                const ang = fa + h * 20;
                v.set(Math.cos(ang) * rr, lerp(NY0 + 0.03, NY1 - 0.03, 0.5 + 0.5 * Math.sin(fa * 1.3 + h * 11)), Math.sin(ang) * rr);
                s3.setScalar(vivo ? 0.015 : 0.0001);
                neutrones.setMatrixAt(i, m4.compose(v, q0, s3));
            }
            neutrones.instanceMatrix.needsUpdate = true;
        }
        // recarga: se quitan las tapas y la grúa lleva ensambles a la alberca
        if (enCubierta.tapaPozo && d < 0.01) {
            enCubierta.tapaPozo.position.y = 2.2 * recargaV;
            enCubierta.tapaVasija.position.y = 1.65 * recargaV;
        }
        const { grua, mastil, colgado } = enCubierta.grua;
        const ida = fract(e.t * 0.14);
        const tri = ida < 0.5 ? ida * 2 : 2 - ida * 2;
        if (d < 0.01) grua.position.x = lerp(RX.x, lerp(RX.x, -4.64, Math.min(1, tri * 1.25)), recargaV);
        const baja = 1 - recargaV * 0.9;
        mastil.visible = recargaV > 0.02;
        colgado.visible = recargaV > 0.02;
        mastil.scale.y = lerp(0.4, 1.3, recargaV * (1 - Math.abs(tri - 0.5) * 1.2));
        mastil.position.y = -mastil.scale.y;
        colgado.position.y = -mastil.scale.y - 0.42;
        void baja;
        // lo que gira
        const fases = e.fases || {};
        giran.forEach((g, i) => { g.obj.rotation[g.eje] = fases[i] ?? 0; });
        // el mar y la mancha tibia
        olas += e.dt;
        M.marArriba.map.offset.set(olas * 0.012, olas * 0.018);
        pluma.material.opacity = 0.62 * act('mar') * (1 - a);
        pluma.scale.setScalar(1 + 0.04 * Math.sin(e.t * 0.8));
        M.canal.opacity = lerp(0.12, 0.55, act('mar')) * (1 - a);
        // humo de los generadores diésel
        const colorHumo = humoDia.clone().lerp(humoNoche, n);
        vahos.forEach(b => {
            const fuerza = act('diesel');
            const u = fract(e.t * 0.42 + b.u + b.h * 0.1);
            b.s.visible = fuerza > 0.02 && a < 0.5;
            if (!b.s.visible) return;
            b.s.position.set(b.x + u * 0.28, b.y0 + u * 0.9, b.z + Math.cos(e.t * 0.5 + b.h * 8) * 0.04);
            b.s.scale.setScalar(0.12 + u * 0.5);
            b.s.material.color.copy(colorHumo);
            b.s.material.opacity = 0.55 * fuerza * Math.min(1, u * 5) * (1 - u) * L;
        });
        // neones
        M.neonElec.color.set(FLUIDOS.elec.color).multiplyScalar((0.18 + 0.82 * e.activo.turbina) * L);
        M.neonGuinda.color.set(P_PLANTA.rosa).multiplyScalar((0.25 + 0.75 * e.activo.turbina) * L);
        M.lampara.color.set('#9a9c9f').lerp(lampNoche, n);
        M.ventana.color.set('#3f4a57').lerp(ventanaNoche, n).multiplyScalar(lerp(1, clamp01(0.25 + e.activo.red * 1.6), n) * L);
        // brillos y luces
        const adit = n > 0.5 ? THREE.AdditiveBlending : THREE.NormalBlending;
        brillos.forEach(b => {
            const val = act(b.proceso) * b.fuerza * (b.noche ? 0.15 + 0.85 * n : 1) * L * (1 - a);
            b.s.material.opacity = Math.min(1, val);
            b.s.visible = val > 0.005;
            if (!b.charco && b.s.material.blending !== adit) b.s.material.blending = adit;
        });
        luces.forEach(({ l, fuerza, proceso }) => { l.intensity = fuerza * act(proceso) * (0.15 + 0.85 * n) * L * (1 + 0.5 * e.adentro); });
    }
    return { raiz, posar, partes, anclas, giran, repintar: () => rotulos.forEach(r => r.pintar()), equipos: EQUIPOS };
}
