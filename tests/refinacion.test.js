import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO } from '../src/data/como-funciona.js';
import { BLOQUE, CALIDAD, CRUDOS, DEF, EQUIPOS, HORNO_MAX, LINEAS, NIVELES, ORDEN_CRUDOS, PARTES, REFINERIA, REND, azufreDeCortes, azufreDiesel, balance, calcular, destilado, destinoAzufre, estadoPlanta, gravedad, hidrogeno, octano, pasoPlanta, pose, puntasSueltas, rendimientoReformado, revisar, severidadPara, torre } from '../conceptos-3d/refinacion/modelo.js';
import { FUENTES } from '../conceptos-3d/refinacion/fuentes.js';

const lista = archivo => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    return Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
};
const articulo = (archivo, n) => lista(archivo).find(a => a.articulo_num === n && !a.transitorio_num).texto.replace(/\s+/g, ' ');

describe('Refinería de petróleo', () => {
    it('sus cifras salen del modelo y coinciden con lo publicado', () => {
        expect(revisar()).toEqual([]);
    });

    it('cada tubo toca un equipo en sus dos puntas, y el proceso de la coquizadora está completo', () => {
        expect(puntasSueltas()).toEqual([]);
        const dentro = (p, c) => p[0] >= c[0] - 0.06 && p[0] <= c[1] + 0.06 && p[1] >= c[2] - 0.06 && p[1] <= c[3] + 0.06 && p[2] >= c[4] - 0.06 && p[2] <= c[5] + 0.06;
        const linea = id => LINEAS.find(l => l.id === id);
        expect(dentro(linea('aCoqHorno').puntos[0], EQUIPOS.columnaC)).toBe(true);
        expect(dentro(linea('aCoqHorno').puntos.at(-1), EQUIPOS.hornoC)).toBe(true);
        for (const [l, t] of [['aTambor0', 'tambor0'], ['aTambor1', 'tambor1']]) {
            expect(dentro(linea(l).puntos[0], EQUIPOS.hornoC)).toBe(true);
            expect(dentro(linea(l).puntos.at(-1), EQUIPOS[t])).toBe(true);
        }
    });

    it('los cortes de cada crudo suman lo publicado para el crudo entero', () => {
        for (const c of ORDEN_CRUDOS) {
            const A = azufreDeCortes(c);
            expect(A.azufre).toBeGreaterThan(CRUDOS[c].s * 0.88);
            expect(A.azufre).toBeLessThan(CRUDOS[c].s * 1.12);
            expect(Math.abs(A.api - CRUDOS[c].api)).toBeLessThan(3);
            expect(destilado(c, 800)).toBeCloseTo(100, 1);
        }
        expect(gravedad(10)).toBeCloseTo(1, 3);
        expect(gravedad(21.5)).toBeCloseTo(0.925, 3);
        expect(destilado('maya', 344)).toBeCloseTo(38.8, 0);
        expect(destilado('olmeca', 344)).toBeCloseTo(64.8, 0);
    });

    it('en la torre, lo que sube y lo que se queda suman 100, y un crudo ligero deja menos abajo', () => {
        for (const c of ORDEN_CRUDOS) {
            for (const T of [280, 330, 370, 400]) {
                const To = torre(c, T);
                expect(To.cortes.gas + To.cortes.nafta + To.cortes.keroseno + To.cortes.ligero + To.fondo).toBeCloseTo(100, 6);
                expect(To.vapor + To.fondo).toBeCloseTo(100, 6);
            }
            expect(torre(c, 280).fondo).toBeGreaterThan(torre(c, 370).fondo);
        }
        expect(torre('maya', 370).fondo).toBeCloseTo(61.2, 0);
        expect(torre('olmeca', 370).fondo).toBeCloseTo(35, 0);
        expect(torre('maya', HORNO_MAX).seRompe).toBe(true);
        expect(torre('maya', DEF.horno).seRompe).toBe(false);
    });

    it('cada planta nueva da más gasolina con Maya, y baja el combustóleo; la torre de vacío sola no cambia lo que sale', () => {
        const P = [0, 1, 2, 3].map(plantas => balance({ plantas }));
        expect(P[1].productos.gasolina).toBeCloseTo(P[0].productos.gasolina, 6);
        expect(P[2].productos.gasolina).toBeGreaterThan(P[1].productos.gasolina);
        expect(P[3].productos.gasolina).toBeGreaterThan(P[2].productos.gasolina);
        expect(P[3].productos.combustoleo).toBeLessThan(P[2].productos.combustoleo);
        expect(P[2].productos.combustoleo).toBeLessThan(P[1].productos.combustoleo);
        expect(P[0].coqueT).toBe(0);
        expect(P[3].coqueT).toBeGreaterThan(0);
        // la carga escala lo que sale
        expect(balance({ carga: 170 }).productos.gasolina).toBeCloseTo(P[3].productos.gasolina / 2, 6);
        expect(NIVELES).toHaveLength(4);
    });

    it('un crudo ligero rinde más solo destilando, y las plantas casi borran la diferencia', () => {
        const [m0, o0] = ['maya', 'olmeca'].map(crudo => balance({ crudo, plantas: 0 }).ligeros);
        const [m3, o3] = ['maya', 'olmeca'].map(crudo => balance({ crudo, plantas: 3 }).ligeros);
        expect(o0 - m0).toBeGreaterThan(0.2);
        expect(o3 - m3).toBeLessThan(0.1);
    });

    it('quitar azufre cuesta hidrógeno, y el diésel de Maya solo cumple con severidad alta', () => {
        const S = [0, 50, 90, 96, 100].map(severidad => azufreDiesel({ severidad }));
        for (let i = 1; i < S.length; i++) expect(S[i].sale).toBeLessThan(S[i - 1].sale);
        expect(azufreDiesel({ severidad: 90 }).cumple).toBe(false);
        expect(azufreDiesel({ severidad: DEF.severidad }).cumple).toBe(true);
        expect(severidadPara({ crudo: 'maya' })).toBeCloseTo(92, 0);
        expect(severidadPara({ crudo: 'olmeca' })).toBeLessThan(severidadPara({ crudo: 'maya' }));
        expect(azufreDiesel({ severidad: severidadPara({ crudo: 'maya' }) }).sale).toBeCloseTo(CALIDAD.sDiesel, 0);
        expect(hidrogeno({ severidad: 100 }).usa).toBeGreaterThan(hidrogeno({ severidad: 20 }).usa);
        const H = hidrogeno();
        expect(H.da + H.planta).toBeCloseTo(H.usa, 6);
        // lo que da la reformadora depende del octano, y lo que falta lo hace su planta
        expect(hidrogeno({ ron: 104 }).da).toBeGreaterThan(hidrogeno({ ron: 85 }).da);
    });

    it('todo el azufre que entra sale por algún lado', () => {
        for (const crudo of ORDEN_CRUDOS) {
            for (const plantas of [0, 2, 3]) {
                const S = destinoAzufre({ crudo, plantas });
                expect(S.solido + S.chimenea + S.enCoque + S.combustoleo + S.enProductos).toBeCloseTo(S.entra, 0);
            }
        }
        expect(Math.round(destinoAzufre().entra / 100) * 100).toBe(1700);
    });

    it('a más octano en la reformadora, sube el índice y da más hidrógeno, pero sale menos gasolina', () => {
        const O = [85, 95, 98, 104].map(ron => octano({ ron }));
        for (let i = 1; i < O.length; i++) {
            expect(O[i].indice).toBeGreaterThan(O[i - 1].indice);
            expect(O[i].gasolina).toBeLessThan(O[i - 1].gasolina);
            expect(O[i].h2).toBeGreaterThan(O[i - 1].h2);
        }
        expect(rendimientoReformado(104)).toBeLessThan(rendimientoReformado(85));
        expect(octano({ ron: DEF.ron }).indice).toBeGreaterThanOrEqual(CALIDAD.regular);
        expect(octano({ ron: 85 }).indice).toBeLessThan(CALIDAD.regular);
        expect(O[0].filas.reduce((s, f) => s + f.v, 0)).toBeCloseTo(O[0].total, 6);
    });

    it('los tambores se turnan: el horno solo le manda residuo al que se está llenando', () => {
        for (const ciclo of [0.1, 0.3, 0.6, 0.9]) {
            const P = pose({ modo: 'conversion', planta: { ...estadoPlanta({}), ciclo } });
            const [a, b] = [P.flujos.aTambor0, P.flujos.aTambor1];
            expect(a > 0 && b > 0).toBe(false);
            expect(a > 0 || b > 0).toBe(true);
        }
    });

    it('apagar plantas apaga sus tubos, y los mandos llegan al tablero', () => {
        const todas = pose({ modo: 'conversion', plantas: 3 });
        const sola = pose({ modo: 'conversion', plantas: 0 });
        expect(todas.flujos.fccSale).toBeGreaterThan(0);
        expect(sola.flujos.fccSale).toBe(0);
        expect(sola.flujos.fondoV).toBe(0);
        expect(sola.flujos.coqGas).toBe(0);
        expect(sola.flujos.aTorre).toBeGreaterThan(0);
        const L = calcular({ modo: 'torre', horno: 300, crudo: 'istmo' });
        expect(L.To.fondo).toBeCloseTo(torre('istmo', 300).fondo, 6);
        expect(calcular({ modo: 'conversion', plantas: 1 }).nivel).toBe(1);
        expect(calcular({ modo: 'octano', ron: 90 }).O.indice).toBeCloseTo(octano({ ron: 90 }).indice, 6);
    });

    it('el tiempo no depende de los cuadros', () => {
        const m = { plantas: 1, horno: 300, severidad: 40, ron: 90 };
        let lento = estadoPlanta({});
        for (let i = 0; i < 16; i++) lento = pasoPlanta(lento, m, 0.25);
        let rapido = estadoPlanta({});
        for (let i = 0; i < 80; i++) rapido = pasoPlanta(rapido, m, 0.05);
        expect(lento.horno).toBeCloseTo(rapido.horno, 1);
        expect(lento.fcc).toBeCloseTo(rapido.fcc, 1);
        expect(lento.ciclo).toBeCloseTo(rapido.ciclo, 6);
    });

    it('la pose responde al desarme, y sus puntos clave caben en el bloque', () => {
        expect(pose({ modo: 'torre', desarme: 1 }).desarme).toBe(1);
        expect(PARTES).toHaveLength(14);
        for (const p of PARTES) {
            expect(p.vista).toBeTruthy();
            expect(p.ancla[0]).toBeGreaterThanOrEqual(BLOQUE.x[0]);
            expect(p.ancla[0]).toBeLessThanOrEqual(BLOQUE.x[1]);
            expect(p.ancla[2]).toBeGreaterThanOrEqual(BLOQUE.z[0]);
            expect(p.ancla[2]).toBeLessThanOrEqual(BLOQUE.z[1]);
        }
    });

    it('sus fuentes están a la vista en la figura y citadas en la ficha', () => {
        expect(FUENTES.length).toBeGreaterThan(0);
        const paginas = ['refinacion', 'refinacion-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO.refinacion.fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https?:\/\//);
            expect(f.para).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        const acervos = CONCEPTO.refinacion.fuentes.map(f => f.acervo);
        for (const siglas of ['LSH', 'RLSH', 'LCNE']) expect(acervos).toContain(siglas);
        expect(acervos).not.toContain('BME');
        expect(acervos).not.toContain('LASEA');
    });

    it('su ficha de Aprende tiene una parte por punto clave, en el mismo orden que la figura', () => {
        const c = CONCEPTO.refinacion;
        expect(c.figura).toBe('refinacion');
        expect(c.nivel).toBe(3);
        expect(c.antes).toEqual(['hidrocarburos-moleculas']);
        expect(c.partes).toHaveLength(PARTES.length);
        const fuente = readFileSync('conceptos-3d/refinacion/main.js', 'utf8');
        const fichas = fuente.slice(fuente.indexOf('const FICHAS = ['), fuente.indexOf('const VISTAS ='));
        const enFigura = [...fichas.matchAll(/\{ parte: '([a-zA-Z0-9]+)', nombre: '([^']+)'/g)];
        expect(enFigura.map(f => f[1])).toEqual(PARTES.map(p => p.id));
        expect(enFigura.map(f => f[2])).toEqual(c.partes.map(p => p.nombre));
        expect(c.revisado).toBeNull();
    });

    it('la ficha cita artículos que sí dicen eso, y sus cifras son las del modelo', () => {
        const c = CONCEPTO.refinacion;
        const LSH = 'LSH_chunks.json';
        const RLSH = 'RLSH_chunks.json';
        expect(articulo(LSH, 5)).toContain('XXXVII. Petrolíferos: Productos que se obtienen de la refinación del Petróleo');
        expect(articulo(LSH, 5)).toContain('XLIX. Tratamiento: Acondicionamiento del Petróleo');
        expect(articulo(LSH, 5)).toContain('I. Agencia: Agencia Nacional de Seguridad Industrial');
        expect(articulo(LSH, 76)).toContain('a) Tratamiento, refinación, importación, exportación, Transporte, Almacenamiento y Comercialización de Petróleo');
        expect(articulo(LSH, 76)).toContain('b) La Formulación, Transporte, Almacenamiento, Distribución, Comercialización, Expendio al Público');
        expect(articulo(LSH, 112)).toContain('verificación y vigilancia se llevará a cabo por la Comisión Nacional de Energía');
        expect(articulo(LSH, 115)).toContain('sin perjuicio de las atribuciones que correspondan a la Agencia');
        expect(articulo(LSH, 116)).toContain('La Formulación, Transporte, Almacenamiento, Distribución, Comercialización y Expendio al Público');
        expect(articulo(RLSH, 3)).toContain('XL. Refinación de Petróleo: Conjunto de procesos físicos y químicos');
        expect(articulo(RLSH, 93)).toContain('b) Refinación: hasta treinta años');
        expect(articulo(RLSH, 102)).toContain('deben otorgarse para un Sistema y una capacidad determinados');
        expect(articulo(RLSH, 103)).toContain('son responsables de la medición y calidad de los productos finales');
        expect(articulo('LCNE_chunks.json', 9)).toContain('III. Otorgar, modificar, terminar y supervisar los permisos de formulación, transporte, almacenamiento, distribución, comercialización y expendio al público de petrolíferos');
        // la norma de calidad no está en el acervo: se avisa, y va en las fuentes con su liga
        const nom = c.ley.ficha.articulos.find(a => a.siglas === 'NOM-016-CRE-2016');
        expect(nom.nota).toContain('No está en el acervo');
        expect(c.fuentes.some(f => f.titulo.includes('NOM-016-CRE-2016') && f.url)).toBe(true);
        // ya no dice que la SENER permite procesar gas: eso le toca a la CNE
        const texto = JSON.stringify(c);
        expect(texto).not.toContain('procesamiento de gas');
        expect(texto).not.toMatch(/(?<![-\w])SAE(?![\w-])/);
        // las cifras escritas a mano en la ficha
        const P0 = balance({ plantas: 0 }).productos;
        const P3 = balance().productos;
        expect(Math.round(P0.gasolina)).toBe(41);
        expect(Math.round(P3.gasolina)).toBe(147);
        expect(Math.round(P0.combustoleo)).toBe(208);
        expect(Math.round(P3.combustoleo)).toBe(7);
        expect(Math.round(P3.diesel)).toBe(126);
        expect(texto).toContain('147 mil barriles de gasolina contra 173 mil');
        expect(texto).toContain('126 mil de diésel contra 125 mil');
        expect(REFINERIA.gasolina).toBe(173);
        expect(REFINERIA.diesel).toBe(125);
        expect(((REFINERIA.gasolina + REFINERIA.diesel) / REFINERIA.carga) * 100).toBeCloseTo(88, 0);
        expect(Math.round((REFINERIA.procesado2025 / REFINERIA.carga) * 100)).toBe(77);
        expect(Math.round(torre('maya', 370).fondo)).toBe(61);
        expect(Math.round(torre('olmeca', 370).fondo)).toBe(35);
        expect(CRUDOS.maya.ron).toBe(50.7);
        expect(CALIDAD.regular).toBe(87);
        expect(CALIDAD.premium).toBe(91);
        expect(CALIDAD.sDiesel).toBe(15);
        expect(REND.coker.coqueMasa).toBeLessThanOrEqual(0.3);
        const reformado = octano().filas.find(f => f.id === 'reformado');
        expect((reformado.ron + reformado.mon) / 2).toBe(93);
        expect((340e3 * 159 * 0.925 * 0.034) / 1000).toBeCloseTo(1700, -1);
        expect(c.errores.length).toBeGreaterThanOrEqual(5);
    });
});
