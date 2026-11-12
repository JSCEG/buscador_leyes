import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { CONCEPTO } from '../src/data/como-funciona.js';
import { AISLADOR, ALFA, BLOQUE, BLUEJAY, BORNES, CADENA_REMATE, CATALOGO, CLARO, DIBUJADAS, EVENTO2020, H_REF, LINEA, LINEAS, PARTES, PIE, RAYO, RECIERRE, REMATE, SIL, TENSE, TERMICO, TORRE, ZC, amperes, apoyos, claro, corrienteA, corrienteCritica, enTramo, enlace, estadoPlanta, flechaA, holgura, lejos, limites, pasoPlanta, perfil, pose, puntasSueltas, resistencia, revisar, secuenciaIncendio, secuenciaRayo, temperaturaCon, tensionA, vacio, voltajeAislador } from '../conceptos-3d/red-transmision/modelo.js';
import { FUENTES } from '../conceptos-3d/red-transmision/fuentes.js';
import { cablesSueltos } from '../conceptos-3d/planta-comun/lineas.js';

const lista = archivo => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    return Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
};
const articulo = (archivo, n) => lista(archivo).filter(a => a.articulo_num === n && !a.transitorio_num).map(a => a.texto).join(' ').replace(/\s+/g, ' ');
const LSE = 'Ley_Sector_Electrico_chunks.json';
const RLSE = 'RLSE_chunks.json';

describe('Red Nacional de Transmisión', () => {
    it('sus cifras salen del modelo y coinciden con lo publicado', () => {
        expect(revisar()).toEqual([]);
    });

    it('cada cable toca un equipo o una torre en sus dos puntas', () => {
        expect(puntasSueltas()).toEqual([]);
        expect(LINEAS.length).toBeGreaterThan(0);
        // cada cable llega a un borne: la punta de una cadena, un yugo, una boquilla, una barra o el reactor
        expect(cablesSueltos(LINEAS, BORNES, REMATE)).toEqual([]);
        expect(cablesSueltos(DIBUJADAS, BORNES, REMATE)).toEqual([]);
        // en los marcos y en las torres de remate el cable remata en la punta de su cadena acostada, no en el acero
        const A = apoyos(1.05);
        for (const a of [A[0], A[1], A.at(-2), A.at(-1)]) expect(a.ancho).toBe(CADENA_REMATE);
        expect(claro(A[0], A[1], flechaA(25))[0][0]).toBeCloseTo(A[0].x + CADENA_REMATE, 9);
        expect(claro(A[0], A[1], flechaA(25)).at(-1)[0]).toBeCloseTo(A[1].x - CADENA_REMATE, 9);
        // y en la escena nunca toca el suelo, ni con el cable muy caliente
        expect(holgura(flechaA(120))).toBeGreaterThan(0.1);
    });

    it('la línea y el cable son los de las fuentes', () => {
        expect(LINEA).toMatchObject({ kV: 400, km: 225, torres: 659 });
        expect(Math.round(CLARO)).toBe(342);
        expect(TORRE).toMatchObject({ altura: 26.2, alturaGuarda: 34.88, haz: 2, separacion: 0.45 });
        expect(BLUEJAY).toMatchObject({ kcmil: 1113, D: 0.032, masa: 1.872, Rcd20: 0.0505, Rca75: 0.0649, ampacidad: 1081 });
        expect(resistencia(20)).toBeCloseTo(BLUEJAY.Rcd20, 9);
        expect(resistencia(75)).toBeCloseTo(BLUEJAY.Rca75, 9);
        // el jalón de trabajo: 22 % de 13,533 kgf, unas 3 toneladas
        expect(Math.round((H_REF / 9806.65) * 100) / 100).toBe(2.98);
        expect(AISLADOR.aguanta).toBe(1480);
        expect(PIE.maximo).toBe(10);
    });

    it('el calor del cable da lo que dice el catálogo', () => {
        const cat = { Ta: CATALOGO.Ta, v: CATALOGO.v, sol: true };
        expect(Math.abs(corrienteA(CATALOGO.Tc, cat) - BLUEJAY.ampacidad)).toBeLessThan(5);
        expect(Math.round(temperaturaCon(BLUEJAY.ampacidad, cat))).toBe(75);
        // sin corriente queda arriba del aire con sol, y a la temperatura del aire de noche
        expect(temperaturaCon(0, { sol: true })).toBeGreaterThan(30);
        expect(temperaturaCon(0, { sol: false })).toBeCloseTo(25, 1);
        // casi sin viento, mucho más caliente
        expect(temperaturaCon(866, { Ta: 25, v: 0.2 })).toBeGreaterThan(temperaturaCon(866, { Ta: 25, v: 0.61 }) + 15);
    });

    it('la flecha crece con el calor', () => {
        expect(Math.round(flechaA(25) * 10) / 10).toBe(9.2);
        expect(Math.round(flechaA(75) - flechaA(25))).toBe(2);
        expect(tensionA(75)).toBeLessThan(tensionA(25));
        expect(ALFA * 1e6).toBeGreaterThan(20);
        expect(ALFA * 1e6).toBeLessThan(22);
        expect(flechaA(TENSE.diseno)).toBeGreaterThan(flechaA(25));
    });

    it('con más voltaje se pierde menos: las cifras de la ficha', () => {
        const [a, b, c] = [400, 230, 115].map(kV => lejos({ P: 900, kV }));
        expect(Math.round(a.perdida)).toBe(16);
        expect(Math.round(b.perdida)).toBe(49);
        expect(Math.round(c.perdida)).toBe(227);
        expect(a.cabe).toBe(true);
        expect(c.cabe).toBe(false);
        expect(Math.round(amperes(450, 400))).toBe(650);
        expect(Math.round(amperes(450, 230))).toBe(1130);
        // el ejemplo de la fórmula de pérdidas: 650 A, unos 6.2 Ω por fase, unos 7.8 MW por línea
        expect(Math.round((resistencia(a.Tc) / 2) * LINEA.km * 10) / 10).toBe(6.2);
        expect(Math.round((a.perdida / 2) * 10) / 10).toBe(7.8);
        expect(Math.round(a.Tc)).toBe(37);
    });

    it('qué tan lejos: calor, estabilidad, potencia natural y Ferranti', () => {
        expect(Math.round(ZC)).toBe(317);
        expect(Math.round(SIL)).toBe(505);
        expect(Math.round(TERMICO)).toBe(1498);
        const l = limites({ km: LINEA.km });
        expect(l.cual).toBe('estabilidad');
        expect(Math.round(l.manda / 10) * 10).toBe(1750);
        expect(Math.round((l.manda / (2 * SIL)) * 10) / 10).toBe(1.7);
        expect(limites({ km: 60 }).cual).toBe('termico');
        expect(Math.round(vacio({ km: 225 }) * 100)).toBe(104);
        expect(Math.round(vacio({ km: 600 }) * 100)).toBe(138);
        expect(vacio({ km: 225, reactor: true })).toBeLessThan(vacio({ km: 225 }));
        // el voltaje a lo largo: parejo con la potencia natural, abultado con poca carga, hundido con mucha
        const mitad = P => perfil({ P, lineas: 1 })[12].v;
        expect(Math.abs(mitad(SIL * 0.98) - 1)).toBeLessThan(0.015);
        expect(mitad(150)).toBeGreaterThan(1);
        expect(mitad(SIL * 1.7)).toBeLessThan(1);
        expect(enlace({ P: 6000 }).ok).toBe(false);
    });

    it('el rayo: tierra mala, arco y recierre monopolar', () => {
        expect(voltajeAislador(RAYO.tesis.kA, RAYO.tesis.R)).toBeGreaterThan(AISLADOR.aguanta);
        expect(Math.abs(voltajeAislador(45, 9.2) - 1610)).toBeLessThan(50);
        expect(Math.round(corrienteCritica(PIE.maximo))).toBe(40);
        expect(Math.round(corrienteCritica(1))).toBe(56);
        const salta = secuenciaRayo({ kA: 45, R: 9.2 });
        expect(salta.salta).toBe(true);
        expect(salta.tramos.map(t => t.estado)).toEqual(['golpe', 'arco', 'monopolar', 'normal']);
        expect(salta.fin).toBeCloseTo(0.04 + RECIERRE.abre + RECIERRE.muerto, 9);
        const aguanta = secuenciaRayo({ kA: 45, R: 1 });
        expect(aguanta.salta).toBe(false);
        expect(aguanta.tramos.at(-1).estado).toBe('nada');
    });

    it('el incendio: 69 s entre las dos líneas, y la que queda lleva el doble', () => {
        const F = secuenciaIncendio();
        const t = e => F.tramos.find(x => x.estado === e).t0;
        expect(t('arco2') - t('arco1')).toBe(EVENTO2020.entre);
        expect(EVENTO2020.entre).toBe(69);
        expect(enTramo(F, 1e6).abiertas).toBe(2);
        const [una, dos] = [enlace({ P: EVENTO2020.flujo, lineas: 1 }), enlace({ P: EVENTO2020.flujo, lineas: 2 })];
        expect(una.I / dos.I).toBeGreaterThan(1.8);
        expect(una.I).toBeLessThan(TORRE.haz * BLUEJAY.ampacidad);
        expect(Math.round(una.delta)).toBe(31);
        expect(EVENTO2020).toMatchObject({ flujo: 900, carga: 8696, demanda: 31789, fMax: 61.82, fMin: 58.9 });
    });

    it('el tiempo no depende de los cuadros', () => {
        const corre = (dt, n, m) => { let s = estadoPlanta(); s = pasoPlanta(s, { ...m, rayo: true }, 0); for (let i = 0; i < n; i++) s = pasoPlanta(s, { incendio: m.incendio }, dt); return s; };
        const a = corre(0.25, 40, { incendio: true });
        const b = corre(0.05, 200, { incendio: true });
        expect(Math.abs(a.fuego - b.fuego)).toBeLessThan(2);
        expect(a.t).toBeCloseTo(b.t, 6);
        expect(a.rayo === null).toBe(b.rayo === null);
    });

    it('la pose responde a los mandos', () => {
        expect(pose({ desarme: 1 }).desarme).toBe(1);
        expect(pose({ modo: 'limite', abierta: true }).extremoB).toBe(0);
        expect(pose({ modo: 'limite', reactor: false }).reactor).toBe(0);
        const caliente = pose({ modo: 'calor', P: 2400, Ta: 40, v: 0.2 });
        expect(caliente.lineas[0].temp).toBeGreaterThan(75);
        expect(caliente.lineas[0].flecha).toBeGreaterThan(flechaA(50));
        // en el incendio, primero se abre una fase de la línea 1 y al final las dos líneas
        const en = t => pose({ modo: 'falla', planta: { ...estadoPlanta(), fuego: t } });
        expect(en(5.5).lineas[0].fases).toEqual([0, 1, 1]);
        expect(en(30).lineas[0].fases).toEqual([0, 0, 0]);
        expect(en(30).lineas[1].fases).toEqual([1, 1, 1]);
        expect(en(80).lineas[1].fases).toEqual([0, 0, 0]);
        expect(en(80).lineas[1].flujo).toBe(0);
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
        const paginas = ['red-transmision', 'red-transmision-light'].map(n => readFileSync(`public/conceptos/${n}.html`, 'utf8'));
        const citadas = CONCEPTO['red-transmision'].fuentes.map(f => f.url);
        for (const f of FUENTES) {
            expect(f.url).toMatch(/^https?:\/\//);
            expect(f.para).toBeTruthy();
            expect(citadas).toContain(f.url);
            for (const p of paginas) expect(p).toContain(f.url);
        }
        const acervos = CONCEPTO['red-transmision'].fuentes.map(f => f.acervo);
        for (const siglas of ['LSE', 'RLSE']) expect(acervos).toContain(siglas);
        expect(acervos).not.toContain('BME');
        // el mapa de estados de la figura anterior ya no se usa
        expect(existsSync('conceptos-3d/red-transmision/mexico.json')).toBe(false);
    });

    it('su ficha de Aprende tiene una parte por punto clave, en el mismo orden que la figura', () => {
        const c = CONCEPTO['red-transmision'];
        expect(c.figura).toBe('red-transmision');
        expect(c.nivel).toBe(2);
        expect(c.antes).toEqual(['transformador']);
        expect(c.partes).toHaveLength(PARTES.length);
        const fuente = readFileSync('conceptos-3d/red-transmision/main.js', 'utf8');
        const fichas = fuente.slice(fuente.indexOf('const FICHAS = ['), fuente.indexOf('const VISTAS ='));
        const enFigura = [...fichas.matchAll(/\{ parte: '([a-zA-Z0-9]+)', nombre: '([^']+)'/g)];
        expect(enFigura.map(f => f[1])).toEqual(PARTES.map(p => p.id));
        expect(enFigura.map(f => f[2])).toEqual(c.partes.map(p => p.nombre));
        expect(c.revisado).toBeNull();
    });

    it('la ficha cita artículos que sí dicen eso', () => {
        const c = CONCEPTO['red-transmision'];
        const a3 = articulo(LSE, 3);
        expect(a3).toContain('XII. Control Operativo del Sistema Eléctrico Nacional: Actividad estratégica exclusiva del Estado');
        expect(a3).toContain('b) La operación de la Red Nacional de Transmisión para el servicio público de Transmisión');
        expect(a3).toContain('XX. Empresa Pública del Estado: Comisión Federal de Electricidad');
        expect(a3).toContain('XLI. Red Nacional de Transmisión: Sistema integrado por el conjunto de las Redes Eléctricas que se utilizan para transportar energía eléctrica a las Redes Generales de Distribución y a grandes usuarios de electricidad, así como las interconexiones a los sistemas eléctricos extranjeros que determine la Secretaría');
        expect(a3).toContain('LXIII. Transportista: Empresa Pública del Estado que presta el Servicio Público de Transmisión de Energía Eléctrica');
        expect(articulo(LSE, 13)).toContain('deben realizarse conforme a los programas que al efecto autorice la Secretaría, escuchando la opinión de la CNE');
        expect(articulo(LSE, 14)).toContain('El Estado ejerce el Control Operativo del Sistema Eléctrico Nacional a través del CENACE');
        expect(articulo(LSE, 44)).toContain('operan sus redes conforme a las instrucciones del CENACE');
        expect(articulo(LSE, 44)).toContain('Para el mantenimiento de la Red Nacional de Transmisión');
        expect(articulo(LSE, 47)).toContain('deben llevar a cabo los proyectos de ampliación y modernización de la Red Nacional de Transmisión');
        expect(articulo(LSE, 47)).toContain('previa instrucción de la Secretaría');
        expect(articulo(LSE, 57)).toContain('es de utilidad pública');
        expect(articulo(LSE, 57)).toContain('Están sujetos a servidumbre legal los predios necesarios para la instalación de la Red Nacional de Transmisión');
        expect(articulo(LSE, 90)).toContain('necesarios para el Servicio Público de Transmisión');
        expect(articulo(LSE, 90)).toContain('ejidales o comunales');
        expect(articulo(LSE, 91)).toContain('debe expresar por escrito a la persona propietaria');
        expect(articulo(LSE, 91)).toContain('debe mostrar y describir el proyecto');
        expect(articulo(LSE, 91)).toContain('debe notificar a la Secretaría y a la Secretaría de Desarrollo Agrario, Territorial y Urbano del inicio de las negociaciones');
        expect(articulo(RLSE, 222)).toContain('en un plazo de veinte días hábiles');
        expect(articulo(RLSE, 222)).toContain('Proyectos de Infraestructura del servicio público de transmisión');
        expect(c.ley.siglas).toEqual(['LSE', 'RLSE']);
        // la RNT y las RGD se escriben completas la primera vez
        expect(c.ley.texto).toContain('Red Nacional de Transmisión (RNT)');
        expect(c.ley.ficha.elQue).toContain('Redes Generales de Distribución (RGD)');
        const texto = JSON.stringify(c);
        expect(texto).not.toMatch(/(?<![-\w])SAE(?![\w-])/);
        expect(texto).not.toContain('Regiones de control');
    });
});
