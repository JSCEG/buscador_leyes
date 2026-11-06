// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { iconVersion, iconVersionsIn, stampIconVersion } from '../scripts/icon-version.mjs';

const root = new URL('../', import.meta.url);
const read = name => readFileSync(new URL(name, root), 'utf8');

describe('app icon version', () => {
  it('the links in the manifest and the page carry the version of the current icons', () => {
    const version = iconVersion(root);
    for (const file of ['public/manifest.json', 'index.html']) {
      const versions = iconVersionsIn(read(file));
      expect(versions.length, file).toBeGreaterThan(0);
      expect(new Set(versions), file).toEqual(new Set([version]));
    }
  });
  it('stamps icon links and nothing else', () => {
    const text = '"/img/icon-192.png?v=3" "/img/capturas/celular-acervo.jpg?v=3" "/img/favicon-64.png?v=old"';
    expect(stampIconVersion(text, 'abc')).toBe('"/img/icon-192.png?v=abc" "/img/capturas/celular-acervo.jpg?v=3" "/img/favicon-64.png?v=abc"');
  });
  it('the manifest keeps the identity that lets installed apps update', () => {
    const manifest = JSON.parse(read('public/manifest.json'));
    expect(manifest.id).toBe('/');
    expect(manifest.icons.some(icon => icon.purpose === 'maskable')).toBe(true);
  });
  it('offers screens of the app for phone and computer in the install dialog', () => {
    const { screenshots } = JSON.parse(read('public/manifest.json'));
    expect(screenshots.filter(shot => shot.form_factor === 'narrow').length).toBeGreaterThan(0);
    expect(screenshots.filter(shot => shot.form_factor === 'wide').length).toBeGreaterThan(0);
    for (const shot of screenshots) {
      expect(() => readFileSync(new URL(`public${shot.src}`, root)), shot.src).not.toThrow();
      expect(shot.label, shot.src).toBeTruthy();
    }
  });
});
