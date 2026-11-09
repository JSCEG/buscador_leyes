// La central eólica, hecha con código. Sistema Búho: una franja de terreno cortada de frente con tres aerogeneradores en fila con el viento. El primero
// lleva todo por dentro: aspas con su paso, buje, eje, multiplicadora, freno, generador, convertidor, orientación, torre y cimentación. Después, la
// subestación y la salida a la red. Las cubiertas se vuelven vidrio (adentro = 1) y cada equipo se separa en sus piezas (desarme = 1).
//
//   materiales(P)     escenario(renderer, scene, M, { movil, oscuro })
//   construir(M, P, { movil, oscuro }) → { raiz, posar(e), partes, anclas, giran, repintar }
import * as THREE from 'three';
import { azar, clamp01, lerp, sale } from '../planta-comun/ayudas.js';
import { aro, caja, cil, cilZ, crearAyudante, crearTubos, en, entre, estudio, geoTorre, materialesBase, sombra } from '../planta-comun/piezas.js';
import { AEROS, BLOQUE, EQUIPOS, FLUIDOS, LINEAS, MASTIL, PARTES, ROTOR, SEP_VISTA, TORRES, VIENTO } from './modelo.js';

const PI = Math.PI;
const D2R = PI / 180;
export const P_PLANTA = {
    papel: '#fafafa', noche: '#0a0e12', tinta: '#171317', marfil: '#f3f1ec', grafito: '#303137', acero: '#a7abb3', guinda: '#9b2247', rosa: '#e57a9a',
    tierraDia: '#d3d5c6', tierraNoche: '#23272c', losaDia: '#dcdcda', losaNoche: '#2c3036', suelo: '#b9a688',
};

export function materiales(P) {
    const M = materialesBase(P, FLUIDOS);
    const env = { envMapIntensity: 0.8 };
    Object.assign(M, {
        blanco: new THREE.MeshPhysicalMaterial({ color: '#d6d7d5', roughness: 0.46, clearcoat: 0.35, clearcoatRoughness: 0.35, ...env }),
        aspa: new THREE.MeshPhysicalMaterial({ color: '#d4d4d1', roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3, ...env }),
        puntaAspa: new THREE.MeshPhysicalMaterial({ color: P.guinda, roughness: 0.4, clearcoat: 0.5, ...env }),
        zapata: new THREE.MeshStandardMaterial({ color: '#cfccc5', roughness: 0.9, envMapIntensity: 0.3, transparent: true, side: THREE.DoubleSide }),
        grava: new THREE.MeshStandardMaterial({ color: '#b9b6ad', roughness: 1, envMapIntensity: 0.25 }),
        engrane: new THREE.MeshStandardMaterial({ color: '#b6bac2', roughness: 0.3, metalness: 0.9, envMapIntensity: 1 }),
        estela: new THREE.MeshBasicMaterial({ color: '#7fb2d6', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }),
        pozo: new THREE.MeshBasicMaterial({ color: '#2b2622', transparent: true, opacity: 0, depthWrite: false }),
        alerta: new THREE.MeshBasicMaterial({ color: '#ff2b3a', toneMapped: false }),
        ventilador: new THREE.MeshStandardMaterial({ color: '#4d5057', roughness: 0.5, metalness: 0.6, side: THREE.DoubleSide }),
    });
    return M;
}

const Y0 = BLOQUE.y[0];
export function escenario(renderer, scene, M, { movil = false, oscuro = false } = {}) {
    const P = M.P;
    const dia = { tierra: new THREE.Color(oscuro ? '#9c9e90' : P.tierraDia), losa: new THREE.Color(oscuro ? '#9a9b9a' : P.losaDia), concreto: new THREE.Color(oscuro ? '#a5a39c' : '#cfccc5'), grava: new THREE.Color(oscuro ? '#8f8d86' : '#b9b6ad'), suelo: new THREE.Color(P.suelo) };
    const noche = { tierra: new THREE.Color(P.tierraNoche), losa: new THREE.Color(P.losaNoche), concreto: new THREE.Color('#383c42'), grava: new THREE.Color('#2e3136'), suelo: new THREE.Color('#2d2b28') };
    if (oscuro) M.torre.color.set('#8f929a');
    return estudio(renderer, scene, {
        movil, oscuro, y0: Y0, alcance: 15,
        alActualizar(n) {
            M.tierra.color.copy(dia.tierra).lerp(noche.tierra, n);
            M.losa.color.copy(dia.losa).lerp(noche.losa, n);
            M.concreto.color.copy(dia.concreto).lerp(noche.concreto, n);
            M.grava.color.copy(dia.grava).lerp(noche.grava, n);
            M.suelo.color.copy(dia.suelo).lerp(noche.suelo, n * 0.8);
        },
    });
}

/** Un aspa a lo largo de +y: raíz redonda, cuerda más ancha cerca de la raíz, torcida y afilada hacia la punta. */
function geoAspa(R, seg = 7) {
    const estaciones = 15;
    const pos = [];
    const idx = [];
    for (let i = 0; i <= estaciones; i++) {
        const k = i / estaciones;
        const r = 0.17 + k * (R - 0.17);
        const raiz = clamp01((0.16 - k) / 0.16);
        const cuerda = lerp(0.2 * (1 - k) ** 0.8 + 0.018, 0.075, raiz);
        const grueso = lerp(cuerda * 0.2, 0.075, raiz);
        const giro = (22 * (1 - k) ** 2) * D2R;
        for (let j = 0; j < seg; j++) {
            const a = (j / seg) * PI * 2;
            // el borde de ataque va adelante: la sección es más gorda hacia un lado
            const cx = Math.cos(a) * cuerda * 0.5 - cuerda * 0.14 * (1 - raiz);
            const cz = Math.sin(a) * grueso * 0.5;
            pos.push(cx * Math.cos(giro) - cz * Math.sin(giro), r, cx * Math.sin(giro) + cz * Math.cos(giro));
        }
    }
    for (let i = 0; i < estaciones; i++) {
        for (let j = 0; j < seg; j++) {
            const [a, b, c, d] = [i * seg + j, i * seg + (j + 1) % seg, (i + 1) * seg + j, (i + 1) * seg + (j + 1) % seg];
            idx.push(a, c, b, b, c, d);
        }
    }
    const punta = pos.length / 3;
    pos.push(0, R + 0.02, 0);
    for (let j = 0; j < seg; j++) idx.push(estaciones * seg + j, punta, estaciones * seg + (j + 1) % seg);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
}

export function construir(M, P, { movil = false, oscuro = false } = {}) {
    const raiz = new THREE.Group();
    const ids = PARTES.map(p => p.id);
    const kit = crearAyudante(M, raiz, ids, { movil });
    const { partes, giran, unidad, mover, brillo, cub, rotular } = kit;
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
        // la zanja de los cables, el camino de servicio y la grava de la subestación
        losa(-5, 3.5, 2.84, 3.12, M.concreto);
        losa(3.36, 3.86, 1.5, 3.12, M.concreto);
        losa(4.34, 4.62, -1.8, 0.55, M.concreto);
        losa(3.85, 6.75, 0.45, 2.55, M.grava);
        // el camino une las plataformas
        AEROS.forEach(t => { const c = new THREE.Mesh(new THREE.CircleGeometry(1.18, 40).rotateX(-PI / 2), M.losa); c.position.set(t.x, 0.012, t.z); c.receiveShadow = true; terreno.add(c); });
    }

    const geoA = geoAspa(ROTOR.R);
    const geoPuntaA = new THREE.CylinderGeometry(0.012, 0.03, 0.2, 7).translate(0, ROTOR.R - 0.1, 0);
    const rotores = [];
    const gondolas = [];
    let alza;
    let pozo;
    const lucesAvion = [];

    // --------- un aerogenerador
    function aerogenerador(i, T) {
        const principal = i === 0;
        const dueno = id => (principal ? id : 'estela');
        const padre = new THREE.Group();
        padre.position.set(T.x, 0, T.z);
        raiz.add(padre);
        if (principal) alza = padre;

        // torre: un tubo de acero que se adelgaza, por tramos
        const gT = unidad(dueno('torre'), 0, 0, padre);
        const H = ROTOR.H;
        const matTorre = principal ? cub('torreC', ['torre'], { color: '#d6d7d5' }) : M.blanco;
        const perfil = [[0, 0.21], [H * 0.34, 0.178], [H * 0.68, 0.145], [H, 0.115]].map(([y, r]) => new THREE.Vector2(r, y));
        const torre = sombra(new THREE.Mesh(new THREE.LatheGeometry(perfil, 24), matTorre));
        gT.add(torre);
        for (const k of [0.34, 0.68]) gT.add(en(aro(lerp(0.21, 0.115, k) + 0.004, 0.008, M.acero), 0, H * k, 0));
        gT.add(en(cil(0.29, 0.06, M.concreto, 0.29, 30), 0, 0, 0));
        if (principal) {
            // puerta, escalera y cables
            gT.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.012), M.grafito), 0, 0.2, 0.208));
            gT.add(en(caja(0.016, H - 0.1, 0.016, M.acero), -0.05, 0.06, 0));
            gT.add(en(caja(0.016, H - 0.1, 0.016, M.acero), 0.05, 0.06, 0));
            for (let k = 0; k < 18; k++) gT.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.008, 0.008), M.acero), 0, 0.2 + k * 0.19, 0));
            for (const k of [0.34, 0.68]) gT.add(en(new THREE.Mesh(new THREE.CylinderGeometry(lerp(0.2, 0.11, k), lerp(0.2, 0.11, k), 0.008, 24), M.grafito), 0, H * k, 0));
        }

        // transformador de media tensión, al pie
        const [bx, bz] = [0.42, 0.42];
        const gB = unidad(dueno('convertidor'), bx, bz, padre);
        const cB = principal ? cub('baseT', ['convertidor'], { color: '#5a5c63', metal: 0.5 }) : new THREE.MeshStandardMaterial({ color: '#5a5c63', metalness: 0.5, roughness: 0.5 });
        gB.add(en(caja(0.3, 0.34, 0.3, cB), 0, 0.03, 0));
        gB.add(en(caja(0.36, 0.03, 0.36, M.concreto), 0, 0, 0));
        if (principal) for (const k of [-0.07, 0.07]) gB.add(en(cil(0.05, 0.2, M.cobre, 0.05, 12), k, 0.07, 0));

        // góndola
        const G = new THREE.Group();
        G.position.set(0, H, 0);
        G.rotation.y = ROTOR.yaw;
        padre.add(G);
        gondolas.push(G);
        const ejeY = 0.22;

        // orientación: corona y motores
        const gO = unidad(dueno('orientacion'), 0, 0, G);
        gO.add(aro(0.125, 0.018, M.acero));
        if (principal) {
            for (let k = 0; k < 4; k++) {
                const a = (k / 4) * PI * 2 + PI / 4;
                gO.add(en(cil(0.028, 0.13, M.guinda, 0.028, 10), Math.cos(a) * 0.15, 0.03, Math.sin(a) * 0.15));
            }
            gO.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.05, 1.5), M.grafito), 0, 0.09, -0.12));
            gO.add(en(entre([0.12, 0.72, -1.2], [0.12, 0.92, -1.2], 0.006, M.acero), 0, 0, 0));
            gO.add(en(entre([-0.12, 0.72, -1.2], [-0.12, 0.92, -1.2], 0.006, M.acero), 0, 0, 0));
            // veleta y anemómetro, atrás del techo
            const veleta = new THREE.Group();
            veleta.position.set(0.12, 0.93, -1.2);
            veleta.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.06, 0.13), M.guinda), 0, 0, -0.04));
            gO.add(veleta);
            const copas = new THREE.Group();
            copas.position.set(-0.12, 0.93, -1.2);
            for (let k = 0; k < 3; k++) { const a = (k / 3) * PI * 2; copas.add(entre([0, 0, 0], [Math.cos(a) * 0.05, 0, Math.sin(a) * 0.05], 0.003, M.grafito)); copas.add(en(new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), M.grafito), Math.cos(a) * 0.05, 0, Math.sin(a) * 0.05)); }
            gO.add(copas);
            giran.push({ obj: copas, eje: 'y', vel: e => 2 + 9 * e.activo.viento });
        }

        // cubierta de la góndola
        const gC = unidad(dueno('generador'), 0, 0, G);
        const matC = principal ? cub('gondolaC', ['eje', 'multiplicadora', 'generador', 'convertidor', 'orientacion'], { color: '#d6d7d5' }) : M.blanco;
        const cubierta = new THREE.Group();
        cubierta.add(en(caja(0.64, 0.58, 2.05, matC), 0, 0.13, -0.42));
        cubierta.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.14, 0.34).translate(0, 0.07, 0), matC), 0, 0.44, 0.43));
        cubierta.children[1].rotation.x = 0.5;
        if (principal) {
            cubierta.add(en(caja(0.5, 0.05, 0.36, cub('radiador', ['generador'], { color: '#c6cad0' })), 0, 0.72, -1.05));
            for (let k = 0; k < 7; k++) cubierta.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.008, 0.012), M.grafito), 0, 0.775, -1.2 + k * 0.05));
        }
        G.add(gC);
        gC.add(principal ? mover(cubierta, [0, 1.5, 0]) : cubierta);
        const luz = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), M.alerta);
        luz.position.set(0, 0.74, -1.38);
        G.add(luz);
        lucesAvion.push(luz);
        brillo(G, 0, 0.74, -1.38, 0.6, '#ff3b4a', 'noche', 0.8);

        if (principal) {
            // eje principal con su cojinete, y el freno en el eje rápido
            const gE = unidad('eje', 0, 0, G);
            gE.add(en(cilZ(0.105, 0.14, M.grafito, 22), 0, ejeY, 0.55));
            const ejeLento = cilZ(0.055, 0.66, M.acero, 16);
            ejeLento.position.set(0, ejeY, 0.32);
            const vLento = e => (e.rotores[0].rpm * 2 * PI) / 60;
            const gLento = new THREE.Group();
            gLento.add(ejeLento);
            gE.add(gLento);
            const gRapido = new THREE.Group();
            gRapido.position.set(0, ejeY - 0.03, -0.56);
            gRapido.add(cilZ(0.018, 0.34, M.acero, 12));
            gRapido.add(en(cilZ(0.085, 0.014, M.engrane, 26), 0, 0, 0.06));
            gE.add(gRapido);
            giran.push({ obj: gRapido, eje: 'z', vel: e => vLento(e) * 12 });
            // la mordaza del freno, sobre el disco
            gE.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), M.guinda), 0, ejeY + 0.06, -0.5));

            // multiplicadora: una cubierta y sus etapas
            const gM = unidad('multiplicadora', 0, 0, G);
            const cajaM = cub('multiplicadoraC', ['multiplicadora'], { color: '#8d919a', metal: 0.5 });
            const carcasa = new THREE.Group();
            carcasa.add(en(cilZ(0.2, 0.2, cajaM, 28), 0, ejeY, -0.12));
            carcasa.add(en(cilZ(0.16, 0.12, cajaM, 26), 0, ejeY, -0.28));
            carcasa.add(en(cilZ(0.11, 0.09, cajaM, 22), 0, ejeY - 0.03, -0.39));
            gM.add(mover(carcasa, [0, 0, 0]));
            const corona = aroZ(0.15, 0.022, M.engrane);
            corona.position.set(0, ejeY, -0.12);
            gM.add(corona);
            const planetas = new THREE.Group();
            planetas.position.set(0, ejeY, -0.12);
            for (let k = 0; k < 3; k++) {
                const a = (k / 3) * PI * 2;
                planetas.add(en(cilZ(0.058, 0.08, M.engrane, 18), Math.cos(a) * 0.09, Math.sin(a) * 0.09, 0));
            }
            planetas.add(cilZ(0.034, 0.1, M.cobre, 16));
            gM.add(planetas);
            giran.push({ obj: planetas, eje: 'z', vel: e => vLento(e) * 2.4 });
            const segunda = new THREE.Group();
            segunda.position.set(0, ejeY, -0.28);
            for (let k = 0; k < 3; k++) {
                const a = (k / 3) * PI * 2;
                segunda.add(en(cilZ(0.04, 0.06, M.engrane, 16), Math.cos(a) * 0.065, Math.sin(a) * 0.065, 0));
            }
            segunda.add(cilZ(0.024, 0.08, M.cobre, 14));
            gM.add(segunda);
            giran.push({ obj: segunda, eje: 'z', vel: e => vLento(e) * 6 });

            // generador
            const gG = unidad('generador', 0, 0, G);
            const cubG = cub('generadorC', ['generador'], { color: '#5d7a97', metal: 0.4 });
            gG.add(mover(en(cilZ(0.16, 0.46, cubG, 28), 0, ejeY - 0.03, -0.88), [0, 1.05, 0]));
            for (let k = 0; k < 10; k++) {
                const a = (k / 10) * PI * 2;
                gG.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.4), M.cobre), Math.cos(a) * 0.125, ejeY - 0.03 + Math.sin(a) * 0.125, -0.88));
            }
            const rotorG = new THREE.Group();
            rotorG.position.set(0, ejeY - 0.03, -0.88);
            rotorG.add(cilZ(0.075, 0.38, M.acero, 16));
            for (let k = 0; k < 6; k++) { const a = (k / 6) * PI * 2; rotorG.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.014, 0.36), M.cobre), Math.cos(a) * 0.08, Math.sin(a) * 0.08, 0)); }
            gG.add(rotorG);
            giran.push({ obj: rotorG, eje: 'z', vel: e => vLento(e) * 12 });
            brillo(gG, 0, ejeY - 0.03, -0.88, 0.75, FLUIDOS.ca.color, 'gen', 0.28, false);

            // convertidor, en la cola
            const gV = unidad('convertidor', 0.04, 0, G);
            const cubV = cub('convertidorC', ['convertidor'], { color: '#e7e6e0' });
            gV.add(mover(en(caja(0.36, 0.34, 0.26, cubV), 0, 0.12, -1.26), [0, 1.05, 0]));
            for (let k = 0; k < 3; k++) gV.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.14), M.guinda), -0.11 + k * 0.11, 0.25, -1.26));
            gV.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.008), M.neonElec), 0.08, 0.38, -1.12));
        }

        // rotor: buje, nariz y tres aspas con su paso
        const rot = new THREE.Group();
        rot.position.set(0, ejeY, ROTOR.zBuje);
        G.add(principal ? mover(rot, [0, 0, 0.9]) : rot);
        const giro = new THREE.Group();
        rot.add(giro);
        giran.push({ obj: giro, eje: 'z', vel: e => -(e.rotores[i].rpm * 2 * PI) / 60 });
        const gBuje = unidad(dueno('paso'), 0, 0, giro);
        gBuje.position.set(0, 0, 0);
        gBuje.add(sombra(new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), M.grafito)));
        const matNariz = principal ? cub('nariz', ['paso'], { color: '#d6d7d5' }) : M.blanco;
        const nariz = new THREE.Mesh(new THREE.SphereGeometry(0.22, 22, 14), matNariz);
        nariz.scale.set(1, 1, 1.35);
        nariz.position.z = 0.1;
        gBuje.add(nariz);
        const palas = [];
        for (let k = 0; k < 3; k++) {
            const b = new THREE.Group();
            b.rotation.z = (k * 2 * PI) / 3;
            giro.add(b);
            const p = new THREE.Group();
            b.add(p);
            palas.push(p);
            const u = new THREE.Group();
            u.add(sombra(new THREE.Mesh(geoA, M.aspa)));
            u.add(new THREE.Mesh(geoPuntaA, M.puntaAspa));
            p.add(u);
            partes[dueno('aspas')].push(u);
            // anillo de la raíz y motor de paso
            if (principal) {
                gBuje.add(en(aro(0.075, 0.012, M.acero), Math.sin(-b.rotation.z) * 0.17, Math.cos(b.rotation.z) * 0.17, 0));
                const mot = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.09, 10), M.guinda);
                mot.position.set(Math.sin(-b.rotation.z) * 0.1, Math.cos(b.rotation.z) * 0.1, 0.075);
                gBuje.add(mot);
            }
        }
        rotores.push({ palas });

        // cimentación, bajo tierra: solo se ve cuando sube el aerogenerador
        if (principal) {
            const gF = unidad('cimentacion', 0, 0, padre);
            const puntos = [[0, -0.66], [1.08, -0.66], [1.08, -0.46], [0.34, -0.14], [0.31, 0.002], [0, 0.002]].map(([r, y]) => new THREE.Vector2(r, y));
            const zapata = sombra(new THREE.Mesh(new THREE.LatheGeometry(puntos, 36), M.zapata));
            gF.add(zapata);
            for (let k = 0; k < 3; k++) gF.add(en(aro(0.5 + k * 0.24, 0.01, M.acero), 0, -0.45, 0));
            for (let k = 0; k < 16; k++) {
                const a = (k / 16) * PI * 2;
                gF.add(en(cil(0.009, 0.24, M.acero, 0.009, 6), Math.cos(a) * 0.22, -0.04, Math.sin(a) * 0.22));
                gF.add(entre([Math.cos(a) * 0.18, -0.6, Math.sin(a) * 0.18], [Math.cos(a) * 1.02, -0.5, Math.sin(a) * 1.02], 0.006, M.acero));
            }
            pozo = new THREE.Mesh(new THREE.CircleGeometry(1.14, 40).rotateX(-PI / 2), M.pozo);
            pozo.position.set(T.x, 0.016, T.z);
            pozo.renderOrder = 1;
            raiz.add(pozo);
        }
    }
    AEROS.forEach((t, i) => aerogenerador(i, t));

    // --------- la estela: un cono que se abre detrás de cada rotor
    const conos = AEROS.map(t => {
        const largo = SEP_VISTA * 0.98;
        const g = new THREE.CylinderGeometry(ROTOR.R * 1.26, ROTOR.R, largo, 28, 1, true).translate(0, largo / 2, 0);
        const c = new THREE.Mesh(g, M.estela);
        c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(VIENTO.x, 0, VIENTO.z));
        c.position.set(t.x, ROTOR.H + 0.22, t.z);
        c.renderOrder = 4;
        c.visible = false;
        raiz.add(c);
        partes.estela.push(c);
        return c;
    });

    // --------- el mástil de medición
    {
        const g = unidad('viento', MASTIL.x, MASTIL.z);
        g.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.5), M.concreto), 0, 0.01, 0));
        g.add(cil(0.022, MASTIL.h, M.acero, 0.012, 10));
        for (const [a, b] of [[0, 1], [2.1, 1], [4.2, 1]]) g.add(entre([Math.cos(a) * 0.55, 0, Math.sin(a) * 0.55], [0, MASTIL.h * 0.8 * b, 0], 0.004, M.acero));
        [[0.52, 0.8], [0.76, 0.95], [1, 1]].forEach(([k]) => {
            const y = MASTIL.h * k;
            g.add(entre([0, y, 0], [0.18, y, 0], 0.005, M.acero));
            const copas = new THREE.Group();
            copas.position.set(0.18, y + 0.03, 0);
            for (let q = 0; q < 3; q++) {
                const a = (q / 3) * PI * 2;
                copas.add(entre([0, 0, 0], [Math.cos(a) * 0.06, 0, Math.sin(a) * 0.06], 0.003, M.grafito));
                copas.add(en(new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), M.grafito), Math.cos(a) * 0.06, 0, Math.sin(a) * 0.06));
            }
            g.add(copas);
            giran.push({ obj: copas, eje: 'y', vel: e => 2 + 12 * e.activo.viento * (0.8 + 0.2 * k) });
        });
        const r = rotular(g, 'Mástil de medición', 0, 0.07, 0.34, colorTexto, 0.9);
        r.rotation.x = -0.4;
    }

    // --------- subestación: junta los aerogeneradores y sube a alta tensión
    const transformador = (padre, id, nombre, x, z, esc = 1) => {
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
        brillo(g, 0, 0.36, 0.5, 0.6, FLUIDOS.ca.color, 'red', 0.14);
        return g;
    };
    {
        transformador(raiz, 'subestacion', 'tanqueAlta', 4.55, 1.45, 1.35);
        const g = unidad('subestacion', 0, 0);
        for (let i = 0; i < 3; i++) {
            const z = 0.95 + i * 0.5;
            g.add(en(caja(0.06, 0.5, 0.06, M.acero), 5.25, 0.02, z));
            g.add(en(cil(0.032, 0.32, M.marfil, 0.02, 10), 5.25, 0.52, z));
            for (let k = 0; k < 4; k++) g.add(en(aro(0.04, 0.007, M.marfil), 5.25, 0.56 + k * 0.07, z));
            g.add(en(caja(0.05, 0.42, 0.05, M.acero), 5.72, 0.02, z));
            g.add(en(cil(0.018, 0.26, M.marfil, 0.012, 8), 5.72, 0.44, z));
            g.add(entre([5.25, 0.85, z], [5.72, 0.72, z], 0.009, M.acero));
            g.add(entre([4.86, 1.07, 1.45 + (i - 1) * 0.3], [5.25, 0.85, z], 0.008, M.acero));
            g.add(entre([5.72, 0.72, z], [5.92, 1.2, z], 0.008, M.acero));
        }
        for (const z of [0.7, 2.2]) g.add(entre([5.92, 0, z], [5.92, 1.25, z], 0.02, M.acero));
        g.add(entre([5.92, 1.25, 0.66], [5.92, 1.25, 2.24], 0.02, M.acero));
        const p = unidad('subestacion', 6.48, 1.55);
        p.add(entre([-0.18, 0, 0], [-0.18, 2.6, 0], 0.024, M.acero), entre([0.18, 0, 0], [0.18, 2.6, 0], 0.024, M.acero), entre([-0.2, 2.6, 0], [0.2, 2.6, 0], 0.024, M.acero));
        p.add(entre([-0.18, 0, 0.3], [-0.18, 2.6, 0], 0.012, M.acero), entre([0.18, 0, -0.3], [0.18, 2.6, 0], 0.012, M.acero));
        for (const z of [-0.09, 0, 0.09]) p.add(en(cil(0.012, 0.1, M.marfil, 0.012, 8), 0, 2.62, z));
    }

    // --------- RNT y RGD: torres, subestación reductora, postes y pueblo
    {
        const u = unidad('red');
        const geoT = geoTorre(3.3);
        TORRES.forEach(([x, z]) => {
            const t = new THREE.Mesh(geoT, M.torre);
            t.position.set(x, 0, z);
            u.add(t);
            u.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.012, 0.56), M.losa), x, 0.006, z));
        });
        const rnt = LINEAS.find(l => l.id === 'rnt');
        for (const s of [-1, 1]) {
            const pts = rnt.puntos.map(([x, y, z]) => new THREE.Vector3(x + s * 0.1, y - 0.02, z + s * 0.03));
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

    // --------- árboles bajos y lámparas
    {
        const lista = [[-7.25, -3.9], [-6.2, -2.6], [-7.3, -0.6], [-3.7, -3.5], [-3, 3.9], [-6.9, 4.1], [1.3, 3.6], [0.4, -3.7], [2.1, 1.7], [7.3, -2.6], [6.6, -3.8], [2.7, 3.85]];
        const n = lista.length;
        const copa = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.14, 1).scale(1.2, 0.9, 1.2).translate(0, 0.14, 0), M.hoja, n);
        const m4x = new THREE.Matrix4();
        const qx = new THREE.Quaternion();
        lista.forEach(([x, z], i) => {
            const e = 0.75 + azar(i, 95) * 0.7;
            m4x.compose(new THREE.Vector3(x, 0, z), qx, new THREE.Vector3(e, e, e));
            copa.setMatrixAt(i, m4x);
        });
        copa.castShadow = true;
        raiz.add(copa);
    }
    [[3.72, 0.2], [6.9, 0.3], [3.2, 3.7]].forEach(([x, z]) => {
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

    // --------- el viento: hilos de aire que cruzan los rotores
    const nAire = movil ? 90 : 170;
    const mallaAire = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 5), M.fluido.aire, nAire);
    mallaAire.frustumCulled = false;
    raiz.add(mallaAire);
    const dirV = new THREE.Vector3(VIENTO.x, 0, VIENTO.z);
    const qAire = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirV);
    const perp = new THREE.Vector3(-VIENTO.z, 0, VIENTO.x);
    const LARGO = SEP_VISTA * 3.1;
    const hilos = Array.from({ length: nAire }, (_, i) => ({ s: azar(i, 11) * LARGO, t: (azar(i, 12) - 0.5) * 7.4, y: 0.7 + azar(i, 13) * 5.4, h: azar(i, 14) }));

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
    const m4 = new THREE.Matrix4();
    const v3 = new THREE.Vector3();
    const s3 = new THREE.Vector3();
    const o0 = new THREE.Vector3(AEROS[0].x, 0, AEROS[0].z);
    function posar(e) {
        const n = e.noche;
        const L = e.encendido;
        const act = p => (p === 'noche' ? n : p ? (e.activo[p] ?? 0) : 1);
        const d = e.desarme;
        const a = sale(d * 3);
        const ab = { ...(e.abierta || {}), desarmeV: sale(d * 2.2) };
        kit.posar(e, act, ab, { apagar: a });
        tubos.posar(e, a);
        // la góndola del primero sigue su desvío, y cada rotor su paso
        gondolas[0].rotation.y = ROTOR.yaw + (e.desvio ?? 0) * D2R;
        rotores.forEach((r, i) => { const b = e.rotores[i].beta * D2R; r.palas.forEach(p => { p.rotation.y = -b; }); });
        // para ver la cimentación, el aerogenerador sube
        const sube = Math.max(ab.cimentacion ?? 0, a * 0.35);
        alza.position.y = sube * 0.92;
        M.pozo.opacity = 0.75 * sube;
        M.zapata.opacity = lerp(1, 0.42, sube);
        M.zapata.depthWrite = sube < 0.4;
        pozo.visible = sube > 0.01;
        // la estela se ve en su modo y al elegirla
        const verEstela = Math.max(e.modo === 'estela' ? 1 : 0, ab.estela ?? 0) * (1 - a);
        const fuerza = clamp01(e.lectura.a.Ct / 0.8);
        M.estela.opacity = 0.09 * verEstela * (0.3 + 0.7 * fuerza);
        conos.forEach(c => { c.visible = verEstela > 0.02; });
        // el viento
        const v = e.v ?? 0;
        const u = e.u ?? [v, v, v];
        const nor = v > 0.1 ? [u[1] / v, u[2] / v] : [1, 1];
        for (let i = 0; i < nAire; i++) {
            const h = hilos[i];
            // detrás de un rotor, dentro de su estela, el aire va más despacio
            const enEstela = Math.abs(h.t) < ROTOR.R * 1.2 && Math.abs(h.y - (ROTOR.H + 0.22)) < ROTOR.R * 1.2;
            const tramo = h.s - SEP_VISTA;
            const f = !enEstela || tramo < 0 ? 1 : tramo < SEP_VISTA ? nor[0] : nor[1];
            h.s = (h.s + e.dt * (0.35 + v * 0.26) * f * (0.85 + h.h * 0.3)) % LARGO;
            const w = h.s / LARGO;
            const r = v < 0.4 || a > 0.5 ? 0.0001 : 0.0042 * Math.min(1, w * 8) * Math.min(1, (1 - w) * 8);
            v3.copy(o0).addScaledVector(dirV, h.s - SEP_VISTA * 0.62).addScaledVector(perp, h.t);
            v3.y = h.y;
            s3.set(Math.max(r, 0.0001), r > 0.0005 ? 0.1 + v * 0.018 : 0.0001, Math.max(r, 0.0001));
            mallaAire.setMatrixAt(i, m4.compose(v3, qAire, s3));
        }
        mallaAire.instanceMatrix.needsUpdate = true;
        // neones
        M.neonElec.color.set(FLUIDOS.ca.color).multiplyScalar((0.14 + 0.86 * e.activo.gen) * L);
        M.neonGuinda.color.set(P_PLANTA.rosa).multiplyScalar(0.5 * L);
        M.alerta.color.set('#4a1216').lerp(new THREE.Color('#ff2b3a'), n * (0.55 + 0.45 * Math.sin(e.t * 2.4)));
        M.lampara.color.set('#9a9c9f').lerp(new THREE.Color('#ffe2ad'), n);
        M.ventana.color.set('#3f4a57').lerp(new THREE.Color('#ffc77a'), n);
    }
    return { raiz, posar, partes, anclas, giran, repintar: kit.repintar, equipos: EQUIPOS };
}
