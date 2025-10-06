// checkout.js
const getUID = () => (window.getUserId ? window.getUserId() : (localStorage.userId || 'anon-1'));

let lastPreview = null;

async function loadPreview(){
  const r = await fetch(`/api/pagos/checkout/${encodeURIComponent(getUID())}/preview`);
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Preview ${r.status}: ${t}`);
  }
  const data = await r.json();
  lastPreview = data.preview; // {hash, ts}

  // Render
  document.getElementById('modo').textContent =
    `Modo de entrega: ${data.entrega?.modo === 'delivery' ? 'Delivery' : 'Retiro en local'}`;

  const lista = document.getElementById('lista');
  lista.innerHTML = data.items.map(it => `
    <div class="row">
      <div>${it.nombre} × ${it.cantidad}</div>
      <div>$${it.precio * it.cantidad}</div>
    </div>
  `).join('');

  const sub   = data.totales?.subtotal ?? 0;
  const desc  = data.totales?.descuentos ?? 0;
  const envio = data.totales?.delivery ?? 0;
  const tot   = data.totales?.total ?? (sub - desc + envio);

  document.getElementById('sub').textContent   = `$${sub}`;
  document.getElementById('desc').textContent  = `- $${desc}`;
  document.getElementById('envio').textContent = envio ? `+ $${envio}` : '$0';
  document.getElementById('total').textContent = `$${tot}`;

  // Nota envío gratis
  const base = sub - desc;
  const minFree = data.totales?.meta?.deliveryMinFree ?? 0;
  const falta = Math.max(0, minFree - base);
  const envioNote = document.getElementById('envio-note');
  if (data.entrega?.modo === 'delivery') {
    if (!envio && minFree) envioNote.textContent = ' (¡gratis!)';
    else if (falta > 0)    envioNote.textContent = ` (te faltan $${falta} para envío gratis)`;
    else envioNote.textContent = '';
  } else envioNote.textContent = '';

  // Mostrar inputs de dirección si es delivery
  document.getElementById('datos-delivery').style.display =
    data.entrega?.modo === 'delivery' ? 'grid' : 'none';

  // Aviso de expiración
  const exp = data.preview?.expiresAt ? new Date(data.preview.expiresAt) : null;
  document.getElementById('aviso').textContent =
    exp ? `Estos totales se mantienen hasta ${exp.toLocaleTimeString()}.`
        : '';
}

async function confirmarYPagar(){
  // Si el carrito cambió o pasó el TTL, el backend nos devolverá 409 y un preview nuevo.
  const body = {
    metodo: 'simulado',
    direccion: document.getElementById('direccion')?.value || null,
    notas: document.getElementById('notas')?.value || null,
    preview: lastPreview // {hash, ts}
  };

  // Validación simple: si es delivery, pedir dirección
  const modo = document.getElementById('modo').textContent;
  if (modo.includes('Delivery') && !body.direccion) {
    alert('Ingresá una dirección de entrega.');
    return;
  }

  // 1) Checkout -> crea orden
  let r = await fetch(`/api/pagos/checkout/${encodeURIComponent(getUID())}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (r.status === 409) {
    // preview expirada o carrito cambiado: refrescar y mostrar
    const fresh = await r.json();
    alert(fresh.error || 'Debés reconfirmar los totales.');
    // Re-render con el preview nuevo
    lastPreview = fresh.preview;
    // sobreescribimos DOM con fresh
    // (más simple: recargar la página)
    location.reload();
    return;
  }

  if (!r.ok) {
    const txt = await r.text();
    alert(`No se pudo crear la orden: ${r.status}\n${txt}`);
    return;
  }

  const orden = await r.json(); // tiene _id
  // 2) Pagar (simulado)
  r = await fetch(`/api/pagos/${orden._id}/pagar`, { method: 'POST', headers: { 'Idempotency-Key': `pay-${orden._id}` } });
  if (!r.ok) {
    const txt = await r.text();
    alert(`No se pudo pagar: ${r.status}\n${txt}`);
    return;
  }
  // 3) Redirigir a "gracias"
  window.location.href = `/gracias.html?ordenId=${encodeURIComponent(orden._id)}`;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('volver')?.addEventListener('click', () => {
    window.location.href = '/carrito.html';
  });
  document.getElementById('confirmar')?.addEventListener('click', confirmarYPagar);
  loadPreview().catch(err => {
    console.error(err);
    alert('No pude cargar el checkout. Volvé al carrito.');
    window.location.href = '/carrito.html';
  });
});
