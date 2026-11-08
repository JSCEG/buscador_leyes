// La escena que comparten la toma y la página viva: render, ambiente, luces, piso y aros de luz.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { PISO, CUELLO, CABEZA, OJOS } from './modelo.js';

export function crearEscena(canvas, { movil = false, conservar = false } = {}) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: conservar });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.transmissionResolutionScale = 0.6;
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    const camera = new THREE.PerspectiveCamera(26, 1, 0.05, 160);

    const cielo = new THREE.HemisphereLight('#ffffff', '#b9b6b0', 0.6);
    const sol = new THREE.DirectionalLight('#fff6ea', 1.9);
    sol.position.set(-5, 6, 5);
    sol.castShadow = true;
    Object.assign(sol.shadow.camera, { left: -4.6, right: 4.6, top: 3.6, bottom: -3.6, near: 1, far: 22 });
    sol.shadow.mapSize.set(movil ? 1024 : 2048, movil ? 1024 : 2048);
    sol.shadow.bias = -0.0004;
    sol.shadow.normalBias = 0.012;
    const contra = new THREE.DirectionalLight('#ffffff', 0.9);
    contra.position.set(3, 3, -5);
    const relleno = new THREE.DirectionalLight('#ffffff', 0.5);
    relleno.position.set(4, -1, 6);
    // la luz del núcleo y de los ojos cae sobre las placas
    const luzPecho = new THREE.PointLight('#ff9a3a', 0.6, 2.4, 2);
    luzPecho.position.set(0, 0.05, 1.05);
    const luzOjos = new THREE.PointLight('#ff9a3a', 0.28, 1.5, 2);
    luzOjos.position.set(0, CUELLO[1] + OJOS[0][1], CUELLO[2] + CABEZA.rzF + 0.32);
    const luzPiso = new THREE.PointLight('#ff9a3a', 0, 4.5, 2);
    luzPiso.position.set(0, PISO + 0.55, 0.3);
    scene.add(cielo, sol, contra, relleno, luzPecho, luzOjos, luzPiso);

    const radial = paradas => {
        const c = document.createElement('canvas');
        c.width = c.height = 256;
        const x = c.getContext('2d');
        const g = x.createRadialGradient(128, 128, 4, 128, 128, 128);
        paradas.forEach(([k, v]) => g.addColorStop(k, v));
        x.fillStyle = g;
        x.fillRect(0, 0, 256, 256);
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
    };
    // sombra suave y, de noche, un charco de luz en el piso
    const sombraPiso = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({
        map: radial([[0, 'rgba(30,20,24,0.42)'], [0.55, 'rgba(30,20,24,0.16)'], [1, 'rgba(30,20,24,0)']]), transparent: true, depthWrite: false, toneMapped: false,
    }));
    sombraPiso.scale.set(5.6, 1, 3.6);
    sombraPiso.position.y = PISO - 0.002;
    const charco = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({
        map: radial([[0, 'rgba(255,255,255,0.5)'], [0.4, 'rgba(255,255,255,0.14)'], [1, 'rgba(255,255,255,0)']]), color: '#ffae47', transparent: true, opacity: 0, depthWrite: false, toneMapped: false,
    }));
    charco.scale.set(7, 1, 5);
    charco.position.y = PISO - 0.001;
    // aros de luz en el piso cuando alza el vuelo
    const aros = new THREE.Group();
    aros.position.y = PISO + 0.002;
    const matAro = new THREE.MeshBasicMaterial({ color: '#ffae47', transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
    for (const [r, g] of [[2.05, 0.014], [2.5, 0.009], [2.95, 0.016], [3.35, 0.006]]) aros.add(new THREE.Mesh(new THREE.RingGeometry(r, r + g, 96).rotateX(-Math.PI / 2), matAro));
    scene.add(sombraPiso, charco, aros);

    function iluminar(e, colorLuz) {
        const n = e.noche;
        const k = (1 - 0.46 * n);
        sol.intensity = 1.9 * k;
        contra.intensity = 0.9 * (1 - 0.3 * n);
        relleno.intensity = 0.5 * k;
        cielo.intensity = 0.6 * (1 - 0.5 * n);
        scene.environmentIntensity = 0.72 * (1 - 0.5 * n);
        luzPecho.color.copy(colorLuz);
        luzOjos.color.copy(colorLuz);
        luzPiso.color.copy(colorLuz);
        luzPecho.intensity = (0.55 + 2.2 * n) * e.luz * e.latido;
        luzOjos.intensity = (0.22 + 0.9 * n) * e.luz;
        luzPiso.intensity = 5 * n * e.luz;
        sombraPiso.material.opacity = 1 - 0.5 * n;
        charco.material.color.copy(colorLuz);
        charco.material.opacity = (0.08 + 0.72 * n) * e.luz;
        matAro.color.copy(colorLuz);
        const sube = Math.min(1, Math.max(0, (e.alas - 0.15) / 0.7));
        matAro.opacity = sube * (0.75 + 0.2 * n);
        aros.rotation.y = e.t * 0.05;
    }
    return { renderer, scene, camera, iluminar, luces: { sol, cielo } };
}
