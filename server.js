const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public')); // Servir archivos estáticos desde la carpeta 'public'

// Ruta para servir el archivo index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para registrar asistencia
app.post('/register', (req, res) => {
    const attendanceData = req.body;
    const attendanceFilePath = path.join(__dirname, 'attendance.json');

    fs.readFile(attendanceFilePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Error al leer el archivo de asistencia');
        }

        const attendanceRecords = JSON.parse(data);
        attendanceRecords.push(attendanceData);

        fs.writeFile(attendanceFilePath, JSON.stringify(attendanceRecords, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Error al guardar la asistencia');
            }
            res.status(200).send('Asistencia registrada');
        });
    });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
