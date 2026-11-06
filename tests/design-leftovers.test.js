import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const walk = dir => readdirSync(dir).flatMap(name => { const file = join(dir, name); return statSync(file).isDirectory() ? walk(file) : [file]; });
const SOURCES = [...walk('src'), 'index.html'].filter(file => /\.(js|css|html)$/.test(file));
const CSS = SOURCES.filter(file => file.endsWith('.css'));
const read = file => readFileSync(file, 'utf8');
const sum = (files, pattern) => files.reduce((total, file) => total + (read(file).match(pattern)?.length || 0), 0);
// Tokens, the white PDF sheet and Leaflet's own colours are the only places hex belongs by design.
const HEX_HOME = /variables\.css|leaflet\.css|print\.css|site-intro\.css/;

describe('previous design', () => {
  it('has no old classes or fonts', () => {
    const hits = SOURCES.filter(file => /bj-[a-z]|Newsreader|Noto Sans|Merriweather|Patria/.test(read(file)));
    expect(hits).toEqual([]);
  });
  it('has no retired sheets', () => {
    expect(read('src/styles/index.css')).not.toMatch(/chrome\.css|legacy-dark|dark-balance|sener-institutional/);
  });
  // These two only go down: every view that gets rewritten lowers them.
  it('keeps the budget of !important', () => { expect(sum(CSS, /!important/g)).toBeLessThanOrEqual(1170); });
  it('keeps the budget of raw colours outside tokens', () => { expect(sum(CSS.filter(file => !HEX_HOME.test(file)), /#[0-9a-fA-F]{3,8}\b/g)).toBeLessThanOrEqual(398); });
});
