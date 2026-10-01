/**
 * Text that does not fit glides to show the rest, pauses, and comes back (like long titles on
 * YouTube). One-line titles glide sideways; clamped blocks (card descriptions) glide upward.
 * It runs while the pointer is over the title or its card, on keyboard focus, and on its own
 * when visible on touch screens. Speed is constant so short and long overflows feel the same.
 */
import '../styles/marquee.css';

// Horizontal: one line with an ellipsis at rest.
export const MARQUEE_SELECTOR = [
    '#law-articles-list .lr-card-label',
    '#detail-modal .reader-nav-destination > span',
    '.desk-card-head h3',
    '.ac-library .ac-card.has-name .ac-card-name',
].join(', ');
// Vertical: a fixed number of lines at rest.
export const MARQUEE_Y_SELECTOR = '.ac-library .ac-card .ac-card-title';
// Hovering anywhere on these starts the glide of the texts inside them.
const HOSTS = '.ac-card, #law-articles-list > div, .desk-card';
const ALL = `${MARQUEE_SELECTOR}, ${MARQUEE_Y_SELECTOR}`;

const SPEED_X = 45;    // px per second: a comfortable reading pace
const SPEED_Y = 15;    // px per second for multi-line blocks
const PAUSE = 1.2;     // seconds held at each end

const reduced = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const touch = () => globalThis.matchMedia?.('(hover: none)').matches;

function prepare(el) {
    if (el.dataset.mq) return el.querySelector(':scope > .mq-track');
    el.dataset.mq = '1';
    el.classList.add(el.matches(MARQUEE_Y_SELECTOR) ? 'mqy' : 'mq');
    const track = document.createElement('span');
    track.className = 'mq-track';
    track.append(...el.childNodes);
    el.append(track);
    return track;
}

function start(el) {
    if (reduced()) return;
    const track = prepare(el);
    const vertical = el.classList.contains('mqy');
    const overflow = vertical ? track.scrollHeight - el.clientHeight : track.scrollWidth - el.clientWidth;
    if (overflow <= 4) { stop(el); return; }
    // Starts moving after 0.4 s; 79% of the loop moves (there and back), the rest holds at the ends.
    const speed = vertical ? SPEED_Y : SPEED_X;
    const total = Math.max((2 * overflow) / speed / 0.79, PAUSE / 0.16);
    el.style.setProperty('--mq-shift', `${-overflow - (vertical ? 2 : 6)}px`);
    el.style.setProperty('--mq-dur', `${total.toFixed(2)}s`);
    el.classList.add('mq-run');
}

function stop(el) {
    el.classList.remove('mq-run');
}

const targetsOf = node => {
    const host = node?.closest?.(HOSTS);
    if (host) return [...host.querySelectorAll(ALL)];
    const own = node?.closest?.(ALL);
    return own ? [own] : [];
};

export function initMarquee(root = document) {
    const mark = () => root.querySelectorAll(ALL).forEach(prepare);
    mark();
    new MutationObserver(mark).observe(root.body || root, { childList: true, subtree: true });

    root.addEventListener('pointerover', event => {
        if (event.pointerType === 'touch') return;
        const scope = event.target.closest?.(HOSTS) || event.target.closest?.(ALL);
        if (scope && !scope.contains(event.relatedTarget)) targetsOf(event.target).forEach(start);
    });
    root.addEventListener('pointerout', event => {
        const scope = event.target.closest?.(HOSTS) || event.target.closest?.(ALL);
        if (scope && !scope.contains(event.relatedTarget)) targetsOf(event.target).forEach(stop);
    });
    root.addEventListener('focusin', event => targetsOf(event.target).forEach(start));
    root.addEventListener('focusout', event => targetsOf(event.target).forEach(stop));

    // Touch screens have no hover: glide the ones that are fully on screen.
    if (touch() && 'IntersectionObserver' in globalThis) {
        const seen = new WeakSet();
        const io = new IntersectionObserver(entries => entries.forEach(entry => {
            if (entry.isIntersecting) start(entry.target); else stop(entry.target);
        }), { threshold: 0.9 });
        const watch = () => root.querySelectorAll(ALL).forEach(el => {
            if (!seen.has(el)) { seen.add(el); io.observe(el); }
        });
        watch();
        new MutationObserver(watch).observe(root.body || root, { childList: true, subtree: true });
    }
}
