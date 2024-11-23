const express = require('express');
const bodyParser = require('body-parser');
const XLSX = require('xlsx');
const cors = require('cors');
const app = express();

console.log('Starting server initialization...');

// Enable CORS for all routes
app.use(cors());
app.use(bodyParser.json());

// Store attendance data in memory with a limit
const MAX_RECORDS = 1000;
let attendanceData = [];

// Store recent scans to prevent duplicates (with automatic cleanup)
const recentScans = new Map();
const SCAN_COOLDOWN = 5000; // 5 seconds cooldown
const CLEANUP_INTERVAL = 60000; // Clean up every minute

// Cleanup old scan records periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, time] of recentScans.entries()) {
        if (now - time > SCAN_COOLDOWN) {
            recentScans.delete(key);
        }
    }
}, CLEANUP_INTERVAL);

app.post('/register-attendance', (req, res) => {
    try {
        const { id, name } = req.body;
        const now = Date.now();
        const scanKey = `${id}-${name}`;
        
        // Check for recent scan
        const lastScanTime = recentScans.get(scanKey);
        if (lastScanTime && (now - lastScanTime) < SCAN_COOLDOWN) {
            return res.status(429).json({
                error: 'Por favor espere unos segundos antes de escanear nuevamente'
            });
        }

        // Update scan time
        recentScans.set(scanKey, now);

        // Add attendance record
        const record = {
            ...req.body,
            timestamp: now
        };

        // Maintain max records limit
        if (attendanceData.length >= MAX_RECORDS) {
            attendanceData.shift(); // Remove oldest record
        }
        attendanceData.push(record);

        res.sendStatus(200);
    } catch (error) {
        console.error('Error registering attendance:', error);
        res.status(500).send('Error al registrar asistencia');
    }
});

app.get('/download-excel', (req, res) => {
    try {
        const ws = XLSX.utils.json_to_sheet(attendanceData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');
        const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Asistencia.xlsx');
        res.send(excelBuffer);
    } catch (error) {
        console.error('Error generating Excel:', error);
        res.status(500).send('Error al generar Excel');
    }
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
                let isProcessing = false;

                function showSuccessModal() {
                    const modal = document.getElementById('successModal');
                    modal.style.display = 'block';
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 2000);
                }

                function showError(message) {
                    const errorMsg = document.getElementById('errorMessage');
                    errorMsg.textContent = message || 'Error al registrar la asistencia';
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
                    if (isProcessing) return;

                    isProcessing = true;
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
                                return response.json().then(data => {
                                    showError(data.error || 'Error al registrar la asistencia');
                                });
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            showError();
                        })
                        .finally(() => {
                            setTimeout(() => {
                                isProcessing = false;
                            }, 5000);
                        });
                    } catch (error) {
                        console.error('Error al procesar el código QR:', error);
                        showError();
                        isProcessing = false;
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

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        records: attendanceData.length,
        recentScans: recentScans.size
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT}`);
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
