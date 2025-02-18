const html5QrCode = new Html5Qrcode("reader");

function onScanSuccess(qrCodeMessage) {
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
<<<<<<< HEAD

=======
>>>>>>> 97b421d7b97a40753983f0f30c92c668950c1411
).catch(err => {
    console.error(`Error al iniciar el escáner: ${err}`);
});
