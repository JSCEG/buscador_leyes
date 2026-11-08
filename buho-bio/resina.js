// La resina ámbar: un vidrio que no es de un solo color. Es oscura en las orillas y donde se mira de lado, se enciende hacia
// el centro, lleva nubes y grietas a tres profundidades que se mueven distinto al girar (parece que están adentro) y deja
// pasar lo que tiene detrás teñido por ese mismo fuego. Va sobre MeshPhysicalMaterial, con su transmisión o con película.
import * as THREE from 'three';

const PARS = /* glsl */`
uniform vec3 rHondo, rMedio, rCalor;
uniform float rLuz, rClaro;
varying vec2 vRDesfase;
`;

const CUERPO = /* glsl */`
#ifdef USE_EMISSIVEMAP
{
    vec3 rV = normalize( vViewPosition );
    float rNV = clamp( dot( normal, rV ), 0.0, 1.0 );
    // marco tangente con derivadas, para correr las capas según de dónde se mire
    vec3 rQ0 = dFdx( - vViewPosition );
    vec3 rQ1 = dFdy( - vViewPosition );
    vec2 rS0 = dFdx( vEmissiveMapUv );
    vec2 rS1 = dFdy( vEmissiveMapUv );
    vec3 rQ1p = cross( rQ1, normal );
    vec3 rQ0p = cross( normal, rQ0 );
    vec3 rT = rQ1p * rS0.x + rQ0p * rS1.x;
    vec3 rB = rQ1p * rS0.y + rQ0p * rS1.y;
    float rD = max( dot( rT, rT ), dot( rB, rB ) );
    float rI = rD > 0.0 ? inversesqrt( rD ) : 0.0;
    vec2 rP = vec2( dot( rV, rT * rI ), dot( rV, rB * rI ) );

    vec2 rUv = vEmissiveMapUv;
    vec2 rBase = rUv * vec2( 1.15, 1.55 ) + vRDesfase;
    vec4 rC1 = texture2D( emissiveMap, rBase + rP * 0.012 );
    vec4 rC2 = texture2D( emissiveMap, rBase * 1.41 + vec2( 0.31, 0.17 ) + rP * 0.05 );
    vec4 rC3 = texture2D( emissiveMap, rBase * 0.71 + vec2( 0.61, 0.43 ) + rP * 0.11 );
    float rNube = rC3.g * 0.62 + rC1.g * 0.38;

    #ifdef RESINA_PLUMA
        float rLado = abs( rUv.x - 0.5 ) * 2.0;
        float rForma = 0.34 + 0.46 * smoothstep( 0.1, 0.85, rUv.y );
        float rFilo = smoothstep( 0.66, 0.98, rLado );
    #else
        vec2 rDd = ( rUv - 0.5 ) * vec2( 1.85, 1.7 );
        float rForma = 1.0 - smoothstep( 0.12, 1.0, length( rDd ) );
        float rFilo = 0.0;
    #endif

    #ifdef RESINA_PLUMA
        float rGrieta = 0.42;
    #else
        float rGrieta = 1.0;
    #endif
    float rVista = mix( 0.26, 1.0, pow( rNV, 1.3 ) );
    float rFuego = clamp( rForma * 0.84 + ( rNube - 0.5 ) * 0.8 + ( rC1.b - 0.5 ) * 0.14, 0.0, 1.0 ) * rVista;
    vec3 rCol = mix( rHondo, rMedio, smoothstep( 0.1, 0.6, rFuego ) );
    rCol = mix( rCol, rCalor, smoothstep( 0.68, 1.0, rFuego ) );

    vec3 rEm = rCol * ( 0.1 + 0.62 * rFuego );
    rEm += rCalor * rC1.r * ( 0.22 + 0.62 * rFuego ) * rGrieta;
    rEm += rMedio * rC2.r * ( 0.06 + 0.26 * rFuego ) * rGrieta;
    rEm *= 1.0 - 0.6 * rC3.r;
    rEm += rCalor * rFilo * ( 0.35 + 0.45 * rUv.y );
    totalEmissiveRadiance = rEm * rLuz * ( 1.0 - 0.85 * rClaro );

    // lo que se ve a través se tiñe: oscuro donde no hay fuego y nunca blanco; «Ver por dentro» lo aclara
    vec3 rTinte = mix( rHondo * 2.2, mix( rCalor, vec3( 1.0 ), 0.45 ), smoothstep( 0.0, 0.9, rFuego ) );
    #ifndef USE_TRANSMISSION
        // película (celular): la luz cae sobre este color, así que lleva el tono de la resina, no el blanco
        rTinte = mix( rHondo * 1.5, rMedio, smoothstep( 0.0, 0.8, rFuego ) );
    #endif
    diffuseColor.rgb *= mix( rTinte, vec3( 1.0 ), rClaro );
}
#endif
`;

/** Los valores que comparten todas las piezas de resina. */
export function uniformesResina(V) {
    return {
        rHondo: { value: new THREE.Color(V.hondo) },
        rMedio: { value: new THREE.Color(V.medio) },
        rCalor: { value: new THREE.Color(V.calor) },
        rLuz: { value: 1 },
        rClaro: { value: 0 },
    };
}

export function aplicarResina(m, U, pluma = false) {
    if (pluma) m.defines = { ...m.defines, RESINA_PLUMA: 1 };
    m.customProgramCacheKey = () => (pluma ? 'resina-pluma' : 'resina');
    m.onBeforeCompile = s => {
        Object.assign(s.uniforms, U);
        s.vertexShader = s.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec2 vRDesfase;')
            .replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_INSTANCING
    vRDesfase = instanceMatrix[3].xy * 1.7;
#else
    vRDesfase = modelMatrix[3].xy * 0.9;
#endif`);
        s.fragmentShader = s.fragmentShader
            .replace('#include <common>', `#include <common>\n${PARS}`)
            .replace('#include <emissivemap_fragment>', CUERPO);
    };
    return m;
}

/**
 * Textura de la resina, sin costuras. R: grietas de un vidrio craquelado (se apagan por tramos); G: nubes; B: cada astilla con
 * su propio tono. Se calcula una sola vez al armar el búho.
 */
export function texResina(azar) {
    const N = 384;
    const c = document.createElement('canvas');
    c.width = c.height = N;
    const x = c.getContext('2d');
    const img = x.createImageData(N, N);
    const TAU = Math.PI * 2;
    const sitios = Array.from({ length: 34 }, (_, i) => [azar(i + 1.5), azar(i * 2.3 + 91.7), azar(i * 3.1 + 17.9)]);
    const sube = (a, b, v) => { const k = Math.min(1, Math.max(0, (v - a) / (b - a))); return k * k * (3 - 2 * k); };
    const celda = (i, j, per) => azar(((i + per) % per) * 57.1 + ((j + per) % per) * 131.7 + per * 7.3);
    const ruido = (u, v, per) => {
        const a = u * per;
        const b = v * per;
        const i = Math.floor(a);
        const j = Math.floor(b);
        const f = sube(0, 1, a - i);
        const g = sube(0, 1, b - j);
        const p = celda(i, j, per) + (celda(i + 1, j, per) - celda(i, j, per)) * f;
        const q = celda(i, j + 1, per) + (celda(i + 1, j + 1, per) - celda(i, j + 1, per)) * f;
        return p + (q - p) * g;
    };
    const nubes = (u, v, base) => ruido(u, v, base) * 0.55 + ruido(u, v, base * 2) * 0.3 + ruido(u, v, base * 4) * 0.15;
    for (let py = 0; py < N; py++) {
        for (let px = 0; px < N; px++) {
            const u = px / N;
            const v = py / N;
            // las líneas no son rectas: el plano se tuerce un poco antes de partirlo
            const wu = u + 0.034 * Math.sin(TAU * (v * 2 + 0.3)) + 0.018 * Math.sin(TAU * (u * 3 + v * 5));
            const wv = v + 0.034 * Math.sin(TAU * (u * 2 + 0.7)) + 0.018 * Math.sin(TAU * (v * 3 - u * 4));
            let d1 = 9;
            let d2 = 9;
            let tono = 0;
            for (const [sx, sy, st] of sitios) {
                let dx = Math.abs(wu - sx) % 1;
                let dy = Math.abs(wv - sy) % 1;
                if (dx > 0.5) dx = 1 - dx;
                if (dy > 0.5) dy = 1 - dy;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < d1) { d2 = d1; d1 = d; tono = st; } else if (d < d2) d2 = d;
            }
            const linea = 1 - sube(0, 0.011, d2 - d1);
            const halo = 1 - sube(0, 0.05, d2 - d1);
            const tramos = sube(0.46, 0.7, nubes(u, v, 3));
            const i = (py * N + px) * 4;
            img.data[i] = 255 * Math.min(1, (linea * 0.9 + halo * 0.2) * (0.08 + 0.92 * tramos));
            img.data[i + 1] = 255 * sube(0.22, 0.78, nubes(u + 0.37, v + 0.11, 2));
            img.data[i + 2] = 255 * tono;
            img.data[i + 3] = 255;
        }
    }
    x.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return t;
}
