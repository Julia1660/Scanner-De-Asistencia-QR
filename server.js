const express = require('express');
const bodyParser = require('body-parser');
const XLSX = require('xlsx');
const cors = require('cors');
const app = express();
const path = require('path');

console.log('Starting server initialization...');

// Enable CORS for all routes
app.use(cors());
app.use(bodyParser.json());

// Serve static files from public directory
app.use(express.static('public'));

// Store attendance data in memory
let attendanceData = [];

// Log middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

app.post('/register-attendance', (req, res) => {
    try {
        console.log('Registering attendance:', req.body);
        attendanceData.push(req.body);
        res.sendStatus(200);
    } catch (error) {
        console.error('Error registering attendance:', error);
        res.status(500).send('Error al registrar asistencia');
    }
});

app.get('/download-excel', (req, res) => {
    try {
        console.log('Generating Excel file...');
        const ws = XLSX.utils.json_to_sheet(attendanceData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');
        
        // Generate Excel file in memory
        const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Asistencia.xlsx');
        res.send(excelBuffer);
        console.log('Excel file sent successfully');
    } catch (error) {
        console.error('Error generating Excel:', error);
        res.status(500).send('Error al generar Excel');
    }
});

// Página principal - solo escáner
app.get('/', (req, res) => {
    console.log('Serving main page...');
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

// Health check endpoint
app.get('/health', (req, res) => {
    console.log('Health check requested');
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started successfully`);
    console.log(`Running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Node version: ${process.version}`);
});

// Error handling
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
