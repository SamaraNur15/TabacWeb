document.addEventListener("DOMContentLoaded", () => {
    const grids = {
        salado: document.getElementById("grid-salado"),
        dulce: document.getElementById("grid-dulce"),
        bebidas: document.getElementById("grid-bebidas"),
    };

    function renderProducto(producto) {
        return `
      <article class="card-producto">
        <img src="${producto.imagen}" alt="${producto.nombre}" class="card-producto__img"/>
        <div class="card-producto__body">
          <h3 class="card-producto__title">${producto.nombre}</h3>
          <p class="card-producto__price">$${producto.precio}</p>
          <a href="detalle.html?id=${producto._id}" class="btn-detalle">Ver detalle</a>
        </div>
      </article>
    `;
    }

    fetch("/api/comidas")
        .then(res => res.json())
        .then(data => {
            data.forEach(p => {
                const cat = p.categoria ? p.categoria.toLowerCase() : '';
                if (grids[cat]) grids[cat].innerHTML += renderProducto(p);
            });
        })
        .catch(err => {
            console.error("Error al cargar productos:", err);
            Object.values(grids).forEach(grid => {
                grid.innerHTML = '<p>No se pudieron cargar los productos. Intenta recargar la página.</p>';
            });
        });
});