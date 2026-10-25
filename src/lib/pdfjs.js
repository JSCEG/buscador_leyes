// pdf.js (~320 KB) is only needed to open an official PDF or ingest one, so it loads on first use
// instead of blocking every page load.
const VERSION = '3.11.174';
const BASE = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${VERSION}`;
let pending = null;

export function loadPdfjs() {
    if (globalThis.pdfjsLib?.getDocument) return Promise.resolve(globalThis.pdfjsLib);
    if (pending) return pending;
    pending = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `${BASE}/pdf.min.js`;
        script.async = true;
        script.onload = () => {
            const lib = globalThis.pdfjsLib;
            if (!lib?.getDocument) { reject(new Error('pdf.js unavailable')); return; }
            lib.GlobalWorkerOptions.workerSrc = `${BASE}/pdf.worker.min.js`;
            resolve(lib);
        };
        script.onerror = () => reject(new Error('pdf.js failed to load'));
        document.head.append(script);
    }).catch(error => { pending = null; throw error; });
    return pending;
}
