import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('the desk header has no white text left over from the guinda band', () => {
  const css = readFileSync('src/styles/desk.css', 'utf8');
  const rules = css.match(/[^{}]*\.desk-head[^{}]*\{[^}]*\}/g).join('\n');
  expect(rules).not.toMatch(/color:\s*#fff|#ffffff|#fde8ee/);
  expect(rules).not.toMatch(/guinda|#7a2344/);
});
