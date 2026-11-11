// La central fotovoltaica, hecha con código. Sistema Búho: una franja de desierto cortada de frente con filas de módulos sobre seguidores, un
// módulo y una celda de muestra, cajas de conexión, inversor, transformador, SAEE, subestación y salida a la red. El sol es real: se mueve con la
// hora y el mes, y de él salen la luz, las sombras y el giro de las filas. Las cubiertas se vuelven vidrio (adentro = 1) y cada equipo se separa en
// sus piezas (desarme = 1).
//
//   materiales(P)     escenario(renderer, scene, M, { movil, oscuro })
//   construir(M, P, { movil, oscuro }) → { raiz, posar(e), partes, anclas, giran, repintar }
import * as THREE from 'three';
import { azar, clamp01, fract, lerp, sale } from '../planta-comun/ayudas.js';
import { aro, caja, cil, cilX, cilZ, crearAyudante, crearTubos, en, entre, estudio, geoTorre, materialesBase, sombra } from '../planta-comun/piezas.js';
import { BLOQUE, CELDA, CENTRO_SOL, EQUIPOS, FILAS, FLUIDOS, GIRO_MAX, LINEAS, MUESTRA, PARTES, RADIO_SOL, TORRES, ZANJA_Z, solEn } from './modelo.js';

const PI = Math.PI;
const D2R = PI / 180;
export const P_PLANTA = {
    papel: '#fafafa', noche: '#0a0e12', tinta: '#171317', marfil: '#f3f1ec', grafito: '#303137', acero: '#a7abb3', guinda: '#9b2247', rosa: '#e57a9a',
    tierraDia: '#d6cfc0', tierraNoche: '#23272c', losaDia: '#dcdcda', losaNoche: '#2c3036', suelo: '#c2ad8a',
};

/** Un módulo visto de frente: 24 × 6 medias celdas azul oscuro, con sus hilos de plata. */
function texturaModulo() {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    const x = c.getContext('2d');
    x.fillStyle = '#c9ced6';
    x.fillRect(0, 0, 1024, 512);
    const m = 8;
    const [cw, ch] = [(1024 - 2 * m) / 24, (512 - 2 * m) / 6];
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 6; j++) {
            const px = m + i * cw + (i >= 12 ? 3 : 0) - (i < 12 ? 0 : 3);
            const py = m + j * ch;
            const g = x.createLinearGradient(px, py, px + cw, py + ch);
            g.addColorStop(0, '#102b5c');
            g.addColorStop(1, '#0b1f47');
            x.fillStyle = g;
            x.fillRect(px + 1.2, py + 1.2, cw - 2.4, ch - 2.4);
            x.fillStyle = 'rgba(215,226,245,0.5)';
            for (let b = 1; b <= 3; b++) x.fillRect(px + 1.2, py + (b * ch) / 4 - 0.6, cw - 2.4, 1.2);
        }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
}

export function materiales(P) {
    const M = materialesBase(P, FLUIDOS);
    const env = { envMapIntensity: 0.8 };
    Object.assign(M, {
        panel: new THREE.MeshPhysicalMaterial({ color: '#a9b8d6', map: texturaModulo(), roughness: 0.32, metalness: 0.05, clearcoat: 0.55, clearcoatRoughness: 0.18, envMapIntensity: 0.42, transparent: true }),
        marco: new THREE.MeshStandardMaterial({ color: '#c6cad0', roughness: 0.36, metalness: 0.85, envMapIntensity: 1 }),
        polvoCapa: new THREE.MeshBasicMaterial({ color: '#c8a877', transparent: true, opacity: 0, depthWrite: false }),
        capaP: new THREE.MeshPhysicalMaterial({ color: '#6d7b92', roughness: 0.5, metalness: 0.2, clearcoat: 0.2, ...env }),
        capaN: new THREE.MeshPhysicalMaterial({ color: '#1e3f86', roughness: 0.24, metalness: 0.2, clearcoat: 1, ...env }),
        plata: new THREE.MeshStandardMaterial({ color: '#e4e7ec', roughness: 0.3, metalness: 0.95, envMapIntensity: 1 }),
        eva: new THREE.MeshPhysicalMaterial({ color: '#eef5f3', roughness: 0.4, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide }),
        vidrioMuestra: new THREE.MeshPhysicalMaterial({ color: '#dff2ff', roughness: 0.08, transparent: true, opacity: 0.05, clearcoat: 1, clearcoatRoughness: 0.05, depthWrite: false }),
        union: new THREE.MeshStandardMaterial({ color: '#3a2a55', roughness: 0.6, emissive: '#6a2a7a', emissiveIntensity: 0.25 }),
        solBola: new THREE.MeshBasicMaterial({ color: '#ffc61a', toneMapped: false }),
        marcaHora: new THREE.MeshBasicMaterial({ color: '#b78f1e', toneMapped: false, transparent: true, opacity: 0.75 }),
        nube: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, transparent: true, opacity: 0.9, envMapIntensity: 0.4 }),
        foco: new THREE.MeshBasicMaterial({ color: '#ffb000', toneMapped: false }),
        grava: new THREE.MeshStandardMaterial({ color: '#b9b6ad', roughness: 1, envMapIntensity: 0.25 }),
        led: [0, 1, 2, 3, 4].map(() => new THREE.MeshBasicMaterial({ color: FLUIDOS.sae.color, toneMapped: false })),
        alerta: new THREE.MeshBasicMaterial({ color: '#ff2b3a', toneMapped: false }),
        ventilador: new THREE.MeshStandardMaterial({ color: '#4d5057', roughness: 0.5, metalness: 0.6, side: THREE.DoubleSide }),
    });
    return M;
}

const Y0 = BLOQUE.y[0];
export function escenario(renderer, scene, M, { movil = false, oscuro = false } = {}) {
    const P = M.P;
    const dia = { tierra: new THREE.Color(oscuro ? '#9d978a' : P.tierraDia), losa: new THREE.Color(oscuro ? '#9a9b9a' : P.losaDia), concreto: new THREE.Color(oscuro ? '#a5a39c' : '#cfccc5'), grava: new THREE.Color(oscuro ? '#8f8d86' : '#b9b6ad'), suelo: new THREE.Color(P.suelo) };
    const noche = { tierra: new THREE.Color(P.tierraNoche), losa: new THREE.Color(P.losaNoche), concreto: new THREE.Color('#383c42'), grava: new THREE.Color('#2e3136'), suelo: new THREE.Color('#2d2b28') };
    if (oscuro) M.torre.color.set('#8f929a');
    let luzSol = null;
    const est = estudio(renderer, scene, {
        movil, oscuro, y0: Y0, alcance: 15,
        alActualizar(n, e) {
            M.tierra.color.copy(dia.tierra).lerp(noche.tierra, n);
            M.losa.color.copy(dia.losa).lerp(noche.losa, n);
            M.concreto.color.copy(dia.concreto).lerp(noche.concreto, n);
            M.grava.color.copy(dia.grava).lerp(noche.grava, n);
            M.suelo.color.copy(dia.suelo).lerp(noche.suelo, n * 0.8);
            // la luz y las sombras vienen del sol del modelo, con su hora y su mes
            luzSol ??= scene.children.find(c => c.isDirectionalLight);
            const s = e.solDir;
            if (luzSol && s && s.y > 0.01) {
                luzSol.position.set(s.x * 24, s.y * 24, s.z * 24);
                luzSol.intensity *= (0.4 + 0.6 * clamp01(s.y * 2.4)) * (1 - 0.45 * (e.tapa ?? 0));
            }
        },
    });
    return est;
}

export function construir(M, P, { movil = false, oscuro = false } = {}) {
    const raiz = new THREE.Group();
    const ids = PARTES.map(p => p.id);
    const kit = crearAyudante(M, raiz, ids, { movil });
    const { partes, giran, unidad, mover, brillo, luz, cub, gota, rotular } = kit;
    const colorTexto = oscuro ? '#f2efe8' : P.tinta;
    const aroZ = (r, t, m) => new THREE.Mesh(new THREE.TorusGeometry(r, t, 8, 30), m);

    // --------- el terreno
    const [X0, X1] = BLOQUE.x;
    const [Z0, Z1] = BLOQUE.z;
    {
        const terreno = new THREE.Group();
        raiz.add(terreno);
        // el terreno entero da una sola sombra en el papel: sin esto, las de las piezas lo atraviesan y caen sueltas. Es invisible.
        const molde = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0 - 0.04, -Y0 - 0.04, Z1 - Z0 - 0.04), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
        molde.position.set((X0 + X1) / 2, Y0 / 2, (Z0 + Z1) / 2);
        molde.castShadow = true;
        terreno.add(molde);
        const bloque = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0, -Y0, Z1 - Z0), [M.suelo, M.suelo, M.tierra, M.suelo, M.suelo, M.suelo]);
        bloque.position.set((X0 + X1) / 2, Y0 / 2, (Z0 + Z1) / 2);
        bloque.receiveShadow = true;
        terreno.add(bloque);
        const losa = (x0, x1, z0, z1, m = M.losa, h = 0.022) => {
            const l = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, h, z1 - z0), m);
            l.position.set((x0 + x1) / 2, h / 2, (z0 + z1) / 2);
            l.receiveShadow = true;
            terreno.add(l);
        };
        // la zanja de los cables, los cimientos y los caminos
        losa(-7, 2.1, 1.48, ZANJA_Z + 0.12, M.concreto);
        losa(1.72, 2.2, -0.35, 1.5, M.concreto);
        losa(3.92, 7.42, -3.9, -0.68, M.grava);
        losa(3.85, 6.15, 0.45, 2.55, M.grava);
        losa(2.05, 3.55, -0.92, 1.22, M.concreto);
        losa(1.5, 1.72, -3.9, 1.48);
        losa(3.6, 3.85, -3.9, 2.55);
    }

    // --------- las filas de módulos: lo que gira va en su propio grupo
    const [zA, zB] = FILAS.z;
    const largoFila = zB - zA;
    const zCentro = (zA + zB) / 2;
    const paso = largoFila / FILAS.modulos;
    const [wM, dM] = [FILAS.ancho, paso * 0.95];
    const geoTop = new THREE.PlaneGeometry(wM, dM).rotateX(-PI / 2).translate(0, 0.0072, 0);
    const geoCuerpo = new THREE.BoxGeometry(wM + 0.008, 0.012, dM + 0.004);
    const geoPolvo = new THREE.PlaneGeometry(wM, dM).rotateX(-PI / 2).translate(0, 0.0085, 0);
    const tmpM = new THREE.Matrix4();
    const tmpQ = new THREE.Quaternion();
    const tmpV = new THREE.Vector3();
    const tmpS = new THREE.Vector3(1, 1, 1);
    const ejeX = new THREE.Vector3(1, 0, 0);
    const filas = FILAS.x.map(x => {
        const u = unidad('cadena', x, 0);
        const g = new THREE.Group();
        g.position.set(0, FILAS.y, zCentro);
        u.add(mover(g, [0, 0.9, 0]));
        const tubo = cilZ(0.018, largoFila + 0.06, M.acero, 10);
        g.add(tubo);
        const n = FILAS.modulos;
        const tops = new THREE.InstancedMesh(geoTop, M.panel, n);
        const cuerpos = new THREE.InstancedMesh(geoCuerpo, M.marco, n);
        const polvos = new THREE.InstancedMesh(geoPolvo, M.polvoCapa, n);
        cuerpos.castShadow = true;
        tops.receiveShadow = true;
        cuerpos.receiveShadow = true;
        polvos.renderOrder = 1;
        g.add(tops, cuerpos, polvos);
        return { g, tops, cuerpos, polvos, tubo };
    });
    let fijaAntes = -1;
    let incliAntes = -1;
    const acomodarModulos = (f, inclinacion) => {
        if (Math.abs(f - fijaAntes) < 0.002 && Math.abs(inclinacion - incliAntes) < 0.05) return;
        fijaAntes = f;
        incliAntes = inclinacion;
        tmpQ.setFromAxisAngle(ejeX, inclinacion * D2R * f);
        for (const fila of filas) {
            for (let i = 0; i < FILAS.modulos; i++) {
                tmpV.set(0, 0.03, -largoFila / 2 + paso * (i + 0.5));
                tmpM.compose(tmpV, tmpQ, tmpS);
                fila.tops.setMatrixAt(i, tmpM);
                fila.cuerpos.setMatrixAt(i, tmpM);
                fila.polvos.setMatrixAt(i, tmpM);
            }
            fila.tops.instanceMatrix.needsUpdate = true;
            fila.cuerpos.instanceMatrix.needsUpdate = true;
            fila.polvos.instanceMatrix.needsUpdate = true;
        }
    };
    acomodarModulos(0, 0);

    // --------- el seguidor: postes, cojinetes, un motor por fila y su control
    const zPostes = [-3.62, -2.5, -1.35, -0.2, 0.92];
    FILAS.x.forEach((x, i) => {
        const g = unidad('seguidor', x, 0);
        zPostes.forEach((z, k) => {
            const poste = caja(0.04, FILAS.y - 0.02, 0.07, M.grafito);
            poste.position.z = z;
            g.add(poste);
            if (k !== 2) {
                const c = aroZ(0.03, 0.01, M.grafito);
                c.position.set(0, FILAS.y, z);
                g.add(c);
            }
        });
        // el motor mueve un engrane alrededor del eje
        const engrane = aroZ(0.075, 0.014, M.guinda);
        engrane.position.set(0, FILAS.y, -1.35);
        g.add(engrane);
        const caja2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.05), M.guinda);
        caja2.position.set(0, FILAS.y - 0.06, -1.35);
        g.add(sombra(caja2));
        const motor = cilX(0.026, 0.13, M.marfil, 12);
        motor.position.set(0.12, FILAS.y - 0.08, -1.35);
        g.add(motor);
        // el control de la fila, con su sensor
        const ctl = caja(0.09, 0.12, 0.05, M.marfil);
        ctl.position.set(0, 0.16, -1.31);
        g.add(ctl);
        if (i === 5) g.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.02, 0.012), M.neonElec), 0, 0.26, -1.283));
    });

    // --------- módulo de muestra, con sus capas
    const capas = [];
    const etiquetasCapas = [];
    {
        const g = unidad('modulo', MUESTRA.x, MUESTRA.z);
        const INCL = 0.62;
        const T = new THREE.Group();
        T.position.set(0, MUESTRA.y, 0);
        T.rotation.x = INCL;
        g.add(T);
        const [W, D] = [1.9, 0.95];
        const capa = (obj, y, k, texto) => {
            obj.position.y = y;
            T.add(obj);
            capas.push({ obj, y, k });
            if (texto) {
                const r = rotular(T, texto, W / 2 + 0.42, y + 0.02, 0, colorTexto, 0.72);
                r.rotation.x = -INCL;
                etiquetasCapas.push({ m: r, y, k });
            }
        };
        const placa = (h, m) => sombra(new THREE.Mesh(new THREE.BoxGeometry(W - 0.03, h, D - 0.03), m));
        capa(placa(0.012, M.marfil), 0.012, 0, 'Respaldo');
        capa(placa(0.008, M.eva), 0.03, 0.2, 'Encapsulante');
        const celdas = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.05, D - 0.05).rotateX(-PI / 2), M.panel);
        capa(celdas, 0.042, 0.45, 'Celdas');
        capa(placa(0.008, M.eva), 0.054, 0.7, 'Encapsulante');
        const vidrio = new THREE.Mesh(new THREE.BoxGeometry(W - 0.02, 0.014, D - 0.02), M.vidrioMuestra);
        capa(vidrio, 0.068, 1, 'Vidrio');
        // marco de aluminio
        const marco = new THREE.Group();
        for (const s of [-1, 1]) {
            marco.add(en(new THREE.Mesh(new THREE.BoxGeometry(W + 0.02, 0.09, 0.03), M.marco), 0, 0.03, (s * D) / 2));
            marco.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.09, D + 0.02), M.marco), (s * W) / 2, 0.03, 0));
        }
        T.add(marco);
        capas.push({ obj: marco, y: 0, k: -0.35 });
        // la caja de conexión, abajo
        const jb = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.14), M.grafito);
        jb.position.set(0, -0.03, -0.18);
        T.add(jb);
        // patas
        for (const [x, z, h] of [[-0.7, -0.26, 0.92], [0.7, -0.26, 0.92], [-0.7, 0.22, 0.32], [0.7, 0.22, 0.32]]) g.add(en(caja(0.04, h, 0.04, M.grafito), x, 0, z));
        g.add(en(new THREE.Mesh(new THREE.BoxGeometry(2, 0.02, 1.1), M.losa), 0, 0.01, 0));
        const r = rotular(g, 'Módulo de muestra', 0, 0.09, 0.62, colorTexto, 1.05);
        r.rotation.x = -0.5;
    }

    // --------- celda de muestra: la unión de dos capas de silicio
    let capaAlta;
    const etiquetasCelda = [];
    {
        const g = unidad('celda', CELDA.x, CELDA.z);
        g.add(caja(1.24, 0.3, 1.24, M.concreto));
        const contacto = caja(1.14, 0.03, 1.14, M.plata);
        contacto.position.y = 0.3;
        g.add(contacto);
        const p = caja(1.14, 0.34, 1.14, M.capaP);
        p.position.y = 0.33;
        g.add(p);
        capaAlta = new THREE.Group();
        capaAlta.position.y = 0.67;
        g.add(capaAlta);
        capaAlta.add(caja(1.14, 0.05, 1.14, M.capaN));
        for (let i = 0; i < 15; i++) capaAlta.add(en(new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.012, 0.012), M.plata), 0, 0.054, -0.54 + i * 0.0772));
        for (const x of [-0.3, 0.3]) capaAlta.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.016, 1.14), M.plata), x, 0.056, 0));
        // el brillo de la unión
        const union = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.012, 1.14), M.union);
        union.position.y = 0.672;
        g.add(union);
        const r = rotular(g, 'Celda de muestra', 0, 0.12, 0.63, colorTexto, 1);
        r.rotation.x = -0.4;
        for (const [texto, y, mov, color] of [['Capa con electrones de sobra', 0.82, 1, colorTexto], ['Unión: empuja a los electrones', 0.7, 0.5, colorTexto], ['Capa con huecos', 0.46, 0, '#ffffff']]) {
            const e = rotular(g, texto, 0, y, 0.585, color, 1.05);
            etiquetasCelda.push({ m: e, y, mov });
        }
        // el foquito que enciende esa corriente
        g.add(en(cil(0.012, 1.02, M.grafito, 0.012, 8), 1.02, 0, 0));
        g.add(en(new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), M.foco), 1.02, 1.06, 0));
        brillo(g, 1.02, 1.06, 0, 0.55, '#ffcf6f', 'cd', 0.7, false);
        // electrones que suben de la capa de abajo a los hilos de plata
        for (let i = 0; i < (movil ? 16 : 30); i++) gota('cd', 'cd', CELDA.x + (azar(i, 201) - 0.5) * 0.98, CELDA.z + (azar(i, 202) - 0.5) * 0.98, 0.52, 1.08, 0.5 + azar(i, 203) * 0.3, 0.016, 0.006);
    }

    // --------- cajas de conexión: reúnen las cadenas y las protegen
    [[(EQUIPOS.caja0[0] + EQUIPOS.caja0[1]) / 2, 2.05], [(EQUIPOS.caja1[0] + EQUIPOS.caja1[1]) / 2, 2.05]].forEach(([x, z], i) => {
        const g = unidad('caja', x, z);
        g.add(en(caja(0.04, 0.2, 0.04, M.grafito), 0, 0, 0));
        const puerta = cub(`caja${i}`, ['caja'], { color: '#e7e6e0' });
        const c = caja(0.38, 0.38, 0.2, puerta);
        c.position.y = 0.2;
        g.add(mover(c, [0, 0.7, 0]));
        const fondo = caja(0.34, 0.34, 0.012, M.grafito);
        fondo.position.set(0, 0.22, -0.08);
        g.add(fondo);
        for (let k = 0; k < 6; k++) {
            g.add(en(cil(0.012, 0.09, M.marfil, 0.012, 10), -0.125 + k * 0.05, 0.38, -0.06));
            g.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.09, 0.006), M.cobre), -0.125 + k * 0.05, 0.33, -0.05));
        }
        g.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.012), M.cobre), 0, 0.28, -0.05));
        brillo(g, 0, 0.4, 0.12, 0.4, FLUIDOS.cd.color, 'cd', 0.14);
    });

    // --------- inversor: de corriente directa a alterna
    const pantallaInv = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.17, 0.008), M.neonElec);
    {
        const g = unidad('inversor', 2.8, -0.3);
        const cuerpo = cub('inversorC', ['inversor']);
        const paredes = new THREE.Group();
        paredes.add(en(caja(1.36, 0.82, 1.06, cuerpo), 0, 0.03, 0));
        paredes.add(en(new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.035, 1.12), cub('inversorT', ['inversor'], { color: P.grafito })), 0, 0.87, 0));
        // rejillas de ventilación
        for (let j = 0; j < 7; j++) {
            paredes.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.014, 0.012), M.grafito), -0.36, 0.26 + j * 0.056, 0.536));
            paredes.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.014, 0.8), M.grafito), -0.686, 0.3 + j * 0.056, 0));
        }
        pantallaInv.position.set(0.26, 0.6, 0.536);
        paredes.add(pantallaInv);
        rotular(paredes, 'Inversor', 0.26, 0.28, 0.54, P.tinta, 0.86);
        g.add(mover(paredes, [0, 1.25, 0]));
        // adentro: condensadores, puentes de transistores y filtro
        for (let i = 0; i < 8; i++) g.add(en(cil(0.045, 0.26, M.marfil, 0.045, 14), -0.5 + (i % 4) * 0.12, 0.05, -0.34 + (i >> 2) * 0.12));
        for (let i = 0; i < 3; i++) {
            const c = caja(0.18, 0.46, 0.28, M.guinda);
            c.position.set(-0.04 + i * 0.22, 0.05, -0.2);
            g.add(mover(c, [0, 0, 0.0]));
            for (let k = 0; k < 7; k++) g.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.012, 0.3), M.acero), -0.04 + i * 0.22, 0.54 + k * 0.022, -0.2));
        }
        for (let i = 0; i < 3; i++) g.add(en(new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.034, 8, 20).rotateX(PI / 2), M.cobre), -0.04 + i * 0.22, 0.16, 0.24));
        g.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.02, 0.02), M.cobre), 0, 0.42, 0.04));
        // ventiladores del techo
        for (let i = 0; i < 3; i++) {
            const a = new THREE.Group();
            a.position.set(-0.42 + i * 0.42, 0.91, 0);
            a.add(aro(0.13, 0.012, M.grafito));
            const f = new THREE.Group();
            f.position.y = 0.012;
            for (let k = 0; k < 5; k++) {
                const b = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.004, 0.035), M.ventilador);
                b.position.set(Math.cos((k / 5) * PI * 2) * 0.065, 0, Math.sin((k / 5) * PI * 2) * 0.065);
                b.rotation.y = -(k / 5) * PI * 2;
                f.add(b);
            }
            a.add(f);
            g.add(mover(a, [0, 1.25, 0]));
            giran.push({ obj: f, eje: 'y', vel: e => 9 * e.activo.ca });
        }
        brillo(g, 0.26, 0.6, 0.62, 0.7, FLUIDOS.ca.color, 'ca', 0.16);
        // aviso de que el inversor está recortando
        const aviso = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.01), M.alerta);
        aviso.position.set(0.56, 0.6, 0.536);
        paredes.add(aviso);
        brillo(g, 0.56, 0.6, 0.62, 0.45, '#ff5a4a', 'recorte', 0.85, false);
    }

    // --------- transformador de media tensión
    const transformador = (padre, id, nombre, x, z, esc = 1, letrero = null) => {
        const g = unidad(id, x, z, padre);
        const c = cub(nombre, [id], { color: '#5a5c63', metal: 0.5 });
        const tanque = caja(0.62 * esc, 0.62 * esc, 0.72 * esc, c);
        tanque.position.y = 0.04;
        g.add(mover(tanque, [0, 1.15, 0]));
        const tapa = caja(0.66 * esc, 0.035, 0.76 * esc, M.grafito);
        tapa.position.y = 0.04 + 0.62 * esc;
        g.add(mover(tapa, [0, 1.15, 0]));
        for (const s of [-1, 1]) for (let i = 0; i < 6; i++) g.add(mover(en(caja(0.09 * esc, 0.5 * esc, 0.018, M.acero), s * 0.37 * esc, 0.08, (-0.27 + i * 0.108) * esc), [s * 0.5, 0, 0]));
        g.add(en(caja(0.34 * esc, 0.48 * esc, 0.06, M.grafito), 0, 0.08, 0));
        for (const k of [-0.2, 0, 0.2]) g.add(en(cil(0.09 * esc, 0.36 * esc, M.cobre, 0.09 * esc, 16), 0, 0.12, k * esc));
        const boq = new THREE.Group();
        for (const k of [-0.22, 0, 0.22]) {
            boq.add(en(cil(0.024, 0.32 * esc, M.marfil, 0.012, 10), 0, 0.68 * esc, k * esc));
            for (let i = 0; i < 3; i++) boq.add(en(aro(0.03 - i * 0.003, 0.006, M.marfil), 0, 0.73 * esc + i * 0.07 * esc, k * esc));
        }
        g.add(mover(boq, [0, 1.15, 0]));
        if (letrero) rotular(g, letrero, 0, 0.4 * esc, 0.37 * esc, '#f2efe8', 0.56 * esc);
        brillo(g, 0, 0.36, 0.5, 0.6, FLUIDOS.ca.color, 'ca', 0.14);
        return g;
    };
    transformador(raiz, 'trafoMT', 'tanqueMT', 2.8, 0.75, 1);

    // --------- SAEE: contenedores de baterías y su convertidor
    const contenedor = (id, [x0, x1, , , z0, z1], conLed = true) => {
        const [w, d] = [x1 - x0, z1 - z0];
        const g = unidad('sae', (x0 + x1) / 2, (z0 + z1) / 2);
        const c = cub(id, ['sae'], { color: '#eeede7' });
        const caparazon = new THREE.Group();
        caparazon.add(caja(w, 0.68, d, c));
        caparazon.add(en(new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.03, d + 0.04), cub(`${id}T`, ['sae'], { color: P.grafito })), 0, 0.695, 0));
        for (let i = 1; i < 5; i++) caparazon.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.62, 0.008), M.grafito), -w / 2 + (i * w) / 5, 0.34, d / 2 + 0.002));
        caparazon.add(en(caja(0.16, 0.12, 0.3, M.acero), w / 2 - 0.1, 0.71, 0));
        g.add(mover(caparazon, [0, 1.15, 0]));
        g.add(caja(w + 0.04, 0.03, d + 0.04, M.concreto));
        if (conLed) {
            const n = 6;
            for (let i = 0; i < n; i++) {
                const xr = -w / 2 + 0.14 + (i * (w - 0.28)) / (n - 1);
                g.add(en(caja(0.17, 0.58, d * 0.62, M.grafito), xr, 0.03, -d * 0.1));
                for (let k = 0; k < 5; k++) g.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.05, 0.012), M.led[k]), xr, 0.1 + k * 0.1, -d * 0.1 + (d * 0.31) + 0.007));
            }
        } else {
            g.add(en(caja(w * 0.8, 0.5, d * 0.6, M.guinda), 0, 0.03, 0));
            for (let k = 0; k < 3; k++) g.add(en(new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.03, 8, 18).rotateX(PI / 2), M.cobre), -0.3 + k * 0.3, 0.6, 0));
        }
        return g;
    };
    contenedor('sae0', EQUIPOS.sae0);
    contenedor('sae1', EQUIPOS.sae1);
    contenedor('sae2', EQUIPOS.sae2);
    contenedor('sae3', EQUIPOS.sae3);
    const conv = contenedor('saeConv', EQUIPOS.saeConv, false);
    rotular(conv, 'SAEE', 0, 0.36, (EQUIPOS.saeConv[5] - EQUIPOS.saeConv[4]) / 2 + 0.006, P.tinta, 0.9);
    brillo(conv, 0, 0.4, 0.5, 0.7, FLUIDOS.sae.color, 'sae', 0.16);

    // --------- subestación: sube a 400 kV
    {
        const u = raiz;
        transformador(u, 'subestacion', 'tanqueAlta', 4.55, 1.45, 1.35, null);
        const g = unidad('subestacion', 0, 0);
        // interruptores y cuchillas en fila, con su barra
        for (let i = 0; i < 3; i++) {
            const z = 0.95 + i * 0.5;
            g.add(en(caja(0.06, 0.5, 0.06, M.acero), 5.25, 0.02, z));
            g.add(en(cil(0.032, 0.32, M.marfil, 0.02, 10), 5.25, 0.52, z));
            for (let k = 0; k < 4; k++) g.add(en(aro(0.04, 0.007, M.marfil), 5.25, 0.56 + k * 0.07, z));
            g.add(en(caja(0.05, 0.42, 0.05, M.acero), 5.72, 0.02, z));
            g.add(en(cil(0.018, 0.26, M.marfil, 0.012, 8), 5.72, 0.44, z));
            g.add(entre([5.25, 0.85, z], [5.72, 0.72, z], 0.009, M.acero));
            g.add(entre([4.86, 1.07, 1.45 + (i - 1) * 0.3], [5.25, 0.85, z], 0.008, M.acero));
        }
        for (const z of [0.7, 2.2]) g.add(entre([5.92, 0, z], [5.92, 1.25, z], 0.02, M.acero));
        g.add(entre([5.92, 1.25, 0.66], [5.92, 1.25, 2.24], 0.02, M.acero));
        for (let i = 0; i < 3; i++) g.add(entre([5.72, 0.72, 0.95 + i * 0.5], [5.92, 1.2, 0.95 + i * 0.5], 0.008, M.acero));
        // pórtico de salida
        const p = unidad('subestacion', 6.48, 1.55);
        p.add(entre([-0.18, 0, 0], [-0.18, 2.6, 0], 0.024, M.acero), entre([0.18, 0, 0], [0.18, 2.6, 0], 0.024, M.acero), entre([-0.2, 2.6, 0], [0.2, 2.6, 0], 0.024, M.acero));
        p.add(entre([-0.18, 0, 0.3], [-0.18, 2.6, 0], 0.012, M.acero), entre([0.18, 0, -0.3], [0.18, 2.6, 0], 0.012, M.acero));
        for (const z of [-0.09, 0, 0.09]) p.add(en(cil(0.012, 0.1, M.marfil, 0.012, 8), 0, 2.62, z));
    }

    // --------- clima y limpieza: la estación que mide y el robot que limpia
    let robot;
    {
        const g = unidad('clima', -1.65, 2.95);
        g.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.02, 0.5), M.concreto), 0, 0.01, 0));
        g.add(cil(0.02, 1.55, M.acero, 0.014, 10));
        g.add(en(caja(0.14, 0.2, 0.08, M.marfil), 0, 0.5, 0.03));
        // piranómetro: una cúpula de vidrio sobre un disco, nivelado
        g.add(entre([0, 1.45, 0], [0.26, 1.45, 0], 0.008, M.acero));
        g.add(en(cil(0.06, 0.018, M.marfil, 0.06, 18), 0.3, 1.45, 0));
        g.add(en(new THREE.Mesh(new THREE.SphereGeometry(0.036, 14, 8, 0, PI * 2, 0, PI / 2), M.vidrio), 0.3, 1.468, 0));
        g.add(en(new THREE.Mesh(new THREE.CircleGeometry(0.02, 12).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color: '#111115' })), 0.3, 1.47, 0));
        // anemómetro
        g.add(entre([0, 1.3, 0], [-0.26, 1.3, 0], 0.008, M.acero));
        const copas = new THREE.Group();
        copas.position.set(-0.26, 1.42, 0);
        g.add(en(cil(0.007, 0.12, M.acero, 0.007, 6), -0.26, 1.3, 0));
        for (let k = 0; k < 3; k++) {
            const a = (k / 3) * PI * 2;
            copas.add(entre([0, 0, 0], [Math.cos(a) * 0.09, 0, Math.sin(a) * 0.09], 0.004, M.grafito));
            copas.add(en(new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), M.grafito), Math.cos(a) * 0.09, 0, Math.sin(a) * 0.09));
        }
        g.add(copas);
        giran.push({ obj: copas, eje: 'y', vel: () => 5 });
        // termómetro con su protector de platos
        for (let k = 0; k < 5; k++) g.add(en(cil(0.04 - k * 0.003, 0.012, M.marfil, 0.04 - k * 0.003, 12), 0.08, 1.05 + k * 0.022, 0.06));
        const r = rotular(g, 'Estación de clima', 0, 0.07, 0.33, colorTexto, 0.9);
        r.rotation.x = -0.4;
        // el robot corre por la fila 3, en seco
        const fila = filas[3];
        robot = new THREE.Group();
        const carro = new THREE.Mesh(new THREE.BoxGeometry(FILAS.ancho + 0.06, 0.03, 0.05), M.guinda);
        carro.position.y = 0.04;
        robot.add(sombra(carro));
        const cepillo = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, FILAS.ancho + 0.02, 10).rotateZ(PI / 2), M.grafito);
        cepillo.position.set(0, 0.026, -0.04);
        robot.add(cepillo);
        fila.g.add(robot);
        partes.clima.push(robot);
    }

    // --------- RNT y RGD: torres, subestación reductora, postes y pueblo
    {
        const u = unidad('red');
        const geoT = geoTorre(3.3);
        TORRES.forEach(([x, z]) => {
            const t = new THREE.Mesh(geoT, M.torre);
            t.position.set(x, 0, z);
            u.add(t);
            u.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.012, 0.56), M.losa), x, 0.006, z));
        });
        const rnt = LINEAS.find(l => l.id === 'rnt');
        for (const s of [-1, 1]) {
            const pts = rnt.puntos.map(([x, y, z]) => new THREE.Vector3(x + s * 0.03, y - 0.02, z + s * 0.1));
            u.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.2), 150, 0.009, 5), M.torre));
        }
        const r = unidad('red', 7.1, 3.18);
        r.add(caja(0.66, 0.04, 0.6, M.losa));
        r.add(en(caja(0.32, 0.4, 0.38, M.grafito), 0, 0.04, 0));
        for (const z of [-0.11, 0, 0.11]) r.add(en(cil(0.016, 0.2, M.marfil, 0.01, 8), 0.05, 0.44, z));
        for (const [a, b] of [[[-0.26, 0, -0.26], [-0.26, 1.28, -0.26]], [[-0.26, 0, 0.26], [-0.26, 1.28, 0.26]], [[0.26, 0, -0.26], [0.26, 1.28, -0.26]], [[0.26, 0, 0.26], [0.26, 1.28, 0.26]], [[-0.28, 1.28, 0.26], [0.28, 1.28, 0.26]], [[-0.28, 1.28, -0.26], [0.28, 1.28, -0.26]], [[0, 1.28, -0.26], [0, 1.28, 0.26]]]) r.add(entre(a, b, 0.014, M.acero));
        r.add(entre([0, 1.28, 0], [0, 0.44, 0], 0.012, M.acero));
        for (const [x, z, h] of [[6.45, 3.4, 1], [5.95, 3.35, 0.78]]) {
            u.add(en(cil(0.018, h, M.madera, 0.014, 8), x, 0, z));
            u.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.26), M.madera), x, h - 0.02, z));
        }
        const casas = [[5.55, 3.05, 0.34, 0.26, 0.24], [5.05, 3, 0.3, 0.3, 0.2], [4.55, 3.1, 0.34, 0.26, 0.26], [5.55, 3.6, 0.38, 0.28, 0.24], [5, 3.58, 0.34, 0.26, 0.26], [4.55, 3.65, 0.28, 0.24, 0.22], [6.05, 3.02, 0.26, 0.22, 0.2]];
        casas.forEach(([x, z, w, d, h], i) => {
            const g = new THREE.Group();
            g.position.set(x, 0, z);
            g.rotation.y = (azar(i, 81) - 0.5) * 0.4;
            g.add(caja(w, h, d, M.marfil));
            const techo = sombra(new THREE.Mesh(new THREE.ConeGeometry(Math.hypot(w, d) * 0.56, 0.12, 4).rotateY(PI / 4).translate(0, 0.06, 0), M.guinda));
            techo.position.y = h;
            g.add(techo);
            const v = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.008), M.ventana);
            v.position.set(-w * 0.2, h * 0.55, d / 2 + 0.005);
            g.add(v);
            const v2 = v.clone();
            v2.position.x = w * 0.2;
            g.add(v2);
            u.add(g);
        });
    }

    // --------- matorral del desierto y lámparas
    {
        const lista = [[-7.25, -3.9], [-7.3, 0.6], [-6.8, 4.05], [-4.6, 4.1], [-0.6, 4.1], [1.55, 3.2], [0.4, 2.6], [7.4, -0.3], [7.45, 1.6], [3.3, -3.6], [2.3, -2.2]];
        const n = lista.length;
        const copa = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.12, 1).scale(1.3, 0.7, 1.3).translate(0, 0.08, 0), M.hoja, n);
        const m4 = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        lista.forEach(([x, z], i) => {
            const e = 0.75 + azar(i, 95) * 0.7;
            m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(e, e, e));
            copa.setMatrixAt(i, m4);
        });
        copa.castShadow = true;
        raiz.add(copa);
    }
    [[1.62, 3.4], [3.72, -2.3], [3.72, 2.75], [6.2, -0.55]].forEach(([x, z]) => {
        const g = new THREE.Group();
        g.position.set(x, 0, z);
        g.add(cil(0.018, 1.3, M.grafito, 0.013, 8));
        g.add(en(caja(0.16, 0.03, 0.08, M.lampara), 0, 1.3, 0));
        raiz.add(g);
        brillo(g, 0, 1.29, 0, 1, '#ffcf8f', 'noche', 0.55);
        const charco = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ map: M.brillo, color: '#ffc27a', transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending, opacity: 0 }));
        charco.position.y = 0.04;
        charco.renderOrder = 1;
        g.add(charco);
        kit.brillos.push({ s: charco, proceso: 'noche', fuerza: 0.22, noche: true, charco: true });
    });

    // --------- el sol, las marcas de su camino y las nubes
    const gSol = unidad('sol');
    const bola = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 18), M.solBola);
    gSol.add(bola);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.brillo, color: '#ffc61a', transparent: true, depthWrite: false, toneMapped: false, opacity: 0.85 }));
    halo.scale.setScalar(2.5);
    gSol.add(halo);
    const nMarcas = 49;
    const marcas = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), M.marcaHora, nMarcas);
    marcas.frustumCulled = false;
    raiz.add(marcas);
    const m4 = new THREE.Matrix4();
    const q0 = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const s3 = new THREE.Vector3();
    let mesAntes = -1;
    const pintarCamino = mes => {
        if (mes === mesAntes) return;
        mesAntes = mes;
        for (let i = 0; i < nMarcas; i++) {
            const h = i / 2;
            const s = solEn(h, mes);
            const r = s.y > 0.005 ? (i % 2 === 0 ? 0.04 : 0.022) : 0.0001;
            v.set(CENTRO_SOL[0] + RADIO_SOL * s.x, CENTRO_SOL[1] + RADIO_SOL * s.y, CENTRO_SOL[2] + RADIO_SOL * s.z);
            s3.setScalar(r);
            marcas.setMatrixAt(i, m4.compose(v, q0, s3));
        }
        marcas.instanceMatrix.needsUpdate = true;
    };
    const nube = new THREE.Group();
    [[0, 0, 0, 1.15], [1, 0.1, 0.25, 0.85], [-1.05, 0.05, -0.2, 0.9], [0.45, 0.42, -0.2, 0.72], [-0.45, 0.38, 0.3, 0.68]].forEach(([x, y, z, r]) => {
        const b = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), M.nube);
        b.position.set(x, y, z);
        b.scale.y = 0.62;
        b.castShadow = true;
        nube.add(b);
    });
    nube.visible = false;
    raiz.add(nube);

    // lo que baja del sol: luz que cae sobre los módulos y las muestras
    const nLuz = movil ? 44 : 84;
    const mallaLuz = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 5), M.fluido.luz, nLuz);
    mallaLuz.frustumCulled = false;
    raiz.add(mallaLuz);
    const destinos = Array.from({ length: nLuz }, (_, i) => {
        if (i % 9 === 0) return [MUESTRA.x + (azar(i, 41) - 0.5) * 1.7, MUESTRA.y + 0.12, MUESTRA.z + (azar(i, 42) - 0.5) * 0.7];
        if (i % 9 === 1) return [CELDA.x + (azar(i, 41) - 0.5), 0.76, CELDA.z + (azar(i, 42) - 0.5)];
        const f = FILAS.x[Math.floor(azar(i, 43) * FILAS.x.length)];
        return [f + (azar(i, 44) - 0.5) * 0.5, FILAS.y + 0.04, lerp(zA, zB, azar(i, 45))];
    });

    // ---------- cables
    const parteDe = L => L.parte ?? null;
    const tubos = crearTubos({ raiz, lineas: LINEAS, fluidos: FLUIDOS, M, partes, parteDe, movil });
    kit.cerrarGotas(new THREE.SphereGeometry(1, 8, 6));

    const anclas = {};
    for (const p of PARTES) {
        const o = new THREE.Object3D();
        o.position.set(...p.ancla);
        raiz.add(o);
        anclas[p.id] = o;
    }

    // ---------- posar
    let fLuz = 0;
    const qRayo = new THREE.Quaternion();
    const arriba = new THREE.Vector3(0, 1, 0);
    const vRayo = new THREE.Vector3();
    function posar(e) {
        const n = e.noche;
        const L = e.encendido;
        const act = p => (p === 'noche' ? n : p ? (e.activo[p] ?? 0) : 1);
        const d = e.desarme;
        const a = sale(d * 3);
        const ab = { ...(e.abierta || {}), desarmeV: sale(d * 2.2) };
        kit.posar(e, act, ab, { apagar: a });
        tubos.posar(e, a);
        // el seguidor gira; con mesa fija, cada mesa se inclina al sur
        const giro = Math.max(-GIRO_MAX, Math.min(GIRO_MAX, e.giro));
        filas.forEach(f => { f.g.rotation.z = -giro * D2R * (1 - e.fija); });
        acomodarModulos(e.fija, e.inclinacion);
        // para ver las cadenas, los módulos se vuelven transparentes
        const verCadena = Math.max(ab.cadena ?? 0, a * 0.6);
        M.panel.opacity = 1 - 0.72 * verCadena;
        M.panel.depthWrite = verCadena < 0.4;
        const cuerposVisibles = verCadena < 0.4;
        filas.forEach(f => { f.cuerpos.visible = cuerposVisibles; });
        M.polvoCapa.opacity = clamp01(e.polvo / 15) ** 1.4 * 0.62 * (1 - verCadena);
        // las capas del módulo de muestra y de la celda
        const sep = Math.max(ab.modulo ?? 0, a);
        capas.forEach(c => { c.obj.position.y = c.y + c.k * 1.05 * sep; });
        etiquetasCapas.forEach(c => { c.m.visible = sep > 0.5; c.m.position.y = c.y + 0.02 + c.k * 1.05 * sep; c.m.material.opacity = clamp01((sep - 0.5) * 3); });
        M.eva.opacity = lerp(0.03, 0.2, sep);
        M.vidrioMuestra.opacity = lerp(0.05, 0.2, sep);
        const abre = Math.max(ab.celda ?? 0, a);
        capaAlta.position.y = 0.67 + 0.34 * abre;
        etiquetasCelda.forEach(c => { c.m.visible = abre > 0.5; c.m.position.y = c.y + c.mov * 0.34 * abre; c.m.material.opacity = clamp01((abre - 0.5) * 3); });
        // el robot: de la punta de la fila a la otra y de regreso
        const u = e.limpia ?? 0;
        robot.position.set(0, 0, (largoFila / 2 - 0.02) * (1 - 2 * Math.min(1, u <= 0.5 ? u * 2 : 2 - u * 2)));
        // el sol, a donde diga la hora
        pintarCamino(Math.round(e.mes));
        const [sx, sy, sz] = e.solPos;
        gSol.position.set(sx, sy, sz);
        anclas.sol.position.set(sx, sy + 0.55, sz);
        gSol.visible = e.solDir.y > -0.02;
        const fuerza = clamp01((e.solDir.y + 0.02) * 6) * (1 - 0.6 * (e.tapa ?? 0));
        M.solBola.color.set('#ffc61a').multiplyScalar(0.55 + 0.45 * fuerza);
        halo.material.opacity = 0.85 * fuerza;
        M.marcaHora.opacity = lerp(0.75, 0.35, n);
        // la nube pasa de oeste a este
        nube.visible = e.nubeU < 1;
        if (nube.visible) {
            nube.position.set(lerp(-14, 14, e.nubeU), 5.1, -0.4);
            M.nube.color.set('#ffffff').lerp(new THREE.Color('#70757e'), n);
        }
        // luz bajando
        fLuz = (fLuz + e.dt * (0.35 + 0.65 * e.activo.luz)) % 1;
        const sd = e.solDir;
        const hayLuz = e.activo.luz > 0.02 && a < 0.5 && sd.y > 0.05;
        qRayo.setFromUnitVectors(arriba, vRayo.set(sd.x, Math.max(sd.y, 0.02), sd.z).normalize());
        for (let i = 0; i < nLuz; i++) {
            const h = azar(i, 46);
            const w = fract(fLuz * (0.85 + h * 0.5) + h);
            const t = destinos[i];
            const r = hayLuz ? 0.005 * Math.min(1, w * 6) * Math.min(1, (1 - w) * 10) * (0.5 + 0.5 * e.activo.luz) : 0.0001;
            const LUZ_L = 3.6;
            v.set(t[0] + sd.x * LUZ_L * (1 - w), t[1] + sd.y * LUZ_L * (1 - w), t[2] + sd.z * LUZ_L * (1 - w));
            s3.set(Math.max(r, 0.0001), r > 0.0005 ? 0.24 : 0.0001, Math.max(r, 0.0001));
            mallaLuz.setMatrixAt(i, m4.compose(v, qRayo, s3));
        }
        mallaLuz.instanceMatrix.needsUpdate = true;
        // neones
        M.neonElec.color.set(FLUIDOS.ca.color).multiplyScalar((0.14 + 0.86 * e.activo.ca) * L);
        M.neonGuinda.color.set(P_PLANTA.rosa).multiplyScalar((0.2 + 0.8 * e.activo.cd) * L);
        M.foco.color.set('#6b5a33').lerp(new THREE.Color('#ffc15a'), e.activo.cd);
        M.alerta.color.set('#4a1216').lerp(new THREE.Color('#ff2b3a'), e.activo.recorte);
        M.led.forEach((m, i) => { m.color.set(FLUIDOS.sae.color).multiplyScalar(e.soc > (i + 0.15) / 5 ? 1 : 0.12); });
        M.lampara.color.set('#9a9c9f').lerp(new THREE.Color('#ffe2ad'), n);
        M.ventana.color.set('#3f4a57').lerp(new THREE.Color('#ffc77a'), n);
    }
    return { raiz, posar, partes, anclas, giran, repintar: kit.repintar, equipos: EQUIPOS, luz };
}
