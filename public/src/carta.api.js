// ========= Config / utils =========
console.log('[carta.api.js] cargado');
const API_COMIDAS = '/api/comidas';

// Debe existir <script src="/user-id.js"></script> en el HTML
const getUID = () => {
  const fn = window.getUserId;
  if (typeof fn === 'function') return fn();   // usa la de user-id.js
  // fallback por si no cargó user-id.js
  let saved = localStorage.getItem('userId');
  if (saved) return saved;
  const nuevo = 'anon-1';
  localStorage.setItem('userId', nuevo);
  return nuevo;
};
function resolveImgPath(src) {
  const s = String(src || '').trim();
  if (!s) return '/img/placeholder.png';
  if (s.startsWith('http') || s.startsWith('/')) return s;
  return '/img/' + s;
}
function formato(n){ return n == null ? '-' : Number(n).toLocaleString('es-AR'); }
function capitalize(s){ return String(s||'').charAt(0).toUpperCase() + String(s||'').slice(1); }
function escapeHTML(s=''){ return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function escapeAttr(s=''){ return escapeHTML(s).replace(/"/g, '&quot;'); }
function mostrarToast(txt){
  let t = document.getElementById('toast-cart');
  if(!t){
    t = document.createElement('div');
    t.id = 'toast-cart';
    t.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#2fbf71;color:#fff;padding:10px 16px;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.2);z-index:9999;font-weight:600;transition:.2s';
    document.body.appendChild(t);
  }
  t.textContent = txt;
  t.style.opacity = '1';
  setTimeout(()=>{ t.style.opacity = '0'; }, 1200);
}

// ========= API carrito =========
async function getCartFromServer() {
  const r = await fetch(`/api/carrito/${encodeURIComponent(getUID())}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function addToCart(productoId, cantidad = 1) {
  const r = await fetch(`/api/carrito/${encodeURIComponent(getUID())}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productoId, cantidad })
  });
  if (!r.ok) {
    const txt = await r.text().catch(()=> '');
    throw new Error(`POST carrito ${r.status}: ${txt}`);
  }
  const cart = await r.json();
  updateCartBadge(cart);
  return cart;
}

function updateCartBadge(cartData) {
  const badge = document.querySelector('[data-cart-badge]');
  if (!badge) return;
  const items = Array.isArray(cartData?.items) ? cartData.items : [];
  const totalCant = items.reduce((acc, it) => acc + (it.cantidad || 0), 0);
  badge.textContent = totalCant > 0 ? String(totalCant) : '';
}

// ========= Render carta =========
const gridSalado  = document.getElementById('grid-salado');
const gridDulce   = document.getElementById('grid-dulce');
const gridBebidas = document.getElementById('grid-bebidas');
const chipsContainer = document.querySelector('.chips');
const ordenarSelect  = document.getElementById('ordenar');

let allItems = [];
let currentFilter = 'todos';
let currentOrder  = 'recomendados';

document.addEventListener('DOMContentLoaded', init);

async function init() {
  if (!gridSalado || !gridDulce) return;

  try {
    const res = await fetch(API_COMIDAS);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();
    allItems = raw.map(x => ({ ...x, categoria: String(x.categoria || '').toLowerCase() }));

    render();

    chipsContainer?.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('is-active'));
      btn.classList.add('is-active');
      currentFilter = btn.dataset.filter || 'todos';
      render();
    });

    ordenarSelect?.addEventListener('change', (e) => {
      currentOrder = e.target.value;
      render();
    });

    try { updateCartBadge(await getCartFromServer()); } catch {}

  } catch (err) {
    console.error(err);
    showError('No pudimos cargar la carta. Probá recargar la página.');
  }
}

function filterItems(arr, filter) {
  if (filter === 'todos') return [...arr];
  if (['salado','dulce','bebidas'].includes(filter))  return arr.filter(x => x.categoria === filter);
  if (filter === 'vegetariano') return arr.filter(x => !!x.apto_vegetariano);
  if (filter === 'picante')     return arr.filter(x => !!x.picante);
  return [...arr];
}
function sortItems(arr, orden) {
  const items = [...arr];
  switch (orden) {
    case 'precio_asc':   items.sort((a,b) => (a.precio ?? 0) - (b.precio ?? 0)); break;
    case 'precio_desc':  items.sort((a,b) => (b.precio ?? 0) - (a.precio ?? 0)); break;
    case 'calificacion': items.sort((a,b) => (b.calificacion ?? 0) - (a.calificacion ?? 0)); break;
    case 'tiempo':       items.sort((a,b) => (a.tiempo_preparacion_min ?? 0) - (b.tiempo_preparacion_min ?? 0)); break;
    default:             items.sort((a,b) => score(b) - score(a));
  }
  return items;
}
function score(x){
  const calif = Number(x.calificacion ?? 0);
  const stock = Number(x.stock ?? 0);
  const fresh = x.fecha_actualizacion ? (new Date(x.fecha_actualizacion)).getTime() : 0;
  return calif*10 + Math.min(stock, 50) + fresh/1e12;
}

function render() {
  let items = sortItems(filterItems(allItems, currentFilter), currentOrder);

  const salados = items.filter(x => x.categoria === 'salado');
  const dulces  = items.filter(x => x.categoria === 'dulce');
  const bebidas = items.filter(x => x.categoria === 'bebidas');

  gridSalado.parentElement.style.display = salados.length ? 'block' : 'none';
  gridDulce.parentElement.style.display  = dulces.length  ? 'block' : 'none';
  if (gridBebidas) gridBebidas.parentElement.style.display = bebidas.length ? 'block' : 'none';

  gridSalado.innerHTML = salados.map(cardHTML).join('');
  gridDulce.innerHTML  = dulces.map(cardHTML).join('');
  if (gridBebidas) gridBebidas.innerHTML = bebidas.map(cardHTML).join('');
}

// ⬇️ plantilla SIN comentarios dentro de la etiqueta, y con data-add
function cardHTML(item) {
  const {
    _id, nombre, descripcion, categoria,
    imagen, precio, moneda='ARS', precio_anterior,
    porcentaje_descuento, apto_vegetariano, picante,
    tiempo_preparacion_min, calificacion, cantidad_resenas,
    entrega
  } = item;

  const imgSrc = resolveImgPath(imagen);
  const hasDesc = Number(porcentaje_descuento) > 0 && Number(precio_anterior) > Number(precio || 0);

  return `
<article class="card-producto"
  data-producto-id="${_id}"
  data-nombre="${escapeAttr(nombre)}"
  data-categoria="${escapeAttr(categoria || '')}"
  data-imagen="${escapeAttr(imgSrc)}"
  data-precio="${Number(precio ?? 0)}"
  data-descripcion="${escapeAttr(descripcion || '')}">
  <div class="card-media">
    <img src="${imgSrc}" alt="${escapeAttr(nombre)}">
    <div class="badges-top">
      ${apto_vegetariano ? '<span class="badge badge-veg" title="Apto vegetariano">🌱</span>' : ''}
      ${picante ? '<span class="badge badge-spicy" title="Picante">🌶</span>' : ''}
      ${hasDesc ? `<span class="badge badge-desc">-${porcentaje_descuento}%</span>` : ''}
    </div>
  </div>

  <div class="card-body">
    <h3 class="card-title">${escapeHTML(nombre)}</h3>
    <p class="card-desc">${escapeHTML(descripcion || '')}</p>
    <div class="card-meta">
      <div class="precio-wrap">
        <span class="precio">$${formato(precio)} <small>${moneda}</small></span>
        ${hasDesc ? `<span class="precio-anterior">$${formato(precio_anterior)}</span>` : ''}
      </div>
      <div class="rating">
        ${calificacion ? `★ ${Number(calificacion).toFixed(1)} <span class="reviews">(${cantidad_resenas || 0})</span>` : ''}
      </div>
    </div>
    <div class="tags">
      ${categoria ? `<span class="tag">${capitalize(categoria)}</span>` : ''}
      ${apto_vegetariano ? `<span class="tag">Veggie</span>` : ''}
      ${picante ? `<span class="tag">Picante</span>` : ''}
    </div>
  </div>

  <div class="card-footer">
    <div class="disponibilidad">
      ${entrega?.retiro_en_local ? `<i class="fa-solid fa-store"></i> Retiro` : ''}
      ${entrega?.envio_a_domicilio ? ` <i class="fa-solid fa-motorcycle"></i> Delivery` : ''}
      <span class="dot-sep"></span>
      <i class="fa-regular fa-clock"></i> ${tiempo_preparacion_min || 0} min
    </div>
    <button class="btn-add" type="button" data-add="${_id}" data-nombre="${escapeAttr(nombre)}">
      <i class="fa-solid fa-plus"></i> Agregar
    </button>
  </div>
</article>`;
}

// ========= Click en “+” (delegación) =========
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-add]');
  if (!btn) return;
  const productoId = btn.getAttribute('data-add'); // debe ser el ObjectId de Mongo
  try {
    await addToCart(productoId, 1);
    mostrarToast(`${btn.dataset.nombre || 'Producto'} agregado al carrito`);
    console.log('[carrito] +1', btn.dataset.nombre || productoId);
  } catch (err) {
    console.error('No se pudo agregar al carrito', err);
    alert('No se pudo agregar al carrito');
  }
});

// ========= Errores =========
function showError(t){
  [gridSalado, gridDulce, gridBebidas].forEach(g => g && (g.innerHTML = `<div class="error-box">${escapeHTML(t)}</div>`));
}
