const express = require('express');
const bodyParser = require('body-parser');
const XLSX = require('xlsx');
const cors = require('cors');
const app = express();

console.log('Starting server initialization...');

// Enable CORS for all routes
app.use(cors());
app.use(bodyParser.json());

// Store attendance data by establishment and date
const attendanceData = new Map();

// Store recent scans to prevent duplicates
const recentScans = new Map();
const SCAN_COOLDOWN = 5000; // 5 seconds cooldown

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

// Initialize or get attendance data for today
function getAttendanceForToday(establishment) {
    const today = getTodayDate();
    const key = `${establishment}_${today}`;
    
    if (!attendanceData.has(key)) {
        attendanceData.set(key, []);
    }
    return attendanceData.get(key);
}

// Cleanup old records (keep only last 30 days)
function cleanupOldRecords() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    for (const [key] of attendanceData) {
        const [, date] = key.split('_');
        if (new Date(date) < thirtyDaysAgo) {
            attendanceData.delete(key);
        }
    }
}

// Run cleanup daily
setInterval(cleanupOldRecords, 24 * 60 * 60 * 1000);

// Cleanup old scan records periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, time] of recentScans.entries()) {
        if (now - time > SCAN_COOLDOWN) {
            recentScans.delete(key);
        }
    }
}, 60000);

app.post('/register-attendance', (req, res) => {
    try {
        const { id, name, establishment } = req.body;
        if (!establishment) {
            return res.status(400).json({
                error: 'Establecimiento no especificado'
            });
        }

        const now = Date.now();
        const scanKey = `${id}-${name}-${establishment}-${getTodayDate()}`;
        
        // Check for recent scan
        const lastScanTime = recentScans.get(scanKey);
        if (lastScanTime && (now - lastScanTime) < SCAN_COOLDOWN) {
            return res.status(429).json({
                error: 'Por favor espere unos segundos antes de escanear nuevamente'
            });
        }

        // Update scan time
        recentScans.set(scanKey, now);

        // Add attendance record for today
        const todayRecords = getAttendanceForToday(establishment);
        const record = {
            ...req.body,
            timestamp: now,
            date: new Date().toLocaleDateString()
        };
        todayRecords.push(record);

        res.sendStatus(200);
    } catch (error) {
        console.error('Error registering attendance:', error);
        res.status(500).send('Error al registrar asistencia');
    }
});

app.get('/download-excel/:establishment/:date?', (req, res) => {
    try {
        const { establishment, date } = req.params;
        const requestedDate = date || getTodayDate();
        const key = `${establishment}_${requestedDate}`;
        const records = attendanceData.get(key) || [];
        
        const ws = XLSX.utils.json_to_sheet(records);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');
        const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Asistencia_${establishment}_${requestedDate}.xlsx`);
        res.send(excelBuffer);
    } catch (error) {
        console.error('Error generating Excel:', error);
        res.status(500).send('Error al generar Excel');
    }
});

// Get available dates for an establishment
app.get('/dates/:establishment', (req, res) => {
    const { establishment } = req.params;
    const dates = Array.from(attendanceData.keys())
        .filter(key => key.startsWith(establishment + '_'))
        .map(key => key.split('_')[1])
        .sort()
        .reverse();
    res.json(dates);
});

// Página principal - con selección de establecimiento
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
                select {
                    display: block;
                    width: 100%;
                    max-width: 400px;
                    margin: 20px auto;
                    padding: 10px;
                    font-size: 16px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
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
                .button {
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
                .button:hover {
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
                #scannerContainer {
                    display: none;
                }
                #dateSelect {
                    margin-top: 10px;
                }
            </style>
        </head>
        <body>
            <h1>Escáner de Asistencia</h1>
            
            <select id="establishmentSelect" onchange="updateEstablishment()">
                <option value="">Seleccione un establecimiento</option>
                <option value="INEB_EnriqueGomez">INEB Enrique Gómez Carrillo</option>
                <option value="INED_SanBartolome">INED San Bartolomé</option>
                <option value="INEB_Magdalena">INEB Magdalena</option>
                <option value="INEB_SanAntonio">INEB San Antonio</option>
                <option value="INEB_SantaLucia">INEB Santa Lucía</option>
            </select>

            <div id="scannerContainer">
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
                
                <div>
                    <select id="dateSelect" onchange="updateDownloadLink()" class="button">
                        <option value="">Seleccione fecha</option>
                    </select>
                    <a id="downloadLink" href="#" class="button">Descargar Registro de Asistencia</a>
                </div>
            </div>
            
            <script>
                let currentEstablishment = '';
                let isProcessing = false;
                let html5QrCode = null;

                function updateEstablishment() {
                    const select = document.getElementById('establishmentSelect');
                    currentEstablishment = select.value;
                    const scannerContainer = document.getElementById('scannerContainer');
                    
                    if (currentEstablishment) {
                        scannerContainer.style.display = 'block';
                        initializeScanner();
                        loadDates();
                    } else {
                        scannerContainer.style.display = 'none';
                        if (html5QrCode) {
                            html5QrCode.stop();
                        }
                    }
                }

                function loadDates() {
                    fetch(\`/dates/\${currentEstablishment}\`)
                        .then(response => response.json())
                        .then(dates => {
                            const dateSelect = document.getElementById('dateSelect');
                            dateSelect.innerHTML = '<option value="">Seleccione fecha</option>';
                            dates.forEach(date => {
                                const option = document.createElement('option');
                                option.value = date;
                                option.textContent = new Date(date).toLocaleDateString();
                                dateSelect.appendChild(option);
                            });
                            updateDownloadLink();
                        });
                }

                function updateDownloadLink() {
                    const dateSelect = document.getElementById('dateSelect');
                    const downloadLink = document.getElementById('downloadLink');
                    const date = dateSelect.value || getTodayDate();
                    downloadLink.href = \`/download-excel/\${currentEstablishment}/\${date}\`;
                }

                function getTodayDate() {
                    return new Date().toISOString().split('T')[0];
                }

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
                    if (isProcessing || !currentEstablishment) return;

                    isProcessing = true;
                    try {
                        const [id, name] = decodedText.split('|');
                        const now = new Date();
                        const attendanceData = {
                            id: parseInt(id),
                            name: name,
                            date: now.toLocaleDateString(),
                            time: now.toLocaleTimeString(),
                            establishment: currentEstablishment
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
                                loadDates(); // Refresh dates list
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

                function initializeScanner() {
                    if (html5QrCode) {
                        html5QrCode.stop();
                    }

                    html5QrCode = new Html5Qrcode("reader");
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
                }
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
        establishments: Array.from(new Set(Array.from(attendanceData.keys()).map(key => key.split('_')[0])))
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
