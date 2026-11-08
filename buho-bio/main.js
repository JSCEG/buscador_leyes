// La toma para calcar: el búho biomecánico en cualquier pose y cámara (window.__POSE).
//   node ~/.claude/skills/artefacto-3d/scripts/toma.mjs <dist>/buho-bio.html toma.png '{"alas":0,"camara":{"mira":[0,0,0],"az":0,"el":4,"d":14}}'
import * as THREE from 'three';
import { runSim } from 'teardown-kit/runtime.js';
import { pose, posicionCamara, revisar } from './modelo.js';
import { P_BUHO, materiales, construir, cambiarVidrio } from './buho.js';
import { crearEscena } from './escena.js';
import manrope from '../public/fonts/Manrope-Variable.woff2';
import fraunces from '../public/fonts/Fraunces-Variable.woff2';

runSim({ duration: 8, fps: 60, theme: 'light', hud: { enabled: false }, director: { enabled: false } }, async ({ canvas }) => {
    const problemas = revisar();
    if (problemas.length) console.error('modelo:', problemas.join(' · '));
    for (const [familia, b64, peso] of [['Manrope', manrope, '200 800'], ['Fraunces', fraunces, '100 900']]) {
        document.fonts.add(await new FontFace(familia, `url(data:font/woff2;base64,${b64})`, { weight: peso }).load());
    }
    const { renderer, scene, camera, iluminar } = crearEscena(canvas, { conservar: true });
    const M = materiales(P_BUHO, {});
    const buho = construir(M, P_BUHO);
    scene.add(buho.raiz);

    function resize() {
        renderer.setPixelRatio(devicePixelRatio);
        renderer.setSize(innerWidth, innerHeight, false);
        camera.aspect = innerWidth / innerHeight;
        camera.updateProjectionMatrix();
    }
    function dibujar(e) {
        document.documentElement.style.background = document.body.style.background = e.noche > 0.5 ? P_BUHO.noche : P_BUHO.papel;
        iluminar(e, M.luz.color);
        buho.posar(e);
        camera.position.set(...posicionCamara(e.camara));
        camera.fov = e.camara.fov;
        camera.updateProjectionMatrix();
        camera.lookAt(...e.camara.mira);
        renderer.render(scene, camera);
        return {};
    }
    resize();
    window.__POSE = p => { if (p.vidrio) cambiarVidrio(M, p.vidrio); dibujar(pose({ t: 1.2, ...p })); return true; };
    window.__ERRORES = () => renderer.info.programs?.length;
    window.THREE_INFO = () => ({ draws: renderer.info.render.calls, tris: renderer.info.render.triangles });
    return { render: t => dibujar(pose({ t })), resize };
});
