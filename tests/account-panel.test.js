import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initAccountPanel } from '../src/scripts/account-panel.js';

vi.mock('../src/scripts/auth.js', () => ({
  getCurrentUser: () => ({ created_at: '2026-03-23T12:00:00Z', last_sign_in_at: '2026-11-06T12:00:00Z', user_metadata: { full_name: 'Ana Pérez' } }),
  onAuthChange: () => {},
  updateDisplayName: vi.fn(),
  updatePassword: vi.fn(),
  verifyCurrentPassword: vi.fn(),
}));

const html = readFileSync('index.html', 'utf8');
const accountBlock = () => html.slice(html.indexOf('id="auth-logged-in"'), html.indexOf('<!-- Main Search Area -->'));

describe('account window', () => {
  it('uses the Búho system, not the previous components', () => {
    expect(accountBlock()).not.toMatch(/bux-usermenu|bux-avatar|bux-menu/);
    expect(readFileSync('src/styles/design/buho/components.css', 'utf8')).not.toMatch(/bux-usermenu|#account-panel|#auth-panel/);
  });
  it('each count opens what it counts, so there are no separate links to the same places', () => {
    const shortcuts = [...accountBlock().matchAll(/data-account-go="(\w+)"[^>]*>\s*<b data-account-count="(\w+)"/g)].map(match => [match[2], match[1]]);
    expect(shortcuts).toEqual([['saved', 'favorites'], ['desks', 'desk'], ['notes', 'favorites']]);
  });

  describe('details and security', () => {
    let panel;
    beforeEach(() => {
      document.body.innerHTML = '<div id="auth-logged-in"><nav class="bu-cuenta-accesos"></nav><p id="auth-user-email"></p><button id="after"></button></div>';
      initAccountPanel();
      panel = document.getElementById('account-panel');
    });

    it('sits right after the shortcuts and fills in the reader', () => {
      expect(document.querySelector('.bu-cuenta-accesos').nextElementSibling).toBe(panel);
      expect(panel.querySelector('#ap-name-input').value).toBe('Ana Pérez');
      expect(panel.querySelector('[data-fact="since"]').textContent).toContain('2026');
    });
    it('switches sections with the Búho segmented control', () => {
      const tabs = panel.querySelector('.bu-cuenta-tabs');
      expect(tabs.classList.contains('bu-seg')).toBe(true);
      panel.querySelector('#ap-tab-seguridad').click();
      expect(panel.querySelector('#ap-tab-seguridad').getAttribute('aria-selected')).toBe('true');
      expect(panel.querySelector('#ap-tab-datos').getAttribute('aria-selected')).toBe('false');
      expect(panel.querySelector('#ap-pane-seguridad').hidden).toBe(false);
      expect(panel.querySelector('#ap-pane-datos').hidden).toBe(true);
    });
    it('main actions are ink, the primary Búho button', () => {
      panel.querySelectorAll('.bu-cuenta-btn').forEach(button => expect(button.classList.contains('bu-btn-primario')).toBe(true));
    });
  });
});
