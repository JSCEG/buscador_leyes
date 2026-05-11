import { supabase } from '../lib/supabase.js';

let importedFile = null;
let parsedChunks = [];
let parsedThemes = [];

export function initAdminIngest() {
    console.log("Admin Ingest Module initialized.");

    const dropzone = document.getElementById('admin-dropzone');
    const fileInput = document.getElementById('admin-file-input');
    const btnParse = document.getElementById('admin-btn-parse');
    const btnIngest = document.getElementById('admin-btn-ingest');

    if (!dropzone) return;

    // UI Events for Drag and Drop
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('border-amber-500', 'bg-amber-50/30');
    });

    dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-amber-500', 'bg-amber-50/30');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-amber-500', 'bg-amber-50/30');
        if (e.dataTransfer.files.length) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelection(e.target.files[0]);
        }
    });

    btnParse.addEventListener('click', handleParseFile);
    btnIngest.addEventListener('click', handleIngestToSupabase);
}

function handleFileSelection(file) {
    if (file.type !== 'application/pdf') {
        alert("Por favor selecciona un archivo PDF.");
        return;
    }
    importedFile = file;
    document.getElementById('admin-file-name').textContent = `📄 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    document.getElementById('admin-file-name').classList.remove('hidden');
    document.getElementById('admin-btn-parse').disabled = false;
    
    // Hide preview if re-uploading
    document.getElementById('admin-preview-area').classList.add('hidden');
    parsedChunks = [];
}

// === ALGORITMO ANTI-DUPLICADOS (Levenshtein y cruces) ===
function levenshteinDistance(a, b) {
    const matrix = [];
    const validate = a.toLowerCase();
    const compare = b.toLowerCase();

    for (let i = 0; i <= compare.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= validate.length; j++) { matrix[0][j] = j; }

    for (let i = 1; i <= compare.length; i++) {
        for (let j = 1; j <= validate.length; j++) {
            if (compare.charAt(i - 1) == validate.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[compare.length][validate.length];
}

function calculateSimilarity(str1, str2) {
    const distance = levenshteinDistance(str1, str2);
    const m = Math.max(str1.length, str2.length);
    if (m === 0) return 100;
    return ((m - distance) / m) * 100;
}

function displayAlert(type, title, message) {
    const box = document.getElementById('admin-alert-box');
    box.className = `mb-6 p-4 rounded-xl border flex items-start gap-3 text-sm text-left animate-fade-in-up ${
        type === 'error' ? 'bg-red-50 border-red-200 text-red-800' :
        type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
        'bg-green-50 border-green-200 text-green-800'
    }`;
    box.innerHTML = `
        <div class="mt-0.5">
            ${type === 'error' ? '<svg class="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>' :
             type === 'warning' ? '<svg class="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>' :
             '<svg class="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>'}
        </div>
        <div>
            <span class="font-bold block">${title}</span>
            <span class="opacity-90 block mt-1 leading-relaxed">${message}</span>
        </div>
    `;
    box.classList.remove('hidden');
}

async function handleParseFile() {
    const titleInput = document.getElementById('admin-input-title').value.trim();
    const siglasInput = document.getElementById('admin-input-siglas').value.trim();

    if (!titleInput) {
        displayAlert('error', 'Falta el título', 'Por favor ingresa el título normativo de la Ley o Reglamento.');
        return;
    }

    if (!importedFile) return;

    // 1. DUPLICATE CHECK
    try {
        const { data: leyes } = await supabase.from('leyes').select('titulo, siglas');
        
        let possibleDuplicate = false;
        let dupReason = '';

        for (const ley of (leyes || [])) {
            if (siglasInput && ley.siglas && siglasInput.toLowerCase() === ley.siglas.toLowerCase()) {
                possibleDuplicate = true;
                dupReason = `Las siglas ingresadas ("${siglasInput}") ya existen en la base de datos vinculadas a "${ley.titulo}".`;
                break;
            }
            const sim = calculateSimilarity(titleInput, ley.titulo);
            if (sim > 82) { // 82% similarity threshold
                possibleDuplicate = true;
                dupReason = `El título que quieres subir tiene un ${sim.toFixed(1)}% de similitud de texto con una ley ya existente: "${ley.titulo}". Podría ser la misma ley con un error de dedo.`;
                break;
            }
        }

        if (possibleDuplicate) {
            displayAlert('error', '¡Alto! Posible Ley Duplicada Detectada', dupReason + '<br><br><b>La ingesta ha sido bloqueada.</b> Verifica que no estés subiendo una ley existente.');
            return;
        }

        document.getElementById('admin-alert-box').classList.add('hidden');

    } catch(e) {
        console.error("Error Checking Duplicates", e);
    }

    // 2. PARSE PDF
    document.getElementById('admin-btn-parse').disabled = true;
    document.getElementById('admin-loading-spinner').classList.remove('hidden');

    try {
        const textContent = await extractTextFromPDF(importedFile);
        parsedThemes = extractThemes(textContent);
        parsedChunks = executeChunkingAlg(textContent, parsedThemes);

        renderPrevision(parsedChunks, parsedThemes);
        
    } catch (e) {
        console.error("Error processing PDF:", e);
        displayAlert('error', 'Fallo de Parseo', 'Había un problema procesando el PDF en el navegador. ' + e.message);
    } finally {
        document.getElementById('admin-btn-parse').disabled = false;
        document.getElementById('admin-loading-spinner').classList.add('hidden');
    }
}

// === LECTURA DE PDF VIA PDF.JS ===
async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    
    // Using pdfjsLib from CDN
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    const numPages = pdf.numPages;

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Reconstruct text carefully to preserve lines somewhat
        let lastY = -1;
        let textLines = [];
        let currentLine = '';

        for(let item of textContent.items) {
            if (lastY !== item.transform[5] && currentLine.length > 0) {
                textLines.push(currentLine);
                currentLine = '';
            }
            currentLine += item.str + ' ';
            lastY = item.transform[5];
        }
        if (currentLine) textLines.push(currentLine);

        fullText += textLines.join('\n') + '\n\n';
    }

    return fullText;
}

// === MOTOR REGEX (Portado desde el nodo de backend) ===
function executeChunkingAlg(text, themes = []) {
    let cleanText = text.replace(/----------------Page \(\d+\) Break----------------/g, '\n');
    cleanText = cleanText.replace(/Viernes \d+ de \w+ de \d+.*DIARIO OFICIAL.*\(Edición \w+\)/gi, '');
    cleanText = cleanText.replace(/.*DOF - Diario Oficial de la Federación.*/g, '');
    cleanText = cleanText.replace(/https:\/\/www\.dof\.gob\.mx.*/g, '');
    
    // Fix hyphenated words 
    cleanText = cleanText.replace(/(\w+)-\n\s*(\w+)/g, "$1$2");

    // Dividir entre cuerpo principal y transitorios
    const mainParts = cleanText.split(/\n\s*T\s*R\s*A\s*N\s*S\s*I\s*T\s*O\s*R\s*I\s*O\s*S|\n\s*TRANSITORIOS\b/i);
    const regularText = mainParts[0];
    const transitoriosText = mainParts.length > 1 ? mainParts.slice(1).join('\n') : '';

    const chunks = [];
    
    // 1. Extraer artículos ordinarios
    const articleRegex = /(?:\n|^)\s*((?:ART[ÍI]CULO|Art[íi]culo)\s+(?:\d+[A-Z]?|[ÚU]NICO)\b[\.-]?)/g;
    const parts = regularText.split(articleRegex);
    
    if (parts[0] && parts[0].trim().length > 0) {
        chunks.push({ identificador: "Preámbulo/Considerandos", contenido: parts[0].trim().replace(/\s+/g, ' '), tipo: 'preambulo' });
    }
    
    for (let i = 1; i < parts.length; i += 2) {
        const title = parts[i].trim();
        let originalContent = parts[i + 1] ? parts[i + 1].trim() : "";
        let content = originalContent.replace(/\s+/g, ' '); 
        if (content.length > 5) {
            chunks.push({ identificador: title, contenido: content, tipo: 'ordinario', original_snippet: originalContent.substring(0, 50) });
        }
    }

    // 2. Extraer transitorios
    if (transitoriosText.trim().length > 0) {
        const transitRegex = /(?:\n|^)\s*((?:ART[ÍI]CULO\s+(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO|D[ÉE]CIMO|UND[ÉE]CIMO|DUOD[ÉE]CIMO|VIG[ÉE]SIMO)|(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|SEPTIMO|OCTAVO|NOVENO|D[ÉE]CIMO|DECIMO|UND[ÉE]CIMO|DUOD[ÉE]CIMO|VIG[ÉE]SIMO)(?:\s+(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO))?|ART[ÍI]CULO\s+TRANSITORIO|[ÚU]NICO)\b[\.-]*)/gi;
        const tParts = transitoriosText.split(transitRegex);
        
        for (let i = 1; i < tParts.length; i += 2) { 
            const ordinal = tParts[i] || '';
            const title = `Transitorio ${ordinal.toUpperCase()}`;
            let originalContent = tParts[i + 1] ? tParts[i + 1].trim() : "";
            let content = originalContent.replace(/\s+/g, ' ');
            if (content.length > 5) {
                chunks.push({ identificador: title, contenido: content, tipo: 'transitorio', original_snippet: originalContent.substring(0, 50) });
            }
        }
    }
    
    // Ensure themes are mapped against cleanText coordinates
    themes = extractThemes(cleanText);
    
    // Assign titulo_nombre and capitulo_nombre based on text position
    if (themes && themes.length > 0) {
        chunks.forEach(chunk => {
            // Find the position of the chunk in cleanText using the uncollapsed snippet
            const pos = cleanText.indexOf(chunk.original_snippet);
            if (pos !== -1) {
                let currentTitulo = null;
                let currentCapitulo = null;
                for (const t of themes) {
                    // Use the exact regex match position t.pos
                    if (t.pos !== undefined && t.pos < pos) {
                        if (t.nivel === 'titulo') currentTitulo = t.nombre;
                        if (t.nivel === 'capitulo') currentCapitulo = t.nombre;
                    }
                }
                chunk.titulo_nombre = currentTitulo;
                chunk.capitulo_nombre = currentCapitulo;
            }
        });
    }

    return chunks;
}

// === EXTRACTOR DE TEMAS PRINCIPALES (Títulos, Capítulos, Secciones) ===
function extractThemes(text) {
    const themes = [];
    let orden = 0;

    // RegEx para TÍTULO (PRIMERO, SEGUNDO... o con números romanos I, II...)
    const tituloRegex = /(?:^|\n)\s*(?:T[ÍI]TULO|T[íi]tulo)\s+(?:(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO|D[ÉE]CIMO(?:\s*(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO))?|UND[ÉE]CIMO|DUOD[ÉE]CIMO)|(?:[IVXLCDM]+))\b[.\-–—]*\s*(?:[\n\r]+\s*)?(.{0,120})/g;
    let m;
    while ((m = tituloRegex.exec(text)) !== null) {
        const nombre = m[1] ? m[1].replace(/\s+/g, ' ').trim() : '';
        themes.push({
            nivel: 'titulo',
            nombre: nombre,
            orden: ++orden,
            pos: m.index
        });
    }

    // RegEx para CAPÍTULO
    const capituloRegex = /(?:^|\n)\s*(?:CAP[ÍI]TULO|Cap[íi]tulo)\s+(?:(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO|D[ÉE]CIMO(?:\s*(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO))?|UND[ÉE]CIMO|DUOD[ÉE]CIMO|[ÚU]NICO)|(?:[IVXLCDM]+))\b[.\-–—]*\s*(?:[\n\r]+\s*)?(.{0,120})/g;
    while ((m = capituloRegex.exec(text)) !== null) {
        const nombre = m[1] ? m[1].replace(/\s+/g, ' ').trim() : '';
        themes.push({
            nivel: 'capitulo',
            nombre: nombre,
            orden: ++orden,
            pos: m.index
        });
    }

    // RegEx para SECCIÓN
    const seccionRegex = /(?:^|\n)\s*(?:SECCI[ÓO]N|Secci[óo]n)\s+(?:(?:PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|S[ÉE]PTIMA|OCTAVA|NOVENA|D[ÉE]CIMA(?:\s*(?:PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|S[ÉE]PTIMA|OCTAVA|NOVENA))?|UND[ÉE]CIMA|DUOD[ÉE]CIMA|[ÚU]NICA)|(?:[IVXLCDM]+))\b[.\-–—]*\s*(?:[\n\r]+\s*)?(.{0,120})/g;
    while ((m = seccionRegex.exec(text)) !== null) {
        const nombre = m[1] ? m[1].replace(/\s+/g, ' ').trim() : '';
        themes.push({
            nivel: 'seccion',
            nombre: nombre,
            orden: ++orden,
            pos: m.index
        });
    }

    // Ordenar por posición real de aparición en el texto
    themes.sort((a, b) => {
        return a.pos - b.pos;
    });

    // Re-asignar orden secuencial
    themes.forEach((t, i) => t.orden = i);

    return themes;
}

function renderPrevision(chunks, themes = []) {
    document.getElementById('admin-preview-area').classList.remove('hidden');
    document.getElementById('admin-preview-count').textContent = chunks.length;

    // === Sección de Temas Detectados ===
    let themesHtml = '';
    if (themes.length > 0) {
        const nivelConfig = {
            titulo:   { bg: 'bg-guinda/10', border: 'border-guinda/20', text: 'text-guinda',       icon: '📕', label: 'Título' },
            capitulo: { bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-700',     icon: '📘', label: 'Capítulo' },
            seccion:  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: '📗', label: 'Sección' }
        };
        const countTitulos = themes.filter(t => t.nivel === 'titulo').length;
        const countCapitulos = themes.filter(t => t.nivel === 'capitulo').length;
        const countSecciones = themes.filter(t => t.nivel === 'seccion').length;

        themesHtml = `
            <div class="mb-6 p-5 bg-gradient-to-br from-slate-50 to-white border border-slate-200/80 rounded-xl shadow-sm">
                <div class="flex items-center gap-2 mb-4">
                    <svg class="w-5 h-5 text-guinda" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    <span class="text-sm font-bold text-gray-800">Estructura Temática Detectada</span>
                    <span class="text-[10px] text-gray-400 ml-1">${themes.length} elementos</span>
                </div>
                <div class="flex flex-wrap gap-2 mb-4">
                    ${countTitulos > 0 ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${nivelConfig.titulo.bg} ${nivelConfig.titulo.text} border ${nivelConfig.titulo.border}">📕 ${countTitulos} Títulos</span>` : ''}
                    ${countCapitulos > 0 ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${nivelConfig.capitulo.bg} ${nivelConfig.capitulo.text} border ${nivelConfig.capitulo.border}">📘 ${countCapitulos} Capítulos</span>` : ''}
                    ${countSecciones > 0 ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${nivelConfig.seccion.bg} ${nivelConfig.seccion.text} border ${nivelConfig.seccion.border}">📗 ${countSecciones} Secciones</span>` : ''}
                </div>
                <div class="space-y-1.5 max-h-80 overflow-y-auto">
                    ${themes.map(t => {
                        const cfg = nivelConfig[t.nivel] || nivelConfig.titulo;
                        const indent = t.nivel === 'capitulo' ? 'ml-4' : t.nivel === 'seccion' ? 'ml-8' : '';
                        return `
                        <div class="flex items-start gap-2 ${indent} py-1.5 px-3 rounded-lg ${cfg.bg} border ${cfg.border} transition-all">
                            <span class="text-xs mt-0.5 flex-shrink-0">${cfg.icon}</span>
                            <div class="min-w-0">
                                <span class="text-[9px] font-bold uppercase tracking-widest ${cfg.text}">${cfg.label}</span>
                                <p class="text-xs text-gray-700 font-medium leading-snug truncate" title="${t.nombre}">${t.nombre}</p>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `;
    }

    const cardsHtml = chunks.slice(0, 50).map(c => `
        <div class="p-3 border border-gray-100 rounded-lg bg-white shadow-sm">
            <div class="flex items-center gap-2 mb-1">
                <span class="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${
                    c.tipo === 'transitorio' ? 'bg-amber-100 text-amber-800' :
                    c.tipo === 'preambulo' ? 'bg-indigo-100 text-indigo-800' :
                    'bg-slate-100 text-slate-800'
                }">${c.tipo}</span>
                <span class="text-sm font-bold text-gray-800 font-serif">${c.identificador}</span>
            </div>
            <p class="text-xs text-gray-500 line-clamp-2">${c.contenido}</p>
        </div>
    `).join('') + (chunks.length > 50 ? `<div class="p-3 text-center text-xs text-gray-400">...y ${chunks.length - 50} más</div>` : '');

    document.getElementById('admin-preview-cards').innerHTML = themesHtml + cardsHtml;
}

// === INGESTA DIRECTA (Batches) ===
async function handleIngestToSupabase() {
    if (!parsedChunks || parsedChunks.length === 0) return;

    const titleInput = document.getElementById('admin-input-title').value.trim();
    const siglasInput = document.getElementById('admin-input-siglas').value.trim();

    document.getElementById('admin-btn-ingest').disabled = true;
    document.getElementById('admin-progress-wrapper').classList.remove('hidden');
    const pctLabel = document.getElementById('admin-progress-pct');
    const bar = document.getElementById('admin-progress-bar');
    const lbl = document.getElementById('admin-progress-text');

    try {
        lbl.textContent = "1. Subiendo documento original a Storage...";
        const urlInput = document.getElementById('admin-input-url')?.value.trim();
        let urlOriginal = urlInput || null;
        if (importedFile && !urlOriginal) {
            const fileName = `${Date.now()}_${importedFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('documentos_legales')
                .upload(fileName, importedFile, { upsert: false });
            
            if (uploadError) {
                throw new Error("No se pudo subir el archivo PDF: " + uploadError.message);
            }
            
            const { data: publicUrlData } = supabase.storage
                .from('documentos_legales')
                .getPublicUrl(fileName);
                
            urlOriginal = publicUrlData.publicUrl;
        }

        lbl.textContent = "2. Creando registro matriz (Tabla Leyes)...";
        // Read conceptual themes from input
        const temasInput = document.getElementById('admin-input-temas')?.value.trim();
        const temasClave = temasInput ? temasInput.split(',').map(t => t.trim()).filter(Boolean) : [];
        // 1. Insert Law
        const { data: leyData, error: leyError } = await supabase
            .from('leyes')
            .insert([{ 
                titulo: titleInput, 
                siglas: siglasInput || null, 
                temas_clave: temasClave.length > 0 ? temasClave : null,
                url_original: urlOriginal
            }])
            .select();

        if (leyError) throw leyError;
        const newLeyId = leyData[0].id;

        // 2. Batched Articles Insert
        lbl.textContent = "2. Subiendo artículos por lotes...";
        
        const batchSize = 100;
        let totalInserted = 0;

        for (let i = 0; i < parsedChunks.length; i += batchSize) {
             const batch = parsedChunks.slice(i, i + batchSize).map((chunk, index) => ({
                ley_id: newLeyId,
                identificador: chunk.identificador,
                contenido: chunk.contenido,
                tipo_articulo: chunk.tipo,
                titulo_nombre: chunk.titulo_nombre || null,
                capitulo_nombre: chunk.capitulo_nombre || null,
                orden: i + index
            }));
            
            const { error: insertError } = await supabase.from('articulos').insert(batch);
            if (insertError) throw insertError;
            
            totalInserted += batch.length;
            const pct = Math.round((totalInserted / parsedChunks.length) * 100);
            pctLabel.textContent = `${pct}%`;
            bar.style.width = `${pct}%`;
        }

        // 3. Insert Themes
        if (parsedThemes.length > 0) {
            lbl.textContent = "3. Guardando temas principales...";
            const themesBatch = parsedThemes.map(t => ({
                ley_id: newLeyId,
                nivel: t.nivel,
                nombre: t.nombre,
                orden: t.orden
            }));
            const { error: temasError } = await supabase.from('temas').insert(themesBatch);
            if (temasError) {
                console.warn('Error insertando temas (la tabla podría no existir aún):', temasError.message);
            }
        }

        lbl.textContent = "¡Carga completada!";
        const temasMsg = parsedThemes.length > 0 ? ` y ${parsedThemes.length} temas principales` : '';
        displayAlert('success', 'Ingesta Terminada con Éxito', `La ley "${titleInput}", sus ${parsedChunks.length} fragmentos${temasMsg} han sido sincronizados en Supabase y ya están disponibles para búsqueda global.`);
        
        // Reset state
        document.getElementById('admin-btn-ingest').disabled = false;
        setTimeout(() => {
            document.getElementById('admin-preview-area').classList.add('hidden');
            document.getElementById('admin-progress-wrapper').classList.add('hidden');
            document.getElementById('admin-input-title').value = '';
            document.getElementById('admin-input-siglas').value = '';
            document.getElementById('admin-input-temas').value = '';
            document.getElementById('admin-file-name').classList.add('hidden');
            bar.style.width = '0%';
            pctLabel.textContent = '0%';
        }, 5000);

    } catch(e) {
        console.error(e);
        displayAlert('error', 'Error durante la Ingesta', 'Ocurrió un error escribiendo en Supabase: ' + e.message);
        document.getElementById('admin-btn-ingest').disabled = false;
    }
}
