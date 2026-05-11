const fs = require('fs');
const PDFParser = require("pdf2json");

const extractText = (file) => {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(this, 1);
        pdfParser.on("pdfParser_dataError", errData => reject(errData.parserError));
        pdfParser.on("pdfParser_dataReady", pdfData => {
            resolve(pdfParser.getRawTextContent());
        });
        pdfParser.loadPDF(file);
    });
};

(async () => {
    try {
        console.log("Extrayendo Reglamento Interior...");
        const text1 = await extractText("Leyes_en_pdf/Reglamento Interior SENER 2025.pdf");
        fs.writeFileSync("tmp_sener.txt", text1);
        
        console.log("Extrayendo Reglamento LPTE alt...");
        const text2 = await extractText("Leyes_en_pdf/Reglamento de la Ley de Planeación y Transición Energética_alt.pdf");
        fs.writeFileSync("tmp_lpte.txt", text2);
        
        console.log("Textos extraidos exitosamente.");
    } catch (e) {
        console.error("Error:", e);
    }
})();
