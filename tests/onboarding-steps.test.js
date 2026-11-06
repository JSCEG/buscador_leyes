import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { WELCOME_STEPS } from '../src/scripts/onboarding.js';

const page = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html');

describe('welcome tour steps', () => {
    it('follows the order of the side menu', () => {
        expect(WELCOME_STEPS.map(step => step.title)).toEqual([
            'Bienvenida al Buscador Jurídico', 'Buscar', 'Acervo', 'Análisis', 'Tu mesa de consulta',
        ]);
    });
    it('points every step at something visible on a desktop screen', () => {
        for (const step of WELCOME_STEPS.filter(item => item.target)) {
            const desktop = step.target.split(',')[0].trim();
            if (desktop === '#desk-toggle') continue; // Created when the desk starts.
            const element = page.querySelector(desktop);
            expect(element, step.title).not.toBeNull();
            // Inside a closed group it has no box and the step would lose its highlight.
            if (element.tagName !== 'SUMMARY') expect(element.closest('details:not([open])'), step.title).toBeNull();
        }
    });
    it('has a fallback for phones, where the desk and Analysis live under More', () => {
        for (const title of ['Análisis', 'Tu mesa de consulta']) {
            expect(WELCOME_STEPS.find(step => step.title === title).target).toContain('#bottom-nav [data-more]');
        }
    });
    it('speaks plainly to the public', () => {
        const copy = WELCOME_STEPS.map(step => `${step.title} ${step.text}`).join(' ').toLowerCase();
        for (const jargon of ['instrumento', 'disposiciones', 'colección']) expect(copy).not.toContain(jargon);
    });
});
