const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const PDF2MD_INSTALL_HINT = [
    'No se encontró el binario pdf2md de pdf-inspector.',
    'Instálalo con:',
    '  npm run install:pdf2md',
    'o define la variable de entorno PDF2MD_BIN con la ruta completa al ejecutable.'
].join('\n');

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
    'PRIMERO',
    'SEGUNDO',
    'TERCERO',
    'CUARTO',
    'QUINTO',
    'SEXTO',
    'SÉPTIMO',
    'SEPTIMO',
    'OCTAVO',
    'NOVENO',
    'DÉCIMO',
    'DECIMO',
    'UNDÉCIMO',
    'UNDECIMO',
    'DUODÉCIMO',
    'DUODECIMO',
    'VIGÉSIMO',
    'VIGESIMO',
    'ÚNICO',
    'UNICO',
    'ARTÍCULO TRANSITORIO',
    'ARTICULO TRANSITORIO'
];
const TRANSITORY_HEADING_PATTERN = new RegExp(
    String.raw`^(?:${TRANSITORY_LABELS.join('|')})(?:\.-|[.:-])(?:\s+|$)`,
    'iu'
);
const TITLE_THEME_PATTERN = /^(T[ÍI]TULO)\s+(.+)$/iu;
const CHAPTER_THEME_PATTERN = /^(CAP[ÍI]TULO)\s+(.+)$/iu;
const SECTION_THEME_PATTERN = /^(SECCI[ÓO]N)\s+(.+)$/iu;
const ORDINAL_ONLY_PATTERN = /^(?:[IVXLCDM]+|PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO|D[ÉE]CIMO(?:\s+(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO))?|UND[ÉE]CIMO|DUOD[ÉE]CIMO|[ÚU]NICO|PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|S[ÉE]PTIMA|OCTAVA|NOVENA|D[ÉE]CIMA|UND[ÉE]CIMA|DUOD[ÉE]CIMA|[ÚU]NICA)$/iu;

function resolvePdf2mdBinary() {
    if (process.env.PDF2MD_BIN && fs.existsSync(process.env.PDF2MD_BIN)) {
        return process.env.PDF2MD_BIN;
    }

    const candidate = path.join(os.homedir(), '.cargo', 'bin', process.platform === 'win32' ? 'pdf2md.exe' : 'pdf2md');
    if (fs.existsSync(candidate)) {
        return candidate;
    }

    throw new Error(PDF2MD_INSTALL_HINT);
}

function runPdfToMarkdown(pdfPath) {
    if (!fs.existsSync(pdfPath)) {
        throw new Error(`El archivo PDF no existe: ${pdfPath}`);
    }

    const binary = resolvePdf2mdBinary();

    try {
        const stdout = execFileSync(binary, [pdfPath, '--json'], {
            encoding: 'utf8',
            maxBuffer: 64 * 1024 * 1024
        });
        const parsed = JSON.parse(stdout);
        if (!parsed.markdown) {
            throw new Error(`pdf2md no devolvió markdown para "${pdfPath}".`);
        }
        return parsed;
    } catch (error) {
        const stderr = error.stderr ? String(error.stderr).trim() : '';
        const stdout = error.stdout ? String(error.stdout).trim() : '';
        const detail = stderr || stdout || error.message;
        throw new Error(`No se pudo convertir el PDF con pdf2md: ${detail}`);
    }
}

function stripMarkdownLine(line) {
    let normalized = line.replace(/\r/g, '').trim();

    if (!normalized) return '';
    if (/^\|(?:\s*:?-+:?\s*\|)+$/.test(normalized)) return '';
    if (/^\[(https?:\/\/[^\]]+)\]\(\1\)(?:\s+\d+\/\d+)?$/i.test(normalized)) return '';
    if (/^https?:\/\/\S+$/i.test(normalized)) return '';
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4},\s+\d{1,2}:\d{2}\s+DOF/i.test(normalized)) return '';
    if (/^DIARIO OFICIAL\b/i.test(normalized)) return '';
    if (/^\(Edición [^)]+\)$/i.test(normalized)) return '';
    if (/^\d+\/\d+$/.test(normalized)) return '';
    if (/^DOF - Diario Oficial de la Federación$/i.test(normalized)) return '';

    if (/^\|.*\|$/.test(normalized)) {
        normalized = normalized
            .split('|')
            .map((cell) => cell.trim())
            .filter(Boolean)
            .join(' ');
    }

    normalized = normalized
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/gi, '$1')
        .replace(/^#{1,6}\s*/u, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/__(.*?)__/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\s+/g, ' ')
        .trim();

    if (!normalized) return '';
    if (/^https?:\/\/\S+$/i.test(normalized)) return '';
    if (/^dof\.gob\.mx/i.test(normalized)) return '';

    return normalized;
}

function normalizeMarkdownToText(markdown) {
    const lines = markdown
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map(stripMarkdownLine);

    return normalizeLegalText(lines.join('\n'));
}

function normalizeLegalText(rawText) {
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

    text = ensureHeadingBoundaries(text);

    return text
        .split('\n')
        .map((line) => line.trim())
        .filter((line, index, all) => line || (index > 0 && all[index - 1] !== ''))
        .join('\n')
        .trim();
}

function ensureHeadingBoundaries(text) {
    return text
        .replace(ARTICLE_HEADING_GLOBAL_PATTERN, '\n$1')
        .replace(/([.;:!?])\s+(TRANSITORIOS)(?=\s|$)/giu, '$1\n$2')
        .replace(/([.;:!?])\s+((?:T[ÍI]TULO|CAP[ÍI]TULO|SECCI[ÓO]N)\s+[A-ZÁÉÍÓÚÑIVXLCDM]+)/giu, '$1\n$2');
}

function parseHeading(line, pattern) {
    const match = line.match(pattern);
    if (!match) return null;

    const heading = match[0].trim();
    const remainder = line.slice(match[0].length).trim();

    return {
        identifier: heading,
        remainder
    };
}

function normalizeChunkContent(lines) {
    return lines
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function isThemeLine(line) {
    return TITLE_THEME_PATTERN.test(line) || CHAPTER_THEME_PATTERN.test(line) || SECTION_THEME_PATTERN.test(line);
}

function isArticleLine(line) {
    return ARTICLE_HEADING_PATTERN.test(line) || TRANSITORY_HEADING_PATTERN.test(line);
}

function getFollowingHeadingName(lines, startIndex) {
    const parts = [];

    for (let i = startIndex + 1; i < lines.length; i += 1) {
        const candidate = lines[i];
        if (!candidate) {
            if (parts.length > 0) break;
            continue;
        }
        if (isArticleLine(candidate) || isThemeLine(candidate) || /^TRANSITORIOS$/iu.test(candidate)) break;
        if (candidate.length > 180) break;

        parts.push(candidate);
        if (parts.length >= 2) break;
    }

    return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function extractThemesFromText(text) {
    const lines = text.split('\n').map((line) => line.trim());
    const themes = [];
    let order = 0;

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        if (!line) continue;

        const titleMatch = line.match(TITLE_THEME_PATTERN);
        if (titleMatch) {
            const inline = titleMatch[2].trim();
            const following = ORDINAL_ONLY_PATTERN.test(inline) ? getFollowingHeadingName(lines, index) : '';
            const nombre = (following || inline).replace(/\s+/g, ' ').trim();
            themes.push({
                nivel: 'titulo',
                nombre,
                identificador_completo: following ? `${line} ${following}` : line,
                orden: order++
            });
            continue;
        }

        const chapterMatch = line.match(CHAPTER_THEME_PATTERN);
        if (chapterMatch) {
            const inline = chapterMatch[2].trim();
            const following = ORDINAL_ONLY_PATTERN.test(inline) ? getFollowingHeadingName(lines, index) : '';
            const nombre = (following || inline).replace(/\s+/g, ' ').trim();
            themes.push({
                nivel: 'capitulo',
                nombre,
                identificador_completo: following ? `${line} ${following}` : line,
                orden: order++
            });
            continue;
        }

        const sectionMatch = line.match(SECTION_THEME_PATTERN);
        if (sectionMatch) {
            const inline = sectionMatch[2].trim();
            const following = ORDINAL_ONLY_PATTERN.test(inline) ? getFollowingHeadingName(lines, index) : '';
            const nombre = (following || inline).replace(/\s+/g, ' ').trim();
            themes.push({
                nivel: 'seccion',
                nombre,
                identificador_completo: following ? `${line} ${following}` : line,
                orden: order++
            });
        }
    }

    return themes;
}

function chunkLegalText(rawText) {
    const normalizedText = normalizeLegalText(rawText);
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
        chunks.unshift({
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

    const themes = extractThemesFromText(normalizedText);

    if (themes && themes.length > 0) {
        chunks.forEach(chunk => {
            const pos = normalizedText.indexOf(chunk.contenido.substring(0, 50));
            if (pos !== -1) {
                let currentTitulo = null;
                let currentCapitulo = null;
                for (const t of themes) {
                    const tPos = normalizedText.indexOf(t.identificador_completo.substring(0, 30));
                    if (tPos !== -1 && tPos < pos) {
                        if (t.nivel === 'titulo') currentTitulo = t.nombre;
                        if (t.nivel === 'capitulo') currentCapitulo = t.nombre;
                    }
                }
                chunk.titulo_nombre = currentTitulo;
                chunk.capitulo_nombre = currentCapitulo;
            }
        });
    }

    return {
        normalizedText,
        chunks,
        themes
    };
}

function extractLegalStructureFromMarkdown(markdown) {
    const normalizedText = normalizeMarkdownToText(markdown);
    const { chunks, themes } = chunkLegalText(normalizedText);
    return {
        normalizedText,
        chunks,
        themes
    };
}

function extractLegalStructureFromText(text) {
    return chunkLegalText(text);
}

function extractLegalStructureFromPdf(pdfPath) {
    const pdfResult = runPdfToMarkdown(pdfPath);
    const structure = extractLegalStructureFromMarkdown(pdfResult.markdown);

    return {
        ...structure,
        markdown: pdfResult.markdown,
        pdfMeta: {
            pdfType: pdfResult.pdf_type,
            pageCount: pdfResult.page_count,
            pagesNeedingOcr: pdfResult.pages_needing_ocr || [],
            isComplex: pdfResult.is_complex,
            pagesWithTables: pdfResult.pages_with_tables || [],
            pagesWithColumns: pdfResult.pages_with_columns || [],
            hasEncodingIssues: pdfResult.has_encoding_issues
        }
    };
}

function rebuildTextFromChunks(chunks) {
    return chunks
        .map((chunk) => [chunk.identificador, chunk.contenido].filter(Boolean).join('\n'))
        .join('\n\n');
}

module.exports = {
    extractLegalStructureFromMarkdown,
    extractLegalStructureFromPdf,
    extractLegalStructureFromText,
    extractThemesFromText,
    normalizeLegalText,
    normalizeMarkdownToText,
    rebuildTextFromChunks,
    resolvePdf2mdBinary,
    runPdfToMarkdown
};
