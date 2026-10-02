/**
 * Reading progress: a thin line that fills as the reader scrolls — under the reader toolbar for the
 * article being read, and at the top of the window while reading a whole instrument (Documento tab).
 * Decorative: the position is already given by the scrollbar, so it is hidden from assistive tech.
 */
import '../styles/reading-progress.css';

const clamp = value => Math.max(0, Math.min(1, value));

function makeBar(className) {
    const bar = document.createElement('div');
    bar.className = `read-progress ${className}`;
    bar.setAttribute('aria-hidden', 'true');
    bar.innerHTML = '<span></span>';
    return bar;
}

function paint(bar, fraction) {
    bar.firstChild.style.transform = `scaleX(${fraction.toFixed(4)})`;
    bar.classList.toggle('is-idle', fraction <= 0);
}

export function initReadingProgress() {
    // Article reader: the text box scrolls on its own.
    const scroller = document.getElementById('modal-content');
    const toolbar = document.querySelector('#modal-panel .reader-toolbar');
    if (scroller && toolbar) {
        const bar = makeBar('read-progress-reader');
        toolbar.append(bar);
        let frame = 0;
        const update = () => {
            frame = 0;
            const room = scroller.scrollHeight - scroller.clientHeight;
            paint(bar, room > 8 ? clamp(scroller.scrollTop / room) : 0);
        };
        const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
        scroller.addEventListener('scroll', schedule, { passive: true });
        // A new article starts at the top.
        new MutationObserver(schedule).observe(scroller, { childList: true });
        window.addEventListener('resize', schedule);
    }

    // Whole instrument: the page scrolls while the Documento tab is open.
    const pageBar = makeBar('read-progress-page');
    document.body.append(pageBar);
    let frame = 0;
    const update = () => {
        frame = 0;
        const list = document.getElementById('law-articles-list');
        if (!document.body.classList.contains('law-reading') || !list) { pageBar.hidden = true; return; }
        const rect = list.getBoundingClientRect();
        const total = rect.height - window.innerHeight * 0.6;
        pageBar.hidden = false;
        paint(pageBar, total > 0 ? clamp(-rect.top / total) : 0);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    // Capture: the page may scroll inside a container rather than the window.
    document.addEventListener('scroll', schedule, { passive: true, capture: true });
    window.addEventListener('resize', schedule);
    new MutationObserver(schedule).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    schedule();
}
