/**
 * Titles that do not fit stay on one line with an ellipsis and glide to their end, pause and come
 * back (like long titles on YouTube): on hover/focus with a mouse, on their own when visible on
 * touch screens. Speed is constant (~60 px/s) so short and long overflows feel the same.
 */
import '../styles/marquee.css';

export const MARQUEE_SELECTOR = '#law-articles-list .lr-card-label, #detail-modal .reader-nav-destination > span, .desk-card-head h3';
const SPEED = 60;      // px per second
const PAUSE = 1.2;     // seconds held at each end

const reduced = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const touch = () => globalThis.matchMedia?.('(hover: none)').matches;

function prepare(el) {
    if (el.dataset.mq) return el.querySelector(':scope > .mq-track');
    el.dataset.mq = '1';
    el.classList.add('mq');
    const track = document.createElement('span');
    track.className = 'mq-track';
    track.append(...el.childNodes);
    el.append(track);
    return track;
}

function start(el) {
    if (reduced()) return;
    const track = prepare(el);
    const overflow = track.scrollWidth - el.clientWidth;
    if (overflow <= 4) { stop(el); return; }
    // Keyframes: 30% of the loop holds at each end, 60% moves (there and back).
    const total = Math.max((2 * overflow) / SPEED / 0.6, PAUSE / 0.15);
    el.style.setProperty('--mq-shift', `${-overflow - 6}px`);
    el.style.setProperty('--mq-dur', `${total.toFixed(2)}s`);
    el.classList.add('mq-run');
}

function stop(el) {
    el.classList.remove('mq-run');
}

export function initMarquee(root = document) {
    // Every matching label starts truncated, so it is clear there is more to read.
    const mark = () => root.querySelectorAll(MARQUEE_SELECTOR).forEach(prepare);
    mark();
    new MutationObserver(mark).observe(root.body || root, { childList: true, subtree: true });

    root.addEventListener('pointerover', event => {
        if (event.pointerType === 'touch') return;
        const el = event.target.closest?.(MARQUEE_SELECTOR);
        if (el && !el.contains(event.relatedTarget)) start(el);
    });
    root.addEventListener('pointerout', event => {
        const el = event.target.closest?.(MARQUEE_SELECTOR);
        if (el && !el.contains(event.relatedTarget)) stop(el);
    });
    root.addEventListener('focusin', event => {
        const el = event.target.closest?.(MARQUEE_SELECTOR) || event.target.querySelector?.(MARQUEE_SELECTOR);
        if (el) start(el);
    });
    root.addEventListener('focusout', event => {
        const el = event.target.closest?.(MARQUEE_SELECTOR) || event.target.querySelector?.(MARQUEE_SELECTOR);
        if (el) stop(el);
    });

    // Touch screens have no hover: scroll the ones that are on screen.
    if (touch() && 'IntersectionObserver' in globalThis) {
        const seen = new WeakSet();
        const io = new IntersectionObserver(entries => entries.forEach(entry => {
            if (entry.isIntersecting) start(entry.target); else stop(entry.target);
        }), { threshold: 0.9 });
        const watch = () => root.querySelectorAll(MARQUEE_SELECTOR).forEach(el => {
            if (!seen.has(el)) { seen.add(el); io.observe(el); }
        });
        watch();
        new MutationObserver(watch).observe(root.body || root, { childList: true, subtree: true });
    }
}
