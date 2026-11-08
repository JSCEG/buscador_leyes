// «Cómo se genera la electricidad», en 3D: una turbina mueve un eje, el eje hace girar un imán dentro de tres bobinas
// de cobre, y el voltaje que aparece en la primera bobina mueve la aguja de un voltímetro y enciende un foco.
// Un solo dato lo mueve todo: el ángulo del imán. La velocidad (vueltas por minuto) decide cuánto avanza; de ese ángulo
// salen la pose de cada pieza, la aguja, el brillo del foco, la curva y las cifras, así que nada puede contradecirse.
// La página vive dentro de Aprende: habla con ella con los mismos mensajes que las figuras anteriores
// (concepto-height, concepto-part y concepto-select-part).
import * as THREE from 'three';
import { brandMarkSvg } from '../../src/lib/brand-mark.js';
import { tema, paleta, materiales, ayudantes, estudio, PIXELES_MAX } from '../comun/estilo.js';
import { crearCorriente } from '../comun/corriente.js';

const FIGURA = 'generador';
const TEMA = tema();
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
const VISTAS = [
    { id: 'general', texto: 'General', ...VISTA_GENERAL },
    { id: 'frente', texto: 'Frente', tx: 0, ty: 1.0, tz: 0, az: 0, el: 6, d: 8.4 },
    { id: 'lado', texto: 'Lado', tx: 0.6, ty: 1.0, tz: 0, az: 92, el: 10, d: 7.0 },
    { id: 'arriba', texto: 'Arriba', tx: 0, ty: 0.6, tz: 0, az: 0, el: 68, d: 8.8 },
    { id: 'adentro', texto: 'Adentro', tx: 0.2, ty: 1.2, tz: 0, az: 18, el: 10, d: 2.7, corte: true },
];
const D2R = Math.PI / 180;
const ICONO_ABRIR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
const ICONO_CERRAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';

// Colores del estilo común (cerámica, grafito, bordes guinda, corriente en amarillo); el guinda marca la pieza que trabaja.
const PALETA = paleta(TEMA);

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const num = (x, d = 0) => x.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });

// Los mismos controles van en el tablero y en la barra de pantalla completa; se sincronizan entre sí.
const controles = () => `
    <label class="g-deslizador"><span>Velocidad</span><input type="range" data-rpm min="0" max="${RPM_NOMINAL}" step="60" value="${RPM_NOMINAL}" aria-label="Velocidad de giro en vueltas por minuto"></label>
    <label class="g-deslizador"><span>Desarmar</span><input type="range" data-desarme min="0" max="1" step="0.01" value="0" aria-label="Desarmar el generador"></label>
    <div class="g-filas">
        <div class="g-seg" role="radiogroup" aria-label="Cámara lenta">${LENTO.map(l => `<button type="button" role="radio" data-lento="${l.id}" aria-checked="false">${l.texto}</button>`).join('')}</div>
        <div class="g-seg" role="radiogroup" aria-label="Vista de cámara">${VISTAS.map(v => `<button type="button" role="radio" data-vista="${v.id}" aria-checked="false">${v.texto}</button>`).join('')}</div>
    </div>`;

// ------------------------------------------------------------------ la página
const app = document.getElementById('app');
app.innerHTML = `
    <div class="g-escena">
        <canvas class="g-lienzo" aria-hidden="true"></canvas>
        <svg class="g-guia" aria-hidden="true"><line x1="0" y1="0" x2="0" y2="0"/><circle r="4"/></svg>
        <div class="g-etiqueta" hidden><b></b><span></span></div>
        <div class="g-escena-acciones">
            <button type="button" class="g-chip" data-recorrido aria-pressed="true"><i></i><span>Recorrido</span></button>
            <span class="g-grupo">
                <button type="button" class="g-chip" data-corte aria-pressed="false">Ver por dentro</button>
                <button type="button" class="g-chip g-chip-icono" data-pantalla aria-pressed="false" aria-label="Pantalla completa" title="Pantalla completa">${ICONO_ABRIR}</button>
            </span>
        </div>
        <div class="g-hud" aria-live="off"><b data-c="hz"></b><span><span data-c="rpm"></span> rpm · <span data-c="v"></span></span></div>
        <div class="g-nums" aria-hidden="true">${PARTES.map(p => `<span data-num="${p.n}"><b>${p.n}</b><i>${p.nombre}</i></span>`).join('')}</div>
        <div class="g-marca">${brandMarkSvg({ title: 'Buscador Jurídico' })}<span>Buscador Jurídico</span></div>
        <div class="g-flot">
            <nav class="g-flot-partes" aria-label="Partes del generador">${PARTES.map(p => `<button type="button" data-parte="${p.n}" aria-pressed="false"><span>${p.n}</span>${p.nombre}</button>`).join('')}</nav>
            <div class="g-flot-ctrl">${controles()}</div>
        </div>
    </div>
    <div class="g-tablero">
        <section class="g-control" aria-label="Controles">${controles()}</section>
        <section class="g-cifras" aria-label="Lo que mide el generador">
            <div><span>Velocidad</span><b data-c="rpm"></b><small>vueltas por minuto</small></div>
            <div><span>Frecuencia</span><b data-c="hz"></b><small>ciclos por segundo</small></div>
            <div><span>Voltaje eficaz</span><b data-c="v"></b><small>en la bobina 1</small></div>
            <div><span>En este instante</span><b data-c="vi"></b><small>la aguja del voltímetro</small></div>
        </section>
        <section class="g-curva" aria-label="Voltaje en las tres bobinas">
            <div class="g-curva-cab"><b>Voltaje en las bobinas</b><span><i class="f1"></i>1<i class="f2"></i>2<i class="f3"></i>3</span></div>
            <canvas aria-hidden="true"></canvas>
            <p>Sube, baja y cambia de signo: corriente alterna.</p>
        </section>
        <nav class="g-partes" aria-label="Partes del generador">${PARTES.map(p => `<button type="button" data-parte="${p.n}" aria-pressed="false"><span>${p.n}</span>${p.nombre}</button>`).join('')}</nav>
    </div>`;

const $ = s => app.querySelector(s);
const lienzo = $('.g-lienzo');
const escena = $('.g-escena');

// ------------------------------------------------------------------ la escena
const { renderer, scene, camera } = estudio(lienzo, PALETA, TEMA);
const M = materiales(PALETA);
M.norte = M.mat(PALETA.norte, { roughness: 0.5 });
M.sur = M.mat(PALETA.sur, { roughness: 0.5 });
const TINTA_CONTORNO = M.contorno;
const { sombra, contorno, aro } = ayudantes(M);

// Corte: una pared invisible en z = 0 quita la mitad frontal del estator para ver el imán y las bobinas.
const plano = new THREE.Plane(new THREE.Vector3(0, 0, -1), 50);
const conCorte = material => { material.clippingPlanes = [plano]; material.side = THREE.DoubleSide; return material; };

const Y = 1.2; // altura del eje
const raiz = new THREE.Group();
scene.add(raiz);

// Bancada
raiz.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.16, 2.9), M.ceramica))).translateY(0.08));

// Chumaceras que sostienen el eje (cada una es un grupo para poder desarmarla)
const chumaceras = [-1.55, 1.25].map(x => {
    const g = new THREE.Group();
    g.position.set(x, 0, 0);
    const pata = contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.34, Y - 0.2, 0.62), M.ceramica)));
    pata.position.y = 0.16 + (Y - 0.2) / 2;
    const caja = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.34, 28).rotateZ(Math.PI / 2), M.grafito));
    caja.position.y = Y;
    const tapas = [aro(0.19, 0.022, -0.17), aro(0.19, 0.022, 0.17)];
    tapas.forEach(t => { t.position.y = Y; });
    g.add(pata, caja, ...tapas);
    raiz.add(g);
    return g;
});

// 2 · Eje
const eje = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 4.3, 24).rotateZ(Math.PI / 2), M.acero));
eje.position.set(-0.75, Y, 0);
raiz.add(eje);

// 1 · Turbina Pelton: un disco con cucharas en el borde; el chorro de agua pega arriba y la empuja
const turbina = new THREE.Group();
turbina.position.set(-2.6, Y, 0);
turbina.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 48).rotateZ(Math.PI / 2), M.ceramica))), aro(0.62, 0.028, 0));
turbina.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 32).rotateZ(Math.PI / 2), M.grafito)), aro(0.2, 0.02, 0.15), aro(0.2, 0.02, -0.15));
const CUCHARAS = 16;
const cucharaGeo = new THREE.SphereGeometry(0.15, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2).scale(1.15, 0.9, 1);
for (let i = 0; i < CUCHARAS; i++) {
    const brazo = new THREE.Group();
    brazo.rotation.x = (i / CUCHARAS) * Math.PI * 2;
    const cuchara = sombra(new THREE.Mesh(cucharaGeo, M.grafito.clone()));
    cuchara.material.side = THREE.DoubleSide;
    cuchara.position.y = 0.76;
    const soporte = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.18, 0.06), M.grafito));
    soporte.position.y = 0.64;
    brazo.add(cuchara, soporte);
    turbina.add(brazo);
}
raiz.add(turbina);
// Tubería y boquilla: el chorro sale horizontal y pega en las cucharas de arriba
const ALTURA_CHORRO = Y + 0.78;
const tubo = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, ALTURA_CHORRO - 0.16, 20), M.grafito));
tubo.position.set(-2.6, 0.16 + (ALTURA_CHORRO - 0.16) / 2, -1.2);
const codo = sombra(new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 14), M.grafito));
codo.position.set(-2.6, ALTURA_CHORRO, -1.2);
const ramal = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.4, 20).rotateX(Math.PI / 2), M.grafito));
ramal.position.set(-2.6, ALTURA_CHORRO, -1.0);
const boquilla = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.045, 0.26, 20).rotateX(Math.PI / 2), M.borde));
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
const carcasa = sombra(new THREE.Mesh(new THREE.LatheGeometry(perfil, 72).rotateZ(-Math.PI / 2), conCorte(M.ceramica.clone())));
contorno(carcasa, 35, Object.assign(TINTA_CONTORNO.clone(), { clippingPlanes: [plano] }));
for (const lado of [-1, 1]) carcasa.add(Object.assign(aro(R_OUT - 0.01, 0.026, lado * LARGO_EST / 2), { material: conCorte(M.borde.clone()) }));
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
voltimetro.add(contorno(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.7, 0.32), M.ceramica))).translateY(0.35));
voltimetro.add(sombra(new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.64, 0.006), M.borde)).translateY(0.37).translateZ(0.166)); // frente de la caja en 0.16: el marco va 3 mm delante, nunca en el mismo plano
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
cara.position.set(0, 0.37, 0.175);
voltimetro.add(cara);
const pivote = new THREE.Group();
pivote.position.set(0, 0.37 - 0.594 / 2 + 0.594 * (50 / 380), 0.183);
const aguja = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.34, 0.006), new THREE.MeshBasicMaterial({ color: PALETA.acento }));
aguja.position.y = 0.17;
pivote.add(aguja, new THREE.Mesh(new THREE.CircleGeometry(0.03, 20), new THREE.MeshBasicMaterial({ color: PALETA.tinta })));
voltimetro.add(pivote);
// borne de conexión arriba de la caja, donde llega el cable
const borne = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.06, 16), M.grafito));
borne.position.set(-0.32, 0.73, 0);
const tapaBorne = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.025, 16), M.borde));
tapaBorne.position.set(-0.32, 0.77, 0);
voltimetro.add(borne, tapaBorne);
raiz.add(voltimetro);

// 6 · Foco en su base
const foco = new THREE.Group();
foco.position.set(2.25, 0.16, -0.95);
foco.add(contorno(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.12, 28), M.ceramica))).translateY(0.06));
foco.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 12), M.grafito)).translateY(0.55));
foco.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.2, 24), M.grafito)).translateY(1.05));
foco.add(sombra(new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.018, 10, 40).rotateX(Math.PI / 2), M.borde)).translateY(1.15));
const vidrio = new THREE.Mesh(new THREE.SphereGeometry(0.26, 32, 24), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.28, emissive: new THREE.Color('#ffcc66'), emissiveIntensity: 0 }));
vidrio.position.y = 1.36;
const filamento = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.008, 8, 24), new THREE.MeshBasicMaterial({ color: '#5a4a3a' }));
filamento.position.y = 1.34;
const luz = new THREE.PointLight('#ffcf7a', 0, 4, 1.6);
luz.position.y = 1.36;
foco.add(vidrio, filamento, luz);
raiz.add(foco);

// Cables de la bobina 1 al voltímetro y al foco
const curvasCable = [];
const cable = (...p) => {
    const curva = new THREE.CatmullRomCurve3(p.map(v => new THREE.Vector3(...v)));
    curvasCable.push(curva);
    raiz.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(curva, 64, 0.022, 8, false), M.cable)));
};
// Los cables salen de la tapa de la carcasa por abajo, bajan a la bancada, corren pegados a ella (sin colgar) rodeando
// la chumacera y llegan a cada aparato: suben pegados al voltímetro hasta su borne de arriba y entran a la base del foco.
// PISO_CABLE = cara de la bancada (0.16) + radio del cable (0.022).
const PISO_CABLE = 0.182;
const SALIDA = 0.2 + LARGO_EST / 2 + 0.02; // tapa derecha de la carcasa
cable([SALIDA, 0.3, 0.12], [SALIDA + 0.07, PISO_CABLE, 0.2], [1.0, PISO_CABLE, 0.55], [1.55, PISO_CABLE, 0.95], [1.765, PISO_CABLE + 0.02, 1.0], [1.768, 0.5, 1.0], [1.775, 0.84, 1.0], [1.84, 0.915, 1.0], [1.93, 0.925, 1.0]);
cable([SALIDA, 0.3, -0.12], [SALIDA + 0.07, PISO_CABLE, -0.2], [1.0, PISO_CABLE, -0.55], [1.55, PISO_CABLE, -0.95], [1.86, PISO_CABLE, -0.95], [1.995, 0.215, -0.95]);

// Corriente (estilo común): la distancia que recorren los puntos es la integral de la corriente (q = ∫ i dt), con i
// proporcional a v porque el foco es una resistencia. La amplitud de ida y vuelta es AVANCE ÷ ω y el voltaje también
// crece con ω, así que a cualquier velocidad van y vienen lo mismo (≈ 2/3 del espacio entre puntos). A 60 Hz la ida y
// vuelta dura 1/60 s: en cámara lenta 1/60 se ve en un segundo.
const AVANCE = 0.03 * (2 * Math.PI * 60);
const corriente = crearCorriente({ raiz, escena, curvas: curvasCable, P: PALETA });

// Tornillos de las tapas de la carcasa: grafito, 8 por tapa; al desarmar salen volando hacia fuera
const TORNILLOS = [];
for (const lado of [-1, 1]) for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    TORNILLOS.push({ base: new THREE.Vector3(lado * (LARGO_EST / 2 + 0.02), Math.cos(a) * 0.93, Math.sin(a) * 0.93), sale: new THREE.Vector3(lado * (0.45 + 0.25 * ((i * 7) % 3)), Math.cos(a) * 0.55, Math.sin(a) * 0.55) });
}
const tornillos = new THREE.InstancedMesh(new THREE.SphereGeometry(0.038, 12, 10), M.grafito, TORNILLOS.length);
tornillos.castShadow = true;
tornillos.frustumCulled = false;
raiz.add(tornillos);
const posTornillo = new THREE.Vector3();

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

// ------------------------------------------------------------------ desarmar
// Cuánto se mueve cada pieza (en metros de la escena) con «Desarmar» al máximo. Los números se escogieron para que
// nada se atraviese: las bobinas (radio 0.79) suben 1.6 y quedan 0.3 sobre el imán (radio 0.5); la carcasa (radio 1.02) se
// va 2.3 atrás y deja 0.49 de aire con las bobinas; la turbina sale por la punta del eje y las chumaceras se deslizan
// sobre él.
const MOVIBLES = [
    { parte: 1, objetos: [turbina], hacia: [-1.25, 0, 0] },
    { parte: 2, objetos: [eje], hacia: [0, 0, 0] },
    { parte: 2, objetos: [chumaceras[0]], hacia: [-0.65, 0, 0] },
    { parte: 2, objetos: [chumaceras[1]], hacia: [0.75, 0, 0] },
    { parte: 3, objetos: [rotor], hacia: [0, 0, 0] },
    { parte: 4, objetos: [carcasa], hacia: [0, 0.5, -2.3] },
    { parte: 4, objetos: bobinas, hacia: [0, 1.6, 0] },
    { parte: 5, objetos: [voltimetro], hacia: [0.35, 0, 0.55] },
    { parte: 6, objetos: [foco], hacia: [0.35, 0, -0.55] },
];
for (const m of MOVIBLES) for (const o of m.objetos) { o.userData.base = o.position.clone(); o.userData.parte = m.parte; }
// Dónde va la etiqueta de cada parte cuando la máquina está desarmada (sigue a la pieza principal)
const ANCLA_DESARME = { 1: [turbina, [0, 0.95, 0]], 2: [eje, [-0.9, 0.18, 0]], 3: [rotor, [0, 0.62, 0]], 4: [bobinas[0], [0, 0.98, 0]], 5: [voltimetro, [0, 0.82, 0]], 6: [foco, [0, 1.7, 0]] };
// Arrastrar una pieza la saca de su lugar; al soltarla regresa sola.
const desplazamiento = n => ANCLA_DESARME[n][0].position.clone().sub(ANCLA_DESARME[n][0].userData.base);
const arrastre = Object.fromEntries(PARTES.map(p => [p.n, new THREE.Vector3()]));
const piezaDe = objeto => { for (let o = objeto; o; o = o.parent) if (o.userData.parte) return o.userData.parte; return 0; };

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
let bajada = 0;
let desarme = 0; // lo que pide el deslizador, de 0 (armado) a 1 (desarmado)
let desarmeVis = 0; // lo que se ve, con su transición
let vista = 'general';
let agujaV = 0; // lo que marca la aguja, con su inercia

const elegirLento = id => {
    lento = LENTO.find(l => l.id === id) || LENTO[0];
    app.querySelectorAll('[data-lento]').forEach(b => {
        b.setAttribute('aria-checked', String(b.dataset.lento === lento.id));
        b.title = LENTO.find(l => l.id === b.dataset.lento).nota;
    });
};
const elegirVista = id => {
    vista = id;
    app.querySelectorAll('[data-vista]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.vista === id)));
};
elegirVista('general');
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
const deslizadores = [...app.querySelectorAll('input[data-rpm]')];
deslizadores.forEach(d => d.addEventListener('input', () => {
    tomarControl();
    rpmObjetivo = Number(d.value);
    deslizadores.forEach(o => { if (o !== d) o.value = d.value; });
}));
app.querySelectorAll('[data-lento]').forEach(b => b.addEventListener('click', () => { tomarControl(); elegirLento(b.dataset.lento); }));
const desarmadores = [...app.querySelectorAll('input[data-desarme]')];
const ponerDesarme = valor => {
    desarme = clamp(valor, 0, 1);
    desarmadores.forEach(d => { d.value = String(desarme); });
};
desarmadores.forEach(d => d.addEventListener('input', () => { tomarControl(); ponerDesarme(Number(d.value)); }));
app.querySelectorAll('[data-vista]').forEach(b => b.addEventListener('click', () => {
    tomarControl();
    const v = VISTAS.find(x => x.id === b.dataset.vista);
    elegirParte(0, { avisar: true });
    elegirVista(v.id);
    if (!corteManual) corte = v.corte ? 1 : 0;
    Object.assign(orbita, { az: 0, el: 0, k: 1 });
}));
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
// Pantalla completa: la del navegador cuando existe; si no (iPhone), la escena cubre la ventana y Aprende agranda el marco.
const btnPantalla = $('[data-pantalla]');
const NATIVA = Boolean((escena.requestFullscreen || escena.webkitRequestFullscreen) && (document.fullscreenEnabled || document.webkitFullscreenEnabled));
const enNativa = () => document.fullscreenElement || document.webkitFullscreenElement;
let completa = false;
let simulando = false;
function ponerCompleta(on, simulada = false) {
    // si la del navegador llega después del respaldo, Aprende devuelve el marco a su lugar
    if (simulando && !simulada && parent !== window) parent.postMessage({ type: 'concepto-fullscreen', id: FIGURA, on: false }, location.origin);
    simulando = on && simulada;
    completa = on;
    escena.classList.toggle('completa', on);
    escena.classList.toggle('simulada', on && simulada);
    document.documentElement.classList.toggle('g-bloqueo', on && simulada);
    const texto = on ? 'Salir de pantalla completa' : 'Pantalla completa';
    btnPantalla.setAttribute('aria-pressed', String(on));
    btnPantalla.setAttribute('aria-label', texto);
    btnPantalla.title = texto;
    btnPantalla.innerHTML = on ? ICONO_CERRAR : ICONO_ABRIR;
    if (simulada && parent !== window) parent.postMessage({ type: 'concepto-fullscreen', id: FIGURA, on }, location.origin);
    medir();
}
const simular = on => ponerCompleta(on, true);
btnPantalla.addEventListener('click', () => {
    if (!completa) {
        if (!NATIVA) { simular(true); return; }
        const pedir = escena.requestFullscreen ? escena.requestFullscreen() : escena.webkitRequestFullscreen();
        // si el navegador la niega o no contesta, la escena cubre la ventana de todos modos
        let contesto = false;
        pedir?.then?.(() => { contesto = true; }, () => { contesto = true; if (!enNativa()) simular(true); });
        setTimeout(() => { if (!contesto && !enNativa() && !completa) simular(true); }, 1200);
    } else if (enNativa()) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else simular(false);
});
for (const ev of ['fullscreenchange', 'webkitfullscreenchange']) document.addEventListener(ev, () => ponerCompleta(Boolean(enNativa())));
addEventListener('keydown', e => { if (e.key === 'Escape' && completa && !enNativa()) simular(false); });

window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.data?.type !== 'concepto-select-part') return;
    tomarControl();
    elegirParte(Number(event.data.n) || 0);
    Object.assign(orbita, { az: 0, el: 0, k: 1 });
});

// Girar con el dedo o el ratón; acercar con la rueda o con dos dedos.
const punteros = new Map();
let distanciaPinza = 0;
// Si el dedo cae sobre una pieza, la arrastra por un plano de frente a la cámara; si no, gira la vista.
const rayo = new THREE.Raycaster();
const puntero = new THREE.Vector2();
const planoArrastre = new THREE.Plane();
const tomada = { n: 0, desde: new THREE.Vector3(), inicio: new THREE.Vector3(), punto: new THREE.Vector3() };
const rayoDesde = e => {
    const r = lienzo.getBoundingClientRect();
    puntero.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    rayo.setFromCamera(puntero, camera);
};
lienzo.addEventListener('pointerdown', e => {
    tomarControl();
    punteros.set(e.pointerId, [e.clientX, e.clientY]);
    lienzo.setPointerCapture(e.pointerId);
    escena.classList.add('arrastra');
    if (punteros.size !== 1) { tomada.n = 0; return; }
    rayoDesde(e);
    const golpe = rayo.intersectObjects(raiz.children, true).find(g => g.object.visible && piezaDe(g.object));
    if (!golpe) return;
    tomada.n = piezaDe(golpe.object);
    planoArrastre.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()).negate(), golpe.point);
    tomada.desde.copy(golpe.point);
    tomada.inicio.copy(arrastre[tomada.n]);
    if (parte !== tomada.n) elegirParte(tomada.n, { avisar: true });
});
lienzo.addEventListener('pointermove', e => {
    if (!punteros.has(e.pointerId)) return;
    if (tomada.n && punteros.size === 1) {
        rayoDesde(e);
        if (rayo.ray.intersectPlane(planoArrastre, tomada.punto)) {
            arrastre[tomada.n].copy(tomada.inicio).add(tomada.punto.sub(tomada.desde)).clampLength(0, 2.2);
            arrastre[tomada.n].y = Math.max(arrastre[tomada.n].y, -0.2);
        }
        ultimoToque = T;
        return;
    }
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
const soltar = e => { punteros.delete(e.pointerId); distanciaPinza = 0; tomada.n = 0; if (!punteros.size) escena.classList.remove('arrastra'); };
lienzo.addEventListener('pointerup', soltar);
lienzo.addEventListener('pointercancel', soltar);
lienzo.addEventListener('wheel', e => { e.preventDefault(); tomarControl(); orbita.k = clamp(orbita.k * Math.exp(e.deltaY * 0.0012), 0.45, 2); }, { passive: false });

// ------------------------------------------------------------------ la curva
const curva = $('.g-curva canvas');
const cg = curva.getContext('2d');
const COLORES_FASE = [PALETA.acento, PALETA.tinta, PALETA.suave];
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
// cada cifra aparece en el tablero y en la barra de pantalla completa
const CIFRAS = {};
const cifra = k => { const nodos = CIFRAS[k] ??= [...app.querySelectorAll(`[data-c="${k}"]`)]; return { set textContent(t) { nodos.forEach(n => { n.textContent = t; }); } }; };
let alturaAvisada = 0;
const avisarAltura = () => {
    if (completa) return;
    const h = Math.ceil(document.documentElement.scrollHeight);
    if (Math.abs(h - alturaAvisada) < 2) return;
    alturaAvisada = h;
    parent.postMessage({ type: 'concepto-height', id: FIGURA, h }, location.origin);
};
function medir() {
    const w = escena.clientWidth;
    const h = escena.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, PIXELES_MAX));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 1.1 ? 42 : 30;
    camera.updateProjectionMatrix();
    guia.setAttribute('viewBox', `0 0 ${w} ${h}`);
    avisarAltura();
}
const vigia = new ResizeObserver(medir);
vigia.observe(document.body);
vigia.observe(escena);
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
        if (desarme) ponerDesarme(0);
        return;
    }
    rpmObjetivo = RPM_NOMINAL;
    // después de las partes, se desarma, se queda así un momento y se vuelve a armar
    const finPartes = 4 + PARTES.length * PASO;
    if (t < finPartes) {
        const paso = Math.floor((t - 4) / PASO);
        if (paso !== recorrido.paso) {
            recorrido.paso = paso;
            if (vista !== 'general') elegirVista('general');
            elegirParte(PARTES[paso].n);
        }
        return;
    }
    if (recorrido.paso !== 'desarme') { recorrido.paso = 'desarme'; elegirParte(0); }
    const u = t - finPartes;
    ponerDesarme(u < 1 ? 0 : u < 2.4 ? (u - 1) / 1.4 : u < 6 ? 1 : u < 7.4 ? 1 - (u - 6) / 1.4 : 0);
    if (u > 10) { ponerDesarme(0); Object.assign(recorrido, { t: 0, paso: -1 }); }
}

// ------------------------------------------------------------------ cada cuadro
const proyectado = new THREE.Vector3();
const nums = $('.g-nums');
const numEls = Object.fromEntries([...nums.children].map(el => [el.dataset.num, el]));
let antes = performance.now();
let visible = true;
let avisoListo = false;
document.addEventListener('visibilitychange', () => { visible = document.visibilityState === 'visible'; });
function cuadro(ahora) {
    requestAnimationFrame(cuadro);
    // un cuadro puede traer una marca de tiempo anterior al arranque (marco cargado en segundo plano): nunca negativo
    const dt = clamp((ahora - antes) / 1000, 0, 0.1);
    antes = ahora;
    if (!visible) return;
    T += dt;
    if (recorrido.activo) guionRecorrido(dt);
    else if (T - ultimoToque > 30 && !REDUCIR) { Object.assign(recorrido, { activo: true, t: 4, paso: -1 }); corteManual = false; pintarBotones(); }

    // desarmar: la máquina se separa con su transición; desarmada no gira (sin carcasa ni bobinas no hay generador)
    const kd = 1 - Math.exp(-dt / 0.35);
    desarmeVis += (desarme - desarmeVis) * kd;
    const e = desarmeVis < 0.0005 ? 0 : desarmeVis * desarmeVis * (3 - 2 * desarmeVis);
    for (const n of Object.keys(arrastre)) if (Number(n) !== tomada.n) arrastre[n].multiplyScalar(Math.exp(-dt / 0.28));
    for (const m of MOVIBLES) for (const o of m.objetos) {
        o.position.copy(o.userData.base).addScaledVector(new THREE.Vector3(...m.hacia), e).add(arrastre[m.parte]);
    }
    // si el imán o las bobinas se separan, el campo ya no las cruza: no hay voltaje
    const acople = 1 - clamp(Math.max(e * 8, arrastre[3].length() * 4, arrastre[4].length() * 4), 0, 1);
    const cableVisible = 1 - clamp(Math.max(e * 6, arrastre[4].length() * 3, arrastre[5].length() * 3, arrastre[6].length() * 3), 0, 1);
    M.cable.opacity = cableVisible;
    M.cable.visible = cableVisible > 0.02;

    const rpmMeta = rpmObjetivo * (1 - clamp(e * 10, 0, 1)) * (1 - clamp(arrastre[1].length() * 3, 0, 1));
    rpm += (rpmMeta - rpm) * (1 - Math.exp(-dt / 0.6));
    const omega = (rpm / 60) * Math.PI * 2; // rad/s reales
    const dtSim = dt * lento.k;
    const anguloAntes = angulo;
    angulo += omega * dtSim;
    const vPico = V_PICO_NOMINAL * (rpm / RPM_NOMINAL) * acople;
    const v = vPico * Math.sin(angulo);
    // promedio del voltaje durante este cuadro: a velocidad real caben muchos ciclos en un cuadro y el valor de un solo
    // instante saldría al azar (la aguja temblaría); el promedio exacto de un seno entre dos ángulos no tiene ese problema
    const giroCuadro = angulo - anguloAntes;
    const vCuadro = giroCuadro > 1e-4 ? vPico * (Math.cos(anguloAntes) - Math.cos(angulo)) / giroCuadro : v;
    // el filamento sigue a la potencia (v²) con su propio retraso, en el tiempo de la escena
    // (también promediada en el cuadro: el promedio de sen² entre dos ángulos)
    const sen2Cuadro = giroCuadro > 1e-4 ? 0.5 - (Math.sin(2 * angulo) - Math.sin(2 * anguloAntes)) / (4 * giroCuadro) : Math.sin(angulo) ** 2;
    const potencia = 2 * (vPico / V_PICO_NOMINAL) ** 2 * sen2Cuadro;
    brillo += (potencia - brillo) * (1 - Math.exp(-dtSim / TAU_FILAMENTO));

    // poses
    turbina.rotation.x = angulo;
    eje.rotation.x = angulo;
    rotor.rotation.x = angulo;
    // la aguja tiene inercia (≈ 0.08 s de pantalla): sigue el voltaje en cámara lenta y, a velocidad real, ya no tiembla
    agujaV += (vCuadro - agujaV) * (1 - Math.exp(-dt / 0.08));
    pivote.rotation.z = -clamp(agujaV / V_PICO_NOMINAL, -1.1, 1.1) * (Math.PI * 0.33) / 2;
    vidrio.material.emissiveIntensity = clamp(brillo, 0, 1.6) * 1.4;
    filamento.material.color.set(brillo > 0.08 ? '#ffd27a' : '#5a4a3a');
    luz.intensity = clamp(brillo, 0, 1.6) * 3;
    bobinas.forEach((b, i) => {
        const fuerza = Math.abs(Math.sin(angulo - BOBINAS[i])) * (rpm / RPM_NOMINAL);
        b.children.forEach(m => { if (m.material.emissive && parte !== 4) { m.material.emissive.set(PALETA.cobre); m.material.emissiveIntensity = i === 0 ? fuerza * 0.35 : fuerza * 0.12; } });
    });
    // corriente por los cables (las marcas + y − se colocan después de mover la cámara)
    const verCorriente = cableVisible * clamp(vPico / 20, 0, 1);

    // tornillos: siguen a la carcasa y al desarmar se separan de ella
    TORNILLOS.forEach((t, i) => {
        posTornillo.copy(t.base).addScaledVector(t.sale, e).add(carcasa.position).add(estator.position);
        mtx.makeTranslation(posTornillo.x, posTornillo.y, posTornillo.z);
        // con «Ver por dentro» la mitad de enfrente no está: sus tornillos tampoco (el corte deja z ≤ plano.constant)
        if (posTornillo.z > plano.constant + 0.01) mtx.scale(new THREE.Vector3(0, 0, 0));
        tornillos.setMatrixAt(i, mtx);
    });
    tornillos.instanceMatrix.needsUpdate = true;

    // el chorro: gotas de la boquilla a los álabes
    const velAgua = 0.4 + 1.6 * (rpm / RPM_NOMINAL);
    for (let i = 0; i < GOTAS; i++) {
        const fase = ((i / GOTAS) + T * velAgua * 0.6) % 1;
        const on = rpm > 30 && e < 0.02 && arrastre[1].length() < 0.05 ? 1 : 0;
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
    const vistaActual = VISTAS.find(x => x.id === vista) || VISTAS[0];
    // desarmada, la vista general se aleja y sube para que quepan las piezas; la de una pieza la sigue
    const meta = p ? { ...p.vista } : { ...vistaActual, d: vistaActual.d * (1 + (camera.aspect < 1.1 ? 0.12 : 0.35) * e), ty: vistaActual.ty + 0.4 * e };
    const corrida = p ? desplazamiento(p.n) : null;
    if (corrida) { meta.tx += corrida.x; meta.ty += corrida.y; meta.tz += corrida.z; }
    const giro = recorrido.activo && !p ? Math.sin(T * 0.15) * 8 : 0;
    const k = 1 - Math.exp(-dt / 0.45);
    cam.tx += (meta.tx - cam.tx) * k;
    cam.ty += (meta.ty - cam.ty) * k;
    cam.tz += (meta.tz - cam.tz) * k;
    cam.az += (meta.az + orbita.az + giro - cam.az) * k;
    cam.el += (clamp(meta.el + orbita.el, -10, 70) - cam.el) * k;
    // en vertical la máquina, que es ancha, necesita más distancia para caber
    const lejania = camera.aspect < 1.1 ? clamp(1.1 / camera.aspect, 1.25, 2.4) : 1;
    cam.d += (meta.d * orbita.k * lejania - cam.d) * k;
    // en pantalla completa las barras de abajo tapan; la cámara baja un poco y la máquina sube en el cuadro
    bajada += ((completa ? 0.05 * cam.d : 0) - bajada) * k;
    camera.position.set(cam.tx + cam.d * Math.cos(cam.el * D2R) * Math.sin(cam.az * D2R), cam.ty - bajada + cam.d * Math.sin(cam.el * D2R), cam.tz + cam.d * Math.cos(cam.el * D2R) * Math.cos(cam.az * D2R));
    camera.lookAt(cam.tx, cam.ty - bajada, cam.tz);
    renderer.render(scene, camera);
    // el primer cuadro dibujado: Aprende quita su aviso de «cargando»
    if (!avisoListo) { avisoListo = true; parent.postMessage({ type: 'concepto-listo', id: FIGURA }, location.origin); }
    // las marcas ± solo se leen si cambian despacio: a más de 2 ciclos por segundo en pantalla se ocultan
    const ciclosEnPantalla = (rpm / 60) * lento.k;
    corriente.actualizar({ avance: AVANCE, corriente: v / V_PICO_NOMINAL, dt: dtSim, visible: verCorriente, polos: 1 - clamp(ciclosEnPantalla - 2, 0, 1), camara: camera, w: escena.clientWidth, h: escena.clientHeight });

    // etiqueta con su guía hacia la pieza
    const w = escena.clientWidth;
    const h = escena.clientHeight;
    if (p) {
        proyectado.set(...p.ancla).add(corrida).project(camera);
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

    // números de cada pieza mientras está desarmada; ahí la pieza elegida se marca en su número, sin segunda etiqueta
    const verNums = clamp((e - 0.15) / 0.3, 0, 1);
    const unaEtiqueta = Boolean(p) && verNums < 0.5;
    etiqueta.style.visibility = unaEtiqueta || !p ? '' : 'hidden';
    guia.style.visibility = etiqueta.style.visibility;
    nums.style.opacity = String(verNums);
    nums.hidden = verNums === 0;
    if (verNums) {
        for (const [n, [obj, extra]] of Object.entries(ANCLA_DESARME)) {
            obj.getWorldPosition(proyectado).add(new THREE.Vector3(...extra)).project(camera);
            const el = numEls[n];
            el.style.transform = `translate(${(proyectado.x * 0.5 + 0.5) * w}px, ${(-proyectado.y * 0.5 + 0.5) * h}px) translate(-50%, -50%)`;
            el.classList.toggle('activo', Number(n) === parte);
        }
    }

    // cifras
    cifra('rpm').textContent = num(Math.round(rpm / 10) * 10);
    cifra('hz').textContent = `${num(rpm / 60, 1)} Hz`;
    cifra('v').textContent = `${num(V_EFICAZ_NOMINAL * rpm / RPM_NOMINAL * acople)} V`;
    cifra('vi').textContent = `${v >= 0 ? '+' : '−'}${num(Math.abs(v))} V`;
    if (recorrido.activo) deslizadores.forEach(d => { d.value = String(Math.round(rpmObjetivo / 60) * 60); });
    dibujarCurva(vPico);
    pintarBotones();
}
pintarBotones();
elegirParte(0);
requestAnimationFrame(cuadro);
addEventListener('load', avisarAltura);
