document.getElementById("form-registro").addEventListener("submit", async(e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, email, password })
        });

        const data = await res.json();
        console.log(data); // Para debug

        if (res.ok) {
            alert("Usuario registrado con éxito ✅");
            window.location.href = "login.html"; // Redirige a login
        } else {
            alert(data.message || "Error en el registro");
        }
    } catch (error) {
        alert("Error al conectar con el servidor");
        console.error(error);
    }
});