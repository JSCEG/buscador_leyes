/**
 * The authority shown on a document's cover. Each logo is an official file in public/img/instituciones/,
 * registered here once it exists; without a file the cover shows the authority's short name.
 */
import { issuerOf } from './issuer.js';

export const ISSUER_LOGOS = Object.freeze({});

/** @returns {{ id: string, short: string, label: string, logo: string|null }|null} null when the document does not say */
export function issuerMark(law, logos = ISSUER_LOGOS) {
    const issuer = issuerOf(law);
    if (!issuer || issuer.id === 'otra') return null;
    return { id: issuer.id, short: issuer.short, label: issuer.label, logo: logos[issuer.id] || null };
}
