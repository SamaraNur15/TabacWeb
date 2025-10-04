// public/Iniciar Sesion/login.js
// login.js (con merge carrito)
document.querySelector(".login-box form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.querySelector(".login-box input[type='email']").value.trim();
  const password = document.querySelector(".login-box input[type='password']").value;

  try {
    // 1) Login
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Usuario o contraseña incorrectos ❌");
      return;
    }

    // 2) Detectar userId
    const userIdReal =
      data?.user?._id || data?.user?.id || data?._id || data?.id ||
      data?.uid || data?.username || data?.email;

    if (!userIdReal) {
      alert("No pude identificar el usuario devuelto por el servidor.");
      console.error("Payload login:", data);
      return;
    }

    // 3) Guardar token/usuario
    if (data?.token) localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify(data.user || data));

    // 4) MERGE carrito
    const oldId = localStorage.getItem("userId") || "anon-1";
    if (oldId && oldId !== userIdReal) {
      try {
        await fetch("/api/carrito/merge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fromUserId: oldId, toUserId: userIdReal, strategy: "sum" })
        });
      } catch (e) {
        console.warn("Falló el merge del carrito (no bloquea):", e);
      }
    }

    // 5) Fijar userId real y redirigir
    localStorage.setItem("userId", userIdReal);
    window.location.href = "/carta.html";

  } catch (error) {
    alert("Error al conectar con el servidor");
    console.error(error);
  }
});
