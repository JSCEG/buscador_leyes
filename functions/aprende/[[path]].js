import { serveSeoPage } from '../../server/seo.js';

/** /aprende/<tema>: «¿Cómo funciona?» topic with its own tags and text (server/seo.js). */
export const onRequestGet = context => serveSeoPage(context);
