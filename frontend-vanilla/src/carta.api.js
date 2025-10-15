const CART_KEY = 'carrito';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(item) {
  const cart = getCart();
  const idx = cart.findIndex(p =>
    (p.id && item.id && p.id === item.id) || p.nombre === item.nombre
  );
  if (idx >= 0) {
    cart[idx].cantidad += item.cantidad;
  } else {
    cart.push(item);
  }
  saveCart(cart);
}

function resolveImgPath(src) {
  const s = String(src || '').trim();
  if (!s) return '/img/placeholder.png';
  if (s.startsWith('http') || s.startsWith('/')) return s;
  return '/img/' + s;
}

function attachAddHandlers() {
  document.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = e.currentTarget.closest('.card-producto');
      if (!card) return;

      const item = {
        id: card.dataset.id || card.dataset.codigo || card.dataset.nombre,
        nombre: card.dataset.nombre || 'Producto',
        precio: Number(card.dataset.precio || 0),
        imagen: resolveImgPath(card.dataset.imagen),
        descripcion: card.dataset.descripcion || '',
        cantidad: 1
      };

      addToCart(item);
      mostrarToast(`${item.nombre} agregado al carrito`);
    });
  });
}

// public/src/carta.api.js
console.log('[carta.api.js] cargado');

const API_BASE = '/api/comidas';

const gridSalado = document.getElementById('grid-salado');
const gridDulce  = document.getElementById('grid-dulce');
const gridBebidas = document.getElementById('grid-bebidas');
const chipsContainer = document.querySelector('.chips');
const ordenarSelect  = document.getElementById('ordenar');

let allItems = [];
let currentFilter = 'todos';
let currentOrder  = 'recomendados';

document.addEventListener('DOMContentLoaded', init);

async function init() {
  // si abriste otra página por error, no hagas nada
  
  if (!gridSalado || !gridDulce || !gridBebidas) return;

  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allItems = await res.json();

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
  } catch (err) {
    console.error(err);
    showError('No pudimos cargar la carta. Probá recargar la página.');
  }
}

function render() {
    let items = filterItems(allItems, currentFilter);
    items = sortItems(items, currentOrder);

    const salados = items.filter(x => x.categoria === 'salado');
    const dulces  = items.filter(x => x.categoria === 'dulce');
    const bebidas = items.filter(x => x.categoria === 'bebidas');

    // Salado
    if (salados.length > 0) {
        gridSalado.parentElement.style.display = 'block';
        gridSalado.innerHTML = salados.map(cardHTML).join('');
    } else {
        gridSalado.parentElement.style.display = 'none';
    }

    // Dulce
    if (dulces.length > 0) {
        gridDulce.parentElement.style.display = 'block';
        gridDulce.innerHTML = dulces.map(cardHTML).join('');
    } else {
        gridDulce.parentElement.style.display = 'none';
    }

    // Bebidas (si agregaste #grid-bebidas en tu HTML)
    if (gridBebidas) {
        if (bebidas.length > 0) {
        gridBebidas.parentElement.style.display = 'block';
        gridBebidas.innerHTML = bebidas.map(cardHTML).join('');
        } else {
        gridBebidas.parentElement.style.display = 'none';
        }
    }

    attachAddHandlers();
}

function filterItems(arr, filter) {
 if (filter === 'todos') return [...arr];
  if (['salado','dulce','bebidas'].includes(filter)) {
    return arr.filter(x => x.categoria === filter);
  }
  if (filter === 'vegetariano') return arr.filter(x => !!x.apto_vegetariano);
  if (filter === 'picante')     return arr.filter(x => !!x.picante);
  return [...arr];
}

function sortItems(arr, orden) {
  const items = [...arr];
  switch (orden) {
    case 'precio_asc':  items.sort((a,b) => (a.precio ?? 0) - (b.precio ?? 0)); break;
    case 'precio_desc': items.sort((a,b) => (b.precio ?? 0) - (a.precio ?? 0)); break;
    case 'calificacion': items.sort((a,b) => (b.calificacion ?? 0) - (a.calificacion ?? 0)); break;
    case 'tiempo':       items.sort((a,b) => (a.tiempo_preparacion_min ?? 0) - (b.tiempo_preparacion_min ?? 0)); break;
    default: // recomendados
      items.sort((a,b) => score(b) - score(a));
  }
  return items;
}
function score(x){
  const calif = Number(x.calificacion ?? 0);
  const stock = Number(x.stock ?? 0);
  const fresh = x.fecha_actualizacion ? (new Date(x.fecha_actualizacion)).getTime() : 0;
  return calif*10 + Math.min(stock, 50) + fresh/1e12;
}

function cardHTML(item) {
  const {
    id, codigo, nombre, descripcion, categoria,
    imagen, precio, moneda='ARS', precio_anterior,
    porcentaje_descuento, apto_vegetariano, picante,
    tiempo_preparacion_min, calificacion, cantidad_resenas,
    entrega
  } = item;

  const imgSrc = imagen || '/img/placeholder.png';
  const hasDesc = Number(porcentaje_descuento) > 0 && Number(precio_anterior) > Number(precio || 0);

  return `
<article class="card-producto"
  data-id="${id ?? ''}"
  data-codigo="${codigo ?? ''}"
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
      <i class="fa-regular fa-clock"></i> ${tiempo_preparacion_min || 0}'
    </div>
    <button class="btn-add" type="button">
      <i class="fa-solid fa-plus"></i> Agregar
    </button>
  </div>
</article>`;
}



function attachAddHandlers() {
  document.querySelectorAll('.btn-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // evita que se dispare el click de la card (modal)
      const card = e.currentTarget.closest('.card-producto');
      if (!card) return;

        const item = {
            id: card.dataset.id || card.dataset.codigo || card.dataset.nombre,
            nombre: card.dataset.nombre || 'Producto',
            precio: Number(card.dataset.precio || 0),
            imagen: resolveImgPath(card.dataset.imagen),
            descripcion: card.dataset.descripcion || '',
            cantidad: 1
        };

      addToCart(item);
      // feedback opcional:
      console.log(`[carrito] +1 ${item.nombre}`);
      mostrarToast(`${item.nombre} agregado al carrito`);
      // si querés redirigir al carrito, descomentá:
      // window.location.href = 'carrito.html';
    });
  });
}

// mini toast opcional
function mostrarToast(txt){
  let t = document.getElementById('toast-cart');
  if(!t){
    t = document.createElement('div');
    t.id = 'toast-cart';
    t.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);background:#2fbf71;color:#fff;padding:10px 16px;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.2);z-index:9999;font-weight:600';
    document.body.appendChild(t);
  }
  t.textContent = txt;
  t.style.opacity = '1';
  setTimeout(()=>{ t.style.opacity = '0'; }, 1200);
}



function vacioHTML(){ return `<p class="grid-empty">No hay productos para esta selección.</p>`; }
function formato(n){ return n == null ? '-' : Number(n).toLocaleString('es-AR'); }
function capitalize(s){ return String(s||'').charAt(0).toUpperCase() + String(s||'').slice(1); }
function escapeHTML(s=''){ return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function escapeAttr(s=''){ return escapeHTML(s).replace(/"/g, '&quot;'); }
function showError(t){
  [gridSalado, gridDulce, gridBebidas].forEach(g => g && (g.innerHTML = `<div class="error-box">${escapeHTML(t)}</div>`));
}
const cartBtn = document.getElementById('btn-ir-carrito');
const badgeId = 'cart-badge';

function updateCartBadge(){
  const cart = getCart();
  const total = cart.reduce((a,p)=>a + (p.cantidad||0), 0);
  let b = document.getElementById(badgeId);
  if (!b){
    b = document.createElement('span');
    b.id = badgeId;
    b.style.cssText = 'position:absolute;top:-6px;right:-6px;background:#e53935;color:#fff;font-size:12px;min-width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 6px;';
    cartBtn.style.position = 'relative';
    cartBtn.appendChild(b);
  }
  b.textContent = total;
  b.style.display = total > 0 ? 'flex' : 'none';
}

// actualizar cada vez que renderizamos y al cargar
document.addEventListener('DOMContentLoaded', updateCartBadge);

