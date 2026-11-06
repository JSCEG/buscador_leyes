/**
 * What fits on the cover of the small book in the search results. It holds about eight capitals, and
 * the full acronym is always written beside the book, so a long one gives its first word instead of
 * being cut. With no word that fits, the book shows the collection icon.
 */
const FITS = 8;
const LARGE_UP_TO = 5;
const fit = text => ({ text, size: text.length <= LARGE_UP_TO ? 'l' : 's' });

export function miniBookLabel(siglas) {
    const value = String(siglas ?? '').trim();
    if (value && value.length <= FITS) return fit(value);
    const first = value.split(/[-\s/]/)[0];
    return first && first.length <= FITS ? fit(first) : { text: '', size: '' };
}
