/**
 * QR code for presentations and documents (QRCode + qrPayload of the design system): byte mode,
 * error correction M, versions 1–10. Adapted from Nayuki's reference QR Code generator (MIT licence).
 */
const QR_ECC = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
const QR_NB = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5];

/** @returns {boolean[][]} dark modules */
export function qrMatrix(text) {
    const bytes = [...new TextEncoder().encode(String(text))];
    const raw = v => { let r = (16 * v + 128) * v + 64; if (v >= 2) { const na = Math.floor(v / 7) + 2; r -= (25 * na - 10) * na - 55; if (v >= 7) r -= 36; } return r; };
    const dataCw = v => Math.floor(raw(v) / 8) - QR_ECC[v] * QR_NB[v];
    let v = 1;
    while (v <= 10 && dataCw(v) * 8 < 4 + (v < 10 ? 8 : 16) + 8 * bytes.length) v++;
    if (v > 10) throw new Error('Texto demasiado largo para el QR');
    const bb = [];
    const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1); };
    push(4, 4); push(bytes.length, v < 10 ? 8 : 16); bytes.forEach(b => push(b, 8));
    const cap = dataCw(v) * 8;
    push(0, Math.min(4, cap - bb.length)); push(0, (8 - bb.length % 8) % 8);
    for (let pad = 0xEC; bb.length < cap; pad ^= 0xEC ^ 0x11) push(pad, 8);
    const data = [];
    for (let i = 0; i < bb.length; i += 8) { let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | bb[i + j]; data.push(b); }
    const mul = (x, y) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 0xFF; };
    const deg = QR_ECC[v];
    const div = [...Array(deg - 1).fill(0), 1];
    let root = 1;
    for (let i = 0; i < deg; i++) { for (let j = 0; j < div.length; j++) { div[j] = mul(div[j], root); if (j + 1 < div.length) div[j] ^= div[j + 1]; } root = mul(root, 2); }
    const rem = d => { const r = div.map(() => 0); d.forEach(b => { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= mul(c, f); }); }); return r; };
    const nb = QR_NB[v], rawCw = Math.floor(raw(v) / 8), nShort = nb - rawCw % nb, shortLen = Math.floor(rawCw / nb), blocks = [];
    for (let i = 0, k = 0; i < nb; i++) { const dat = data.slice(k, k + shortLen - deg + (i < nShort ? 0 : 1)); k += dat.length; const ecc = rem(dat); if (i < nShort) dat.push(0); blocks.push(dat.concat(ecc)); }
    const all = [];
    for (let i = 0; i < blocks[0].length; i++) for (let j = 0; j < blocks.length; j++) if (i !== shortLen - deg || j >= nShort) all.push(blocks[j][i]);
    const n = v * 4 + 17;
    const M = Array.from({ length: n }, () => new Array(n).fill(false));
    const F = Array.from({ length: n }, () => new Array(n).fill(false));
    const setF = (x, y, d) => { M[y][x] = d; F[y][x] = true; };
    for (let i = 0; i < n; i++) { setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }
    [[3, 3], [n - 4, 3], [3, n - 4]].forEach(([px, py]) => {
        for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
            const dist = Math.max(Math.abs(dx), Math.abs(dy)), xx = px + dx, yy = py + dy;
            if (xx >= 0 && xx < n && yy >= 0 && yy < n) setF(xx, yy, dist !== 2 && dist !== 4);
        }
    });
    if (v > 1) {
        const na = Math.floor(v / 7) + 2, step = Math.ceil((v * 4 + 4) / (na * 2 - 2)) * 2, pos = [6];
        for (let pp = n - 7; pos.length < na; pp -= step) pos.splice(1, 0, pp);
        for (let i = 0; i < na; i++) for (let j = 0; j < na; j++) {
            if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) continue;
            for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setF(pos[i] + dx, pos[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
    }
    const formatBits = mask => {
        const d = mask; let r = d;
        for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
        const bits = ((d << 10) | r) ^ 0x5412, g = i => ((bits >>> i) & 1) !== 0;
        for (let i = 0; i <= 5; i++) setF(8, i, g(i));
        setF(8, 7, g(6)); setF(8, 8, g(7)); setF(7, 8, g(8));
        for (let i = 9; i < 15; i++) setF(14 - i, 8, g(i));
        for (let i = 0; i < 8; i++) setF(n - 1 - i, 8, g(i));
        for (let i = 8; i < 15; i++) setF(8, n - 15 + i, g(i));
        setF(8, n - 8, true);
    };
    formatBits(0);
    if (v >= 7) {
        let r7 = v;
        for (let i = 0; i < 12; i++) r7 = (r7 << 1) ^ ((r7 >>> 11) * 0x1F25);
        const vb = (v << 12) | r7;
        for (let i = 0; i < 18; i++) { const bit = ((vb >>> i) & 1) !== 0, a = n - 11 + i % 3, c = Math.floor(i / 3); setF(a, c, bit); setF(c, a, bit); }
    }
    let bi = 0;
    for (let right = n - 1; right >= 1; right -= 2) {
        if (right === 6) right = 5;
        for (let vert = 0; vert < n; vert++) for (let j = 0; j < 2; j++) {
            const x = right - j, up = ((right + 1) & 2) === 0, y = up ? n - 1 - vert : vert;
            if (!F[y][x] && bi < all.length * 8) { M[y][x] = ((all[bi >>> 3] >>> (7 - (bi & 7))) & 1) !== 0; bi++; }
        }
    }
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!F[y][x] && (x + y) % 2 === 0) M[y][x] = !M[y][x];
    formatBits(0);
    return M;
}

/** The QR as SVG text, quiet zone included. */
export function qrSvg(text, { size = 184, color = '#12213a' } = {}) {
    let m;
    try { m = qrMatrix(text); } catch { return ''; }
    const n = m.length, q = 4;
    let d = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (m[y][x]) d += `M${x + q} ${y + q}h1v1h-1z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${n + 2 * q} ${n + 2 * q}" role="img" aria-label="Código QR" shape-rendering="crispEdges" style="display:block;border-radius:6px"><rect width="${n + 2 * q}" height="${n + 2 * q}" fill="#ffffff"/><path d="${d}" fill="${color}"/></svg>`;
}

/** Author, weekday, date and time of a moment, in Mexican Spanish. */
export function stamp(date) {
    const d = date ? new Date(date) : new Date();
    const dia = d.toLocaleDateString('es-MX', { weekday: 'long' });
    return {
        dia: dia.charAt(0).toUpperCase() + dia.slice(1),
        fecha: d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }),
        hora: `${d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })} h`,
    };
}

/** What the QR of a presentation carries: site and when it was made (and an author, only if given). */
export function qrPayload({ title = 'Buscador Jurídico · Sector energético', url = 'https://buscador-juridico.com', author = '', date } = {}) {
    const s = stamp(date);
    return [title, url, author && `Elaborado por: ${author}`, `Fecha: ${s.dia.toLowerCase()}, ${s.fecha}, ${s.hora}`].filter(Boolean).join('\n');
}

/** The QR as a PNG data URI (for PowerPoint), drawn on a canvas; null where there is no canvas. */
export function qrPng(text, { size = 512, color = '#12213a' } = {}) {
    try {
        const m = qrMatrix(text);
        const n = m.length + 8;
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        const cell = size / n;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = color;
        m.forEach((row, y) => row.forEach((dark, x) => { if (dark) ctx.fillRect(Math.floor((x + 4) * cell), Math.floor((y + 4) * cell), Math.ceil(cell), Math.ceil(cell)); }));
        return canvas.toDataURL('image/png');
    } catch {
        return null;
    }
}
