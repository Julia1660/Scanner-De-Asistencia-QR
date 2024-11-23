const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Crear directorio para los códigos QR si no existe
const qrDirectory = path.join(__dirname, 'qr_codes');
if (!fs.existsSync(qrDirectory)) {
    fs.mkdirSync(qrDirectory);
}

// Generar 1000 códigos QR
async function generateQRCodes() {
    console.log('Generando códigos QR...');
    
    // También crear un archivo Excel con la lista de IDs
    const rows = [['ID', 'Nombre']];
    
    for (let i = 1; i <= 1000; i++) {
        const id = i.toString().padStart(4, '0'); // Formato: 0001, 0002, etc.
        const data = `${id}|NOMBRE_${id}`; // Formato: "0001|NOMBRE_0001"
        
        // Generar el código QR
        const qrPath = path.join(qrDirectory, `qr_${id}.png`);
        await qrcode.toFile(qrPath, data, {
            width: 300,
            margin: 1,
            errorCorrectionLevel: 'L'
        });

        // Agregar a la lista
        rows.push([id, `NOMBRE_${id}`]);
        
        if (i % 100 === 0) {
            console.log(`Generados ${i} códigos QR...`);
        }
    }

    // Guardar la lista en un archivo de texto
    const listContent = rows.map(row => row.join(',')).join('\n');
    fs.writeFileSync(path.join(qrDirectory, 'lista_qr.csv'), listContent);
    
    console.log('\nProceso completado:');
    console.log(`1. Se han generado 1000 códigos QR en la carpeta 'qr_codes'`);
    console.log(`2. Se ha creado un archivo 'lista_qr.csv' con los IDs y nombres template`);
    console.log('\nInstrucciones:');
    console.log('1. Abra el archivo lista_qr.csv con Excel');
    console.log('2. Reemplace los nombres template (NOMBRE_XXXX) con los nombres reales');
    console.log('3. Los códigos QR están listos para imprimir y usar');
}

generateQRCodes().catch(console.error);
