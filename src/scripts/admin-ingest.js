import { supabase } from '../lib/supabase.js';
import { getAllLeyesAdmin, updateLaw, deleteLaw } from './search-engine.js';
import { isAdmin } from './auth.js';

let importedFile = null;
let parsedChunks = [];
let parsedThemes = [];

export function initAdminIngest() {
    console.log("Admin Ingest Module initialized.");

    const dropzone = document.getElementById('admin-dropzone');
    const fileInput = document.getElementById('admin-file-input');
    const btnParse = document.getElementById('admin-btn-parse');
    const btnIngest = document.getElementById('admin-btn-ingest');

    // Tab buttons
    const tabIngest = document.getElementById('admin-tab-ingest');
    const tabManage = document.getElementById('admin-tab-manage');
    const viewIngest = document.getElementById('admin-ingest-view');
    const viewManage = document.getElementById('admin-manage-view');

    if (!dropzone) return;

    // Tab Switching Logic
    tabIngest?.addEventListener('click', () => {
        tabIngest.classList.add('bg-white', 'shadow-sm', 'text-guinda');
        tabIngest.classList.remove('text-gray-500');
        tabManage.classList.remove('bg-white', 'shadow-sm', 'text-guinda');
        tabManage.classList.add('text-gray-500');
        viewIngest.classList.remove('hidden');
        viewManage.classList.add('hidden');
    });

    tabManage?.addEventListener('click', () => {
        tabManage.classList.add('bg-white', 'shadow-sm', 'text-guinda');
        tabManage.classList.remove('text-gray-500');
        tabIngest.classList.remove('bg-white', 'shadow-sm', 'text-guinda');
        tabIngest.classList.add('text-gray-500');
        viewManage.classList.remove('hidden');
        viewIngest.classList.add('hidden');
        fetchAndRenderManageLaws();
    });

    // CRUD UI Events
    document.getElementById('admin-refresh-laws')?.addEventListener('click', fetchAndRenderManageLaws);
    document.getElementById('close-edit-law-modal')?.addEventListener('click', closeEditModal);
    document.getElementById('edit-law-form')?.addEventListener('submit', handleUpdateLaw);

    // Ingest Events
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

// === GESTIÓN DE ACERVO (CRUD) ===

async function fetchAndRenderManageLaws() {
    const listContainer = document.getElementById('admin-laws-list');
    if (!listContainer) return;

    listContainer.innerHTML = '<tr><td colspan="5" class="py-12 text-center"><div class="animate-spin h-5 w-5 border-2 border-guinda border-t-transparent rounded-full mx-auto"></div></td></tr>';

    try {
        const leyes = await getAllLeyesAdmin();
        
        if (leyes.length === 0) {
            listContainer.innerHTML = '<tr><td colspan="5" class="py-12 text-center text-gray-400 font-medium italic">No hay instrumentos cargados en el acervo.</td></tr>';
            return;
        }

        listContainer.innerHTML = leyes.map(ley => {
            const date = ley.fecha_publicacion ? new Date(ley.fecha_publicacion).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) : '---';
            return `
                <tr class="hover:bg-gray-50/80 transition-colors group">
                    <td class="px-6 py-4">
                        <div class="font-bold text-gray-800 line-clamp-1" title="${ley.titulo}">${ley.titulo}</div>
                        ${ley.url_original ? `<a href="${ley.url_original}" target="_blank" class="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5">
                            <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg> Ver fuente
                        </a>` : ''}
                    </td>
                    <td class="px-4 py-4 font-mono text-[11px] font-bold text-guinda">${ley.siglas || '---'}</td>
                    <td class="px-4 py-4 text-center">
                        <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${getTypeStyle(ley.tipo)}">
                            ${ley.tipo || 'otros'}
                        </span>
                    </td>
                    <td class="px-4 py-4 text-gray-400 font-medium">${date}</td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button class="admin-edit-btn p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all" data-id="${ley.id}" title="Editar">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </button>
                            <button class="admin-delete-btn p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all" data-id="${ley.id}" title="Eliminar">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Attach events
        listContainer.querySelectorAll('.admin-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.id));
        });
        listContainer.querySelectorAll('.admin-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => handleDeleteLaw(btn.dataset.id));
        });

    } catch (e) {
        listContainer.innerHTML = `<tr><td colspan="5" class="py-12 text-center text-red-500 font-bold">Error: ${e.message}</td></tr>`;
    }
}

function getTypeStyle(tipo) {
    switch (tipo?.toLowerCase()) {
        case 'ley': return 'bg-guinda/10 text-guinda border border-guinda/20';
        case 'reglamento': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        case 'acuerdo': return 'bg-amber-50 text-amber-700 border border-amber-200';
        case 'dacg': return 'bg-blue-50 text-blue-700 border border-blue-200';
        case 'nom': return 'bg-purple-50 text-purple-700 border border-purple-200';
        default: return 'bg-gray-50 text-gray-500 border border-gray-200';
    }
}

async function openEditModal(id) {
    const modal = document.getElementById('edit-law-modal');
    if (!modal) return;

    try {
        const { data: ley, error } = await supabase.from('leyes').select('*').eq('id', id).single();
        if (error) throw error;

        document.getElementById('edit-law-id').value = ley.id;
        document.getElementById('edit-law-title').value = ley.titulo;
        document.getElementById('edit-law-siglas').value = ley.siglas || '';
        document.getElementById('edit-law-tipo').value = ley.tipo || 'otros';
        document.getElementById('edit-law-temas').value = (ley.temas_clave || []).join(', ');
        document.getElementById('edit-law-url').value = ley.url_original || '';

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            modal.children[0].classList.remove('scale-95', 'opacity-0');
        }, 10);

    } catch (e) {
        alert("Error cargando datos para editar: " + e.message);
    }
}

function closeEditModal() {
    const modal = document.getElementById('edit-law-modal');
    if (!modal) return;
    modal.children[0].classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

async function handleUpdateLaw(e) {
    e.preventDefault();
    const id = document.getElementById('edit-law-id').value;
    const temasRaw = document.getElementById('edit-law-temas').value;
    
    const payload = {
        titulo: document.getElementById('edit-law-title').value.trim(),
        siglas: document.getElementById('edit-law-siglas').value.trim() || null,
        tipo: document.getElementById('edit-law-tipo').value,
        temas_clave: temasRaw ? temasRaw.split(',').map(t => t.trim()).filter(Boolean) : null,
        url_original: document.getElementById('edit-law-url').value.trim() || null
    };

    try {
        await updateLaw(id, payload);
        closeEditModal();
        fetchAndRenderManageLaws();
    } catch (err) {
        alert("Error actualizando: " + err.message);
    }
}

async function handleDeleteLaw(id) {
    if (!confirm("¿Estás seguro de eliminar este instrumento? Se borrarán todos sus artículos y temas asociados permanentemente.")) return;

    try {
        await deleteLaw(id);
        fetchAndRenderManageLaws();
    } catch (err) {
        alert("Error eliminando: " + err.message);
    }
}


// === LOGICA DE INGESTA ORIGINAL ===

function handleFileSelection(file) {
    if (file.type !== 'application/pdf') {
        alert("Por favor selecciona un archivo PDF.");
        return;
    }
    importedFile = file;
    document.getElementById('admin-file-name').textContent = `📄 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    document.getElementById('admin-file-name').classList.remove('hidden');
    document.getElementById('admin-btn-parse').disabled = false;
    
    document.getElementById('admin-preview-area').classList.add('hidden');
    parsedChunks = [];
}

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
    if (!box) return;
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
        displayAlert('error', 'Falta el título', 'Por favor ingresa el título normativo.');
        return;
    }
    if (!importedFile) return;
    try {
        const { data: leyes } = await supabase.from('leyes').select('titulo, siglas');
        let possibleDuplicate = false;
        let dupReason = '';
        for (const ley of (leyes || [])) {
            if (siglasInput && ley.siglas && siglasInput.toLowerCase() === ley.siglas.toLowerCase()) {
                possibleDuplicate = true;
                dupReason = `Las siglas "${siglasInput}" ya existen vinculadas a "${ley.titulo}".`;
                break;
            }
            const sim = calculateSimilarity(titleInput, ley.titulo);
            if (sim > 82) {
                possibleDuplicate = true;
                dupReason = `El título tiene un ${sim.toFixed(1)}% de similitud con "${ley.titulo}".`;
                break;
            }
        }
        if (possibleDuplicate) {
            displayAlert('error', 'Posible Ley Duplicada', dupReason);
            return;
        }
        document.getElementById('admin-alert-box')?.classList.add('hidden');
    } catch(e) { console.error(e); }

    document.getElementById('admin-btn-parse').disabled = true;
    document.getElementById('admin-loading-spinner').classList.remove('hidden');
    try {
        const textContent = await extractTextFromPDF(importedFile);
        parsedThemes = extractThemes(textContent);
        parsedChunks = executeChunkingAlg(textContent, parsedThemes);
        renderPrevision(parsedChunks, parsedThemes);
    } catch (e) {
        displayAlert('error', 'Fallo de Parseo', e.message);
    } finally {
        document.getElementById('admin-btn-parse').disabled = false;
        document.getElementById('admin-loading-spinner').classList.add('hidden');
    }
}

async function extractTextFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
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

function executeChunkingAlg(text, themes = []) {
    let cleanText = text.replace(/----------------Page \(\d+\) Break----------------/g, '\n');
    cleanText = cleanText.replace(/(\w+)-\n\s*(\w+)/g, "$1$2");
    const mainParts = cleanText.split(/\n\s*TRANSITORIOS\b/i);
    const regularText = mainParts[0];
    const transitoriosText = mainParts.length > 1 ? mainParts.slice(1).join('\n') : '';
    const chunks = [];
    // Regex robusta para capturar tanto "ARTÍCULO 1" como numeraciones decimales tipo "1.1." comunes en DACGs
    const articleRegex = /(?:\n|^)\s*((?:(?:ART[ÍI]CULO|Art[íi]culo)\s+(?:\d+[A-Z\d]*|[\d\.]+|[ÚU]NICO)|\d+\.(?:\d+\.?)+)\b[\s\.º°-]*)/g;
    const parts = regularText.split(articleRegex);
    if (parts[0] && parts[0].trim().length > 0) {
        chunks.push({ identificador: "Preámbulo", contenido: parts[0].trim().replace(/\s+/g, ' '), tipo: 'preambulo' });
    }
    for (let i = 1; i < parts.length; i += 2) {
        const title = parts[i].trim();
        let originalContent = parts[i + 1] ? parts[i + 1].trim() : "";
        // Colapsamos espacios horizontales pero mantenemos saltos de línea para tablas
        let content = originalContent.replace(/[^\S\r\n]+/g, ' '); 
        if (content.length > 5) {
            // Snippet LITERAL para asegurar que indexOf lo encuentre en cleanText (que no está colapsado)
            const mappingSnippet = originalContent.substring(0, 60); 
            chunks.push({ 
                identificador: title, 
                contenido: content, 
                tipo: 'ordinario', 
                mapping_snippet: mappingSnippet 
            });
        }
    }
    if (transitoriosText.trim().length > 0) {
        const transitRegex = /(?:\n|^)\s*((?:ART[ÍI]CULO\s+(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO|D[ÉE]CIMO|UND[ÉE]CIMO|DUOD[ÉE]CIMO|VIG[ÉE]SIMO)|(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|SEPTIMO|OCTAVO|NOVENO|D[ÉE]CIMO|DECIMO|UND[ÉE]CIMO|DUOD[ÉE]CIMO|VIG[ÉE]SIMO)(?:\s+(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO))?|ART[ÍI]CULO\s+TRANSITORIO|[ÚU]NICO)\b[\.-]*)/gi;
        const tParts = transitoriosText.split(transitRegex);
        for (let i = 1; i < tParts.length; i += 2) { 
            const title = `Transitorio ${tParts[i].toUpperCase()}`;
            let content = (tParts[i + 1] || "").trim().replace(/[^\S\r\n]+/g, ' ');
            if (content.length > 5) {
                // Snippet literal para transitorios
                const mappingSnippet = (tParts[i + 1] || "").substring(0, 60);
                chunks.push({ 
                    identificador: title, 
                    contenido: content, 
                    tipo: 'transitorio', 
                    mapping_snippet: mappingSnippet 
                });
            }
        }
    }
    themes = extractThemes(cleanText);
    if (themes.length > 0) {
        chunks.forEach(chunk => {
            // Buscamos el snippet pero colapsando espacios en cleanText para el match si es necesario
            // O mejor, buscamos el snippet limpio que guardamos
            const pos = cleanText.indexOf(chunk.mapping_snippet);
            if (pos !== -1) {
                for (const t of themes) {
                    if (t.pos < pos) {
                        if (t.nivel === 'titulo') chunk.titulo_nombre = t.nombre;
                        if (t.nivel === 'capitulo') chunk.capitulo_nombre = t.nombre;
                        if (t.nivel === 'seccion') chunk.seccion_nombre = t.nombre;
                    }
                }
            }
        });
    }
    return chunks;
}

function extractThemes(text) {
    const themes = [];
    let orden = 0;
    
    // Improved Regex: Case insensitive, supports digits, roman numerals and names (PRIMERO, etc.)
    // Regex mejoradas: \s* permite cualquier cantidad de espacios o saltos de línea entre el prefijo y el nombre
    // Regex mejoradas para capturar títulos que pueden estar en líneas separadas (común en PDFs del DOF)
    const tituloRegex = /(?:^|\n)\s*(?:T[ÍI]TULO|T[íi]tulo)\s+(?:(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO|D[ÉE]CIMO|UND[ÉE]CIMO|DUOD[ÉE]CIMO)|(?:[IVXLCDM]+)|\d+)\b[\s\.º°–—-]*\s*([\s\S]{0,150}?)(?=\n\s*(?:T[ÍI]TULO|CAP[ÍI]TULO|SECCI[ÓO]N|ART[ÍI]CULO|Art[íi]culo|\d+\.\d)|$)/gi;
    const capituloRegex = /(?:^|\n)\s*(?:CAP[ÍI]TULO|Cap[íi]tulo)\s+(?:(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO|D[ÉE]CIMO|UND[ÉE]CIMO|DUOD[ÉE]CIMO)|(?:[IVXLCDM]+)|\d+)\b[\s\.º°–—-]*\s*([\s\S]{0,150}?)(?=\n\s*(?:T[ÍI]TULO|CAP[ÍI]TULO|SECCI[ÓO]N|ART[ÍI]CULO|Art[íi]culo|\d+\.\d)|$)/gi;
    const seccionRegex = /(?:^|\n)\s*(?:SECCI[ÓO]N|Secci[óo]n)\s+(?:(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO|D[ÉE]CIMO|UND[ÉE]CIMO|DUOD[ÉE]CIMO)|(?:[IVXLCDM]+)|\d+)\b[\s\.º°–—-]*\s*([\s\S]{0,150}?)(?=\n\s*(?:T[ÍI]TULO|CAP[ÍI]TULO|SECCI[ÓO]N|ART[ÍI]CULO|Art[íi]culo|\d+\.\d)|$)/gi;

    const cleanStr = (s => (s || '').replace(/\s+/g, ' ').trim());
    const subtituloRegex = /(?:^|\n)\s*(?:SUBT[ÍI]TULO|Subt[íi]tulo)\s+(?:(?:PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|S[ÉE]PTIMO|OCTAVO|NOVENO|D[ÉE]CIMO)|(?:[IVXLCDM]+)|\d+)\b[\s\.º°–—-]*\s*([\s\S]{0,150}?)(?=\n\s*(?:T[ÍI]TULO|CAP[ÍI]TULO|SUBT[ÍI]TULO|SECCI[ÓO]N|ART[ÍI]CULO|Art[íi]culo|\d+\.\d)|$)/gi;

    let m;
    while ((m = tituloRegex.exec(text)) !== null) themes.push({ nivel: 'titulo', nombre: cleanStr(m[1]), orden: ++orden, pos: m.index });
    while ((m = capituloRegex.exec(text)) !== null) themes.push({ nivel: 'capitulo', nombre: cleanStr(m[1]), orden: ++orden, pos: m.index });
    while ((m = subtituloRegex.exec(text)) !== null) themes.push({ nivel: 'subtitulo', nombre: cleanStr(m[1]), orden: ++orden, pos: m.index });
    while ((m = seccionRegex.exec(text)) !== null) themes.push({ nivel: 'seccion', nombre: cleanStr(m[1]), orden: ++orden, pos: m.index });

    themes.sort((a, b) => a.pos - b.pos);
    return themes;
}

function renderPrevision(chunks, themes = []) {
    document.getElementById('admin-preview-area').classList.remove('hidden');
    document.getElementById('admin-preview-count').textContent = chunks.length;
    
    const cardsHtml = chunks.slice(0, 150).map((c, idx) => {
        let hierarchyHtml = '';
        if (c.titulo_nombre || c.capitulo_nombre || c.seccion_nombre) {
            hierarchyHtml = `
                <div class="flex flex-wrap gap-1 mb-2">
                    ${c.titulo_nombre ? `<span class="text-[8px] px-1.5 py-0.5 bg-guinda/5 text-guinda font-bold rounded border border-guinda/10">T: ${c.titulo_nombre}</span>` : ''}
                    ${c.capitulo_nombre ? `<span class="text-[8px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded border border-emerald-100">C: ${c.capitulo_nombre}</span>` : ''}
                    ${c.seccion_nombre ? `<span class="text-[8px] px-1.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded border border-blue-100">S: ${c.seccion_nombre}</span>` : ''}
                </div>
            `;
        }

        return `
            <div class="chunk-card group relative p-4 border border-gray-100 rounded-xl bg-white shadow-sm hover:border-guinda/40 hover:shadow-md transition-all cursor-pointer" data-index="${idx}">
                <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="p-1.5 bg-guinda/10 text-guinda rounded-lg hover:bg-guinda hover:text-white transition-colors" title="Editar contenido">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                </div>
                ${hierarchyHtml}
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter bg-slate-100 text-slate-500 border border-slate-200">${c.tipo}</span>
                    <span class="text-xs font-bold text-gray-900 font-serif">${c.identificador}</span>
                </div>
                <div class="text-[10px] text-gray-500 leading-relaxed whitespace-pre-wrap line-clamp-4 font-light">${c.contenido}</div>
            </div>
        `;
    }).join('');
    
    const container = document.getElementById('admin-preview-cards');
    container.innerHTML = cardsHtml;

    // Listener para edición rápida mediante modal
    let editingChunkIdx = null;
    const chunkModal = document.getElementById('edit-chunk-modal');
    const chunkModalPanel = document.getElementById('chunk-modal-panel');
    const chunkContentInput = document.getElementById('edit-chunk-content');
    const chunkTitleLabel = document.getElementById('chunk-modal-identificador');

    container.querySelectorAll('.chunk-card').forEach(card => {
        card.addEventListener('click', () => {
            editingChunkIdx = card.dataset.index;
            const chunk = parsedChunks[editingChunkIdx];
            
            chunkTitleLabel.textContent = `Editar: ${chunk.identificador}`;
            chunkContentInput.value = chunk.contenido;
            
            // Mostrar modal con animación
            chunkModal.classList.remove('hidden');
            chunkModal.classList.add('flex');
            setTimeout(() => {
                chunkModalPanel.classList.remove('scale-95', 'opacity-0');
                chunkModalPanel.classList.add('scale-100', 'opacity-100');
            }, 10);
        });
    });

    // Cerrar modal
    const closeChunkModal = () => {
        chunkModalPanel.classList.remove('scale-100', 'opacity-100');
        chunkModalPanel.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            chunkModal.classList.add('hidden');
            chunkModal.classList.remove('flex');
        }, 300);
    };

    document.getElementById('close-chunk-modal').onclick = closeChunkModal;
    document.getElementById('cancel-chunk-edit').onclick = closeChunkModal;
    document.getElementById('save-chunk-edit').onclick = () => {
        if (editingChunkIdx !== null) {
            parsedChunks[editingChunkIdx].contenido = chunkContentInput.value;
            closeChunkModal();
            renderPrevision(parsedChunks, parsedThemes);
        }
    };
}

async function handleIngestToSupabase() {
    if (!parsedChunks.length) return;
    const titleInput = document.getElementById('admin-input-title').value.trim();
    const btn = document.getElementById('admin-btn-ingest');
    btn.disabled = true;
    try {
        const { data: leyData, error: leyError } = await supabase.from('leyes').insert([{ 
            titulo: titleInput, 
            siglas: document.getElementById('admin-input-siglas').value.trim() || null, 
            tipo: document.getElementById('admin-input-tipo').value,
            url_original: document.getElementById('admin-input-url')?.value.trim() || null
        }]).select();
        if (leyError) throw leyError;
        const newLeyId = leyData[0].id;
        const batchSize = 50;
        for (let i = 0; i < parsedChunks.length; i += batchSize) {
             const batch = parsedChunks.slice(i, i + batchSize).map((chunk, index) => ({
                ley_id: newLeyId,
                identificador: chunk.identificador,
                contenido: chunk.contenido,
                tipo_articulo: chunk.tipo,
                titulo_nombre: chunk.titulo_nombre || null,
                capitulo_nombre: chunk.capitulo_nombre || null,
                seccion_nombre: chunk.seccion_nombre || null,
                orden: i + index
            }));
            await supabase.from('articulos').insert(batch);
        }
        displayAlert('success', 'Ingesta Exitosa', 'El instrumento ha sido cargado.');
        setTimeout(() => location.reload(), 2000);
    } catch(e) {
        displayAlert('error', 'Error', e.message);
        btn.disabled = false;
    }
}
