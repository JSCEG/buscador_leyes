// El búho mecánico, hecho con código: cuerpo de escamas de marfil sobre un núcleo grafito, cara de disco con dos ojos
// guinda, penachos, pico, alas articuladas (hombro, codo y muñeca con sus bisagras) con plumas que terminan en guinda,
// garras, y las piezas sueltas que salen al desarmarse (corazas, tornillos, rodamientos, engranes) con órbitas finas.
// Referencia: la ilustración del búho mecánico. posar(e) pone cada pieza donde dice estado(t) en modelo.js.
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { MARK_BODY, MARK_BROW, MARK_EYE } from '../src/lib/brand-mark.js';
import { MODULO, ENGRANE, OJOS, CUERPO, CABEZA, ESCALA_CABEZA, HOMBRO, N_PLUMAS, N_SECUNDARIAS } from './modelo.js';

const D2R = Math.PI / 180;
const lerp = (a, b, k) => a + (b - a) * k;
const clamp01 = x => Math.min(1, Math.max(0, x));
const sale = x => 1 - (1 - clamp01(x)) ** 3;
const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const sombra = m => { m.castShadow = true; m.receiveShadow = true; return m; };
// contorno fino de tinta en las aristas: lo casi blanco no se pierde en el papel
const entintar = (m, M, angulo = 40) => { m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, angulo), M.tinta)); return m; };

// ---------------------------------------------------------------- texturas
function lienzo(w, h, dibujar) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    dibujar(c.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
}

// Pluma: marfil en la base, guinda en la punta, con el raquis al centro y barbas finas.
const texturaPluma = P => lienzo(128, 512, (x, w, h) => {
    const g = x.createLinearGradient(0, h, 0, 0);
    g.addColorStop(0, P.marfil);
    g.addColorStop(0.74, P.marfil);
    g.addColorStop(0.79, '#d7b3ba');
    g.addColorStop(0.84, '#8a1838');
    g.addColorStop(1, '#3a0716');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(60,20,30,0.10)';
    x.lineWidth = 1;
    for (let k = 0; k < 70; k++) {
        const y = h - (k / 70) * h * 0.95;
        x.beginPath(); x.moveTo(w / 2, y); x.lineTo(0, y - 26); x.moveTo(w / 2, y); x.lineTo(w, y - 26); x.stroke();
    }
    x.strokeStyle = 'rgba(255,255,255,0.65)';
    x.lineWidth = 3;
    x.beginPath(); x.moveTo(w / 2, h); x.lineTo(w / 2, h * 0.06); x.stroke();
});

// Plumita del disco facial: marfil con el raquis y las orillas en sombra, para que cada una se lea.
const texturaRayo = () => lienzo(64, 256, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#8a7f73');
    g.addColorStop(0.18, '#e6ddd1');
    g.addColorStop(0.5, '#fbf8f3');
    g.addColorStop(0.82, '#e6ddd1');
    g.addColorStop(1, '#8a7f73');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(120,105,95,0.55)';
    x.lineWidth = 2;
    x.beginPath(); x.moveTo(w / 2, h); x.lineTo(w / 2, h * 0.08); x.stroke();
});

// Iris: lente casi negro con reflejos guinda profundos y un aro neón fino, como en las referencias.
const texturaIris = () => lienzo(256, 256, (x, w) => {
    const c = w / 2;
    const g = x.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0, '#2a0510');
    g.addColorStop(0.5, '#5a0a22');
    g.addColorStop(0.62, '#7e0f30');
    g.addColorStop(0.7, '#ff4f7e');
    g.addColorStop(0.74, '#ffd3de');
    g.addColorStop(0.78, '#ff3a6c');
    g.addColorStop(0.86, '#6d0b28');
    g.addColorStop(1, '#14020a');
    x.fillStyle = g;
    x.fillRect(0, 0, w, w);
    x.strokeStyle = 'rgba(255,90,130,0.35)';
    x.lineWidth = 1.5;
    for (const r of [0.42, 0.9]) { x.beginPath(); x.arc(c, c, c * r, 0, Math.PI * 2); x.stroke(); }
});

export function materiales(P) {
    const env = { envMapIntensity: 0.65 };
    const marfil = new THREE.MeshPhysicalMaterial({ color: P.marfil, roughness: 0.5, metalness: 0.04, clearcoat: 0.4, clearcoatRoughness: 0.4, ...env });
    const marfilDoble = marfil.clone();
    marfilDoble.side = THREE.DoubleSide;
    const pico = new THREE.MeshPhysicalMaterial({ color: '#d8d0c5', roughness: 0.48, metalness: 0.08, clearcoat: 0.45, clearcoatRoughness: 0.35, ...env });
    // pico de grafito metálico (se probó oro y guinda): rugosidad 0.32 para que brille sin quemarse en una raya blanca
    const picoMetal = new THREE.MeshPhysicalMaterial({ color: '#2a2b31', roughness: 0.32, metalness: 0.9, clearcoat: 0.8, clearcoatRoughness: 0.15, envMapIntensity: 1.2 });
    const grafito = new THREE.MeshStandardMaterial({ color: P.grafito, roughness: 0.42, metalness: 0.65, ...env });
    const grafitoDoble = new THREE.MeshStandardMaterial({ color: '#5b5c62', roughness: 0.5, metalness: 0.5, side: THREE.BackSide, ...env });
    const acero = new THREE.MeshStandardMaterial({ color: P.acero, roughness: 0.38, metalness: 0.85, ...env });
    const borde = new THREE.MeshStandardMaterial({ color: P.guinda, roughness: 0.42, metalness: 0.3, ...env });
    const cable = new THREE.MeshPhysicalMaterial({ color: '#a3173f', roughness: 0.35, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.15, ...env });
    const garra = new THREE.MeshPhysicalMaterial({ color: '#23242a', roughness: 0.45, metalness: 0.75, clearcoat: 1, clearcoatRoughness: 0.12, ...env });
    const pluma = new THREE.MeshStandardMaterial({ map: texturaPluma(P), roughness: 0.6, metalness: 0, side: THREE.DoubleSide, ...env });
    const iris = new THREE.MeshBasicMaterial({ map: texturaIris(), toneMapped: false });
    const pupila = new THREE.MeshBasicMaterial({ color: '#050407', toneMapped: false });
    const vidrio = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, transparent: true, opacity: 0.1, clearcoat: 1, envMapIntensity: 0.8, depthWrite: false });
    const ceramica = new THREE.MeshPhysicalMaterial({ color: P.ceramica, roughness: 0.48, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.35, ...env });
    const tinta = new THREE.LineBasicMaterial({ color: P.tinta, transparent: true, opacity: 0.42 });
    const orbita = new THREE.LineBasicMaterial({ color: P.guinda, transparent: true, opacity: 0 });
    // neón guinda: los aros que brillan dentro del mecanismo (no reciben luz: su color es su brillo)
    const neon = new THREE.MeshBasicMaterial({ color: '#ff2a5f', toneMapped: false });
    // logo del pecho: placa iluminada marfil, búho negro brillante y ojo neón guinda (el logo se voltea en y al pasar
    // del SVG a 3D, por eso sus caras van por los dos lados)
    const placaLogo = new THREE.MeshBasicMaterial({ map: texturaLuz(), toneMapped: false });
    const vidrioLogo = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.08, transparent: true, opacity: 0.08, envMapIntensity: 0.35, depthWrite: false });
    // negro laca: brillo leve sin metal (el metal reflejaba blanco de frente)
    const negroLogo = new THREE.MeshBasicMaterial({ color: '#0b0b0d' }); // negro pleno, como la silueta de una insignia
    const ojoLogo = new THREE.MeshBasicMaterial({ color: '#fff3e6', toneMapped: false }); // ojo blanco encendido sobre el guinda
    const resplandor = new THREE.MeshBasicMaterial({ map: texturaResplandor(), transparent: true, depthWrite: false, toneMapped: false });
    return { resplandor, placaLogo, vidrioLogo, negroLogo, ojoLogo, picoMetal, neon, marfil, marfilDoble, pico, grafito, grafitoDoble, acero, borde, cable, garra, pluma, iris, pupila, vidrio, ceramica, tinta, orbita };
}

// ---------------------------------------------------------------- piezas básicas
/** Hoja (pluma o escama) a lo largo de +y, de largo L y ancho W, curvada hacia +z. Redonda: punta de escama. */
function hoja(L, W, curva = 0.12, redonda = false, solida = false, pala = false) {
    const f = new THREE.Shape();
    f.moveTo(-W * 0.16, 0);
    if (pala) {
        // pluma de vuelo: pala ancha de lados casi rectos y punta cortada en diagonal, como en la referencia
        f.moveTo(-W * 0.3, 0);
        f.quadraticCurveTo(-W * 0.52, L * 0.4, -W * 0.48, L * 0.84);
        f.lineTo(W * 0.12, L);
        f.quadraticCurveTo(W * 0.5, L * 0.86, W * 0.5, L * 0.7);
        f.quadraticCurveTo(W * 0.48, L * 0.3, W * 0.3, 0);
        f.lineTo(-W * 0.3, 0);
    } else if (redonda) {
        f.bezierCurveTo(-W * 0.62, L * 0.25, -W * 0.6, L * 0.98, 0, L);
        f.bezierCurveTo(W * 0.6, L * 0.98, W * 0.62, L * 0.25, W * 0.16, 0);
    } else {
        f.bezierCurveTo(-W * 0.58, L * 0.22, -W * 0.52, L * 0.72, 0, L);
        f.bezierCurveTo(W * 0.52, L * 0.72, W * 0.58, L * 0.22, W * 0.16, 0);
    }
    if (!pala) f.lineTo(-W * 0.16, 0);
    const g = solida
        ? new THREE.ExtrudeGeometry(f, { depth: 0.026, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 2, curveSegments: 12 })
        : new THREE.ShapeGeometry(f, 10);
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const v = y / L;
        uv.setXY(i, x / W + 0.5, v);
        pos.setZ(i, pos.getZ(i) + curva * L * v * v - 0.06 * W * (2 * x / W) ** 2);
    }
    g.computeVertexNormals();
    return g;
}

/** Cápsula de marfil a lo largo de +x, de 0 a largo. */
function hueso(largo, radio, M, mat = M.marfil) {
    const m = sombra(new THREE.Mesh(new THREE.CapsuleGeometry(radio, Math.max(0.001, largo - 2 * radio), 6, 16), mat));
    m.rotation.z = -Math.PI / 2;
    m.position.x = largo / 2;
    return m;
}

/** Bisagra: disco grafito, aro guinda y eje de acero, con el eje en z. */
/** Fondo encendido desde el centro: guinda brillante que se apaga hacia la orilla. */
function texturaLuz() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const r = g.createRadialGradient(128, 118, 10, 128, 128, 128);
    r.addColorStop(0, '#ff6f8f');
    r.addColorStop(0.45, '#e8285a');
    r.addColorStop(0.85, '#a3173f');
    r.addColorStop(1, '#6d0d29');
    g.fillStyle = r;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

function texturaResplandor() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    const r = g.createRadialGradient(64, 64, 30, 64, 64, 64);
    r.addColorStop(0, 'rgba(232,40,90,0.55)');
    r.addColorStop(0.5, 'rgba(232,40,90,0.18)');
    r.addColorStop(1, 'rgba(232,40,90,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

function bisagra(r, M) {
    const g = new THREE.Group();
    const disco = sombra(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.07, 28).rotateX(Math.PI / 2), M.grafito));
    const aro = new THREE.Mesh(new THREE.TorusGeometry(r * 0.78, r * 0.13, 10, 36), M.borde);
    aro.position.z = 0.036;
    const eje = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.32, r * 0.32, 0.1, 16).rotateX(Math.PI / 2), M.acero);
    g.add(disco, aro, eje);
    return g;
}

function geometriaEngrane(radio, dientes, grosor) {
    const forma = new THREE.Shape();
    const pasos = dientes * 4;
    for (let k = 0; k <= pasos; k++) {
        const a = (k / pasos) * Math.PI * 2;
        const r = (k % 4 === 0 || k % 4 === 1) ? radio : radio * 0.82;
        const p = [Math.cos(a) * r, Math.sin(a) * r];
        if (k === 0) forma.moveTo(...p); else forma.lineTo(...p);
    }
    const hueco = new THREE.Path();
    hueco.absarc(0, 0, radio * 0.3, 0, Math.PI * 2, true);
    forma.holes.push(hueco);
    return new THREE.ExtrudeGeometry(forma, { depth: grosor, bevelEnabled: false });
}

/** Uña: un cono doblado en arco, ancho en la base y con la punta hacia abajo. */
function geometriaUna(radio, largo, curva = 1.15) {
    const g = new THREE.ConeGeometry(radio, largo, 14, 8);
    g.translate(0, largo / 2, 0);
    const R = largo / curva;
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const th = (y / largo) * curva;
        pos.setXY(i, R - R * Math.cos(th) + x * Math.cos(th), R * Math.sin(th) - x * Math.sin(th));
    }
    g.computeVertexNormals();
    return g;
}

/** Punto y normal sobre un elipsoide (a: ángulo alrededor de y desde +z; u: altura de -1 a 1). */
function sobre(E, a, u, extra = 1) {
    const s = Math.sqrt(Math.max(0, 1 - u * u));
    const [rx, ry, rz] = E.r.map(r => r * extra);
    const p = new THREE.Vector3(E.c[0] + rx * s * Math.sin(a), E.c[1] + ry * u, E.c[2] + rz * s * Math.cos(a));
    const n = new THREE.Vector3((p.x - E.c[0]) / (rx * rx), (p.y - E.c[1]) / (ry * ry), (p.z - E.c[2]) / (rz * rz)).normalize();
    return { p, n };
}

/** Punto y normal en la cara (sobre la cabeza) para un (x, y) dado. */
function enCara(x, y) {
    const [cx, cy, cz] = CABEZA.c;
    const [rx, ry, rz] = CABEZA.r;
    const q = 1 - ((x - cx) / rx) ** 2 - ((y - cy) / ry) ** 2;
    if (q < 0.04) return null;
    const z = cz + rz * Math.sqrt(q);
    const p = new THREE.Vector3(x, y, z);
    const n = new THREE.Vector3((x - cx) / rx ** 2, (y - cy) / ry ** 2, (z - cz) / rz ** 2).normalize();
    return { p, n };
}

/** Orienta un objeto con su +z en la normal y su +y hacia `dir` (proyectado al plano tangente). */
function orientar(obj, n, dir) {
    const y = dir.clone().sub(n.clone().multiplyScalar(n.dot(dir))).normalize();
    const x = new THREE.Vector3().crossVectors(y, n).normalize();
    obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, n));
}

// ---------------------------------------------------------------- el búho
let P_MARFIL = '#eee7dc';
export function construirBuho(M, P) {
    if (P) P_MARFIL = P.marfil;
    const raiz = new THREE.Group();
    const vivos = { escamas: [], corazas: [], piezas: [], alas: [], frontales: [], patas: [] };

    // Núcleo: el mecanismo grafito que se ve entre las escamas, con cables guinda y engranes.
    const nucleo = sombra(new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), M.grafito));
    nucleo.scale.set(...CUERPO.r.map(r => r * 0.93));
    nucleo.position.set(...CUERPO.c);
    raiz.add(nucleo);
    const craneo = sombra(new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), M.grafito));
    craneo.scale.set(...CABEZA.r.map(r => r * 0.94));
    craneo.position.set(...CABEZA.c);
    raiz.add(craneo);
    for (const puntos of [
        [[-0.5, 0.3, 0.25], [-0.25, 0.05, 0.5], [0.1, -0.35, 0.5], [0.45, -0.55, 0.25]],
        [[0.5, 0.35, 0.2], [0.3, 0.1, 0.48], [-0.05, -0.15, 0.52], [-0.4, -0.6, 0.3]],
        [[-0.55, -0.1, 0.1], [-0.35, -0.6, 0.35], [0, -0.85, 0.38], [0.35, -0.75, 0.3]],
    ]) {
        const curva = new THREE.CatmullRomCurve3(puntos.map(([x, y, z]) => new THREE.Vector3(x * 0.85, y, z * 0.78)));
        raiz.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(curva, 48, 0.026, 10), M.cable)));
    }
    for (const [x, y, z, r] of [[0.28, 0.12, 0.42, 0.11], [-0.3, -0.42, 0.42, 0.12], [0.22, -0.55, 0.42, 0.09]]) {
        const e = sombra(new THREE.Mesh(geometriaEngrane(r, 12, 0.04), M.acero));
        e.position.set(x, y, z * 0.8);
        e.userData.gira = r;
        raiz.add(e);
        vivos.piezas.push({ obj: e, tipo: 'interno' });
    }

    // Ventanas del pecho: en cada costado falta un parche de plumas y se ve la máquina, un racimo de engranes de acero
    // con su aro neón, un cubo grafito y cables guinda (en la referencia, del lado izquierdo del búho es más grande).
    // óvalos verticales en los costados, como en la propuesta del torso
    const VENTANAS = [{ lado: 1, a: 56, u: 0.08, tam: 1.1 }, { lado: -1, a: 56, u: 0.08, tam: 1.1 }];
    const OVALO = [0.72, 1.3];
    for (const { lado, a, u, tam } of VENTANAS) {
        const { p, n: nn } = sobre(CUERPO, lado * a * D2R, u, 0.93);
        const g = new THREE.Group();
        g.position.copy(p);
        orientar(g, nn, new THREE.Vector3(0, 1, 0));
        g.scale.set(tam * OVALO[0], tam * OVALO[1], tam);
        const marco = sombra(new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.03, 10, 48), M.acero));
        marco.position.z = 0.02;
        g.add(marco);
        const fondo = sombra(new THREE.Mesh(new THREE.CircleGeometry(0.3, 40), M.grafito));
        fondo.position.z = -0.02;
        g.add(fondo);
        for (const [x, y, r, z, mat] of [[0, 0, 0.2, 0.0, M.acero], [-0.17, 0.17, 0.1, 0.03, M.acero], [0.16, 0.15, 0.08, 0.04, M.grafito], [0.12, -0.2, 0.09, 0.03, M.acero]]) {
            const e = sombra(new THREE.Mesh(geometriaEngrane(r, Math.round(r * 90), 0.04), mat));
            e.position.set(x, y, z);
            e.userData.gira = r * (x > 0 ? -1 : 1);
            vivos.piezas.push({ obj: e, tipo: 'interno' });
            g.add(e);
        }
        const aro = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.01, 8, 48), M.neon);
        aro.position.z = 0.05;
        const cubo = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.1, 18).rotateX(Math.PI / 2), M.grafito));
        const tapa = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.01, 8, 24), M.borde);
        tapa.position.z = 0.055;
        g.add(aro, cubo, tapa);
        for (const [a0, b0] of [[[0.26, 0.12, 0.0], [-0.1, -0.24, 0.05]], [[-0.27, -0.04, 0.0], [0.04, 0.26, 0.05]], [[0.22, -0.22, 0.0], [-0.24, 0.1, 0.03]]]) {
            const curva = new THREE.CatmullRomCurve3([new THREE.Vector3(...a0), new THREE.Vector3((a0[0] + b0[0]) / 2, (a0[1] + b0[1]) / 2, 0.11), new THREE.Vector3(...b0)]);
            g.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(curva, 24, 0.016, 8), M.cable)));
        }
        raiz.add(g);
    }
    const enVentana = (a, u) => VENTANAS.some(v => ((a - v.lado * v.a * D2R) / (0.4 * v.tam * OVALO[0])) ** 2 + ((u - v.u) / (0.3 * v.tam * OVALO[1])) ** 2 < 1);

    // El engrane del pecho: de él salen las secciones.
    const engrane = new THREE.Group();
    engrane.add(sombra(new THREE.Mesh(geometriaEngrane(ENGRANE.radio, 16, 0.05), M.acero)));
    const cubo = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 20).rotateX(Math.PI / 2), M.borde);
    cubo.position.z = 0.03;
    engrane.add(cubo);
    engrane.position.set(...ENGRANE.centro);
    raiz.add(engrane);

    // Logo del sitio en el pecho, iluminado: placa grafito con borde de acero, el búho (S y ceja) en neón guinda, el
    // ojo en blanco, y un halo suave detrás. Al desarmarse sale al frente con las demás piezas.
    const LOGO = { u: 0.13, ancho: 0.36 };
    const logo = new THREE.Group();
    {
        const { p, n: nn } = sobre(CUERPO, 0, LOGO.u, 1.0);
        logo.position.copy(p).addScaledVector(nn, 0.07);
        orientar(logo, nn, new THREE.Vector3(0, 1, 0));
        // insignia: carcasa grafito con cuatro tornillos, bisel de acero, aro neón guinda, fondo marfil iluminado desde
        // el centro, el búho en relieve negro con su ojo guinda, y una cúpula de vidrio encima
        const SX = 0.25, SY = 0.28;
        const ovalo = (r, z) => { const g = new THREE.Group(); g.scale.set(SX * r, SY * r, 1); g.position.z = z; logo.add(g); return g; };
        const carcasa = sombra(new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.14, 14, 72), M.grafito));
        carcasa.scale.z = 0.3;
        ovalo(1, 0.0).add(carcasa);
        const fondo = new THREE.Mesh(new THREE.CircleGeometry(1, 72), M.placaLogo);
        ovalo(1, 0.012).add(fondo);
        const bisel = sombra(new THREE.Mesh(new THREE.TorusGeometry(1, 0.055, 12, 72), M.acero));
        bisel.scale.z = 0.4;
        ovalo(1, 0.03).add(bisel);
        const aroGuinda = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.022, 8, 72), M.ojoLogo);
        ovalo(1, 0.026).add(aroGuinda);
        // resplandor guinda alrededor de la insignia, como si la luz saliera hacia las plumas
        const resplandor = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), M.resplandor);
        ovalo(1.9, -0.01).add(resplandor);
        for (let q = 0; q < 4; q++) {
            const ang = Math.PI / 4 + q * Math.PI / 2;
            const t = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.02, 14).rotateX(Math.PI / 2), M.acero));
            t.position.set(Math.cos(ang) * SX * 1.1, Math.sin(ang) * SY * 1.1, 0.04);
            const ranura = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.004, 0.004), M.grafito);
            ranura.position.z = 0.011;
            ranura.rotation.z = ang;
            t.add(ranura);
            logo.add(t);
        }
        const cupula = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.32), M.vidrioLogo);
        cupula.rotation.x = Math.PI / 2;
        cupula.position.z = -Math.cos(Math.PI * 0.32);
        const capa = new THREE.Group();
        capa.scale.set(SX * 0.95 / Math.sin(Math.PI * 0.32), SY * 0.95 / Math.sin(Math.PI * 0.32), 0.12);
        capa.position.z = 0.03;
        capa.add(cupula);
        logo.add(capa);
        const svg = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${MARK_BODY}"/><path d="${MARK_BROW}"/><path d="${MARK_EYE}"/></svg>`);
        const k = LOGO.ancho / 379;
        svg.paths.forEach((ruta, i) => {
            const geo = new THREE.ExtrudeGeometry(ruta.toShapes(true), { depth: 14, bevelEnabled: true, bevelThickness: 4, bevelSize: 2.5, bevelSegments: 3, curveSegments: 12 });
            geo.translate(-222.5, -248, 0);
            geo.scale(k, -k, -k); // voltear y y z a la vez conserva el sentido de las caras (normales hacia el frente)
            const m = new THREE.Mesh(geo, i === 2 ? M.ojoLogo : M.negroLogo);
            m.position.z = 0.014 + 22 * k;
            logo.add(m);
        });
        raiz.add(logo);
        vivos.frontales.push({ obj: logo, p0: logo.position.clone(), q0: logo.quaternion.clone(), dir: new THREE.Vector3(0, 0.3, 1) });
    }
    const bajoLogo = (a, u) => Math.abs(a) < 0.4 && u > LOGO.u - 0.08 && u < LOGO.u + 0.48;

    // Escamas del pecho: filas de marfil que se traslapan, cada una apuntando hacia abajo.
    let n = 0;
    for (let fila = 0; fila < 10; fila++) {
        const u = 0.93 - fila * 0.185;
        const cuantas = Math.round((fila < 3 ? 14 : 9) * Math.sqrt(1 - u * u)) + 3;
        for (let k = 0; k < cuantas; k++) {
            const ancho = fila < 3 ? 115 : fila < 6 ? 84 : 58; // arriba la gola da la vuelta; abajo asoma el mecanismo
            const a = lerp(-ancho, ancho, k / (cuantas - 1)) * D2R + (fila % 2 ? 0.05 : 0);
            if (enVentana(a, u) || bajoLogo(a, u)) continue;
            const { p, n: nn } = sobre(CUERPO, a, u, 1.0);
            // las puntas guinda dibujan una V de chevrón en el pecho, como en la propuesta del torso
            const brazoV = (fila - 2) * 0.12;
            const conPunta = fila >= 2 && fila < 9 && Math.abs(Math.abs(a) - brazoV) < 0.1;
            const L = 0.4 - Math.max(0, fila - 6) * 0.03;
            const m = entintar(sombra(new THREE.Mesh(hoja(L, 0.32, 0.35, false, true), conPunta ? M.pluma : M.marfil)), M, 34);
            m.position.copy(p).addScaledVector(nn, 0.012);
            orientar(m, nn, new THREE.Vector3(0, -1, 0));
            m.userData = { p0: m.position.clone(), q0: m.quaternion.clone(), n: nn, h: hash(n++) };
            raiz.add(m);
            vivos.escamas.push(m);
        }
    }

    // Gola: un anillo de plumitas redondas alrededor del cuello, entre la cara y el pecho.
    for (let k = 0; k < 26; k++) {
        const a = (k / 26) * Math.PI * 2;
        const nn = new THREE.Vector3(Math.sin(a), 0.35, Math.cos(a)).normalize();
        const m = sombra(new THREE.Mesh(hoja(0.24, 0.22, 0.25, true), M.marfilDoble));
        m.position.set(Math.sin(a) * 0.5, 0.6, CUERPO.c[2] + Math.cos(a) * 0.44);
        orientar(m, nn, new THREE.Vector3(0, -1, 0));
        raiz.add(m);
    }

    // Corazas: piezas curvas del cuerpo y de la cabeza (por fuera marfil, por dentro grafito) que salen volando.
    const coraza = (E, phi0, phiL, th0, thL, extra) => {
        const PI = Math.PI;
        const g = new THREE.Group();
        const geo = new THREE.SphereGeometry(1, 24, 14, phi0, phiL, th0, thL);
        const radios = E.r.map(r => r * extra);
        geo.scale(...radios);
        const medio = new THREE.Vector3(-Math.cos(phi0 + phiL / 2) * Math.sin(th0 + thL / 2), Math.cos(th0 + thL / 2), Math.sin(phi0 + phiL / 2) * Math.sin(th0 + thL / 2));
        const centro = medio.clone().multiply(new THREE.Vector3(...radios));
        geo.translate(-centro.x, -centro.y, -centro.z);
        g.add(sombra(new THREE.Mesh(geo, M.marfil)), new THREE.Mesh(geo, M.grafitoDoble));
        g.position.set(...E.c).add(centro);
        // en el cuerpo, cada coraza lleva su plumaje: filas de plumas que se traslapan hacia abajo y tapan las juntas
        if (E === CUERPO) {
            const filas = Math.max(3, Math.round(thL / 0.17));
            for (let f = 0; f <= filas; f++) {
                const th = th0 + thL * (f / filas) * 0.96 + 0.02;
                const cols = Math.max(2, Math.round((phiL * Math.sin(th) * E.r[0]) / 0.14));
                for (let k = 0; k <= cols; k++) {
                    const ph = phi0 + phiL * (k + (f % 2 ? 0.5 : 0)) / (cols + 1);
                    const u = new THREE.Vector3(-Math.cos(ph) * Math.sin(th), Math.cos(th), Math.sin(ph) * Math.sin(th));
                    const q = u.clone().multiply(new THREE.Vector3(...radios)).multiplyScalar(1.01);
                    const nn = new THREE.Vector3(q.x / radios[0] ** 2, q.y / radios[1] ** 2, q.z / radios[2] ** 2).normalize();
                    const ultima = f === filas && th > PI * 0.62;
                    const m = sombra(new THREE.Mesh(hoja(0.32 - f * 0.012, 0.27, 0.32, false, true), ultima ? M.pluma : M.marfil));
                    m.position.copy(q).sub(centro).addScaledVector(nn, 0.01);
                    orientar(m, nn, new THREE.Vector3(0, -1, 0));
                    g.add(m);
                }
            }
        }
        g.userData = { p0: g.position.clone(), dir: medio.clone().normalize(), h: hash(vivos.corazas.length + 50), cabeza: E === CABEZA };
        raiz.add(g);
        vivos.corazas.push(g);
    };
    const PI = Math.PI;
    coraza(CUERPO, 0.86 * PI, 0.42 * PI, 0.14 * PI, 0.3 * PI, 1.05);
    coraza(CUERPO, -0.28 * PI, 0.42 * PI, 0.14 * PI, 0.3 * PI, 1.05);
    coraza(CUERPO, 0.9 * PI, 0.36 * PI, 0.57 * PI, 0.27 * PI, 1.05);
    coraza(CUERPO, -0.26 * PI, 0.36 * PI, 0.57 * PI, 0.27 * PI, 1.05);
    coraza(CUERPO, 1.28 * PI, 0.44 * PI, 0.16 * PI, 0.62 * PI, 1.05);
    // (la coronilla va cubierta de plumas; solo la nuca lleva coraza que sale al desarmar)
    coraza(CABEZA, 1.2 * PI, 0.6 * PI, 0.35 * PI, 0.45 * PI, 1.04);

    // Cara: placas de cerámica extruidas sobre el chasis; no hay una máscara esférica visible.
    const cara = new THREE.Group();
    raiz.add(cara);
    const placa = (puntos, z, profundidad = 0.055, material = M.marfil) => {
        const forma = new THREE.Shape();
        puntos.forEach(([x, y], i) => i ? forma.lineTo(x, y) : forma.moveTo(x, y));
        forma.closePath();
        const geo = new THREE.ExtrudeGeometry(forma, {
            depth: profundidad, bevelEnabled: true, bevelThickness: 0.018,
            bevelSize: 0.012, bevelSegments: 3, curveSegments: 12,
        });
        const m = entintar(sombra(new THREE.Mesh(geo, [material, M.pico])), M, 28);
        m.position.z = z;
        cara.add(m);
        const interior = new THREE.Mesh(geo, M.grafito);
        interior.position.z = z - 0.025;
        interior.scale.set(0.985, 0.985, 0.7);
        cara.add(interior);
        return m;
    };
    const tornillo = (x, y, z, r = 0.022, padre = cara) => {
        const g = new THREE.Group();
        const arandela = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.35, r * 1.35, 0.012, 20).rotateX(PI / 2), M.grafito);
        const cabeza = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.02, 20).rotateX(PI / 2), M.acero);
        cabeza.position.z = 0.012;
        const ranura = new THREE.Mesh(new THREE.BoxGeometry(r * 1.25, r * 0.22, 0.006), M.grafito);
        ranura.position.z = 0.025;
        ranura.rotation.z = (x + y) * 2;
        g.add(arandela, cabeza, ranura);
        g.position.set(x, y, z);
        padre.add(g);
        return g;
    };
    const corona = (radio, z, material, tubo = 0.012) => {
        const aro = sombra(new THREE.Mesh(new THREE.TorusGeometry(radio, tubo, 12, 72), material));
        aro.position.z = z;
        return aro;
    };

    // La cabeza, reconstruida contra las referencias: un disco facial de cientos de plumitas que irradian de cada ojo, un
    // collar de plumas alrededor de la cara, ojos grandes con doble corona dentada, cejas y penachos hechos de plumas
    // superpuestas, pico ganchudo y una ventana mecánica en la frente. Todo se apoya en la superficie de la cabeza
    // (enCara), así la cara tiene volumen y de lado no parece un cartón. Los aros y nodos que rodean la cabeza en el
    // emblema son del dibujo, no del búho: no se construyen.
    const PI2 = Math.PI * 2;
    const guindaPlaca = new THREE.MeshPhysicalMaterial({ color: '#8f1c40', roughness: 0.45, metalness: 0.1, clearcoat: 0.6, clearcoatRoughness: 0.3, envMapIntensity: 0.6 });
    const sobreCara = (x, y, encima = 0) => {
        const c = enCara(x, y) || enCara(x * 0.92, y);
        if (!c) return null;
        c.p.addScaledVector(c.n, encima);
        return c;
    };
    const plumaEn = (x, y, dir, L, W, material, encima = 0.01, curva = 0.18, padre = cara, tinta = false) => {
        const c = sobreCara(x, y, encima);
        if (!c) return null;
        const m = sombra(new THREE.Mesh(hoja(L, W, curva, false, true), material));
        if (tinta) entintar(m, M, 34);
        m.position.copy(c.p);
        orientar(m, c.n, new THREE.Vector3(dir[0], dir[1], 0));
        padre.add(m);
        return m;
    };

    // Disco facial: anillos de plumitas finas que irradian desde cada ojo, en bloque (una sola llamada de dibujo).
    const rayo = hoja(1, 0.42, 0.32, false, true);
    const rayos = [];
    const lentes = [];
    OJOS.forEach(([ox, oy]) => {
        const s = ox < 0 ? -1 : 1;
        // el disco crece hasta cubrir las mejillas, un círculo grande como en la propuesta de la cara
        [0.215, 0.255, 0.295, 0.335, 0.375, 0.415, 0.455].forEach((r, anillo) => {
            const n = Math.round((PI2 * r) / 0.034);
            for (let k = 0; k < n; k++) {
                const a = (k / n) * PI2 + anillo * 0.11;
                const dx = Math.cos(a);
                const dy = Math.sin(a);
                const x = ox + dx * r;
                const y = oy + dy * r * 0.94;
                if (s * x < 0.015) continue; // la línea del pico separa los dos discos
                if (dy > 0.42 && s * dx < 0.7) continue; // arriba mandan las cejas
                const c = sobreCara(x, y, 0.004 + (0.4 - r) * 0.05);
                if (!c) continue;
                rayos.push({ p: c.p, n: c.n, dir: new THREE.Vector3(dx, dy, 0), L: 0.1 + r * 0.16, W: 0.04 + r * 0.05, tono: hash(rayos.length), guinda: anillo >= 3 && dy < 0.1 && (k + anillo) % 3 === 0 });
            }
        });
    });
    const matDisco = new THREE.MeshStandardMaterial({ map: texturaRayo(), roughness: 0.55, side: THREE.DoubleSide, envMapIntensity: 0.6 });
    const discos = new THREE.InstancedMesh(rayo, matDisco, rayos.length);
    discos.castShadow = true;
    discos.receiveShadow = true;
    const muestra = new THREE.Object3D();
    const claro = new THREE.Color(P_MARFIL);
    rayos.forEach((r, i) => {
        muestra.position.copy(r.p);
        orientar(muestra, r.n, r.dir);
        muestra.scale.set(r.W / 0.42, r.L, r.L);
        muestra.updateMatrix();
        discos.setMatrixAt(i, muestra.matrix);
        discos.setColorAt(i, r.guinda ? new THREE.Color('#b0284f') : claro.clone().lerp(new THREE.Color('#ffffff'), 0.5).multiplyScalar(0.92 + 0.08 * r.tono));
    });
    cara.add(discos);

    // Collar: plumas que bordean toda la cara en forma de corazón, con algunas puntas guinda.
    for (let k = 0; k < 44; k++) {
        const t = (k / 44) * PI2;
        const dx = Math.cos(t);
        const dy = Math.sin(t);
        if (dy > 0.55) continue; // arriba van los penachos y la frente
        const rx = 0.56 + 0.04 * Math.abs(dy);
        const x = dx * rx;
        const y = 0.9 + dy * (dy < 0 ? 0.46 : 0.4);
        plumaEn(x, y, [dx, dy], 0.2 + 0.04 * (1 - Math.abs(dy)), 0.1, (dy < -0.3 ? k % 2 : k % 3) ? M.marfil : M.pluma, 0.0, 0.3, cara, true);
    }

    // Ojos: tambor grafito, doble corona dentada, aro de marfil fino, iris oscuro con aro neón, pupila y domo de vidrio.
    OJOS.forEach(([ox, oy, oz], lado) => {
        const s = lado === 0 ? -1 : 1;
        const g = new THREE.Group();
        const c = enCara(ox, oy);
        g.position.copy(c.p).addScaledVector(c.n, 0.02);
        g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), c.n.clone().lerp(new THREE.Vector3(0, 0, 1), 0.55).normalize());
        cara.add(g);
        const tambor = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 64).rotateX(PI / 2), M.grafito));
        g.add(tambor);
        const borde = sombra(new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.018, 12, 80), M.marfil));
        borde.position.z = 0.04;
        g.add(borde);
        for (const [radio, cuantos, alto, z, mat] of [[0.182, 72, 0.026, 0.045, M.acero], [0.158, 56, 0.02, 0.05, M.grafito]]) {
            const diente = new THREE.BoxGeometry(0.008, alto, 0.02);
            const dientes = new THREE.InstancedMesh(diente, mat, cuantos);
            for (let k = 0; k < cuantos; k++) {
                const a = (k / cuantos) * PI2;
                muestra.position.set(Math.cos(a) * radio, Math.sin(a) * radio, z);
                muestra.rotation.set(0, 0, a - PI / 2);
                muestra.scale.set(1, 1, 1);
                muestra.updateMatrix();
                dientes.setMatrixAt(k, muestra.matrix);
            }
            g.add(dientes);
        }
        const iris = new THREE.Mesh(new THREE.CircleGeometry(0.142, 64), M.iris);
        iris.position.z = 0.058;
        const pupila = new THREE.Mesh(new THREE.CircleGeometry(0.06, 48), M.pupila);
        pupila.position.z = 0.062;
        const reflejo = new THREE.Mesh(new THREE.CircleGeometry(0.022, 24), new THREE.MeshBasicMaterial({ color: '#fffaf2', transparent: true, opacity: 0.85, toneMapped: false }));
        reflejo.position.set(-0.035, 0.045, 0.075);
        reflejo.scale.y = 0.55;
        const domo = new THREE.Mesh(new THREE.SphereGeometry(0.15, 40, 16, 0, PI2, 0, 0.24 * PI), M.vidrio);
        domo.rotation.x = PI / 2;
        domo.position.z = -0.05;
        domo.renderOrder = 5;
        g.add(iris, pupila, reflejo, domo);
        lentes.push(iris);
        vivos.frontales.push({ obj: g, p0: g.position.clone(), q0: g.quaternion.clone(), dir: new THREE.Vector3(s * 0.3, -0.05, 0.8) });

        // Ceja feroz: dos placas gruesas en V que nacen sobre el pico, bajan sobre la parte alta del ojo y suben afiladas
        // hacia el penacho, como en el emblema. Cada mitad gira con la curva de la cabeza.
        const ceja = new THREE.Group();
        ceja.position.set(s * 0.02, 0.94, 0.48);
        ceja.rotation.y = s * 0.3;
        cara.add(ceja);
        const placaCeja = (escala, z, material, tinta) => {
            const f = new THREE.Shape();
            f.moveTo(0, -0.03);
            f.bezierCurveTo(0.12, 0.02, 0.3, 0.13, 0.5, 0.4); // orilla de abajo: cae sobre el ojo
            f.bezierCurveTo(0.38, 0.33, 0.2, 0.22, 0.0, 0.13); // orilla de arriba
            f.closePath();
            const geo = new THREE.ExtrudeGeometry(f, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 3, curveSegments: 18 });
            // curvada a lo largo: la punta se va hacia atrás siguiendo la cabeza, así de lado no es una tabla
            const pos = geo.attributes.position;
            for (let i = 0; i < pos.count; i++) pos.setZ(i, pos.getZ(i) - 0.55 * pos.getX(i) ** 2);
            geo.computeVertexNormals();
            const m = sombra(new THREE.Mesh(geo, material === M.marfil ? [M.marfil, M.pico] : material));
            if (tinta) entintar(m, M, 26);
            m.scale.set(s * escala, escala, 1);
            m.position.z = z;
            ceja.add(m);
            return m;
        };
        placaCeja(1.0, -0.05, M.grafito, false); // sombra grafito detrás: da grosor al ceño
        // dos ranuras grabadas a lo largo de la ceja, como en el blindaje de las alas
        for (const [x0, y0, largo] of [[0.1, 0.04, 0.22], [0.15, 0.1, 0.17]]) {
            const ranura = new THREE.Mesh(new THREE.BoxGeometry(largo, 0.011, 0.012), M.grafito);
            const ang = Math.atan2(0.3, 0.42);
            const xm = x0 + Math.cos(ang) * largo / 2;
            ranura.position.set(s * xm, y0 + Math.sin(ang) * largo / 2, 0.165 - 0.55 * xm * xm);
            ranura.rotation.z = s * ang;
            ceja.add(ranura);
        }
        placaCeja(0.93, 0.0, M.marfil, true);
        const filo = placaCeja(0.75, 0.075, M.marfil, true); // segunda capa, más corta
        filo.position.y = 0.05;
        for (const [x, y] of [[0.12, 0.07], [0.3, 0.2]]) {
            const t = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.02, 14).rotateX(PI / 2), M.acero);
            t.position.set(s * x, y, 0.16);
            ceja.add(t);
        }
        vivos.frontales.push({ obj: ceja, p0: ceja.position.clone(), q0: ceja.quaternion.clone(), dir: new THREE.Vector3(s * 0.45, 0.22, 0.85) });

        // Penacho de cuerno: marfil al frente y dos guinda detrás, curvos hacia afuera y arriba desde la punta de la ceja.
        const penacho = new THREE.Group();
        penacho.position.set(s * 0.35, 1.1, 0.3);
        penacho.scale.setScalar(0.8); // como en la propuesta: penachos más chicos
        penacho.rotation.set(0, s * 0.45, -s * 0.28); // se abre hacia afuera, como en el emblema
        cara.add(penacho);
        for (const [k, material, z] of [[2, guindaPlaca, -0.06], [1, guindaPlaca, -0.03], [0, M.marfil, 0]]) {
            const f = new THREE.Shape();
            f.moveTo(-0.06, 0);
            f.bezierCurveTo(0.12, 0.04, 0.24, 0.24, 0.17, 0.5);
            f.bezierCurveTo(0.12, 0.3, 0.04, 0.16, -0.04, 0.1);
            f.closePath();
            const geo = new THREE.ExtrudeGeometry(f, { depth: 0.04, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 2, curveSegments: 16 });
            const m = sombra(new THREE.Mesh(geo, material === M.marfil ? [M.marfil, M.pico] : material));
            if (material === M.marfil) entintar(m, M, 26);
            const crece = 1 + k * 0.16;
            m.scale.set(s * crece, crece, 1);
            m.rotation.z = -s * k * 0.12;
            m.position.z = z;
            penacho.add(m);
        }

        // Barbilla: plumas cortas que bajan del pico hacia el pecho, una guinda al centro.
        for (let k = 0; k < 4; k++) {
            const ang = (-90 + s * (12 + k * 15)) * D2R;
            plumaEn(s * (0.03 + k * 0.05), 0.76 - k * 0.012, [Math.cos(ang), Math.sin(ang)], 0.2 - k * 0.015, 0.09, M.marfil, 0.015, 0.25, cara, true);
        }
    });
    plumaEn(0, 0.74, [0, -1], 0.24, 0.07, M.pluma, 0.03, 0.2, cara, false);

    // Coronilla mecánica, como en el emblema: un domo grafito entre los penachos, con engrane, eje vertical, dos arcos
    // neón y una concha de marfil que lo enmarca por arriba.
    const ventana = sobreCara(0, 1.2, -0.012);
    const coronilla = new THREE.Group();
    coronilla.position.copy(ventana.p);
    coronilla.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), ventana.n);
    cara.add(coronilla);
    const fondoCorona = sombra(new THREE.Mesh(new THREE.SphereGeometry(0.24, 32, 16, 0, PI2, 0, PI * 0.5).rotateX(PI / 2).scale(1, 1, 0.35), M.grafito));
    coronilla.add(fondoCorona);
    // Emblema de energía (el sitio es de energía): un rayo neón guinda dentro de un medallón de acero.
    const emblemaEnergia = new THREE.Group();
    emblemaEnergia.position.set(0, -0.01, 0.075);
    coronilla.add(emblemaEnergia);
    const medallon = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.03, 48).rotateX(PI / 2), M.grafito));
    const aroMedallon = sombra(new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.016, 12, 56), M.acero));
    aroMedallon.position.z = 0.015;
    const formaRayo = new THREE.Shape();
    [[0.035, 0.11], [-0.055, -0.005], [0.0, -0.005], [-0.035, -0.115], [0.06, 0.02], [0.008, 0.02], [0.045, 0.11]]
        .forEach(([x, y], i) => (i ? formaRayo.lineTo(x, y) : formaRayo.moveTo(x, y)));
    formaRayo.closePath();
    const rayoEnergia = new THREE.Mesh(new THREE.ExtrudeGeometry(formaRayo, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.005, bevelSegments: 2 }), M.neon);
    rayoEnergia.position.z = 0.02;
    emblemaEnergia.add(medallon, aroMedallon, rayoEnergia);
    // aro neón dentro del medallón y borde de acero en el domo, como en la propuesta
    const aroNeon = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.009, 8, 48), M.neon);
    aroNeon.position.z = 0.02;
    emblemaEnergia.add(aroNeon);
    const bordeDomo = sombra(new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.014, 10, 64), M.acero));
    bordeDomo.position.z = 0.005;
    coronilla.add(bordeDomo);

    // Coronilla de plumas, con el patrón de los búhos reales (búho real, búho cornudo): plumitas cortas en filas que se
    // traslapan, peinadas hacia atrás desde la frente, cada una con su raya oscura al centro. Cubren lo alto de la
    // cabeza y rodean la coronilla mecánica sin taparla.
    const plumasCorona = [];
    const centroCoronilla = sobreCara(0, 1.2, 0).p;
    for (let fila = 0; fila < 13; fila++) {
        const u = 0.995 - fila * 0.045;
        const vuelta = Math.max(3, Math.round(30 * Math.sqrt(1 - u * u)));
        for (let k = 0; k < vuelta; k++) {
            const a = (k / vuelta) * PI2 + (fila % 2 ? PI / vuelta : 0);
            const { p, n: nn } = sobre(CABEZA, a, u, 1.0);
            // la coronilla mecánica y los penachos quedan libres
            if (p.distanceTo(centroCoronilla) < 0.27) continue;
            if (p.z > 0.3 && p.y < 1.12) continue; // la cara de frente ya tiene su disco
            const atras = new THREE.Vector3(-p.x * 0.3, -0.25, -1);
            plumasCorona.push({ p: p.clone().addScaledVector(nn, 0.012 + fila * 0.002), n: nn, dir: atras, L: 0.16 + fila * 0.006, W: 0.1, tono: hash(400 + plumasCorona.length) });
        }
    }
    const capaCorona = new THREE.InstancedMesh(rayo, matDisco, plumasCorona.length);
    capaCorona.castShadow = true;
    capaCorona.receiveShadow = true;
    plumasCorona.forEach((r, i) => {
        muestra.position.copy(r.p);
        orientar(muestra, r.n, r.dir);
        muestra.scale.set(r.W / 0.42, r.L, r.L);
        muestra.updateMatrix();
        capaCorona.setMatrixAt(i, muestra.matrix);
        capaCorona.setColorAt(i, claro.clone().lerp(new THREE.Color('#ffffff'), 0.4).multiplyScalar(0.88 + 0.12 * r.tono));
    });
    cara.add(capaCorona);

    // Chevrones bajo el pico: dos placas en V de marfil con tornillo, sobre las plumas de la barbilla.
    for (const [k, y] of [[0, 0.79], [1, 0.71]]) {
        const f = new THREE.Shape();
        f.moveTo(-0.14, 0.05); f.lineTo(0, -0.04); f.lineTo(0.14, 0.05);
        f.lineTo(0.14, 0.0); f.lineTo(0, -0.095); f.lineTo(-0.14, 0.0); f.closePath();
        const geo = new THREE.ExtrudeGeometry(f, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 2 });
        const c = sobreCara(0, y, 0.035 + k * 0.012);
        const m = entintar(sombra(new THREE.Mesh(geo, [M.marfil, M.pico])), M, 28);
        m.position.copy(c.p);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), c.n);
        cara.add(m);
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.02, 12).rotateX(PI / 2), M.acero);
        t.position.set(0, -0.055, 0.045);
        m.add(t);
    }

    // Plumaje de la cabeza: filas de plumitas redondas que envuelven los lados y la nuca (la cara cubre el frente).
    for (let fila = 0; fila < 10; fila++) {
        const u = 0.86 - fila * 0.17;
        const vuelta = Math.round(16 * Math.sqrt(1 - u * u)) + 4;
        for (let k = 0; k <= vuelta; k++) {
            const a = lerp(52, 308, k / vuelta) * D2R + (fila % 2 ? 0.08 : 0);
            const { p, n: nn } = sobre(CABEZA, a, u, 1.0);
            const m = sombra(new THREE.Mesh(hoja(0.17, 0.15, 0.28, true), M.marfilDoble));
            m.position.copy(p).addScaledVector(nn, 0.01);
            orientar(m, nn, new THREE.Vector3(0, -1, -0.3));
            cara.add(m);
        }
    }

    // Pico ganchudo: un cono doblado hacia abajo, aplanado de lado.
    const pico = sombra(new THREE.Mesh(geometriaUna(0.12, 0.36, 1.05), M.picoMetal));
    const basePico = sobreCara(0, 1.0, 0.0);
    pico.position.copy(basePico.p).add(new THREE.Vector3(0, 0, 0.03));
    {
        // sale hacia el frente y un poco abajo, y se dobla hacia abajo (gancho); aplanado de lado
        const ejeY = new THREE.Vector3(0, -0.35, 1).normalize();
        const ejeX = new THREE.Vector3(0, -1, 0).addScaledVector(ejeY, -ejeY.dot(new THREE.Vector3(0, -1, 0))).normalize();
        const ejeZ = new THREE.Vector3().crossVectors(ejeX, ejeY);
        pico.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(ejeX, ejeY, ejeZ));
    }
    pico.scale.set(1, 1, 0.7);
    cara.add(pico);
    // cera: placa de acero en forma de escudo entre los ojos, donde nace el pico
    {
        const f = new THREE.Shape();
        f.moveTo(-0.075, 0.07); f.lineTo(0.075, 0.07); f.lineTo(0.06, -0.02); f.lineTo(0, -0.07); f.lineTo(-0.06, -0.02); f.closePath();
        const cera = sombra(new THREE.Mesh(new THREE.ExtrudeGeometry(f, { depth: 0.025, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 }), M.acero));
        const c = sobreCara(0, 1.06, 0.01);
        cera.position.copy(c.p);
        cera.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), c.n);
        cara.add(cera);
        for (const x of [-0.04, 0.04]) {
            const t = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.01, 10).rotateX(PI / 2), M.grafito);
            t.position.set(x, 0.035, 0.035);
            cera.add(t);
        }
    }

    // Alas: la derecha se arma; la izquierda es la misma con espejo en x (three voltea las caras solo).
    const pistones = [];
    for (const lado of [1, -1]) {
        const ala = construirAla(M);
        ala.raiz.position.set(lado * HOMBRO[0], HOMBRO[1], HOMBRO[2]);
        ala.raiz.scale.x = lado;
        raiz.add(ala.raiz);
        vivos.alas.push(ala);
        // dos pistones hidráulicos del costado del cuerpo al brazo del ala: sostienen el ala y su largo sale de la pose
        for (const [desde, padre, hasta] of [[[lado * 0.36, 0.12, 0.26], ala.brazo, [0.5, -0.1, 0.16]], [[lado * 0.4, -0.18, 0.22], ala.codo, [0.22, -0.08, 0.14]]]) {
            const g = new THREE.Group();
            const camisa = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 16), M.grafito));
            const vastago = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 12), M.acero));
            const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.012, 6, 18).rotateX(Math.PI / 2), M.borde);
            const ojo1 = sombra(new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), M.acero));
            const ojo2 = ojo1.clone();
            g.add(camisa, vastago, anillo, ojo1, ojo2);
            raiz.add(g);
            pistones.push({ g, camisa, vastago, anillo, ojo1, ojo2, desde: new THREE.Vector3(...desde), padre, hasta: new THREE.Vector3(...hasta) });
        }
    }
    const _a = new THREE.Vector3();
    const _b = new THREE.Vector3();
    const _arriba = new THREE.Vector3(0, 1, 0);
    function posarPistones() {
        raiz.updateMatrixWorld(true);
        for (const p of pistones) {
            _a.copy(p.desde);
            _b.copy(p.hasta);
            p.padre.localToWorld(_b);
            raiz.worldToLocal(_b);
            const largo = _a.distanceTo(_b);
            p.g.position.copy(_a);
            p.g.quaternion.setFromUnitVectors(_arriba, _b.clone().sub(_a).normalize());
            p.camisa.scale.set(1, largo * 0.55, 1);
            p.camisa.position.y = largo * 0.275;
            p.vastago.scale.set(1, largo * 0.5, 1);
            p.vastago.position.y = largo * 0.75;
            p.anillo.position.y = largo * 0.55;
            p.ojo1.position.y = 0;
            p.ojo2.position.y = largo;
        }
    }

    // Patas robóticas: muslo blindado, espinilla con pistón, tobillo con bisagra y aro neón, y cuatro dedos de acero de
    // tres segmentos con tapas de marfil, nudillos de bisagra y uñas metálicas curvas, al frente como en las referencias.
    for (const lado of [1, -1]) {
        const g = new THREE.Group();
        g.scale.set(lado * 1.25, 1.25, 1.25);
        g.position.set(lado * 0.26, -1.03, 0.26);
        // cadera: la pierna sale del cuerpo por una bisagra grande con aro neón, girada hacia el costado
        const cadera = bisagra(0.12, M);
        cadera.rotation.y = Math.PI / 2;
        cadera.position.set(-0.04, 0.04, -0.02);
        const aroCadera = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.01, 8, 36), M.neon);
        aroCadera.position.z = 0.075;
        cadera.add(aroCadera);
        g.add(cadera);
        // muslo: baja recto y apenas al frente (de frente las dos piernas quedan paralelas)
        const muslo = new THREE.Group();
        muslo.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, -1, 0.22).normalize());
        const MUSLO = 0.2, TIBIA = 0.6;
        muslo.add(hueso(MUSLO, 0.1, M, M.acero));
        // muslo emplumado, como el de un búho real: tres anillos de plumas que bajan hacia la rodilla
        for (let anillo = 0; anillo < 3; anillo++) {
            for (let k = 0; k < 9; k++) {
                const th = (k / 9) * Math.PI * 2 + anillo * 0.35;
                const n = new THREE.Vector3(0, Math.cos(th), Math.sin(th));
                const m = sombra(new THREE.Mesh(hoja(0.2 - anillo * 0.03, 0.17, 0.3, true), anillo === 2 && k % 2 === 0 ? M.pluma : M.marfilDoble));
                m.position.set(-0.12 + anillo * 0.06, n.y * 0.135, n.z * 0.135);
                orientar(m, n, new THREE.Vector3(1, 0, 0));
                muslo.add(m);
            }
        }
        // rodilla: tambor grafito ancho que asoma a los dos lados de la pierna, aro neón y tapa de marfil acanalada al frente
        const rodilla = new THREE.Group();
        rodilla.position.x = MUSLO;
        muslo.add(rodilla);
        rodilla.quaternion.copy(muslo.quaternion).invert().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2));
        const tambor = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.26, 32).rotateX(Math.PI / 2), M.grafito));
        rodilla.add(tambor);
        for (const z of [-0.132, 0.132]) {
            const cara = new THREE.Group();
            cara.position.z = z;
            if (z < 0) cara.rotation.y = Math.PI;
            const aro = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.013, 8, 40), M.neon);
            const tapa = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.02, 28).rotateX(Math.PI / 2), M.acero));
            const eje = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 16).rotateX(Math.PI / 2), M.grafito);
            eje.position.z = 0.012;
            cara.add(aro, tapa, eje);
            rodilla.add(cara);
        }
        // rótula de marfil acanalada, al frente de la rodilla (como en la propuesta)
        const rotula = new THREE.Group();
        // casco abierto: eje lateral (z de la rodilla) y centrado al frente de la pierna (-x de la rodilla)
        const casco = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.2, 28, 1, true, -Math.PI * 0.42, Math.PI * 0.84).rotateX(Math.PI / 2).rotateZ(-Math.PI / 2), M.marfilDoble));
        rotula.add(casco);
        for (let k = -2; k <= 2; k++) {
            const ranura = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.17), M.grafito);
            const ang = k * 0.22;
            ranura.position.set(-Math.cos(ang) * 0.168, Math.sin(ang) * 0.168, 0);
            rotula.add(ranura);
        }
        rodilla.add(rotula);

        // espinilla: acero pulido, larga y recta hacia abajo, con un pistón de marfil detrás y cables a lo largo
        const tibia = new THREE.Group();
        tibia.position.x = MUSLO;
        muslo.add(tibia);
        tibia.quaternion.copy(muslo.quaternion).invert().multiply(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, -1, -0.06).normalize()));
        tibia.add(hueso(TIBIA, 0.07, M, M.acero));
        const camisa = sombra(new THREE.Mesh(new THREE.CapsuleGeometry(0.042, TIBIA * 0.4, 6, 16).rotateZ(Math.PI / 2), M.marfil));
        camisa.position.set(TIBIA * 0.34, 0, -0.085);
        const vastago = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.2, 12).rotateZ(Math.PI / 2), M.acero);
        vastago.position.set(TIBIA * 0.72, 0, -0.085);
        const ojal = sombra(new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.01, 8, 20), M.acero));
        ojal.position.set(TIBIA * 0.9, 0, -0.085);
        tibia.add(camisa, vastago, ojal);
        for (const y of [-0.05, 0.05]) {
            const hilo = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, TIBIA * 0.8, 8).rotateZ(Math.PI / 2), M.grafito);
            hilo.position.set(TIBIA * 0.45, y, 0.06);
            tibia.add(hilo);
        }
        g.add(muslo);
        // el tobillo, al final de la espinilla, vuelve a la orientación de la pata: los dedos conservan su ángulo
        const tobillo = new THREE.Group();
        tobillo.position.x = TIBIA;
        tibia.add(tobillo);
        tobillo.quaternion.copy(muslo.quaternion.clone().multiply(tibia.quaternion)).invert();
        // tobillo: bola grafito con su aro neón (el único guinda de la pata, como en la propuesta)
        const bis = sombra(new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 16), M.grafito));
        const aroT = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 8, 32).rotateY(Math.PI / 2), M.neon);
        aroT.position.x = 0.075;
        aroT.rotation.y = 0;
        tobillo.add(bis, aroT);
        // garra abierta: los tres dedos de enfrente en abanico y el de atrás bien separado
        for (const [giro, largo, caida] of [[-0.78, 1.05, 0.28], [0, 1.2, 0.24], [0.78, 1.05, 0.28], [Math.PI, 0.8, 0.18]]) {
            const dedo = new THREE.Group();
            dedo.rotation.set(0, -Math.PI / 2 + giro, -caida);
            let padre = dedo;
            for (const [l, r] of [[0.14, 0.046], [0.12, 0.041], [0.1, 0.037]]) {
                padre.add(hueso(l * largo, r, M, M.acero));
                const aroDedo = new THREE.Mesh(new THREE.TorusGeometry(r * 1.05, r * 0.28, 8, 20).rotateY(Math.PI / 2), M.acero);
                aroDedo.position.x = l * largo * 0.88;
                padre.add(aroDedo);
                const tapa = sombra(new THREE.Mesh(new THREE.CapsuleGeometry(r * 0.55, l * largo * 0.45, 4, 10).rotateZ(Math.PI / 2), M.marfil));
                tapa.position.set(l * largo * 0.5, r * 0.75, 0);
                padre.add(tapa);
                const nudo = bisagra(r * 1.15, M);
                nudo.position.x = l * largo;
                nudo.scale.z = 0.6;
                padre.add(nudo);
                const sig = new THREE.Group();
                sig.position.x = l * largo;
                sig.rotation.z = -0.16;
                padre.add(sig);
                padre = sig;
            }
            const una = sombra(new THREE.Mesh(geometriaUna(0.06, 0.32 * largo), M.garra));
            una.rotation.z = -Math.PI / 2;
            padre.add(una);
            tobillo.add(dedo);
        }
        raiz.add(g);
        vivos.patas.push(g);
    }

    // Cola: abanico de 7 plumas hacia abajo y atrás.
    const cola = new THREE.Group();
    cola.position.set(0, -0.82, -0.32);
    cola.rotation.x = -2.45;
    for (let k = 0; k < 7; k++) {
        const m = entintar(sombra(new THREE.Mesh(hoja(1.05 - Math.abs(k - 3) * 0.06, 0.26, 0.15, false, true), M.pluma)), M, 32);
        m.rotation.z = (k - 3) * 0.17;
        m.position.z = -Math.abs(k - 3) * 0.01;
        cola.add(m);
    }
    raiz.add(cola);

    // Piezas sueltas que salen al desarmarse: tornillos, rodamientos y engranes alrededor del búho.
    for (let i = 0; i < 24; i++) {
        const tipo = i % 4 === 0 ? 'rodamiento' : i % 4 === 2 ? 'engrane' : 'tornillo';
        const g = new THREE.Group();
        if (tipo === 'tornillo') {
            g.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.11, 10), M.grafito)));
            const cabeza = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.024, 16), M.grafito));
            cabeza.position.y = 0.065;
            g.add(cabeza);
        } else if (tipo === 'rodamiento') {
            g.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 12, 32), M.acero)));
            g.add(new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 8, 24), M.grafito));
        } else {
            g.add(sombra(new THREE.Mesh(geometriaEngrane(0.075, 10, 0.03), M.acero)));
        }
        const a = lerp(-30, 210, (i + hash(i) * 0.6) / 24) * D2R;
        const r = 1.0 + 0.9 * hash(i + 3);
        g.userData = {
            desde: new THREE.Vector3(0, -0.1, 0.1),
            hasta: new THREE.Vector3(Math.cos(a) * r * 2.4, 0.35 + Math.sin(a) * r * 1.25, (hash(i + 9) - 0.4) * 1.4),
            h: hash(i + 17),
        };
        raiz.add(g);
        vivos.piezas.push({ obj: g, tipo: 'suelta' });
    }

    // Órbitas finas con puntos guinda, como en la referencia.
    const orbitas = [[3.2, 1.9, 0.18], [2.6, 2.25, -0.2]].map(([rx, ry, giro], k) => {
        const curva = new THREE.EllipseCurve(0, 0, rx, ry, 0, Math.PI * 2);
        const linea = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(curva.getPoints(160)), M.orbita);
        linea.position.set(0, 0.3, -0.4 - k * 0.2);
        linea.rotation.z = giro;
        for (const q of [0.12, 0.47, 0.78]) {
            const punto = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), M.borde);
            const p = curva.getPoint((q + k * 0.2) % 1);
            punto.position.set(p.x, p.y, 0);
            linea.add(punto);
        }
        raiz.add(linea);
        return linea;
    });

    // La cabeza (cráneo, cara y sus corazas) se agranda alrededor de su centro; el resto del cuerpo no cambia de tamaño.
    const cabeza = new THREE.Group();
    cabeza.position.set(...CABEZA.c);
    cabeza.scale.setScalar(ESCALA_CABEZA);
    const cabezaInterior = new THREE.Group();
    cabezaInterior.position.set(-CABEZA.c[0], -CABEZA.c[1], -CABEZA.c[2]);
    cabeza.add(cabezaInterior);
    for (const hijo of [craneo, cara, ...vivos.corazas.filter(g => g.userData.cabeza)]) cabezaInterior.add(hijo);
    raiz.add(cabeza);

    const eje = new THREE.Vector3(1, 0, 0);
    const giro = new THREE.Quaternion();
    function posar(e) {
        const o = e.abierto;
        const os = sale(o);
        // escamas: se levantan como tapas y se separan del núcleo
        for (const m of vivos.escamas) {
            const { p0, q0, n: nn, h } = m.userData;
            m.position.copy(p0).addScaledVector(nn, o * (0.1 + 0.22 * h));
            m.quaternion.copy(q0).multiply(giro.setFromAxisAngle(eje, -o * (0.5 + 0.7 * h)));
        }
        for (const g of vivos.corazas) {
            const { p0, dir, h } = g.userData;
            g.position.copy(p0).addScaledVector(dir, os * (0.6 + 0.4 * h));
            g.rotation.set(os * (h - 0.5) * 0.6, os * (hash(h * 9) - 0.5) * 0.7, os * (h - 0.3) * 0.6);
        }
        for (const { obj, p0, q0, dir } of vivos.frontales) {
            obj.position.copy(p0).addScaledVector(dir, os * 0.75);
            obj.quaternion.copy(q0).multiply(giro.setFromAxisAngle(eje, os * 0.18));
        }
        emblemaEnergia.scale.setScalar(1 + 0.035 * Math.sin(e.t * 3)); // el emblema late, suave

        for (const { obj, tipo } of vivos.piezas) {
            if (tipo === 'interno') { obj.rotation.z = e.engrane * 0.06 / obj.userData.gira; continue; }
            const { desde, hasta, h } = obj.userData;
            obj.visible = o > 0.002;
            obj.position.copy(desde).lerp(hasta, os);
            obj.scale.setScalar(Math.max(0.001, os));
            obj.rotation.set(e.t * (0.6 + h) + h * 6, e.t * 0.4 + h * 3, h * 5);
        }
        engrane.position.z = ENGRANE.centro[2] + 0.28 * o;
        engrane.scale.setScalar(1 + 0.25 * o);
        engrane.rotation.z = e.engrane;
        M.orbita.opacity = 0.4 * os;
        orbitas.forEach((l, k) => { l.visible = o > 0.002; l.rotation.z = (k ? -0.2 : 0.18) + (k ? -1 : 1) * e.t * 0.05; });
        for (const ala of vivos.alas) ala.posar(e);
        // En vuelo el búho se inclina hacia adelante, mira al frente y lleva las garras por delante.
        const vuelo = sale(e.ala);
        raiz.rotation.x = 0.22 * vuelo;
        cabeza.rotation.set(-0.2 * vuelo, 0.1 * vuelo, 0);
        for (const pata of vivos.patas) pata.rotation.x = -0.85 * vuelo;
        posarPistones();
    }

    return { raiz, posar, lentes, engrane };
}

/** Placa de blindaje: una lámina de marfil con bisel, punta redondeada y dos tornillos, a lo largo de +x. */
function placaBlindaje(M, largo, ancho) {
    const f = new THREE.Shape();
    f.moveTo(0, -ancho * 0.5);
    f.lineTo(largo * 0.82, -ancho * 0.42);
    f.quadraticCurveTo(largo, -ancho * 0.3, largo, 0);
    f.quadraticCurveTo(largo, ancho * 0.36, largo * 0.8, ancho * 0.5);
    f.lineTo(0, ancho * 0.44);
    f.closePath();
    const geo = new THREE.ExtrudeGeometry(f, { depth: 0.045, bevelEnabled: true, bevelThickness: 0.016, bevelSize: 0.012, bevelSegments: 3, curveSegments: 10 });
    // curvada sobre el hueso: las orillas se van hacia atrás, como una concha
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, pos.getZ(i) - 1.6 * pos.getY(i) ** 2);
    geo.computeVertexNormals();
    const g = new THREE.Group();
    g.add(entintar(sombra(new THREE.Mesh(geo, [M.marfil, M.pico])), M, 30));
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.02, 14).rotateX(Math.PI / 2), M.acero);
    t.position.set(largo * 0.3, 0, 0.075);
    g.add(t);
    // ranuras grabadas: dos líneas grafito a lo largo de la placa
    for (const y of [-0.17, 0.17]) {
        const ranura = new THREE.Mesh(new THREE.BoxGeometry(largo * 0.5, 0.011, 0.012), M.grafito);
        ranura.position.set(largo * 0.52, y * ancho, 0.075 - 1.6 * (y * ancho) ** 2);
        g.add(ranura);
    }
    return g;
}

/** Un ala (la derecha): hombro, codo y muñeca con bisagras grandes, huesos con blindaje de placas, coberteras en
 * filas y 22 plumas largas (10 secundarias y 12 primarias), cada una con su pistón como en las referencias. */
function construirAla(M) {
    const raiz = new THREE.Group();
    const brazo = new THREE.Group();
    raiz.add(brazo);
    const tendon = (largo, y) => {
        const g = new THREE.Group();
        const camisa = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, largo * 0.6, 12).rotateZ(Math.PI / 2), M.marfil));
        camisa.position.x = largo * 0.35;
        const vastago = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, largo * 0.5, 10).rotateZ(Math.PI / 2), M.acero);
        vastago.position.x = largo * 0.75;
        g.add(camisa, vastago);
        g.position.set(0, y, 0.06);
        return g;
    };
    const blindaje = (padre, largo, ancho, cuantas) => {
        for (let k = 0; k < cuantas; k++) {
            const p = placaBlindaje(M, largo / cuantas * 1.4, ancho * 1.25 * (1 - k * 0.08));
            p.position.set(k * largo / cuantas, 0.02, 0.1 + k * 0.012);
            p.rotation.x = -0.12 - 0.08 * k;
            p.rotation.y = -0.06;
            padre.add(p);
        }
    };
    // las bisagras van al frente del blindaje, a la vista como en la propuesta del ala
    const alFrente = g => { g.position.z = 0.17; return g; };
    brazo.add(alFrente(bisagra(0.19, M)), hueso(0.8, 0.11, M), tendon(0.8, -0.15), tendon(0.8, -0.06));
    const marcoBajo = (padre, largo) => {
        const barra = sombra(new THREE.Mesh(new THREE.BoxGeometry(largo * 0.9, 0.05, 0.04), M.grafito));
        barra.position.set(largo * 0.5, -0.1, 0.0);
        padre.add(barra);
    };
    marcoBajo(brazo, 0.8);
    for (const [largo, ancho, x, y, z, giro] of [[0.5, 0.46, -0.12, 0.06, 0.17, 0.3], [0.38, 0.36, -0.05, 0.1, 0.21, 0.42]]) {
        const hombrera = placaBlindaje(M, largo, ancho);
        hombrera.position.set(x, y, z);
        hombrera.rotation.set(-0.2, 0, giro);
        brazo.add(hombrera);
    }
    blindaje(brazo, 0.8, 0.36, 4);
    const codo = new THREE.Group();
    codo.position.x = 0.8;
    brazo.add(codo);
    codo.add(alFrente(bisagra(0.2, M)), hueso(0.95, 0.095, M), tendon(0.95, -0.13), tendon(0.95, 0.09));
    blindaje(codo, 0.95, 0.3, 4);
    const muneca = new THREE.Group();
    muneca.position.x = 0.95;
    codo.add(muneca);
    muneca.add(alFrente(bisagra(0.19, M)), hueso(0.6, 0.08, M), tendon(0.6, -0.09));
    // aro neón en las bisagras del codo y la muñeca
    for (const [padre, r] of [[brazo, 0.125], [codo, 0.13], [muneca, 0.125]]) {
        const aro = new THREE.Mesh(new THREE.TorusGeometry(r, 0.01, 8, 40), M.neon);
        aro.position.z = 0.24;
        padre.add(aro);
    }
    marcoBajo(codo, 0.95);
    marcoBajo(muneca, 0.6);
    // canales grafito sobre el blindaje, de bisagra a bisagra, con un cable guinda dentro (como en la propuesta del ala)
    for (const [padre, largo] of [[brazo, 0.8], [codo, 0.95], [muneca, 0.6]]) {
        for (const [y, conCable] of [[-0.03, true], [0.035, false]]) {
            const canal = sombra(new THREE.Mesh(new THREE.BoxGeometry(largo * 0.62, 0.032, 0.02), M.grafito));
            canal.position.set(largo * 0.52, y, 0.215);
            padre.add(canal);
            if (conCable) {
                const hilo = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, largo * 0.62, 8).rotateZ(Math.PI / 2), M.cable);
                hilo.position.set(largo * 0.52, y, 0.227);
                padre.add(hilo);
            }
        }
    }
    blindaje(muneca, 0.6, 0.24, 3);
    // álula: el grupito de plumas cortas que los búhos tienen en la muñeca, hacia el borde de ataque
    for (let k = 0; k < 3; k++) {
        const m = entintar(sombra(new THREE.Mesh(hoja(0.36 - k * 0.06, 0.12, 0.15, false, true, true), M.pluma)), M, 32);
        m.position.set(0.04 + k * 0.03, 0.06, 0.12 + k * 0.01);
        m.rotation.z = (-35 + k * 14) * D2R;
        muneca.add(m);
    }

    // coberteras: filas de escudos de marfil que tapan la base de las plumas largas
    const cubre = (padre, cuantas, largo, x0, paso, angulo, z, giro = 0) => {
        for (let k = 0; k < cuantas; k++) {
            const m = sombra(new THREE.Mesh(hoja(largo, 0.24, 0.18, true), M.marfilDoble));
            m.position.set(x0 + k * paso, -0.06, z + 0.002 * k);
            m.rotation.z = (angulo + giro * k - 90) * D2R;
            padre.add(m);
        }
    };
    cubre(brazo, 5, 0.42, 0.12, 0.15, -108, 0.04);
    cubre(codo, 9, 0.26, 0.04, 0.105, -112, 0.1, 3);
    cubre(muneca, 7, 0.24, 0.03, 0.08, -74, 0.1, 13);
    // segundo nivel: coberteras medianas con punta guinda sobre las plumas largas, como en la referencia
    const medianas = [];
    const segundoNivel = (padre, cuantas, largo, x0, paso, angulo, giro) => {
        for (let k = 0; k < cuantas; k++) {
            const pivote = new THREE.Group();
            pivote.position.set(x0 + k * paso, -0.05, 0.02);
            const m = entintar(sombra(new THREE.Mesh(hoja(largo - k * 0.01, 0.3, 0.12, false, true, true), M.pluma)), M, 32);
            pivote.add(m);
            padre.add(pivote);
            medianas.push({ pivote, abierto: angulo + giro * k, cerrado: -100 });
        }
    };
    segundoNivel(brazo, 5, 0.6, 0.1, 0.15, -112, 2);
    segundoNivel(codo, 10, 0.66, 0.04, 0.092, -122, 4.5);
    segundoNivel(muneca, 8, 0.74, 0.03, 0.06, -76, 11);

    // plumas: secundarias colgando del antebrazo, primarias en abanico desde la mano hacia afuera y arriba; plegadas,
    // todas se juntan atrás. Cada pluma lleva su pistón (camisa de marfil, vástago de acero y anillo guinda).
    const plumas = [];
    for (let i = 0; i < N_PLUMAS; i++) {
        const primaria = i >= N_SECUNDARIAS;
        const j = primaria ? i - N_SECUNDARIAS : i;
        const pivote = new THREE.Group();
        pivote.position.set(primaria ? 0.04 + j * 0.045 : 0.05 + j * 0.092, -0.04, -0.03 - 0.004 * i);
        const L = primaria ? (j < 8 ? 1.55 + j * 0.07 : 2.04 - (j - 7) * 0.14) : 1.25 - j * 0.012;
        const pluma = entintar(sombra(new THREE.Mesh(hoja(L, primaria ? 0.3 : 0.34, 0.1, false, true, true), M.pluma)), M, 32);
        // pistón de la pluma, encima de ella como en la referencia: camisa de marfil, vástago grafito y anillo guinda
        const camisa = entintar(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, L * 0.34, 14), M.marfil)), M, 40);
        camisa.position.set(0, L * 0.22, 0.085);
        const soporte = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.07, 0.05), M.grafito));
        soporte.position.set(0, 0.05, 0.04);
        const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, L * 0.45, 6), M.cable);
        cable.position.set(0.045, L * 0.24, 0.035);
        const vastago = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, L * 0.2, 10), M.grafito));
        vastago.position.set(0, L * 0.49, 0.085);
        const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.047, 0.011, 8, 18).rotateX(Math.PI / 2), M.borde);
        anillo.position.set(0, L * 0.39, 0.085);
        pivote.add(pluma, camisa, vastago, anillo, cable, soporte);
        // el ala se ahueca: hacia la punta las plumas se barren hacia atrás, así de lado tiene volumen
        pivote.rotation.y = primaria ? -0.08 - 0.03 * j : -0.06;
        (primaria ? muneca : codo).add(pivote);
        // las primarias se abren como dedos: 13.5° entre una y otra, así las puntas se separan
        plumas.push({ pivote, abierto: primaria ? -82 + j * 13.5 : -126 + j * 5, cerrado: -100 });
    }

    function posar(e) {
        const a = e.ala;
        // plegada va hacia atrás; abierta se curva hacia el frente, con el borde de ataque en arco como en la referencia
        raiz.rotation.y = lerp(-0.7, 0.32, a);
        raiz.rotation.x = 0.12 * a;
        brazo.rotation.z = lerp(-75, 40, a) * D2R + e.alzar;
        codo.rotation.z = lerp(155, -8, a) * D2R;
        muneca.rotation.z = lerp(-150, -16, a) * D2R;
        for (const { pivote, abierto, cerrado } of medianas) {
            pivote.rotation.z = (lerp(cerrado, abierto, a) - 90) * D2R;
            pivote.scale.setScalar(0.5 + 0.5 * a);
        }
        plumas.forEach(({ pivote, abierto, cerrado }, i) => {
            const k = e.plumas[i];
            pivote.rotation.z = (lerp(cerrado, abierto, k) - 90) * D2R;
            pivote.scale.setScalar(0.45 + 0.55 * Math.min(1, k));
        });
    }
    // tuberías de acero con abrazaderas, paralelas al hueso del brazo y del antebrazo
    for (const [padre, largo] of [[brazo, 0.8], [codo, 0.95]]) {
        for (const [y, r] of [[0.1, 0.018], [0.135, 0.012]]) {
            const tubo = sombra(new THREE.Mesh(new THREE.CylinderGeometry(r, r, largo * 0.85, 10).rotateZ(Math.PI / 2), M.acero));
            tubo.position.set(largo * 0.5, y, 0.1);
            padre.add(tubo);
        }
        for (let k = 1; k <= 3; k++) {
            const abrazadera = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 16).rotateY(Math.PI / 2), M.grafito);
            abrazadera.position.set(largo * (0.12 + k * 0.22), 0.115, 0.1);
            abrazadera.scale.set(1, 1.5, 1);
            padre.add(abrazadera);
        }
    }

    // cables guinda a lo largo del brazo y el antebrazo
    for (const [padre, largo] of [[brazo, 0.8], [codo, 0.95]]) {
        const curva = new THREE.CatmullRomCurve3([new THREE.Vector3(0.05, -0.07, 0.08), new THREE.Vector3(largo * 0.5, -0.12, 0.13), new THREE.Vector3(largo * 0.95, -0.07, 0.08)]);
        padre.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(curva, 24, 0.016, 8), M.cable)));
    }
    return { raiz, posar, brazo, codo };
}

// ---------------------------------------------------------------- módulos de sección
const ICONOS = {
    Buscar: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
    Acervo: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    Cronología: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    Permisos: '<path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/><circle cx="12" cy="14" r="2.6"/><path d="m10.6 16.2-.9 3.3 2.3-1.1 2.3 1.1-.9-3.3"/>',
    Polos: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/>',
    Análisis: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="8" r="2.5"/><circle cx="10" cy="18" r="2.5"/><path d="m8.4 6.4 7.2 1.2M6.9 8.4l2.2 7.2M16.6 10.1l-5 6"/>',
    Aprende: '<path d="M12 6.5C10 5 7 4.5 4 5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5Z"/><path d="M12 6.5V20"/>',
};

async function texturaIcono(nombre) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="256" height="256" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONOS[nombre]}</svg>`;
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    await img.decode();
    return lienzo(256, 256, x => x.drawImage(img, 0, 0, 256, 256));
}

/** Un módulo: una ficha de cerámica con canto guinda, respaldo grafito y el icono de la sección al frente. */
export async function construirModulo(M, P, nombre) {
    const g = new THREE.Group();
    const r = 0.11;
    const l = MODULO / 2;
    const forma = new THREE.Shape();
    forma.moveTo(-l + r, -l);
    forma.lineTo(l - r, -l); forma.quadraticCurveTo(l, -l, l, -l + r);
    forma.lineTo(l, l - r); forma.quadraticCurveTo(l, l, l - r, l);
    forma.lineTo(-l + r, l); forma.quadraticCurveTo(-l, l, -l, l - r);
    forma.lineTo(-l, -l + r); forma.quadraticCurveTo(-l, -l, -l + r, -l);
    const cara = M.ceramica.clone();
    const canto = M.borde.clone();
    const ficha = entintar(sombra(new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.018, bevelSize: 0.016, bevelSegments: 3, curveSegments: 10 }), [cara, canto])), M);
    const respaldo = sombra(new THREE.Mesh(new THREE.BoxGeometry(MODULO * 0.8, MODULO * 0.8, 0.06), M.grafito));
    respaldo.position.z = -0.04;
    const icono = new THREE.Mesh(new THREE.PlaneGeometry(MODULO * 0.62, MODULO * 0.62), new THREE.MeshBasicMaterial({ map: await texturaIcono(nombre), color: P.grafito, transparent: true, toneMapped: false }));
    icono.position.z = 0.07 + 0.018 + 0.002;
    g.add(respaldo, ficha, icono);
    return { grupo: g, cara, canto, icono };
}
