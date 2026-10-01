/**
 * Full-title tooltip for cards ([data-tip]) that sits above the card (or below when there is no
 * room), so it never covers the card or its gliding text. Mouse only; touch has the marquee.
 */
const DELAY = 450;
const GAP = 10;

export function initCardTip(root = document) {
    const tip = document.createElement('div');
    tip.id = 'card-tip';
    tip.setAttribute('role', 'tooltip');
    tip.hidden = true;
    document.body.append(tip);
    let timer = 0;
    let current = null;

    const hide = () => { clearTimeout(timer); timer = 0; current = null; tip.hidden = true; };
    const place = card => {
        const r = card.getBoundingClientRect();
        tip.style.maxWidth = `${Math.min(420, window.innerWidth - 24)}px`;
        tip.hidden = false;
        const t = tip.getBoundingClientRect();
        const above = r.top - GAP - t.height >= 8;
        const top = above ? r.top - GAP - t.height : Math.min(r.bottom + GAP, window.innerHeight - t.height - 8);
        const left = Math.max(12, Math.min(r.left + r.width / 2 - t.width / 2, window.innerWidth - t.width - 12));
        tip.style.top = `${Math.round(top)}px`;
        tip.style.left = `${Math.round(left)}px`;
        tip.dataset.side = above ? 'top' : 'bottom';
    };

    root.addEventListener('pointerover', event => {
        if (event.pointerType === 'touch') return;
        const card = event.target.closest?.('[data-tip]');
        if (!card || card === current) return;
        hide();
        current = card;
        timer = setTimeout(() => { if (current === card) { tip.textContent = card.dataset.tip; place(card); } }, DELAY);
    });
    root.addEventListener('pointerout', event => {
        const card = event.target.closest?.('[data-tip]');
        if (card && !card.contains(event.relatedTarget)) hide();
    });
    window.addEventListener('scroll', hide, { passive: true, capture: true });
    root.addEventListener('pointerdown', hide);
}
