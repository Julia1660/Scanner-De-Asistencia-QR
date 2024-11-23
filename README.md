# Sistema de Asistencia QR

Sistema de registro de asistencia mediante códigos QR, con soporte para múltiples dispositivos y redes.

## Características

- Escaneo de códigos QR para registro de asistencia
- Interfaz web responsive
- Mensaje de confirmación al escanear
- Descarga de registros en Excel
- Persistencia de datos
- Accesible desde cualquier red

## Requisitos

- Node.js 14 o superior
- NPM

## Instalación Local

1. Clonar el repositorio
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Iniciar el servidor:
   ```bash
   npm start
   ```

## Despliegue en la Nube (Render)

1. Crear una cuenta en [Render](https://render.com)
2. Crear un nuevo Web Service
3. Conectar con el repositorio de GitHub
4. Configurar:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Node`

## Despliegue en la Nube (Heroku)

1. Crear una cuenta en [Heroku](https://heroku.com)
2. Instalar Heroku CLI
3. Ejecutar:
   ```bash
   heroku login
   heroku create
   git push heroku main
   ```

## Uso

1. Acceder a la URL del servidor (local o en la nube)
2. Permitir acceso a la cámara cuando se solicite
3. Escanear códigos QR
4. Los registros se guardan automáticamente
5. Descargar registros con el botón "Descargar Registro de Asistencia"

## Estructura de Archivos

- `server.js`: Servidor principal
- `data/`: Directorio para almacenamiento de datos
- `qr_codes/`: Directorio para códigos QR generados
