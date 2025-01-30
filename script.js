const html5QrCode = new Html5Qrcode("reader");

function onScanSuccess(qrCodeMessage) {
    // Aquí se procesará el mensaje del código QR escaneado
    const studentData = parseQRCode(qrCodeMessage);
    registerAttendance(studentData);
}

function parseQRCode(qrCodeMessage) {
    // Parsear el mensaje del código QR para obtener la información del estudiante
    const data = qrCodeMessage.split(", ");
    return {
        id: data[0].split(": ")[1],
        name: data[1].split(": ")[1],
        section: data[2].split(": ")[1],
        timestamp: new Date().toLocaleString()
    };
}

function registerAttendance(studentData) {
const { registerAttendance } = require('./attendanceHandler');

// Aquí se registrará la asistencia del estudiante
    registerAttendance(studentData);

}

function parseQRCode(qrCodeMessage) {
    // Parsear el mensaje del código QR para obtener la información del estudiante
    const data = qrCodeMessage.split(", ");
    return {
        id: data[0].split(": ")[1],
        name: data[1].split(": ")[1],
        section: data[2].split(": ")[1],
        timestamp: new Date().toLocaleString()
    };
}

function registerAttendance(studentData) {
    // Aquí se registrará la asistencia del estudiante
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `<p>Asistencia Registrada: ${studentData.name} (${studentData.id}) - ${studentData.timestamp}</p>`;
    
    // Guardar la asistencia en un archivo JSON (esto se implementará más adelante)
}

// Iniciar el escáner
html5QrCode.start(
    { facingMode: "environment" },
    {
        fps: 10,
        qrbox: 250
    },
    onScanSuccess,
    (errorMessage) => {
        // Manejar errores de escaneo
    }
).catch(err => {
    console.error(`Error al iniciar el escáner: ${err}`);
});
