// registro.js
document.getElementById("form-registro").addEventListener("submit", async(e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const telefono = document.getElementById("telefono").value;
    const direccion = document.getElementById("direccion").value;

    try {
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, email, password, telefono, direccion })
        });

        const data = await res.json();
        console.log(data);

        if (res.ok) {
            alert("Usuario registrado con éxito ✅");
            window.location.href = "../Iniciar Sesion/index.html"; // Redirige a login
        } else {
            alert(data.message || "Error en el registro ❌");
        }
    } catch (error) {
        alert("Error al conectar con el servidor");
        console.error(error);
    }
});