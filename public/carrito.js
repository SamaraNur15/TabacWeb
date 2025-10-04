document.addEventListener("DOMContentLoaded", () => {
    const listaCarrito = document.getElementById("lista-carrito");
    const subtotalEl = document.getElementById("subtotal");
    const descuentosEl = document.getElementById("descuentos");
    const totalEl = document.getElementById("total");

    // Leer carrito desde LocalStorage
    function obtenerCarrito() {
        return JSON.parse(localStorage.getItem("carrito")) || [];
    }

    // Guardar carrito en LocalStorage
    function guardarCarrito(carrito) {
        localStorage.setItem("carrito", JSON.stringify(carrito));
    }

    // Renderizar carrito
    function renderCarrito() {
        let carrito = obtenerCarrito();
        listaCarrito.innerHTML = "";

        let subtotal = 0;
        let descuentos = 0;

        carrito.forEach((p, i) => {
            const div = document.createElement("div");
            div.className = "producto-carrito";
            div.innerHTML = `
        <img src="${p.imagen}" alt="${p.nombre}" width="80">
        <div class="info-producto">
          <h3>${p.nombre}</h3>
          <p>Precio: $${p.precio}</p>
          <p>Cantidad: <input type="number" min="1" value="${p.cantidad}" id="cant-${i}"></p>
          <button id="eliminar-${i}">Eliminar</button>
        </div>
      `;
            listaCarrito.appendChild(div);

            subtotal += p.precio * p.cantidad;

            // Eliminar producto
            document.getElementById(`eliminar-${i}`).addEventListener("click", () => {
                carrito.splice(i, 1);
                guardarCarrito(carrito);
                renderCarrito();
            });

            // Cambiar cantidad
            document.getElementById(`cant-${i}`).addEventListener("change", (e) => {
                carrito[i].cantidad = parseInt(e.target.value);
                guardarCarrito(carrito);
                renderCarrito();
            });
        });

        subtotalEl.textContent = `$${subtotal}`;
        descuentosEl.textContent = `- $${descuentos}`;
        totalEl.textContent = `$${subtotal - descuentos}`;
    }

    renderCarrito();
});