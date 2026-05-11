const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const dataBuffer = fs.readFileSync(path.join(__dirname, 'Leyes_en_pdf', 'Ley del Sector Eléctrico.pdf'));

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('pdf_text.txt', data.text);
    console.log('PDF extracted successfully. Text saved to pdf_text.txt');
}).catch(err => {
    console.error('Error extracting PDF:', err);
});
