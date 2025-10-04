// public/src/carrito.js
// --- user id compartido (no re-declarar getUserId para evitar loops)
const getUID = () => {
  const fn = window.getUserId;
  if (typeof fn === 'function') return fn();
  let saved = localStorage.getItem('userId');
  if (saved) return saved;
  const nuevo = 'anon-1';
  localStorage.setItem('userId', nuevo);
  return nuevo;
};

const API_BASE = '/api/carrito';

// ---- DOM ----
const listaCarrito = document.getElementById('lista-carrito');
const subtotalEl   = document.getElementById('subtotal');
const descuentosEl = document.getElementById('descuentos');
const totalEl      = document.getElementById('total');
const btnRetirar   = document.getElementById('btn-retirar');
const btnDelivery  = document.getElementById('btn-delivery');
const deliveryEl     = document.getElementById('delivery');
const deliveryNoteEl = document.getElementById('delivery-note');

// ---- Cliente API ----
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

// ---- Render ----
function resolveImg(src) {
  if (!src) return '/img/placeholder.png';
  if (src.startsWith('http') || src.startsWith('/')) return src;
  return '/img/' + src;
}

async function renderCarrito() {
  try {
    const data = await apiGetCart();
    const items = Array.isArray(data.items) ? data.items : [];

    // Modo de entrega
    if (btnRetirar && btnDelivery) {
      btnRetirar.classList.toggle('active', data.entrega?.modo === 'retiro');
      btnDelivery.classList.toggle('active', data.entrega?.modo === 'delivery');
    }

    if (!items.length) {
      listaCarrito.innerHTML = `
        <div class="carrito-vacio">Tu carrito está vacío.</div>
      `;
      subtotalEl.textContent   = '$0';
      descuentosEl.textContent = '- $0';
      totalEl.textContent      = '$0';
      return;
    }

   listaCarrito.innerHTML = items.map(it => `
      <div class="cart-card" data-item="${it._id}">
        <img class="cart-thumb" src="${resolveImg(it.imagen)}" alt="${it.nombre}">
        <div class="cart-info">
          <h3 class="cart-title">${it.nombre}</h3>
          <p class="cart-meta">Precio: $${it.precio}</p>
          <div class="controls">
            <div class="qty">
              <button type="button" data-qty="dec" aria-label="Restar" data-id="${it._id}">−</button>
              <input id="cant-${it._id}" type="number" min="1" value="${it.cantidad}">
              <button type="button" data-qty="inc" aria-label="Sumar" data-id="${it._id}">+</button>
            </div>
            <button class="btn-remove" data-remove="${it._id}">Quitar</button>
          </div>
        </div>
        <div class="cart-price">$${it.precio * it.cantidad}</div>
      </div>
    `).join('');

    // Listeners cantidad
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

    // Listener eliminar
    listaCarrito.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await apiRemoveItem(btn.getAttribute('data-remove'));
          await renderCarrito();
        } catch (err) {
          console.error(err);
          alert('No se pudo quitar el producto');
        }
      });
    });
    // + / − cantidad (delegado sobre la lista)
    listaCarrito.addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-qty]');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      const input = document.getElementById(`cant-${id}`);
      if (!input) return;

      let val = parseInt(input.value, 10) || 1;
      val += btn.dataset.qty === 'inc' ? 1 : -1;
      if (val < 1) return; // si querés, acá podrías borrar el ítem

      input.value = val;
      try {
        await apiUpdateItem(id, val);
        await renderCarrito();
      } catch (err) {
        console.error(err);
        // revertir si falla
        input.value = Math.max(1, val - (btn.dataset.qty === 'inc' ? 1 : -1));
      }
    });


    // Totales
    const subtotal   = data.totales?.subtotal ?? items.reduce((a, it) => a + it.precio * it.cantidad, 0);
    const descuentos = data.totales?.descuentos ?? 0;
    const total      = data.totales?.total ?? (subtotal - descuentos);

    subtotalEl.textContent   = `$${subtotal}`;
    descuentosEl.textContent = `- $${descuentos}`;
    totalEl.textContent      = `$${total}`;
    // === Envío visible + "te faltan $X para envío gratis" ===
    if (deliveryEl) {
      const modo = data.entrega?.modo || 'retiro';
      const meta = data.totales?.meta || {};
      const base = subtotal - descuentos;                 // antes de sumar delivery
      const falta = Math.max(0, (meta.deliveryMinFree ?? 0) - base);

      if (modo === 'delivery') {
        const envio = Number(data.totales?.delivery || 0);
        deliveryEl.textContent = envio > 0 ? `+ $${envio}` : '$0';

        if (deliveryNoteEl) {
          if (envio === 0 && (meta.deliveryMinFree ?? 0) > 0) {
            deliveryNoteEl.textContent = ' (¡envío gratis!)';
          } else if (falta > 0) {
            deliveryNoteEl.textContent = ` (te faltan $${falta} para envío gratis)`;
          } else {
            deliveryNoteEl.textContent = ' (envío a domicilio)';
          }
        }
      } else {
        deliveryEl.textContent = '$0';
        if (deliveryNoteEl) deliveryNoteEl.textContent = ' (retiro en local)';
      }

      // (Opcional) Actualizar etiqueta del botón "Delivery"
      if (btnDelivery) {
        if (modo === 'delivery') {
          btnDelivery.innerText = (falta > 0 && (meta.deliveryFee ?? 0) > 0)
            ? `Delivery +$${meta.deliveryFee}`
            : 'Delivery (gratis)';
        } else {
          btnDelivery.innerText = 'Delivery';
        }
      }
    }

  } catch (err) {
    console.error(err);
    listaCarrito.innerHTML = `<div class="error-box">No pudimos cargar tu carrito. Reintentá en unos segundos.</div>`;
    subtotalEl.textContent   = '$0';
    descuentosEl.textContent = '- $0';
    totalEl.textContent      = '$0';
  }
}

// ---- Botones modo de entrega ----
btnRetirar?.addEventListener('click', async () => {
  try { await apiSetEntrega('retiro'); await renderCarrito(); } catch (e) { console.error(e); }
});
btnDelivery?.addEventListener('click', async () => {
  try { await apiSetEntrega('delivery'); await renderCarrito(); } catch (e) { console.error(e); }
});

// ---- Init ----
document.addEventListener('DOMContentLoaded', renderCarrito);
