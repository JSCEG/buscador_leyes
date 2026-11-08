// La central geotérmica, hecha con código. Sistema Búho: cubiertas de marfil sobre estructura de grafito y acero, y abajo un
// bloque de tierra cortado de frente para ver el yacimiento. Cada fluido tiene su color y corre visible por tubos de vidrio.
// Las cubiertas se vuelven vidrio (adentro = 1) y cada equipo se separa en sus piezas (desarme = 1).
//
//   materiales(P, { movil })                  estudio(renderer, scene, M, { movil, oscuro })
//   construir(M, P, { movil }) → { raiz, posar(e), partes, anclas, giran, repintar }
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BLOQUE, CIRCULACION, EQUIPOS, FLUIDOS, FRONTERA, KM, LINEAS, PARTES, TORRES, X_INYECTORES, X_PRODUCTORES } from './modelo.js';

const PI = Math.PI;
const clamp01 = x => Math.min(1, Math.max(0, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sale = x => 1 - (1 - clamp01(x)) ** 3;
const fract = x => x - Math.floor(x);
const azar = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

export const P_PLANTA = {
    papel: '#fafafa', noche: '#0a0e12', tinta: '#171317', marfil: '#f3f1ec', grafito: '#303137', acero: '#a7abb3', guinda: '#9b2247', rosa: '#e57a9a',
    tierraDia: '#c8c5be', tierraNoche: '#23272c', losaDia: '#dcdcda', losaNoche: '#2c3036',
    suelo: '#b7a78b', sello: '#5c5753', yacimiento: '#96664a', roca: '#54302a',
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

// El corte de frente, pintado: capas, grietas, regla de profundidad y nombres. El ancho y el alto son los del bloque.
const [X0, X1] = BLOQUE.x;
const [Y0, Y1] = BLOQUE.y;
function pintarCorte(ctx, w, h, P) {
    const px = x => ((x - X0) / (X1 - X0)) * w;
    const py = y => ((Y1 - y) / (Y1 - Y0)) * h;
    const capa = (arriba, abajo, relleno) => {
        ctx.beginPath();
        for (let i = 0; i <= 80; i++) { const x = lerp(X0, X1, i / 80); const y = px(x); if (i) ctx.lineTo(y, py(arriba(x))); else ctx.moveTo(y, py(arriba(x))); }
        for (let i = 80; i >= 0; i--) { const x = lerp(X0, X1, i / 80); ctx.lineTo(px(x), py(abajo(x))); }
        ctx.closePath();
        ctx.fillStyle = relleno;
        ctx.fill();
    };
    const grad = (y0, y1, c0, c1) => { const g = ctx.createLinearGradient(0, py(y0), 0, py(y1)); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; };
    capa(() => Y1, FRONTERA.sello, grad(0, -1.1, '#cbbda2', P.suelo));
    capa(FRONTERA.sello, FRONTERA.yacimiento, grad(-1, -1.9, '#6a645f', P.sello));
    capa(FRONTERA.yacimiento, FRONTERA.roca, grad(-1.9, -3.8, '#a5714f', P.yacimiento));
    capa(FRONTERA.roca, () => Y0, grad(-3.8, -5, P.roca, '#c9401a'));
    // granos y estratos
    const k = w / 2048;
    for (let i = 0; i < 2600; i++) {
        const x = X0 + azar(i, 1) * (X1 - X0);
        const y = Y0 + azar(i, 2) * (Y1 - Y0);
        const enSello = y < FRONTERA.sello(x) && y > FRONTERA.yacimiento(x);
        ctx.fillStyle = azar(i, 3) > 0.5 ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.13)';
        const t = (enSello ? 3.6 : 1.8 + azar(i, 4) * 2.4) * k;
        ctx.fillRect(px(x), py(y), enSello ? t * 4 : t, t * 0.8);
    }
    // estratos de la capa sello, casi horizontales
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 1.4 * k;
    for (let n = 1; n < 5; n++) {
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) { const x = lerp(X0, X1, i / 60); const y = lerp(FRONTERA.sello(x), FRONTERA.yacimiento(x), n / 5); if (i) ctx.lineTo(px(x), py(y)); else ctx.moveTo(px(x), py(y)); }
        ctx.stroke();
    }
    // grietas del yacimiento, por donde corre el agua
    ctx.lineCap = 'round';
    for (let i = 0; i < 90; i++) {
        let x = X0 + azar(i, 7) * (X1 - X0);
        let y = lerp(FRONTERA.yacimiento(x) - 0.06, FRONTERA.roca(x) + 0.1, azar(i, 8));
        const a0 = -0.5 + azar(i, 9) * 1;
        ctx.strokeStyle = azar(i, 10) > 0.4 ? 'rgba(40,14,8,0.52)' : 'rgba(255,190,140,0.28)';
        ctx.lineWidth = (0.8 + azar(i, 11) * 1.8) * k;
        ctx.beginPath();
        ctx.moveTo(px(x), py(y));
        for (let s = 0; s < 6; s++) {
            const a = a0 + (azar(i, s + 20) - 0.5) * 1.2;
            x += Math.cos(a) * 0.17;
            y += Math.sin(a) * 0.1;
            y = Math.min(FRONTERA.yacimiento(x) - 0.03, Math.max(FRONTERA.roca(x) + 0.03, y));
            ctx.lineTo(px(x), py(y));
        }
        ctx.stroke();
    }
    // la falla que deja salir un poco de vapor a la superficie
    ctx.strokeStyle = 'rgba(30,12,8,0.75)';
    ctx.lineWidth = 2.6 * k;
    ctx.beginPath();
    ctx.moveTo(px(1.05), py(-2.25));
    [[0.92, -1.75], [0.97, -1.3], [0.78, -0.86], [0.8, -0.42], [0.62, 0]].forEach(([x, y]) => ctx.lineTo(px(x), py(y)));
    ctx.stroke();
    // regla de profundidad
    const xr = 5.86;
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 2 * k;
    ctx.beginPath();
    ctx.moveTo(px(xr), py(0));
    ctx.lineTo(px(xr), py(-4 * KM + 0.02));
    ctx.stroke();
    ctx.font = `700 ${Math.round(30 * k)}px Manrope, system-ui, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let km = 0; km <= 4; km++) {
        const y = -km * KM;
        ctx.beginPath();
        ctx.moveTo(px(xr - 0.1), py(y + (km === 4 ? 0.03 : km === 0 ? -0.02 : 0)));
        ctx.lineTo(px(xr), py(y + (km === 4 ? 0.03 : km === 0 ? -0.02 : 0)));
        ctx.stroke();
        if (km) {
            ctx.fillStyle = 'rgba(255,255,255,0.92)';
            ctx.fillText(`${km} km`, px(xr - 0.14), py(y + (km === 4 ? 0.1 : 0)));
        }
    }
}
/** Letrero de una capa: una tira transparente con su nombre, por encima de lo que brilla. */
function letrero(texto, color, movil) {
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
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.45), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
    m.renderOrder = 2;
    return { m, pintar };
}
function texturaCorte(P, movil) {
    const c = document.createElement('canvas');
    c.width = movil ? 1024 : 2048;
    c.height = Math.round((c.width * (Y1 - Y0)) / (X1 - X0));
    pintarCorte(c.getContext('2d'), c.width, c.height, P);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    const repintar = () => { pintarCorte(c.getContext('2d'), c.width, c.height, P); t.needsUpdate = true; };
    return { t, repintar };
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
function texturaYacimiento(pinta) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 128;
    pinta(c.getContext('2d'), 512, 128);
    return new THREE.CanvasTexture(c);
}

export function materiales(P, { movil = false } = {}) {
    const env = { envMapIntensity: 0.8 };
    const corte = texturaCorte(P, movil);
    const M = {
        P, brillo: texturaBrillo(), vaho: texturaVaho(), corte,
        marfil: new THREE.MeshPhysicalMaterial({ color: P.marfil, roughness: 0.5, metalness: 0.05, clearcoat: 0.35, clearcoatRoughness: 0.4, ...env }),
        cubierta: new THREE.MeshPhysicalMaterial({ color: P.marfil, roughness: 0.48, metalness: 0.05, clearcoat: 0.4, clearcoatRoughness: 0.35, transparent: true, side: THREE.DoubleSide, ...env }),
        grafito: new THREE.MeshStandardMaterial({ color: P.grafito, roughness: 0.5, metalness: 0.65, ...env }),
        acero: new THREE.MeshStandardMaterial({ color: P.acero, roughness: 0.34, metalness: 0.9, envMapIntensity: 1 }),
        torre: new THREE.MeshStandardMaterial({ color: P.grafito, roughness: 0.5, metalness: 0.65, ...env }),
        cobre: new THREE.MeshStandardMaterial({ color: '#c8743c', roughness: 0.34, metalness: 0.9, envMapIntensity: 1 }),
        guinda: new THREE.MeshPhysicalMaterial({ color: P.guinda, roughness: 0.45, metalness: 0.1, clearcoat: 0.5, ...env }),
        azul: new THREE.MeshPhysicalMaterial({ color: FLUIDOS.regresa.color, roughness: 0.45, metalness: 0.1, clearcoat: 0.5, ...env }),
        losa: new THREE.MeshStandardMaterial({ color: P.losaDia, roughness: 0.9, envMapIntensity: 0.3 }),
        tierra: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#ffffff', 'rgba(0,0,0,0.05)', [5, 3.2]), roughness: 0.95, envMapIntensity: 0.25 }),
        madera: new THREE.MeshStandardMaterial({ color: '#7a6248', roughness: 0.85, envMapIntensity: 0.3 }),
        hoja: new THREE.MeshStandardMaterial({ color: '#3f5d44', roughness: 0.9, envMapIntensity: 0.3 }),
        capaCorte: new THREE.MeshStandardMaterial({ map: corte.t, roughness: 0.95, envMapIntensity: 0.25 }),
        lado: {
            suelo: new THREE.MeshStandardMaterial({ color: P.suelo, roughness: 0.95, envMapIntensity: 0.25 }),
            sello: new THREE.MeshStandardMaterial({ color: P.sello, roughness: 0.95, envMapIntensity: 0.25 }),
            yacimiento: new THREE.MeshStandardMaterial({ color: P.yacimiento, roughness: 0.95, envMapIntensity: 0.25 }),
            roca: new THREE.MeshStandardMaterial({ color: P.roca, roughness: 0.95, envMapIntensity: 0.25 }),
        },
        vidrio: new THREE.MeshPhysicalMaterial({ color: '#dff2ff', roughness: 0.08, transparent: true, opacity: 0.16, clearcoat: 1, clearcoatRoughness: 0.05, depthWrite: false, side: THREE.DoubleSide }),
        tuberia: new THREE.MeshPhysicalMaterial({ color: P.acero, roughness: 0.3, metalness: 0.6, transparent: true, opacity: 0.34, clearcoat: 0.6, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 0.8 }),
        agua: new THREE.MeshPhysicalMaterial({ color: FLUIDOS.enfriamiento.color, roughness: 0.15, transparent: true, opacity: 0.6, clearcoat: 1, depthWrite: false }),
        aguaSep: new THREE.MeshPhysicalMaterial({ color: FLUIDOS.separada.color, roughness: 0.15, transparent: true, opacity: 0.62, clearcoat: 1, depthWrite: false }),
        laguna: new THREE.MeshPhysicalMaterial({ color: '#7fb6a8', roughness: 0.12, metalness: 0.1, clearcoat: 1, envMapIntensity: 1.1 }),
        ventana: new THREE.MeshBasicMaterial({ color: '#ffc77a', toneMapped: false }),
        lampara: new THREE.MeshBasicMaterial({ color: '#ffe2ad', toneMapped: false }),
        neonElec: new THREE.MeshBasicMaterial({ color: FLUIDOS.elec.color, toneMapped: false }),
        neonGuinda: new THREE.MeshBasicMaterial({ color: P.rosa, toneMapped: false }),
        neonIso: new THREE.MeshBasicMaterial({ color: FLUIDOS.isopentano.color, toneMapped: false }),
        magma: new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, map: texturaYacimiento((x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,120,40,0)'); g.addColorStop(0.55, 'rgba(255,110,30,0.75)'); g.addColorStop(1, 'rgba(255,190,70,1)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }) }),
        calor: new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, map: texturaYacimiento((x, w, h) => { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,92,40,0.85)'); g.addColorStop(0.72, 'rgba(255,92,40,0.62)'); g.addColorStop(1, 'rgba(255,92,40,0.28)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }) }),
        frio: new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, map: texturaYacimiento((x, w, h) => { x.clearRect(0, 0, w, h); for (const u of [0.795, 0.912]) { const g = x.createRadialGradient(u * w, h * 0.72, 2, u * w, h * 0.72, 64); g.addColorStop(0, 'rgba(70,120,255,0.95)'); g.addColorStop(1, 'rgba(70,120,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); } }) }),
        particula: new THREE.MeshBasicMaterial({ toneMapped: false }),
        fluido: {},
    };
    for (const [k, f] of Object.entries(FLUIDOS)) M.fluido[k] = new THREE.MeshBasicMaterial({ color: f.color, toneMapped: false });
    return M;
}

// ------------------------------------------------------------------ estudio
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
    Object.assign(sol.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 46 });
    sol.shadow.mapSize.set(2048, 2048);
    sol.shadow.bias = -0.0006;
    sol.shadow.normalBias = 0.025;
    const reflector = new THREE.DirectionalLight('#ffffff', 0.1);
    reflector.position.set(3, 8, 9);
    scene.add(cielo, sol, reflector);

    // como en las demás figuras de Aprende: solo recibe sombra y deja ver el papel del sitio
    const suelo = new THREE.Mesh(new THREE.CircleGeometry(30, 64).rotateX(-PI / 2), new THREE.ShadowMaterial({ color: '#000000', opacity: oscuro ? 0.35 : 0.14 }));
    suelo.position.y = Y0 - 0.02;
    suelo.receiveShadow = true;
    scene.add(suelo);

    const estrellas = (() => {
        const n = 110;
        const pos = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const a = azar(i, 1) * PI * 2;
            const r = 26 + azar(i, 2) * 10;
            pos.set([Math.cos(a) * r, 4 + azar(i, 3) * 18, Math.sin(a) * r], i * 3);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const m = new THREE.Points(g, new THREE.PointsMaterial({ color: '#dfe9ff', size: 0.09, transparent: true, depthWrite: false, toneMapped: false }));
        m.frustumCulled = false;
        scene.add(m);
        return m;
    })();

    const dia = { sol: new THREE.Color('#ffffff'), tierra: new THREE.Color(oscuro ? '#8f8c86' : P.tierraDia), losa: new THREE.Color(oscuro ? '#9a9b9a' : P.losaDia) };
    if (oscuro) M.torre.color.set('#8f929a');
    const noche = { sol: new THREE.Color('#9db6ff'), tierra: new THREE.Color(P.tierraNoche), losa: new THREE.Color(P.losaNoche) };
    const capaDia = new THREE.Color('#ffffff');
    const capaNoche = new THREE.Color('#7c7f88');
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
        M.capaCorte.color.copy(capaDia).lerp(capaNoche, n);
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
function geoEntre(a, b, r) {
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...b);
    const d = B.clone().sub(A);
    const g = new THREE.CylinderGeometry(r, r, d.length(), 5);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()));
    g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
    return g;
}
const entre = (a, b, r, m) => sombra(new THREE.Mesh(geoEntre(a, b, r), m));
/** Recipiente vertical con tapas abombadas, base en y = 0. */
function recipienteGeo(r, h) {
    const puntos = [];
    const tapa = r * 0.55;
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * (PI / 2); puntos.push(new THREE.Vector2(Math.sin(a) * r, tapa - Math.cos(a) * tapa)); }
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * (PI / 2); puntos.push(new THREE.Vector2(Math.cos(a) * r, h - tapa + Math.sin(a) * tapa)); }
    return new THREE.LatheGeometry(puntos, 32);
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
    const unidad = (id, x = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, 0, z); raiz.add(g); partes[id].push(g); return g; };
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
    // gotas y burbujas: en coordenadas de la central; se apagan con su proceso
    const gotas = { vapor: [], enfriamiento: [], isopentano: [], separada: [] };
    const gota = (fluido, proceso, x, z, y0, y1, vel = 0.4, r = 0.02, abre = 0.02) => gotas[fluido].push({ proceso, x, z, y0, y1, vel, r, abre, h: azar(gotas[fluido].length, x + z) });

    // --------- 1 y 2 · el bloque de tierra, en capas
    const capas = {};
    const hacerCapa = (nombre, arriba, abajo, material, d) => {
        const f = new THREE.Shape();
        const n = 80;
        for (let i = 0; i <= n; i++) { const x = lerp(X0, X1, i / n); if (i) f.lineTo(x, arriba(x)); else f.moveTo(x, arriba(x)); }
        for (let i = n; i >= 0; i--) { const x = lerp(X0, X1, i / n); f.lineTo(x, abajo(x)); }
        f.closePath();
        const prof = BLOQUE.z[1] - BLOQUE.z[0];
        const geo = new THREE.ExtrudeGeometry(f, { depth: prof, bevelEnabled: false, steps: 1 }).translate(0, 0, BLOQUE.z[0]);
        // las tapas leen el dibujo del corte
        const pos = geo.attributes.position;
        const uv = geo.attributes.uv;
        for (const grupo of geo.groups) {
            if (grupo.materialIndex !== 0) continue;
            for (let i = grupo.start; i < grupo.start + grupo.count; i++) uv.setXY(i, pos.getZ(i) < 0 ? 0.03 : (pos.getX(i) - X0) / (X1 - X0), (pos.getY(i) - Y0) / (Y1 - Y0));
        }
        uv.needsUpdate = true;
        const m = sombra(new THREE.Mesh(geo, [M.capaCorte, material]));
        m.castShadow = false;
        const g = new THREE.Group();
        g.add(m);
        raiz.add(g);
        mover(g, d);
        capas[nombre] = g;
        return g;
    };
    // el bloque entero da una sola sombra en el papel: sin esto, las de las piezas lo atraviesan y caen sueltas.
    // Es invisible y queda apenas por dentro de las capas para no ensuciarlas.
    const molde = new THREE.Mesh(
        new THREE.BoxGeometry(X1 - X0 - 0.04, Y1 - Y0 - 0.04, BLOQUE.z[1] - BLOQUE.z[0] - 0.04),
        new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
    );
    molde.position.set((X0 + X1) / 2, (Y0 + Y1) / 2, (BLOQUE.z[0] + BLOQUE.z[1]) / 2);
    molde.castShadow = true;
    raiz.add(molde);
    hacerCapa('suelo', () => Y1, FRONTERA.sello, M.lado.suelo, [0, 0, 0]);
    hacerCapa('sello', FRONTERA.sello, FRONTERA.yacimiento, M.lado.sello, [0, -0.55, 0]);
    hacerCapa('yacimiento', FRONTERA.yacimiento, FRONTERA.roca, M.lado.yacimiento, [0, -1.1, 0]);
    hacerCapa('roca', FRONTERA.roca, () => Y0, M.lado.roca, [0, -1.65, 0]);
    partes.roca.push(capas.roca);
    partes.yacimiento.push(capas.yacimiento, capas.sello);

    // lo que brilla sobre el corte: el yacimiento caliente, el frío de la reinyección y el magma
    const planoEntre = (arriba, abajo, material, z) => {
        const f = new THREE.Shape();
        const n = 50;
        for (let i = 0; i <= n; i++) { const x = lerp(X0, X1, i / n); if (i) f.lineTo(x, arriba(x)); else f.moveTo(x, arriba(x)); }
        for (let i = n; i >= 0; i--) { const x = lerp(X0, X1, i / n); f.lineTo(x, abajo(x)); }
        const geo = new THREE.ShapeGeometry(f);
        const pos = geo.attributes.position;
        const uv = geo.attributes.uv;
        const y0 = Math.min(...Array.from({ length: pos.count }, (_, i) => pos.getY(i)));
        const y1 = Math.max(...Array.from({ length: pos.count }, (_, i) => pos.getY(i)));
        for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - X0) / (X1 - X0), (pos.getY(i) - y0) / (y1 - y0));
        const m = new THREE.Mesh(geo, material);
        m.position.z = z;
        m.renderOrder = 1;
        return m;
    };
    const planoCalor = planoEntre(FRONTERA.yacimiento, FRONTERA.roca, M.calor, BLOQUE.z[1] + 0.002);
    const planoFrio = planoEntre(FRONTERA.yacimiento, FRONTERA.roca, M.frio, BLOQUE.z[1] + 0.003);
    capas.yacimiento.add(planoCalor, planoFrio);
    const planoMagma = planoEntre(x => -4.42 - 0.05 * Math.sin(x * 1.3), () => Y0, M.magma, BLOQUE.z[1] + 0.002);
    capas.roca.add(planoMagma);
    luz(capas.roca, 0, -4.3, BLOQUE.z[1] + 1, '#ff7a3a', 7, 'magma', 7);

    const rotulos = [];
    const rotular = (capa, texto, x, y, color) => {
        const l = letrero(texto, color, movil);
        l.m.position.set(x, y, BLOQUE.z[1] + 0.008);
        capa.add(l.m);
        rotulos.push(l);
    };
    rotular(capas.suelo, 'Suelo y roca', 1.75, -0.62, 'rgba(50,38,22,0.86)');
    rotular(capas.sello, 'Capa sello', 2.05, -1.44, 'rgba(255,255,255,0.92)');
    rotular(capas.yacimiento, 'Yacimiento', 1.95, -2.32, 'rgba(255,255,255,0.96)');
    rotular(capas.roca, 'Roca caliente', 2.05, -4.14, 'rgba(255,255,255,0.94)');

    // la superficie: tierra y losas
    const superficie = new THREE.Group();
    raiz.add(superficie);
    const tierra = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0, 0.04, BLOQUE.z[1] - BLOQUE.z[0]), M.tierra);
    tierra.position.set(0, -0.019, (BLOQUE.z[0] + BLOQUE.z[1]) / 2);
    tierra.receiveShadow = true;
    superficie.add(tierra);
    const losa = (x0, x1, z0, z1, h = 0.03) => {
        const l = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, h, z1 - z0), M.losa);
        l.position.set((x0 + x1) / 2, h / 2, (z0 + z1) / 2);
        l.receiveShadow = true;
        superficie.add(l);
    };
    losa(-5.6, -2.4, 2.25, 3.28);
    losa(-2.7, 3, -3.1, 2.25);
    losa(-5.2, -2.7, -1.7, 0.2);
    losa(3, 5.72, -3.2, -1.05);
    losa(2.85, 4.65, 0.1, 1.6);
    losa(2.9, 4.72, 2.25, 3.28);

    // --------- pozos: tubería de ademe, cada vez más angosta, sobre el corte
    const ademe = new THREE.Group();
    raiz.add(ademe);
    const curvaDe = puntos => new THREE.CatmullRomCurve3(puntos.map(p => new THREE.Vector3(...p)), false, 'catmullrom', 0.06);
    const anillos = [];
    function ademar(L) {
        const c = curvaDe(L.puntos);
        const pts = c.getSpacedPoints(90).filter(p => p.y < -0.02);
        const tramo = (y0, y1, r) => {
            const sel = pts.filter(p => p.y <= y0 && p.y >= y1);
            if (sel.length < 3) return;
            const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(sel), sel.length * 2, r, 10), M.tuberia);
            t.renderOrder = 1;
            ademe.add(t);
            anillos.push({ p: sel[0], r: r + 0.008 }, { p: sel.at(-1), r: r + 0.008 });
        };
        tramo(-0.02, -1.05, 0.092);
        tramo(-1.05, -1.9, 0.078);
        tramo(-1.9, -3.5, 0.064);
        // el último tramo va ranurado: por ahí entra (o sale) el agua
        pts.filter(p => p.y < -2.05).forEach((p, i) => { if (i % 2 === 0) anillos.push({ p, r: 0.066, ranura: true }); });
    }
    LINEAS.filter(l => l.bajoTierra).forEach(ademar);
    {
        const geo = new THREE.CylinderGeometry(1, 1, 1, 18, 1, true);
        const m = new THREE.InstancedMesh(geo, M.grafito, anillos.length);
        const m4 = new THREE.Matrix4();
        anillos.forEach((a, i) => { m.setMatrixAt(i, m4.compose(a.p, new THREE.Quaternion(), new THREE.Vector3(a.r, a.ranura ? 0.012 : 0.03, a.r))); });
        m.frustumCulled = false;
        ademe.add(m);
    }

    // --------- 3 · cabezales de los pozos y silenciador
    function cabezal(padre, x, y1, marca) {
        const g = new THREE.Group();
        g.position.set(x, 0, 3.14);
        g.add(caja(0.42, 0.05, 0.28, M.grafito));
        g.add(cil(0.1, 0.09, M.acero));
        g.add(en(cil(0.052, y1 + 0.2, M.marfil), 0, 0.09, 0));
        for (const y of [0.24, 0.42]) {
            if (y > y1) continue;
            g.add(en(caja(0.13, 0.08, 0.13, M.grafito), 0, y - 0.04, 0));
            g.add(en(aro(0.072, 0.01, marca), 0, y + 0.06, 0));
            g.add(en(cil(0.008, 0.06, M.acero), 0, y, 0));
        }
        g.add(en(cilZ(0.05, 0.24, M.marfil), 0, y1, -0.1));
        g.add(en(cil(0.07, 0.05, marca), 0, y1 + 0.26, 0));
        padre.add(g);
        return g;
    }
    const uPozo = unidad('pozo');
    X_PRODUCTORES.forEach(x => cabezal(uPozo, x, 0.55, M.guinda));
    partes.pozo.push(ademe);
    {
        const s = unidad('pozo', -3.4, 1.35);
        s.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 1.02, 28, 1, true).translate(0, 0.51, 0), new THREE.MeshPhysicalMaterial({ color: P.marfil, roughness: 0.5, side: THREE.DoubleSide, envMapIntensity: 0.8 }))));
        s.add(en(aro(0.4, 0.024, M.grafito), 0, 1.03, 0));
        s.add(en(new THREE.Mesh(new THREE.CircleGeometry(0.385, 28).rotateX(-PI / 2), M.grafito), 0, 0.78, 0));
        s.add(en(aro(0.425, 0.012, M.grafito), 0, 0.5, 0));
        s.add(en(cilZ(0.05, 0.2, M.acero), 0, 0.55, 0.42));
    }
    // soportes de los tubos
    const soportes = new THREE.Group();
    raiz.add(soportes);
    const soporte = (x, y, z) => {
        soportes.add(en(cil(0.012, y - 0.04, M.grafito, 0.012, 8), x, 0, z));
        soportes.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.012, 0.1), M.grafito), x, y - 0.05, z));
    };
    const durmiente = (x, z) => soportes.add(en(caja(0.12, 0.13, 0.2, M.losa), x, 0.02, z));
    for (const x of [-4.8, -4, -3, -2.2]) soporte(x, 0.5, 2.45);
    for (const [x, z] of [[-1.35, 0.1], [-1.12, -0.8], [-0.72, -0.8], [-0.92, -1.3]]) soporte(x, 1.05, z);
    for (const x of [-1, 0, 1, 1.8]) durmiente(x, 2.62);
    for (const z of [1.5, 2.1]) durmiente(-1.35, z);

    // --------- 4 · separador: el remolino se ve por dentro
    let remolino;
    {
        const g = unidad('separador', -2, 0.6);
        const concha = cub('concha', ['separador']);
        for (const [x, z] of [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]]) g.add(en(cil(0.028, 0.32, M.grafito, 0.028, 8), x, 0, z));
        const cuerpo = sombra(new THREE.Mesh(recipienteGeo(0.42, 2.12).translate(0, 0.22, 0), concha));
        g.add(mover(cuerpo, [0, 3, 0]));
        g.add(en(cil(0.06, 0.12, M.acero), 0, 2.32, 0));
        const faja = aro(0.425, 0.014, M.fluido.separada);
        faja.position.y = 0.74;
        g.add(mover(faja, [0, 3, 0]));
        // adentro: el agua que cae y el tubo por donde se va el vapor
        g.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.46, 28).translate(0, 0.5, 0), M.aguaSep)));
        g.add(en(cil(0.09, 1.02, M.acero, 0.09, 18), 0, 1.3, 0));
        g.add(en(new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.05, 24), M.grafito), 0, 2.06, 0));
        g.add(en(cil(0.06, 0.3, M.grafito), 0.25, 0.04, 0.25));
        // plataforma y escalera, para dar idea del tamaño
        const pasillo = aro(0.5, 0.012, M.grafito);
        pasillo.position.y = 1.72;
        g.add(mover(pasillo, [0, 3, 0]));
        const r2 = aro(0.5, 0.008, M.grafito);
        r2.position.y = 1.88;
        g.add(mover(r2, [0, 3, 0]));
        const esc = new THREE.Group();
        esc.add(entre([-0.46, 0, -0.14], [-0.46, 1.72, -0.14], 0.009, M.grafito), entre([-0.46, 0, 0.0], [-0.46, 1.72, 0.0], 0.009, M.grafito));
        for (let i = 0; i < 12; i++) esc.add(entre([-0.46, 0.1 + i * 0.14, -0.14], [-0.46, 0.1 + i * 0.14, 0], 0.006, M.grafito));
        g.add(esc);
        remolino = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), 56);
        remolino.frustumCulled = false;
        const c1 = new THREE.Color(FLUIDOS.separada.color);
        const c2 = new THREE.Color(FLUIDOS.vapor.color);
        const c3 = new THREE.Color(FLUIDOS.caliente.color);
        for (let i = 0; i < 56; i++) remolino.setColorAt(i, i < 18 ? c3 : i < 38 ? c1 : c2);
        g.add(remolino);
    }

    // --------- casa de máquinas
    {
        const casa = cub('casa', ['turbina', 'generador', 'condensador']);
        const g = unidad('turbina');
        const [x0, x1, z0, z1, h] = [-0.45, 2.7, -1.85, 0.05, 2.28];
        const pared = (w, d, x, z, dir) => { const m = caja(w, h, d, casa); m.position.set(x, 0, z); g.add(mover(m, dir)); return m; };
        pared(x1 - x0, 0.04, (x0 + x1) / 2, z0, [0, 0, -1.3]);
        pared(x1 - x0, 0.04, (x0 + x1) / 2, z1, [0, 0, 1.3]);
        pared(0.04, z1 - z0, x0, (z0 + z1) / 2, [-1.2, 0, 0]);
        pared(0.04, z1 - z0, x1, (z0 + z1) / 2, [1.2, 0, 0]);
        const techo = caja(x1 - x0 + 0.16, 0.07, z1 - z0 + 0.16, casa);
        techo.position.set((x0 + x1) / 2, h, (z0 + z1) / 2);
        g.add(mover(techo, [0, 2.6, 0]));
        // cumbrera y franja: se van con el techo
        const cumbre = caja(x1 - x0 - 0.5, 0.1, 0.5, casa);
        cumbre.position.set((x0 + x1) / 2, h + 0.07, (z0 + z1) / 2);
        g.add(mover(cumbre, [0, 2.6, 0]));
        // ventanas y puerta: se apagan cuando la pared se vuelve vidrio
        enCubierta.casa = [];
        for (let i = 0; i < 6; i++) {
            const v = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.32, 0.012), M.ventana);
            v.position.set(lerp(x0 + 0.3, x1 - 0.3, i / 5), 1.75, z1 + 0.024);
            g.add(v);
            enCubierta.casa.push(v);
        }
        const puerta = caja(0.52, 0.8, 0.012, M.grafito);
        puerta.position.set(2.2, 0, z1 + 0.024);
        g.add(puerta);
        enCubierta.casa.push(puerta);
        const franja = caja(x1 - x0, 0.05, 0.012, M.guinda);
        franja.position.set((x0 + x1) / 2, 2.14, z1 + 0.024);
        g.add(franja);
        enCubierta.casa.push(franja);
        // mesa de la turbina
        const mesa = caja(2.9, 0.08, 1.12, M.losa);
        mesa.position.set(1.08, 0.98, -0.9);
        g.add(mesa);
        for (const [x, z] of [[-0.25, -1.4], [-0.25, -0.4], [2.45, -1.4], [2.45, -0.4], [1.35, -1.4], [1.35, -0.4]]) g.add(en(caja(0.09, 0.98, 0.09, M.losa), x, 0, z));
    }

    // --------- 5 · turbina: carcasa partida y rotor con álabes cada vez más largos
    const G_Y = 1.45;
    const G_Z = -0.9;
    const giroVapor = e => 11 * e.activo.vapor;
    {
        const g = unidad('turbina', 0.65, G_Z);
        const c = cub('carcasa', ['turbina']);
        const perfil = [[-0.75, 0.05], [-0.75, 0.24], [-0.5, 0.27], [0, 0.34], [0.5, 0.44], [0.62, 0.46], [0.74, 0.2], [0.74, 0.05]];
        const arriba = sombra(new THREE.Mesh(mediaCarcasa(perfil, true), c));
        arriba.position.y = G_Y;
        g.add(mover(arriba, [0, 1.15, 0]));
        const abajo = sombra(new THREE.Mesh(mediaCarcasa(perfil, false), c));
        abajo.position.y = G_Y;
        g.add(abajo);
        for (const s of [-1, 1]) {
            const b = caja(1.46, 0.024, 0.05, M.grafito);
            b.position.set(0, G_Y - 0.012, s * 0.36);
            g.add(mover(b, [0, 1.15, 0]));
        }
        // la entrada del vapor, con su válvula
        const valvula = cil(0.09, 0.26, M.acero);
        valvula.position.set(-0.63, G_Y + 0.14, 0);
        g.add(mover(valvula, [0, 1.15, 0]));
        const volante = aro(0.095, 0.01, M.guinda);
        volante.position.set(-0.63, G_Y + 0.4, 0);
        g.add(mover(volante, [0, 1.15, 0]));
        // cuello hacia el condensador
        const cuello = cil(0.24, 0.13, c, 0.3);
        cuello.position.set(0.45, 1, 0);
        g.add(cuello);
        // el rotor
        const rotor = new THREE.Group();
        rotor.position.set(0, G_Y, 0);
        rotor.add(cilX(0.05, 1.64, M.acero));
        const etapas = 9;
        const geoAlabe = new THREE.BoxGeometry(0.018, 1, 0.042);
        const nA = 20 * etapas;
        const alabes = new THREE.InstancedMesh(geoAlabe, M.marfil, nA);
        const m4 = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        const eje = new THREE.Vector3(1, 0, 0);
        let k = 0;
        for (let e = 0; e < etapas; e++) {
            const x = -0.58 + e * 0.14;
            const raizR = 0.1 + e * 0.008;
            const largo = 0.05 + e * 0.027;
            const disco = cilX(raizR, 0.03, M.acero);
            disco.position.x = x;
            rotor.add(disco);
            for (let i = 0; i < 20; i++) {
                const a = (i / 20) * PI * 2;
                q.setFromAxisAngle(eje, a);
                const r = raizR + largo / 2;
                m4.compose(new THREE.Vector3(x, Math.cos(a) * r, Math.sin(a) * r), q, new THREE.Vector3(1, largo, 1));
                alabes.setMatrixAt(k++, m4);
            }
        }
        alabes.castShadow = true;
        rotor.add(alabes);
        const ultimo = aroX(0.34, 0.01, M.neonGuinda);
        ultimo.position.x = 0.54;
        rotor.add(ultimo);
        g.add(mover(rotor, [0, 0.55, 0]));
        giran.push({ obj: rotor, eje: 'x', vel: giroVapor });
        // apoyos
        for (const x of [-0.74, 0.74]) g.add(en(caja(0.12, 0.32, 0.2, M.grafito), x, 1.06, 0));
    }

    // --------- 6 · generador: el rotor es de cobre y las bobinas rodean
    {
        const g = unidad('generador', 1.93, G_Z);
        const c = cub('estator', ['generador']);
        const carcasa = cilX(0.31, 0.72, c, 32);
        carcasa.position.y = G_Y;
        g.add(mover(carcasa, [0, 1.3, 0]));
        for (const x of [-0.36, 0.36]) {
            const b = aroX(0.31, 0.022, M.grafito);
            b.position.set(x, G_Y, 0);
            g.add(mover(b, [0, 1.3, 0]));
        }
        // aletas por fuera: se van con la carcasa
        for (let i = 1; i < 6; i++) {
            const b = aroX(0.315, 0.007, M.acero);
            b.position.set(-0.36 + i * 0.12, G_Y, 0);
            g.add(mover(b, [0, 1.3, 0]));
        }
        g.add(en(caja(0.72, 0.1, 0.5, M.grafito), 0, 1.06, 0));
        // bobinas del estator
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * PI * 2;
            const b = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.08), M.cobre);
            b.position.set(0, G_Y + Math.cos(a) * 0.235, Math.sin(a) * 0.235);
            b.rotation.x = a;
            g.add(b);
        }
        const rotor = new THREE.Group();
        rotor.position.set(0, G_Y, 0);
        rotor.add(cilX(0.05, 1.04, M.acero));
        const nucleo = cilX(0.155, 0.56, M.cobre, 8);
        rotor.add(nucleo);
        rotor.add(en(aroX(0.16, 0.012, M.neonElec), -0.28, 0, 0), en(aroX(0.16, 0.012, M.neonElec), 0.28, 0, 0));
        g.add(mover(rotor, [0, 0.6, 0]));
        giran.push({ obj: rotor, eje: 'x', vel: giroVapor });
        // excitatriz, al final del eje
        const exc = cilX(0.13, 0.12, M.marfil);
        exc.position.set(0.45, G_Y, 0);
        g.add(exc);
        brillo(g, 0, G_Y, 0.32, 0.6, FLUIDOS.elec.color, 'vapor', 0.32);
    }

    // --------- 7 · condensador: el vapor se encuentra con una lluvia de agua fría
    {
        const g = unidad('condensador', 0.6, G_Z);
        const c = cub('conchaC', ['condensador']);
        const cuerpo = cilX(0.37, 1.24, c, 28);
        cuerpo.position.y = 0.48;
        g.add(mover(cuerpo, [0, 0, 1.25]));
        for (const x of [-0.62, 0.62]) {
            const b = aroX(0.37, 0.018, M.grafito);
            b.position.set(x, 0.48, 0);
            g.add(mover(b, [0, 0, 1.25]));
        }
        for (const x of [-0.42, 0.42]) g.add(en(caja(0.1, 0.13, 0.6, M.grafito), x, 0, 0));
        // adentro: regaderas y el agua que se junta abajo
        for (const z of [-0.14, 0.14]) { const t = cilX(0.018, 1.08, M.fluido.enfriamiento, 8); t.position.set(0, 0.74, z); g.add(t); }
        const charco = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.1, 0.5), M.agua);
        charco.position.y = 0.2;
        g.add(charco);
        for (let i = 0; i < 26; i++) gota('enfriamiento', 'vapor', 0.6 + (azar(i, 41) - 0.5) * 1.05, G_Z + (azar(i, 42) > 0.5 ? 0.14 : -0.14) + (azar(i, 43) - 0.5) * 0.08, 0.72, 0.24, 1.1, 0.014, 0.012);
        // bomba de agua y extractor de gases
        const bomba = unidad('condensador', 1.32, -0.46);
        bomba.add(cil(0.09, 0.2, M.grafito), en(cil(0.06, 0.16, M.azul), 0, 0.2, 0));
        const e = unidad('condensador', 0.4, -1.45);
        e.position.y = 0.86;
        e.add(caja(0.36, 0.1, 0.22, M.grafito), en(cilX(0.05, 0.42, M.acero, 12), 0, 0.14, 0));
    }

    // --------- 8 · torre de enfriamiento: tres celdas con ventilador
    const vahoG = new THREE.Group();
    {
        const g = unidad('torre', 4.3, -2.1);
        const [w, d, h] = [2.6, 1.8, 1.42];
        const c = cub('torre', ['torre']);
        const tanque = caja(w + 0.1, 0.13, d + 0.1, M.losa);
        g.add(tanque);
        const agua = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), M.agua);
        agua.position.y = 0.135;
        g.add(agua);
        for (const s of [-1, 1]) {
            const m = caja(w, h - 0.13, 0.03, c);
            m.position.set(0, 0.13, (s * d) / 2);
            g.add(mover(m, [0, 0, s * 1.2]));
            const lado = caja(0.03, h - 0.13, d, c);
            lado.position.set((s * w) / 2, 0.13, 0);
            g.add(mover(lado, [s * 1, 0, 0]));
        }
        const techo = caja(w + 0.06, 0.05, d + 0.06, c);
        techo.position.y = h;
        g.add(mover(techo, [0, 1.5, 0]));
        // persianas: dejan entrar el aire; no se ven por dentro
        enCubierta.torre = [];
        const pers = new THREE.InstancedMesh(new THREE.BoxGeometry(w - 0.02, 0.012, 0.06), M.grafito, 10);
        const m4 = new THREE.Matrix4();
        const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.55);
        for (let i = 0; i < 5; i++) {
            m4.compose(new THREE.Vector3(0, 0.2 + i * 0.075, d / 2 + 0.03), q, new THREE.Vector3(1, 1, 1));
            pers.setMatrixAt(i, m4);
            m4.compose(new THREE.Vector3(0, 0.2 + i * 0.075, -d / 2 - 0.03), q, new THREE.Vector3(1, 1, 1));
            pers.setMatrixAt(5 + i, m4);
        }
        g.add(pers);
        enCubierta.torre.push(pers);
        // relleno por donde escurre el agua
        const relleno = new THREE.InstancedMesh(new THREE.BoxGeometry(w - 0.1, 0.014, 0.02), M.acero, 90);
        for (let f = 0; f < 3; f++) {
            for (let i = 0; i < 30; i++) {
                m4.makeTranslation(0, 0.62 + f * 0.13, -d / 2 + 0.08 + (i / 29) * (d - 0.16));
                relleno.setMatrixAt(f * 30 + i, m4);
            }
        }
        g.add(mover(relleno, [0, 0.4, 0]));
        const cabezalAgua = cilX(0.03, w - 0.2, M.fluido.enfriamiento, 10);
        cabezalAgua.position.y = 1.24;
        g.add(cabezalAgua);
        for (const z of [-0.5, 0.5]) { const t = cilX(0.016, w - 0.2, M.fluido.enfriamiento, 8); t.position.set(0, 1.2, z); g.add(t); }
        // la entrada y la salida del agua, en la pared
        g.add(en(cilX(0.075, 0.2, M.grafito), -w / 2, 1.25, 0.5), en(cilX(0.075, 0.2, M.grafito), -w / 2, 0.18, 0.2));
        for (let i = 0; i < 44; i++) gota('enfriamiento', 'torre', 4.3 + (azar(i, 51) - 0.5) * (w - 0.25), -2.1 + (azar(i, 52) - 0.5) * (d - 0.25), 1.18, 0.16, 0.75, 0.014, 0.012);
        // los tres ventiladores y el vaho
        vahoG.position.set(4.3, 0, -2.1);
        raiz.add(vahoG);
        for (const x of [-0.86, 0, 0.86]) {
            const tubo = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.33, 0.42, 28, 1, true).translate(0, 0.21, 0), c));
            tubo.position.set(x, h + 0.04, 0);
            g.add(mover(tubo, [0, 1.5, 0]));
            const rim = aro(0.36, 0.012, M.grafito);
            rim.position.set(x, h + 0.46, 0);
            g.add(mover(rim, [0, 1.5, 0]));
            const rotor = new THREE.Group();
            rotor.position.set(x, h + 0.26, 0);
            rotor.add(cil(0.04, 0.05, M.grafito));
            for (let i = 0; i < 6; i++) {
                const a = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.008, 0.06), M.grafito));
                a.position.set(Math.cos((i / 6) * PI * 2) * 0.17, 0.02, Math.sin((i / 6) * PI * 2) * 0.17);
                a.rotation.y = -(i / 6) * PI * 2;
                a.rotation.x = 0.26;
                rotor.add(a);
            }
            g.add(mover(rotor, [0, 0.9, 0]));
            giran.push({ obj: rotor, eje: 'y', vel: e => 2 + 7 * e.activo.torre });
            for (let i = 0; i < (movil ? 4 : 6); i++) {
                const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.vaho, color: '#ffffff', transparent: true, depthWrite: false, opacity: 0 }));
                s.renderOrder = 5;
                vahoG.add(s);
                vahos.push({ s, x, u: i / (movil ? 4 : 6), h: azar(i, x * 10 + 3), y0: h + 0.5, tipo: 'torre' });
            }
        }
    }

    // --------- 9 · reinyección: pozos, bomba y laguna de evaporación
    {
        const u = unidad('reinyeccion');
        X_INYECTORES.forEach(x => {
            const g = cabezal(u, x, 0.2, M.azul);
            g.add(en(aro(0.09, 0.012, M.azul), 0, 0.12, 0));
        });
        const b = unidad('reinyeccion', 2.4, 2.62);
        b.add(caja(0.42, 0.06, 0.34, M.grafito), en(cil(0.11, 0.26, M.azul), 0, 0.06, 0), en(cilX(0.05, 0.42, M.marfil, 12), 0, 0.2, 0));
        const l = unidad('reinyeccion', 5.3, 1.15);
        const [w, d] = [1.1, 3.7];
        const borde = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), M.losa);
        borde.position.y = 0.01;
        borde.receiveShadow = true;
        l.add(borde);
        const espejo = new THREE.Mesh(new THREE.BoxGeometry(w - 0.1, 0.012, d - 0.1), M.laguna);
        espejo.position.y = 0.04;
        l.add(espejo);
        // sales que se quedan en la orilla
        for (let i = 0; i < 16; i++) {
            const s = new THREE.Mesh(new THREE.CylinderGeometry(0.03 + azar(i, 61) * 0.05, 0.05 + azar(i, 61) * 0.05, 0.015, 8), M.marfil);
            s.position.set((azar(i, 62) > 0.5 ? 1 : -1) * (w / 2 - 0.07), 0.05, (azar(i, 63) - 0.5) * (d - 0.2));
            l.add(s);
        }
        partes.reinyeccion.push(l);
    }

    // --------- 10 · planta binaria: evaporador, turbina pequeña y condensador de aire
    {
        const g = unidad('binaria', -4.4, -0.24);
        const c = cub('evap', ['binaria']);
        const cuerpo = cilX(0.24, 1.25, c, 24);
        cuerpo.position.y = 0.5;
        g.add(mover(cuerpo, [0, 1.1, 0]));
        for (const x of [-0.45, 0.45]) g.add(en(caja(0.09, 0.3, 0.4, M.grafito), x, 0, 0));
        for (const x of [-0.62, 0.62]) { const a = aroX(0.24, 0.016, M.grafito); a.position.set(x, 0.5, 0); g.add(mover(a, [0, 1.1, 0])); }
        // serpentín de isopentano
        const pts = [];
        for (let i = 0; i <= 90; i++) { const a = i * 0.42; pts.push(new THREE.Vector3(-0.56 + (i / 90) * 1.12, 0.5 + Math.cos(a) * 0.15, Math.sin(a) * 0.15)); }
        g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 180, 0.011, 6), M.neonIso));
        for (let i = 0; i < 18; i++) gota('isopentano', 'binaria', -4.4 + (azar(i, 71) - 0.5) * 1.05, -0.24 + (azar(i, 72) - 0.5) * 0.22, 0.34, 0.7, 0.7, 0.012, 0.018);
        // domo de donde sale el vapor
        g.add(en(cil(0.06, 0.1, M.acero), 0.55, 0.72, -0.11));
        const t = unidad('binaria', -3.25, -0.74);
        t.add(en(caja(0.72, 0.18, 0.26, M.grafito), 0, 0, 0));
        const carc = cilX(0.15, 0.36, M.marfil, 20);
        carc.position.set(-0.13, 0.36, 0);
        t.add(mover(carc, [0, 0.8, 0]));
        const gen = cilX(0.14, 0.26, M.cobre, 18);
        gen.position.set(0.2, 0.36, 0);
        t.add(mover(gen, [0.5, 0.2, 0]));
        const rotorBin = new THREE.Group();
        rotorBin.position.set(-0.13, 0.36, 0);
        rotorBin.add(cilX(0.03, 0.36, M.acero, 8));
        for (let i = 0; i < 12; i++) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.2, 0.02), M.neonIso); a.position.set(0, Math.cos((i / 12) * PI * 2) * 0.09, Math.sin((i / 12) * PI * 2) * 0.09); a.rotation.x = (i / 12) * PI * 2; rotorBin.add(a); }
        t.add(rotorBin);
        giran.push({ obj: rotorBin, eje: 'x', vel: e => 12 * e.activo.binaria });
        t.add(en(aroX(0.145, 0.009, M.neonElec), 0.33, 0.36, 0));
        const b = unidad('binaria', -4, -0.75);
        b.add(cil(0.08, 0.18, M.grafito), en(cil(0.05, 0.1, M.neonIso), 0, 0.18, 0));
        // condensador de aire, en alto
        const a = unidad('binaria', -3.8, -1.265);
        for (const x of [-1, -0.34, 0.34, 1]) for (const z of [-0.17, 0.17]) a.add(entre([x, 0, z], [x, 0.76, z], 0.013, M.grafito));
        const banco = caja(2.1, 0.13, 0.43, M.acero);
        banco.position.y = 0.76;
        a.add(banco);
        const lineaIso = caja(2.1, 0.02, 0.43, M.neonIso);
        lineaIso.position.y = 0.75;
        a.add(lineaIso);
        const tapa = caja(2.14, 0.03, 0.45, M.grafito);
        tapa.position.y = 0.89;
        a.add(tapa);
        for (const x of [-0.78, -0.26, 0.26, 0.78]) {
            const anillo = aro(0.19, 0.012, M.marfil);
            anillo.position.set(x, 0.95, 0);
            a.add(anillo);
            a.add(en(cil(0.19, 0.04, M.grafito, 0.19, 24), x, 0.9, 0));
            const rotor = new THREE.Group();
            rotor.position.set(x, 0.96, 0);
            for (let i = 0; i < 5; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.006, 0.04), M.marfil); p.position.set(Math.cos((i / 5) * PI * 2) * 0.09, 0, Math.sin((i / 5) * PI * 2) * 0.09); p.rotation.y = -(i / 5) * PI * 2; rotor.add(p); }
            a.add(rotor);
            giran.push({ obj: rotor, eje: 'y', vel: e => 1 + 8 * e.activo.binaria });
        }
    }

    // --------- 11 · subestación: transformador y pórtico de salida
    {
        const g = unidad('subestacion', 3.4, 0.85);
        const c = cub('tanque', ['subestacion'], { color: '#5a5c63', metal: 0.5 });
        const tanque = caja(0.7, 0.8, 0.9, c);
        tanque.position.y = 0.06;
        g.add(mover(tanque, [0, 1.3, 0]));
        const tapa = caja(0.74, 0.04, 0.94, M.grafito);
        tapa.position.y = 0.86;
        g.add(mover(tapa, [0, 1.3, 0]));
        g.add(caja(0.82, 0.06, 1.02, M.losa));
        for (const s of [-1, 1]) {
            for (let i = 0; i < 6; i++) {
                const r = caja(0.1, 0.62, 0.02, M.acero);
                r.position.set(s * 0.42, 0.12, -0.34 + i * 0.136);
                g.add(mover(r, [s * 0.7, 0, 0]));
            }
        }
        // núcleo y bobinas
        g.add(en(caja(0.44, 0.62, 0.1, M.grafito), 0, 0.12, 0));
        for (const z of [-0.26, 0, 0.26]) g.add(en(cil(0.13, 0.46, M.cobre, 0.13, 18), 0, 0.2, z));
        // boquillas de porcelana
        const boquillas = new THREE.Group();
        for (const z of [-0.28, 0, 0.28]) {
            const b = cil(0.032, 0.32, M.marfil, 0.018, 12);
            b.position.set(0.12, 0.9, z);
            boquillas.add(b);
            for (let i = 0; i < 4; i++) { const f = aro(0.038 - i * 0.003, 0.008, M.marfil); f.position.set(0.12, 0.96 + i * 0.07, z); boquillas.add(f); }
            const m = cil(0.018, 0.1, M.acero);
            m.position.set(-0.17, 0.9, z);
            boquillas.add(m);
        }
        g.add(mover(boquillas, [0, 1.3, 0]));
        const conserv = cilZ(0.08, 0.6, M.grafito, 14);
        conserv.position.set(-0.26, 1.05, 0);
        g.add(mover(conserv, [0, 1.3, 0]));
        brillo(g, 0, 0.5, 0.52, 0.8, FLUIDOS.elec.color, 'red', 0.2);
        // pórtico
        const p = unidad('subestacion', 4.3, 0.9);
        p.add(entre([-0.22, 0, 0], [-0.22, 1.8, 0], 0.025, M.acero), entre([0.22, 0, 0], [0.22, 1.8, 0], 0.025, M.acero), entre([-0.24, 1.8, 0], [0.24, 1.8, 0], 0.025, M.acero));
        for (const x of [-0.14, 0, 0.14]) {
            p.add(en(cil(0.012, 0.1, M.marfil, 0.012, 8), x, 1.82, 0));
            p.add(en(caja(0.05, 0.16, 0.05, M.grafito), x, 0.9, 0));
            p.add(en(cil(0.02, 0.5, M.marfil, 0.012, 8), x, 1.06, 0));
            p.add(en(cil(0.018, 0.9, M.acero, 0.018, 8), x, 0, 0));
        }
    }

    // --------- 12 · RNT y RGD: torres, subestación reductora, postes y pueblo
    {
        const u = unidad('red');
        const geoT = geoTorre(2.9);
        TORRES.forEach(([x, z]) => {
            const t = new THREE.Mesh(geoT, M.torre);
            t.position.set(x, 0, z);
            u.add(t);
            u.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.012, 0.8), M.losa), x, 0.006, z));
        });
        // otros dos cables de la misma línea
        const rnt = LINEAS.find(l => l.id === 'rnt');
        for (const s of [-1, 1]) {
            const pts = rnt.puntos.map(([x, y, z]) => new THREE.Vector3(x + s * 0.13, y - 0.02, z + s * 0.13));
            u.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2), 150, 0.009, 5), M.torre));
        }
        // subestación reductora
        const r = unidad('red', -3.1, -3.55);
        r.add(caja(0.8, 0.04, 0.72, M.losa));
        r.add(en(caja(0.36, 0.42, 0.42, M.grafito), 0, 0.04, 0));
        for (const z of [-0.12, 0, 0.12]) r.add(en(cil(0.016, 0.2, M.marfil, 0.01, 8), 0.05, 0.46, z));
        for (const [a, b] of [[[-0.3, 0, -0.3], [-0.3, 1.5, -0.3]], [[-0.3, 0, 0.3], [-0.3, 1.5, 0.3]], [[0.3, 0, -0.3], [0.3, 1.5, -0.3]], [[0.3, 0, 0.3], [0.3, 1.5, 0.3]], [[-0.32, 1.5, 0.3], [0.32, 1.5, 0.3]], [[-0.32, 1.5, -0.3], [0.32, 1.5, -0.3]], [[0, 1.5, -0.3], [0, 1.5, 0.3]]]) r.add(entre(a, b, 0.016, M.acero));
        r.add(entre([0, 1.5, 0], [0, 0.46, 0], 0.012, M.acero));
        // postes de distribución
        for (const [x, z, h] of [[-3.8, -3.35, 0.95], [-4.42, -3.3, 0.72]]) {
            u.add(en(cil(0.018, h, M.madera, 0.014, 8), x, 0, z));
            u.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.26), M.madera), x, h - 0.02, z));
        }
        // el pueblo
        const casas = [[-4.72, -3.68, 0.34, 0.26, 0.24], [-5.22, -3.72, 0.3, 0.3, 0.2], [-4.68, -3.08, 0.38, 0.28, 0.24], [-5.3, -3.2, 0.34, 0.26, 0.26], [-4.96, -2.76, 0.32, 0.24, 0.2], [-5.48, -2.82, 0.28, 0.24, 0.22], [-4.42, -2.78, 0.26, 0.22, 0.2]];
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

    // ---------- la fumarola: se nota el calor en la superficie
    {
        const f = unidad('yacimiento', 0.62, 3.12);
        f.add(sombra(new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.09, 9).translate(0, 0.045, 0), M.lado.sello)));
        for (let i = 0; i < 5; i++) {
            const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.vaho, color: '#ffffff', transparent: true, depthWrite: false, opacity: 0 }));
            s.renderOrder = 5;
            f.add(s);
            vahos.push({ s, x: 0, u: i / 5, h: azar(i, 91), y0: 0.08, tipo: 'fumarola' });
        }
    }
    // ---------- pinos en las orillas y lámparas
    {
        const pinos = [[-5.7, -1.5], [-5.3, -1.1], [-5.7, -0.5], [-4.8, -1.7], [-3.8, -2.2], [-2.3, -3.8], [0.6, -3.7], [1.2, -3.95], [3.6, -3.75], [4.6, -3.8], [5.75, -3.55]];
        const n = pinos.length;
        const copa = new THREE.InstancedMesh(new THREE.ConeGeometry(0.17, 0.62, 8).translate(0, 0.31, 0), M.hoja, n);
        const tronco = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.02, 0.025, 0.2, 6).translate(0, 0.1, 0), M.madera, n);
        const m4 = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        pinos.forEach(([x, z], i) => {
            const e = 0.75 + azar(i, 95) * 0.6;
            m4.compose(new THREE.Vector3(x, 0.14 * e, z), q, new THREE.Vector3(e, e, e));
            copa.setMatrixAt(i, m4);
            m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(e, e, e));
            tronco.setMatrixAt(i, m4);
        });
        raiz.add(copa, tronco);
        const pisada = new THREE.InstancedMesh(new THREE.CircleGeometry(0.24, 14).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.16, depthWrite: false }), n);
        pinos.forEach(([x, z], i) => { const e = 0.75 + azar(i, 95) * 0.6; pisada.setMatrixAt(i, m4.compose(new THREE.Vector3(x - 0.06, 0.012, z - 0.08), q, new THREE.Vector3(e, 1, e))); });
        pisada.renderOrder = 1;
        raiz.add(pisada);
    }
    [[-2.75, 2.1], [-2.5, -1.8], [2.82, 1.7], [2.82, -2.4], [5.45, -1], [-1.2, 2.95]].forEach(([x, z]) => {
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

    // ---------- tubos
    const lineas = LINEAS.map(L => {
        const curva = curvaDe(L.puntos);
        const largo = curva.getLength();
        const mat = L.cable
            ? M.torre
            : new THREE.MeshPhysicalMaterial({ color: FLUIDOS[L.fluido].color, roughness: 0.25, transparent: true, opacity: 0.4, clearcoat: 0.8, envMapIntensity: 0.6, depthWrite: false });
        const tubo = new THREE.Mesh(new THREE.TubeGeometry(curva, Math.max(14, Math.round(largo * (L.cable ? 12 : 18))), L.r * (L.cable ? 0.7 : 1.3), 8), mat);
        tubo.renderOrder = 2;
        raiz.add(tubo);
        curva.arcLengthDivisions = Math.max(60, Math.round(largo * 30));
        return { L, curva, largo, mat, tubo, n: Math.min(L.cable ? 34 : 26, Math.max(3, Math.round(largo / 0.3))), desde: 0 };
    });
    const geoP = new THREE.SphereGeometry(1, 8, 6);
    let total = 0;
    lineas.forEach(l => { l.desde = total; total += l.n; });
    const particulas = new THREE.InstancedMesh(geoP, M.particula, total);
    particulas.frustumCulled = false;
    raiz.add(particulas);
    const colorVacio = new THREE.Color('#aeb2b8');
    const colorFluido = Object.fromEntries(Object.entries(FLUIDOS).map(([k, f]) => [k, new THREE.Color(f.color)]));
    let modoPintado = null;
    function pintarFluidos(modo) {
        if (modoPintado === modo) return;
        modoPintado = modo;
        lineas.forEach(l => {
            const f = l.L.porModo?.[modo] ?? l.L.fluido;
            l.base = colorFluido[f];
            for (let i = 0; i < l.n; i++) particulas.setColorAt(l.desde + i, colorFluido[f]);
        });
        particulas.instanceColor.needsUpdate = true;
    }
    pintarFluidos('flash');
    const mallasGota = {};
    for (const [k, lista] of Object.entries(gotas)) {
        if (!lista.length) continue;
        const malla = new THREE.InstancedMesh(geoP, M.fluido[k], lista.length);
        malla.frustumCulled = false;
        raiz.add(malla);
        mallasGota[k] = { malla, lista };
    }
    // el agua que cruza el yacimiento y se calienta en el camino
    const cursosRes = CIRCULACION.map(c => { const curva = new THREE.CatmullRomCurve3(c.map(([x, y]) => new THREE.Vector3(x, y, BLOQUE.z[1] + 0.012))); curva.arcLengthDivisions = 80; return curva; });
    const nCurso = movil ? 11 : 16;
    const cursoMalla = new THREE.InstancedMesh(geoP, new THREE.MeshBasicMaterial({ toneMapped: false }), cursosRes.length * nCurso);
    cursoMalla.frustumCulled = false;
    cursoMalla.renderOrder = 3;
    capas.yacimiento.add(cursoMalla);
    // chispas de calor que suben de la roca
    const nChispa = movil ? 22 : 40;
    const chispas = new THREE.InstancedMesh(geoP, new THREE.MeshBasicMaterial({ color: '#ffab5c', toneMapped: false, transparent: true, opacity: 0.85 }), nChispa);
    chispas.frustumCulled = false;
    capas.roca.add(chispas);
    const cFrio = new THREE.Color(FLUIDOS.regresa.color);
    const cCaliente = new THREE.Color(FLUIDOS.caliente.color);
    const cVapor = new THREE.Color(FLUIDOS.vapor.color);
    const cTmp = new THREE.Color();

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
    let faseCurso = 0;
    let faseSep = 0;
    const vahoColorDia = new THREE.Color('#aab6c4');
    const vahoColorNoche = new THREE.Color('#dfe6ee');
    function posar(e) {
        const n = e.noche;
        const L = e.encendido;
        const act = p => (p === 'noche' ? n : p === 'magma' ? 1 : p ? (e.activo[p] ?? 0) : 1);
        pintarFluidos(e.modo);
        lineas.forEach((l, i) => { fasesLinea[i] += e.dt * (0.25 + 0.75 * (e.flujos[l.L.id] ?? 0)) * 0.35; l.fase = fasesLinea[i]; });
        for (const p of ['vapor', 'torre', 'binaria']) fasesGota[p] = (fasesGota[p] ?? 0) + e.dt * (0.4 + act(p));
        const d = e.desarme;
        movibles.forEach(({ obj, p0, d: dir, k }) => {
            const x = sale(clamp01((d * (1 + k) - k) * 1.05));
            obj.position.copy(p0).addScaledVector(dir, x);
        });
        // cubiertas: cada una se abre con sus partes
        for (const [nombre, { mat, abre }] of Object.entries(cubiertas)) {
            const op = 1 - 0.93 * Math.max(e.adentro, ...abre.map(p => e.abierta?.[p] ?? 0));
            mat.opacity = op;
            mat.depthWrite = op > 0.6;
            (enCubierta[nombre] ?? []).forEach(o => o.scale.setScalar(Math.max(0.0001, clamp01((op - 0.12) / 0.45))));
        }
        const a = sale(d * 3);
        // tubos y partículas
        ademe.visible = a < 0.98;
        M.tuberia.opacity = 0.34 * (1 - a);
        soportes.visible = a < 0.6;
        lineas.forEach(l => {
            const f = e.flujos[l.L.id] ?? 0;
            if (!l.L.cable) {
                const vivo = clamp01(f * 5);
                l.mat.color.copy(colorVacio).lerp(l.base, vivo);
                l.mat.opacity = lerp(0.42, lerp(0.42, 0.74, clamp01(f * 2)), vivo) * (1 - a);
            }
            else l.tubo.visible = a < 0.6;
            l.tubo.visible = a < 0.98;
            const visible = f > 0.01 && a < 0.5;
            for (let p = 0; p < l.n; p++) {
                const r = visible ? Math.max(l.L.r * 0.9, 0.018) : 0;
                if (r > 0) l.curva.getPointAt(fract(p / l.n + (l.fase * 1.4) / Math.max(0.6, l.largo)), v);
                else v.set(0, -7, 0);
                s3.setScalar(Math.max(r, 0.0001));
                particulas.setMatrixAt(l.desde + p, m4.compose(v, q0, s3));
            }
        });
        particulas.instanceMatrix.needsUpdate = true;
        // gotas
        for (const { malla, lista } of Object.values(mallasGota)) {
            lista.forEach((b, i) => {
                const f = act(b.proceso);
                const u = fract((fasesGota[b.proceso] ?? 0) * b.vel + b.h);
                const r = f > 0.02 && a < 0.5 ? b.r * Math.min(1, u * 8) * (1 - u * u * u * 0.5) * (0.5 + 0.5 * f) : 0;
                v.set(b.x + Math.sin(e.t * 3 + b.h * 40) * b.abre, lerp(b.y0, b.y1, u), b.z + Math.cos(e.t * 2.6 + b.h * 30) * b.abre);
                s3.setScalar(Math.max(r, 0.0001));
                malla.setMatrixAt(i, m4.compose(v, q0, s3));
            });
            malla.instanceMatrix.needsUpdate = true;
        }
        // separador: agua que gira y baja; vapor que gira y sube
        const fS = e.activo.separador;
        faseSep += e.dt * (0.2 + fS * 0.9);
        for (let i = 0; i < 56; i++) {
            const agua = i >= 18 && i < 38;
            const entra = i < 18;
            const u = fract(faseSep * (entra ? 0.5 : 0.36) + i / (entra ? 18 : 20));
            const ang = (entra ? 1 : 3.2) * u * PI * 2 + i;
            const rr = entra ? 0.36 : agua ? lerp(0.35, 0.32, u) : lerp(0.2, 0.05, u);
            const y = entra ? lerp(1.5, 1.3, u) : agua ? lerp(1.3, 0.72, u) : lerp(0.92, 2.28, u);
            const r = fS > 0.02 && a < 0.5 ? (entra ? 0.018 : agua ? 0.016 : 0.02) : 0;
            v.set(Math.cos(ang) * rr, y, Math.sin(ang) * rr);
            s3.setScalar(Math.max(r, 0.0001));
            remolino.setMatrixAt(i, m4.compose(v, q0, s3));
        }
        remolino.instanceMatrix.needsUpdate = true;
        // lo que gira
        const fases = e.fases || {};
        giran.forEach((g, i) => { g.obj.rotation[g.eje] = fases[i] ?? 0; });
        // yacimiento: más caliente, más rojo; donde entra el agua fría, azul
        const T = e.tempYacimiento;
        M.calor.opacity = clamp01(0.08 + ((T - 90) / 250) * 0.5) * (1 - a * 0.6);
        M.frio.opacity = clamp01(e.frio) * 0.75 * (1 - a * 0.6);
        M.magma.opacity = lerp(0.7, 0.98, n) * L;
        // el agua cruza el yacimiento
        const fCurso = e.modo === 'anios' ? Math.max(0.15, e.lectura.anios.R) : 0.8;
        faseCurso += e.dt * 0.05 * fCurso;
        const vaporYac = e.modo === 'seco';
        cursosRes.forEach((c, j) => {
            for (let i = 0; i < nCurso; i++) {
                const u = fract(faseCurso + i / nCurso + j * 0.19);
                c.getPointAt(u, v);
                const s = a < 0.5 ? 0.032 * Math.min(1, Math.min(u, 1 - u) * 12) : 0.0001;
                s3.setScalar(Math.max(s, 0.0001));
                const idx = j * nCurso + i;
                cursoMalla.setMatrixAt(idx, m4.compose(v, q0, s3));
                cTmp.copy(cFrio).lerp(vaporYac ? cVapor : cCaliente, clamp01(u * 1.7));
                cursoMalla.setColorAt(idx, cTmp);
            }
        });
        cursoMalla.instanceMatrix.needsUpdate = true;
        if (cursoMalla.instanceColor) cursoMalla.instanceColor.needsUpdate = true;
        // calor que sube de la roca
        for (let i = 0; i < nChispa; i++) {
            const h = azar(i, 101);
            const u = fract(e.t * (0.05 + h * 0.04) + h);
            const x = X0 + 0.3 + azar(i, 102) * (X1 - X0 - 0.9);
            v.set(x + Math.sin(e.t * 0.8 + h * 30) * 0.05, lerp(-4.55, FRONTERA.roca(x) + 0.05, u), BLOQUE.z[1] + 0.012);
            s3.setScalar(a < 0.5 ? 0.024 * (1 - u) + 0.006 : 0.0001);
            chispas.setMatrixAt(i, m4.compose(v, q0, s3));
        }
        chispas.instanceMatrix.needsUpdate = true;
        // vaho de la torre y de la fumarola; el vaho de la torre sale con la torre
        const colorVaho = vahoColorDia.clone().lerp(vahoColorNoche, n);
        vahos.forEach(b => {
            const torre = b.tipo === 'torre';
            const fuerza = torre ? e.activo.torre : 0.5;
            const u = fract(e.t * (torre ? 0.13 : 0.2) + b.u + b.h * 0.1);
            b.s.visible = fuerza > 0.02 && a < 0.5;
            if (!b.s.visible) return;
            const alto = torre ? 1.7 : 0.75;
            const esc = torre ? 0.5 + u * 1.25 : 0.12 + u * 0.56;
            b.s.position.set(b.x + (torre ? u * 0.35 + Math.sin(e.t * 0.6 + b.h * 9) * 0.05 : u * 0.1), b.y0 + u * alto, torre ? Math.cos(e.t * 0.5 + b.h * 8) * 0.06 : 0);
            b.s.scale.setScalar(esc);
            b.s.material.color.copy(colorVaho);
            b.s.material.opacity = (torre ? 0.62 : 0.95) * fuerza * Math.min(1, u * 5) * (1 - u) * L;
        });
        // neones
        M.neonElec.color.set(FLUIDOS.elec.color).multiplyScalar((0.18 + 0.82 * Math.max(e.activo.vapor, e.activo.binaria)) * L);
        M.neonGuinda.color.set(P.rosa).multiplyScalar((0.25 + 0.75 * e.activo.vapor) * L);
        M.neonIso.color.set(FLUIDOS.isopentano.color).multiplyScalar((0.25 + 0.75 * e.activo.binaria) * L);
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
    return { raiz, posar, partes, anclas, giran, repintar: () => { M.corte.repintar(); rotulos.forEach(r => r.pintar()); }, equipos: EQUIPOS };
}
