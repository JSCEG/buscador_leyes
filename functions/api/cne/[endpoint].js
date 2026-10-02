import { serveCne } from '../../../server/cne-proxy.js';

export const onRequest = ({ request, params }) => serveCne(request, params.endpoint);
