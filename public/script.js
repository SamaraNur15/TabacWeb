const API_BASE = "http://localhost:3000/api";

async function apiFetch(path, options = {}) {
    const url = `${API_BASE}${path}`;
    try {
        const res = await fetch(url, {
            headers: { "Content-Type": "application/json" },
            ...options,
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `Error HTTP ${res.status}`);
        }
        return await res.json();
    } catch (err) {
        console.error("Error en fetch:", err);
        alert(`Error: ${err.message}`);
        return null;
    }
}

function renderList(containerId, data, mapper) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";
    if (!data || data.length === 0) {
        container.innerHTML = "<li>No hay datos</li>";
        return;
    }

    data.forEach((item) => {
        const li = document.createElement("li");
        li.innerHTML = mapper(item);
        container.appendChild(li);
    });
}

async function cargarUsuarios() {
    const usuarios = await apiFetch("/usuarios");
    renderList("lista-usuarios", usuarios, (u) => `<strong>${u.nombre}</strong> (${u.email})`);
}

function setupAgregarUsuario() {
    const form = document.getElementById("form-usuario");
    if (!form) return;

    form.addEventListener("submit", async(e) => {
        e.preventDefault();
        const data = {
            nombre: form.nombre.value.trim(),
            email: form.email.value.trim(),
        };

        if (!data.nombre || !data.email) {
            alert("Por favor completa todos los campos");
            return;
        }

        const result = await apiFetch("/usuarios", {
            method: "POST",
            body: JSON.stringify(data),
        });

        if (result) {
            form.reset();
            cargarUsuarios();
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    cargarUsuarios();
    setupAgregarUsuario();
});