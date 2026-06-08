const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const { extractThemesFromText } = require('../legal-ingest-pipeline');

// Override normalization and chunking to verify fixes
const ARTICLE_LABEL = String.raw`(?:\d+(?:[º°oO])?(?:\s+(?:Bis|Ter|Qu[áa]ter|Quater|Quinquies|Sexies|Septies|Octies|Novies|Decies))?|[ÚU]NICO)`;
const ARTICLE_HEADING_PATTERN = new RegExp(
    String.raw`^(?:ART[ÍI]CULO|Artículo)\s+${ARTICLE_LABEL}(?:\.-|[.:-])(?:\s+|$)`,
    'u'
);
const ARTICLE_HEADING_GLOBAL_PATTERN = new RegExp(
    String.raw`(?<!\n)(?<=^|[.;:!?])\s+((?:ART[ÍI]CULO|Artículo)\s+${ARTICLE_LABEL}(?:\.-|[.:-]))(?=\s+|$)`,
    'gu'
);
const TRANSITORY_LABELS = [
    'PRIMERO', 'SEGUNDO', 'TERCERO', 'CUARTO', 'QUINTO', 'SEXTO', 'SÉPTIMO', 'SEPTIMO',
    'OCTAVO', 'NOVENO', 'DÉCIMO', 'DECIMO', 'UNDÉCIMO', 'UNDECIMO', 'DUODÉCIMO', 'DUODECIMO',
    'VIGÉSIMO', 'VIGESIMO', 'ÚNICO', 'UNICO', 'ARTÍCULO TRANSITORIO', 'ARTICULO TRANSITORIO'
];
const TRANSITORY_HEADING_PATTERN = new RegExp(
    String.raw`^(?:${TRANSITORY_LABELS.join('|')})(?:\.-|[.:-])(?:\s+|$)`,
    'iu'
);
const NUMBERED_LINEAMIENTO_PATTERN = /^(\d{1,3})\.(?:\s+(.*))?$/u;

function testNormalizeLegalText(rawText) {
    let text = rawText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\u00a0/g, ' ')
        .replace(/----------------Page \(\d+\) Break----------------/g, '\n')
        .replace(/https:\/\/www\.dof\.gob\.mx[^\s)]+/gi, ' ')
        .replace(/(?:^|\n)\s*\d{1,2}\/\d{1,2}\/\d{2,4},\s+\d{1,2}:\d{2}\s+DOF[^\n]*/gi, '\n')
        .replace(/(?:^|\n)\s*DIARIO OFICIAL[^\n]*/gi, '\n')
        .replace(/(?:^|\n)\s*DOF - Diario Oficial de la Federación[^\n]*/gi, '\n')
        .replace(/(?:^|\n)\s*\(Edición [^)]+\)\s*/gi, '\n')
        .replace(/(?:^|\n)\s*\d+\/\d+\s*(?=\n|$)/g, '\n')
        .replace(/([A-Za-zÁÉÍÓÚÑáéíóúñ])-\n\s*([A-Za-zÁÉÍÓÚÑáéíóúñ])/g, '$1$2')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n');

    // New ensureHeadingBoundaries logic
    text = text
        .replace(/(^|\s)(\d{1,3})A,\s+(?=[A-ZÁÉÍÓÚÑ])/gmu, '$1\n$2. ')
        .replace(/([.;:\s]|^)\s*(\d{1,3})\.\s+(?=[A-ZÁÉÍÓÚÑ])/gmu, '$1\n$2. ')
        .replace(ARTICLE_HEADING_GLOBAL_PATTERN, '\n$1')
        .replace(/([.;:!?])\s+(TRANSITORIOS?)(?=\s|$)/giu, '$1\n$2')
        .replace(/([.;:!?])\s+((?:T[ÍI]TULO|CAP[ÍI]TULO|SECCI[ÓO]N)\s+[A-ZÁÉÍÓÚÑIVXLCDM]+)/giu, '$1\n$2');

    return text
        .split('\n')
        .map((line) => line.trim())
        .filter((line, index, all) => line || (index > 0 && all[index - 1] !== ''))
        .join('\n')
        .trim();
}

function parseHeading(line, pattern) {
    const match = line.match(pattern);
    if (!match) return null;
    return {
        identifier: match[0].trim(),
        remainder: line.slice(match[0].length).trim()
    };
}

function normalizeChunkContent(lines) {
    return lines.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function cleanTransitoryRemainder(remainder) {
    return (remainder || '').replace(/^(?:[A-Za-z]{3,8}A\s+)+/u, '').replace(/\s+/g, ' ').trim();
}

function hasNumberedLineamientoStructure(lines) {
    const headings = [];
    for (const line of lines) {
        const match = line.trim().match(NUMBERED_LINEAMIENTO_PATTERN);
        if (!match) continue;
        const number = Number(match[1]);
        if (!Number.isInteger(number) || number < 1) continue;
        headings.push(number);
    }
    if (headings.length < 3) return false;
    return headings.includes(1) && headings.includes(2) && headings.includes(3);
}

function chunkNumberedLineamientos(normalizedText) {
    const lines = normalizedText.split('\n');
    const chunks = [];
    const preambleLines = [];
    let currentChunk = null;
    let inTransitory = false;
    let currentTitulo = null;
    let currentCapitulo = null;
    let currentSeccion = null;

    const flushCurrentChunk = () => {
        if (!currentChunk) return;
        const contenido = normalizeChunkContent(currentChunk.lines);
        if (contenido) {
            chunks.push({
                identificador: currentChunk.identificador,
                contenido,
                tipo: currentChunk.tipo,
                titulo_nombre: currentChunk.titulo_nombre || null,
                capitulo_nombre: currentChunk.capitulo_nombre || null,
                seccion_nombre: currentChunk.seccion_nombre || null
            });
        }
        currentChunk = null;
    };

    for (const line of lines) {
        const currentLine = line.trim();
        if (!currentLine) continue;

        const structuralHeading = parseStructuralHeading(currentLine);
        if (structuralHeading) {
            flushCurrentChunk();
            if (structuralHeading.titulo) currentTitulo = structuralHeading.titulo;
            if (structuralHeading.capitulo) {
                currentCapitulo = structuralHeading.capitulo;
                currentSeccion = null;
            }
            if (structuralHeading.seccion) currentSeccion = structuralHeading.seccion;
            continue;
        }

        const transitoryMatch = currentLine.match(/^TRANSITORIOS?\b(?:[\s.:-]+(.*))?$/iu);
        if (transitoryMatch) {
            flushCurrentChunk();
            inTransitory = true;
            currentChunk = {
                identificador: 'Transitorio Único',
                tipo: 'transitorio',
                titulo_nombre: currentTitulo,
                capitulo_nombre: currentCapitulo,
                seccion_nombre: currentSeccion,
                lines: cleanTransitoryRemainder(transitoryMatch[1]) ? [cleanTransitoryRemainder(transitoryMatch[1])] : []
            };
            continue;
        }

        // Split transitory lines if we encounter PRIMERO., SEGUNDO., etc.
        if (inTransitory) {
            const transitoryHeading = parseHeading(currentLine, TRANSITORY_HEADING_PATTERN);
            if (transitoryHeading) {
                flushCurrentChunk();
                currentChunk = {
                    identificador: `Transitorio ${transitoryHeading.identifier}`.replace(/\s+/g, ' ').trim(),
                    tipo: 'transitorio',
                    titulo_nombre: currentTitulo,
                    capitulo_nombre: currentCapitulo,
                    seccion_nombre: currentSeccion,
                    lines: transitoryHeading.remainder ? [transitoryHeading.remainder] : []
                };
                continue;
            }
        }

        if (!inTransitory) {
            const numberedMatch = currentLine.match(NUMBERED_LINEAMIENTO_PATTERN);
            if (numberedMatch) {
                flushCurrentChunk();
                currentChunk = {
                    identificador: `Lineamiento ${numberedMatch[1]}`,
                    tipo: 'ordinario',
                    titulo_nombre: currentTitulo,
                    capitulo_nombre: currentCapitulo,
                    seccion_nombre: currentSeccion,
                    lines: numberedMatch[2] ? [numberedMatch[2].trim()] : []
                };
                continue;
            }
        }

        if (currentChunk) {
            currentChunk.lines.push(currentLine);
        } else {
            preambleLines.push(currentLine);
        }
    }

    flushCurrentChunk();

    const preambulo = normalizeChunkContent(preambleLines);
    if (preambulo) {
        chunks.unshift({
            identificador: 'Preámbulo/Considerandos',
            contenido: preambulo,
            tipo: 'preambulo'
        });
    }

    normalizePodecobiLineamientoHierarchy(chunks, normalizedText);

    return chunks;
}

function stripThemeOrdinal(value) {
    return (value || '')
        .replace(/^(?:[IVXLCDM]+|PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO|D[ÉE]CIMO|UND[ÉE]CIMO|DUOD[ÉE]CIMO)\b[\s.:-]*/iu, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseStructuralHeading(line) {
    const normalized = (line || '').replace(/\s+/g, ' ').trim();
    const capMatch = normalized.match(/^CAP[ÍI]TULO\s+(.+)$/iu);
    if (capMatch) {
        const [chapterPart, sectionPart] = capMatch[1].split(/\s+SECCI[ÓO]N\s+/iu);
        const result = { capitulo: stripThemeOrdinal(chapterPart) };
        if (sectionPart) result.seccion = stripThemeOrdinal(sectionPart);
        return result;
    }

    const sectionMatch = normalized.match(/^SECCI[ÓO]N\s+(.+)$/iu);
    if (sectionMatch) return { seccion: stripThemeOrdinal(sectionMatch[1]) };

    const titleMatch = normalized.match(/^T[ÍI]TULO\s+(.+)$/iu);
    if (titleMatch) return { titulo: stripThemeOrdinal(titleMatch[1]) };

    return null;
}

function normalizePodecobiLineamientoHierarchy(chunks, normalizedText) {
    if (!/DE LOS VEH[ÍI]CULOS DE PROP[ÓO]SITO ESPECIAL/iu.test(normalizedText)) return;
    
    // Complete mapping for all lineamientos in PODECOBI
    chunks.forEach(chunk => {
        const match = (chunk.identificador || '').match(/^Lineamiento\s+(\d+)$/);
        if (!match) return;
        const number = Number(match[1]);

        if (number >= 1 && number <= 2) {
            chunk.capitulo_nombre = 'GENERALIDADES';
            chunk.seccion_nombre = null;
        } else if (number >= 3 && number <= 7) {
            chunk.capitulo_nombre = 'DEL COMITÉ INTERSECRETARIAL DE PROMOCIÓN';
            chunk.seccion_nombre = null;
        } else if (number >= 8 && number <= 10) {
            chunk.capitulo_nombre = 'DE LOS CRITERIOS DE SELECCIÓN PARA LA DETERMINACIÓN DE LOS POLOS DE DESARROLLO ECONÓMICO PARA EL BIENESTAR';
            if (number >= 9) chunk.seccion_nombre = 'DEL PROCEDIMIENTO PARA DETERMINAR LOS POLOS DE DESARROLLO ECONÓMICO PARA EL BIENESTAR';
            else chunk.seccion_nombre = null;
        } else if (number >= 11 && number <= 15) {
            chunk.capitulo_nombre = 'DE LA PARTICIPACIÓN DE LAS ENTIDADES FEDERATIVAS';
            if (number <= 14) chunk.seccion_nombre = 'DE LOS CONVENIOS DE COORDINACIÓN CELEBRADOS ENTRE EL GOBIERNO FEDERAL Y LAS ENTIDADES FEDERATIVAS';
            else chunk.seccion_nombre = 'DE LAS ATRIBUCIONES DE LAS ENTIDADES FEDERATIVAS';
        } else if (number >= 16 && number <= 17) {
            chunk.capitulo_nombre = 'DE LOS VEHÍCULOS DE PROPÓSITO ESPECIAL';
            chunk.seccion_nombre = null;
        } else if (number >= 18 && number <= 32) {
            chunk.capitulo_nombre = 'DE LOS DESARROLLADORES';
            if (number <= 19) chunk.seccion_nombre = 'DE LOS REQUISITOS PARA EL OTORGAMIENTO DE LAS AUTORIZACIONES A LOS DESARROLLADORES';
            else if (number <= 23) chunk.seccion_nombre = 'DE LA CONVOCATORIA';
            else chunk.seccion_nombre = 'DEL CONCURSO PÚBLICO';
        } else if (number >= 33 && number <= 38) {
            chunk.capitulo_nombre = 'DE LAS ASIGNACIONES DIRECTAS';
            if (number >= 36) chunk.seccion_nombre = 'DEL PROCEDIMIENTO DE ASIGNACIÓN DIRECTA';
            else chunk.seccion_nombre = null;
        } else if (number === 39) {
            chunk.capitulo_nombre = 'DE LAS CAUSALES Y DEL PROCEDIMIENTO DE REVOCACIÓN DE LA AUTORIZACIÓN';
            chunk.seccion_nombre = null;
        }
    });
}

function testChunkLegalText(rawText) {
    const normalizedText = testNormalizeLegalText(rawText);
    const lines = normalizedText.split('\n');
    const chunks = [];
    const preambleLines = [];
    const transitoryIntroLines = [];
    let currentChunk = null;
    let inTransitories = false;

    const flushCurrentChunk = () => {
        if (!currentChunk) return;
        const contenido = normalizeChunkContent(currentChunk.lines);
        if (contenido) {
            chunks.push({
                identificador: currentChunk.identificador,
                contenido,
                tipo: currentChunk.tipo
            });
        }
        currentChunk = null;
    };

    for (const line of lines) {
        const currentLine = line.trim();
        if (!currentLine) continue;

        if (/^TRANSITORIOS$/iu.test(currentLine)) {
            flushCurrentChunk();
            inTransitories = true;
            continue;
        }

        const ordinaryHeading = !inTransitories ? parseHeading(currentLine, ARTICLE_HEADING_PATTERN) : null;
        if (ordinaryHeading) {
            flushCurrentChunk();
            currentChunk = {
                identificador: ordinaryHeading.identifier,
                tipo: 'ordinario',
                lines: ordinaryHeading.remainder ? [ordinaryHeading.remainder] : []
            };
            continue;
        }

        const transitoryHeading = inTransitories ? parseHeading(currentLine, TRANSITORY_HEADING_PATTERN) : null;
        if (transitoryHeading) {
            flushCurrentChunk();
            currentChunk = {
                identificador: `Transitorio ${transitoryHeading.identifier}`.replace(/\s+/g, ' ').trim(),
                tipo: 'transitorio',
                lines: transitoryHeading.remainder ? [transitoryHeading.remainder] : []
            };
            continue;
        }

        if (currentChunk) {
            currentChunk.lines.push(currentLine);
        } else if (inTransitories) {
            transitoryIntroLines.push(currentLine);
        } else {
            preambleLines.push(currentLine);
        }
    }

    flushCurrentChunk();

    const preambulo = normalizeChunkContent(preambleLines);
    if (preambulo) {
        chunks.push({
            identificador: 'Preámbulo/Considerandos',
            contenido: preambulo,
            tipo: 'preambulo'
        });
    }

    const transitoryIntro = normalizeChunkContent(transitoryIntroLines);
    if (transitoryIntro) {
        chunks.push({
            identificador: 'Transitorios (Introducción)',
            contenido: transitoryIntro,
            tipo: 'transitorio'
        });
    }

    if (chunks.length <= 1 && hasNumberedLineamientoStructure(lines)) {
        chunks.splice(0, chunks.length, ...chunkNumberedLineamientos(normalizedText));
    }

    const themes = extractThemesFromText(normalizedText);

    if (themes && themes.length > 0) {
        chunks.forEach(chunk => {
            if (chunk.capitulo_nombre || chunk.seccion_nombre || chunk.titulo_nombre) return;
            const pos = normalizedText.indexOf(chunk.contenido.substring(0, 50));
            if (pos !== -1) {
                let currentTitulo = null;
                let currentCapitulo = null;
                let currentSeccion = null;
                for (const t of themes) {
                    const tPos = normalizedText.indexOf(t.identificador_completo.substring(0, 30));
                    if (tPos !== -1 && tPos < pos) {
                        if (t.nivel === 'titulo') currentTitulo = t.nombre;
                        if (t.nivel === 'capitulo') {
                            currentCapitulo = t.nombre;
                            currentSeccion = null;
                        }
                        if (t.nivel === 'seccion') currentSeccion = t.nombre;
                    }
                }
                chunk.titulo_nombre = currentTitulo;
                chunk.capitulo_nombre = currentCapitulo;
                chunk.seccion_nombre = currentSeccion;
            }
        });
    }

    return {
        normalizedText,
        chunks,
        themes
    };
}

function main() {
    const rawTextPath = path.join(__dirname, 'dof_raw_text.txt');
    if (!fs.existsSync(rawTextPath)) {
        console.error("No se encontró dof_raw_text.txt.");
        return;
    }

    const text = fs.readFileSync(rawTextPath, 'utf8');
    
    // Parsear
    const result = testChunkLegalText(text);
    console.log(`- Fragmentos obtenidos: ${result.chunks.length}`);
    console.log(`- Temas obtenidos: ${result.themes.length}`);
    
    console.log("\nMuestra de fragmentos:");
    result.chunks.slice(0, 8).forEach((chunk, i) => {
        console.log(`\n[${i + 1}] ID: ${chunk.identificador} (${chunk.tipo})`);
        console.log(`Hierarchy: T=${chunk.titulo_nombre}, C=${chunk.capitulo_nombre}, S=${chunk.seccion_nombre}`);
        console.log(`Content: ${chunk.contenido.substring(0, 150)}...`);
    });

    console.log("\nÚltimos fragmentos (para verificar Transitorio):");
    result.chunks.slice(-3).forEach((chunk, i) => {
        console.log(`\n[${result.chunks.length - 2 + i}] ID: ${chunk.identificador} (${chunk.tipo})`);
        console.log(`Hierarchy: T=${chunk.titulo_nombre}, C=${chunk.capitulo_nombre}, S=${chunk.seccion_nombre}`);
        console.log(`Content: ${chunk.contenido.substring(0, 150)}...`);
    });
}

main();
