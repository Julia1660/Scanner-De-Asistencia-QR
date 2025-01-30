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
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `<h2>Asistencia por Alumno</h2>
                          <input type="text" placeholder="ID del estudiante" value="${id}">
                          <button onclick="mostrarAsistencia('${id}')">Buscar</button>`;
    // Aquí se implementará la lógica para buscar y mostrar la asistencia
}

// Función para mostrar la asistencia
function mostrarAsistencia(id) {
    console.log(`Mostrando asistencia para el ID: ${id}`);
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
