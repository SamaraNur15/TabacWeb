// ========= Config / utils =========
console.log('[carta.api.js] cargado');
// === Helpers para carrito por API ===
function getUID() {
  try {
    if (typeof window.getUserId === 'function') return window.getUserId();
    let id = localStorage.getItem('userId');
    if (!id) { id = 'anon-1'; localStorage.setItem('userId', id); }
    return id;
  } catch { return 'anon-1'; }
}

async function addToCartApi(productoId, cantidad = 1) {
  if (!productoId) throw new Error('Falta productoId');
  const r = await fetch(`/api/carrito/${encodeURIComponent(getUID())}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productoId, cantidad: Number(cantidad) || 1 })
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}



function resolveImgPath(src) {
    if (!src) return '/img/placeholder.png';
    if (src.startsWith('http') || src.startsWith('/')) return src;
    return '/img/' + src;
}

function mostrarToast(txt) {
    let t = document.getElementById('toast-cart');
    if (!t) {
        t = document.createElement('div');
        t.id = 'toast-cart';
        t.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#2fbf71;color:#fff;padding:10px 16px;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.2);z-index:9999;font-weight:600;transition:.2s';
        document.body.appendChild(t);
    }
    t.textContent = txt;
    t.style.opacity = '1';
    setTimeout(() => { t.style.opacity = '0'; }, 1200);
}

// ========= LocalStorage carrito =========
function getCarrito() {
    return JSON.parse(localStorage.getItem('carrito') || '[]');
}

function setCarrito(carrito) {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-add], .btn-add');
  if (!btn) return;

  // tomamos id del botón o del <article>
  const card = btn.closest('article');
  const productoId = btn.dataset.add || card?.dataset.id;

  if (!productoId) {
    console.error('No encontré productoId en data-add ni data-id');
    return;
  }

  try {
    await addToCartApi(productoId, 1);
    const nombre = (btn.dataset.nombre || card?.dataset?.nombre || 'Producto');
    if (typeof mostrarToast === 'function') mostrarToast(`${nombre} agregado al carrito`);
    console.log('[carrito] agregado', productoId);
  } catch (err) {
    console.error(err);
    alert('No se pudo agregar al carrito.');
  }
});

/*document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;

    const productoId = btn.dataset.add;
    const nombre = btn.dataset.nombre;
    const precio = Number(btn.closest('article').dataset.precio || 0);
    const imagen = btn.closest('article').dataset.imagen || '/img/placeholder.png';

});*/

function updateCartBadge() {
    const badge = document.querySelector('[data-cart-badge]');
    if (!badge) return;
    const carrito = getCarrito();
    const totalCant = carrito.reduce((acc, it) => acc + (it.cantidad || 0), 0);
    badge.textContent = totalCant > 0 ? String(totalCant) : '';
}

// ========= Render carta =========
const gridSalado = document.getElementById('grid-salado');
const gridDulce = document.getElementById('grid-dulce');
const gridBebidas = document.getElementById('grid-bebidas');
const chipsContainer = document.querySelector('.chips');
const ordenarSelect = document.getElementById('ordenar');

let allItems = [];
let currentFilter = 'todos';
let currentOrder = 'recomendados';

document.addEventListener('DOMContentLoaded', init);

async function init() {
    if (!gridSalado || !gridDulce) return;

    try {
        const res = await fetch('/api/comidas'); // Trae los datos de comidas
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        allItems = raw.map(x => ({...x, categoria: String(x.categoria || '').toLowerCase() }));

        render();

        if (chipsContainer) {
            chipsContainer.addEventListener('click', (e) => {
                const btn = e.target.closest('.chip');
                if (!btn) return;

                // quitar clase a todas
                document.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active'));
                // agregar clase a la seleccionada
                btn.classList.add('is-active');

                currentFilter = btn.dataset.filter || 'todos';
                render();
            });
        }

        if (ordenarSelect) {
            ordenarSelect.addEventListener('change', (e) => {
                currentOrder = e.target.value;
                render();
            });
        }

        updateCartBadge();

    } catch (err) {
        console.error(err);
        showError('No pudimos cargar la carta. Probá recargar la página.');
    }
}

function filterItems(arr, filter) {
    if (filter === 'todos') return [...arr];
    return arr.filter(x => x.categoria === filter);
}

function sortItems(arr, orden) {
    const items = [...arr];

    switch (orden) {
        case 'precio_asc':
            items.sort((a, b) => {
                const precioA = (a && a.precio != null) ? a.precio : 0;
                const precioB = (b && b.precio != null) ? b.precio : 0;
                return precioA - precioB;
            });
            break;

        case 'precio_desc':
            items.sort((a, b) => {
                const precioA = (a && a.precio != null) ? a.precio : 0;
                const precioB = (b && b.precio != null) ? b.precio : 0;
                return precioB - precioA;
            });
            break;

        default:
            break;
    }

    return items;
}

function render() {
    let items = sortItems(filterItems(allItems, currentFilter), currentOrder);

    const salados = items.filter(x => x.categoria === 'salado');
    const dulces = items.filter(x => x.categoria === 'dulce');
    const bebidas = items.filter(x => x.categoria === 'bebidas');

    gridSalado.parentElement.style.display = salados.length ? 'block' : 'none';
    gridDulce.parentElement.style.display = dulces.length ? 'block' : 'none';
    if (gridBebidas) gridBebidas.parentElement.style.display = bebidas.length ? 'block' : 'none';

    gridSalado.innerHTML = salados.map(cardHTML).join('');
    gridDulce.innerHTML = dulces.map(cardHTML).join('');
    if (gridBebidas) gridBebidas.innerHTML = bebidas.map(cardHTML).join('');
}

function cardHTML(item) {
    const { _id, nombre, descripcion, categoria, imagen, precio } = item;
    const imgSrc = resolveImgPath(imagen);

    return `
<article class="card-producto"
  data-producto-id="${_id}"
  data-nombre="${nombre}"
  data-categoria="${categoria || ''}"
  data-imagen="${imgSrc}"
  data-precio="${precio || 0}">
  <div class="card-media">
    <img src="${imgSrc}" alt="${nombre}">
  </div>
  <div class="card-body">
    <h3 class="card-title">${nombre}</h3>
    <p class="card-desc">${descripcion || ''}</p>
    <div class="card-meta">
      <span class="precio">$${precio || 0}</span>
    </div>
  </div>
  <div class="card-footer">
    <button class="btn-add" type="button" data-add="${_id}" data-nombre="${nombre}">
      <i class="fa-solid fa-plus"></i> Agregar
    </button>
  </div>
</article>`;
}

// ========= Click en “+” (delegación) =========
/*document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-add]');
    if (!btn) return;

    const productoId = btn.dataset.add;
    const nombre = btn.dataset.nombre;
    const precio = Number(btn.closest('article').dataset.precio || 0);
    const imagen = btn.closest('article').dataset.imagen || '/img/placeholder.png';

    addToCartLocal({ id: productoId, nombre, precio, imagen });
});*/

// ========= Errores =========
function showError(t) {
    [gridSalado, gridDulce, gridBebidas].forEach(g => g && (g.innerHTML = `<div class="error-box">${t}</div>`));
}