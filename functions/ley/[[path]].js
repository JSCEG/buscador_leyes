import { serveSeoPage } from '../../server/seo.js';

/** /ley/<siglas> and /ley/<siglas>/<disposición>: app page with its own tags and text (server/seo.js). */
export const onRequestGet = context => serveSeoPage(context);

/** HEAD: same status and headers as GET, without the page. */
export const onRequestHead = async context => { const response = await serveSeoPage(context); return new Response(null, { status: response.status, headers: response.headers }); };
