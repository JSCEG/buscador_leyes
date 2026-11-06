import { expect, it, vi } from 'vitest';
import { initSearch } from '../src/scripts/search-engine.js';

vi.mock('../src/lib/supabase.js', () => ({
  supabase: { rpc: () => Promise.reject(new Error('sin conexión')) },
}));

it('announces when the catalog cannot load', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
  const failed = vi.fn();
  window.addEventListener('search-failed', failed);
  await initSearch();
  window.removeEventListener('search-failed', failed);
  expect(failed).toHaveBeenCalledTimes(1);
});
