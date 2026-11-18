import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { TEMA_VIDEOS } from '../src/data/temas-videos.js';

const publico = ruta => path.join(process.cwd(), 'public', ruta);

describe('videos de Temas Transversales', () => {
  for (const [tema, video] of Object.entries(TEMA_VIDEOS)) {
    it(`${tema}: el video sale del CDN con huella y el póster y los subtítulos del sitio`, () => {
      const slug = path.basename(video.subtitulos, '.vtt');
      expect(video.src).toMatch(new RegExp(`^https://cdn\\.sassoapps\\.com/buscador-juridico/video-temas/${slug}-[0-9a-f]{10}\\.mp4$`));
      expect(fs.existsSync(publico(`/video/${slug}.mp4`))).toBe(false);
      expect(video.poster.startsWith('/video/')).toBe(true);
      expect(video.subtitulos.startsWith('/video/')).toBe(true);
      expect(fs.statSync(publico(video.poster)).size).toBeGreaterThan(10_000);
      const vtt = fs.readFileSync(publico(video.subtitulos), 'utf8');
      expect(vtt.startsWith('WEBVTT')).toBe(true);
      expect(vtt).toMatch(/-->/);
    });

    it(`${tema}: los subtítulos dicen lo mismo que el guion`, () => {
      const slug = path.basename(video.subtitulos, '.vtt');
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
