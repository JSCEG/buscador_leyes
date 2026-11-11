import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CONCEPTO } from '../src/data/como-funciona.js';

const lista = archivo => {
    const d = JSON.parse(readFileSync(`public/data/${archivo}`, 'utf8'));
    return Array.isArray(d) ? d : Object.values(d).find(Array.isArray);
};
const articulo = (archivo, n) => lista(archivo).filter(a => a.articulo_num === n && !a.transitorio_num).map(a => a.texto).join(' ').replace(/\s+/g, ' ');
const LSE = 'Ley_Sector_Electrico_chunks.json';
const LSH = 'LSH_chunks.json';
const texto = id => JSON.stringify(CONCEPTO[id]);

describe('Las fichas de ley de los mercados y los hidrocarburos', () => {
    it('el CENACE: lo que cita está en la Ley del Sector Eléctrico', () => {
        expect(articulo(LSE, 123)).toContain('El CENACE es un organismo público descentralizado de la Administración Pública Federal');
        expect(articulo(LSE, 110)).toContain('El CENACE opera el Mercado Eléctrico Mayorista');
        expect(articulo(LSE, 111)).toContain('La CNE emite las Bases del Mercado Eléctrico. El CENACE emite las Disposiciones Operativas del Mercado.');
        expect(articulo(LSE, 112)).toContain('VI. Certificados de Energías Limpias');
        expect(articulo(LSE, 21)).toContain('deben ser representadas por una Generadora Participante del Mercado Eléctrico Mayorista');
        expect(articulo(LSE, 43)).toContain('Se otorga despacho obligado a la energía eléctrica producida mediante el proceso de cogeneración');
        expect(articulo(LSE, 117)).toContain('se ejecuta independientemente de la propiedad o representación de las Centrales Eléctricas');
        // el artículo 117 no habla de la prevalencia del Estado
        expect(articulo(LSE, 117)).not.toContain('prevalencia');
        expect(texto('mercado-cenace')).not.toContain('prevalencia estatal (art. 117)');
        expect(texto('mercado-cenace')).not.toContain('MDA');
        expect(CONCEPTO['mercado-cenace'].resumen).toContain('Centro Nacional de Control de Energía (CENACE)');
    });

    it('¿Qué son los hidrocarburos?: lo que cita está en la LSH y en la ley de PEMEX', () => {
        expect(articulo(LSH, 1)).toContain('Corresponde a la Nación la propiedad directa, inalienable e imprescriptible de todos los Hidrocarburos');
        expect(articulo(LSH, 5)).toContain('XXVI. Hidrocarburos: Compuestos químicos orgánicos formados principalmente por hidrógeno y carbono, en forma de Petróleo líquido, Gas Natural y otros compuestos sólidos');
        expect(articulo(LSH, 10)).toContain('I. Asignaciones para Desarrollo Propio, y II. Asignaciones para Desarrollo Mixto');
        expect(articulo(LSH, 11)).toContain('de manera excepcional, se pueden otorgar Contratos para la Exploración y Extracción');
        expect(articulo('LEPE_PEMEX_chunks.json', 2)).toContain('sectorizada a la Secretaría de Energía');
        expect(articulo('LEPE_PEMEX_chunks.json', 4)).toContain('no constituyen monopolios');
        const c = CONCEPTO['hidrocarburos-moleculas'];
        expect(c.ley.siglas).toEqual(['LSH', 'LEPE-PEMEX']);
        expect(c.fuentes.map(f => f.acervo).filter(Boolean)).toEqual(['LSH', 'LEPE-PEMEX']);
        // la ley de hidrocarburos no dice «área estratégica»: eso lo dice la Constitución, que no está en el acervo
        expect(c.ley.ficha.elComo).not.toContain('área estratégica');
        expect(texto('hidrocarburos-moleculas')).not.toContain('$CH_4$');
    });

    it('Asignaciones: lo que cita está en la LSH', () => {
        expect(articulo(LSH, 17)).toContain('sólo puede celebrar con Particulares contratos de servicios');
        expect(articulo(LSH, 17)).toContain('siempre que la contraprestación se realice en efectivo');
        expect(articulo(LSH, 22)).toContain('previa autorización del Consejo de Administración de Petróleos Mexicanos, la sustitución de una Asignación para Desarrollo Propio por una Asignación para Desarrollo Mixto');
        expect(articulo(LSH, 24)).toContain('Petróleos Mexicanos mantiene el derecho exclusivo sobre la Asignación');
        expect(articulo(LSH, 25)).toContain('procedimiento de selección');
        expect(articulo(LSH, 26)).toContain('deben establecer la propiedad exclusiva del Estado Mexicano sobre los Hidrocarburos en el Subsuelo');
        expect(articulo(LSH, 31)).toContain('no menor al cuarenta por ciento');
        expect(articulo(LSH, 32)).toContain('revisar la efectiva recuperación de los costos');
        expect(articulo(LSH, 8)).toContain('proveer al pueblo combustibles de la mejor calidad y al menor precio posible');
        expect(texto('asignaciones-hidrocarburos')).not.toContain('Upstream');
        expect(texto('asignaciones-hidrocarburos')).not.toContain('midstream');
        expect(texto('asignaciones-hidrocarburos')).not.toContain('obra o servicios');
    });

    it('El mercado de combustibles: lo que cita está en la LSH, su reglamento y la ley de la CNE', () => {
        expect(articulo(LSH, 76)).toContain('Expendio al Público y despacho para autoconsumo de Petrolíferos');
        expect(articulo(LSH, 80)).toContain('deben presentar la solicitud a la Secretaría de Energía o la Comisión Nacional de Energía');
        expect(articulo(LSH, 81)).toContain('la localización del proyecto, los volúmenes, la demanda local y regional, el impacto que el proyecto tiene en el sano desarrollo del mercado');
        expect(articulo(LSH, 82)).toContain('los términos y condiciones del permiso de Comercialización');
        expect(articulo(LSH, 89)).toContain('Incumplir con la entrega de la información que permita a la Secretaría de Energía o a la Comisión Nacional de Energía conocer los controles volumétricos');
        expect(articulo('RLSH_chunks.json', 109)).toContain('El título de permiso de Comercialización');
        expect(articulo('LCNE_chunks.json', 9)).toContain('comercialización y expendio al público de petrolíferos');
        const t = texto('mercado-hidrocarburos');
        expect(t).not.toContain('RENAGAS');
        expect(t).not.toContain('Downstream');
        expect(t).not.toContain('procedencia lícita y balance de mercado');
    });
});
