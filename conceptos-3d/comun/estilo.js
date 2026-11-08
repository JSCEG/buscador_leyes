// Estilo común de las máquinas de «¿Cómo funciona?», tomado de la referencia del mosquito mecánico y pasado a Búho:
// cerámica blanca brillante en las carcasas, grafito en lo mecánico, bordes y tapas en guinda, contorno fino de tinta en
// lo blanco, y la corriente eléctrica en amarillo con sus polos: + en guinda y − en grafito (la convención de
// los cables rojo y negro). Cada máquina importa de aquí para que todas se vean iguales.

import { MeshStandardMaterial, MeshPhysicalMaterial, LineBasicMaterial, LineSegments, EdgesGeometry, Mesh, TorusGeometry, WebGLRenderer, SRGBColorSpace, NeutralToneMapping, PCFSoftShadowMap, Scene, PerspectiveCamera, HemisphereLight, DirectionalLight, PlaneGeometry, ShadowMaterial } from 'three';

// three se importa por nombre (no se pasa el módulo entero) para que el empaquetador quite lo que no se usa.
// en un celular (pantalla táctil o angosta) todo se dibuja más ligero: sombras a la mitad y menos píxeles
export const MOVIL = typeof matchMedia === 'function' && (matchMedia('(pointer: coarse)').matches || innerWidth < 700);
export const PIXELES_MAX = MOVIL ? 1.5 : 2;

export const tema = () => (document.documentElement.dataset.tema === 'oscuro' ? 'oscuro' : 'claro');

export function paleta(t = tema()) {
    return t === 'oscuro'
        ? {
            fondo: '#080a19', tinta: '#f1efea', suave: '#a4a7ae', acento: '#e57a9a',
            ceramica: '#e6e4df', grafito: '#3a3c44', acero: '#c2c6cd', cobre: '#c98a5a', agua: '#7cc4e6', caratula: '#13151f',
            corriente: '#ffd23f', positivo: '#e57a9a', negativo: '#c9ccd3',
            norte: '#e57a9a', sur: '#c9ccd3', piso: 0.35, contorno: 0.25,
        }
        : {
            fondo: '#fafafa', tinta: '#0a0707', suave: '#5b5e63', acento: '#9b2247',
            ceramica: '#f7f5f1', grafito: '#2b2c31', acero: '#a9aeb6', cobre: '#b8703f', agua: '#4b9cc4', caratula: '#ffffff',
            corriente: '#d99700', positivo: '#9b2247', negativo: '#2b2c31',
            norte: '#9b2247', sur: '#2b2c31', piso: 0.14, contorno: 0.32,
        };
}

// Materiales de siempre. Rugosidad de al menos 0.45 en lo grande para que el brillo no se vuelva una raya blanca.
export function materiales(P) {
    const mat = (color, extra = {}) => new MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.15, ...extra });
    const M = {
        mat,
        ceramica: new MeshPhysicalMaterial({ color: P.ceramica, roughness: 0.45, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.18 }),
        grafito: mat(P.grafito, { roughness: 0.45, metalness: 0.55 }),
        borde: mat(P.acento, { roughness: 0.45, metalness: 0.1 }),
        acero: mat(P.acero, { roughness: 0.45, metalness: 0.7 }),
        cobre: mat(P.cobre, { roughness: 0.38, metalness: 0.75 }),
        agua: mat(P.agua, { roughness: 0.2, metalness: 0, transparent: true, opacity: 0.7 }), // el amarillo es solo para la corriente; el agua va en azul
        contorno: new LineBasicMaterial({ color: P.tinta, transparent: true, opacity: P.contorno }),
    };
    M.cable = M.grafito.clone();
    M.cable.transparent = true;
    return M;
}

// Ayudas para armar piezas con ese estilo.
export function ayudantes(M) {
    const sombra = mesh => { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; };
    // contorno fino de tinta en las aristas (las piezas casi blancas no se pierden en el papel)
    const contorno = (mesh, angulo = 35, material = M.contorno) => { mesh.add(new LineSegments(new EdgesGeometry(mesh.geometry, angulo), material)); return mesh; };
    // aro guinda alrededor del eje x, para tapas y bordes
    const aro = (radio, grueso, x = 0) => { const a = new Mesh(new TorusGeometry(radio, grueso, 12, 64).rotateY(Math.PI / 2), M.borde); a.position.x = x; a.castShadow = true; return a; };
    return { sombra, contorno, aro };
}

// Estudio: fondo transparente (el papel con trazos lo pone el CSS), luz suave y un piso que solo recibe sombra.
export function estudio(lienzo, P, t = tema()) {
    const renderer = new WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = NeutralToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    const scene = new Scene();
    const camera = new PerspectiveCamera(30, 16 / 10, 0.05, 80);
    scene.add(new HemisphereLight('#ffffff', t === 'oscuro' ? '#20232f' : '#cfd1d4', t === 'oscuro' ? 1.1 : 1.35));
    const sol = new DirectionalLight('#ffffff', t === 'oscuro' ? 2.0 : 2.4);
    sol.position.set(-3, 7, 5);
    sol.castShadow = true;
    Object.assign(sol.shadow.camera, { left: -5, right: 5, top: 4, bottom: -3, near: 1, far: 20 });
    sol.shadow.mapSize.set(MOVIL ? 1024 : 2048, MOVIL ? 1024 : 2048);
    sol.shadow.radius = 4;
    sol.shadow.bias = -0.0006;
    scene.add(sol);
    const relleno = new DirectionalLight('#ffffff', 0.6);
    relleno.position.set(5, 3, -4);
    scene.add(relleno);
    const piso = new Mesh(new PlaneGeometry(40, 40), new ShadowMaterial({ color: '#000000', opacity: P.piso }));
    piso.rotation.x = -Math.PI / 2;
    piso.receiveShadow = true;
    scene.add(piso);
    return { renderer, scene, camera, sol };
}
