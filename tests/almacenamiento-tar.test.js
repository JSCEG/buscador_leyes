import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO } from '../src/data/como-funciona.js';
import { BLOQUE, D_DUCTO, DEF, DIQUE, ESPUMA, H_ESCENA, LINEAS, NACIONAL, PARTES, PIPA, POLITICA, PRODUCTOS, STOCK, TANQUES, TERMINAL, areaDique, cabeEnDique, calcular, derrame, enDerrame, espumaDe, estadoPlanta, evapora, filaEn, interfaz, largoMezcla, litrosA20, mezclaEn, nuMezcla, nominalDe, operativaDe, pasoPlanta, pideDique, pipaVapor, pipasPorHora, pose, presionVapor, puntasSueltas, radioDe, reserva, revisar, rutaDe, trenEn, umbralRe, ventaDe, volumen, vaporCarga } from '../conceptos-3d/almacenamiento-tar/modelo.js';
import { FUENTES } from '../conceptos-3d/almacenamiento-tar/fuentes.js';

const lista = archivo => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    return Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
};
const articulo = (archivo, n) => lista(archivo).find(a => a.articulo_num === n && !a.transitorio_num).texto.replace(/\s+/g, ' ');

describe('Terminal de almacenamiento', () => {
    it('sus cifras salen del modelo y coinciden con lo publicado', () => {
        expect(revisar()).toEqual([]);
    });

    it('cada tubo toca un equipo en sus dos puntas', () => {
        expect(puntasSueltas()).toEqual([]);
        expect(LINEAS.length).toBeGreaterThan(0);
    });

    it('los tanques suman la capacidad de Añil, y cada producto tiene los suyos', () => {
        expect(TANQUES).toHaveLength(TERMINAL.tanques);
        expect(nominalDe('regular') + nominalDe('premium') + nominalDe('diesel')).toBe(TERMINAL.nominal);
        expect(operativaDe('regular') + operativaDe('premium') + operativaDe('diesel')).toBeCloseTo(TERMINAL.operativa, 6);
        for (const t of TANQUES) {
            expect((volumen(t) * 1000) / 158.987 / 1000).toBeCloseTo(t.mb, 0);
            expect(radioDe(t)).toBeGreaterThan(0);
        }
    });

    it('sin ducto, los tanques se vacían; con el ducto, se quedan parejos', () => {
        const R = reserva({ corte: true });
        expect(R.seAcaba.regular).toBeGreaterThan(3);
        expect(R.primero).toBe(R.seAcaba.regular);
        expect(R.totalEn(R.seAcaba.diesel + 0.1)).toBeCloseTo(0, 6);
        const N = reserva();
        expect(N.primero).toBeNull();
        expect(N.totalEn(10)).toBeCloseTo(N.totalEn(0), -1);
        // nunca más de lo que cabe
        const A = reserva({ entra: 80 });
        for (const v of A.total) expect(v).toBeLessThanOrEqual(TERMINAL.operativa + 1e-6);
        // si las llenaderas no alcanzan, sale menos
        expect(reserva({ pipas: 40 }).sale).toBeCloseTo(pipasPorHora(DEF.llenaderas), 6);
    });

    it('la fila crece solo si llegan más pipas de las que se atienden', () => {
        expect(filaEn(11, 6, 8)).toBe(0);
        expect(filaEn(24, 6, 10)).toBeCloseTo((24 - pipasPorHora(6)) * 10, 6);
        expect(pipasPorHora(4)).toBeLessThan(TERMINAL.salen);
        expect(pipasPorHora(6)).toBeGreaterThan(TERMINAL.salen);
    });

    it('la mezcla crece con la raíz del camino, y se aparta', () => {
        expect(largoMezcla({ km: 311 }) / largoMezcla({ km: 311 / 4 })).toBeCloseTo(2, 6);
        expect(interfaz({ v: 0.1 }).barriles).toBeGreaterThan(interfaz({ v: 1.5 }).barriles * 2);
        expect(interfaz({ a: 'regular', b: 'premium' }).barriles).toBeLessThan(interfaz().barriles);
        expect(interfaz().Re).toBeGreaterThan(umbralRe());
        expect(mezclaEn(-1e6, 1000)).toBeCloseTo(0, 6);
        expect(mezclaEn(1e6, 1000)).toBeCloseTo(1, 6);
        expect(rutaDe({ a: 'regular', b: 'regular', c: 0 })).toBe('regular');
        expect(rutaDe({ a: 'regular', b: 'diesel', c: 0.5 })).toBe('mezcla');
        expect(rutaDe({ a: 'regular', b: 'diesel', c: 0.999 })).toBe('diesel');
        expect(rutaDe({ a: 'regular', b: 'diesel', c: 0.001 })).toBe('regular');
        // el tren pasa por todos los productos
        const vistos = new Set();
        for (let s = 0; s < 30; s += 0.2) vistos.add(rutaDe(trenEn(s, () => 1)));
        expect([...vistos].sort()).toEqual(['diesel', 'mezcla', 'premium', 'regular']);
    });

    it('un techo flotante evita casi todo, y más calor evapora más', () => {
        const [F, E, M, Dz] = [evapora({ techo: 'fijo' }), evapora({ techo: 'externo' }), evapora({ techo: 'membrana' }), evapora({ techo: 'fijo', tanque: TANQUES[3], stock: STOCK.diesel })];
        expect(E.total / F.total).toBeLessThan(0.02);
        expect(M.total).toBeLessThan(E.total);
        expect(Dz.total).toBeLessThan(F.total / 100);
        expect(F.trabajo + F.respira).toBeCloseTo(F.total, 6);
        expect(E.sello + E.accesorios + E.pared).toBeCloseTo(E.total, 6);
        for (const techo of ['fijo', 'externo', 'membrana']) expect(evapora({ T: 35, techo }).total).toBeGreaterThan(evapora({ T: 15, techo }).total);
        expect(pipaVapor(25, false).sale).toBeGreaterThan(pipaVapor(25, true).sale * 10);
        expect(vaporCarga(25, 1.45)).toBeGreaterThan(vaporCarga(25, 0.6));
    });

    it('el derrame se detiene al igualarse, y un muro bajo no alcanza', () => {
        const R = derrame();
        expect(R.h.at(-1)).toBeCloseTo(R.hd.at(-1), 1);
        expect(R.seSale).toBe(0);
        expect(derrame({ muro: 0.5 }).seSale).toBeGreaterThan(0);
        expect(derrame({ agujero: 60 }).fin).toBeLessThan(R.fin);
        expect(R.total).toBeCloseTo(derrame({ agujero: 60 }).total, -1);
        expect(enDerrame(R, 1e6).acabo).toBe(true);
        expect(cabeEnDique(1.8)).toBeGreaterThanOrEqual(pideDique());
        expect(cabeEnDique(1)).toBeLessThan(pideDique());
        expect(areaDique(1)).toBeGreaterThan(areaDique(3));
        expect(pideDique(['t1'])).toBeCloseTo(volumen(TANQUES[0]) * 1.1, 6);
    });

    it('el tiempo no depende de los cuadros', () => {
        const m = { pipas: 30, llenaderas: 6, v: 1.5, rompe: true, vel: 0.5 };
        let lento = estadoPlanta();
        for (let i = 0; i < 16; i++) lento = pasoPlanta(lento, m, 0.25);
        let rapido = estadoPlanta();
        for (let i = 0; i < 80; i++) rapido = pasoPlanta(rapido, m, 0.05);
        expect(lento.s).toBeCloseTo(rapido.s, 6);
        expect(lento.fila).toBeCloseTo(rapido.fila, 6);
        // el primer paso solo arranca el derrame
        expect(Math.abs(lento.ev - rapido.ev)).toBeLessThan(0.15);
    });

    it('la pose responde a los mandos', () => {
        expect(pose({ modo: 'reserva', desarme: 1 }).desarme).toBe(1);
        const c = pose({ modo: 'reserva', corte: true, dia: 3 });
        expect(c.flujos.sube).toBe(0);
        expect(c.flujos.rOut).toBeGreaterThan(0);
        expect(pose({ modo: 'reserva' }).flujos.sube).toBeGreaterThan(0);
        const L = calcular({ modo: 'tandas', km: 100, v: 1 });
        expect(L.A.barriles).toBeCloseTo(interfaz({ km: 100, v: 1 }).barriles, 6);
        expect(calcular({ modo: 'vapores', T: 30, techo: 'membrana' }).E.total).toBeCloseTo(evapora({ T: 30, techo: 'membrana' }).total, 6);
        const sinVapor = pose({ modo: 'vapores', urv: false });
        expect(sinVapor.flujos.vaporA).toBe(0);
        expect(pose({ modo: 'vapores', urv: true }).flujos.vaporA).toBeGreaterThan(0);
        expect(H_ESCENA).toBeGreaterThan(0);
    });

    it('sus puntos clave caben en el bloque', () => {
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
        const paginas = ['almacenamiento-tar', 'almacenamiento-tar-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO['almacenamiento-tar'].fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https?:\/\//);
            expect(f.para).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        const acervos = CONCEPTO['almacenamiento-tar'].fuentes.map(f => f.acervo);
        for (const siglas of ['LSH', 'RLSH', 'LCNE']) expect(acervos).toContain(siglas);
        expect(acervos).not.toContain('BME');
        expect(acervos).not.toContain('LASEA');
    });

    it('su ficha de Aprende tiene una parte por punto clave, en el mismo orden que la figura', () => {
        const c = CONCEPTO['almacenamiento-tar'];
        expect(c.figura).toBe('almacenamiento-tar');
        expect(c.nivel).toBe(2);
        expect(c.antes).toEqual(['hidrocarburos-moleculas', 'gasoductos']);
        expect(c.partes).toHaveLength(PARTES.length);
        const fuente = readFileSync('conceptos-3d/almacenamiento-tar/main.js', 'utf8');
        const fichas = fuente.slice(fuente.indexOf('const FICHAS = ['), fuente.indexOf('const VISTAS ='));
        const enFigura = [...fichas.matchAll(/\{ parte: '([a-zA-Z0-9]+)', nombre: '([^']+)'/g)];
        expect(enFigura.map(f => f[1])).toEqual(PARTES.map(p => p.id));
        expect(enFigura.map(f => f[2])).toEqual(c.partes.map(p => p.nombre));
        expect(c.revisado).toBeNull();
    });

    it('la ficha cita artículos que sí dicen eso', () => {
        const c = CONCEPTO['almacenamiento-tar'];
        const LSH = 'LSH_chunks.json';
        const RLSH = 'RLSH_chunks.json';
        expect(articulo(LSH, 5)).toContain('I. Agencia: Agencia Nacional de Seguridad Industrial');
        expect(articulo(LSH, 5)).toContain('II. Almacenamiento: Depósito y resguardo de Hidrocarburos, Petrolíferos y Petroquímicos en depósitos e instalaciones confinados');
        expect(articulo(LSH, 5)).toContain('XXXVII. Petrolíferos: Productos que se obtienen de la refinación del Petróleo');
        expect(articulo(LSH, 76)).toContain('b) La Formulación, Transporte, Almacenamiento, Distribución, Comercialización, Expendio al Público y despacho para autoconsumo de Petrolíferos');
        expect(articulo(LSH, 104)).toContain('así como de Almacenamiento de Hidrocarburos, Petrolíferos y Petroquímicos, tienen la obligación de dar acceso abierto no indebidamente discriminatorio');
        expect(articulo(LSH, 104)).toContain('no es aplicable a las Empresas Públicas del Estado o sus empresas filiales');
        expect(articulo(LSH, 104)).toContain('boletines electrónicos');
        expect(articulo(LSH, 105)).toContain('Permisionarias de Transporte por ductos y Almacenamiento');
        expect(articulo(LSH, 105)).toContain('no pueden realizar la compra venta o Comercializar');
        expect(articulo(LSH, 115)).toContain('II. Determinar la política pública en materia energética aplicable a los niveles de Almacenamiento');
        expect(articulo(LSH, 116)).toContain('b) La Formulación, Transporte, Almacenamiento, Distribución, Comercialización y Expendio al Público');
        expect(articulo(LSH, 116)).toContain('sin perjuicio de las atribuciones que correspondan a la Agencia');
        expect(articulo(RLSH, 93)).toContain('IV. Para Petrolíferos diferentes al Gas Licuado de Petróleo: a) Formulación: hasta cinco años; b) Almacenamiento: hasta treinta años');
        expect(articulo(RLSH, 109)).toContain('III. Remitir los contratos celebrados que acrediten el inventario de los productos a comercializar, así como demás información que acredite el cumplimiento del Almacenamiento mínimo');
        expect(articulo(RLSH, 111)).toContain('El Almacenamiento comprende la actividad de recibir Hidrocarburos, Petrolíferos o Petroquímicos propiedad de terceras personas');
        expect(articulo(RLSH, 112)).toContain('Cada permiso de Almacenamiento debe ser otorgado para un Sistema específico, una capacidad y modalidad determinadas');
        expect(articulo('LCNE_chunks.json', 9)).toContain('III. Otorgar, modificar, terminar y supervisar los permisos de formulación, transporte, almacenamiento, distribución, comercialización y expendio al público de petrolíferos');
        // lo que no está en el acervo se avisa, y va en las fuentes con su liga
        for (const [siglas, titulo] of [['NOM-006-ASEA-2017', 'NOM-006-ASEA-2017'], ['Política de Almacenamiento Mínimo', 'Política Pública de Almacenamiento Mínimo']]) {
            const a = c.ley.ficha.articulos.find(x => x.siglas === siglas);
            expect(a.nota).toContain('No está en el acervo');
            expect(c.fuentes.some(f => f.titulo.includes(titulo) && f.url)).toBe(true);
        }
        const texto = JSON.stringify(c);
        expect(texto).not.toContain('LASEA');
        expect(texto).not.toContain('Arts. 5 fr. I, 76 fr. II, 80 y 81');
        expect(texto).not.toContain('Ver terminales de almacenamiento');
        expect(texto).not.toContain('1.5 días');
    });

    it('las cifras escritas a mano en la ficha son las del modelo', () => {
        const c = CONCEPTO['almacenamiento-tar'];
        const texto = JSON.stringify(c);
        // la terminal
        expect(TERMINAL.nominal).toBe(235);
        expect(TERMINAL.operativa).toBe(158);
        expect(TERMINAL.salen).toBe(11);
        expect(NACIONAL.pemex).toBe(77);
        expect(NACIONAL.privadas).toBe(14);
        expect(NACIONAL.nominal).toBe(16.6);
        expect(NACIONAL.operativa).toBe(11.97);
        expect(NACIONAL.autonomia).toBe(2.9);
        expect(POLITICA.gasolina).toBe(5);
        expect(POLITICA.turbosina).toBe(3);
        expect(POLITICA.emisionMg).toBe(80);
        // la reserva
        const v = ventaDe(TERMINAL.salen);
        expect(Math.round(v)).toBe(33);
        expect(Math.round(v * 10) / 10).toBe(33.2);
        expect(Math.round((TERMINAL.operativa / v) * 10) / 10).toBe(4.8);
        // las tandas
        const I = interfaz();
        expect(Math.round(I.barriles)).toBe(1158);
        expect(Math.round(I.largo / 10) * 10).toBe(1190);
        expect(Math.round(D_DUCTO * 100) / 100).toBe(0.44);
        expect(Math.round(I.Re / 10000) * 10000).toBe(460000);
        expect(Math.round(nuMezcla('regular', 'diesel') * 1e8) / 100).toBe(1.45);
        // los techos
        const [F, E, M, Dz] = [evapora({ techo: 'fijo' }), evapora({ techo: 'externo' }), evapora({ techo: 'membrana' }), evapora({ techo: 'fijo', tanque: TANQUES[3], stock: STOCK.diesel })];
        expect(Math.round(F.total)).toBe(1261);
        expect(Math.round(E.total)).toBe(12);
        expect(Math.round(M.total)).toBe(6);
        expect(Math.round(Dz.total * 10) / 10).toBe(2.8);
        expect(Math.round((1 - E.total / F.total) * 100)).toBe(99);
        expect(Math.round(presionVapor(25) / presionVapor(25, STOCK.diesel))).toBe(437);
        expect(Math.round(presionVapor(25) * 100) / 100).toBe(4.87);
        // la pipa
        expect(Math.round(pipaVapor(25).sin)).toBe(18);
        expect(STOCK.gasolina.M).toBe(68);
        expect(Math.round(((12.46 * presionVapor(25) * 68) / 536.67) * 10) / 10).toBe(7.7);
        expect(Math.round(litrosA20(PIPA.litros, 30))).toBe(19746);
        // el dique y la espuma
        expect(Math.round(areaDique(1.8) / 100) * 100).toBe(8500);
        expect(Math.round(cabeEnDique(1.8))).toBe(12088);
        expect(Math.round(pideDique())).toBe(11990);
        expect(DIQUE.area).toBe(8600);
        const Es = espumaDe(TANQUES[1]);
        expect(Math.round(Es.area)).toBe(707);
        expect(Math.round(Es.flujo / 100) * 100).toBe(2900);
        expect(ESPUMA.tasa).toBe(4.1);
        expect(ESPUMA.minutos).toBe(55);
        expect(PRODUCTOS.regular.rho).toBe(730);
        expect(texto).toContain('158 mil barriles ÷ 33.2 mil al día = 4.8 días');
        expect(c.errores.length).toBeGreaterThanOrEqual(5);
        expect(c.preguntas.map(p => p.correcta).every(n => n === 0)).toBe(false);
    });

    it('las notas de la ruta ya no dicen lo que no se sostiene', () => {
        const fuente = readFileSync('src/data/como-funciona.js', 'utf8');
        expect(fuente).not.toContain('calentado a unos 400 °C');
        expect(fuente).not.toContain('Aprovechando esa capacidad física');
        expect(fuente).toContain('(RLSH, art. 109, fracc. III)');
    });
});
