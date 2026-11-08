// Los libros donde se para el búho: los tres de la portada del sitio, con el mismo formato (src/lib/law-cover.js y
// src/styles/shelf.css): papel neutro en proporción 0.72 : 1, y banda, listón, regla e icono en el color de su
// tipo de documento. Quedan acostados con el lomo al frente, así la cabeza del libro cae a la izquierda.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { LIBRO, GROSOR } from './modelo.js';
import { sombra, texHojas } from './geo.js';

// src/styles/design/variables.css: --lb-* y --col-* de los temas claro y oscuro
const TEMA = {
    claro: { papel: '#ffffff', hojas: '#f4f4f2', tinta: '#0a0707', suave: '#5b5e63', orilla: '#0a07072e' },
    oscuro: { papel: '#171a26', hojas: '#10121c', tinta: '#f1efea', suave: '#b4b6bd', orilla: '#ffffff2e' },
};
const COLOR = {
    leyes: { claro: '#9b2247', oscuro: '#e57a9a' },
    reglamentos: { claro: '#2e6fb0', oscuro: '#6ea8e0' },
    acuerdos: { claro: '#0e8a6e', oscuro: '#3ba98c' },
};
// src/lib/collection-icons.js
const ICONO = {
    leyes: ['M12 3v17M8 20h8M5 7h14M12 4.5 5 7M12 4.5 19 7', 'm5 7-2.8 6.2a3 3 0 0 0 5.6 0Z', 'm19 7-2.8 6.2a3 3 0 0 0 5.6 0Z'],
    reglamentos: ['M4 19.5V5a2.5 2.5 0 0 1 2.5-2.5H20v17H6.5A2.5 2.5 0 0 0 4 22a2.5 2.5 0 0 1 2.5-2.5', 'M9 7.5h7M9 11.5h5'],
    acuerdos: ['M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8Z', 'M14 2.5V8h5.5', 'M8 17.5c1.2-1.8 2.2-1.8 2.8 0s1.6 1.8 2.8 0 1.8-1 2.6.3'],
};
// los tres libros de la portada (index.html, .lp-book), de arriba abajo
const PILA = [
    { grupo: 'leyes', tipo: 'Ley', siglas: 'LSE', tam: 0.131, nombre: 'Ley del Sector Eléctrico', fecha: '18 mar 2025', emisor: 'Congreso', anio: '2025', escala: 1, giro: 0, x: 0, z: 0, siglasX: 0.245 },
    { grupo: 'reglamentos', tipo: 'Reglamento', siglas: 'RLSH', tam: 0.131, nombre: 'Reglamento de la Ley del Sector de Hidrocarburos', fecha: '3 oct 2025', emisor: 'Ejecutivo', anio: '2025', escala: 1.05, giro: 0.1, x: 0.05, z: 0.02 },
    { grupo: 'acuerdos', tipo: 'Acuerdo', siglas: 'PLADESE', tam: 0.091, nombre: 'Plan de Desarrollo del Sector Eléctrico', fecha: '17 oct 2025', emisor: 'SENER', anio: '2025', escala: 1.1, giro: -0.07, x: -0.04, z: 0.04 },
];

// lo impreso recibe la luz del estudio, que es fuerte: así sus colores quedan como en la página
const IMPRESO = '#dedede';
const SANS = 'Manrope, Calibri, sans-serif';
const SERIF = 'Fraunces, Georgia, serif';

/** Texto con espacio entre letras, también donde el lienzo no trae letterSpacing. */
function espaciado(x, texto, px, py, em, derecha = false) {
    const paso = parseFloat(x.font) * em;
    const ancho = [...texto].reduce((s, c) => s + x.measureText(c).width + paso, -paso);
    let cx = derecha ? px - ancho : px;
    for (const c of texto) {
        x.fillText(c, cx, py);
        cx += x.measureText(c).width + paso;
    }
    return ancho;
}

/** Portada: la misma que dibuja .sh-cover, con sus medidas relativas a la altura u. */
function pintarPortada(x, w, u, d, T, ac) {
    x.clearRect(0, 0, w, u);
    x.fillStyle = T.papel;
    x.fillRect(0, 0, w, u);
    x.fillStyle = ac;
    x.fillRect(0, 0, u * 0.037, u);
    const b = x.createLinearGradient(0, 0, u * 0.037, 0);
    b.addColorStop(0, '#0000002e');
    b.addColorStop(0.7, '#00000000');
    x.fillStyle = b;
    x.fillRect(0, 0, u * 0.037, u);
    // listón
    const lx = w - u * 0.114;
    const la = u * 0.057;
    const lh = u * 0.126;
    x.fillStyle = ac;
    x.beginPath();
    x.moveTo(lx, 0);
    x.lineTo(lx + la, 0);
    x.lineTo(lx + la, lh);
    x.lineTo(lx + la / 2, lh * 0.78);
    x.lineTo(lx, lh);
    x.closePath();
    x.fill();
    const izq = u * 0.097;
    const der = w - u * 0.057;
    x.textBaseline = 'alphabetic';
    x.textAlign = 'left';
    // tipo
    let y = u * 0.074;
    x.fillStyle = T.suave;
    x.font = `700 ${u * 0.0314}px ${SANS}`;
    espaciado(x, d.tipo.toUpperCase(), izq, y + u * 0.0314 * 0.86, 0.11);
    y += u * 0.0314 * 1.2 + u * 0.086;
    // siglas, regla y nombre
    const tam = u * d.tam;
    x.fillStyle = T.tinta;
    x.font = `500 ${tam}px ${SERIF}`;
    x.fillText(d.siglas, izq, y + tam * 0.82);
    y += tam + u * 0.043;
    x.fillStyle = ac;
    x.fillRect(izq, y, u * 0.108, u * 0.0086);
    y += u * 0.0086 + u * 0.037;
    x.fillStyle = T.tinta;
    const tn = u * 0.044;
    x.font = `400 ${tn}px ${SERIF}`;
    let linea = '';
    const lineas = [];
    for (const palabra of d.nombre.split(' ')) {
        const prueba = linea ? `${linea} ${palabra}` : palabra;
        if (x.measureText(prueba).width > der - izq && linea) { lineas.push(linea); linea = palabra; } else linea = prueba;
    }
    lineas.push(linea);
    lineas.slice(0, 5).forEach((l, i) => x.fillText(l, izq, y + tn * 0.9 + i * tn * 1.28));
    // pie: fecha, emisor e icono
    const base = u - u * 0.051;
    x.fillStyle = T.suave;
    x.font = `600 ${u * 0.037}px ${SANS}`;
    x.fillText(d.fecha, izq, base);
    const ti = u * 0.069;
    x.font = `700 ${u * 0.032}px ${SANS}`;
    espaciado(x, d.emisor, der - ti - u * 0.02, base, 0.05, true);
    x.save();
    x.translate(der - ti, base - ti + u * 0.008);
    x.scale(ti / 24, ti / 24);
    x.strokeStyle = ac;
    x.lineWidth = 1.7;
    x.lineCap = 'round';
    x.lineJoin = 'round';
    for (const p of ICONO[d.grupo]) x.stroke(new Path2D(p));
    x.restore();
    // canto
    x.strokeStyle = T.orilla;
    x.lineWidth = Math.max(2, u * 0.002);
    x.strokeRect(0, 0, w, u);
}

/** Lomo: el de .sh-spine, acostado: la tapa de color queda a la izquierda, luego la regla, las siglas y el año. */
function pintarLomo(x, u, g, d, T, ac) {
    x.clearRect(0, 0, u, g);
    x.fillStyle = T.papel;
    x.fillRect(0, 0, u, g);
    x.fillStyle = ac;
    x.fillRect(0, 0, u * 0.1, g);
    x.globalAlpha = 0.55;
    x.fillRect(u * 0.1086, 0, u * 0.0086, g);
    x.globalAlpha = 1;
    x.textBaseline = 'middle';
    x.fillStyle = T.tinta;
    x.font = `500 ${u * 0.056}px ${SERIF}`;
    x.textAlign = 'left';
    x.fillText(d.siglas, u * (d.siglasX ?? 0.145), g * 0.53);
    x.fillStyle = T.suave;
    x.font = `700 ${u * 0.036}px ${SANS}`;
    x.textAlign = 'right';
    x.fillText(d.anio, u - u * 0.03, g * 0.53);
    const s = x.createLinearGradient(0, 0, 0, g);
    s.addColorStop(0, '#0000001c');
    s.addColorStop(0.22, '#00000000');
    s.addColorStop(0.74, '#00000000');
    s.addColorStop(1, '#00000017');
    x.fillStyle = s;
    x.fillRect(0, 0, u, g);
    x.strokeStyle = T.orilla;
    x.lineWidth = 2;
    x.strokeRect(0, 0, u, g);
}

export function construirLibros(M, { movil = false } = {}) {
    const raiz = new THREE.Group();
    const { largo, ancho, grueso, tope } = LIBRO;
    const papel = new THREE.MeshPhysicalMaterial({ color: TEMA.claro.papel, roughness: 0.55, metalness: 0, clearcoat: 0.2, clearcoatRoughness: 0.5, envMapIntensity: 0.55 });
    const hojas = new THREE.MeshStandardMaterial({ map: texHojas(), color: TEMA.claro.hojas, roughness: 0.92, metalness: 0, envMapIntensity: 0.45 });
    const U = movil ? 640 : 1024;
    const lista = [];
    let y = tope;
    PILA.forEach(d => {
        const g = new THREE.Group();
        const L = largo * d.escala;
        const W = ancho * d.escala;
        const H = grueso * d.escala;
        g.position.set(d.x, y - H / 2, d.z);
        g.rotation.y = d.giro;
        y -= H;
        const tapa = new RoundedBoxGeometry(L, 0.03, W, 2, 0.012);
        for (const s of [1, -1]) {
            const t = sombra(new THREE.Mesh(tapa, papel));
            t.position.y = (s * (H - 0.03)) / 2;
            g.add(t);
        }
        const bloque = sombra(new THREE.Mesh(new THREE.BoxGeometry(L - 0.05, H - 0.05, W - 0.05), hojas));
        bloque.position.z = -0.01;
        g.add(bloque);
        const espina = sombra(new THREE.Mesh(new RoundedBoxGeometry(L, H, 0.04, 2, 0.012), papel));
        espina.position.z = W / 2 - 0.02;
        g.add(espina);

        // portada, arriba: su izquierda (la banda) da al frente y su cabeza a la izquierda de la pila
        const lc = document.createElement('canvas');
        lc.width = Math.round(U * 0.72);
        lc.height = U;
        const tc = new THREE.CanvasTexture(lc);
        tc.colorSpace = THREE.SRGBColorSpace;
        tc.anisotropy = 8;
        const cara = new THREE.Mesh(new THREE.PlaneGeometry(W, L), new THREE.MeshStandardMaterial({ map: tc, color: IMPRESO, roughness: 0.78, metalness: 0, envMapIntensity: 0.3 }));
        cara.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0)));
        cara.position.y = H / 2 + 0.0015;
        cara.receiveShadow = true;
        g.add(cara);

        // lomo, al frente
        const ll = document.createElement('canvas');
        ll.width = U;
        ll.height = Math.round(U * GROSOR);
        const tl = new THREE.CanvasTexture(ll);
        tl.colorSpace = THREE.SRGBColorSpace;
        tl.anisotropy = 8;
        const frente = new THREE.Mesh(new THREE.PlaneGeometry(L - 0.002, H - 0.002), new THREE.MeshStandardMaterial({ map: tl, color: IMPRESO, roughness: 0.78, metalness: 0, envMapIntensity: 0.3 }));
        frente.position.z = W / 2 + 0.0015;
        frente.receiveShadow = true;
        g.add(frente);

        raiz.add(g);
        lista.push({ d, lc, tc, ll, tl });
    });

    let tema = 'claro';
    function pintar() {
        const T = TEMA[tema];
        papel.color.set(T.papel);
        hojas.color.set(T.hojas);
        for (const { d, lc, tc, ll, tl } of lista) {
            const ac = COLOR[d.grupo][tema];
            pintarPortada(lc.getContext('2d'), lc.width, lc.height, d, T, ac);
            pintarLomo(ll.getContext('2d'), ll.width, ll.height, d, T, ac);
            tc.needsUpdate = true;
            tl.needsUpdate = true;
        }
    }
    pintar();
    return {
        raiz,
        repintar: pintar, // cuando ya llegaron las letras
        ponerTema: oscuro => {
            const nuevo = oscuro ? 'oscuro' : 'claro';
            if (nuevo !== tema) { tema = nuevo; pintar(); }
        },
    };
}
