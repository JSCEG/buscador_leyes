// La planta de hidrógeno, hecha con código. Sistema Búho: cubiertas de marfil sobre estructura de grafito y acero. Cada
// fluido tiene su color y corre visible por tubos de vidrio. Las cubiertas se vuelven vidrio (adentro = 1) y cada equipo se
// separa en sus piezas (desarme = 1).
//
//   materiales(P, { movil })                  estudio(renderer, scene, M, { movil })
//   construir(M, P) → { raiz, posar(e), partes, anclas }
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { FLUIDOS, LINEAS, LOSA, PARTES } from './modelo.js';

const PI = Math.PI;
const clamp01 = x => Math.min(1, Math.max(0, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sale = x => 1 - (1 - clamp01(x)) ** 3;
const fract = x => x - Math.floor(x);
const azar = (a, b = 0) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };

export const P_PLANTA = {
    papel: '#fafafa', noche: '#0a0e12', tinta: '#171317', marfil: '#f3f1ec', grafito: '#303137', acero: '#a7abb3', guinda: '#9b2247',
    concretoDia: '#d4d5d3', concretoNoche: '#1b2026', panel: '#1b2a44', rosa: '#e57a9a',
};
// las luces de las baterías: guardan electricidad, no hidrógeno, y por eso no son verdes
const COLOR_BATERIA = '#ff4f86';

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
/** Letrero guinda de los contenedores de baterías. */
function texturaLetrero(texto, fondo) {
    const c = document.createElement('canvas');
    c.width = 192; c.height = 80;
    const x = c.getContext('2d');
    x.fillStyle = fondo;
    x.fillRect(0, 0, 192, 80);
    x.fillStyle = '#ffffff';
    x.font = '700 52px Manrope, system-ui, sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(texto, 96, 44);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}
function texturaPanel() {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 192;
    const x = c.getContext('2d');
    x.fillStyle = '#16243e';
    x.fillRect(0, 0, 128, 192);
    x.strokeStyle = 'rgba(190,210,240,0.55)';
    x.lineWidth = 1.5;
    for (let i = 0; i <= 4; i++) { x.beginPath(); x.moveTo((i * 128) / 4, 0); x.lineTo((i * 128) / 4, 192); x.stroke(); }
    for (let i = 0; i <= 6; i++) { x.beginPath(); x.moveTo(0, (i * 192) / 6); x.lineTo(128, (i * 192) / 6); x.stroke(); }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

export function materiales(P) {
    const env = { envMapIntensity: 0.8 };
    const M = {
        P, brillo: texturaBrillo(),
        marfil: new THREE.MeshPhysicalMaterial({ color: P.marfil, roughness: 0.5, metalness: 0.05, clearcoat: 0.35, clearcoatRoughness: 0.4, ...env }),
        cubierta: new THREE.MeshPhysicalMaterial({ color: P.marfil, roughness: 0.48, metalness: 0.05, clearcoat: 0.4, clearcoatRoughness: 0.35, transparent: true, side: THREE.DoubleSide, ...env }),
        grafito: new THREE.MeshStandardMaterial({ color: P.grafito, roughness: 0.5, metalness: 0.65, ...env }),
        acero: new THREE.MeshStandardMaterial({ color: P.acero, roughness: 0.34, metalness: 0.9, envMapIntensity: 1 }),
        cobre: new THREE.MeshStandardMaterial({ color: '#c8743c', roughness: 0.34, metalness: 0.9, envMapIntensity: 1 }),
        guinda: new THREE.MeshPhysicalMaterial({ color: P.guinda, roughness: 0.45, metalness: 0.1, clearcoat: 0.5, ...env }),
        panel: new THREE.MeshPhysicalMaterial({ map: texturaPanel(), roughness: 0.22, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.1 }),
        placa: new THREE.MeshStandardMaterial({ color: '#3a3b42', roughness: 0.42, metalness: 0.7, ...env }),
        vidrio: new THREE.MeshPhysicalMaterial({ color: '#dff2ff', roughness: 0.08, transparent: true, opacity: 0.16, clearcoat: 1, clearcoatRoughness: 0.05, depthWrite: false, side: THREE.DoubleSide }),
        agua: new THREE.MeshPhysicalMaterial({ color: FLUIDOS.agua.color, roughness: 0.15, transparent: true, opacity: 0.55, clearcoat: 1, depthWrite: false }),
        carbon: new THREE.MeshStandardMaterial({ color: '#17171a', roughness: 0.95, metalness: 0 }),
        metal: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
        ventana: new THREE.MeshBasicMaterial({ color: '#ffc77a', toneMapped: false }),
        lampara: new THREE.MeshBasicMaterial({ color: '#ffe2ad', toneMapped: false }),
        fluido: {},
    };
    for (const [k, f] of Object.entries(FLUIDOS)) M.fluido[k] = new THREE.MeshBasicMaterial({ color: f.color, toneMapped: false });
    M.neonVerde = new THREE.MeshBasicMaterial({ color: FLUIDOS.h2.color, toneMapped: false });
    M.neonNaranja = new THREE.MeshBasicMaterial({ color: FLUIDOS.elec.color, toneMapped: false });
    M.neonBateria = new THREE.MeshBasicMaterial({ color: COLOR_BATERIA, toneMapped: false });
    M.letrero = new THREE.MeshStandardMaterial({ map: texturaLetrero('SAEE', P.guinda), roughness: 0.6, envMapIntensity: 0.4 });
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
    Object.assign(sol.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 });
    sol.shadow.mapSize.set(2048, 2048);
    sol.shadow.bias = -0.0006;
    sol.shadow.normalBias = 0.025;
    const reflector = new THREE.DirectionalLight('#ffe6c8', 0.1);
    reflector.position.set(3, 8, 7);
    scene.add(cielo, sol, reflector);

    // como en las demás figuras de Aprende: solo recibe sombra y deja ver el papel del sitio
    const suelo = new THREE.Mesh(new THREE.CircleGeometry(26, 64).rotateX(-PI / 2), new THREE.ShadowMaterial({ color: '#000000', opacity: oscuro ? 0.35 : 0.14 }));
    suelo.position.y = -0.14;
    suelo.receiveShadow = true;

    const [ax, az] = [LOSA.x[1] - LOSA.x[0], LOSA.z[1] - LOSA.z[0]];
    const juntas = (() => {
        const c = document.createElement('canvas');
        c.width = c.height = 256;
        const x = c.getContext('2d');
        x.fillStyle = '#fff';
        x.fillRect(0, 0, 256, 256);
        x.strokeStyle = 'rgba(0,0,0,0.13)';
        x.lineWidth = 3;
        x.strokeRect(0, 0, 256, 256);
        const t = new THREE.CanvasTexture(c);
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(ax / 1.6, az / 1.6);
        t.anisotropy = 4;
        return t;
    })();
    const losa = new THREE.Mesh(new THREE.BoxGeometry(ax, 0.12, az), new THREE.MeshStandardMaterial({ color: P.concretoDia, map: juntas, roughness: 0.88, envMapIntensity: 0.3 }));
    losa.position.set((LOSA.x[0] + LOSA.x[1]) / 2, -0.06, (LOSA.z[0] + LOSA.z[1]) / 2);
    losa.receiveShadow = true;
    const borde = new THREE.Group();
    const cx = (LOSA.x[0] + LOSA.x[1]) / 2;
    const cz = (LOSA.z[0] + LOSA.z[1]) / 2;
    for (const [w, d, x, z] of [[ax, 0.03, cx, LOSA.z[0]], [ax, 0.03, cx, LOSA.z[1]], [0.03, az, LOSA.x[0], cz], [0.03, az, LOSA.x[1], cz]]) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, d), M.neonVerde);
        b.position.set(x, 0.015, z);
        borde.add(b);
    }
    scene.add(suelo, losa, borde);

    const estrellas = (() => {
        const n = 90;
        const pos = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
            const a = azar(i, 1) * PI * 2;
            const r = 24 + azar(i, 2) * 10;
            pos.set([Math.cos(a) * r, 5 + azar(i, 3) * 15, Math.sin(a) * r], i * 3);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const m = new THREE.Points(g, new THREE.PointsMaterial({ color: '#dfe9ff', size: 0.09, transparent: true, depthWrite: false, toneMapped: false }));
        m.frustumCulled = false;
        scene.add(m);
        return m;
    })();

    const dia = { sol: new THREE.Color('#ffffff'), losa: new THREE.Color(oscuro ? '#9a9b9a' : P.concretoDia) };
    const noche = { sol: new THREE.Color('#9db6ff'), losa: new THREE.Color(P.concretoNoche) };
    const v = new THREE.Vector3();
    function actualizar(e) {
        const n = e.noche;
        // el sol cruza el cielo con la hora; de noche, luna fría y baja
        const a = lerp(0.95, -0.2, n);
        if (e.horaSol !== undefined && e.horaSol >= 0 && e.horaSol <= 1) v.set(lerp(-11, 11, e.horaSol), 3 + 11 * Math.sin(PI * e.horaSol), 6);
        else v.set(-6 - 3 * n, 4 + 9 * Math.max(0, Math.sin(a * 1.1 + 0.6)), 6 - 12 * n);
        sol.position.copy(v);
        sol.intensity = lerp(2, 0.3, n);
        sol.color.copy(dia.sol).lerp(noche.sol, n);
        cielo.intensity = lerp(0.72, 0.16, n);
        reflector.intensity = lerp(0.1, 0.55, n);
        scene.environmentIntensity = lerp(0.5, 0.2, n);
        losa.material.color.copy(dia.losa).lerp(noche.losa, n);
        M.neonVerde.color.set(FLUIDOS.h2.color).multiplyScalar(0.4 + 0.6 * n);
        borde.visible = n > 0.05;
        estrellas.material.opacity = clamp01((n - 0.3) * 1.5);
        estrellas.visible = estrellas.material.opacity > 0.01;
    }
    return { actualizar };
}

// ------------------------------------------------------------------ piezas sueltas
const sombra = m => { m.castShadow = true; m.receiveShadow = true; return m; };
const caja = (w, h, d, m) => sombra(new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), m));
const cil = (r, h, m, rTop = r, seg = 24) => sombra(new THREE.Mesh(new THREE.CylinderGeometry(rTop, r, h, seg).translate(0, h / 2, 0), m));
const cilX = (r, l, m, seg = 16) => sombra(new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, seg).rotateZ(PI / 2), m));
const cilZ = (r, l, m, seg = 16) => sombra(new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, seg).rotateX(PI / 2), m));
const aro = (r, t, m) => new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 36).rotateX(PI / 2), m);
/** Recipiente vertical con tapas abombadas, base en y = 0. */
function recipienteGeo(r, h) {
    const puntos = [];
    const tapa = r * 0.55;
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * (PI / 2); puntos.push(new THREE.Vector2(Math.sin(a) * r, tapa - Math.cos(a) * tapa)); }
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * (PI / 2); puntos.push(new THREE.Vector2(Math.cos(a) * r, h - tapa + Math.sin(a) * tapa)); }
    return new THREE.LatheGeometry(puntos, 32);
}
function engrane(radio, dientes, grosor) {
    const f = new THREE.Shape();
    const pasos = dientes * 4;
    for (let k = 0; k <= pasos; k++) {
        const a = (k / pasos) * PI * 2;
        const r = k % 4 < 2 ? radio : radio * 0.8;
        if (k === 0) f.moveTo(Math.cos(a) * r, Math.sin(a) * r); else f.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    const h = new THREE.Path();
    h.absarc(0, 0, radio * 0.3, 0, PI * 2, true);
    f.holes.push(h);
    return new THREE.ExtrudeGeometry(f, { depth: grosor, bevelEnabled: false }).translate(0, 0, -grosor / 2);
}

// ------------------------------------------------------------------ la planta
export function construir(M, P) {
    const raiz = new THREE.Group();
    const partes = Object.fromEntries(PARTES.map(p => [p.id, []]));
    const movibles = [];
    const giran = [];
    const brillos = [];
    const luces = [];
    const lampNoche = new THREE.Color('#ffe2ad');
    const cubiertas = {};
    const enTecho = { pila: [], baterias: [] };
    const unidad = (id, x, z) => { const g = new THREE.Group(); g.position.set(x, 0, z); raiz.add(g); partes[id].push(g); return g; };
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
    // burbujas: en coordenadas de la planta; se apagan con su proceso
    const burbujas = { h2: [], o2: [], ch4: [], agua: [] };
    const burbuja = (fluido, proceso, x, z, y0, y1, vel = 0.4, r = 0.022, abre = 0.03) => burbujas[fluido].push({ proceso, x, z, y0, y1, vel, r, abre, h: Math.random === undefined ? 0 : azar(burbujas[fluido].length, x + z) });

    // --------- 1 · sol y viento
    {
        const g = unidad('renovable', -3.6, -3.55);
        const filas = 4;
        const cols = 8;
        const n = filas * cols;
        const panel = new THREE.InstancedMesh(new THREE.BoxGeometry(0.52, 0.02, 0.36), M.panel, n);
        const poste = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.014, 0.014, 0.3, 6).translate(0, 0.15, 0), M.acero, n);
        const m = new THREE.Matrix4();
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.42, 0, 0));
        for (let f = 0; f < filas; f++) {
            for (let c = 0; c < cols; c++) {
                const [x, z] = [(c - (cols - 1) / 2) * 0.56, (f - (filas - 1) / 2) * 0.54];
                m.compose(new THREE.Vector3(x, 0.32, z), q, new THREE.Vector3(1, 1, 1));
                panel.setMatrixAt(f * cols + c, m);
                m.makeTranslation(x, 0, z);
                poste.setMatrixAt(f * cols + c, m);
            }
        }
        panel.castShadow = true;
        g.add(mover(panel, [0, 0.9, 0]), poste);
        // tablero
        const tablero = caja(0.34, 0.42, 0.16, M.grafito);
        tablero.position.set(0, 0, 1.3);
        g.add(tablero);
        const t = unidad('renovable', -5.65, -4.1);
        const torre = cil(0.13, 3.5, M.marfil, 0.055);
        t.add(mover(torre, [0, 0, 0]));
        const gondola = new THREE.Group();
        gondola.position.set(0, 3.55, 0.05);
        t.add(mover(gondola, [0, 1.2, 0]));
        const caj = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.17, 0.46), M.marfil));
        gondola.add(caj);
        const rotor = new THREE.Group();
        rotor.position.z = 0.28;
        gondola.add(rotor);
        rotor.add(sombra(new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 12), M.grafito)));
        const f = new THREE.Shape();
        f.moveTo(0.03, 0); f.lineTo(0.075, 0.25); f.lineTo(0.012, 1.55); f.lineTo(-0.012, 1.55); f.lineTo(-0.03, 0.2); f.closePath();
        for (let k = 0; k < 3; k++) {
            const a = sombra(new THREE.Mesh(new THREE.ExtrudeGeometry(f, { depth: 0.012, bevelEnabled: false }), M.marfil));
            a.rotation.z = (k * PI * 2) / 3;
            rotor.add(a);
        }
        giran.push({ obj: rotor, eje: 'z', vel: () => 1.1 });
        const aviso = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), M.neonNaranja);
        aviso.position.set(0, 0.11, -0.1);
        gondola.add(aviso);
        brillo(gondola, 0, 0.11, -0.1, 0.5, FLUIDOS.elec.color, null, 0.55);
    }

    // --------- 2 · agua
    {
        const g = unidad('agua', -5.1, 0.2);
        const r = 0.62;
        const h = 1.55;
        const base = cil(r * 1.04, 0.08, M.grafito);
        g.add(base);
        const agua = sombra(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.94, r * 0.94, h * 0.72, 32).translate(0, h * 0.36 + 0.08, 0), M.agua));
        agua.castShadow = false;
        g.add(agua);
        const casco = sombra(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 36, 1, true).translate(0, h / 2 + 0.08, 0), M.cubierta));
        g.add(mover(casco, [0, 2.1, 0]));
        const tapa = sombra(new THREE.Mesh(new THREE.SphereGeometry(r, 32, 10, 0, PI * 2, 0, PI / 2).scale(1, 0.26, 1).translate(0, h + 0.08, 0), M.cubierta));
        g.add(mover(tapa, [0, 3, 0]));
        const faja = aro(r * 1.01, 0.018, M.fluido.agua);
        faja.position.y = h * 0.72 + 0.08;
        g.add(mover(faja, [0, 2.1, 0]));
        for (let k = 0; k < 16; k++) burbuja('agua', 'verde', -5.1 + (azar(k, 3) - 0.5) * 0.9, 0.2 + (azar(k, 4) - 0.5) * 0.9, 0.15, 1.15, 0.13, 0.016);
        // ósmosis inversa: tres tubos de membrana sobre un bastidor
        const o = unidad('agua', -5.35, -1.25);
        const marco = caja(1.06, 0.06, 0.82, M.grafito);
        marco.position.y = 0.04;
        o.add(marco);
        for (const [x, z] of [[-0.45, -0.34], [0.45, -0.34], [-0.45, 0.34], [0.45, 0.34]]) {
            const c = cil(0.018, 0.72, M.acero);
            c.position.set(x, 0.05, z);
            o.add(c);
        }
        for (let k = 0; k < 3; k++) {
            const tubo = cilX(0.085, 0.96, M.marfil);
            tubo.position.set(0, 0.28 + k * 0.2, -0.16 + k * 0.16);
            o.add(mover(tubo, [0, 0.45 + k * 0.32, 0], k * 0.2));
            const banda = cilX(0.088, 0.05, M.fluido.agua);
            banda.position.copy(tubo.position);
            o.add(mover(banda, [0, 0.45 + k * 0.32, 0], k * 0.2));
        }
    }

    // --------- pilas de celdas (electrolizador y pila de combustible): placas a lo largo de x
    function pilaDeCeldas(padre, x, z, { n = 13, h = 0.46, d = 0.46, membrana = M.neonNaranja, proceso = 'verde', burb = true, sale = 0 }) {
        const g = new THREE.Group();
        g.position.set(x, 0.22, z);
        padre.add(g);
        const paso = 0.058;
        const largo = (n - 1) * paso;
        for (let i = 0; i < n; i++) {
            const placa = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.03, h, d), M.placa));
            const xp = (i - (n - 1) / 2) * paso;
            placa.position.set(xp, h / 2, 0);
            g.add(mover(placa, [xp * 1.9, 0.02, 0], 0.15 * Math.abs(i - (n - 1) / 2) / n));
            if (i < n - 1) {
                const mem = new THREE.Mesh(new THREE.BoxGeometry(0.012, h * 0.82, d * 0.82), membrana);
                mem.position.set(xp + paso / 2, h / 2, 0);
                g.add(mover(mem, [(xp + paso / 2) * 1.9, 0.02, 0], 0.15 * Math.abs(i - (n - 1) / 2) / n));
            }
        }
        for (const lado of [-1, 1]) {
            const tapa = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.07, h * 1.2, d * 1.2), M.acero));
            tapa.position.set(lado * (largo / 2 + 0.05), h / 2, 0);
            g.add(mover(tapa, [lado * (largo * 0.95 + 0.1), 0.02, 0]));
        }
        for (const [y, zz] of [[0.02, -d * 0.55], [0.02, d * 0.55], [h * 1.02, -d * 0.55], [h * 1.02, d * 0.55]]) {
            const v = cilX(0.012, largo + 0.2, M.acero, 8);
            v.position.set(0, y, zz);
            g.add(mover(v, [0, 0, Math.sign(zz) * 0.35]));
        }
        // colectores: por un lado sale el hidrógeno, por el otro el oxígeno
        const colA = cilX(0.04, largo + 0.1, M.vidrio, 12);
        colA.position.set(0, h + 0.08, d * 0.3);
        const colB = cilX(0.032, largo + 0.1, M.vidrio, 12);
        colB.position.set(0, h + 0.08, -d * 0.3);
        g.add(mover(colA, [0, 0.45, 0.1]), mover(colB, [0, 0.45, -0.1]));
        const pieIzq = caja(0.08, 0.22, d, M.grafito);
        pieIzq.position.set(-largo / 2, -0.22, 0);
        const pieDer = pieIzq.clone();
        pieDer.position.x = largo / 2;
        g.add(pieIzq, pieDer);
        if (burb) {
            const cuantas = 7;
            for (let k = 0; k < cuantas; k++) burbuja('h2', proceso, padre.position.x + x + (azar(k, x) - 0.5) * largo, padre.position.z + z + d * 0.52, 0.3, 0.22 + h + 0.08, 0.5, 0.017);
            for (let k = 0; k < Math.ceil(cuantas / 2); k++) burbuja('o2', proceso, padre.position.x + x + (azar(k + 9, x) - 0.5) * largo, padre.position.z + z - d * 0.52, 0.3, 0.22 + h + 0.08, 0.5, 0.022);
        }
        return g;
    }
    /** Nave con piso, cuatro paredes y techo de cubierta: al desarmar, cada una se va por su lado. */
    function nave(padre, w, d, h, { franja = M.fluido.h2 } = {}) {
        const piso = caja(w + 0.1, 0.08, d + 0.1, M.grafito);
        padre.add(piso);
        const espesor = 0.03;
        const pared = (ww, dd) => sombra(new THREE.Mesh(new THREE.BoxGeometry(ww, h, dd).translate(0, h / 2 + 0.08, 0), M.cubierta));
        const atras = pared(w, espesor); atras.position.z = -d / 2;
        // el frente lleva un ventanal: se ven las pilas sin abrir nada
        const frente = new THREE.Group();
        frente.position.z = d / 2;
        const ladoA = w * 0.1;
        const dintel = h * 0.2;
        const antepecho = h * 0.3;
        const trozo = (ww, hh, x, y) => { const t = sombra(new THREE.Mesh(new THREE.BoxGeometry(ww, hh, espesor).translate(0, hh / 2, 0), M.cubierta)); t.position.set(x, y, 0); frente.add(t); };
        trozo(ladoA, h, -w / 2 + ladoA / 2, 0.08);
        trozo(ladoA, h, w / 2 - ladoA / 2, 0.08);
        trozo(w - 2 * ladoA, dintel, 0, 0.08 + h - dintel);
        trozo(w - 2 * ladoA, antepecho, 0, 0.08);
        const cristal = new THREE.Mesh(new THREE.PlaneGeometry(w - 2 * ladoA, h - dintel - antepecho), M.vidrio);
        cristal.position.set(0, 0.08 + antepecho + (h - dintel - antepecho) / 2, 0);
        frente.add(cristal);
        const izq = pared(espesor, d); izq.position.x = -w / 2;
        const der = pared(espesor, d); der.position.x = w / 2;
        padre.add(mover(atras, [0, 0, -d * 0.95], 0.1), mover(frente, [0, 0, d * 0.95], 0.1), mover(izq, [-w * 0.55, 0, 0], 0.1), mover(der, [w * 0.55, 0, 0], 0.1));
        const techo = sombra(new THREE.Mesh(new THREE.BoxGeometry(w + 0.12, 0.06, d + 0.12).translate(0, h + 0.11, 0), M.cubierta));
        padre.add(mover(techo, [0, 2.3, 0]));
        // columnas de las esquinas
        for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
            const c = caja(0.06, h + 0.06, 0.06, M.grafito);
            c.position.set((x * w) / 2, 0.08, (z * d) / 2);
            padre.add(mover(c, [x * w * 0.3, 0, z * d * 0.5], 0.05));
        }
        const f1 = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, 0.03, 0.012), franja);
        f1.position.set(0, h * 0.92, d / 2 + 0.018);
        padre.add(mover(f1, [0, 0, d * 0.95], 0.1));
        return { techoY: h + 0.14 };
    }
    /** Abanico en el techo. */
    function abanico(padre, x, y, z, r, velFn) {
        const base = cil(r * 1.12, 0.05, M.grafito);
        base.position.set(x, y, z);
        const g = new THREE.Group();
        g.position.set(x, y + 0.06, z);
        for (let k = 0; k < 5; k++) {
            const a = sombra(new THREE.Mesh(new THREE.BoxGeometry(r * 0.9, 0.012, r * 0.32).translate(r * 0.46, 0, 0), M.acero));
            a.rotation.y = (k * PI * 2) / 5;
            a.rotation.x = 0.2;
            g.add(a);
        }
        padre.add(base, g);
        giran.push({ obj: g, eje: 'y', vel: velFn });
        return [base, g];
    }

    // --------- 3 · electrolizador
    {
        const g = unidad('electrolizador', -2.5, 0.1);
        nave(g, 2.95, 1.66, 1.42);
        for (const [x, z] of [[-0.68, -0.4], [0.68, -0.4], [-0.68, 0.4], [0.68, 0.4]]) {
            const s = pilaDeCeldas(g, x, z, {});
            mover(s, [x * 0.35, 0.05, z * 1.1], 0.05);
        }
        // barras de cobre desde el rectificador
        const barra = caja(2.2, 0.03, 0.05, M.cobre);
        barra.position.set(0, 0.86, -0.72);
        g.add(mover(barra, [0, 0.6, -0.5]));
        luz(g, 0, 1.0, 0, FLUIDOS.h2.color, 2.6, 'verde', 4);
        brillo(g, 0, 0.75, 0, 2.6, FLUIDOS.h2.color, 'verde', 0.22);
        const r = unidad('electrolizador', -2.5, -1.3);
        const gabinete = caja(1.5, 0.92, 0.55, M.grafito);
        r.add(mover(gabinete, [0, 0, -1.1]));
        for (let k = 0; k < 5; k++) {
            const rejilla = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.02, 0.01), M.neonNaranja);
            rejilla.position.set(0, 0.28 + k * 0.1, 0.28);
            r.add(mover(rejilla, [0, 0, -1.1]));
        }
        const [a1, a2] = abanico(r, 0, 0.92, 0, 0.17, () => 1);
        mover(a1, [0, 0.5, -1.1]); mover(a2, [0, 0.5, -1.1]);
    }

    // --------- 4 · separadores
    {
        const recipiente = (id, x, z, r, h, fluido, y0, marcaAgua) => {
            const g = unidad(id, x, z);
            for (const [lx, lz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
                const p = cil(0.02, 0.2, M.acero, 0.02, 8);
                p.position.set((lx * r) / 1.5, 0, (lz * r) / 1.5);
                g.add(p);
            }
            const aguaG = sombra(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.9, r * 0.9, h * marcaAgua, 24).translate(0, h * marcaAgua * 0.5 + y0 + 0.03, 0), M.agua));
            aguaG.castShadow = false;
            g.add(aguaG);
            const casco = sombra(new THREE.Mesh(recipienteGeo(r, h).translate(0, y0, 0), M.cubierta));
            g.add(mover(casco, [0, 2.1, 0]));
            const f = aro(r * 1.015, 0.018, M.fluido[fluido]);
            f.position.y = y0 + h * 0.82;
            g.add(mover(f, [0, 2.1, 0]));
            const cuantas = fluido === 'h2' ? 12 : 6;
            for (let k = 0; k < cuantas; k++) burbuja(fluido, 'verde', x + (azar(k, 7) - 0.5) * r * 1.2, z + (azar(k, 8) - 0.5) * r * 1.2, y0 + 0.05, y0 + h * 0.5, 0.45, 0.02);
            return g;
        };
        recipiente('separadores', -0.35, -0.45, 0.33, 1.42, 'h2', 0.2, 0.42);
        recipiente('separadores', -0.35, 0.75, 0.27, 1.12, 'o2', 0.2, 0.42);
        // retorno de agua al electrolizador
        const retorno = cilX(0.03, 0.8, M.acero, 10);
        retorno.position.set(-0.85, 0.3, 0.15);
        partes.separadores[0].parent.add(retorno);
        // venteo del oxígeno: el cuello de ganso va sujeto a un mástil y por la punta salen los soplos al aire
        const o2 = partes.separadores[1];
        const mastil = cil(0.013, 2.5, M.acero, 0.013, 8);
        mastil.position.set(0, 0, 0.32);
        o2.add(mastil);
        for (const y of [1.75, 2.35]) {
            const brazo = caja(0.012, 0.012, 0.32, M.acero);
            brazo.position.set(0, y, 0.16);
            o2.add(brazo);
        }
        const boca = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.03, 16), M.acero));
        boca.position.set(0, 1.83 + 0.75, 0.25);
        o2.add(boca);
        for (let k = 0; k < 7; k++) burbuja('o2', 'verde', -0.35, 1.0, 2.5, 3.2, 0.34, 0.024, 0.09);
    }

    // --------- 5 · refinación: catalizador y dos torres que se turnan
    const frentes = [];
    {
        const g = unidad('refinacion', 0, 0);
        const cuentas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.028, 8, 6), M.marfil, 150);
        const m = new THREE.Matrix4();
        let n = 0;
        const llenar = (cx, cz, r, y0, y1, cant) => {
            for (let k = 0; k < cant; k++) {
                const a = azar(n, 1) * PI * 2;
                const rr = Math.sqrt(azar(n, 2)) * r;
                m.makeTranslation(cx + Math.cos(a) * rr, lerp(y0, y1, azar(n, 3)), cz + Math.sin(a) * rr);
                cuentas.setMatrixAt(n, m);
                n++;
            }
        };
        const torre = (x, z) => {
            const p = cil(0.05, 0.2, M.grafito);
            p.position.set(x, 0, z);
            g.add(p);
            const casco = sombra(new THREE.Mesh(recipienteGeo(0.24, 2.02).translate(x, 0.2, z), M.cubierta));
            g.add(mover(casco, [0, 2.6, 0]));
            llenar(x, z, 0.19, 0.38, 2.02, 58);
            const frente = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 6, 28).rotateX(PI / 2), M.neonVerde);
            frente.position.set(x, 0.5, z);
            g.add(frente);
            frentes.push(frente);
            const f = aro(0.245, 0.016, M.fluido.h2);
            f.position.set(x, 1.95, z);
            g.add(mover(f, [0, 2.6, 0]));
        };
        torre(1.35, -0.3);
        torre(1.95, -0.3);
        const cabezal = cilX(0.038, 0.62, M.acero);
        cabezal.position.set(1.65, 2.2, -0.3);
        g.add(mover(cabezal, [0, 2.6, 0]));
        // catalizador (deoxo): convierte el oxígeno que queda en agua
        const pd = cil(0.04, 0.2, M.grafito);
        pd.position.set(0.85, 0, 0.62);
        g.add(pd);
        const casco = sombra(new THREE.Mesh(recipienteGeo(0.2, 0.96).translate(0.85, 0.2, 0.62), M.cubierta));
        g.add(mover(casco, [0, 2.2, 0]));
        llenar(0.85, 0.62, 0.15, 0.32, 0.95, 34);
        cuentas.count = n;
        cuentas.castShadow = true;
        g.add(cuentas);
        // bastidor y escalera
        for (const [x, z] of [[1.0, -0.72], [2.3, -0.72], [1.0, 0.12], [2.3, 0.12]]) {
            const c = caja(0.04, 2.3, 0.04, M.grafito);
            c.position.set(x, 0, z);
            g.add(mover(c, [Math.sign(x - 1.65) * 0.5, 0, Math.sign(z + 0.3) * 0.4], 0.1));
        }
        for (const [w, d, x, z] of [[1.34, 0.04, 1.65, -0.72], [1.34, 0.04, 1.65, 0.12], [0.04, 0.88, 1.0, -0.3], [0.04, 0.88, 2.3, -0.3]]) {
            const t = caja(w, 0.04, d, M.grafito);
            t.position.set(x, 2.28, z);
            g.add(mover(t, [0, 1.9, 0], 0.1));
        }
    }

    // --------- 6 · compresor
    let piston = null;
    {
        const g = unidad('compresor', 3.05, 0.25);
        const base = caja(1.28, 0.1, 0.76, M.grafito);
        g.add(base);
        const motor = cilX(0.15, 0.42, M.guinda);
        motor.position.set(-0.32, 0.3, 0.14);
        g.add(mover(motor, [-0.55, 0.15, 0.25]));
        const vol = new THREE.Group();
        vol.position.set(-0.04, 0.32, 0.14);
        const rueda = new THREE.Mesh(engrane(0.21, 18, 0.06).rotateY(PI / 2), M.acero);
        rueda.castShadow = true;
        vol.add(rueda);
        g.add(mover(vol, [0, 0.55, 0.45]));
        giran.push({ obj: vol, eje: 'x', vel: e => (e.flujos.alta > 0 ? 6 * e.flujos.alta : 0) });
        const cilindro = cilX(0.12, 0.5, M.acero);
        cilindro.position.set(0.3, 0.3, -0.14);
        g.add(mover(cilindro, [0.55, 0.3, -0.3]));
        for (let k = 0; k < 5; k++) {
            const aleta = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.012, 18).rotateZ(PI / 2), M.grafito);
            aleta.position.set(0.14 + k * 0.08, 0.3, -0.14);
            g.add(mover(aleta, [0.55, 0.3, -0.3]));
        }
        piston = new THREE.Group();
        piston.position.set(0.3, 0.3, -0.14);
        const vastago = cilX(0.028, 0.5, M.grafito, 10);
        vastago.position.x = -0.32;
        const cabeza = cilX(0.1, 0.06, M.fluido.h2, 18);
        cabeza.position.x = -0.05;
        piston.add(vastago, cabeza);
        g.add(piston);
        const capota = sombra(new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.62, 0.66).translate(0, 0.41, 0), M.cubierta));
        g.add(mover(capota, [0, 1.7, 0]));
    }

    // --------- 7 · tanques
    const leds = [];
    const interiores = [];
    {
        const g = unidad('tanques', 5, 0.1);
        [-1.2, 0, 1.2].forEach((z, i) => {
            const y = 0.62;
            const L = 2.0;
            const r = 0.42;
            const pu = new THREE.Group();
            pu.position.set(0, y, z);
            const geo = recipienteGeo(r, L + r * 1.1).translate(0, -(L + r * 1.1) / 2, 0).rotateZ(PI / 2);
            const casco = sombra(new THREE.Mesh(geo, M.cubierta));
            pu.add(mover(casco, [0, 1.2 + i * 0.5, 0], i * 0.08));
            const dentro = new THREE.Mesh(new THREE.CapsuleGeometry(r * 0.86, L * 0.8, 6, 18).rotateZ(PI / 2), new THREE.MeshBasicMaterial({ color: FLUIDOS.h2.color, transparent: true, opacity: 0.4, depthWrite: false, toneMapped: false }));
            pu.add(dentro);
            interiores.push(dentro);
            for (const lado of [-0.7, 0.7]) {
                const silla = caja(0.14, y - r * 0.9, r * 1.1, M.grafito);
                silla.position.set(lado, -y, 0);
                pu.add(silla);
            }
            for (const lado of [-0.32, 0.32, -1, 1]) {
                const fleje = new THREE.Mesh(new THREE.TorusGeometry(r * 1.01, 0.012, 6, 32).rotateY(PI / 2), M.grafito);
                fleje.position.x = lado;
                pu.add(mover(fleje, [0, 1.2 + i * 0.5, 0], i * 0.08));
            }
            // tira de luces: el nivel, a la vista
            for (let k = 0; k < 10; k++) {
                const led = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.012), new THREE.MeshBasicMaterial({ color: FLUIDOS.h2.color, toneMapped: false }));
                led.position.set(-0.75 + k * 0.165, r * 0.25, r * 0.98);
                pu.add(mover(led, [0, 1.2 + i * 0.5, 0], i * 0.08));
                leds.push({ led, k });
            }
            g.add(pu);
        });
    }

    // --------- 8 · pila de combustible
    {
        const g = unidad('pila', 1.6, 3);
        nave(g, 2.6, 1.42, 1.2, { franja: M.fluido.elec });
        for (const x of [-0.72, 0.72]) {
            for (const z of [-0.3, 0.3]) {
                const s = pilaDeCeldas(g, x, z, { n: 11, h: 0.36, d: 0.36, membrana: M.fluido.h2, proceso: 'pila', burb: false });
                mover(s, [x * 0.3, 0.05, z * 1.2], 0.05);
            }
        }
        const barra = caja(2.1, 0.03, 0.05, M.cobre);
        barra.position.set(-0.06, 0.82, 0);
        g.add(mover(barra, [0, 0.65, 0]));
        luz(g, 0, 0.9, 0, FLUIDOS.elec.color, 2.2, 'pila', 4);
        brillo(g, 0, 0.6, 0, 2.2, FLUIDOS.elec.color, 'pila', 0.22);
        for (const x of [-0.72, 0.72]) {
            const [a, b] = abanico(g, x, 1.32, 0, 0.26, e => 7 * e.f.pila);
            mover(a, [0, 2.3, 0]); mover(b, [0, 2.3, 0]);
            enTecho.pila.push(a, b);
        }
        // gotas de agua que salen hacia el tubo de retorno
        for (let k = 0; k < 8; k++) burbuja('agua', 'pila', 1.0 + (azar(k, 21) - 0.5) * 0.3, 2.22, 0.75, 0.2, 0.7, 0.02);
    }

    // --------- 9 · red: transformador, torres y pueblo
    const casas = [];
    {
        const g = unidad('red', -0.72, 3.2);
        const cuerpo = caja(0.64, 0.74, 0.74, M.grafito);
        g.add(mover(cuerpo, [0, 0, 0.7]));
        for (let k = 0; k < 7; k++) {
            const aleta = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.58, 0.14), M.acero);
            aleta.position.set(-0.27 + k * 0.09, 0.38, 0.4);
            g.add(mover(aleta, [0, 0, 0.7]));
        }
        for (const z of [-0.2, 0, 0.2]) {
            const b = cil(0.03, 0.44, M.marfil, 0.018, 10);
            b.position.set(0, 0.74, z);
            g.add(mover(b, [0, 0.7, 0.7]));
        }
        const torreta = (x, z, h = 2.05) => {
            const t = unidad('red', x, z);
            for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
                const pata = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, Math.hypot(h, 0.26), 6), M.acero));
                pata.position.set((a * 0.13) / 1, h / 2, (b * 0.13) / 1);
                pata.rotation.set((b * -0.13) / h * 1, 0, (a * 0.13) / h * 1);
                t.add(pata);
            }
            for (let k = 1; k < 5; k++) {
                const y = (h * k) / 5;
                const w = 0.28 * (1 - y / h) + 0.02;
                const anillo = new THREE.Mesh(new THREE.BoxGeometry(w, 0.012, w), M.grafito);
                anillo.position.y = y;
                t.add(anillo);
            }
            const brazo = caja(0.62, 0.02, 0.02, M.acero);
            brazo.position.y = h - 0.05;
            t.add(mover(brazo, [0, 0.5, 0]));
            return t;
        };
        torreta(-1.95, 3.3);
        torreta(-3.3, 3.38, 1.9);
        const pueblo = [[-4.55, 2.85], [-5.4, 3.0], [-4.3, 3.65], [-5.15, 3.8], [-4.5, 4.42], [-5.7, 4.2]];
        pueblo.forEach(([x, z], i) => {
            const c = unidad('red', x, z);
            c.rotation.y = azar(i, 5) * 0.8;
            const w = 0.56 + azar(i, 6) * 0.2;
            const h = 0.34 + azar(i, 7) * 0.22;
            const muro = caja(w, h, 0.46, M.marfil);
            c.add(muro);
            const techo = sombra(new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w, 0.46) * 0.56, 0.24, 4).rotateY(PI / 4).scale(w / 0.6, 1, 0.46 / 0.6 * 1.05), M.guinda));
            techo.position.y = h + 0.12;
            c.add(mover(techo, [0, 0.8, 0], i * 0.05));
            for (const vx of [-0.16, 0.16]) {
                const vent = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.11), M.ventana);
                vent.position.set(vx * (w / 0.6), h * 0.56, 0.235);
                c.add(vent);
            }
            casas.push(brillo(c, 0, h * 0.56, 0.28, 0.9, '#ffb45a', 'pueblo', 0.5));
        });
        luz(raiz, -4.9, 1.3, 3.6, '#ffb45a', 3, 'pueblo', 5);
    }

    // --------- SAEE de baterías: contenedores con estantes de módulos, junto al transformador
    const lucesBateria = Array.from({ length: 10 }, () => new THREE.MeshBasicMaterial({ color: COLOR_BATERIA, toneMapped: false }));
    {
        const g = unidad('baterias', 0, 0);
        const piso = caja(2.62, 0.05, 1.02, M.grafito);
        piso.position.set(-2.36, 0, 4.2);
        g.add(piso);
        const [W, H, D] = [0.58, 0.62, 0.84];
        const geoModulo = new THREE.BoxGeometry(0.15, 0.055, 0.205);
        const geoLuz = new THREE.BoxGeometry(0.008, 0.012, 0.16);
        const m = new THREE.Matrix4();
        [-3.32, -2.68, -2.04, -1.4].forEach((x, i) => {
            const c = new THREE.Group();
            c.position.set(x, 0.05, 4.2);
            g.add(c);
            const arriba = [0, 1.5 + i * 0.14, 0];
            const casco = sombra(new THREE.Mesh(new THREE.BoxGeometry(W, H, D).translate(0, H / 2, 0), M.cubierta));
            c.add(mover(casco, arriba, i * 0.05));
            // la franja guinda rodea al contenedor sin taparlo: al volverse vidrio se ven los estantes
            for (const [fw, fd, fx, fz] of [[W + 0.006, 0.006, 0, D / 2], [W + 0.006, 0.006, 0, -D / 2], [0.006, D + 0.006, W / 2, 0], [0.006, D + 0.006, -W / 2, 0]]) {
                const faja = new THREE.Mesh(new THREE.BoxGeometry(fw, 0.035, fd), M.guinda);
                faja.position.set(fx, H * 0.87, fz);
                c.add(mover(faja, arriba, i * 0.05));
            }
            const letrero = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.125), M.letrero);
            letrero.position.set(-0.1, H * 0.62, D / 2 + 0.003);
            c.add(mover(letrero, arriba, i * 0.05));
            // la carga, a la vista: diez luces en la puerta
            for (let k = 0; k < 10; k++) {
                const led = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.018, 0.01), lucesBateria[k]);
                led.position.set(0.17, 0.08 + k * 0.045, D / 2 + 0.006);
                c.add(mover(led, arriba, i * 0.05));
            }
            // dos estantes de módulos, con un pasillo en medio
            for (const lado of [-1, 1]) {
                const estante = new THREE.Group();
                estante.position.set(lado * 0.155, 0.02, 0);
                for (const [px, pz] of [[-0.08, -0.34], [0.08, -0.34], [-0.08, 0.34], [0.08, 0.34]]) {
                    const poste = caja(0.012, 0.52, 0.012, M.acero);
                    poste.position.set(px, 0, pz);
                    estante.add(poste);
                }
                const modulos = new THREE.InstancedMesh(geoModulo, M.placa, 18);
                const lucecitas = new THREE.InstancedMesh(geoLuz, M.neonBateria, 18);
                let n = 0;
                for (let nivel = 0; nivel < 6; nivel++) {
                    for (let col = 0; col < 3; col++) {
                        const [y, z] = [0.05 + nivel * 0.085, (col - 1) * 0.225];
                        m.makeTranslation(0, y, z);
                        modulos.setMatrixAt(n, m);
                        m.makeTranslation(-lado * 0.08, y, z);
                        lucecitas.setMatrixAt(n, m);
                        n++;
                    }
                }
                modulos.castShadow = true;
                estante.add(modulos, lucecitas);
                c.add(mover(estante, [lado * 0.42, 0.12, 0], 0.08));
            }
            // el enfriamiento, en el techo
            const [a, b] = abanico(c, 0, H, 0, 0.11, e => 0.6 + 5 * e.f.bateria);
            mover(a, arriba, i * 0.05);
            mover(b, arriba, i * 0.05);
            enTecho.baterias.push(a, b);
        });
        // inversor de las baterías
        const p = unidad('baterias', -0.86, 4.25);
        const gabinete = caja(0.34, 0.52, 0.44, M.grafito);
        p.add(mover(gabinete, [0.55, 0, 0.3]));
        for (let k = 0; k < 4; k++) {
            const rejilla = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.016, 0.01), M.neonNaranja);
            rejilla.position.set(0, 0.16 + k * 0.08, 0.225);
            p.add(mover(rejilla, [0.55, 0, 0.3]));
        }
        luz(g, -2.36, 0.8, 4.2, COLOR_BATERIA, 1.8, 'bateria', 3.5);
        brillo(g, -2.36, 0.42, 4.25, 2.6, COLOR_BATERIA, 'bateria', 0.16);
    }

    // --------- 10 · pirólisis
    const metalMalla = { m: null };
    {
        const g = unidad('pirolisis', 2.6, -3.4);
        const r = 0.44;
        const h = 2.9;
        const basePi = cil(r * 1.2, 0.16, M.grafito);
        g.add(basePi);
        // metal fundido: de abajo blanco caliente a naranja arriba
        const geoM = new THREE.CylinderGeometry(r * 0.86, r * 0.86, 1.7, 28, 12);
        const cols = [];
        const pos = geoM.attributes.position;
        const c0 = new THREE.Color('#fff2b0');
        const c1 = new THREE.Color('#ff7a12');
        const c2 = new THREE.Color('#c23a06');
        for (let i = 0; i < pos.count; i++) {
            const k = (pos.getY(i) + 0.85) / 1.7;
            const col = k < 0.5 ? c0.clone().lerp(c1, k * 2) : c1.clone().lerp(c2, (k - 0.5) * 2);
            cols.push(col.r, col.g, col.b);
        }
        geoM.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
        geoM.translate(0, 1.05, 0);
        const fundido = new THREE.Mesh(geoM, M.metal);
        g.add(fundido);
        metalMalla.m = fundido;
        // capa de carbono que flota
        const capa = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.86, r * 0.86, 0.1, 28).translate(0, 1.95, 0), M.carbon);
        g.add(capa);
        const casco = sombra(new THREE.Mesh(recipienteGeo(r, h - 0.16).translate(0, 0.16, 0), M.cubierta));
        g.add(mover(casco, [0, 3.1, 0]));
        for (let k = 0; k < 6; k++) {
            const bobina = aro(r * 1.03, 0.022, M.fluido.elec);
            bobina.position.y = 0.42 + k * 0.28;
            g.add(mover(bobina, [0, 3.1, 0], 0.02 * k));
        }
        for (let k = 0; k < 22; k++) burbuja('ch4', 'turquesa', 2.6 + (azar(k, 31) - 0.5) * r * 1.3, -3.4 + (azar(k, 32) - 0.5) * r * 1.3, 0.3, 1.86, 0.3, 0.026, 0.05);
        luz(g, 0, 1.2, 0.9, '#ff7a12', 5, 'turquesa', 5.5);
        brillo(g, 0, 1.1, 0, 2.8, '#ff7a12', 'turquesa', 0.34);
        // ciclón arriba: separa el carbono del gas
        const ciclon = sombra(new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.34, 18).rotateX(PI).translate(0, 2.98, 0), M.acero));
        g.add(mover(ciclon, [0, 3.3, 0]));
        // esfera de metano
        const s = unidad('pirolisis', 4.75, -3.65);
        for (let k = 0; k < 6; k++) {
            const a = (k / 6) * PI * 2;
            const p = cil(0.025, 0.72, M.acero, 0.025, 8);
            p.position.set(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5);
            s.add(p);
        }
        const esfera = sombra(new THREE.Mesh(new THREE.SphereGeometry(0.76, 32, 22).translate(0, 1.0, 0), M.cubierta));
        s.add(mover(esfera, [0.3, 2.3, 0]));
        const faja = aro(0.77, 0.022, M.fluido.ch4);
        faja.position.y = 1.0;
        s.add(mover(faja, [0.3, 2.3, 0]));
        const nucleoGas = new THREE.Mesh(new THREE.SphereGeometry(0.66, 20, 14).translate(0, 1.0, 0), new THREE.MeshBasicMaterial({ color: FLUIDOS.ch4.color, transparent: true, opacity: 0.32, depthWrite: false, toneMapped: false }));
        s.add(nucleoGas);
        // tolva de carbono
        const t = unidad('pirolisis', 1.05, -3.8);
        for (const [x, z] of [[-0.32, -0.32], [0.32, -0.32], [-0.32, 0.32], [0.32, 0.32]]) {
            const p = caja(0.03, 0.72, 0.03, M.grafito);
            p.position.set(x, 0, z);
            t.add(p);
        }
        const tolva = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.14, 0.72, 20, 1, true).translate(0, 1.08, 0), M.cubierta));
        t.add(mover(tolva, [0, 1.9, 0]));
        const montoncito = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.3, 18).translate(0, 1.4, 0), M.carbon);
        t.add(montoncito);
        const costal = sombra(new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.26, 16).translate(0, 0.13, 0), M.carbon));
        t.add(costal);
    }

    // ---------- tubos
    const lineas = LINEAS.map(L => {
        const curva = new THREE.CatmullRomCurve3(L.puntos.map(p => new THREE.Vector3(...p)), false, 'catmullrom', 0.06);
        const largo = curva.getLength();
        const mat = new THREE.MeshPhysicalMaterial({ color: FLUIDOS[L.fluido].color, roughness: 0.25, transparent: true, opacity: 0.4, clearcoat: 0.8, envMapIntensity: 0.6, depthWrite: false });
        const tubo = new THREE.Mesh(new THREE.TubeGeometry(curva, Math.max(12, Math.round(largo * 16)), L.r * 1.3, 8), mat);
        tubo.renderOrder = 2;
        raiz.add(tubo);
        curva.arcLengthDivisions = Math.max(60, Math.round(largo * 30));
        return { L, curva, largo, mat, tubo, n: Math.min(26, Math.max(3, Math.round(largo / 0.3))) };
    });
    const particulas = {};
    const geoP = new THREE.SphereGeometry(1, 8, 6);
    for (const k of Object.keys(FLUIDOS)) {
        const lista = lineas.filter(l => l.L.fluido === k);
        const n = lista.reduce((a, l) => a + l.n, 0);
        if (!n) continue;
        const malla = new THREE.InstancedMesh(geoP, M.fluido[k], n);
        malla.frustumCulled = false;
        raiz.add(malla);
        particulas[k] = { malla, lista };
    }
    const mallasBurbuja = {};
    for (const [k, lista] of Object.entries(burbujas)) {
        if (!lista.length) continue;
        const malla = new THREE.InstancedMesh(geoP, M.fluido[k], lista.length);
        malla.frustumCulled = false;
        raiz.add(malla);
        mallasBurbuja[k] = { malla, lista };
    }

    // ---------- lámparas de la planta
    const lamparas = [[-6.2, -1.6], [6.2, -2.3], [6.2, 2.4], [0.1, 4.55], [-0.2, -2.6], [3.4, 1.7]];
    lamparas.forEach(([x, z]) => {
        const g = new THREE.Group();
        g.position.set(x, 0, z);
        g.add(cil(0.022, 1.9, M.grafito, 0.016, 8));
        const cab = caja(0.2, 0.04, 0.1, M.lampara);
        cab.position.y = 1.9;
        g.add(cab);
        raiz.add(g);
        brillo(g, 0, 1.88, 0, 1.25, '#ffcf8f', 'noche', 0.6);
        const charco = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ map: M.brillo, color: '#ffc27a', transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending, opacity: 0 }));
        charco.position.y = 0.01;
        charco.renderOrder = 1;
        g.add(charco);
        brillos.push({ s: charco, proceso: 'noche', fuerza: 0.28, noche: true, charco: true });
    });

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
    const fasesBurbuja = {};
    function posar(e) {
        const n = e.noche;
        const L = e.encendido;
        const act = p => (p === 'noche' ? n : p === 'pueblo' ? e.f.red * clamp01(0.25 + n) : p ? (e.f[p] ?? 0) : 1);
        lineas.forEach((l, i) => { fasesLinea[i] += e.dt * (0.25 + 0.75 * (e.flujos[l.L.id] ?? 0)) * 0.35; l.fase = fasesLinea[i]; });
        for (const p of ['verde', 'turquesa', 'pila']) fasesBurbuja[p] = (fasesBurbuja[p] ?? 0) + e.dt * (0.4 + act(p));
        const d = e.desarme;
        // desarmar: cada pieza con un poco de retraso
        movibles.forEach(({ obj, p0, d: dir, k }) => {
            const x = sale(clamp01((d * (1 + k) - k) * 1.05));
            obj.position.copy(p0).addScaledVector(dir, x);
        });
        // cubiertas
        for (const [parte, mat] of Object.entries(cubiertas)) {
            const op = 1 - 0.93 * Math.max(e.adentro, e.abierta?.[parte] ?? 0);
            mat.opacity = op;
            mat.depthWrite = op > 0.6;
            // lo que va montado en el techo no se queda flotando cuando el techo se vuelve vidrio
            (enTecho[parte] ?? []).forEach(o => o.scale.setScalar(Math.max(0.0001, clamp01((op - 0.12) / 0.45))));
        }
        const a = sale(d * 3);
        // tubos y partículas
        lineas.forEach(l => {
            const f = e.flujos[l.L.id] ?? 0;
            const base = l.L.procesos.length ? lerp(0.3, 0.72, clamp01(f * 2)) : 0.45;
            l.mat.opacity = base * (1 - a);
            l.tubo.visible = a < 0.98;
        });
        for (const [k, { malla, lista }] of Object.entries(particulas)) {
            let i = 0;
            for (const l of lista) {
                const f = e.flujos[l.L.id] ?? 0;
                const vel = l.fase;
                const visible = f > 0.01 && a < 0.5;
                for (let p = 0; p < l.n; p++) {
                    const r = visible ? l.L.r * 0.95 : 0;
                    if (r > 0) l.curva.getPointAt(fract(p / l.n + (vel * 1.4) / Math.max(0.6, l.largo)), v);
                    else v.set(0, -5, 0);
                    s3.setScalar(Math.max(r, 0.0001));
                    malla.setMatrixAt(i++, m4.compose(v, q0, s3));
                }
            }
            malla.instanceMatrix.needsUpdate = true;
        }
        // burbujas
        for (const { malla, lista } of Object.values(mallasBurbuja)) {
            lista.forEach((b, i) => {
                const f = act(b.proceso);
                const u = fract((fasesBurbuja[b.proceso] ?? 0) * b.vel + b.h);
                const r = f > 0.02 && a < 0.5 ? b.r * Math.min(1, u * 8) * (1 - u * u * u * 0.5) * (0.5 + 0.5 * f) : 0;
                v.set(b.x + Math.sin(e.t * 3 + b.h * 40) * b.abre, lerp(b.y0, b.y1, u), b.z + Math.cos(e.t * 2.6 + b.h * 30) * b.abre);
                s3.setScalar(Math.max(r, 0.0001));
                malla.setMatrixAt(i, m4.compose(v, q0, s3));
            });
            malla.instanceMatrix.needsUpdate = true;
        }
        // lo que gira
        const fases = e.fases || {};
        giran.forEach((g, i) => { g.obj.rotation[g.eje] = fases[i] ?? 0; });
        // pistón del compresor
        const fComp = e.flujos.alta ?? 0;
        piston.position.x = 0.3 + (fComp > 0.01 ? Math.sin(e.t * 9) * 0.1 : 0);
        // refinación: dos torres que se turnan, y su frente de adsorción sube
        const turno = Math.floor(e.t / 5) % 2;
        const uTurno = fract(e.t / 5);
        const fRef = Math.max(e.f.verde, e.f.turquesa);
        frentes.forEach((fr, i) => {
            const activa = i === turno && fRef > 0.02;
            fr.visible = activa && a < 0.5;
            fr.position.y = lerp(0.42, 2.0, uTurno);
        });
        // tanques: la tira de luces marca el nivel
        interiores.forEach(m => { m.material.opacity = (0.12 + 0.5 * e.nivel) * (0.4 + 0.6 * Math.max(e.adentro, e.abierta?.tanques ?? 0)); });
        leds.forEach(({ led, k }) => {
            const prendido = (k + 0.5) / 10 <= e.nivel;
            led.material.color.set(FLUIDOS.h2.color).multiplyScalar(prendido ? 1 : 0.14);
        });
        // baterías: las luces de la puerta marcan la carga; adentro brillan más si están trabajando
        lucesBateria.forEach((mat, k) => mat.color.set(COLOR_BATERIA).multiplyScalar((k + 0.5) / 10 <= e.soc ? L : 0.12));
        M.neonBateria.color.set(COLOR_BATERIA).multiplyScalar((0.3 + 0.7 * e.f.bateria) * L);
        // metal fundido: de opaco a incandescente con la pirólisis
        const fT = e.f.turquesa;
        M.metal.color.setScalar(lerp(0.2, 1, fT) * L);
        // neones
        M.neonNaranja.color.set(FLUIDOS.elec.color).multiplyScalar((0.55 + 0.45 * n) * L);
        // ventanas: de noche, con la pila prendida; el pueblo se apaga de noche si la pila no da
        // las lámparas: gris de día, encendidas de noche
        M.lampara.color.set('#9a9c9f').lerp(lampNoche, n);
        M.ventana.color.set('#ffc77a').multiplyScalar(lerp(0.32, 1, n) * clamp01(0.25 + e.f.red * 1.6) * L);
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
    // cada parte con su propia cubierta: al elegir una se abre solo ella, no toda la planta
    for (const [parte, grupos] of Object.entries(partes)) {
        const mat = M.cubierta.clone();
        cubiertas[parte] = mat;
        grupos.forEach(g => g.traverse(o => { if (o.isMesh && o.material === M.cubierta) o.material = mat; }));
    }
    return { raiz, posar, partes, anclas, giran };
}
