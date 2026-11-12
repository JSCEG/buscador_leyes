// «Cómo se equilibra la red», hecha con código. Sistema Búho: un sistema eléctrico en miniatura. Atrás, de oeste a este, la hidroeléctrica
// con su embalse, el ciclo combinado, una central grande de 810 MW, un turbogás de arranque rápido y un parque eólico. En medio, la línea de
// transmisión que une todo. Adelante, la ciudad en cuatro sectores con su subestación y sus relevadores de baja frecuencia, el CENACE con
// su pantalla y el reloj de la frecuencia, las baterías y el parque solar. Nada está a escala.
//
//   materiales(P)     escenario(renderer, scene, M, { movil, oscuro })
//   construir(M, P, { movil, oscuro }) → { raiz, posar(e), partes, anclas, giran, repintar }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { azar, clamp01, fract, lerp, sale } from '../planta-comun/ayudas.js';
import { caja, cil, cilX, crearAyudante, crearTubos, en, estudio, geoEntre, geoTorre, materialesBase, sombra, texturaGrano } from '../planta-comun/piezas.js';
import { crearLineasAereas } from '../planta-comun/conductores.js';
import { ALTO_TORRE, BAJA, BANDA, BLOQUE, BOQUILLA, COMBINADOR, CONEXION, DIAL, F0, FILAS_SOLAR, FLUIDOS, LINEAS, PARTES, POSTE_SECTOR, RED, RELEVADOR, SECTORES, SITIO, TRAFOS, giroVista } from './modelo.js';

const PI = Math.PI;
export const P_PLANTA = {
    papel: '#fafafa', noche: '#0a0e12', tinta: '#171317', marfil: '#f3f1ec', grafito: '#303137', acero: '#a7abb3', guinda: '#9b2247', rosa: '#e57a9a',
    tierraDia: '#d6d7c8', tierraNoche: '#23272c', losaDia: '#dcdcda', losaNoche: '#2c3036', suelo: '#b9a688',
};
const COLORES_EDIF = ['#e3ded4', '#d6dde3', '#e8d9cc', '#dfe3d6', '#e6dbe0', '#d9d4c9'];

export function materiales(P) {
    const M = materialesBase(P, FLUIDOS);
    Object.assign(M, {
        pasto: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#d3dcc4', 'rgba(40,60,30,0.14)', [10, 4]), roughness: 0.95, envMapIntensity: 0.2 }),
        calle: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#a3a4a6', 'rgba(0,0,0,0.2)', [10, 2]), roughness: 0.95, envMapIntensity: 0.2 }),
        roca: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaGrano('#b9a688', 'rgba(70,52,30,0.18)', [7, 1]), roughness: 0.96, envMapIntensity: 0.25 }),
        agua: new THREE.MeshPhysicalMaterial({ color: '#4f86b0', roughness: 0.15, transparent: true, opacity: 0.82, clearcoat: 1, envMapIntensity: 0.9 }),
        nave: new THREE.MeshStandardMaterial({ color: '#c9ccd1', roughness: 0.6, metalness: 0.25, envMapIntensity: 0.6 }),
        caldera: new THREE.MeshStandardMaterial({ color: '#b8bcc2', roughness: 0.55, metalness: 0.35, envMapIntensity: 0.6 }),
        chimenea: new THREE.MeshStandardMaterial({ color: '#d4d0c8', roughness: 0.7, envMapIntensity: 0.4 }),
        rotor: new THREE.MeshStandardMaterial({ color: '#b65a2e', roughness: 0.35, metalness: 0.85, envMapIntensity: 1 }),
        turbina: new THREE.MeshStandardMaterial({ color: '#8f97a1', roughness: 0.3, metalness: 0.9, envMapIntensity: 1 }),
        aspa: new THREE.MeshStandardMaterial({ color: '#f1f2f3', roughness: 0.4, envMapIntensity: 0.6 }),
        panel: new THREE.MeshStandardMaterial({ color: '#23345a', roughness: 0.25, metalness: 0.5, emissive: '#000000', envMapIntensity: 1.2 }),
        marcoPanel: new THREE.MeshStandardMaterial({ color: '#c3c7cc', roughness: 0.35, metalness: 0.7 }),
        contenedor: new THREE.MeshStandardMaterial({ color: '#eceeef', roughness: 0.5, metalness: 0.2, envMapIntensity: 0.6 }),
        trafo: new THREE.MeshStandardMaterial({ color: '#8e979b', roughness: 0.45, metalness: 0.45, envMapIntensity: 0.9 }),
        galv: new THREE.MeshStandardMaterial({ color: '#9aa0a8', roughness: 0.45, metalness: 0.7, envMapIntensity: 0.85 }),
        porcelana: new THREE.MeshStandardMaterial({ color: '#8a5a44', roughness: 0.35 }),
        verde: new THREE.MeshBasicMaterial({ color: '#2fb36a', toneMapped: false }),
        rojo: new THREE.MeshBasicMaterial({ color: '#e0302a', toneMapped: false }),
        bateriaLuz: new THREE.MeshBasicMaterial({ color: '#3fb6c6', toneMapped: false }),
        aguja: new THREE.MeshBasicMaterial({ color: P.guinda, toneMapped: false }),
        vidrioCenace: new THREE.MeshPhysicalMaterial({ color: '#cfe6f5', roughness: 0.1, transparent: true, opacity: 0.35, clearcoat: 1, depthWrite: false }),
    });
    M.edif = COLORES_EDIF.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, envMapIntensity: 0.3 }));
    M.ventanaSector = SECTORES.map(() => new THREE.MeshBasicMaterial({ color: '#ffd27a', toneMapped: false }));
    M.vaho = { humo: new THREE.SpriteMaterial({ map: M.vaho, color: '#e7e3dc', transparent: true, opacity: 0, depthWrite: false }) };
    return M;
}

const [X0, X1] = BLOQUE.x;
const [Z0, Z1] = BLOQUE.z;
const Y0 = BLOQUE.y[0];
export function escenario(renderer, scene, M, { movil = false, oscuro = false } = {}) {
    const dia = { roca: new THREE.Color(oscuro ? '#c9c5bc' : '#ffffff'), pasto: new THREE.Color(oscuro ? '#c4cbb9' : '#ffffff'), calle: new THREE.Color(oscuro ? '#c0c0c0' : '#ffffff') };
    const noche = { roca: new THREE.Color('#6a655c'), pasto: new THREE.Color('#545a50'), calle: new THREE.Color('#4a4c50') };
    if (oscuro) M.galv.color.set('#a9afb7');
    return estudio(renderer, scene, {
        movil, oscuro, y0: Y0, alcance: 15,
        alActualizar(n) {
            for (const k of ['roca', 'pasto', 'calle']) M[k].color.copy(dia[k]).lerp(noche[k], n);
        },
    });
}

/** La pantalla del CENACE: la frecuencia en grande y el estado operativo. Se repinta solo cuando cambia lo que dice. */
function pantallaCenace() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    let antes = '';
    const pintar = (f, estado, nota) => {
        const clave = `${f.toFixed(2)}|${estado}|${nota}`;
        if (clave === antes) return;
        antes = clave;
        const x = c.getContext('2d');
        x.fillStyle = '#10161c';
        x.fillRect(0, 0, 512, 256);
        const color = estado === 'emergencia' ? '#ff5a52' : estado === 'alerta' ? '#ffb000' : '#5fe39a';
        x.fillStyle = color;
        x.font = '700 104px Manrope, system-ui, sans-serif';
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.fillText(`${f.toFixed(2)} Hz`, 256, 104);
        x.font = '700 40px Manrope, system-ui, sans-serif';
        x.fillText({ normal: 'Estado normal', alerta: 'Alerta', emergencia: 'Emergencia', apagon: 'Apagón' }[estado] ?? estado, 256, 196);
        if (nota) { x.font = '600 26px Manrope, system-ui, sans-serif'; x.fillStyle = '#9fb3c4'; x.fillText(nota, 256, 238); }
        t.needsUpdate = true;
    };
    return { t, pintar };
}
/** La carátula del reloj de la frecuencia: de 58.5 a 61.5 Hz, con la banda normal en verde. Se dibuja una vez. */
function caratula(oscuro) {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const x = c.getContext('2d');
    const cx = 256;
    const cy = 256;
    x.fillStyle = oscuro ? '#1b2026' : '#fbfaf7';
    x.beginPath(); x.arc(cx, cy, 250, 0, PI * 2); x.fill();
    x.lineWidth = 10; x.strokeStyle = '#303137'; x.stroke();
    // ±1.5 Hz se reparten en ±DIAL.ang a cada lado de arriba
    const ang = f => -PI / 2 + ((f - F0) / 1.5) * DIAL.ang;
    const arco = (a, b, color, ancho) => { x.strokeStyle = color; x.lineWidth = ancho; x.beginPath(); x.arc(cx, cy, 200, ang(a), ang(b)); x.stroke(); };
    arco(58.5, 59.5, '#e0302a', 26);
    arco(59.5, BANDA.min, '#ffb000', 26);
    arco(BANDA.min, BANDA.max, '#2fb36a', 26);
    arco(BANDA.max, 60.5, '#ffb000', 26);
    arco(60.5, 61.5, '#e0302a', 26);
    x.fillStyle = oscuro ? '#eef0f2' : '#171317';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    for (const f of [58.5, 59, 59.5, 60, 60.5, 61, 61.5]) {
        const a = ang(f);
        x.strokeStyle = oscuro ? '#eef0f2' : '#171317';
        x.lineWidth = 5;
        x.beginPath(); x.moveTo(cx + Math.cos(a) * 168, cy + Math.sin(a) * 168); x.lineTo(cx + Math.cos(a) * 186, cy + Math.sin(a) * 186); x.stroke();
        x.font = `${f === 60 ? 800 : 600} ${f === 60 ? 42 : 32}px Manrope, system-ui, sans-serif`;
        x.fillText(String(f), cx + Math.cos(a) * 128, cy + Math.sin(a) * 128);
    }
    x.font = '700 40px Fraunces, Georgia, serif';
    x.fillText('Hz', cx, cy + 70);
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
    const losa = (padre, x0, x1, z0, z1, y, m) => { const g = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, -Y0 + y, z1 - z0).translate(0, (Y0 + y) / 2, 0), m); g.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); g.receiveShadow = true; padre.add(g); return g; };
    // la velocidad de cada rotor se suaviza: al apagarse o al dispararse, se frena poco a poco
    const rotores = [];
    const girar = (obj, eje, gira, k = 1) => { const r = { v: 0 }; rotores.push(r); giran.push({ obj, eje, vel: e => { r.v = lerp(r.v, gira(e) ? giroVista(e.f) * k : 0, Math.min(1, (e.dt || 0.016) * 0.8)); return r.v; } }); };
    // las tres boquillas de porcelana en la tapa de un transformador: ahí llegan las tres fases de su línea (TRAFOS y BORNES del modelo)
    const geoBoquilla = (() => {
        const h = BOQUILLA.alto - 0.012;
        const g = [new THREE.CylinderGeometry(0.007, 0.009, h, 8).translate(0, h / 2, 0)];
        for (let i = 0; i < 3; i++) g.push(new THREE.CylinderGeometry(0.014, 0.014, 0.006, 12).translate(0, 0.014 + i * 0.019, 0));
        return mergeGeometries(g);
    })();
    const boquillas = (padre, id) => {
        const t = TRAFOS[id];
        for (const k of [-1, 0, 1]) {
            padre.add(en(sombra(new THREE.Mesh(geoBoquilla, M.porcelana)), t.x + k * BOQUILLA.paso, t.tapa, t.z));
            padre.add(en(cil(0.009, 0.012, M.galv), t.x + k * BOQUILLA.paso, t.tapa + BOQUILLA.alto - 0.012, t.z));
        }
    };

    // --------- el suelo: pasto, una calle que cruza la ciudad y la roca del corte
    {
        losa(raiz, X0, X1, Z0, Z1, 0, M.pasto);
        losa(raiz, X0, -1.0, 0.45, 0.65, 0.006, M.calle);
        losa(raiz, -2.4, -2.2, 0.65, Z1, 0.006, M.calle);
        losa(raiz, -4.85, -4.65, 0.65, Z1, 0.006, M.calle);
    }

    // --------- la hidroeléctrica: el embalse, la cortina, las tuberías y la casa de máquinas con dos generadores
    const hidro = unidad('hidro');
    {
        const { x, z } = SITIO.hidro;
        losa(hidro, x - 1.15, x + 1.15, Z0, z - 0.5, 0.95, M.agua);
        hidro.add(en(caja(2.4, 1.15, 0.22, M.concreto), x, 0, z - 0.4));
        for (const dx of [-0.4, 0.4]) hidro.add(sombra(new THREE.Mesh(geoEntre([x + dx, 0.85, z - 0.3], [x + dx, 0.3, z + 0.05], 0.06, 12), M.galv)));
        const casa = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.6).translate(0, 0.25, 0), cub('hidro', ['hidro'], { color: '#cfd2d6' }));
        casa.position.set(x, 0, z + 0.25);
        casa.castShadow = true;
        hidro.add(mover(casa, [0, 0.7, 0]));
        // adentro: dos generadores de eje vertical
        for (const [i, dx] of [[1, -0.35], [2, 0.35]]) {
            hidro.add(en(cil(0.17, 0.1, M.grafito), x + dx, 0.02, z + 0.25));
            const r = new THREE.Group();
            r.add(en(cil(0.13, 0.16, M.rotor), 0, 0, 0));
            for (let k = 0; k < 6; k++) r.add(en(caja(0.03, 0.17, 0.05, M.turbina).rotateY((k / 6) * PI), Math.cos((k / 6) * PI * 2) * 0.12, 0, Math.sin((k / 6) * PI * 2) * 0.12));
            r.position.set(x + dx, 0.12, z + 0.25);
            hidro.add(r);
            girar(r, 'y', e => e.giran[`hidro${i}`], 0.5);
        }
        plano(raiz, 'Hidroeléctrica', x - 0.2, -1.0, 1.3);
    }

    // --------- el ciclo combinado: dos turbinas de gas y una de vapor en una nave, sus calderas y chimeneas, y el gobernador
    const ciclo = unidad('ciclo');
    const rotor = unidad('rotor');
    const gobernador = unidad('gobernador');
    {
        const { x, z } = SITIO.ciclo;
        const nave = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.75, 0.95).translate(0, 0.375, 0), cub('ciclo', ['ciclo', 'rotor', 'gobernador'], { color: '#cdd0d4' }));
        nave.position.set(x, 0, z + 0.25);
        nave.castShadow = true;
        ciclo.add(mover(nave, [0, 0.9, 0]));
        for (const dx of [-0.45, 0.35]) {
            ciclo.add(en(caja(0.55, 1.05, 0.5, M.caldera), x + dx, 0, z - 0.55));
            ciclo.add(en(cil(0.08, 1.65, M.chimenea, 0.07), x + dx, 0, z - 0.85));
        }
        // adentro: tres ejes a lo largo de x; cada uno, la turbina y su generador
        [[z + 0.03, 'ciclo1', ciclo], [z + 0.27, 'ciclo2', ciclo], [z + 0.51, 'vapor', rotor]].forEach(([zz, cual, padre]) => {
            padre.add(en(caja(1.4, 0.12, 0.16, M.grafito), x - 0.05, 0.02, zz));
            const r = new THREE.Group();
            r.add(en(cilX(0.07, 0.75, M.turbina), -0.3, 0, 0));
            r.add(en(cilX(0.11, 0.42, M.rotor), 0.32, 0, 0));
            for (let k = 0; k < 4; k++) r.add(en(caja(0.04, 0.2, 0.04, M.turbina), -0.45 + k * 0.1, -0.1, 0).rotateX(k * 0.7));
            r.position.set(x - 0.05, 0.28, zz);
            padre.add(r);
            girar(r, 'x', e => e.giran[cual]);
        });
        // el gobernador: un gabinete con su pantalla junto a la válvula del gas
        gobernador.add(en(caja(0.2, 0.42, 0.14, M.marfil), x - 0.85, 0, z + 0.85));
        gobernador.add(en(caja(0.12, 0.08, 0.01, M.verde), x - 0.85, 0.28, z + 0.925));
        gobernador.add(sombra(new THREE.Mesh(geoEntre([x - 0.55, 0.12, z + 0.85], [x - 1.15, 0.12, z + 0.85], 0.03, 10), M.galv)));
        gobernador.add(en(cil(0.06, 0.08, M.guinda), x - 0.62, 0.1, z + 0.85));
        plano(raiz, 'Ciclo combinado', x - 0.05, -1.0, 1.2);
    }

    // --------- la central grande de 810 MW: su edificio alto, la nave del turbogenerador y una chimenea
    const grande = unidad('grande');
    let interruptorG = null;
    {
        const { x, z } = SITIO.grande;
        grande.add(en(caja(1.0, 1.8, 0.8, M.caldera), x, 0, z - 0.45));
        grande.add(en(cil(0.11, 2.5, M.chimenea, 0.09), x + 0.75, 0, z - 0.75));
        const nave = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 0.6).translate(0, 0.4, 0), cub('grande', ['grande'], { color: '#cdd0d4' }));
        nave.position.set(x, 0, z + 0.3);
        nave.castShadow = true;
        grande.add(mover(nave, [0, 0.9, 0]));
        grande.add(en(caja(1.3, 0.14, 0.2, M.grafito), x, 0.02, z + 0.3));
        const r = new THREE.Group();
        r.add(en(cilX(0.1, 0.8, M.turbina), -0.25, 0, 0));
        r.add(en(cilX(0.16, 0.5, M.rotor), 0.42, 0, 0));
        r.position.set(x, 0.33, z + 0.3);
        grande.add(r);
        girar(r, 'x', e => e.giran.grande);
        // el interruptor de la central: verde cerrado, rojo cuando se dispara
        interruptorG = en(caja(0.08, 0.08, 0.08, M.verde), SITIO.grande.sub[0] - 0.2, 0.08, SITIO.grande.sub[1] + 0.15);
        grande.add(interruptorG);
        plano(raiz, 'Central de 810 MW', x - 0.35, -1.0, 1.4);
    }

    // --------- el turbogás de arranque rápido: está apagado hasta que el CENACE lo llama
    const turbogas = unidad('turbogas');
    const humo = [];
    {
        const { x, z } = SITIO.turbogas;
        const caseta = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.42, 0.5).translate(0, 0.21, 0), cub('turbogas', ['turbogas'], { color: '#d3d5d8' }));
        caseta.position.set(x, 0, z);
        caseta.castShadow = true;
        turbogas.add(mover(caseta, [0, 0.6, 0]));
        turbogas.add(en(cil(0.07, 0.95, M.chimenea), x + 0.3, 0, z - 0.15));
        const r = new THREE.Group();
        r.add(en(cilX(0.06, 0.4, M.turbina), -0.12, 0, 0));
        r.add(en(cilX(0.09, 0.26, M.rotor), 0.2, 0, 0));
        r.position.set(x - 0.05, 0.2, z);
        turbogas.add(r);
        girar(r, 'x', e => e.activo.tg > 0.5);
        for (let i = 0; i < 4; i++) { const s = new THREE.Sprite(M.vaho.humo); s.visible = false; raiz.add(s); humo.push({ s, fase: i / 4 }); }
        plano(raiz, 'Turbogás', x - 0.2, -1.0, 0.9);
    }

    // --------- el parque eólico: tres aerogeneradores
    const eolico = unidad('eolico');
    {
        const z = SITIO.eolico.z;
        for (const x of SITIO.eolico.torres) {
            eolico.add(en(cil(0.05, 2.1, M.marfil, 0.03), x, 0, z));
            eolico.add(en(caja(0.12, 0.1, 0.28, M.marfil), x, 2.08, z - 0.03));
            // su caja de conexión, al pie de la torre: de ahí sale su cable al transformador del parque
            eolico.add(en(caja(0.05, 0.07, 0.03, M.galv), x, 0, z + 0.065));
            const r = new THREE.Group();
            r.add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), M.marfil));
            for (let k = 0; k < 3; k++) { const a = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.62, 0.012).translate(0, 0.33, 0), M.aspa); a.rotation.z = (k / 3) * PI * 2; a.castShadow = true; r.add(a); }
            r.position.set(x, 2.13, z + 0.13);
            eolico.add(r);
            giran.push({ obj: r, eje: 'z', vel: () => -1.2 - azar(x, 3) * 0.3 });
        }
        plano(raiz, 'Parque eólico', SITIO.eolico.x, z + 0.75, 1.3);
    }

    // --------- el parque solar: filas de paneles y su inversor
    const solar = unidad('solar');
    {
        const geos = [];
        const patas = [];
        for (let zz = SITIO.solar.z - 0.75; zz <= SITIO.solar.z + 0.8; zz += 0.42) {
            for (let xx = 4.3; xx <= 7.25; xx += 0.33) {
                geos.push(new THREE.BoxGeometry(0.3, 0.012, 0.3).rotateX(-0.45).translate(xx, 0.2, zz));
                patas.push(new THREE.BoxGeometry(0.02, 0.18, 0.02).translate(xx, 0.09, zz + 0.05));
            }
        }
        solar.add(malla(geos, M.panel), malla(patas, M.marcoPanel));
        // la caja combinadora en la punta de cada fila: de ahí sale el cable de corriente directa al inversor
        for (const zz of FILAS_SOLAR) solar.add(en(caja(0.05, 0.1, 0.05, M.galv), COMBINADOR, 0, zz));
        solar.add(en(caja(0.3, 0.3, 0.22, M.contenedor), SITIO.solar.sub[0], 0, SITIO.solar.sub[1]));
        boquillas(solar, 'solar');
        plano(raiz, 'Parque solar', SITIO.solar.x, Z1 - 0.25, 1.3);
    }

    // --------- las baterías: tres contenedores con su inversor
    const baterias = unidad('baterias');
    const luzBat = [];
    {
        const { x, z } = SITIO.baterias;
        for (const dx of [-0.55, 0, 0.55]) {
            baterias.add(en(caja(0.42, 0.36, 0.95, M.contenedor), x + dx, 0, z));
            const l = en(caja(0.3, 0.03, 0.01, M.bateriaLuz), x + dx, 0.26, z + 0.48);
            baterias.add(l);
            luzBat.push(l);
            brillo(baterias, x + dx, 0.45, z, 0.6, '#3fb6c6', 'bateria', 1.1, false);
        }
        baterias.add(en(caja(0.3, 0.3, 0.22, M.contenedor), SITIO.baterias.sub[0], 0, SITIO.baterias.sub[1]));
        boquillas(baterias, 'baterias');
        plano(raiz, 'Baterías', x, z + 0.7, 0.9);
    }

    // --------- las subestaciones de cada central: base y transformador
    for (const id of ['hidro', 'ciclo', 'grande', 'turbogas', 'eolico']) {
        const [x, z] = SITIO[id].sub;
        const g = partes[id][0];
        g.add(en(caja(0.5, 0.04, 0.4, M.concreto), x, 0, z));
        g.add(en(caja(0.24, 0.3, 0.2, M.trafo), x - 0.05, 0.04, z));
        boquillas(g, id);
        // su caja de baja tensión, en la cara que ve a la central: ahí sube el cable que viene de ella
        const [bx, bz] = BAJA[id];
        g.add(en(id === 'eolico' ? caja(0.06, 0.05, 0.03, M.trafo) : caja(0.03, 0.05, 0.06, M.trafo), bx, BAJA.y, bz));
        // y la caja de conexión al pie del edificio, de donde sale ese cable
        if (CONEXION[id]) g.add(en(caja(0.06, 0.08, 0.03, M.galv), CONEXION[id].x, 0, CONEXION[id].z + 0.015));
    }

    // --------- la red: las torres que unen todo
    const red = unidad('red');
    {
        const torre = geoTorre(ALTO_TORRE, 0.16);
        const g = RED.torres.map(x => torre.clone().translate(x, 0, RED.z));
        red.add(malla(g, M.torre));
    }

    // --------- la ciudad: cuatro sectores de edificios, con su subestación y sus relevadores de baja frecuencia
    const ciudad = unidad('ciudad');
    const relevadores = unidad('relevadores');
    const focos = [];
    {
        SECTORES.forEach((s, i) => {
            const vent = [];
            for (let k = 0; k < 7; k++) {
                const dx = -0.9 + (k % 4) * 0.55 + azar(i, k) * 0.08;
                const dz = k < 4 ? -0.22 : 0.25;
                const h = 0.3 + azar(i * 7 + k, 2) * (i < 2 ? 0.65 : 0.4);
                const w = 0.36;
                ciudad.add(en(caja(w, h, 0.34, M.edif[(i + k) % M.edif.length]), s.x + dx, 0, s.z + dz));
                for (let piso = 0.12; piso < h - 0.06; piso += 0.13) vent.push(new THREE.BoxGeometry(w * 0.72, 0.05, 0.01).translate(s.x + dx, piso, s.z + dz + 0.175));
            }
            ciudad.add(new THREE.Mesh(mergeGeometries(vent), M.ventanaSector[i]));
            // el poste que alimenta el sector, con su transformador; su cable llega por el piso y sube pegado al poste
            ciudad.add(en(cil(0.02, POSTE_SECTOR.alto, M.galv), s.x + 0.9, 0, s.z));
            ciudad.add(en(cil(0.032, 0.09, M.trafo), s.x + 0.9, POSTE_SECTOR.trafo, s.z + 0.057));
            ciudad.add(en(caja(0.016, 0.02, 0.04, M.galv), s.x + 0.9, POSTE_SECTOR.trafo + 0.05, s.z + 0.02));
        });
        const { sub } = SITIO.ciudad;
        relevadores.add(en(caja(0.8, 0.04, 0.6, M.concreto), sub[0], 0, sub[1]));
        relevadores.add(en(caja(0.26, 0.34, 0.22, M.trafo), sub[0] + 0.15, 0.04, sub[1] - 0.12));
        boquillas(relevadores, 'ciudad');
        for (let i = 0; i < 4; i++) {
            const xx = RELEVADOR.x[i];
            relevadores.add(en(caja(0.09, 0.28, 0.1, M.marfil), xx, 0.04, RELEVADOR.z));
            const f = en(caja(0.05, 0.05, 0.01, M.verde), xx, 0.25, RELEVADOR.frente + 0.005);
            relevadores.add(f);
            focos.push(f);
        }
        plano(raiz, 'Ciudad', SITIO.ciudad.x, 0.55, 0.9);
    }

    // --------- el CENACE: el edificio, su pantalla y el reloj de la frecuencia en el techo
    const cenace = unidad('cenace');
    const medidor = unidad('medidor');
    const pantalla = pantallaCenace();
    let aguja = null;
    {
        const { x, z } = SITIO.cenace;
        cenace.add(en(caja(1.6, 1.0, 1.0, M.marfil), x, 0, z));
        cenace.add(en(caja(1.64, 0.05, 1.04, M.grafito), x, 1.0, z));
        const p = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshBasicMaterial({ map: pantalla.t, toneMapped: false }));
        p.position.set(x - 0.25, 0.55, z + 0.505);
        cenace.add(p);
        cenace.add(en(cil(0.012, 0.4, M.galv), x - 0.2, 1.0, z - 0.3));
        // el reloj
        medidor.add(en(cil(0.03, 0.62, M.galv), DIAL.x, 1.0, DIAL.z - 0.05));
        const cara = new THREE.Mesh(new THREE.CircleGeometry(DIAL.r, 48), new THREE.MeshBasicMaterial({ map: caratula(oscuro), toneMapped: false }));
        cara.position.set(DIAL.x, DIAL.y, DIAL.z);
        medidor.add(cara);
        medidor.add(en(new THREE.Mesh(new THREE.TorusGeometry(DIAL.r, 0.02, 8, 48), M.grafito), DIAL.x, DIAL.y, DIAL.z));
        aguja = new THREE.Group();
        aguja.add(new THREE.Mesh(new THREE.BoxGeometry(0.018, DIAL.r * 0.82, 0.01).translate(0, DIAL.r * 0.38, 0), M.aguja));
        aguja.add(new THREE.Mesh(new THREE.CircleGeometry(0.03, 16), M.aguja));
        aguja.position.set(DIAL.x, DIAL.y, DIAL.z + 0.012);
        medidor.add(aguja);
        plano(raiz, 'CENACE', x - 0.25, Z1 - 0.25, 0.9);
    }

    // --------- al desarmar: los techos suben (ya puestos con mover) y la ciudad se separa de su subestación
    for (const [g, d] of [[relevadores, [0.3, 0.3, 0]], [medidor, [0, 0.5, 0]], [gobernador, [0.3, 0, 0.3]]]) mover(g, d);

    // --------- los conductores: tres fases de aluminio que cuelgan entre apoyos, con sus aisladores (planta-comun/conductores.js)
    const parteDe = L => ({ oeste: 'red', este: 'red', ciudad: 'ciudad' }[L.id] ?? L.central ?? (partes[L.id] ? L.id : /^s\d/.test(L.id) ? 'ciudad' : null));
    crearLineasAereas({ raiz, lineas: LINEAS, partes, parteDe, movil });

    // --------- lo que corre por los cables
    const tubos = crearTubos({ raiz, lineas: LINEAS, fluidos: FLUIDOS, M, partes, parteDe, movil });

    const anclas = {};
    for (const p of PARTES) { const o = new THREE.Object3D(); o.position.set(...p.ancla); raiz.add(o); anclas[p.id] = o; }

    // ---------- posar
    const apagada = new THREE.Color('#4a4f57');
    const encendida = new THREE.Color('#ffd27a');
    function posar(e) {
        const n = e.noche;
        const L = e.lectura;
        const act = p => (p === 'noche' ? n : p === 'siempre' ? 1 : p ? (e.activo[p] ?? 0) : 1);
        const a = sale(e.desarme * 3);
        const ab = { ...(e.abierta || {}) };
        kit.posar(e, act, ab, { apagar: a });
        tubos.posar(e, a);
        // la ciudad: cada sector con luz o sin ella
        e.sectores.forEach((v, i) => { M.ventanaSector[i].color.copy(apagada).lerp(encendida, v ? 0.35 + 0.65 * n : 0); focos[i].material = v ? M.verde : M.rojo; });
        // el reloj y la pantalla
        aguja.rotation.z = -e.aguja;
        const estado = e.apagado ? 'apagon' : L.modo === 'reserva' ? L.estado : L.f < BANDA.min || L.f > BANDA.max ? (L.cortado > 0 ? 'emergencia' : 'alerta') : 'normal';
        const nota = L.modo === 'reserva' ? `Reserva ${Math.round(L.ro * 1000) / 10} %` : L.t === null ? '' : L.t < 60 ? `Segundo ${Math.floor(L.t)}` : `Minuto ${Math.floor(L.t / 60)}`;
        pantalla.pintar(e.apagado ? 0 : L.f, estado, nota);
        interruptorG.material = e.giran.grande ? M.verde : M.rojo;
        // baterías y paneles
        const b = e.activo.bateria;
        M.bateriaLuz.color.set('#2a6f78').lerp(new THREE.Color('#7ff2ff'), b);
        luzBat.forEach(l => { l.scale.x = 0.4 + 0.6 * b; });
        M.panel.emissive.set('#1d3f7a').multiplyScalar(0.3 * e.activo.sol * (1 - n));
        // el humo del turbogás cuando arranca
        const tg = e.activo.tg;
        M.vaho.humo.opacity = 0.55 * tg * (1 - a);
        humo.forEach(h => {
            h.s.visible = tg > 0.2 && a < 0.5;
            if (!h.s.visible) return;
            const u = fract(e.t * 0.3 + h.fase);
            h.s.position.set(SITIO.turbogas.x + 0.3 + Math.sin(e.t + h.fase * 6) * 0.04, 1.0 + u * 0.7, SITIO.turbogas.z - 0.15);
            h.s.scale.setScalar(0.18 + u * 0.35);
        });
        M.lampara.color.set('#9a9c9f').lerp(new THREE.Color('#ffe2ad'), n);
        M.ventana.color.set('#3f4a57').lerp(new THREE.Color('#ffc77a'), n);
        M.vidrioCenace.opacity = clamp01(0.35);
    }
    return { raiz, posar, partes, anclas, giran, repintar: kit.repintar };
}
