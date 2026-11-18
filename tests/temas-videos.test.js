import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { TEMA_VIDEOS } from '../src/data/temas-videos.js';

const publico = ruta => path.join(process.cwd(), 'public', ruta);

describe('videos de Temas Transversales', () => {
  for (const [tema, video] of Object.entries(TEMA_VIDEOS)) {
    it(`${tema}: los tres archivos existen y caben en Cloudflare Pages`, () => {
      const mp4 = fs.statSync(publico(video.src));
      expect(mp4.size).toBeGreaterThan(1_000_000);
      expect(mp4.size).toBeLessThan(25 * 1024 * 1024);
      expect(fs.statSync(publico(video.poster)).size).toBeGreaterThan(10_000);
      const vtt = fs.readFileSync(publico(video.subtitulos), 'utf8');
      expect(vtt.startsWith('WEBVTT')).toBe(true);
      expect(vtt).toMatch(/-->/);
    });

    it(`${tema}: los subtítulos dicen lo mismo que el guion`, () => {
      const slug = path.basename(video.src, '.mp4');
      const guion = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'video-temas', slug, 'guion.json'), 'utf8'));
      const vtt = fs.readFileSync(publico(video.subtitulos), 'utf8');
      const texto = vtt.split(/\r?\n/).filter(l => l && l !== 'WEBVTT' && !l.includes('-->')).join(' ');
      const esperado = guion.frases.map(f => f.subtitulo || f.texto).join(' ');
      expect(texto.replace(/\s+/g, ' ')).toBe(esperado.replace(/\s+/g, ' '));
    });

    it(`${tema}: cada fundamento es un artículo del acervo`, () => {
      expect(video.fundamentos.length).toBeGreaterThan(0);
      for (const ref of video.fundamentos) expect(ref.articleId).toMatch(/^[0-9a-f-]{36}$/);
    });
  }
});
