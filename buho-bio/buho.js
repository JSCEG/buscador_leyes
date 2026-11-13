// El búho biomecánico, hecho con código y calcado de las ideas del usuario: placas de marfil con filo de oro, vidrio ámbar
// que brilla por dentro (corona, cuernos, pecho, plumas), discos faciales de lamas, ojos de lente, engrane dorado en el
// hombro, garras de oro, y dos libros de leyes con su balanza. Por dentro lleva costillas, fuelles que respiran y un núcleo
// de energía. posar(e) coloca todo a partir de pose() en modelo.js; nada se anima por su cuenta.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { D2R, lerp, clamp01, sale, suave, hash, LIBRO, CUELLO, CABEZA, OJOS, R_OJO, R_DISCO, ALA, PLUMAS_ALA, angulosAla, cuerpo, cabeza, normal, enCara } from './modelo.js';
import { v3, sombra, entintar, orientar, lamina, parche, casco, tubo, cuchilla, banda, pluma, geoEngrane, geoDisco, geoPernos, texOro, texPiel, texPulso, texResplandor } from './geo.js';
import { aplicarResina, uniformesResina, texResina } from './resina.js';
import { construirLibros } from './libros.js';

export const P_BUHO = { papel: '#fafafa', noche: '#080a19', tinta: '#171317', marfil: '#f0e9dd', guinda: '#7d1a38', oro: '#d6a44c', grafito: '#25262b', acero: '#a7abb3' };
// tinte: lo que deja pasar; hondo, medio y calor: de la resina apagada a la más encendida; luz: líneas, núcleo y resplandor
export const VIDRIOS = {
    ambar: { fondo: '#7d1a38', tinte: '#b47d45', hondo: '#442718', medio: '#aa6335', calor: '#dfb07e', brillo: '#c8925d', luz: '#d3a778' },
    guinda: { fondo: '#7d1a38', tinte: '#913851', hondo: '#310e1a', medio: '#88334f', calor: '#ca8498', brillo: '#ae607a', luz: '#c28395' },
    azul: { fondo: '#173a6b', tinte: '#486e90', hondo: '#122639', medio: '#3e6587', calor: '#9bb7cc', brillo: '#688fae', luz: '#89a8bf' },
    verde: { fondo: '#0b4f41', tinte: '#377866', hondo: '#12322b', medio: '#356f61', calor: '#93bbab', brillo: '#619788', luz: '#80ab99' },
};

const PI = Math.PI;
const PI2 = PI * 2;

// Iris de lente: profundo en el centro, rayas radiales, aro encendido y un diafragma de siete hojas que abre, cierra y parpadea.
const irisGLSL = `
varying vec2 vUv;
uniform float abre, parpado, luz, giro;
uniform vec3 tinte, brillo;
float ngon(vec2 p, float n, float g) { float a = atan(p.y, p.x) + g; float s = 6.28318 / n; return cos(floor(0.5 + a / s) * s - a) * length(p); }
void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float a = atan(p.y, p.x);
    vec3 perla = vec3(0.82, 0.77, 0.65);
    float fibras = 0.5 + 0.5 * sin(a * 39.0 + r * 6.0);
    vec3 c = mix(brillo, perla, 0.25 + 0.16 * fibras);
    c = mix(c, mix(tinte, perla, 0.14), 0.68 * smoothstep(0.78, 0.98, r));
    float d = ngon(p, 7.0, giro);
    float pup = mix(0.15, 0.44, abre);
    c = mix(mix(tinte * 0.18, vec3(0.025), 0.45), c, smoothstep(pup, pup + 0.025, d));
    float reflejo = 1.0 - smoothstep(0.045, 0.105, length(p - vec2(-0.14, 0.19)));
    c = mix(c, perla, reflejo * 0.78 * luz);
    float lim = mix(1.45, -0.02, parpado);
    float hoja = smoothstep(lim, lim + 0.012, ngon(p, 7.0, giro + 0.4));
    float raya = 0.5 + 0.5 * sin((a + giro) * 7.0);
    c = mix(c, mix(vec3(0.16, 0.13, 0.1), vec3(0.42, 0.32, 0.16), raya), hoja);
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
}`;

export function materiales(P, { movil = false, vidrio = 'ambar' } = {}) {
    const V = VIDRIOS[vidrio];
    const env = { envMapIntensity: 0.8 };
    const fis = (extra) => new THREE.MeshPhysicalMaterial({ clearcoat: 0.55, clearcoatRoughness: 0.28, ...env, ...extra });
    const oro = new THREE.MeshStandardMaterial({ color: P.oro, metalness: 1, roughness: 0.24, envMapIntensity: 1.35 });
    const oroViejo = new THREE.MeshStandardMaterial({ color: '#a67c35', metalness: 1, roughness: 0.44, envMapIntensity: 1.1 });
    const grafito = new THREE.MeshStandardMaterial({ color: P.grafito, metalness: 0.65, roughness: 0.46, ...env });
    const acero = new THREE.MeshStandardMaterial({ color: P.acero, metalness: 0.9, roughness: 0.34, ...env });
    const marfil = fis({ color: P.marfil, roughness: 0.42, metalness: 0.02 });
    const lama = fis({ color: '#f6f1e7', roughness: 0.46, metalness: 0, clearcoat: 0.3 });
    const placaT = texOro(P, { fondo: P.marfil, filo: 0.032, vena: 0 });
    const hojaT = texOro(P, { fondo: P.marfil, filo: 0.05, vena: 0.016 });
    // lo que acompaña al vidrio se pinta por color y se guarda: guinda con ámbar y guinda, azul y verde con los suyos
    const tonos = {};
    const tono = nombre => {
        const fondo = VIDRIOS[nombre].fondo;
        tonos[fondo] ||= { punta: texOro(P, { fondo: P.marfil, filo: 0.05, vena: 0.016, punta: fondo }), pluma: texOro(P, { fondo, filo: 0.05, vena: 0.012 }) };
        return tonos[fondo];
    };
    const puntaT = tono(vidrio).punta;
    const largaT = texOro(P, { fondo: P.marfil, filo: 0.042, vena: 0.012, barras: 4 });
    const guindaT = tono(vidrio).pluma;
    // las del cuerpo se vuelven transparentes con «Ver por dentro»; las del ala no
    const placa = fis(placaT);
    const placaAla = fis(placaT);
    const hoja = fis(hojaT);
    const hojaAla = fis(hojaT);
    const hojaPunta = fis(puntaT);
    const larga = fis(largaT);
    const plumaGuinda = fis({ ...guindaT, side: THREE.DoubleSide });
    const resina = uniformesResina(V);
    const texR = texResina(hash);
    const hacerVidrio = pluma => aplicarResina(movil
        // celular: película teñida con reflejos, sin dibujar la escena dos veces
        ? fis({ color: '#ffffff', transparent: true, opacity: 0.95, roughness: 0.14, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, emissive: '#ffffff', emissiveMap: texR, envMapIntensity: 1.25 })
        : new THREE.MeshPhysicalMaterial({ color: '#ffffff', transmission: 1, thickness: 0.5, ior: 1.5, roughness: 0.07, metalness: 0, attenuationColor: new THREE.Color(V.tinte), attenuationDistance: 0.6, emissive: '#ffffff', emissiveMap: texR, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.2 }), resina, pluma);
    const cristal = hacerVidrio(false);
    const cristalPluma = hacerVidrio(true);
    const domo = movil
        ? fis({ color: '#ffffff', transparent: true, opacity: 0.16, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.6, depthWrite: false })
        : new THREE.MeshPhysicalMaterial({ color: '#ffffff', transmission: 1, thickness: 0.06, ior: 1.42, roughness: 0.03, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6 });
    const pelicula = fis({ color: '#ffffff', transparent: true, opacity: 0.18, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.5, depthWrite: false });
    const pulso = texPulso();
    const neon = new THREE.MeshBasicMaterial({ map: pulso, color: V.luz, toneMapped: false });
    const luz = new THREE.MeshBasicMaterial({ color: V.luz, toneMapped: false });
    const nucleo = new THREE.MeshBasicMaterial({ color: '#ffd98e', toneMapped: false });
    const piel = new THREE.MeshBasicMaterial({ map: texPiel(hash), color: V.brillo, toneMapped: false });
    const caparazon = new THREE.MeshStandardMaterial({ color: '#1a1a1f', metalness: 0.5, roughness: 0.6, ...env });
    const tinta = new THREE.LineBasicMaterial({ color: P.tinta, transparent: true, opacity: 0.2 });
    const resplandor = texResplandor();
    const esmalte = new THREE.MeshPhysicalMaterial({ color: V.fondo, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 0.9 });
    const iris = new THREE.ShaderMaterial({
        uniforms: { abre: { value: 0.55 }, parpado: { value: 0 }, luz: { value: 1 }, giro: { value: 0 }, tinte: { value: new THREE.Color(V.tinte) }, brillo: { value: new THREE.Color(V.brillo) } },
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: irisGLSL,
    });
    return {
        movil, oro, oroViejo, grafito, acero, marfil, lama, placa, placaAla, hoja, hojaAla, hojaPunta, larga, plumaGuinda,
        tono, esmalte, cristal, cristalPluma, resina, brillo: new THREE.Color(V.brillo), domo, pelicula, neon, luz, nucleo, piel, caparazon, tinta, resplandor, iris, pulso,
        // lo que se apaga de noche (el color multiplica su textura)
        marfiles: [marfil, lama, placa, placaAla, hoja, hojaAla, hojaPunta, larga],
        // lo que se vuelve transparente con «Ver por dentro»
        funden: [placa, hoja, hojaPunta, caparazon, piel],
    };
}

/** Vidrio de película en vez de transmisión: para equipos que no alcanzan a dibujar la escena dos veces. */
export function vidrioLigero(M) {
    for (const m of [M.cristal, M.cristalPluma, M.domo]) {
        if (!m.transmission) continue;
        m.transmission = 0;
        m.transparent = true;
        m.opacity = m === M.domo ? 0.16 : 0.95;
        if (m === M.domo) m.depthWrite = false;
        m.attenuationDistance = Infinity;
        m.needsUpdate = true;
    }
    M.ligero = true;
}

/** Cambia el color del vidrio (ámbar, guinda, azul o verde) sin reconstruir nada. */
export function cambiarVidrio(M, nombre) {
    const V = VIDRIOS[nombre];
    for (const m of [M.cristal, M.cristalPluma]) if (m.transmission) m.attenuationColor.set(V.tinte);
    M.resina.rHondo.value.set(V.hondo);
    M.resina.rMedio.value.set(V.medio);
    M.resina.rCalor.value.set(V.calor);
    M.brillo.set(V.brillo);
    M.esmalte.color.set(V.fondo);
    const t = M.tono(nombre);
    M.hojaPunta.map = t.punta.map;
    M.plumaGuinda.map = t.pluma.map;
    M.neon.color.set(V.luz);
    M.luz.color.set(V.luz);
    M.piel.color.set(V.brillo);
    M.iris.uniforms.tinte.value.set(V.tinte);
    M.iris.uniforms.brillo.value.set(V.brillo);
}

// ---------------------------------------------------------------- lotes: muchas piezas iguales en una sola llamada de dibujo
const o3 = new THREE.Object3D();
const qA = new THREE.Quaternion();
const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);

function lote(geo, mat, lista, padre) {
    const m = sombra(new THREE.InstancedMesh(geo, mat, lista.length));
    lista.forEach((it, i) => {
        o3.position.copy(it.p);
        o3.quaternion.copy(it.q);
        o3.scale.copy(it.s);
        o3.updateMatrix();
        m.setMatrixAt(i, o3.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.frustumCulled = false;
    padre.add(m);
    return { m, lista };
}
function colocar(l, f) {
    l.lista.forEach((it, i) => {
        f(it);
        o3.updateMatrix();
        l.m.setMatrixAt(i, o3.matrix);
    });
    l.m.instanceMatrix.needsUpdate = true;
}
/** Una hoja apoyada en una superficie, apuntando hacia dir. */
function hojaEn(S, t, a, k, largo, ancho, dir) {
    const p = v3(S(t, a, k));
    const n = v3(normal(S, t, a, k));
    const o = new THREE.Object3D();
    orientar(o, n, dir);
    return { p, n, q: o.quaternion.clone(), s: new THREE.Vector3(ancho, largo, largo * 0.8), h: hash(t * 91 + a * 37), t, a };
}
const envolver = a => { const b = ((a % PI2) + PI2) % PI2; return b > PI ? b - PI2 : b; };

// ---------------------------------------------------------------- el búho
export function construir(M, P) {
    const raiz = new THREE.Group();
    const vuelo = new THREE.Group(); // todo menos los libros: al abrir las alas se levanta
    raiz.add(vuelo);
    const torso = new THREE.Group(); // respira
    vuelo.add(torso);
    const partes = { ojos: [], libro: [], columna: [], garras: [], alas: [], cara: [], nucleo: [] };
    const anclas = {};
    const placas = [];
    const giran = [];
    const resplandores = [];
    const ancla = (nombre, padre, p) => { const a = new THREE.Object3D(); a.position.set(...p); padre.add(a); anclas[nombre] = a; return a; };
    const brillo = (padre, p, escala, fuerza = 0.5) => {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.resplandor, color: M.luz.color, transparent: true, depthWrite: false, toneMapped: false, opacity: fuerza }));
        s.position.set(...p);
        s.scale.setScalar(escala);
        padre.add(s);
        resplandores.push({ s, fuerza, escala });
        return s;
    };

    /** Placa sobre una superficie que sale volando por su normal al desarmar. */
    const montar = (padre, geo, c, n, mat, tinta = true) => {
        const g = new THREE.Group();
        g.position.set(...c);
        const m = sombra(new THREE.Mesh(geo, mat));
        if (tinta) entintar(m, M.tinta, 42);
        g.add(m);
        g.userData = { p0: g.position.clone(), dir: v3(n), h: hash(placas.length * 3.1 + 2) };
        padre.add(g);
        placas.push(g);
        return g;
    };
    const placa = (padre, S, t0, t1, a0, a1, op = {}) => {
        const { k = 1.02, mat = M.placa, tinta = true } = op;
        const tm = (t0 + t1) / 2;
        const am = (a0 + a1) / 2;
        const c = S(tm, am, k);
        return montar(padre, parche(S, t0, t1, a0, a1, { ...op, k, centro: c }), c, normal(S, tm, am, k), mat, tinta);
    };
    const bandaEn = (padre, S, ruta, ancho, op = {}) => {
        const { k = 1.04, mat = M.placa, tinta = true } = op;
        const [am, tm] = ruta[Math.floor(ruta.length / 2)];
        const c = S(tm, am, k);
        return montar(padre, banda(S, ruta, ancho, { ...op, k, centro: c }), c, normal(S, tm, am, k), mat, tinta);
    };
    const hojaAncho = h0 => s => 0.004 + h0 * Math.sin(PI * s ** 0.72) ** 0.55;

    const geoHoja = pluma({ larga: false, curva: 0.16 });
    const geoLarga = pluma({ larga: true, curva: 0.07 });

    // ------------------------------------------------------------ tronco: casco, piel luminosa, engranes tras el vidrio
    const caparazon = sombra(new THREE.Mesh(casco(cuerpo, 0.9), M.caparazon));
    const piel = new THREE.Mesh(casco(cuerpo, 0.935), M.piel);
    torso.add(caparazon, piel);
    for (const [t, a, r] of [[0.5, 0.42, 0.13], [0.62, 0.62, 0.09], [0.4, 0.68, 0.08], [0.7, 0.34, 0.08]]) {
        for (const s of [1, -1]) {
            const p = v3(cuerpo(t, s * a, 0.965));
            const e = new THREE.Mesh(geoEngrane(r, Math.round(r * 110), 0.02), M.oro);
            e.position.copy(p);
            orientar(e, v3(normal(cuerpo, t, s * a, 0.965)), Y);
            torso.add(e);
            giran.push({ obj: e, v: (s * (0.4 / r)) * 0.08 });
        }
    }

    // Vidrio del pecho: dos pulmones que se ven por entre las hojas de marfil.
    for (const s of [1, -1]) {
        const [a0, a1] = s > 0 ? [0.03, 1.2] : [-1.2, -0.03];
        placa(torso, cuerpo, 0.2, 0.86, a0, a1, { k: 1.01, grosor: 0.03, mat: M.cristal, n: 22, m: 18, e: 0.28, corte: 0.32, tinta: false });
    }
    // Hojas de marfil que barren del centro hacia afuera: forman la V del pecho.
    for (const s of [1, -1]) {
        const ruta = r => r.map(([a, t]) => [s * a, t]);
        bandaEn(torso, cuerpo, ruta([[0.1, 0.33], [0.46, 0.22], [0.92, 0.17], [1.34, 0.21]]), hojaAncho(0.14), { k: 1.1, grosor: 0.034, n: 26 });
        bandaEn(torso, cuerpo, ruta([[0.07, 0.56], [0.36, 0.46], [0.78, 0.37], [1.2, 0.36]]), hojaAncho(0.078), { k: 1.1, grosor: 0.03 });
        bandaEn(torso, cuerpo, ruta([[0.06, 0.71], [0.32, 0.62], [0.72, 0.53], [1.14, 0.53]]), hojaAncho(0.07), { k: 1.1, grosor: 0.03 });
        bandaEn(torso, cuerpo, ruta([[0.05, 0.85], [0.28, 0.77], [0.64, 0.69], [1.06, 0.7]]), hojaAncho(0.062), { k: 1.09, grosor: 0.028 });
    }

    // Colgante del pecho: V de oro con esmalte guinda y, arriba, el núcleo de energía tras su lente.
    const colgante = (kk, grosor, escala, mat) => lamina({
        n: 22, m: 8, base: 0.4,
        f: (s, w) => {
            const hw = 0.205 * escala * Math.min(1, (s + 0.06) / 0.2) ** 0.5 * (1 - s) ** 0.72;
            const t = lerp(0.235, 0.725, s * (0.2 + 0.8 * escala));
            const a = w * hw;
            return { p: cuerpo(t, a, kk), n: normal(cuerpo, t, a, kk) };
        },
        g: () => grosor,
    });
    {
        const g = new THREE.Group();
        const oro = sombra(new THREE.Mesh(colgante(1.125, 0.024, 1, null), M.oro));
        const esmalte = new THREE.Mesh(colgante(1.145, 0.012, 0.66, null), M.esmalte);
        g.add(oro, esmalte);
        g.userData = { p0: new THREE.Vector3(), dir: new THREE.Vector3(0, 0, 1), h: 0.5 };
        torso.add(g);
        placas.push(g);
        partes.nucleo.push(g);
    }
    const reactor = new THREE.Group();
    {
        const t = 0.345;
        const c = cuerpo(t, 0, 1.17);
        reactor.position.set(...c);
        orientar(reactor, v3(normal(cuerpo, t, 0, 1.17)), Y);
        const bisel = sombra(new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.026, 14, 56), M.oro));
        const fondo = sombra(new THREE.Mesh(geoDisco(0.135, 0.05, 40), M.grafito));
        fondo.position.z = -0.025;
        const corona = new THREE.Mesh(geoEngrane(0.118, 26, 0.012), M.oroViejo);
        corona.position.z = 0.003;
        const gema = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 2), M.nucleo);
        gema.position.z = 0.035;
        const aro = new THREE.Mesh(new THREE.TorusGeometry(0.094, 0.0055, 8, 48), M.luz);
        aro.position.z = 0.024;
        const lente = new THREE.Mesh(new THREE.SphereGeometry(0.118, 32, 14, 0, PI2, 0, PI * 0.42).rotateX(PI / 2).scale(1, 1, 0.75), M.pelicula);
        lente.position.z = 0.012;
        lente.renderOrder = 6;
        reactor.add(fondo, bisel, corona, gema, aro, lente);
        brillo(reactor, [0, 0, 0.1], 0.72, 0.62);
        giran.push({ obj: corona, v: 0.5 });
        reactor.userData = { p0: reactor.position.clone(), dir: new THREE.Vector3(0, 0.1, 1), h: 0.2, gema };
        placas.push(reactor);
        torso.add(reactor);
        partes.nucleo.push(reactor);
        ancla('nucleo', torso, c);
    }

    // Hojas del cuerpo: hombros, costados, vientre y espalda; el frente lleva vidrio y la espalda abre paso a la columna.
    const hojasCuerpo = [];
    const hojasPunta = [];
    const abajo = new THREE.Vector3(0, -1, 0);
    for (let fila = 0, t = 0.03; t < 0.985; fila++, t += t < 0.2 ? 0.05 : 0.058) {
        const [, , rx] = [0, 0, 0.6];
        const pieza = cuerpo(t, PI / 2, 1)[0] || rx;
        const n = Math.max(6, Math.round((PI2 * pieza) / (t < 0.2 ? 0.2 : 0.165)));
        for (let k = 0; k < n; k++) {
            const a = envolver(((k + (fila % 2 ? 0.5 : 0)) / n) * PI2);
            const frente = Math.abs(a) < 1.2 && t > 0.2 && t < 0.86;
            const lomo = Math.abs(envolver(a - PI)) < 0.2;
            const mantoCeldas = Math.abs(envolver(a - PI)) < 0.74 && t > 0.1 && t < 0.46;
            if (frente || lomo || mantoCeldas) continue;
            const L = t < 0.2 ? 0.34 : 0.27;
            const W = t < 0.2 ? 0.24 : 0.2;
            const it = hojaEn(cuerpo, t, a, 1.03, L, W, abajo);
            const conPunta = (t > 0.84 && k % 2 === 0) || (Math.abs(a) > 1.9 && fila % 3 === 1);
            (conPunta ? hojasPunta : hojasCuerpo).push(it);
        }
    }
    const loteCuerpo = lote(geoHoja, M.hoja, hojasCuerpo, torso);
    const lotePunta = lote(geoHoja, M.hojaPunta, hojasPunta, torso);
    partes.nucleo.push(loteCuerpo.m, lotePunta.m);

    // ------------------------------------------------------------ por dentro: costillas, fuelles, columna y el eje del núcleo
    const adentro = new THREE.Group();
    torso.add(adentro);
    for (let i = 0; i < 6; i++) {
        const t = 0.2 + i * 0.1;
        for (const s of [1, -1]) {
            const puntos = [];
            for (let q = 0; q <= 8; q++) puntos.push(cuerpo(t + 0.03 * Math.sin((q / 8) * PI), s * lerp(PI - 0.12, 0.14, q / 8), 0.84));
            adentro.add(new THREE.Mesh(tubo(puntos, 0.016, { seg: 24, rad: 6 }), M.oroViejo));
        }
    }
    const fuelles = [1, -1].map(s => {
        const g = new THREE.Group();
        g.position.set(s * 0.3, -0.22, 0.0);
        for (let i = 0; i < 10; i++) {
            const y = -0.3 + i * 0.066;
            const r = 0.13 + 0.05 * Math.sin((i / 9) * PI);
            const anillo = new THREE.Mesh(new THREE.TorusGeometry(r, 0.024, 8, 26).rotateX(PI / 2), i % 3 === 1 ? M.oro : M.grafito);
            anillo.position.y = y;
            g.add(anillo);
        }
        const tapa = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.03, 20), M.oroViejo);
        tapa.position.y = 0.34;
        g.add(tapa);
        adentro.add(g);
        return g;
    });
    adentro.add(new THREE.Mesh(tubo([[0, 0.5, -0.22], [0, 0.05, -0.28], [0, -0.45, -0.26], [0, -0.85, -0.2]], 0.042, { seg: 24 }), M.grafito));
    for (let i = 0; i < 7; i++) {
        const a = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.012, 6, 20).rotateX(PI / 2), M.luz);
        a.position.set(0, 0.42 - i * 0.2, -0.24 - 0.04 * Math.sin((i / 6) * PI));
        adentro.add(a);
    }
    adentro.add(new THREE.Mesh(tubo([[0, 0.09, 0.48], [0, 0.04, 0.2], [0, -0.1, -0.2]], 0.03, { seg: 14 }), M.oro));
    const corazon = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 2), M.nucleo);
    corazon.position.set(0, -0.02, 0.06);
    adentro.add(corazon);
    brillo(adentro, [0, -0.02, 0.06], 0.7, 0.5);

    // ------------------------------------------------------------ columna y celdas de la espalda
    const columna = new THREE.Group();
    torso.add(columna);
    partes.columna.push(columna);
    partes.columna.push(placa(columna, cuerpo, 0.03, 0.97, PI - 0.2, PI + 0.2, { k: 1.0, grosor: 0.014, mat: M.piel, tinta: false, n: 26, m: 6 }));
    for (const s of [1, -1]) {
        const [a0, a1] = s > 0 ? [PI + 0.2, PI + 0.8] : [PI - 0.8, PI - 0.2];
        partes.columna.push(placa(columna, cuerpo, 0.09, 0.47, a0, a1, { k: 1.03, grosor: 0.026, n: 14, m: 10 }));
    }
    const geoVert = new RoundedBoxGeometry(0.17, 0.075, 0.05, 2, 0.014);
    for (let i = 0; i < 12; i++) {
        const t = 0.07 + i * 0.075;
        const k = 1.045;
        const p = v3(cuerpo(t, PI, k));
        const n = v3(normal(cuerpo, t, PI, k));
        const g = new THREE.Group();
        g.position.copy(p);
        orientar(g, n, new THREE.Vector3(0, 1, 0));
        const bloque = sombra(new THREE.Mesh(geoVert, M.oroViejo));
        const espina = sombra(new THREE.Mesh(geoHoja, M.placaAla));
        espina.scale.set(0.13, 0.12, 0.1);
        espina.position.set(0, 0.05, 0.026);
        espina.rotation.z = PI;
        const nodo = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), M.luz);
        nodo.position.set(0, -0.014, 0.034);
        g.add(bloque, espina, nodo);
        g.userData = { p0: g.position.clone(), dir: n.clone(), h: hash(i + 200) * 0.3 };
        placas.push(g);
        columna.add(g);
    }
    for (const s of [1, -1]) {
        for (const d of [0.12, 0.17]) {
            const puntos = [];
            for (let q = 0; q <= 8; q++) puntos.push(cuerpo(0.05 + q * 0.112, PI + s * d, 1.018));
            columna.add(new THREE.Mesh(tubo(puntos, 0.0085, { seg: 30, rad: 6 }), d < 0.15 ? M.neon : M.oroViejo));
        }
    }
    const celdas = [1, -1].map(s => {
        const a = PI + s * 0.48;
        const A = cuerpo(0.15, a, 1.17);
        const B = cuerpo(0.41, a, 1.15);
        const g = new THREE.Group();
        const liquido = new THREE.Mesh(tubo([A, B], 0.05, { seg: 8, rad: 12 }), M.luz);
        const manga = new THREE.Mesh(tubo([A, B], 0.074, { seg: 8, rad: 16 }), M.pelicula);
        manga.renderOrder = 5;
        g.add(liquido, manga);
        for (const P0 of [A, B]) {
            const t = new THREE.Mesh(new THREE.TorusGeometry(0.076, 0.016, 8, 24), M.oro);
            t.position.set(...P0);
            t.quaternion.setFromUnitVectors(Z, v3(B).sub(v3(A)).normalize());
            g.add(t);
        }
        brillo(g, [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2 - 0.05], 0.55, 0.4);
        columna.add(g);
        return liquido;
    });
    ancla('columna', vuelo, cuerpo(0.42, PI, 1.1));

    // ------------------------------------------------------------ cabeza
    const cab = new THREE.Group();
    cab.position.set(...CUELLO);
    cab.rotation.order = 'YXZ';
    vuelo.add(cab);
    const craneo = sombra(new THREE.Mesh(casco(cabeza, 0.88), M.caparazon));
    const pielCab = new THREE.Mesh(casco(cabeza, 0.925, { t1: 0.5 }), M.piel);
    cab.add(craneo, pielCab);
    for (const [t, a, r] of [[0.14, 0.4, 0.11], [0.15, -0.46, 0.09], [0.08, -0.1, 0.06]]) {
        const e = new THREE.Mesh(geoEngrane(r, Math.round(r * 110), 0.018), M.oro);
        e.position.set(...cabeza(t, a, 0.945));
        orientar(e, v3(normal(cabeza, t, a, 0.945)), Y);
        cab.add(e);
        giran.push({ obj: e, v: (a > 0 ? 1 : -1) * 0.032 / r });
    }
    // corona de vidrio: se detiene arriba de los discos y baja entre las dos cejas
    const borde = a => 0.3 + 0.17 * Math.exp(-((a / 0.2) ** 2)) + 0.09 * suave((Math.abs(a) - 0.95) / 0.5);
    const coronaGeo = lamina({
        n: 18, m: 40, base: 0.6,
        f: (s, w) => {
            const a = w * 1.72;
            const t = 0.015 + s * (borde(a) - 0.015);
            return { p: cabeza(t, a, 1.0), n: normal(cabeza, t, a, 1.0) };
        },
        g: () => 0.03,
    });
    const corona = new THREE.Mesh(coronaGeo, M.cristal);
    cab.add(corona);
    partes.cara.push(corona);
    const orilla = [];
    for (let q = 0; q <= 40; q++) { const a = lerp(-1.72, 1.72, q / 40); orilla.push(cabeza(borde(a) + 0.002, a, 1.024)); }
    cab.add(new THREE.Mesh(tubo(orilla, 0.016, { seg: 90, rad: 6 }), M.oro));
    const costura = [];
    for (let q = 0; q <= 12; q++) costura.push(cabeza(0.015 + (q / 12) * 0.43, 0, 1.03));
    cab.add(new THREE.Mesh(tubo(costura, 0.013, { seg: 30, rad: 6 }), M.oro));
    // hojitas de los lados y la nuca
    const hojasCab = [];
    const hojasCabPunta = [];
    const haciaAtras = new THREE.Vector3(0, -1, -0.35);
    for (let fila = 0, t = 0.03; t < 0.97; fila++, t += t < 0.3 ? 0.044 : 0.058) {
        const n = Math.max(7, Math.round((PI2 * CABEZA.rx * Math.sin(t * PI)) / 0.17));
        for (let k = 0; k <= n; k++) {
            const a = envolver(((k + (fila % 2 ? 0.5 : 0)) / n) * PI2);
            if (t < 0.72 && Math.abs(a) < 1.2) continue;
            if (Math.abs(a) < 1.74 && t < borde(a) - 0.01) continue;
            const pc = cabeza(t, a, 1.02);
            if (pc[2] > 0 && OJOS.some(([ox, oy]) => Math.hypot(pc[0] - ox, pc[1] - oy) < R_DISCO + 0.03)) continue;
            const it = hojaEn(cabeza, t, a, 1.02, t < 0.3 ? 0.21 : 0.25, t < 0.3 ? 0.17 : 0.19, haciaAtras);
            (t < 0.34 && fila % 2 === 0 ? hojasCabPunta : hojasCab).push(it);
        }
    }
    const loteCab = lote(geoHoja, M.hoja, hojasCab, cab);
    const loteCabP = lote(geoHoja, M.hojaPunta, hojasCabPunta, cab);
    partes.cara.push(loteCab.m, loteCabP.m);

    // discos faciales: lamas de marfil del ojo al filo de oro, en forma de plato
    const lamaGeo = lamina({
        n: 3, m: 2, base: 0.4,
        f: (s, w) => ({ p: [w * 0.5 * lerp(R_OJO / R_DISCO, 1, s), s, 0], n: [0, 0, 1] }),
        g: () => 0.016,
    });
    const lamas = [];
    const ruff = [];
    const ojos = [];
    const lentes = [];
    const PLATO = 0.07;
    const enPlato = (ox, oy, x, y, extra = 0) => {
        const c = enCara(x, y);
        const r = Math.hypot(x - ox, y - oy) / R_DISCO;
        return { p: v3(c.p).addScaledVector(v3(c.n), extra - PLATO * Math.max(0, 1 - r * r)), n: v3(c.n) };
    };
    OJOS.forEach(([ox, oy]) => {
        const s = ox < 0 ? -1 : 1;
        const N = 42;
        for (let k = 0; k < N; k++) {
            const a = (k / N) * PI2;
            const dx = Math.cos(a);
            const dy = Math.sin(a);
            const r1 = R_OJO * 1.02;
            const A = enPlato(ox, oy, ox + dx * r1, oy + dy * r1, 0.012);
            const B = enPlato(ox, oy, ox + dx * (R_DISCO + 0.045), oy + dy * (R_DISCO + 0.045), 0.014);
            const dir = B.p.clone().sub(A.p);
            const largo = dir.length();
            const n = A.n.clone().add(B.n).normalize();
            const o = new THREE.Object3D();
            orientar(o, n, dir);
            o.quaternion.multiply(qA.setFromAxisAngle(Y, (k % 2 ? 1 : -1) * 0.05));
            lamas.push({ p: A.p, n, q: o.quaternion.clone(), s: new THREE.Vector3((PI2 * R_DISCO * 0.93) / N, largo, 1), h: hash(k + (s > 0 ? 100 : 0)) });
        }
        // plato de fondo: lo que se ve entre lama y lama
        const plato = lamina({
            n: 3, m: 48, base: 0.2,
            f: (q, w) => {
                const a = (w + 1) * PI;
                const r = lerp(R_OJO * 0.9, R_DISCO + 0.05, q);
                const c = enPlato(ox, oy, ox + Math.cos(a) * r, oy + Math.sin(a) * r, -0.06);
                return { p: [c.p.x, c.p.y, c.p.z], n: [c.n.x, c.n.y, c.n.z] };
            },
            g: () => 0.004,
        });
        cab.add(new THREE.Mesh(plato, new THREE.MeshStandardMaterial({ color: '#a2968a', roughness: 0.8, metalness: 0.05, side: THREE.DoubleSide })));
        // filo de oro del disco, con sus marcas
        const filo = [];
        const lista = [];
        for (let q = 0; q <= 64; q++) {
            const a = (q / 64) * PI2;
            filo.push(enPlato(ox, oy, ox + Math.cos(a) * R_DISCO, oy + Math.sin(a) * R_DISCO, 0.026).p);
        }
        const aroDisco = sombra(new THREE.Mesh(tubo(filo, 0.013, { seg: 120, rad: 8 }), M.oro));
        const filoAncho = [];
        for (let q = 0; q <= 64; q++) {
            const a = (q / 64) * PI2;
            filoAncho.push(enPlato(ox, oy, ox + Math.cos(a) * (R_DISCO + 0.036), oy + Math.sin(a) * (R_DISCO + 0.036), 0.03).p);
        }
        const aroMarfil = sombra(new THREE.Mesh(tubo(filoAncho, 0.03, { seg: 120, rad: 8, plano: [1, 0.6] }), M.marfil));
        cab.add(aroDisco, aroMarfil);
        partes.cara.push(aroDisco, aroMarfil);
        for (let q = 0; q < 40; q++) {
            const a = (q / 40) * PI2;
            const c = enPlato(ox, oy, ox + Math.cos(a) * (R_DISCO + 0.036), oy + Math.sin(a) * (R_DISCO + 0.036), 0.064);
            lista.push({ p: c.p, n: c.n });
        }
        cab.add(new THREE.Mesh(geoPernos(lista, 0.0115), M.oroViejo));
        // plumón de marfil por fuera del filo (abajo y a los lados)
        for (let q = 0; q < 34; q++) {
            const a = lerp(-PI * 0.86, PI * 0.42, q / 33) * s + (s < 0 ? PI : 0);
            const dx = Math.cos(a);
            const dy = Math.sin(a);
            const x = ox + dx * (R_DISCO + 0.05);
            const y = oy + dy * (R_DISCO + 0.05);
            if (s * x < 0.06) continue;
            const c = enCara(x, y);
            const o = new THREE.Object3D();
            orientar(o, v3(c.n), new THREE.Vector3(dx, dy, -0.1));
            ruff.push({ p: v3(c.p).addScaledVector(v3(c.n), 0.012), n: v3(c.n), q: o.quaternion.clone(), s: new THREE.Vector3(0.14, 0.17, 0.14), h: hash(q * 3 + s) });
        }

        // Ojo: tambor, bisel de oro, iris de lente y domo de vidrio.
        const g = new THREE.Group();
        const cara = enCara(ox, oy);
        const nn = v3(cara.n).lerp(Z, 0.62).normalize();
        g.position.copy(v3(cara.p).addScaledVector(v3(cara.n), -PLATO + 0.02));
        g.quaternion.setFromUnitVectors(Z, nn);
        const tambor = sombra(new THREE.Mesh(geoDisco(R_OJO, 0.14, 56), M.grafito));
        tambor.position.z = -0.05;
        const bisel = sombra(new THREE.Mesh(new THREE.TorusGeometry(R_OJO, 0.032, 16, 72), M.oro));
        bisel.position.z = 0.02;
        const filete = new THREE.Mesh(new THREE.TorusGeometry(R_OJO - 0.036, 0.009, 8, 64), M.oroViejo);
        filete.position.z = 0.03;
        const iris = new THREE.Mesh(new THREE.CircleGeometry(R_OJO - 0.04, 56), M.iris);
        iris.position.z = 0.024;
        const domo = new THREE.Mesh(new THREE.SphereGeometry(R_OJO - 0.022, 36, 16, 0, PI2, 0, PI * 0.45).rotateX(PI / 2).scale(1, 1, 0.6), M.domo);
        domo.position.z = 0.004;
        domo.renderOrder = 6;
        g.add(tambor, bisel, filete, iris, domo);
        brillo(g, [0, 0, 0.1], 0.62, 0.22);
        cab.add(g);
        g.userData = { p0: g.position.clone(), dir: new THREE.Vector3(s * 0.25, 0, 0.9), h: 0.3 };
        placas.push(g);
        ojos.push(g);
        lentes.push(iris);
        partes.ojos.push(g);
    });
    const loteLamas = lote(lamaGeo, M.lama, lamas, cab);
    const loteRuff = lote(geoHoja, M.hoja, ruff, cab);
    partes.cara.push(loteLamas.m, loteRuff.m);
    ancla('ojos', cab, [OJOS[1][0], OJOS[1][1], 0.62]);
    ancla('cara', cab, [0.72, 0.36, 0.42]);

    // Cejas, cuernos y el resto de la cara.
    const penachos = [];
    for (const s of [1, -1]) {
        const sobreCara = (x, y, sube) => { const c = enCara(x, y); return v3(c.p).addScaledVector(v3(c.n), sube); };
        const puntos = sube => [sobreCara(0, 0.53, sube), sobreCara(s * 0.2, 0.67, sube), sobreCara(s * 0.48, 0.82, sube), sobreCara(s * 0.72, 0.92, sube), [s * 0.98, 1.08, 0.14], [s * 1.2, 1.34, 0.03]];
        const anchoCeja = q => 0.012 + 0.125 * Math.sin(PI * q ** 0.62) * (1 - q * 0.2);
        const cejaOro = sombra(new THREE.Mesh(cuchilla(puntos(0.05).map(p => (p.isVector3 ? p.clone().setY(p.y - 0.045) : [p[0], p[1] - 0.05, p[2]])), q => anchoCeja(q) * 0.92, { grosor: 0.024, n0: [s * 0.25, -0.05, 1] }), M.oro));
        const ceja = sombra(new THREE.Mesh(cuchilla(puntos(0.075), anchoCeja, { grosor: 0.04, n0: [s * 0.25, 0.05, 1] }), M.placa));
        const grupo = new THREE.Group();
        grupo.add(cejaOro, ceja);
        cab.add(grupo);
        grupo.userData = { p0: new THREE.Vector3(), dir: new THREE.Vector3(s * 0.4, 0.5, 0.75), h: 0.5 };
        placas.push(grupo);
        partes.cara.push(grupo);

        // cuerno de vidrio con filo de oro, detrás de la ceja; gira un poco desde su base
        const penacho = new THREE.Group();
        const base = [s * 0.66, 1.0, 0.1];
        penacho.position.set(...base);
        const rel = p => [p[0] - base[0], p[1] - base[1], p[2] - base[2]];
        const ruta = [[s * 0.66, 1.0, 0.1], [s * 0.92, 1.22, 0.0], [s * 1.06, 1.46, -0.05], [s * 1.0, 1.68, -0.1]].map(rel);
        const anchoCuerno = q => 0.004 + 0.19 * (1 - q) ** 0.75 * Math.min(1, (q + 0.14) / 0.3);
        const cuerno = new THREE.Mesh(cuchilla(ruta, anchoCuerno, { grosor: 0.055, n0: [0, 0, 1], m: 8 }), M.cristal);
        const filoC = [];
        const cc = new THREE.CatmullRomCurve3(ruta.map(v3));
        for (let q = 0; q <= 14; q++) {
            const u = q / 14;
            const c = cc.getPointAt(u);
            const T = cc.getTangentAt(u);
            const lado = new THREE.Vector3().crossVectors(T, Z).normalize();
            filoC.push(c.addScaledVector(lado, -s * anchoCuerno(u)));
        }
        const filoOro = new THREE.Mesh(tubo(filoC, q => 0.015 * (1 - q) + 0.003, { seg: 30, rad: 6 }), M.oro);
        penacho.add(cuerno, filoOro);
        cab.add(penacho);
        penacho.userData = { lado: s, p0: penacho.position.clone(), h: 0.6, dir: new THREE.Vector3(s * 0.6, 0.6, -0.2) };
        placas.push(penacho);
        penachos.push(penacho);
        partes.cara.push(penacho);

        // barbilla: dos hojas en V bajo el pico
        for (const [y0, h0] of [[0.13, 0.05], [0.0, 0.042]]) {
            const m = sombra(new THREE.Mesh(cuchilla([sobreCara(0, y0 - 0.06, 0.03), sobreCara(s * 0.16, y0 - 0.02, 0.03), sobreCara(s * 0.34, y0 + 0.02, 0.012)], hojaAncho(h0), { grosor: 0.024, n: 14 }), M.placa));
            cab.add(m);
            partes.cara.push(m);
        }
    }
    {
        const c = enCara(0, -0.02);
        const o = new THREE.Object3D();
        orientar(o, v3(c.n), new THREE.Vector3(0, -1, 0));
        const m = sombra(new THREE.Mesh(geoHoja, M.placa));
        m.position.copy(v3(c.p).addScaledVector(v3(c.n), 0.02));
        m.position.y += 0.1;
        m.quaternion.copy(o.quaternion);
        m.scale.set(0.2, 0.24, 0.2);
        cab.add(m);
        partes.cara.push(m);
    }
    // puente y pico de oro
    {
        const f0 = enCara(0, 0.5);
        const pico = sombra(new THREE.Mesh(tubo([[0, 0.53, f0.p[2] - 0.02], [0, 0.45, f0.p[2] + 0.075], [0, 0.31, f0.p[2] + 0.145], [0, 0.17, f0.p[2] + 0.125], [0, 0.07, f0.p[2] + 0.05]], q => 0.004 + 0.15 * (1 - q) ** 0.7, { seg: 24, rad: 14 }), M.oro));
        pico.scale.x = 0.92;
        const cera = sombra(new THREE.Mesh(cuchilla([[0, 0.66, f0.p[2] + 0.03], [0, 0.57, f0.p[2] + 0.05], [0, 0.45, f0.p[2] + 0.09]], q => 0.02 + 0.058 * Math.sin(PI * q) ** 0.8, { grosor: 0.02, n: 12 }), M.placa));
        // tachón de la frente: aro de oro y gema
        const c = enCara(0, 0.87);
        const tachon = new THREE.Group();
        tachon.position.copy(v3(c.p).addScaledVector(v3(c.n), 0.05));
        tachon.quaternion.setFromUnitVectors(Z, v3(c.n));
        const aroT = sombra(new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.016, 12, 36), M.oro));
        const fondoT = new THREE.Mesh(geoDisco(0.06, 0.03, 24), M.oroViejo);
        const gemaT = new THREE.Mesh(new THREE.SphereGeometry(0.04, 18, 12), M.nucleo);
        gemaT.position.z = 0.012;
        tachon.add(fondoT, aroT, gemaT);
        brillo(tachon, [0, 0, 0.05], 0.3, 0.4);
        cab.add(pico, cera, tachon);
        partes.cara.push(pico, cera, tachon);
    }

    // ------------------------------------------------------------ alas
    const alas = [1, -1].map(lado => {
        const a = construirAla(M, lado, geoHoja, geoLarga, giran, brillo);
        vuelo.add(a.raiz);
        partes.alas.push(a.raiz);
        return a;
    });
    ancla('alas', alas[0].muneca, [0.02, 0, 0.2]);
    // músculos y pistón del pecho al brazo: se estiran con el ala
    const actuadores = [];
    const geoFibra = tubo([[0, 0, 0], [0, 0.5, 0], [0, 1, 0]], q => 0.016 + 0.024 * Math.sin(PI * q), { seg: 12, rad: 7 });
    const musculo = new THREE.MeshPhysicalMaterial({ color: '#5a1022', roughness: 0.34, clearcoat: 0.9, clearcoatRoughness: 0.2, envMapIntensity: 0.7 });
    alas.forEach((ala, i) => {
        const lado = i === 0 ? 1 : -1;
        for (let k = 0; k < 5; k++) {
            const m = sombra(new THREE.Mesh(geoFibra, musculo));
            vuelo.add(m);
            actuadores.push({ m, a: new THREE.Vector3(lado * (0.3 + k * 0.05), 0.12 - k * 0.075, 0.42 - k * 0.04), padre: ala.brazo, b: new THREE.Vector3(0.14 + k * 0.05, -0.05 - k * 0.012, 0.03), fibra: true });
        }
    });
    const _a = new THREE.Vector3();
    const _b = new THREE.Vector3();

    // ------------------------------------------------------------ patas
    const patas = [1, -1].map(lado => {
        const g = new THREE.Group();
        g.position.set(lado * 0.34, -0.76, 0.14);
        vuelo.add(g);
        partes.garras.push(g);
        const L = (x, y, z) => [lado * x, y, z];
        // muslo de marfil con hojas, rodilla de oro
        const muslo = sombra(new THREE.Mesh(tubo([L(-0.02, 0.1, -0.03), L(0.0, -0.14, 0.0), L(0.03, -0.3, 0.06), L(0.04, -0.41, 0.09)], q => 0.235 - 0.11 * q, { seg: 16, rad: 18 }), M.marfil));
        g.add(muslo);
        const hojasM = [];
        for (let f = 0; f < 3; f++) {
            for (let k = 0; k < 11; k++) {
                const th = (k / 11) * PI2 + f * 0.3;
                const y = 0.02 - f * 0.1;
                const r = 0.25 - f * 0.024;
                const n = new THREE.Vector3(Math.sin(th), 0.1, Math.cos(th)).normalize();
                const o = new THREE.Object3D();
                orientar(o, n, new THREE.Vector3(0, -1, 0));
                hojasM.push({ p: new THREE.Vector3(lado * 0.0 + Math.sin(th) * r, y, 0.03 * f * 0.6 + Math.cos(th) * r), q: o.quaternion.clone(), s: new THREE.Vector3(0.16, 0.2, 0.16), n, h: hash(f * 13 + k) });
            }
        }
        lote(geoHoja, M.hojaAla, hojasM, g);
        const rodilla = new THREE.Group();
        rodilla.position.set(...L(0.05, -0.43, 0.11));
        rodilla.add(sombra(new THREE.Mesh(new THREE.SphereGeometry(0.1, 20, 14), M.oro)));
        const aroR = new THREE.Mesh(new THREE.TorusGeometry(0.102, 0.012, 8, 30).rotateY(PI / 2), M.luz);
        rodilla.add(aroR);
        const engR = new THREE.Mesh(geoEngrane(0.075, 14, 0.02).rotateY(PI / 2), M.oroViejo);
        engR.position.x = lado * 0.096;
        rodilla.add(engR);
        giran.push({ obj: engR, v: 0.25, eje: 'x' });
        g.add(rodilla);
        // espinilla: placa de marfil al frente, hueso de oro y pistón atrás
        const K = L(0.05, -0.43, 0.11);
        const T = L(0.06, -0.8, 0.16);
        g.add(sombra(new THREE.Mesh(tubo([K, T], 0.052, { seg: 6, rad: 12 }), M.oroViejo)));
        const espinilla = sombra(new THREE.Mesh(cuchilla([[K[0], K[1] - 0.06, K[2] + 0.07], [(K[0] + T[0]) / 2, (K[1] + T[1]) / 2, (K[2] + T[2]) / 2 + 0.082], [T[0], T[1] + 0.05, T[2] + 0.07]], q => 0.022 + 0.078 * (1 - q) ** 0.7 * Math.min(1, q * 7 + 0.2), { grosor: 0.034, n: 12 }), M.placaAla));
        g.add(espinilla);
        const camisa = sombra(new THREE.Mesh(tubo([[K[0], K[1] - 0.04, K[2] - 0.08], [K[0], K[1] - 0.2, K[2] - 0.075]], 0.028, { seg: 2, rad: 10 }), M.oro));
        const vastago = new THREE.Mesh(tubo([[K[0], K[1] - 0.2, K[2] - 0.075], [T[0], T[1] + 0.04, T[2] - 0.05]], 0.013, { seg: 2, rad: 8 }), M.acero);
        g.add(camisa, vastago);
        for (const x of [-0.03, 0.03]) g.add(new THREE.Mesh(tubo([[K[0] + x, K[1] - 0.03, K[2] + 0.02], [T[0] + x, T[1], T[2] + 0.03]], 0.006, { seg: 3, rad: 5 }), M.neon));
        // tobillo y pie
        const pie = new THREE.Group();
        pie.position.set(...T);
        g.add(pie);
        pie.add(sombra(new THREE.Mesh(new THREE.SphereGeometry(0.075, 18, 12), M.oro)));
        const aroT = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.009, 8, 26).rotateX(PI / 2), M.luz);
        aroT.position.y = 0.05;
        pie.add(aroT);
        // Dedos: dos al frente, uno al lado y uno atrás, de oro en tramos; la uña delantera abraza el canto del libro.
        const pisoLocal = LIBRO.tope - (g.position.y + T[1]);
        for (const [giro, largo, cuelga] of [[-0.36 * lado, 0.46, 1], [0.36 * lado, 0.46, 1], [1.4 * lado, 0.32, 0], [PI, 0.3, 0]]) {
            const d = new THREE.Vector3(Math.sin(giro), 0, Math.cos(giro));
            const altura = pisoLocal + 0.04;
            const p0 = new THREE.Vector3(0, -0.02, 0);
            const p1 = d.clone().multiplyScalar(largo * 0.42).setY(altura * 0.72);
            const p2 = d.clone().multiplyScalar(largo * 0.78).setY(altura);
            const p3 = d.clone().multiplyScalar(largo).setY(altura + 0.01);
            pie.add(sombra(new THREE.Mesh(tubo([p0, p1, p2, p3], q => 0.05 - 0.016 * q, { seg: 14, rad: 10 }), M.oroViejo)));
            for (const [q, r] of [[0.32, 0.054], [0.62, 0.05], [0.92, 0.044]]) {
                const c = p0.clone().lerp(p2, q);
                if (q > 0.5) c.y = altura * Math.min(1, q + 0.25);
                const anillo = sombra(new THREE.Mesh(new THREE.TorusGeometry(r, 0.011, 8, 20), M.oro));
                anillo.position.copy(c);
                anillo.quaternion.setFromUnitVectors(Z, d.clone().setY(q < 0.5 ? altura * 1.2 / largo : 0).normalize());
                pie.add(anillo);
            }
            const u1 = p3.clone().addScaledVector(d, 0.1).setY(altura + 0.02);
            const u2 = p3.clone().addScaledVector(d, cuelga ? 0.21 : 0.17).setY(altura - (cuelga ? 0.05 : 0.0));
            const u3 = p3.clone().addScaledVector(d, cuelga ? 0.25 : 0.2).setY(altura - (cuelga ? 0.2 : 0.035));
            pie.add(sombra(new THREE.Mesh(tubo([p3.clone().setY(altura + 0.012), u1, u2, u3], q => 0.004 + 0.046 * (1 - q) ** 0.7, { seg: 16, rad: 10 }), M.oro)));
        }
        return g;
    });
    ancla('garras', patas[0], [0.1, -0.86, 0.34]);

    // ------------------------------------------------------------ cola: abanico que se abre con las alas
    const cola = new THREE.Group();
    cola.position.set(0, -0.92, -0.3);
    cola.rotation.x = -128 * D2R;
    vuelo.add(cola);
    partes.columna.push(cola);
    const plumasCola = (n, largo, ancho, z) => Array.from({ length: n }, (_, i) => ({ i, d: i - (n - 1) / 2, p: new THREE.Vector3(0, 0, z + Math.abs(i - (n - 1) / 2) * -0.005), q: new THREE.Quaternion(), s: new THREE.Vector3(ancho, largo - Math.abs(i - (n - 1) / 2) * 0.03, largo), h: hash(i + 300) }));
    const colaG = lote(geoLarga, M.plumaGuinda, plumasCola(9, 1.1, 0.32, 0), cola);
    const colaV = lote(geoLarga, M.cristalPluma, plumasCola(7, 0.86, 0.28, 0.035), cola);
    const colaL = lote(geoHoja, M.hojaAla, plumasCola(5, 0.52, 0.3, 0.07), cola);
    const posarCola = (abre, e) => {
        for (const [l, paso] of [[colaG, lerp(5.5, 15, abre)], [colaV, lerp(6, 16, abre)], [colaL, lerp(9, 18, abre)]]) {
            colocar(l, it => {
                o3.position.copy(it.p);
                o3.quaternion.setFromAxisAngle(Z, (it.d * paso * D2R) + 0.012 * e.cola);
                o3.scale.copy(it.s);
            });
        }
    };

    // ------------------------------------------------------------ libros
    const libros = construirLibros(M, { movil: M.movil });
    raiz.add(libros.raiz);
    partes.libro.push(libros.raiz);
    ancla('libro', libros.raiz, [0, LIBRO.tope - LIBRO.grueso * 1.5, LIBRO.ancho / 2 + 0.05]);

    // Órbitas de piezas sueltas al desarmar: tornillos, rodamientos y engranes pequeños.
    const sueltas = [];
    const geoSueltas = [new THREE.CylinderGeometry(0.018, 0.018, 0.1, 8), new THREE.TorusGeometry(0.05, 0.016, 8, 20), geoEngrane(0.06, 9, 0.022)];
    for (let i = 0; i < 18; i++) {
        const m = new THREE.Mesh(geoSueltas[i % 3], i % 3 === 0 ? M.acero : M.oro);
        const a = hash(i + 7) * PI2;
        const r = 1.5 + hash(i + 19) * 1.0;
        m.userData = { hasta: new THREE.Vector3(Math.cos(a) * r, 0.2 + Math.sin(a) * r * 0.9, (hash(i + 31) - 0.4) * 1.4), h: hash(i + 43) };
        m.visible = false;
        vuelo.add(m);
        sueltas.push(m);
    }

    // ------------------------------------------------------------ cada cuadro
    const blanco = new THREE.Color('#ffffff');
    const apagado = new THREE.Color('#cfc8bd');
    const apagadoLama = new THREE.Color('#d6cfc4');
    const COLOR_LAMA = new THREE.Color('#f6f1e7');
    const COLOR_MARFIL = new THREE.Color(P.marfil);
    let adentroAntes = -1;
    let dAntes = -1;
    function posar(e) {
        const a = e.alas;
        const d = sale(e.desarme);
        const ad = e.adentro;
        const r = e.respira;

        // se levanta al abrir las alas, como en la idea de la vista con alas abiertas
        const sube = suave((a - 0.1) / 0.8);
        vuelo.position.y = 0.34 * sube + 0.03 * sube * Math.sin(e.t * 1.25);
        vuelo.rotation.x = 0.05 * sube;
        for (const p of patas) p.rotation.x = -0.34 * sube;

        torso.scale.set(1 + 0.012 * r, 1 + 0.005 * r, 1 + 0.018 * r);
        for (const f of fuelles) f.scale.set(1 + 0.03 * r, 0.82 + 0.3 * r, 1 + 0.03 * r);
        for (const l of [loteCuerpo, lotePunta]) {
            colocar(l, it => {
                const abre = r * 0.1 * (0.4 + 0.6 * it.h) + d * (0.5 + 0.8 * it.h);
                o3.position.copy(it.p).addScaledVector(it.n, d * (0.32 + 0.55 * it.h));
                o3.quaternion.copy(it.q).multiply(qA.setFromAxisAngle(X, abre));
                o3.scale.copy(it.s);
            });
        }

        // cabeza: gira como búho
        const pr = 0.01 * Math.sin(e.t * 0.8);
        cab.rotation.set(e.pitch + pr, e.yaw, 0.012 * Math.sin(e.t * 0.53));
        for (const p of penachos) p.rotation.z = p.userData.lado * 0.05 * e.penacho;
        if (d !== dAntes) {
            dAntes = d;
            for (const l of [loteCab, loteCabP, loteRuff]) {
                colocar(l, it => {
                    o3.position.copy(it.p).addScaledVector(it.n, d * (0.22 + 0.4 * it.h));
                    o3.quaternion.copy(it.q).multiply(qA.setFromAxisAngle(X, d * 0.8 * it.h));
                    o3.scale.copy(it.s);
                });
            }
            colocar(loteLamas, it => {
                o3.position.copy(it.p).addScaledVector(it.n, d * (0.1 + 0.25 * it.h));
                o3.quaternion.copy(it.q);
                o3.scale.copy(it.s);
            });
        }
        const U = M.iris.uniforms;
        U.abre.value = e.abre;
        U.parpado.value = e.parpado;
        U.luz.value = e.luz * e.latido;
        U.giro.value = e.t * 0.05;

        // placas: salen por su normal
        for (const g of placas) {
            const { p0, dir, h } = g.userData;
            g.position.copy(p0).addScaledVector(dir, d * (0.34 + 0.5 * h));
            if (g === reactor || ojos.includes(g)) continue;
            g.rotation.set(d * (h - 0.5) * 0.6, d * (hash(h * 9) - 0.5) * 0.6, d * (h - 0.4) * 0.4);
        }
        reactor.userData.gema.scale.setScalar(1 + 0.06 * (e.latido - 1) * 4);
        corazon.scale.setScalar(1 + 0.05 * Math.sin(e.t * 2.2));
        adentro.visible = ad > 0.01 || d > 0.02;
        for (const c of celdas) c.scale.setScalar(1);
        for (const it of giran) {
            if (it.eje === 'x') it.obj.rotation.x = e.t * it.v;
            else it.obj.rotation.z = e.t * it.v;
        }
        M.pulso.offset.x = -e.t * 0.34;

        // luces: late con la respiración; de noche suben
        const fuerza = e.luz * (0.8 * e.latido + 0.12 * e.noche) * (1 + 0.12 * e.realce);
        M.piel.color.copy(M.luz.color).lerp(M.brillo, 0.6).multiplyScalar(0.42 + 0.24 * r + 0.4 * e.noche);
        M.resina.rLuz.value = (0.58 + 0.15 * r + 0.22 * e.noche) * e.luz * (1 + 0.5 * (e.latido - 1));
        M.nucleo.color.copy(M.luz.color).lerp(blanco, 0.42).multiplyScalar(0.84 + 0.2 * e.latido);
        for (const b of resplandores) {
            b.s.material.opacity = b.fuerza * clamp01(fuerza) * (0.8 + 0.5 * e.noche);
            b.s.scale.setScalar(b.escala * (0.96 + 0.1 * (e.latido - 1) * 5));
        }

        // de noche se apagan las placas para que el brillo se lea por contraste
        const n = e.noche;
        for (const m of M.marfiles) {
            if (m === M.marfil) m.color.copy(COLOR_MARFIL).lerp(apagado, n);
            else if (m === M.lama) m.color.copy(COLOR_LAMA).lerp(apagadoLama, n);
            else m.color.copy(blanco).lerp(apagado, n);
        }

        // «Ver por dentro»: la resina se aclara para que la máquina se lea
        M.resina.rClaro.value = ad;
        M.cristal.roughness = lerp(0.07, 0.015, ad);
        if (M.cristal.transmission) { M.cristal.thickness = lerp(0.5, 0.04, ad); M.cristal.attenuationDistance = lerp(0.6, 2.4, ad); }
        if ((ad > 0.001) !== (adentroAntes > 0.001)) {
            for (const m of M.funden) { m.transparent = ad > 0.001; m.needsUpdate = true; }
        }
        adentroAntes = ad;
        const op = lerp(1, 0.09, ad);
        M.placa.opacity = M.hoja.opacity = M.hojaPunta.opacity = op;
        M.caparazon.opacity = lerp(1, 0, suave(ad * 1.6));
        M.piel.opacity = lerp(1, 0, suave(ad * 1.6));
        for (const m of [M.placa, M.hoja, M.hojaPunta]) m.depthWrite = ad < 0.5;
        M.caparazon.depthWrite = M.piel.depthWrite = ad < 0.4;

        libros.ponerTema(e.noche > 0.5);
        for (const ala of alas) ala.posar(e);
        posarCola(a, e);

        raiz.updateMatrixWorld(true);
        for (const it of actuadores) {
            _a.copy(it.a);
            _b.copy(it.b);
            it.padre.localToWorld(_b);
            vuelo.worldToLocal(_b);
            const largo = _a.distanceTo(_b);
            it.m.position.copy(_a);
            it.m.quaternion.setFromUnitVectors(Y, _b.clone().sub(_a).normalize());
            it.m.scale.set(1 + 0.25 * r, largo, 1 + 0.25 * r);
        }
        const hayS = d > 0.01;
        for (const m of sueltas) {
            m.visible = hayS;
            if (!hayS) continue;
            const { hasta, h } = m.userData;
            m.position.copy(hasta).multiplyScalar(d);
            m.scale.setScalar(Math.max(0.001, d));
            m.rotation.set(e.t * (0.5 + h), e.t * 0.4 + h * 4, h * 6);
        }
    }

    return { raiz, vuelo, cabeza: cab, posar, partes, anclas, lentes, reactor, libros };
}

// ---------------------------------------------------------------- el ala
function construirAla(M, lado, geoHoja, geoLarga, giran, brillo) {
    const raiz = new THREE.Group();
    raiz.position.set(lado * ALA.hombro[0], ALA.hombro[1], ALA.hombro[2]);
    raiz.scale.x = lado;
    const plano = new THREE.Group();
    raiz.add(plano);
    const brazo = new THREE.Group();
    plano.add(brazo);
    const codo = new THREE.Group();
    codo.position.x = ALA.humero;
    brazo.add(codo);
    const muneca = new THREE.Group();
    muneca.position.x = ALA.radio;
    codo.add(muneca);
    const huesos = { humero: brazo, radio: codo, mano: muneca };
    const largoDe = { humero: ALA.humero, radio: ALA.radio, mano: ALA.mano };

    // huesos, blindaje y línea de luz
    for (const [padre, L, ancho] of [[brazo, ALA.humero, 0.14], [codo, ALA.radio, 0.12], [muneca, ALA.mano, 0.1]]) {
        padre.add(sombra(new THREE.Mesh(tubo([[0, 0, 0.02], [L, 0, 0.02]], 0.05, { seg: 3, rad: 10 }), M.oroViejo)));
        for (const y of [0.052, -0.052]) padre.add(new THREE.Mesh(tubo([[0.04, y, 0.03], [L * 0.5, y * 1.5, 0.05], [L - 0.03, y, 0.03]], 0.018 + Math.abs(y) * 0.12, { seg: 12, rad: 7 }), new THREE.MeshPhysicalMaterial({ color: '#5a1022', roughness: 0.36, clearcoat: 0.8, envMapIntensity: 0.7 })));
        const plancha = sombra(new THREE.Mesh(cuchilla([[-0.02, 0.0, 0.2], [L * 0.5, 0.05, 0.235], [L * 1.02, 0.0, 0.2]], q => 0.01 + ancho * Math.sin(PI * q ** 0.8) ** 0.5, { grosor: 0.032, n: 16 }), M.placaAla));
        padre.add(plancha);
        padre.add(new THREE.Mesh(tubo([[0.08, 0.05, 0.268], [L * 0.5, 0.078, 0.272], [L - 0.05, 0.03, 0.262]], 0.006, { seg: 12, rad: 5 }), M.neon));
        const nudo = new THREE.Group();
        nudo.position.z = 0.16;
        const disco = sombra(new THREE.Mesh(geoDisco(0.1, 0.05, 26), M.oro));
        const aro = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.008, 6, 26), M.luz);
        aro.position.z = 0.028;
        nudo.add(disco, aro);
        padre.add(nudo);
    }

    // el engrane del hombro: discos concéntricos de oro, gema al centro
    const hombro = new THREE.Group();
    hombro.position.z = 0.25;
    {
        const fondo = sombra(new THREE.Mesh(geoDisco(0.285, 0.06, 48), M.oroViejo));
        const eje = sombra(new THREE.Mesh(geoDisco(0.16, 0.42, 28), M.oroViejo));
        eje.position.z = -0.23;
        hombro.add(eje);
        fondo.position.z = -0.03;
        const aro1 = sombra(new THREE.Mesh(new THREE.TorusGeometry(0.285, 0.032, 14, 64), M.oro));
        const engr = sombra(new THREE.Mesh(geoEngrane(0.245, 34, 0.03), M.oroViejo));
        const aro2 = sombra(new THREE.Mesh(new THREE.TorusGeometry(0.168, 0.022, 12, 48), M.oro));
        aro2.position.z = 0.032;
        const aro3 = sombra(new THREE.Mesh(new THREE.TorusGeometry(0.108, 0.018, 12, 40), M.oro));
        aro3.position.z = 0.05;
        const luz = new THREE.Mesh(new THREE.TorusGeometry(0.138, 0.0065, 8, 44), M.luz);
        luz.position.z = 0.036;
        const gema = new THREE.Mesh(new THREE.SphereGeometry(0.066, 20, 14), M.nucleo);
        gema.position.z = 0.05;
        const bisel = sombra(new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.012, 8, 28), M.oroViejo));
        bisel.position.z = 0.06;
        hombro.add(fondo, aro1, engr, aro2, aro3, luz, gema, bisel);
        brillo(hombro, [0, 0, 0.1], 0.42, 0.35);
        giran.push({ obj: engr, v: 0.22 * lado });
    }
    plano.add(hombro);

    // plumas por capas
    const grupos = {};
    PLUMAS_ALA.forEach(p => { (grupos[`${p.clase}-${p.hueso}`] ||= []).push(p); });
    const lotes = Object.entries(grupos).map(([, lista]) => {
        const { clase, hueso } = lista[0];
        const items = lista.map((p, i) => ({ ...p, recoge: clase === 'larga' ? 0.76 : 1, i, n: lista.length, pos: new THREE.Vector3(p.f * largoDe[hueso], -0.02, 0.02 + p.z), esc: new THREE.Vector3(p.ancho, p.largo, p.largo * (clase === 'hoja' ? 0.8 : 0.75)), p: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3(1, 1, 1) }));
        const geo = clase === 'hoja' ? geoHoja : geoLarga;
        const mat = { larga: M.larga, guinda: M.plumaGuinda, cristal: M.cristalPluma, hoja: M.hojaAla }[clase];
        const m = lote(geo, mat, items, huesos[hueso]);
        return { ...m, hueso };
    });

    let aAntes = -1;
    function posar(e) {
        const a = e.alas;
        const g = angulosAla(a);
        plano.rotation.set(g.inclina, g.giro * D2R, 0);
        const abs = { humero: g.humero, radio: g.radio, mano: g.mano };
        brazo.rotation.z = g.humero * D2R;
        codo.rotation.z = (g.radio - g.humero) * D2R;
        muneca.rotation.z = (g.mano - g.radio) * D2R;
        hombro.rotation.z = (g.humero * 0.25) * D2R;
        if (a === aAntes) return;
        aAntes = a;
        for (const l of lotes) {
            const b = abs[l.hueso];
            colocar(l, it => {
                const k = suave(a * 1.25 - 0.25 * (it.i / it.n));
                const rel = (lerp(it.plegada, it.abierta, k) - b - 90) * D2R;
                o3.position.copy(it.pos);
                o3.quaternion.setFromAxisAngle(Z, rel);
                o3.scale.copy(it.esc);
                o3.scale.y *= lerp(it.recoge, 1, k);
            });
        }
    }
    return { raiz, posar, brazo, codo, muneca };
}
