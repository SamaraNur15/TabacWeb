const lista = document.getElementById("lista-carrito");
const subtotalEl = document.getElementById("subtotal");
const descuentosEl = document.getElementById("descuentos");
const totalEl = document.getElementById("total");
const btnRetirar = document.getElementById("btn-retirar");
const btnDelivery = document.getElementById("btn-delivery");
const btnFinalizar = document.getElementById("finalizar-pedido");

let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let metodoEntrega = "retirar";

// Renderiza carrito
function renderCarrito() {
  lista.innerHTML = "";

  if (carrito.length === 0) {
    lista.innerHTML = "<p>Tu carrito está vacío. <a href='carta.html'>Ir a la carta</a></p>";
    document.querySelector(".resumen-carrito").style.display = "none";
    return;
  }

  let subtotal = 0;
  let descuento = 0;

  carrito.forEach((item, index) => {
    subtotal += item.precio * item.cantidad;

    if (item.cantidad >= 2) descuento += item.precio * item.cantidad * 0.2;

    const div = document.createElement("div");
    div.className = "item-carrito";
    div.innerHTML = `
      <img src="${item.imagen}" alt="${item.nombre}">
      <div class="item-info">
        <h3>${item.nombre}</h3>
        <p>${item.descripcion || ""}</p>
        <p class="precio-item">$${item.precio.toLocaleString("es-AR")}</p>
      </div>
      <div class="controles-cantidad">
        <button onclick="cambiarCantidad(${index}, -1)">−</button>
        <span>${item.cantidad}</span>
        <button onclick="cambiarCantidad(${index}, 1)">+</button>
      </div>
      <button class="btn-eliminar" onclick="eliminar(${index})">Eliminar</button>
    `;
    lista.appendChild(div);
  });

  subtotalEl.textContent = `$${subtotal.toLocaleString("es-AR")}`;
  descuentosEl.textContent = `- $${descuento.toLocaleString("es-AR")}`;
  totalEl.textContent = `$${(subtotal - descuento).toLocaleString("es-AR")}`;
}

function cambiarCantidad(index, delta) {
  carrito[index].cantidad += delta;
  if (carrito[index].cantidad <= 0) {
    carrito.splice(index, 1);
  }
  guardarYActualizar();
}

function eliminar(index) {
  carrito.splice(index, 1);
  guardarYActualizar();
}

function guardarYActualizar() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
  renderCarrito();
}

// Método de entrega
btnRetirar.addEventListener("click", () => {
  metodoEntrega = "retirar";
  btnRetirar.classList.add("active");
  btnDelivery.classList.remove("active");
});
btnDelivery.addEventListener("click", () => {
  metodoEntrega = "delivery";
  btnDelivery.classList.add("active");
  btnRetirar.classList.remove("active");
});

// Finalizar pedido
btnFinalizar.addEventListener("click", () => {
  if (carrito.length === 0) {
    alert("El carrito está vacío.");
    return;
  }
  window.location.href = "/checkout";
});

renderCarrito();
