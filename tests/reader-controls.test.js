import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const key = 'sener-reader-preferences-v1';
let controls;
let controller;

beforeEach(async () => {
    vi.resetModules();
    controls = await import('../src/scripts/reader-controls.js');
    localStorage.removeItem(key);
    document.body.innerHTML = '';
    document.body.className = '';
    document.documentElement.removeAttribute('style');
    document.documentElement.removeAttribute('data-reader-surface');
    document.documentElement.className = '';
    controller = null;
});

afterEach(() => {
    controller?.destroy();
    localStorage.removeItem(key);
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('style');
    document.documentElement.removeAttribute('data-reader-surface');
    document.documentElement.className = '';
});

function setSelect(selector, value) {
    const select = document.querySelector(selector);
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
}

it('keeps full-instrument and article controls synchronized and persists their shared values', () => {
    localStorage.setItem(key, JSON.stringify({ fontSize: 24, lineHeight: 2, surface: 'sepia' }));
    document.body.innerHTML = `<section id="instrument">${controls.readerControlsHtml()}</section><section id="article">${controls.readerControlsHtml()}</section>`;
    controller = controls.initReaderControls();
    expect([...document.querySelectorAll('[data-reader-size-output]')].map(output => output.textContent)).toEqual(['24 px', '24 px']);
    document.querySelector('#instrument [data-reader-size="2"]').click();
    expect([...document.querySelectorAll('[data-reader-size-output]')].map(output => output.textContent)).toEqual(['26 px', '26 px']);
    setSelect('#article [data-reader-spacing]', '1.6');
    setSelect('#article [data-reader-surface]', 'dark');
    expect(document.querySelector('#instrument [data-reader-spacing]').value).toBe('1.6');
    expect(document.querySelector('#instrument [data-reader-surface]').value).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--reader-font-size')).toBe('26px');
    expect(document.documentElement.style.getPropertyValue('--reader-line-height')).toBe('1.6');
    expect(document.documentElement.dataset.readerSurface).toBe('dark');
    expect(JSON.parse(localStorage.getItem(key))).toEqual({ fontSize: 26, lineHeight: 1.6, surface: 'dark' });
});

it('bounds the size controls, exposes their disabled state and resets all reading preferences', () => {
    document.body.innerHTML = controls.readerControlsHtml();
    controller = controls.initReaderControls();
    const increase = document.querySelector('[data-reader-size="2"]');
    const decrease = document.querySelector('[data-reader-size="-2"]');
    for (let step = 0; step < 20; step++) increase.click();
    expect(document.querySelector('[data-reader-size-output]').textContent).toBe('28 px');
    expect(increase.disabled).toBe(true);
    expect(decrease.disabled).toBe(false);
    for (let step = 0; step < 20; step++) decrease.click();
    expect(document.querySelector('[data-reader-size-output]').textContent).toBe('14 px');
    expect(decrease.disabled).toBe(true);
    setSelect('[data-reader-spacing]', '2');
    setSelect('[data-reader-surface]', 'sepia');
    document.querySelector('[data-reader-reset]').click();
    expect(JSON.parse(localStorage.getItem(key))).toEqual({ fontSize: 18, lineHeight: 1.8, surface: 'system' });
    expect(document.querySelector('[data-reader-size-output]').textContent).toBe('18 px');
    expect(increase.disabled || decrease.disabled).toBe(false);
});

it('never changes root rem sizing, body backgrounds or the global dark theme', () => {
    document.body.className = 'bg-sepia';
    document.documentElement.className = 'dark-mode';
    document.documentElement.style.fontSize = '17px';
    document.documentElement.style.lineHeight = '1.3';
    document.body.innerHTML = controls.readerControlsHtml();
    controller = controls.initReaderControls();
    document.querySelector('[data-reader-size="2"]').click();
    setSelect('[data-reader-surface]', 'light');
    expect(document.documentElement.style.fontSize).toBe('17px');
    expect(document.documentElement.style.lineHeight).toBe('1.3');
    expect(document.documentElement.className).toBe('dark-mode');
    expect(document.body.className).toBe('bg-sepia');
    expect(document.documentElement.dataset.readerSurface).toBe('light');
});

it('hydrates newly opened article controls and removes listeners when destroyed', () => {
    document.body.innerHTML = `<section id="instrument">${controls.readerControlsHtml()}</section>`;
    controller = controls.initReaderControls();
    document.querySelector('[data-reader-size="2"]').click();
    document.body.insertAdjacentHTML('beforeend', `<section id="new-article">${controls.readerControlsHtml()}</section>`);
    controller.sync();
    expect(document.querySelector('#new-article [data-reader-size-output]').textContent).toBe('20 px');
    controller.destroy();
    document.querySelector('#new-article [data-reader-size="2"]').click();
    expect(document.querySelector('#new-article [data-reader-size-output]').textContent).toBe('20 px');
    expect(JSON.parse(localStorage.getItem(key)).fontSize).toBe(20);
});
