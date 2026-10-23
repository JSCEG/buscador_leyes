import { servePermisos } from '../../../server/permisos-proxy.js';

// PERMISOS_API_KEY: secreto de Pages (wrangler pages secret put). PERMISOS_API_URL permite apuntar a otra instancia.
export const onRequest = ({ request, params, env }) => servePermisos(request, params.endpoint, { key: env?.PERMISOS_API_KEY, base: env?.PERMISOS_API_URL });
