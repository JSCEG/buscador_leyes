// Parser del gestor: conserva el texto y expone límites dudosos para revisión.
// No asume que todo instrumento tiene artículos ni que toda cifra inicia uno.
const UNIT = '(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO)';
const ORDINAL = `(?:[ÚU]NICO|UND[ÉE]CIMO|DUOD[ÉE]CIMO|(?:D[ÉE]CIMO|VIG[ÉE]SIMO|TRIG[ÉE]SIMO|CUADRAG[ÉE]SIMO|QUINCUAG[ÉE]SIMO|SEXAG[ÉE]SIMO|SEPTUAG[ÉE]SIMO|OCTOG[ÉE]SIMO|NONAG[ÉE]SIMO)(?:\\s+${UNIT})?|${UNIT})`;
const LABEL = `(?:\\d+[º°o]?(?:\\s+(?:Bis|Ter|Qu[aá]ter|Quinquies|Sexies|Septies|Octies|Novies|Decies))?|${ORDINAL})`;
const ARTICLE = new RegExp(`^(ART[ÍI]CULO\\s+${LABEL})(?:(?:\\.\\s*[-–]?|[-:])(?:\\s+|$)(.*)|\\s*$)`, 'iu');
const ORDINAL_POINT = new RegExp(`^((?:ART[ÍI]CULO\\s+)?${ORDINAL}|ART[ÍI]CULO TRANSITORIO)(?:(?:\\.\\s*[-–]?|[-:])(?:\\s+|$)(.*)|\\s*$)`, 'iu');
const NUMBER = /^((?:\d+\.)+\d+|\d+(?=[.)\-:]))(?:\.(?=\s|$)|[)\-:])?(?:\s+(.*)|$)/u;
const STRUCTURE = /^(T[ÍI]TULO|CAP[ÍI]TULO|SECCI[ÓO]N|SUBT[ÍI]TULO)\s+(.+)$/iu;
const STRUCTURE_NUMBER = new RegExp(`^(${ORDINAL}|[IVXLCDM]+|\\d+|PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|[ÚU]NICA)(?:[.:-]?\\s+|$)(.*)$`, 'iu');
const TRANSITION = /^TRANSITORIOS?(?:\s*[.:-]\s*(.*))?$/iu;
const ANNEX = /^ANEXO(?:\s+(?:[IVXLCDM]+|\d+|[ÚU]NICO|[A-Z]))?(?:[.:-]\s*.*)?$/iu;
const norm = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export function parseRegulatoryText(input, { mode = 'auto' } = {}) {
    const normalizedText = String(input || '').replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ')
        .replace(/----------------Page \(\d+\) Break----------------/g, '\n')
        .replace(new RegExp(`([.;:!?]) +((?:ART[ÍI]CULO|Art[íi]culo)\\s+${LABEL}(?:\\.-|[.:-]))(?=\\s)`, 'gu'), '$1\n$2');
    const lines = normalizedText.split('\n');
    const articleCount = lines.filter(l => ARTICLE.test(l.trim())).length;
    const decimalCount = lines.filter(l => /^\d+\.\d/.test(l.trim())).length;
    const integerCount = lines.filter(l => /^\d+\.\s/.test(l.trim())).length;
    const ordinalCount = lines.filter(l => ORDINAL_POINT.test(l.trim())).length;
    const detectedMode = articleCount > 1 ? 'articles' : decimalCount >= 2 ? 'decimal'
        : integerCount >= 3 ? 'numbered' : articleCount ? 'articles' : ordinalCount ? 'ordinals' : 'text';
    const selectedMode = mode === 'auto' ? detectedMode : mode;
    const chunks = [], themes = [], notices = [];
    let current = null, title = null, chapter = null, section = null;
    let transitoryBlock = 0, inTransitory = false, complement = false, annex = null;
    let inIndex = false;
    const indexHeadings = new Set();
    const addNotice = (code, message) => { if (!notices.some(n => n.code === code)) notices.push({ code, message }); };
    const flush = () => {
        if (!current) return;
        current.contenido = current.lines.join('\n').trim();
        delete current.lines;
        // No se descartan silenciosamente encabezados ni textos cortos.
        chunks.push(current);
        current = null;
    };
    const start = (identifier, kind, lineIndex, text = '') => {
        flush();
        current = { identificador: identifier, tipo: kind, titulo_nombre: title,
            capitulo_nombre: chapter, seccion_nombre: section,
            bloque_transitorio: inTransitory ? transitoryBlock : null,
            fuente_linea_inicio: lineIndex + 1, fuente_linea_fin: lineIndex + 1,
            lines: text ? [text] : [] };
    };
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) { if (current) current.lines.push(''); continue; }
        if (/^(?:CONTENIDO|[ÍI]NDICE(?: GENERAL)?)$/iu.test(line)) {
            inIndex = true;
            start('Índice de la fuente', 'preambulo', i, line);
            continue;
        }
        if (inIndex) {
            const heading = line.match(STRUCTURE);
            const number = heading?.[2].match(STRUCTURE_NUMBER);
            const key = number ? norm(heading[1] + ' ' + number[1]) : null;
            // El índice se conserva como contexto; no genera capítulos duplicados.
            if ((key && indexHeadings.has(key)) || ARTICLE.test(line) || NUMBER.test(line)) {
                inIndex = false; flush();
            } else {
                if (key) indexHeadings.add(key);
                current.lines.push(line); current.fuente_linea_fin = i + 1;
                continue;
            }
        }
        if (/^(?:RESOLUTIVOS DE SENTENCIA|SENTENCIA dictada por|PUNTOS RESOLUTIVOS de la sentencia)/u.test(line)) {
            // El título corto y su subtítulo pertenecen al mismo documento.
            if (!(current?.identificador === 'RESOLUTIVOS DE SENTENCIA DE LA SCJN' && line.startsWith('PUNTOS RESOLUTIVOS'))) {
                inTransitory = false; complement = true; title = chapter = section = null;
                start(line, 'complementario', i, line);
                addNotice('complementos', 'Hay resoluciones o documentos complementarios. Revisa su inclusión por separado.');
                continue;
            }
        }
        if (!complement && /^(?:Ciudad de México, a \d+ de |En cumplimiento de lo dispuesto|Dado en |Dada en )/u.test(line)) {
            inTransitory = false; complement = true; title = chapter = section = null;
            start('Firmas y promulgación', 'complementario', i, line);
            continue;
        }
        if (complement) { current.lines.push(line); current.fuente_linea_fin = i + 1; continue; }
        if (/^ART[ÍI]CULO .+ Y ART[ÍI]CULO .+\.{2,}/u.test(line)) {
            inTransitory = false;
            start('Referencia a otros artículos del decreto', 'complementario', i, line);
            continue;
        }
        const transHeader = line.match(TRANSITION);
        if (transHeader) {
            flush(); inTransitory = true; transitoryBlock++;
            title = `Transitorios · bloque ${transitoryBlock}`; chapter = section = null;
            if (transHeader[1]) start(`Transitorios · bloque ${transitoryBlock}`, 'transitorio', i, transHeader[1]);
            continue;
        }
        if (ANNEX.test(line)) {
            inTransitory = false; annex = line; title = line; chapter = section = null;
            start(line, 'anexo', i, line);
            addNotice('anexos', 'Se detectaron anexos. Comprueba numeración, tablas y su relación con el texto principal.');
            continue;
        }
        const structural = line.match(STRUCTURE);
        const previousText = current?.lines.filter(l=>l.trim()).at(-1) || '';
        const continuesReference = /(?:\b(?:numeral(?:es)?|art[íi]culo(?:s)?|apartado(?:s)?)|\ben el)\s*$/iu.test(previousText);
        if (structural && !continuesReference) {
            const label = structural[1], suffix = structural[2];
            const number = suffix.match(STRUCTURE_NUMBER);
            if (number) {
                flush();
                if (norm(label) === 'titulo') inTransitory = false;
                let name = number[2];
                let next = i + 1;
                while (next < lines.length && !lines[next].trim()) next++;
                const candidate = lines[next]?.trim() || '';
                if (!name && candidate && !ARTICLE.test(candidate) && !STRUCTURE.test(candidate)
                    && !NUMBER.test(candidate) && !TRANSITION.test(candidate) && !ORDINAL_POINT.test(candidate)
                    && candidate.length < 240) {
                    name = candidate; i = next;
                    // Títulos largos partidos en dos líneas, seguidos por una disposición.
                    const continuation = lines[i+1]?.trim();
                    const after = lines[i+2]?.trim() || '';
                    if (continuation && !/[.;:]$/.test(name) && !ARTICLE.test(continuation)
                        && !NUMBER.test(continuation) && !STRUCTURE.test(continuation)
                        && (ARTICLE.test(after) || NUMBER.test(after) || STRUCTURE.test(after))) {
                        name += ' ' + continuation; i++;
                    }
                }
                const display = `${label} ${number[1]}${name ? ' — ' + name : ''}`;
                const level = norm(label) === 'titulo' ? 'titulo' : norm(label) === 'capitulo' ? 'capitulo' : 'seccion';
                if (level === 'titulo') { title = display; chapter = section = null; }
                if (level === 'capitulo') { chapter = display; section = null; }
                if (level === 'seccion') section = display;
                themes.push({ nivel: level, nombre: display, orden: themes.length, pos: i });
                continue;
            }
        }
        const art = line.match(ARTICLE), ord = line.match(ORDINAL_POINT), number = line.match(NUMBER);
        // Una lista 1., 2. dentro de «Primero» no es otro grupo de transitorios.
        const numericTransitory = number && (!current || /^Transitorio \d/.test(current.identificador));
        if (inTransitory && (ord || art || numericTransitory)) {
            const m = ord || art || number;
            start(`Transitorio ${m[1]}`, 'transitorio', i, m[2]);
            continue;
        }
        if (art) {
            const promulgatory = /^Se expide(?:n)?\b/i.test(art[2] || '');
            start(art[1], promulgatory ? 'preambulo' : 'ordinario', i, art[2]);
            if (promulgatory) addNotice('expedicion', 'El documento contiene una fórmula de expedición. Comprueba si incluye uno o varios instrumentos.');
            continue;
        }
        if (ord && selectedMode === 'ordinals') {
            start(`Disposición ${ord[1]}`, 'ordinario', i, ord[2]); continue;
        }
        if (!inTransitory && number && !continuesReference && (selectedMode === 'numbered' || selectedMode === 'decimal' || annex)) {
            const decimal = number[1].includes('.');
            // En modo numerales, los subnumerales quedan dentro de su numeral padre.
            if (selectedMode === 'decimal' || !decimal || annex) {
                start(`${annex ? annex + ' · ' : ''}Numeral ${number[1]}`, annex ? 'anexo' : 'ordinario', i, number[2]);
                continue;
            }
        }
        if (!current) start(inTransitory ? 'Transitorio sin numeración' : chunks.length ? `Texto de sección · ${themes.length}` : 'Preámbulo', inTransitory ? 'transitorio' : 'preambulo', i);
        current.lines.push(line); current.fuente_linea_fin = i + 1;
    }
    flush();
    if (transitoryBlock > 1) {
        for (const chunk of chunks) if (chunk.bloque_transitorio) chunk.identificador += ` · bloque ${chunk.bloque_transitorio}`;
        addNotice('transitorios_multiples', 'Hay varios bloques de transitorios. No se han fusionado; verifica a qué instrumento pertenece cada bloque.');
    }
    if (selectedMode === 'text') addNotice('estructura_no_reconocida', 'No se reconoció una numeración suficiente. Revisa el texto y elige otra estructura antes de cargar.');
    if (articleCount > 1 && decimalCount > 1) addNotice('estructura_mixta', 'Conviven artículos y numeración decimal. Se conservaron los numerales dentro de los artículos; revisa si son disposiciones independientes.');
    return { chunks, themes, normalizedText, detectedMode, selectedMode, notices,
        diagnostics: validateRegulatoryChunks(chunks, notices) };
}

export function validateRegulatoryChunks(chunks, notices = []) {
    const issues = [...notices];
    if (!chunks.length) issues.push({ code: 'sin_texto', blocking: true, message: 'No se extrajo texto. El documento puede requerir OCR.' });
    const seen = new Set();
    let prev = null;
    for (const c of chunks) {
        if (!c.identificador.trim() || !c.contenido.trim()) issues.push({ code: 'vacio', blocking: true, message: `Fragmento sin identificador o contenido: ${c.identificador || '(sin nombre)'}.` });
        const identity = norm(c.identificador).replace(/[.:-]/g, '').replace(/\s+/g, ' ').trim();
        if (seen.has(identity)) issues.push({ code: 'duplicado', blocking: true, message: `Identificador repetido: ${c.identificador}. Puede haber varios instrumentos o numeraciones reiniciadas.` });
        seen.add(identity);
        const m = c.tipo === 'ordinario' && c.identificador.match(/^Art[íi]culo (\d+)$/i);
        if (m) {
            const n = Number(m[1]);
            if (prev !== null && n !== prev + 1) issues.push({ code: 'secuencia', message: `Revisa el salto o reinicio de artículos: ${prev} → ${n}.` });
            prev = n;
        }
        if (c.contenido.length > 20000) issues.push({ code: 'extenso', message: `${c.identificador} contiene más de 20,000 caracteres; comprueba sus límites.` });
    }
    return issues;
}

// pdf.js entrega fragmentos fuera del orden visual y coordenadas desde abajo.
export function reconstructPdfPages(pages) {
    const marginFrequency = new Map();
    const formatted = pages.map(({ items, height }) => {
        const rows = [];
        for (const item of [...items].filter(x => x.str?.trim()).sort((a,b) => b.transform[5]-a.transform[5] || a.transform[4]-b.transform[4])) {
            const y = item.transform[5];
            let row = rows[rows.length-1];
            if (!row || Math.abs(row.y-y)>2) { row={y,items:[]}; rows.push(row); }
            row.items.push(item);
        }
        const result = rows.map(row => {
            const ordered = row.items.sort((a,b)=>a.transform[4]-b.transform[4]);
            let text = '', previous = null;
            for (const item of ordered) {
                // PDF.js puede separar una palabra o un número en varios objetos.
                // Insertar un espacio entre TODOS ellos convierte «11» en «1 1».
                const gap = previous ? item.transform[4] - (previous.transform[4] + (previous.width || 0)) : 0;
                const fontSize = Math.abs(item.transform[3]) || item.height || 10;
                const separated = previous && (previous.width == null || gap > fontSize * .15);
                if (separated && !/\s$/.test(text) && !/^\s/.test(item.str)) text += ' ';
                text += item.str;
                previous = item;
            }
            return { text:text.replace(/[^\S\t]+/g,' ').trim(), margin:row.y>height*.90 || row.y<height*.07 };
        });
        for (const value of new Set(result.filter(r=>r.margin).map(r=>r.text))) marginFrequency.set(value,(marginFrequency.get(value)||0)+1);
        return result;
    });
    const emptyPages = [];
    const text = formatted.map((rows,i) => {
        const keep = rows.filter(r=>!(r.margin && (/^(?:https?:\/\/\S+\s+)?\d+\s*(?:de|\/)\s*\d+$/i.test(r.text) || pages.length>1 && marginFrequency.get(r.text)>=Math.max(2,Math.ceil(pages.length*.6)))));
        if (!keep.length) emptyPages.push(i+1);
        return keep.map(r=>r.text).join('\n');
    }).join('\n\n');
    return { text, emptyPages };
}
