/**
 * Shareable picture of a Reto Jurídico result (1080×1080 JPEG, light enough for messaging apps): brand colours, the score, the
 * green/red squares, the streak and the address. Drawn on a canvas so it works offline.
 */
const SIZE = 1080;

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
}

/** Waits for the brand fonts so the picture uses them (falls back to serif after a moment). */
async function fontsReady() {
    try {
        await Promise.race([
            Promise.all([document.fonts.load('700 120px Patria'), document.fonts.load('600 40px "Noto Sans"')]),
            new Promise(resolve => setTimeout(resolve, 1500)),
        ]);
    } catch { /* fonts API not available */ }
}

/**
 * @param {{ number: number, score: number, total: number, marks: boolean[], streak: number, title?: string }} result
 * @returns {Promise<Blob>}
 */
export async function drawResultImage({ number, score, total, marks, streak, title = '¿Cuánto sabes de las leyes de energía?' }) {
    await fontsReady();
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');

    // Background: deep guinda with a warm glow, like the reto header.
    const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    bg.addColorStop(0, '#5e1029');
    bg.addColorStop(1, '#9b2247');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, SIZE, SIZE);
    const glow = ctx.createRadialGradient(SIZE * 0.9, SIZE * 0.05, 40, SIZE * 0.9, SIZE * 0.05, SIZE * 0.75);
    glow.addColorStop(0, 'rgba(208,169,78,0.45)');
    glow.addColorStop(1, 'rgba(208,169,78,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Card.
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(ctx, 70, 70, SIZE - 140, SIZE - 140, 48);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#f6d9a8';
    ctx.font = '700 38px "Noto Sans", sans-serif';
    ctx.fillText(`RETO JURÍDICO #${number}`, SIZE / 2, 190);

    // Title, wrapped on two lines at most.
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 58px Patria, Georgia, serif';
    const words = title.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
        const next = line ? `${line} ${word}` : word;
        if (ctx.measureText(next).width > SIZE - 260 && line) { lines.push(line); line = word; } else line = next;
    }
    lines.push(line);
    lines.slice(0, 2).forEach((text, i) => ctx.fillText(text, SIZE / 2, 280 + i * 70));

    // Score.
    ctx.font = '700 230px Patria, Georgia, serif';
    ctx.fillStyle = '#ffffff';
    const scoreText = String(score);
    const scoreWidth = ctx.measureText(scoreText).width;
    ctx.font = '700 90px Patria, Georgia, serif';
    const totalText = `/${total}`;
    const totalWidth = ctx.measureText(totalText).width;
    const startX = SIZE / 2 - (scoreWidth + totalWidth) / 2;
    ctx.textAlign = 'left';
    ctx.font = '700 230px Patria, Georgia, serif';
    ctx.fillText(scoreText, startX, 620);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '700 90px Patria, Georgia, serif';
    ctx.fillText(totalText, startX + scoreWidth + 8, 620);

    // Squares.
    const square = 92, gap = 26;
    const rowWidth = marks.length * square + (marks.length - 1) * gap;
    marks.forEach((ok, i) => {
        ctx.fillStyle = ok ? '#2fbf71' : '#e0475f';
        roundRect(ctx, SIZE / 2 - rowWidth / 2 + i * (square + gap), 680, square, square, 20);
        ctx.fill();
    });

    // Streak and address.
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde8ee';
    ctx.font = '600 40px "Noto Sans", sans-serif';
    if (streak > 0) ctx.fillText(`🔥 ${streak} ${streak === 1 ? 'día seguido' : 'días seguidos'}`, SIZE / 2, 860);
    ctx.fillStyle = '#f6d9a8';
    ctx.font = '700 40px "Noto Sans", sans-serif';
    ctx.fillText('buscador-juridico.com/#reto', SIZE / 2, 950);

    return new Promise((resolve, reject) => canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('no image'))), 'image/jpeg', 0.9));
}

/** Shares the picture (phones), or downloads it; returns 'shared', 'downloaded' or 'cancelled'. */
export async function shareResultImage(blob, text) {
    const file = new File([blob], 'reto-juridico.jpg', { type: 'image/jpeg' });
    if (navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], text }); return 'shared'; } catch { return 'cancelled'; }
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reto-juridico.jpg';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return 'downloaded';
}
