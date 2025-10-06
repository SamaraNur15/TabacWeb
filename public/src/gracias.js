(async () => {
  const id = new URLSearchParams(location.search).get('ordenId');
  if (!id) { alert('Falta ordenId'); return; }
  const r = await fetch(`/api/pagos/${encodeURIComponent(id)}/resumen`);
  if (!r.ok) { alert('No pude cargar el resumen'); return; }
  const d = await r.json();

  document.getElementById('title').textContent = `¡Gracias por tu compra! • ${d.numero}`;
  document.getElementById('info').textContent =
    `Estado: ${d.estado}${d.pagadaEn ? ' • Pagada el ' + new Date(d.pagadaEn).toLocaleString() : ''}`;

  const lista = document.getElementById('lista');
  lista.innerHTML = d.items.map(it => `
    <div class="row"><div>${it.nombre} × ${it.cantidad}</div><div>$${it.importe}</div></div>
  `).join('');

  document.getElementById('sub').textContent   = `$${d.totales.subtotal}`;
  document.getElementById('desc').textContent  = `- $${d.totales.descuentos}`;
  document.getElementById('envio').textContent = d.totales.delivery ? `+ $${d.totales.delivery}` : '$0';
  document.getElementById('total').textContent = `$${d.totales.total}`;
})();
