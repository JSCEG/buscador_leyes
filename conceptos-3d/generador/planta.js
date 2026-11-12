// El generador de la Central Termoeléctrica Valle de México, hecho con código. Sistema Búho: en la nave, sobre su base de concreto, la
// turbina de vapor, el eje con su cople y sus chumaceras, el generador (el estator con su núcleo y sus barras, y adentro el rotor de dos
// polos con su devanado de campo), los anillos y las escobillas, la excitación, el hidrógeno y el agua que lo enfrían, el bus de fase
// aislada, el interruptor de generador, el sincronoscopio y el transformador elevador. Nada está a escala.
//
//   materiales(P)     escenario(renderer, scene, M, { movil, oscuro })
//   construir(M, P, { movil, oscuro }) → { raiz, posar(e), partes, anclas, giran, repintar }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { lerp, sale } from '../planta-comun/ayudas.js';
import { caja, cil, cilX, crearAyudante, crearTubos, en, estudio, geoEntre, materialesBase, sombra, texturaGrano } from '../planta-comun/piezas.js';
import { crearLineasAereas } from '../planta-comun/conductores.js';
import { BLOQUE, BORNES, EJE, FLUIDOS, LINEAS, PARTES, R, SINCRO, SITIO, X, Y_ESCOBILLAS, giroVista } from './modelo.js';

const PI = Math.PI;
export const P_PLANTA = {
    papel: '#fafafa', noche: '#0a0e12', tinta: '#171317', marfil: '#f3f1ec', grafito: '#303137', acero: '#a7abb3', guinda: '#9b2247', rosa: '#e57a9a',
    tierraDia: '#d6d7c8', tierraNoche: '#23272c', losaDia: '#dcdcda', losaNoche: '#2c3036', suelo: '#b9a688',
};

export function materiales(P) {
    const M = materialesBase(P, FLUIDOS);
    Object.assign(M, {
        piso: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#cfccc6', 'rgba(0,0,0,0.08)', [8, 3]), roughness: 0.9, envMapIntensity: 0.25 }),
        franja: new THREE.MeshStandardMaterial({ color: '#e0b43a', roughness: 0.8 }),
        carcasa: new THREE.MeshStandardMaterial({ color: '#c2c7cd', roughness: 0.45, metalness: 0.45, envMapIntensity: 0.8 }),
        verdeGen: new THREE.MeshStandardMaterial({ color: '#7d9a8a', roughness: 0.5, metalness: 0.3, envMapIntensity: 0.7 }),
        rotor: new THREE.MeshStandardMaterial({ color: '#8f97a1', roughness: 0.3, metalness: 0.9, envMapIntensity: 1 }),
        laminas: new THREE.MeshStandardMaterial({ color: '#6c7178', roughness: 0.45, metalness: 0.75, envMapIntensity: 0.9 }),
        alabe: new THREE.MeshStandardMaterial({ color: '#b9bec5', roughness: 0.28, metalness: 0.9, envMapIntensity: 1 }),
        carbon: new THREE.MeshStandardMaterial({ color: '#2a2a2c', roughness: 0.8 }),
        polo: new THREE.MeshStandardMaterial({ color: P.guinda, roughness: 0.4, metalness: 0.3 }),
        botella: new THREE.MeshStandardMaterial({ color: '#d84a3a', roughness: 0.45, metalness: 0.3 }),
        tanqueAzul: new THREE.MeshStandardMaterial({ color: '#4f7fb0', roughness: 0.45, metalness: 0.35 }),
        trafo: new THREE.MeshStandardMaterial({ color: '#8e979b', roughness: 0.45, metalness: 0.45, envMapIntensity: 0.9 }),
        bus: new THREE.MeshStandardMaterial({ color: '#b8bdc4', roughness: 0.4, metalness: 0.6, envMapIntensity: 0.8 }),
        porcelana: new THREE.MeshStandardMaterial({ color: '#8b5a43', roughness: 0.32, metalness: 0.05, envMapIntensity: 0.9 }),
        galv: new THREE.MeshStandardMaterial({ color: '#9aa0a8', roughness: 0.45, metalness: 0.7, envMapIntensity: 0.85 }),
        verde: new THREE.MeshBasicMaterial({ color: '#2fb36a', toneMapped: false }),
        rojo: new THREE.MeshBasicMaterial({ color: '#e0302a', toneMapped: false }),
        ambar: new THREE.MeshBasicMaterial({ color: '#ffb000', toneMapped: false }),
        apagado: new THREE.MeshBasicMaterial({ color: '#4a4f57', toneMapped: false }),
        aguja: new THREE.MeshBasicMaterial({ color: P.guinda, toneMapped: false }),
        cobreCampo: new THREE.MeshStandardMaterial({ color: '#c8743c', roughness: 0.34, metalness: 0.9, envMapIntensity: 1, emissive: '#000000' }),
    });
    return M;
}

const [X0, X1] = BLOQUE.x;
const [Z0, Z1] = BLOQUE.z;
const Y0 = BLOQUE.y[0];
export function escenario(renderer, scene, M, { movil = false, oscuro = false } = {}) {
    const dia = new THREE.Color(oscuro ? '#c9c6c0' : '#ffffff');
    const noche = new THREE.Color('#5d5b58');
    return estudio(renderer, scene, { movil, oscuro, y0: Y0, alcance: 14, alActualizar(n) { M.piso.color.copy(dia).lerp(noche, n); } });
}

/** La carátula del sincronoscopio: arriba, en fase; a la derecha, «rápido»; a la izquierda, «lento». La zona verde es la del verificador. */
function caratula(oscuro) {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const x = c.getContext('2d');
    x.fillStyle = oscuro ? '#1b2026' : '#fbfaf7';
    x.beginPath(); x.arc(256, 256, 250, 0, PI * 2); x.fill();
    x.lineWidth = 10; x.strokeStyle = '#303137'; x.stroke();
    const a0 = -PI / 2;
    x.strokeStyle = '#2fb36a'; x.lineWidth = 34;
    x.beginPath(); x.arc(256, 256, 196, a0 - (SINCRO.verificador.dA * PI) / 180, a0 + (SINCRO.verificador.dA * PI) / 180); x.stroke();
    x.strokeStyle = oscuro ? '#eef0f2' : '#171317';
    for (let k = 0; k < 24; k++) { const a = (k / 24) * PI * 2; x.lineWidth = k % 6 ? 3 : 6; x.beginPath(); x.moveTo(256 + Math.cos(a) * 178, 256 + Math.sin(a) * 178); x.lineTo(256 + Math.cos(a) * 214, 256 + Math.sin(a) * 214); x.stroke(); }
    x.fillStyle = oscuro ? '#eef0f2' : '#171317';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '700 38px Manrope, system-ui, sans-serif';
    x.fillText('RÁPIDO ↻', 256 + 96, 256 + 96);
    x.fillText('↺ LENTO', 256 - 96, 256 + 96);
    x.font = '700 34px Fraunces, Georgia, serif';
    x.fillText('En fase', 256, 120);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

export function construir(M, P, { movil = false, oscuro = false } = {}) {
    const raiz = new THREE.Group();
    const ids = PARTES.map(p => p.id);
    const kit = crearAyudante(M, raiz, ids, { movil });
    const { partes, giran, unidad, mover, brillo, cub, rotular } = kit;
    const colorSuelo = oscuro ? '#f2efe8' : P.tinta;
    const plano = (padre, texto, x, z, ancho, giro = 0, y = 0.012) => { const r = rotular(padre, texto, x, y, z, colorSuelo, ancho); r.rotation.set(-PI / 2, 0, giro); return r; };
    const malla = (geos, m) => sombra(new THREE.Mesh(mergeGeometries(geos), m));
    const xm = (a, b) => (a + b) / 2;
    const ey = EJE.y;
    // todo lo que gira lo hace a la velocidad de la máquina, y se frena o arranca poco a poco
    const girar = (obj, k = 1) => { const r = { v: 0 }; giran.push({ obj, eje: 'x', vel: e => { r.v = lerp(r.v, giroVista(e.rpm) * k, Math.min(1, (e.dt || 0.016) * 1.2)); return r.v; } }); };

    // --------- el piso de la nave y la base de concreto del turbogenerador
    {
        const g = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0, -Y0, Z1 - Z0).translate(0, Y0 / 2, 0), M.piso);
        g.receiveShadow = true;
        raiz.add(g);
        raiz.add(en(caja(10.6, 0.3, 1.9, M.concreto), -2.0, 0, 0));
        raiz.add(en(caja(10.6, 0.02, 0.06, M.franja), -2.0, 0.3, 0.98), en(caja(10.6, 0.02, 0.06, M.franja), -2.0, 0.3, -0.98));
    }

    // --------- la turbina de vapor: alta presión y baja presión, con sus álabes por dentro
    const turbina = unidad('turbina');
    const rotorTurbina = new THREE.Group();
    {
        for (const [a, b, r] of [[X.hp[0], X.hp[1], R.hp], [X.lp[0], X.lp[1], R.lp]]) {
            const cas = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.9, b - a, 28, 1, false).rotateZ(PI / 2), cub('turbina', ['turbina'], { color: '#c2c7cd', metal: 0.45 }));
            cas.position.set(xm(a, b), ey, 0);
            cas.castShadow = true;
            turbina.add(mover(cas, [0, 1.0, 0]));
            // los discos con álabes
            const n = Math.round((b - a) / 0.16);
            for (let i = 0; i < n; i++) {
                const rr = lerp(r * 0.55, r * 0.85, i / Math.max(1, n - 1)) * (r === R.hp ? 1 : 1);
                const disco = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, 0.05, 18).rotateZ(PI / 2), M.alabe);
                disco.position.set(a + 0.08 + i * 0.16, 0, 0);
                rotorTurbina.add(disco);
            }
        }
        // las patas de la turbina
        for (const x of [-6.0, -4.25]) turbina.add(en(caja(0.9, ey - 0.3, 1.2, M.grafito), x, 0.3, 0));
        rotorTurbina.position.set(0, ey, 0);
        turbina.add(rotorTurbina);
        girar(rotorTurbina);
        plano(raiz, 'Turbina de vapor', -5.1, 1.45, 1.6);
    }

    // --------- el eje, el cople y las chumaceras
    const eje = unidad('eje');
    const ejeGira = new THREE.Group();
    {
        ejeGira.add(cilX(0.11, X.anillos[1] + 0.4 - X.hp[0] + 0.3, M.rotor));
        ejeGira.children[0].position.x = xm(X.hp[0] - 0.3, X.anillos[1] + 0.4);
        ejeGira.add(en(cilX(0.26, 0.12, M.galv), X.cople, 0, 0));
        for (let k = 0; k < 6; k++) { const a = (k / 6) * PI * 2; ejeGira.add(en(cilX(0.025, 0.16, M.grafito), X.cople, Math.cos(a) * 0.19, Math.sin(a) * 0.19)); }
        ejeGira.position.set(0, ey, 0);
        eje.add(ejeGira);
        girar(ejeGira);
        for (const x of X.chumaceras) eje.add(en(caja(0.3, ey - 0.3 + 0.18, 0.55, M.grafito), x, 0.3, 0));
    }

    // --------- el generador: el estator (carcasa, núcleo y barras) y el rotor de dos polos con su devanado de campo
    const rotor = unidad('rotor');
    const rotorGira = new THREE.Group();
    const campo = unidad('campo', 0, 0, rotorGira);
    const nucleo = unidad('nucleo');
    const barras = unidad('barras');
    const [sx0, sx1] = X.estator;
    {
        // la carcasa, con su domo de enfriadores de hidrógeno y sus patas: se vuelve vidrio al ver por dentro o al elegir lo de adentro
        const mat = cub('estator', ['rotor', 'campo', 'nucleo', 'barras'], { color: '#7d9a8a', metal: 0.3 });
        const carcasa = new THREE.Mesh(new THREE.CylinderGeometry(R.estator, R.estator, sx1 - sx0, 36, 1, false).rotateZ(PI / 2), mat);
        carcasa.position.set(xm(sx0, sx1), ey, 0);
        carcasa.castShadow = true;
        const tapas = [sx0, sx1].map(x => en(new THREE.Mesh(new THREE.CylinderGeometry(R.estator * 0.92, R.estator, 0.12, 36).rotateZ(PI / 2), mat), x, ey, 0));
        const domo = en(new THREE.Mesh(new THREE.BoxGeometry(sx1 - sx0 - 0.6, 0.35, 1.0).translate(0, 0.175, 0), mat), xm(sx0, sx1), ey + R.estator - 0.15, 0);
        const g = new THREE.Group();
        g.add(carcasa, ...tapas, domo);
        g.add(en(caja(sx1 - sx0 - 0.4, ey - R.estator + 0.1 - 0.3, 1.6, M.grafito), xm(sx0, sx1), 0.3, 0));
        rotor.add(mover(g, [0, 1.4, 0]));
        // el núcleo: un tubo de láminas, en paquetes con ductos de ventilación
        const geo = [];
        const n = 16;
        const largo = (sx1 - sx0 - 0.3) / n;
        for (let i = 0; i < n; i++) {
            const pts = [new THREE.Vector2(0.64, 0), new THREE.Vector2(0.92, 0), new THREE.Vector2(0.92, largo * 0.82), new THREE.Vector2(0.64, largo * 0.82)];
            geo.push(new THREE.LatheGeometry(pts, 36).rotateZ(-PI / 2).translate(sx0 + 0.15 + i * largo, ey, 0));
        }
        // el núcleo se vuelve vidrio al elegir el rotor, el campo o las barras: si no, los tapa
        const nm = new THREE.Mesh(mergeGeometries(geo), cub('nucleo', ['rotor', 'campo', 'barras'], { color: '#6c7178', metal: 0.75 }));
        nm.castShadow = true;
        nucleo.add(mover(nm, [0, 0, 1.4]));
        // las barras del estator: cobre a lo largo del núcleo, por dentro, y sus cabezas a cada lado
        const bg = [];
        for (let k = 0; k < 24; k++) {
            const a = (k / 24) * PI * 2;
            const [y, z] = [ey + Math.cos(a) * 0.67, Math.sin(a) * 0.67];
            bg.push(new THREE.BoxGeometry(sx1 - sx0 + 0.3, 0.045, 0.06).rotateX(a).translate(xm(sx0, sx1), y, z));
        }
        barras.add(mover(malla(bg, M.cobre), [0, 0, 1.4]));
        // el rotor: cilindro de acero con dos polos y el devanado de campo en sus ranuras
        rotorGira.add(cilX(R.rotor, X.rotor[1] - X.rotor[0] - 0.4, M.rotor));
        rotorGira.children[0].position.x = xm(X.rotor[0], X.rotor[1]);
        const cg = [];
        for (const s of [-1, 1]) {
            for (let k = -3; k <= 3; k++) {
                if (k === 0) continue;
                const a = (s > 0 ? 0 : PI) + k * 0.2;
                cg.push(new THREE.BoxGeometry(X.rotor[1] - X.rotor[0] - 0.5, 0.04, 0.05).rotateX(a).translate(xm(X.rotor[0], X.rotor[1]), Math.cos(a) * (R.rotor + 0.005), Math.sin(a) * (R.rotor + 0.005)));
            }
        }
        campo.add(new THREE.Mesh(mergeGeometries(cg), M.cobreCampo));
        // los dos polos: dos franjas, una guinda (norte) y otra oscura (sur)
        for (const [s, m] of [[1, M.polo], [-1, M.grafito]]) {
            const pol = new THREE.Mesh(new THREE.BoxGeometry(X.rotor[1] - X.rotor[0] - 0.6, 0.02, 0.24).translate(xm(X.rotor[0], X.rotor[1]), (R.rotor + 0.012) * s, 0), m);
            rotorGira.add(pol);
        }
        rotorGira.position.set(0, ey, 0);
        rotor.add(rotorGira);
        girar(rotorGira);
        brillo(rotor, xm(sx0, sx1), ey + 0.3, 0, 2.6, '#ff8a3c', 'calor', 1, false);
        brillo(rotor, xm(sx0, sx1), ey + 0.3, 0, 2.2, '#e0302a', 'alarma', 1.2, false);
        plano(raiz, 'Generador de 340 MVA', -0.6, 1.45, 1.7);
    }

    // --------- los anillos y las escobillas: por ahí entra al rotor la corriente directa del campo
    const escobillas = unidad('escobillas');
    {
        const anillos = new THREE.Group();
        for (const x of [X.anillos[0] + 0.1, X.anillos[1] - 0.1]) anillos.add(en(cilX(R.anillos, 0.12, M.cobre), x, 0, 0));
        anillos.position.set(0, ey, 0);
        escobillas.add(anillos);
        girar(anillos);
        for (const x of [X.anillos[0] + 0.1, X.anillos[1] - 0.1]) {
            escobillas.add(en(caja(0.1, 0.08, 0.42, M.galv), x, ey + R.anillos + 0.1, 0));
            for (const dz of [-0.12, 0, 0.12]) escobillas.add(en(caja(0.06, 0.07, 0.05, M.carbon), x, ey + R.anillos + 0.02, dz));
        }
        escobillas.add(en(caja(0.7, 0.08, 0.5, M.galv), xm(X.anillos[0], X.anillos[1]), Y_ESCOBILLAS, 0));
        // el poste junto a la base, con su brazo hasta la barra de las escobillas: por él sube el cable del campo
        const [px, pz] = SITIO.soporte;
        const poste = malla([
            new THREE.BoxGeometry(0.08, Y_ESCOBILLAS + 0.08, 0.08).translate(px, (Y_ESCOBILLAS + 0.08) / 2, pz),
            new THREE.BoxGeometry(0.08, 0.08, -0.25 - pz).translate(px, Y_ESCOBILLAS + 0.04, (pz - 0.25) / 2),
        ], M.galv);
        raiz.add(poste);
        partes.escobillas.push(poste);
    }

    // --------- la excitación: los gabinetes del sistema Unitrol y su transformador
    const excitacion = unidad('excitacion');
    {
        const [x, z] = SITIO.excitacion;
        for (const dx of [-0.36, 0, 0.36]) {
            excitacion.add(en(caja(0.34, 1.2, 0.5, M.marfil), x + dx, 0, z));
            excitacion.add(en(caja(0.18, 0.05, 0.01, M.verde), x + dx, 1.0, z + 0.255));
        }
        excitacion.add(en(caja(0.7, 0.8, 0.6, M.trafo), SITIO.trafoExc[0], 0, SITIO.trafoExc[1]));
        plano(raiz, 'Excitación', x, z + 0.6, 1.0);
    }

    // --------- el hidrógeno: las botellas y su tablero
    const hidrogeno = unidad('hidrogeno');
    {
        const [x, z] = SITIO.hidrogeno;
        for (let k = 0; k < 5; k++) hidrogeno.add(en(cil(0.09, 0.9, M.botella), x - 0.36 + k * 0.18, 0, z - 0.15));
        hidrogeno.add(en(caja(0.9, 0.05, 0.05, M.galv), x, 0.75, z - 0.05));
        hidrogeno.add(en(caja(0.5, 0.6, 0.12, M.marfil), x, 0.45, z + 0.22));
        hidrogeno.add(en(cil(0.06, 0.02, M.marfil), x, 0.85, z + 0.29).rotateX(PI / 2));
        plano(raiz, 'Hidrógeno', x, z + 0.62, 0.9);
    }

    // --------- el agua de los devanados: tanque, bomba y enfriador
    const agua = unidad('agua');
    {
        const [x, z] = SITIO.agua;
        agua.add(en(cil(0.24, 0.75, M.tanqueAzul), x - 0.25, 0, z));
        agua.add(en(caja(0.35, 0.3, 0.3, M.grafito), x + 0.2, 0, z - 0.1));
        agua.add(en(caja(0.4, 0.5, 0.3, M.marfil), x + 0.25, 0, z + 0.25));
        plano(raiz, 'Agua del estator', x, z + 0.62, 1.0);
    }

    // --------- el bus de fase aislada: tres ductos, uno por fase, del generador al transformador
    const bus = unidad('bus');
    const by = SITIO.bus.y;
    {
        const g = [];
        for (const k of [-1, 0, 1]) {
            const xk = -0.6 - 0.32 * k;
            const zk = SITIO.bus.z + 0.32 * k;
            g.push(geoEntre([xk, 0.12, 0.62], [xk, by, 0.62], 0.11, 14));
            g.push(geoEntre([xk, by, 0.62], [xk, by, zk], 0.11, 14));
            g.push(geoEntre([xk, by, zk], [SITIO.bus.x[1], by, zk], 0.11, 14));
            g.push(new THREE.SphereGeometry(0.11, 12, 8).translate(xk, by, zk), new THREE.SphereGeometry(0.11, 12, 8).translate(xk, by, 0.62));
        }
        bus.add(malla(g, M.bus));
        // soportes
        const s = [];
        for (let x = 0.4; x < SITIO.bus.x[1]; x += 1.2) s.push(new THREE.BoxGeometry(0.06, by, 0.9).translate(x, by / 2, SITIO.bus.z));
        bus.add(malla(s, M.galv));
    }

    // --------- el interruptor de generador (52G): verde cerrado, rojo abierto
    const interruptor = unidad('interruptor');
    let foco52 = null;
    {
        const [x, z] = SITIO.interruptor;
        interruptor.add(en(caja(0.7, 1.0, 1.05, M.marfil), x, 0, z));
        foco52 = en(caja(0.18, 0.12, 0.02, M.rojo), x, 0.82, z + 0.535);
        interruptor.add(foco52);
        brillo(interruptor, x, 0.9, z + 0.6, 0.9, '#ffb000', 'golpe', 1.5, false);
        plano(raiz, 'Interruptor 52G', x, z + 0.95, 1.0);
    }

    // --------- el sincronoscopio: un tablero con su carátula y tres focos (voltaje, frecuencia y ángulo)
    const sincro = unidad('sincro');
    let aguja = null;
    const focos = [];
    {
        const [x, z] = SITIO.sincro;
        sincro.add(en(caja(1.3, 1.7, 0.16, M.grafito), x, 0, z - 0.06));
        const cara = new THREE.Mesh(new THREE.CircleGeometry(0.36, 48), new THREE.MeshBasicMaterial({ map: caratula(oscuro), toneMapped: false }));
        cara.position.set(x, 1.1, z + 0.025);
        sincro.add(cara);
        aguja = new THREE.Group();
        aguja.add(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.3, 0.01).translate(0, 0.14, 0), M.aguja));
        aguja.add(new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), M.aguja));
        aguja.position.set(x, 1.1, z + 0.035);
        sincro.add(aguja);
        for (const k of [-1, 0, 1]) { const f = en(caja(0.12, 0.12, 0.02, M.apagado), x + k * 0.3, 0.55, z + 0.03); sincro.add(f); focos.push(f); }
        plano(raiz, 'Sincronoscopio', x, Z1 - 0.12, 1.1);
    }

    // --------- el transformador elevador: de 20 kV a la tensión de la red, y la salida de la línea
    const transformador = unidad('transformador');
    {
        const [x, z] = SITIO.transformador;
        transformador.add(en(caja(1.2, 1.5, 1.1, M.trafo), x, 0, z));
        const fins = [];
        for (let k = 0; k < 7; k++) fins.push(new THREE.BoxGeometry(0.04, 1.1, 0.3).translate(x - 0.45 + k * 0.15, 0.7, z + 0.7), new THREE.BoxGeometry(0.04, 1.1, 0.3).translate(x - 0.45 + k * 0.15, 0.7, z - 0.7));
        transformador.add(malla(fins, M.trafo));
        for (const dz of [-0.35, 0, 0.35]) transformador.add(en(cil(0.05, 0.65, M.porcelana, 0.035), x + 0.2, BORNES.boquillas[1] - 0.65, z + dz));
        // la caja donde los tres ductos del bus entran al tanque
        transformador.add(en(caja(0.16, 0.38, 0.96, M.bus), x - 0.66, SITIO.bus.y - 0.19, z));
        // el pórtico de salida: de su viga cuelgan los aisladores de las tres fases
        const { x: xp, y: yp, ancho } = SITIO.portico;
        for (const dz of [-ancho / 2 + 0.06, ancho / 2 - 0.06]) transformador.add(en(cil(0.05, yp + 0.08, M.galv), xp, 0, z + dz));
        transformador.add(en(caja(0.12, 0.08, ancho, M.galv), xp, yp, z));
        crearLineasAereas({ raiz, lineas: LINEAS, partes, parteDe: () => 'transformador', movil });
        plano(raiz, 'Transformador elevador', x, z + 0.95, 1.6);
    }

    // --------- al desarmar: el estator se abre hacia atrás, las barras y el núcleo salen, la turbina se destapa
    for (const [g, d] of [[escobillas, [0.6, 0.4, 0]], [excitacion, [0, 0, -0.5]], [interruptor, [0, 0.6, 0]]]) mover(g, d);

    // --------- lo que corre por los tubos y los cables
    const tubos = crearTubos({ raiz, lineas: LINEAS, fluidos: FLUIDOS, M, partes, parteDe: L => (L.id === 'campo' ? 'excitacion' : L.id === 'h2' ? 'hidrogeno' : L.id === 'agua' ? 'agua' : null), movil });

    const anclas = {};
    for (const p of PARTES) { const o = new THREE.Object3D(); o.position.set(...p.ancla); raiz.add(o); anclas[p.id] = o; }

    // ---------- posar
    function posar(e) {
        const act = p => (p === 'noche' ? e.noche : p === 'siempre' ? 1 : p ? (e.activo[p] ?? 0) : 1);
        const a = sale(e.desarme * 3);
        const ab = { ...(e.abierta || {}) };
        kit.posar(e, act, ab, { apagar: a });
        tubos.posar(e, a);
        // el devanado de campo brilla con su corriente
        M.cobreCampo.emissive.set('#ff5a1f').multiplyScalar(0.35 * (e.activo.campo ?? 0) * Math.max(ab.campo ?? 0, e.adentro * 0.5));
        // el sincronoscopio
        aguja.rotation.z = -(e.aguja * PI) / 180;
        const L = e.lectura;
        if (e.modo === 'sincronizar') focos.forEach((f, i) => { f.material = [L.ok.dV, L.ok.df, L.ok.dA][i] ? M.verde : M.ambar; });
        else focos.forEach(f => { f.material = e.cerrado ? M.verde : M.apagado; });
        foco52.material = e.cerrado ? M.verde : M.rojo;
        // si se sale de paso, el rotor tiembla
        rotorGira.position.y = ey + (e.fueraDePaso ? Math.sin(e.t * 40) * 0.01 : 0);
        M.lampara.color.set('#9a9c9f').lerp(new THREE.Color('#ffe2ad'), e.noche);
        M.ventana.color.set('#3f4a57').lerp(new THREE.Color('#ffc77a'), e.noche);
    }
    return { raiz, posar, partes, anclas, giran, repintar: kit.repintar };
}
