import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseRegulatoryText, reconstructPdfPages, validateRegulatoryChunks } from '../src/lib/regulatory-parser.js';

describe('parser real del gestor regulatorio', () => {
    test('LCNE: respeta artículos, capítulos únicos, ambos grupos de transitorios y SCJN', () => {
        const root = 'revision-acervo/LCNE/';
        const provenance = JSON.parse(readFileSync(root + 'LCNE_trazabilidad.json', 'utf8'));
        const reference = JSON.parse(readFileSync(root + 'LCNE_chunks_revisados.json', 'utf8'));
        const parsed = parseRegulatoryText(provenance.lineas.map(x=>x.texto).join('\n'));
        const articles = parsed.chunks.filter(c=>c.tipo==='ordinario');
        expect(articles.map(c=>c.identificador)).toEqual(Array.from({length:28},(_,i)=>`Artículo ${i+1}`));
        const trans = parsed.chunks.filter(c=>c.tipo==='transitorio');
        expect(trans.filter(c=>c.bloque_transitorio===1)).toHaveLength(13);
        expect(trans.filter(c=>c.bloque_transitorio===2)).toHaveLength(2);
        expect(parsed.themes.filter(t=>t.nivel==='titulo')).toHaveLength(5);
        expect(parsed.themes.filter(t=>t.nivel==='capitulo')).toHaveLength(8);
        const compact = s=>s.replace(/\s+/g,'');
        for (const referenceChunk of reference.articulos) {
            const actual = referenceChunk.articulo_num ? articles[referenceChunk.articulo_num-1]
                : trans.filter(c=>c.bloque_transitorio===1)[referenceChunk.transitorio_num-1];
            const withoutHeading = referenceChunk.texto.replace(/^(?:Artículo \d+|[\p{L} ]+)\.-\s*/u,'');
            expect(compact(actual.contenido), referenceChunk.id).toBe(compact(withoutHeading));
        }
        expect(articles[21].contenido).toContain('Fracción declarada inválida');
        expect(parsed.chunks.some(c=>c.tipo==='complementario'&&c.contenido.includes('51/2025'))).toBe(true);
        expect(parsed.diagnostics.some(d=>d.blocking)).toBe(false);
    });

    test('decretos con ordinales compuestos no cortan referencias internas', () => {
        const {chunks} = parseRegulatoryText('Artículo Primero. Se refiere al artículo Tercero de este decreto.\nArtículo Décimo Primero. Se establece una regla.\nTRANSITORIOS\nDécimo Segundo. Se aplica después.');
        expect(chunks.map(c=>c.identificador)).toEqual(['Artículo Primero','Artículo Décimo Primero','Transitorio Décimo Segundo']);
        expect(chunks[0].contenido).toContain('artículo Tercero');
    });
    test('PDF.js real de LCNE conserva los 41 fragmentos revisados', () => {
        const root = 'revision-acervo/LCNE/';
        const pages = JSON.parse(readFileSync(root + 'pdfjs-paginas.json', 'utf8'));
        const reference = JSON.parse(readFileSync(root + 'LCNE_chunks_revisados.json', 'utf8'));
        const {text,emptyPages} = reconstructPdfPages(pages);
        const parsed = parseRegulatoryText(text);
        const articles = parsed.chunks.filter(c=>c.tipo==='ordinario');
        const trans = parsed.chunks.filter(c=>c.tipo==='transitorio'&&c.bloque_transitorio===1);
        expect(articles).toHaveLength(28);
        expect(trans).toHaveLength(13);
        expect(parsed.themes).toHaveLength(13);
        expect(emptyPages).toEqual([]);
        for (const ref of reference.articulos) {
            const actual = ref.articulo_num ? articles[ref.articulo_num-1] : trans[ref.transitorio_num-1];
            const expected = ref.texto.replace(/^(?:Artículo \d+|[\p{L} ]+)\.-\s*/u,'');
            expect(actual.contenido.replace(/\s/g,''),ref.id).toBe(expected.replace(/\s/g,''));
        }
    });
    test('encabezados aislados, puntuación separada y listas dentro de transitorios', () => {
        const {chunks} = parseRegulatoryText('Artículo 1\nTexto.\nArtículo 2. - Texto segundo.\nTRANSITORIOS\nPrimero\nRequisitos:\n1. Uno.\n2. Dos.\nSegundo. - Vigor.');
        expect(chunks.map(c=>c.identificador)).toEqual(['Artículo 1','Artículo 2','Transitorio Primero','Transitorio Segundo']);
        expect(chunks[2].contenido).toContain('2. Dos.');
        expect(chunks[3].contenido).toBe('Vigor.');
    });
    test('SAEE real: índice, referencias partidas y listas dentro del quinto transitorio', () => {
        const fixture = JSON.parse(readFileSync('revision-acervo/LCNE/pdfjs-saee.json','utf8'));
        const {text} = reconstructPdfPages(fixture.pages);
        const {chunks,themes,diagnostics} = parseRegulatoryText(text);
        expect(themes).toHaveLength(9);
        expect(chunks.filter(c=>c.tipo==='transitorio')).toHaveLength(9);
        expect(chunks.filter(c=>c.identificador==='Numeral 3.12')).toHaveLength(1);
        expect(chunks.find(c=>c.identificador==='Numeral 3.13').contenido).toContain('3.12. de las Disposiciones');
        expect(chunks.find(c=>c.identificador==='Numeral 2.8').contenido).toContain('Capítulo VIII de las Disposiciones.');
        expect(chunks.some(c=>c.identificador==='Índice de la fuente')).toBe(true);
        expect(diagnostics.some(d=>d.blocking)).toBe(false);
        const fifth = text.split('QUINTO. ')[1].split('SEXTO. ')[0].trim();
        expect(chunks.find(c=>c.identificador==='Transitorio QUINTO').contenido).toBe(fifth);
        expect(text).not.toMatch(/https:\/\/www\.dof\.gob\.mx\/nota_detalle[^\n]+\d+\/18/);
    });
    test('numerales de varios dígitos y años de continuación no se confunden', () => {
        const {chunks} = parseRegulatoryText('1.11 Objeto.\n1.12\nAplicará desde el año\n2026 en todo el territorio.\n2.15. Vigor.', {mode:'decimal'});
        expect(chunks.map(c=>c.identificador)).toEqual(['Numeral 1.11','Numeral 1.12','Numeral 2.15']);
        expect(chunks[1].contenido).toContain('2026 en todo');
    });
    test('ordinales explícitos después del artículo de expedición', () => {
        const {chunks} = parseRegulatoryText('Artículo Único. Se expide el acuerdo.\nPrimero. Objeto.\nSegundo. Alcance.',{mode:'ordinals'});
        expect(chunks.map(c=>c.identificador)).toEqual(['Artículo Único','Disposición Primero','Disposición Segundo']);
    });
    test('artículos Bis y fracciones numéricas permanecen dentro del artículo', () => {
        const {chunks} = parseRegulatoryText('Artículo 1. Requisitos:\n1. Un requisito.\n2. Dos.\n3. Tres.\nArtículo 1 Bis. Otra regla.\nArtículo 2. Fin.');
        expect(chunks).toHaveLength(3);
        expect(chunks[0].contenido).toContain('3. Tres.');
        expect(chunks[1].identificador).toBe('Artículo 1 Bis');
    });
    test('apartados decimales detrás de un artículo de emisión', () => {
        const {chunks} = parseRegulatoryText('Artículo Único. Se expiden las disposiciones.\nCapítulo I\nDisposiciones generales\n1.1. Objeto.\n1.2. Alcance.\n2.1 Aplicación.');
        expect(chunks.map(c=>c.identificador)).toEqual(['Artículo Único','Numeral 1.1','Numeral 1.2','Numeral 2.1']);
        expect(chunks[1].capitulo_nombre).toContain('Disposiciones generales');
    });
    test('lineamientos por numerales y transitorio único', () => {
        const {chunks} = parseRegulatoryText('CAPÍTULO I GENERALIDADES\n1. Objeto.\n2. Alcance.\n3. Aplicación.\nTRANSITORIO\nÚnico. Vigor.');
        expect(chunks.map(c=>c.identificador)).toEqual(['Numeral 1','Numeral 2','Numeral 3','Transitorio Único']);
        expect(chunks[0].capitulo_nombre).toContain('GENERALIDADES');
    });
    test('acuerdos sin la palabra artículo y anexos', () => {
        const {chunks,notices} = parseRegulatoryText('ACUERDO\nPrimero. Regla uno.\nSegundo. Regla dos.\nANEXO 1\n1.1. Contenido del anexo.');
        expect(chunks.some(c=>c.identificador==='Disposición Primero')).toBe(true);
        expect(chunks.some(c=>c.tipo==='anexo'&&c.identificador.includes('1.1'))).toBe(true);
        expect(notices.some(n=>n.code==='anexos')).toBe(true);
    });
    test('avisos por duplicados, texto vacío y estructura no reconocida', () => {
        const p = parseRegulatoryText('Artículo 1. Uno.\nArtículo 1. Otra ley.');
        expect(p.diagnostics.some(x=>x.blocking && x.code==='duplicado')).toBe(true);
        expect(validateRegulatoryChunks([])[0].blocking).toBe(true);
        expect(parseRegulatoryText('Texto sin numeración.').notices[0].code).toBe('estructura_no_reconocida');
    });
    test('reconstruye orden visual y quita solo márgenes repetidos', () => {
        const item=(str,x,y)=>({str,transform:[1,0,0,1,x,y]});
        const pages=[1,2].map(n=>({height:800,items:[item('Ley de prueba',10,780),item(`${n} de 2`,10,20),item('contenido',80,600),item('Artículo '+n+'.',10,600),item('Nota al pie importante',10,100)]}));
        const result = reconstructPdfPages(pages);
        expect(result.text).not.toContain('Ley de prueba');
        expect(result.text).toContain('Artículo 1. contenido');
        expect(result.text).toContain('Nota al pie importante');
        expect(result.emptyPages).toEqual([]);
    });
});
