import { afterEach, describe, expect, it, vi } from 'vitest';
import { lockLabel, requireAccount } from '../src/lib/require-account.js';
import { isLoggedIn } from '../src/scripts/auth.js';

vi.mock('../src/scripts/auth.js', () => ({ isLoggedIn: vi.fn(() => false) }));
vi.mock('../src/scripts/site-dialogs.js', () => ({
  openDialog: html => { const wrap = document.createElement('div'); wrap.innerHTML = html; document.body.append(wrap); return { wrap, close: () => wrap.remove() }; },
}));

describe('require account', () => {
  afterEach(() => { document.body.innerHTML = ''; isLoggedIn.mockReturnValue(false); });

  it('asks for an account to save, without losing the rules', () => {
    expect(requireAccount('guardar', { reason: 'guardar' })).toBe(false);
    expect(document.querySelector('.sd-primary').textContent).toBe('Crear cuenta');
    expect(document.body.textContent).toContain('Fijar en tu mesa sigue abierto sin cuenta');
  });
  it('keeps the download message by default', () => {
    requireAccount('descargar');
    expect(document.body.textContent).toContain('Excel y PowerPoint');
  });
  it('passes when signed in and shows no lock', () => {
    isLoggedIn.mockReturnValue(true);
    expect(requireAccount('guardar', { reason: 'guardar' })).toBe(true);
    expect(lockLabel('Guardar')).toBe('Guardar');
  });
  it('marks the label with a lock when signed out', () => { expect(lockLabel('Guardar')).toContain('ra-lock'); });
});
