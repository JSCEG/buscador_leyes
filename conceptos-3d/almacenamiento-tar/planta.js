// La terminal de almacenamiento, hecha con código. Sistema Búho: un predio con un corte enfrente para ver el poliducto enterrado. Por ahí llegan las tandas, suben junto al densímetro,
// el múltiple las reparte a cada tanque, las bombas las llevan a las llenaderas y las pipas salen a las gasolineras. Las cubiertas se vuelven vidrio (adentro = 1) y cada equipo
// se separa en sus piezas (desarme = 1).
//
//   materiales(P)     escenario(renderer, scene, M, { movil, oscuro })
//   construir(M, P, { movil, oscuro }) → { raiz, posar(e), partes, anclas, giran, repintar }
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { azar, clamp01, lerp, sale } from '../planta-comun/ayudas.js';
import { aro, caja, cil, cilX, crearAyudante, crearTubos, en, entre, estudio, geoEntre, materialesBase, recipienteGeo, sombra } from '../planta-comun/piezas.js';
import { BLOQUE, DEF, FLUIDOS, H_ESCENA, LINEAS, PARTES, PRODUCTOS, TANQUES, T_MEZCLA, X_LANES, X_SUBE, Y_DUCTO, Z_DUCTO, Z_FONDO, anchoEscena, pipasPorHora, radioDe, trenEn } from './modelo.js';

const PI = Math.PI;
export const P_PLANTA = {
    papel: '#fafafa', noche: '#0a0e12', tinta: '#171317', marfil: '#f3f1ec', grafito: '#303137', acero: '#a7abb3', guinda: '#9b2247', rosa: '#e57a9a',
    tierraDia: '#d6d7c8', tierraNoche: '#23272c', losaDia: '#dcdcda', losaNoche: '#2c3036', suelo: '#b9a688',
};
const NOMBRE = Object.fromEntries(Object.entries(PRODUCTOS).map(([k, v]) => [k, v.nombre]));

function texturaTierra(base, oscuro, claro, repite) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = base;
    x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 7; i++) {
        x.strokeStyle = i % 2 ? oscuro : claro;
        x.lineWidth = 1 + azar(i, 9) * 2.4;
        x.beginPath();
        const y0 = (i + 0.5) * 36;
        for (let k = 0; k <= 8; k++) { const px = (k * 256) / 8; const py = y0 + Math.sin((k / 8) * PI * 2 + i) * 5; if (k) x.lineTo(px, py); else x.moveTo(px, py); }
        x.stroke();
    }
    for (let i = 0; i < 1300; i++) {
        x.fillStyle = azar(i, 41) > 0.5 ? claro : oscuro;
        x.fillRect(azar(i, 42) * 256, azar(i, 43) * 256, 1 + azar(i, 44) * 2.4, 1 + azar(i, 45) * 1.6);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repite);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
}

export function materiales(P) {
    const M = materialesBase(P, FLUIDOS);
    Object.assign(M, {
        terreno: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.96, envMapIntensity: 0.25 }),
        asfalto: new THREE.MeshStandardMaterial({ color: '#8d8f93', roughness: 0.95, envMapIntensity: 0.2 }),
        pisoDique: new THREE.MeshStandardMaterial({ color: '#bfbcb2', roughness: 0.95, envMapIntensity: 0.2 }),
        raya: new THREE.MeshStandardMaterial({ color: '#f1efe8', roughness: 0.8, envMapIntensity: 0.2 }),
        roca: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texturaTierra('#b9a688', 'rgba(70,52,30,0.16)', 'rgba(255,245,225,0.15)', [0.3, 0.42]), roughness: 0.96, envMapIntensity: 0.25, side: THREE.DoubleSide }),
        hueco: new THREE.MeshStandardMaterial({ color: '#8d7e68', roughness: 0.96, envMapIntensity: 0.25, side: THREE.DoubleSide }),
        fondoHueco: new THREE.MeshStandardMaterial({ color: '#6d6152', roughness: 1, envMapIntensity: 0.2, side: THREE.DoubleSide }),
        marco: new THREE.MeshStandardMaterial({ color: P.grafito, roughness: 0.6, metalness: 0.3, envMapIntensity: 0.6 }),
        ducto: new THREE.MeshPhysicalMaterial({ color: '#dfe6ea', roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.12, transparent: true, opacity: 0.26, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 0.9 }),
        banda: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.82, depthWrite: false, toneMapped: false }),
        soldadura: new THREE.MeshStandardMaterial({ color: '#7a7d84', roughness: 0.45, metalness: 0.8 }),
        amarillo: new THREE.MeshStandardMaterial({ color: '#d9a62c', roughness: 0.55, envMapIntensity: 0.5 }),
        azul: new THREE.MeshStandardMaterial({ color: '#2d6f9f', roughness: 0.45, metalness: 0.3, envMapIntensity: 0.6 }),
        rojo: new THREE.MeshStandardMaterial({ color: '#c8352f', roughness: 0.5, metalness: 0.2, envMapIntensity: 0.6 }),
        naranja: new THREE.MeshStandardMaterial({ color: '#d9792c', roughness: 0.55, envMapIntensity: 0.5 }),
        ventilador: new THREE.MeshStandardMaterial({ color: '#4d5057', roughness: 0.5, metalness: 0.6, side: THREE.DoubleSide }),
        rejilla: new THREE.MeshStandardMaterial({ color: '#8d919a', roughness: 0.5, metalness: 0.7, envMapIntensity: 0.8 }),
        cristal: new THREE.MeshStandardMaterial({ color: '#2b3540', roughness: 0.25, metalness: 0.4 }),
        llanta: new THREE.MeshStandardMaterial({ color: '#232427', roughness: 0.9 }),
        pipa: new THREE.MeshStandardMaterial({ color: '#eceae4', roughness: 0.4, metalness: 0.2, envMapIntensity: 0.7 }),
        cabina: new THREE.MeshStandardMaterial({ color: P.guinda, roughness: 0.45, metalness: 0.2, envMapIntensity: 0.6 }),
        cubiertaDeck: new THREE.MeshStandardMaterial({ color: '#b6bac0', roughness: 0.42, metalness: 0.75, envMapIntensity: 0.9 }),
        membrana: new THREE.MeshStandardMaterial({ color: '#dfe2e5', roughness: 0.32, metalness: 0.85, envMapIntensity: 1 }),
        vaporEsp: new THREE.MeshBasicMaterial({ color: '#b9c6d2', transparent: true, opacity: 0.32, depthWrite: false }),
        charco: new THREE.MeshStandardMaterial({ color: FLUIDOS.regular.color, roughness: 0.18, metalness: 0.1, transparent: true, opacity: 0.74, depthWrite: false }),
    });
    const suave = M.vaho;
    M.vaho = {
        espuma: new THREE.SpriteMaterial({ map: suave, color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }),
        vapor: new THREE.SpriteMaterial({ map: suave, color: '#8f9aa6', transparent: true, opacity: 0, depthWrite: false }),
        chorro: new THREE.SpriteMaterial({ map: suave, color: FLUIDOS.regular.color, transparent: true, opacity: 0, depthWrite: false }),
    };
    M.espumaAnillo = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85, transparent: true, opacity: 0, depthWrite: false });
    return M;
}

const [X0, X1] = BLOQUE.x;
const [Z0, Z1] = BLOQUE.z;
const Y0 = BLOQUE.y[0];
export function escenario(renderer, scene, M, { movil = false, oscuro = false } = {}) {
    const P = M.P;
    const dia = { terreno: new THREE.Color(oscuro ? '#a2a497' : P.tierraDia), losa: new THREE.Color(oscuro ? '#9a9b9a' : P.losaDia), concreto: new THREE.Color(oscuro ? '#a5a39c' : '#cfccc5'), asfalto: new THREE.Color(oscuro ? '#6d6f73' : '#8d8f93'), piso: new THREE.Color(oscuro ? '#8f8d84' : '#bfbcb2'), roca: new THREE.Color(oscuro ? '#c9c5bc' : '#ffffff') };
    const noche = { terreno: new THREE.Color(P.tierraNoche), losa: new THREE.Color(P.losaNoche), concreto: new THREE.Color('#383c42'), asfalto: new THREE.Color('#1d2024'), piso: new THREE.Color('#2a2d31'), roca: new THREE.Color('#6a655c') };
    if (oscuro) { M.torre.color.set('#8f929a'); M.marco.color.set('#7d818a'); }
    return estudio(renderer, scene, {
        movil, oscuro, y0: Y0, alcance: 15,
        alActualizar(n) {
            M.terreno.color.copy(dia.terreno).lerp(noche.terreno, n);
            M.losa.color.copy(dia.losa).lerp(noche.losa, n);
            M.concreto.color.copy(dia.concreto).lerp(noche.concreto, n);
            M.asfalto.color.copy(dia.asfalto).lerp(noche.asfalto, n);
            M.pisoDique.color.copy(dia.piso).lerp(noche.piso, n);
            M.roca.color.copy(dia.roca).lerp(noche.roca, n);
        },
    });
}

export function construir(M, P, { movil = false, oscuro = false } = {}) {
    const raiz = new THREE.Group();
    const ids = PARTES.map(p => p.id);
    const kit = crearAyudante(M, raiz, ids, { movil });
    const { partes, giran, unidad, mover, brillo, cub, rotular } = kit;
    const colorSuelo = oscuro ? '#f2efe8' : P.tinta;
    const plano = (padre, texto, x, z, ancho, giro = 0, y = 0.03) => { const r = rotular(padre, texto, x, y, z, colorSuelo, ancho); r.rotation.set(-PI / 2, 0, giro); return r; };
    const varias = (pares, r, m, seg = 5) => sombra(new THREE.Mesh(mergeGeometries(pares.map(([a, b]) => geoEntre(a, b, r, seg))), m));
    const losa = (w, d, x, z, m, y = 0.006) => { const l = new THREE.Mesh(new THREE.BoxGeometry(w, 0.012, d), m); l.position.set(x, y, z); l.receiveShadow = true; raiz.add(l); return l; };

    // --------- el predio y el corte de enfrente
    {
        const piso = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z_FONDO - Z0).rotateX(-PI / 2), M.terreno);
        piso.position.set((X0 + X1) / 2, -0.001, (Z0 + Z_FONDO) / 2);
        piso.receiveShadow = true;
        raiz.add(piso);
        const molde = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0 - 0.04, -Y0 - 0.04, Z1 - Z0 - 0.04), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
        molde.position.set((X0 + X1) / 2, Y0 / 2 - 0.02, (Z0 + Z1) / 2);
        molde.castShadow = true;
        raiz.add(molde);
        // las paredes del bloque
        const pared = (w, d, x, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, -Y0, d), M.roca); m.position.set(x, Y0 / 2, z); m.receiveShadow = true; raiz.add(m); };
        pared(X1 - X0, 0.02, (X0 + X1) / 2, Z0 + 0.01);
        pared(0.02, Z_FONDO - Z0, X0 + 0.01, (Z0 + Z_FONDO) / 2);
        pared(0.02, Z_FONDO - Z0, X1 - 0.01, (Z0 + Z_FONDO) / 2);
        // la rebanada, con el hueco por donde pasa el poliducto
        const ALTO = 0.22;
        const hx0 = X_SUBE - 0.24;
        const hx1 = X1 - 0.04;
        const hueco = [[hx0, Y_DUCTO + ALTO], [hx1, Y_DUCTO + ALTO], [hx1, Y_DUCTO - ALTO], [hx0, Y_DUCTO - ALTO]].map(([x, y]) => new THREE.Vector2(x, y));
        const forma = new THREE.Shape([[X0, Y0], [X0, -0.001], [X1, -0.001], [X1, Y0]].map(([x, y]) => new THREE.Vector2(x, y)));
        forma.holes.push(new THREE.Path(hueco));
        const rebanada = new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: Z1 - Z_FONDO, bevelEnabled: false, steps: 1, curveSegments: 1 }).translate(0, 0, Z_FONDO), [M.roca, M.hueco]);
        rebanada.receiveShadow = true;
        raiz.add(rebanada);
        const fondo = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape(hueco)), M.fondoHueco);
        fondo.position.z = Z_FONDO + 0.001;
        raiz.add(fondo);
        const tapa = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z_FONDO).rotateX(-PI / 2), M.terreno);
        tapa.position.set((X0 + X1) / 2, 0, (Z_FONDO + Z1) / 2);
        tapa.receiveShadow = true;
        raiz.add(tapa);
    }
    // --------- caminos
    {
        losa(X1 - 3.2, 0.62, (3.2 + X1) / 2, 2.5, M.asfalto);
        losa(2.56, 3.86, 4.5, 0.26, M.asfalto);
        losa(X1 - 3.2, 0.62, (3.2 + X1) / 2, -1.94, M.asfalto);
        for (let x = 6; x < X1 - 0.3; x += 0.62) { losa(0.32, 0.03, x, 2.5, M.raya, 0.014); losa(0.32, 0.03, x, -1.94, M.raya, 0.014); }
        plano(raiz, 'Pipas que llegan', 6.8, 2.84, 1.3, 0, 0.018);
        plano(raiz, 'Pipas que salen', 5.1, -2.36, 1.3, 0, 0.018);
    }

    // --------- el poliducto enterrado: su pared de vidrio y las tandas
    const R_D = 0.13;
    {
        const pared = new THREE.Mesh(new THREE.CylinderGeometry(R_D, R_D, X1 - 0.04 - X_SUBE, 22, 1, true).rotateZ(PI / 2), M.ducto);
        pared.position.set((X1 - 0.04 + X_SUBE) / 2, Y_DUCTO, Z_DUCTO);
        pared.renderOrder = 5;
        raiz.add(pared);
        partes.poliducto.push(pared);
        const uniones = [];
        for (let x = X_SUBE + 0.3; x < X1 - 0.1; x += 0.5) uniones.push(geoEntre([x - 0.006, Y_DUCTO, Z_DUCTO], [x + 0.006, Y_DUCTO, Z_DUCTO], R_D + 0.006, 22));
        raiz.add(new THREE.Mesh(mergeGeometries(uniones), M.soldadura));
        plano(raiz, 'Poliducto: las tandas viajan una tras otra', 1.2, 3.22, 3.2, 0, 0.004);
    }
    const N_BANDA = movil ? 110 : 190;
    const banda = new THREE.InstancedMesh(new THREE.CylinderGeometry(R_D - 0.016, R_D - 0.016, 1, 14).rotateZ(PI / 2), M.banda, N_BANDA);
    banda.renderOrder = 3;
    banda.frustumCulled = false;
    const xBanda = [];
    {
        const m4 = new THREE.Matrix4();
        const q = new THREE.Quaternion();
        const dx = (X1 - 0.04 - X_SUBE) / N_BANDA;
        for (let i = 0; i < N_BANDA; i++) {
            const x = X_SUBE + (i + 0.5) * dx;
            m4.compose(new THREE.Vector3(x, Y_DUCTO, Z_DUCTO), q, new THREE.Vector3(dx * 1.03, 1, 1));
            banda.setMatrixAt(i, m4);
            banda.setColorAt(i, new THREE.Color(FLUIDOS.regular.color));
            xBanda.push(x);
        }
    }
    raiz.add(banda);
    partes.poliducto.push(banda);

    // --------- la trampa: adonde llega el diablo
    {
        const g = unidad('poliducto', -6.8, 2.2);
        g.add(en(caja(0.84, 0.03, 0.42, M.concreto), 0, 0, 0));
        const c = cub('trampaC', ['poliducto'], { color: '#b8bbbd', metal: 0.6 });
        const cuerpo = new THREE.Group();
        cuerpo.add(en(cilX(0.075, 0.5, c, 20), 0, 0.2, 0));
        cuerpo.add(en(cilX(0.09, 0.03, M.guinda, 22), -0.27, 0.2, 0));
        cuerpo.add(en(cilX(0.088, 0.03, M.grafito, 20), 0.26, 0.2, 0));
        g.add(mover(cuerpo, [0, 0.55, 0]));
        for (const x of [-0.16, 0.16]) g.add(en(caja(0.035, 0.13, 0.12, M.grafito), x, 0.02, 0));
    }

    // --------- el densímetro y las válvulas del múltiple
    const lamparas = {};
    {
        const g = unidad('densimetro', -6.1, 2.2);
        const c = cub('densiC', ['densimetro'], { color: '#c9ccd0', metal: 0.3 });
        g.add(en(caja(0.5, 0.03, 0.5, M.concreto), 0, 0, 0));
        const tapa = new THREE.Group();
        tapa.add(en(caja(0.44, 0.34, 0.44, c), 0, 0.03, 0));
        tapa.add(en(caja(0.48, 0.03, 0.48, cub('densiT', ['densimetro'], { color: '#303137', metal: 0.5 })), 0, 0.37, 0));
        g.add(mover(tapa, [0, 0.8, 0]));
        // adentro: el tubo pasa por el medidor, que lee la densidad
        g.add(en(cilX(0.028, 0.44, M.acero, 12), 0, 0.2, 0));
        g.add(en(cil(0.07, 0.1, M.azul, 0.07, 16), 0, 0.15, 0));
        g.add(en(caja(0.16, 0.1, 0.03, M.grafito), 0, 0.26, -0.03));
        g.add(en(caja(0.13, 0.07, 0.006, M.neonGuinda), 0, 0.275, -0.012));
        // el múltiple: una válvula por producto, y una más para la mezcla
        const v = unidad('densimetro', -5.5, 0);
        for (const [z, k] of [[-0.33, 'diesel'], [-0.45, 'premium'], [-0.57, 'regular'], [-0.9, 'mezcla']]) {
            v.add(en(cil(0.034, 0.06, M.grafito, 0.034, 12), 0, 0.23, z));
            v.add(entre([0, 0.29, z], [0, 0.34, z], 0.008, M.acero));
            v.add(en(aro(0.03, 0.006, M.fluido[k]), 0, 0.345, z));
            const l = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), M.fluido[k]);
            l.position.set(-0.07, 0.34, z);
            v.add(l);
            lamparas[k] = l;
        }
        plano(raiz, 'Múltiple de válvulas', -5.8, -0.5, 0.84, PI / 2, 0.018);
    }

    // --------- los tanques
    const tanques = [];
    const unaEscalera = (g, r, h, m, inicio = -0.5) => {
        const peld = [];
        for (let k = 0; k < 16; k++) { const a = inicio + (k / 16) * 2; const y = (k / 16) * h; peld.push([[Math.cos(a) * (r + 0.015), y, Math.sin(a) * (r + 0.015)], [Math.cos(a + 0.125) * (r + 0.015), y + h / 16, Math.sin(a + 0.125) * (r + 0.015)]]); }
        g.add(varias(peld, 0.006, m, 4));
    };
    const camaraEspuma = (g, r, h, a) => {
        const [cx, sx] = [Math.cos(a), Math.sin(a)];
        g.add(en(caja(0.05, 0.055, 0.05, M.rojo), cx * (r + 0.03), h - 0.07, sx * (r + 0.03)));
        g.add(entre([cx * (r + 0.03), 0.02, sx * (r + 0.03)], [cx * (r + 0.03), h - 0.07, sx * (r + 0.03)], 0.007, M.rojo));
    };
    const unTanque = (t, parte) => {
        const r = radioDe(t);
        const h = H_ESCENA;
        const g = unidad(parte, t.x, t.z);
        const c = cub(`${t.id}C`, [parte], { color: '#ecebe6' });
        g.add(en(cil(r + 0.03, 0.02, M.concreto, r + 0.03, 40), 0, 0, 0));
        const lado = sombra(new THREE.Mesh(new THREE.CylinderGeometry(r, r, h - 0.02, 44, 1, true).translate(0, h / 2 + 0.01, 0), c));
        g.add(mover(lado, [0, 1.05, 0]));
        const liqM = new THREE.MeshStandardMaterial({ color: FLUIDOS[t.prod].color, roughness: 0.3, envMapIntensity: 0.6 });
        const liq = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.012, r - 0.012, 1, 32).translate(0, 0.5, 0), liqM);
        liq.position.y = 0.02;
        g.add(liq);
        let deck = null;
        let escalera = null;
        if (t.techo === 'externo') {
            deck = new THREE.Group();
            deck.add(sombra(new THREE.Mesh(new THREE.CylinderGeometry(r - 0.016, r - 0.016, 0.022, 36), M.cubiertaDeck)));
            deck.add(new THREE.Mesh(new THREE.TorusGeometry(r - 0.05, 0.022, 8, 40).rotateX(PI / 2), M.acero));
            deck.add(en(cil(0.05, 0.022, M.grafito, 0.05, 14), 0.16, 0.012, 0.1));
            // la espuma se queda en el anillo, entre el techo y la pared
            deck.add(en(new THREE.Mesh(new THREE.TorusGeometry(r - 0.045, 0.045, 8, 44).rotateX(PI / 2).scale(1, 0.7, 1), M.espumaAnillo), 0, 0.03, 0));
            g.add(deck);
            escalera = sombra(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.008, 1), M.grafito));
            g.add(escalera);
            g.add(en(aro(r + 0.03, 0.012, M.acero), 0, h - 0.05, 0));
            g.add(en(aro(r + 0.004, 0.008, M.acero), 0, h, 0));
        } else {
            // techo fijo: un cono muy bajo o un domo. Se levanta al desarmar
            const roof = t.techo === 'fijo'
                ? new THREE.Mesh(new THREE.ConeGeometry(r + 0.012, 0.09, 40, 1, true).translate(0, 0.045, 0), cub(`${t.id}R`, [parte], { color: '#dcdad4' }))
                : new THREE.Mesh(new THREE.SphereGeometry(r + 0.02, 40, 10, 0, PI * 2, 0, 0.5).scale(1, 0.48, 1).translate(0, -(r + 0.02) * 0.48 * Math.cos(0.5), 0), cub(`${t.id}R`, [parte], { color: '#c6cace', metal: 0.7 }));
            sombra(roof);
            roof.position.y = h;
            const tejado = new THREE.Group();
            tejado.add(roof);
            if (t.techo === 'fijo') {
                tejado.add(en(cil(0.028, 0.05, M.grafito, 0.024, 10), 0.12, h + 0.04, 0.05));
                tejado.add(en(cil(0.04, 0.016, M.guinda, 0.04, 12), 0.12, h + 0.09, 0.05));
            } else {
                for (const a of [0, 2.1, 4.2]) tejado.add(en(cil(0.035, 0.022, M.acero, 0.02, 12), Math.cos(a) * r * 0.62, h + 0.055, Math.sin(a) * r * 0.62));
            }
            g.add(mover(tejado, [0, 1.65, 0]));
            if (t.techo === 'membrana') {
                deck = new THREE.Group();
                deck.add(new THREE.Mesh(new THREE.CylinderGeometry(r - 0.016, r - 0.016, 0.012, 36), M.membrana));
                deck.add(new THREE.Mesh(new THREE.TorusGeometry(r - 0.018, 0.008, 6, 40).rotateX(PI / 2), M.grafito));
                g.add(deck);
            }
        }
        // el espacio de vapor, en los de techo fijo
        const vapor = t.techo === 'fijo' || t.id === 't1' ? new THREE.Mesh(new THREE.CylinderGeometry(r - 0.016, r - 0.016, 1, 28, 1, true).translate(0, 0.5, 0), M.vaporEsp) : null;
        if (vapor) { vapor.renderOrder = 2; g.add(vapor); }
        unaEscalera(g, r, h, M.grafito);
        camaraEspuma(g, r, h, -2.3);
        camaraEspuma(g, r, h, -0.6);
        // la regla de nivel, por fuera: siempre a la vista
        const [ax, az] = [0.5, Math.sqrt(1 - 0.25)];
        const regla = new THREE.Group();
        regla.position.set(ax * (r + 0.012), 0.02, az * (r + 0.012));
        regla.rotation.y = Math.atan2(ax, az);
        regla.add(en(caja(0.052, h - 0.04, 0.006, M.grafito), 0, 0, 0));
        const barra = new THREE.Mesh(new THREE.BoxGeometry(0.036, 1, 0.006).translate(0, 0.5, 0), M.fluido[t.prod]);
        barra.position.set(0, 0.005, 0.006);
        regla.add(barra);
        g.add(regla);
        const l = rotular(g, NOMBRE[t.prod], -0.28 * r, h * 0.56, r + 0.014, P.tinta, r * 1.05);
        l.renderOrder = 3;
        const n = rotular(g, `${t.mb} mil barriles`, -0.28 * r, h * 0.32, r + 0.014, P.tinta, r * 0.98);
        n.renderOrder = 3;
        tanques.push({ t, r, h, liq, deck, escalera, barra, vapor, n: 0.5 });
        return g;
    };
    unTanque(TANQUES[0], 'externo');
    unTanque(TANQUES[1], 'membrana');
    unTanque(TANQUES[2], 'membrana');
    unTanque(TANQUES[3], 'fijo');
    unTanque(TANQUES[4], 'medicion');
    // el techo que se prueba en el tanque mayor, en «Vapores»
    const conoM = M.cubierta.clone();
    conoM.opacity = 0.42;
    conoM.depthWrite = false;
    const conoPrueba = new THREE.Mesh(new THREE.ConeGeometry(radioDe(TANQUES[0]) + 0.012, 0.09, 40, 1, true).translate(0, 0.045, 0), conoM);
    {
        const t = TANQUES[0];
        conoPrueba.position.set(t.x, H_ESCENA, t.z);
        conoPrueba.visible = false;
        raiz.add(conoPrueba);
    }
    // el tanque de mezcla
    {
        const t = T_MEZCLA;
        const r = radioDe(t);
        const g = unidad('mezcla', t.x, t.z);
        const c = cub('mezclaC', ['mezcla'], { color: '#e3e2dd' });
        g.add(mover(sombra(new THREE.Mesh(recipienteGeo(r, 0.36, 0.3), c)), [0, 0.8, 0]));
        const liq = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.012, r - 0.012, 0.18, 18).translate(0, 0.09, 0), M.fluido.mezcla);
        liq.position.y = 0.02;
        g.add(liq);
        const regla = rotular(g, 'Mezcla', 0, 0.2, r + 0.008, P.tinta, 0.26);
        regla.renderOrder = 3;
        for (const [w, d, x, z] of [[0.76, 0.04, 0, -0.36], [0.76, 0.04, 0, 0.36], [0.04, 0.72, -0.36, 0], [0.04, 0.72, 0.36, 0]]) g.add(en(caja(w, 0.08, d, M.concreto), x, 0, z));
        plano(raiz, 'Tanque de mezcla', t.x, t.z - 0.5, 0.86, 0, 0.018);
    }
    // el radar y la temperatura, en el último tanque: aquí se ve de cerca
    {
        const t = TANQUES[4];
        const g = unidad('medicion', t.x, t.z);
        const r = radioDe(t);
        g.add(en(cil(0.03, 0.05, M.azul, 0.042, 14), -0.14, H_ESCENA + 0.05, 0.08));
        g.add(entre([-0.14, H_ESCENA + 0.03, 0.08], [-0.14, 0.08, 0.08], 0.008, M.acero));
        const panel = new THREE.Group();
        panel.position.set(r * 0.9 + 0.14, 0, r * 0.5);
        panel.add(en(caja(0.1, 0.16, 0.05, M.marco), 0, 0.02, 0));
        panel.add(en(caja(0.07, 0.04, 0.006, M.neonGuinda), 0, 0.12, 0.028));
        g.add(panel);
    }
    // el control de la terminal
    {
        const g = unidad('medicion', -6.9, -1.5);
        g.add(en(caja(1, 0.03, 0.74, M.concreto), 0, 0, 0));
        const c = cub('controlC', ['medicion'], { color: '#d9d8d2' });
        const edificio = new THREE.Group();
        edificio.add(en(caja(0.86, 0.34, 0.6, c), 0, 0.03, 0));
        edificio.add(en(caja(0.92, 0.03, 0.66, M.marco), 0, 0.37, 0));
        for (const x of [-0.26, 0, 0.26]) edificio.add(en(caja(0.14, 0.12, 0.006, M.ventana), x, 0.16, 0.303));
        g.add(mover(edificio, [0, 0.8, 0]));
        for (let k = 0; k < 3; k++) { g.add(en(caja(0.18, 0.1, 0.06, M.marco), -0.22 + k * 0.22, 0.03, -0.12)); g.add(en(caja(0.14, 0.07, 0.006, M.neonGuinda), -0.22 + k * 0.22, 0.14, -0.09)); }
        g.add(entre([0.3, 0.4, -0.1], [0.3, 0.92, -0.1], 0.007, M.grafito));
        g.add(en(aro(0.05, 0.005, M.guinda), 0.3, 0.92, -0.1));
        plano(raiz, 'Control', -6.9, -0.96, 0.6, 0, 0.018);
    }

    // --------- los diques
    const muros = [];
    const dique = (x0, x1, z0, z1, parte) => {
        const g = unidad(parte);
        const piso = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.008, z1 - z0), M.pisoDique);
        piso.position.set((x0 + x1) / 2, 0.004, (z0 + z1) / 2);
        piso.receiveShadow = true;
        g.add(piso);
        const muro = new THREE.Group();
        const pared = (w, d, x, z) => muro.add(en(caja(w, 0.11, d, M.concreto), x, 0, z));
        pared(x1 - x0 + 0.05, 0.05, (x0 + x1) / 2, z0);
        pared(x1 - x0 + 0.05, 0.05, (x0 + x1) / 2, z1);
        pared(0.05, z1 - z0, x0, (z0 + z1) / 2);
        pared(0.05, z1 - z0, x1, (z0 + z1) / 2);
        g.add(muro);
        muros.push(muro);
        // escalones para cruzar el muro
        const paso = (x, z) => g.add(en(caja(0.08, 0.14, 0.12, M.acero), x, 0, z));
        paso((x0 + x1) / 2, z1);
        return g;
    };
    dique(-4.4, 1.3, -2.95, -0.75, 'dique');
    dique(-4.35, -0.35, -0.25, 1.75, 'dique');
    plano(raiz, 'Dique de las gasolinas', -2.4, -0.92, 1.1, 0, 0.014);
    plano(raiz, 'Dique del diésel', -3.2, 1.56, 1, 0, 0.014);
    // el drenaje aceitoso y su separador
    {
        const g = unidad('dique', -4.81, 1.5);
        const c = cub('sepC', ['dique'], { color: '#b4b1a7' });
        g.add(en(caja(0.42, 0.11, 0.44, c), 0, 0, 0));
        g.add(en(caja(0.44, 0.012, 0.46, M.rejilla), 0, 0.11, 0));
        for (const x of [-0.08, 0.08]) g.add(en(caja(0.012, 0.09, 0.4, M.grafito), x, 0.01, 0));
        plano(raiz, 'Separador', -4.81, 1.86, 0.54, 0, 0.018);
        // el registro del dique
        g.add(en(cil(0.04, 0.012, M.grafito, 0.04, 12), 0.72, 0.008, 0));
    }
    // el charco
    const dimC = { x0: -4.37, x1: 1.27, z0: -2.92, z1: -0.78 };
    const charco = new THREE.Mesh(new THREE.BoxGeometry(dimC.x1 - dimC.x0, 1, dimC.z1 - dimC.z0).translate(0, 0.5, 0), M.charco);
    charco.position.set((dimC.x0 + dimC.x1) / 2, 0.008, (dimC.z0 + dimC.z1) / 2);
    charco.visible = false;
    charco.renderOrder = 2;
    raiz.add(charco);
    const fuera = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.01, 30).translate(0, 0.005, 0), M.charco);
    fuera.position.set(-1.55, 0.006, -0.5);
    fuera.visible = false;
    raiz.add(fuera);
    const chorros = [];
    for (let k = 0; k < 8; k++) {
        const s = new THREE.Sprite(M.vaho.chorro);
        s.renderOrder = 7;
        s.visible = false;
        raiz.add(s);
        chorros.push({ s, fase: k / 8 });
    }

    // --------- el puente de tubos
    {
        const pars = [];
        for (let x = -4.8; x < 0.9; x += 0.62) {
            pars.push([[x, 0, -0.27], [x, 0.3, -0.27]], [[x, 0, -0.63], [x, 0.3, -0.63]], [[x, 0.3, -0.27], [x, 0.3, -0.63]], [[x, 0.05, -0.27], [x, 0.05, -0.63]]);
        }
        raiz.add(varias(pars, 0.007, M.marco, 4));
        const p2 = [];
        for (let x = 1.1; x < 3.1; x += 0.5) p2.push([[x, 0, 0.56], [x, 0.09, 0.56]], [[x, 0, 0.92], [x, 0.09, 0.92]], [[x, 0.09, 0.56], [x, 0.09, 0.92]]);
        raiz.add(varias(p2, 0.007, M.marco, 4));
    }

    // --------- la casa de bombas
    {
        const g = unidad('bombas', 0.5, 0.22);
        g.add(en(caja(0.96, 0.03, 0.72, M.concreto), 0, 0, 0));
        const c = cub('bombaR', ['bombas'], { color: '#a9adb3', metal: 0.4 });
        const tejado = new THREE.Group();
        tejado.add(en(caja(1, 0.025, 0.76, c), 0, 0.42, 0));
        g.add(mover(tejado, [0, 0.9, 0]));
        const pars = [];
        for (const [x, z] of [[-0.46, -0.34], [0.46, -0.34], [-0.46, 0.34], [0.46, 0.34]]) pars.push([[x, 0, z], [x, 0.42, z]]);
        g.add(varias(pars, 0.012, M.marco, 4));
        for (const [x, k] of [[-0.25, 'diesel'], [0, 'premium'], [0.25, 'regular']]) {
            g.add(entre([x, 0.07, -0.22], [x, 0.09, 0.1], 0.024, M.fluido[k]));
            const cuerpo = cil(0.06, 0.08, M.azul, 0.06, 16);
            g.add(en(cuerpo, x, 0.04, -0.06));
            const motor = cil(0.045, 0.12, M.grafito, 0.045, 14);
            g.add(en(motor, x, 0.12, -0.06));
            const eje = new THREE.Group();
            eje.position.set(x, 0.25, -0.06);
            eje.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.008, 0.012), M.acero));
            g.add(eje);
            giran.push({ obj: eje, eje: 'y', vel: e => 14 * e.activo.carga });
        }
        plano(raiz, 'Bombas', 0.5, 1.06, 0.5, 0, 0.018);
    }
    // --------- los aditivos
    {
        const g = unidad('aditivos', 1.7, 1.32);
        const c = cub('aditC', ['aditivos'], { color: '#d9d4c8' });
        g.add(en(caja(0.56, 0.03, 0.44, M.concreto), 0, 0, 0));
        const v = sombra(new THREE.Mesh(recipienteGeo(0.11, 0.26, 0.5), c));
        v.position.set(-0.12, 0.05, 0);
        g.add(mover(v, [0, 0.7, 0]));
        g.add(en(cil(0.1, 0.13, M.naranja, 0.1, 16), -0.12, 0.07, 0));
        g.add(en(caja(0.12, 0.1, 0.1, M.azul), 0.12, 0.03, 0));
        g.add(entre([-0.02, 0.1, 0], [0.06, 0.08, 0], 0.012, M.fluido.aditivo));
        g.add(entre([0.12, 0.13, 0], [0, 0.24, -0.2], 0.012, M.fluido.aditivo));
        plano(raiz, 'Aditivos', 1.7, 1.66, 0.54, 0, 0.018);
    }

    // --------- las llenaderas
    const lamparasLane = [];
    {
        const g = unidad('llenaderas');
        const c = cub('toldoC', ['llenaderas'], { color: '#a2a6ac', metal: 0.5 });
        const toldo = new THREE.Group();
        toldo.add(en(caja(2.56, 0.03, 1.4, c), 4.5, 0.66, 0.42));
        toldo.add(en(caja(2.6, 0.05, 0.04, M.guinda), 4.5, 0.64, 1.14));
        g.add(mover(toldo, [0, 1, 0]));
        const pars = [];
        for (const x of [3.26, 4.5, 5.74]) for (const z of [-0.24, 1.08]) pars.push([[x, 0, z], [x, 0.66, z]]);
        g.add(varias(pars, 0.016, M.marco, 5));
        // brazos, medidores y controles en cada posición
        X_LANES.forEach((x, i) => {
            const xa = x + 0.19;
            g.add(en(caja(0.1, 0.05, 1.2, M.concreto), xa, 0, 0.42));
            g.add(en(caja(0.08, 0.2, 0.1, M.azul), xa, 0.05, 0.74));
            g.add(en(caja(0.07, 0.1, 0.04, M.marco), xa, 0.2, 0.42));
            g.add(en(caja(0.05, 0.03, 0.006, M.neonGuinda), xa, 0.26, 0.442));
            g.add(entre([xa, 0.54, 0.7], [xa, 0.26, 0.7], 0.01, M.acero));
            g.add(entre([xa, 0.26, 0.7], [xa - 0.08, 0.14, 0.5], 0.008, M.acero));
            g.add(entre([xa - 0.08, 0.14, 0.5], [xa - 0.08, 0.12, 0.42], 0.008, M.acero));
            g.add(entre([xa, 0.48, 0.14], [xa, 0.2, 0.14], 0.007, M.fluido.vapor));
            g.add(entre([xa, 0.2, 0.14], [xa - 0.08, 0.13, 0.2], 0.006, M.fluido.vapor));
            const l = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), M.fluido.regular);
            l.position.set(xa, 0.32, 0.42);
            g.add(l);
            lamparasLane.push(l);
            void i;
        });
        plano(raiz, 'Llenaderas', 4.5, 1.82, 0.9, 0, 0.018);
    }

    // --------- la recuperación de vapores
    {
        const g = unidad('vapores', 6.34, 0.34);
        const c = cub('urvC', ['vapores'], { color: '#c7cace', metal: 0.5 });
        g.add(en(caja(0.84, 0.03, 0.96, M.concreto), 0, 0, 0));
        for (const z of [-0.2, 0.2]) {
            const v = sombra(new THREE.Mesh(recipienteGeo(0.13, 0.6, 0.5), c));
            v.position.set(0.1, 0.04, z);
            g.add(mover(v, [0, 0.9, 0]));
            g.add(en(cil(0.11, 0.3, M.grafito, 0.11, 16), 0.1, 0.14, z));
        }
        g.add(en(caja(0.22, 0.2, 0.42, M.azul), -0.25, 0.03, 0));
        g.add(entre([-0.25, 0.24, 0], [0.1, 0.46, 0], 0.016, M.acero));
        g.add(entre([0.1, 0.72, 0.2], [0.1, 0.8, 0.2], 0.008, M.grafito));
        plano(raiz, 'Recuperación de vapores', 6.32, 0.96, 1.2, 0, 0.018);
    }

    // --------- agua y espuma
    {
        const g = unidad('incendio', 2.32, -2.25);
        const c = cub('aguaC', ['incendio'], { color: '#d8dde2' });
        g.add(en(cil(0.5, 0.02, M.concreto, 0.5, 30), 0, 0, 0));
        g.add(mover(sombra(new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.46, 34, 1, true).translate(0, 0.25, 0), c)), [0, 0.8, 0]));
        g.add(mover(sombra(new THREE.Mesh(new THREE.ConeGeometry(0.47, 0.06, 34).translate(0, 0.51, 0), cub('aguaR', ['incendio'], { color: '#c1c6cc' }))), [0, 1.1, 0]));
        const agua = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.36, 28).translate(0, 0.2, 0), new THREE.MeshStandardMaterial({ color: FLUIDOS.agua.color, roughness: 0.3 }));
        g.add(agua);
        const l = rotular(g, 'Agua', 0, 0.3, 0.468, P.tinta, 0.42);
        l.renderOrder = 3;
        // la espuma y las bombas
        const h = unidad('incendio', 2.32, -1.36);
        h.add(en(caja(1, 0.03, 0.44, M.concreto), 0, 0, 0));
        h.add(en(cilX(0.09, 0.42, M.rojo, 18), -0.22, 0.15, 0));
        const et = rotular(h, 'Espuma', -0.22, 0.15, 0.094, '#ffffff', 0.28);
        et.renderOrder = 3;
        for (const x of [0.12, 0.34]) { h.add(en(cilX(0.05, 0.14, M.rojo, 14), x, 0.08, 0)); h.add(en(caja(0.06, 0.1, 0.1, M.grafito), x + 0.12, 0.03, 0)); }
        h.add(entre([-0.4, 0.05, 0.14], [0.42, 0.05, 0.14], 0.012, M.rojo));
        // la red roja alrededor del dique, con monitores
        const red = [[[1.45, 0.03, -1.22], [1.45, 0.03, -3]], [[1.45, 0.03, -0.7], [1.45, 0.03, -1.22]], [[1.82, 0.03, -1.22], [1.45, 0.03, -1.22]], [[-4.52, 0.03, -0.7], [1.45, 0.03, -0.7]], [[-4.52, 0.03, -0.7], [-4.52, 0.03, 1.9]], [[-4.52, 0.03, 1.9], [-0.2, 0.03, 1.9]]];
        const m = unidad('incendio');
        m.add(varias(red, 0.009, M.rojo, 6));
        const monitor = (x, z) => {
            m.add(entre([x, 0.03, z], [x, 0.17, z], 0.012, M.rojo));
            const c2 = new THREE.Group();
            c2.position.set(x, 0.17, z);
            c2.add(en(cilX(0.012, 0.09, M.rojo, 8), 0.03, 0.01, 0));
            c2.rotation.y = Math.atan2(z - (-1.8), -(x - (-1.5)));
            m.add(c2);
        };
        monitor(1.45, -2.4);
        monitor(1.45, -1.05);
        monitor(-4.52, -0.05);
        monitor(-2.5, 1.9);
        plano(raiz, 'Contra incendio', 2.3, -0.98, 0.96, 0, 0.018);
    }
    const espumas = [];
    {
        const t = TANQUES[0];
        const r = radioDe(t);
        for (let k = 0; k < (movil ? 12 : 20); k++) {
            const a = (k / 20) * PI * 2;
            const s = new THREE.Sprite(M.vaho.espuma);
            s.position.set(t.x + Math.cos(a) * (r - 0.04), H_ESCENA * 0.7, t.z + Math.sin(a) * (r - 0.04));
            s.renderOrder = 7;
            s.visible = false;
            raiz.add(s);
            espumas.push({ s, a, k, y: H_ESCENA * 0.7 });
        }
        for (const [x, z] of [[3.6, 0.3], [4.3, 0.3], [5.1, 0.3], [5.6, 0.3]]) {
            const s = new THREE.Sprite(M.vaho.espuma);
            s.position.set(x, 0.42, z);
            s.renderOrder = 7;
            s.visible = false;
            raiz.add(s);
            espumas.push({ s, a: 0, k: x, y: 0.42 });
        }
    }

    // --------- el vapor que se escapa
    const vahos = [];
    const unVaho = (x, y, z, esc, clave) => {
        for (let k = 0; k < 3; k++) {
            const s = new THREE.Sprite(M.vaho.vapor);
            s.position.set(x, y, z);
            s.renderOrder = 6;
            s.visible = false;
            raiz.add(s);
            vahos.push({ s, x, y, z, esc, fase: k / 3, clave });
        }
    };
    X_LANES.slice(1, 5).forEach(x => unVaho(x, 0.46, 0.1, 0.42, 'urv'));
    unVaho(TANQUES[0].x + 0.1, H_ESCENA + 0.1, TANQUES[0].z, 0.5, 'fijo');
    unVaho(TANQUES[0].x - 0.28, H_ESCENA + 0.08, TANQUES[0].z + 0.2, 0.4, 'fijo');

    // --------- la gasolinera
    {
        const g = unidad('reparto', 7.4, -0.95);
        g.add(en(caja(1.72, 0.012, 1.3, M.concreto), 0, 0, 0));
        const techo = new THREE.Group();
        techo.add(en(caja(1.05, 0.035, 0.58, M.guinda), 0.12, 0.42, 0.1));
        g.add(mover(techo, [0, 0.8, 0]));
        const pars = [[[-0.2, 0, 0.1], [-0.2, 0.42, 0.1]], [[0.44, 0, 0.1], [0.44, 0.42, 0.1]]];
        g.add(varias(pars, 0.018, M.marco, 5));
        for (const x of [-0.2, 0.44]) { g.add(en(caja(0.1, 0.16, 0.05, M.marfil), x, 0.012, 0.1)); g.add(en(caja(0.07, 0.04, 0.054, M.fluido.regular), x, 0.12, 0.1)); }
        g.add(en(caja(0.42, 0.26, 0.3, M.marfil), -0.56, 0.012, -0.34));
        g.add(en(caja(0.36, 0.1, 0.006, M.ventana), -0.56, 0.1, -0.188));
        // la boca del tanque enterrado y el regreso de vapores
        g.add(en(cil(0.03, 0.02, M.fluido.regular, 0.03, 12), 0.34, 0.01, -0.46));
        g.add(en(cil(0.03, 0.02, M.fluido.vapor, 0.03, 12), 0.5, 0.01, -0.46));
        g.add(entre([0.72, 0.012, -0.36], [0.72, 0.5, -0.36], 0.008, M.grafito));
        plano(raiz, 'Gasolinera', 7.4, -0.36, 0.8, 0, 0.018);
    }

    // --------- árboles
    {
        const lista = [[-8.1, -2.6], [-7.3, -2.7], [-6.5, -2.75], [-5.75, -2.7], [-8.1, -0.2], [-7.9, 0.8], [-8.05, 1.8], [-6.6, 0.3], [-5.95, 1.2], [3.5, -2.72], [4.3, -2.75], [5.2, -2.7], [6.2, -2.78], [7.3, -2.76], [8.1, -2.7], [1.9, 2.6], [1.1, 2.55], [0.2, 2.6], [-0.8, 2.6], [-1.9, 2.55], [-3, 2.6], [-4, 2.55], [8.05, 0.4], [7.4, 1], [8, 1.6]];
        const copa = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.14, 1).scale(1.2, 0.9, 1.2).translate(0, 0.14, 0), M.hoja, lista.length);
        const m4x = new THREE.Matrix4();
        const qx = new THREE.Quaternion();
        lista.forEach(([x, z], i) => { const e2 = 0.7 + azar(i, 95) * 0.7; m4x.compose(new THREE.Vector3(x, 0, z), qx, new THREE.Vector3(e2, e2, e2)); copa.setMatrixAt(i, m4x); });
        copa.castShadow = true;
        raiz.add(copa);
        // la cerca del predio
        const c = [];
        for (const [a, b] of [[[X0 + 0.1, Z0 + 0.1], [X1 - 0.1, Z0 + 0.1]], [[X0 + 0.1, Z0 + 0.1], [X0 + 0.1, Z_FONDO - 0.1]]]) {
            const n = Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.5);
            for (let k = 0; k <= n; k++) { const x = lerp(a[0], b[0], k / n); const z = lerp(a[1], b[1], k / n); c.push([[x, 0, z], [x, 0.12, z]]); }
            c.push([[a[0], 0.12, a[1]], [b[0], 0.12, b[1]]], [[a[0], 0.06, a[1]], [b[0], 0.06, b[1]]]);
        }
        raiz.add(varias(c, 0.0045, M.marco, 4));
    }

    // --------- las pipas
    const hazPipa = () => {
        const g = new THREE.Group();
        const LARGO = 0.62;
        g.add(en(caja(0.2, 0.03, LARGO, M.grafito), 0, 0.05, 0));
        const cabina = en(caja(0.21, 0.16, 0.14, M.cabina), 0, 0.06, -LARGO / 2 + 0.05);
        g.add(cabina);
        g.add(en(caja(0.18, 0.06, 0.006, M.cristal), 0, 0.15, -LARGO / 2 - 0.022));
        const tanque = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, LARGO - 0.2, 16).rotateX(PI / 2).scale(1, 0.85, 1), M.pipa);
        tanque.position.set(0, 0.17, 0.08);
        sombra(tanque);
        g.add(tanque);
        for (const z of [-0.2, 0.1, 0.22]) for (const x of [-0.1, 0.1]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.03, 10).rotateZ(PI / 2), M.llanta); r.position.set(x, 0.036, z); g.add(r); }
        g.visible = false;
        raiz.add(g);
        return g;
    };
    const pipasLane = X_LANES.map(() => hazPipa());
    const pipasFila = Array.from({ length: 6 }, () => hazPipa());
    const pipasSalen = Array.from({ length: 3 }, () => hazPipa());
    const pipaEstacion = hazPipa();
    pipaEstacion.position.set(7.84, 0, -0.98);
    pipaEstacion.rotation.y = 0;
    pipaEstacion.visible = true;

    // --------- lo que corre por los tubos de arriba
    const tubos = crearTubos({ raiz, lineas: LINEAS, fluidos: FLUIDOS, M, partes, parteDe: L => L.parte ?? null, movil });
    kit.cerrarGotas(new THREE.SphereGeometry(1, 8, 6));

    // lámparas de noche
    for (const [x, z] of [[3.5, 0.2], [5.5, 0.2], [0.5, 0.2], [-5.6, 1.4], [2.3, -1.3], [7.4, -0.85]]) brillo(raiz, x, 0.62, z, 0.95, '#ffd9a0', 'noche', 0.5);

    const anclas = {};
    for (const p of PARTES) {
        const o = new THREE.Object3D();
        o.position.set(...p.ancla);
        raiz.add(o);
        anclas[p.id] = o;
    }

    // ---------- posar
    const color = new THREE.Color();
    const colorDe = Object.fromEntries(Object.keys(PRODUCTOS).map(k => [k, new THREE.Color(FLUIDOS[k].color)]));
    const fract = x => x - Math.floor(x);
    function posar(e) {
        const n = e.noche;
        const act = p => (p === 'noche' ? n : p === 'siempre' ? 1 : p ? (e.activo[p] ?? 0) : 1);
        const a = sale(e.desarme * 3);
        const ab = { ...(e.abierta || {}), desarmeV: sale(e.desarme * 2.2) };
        const L = e.lectura;
        if (e.modo === 'vapores') ab.externo = 1;
        kit.posar(e, act, ab, { apagar: a });
        tubos.posar(e, a);
        // las tandas
        const anchoDe = L.anchoDe ?? ((p, q) => anchoEscena(p, q, DEF.km, DEF.v));
        for (let i = 0; i < N_BANDA; i++) {
            const T = trenEn(e.s + (xBanda[i] - X_SUBE), anchoDe);
            color.copy(colorDe[T.a]).lerp(colorDe[T.b], T.c);
            banda.setColorAt(i, color);
        }
        banda.instanceColor.needsUpdate = true;
        // las lámparas del múltiple dicen a dónde va lo que llega
        const ruta = L.ruta ?? null;
        for (const [k, l] of Object.entries(lamparas)) l.scale.setScalar(ruta === k ? 1.5 : ruta ? 0.55 : 1);
        // los tanques
        const k = Math.min(1, e.dt * 2.5);
        tanques.forEach(T => {
            const objetivo = e.niveles?.[T.t.id] ?? 0.56;
            T.n += (objetivo - T.n) * k;
            const y = 0.02 + (T.h - 0.04) * T.n;
            T.liq.scale.y = Math.max(0.001, y - 0.02);
            if (T.deck) T.deck.position.y = y + 0.008;
            if (T.escalera) {
                const dy = T.h - y;
                const largo = Math.hypot(dy, T.r * 0.92);
                T.escalera.scale.z = largo;
                T.escalera.position.set(0, (T.h + y) / 2, T.r * 0.46 * -1);
                T.escalera.rotation.x = Math.atan2(dy, T.r * 0.92);
            }
            T.barra.scale.y = Math.max(0.001, (T.h - 0.05) * T.n);
            if (T.vapor) { T.vapor.position.y = y; T.vapor.scale.y = Math.max(0.001, T.h - y); T.vapor.visible = T.t.id === 't1' ? e.modo === 'vapores' && (L.techo ?? 'externo') === 'fijo' : Math.max(e.adentro, ab.fijo ?? 0, ab.medicion ?? 0) > 0.3; }
        });
        // el techo que se prueba
        const techo = L.techo ?? 'externo';
        const t1 = tanques[0];
        const probando = e.modo === 'vapores' && techo === 'fijo';
        conoPrueba.visible = probando;
        if (t1.deck) t1.deck.visible = !probando;
        if (t1.escalera) t1.escalera.visible = !probando;
        // el derrame
        const F = L.F ?? null;
        charco.visible = Boolean(F) && F.hd > 0.002;
        if (F) {
            const esc = 0.11 / 1.8;
            charco.scale.y = Math.max(0.001, F.hd * esc);
            const queda = F.escapa > 1;
            fuera.visible = queda;
            if (queda) { const r = Math.min(2.4, 0.4 + Math.sqrt(F.escapa) * 0.03); fuera.scale.set(r, 1, Math.min(r, 0.26)); }
        } else fuera.visible = false;
        const altMuro = (L.muro ?? 1.8) / 1.8;
        muros.forEach(m => { m.scale.y = altMuro; });
        const fluye = F ? clamp01(F.h - F.hd) : 0;
        M.vaho.chorro.opacity = 0.9 * clamp01(fluye) * (1 - a);
        chorros.forEach(c => {
            c.s.visible = fluye > 0.02;
            if (!c.s.visible) return;
            const u = fract(e.t * 1.1 + c.fase);
            const t = TANQUES[0];
            const r = radioDe(t);
            c.s.position.set(t.x + 0.1, 0.12 - u * 0.09, t.z + r + 0.02 + u * 0.3);
            c.s.scale.setScalar(0.16 + u * 0.22);
        });
        // la espuma
        const es = e.activo.espuma;
        M.vaho.espuma.opacity = es;
        M.espumaAnillo.opacity = es;
        espumas.forEach(s => {
            s.s.visible = es > 0.02 && a < 0.5;
            if (!s.s.visible) return;
            const u = fract(e.t * 0.9 + s.k * 0.37);
            s.s.position.y = s.y - u * 0.05;
            s.s.scale.setScalar(0.3 + 0.16 * Math.sin(u * PI));
        });
        // el vapor que se escapa
        const sinURV = e.modo === 'vapores' && !L.urv;
        const vaporFijo = probando ? clamp01(L.fijo.total / 2000) + 0.3 : 0;
        M.vaho.vapor.opacity = 0.7 * (1 - a) * (1 - 0.3 * n);
        vahos.forEach(v => {
            const on = v.clave === 'urv' ? sinURV : vaporFijo > 0;
            v.s.visible = on && a < 0.8;
            if (!v.s.visible) return;
            const u = fract(e.t * 0.3 + v.fase);
            v.s.position.set(v.x + u * 0.16, v.y + u * 0.6, v.z - u * 0.1);
            v.s.scale.setScalar(v.esc * (0.35 + u));
        });
        // las pipas
        const nLanes = L.llenaderas ?? DEF.llenaderas;
        const mu = pipasPorHora(nLanes);
        const rho = clamp01((L.pipas ?? DEF.pipas) / Math.max(mu, 0.1));
        const CICLO = 9;
        pipasLane.forEach((g, i) => {
            const abierta = i < nLanes;
            lamparasLane[i].material = abierta ? M.fluido.regular : M.fluido.premium;
            const tt = e.t / CICLO + i * 0.37;
            const ciclo = Math.floor(tt);
            const u = tt - ciclo;
            const hay = abierta && azar(ciclo * 3 + i * 17, 7) < rho && a < 0.5;
            g.visible = hay;
            if (!hay) return;
            let z = 0.42;
            if (u < 0.2) z = lerp(2.5, 0.42, sale(u / 0.2));
            else if (u > 0.82) z = lerp(0.42, -1.94, (u - 0.82) / 0.18);
            g.position.set(X_LANES[i], 0, z);
            g.rotation.y = 0;
        });
        const enFila = Math.min(pipasFila.length, Math.round(e.fila ?? 0) + (rho > 0.7 ? 1 : 0));
        pipasFila.forEach((g, i) => {
            g.visible = i < enFila && a < 0.5;
            if (!g.visible) return;
            g.position.set(3.72 + i * 0.76, 0, 2.5);
            g.rotation.y = PI / 2;
        });
        pipasSalen.forEach((g, i) => {
            const u = fract(e.t / 11 + i / 3);
            const on = azar(Math.floor(e.t / 11 + i / 3) + i * 9, 5) < rho && a < 0.5;
            g.visible = on;
            if (!on) return;
            g.position.set(lerp(3.7, X1 - 0.35, u), 0, -1.94);
            g.rotation.y = -PI / 2;
        });
        pipaEstacion.visible = a < 0.5;
        M.lampara.color.set('#9a9c9f').lerp(new THREE.Color('#ffe2ad'), n);
        M.ventana.color.set('#3f4a57').lerp(new THREE.Color('#ffc77a'), n);
    }
    return { raiz, posar, partes, anclas, giran, repintar: kit.repintar };
}
