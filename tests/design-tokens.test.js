import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/design/variables.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const THEMES = ['light', 'dark', 'sepia', 'contraste'];
const BUHO_TOKENS = ['--papel', '--papel-alto', '--ceniza', '--linea', '--enlace', '--tinta', '--tinta-suave', '--rojo', '--rojo-suave', '--rojo-halo',
  '--accion', '--on-accion', '--exito', '--error', '--cristal', '--cristal-fuerte', '--cristal-borde', '--cristal-borde-hover', '--cristal-brillo',
  '--sombra-cristal', '--sombra-flotante', '--blur-cristal', '--blur-flotante', '--lb-bg', '--lb-bg2', '--lb-ink', '--lb-suave', '--lb-edge',
  '--col-leyes', '--col-reglamentos', '--col-acuerdos', '--col-dacg', '--col-convocatorias', '--col-normas', '--col-otros', '--aut-sener', '--on-aut-sener'];
const TYPE_TOKENS = BUHO_TOKENS.filter(name => name.startsWith('--col-'));

/** Declarations of a theme, later blocks winning, with plain var() references resolved. */
function themeTokens(theme) {
  const tokens = {};
  for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const applies = selector.includes(`[data-theme="${theme}"]`) || (theme === 'light' && /:root\s*,/.test(selector));
    if (!applies || selector.includes(':not(')) continue;
    for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) tokens[name] = value.trim();
  }
  const resolve = value => {
    const match = /^var\((--[\w-]+)\)$/.exec(value ?? '');
    return match ? resolve(tokens[match[1]]) : value;
  };
  return new Proxy(tokens, { get: (all, name) => resolve(all[name]) });
}
const channel = value => { const v = value / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const luminance = hex => {
  const full = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  const [r, g, b] = [1, 3, 5].map(i => channel(parseInt(full.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

describe('design tokens', () => {
  it.each(THEMES)('%s defines every Búho token', theme => {
    const tokens = themeTokens(theme);
    for (const name of BUHO_TOKENS) expect(tokens[name], name).toBeTruthy();
  });

  it.each(THEMES)('%s keeps text at 4.5:1 on its surfaces', theme => {
    const t = themeTokens(theme);
    expect(ratio(t['--tinta'], t['--papel'])).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t['--tinta-suave'], t['--papel'])).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t['--tinta-suave'], t['--papel-alto'])).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t['--tinta-suave'], t['--ceniza'])).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t['--on-accion'], t['--accion'])).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t['--rojo'], t['--papel-alto'])).toBeGreaterThanOrEqual(4.5);
    expect(ratio(t['--on-aut-sener'], t['--aut-sener'])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(THEMES.flatMap(theme => TYPE_TOKENS.map(token => [theme, token])))('%s %s reaches 3:1 on the book surface', (theme, token) => {
    const t = themeTokens(theme);
    expect(ratio(t[token], t['--lb-bg'])).toBeGreaterThanOrEqual(3);
  });

  it.each(THEMES)('%s keeps the names the older sheets read', theme => {
    const t = themeTokens(theme);
    expect(t['--surface-0']).toBe(t['--papel']);
    expect(t['--ink']).toBe(t['--tinta']);
    expect(t['--brand']).toBe(t['--rojo']);
    expect(t['--hairline']).toBe(t['--linea']);
  });

  it('contrast theme turns the glass off', () => {
    const t = themeTokens('contraste');
    expect(t['--blur-cristal']).toBe('0px');
    expect(t['--blur-flotante']).toBe('0px');
    expect(t['--sombra-flotante']).toBe('none');
  });

  it('uses the Búho typefaces', () => {
    expect(css).toMatch(/--font-display:\s*"Fraunces"/);
    expect(css).toMatch(/--font-sans:\s*"Manrope"/);
    expect(readFileSync('index.html', 'utf8')).not.toContain('fonts.googleapis.com/css2?family=Newsreader');
  });
});
