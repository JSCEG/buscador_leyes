// Los equipos que se modelan en Blender (conceptos-3d/<figura>/blender/equipos.py → equipos.glb, con scripts/build-blender.mjs).
// La página los lee del .glb que el armado incrusta y los reparte en el kit de crearAyudante: cada malla trae en sus extras a qué
// punto clave pertenece, qué material del sitio lleva, si es cubierta que se vuelve vidrio, cuánto se separa al desarmar y si gira.
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

/** base64 del .glb (el armado lo da así al importar un .glb) → glTF de three.js. */
export async function leerGlb(base64) {
    const bin = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const cargador = new GLTFLoader();
    cargador.setMeshoptDecoder(MeshoptDecoder);
    return cargador.parseAsync(bin.buffer, '');
}

/**
 * Pone cada malla en su punto clave con el material del sitio que nombra.
 * giros: { nombre: e => vueltas por segundo } para las piezas con `gira`; colorCubierta: { cubierta: color } opcional.
 */
export function montarGlb(gltf, kit, M, raiz, { movil = false, giros = {}, colorCubierta = {} } = {}) {
    const mallas = [];
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse(o => { if (o.isMesh) mallas.push(o); });
    const grupos = {};
    const faltan = new Set();
    // las mallas con sombra horneada (color AO) usan una copia del material que multiplica por ese color
    const conAo = new Map();
    const horneado = mat => {
        if (!conAo.has(mat)) { const c = mat.clone(); c.vertexColors = true; conAo.set(mat, c); }
        return conAo.get(mat);
    };
    for (const o of mallas) {
        const d = o.userData || {};
        o.matrixWorld.decompose(o.position, o.quaternion, o.scale);
        let mat = M[d.mat];
        if (d.cub) mat = kit.cub(d.cub, String(d.abre || '').split(',').filter(Boolean), colorCubierta[d.cub] ? { color: colorCubierta[d.cub] } : {});
        if (!mat) faltan.add(d.mat);
        mat = mat || M.marfil;
        if (o.geometry.attributes.color) {
            if (d.cub) mat.vertexColors = true;
            else mat = horneado(mat);
        }
        o.material = mat;
        o.castShadow = !movil && d.sombra !== 0;
        o.receiveShadow = true;
        const padre = d.parte && kit.partes[d.parte] ? (grupos[d.parte] ??= kit.unidad(d.parte)) : raiz;
        padre.add(o);
        if (d.mueve) kit.mover(o, d.mueve, d.k ?? 0);
        if (d.gira) kit.giran.push({ obj: o, eje: d.gira, vel: giros[d.vel] || (() => 1) });
    }
    if (faltan.size) console.warn('equipos.glb: materiales que no están en M', [...faltan]);
    // las copias con sombra siguen el color de su material, por si la figura lo cambia (noche, tema)
    const copias = [...conAo.entries()];
    return { mallas, sincronizar: () => copias.forEach(([base, copia]) => { copia.color.copy(base.color); copia.opacity = base.opacity; }) };
}
