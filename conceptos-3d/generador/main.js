// «Cómo se genera la electricidad», en 3D: una turbina mueve un eje, el eje hace girar un imán dentro de tres bobinas
// de cobre, y el voltaje que aparece en la primera bobina mueve la aguja de un voltímetro y enciende un foco.
// Un solo dato lo mueve todo: el ángulo del imán. La velocidad (vueltas por minuto) decide cuánto avanza; de ese ángulo
// salen la pose de cada pieza, la aguja, el brillo del foco, la curva y las cifras, así que nada puede contradecirse.
// La página vive dentro de Aprende: habla con ella con los mismos mensajes que las figuras anteriores
// (concepto-height, concepto-part y concepto-select-part).
import * as THREE from 'three';

const FIGURA = 'generador';
const TEMA = document.documentElement.dataset.tema === 'oscuro' ? 'oscuro' : 'claro';
const REDUCIR = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Cifras reales de un generador de dos polos en la red mexicana: 3,600 vueltas por minuto dan 60 Hz, y a esa velocidad
// la bobina entrega 120 V eficaces (170 V de pico), lo que pide un foco de casa.
const RPM_NOMINAL = 3600;
const V_EFICAZ_NOMINAL = 120;
const V_PICO_NOMINAL = V_EFICAZ_NOMINAL * Math.SQRT2;
const TAU_FILAMENTO = 0.06; // s: lo que tarda el filamento en calentarse o enfriarse
const LENTO = [
    { id: 'lento', texto: '1/60', k: 1 / 60, nota: 'Cámara lenta: 60 veces más despacio.' },
    { id: 'medio', texto: '1/10', k: 1 / 10, nota: 'Cámara lenta: 10 veces más despacio.' },
    { id: 'real', texto: 'Real', k: 1, nota: 'A velocidad real el ojo ya no alcanza a ver el giro.' },
];

const PARTES = [
    { n: 1, nombre: 'Turbina', ancla: [-2.6, 1.95, 0], vista: { tx: -2.45, ty: 1.2, tz: 0, az: 58, el: 16, d: 4.4 } },
    { n: 2, nombre: 'Eje', ancla: [-1.05, 1.32, 0], vista: { tx: -0.9, ty: 1.2, tz: 0, az: 12, el: 14, d: 5.6 } },
    { n: 3, nombre: 'Imán que gira (rotor)', ancla: [0.2, 1.82, 0.2], vista: { tx: 0.2, ty: 1.2, tz: 0, az: 26, el: 20, d: 3.7 }, corte: true },
    { n: 4, nombre: 'Bobinas de cobre (estator)', ancla: [0.2, 1.96, 0.28], vista: { tx: 0.2, ty: 1.2, tz: 0, az: 38, el: 26, d: 3.9 }, corte: true },
    { n: 5, nombre: 'Voltímetro', ancla: [2.25, 1.32, 1.0], vista: { tx: 2.2, ty: 0.95, tz: 0.95, az: 8, el: 12, d: 2.9 } },
    { n: 6, nombre: 'Foco', ancla: [2.25, 1.85, -0.95], vista: { tx: 2.2, ty: 1.35, tz: -0.95, az: -18, el: 10, d: 2.8 } },
];
const VISTA_GENERAL = { tx: 0, ty: 1.05, tz: 0, az: 34, el: 22, d: 8.6 };
const D2R = Math.PI / 180;

// Colores del sistema Búho para cada tema; el guinda marca la pieza que trabaja.
const PALETA = TEMA === 'oscuro'
    ? { fondo: '#080a19', base: '#1c1f2a', metal: '#8d939e', acero: '#c2c6cd', cobre: '#c98a5a', norte: '#e57a9a', sur: '#6ea8e0', acento: '#e57a9a', tinta: '#f1efea', suave: '#a4a7ae', agua: '#5cc3db', caratula: '#13151f' }
    : { fondo: '#fafafa', base: '#d9dbdb', metal: '#7d838c', acero: '#a9aeb6', cobre: '#b8703f', norte: '#9b2247', sur: '#2e6fb0', acento: '#9b2247', tinta: '#0a0707', suave: '#5b5e63', agua: '#0f6e82', caratula: '#ffffff' };

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const num = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });

// ------------------------------------------------------------------ la página
const app = document.getElementById('app');
app.innerHTML = `
    <div class="g-escena">
        <canvas class="g-lienzo" aria-hidden="true"></canvas>
        <svg class="g-guia" aria-hidden="true"><line x1="0" y1="0" x2="0" y2="0"/><circle r="4"/></svg>
        <div class="g-etiqueta" hidden><b></b><span></span></div>
        <div class="g-escena-acciones">
            <button type="button" class="g-chip" data-recorrido aria-pressed="true"><i></i><span>Recorrido</span></button>
            <button type="button" class="g-chip" data-corte aria-pressed="false">Ver por dentro</button>
        </div>
        <p class="g-ayuda">Arrastra para girar · rueda o pellizca para acercar</p>
    </div>
    <div class="g-tablero">
        <section class="g-cifras" aria-label="Lo que mide el generador">
            <div><span>Velocidad</span><b data-c="rpm"></b><small>vueltas por minuto</small></div>
            <div><span>Frecuencia</span><b data-c="hz"></b><small>ciclos por segundo</small></div>
            <div><span>Voltaje eficaz</span><b data-c="v"></b><small>en la bobina 1</small></div>
            <div><span>En este instante</span><b data-c="vi"></b><small>la aguja del voltímetro</small></div>
        </section>
        <section class="g-control" aria-label="Controles">
            <label class="g-deslizador"><span>Haz girar la turbina</span><input type="range" min="0" max="${RPM_NOMINAL}" step="60" value="${RPM_NOMINAL}" aria-label="Velocidad de giro en vueltas por minuto"></label>
            <div class="g-seg" role="radiogroup" aria-label="Velocidad de la animación">${LENTO.map(l => `<button type="button" role="radio" data-lento="${l.id}" aria-checked="false">${l.texto}</button>`).join('')}</div>
            <p class="g-nota" data-nota></p>
        </section>
        <section class="g-curva" aria-label="Voltaje en las tres bobinas">
            <div class="g-curva-cab"><b>Voltaje en las bobinas</b><span><i class="f1"></i>1<i class="f2"></i>2<i class="f3"></i>3</span></div>
            <canvas aria-hidden="true"></canvas>
            <p>Sube, baja y cambia de signo: es corriente alterna. Las tres bobinas van desfasadas un tercio de vuelta.</p>
        </section>
        <nav class="g-partes" aria-label="Partes del generador">${PARTES.map(p => `<button type="button" data-parte="${p.n}" aria-pressed="false"><span>${p.n}</span>${p.nombre}</button>`).join('')}</nav>
    </div>`;

const $ = s => app.querySelector(s);
const lienzo = $('.g-lienzo');
const escena = $('.g-escena');

// ------------------------------------------------------------------ la escena
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: false });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
const scene = new THREE.Scene();
scene.background = new THREE.Color(PALETA.fondo);
const camera = new THREE.PerspectiveCamera(30, 16 / 10, 0.05, 80);

scene.add(new THREE.HemisphereLight('#ffffff', TEMA === 'oscuro' ? '#20232f' : '#cfd1d4', TEMA === 'oscuro' ? 1.1 : 1.35));
const sol = new THREE.DirectionalLight('#ffffff', TEMA === 'oscuro' ? 2.0 : 2.4);
sol.position.set(-3, 7, 5);
sol.castShadow = true;
Object.assign(sol.shadow.camera, { left: -5, right: 5, top: 4, bottom: -3, near: 1, far: 20 });
sol.shadow.mapSize.set(2048, 2048);
sol.shadow.radius = 4;
sol.shadow.bias = -0.0006;
scene.add(sol);
const relleno = new THREE.DirectionalLight('#ffffff', 0.6);
relleno.position.set(5, 3, -4);
scene.add(relleno);

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.15, ...extra });
const M = {
    base: mat(PALETA.base, { roughness: 0.9, metalness: 0 }),
    metal: mat(PALETA.metal, { roughness: 0.45, metalness: 0.55 }),
    acero: mat(PALETA.acero, { roughness: 0.35, metalness: 0.7 }),
    cobre: mat(PALETA.cobre, { roughness: 0.38, metalness: 0.75 }),
    norte: mat(PALETA.norte, { roughness: 0.5 }),
    sur: mat(PALETA.sur, { roughness: 0.5 }),
    cable: mat(TEMA === 'oscuro' ? '#2a2e3b' : '#2b2b2f', { roughness: 0.7 }),
    caja: mat(TEMA === 'oscuro' ? '#2a2e3b' : '#3a3d44', { roughness: 0.6 }),
    agua: mat(PALETA.agua, { roughness: 0.2, metalness: 0, transparent: true, opacity: 0.85 }),
};
const sombra = mesh => { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; };
const grupo = (...hijos) => { const g = new THREE.Group(); hijos.forEach(h => g.add(h)); return g; };

// Corte: una pared invisible en z = 0 quita la mitad frontal del estator para ver el imán y las bobinas.
const plano = new THREE.Plane(new THREE.Vector3(0, 0, -1), 50);
const conCorte = material => { material.clippingPlanes = [plano]; material.side = THREE.DoubleSide; return material; };

const Y = 1.2; // altura del eje
const raiz = new THREE.Group();
scene.add(raiz);

// Piso y bancada
const piso = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ color: '#000000', opacity: TEMA === 'oscuro' ? 0.35 : 0.14 }));
piso.rotation.x = -Math.PI / 2;
piso.receiveShadow = true;
scene.add(piso);
raiz.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.16, 2.9), M.base)).translateY(0.08));

// Chumaceras que sostienen el eje
for (const x of [-1.55, 1.25]) {
    const pata = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.34, Y - 0.2, 0.62), M.metal));
    pata.position.set(x, 0.16 + (Y - 0.2) / 2, 0);
    const caja = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.34, 28).rotateZ(Math.PI / 2), M.metal));
    caja.position.set(x, Y, 0);
    raiz.add(pata, caja);
}

// 2 · Eje
const eje = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 4.3, 24).rotateZ(Math.PI / 2), M.acero));
eje.position.set(-0.75, Y, 0);
raiz.add(eje);

// 1 · Turbina Pelton: un disco con cucharas en el borde; el chorro de agua pega arriba y la empuja
const turbina = new THREE.Group();
turbina.position.set(-2.6, Y, 0);
turbina.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 48).rotateZ(Math.PI / 2), M.metal)));
turbina.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 32).rotateZ(Math.PI / 2), M.metal)));
const CUCHARAS = 16;
const cucharaGeo = new THREE.SphereGeometry(0.15, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2).scale(1.15, 0.9, 1);
for (let i = 0; i < CUCHARAS; i++) {
    const brazo = new THREE.Group();
    brazo.rotation.x = (i / CUCHARAS) * Math.PI * 2;
    const cuchara = sombra(new THREE.Mesh(cucharaGeo, M.acero));
    cuchara.material.side = THREE.DoubleSide;
    cuchara.position.y = 0.76;
    const soporte = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.18, 0.06), M.acero));
    soporte.position.y = 0.64;
    brazo.add(cuchara, soporte);
    turbina.add(brazo);
}
raiz.add(turbina);
// Tubería y boquilla: el chorro sale horizontal y pega en las cucharas de arriba
const ALTURA_CHORRO = Y + 0.78;
const tubo = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, ALTURA_CHORRO - 0.16, 20), M.metal));
tubo.position.set(-2.6, 0.16 + (ALTURA_CHORRO - 0.16) / 2, -1.2);
const codo = sombra(new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 14), M.metal));
codo.position.set(-2.6, ALTURA_CHORRO, -1.2);
const ramal = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.4, 20).rotateX(Math.PI / 2), M.metal));
ramal.position.set(-2.6, ALTURA_CHORRO, -1.0);
const boquilla = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.045, 0.26, 20).rotateX(Math.PI / 2), M.metal));
boquilla.position.set(-2.6, ALTURA_CHORRO, -0.67);
raiz.add(tubo, codo, ramal, boquilla);
// Gotas: un chorro que pega en los álabes, más rápido cuanto más gira
const GOTAS = 70;
const gotas = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 8, 6), M.agua, GOTAS);
raiz.add(gotas);
const mtx = new THREE.Matrix4();

// 3 · Rotor: imán de dos polos (norte guinda, sur azul) con sus letras
const rotor = new THREE.Group();
rotor.position.set(0.2, Y, 0);
const LARGO_ROTOR = 1.0;
const R_ROTOR = 0.5;
const mitad = (color, inicio) => sombra(new THREE.Mesh(new THREE.CylinderGeometry(R_ROTOR, R_ROTOR, LARGO_ROTOR, 48, 1, false, inicio, Math.PI).rotateZ(-Math.PI / 2), color));
rotor.add(mitad(M.norte, Math.PI), mitad(M.sur, 0));
const letra = (texto, color) => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = color;
    g.font = '600 92px Manrope, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(texto, 64, 70);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
};
for (const [texto, y] of [['N', 0.26], ['S', -0.26]]) {
    for (const lado of [1, -1]) {
        const l = letra(texto, '#ffffff');
        l.position.set(lado * (LARGO_ROTOR / 2 + 0.002), y, 0);
        l.rotation.y = lado * Math.PI / 2;
        rotor.add(l);
    }
}
raiz.add(rotor);

// 4 · Estator: carcasa con tres bobinas de cobre a un tercio de vuelta entre sí
const estator = new THREE.Group();
estator.position.set(0.2, Y, 0);
const R_IN = 0.84;
const R_OUT = 1.02;
const LARGO_EST = 1.24;
const perfil = [new THREE.Vector2(R_IN, -LARGO_EST / 2), new THREE.Vector2(R_OUT, -LARGO_EST / 2), new THREE.Vector2(R_OUT, LARGO_EST / 2), new THREE.Vector2(R_IN, LARGO_EST / 2), new THREE.Vector2(R_IN, -LARGO_EST / 2)];
const carcasa = sombra(new THREE.Mesh(new THREE.LatheGeometry(perfil, 72).rotateZ(-Math.PI / 2), conCorte(M.metal.clone())));
estator.add(carcasa);
const BOBINAS = [0, 120, 240].map(g => g * D2R);
const bobinas = BOBINAS.map(phi => {
    const g = new THREE.Group();
    for (let vuelta = 0; vuelta < 4; vuelta++) {
        const r = 0.76 - vuelta * 0.035;
        const pts = [];
        const L = 0.46;
        const A = 0.42;
        // un rectángulo de esquinas redondas sobre el cilindro, en (x, ángulo)
        for (let i = 0; i < 64; i++) {
            const s = (i / 64) * Math.PI * 2;
            const x = L * Math.sign(Math.cos(s)) * Math.pow(Math.abs(Math.cos(s)), 0.25);
            const ang = phi + A * Math.sign(Math.sin(s)) * Math.pow(Math.abs(Math.sin(s)), 0.25);
            pts.push(new THREE.Vector3(x, Math.cos(ang) * r, Math.sin(ang) * r));
        }
        const curva = new THREE.CatmullRomCurve3(pts, true);
        g.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(curva, 96, 0.024, 8, true), M.cobre.clone())));
    }
    estator.add(g);
    return g;
});
raiz.add(estator);

// 5 · Voltímetro con aguja de cero al centro
const voltimetro = new THREE.Group();
voltimetro.position.set(2.25, 0.16, 1.0);
voltimetro.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.7, 0.32), M.caja)).translateY(0.35));
const caratula = (() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 380;
    const g = c.getContext('2d');
    g.fillStyle = PALETA.caratula;
    g.fillRect(0, 0, 512, 380);
    g.strokeStyle = PALETA.tinta;
    g.fillStyle = PALETA.tinta;
    g.lineWidth = 4;
    g.beginPath();
    g.arc(256, 330, 230, Math.PI * 1.17, Math.PI * 1.83);
    g.stroke();
    g.font = '600 34px Manrope, sans-serif';
    g.textAlign = 'center';
    for (let i = -4; i <= 4; i++) {
        const a = -Math.PI / 2 + i * (Math.PI * 0.33) / 4;
        const r1 = i % 2 === 0 ? 196 : 210;
        g.lineWidth = i === 0 ? 6 : 3;
        g.beginPath();
        g.moveTo(256 + Math.cos(a) * r1, 330 + Math.sin(a) * r1);
        g.lineTo(256 + Math.cos(a) * 230, 330 + Math.sin(a) * 230);
        g.stroke();
        if (i % 2 === 0) g.fillText(String(Math.round(i * 42.5)), 256 + Math.cos(a) * 160, 330 + Math.sin(a) * 160 + 12);
    }
    g.font = '600 40px Manrope, sans-serif';
    g.fillText('V', 256, 270);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
})();
const cara = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.594), new THREE.MeshBasicMaterial({ map: caratula }));
cara.position.set(0, 0.37, 0.162);
voltimetro.add(cara);
const pivote = new THREE.Group();
pivote.position.set(0, 0.37 - 0.594 / 2 + 0.594 * (50 / 380), 0.168);
const aguja = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.34, 0.006), new THREE.MeshBasicMaterial({ color: PALETA.acento }));
aguja.position.y = 0.17;
pivote.add(aguja, new THREE.Mesh(new THREE.CircleGeometry(0.03, 20), new THREE.MeshBasicMaterial({ color: PALETA.tinta })));
voltimetro.add(pivote);
raiz.add(voltimetro);

// 6 · Foco en su base
const foco = new THREE.Group();
foco.position.set(2.25, 0.16, -0.95);
foco.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.12, 28), M.caja)).translateY(0.06));
foco.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 12), M.metal)).translateY(0.55));
foco.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.2, 24), M.metal)).translateY(1.05));
const vidrio = new THREE.Mesh(new THREE.SphereGeometry(0.26, 32, 24), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.28, emissive: new THREE.Color('#ffcc66'), emissiveIntensity: 0 }));
vidrio.position.y = 1.36;
const filamento = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.008, 8, 24), new THREE.MeshBasicMaterial({ color: '#5a4a3a' }));
filamento.position.y = 1.34;
const luz = new THREE.PointLight('#ffcf7a', 0, 4, 1.6);
luz.position.y = 1.36;
foco.add(vidrio, filamento, luz);
raiz.add(foco);

// Cables de la bobina 1 al voltímetro y al foco
const cable = (...p) => {
    const curva = new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));
    raiz.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(curva, 64, 0.022, 8, false), M.cable)));
};
cable([0.45, Y + R_OUT, 0.06], [0.9, Y + 1.35, 0.4], [1.8, 1.1, 0.95], [2.0, 0.62, 1.0]);
cable([0.45, Y + R_OUT, -0.06], [0.9, Y + 1.35, -0.4], [1.75, 1.9, -0.9], [2.25, 1.32, -0.95]);

// ------------------------------------------------------------------ resaltar una pieza
const PIEZAS = { 1: [turbina], 2: [eje], 3: [rotor], 4: [estator], 5: [voltimetro], 6: [foco] };
const acento = new THREE.Color(PALETA.acento);
const resaltar = n => {
    for (const [k, objetos] of Object.entries(PIEZAS)) {
        for (const o of objetos) {
            o.traverse(m => {
                if (!m.isMesh || !m.material?.emissive || m === vidrio || m.material === M.norte || m.material === M.sur) return;
                if (!m.userData.original) m.userData.original = m.material;
                m.material = Number(k) === n ? m.userData.resaltado ??= Object.assign(m.userData.original.clone(), { emissive: acento.clone(), emissiveIntensity: 0.09 }) : m.userData.original;
            });
        }
    }
};

// ------------------------------------------------------------------ estado
let rpm = RPM_NOMINAL;
let rpmObjetivo = RPM_NOMINAL;
let lento = LENTO[0];
let angulo = 0; // del imán, en radianes
let brillo = 0;
let parte = 0;
let corte = 0;
let corteManual = false;
const cam = { ...VISTA_GENERAL };
const orbita = { az: 0, el: 0, k: 1 };
const recorrido = { activo: !REDUCIR, t: 0, paso: -1 };
let ultimoToque = -99;
let T = 0;

const nota = $('[data-nota]');
const elegirLento = id => {
    lento = LENTO.find(l => l.id === id) || LENTO[0];
    app.querySelectorAll('[data-lento]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.lento === lento.id)));
    nota.textContent = lento.nota;
};
elegirLento('lento');

const botonesPartes = [...app.querySelectorAll('[data-parte]')];
const etiqueta = $('.g-etiqueta');
const guia = $('.g-guia');
function elegirParte(n, { avisar = false } = {}) {
    parte = n;
    botonesPartes.forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.parte) === n)));
    resaltar(n);
    const p = PARTES.find(x => x.n === n);
    etiqueta.hidden = !p;
    guia.style.display = p ? '' : 'none';
    if (p) {
        etiqueta.querySelector('b').textContent = p.n;
        etiqueta.querySelector('span').textContent = p.nombre;
    }
    if (!corteManual) corte = p?.corte ? 1 : 0;
    if (avisar) parent.postMessage({ type: 'concepto-part', figura: FIGURA, n }, location.origin);
}

const btnRecorrido = $('[data-recorrido]');
const btnCorte = $('[data-corte]');
const pintarBotones = () => {
    btnRecorrido.setAttribute('aria-pressed', String(recorrido.activo));
    btnRecorrido.querySelector('span').textContent = recorrido.activo ? 'Pausar recorrido' : 'Ver recorrido';
    btnCorte.setAttribute('aria-pressed', String(corte > 0.5));
};
const tomarControl = () => {
    ultimoToque = T;
    if (!recorrido.activo) return;
    recorrido.activo = false;
    pintarBotones();
};

// ------------------------------------------------------------------ controles
const deslizador = $('.g-deslizador input');
deslizador.addEventListener('input', () => { tomarControl(); rpmObjetivo = Number(deslizador.value); });
app.querySelectorAll('[data-lento]').forEach(b => b.addEventListener('click', () => { tomarControl(); elegirLento(b.dataset.lento); }));
botonesPartes.forEach(b => b.addEventListener('click', () => {
    // si la pieza la eligió el recorrido, tocarla la deja elegida en vez de soltarla
    const delRecorrido = recorrido.activo;
    tomarControl();
    const n = Number(b.dataset.parte);
    elegirParte(parte === n && !delRecorrido ? 0 : n, { avisar: true });
    Object.assign(orbita, { az: 0, el: 0, k: 1 });
}));
btnCorte.addEventListener('click', () => { tomarControl(); corteManual = true; corte = corte > 0.5 ? 0 : 1; pintarBotones(); });
btnRecorrido.addEventListener('click', event => {
    event.stopPropagation();
    if (recorrido.activo) { tomarControl(); return; }
    Object.assign(recorrido, { activo: true, t: 0, paso: -1 });
    corteManual = false;
    Object.assign(orbita, { az: 0, el: 0, k: 1 });
    pintarBotones();
});
window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.data?.type !== 'concepto-select-part') return;
    tomarControl();
    elegirParte(Number(event.data.n) || 0);
    Object.assign(orbita, { az: 0, el: 0, k: 1 });
});

// Girar con el dedo o el ratón; acercar con la rueda o con dos dedos.
const punteros = new Map();
let distanciaPinza = 0;
lienzo.addEventListener('pointerdown', e => { tomarControl(); punteros.set(e.pointerId, [e.clientX, e.clientY]); lienzo.setPointerCapture(e.pointerId); escena.classList.add('arrastra'); });
lienzo.addEventListener('pointermove', e => {
    if (!punteros.has(e.pointerId)) return;
    const [x0, y0] = punteros.get(e.pointerId);
    punteros.set(e.pointerId, [e.clientX, e.clientY]);
    if (punteros.size === 2) {
        const [a, b] = [...punteros.values()];
        const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (distanciaPinza) orbita.k = clamp(orbita.k * (distanciaPinza / d), 0.45, 2);
        distanciaPinza = d;
        return;
    }
    orbita.az -= (e.clientX - x0) * 0.35;
    orbita.el = clamp(orbita.el + (e.clientY - y0) * 0.25, -15, 55);
    ultimoToque = T;
});
const soltar = e => { punteros.delete(e.pointerId); distanciaPinza = 0; if (!punteros.size) escena.classList.remove('arrastra'); };
lienzo.addEventListener('pointerup', soltar);
lienzo.addEventListener('pointercancel', soltar);
lienzo.addEventListener('wheel', e => { e.preventDefault(); tomarControl(); orbita.k = clamp(orbita.k * Math.exp(e.deltaY * 0.0012), 0.45, 2); }, { passive: false });

// ------------------------------------------------------------------ la curva
const curva = $('.g-curva canvas');
const cg = curva.getContext('2d');
const COLORES_FASE = [PALETA.acento, PALETA.sur, PALETA.suave];
function dibujarCurva(vPico) {
    const pr = Math.min(devicePixelRatio || 1, 2);
    const w = curva.clientWidth;
    const h = curva.clientHeight;
    if (curva.width !== Math.round(w * pr)) { curva.width = Math.round(w * pr); curva.height = Math.round(h * pr); }
    cg.setTransform(pr, 0, 0, pr, 0, 0);
    cg.clearRect(0, 0, w, h);
    const medio = h / 2;
    const escalaV = (h / 2 - 6) / V_PICO_NOMINAL;
    cg.strokeStyle = TEMA === 'oscuro' ? '#262a36' : '#d9dbdb';
    cg.lineWidth = 1;
    cg.beginPath(); cg.moveTo(0, medio); cg.lineTo(w, medio); cg.stroke();
    // dos vueltas del imán hacia atrás; el presente queda a la derecha
    const ventana = Math.PI * 4;
    for (let f = 2; f >= 0; f--) {
        cg.strokeStyle = COLORES_FASE[f];
        cg.lineWidth = f === 0 ? 2.4 : 1.4;
        cg.globalAlpha = f === 0 ? 1 : 0.55;
        cg.beginPath();
        for (let px = 0; px <= w; px += 2) {
            const a = angulo - ventana * (1 - px / w);
            const v = vPico * Math.sin(a - BOBINAS[f]);
            const y = medio - v * escalaV;
            if (px === 0) cg.moveTo(px, y); else cg.lineTo(px, y);
        }
        cg.stroke();
    }
    cg.globalAlpha = 1;
    const ahora = vPico * Math.sin(angulo);
    cg.fillStyle = PALETA.acento;
    cg.beginPath(); cg.arc(w - 4, medio - ahora * escalaV, 4.5, 0, Math.PI * 2); cg.fill();
}

// ------------------------------------------------------------------ medidas y avisos a la página
const cifra = k => app.querySelector(`[data-c="${k}"]`);
let alturaAvisada = 0;
const avisarAltura = () => {
    const h = Math.ceil(document.documentElement.scrollHeight);
    if (Math.abs(h - alturaAvisada) < 2) return;
    alturaAvisada = h;
    parent.postMessage({ type: 'concepto-height', id: FIGURA, h }, location.origin);
};
function medir() {
    const w = escena.clientWidth;
    const h = escena.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 1.1 ? 42 : 30;
    camera.updateProjectionMatrix();
    guia.setAttribute('viewBox', `0 0 ${w} ${h}`);
    avisarAltura();
}
new ResizeObserver(medir).observe(document.body);
medir();

// ------------------------------------------------------------------ el recorrido
// Arranca quieto, la turbina acelera hasta 3,600 vueltas y luego visita cada pieza.
const PASO = 5.2;
function guionRecorrido(dt) {
    recorrido.t += dt;
    const t = recorrido.t;
    if (t < 4) {
        rpmObjetivo = RPM_NOMINAL * Math.min(1, t / 3.4);
        if (parte) elegirParte(0);
        return;
    }
    const paso = Math.floor((t - 4) / PASO) % (PARTES.length + 1);
    if (paso !== recorrido.paso) {
        recorrido.paso = paso;
        elegirParte(paso < PARTES.length ? PARTES[paso].n : 0);
    }
    rpmObjetivo = RPM_NOMINAL;
    if (paso === PARTES.length && (t - 4) % PASO > PASO - 0.2) Object.assign(recorrido, { t: 0, paso: -1 });
}

// ------------------------------------------------------------------ cada cuadro
const proyectado = new THREE.Vector3();
let antes = performance.now();
let visible = true;
document.addEventListener('visibilitychange', () => { visible = document.visibilityState === 'visible'; });
function cuadro(ahora) {
    requestAnimationFrame(cuadro);
    const dt = Math.min(0.1, (ahora - antes) / 1000);
    antes = ahora;
    if (!visible) return;
    T += dt;
    if (recorrido.activo) guionRecorrido(dt);
    else if (T - ultimoToque > 30 && !REDUCIR) { Object.assign(recorrido, { activo: true, t: 4, paso: -1 }); corteManual = false; pintarBotones(); }

    rpm += (rpmObjetivo - rpm) * (1 - Math.exp(-dt / 0.6));
    const omega = (rpm / 60) * Math.PI * 2; // rad/s reales
    const dtSim = dt * lento.k;
    angulo += omega * dtSim;
    const vPico = V_PICO_NOMINAL * (rpm / RPM_NOMINAL);
    const v = vPico * Math.sin(angulo);
    // el filamento sigue a la potencia (v²) con su propio retraso, en el tiempo de la escena
    const potencia = 2 * (v / V_PICO_NOMINAL) ** 2;
    brillo += (potencia - brillo) * (1 - Math.exp(-dtSim / TAU_FILAMENTO));

    // poses
    turbina.rotation.x = angulo;
    eje.rotation.x = angulo;
    rotor.rotation.x = angulo;
    pivote.rotation.z = -clamp(v / V_PICO_NOMINAL, -1.1, 1.1) * (Math.PI * 0.33) / 2 * (170 / 170);
    vidrio.material.emissiveIntensity = clamp(brillo, 0, 1.6) * 1.4;
    filamento.material.color.set(brillo > 0.08 ? '#ffd27a' : '#5a4a3a');
    luz.intensity = clamp(brillo, 0, 1.6) * 3;
    bobinas.forEach((b, i) => {
        const fuerza = Math.abs(Math.sin(angulo - BOBINAS[i])) * (rpm / RPM_NOMINAL);
        b.children.forEach(m => { if (m.material.emissive && parte !== 4) { m.material.emissive.set(PALETA.cobre); m.material.emissiveIntensity = i === 0 ? fuerza * 0.35 : fuerza * 0.12; } });
    });
    // el chorro: gotas de la boquilla a los álabes
    const velAgua = 0.4 + 1.6 * (rpm / RPM_NOMINAL);
    for (let i = 0; i < GOTAS; i++) {
        const fase = ((i / GOTAS) + T * velAgua * 0.6) % 1;
        const on = rpm > 30 ? 1 : 0;
        const caida = Math.max(0, fase - 0.62) / 0.38;
        mtx.makeTranslation(-2.6 + (i % 2 ? 1 : -1) * (0.02 + caida * (0.25 + 0.1 * Math.sin(i * 12.9))), ALTURA_CHORRO - caida * caida * 0.9, -0.54 + Math.min(fase, 0.62) * 0.95 + caida * 0.12);
        mtx.scale(new THREE.Vector3(on, on, on));
        gotas.setMatrixAt(i, mtx);
    }
    gotas.instanceMatrix.needsUpdate = true;

    // corte
    const corteObjetivo = corte;
    plano.constant += ((corteObjetivo ? 0 : 50) - plano.constant) * (1 - Math.exp(-dt / 0.25));

    // cámara: vista de la pieza (o general) más lo que el visitante gire o acerque
    const p = PARTES.find(x => x.n === parte);
    const meta = p ? p.vista : VISTA_GENERAL;
    const giro = recorrido.activo && !p ? Math.sin(T * 0.15) * 8 : 0;
    const k = 1 - Math.exp(-dt / 0.45);
    cam.tx += (meta.tx - cam.tx) * k;
    cam.ty += (meta.ty - cam.ty) * k;
    cam.tz += (meta.tz - cam.tz) * k;
    cam.az += (meta.az + orbita.az + giro - cam.az) * k;
    cam.el += (clamp(meta.el + orbita.el, -10, 70) - cam.el) * k;
    cam.d += (meta.d * orbita.k * (camera.aspect < 1.1 ? 1.25 : 1) - cam.d) * k;
    camera.position.set(cam.tx + cam.d * Math.cos(cam.el * D2R) * Math.sin(cam.az * D2R), cam.ty + cam.d * Math.sin(cam.el * D2R), cam.tz + cam.d * Math.cos(cam.el * D2R) * Math.cos(cam.az * D2R));
    camera.lookAt(cam.tx, cam.ty, cam.tz);
    renderer.render(scene, camera);

    // etiqueta con su guía hacia la pieza
    if (p) {
        proyectado.set(...p.ancla).project(camera);
        const w = escena.clientWidth;
        const h = escena.clientHeight;
        const x = (proyectado.x * 0.5 + 0.5) * w;
        const y = (-proyectado.y * 0.5 + 0.5) * h;
        const ex = clamp(x + (x > w * 0.6 ? -150 : 40), 12, w - etiqueta.offsetWidth - 12);
        const ey = clamp(y - 70, 12, h - etiqueta.offsetHeight - 12);
        etiqueta.style.transform = `translate(${ex}px, ${ey}px)`;
        const linea = guia.querySelector('line');
        linea.setAttribute('x1', ex + etiqueta.offsetWidth / 2);
        linea.setAttribute('y1', ey + etiqueta.offsetHeight);
        linea.setAttribute('x2', x);
        linea.setAttribute('y2', y);
        guia.querySelector('circle').setAttribute('cx', x);
        guia.querySelector('circle').setAttribute('cy', y);
    }

    // cifras
    cifra('rpm').textContent = num(Math.round(rpm / 10) * 10);
    cifra('hz').textContent = `${num(rpm / 60, 1)} Hz`;
    cifra('v').textContent = `${num(V_EFICAZ_NOMINAL * rpm / RPM_NOMINAL)} V`;
    cifra('vi').textContent = `${v >= 0 ? '+' : '−'}${num(Math.abs(v))} V`;
    if (Number(deslizador.value) !== Math.round(rpmObjetivo / 60) * 60 && recorrido.activo) deslizador.value = String(Math.round(rpmObjetivo / 60) * 60);
    dibujarCurva(vPico);
    pintarBotones();
}
pintarBotones();
elegirParte(0);
requestAnimationFrame(cuadro);
addEventListener('load', avisarAltura);
