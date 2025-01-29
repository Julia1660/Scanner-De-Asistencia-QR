navigator.mediaDevices.getUserMedia({ video: true })
    .then(function(stream) {
        console.log("Cámara accedida con éxito.");
        // Aquí podrías agregar lógica para mostrar el video en un elemento <video>
    })
    .catch(function(err) {
        console.error("Error al acceder a la cámara: " + err);
    });
