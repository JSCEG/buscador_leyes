import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/scripts/search-engine.js', () => ({
    getAllLeyesAdmin: vi.fn(async () => [{
        id: '12345678-abcd', titulo: '<img src=x onerror=alert(1)>',
        siglas: '<svg onload=alert(1)>', tipo: '<img src=x>',
        url_original: 'javascript:alert(1)', fecha_publicacion: '<img src=x>'
    }]),
    updateLaw: vi.fn(), deleteLaw: vi.fn()
}));

import { initAdminManagement } from '../src/scripts/admin-management.js';
import { safeAdminUrl } from '../src/lib/admin-safety.js';

describe('administración segura', () => {
    it('muestra metadatos como texto, rechaza enlaces peligrosos y mantiene visibles las acciones', async () => {
        document.body.innerHTML = `<button id="admin-tab-ingest"></button><button id="admin-tab-manage"></button>
            <div id="admin-ingest-view"></div><div id="admin-manage-view"></div><table><tbody id="admin-laws-list"></tbody></table>
            <button id="admin-refresh-laws"></button><div id="edit-law-modal"><div></div></div>
            <form id="edit-law-form"></form><button id="close-edit-law-modal"></button><button id="cancel-edit-law"></button>`;
        initAdminManagement();
        document.getElementById('admin-tab-manage').click();
        await vi.waitFor(() => expect(document.querySelector('.edit-btn')).not.toBeNull());
        const list = document.getElementById('admin-laws-list');
        expect(list.querySelector('img, svg[onload], a')).toBeNull();
        expect(list.textContent).toContain('<img src=x onerror=alert(1)>');
        const actions = list.querySelector('.edit-btn').parentElement;
        expect(actions.className).not.toContain('opacity-0');
        expect(list.querySelector('.edit-btn').getAttribute('aria-label')).toBe('Editar instrumento');
    });

    it('acepta únicamente direcciones HTTP y HTTPS absolutas', () => {
        expect(safeAdminUrl('https://dof.gob.mx/')).toBe('https://dof.gob.mx/');
        expect(safeAdminUrl('javascript:alert(1)')).toBe('');
        expect(safeAdminUrl('//otro.example')).toBe('');
    });
});
