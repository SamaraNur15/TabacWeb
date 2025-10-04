document.querySelector(".login-box form").addEventListener("submit", async(e) => {
    e.preventDefault();

    const email = document.querySelector(".login-box input[type='email']").value;
    const password = document.querySelector(".login-box input[type='password']").value;

    try {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        console.log(data);

        if (res.ok) {
            // Guardar usuario en localStorage
            localStorage.setItem("usuario", JSON.stringify(data));
            // Redirigir a la carta
            window.location.href = "../carta.html";
        } else {
            alert(data.message || "Usuario o contraseña incorrectos ❌");
        }
    } catch (error) {
        alert("Error al conectar con el servidor");
        console.error(error);
    }
});