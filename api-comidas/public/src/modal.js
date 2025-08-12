let imagenSeleccionada = "";
let descripcionSeleccionada = "";
const modal = document.getElementById("modal-producto");
const backdrop = document.getElementById("modal-backdrop");
const cerrarBtn = document.getElementById("cerrar-modal");
const cantidadSpan = document.getElementById("cantidad");
const sumarBtn = document.getElementById("sumar");
const restarBtn = document.getElementById("restar");
const btnAgregar = document.getElementById("btn-agregar");
const precioTotal = document.getElementById("precio-total");
const tituloModal = document.getElementById("titulo-modal");

let precioBase = 10000;
let cantidad = 1;

function abrirModal(nombre, precio) {
  tituloModal.textContent = nombre;
  precioBase = precio;
  cantidad = 1;
  cantidadSpan.textContent = cantidad;
  actualizarPrecio();
  modal.hidden = false;
  backdrop.hidden = false;
  document.body.style.overflow = 'hidden'; // evitar scroll
  btnAgregar.disabled = false;

  function abrirModal(nombre, precio) {
  tituloModal.textContent = nombre;
  precioBase = precio;
  cantidad = 1;
  cantidadSpan.textContent = cantidad;
  actualizarPrecio();
  modal.hidden = false;
  backdrop.hidden = false;
  document.body.style.overflow = 'hidden';

  const productoCard = [...document.querySelectorAll(".card-producto, .card-postre")]
    .find(card => card.querySelector("h3")?.textContent === nombre);

  if (productoCard) {
    const img = productoCard.querySelector("img");
    imagenSeleccionada = img?.getAttribute("src") || "";

    descripcionSeleccionada = productoCard.querySelector(".desc")?.textContent || "";
  }
}

}

function cerrarModal() {
  modal.hidden = true;
  backdrop.hidden = true;
  document.body.style.overflow = 'auto';
}

function actualizarPrecio() {
  precioTotal.textContent = `$${(precioBase * cantidad).toLocaleString("es-AR")}`;
  btnAgregar.disabled = cantidad === 0;
}

sumarBtn.addEventListener("click", () => {
  cantidad++;
  cantidadSpan.textContent = cantidad;
  actualizarPrecio();
});

restarBtn.addEventListener("click", () => {
  if (cantidad > 0) {
    cantidad--;
    cantidadSpan.textContent = cantidad;
    actualizarPrecio();
  }
});

cerrarBtn.addEventListener("click", cerrarModal);
backdrop.addEventListener("click", cerrarModal);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") cerrarModal();
});


function prepararModalPara(selector) {
  document.querySelectorAll(selector).forEach(card => {
    card.addEventListener("click", () => {
      const nombre = card.querySelector("h3")?.textContent || "Producto";
      const precioTexto = card.querySelector(".precio")?.childNodes[0]?.textContent.trim() || "$10000";
      const precio = parseInt(precioTexto.replace(/\D/g, "")) || 10000;
      abrirModal(nombre, precio);
    });
  });
}

prepararModalPara(".card-producto");
prepararModalPara(".card-postre");


btnAgregar.addEventListener("click", () => {
  const nombre = tituloModal.textContent;
  const imagen = imagenSeleccionada || "/img/default.png";
  const descripcion = descripcionSeleccionada || ""; 
  const producto = {
    nombre,
    precio: precioBase,
    cantidad,
    imagen: imagenSeleccionada || "/img/default.png",
    descripcion: descripcionSeleccionada || "",
  };

  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

  const existente = carrito.find(p => p.nombre === producto.nombre);
  if (existente) {
    existente.cantidad += producto.cantidad;
  } else {
    carrito.push(producto);
  }

  localStorage.setItem("carrito", JSON.stringify(carrito));
  cerrarModal();
});

