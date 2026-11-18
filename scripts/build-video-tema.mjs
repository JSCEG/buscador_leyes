#!/usr/bin/env node
// Arma el video explicativo de un tema transversal desde video-temas/<slug>/guion.json.
// Baja la voz (una toma por frase) y los cuadros dibujados a .local/video-temas/<slug>/,
// deja cada cuadro el tiempo de su frase con un acercamiento lento (los cuadros de
// «edicion» siguen el mismo movimiento que su base, para que se lean como animación)
// y escribe en public/video/:
//   <slug>.mp4  video 16:9 con voz
//   <slug>.vtt  subtítulos con el texto exacto del guion (siglas incluidas)
//   <slug>.webp póster
// Uso: node scripts/build-video-tema.mjs planeacion-vinculante [--ancho 1920]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const FFPROBE = process.env.FFPROBE || 'ffprobe';

const args = process.argv.slice(2);
const slug = args.find(a => !a.startsWith('--')) || 'planeacion-vinculante';
const ANCHO = Number(args[args.indexOf('--ancho') + 1]) || 1920;
const ALTO = Math.round(ANCHO * 9 / 16 / 2) * 2;
const FPS = 30;
const ENTRADA = 0.5;      // silencio antes de la primera frase
const PAUSA = 0.35;       // entre frases
const COLA = 1.8;         // después de la última
const FUNDIDO = 0.4;      // cruce entre escenas
const CRF = process.env.CRF || '27';

const guion = JSON.parse(fs.readFileSync(path.join(ROOT, 'video-temas', slug, 'guion.json'), 'utf8'));
const TRABAJO = path.join(ROOT, '.local', 'video-temas', slug);
const SALIDA = path.join(ROOT, 'public', 'video');
for (const d of ['voz', 'cuadros', 'clips']) fs.mkdirSync(path.join(TRABAJO, d), { recursive: true });

const run = (bin, a) => execFileSync(bin, a, { stdio: ['ignore', 'pipe', 'inherit'] }).toString();
const ff = (a) => run(FFMPEG, ['-v', 'error', '-y', ...a]);
const duracion = (f) => Number(run(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).trim());
const dos = (n) => String(n).padStart(2, '0');

async function bajar(url, destino) {
    if (fs.existsSync(destino) && fs.statSync(destino).size > 0) return;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`No se pudo bajar ${url}: ${r.status}`);
    fs.writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
}

// ── Voz: una toma por frase, con pausas medidas ───────────────────────────────
const frases = [...guion.frases].sort((a, b) => a.n - b.n);
let t = ENTRADA;
const lista = [];
const silencio = (seg) => {
    const f = path.join(TRABAJO, 'voz', `silencio-${seg.toFixed(2)}.wav`);
    if (!fs.existsSync(f)) ff(['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', seg.toFixed(3), '-c:a', 'pcm_s16le', f]);
    return f;
};
lista.push(silencio(ENTRADA));
for (const [i, fr] of frases.entries()) {
    const mp3 = path.join(TRABAJO, 'voz', `${dos(fr.n)}-${fr.audio.job_id.slice(0, 8)}.mp3`);
    await bajar(fr.audio.url, mp3);
    const wav = mp3.replace(/\.mp3$/, '.wav');
    if (!fs.existsSync(wav)) ff(['-i', mp3, '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', wav]);
    fr.inicio = t;
    fr.fin = t + duracion(wav);
    t = fr.fin + (i === frases.length - 1 ? COLA : PAUSA);
    lista.push(wav, silencio(i === frases.length - 1 ? COLA : PAUSA));
}
const TOTAL = t;
const listaVoz = path.join(TRABAJO, 'voz', 'lista.txt');
fs.writeFileSync(listaVoz, lista.map(f => `file '${path.basename(f)}'`).join('\n') + '\n');
const voz = path.join(TRABAJO, 'voz', 'narracion.wav');
ff(['-f', 'concat', '-safe', '0', '-i', listaVoz, '-c', 'copy', voz]);

// ── Cuadros: tiempo de cada uno según su frase ───────────────────────────────
const cuadros = [...guion.cuadros].sort((a, b) => a.n - b.n);
for (const c of cuadros) {
    c.archivo = path.join(TRABAJO, 'cuadros', `${dos(c.n)}.png`);
    await bajar(c.url, c.archivo);
}
for (const [i, fr] of frases.entries()) {
    const propios = cuadros.filter(c => c.frase === fr.n);
    if (!propios.length) throw new Error(`La frase ${fr.n} no tiene cuadros.`);
    const desde = i === 0 ? 0 : fr.inicio - PAUSA / 2;
    const hasta = i === frases.length - 1 ? TOTAL : frases[i + 1].inicio - PAUSA / 2;
    propios.forEach((c, k) => {
        c.inicio = desde + (hasta - desde) * k / propios.length;
        c.fin = desde + (hasta - desde) * (k + 1) / propios.length;
    });
}

// Escenas: un cuadro nuevo y sus ediciones comparten un solo movimiento de cámara.
const escenas = [];
for (const c of cuadros) {
    if (c.tipo === 'edicion' && escenas.length && escenas.at(-1).cuadros.some(x => x.n === c.base)) escenas.at(-1).cuadros.push(c);
    else escenas.push({ cuadros: [c] });
}
const MOVIMIENTOS = [
    { z: [1.0, 1.09], x: [0.5, 0.5], y: [0.5, 0.45] },
    { z: [1.09, 1.0], x: [0.45, 0.55], y: [0.5, 0.5] },
    { z: [1.02, 1.1], x: [0.55, 0.45], y: [0.5, 0.5] },
    { z: [1.1, 1.02], x: [0.5, 0.5], y: [0.45, 0.55] },
];
const clips = escenas.map((e, i) => {
    e.inicio = e.cuadros[0].inicio;
    e.fin = e.cuadros.at(-1).fin;
    const ultima = i === escenas.length - 1;
    const largo = e.fin - e.inicio + (ultima ? 0 : FUNDIDO);
    const totalCuadros = Math.round(largo * FPS);
    const m = MOVIMIENTOS[i % MOVIMIENTOS.length];
    const partes = e.cuadros.map((c, k) => {
        const desde = Math.round((c.inicio - e.inicio) * FPS);
        const hasta = k === e.cuadros.length - 1 ? totalCuadros : Math.round((c.fin - e.inicio) * FPS);
        const n = hasta - desde;
        const p = `((${desde}+on)/${totalCuadros})`;
        const lerp = ([a, b]) => `(${a}+(${b - a})*${p})`;
        // El nombre lleva todo lo que cambia el clip: si nada cambió, se reusa.
        const out = path.join(TRABAJO, 'clips', `c${dos(c.n)}-${c.job_id.slice(0, 8)}-${ANCHO}-${i % MOVIMIENTOS.length}-${desde}-${n}-${totalCuadros}.mp4`);
        if (fs.existsSync(out)) return out;
        ff(['-loop', '1', '-framerate', String(FPS), '-i', c.archivo, '-frames:v', String(n),
            '-vf', `scale=${ANCHO * 2}:-2:flags=lanczos,zoompan=z='${lerp(m.z)}':x='(iw-iw/zoom)*${lerp(m.x)}':y='(ih-ih/zoom)*${lerp(m.y)}':d=1:s=${ANCHO}x${ALTO}:fps=${FPS},format=yuv420p`,
            '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '12', out]);
        return out;
    });
    const lista = path.join(TRABAJO, 'clips', `e${dos(i + 1)}.txt`);
    fs.writeFileSync(lista, partes.map(f => `file '${path.basename(f)}'`).join('\n') + '\n');
    const out = path.join(TRABAJO, 'clips', `e${dos(i + 1)}.mp4`);
    ff(['-f', 'concat', '-safe', '0', '-i', lista, '-c', 'copy', out]);
    return out;
});

// ── Video final: cruces entre escenas, fundido desde y hacia el papel ─────────
fs.mkdirSync(SALIDA, { recursive: true });
const mp4 = path.join(SALIDA, `${slug}.mp4`);
const entradas = clips.flatMap(f => ['-i', f]);
let cadena = '[0:v]';
const filtros = [];
escenas.slice(1).forEach((e, i) => {
    const out = `[x${i + 1}]`;
    filtros.push(`${cadena}[${i + 1}:v]xfade=transition=fade:duration=${FUNDIDO}:offset=${e.inicio.toFixed(3)}${out}`);
    cadena = out;
});
filtros.push(`${cadena}fade=t=in:st=0:d=0.6:color=white,fade=t=out:st=${(TOTAL - 0.9).toFixed(3)}:d=0.9:color=white,format=yuv420p[v]`);
ff([...entradas, '-i', voz, '-filter_complex', filtros.join(';'),
    '-map', '[v]', '-map', `${clips.length}:a`, '-t', TOTAL.toFixed(3),
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', CRF, '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000', '-c:a', 'aac', '-b:a', '96k', '-ac', '1',
    '-movflags', '+faststart', mp4]);

// ── Subtítulos: el texto del guion, partido en renglones legibles ─────────────
const reloj = (s) => {
    const ms = Math.round(s * 1000);
    const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60;
    return `${dos(h)}:${dos(m)}:${dos(sec)}.${String(ms % 1000).padStart(3, '0')}`;
};
// Partes de tamaño parecido (≤ ~80 caracteres), cortadas de preferencia después de un
// signo de puntuación, para que ninguna palabra quede sola. Cada parte va en dos renglones
// de ~40, que caben en el reproductor angosto del recorrido y en el celular.
const trozos = (texto, max = 80) => {
    const palabras = texto.split(/\s+/);
    const n = Math.ceil(texto.length / max);
    if (n <= 1) return [texto];
    const out = [];
    let resto = palabras;
    for (let k = n; k > 1; k--) {
        const largo = resto.join(' ').length;
        const meta = largo / k;
        let mejor = 1, puntaje = Infinity, acum = 0;
        for (let i = 0; i < resto.length - 1; i++) {
            acum += resto[i].length + (i ? 1 : 0);
            if (acum > max + 4 || largo - acum - 1 > (max + 4) * (k - 1)) continue;
            const p = Math.abs(acum - meta) - (/[,.;:?!]$/.test(resto[i]) ? 30 : 0);
            if (p < puntaje) { puntaje = p; mejor = i + 1; }
        }
        out.push(resto.slice(0, mejor).join(' '));
        resto = resto.slice(mejor);
    }
    out.push(resto.join(' '));
    return out;
};
const renglones = (parte) => {
    if (parte.length <= 42) return parte;
    const palabras = parte.split(' ');
    let mejor = 1, puntaje = Infinity, acum = 0;
    for (let i = 0; i < palabras.length - 1; i++) {
        acum += palabras[i].length + (i ? 1 : 0);
        const p = Math.abs(acum - parte.length / 2) - (/[,.;:?!]$/.test(palabras[i]) ? 6 : 0);
        if (p < puntaje) { puntaje = p; mejor = i + 1; }
    }
    return `${palabras.slice(0, mejor).join(' ')}\n${palabras.slice(mejor).join(' ')}`;
};
const cues = ['WEBVTT', ''];
frases.forEach(fr => {
    const partes = trozos(fr.subtitulo || fr.texto);
    const total = partes.reduce((s, p) => s + p.length, 0);
    let ini = fr.inicio;
    partes.forEach((p, k) => {
        const fin = ini + (fr.fin - fr.inicio) * p.length / total;
        const hasta = k === partes.length - 1 ? Math.min(fin + 0.2, TOTAL) : fin;
        cues.push(`${reloj(ini)} --> ${reloj(hasta)}`, renglones(p), '');
        ini = fin;
    });
});
fs.writeFileSync(path.join(SALIDA, `${slug}.vtt`), cues.join('\n'));

// ── Póster ────────────────────────────────────────────────────────────────────
const poster = cuadros.find(c => c.n === (guion.poster || cuadros[0].n));
ff(['-i', poster.archivo, '-vf', 'scale=1280:-2:flags=lanczos', '-c:v', 'libwebp', '-quality', '82', path.join(SALIDA, `${slug}.webp`)]);

fs.writeFileSync(path.join(TRABAJO, 'linea.json'), JSON.stringify({
    total: TOTAL,
    frases: frases.map(f => ({ n: f.n, inicio: +f.inicio.toFixed(3), fin: +f.fin.toFixed(3) })),
    cuadros: cuadros.map(c => ({ n: c.n, frase: c.frase, inicio: +c.inicio.toFixed(3), fin: +c.fin.toFixed(3) })),
}, null, 2));
const mb = (f) => (fs.statSync(f).size / 1048576).toFixed(1);
console.log(`${slug}: ${TOTAL.toFixed(1)} s, ${cuadros.length} cuadros en ${escenas.length} escenas, ${ANCHO}x${ALTO}, ${mb(mp4)} MB → public/video/${slug}.mp4 (+ .vtt, .webp)`);
