// @vitest-environment node
import { createHash, webcrypto } from 'node:crypto';
import { afterEach, it, expect, vi } from 'vitest';
import { serveReaderPdf, MAX_PDF_BYTES } from '../server/reader-pdf.js';

const bytes = new TextEncoder().encode('%PDF-1.7\nreviewed source');
const source = { transport: 'remote-pdf', originalUrl: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LCNE.pdf',
    sha256: createHash('sha256').update(bytes).digest('hex') };
const request = (path = 'lcne', method = 'GET') => new Request(`https://app.test/api/reader/${path}`, { method });
const upstream = (body = bytes, headers = {}) => new Response(body, { headers: { 'Content-Type': 'application/pdf', ...headers } });
afterEach(() => vi.unstubAllGlobals());

it('serves reviewed Diputados regulations without accepting alternate hosts or paths', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://www.diputados.gob.mx/LeyesBiblio/regley/Reg_LSE.pdf';
    const fetcher = vi.fn(async () => upstream());
    const response = await serveReaderPdf(request('rlse'), 'rlse', { sources: { rlse: { ...source, originalUrl } }, fetcher });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [originalUrl + '?url=https://outside.test', originalUrl.replace('regley', 'other'), originalUrl.replace('www.diputados.gob.mx', 'www.diputados.gob.mx.evil.test'), originalUrl.replace('Reg_LSE.pdf', '../Reg_LSE.pdf')]) {
        expect((await serveReaderPdf(request('rlse'), 'rlse', { sources: { rlse: { ...source, originalUrl: url } }, fetcher })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves the reviewed CENACE PDF but rejects other DOF URLs and URL overrides', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://dof.gob.mx/2026/CENACE/ProgramaInstitucional.pdf';
    const fetcher = vi.fn(async () => upstream());
    const response = await serveReaderPdf(request('cenace'), 'cenace', { sources: { cenace: { ...source, originalUrl } }, fetcher });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    expect(fetcher).toHaveBeenCalledTimes(1);
    fetcher.mockClear();
    for (const url of [originalUrl + '?url=https://outside.test', originalUrl + '/other', originalUrl.replace('CENACE', 'CENAGAS'), 'https://dof.gob.mx/other.pdf']) {
        expect((await serveReaderPdf(request('cenace'), 'cenace', { sources: { cenace: { ...source, originalUrl: url } }, fetcher })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed September 7, 2026 DOF issue PDF for PLADESHi', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://dof.gob.mx/abrirPDF.php?anio=2026&archivo=07092026-MAT.pdf&repo=';
    const fetcher = vi.fn(async () => upstream());
    const response = await serveReaderPdf(request('pladeshi'), 'pladeshi', { sources: { pladeshi: { ...source, originalUrl } }, fetcher });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    expect(MAX_PDF_BYTES).toBe(20 * 1024 * 1024);
    fetcher.mockClear();
    for (const url of [
        originalUrl.replace('07092026-MAT.pdf', '08092026-MAT.pdf'),
        originalUrl.replace('dof.gob.mx', 'www.dof.gob.mx'),
        originalUrl + '&url=https://outside.test',
    ]) {
        expect((await serveReaderPdf(request('pladeshi'), 'pladeshi', { sources: { pladeshi: { ...source, originalUrl: url } }, fetcher })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed April 17, 2025 DOF morning issue PDF for RISENER', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/17-04-2025/Matutina/320604';
    const fetcher = vi.fn(async () => upstream());
    const response = await serveReaderPdf(request('risener'), 'risener', { sources: { risener: { ...source, originalUrl } }, fetcher });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [originalUrl.replace('320604', '320605'), originalUrl.replace('sidof.segob.gob.mx', 'sidofqa.segob.gob.mx'), originalUrl + '?url=https://outside.test']) {
        expect((await serveReaderPdf(request('risener'), 'risener', { sources: { risener: { ...source, originalUrl: url } }, fetcher })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed October 7, 2025 DOF morning issue PDF for the autoconsumption format', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/07-10-2025/Matutina/323403';
    const fetcher = vi.fn(async () => upstream());
    const response = await serveReaderPdf(request('formato-autoconsumo'), 'formato-autoconsumo', {
        sources: { 'formato-autoconsumo': { ...source, originalUrl } }, fetcher,
    });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [originalUrl.replace('323403', '323404'), originalUrl.replace('sidof.segob.gob.mx', 'sidofqa.segob.gob.mx'), originalUrl + '?url=https://outside.test']) {
        expect((await serveReaderPdf(request('formato-autoconsumo'), 'formato-autoconsumo', {
            sources: { 'formato-autoconsumo': { ...source, originalUrl: url } }, fetcher,
        })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed August 6, 2025 DOF morning issue PDF for the autoconsumption requirements', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/06-08-2025/Matutina/322403';
    const fetcher = vi.fn(async () => upstream());
    const response = await serveReaderPdf(request('autoconsumo-requisitos'), 'autoconsumo-requisitos', {
        sources: { 'autoconsumo-requisitos': { ...source, originalUrl } }, fetcher,
    });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [originalUrl.replace('322403', '322404'), originalUrl.replace('sidof.segob.gob.mx', 'sidofqa.segob.gob.mx'), originalUrl + '?url=https://outside.test']) {
        expect((await serveReaderPdf(request('autoconsumo-requisitos'), 'autoconsumo-requisitos', {
            sources: { 'autoconsumo-requisitos': { ...source, originalUrl: url } }, fetcher,
        })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed July 10, 2026 DOF morning issue PDF for the strategic projects modification', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/10-07-2026/Matutina/328425';
    const fetcher = vi.fn(async () => upstream());
    const response = await serveReaderPdf(request('conv-estrategicos-m2'), 'conv-estrategicos-m2', {
        sources: { 'conv-estrategicos-m2': { ...source, originalUrl } }, fetcher,
    });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [originalUrl.replace('328425', '328426'), originalUrl.replace('10-07-2026', '11-07-2026'),
        originalUrl.replace('sidof.segob.gob.mx', 'sidofqa.segob.gob.mx'), originalUrl + '?url=https://outside.test']) {
        expect((await serveReaderPdf(request('conv-estrategicos-m2'), 'conv-estrategicos-m2', {
            sources: { 'conv-estrategicos-m2': { ...source, originalUrl: url } }, fetcher,
        })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed May 8, 2026 DOF morning issue PDF for the Ventanilla agreement', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/08-05-2026/Matutina/327165';
    const fetcher = vi.fn(async () => upstream());
    const response = await serveReaderPdf(request('ventanilla-autoconsumo'), 'ventanilla-autoconsumo', {
        sources: { 'ventanilla-autoconsumo': { ...source, originalUrl } }, fetcher,
    });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [originalUrl.replace('327165', '327166'), originalUrl.replace('sidof.segob.gob.mx', 'sidofqa.segob.gob.mx'), originalUrl + '?url=https://outside.test']) {
        expect((await serveReaderPdf(request('ventanilla-autoconsumo'), 'ventanilla-autoconsumo', {
            sources: { 'ventanilla-autoconsumo': { ...source, originalUrl: url } }, fetcher,
        })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed April 16, 2026 DOF morning issue PDF for the cogeneration DACG', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/16-04-2026/Matutina/326685';
    const fetcher = vi.fn(async () => upstream());
    const response = await serveReaderPdf(request('cogeneracion'), 'cogeneracion', {
        sources: { cogeneracion: { ...source, originalUrl } }, fetcher,
    });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [originalUrl.replace('326685', '326686'), originalUrl.replace('sidof.segob.gob.mx', 'sidofqa.segob.gob.mx'), originalUrl + '?url=https://outside.test']) {
        expect((await serveReaderPdf(request('cogeneracion'), 'cogeneracion', {
            sources: { cogeneracion: { ...source, originalUrl: url } }, fetcher,
        })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed January 23, 2024 DOF morning issue PDF for the open-access networks DACG', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/23-01-2024/Matutina/311101';
    const fetcher = vi.fn(async () => upstream());
    const response = await serveReaderPdf(request('dacg-acceso-redes'), 'dacg-acceso-redes', {
        sources: { 'dacg-acceso-redes': { ...source, originalUrl } }, fetcher,
    });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [originalUrl.replace('311101', '311102'), originalUrl.replace('sidof.segob.gob.mx', 'sidofqa.segob.gob.mx'), originalUrl + '?url=https://outside.test']) {
        expect((await serveReaderPdf(request('dacg-acceso-redes'), 'dacg-acceso-redes', {
            sources: { 'dacg-acceso-redes': { ...source, originalUrl: url } }, fetcher,
        })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed September 18, 2026 DOF issue PDF for CFE-IMPEDIMENTOS', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/18-09-2026/Matutina/329705';
    const fetcher = vi.fn(async () => upstream());
    const response = await serveReaderPdf(request('cfe-impedimentos'), 'cfe-impedimentos', {
        sources: { 'cfe-impedimentos': { ...source, originalUrl } }, fetcher,
    });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [originalUrl.replace('329705', '329706'), originalUrl.replace('sidof.segob.gob.mx', 'sidofqa.segob.gob.mx'), originalUrl + '?url=https://outside.test']) {
        expect((await serveReaderPdf(request('cfe-impedimentos'), 'cfe-impedimentos', {
            sources: { 'cfe-impedimentos': { ...source, originalUrl: url } }, fetcher,
        })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed September 11, 2026 DOF issue PDF for CATALOGO-CONUEE', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/11-09-2026/Matutina/329588';
    const fetcher = vi.fn(async () => upstream());
    const response = await serveReaderPdf(request('catalogo-conuee'), 'catalogo-conuee', {
        sources: { 'catalogo-conuee': { ...source, originalUrl } }, fetcher,
    });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [originalUrl.replace('329588', '329589'), originalUrl.replace('sidof.segob.gob.mx', 'sidofqa.segob.gob.mx'), originalUrl + '?url=https://outside.test']) {
        expect((await serveReaderPdf(request('catalogo-conuee'), 'catalogo-conuee', {
            sources: { 'catalogo-conuee': { ...source, originalUrl: url } }, fetcher,
        })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed August 17, 2026 DOF issue PDF for CEL requirements', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/17-08-2026/Matutina/329125';
    const fetcher = vi.fn(async () => upstream());
    const response = await serveReaderPdf(request('cel-requisitos-2025-2026'), 'cel-requisitos-2025-2026', {
        sources: { 'cel-requisitos-2025-2026': { ...source, originalUrl } }, fetcher,
    });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [originalUrl.replace('329125', '329126'), originalUrl.replace('Matutina', 'Vespertina'),
        originalUrl.replace('sidof.segob.gob.mx', 'sidofqa.segob.gob.mx'), originalUrl + '?url=https://outside.test']) {
        expect((await serveReaderPdf(request('cel-requisitos-2025-2026'), 'cel-requisitos-2025-2026', {
            sources: { 'cel-requisitos-2025-2026': { ...source, originalUrl: url } }, fetcher,
        })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed March 18, 2025 DOF evening issue PDF for FMP/LOAPF reforms', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/18-03-2025/Vespertina/320062';
    const fetcher = vi.fn(async () => upstream());
    const response = await serveReaderPdf(request('reformas-fmp-loapf'), 'reformas-fmp-loapf', {
        sources: { 'reformas-fmp-loapf': { ...source, originalUrl } }, fetcher,
    });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [originalUrl.replace('320062', '320063'), originalUrl.replace('Vespertina', 'Matutina'),
        originalUrl.replace('sidof.segob.gob.mx', 'sidofqa.segob.gob.mx'), originalUrl + '?url=https://outside.test']) {
        expect((await serveReaderPdf(request('reformas-fmp-loapf'), 'reformas-fmp-loapf', {
            sources: { 'reformas-fmp-loapf': { ...source, originalUrl: url } }, fetcher,
        })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed September 10, 2026 DOF issue PDF for CONV-GEN-2-M4', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/10-09-2026/Matutina/329565';
    const fetcher = vi.fn(async () => upstream());
    const response = await serveReaderPdf(request('gen2m4'), 'gen2m4', {
        sources: { 'gen2m4': { ...source, originalUrl } }, fetcher,
    });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [originalUrl.replace('329565', '329566'), originalUrl.replace('sidof.segob.gob.mx', 'sidofqa.segob.gob.mx'), originalUrl + '?url=https://outside.test']) {
        expect((await serveReaderPdf(request('gen2m4'), 'gen2m4', {
            sources: { 'gen2m4': { ...source, originalUrl: url } }, fetcher,
        })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed September 8, 2026 DOF issue PDF for MIGRACION-MODIFICACION', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/08-09-2026/Matutina/329525';
    const fetcher = vi.fn(async () => upstream());
    const response = await serveReaderPdf(request('migracion-modificacion'), 'migracion-modificacion', {
        sources: { 'migracion-modificacion': { ...source, originalUrl } }, fetcher,
    });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [originalUrl.replace('329525', '329526'), originalUrl.replace('sidof.segob.gob.mx', 'sidofqa.segob.gob.mx'), originalUrl + '?url=https://outside.test']) {
        expect((await serveReaderPdf(request('migracion-modificacion'), 'migracion-modificacion', {
            sources: { 'migracion-modificacion': { ...source, originalUrl: url } }, fetcher,
        })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed September 2, 2026 DOF issue PDF for CONV-ESTRATEGICOS-M3', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/02-09-2026/Matutina/329425';
    const fetcher = vi.fn(async () => upstream());
    const response = await serveReaderPdf(request('estrategicos-m3'), 'estrategicos-m3', {
        sources: { 'estrategicos-m3': { ...source, originalUrl } }, fetcher,
    });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [originalUrl.replace('329425', '329426'), originalUrl.replace('sidof.segob.gob.mx', 'sidofqa.segob.gob.mx'), originalUrl + '?url=https://outside.test']) {
        expect((await serveReaderPdf(request('estrategicos-m3'), 'estrategicos-m3', {
            sources: { 'estrategicos-m3': { ...source, originalUrl: url } }, fetcher,
        })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed September 30, 2026 DOF morning issue PDF for UPAC and the CNE modification', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/30-09-2026/Matutina/329925';
    const fetcher = vi.fn(async () => upstream());
    const response = await serveReaderPdf(request('dof-sep-2026'), 'dof-sep-2026', {
        sources: { 'dof-sep-2026': { ...source, originalUrl } }, fetcher,
    });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [originalUrl.replace('329925', '329926'), originalUrl.replace('sidof.segob.gob.mx', 'sidofqa.segob.gob.mx'), originalUrl + '?url=https://outside.test']) {
        expect((await serveReaderPdf(request('dof-sep-2026'), 'dof-sep-2026', {
            sources: { 'dof-sep-2026': { ...source, originalUrl: url } }, fetcher,
        })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed October 2, 2026 DOF morning issue PDF for NOM-EM-008-ASEA-2026', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/02-10-2026/Matutina/329985';
    const fetcher = vi.fn(async () => upstream());
    const response = await serveReaderPdf(request('nom-em-008-asea-2026'), 'nom-em-008-asea-2026', {
        sources: { 'nom-em-008-asea-2026': { ...source, originalUrl } }, fetcher,
    });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [originalUrl.replace('329985', '329986'),
        originalUrl.replace('sidof.segob.gob.mx', 'sidofqa.segob.gob.mx'), originalUrl + '?url=https://outside.test']) {
        expect((await serveReaderPdf(request('nom-em-008-asea-2026'), 'nom-em-008-asea-2026', {
            sources: { 'nom-em-008-asea-2026': { ...source, originalUrl: url } }, fetcher,
        })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed April 15, 2025 DOF evening issue PDF for the PND', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://dof.gob.mx/abrirPDF.php?anio=2025&archivo=15042025-VES.pdf&repo=';
    const fetcher = vi.fn(async () => upstream());
    const response = await serveReaderPdf(request('pnd'), 'pnd', { sources: { pnd: { ...source, originalUrl } }, fetcher });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [
        originalUrl.replace('15042025-VES.pdf', '15042025-MAT.pdf'),
        originalUrl.replace('dof.gob.mx', 'www.dof.gob.mx'),
        originalUrl + '&url=https://outside.test',
    ]) {
        expect((await serveReaderPdf(request('pnd'), 'pnd', { sources: { pnd: { ...source, originalUrl: url } }, fetcher })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed December 22, 2025 DOF morning issue PDF for PROSENER', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://dof.gob.mx/abrirPDF.php?anio=2025&archivo=22122025-MAT.pdf&repo=';
    const fetcher = vi.fn(async () => upstream());
    const source = { transport: 'remote-pdf', originalUrl,
        sha256: createHash('sha256').update(bytes).digest('hex') };
    const response = await serveReaderPdf(request('prosener'), 'prosener', { sources: { prosener: source }, fetcher });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [
        originalUrl.replace('22122025-MAT.pdf', '22122025-VES.pdf'),
        originalUrl.replace('dof.gob.mx', 'www.dof.gob.mx'),
        originalUrl + '&url=https://outside.test',
    ]) {
        expect((await serveReaderPdf(request('prosener'), 'prosener', { sources: { prosener: { ...source, originalUrl: url } }, fetcher })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed October 17, 2025 DOF evening issue PDF for PLADESE', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://dof.gob.mx/abrirPDF.php?anio=2025&archivo=17102025-VES.pdf&repo=';
    const fetcher = vi.fn(async () => upstream());
    const source = { transport: 'remote-pdf', originalUrl,
        sha256: createHash('sha256').update(bytes).digest('hex') };
    const response = await serveReaderPdf(request('pladese'), 'pladese', { sources: { pladese: source }, fetcher });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [
        originalUrl.replace('17102025-VES.pdf', '17102025-MAT.pdf'),
        originalUrl.replace('dof.gob.mx', 'www.dof.gob.mx'),
        originalUrl + '&url=https://outside.test',
    ]) {
        expect((await serveReaderPdf(request('pladese'), 'pladese', { sources: { pladese: { ...source, originalUrl: url } }, fetcher })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed August 31, 2026 DOF morning issue PDF for FORMATOS-BIOCOMBUSTIBLES', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/31-08-2026/Matutina/329365';
    const fetcher = vi.fn(async () => upstream());
    const source = { transport: 'remote-pdf', originalUrl,
        sha256: createHash('sha256').update(bytes).digest('hex') };
    const response = await serveReaderPdf(request('formatos-biocombustibles'), 'formatos-biocombustibles', {
        sources: { 'formatos-biocombustibles': source }, fetcher,
    });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [
        originalUrl.replace('329365', '329366'),
        originalUrl.replace('sidof.segob.gob.mx', 'sidofqa.segob.gob.mx'),
        originalUrl + '?url=https://outside.test',
    ]) {
        expect((await serveReaderPdf(request('formatos-biocombustibles'), 'formatos-biocombustibles', {
            sources: { 'formatos-biocombustibles': { ...source, originalUrl: url } }, fetcher,
        })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed August 19, 2026 DOF morning issue PDF for CFE-CONTRATACION', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/19-08-2026/Matutina/329166';
    const fetcher = vi.fn(async () => upstream());
    const source = { transport: 'remote-pdf', originalUrl,
        sha256: createHash('sha256').update(bytes).digest('hex') };
    const response = await serveReaderPdf(request('cfe-contratacion'), 'cfe-contratacion', {
        sources: { 'cfe-contratacion': source }, fetcher,
    });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [
        originalUrl.replace('329166', '329167'),
        originalUrl.replace('sidof.segob.gob.mx', 'sidofqa.segob.gob.mx'),
        originalUrl + '?url=https://outside.test',
    ]) {
        expect((await serveReaderPdf(request('cfe-contratacion'), 'cfe-contratacion', {
            sources: { 'cfe-contratacion': { ...source, originalUrl: url } }, fetcher,
        })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed August 14, 2026 DOF morning issue PDF for CONV-SISTRANGAS', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/14-08-2026/Matutina/329086';
    const fetcher = vi.fn(async () => upstream());
    const source = { transport: 'remote-pdf', originalUrl,
        sha256: createHash('sha256').update(bytes).digest('hex') };
    const response = await serveReaderPdf(request('conv-sistrangas'), 'conv-sistrangas', {
        sources: { 'conv-sistrangas': source }, fetcher,
    });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [
        originalUrl.replace('329086', '329087'),
        originalUrl.replace('sidof.segob.gob.mx', 'sidofqa.segob.gob.mx'),
        originalUrl + '?url=https://outside.test',
    ]) {
        expect((await serveReaderPdf(request('conv-sistrangas'), 'conv-sistrangas', {
            sources: { 'conv-sistrangas': { ...source, originalUrl: url } }, fetcher,
        })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed June 26, 2026 DOF issue PDF for the migration clarification', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/26-06-2026/Matutina/328125';
    const fetcher = vi.fn(async () => upstream());
    const reviewed = { ...source, originalUrl };
    const response = await serveReaderPdf(request('migracion-aclaracion'), 'migracion-aclaracion', {
        sources: { 'migracion-aclaracion': reviewed }, fetcher,
    });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [originalUrl.replace('328125', '328126'), originalUrl.replace('26-06-2026', '27-06-2026'),
        originalUrl.replace('sidof.segob.gob.mx', 'sidofqa.segob.gob.mx'), originalUrl + '?url=https://outside.test']) {
        expect((await serveReaderPdf(request('migracion-aclaracion'), 'migracion-aclaracion', {
            sources: { 'migracion-aclaracion': { ...reviewed, originalUrl: url } }, fetcher,
        })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('serves only the reviewed June 18, 2026 DOF issue PDF for the migration lineaments', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const originalUrl = 'https://sidof.segob.gob.mx/notas/getNewsletter/18-06-2026/Matutina/327985';
    const fetcher = vi.fn(async () => upstream());
    const reviewed = { ...source, originalUrl };
    const response = await serveReaderPdf(request('migracion-permisos'), 'migracion-permisos', {
        sources: { 'migracion-permisos': reviewed }, fetcher,
    });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    fetcher.mockClear();
    for (const url of [originalUrl.replace('327985', '327986'), originalUrl.replace('18-06-2026', '19-06-2026'),
        originalUrl.replace('sidof.segob.gob.mx', 'sidofqa.segob.gob.mx'), originalUrl + '?url=https://outside.test']) {
        expect((await serveReaderPdf(request('migracion-permisos'), 'migracion-permisos', {
            sources: { 'migracion-permisos': { ...reviewed, originalUrl: url } }, fetcher,
        })).status).toBe(404);
    }
    expect(fetcher).not.toHaveBeenCalled();
});

it('returns only the reviewed bytes, disables storage, and does not forward request headers', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const fetcher = vi.fn().mockResolvedValue(upstream());
    const response = await serveReaderPdf(request(), 'lcne', { sources: { lcne: source }, fetcher });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(fetcher.mock.calls[0]).toEqual([source.originalUrl, expect.objectContaining({ redirect: 'manual', headers: { Accept: 'application/pdf' } })]);
});

it('rejects unknown sources, query overrides, unsupported methods and unapproved hosts without a fetch', async () => {
    const fetcher = vi.fn();
    for (const id of ['unknown', '__proto__', 'https://outside.test/a.pdf']) {
        expect((await serveReaderPdf(request(), id, { fetcher, sources: { lcne: source } })).status).toBe(404);
    }
    expect((await serveReaderPdf(request('lcne?url=https://outside.test'), 'lcne', { fetcher })).status).toBe(400);
    expect((await serveReaderPdf(request('lcne', 'POST'), 'lcne', { fetcher })).status).toBe(405);
    expect((await serveReaderPdf(request(), 'lcne', { fetcher, sources: { lcne: { ...source, originalUrl: 'https://outside.test/file.pdf' } } })).status).toBe(404);
    expect(fetcher).not.toHaveBeenCalled();
});

it('rejects changed editions, non-PDF responses, redirects and oversized streams', async () => {
    vi.stubGlobal('crypto', webcrypto);
    const options = fetcher => ({ sources: { lcne: source }, fetcher });
    const changed = await serveReaderPdf(request(), 'lcne', options(async () => upstream('%PDF-1.7 changed')));
    expect(changed.status).toBe(409);
    expect(await changed.json()).toEqual({ code: 'source-version-changed' });
    expect((await serveReaderPdf(request(), 'lcne', options(async () => upstream('<html>', { 'Content-Type': 'text/html' })))).status).toBe(502);
    expect((await serveReaderPdf(request(), 'lcne', options(async () => { throw new Error('redirect'); }))).status).toBe(502);
    const redirect = vi.fn(async () => new Response(null, { status: 302, headers: { Location: 'https://outside.test/file.pdf' } }));
    expect((await serveReaderPdf(request(), 'lcne', options(redirect))).status).toBe(502);
    expect(redirect).toHaveBeenCalledTimes(1);
    expect((await serveReaderPdf(request(), 'lcne', options(async () => upstream(bytes, { 'Content-Length': String(MAX_PDF_BYTES + 1) })))).status).toBe(502);
    const large = await serveReaderPdf(request(), 'lcne', options(async () => upstream(new Uint8Array(MAX_PDF_BYTES + 1))));
    expect(await large.json()).toEqual({ code: 'source-too-large' });
});
