import { supabase } from '../lib/supabase.js';
import { getAllLeyesAdmin, updateLaw, deleteLaw } from './search-engine.js';
import { isAdmin } from './auth.js';
import { parseRegulatoryText, reconstructPdfPages, validateRegulatoryChunks } from '../lib/regulatory-parser.js';

let importedFile = null;
let importedDofText = null;
let parsedChunks = [];
let parsedThemes = [];
let parsedNotices = [];
let parsedSourceText = '';
let documentRevision = 0;

function resetParsedDocument({ keepSourceNotices = false } = {}) {
    documentRevision++;
    parsedChunks = [];
    parsedThemes = [];
    parsedNotices = keepSourceNotices ? parsedNotices.filter(n => n.code === 'tablas') : [];
    parsedSourceText = '';
    document.getElementById('admin-preview-area')?.classList.add('hidden');
    const button = document.getElementById('admin-btn-ingest');
    if (button) button.disabled = true;
}

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
    document.getElementById('admin-structure-mode')?.addEventListener('change', () => resetParsedDocument({ keepSourceNotices: true }));

    document.getElementById('admin-btn-dof-import')?.addEventListener('click', handleDofUrlImport);
    document.getElementById('admin-input-dof-url')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleDofUrlImport();
        }
    });

    // Pobla los selects "modifica a" con el acervo ya cargado (sin query extra)
    window.addEventListener('search-ready', (e) => populateRelacionSelects(e.detail?.summaries || []));
}

function populateRelacionSelects(summaries) {
    if (!summaries.length) return;
    const opts = summaries
        .slice()
        .sort((a, b) => a.titulo.localeCompare(b.titulo))
        .map(s => {
            const label = `${s.siglas ? s.siglas + ' — ' : ''}${s.titulo}`;
            const short = label.length > 95 ? label.slice(0, 95) + '…' : label;
            return `<option value="${s.id}" title="${s.titulo.replace(/"/g, '&quot;')}">${short}</option>`;
        })
        .join('');
    for (const id of ['admin-input-modifica', 'edit-law-modifica']) {
        const sel = document.getElementById(id);
        if (!sel) continue;
        const placeholder = sel.options[0]?.outerHTML || '<option value="">— Ninguno —</option>';
        const prev = sel.value;
        sel.innerHTML = placeholder + opts;
        if (prev) sel.value = prev;
    }
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
            const date = ley.fecha_publicacion ? new Date(ley.fecha_publicacion).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }) : '---';
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
        case 'decreto': return 'bg-purple-50 text-purple-700 border border-purple-200';
        case 'dacg': return 'bg-blue-50 text-blue-700 border border-blue-200';
        case 'nom': return 'bg-gray-50 text-gray-700 border border-gray-200';
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

        // Relación "modifica a" existente (tolerante a tabla ausente)
        try {
            const { data: rels } = await supabase
                .from('ley_relaciones')
                .select('ley_afectada_id, tipo')
                .eq('ley_nueva_id', id)
                .limit(1);
            const rel = rels?.[0];
            const selMod = document.getElementById('edit-law-modifica');
            const selTipo = document.getElementById('edit-law-modifica-tipo');
            if (selMod) selMod.value = rel?.ley_afectada_id || '';
            if (selTipo) selTipo.value = rel?.tipo || 'modifica';
        } catch (relErr) {
            console.warn('[Admin] ley_relaciones no disponible:', relErr.message);
        }

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

        // Sincroniza la relación "modifica a" (una por instrumento desde este modal)
        try {
            const modificaId = document.getElementById('edit-law-modifica')?.value || '';
            const tipoRel = document.getElementById('edit-law-modifica-tipo')?.value || 'modifica';
            await supabase.from('ley_relaciones').delete().eq('ley_nueva_id', id);
            if (modificaId) {
                const { error: relError } = await supabase
                    .from('ley_relaciones')
                    .insert([{ ley_afectada_id: modificaId, ley_nueva_id: id, tipo: tipoRel }]);
                if (relError) throw relError;
            }
        } catch (relErr) {
            console.warn('[Admin] No se pudo guardar la relación:', relErr.message);
            alert('La ley se actualizó, pero la relación "modifica a" no se pudo guardar: ' + relErr.message);
        }

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
    importedDofText = null;
    resetParsedDocument();
    document.getElementById('admin-file-name').textContent = `📄 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    document.getElementById('admin-file-name').classList.remove('hidden');
    document.getElementById('admin-btn-parse').disabled = false;

    document.getElementById('admin-preview-area').classList.add('hidden');
    parsedChunks = [];

    // Auto-detección de metadatos (no bloquea, no sobreescribe lo ya ingresado)
    autoDetectMetadata(file).catch(err => console.warn('[Autodetect] fallo:', err));
}

// === AUTO-DETECCIÓN DE METADATOS ===

const TIPO_KEYWORDS = [
    { tipo: 'nom',        re: /\bNORMA\s+OFICIAL\s+MEXICANA\b/i },
    { tipo: 'dacg',       re: /\bDISPOSICIONES\s+ADMINISTRATIVAS\s+DE\s+CAR[ÁA]CTER\s+GENERAL\b/i },
    { tipo: 'reglamento', re: /\bREGLAMENTO\s+(?:DE|INTERIOR|DEL)\b/i },
    { tipo: 'ley',        re: /\bLEY\s+(?:DE|DEL|GENERAL|FEDERAL|ORG[ÁA]NICA)\b/i },
    { tipo: 'decreto',    re: /\bDECRETO\s+(?:POR\s+EL\s+QUE|QUE)\b/i },
    { tipo: 'acuerdo',    re: /\bACUERDO\s+(?:POR\s+EL\s+QUE|QUE|DE\s+LA)\b/i },
    { tipo: 'manual',     re: /\bLINEAMIENTOS?\s+(?:PARA|DE)\b/i },
];

const MESES_ES = {
    enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
    julio: '07', agosto: '08', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12'
};

async function extractFirstPagesText(file, maxPages = 2) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = Math.min(pdf.numPages, maxPages);
    let text = '';
    for (let i = 1; i <= pages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        let lastY = -1, line = '';
        const lines = [];
        for (const item of content.items) {
            if (lastY !== item.transform[5] && line.length > 0) { lines.push(line); line = ''; }
            line += item.str + ' ';
            lastY = item.transform[5];
        }
        if (line) lines.push(line);
        text += lines.join('\n') + '\n';
    }
    return text;
}

function detectTipo(text) {
    for (const { tipo, re } of TIPO_KEYWORDS) {
        if (re.test(text)) return tipo;
    }
    return null;
}

function detectFecha(text) {
    // DOF: dd/mm/yyyy
    const dof = text.match(/DOF:\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
    if (dof) {
        const [, d, m, y] = dof;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    // "Ciudad de México, a X de mes de YYYY"
    const ciudad = text.match(/Ciudad de M[ée]xico[,\s]+a\s+(\d{1,2}|[a-zñáéíóú]+)\s+de\s+([a-zñáéíóú]+)\s+de\s+(\d{4})/i);
    if (ciudad) {
        const [, dRaw, mesRaw, y] = ciudad;
        const dia = /^\d+$/.test(dRaw) ? dRaw : palabrasANumero(dRaw);
        const mes = MESES_ES[mesRaw.toLowerCase()];
        if (dia && mes) return `${y}-${mes}-${String(dia).padStart(2, '0')}`;
    }
    return null;
}

function palabrasANumero(palabra) {
    const map = {
        uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
        once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciséis: 16, dieciseis: 16,
        diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veintiuno: 21, veintidós: 22,
        veintidos: 22, veintitrés: 23, veintitres: 23, veinticuatro: 24, veinticinco: 25,
        veintiséis: 26, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29, treinta: 30,
        treintayuno: 31, 'treinta y uno': 31
    };
    return map[palabra.toLowerCase()] || null;
}

function detectTitulo(text) {
    // Busca primer encabezado: línea que arranque con tipo keyword + "por el que" / "que ..."
    const re = /\b((?:ACUERDO|DECRETO|REGLAMENTO|LEY|RESOLUCI[ÓO]N|NORMA\s+OFICIAL\s+MEXICANA|DISPOSICIONES\s+ADMINISTRATIVAS\s+DE\s+CAR[ÁA]CTER\s+GENERAL|LINEAMIENTOS?)\b[^.]{20,400}\.)/i;
    const m = text.match(re);
    if (!m) return null;
    return m[1].replace(/\s+/g, ' ').trim();
}

function detectUrl(text) {
    const m = text.match(/https?:\/\/(?:www\.)?dof\.gob\.mx\/nota_detalle\.php\?codigo=\d+[^\s)\]"']*/i);
    return m ? m[0] : null;
}

function fillFieldIfEmpty(id, value) {
    if (!value) return false;
    const el = document.getElementById(id);
    if (!el) return false;
    if (el.value && el.value.trim()) return false;
    if (el.tagName === 'SELECT') {
        const opt = Array.from(el.options).find(o => o.value === value);
        if (opt) { el.value = value; return true; }
        return false;
    }
    el.value = value;
    return true;
}

async function autoDetectMetadata(file) {
    const text = await extractFirstPagesText(file, 2);
    if (importedFile !== file) return;
    const tipo = detectTipo(text);
    const fecha = detectFecha(text);
    const titulo = detectTitulo(text);
    const url = detectUrl(text);

    const filled = [];
    if (fillFieldIfEmpty('admin-input-title', titulo)) filled.push('título');
    if (fillFieldIfEmpty('admin-input-tipo', tipo)) filled.push('tipo');
    if (fillFieldIfEmpty('admin-input-fecha', fecha)) filled.push('fecha');
    if (fillFieldIfEmpty('admin-input-url', url)) filled.push('URL');

    if (filled.length > 0) {
        displayAlert('success', 'Metadatos detectados',
            `Se autocompletó: ${filled.join(', ')}. Revisa y ajusta antes de parsear.`);
    } else {
        console.log('[Autodetect] sin campos auto-rellenables. Detectado:', { tipo, fecha, titulo, url });
    }
}

// === IMPORTACIÓN DESDE URL DEL DOF (API SIDOF) ===

// El API oficial del DOF (SIDOF) expone las notas con CORS abierto; el host de
// producción y el de QA sirven los mismos datos, se intentan en orden.
const DOF_API_HOSTS = ['https://sidof.segob.gob.mx', 'https://sidofqa.segob.gob.mx'];

function parseCodNotaFromInput(value) {
    const v = (value || '').trim();
    if (!v) return null;
    const m = v.match(/[?&]codigo=(\d+)/i) || v.match(/\/notas?\/(\d{5,})/i) || v.match(/^(\d{5,})$/);
    return m ? m[1] : null;
}

async function fetchDofNota(codNota) {
    let lastErr = null;
    for (const host of DOF_API_HOSTS) {
        try {
            // Sin header Accept explícito: el endpoint responde 406 ante
            // "Accept: application/json"; con el default del navegador (*/*) sirve JSON.
            const res = await fetch(`${host}/dof/sidof/notas/nota/${codNota}`);
            if (!res.ok) { lastErr = new Error(`HTTP ${res.status} en ${host}`); continue; }
            const json = await res.json();
            if (json?.messageCode === 200 && json.Nota) return json.Nota;
            lastErr = new Error(json?.response || 'Respuesta inesperada del API del DOF');
        } catch (e) {
            lastErr = e;
        }
    }
    throw lastErr || new Error('No se pudo consultar el API del DOF');
}

const HTML_BLOCK_TAGS = new Set([
    'P', 'DIV', 'TABLE', 'TR', 'LI', 'UL', 'OL', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
    'SECTION', 'ARTICLE', 'BLOCKQUOTE', 'CENTER', 'HR', 'TBODY', 'THEAD'
]);

function htmlToPlainText(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('script, style').forEach(el => el.remove());
    const walk = (node) => {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent;
        if (node.nodeType !== Node.ELEMENT_NODE) return '';
        const tag = node.tagName;
        if (tag === 'BR') return '\n';
        let out = '';
        for (const child of node.childNodes) out += walk(child);
        if (tag === 'TD' || tag === 'TH') return out + ' ';
        if (HTML_BLOCK_TAGS.has(tag)) return out + '\n';
        return out;
    };
    return walk(doc.body)
        .replace(/\u00a0/g, ' ')
        .split('\n')
        .map(line => line.replace(/\s+/g, ' ').trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

async function handleDofUrlImport() {
    const input = document.getElementById('admin-input-dof-url');
    const btn = document.getElementById('admin-btn-dof-import');
    const spinner = document.getElementById('admin-loading-spinner');
    const codNota = parseCodNotaFromInput(input?.value);
    if (!codNota) {
        displayAlert('error', 'URL no reconocida',
            'Pega un enlace tipo dof.gob.mx/nota_detalle.php?codigo=... o directamente el código numérico de la nota.');
        return;
    }
    if (btn) btn.disabled = true;
    spinner?.classList.remove('hidden');
    try {
        const nota = await fetchDofNota(codNota);
        const html = nota.cadenaContenido;
        if (!html || !html.trim()) {
            throw new Error('Esta nota no tiene versión HTML en el DOF (frecuente en publicaciones antiguas o anexos escaneados). Descarga el PDF y súbelo manualmente.');
        }
        resetParsedDocument();
        importedDofText = htmlToPlainText(html);
        if (/<table\b/i.test(html)) parsedNotices.push({ code: 'tablas', message: 'La nota contiene tablas. Verifica columnas, unidades y notas en el documento oficial.' });
        importedFile = null;
        parsedChunks = [];
        document.getElementById('admin-preview-area')?.classList.add('hidden');

        let fechaISO = null, fechaDof = null;
        const fm = (nota.fecha || '').match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (fm) {
            fechaISO = `${fm[3]}-${fm[2]}-${fm[1]}`;
            fechaDof = `${fm[1]}/${fm[2]}/${fm[3]}`;
        }
        const urlCanonica = `https://www.dof.gob.mx/nota_detalle.php?codigo=${codNota}` + (fechaDof ? `&fecha=${fechaDof}` : '');
        const tipo = detectTipo(`${nota.titulo || ''}\n${importedDofText.slice(0, 4000)}`);

        const filled = [];
        if (fillFieldIfEmpty('admin-input-title', (nota.titulo || '').trim())) filled.push('título');
        if (fillFieldIfEmpty('admin-input-tipo', tipo)) filled.push('tipo');
        if (fillFieldIfEmpty('admin-input-fecha', fechaISO)) filled.push('fecha');
        if (fillFieldIfEmpty('admin-input-url', urlCanonica)) filled.push('URL');

        const fileNameEl = document.getElementById('admin-file-name');
        if (fileNameEl) {
            fileNameEl.textContent = `🌐 Nota DOF ${codNota}${nota.fecha ? ` (${nota.fecha})` : ''} — texto descargado del API`;
            fileNameEl.classList.remove('hidden');
        }
        document.getElementById('admin-btn-parse').disabled = false;

        displayAlert('success', 'Nota importada del DOF',
            `Texto descargado (${importedDofText.length.toLocaleString()} caracteres).` +
            (filled.length ? ` Se autocompletó: ${filled.join(', ')}.` : '') +
            ' Revisa los metadatos y presiona "Verificar y Preprocesar".');
    } catch (e) {
        displayAlert('error', 'Error al importar desde el DOF', e.message);
    } finally {
        if (btn) btn.disabled = false;
        spinner?.classList.add('hidden');
    }
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
    const revision = documentRevision;
    const titleInput = document.getElementById('admin-input-title').value.trim();
    const siglasInput = document.getElementById('admin-input-siglas').value.trim();
    if (!titleInput) {
        displayAlert('error', 'Falta el título', 'Por favor ingresa el título normativo.');
        return;
    }
    if (!importedFile && !importedDofText) return;
    try {
        const { data: leyes } = await supabase.from('leyes').select('titulo, siglas');
        if (revision !== documentRevision) return;
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
        const extraction = importedDofText !== null
            ? { text: importedDofText, emptyPages: [] }
            : await extractTextFromPDF(importedFile);
        if (revision !== documentRevision) return;
        const textContent = extraction.text;
        parsedSourceText = textContent;
        const parsed = parseRegulatoryText(textContent, { mode: document.getElementById('admin-structure-mode')?.value || 'auto' });
        parsedThemes = parsed.themes;
        parsedNotices = [...parsedNotices.filter(n => n.code === 'tablas'), ...parsed.notices];
        if (extraction.emptyPages.length) parsedNotices.push({ code: 'paginas_sin_texto', blocking: true,
            message: `Páginas sin texto extraíble: ${extraction.emptyPages.join(', ')}. Revisa si necesitan OCR antes de cargar.` });
        parsedChunks = parsed.chunks.map(c => ({ ...c, incluir: c.tipo !== 'complementario' }));
        renderPrevision(parsedChunks, parsedThemes);
    } catch (e) {
        displayAlert('error', 'Fallo de Parseo', e.message);
    } finally {
        document.getElementById('admin-btn-parse').disabled = false;
        document.getElementById('admin-loading-spinner').classList.add('hidden');
    }
}

async function extractTextFromPDF(file) {
    const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages = [];
    try {
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            pages.push({ items: content.items, height: page.getViewport({ scale: 1 }).height });
        }
        return reconstructPdfPages(pages);
    } finally { await pdf.destroy(); }
}

function escapePreview(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function renderPrevision(chunks, themes = []) {
    document.getElementById('admin-preview-area').classList.remove('hidden');
    const selected = chunks.filter(c => c.incluir !== false);
    document.getElementById('admin-preview-count').textContent = `${selected.length} de ${chunks.length}`;
    const diagnostics = validateRegulatoryChunks(selected, parsedNotices);
    const counts = selected.reduce((acc,c) => { acc[c.tipo] = (acc[c.tipo] || 0) + 1; return acc; }, {});
    const summary = document.getElementById('admin-review-summary');
    summary.innerHTML = `
        <p class="mb-3 font-semibold">${Object.entries(counts).map(([k,v]) => `${v} ${escapePreview(k)}`).join(' · ')} · ${themes.length} encabezados de estructura</p>
        ${diagnostics.length ? `<ul class="mb-3 rounded-lg bg-amber-50 p-4 text-amber-900">${diagnostics.map(d => `<li class="mb-2">${d.blocking ? 'Corregir: ' : 'Revisar: '}${escapePreview(d.message)}</li>`).join('')}</ul>` : ''}
        <label class="flex gap-2 items-start mb-3"><input type="checkbox" id="admin-review-confirm"><span>Revisé los fragmentos incluidos, su numeración y los avisos contra el documento original.</span></label>
        <details><summary class="cursor-pointer text-guinda">Consultar texto extraído de la fuente</summary><pre class="mt-3 p-4 bg-gray-50 text-xs whitespace-pre-wrap max-h-96 overflow-auto">${escapePreview(parsedSourceText)}</pre></details>`;
    const ingestButton = document.getElementById('admin-btn-ingest');
    ingestButton.disabled = true;
    document.getElementById('admin-review-confirm').onchange = e => {
        ingestButton.disabled = !e.target.checked || diagnostics.some(d => d.blocking);
    };
    const container = document.getElementById('admin-preview-cards');
    // Mostrar todos los fragmentos; el límite previo de 150 ocultaba parte del acervo.
    container.innerHTML = chunks.map((c,idx) => `<div class="p-4 border border-gray-200 rounded-xl bg-white">
        <label class="flex gap-2 text-xs mb-2"><input class="chunk-include" type="checkbox" data-index="${idx}" ${c.incluir !== false ? 'checked' : ''}>Incluir al guardar</label>
        <button type="button" class="chunk-card text-left w-full" data-index="${idx}">
        <div class="text-xs text-gray-500">${escapePreview([c.titulo_nombre,c.capitulo_nombre,c.seccion_nombre].filter(Boolean).join(' / '))}</div>
        <div class="text-sm font-bold text-guinda my-2">${escapePreview(c.identificador)} <span class="text-xs text-gray-500">(${escapePreview(c.tipo)})</span></div>
        <div class="text-xs text-gray-600 whitespace-pre-wrap line-clamp-4">${escapePreview(c.contenido)}</div>
        <span class="text-xs text-guinda mt-2 block">Ver completo y corregir</span></button></div>`).join('');
    container.querySelectorAll('.chunk-include').forEach(input => input.onchange = () => {
        parsedChunks[Number(input.dataset.index)].incluir = input.checked;
        renderPrevision(parsedChunks, parsedThemes);
    });
    let editingIndex = null;
    const modal = document.getElementById('edit-chunk-modal');
    const panel = document.getElementById('chunk-modal-panel');
    const content = document.getElementById('edit-chunk-content');
    const label = document.getElementById('chunk-modal-identificador');
    if (!document.getElementById('edit-chunk-label')) {
        const controls = document.createElement('div');
        controls.className = 'mb-3';
        controls.innerHTML = `<label class="block text-xs mb-1" for="edit-chunk-label">Identificador</label><input id="edit-chunk-label" class="w-full border rounded p-2 mb-2">
        <label class="block text-xs mb-1" for="edit-chunk-type">Tipo de fragmento</label><select id="edit-chunk-type" class="border rounded p-2">${['ordinario','transitorio','preambulo','anexo','complementario'].map(t=>`<option>${t}</option>`).join('')}</select>
        <div class="flex gap-2 mt-2"><button type="button" id="split-chunk" class="text-xs border rounded p-2">Dividir desde el cursor</button><button type="button" id="merge-chunk" class="text-xs border rounded p-2">Unir con el siguiente</button></div>`;
        content.before(controls);
    }
    const close = () => { modal.classList.add('hidden'); modal.classList.remove('flex'); };
    const commit = () => {
        const chunk = parsedChunks[editingIndex];
        chunk.contenido = content.value;
        chunk.identificador = document.getElementById('edit-chunk-label').value.trim();
        chunk.tipo = document.getElementById('edit-chunk-type').value;
    };
    container.querySelectorAll('.chunk-card').forEach(card => card.onclick = () => {
        editingIndex = Number(card.dataset.index);
        const chunk = parsedChunks[editingIndex];
        label.textContent = `Revisar: ${chunk.identificador}`;
        content.value = chunk.contenido;
        document.getElementById('edit-chunk-label').value = chunk.identificador;
        document.getElementById('edit-chunk-type').value = chunk.tipo;
        document.getElementById('merge-chunk').disabled = editingIndex === parsedChunks.length - 1;
        modal.classList.remove('hidden'); modal.classList.add('flex');
        panel.classList.remove('scale-95','opacity-0'); panel.classList.add('scale-100','opacity-100');
    });
    document.getElementById('close-chunk-modal').onclick = close;
    document.getElementById('cancel-chunk-edit').onclick = close;
    document.getElementById('save-chunk-edit').onclick = () => { commit(); close(); renderPrevision(parsedChunks, parsedThemes); };
    document.getElementById('split-chunk').onclick = () => {
        const at = content.selectionStart;
        if (!content.value.slice(0,at).trim() || !content.value.slice(at).trim()) return;
        commit();
        const original = parsedChunks[editingIndex];
        const remainder = { ...original, identificador: `${original.identificador} · continuación`, contenido: content.value.slice(at).trim() };
        original.contenido = content.value.slice(0,at).trim();
        parsedChunks.splice(editingIndex+1,0,remainder);
        close(); renderPrevision(parsedChunks, parsedThemes);
    };
    document.getElementById('merge-chunk').onclick = () => {
        if (editingIndex >= parsedChunks.length-1) return;
        commit();
        const next = parsedChunks[editingIndex+1];
        parsedChunks[editingIndex].contenido += `\n\n${next.identificador}\n${next.contenido}`;
        parsedChunks.splice(editingIndex+1,1);
        close(); renderPrevision(parsedChunks, parsedThemes);
    };
}

async function handleIngestToSupabase() {
    if (!parsedChunks.length) return;
    const selectedChunks = parsedChunks.filter(c => c.incluir !== false);
    const diagnostics = validateRegulatoryChunks(selectedChunks, parsedNotices);
    if (!isAdmin()) { displayAlert('error', 'Acceso requerido', 'Inicia sesión con una cuenta administradora para cargar instrumentos.'); return; }
    if (!document.getElementById('admin-review-confirm')?.checked || diagnostics.some(d => d.blocking)) {
        displayAlert('error', 'Revisión pendiente', 'Corrige los fragmentos señalados y confirma la revisión antes de guardar.');
        return;
    }
    const titleInput = document.getElementById('admin-input-title').value.trim();
    const btn = document.getElementById('admin-btn-ingest');
    btn.disabled = true;

    const wrapper = document.getElementById('admin-progress-wrapper');
    const textEl = document.getElementById('admin-progress-text');
    const pctEl = document.getElementById('admin-progress-pct');
    const barEl = document.getElementById('admin-progress-bar');

    try {
        if (wrapper) wrapper.classList.remove('hidden');
        if (barEl) barEl.style.width = '0%';
        if (pctEl) pctEl.textContent = '0%';
        if (textEl) textEl.textContent = 'Iniciando ingesta del instrumento...';

        const fechaInput = document.getElementById('admin-input-fecha')?.value.trim() || null;
        const { data: leyData, error: leyError } = await supabase.from('leyes').insert([{
            titulo: titleInput,
            siglas: document.getElementById('admin-input-siglas').value.trim() || null,
            tipo: document.getElementById('admin-input-tipo').value,
            url_original: document.getElementById('admin-input-url')?.value.trim() || null,
            fecha_publicacion: fechaInput
        }]).select();
        if (leyError) throw leyError;
        const newLeyId = leyData[0].id;

        // Relación "modifica a" si el usuario vinculó un instrumento existente.
        // No aborta la ingesta si falla (p. ej. tabla aún no creada).
        const modificaId = document.getElementById('admin-input-modifica')?.value || '';
        if (modificaId) {
            const tipoRel = document.getElementById('admin-input-modifica-tipo')?.value || 'modifica';
            const { error: relError } = await supabase.from('ley_relaciones').insert([{
                ley_afectada_id: modificaId,
                ley_nueva_id: newLeyId,
                tipo: tipoRel,
                fecha: fechaInput
            }]);
            if (relError) console.warn('[Admin] No se pudo registrar la relación:', relError.message);
        }

        if (barEl) barEl.style.width = '10%';
        if (pctEl) pctEl.textContent = '10%';
        if (textEl) textEl.textContent = 'Instrumento registrado, indexando estructura de temas...';

        // Inserción de temas extraídos
        if (parsedThemes && parsedThemes.length > 0) {
            const themeRows = parsedThemes.map(t => ({
                ley_id: newLeyId,
                nivel: t.nivel === 'subtitulo' ? 'seccion' : t.nivel, // Map subtitulo to seccion in DB
                nombre: t.nombre,
                orden: t.orden
            }));
            const { error: themeError } = await supabase.from('temas').insert(themeRows);
            if (themeError) throw themeError;
        }

        if (barEl) barEl.style.width = '20%';
        if (pctEl) pctEl.textContent = '20%';
        if (textEl) textEl.textContent = 'Temas indexados, subiendo artículos...';

        const totalChunks = selectedChunks.length;
        const batchSize = 50;
        for (let i = 0; i < totalChunks; i += batchSize) {
             const batch = selectedChunks.slice(i, i + batchSize).map((chunk, index) => ({
                ley_id: newLeyId,
                identificador: chunk.identificador,
                contenido: chunk.contenido,
                tipo_articulo: chunk.tipo,
                titulo_nombre: chunk.titulo_nombre || null,
                capitulo_nombre: chunk.capitulo_nombre || null,
                seccion_nombre: chunk.seccion_nombre || null,
                orden: i + index
            }));
            const { error: batchError } = await supabase.from('articulos').insert(batch);
            if (batchError) throw batchError;

            const uploadedCount = Math.min(i + batchSize, totalChunks);
            const progressPct = Math.round(20 + (uploadedCount / totalChunks) * 80);
            if (barEl) barEl.style.width = `${progressPct}%`;
            if (pctEl) pctEl.textContent = `${progressPct}%`;
            if (textEl) textEl.textContent = `Subiendo artículos: ${uploadedCount} de ${totalChunks}...`;
        }

        if (barEl) barEl.style.width = '100%';
        if (pctEl) pctEl.textContent = '100%';
        if (textEl) textEl.textContent = '¡Ingesta completada con éxito!';

        displayAlert('success', 'Ingesta Exitosa', 'El instrumento ha sido cargado con su estructura de temas.');
        setTimeout(() => location.reload(), 2000);
    } catch(e) {
        displayAlert('error', 'Error', e.message);
        if (wrapper) wrapper.classList.add('hidden');
        btn.disabled = false;
    }
}
