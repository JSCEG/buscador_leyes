// La entrada del Buscador Jurídico: un búho mecánico en 3D. Abre las alas, se desarma y en lugar de solo engranes
// muestra las secciones del sitio; luego se vuelve a armar y mira de frente, y el sitio abre su iris desde un ojo.
// render(t) es una función pura del tiempo: todo sale de estado(t) en modelo.js.
//
// Se arma con la skill teardown y se graba con: node scripts/render-intro-3d.mjs
// Idea de formato (desarmar una máquina en 3D con consola en vivo): @elvar_official, https://x.com/elvar_official/status/2116192984299344372
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { runSim } from 'teardown-kit/runtime.js';
import manrope from '../public/fonts/Manrope-Variable.woff2';
import fraunces from '../public/fonts/Fraunces-Variable.woff2';
import { DURACION, FPS, FORMATOS, SECCIONES, MODULO, ENGRANE, OJO, estado, pose, posicionCamara, revisar } from './modelo.js';
import { materiales, construirBuho, construirModulo } from './buho.js';

// Papel Búho claro (src/styles/design/variables.css y conceptos-3d/comun/estilo.js): papel, tinta, guinda de acento y el
// rosa de los ojos. El búho es marfil sobre mecanismo grafito y acero, como la ilustración de referencia; los módulos
// llevan canto guinda y un contorno fino de tinta para no perderse en el papel.
const P = {
    fondo: '#faf8f5', tinta: '#171317', suave: '#5b5e63', rosa: '#e57a9a', guinda: '#9b2247',
    ceramica: '#f4f1ec', marfil: '#eee7dc', grafito: '#303137', acero: '#a7abb3',
};
const clamp01 = x => Math.min(1, Math.max(0, x));

runSim({ duration: DURACION, fps: FPS, theme: 'light', hud: { enabled: false }, director: { enabled: false } }, async ({ canvas }) => {
    const problemas = revisar();
    if (problemas.length) console.error('modelo:', problemas.join(' · '));

    for (const [familia, b64, peso] of [['Manrope', manrope, '200 800'], ['Fraunces', fraunces, '100 900']]) {
        const cara = new FontFace(familia, `url(data:font/woff2;base64,${b64})`, { weight: peso });
        document.fonts.add(await cara.load());
    }

    // ------------------------------------------------------------ capa de texto
    const app = document.getElementById('app');
    const capa = document.createElement('div');
    capa.className = 'capa';
    capa.innerHTML = `<svg class="guias">${SECCIONES.map(() => '<line/>').join('')}</svg>${SECCIONES.map(s => `<span class="etq">${s}</span>`).join('')}
        <div class="titulo"><p class="nombre">Buscador Jurídico</p><span class="raya"></span><p class="sub">Leyes y reglas de energía de México</p></div>`;
    app.append(capa);
    const etiquetas = [...capa.querySelectorAll('.etq')];
    const guias = [...capa.querySelectorAll('.guias line')];
    const titulo = capa.querySelector('.titulo');

    // ------------------------------------------------------------ escena
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 0.9; // conserva el bisel del marfil contra el papel
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    const camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.05, 120);

    const cielo = new THREE.HemisphereLight('#ffffff', '#b9b6b0', 0.9);
    const sol = new THREE.DirectionalLight('#ffffff', 2.4);
    sol.position.set(-6, 5, 3.5);
    sol.castShadow = true;
    Object.assign(sol.shadow.camera, { left: -3.5, right: 3.5, top: 3, bottom: -3, near: 1, far: 20 });
    sol.shadow.mapSize.set(2048, 2048);
    sol.shadow.radius = 4;
    sol.shadow.bias = -0.0004;
    sol.shadow.normalBias = 0.01;
    const contraluz = new THREE.DirectionalLight('#ffffff', 1.0);
    contraluz.position.set(2, 3, -5);
    const relleno = new THREE.DirectionalLight('#ffffff', 0.85);
    relleno.position.set(4, 0, 6);
    const brillo = new THREE.PointLight(P.rosa, 0.25, 1.4, 2);
    brillo.position.set(OJO[0], OJO[1], OJO[2] + 0.35);
    scene.add(cielo, sol, contraluz, relleno, brillo);

    // halo rosa muy suave detrás del búho
    const halo = (color, alfa) => {
        const c = document.createElement('canvas');
        c.width = c.height = 256;
        const x = c.getContext('2d');
        const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
        g.addColorStop(0, `rgba(${color},${alfa})`);
        g.addColorStop(0.45, `rgba(${color},${alfa * 0.35})`);
        g.addColorStop(1, `rgba(${color},0)`);
        x.fillStyle = g;
        x.fillRect(0, 0, 256, 256);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        return new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
    };
    const aura = halo('229,122,154', 0.1);
    aura.position.set(0, 0.25, -1.5);
    scene.add(aura);

    // Sombra suave en un piso invisible, como en las referencias: un óvalo difuso bajo el búho.
    const sombraPiso = (() => {
        const c = document.createElement('canvas');
        c.width = c.height = 256;
        const x = c.getContext('2d');
        const g = x.createRadialGradient(128, 128, 6, 128, 128, 128);
        g.addColorStop(0, 'rgba(40,30,34,0.34)');
        g.addColorStop(0.5, 'rgba(40,30,34,0.12)');
        g.addColorStop(1, 'rgba(40,30,34,0)');
        x.fillStyle = g;
        x.fillRect(0, 0, 256, 256);
        const tex = new THREE.CanvasTexture(c);
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
        m.scale.set(7.5, 1, 2.2);
        m.position.y = -2.45;
        return m;
    })();
    scene.add(sombraPiso);

    const M = materiales(P);
    const raiz = new THREE.Group();
    scene.add(raiz);
    const buho = construirBuho(M, P);
    raiz.add(buho.raiz);

    const modulos = await Promise.all(SECCIONES.map(s => construirModulo(M, P, s)));
    modulos.forEach(m => raiz.add(m.grupo));
    const COLOR = { cara: new THREE.Color(P.ceramica), acento: new THREE.Color(P.guinda), icono: new THREE.Color(P.grafito), blanco: new THREE.Color('#ffffff') };
    const NUCLEO = new THREE.Vector3(...ENGRANE.centro);

    const v = new THREE.Vector3();
    const w = new THREE.Vector3();

    function resize() {
        renderer.setPixelRatio(devicePixelRatio);
        renderer.setSize(innerWidth, innerHeight, false);
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
    }

    function pantalla(p) {
        v.copy(p).project(camera);
        return [(v.x * 0.5 + 0.5) * innerWidth, (-v.y * 0.5 + 0.5) * innerHeight];
    }

    function render(t) {
        return dibujar(estado(t, innerWidth / innerHeight));
    }

    function dibujar(e) {
        const F = FORMATOS[e.formato];

        // luz
        const l = e.luz;
        // La activación levanta la luz sin borrar los bordes de la cerámica.
        const k = 0.55 + 0.45 * l;
        sol.intensity = 1.85 * k;
        contraluz.intensity = 0.9 * k;
        relleno.intensity = 0.55 * k;
        cielo.intensity = 0.65 * k;
        scene.environmentIntensity = 0.62 * k;
        aura.material.opacity = 0.25 * l;
        aura.scale.setScalar(e.formato === 'vertical' ? 6.5 : 7.5);
        // los ojos brillan (el iris es un material sin luz: su color es su brillo)
        M.iris.color.setScalar(0.55 + 0.45 * Math.min(1.3, e.ojo));
        brillo.intensity = 0.25 * e.ojo;

        buho.posar(e);
        raiz.updateMatrixWorld(true);

        // módulos
        e.modulos.forEach((m, i) => {
            const mod = modulos[i];
            const g = mod.grupo;
            g.visible = m.f > 0.002;
            const d = new THREE.Vector3(...m.destino);
            g.position.copy(NUCLEO).lerp(d, m.f);
            g.position.z += Math.sin(Math.PI * m.f) * 0.9 + 0.22 * m.acento;
            g.rotation.set(0, (1 - m.f) * Math.PI * 0.9, (1 - m.f) * (i - 3) * 0.25);
            g.scale.setScalar((0.15 + 0.85 * m.f) * (1 + 0.14 * m.acento));
            mod.cara.color.copy(COLOR.cara).lerp(COLOR.acento, m.acento);
            mod.icono.material.color.copy(COLOR.icono).lerp(COLOR.blanco, m.acento);
        });

        // cámara
        const c = e.camara;
        camera.position.set(...posicionCamara(c));
        camera.fov = c.fov;
        camera.updateProjectionMatrix();
        camera.lookAt(...c.mira);
        camera.updateMatrixWorld();

        renderer.render(scene, camera);

        // etiquetas, del mismo estado
        e.modulos.forEach((m, i) => {
            const g = modulos[i].grupo;
            const el = etiquetas[i];
            const medio = (MODULO / 2) * g.scale.x + 0.1;
            const punto = F.etiqueta === 'abajo' ? g.position.clone().add(w.set(0, -medio, 0)) : g.position.clone().add(w.set(medio, 0, 0));
            const [x, y] = pantalla(punto);
            el.style.opacity = m.etiqueta.toFixed(3);
            el.style.transform = F.etiqueta === 'abajo' ? `translate(${x}px, ${y}px) translate(-50%, 0)` : `translate(${x}px, ${y}px) translate(0, -50%)`;
            el.style.color = `color-mix(in srgb, ${P.guinda} ${Math.round(m.acento * 100)}%, ${P.tinta})`;
        });
        // guías finas del engrane del pecho a cada módulo: las secciones salen de adentro del búho
        const [nx, ny] = pantalla(buho.engrane.getWorldPosition(new THREE.Vector3()));
        e.modulos.forEach((m, i) => {
            const g = modulos[i].grupo;
            const [mx, my] = pantalla(g.position.clone().add(w.set(0, (MODULO / 2) * g.scale.x, 0)));
            const l = guias[i];
            l.setAttribute('x1', nx.toFixed(1)); l.setAttribute('y1', ny.toFixed(1));
            l.setAttribute('x2', mx.toFixed(1)); l.setAttribute('y2', my.toFixed(1));
            l.style.opacity = (Math.min(e.abierto, m.etiqueta) * (0.35 + 0.65 * m.acento)).toFixed(3);
        });
        const tx = innerWidth / 2;
        const ty = innerHeight * F.titulo;
        titulo.style.opacity = e.titulo.toFixed(3);
        titulo.style.transform = `translate(${tx}px, ${ty + (1 - e.titulo) * 14}px) translate(-50%, 0)`;
        return {};
    }

    resize();
    // Revisión de fidelidad: el búho en cualquier pose y cámara (scripts/render-intro-3d.mjs fidelidad).
    window.__POSE = p => { dibujar(pose({ ...p, aspecto: innerWidth / innerHeight })); return true; };
    // Revisión de color del pico.
    window.__PICO = color => { M.picoMetal.color.set(color); return true; };
    // el ojo de verdad (el iris izquierdo en pantalla), con la cara ya girada y la cabeza agrandada
    window.__OJO = () => { const [x, y] = pantalla(buho.lentes[0].getWorldPosition(new THREE.Vector3())); return [x / innerWidth, y / innerHeight]; };
    return { render, resize };
});
