const express = require('express');
const bodyParser = require('body-parser');
const xlsx = require('xlsx');
const path = require('path');

const app = express();
app.use(bodyParser.json());

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Serve index.html on the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const workbook = xlsx.readFile(path.join(__dirname, 'Listados de Estudiantes', 'Listados de Estudiantes.xlsx'));
const sheetName = workbook.SheetNames[0];
const studentsData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

// Get all students
app.get('/students', (req, res) => {
    res.json(studentsData);
});

app.get('/grades', (req, res) => {
    res.json(['1ro básico', '2do básico', '3ro básico']);
});

// Get students by grade
app.get('/students/grade/:grade', (req, res) => {
    const grade = req.params.grade;
    const filteredStudents = studentsData.filter(student => student['Grado y seccion'] === grade);
    res.json(filteredStudents);
});

// Get student by ID or code
app.get('/students/:id', (req, res) => {
    const id = req.params.id;
    const student = studentsData.find(student => student['CLAVE'] === id || student['CODIGO'] === id);
    if (student) {
        const scanTime = new Date().toLocaleString(); // Registrar la hora del escaneo
        res.json({ ...student, scanTime });
    } else {
        res.status(404).send('Student not found');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
