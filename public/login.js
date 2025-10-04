document.getElementById("form-login").addEventListener("submit", async(e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        console.log(data); // Para debug

        if (res.ok) {
            // Guardamos directamente lo que devuelve el backend
            localStorage.setItem("usuario", JSON.stringify(data));
            window.location.href = "index.html"; // Redirige al inicio
        } else {
            alert(data.message || "Credenciales incorrectas ❌");
        }
    } catch (error) {
        alert("Error al conectar con el servidor");
        console.error(error);
    }
});