// El banco de pruebas del motor de la tesis, hecho con código. Sistema Búho: sobre la mesa, el motor WEG de 2 HP (agrandado), con su
// carcasa de aletas, su placa, su caja de conexiones, su ventilador y, por dentro, el núcleo y las bobinas del estator, el rotor de jaula
// de ardilla, el eje y los baleros; luego el torquímetro y el electrodinamómetro que lo frena. Al lado, el variador que lo alimenta, el
// analizador de potencia con los termopares y el banco de resistencias donde se quema lo que da el dinamómetro. Nada está a escala.
//
//   materiales(P)     escenario(renderer, scene, M, { movil, oscuro })
//   construir(M, P, { movil, oscuro }) → { raiz, posar(e), partes, anclas, giran, repintar }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { lerp, sale } from '../planta-comun/ayudas.js';
import { caja, cil, cilX, crearAyudante, crearTubos, en, estudio, materialesBase, sombra, texturaGrano } from '../planta-comun/piezas.js';
import { BLOQUE, BRAZO, EJE, FLUIDOS, LINEAS, MESA, MOTOR, PARTES, R, SITIO, X, giroVista } from './modelo.js';

const PI = Math.PI;
export const P_PLANTA = {
    papel: '#fafafa', noche: '#0a0e12', tinta: '#171317', marfil: '#f3f1ec', grafito: '#303137', acero: '#a7abb3', guinda: '#9b2247', rosa: '#e57a9a',
    tierraDia: '#d6d7c8', tierraNoche: '#23272c', losaDia: '#dcdcda', losaNoche: '#2c3036', suelo: '#b9a688',
};

export function materiales(P) {
    const M = materialesBase(P, FLUIDOS);
    Object.assign(M, {
        piso: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#cfccc6', 'rgba(0,0,0,0.08)', [8, 3]), roughness: 0.9, envMapIntensity: 0.25 }),
        mesa: new THREE.MeshStandardMaterial({ color: '#5d646c', roughness: 0.55, metalness: 0.5, envMapIntensity: 0.8 }),
        motorAzul: new THREE.MeshStandardMaterial({ color: '#2f6f9f', roughness: 0.45, metalness: 0.35, envMapIntensity: 0.8 }),
        dinamo: new THREE.MeshStandardMaterial({ color: '#3a3f46', roughness: 0.5, metalness: 0.5, envMapIntensity: 0.8 }),
        laminas: new THREE.MeshStandardMaterial({ color: '#6c7178', roughness: 0.42, metalness: 0.75, envMapIntensity: 0.9 }),
        aluminio: new THREE.MeshStandardMaterial({ color: '#c3c8cf', roughness: 0.3, metalness: 0.85, envMapIntensity: 1 }),
        cobreDev: new THREE.MeshStandardMaterial({ color: '#c8743c', roughness: 0.34, metalness: 0.85, envMapIntensity: 1, emissive: '#000000' }),
        placaDatos: new THREE.MeshStandardMaterial({ color: '#d9dde2', roughness: 0.35, metalness: 0.6 }),
        gabinete: new THREE.MeshStandardMaterial({ color: '#e9e6df', roughness: 0.5 }),
        pantalla: new THREE.MeshBasicMaterial({ color: '#1f3a4a', toneMapped: false }),
        rejilla: new THREE.MeshStandardMaterial({ color: '#8a8f96', roughness: 0.5, metalness: 0.6 }),
        verde: new THREE.MeshBasicMaterial({ color: '#2fb36a', toneMapped: false }),
        rojo: new THREE.MeshBasicMaterial({ color: '#e0302a', toneMapped: false }),
    });
    return M;
}

const [X0, X1] = BLOQUE.x;
const [Z0, Z1] = BLOQUE.z;
const Y0 = BLOQUE.y[0];
export function escenario(renderer, scene, M, { movil = false, oscuro = false } = {}) {
    const dia = new THREE.Color(oscuro ? '#c9c6c0' : '#ffffff');
    const noche = new THREE.Color('#5d5b58');
    return estudio(renderer, scene, { movil, oscuro, y0: Y0, alcance: 13, alActualizar(n) { M.piso.color.copy(dia).lerp(noche, n); } });
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
    // todo lo que gira lo hace a la velocidad del motor, y se frena o arranca poco a poco
    const girar = (obj) => { const r = { v: 0 }; giran.push({ obj, eje: 'x', vel: e => { r.v = lerp(r.v, giroVista(e.rpm), Math.min(1, (e.dt || 0.016) * 3)); return r.v; } }); };

    // --------- el piso y la mesa de pruebas
    {
        const g = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0, -Y0, Z1 - Z0).translate(0, Y0 / 2, 0), M.piso);
        g.receiveShadow = true;
        raiz.add(g);
        const [mx0, mx1] = MESA.x;
        const [mz0, mz1] = MESA.z;
        raiz.add(en(caja(mx1 - mx0, 0.08, mz1 - mz0, M.mesa), xm(mx0, mx1), MESA.y - 0.08, 0));
        const patas = [];
        for (const x of [mx0 + 0.15, mx1 - 0.15]) for (const z of [mz0 + 0.15, mz1 - 0.15]) patas.push(new THREE.BoxGeometry(0.12, MESA.y - 0.08, 0.12).translate(x, (MESA.y - 0.08) / 2, z));
        raiz.add(malla(patas, M.grafito));
        plano(raiz, 'Banco de pruebas', xm(mx0, mx1), mz1 + 0.35, 1.6);
    }

    // --------- el motor: carcasa de aletas, tapas y patas; se vuelve vidrio para ver adentro
    const carcasa = unidad('carcasa');
    const adentroIds = ['nucleo', 'bobinas', 'rotor', 'eje', 'baleros'];
    const [mx0, mx1] = X.motor;
    {
        const mat = cub('carcasa', adentroIds, { color: '#2f6f9f', metal: 0.35 });
        const g = new THREE.Group();
        const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(R.motor, R.motor, mx1 - mx0, 40, 1, true).rotateZ(PI / 2).translate(xm(mx0, mx1), ey, 0), mat);
        cuerpo.castShadow = true;
        g.add(cuerpo);
        const aletas = [];
        for (let k = 0; k < 28; k++) {
            const a = (k / 28) * PI * 2;
            if (Math.sin(a) < -0.75) continue; // abajo van las patas
            aletas.push(new THREE.BoxGeometry(mx1 - mx0 - 0.3, R.aletas - R.motor + 0.04, 0.025).translate(0, R.motor + (R.aletas - R.motor) / 2 - 0.02, 0).rotateX(a).translate(xm(mx0, mx1), ey, 0));
        }
        g.add(new THREE.Mesh(mergeGeometries(aletas), mat));
        for (const x of [mx0, mx1]) g.add(new THREE.Mesh(new THREE.CylinderGeometry(R.motor * 0.98, R.motor * 0.9, 0.16, 36).rotateZ(PI / 2).translate(x, ey, 0), mat));
        g.add(new THREE.Mesh(new THREE.BoxGeometry(mx1 - mx0 - 0.4, ey - R.motor - MESA.y + 0.15, 1.2).translate(xm(mx0, mx1), MESA.y + (ey - R.motor - MESA.y + 0.15) / 2, 0), mat));
        carcasa.add(g);
        mover(g, [0, 1.5, 0]);
        brillo(carcasa, xm(mx0, mx1), ey + 0.3, 0, 3.0, '#ff8a3c', 'calor', 1, false);
        plano(raiz, `Motor de ${MOTOR.hp} HP`, xm(mx0, mx1), MESA.z[1] - 0.15, 1.3);
    }

    // --------- la placa de datos, en un costado
    const placa = unidad('placa');
    {
        const [x, z] = SITIO.placa;
        placa.add(en(caja(0.62, 0.36, 0.02, M.placaDatos), x, ey - 0.02, z));
        const r = rotular(placa, `${MOTOR.hp} HP · ${MOTOR.polos} polos · ${MOTOR.V} V · ${MOTOR.rpm} rpm`, x, ey + 0.16, z + 0.012, '#171317', 0.58);
        r.rotation.y = 0;
        mover(placa, [0, 1.5, 0]);
    }

    // --------- la caja de conexiones, arriba
    const cajaCon = unidad('caja');
    {
        const [x, y] = SITIO.caja;
        cajaCon.add(en(caja(0.5, 0.36, 0.5, M.motorAzul), x, y - 0.16, 0));
        cajaCon.add(en(caja(0.54, 0.05, 0.54, M.motorAzul), x, y + 0.2, 0));
        for (let i = 0; i < 6; i++) cajaCon.add(en(cil(0.025, 0.06, M.cobre), x - 0.15 + (i % 3) * 0.15, y + 0.22, -0.08 + Math.floor(i / 3) * 0.16));
        brillo(cajaCon, x, y + 0.1, 0.2, 1.8, '#ffb000', 'golpe', 1.4, false);
        mover(cajaCon, [0, 2.1, 0]);
        // el poste de los cables, junto a la mesa: por él suben la alimentación y la medición, y su brazo llega a la caja
        const [px, pz] = SITIO.soporte;
        const poste = malla([
            new THREE.BoxGeometry(0.08, BRAZO.y, 0.08).translate(px, BRAZO.y / 2, pz),
            new THREE.BoxGeometry(0.08, 0.08, -0.25 - pz).translate(px, BRAZO.y - 0.04, (pz - 0.25) / 2),
        ], M.mesa);
        raiz.add(poste);
        partes.caja.push(poste);
    }

    // --------- adentro: el núcleo del estator (láminas) y sus bobinas
    const nucleo = unidad('nucleo');
    const bobinas = unidad('bobinas');
    const nx0 = mx0 + 0.3;
    const nx1 = mx1 - 0.3;
    {
        const g = [];
        const n = 18;
        const paso = (nx1 - nx0) / n;
        for (let i = 0; i < n; i++) {
            const perfil = [new THREE.Vector2(0.52, 0), new THREE.Vector2(0.78, 0), new THREE.Vector2(0.78, paso * 0.85), new THREE.Vector2(0.52, paso * 0.85)];
            g.push(new THREE.LatheGeometry(perfil, 40).rotateZ(-PI / 2).translate(nx0 + i * paso, ey, 0));
        }
        nucleo.add(malla(g.map(x => x.toNonIndexed()), M.laminas));
        // las bobinas: barras en las ranuras y sus cabezas a cada lado
        const b = [];
        for (let k = 0; k < 24; k++) {
            const a = (k / 24) * PI * 2;
            b.push(new THREE.BoxGeometry(nx1 - nx0 + 0.3, 0.05, 0.07).rotateX(a).translate(xm(nx0, nx1), ey + Math.cos(a) * 0.56, Math.sin(a) * 0.56));
        }
        for (const x of [nx0 - 0.12, nx1 + 0.12]) b.push(new THREE.TorusGeometry(0.6, 0.09, 10, 36).rotateY(PI / 2).translate(x, ey, 0));
        bobinas.add(malla(b.map(x => x.toNonIndexed()), M.cobreDev));
        mover(nucleo, [0, 0.9, 0], 0.3);
        mover(bobinas, [0, 0.9, 0], 0.3);
    }

    // --------- el rotor de jaula de ardilla, el eje, los baleros y el ventilador: giran juntos
    const rotor = unidad('rotor');
    const eje = unidad('eje');
    const baleros = unidad('baleros');
    const ventilador = unidad('ventilador');
    const gira = new THREE.Group();
    gira.position.set(0, ey, 0);
    raiz.add(gira);
    {
        const rx0 = nx0 + 0.05;
        const rx1 = nx1 - 0.05;
        const cuerpo = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, rx1 - rx0, 36).rotateZ(PI / 2).translate(xm(rx0, rx1), 0, 0), M.laminas);
        const barras = [];
        for (let k = 0; k < 20; k++) {
            const a = (k / 20) * PI * 2;
            // las barras van un poco torcidas, como en los rotores reales
            barras.push(new THREE.BoxGeometry(rx1 - rx0, 0.035, 0.06).rotateY(0.12).rotateX(a).translate(xm(rx0, rx1), Math.cos(a) * 0.455, Math.sin(a) * 0.455));
        }
        for (const x of [rx0, rx1]) barras.push(new THREE.TorusGeometry(0.43, 0.04, 8, 32).rotateY(PI / 2).translate(x, 0, 0));
        const gr = new THREE.Group();
        gr.add(sombra(cuerpo), malla(barras.map(x => x.toNonIndexed()), M.aluminio));
        rotor.add(gr);
        gira.add(rotor);
        eje.add(cilX(0.085, X.eje[1] - X.eje[0], M.acero));
        eje.children[0].position.x = xm(...X.eje);
        gira.add(eje);
        for (const x of [mx0 + 0.08, mx1 - 0.08]) baleros.add(en(new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.05, 10, 24).rotateY(PI / 2), M.acero), x, 0, 0));
        gira.add(baleros);
        // el ventilador con su tapa de rejilla
        const aspas = new THREE.Group();
        for (let k = 0; k < 8; k++) aspas.add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.62, 0.16).translate(0, 0.36, 0).rotateX((k / 8) * PI * 2), M.grafito));
        aspas.position.x = xm(...X.ventilador);
        ventilador.add(aspas);
        gira.add(ventilador);
        girar(gira);
        mover(gira, [0, 0, 1.7], 0.15);
    }
    {
        const mat = cub('tapaVentilador', ['ventilador'], { color: '#2f6f9f', metal: 0.35 });
        const [vx0, vx1] = X.ventilador;
        const tapa = new THREE.Mesh(new THREE.CylinderGeometry(R.motor * 0.98, R.motor * 0.98, vx1 - vx0, 36, 1, true).rotateZ(PI / 2).translate(xm(vx0, vx1), ey, 0), mat);
        const rej = new THREE.Mesh(new THREE.CircleGeometry(R.motor * 0.98, 36).rotateY(-PI / 2).translate(vx0, ey, 0), mat);
        rej.material.side = THREE.DoubleSide;
        const g = new THREE.Group();
        g.add(tapa, rej);
        ventilador.add(g);
        // la tapa no gira: va fuera del grupo que gira
        ventilador.remove(g);
        raiz.add(g);
        partes.ventilador.push(g);
        mover(g, [-0.9, 0, 0]);
    }

    // --------- el torquímetro, con sus coples
    const torquimetro = unidad('torquimetro');
    {
        const [tx0, tx1] = X.torquimetro;
        torquimetro.add(en(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, tx1 - tx0, 28).rotateZ(PI / 2), M.gabinete), xm(tx0, tx1), ey, 0));
        torquimetro.add(en(caja(0.5, ey - 0.28 - MESA.y, 0.5, M.grafito), xm(tx0, tx1), MESA.y, 0));
        torquimetro.add(en(caja(0.3, 0.16, 0.02, M.pantalla), xm(tx0, tx1), ey - 0.06, 0.29));
        for (const x of X.cople) torquimetro.add(en(cilX(0.16, 0.16, M.acero), x, ey, 0));
    }

    // --------- el electrodinamómetro: un generador que frena al motor
    const dinamometro = unidad('dinamometro');
    {
        const [dx0, dx1] = X.dinamometro;
        dinamometro.add(en(new THREE.Mesh(new THREE.CylinderGeometry(R.dinamometro, R.dinamometro, dx1 - dx0, 36).rotateZ(PI / 2), M.dinamo), xm(dx0, dx1), ey, 0));
        for (const x of [dx0, dx1]) dinamometro.add(en(new THREE.Mesh(new THREE.CylinderGeometry(R.dinamometro * 0.92, R.dinamometro * 0.92, 0.1, 32).rotateZ(PI / 2), M.grafito), x, ey, 0));
        dinamometro.add(en(caja(dx1 - dx0 - 0.3, ey - R.dinamometro - MESA.y + 0.1, 1.3, M.grafito), xm(dx0, dx1), MESA.y, 0));
        const marca = new THREE.Group();
        marca.add(en(caja(0.08, 0.3, 0.02, M.aluminio), 0, 0.5, 0));
        marca.position.set(dx1 + 0.06, ey, 0);
        dinamometro.add(marca);
        const disco = new THREE.Group();
        disco.add(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.04, 6).rotateZ(PI / 2), M.aluminio));
        disco.position.set(dx1 + 0.08, ey, 0);
        dinamometro.add(disco);
        girar(disco);
        plano(raiz, 'Electrodinamómetro', xm(dx0, dx1), MESA.z[1] - 0.15, 1.5);
    }

    // --------- el banco de resistencias, donde se quema lo que da el dinamómetro
    {
        const [x, z] = SITIO.resistencias;
        const g = [];
        g.push(new THREE.BoxGeometry(1.1, 1.4, 0.9).translate(x, 0.7, z));
        raiz.add(malla(g, M.rejilla));
        const tiras = [];
        for (let i = 0; i < 6; i++) tiras.push(new THREE.BoxGeometry(0.9, 0.04, 0.92).translate(x, 0.25 + i * 0.2, z));
        raiz.add(malla(tiras, M.grafito));
        brillo(raiz, x, 0.9, z + 0.5, 2.0, '#ff8a3c', 'resistencias', 1.4, false);
        plano(raiz, 'Banco de resistencias', x, z + 0.75, 1.5);
    }

    // --------- el variador (y arrancador) que alimenta al motor
    const variador = unidad('variador');
    let focoVar = null;
    {
        const [x, z] = SITIO.variador;
        variador.add(en(caja(1.1, 2.0, 0.7, M.gabinete), x, 0, z));
        variador.add(en(caja(0.45, 0.22, 0.02, M.pantalla), x, 1.55, z + 0.36));
        focoVar = en(caja(0.1, 0.08, 0.02, M.rojo), x + 0.35, 1.58, z + 0.36);
        variador.add(focoVar);
        for (let i = 0; i < 3; i++) variador.add(en(caja(0.14, 0.14, 0.02, M.grafito), x - 0.25 + i * 0.25, 1.15, z + 0.36));
        plano(raiz, 'Variador', x, z + 0.75, 1.0);
    }

    // --------- el analizador de potencia y el lector de los termopares, en su carro
    const analizador = unidad('analizador');
    const termopares = unidad('termopares');
    {
        const [x, z] = SITIO.analizador;
        analizador.add(en(caja(1.4, 0.06, 0.8, M.mesa), x, 0.95, z));
        const p = [];
        for (const dx of [-0.62, 0.62]) for (const dz of [-0.32, 0.32]) p.push(new THREE.BoxGeometry(0.05, 0.95, 0.05).translate(x + dx, 0.475, z + dz));
        analizador.add(malla(p, M.grafito));
        // los dos aparatos van a la orilla de atrás del carro, donde suben sus cables
        analizador.add(en(caja(0.7, 0.45, 0.4, M.gabinete), x + 0.2, 1.01, z - 0.2));
        analizador.add(en(caja(0.5, 0.28, 0.02, M.pantalla), x + 0.2, 1.1, z + 0.005));
        termopares.add(en(caja(0.3, 0.2, 0.25, M.grafito), x - 0.5, 1.01, z - 0.275));
        termopares.add(en(caja(0.18, 0.08, 0.02, M.pantalla), x - 0.5, 1.1, z - 0.145));
        // las puntas de los termopares, pegadas a la carcasa
        for (const xt of [-1.0, -0.5, -0.05]) termopares.add(en(new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), M.rojo), xt, ey + 0.3, R.aletas + 0.02));
        plano(raiz, 'Analizador de potencia', x, z + 0.7, 1.6);
    }

    // --------- lo que corre por los cables
    const tubos = crearTubos({ raiz, lineas: LINEAS, fluidos: FLUIDOS, M, partes, parteDe: L => (L.id === 'termopar' ? 'termopares' : null), movil });

    const anclas = {};
    for (const p of PARTES) { const o = new THREE.Object3D(); o.position.set(...p.ancla); raiz.add(o); anclas[p.id] = o; }

    // ---------- posar
    function posar(e) {
        const act = p => (p === 'noche' ? e.noche : p === 'siempre' ? 1 : p ? (e.activo[p] ?? 0) : 1);
        const a = sale(e.desarme * 3);
        const ab = { ...(e.abierta || {}) };
        kit.posar(e, act, ab, { apagar: a });
        tubos.posar(e, a);
        // las bobinas brillan con su corriente
        const ver = Math.max(e.adentro, ab.bobinas ?? 0, ab.nucleo ?? 0, ab.rotor ?? 0, 0.3);
        M.cobreDev.emissive.set('#ff5a1f').multiplyScalar(0.4 * (e.activo.calor ?? 0) * ver);
        focoVar.material = e.rpm > 1 || (e.activo.ca ?? 0) > 0 ? M.verde : M.rojo;
        M.lampara.color.set('#9a9c9f').lerp(new THREE.Color('#ffe2ad'), e.noche);
    }
    return { raiz, posar, partes, anclas, giran, repintar: kit.repintar };
}
