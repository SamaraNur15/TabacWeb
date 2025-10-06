const gridSalado = document.getElementById("grid-salado");
const gridDulce = document.getElementById("grid-dulce");
const gridBebidas = document.getElementById("grid-bebidas");
const btnBuscar = document.getElementById('btn-buscar');
const inputBuscar = document.getElementById('input-busqueda');

// Función para renderizar productos en un contenedor
function renderProductos(productos, contenedor) {
    contenedor.innerHTML = '';
    productos.forEach(p => {
        const div = document.createElement('div');
        div.className = 'producto';
        div.innerHTML = `
            <img src="${p.imagen}" alt="${p.nombre}">
            <h3>${p.nombre}</h3>
            <p>$${p.precio}</p>
            <a href="carta.html?id=${p._id}">Ver detalle</a>
        `;
        contenedor.appendChild(div);
    });
}

// Función para obtener productos con filtro
async function fetchProductos(filtro = '') {
    const res = await fetch('/api/comidas');
    const data = await res.json();

    let productosFiltrados = data;

    if (filtro) {
        const filtroLower = filtro.toLowerCase();

        if (['salado', 'dulce', 'bebidas'].includes(filtroLower)) {
            // Filtrar por categoría
            productosFiltrados = data.filter(p => p.categoria.toLowerCase() === filtroLower);
        } else {
            // Filtrar por nombre de producto
            productosFiltrados = data.filter(p => p.nombre.toLowerCase().includes(filtroLower));
        }
    }

    // Limpiar grillas
    gridSalado.innerHTML = '';
    gridDulce.innerHTML = '';
    gridBebidas.innerHTML = '';

    // Renderizar en cada grilla según su categoría
    renderProductos(productosFiltrados.filter(p => p.categoria.toLowerCase() === 'salado'), gridSalado);
    renderProductos(productosFiltrados.filter(p => p.categoria.toLowerCase() === 'dulce'), gridDulce);
    renderProductos(productosFiltrados.filter(p => p.categoria.toLowerCase() === 'bebidas'), gridBebidas);
}

// Mostrar todo al cargar la página
fetchProductos();

// Evento de búsqueda
btnBuscar.addEventListener('click', () => {
    const valor = inputBuscar.value.trim();
    fetchProductos(valor);
});