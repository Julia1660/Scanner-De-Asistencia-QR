const express = require('express');
const bodyParser = require('body-parser');
const XLSX = require('xlsx');
const qrcode = require('qrcode');
const cors = require('cors');
const app = express();
const path = require('path');
const fs = require('fs');

// Enable CORS for all routes
app.use(cors());

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Ensure data persistence directories exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Store attendance data in a file
const attendanceFile = path.join(dataDir, 'attendance.json');
let attendanceData = [];

// Load existing attendance data if available
if (fs.existsSync(attendanceFile)) {
    try {
        attendanceData = JSON.parse(fs.readFileSync(attendanceFile, 'utf8'));
    } catch (error) {
        console.error('Error loading attendance data:', error);
    }
}

// Save attendance data to file
function saveAttendanceData() {
    try {
        fs.writeFileSync(attendanceFile, JSON.stringify(attendanceData));
    } catch (error) {
        console.error('Error saving attendance data:', error);
    }
}

app.post('/register-attendance', (req, res) => {
    attendanceData.push(req.body);
    saveAttendanceData();
    res.sendStatus(200);
});

app.get('/download-excel', (req, res) => {
    const ws = XLSX.utils.json_to_sheet(attendanceData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');
    const filePath = path.join(dataDir, 'Asistencia.xlsx');
    XLSX.writeFile(wb, filePath);
    res.download(filePath);
});

// Página principal - solo escáner
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Escáner de Asistencia QR</title>
            <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f5f5f5;
                }
                h1 {
                    color: #333;
                    text-align: center;
                    margin-bottom: 30px;
                }
                #reader {
                    margin: 0 auto;
                    max-width: 600px;
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0,0,0,0.5);
                    z-index: 1000;
                }
                .modal-content {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background-color: #4CAF50;
                    color: white;
                    padding: 20px 40px;
                    border-radius: 8px;
                    text-align: center;
                    font-size: 1.2em;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    z-index: 1001;
                }
                .error-message {
                    background-color: #f44336;
                    color: white;
                    padding: 15px;
                    border-radius: 4px;
                    margin: 10px 0;
                    display: none;
                    text-align: center;
                }
                .download-button {
                    display: block;
                    margin: 20px auto;
                    padding: 10px 20px;
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    text-decoration: none;
                    text-align: center;
                    width: fit-content;
                }
                .download-button:hover {
                    background-color: #45a049;
                }
                #loading {
                    text-align: center;
                    color: #666;
                    margin: 20px 0;
                }
                #cameraError {
                    display: none;
                    color: #f44336;
                    text-align: center;
                    margin: 20px 0;
                }
                #lastScanned {
                    margin: 20px auto;
                    padding: 15px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    max-width: 600px;
                    text-align: center;
                    display: none;
                }
            </style>
        </head>
        <body>
            <h1>Escáner de Asistencia</h1>
            
            <div id="loading">Iniciando cámara...</div>
            <div id="cameraError">No se pudo acceder a la cámara. Por favor, asegúrese de que tiene una cámara conectada y ha dado los permisos necesarios.</div>
            <div id="reader"></div>

            <div id="lastScanned"></div>
            <div id="errorMessage" class="error-message">Error al registrar la asistencia</div>
            
            <div id="successModal" class="modal">
                <div class="modal-content">
                    Código escaneado exitosamente
                </div>
            </div>
            
            <a href="/download-excel" class="download-button">Descargar Registro de Asistencia</a>
            
            <script>
                function showSuccessModal() {
                    const modal = document.getElementById('successModal');
                    modal.style.display = 'block';
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 2000);
                }

                function showError() {
                    const errorMsg = document.getElementById('errorMessage');
                    errorMsg.style.display = 'block';
                    setTimeout(() => {
                        errorMsg.style.display = 'none';
                    }, 3000);
                }

                function updateLastScanned(name) {
                    const lastScanned = document.getElementById('lastScanned');
                    lastScanned.style.display = 'block';
                    lastScanned.textContent = 'Último registro: ' + name;
                    setTimeout(() => {
                        lastScanned.style.display = 'none';
                    }, 3000);
                }

                function onScanSuccess(decodedText) {
                    try {
                        const [id, name] = decodedText.split('|');
                        const now = new Date();
                        const attendanceData = {
                            id: parseInt(id),
                            name: name,
                            date: now.toLocaleDateString(),
                            time: now.toLocaleTimeString()
                        };

                        fetch('/register-attendance', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(attendanceData)
                        })
                        .then(response => {
                            if (response.ok) {
                                updateLastScanned(name);
                                showSuccessModal();
                            } else {
                                showError();
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            showError();
                        });
                    } catch (error) {
                        console.error('Error al procesar el código QR:', error);
                        showError();
                    }
                }

                document.addEventListener('DOMContentLoaded', () => {
                    const html5QrCode = new Html5Qrcode("reader");
                    const config = {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    };

                    html5QrCode.start(
                        { facingMode: "environment" },
                        config,
                        onScanSuccess,
                        (errorMessage) => {
                            // Manejar errores silenciosamente
                        }
                    ).then(() => {
                        document.getElementById('loading').style.display = 'none';
                    }).catch(err => {
                        document.getElementById('loading').style.display = 'none';
                        document.getElementById('cameraError').style.display = 'block';
                        console.error('Error al iniciar el escáner:', err);
                    });
                });
            </script>
        </body>
        </html>
    `);
});

// Ruta para generar QR
app.get('/generate', async (req, res) => {
    const qrDirectory = path.join(__dirname, 'qr_codes');
    if (!fs.existsSync(qrDirectory)) {
        fs.mkdirSync(qrDirectory);
    }

    try {
        for (let i = 1; i <= 1000; i++) {
            const id = i.toString().padStart(4, '0');
            const data = `${id}|NOMBRE_${id}`;
            const qrPath = path.join(qrDirectory, `qr_${id}.png`);
            await qrcode.toFile(qrPath, data);
        }

        res.send('QR codes generated successfully in qr_codes directory');
    } catch (error) {
        res.status(500).send('Error generating QR codes: ' + error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
