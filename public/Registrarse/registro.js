// registro.js (auto-login + merge carrito)
document.getElementById("form-registro").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre    = document.getElementById("nombre").value.trim();
  const email     = document.getElementById("email").value.trim();
  const password  = document.getElementById("password").value;
  const telefono  = document.getElementById("telefono")?.value || "";
  const direccion = document.getElementById("direccion")?.value || "";

  try {
    // 1) Registro
    const rReg = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, password, telefono, direccion })
    });
    const dataReg = await rReg.json();
    if (!rReg.ok) {
      alert(dataReg.message || "Error en el registro ❌");
      return;
    }

    // 2) Login automático
    const rLog = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const dataLog = await rLog.json();
    if (!rLog.ok) {
      // Si por algún motivo falla el login, redirigimos al formulario de iniciar sesión
      alert(dataLog.message || "Registrado. Inicia sesión para continuar.");
      window.location.href = "/Iniciar Sesion/index.html";
      return;
    }

    // 3) Extraer un userId real de la respuesta (flexible según tu backend)
    const userIdReal =
      dataLog?.user?._id || dataLog?.user?.id || dataLog?._id || dataLog?.id ||
      dataLog?.uid || dataLog?.username || dataLog?.email;

    if (!userIdReal) {
      alert("No pude identificar el usuario devuelto por el servidor.");
      console.error("Payload login:", dataLog);
      return;
    }

    // 4) Guardar token/usuario si vienen
    if (dataLog?.token) localStorage.setItem("token", dataLog.token);
    localStorage.setItem("usuario", JSON.stringify(dataLog.user || dataLog));

    // 5) MERGE del carrito: de anónimo → usuario real
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

    // 6) Fijar userId real para el resto del sitio y redirigir
    localStorage.setItem("userId", userIdReal);
    window.location.href = "/carta.html"; // usa ruta absoluta para evitar líos de carpetas

  } catch (err) {
    alert("Error al conectar con el servidor");
    console.error(err);
  }
});
