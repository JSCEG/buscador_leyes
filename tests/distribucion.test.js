import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO } from '../src/data/como-funciona.js';
import { AEREAS, BLOQUE, BORNES, CALLE, CASAS, DIBUJADAS, CRITERIO, FICHA, FUSIBLE, GD, KVA_MEDIO, LINEAS, PARTES, PERDIDAS, RED, REMATE, SERVICIOS_MEDIO, TRAFO, calle, casaKW, dia, diaKWh, estadoPlanta, falla, funde, lineaFalla, pasoPlanta, perdidas, plenaCarga, pose, puntasSueltas, revisar, secuencia } from '../conceptos-3d/distribucion/modelo.js';
import { FUENTES } from '../conceptos-3d/distribucion/fuentes.js';
import { cablesSueltos, colgar } from '../conceptos-3d/planta-comun/lineas.js';

const lista = archivo => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    return Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
};
const articulo = (archivo, n) => lista(archivo).filter(a => a.articulo_num === n && !a.transitorio_num).map(a => a.texto).join(' ').replace(/\s+/g, ' ');
const LSE = 'Ley_Sector_Electrico_chunks.json';
const RLSE = 'RLSE_chunks.json';
const r1 = x => Math.round(x * 10) / 10;

describe('Red de distribución', () => {
    it('sus cifras salen del modelo y coinciden con lo publicado', () => {
        expect(revisar()).toEqual([]);
    });

    it('cada cable toca un poste, el transformador o una casa en sus dos puntas', () => {
        expect(puntasSueltas()).toEqual([]);
        expect(LINEAS.length).toBeGreaterThan(0);
    });

    it('cada cable llega a un borne: un alfiler, un bastidor, el cortacircuito, el transformador o la mufa de una casa', () => {
        expect(cablesSueltos(LINEAS, BORNES, REMATE)).toEqual([]);
        expect(cablesSueltos(DIBUJADAS, BORNES, REMATE)).toEqual([]);
        // las líneas que se dibujan cuelgan entre apoyos; la de media tensión es una sola fase y la de baja, neutro arriba y dos fases
        expect(Object.keys(AEREAS)).toEqual(['mtCalle', 'btCalle']);
        expect(AEREAS.mtCalle.every(a => a.fase.every(v => v === 0))).toBe(true);
        expect(AEREAS.btCalle[0].fase[1]).toBeCloseTo(0.09, 9);
        for (const apoyos of Object.values(AEREAS)) {
            const p = colgar(apoyos.slice(1, 3));
            expect(p[8][1]).toBeLessThan((p[0][1] + p[16][1]) / 2);
        }
        // y lo que corre por los cables va por el conductor que cuelga
        for (const L of LINEAS) expect(L.apoyos?.length).toBeGreaterThan(1);
    });

    it('la calle y la red son las de las fuentes', () => {
        expect(TRAFO).toMatchObject({ kVA: 37.5, primario: 7620, primarioLL: 13200, fase: 120, entre: 240 });
        expect(CALLE).toMatchObject({ casas: 30, consumo: 1852 });
        expect(CRITERIO).toMatchObject({ suministro: 0.05, caidaBT: 0.03 });
        expect(RED).toMatchObject({ transformadores: 1660977, kmMT: 555336, electronicos: 37.2 });
        expect(r1(KVA_MEDIO)).toBe(36.7);
        expect(Math.round(SERVICIOS_MEDIO)).toBe(30);
        expect(GD).toMatchObject({ MW: 4447, solar: 99.4 });
        expect(PERDIDAS).toMatchObject({ tecnicas: 4.55, noTecnicas: 8.64, oriente: 14.33, cre: 5 });
        // S&C: 37.5 kVA en 7,620 V son 4.92 A a plena carga
        expect(Math.round(plenaCarga() * 100) / 100).toBe(4.92);
    });

    it('un día en la calle: las cifras de la ficha', () => {
        // el año de una casa suma su consumo
        expect(Math.round(diaKWh(CALLE.consumo) * 365)).toBe(CALLE.consumo);
        expect(r1(casaKW(20))).toBe(0.4);
        expect(r1(diaKWh(CALLE.consumo))).toBe(5.1);
        const ocho = calle({ hora: 20 });
        expect(Math.round(ocho.S)).toBe(13);
        expect(Math.round(ocho.uso * 100)).toBe(35);
        expect(r1(ocho.fin * 100)).toBe(98.4);
        expect(r1((1 - ocho.fin) * 100)).toBe(1.6);
        const D = dia({});
        expect(D.horaPico).toBeGreaterThanOrEqual(18);
        expect(D.horaPico).toBeLessThanOrEqual(22);
        // con aire acondicionado (6,000 kWh al año, de ejemplo) se pasa
        expect(Math.round(dia({ consumo: 6000 }).maxUso * 100)).toBe(114);
        expect(dia({ casas: 60, consumo: 5000 }).maxUso).toBeGreaterThan(1);
    });

    it('los paneles: a mediodía la energía regresa y el voltaje sube', () => {
        const todos = calle({ hora: 13, paneles: 1 });
        expect(todos.P).toBeLessThan(0);
        expect(r1(todos.fin * 100)).toBe(105.6);
        expect(todos.fin).toBeGreaterThan(1 + CRITERIO.suministro);
        expect(calle({ hora: 13, paneles: 0.3 }).fin).toBeLessThan(1 + CRITERIO.suministro);
        // de noche no dan nada
        expect(calle({ hora: 23, paneles: 1 }).P).toBeCloseTo(calle({ hora: 23, paneles: 0 }).P, 9);
    });

    it('la rama: la corriente y el fusible', () => {
        expect(Math.round(falla({ d: 0 }).Ib)).toBe(6250);
        expect(Math.round(falla({ d: 60 }).Ib / 10) * 10).toBe(2090);
        expect(r1(funde(falla({ d: 60 }).Ip, FUSIBLE.A))).toBe(0.3);
        expect(funde(plenaCarga(), FUSIBLE.A)).toBe(Infinity);
        expect(secuencia({ d: 60 }).cae).toBe(true);
        // lejos y con un fusible muy grande, ya no se funde a tiempo
        expect(secuencia({ d: CALLE.largo, fusible: 20 }).cae).toBe(false);
        // la corriente roja llega hasta el primer poste después de la rama
        expect(lineaFalla(5)).toBe('f1');
        expect(lineaFalla(CALLE.largo)).toBe('f3');
        expect(LINEAS.some(l => l.id === 'f3')).toBe(true);
    });

    it('lo que se pierde: técnicas y diablitos', () => {
        const P0 = perdidas({ diablitos: 0 });
        expect(Math.round(P0.pctTecnicas * 100)).toBe(3);
        expect(P0.nucleo).toBeGreaterThan(P0.cobre);
        expect(P0.robada).toBe(0);
        expect(perdidas({ diablitos: 0.4 }).pctNoTecnicas).toBeGreaterThan(perdidas({ diablitos: 0.1 }).pctNoTecnicas);
    });

    it('el tiempo de la falla no depende de los cuadros', () => {
        const corre = (dt, n) => { let s = pasoPlanta(estadoPlanta(), { falla: true }, 0); for (let i = 0; i < n; i++) s = pasoPlanta(s, { falla: true }, dt); return s; };
        const a = corre(0.25, 40);
        const b = corre(0.05, 200);
        expect(Math.abs(a.falla - b.falla)).toBeLessThan(0.3);
        expect(pasoPlanta(a, { falla: false }, 0.1).falla).toBeNull();
    });

    it('la pose responde a los mandos', () => {
        expect(pose({ desarme: 1 }).desarme).toBe(1);
        // la rama cerca: el fusible cae y la calle se queda sin luz
        const caida = pose({ modo: 'falla', d: 5, planta: { ...estadoPlanta(), falla: 5 } });
        expect(caida.abierto).toBe(true);
        expect(caida.luz).toBe(0);
        expect(caida.flujos.mt).toBe(0);
        // mientras dura la falla, corre la línea roja hasta la rama
        const falla0 = pose({ modo: 'falla', d: CALLE.largo, fusible: 20, planta: { ...estadoPlanta(), falla: 1 } });
        expect(falla0.enFalla).toBe(true);
        expect(falla0.flujos[lineaFalla(CALLE.largo)]).toBe(1);
        // paneles en todas a la 1: la energía regresa
        const sol = pose({ modo: 'voltaje', hora: 13, paneles: 1 });
        expect(sol.flujos.r1).toBeGreaterThan(0);
        expect(sol.flujos.b1).toBe(0);
        expect(pose({ modo: 'perdidas', diablitos: 0.4 }).diablitos.size).toBe(12);
    });

    it('sus puntos clave caben en el bloque y caen en casas del fondo', () => {
        expect(PARTES).toHaveLength(14);
        for (const p of PARTES) {
            expect(p.vista).toBeTruthy();
            expect(p.ancla[0]).toBeGreaterThanOrEqual(BLOQUE.x[0]);
            expect(p.ancla[0]).toBeLessThanOrEqual(BLOQUE.x[1]);
            expect(p.ancla[2]).toBeGreaterThanOrEqual(BLOQUE.z[0]);
            expect(p.ancla[2]).toBeLessThanOrEqual(BLOQUE.z[1]);
        }
        // las casas de las fichas miran a la cámara general
        for (const i of Object.values(FICHA)) expect(CASAS[i].lado).toBe(-1);
    });

    it('sus fuentes están a la vista en la figura y citadas en la ficha', () => {
        expect(FUENTES.length).toBeGreaterThan(0);
        const paginas = ['distribucion', 'distribucion-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO.distribucion.fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https?:\/\//);
            expect(f.para).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        const acervos = CONCEPTO.distribucion.fuentes.map(f => f.acervo);
        for (const siglas of ['LSE', 'RLSE']) expect(acervos).toContain(siglas);
        expect(acervos).not.toContain('BME');
    });

    it('su ficha de Aprende tiene una parte por punto clave, en el mismo orden que la figura', () => {
        const c = CONCEPTO.distribucion;
        expect(c.figura).toBe('distribucion');
        expect(c.nivel).toBe(2);
        expect(c.antes).toEqual(['subestacion']);
        expect(c.partes).toHaveLength(PARTES.length);
        const fuente = readFileSync('conceptos-3d/distribucion/main.js', 'utf8');
        const fichas = fuente.slice(fuente.indexOf('const FICHAS = ['), fuente.indexOf('const VISTAS ='));
        const enFigura = [...fichas.matchAll(/\{ parte: '([a-zA-Z0-9]+)', nombre: '([^']+)'/g)];
        expect(enFigura.map(f => f[1])).toEqual(PARTES.map(p => p.id));
        expect(enFigura.map(f => f[2])).toEqual(c.partes.map(p => p.nombre));
        expect(c.revisado).toBeNull();
    });

    it('la ficha cita artículos que sí dicen eso', () => {
        const c = CONCEPTO.distribucion;
        const a3 = articulo(LSE, 3);
        expect(a3).toContain('XIX. Distribuidora: Empresa Pública del Estado que presta el Servicio Público de Distribución de Energía Eléctrica');
        expect(a3).toContain('XX. Empresa Pública del Estado: Comisión Federal de Electricidad');
        expect(a3).toContain('XXII. Generación Distribuida: Generación de energía eléctrica que cumple con las siguientes características');
        expect(a3).toContain('interconectada a un circuito de distribución que contenga una alta concentración de Centros de Carga');
        expect(a3).toContain('XLII. Redes Generales de Distribución: Redes Eléctricas que se utilizan para distribuir energía eléctrica al público en general');
        expect(articulo(LSE, 25)).toContain('Centrales Eléctricas con capacidad menor a 0.7 MW');
        expect(articulo(LSE, 26)).toContain('cuenta con acceso a las Redes Generales de Distribución cuando es técnicamente factible');
        expect(articulo(LSE, 27)).toContain('puede vender energía eléctrica y Productos Asociados a través de la Suministradora de Servicios Básicos');
        expect(articulo(LSE, 44)).toContain('La Transportista y la Distribuidora son responsables de la Red Nacional de Transmisión y las Redes Generales de Distribución');
        expect(articulo(LSE, 44)).toContain('operan sus redes conforme a las instrucciones del CENACE');
        expect(articulo(LSE, 46)).toContain('se establecen en las condiciones generales para la prestación del Servicio Público de Transmisión y Distribución de Energía Eléctrica y las demás disposiciones que al efecto emite la CNE');
        expect(articulo(LSE, 56)).toContain('sólo pueden suspender el servicio a las Usuarias Finales en los casos siguientes');
        expect(articulo(LSE, 56)).toContain('VI. Por realizar actividades o incurrir en omisiones');
        expect(articulo(LSE, 56)).toContain('que posibiliten el consumo de energía eléctrica sin su registro en el sistema de medición');
        expect(articulo(LSE, 57)).toContain('es un área estratégica exclusiva del Estado');
        expect(articulo(LSE, 57)).toContain('es de utilidad pública');
        expect(articulo(LSE, 57)).toContain('Están sujetos a servidumbre legal los predios necesarios para la instalación de la Red Nacional de Transmisión y las Redes Generales de Distribución');
        expect(articulo(RLSE, 2)).toContain('V. Baja Tensión: Los niveles de tensión de la Red Eléctrica iguales o menores a un kilovolt');
        expect(articulo(RLSE, 93)).toContain('se debe sujetar a las disposiciones administrativas de carácter general que emita la CNE');
        expect(articulo(RLSE, 149)).toContain('que excedan las tolerancias permisibles en el nivel de tensión');
        expect(articulo(RLSE, 149)).toContain('o la Suministradora está obligada a reparar dichas instalaciones, equipos o aparatos, o a indemnizarla por el importe del daño ocasionado');
        expect(c.ley.siglas).toEqual(['LSE', 'RLSE']);
        // las RGD, la CFE y el CENACE se escriben completos la primera vez
        expect(c.ley.texto).toContain('Redes Generales de Distribución (RGD)');
        expect(c.ley.texto).toContain('Comisión Federal de Electricidad (CFE)');
        expect(c.ley.texto).toContain('Centro Nacional de Control de Energía (CENACE)');
        const texto = JSON.stringify(c);
        expect(texto).not.toMatch(/(?<![-\w])SAE(?![\w-])/);
        // la figura anterior hablaba de 13.8 kV y 220/127 V; esta calle es de una fase, a 120/240 V
        expect(texto).not.toContain('220/127');
        expect(texto).not.toContain('Alimentador de 13.8 kV');
        expect(texto).not.toContain('Suministro Básico');
    });
});
