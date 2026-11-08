import { afterEach, describe, expect, it, vi } from 'vitest';
import { installUrl, shareApp } from '../src/lib/app-links.js';

describe('compartir e instalar la app', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shares the install link', () => {
    expect(installUrl('https://buscador-juridico.com')).toBe('https://buscador-juridico.com/instalar');
  });
  it('copies the link and, on a phone, opens the share sheet too', async () => {
    const share = vi.fn(() => Promise.resolve());
    const writeText = vi.fn(() => Promise.resolve());
    expect(await shareApp({ nav: { share, clipboard: { writeText } }, mobile: true })).toEqual({ copied: true, shared: true });
    expect(writeText).toHaveBeenCalledWith(`${location.origin}/instalar`);
    expect(share.mock.calls[0][0].url).toBe(`${location.origin}/instalar`);
  });
  it('only copies it on a computer', async () => {
    const share = vi.fn();
    const writeText = vi.fn(() => Promise.resolve());
    expect(await shareApp({ nav: { share, clipboard: { writeText } }, mobile: false })).toEqual({ copied: true, shared: false });
    expect(share).not.toHaveBeenCalled();
  });
  it('asks the visitor to copy it when there is no clipboard', async () => {
    const prompt = vi.spyOn(window, 'prompt').mockImplementation(() => null);
    expect(await shareApp({ nav: {}, mobile: false })).toEqual({ copied: false, shared: false });
    expect(prompt).toHaveBeenCalled();
  });
});
