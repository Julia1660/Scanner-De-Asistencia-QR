let scannedCodes = new Set();
let attendance = {};

function startScanner() {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Agregar el elemento de video al contenedor
    const qrScannerDiv = document.getElementById('qrScanner');
    qrScannerDiv.innerHTML = ''; // Limpiar contenido anterior
    qrScannerDiv.appendChild(video);

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            video.setAttribute('playsinline', true); // required to tell iOS safari we don't want fullscreen
            video.play();
            requestAnimationFrame(scan);
        });

    function scan() {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, canvas.width, canvas.height);

            if (code && !scannedCodes.has(code.data)) {
                scannedCodes.add(code.data);
                alert("Escaneado exitosamente: " + code.data);
                recordAttendance(code.data);
            }
        }
        requestAnimationFrame(scan);
    }
}

function recordAttendance(code) {
    const date = document.getElementById('dateSelect').value;
    const grade = document.getElementById('gradeSelect').value;
    const section = document.getElementById('sectionSelect').value; // Obtener la sección

    if (!attendance[grade]) {
        attendance[grade] = {};
    }
    if (!attendance[grade][date]) {
        attendance[grade][date] = [];
    }

    attendance[grade][date].push({ id: code, name: "Nombre del Estudiante", section: section, time: new Date().toLocaleTimeString() });
    markAttendance();
}

function markAttendance() {
    const date = document.getElementById('dateSelect').value;
    const grade = document.getElementById('gradeSelect').value;

    const markersDiv = document.getElementById('attendanceMarkers');
    markersDiv.innerHTML = ''; // Limpiar marcadores anteriores

    if (attendance[grade] && attendance[grade][date]) {
        attendance[grade][date].forEach(record => {
            const marker = document.createElement('div');
            marker.className = 'marked';
            markersDiv.appendChild(marker);
        });
    }
}

function downloadAttendance() {
    const grade = document.getElementById('gradeSelect').value;
    const data = attendance[grade]; // Obtener los datos de asistencia
    const workbook = XLSX.utils.book_new(); // Crear un nuevo libro de Excel
    const worksheetData = [];

    // Agregar encabezados
    worksheetData.push(["ID", "Nombre", "Grado", "Sección", "Hora de Registro", "Fecha"]);

    // Agregar datos de asistencia
    for (const date in data) {
        data[date].forEach(record => {
            worksheetData.push([record.id, record.name, grade, record.section, record.time, date]);
        });
    }

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Asistencia");

    // Descargar el archivo de Excel
    XLSX.writeFile(workbook, `${grade}_asistencia.xlsx`);
}

document.getElementById('gradeSelect').addEventListener('change', (event) => {
    const selectedGrade = event.target.value;
    const selectedSection = document.getElementById('sectionSelect').value; // Asegúrate de tener un select para la sección
    if (selectedGrade && selectedSection) {
        // Mostrar la cámara
        startScanner();
    }
});
