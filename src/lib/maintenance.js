import './maintenance.css';
import { acervoHealth } from './service-availability.js';

export function initMaintenance({ probe = () => acervoHealth(import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY), resume = () => location.reload() } = {}) {
    const dialog = document.querySelector('#service-maintenance');
    const retry = dialog.querySelector('button');
    const status = dialog.querySelector('[role="status"]');
    let checking = false;
    let timer;
    let lastCheck = 0;
    const relevant = () => !/^#(?:como-funciona|permisos|polos|calculadora|ayuda|no-encontrado)/.test(location.hash)
        && !/^\/instalar\/?$/.test(location.pathname);

    async function check() {
        if (checking || (!dialog.open && !relevant())) return;
        clearTimeout(timer);
        if (navigator.onLine === false) {
            if (dialog.open) status.textContent = 'Tu dispositivo está sin conexión.';
            return;
        }
        checking = true;
        lastCheck = Date.now();
        retry.disabled = true;
        if (dialog.open) status.textContent = 'Comprobando el servicio…';
        try {
            const result = await probe();
            if (result === 'up' && dialog.open) { resume(); return; }
            if (result === 'down' && relevant() && navigator.onLine !== false && !dialog.open) dialog.showModal();
            if (dialog.open) {
                status.textContent = navigator.onLine === false ? 'Tu dispositivo está sin conexión.'
                    : 'Volveremos a comprobarlo en 30 segundos.';
                timer = setTimeout(check, 30000);
            }
        } finally { checking = false; retry.disabled = false; }
    }
    const suspect = () => {
        if (!dialog.open && Date.now() - lastCheck > 8000) void check();
    };
    retry.addEventListener('click', check);
    dialog.addEventListener('cancel', event => event.preventDefault());
    window.addEventListener('acervo:check-service', suspect);
    window.addEventListener('online', () => { if (dialog.open) void check(); });
}
