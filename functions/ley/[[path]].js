import { serveSeoPage } from '../../server/seo.js';

/** /ley/<siglas> and /ley/<siglas>/<disposición>: app page with its own tags and text (server/seo.js). */
export const onRequestGet = context => serveSeoPage(context);
