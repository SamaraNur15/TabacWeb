document.addEventListener("DOMContentLoaded", () => {
    const linkSesion = document.getElementById("link-sesion");
    const usuario = JSON.parse(localStorage.getItem("usuario"));

    if (usuario) {
        linkSesion.textContent = usuario.nombre; // muestra nombre del usuario
        linkSesion.href = "#"; // ya no redirige a login
    }

    // Logout opcional al hacer clic en el nombre
    linkSesion.addEventListener("click", () => {
        if (usuario) {
            localStorage.removeItem("usuario");
            window.location.reload(); // recarga para volver a mostrar "Iniciar Sesión"
        }
    });
});