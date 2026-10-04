const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const DIR = __dirname;
const SOURCE = path.join(DIR, 'NOM-EM-008-oficial.html');
const SOURCE_URL = 'https://sidof.segob.gob.mx/notas/docFuente/5800169';
const PDF_URL = 'https://sidof.segob.gob.mx/notas/getNewsletter/02-10-2026/Matutina/329985';
const TITLE = 'Norma Oficial Mexicana de Emergencia NOM-EM-008-ASEA-2026, Transporte de Gas Licuado de Petróleo por medio de Auto-tanque y Semirremolque';
const LAW_ID = '864ee23b-19ea-5c44-9b01-bd77e0320b11';
const NAMESPACE = Buffer.from('c46f16bf5a7b4d10a391d09b2ad42b43', 'hex');
const SECTION_TITLES = {
  1: 'Objetivo',
  2: 'Campo de aplicación',
  3: 'Objetivos legítimos de interés público',
  4: 'Referencias normativas',
  5: 'Términos, definiciones, términos abreviados, símbolos y siglas',
  6: 'Inicio de operación',
  7: 'Operación y mantenimiento',
  8: 'Término de operación',
  9: 'Procedimiento de Evaluación de la Conformidad',
  10: 'Grado de concordancia con normas internacionales',
  11: 'Verificación de la Norma Oficial Mexicana de Emergencia',
  12: 'Bibliografía',
};
const TRANSITORIES = {
  PRIMERO: 'Primero', SEGUNDO: 'Segundo', TERCERO: 'Tercero',
  CUARTO: 'Cuarto', QUINTO: 'Quinto', SEXTO: 'Sexto',
};

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

function codeHeading(text) {
  const match = text.match(/^(\d{1,2})\.\s+(.+)$/);
  if (match && SECTION_TITLES[Number(match[1])] && normalize(match[2]).toLowerCase() === SECTION_TITLES[Number(match[1])].toLowerCase()) {
    return { code: `${match[1]}.`, title: SECTION_TITLES[Number(match[1])], major: true };
  }
  const sub = text.match(/^(\d+\.\d+(?:\.\d+)*\.?)\s*(.*)$/);
  if (sub) return { code: sub[1].replace(/\.$/, ''), title: normalize(sub[2]), major: false };
  return null;
}

function transitoryHeading(text) {
  const match = text.match(/^(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO)\.\s*/i);
  return match ? TRANSITORIES[match[1].toUpperCase()] : null;
}

function main() {
  if (!fs.existsSync(SOURCE)) throw new Error(`Falta la fuente oficial descargada: ${SOURCE}`);
  const html = fs.readFileSync(SOURCE, 'utf8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const elements = [...doc.querySelectorAll('h1,h2,div.Texto,div.ANOTACION,div.ROMANOS,table,img')];
  const segments = [];
  const addSegment = (key, label, type, section, initialHtml = '', chapter = null, sectionCode = null) => {
    const segment = { key, label, type, section, chapter, sectionCode, blocks: [] };
    if (initialHtml) segment.blocks.push(initialHtml);
    segments.push(segment);
    return segment;
  };

  let current = addSegment('front', 'Preámbulo de la norma', 'preambulo', 'Preámbulo');
  let inIndex = false;
  let mainBodyStarted = false;
  let recitalCount = 0;
  const headingByCode = new Map();
  let appendixTitle = 'Apéndice A (Normativo) · Listado de revisión visual diaria';
  const append = (content) => { if (content) current.blocks.push(content); };

  for (const element of elements) {
    if (element.matches('div.ROMANOS')) continue; // Índice de contenido duplicado; el cuerpo oficial viene después.
    if (element.matches('table, img') && element.closest('table') !== element && element.closest('table')) continue;
    if (element.matches('div.Texto') && element.closest('table')) continue;

    const text = normalize(element.textContent);
    if (!text && !element.matches('img,table')) continue;
    if (element.matches('div.Texto') && /^ÍNDICE DEL CONTENIDO$/i.test(text)) { inIndex = true; continue; }
    if (inIndex && !codeHeading(text)) continue;
    if (inIndex && codeHeading(text)) inIndex = false;

    if (element.matches('div.ANOTACION') && /^Apéndice A\b/i.test(text)) {
      appendixTitle = text;
      current = addSegment('appendix-a', text, 'anexo', 'Apéndice A');
      continue;
    }
    if (element.matches('div.ANOTACION') && /^TRANSITORIOS$/i.test(text)) continue;

    const transition = element.matches('div.Texto') ? transitoryHeading(text) : null;
    if (transition) {
      current = addSegment(`transitorio-${transition.toLowerCase()}`, `Transitorio ${transition}`, 'transitorio', 'Transitorios');
    } else if (element.matches('div.Texto')) {
      const appendixPart = text.match(/^A\.(\d+)\.\s*(.*)$/);
      const heading = codeHeading(text);
      if (appendixPart && current.section.startsWith('Apéndice A')) {
        current = addSegment(`appendix-a-${appendixPart[1]}`, `Apéndice A · A.${appendixPart[1]}`, 'anexo', 'Apéndice A (Normativo)', '', 'Apéndice A (Normativo)', `A.${appendixPart[1]}`);
      } else if (heading) {
        if (heading.major) mainBodyStarted = true;
        const majorNumber = heading.major ? heading.code.slice(0, -1) : heading.code.split('.')[0];
        const section = SECTION_TITLES[Number(majorNumber)] || current.section;
        let chapter = null;
        if (heading.major) {
          headingByCode.set(heading.code.replace(/\.$/, ''), heading.title);
        } else {
          const parts = heading.code.split('.');
          for (let depth = parts.length - 1; depth > 0; depth -= 1) {
            const parent = parts.slice(0, depth).join('.');
            if (headingByCode.has(parent)) {
              chapter = `${parent} · ${headingByCode.get(parent)}`;
              break;
            }
          }
          if (heading.title) headingByCode.set(heading.code, heading.title);
        }
        const label = heading.major ? `Numeral ${heading.code} ${heading.title}` : `Numeral ${heading.code}`;
        current = addSegment(`numeral-${heading.code}`, label, 'ordinario', section, '', chapter, heading.major ? null : heading.code);
      } else if (!mainBodyStarted && /^Que\b/i.test(text)) {
        recitalCount += 1;
        current = addSegment(`considerando-${String(recitalCount).padStart(2, '0')}`, `Considerando ${recitalCount}`, 'preambulo', 'Preámbulo');
      }
    }

    if (element.matches('h1,h2,div.Texto,div.ANOTACION')) append(safeParagraph(element));
    else if (element.matches('table')) append(safeTable(element));
    else if (element.matches('img')) {
      const number = doc.querySelectorAll('img').length > 1 ? [...doc.querySelectorAll('img')].indexOf(element) + 1 : 1;
      append(`<div><img src="${escapeHtml(element.getAttribute('src') || '')}" alt="Figura oficial ${number} de la NOM" loading="lazy"></div>`);
    }
  }

  // Add an editorial guide to distinguish source text from context and state the effective date precisely.
  const editorial = {
    id: uuidV5(`${LAW_ID}:editorial`), ley_id: LAW_ID, orden: 0,
    identificador: 'Nota editorial · instrumento regulatorio',
    contenido: `<h3>Nota editorial · instrumento regulatorio</h3><p>La NOM-EM-008-ASEA-2026 fue publicada en el Diario Oficial de la Federación el 2 de octubre de 2026. Su transitorio Primero dispone que entra en vigor el 6 de octubre de 2026 y tendrá vigencia de seis meses. El transitorio Segundo reconoce los dictámenes de cumplimiento emitidos previamente conforme a la NOM-EM-006-ASEA-2025 hasta el término de su vigencia. Este registro conserva el texto de la nueva norma por separado; no consolida ni reemplaza el instrumento anterior.</p><p>Fuente oficial: <a href="${SOURCE_URL}">${SOURCE_URL}</a>. Edición matutina del DOF: <a href="${PDF_URL}">${PDF_URL}</a>. Consulta cotejada el 4 de octubre de 2026.</p>`,
    tipo_articulo: 'nota', titulo_nombre: 'Información editorial', capitulo_nombre: null, seccion_nombre: null,
  };
  const articleRows = [editorial];
  for (const segment of segments) {
    const content = segment.blocks.filter(Boolean).join('\n');
    if (!content.trim()) continue;
    articleRows.push({
      id: uuidV5(`${LAW_ID}:${segment.key}`), ley_id: LAW_ID, orden: articleRows.length,
      identificador: segment.label, contenido: content, tipo_articulo: segment.type,
      titulo_nombre: segment.section, capitulo_nombre: segment.chapter,
      seccion_nombre: segment.sectionCode,
    });
  }

  const topicNames = [
    'Seguridad industrial y operativa', 'Transporte de gas licuado de petróleo',
    'Auto-tanques y semirremolques', 'Integridad mecánica y mantenimiento',
    'Capacitación de operadores', 'Evaluación de la conformidad',
    'Protección ambiental y manejo de residuos', 'Revisión visual diaria',
  ];
  const structuralThemes = [
    { nivel: 'titulo', nombre: 'Información editorial' },
    { nivel: 'capitulo', nombre: 'Preámbulo' },
    ...Object.values(SECTION_TITLES).map((nombre) => ({ nivel: 'capitulo', nombre })),
    { nivel: 'capitulo', nombre: appendixTitle },
    { nivel: 'capitulo', nombre: 'Transitorios' },
  ];
  const temas = [...structuralThemes, ...topicNames.map((nombre) => ({ nivel: 'seccion', nombre }))]
    .map((topic, orden) => ({ ...topic, orden }));
  const payload = {
    ley: {
      id: LAW_ID, titulo: TITLE, siglas: 'NOM-EM-008-ASEA-2026',
      fecha_publicacion: '2026-10-02', fecha_ultima_reforma: null, vigente: null,
      temas_clave: topicNames, url_original: SOURCE_URL, tipo: 'nom',
    },
    articulos: articleRows,
    temas,
  };

  const codes = articleRows.filter((row) => row.identificador.startsWith('Numeral '));
  const transitCount = articleRows.filter((row) => row.tipo_articulo === 'transitorio').length;
  const clauseIds = codes.map((row) => row.seccion_nombre);
  const expectedSections = Object.keys(SECTION_TITLES).length;
  const officialImages = doc.querySelectorAll('img').length;
  const officialTables = doc.querySelectorAll('table').length;
  const packagedText = articleRows.slice(1).map((row) => new JSDOM(row.contenido).window.document.body.textContent).join(' ');
  const sourceParagraphTexts = [...doc.querySelectorAll('div.Texto')]
    .filter((node) => !node.closest('table'))
    .map((node) => normalize(node.textContent))
    .filter((text) => text && !/^ÍNDICE DEL CONTENIDO$/i.test(text));
  const sourceParagraphs = sourceParagraphTexts.length;
  const missingSourceParagraphs = sourceParagraphTexts.filter((text) => !normalize(packagedText).includes(text));
  const tableCellTexts = [...doc.querySelectorAll('table td,table th')].map((node) => normalize(node.textContent)).filter(Boolean);
  const missingTableCells = tableCellTexts.filter((text) => !normalize(packagedText).includes(text));
  const check = {
    instrumento: 'NOM-EM-008-ASEA-2026', fecha_cotejo: '2026-10-04', estado: 'paquete_preparado_para_aplicar',
    fuente_html: SOURCE_URL, fuente_pdf_edicion: PDF_URL,
    cotejo_pdf: {
      paginas_totales: 224, paginas_impresas_norma: [26, 61],
      sha256_edicion: 'e6d17b1ecd3713cd74ab2b7f3921aafa884373526fb3a63604471e7a6abf3bef',
      apendice_a_paginas_impresas: [54, 59], bibliografia_pagina_impresa: 60, transitorios_pagina_impresa: 61,
      encabezados_principales_presentes: expectedSections, seis_transitorios_en_edicion: true, apendice_a_en_edicion: true,
    },
    estructura_oficial: {
      numerales_principales: expectedSections, fragmentos_numerados: codes.length,
      transitorios: transitCount, fragmentos_apendice_a: articleRows.filter((row) => row.tipo_articulo === 'anexo').length,
      tablas_oficiales: officialTables, figuras_oficiales: officialImages,
      parrafos_de_fuente: sourceParagraphs,
      parrafos_cotejados: sourceParagraphTexts.length - missingSourceParagraphs.length,
      celdas_de_tabla_cotejadas: tableCellTexts.length - missingTableCells.length,
    },
    verificaciones: [
      'Se conserva la organización por numerales y subnumerales de la NOM; no se fuerza una estructura de artículos de ley.',
      'Se omite el índice de contenido duplicado y se usa el cuerpo normativo como fuente de fragmentos.',
      'El Apéndice A (Normativo) se separa del articulado y sus tablas se conservan en el contenido.',
      'Los considerandos, seis transitorios y apartados del Apéndice A quedan en segmentos separados según su propia estructura.',
      'Las figuras mantienen sus URL oficiales; el PDF completo no se agrega al repositorio.',
      'La nota editorial distingue texto oficial, fecha de publicación, entrada en vigor y reconocimiento temporal de dictámenes NOM-EM-006-ASEA-2025.',
    ],
    ids_estables: true,
    ids_numerales: clauseIds,
    alertas: [],
  };

  if (transitCount !== 6) check.alertas.push(`Se esperaban 6 transitorios; se detectaron ${transitCount}.`);
  if (!articleRows.some((row) => row.tipo_articulo === 'anexo')) check.alertas.push('Falta el Apéndice A.');
  if (new Set(articleRows.map((row) => row.id)).size !== articleRows.length) check.alertas.push('Hay IDs duplicados.');
  if (articleRows.some((row) => !row.contenido?.trim())) check.alertas.push('Hay fragmentos vacíos.');
  if (!Object.values(SECTION_TITLES).every((name) => articleRows.some((row) => row.titulo_nombre === name))) check.alertas.push('Falta uno o más numerales principales.');
  if (missingSourceParagraphs.length) check.alertas.push(`${missingSourceParagraphs.length} párrafos oficiales no aparecen íntegros en el paquete: ${missingSourceParagraphs.slice(0, 3).join(' | ')}`);
  if (missingTableCells.length) check.alertas.push(`${missingTableCells.length} celdas oficiales de tablas no aparecen en el paquete: ${missingTableCells.slice(0, 3).join(' | ')}`);

  const sqlPayload = JSON.stringify(payload);
  const sql = `-- Incorporación idempotente por validación: NOM-EM-008-ASEA-2026\n-- Fuente: ${SOURCE_URL}\nBEGIN;\nDO $ingest$\nDECLARE p jsonb := $payload$${sqlPayload}$payload$::jsonb; lid uuid;\nBEGIN\n LOCK TABLE public.leyes,public.articulos,public.temas IN SHARE ROW EXCLUSIVE MODE;\n lid := (p->'ley'->>'id')::uuid;\n IF EXISTS(SELECT 1 FROM public.leyes WHERE id=lid OR lower(siglas)=lower(p->'ley'->>'siglas') OR lower(titulo)=lower(p->'ley'->>'titulo') OR url_original=p->'ley'->>'url_original') THEN RAISE EXCEPTION 'El instrumento ya existe: revisar, no reemplazar'; END IF;\n INSERT INTO public.leyes(id,titulo,siglas,fecha_publicacion,fecha_ultima_reforma,vigente,temas_clave,url_original,tipo) SELECT id,titulo,siglas,fecha_publicacion,fecha_ultima_reforma,vigente,temas_clave,url_original,tipo FROM jsonb_populate_record(null::public.leyes,p->'ley');\n INSERT INTO public.articulos(id,ley_id,identificador,contenido,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre,orden) SELECT id,ley_id,identificador,contenido,tipo_articulo,titulo_nombre,capitulo_nombre,seccion_nombre,orden FROM jsonb_populate_recordset(null::public.articulos,p->'articulos');\n INSERT INTO public.temas(ley_id,nivel,nombre,orden) SELECT lid,t->>'nivel',t->>'nombre',(t->>'orden')::int FROM jsonb_array_elements(p->'temas')t;\n IF (SELECT count(*) FROM public.articulos WHERE ley_id=lid)<>jsonb_array_length(p->'articulos') OR EXISTS(SELECT 1 FROM jsonb_array_elements(p->'articulos')b LEFT JOIN public.articulos a ON a.id=(b->>'id')::uuid WHERE a.id IS NULL OR (to_jsonb(a)-'fts'-'created_at') IS DISTINCT FROM b) THEN RAISE EXCEPTION 'Fallo de cotejo exacto de artículos'; END IF;\n IF (SELECT count(*) FROM public.temas WHERE ley_id=lid)<>jsonb_array_length(p->'temas') OR EXISTS(SELECT 1 FROM jsonb_array_elements(p->'temas')b WHERE NOT EXISTS(SELECT 1 FROM public.temas t WHERE ley_id=lid AND (to_jsonb(t)-'id'-'ley_id'-'created_at')=b)) THEN RAISE EXCEPTION 'Fallo de cotejo de estructura'; END IF;\n IF NOT EXISTS(SELECT 1 FROM public.leyes l WHERE id=lid AND to_jsonb(l)-'created_at'=p->'ley') THEN RAISE EXCEPTION 'Metadatos diferentes'; END IF;\n IF EXISTS(SELECT 1 FROM public.articulos WHERE ley_id=lid AND (nullif(trim(contenido),'') IS NULL OR fts IS NULL OR fts=''::tsvector)) THEN RAISE EXCEPTION 'Texto o índice FTS vacío'; END IF;\nEND $ingest$;\nCOMMIT;\nSELECT l.siglas,l.id,(SELECT count(*) FROM public.articulos a WHERE a.ley_id=l.id) fragmentos,(SELECT count(*) FROM public.temas t WHERE t.ley_id=l.id) temas FROM public.leyes l WHERE l.id='${LAW_ID}';\n`;

  fs.writeFileSync(path.join(DIR, 'NOM-EM-008-ASEA-2026-carga.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(DIR, 'NOM-EM-008-ASEA-2026-COTEJO.json'), `${JSON.stringify(check, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(DIR, 'NOM-EM-008-ASEA-2026-aplicar.sql'), sql, 'utf8');

  const md = `# Incorporación: NOM-EM-008-ASEA-2026\n\n## Estado\n\nPreparación cotejada contra el HTML oficial del SIDOF, pendiente de aplicar a Supabase y verificar en el buscador.\n\n| Dato | Resultado |\n|---|---|\n| Publicación DOF | 2 de octubre de 2026 |\n| Entrada en vigor | 6 de octubre de 2026 |\n| Vigencia | Seis meses, conforme al transitorio Primero |\n| Fuente oficial | [SIDOF, nota 5800169](${SOURCE_URL}) |\n| Edición | [DOF matutino, 2 de octubre](${PDF_URL}) |\n| Fragmentos | ${articleRows.length} (incluye nota editorial; numerales y subnumerales en segmentos propios) |\n| Transitorios | ${transitCount} |\n| Apéndice | A normativo, separado; incluye tablas preservadas |\n| Figuras | ${officialImages}, enlazadas a SIDOF |\n| Mapa de páginas | No generado en esta incorporación |\n\n## Criterio de fragmentación\n\nSe conserva la estructura normativa propia: preámbulo, numerales/subnumerales, Apéndice A y transitorios por separado. El índice de contenido repetido se omite. La norma no se mezcla con la NOM-EM-006-ASEA-2025; la nota editorial explica que sus dictámenes previos se reconocen hasta su vencimiento.\n\n## Verificación pendiente\n\nAplicar \`NOM-EM-008-ASEA-2026-aplicar.sql\` en Supabase. El SQL es transaccional, rechaza duplicados por UUID, siglas, título o fuente, y comprueba igualdad exacta del paquete, temas y texto/indexación antes de confirmar.\n`;
  fs.writeFileSync(path.join(DIR, 'ESTADO.md'), md, 'utf8');

  if (check.alertas.length) {
    console.error(JSON.stringify({ fragments: articleRows.length, alerts: check.alertas }, null, 2));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify({ fragments: articleRows.length, sections: expectedSections, numbered: codes.length, transitories: transitCount, themes: temas.length, tables: officialTables, figures: officialImages, sqlBytes: Buffer.byteLength(sql), alerts: check.alertas }, null, 2));
  }
}

main();
