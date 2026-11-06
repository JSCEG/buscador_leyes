import { beforeEach, describe, expect, it } from 'vitest';
import { folderHtml } from '../src/lib/folder-html.js';

const SHEETS = [{ id: 'a', label: 'LSE' }, { id: 'b', label: 'LSH' }, { id: 'c', label: 'LCNE' }, { id: 'd', label: 'LPTE' }];

describe('folder', () => {
  let host;
  beforeEach(() => { document.body.innerHTML = '<div id="h"></div>'; host = document.getElementById('h'); });

  it('shows the count and three sheets', () => {
    host.innerHTML = folderHtml({ group: 'leyes', label: 'Leyes', count: 11, sheets: SHEETS, open: false });
    expect(host.querySelectorAll('[data-sheet-doc]')).toHaveLength(3);
    expect(host.querySelector('[aria-pressed]').textContent).toContain('11');
    expect(host.querySelector('[data-folder="leyes"]').dataset.category).toBe('leyes');
  });
  it('keeps closed sheets out of the tab order', () => {
    host.innerHTML = folderHtml({ group: 'leyes', label: 'Leyes', count: 11, sheets: SHEETS, open: false });
    expect(host.querySelector('[data-sheet-doc]').tabIndex).toBe(-1);
    host.innerHTML = folderHtml({ group: 'leyes', label: 'Leyes', count: 11, sheets: SHEETS, open: true });
    expect(host.querySelector('[data-sheet-doc]').tabIndex).toBe(0);
    expect(host.querySelector('[aria-pressed]').getAttribute('aria-pressed')).toBe('true');
  });
  it('says one document in the singular and escapes data', () => {
    host.innerHTML = folderHtml({ group: 'otros', label: '<b>', count: 1, sheets: [{ id: '"x', label: '<i>' }] });
    expect(host.querySelector('[aria-pressed]').textContent).toContain('1 documento');
    expect(host.querySelector('[aria-pressed]').textContent).not.toContain('documentos');
    expect(host.querySelector('i')).toBeNull();
  });
  it('survives a folder without sheets', () => {
    host.innerHTML = folderHtml({ group: 'otros', label: 'Otros', count: 0 });
    expect(host.querySelectorAll('[data-sheet-doc]')).toHaveLength(0);
  });
});
