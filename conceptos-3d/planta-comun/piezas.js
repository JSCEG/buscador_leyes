// Las piezas 3D que se repiten en las plantas con física: texturas, letreros, formas, el estudio de luz y sombra sobre el papel del sitio,
// las cubiertas que se vuelven vidrio, lo que se separa al desarmar, los brillos y los tubos con lo que corre por ellos.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { azar, clamp01, fract, lerp, sale } from './ayudas.js';

const PI = Math.PI;
export function texturaRadial(paradas) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 2, 64, 64, 64);
    paradas.forEach(([k, a]) => g.addColorStop(k, `rgba(255,255,255,${a})`));
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
}
export const texturaBrillo = () => texturaRadial([[0, 0.95], [0.28, 0.32], [0.6, 0.07], [1, 0]]);
export const texturaVaho = () => texturaRadial([[0, 0.75], [0.55, 0.32], [1, 0]]);
export function texturaGrano(base, oscuro, repite) {
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
/** Letrero: una tira transparente con su nombre. */
export function letrero(texto, color, movil, ancho = 2.4) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 96;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    const pintar = () => {
        const x = c.getContext('2d');
        x.clearRect(0, 0, 512, 96);
        const tam = movil ? 66 : 58;
        x.font = `600 ${tam}px Fraunces, Georgia, serif`;
        const mide = x.measureText(texto).width;
        if (mide > 492) x.font = `600 ${Math.floor((tam * 492) / mide)}px Fraunces, Georgia, serif`;
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

// ------------------------------------------------------------------ materiales de siempre
export function materialesBase(P, fluidos) {
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
        losa: new THREE.MeshStandardMaterial({ color: P.losaDia, roughness: 0.9, envMapIntensity: 0.3 }),
        concreto: new THREE.MeshStandardMaterial({ color: '#cfccc5', roughness: 0.92, envMapIntensity: 0.3 }),
        tierra: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#ffffff', 'rgba(0,0,0,0.05)', [6, 3.2]), roughness: 0.95, envMapIntensity: 0.25 }),
        suelo: new THREE.MeshStandardMaterial({ color: P.suelo, map: texturaGrano('#ffffff', 'rgba(0,0,0,0.1)', [6, 1]), roughness: 0.95, envMapIntensity: 0.25 }),
        madera: new THREE.MeshStandardMaterial({ color: '#7a6248', roughness: 0.85, envMapIntensity: 0.3 }),
        hoja: new THREE.MeshStandardMaterial({ color: '#3f5d44', roughness: 0.9, envMapIntensity: 0.3 }),
        vidrio: new THREE.MeshPhysicalMaterial({ color: '#dff2ff', roughness: 0.08, transparent: true, opacity: 0.16, clearcoat: 1, clearcoatRoughness: 0.05, depthWrite: false, side: THREE.DoubleSide }),
        ventana: new THREE.MeshBasicMaterial({ color: '#ffc77a', toneMapped: false }),
        lampara: new THREE.MeshBasicMaterial({ color: '#ffe2ad', toneMapped: false }),
        neonElec: new THREE.MeshBasicMaterial({ color: fluidos.elec?.color ?? '#ffb000', toneMapped: false }),
        neonGuinda: new THREE.MeshBasicMaterial({ color: P.rosa, toneMapped: false }),
        particula: new THREE.MeshBasicMaterial({ toneMapped: false }),
        fluido: {},
    };
    for (const [k, f] of Object.entries(fluidos)) M.fluido[k] = new THREE.MeshBasicMaterial({ color: f.color, toneMapped: false });
    return M;
}

// ------------------------------------------------------------------ estudio: luz, y un piso que solo recibe sombra
export function estudio(renderer, scene, { movil = false, oscuro = false, y0 = 0, alcance = 13, alActualizar = null } = {}) {
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
    Object.assign(sol.shadow.camera, { left: -alcance, right: alcance, top: alcance, bottom: -alcance, near: 1, far: 50 });
    sol.shadow.mapSize.set(2048, 2048);
    sol.shadow.bias = -0.0006;
    sol.shadow.normalBias = 0.025;
    const reflector = new THREE.DirectionalLight('#ffffff', 0.1);
    reflector.position.set(3, 8, 9);
    scene.add(cielo, sol, reflector);
    // como en las demás figuras de Aprende: solo recibe sombra y deja ver el papel del sitio
    const suelo = new THREE.Mesh(new THREE.CircleGeometry(34, 64).rotateX(-PI / 2), new THREE.ShadowMaterial({ color: '#000000', opacity: oscuro ? 0.35 : 0.14 }));
    suelo.position.y = y0 - 0.02;
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
    const [dia, noche] = [new THREE.Color('#ffffff'), new THREE.Color('#9db6ff')];
    const v = new THREE.Vector3();
    return {
        actualizar(e) {
            const n = e.noche;
            const a = lerp(0.95, -0.2, n);
            v.set(3.5 + 3 * n, 8 + 8 * Math.max(0, Math.sin(a * 1.1 + 0.6)), 12 - 15 * n);
            sol.position.copy(v);
            sol.intensity = lerp(2, 0.32, n);
            sol.color.copy(dia).lerp(noche, n);
            cielo.intensity = lerp(0.72, 0.18, n);
            reflector.intensity = lerp(0.1, 0.55, n);
            scene.environmentIntensity = lerp(0.5, 0.22, n);
            estrellas.material.opacity = clamp01((n - 0.3) * 1.5);
            estrellas.visible = estrellas.material.opacity > 0.01;
            alActualizar?.(n, e);
        },
    };
}

// ------------------------------------------------------------------ formas sueltas
export const sombra = m => { m.castShadow = true; m.receiveShadow = true; return m; };
export const caja = (w, h, d, m) => sombra(new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), m));
export const cil = (r, h, m, rTop = r, seg = 24) => sombra(new THREE.Mesh(new THREE.CylinderGeometry(rTop, r, h, seg).translate(0, h / 2, 0), m));
export const cilX = (r, l, m, seg = 20) => sombra(new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, seg).rotateZ(PI / 2), m));
export const cilZ = (r, l, m, seg = 16) => sombra(new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, seg).rotateX(PI / 2), m));
export const aro = (r, t, m) => new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 36).rotateX(PI / 2), m);
export const aroX = (r, t, m) => new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 36).rotateY(PI / 2), m);
export const en = (o, x, y, z) => { o.position.set(x, y, z); return o; };
/** Cilindro entre dos puntos, como geometría suelta para juntarla después. */
export function geoEntre(a, b, r, seg = 5) {
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...b);
    const d = B.clone().sub(A);
    const g = new THREE.CylinderGeometry(r, r, d.length(), seg);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()));
    g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
    return g;
}
export const entre = (a, b, r, m) => sombra(new THREE.Mesh(geoEntre(a, b, r), m));
/** Recipiente vertical con tapas abombadas, base en y = 0. */
export function recipienteGeo(r, h, bombeo = 0.55) {
    const puntos = [];
    const tapa = r * bombeo;
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * (PI / 2); puntos.push(new THREE.Vector2(Math.sin(a) * r, tapa - Math.cos(a) * tapa)); }
    for (let i = 0; i <= 8; i++) { const a = (i / 8) * (PI / 2); puntos.push(new THREE.Vector2(Math.cos(a) * r, h - tapa + Math.sin(a) * tapa)); }
    return new THREE.LatheGeometry(puntos, 36);
}
/** Media carcasa a lo largo de x: mitad de arriba o de abajo, según un perfil [[x, r], …]. */
export function mediaCarcasa(perfil, arriba) {
    const puntos = perfil.map(([x, r]) => new THREE.Vector2(r, x));
    return new THREE.LatheGeometry(puntos, 28, arriba ? PI : 0, PI).rotateZ(-PI / 2);
}
/** Torre de transmisión: cuatro patas y arriostrado en X. Con su punta en y = h. */
export function geoTorre(h, base = 0.36) {
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

// ------------------------------------------------------------------ el ayudante de cada planta
/**
 * Lleva la cuenta de lo que se abre, se separa y brilla. partesIds: los nombres de los puntos clave.
 * posar(e, act, ab, { apagar }): act(proceso) dice cuánto está activo un proceso; ab, cuánto se abrió cada parte; apagar, 0–1 cuánto se
 * apagan brillos y gotas al desarmar.
 */
export function crearAyudante(M, raiz, partesIds, { movil = false } = {}) {
    const partes = Object.fromEntries(partesIds.map(id => [id, []]));
    const movibles = [];
    const giran = [];
    const brillos = [];
    const luces = [];
    const cubiertas = {};
    const rotulos = [];
    const gotas = {};
    const fasesGota = {};
    const mallasGota = {};
    const m4 = new THREE.Matrix4();
    const q0 = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const s3 = new THREE.Vector3();
    const kit = {
        partes, giran, brillos, cubiertas,
        unidad(id, x = 0, z = 0, padre = raiz) { const g = new THREE.Group(); g.position.set(x, 0, z); padre.add(g); partes[id].push(g); return g; },
        mover(obj, d, k = 0) { movibles.push({ obj, p0: obj.position.clone(), d: new THREE.Vector3(...d), k }); return obj; },
        brillo(padre, x, y, z, esc, color, proceso = null, fuerza = 1, noche = true) {
            const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.brillo, color, transparent: true, depthWrite: false, depthTest: false, toneMapped: false }));
            s.position.set(x, y, z);
            s.scale.setScalar(esc);
            s.renderOrder = 6;
            padre.add(s);
            brillos.push({ s, proceso, fuerza, noche });
            return s;
        },
        luz(padre, x, y, z, color, fuerza, proceso, alcance = 5) {
            const l = new THREE.PointLight(color, 0, alcance, 2);
            l.position.set(x, y, z);
            padre.add(l);
            luces.push({ l, fuerza, proceso });
        },
        /** Una cubierta se vuelve vidrio cuando se elige alguna de estas partes, o con «Ver por dentro». */
        cub(nombre, abre, opciones = {}) {
            if (!cubiertas[nombre]) {
                const mat = M.cubierta.clone();
                if (opciones.color) mat.color.set(opciones.color);
                if (opciones.metal !== undefined) mat.metalness = opciones.metal;
                cubiertas[nombre] = { mat, abre };
            }
            return cubiertas[nombre].mat;
        },
        gota(fluido, proceso, x, z, y0, y1, vel = 0.4, r = 0.02, abre = 0.02) {
            const lista = (gotas[fluido] ??= []);
            lista.push({ proceso, x, z, y0, y1, vel, r, abre, h: azar(lista.length, x + z) });
        },
        rotular(padre, texto, x, y, z, color, ancho = 2.4, giro = 0) {
            const l = letrero(texto, color, movil, ancho);
            l.m.position.set(x, y, z);
            l.m.rotation.y = giro;
            padre.add(l.m);
            rotulos.push(l);
            return l.m;
        },
        repintar: () => rotulos.forEach(r => r.pintar()),
        /** Se llama al terminar de construir: junta en una sola malla todas las gotas de cada fluido. */
        cerrarGotas(geo) {
            for (const [k, lista] of Object.entries(gotas)) {
                const malla = new THREE.InstancedMesh(geo, M.fluido[k], lista.length);
                malla.frustumCulled = false;
                raiz.add(malla);
                mallasGota[k] = { malla, lista };
            }
        },
        posar(e, act, ab, { apagar = 0 } = {}) {
            const d = e.desarme;
            const n = e.noche;
            const L = e.encendido;
            movibles.forEach(({ obj, p0, d: dir, k }) => {
                const x = sale(clamp01((d * (1 + k) - k) * 1.05));
                obj.position.copy(p0).addScaledVector(dir, x);
            });
            for (const { mat, abre } of Object.values(cubiertas)) {
                const op = 1 - 0.93 * Math.max(e.adentro, ...abre.map(p => ab[p] ?? 0));
                mat.opacity = op;
                mat.depthWrite = op > 0.6;
            }
            const procesos = new Set();
            for (const lista of Object.values(gotas)) for (const b of lista) procesos.add(b.proceso);
            for (const p of procesos) fasesGota[p] = (fasesGota[p] ?? 0) + e.dt * (0.15 + act(p));
            for (const { malla, lista } of Object.values(mallasGota)) {
                lista.forEach((b, i) => {
                    const f = act(b.proceso);
                    const u = fract((fasesGota[b.proceso] ?? 0) * b.vel + b.h);
                    const fuera = apagar >= 0.5 || f <= 0.02;
                    const r = fuera ? 0 : b.r * Math.min(1, u * 8) * (1 - u * u * u * 0.5) * (0.5 + 0.5 * f);
                    v.set(b.x + Math.sin(e.t * 3 + b.h * 40) * b.abre, lerp(b.y0, b.y1, u), b.z + Math.cos(e.t * 2.6 + b.h * 30) * b.abre);
                    s3.setScalar(Math.max(r, 0.0001));
                    malla.setMatrixAt(i, m4.compose(v, q0, s3));
                });
                malla.instanceMatrix.needsUpdate = true;
            }
            const fases = e.fases || {};
            giran.forEach((g, i) => { g.obj.rotation[g.eje] = fases[i] ?? 0; });
            const adit = n > 0.5 ? THREE.AdditiveBlending : THREE.NormalBlending;
            brillos.forEach(b => {
                const val = act(b.proceso) * b.fuerza * (b.noche ? 0.15 + 0.85 * n : 1) * L * (1 - apagar);
                b.s.material.opacity = Math.min(1, val);
                b.s.visible = val > 0.005;
                if (!b.charco && b.s.material.blending !== adit) b.s.material.blending = adit;
            });
            luces.forEach(({ l, fuerza, proceso }) => { l.intensity = fuerza * act(proceso) * (0.15 + 0.85 * n) * L * (1 + 0.5 * e.adentro); });
        },
    };
    return kit;
}

// ------------------------------------------------------------------ tubos y lo que corre por ellos
/**
 * lineas: { id, fluido, r, puntos, cable, oculto }. oculto: corre por dentro de un equipo y no lleva tubo propio.
 * activa(L, e): si esa línea se dibuja en este momento. parteDe(L): a qué punto clave pertenece.
 */
export function crearTubos({ raiz, lineas: LINEAS, fluidos, M, partes, parteDe = () => null, activa = () => true, movil = false }) {
    const curvaDe = puntos => new THREE.CatmullRomCurve3(puntos.map(p => new THREE.Vector3(...p)), false, 'catmullrom', 0.06);
    const lineas = LINEAS.map(L => {
        const curva = curvaDe(L.puntos);
        const largo = curva.getLength();
        curva.arcLengthDivisions = 200;
        let tubo = null;
        let mat = null;
        if (!L.oculto) {
            mat = L.cable ? M.torre : new THREE.MeshPhysicalMaterial({ color: fluidos[L.fluido].color, roughness: 0.25, transparent: true, opacity: 0.4, clearcoat: 0.8, envMapIntensity: 0.6, depthWrite: false });
            tubo = new THREE.Mesh(new THREE.TubeGeometry(curva, Math.max(14, Math.round(largo * (L.cable ? 12 : 18))), L.r * (L.cable ? 0.7 : 1.3), 8), mat);
            tubo.renderOrder = 2;
            raiz.add(tubo);
            const p = parteDe(L);
            if (p) partes[p].push(tubo);
        }
        return { L, curva, largo, mat, tubo, n: L.cable ? Math.max(6, Math.round(largo * 2.4)) : Math.max(3, Math.round(largo * (movil ? 4 : 6))), base: new THREE.Color(fluidos[L.fluido].color), fase: 0 };
    });
    let total = 0;
    lineas.forEach(l => { l.desde = total; total += l.n; });
    const particulas = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), M.particula, total);
    particulas.frustumCulled = false;
    particulas.renderOrder = 3;
    raiz.add(particulas);
    const colorVacio = new THREE.Color('#aeb2b8');
    lineas.forEach(l => { for (let i = 0; i < l.n; i++) particulas.setColorAt(l.desde + i, l.base); });
    particulas.instanceColor.needsUpdate = true;
    const m4 = new THREE.Matrix4();
    const q0 = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const s3 = new THREE.Vector3();
    // lo que corre por los tubos avanza con su flujo: si el flujo cambia, no da brincos
    const fases = lineas.map(() => 0);
    return {
        lineas,
        posar(e, a) {
            lineas.forEach((l, i) => {
                const f = e.flujos[l.L.id] ?? 0;
                fases[i] += e.dt * (0.25 + 0.75 * f) * 0.35;
                const vale = activa(l.L, e);
                if (l.tubo) {
                    if (!l.L.cable) {
                        const vivo = clamp01(f * 5);
                        l.mat.color.copy(colorVacio).lerp(l.base, vivo);
                        l.mat.opacity = lerp(0.34, lerp(0.42, 0.74, clamp01(f * 2)), vivo) * (1 - a);
                    }
                    l.tubo.visible = a < 0.98 && vale;
                }
                const visible = f > 0.01 && a < 0.5 && vale;
                for (let p = 0; p < l.n; p++) {
                    const r = visible ? Math.max(l.L.r * 0.9, 0.018) : 0;
                    if (r > 0) l.curva.getPointAt(fract(p / l.n + (fases[i] * 1.4) / Math.max(0.6, l.largo)), v);
                    else v.set(0, -7, 0);
                    s3.setScalar(Math.max(r, 0.0001));
                    particulas.setMatrixAt(l.desde + p, m4.compose(v, q0, s3));
                }
            });
            particulas.instanceMatrix.needsUpdate = true;
        },
    };
}
