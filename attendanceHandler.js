const fs = require('fs');
const path = require('path');

const attendanceFilePath = path.join(__dirname, 'attendance.json');

// Función para registrar la asistencia
function registerAttendance(studentData) {
    // Leer el archivo de asistencia existente
    fs.readFile(attendanceFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error al leer el archivo de asistencia:", err);
            return;
        }

        const attendanceRecords = JSON.parse(data);
        attendanceRecords.push(studentData);

        // Guardar los registros actualizados en el archivo
        fs.writeFile(attendanceFilePath, JSON.stringify(attendanceRecords, null, 2), (err) => {
            if (err) {
                console.error("Error al guardar la asistencia:", err);
                return;
            }
            console.log("Asistencia registrada:", studentData);
        });
    });
}

module.exports = { registerAttendance };
