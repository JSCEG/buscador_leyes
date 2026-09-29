/**
 * Thin progress bar at the top of the page for any wait the user started (opening a law, an
 * article, a search, a lazy view). Several waits can overlap; the bar stays until the last ends.
 * It only appears after a short delay, so instant answers do not flash.
 */
import '../styles/nav-progress.css';

const SHOW_DELAY = 120;
const PILL_DELAY = 450;   // longer waits also get a visible "Cargando…" chip
let active = 0;
let bar = null;
let pill = null;
let showTimer = null;
let pillTimer = null;
let hideTimer = null;

function ensureBar() {
    if (bar?.isConnected) return bar;
    bar = document.createElement('div');
    bar.id = 'nav-progress';
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<span class="np-fill"></span>';
    document.body.append(bar);
    return bar;
}

function ensurePill() {
    if (pill?.isConnected) return pill;
    pill = document.createElement('div');
    pill.id = 'nav-progress-pill';
    pill.setAttribute('role', 'status');
    pill.innerHTML = '<span class="np-spinner" aria-hidden="true"></span><span>Cargando…</span>';
    document.body.append(pill);
    return pill;
}

function setBusy(busy) {
    document.documentElement.classList.toggle('is-loading', busy);
    const main = document.getElementById('main-container');
    if (main) {
        if (busy) main.setAttribute('aria-busy', 'true');
        else main.removeAttribute('aria-busy');
    }
}

function begin() {
    clearTimeout(hideTimer);
    setBusy(true);
    showTimer = setTimeout(() => {
        const el = ensureBar();
        el.classList.remove('np-done');
        void el.offsetWidth;            // restart the animation from zero
        el.classList.add('np-active');
    }, SHOW_DELAY);
    pillTimer = setTimeout(() => ensurePill().classList.add('np-active'), PILL_DELAY);
}

function end() {
    clearTimeout(showTimer);
    clearTimeout(pillTimer);
    pill?.classList.remove('np-active');
    setBusy(false);
    if (!bar?.classList.contains('np-active')) return;
    bar.classList.add('np-done');
    hideTimer = setTimeout(() => bar?.classList.remove('np-active', 'np-done'), 400);
}

/** Starts a wait and returns the function that ends it (safe to call more than once). */
export function startProgress() {
    active += 1;
    if (active === 1) begin();
    let finished = false;
    return () => {
        if (finished) return;
        finished = true;
        active = Math.max(0, active - 1);
        if (active === 0) end();
    };
}

/** Shows the bar while a promise (or the promise returned by fn) is pending. */
export async function withProgress(work) {
    const done = startProgress();
    try {
        return await (typeof work === 'function' ? work() : work);
    } finally {
        done();
    }
}

/** For tests. */
export function progressState() {
    return { active, visible: Boolean(bar?.classList.contains('np-active')) };
}
