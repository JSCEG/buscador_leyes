import { getAllLeyesAdmin, updateLaw, deleteLaw } from './search-engine.js';

export function initAdminManagement() {
    const tabIngest = document.getElementById('admin-tab-ingest');
    const tabManage = document.getElementById('admin-tab-manage');
    const ingestView = document.getElementById('admin-ingest-view');
    const manageView = document.getElementById('admin-manage-view');
    const lawsList = document.getElementById('admin-laws-list');
    const refreshBtn = document.getElementById('admin-refresh-laws');

    // Modals and form
    const editModal = document.getElementById('edit-law-modal');
    const editForm = document.getElementById('edit-law-form');
    const closeEditBtn = document.getElementById('close-edit-law-modal');
    const cancelEditBtn = document.getElementById('cancel-edit-law');

    if (!tabIngest || !tabManage) return;

    // Tab Switching
    tabIngest.addEventListener('click', () => {
        tabIngest.classList.add('bg-white', 'shadow-sm', 'text-guinda');
        tabIngest.classList.remove('text-gray-500');
        tabManage.classList.remove('bg-white', 'shadow-sm', 'text-guinda');
        tabManage.classList.add('text-gray-500');
        ingestView.classList.remove('hidden');
        manageView.classList.add('hidden');
    });

    tabManage.addEventListener('click', async () => {
        tabManage.classList.add('bg-white', 'shadow-sm', 'text-guinda');
        tabManage.classList.remove('text-gray-500');
        tabIngest.classList.remove('bg-white', 'shadow-sm', 'text-guinda');
        tabIngest.classList.add('text-gray-500');
        manageView.classList.remove('hidden');
        ingestView.classList.add('hidden');
        await loadLaws();
    });

    refreshBtn.addEventListener('click', loadLaws);

    // Load Laws
    async function loadLaws() {
        lawsList.innerHTML = '<tr><td colspan="5" class="py-12 text-center text-gray-400">Actualizando lista de instrumentos...</td></tr>';
        
        const laws = await getAllLeyesAdmin();
        
        if (laws.length === 0) {
            lawsList.innerHTML = '<tr><td colspan="5" class="py-12 text-center text-gray-400">No se encontraron instrumentos.</td></tr>';
            return;
        }

        lawsList.innerHTML = laws.map(law => `
            <tr class="hover:bg-gray-50/50 transition-colors group">
                <td class="px-6 py-4">
                    <div class="font-bold text-gray-900 leading-tight mb-1">${law.titulo}</div>
                    <div class="text-[10px] text-gray-400 flex items-center gap-2">
                        <span class="flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                            ${law.url_original ? `<a href="${law.url_original}" target="_blank" class="hover:text-guinda truncate max-w-[200px]">Ver en DOF</a>` : 'Sin enlace'}
                        </span>
                        <span class="w-1 h-1 bg-gray-200 rounded-full"></span>
                        <span>ID: ${law.id.substring(0, 8)}...</span>
                    </div>
                </td>
                <td class="px-4 py-4">
                    <span class="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-bold uppercase">${law.siglas || '—'}</span>
                </td>
                <td class="px-4 py-4 text-center">
                    <span class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getTypeBadgeClass(law.tipo)}">
                        ${law.tipo || 'otros'}
                    </span>
                </td>
                <td class="px-4 py-4 text-gray-500 font-mono text-[10px]">
                    ${law.fecha_publicacion || 'N/D'}
                </td>
                <td class="px-6 py-4 text-right">
                    <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button class="edit-btn p-1.5 text-gray-400 hover:text-guinda hover:bg-guinda/5 rounded-lg transition-all" data-id="${law.id}" title="Editar">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </button>
                        <button class="delete-btn p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" data-id="${law.id}" title="Eliminar">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Action listeners
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.id, laws));
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => handleDeleteLaw(btn.dataset.id));
        });
    }

    function getTypeBadgeClass(tipo) {
        switch (tipo?.toLowerCase()) {
            case 'ley': return 'bg-guinda/10 text-guinda';
            case 'reglamento': return 'bg-emerald-50 text-emerald-700';
            case 'acuerdo': return 'bg-amber-50 text-amber-700';
            case 'dacg': return 'bg-blue-50 text-blue-700';
            case 'nom': return 'bg-purple-50 text-purple-700';
            default: return 'bg-gray-100 text-gray-500';
        }
    }

    // Modal logic
    function openEditModal(id, laws) {
        const law = laws.find(l => l.id === id);
        if (!law) return;

        document.getElementById('edit-law-id').value = law.id;
        document.getElementById('edit-law-title').value = law.titulo;
        document.getElementById('edit-law-siglas').value = law.siglas || '';
        document.getElementById('edit-law-tipo').value = law.tipo || 'otros';
        document.getElementById('edit-law-url').value = law.url_original || '';
        document.getElementById('edit-law-temas').value = (law.temas_clave || []).join(', ');
        document.getElementById('edit-law-fecha-pub').value = law.fecha_publicacion || '';
        document.getElementById('edit-law-fecha-ref').value = law.fecha_ultima_reforma || '';

        editModal.classList.remove('hidden');
        editModal.classList.add('flex');
        setTimeout(() => {
            editModal.querySelector('div').classList.remove('scale-95', 'opacity-0');
            editModal.querySelector('div').classList.add('scale-100', 'opacity-100');
        }, 10);
    }

    function closeEditModal() {
        editModal.querySelector('div').classList.remove('scale-100', 'opacity-100');
        editModal.querySelector('div').classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            editModal.classList.add('hidden');
            editModal.classList.remove('flex');
            editForm.reset();
        }, 300);
    }

    closeEditBtn.addEventListener('click', closeEditModal);
    cancelEditBtn.addEventListener('click', closeEditModal);

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-law-id').value;
        const submitBtn = editForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;

        const payload = {
            titulo: document.getElementById('edit-law-title').value.trim(),
            siglas: document.getElementById('edit-law-siglas').value.trim() || null,
            tipo: document.getElementById('edit-law-tipo').value,
            url_original: document.getElementById('edit-law-url').value.trim() || null,
            temas_clave: document.getElementById('edit-law-temas').value.split(',').map(t => t.trim()).filter(t => t !== ''),
            fecha_publicacion: document.getElementById('edit-law-fecha-pub').value || null,
            fecha_ultima_reforma: document.getElementById('edit-law-fecha-ref').value || null
        };

        try {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Guardando...';
            
            await updateLaw(id, payload);
            
            submitBtn.innerText = '¡Guardado!';
            setTimeout(() => {
                closeEditModal();
                loadLaws();
            }, 500);
        } catch (error) {
            alert('Error al actualizar: ' + error.message);
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    });

    async function handleDeleteLaw(id) {
        if (!confirm('¿Estás seguro de que deseas eliminar este instrumento? Se eliminarán todos sus artículos asociados si el sistema lo permite.')) {
            return;
        }

        try {
            await deleteLaw(id);
            await loadLaws();
        } catch (error) {
            alert('No se pudo eliminar el instrumento. Posiblemente tenga artículos vinculados. Debe eliminarlos primero o contactar a soporte DB.');
        }
    }
}
