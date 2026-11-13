// Geometría hecha a mano para el búho biomecánico: láminas con grosor que siguen una superficie, tubos de radio variable,
// plumas, engranes y texturas pintadas en lienzo.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { normal } from './modelo.js';

export const v3 = a => new THREE.Vector3(a[0], a[1], a[2]);
export const sombra = m => { m.castShadow = true; m.receiveShadow = true; return m; };

/** Contorno fino de tinta en las aristas: lo casi blanco no se pierde en el papel. */
export function entintar(m, material, angulo = 38) {
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, angulo), material));
    return m;
}

/** Orienta un objeto con su +z en la normal y su +y hacia dir, proyectado al plano tangente. */
export function orientar(obj, n, dir) {
    const y = dir.clone().addScaledVector(n, -n.dot(dir)).normalize();
    const x = new THREE.Vector3().crossVectors(y, n).normalize();
    obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, n));
}

/**
 * Lámina cerrada con grosor. f(s, w) da { p, n } para s de 0 a 1 a lo largo y w de -1 a 1 a lo ancho; g(s, w) es cuánto
 * sube sobre esa superficie; por debajo baja base·g. Las caras y las paredes comparten vértices: el canto sale redondeado.
 */
export function lamina({ n = 14, m = 6, f, g = () => 0.03, base = 0.45 }) {
    const cols = m + 1;
    const filas = n + 1;
    const pos = [];
    const uv = [];
    const idx = [];
    for (let capa = 0; capa < 2; capa++) {
        for (let i = 0; i <= n; i++) {
            for (let j = 0; j <= m; j++) {
                const s = i / n;
                const w = -1 + (2 * j) / m;
                const r = f(s, w);
                const h = capa === 0 ? g(s, w) : -g(s, w) * base;
                pos.push(r.p[0] + r.n[0] * h, r.p[1] + r.n[1] * h, r.p[2] + r.n[2] * h);
                uv.push(w * 0.5 + 0.5, s);
            }
        }
    }
    const at = (capa, i, j) => capa * filas * cols + i * cols + j;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            const [a, b, c, d] = [at(0, i, j), at(0, i + 1, j), at(0, i + 1, j + 1), at(0, i, j + 1)];
            idx.push(a, d, b, b, d, c);
            const [a2, b2, c2, d2] = [at(1, i, j), at(1, i + 1, j), at(1, i + 1, j + 1), at(1, i, j + 1)];
            idx.push(a2, b2, d2, b2, c2, d2);
        }
    }
    for (let j = 0; j < m; j++) {
        idx.push(at(0, 0, j + 1), at(0, 0, j), at(1, 0, j), at(0, 0, j + 1), at(1, 0, j), at(1, 0, j + 1));
        idx.push(at(0, n, j), at(0, n, j + 1), at(1, n, j + 1), at(0, n, j), at(1, n, j + 1), at(1, n, j));
    }
    for (let i = 0; i < n; i++) {
        idx.push(at(0, i, 0), at(0, i + 1, 0), at(1, i + 1, 0), at(0, i, 0), at(1, i + 1, 0), at(1, i, 0));
        idx.push(at(0, i + 1, m), at(0, i, m), at(1, i, m), at(0, i + 1, m), at(1, i, m), at(1, i + 1, m));
    }
    // sentido de las caras: que la cara de arriba mire hacia n
    const e = 0.01;
    const c0 = f(0.5, 0);
    const cs = f(0.5 + e, 0);
    const cw = f(0.5, e);
    const dw = v3(cw.p).sub(v3(c0.p));
    const ds = v3(cs.p).sub(v3(c0.p));
    if (dw.cross(ds).dot(v3(c0.n)) < 0) for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
}

/** Placa que sigue una superficie S entre t0–t1 y a0–a1, con esquinas redondas. centro: se resta para que el grupo gire en su lugar. */
export function parche(S, t0, t1, a0, a1, { k = 1, grosor = 0.028, n = 14, m = 12, e = 0.2, corte = 0.16, centro = [0, 0, 0], base = 0.5, abocina = 0 } = {}) {
    return lamina({
        n, m, base,
        f: (s, w) => {
            const ds = Math.min(s, 1 - s);
            const q = ds < e ? Math.sqrt(Math.max(0, 1 - ((e - ds) / e) ** 2)) : 1;
            const ww = w * (1 - corte + corte * q);
            const t = t0 + (t1 - t0) * s;
            const a = (a0 + a1) / 2 + ((a1 - a0) / 2) * ww * (1 + abocina * (s - 0.5));
            const p = S(t, a, k);
            return { p: [p[0] - centro[0], p[1] - centro[1], p[2] - centro[2]], n: normal(S, t, a, k) };
        },
        g: (s, w) => grosor * (1 - 0.35 * Math.abs(w) ** 6),
    });
}

/** Superficie cerrada (el casco grafito y la piel luminosa) de una función S(t, a, k). */
export function casco(S, k = 1, { n = 40, m = 56, t0 = 0, t1 = 1 } = {}) {
    const pos = [];
    const uv = [];
    const idx = [];
    for (let i = 0; i <= n; i++) {
        for (let j = 0; j <= m; j++) {
            const s = t0 + (t1 - t0) * (i / n);
            const a = (j / m) * Math.PI * 2;
            pos.push(...S(s, a, k));
            uv.push(j / m, 1 - i / n);
        }
    }
    const at = (i, j) => i * (m + 1) + j;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) idx.push(at(i, j), at(i + 1, j), at(i, j + 1), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
}

/** Tubo por una curva con radio variable r(s) (número o función) y tapas. plano aplasta la sección. */
export function tubo(puntos, r = 0.02, { seg = 20, rad = 8, plano = [1, 1] } = {}) {
    const curva = new THREE.CatmullRomCurve3(puntos.map(p => (p.isVector3 ? p : v3(p))));
    const marcos = curva.computeFrenetFrames(seg, false);
    const radio = typeof r === 'function' ? r : () => r;
    const pos = [];
    const uv = [];
    const idx = [];
    const c = new THREE.Vector3();
    for (let i = 0; i <= seg; i++) {
        const s = i / seg;
        curva.getPointAt(s, c);
        const R = radio(s);
        for (let j = 0; j <= rad; j++) {
            const a = (j / rad) * Math.PI * 2;
            const ca = Math.cos(a) * R * plano[0];
            const sa = Math.sin(a) * R * plano[1];
            pos.push(c.x + marcos.normals[i].x * ca + marcos.binormals[i].x * sa, c.y + marcos.normals[i].y * ca + marcos.binormals[i].y * sa, c.z + marcos.normals[i].z * ca + marcos.binormals[i].z * sa);
            uv.push(s, j / rad);
        }
    }
    const at = (i, j) => i * (rad + 1) + j;
    for (let i = 0; i < seg; i++) {
        for (let j = 0; j < rad; j++) idx.push(at(i, j), at(i, j + 1), at(i + 1, j), at(i + 1, j), at(i, j + 1), at(i + 1, j + 1));
    }
    const inicio = pos.length / 3;
    curva.getPointAt(0, c);
    pos.push(c.x, c.y, c.z);
    uv.push(0, 0);
    curva.getPointAt(1, c);
    pos.push(c.x, c.y, c.z);
    uv.push(1, 0);
    for (let j = 0; j < rad; j++) {
        idx.push(inicio, at(0, j + 1), at(0, j));
        idx.push(inicio + 1, at(seg, j), at(seg, j + 1));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
}

/**
 * Cuchilla: lámina afilada por una curva en el espacio (cejas, cuernos, filos). ancho(s) es la media anchura; n0 la dirección
 * hacia donde mira su cara (número de puntos libre).
 */
export function cuchilla(puntos, ancho, { n0 = [0, 0, 1], grosor = 0.03, n = 28, m = 6, base = 0.5 } = {}) {
    const curva = new THREE.CatmullRomCurve3(puntos.map(p => (p.isVector3 ? p : v3(p))));
    const c = new THREE.Vector3();
    const T = new THREE.Vector3();
    const X = new THREE.Vector3();
    const N = new THREE.Vector3();
    const N0 = v3(n0).normalize();
    const anch = typeof ancho === 'function' ? ancho : () => ancho;
    return lamina({
        n, m, base,
        f: (s, w) => {
            const q = Math.min(1, Math.max(0, s));
            curva.getPointAt(q, c);
            curva.getTangentAt(q, T);
            X.crossVectors(T, N0).normalize();
            N.crossVectors(X, T).normalize();
            const h = anch(q);
            return { p: [c.x + X.x * w * h, c.y + X.y * w * h, c.z + X.z * w * h], n: [N.x, N.y, N.z] };
        },
        g: (s, w) => grosor * (1 - 0.4 * Math.abs(w) ** 4) * Math.min(1, 0.25 + 4 * Math.min(s, 1 - s)),
    });
}

/**
 * Hoja sobre una superficie: una curva en (t, a) y una media anchura en t; sirve para las bandas del pecho que barren del
 * centro hacia afuera. centro se resta para que el grupo vuele desde su lugar.
 */
export function banda(S, ruta, ancho, { k = 1, grosor = 0.03, n = 24, m = 8, centro = [0, 0, 0], base = 0.5, aspecto = 1.4 } = {}) {
    const curva = new THREE.CatmullRomCurve3(ruta.map(([a, t]) => new THREE.Vector3(a, t * aspecto, 0)));
    const c = new THREE.Vector3();
    const T = new THREE.Vector3();
    const anch = typeof ancho === 'function' ? ancho : () => ancho;
    return lamina({
        n, m, base,
        f: (s, w) => {
            curva.getPointAt(s, c);
            curva.getTangentAt(s, T);
            const h = anch(s);
            const a = c.x + -T.y * w * h;
            const t = (c.y + T.x * w * h) / aspecto;
            const p = S(t, a, k);
            return { p: [p[0] - centro[0], p[1] - centro[1], p[2] - centro[2]], n: normal(S, t, a, k) };
        },
        g: (s, w) => grosor * (1 - 0.4 * Math.abs(w) ** 4) * Math.min(1, 0.3 + 5 * Math.min(s, 1 - s)),
    });
}

/**
 * Pluma de placa, de largo 1 en +y y ancho 1 en x, normal en +z: cañón al centro, punta redonda y curva hacia afuera.
 * larga: pala de vuelo con los lados rectos; si no, escama corta y ancha.
 */
export function pluma({ larga = false, curva = 0.1 } = {}) {
    const media = s => {
        const pie = larga ? Math.min(1, (s + 0.12) / 0.3) ** 0.7 : Math.min(1, (s + 0.2) / 0.45) ** 0.6;
        const punta = Math.sqrt(Math.max(0, 1 - clampUno((s - (larga ? 0.74 : 0.5)) / (larga ? 0.26 : 0.5)) ** 2));
        return 0.5 * pie * punta;
    };
    return lamina({
        n: larga ? 12 : 6,
        m: larga ? 8 : 6,
        base: 0.5,
        f: (s, w) => ({
            p: [w * Math.max(0.004, media(s)), s, curva * s * s - 0.06 * w * w * Math.max(0.1, media(s) * 2)],
            n: [0, -2 * curva * s * 0.4, 1],
        }),
        g: (s, w) => (larga ? 0.012 : 0.03) * (0.6 + 1.4 * Math.exp(-((w / 0.16) ** 2))) * (1 - 0.5 * s),
    });
}
const clampUno = x => Math.min(1, Math.max(0, x));

export function geoEngrane(radio, dientes, grosor) {
    const forma = new THREE.Shape();
    const pasos = dientes * 4;
    for (let k = 0; k <= pasos; k++) {
        const a = (k / pasos) * Math.PI * 2;
        const r = k % 4 === 0 || k % 4 === 1 ? radio : radio * 0.84;
        if (k === 0) forma.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else forma.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    const hueco = new THREE.Path();
    hueco.absarc(0, 0, radio * 0.3, 0, Math.PI * 2, true);
    forma.holes.push(hueco);
    return new THREE.ExtrudeGeometry(forma, { depth: grosor, bevelEnabled: false });
}

export const geoDisco = (r, h, seg = 32) => new THREE.CylinderGeometry(r, r, h, seg).rotateX(Math.PI / 2);

/** Tornillos juntos en una sola malla: { p, n } en el espacio del grupo. */
export function geoPernos(lista, r = 0.016) {
    const geos = lista.map(({ p, n }) => {
        const g = geoDisco(r, r * 0.9, 12);
        const o = new THREE.Object3D();
        o.position.copy(p);
        o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
        o.updateMatrix();
        g.applyMatrix4(o.matrix);
        return g;
    });
    return mergeGeometries(geos);
}

// ---------------------------------------------------------------- texturas
export function lienzo(w, h, pintar, { color = true, repetir = false } = {}) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    pintar(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    if (color) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    if (repetir) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
}

/**
 * Placa con filo de oro: color y, aparte, rugosidad y metal, para que solo el filo brille como metal. u va a lo ancho y v a
 * lo largo de la lámina, así el filo sigue la silueta de la pieza. fondo: color; barras: cuántas barras de búho real; punta:
 * color de la punta; vena: oro al centro.
 */
export function texOro(P, { fondo, filo = 0.05, vena = 0.014, barras = 0, punta = null, pie = 0 }) {
    const pintar = (x, w, h, oro, base, raya) => {
        x.fillStyle = base;
        x.fillRect(0, 0, w, h);
        if (raya) {
            for (let k = 0; k < barras; k++) {
                const y = h * (0.66 - (k * 0.5) / Math.max(1, barras));
                const g = x.createLinearGradient(0, y - 16, 0, y + 16);
                g.addColorStop(0, 'rgba(70,58,58,0)');
                g.addColorStop(0.5, 'rgba(70,58,58,0.3)');
                g.addColorStop(1, 'rgba(70,58,58,0)');
                x.fillStyle = g;
                x.fillRect(0, y - 16, w, 32);
            }
            if (punta) {
                const p = x.createLinearGradient(0, h * 0.3, 0, 0);
                p.addColorStop(0, `${punta}00`);
                p.addColorStop(0.4, `${punta}ee`);
                p.addColorStop(1, punta);
                x.fillStyle = p;
                x.fillRect(0, 0, w, h * 0.3);
            }
            // Las barbas siguen las UV de cada pluma. Se pintan una sola vez, también en móvil.
            if (vena) {
                x.lineCap = 'round';
                for (const lado of [-1, 1]) {
                    for (let i = 0; i < 27; i++) {
                        const raiz = h * (0.95 - i * 0.032 + 0.005 * Math.sin(i * 8.3 + lado));
                        const avance = Math.min(raiz - h * 0.015, h * (0.15 + 0.025 * Math.cos(i * 3.1 + lado)));
                        const borde = w * (0.5 + lado * (0.44 + 0.022 * Math.sin(i * 2.7)));
                        x.beginPath();
                        x.moveTo(w * 0.5, raiz);
                        x.quadraticCurveTo(w * (0.5 + lado * 0.23), raiz - avance * 0.7, borde, raiz - avance);
                        x.lineWidth = i % 3 === 0 ? 1.5 : 1;
                        x.strokeStyle = fondo === P.marfil ? 'rgba(97,65,39,.56)' : 'rgba(245,220,176,.48)';
                        x.stroke();
                    }
                }
            }
        }
        x.fillStyle = oro;
        x.fillRect(0, 0, w * filo, h);
        x.fillRect(w * (1 - filo), 0, w * filo, h);
        if (pie) x.fillRect(0, h * (1 - pie), w, h * pie);
        if (vena) x.fillRect(w * (0.5 - vena), 0, w * 2 * vena, h);
    };
    const map = lienzo(128, 384, (x, w, h) => pintar(x, w, h, P.oro, fondo, true));
    const rm = lienzo(128, 384, (x, w, h) => pintar(x, w, h, 'rgb(0,58,255)', 'rgb(0,108,0)', false), { color: false });
    return { map, roughnessMap: rm, metalnessMap: rm, roughness: 1, metalness: 1 };
}

/** Piel luminosa: venas en gris sobre casi negro; se tiñe con el color de la luz. Se ve a través del vidrio y por las juntas. */
export const texPiel = hashf => lienzo(1024, 512, (x, w, h) => {
    x.fillStyle = '#3c3c3c';
    x.fillRect(0, 0, w, h);
    x.lineCap = 'round';
    const rama = (px, py, ang, largo, grueso, i) => {
        if (largo < 12 || grueso < 0.6) return;
        const qx = px + Math.cos(ang) * largo;
        const qy = py + Math.sin(ang) * largo;
        x.strokeStyle = `rgba(255,255,255,${0.55 + 0.4 * hashf(i + 2)})`;
        x.lineWidth = grueso;
        x.beginPath(); x.moveTo(px, py); x.lineTo(qx, qy); x.stroke();
        rama(qx, qy, ang + (hashf(i + 3) - 0.5) * 1.1, largo * 0.82, grueso * 0.8, i * 2 + 7);
        if (hashf(i + 4) > 0.55) rama(qx, qy, ang + (hashf(i + 5) > 0.5 ? 0.9 : -0.9), largo * 0.68, grueso * 0.68, i * 3 + 11);
    };
    for (let k = 0; k < 34; k++) rama((k / 34) * w, h * (0.04 + 0.1 * hashf(k)), Math.PI / 2 + (hashf(k + 40) - 0.5) * 0.7, 62, 6, k + 90);
    x.globalCompositeOperation = 'lighter';
    x.filter = 'blur(6px)';
    x.drawImage(x.canvas, 0, 0);
    x.filter = 'none';
    x.globalCompositeOperation = 'source-over';
});

/** Pulso que corre por las líneas de luz, en gris: base media y un tramo claro que se repite. */
export const texPulso = () => {
    const t = lienzo(256, 4, (x, w, h) => {
        const g = x.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, '#9a9a9a');
        g.addColorStop(0.35, '#9a9a9a');
        g.addColorStop(0.5, '#ffffff');
        g.addColorStop(0.62, '#cfcfcf');
        g.addColorStop(1, '#9a9a9a');
        x.fillStyle = g;
        x.fillRect(0, 0, w, h);
    }, { repetir: true });
    t.repeat.set(2, 1);
    return t;
};

export const texResplandor = () => lienzo(128, 128, x => {
    const g = x.createRadialGradient(64, 64, 2, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.3, 'rgba(255,255,255,0.32)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
});

/** Canto de las hojas del libro: rayas finas a lo largo. */
export const texHojas = () => lienzo(64, 256, (x, w, h) => {
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) {
        x.fillStyle = `rgba(70,70,70,${0.08 + 0.14 * Math.abs(Math.sin(y * 12.3))})`;
        x.fillRect(0, y, w, 1);
    }
});
