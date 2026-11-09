import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO } from '../src/data/como-funciona.js';
import { ACERO, AREA, BLOQUE, DEF, DUCTO, ESTACIONES, HUECO_ANODOS, LIMITES, LINEAS, P_ENTREGA, PARED, PARTES, PMOP, PROFUNDIDAD_NOM, VALVULAS_NOM, X_ROTURA, XV, apretado, caida2, calcular, capacidad, compresion, dia, empaque, estadoPlanta, fuga, horasQueAlcanza, masa, pasoPlanta, perfil, pose, presionesDe, puntasSueltas, revisar, terreno, velocidad, viaje, yDucto, Z_DUCTO } from '../conceptos-3d/gasoductos/modelo.js';
import { FUENTES } from '../conceptos-3d/gasoductos/fuentes.js';

const lista = archivo => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    return Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
};
const articulo = (archivo, n) => lista(archivo).find(a => a.articulo_num === n && !a.transitorio_num).texto.replace(/\s+/g, ' ');

describe('Gasoducto', () => {
    it('sus cifras salen del modelo y coinciden con lo publicado', () => {
        expect(revisar()).toEqual([]);
    });

    it('cada tubo toca un equipo en sus dos puntas', () => {
        expect(puntasSueltas()).toEqual([]);
        expect(LINEAS.length).toBeGreaterThan(0);
    });

    it('la caída de presión crece con el cuadrado del gas, y el gas va más rápido donde hay menos presión', () => {
        expect(caida2(1000, 150) / caida2(500, 150)).toBeCloseTo(4, 6);
        expect(caida2(1000, 300) / caida2(1000, 150)).toBeCloseTo(2, 6);
        const P = perfil(DUCTO.capacidad, 2);
        for (const t of P.tramos) expect(t.fin).toBeLessThan(PMOP);
        expect(P.pEn(149)).toBeLessThan(P.pEn(10));
        // al pasar la estación, regresa a la presión máxima
        expect(P.pEn(151)).toBeGreaterThan(P.pEn(149));
        expect(velocidad(DUCTO.capacidad, 60)).toBeGreaterThan(velocidad(DUCTO.capacidad, 80));
    });

    it('apagar estaciones baja lo que puede pasar, y no se puede pasar más de lo que el tubo deja', () => {
        const [c0, c1, c2] = [0, 1, 2].map(e => capacidad(e));
        expect(c0).toBeLessThan(c1);
        expect(c1).toBeLessThan(c2);
        // apagar cualquiera de las dos deja el mismo tramo largo o más
        expect(capacidad([true, false])).toBeLessThanOrEqual(c2);
        expect(capacidad([false, true])).toBeLessThanOrEqual(c2);
        expect(perfil(5000, 0).q).toBeLessThan(5000);
        const L = calcular({ modo: 'presion', q: LIMITES.q[1], est: 0 });
        expect(L.corta).toBe(true);
    });

    it('a más gas, la estación trabaja mucho más, y calienta más el gas', () => {
        const Q = [500, 1000, DUCTO.capacidad].map(q => compresion(q, perfil(q, 2).succion[0]));
        for (let i = 1; i < Q.length; i++) {
            expect(Q[i].MW).toBeGreaterThan(Q[i - 1].MW);
            expect(Q[i].sale).toBeGreaterThan(Q[i - 1].sale);
            expect(Q[i].pct).toBeGreaterThan(Q[i - 1].pct);
        }
        expect(Q[2].MW / Q[1].MW).toBeGreaterThan(3);
        expect(compresion(1000, PMOP).MW).toBeCloseTo(0, 6);
    });

    it('el tubo guarda más con más presión, y entrega menos presión si se corta el gas', () => {
        expect(empaque(500)).toBeGreaterThan(empaque(DUCTO.capacidad));
        const normal = dia();
        expect(normal.falta).toBeNull();
        const corte = dia({ corte: true });
        expect(corte.falta).toBeGreaterThan(DEF.horaCorte);
        expect(corte.kgEn(10)).toBeLessThan(normal.kgEn(10));
        expect(corte.llegaEn(corte.falta)).toBeLessThanOrEqual(P_ENTREGA);
        // la estación nunca empuja por arriba de la presión máxima
        for (const p of normal.pSale) expect(p).toBeLessThanOrEqual(PMOP + 1e-6);
        expect(presionesDe(1e12, 1000).sale).toBeLessThanOrEqual(PMOP);
        // tampoco se calcula por cuadro: da lo mismo llamarla varias veces
        expect(horasQueAlcanza(1000)).toBe(horasQueAlcanza(1000));
    });

    it('en una fuga se pierde más si las válvulas cierran tarde o están lejos', () => {
        const base = fuga().perdido.at(-1);
        expect(fuga({ tc: 3 }).perdido.at(-1)).toBeLessThan(base);
        expect(fuga({ tc: 30 }).perdido.at(-1)).toBeGreaterThan(base);
        for (let c = 1; c < VALVULAS_NOM.length; c++) {
            expect(fuga({ clase: c }).perdido.at(-1)).toBeLessThan(fuga({ clase: c - 1 }).perdido.at(-1));
        }
        const F = fuga();
        expect(F.P[0]).toBeCloseTo(F.P0, 1);
        expect(F.P.at(-1)).toBeLessThan(F.P0 / 2);
        for (let i = 1; i < F.perdido.length; i++) expect(F.perdido[i]).toBeGreaterThanOrEqual(F.perdido[i - 1]);
    });

    it('el ducto va enterrado, baja en el río, y la rotura queda entre sus dos válvulas', () => {
        expect(XV.v0).toBeLessThan(X_ROTURA);
        expect(X_ROTURA).toBeLessThan(XV.v1);
        for (const x of [-7, -3, 0, 2, 6]) expect(yDucto(x)).toBeLessThan(terreno(x, Z_DUCTO));
        expect(HUECO_ANODOS.x[0]).toBeGreaterThan(XV.v1);
        expect(ESTACIONES).toHaveLength(2);
        expect(PROFUNDIDAD_NOM.find(p => p[0].startsWith('Río'))[1]).toBe(180);
    });

    it('el tiempo no depende de los cuadros', () => {
        const m = { q: 1400, est: 1, rompe: false, diablo: false };
        let lento = estadoPlanta({});
        for (let i = 0; i < 16; i++) lento = pasoPlanta(lento, m, 0.25);
        let rapido = estadoPlanta({});
        for (let i = 0; i < 80; i++) rapido = pasoPlanta(rapido, m, 0.05);
        for (const k of Object.keys(lento)) {
            if (typeof lento[k] === 'number') expect(lento[k]).toBeCloseTo(rapido[k], 0);
        }
    });

    it('la pose responde al desarme, y sus puntos clave caben en el bloque', () => {
        expect(pose({ modo: 'presion', desarme: 1 }).desarme).toBe(1);
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
        const paginas = ['gasoductos', 'gasoductos-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO.gasoductos.fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https?:\/\//);
            expect(f.para).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        const acervos = CONCEPTO.gasoductos.fuentes.map(f => f.acervo);
        for (const siglas of ['LSH', 'RLSH', 'LCNE']) expect(acervos).toContain(siglas);
        expect(acervos).not.toContain('BME');
        expect(acervos).not.toContain('LASEA');
    });

    it('su ficha de Aprende tiene una parte por punto clave, en el mismo orden que la figura', () => {
        const c = CONCEPTO.gasoductos;
        expect(c.figura).toBe('gasoductos');
        expect(c.nivel).toBe(2);
        expect(c.antes).toEqual(['hidrocarburos-moleculas']);
        expect(c.partes).toHaveLength(PARTES.length);
        const fuente = readFileSync('conceptos-3d/gasoductos/main.js', 'utf8');
        const fichas = fuente.slice(fuente.indexOf('const FICHAS = ['), fuente.indexOf('const VISTAS ='));
        const enFigura = [...fichas.matchAll(/\{ parte: '([a-zA-Z0-9]+)', nombre: '([^']+)'/g)];
        expect(enFigura.map(f => f[1])).toEqual(PARTES.map(p => p.id));
        expect(enFigura.map(f => f[2])).toEqual(c.partes.map(p => p.nombre));
        expect(c.revisado).toBeNull();
    });

    it('la ficha cita artículos que sí dicen eso', () => {
        const c = CONCEPTO.gasoductos;
        const LSH = 'LSH_chunks.json';
        const RLSH = 'RLSH_chunks.json';
        expect(articulo(LSH, 5)).toContain('I. Agencia: Agencia Nacional de Seguridad Industrial');
        expect(articulo(LSH, 5)).toContain('XXIII. Gas Natural: Mezcla de gases');
        expect(articulo(LSH, 5)).toContain('constituida principalmente por metano');
        expect(articulo(LSH, 5)).toContain('XLVIII. Transporte: Actividad de recibir, entregar y, en su caso, conducir');
        expect(articulo(LSH, 76)).toContain('b) Importación y exportación de Gas Natural');
        expect(articulo(LSH, 76)).toContain('a) El procesamiento, licuefacción, regasificación, compresión, descompresión, Transporte, Almacenamiento, Distribución, Comercialización, y Expendio al Público de Gas Natural');
        expect(articulo(LSH, 99)).toContain('La integración de los sistemas de almacenamiento y transporte privados es de carácter voluntario');
        expect(articulo(LSH, 99)).toContain('Equipos de compresión');
        expect(articulo(LSH, 100)).toContain('es el gestor y administrador independiente del Sistema de Transporte y Almacenamiento Nacional Integrado de Gas Natural');
        expect(articulo(LSH, 103)).toContain('plan quinquenal de expansión');
        expect(articulo(LSH, 103)).toContain('como mínimo un diámetro de treinta pulgadas, una presión operativa igual o superior a 800 libras y una longitud de al menos 100 kilómetros');
        expect(articulo(LSH, 104)).toContain('tienen la obligación de dar acceso abierto no indebidamente discriminatorio');
        expect(articulo(LSH, 104)).toContain('sujeto a disponibilidad de capacidad');
        expect(articulo(LSH, 104)).toContain('no es aplicable a las Empresas Públicas del Estado o sus empresas filiales');
        expect(articulo(LSH, 104)).toContain('boletines electrónicos');
        expect(articulo(LSH, 104)).toContain('previo pago de la tarifa autorizada');
        expect(articulo(LSH, 105)).toContain('no pueden realizar la compra venta o Comercializar');
        expect(articulo(LSH, 105)).toContain('emergencia operativa');
        expect(articulo(LSH, 116)).toContain('a) El procesamiento, licuefacción, regasificación, compresión, descompresión, Transporte');
        expect(articulo(LSH, 116)).toContain('d) La gestión de los Sistemas Integrados, incluyendo el Sistema de Transporte y Almacenamiento Nacional Integrado de Gas Natural');
        expect(articulo(LSH, 116)).toContain('sin perjuicio de las atribuciones que correspondan a la Agencia');
        expect(articulo(RLSH, 92)).toContain('Acceso Abierto No Indebidamente Discriminatorio');
        expect(articulo(RLSH, 93)).toContain('II. Para Gas Natural:');
        expect(articulo(RLSH, 93)).toContain('f) Transporte por medio de Ductos: hasta treinta años');
        expect(articulo(RLSH, 126)).toContain('debe ser otorgado para un Sistema y Trayecto específicos en territorio nacional y una capacidad determinada');
        expect(articulo('LCNE_chunks.json', 9)).toContain('I. Regular las contraprestaciones, precios y tarifas');
        expect(articulo('LCNE_chunks.json', 9)).toContain('II. Otorgar, modificar, terminar y supervisar los permisos para el procesamiento, licuefacción, regasificación, compresión, descompresión, transporte, almacenamiento, distribución, comercialización y expendio al público de gas natural');
        // la norma no está en el acervo: se avisa, y va en las fuentes con su liga
        const nom = c.ley.ficha.articulos.find(a => a.siglas === 'NOM-020-ASEA-2024');
        expect(nom.nota).toContain('No está en el acervo');
        expect(c.fuentes.some(f => f.titulo.includes('NOM-020-ASEA-2024') && f.url)).toBe(true);
        // ya no cita lo que no decía eso, y la norma cancelada solo se menciona en las fuentes, como cancelada
        const { fuentes, ...sinFuentes } = c;
        const texto = JSON.stringify(sinFuentes);
        expect(texto).not.toContain('NOM-007-ASEA-2016');
        expect(fuentes.find(f => f.titulo.includes('NOM-020-ASEA-2024')).para).toContain('Cancela a la NOM-007-ASEA-2016');
        expect(texto).not.toContain('Arts. 2 y 7');
        expect(texto).not.toContain('SAEE');
        expect(texto).not.toContain('red de gasoductos en el mapa');
    });

    it('las cifras escritas a mano en la ficha son las del modelo', () => {
        const c = CONCEPTO.gasoductos;
        const texto = JSON.stringify(c);
        // el ducto
        expect(DUCTO.km).toBe(447);
        expect(DUCTO.pulgadas).toBe(42);
        expect(DUCTO.psi).toBe(1200);
        expect(Math.round(PMOP)).toBe(83);
        // la fricción, en los primeros 150 km
        const cae = q => PMOP - perfil(q, 2).succion[0];
        expect(cae(500)).toBeCloseTo(2.4, 1);
        expect(cae(1000)).toBeCloseTo(10.1, 1);
        expect(texto).toContain('con 500 millones de pies cúbicos al día baja 2.4 bar');
        expect(Math.round(PMOP * 10) / 10).toBe(82.7);
        expect(Math.round(perfil(1000, 2).succion[0] * 10) / 10).toBe(72.6);
        expect(Math.round(caida2(1000, 150) / 10) * 10).toBe(1570);
        expect(Math.round(caida2(500, 150) / 10) * 10).toBe(390);
        // lo que deja pasar
        expect(Math.round(capacidad(0))).toBe(832);
        expect(Math.round(capacidad(1))).toBe(1021);
        expect(Math.round(capacidad(2))).toBe(1436);
        expect(texto).toContain('sin estaciones el tubo deja pasar 832 millones');
        expect(texto).toContain('el 1,436 contra 1,430');
        expect(DUCTO.capacidad).toBe(1430);
        expect(DUCTO.capacidadCenagas).toBe(1363);
        // la estación
        const C0 = compresion(1000, perfil(1000, 2).succion[0]);
        const C1 = compresion(DUCTO.capacidad, perfil(DUCTO.capacidad, 2).succion[0]);
        expect(Math.round(C0.MW)).toBe(5);
        expect(Math.round(C1.MW)).toBe(17);
        expect(Math.round(C1.sale)).toBe(47);
        expect(Math.round(C1.pct * 100) / 100).toBe(0.31);
        expect(Math.round(C1.sube / 0.0689476)).toBe(326);
        expect(Math.round(C1.hp / DUCTO.capacidad)).toBe(16);
        expect(Math.round(masa(DUCTO.capacidad))).toBe(344);
        expect(Math.round((C1.MW * 1000) / masa(DUCTO.capacidad))).toBe(49);
        // el empaque
        expect(Math.round(apretado(PMOP))).toBe(92);
        expect(Math.round((AREA * DUCTO.km * 1000) / 1000)).toBe(381);
        expect(Math.round(dia().lleno / 10) * 10).toBe(1240);
        expect(dia({ corte: true }).horasCorte).toBeLessThan(3);
        expect(dia({ corte: true }).horasCorte).toBeGreaterThan(2);
        // el viaje
        expect(Math.round(viaje(DUCTO.capacidad))).toBe(18);
        expect((DUCTO.km * 1000) / viaje(DUCTO.capacidad) / 3600).toBeCloseTo(6.8, 1);
        // el acero
        expect(Math.round(PARED * 10000) / 10).toBe(12.7);
        expect(ACERO.S).toBe(483e6);
        expect(ACERO.F).toBe(0.72);
        // la fuga y las válvulas
        expect(Math.round(fuga({ clase: 0, tc: 10 }).perdido.at(-1))).toBe(121);
        expect(Math.round(fuga({ clase: 3, tc: 10 }).perdido.at(-1))).toBe(59);
        expect(VALVULAS_NOM[0].km).toBe(32);
        expect(VALVULAS_NOM[3].km).toBe(8);
        expect(c.errores.length).toBeGreaterThanOrEqual(5);
        expect(c.preguntas.map(p => p.correcta).every(n => n === 0)).toBe(false);
    });

    it('la nota de la ruta ya no cita artículos que no dicen eso', () => {
        const fuente = readFileSync('src/data/como-funciona.js', 'utf8');
        expect(fuente).not.toContain('arts. 76 fr. II y 102–106');
        expect(fuente).not.toContain('entre 50 y 100 bar');
        expect(fuente).toContain('(LSH, art. 104)');
    });
});
