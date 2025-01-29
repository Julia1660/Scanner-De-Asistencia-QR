let scannedCodes = new Set();
let attendance = {};

function startScanner() {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // Agregar el elemento de video al contenedor
    const qrScannerDiv = document.getElementById('qrScanner');
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

    if (!attendance[grade]) {
        attendance[grade] = {};
    }
    if (!attendance[grade][date]) {
        attendance[grade][date] = new Set();
    }

    attendance[grade][date].add(code);
    markAttendance();
}

function markAttendance() {
    const date = document.getElementById('dateSelect').value;
    const grade = document.getElementById('gradeSelect').value;

    const markersDiv = document.getElementById('attendanceMarkers');
    markersDiv.innerHTML = ''; // Limpiar marcadores anteriores

    if (attendance[grade] && attendance[grade][date]) {
        attendance[grade][date].forEach(code => {
            const marker = document.createElement('div');
            marker.className = 'marked';
            markersDiv.appendChild(marker);
        });
    }
}

function downloadAttendance() {
    const grade = document.getElementById('gradeSelect').value;
    const data = JSON.stringify(attendance[grade], null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${grade}_asistencia.json`;
    a.click();
    URL.revokeObjectURL(url);
}

document.getElementById('gradeSelect').addEventListener('change', (event) => {
    const selectedGrade = event.target.value;
    if (selectedGrade) {
        // Mostrar la cámara
        startScanner();
    }
});
function downloadAttendance() {
    const grade = document.getElementById('gradeSelect').value;
    const data = JSON.stringify(attendance[grade], null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${grade}_asistencia.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Aquí se puede agregar la lógica para generar un archivo de Excel
}


document.getElementById('gradeSelect').addEventListener('change', (event) => {
    const selectedGrade = event.target.value;
    if (selectedGrade) {
        startScanner();
    }
});
