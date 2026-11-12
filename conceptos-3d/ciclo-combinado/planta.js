// La central de ciclo combinado, hecha con código. Sistema Búho: cubiertas de marfil sobre estructura de grafito y acero, en una franja de
// terreno cortada de frente. Dos trenes de turbina de gas con su generador, su recuperador de calor y su chimenea; una turbina de vapor con
// su generador y condensador; torre de enfriamiento; estación de gas, subestación y salida a la red. Cada fluido tiene su color y corre
// visible por tubos de vidrio. Las cubiertas se vuelven vidrio (adentro = 1) y cada equipo se separa en sus piezas (desarme = 1).
//
//   materiales(P)     escenario(renderer, scene, M, { movil, oscuro })
//   construir(M, P, { movil }) → { raiz, posar(e), partes, anclas, giran, repintar }
import * as THREE from 'three';
import { azar, clamp01, fract, lerp, sale } from '../planta-comun/ayudas.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { aro, aroX, caja, cil, cilX, cilZ, crearAyudante, crearTubos, en, entre, estudio, geoEntre, geoTorre, materialesBase, mediaCarcasa, recipienteGeo, sombra } from '../planta-comun/piezas.js';
import { MATERIAL_CONDUCTOR, crearLineasAereas } from '../planta-comun/conductores.js';
import { ALTO_CHIM, ALTO_PASO, ALTO_TORRE, BARRAS, BARRAS_GEN, BLOQUE, EJE_G, EQUIPOS, FLUIDOS, HRSG, LINEAS, PARTES, PORTICO, POSTES, REDUCTORA, ST, TORRES, TRAFOS, X, X_DOMOS, ZA, ZB } from './modelo.js';

const PI = Math.PI;
export const P_PLANTA = {
    papel: '#fafafa', noche: '#0a0e12', tinta: '#171317', marfil: '#f3f1ec', grafito: '#303137', acero: '#a7abb3', guinda: '#9b2247', rosa: '#e57a9a',
    tierraDia: '#c8c5be', tierraNoche: '#23272c', losaDia: '#dcdcda', losaNoche: '#2c3036', suelo: '#b7a78b',
};

export function materiales(P) {
    const M = materialesBase(P, FLUIDOS);
    const env = { envMapIntensity: 0.8 };
    Object.assign(M, {
        azul: new THREE.MeshPhysicalMaterial({ color: FLUIDOS.agua.color, roughness: 0.45, metalness: 0.1, clearcoat: 0.5, ...env }),
        verde: new THREE.MeshPhysicalMaterial({ color: FLUIDOS.gas.color, roughness: 0.45, metalness: 0.1, clearcoat: 0.5, ...env }),
        filtro: new THREE.MeshStandardMaterial({ color: '#8f939a', roughness: 0.8, metalness: 0.2 }),
        alabeF: new THREE.MeshStandardMaterial({ color: '#c8ccd4', roughness: 0.3, metalness: 0.85, envMapIntensity: 1 }),
        alabeC: new THREE.MeshStandardMaterial({ color: '#b08a6a', roughness: 0.32, metalness: 0.85, emissive: '#ff5a22', emissiveIntensity: 0, envMapIntensity: 1 }),
        tuboAP: new THREE.MeshStandardMaterial({ color: '#b4553f', roughness: 0.45, metalness: 0.7, emissive: '#ff3a1a', emissiveIntensity: 0, envMapIntensity: 0.8 }),
        tuboAM: new THREE.MeshStandardMaterial({ color: '#b98a4a', roughness: 0.45, metalness: 0.7, envMapIntensity: 0.8 }),
        tuboMP: new THREE.MeshStandardMaterial({ color: '#8d9198', roughness: 0.45, metalness: 0.75, envMapIntensity: 0.8 }),
        tuboBP: new THREE.MeshStandardMaterial({ color: '#5f7f9c', roughness: 0.45, metalness: 0.7, envMapIntensity: 0.8 }),
        tuboTorre: new THREE.MeshBasicMaterial({ color: FLUIDOS.torre.color, toneMapped: false }),
        relleno: new THREE.MeshStandardMaterial({ color: '#c7cbcf', roughness: 0.85, envMapIntensity: 0.3 }),
        agua: new THREE.MeshPhysicalMaterial({ color: '#38a6c9', roughness: 0.12, transparent: true, opacity: 0.7, clearcoat: 1, depthWrite: false }),
        llama: new THREE.MeshBasicMaterial({ color: '#ffb35c', transparent: true, opacity: 0, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }),
        alerta: new THREE.MeshBasicMaterial({ color: '#ff2b3a', toneMapped: false }),
    });
    return M;
}

const Y0 = BLOQUE.y[0];
export function escenario(renderer, scene, M, { movil = false, oscuro = false } = {}) {
    const P = M.P;
    const dia = { tierra: new THREE.Color(oscuro ? '#8f8c86' : P.tierraDia), losa: new THREE.Color(oscuro ? '#9a9b9a' : P.losaDia), concreto: new THREE.Color(oscuro ? '#a5a39c' : '#cfccc5') };
    const noche = { tierra: new THREE.Color(P.tierraNoche), losa: new THREE.Color(P.losaNoche), concreto: new THREE.Color('#383c42') };
    if (oscuro) M.torre.color.set('#8f929a');
    return estudio(renderer, scene, {
        movil, oscuro, y0: Y0, alcance: 14,
        alActualizar(n) {
            M.tierra.color.copy(dia.tierra).lerp(noche.tierra, n);
            M.losa.color.copy(dia.losa).lerp(noche.losa, n);
            M.concreto.color.copy(dia.concreto).lerp(noche.concreto, n);
        },
    });
}

/** Una caja cuyas dos tapas son rectángulos distintos, a lo largo de x: las transiciones entre lo redondo y lo cuadrado. */
function prismaX(x0, [ya0, ya1, za0, za1], x1, [yb0, yb1, zb0, zb1]) {
    const p = [[x0, ya0, za0], [x0, ya1, za0], [x0, ya1, za1], [x0, ya0, za1], [x1, yb0, zb0], [x1, yb1, zb0], [x1, yb1, zb1], [x1, yb0, zb1]];
    const g = new THREE.BufferGeometry();
    const caras = [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
    const pos = [];
    for (const [a, b, c, d] of caras) pos.push(...p[a], ...p[b], ...p[c], ...p[a], ...p[c], ...p[d]);
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    return g;
}

/** Un camino de tramos rectos y horizontales, corrido `d` a su izquierda en el piso (xz), con las esquinas a inglete. */
function aUnLado(puntos, d) {
    const normal = (a, b) => { const [dx, dz] = [b[0] - a[0], b[2] - a[2]]; const l = Math.hypot(dx, dz) || 1; return [-dz / l, dx / l]; };
    return puntos.map((p, i) => {
        const n1 = i > 0 ? normal(puntos[i - 1], p) : null;
        const n2 = i < puntos.length - 1 ? normal(p, puntos[i + 1]) : null;
        let m = n1 || n2;
        if (n1 && n2) { const k = 1 + n1[0] * n2[0] + n1[1] * n2[1]; m = [(n1[0] + n2[0]) / k, (n1[1] + n2[1]) / k]; }
        return [p[0] + d * m[0], p[1], p[2] + d * m[1]];
    });
}
/** Tres tubos paralelos por un camino: las tres fases de unas barras. */
function geoTresFases(puntos, sep, r) {
    const geos = [];
    for (const k of [-1, 0, 1]) {
        const p = aUnLado(puntos, k * sep);
        for (let i = 0; i < p.length - 1; i++) geos.push(geoEntre(p[i], p[i + 1], r, 12));
        for (let i = 1; i < p.length - 1; i++) geos.push(new THREE.SphereGeometry(r, 12, 8).translate(...p[i]));
    }
    return mergeGeometries(geos);
}

export function construir(M, P, { movil = false } = {}) {
    const raiz = new THREE.Group();
    const ids = PARTES.map(p => p.id);
    const kit = crearAyudante(M, raiz, ids, { movil });
    const { partes, giran, unidad, mover, brillo, luz, cub, gota, rotular } = kit;
    // el segundo tren: se hunde o sube según el arreglo
    const gDos = new THREE.Group();
    raiz.add(gDos);
    const plumas = [];
    const pluma = (x, y0, z, proceso, tam, alto, color, n = 7, padre = raiz) => {
        for (let i = 0; i < n; i++) {
            const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: M.vaho, color, transparent: true, depthWrite: false, opacity: 0 }));
            padre.add(s);
            plumas.push({ s, x, y0, z, proceso, tam, alto, u: i / n, h: azar(i, x + z) });
        }
    };

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
        const losa = (x0, x1, z0, z1, h = 0.03) => {
            const l = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, h, z1 - z0), M.losa);
            l.position.set((x0 + x1) / 2, h / 2, (z0 + z1) / 2);
            l.receiveShadow = true;
            terreno.add(l);
        };
        losa(-7.1, 3.85, ZA - 1.3, ZA + 1.3);
        losa(-7.1, 3.85, ZB - 1.3, ZB + 1.3);
        losa(3.85, 7.75, -0.85, 1.55);
        losa(3.85, 7.75, -3.8, -1.75);
        losa(-7.05, -4.15, 3, 4.25);
        losa(-1.15, 2.85, 2.95, 4.3);
    }

    const verticalesFiltro = movil ? 5 : 9;
    // --------- un tren de turbina de gas: generador, filtros, compresor, combustión, turbina, recuperador y chimenea
    function tren(t, z, padre) {
        const c = nombre => `${nombre}${t}`;
        const rotorVel = e => 14 * e.activo.tg;

        // --- primer generador, en el lado frío del eje
        {
            const g = unidad('gen1', -6.275, z, padre);
            const est = cub(c('estator'), ['gen1']);
            const carcasa = cilX(0.46, 1.15, est, 36);
            carcasa.position.y = EJE_G;
            g.add(mover(carcasa, [0, 1.5, 0]));
            for (const x of [-0.575, 0.575]) { const b = aroX(0.46, 0.026, M.grafito); b.position.set(x, EJE_G, 0); g.add(mover(b, [0, 1.5, 0])); }
            for (let i = 1; i < 8; i++) { const b = aroX(0.465, 0.008, M.acero); b.position.set(-0.575 + i * 0.144, EJE_G, 0); g.add(mover(b, [0, 1.5, 0])); }
            g.add(caja(1.05, EJE_G - 0.35, 0.72, M.concreto));
            for (let i = 5; i < 12; i++) {
                const a = (i / 16) * PI * 2;
                const b = new THREE.Mesh(new THREE.BoxGeometry(1, 0.05, 0.09), M.cobre);
                b.position.set(0, EJE_G + Math.cos(a) * 0.36, Math.sin(a) * 0.36);
                b.rotation.x = a;
                g.add(b);
            }
            const rotor = new THREE.Group();
            rotor.position.set(0, EJE_G, 0);
            rotor.add(cilX(0.13, 0.98, M.acero));
            // dos polos: a 3,600 vueltas por minuto dan 60 ciclos por segundo
            for (let i = 0; i < 2; i++) {
                const polo = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.1, 0.22), M.cobre);
                polo.position.set(0, i ? -0.2 : 0.2, 0);
                rotor.add(polo);
            }
            rotor.add(en(aroX(0.26, 0.012, M.neonElec), -0.5, 0, 0), en(aroX(0.26, 0.012, M.neonElec), 0.5, 0, 0));
            g.add(mover(rotor, [0, 0.8, 0]));
            giran.push({ obj: rotor, eje: 'x', vel: rotorVel });
            g.add(en(cilX(0.17, 0.2, M.marfil), -0.68, EJE_G, 0));
            brillo(g, 0, EJE_G, 0.5, 0.9, FLUIDOS.elec.color, 'gen1', 0.32);
        }

        // --- filtros de aire y entrada al compresor
        {
            const g = unidad('compresor', 0, z, padre);
            const [xa, xb] = X.filtro;
            const w = xb - xa;
            const casa = new THREE.Group();
            casa.position.y = 2.15;
            casa.add(en(caja(w, 1.1, 1.9, cub(c('filtros'), ['compresor'])), (xa + xb) / 2, 0, 0));
            for (const s of [-1, 1]) {
                const rejilla = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.1, 0.95), M.filtro);
                rejilla.position.set((xa + xb) / 2, 0.55, s * 0.955);
                if (s < 0) rejilla.rotation.y = PI;
                casa.add(rejilla);
                for (let i = 0; i <= verticalesFiltro; i++) casa.add(en(caja(0.016, 0.95, 0.03, M.grafito), xa + 0.05 + ((w - 0.1) * i) / verticalesFiltro, 0.07, s * 0.965));
                for (let i = 0; i < 4; i++) casa.add(en(caja(w - 0.1, 0.012, 0.06, M.acero), (xa + xb) / 2, 0.17 + i * 0.26, s * 0.975));
            }
            casa.add(en(caja(w + 0.06, 0.05, 1.96, M.grafito), (xa + xb) / 2, 1.1, 0));
            g.add(mover(casa, [0, 1.5, 0]));
            // patas de la casa de filtros
            for (const [x, s] of [[xa + 0.06, -1], [xa + 0.06, 1], [xb - 0.06, -1], [xb - 0.06, 1]]) g.add(en(caja(0.07, 2.15, 0.07, M.grafito), x, 0, s * 0.88));
            // ducto que baja y cámara de entrada
            const ducto = caja(X.ducto[1] - X.ducto[0], 1.65, 1.1, cub(c('entrada'), ['compresor']));
            ducto.position.set((X.ducto[0] + X.ducto[1]) / 2, 0.5, 0);
            g.add(mover(ducto, [-0.2, 0, 1.25]));
            // caen gotas al enfriar el aire
            for (let i = 0; i < 14; i++) gota('torre', 'enfriar', lerp(xa + 0.15, xb - 0.15, azar(i, 21)), (i % 2 ? 1 : -1) * 0.92, 3.1, 2.25, 0.8, 0.018, 0.004);
        }

        // --- compresor: el aire se aprieta, hilera por hilera
        const rotorC = new THREE.Group();
        {
            const g = unidad('compresor', 0, z, padre);
            const mat = cub(c('carcasaC'), ['compresor']);
            const [x0, x1] = X.comp;
            const perfil = [[x0, 0.06], [x0, 0.56], [x0 + 0.08, 0.54], [x1 - 0.1, 0.42], [x1, 0.43], [x1, 0.06]];
            const arriba = sombra(new THREE.Mesh(mediaCarcasa(perfil, true), mat));
            arriba.position.y = EJE_G;
            g.add(mover(arriba, [0, 1.6, 0]));
            const abajo = sombra(new THREE.Mesh(mediaCarcasa(perfil, false), mat));
            abajo.position.y = EJE_G;
            g.add(abajo);
            for (const s of [-1, 1]) g.add(mover(en(caja(x1 - x0, 0.026, 0.06, M.grafito), (x0 + x1) / 2, EJE_G - 0.013, s * 0.5), [0, 1.6, 0]));
            for (const x of [x0 + 0.5, x0 + 1, x1 - 0.1]) g.add(mover(en(aroX(lerp(0.54, 0.43, (x - x0) / (x1 - x0)) + 0.005, 0.01, M.grafito), x, EJE_G, 0), [0, 1.6, 0]));
            rotorC.position.set(0, EJE_G, 0);
            const perfilRotor = new THREE.LatheGeometry([[x0, 0.14], [x1, 0.28]].map(([x, r]) => new THREE.Vector2(r, x)), 20).rotateZ(-PI / 2);
            rotorC.add(new THREE.Mesh(perfilRotor, M.acero));
            const filas = 13;
            const porFila = movil ? 18 : 26;
            const alabes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.038, 1, 0.045), M.alabeF, filas * porFila);
            const m4 = new THREE.Matrix4();
            const q = new THREE.Quaternion();
            const eje = new THREE.Vector3(1, 0, 0);
            let k = 0;
            for (let i = 0; i < filas; i++) {
                const u = i / (filas - 1);
                const xf = lerp(x0 + 0.08, x1 - 0.08, u);
                const raizR = lerp(0.16, 0.28, u);
                const largo = lerp(0.34, 0.12, u);
                for (let j = 0; j < porFila; j++) {
                    const a = (j / porFila) * PI * 2;
                    q.setFromAxisAngle(eje, a);
                    const r = raizR + largo / 2;
                    m4.compose(new THREE.Vector3(xf, Math.cos(a) * r, Math.sin(a) * r), q, new THREE.Vector3(1, largo, 1));
                    alabes.setMatrixAt(k++, m4);
                }
            }
            alabes.castShadow = true;
            rotorC.add(alabes);
            g.add(mover(rotorC, [0, 0.72, 0]));
            giran.push({ obj: rotorC, eje: 'x', vel: rotorVel });
            // el eje sigue hasta el generador
            g.add(en(cilX(0.06, X.comp[0] - X.gen[1] + 0.05, M.acero), (X.gen[1] + X.comp[0]) / 2, EJE_G, 0));
            g.add(en(caja(x1 - x0 + 2.1, 0.55, 0.92, M.concreto), (x0 + X.turb[1]) / 2 + 0.05, 0, 0));
        }

        // --- combustión: un anillo de cámaras
        {
            const g = unidad('combustion', 0, z, padre);
            const mat = cub(c('carcasaQ'), ['combustion']);
            const [x0, x1] = X.comb;
            const xm = (x0 + x1) / 2;
            const perfil = [[x0, 0.43], [x0 + 0.1, 0.52], [x1 - 0.1, 0.52], [x1, 0.44]];
            const arriba = sombra(new THREE.Mesh(mediaCarcasa(perfil, true), mat));
            arriba.position.y = EJE_G;
            g.add(mover(arriba, [0, 1.6, 0]));
            const abajo = sombra(new THREE.Mesh(mediaCarcasa(perfil, false), mat));
            abajo.position.y = EJE_G;
            g.add(abajo);
            g.add(en(cilX(0.28, x1 - x0, M.acero), xm, EJE_G, 0));
            const anillo = new THREE.Group();
            anillo.position.set(xm, EJE_G, 0);
            const cans = movil ? 10 : 14;
            for (let i = 0; i < cans; i++) {
                const a = (i / cans) * PI * 2;
                const can = new THREE.Group();
                can.rotation.x = a;
                const cuerpo = cilX(0.075, 0.42, cub(c('latas'), ['combustion'], { color: '#aeb3bb', metal: 0.6 }), 14);
                cuerpo.position.y = 0.4;
                cuerpo.rotation.z = -0.28;
                can.add(cuerpo);
                const fuego = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.022, 0.4, 10).rotateZ(PI / 2), M.llama);
                fuego.position.y = 0.395;
                fuego.rotation.z = -0.28;
                fuego.renderOrder = 4;
                can.add(fuego);
                // boquilla de gas que entra por la pared
                const pico = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.2, 6), M.verde);
                pico.position.set(-0.22, 0.58, 0);
                can.add(pico);
                anillo.add(can);
            }
            g.add(mover(anillo, [0, 0.36, 0]));
            const coll = aroX(0.67, 0.02, M.verde);
            coll.position.set(xm - 0.22, EJE_G, 0);
            g.add(mover(coll, [0, 0.36, 0]));
            brillo(g, xm, EJE_G, 0.3, 1.1, '#ffb35c', 'llama', 0.42, false).material.depthTest = true;
            luz(g, xm, EJE_G + 0.2, 0.2, '#ff9040', 1.2, 'llama', 2.2);
        }

        // --- turbina: cuatro hileras (Siemens)
        {
            const g = unidad('turbinaGas', 0, z, padre);
            const mat = cub(c('carcasaT'), ['turbinaGas']);
            const [x0, x1] = X.turb;
            const perfil = [[x0, 0.44], [x0 + 0.08, 0.47], [x1, 0.64], [x1, 0.06]];
            const arriba = sombra(new THREE.Mesh(mediaCarcasa(perfil, true), mat));
            arriba.position.y = EJE_G;
            g.add(mover(arriba, [0, 1.6, 0]));
            const abajo = sombra(new THREE.Mesh(mediaCarcasa(perfil, false), mat));
            abajo.position.y = EJE_G;
            g.add(abajo);
            const rotor = new THREE.Group();
            rotor.position.set(0, EJE_G, 0);
            rotor.add(new THREE.Mesh(new THREE.LatheGeometry([[x0, 0.28], [x1, 0.2]].map(([x, r]) => new THREE.Vector2(r, x)), 20).rotateZ(-PI / 2), M.acero));
            const porFila = movil ? 16 : 24;
            const alabes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.075, 1, 0.05), M.alabeC, 4 * porFila);
            const m4 = new THREE.Matrix4();
            const q = new THREE.Quaternion();
            const eje = new THREE.Vector3(1, 0, 0);
            let k = 0;
            for (let i = 0; i < 4; i++) {
                const xf = lerp(x0 + 0.1, x1 - 0.12, i / 3);
                const raizR = lerp(0.28, 0.21, i / 3);
                const largo = lerp(0.16, 0.38, i / 3);
                rotor.add(en(cilX(raizR, 0.03, M.acero), xf, 0, 0));
                for (let j = 0; j < porFila; j++) {
                    const a = (j / porFila) * PI * 2;
                    q.setFromAxisAngle(eje, a);
                    const r = raizR + largo / 2;
                    m4.compose(new THREE.Vector3(xf, Math.cos(a) * r, Math.sin(a) * r), q, new THREE.Vector3(1, largo, 1));
                    alabes.setMatrixAt(k++, m4);
                }
            }
            alabes.castShadow = true;
            rotor.add(alabes);
            g.add(mover(rotor, [0, 0.72, 0]));
            giran.push({ obj: rotor, eje: 'x', vel: rotorVel });
            brillo(g, x0 + 0.25, EJE_G, 0.3, 0.9, FLUIDOS.caliente.color, 'tg', 0.3, false).material.depthTest = true;
            // difusor: los gases se abren antes de llegar a la compuerta
            const dif = new THREE.Mesh(new THREE.LatheGeometry([[X.dif[0], 0.64], [X.dif[1], 0.84]].map(([x, r]) => new THREE.Vector2(r, x)), 32).rotateZ(-PI / 2), cub(c('difusor'), ['turbinaGas', 'chimenea', 'desarmeV']));
            dif.castShadow = true;
            dif.position.y = EJE_G;
            g.add(mover(dif, [0, 1.9, 0]));
            for (const x of [X.dif[0] + 0.1, X.dif[1] - 0.1]) g.add(en(caja(0.14, 0.34, 0.9, M.concreto), x, 0, 0));
        }

        // --- compuerta y chimenea de paso (ciclo abierto)
        const compuerta = new THREE.Group();
        {
            const g = unidad('chimenea', 0, z, padre);
            const [x0, x1] = X.desvio;
            const xm = (x0 + x1) / 2;
            const mat = cub(c('desvio'), ['chimenea', 'desarmeV']);
            const cuerpo = caja(x1 - x0, 1.8, 1.7, mat);
            cuerpo.position.set(xm, 0.25, 0);
            g.add(mover(cuerpo, [0, 0, 0]));
            // la compuerta guinda: horizontal manda los gases adelante; levantada, a la chimenea de paso
            compuerta.position.set(x0 + 0.04, EJE_G, 0);
            compuerta.add(en(caja(0.5, 0.03, 1.5, M.guinda), 0.25, -0.015, 0));
            g.add(compuerta);
            const paso = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.42, ALTO_PASO - 2.05, 28, 1, true).translate(0, (ALTO_PASO - 2.05) / 2, 0), cub(c('paso'), ['chimenea', 'desarmeV'])));
            paso.position.set(xm, 2.05, 0);
            g.add(mover(paso, [0, 1.4, 0]));
            const boca = aro(0.34, 0.022, M.grafito);
            boca.position.set(xm, ALTO_PASO, 0);
            g.add(mover(boca, [0, 1.4, 0]));
            const banda = aro(0.39, 0.012, M.grafito);
            banda.position.set(xm, 2.6, 0);
            g.add(mover(banda, [0, 1.4, 0]));
            pluma(xm, ALTO_PASO + 0.05, z, 'paso', 0.42, 1.6, '#c9b9a6', 6, padre);
        }

        // --- transición al recuperador y su caja
        {
            const g = unidad('recuperador', 0, z, padre);
            const matT = cub(c('transicion'), ['recuperador', 'desarmeV']);
            const trans = new THREE.Mesh(prismaX(X.trans[0], [EJE_G - 0.62, EJE_G + 0.62, -0.85, 0.85], X.trans[1], [HRSG.y[0], HRSG.y[1], -HRSG.ancho, HRSG.ancho]), matT);
            trans.castShadow = true;
            g.add(mover(trans, [0, 0, 0]));
            const [x0, x1] = X.hrsg;
            const xm = (x0 + x1) / 2;
            const L = x1 - x0;
            const H_ = HRSG.y[1] - HRSG.y[0];
            const W_ = HRSG.ancho * 2;
            const pared = cub(c('hrsg'), ['recuperador', 'desarmeV']);
            const frente = caja(L, H_, 0.03, pared);
            frente.position.set(xm, HRSG.y[0], HRSG.ancho);
            g.add(mover(frente, [0, 0, 1.5]));
            for (const y of [0.95, 1.7, 2.45]) g.add(mover(en(caja(L, 0.012, 0.012, M.grafito), xm, y, HRSG.ancho + 0.02), [0, 0, 1.5]));
            if (t === 'A') mover(rotular(g, 'Recuperador de calor', xm, 2.08, HRSG.ancho + 0.03, '#3a3b40', 2.2), [0, 0, 1.5]);
            const atras = caja(L, H_, 0.03, pared);
            atras.position.set(xm, HRSG.y[0], -HRSG.ancho);
            g.add(mover(atras, [0, 0, -1.5]));
            const techo = caja(L, 0.03, W_, pared);
            techo.position.set(xm, HRSG.y[1], 0);
            g.add(mover(techo, [0, 1.6, 0]));
            g.add(en(caja(L, 0.03, W_, M.grafito), xm, HRSG.y[0], 0));
            // estructura de acero por fuera
            for (let i = 0; i <= 3; i++) for (const s of [-1, 1]) {
                const x = x0 + (L * i) / 3;
                g.add(mover(en(caja(0.05, HRSG.y[1] + 0.04, 0.05, M.grafito), x, 0, s * (HRSG.ancho + 0.04)), [0, 0, s * 1.5]));
            }
            // bancos de tubos, en el orden en que los cruzan los gases (JICA): del más caliente al más frío
            const bancos = [
                { x: [x0 + 0.1, x0 + 0.5], m: M.tuboAP, filas: 4 }, // sobrecalentador y recalentador
                { x: [x0 + 0.62, x0 + 0.98], m: M.tuboAM, filas: 3 }, // alta presión, donde hierve
                { x: [x0 + 1.05, x0 + 1.3], m: M.tuboMP, filas: 2 }, // calienta el agua de alta
                { x: [x0 + 1.42, x0 + 1.75], m: M.tuboAM, filas: 3 }, // media presión, donde hierve
                { x: [x0 + 1.82, x0 + 2], m: M.tuboMP, filas: 2 },
                { x: [x0 + 2.1, x0 + 2.42], m: M.tuboBP, filas: 3 }, // baja presión, donde hierve
                { x: [x0 + 2.5, x0 + 2.88], m: M.tuboBP, filas: 3 }, // calienta el agua que llega del condensador
            ];
            const m4 = new THREE.Matrix4();
            const porFila = movil ? 8 : 15;
            for (const b of bancos) {
                const n = b.filas * porFila;
                const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.018, 0.018, H_ - 0.2, 6), b.m, n);
                let k = 0;
                for (let i = 0; i < b.filas; i++) for (let j = 0; j < porFila; j++) {
                    im.setMatrixAt(k++, m4.setPosition(lerp(b.x[0], b.x[1], b.filas > 1 ? i / (b.filas - 1) : 0.5), HRSG.y[0] + H_ / 2, lerp(-HRSG.ancho + 0.1, HRSG.ancho - 0.1, (j + (i % 2) * 0.5) / (porFila - 0.5))));
                }
                g.add(im);
                // colector de arriba y de abajo del banco
                for (const y of [HRSG.y[0] + 0.1, HRSG.y[1] - 0.1]) g.add(en(cilZ(0.04, W_ - 0.2, b.m, 8), (b.x[0] + b.x[1]) / 2, y, 0));
            }
            // tres domos, uno por presión
            const domo = (x, r, nombre) => {
                const d = new THREE.Group();
                d.position.set(x, HRSG.y[1] + r + 0.1, 0);
                d.add(cilZ(r, 1.75, M.marfil, 22));
                for (const s of [-1, 1]) d.add(en(new THREE.Mesh(new THREE.SphereGeometry(r, 16, 10).scale(1, 1, 0.45), M.marfil), 0, 0, s * 0.875));
                d.add(en(aroX(r + 0.002, 0.004, M.grafito), 0, 0, 0));
                for (const s of [-0.6, 0.6]) {
                    d.add(en(caja(0.05, 0.1 + 0.02, 0.05, M.grafito), 0, -r - 0.1, s));
                }
                d.name = nombre;
                g.add(mover(d, [0, 2.5, 0]));
            };
            domo(X_DOMOS.ap, 0.17, 'alta');
            domo(X_DOMOS.mp, 0.13, 'media');
            domo(X_DOMOS.bp, 0.15, 'baja');
            // el brillo de los tubos más calientes
            brillo(g, x0 + 0.3, 1.7, 0, 1.6, FLUIDOS.caliente.color, 'hrsg', 0.22, false).material.depthTest = true;
            // ducto de salida a la chimenea
            const salida = new THREE.Mesh(prismaX(X.salida[0], [HRSG.y[0] + 0.3, HRSG.y[1] - 0.2, -HRSG.ancho, HRSG.ancho], X.chim - 0.25, [1, 2.4, -0.42, 0.42]), matT);
            salida.castShadow = true;
            g.add(salida);
        }

        // --- chimenea
        {
            const g = unidad('chimenea', X.chim, z, padre);
            const mat = cub(c('chim'), ['chimenea']);
            const cuerpo = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.38, ALTO_CHIM, 32, 1, true).translate(0, ALTO_CHIM / 2, 0), mat));
            g.add(cuerpo);
            const fin = aro(0.31, 0.025, M.grafito);
            fin.position.y = ALTO_CHIM;
            g.add(fin);
            for (const y of [ALTO_CHIM - 0.35, ALTO_CHIM - 0.5]) { const b = aro(0.325, 0.022, M.guinda); b.position.y = y; g.add(b); }
            // plataforma donde se mide lo que sale
            const plat = aro(0.46, 0.014, M.grafito);
            plat.position.y = 3.35;
            g.add(plat);
            g.add(en(new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.015, 24), M.grafito), 0, 3.31, 0));
            for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; g.add(en(cil(0.006, 0.09, M.grafito, 0.006, 5), Math.cos(a) * 0.45, 3.32, Math.sin(a) * 0.45)); }
            g.add(en(caja(0.02, ALTO_CHIM - 0.1, 0.09, M.grafito), 0.36, 0, 0));
            // luces de aviso para los aviones
            for (const a of [0, PI]) g.add(en(new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), M.alerta), Math.cos(a) * 0.34, ALTO_CHIM - 0.1, Math.sin(a) * 0.34));
            brillo(g, 0, ALTO_CHIM, 0, 0.7, '#ff2b3a', 'noche', 0.8);
            pluma(X.chim, ALTO_CHIM + 0.05, z, 'chimenea', 0.34, 1.5, '#b4b8be', 7, padre);
        }
        return { compuerta };
    }
    const trenA = tren('A', ZA, raiz);
    const trenB = tren('B', ZB, gDos);

    // --------- turbina de vapor: alta, media y baja presión en un solo eje
    {
        const g = unidad('turbinaVapor', 0, ST.z);
        const giro = e => 12 * e.activo.tv;
        // mesa de concreto y columnas: lo de abajo se ve
        const mesa = caja(3.56, 0.08, 1.36, M.concreto);
        mesa.position.set(5.75, ST.y - 0.62, 0);
        g.add(mesa);
        for (const x of [4.15, 5.05, 6.8, 7.4]) for (const s of [-1, 1]) g.add(en(caja(0.12, ST.y - 0.62, 0.12, M.concreto), x, 0, s * 0.58));
        const carcasas = [
            { c: 4.34, media: 0.3, rIni: 0.2, rFin: 0.33, etapas: 5, a: 0.05, b: 0.12, nombre: 'carcasaAP', soloUn: true },
            { c: 5.01, media: 0.3, rIni: 0.25, rFin: 0.41, etapas: 5, a: 0.09, b: 0.2, nombre: 'carcasaMP', soloUn: true },
            { c: 5.9, media: 0.5, rIni: 0.32, rFin: 0.62, etapas: 5, a: 0.12, b: 0.42, nombre: 'carcasaBP' },
        ];
        const rotor = new THREE.Group();
        rotor.position.set(0, ST.y, 0);
        rotor.add(en(cilX(0.05, 3.2, M.acero), 5.45, 0, 0));
        const porFila = movil ? 14 : 22;
        const total = carcasas.reduce((n, c) => n + c.etapas * (c.soloUn ? 1 : 2) * porFila, 0);
        const alabes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.018, 1, 0.042), M.marfil, total);
        const m4 = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        const eje = new THREE.Vector3(1, 0, 0);
        let k = 0;
        for (const c of carcasas) {
            const mat = cub(c.nombre, ['turbinaVapor']);
            const perfil = c.soloUn
                ? [[-c.media, 0.05], [-c.media, c.rIni], [c.media * 0.9, c.rFin], [c.media, c.rFin - 0.04], [c.media, 0.05]]
                : [[-c.media, 0.05], [-c.media, c.rFin - 0.08], [-c.media * 0.85, c.rFin], [-c.media * 0.2, c.rIni + 0.04], [0, c.rIni + 0.08], [c.media * 0.2, c.rIni + 0.04], [c.media * 0.85, c.rFin], [c.media, c.rFin - 0.08], [c.media, 0.05]];
            const arriba = sombra(new THREE.Mesh(mediaCarcasa(perfil, true), mat));
            arriba.position.set(c.c, ST.y, 0);
            g.add(mover(arriba, [0, 1.3, 0]));
            const abajo = sombra(new THREE.Mesh(mediaCarcasa(perfil, false), mat));
            abajo.position.set(c.c, ST.y, 0);
            g.add(abajo);
            for (const s of [-1, 1]) g.add(mover(en(caja(c.media * 2, 0.024, 0.05, M.grafito), c.c, ST.y - 0.012, s * (c.rFin - 0.03)), [0, 1.3, 0]));
            for (const s of c.soloUn ? [1] : [-1, 1]) {
                for (let e = 0; e < c.etapas; e++) {
                    const x = c.soloUn ? c.c + lerp(-c.media + 0.05, c.media - 0.05, e / (c.etapas - 1)) : c.c + s * (0.06 + (e * (c.media - 0.12)) / (c.etapas - 1));
                    const raizR = 0.09 + e * 0.012;
                    const largo = lerp(c.a, c.b, e / (c.etapas - 1));
                    rotor.add(en(cilX(raizR, 0.025, M.acero), x, 0, 0));
                    for (let i = 0; i < porFila; i++) {
                        const a = (i / porFila) * PI * 2;
                        q.setFromAxisAngle(eje, a);
                        const r = raizR + largo / 2;
                        m4.compose(new THREE.Vector3(x, Math.cos(a) * r, Math.sin(a) * r), q, new THREE.Vector3(1, largo, 1));
                        alabes.setMatrixAt(k++, m4);
                    }
                }
            }
            for (const x of [c.c - c.media - 0.04, c.c + c.media + 0.04]) g.add(en(caja(0.09, 0.26, 0.26, M.grafito), x, ST.y - 0.55, 0));
        }
        alabes.castShadow = true;
        rotor.add(alabes);
        g.add(mover(rotor, [0, 0.72, 0]));
        giran.push({ obj: rotor, eje: 'x', vel: giro });
        // grúa puente de mantenimiento, solo el marco para no tapar
        for (const s of [-1, 1]) {
            g.add(en(caja(3.6, 0.04, 0.04, M.acero), 5.75, 2.5, s * 0.72));
            for (const x of [4.06, 7.44]) g.add(en(caja(0.04, 2.5, 0.04, M.acero), x, 0, s * 0.72));
        }
        g.add(en(caja(0.08, 0.1, 1.5, M.guinda), 5.4, 2.44, 0));
    }
    // --------- segundo generador
    {
        const g = unidad('gen2', 7.03, ST.z);
        const est = cub('estator2', ['gen2']);
        const carcasa = cilX(0.46, 0.94, est, 36);
        carcasa.position.y = ST.y;
        g.add(mover(carcasa, [0, 1.4, 0]));
        for (const x of [-0.47, 0.47]) { const b = aroX(0.46, 0.026, M.grafito); b.position.set(x, ST.y, 0); g.add(mover(b, [0, 1.4, 0])); }
        for (let i = 1; i < 6; i++) { const b = aroX(0.465, 0.008, M.acero); b.position.set(-0.47 + i * 0.157, ST.y, 0); g.add(mover(b, [0, 1.4, 0])); }
        g.add(caja(0.8, ST.y - 0.3, 0.6, M.concreto));
        for (let i = 5; i < 12; i++) {
            const a = (i / 16) * PI * 2;
            const b = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.09), M.cobre);
            b.position.set(0, ST.y + Math.cos(a) * 0.36, Math.sin(a) * 0.36);
            b.rotation.x = a;
            g.add(b);
        }
        const rotor = new THREE.Group();
        rotor.position.set(0, ST.y, 0);
        rotor.add(cilX(0.13, 0.8, M.acero));
        for (let i = 0; i < 2; i++) {
            const polo = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.1, 0.22), M.cobre);
            polo.position.set(0, i ? -0.2 : 0.2, 0);
            rotor.add(polo);
        }
        rotor.add(en(aroX(0.26, 0.012, M.neonElec), -0.41, 0, 0), en(aroX(0.26, 0.012, M.neonElec), 0.41, 0, 0));
        g.add(mover(rotor, [0, 0.8, 0]));
        giran.push({ obj: rotor, eje: 'x', vel: e => 12 * e.activo.tv });
        brillo(g, 0, ST.y, 0.5, 0.9, FLUIDOS.elec.color, 'gen2', 0.32);
    }
    // --------- condensador y su bomba
    {
        const g = unidad('condensador', 0, 0);
        const c = cub('conchaC', ['condensador'], { color: '#b5b8bf', metal: 0.5 });
        const [x0, x1, y0, y1, z0, z1] = EQUIPOS.condensador;
        const cuerpo = caja(x1 - x0, y1 - y0, z1 - z0, c);
        cuerpo.position.set((x0 + x1) / 2, y0, (z0 + z1) / 2);
        g.add(mover(cuerpo, [0, 0, 1.6]));
        const tapa = caja(0.08, y1 - y0 - 0.06, z1 - z0 - 0.1, cub('cajaC', ['condensador'], { color: FLUIDOS.torre.color }));
        tapa.position.set(x1 + 0.03, y0 + 0.02, (z0 + z1) / 2);
        g.add(mover(tapa, [0.8, 0, 1.6]));
        const tubos = [];
        for (let i = 0; i < 9; i++) for (let j = 0; j < 5; j++) tubos.push([lerp(z0 + 0.12, z1 - 0.12, i / 8), lerp(0.28, 0.58, j / 4)]);
        const m4 = new THREE.Matrix4();
        const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.014, 0.014, x1 - x0 - 0.04, 6).rotateZ(PI / 2), M.tuboTorre, tubos.length);
        tubos.forEach(([z, y], i) => im.setMatrixAt(i, m4.setPosition((x0 + x1) / 2, y, z)));
        g.add(im);
        g.add(en(new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 - 0.02, 0.1, z1 - z0 - 0.02).translate(0, 0.05, 0), M.agua), (x0 + x1) / 2, y0 + 0.02, (z0 + z1) / 2));
        for (let i = 0; i < 40; i++) gota('agua', 'tv', lerp(x0 + 0.1, x1 - 0.1, azar(i, 41)), lerp(z0 + 0.1, z1 - 0.1, azar(i, 42)), y1 - 0.03, y0 + 0.08, 1.05, 0.012, 0.006);
        const bomba = new THREE.Group();
        bomba.position.set(4.82, 0, -0.3);
        bomba.add(caja(0.42, 0.16, 0.36, M.grafito), en(cil(0.11, 0.24, M.azul), 0, 0.16, 0));
        g.add(bomba);
        partes.condensador.push(bomba);
    }
    // --------- torre de enfriamiento: tres celdas con ventilador
    {
        const g = unidad('enfriamiento', 0, 0);
        const [x0, x1, , y1, z0, z1] = EQUIPOS.torre;
        const xm = (x0 + x1) / 2;
        const zm = (z0 + z1) / 2;
        const pared = cub('torreC', ['enfriamiento'], { color: '#dcdcd8' });
        const celdas = 3;
        const ancho = (x1 - x0) / celdas;
        // alberca abajo
        g.add(en(caja(x1 - x0 + 0.1, 0.09, z1 - z0 + 0.1, M.concreto), xm, 0, zm));
        g.add(en(new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 - 0.05, 0.02, z1 - z0 - 0.05), M.agua), xm, 0.095, zm));
        for (let i = 0; i < celdas; i++) {
            const cx = x0 + ancho * (i + 0.5);
            const atras = caja(ancho - 0.04, 1.2, 0.03, pared);
            atras.position.set(cx, 0.46, z0 + 0.02);
            g.add(mover(atras, [0, 0, -1.2]));
            const frente = caja(ancho - 0.04, 1.2, 0.03, pared);
            frente.position.set(cx, 0.46, z1 - 0.02);
            g.add(mover(frente, [0, 0, 1.2]));
            // relleno por el que escurre el agua
            for (let j = 0; j < 8; j++) g.add(en(caja(ancho - 0.1, 0.018, z1 - z0 - 0.1, M.relleno), cx, 0.52 + j * 0.13, zm));
            const techo = caja(ancho - 0.02, 0.05, z1 - z0, M.marfil);
            techo.position.set(cx, 1.66, zm);
            g.add(mover(techo, [0, 1.3, 0]));
            const pilaV = sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.42, 0.34, 28, 1, true).translate(0, 0.17, 0), cub(`pila${i}`, ['enfriamiento'], { color: '#e8e7e2' })));
            pilaV.position.set(cx, 1.71, zm);
            g.add(mover(pilaV, [0, 1.3, 0]));
            const f = new THREE.Group();
            f.position.set(cx, 1.89, zm);
            for (let a = 0; a < 6; a++) {
                const b = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.012, 0.075), M.grafito);
                b.position.set(Math.cos((a / 6) * PI * 2) * 0.2, 0, Math.sin((a / 6) * PI * 2) * 0.2);
                b.rotation.y = -(a / 6) * PI * 2;
                b.rotation.x = 0.28;
                f.add(b);
            }
            f.add(cil(0.05, 0.06, M.grafito));
            g.add(mover(f, [0, 1.3, 0]));
            giran.push({ obj: f, eje: 'y', vel: e => 3.6 * e.activo.torre });
            pluma(cx, 2.1, zm, 'torre', 0.62, 2.1, '#a9b2bc', 6);
            for (let j = 0; j < 14; j++) gota('torre', 'torre', lerp(cx - ancho * 0.42, cx + ancho * 0.42, azar(j, i + 51)), lerp(z0 + 0.15, z1 - 0.15, azar(j, i + 61)), 1.55, 0.12, 0.8, 0.012, 0.004);
        }
        for (let i = 0; i <= celdas; i++) for (const s of [z0, z1]) g.add(en(caja(0.04, y1 - 0.5, 0.04, M.grafito), x0 + ancho * i, 0, s));
        g.add(en(cilX(0.06, x1 - x0 - 0.2, M.tuboTorre, 8), xm, 1.5, zm));
        const bomba = new THREE.Group();
        bomba.position.set(6.97, 0, -1.28);
        bomba.add(caja(0.42, 0.16, 0.42, M.grafito), en(cil(0.13, 0.26, M.tuboTorre), 0, 0.16, 0));
        g.add(bomba);
    }
    // --------- estación de gas
    {
        const g = unidad('gas', 0, 0);
        // el tubo entra enterrado: se ve su punta en el corte del terreno
        const lado = cilX(0.14, 0.32, M.verde, 22);
        lado.position.set(X0 + 0.14, -0.62, 3.65);
        g.add(lado);
        g.add(en(aroX(0.16, 0.02, M.grafito), X0 - 0.015, -0.62, 3.65));
        rotular(raiz, 'Viene del gasoducto', X0 - 0.01, -0.28, 3.65, 'rgba(255,255,255,0.92)', 1.5, -PI / 2);
        // sale de la tierra y pasa por válvula, filtros, medidor y calentador
        g.add(en(cil(0.075, 0.26, M.verde), -7.2, 0, 3.65));
        g.add(en(new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 16), M.grafito), -7.2, 0.02, 3.65));
        const rueda = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.012, 8, 20).rotateX(PI / 2), M.guinda);
        rueda.position.set(-7.2, 0.46, 3.65);
        g.add(rueda);
        g.add(en(cil(0.014, 0.2, M.grafito), -7.2, 0.26, 3.65));
        // dos filtros
        for (const z of [3.42, 3.88]) {
            const f = new THREE.Group();
            f.position.set(-6.15, 0.3, z);
            f.add(cilX(0.15, 1.05, M.marfil, 20));
            for (const s of [-1, 1]) f.add(en(new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10).scale(0.4, 1, 1), M.marfil), s * 0.525, 0, 0));
            for (const x of [-0.32, 0.32]) f.add(en(caja(0.08, 0.2, 0.16, M.grafito), x, -0.3, 0));
            g.add(mover(f, [0, 0, z > 3.65 ? 0.6 : -0.6]));
        }
        g.add(en(cilZ(0.05, 0.62, M.verde), -6.85, 0.3, 3.65), en(cilZ(0.05, 0.62, M.verde), -5.5, 0.3, 3.65));
        // medidor y calentador
        const medidor = new THREE.Group();
        medidor.position.set(-5.08, 0, 3.62);
        medidor.add(caja(0.34, 0.5, 0.42, M.marfil), en(caja(0.26, 0.14, 0.02, M.grafito), 0, 0.28, 0.215));
        medidor.add(en(cilX(0.05, 0.9, M.verde), 0.02, 0.3, 0));
        g.add(mover(medidor, [0, 0.6, 0]));
        const cal = recipienteGeo(0.14, 0.55, 0.5);
        g.add(en(sombra(new THREE.Mesh(cal, M.guinda)), -4.5, 0.03, 3.62));
        // cerca
        for (let i = 0; i <= 8; i++) g.add(en(cil(0.008, 0.26, M.grafito, 0.008, 5), -7.03 + i * 0.36, 0, 4.22));
        g.add(en(cilX(0.005, 2.9, M.grafito, 5), -5.58, 0.25, 4.22));
    }
    // --------- barras de fase aislada: de la caja de bornes de cada generador a la garganta de su transformador, sobre soportes bajos
    {
        const { y, fase, r } = BARRAS_GEN;
        const libres = [[-3.32, 2.5], [-3.1, 2.5], [-3.32, 2.8], [3.7, 2.6]]; // ahí pasan los tubos de gas por abajo, y una lámpara
        const barras = (id, padre) => {
            const L = LINEAS.find(l => l.id === id);
            const g = unidad('subestacion', 0, 0, padre);
            g.add(sombra(new THREE.Mesh(geoTresFases(L.puntos, fase, r), M.acero)));
            for (let i = 0; i < L.puntos.length - 1; i++) {
                const [a, b] = [L.puntos[i], L.puntos[i + 1]];
                const enX = Math.abs(b[0] - a[0]) > Math.abs(b[2] - a[2]);
                const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[2] - a[2]) / 0.9));
                for (let j = 0; j < n; j++) {
                    const [x, z] = [lerp(a[0], b[0], (j + 0.5) / n), lerp(a[2], b[2], (j + 0.5) / n)];
                    if (libres.some(([gx, gz]) => Math.hypot(x - gx, z - gz) < 0.25)) continue;
                    const ancho = 2 * fase + 0.1;
                    g.add(en(caja(0.04, y - r - 0.024, 0.04, M.grafito), x, 0, z));
                    g.add(en(caja(enX ? 0.05 : ancho, 0.024, enX ? ancho : 0.05, M.grafito), x, y - r - 0.024, z));
                }
            }
            return g;
        };
        barras('gen1A');
        barras('gen1B', gDos);
        barras('gen2');
        // las cajas de bornes, pegadas a la base de cada generador
        const cajaBornes = (id, [x0, x1, y0, y1, z0, z1], padre = raiz) => {
            const g = unidad(id, 0, 0, padre);
            g.add(en(caja(x1 - x0, y1 - y0, z1 - z0, M.grafito), (x0 + x1) / 2, y0, (z0 + z1) / 2));
            g.add(en(caja(x1 - x0 + 0.02, 0.02, z1 - z0 + 0.02, M.acero), (x0 + x1) / 2, y1 - 0.02, (z0 + z1) / 2));
        };
        cajaBornes('gen1', EQUIPOS.cajaGenA);
        cajaBornes('gen1', EQUIPOS.cajaGenB, gDos);
        cajaBornes('gen2', EQUIPOS.cajaGen2);
    }
    // --------- subestación: un transformador por generador, sus barras y el pórtico de salida
    const trafoDos = [];
    const ZT = TRAFOS.z;
    const conductor = MATERIAL_CONDUCTOR();
    {
        const trafo = (x, nombre, padre = raiz) => {
            const g = unidad('subestacion', x, ZT, padre);
            const c = cub(nombre, ['subestacion'], { color: '#5a5c63', metal: 0.5 });
            const tanque = caja(0.58, 0.66, 0.95, c);
            tanque.position.y = 0.06;
            g.add(mover(tanque, [0, 1.3, 0]));
            const tapa = caja(0.62, 0.04, 0.99, M.grafito);
            tapa.position.y = 0.72;
            g.add(mover(tapa, [0, 1.3, 0]));
            g.add(caja(0.72, 0.06, 1.1, M.losa));
            for (const s of [-1, 1]) for (let i = 0; i < 6; i++) g.add(mover(en(caja(0.08, 0.54, 0.018, M.acero), s * 0.34, 0.1, -0.36 + i * 0.145), [s * 0.5, 0, 0]));
            g.add(en(caja(0.36, 0.52, 0.08, M.grafito), 0, 0.1, 0));
            for (const z of [-0.28, 0, 0.28]) g.add(en(cil(0.11, 0.42, M.cobre, 0.11, 16), 0, 0.14, z));
            // la garganta del lado de baja, donde entran las barras del generador
            g.add(en(caja(0.26, 0.18, 0.08, M.grafito), 0, BARRAS_GEN.y - 0.09, -0.515));
            const boq = new THREE.Group();
            for (const z of [-0.3, 0, 0.3]) {
                boq.add(en(cil(0.026, 0.42, M.marfil, 0.014, 10), 0, 0.76, z));
                for (let i = 0; i < 4; i++) boq.add(en(aro(0.032 - i * 0.003, 0.006, M.marfil), 0, 0.82 + i * 0.08, z));
            }
            g.add(mover(boq, [0, 1.3, 0]));
            brillo(g, 0, 0.42, 0.55, 0.7, FLUIDOS.elec.color, 'red', 0.2);
            return g;
        };
        trafoDos.push(trafo(TRAFOS.B, 'tanqueB'));
        trafo(TRAFOS.A, 'tanqueA');
        trafo(TRAFOS.C, 'tanqueC');
        // barras: tres tubos de aluminio sobre aisladores de poste, en marcos de acero entre los transformadores
        const g = unidad('subestacion', 0, 0);
        const [x0, x1] = BARRAS.x;
        const yB = BARRAS.y;
        const aisladorPoste = (padre, x, y0, z) => {
            padre.add(en(cil(0.02, yB - 0.022 - y0, M.marfil, 0.014, 10), x, y0, z));
            for (let i = 0; i < 3; i++) padre.add(en(aro(0.027, 0.005, M.marfil), x, y0 + 0.07 + i * 0.07, z));
        };
        for (const k of [-1, 0, 1]) g.add(en(cilX(0.022, x1 - x0 + 0.04, conductor, 12), (x0 + x1) / 2, yB, ZT + k * BARRAS.fase));
        for (const x of [x0, -0.05, 1.05]) {
            for (const s of [-1, 1]) g.add(en(caja(0.05, 1.43, 0.05, M.acero), x, 0, ZT + s * 0.45));
            g.add(en(caja(0.05, 0.05, 0.95, M.acero), x, 1.38, ZT));
            for (const k of [-1, 0, 1]) aisladorPoste(g, x, 1.43, ZT + k * BARRAS.fase);
        }
        // pórtico de salida: las barras llegan abajo y la línea se amarra arriba
        const p = unidad('subestacion', PORTICO.x, ZT);
        const h = PORTICO.alto;
        for (const s of [-1, 1]) {
            p.add(entre([0, 0, s * 0.45], [0, h, s * 0.45], 0.026, M.acero));
            p.add(entre([0.42, 0, s * 0.45], [0, h - 0.12, s * 0.45], 0.013, M.acero));
        }
        p.add(entre([0, h, -0.5], [0, h, 0.5], 0.026, M.acero));
        p.add(entre([0, 1.41, -0.45], [0, 1.41, 0.45], 0.02, M.acero));
        for (const k of [-1, 0, 1]) aisladorPoste(p, 0, 1.43, k * BARRAS.fase);
    }
    // --------- RNT y RGD: torres, subestación reductora, postes y pueblo
    {
        const u = unidad('red');
        const geoT = geoTorre(ALTO_TORRE);
        TORRES.forEach(([x, z]) => {
            const t = new THREE.Mesh(geoT, M.torre);
            t.position.set(x, 0, z);
            u.add(t);
            u.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.012, 0.6), M.losa), x, 0.006, z));
        });
        const r = unidad('red', REDUCTORA.x, REDUCTORA.z);
        r.add(caja(0.8, 0.04, 0.72, M.losa));
        r.add(en(caja(0.36, 0.42, 0.42, M.grafito), 0, 0.04, 0));
        // boquillas: las de alta, en fila bajo el larguero donde llega la línea; las de baja, del lado de los postes
        for (const k of [-1, 0, 1]) {
            r.add(en(cil(0.016, 0.24, M.marfil, 0.01, 8), 0.03 + k * 0.1, 0.46, 0.13));
            r.add(en(cil(0.013, 0.14, M.marfil, 0.009, 8), -0.13, 0.46, -0.07 + k * 0.1));
        }
        const hR = REDUCTORA.alto;
        for (const [a, b] of [[[-0.3, 0, -0.3], [-0.3, hR, -0.3]], [[-0.3, 0, 0.3], [-0.3, hR, 0.3]], [[0.3, 0, -0.3], [0.3, hR, -0.3]], [[0.3, 0, 0.3], [0.3, hR, 0.3]], [[-0.32, hR, 0.3], [0.32, hR, 0.3]], [[-0.32, hR, -0.3], [0.32, hR, -0.3]], [[0, hR, -0.3], [0, hR, 0.3]]]) r.add(entre(a, b, 0.016, M.acero));
        // postes de madera con sus aisladores de perno
        for (const [x, z, hP] of POSTES) {
            u.add(en(cil(0.018, hP, M.madera, 0.014, 8), x, 0, z));
            u.add(en(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.26), M.madera), x, hP - 0.02, z));
            for (const k of [-1, 0, 1]) u.add(en(cil(0.007, 0.03, M.marfil, 0.005, 6), x, hP - 0.01, z + k * 0.1));
        }
        const casas = [[5.55, 3.05, 0.34, 0.26, 0.24], [5.05, 3, 0.3, 0.3, 0.2], [4.55, 3.1, 0.34, 0.26, 0.26], [5.55, 3.58, 0.38, 0.28, 0.24], [5, 3.55, 0.34, 0.26, 0.26], [4.55, 3.6, 0.28, 0.24, 0.22], [6.05, 2.95, 0.26, 0.22, 0.2]];
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
    // --------- árboles y lámparas
    {
        const lista = [[-7.1, -3.6], [-6.4, -3.75], [-5.3, -3.6], [-3.6, -3.75], [-2, -3.6], [0.6, -3.75], [2.4, -3.6], [7.6, 2.3], [3.55, 2.9], [3.2, 4.3]];
        const n = lista.length;
        const copa = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.2, 1).translate(0, 0.36, 0), M.hoja, n);
        const tronco = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.02, 0.026, 0.28, 6).translate(0, 0.14, 0), M.madera, n);
        const m4 = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        lista.forEach(([x, z], i) => {
            const e = 0.75 + azar(i, 95) * 0.6;
            m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(e, e, e));
            copa.setMatrixAt(i, m4);
            tronco.setMatrixAt(i, m4);
        });
        copa.castShadow = true;
        raiz.add(copa, tronco);
    }
    [[-4.4, 3.02], [3.7, 2.6], [3.75, -0.75], [-1.2, -0.2], [7.7, -1.5]].forEach(([x, z]) => {
        const g = new THREE.Group();
        g.position.set(x, 0, z);
        g.add(cil(0.018, 1.45, M.grafito, 0.013, 8));
        g.add(en(caja(0.16, 0.03, 0.08, M.lampara), 0, 1.45, 0));
        raiz.add(g);
        brillo(g, 0, 1.44, 0, 1, '#ffcf8f', 'noche', 0.55);
        const charco = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ map: M.brillo, color: '#ffc27a', transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending, opacity: 0 }));
        charco.position.y = 0.04;
        charco.renderOrder = 1;
        g.add(charco);
        kit.brillos.push({ s: charco, proceso: 'noche', fuerza: 0.22, noche: true, charco: true });
    });
    // aire que los filtros jalan de afuera
    const nAire = movil ? 30 : 56;
    const mallaAire = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 5), M.fluido.aire, nAire);
    mallaAire.frustumCulled = false;
    raiz.add(mallaAire);

    // ---------- tubos
    const parteDe = L => {
        if (/^gas/.test(L.id)) return 'gas';
        if (/^(ap|rh|frio|bp)[AB]/.test(L.id)) return 'recuperador';
        if (/^(cruce|alCondensador)/.test(L.id)) return 'turbinaVapor';
        if (/^(condensado|alimenta|alim)/.test(L.id)) return 'condensador';
        if (/^torre/.test(L.id)) return 'enfriamiento';
        if (/^(gen|trafoPort|barras)/.test(L.id)) return 'subestacion';
        if (/^(rnt|rgd)/.test(L.id)) return 'red';
        if (/^(chim|paso)/.test(L.id)) return 'chimenea';
        if (/^difusor/.test(L.id)) return 'turbinaGas';
        return null;
    };
    const tubos = crearTubos({ raiz, lineas: LINEAS, fluidos: FLUIDOS, M, partes, parteDe, movil, activa: (L, e) => L.tren !== 'B' || e.verDos >= 0.5 });
    // las líneas aéreas: tres conductores que cuelgan de boquillas, barras, pórtico, torres y postes (planta-comun/conductores.js)
    crearLineasAereas({ raiz, lineas: LINEAS.filter(l => l.tren !== 'B'), partes, parteDe, movil, conductor });
    trafoDos.push(...crearLineasAereas({ raiz, lineas: LINEAS.filter(l => l.tren === 'B'), partes, parteDe, movil, conductor }));
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
    const q0 = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const s3 = new THREE.Vector3();
    let verDos = 1;
    let fA = 0;
    function posar(e) {
        const n = e.noche;
        const L = e.encendido;
        const act = p => (p === 'noche' ? n : p ? (e.activo[p] ?? 0) : 1);
        const d = e.desarme;
        const a = sale(d * 3);
        const ab = { ...(e.abierta || {}), desarmeV: sale(d * 2.2) };
        kit.posar(e, act, ab, { apagar: a });
        tubos.posar(e, a);
        // el segundo tren sube o se hunde
        verDos = e.verDos;
        const altura = Math.max(0.001, sale(Math.abs(2 * verDos - 1)));
        gDos.visible = verDos >= 0.5;
        gDos.scale.y = gDos.visible ? altura : 0.001;
        trafoDos.forEach(g => { g.visible = gDos.visible; });
        // la compuerta sube cuando se trabaja en ciclo abierto
        for (const t of [trenA, trenB]) t.compuerta.rotation.z = Math.PI * 0.45 * e.abierto;
        // fuego y metal caliente siguen a la turbina de gas
        const llama = act('llama');
        M.llama.opacity = (0.15 + 0.75 * llama) * Math.min(1, Math.max(ab.combustion ?? 0, e.adentro, 0)) * (1 - a) * (e.activo.tg > 0 ? 1 : 0);
        M.alabeC.emissiveIntensity = 0.32 * e.activo.tg;
        M.tuboAP.emissiveIntensity = 0.3 * act('hrsg');
        // plumas: el vaho de la torre, los gases de la chimenea
        plumas.forEach(p => {
            const f = act(p.proceso);
            const u = fract(e.t * 0.16 + p.u);
            const vis = f > 0.03 && a < 0.5;
            p.s.visible = vis;
            if (!vis) return;
            p.s.position.set(p.x + u * 0.5 + Math.sin(e.t * 0.6 + p.h * 9) * 0.05, p.y0 + u * p.alto, p.z + Math.cos(e.t * 0.5 + p.h * 8) * 0.05);
            p.s.scale.setScalar(p.tam * (0.5 + u * 1.5));
            p.s.material.opacity = (p.proceso === 'torre' ? 0.62 : 0.3) * f * Math.min(1, u * 5) * (1 - u) * L;
        });
        // aire entrando por las caras de los filtros
        fA = (fA + e.dt * (0.2 + 0.6 * e.activo.tg)) % 1;
        for (let i = 0; i < nAire; i++) {
            const h = azar(i, 301);
            const u = fract(fA * (0.9 + h * 0.4) + h);
            const tr = i % 2 === 0 ? ZA : ZB;
            const lado = i % 4 < 2 ? 1 : -1;
            const quiet = e.activo.tg <= 0.01 || a > 0.5 || (tr === ZB && !gDos.visible);
            const r = quiet ? 0.0001 : 0.022 * Math.min(1, u * 5);
            v.set(lerp(X.filtro[0] + 0.1, X.filtro[1] - 0.1, azar(i, 302)), lerp(2.3, 3.1, azar(i, 303)), tr + lado * lerp(2.05, 0.98, u));
            s3.setScalar(r);
            mallaAire.setMatrixAt(i, m4.compose(v, q0, s3));
        }
        mallaAire.instanceMatrix.needsUpdate = true;
        // neones
        M.neonElec.color.set(FLUIDOS.elec.color).multiplyScalar((0.18 + 0.82 * Math.max(e.activo.gen1, e.activo.gen2)) * L);
        M.neonGuinda.color.set(P_PLANTA.rosa).multiplyScalar((0.25 + 0.75 * e.activo.tg) * L);
        M.lampara.color.set('#9a9c9f').lerp(new THREE.Color('#ffe2ad'), n);
        M.ventana.color.set('#3f4a57').lerp(new THREE.Color('#ffc77a'), n).multiplyScalar(lerp(1, clamp01(0.25 + e.activo.red * 1.6), n) * L);
        M.alerta.color.set('#6e1a20').lerp(new THREE.Color('#ff2b3a'), n);
    }
    return { raiz, posar, partes, anclas, giran, repintar: kit.repintar, equipos: EQUIPOS };
}
