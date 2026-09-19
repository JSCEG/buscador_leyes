import { serveReaderPdf } from '../../../server/reader-pdf.js';

export const onRequest = ({ request, params }) => serveReaderPdf(request, params.sourceId);
