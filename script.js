const html5QrCode = new Html5Qrcode("reader");

function onScanSuccess(qrCodeMessage) {
    console.log("Código QR escaneado:", qrCodeMessage);
    const studentData = parseQRCode(qrCodeMessage);
    registerAttendance(studentData);
}

function parseQRCode(qrCodeMessage) {
    const data = qrCodeMessage.split(", ");
    return {
        id: data[0].split(": ")[1],
        name: data[1].split(": ")[1],
        section: data[2].split(": ")[1],
        timestamp: new Date().toLocaleString()
    };
}

function registerAttendance(studentData) {
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `<p>Asistencia Registrada: ${studentData.name} (${studentData.id}) - ${studentData.timestamp}</p>`;
}

// Función para buscar asistencia por alumno
function buscarAsistencia() {
    const id = prompt("Ingresa el ID del estudiante:");
    // Aquí se implementará la lógica para buscar y mostrar la asistencia
    console.log(`Buscando asistencia para el ID: ${id}`);
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
        console.error(`Error de escaneo: ${errorMessage}`);
    }
).then(() => {
    console.log("Escáner iniciado correctamente");
}).catch(err => {
    console.error(`Error al iniciar el escáner: ${err}`);
});
