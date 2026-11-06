/**
 * The version on the app icon links. It comes from the content of the icons, so new icons always get
 * new links, and installed apps and browsers notice the change.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const ICON_FILES = ['favicon-64.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
const ICON_LINK = new RegExp(`(/img/(?:${ICON_FILES.join('|').replace(/\./g, '\\.')}))\\?v=[\\w-]+`, 'g');

export function iconVersion(root) {
    const hash = createHash('sha256');
    for (const name of ICON_FILES) hash.update(readFileSync(new URL(`public/img/${name}`, root)));
    return hash.digest('hex').slice(0, 10);
}

export const stampIconVersion = (text, version) => text.replace(ICON_LINK, `$1?v=${version}`);

/** Every version written on the icon links of a text. */
export const iconVersionsIn = text => [...text.matchAll(ICON_LINK)].map(match => match[0].split('?v=')[1]);
