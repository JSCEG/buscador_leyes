import { serveMapa } from '../../../server/mapa-proxy.js';

// DGMESNIE_URL (variable de entorno de Pages) permite apuntar a otra instancia sin cambiar código.
export const onRequest = ({ request, params, env }) => serveMapa(request, params.endpoint, { base: env?.DGMESNIE_URL });
