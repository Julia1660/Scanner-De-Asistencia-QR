const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// Leer el archivo de Excel
const workbook = xlsx.readFile(path.join(__dirname, 'Listados de Estudiantes', 'Listados de Estudiantes.xlsx'));

const sheetName = workbook.SheetNames[0];
const studentsData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

// Función para generar códigos QR para cada estudiante
function generateQRCodes() {
    studentsData.forEach(student => {
        const qrData = {
            id: student.ID,
            name: student.Nombre,
            section: student['Grado y seccion'],
        };

        const qrFileName = `${qrData.id}.png`;
        const qrFilePath = path.join(__dirname, 'qr_codes', qrFileName);

        QRCode.toFile(qrFilePath, `ID: ${qrData.id}, Name: ${qrData.name}, Section: ${qrData.section}`, {
            errorCorrectionLevel: 'H'
        }, (err) => {
            if (err) {
                console.error(`Error generando el código QR para ${qrData.name}:`, err);
                return;
            }
            console.log(`Código QR generado para ${qrData.name} en ${qrFilePath}`);
        });
    });
}

// Llamar a la función para generar los códigos QR
generateQRCodes();
