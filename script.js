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

function toggleMenu() {
    console.log("Toggle Menu function called"); // Registro para depuración
    const dropdown = document.getElementById("dropdown");
    dropdown.style.display = dropdown.style.display === "none" ? "block" : "none";
}

// Función para buscar asistencia por alumno
function buscarAsistencia() {
    const id = prompt("Ingresa el ID del estudiante:");
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `<h2>Asistencia por Alumno</h2>
                          <input type="text" placeholder="ID del estudiante" value="${id}">
                          <button onclick="mostrarAsistencia('${id}')">Buscar</button>`;
}

// Función para mostrar la asistencia
function mostrarAsistencia(id) {
    console.log(`Mostrando asistencia para el ID: ${id}`);
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = `<h2>Asistencia para el ID: ${id}</h2>`;
}

// Función para descargar asistencia
function descargarAsistencia() {
    console.log("Descargando asistencia...");
    const attendanceData = [
        { id: "123", name: "Estudiante 1", timestamp: "2023-10-01" },
        { id: "456", name: "Estudiante 2", timestamp: "2023-10-02" }
    ];
    
    const csvContent = "data:text/csv;charset=utf-8," 
        + attendanceData.map(e => `${e.id},${e.name},${e.timestamp}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "asistencia.csv");
    document.body.appendChild(link); // Required for FF

    link.click();
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
