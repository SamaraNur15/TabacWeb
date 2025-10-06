// public/src/carrito.js
const getUID = () => {
  try {
    if (typeof window.getUserId === 'function') return window.getUserId();
    let id = localStorage.getItem('userId');
    if (!id) { id = 'anon-1'; localStorage.setItem('userId', id); }
    return id;
  } catch { return 'anon-1'; }
};

const API_BASE = '/api/carrito';

// DOM
const listaCarrito = document.getElementById('lista-carrito');
const subtotalEl   = document.getElementById('subtotal');
const descuentosEl = document.getElementById('descuentos');
const totalEl      = document.getElementById('total');
const btnRetirar   = document.getElementById('btn-retirar');
const btnDelivery  = document.getElementById('btn-delivery');

// ⬇️ usa los IDs de tu HTML
const deliveryEl     = document.getElementById('delivery');       // <span id="delivery">
const deliveryNoteEl = document.getElementById('delivery-note');  // <small id="delivery-note">


// Cliente API
async function apiGetCart() {
  const r = await fetch(`${API_BASE}/${encodeURIComponent(getUID())}`);
  if (!r.ok) throw new Error(`GET cart ${r.status}`);
  return r.json();
}
async function apiUpdateItem(itemId, cantidad) {
  const r = await fetch(`${API_BASE}/${encodeURIComponent(getUID())}/items/${encodeURIComponent(itemId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cantidad: Number(cantidad) })
  });
  if (!r.ok) throw new Error(`PATCH item ${r.status}`);
  return r.json();
}
async function apiRemoveItem(itemId) {
  const r = await fetch(`${API_BASE}/${encodeURIComponent(getUID())}/items/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`DELETE item ${r.status}`);
  return r.json();
}
async function apiSetEntrega(modo) {
  const r = await fetch(`${API_BASE}/${encodeURIComponent(getUID())}/entrega`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modo })
  });
  if (!r.ok) throw new Error(`PATCH entrega ${r.status}`);
  return r.json();
}

// Render
function resolveImg(src){ return (!src || src==='null') ? '/img/placeholder.png' : (src.startsWith('http')||src.startsWith('/')?src:'/img/'+src); }

async function renderCarrito() {
  try {
    const data  = await apiGetCart();
    const items = Array.isArray(data.items) ? data.items : [];

    // Botones de entrega activos
    btnRetirar?.classList.toggle('active',   data.entrega?.modo === 'retiro');
    btnDelivery?.classList.toggle('active',  data.entrega?.modo === 'delivery');

    // Carrito vacío
    if (!items.length) {
      listaCarrito.innerHTML = `
        <div class="carrito-vacio">
          <div class="carrito-vacio__icono">🛒</div>
          <h3 class="carrito-vacio__titulo">Tu carrito está vacío</h3>
          <p class="carrito-vacio__texto">Agregá productos desde la carta para verlos aquí.</p>
          <a class="btn-cta-carta" href="/carta.html">Ir a la carta</a>
          <div class="carrito-vacio__tips">
            <span>Delivery disponible</span>
            <span>Descuentos por combos</span>
            <span>Pagá al recibir</span>
          </div>
        </div>`;
      subtotalEl.textContent   = '$0';
      descuentosEl.textContent = '- $0';
      totalEl.textContent      = '$0';
      if (deliveryEl)     deliveryEl.textContent = '$0';
      if (deliveryNoteEl) deliveryNoteEl.textContent = '';
      return;
    }

    // ========== RENDER ==========
    listaCarrito.innerHTML = items.map(it => `
      <div class="cart-card" data-item="${it._id}">
        <img class="cart-thumb" src="${resolveImg(it.imagen)}" alt="${it.nombre}">
        <div>
          <h3 class="cart-title">${it.nombre}</h3>
          <p class="cart-meta">Precio unitario: $${it.precio}</p>

          <div class="controls">
            <div class="qty">
              <button class="qty-dec" data-dec="${it._id}" aria-label="Quitar uno">−</button>
              <input id="cant-${it._id}" type="number" min="1" value="${it.cantidad}">
              <button class="qty-inc" data-inc="${it._id}" aria-label="Agregar uno">+</button>
            </div>

            <button class="btn-remove" data-remove="${it._id}">Quitar</button>
          </div>
        </div>

        <div class="cart-price">$${it.precio * it.cantidad}</div>
      </div>
    `).join('');

    // ========== LISTENERS CANTIDAD ==========
    // 1) input manual
    items.forEach(it => {
      const $input = document.getElementById(`cant-${it._id}`);
      if ($input) {
        $input.addEventListener('change', async (e) => {
          const val = parseInt(e.target.value, 10);
          if (!Number.isInteger(val) || val <= 0) { e.target.value = it.cantidad; return; }
          try {
            await apiUpdateItem(it._id, val);
            await renderCarrito();
          } catch (err) {
            console.error(err);
            alert('No se pudo actualizar la cantidad');
            e.target.value = it.cantidad;
          }
        });
      }
    });

    // 2) botones + / -
    listaCarrito.querySelectorAll('[data-inc]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id  = btn.getAttribute('data-inc');
        const inp = document.getElementById(`cant-${id}`);
        const val = Math.max(1, parseInt(inp.value || '1', 10) + 1);
        try { await apiUpdateItem(id, val); await renderCarrito(); }
        catch (err) { console.error(err); alert('No se pudo actualizar la cantidad'); }
      });
    });
    listaCarrito.querySelectorAll('[data-dec]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id  = btn.getAttribute('data-dec');
        const inp = document.getElementById(`cant-${id}`);
        const val = Math.max(1, parseInt(inp.value || '1', 10) - 1);
        try { await apiUpdateItem(id, val); await renderCarrito(); }
        catch (err) { console.error(err); alert('No se pudo actualizar la cantidad'); }
      });
    });

    // ========== LISTENER QUITAR ==========
    listaCarrito.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try { await apiRemoveItem(btn.getAttribute('data-remove')); await renderCarrito(); }
        catch (err) { console.error(err); alert('No se pudo quitar el producto'); }
      });
    });

    // ========== TOTALES ==========
    const sub   = data.totales?.subtotal   ?? items.reduce((a, it) => a + it.precio * it.cantidad, 0);
    const desc  = data.totales?.descuentos ?? 0;
    const deliv = data.totales?.delivery   ?? 0;
    const tot   = data.totales?.total      ?? (sub - desc + deliv);

    subtotalEl.textContent   = `$${sub}`;
    descuentosEl.textContent = `- $${desc}`;
    totalEl.textContent      = `$${tot}`;

    if (deliveryEl)     deliveryEl.textContent = deliv ? `+ $${deliv}` : '$0';
    if (deliveryNoteEl) {
      const base  = sub - desc;
      const min   = data.totales?.meta?.deliveryMinFree ?? 0;
      const falta = Math.max(0, min - base);
      deliveryNoteEl.textContent = (data.entrega?.modo === 'delivery')
        ? (deliv ? (falta > 0 ? `(te faltan $${falta} para envío gratis)` : '') : '(¡gratis!)')
        : '';
    }
  } catch (err) {
    console.error(err);
    listaCarrito.innerHTML = `<div class="error-box">No pudimos cargar tu carrito.</div>`;
    subtotalEl.textContent   = '$0';
    descuentosEl.textContent = '- $0';
    totalEl.textContent      = '$0';
    if (deliveryEl)     deliveryEl.textContent = '$0';
    if (deliveryNoteEl) deliveryNoteEl.textContent = '';
  }
}


// eventos entrega
btnRetirar?.addEventListener('click', async ()=>{ try{ await apiSetEntrega('retiro'); await renderCarrito(); }catch{} });
btnDelivery?.addEventListener('click', async ()=>{ try{ await apiSetEntrega('delivery'); await renderCarrito(); }catch{} });

// init
document.addEventListener('DOMContentLoaded', renderCarrito);
