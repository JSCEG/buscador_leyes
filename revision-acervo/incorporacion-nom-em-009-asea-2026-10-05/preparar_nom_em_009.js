const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const DIR = __dirname;
const SOURCE = path.join(DIR, 'NOM-EM-009-oficial.html');
const SOURCE_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5800282';
const PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/05-10-2026/Matutina/330025';
const TITLE = 'Norma Oficial Mexicana de Emergencia NOM-EM-009-ASEA-2026, Distribución de Gas Licuado de Petróleo por medio de Auto-tanque y Vehículo de Reparto';
const NAMESPACE = Buffer.from('c46f16bf5a7b4d10a391d09b2ad42b43', 'hex');
const LAW_ID = uuidV5('sidof:5800282');
const SECTION_TITLES = {
  1: 'Objetivo', 2: 'Campo de aplicación', 3: 'Objetivo legítimo de interés público',
  4: 'Referencias normativas', 5: 'Términos, definiciones, términos abreviados, símbolos y siglas',
  6: 'Inicio de operación', 7: 'Operación y mantenimiento', 8: 'Término de operación',
  9: 'Procedimiento de Evaluación de la Conformidad',
  10: 'Grado de concordancia con normas internacionales',
  11: 'Verificación de la Norma Oficial Mexicana de Emergencia', 12: 'Bibliografía',
};
const APPENDICES = {
  A: 'Listado de revisión visual diaria',
  B: 'Condiciones de seguridad de la parte motriz de Auto-tanques y Vehículos de Reparto',
  C: 'Delimitación de las Zonas Metropolitanas de México',
};
const TRANSITORIES = ['PRIMERO', 'SEGUNDO', 'TERCERO', 'CUARTO', 'QUINTO', 'SEXTO', 'SÉPTIMO', 'OCTAVO'];

function uuidV5(name) {
  const hash = crypto.createHash('sha1').update(NAMESPACE).update(name, 'utf8').digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
function normalize(text) {
  return String(text || '').replace(/\u00a0/g, ' ').replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}
function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function safeParagraph(element) {
  const text = normalize(element.textContent);
  return text ? `<div>${escapeHtml(text)}</div>` : '';
}
function safeTable(table) {
  const rows = [...table.querySelectorAll('tr')].map((row) => {
    const cells = [...row.querySelectorAll('th,td')].map((cell) => `<td>${escapeHtml(normalize(cell.textContent))}</td>`);
    return cells.length ? `<tr>${cells.join('')}</tr>` : '';
  }).filter(Boolean);
  return rows.length ? `<table><tbody>${rows.join('')}</tbody></table>` : '';
}
function plainHtml(value) {
  return normalize(new JSDOM(value).window.document.body.textContent);
}
function main() {
  if (!fs.existsSync(SOURCE)) throw new Error(`Falta la fuente oficial descargada: ${SOURCE}`);
  const doc = new JSDOM(fs.readFileSync(SOURCE, 'utf8')).window.document;
  const elements = [...doc.querySelectorAll('h1,h2,div.Texto,div.ANOTACION,div.ROMANOS,table,img')];
  const appendixNames = { ...APPENDICES };
  const segments = [];
  const addSegment = (key, label, type, section, chapter = null, code = null) => {
    const segment = { key, label, type, section, chapter, code, blocks: [] };
    segments.push(segment);
    return segment;
  };
  let current = addSegment('front', 'Preámbulo de la norma', 'preambulo', 'Preámbulo');
  let inIndex = false;
  let bodyStarted = false;
  let recital = 0;
  let activeAppendix = null;
  let appendixATable = 0;
  const sectionByCode = new Map();
  const append = (html) => { if (html) current.blocks.push(html); };

  for (const element of elements) {
    if (element.matches('table, img') && element.closest('table') !== element && element.closest('table')) continue;
    if (element.matches('div.Texto') && element.closest('table')) continue;
    const text = normalize(element.textContent);
    if (!text && !element.matches('img,table')) continue;

    if (element.matches('div.ANOTACION') && /^ÍNDICE DEL CONTENIDO$/i.test(text)) { inIndex = true; continue; }
    if (inIndex) {
      if (element.matches('div.ROMANOS') && /^TRANSITORIOS$/i.test(text)) inIndex = false;
      continue;
    }

    if (element.matches('div.ANOTACION') && /^Apéndice\s+([ABC])\b/i.test(text)) {
      const letter = text.match(/^Apéndice\s+([ABC])/i)[1].toUpperCase();
      activeAppendix = letter;
      current = addSegment(`appendix-${letter.toLowerCase()}`, `Apéndice ${letter} (Normativo) · ${appendixNames[letter]}`, 'anexo', `Apéndice ${letter} (Normativo)`, `Apéndice ${letter} (Normativo)`);
      if (letter === 'C') {
        current = addSegment('appendix-c-c1', 'Apéndice C · Tabla C1 · Zonas metropolitanas categoría 1', 'anexo', 'Apéndice C (Normativo)', 'Tabla C1');
        append(`<div>Apéndice C (Normativo) · ${appendixNames.C}</div>`);
      } else append(`<div>Apéndice ${letter} (Normativo) · ${appendixNames[letter]}</div>`);
      continue;
    }
    if (element.matches('div.ANOTACION') && /^TRANSITORIOS$/i.test(text)) continue;

    if (activeAppendix === 'C' && /^Tabla C2\b/i.test(text)) {
      current = addSegment('appendix-c-c2', 'Apéndice C · Tabla C2 · Zonas metropolitanas categoría 2', 'anexo', 'Apéndice C (Normativo)', 'Tabla C2');
    } else if (activeAppendix === 'B' && element.matches('div.ROMANOS,div.Texto')) {
      const appendixHeading = text.match(/^(B\.\d+)\s+(.+)$/i);
      if (appendixHeading) current = addSegment(`appendix-b-${appendixHeading[1].toLowerCase()}`, `Apéndice B · ${appendixHeading[1]} ${normalize(appendixHeading[2])}`, 'anexo', 'Apéndice B (Normativo)', 'Apéndice B (Normativo)', appendixHeading[1]);
    }

    const transition = element.matches('div.Texto') ? text.match(/^(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|SÉPTIMO|OCTAVO)\s*[-.]\s*/i) : null;
    if (transition) {
      const ordinal = transition[1].toUpperCase();
      current = addSegment(`transitorio-${ordinal.toLowerCase()}`, `Transitorio ${ordinal[0]}${ordinal.slice(1).toLowerCase()}`, 'transitorio', 'Transitorios');
    } else if (element.matches('div.ROMANOS,div.Texto')) {
      const primary = text.match(/^(\d{1,2})\.\s*(.+)$/);
      const sub = text.match(/^(\d+\.\d+(?:\.\d+)*\.?)\s*(.*)$/);
      if (primary && Number(primary[1]) in SECTION_TITLES && normalize(primary[2]).toLowerCase() === SECTION_TITLES[Number(primary[1])].toLowerCase()) {
        bodyStarted = true;
        const number = Number(primary[1]);
        current = addSegment(`numeral-${number}`, `Numeral ${number}. ${SECTION_TITLES[number]}`, 'ordinario', SECTION_TITLES[number], null, `${number}.`);
      } else if (bodyStarted && current.type !== 'anexo' && sub) {
        const code = sub[1].replace(/\.$/, '');
        const title = normalize(sub[2]);
        const parent = code.split('.').slice(0, -1).join('.');
        let chapter = null;
        for (let depth = code.split('.').length - 1; depth > 0; depth -= 1) {
          const ancestor = code.split('.').slice(0, depth).join('.');
          if (sectionByCode.has(ancestor)) { chapter = `${ancestor} · ${sectionByCode.get(ancestor)}`; break; }
        }
        const sectionCode = code;
        if (title && !/^(?:https?:\/\/|DOF\b)/i.test(title)) sectionByCode.set(code, title);
        // References and list items remain in their parent section; only true nested clause labels become fragments.
        if (code.split('.').length >= 2) {
          current = addSegment(`numeral-${code}`, `Numeral ${code}`, 'ordinario', current.section, chapter || (parent ? `${parent} · ${sectionByCode.get(parent) || ''}`.trim() : null), sectionCode);
        }
      } else if (!bodyStarted && element.matches('div.Texto') && /^Que\b/i.test(text)) {
        recital += 1;
        current = addSegment(`considerando-${String(recital).padStart(2, '0')}`, `Considerando ${recital}`, 'preambulo', 'Preámbulo');
      }
    }

    if (element.matches('h1,h2,div.Texto,div.ANOTACION,div.ROMANOS')) append(safeParagraph(element));
    else if (element.matches('table')) {
      if (activeAppendix === 'A') {
        appendixATable += 1;
        const unit = appendixATable;
        current = addSegment(`appendix-a-form-${unit}`, `Apéndice A · Formato de revisión diaria ${unit === 1 ? 'de Auto-tanque' : 'de Vehículo de Reparto'}`, 'anexo', 'Apéndice A (Normativo)', 'Apéndice A (Normativo)', `A-${unit}`);
      }
      append(safeTable(element));
    }
    else if (element.matches('img')) append(`<div><img src="${escapeHtml(element.getAttribute('src') || '')}" alt="Figura oficial de la NOM" loading="lazy"></div>`);
  }

  const editorial = {
    id: uuidV5(`${LAW_ID}:editorial`), ley_id: LAW_ID, orden: 0,
    identificador: 'Nota editorial · instrumento regulatorio',
    contenido: `<h3>Nota editorial · instrumento regulatorio</h3><p>La NOM-EM-009-ASEA-2026 fue publicada en el Diario Oficial de la Federación el 5 de octubre de 2026. Su transitorio Primero establece entrada en vigor el 6 de octubre de 2026 y vigencia de seis meses. El transitorio Segundo reconoce hasta el término de su vigencia los dictámenes emitidos conforme a la NOM-EM-007-ASEA-2025. Este registro contiene la nueva norma, sin consolidarla ni reemplazar el instrumento anterior.</p><p>Fuente oficial: <a href="${SOURCE_URL}">${SOURCE_URL}</a>. Edición matutina del DOF: <a href="${PDF_URL}">${PDF_URL}</a>. Consulta cotejada el 6 de octubre de 2026.</p>`,
    tipo_articulo: 'nota', titulo_nombre: 'Información editorial', capitulo_nombre: null, seccion_nombre: null,
  };
  const articulos = [editorial];
  for (const segment of segments) {
    const contenido = segment.blocks.filter(Boolean).join('\n');
    if (!contenido.trim()) continue;
    articulos.push({
      id: uuidV5(`${LAW_ID}:${segment.key}`), ley_id: LAW_ID, orden: articulos.length,
      identificador: segment.label, contenido, tipo_articulo: segment.type,
      titulo_nombre: segment.section, capitulo_nombre: segment.chapter, seccion_nombre: segment.code,
    });
  }

  const topicNames = ['Seguridad industrial y operativa', 'Distribución de gas licuado de petróleo', 'Auto-tanques y vehículos de reparto', 'Recipientes no desmontables e integridad mecánica', 'Operación y mantenimiento', 'Evaluación de la conformidad', 'Zonas metropolitanas', 'Capacitación de operadores'];
  const temas = [
    { nivel: 'titulo', nombre: 'Información editorial' }, { nivel: 'capitulo', nombre: 'Preámbulo' },
    ...Object.values(SECTION_TITLES).map((nombre) => ({ nivel: 'capitulo', nombre })),
    ...Object.entries(APPENDICES).map(([letter, name]) => ({ nivel: 'capitulo', nombre: `Apéndice ${letter} (Normativo) · ${name}` })),
    { nivel: 'capitulo', nombre: 'Transitorios' },
    ...topicNames.map((nombre) => ({ nivel: 'seccion', nombre })),
  ].map((topic, orden) => ({ ...topic, orden }));
  const payload = {
    ley: { id: LAW_ID, titulo: TITLE, siglas: 'NOM-EM-009-ASEA-2026', fecha_publicacion: '2026-10-05', fecha_ultima_reforma: null, vigente: null, temas_clave: topicNames, url_original: SOURCE_URL, tipo: 'nom' },
    articulos, temas,
  };
  const sourceParagraphs = [...doc.querySelectorAll('div.Texto')].filter((n) => !n.closest('table')).map((n) => normalize(n.textContent)).filter((t) => t && !/^ÍNDICE DEL CONTENIDO$/i.test(t));
  const tableCellTexts = [...doc.querySelectorAll('table td,table th')].map((n) => normalize(n.textContent)).filter(Boolean);
  const packagedText = normalize(articulos.slice(1).map((row) => plainHtml(row.contenido)).join(' '));
  const missingParagraphs = sourceParagraphs.filter((text) => !packagedText.includes(text));
  const missingCells = tableCellTexts.filter((text) => !packagedText.includes(text));
  const count = (type) => articulos.filter((row) => row.tipo_articulo === type).length;
  const expectedSections = Object.keys(SECTION_TITLES).length;
  const check = {
    instrumento: 'NOM-EM-009-ASEA-2026', fecha_cotejo: '2026-10-06', estado: 'paquete_preparado_para_cotejo', fuente_html: SOURCE_URL, fuente_pdf_edicion: PDF_URL,
    cotejo_pdf: { paginas_totales: 328, paginas_impresas_norma: [12, 74], sha256_edicion: '83c8aaff9f1162268aebcc63cf38106e82c5242d9a9f8dc101575bc5849eec49', numerales_principales: expectedSections, ocho_transitorios: true, tres_apendices: true },
    estructura_oficial: { numerales_principales: expectedSections, fragmentos_numerados: count('ordinario'), transitorios: count('transitorio'), apendices: Object.fromEntries(['A','B','C'].map((letter) => [letter, articulos.filter((row) => row.identificador.startsWith(`Apéndice ${letter} `)).length])), tablas_oficiales: doc.querySelectorAll('table').length, figuras_oficiales: doc.querySelectorAll('img').length, parrafos_de_fuente: sourceParagraphs.length, parrafos_cotejados: sourceParagraphs.length - missingParagraphs.length, celdas_de_tabla: tableCellTexts.length, celdas_cotejadas: tableCellTexts.length - missingCells.length },
    verificaciones: ['Se conserva la estructura de NOM: numerales y subnumerales, apéndices A/B/C y transitorios separados.', 'Se omite únicamente el índice duplicado del DOF.', 'Las tablas se serializan dentro del apéndice o numeral que les corresponde.', 'El PDF oficial no se agrega al repositorio; el mapa de páginas se prepara por separado contra la edición exacta.'],
    ids_estables: true, ids_numerales: articulos.filter((row) => row.identificador.startsWith('Numeral ')).map((row) => row.seccion_nombre), alertas: [],
  };
  if (count('transitorio') !== 8) check.alertas.push(`Se esperaban 8 transitorios y se detectaron ${count('transitorio')}.`);
  if (count('ordinario') < 12) check.alertas.push('No se detectaron los numerales principales.');
  if (new Set(articulos.map((row) => row.id)).size !== articulos.length) check.alertas.push('Hay UUID duplicados.');
  if (articulos.some((row) => !row.contenido.trim())) check.alertas.push('Hay fragmentos vacíos.');
  if (missingParagraphs.length) check.alertas.push(`${missingParagraphs.length} párrafos oficiales omitidos: ${missingParagraphs.slice(0,3).join(' | ')}`);
  if (missingCells.length) check.alertas.push(`${missingCells.length} celdas de tablas omitidas: ${missingCells.slice(0,3).join(' | ')}`);
  for (const [letter, name] of Object.entries(APPENDICES)) if (!articulos.some((row) => row.identificador.startsWith(`Apéndice ${letter} `) && (row.contenido.includes(name) || row.titulo_nombre === `Apéndice ${letter} (Normativo)`))) check.alertas.push(`No se detectó completo el Apéndice ${letter}.`);

  const sqlPayload = JSON.stringify(payload);
  const sql = `-- Incorporación cotejada: NOM-EM-009-ASEA-2026\n-- Fuente: ${SOURCE_URL}\nBEGIN;\nDO $ingest$\nDECLARE p jsonb := $payload$${sqlPayload}$payload$::jsonb; lid uuid;\nBEGIN\n LOCK TABLE public.leyes,public.articulos,public.temas IN SHARE ROW EXCLUSIVE MODE;\n lid := (p->'ley'->>'id')::uuid;\n IF EXISTS(SELECT 1 FROM public.leyes WHERE id=lid OR lower(siglas)=lower(p->'ley'->>'siglas') OR lower(titulo)=lower(p->'ley'->>'titulo') OR url_original=p->'ley'->>'url_original') THEN RAISE EXCEPTION 'El instrumento ya existe: revisar, no reemplazar'; END IF;\n INSERT INTO public.leyes(id,titulo,siglas,fecha_publicacion,fecha_ultima_reforma,vigente,temas_clave,url_original,tipo) SELECT id,titulo,siglas,fecha_publicacion,fecha_ultima_reforma,vigente,temas_clave,url_original,tipo FROM jsonb_populate_record(null::public.leyes,p->'ley');\n INSERT INTO public.articulos(id,ley_id,identificador,contenido,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre,orden) SELECT id,ley_id,identificador,contenido,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre,orden FROM jsonb_populate_recordset(null::public.articulos,p->'articulos');\n INSERT INTO public.temas(ley_id,nivel,nombre,orden) SELECT lid,t->>'nivel',t->>'nombre',(t->>'orden')::int FROM jsonb_array_elements(p->'temas')t;\n IF (SELECT count(*) FROM public.articulos WHERE ley_id=lid)<>jsonb_array_length(p->'articulos') OR EXISTS(SELECT 1 FROM jsonb_array_elements(p->'articulos')b LEFT JOIN public.articulos a ON a.id=(b->>'id')::uuid WHERE a.id IS NULL OR (to_jsonb(a)-'fts'-'created_at') IS DISTINCT FROM b) THEN RAISE EXCEPTION 'Fallo de cotejo exacto de fragmentos'; END IF;\n IF (SELECT count(*) FROM public.temas WHERE ley_id=lid)<>jsonb_array_length(p->'temas') OR EXISTS(SELECT 1 FROM jsonb_array_elements(p->'temas')b WHERE NOT EXISTS(SELECT 1 FROM public.temas t WHERE ley_id=lid AND (to_jsonb(t)-'id'-'ley_id'-'created_at')=b)) THEN RAISE EXCEPTION 'Fallo de cotejo de estructura'; END IF;\n IF NOT EXISTS(SELECT 1 FROM public.leyes l WHERE id=lid AND to_jsonb(l)-'created_at'=p->'ley') THEN RAISE EXCEPTION 'Metadatos diferentes'; END IF;\n IF EXISTS(SELECT 1 FROM public.articulos WHERE ley_id=lid AND (nullif(trim(contenido),'') IS NULL OR fts IS NULL OR fts=''::tsvector)) THEN RAISE EXCEPTION 'Texto o índice FTS vacío'; END IF;\nEND $ingest$;\nCOMMIT;\nSELECT l.siglas,l.id,(SELECT count(*) FROM public.articulos a WHERE a.ley_id=l.id) fragmentos,(SELECT count(*) FROM public.temas t WHERE t.ley_id=l.id) temas FROM public.leyes l WHERE l.id='${LAW_ID}';\n`;
  fs.writeFileSync(path.join(DIR, 'NOM-EM-009-ASEA-2026-carga.json'), `${JSON.stringify(payload,null,2)}\n`, 'utf8');
  fs.writeFileSync(path.join(DIR, 'NOM-EM-009-ASEA-2026-COTEJO.json'), `${JSON.stringify(check,null,2)}\n`, 'utf8');
  fs.writeFileSync(path.join(DIR, 'NOM-EM-009-ASEA-2026-aplicar.sql'), sql, 'utf8');
  fs.writeFileSync(path.join(DIR, 'ESTADO.md'), `# Incorporación: NOM-EM-009-ASEA-2026\n\nPublicada el 5 de octubre de 2026; entra en vigor el 6 de octubre y su vigencia es de seis meses conforme al transitorio Primero.\n\nFuente oficial: [SIDOF, nota 5800282](${SOURCE_URL}). [Edición matutina del DOF](${PDF_URL}).\n\nEl paquete conserva los numerales/subnumerales, ocho transitorios, apéndices A, B y C y sus tablas. El PDF no se almacena en el repositorio; el mapa de páginas se genera contra la edición oficial exacta.\n\nFragmentos preparados: ${articulos.length} (incluye una nota editorial). El cotejo exacto de texto/tablas determina si el paquete puede aplicarse.\n`, 'utf8');
  console.log(JSON.stringify({ lawId: LAW_ID, fragments: articulos.length, ordinary: count('ordinario'), transitories: count('transitorio'), appendices: count('anexo'), tables: doc.querySelectorAll('table').length, sourceParagraphs: sourceParagraphs.length, missingParagraphs: missingParagraphs.length, tableCells: tableCellTexts.length, missingCells: missingCells.length, alerts: check.alertas }, null, 2));
  if (check.alertas.length) process.exitCode = 1;
}

main();
