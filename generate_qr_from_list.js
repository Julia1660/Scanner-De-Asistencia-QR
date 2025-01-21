const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Suponiendo que el listado de estudiantes está en un archivo JSON
const studentsData = require('./listado_estudiantes.json'); // Cambia esto al nombre correcto del archivo

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
