export function initHeroEmblem() {
    const hero = document.getElementById('hero-section');
    const object = hero?.querySelector('.hero-emblem-object');
    if (!hero || !object) return;

    const interactive = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    if (!interactive.matches) return;

    let frame = 0;
    hero.addEventListener('pointermove', event => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
            const rect = hero.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            object.style.setProperty('--hero-ry', `${-16 + x * 12}deg`);
            object.style.setProperty('--hero-rx', `${-8 - y * 10}deg`);
            frame = 0;
        });
    });
    hero.addEventListener('pointerleave', () => {
        cancelAnimationFrame(frame);
        frame = 0;
        object.style.removeProperty('--hero-ry');
        object.style.removeProperty('--hero-rx');
    });
}
